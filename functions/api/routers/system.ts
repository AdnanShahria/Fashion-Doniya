import { Hono, type Context } from 'hono';
import { desc, eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { systemSettings, adminLogs } from '../../../backend/server/db/schemas/index';
import type { StoreSettings, PaymentSettings } from '../../../frontend/src/types/index';
import { getStoreAndPaymentSettings, mergeSettingsWithDefaults } from '../utils/mappers';
import { appendAdminLog } from '../utils/helpers';
import { invalidateHomeCache } from '../utils/cache';
import { clearBulkMicroCache } from './bulk';
import { DEFAULT_INDEXNOW_KEY } from '../config/cloudflare-env';
import { parseImageUploadRequest, storeImageBytes } from '../utils/media-upload';
import { diagnosticsRouter } from './diagnostics';

export const systemRouter = new Hono<AppEnv>();
export const adminSystemRouter = new Hono<AppEnv>();
export const seoRouter = new Hono<AppEnv>();

adminSystemRouter.route('/diagnostics', diagnosticsRouter);

systemRouter.get('/settings', async (c) => {
  const db = c.get('db');
  const { settings } = await getStoreAndPaymentSettings(db);
  return c.json({ success: true, settings });
});

systemRouter.get('/payment-settings', async (c) => {
  const db = c.get('db');
  const { paymentSettings } = await getStoreAndPaymentSettings(db);
  return c.json({ success: true, paymentSettings });
});

adminSystemRouter.put('/settings', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    settings?: Partial<StoreSettings>;
  } & Partial<StoreSettings>;
  const incoming = body?.settings || body;
  if (!incoming || typeof incoming !== 'object') {
    return c.json({ success: false, message: 'বৈধ সেটিংস ডেটা প্রদান করুন।' }, 400);
  }

  const db = c.get('db');
  const now = new Date().toISOString();
  const current = await getStoreAndPaymentSettings(db);

  let nextPayment = current.paymentSettings;
  if (incoming.paymentSettings) {
    nextPayment = {
      bkash: { ...current.paymentSettings.bkash, ...(incoming.paymentSettings.bkash || {}) },
      nagad: { ...current.paymentSettings.nagad, ...(incoming.paymentSettings.nagad || {}) },
      cod: { ...current.paymentSettings.cod, ...(incoming.paymentSettings.cod || {}) },
    };
    await db
      .insert(systemSettings)
      .values({ key: 'payment_settings', value: JSON.stringify(nextPayment), updatedAt: now })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: JSON.stringify(nextPayment), updatedAt: now },
      });
  }

  const merged = mergeSettingsWithDefaults({ ...current.settings, ...incoming }, nextPayment);
  await db
    .insert(systemSettings)
    .values({ key: 'store_settings', value: JSON.stringify(merged), updatedAt: now })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: JSON.stringify(merged), updatedAt: now },
    });

  await appendAdminLog(
    db,
    'ওয়েবসাইট কনফিগারেশন ও কন্টেন্ট আপডেট',
    'settings',
    `স্টোর: ${merged.storeName} · মেইনটেন্যান্স: ${merged.maintenanceMode ? 'চালু' : 'বন্ধ'}`
  );
  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  return c.json({ success: true, settings: merged });
});

adminSystemRouter.put('/payment-settings', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    paymentSettings?: Partial<PaymentSettings>;
  } & Partial<PaymentSettings>;
  const incoming = body?.paymentSettings || body;
  if (!incoming || typeof incoming !== 'object') {
    return c.json({ success: false, message: 'পেমেন্ট সেটিংস ডাটা সঠিক নয়।' }, 400);
  }

  const db = c.get('db');
  const now = new Date().toISOString();
  const current = await getStoreAndPaymentSettings(db);
  const nextPayment: PaymentSettings = {
    bkash: { ...current.paymentSettings.bkash, ...(incoming.bkash || {}) },
    nagad: { ...current.paymentSettings.nagad, ...(incoming.nagad || {}) },
    cod: { ...current.paymentSettings.cod, ...(incoming.cod || {}) },
  };

  await db
    .insert(systemSettings)
    .values({ key: 'payment_settings', value: JSON.stringify(nextPayment), updatedAt: now })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: JSON.stringify(nextPayment), updatedAt: now },
    });

  const merged = mergeSettingsWithDefaults(current.settings, nextPayment);
  await db
    .insert(systemSettings)
    .values({ key: 'store_settings', value: JSON.stringify(merged), updatedAt: now })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: JSON.stringify(merged), updatedAt: now },
    });

  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  return c.json({ success: true, paymentSettings: nextPayment });
});

adminSystemRouter.get('/activity-logs', async (c) => {
  const db = c.get('db');
  const rows = await db
    .select()
    .from(adminLogs)
    .orderBy(desc(adminLogs.createdAt))
    .limit(200);
  return c.json({
    success: true,
    logs: rows.map((r) => ({
      id: r.id,
      action: r.action,
      category: r.category,
      details: r.details,
      actor: r.actor,
      timestamp: r.createdAt,
    })),
  });
});

/**
 * Image Upload Pipeline:
 * 1. Primary: Cloudflare R2 (env.MEDIA_BUCKET) -> returns /media/<key>
 * 2. Fallback: ImgBB API (env.IMGBB_API_KEY)
 * 3. Dev Fallback: returns dataUrl cleanly
 */
async function handleImageUpload(c: Context<AppEnv>) {
  if (!c.get('isAdmin')) {
    return c.json({ success: false, message: 'Unauthorized Admin Access' }, 401);
  }

  const payload = await parseImageUploadRequest(c);
  if (!payload) {
    return c.json(
      { success: false, message: 'শুধুমাত্র বৈধ ছবির ফাইল (PNG, JPG, WEBP, GIF) আপলোড করা যাবে।' },
      400
    );
  }
  if (payload.bytes.length > 10 * 1024 * 1024) {
    return c.json({ success: false, message: 'ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইটের মধ্যে হতে হবে।' }, 400);
  }

  const stored = await storeImageBytes(c.env, payload);
  return c.json({
    success: true,
    url: stored.url,
    ...(stored.key ? { key: stored.key } : {}),
    ...(stored.dataUrl ? { dataUrl: stored.dataUrl } : {}),
    provider: stored.provider,
  });
}

systemRouter.post('/system/upload-image', handleImageUpload);
adminSystemRouter.post('/upload', handleImageUpload);

// SEO IndexNow Ping
seoRouter.post('/ping', async (c) => {
  if (!c.get('isAdmin')) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
  const body = (await c.req.json().catch(() => ({}))) as { urlList?: string[] };
  const siteUrl = String(c.env?.SITE_URL || 'https://fashiondoniyabd.com').replace(/\/$/, '');
  const host = new URL(siteUrl).host;
  const key = String(c.env?.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY);
  const urlList =
    Array.isArray(body?.urlList) && body.urlList.length > 0 ? body.urlList : [`${siteUrl}/`];

  try {
    const resp = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${siteUrl}/${key}.txt`,
        urlList,
      }),
    });
    return c.json({ success: resp.ok, status: resp.status, submitted: urlList.length });
  } catch (err) {
    return c.json({ success: false, message: String(err) }, 502);
  }
});
