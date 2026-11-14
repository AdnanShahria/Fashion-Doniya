import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { users, systemSettings, otpCodes } from '../../../backend/server/db/schemas/index';
import {
  hashPassword,
  verifyPassword,
  signJwt,
  resolveJwtSecret,
} from '../utils/auth-helper';
import { normalizePhone, safeJsonParse, appendAdminLog } from '../utils/helpers';
import { sendTransactionalEmail } from '../utils/email';
import { authRateLimiter } from '../utils/rateLimiter';

export const authRouter = new Hono<AppEnv>();
export const adminAuthRouter = new Hono<AppEnv>();

interface AdminAccountRecord {
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
  passwordSalt: string;
  passwordHash: string;
  updatedAt: string;
}

// Customer Registration
authRouter.post('/register', authRateLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const fullName = String(body.fullName || '').trim();
  const phone = normalizePhone(String(body.phone || ''));
  const password = String(body.password || '');
  const email = body.email ? String(body.email).trim().toLowerCase() : null;

  if (!fullName || !phone || !password || password.length < 4) {
    return c.json(
      { success: false, message: 'নাম, মোবাইল নম্বর এবং কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড আবশ্যক।' },
      400
    );
  }

  const db = c.get('db');
  const existing = await db.select().from(users).where(eq(users.phone, phone)).get();
  if (existing && existing.passwordHash) {
    return c.json(
      { success: false, message: 'এই মোবাইল নম্বরে ইতিমধ্যেই একটি অ্যাকাউন্ট রয়েছে।' },
      409
    );
  }

  const now = new Date().toISOString();
  const { salt, hash } = await hashPassword(password);
  const userId = existing?.id || `cust-${Date.now()}`;

  if (existing) {
    await db
      .update(users)
      .set({
        fullName,
        email: email || existing.email,
        passwordHash: hash,
        passwordSalt: salt,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  } else {
    await db.insert(users).values({
      id: userId,
      fullName,
      phone,
      email,
      passwordHash: hash,
      passwordSalt: salt,
      role: 'user',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  }

  const token = await signJwt(
    {
      sub: userId,
      phone,
      email: email || undefined,
      fullName,
      role: 'user',
    },
    resolveJwtSecret(c.env)
  );

  return c.json({
    success: true,
    token,
    user: { id: userId, fullName, phone, email, role: 'user', status: 'active' },
  });
});

// Customer Login
authRouter.post('/login', authRateLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const phone = normalizePhone(String(body.phone || ''));
  const password = String(body.password || '');

  if (!phone || !password) {
    return c.json({ success: false, message: 'মোবাইল নম্বর এবং পাসওয়ার্ড দিন।' }, 400);
  }

  const db = c.get('db');
  const userRow = await db.select().from(users).where(eq(users.phone, phone)).get();
  if (!userRow || !userRow.passwordHash || !userRow.passwordSalt) {
    return c.json({ success: false, message: 'মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়।' }, 401);
  }
  if (userRow.status === 'blocked') {
    return c.json(
      { success: false, code: 'ACCOUNT_BLOCKED', message: 'আপনার অ্যাকাউন্টটি ব্লক করা হয়েছে।' },
      403
    );
  }

  const valid = await verifyPassword(password, userRow.passwordSalt, userRow.passwordHash);
  if (!valid) {
    return c.json({ success: false, message: 'মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়।' }, 401);
  }

  const token = await signJwt(
    {
      sub: userRow.id,
      phone: userRow.phone,
      email: userRow.email || undefined,
      fullName: userRow.fullName,
      role: 'user',
    },
    resolveJwtSecret(c.env)
  );

  return c.json({
    success: true,
    token,
    user: {
      id: userRow.id,
      fullName: userRow.fullName,
      phone: userRow.phone,
      email: userRow.email || undefined,
      district: userRow.district || undefined,
      upazila: userRow.upazila || undefined,
      area: userRow.area || undefined,
      fullAddress: userRow.fullAddress || undefined,
      savedMeasurements: safeJsonParse(userRow.savedMeasurements, undefined),
      status: userRow.status,
      createdAt: userRow.createdAt,
    },
  });
});

authRouter.get('/me', async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
  const db = c.get('db');
  const userRow = await db.select().from(users).where(eq(users.id, authUser.id)).get();
  return c.json({
    success: true,
    user: userRow
      ? {
          id: userRow.id,
          fullName: userRow.fullName,
          phone: userRow.phone,
          email: userRow.email,
          district: userRow.district,
          upazila: userRow.upazila,
          area: userRow.area,
          fullAddress: userRow.fullAddress,
          savedMeasurements: safeJsonParse(userRow.savedMeasurements, undefined),
          walletBalance: userRow.walletBalance,
        }
      : authUser,
  });
});

// Forgot password (sends OTP via SendPulse/fallback email)
authRouter.post('/forgot-password', authRateLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const identifier = String(body.email || body.phone || '').trim();
  if (!identifier) {
    return c.json({ success: false, message: 'ইমেইল বা মোবাইল নম্বর প্রদান করুন।' }, 400);
  }
  const db = c.get('db');
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const { salt, hash } = await hashPassword(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

  await db.insert(otpCodes).values({
    id: `otp-${Date.now()}`,
    identifier: identifier.toLowerCase(),
    codeHash: `${salt}:${hash}`,
    purpose: 'password_reset',
    expiresAt,
    attempts: 0,
    createdAt: now.toISOString(),
  });

  if (identifier.includes('@')) {
    await sendTransactionalEmail(c.env, {
      to: identifier,
      subject: 'Fashion Doniya BD — পাসওয়ার্ড রিসেট কোড (OTP)',
      html: `<p>আপনার পাসওয়ার্ড রিসেট ভেরিফিকেশন কোড: <strong>${code}</strong> (১৫ মিনিটের জন্য বৈধ)</p>`,
      text: `Your password reset code is: ${code}`,
    });
  }

  return c.json({
    success: true,
    message: 'পাসওয়ার্ড রিসেট কোড পাঠানো হয়েছে।',
  });
});

// Admin Login -> returns signed HS256 JWT
adminAuthRouter.post('/login', authRateLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return c.json(
      { success: false, message: 'অ্যাডমিন ইমেইল এবং পাসওয়ার্ড উভয়ই প্রদান করুন।' },
      400
    );
  }

  const db = c.get('db');
  const row = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, 'admin_account'))
    .get();

  const admin = safeJsonParse<AdminAccountRecord | null>(row?.value, null);
  if (
    !admin ||
    email !== admin.email.toLowerCase() ||
    !(await verifyPassword(password, admin.passwordSalt, admin.passwordHash))
  ) {
    return c.json(
      { success: false, message: 'অ্যাডমিন ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' },
      401
    );
  }

  const token = await signJwt(
    {
      sub: 'admin-primary',
      email: admin.email,
      fullName: admin.name,
      role: admin.role || 'super_admin',
    },
    resolveJwtSecret(c.env),
    60 * 60 * 24 * 7
  );

  await appendAdminLog(
    db,
    'অ্যাডমিন প্যানেলে লগইন সম্পন্ন',
    'security',
    `${admin.name} (${admin.email}) লগইন করেছেন`,
    admin.name
  );

  return c.json({
    success: true,
    token,
    admin: {
      id: 'admin-primary',
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
});

adminAuthRouter.get('/me', async (c) => {
  if (!c.get('isAdmin')) {
    return c.json({ success: false, message: 'Unauthorized Admin Access' }, 401);
  }
  const db = c.get('db');
  const row = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, 'admin_account'))
    .get();
  const admin = safeJsonParse<AdminAccountRecord | null>(row?.value, null);
  return c.json({
    success: true,
    admin: admin
      ? { id: 'admin-primary', email: admin.email, name: admin.name, role: admin.role }
      : c.get('user'),
  });
});

