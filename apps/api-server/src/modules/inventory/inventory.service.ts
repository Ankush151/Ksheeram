import mongoose, { ClientSession } from 'mongoose';
import {
  InventoryBalanceDto,
  PackageSize,
  PackagingType,
  StockMovementDto,
  StockMovementType,
} from '@ksheeraam/contracts';
import {
  IInventoryBalance,
  IInventoryMovement,
  InventoryBalanceModel,
  InventoryMovementModel,
} from '../../models/Inventory';
import { ProductModel } from '../../models/Product';
import { AppError, NotFoundError } from '../../utils/errors';

export function mapInventoryBalanceToDto(b: IInventoryBalance): InventoryBalanceDto {
  return {
    id: b._id.toString(),
    productId: b.productId.toString(),
    productName: b.productName,
    size: b.size,
    packagingType: b.packagingType,
    physicalUnits: b.physicalUnits,
    reservedUnits: b.reservedUnits,
    availableUnits: Math.max(0, b.physicalUnits - b.reservedUnits),
    damagedUnits: b.damagedUnits,
    reorderLevel: b.reorderLevel,
    lastUpdated: b.lastUpdated ? b.lastUpdated.toISOString() : new Date().toISOString(),
  };
}

export function mapMovementToDto(m: IInventoryMovement): StockMovementDto {
  return {
    id: m._id.toString(),
    inventoryId: m.inventoryId.toString(),
    productId: m.productId.toString(),
    productName: m.productName,
    size: m.size,
    packagingType: m.packagingType,
    movementType: m.movementType,
    deltaUnits: m.deltaUnits,
    balanceAfter: m.balanceAfter,
    referenceType: m.referenceType,
    referenceId: m.referenceId,
    reason: m.reason,
    performedBy: m.performedBy,
    timestamp: m.timestamp.toISOString(),
  };
}

export class InventoryService {
  async listBalances(): Promise<InventoryBalanceDto[]> {
    const balances = await InventoryBalanceModel.find().sort({ productName: 1, size: 1 });
    return balances.map(mapInventoryBalanceToDto);
  }

  async listMovements(limit = 50): Promise<StockMovementDto[]> {
    const movements = await InventoryMovementModel.find().sort({ timestamp: -1 }).limit(limit);
    return movements.map(mapMovementToDto);
  }

  async getOrCreateBalance(
    productId: string,
    size: PackageSize,
    packagingType: PackagingType = PackagingType.GLASS_BOTTLE,
    session?: ClientSession | null
  ): Promise<IInventoryBalance> {
    let balance = await InventoryBalanceModel.findOne(
      { productId: new mongoose.Types.ObjectId(productId), size, packagingType },
      null,
      session ? { session } : {}
    );

    if (!balance) {
      const product = await ProductModel.findById(productId);
      const productName = product ? product.name : 'Milk Product';

      const createdDocs = await InventoryBalanceModel.create(
        [
          {
            productId: new mongoose.Types.ObjectId(productId),
            productName,
            size,
            packagingType,
            physicalUnits: 0,
            reservedUnits: 0,
            damagedUnits: 0,
            reorderLevel: 25,
            lastUpdated: new Date(),
          },
        ],
        session ? { session } : {}
      );
      balance = createdDocs[0];
    }

    return balance!;
  }

