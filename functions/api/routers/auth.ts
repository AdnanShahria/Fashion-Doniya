import { Hono, type Context } from 'hono';
import { and, desc, eq, inArray, isNull, lt, sql } from 'drizzle-orm';
import type { AppEnv, AuthUser } from '../types';
import type { AppDatabase } from '../utils/db-factory';
import { users, systemSettings, otpCodes } from '../../../backend/server/db/schemas/index';
import {
  hashPassword,
  verifyPassword,
  signJwt,
  resolveJwtSecret,
  generateSecureOtp,
  computePasswordVersion,
} from '../utils/auth-helper';
import { normalizePhone, safeJsonParse, appendAdminLog, escapeHtml } from '../utils/helpers';
import { sendTransactionalEmail } from '../utils/email';
import { sendTransactionalSms } from '../utils/sms';
import {
  authRateLimiter,
  checkLoginThrottle,
  clearLoginFailures,
  recordLoginFailure,
} from '../utils/rateLimiter';

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findUserByEmail(db: AppDatabase, email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return undefined;
  return db
    .select()
    .from(users)
    .where(sql`lower(trim(${users.email})) = ${cleanEmail}`)
    .get();
}

async function findUserByIdentifier(db: AppDatabase, rawIdentifier: string) {
  const cleanId = rawIdentifier.trim().toLowerCase();
  if (!cleanId) return undefined;
  if (cleanId.includes('@')) {
    return findUserByEmail(db, cleanId);
  }
  const cleanPhone = normalizePhone(cleanId);
  if (!cleanPhone) return undefined;
  return db.select().from(users).where(eq(users.phone, cleanPhone)).get();
}

function buildPublicCustomerPayload(row: typeof users.$inferSelect, roleOverride?: AuthUser['role']) {
  const role: AuthUser['role'] =
    roleOverride ||
    (row.role === 'admin' || row.role === 'super_admin' || row.role === 'sysadm'
      ? row.role
      : 'user');
  return {
    id: row.id,
    fullName: row.fullName,
    phone: row.phone,
    email: row.email || undefined,
    role,
    district: row.district || undefined,
    upazila: row.upazila || undefined,
    area: row.area || undefined,
    fullAddress: row.fullAddress || undefined,
    address: {
      district: row.district || '',
      upazila: row.upazila || '',
      area: row.area || '',
      fullAddress: row.fullAddress || '',
    },
    savedMeasurements: safeJsonParse(row.savedMeasurements, undefined),
    walletBalance: row.walletBalance,
    totalOrders: row.totalOrders,
    totalSpent: row.totalSpent,
    status: row.status,
    createdAt: row.createdAt,
  };
}

