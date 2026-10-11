import { adminApiClient } from '@/services/api-client';
import { adminMockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { Supplier, CreateSupplierPayload } from '@/types/suppliers';

export const suppliersApi = {
  async getSuppliers(): Promise<Supplier[]> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getSuppliers();
    }
    return adminApiClient.get<Supplier[]>('/admin/suppliers');
  },

  async createSupplier(payload: CreateSupplierPayload): Promise<Supplier> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.createSupplier(payload);
    }
    return adminApiClient.post<Supplier>('/admin/suppliers', payload);
  },

  async updateSupplier(id: string, payload: Partial<CreateSupplierPayload>): Promise<Supplier> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.updateSupplier(id, payload);
    }
    return adminApiClient.put<Supplier>(`/admin/suppliers/${id}`, payload);
  },
};