  /**
   * Concurrency-safe stock reservation using atomic updates.
   * If stock is insufficient, throws AppError and rolls back any partial reservations.
   */
  async reserveStock(
    items: {
      productId: string;
      size: PackageSize;
      packagingType?: PackagingType;
      quantity: number;
    }[],
    referenceId: string,
    performedBy = 'SYSTEM',
    session?: ClientSession | null
  ): Promise<void> {
    const successfullyReserved: {
      balanceId: mongoose.Types.ObjectId;
      quantity: number;
      productId: string;
      size: PackageSize;
      packagingType: PackagingType;
    }[] = [];

    for (const item of items) {
      const pkgType = item.packagingType || PackagingType.GLASS_BOTTLE;
      const balance = await this.getOrCreateBalance(item.productId, item.size, pkgType, session);

      // Atomic conditional update: only increment reservedUnits if available >= quantity
      // Available = physicalUnits - reservedUnits
      const updated = await InventoryBalanceModel.findOneAndUpdate(
        {
          _id: balance._id,
          $expr: {
            $gte: [{ $subtract: ['$physicalUnits', '$reservedUnits'] }, item.quantity],
          },
        },
        {
          $inc: { reservedUnits: item.quantity },
          $set: { lastUpdated: new Date() },
        },
        { new: true, session: session || undefined }
      );

      if (!updated) {
        // Rollback already reserved items in this operation
        for (const reserved of successfullyReserved) {
          await InventoryBalanceModel.findByIdAndUpdate(
            reserved.balanceId,
            { $inc: { reservedUnits: -reserved.quantity } },
            session ? { session } : {}
          );
        }

        const available = Math.max(0, balance.physicalUnits - balance.reservedUnits);
        throw new AppError(
          `Insufficient inventory for ${balance.productName} (${item.size}). Requested: ${item.quantity}, Available: ${available}`,
          409,
          'INSUFFICIENT_STOCK'
        );
      }

      successfullyReserved.push({
        balanceId: balance._id as mongoose.Types.ObjectId,
        quantity: item.quantity,
        productId: item.productId,
        size: item.size,
        packagingType: pkgType,
      });

      // Record movement
      await InventoryMovementModel.create(
        [
          {
            inventoryId: balance._id,
            productId: balance.productId,
            productName: balance.productName,
            size: item.size,
            packagingType: pkgType,
            movementType: StockMovementType.ORDER_RESERVATION,
            deltaUnits: -item.quantity,
            balanceAfter: Math.max(0, updated.physicalUnits - updated.reservedUnits),
            referenceType: 'Order',
            referenceId,
            reason: `Reserved ${item.quantity} units for order allocation`,
            performedBy,
            timestamp: new Date(),
          },
        ],
        session ? { session } : {}
      );
    }
  }

  /**
   * Release reserved stock on order cancellation.
   */
  async releaseReservation(
    items: {
      productId: string;
      size: PackageSize;
      packagingType?: PackagingType;
      quantity: number;
    }[],
    referenceId: string,
    reason = 'Order cancelled',
    performedBy = 'SYSTEM',
    session?: ClientSession | null
  ): Promise<void> {
    for (const item of items) {
      const pkgType = item.packagingType || PackagingType.GLASS_BOTTLE;
      const balance = await this.getOrCreateBalance(item.productId, item.size, pkgType, session);

      const updated = await InventoryBalanceModel.findByIdAndUpdate(
        balance._id,
        {
          $inc: { reservedUnits: -Math.min(balance.reservedUnits, item.quantity) },
          $set: { lastUpdated: new Date() },
        },
        { new: true, session: session || undefined }
      );

      if (updated) {
        await InventoryMovementModel.create(
          [
            {
              inventoryId: balance._id,
              productId: balance.productId,
              productName: balance.productName,
              size: item.size,
              packagingType: pkgType,
              movementType: StockMovementType.AUDIT_ADJUSTMENT,
              deltaUnits: item.quantity,
              balanceAfter: Math.max(0, updated.physicalUnits - updated.reservedUnits),
              referenceType: 'Order',
              referenceId,
              reason: `Released reservation: ${reason}`,
              performedBy,
              timestamp: new Date(),
            },
          ],
          session ? { session } : {}
        );
      }
    }
  }

