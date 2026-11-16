import type { Context } from 'hono';
import { eq } from 'drizzle-orm';
import type { AppEnv, AuthUser, Bindings } from '../types';
import { users, systemSettings } from '../../../backend/server/db/schemas/index';
import { createDb } from './db-factory';
import { safeJsonParse } from './helpers';

const encoder = new TextEncoder();
const DEV_FALLBACK_JWT_SECRET = 'dev-fashion-doniya-jwt-secret-change-in-production-64chars';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function sha256Bytes(input: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return new Uint8Array(digest);
}

/**
 * Timing-safe string equality via SHA-256 hash comparison.
 */
export async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  if (!a || !b) return false;
  const [hashA, hashB] = await Promise.all([sha256Bytes(a), sha256Bytes(b)]);
  let diff = 0;
  for (let i = 0; i < hashA.length; i++) {
    diff |= hashA[i] ^ hashB[i];
  }
  return diff === 0;
}

export function resolveJwtSecret(env: Bindings): string {
  const secret = String(env?.JWT_SECRET || '').trim();
  const isProd = env?.NODE_ENV === 'production' || Boolean(env?.DB);
  if (isProd && secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters in production.');
  }
  if (secret.length >= 16) return secret;
  if (isProd) {
    throw new Error('JWT_SECRET must be set and at least 32 characters in production.');
  }
  return DEV_FALLBACK_JWT_SECRET;
}

export async function hashPassword(
  password: string,
  saltHex?: string
): Promise<{ salt: string; hash: string }> {
  const saltBytes = saltHex
    ? new Uint8Array(saltHex.match(/.{1,2}/g)?.map((h) => parseInt(h, 16)) || [])
    : crypto.getRandomValues(new Uint8Array(16));

  const actualSaltHex =
    saltHex || Array.from(saltBytes, (b) => b.toString(16).padStart(2, '0')).join('');

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derived), (b) => b.toString(16).padStart(2, '0')).join(
    ''
  );
  return { salt: actualSaltHex, hash: hashHex };
}

export async function verifyPassword(
  password: string,
  saltHex: string,
  expectedHashHex: string
): Promise<boolean> {
  if (!password || !saltHex || !expectedHashHex) return false;
  try {
    const { hash } = await hashPassword(password, saltHex);
    return await constantTimeEqual(hash, expectedHashHex);
  } catch {
    return false;
  }
}

export function generateSecureOtp(): string {
  const buf = new Uint32Array(1);
  const range = 900000;
  const limit = 0xffffffff - (0xffffffff % range);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return String(100000 + (buf[0] % range));
}

export function computePasswordVersion(hashOrSalt: string | null | undefined): string {
  return (hashOrSalt || '').slice(0, 12);
}

export interface JwtClaims {
  sub: string;
  role: AuthUser['role'];
  phone?: string;
  email?: string;
  fullName?: string;
  isDemo?: boolean;
  pwdVer?: string;
  iat: number;
  exp: number;
}

