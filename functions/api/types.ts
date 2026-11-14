import type { AppDatabase } from './utils/db-factory';

export interface Bindings {
  DB?: D1Database;
  MEDIA_BUCKET?: R2Bucket;
  CACHE_KV?: KVNamespace;
  TURSO_URL?: string;
  TURSO_AUTH_TOKEN?: string;
  JWT_SECRET?: string;
  ADMIN_API_KEY?: string;
  ADMIN_USERNAME?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  SYSADM_SECRET?: string;
  SYSADM_EMAIL?: string;
  NODE_ENV?: string;
  DEMO_MODE?: string;
  SITE_URL?: string;
  ALLOWED_ORIGINS?: string;
  GEMINI_API_KEY?: string;
  IMGBB_API_KEY?: string;
  SENDPULSE_CLIENT_ID?: string;
  SENDPULSE_CLIENT_SECRET?: string;
  SENDPULSE_FROM_EMAIL?: string;
  SENDPULSE_FROM_NAME?: string;
  GOOGLE_SCRIPT_URL?: string;
  EMAIL_WEBHOOK_SECRET?: string;
  INDEXNOW_KEY?: string;
  COURIER_WEBHOOK_SECRET?: string;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  PORT?: string;
}

export interface AuthUser {
  id: string;
  phone: string;
  email?: string;
  fullName: string;
  role: 'user' | 'admin' | 'super_admin' | 'sysadm';
  isDemo?: boolean;
}

export interface Variables {
  db: AppDatabase;
  user: AuthUser | null;
  isAdmin: boolean;
  isDemo: boolean;
  requestId: string;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: Variables;
}
