import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { createClient } from '@libsql/client';
import { app } from '../functions/api/app';
import type { Bindings } from '../functions/api/types';

const TEST_DB_REL = `backend/test_auth_security_${Date.now()}.db`;
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
  ORBITMAIL_API_KEY: '',
  SENDPULSE_CLIENT_ID: '',
  SENDPULSE_CLIENT_SECRET: '',
  RESEND_API_KEY: '',
  AMAZON_SES_ACCESS_KEY_ID: '',
  GOOGLE_SCRIPT_URL: '',
} as unknown as Bindings;

async function apiReq(
  pathname: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    origin?: string;
  } = {}
): Promise<Response> {
  const url = `${options.origin || 'http://localhost:9999'}${pathname}`;
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

const EMAIL_ENV_KEYS = [
  'ORBITMAIL_API_KEY',
  'SENDPULSE_CLIENT_ID',
  'SENDPULSE_CLIENT_SECRET',
  'RESEND_API_KEY',
  'AMAZON_SES_ACCESS_KEY_ID',
  'GOOGLE_SCRIPT_URL',
];
const savedEmailEnv: Record<string, string | undefined> = {};

beforeAll(async () => {
  for (const key of EMAIL_ENV_KEYS) {
    savedEmailEnv[key] = process.env[key];
    delete process.env[key];
  }
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
});

afterAll(() => {
  for (const key of EMAIL_ENV_KEYS) {
    if (savedEmailEnv[key] !== undefined) process.env[key] = savedEmailEnv[key];
    else delete process.env[key];
  }
  try {
    if (fs.existsSync(TEST_DB_ABS)) fs.unlinkSync(TEST_DB_ABS);
  } catch {
    // ignore cleanup error on Windows if handle still releasing
  }
});

describe('Authentication, Session Lifecycle, RBAC & BOLA/IDOR Security', () => {
  const userPhone = '01755667788';
  const userEmail = 'amina.test@example.com';
  let userToken = '';
  let userId = '';

  const user2Phone = '01855667799';
  let user2Token = '';

  it('rejects invalid phone or email during registration (400)', async () => {
    const badPhone = await apiReq('/api/v1/auth/register', {
      method: 'POST',
      body: { fullName: 'Test User', phone: '12345', password: 'password123' },
    });
    expect(badPhone.status).toBe(400);

    const badEmail = await apiReq('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Test User',
        phone: userPhone,
        email: 'not-an-email',
        password: 'password123',
      },
    });
    expect(badEmail.status).toBe(400);
  });

  it('registers a new customer with phone and email and issues JWT', async () => {
    const res = await apiReq('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'আমিনা বেগম',
        phone: userPhone,
        email: userEmail,
        password: 'Password@123',
      },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(typeof json.token).toBe('string');
    expect(json.user.phone).toBe(userPhone);
    expect(json.user.email).toBe(userEmail);
    userToken = json.token;
    userId = json.user.id;
  });

  it('prevents duplicate phone AND duplicate email registration (409)', async () => {
    const dupPhone = await apiReq('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Duplicate Phone',
        phone: userPhone,
        email: 'other@example.com',
        password: 'Password@123',
      },
    });
    expect(dupPhone.status).toBe(409);

    const dupEmail = await apiReq('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Duplicate Email',
        phone: user2Phone,
        email: userEmail.toUpperCase(),
        password: 'Password@123',
      },
    });
    expect(dupEmail.status).toBe(409);
  });

  it('supports login with BOTH phone and email, plus seeded demo customer', async () => {
    const loginByPhone = await apiReq('/api/v1/auth/login', {
      method: 'POST',
      body: { phone: userPhone, password: 'Password@123' },
    });
    expect(loginByPhone.status).toBe(200);
    const j1 = (await loginByPhone.json()) as any;
    expect(j1.success).toBe(true);
    expect(j1.user.id).toBe(userId);

    const loginByEmail = await apiReq('/api/v1/auth/login', {
      method: 'POST',
      body: { identifier: userEmail, password: 'Password@123' },
    });
    expect(loginByEmail.status).toBe(200);
    const j2 = (await loginByEmail.json()) as any;
    expect(j2.success).toBe(true);
    expect(j2.user.id).toBe(userId);

    // Demo customer seeded with password '123456'
    const demoLogin = await apiReq('/api/v1/auth/login', {
      method: 'POST',
      body: { phone: '01711223344', password: '123456' },
    });
    expect(demoLogin.status).toBe(200);
    const jDemo = (await demoLogin.json()) as any;
    expect(jDemo.success).toBe(true);
    expect(jDemo.token).toBeTruthy();
  });

  it('verifies /api/v1/auth/me with valid token and rejects missing/invalid tokens', async () => {
    const unauth = await apiReq('/api/v1/auth/me');
    expect(unauth.status).toBe(401);

    const badToken = await apiReq('/api/v1/auth/me', {
      headers: { Authorization: 'Bearer invalid.jwt.token' },
    });
    expect(badToken.status).toBe(401);

    const valid = await apiReq('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(valid.status).toBe(200);
    const json = (await valid.json()) as any;
    expect(json.success).toBe(true);
    expect(json.user.email).toBe(userEmail);
  });

  it('blocks unauthenticated and cross-user BOLA attacks on /customers/sync, /cart, and /returns', async () => {
    // Register second user
    const reg2 = await apiReq('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Second User',
        phone: user2Phone,
        email: 'second@example.com',
        password: 'Password@123',
      },
    });
    expect(reg2.status).toBe(200);
    user2Token = ((await reg2.json()) as any).token;

    // 1. Unauthenticated /customers/sync must fail with 401
    const unauthSync = await apiReq('/api/v1/customers/sync', {
      method: 'POST',
      body: { user: { id: userId, phone: userPhone, fullName: 'Hijacked' } },
    });
    expect(unauthSync.status).toBe(401);

    // 2. Cross-user /customers/sync must fail with 403
    const crossSync = await apiReq('/api/v1/customers/sync', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}` },
      body: { user: { id: userId, phone: userPhone, fullName: 'Hijacked' } },
    });
    expect(crossSync.status).toBe(403);

    // 3. Cart namespace isolation: user1 saves cart, unauthenticated x-session-id=user1.id cannot read it
    const saveCart = await apiReq('/api/v1/cart', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { items: [{ id: 'secret-item', productId: 'prod-35-saree-1', yards: 5 }] },
    });
    expect(saveCart.status).toBe(200);

    const hijackCart = await apiReq('/api/v1/cart', {
      headers: { 'x-session-id': userId },
    });
    expect(hijackCart.status).toBe(200);
    const hijackJson = (await hijackCart.json()) as any;
    expect(hijackJson.items).toEqual([]);

    // 4. Unverified return creation for non-existent / unowned order must fail (403/404)
    const badReturn = await apiReq('/api/v1/returns', {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}` },
      body: { orderId: 'non-existent-order', reason: 'test', refundAmount: 999999 },
    });
    expect([403, 404]).toContain(badReturn.status);
  });

  it('protects admin routes and enforces RBAC', async () => {
    const noAdmin = await apiReq('/api/v1/admin/customers');
    expect(noAdmin.status).toBe(401);

    const custAsAdmin = await apiReq('/api/v1/admin/customers', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(custAsAdmin.status).toBe(401);

    const adminLogin = await apiReq('/api/v1/admin/auth/login', {
      method: 'POST',
      body: { email: 'admin@fashiondoniyabd.com', password: 'TestAdminPassword#2026' },
    });
    expect(adminLogin.status).toBe(200);
    const adminJson = (await adminLogin.json()) as any;
    expect(adminJson.success).toBe(true);
    expect(adminJson.token).toBeTruthy();

    const okAdmin = await apiReq('/api/v1/admin/customers', {
      headers: { Authorization: `Bearer ${adminJson.token}` },
    });
    expect(okAdmin.status).toBe(200);
  });

  it('handles forgot-password -> OTP invalidation -> reset-password -> old JWT invalidation', async () => {
    // 1. Request OTP #1
    const otp1Res = await apiReq('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { identifier: userEmail },
    });
    expect(otp1Res.status).toBe(200);
    const otp1Json = (await otp1Res.json()) as any;
    expect(otp1Json.success).toBe(true);
    expect(otp1Json.devOtp).toMatch(/^\d{6}$/);

    // 2. Request OTP #2 -> OTP #1 must be invalidated
    const otp2Res = await apiReq('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { identifier: userEmail },
    });
    expect(otp2Res.status).toBe(200);
    const otp2Json = (await otp2Res.json()) as any;
    expect(otp2Json.devOtp).toMatch(/^\d{6}$/);

    // Attempt reset with invalidated OTP #1 (unless identical by 1-in-900000 chance)
    if (otp1Json.devOtp !== otp2Json.devOtp) {
      const staleTry = await apiReq('/api/v1/auth/reset-password', {
        method: 'POST',
        body: {
          identifier: userEmail,
          code: otp1Json.devOtp,
          newPassword: 'NewPassword@456',
        },
      });
      expect(staleTry.status).toBe(400);
    }

    // 3. Reset with valid OTP #2
    const resetOk = await apiReq('/api/v1/auth/reset-password', {
      method: 'POST',
      body: {
        identifier: userEmail,
        code: otp2Json.devOtp,
        newPassword: 'NewPassword@456',
      },
    });
    expect(resetOk.status).toBe(200);

    // 4. Old userToken MUST now be rejected (401) because password changed!
    const oldTokenCheck = await apiReq('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(oldTokenCheck.status).toBe(401);

    // 5. Login with new password succeeds and issues fresh token
    const relogin = await apiReq('/api/v1/auth/login', {
      method: 'POST',
      body: { identifier: userEmail, password: 'NewPassword@456' },
    });
    expect(relogin.status).toBe(200);
    const reloginJson = (await relogin.json()) as any;
    expect(reloginJson.token).toBeTruthy();

    const newTokenCheck = await apiReq('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${reloginJson.token}` },
    });
    expect(newTokenCheck.status).toBe(200);
  });

  it('rejects unauthenticated courier webhook with missing secret in production', async () => {
    const prodEnv = {
      ...testEnv,
      NODE_ENV: 'production',
      COURIER_WEBHOOK_SECRET: '',
    } as unknown as Bindings;
    const req = new Request('https://fashiondoniyabd.com/api/v1/courier/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-courier-webhook-secret': 'fd-courier-webhook-2026',
      },
      body: JSON.stringify({ orderNumber: 'FD-2026-1001', courierStatus: 'Delivered' }),
    });
    const res = await app.fetch(req, prodEnv);
    expect(res.status).toBe(401);
  });

  it('prevents silent takeover of passwordless CRM records via /register', async () => {
    // Admin creates a passwordless CRM customer with an email
    const adminLogin = await apiReq('/api/v1/admin/auth/login', {
      method: 'POST',
      body: { email: 'admin@fashiondoniyabd.com', password: 'TestAdminPassword#2026' },
    });
    const adminToken = ((await adminLogin.json()) as any).token;

    const crmPhone = '01955667700';
    const crmEmail = 'crm.victim@example.com';
    const createCrm = await apiReq('/api/v1/admin/customers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { fullName: 'CRM Victim', phone: crmPhone, email: crmEmail },
    });
    expect(createCrm.status).toBe(201);

    // Attacker tries to claim the CRM account via /register even knowing the email
    const hijackTry = await apiReq('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Attacker',
        phone: crmPhone,
        email: crmEmail,
        password: 'AttackerPassword@123',
      },
    });
    expect(hijackTry.status).toBe(409);
  });

  it('validates email uniqueness & phone format in /customers/sync and prevents blocked user enumeration', async () => {
    // Register a fresh customer to test /customers/sync & block flow
    const victimPhone = '01655667711';
    const victimEmail = 'victim.sync@example.com';
    const reg = await apiReq('/api/v1/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Sync Tester',
        phone: victimPhone,
        email: victimEmail,
        password: 'Password@123',
      },
    });
    expect(reg.status).toBe(200);
    const regJson = (await reg.json()) as any;
    const victimToken = regJson.token;
    const victimId = regJson.user.id;

    // Cannot set email to another user's email
    const dupEmailSync = await apiReq('/api/v1/customers/sync', {
      method: 'POST',
      headers: { Authorization: `Bearer ${victimToken}` },
      body: { user: { id: victimId, phone: victimPhone, email: userEmail } },
    });
    expect(dupEmailSync.status).toBe(409);

    // Cannot set invalid phone
    const badPhoneSync = await apiReq('/api/v1/customers/sync', {
      method: 'POST',
      headers: { Authorization: `Bearer ${victimToken}` },
      body: { user: { id: victimId, phone: '123' } },
    });
    expect(badPhoneSync.status).toBe(400);

    // Admin blocks victim
    const adminLogin = await apiReq('/api/v1/admin/auth/login', {
      method: 'POST',
      body: { email: 'admin@fashiondoniyabd.com', password: 'TestAdminPassword#2026' },
    });
    const adminToken = ((await adminLogin.json()) as any).token;
    const blockRes = await apiReq(`/api/v1/admin/customers/${encodeURIComponent(victimId)}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'blocked' },
    });
    expect(blockRes.status).toBe(200);

    // Wrong password on blocked user must return 401 (no status leak), right password returns 403
    const wrongPassBlocked = await apiReq('/api/v1/auth/login', {
      method: 'POST',
      body: { identifier: victimPhone, password: 'WrongPassword!' },
    });
    expect(wrongPassBlocked.status).toBe(401);

    const rightPassBlocked = await apiReq('/api/v1/auth/login', {
      method: 'POST',
      body: { identifier: victimPhone, password: 'Password@123' },
    });
    expect(rightPassBlocked.status).toBe(403);

    // Existing token for blocked user is rejected on /auth/me
    const blockedMe = await apiReq('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${victimToken}` },
    });
    expect(blockedMe.status).toBe(401);

    // Forgot password for unknown or blocked user returns generic 200 without devOtp
    const forgotBlocked = await apiReq('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { identifier: victimEmail },
    });
    expect(forgotBlocked.status).toBe(200);
    const forgotBlockedJson = (await forgotBlocked.json()) as any;
    expect(forgotBlockedJson.devOtp).toBeUndefined();
  });

  it('returns 503 on /forgot-password in production when no OTP delivery channel succeeds', async () => {
    const prodEnv = {
      ...testEnv,
      NODE_ENV: 'production',
      SMS_ENABLED: 'false',
    } as unknown as Bindings;
    const req = new Request('https://fashiondoniyabd.com/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: userEmail }),
    });
    const res = await app.fetch(req, prodEnv);
    expect(res.status).toBe(503);
  });

  it('rotates admin JWT on password change and invalidates the old admin token', async () => {
    const adminLogin = await apiReq('/api/v1/admin/auth/login', {
      method: 'POST',
      body: { email: 'admin@fashiondoniyabd.com', password: 'TestAdminPassword#2026' },
    });
    expect(adminLogin.status).toBe(200);
    const oldAdminToken = ((await adminLogin.json()) as any).token;

    const changeRes = await apiReq('/api/v1/admin/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${oldAdminToken}` },
      body: {
        currentPassword: 'TestAdminPassword#2026',
        newPassword: 'UpdatedAdmin#2026',
      },
    });
    expect(changeRes.status).toBe(200);
    const changeJson = (await changeRes.json()) as any;
    expect(changeJson.token).toBeTruthy();

    // Old admin token must now fail with 401
    const oldMe = await apiReq('/api/v1/admin/auth/me', {
      headers: { Authorization: `Bearer ${oldAdminToken}` },
    });
    expect(oldMe.status).toBe(401);

    // New admin token must succeed
    const newMe = await apiReq('/api/v1/admin/auth/me', {
      headers: { Authorization: `Bearer ${changeJson.token}` },
    });
    expect(newMe.status).toBe(200);
  });

  it('preserves exact password characters without trim mismatch across reset and login', async () => {
    const spacedPass = '  Pass Space 2026  ';
    const otpRes = await apiReq('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { identifier: userEmail },
    });
    expect(otpRes.status).toBe(200);
    const devOtp = ((await otpRes.json()) as any).devOtp;

    const resetRes = await apiReq('/api/v1/auth/reset-password', {
      method: 'POST',
      body: { identifier: userEmail, code: devOtp, newPassword: spacedPass },
    });
    expect(resetRes.status).toBe(200);

    const loginRes = await apiReq('/api/v1/auth/login', {
      method: 'POST',
      body: { identifier: userEmail, password: spacedPass },
    });
    expect(loginRes.status).toBe(200);
  });
});
