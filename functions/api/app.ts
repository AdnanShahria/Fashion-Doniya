import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import type { AppEnv, Bindings } from './types';
import { createDb } from './utils/db-factory';
import { ensureSeeded } from './utils/seed';
import { resolveAuthContext } from './utils/auth-helper';
import { formatSanitizedError, isDemoModeActive } from './utils/helpers';
import { globalApiRateLimiter } from './utils/rateLimiter';
import { DEFAULT_INDEXNOW_KEY } from './config/cloudflare-env';
import {
  buildMerchantFeedXml,
  buildSitemapXml,
  serveR2MediaRequest,
} from './utils/edge-handlers';

import { healthRouter } from './routers/health';
import { bulkRouter } from './routers/bulk';
import { authRouter, adminAuthRouter } from './routers/auth';
import { productsRouter, adminProductsRouter } from './routers/products';
import { categoriesRouter, adminCategoriesRouter } from './routers/categories';
import {
  fabricCollectionsRouter,
  adminFabricCollectionsRouter,
} from './routers/fabricCollections';
import { measurementsRouter, adminMeasurementsRouter } from './routers/measurements';
import { ordersRouter, adminOrdersRouter } from './routers/orders';
import { courierRouter } from './routers/courier';
import { customersRouter, adminCustomersRouter } from './routers/customers';
import {
  addressesRouter,
  walletRouter,
  returnsRouter,
  loyaltyRouter,
  notificationsRouter,
  reviewsRouter,
  couponsRouter,
  cartRouter,
  bannersRouter,
  newsletterRouter,
  popupsRouter,
} from './routers/commerce';
import { contentRouter, adminContentRouter } from './routers/content';
import { aiRouter } from './routers/ai';
import { systemRouter, adminSystemRouter, seoRouter } from './routers/system';
import { sysadmRouter } from './routers/sysadm';

