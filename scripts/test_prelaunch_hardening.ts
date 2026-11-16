import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { createClient } from '@libsql/client';
import { app, isAllowedStorefrontOrigin } from '../functions/api/app';
import { injectSeoIntoHtml } from '../functions/api/utils/edge-seo';
import { detectRasterImageType, createSyntheticTestPng } from '../functions/api/utils/media-upload';
import type { Bindings } from '../functions/api/types';

const TEST_DB_REL = `backend/test_hardening_${Date.now()}.db`;
const TEST_DB_ABS = path.resolve(process.cwd(), TEST_DB_REL);

const testEnv = {
  TURSO_URL: `file:${TEST_DB_REL}`,
  TURSO_AUTH_TOKEN: '',
  JWT_SECRET: 'test-jwt-secret-key-at-least-32-characters-long-2026',
  ADMIN_API_KEY: 'test-admin-api-key-64chars-000000000000000000000000000000000000',
  ADMIN_EMAIL: 'admin@fashiondoniyabd.com',
  ADMIN_PASSWORD: 'TestAdminPassword#2026',
  COURIER_WEBHOOK_SECRET: 'test-courier-secret-2026',
  NODE_ENV: 'development',
  DEMO_MODE: 'false',
  SITE_URL: 'https://fashiondoniyabd.com',
} as unknown as Bindings;

