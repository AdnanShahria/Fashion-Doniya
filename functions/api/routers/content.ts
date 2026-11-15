import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { contactMessages, customDesignRequests } from '../../../backend/server/db/schemas/index';
import { appendAdminLog, normalizePhone, safeJsonParse } from '../utils/helpers';
import { sendTransactionalEmail } from '../utils/email';

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

  const adminEmail = String(c.env?.ADMIN_EMAIL || 'admin@fashiondoniyabd.com');
  const emailPromise = sendTransactionalEmail(c.env, {
    to: adminEmail,
    subject: `নতুন কাস্টমার বার্তা — ${name} (${phone})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 550px; background: #FAF6F0; padding: 20px; border-radius: 8px; color: #241614;">
        <h3 style="color: #6B0812; margin-top: 0;">নতুন ওয়েবসাইট যোগাযোগ বার্তা</h3>
        <p><strong>প্রেরক:</strong> ${name}</p>
        <p><strong>মোবাইল:</strong> <a href="tel:${phone}">${phone}</a></p>
        <div style="background: #FFFFFF; padding: 12px; border-radius: 6px; border: 1px solid #E6D8C5; margin-top: 12px;">
          <p style="margin: 0; font-size: 13px; line-height: 1.5;">${message}</p>
        </div>
      </div>
    `,
  }).catch(() => {});

  if (c.executionCtx?.waitUntil) {
    c.executionCtx.waitUntil(emailPromise);
  }

  return c.json({ success: true, record }, 201);
});

function mapCustomRequestRow(r: typeof customDesignRequests.$inferSelect) {
  const parsedFabric = safeJsonParse<Record<string, unknown>>(r.fabricDetails, {});
  const isJsonFabric = parsedFabric && typeof parsedFabric === 'object' && Object.keys(parsedFabric).length > 0;
  const refImgs = safeJsonParse<string[]>(r.referenceImages, []);
  return {
    ...r,
    outfitType: (parsedFabric.outfitType as string) || r.outfitCategory,
    fabricWidth: (parsedFabric.fabricWidth as string) || '3.5',
    requiredYards: Number(parsedFabric.requiredYards ?? 2.5),
    preferredColor: (parsedFabric.preferredColor as string) || 'পছন্দ অনুযায়ী',
    description: (parsedFabric.description as string) || (isJsonFabric ? '' : r.fabricDetails) || r.notes || '',
    budget: (parsedFabric.budget as string) || undefined,
    additionalItems: Array.isArray(parsedFabric.additionalItems) ? parsedFabric.additionalItems : [],
    referenceImages: refImgs,
    referenceImageBase64: refImgs[0] || undefined,
    measurements: safeJsonParse(r.measurements, {}),
  };
}

// Public Custom Design Requests
contentRouter.post('/custom-requests', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const customerName = String(body.customerName || '').trim();
  const phone = normalizePhone(String(body.phone || ''));
  const outfitCategory = String(body.outfitCategory || body.outfitType || '').trim();
  const rawDescription = String(body.description || body.fabricDetails || '').trim();

  if (!customerName || !phone || !outfitCategory) {
    return c.json({ success: false, message: 'নাম, মোবাইল নম্বর ও আউটফিট ক্যাটাগরি আবশ্যক।' }, 400);
  }

  const structuredFabric = JSON.stringify({
    outfitType: outfitCategory,
    fabricWidth: String(body.fabricWidth || '3.5'),
    requiredYards: Number(body.requiredYards || 2.5),
    preferredColor: String(body.preferredColor || ''),
    description: rawDescription,
    budget: body.budget ? String(body.budget) : undefined,
    additionalItems: Array.isArray(body.additionalItems) ? body.additionalItems : [],
  });

  const refs: string[] = Array.isArray(body.referenceImages)
    ? body.referenceImages.filter((x): x is string => typeof x === 'string' && x.length > 0)
    : typeof body.referenceImageBase64 === 'string' && body.referenceImageBase64
      ? [body.referenceImageBase64]
      : [];

  const db = c.get('db');
  const record = {
    id: String(body.id || `req-${Date.now()}`),
    customerName,
    phone,
    outfitCategory,
    fabricDetails: structuredFabric,
    measurements: body.measurements ? JSON.stringify(body.measurements) : null,
    referenceImages: JSON.stringify(refs),
    notes: body.notes ? String(body.notes) : rawDescription || null,
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
  return c.json({ success: true, request: mapCustomRequestRow(record) }, 201);
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
    requests: rows.map(mapCustomRequestRow),
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
  const updated = await db
    .select()
    .from(customDesignRequests)
    .where(eq(customDesignRequests.id, id))
    .get();
  return c.json({
    success: true,
    request: updated ? mapCustomRequestRow(updated) : null,
  });
});

adminContentRouter.delete('/custom-requests/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');
  await db.delete(customDesignRequests).where(eq(customDesignRequests.id, id));
  const rows = await db
    .select()
    .from(customDesignRequests)
    .orderBy(desc(customDesignRequests.createdAt));
  return c.json({
    success: true,
    requests: rows.map(mapCustomRequestRow),
  });
});