export function isAllowedStorefrontOrigin(origin: string | undefined, env?: Bindings): boolean {
  if (!origin) return true; // non-browser or same-origin requests without Origin header
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.pages.dev') ||
      hostname === 'fashiondoniyabd.com' ||
      hostname === 'www.fashiondoniyabd.com'
    ) {
      return true;
    }

    if (env?.SITE_URL) {
      try {
        if (new URL(env.SITE_URL).origin === parsed.origin) return true;
      } catch {
        // ignore invalid SITE_URL
      }
    }

    if (env?.ALLOWED_ORIGINS) {
      const allowed = env.ALLOWED_ORIGINS.split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (allowed.includes(parsed.origin) || allowed.includes(hostname)) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const AUTHENTICATED_USER_PREFIXES = [
  '/addresses',
  '/wallet',
  '/notifications',
  '/returns',
  '/users/',
  '/bulk/user',
];

function createApiSubApp() {
  const sub = new Hono<AppEnv>();

  // 1. Global Rate Limiter
  sub.use('*', globalApiRateLimiter);

  // 2. Auth Context Resolution
  sub.use('*', async (c, next) => {
    const { user, isAdmin, isDemo } = await resolveAuthContext(c);
    c.set('user', user);
    c.set('isAdmin', isAdmin);
    c.set('isDemo', isDemo);
    await next();
  });

  // 3. Demo Mode Lock (blocks non-auth/non-sysadm mutating requests when demo mode is active)
  sub.use('*', async (c, next) => {
    if (MUTATION_METHODS.has(c.req.method)) {
      const path = c.req.path;
      const isAuthPath =
        path.includes('/auth/') ||
        path.includes('/sysadm/') ||
        path.includes('/orders/verify');
      if (!isAuthPath) {
        const db = c.get('db');
        if (c.get('isDemo') || (await isDemoModeActive(db, c.env))) {
          return c.json(
            {
              success: false,
              code: 'DEMO_MODE_READ_ONLY',
              message: 'ডেমো মোড সক্রিয় থাকায় কোনো তথ্য পরিবর্তন করা যাবে না।',
            },
            403
          );
        }
      }
    }
    await next();
  });

  // 4. Route Authorization Guard
  sub.use('*', async (c, next) => {
    const path = c.req.path;
    const isAdminRoute =
      path.includes('/admin/') ||
      path.endsWith('/admin') ||
      path.includes('/bulk/admin-stats') ||
      path.includes('/seo/ping');

    if (isAdminRoute && !path.includes('/admin/auth/login')) {
      if (!c.get('isAdmin')) {
        return c.json(
          {
            success: false,
            code: 'UNAUTHORIZED_ADMIN',
            message: 'অ্যাডমিন অনুমোদন ব্যর্থ হয়েছে (Unauthorized Admin Access)।',
          },
          401
        );
      }
    }

    const requiresAuthUser = AUTHENTICATED_USER_PREFIXES.some((prefix) =>
      path.includes(prefix)
    );
    if (requiresAuthUser && !c.get('user') && !c.get('isAdmin')) {
      return c.json({ success: false, message: 'অনুগ্রহ করে প্রথমে লগইন করুন।' }, 401);
    }

    await next();
  });

  // Mount Routers
  sub.route('/health', healthRouter);
  sub.route('/bulk', bulkRouter);
  sub.get('/bootstrap', async (c) => {
    const url = new URL(c.req.url);
    url.pathname = url.pathname.replace(/\/bootstrap$/, '/bulk/home');
    return sub.fetch(new Request(url.toString(), c.req.raw), c.env);
  });

  sub.route('/auth', authRouter);
  sub.route('/admin/auth', adminAuthRouter);

  sub.route('/products', productsRouter);
  sub.route('/admin/products', adminProductsRouter);

  sub.route('/categories', categoriesRouter);
  sub.route('/admin', adminCategoriesRouter);

  sub.route('/fabric-collections', fabricCollectionsRouter);
  sub.route('/admin/fabric-collections', adminFabricCollectionsRouter);

  sub.route('/', measurementsRouter);
  sub.route('/admin', adminMeasurementsRouter);

  sub.route('/orders', ordersRouter);
  sub.route('/admin/orders', adminOrdersRouter);

  sub.route('/courier', courierRouter);

  sub.route('/customers', customersRouter);
  sub.route('/admin/customers', adminCustomersRouter);

  sub.route('/addresses', addressesRouter);
  sub.route('/wallet', walletRouter);
  sub.route('/returns', returnsRouter);
  sub.route('/loyalty', loyaltyRouter);
  sub.route('/notifications', notificationsRouter);
  sub.route('/reviews', reviewsRouter);
  sub.route('/coupons', couponsRouter);
  sub.route('/cart', cartRouter);
  sub.route('/banners', bannersRouter);
  sub.route('/newsletter', newsletterRouter);
  sub.route('/popups', popupsRouter);

  sub.route('/', contentRouter);
  sub.route('/admin', adminContentRouter);

  sub.route('/ai', aiRouter);
  sub.route('/', systemRouter);
  sub.route('/admin', adminSystemRouter);
  sub.route('/seo', seoRouter);

  return sub;
}

export const app = new Hono<AppEnv>();

// 1. Env Bridge: merge process.env into c.env so Bun/Node and Cloudflare Workers behave identically
app.use('*', async (c, next) => {
  const procEnv =
    typeof process !== 'undefined' && process.env ? (process.env as Record<string, string | undefined>) : {};
  const mergedEnv = { ...procEnv, ...(c.env || {}) } as Bindings;
  (c as unknown as { env: Bindings }).env = mergedEnv;
  c.set('requestId', crypto.randomUUID());
  await next();
});

// 2. Security Headers
app.use(
  '*',
  secureHeaders({
    xFrameOptions: 'SAMEORIGIN',
    xContentTypeOptions: 'nosniff',
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    referrerPolicy: 'strict-origin-when-cross-origin',
    crossOriginResourcePolicy: 'cross-origin',
    crossOriginOpenerPolicy: 'same-origin',
    contentSecurityPolicy: {
      frameAncestors: ["'self'"],
    },
  })
);

// 3. CORS
app.use(
  '/api/*',
  cors({
    origin: (origin, c) => (isAllowedStorefrontOrigin(origin, c.env) ? origin || '*' : ''),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'x-admin-token',
      'x-api-key',
      'x-sysadm-secret',
      'x-courier-webhook-secret',
      'x-session-id',
    ],
    credentials: true,
    maxAge: 86400,
  })
);

