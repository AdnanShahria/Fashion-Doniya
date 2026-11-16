import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../types';

const MAX_RATE_LIMIT_ENTRIES = 10_000;

interface RateLimitBucket {
  count: number;
  resetAt: number;
  violations: number;
}

interface JailEntry {
  until: number;
  strikes: number;
}

const buckets = new Map<string, RateLimitBucket>();
const jailMap = new Map<string, JailEntry>();

function getClientIp(headers: Headers, env?: AppEnv['Bindings']): string {
  const cfIp = headers.get('cf-connecting-ip')?.trim();
  if (cfIp) return cfIp;

  const trustProxy = env?.TRUST_PROXY === 'true' || env?.NODE_ENV !== 'production';
  if (trustProxy) {
    const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return forwarded;
    const realIp = headers.get('x-real-ip')?.trim();
    if (realIp) return realIp;
  }
  return '127.0.0.1';
}

function enforceMapCap<K, V>(map: Map<K, V>) {
  if (map.size >= MAX_RATE_LIMIT_ENTRIES) {
    const oldestKey = map.keys().next().value;
    if (oldestKey !== undefined) {
      map.delete(oldestKey);
    }
  }
}

export function jailIp(ip: string, durationMs = 5 * 60 * 1000): void {
  enforceMapCap(jailMap);
  const existing = jailMap.get(ip);
  const strikes = (existing?.strikes || 0) + 1;
  const escalatedMs = durationMs * Math.min(strikes, 6);
  jailMap.set(ip, {
    until: Date.now() + escalatedMs,
    strikes,
  });
}

function createRateLimiter(options: {
  name: string;
  windowMs: number;
  maxRequests: number;
  jailOnThreshold?: number;
}): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const ip = getClientIp(c.req.raw.headers, c.env);
    const now = Date.now();

    const jailed = jailMap.get(ip);
    if (jailed && jailed.until > now) {
      const retryAfter = Math.ceil((jailed.until - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(
        {
          success: false,
          code: 'RATE_LIMITED_JAILED',
          message: 'অতিরিক্ত অনুরোধের কারণে সাময়িকভাবে সীমাবদ্ধ করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
          retryAfterSeconds: retryAfter,
        },
        429
      );
    }
    if (jailed && jailed.until <= now) {
      jailMap.delete(ip);
    }

    const key = `${options.name}:${ip}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      enforceMapCap(buckets);
      bucket = {
        count: 0,
        resetAt: now + options.windowMs,
        violations: bucket?.violations || 0,
      };
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > options.maxRequests) {
      bucket.violations += 1;
      if (options.jailOnThreshold && bucket.violations >= options.jailOnThreshold) {
        jailIp(ip);
      }
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      c.header('Retry-After', String(retryAfter));
      return c.json(
        {
          success: false,
          code: 'RATE_LIMITED',
          message: 'অনুরোধের সীমা অতিক্রম করেছে। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।',
          retryAfterSeconds: retryAfter,
        },
        429
      );
    }

    await next();
  };
}

export const globalApiRateLimiter = createRateLimiter({
  name: 'global',
  windowMs: 60_000,
  maxRequests: 240,
  jailOnThreshold: 10,
});

export const authRateLimiter = createRateLimiter({
  name: 'auth',
  windowMs: 15 * 60_000,
  maxRequests: 30,
  jailOnThreshold: 5,
});

export const checkoutRateLimiter = createRateLimiter({
  name: 'checkout',
  windowMs: 5 * 60_000,
  maxRequests: 25,
  jailOnThreshold: 4,
});

export const pollingRateLimiter = createRateLimiter({
  name: 'polling',
  windowMs: 60_000,
  maxRequests: 60,
});

const LOGIN_FAILURE_WINDOW_MS = 15 * 60_000;
const MAX_LOGIN_FAILURES = 10;
const loginFailures = new Map<string, { count: number; resetAt: number }>();

export function checkLoginThrottle(scope: string, identifier: string): number {
  const key = `${scope}:${identifier.trim().toLowerCase()}`;
  const entry = loginFailures.get(key);
  if (!entry) return 0;
  const now = Date.now();
  if (entry.resetAt <= now) {
    loginFailures.delete(key);
    return 0;
  }
  if (entry.count >= MAX_LOGIN_FAILURES) {
    return Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  }
  return 0;
}

export function recordLoginFailure(scope: string, identifier: string): void {
  const key = `${scope}:${identifier.trim().toLowerCase()}`;
  const now = Date.now();
  const existing = loginFailures.get(key);
  if (!existing || existing.resetAt <= now) {
    enforceMapCap(loginFailures);
    loginFailures.set(key, { count: 1, resetAt: now + LOGIN_FAILURE_WINDOW_MS });
    return;
  }
  existing.count += 1;
  loginFailures.set(key, existing);
}

export function clearLoginFailures(scope: string, identifier: string): void {
  const key = `${scope}:${identifier.trim().toLowerCase()}`;
  loginFailures.delete(key);
}