// Customer Registration
authRouter.post('/register', authRateLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const fullName = String(body.fullName || '').trim();
  const phone = normalizePhone(String(body.phone || ''));
  const password = String(body.password || '');
  const email = body.email ? String(body.email).trim().toLowerCase() : null;

  if (!fullName || !phone || !password.trim() || password.length < 6) {
    return c.json(
      { success: false, message: 'নাম, মোবাইল নম্বর এবং কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড আবশ্যক।' },
      400
    );
  }

  if (!/^01[3-9]\d{8}$/.test(phone)) {
    return c.json(
      { success: false, message: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন (01XXXXXXXXX)।' },
      400
    );
  }

  if (email && !EMAIL_RE.test(email)) {
    return c.json(
      { success: false, message: 'সঠিক ইমেইল ঠিকানা প্রদান করুন।' },
      400
    );
  }

  const db = c.get('db');
  const existing = await db.select().from(users).where(eq(users.phone, phone)).get();
  if (existing) {
    if (existing.status === 'blocked') {
      return c.json(
        { success: false, code: 'ACCOUNT_BLOCKED', message: 'আপনার অ্যাকাউন্টটি ব্লক করা হয়েছে।' },
        403
      );
    }
    if (existing.passwordHash) {
      return c.json(
        { success: false, message: 'এই মোবাইল নম্বরে ইতিমধ্যেই একটি অ্যাকাউন্ট রয়েছে।' },
        409
      );
    }
    // Security: never allow unauthenticated /register to silently claim an existing guest/CRM row
    return c.json(
      {
        success: false,
        message: 'এই মোবাইল নম্বরে একটি প্রোফাইল ইতিমধ্যেই রয়েছে। পাসওয়ার্ড সেট করতে পাসওয়ার্ড রিসেট (OTP) ব্যবহার করুন।',
      },
      409
    );
  }

  if (email) {
    const emailConflict = await findUserByEmail(db, email);
    if (emailConflict) {
      return c.json(
        { success: false, message: 'এই ইমেইল ঠিকানায় ইতিমধ্যেই একটি অ্যাকাউন্ট রয়েছে।' },
        409
      );
    }
  }

  const now = new Date().toISOString();
  const { salt, hash } = await hashPassword(password);
  const userId = `cust-${crypto.randomUUID()}`;

  try {
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
  } catch {
    return c.json(
      { success: false, message: 'এই মোবাইল নম্বর বা ইমেইলে ইতিমধ্যেই একটি অ্যাকাউন্ট রয়েছে।' },
      409
    );
  }

  const createdRow = await db.select().from(users).where(eq(users.id, userId)).get();
  const token = await signJwt(
    {
      sub: userId,
      phone,
      email: email || undefined,
      fullName,
      role: 'user',
      pwdVer: computePasswordVersion(hash),
    },
    resolveJwtSecret(c.env)
  );

  return c.json({
    success: true,
    token,
    user: createdRow
      ? buildPublicCustomerPayload(createdRow, 'user')
      : {
          id: userId,
          fullName,
          phone,
          email,
          role: 'user' as const,
          status: 'active',
          createdAt: now,
        },
  });
});

// Customer Login (supports phone or email)
authRouter.post('/login', authRateLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const rawIdentifier = String(body.identifier || body.phone || body.email || '').trim();
  const password = String(body.password || '');

  if (!rawIdentifier || !password) {
    return c.json({ success: false, message: 'মোবাইল নম্বর বা ইমেইল এবং পাসওয়ার্ড দিন।' }, 400);
  }

  const throttleKey = rawIdentifier.includes('@')
    ? rawIdentifier.toLowerCase()
    : normalizePhone(rawIdentifier) || rawIdentifier.toLowerCase();
  const retryAfter = checkLoginThrottle('customer-login', throttleKey);
  if (retryAfter > 0) {
    c.header('Retry-After', String(retryAfter));
    return c.json(
      {
        success: false,
        code: 'RATE_LIMITED',
        message: 'অনেকবার ভুল প্রচেষ্টার কারণে লগইন সাময়িকভাবে সীমাবদ্ধ করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
        retryAfterSeconds: retryAfter,
      },
      429
    );
  }

  const db = c.get('db');
  const userRow = await findUserByIdentifier(db, rawIdentifier);

  if (!userRow || !userRow.passwordHash || !userRow.passwordSalt) {
    recordLoginFailure('customer-login', throttleKey);
    return c.json({ success: false, message: 'মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়।' }, 401);
  }

  // Verify password BEFORE checking blocked status to avoid leaking account status to unauthenticated callers
  const valid = await verifyPassword(password, userRow.passwordSalt, userRow.passwordHash);
  if (!valid) {
    recordLoginFailure('customer-login', throttleKey);
    return c.json({ success: false, message: 'মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়।' }, 401);
  }

  if (userRow.status === 'blocked') {
    return c.json(
      { success: false, code: 'ACCOUNT_BLOCKED', message: 'আপনার অ্যাকাউন্টটি ব্লক করা হয়েছে।' },
      403
    );
  }

  clearLoginFailures('customer-login', throttleKey);

  const role: AuthUser['role'] =
    userRow.role === 'admin' || userRow.role === 'super_admin' || userRow.role === 'sysadm'
      ? userRow.role
      : 'user';

  const token = await signJwt(
    {
      sub: userRow.id,
      phone: userRow.phone,
      email: userRow.email || undefined,
      fullName: userRow.fullName,
      role,
      pwdVer: computePasswordVersion(userRow.passwordHash),
    },
    resolveJwtSecret(c.env)
  );

  return c.json({
    success: true,
    token,
    user: buildPublicCustomerPayload(userRow, role),
  });
});

