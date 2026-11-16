import { Hono, type Context } from 'hono';
import { eq, or, sql } from 'drizzle-orm';
import type { AppEnv } from '../types';
import type { AppDatabase } from '../utils/db-factory';
import {
  orders,
  trackings,
  courierInfo,
  orderItems,
  products,
  coupons,
  users,
  productSales,
} from '../../../backend/server/db/schemas/index';
import type { AddonFabricOption, Order, OrderStatus, PaymentStatus } from '../../../frontend/src/types/index';
import { INITIAL_ADDON_FABRIC_COLLECTIONS } from '../../../frontend/src/data/seedData';
import { getAllOrdersHydrated, hydrateOrderRow, getStoreAndPaymentSettings } from '../utils/mappers';
import { appendAdminLog, buildCourierTrackingUrl, escapeHtml, normalizePhone, safeJsonParse, safeWaitUntil } from '../utils/helpers';
import { checkoutRateLimiter, pollingRateLimiter } from '../utils/rateLimiter';
import { invalidateHomeCache } from '../utils/cache';
import { clearBulkMicroCache } from './bulk';
import { sendTransactionalEmail } from '../utils/email';
import { sendTransactionalSms } from '../utils/sms';

export const ordersRouter = new Hono<AppEnv>();
export const adminOrdersRouter = new Hono<AppEnv>();

const INACTIVE_ORDER_STATUSES = new Set<string>(['Cancelled', 'Returned']);

export async function reconcileOrderInventory(
  db: AppDatabase,
  orderRow: typeof orders.$inferSelect,
  prevStatus: string,
  nextStatus: string
): Promise<void> {
  const wasActive = !INACTIVE_ORDER_STATUSES.has(prevStatus);
  const willBeActive = !INACTIVE_ORDER_STATUSES.has(nextStatus);
  if (wasActive === willBeActive) return;

  const items = safeJsonParse<Order['items']>(orderRow.items, []);
  const boltYardsByProduct = new Map<string, number>();

  for (const item of items) {
    if (!item?.productId) continue;
    let addonTotalYards = 0;
    let setSameProductAddonYards = 0;

    if (Array.isArray(item.selectedAddons)) {
      for (const addon of item.selectedAddons) {
        const count = Number(addon?.count || 0);
        const yardsPerUnit = Number(addon?.yardsPerUnit || 0);
        if (count > 0 && yardsPerUnit > 0) {
          const addonYards = Number((count * yardsPerUnit).toFixed(2));
          addonTotalYards = Number((addonTotalYards + addonYards).toFixed(2));
          if (
            addon.addonId === 'orna' ||
            !addon.fabricId ||
            String(addon.fabricId).startsWith('set-')
          ) {
            setSameProductAddonYards = Number((setSameProductAddonYards + addonYards).toFixed(2));
          }
        }
      }
    }

    const itemYards = Number(item.yards || 0);
    const mainYards =
      addonTotalYards > 0 && itemYards > addonTotalYards + 0.01
        ? Number((itemYards - addonTotalYards).toFixed(2))
        : itemYards;
    const totalBoltYards = Number((mainYards + setSameProductAddonYards).toFixed(2));
    if (totalBoltYards <= 0) continue;

    boltYardsByProduct.set(
      item.productId,
      Number(((boltYardsByProduct.get(item.productId) || 0) + totalBoltYards).toFixed(2))
    );
  }

  const now = new Date().toISOString();
  const normalizedCouponCode = orderRow.couponCode
    ? String(orderRow.couponCode).trim().toUpperCase()
    : null;

  if (wasActive && !willBeActive) {
    for (const [prodId, yards] of boltYardsByProduct.entries()) {
      await db
        .update(products)
        .set({
          stockYards: sql`ROUND(${products.stockYards} + ${yards}, 2)`,
          updatedAt: now,
        })
        .where(eq(products.id, prodId));
    }
    if (normalizedCouponCode) {
      await db
        .update(coupons)
        .set({
          usedCount: sql`MAX(0, ${coupons.usedCount} - 1)`,
        })
        .where(eq(coupons.code, normalizedCouponCode));
    }
  } else if (!wasActive && willBeActive) {
    for (const [prodId, yards] of boltYardsByProduct.entries()) {
      await db
        .update(products)
        .set({
          stockYards: sql`MAX(0, ROUND(${products.stockYards} - ${yards}, 2))`,
          updatedAt: now,
        })
        .where(eq(products.id, prodId));
    }
    if (normalizedCouponCode) {
      await db
        .update(coupons)
        .set({
          usedCount: sql`${coupons.usedCount} + 1`,
        })
        .where(eq(coupons.code, normalizedCouponCode));
    }
  }
}

export async function recalculateCustomerOrderStats(
  db: AppDatabase,
  userId?: string | null,
  phone?: string | null
): Promise<void> {
  const normPhone = normalizePhone(phone || '');
  let targetUser: typeof users.$inferSelect | undefined;

  if (userId) {
    targetUser = await db.select().from(users).where(eq(users.id, userId)).get();
  }
  if (!targetUser && normPhone) {
    targetUser = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.phone, normPhone),
          eq(users.phone, `+88${normPhone}`),
          eq(users.phone, `88${normPhone}`)
        )
      )
      .get();
  }
  if (!targetUser) return;

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, targetUser.id));

  const validOrders = userOrders.filter((o) => !INACTIVE_ORDER_STATUSES.has(o.orderStatus));

  const totalOrders = validOrders.length;
  const totalSpent = validOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);

  await db
    .update(users)
    .set({
      totalOrders,
      totalSpent,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, targetUser.id));
}

