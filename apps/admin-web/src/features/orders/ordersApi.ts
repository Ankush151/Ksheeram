import { adminApiClient } from '@/services/api-client';
import { adminMockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { AdminOrder } from '@/types/orders';

function mapAdminOrder(o: any): AdminOrder {
  const items = (o.items || []).map((i: any) => ({
    productId: i.productId,
    productName: i.productName,
    size: i.size,
    quantity: i.quantity,
    unitPrice: i.unitPricePaise !== undefined ? i.unitPricePaise / 100 : (i.unitPrice || 68),
    subtotal: i.subtotalPaise !== undefined ? i.subtotalPaise / 100 : (i.subtotal || 68),
    totalPrice: i.subtotalPaise !== undefined ? i.subtotalPaise / 100 : (i.subtotal || 68),
  }));

  const tot = o.totalPaise !== undefined ? o.totalPaise / 100 : (o.total || 0);

  return {
    id: o.id || o._id,
    orderNumber: o.orderNumber,
    customerId: o.customerId,
    customerName: o.customerName || 'Customer',
    customerPhone: o.customerPhone || '',
    orderType: o.orderType || 'one_time',
    status: o.status,
    stockAllocated: o.stockAllocated ?? false,
    paymentStatus: o.paymentStatus || 'paid',
    paymentMethod: o.paymentMethod || 'wallet',
    items,
    deliveryAddress: typeof o.deliveryAddress === 'string' ? o.deliveryAddress : 'Bengaluru',
    pincode: o.pincode || '560038',
    deliveryDate: o.deliveryDate,
    deliverySlot: o.deliverySlot || 'Morning 5:30 AM – 7:00 AM',
    subtotal: o.subtotalPaise !== undefined ? o.subtotalPaise / 100 : (o.subtotal || 0),
    deliveryFee: o.deliveryFeePaise !== undefined ? o.deliveryFeePaise / 100 : (o.deliveryFee || 0),
    total: tot,
    totalAmount: tot,
    assignedAgentId: o.assignedAgentId,
    assignedAgentName: o.assignedAgentName,
    deliveryInstructions: o.deliveryInstructions,
    instructions: o.deliveryInstructions,
    failedReason: o.failedReason,
    createdAt: o.createdAt || new Date().toISOString(),
  };
}

export const ordersApi = {
  async getOrders(): Promise<AdminOrder[]> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getOrders();
    }
    const res = await adminApiClient.get<any[]>('/admin/orders');
    return (res || []).map(mapAdminOrder);
  },

  async allocateStock(orderId: string): Promise<AdminOrder> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.allocateStock(orderId);
    }
    const res = await adminApiClient.post<any>(`/admin/orders/${orderId}/allocate-stock`);
    return mapAdminOrder(res);
  },
};
