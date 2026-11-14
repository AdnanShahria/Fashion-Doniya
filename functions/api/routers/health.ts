import { Hono } from 'hono';
import type { AppEnv } from '../types';

export const healthRouter = new Hono<AppEnv>();

healthRouter.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'fashion-doniya-edge-api',
    runtime: c.env?.DB ? 'cloudflare-d1' : 'libsql-sqlite',
    timestamp: new Date().toISOString(),
  });
});