export async function signJwt(
  payload: Omit<JwtClaims, 'iat' | 'exp'>,
  secret: string,
  expiresInSeconds = 60 * 60 * 24 * 7
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claims: JwtClaims = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerPart = toBase64Url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payloadPart = toBase64Url(encoder.encode(JSON.stringify(claims)));
  const signingInput = `${headerPart}.${payloadPart}`;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));
  return `${signingInput}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifyJwt(token: string, secret: string): Promise<JwtClaims | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerPart, payloadPart, sigPart] = parts;

    const headerJson = JSON.parse(new TextDecoder().decode(fromBase64Url(headerPart)));
    if (headerJson?.alg !== 'HS256') return null;

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(sigPart) as BufferSource,
      encoder.encode(`${headerPart}.${payloadPart}`) as BufferSource
    );
    if (!valid) return null;

    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadPart))) as JwtClaims;
    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== 'number' || claims.exp <= now) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

export async function resolveAuthContext(c: Context<AppEnv>): Promise<{
  user: AuthUser | null;
  isAdmin: boolean;
  isDemo: boolean;
}> {
  const env = c.env;
  // Security Hardening: Static admin keys and JWTs must only be accepted via headers,
  // never via URL query parameters (prevents leaking tokens in browser history and logs).
  const adminKeyHeader =
    c.req.header('x-admin-token') ||
    c.req.header('x-api-key') ||
    '';

  const expectedAdminKey = String(env?.ADMIN_API_KEY || '').trim();
  const expectedSysadmSecret = String(env?.SYSADM_SECRET || '').trim();

  if (
    adminKeyHeader &&
    ((expectedAdminKey && (await constantTimeEqual(adminKeyHeader, expectedAdminKey))) ||
      (expectedSysadmSecret && (await constantTimeEqual(adminKeyHeader, expectedSysadmSecret))))
  ) {
    return {
      user: {
        id: 'admin-api-key',
        phone: '',
        email: env?.ADMIN_EMAIL || 'admin@fashiondoniyabd.com',
        fullName: 'Fashion Doniya Admin',
        role: 'super_admin',
      },
      isAdmin: true,
      isDemo: false,
    };
  }

  const authHeader = c.req.header('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : adminKeyHeader;

  if (bearerToken) {
    const secret = resolveJwtSecret(env);
    const claims = await verifyJwt(bearerToken, secret);
    if (claims) {
      let resolvedRole: AuthUser['role'] = claims.role;
      let resolvedPhone = String(claims.phone || '');
      let resolvedEmail = claims.email ? String(claims.email) : undefined;
      let resolvedFullName = String(claims.fullName || 'User');

      const db = c.get('db') || createDb(env);
      if (db) {
        try {
          if (claims.sub === 'admin-primary') {
            const row = await db
              .select()
              .from(systemSettings)
              .where(eq(systemSettings.key, 'admin_account'))
              .get();
            const admin = safeJsonParse<{
              email?: string;
              name?: string;
              role?: AuthUser['role'];
              passwordHash?: string;
            } | null>(row?.value, null);
            if (
              !admin ||
              !admin.passwordHash ||
              !claims.pwdVer ||
              claims.pwdVer !== computePasswordVersion(admin.passwordHash)
            ) {
              return { user: null, isAdmin: false, isDemo: false };
            }
            resolvedRole =
              admin.role === 'admin' || admin.role === 'super_admin' || admin.role === 'sysadm'
                ? admin.role
                : 'super_admin';
            if (admin.email) resolvedEmail = admin.email;
            if (admin.name) resolvedFullName = admin.name;
          } else if (claims.sub !== 'sysadm') {
            const userRow = await db.select().from(users).where(eq(users.id, claims.sub)).get();
            if (!userRow || userRow.status === 'blocked') {
              return { user: null, isAdmin: false, isDemo: false };
            }
            if (
              userRow.passwordHash &&
              (!claims.pwdVer || claims.pwdVer !== computePasswordVersion(userRow.passwordHash))
            ) {
              return { user: null, isAdmin: false, isDemo: false };
            }
            resolvedRole =
              userRow.role === 'admin' ||
              userRow.role === 'super_admin' ||
              userRow.role === 'sysadm'
                ? userRow.role
                : 'user';
            resolvedPhone = String(userRow.phone || resolvedPhone);
            resolvedEmail = userRow.email ? String(userRow.email) : undefined;
            resolvedFullName = String(userRow.fullName || resolvedFullName);
          }
        } catch {
          // Fail closed when DB verification fails so blocked/revoked tokens cannot pass
          return { user: null, isAdmin: false, isDemo: false };
        }
      }

      const isAdminRole =
        resolvedRole === 'admin' || resolvedRole === 'super_admin' || resolvedRole === 'sysadm';

      return {
        user: {
          id: claims.sub,
          phone: resolvedPhone,
          email: resolvedEmail,
          fullName: resolvedFullName,
          role: resolvedRole,
          isDemo: Boolean(claims.isDemo),
        },
        isAdmin: isAdminRole,
        isDemo: Boolean(claims.isDemo),
      };
    }
  }

  return { user: null, isAdmin: false, isDemo: false };
}