// 4. CSRF + Mutation Origin & Content-Type Guard
app.use(
  '/api/*',
  csrf({
    origin: (origin, c) => isAllowedStorefrontOrigin(origin, c.env),
  })
);

app.use('/api/*', async (c, next) => {
  if (MUTATION_METHODS.has(c.req.method)) {
    const secFetchSite = (c.req.header('sec-fetch-site') || '').toLowerCase();
    if (secFetchSite === 'cross-site') {
      return c.json({ success: false, message: 'Cross-site mutation blocked.' }, 403);
    }

    const originHeader = c.req.header('origin');
    const refererHeader = c.req.header('referer');
    if (originHeader && !isAllowedStorefrontOrigin(originHeader, c.env)) {
      return c.json({ success: false, message: 'Untrusted Origin blocked.' }, 403);
    }
    if (!originHeader && refererHeader && !isAllowedStorefrontOrigin(refererHeader, c.env)) {
      return c.json({ success: false, message: 'Untrusted Referer blocked.' }, 403);
    }

    const contentType = (c.req.header('content-type') || '').toLowerCase();
    const isUploadPath = c.req.path.includes('/upload');
    if (
      !isUploadPath &&
      (contentType.includes('application/x-www-form-urlencoded') ||
        contentType.includes('text/plain'))
    ) {
      return c.json(
        { success: false, message: 'Unsupported Media Type for JSON mutation endpoint.' },
        415
      );
    }
  }
  await next();
});

// 5. Fast-Path Health Check (before logger & DB setup)
app.get('/api/health', (c) =>
  c.json({ status: 'ok', service: 'fashion-doniya-edge-api', timestamp: new Date().toISOString() })
);
app.get('/api/v1/health', (c) =>
  c.json({ status: 'ok', service: 'fashion-doniya-edge-api', timestamp: new Date().toISOString() })
);

// 6. Request Logger (non-health routes)
app.use('/api/*', logger());

// 7. DB Injection Middleware + Auto-Seed
app.use('/api/*', async (c, next) => {
  const db = createDb(c.env);
  await ensureSeeded(db, c.env);
  c.set('db', db);
  await next();
});

// 8. Sanitized Error Handler
app.onError((err, c) => {
  const isDev = c.env?.NODE_ENV !== 'production';
  if (isDev) {
    console.error('[API Error]', err);
  }
  return c.json(formatSanitizedError(err, isDev), 500);
});

// 9. SuperAdmin (/api/v1/sysadm) mounted directly on app
app.route('/api/v1/sysadm', sysadmRouter);

// 10. Mount Versioned v1 API (plus /api alias for backwards compatibility)
const v1SubApp = createApiSubApp();
app.route('/api/v1', v1SubApp);
app.route('/api', v1SubApp);

// 11. Edge Media, Sitemap, Merchant Feed & IndexNow routes (also handled by Pages Functions in prod)
app.get('/media/*', async (c) => {
  const key = c.req.path.replace(/^\/media\//, '');
  return serveR2MediaRequest(c.req.raw, c.env, key);
});

app.get('/sitemap.xml', async (c) => {
  const origin = new URL(c.req.url).origin;
  const xml = await buildSitemapXml(c.env, origin);
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=1800' },
  });
});

app.get('/feed.xml', async (c) => {
  const origin = new URL(c.req.url).origin;
  const xml = await buildMerchantFeedXml(c.env, origin);
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=1800' },
  });
});

app.get('/:keyFile', (c, next) => {
  const file = c.req.param('keyFile');
  const expectedKey = String(c.env?.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY);
  if (file === `${expectedKey}.txt`) {
    return c.text(expectedKey);
  }
  return next();
});
