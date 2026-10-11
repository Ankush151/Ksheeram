import { apiClient } from '@/services/api-client';
import { mockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { Address, CreateAddressPayload, UpdateAddressPayload, AddressType } from '@/types/addresses';

function mapAddress(dto: any): Address {
  const lbl = (dto.label || 'Home').toLowerCase();
  const addressType: AddressType = (lbl.includes('work') || lbl.includes('office')) ? 'work' : (lbl.includes('home') ? 'home' : 'other');

  return {
    id: dto.id || dto._id,
    userId: dto.userId || '',
    label: dto.label || 'Home',
    addressType: dto.addressType || addressType,
    flatNumber: dto.flatNumber,
    buildingName: dto.buildingName,
    streetArea: dto.streetArea,
    landmark: dto.landmark || '',
    city: dto.city || 'Bengaluru',
    state: dto.state || 'Karnataka',
    pincode: dto.pincode,
    deliveryInstructions: dto.deliveryInstructions || '',
    isDefault: dto.isDefault ?? false,
    contactPhone: dto.contactPhone || '',
  };
}

export const addressesApi = {
  async getAddresses(): Promise<Address[]> {
    if (env.USE_MOCK_API) {
      return mockHandlers.getAddresses();
    }
    const res = await apiClient.get<any[]>('/addresses');
    return (res || []).map(mapAddress);
  },

  async createAddress(payload: CreateAddressPayload): Promise<Address> {
    if (env.USE_MOCK_API) {
      return mockHandlers.createAddress(payload);
    }
    const res = await apiClient.post<any>('/addresses', payload);
    return mapAddress(res);
  },

  async updateAddress(id: string, payload: UpdateAddressPayload): Promise<Address> {
    if (env.USE_MOCK_API) {
      return mockHandlers.updateAddress(id, payload);
    }
    const res = await apiClient.put<any>(`/addresses/${id}`, payload);
    return mapAddress(res);
  },

  async deleteAddress(id: string): Promise<{ success: boolean }> {
    if (env.USE_MOCK_API) {
      return mockHandlers.deleteAddress(id);
    }
    return apiClient.delete<{ success: boolean }>(`/addresses/${id}`);
  },
};
