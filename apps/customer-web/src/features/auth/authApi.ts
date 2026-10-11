import { apiClient } from '@/services/api-client';
import { mockHandlers } from '@/services/mock-adapter';
import { env } from '@/config/env';
import { User, LoginCredentials, RegisterPayload, AuthResponse } from '@/types/auth';

function mapUser(u: any): User {
  if (!u) return u;
  return {
    id: u.id || u._id,
    name: u.name,
    email: u.email || '',
    phone: u.phone,
    defaultAddressId: u.defaultAddressId,
    walletBalance: u.walletBalancePaise !== undefined ? u.walletBalancePaise / 100 : (u.walletBalance ?? 0),
    isSubscribed: u.isSubscribed ?? false,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt || new Date().toISOString(),
  };
}

export const authApi = {
  async getCurrentUser(): Promise<User | null> {
    if (env.USE_MOCK_API) {
      return mockHandlers.getCurrentUser();
    }
    try {
      const res = await apiClient.get<any>('/auth/me');
      return mapUser(res);
    } catch {
      return null;
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (env.USE_MOCK_API) {
      const res = await mockHandlers.login(credentials);
      localStorage.setItem('ksheeraam_auth_token', res.token || '');
      return res;
    }
    const res = await apiClient.post<any>('/auth/login', credentials);
    const token = res.token || res.accessToken;
    if (token) {
      localStorage.setItem('ksheeraam_auth_token', token);
    }
    if (res.refreshToken) {
      localStorage.setItem('ksheeraam_refresh_token', res.refreshToken);
    }
    return {
      user: mapUser(res.user),
      token,
    };
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    if (env.USE_MOCK_API) {
      const res = await mockHandlers.register(payload);
      localStorage.setItem('ksheeraam_auth_token', res.token || '');
      return res;
    }
    const res = await apiClient.post<any>('/auth/register', payload);
    const token = res.token || res.accessToken;
    if (token) {
      localStorage.setItem('ksheeraam_auth_token', token);
    }
    if (res.refreshToken) {
      localStorage.setItem('ksheeraam_refresh_token', res.refreshToken);
    }
    return {
      user: mapUser(res.user),
      token,
    };
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('ksheeraam_refresh_token');
    localStorage.removeItem('ksheeraam_auth_token');
    localStorage.removeItem('ksheeraam_refresh_token');
    if (env.USE_MOCK_API) {
      await mockHandlers.logout();
      return;
    }
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Clean logout even if network unreachable
    }
  },
};
