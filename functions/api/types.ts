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
  ORBITMAIL_API_KEY?: string;
  ORBITMAIL_URL?: string;
  ORBITMAIL_FROM?: string;
  SENDPULSE_CLIENT_ID?: string;
  SENDPULSE_CLIENT_SECRET?: string;
  SENDPULSE_API_USER_ID?: string;
  SENDPULSE_API_SECRET?: string;
  SENDPULSE_API_KEY?: string;
  SENDPULSE_API_URL?: string;
  SENDPULSE_FROM_EMAIL?: string;
  SENDPULSE_FROM_NAME?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_FROM_NAME?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_SESSION_TOKEN?: string;
  AWS_REGION?: string;
  SES_ACCESS_KEY_ID?: string;
  SES_SECRET_ACCESS_KEY?: string;
  SES_REGION?: string;
  SES_FROM_EMAIL?: string;
  SES_FROM_NAME?: string;
  SES_CONFIGURATION_SET?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_NAME?: string;
  EMAIL_PROVIDER_ORDER?: string;
  GOOGLE_SCRIPT_URL?: string;
  EMAIL_WEBHOOK_SECRET?: string;
  INDEXNOW_KEY?: string;
  COURIER_WEBHOOK_SECRET?: string;
  SMS_PROVIDER?: string;
  SMS_ENABLED?: string;
  SMS_ALWAYS_SEND?: string;
  GREENWEB_API_TOKEN?: string;
  BULKSMSBD_API_KEY?: string;
  BULKSMSBD_SENDER_ID?: string;
  SMS_SENDER_ID?: string;
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
