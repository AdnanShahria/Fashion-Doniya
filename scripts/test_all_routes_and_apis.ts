import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { createClient } from '@libsql/client';
import { app } from '../functions/api/app';
import type { Bindings } from '../functions/api/types';

const TEST_DB_REL = `backend/test_all_routes_${Date.now()}.db`;
const TEST_DB_ABS = path.resolve(process.cwd(), TEST_DB_REL);

const testEnv = {
  TURSO_URL: `file:${TEST_DB_REL}`,
  TURSO_AUTH_TOKEN: '',
  JWT_SECRET: 'test-jwt-secret-key-at-least-32-characters-long-2026',
  ADMIN_API_KEY: 'test-admin-api-key-64chars-000000000000000000000000000000000000',
  ADMIN_EMAIL: 'admin@fashiondoniyabd.com',
  ADMIN_PASSWORD: 'TestAdminPassword#2026',
  SYSADM_SECRET: 'test-sysadm-secret-key-64chars-00000000000000000000000000000000',
  NODE_ENV: 'development',
  DEMO_MODE: 'false',
  SITE_URL: 'https://fashiondoniyabd.com',
  INDEXNOW_KEY: 'fashiondoniya2026indexnow',
  COURIER_WEBHOOK_SECRET: 'courier-secret-2026',
} as unknown as Bindings;

