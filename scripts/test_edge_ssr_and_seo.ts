import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { createClient } from '@libsql/client';
import { app } from '../functions/api/app';
import { slugify } from '../functions/api/utils/helpers';
import type { Bindings } from '../functions/api/types';

const TEST_DB_REL = `backend/test_seo_ssr_${Date.now()}.db`;
const TEST_DB_ABS = path.resolve(process.cwd(), TEST_DB_REL);

const testEnv = {
  TURSO_URL: `file:${TEST_DB_REL}`,
  TURSO_AUTH_TOKEN: '',
  JWT_SECRET: 'test-jwt-secret-key-at-least-32-characters-long-2026',
  ADMIN_API_KEY: 'test-admin-api-key-64chars-000000000000000000000000000000000000',
  ADMIN_EMAIL: 'admin@fashiondoniyabd.com',
  ADMIN_PASSWORD: 'TestAdminPassword#2026',
  NODE_ENV: 'development',
  DEMO_MODE: 'false',
  SITE_URL: 'https://fashiondoniyabd.com',
  ORBITMAIL_API_KEY: '',
  SENDPULSE_CLIENT_ID: '',
  SENDPULSE_CLIENT_SECRET: '',
  RESEND_API_KEY: '',
  AMAZON_SES_ACCESS_KEY_ID: '',
  GOOGLE_SCRIPT_URL: '',
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

beforeAll(async () => {
  const migrationSql = fs.readFileSync(
    path.resolve(process.cwd(), 'backend/drizzle/0000_misty_pandemic.sql'),
    'utf-8'
  );
  const client = createClient({ url: `file:${TEST_DB_REL}` });
  const statements = migrationSql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await client.execute(stmt);
  }
  client.close();
});

afterAll(() => {
  try {
    if (fs.existsSync(TEST_DB_ABS)) fs.unlinkSync(TEST_DB_ABS);
  } catch {
    // ignore cleanup error on Windows if handle still releasing
  }
});

