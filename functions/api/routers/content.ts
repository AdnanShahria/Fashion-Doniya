import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { contactMessages, customDesignRequests } from '../../../backend/server/db/schemas/index';
import { appendAdminLog, normalizePhone, safeJsonParse } from '../utils/helpers';

export const contentRouter = new Hono<AppEnv>();
export const adminContentRouter = new Hono<AppEnv>();

// Public Contact Messages
contentRouter.post('/contact-messages', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = String(body.name || '').trim();
  const phone = normalizePhone(String(body.phone || ''));
  const message = String(body.message || '').trim();

  if (!name || !phone || !message) {
    return c.json({ success: false, message: 'নাম, মোবাইল নম্বর এবং বার্তা আবশ্যক।' }, 400);
  }

  const db = c.get('db');
  const record = {
    id: `msg-${Date.now()}`,
    name,
    phone,
    message,
    status: 'unread',
    createdAt: new Date().toISOString(),
  };
  await db.insert(contactMessages).values(record);
  await appendAdminLog(
    db,
    `নতুন যোগাযোগ বার্তা (${name})`,
    'content',
    `ফোন: ${phone} · বার্তা: ${message.slice(0, 60)}`,
    'Customer'
  );
  return c.json({ success: true, record }, 201);
});

// Public Custom Design Requests
contentRouter.post('/custom-requests', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const customerName = String(body.customerName || '').trim();
  const phone = normalizePhone(String(body.phone || ''));
  const outfitCategory = String(body.outfitCategory || '').trim();
  const fabricDetails = String(body.fabricDetails || '').trim();

  if (!customerName || !phone || !outfitCategory) {
    return c.json({ success: false, message: 'নাম, মোবাইল নম্বর ও আউটফিট ক্যাটাগরি আবশ্যক।' }, 400);
  }

  const db = c.get('db');
  const record = {
    id: `req-${Date.now()}`,
    customerName,
    phone,
    outfitCategory,
    fabricDetails,
    measurements: body.measurements ? JSON.stringify(body.measurements) : null,
    referenceImages: JSON.stringify(Array.isArray(body.referenceImages) ? body.referenceImages : []),
    notes: body.notes ? String(body.notes) : null,
    status: 'Pending',
    adminNotes: null,
    createdAt: new Date().toISOString(),
  };
  await db.insert(customDesignRequests).values(record);
  await appendAdminLog(
    db,
    `নতুন কাস্টম ডিজাইন রিকোয়েস্ট (${customerName})`,
    'custom_design',
    `ক্যাটাগরি: ${outfitCategory} · ফোন: ${phone}`,
    'Customer'
  );
  return c.json({ success: true, request: record }, 201);
});

// Admin Contact Messages
adminContentRouter.get('/contact-messages', async (c) => {
  const db = c.get('db');
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));
  return c.json({ success: true, messages: rows });
});

adminContentRouter.patch('/contact-messages/:id', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as { status?: string };
  const db = c.get('db');
  if (body.status) {
    await db
      .update(contactMessages)
      .set({ status: body.status })
      .where(eq(contactMessages.id, id));
  }
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));
  return c.json({ success: true, messages: rows });
});

adminContentRouter.delete('/contact-messages/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));
  return c.json({ success: true, messages: rows });
});

// Admin Custom Design Requests
adminContentRouter.get('/custom-requests', async (c) => {
  const db = c.get('db');
  const rows = await db
    .select()
    .from(customDesignRequests)
    .orderBy(desc(customDesignRequests.createdAt));
  return c.json({
    success: true,
    requests: rows.map((r) => ({
      ...r,
      measurements: safeJsonParse(r.measurements, undefined),
      referenceImages: safeJsonParse(r.referenceImages, []),
    })),
  });
});

adminContentRouter.patch('/custom-requests/:id', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as {
    status?: string;
    adminNotes?: string;
  };
  const db = c.get('db');
  await db
    .update(customDesignRequests)
    .set({
      ...(body.status ? { status: body.status } : {}),
      ...(body.adminNotes !== undefined ? { adminNotes: body.adminNotes } : {}),
    })
    .where(eq(customDesignRequests.id, id));
  return c.json({ success: true });
});
