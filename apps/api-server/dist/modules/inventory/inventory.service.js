"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryService = exports.InventoryService = void 0;
exports.mapInventoryBalanceToDto = mapInventoryBalanceToDto;
exports.mapMovementToDto = mapMovementToDto;
const mongoose_1 = __importDefault(require("mongoose"));
const contracts_1 = require("@ksheeraam/contracts");
const Inventory_1 = require("../../models/Inventory");
const Product_1 = require("../../models/Product");
const errors_1 = require("../../utils/errors");
function mapInventoryBalanceToDto(b) {
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
function mapMovementToDto(m) {
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
class InventoryService {
    async listBalances() {
        const balances = await Inventory_1.InventoryBalanceModel.find().sort({ productName: 1, size: 1 });
        return balances.map(mapInventoryBalanceToDto);
    }
    async listMovements(limit = 50) {
        const movements = await Inventory_1.InventoryMovementModel.find().sort({ timestamp: -1 }).limit(limit);
        return movements.map(mapMovementToDto);
    }
    async getOrCreateBalance(productId, size, packagingType = contracts_1.PackagingType.GLASS_BOTTLE, session) {
        let balance = await Inventory_1.InventoryBalanceModel.findOne({ productId: new mongoose_1.default.Types.ObjectId(productId), size, packagingType }, null, session ? { session } : {});
        if (!balance) {
            const product = await Product_1.ProductModel.findById(productId);
            const productName = product ? product.name : 'Milk Product';
            const createdDocs = await Inventory_1.InventoryBalanceModel.create([
                {
                    productId: new mongoose_1.default.Types.ObjectId(productId),
                    productName,
                    size,
                    packagingType,
                    physicalUnits: 0,
                    reservedUnits: 0,
                    damagedUnits: 0,
                    reorderLevel: 25,
                    lastUpdated: new Date(),
                },
            ], session ? { session } : {});
            balance = createdDocs[0];
        }
        return balance;
    }
    /**
     * Concurrency-safe stock reservation using atomic updates.
     * If stock is insufficient, throws AppError and rolls back any partial reservations.
     */
    async reserveStock(items, referenceId, performedBy = 'SYSTEM', session) {
        const successfullyReserved = [];
        for (const item of items) {
            const pkgType = item.packagingType || contracts_1.PackagingType.GLASS_BOTTLE;
            const balance = await this.getOrCreateBalance(item.productId, item.size, pkgType, session);
            // Atomic conditional update: only increment reservedUnits if available >= quantity
            // Available = physicalUnits - reservedUnits
            const updated = await Inventory_1.InventoryBalanceModel.findOneAndUpdate({
                _id: balance._id,
                $expr: {
                    $gte: [{ $subtract: ['$physicalUnits', '$reservedUnits'] }, item.quantity],
                },
            }, {
                $inc: { reservedUnits: item.quantity },
                $set: { lastUpdated: new Date() },
            }, { new: true, session: session || undefined });
            if (!updated) {
                // Rollback already reserved items in this operation
                for (const reserved of successfullyReserved) {
                    await Inventory_1.InventoryBalanceModel.findByIdAndUpdate(reserved.balanceId, { $inc: { reservedUnits: -reserved.quantity } }, session ? { session } : {});
                }
                const available = Math.max(0, balance.physicalUnits - balance.reservedUnits);
                throw new errors_1.AppError(`Insufficient inventory for ${balance.productName} (${item.size}). Requested: ${item.quantity}, Available: ${available}`, 409, 'INSUFFICIENT_STOCK');
            }
            successfullyReserved.push({
                balanceId: balance._id,
                quantity: item.quantity,
                productId: item.productId,
                size: item.size,
                packagingType: pkgType,
            });
            // Record movement
            await Inventory_1.InventoryMovementModel.create([
                {
                    inventoryId: balance._id,
                    productId: balance.productId,
                    productName: balance.productName,
                    size: item.size,
                    packagingType: pkgType,
                    movementType: contracts_1.StockMovementType.ORDER_RESERVATION,
                    deltaUnits: -item.quantity,
                    balanceAfter: Math.max(0, updated.physicalUnits - updated.reservedUnits),
                    referenceType: 'Order',
                    referenceId,
                    reason: `Reserved ${item.quantity} units for order allocation`,
                    performedBy,
                    timestamp: new Date(),
                },
            ], session ? { session } : {});
        }
    }
    /**
     * Release reserved stock on order cancellation.
     */
    async releaseReservation(items, referenceId, reason = 'Order cancelled', performedBy = 'SYSTEM', session) {
        for (const item of items) {
            const pkgType = item.packagingType || contracts_1.PackagingType.GLASS_BOTTLE;
            const balance = await this.getOrCreateBalance(item.productId, item.size, pkgType, session);
            const updated = await Inventory_1.InventoryBalanceModel.findByIdAndUpdate(balance._id, {
                $inc: { reservedUnits: -Math.min(balance.reservedUnits, item.quantity) },
                $set: { lastUpdated: new Date() },
            }, { new: true, session: session || undefined });
            if (updated) {
                await Inventory_1.InventoryMovementModel.create([
                    {
                        inventoryId: balance._id,
                        productId: balance.productId,
                        productName: balance.productName,
                        size: item.size,
                        packagingType: pkgType,
                        movementType: contracts_1.StockMovementType.AUDIT_ADJUSTMENT,
                        deltaUnits: item.quantity,
                        balanceAfter: Math.max(0, updated.physicalUnits - updated.reservedUnits),
                        referenceType: 'Order',
                        referenceId,
                        reason: `Released reservation: ${reason}`,
                        performedBy,
                        timestamp: new Date(),
                    },
                ], session ? { session } : {});
            }
        }
    }
    /**
     * Fulfill reservation when orders are dispatched or delivered.
     * Decrements physicalUnits and reservedUnits atomically.
     */
    async fulfillReservation(items, referenceId, performedBy = 'SYSTEM', session) {
        for (const item of items) {
            const pkgType = item.packagingType || contracts_1.PackagingType.GLASS_BOTTLE;
            const balance = await this.getOrCreateBalance(item.productId, item.size, pkgType, session);
            const updated = await Inventory_1.InventoryBalanceModel.findByIdAndUpdate(balance._id, {
                $inc: {
                    physicalUnits: -item.quantity,
                    reservedUnits: -item.quantity,
                },
                $set: { lastUpdated: new Date() },
            }, { new: true, session: session || undefined });
            if (updated) {
                await Inventory_1.InventoryMovementModel.create([
                    {
                        inventoryId: balance._id,
                        productId: balance.productId,
                        productName: balance.productName,
                        size: item.size,
                        packagingType: pkgType,
                        movementType: contracts_1.StockMovementType.MORNING_DISPATCH,
                        deltaUnits: -item.quantity,
                        balanceAfter: Math.max(0, updated.physicalUnits - updated.reservedUnits),
                        referenceType: 'Order',
                        referenceId,
                        reason: 'Morning dispatch delivery fulfillment',
                        performedBy,
                        timestamp: new Date(),
                    },
                ], session ? { session } : {});
            }
        }
    }
    /**
     * Ingest stock from dock procurement receipts.
     */
    async inwardProcuredStock(productId, size, packagingType, units, referenceId, performedBy, session) {
        const balance = await this.getOrCreateBalance(productId, size, packagingType, session);
        const updated = await Inventory_1.InventoryBalanceModel.findByIdAndUpdate(balance._id, {
            $inc: { physicalUnits: units },
            $set: { lastUpdated: new Date() },
        }, { new: true, session: session || undefined });
        await Inventory_1.InventoryMovementModel.create([
            {
                inventoryId: balance._id,
                productId: balance.productId,
                productName: balance.productName,
                size,
                packagingType,
                movementType: contracts_1.StockMovementType.PROCUREMENT_INWARD,
                deltaUnits: units,
                balanceAfter: Math.max(0, updated.physicalUnits - updated.reservedUnits),
                referenceType: 'PurchaseOrder',
                referenceId,
                reason: `Procurement dock delivery received: ${units} units`,
                performedBy,
                timestamp: new Date(),
            },
        ], session ? { session } : {});
        return updated;
    }
    /**
     * Manual stock adjustment (add stock, mark damaged, audit adjustment).
     */
    async adjustStock(inventoryId, adjustmentType, units, reason, performedBy = 'ADMIN') {
        const balance = await Inventory_1.InventoryBalanceModel.findById(inventoryId);
        if (!balance)
            throw new errors_1.NotFoundError('Inventory record not found.');
        let delta = 0;
        let movType = contracts_1.StockMovementType.AUDIT_ADJUSTMENT;
        if (adjustmentType === 'add_stock') {
            balance.physicalUnits += units;
            delta = units;
            movType = contracts_1.StockMovementType.PROCUREMENT_INWARD;
        }
        else if (adjustmentType === 'mark_damaged') {
            balance.physicalUnits = Math.max(0, balance.physicalUnits - units);
            balance.damagedUnits += units;
            delta = -units;
            movType = contracts_1.StockMovementType.DAMAGE_SPOILAGE;
        }
        else {
            // audit adjustment sets delta directly
            balance.physicalUnits = Math.max(0, balance.physicalUnits + units);
            delta = units;
            movType = contracts_1.StockMovementType.AUDIT_ADJUSTMENT;
        }
        balance.lastUpdated = new Date();
        await balance.save();
        await Inventory_1.InventoryMovementModel.create({
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
exports.InventoryService = InventoryService;
exports.inventoryService = new InventoryService();
//# sourceMappingURL=inventory.service.js.map