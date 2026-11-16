import { Hono } from 'hono';
import { count, eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import {
  products,
  categories,
  orders,
  users,
  systemSettings,
  systemCache,
} from '../../../backend/server/db/schemas/index';
import {
  getEmailProvidersStatus,
  sendTransactionalEmail,
  type EmailProviderName,
} from '../utils/email';
import {
  isSmsConfigured,
  isSmsGloballyEnabled,
  sendTransactionalSms,
} from '../utils/sms';
import { appendAdminLog, isDemoModeActive, normalizePhone } from '../utils/helpers';
import {
  deleteEdgeCache,
  getEdgeCache,
  invalidateHomeCache,
  setEdgeCache,
} from '../utils/cache';
import { clearBulkMicroCache } from './bulk';
import {
  createSyntheticTestPng,
  parseImageUploadRequest,
  storeImageBytes,
} from '../utils/media-upload';

export const diagnosticsRouter = new Hono<AppEnv>();

const VALID_EMAIL_PROVIDERS = new Set<EmailProviderName>([
  'orbitmail',
  'sendpulse',
  'resend',
  'ses',
  'google_script',
]);

diagnosticsRouter.use('*', async (c, next) => {
  if (!c.get('isAdmin')) {
    return c.json({ success: false, message: 'Unauthorized Admin Access' }, 401);
  }
  await next();
});

diagnosticsRouter.get('/status', async (c) => {
  const db = c.get('db');
  const env = c.env;
  const demoMode = await isDemoModeActive(db, env);
  const emailStatus = getEmailProvidersStatus(env);

  const storageProvider = env?.MEDIA_BUCKET
    ? 'r2'
    : env?.IMGBB_API_KEY
      ? 'imgbb'
      : 'inline-dev';

  return c.json({
    success: true,
    runtime: env?.DB ? 'cloudflare-d1' : 'libsql-sqlite',
    nodeEnv: env?.NODE_ENV || 'development',
    siteUrl: env?.SITE_URL || '',
    demoMode,
    bindings: {
      d1: Boolean(env?.DB),
      turso: Boolean(env?.TURSO_URL),
      r2: Boolean(env?.MEDIA_BUCKET),
      kv: Boolean(env?.CACHE_KV),
    },
    storage: {
      activeProvider: storageProvider,
      r2Bound: Boolean(env?.MEDIA_BUCKET),
      imgbbConfigured: Boolean(String(env?.IMGBB_API_KEY || '').trim()),
    },
    email: emailStatus,
    sms: {
      enabled: isSmsGloballyEnabled(env),
      configured: isSmsConfigured(env),
      alwaysSend: String(env?.SMS_ALWAYS_SEND || '').toLowerCase() === 'true',
      providers: {
        greenweb: Boolean(String(env?.GREENWEB_API_TOKEN || '').trim()),
        bulksmsbd: Boolean(String(env?.BULKSMSBD_API_KEY || '').trim()),
      },
    },
    secretsConfigured: {
      jwtSecretCustom: Boolean(env?.JWT_SECRET && env.JWT_SECRET.trim().length >= 32),
      adminApiKey: Boolean(String(env?.ADMIN_API_KEY || '').trim()),
      geminiApiKey: Boolean(String(env?.GEMINI_API_KEY || '').trim()),
      courierWebhookSecret: Boolean(String(env?.COURIER_WEBHOOK_SECRET || '').trim()),
      indexNowKey: Boolean(String(env?.INDEXNOW_KEY || '').trim()),
    },
    timestamp: new Date().toISOString(),
  });
});

diagnosticsRouter.post('/test-email', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    to?: string;
    subject?: string;
    message?: string;
    provider?: string;
  };

  const fallbackEmail = c.get('user')?.email || c.env?.ADMIN_EMAIL || '';
  const to = String(body?.to || fallbackEmail).trim();

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return c.json(
      { success: false, message: 'অনুগ্রহ করে একটি বৈধ প্রাপক ইমেইল ঠিকানা দিন।' },
      400
    );
  }

  const rawProvider = String(body?.provider || 'auto').trim().toLowerCase();
  const provider: EmailProviderName | 'auto' =
    rawProvider !== 'auto' && VALID_EMAIL_PROVIDERS.has(rawProvider as EmailProviderName)
      ? (rawProvider as EmailProviderName)
      : 'auto';

  const subject =
    String(body?.subject || '').trim() || 'Fashion Doniya BD — Admin Email Diagnostic Test';
  const customNote =
    String(body?.message || '').trim() ||
    'This is an automated diagnostic test email triggered from the Fashion Doniya Admin Settings panel.';
  const nowIso = new Date().toISOString();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #EDE5D9; border-radius: 12px; background: #FAF8F4; color: #242424;">
      <div style="border-bottom: 2px solid #C5A46D; padding-bottom: 12px; margin-bottom: 16px;">
        <h2 style="margin: 0; font-size: 18px; color: #242424;">Fashion Doniya BD — Email Pipeline Test</h2>
        <p style="margin: 4px 0 0; font-size: 12px; color: #666;">Admin Diagnostics &amp; Delivery Verification</p>
      </div>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">${customNote
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>')}</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: #fff; border: 1px solid #EDE5D9;">
        <tr><td style="padding: 8px 10px; border-bottom: 1px solid #EDE5D9; font-weight: bold;">Mode / Target</td><td style="padding: 8px 10px; border-bottom: 1px solid #EDE5D9;">${provider}</td></tr>
        <tr><td style="padding: 8px 10px; border-bottom: 1px solid #EDE5D9; font-weight: bold;">Runtime</td><td style="padding: 8px 10px; border-bottom: 1px solid #EDE5D9;">${c.env?.DB ? 'Cloudflare D1' : 'LibSQL / SQLite'}</td></tr>
        <tr><td style="padding: 8px 10px; font-weight: bold;">Timestamp (UTC)</td><td style="padding: 8px 10px;">${nowIso}</td></tr>
      </table>
    </div>
  `;

  const result = await sendTransactionalEmail(c.env, {
    to,
    subject,
    html,
    text: `${subject}\n\n${customNote}\n\nMode: ${provider}\nTimestamp: ${nowIso}`,
    provider,
  });

  const db = c.get('db');
  await appendAdminLog(
    db,
    'ইমেইল ডেলিভারি ডায়াগনস্টিক টেস্ট',
    'diagnostics',
    `প্রাপক: ${to} · মোড: ${provider} · ফলাফল: ${result.delivered ? `সফল (${result.provider})` : 'ব্যর্থ'}`,
    c.get('user')?.email || 'Admin'
  );

  return c.json({
    success: result.delivered,
    ...result,
    to,
    requestedProvider: provider,
  });
});

diagnosticsRouter.post('/test-upload', async (c) => {
  const reqContentType = (c.req.header('content-type') || '').toLowerCase();
  let payload = null;

  if (!reqContentType.includes('multipart/form-data')) {
    const cloned = c.req.raw.clone();
    const jsonBody = (await cloned.json().catch(() => ({}))) as {
      synthetic?: boolean;
      dataUrl?: string;
      fileName?: string;
    };
    if (jsonBody?.synthetic && !jsonBody?.dataUrl) {
      payload = {
        bytes: createSyntheticTestPng(),
        contentType: 'image/png',
        ext: 'png',
        fileNameBase: 'diag_synthetic_test',
        rawDataUrl: '',
      };
    }
  }

  if (!payload) {
    payload = await parseImageUploadRequest(c);
  }

  if (!payload) {
    return c.json(
      {
        success: false,
        message: 'শুধুমাত্র বৈধ ছবির ফাইল (PNG, JPG, WEBP, GIF, SVG) অথবা সিন্থেটিক টেস্ট ব্যবহার করুন।',
      },
      400
    );
  }

  if (payload.bytes.length > 10 * 1024 * 1024) {
    return c.json(
      { success: false, message: 'ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইটের মধ্যে হতে হবে।' },
      400
    );
  }

  const safePrefixName = payload.fileNameBase.startsWith('diag_')
    ? payload.fileNameBase
    : `diag_${payload.fileNameBase}`;

  const stored = await storeImageBytes(
    c.env,
    { ...payload, fileNameBase: safePrefixName },
    { verifyR2Readback: true }
  );

  const db = c.get('db');
  await appendAdminLog(
    db,
    'ইমেজ আপলোড ডায়াগনস্টিক টেস্ট',
    'diagnostics',
    `প্রোভাইডার: ${stored.provider} · সাইজ: ${stored.sizeBytes} bytes · সময়: ${stored.durationMs}ms`,
    c.get('user')?.email || 'Admin'
  );

  return c.json({
    success: true,
    ...stored,
  });
});

diagnosticsRouter.delete('/test-upload', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { key?: string };
  const key = String(c.req.query('key') || body?.key || '').trim();

  if (!key || !key.startsWith('uploads/diag_') || key.includes('..')) {
    return c.json(
      { success: false, message: 'শুধুমাত্র ডায়াগনস্টিক টেস্ট ফাইল (uploads/diag_*) মুছে ফেলা যাবে।' },
      400
    );
  }

  if (!c.env?.MEDIA_BUCKET) {
    return c.json({
      success: true,
      deleted: false,
      message: 'R2 বাকেট বাইন্ড করা নেই (কোনো রিমোট ফাইল মুছতে হয়নি)।',
    });
  }

  await c.env.MEDIA_BUCKET.delete(key);
  return c.json({ success: true, deleted: true, key });
});

diagnosticsRouter.post('/test-database', async (c) => {
  const db = c.get('db');
  const startedAt = Date.now();

  try {
    const [prodCount, catCount, orderCount, userCount, settingsCount] = await Promise.all([
      db.select({ value: count() }).from(products),
      db.select({ value: count() }).from(categories),
      db.select({ value: count() }).from(orders),
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(systemSettings),
    ]);

    const readDurationMs = Date.now() - startedAt;
    const writeStart = Date.now();
    const diagKey = `diag:db:${Date.now()}`;
    const diagValue = JSON.stringify({ ping: true, ts: Date.now() });
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    await db.insert(systemCache).values({
      key: diagKey,
      value: diagValue,
      expiresAt,
      updatedAt: nowIso,
    });
    const readBack = await db
      .select()
      .from(systemCache)
      .where(eq(systemCache.key, diagKey))
      .get();
    await db.delete(systemCache).where(eq(systemCache.key, diagKey));

    const writeRoundTripMs = Date.now() - writeStart;

    return c.json({
      success: true,
      runtime: c.env?.DB ? 'cloudflare-d1' : 'libsql-sqlite',
      readDurationMs,
      writeRoundTripMs,
      totalDurationMs: Date.now() - startedAt,
      writeReadMatch: readBack?.value === diagValue,
      counts: {
        products: Number(prodCount[0]?.value ?? 0),
        categories: Number(catCount[0]?.value ?? 0),
        orders: Number(orderCount[0]?.value ?? 0),
        users: Number(userCount[0]?.value ?? 0),
        systemSettings: Number(settingsCount[0]?.value ?? 0),
      },
    });
  } catch (err) {
    return c.json(
      {
        success: false,
        runtime: c.env?.DB ? 'cloudflare-d1' : 'libsql-sqlite',
        durationMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : 'Database diagnostic query failed',
      },
      500
    );
  }
});

diagnosticsRouter.post('/test-cache', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { action?: 'test' | 'purge' };
  if (body?.action === 'purge') {
    const startedAt = Date.now();
    await invalidateHomeCache(c.env);
    clearBulkMicroCache();
    return c.json({
      success: true,
      action: 'purge',
      backend: c.env?.CACHE_KV ? 'cloudflare-kv+memory' : 'memory-only',
      durationMs: Date.now() - startedAt,
      message: 'Edge cache, KV এবং micro-cache সফলভাবে ক্লিয়ার করা হয়েছে।',
    });
  }

  const startedAt = Date.now();
  const key = `diag_cache_${Date.now()}`;
  const payload = { ok: true, nonce: crypto.randomUUID(), ts: Date.now() };

  await setEdgeCache(c.env, key, payload, 60);
  const fetched = await getEdgeCache<typeof payload>(c.env, key);
  await deleteEdgeCache(c.env, key);

  const readBackMatch = Boolean(fetched && fetched.nonce === payload.nonce);

  return c.json({
    success: readBackMatch,
    action: 'test',
    backend: c.env?.CACHE_KV ? 'cloudflare-kv+memory' : 'memory-only',
    readBackMatch,
    durationMs: Date.now() - startedAt,
  });
});

diagnosticsRouter.post('/test-sms', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    to?: string;
    message?: string;
    dryRun?: boolean;
  };

  const rawPhone = String(body?.to || '').trim();
  const normalizedPhone = normalizePhone(rawPhone);
  const validPhone = /^01[3-9]\d{8}$/.test(normalizedPhone);
  const smsEnabled = isSmsGloballyEnabled(c.env);
  const smsConfigured = isSmsConfigured(c.env);

  if (!rawPhone || !validPhone) {
    return c.json(
      {
        success: false,
        validPhone: false,
        normalizedPhone,
        smsEnabled,
        smsConfigured,
        message: 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)।',
      },
      400
    );
  }

  if (body?.dryRun || !smsEnabled) {
    return c.json({
      success: true,
      dryRun: true,
      delivered: false,
      provider: smsEnabled ? 'dry-run' : 'disabled',
      validPhone: true,
      normalizedPhone,
      smsEnabled,
      smsConfigured,
      message: smsEnabled
        ? 'ড্রাই-রান সফল: নম্বর ও গেটওয়ে যাচাই সম্পন্ন হয়েছে।'
        : 'SMS_ENABLED=false থাকায় গেটওয়ে বন্ধ আছে (নম্বর ফরম্যাট বৈধ)।',
    });
  }

  const startedAt = Date.now();
  const text =
    String(body?.message || '').trim() ||
    `Fashion Doniya BD: Admin SMS diagnostic test (${new Date().toLocaleTimeString('en-GB')}).`;

  const result = await sendTransactionalSms(c.env, {
    to: normalizedPhone,
    message: text,
  });

  return c.json({
    success: result.delivered,
    dryRun: false,
    validPhone: true,
    normalizedPhone,
    smsEnabled,
    smsConfigured,
    durationMs: Date.now() - startedAt,
    ...result,
  });
});

diagnosticsRouter.post('/test-ai', async (c) => {
  const apiKey = String(c.env?.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return c.json({
      success: false,
      configured: false,
      message: 'GEMINI_API_KEY এনভায়রনমেন্টে সেট করা নেই।',
    });
  }

  const startedAt = Date.now();
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=10`
    );
    const durationMs = Date.now() - startedAt;

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return c.json({
        success: false,
        configured: true,
        status: resp.status,
        durationMs,
        message: errText.slice(0, 220) || `Gemini API HTTP ${resp.status}`,
      });
    }

    const json = (await resp.json().catch(() => ({}))) as {
      models?: Array<{ name?: string }>;
    };
    const models = (json?.models || [])
      .map((m) => String(m.name || '').replace(/^models\//, ''))
      .filter(Boolean);

    return c.json({
      success: true,
      configured: true,
      status: resp.status,
      durationMs,
      modelCount: models.length,
      sampleModels: models.slice(0, 5),
    });
  } catch (err) {
    return c.json({
      success: false,
      configured: true,
      durationMs: Date.now() - startedAt,
      message: err instanceof Error ? err.message : 'Gemini API network failure',
    });
  }
});
