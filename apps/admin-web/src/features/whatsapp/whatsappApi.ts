import { adminApiClient } from '@/services/api-client';
import { adminMockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { WhatsAppOrderRequest } from '@/types/whatsapp';

export const whatsappApi = {
  async getWhatsAppRequests(): Promise<WhatsAppOrderRequest[]> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getWhatsAppRequests();
    }
    return adminApiClient.get<WhatsAppOrderRequest[]>('/admin/whatsapp/requests');
  },

  async updateStatus(id: string, status: 'new' | 'in_progress' | 'converted' | 'dismissed'): Promise<WhatsAppOrderRequest> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.updateWhatsAppStatus(id, status);
    }
    return adminApiClient.patch<WhatsAppOrderRequest>(`/admin/whatsapp/requests/${id}/status`, { status });
  },
};
