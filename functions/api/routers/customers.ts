import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { users } from '../../../backend/server/db/schemas/index';
import type { CustomerUser } from '../../../frontend/src/types/index';
import { appendAdminLog, normalizePhone, safeJsonParse } from '../utils/helpers';
import { clearBulkMicroCache } from './bulk';

export const customersRouter = new Hono<AppEnv>();
export const adminCustomersRouter = new Hono<AppEnv>();

function mapCustomerRow(row: typeof users.$inferSelect): CustomerUser {
  return {
    id: row.id,
    fullName: row.fullName,
    phone: row.phone,
    email: row.email || undefined,
    district: row.district || undefined,
    upazila: row.upazila || undefined,
    fullAddress: row.fullAddress || undefined,
    address:
      row.district || row.upazila || row.area || row.fullAddress
        ? {
            district: row.district || '',
            upazila: row.upazila || '',
            area: row.area || '',
            fullAddress: row.fullAddress || '',
          }
        : undefined,
    savedMeasurements: safeJsonParse(row.savedMeasurements, undefined),
    status: (row.status as 'active' | 'blocked') || 'active',
    createdAt: row.createdAt,
  };
}

customersRouter.post('/sync', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { user?: CustomerUser };
  const user = body?.user;
  if (!user || !user.phone) {
    return c.json({ success: false, message: 'গ্রাহকের মোবাইল নম্বর আবশ্যক।' }, 400);
  }

  const db = c.get('db');
  const normPhone = normalizePhone(user.phone);
  const allRows = await db.select().from(users);
  const existing = allRows.find((u) => normalizePhone(u.phone) === normPhone || u.id === user.id);

  if (existing && existing.status === 'blocked') {
    return c.json(
      { success: false, code: 'ACCOUNT_BLOCKED', message: 'আপনার অ্যাকাউন্টটি ব্লক করা হয়েছে।' },
      403
    );
  }

  const now = new Date().toISOString();
  if (existing) {
    await db
      .update(users)
      .set({
        fullName: user.fullName || existing.fullName,
        phone: normPhone,
        email: user.email ?? existing.email,
        district: user.district ?? user.address?.district ?? existing.district,
        upazila: user.upazila ?? user.address?.upazila ?? existing.upazila,
        area: user.address?.area ?? existing.area,
        fullAddress: user.fullAddress ?? user.address?.fullAddress ?? existing.fullAddress,
        savedMeasurements: user.savedMeasurements
          ? JSON.stringify(user.savedMeasurements)
          : existing.savedMeasurements,
        updatedAt: now,
      })
      .where(eq(users.id, existing.id));

    const updated = await db.select().from(users).where(eq(users.id, existing.id)).get();
    return c.json({ success: true, customer: updated ? mapCustomerRow(updated) : user });
  }

  const newId = user.id || `cust-${Date.now()}`;
  await db.insert(users).values({
    id: newId,
    fullName: user.fullName || 'Customer',
    phone: normPhone,
    email: user.email || null,
    role: 'user',
    status: 'active',
    district: user.district || user.address?.district || null,
    upazila: user.upazila || user.address?.upazila || null,
    area: user.address?.area || null,
    fullAddress: user.fullAddress || user.address?.fullAddress || null,
    savedMeasurements: user.savedMeasurements ? JSON.stringify(user.savedMeasurements) : null,
    createdAt: user.createdAt || now,
    updatedAt: now,
  });

  const created = await db.select().from(users).where(eq(users.id, newId)).get();
  return c.json({ success: true, customer: created ? mapCustomerRow(created) : user });
});

adminCustomersRouter.get('/', async (c) => {
  const db = c.get('db');
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));
  return c.json({ success: true, customers: rows.map(mapCustomerRow) });
});