authRouter.get('/me', async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
  const db = c.get('db');
  const userRow = await db.select().from(users).where(eq(users.id, authUser.id)).get();
  if (!userRow || userRow.status === 'blocked') {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
  return c.json({
    success: true,
    user: buildPublicCustomerPayload(userRow),
  });
});

authRouter.post('/logout', (c) => {
  return c.json({ success: true, message: 'লগআউট সম্পন্ন হয়েছে।' });
});

async function handleResetPasswordWithOtp(
  c: Context<AppEnv>,
  body: Record<string, unknown>
) {
  const identifier = String(body.email || body.phone || body.identifier || '').trim();
  const otp = String(body.otp || body.code || '').trim();
  const newPassword = String(body.newPassword || '');

  if (!identifier) {
    return c.json({ success: false, message: 'ইমেইল বা মোবাইল নম্বর প্রদান করুন।' }, 400);
  }
  if (!newPassword.trim() || newPassword.length < 6) {
    return c.json({ success: false, message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }, 400);
  }
  if (!otp) {
    return c.json(
      {
        success: false,
        code: 'OTP_REQUIRED',
        message: 'পাসওয়ার্ড রিসেট করতে ভেরিফিকেশন কোড (OTP) প্রদান করুন।',
      },
      400
    );
  }

  const db = c.get('db');
  const userRow = await findUserByIdentifier(db, identifier);

  if (!userRow) {
    return c.json(
      { success: false, message: 'ভেরিফিকেশন কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ হয়েছে।' },
      400
    );
  }

  const cleanId = identifier.toLowerCase();
  const cleanPhone = normalizePhone(cleanId);
  const candidateIdentifiers = Array.from(
    new Set<string>(
      [
        cleanId,
        cleanPhone,
        userRow.email ? userRow.email.toLowerCase().trim() : '',
        userRow.phone ? normalizePhone(userRow.phone) : '',
        userRow.phone ? userRow.phone.trim().toLowerCase() : '',
      ].filter(Boolean)
    )
  );

  const matchingOtpRows =
    candidateIdentifiers.length > 0
      ? await db
          .select()
          .from(otpCodes)
          .where(
            and(
              eq(otpCodes.purpose, 'password_reset'),
              isNull(otpCodes.consumedAt),
              inArray(otpCodes.identifier, candidateIdentifiers)
            )
          )
          .orderBy(desc(otpCodes.createdAt))
      : [];

  const latestOtp = matchingOtpRows[0];
  if (!latestOtp || new Date(latestOtp.expiresAt).getTime() < Date.now()) {
    return c.json(
      { success: false, message: 'ভেরিফিকেশন কোডটি মেয়াদোত্তীর্ণ বা পাওয়া যায়নি। নতুন করে কোড পাঠান।' },
      400
    );
  }

  if ((latestOtp.attempts || 0) >= 5) {
    return c.json(
      { success: false, message: 'অনেকবার ভুল কোড দেওয়া হয়েছে। অনুগ্রহ করে নতুন OTP সংগ্রহ করুন।' },
      429
    );
  }

  const [otpSalt, otpHash] = String(latestOtp.codeHash || '').split(':');
  const isOtpValid = otpSalt && otpHash ? await verifyPassword(otp, otpSalt, otpHash) : false;
  if (!isOtpValid) {
    await db
      .update(otpCodes)
      .set({ attempts: (latestOtp.attempts || 0) + 1 })
      .where(eq(otpCodes.id, latestOtp.id));
    return c.json({ success: false, message: 'প্রদত্ত ভেরিফিকেশন কোড (OTP) সঠিক নয়।' }, 400);
  }

  if (userRow.status === 'blocked') {
    return c.json(
      { success: false, code: 'ACCOUNT_BLOCKED', message: 'আপনার অ্যাকাউন্টটি ব্লক করা হয়েছে।' },
      403
    );
  }

  const nowIso = new Date().toISOString();
  await db
    .update(otpCodes)
    .set({ consumedAt: nowIso })
    .where(eq(otpCodes.id, latestOtp.id));

  const { salt, hash } = await hashPassword(newPassword);
  await db
    .update(users)
    .set({
      passwordHash: hash,
      passwordSalt: salt,
      updatedAt: nowIso,
    })
    .where(eq(users.id, userRow.id));

  if (userRow.phone) clearLoginFailures('customer-login', normalizePhone(userRow.phone));
  if (userRow.email) clearLoginFailures('customer-login', userRow.email.toLowerCase());

  // Primary: Email notification
  if (userRow.email && userRow.email.includes('@')) {
    await sendTransactionalEmail(c.env, {
      to: userRow.email,
      subject: 'Fashion Doniya BD — পাসওয়ার্ড পরিবর্তিত হয়েছে',
      html: `<p>প্রিয় ${escapeHtml(userRow.fullName)}, আপনার ফ্যাশন দনিয়া অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।</p>`,
      text: 'Your Fashion Doniya password has been updated successfully.',
    }).catch(() => {});
  } else if (userRow.phone) {
    // Secondary: SMS (only when no email exists on account)
    await sendTransactionalSms(c.env, {
      to: userRow.phone,
      message: `Fashion Doniya: আপনার অ্যাকাউন্টের পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।`,
      isSecondaryFallback: true,
    }).catch(() => {});
  }

  return c.json({ success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' });
}

authRouter.post('/reset-password', authRateLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  return handleResetPasswordWithOtp(c, body);
});

// Forgot password (Email is Primary; SMS is strictly Secondary fallback)
authRouter.post('/forgot-password', authRateLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const identifier = String(body.email || body.phone || body.identifier || '').trim();
  const newPassword = String(body.newPassword || '');

  if (newPassword) {
    return handleResetPasswordWithOtp(c, body);
  }

  if (!identifier) {
    return c.json({ success: false, message: 'ইমেইল বা মোবাইল নম্বর প্রদান করুন।' }, 400);
  }

  const db = c.get('db');
  const userRow = await findUserByIdentifier(db, identifier);

  // Generic success response when user is missing or blocked to prevent account/status enumeration
  if (!userRow || userRow.status === 'blocked') {
    return c.json({
      success: true,
      requiresOtp: true,
      message: 'যদি এই ইমেইল বা মোবাইল নম্বরে কোনো সক্রিয় অ্যাকাউন্ট থাকে, তবে ভেরিফিকেশন কোড (OTP) পাঠানো হয়েছে।',
    });
  }

  const cleanId = identifier.toLowerCase();
  const cleanPhone = normalizePhone(cleanId);
  const candidateIdentifiers = Array.from(
    new Set<string>(
      [
        cleanId,
        cleanPhone,
        userRow.email ? userRow.email.toLowerCase().trim() : '',
        userRow.phone ? normalizePhone(userRow.phone) : '',
        userRow.phone ? userRow.phone.trim().toLowerCase() : '',
      ].filter(Boolean)
    )
  );
  const now = new Date();
  const nowIso = now.toISOString();

  // Prune expired OTP codes & invalidate unconsumed password_reset OTPs for this account
  await db.delete(otpCodes).where(lt(otpCodes.expiresAt, nowIso)).catch(() => {});
  if (candidateIdentifiers.length > 0) {
    await db
      .update(otpCodes)
      .set({ consumedAt: nowIso })
      .where(
        and(
          eq(otpCodes.purpose, 'password_reset'),
          isNull(otpCodes.consumedAt),
          inArray(otpCodes.identifier, candidateIdentifiers)
        )
      );
  }

  // OTP Code Generation (10-minute expiry)
  const code = generateSecureOtp();
  const { salt, hash } = await hashPassword(code);
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  const primaryEmail = (userRow.email && userRow.email.includes('@'))
    ? userRow.email.trim()
    : (cleanId.includes('@') ? cleanId : '');

  const secondaryPhone = userRow.phone
    ? normalizePhone(userRow.phone) || userRow.phone.trim()
    : (!cleanId.includes('@') ? cleanPhone || cleanId : '');

  const otpId = `otp-${crypto.randomUUID()}`;
  await db.insert(otpCodes).values({
    id: otpId,
    identifier: (primaryEmail || secondaryPhone || cleanId).toLowerCase(),
    codeHash: `${salt}:${hash}`,
    purpose: 'password_reset',
    expiresAt,
    attempts: 0,
    createdAt: nowIso,
  });

  let emailDelivered = false;
  let smsDelivered = false;

  // 1. PRIMARY: Email is always attempted first whenever available
  if (primaryEmail && primaryEmail.includes('@')) {
    const emailResult = await sendTransactionalEmail(c.env, {
      to: primaryEmail,
      subject: 'Fashion Doniya BD — পাসওয়ার্ড রিসেট কোড (OTP)',
      html: `<p>আপনার পাসওয়ার্ড রিসেট ভেরিফিকেশন কোড: <strong>${code}</strong> (১০ মিনিটের জন্য বৈধ)</p>`,
      text: `Your password reset code is: ${code}`,
    });
    emailDelivered = emailResult.delivered;
  }

  // 2. SECONDARY: SMS is triggered strictly as secondary when:
  //    - No primary email is on file for the user, OR
  //    - Primary email delivery failed, OR
  //    - Merchant explicitly configured dual delivery via SMS_ALWAYS_SEND=true
  const isDualSmsEnabled = String(c.env?.SMS_ALWAYS_SEND || '').toLowerCase() === 'true';
  const shouldSendSecondarySms = Boolean(
    secondaryPhone && (!primaryEmail || !emailDelivered || isDualSmsEnabled)
  );

  if (shouldSendSecondarySms && secondaryPhone) {
    const smsRes = await sendTransactionalSms(c.env, {
      to: secondaryPhone,
      message: `Fashion Doniya: আপনার পাসওয়ার্ড রিসেট ভেরিফিকেশন ওটিপি (OTP) হলো ${code}। মেয়াদ ১০ মিনিট।`,
      isSecondaryFallback: !primaryEmail || !emailDelivered,
    }).catch(() => ({ delivered: false }));
    smsDelivered = Boolean(smsRes && 'delivered' in smsRes && smsRes.delivered);
  }

  let hostname = '';
  try {
    hostname = new URL(c.req.url).hostname;
  } catch {
    hostname = '';
  }
  const isLocalDev =
    c.env?.NODE_ENV !== 'production' &&
    (hostname === 'localhost' || hostname === '127.0.0.1');

  if (!emailDelivered && !smsDelivered && !isLocalDev) {
    await db.delete(otpCodes).where(eq(otpCodes.id, otpId)).catch(() => {});
    return c.json(
      {
        success: false,
        code: 'OTP_DELIVERY_FAILED',
        message: 'এই মুহূর্তে ইমেইল বা SMS-এর মাধ্যমে ভেরিফিকেশন কোড পাঠানো যায়নি। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।',
      },
      503
    );
  }

  return c.json({
    success: true,
    requiresOtp: true,
    ...(isLocalDev && !emailDelivered && !smsDelivered ? { devOtp: code } : {}),
    message: emailDelivered
      ? `আপনার ইমেইলে (${primaryEmail}) পাসওয়ার্ড রিসেট কোড পাঠানো হয়েছে।`
      : smsDelivered
        ? 'আপনার মোবাইল নম্বরে পাসওয়ার্ড রিসেট ভেরিফিকেশন কোড (OTP) পাঠানো হয়েছে।'
        : 'ভেরিফিকেশন কোড (OTP) তৈরি হয়েছে। অনুগ্রহ করে কোডটি প্রবেশ করান।',
  });
});

