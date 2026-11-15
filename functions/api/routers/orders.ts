import { Hono, type Context } from 'hono';
import { eq, or } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { orders, trackings, courierInfo, orderItems, products } from '../../../backend/server/db/schemas/index';
import type { Order, OrderStatus, PaymentStatus } from '../../../frontend/src/types/index';
import { getAllOrdersHydrated, hydrateOrderRow } from '../utils/mappers';
import { appendAdminLog, buildCourierTrackingUrl, normalizePhone, safeJsonParse } from '../utils/helpers';
import { checkoutRateLimiter, pollingRateLimiter } from '../utils/rateLimiter';
import { invalidateHomeCache } from '../utils/cache';
import { clearBulkMicroCache } from './bulk';
import { sendTransactionalEmail } from '../utils/email';
import { sendTransactionalSms } from '../utils/sms';

export const ordersRouter = new Hono<AppEnv>();
export const adminOrdersRouter = new Hono<AppEnv>();

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
  const allRows = await db.select().from(orders);
  const matchedRow = allRows.find(
    (o) =>
      o.orderNumber.toUpperCase() === cleanOrderId || o.id.toUpperCase() === cleanOrderId
  );

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
  const id = orderData.id || `ord-${Date.now()}`;
  const orderNumber =
    orderData.orderNumber || `FD-${Math.floor(100000 + Math.random() * 900000)}`;
  const normalizedCustomer = {
    ...orderData.customer,
    phone: normalizedPhone,
    altPhone: orderData.customer.altPhone
      ? normalizePhone(orderData.customer.altPhone)
      : undefined,
  };

  const authUser = c.get('user');

  await db
    .insert(orders)
    .values({
      id,
      orderNumber,
      userId: authUser?.id || null,
      customer: JSON.stringify(normalizedCustomer),
      items: JSON.stringify(orderData.items),
      subtotal: Math.max(0, Number(orderData.subtotal || 0)),
      deliveryCharge: Math.max(0, Number(orderData.deliveryCharge || 0)),
      discountAmount: Math.max(0, Number(orderData.discount || 0)),
      couponCode: orderData.couponCode || null,
      totalAmount: Math.max(0, Number(orderData.grandTotal || 0)),
      paymentMethod: orderData.paymentMethod || 'cod',
      paymentStatus: orderData.paymentStatus || 'Pending',
      paymentDetails: orderData.paymentDetails ? JSON.stringify(orderData.paymentDetails) : null,
      orderStatus: orderData.orderStatus || 'Pending',
      estimatedDeliveryDate: orderData.estimatedDeliveryDate || null,
      notes: orderData.customer?.deliveryNotes || null,
      createdAt: orderData.createdAt || now,
      updatedAt: now,
    })
    .onConflictDoNothing();

  for (let idx = 0; idx < orderData.items.length; idx++) {
    const item = orderData.items[idx];
    const yards = Math.max(0.25, Number(item.yards || 1));
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
        pricePerYard: Math.max(0, Number(item.pricePerYard || 0)),
        lineTotal: Math.max(
          0,
          Number(item.finalProductPrice ?? item.subtotal ?? (item.pricePerYard || 0) * yards)
        ),
        selectedColor: item.color || null,
        customization: customPayload ? JSON.stringify(customPayload) : null,
      })
      .onConflictDoNothing();

    // Deduct stock yards gracefully (clamp at 0)
    const prod = await db.select().from(products).where(eq(products.id, item.productId)).get();
    if (prod) {
      const nextStock = Math.max(0, Number((prod.stockYards - yards).toFixed(2)));
      await db
        .update(products)
        .set({ stockYards: nextStock, updatedAt: now })
        .where(eq(products.id, prod.id));
    }
  }

  await db
    .insert(trackings)
    .values({
      id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: id,
      orderNumber,
      status: orderData.orderStatus || 'Pending',
      timestamp: now,
      note: 'অর্ডারটি সফলভাবে গৃহীত হয়েছে এবং ভেরিফিকেশনের জন্য প্রক্রিয়াধীন রয়েছে।',
      location: 'Fashion Doniya BD অনলাইন ডেস্ক, ঢাকা',
      updatedBy: 'System',
    })
    .onConflictDoNothing();

  await appendAdminLog(
    db,
    `নতুন অর্ডার (${orderNumber})`,
    'order',
    `${normalizedCustomer.fullName} · ৳${orderData.grandTotal}`,
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
            <h3 style="color: #241614; margin-top: 0;">ধন্যবাদ, ${normalizedCustomer.fullName}!</h3>
            <p style="font-size: 14px; color: #523A35;">আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে। শীঘ্রই আমাদের প্রতিনিধি আপনার সাথে যোগাযোগ করবেন।</p>
            <div style="background: #FAF8F4; padding: 12px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #6B0812;">
              <p style="margin: 0; font-size: 13px;"><strong>অর্ডার নম্বর:</strong> ${orderNumber}</p>
              <p style="margin: 4px 0 0; font-size: 13px;"><strong>পেমেন্ট মেথড:</strong> ${orderData.paymentMethod}</p>
              <p style="margin: 4px 0 0; font-size: 13px;"><strong>মোট মূল্য:</strong> ৳${orderData.grandTotal}</p>
              <p style="margin: 4px 0 0; font-size: 13px;"><strong>ডেলিভারি ঠিকানা:</strong> ${normalizedCustomer.fullAddress || ''}, ${normalizedCustomer.district}</p>
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

    if (c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(emailPromise);
    }
  }

  if (normalizedCustomer.phone) {
    const smsPromise = sendTransactionalSms(c.env, {
      to: normalizedCustomer.phone,
      message: `Fashion Doniya: প্রিয় ${normalizedCustomer.fullName}, আপনার অর্ডার (${orderNumber}) গ্রহণ করা হয়েছে। মোট: ৳${orderData.grandTotal}। ধন্যবাদ!`,
    }).catch(() => {});

    if (c.executionCtx?.waitUntil) {
      c.executionCtx.waitUntil(smsPromise);
    }
  }

  const row = await db.select().from(orders).where(eq(orders.id, id)).get();
  const hydrated = row ? await hydrateOrderRow(db, row) : orderData;
  return c.json({ success: true, order: hydrated }, 201);
});

