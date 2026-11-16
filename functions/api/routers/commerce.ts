import { Hono } from 'hono';
import { and, desc, eq, ne } from 'drizzle-orm';
import type { AppEnv } from '../types';
import {
  addresses,
  walletTransactions,
  returns,
  orders,
  products,
  loyaltyTiers,
  loyaltyRewards,
  userLoyalty,
  notifications,
  reviews,
  coupons,
  userCarts,
  banners,
  newsletterLeads,
  popupSettings,
} from '../../../backend/server/db/schemas/index';
import { normalizePhone, safeJsonParse } from '../utils/helpers';
import { getStoreAndPaymentSettings } from '../utils/mappers';

export const addressesRouter = new Hono<AppEnv>();
export const walletRouter = new Hono<AppEnv>();
export const returnsRouter = new Hono<AppEnv>();
export const loyaltyRouter = new Hono<AppEnv>();
export const notificationsRouter = new Hono<AppEnv>();
export const reviewsRouter = new Hono<AppEnv>();
export const couponsRouter = new Hono<AppEnv>();
export const cartRouter = new Hono<AppEnv>();
export const bannersRouter = new Hono<AppEnv>();
export const newsletterRouter = new Hono<AppEnv>();
export const popupsRouter = new Hono<AppEnv>();

// Addresses
addressesRouter.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);
  const db = c.get('db');
  const rows = await db.select().from(addresses).where(eq(addresses.userId, user.id));
  return c.json({ success: true, addresses: rows });
});

addressesRouter.post('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const now = new Date().toISOString();
  const id = `addr-${Date.now()}`;
  const db = c.get('db');
  await db.insert(addresses).values({
    id,
    userId: user.id,
    label: String(body.label || 'Home'),
    fullName: String(body.fullName || user.fullName),
    phone: String(body.phone || user.phone),
    district: String(body.district || 'Dhaka'),
    upazila: body.upazila ? String(body.upazila) : null,
    area: body.area ? String(body.area) : null,
    fullAddress: String(body.fullAddress || ''),
    isDefault: Boolean(body.isDefault),
    createdAt: now,
    updatedAt: now,
  });
  const rows = await db.select().from(addresses).where(eq(addresses.userId, user.id));
  return c.json({ success: true, addresses: rows }, 201);
});

// Wallet
walletRouter.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);
  const db = c.get('db');
  const txns = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, user.id))
    .orderBy(desc(walletTransactions.createdAt));
  return c.json({ success: true, transactions: txns });
});

// Returns
returnsRouter.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);
  const db = c.get('db');
  const rows = await db
    .select()
    .from(returns)
    .where(eq(returns.userId, user.id))
    .orderBy(desc(returns.createdAt));
  return c.json({ success: true, returns: rows });
});

