import { env } from '@/config/env';
import { ApiError } from '@/types/api';

class AdminApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.baseUrl = env.API_BASE_URL.replace(/\/$/, '');
  }

  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('ksheeraam_admin_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  /**
   * Thread-safe session renewal using Refresh Tokens for Admin/Ops/Agents
   */
  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const storedRefreshToken = localStorage.getItem('ksheeraam_admin_refresh_token');
        const res = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ refreshToken: storedRefreshToken || undefined }),
        });

        if (!res.ok) {
          throw new Error('Refresh failed');
        }

        const resJson = await res.json();
        const payload = resJson.data || resJson;
        const newAccessToken = payload.accessToken || payload.token;
        const newRefreshToken = payload.refreshToken;

        if (newAccessToken) {
          localStorage.setItem('ksheeraam_admin_token', newAccessToken);
        }
        if (newRefreshToken) {
          localStorage.setItem('ksheeraam_admin_refresh_token', newRefreshToken);
        }

        return newAccessToken;
      } catch {
        localStorage.removeItem('ksheeraam_admin_token');
        localStorage.removeItem('ksheeraam_admin_refresh_token');
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...this.getAuthHeader(),
      ...(options.headers as Record<string, string>),
    };

    try {
      let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Secure HTTP-only cookies
      });

      const isAuthEndpoint =
        endpoint.includes('/auth/login') ||
        endpoint.includes('/auth/register') ||
        endpoint.includes('/auth/refresh') ||
        endpoint.includes('/auth/logout');

      if (response.status === 401 && !isAuthEndpoint) {
        let errBody: any = null;
        try {
          errBody = await response.clone().json();
        } catch {}

        if (errBody?.code === 'TOKEN_EXPIRED' || !errBody) {
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            const retriedHeaders = {
              ...headers,
              Authorization: `Bearer ${newToken}`,
            };
            response = await fetch(url, {
              ...options,
              headers: retriedHeaders,
              credentials: 'include',
            });
          }
        }
      }

      if (response.status === 401 && !isAuthEndpoint) {
        localStorage.removeItem('ksheeraam_admin_token');
        localStorage.removeItem('ksheeraam_admin_refresh_token');
      }

      if (!response.ok) {
        let errData: any = null;
        try {
          errData = await response.json();
        } catch {}

        const apiError: ApiError = {
          message: errData?.message || errData?.error || `Request failed with status ${response.status}`,
          statusCode: response.status,
          code: errData?.code,
          details: errData?.details,
        };
        throw apiError;
      }

      const resJson = await response.json();
      if (resJson && typeof resJson === 'object' && 'data' in resJson) {
        return resJson.data as T;
      }
      return resJson as T;
    } catch (err: any) {
      if (err.statusCode) throw err;
      throw {
        message: err.message || 'Network error connecting to Ksheeraam API',
        statusCode: 0,
      } as ApiError;
    }
  }

  public async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) query.append(k, String(v));
      });
      const q = query.toString();
      if (q) url += (url.includes('?') ? '&' : '?') + q;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const adminApiClient = new AdminApiClient();