const VALID_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
];

async function handleVerifyAndTrackOrder(c: Context<AppEnv>) {
  const body =
    c.req.method === 'POST'
      ? ((await c.req.json().catch(() => ({}))) as Record<string, unknown>)
      : {};
  const rawOrderId = String(
    body?.orderNumber ||
      body?.orderId ||
      c.req.query('orderNumber') ||
      c.req.query('orderId') ||
      ''
  ).trim();
  const rawPhone = String(body?.phone || c.req.query('phone') || '').trim();

  if (!rawOrderId || !rawPhone) {
    return c.json(
      {
        success: false,
        code: 'MISSING_FIELDS',
        message: 'অর্ডার ট্র্যাক করতে আপনার অর্ডার আইডি এবং অর্ডারে ব্যবহৃত মোবাইল নম্বর উভয়ই প্রদান করুন।',
      },
      400
    );
  }

  const cleanOrderId = rawOrderId.toUpperCase();
  const normalizedInputPhone = normalizePhone(rawPhone);
  if (!/^01[3-9]\d{8}$/.test(normalizedInputPhone)) {
    return c.json(
      {
        success: false,
        code: 'INVALID_PHONE',
        message: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01711223344)।',
      },
      400
    );
  }

  const db = c.get('db');
  let matchedRow = await db.select().from(orders).where(eq(orders.orderNumber, cleanOrderId)).get();
  if (!matchedRow) {
    matchedRow = await db.select().from(orders).where(eq(orders.id, cleanOrderId)).get();
  }

  if (!matchedRow) {
    return c.json(
      {
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: `"${rawOrderId}" অর্ডার আইডি দিয়ে আমাদের ডাটাবেসে কোনো অর্ডার পাওয়া যায়নি। অনুগ্রহ করে ইনভয়েস বা এসএমএস দেখে সঠিক অর্ডার আইডি দিন।`,
      },
      404
    );
  }

  const customer = safeJsonParse<Order['customer']>(matchedRow.customer, {
    fullName: '',
    phone: '',
    district: '',
    upazila: '',
    area: '',
    fullAddress: '',
  });
  const orderPrimaryPhone = normalizePhone(customer.phone);
  const orderAltPhone = customer.altPhone ? normalizePhone(customer.altPhone) : '';

  const isPhoneVerified =
    normalizedInputPhone === orderPrimaryPhone ||
    (Boolean(orderAltPhone) && normalizedInputPhone === orderAltPhone);

  if (!isPhoneVerified) {
    return c.json(
      {
        success: false,
        code: 'PHONE_MISMATCH',
        message:
          'প্রদত্ত মোবাইল নম্বরটি এই অর্ডার আইডির সাথে মিলছে না। গ্রাহকের তথ্যের নিরাপত্তার স্বার্থে অর্ডারে ব্যবহৃত সঠিক মোবাইল নম্বরটি দিন।',
      },
      403
    );
  }

  const hydrated = await hydrateOrderRow(db, matchedRow);
  return c.json({
    success: true,
    order: hydrated,
    trackingHistory: hydrated.trackingHistory || [],
    courierInfo: hydrated.courierInfo || null,
  });
}

ordersRouter.post('/verify', pollingRateLimiter, handleVerifyAndTrackOrder);
ordersRouter.get('/track', pollingRateLimiter, handleVerifyAndTrackOrder);

ordersRouter.get('/my', async (c) => {
  const authUser = c.get('user');
  if (!authUser) {
    return c.json({ success: false, message: 'লগইন করা প্রয়োজন।' }, 401);
  }
  const db = c.get('db');
  const all = await getAllOrdersHydrated(db);
  const authPhone = authUser.phone ? normalizePhone(authUser.phone) : '';
  const visibleOrders = all.orders.filter((ord) => {
    const ordPhone = normalizePhone(ord.customer?.phone || '');
    return (
      (ord as unknown as { userId?: string }).userId === authUser.id ||
      (Boolean(authPhone) && ordPhone === authPhone)
    );
  });
  const visibleIds = new Set(visibleOrders.map((o) => o.id));
  return c.json({
    success: true,
    orders: visibleOrders,
    order_tracking_history: all.order_tracking_history.filter((t) => visibleIds.has(t.orderId)),
    courier_information: all.courier_information.filter((ci) => visibleIds.has(ci.orderId)),
  });
});

// Edge-safe SSE stream endpoint (emits an immediate heartbeat/snapshot and closes cleanly so Workers never hang)
ordersRouter.get('/stream', pollingRateLimiter, async (c) => {
  const encoder = new TextEncoder();
  const payload = JSON.stringify({
    type: 'CONNECTED',
    timestamp: new Date().toISOString(),
  });
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
});