// Authenticated Customer Password Change
authRouter.post('/change-password', authRateLimiter, async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return c.json({ success: false, message: 'অনুগ্রহ করে প্রথমে লগইন করুন।' }, 401);
  }

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');

  if (!newPassword.trim() || newPassword.length < 6) {
    return c.json({ success: false, message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }, 400);
  }

  const db = c.get('db');
  const userRow = await db.select().from(users).where(eq(users.id, authUser.id)).get();
  if (!userRow) {
    return c.json({ success: false, message: 'অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।' }, 404);
  }
  if (userRow.status === 'blocked') {
    return c.json(
      { success: false, code: 'ACCOUNT_BLOCKED', message: 'আপনার অ্যাকাউন্টটি ব্লক করা হয়েছে।' },
      403
    );
  }

  if (!userRow.passwordHash || !userRow.passwordSalt) {
    return c.json(
      { success: false, message: 'পাসওয়ার্ড পরিবর্তন করতে OTP রিসেট ব্যবহার করুন।' },
      400
    );
  }

  const valid = await verifyPassword(currentPassword, userRow.passwordSalt, userRow.passwordHash);
  if (!currentPassword || !valid) {
    return c.json({ success: false, message: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' }, 400);
  }

  const { salt, hash } = await hashPassword(newPassword);
  await db
    .update(users)
    .set({
      passwordHash: hash,
      passwordSalt: salt,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userRow.id));

  const role: AuthUser['role'] =
    userRow.role === 'admin' || userRow.role === 'super_admin' || userRow.role === 'sysadm'
      ? userRow.role
      : 'user';
  const token = await signJwt(
    {
      sub: userRow.id,
      phone: userRow.phone,
      email: userRow.email || undefined,
      fullName: userRow.fullName,
      role,
      pwdVer: computePasswordVersion(hash),
    },
    resolveJwtSecret(c.env)
  );

  return c.json({ success: true, token, message: 'পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!' });
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

  const retryAfter = checkLoginThrottle('admin-login', email);
  if (retryAfter > 0) {
    c.header('Retry-After', String(retryAfter));
    return c.json(
      {
        success: false,
        code: 'RATE_LIMITED',
        message: 'অনেকবার ভুল প্রচেষ্টার কারণে অ্যাডমিন লগইন সাময়িকভাবে সীমাবদ্ধ করা হয়েছে।',
        retryAfterSeconds: retryAfter,
      },
      429
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
    recordLoginFailure('admin-login', email);
    return c.json(
      { success: false, message: 'অ্যাডমিন ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' },
      401
    );
  }

  clearLoginFailures('admin-login', email);

  const token = await signJwt(
    {
      sub: 'admin-primary',
      email: admin.email,
      fullName: admin.name,
      role: admin.role || 'super_admin',
      pwdVer: computePasswordVersion(admin.passwordHash),
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

adminAuthRouter.post('/logout', (c) => {
  return c.json({ success: true, message: 'লগআউট সম্পন্ন হয়েছে।' });
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
  if (newPassword && (!newPassword.trim() || newPassword.length < 6)) {
    return c.json({ success: false, message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }, 400);
  }
  if (newEmail && !EMAIL_RE.test(newEmail)) {
    return c.json({ success: false, message: 'সঠিক অ্যাডমিন ইমেইল ঠিকানা প্রদান করুন।' }, 400);
  }

  if (newPassword) {
    const { salt, hash } = await hashPassword(newPassword);
    admin.passwordSalt = salt;
    admin.passwordHash = hash;
  }
  if (newEmail) admin.email = newEmail;
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

  const token = await signJwt(
    {
      sub: 'admin-primary',
      email: admin.email,
      fullName: admin.name,
      role: admin.role || 'super_admin',
      pwdVer: computePasswordVersion(admin.passwordHash),
    },
    resolveJwtSecret(c.env),
    60 * 60 * 24 * 7
  );

  return c.json({
    success: true,
    token,
    message: 'অ্যাডমিন নিরাপত্তা তথ্য সফলভাবে আপডেট হয়েছে।',
    admin: {
      id: 'admin-primary',
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
});
