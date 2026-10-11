import { adminApiClient } from '@/services/api-client';
import { adminMockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import {
  DeliveryAgent,
  ManifestOrderItem,
  AssignAgentPayload,
  CompleteDeliveryPayload,
  FailDeliveryPayload,
} from '@/types/delivery';

function mapManifestItem(m: any): ManifestOrderItem {
  return {
    orderId: m.orderId,
    orderNumber: m.orderNumber,
    customerId: m.customerId,
    customerName: m.customerName,
    customerPhone: m.customerPhone,
    flatNumber: '',
    buildingName: m.deliveryAddress || 'Bengaluru',
    streetArea: '',
    landmark: '',
    pincode: m.pincode || '560038',
    customerAddress: m.deliveryAddress || 'Bengaluru',
    deliveryInstructions: m.deliveryInstructions,
    items: m.items || [],
    paymentStatus: m.paymentStatus || 'paid',
    paymentMethod: m.paymentMethod || 'wallet',
    amountToCollect: m.amountToCollectPaise !== undefined ? m.amountToCollectPaise / 100 : (m.amountToCollect || 0),
    status: m.status || 'assigned',
    assignedAgentId: m.assignedAgentId,
    assignedAgentName: m.assignedAgentName,
    deliverySlot: m.deliverySlot || 'Morning 5:30 AM – 7:00 AM',
    deliveryDate: m.deliveryDate,
    deliveredAt: m.deliveredAt,
    failedReason: m.failedReason,
    agentNotes: m.agentNotes,
  };
}

function mapDeliveryAgent(a: any): DeliveryAgent {
  return {
    id: a.id || a._id,
    name: a.name,
    phone: a.phone,
    vehicleType: 'scooter',
    vehicleNumber: a.vehicleNumber || 'KA-01-EQ-4421',
    assignedArea: a.assignedRoute || 'Indiranagar - Domlur',
    assignedSector: 'Sector A',
    status: 'available',
    activeDeliveriesCount: 14,
    completedTodayCount: 22,
    failedTodayCount: 1,
  };
}

export const deliveryApi = {
  // Admin Endpoints
  async getDeliveryManifest(): Promise<ManifestOrderItem[]> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getDeliveryManifest();
    }
    const res = await adminApiClient.get<any[]>('/admin/delivery/manifest');
    return (res || []).map(mapManifestItem);
  },

  async getDeliveryAgents(): Promise<DeliveryAgent[]> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getDeliveryAgents();
    }
    const res = await adminApiClient.get<any[]>('/admin/delivery/agents');
    return (res || []).map(mapDeliveryAgent);
  },

  async assignAgent(payload: AssignAgentPayload): Promise<{ success: boolean }> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.assignAgent(payload);
    }
    return adminApiClient.post<{ success: boolean }>('/admin/delivery/assign', payload);
  },

  // Agent Specific Endpoints
  async getAgentManifest(agentId: string): Promise<ManifestOrderItem[]> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getAgentManifest(agentId);
    }
    const res = await adminApiClient.get<any[]>(`/delivery/agent/${agentId}/manifest`);
    return (res || []).map(mapManifestItem);
  },

  async completeDelivery(payload: CompleteDeliveryPayload): Promise<ManifestOrderItem> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.completeDelivery(payload);
    }
    const reqBody = {
      orderId: payload.orderId,
      agentNotes: payload.agentNotes,
      cashCollectedPaise: typeof payload.cashCollected === 'number' ? Math.round(payload.cashCollected * 100) : 0,
    };
    const res = await adminApiClient.post<any>('/delivery/complete', reqBody);
    return mapManifestItem(res);
  },

  async failDelivery(payload: FailDeliveryPayload): Promise<ManifestOrderItem> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.failDelivery(payload);
    }
    const res = await adminApiClient.post<any>('/delivery/fail', payload);
    return mapManifestItem(res);
  },
};