ordersRouter.post('/', checkoutRateLimiter, async (c) => {
  const incoming = (await c.req.json().catch(() => ({}))) as { order?: Order } & Partial<Order>;
  const orderData = (incoming?.order || incoming) as Order;

  if (
    !orderData ||
    !orderData.customer?.phone ||
    !Array.isArray(orderData.items) ||
    orderData.items.length === 0
  ) {
    return c.json(
      { success: false, message: 'অর্ডার তৈরি করতে গ্রাহকের মোবাইল নম্বর এবং কমপক্ষে একটি পণ্য আবশ্যক।' },
      400
    );
  }

  const normalizedPhone = normalizePhone(orderData.customer.phone);
  if (normalizedPhone.length < 10) {
    return c.json(
      { success: false, message: 'সঠিক ১১ সংখ্যার মোবাইল নম্বর প্রদান করুন।' },
      400
    );
  }

  for (const item of orderData.items) {
    if (!item.productId || !Number.isFinite(Number(item.yards)) || Number(item.yards) <= 0) {
      return c.json(
        { success: false, message: 'প্রতিটি পণ্যের সঠিক পরিমাণ (গজ) প্রদান করুন।' },
        400
      );
    }
  }

  const db = c.get('db');
  const now = new Date().toISOString();
  const isAdmin = c.get('isAdmin');
  const id =
    isAdmin && orderData.id
      ? String(orderData.id)
      : `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const orderNumber =
    isAdmin && orderData.orderNumber
      ? String(orderData.orderNumber)
      : `FD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const normalizedCustomer = {
    ...orderData.customer,
    phone: normalizedPhone,
    altPhone: orderData.customer.altPhone
      ? normalizePhone(orderData.customer.altPhone)
      : undefined,
  };

  const authUser = c.get('user');

  // Security Hardening: Authoritative Server-Side Price, Stock & Total Calculation (Prevents Price Tampering)
  const { settings } = await getStoreAndPaymentSettings(db);
  const allProds = await db.select().from(products);
  const prodMap = new Map(allProds.map((p) => [p.id, p]));

  const addonCollections = settings.addonFabricCollections || INITIAL_ADDON_FABRIC_COLLECTIONS;
  const addonFabricMap = new Map<string, AddonFabricOption>();
  for (const list of Object.values(addonCollections)) {
    if (Array.isArray(list)) {
      for (const opt of list) {
        if (opt?.id) addonFabricMap.set(opt.id, opt);
      }
    }
  }

  let verifiedSubtotal = 0;
  const stockDeductions = new Map<string, number>();
  const verifiedItems: Order['items'] = [];

  for (const item of orderData.items) {
    const prod = prodMap.get(item.productId);
    if (!prod) {
      return c.json(
        { success: false, message: 'দুঃখিত, কার্টের একটি পণ্য আমাদের ডাটাবেসে পাওয়া যায়নি।' },
        400
      );
    }
    if (prod.isActive === false) {
      return c.json(
        { success: false, message: `দুঃখিত, "${prod.name}" পণ্যটি বর্তমানে বিক্রয়ের জন্য সক্রিয় নয়।` },
        400
      );
    }

    const requestedTotalYards = Math.max(0.25, Number(item.yards || 1));
    const pricePerYard = Number(prod.discountPrice ?? prod.pricePerYard);

    let addonTotal = 0;
    let addonTotalYards = 0;
    let setSameProductAddonYards = 0;
    const verifiedAddons = Array.isArray(item.selectedAddons)
      ? item.selectedAddons
          .filter((a) => Number(a?.count || 0) > 0 && Number(a?.yardsPerUnit || 0) > 0)
          .map((addon) => {
            const count = Math.max(1, Math.min(20, Math.round(Number(addon.count))));
            const yardsPerUnit = Math.max(0.25, Math.min(15, Number(addon.yardsPerUnit)));
            const addonYards = Number((count * yardsPerUnit).toFixed(2));
            addonTotalYards = Number((addonTotalYards + addonYards).toFixed(2));

            const isSetFabric =
              addon.addonId === 'orna' ||
              !addon.fabricId ||
              String(addon.fabricId).startsWith('set-') ||
              !addonFabricMap.has(addon.fabricId);
            const chosenFabric = !isSetFabric ? addonFabricMap.get(addon.fabricId) : undefined;
            const unitRate = chosenFabric ? Number(chosenFabric.pricePerYard) : pricePerYard;
            const totalAddonPrice = Math.round(addonYards * unitRate);
            addonTotal += totalAddonPrice;
            if (isSetFabric) {
              setSameProductAddonYards = Number((setSameProductAddonYards + addonYards).toFixed(2));
            }
            return {
              ...addon,
              count,
              yardsPerUnit,
              pricePerYard: unitRate,
              totalAddonPrice,
            };
          })
      : undefined;

    // Frontend packs combinedTotalYards = mainYards + addonTotalYards; separate cleanly to prevent double-charging
    const mainYards =
      addonTotalYards > 0 && requestedTotalYards > addonTotalYards + 0.01
        ? Number((requestedTotalYards - addonTotalYards).toFixed(2))
        : requestedTotalYards;

    const minOrder = Math.max(0.25, Number(prod.minOrderQuantity || 1));
    const step = Math.max(0.1, Number(prod.stepYard || 0.5));
    if (mainYards < minOrder - 0.001) {
      return c.json(
        {
          success: false,
          message: `"${prod.name}"-এর জন্য ন্যূনতম অর্ডার পরিমাণ ${minOrder} গজ।`,
        },
        400
      );
    }
    const stepDiff = Math.round(((mainYards - minOrder) % step) * 100) / 100;
    if (stepDiff > 0.01 && stepDiff < step - 0.01) {
      return c.json(
        {
          success: false,
          message: `"${prod.name}"-এর অর্ডার পরিমাণ ${step} গজের ধাপ অনুযায়ী হতে হবে।`,
        },
        400
      );
    }

    const customCfg = prod.customMeasurementConfig
      ? safeJsonParse<{ standardGaj?: number; additionalPricePerYard?: number }>(
          prod.customMeasurementConfig,
          {}
        )
      : {};
    const stdGaj = Number(customCfg.standardGaj || 0);
    const extraRate = Number(customCfg.additionalPricePerYard || 0);
    let mainFabricTotal = Math.round(pricePerYard * mainYards);
    if (item.sizeMode === 'custom' && stdGaj > 0 && extraRate > 0 && mainYards > stdGaj) {
      const extraYards = Number((mainYards - stdGaj).toFixed(2));
      mainFabricTotal = Math.round(stdGaj * pricePerYard + extraYards * extraRate);
    }

    const boltYardsNeeded = Number((mainYards + setSameProductAddonYards).toFixed(2));
    const cumulativeUsed = Number(((stockDeductions.get(prod.id) || 0) + boltYardsNeeded).toFixed(2));
    if (prod.stockYards <= 0 || cumulativeUsed > prod.stockYards + 0.001) {
      return c.json(
        {
          success: false,
          message: `দুঃখিত, "${prod.name}"-এর পর্যাপ্ত স্টক নেই (মজুদ: ${prod.stockYards} গজ)।`,
        },
        400
      );
    }
    stockDeductions.set(prod.id, cumulativeUsed);

    const lineTotal = Math.round(mainFabricTotal + addonTotal);
    verifiedSubtotal += lineTotal;

    verifiedItems.push({
      ...item,
      productName: prod.name,
      yards: requestedTotalYards,
      pricePerYard,
      selectedAddons: verifiedAddons && verifiedAddons.length > 0 ? verifiedAddons : undefined,
      finalProductPrice: lineTotal,
    });
  }

  // Authoritative Delivery Charge Verification using store settings
  const isInsideDhaka =
    normalizedCustomer.district?.trim().toLowerCase() === 'ঢাকা' ||
    normalizedCustomer.district?.trim().toLowerCase() === 'dhaka';
  const insideFee = Number(settings.insideDhakaDeliveryFee ?? 80);
  const outsideFee = Number(settings.outsideDhakaDeliveryFee ?? 150);
  const freeThreshold = Number(settings.freeDeliveryThreshold ?? 2500);
  const defaultDeliveryFee = isInsideDhaka ? insideFee : outsideFee;
  const verifiedDeliveryFee = verifiedSubtotal >= freeThreshold ? 0 : defaultDeliveryFee;

  // Authoritative Coupon Verification (active, expiry, usageLimit, minOrderAmount, maxDiscountAmount)
  let verifiedDiscount = 0;
  let appliedDbCoupon: typeof coupons.$inferSelect | null = null;
  const couponCode = orderData.couponCode ? String(orderData.couponCode).trim().toUpperCase() : null;
  if (couponCode) {
    const cfgCouponEntry = (settings.coupons || []).find(
      (cp) => cp.code?.trim().toUpperCase() === couponCode
    );
    const isDeactivatedInSettings = cfgCouponEntry && cfgCouponEntry.isActive === false;

    if (!isDeactivatedInSettings) {
      let foundCoupon = await db.select().from(coupons).where(eq(coupons.code, couponCode)).get();
      if (!foundCoupon && cfgCouponEntry && cfgCouponEntry.isActive) {
        await db
          .insert(coupons)
          .values({
            id: `cp-${cfgCouponEntry.code.toLowerCase()}`,
            code: cfgCouponEntry.code.toUpperCase(),
            discountType: cfgCouponEntry.discountType,
            discountValue: cfgCouponEntry.discountValue,
            minOrderAmount: cfgCouponEntry.minOrderAmount || 0,
            maxDiscountAmount: cfgCouponEntry.maxDiscountAmount || null,
            usageLimit: cfgCouponEntry.usageLimit || null,
            usedCount: cfgCouponEntry.usedCount || 0,
            isActive: true,
            expiresAt: cfgCouponEntry.expiresAt || null,
            createdAt: now,
          })
          .onConflictDoNothing();
        foundCoupon = await db.select().from(coupons).where(eq(coupons.code, couponCode)).get();
      }

      if (foundCoupon && foundCoupon.isActive) {
        const notExpired = !foundCoupon.expiresAt || Date.parse(foundCoupon.expiresAt) > Date.now();
        const underLimit = !foundCoupon.usageLimit || Number(foundCoupon.usedCount || 0) < foundCoupon.usageLimit;
        if (notExpired && underLimit && (!foundCoupon.minOrderAmount || verifiedSubtotal >= foundCoupon.minOrderAmount)) {
          const rawDiscount =
            foundCoupon.discountType === 'percentage'
              ? Math.round((verifiedSubtotal * foundCoupon.discountValue) / 100)
              : Math.min(verifiedSubtotal, foundCoupon.discountValue);
          verifiedDiscount = foundCoupon.maxDiscountAmount
            ? Math.min(rawDiscount, foundCoupon.maxDiscountAmount)
            : rawDiscount;
          appliedDbCoupon = foundCoupon;
        }
      }
    }
  }

  // Atomic stock reservation with automatic rollback on concurrency exhaustion
  const successfullyDeducted: Array<{ prodId: string; yards: number }> = [];
  let insufficientStockProduct: string | null = null;

  for (const [prodId, usedYards] of stockDeductions.entries()) {
    const res = await db
      .update(products)
      .set({
        stockYards: sql`ROUND(${products.stockYards} - ${usedYards}, 2)`,
        updatedAt: now,
      })
      .where(sql`${products.id} = ${prodId} AND ${products.stockYards} >= ${usedYards}`)
      .returning({ id: products.id });

    if (!res || res.length === 0) {
      insufficientStockProduct = prodMap.get(prodId)?.name || 'পণ্য';
      break;
    }
    successfullyDeducted.push({ prodId, yards: usedYards });
  }

  if (insufficientStockProduct) {
    for (const item of successfullyDeducted) {
      await db
        .update(products)
        .set({
          stockYards: sql`ROUND(${products.stockYards} + ${item.yards}, 2)`,
          updatedAt: now,
        })
        .where(eq(products.id, item.prodId));
    }
    return c.json(
      {
        success: false,
        message: `দুঃখিত, "${insufficientStockProduct}" পণ্যটির পর্যাপ্ত স্টক এই মুহূর্তে পাওয়া যায়নি।`,
      },
      400
    );
  }

  // Atomic coupon usage increment if coupon is valid
  if (appliedDbCoupon && verifiedDiscount > 0) {
    const couponRes = await db
      .update(coupons)
      .set({ usedCount: sql`${coupons.usedCount} + 1` })
      .where(
        appliedDbCoupon.usageLimit
          ? sql`${coupons.id} = ${appliedDbCoupon.id} AND ${coupons.usedCount} < ${appliedDbCoupon.usageLimit}`
          : eq(coupons.id, appliedDbCoupon.id)
      )
      .returning({ id: coupons.id });

    if (appliedDbCoupon.usageLimit && (!couponRes || couponRes.length === 0)) {
      verifiedDiscount = 0;
    }
  }

  const verifiedGrandTotal = Math.max(0, verifiedSubtotal + verifiedDeliveryFee - verifiedDiscount);
  const authoritativeOrderStatus: OrderStatus = 'Pending';
  const authoritativePaymentStatus: PaymentStatus =
    (orderData.paymentMethod || 'cod') === 'cod' ? 'unpaid' : 'pending_verification';

  await db
    .insert(orders)
    .values({
      id,
      orderNumber,
      userId: authUser?.id || null,
      customer: JSON.stringify(normalizedCustomer),
      items: JSON.stringify(verifiedItems),
      subtotal: verifiedSubtotal,
      deliveryCharge: verifiedDeliveryFee,
      discountAmount: verifiedDiscount,
      couponCode: verifiedDiscount > 0 ? couponCode : null,
      totalAmount: verifiedGrandTotal,
      paymentMethod: orderData.paymentMethod || 'cod',
      paymentStatus: authoritativePaymentStatus,
      paymentDetails: orderData.paymentDetails ? JSON.stringify(orderData.paymentDetails) : null,
      orderStatus: authoritativeOrderStatus,
      estimatedDeliveryDate: orderData.estimatedDeliveryDate || null,
      notes: normalizedCustomer.deliveryNotes || null,
      createdAt: orderData.createdAt || now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  for (let idx = 0; idx < verifiedItems.length; idx++) {
    const item = verifiedItems[idx];
    const yards = item.yards;
    const customPayload = item.isCustomized || item.customMeasurements || item.outfitCategory || item.selectedAddons
      ? {
          isCustomized: item.isCustomized,
          sizeMode: item.sizeMode,
          customMeasurements: item.customMeasurements,
          customizationNotes: item.customizationNotes,
          outfitCategory: item.outfitCategory,
          selectedAddons: item.selectedAddons,
        }
      : null;

    await db
      .insert(orderItems)
      .values({
        id: `${id}-item-${idx}`,
        orderId: id,
        productId: item.productId,
        productName: item.productName || item.productId,
        sku: null,
        yards,
        pricePerYard: item.pricePerYard,
        lineTotal: item.finalProductPrice,
        selectedColor: item.color || null,
        customization: customPayload ? JSON.stringify(customPayload) : null,
      })
      .onConflictDoNothing();

    await db
      .insert(productSales)
      .values({
        id: `ps-${id}-${idx}`,
        productId: item.productId,
        orderId: id,
        yardsSold: yards,
        revenue: item.finalProductPrice || 0,
        soldAt: now,
      })
      .onConflictDoNothing();
  }

  await db
    .insert(trackings)
    .values({
      id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: id,
      orderNumber,
      status: authoritativeOrderStatus,
      timestamp: now,
      note: 'অর্ডারটি সফলভাবে গৃহীত হয়েছে এবং ভেরিফিকেশনের জন্য প্রক্রিয়াধীন রয়েছে।',
      location: 'Fashion Doniya BD অনলাইন ডেস্ক, ঢাকা',
      updatedBy: 'System',
    })
    .onConflictDoNothing();

  await recalculateCustomerOrderStats(db, authUser?.id || null, normalizedPhone);

  await appendAdminLog(
    db,
    `নতুন অর্ডার (${orderNumber})`,
    'order',
    `${normalizedCustomer.fullName} · ৳${verifiedGrandTotal}`,
    'Customer'
  );
  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  if (normalizedCustomer.email && normalizedCustomer.email.includes('@')) {
    const emailPromise = sendTransactionalEmail(c.env, {
      to: normalizedCustomer.email,
      toName: normalizedCustomer.fullName,
      subject: `অর্ডার নিশ্চিতকরণ (${orderNumber}) — ফ্যাশন দনিয়া`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FAF6F0; padding: 24px; border-radius: 12px; color: #241614;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #6B0812; margin: 0;">Fashion Doniya BD</h2>
            <p style="font-size: 12px; color: #8A5A10; margin-top: 4px;">কাপড়ের আভিজাত্য · ৩.৫ ও ২.৫ হাত বহর</p>
          </div>
          <div style="background: #FFFFFF; padding: 20px; border-radius: 8px; border: 1px solid #E6D8C5;">
            <h3 style="color: #241614; margin-top: 0;">ধন্যবাদ, ${escapeHtml(normalizedCustomer.fullName)}!</h3>
            <p style="font-size: 14px; color: #523A35;">আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে। শীঘ্রই আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।</p>
            <div style="background: #FAF8F4; padding: 12px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #6B0812;">
              <p style="margin: 0; font-size: 13px;"><strong>অর্ডার নম্বর:</strong> ${escapeHtml(orderNumber)}</p>
              <p style="margin: 4px 0 0; font-size: 13px;"><strong>পেমেন্ট মেথড:</strong> ${escapeHtml(orderData.paymentMethod || 'cod')}</p>
              <p style="margin: 4px 0 0; font-size: 13px;"><strong>মোট মূল্য:</strong> ৳${verifiedGrandTotal}</p>
              <p style="margin: 4px 0 0; font-size: 13px;"><strong>ডেলিভারি ঠিকানা:</strong> ${escapeHtml(normalizedCustomer.fullAddress || '')}, ${escapeHtml(normalizedCustomer.district || '')}</p>
            </div>
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://fashiondoniyabd.com/order-tracking" style="display: inline-block; background: #6B0812; color: #FFFFFF; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px;">অর্ডার ট্র্যাক করুন</a>
            </div>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #6E5750;">
            <p>যেকোনো প্রয়োজনে যোগাযোগ করুন | ফ্যাশন দনিয়া বিডি</p>
          </div>
        </div>
      `,
    }).catch(() => {});

    safeWaitUntil(c, emailPromise);
  }

  // 2. Secondary Channel: Transactional SMS
  // Policy: Email is ALWAYS primary. SMS is triggered strictly as secondary when:
  // a) Customer has NO email address on file (phone-only order), OR
  // b) Merchant explicitly configured dual delivery via SMS_ALWAYS_SEND=true
  const hasCustomerEmail = Boolean(normalizedCustomer.email && normalizedCustomer.email.includes('@'));
  const isDualSmsEnabled = String(c.env?.SMS_ALWAYS_SEND || '').toLowerCase() === 'true';
  const shouldSendSecondarySms = Boolean(
    normalizedCustomer.phone && (!hasCustomerEmail || isDualSmsEnabled)
  );

  if (shouldSendSecondarySms && normalizedCustomer.phone) {
    const smsPromise = sendTransactionalSms(c.env, {
      to: normalizedCustomer.phone,
      message: `Fashion Doniya: প্রিয় ${normalizedCustomer.fullName}, আপনার অর্ডার (${orderNumber}) গ্রহণ করা হয়েছে। মোট: ৳${verifiedGrandTotal}। ধন্যবাদ!`,
      isSecondaryFallback: !hasCustomerEmail,
    }).catch(() => {});

    safeWaitUntil(c, smsPromise);
  }

  const row = await db.select().from(orders).where(eq(orders.id, id)).get();
  const hydrated = row ? await hydrateOrderRow(db, row) : orderData;
  return c.json({ success: true, order: hydrated }, 201);
});

ordersRouter.post('/sync-client', pollingRateLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { orders?: Order[] };
  const db = c.get('db');
  const isAdmin = c.get('isAdmin');
  const authUser = c.get('user');
  const clientPairs: Array<{ orderNumber: string; phone: string }> = [];

  if (Array.isArray(body?.orders)) {
    for (const incoming of body.orders.slice(0, 25)) {
      if (!incoming?.orderNumber || !incoming?.customer?.phone) continue;
      const cleanPhone = normalizePhone(incoming.customer.phone);
      clientPairs.push({
        orderNumber: incoming.orderNumber.toUpperCase(),
        phone: cleanPhone,
      });
    }
  }

  // Only admins receive the full order book; authenticated users receive their own orders;
  // anonymous visitors receive only orders matching their locally-stored orderNumber + phone pairs.
  if (isAdmin) {
    const all = await getAllOrdersHydrated(db);
    return c.json({ success: true, ...all });
  }

  const all = await getAllOrdersHydrated(db);
  const authPhone = authUser?.phone ? normalizePhone(authUser.phone) : '';
  const visibleOrders = all.orders.filter((ord) => {
    const ordPhone = normalizePhone(ord.customer?.phone || '');
    if (authUser && ((ord as unknown as { userId?: string }).userId === authUser.id || (authPhone && ordPhone === authPhone))) {
      return true;
    }
    return clientPairs.some(
      (p) => p.orderNumber === ord.orderNumber.toUpperCase() && p.phone && p.phone === ordPhone
    );
  });
  const visibleIds = new Set(visibleOrders.map((o) => o.id));
  return c.json({
    success: true,
    orders: visibleOrders,
    order_tracking_history: all.order_tracking_history.filter((t) => visibleIds.has(t.orderId)),
    courier_information: all.courier_information.filter((ci) => visibleIds.has(ci.orderId)),
  });
});

// Admin Order Endpoints
adminOrdersRouter.get('/', async (c) => {
  const db = c.get('db');
  const all = await getAllOrdersHydrated(db);
  return c.json({ success: true, ...all });
});

async function findOrderByIdOrNumber(db: AppEnv['Variables']['db'], idOrNumber: string) {
  const byId = await db.select().from(orders).where(eq(orders.id, idOrNumber)).get();
  if (byId) return byId;
  return await db.select().from(orders).where(eq(orders.orderNumber, idOrNumber)).get();
}

adminOrdersRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as {
    customer?: Partial<Order['customer']>;
    paymentStatus?: PaymentStatus;
  };
  const db = c.get('db');
  const row = await findOrderByIdOrNumber(db, id);
  if (!row) {
    return c.json({ success: false, message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' }, 404);
  }

  const currentCustomer = safeJsonParse<Order['customer']>(row.customer, {
    fullName: '',
    phone: '',
    district: '',
    upazila: '',
    area: '',
    fullAddress: '',
  });
  const nextCustomer = body.customer
    ? {
        ...currentCustomer,
        ...body.customer,
        phone: body.customer.phone ? normalizePhone(body.customer.phone) : currentCustomer.phone,
        altPhone:
          body.customer.altPhone !== undefined
            ? body.customer.altPhone
              ? normalizePhone(body.customer.altPhone)
              : undefined
            : currentCustomer.altPhone,
      }
    : currentCustomer;

  const now = new Date().toISOString();
  await db
    .update(orders)
    .set({
      customer: JSON.stringify(nextCustomer),
      paymentStatus: body.paymentStatus || row.paymentStatus,
      updatedAt: now,
    })
    .where(eq(orders.id, row.id));

  await appendAdminLog(
    db,
    `অর্ডার তথ্য সম্পাদনা (${row.orderNumber})`,
    'order',
    `গ্রাহক: ${nextCustomer.fullName} · ঠিকানা: ${nextCustomer.fullAddress}`
  );
  clearBulkMicroCache();

  const updated = await db.select().from(orders).where(eq(orders.id, row.id)).get();
  return c.json({
    success: true,
    order: updated ? await hydrateOrderRow(db, updated) : null,
  });
});

adminOrdersRouter.patch('/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as {
    status?: OrderStatus;
    note?: string;
    location?: string;
    updatedBy?: string;
    estimatedDeliveryDate?: string;
  };

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return c.json({ success: false, message: 'অবৈধ অর্ডার স্ট্যাটাস প্রদান করা হয়েছে।' }, 400);
  }

  const db = c.get('db');
  const row = await findOrderByIdOrNumber(db, id);
  if (!row) {
    return c.json({ success: false, message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' }, 404);
  }

  const now = new Date().toISOString();
  const nextPaymentStatus =
    body.status === 'Delivered' && row.paymentStatus !== 'Failed' ? 'Paid' : row.paymentStatus;

  await db
    .update(orders)
    .set({
      orderStatus: body.status,
      paymentStatus: nextPaymentStatus,
      estimatedDeliveryDate: body.estimatedDeliveryDate || row.estimatedDeliveryDate,
      updatedAt: now,
    })
    .where(eq(orders.id, row.id));

  if (body.status !== row.orderStatus) {
    await reconcileOrderInventory(db, row, row.orderStatus, body.status);
  }
  const customerPhone = safeJsonParse<{ phone?: string }>(row.customer, {}).phone || '';
  await recalculateCustomerOrderStats(db, row.userId, customerPhone);

  const entry = {
    id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    orderId: row.id,
    orderNumber: row.orderNumber,
    status: body.status,
    timestamp: now,
    note: body.note?.trim() || `অর্ডারের অবস্থা "${body.status}"-এ পরিবর্তন করা হয়েছে।`,
    location: body.location?.trim() || 'Fashion Doniya BD Fulfillment Center',
    updatedBy: body.updatedBy?.trim() || 'Admin',
  };
  await db.insert(trackings).values(entry);
  await appendAdminLog(
    db,
    `অর্ডার স্ট্যাটাস আপডেট (${row.orderNumber})`,
    'order',
    `${row.orderStatus} → ${body.status}`
  );
  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  const updated = await db.select().from(orders).where(eq(orders.id, row.id)).get();
  return c.json({
    success: true,
    order: updated ? await hydrateOrderRow(db, updated) : null,
    historyEntry: entry,
  });
});

adminOrdersRouter.post('/:id/tracking', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as {
    status?: OrderStatus;
    note?: string;
    location?: string;
    updatedBy?: string;
  };
  const db = c.get('db');
  const row = await findOrderByIdOrNumber(db, id);
  if (!row) {
    return c.json({ success: false, message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' }, 404);
  }

  const status = body.status && VALID_STATUSES.includes(body.status) ? body.status : (row.orderStatus as OrderStatus);
  const now = new Date().toISOString();
  const nextPaymentStatus =
    status === 'Delivered' && row.paymentStatus !== 'Failed' ? 'Paid' : row.paymentStatus;
  const entry = {
    id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    orderId: row.id,
    orderNumber: row.orderNumber,
    status,
    timestamp: now,
    note: body.note?.trim() || 'নতুন ট্র্যাকিং আপডেট যোগ করা হয়েছে।',
    location: body.location?.trim() || 'Fashion Doniya BD Logistics',
    updatedBy: body.updatedBy?.trim() || 'Admin',
  };
  await db.insert(trackings).values(entry);
  await db
    .update(orders)
    .set({ orderStatus: status, paymentStatus: nextPaymentStatus, updatedAt: now })
    .where(eq(orders.id, row.id));

  if (status !== row.orderStatus) {
    await reconcileOrderInventory(db, row, row.orderStatus, status);
  }
  const customerPhone = safeJsonParse<{ phone?: string }>(row.customer, {}).phone || '';
  await recalculateCustomerOrderStats(db, row.userId, customerPhone);
  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  const updated = await db.select().from(orders).where(eq(orders.id, row.id)).get();
  return c.json({
    success: true,
    order: updated ? await hydrateOrderRow(db, updated) : null,
    historyEntry: entry,
  });
});

adminOrdersRouter.put('/:id/courier', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as {
    courierName?: string;
    trackingNumber?: string;
    consignmentId?: string;
    estimatedDeliveryDate?: string;
    trackingUrl?: string;
    courierStatus?: string;
    autoMarkShipped?: boolean;
    note?: string;
  };

  const courierName = String(body.courierName || '').trim();
  const trackingNumber = String(body.trackingNumber || '').trim();
  if (!courierName || !trackingNumber) {
    return c.json(
      { success: false, message: 'কুরিয়ার কোম্পানির নাম এবং ট্র্যাকিং নম্বর উভয়ই আবশ্যক।' },
      400
    );
  }

  const db = c.get('db');
  const row = await findOrderByIdOrNumber(db, id);
  if (!row) {
    return c.json({ success: false, message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' }, 404);
  }

  const now = new Date().toISOString();
  const trackingUrl = body.trackingUrl?.trim() || buildCourierTrackingUrl(courierName, trackingNumber);
  const isSupportedCourier = /steadfast|pathao|redx|paperfly|sundarban/i.test(courierName);
  const existingCourier = await db
    .select()
    .from(courierInfo)
    .where(eq(courierInfo.orderId, row.id))
    .get();

  const courierRecord = {
    id: existingCourier?.id || `cr-${Date.now()}`,
    orderId: row.id,
    orderNumber: row.orderNumber,
    courierName,
    trackingNumber,
    consignmentId: body.consignmentId?.trim() || trackingNumber,
    estimatedDeliveryDate: body.estimatedDeliveryDate?.trim() || row.estimatedDeliveryDate || null,
    trackingUrl: trackingUrl || null,
    courierStatus: body.courierStatus?.trim() || 'Booked / Handed over to Courier',
    lastSyncedAt: now,
    isApiConnected: isSupportedCourier,
    updatedAt: now,
  };

  if (existingCourier) {
    await db.update(courierInfo).set(courierRecord).where(eq(courierInfo.id, existingCourier.id));
  } else {
    await db.insert(courierInfo).values(courierRecord);
  }

  const shouldShip =
    Boolean(body.autoMarkShipped) &&
    ['Pending', 'Confirmed', 'Processing'].includes(row.orderStatus);
  const nextStatus = shouldShip ? 'Shipped' : row.orderStatus;

  await db
    .update(orders)
    .set({
      orderStatus: nextStatus,
      estimatedDeliveryDate: body.estimatedDeliveryDate?.trim() || row.estimatedDeliveryDate,
      updatedAt: now,
    })
    .where(eq(orders.id, row.id));

  const entry = {
    id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    orderId: row.id,
    orderNumber: row.orderNumber,
    status: nextStatus,
    timestamp: now,
    note:
      body.note?.trim() ||
      `কুরিয়ার তথ্য যুক্ত করা হয়েছে: ${courierName} (ট্র্যাকিং নম্বর: ${trackingNumber})`,
    location: `${courierName} হাব`,
    updatedBy: 'Admin',
  };
  await db.insert(trackings).values(entry);
  clearBulkMicroCache();

  const updated = await db.select().from(orders).where(eq(orders.id, row.id)).get();
  return c.json({
    success: true,
    order: updated ? await hydrateOrderRow(db, updated) : null,
    courierInfo: courierRecord,
    historyEntry: entry,
  });
});

adminOrdersRouter.patch('/:id/payment', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as { paymentStatus?: PaymentStatus };
  if (
    !body.paymentStatus ||
    !['Pending', 'Paid', 'Failed', 'pending_verification', 'unpaid'].includes(body.paymentStatus)
  ) {
    return c.json({ success: false, message: 'অবৈধ পেমেন্ট স্ট্যাটাস।' }, 400);
  }

  const db = c.get('db');
  const row = await findOrderByIdOrNumber(db, id);
  if (!row) {
    return c.json({ success: false, message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' }, 404);
  }

  const now = new Date().toISOString();
  await db
    .update(orders)
    .set({ paymentStatus: body.paymentStatus, updatedAt: now })
    .where(eq(orders.id, row.id));

  clearBulkMicroCache();
  const updated = await db.select().from(orders).where(eq(orders.id, row.id)).get();
  return c.json({
    success: true,
    order: updated ? await hydrateOrderRow(db, updated) : null,
  });
});

adminOrdersRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');
  const row = await findOrderByIdOrNumber(db, id);
  if (!row) {
    return c.json({ success: false, message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' }, 404);
  }

  await reconcileOrderInventory(db, row, row.orderStatus, 'Cancelled');

  await db.delete(orderItems).where(eq(orderItems.orderId, row.id));
  await db.delete(trackings).where(eq(trackings.orderId, row.id));
  await db.delete(courierInfo).where(eq(courierInfo.orderId, row.id));
  await db.delete(orders).where(eq(orders.id, row.id));

  const cust = safeJsonParse<{ fullName?: string; phone?: string }>(row.customer, {});
  await recalculateCustomerOrderStats(db, row.userId, cust.phone || '');
  await appendAdminLog(
    db,
    `অর্ডার মুছে ফেলা হয়েছে: ${row.orderNumber}`,
    'order',
    `গ্রাহক: ${cust.fullName || 'Unknown'} (${cust.phone || ''}) · মোট: ৳${row.totalAmount}`
  );

  await invalidateHomeCache(c.env);
  clearBulkMicroCache();
  return c.json({ success: true, message: `অর্ডার ${row.orderNumber} সফলভাবে মুছে ফেলা হয়েছে।` });
});
