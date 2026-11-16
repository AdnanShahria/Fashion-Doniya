import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { orders, courierInfo, trackings } from '../../../backend/server/db/schemas/index';
import type { Order, OrderStatus } from '../../../frontend/src/types/index';
import { constantTimeEqual } from '../utils/auth-helper';
import { mapCourierStatusToOrderStatus, safeJsonParse } from '../utils/helpers';
import { hydrateOrderRow } from '../utils/mappers';
import { invalidateHomeCache } from '../utils/cache';
import { clearBulkMicroCache } from './bulk';
import { reconcileOrderInventory, recalculateCustomerOrderStats } from './orders';

export const courierRouter = new Hono<AppEnv>();

courierRouter.post('/webhook', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const secret = String(
    c.req.header('x-courier-webhook-secret') ||
      c.req.header('x-admin-token') ||
      body.webhookSecret ||
      ''
  ).trim();

  const isProd = c.env?.NODE_ENV === 'production';
  const expectedWebhookSecret = String(
    c.env?.COURIER_WEBHOOK_SECRET || (isProd ? '' : 'fd-courier-webhook-2026')
  ).trim();
  const expectedAdminKey = String(c.env?.ADMIN_API_KEY || '').trim();

  const authorized =
    c.get('isAdmin') ||
    (secret &&
      expectedWebhookSecret.length > 0 &&
      (await constantTimeEqual(secret, expectedWebhookSecret))) ||
    (secret && expectedAdminKey && (await constantTimeEqual(secret, expectedAdminKey)));

  if (!authorized) {
    return c.json({ success: false, message: 'Invalid courier webhook signature or secret.' }, 401);
  }

  const orderNumber = body.orderNumber ? String(body.orderNumber).trim() : '';
  const trackingNumber = body.trackingNumber ? String(body.trackingNumber).trim() : '';
  if (!orderNumber && !trackingNumber) {
    return c.json(
      { success: false, message: 'orderNumber or trackingNumber is required in webhook payload.' },
      400
    );
  }

  const db = c.get('db');
  const [allCouriers, allOrders] = await Promise.all([
    db.select().from(courierInfo),
    db.select().from(orders),
  ]);

  const courierRec = allCouriers.find(
    (cr) =>
      (trackingNumber && cr.trackingNumber.toUpperCase() === trackingNumber.toUpperCase()) ||
      (orderNumber && cr.orderNumber.toUpperCase() === orderNumber.toUpperCase())
  );

  const orderRow = allOrders.find(
    (o) =>
      (orderNumber && o.orderNumber.toUpperCase() === orderNumber.toUpperCase()) ||
      (courierRec && o.id === courierRec.orderId)
  );

  if (!orderRow) {
    return c.json({ success: false, message: 'Matching order not found for courier webhook.' }, 404);
  }

  const now = new Date().toISOString();
  const courierStatusStr = String(body.courierStatus || '');
  const mappedStatus = mapCourierStatusToOrderStatus(
    courierStatusStr,
    orderRow.orderStatus as OrderStatus
  );

  await db
    .update(orders)
    .set({
      orderStatus: mappedStatus,
      paymentStatus: mappedStatus === 'Delivered' ? 'Paid' : orderRow.paymentStatus,
      updatedAt: now,
    })
    .where(eq(orders.id, orderRow.id));

  if (courierRec) {
    await db
      .update(courierInfo)
      .set({
        courierStatus: courierStatusStr || mappedStatus,
        lastSyncedAt: now,
        updatedAt: now,
      })
      .where(eq(courierInfo.id, courierRec.id));
  }

  const entry = {
    id: `trk-wh-${Date.now()}`,
    orderId: orderRow.id,
    orderNumber: orderRow.orderNumber,
    status: mappedStatus,
    timestamp: now,
    note:
      (body.note ? String(body.note) : '') ||
      `কুরিয়ার সিঙ্ক আপডেট (${courierRec?.courierName || 'Courier'}): ${courierStatusStr || mappedStatus}`,
    location:
      (body.location ? String(body.location) : '') ||
      `${courierRec?.courierName || 'কুরিয়ার'} হাব`,
    updatedBy: 'Courier API',
  };
  await db.insert(trackings).values(entry);
  if (mappedStatus !== orderRow.orderStatus) {
    await reconcileOrderInventory(db, orderRow, orderRow.orderStatus, mappedStatus);
    await recalculateCustomerOrderStats(
      db,
      orderRow.userId,
      safeJsonParse<{ phone?: string }>(orderRow.customer, { phone: '' }).phone
    );
    await invalidateHomeCache(c.env);
  }
  clearBulkMicroCache();

  const updated = await db.select().from(orders).where(eq(orders.id, orderRow.id)).get();
  return c.json({
    success: true,
    order: updated ? await hydrateOrderRow(db, updated) : null,
    historyEntry: entry,
  });
});

