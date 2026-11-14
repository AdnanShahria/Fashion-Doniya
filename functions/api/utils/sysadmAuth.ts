import type { Context } from 'hono';
import type { AppEnv, Bindings } from '../types';
import { constantTimeEqual, signJwt, verifyJwt } from './auth-helper';

export const SYSADM_EMAIL = 'sysadm@fashiondoniyabd.com';

let cachedEphemeralSecret: string | null = null;

function resolveSysadmSecret(env: Bindings): string {
  const configured = String(env?.SYSADM_SECRET || '').trim();
  if (configured.length >= 16) return configured;
  if (!cachedEphemeralSecret) {
    cachedEphemeralSecret = crypto.randomUUID() + '-' + crypto.randomUUID();
  }
  return cachedEphemeralSecret;
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