ordersRouter.post('/sync-client', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { orders?: Order[] };
  const db = c.get('db');
  const now = new Date().toISOString();
  const isAdmin = c.get('isAdmin');
  const authUser = c.get('user');
  const clientPairs: Array<{ orderNumber: string; phone: string }> = [];

  if (Array.isArray(body?.orders)) {
    for (const incoming of body.orders) {
      if (!incoming?.id || !incoming?.orderNumber || !incoming?.customer?.phone) continue;
      const cleanPhone = normalizePhone(incoming.customer.phone);
      clientPairs.push({
        orderNumber: incoming.orderNumber.toUpperCase(),
        phone: cleanPhone,
      });
      const existing = await db
        .select({ id: orders.id })
        .from(orders)
        .where(or(eq(orders.id, incoming.id), eq(orders.orderNumber, incoming.orderNumber)))
        .get();
      if (!existing && Array.isArray(incoming.items) && incoming.items.length > 0) {
        await db.insert(orders).values({
          id: incoming.id,
          orderNumber: incoming.orderNumber,
          userId: authUser?.id || null,
          customer: JSON.stringify({
            ...incoming.customer,
            phone: cleanPhone,
          }),
          items: JSON.stringify(incoming.items || []),
          subtotal: Math.max(0, Number(incoming.subtotal || 0)),
          deliveryCharge: Math.max(0, Number(incoming.deliveryCharge || 0)),
          discountAmount: Math.max(0, Number(incoming.discount || 0)),
          couponCode: incoming.couponCode || null,
          totalAmount: Math.max(0, Number(incoming.grandTotal || 0)),
          paymentMethod: incoming.paymentMethod || 'cod',
          paymentStatus: incoming.paymentStatus || 'Pending',
          paymentDetails: incoming.paymentDetails ? JSON.stringify(incoming.paymentDetails) : null,
          orderStatus: incoming.orderStatus || 'Pending',
          estimatedDeliveryDate: incoming.estimatedDeliveryDate || null,
          notes: incoming.customer?.deliveryNotes || null,
          createdAt: incoming.createdAt || now,
          updatedAt: incoming.updatedAt || now,
        });
      }
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
  const all = await db.select().from(orders);
  return all.find(
    (o) => o.id === idOrNumber || o.orderNumber.toUpperCase() === idOrNumber.toUpperCase()
  );
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

  await db.delete(orderItems).where(eq(orderItems.orderId, row.id));
  await db.delete(trackings).where(eq(trackings.orderId, row.id));
  await db.delete(courierInfo).where(eq(courierInfo.orderId, row.id));
  await db.delete(orders).where(eq(orders.id, row.id));

  const cust = safeJsonParse<{ fullName?: string; phone?: string }>(row.customer, {});
  await appendAdminLog(
    db,
    `অর্ডার মুছে ফেলা হয়েছে: ${row.orderNumber}`,
    'order',
    `গ্রাহক: ${cust.fullName || 'Unknown'} (${cust.phone || ''}) · মোট: ৳${row.totalAmount}`
  );

  clearBulkMicroCache();
  return c.json({ success: true, message: `অর্ডার ${row.orderNumber} সফলভাবে মুছে ফেলা হয়েছে।` });
});