async function reqFetch(
  pathname: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<Response> {
  const url = `https://fashiondoniyabd.com${pathname}`;
  const headers: Record<string, string> = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };
  const req = new Request(url, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  return app.fetch(req, testEnv);
}

describe('Pre-launch Security & Hardening Suite (Claude-Red AppSec Edition)', () => {
  let adminToken = '';
  let testProductId = '';

  beforeAll(async () => {
    const initClient = createClient({ url: `file:${TEST_DB_REL}` });
    const drizzleDir = path.resolve(process.cwd(), 'backend/drizzle');
    const sqlFiles = fs
      .readdirSync(drizzleDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const sqlFile of sqlFiles) {
      const sqlContent = fs.readFileSync(path.join(drizzleDir, sqlFile), 'utf-8');
      const statements = sqlContent
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const statement of statements) {
        await initClient.execute(statement);
      }
    }
    initClient.close();

    // Login admin and create sample product for tests
    const loginRes = await reqFetch('/api/v1/admin/auth/login', {
      method: 'POST',
      body: { email: testEnv.ADMIN_EMAIL, password: testEnv.ADMIN_PASSWORD },
    });
    const loginData = (await loginRes.json()) as { token: string };
    adminToken = loginData.token;

    testProductId = `prod-harden-${Date.now()}`;
    await reqFetch('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        product: {
          id: testProductId,
          name: 'টেস্ট প্রিমিয়াম সিল্ক কাপড়',
          nameEn: 'Test Premium Silk Fabric',
          description: 'টেস্টিং পারপাস প্রিমিয়াম সিল্ক গজ কাপড়।',
          sku: 'FD-TEST-HD01',
          fabricWidth: '3.5',
          category: 'শাড়ি',
          fabricType: 'সিল্ক',
          pricePerYard: 500,
          discountPrice: 450,
          stockYards: 50,
          minOrderQuantity: 1.5,
          stepYard: 0.5,
          isActive: true,
        },
      },
    });
  });

  afterAll(() => {
    for (const suffix of ['', '-wal', '-shm']) {
      const p = `${TEST_DB_ABS}${suffix}`;
      if (fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
        } catch {}
      }
    }
  });

  it('validates allowed storefront origins and rejects malicious *.pages.dev subdomains', () => {
    // Legitimate origins
    expect(isAllowedStorefrontOrigin('https://fashiondoniyabd.com', testEnv)).toBe(true);
    expect(isAllowedStorefrontOrigin('https://www.fashiondoniyabd.com', testEnv)).toBe(true);
    expect(isAllowedStorefrontOrigin('https://fashion-doniya.pages.dev', testEnv)).toBe(true);
    expect(isAllowedStorefrontOrigin('https://preview-123.fashion-doniya.pages.dev', testEnv)).toBe(true);

    // Malicious or arbitrary .pages.dev origins
    expect(isAllowedStorefrontOrigin('https://attacker.pages.dev', testEnv)).toBe(false);
    expect(isAllowedStorefrontOrigin('https://evil-site.pages.dev', testEnv)).toBe(false);
    expect(isAllowedStorefrontOrigin('https://phishing-fashiondoniyabd.com', testEnv)).toBe(false);

    // Localhost in production environment must be rejected
    const prodEnv = { ...testEnv, NODE_ENV: 'production' } as Bindings;
    expect(isAllowedStorefrontOrigin('http://localhost:3000', prodEnv)).toBe(false);
    expect(isAllowedStorefrontOrigin('http://127.0.0.1:8080', prodEnv)).toBe(false);
  });

  it('resists Regex pattern injection ($&, $\', $1) during SSR head and root HTML injection', () => {
    const template = '<!DOCTYPE html><html><head><title>Test</title></head><body><div id="root"></div></body></html>';
    const injectedHtml = injectSeoIntoHtml(template, {
      title: 'Silk & Cotton Fabric $99.99 Special & $& Deal',
      description: 'Special $` and $\' offer on premium cloth',
      canonicalUrl: 'https://fashiondoniyabd.com/test',
      rootHtml: '<main><h1>Price: $100 &amp; Discount: $&</h1></main>',
    });

    expect(injectedHtml).toContain('<div id="root"><main><h1>Price: $100 &amp; Discount: $&</h1></main></div>');
    expect(injectedHtml).toContain('Silk &amp; Cotton Fabric $99.99 Special &amp; $&amp; Deal');
    expect(injectedHtml).not.toContain('<div id="root"><div id="root">');
  });

  it('verifies raster magic bytes and strictly blocks dangerous/non-raster uploads', () => {
    const validPng = createSyntheticTestPng();
    const detectedPng = detectRasterImageType(validPng);
    expect(detectedPng).not.toBeNull();
    expect(detectedPng?.ext).toBe('png');
    expect(detectedPng?.contentType).toBe('image/png');

    // Spoofed text file pretending to be an image
    const fakePayload = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const detectedFake = detectRasterImageType(fakePayload);
    expect(detectedFake).toBeNull();

    // Random binary bytes
    const randomBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b]);
    expect(detectRasterImageType(randomBytes)).toBeNull();
  });

  it('rejects coupon validation with negative subtotal (400)', async () => {
    const res = await reqFetch('/api/v1/coupons/validate', {
      method: 'POST',
      body: { code: 'WELCOME10', subtotal: -500 },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { isValid: boolean };
    expect(body.isValid).toBe(false);
  });

  it('enforces minOrderQuantity and stepYard on order creation (400)', async () => {
    // Attempt to order 0.5 yards when minOrderQuantity is 1.5
    const underOrderRes = await reqFetch('/api/v1/orders', {
      method: 'POST',
      body: {
        customer: {
          fullName: 'Test Customer',
          phone: '01711223344',
          district: 'ঢাকা',
          fullAddress: 'Dhanmondi, Dhaka',
        },
        items: [
          {
            productId: testProductId,
            yards: 0.5,
            pricePerYard: 500,
          },
        ],
        paymentMethod: 'cod',
      },
    });

    expect(underOrderRes.status).toBe(400);
    const underBody = (await underOrderRes.json()) as { success: boolean; message: string };
    expect(underBody.success).toBe(false);
    expect(underBody.message).toContain('ন্যূনতম অর্ডার পরিমাণ');
  });

  it('blocks returns on non-delivered orders and prevents duplicate returns', async () => {
    // Register customer
    const regRes = await reqFetch('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Return Tester',
        phone: '01799887766',
        password: 'ValidPassword#2026',
      },
    });
    const regData = (await regRes.json()) as { token: string };
    const customerToken = regData.token;

    // Place an order meeting minOrderQuantity
    const orderRes = await reqFetch('/api/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        customer: {
          fullName: 'Return Tester',
          phone: '01799887766',
          district: 'ঢাকা',
          fullAddress: 'Mirpur, Dhaka',
        },
        items: [{ productId: testProductId, yards: 2, pricePerYard: 500 }],
        paymentMethod: 'cod',
      },
    });
    expect(orderRes.status).toBe(201);
    const orderData = (await orderRes.json()) as { order: { id: string; orderNumber: string } };
    const orderId = orderData.order.id;

    // 1. Attempt return on Pending order (must be rejected)
    const returnPendingRes = await reqFetch('/api/v1/returns', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        orderId,
        reason: 'Wrong color received',
      },
    });
    expect(returnPendingRes.status).toBe(400);
    const pendingBody = (await returnPendingRes.json()) as { message: string };
    expect(pendingBody.message).toContain('ডেলিভারি সম্পন্ন');

    // 2. Deliver the order via Admin
    const deliverRes = await reqFetch(`/api/v1/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Delivered' },
    });
    expect(deliverRes.status).toBe(200);

    // 3. Now return request should succeed
    const validReturnRes = await reqFetch('/api/v1/returns', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        orderId,
        reason: 'Fabric had defect',
      },
    });
    expect(validReturnRes.status).toBe(201);

    // 4. Duplicate return on the same order must be rejected
    const dupReturnRes = await reqFetch('/api/v1/returns', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        orderId,
        reason: 'Submitting return again',
      },
    });
    expect(dupReturnRes.status).toBe(400);
    const dupBody = (await dupReturnRes.json()) as { message: string };
    expect(dupBody.message).toContain('ইতিমধ্যে একটি রিটার্ন অনুরোধ প্রক্রিয়াধীন');
  });

  it('rejects courier webhook attempting to reopen terminal Cancelled or Returned orders', async () => {
    const orderRes = await reqFetch('/api/v1/orders', {
      method: 'POST',
      body: {
        customer: {
          fullName: 'Terminal Order Tester',
          phone: '01855667788',
          district: 'ঢাকা',
          fullAddress: 'Uttara, Dhaka',
        },
        items: [{ productId: testProductId, yards: 2, pricePerYard: 500 }],
        paymentMethod: 'cod',
      },
    });
    const orderData = (await orderRes.json()) as { order: { id: string; orderNumber: string } };

    // Cancel order via admin
    const cancelRes = await reqFetch(`/api/v1/admin/orders/${orderData.order.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Cancelled' },
    });
    expect(cancelRes.status).toBe(200);

    // Attempt to transition cancelled order to Delivered via courier webhook
    const webhookRes = await reqFetch('/api/v1/courier/webhook', {
      method: 'POST',
      headers: {
        'x-courier-webhook-secret': String(testEnv.COURIER_WEBHOOK_SECRET),
      },
      body: {
        orderNumber: orderData.order.orderNumber,
        courierStatus: 'Delivered',
      },
    });
    expect(webhookRes.status).toBe(400);
    const webhookBody = (await webhookRes.json()) as { success: boolean; message: string };
    expect(webhookBody.success).toBe(false);
    expect(webhookBody.message).toContain('Cancelled');
  });
});