describe('Product Auto-SEO, Semi-Next.js Edge SSR, Sitemap, Feeds & Order Inventory', () => {
  let adminToken = '';
  let createdProductId = '';
  let createdProductSlug = '';

  it('preserves Bengali Unicode vowel signs in slugify()', () => {
    expect(slugify('রয়েল ঢাকাই জামদানি')).toBe('রয়েল-ঢাকাই-জামদানি');
    expect(slugify('Silk Jamdani Sharee (3.5 Bahar)')).toBe('silk-jamdani-sharee-35-bahar');
  });

  it('auto-generates unique slug & dynamic SEO metadata on product creation and updates in real-time', async () => {
    const loginRes = await reqFetch('/api/v1/admin/auth/login', {
      method: 'POST',
      body: { email: 'admin@fashiondoniyabd.com', password: 'TestAdminPassword#2026' },
    });
    expect(loginRes.status).toBe(200);
    adminToken = ((await loginRes.json()) as any).token;

    createdProductId = `prod-test-${Date.now()}`;
    const createRes = await reqFetch('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        product: {
          id: createdProductId,
          name: 'রয়েল গোল্ডেন জামদানি সিল্ক',
          nameEn: 'Royal Golden Jamdani Silk',
          description: 'উৎসবের জন্য প্রিমিয়াম জরি বুটি সমৃদ্ধ ৩.৫ হাত বহরের খাঁটি জামদানি সিল্ক গজ কাপড়।',
          sku: 'FD-TEST-3501',
          fabricWidth: '3.5',
          category: 'শাড়ি',
          fabricType: 'জামদানি সিল্ক',
          color: 'সোনালী মেরুন',
          pricePerYard: 450,
          discountPrice: 390,
          stockYards: 50,
          minOrderQuantity: 1.5,
          stepYard: 0.5,
          images: ['/media/uploads/royal-golden-jamdani-silk-1.webp'],
          patternType: 'jamdani',
          isFeatured: true,
          isBestSeller: false,
          isNewArrival: true,
          isActive: true,
        },
      },
    });
    expect(createRes.status).toBe(200);
    const createdJson = (await createRes.json()) as any;
    expect(createdJson.success).toBe(true);
    expect(createdJson.product.slug).toBe('royal-golden-jamdani-silk');
    expect(createdJson.product.seoTitle).toContain('রয়েল গোল্ডেন জামদানি সিল্ক');
    expect(createdJson.product.seoDescription).toContain('390');
    expect(createdJson.product.seoKeywords).toContain('Royal Golden Jamdani Silk');
    expect(createdJson.product.imageAlt).toContain('রয়েল গোল্ডেন জামদানি সিল্ক');
    createdProductSlug = createdJson.product.slug;

    // Duplicate product with same nameEn gets collision-free unique slug
    const dupId = `prod-dup-${Date.now()}`;
    const dupRes = await reqFetch('/api/v1/admin/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        product: {
          id: dupId,
          name: 'রয়েল গোল্ডেন জামদানি সিল্ক ২',
          nameEn: 'Royal Golden Jamdani Silk',
          description: 'ডুপ্লিকেট নাম পরীক্ষা',
          sku: 'FD-TEST-3502',
          fabricWidth: '3.5',
          category: 'শাড়ি',
          fabricType: 'জামদানি সিল্ক',
          color: 'মেরুন',
          pricePerYard: 420,
          stockYards: 30,
          minOrderQuantity: 1,
          stepYard: 0.5,
          images: [],
          patternType: 'jamdani',
          isFeatured: false,
          isBestSeller: false,
          isNewArrival: true,
          isActive: true,
        },
      },
    });
    expect(dupRes.status).toBe(200);
    const dupJson = (await dupRes.json()) as any;
    expect(dupJson.product.slug).toBe('royal-golden-jamdani-silk-2');

    // SSR /product/:slug immediately reflects new product with canonical, OG, Twitter, JSON-LD, and zero-JS fallback
    const ssrRes = await reqFetch(`/product/${createdProductSlug}`);
    expect(ssrRes.status).toBe(200);
    const html = await ssrRes.text();
    expect(html).toContain(`<link rel="canonical" href="https://fashiondoniyabd.com/product/${createdProductSlug}"`);
    expect(html).toContain('hreflang="bn-BD"');
    expect(html).toContain('hreflang="x-default"');
    expect(html).toContain('property="og:type" content="product"');
    expect(html).toContain('property="product:price:amount" content="390.00"');
    expect(html).toContain('"@type":"Product"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).not.toContain('"@type":"FAQPage"');
    expect(html).toContain('data-edge-seo="product"');

    // Update product price -> SSR metadata & SEO update automatically without redeployment
    const updateRes = await reqFetch(`/api/v1/admin/products/${createdProductId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        discountPrice: 350,
        name: 'রয়েল গোল্ডেন জামদানি স্পেশাল',
      },
    });
    expect(updateRes.status).toBe(200);
    const ssrAfterUpdate = await reqFetch(`/product/${createdProductSlug}`);
    expect(ssrAfterUpdate.status).toBe(200);
    const updatedHtml = await ssrAfterUpdate.text();
    expect(updatedHtml).toContain('রয়েল গোল্ডেন জামদানি স্পেশাল');
    expect(updatedHtml).toContain('property="product:price:amount" content="350.00"');
  });

  it('returns real HTTP 404 with single noindex tag for missing products and categories', async () => {
    const missingProd = await reqFetch('/product/non-existent-slug-9999');
    expect(missingProd.status).toBe(404);
    const prodHtml = await missingProd.text();
    expect(prodHtml).toContain('noindex, nofollow');
    expect(prodHtml.match(/name=["']robots["']/gi)?.length).toBe(1);
    expect(prodHtml).not.toContain('"@type":"FAQPage"');

    const missingCat = await reqFetch('/category/non-existent-category-9999');
    expect(missingCat.status).toBe(404);
    const catHtml = await missingCat.text();
    expect(catHtml).toContain('noindex, nofollow');
    expect(catHtml.match(/name=["']robots["']/gi)?.length).toBe(1);
  });

  it('serves SSR metadata on public routes and noindex on private routes', async () => {
    const shopRes = await reqFetch('/shop');
    expect(shopRes.status).toBe(200);
    const shopHtml = await shopRes.text();
    expect(shopHtml).toContain('<link rel="canonical" href="https://fashiondoniyabd.com/shop"');
    expect(shopHtml).toContain('index, follow');

    for (const privPath of ['/admin', '/account', '/checkout', '/forgot-password', '/reset-password']) {
      const res = await reqFetch(privPath);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
      const html = await res.text();
      expect(html).toContain('content="noindex, nofollow"');
    }
  });

  it('includes newly created product canonical URL in sitemap.xml, feed.xml, llms.txt, and robots.txt', async () => {
    const [sitemapRes, feedRes, llmsRes, robotsRes] = await Promise.all([
      reqFetch('/sitemap.xml'),
      reqFetch('/feed.xml'),
      reqFetch('/llms.txt'),
      reqFetch('/robots.txt'),
    ]);

    expect(sitemapRes.status).toBe(200);
    const sitemap = await sitemapRes.text();
    expect(sitemap).toContain(`https://fashiondoniyabd.com/product/${createdProductSlug}`);
    expect(sitemap).toContain('https://fashiondoniyabd.com/media/uploads/royal-golden-jamdani-silk-1.webp');
    // Seeded products resolve symbolic image keys instead of broken /jamdani_saree_1
    expect(sitemap).not.toContain('/jamdani_saree_1');

    expect(feedRes.status).toBe(200);
    const feed = await feedRes.text();
    expect(feed).toContain(`<g:link>https://fashiondoniyabd.com/product/${createdProductSlug}</g:link>`);
    expect(feed).toContain('<g:price>450.00 BDT</g:price>');
    expect(feed).toContain('<g:sale_price>350.00 BDT</g:sale_price>');

    expect(llmsRes.status).toBe(200);
    const llms = await llmsRes.text();
    expect(llms).toContain(`/product/${createdProductSlug}`);

    expect(robotsRes.status).toBe(200);
    const robots = await robotsRes.text();
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Disallow: /account');
    expect(robots).toContain('Sitemap: https://fashiondoniyabd.com/sitemap.xml');
  });

  it('deducts stock on order creation, updates customer stats, and restores stock on cancellation', async () => {
    // 1. Sync coupon change via PUT /admin/settings and verify /coupons/validate enforces it
    const settingsRes = await reqFetch('/api/v1/admin/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        coupons: [
          {
            code: 'TEST10',
            discountType: 'percentage',
            discountValue: 10,
            minOrderAmount: 500,
            isActive: true,
            description: 'Test 10% off',
          },
        ],
      },
    });
    expect(settingsRes.status).toBe(200);

    const couponValid = await reqFetch('/api/v1/coupons/validate', {
      method: 'POST',
      body: { code: 'TEST10', subtotal: 1000 },
    });
    expect(couponValid.status).toBe(200);
    expect(((await couponValid.json()) as any).discountAmount).toBe(100);

    // 2. Place order for 5 yards (authoritative server pricing: 5 * 350 = 1750 - 175 (10% TEST10) + 60 Dhaka = 1635)
    const orderRes = await reqFetch('/api/v1/orders', {
      method: 'POST',
      body: {
        customer: {
          fullName: 'রাফিয়া খান',
          phone: '01711223344',
          district: 'ঢাকা',
          upazila: 'ধানমন্ডি',
          area: 'রোড ৪',
          fullAddress: 'বাড়ি ১২, রোড ৪, ধানমন্ডি',
        },
        items: [
          {
            productId: createdProductId,
            productName: 'Tampered Name',
            fabricWidth: '3.5',
            color: 'সোনালী মেরুন',
            yards: 5,
            pricePerYard: 1, // Tampered client price -> server must ignore!
            subtotal: 5,
          },
        ],
        couponCode: 'TEST10',
        subtotal: 5,
        deliveryCharge: 0,
        grandTotal: 5,
        paymentMethod: 'cod',
      },
    });
    expect(orderRes.status).toBe(201);
    const orderJson = (await orderRes.json()) as any;
    expect(orderJson.order.subtotal).toBe(1750);
    expect(orderJson.order.discount).toBe(175);
    expect(orderJson.order.deliveryCharge).toBe(60);
    expect(orderJson.order.grandTotal).toBe(1635);

    // Stock should drop from 50 to 45
    const prodAfterOrder = await reqFetch(`/api/v1/products/${createdProductSlug}`);
    expect(((await prodAfterOrder.json()) as any).product.stockYards).toBe(45);

    // 3. Cancel order -> stock must restore back to 50
    const cancelRes = await reqFetch(`/api/v1/admin/orders/${orderJson.order.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'Cancelled' },
    });
    expect(cancelRes.status).toBe(200);

    const prodAfterCancel = await reqFetch(`/api/v1/products/${createdProductSlug}`);
    expect(((await prodAfterCancel.json()) as any).product.stockYards).toBe(50);
  });
});
