import mongoose from 'mongoose';
import { CreatePurchaseOrderDto, PurchaseOrderDto, ReceiveStockDto } from '@ksheeraam/contracts';
import { IPurchaseOrder, PurchaseOrderModel } from '../../models/PurchaseOrder';
import { SupplierModel } from '../../models/Supplier';
import { inventoryService } from '../inventory/inventory.service';
import { AppError, NotFoundError } from '../../utils/errors';
import { getKolkataDateString } from '@ksheeraam/contracts';
import { withTransaction } from '../../config/database';

export function mapPOToDto(po: IPurchaseOrder): PurchaseOrderDto {
  return {
    id: po._id.toString(),
    poNumber: po.poNumber,
    supplierId: po.supplierId.toString(),
    supplierName: po.supplierName,
    orderDate: po.orderDate,
    expectedDeliveryDate: po.expectedDeliveryDate,
    status: po.status,
    items: po.items.map((i: any) => ({
      id: i._id?.toString(),
      productId: i.productId.toString(),
      productName: i.productName,
      size: i.size,
      packagingType: i.packagingType,
      orderedUnits: i.orderedUnits,
      receivedUnits: i.receivedUnits,
      rejectedUnits: i.rejectedUnits,
      unitCostPaise: i.unitCostPaise,
      totalCostPaise: i.totalCostPaise,
      rejectionReason: i.rejectionReason,
    })),
    totalUnitsOrdered: po.totalUnitsOrdered,
    totalUnitsReceived: po.totalUnitsReceived,
    totalUnitsRejected: po.totalUnitsRejected,
    totalCostPaise: po.totalCostPaise,
    chillingTempVerified: po.chillingTempVerified,
    qualityTesterName: po.qualityTesterName,
    notes: po.notes,
    createdAt: po.createdAt.toISOString(),
    receivedAt: po.receivedAt ? po.receivedAt.toISOString() : undefined,
  };
}

export class ProcurementService {
  async listPurchaseOrders(): Promise<PurchaseOrderDto[]> {
    const pos = await PurchaseOrderModel.find().sort({ createdAt: -1 });
    return pos.map(mapPOToDto);
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrderDto> {
    const po = await PurchaseOrderModel.findById(id);
    if (!po) throw new NotFoundError('Purchase order not found.');
    return mapPOToDto(po);
  }

  async createPurchaseOrder(data: CreatePurchaseOrderDto): Promise<PurchaseOrderDto> {
    const supplier = await SupplierModel.findById(data.supplierId);
    if (!supplier) throw new NotFoundError('Supplier not found.');

    const count = await PurchaseOrderModel.countDocuments();
    const poNumber = `PO-${getKolkataDateString().replace(/-/g, '')}-${String(count + 1).padStart(3, '0')}`;

    let totalUnitsOrdered = 0;
    let totalCostPaise = 0;

    const items = data.items.map((item) => {
      const itemTotalCost = item.orderedUnits * item.unitCostPaise;
      totalUnitsOrdered += item.orderedUnits;
      totalCostPaise += itemTotalCost;

      return {
        productId: new mongoose.Types.ObjectId(item.productId),
        productName: item.productName,
        size: item.size,
        packagingType: item.packagingType,
        orderedUnits: item.orderedUnits,
        receivedUnits: 0,
        rejectedUnits: 0,
        unitCostPaise: item.unitCostPaise,
        totalCostPaise: itemTotalCost,
      };
    });

    const po = await PurchaseOrderModel.create({
      poNumber,
      supplierId: supplier._id,
      supplierName: supplier.name,
      orderDate: getKolkataDateString(),
      expectedDeliveryDate: data.expectedDeliveryDate,
      status: 'ordered',
      items,
      totalUnitsOrdered,
      totalUnitsReceived: 0,
      totalUnitsRejected: 0,
      totalCostPaise,
      notes: data.notes,
    });

    return mapPOToDto(po);
  }

  async receiveStock(data: ReceiveStockDto, performedBy: string): Promise<PurchaseOrderDto> {
    return withTransaction(async (session) => {
      const po = await PurchaseOrderModel.findById(data.poId).session(session || null);
      if (!po) throw new NotFoundError('Purchase order not found.');

      if (po.status === 'received') {
        throw new AppError('This purchase order has already been marked as received.', 400, 'ALREADY_RECEIVED');
      }

      let totalReceived = 0;
      let totalRejected = 0;

      for (const receiveItem of data.items) {
        const item = po.items.find((i: any) => i._id?.toString() === receiveItem.itemId);
        if (item) {
          item.receivedUnits = receiveItem.receivedUnits;
          item.rejectedUnits = receiveItem.rejectedUnits;
          item.rejectionReason = receiveItem.rejectionReason;
          totalReceived += receiveItem.receivedUnits;
          totalRejected += receiveItem.rejectedUnits;

          // Inward accepted units into physical inventory
          if (receiveItem.receivedUnits > 0) {
            await inventoryService.inwardProcuredStock(
              item.productId.toString(),
              item.size,
              item.packagingType,
              receiveItem.receivedUnits,
              po.poNumber,
              performedBy,
              session
            );
          }
        }
      }

      po.status = 'received';
      po.receivedAt = new Date();
      po.totalUnitsReceived = totalReceived;
      po.totalUnitsRejected = totalRejected;
      po.chillingTempVerified = data.chillingTemp;
      po.qualityTesterName = data.qualityTesterName;

      await po.save({ session: session || undefined });
      return mapPOToDto(po);
    });
  }
}

export const procurementService = new ProcurementService();
