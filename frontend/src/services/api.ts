import axios from 'axios';
import { ENV } from '../config/env_proxy';
import { apiCache } from './apiCache';

export const ADMIN_SESSION_STORAGE_KEY = 'fd_admin_auth_session_v1';
export const AUTH_STORAGE_KEY = 'auth-storage';

export function getAdminAuthToken(): string | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed?.token || null;
  } catch {
    return null;
  }
}

export function getCustomerAuthToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string }; token?: string };
    return parsed?.state?.token || parsed?.token || null;
  } catch {
    return null;
  }
}

export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const url = String(config.url || '');
  const isAdminRoute = url.includes('/admin') || url.includes('/seo/ping');

  if (isAdminRoute) {
    const adminToken = getAdminAuthToken();
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  } else {
    const customerToken = getCustomerAuthToken();
    if (customerToken) {
      config.headers.Authorization = `Bearer ${customerToken}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = (response.config.method || 'get').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const url = String(response.config.url || '');
      apiCache.invalidatePrefix();
      if (typeof window !== 'undefined') {
        if (url.includes('/settings') || url.includes('/payment-settings')) {
          window.dispatchEvent(new CustomEvent('settings-updated'));
        }
        window.dispatchEvent(new CustomEvent('admin-stats-updated'));
      }
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export async function cachedGet<T>(url: string, ttlMs = 30_000): Promise<T> {
  return apiCache.dedup(
    `GET:${url}`,
    async () => {
      const res = await api.get<T>(url);
      return res.data;
    },
    ttlMs
  );
}