returnsRouter.post('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const orderId = String(body.orderId || '').trim();
  const orderNumber = String(body.orderNumber || '').trim();
  const reason = String(body.reason || '').trim();

  if (!reason) {
    return c.json({ success: false, message: 'রিটার্নের কারণ উল্লেখ করা আবশ্যক।' }, 400);
  }
  if (!orderId && !orderNumber) {
    return c.json({ success: false, message: 'অর্ডার আইডি বা অর্ডার নম্বর আবশ্যক।' }, 400);
  }

  const db = c.get('db');
  let orderRow = orderId
    ? await db.select().from(orders).where(eq(orders.id, orderId)).get()
    : undefined;
  if (!orderRow && orderNumber) {
    orderRow = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).get();
  }
  if (!orderRow) {
    return c.json({ success: false, message: 'অর্ডার খুঁজে পাওয়া যায়নি।' }, 404);
  }

  if (orderRow.orderStatus !== 'Delivered') {
    return c.json(
      {
        success: false,
        message: 'শুধুমাত্র ডেলিভারি সম্পন্ন হওয়া অর্ডারের ক্ষেত্রে রিটার্ন প্রযোজ্য।',
      },
      400
    );
  }

  const existingReturn = await db
    .select()
    .from(returns)
    .where(and(eq(returns.orderId, orderRow.id), ne(returns.status, 'rejected')))
    .get();

  if (existingReturn) {
    return c.json(
      {
        success: false,
        message: 'এই অর্ডারের জন্য ইতিমধ্যে একটি রিটার্ন অনুরোধ প্রক্রিয়াধীন আছে।',
      },
      400
    );
  }

  const orderCustomer = safeJsonParse<{ phone?: string }>(orderRow.customer, {});
  const userNormPhone = normalizePhone(user.phone || '');
  const orderNormPhone = normalizePhone(orderCustomer.phone || '');
  const isOwner =
    (orderRow.userId && orderRow.userId === user.id) ||
    (Boolean(userNormPhone) && Boolean(orderNormPhone) && userNormPhone === orderNormPhone);
  if (!isOwner && !c.get('isAdmin')) {
    return c.json({ success: false, message: 'এই অর্ডারের রিটার্ন অনুরোধ করার অনুমতি নেই।' }, 403);
  }

  const rawRefund = Number(body.refundAmount ?? orderRow.totalAmount);
  const safeRefund = Number.isFinite(rawRefund) ? rawRefund : orderRow.totalAmount;
  const refundAmount = Math.max(0, Math.min(safeRefund, orderRow.totalAmount));

  const now = new Date().toISOString();
  const id = `ret-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  await db.insert(returns).values({
    id,
    orderId: orderRow.id,
    orderNumber: orderRow.orderNumber,
    userId: user.id,
    reason,
    status: 'requested',
    refundAmount,
    createdAt: now,
    updatedAt: now,
  });
  return c.json({ success: true, id }, 201);
});

// Loyalty
loyaltyRouter.get('/', async (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const [tiers, rewards, account] = await Promise.all([
    db.select().from(loyaltyTiers),
    db.select().from(loyaltyRewards),
    user ? db.select().from(userLoyalty).where(eq(userLoyalty.userId, user.id)).get() : null,
  ]);
  return c.json({ success: true, tiers, rewards, account });
});

// Notifications
notificationsRouter.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);
  const db = c.get('db');
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt));
  return c.json({ success: true, notifications: rows });
});

// Reviews
reviewsRouter.get('/:productId', async (c) => {
  const productId = c.req.param('productId');
  const db = c.get('db');
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));
  return c.json({ success: true, reviews: rows.filter((r) => r.isApproved) });
});

reviewsRouter.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const productId = String(body.productId || '').trim();
  const authorName = String(body.authorName || 'Customer').trim().slice(0, 100);
  const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5)));
  const comment = String(body.comment || '').trim().slice(0, 1000);
  if (!productId || !comment) {
    return c.json({ success: false, message: 'পণ্য ও রিভিউ মন্তব্য আবশ্যক।' }, 400);
  }
  const db = c.get('db');
  const prod = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).get();
  if (!prod) {
    return c.json({ success: false, message: 'রিভিউ প্রদানের জন্য পণ্যটি খুঁজে পাওয়া যায়নি।' }, 404);
  }

  const user = c.get('user');
  await db.insert(reviews).values({
    id: `rev-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    productId,
    userId: user?.id || null,
    authorName,
    rating,
    comment,
    isVerified: Boolean(user),
    isApproved: true,
    createdAt: new Date().toISOString(),
  });
  return c.json({ success: true }, 201);
});

// Coupons
couponsRouter.get('/', async (c) => {
  const db = c.get('db');
  const rows = await db.select().from(coupons);
  const activeFromDb = rows.filter((cp) => cp.isActive);

  const { settings } = await getStoreAndPaymentSettings(db);
  const activeFromSettings = (settings.coupons || []).filter((cp) => cp.isActive);

  const codeMap = new Map<string, unknown>();
  for (const cp of activeFromDb) {
    if (cp.code) codeMap.set(cp.code.toUpperCase(), cp);
  }
  for (const cp of activeFromSettings) {
    if (cp.code && !codeMap.has(cp.code.toUpperCase())) {
      codeMap.set(cp.code.toUpperCase(), cp);
    }
  }

  return c.json({ success: true, coupons: Array.from(codeMap.values()) });
});

