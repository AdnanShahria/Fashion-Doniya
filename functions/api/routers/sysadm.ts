import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { systemSettings, otpCodes } from '../../../backend/server/db/schemas/index';
import { getSysadmEmail, signSysadmJwt, verifySysadmRequest } from '../utils/sysadmAuth';
import { hashPassword, verifyPassword, generateSecureOtp } from '../utils/auth-helper';
import { sendTransactionalEmail, getEmailProvidersStatus } from '../utils/email';
import { invalidateHomeCache } from '../utils/cache';
import { clearBulkMicroCache } from './bulk';
import { authRateLimiter } from '../utils/rateLimiter';

export const sysadmRouter = new Hono<AppEnv>();

// Step 1: Request OTP for SuperAdmin login
sysadmRouter.post('/request-otp', authRateLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { email?: string };
  const email = String(body?.email || '').trim().toLowerCase();
  const expectedEmail = getSysadmEmail(c.env);

  if (!email || email !== expectedEmail) {
    return c.json({ success: false, message: 'Unauthorized SuperAdmin email.' }, 403);
  }

  const code = generateSecureOtp();
  const { salt, hash } = await hashPassword(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  const db = c.get('db');
  await db.insert(otpCodes).values({
    id: `sysadm-otp-${Date.now()}`,
    identifier: email,
    codeHash: `${salt}:${hash}`,
    purpose: 'sysadm_login',
    expiresAt,
    attempts: 0,
    createdAt: now.toISOString(),
  });

  await sendTransactionalEmail(c.env, {
    to: email,
    subject: 'Fashion Doniya SuperAdmin OTP',
    html: `<p>Your SuperAdmin login OTP is: <strong>${code}</strong></p>`,
    text: `Your SuperAdmin login OTP is: ${code}`,
  });

  let hostname = '';
  try {
    hostname = new URL(c.req.url).hostname;
  } catch {
    hostname = '';
  }
  const isLocalDev =
    c.env?.NODE_ENV !== 'production' &&
    (hostname === 'localhost' || hostname === '127.0.0.1');

  return c.json({
    success: true,
    message: 'OTP dispatched.',
    ...(isLocalDev ? { devOtp: code } : {}),
  });
});

// Step 2: Verify OTP & issue SuperAdmin JWT
sysadmRouter.post('/verify-otp', authRateLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { email?: string; otp?: string };
  const email = String(body?.email || '').trim().toLowerCase();
  const otp = String(body?.otp || '').trim();
  if (!email || !otp || email !== getSysadmEmail(c.env)) {
    return c.json({ success: false, message: 'Invalid credentials.' }, 401);
  }

  const db = c.get('db');
  const rows = await db.select().from(otpCodes).where(eq(otpCodes.identifier, email));
  const latest = rows
    .filter((r) => r.purpose === 'sysadm_login' && !r.consumedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (!latest || new Date(latest.expiresAt).getTime() < Date.now()) {
    return c.json({ success: false, message: 'OTP expired or missing.' }, 401);
  }

  const [salt, expectedHash] = latest.codeHash.split(':');
  const valid = await verifyPassword(otp, salt, expectedHash);
  if (!valid) {
    return c.json({ success: false, message: 'Invalid OTP.' }, 401);
  }

  await db
    .update(otpCodes)
    .set({ consumedAt: new Date().toISOString() })
    .where(eq(otpCodes.id, latest.id));

  const token = await signSysadmJwt(c.env, email);
  return c.json({ success: true, token, email });
});

// Authenticated SuperAdmin middleware
sysadmRouter.use('/*', async (c, next) => {
  if (c.req.path.endsWith('/request-otp') || c.req.path.endsWith('/verify-otp')) {
    return next();
  }
  const ok = await verifySysadmRequest(c);
  if (!ok) {
    return c.json({ success: false, message: 'Forbidden: SuperAdmin access required' }, 403);
  }
  return next();
});

