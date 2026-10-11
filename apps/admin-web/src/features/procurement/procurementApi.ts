import { adminApiClient } from '@/services/api-client';
import { adminMockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { PurchaseOrder, CreatePurchaseOrderPayload, ReceiveStockPayload } from '@/types/procurement';

export const procurementApi = {
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getPurchaseOrders();
    }
    const response = await adminApiClient.get<any[]>('/admin/procurement/orders');
    return (response || []).map((po: any) => ({
      id: po.id || po._id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      orderDate: po.orderDate,
      expectedDeliveryDate: po.expectedDeliveryDate,
      status: po.status,
      totalUnitsOrdered: po.totalUnitsOrdered,
      totalUnitsReceived: po.totalUnitsReceived,
      totalUnitsRejected: po.totalUnitsRejected,
      totalAmount: po.totalAmount ?? (po.totalCostPaise ? po.totalCostPaise / 100 : 0),
      chillingTempVerifiedAtReceipt: po.chillingTempVerifiedAtReceipt ?? po.chillingTempVerified,
      qualityTesterName: po.qualityTesterName,
      notes: po.notes,
      createdAt: po.createdAt,
      receivedAt: po.receivedAt,
      items: (po.items || []).map((i: any) => ({
        id: i.id || i._id,
        productId: i.productId,
        productName: i.productName,
        size: i.size,
        packagingType: i.packagingType,
        orderedUnits: i.orderedUnits,
        receivedUnits: i.receivedUnits,
        rejectedUnits: i.rejectedUnits,
        unitCost: i.unitCost ?? (i.unitCostPaise ? i.unitCostPaise / 100 : 0),
        totalCost: i.totalCost ?? (i.totalCostPaise ? i.totalCostPaise / 100 : 0),
        rejectionReason: i.rejectionReason,
      })),
    }));
  },

  async createPurchaseOrder(payload: CreatePurchaseOrderPayload): Promise<PurchaseOrder> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.createPurchaseOrder(payload);
    }
    const apiPayload = {
      supplierId: payload.supplierId,
      expectedDeliveryDate: payload.expectedDeliveryDate,
      notes: payload.notes,
      items: payload.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        size: i.size,
        packagingType: i.packagingType,
        orderedUnits: i.orderedUnits,
        unitCostPaise: Math.round(i.unitCost * 100),
      })),
    };
    return adminApiClient.post<PurchaseOrder>('/admin/procurement/orders', apiPayload);
  },

  async receiveStock(payload: ReceiveStockPayload): Promise<PurchaseOrder> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.receiveStock(payload);
    }
    return adminApiClient.post<PurchaseOrder>('/admin/procurement/receive', payload);
  },
};
