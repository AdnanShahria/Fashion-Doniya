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

function normalizeApiPath(rawUrl: string): string {
  const withoutOrigin = rawUrl.replace(/^https?:\/\/[^/]+/i, '');
  const withoutQuery = withoutOrigin.split('?')[0].split('#')[0];
  return withoutQuery.replace(/^\/api(?:\/v\d+)?/, '') || '/';
}

function isAdminApiPath(rawUrl: string): boolean {
  const path = normalizeApiPath(rawUrl);
  return (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path === '/bulk/admin-stats' ||
    path.startsWith('/seo/ping') ||
    path.startsWith('/courier/sync') ||
    path.startsWith('/system/upload-image') ||
    (path.startsWith('/customers/sync') && Boolean(getAdminAuthToken()))
  );
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sess = localStorage.getItem('fd_session_id');
    if (!sess) {
      sess = 'sess-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem('fd_session_id', sess);
    }
    return sess;
  } catch {
    return '';
  }
}

api.interceptors.request.use((config) => {
  const url = String(config.url || '');
  const isAdminRoute = isAdminApiPath(url);

  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }

  const sessId = getSessionId();
  if (sessId && config.headers) {
    config.headers['x-session-id'] = sessId;
  }

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
  (error) => {
    if (typeof window !== 'undefined') {
      const status = error?.response?.status;
      const url = String(error?.config?.url || '');
      const relPath = normalizeApiPath(url);
      const isAdminCall = isAdminApiPath(url);

      if (status === 401 && isAdminCall && relPath !== '/admin/auth/login') {
        try {
          localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
          localStorage.removeItem('fashion_doniya_orders');
          localStorage.removeItem('fashion_doniya_order_tracking_history');
          localStorage.removeItem('fashion_doniya_courier_information');
        } catch {
          // ignore
        }
        window.dispatchEvent(
          new CustomEvent('admin-unauthorized', {
            detail: { message: error?.response?.data?.message || 'সেশন মেয়াদ শেষ হয়েছে, অনুগ্রহ করে পুনরায় লগইন করুন।' },
          })
        );
      } else if (
        status === 401 &&
        !isAdminCall &&
        relPath !== '/auth/login' &&
        relPath !== '/auth/register' &&
        relPath !== '/auth/forgot-password' &&
        relPath !== '/auth/reset-password'
      ) {
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem('fashion_doniya_current_user');
        } catch {
          // ignore
        }
        window.dispatchEvent(
          new CustomEvent('customer-unauthorized', {
            detail: {
              message:
                error?.response?.data?.message ||
                'আপনার সেশনের মেয়াদ শেষ হয়েছে, অনুগ্রহ করে পুনরায় লগইন করুন।',
            },
          })
        );
      } else if (
        status === 403 &&
        (error?.response?.data?.code === 'DEMO_MODE_READ_ONLY' ||
          error?.response?.data?.code === 'DEMO_MODE_ACTIVE')
      ) {
        window.dispatchEvent(
          new CustomEvent('admin-api-error', {
            detail: { message: error.response.data.message || 'ডেমো মোড সক্রিয় থাকায় পরিবর্তন সংরক্ষণ করা যায়নি।' },
          })
        );
      }
    }
    return Promise.reject(error);
  }
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
