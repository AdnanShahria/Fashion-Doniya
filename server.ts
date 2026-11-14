import { app } from './functions/api/app';
import { invalidateHomeCache } from './functions/api/utils/cache';
import { clearBulkMicroCache } from './functions/api/routers/bulk';
import type { Bindings } from './functions/api/types';

const port = Number(process.env.PORT || 9998);

function scheduleMidnightCacheRefresh() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 5, 0);
  const msUntilMidnight = Math.max(60_000, nextMidnight.getTime() - now.getTime());

  setTimeout(async () => {
    await invalidateHomeCache(process.env as unknown as Bindings);
    clearBulkMicroCache();
    console.info('[Cache] Midnight cache invalidation executed.');
    scheduleMidnightCacheRefresh();
  }, msUntilMidnight);
}

scheduleMidnightCacheRefresh();

const server = Bun.serve({
  port,
  hostname: '0.0.0.0',
  fetch(req) {
    return app.fetch(req, process.env as unknown as Bindings);
  },
});

console.log(`Fashion Doniya Edge API (Bun) listening on http://127.0.0.1:${server.port}`);
