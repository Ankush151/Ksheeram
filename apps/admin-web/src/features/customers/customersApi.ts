import { adminApiClient } from '@/services/api-client';
import { adminMockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { Customer } from '@/types/customers';

function mapCustomer(u: any): Customer {
  return {
    id: u.id || u._id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    addressSummary: u.addressSummary || u.assignedRoute || 'Indiranagar, Bengaluru',
    pincode: u.pincode || '560038',
    walletBalance: u.walletBalancePaise !== undefined ? u.walletBalancePaise / 100 : (u.walletBalance || 0),
    isSubscribed: u.isSubscribed ?? true,
    activeSubscriptionCount: u.activeSubscriptionCount ?? 1,
    totalOrdersPlaced: u.totalOrdersPlaced ?? 12,
    status: u.isActive !== false ? 'active' : 'suspended',
    createdAt: u.createdAt || new Date().toISOString(),
  };
}

export const customersApi = {
  async getCustomers(search?: string): Promise<Customer[]> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getCustomers(search);
    }
    const res = await adminApiClient.get<any[]>('/admin/customers', { search });
    return (res || []).map(mapCustomer);
  },

  async getCustomerById(id: string): Promise<Customer> {
    if (env.USE_MOCK_API) {
      const customers = await adminMockHandlers.getCustomers();
      const match = customers.find((c) => c.id === id);
      if (!match) throw new Error('Customer not found');
      return match;
    }
    const res = await adminApiClient.get<any>(`/admin/customers/${id}`);
    return mapCustomer(res);
  },
};
