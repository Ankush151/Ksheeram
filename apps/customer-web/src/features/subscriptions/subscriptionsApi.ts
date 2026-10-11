import { apiClient } from '@/services/api-client';
import { mockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import {
  Subscription,
  SubscriptionItem,
  SubscriptionQuoteRequest,
  SubscriptionQuoteResponse,
  CreateSubscriptionPayload,
  SubscriptionChangeRequest,
  SubscriptionChangeResult,
  SubscriptionPauseRequest,
} from '@/types/subscriptions';
import { Address } from '@/types/addresses';

function mapSubscription(s: any): Subscription {
  const items: SubscriptionItem[] = (s.items || []).map((i: any) => ({
    productId: i.productId || '',
    productName: i.productName || 'Farm Fresh Milk',
    variantId: i.variantId || '',
    size: i.size || '1L',
    quantity: i.quantity || 1,
    unitPrice: i.unitPricePaise !== undefined ? i.unitPricePaise / 100 : (i.unitPrice || 68),
  }));

  const perDelivery = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const estDays = s.frequency === 'alternate' ? 15 : (s.frequency === 'custom' && s.customDays ? Math.round(s.customDays.length * 4.3) : 30);
  const monthlyEstimate = perDelivery * estDays;

  const addrStr = typeof s.deliveryAddress === 'string' ? s.deliveryAddress : (s.deliveryAddress?.buildingName || 'Bengaluru');
  const deliveryAddress: Address = {
    id: s.addressId || '',
    userId: s.customerId || '',
    label: 'Delivery Address',
    addressType: 'home',
    flatNumber: '',
    buildingName: addrStr,
    streetArea: '',
    landmark: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: s.pincode || '560038',
    deliveryInstructions: '',
    isDefault: true,
  };

  return {
    id: s.id || s._id,
    userId: s.customerId || '',
    status: s.status || 'active',
    frequency: s.frequency || 'daily',
    customDays: s.customDays,
    items,
    deliveryAddressId: s.addressId || '',
    deliveryAddress,
    startDate: s.startDate || new Date().toISOString().split('T')[0],
    nextDeliveryDate: s.nextDeliveryDate || new Date().toISOString().split('T')[0],
    pauseStartDate: s.pauseStartDate,
    pauseEndDate: s.pauseEndDate,
    autoRenew: true,
    paymentMethod: 'prepaid_wallet',
    monthlyEstimate: Math.round(monthlyEstimate),
    cutoffTime: '8:00 PM for next morning 7:00 AM delivery',
    createdAt: s.createdAt || new Date().toISOString(),
    updatedAt: s.updatedAt || new Date().toISOString(),
  };
}

export const subscriptionsApi = {
  async getSubscriptions(): Promise<Subscription[]> {
    if (env.USE_MOCK_API) {
      return mockHandlers.getSubscriptions();
    }
    const res = await apiClient.get<any[]>('/subscriptions');
    return (res || []).map(mapSubscription);
  },

  async getSubscriptionById(id: string): Promise<Subscription> {
    if (env.USE_MOCK_API) {
      return mockHandlers.getSubscriptionById(id);
    }
    const res = await apiClient.get<any>(`/subscriptions/${id}`);
    return mapSubscription(res);
  },

  async quoteSubscription(payload: SubscriptionQuoteRequest): Promise<SubscriptionQuoteResponse> {
    if (env.USE_MOCK_API) {
      return mockHandlers.quoteSubscription(payload);
    }
    return apiClient.post<SubscriptionQuoteResponse>('/subscriptions/quote', payload);
  },

  async createSubscription(payload: CreateSubscriptionPayload): Promise<Subscription> {
    if (env.USE_MOCK_API) {
      return mockHandlers.createSubscription(payload);
    }
    const reqBody = {
      frequency: payload.frequency,
      customDays: payload.customDays,
      addressId: payload.deliveryAddressId,
      deliveryAddressId: payload.deliveryAddressId,
      startDate: payload.startDate,
      items: payload.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    };
    const res = await apiClient.post<any>('/subscriptions', reqBody);
    return mapSubscription(res);
  },

  async modifySubscription(id: string, payload: SubscriptionChangeRequest): Promise<SubscriptionChangeResult> {
    if (env.USE_MOCK_API) {
      return mockHandlers.modifySubscription(id, payload);
    }
    const reqBody = {
      frequency: payload.requestedFrequency,
      customDays: payload.requestedCustomDays,
      effectiveFromDate: payload.effectiveDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
    };
    const res = await apiClient.put<any>(`/subscriptions/${id}/schedule`, reqBody);
    const sub = mapSubscription(res);
    return {
      success: true,
      effectiveFrom: reqBody.effectiveFromDate,
      affectsNextDelivery: true,
      message: 'Subscription schedule modified successfully.',
      updatedSubscription: sub,
    };
  },

  async pauseSubscription(id: string, payload: SubscriptionPauseRequest): Promise<Subscription> {
    if (env.USE_MOCK_API) {
      return mockHandlers.pauseSubscription(id, payload);
    }
    const res = await apiClient.post<any>(`/subscriptions/${id}/pause`, {
      pauseStartDate: payload.pauseStartDate,
      pauseEndDate: payload.resumeDate,
      reason: payload.reason,
    });
    return mapSubscription(res);
  },

  async resumeSubscription(id: string): Promise<Subscription> {
    if (env.USE_MOCK_API) {
      return mockHandlers.resumeSubscription(id);
    }
    const res = await apiClient.post<any>(`/subscriptions/${id}/resume`);
    return mapSubscription(res);
  },

  async cancelSubscription(id: string, reason?: string): Promise<Subscription> {
    if (env.USE_MOCK_API) {
      return mockHandlers.cancelSubscription(id);
    }
    const res = await apiClient.post<any>(`/subscriptions/${id}/cancel`, { reason });
    return mapSubscription(res);
  },
};