async function upsertAdminCustomer(
  db: AppEnv['Variables']['db'],
  id: string,
  updates: Partial<CustomerUser>
) {
  const normPhone = updates.phone ? normalizePhone(updates.phone) : '';
  const allRows = await db.select().from(users);
  const existing =
    allRows.find((r) => r.id === id) ||
    (normPhone ? allRows.find((r) => normalizePhone(r.phone) === normPhone) : undefined);
  const now = new Date().toISOString();

  if (existing) {
    await db
      .update(users)
      .set({
        fullName: updates.fullName ?? existing.fullName,
        phone: normPhone || existing.phone,
        email: updates.email !== undefined ? updates.email : existing.email,
        district: updates.district !== undefined ? updates.district : existing.district,
        upazila: updates.upazila !== undefined ? updates.upazila : existing.upazila,
        area: updates.address?.area !== undefined ? updates.address.area : existing.area,
        fullAddress: updates.fullAddress !== undefined ? updates.fullAddress : existing.fullAddress,
        status: updates.status === 'blocked' ? 'blocked' : updates.status === 'active' ? 'active' : existing.status,
        savedMeasurements: updates.savedMeasurements
          ? JSON.stringify(updates.savedMeasurements)
          : existing.savedMeasurements,
        updatedAt: now,
      })
      .where(eq(users.id, existing.id));

    await appendAdminLog(
      db,
      `গ্রাহক প্রোফাইল আপডেট: ${updates.fullName || existing.fullName}`,
      'customer',
      `ফোন: ${normPhone || existing.phone}`
    );
    return existing.id;
  }

  const targetId = id && !id.startsWith('cust-order-') ? id : `cust-${Date.now()}`;
  await db.insert(users).values({
    id: targetId,
    fullName: updates.fullName || 'Customer',
    phone: normPhone,
    email: updates.email || null,
    role: 'user',
    status: updates.status === 'blocked' ? 'blocked' : 'active',
    district: updates.district || updates.address?.district || null,
    upazila: updates.upazila || updates.address?.upazila || null,
    area: updates.address?.area || null,
    fullAddress: updates.fullAddress || updates.address?.fullAddress || null,
    savedMeasurements: updates.savedMeasurements ? JSON.stringify(updates.savedMeasurements) : null,
    createdAt: updates.createdAt || now,
    updatedAt: now,
  });

  await appendAdminLog(
    db,
    `নতুন গ্রাহক যোগ: ${updates.fullName || 'Customer'}`,
    'customer',
    `ফোন: ${normPhone}`
  );
  return targetId;
}

adminCustomersRouter.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    customer?: Partial<CustomerUser>;
  } & Partial<CustomerUser>;
  const updates = body?.customer || body;
  if (!updates?.fullName?.trim() || !updates?.phone?.trim()) {
    return c.json({ success: false, message: 'গ্রাহকের নাম ও মোবাইল নম্বর আবশ্যক।' }, 400);
  }
  const db = c.get('db');
  const savedId = await upsertAdminCustomer(db, updates.id || `cust-${Date.now()}`, updates);
  clearBulkMicroCache();
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));
  const saved = rows.find((r) => r.id === savedId);
  return c.json({
    success: true,
    customer: saved ? mapCustomerRow(saved) : null,
    customers: rows.map(mapCustomerRow),
  }, 201);
});

adminCustomersRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as {
    customer?: Partial<CustomerUser>;
  } & Partial<CustomerUser>;
  const updates = body?.customer || body;
  const db = c.get('db');
  const existing = await db.select().from(users).where(eq(users.id, id)).get();
  if (!existing && (!updates?.fullName?.trim() || !updates?.phone?.trim())) {
    return c.json({ success: false, message: 'গ্রাহক খুঁজে পাওয়া যায়নি।' }, 404);
  }

  const savedId = await upsertAdminCustomer(db, id, updates);
  clearBulkMicroCache();

  const rows = await db.select().from(users).orderBy(desc(users.createdAt));
  const updated = rows.find((r) => r.id === savedId);
  return c.json({
    success: true,
    customer: updated ? mapCustomerRow(updated) : null,
    customers: rows.map(mapCustomerRow),
  });
});

adminCustomersRouter.patch('/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as { status?: string };
  const status = body.status === 'blocked' ? 'blocked' : 'active';
  const db = c.get('db');
  const existing = await db.select().from(users).where(eq(users.id, id)).get();
  if (!existing) {
    return c.json({ success: false, message: 'গ্রাহক খুঁজে পাওয়া যায়নি।' }, 404);
  }

  await db
    .update(users)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(users.id, id));

  await appendAdminLog(
    db,
    `গ্রাহক অ্যাকাউন্ট ${status === 'blocked' ? 'ব্লক' : 'সক্রিয়'} করা হয়েছে`,
    'customer',
    `${existing.fullName} (${existing.phone})`
  );

  const rows = await db.select().from(users).orderBy(desc(users.createdAt));
  const updated = rows.find((r) => r.id === id);
  return c.json({
    success: true,
    customer: updated ? mapCustomerRow(updated) : null,
    customers: rows.map(mapCustomerRow),
  });
});

adminCustomersRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');
  await db.delete(users).where(eq(users.id, id));
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));
  return c.json({ success: true, customers: rows.map(mapCustomerRow) });
});