adminAuthRouter.post('/change-password', async (c) => {
  if (!c.get('isAdmin')) {
    return c.json({ success: false, message: 'Unauthorized Admin Access' }, 401);
  }
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');
  const newEmail = String(body.newEmail || '').trim().toLowerCase();
  const newName = String(body.newName || '').trim();

  const db = c.get('db');
  const row = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, 'admin_account'))
    .get();
  const admin = safeJsonParse<AdminAccountRecord | null>(row?.value, null);
  if (!admin) {
    return c.json({ success: false, message: 'Admin account not found' }, 404);
  }

  const valid = await verifyPassword(currentPassword, admin.passwordSalt, admin.passwordHash);
  if (!currentPassword || !valid) {
    return c.json({ success: false, message: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' }, 400);
  }
  if (newPassword && newPassword.length < 6) {
    return c.json({ success: false, message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }, 400);
  }

  if (newPassword) {
    const { salt, hash } = await hashPassword(newPassword);
    admin.passwordSalt = salt;
    admin.passwordHash = hash;
  }
  if (newEmail && newEmail.includes('@')) admin.email = newEmail;
  if (newName) admin.name = newName;
  admin.updatedAt = new Date().toISOString();

  await db
    .update(systemSettings)
    .set({ value: JSON.stringify(admin), updatedAt: admin.updatedAt })
    .where(eq(systemSettings.key, 'admin_account'));

  await appendAdminLog(
    db,
    'অ্যাডমিন নিরাপত্তা তথ্য আপডেট',
    'security',
    'অ্যাডমিন অ্যাকাউন্টের পাসওয়ার্ড/প্রোফাইল আপডেট করা হয়েছে'
  );

  return c.json({
    success: true,
    message: 'অ্যাডমিন নিরাপত্তা তথ্য সফলভাবে আপডেট হয়েছে।',
    admin: {
      id: 'admin-primary',
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
});