courierRouter.post('/sync/:id', async (c) => {
  if (!c.get('isAdmin')) {
    return c.json({ success: false, message: 'Unauthorized Admin Access' }, 401);
  }
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as {
    courierStatus?: string;
    location?: string;
  };
  const db = c.get('db');
  const allOrders = await db.select().from(orders);
  const orderRow = allOrders.find(
    (o) => o.id === id || o.orderNumber.toUpperCase() === id.toUpperCase()
  );
  if (!orderRow) {
    return c.json({ success: false, message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।' }, 404);
  }

  const courierRec = await db
    .select()
    .from(courierInfo)
    .where(eq(courierInfo.orderId, orderRow.id))
    .get();
  if (!courierRec) {
    return c.json(
      {
        success: false,
        message: 'এই অর্ডারে এখনো কোনো কুরিয়ার তথ্য যুক্ত করা হয়নি। প্রথমে কুরিয়ার ও ট্র্যাকিং নম্বর সংরক্ষণ করুন।',
      },
      400
    );
  }

  const now = new Date().toISOString();
  let historyEntry = null;

  if (body.courierStatus) {
    const sim = body.courierStatus.trim();
    const nextStatus = mapCourierStatusToOrderStatus(sim, orderRow.orderStatus as OrderStatus);
    await db
      .update(orders)
      .set({
        orderStatus: nextStatus,
        paymentStatus: nextStatus === 'Delivered' ? 'Paid' : orderRow.paymentStatus,
        updatedAt: now,
      })
      .where(eq(orders.id, orderRow.id));

    await db
      .update(courierInfo)
      .set({ courierStatus: sim, lastSyncedAt: now, updatedAt: now })
      .where(eq(courierInfo.id, courierRec.id));

    const customer = safeJsonParse<Order['customer']>(orderRow.customer, {
      fullName: '',
      phone: '',
      district: 'ঢাকা',
      upazila: '',
      area: '',
      fullAddress: '',
    });

    historyEntry = {
      id: `trk-sync-${Date.now()}`,
      orderId: orderRow.id,
      orderNumber: orderRow.orderNumber,
      status: nextStatus,
      timestamp: now,
      note: `${courierRec.courierName} স্ট্যাটাস সিঙ্ক: ${sim}`,
      location: body.location?.trim() || `${courierRec.courierName} (${customer.district} হাব)`,
      updatedBy: 'Courier API',
    };
    await db.insert(trackings).values(historyEntry);
    if (nextStatus !== orderRow.orderStatus) {
      await reconcileOrderInventory(db, orderRow, orderRow.orderStatus, nextStatus);
      await recalculateCustomerOrderStats(db, orderRow.userId, customer.phone);
      await invalidateHomeCache(c.env);
    }
  } else {
    await db
      .update(courierInfo)
      .set({ lastSyncedAt: now, updatedAt: now })
      .where(eq(courierInfo.id, courierRec.id));
  }

  clearBulkMicroCache();
  const updated = await db.select().from(orders).where(eq(orders.id, orderRow.id)).get();
  const updatedCourier = await db
    .select()
    .from(courierInfo)
    .where(eq(courierInfo.orderId, orderRow.id))
    .get();

  return c.json({
    success: true,
    order: updated ? await hydrateOrderRow(db, updated) : null,
    courierInfo: updatedCourier,
    historyEntry,
  });
});
