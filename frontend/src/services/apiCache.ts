interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 30_000;
const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

export const apiCache = {
  get<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      cache.delete(key);
      return null;
    }
    return entry.value as T;
  },

  set<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  },

  async dedup<T>(key: string, fetcher: () => Promise<T>, ttlMs = DEFAULT_TTL_MS): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const existing = inFlight.get(key);
    if (existing) return existing as Promise<T>;

    const promise = fetcher()
      .then((res) => {
        this.set(key, res, ttlMs);
        return res;
      })
      .finally(() => {
        inFlight.delete(key);
      });
    inFlight.set(key, promise);
    return promise;
  },

  invalidatePrefix(prefix?: string): void {
    if (!prefix) {
      cache.clear();
      return;
    }
    for (const key of cache.keys()) {
      if (key.includes(prefix)) {
        cache.delete(key);
      }
    }
  },
};
