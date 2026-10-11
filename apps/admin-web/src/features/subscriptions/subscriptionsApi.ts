import { adminApiClient } from '@/services/api-client';
import { adminMockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { AdminSubscription } from '@/types/subscriptions';

function mapAdminSubscription(s: any): AdminSubscription {
  const items = (s.items || []).map((i: any) => ({
    productId: i.productId,
    productName: i.productName || 'Farm Fresh Milk',
    size: i.size || '1L',
    quantity: i.quantity || 1,
    unitPrice: i.unitPricePaise !== undefined ? i.unitPricePaise / 100 : (i.unitPrice || 68),
  }));

  return {
    id: s.id || s._id,
    customerId: s.customerId,
    customerName: s.customerName || 'Customer',
    customerPhone: s.customerPhone || '',
    status: s.status || 'active',
    frequency: s.frequency || 'daily',
    customDays: s.customDays,
    items,
    deliveryAddress: typeof s.deliveryAddress === 'string' ? s.deliveryAddress : 'Bengaluru',
    pincode: s.pincode || '560038',
    startDate: s.startDate,
    nextDeliveryDate: s.nextDeliveryDate,
    pauseStartDate: s.pauseStartDate,
    pauseEndDate: s.pauseEndDate,
    walletBalance: s.walletBalancePaise !== undefined ? s.walletBalancePaise / 100 : (s.walletBalance || 0),
    isWalletSufficient: s.isWalletSufficient ?? true,
    createdAt: s.createdAt || new Date().toISOString(),
  };
}

export const subscriptionsApi = {
  async getSubscriptions(): Promise<AdminSubscription[]> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getSubscriptions();
    }
    const res = await adminApiClient.get<any[]>('/admin/subscriptions');
    return (res || []).map(mapAdminSubscription);
  },

  async pauseSubscription(id: string): Promise<AdminSubscription> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.pauseSubscription(id);
    }
    const res = await adminApiClient.post<any>(`/admin/subscriptions/${id}/pause`);
    return mapAdminSubscription(res);
  },

  async resumeSubscription(id: string): Promise<AdminSubscription> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.resumeSubscription(id);
    }
    const res = await adminApiClient.post<any>(`/admin/subscriptions/${id}/resume`);
    return mapAdminSubscription(res);
  },
};
