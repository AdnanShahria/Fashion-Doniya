import type { Bindings } from '../types';

const CACHE_NAME = 'fashion-doniya-super-cache';
const HOME_BULK_KV_KEY = 'home_bulk_v1';
const HOME_BULK_CACHE_URL = 'https://cache.fashiondoniyabd.internal/api/v1/bulk/home';
const DEFAULT_TTL_SECONDS = 3600; // 1 hour

interface MemoryCacheEntry {
  value: unknown;
  expiresAt: number;
}

const memoryFallback = new Map<string, MemoryCacheEntry>();
const MAX_MEMORY_CACHE_ENTRIES = 200;

async function getCfCache(): Promise<Cache | null> {
  try {
    if (typeof caches !== 'undefined') {
      if ('open' in caches && typeof caches.open === 'function') {
        return await caches.open(CACHE_NAME);
      }
      if ('default' in caches) {
        return (caches as unknown as { default: Cache }).default;
      }
    }
  } catch {
    // Not in Workers Cache environment
  }
  return null;
}

export async function getEdgeCache<T>(env: Bindings, key: string): Promise<T | null> {
  // 1. Cloudflare KV
  if (env?.CACHE_KV) {
    try {
      const raw = await env.CACHE_KV.get(key, 'json');
      if (raw !== null) return raw as T;
    } catch {
      // ignore KV error
    }
  }

  // 2. Cloudflare Cache API
  if (key === HOME_BULK_KV_KEY) {
    const cfCache = await getCfCache();
    if (cfCache) {
      try {
        const res = await cfCache.match(HOME_BULK_CACHE_URL);
        if (res) {
          return (await res.json()) as T;
        }
      } catch {
        // ignore
      }
    }
  }

  // 3. In-memory fallback (local Bun dev)
  const mem = memoryFallback.get(key);
  if (mem) {
    if (mem.expiresAt > Date.now()) {
      return mem.value as T;
    }
    memoryFallback.delete(key);
  }

  return null;
}

export async function setEdgeCache<T>(
  env: Bindings,
  key: string,
  value: T,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<void> {
  if (memoryFallback.size >= MAX_MEMORY_CACHE_ENTRIES) {
    const oldest = memoryFallback.keys().next().value;
    if (oldest) memoryFallback.delete(oldest);
  }
  memoryFallback.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });

  if (env?.CACHE_KV) {
    try {
      await env.CACHE_KV.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
    } catch {
      // ignore KV write errors
    }
  }

  if (key === HOME_BULK_KV_KEY) {
    const cfCache = await getCfCache();
    if (cfCache) {
      try {
        await cfCache.put(
          HOME_BULK_CACHE_URL,
          new Response(JSON.stringify(value), {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': `public, max-age=${ttlSeconds}`,
            },
          })
        );
      } catch {
        // ignore
      }
    }
  }
}

export async function getHomeCache<T>(env: Bindings): Promise<T | null> {
  return getEdgeCache<T>(env, HOME_BULK_KV_KEY);
}

export async function setHomeCache<T>(env: Bindings, value: T): Promise<void> {
  return setEdgeCache(env, HOME_BULK_KV_KEY, value, DEFAULT_TTL_SECONDS);
}

export async function invalidateHomeCache(env?: Bindings): Promise<void> {
  memoryFallback.delete(HOME_BULK_KV_KEY);
  memoryFallback.clear();

  if (env?.CACHE_KV) {
    try {
      await env.CACHE_KV.delete(HOME_BULK_KV_KEY);
    } catch {
      // ignore
    }
  }

  const cfCache = await getCfCache();
  if (cfCache) {
    try {
      await cfCache.delete(HOME_BULK_CACHE_URL);
    } catch {
      // ignore
    }
  }
}
