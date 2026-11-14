import { drizzle as drizzleD1, DrizzleD1Database } from 'drizzle-orm/d1';
import { drizzle as drizzleLibsql, LibSQLDatabase } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';
import * as schema from '../../../backend/server/db/schemas/index';
import type { Bindings } from '../types';

export type AppDatabase = DrizzleD1Database<typeof schema>;

const d1InstanceCache = new WeakMap<D1Database, DrizzleD1Database<typeof schema>>();

const MAX_LIBSQL_CLIENTS = 20;
const libsqlPool = new Map<string, { client: Client; db: LibSQLDatabase<typeof schema> }>();

let shutdownRegistered = false;
function registerShutdownHooks() {
  if (shutdownRegistered || typeof process === 'undefined' || typeof process.on !== 'function') {
    return;
  }
  shutdownRegistered = true;
  const closePool = () => {
    for (const entry of libsqlPool.values()) {
      try {
        entry.client.close();
      } catch {
        // ignore close errors
      }
    }
    libsqlPool.clear();
  };
  process.once('SIGINT', closePool);
  process.once('SIGTERM', closePool);
}

/**
 * Dual-provider Drizzle database factory:
 * Priority 1: Cloudflare D1 (env.DB binding)
 * Priority 2: Turso / local SQLite via @libsql/client (defaults to file:backend/dev.db)
 */
export function createDb(env: Bindings): AppDatabase {
  if (env?.DB) {
    const cached = d1InstanceCache.get(env.DB);
    if (cached) return cached;
    const db = drizzleD1(env.DB, { schema });
    d1InstanceCache.set(env.DB, db);
    return db;
  }

  const url = env?.TURSO_URL || 'file:backend/dev.db';
  const authToken = env?.TURSO_AUTH_TOKEN || undefined;
  const poolKey = `${url}::${authToken || ''}`;

  const existing = libsqlPool.get(poolKey);
  if (existing) {
    return existing.db as unknown as AppDatabase;
  }

  if (libsqlPool.size >= MAX_LIBSQL_CLIENTS) {
    const oldestKey = libsqlPool.keys().next().value;
    if (oldestKey) {
      const oldest = libsqlPool.get(oldestKey);
      try {
        oldest?.client.close();
      } catch {
        // ignore
      }
      libsqlPool.delete(oldestKey);
    }
  }

  const client = createClient({ url, authToken });
  const db = drizzleLibsql(client, { schema });
  libsqlPool.set(poolKey, { client, db });
  registerShutdownHooks();
  return db as unknown as AppDatabase;
}