couponsRouter.post('/validate', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { code?: string; subtotal?: number };
  const code = String(body.code || '').trim().toUpperCase();
  const subtotal = Number(body.subtotal || 0);
  if (!code) {
    return c.json({ isValid: false, discountAmount: 0, message: 'অনুগ্রহ করে কুপন কোড লিখুন।' });
  }
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return c.json({ isValid: false, discountAmount: 0, message: 'অর্ডারের সাবটোটাল সঠিক নয়।' }, 400);
  }
  const db = c.get('db');
  const { settings } = await getStoreAndPaymentSettings(db);
  const settingsMatch = (settings.coupons || []).find(
    (cp) => cp.code?.trim().toUpperCase() === code
  );
  if (settingsMatch && settingsMatch.isActive === false) {
    return c.json({ isValid: false, discountAmount: 0, message: 'কুপন কোডটি সঠিক নয় বা মেয়াদ শেষ হয়েছে।' });
  }

  const found = await db.select().from(coupons).where(eq(coupons.code, code)).get();
  if (found && found.isActive) {
    const expMs = found.expiresAt ? Date.parse(found.expiresAt) : NaN;
    const notExpired = !found.expiresAt || (!Number.isNaN(expMs) && expMs > Date.now());
    const underLimit = !found.usageLimit || Number(found.usedCount || 0) < found.usageLimit;
    if (!notExpired || !underLimit) {
      return c.json({
        isValid: false,
        discountAmount: 0,
        message: 'কুপনটির মেয়াদ শেষ হয়েছে বা ব্যবহারের সীমা পূর্ণ হয়েছে।',
      });
    }
    if (found.minOrderAmount && subtotal < found.minOrderAmount) {
      return c.json({
        isValid: false,
        discountAmount: 0,
        message: `এই কুপন ব্যবহারের জন্য ন্যূনতম ৳${found.minOrderAmount} অর্ডার করতে হবে।`,
      });
    }
    let discountAmount =
      found.discountType === 'percentage'
        ? Math.round((subtotal * found.discountValue) / 100)
        : Math.min(subtotal, found.discountValue);
    if (
      found.discountType === 'percentage' &&
      found.maxDiscountAmount &&
      found.maxDiscountAmount > 0
    ) {
      discountAmount = Math.min(discountAmount, found.maxDiscountAmount);
    }
    discountAmount = Math.min(subtotal, Math.max(0, discountAmount));
    return c.json({ isValid: true, discountAmount, coupon: found, message: 'কুপন সফলভাবে প্রয়োগ হয়েছে!' });
  }

  // Fallback to systemSettings store_settings.coupons managed by AdminPromotions / AdminSettings
  const cfgCoupon = settingsMatch && settingsMatch.isActive ? settingsMatch : undefined;
  if (!cfgCoupon) {
    return c.json({ isValid: false, discountAmount: 0, message: 'কুপন কোডটি সঠিক নয় বা মেয়াদ শেষ হয়েছে।' });
  }
  const cfgExpMs = cfgCoupon.expiresAt ? Date.parse(cfgCoupon.expiresAt) : NaN;
  const cfgNotExpired = !cfgCoupon.expiresAt || (!Number.isNaN(cfgExpMs) && cfgExpMs > Date.now());
  const cfgUnderLimit =
    !cfgCoupon.usageLimit || Number(cfgCoupon.usedCount || 0) < cfgCoupon.usageLimit;
  if (!cfgNotExpired || !cfgUnderLimit) {
    return c.json({
      isValid: false,
      discountAmount: 0,
      message: 'কুপনটির মেয়াদ শেষ হয়েছে বা ব্যবহারের সীমা পূর্ণ হয়েছে।',
    });
  }
  if (cfgCoupon.minOrderAmount && subtotal < cfgCoupon.minOrderAmount) {
    return c.json({
      isValid: false,
      discountAmount: 0,
      message: `এই কুপন ব্যবহারের জন্য ন্যূনতম ৳${cfgCoupon.minOrderAmount} অর্ডার করতে হবে।`,
    });
  }
  let discountAmount =
    cfgCoupon.discountType === 'percentage'
      ? Math.round((subtotal * cfgCoupon.discountValue) / 100)
      : Math.min(subtotal, cfgCoupon.discountValue);
  if (
    cfgCoupon.discountType === 'percentage' &&
    cfgCoupon.maxDiscountAmount &&
    cfgCoupon.maxDiscountAmount > 0
  ) {
    discountAmount = Math.min(discountAmount, cfgCoupon.maxDiscountAmount);
  }
  discountAmount = Math.min(subtotal, Math.max(0, discountAmount));
  return c.json({ isValid: true, discountAmount, coupon: cfgCoupon, message: 'কুপন সফলভাবে প্রয়োগ হয়েছে!' });
});

