import { adminApiClient } from '@/services/api-client';
import { adminMockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { DashboardStats } from '@/types/dashboard';

export const dashboardApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getDashboardStats();
    }
    return adminApiClient.get<DashboardStats>('/admin/dashboard/stats');
  },
};