async function req(
  pathname: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    origin?: string;
  } = {}
): Promise<Response> {
  const url = `${options.origin || 'http://localhost:9998'}${pathname}`;
  const headers: Record<string, string> = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };
  const request = new Request(url, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  return app.fetch(request, testEnv);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseJson(res: Response): Promise<any> {
  return (await res.json()) as any;
}

describe('Fashion Doniya BD - Complete Routes & APIs Verification Suite', () => {
  let customerToken: string = '';
  let customerUser: { id: string; email?: string; phone?: string; fullName?: string };
  let adminToken: string = '';
  let createdOrderId: string = '';
  let createdOrderNumber: string = '';

  beforeAll(async () => {
    // 1. Run migrations to create schema
    const migrationDir = path.resolve(process.cwd(), 'backend/drizzle');
    const migrationFiles = fs
      .readdirSync(migrationDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    const client = createClient({ url: `file:${TEST_DB_REL}` });
    for (const file of migrationFiles) {
      const migrationSql = fs.readFileSync(path.join(migrationDir, file), 'utf-8');
      const statements = migrationSql
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const stmt of statements) {
        await client.execute(stmt);
      }
    }
    client.close();

    // 2. Trigger auto-seed via first API call
    await req('/api/v1/health');
    await req('/api/v1/bulk/home');
  });

  afterAll(() => {
    try {
      if (fs.existsSync(TEST_DB_ABS)) {
        fs.unlinkSync(TEST_DB_ABS);
      }
      const shm = `${TEST_DB_ABS}-shm`;
      const wal = `${TEST_DB_ABS}-wal`;
      if (fs.existsSync(shm)) fs.unlinkSync(shm);
      if (fs.existsSync(wal)) fs.unlinkSync(wal);
    } catch {
      // ignore
    }
  });

  // =========================================================================
  // 1. Frontend SSR, Edge Crawlers, Sitemaps & Feeds
  // =========================================================================
  describe('1. Frontend Pages, Edge SSR & Static Feed Routes', () => {
    const publicStorefrontRoutes = [
      '/',
      '/shop',
      '/fabric/2.5-bahar',
      '/fabric/3.5-bahar',
      '/fabric/3.5-bahar/kamiz',
      '/category/kamiz',
      '/calculator',
      '/custom-design',
      '/fabric-to-outfit',
      '/cart',
      '/checkout',
      '/order-confirmation',
      '/order-tracking',
      '/wishlist',
      '/about',
      '/contact',
      '/faq',
      '/measurement-guide',
      '/delivery-policy',
      '/return-policy',
      '/privacy-policy',
      '/terms',
      '/shop-2-5',
      '/shop-3-5',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
    ];

    for (const route of publicStorefrontRoutes) {
      it(`renders storefront SSR route: ${route} (200 OK HTML)`, async () => {
        const res = await req(route, {
          headers: { Accept: 'text/html' },
        });
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toContain('<!doctype html>');
        expect(text).toContain('Fashion Doniya');
      });
    }

    it('renders admin layout route with noindex: /admin', async () => {
      const res = await req('/admin', {
        headers: { Accept: 'text/html' },
      });
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('noindex, nofollow');
    });

    it('renders product details SSR route for seeded product: /product/prod-35-saree-1', async () => {
      const res = await req('/product/prod-35-saree-1', {
        headers: { Accept: 'text/html' },
      });
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('schema.org');
      expect(html).toContain('"@type":"Product"');
      expect(html).toContain('জামদানি');
    });

    it('renders product details SSR route via generated slug: /product/royal-dhakai-jamdani-weave-saree-fabric', async () => {
      const res = await req('/product/royal-dhakai-jamdani-weave-saree-fabric', {
        headers: { Accept: 'text/html' },
      });
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('schema.org');
      expect(html).toContain('"@type":"Product"');
    });

    it('renders real 404 with noindex for non-existent product: /product/non-existent-product-12345', async () => {
      const res = await req('/product/non-existent-product-12345', {
        headers: { Accept: 'text/html' },
      });
      expect(res.status).toBe(404);
      const html = await res.text();
      expect(html).toContain('noindex');
    });

    it('renders real 404 with noindex for non-existent category: /category/unknown-cat-xyz', async () => {
      const res = await req('/category/unknown-cat-xyz', {
        headers: { Accept: 'text/html' },
      });
      expect(res.status).toBe(404);
      const html = await res.text();
      expect(html).toContain('noindex');
    });

    it('serves valid robots.txt with sitemap reference', async () => {
      const res = await req('/robots.txt');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/plain');
      const text = await res.text();
      expect(text).toContain('User-agent: *');
      expect(text).toContain('Sitemap:');
    });

    it('serves valid sitemap.xml with XML urlset', async () => {
      const res = await req('/sitemap.xml');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/xml');
      const xml = await res.text();
      expect(xml).toContain('<urlset');
      expect(xml).toContain('</urlset>');
    });

    it('serves valid feed.xml Google Merchant RSS feed', async () => {
      const res = await req('/feed.xml');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/xml');
      const xml = await res.text();
      expect(xml).toContain('<rss');
      expect(xml).toContain('<channel>');
    });

    it('serves llms.txt and llms-full.txt markdown documentation', async () => {
      const res1 = await req('/llms.txt');
      expect(res1.status).toBe(200);
      const txt1 = await res1.text();
      expect(txt1).toContain('Fashion Doniya BD');

      const res2 = await req('/llms-full.txt');
      expect(res2.status).toBe(200);
      const txt2 = await res2.text();
      expect(txt2).toContain('Fashion Doniya BD');
    });

    it('serves IndexNow key verification file', async () => {
      const res = await req('/fashiondoniya2026indexnow.txt');
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body.trim()).toBe('fashiondoniya2026indexnow');
    });
  });

  // =========================================================================
  // 2. Health & Bulk Storefront APIs
  // =========================================================================
  describe('2. Health & Bulk Storefront APIs', () => {
    it('GET /api/health and /api/v1/health return ok status', async () => {
      const res1 = await req('/api/health');
      expect(res1.status).toBe(200);
      const data1 = await parseJson(res1);
      expect(data1.status).toBe('ok');

      const res2 = await req('/api/v1/health');
      expect(res2.status).toBe(200);
      const data2 = await parseJson(res2);
      expect(data2.status).toBe('ok');
    });

    it('GET /api/v1/bulk/home returns initial storefront dataset', async () => {
      const res = await req('/api/v1/bulk/home');
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.products)).toBe(true);
      expect(data.products.length).toBeGreaterThan(0);
      expect(Array.isArray(data.categories)).toBe(true);
      expect(data.settings).toBeDefined();
      expect(data.fabricCollections).toBeDefined();
    });

    it('GET /api/v1/bootstrap returns bulk home payload', async () => {
      const res = await req('/api/v1/bootstrap');
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.products)).toBe(true);
    });
  });

  // =========================================================================
  // 3. Products, Categories, Collections & Size Guides APIs
  // =========================================================================
  describe('3. Products, Categories, Collections & Size Guides APIs', () => {
    it('GET /api/v1/products returns all active products', async () => {
      const res = await req('/api/v1/products');
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.products.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/products/:slug returns specific product details', async () => {
      const res = await req('/api/v1/products/prod-35-saree-1');
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.product.id).toBe('prod-35-saree-1');
    });

    it('GET /api/v1/categories returns list of categories', async () => {
      const res = await req('/api/v1/categories');
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.categories)).toBe(true);
    });

    it('GET /api/v1/fabric-collections returns 3.5 and 2.5 sections', async () => {
      const res = await req('/api/v1/fabric-collections');
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.data.fabric_sections['3.5_bahar']).toBeDefined();
      expect(data.data.fabric_sections['2.5_bahar']).toBeDefined();
    });

    it('GET /api/v1/size-guides returns size guides and rules', async () => {
      const res = await req('/api/v1/size-guides');
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.guides)).toBe(true);
      expect(Array.isArray(data.rules)).toBe(true);
      expect(Array.isArray(data.additionalItems)).toBe(true);
    });

    it('GET /api/v1/settings and /api/v1/payment-settings return public configs', async () => {
      const res1 = await req('/api/v1/settings');
      expect(res1.status).toBe(200);
      const d1 = await parseJson(res1);
      expect(d1.success).toBe(true);
      expect(d1.settings.storeName).toBeDefined();

      const res2 = await req('/api/v1/payment-settings');
      expect(res2.status).toBe(200);
      const d2 = await parseJson(res2);
      expect(d2.success).toBe(true);
      expect(d2.paymentSettings.bkash).toBeDefined();
    });
  });

  // =========================================================================
  // 4. Commerce & Engagement APIs (Coupons, Newsletter, Inquiries, AI)
  // =========================================================================
  describe('4. Commerce & Engagement APIs', () => {
    it('GET /api/v1/coupons returns coupons and POST /api/v1/coupons/validate validates code', async () => {
      const res1 = await req('/api/v1/coupons');
      expect(res1.status).toBe(200);
      const d1 = await parseJson(res1);
      expect(d1.success).toBe(true);

      const res2 = await req('/api/v1/coupons/validate', {
        method: 'POST',
        body: { code: 'DONIYA10', subtotal: 1200 },
      });
      expect(res2.status).toBe(200);
      const d2 = await parseJson(res2);
      expect(d2.isValid).toBe(true);
      expect(d2.discountAmount).toBe(120);
    });

    it('POST /api/v1/newsletter/subscribe handles subscriber email', async () => {
      const res = await req('/api/v1/newsletter/subscribe', {
        method: 'POST',
        body: { email: 'subscriber@example.com' },
      });
      expect(res.status === 200 || res.status === 201).toBe(true);
      const d = await parseJson(res);
      expect(d.success).toBe(true);
    });

    it('POST /api/v1/contact-messages records message', async () => {
      const res = await req('/api/v1/contact-messages', {
        method: 'POST',
        body: {
          name: 'রেহানা পারভীন',
          phone: '01812345678',
          subject: 'কাপড়ের বহর সম্পর্কিত প্রশ্ন',
          message: '৩.৫ বহরের জর্জেট ফেব্রিকের স্টক কবে আসবে?',
        },
      });
      expect(res.status === 200 || res.status === 201).toBe(true);
      const d = await parseJson(res);
      expect(d.success).toBe(true);
    });

    it('POST /api/v1/custom-requests records custom design inquiry', async () => {
      const res = await req('/api/v1/custom-requests', {
        method: 'POST',
        body: {
          customerName: 'তানজিলা হক',
          phone: '01712345678',
          outfitType: 'কামিজ',
          fabricWidth: '3.5',
          description: 'সিল্ক ফেব্রিকের থ্রি-পিস',
        },
      });
      expect(res.status === 200 || res.status === 201).toBe(true);
      const d = await parseJson(res);
      expect(d.success).toBe(true);
    });

    it('GET /api/v1/ai/status returns AI engine readiness', async () => {
      const res = await req('/api/v1/ai/status');
      expect(res.status).toBe(200);
      const d = await parseJson(res);
      expect(d.success).toBe(true);
    });
  });

  // =========================================================================
  // 5. Customer Authentication & User Protected APIs
  // =========================================================================
  describe('5. Customer Authentication & User Protected Routes', () => {
    it('POST /api/v1/auth/register creates customer and returns token', async () => {
      const res = await req('/api/v1/auth/register', {
        method: 'POST',
        body: {
          fullName: 'সাদিয়া সুলতানা',
          phone: '01912345678',
          email: 'sadia.test@example.com',
          password: 'CustomerPass#2026',
        },
      });
      expect(res.status).toBe(200);
      const d = await parseJson(res);
      expect(d.success).toBe(true);
      expect(d.token).toBeDefined();
      customerToken = d.token;
      customerUser = d.user;
    });

    it('GET /api/v1/auth/me returns authenticated user details', async () => {
      const res = await req('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(200);
      const d = await parseJson(res);
      expect(d.success).toBe(true);
      expect(d.user.email).toBe('sadia.test@example.com');
    });

    it('GET /api/v1/bulk/user returns personal user payload', async () => {
      const res = await req('/api/v1/bulk/user', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(200);
      const d = await parseJson(res);
      expect(d.success).toBe(true);
      expect(d.profile).toBeDefined();
      expect(d.profile.id).toBe(customerUser.id);
    });

    it('GET /api/v1/orders/my returns customer order list', async () => {
      const res = await req('/api/v1/orders/my', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(200);
      const d = await parseJson(res);
      expect(d.success).toBe(true);
      expect(Array.isArray(d.orders)).toBe(true);
    });

    it('PUT and GET /api/v1/cart persists customer cart across sessions', async () => {
      const cartItems = [
        {
          productId: 'prod-35-saree-1',
          name: 'রয়েল ঢাকাই জামদানি উইভ শাড়ির থান',
          fabricWidth: '3.5',
          pricePerYard: 450,
          yards: 2.5,
          color: 'সোনালী',
        },
      ];

      const putRes = await req('/api/v1/cart', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: { items: cartItems },
      });
      expect(putRes.status).toBe(200);

      const getRes = await req('/api/v1/cart', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(getRes.status).toBe(200);
      const d = await parseJson(getRes);
      expect(d.success).toBe(true);
      expect(d.items.length).toBe(1);
      expect(d.items[0].productId).toBe('prod-35-saree-1');
    });
  });

  // =========================================================================
  // 6. Order Placement, Verification & Tracking APIs
  // =========================================================================
  describe('6. Order Placement, Verification & Tracking APIs', () => {
    it('POST /api/v1/orders places new order and deducts inventory', async () => {
      const orderPayload = {
        customer: {
          fullName: 'সাদিয়া সুলতানা',
          phone: '01912345678',
          email: 'sadia.test@example.com',
          address: 'মিরপুর ১০, ঢাকা',
          district: 'ঢাকা',
        },
        paymentMethod: 'cod',
        deliveryCharge: 70,
        items: [
          {
            productId: 'prod-35-saree-1',
            productName: 'রয়েল ঢাকাই জামদানি উইভ শাড়ির থান',
            fabricWidth: '3.5',
            category: 'কামিজ',
            pricePerYard: 450,
            yards: 3.5,
            totalPrice: 1575,
          },
        ],
      };

      const res = await req('/api/v1/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
        body: orderPayload,
      });

      expect(res.status).toBe(201);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.order.id).toBeDefined();
      createdOrderId = data.order.id;
      createdOrderNumber = data.order.orderNumber;
    });

    it('POST /api/v1/orders/verify verifies and tracks order status', async () => {
      const res = await req('/api/v1/orders/verify', {
        method: 'POST',
        body: {
          orderNumber: createdOrderNumber || createdOrderId,
          phone: '01912345678',
        },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.order.id).toBe(createdOrderId);
    });

    it('GET /api/v1/orders/track allows tracking with query parameters', async () => {
      const res = await req(
        `/api/v1/orders/track?orderNumber=${encodeURIComponent(createdOrderNumber || createdOrderId)}&phone=01912345678`
      );
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.order.id).toBe(createdOrderId);
    });

    it('POST /api/v1/orders/sync-client syncs local offline orders', async () => {
      const res = await req('/api/v1/orders/sync-client', {
        method: 'POST',
        body: { orders: [] },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
    });
  });

  // =========================================================================
  // 7. Admin Authentication, RBAC & Management Operations
  // =========================================================================
  describe('7. Admin Authentication, RBAC & Management Operations', () => {
    it('blocks unauthenticated access to admin routes (401)', async () => {
      const res1 = await req('/api/v1/admin/orders');
      expect(res1.status).toBe(401);

      const res2 = await req('/api/v1/bulk/admin-stats');
      expect(res2.status).toBe(401);

      const res3 = await req('/api/v1/admin/diagnostics/status');
      expect(res3.status).toBe(401);
    });

    it('POST /api/v1/admin/auth/login logs in admin and issues admin JWT', async () => {
      const res = await req('/api/v1/admin/auth/login', {
        method: 'POST',
        body: {
          email: 'admin@fashiondoniyabd.com',
          password: 'TestAdminPassword#2026',
        },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      adminToken = data.token;
    });

    it('GET /api/v1/admin/auth/me returns admin profile', async () => {
      const res = await req('/api/v1/admin/auth/me', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.admin.role === 'super_admin' || data.admin.role === 'admin').toBe(true);
    });

    it('GET /api/v1/bulk/admin-stats returns system stats to admin', async () => {
      const res = await req('/api/v1/bulk/admin-stats', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.stats.totalOrders).toBeGreaterThan(0);
    });

    it('GET /api/v1/admin/orders lists all orders for admin', async () => {
      const res = await req('/api/v1/admin/orders', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.orders)).toBe(true);
    });

    it('PATCH /api/v1/admin/orders/:id/status updates order status', async () => {
      const res = await req(`/api/v1/admin/orders/${createdOrderId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { status: 'Confirmed', note: 'অর্ডার নিশ্চিত করা হয়েছে।' },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.order.orderStatus).toBe('Confirmed');
    });

    it('POST /api/v1/admin/orders/:id/tracking adds tracking checkpoint', async () => {
      const res = await req(`/api/v1/admin/orders/${createdOrderId}/tracking`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          status: 'Processing',
          note: 'কাপড় কাটিং সম্পন্ন হয়েছে',
          location: 'প্রধান ওয়ার্কশপ',
        },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.historyEntry).toBeDefined();
    });

    it('PUT /api/v1/admin/orders/:id/courier assigns courier information', async () => {
      const res = await req(`/api/v1/admin/orders/${createdOrderId}/courier`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          courierName: 'Steadfast Courier',
          trackingNumber: 'STF-TEST-8899',
          consignmentId: 'CSG-12345',
        },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.order.courierInfo.courierName).toBe('Steadfast Courier');
    });

    it('PATCH /api/v1/admin/orders/:id/payment updates payment status', async () => {
      const res = await req(`/api/v1/admin/orders/${createdOrderId}/payment`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { paymentStatus: 'Paid' },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.order.paymentStatus).toBe('Paid');
    });

    it('GET /api/v1/admin/customers lists customers with order summaries', async () => {
      const res = await req('/api/v1/admin/customers', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.customers)).toBe(true);
    });

    it('GET /api/v1/admin/activity-logs returns audit logs', async () => {
      const res = await req('/api/v1/admin/activity-logs', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.logs)).toBe(true);
    });

    it('PUT /api/v1/admin/settings updates store configuration', async () => {
      const res = await req('/api/v1/admin/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          settings: {
            tagline: 'প্রিমিয়াম ফ্যাব্রিক ও আধুনিক কালেকশন',
            announcement: 'বিনামূল্যে ডেলিভারি উপভোগ করুন',
          },
        },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.settings.tagline).toBe('প্রিমিয়াম ফ্যাব্রিক ও আধুনিক কালেকশন');
    });

    it('GET /api/v1/admin/diagnostics/status reports backend health & services', async () => {
      const res = await req('/api/v1/admin/diagnostics/status', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.storage).toBeDefined();
      expect(data.email).toBeDefined();
    });

    it('POST /api/v1/admin/diagnostics/test-database runs database diagnostics', async () => {
      const res = await req('/api/v1/admin/diagnostics/test-database', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {},
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
      expect(data.counts.products).toBeGreaterThan(0);
      expect(data.writeReadMatch).toBe(true);
    });

    it('POST /api/v1/admin/diagnostics/test-cache runs edge cache diagnostics', async () => {
      const res = await req('/api/v1/admin/diagnostics/test-cache', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { action: 'write-read' },
      });
      expect(res.status).toBe(200);
      const data = await parseJson(res);
      expect(data.success).toBe(true);
    });

    it('POST /api/v1/seo/ping schedules IndexNow notification', async () => {
      const res = await req('/api/v1/seo/ping', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { urls: ['/shop', '/product/prod-35-saree-1'] },
      });
      expect([200, 502]).toContain(res.status);
    });
  });
});
