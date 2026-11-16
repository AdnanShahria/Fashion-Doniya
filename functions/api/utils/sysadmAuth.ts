import type { Context } from 'hono';
import type { AppEnv, Bindings } from '../types';
import { constantTimeEqual, signJwt, verifyJwt } from './auth-helper';

export const SYSADM_EMAIL = 'sysadm@fashiondoniyabd.com';
const DEV_FALLBACK_SYSADM_SECRET = 'dev-fashion-doniya-sysadm-secret-change-in-production-64chars';

function resolveSysadmSecret(env: Bindings): string {
  const configured = String(env?.SYSADM_SECRET || '').trim();
  const isProd = env?.NODE_ENV === 'production' || Boolean(env?.DB);
  if (isProd && configured.length < 32) {
    throw new Error('SYSADM_SECRET must be set and at least 32 characters in production.');
  }
  if (configured.length >= 16) return configured;
  if (isProd) {
    throw new Error('SYSADM_SECRET must be set and at least 32 characters in production.');
  }
  return DEV_FALLBACK_SYSADM_SECRET;
}

export function getSysadmEmail(env: Bindings): string {
  return String(env?.SYSADM_EMAIL || SYSADM_EMAIL).trim().toLowerCase();
}

export async function signSysadmJwt(env: Bindings, email: string): Promise<string> {
  return signJwt(
    {
      sub: 'sysadm',
      email,
      fullName: 'System Administrator',
      role: 'sysadm',
    },
    resolveSysadmSecret(env),
    60 * 60 * 4
  );
}

export async function verifySysadmRequest(c: Context<AppEnv>): Promise<boolean> {
  const env = c.env;
  const headerSecret = c.req.header('x-sysadm-secret') || c.req.header('x-api-key') || '';
  const configured = String(env?.SYSADM_SECRET || '').trim();
  if (configured && headerSecret && (await constantTimeEqual(headerSecret, configured))) {
    return true;
  }

  const auth = c.req.header('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    const claims = await verifyJwt(token, resolveSysadmSecret(env));
    if (claims && claims.role === 'sysadm') {
      return true;
    }
  }
  return false;
}