sysadmRouter.get('/status', async (c) => {
  const db = c.get('db');
  const demoRow = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, 'demo.mode'))
    .get();
  const tierRow = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, 'tier_capabilities'))
    .get();
  return c.json({
    success: true,
    demoMode: demoRow?.value === 'true' || c.env?.DEMO_MODE === 'true',
    tierCapabilities: tierRow ? JSON.parse(tierRow.value) : {},
    bindings: {
      hasD1: Boolean(c.env?.DB),
      hasR2: Boolean(c.env?.MEDIA_BUCKET),
      hasKV: Boolean(c.env?.CACHE_KV),
    },
    emailProviders: getEmailProvidersStatus(c.env),
  });
});

sysadmRouter.post('/test-email', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { to?: string };
  const to = String(body?.to || getSysadmEmail(c.env)).trim();
  const result = await sendTransactionalEmail(c.env, {
    to,
    subject: 'Fashion Doniya BD — Email Pipeline Test',
    html: '<p>Multi-provider email delivery test (SendPulse -> Resend -> Amazon SES -> Apps Script).</p>',
    text: 'Multi-provider email delivery test.',
  });
  return c.json({ success: result.delivered, ...result });
});

sysadmRouter.post('/cache/purge', async (c) => {
  await invalidateHomeCache(c.env);
  clearBulkMicroCache();
  return c.json({ success: true, message: 'Edge cache purged.' });
});

sysadmRouter.post('/demo-mode', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { enabled?: boolean };
  const enabled = Boolean(body?.enabled);
  const db = c.get('db');
  await db
    .insert(systemSettings)
    .values({
      key: 'demo.mode',
      value: enabled ? 'true' : 'false',
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: enabled ? 'true' : 'false', updatedAt: new Date().toISOString() },
    });
  return c.json({ success: true, demoMode: enabled });
});

// Cloudflare Provisioning Helper (calls Cloudflare REST API v4 to create D1/R2/KV resources)
sysadmRouter.post('/provision', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { projectName?: string };
  const projectName = String(body?.projectName || 'fashion-doniya')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');

  const cfToken = String(c.env?.CLOUDFLARE_API_TOKEN || '').trim();
  const cfAccountId = String(c.env?.CLOUDFLARE_ACCOUNT_ID || '').trim();

  if (!cfToken || !cfAccountId) {
    return c.json(
      {
        success: false,
        message: 'CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be configured for automated provisioning.',
        commands: [
          `bunx wrangler d1 create ${projectName}`,
          `bunx wrangler d1 create ${projectName}-prev`,
          `bunx wrangler r2 bucket create ${projectName}`,
          `bunx wrangler r2 bucket create ${projectName}-prev`,
          `bunx wrangler kv namespace create CACHE_KV`,
          `bunx wrangler kv namespace create CACHE_KV --preview`,
          `bunx wrangler pages project create ${projectName} --production-branch main`,
        ],
      },
      400
    );
  }

  const cfHeaders = {
    Authorization: `Bearer ${cfToken}`,
    'Content-Type': 'application/json',
  };

  const d1Resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database`,
    {
      method: 'POST',
      headers: cfHeaders,
      body: JSON.stringify({ name: projectName }),
    }
  );
  const d1Json = await d1Resp.json();

  const kvResp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/storage/kv/namespaces`,
    {
      method: 'POST',
      headers: cfHeaders,
      body: JSON.stringify({ title: `${projectName}-CACHE_KV` }),
    }
  );
  const kvJson = await kvResp.json();

  const r2Resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/r2/buckets`,
    {
      method: 'POST',
      headers: cfHeaders,
      body: JSON.stringify({ name: projectName }),
    }
  );
  const r2Json = await r2Resp.json();

  return c.json({
    success: true,
    projectName,
    d1: d1Json,
    kv: kvJson,
    r2: r2Json,
  });
});

// Store Factory (1-click multi-niche preset switcher)
sysadmRouter.post('/store-factory', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { preset?: string };
  const preset = String(body?.preset || 'fabric-boutique');
  const db = c.get('db');
  const now = new Date().toISOString();

  await db
    .insert(systemSettings)
    .values({ key: 'store.preset', value: JSON.stringify(preset), updatedAt: now })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: JSON.stringify(preset), updatedAt: now },
    });

  await invalidateHomeCache(c.env);
  clearBulkMicroCache();
  return c.json({ success: true, preset, message: `Preset "${preset}" applied.` });
});
