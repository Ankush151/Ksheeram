import { adminApiClient } from '@/services/api-client';
import { adminMockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { AdminUser, LoginCredentials, AuthResponse } from '@/types/auth';

export const authApi = {
  async getCurrentUser(): Promise<AdminUser | null> {
    if (env.USE_MOCK_API) {
      return adminMockHandlers.getCurrentUser();
    }
    try {
      return await adminApiClient.get<AdminUser>('/auth/me');
    } catch {
      return null;
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (env.USE_MOCK_API) {
      const res = await adminMockHandlers.login(credentials);
      localStorage.setItem('ksheeraam_admin_token', res.token);
      return res;
    }
    const res = await adminApiClient.post<any>('/auth/admin/login', credentials);
    const token = res.token || res.accessToken;
    if (token) {
      localStorage.setItem('ksheeraam_admin_token', token);
    }
    if (res.refreshToken) {
      localStorage.setItem('ksheeraam_admin_refresh_token', res.refreshToken);
    }
    return {
      user: res.user,
      token,
    };
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('ksheeraam_admin_refresh_token');
    localStorage.removeItem('ksheeraam_admin_token');
    localStorage.removeItem('ksheeraam_admin_refresh_token');
    if (env.USE_MOCK_API) {
      await adminMockHandlers.logout();
      return;
    }
    try {
      await adminApiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Clean logout even if network unreachable
    }
  },
};