  /**
   * Fulfill reservation when orders are dispatched or delivered.
   * Decrements physicalUnits and reservedUnits atomically.
   */
  async fulfillReservation(
    items: {
      productId: string;
      size: PackageSize;
      packagingType?: PackagingType;
      quantity: number;
    }[],
    referenceId: string,
    performedBy = 'SYSTEM',
    session?: ClientSession | null
  ): Promise<void> {
    for (const item of items) {
      const pkgType = item.packagingType || PackagingType.GLASS_BOTTLE;
      const balance = await this.getOrCreateBalance(item.productId, item.size, pkgType, session);

      const updated = await InventoryBalanceModel.findByIdAndUpdate(
        balance._id,
        {
          $inc: {
            physicalUnits: -item.quantity,
            reservedUnits: -item.quantity,
          },
          $set: { lastUpdated: new Date() },
        },
        { new: true, session: session || undefined }
      );

      if (updated) {
        await InventoryMovementModel.create(
          [
            {
              inventoryId: balance._id,
              productId: balance.productId,
              productName: balance.productName,
              size: item.size,
              packagingType: pkgType,
              movementType: StockMovementType.MORNING_DISPATCH,
              deltaUnits: -item.quantity,
              balanceAfter: Math.max(0, updated.physicalUnits - updated.reservedUnits),
              referenceType: 'Order',
              referenceId,
              reason: 'Morning dispatch delivery fulfillment',
              performedBy,
              timestamp: new Date(),
            },
          ],
          session ? { session } : {}
        );
      }
    }
  }

  /**
   * Ingest stock from dock procurement receipts.
   */
  async inwardProcuredStock(
    productId: string,
    size: PackageSize,
    packagingType: PackagingType,
    units: number,
    referenceId: string,
    performedBy: string,
    session?: ClientSession | null
  ): Promise<IInventoryBalance> {
    const balance = await this.getOrCreateBalance(productId, size, packagingType, session);

    const updated = await InventoryBalanceModel.findByIdAndUpdate(
      balance._id,
      {
        $inc: { physicalUnits: units },
        $set: { lastUpdated: new Date() },
      },
      { new: true, session: session || undefined }
    );

    await InventoryMovementModel.create(
      [
        {
          inventoryId: balance._id,
          productId: balance.productId,
          productName: balance.productName,
          size,
          packagingType,
          movementType: StockMovementType.PROCUREMENT_INWARD,
          deltaUnits: units,
          balanceAfter: Math.max(0, updated!.physicalUnits - updated!.reservedUnits),
          referenceType: 'PurchaseOrder',
          referenceId,
          reason: `Procurement dock delivery received: ${units} units`,
          performedBy,
          timestamp: new Date(),
        },
      ],
      session ? { session } : {}
    );

    return updated!;
  }

  /**
   * Manual stock adjustment (add stock, mark damaged, audit adjustment).
   */
  async adjustStock(
    inventoryId: string,
    adjustmentType: 'add_stock' | 'mark_damaged' | 'audit_adjustment',
    units: number,
    reason: string,
    performedBy = 'ADMIN'
  ): Promise<InventoryBalanceDto> {
    const balance = await InventoryBalanceModel.findById(inventoryId);
    if (!balance) throw new NotFoundError('Inventory record not found.');

    let delta = 0;
    let movType = StockMovementType.AUDIT_ADJUSTMENT;

    if (adjustmentType === 'add_stock') {
      balance.physicalUnits += units;
      delta = units;
      movType = StockMovementType.PROCUREMENT_INWARD;
    } else if (adjustmentType === 'mark_damaged') {
      balance.physicalUnits = Math.max(0, balance.physicalUnits - units);
      balance.damagedUnits += units;
      delta = -units;
      movType = StockMovementType.DAMAGE_SPOILAGE;
    } else {
      // audit adjustment sets delta directly
      balance.physicalUnits = Math.max(0, balance.physicalUnits + units);
      delta = units;
      movType = StockMovementType.AUDIT_ADJUSTMENT;
    }

    balance.lastUpdated = new Date();
    await balance.save();

    await InventoryMovementModel.create({
      inventoryId: balance._id,
      productId: balance.productId,
      productName: balance.productName,
      size: balance.size,
      packagingType: balance.packagingType,
      movementType: movType,
      deltaUnits: delta,
      balanceAfter: Math.max(0, balance.physicalUnits - balance.reservedUnits),
      reason,
      performedBy,
      timestamp: new Date(),
    });

    return mapInventoryBalanceToDto(balance);
  }
}

export const inventoryService = new InventoryService();