// Cart
cartRouter.get('/', async (c) => {
  const user = c.get('user');
  const sessionId = c.req.header('x-session-id') || '';
  const db = c.get('db');
  const key = user ? `user:${user.id}` : sessionId ? `sess:${sessionId}` : '';
  if (!key) return c.json({ success: true, items: [] });
  let row = await db.select().from(userCarts).where(eq(userCarts.id, key)).get();
  if (!row && user) {
    row = await db.select().from(userCarts).where(eq(userCarts.id, user.id)).get();
  }
  return c.json({ success: true, items: safeJsonParse(row?.items, []) });
});

cartRouter.put('/', async (c) => {
  const user = c.get('user');
  const sessionId = c.req.header('x-session-id') || '';
  const key = user ? `user:${user.id}` : sessionId ? `sess:${sessionId}` : '';
  if (!key) return c.json({ success: false, message: 'Session or user required' }, 400);
  const body = (await c.req.json().catch(() => ({}))) as { items?: unknown[] };
  const db = c.get('db');
  const now = new Date().toISOString();
  await db
    .insert(userCarts)
    .values({
      id: key,
      userId: user?.id || null,
      sessionId: sessionId || null,
      items: JSON.stringify(body.items || []),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userCarts.id,
      set: { items: JSON.stringify(body.items || []), updatedAt: now },
    });
  return c.json({ success: true });
});

// Banners, Newsletter, Popups
bannersRouter.get('/', async (c) => {
  const db = c.get('db');
  const rows = await db.select().from(banners);
  return c.json({ success: true, banners: rows });
});

newsletterRouter.post('/subscribe', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { email?: string; phone?: string; source?: string };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (!email && !phone) {
    return c.json({ success: false, message: 'ইমেইল বা মোবাইল নম্বর দিন।' }, 400);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ success: false, message: 'অনুগ্রহ করে সঠিক ইমেইল ঠিকানা দিন।' }, 400);
  }
  if (phone && phone.replace(/\D/g, '').length < 10) {
    return c.json({ success: false, message: 'অনুগ্রহ করে সঠিক মোবাইল নম্বর দিন।' }, 400);
  }
  const db = c.get('db');
  await db.insert(newsletterLeads).values({
    id: `nl-${Date.now()}`,
    email: email || null,
    phone: phone || null,
    source: body.source || 'footer',
    createdAt: new Date().toISOString(),
  });
  return c.json({ success: true, message: 'সাবস্ক্রিপশন সম্পন্ন হয়েছে!' }, 201);
});

popupsRouter.get('/', async (c) => {
  const db = c.get('db');
  const rows = await db.select().from(popupSettings);
  return c.json({ success: true, popups: rows.filter((p) => p.isActive) });
});
