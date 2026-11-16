import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { categories } from '../../../backend/server/db/schemas/index';
import type { Category } from '../../../frontend/src/types/index';
import { getAllCategoriesList } from '../utils/mappers';
import { appendAdminLog, slugify } from '../utils/helpers';
import { scheduleSearchEnginePing } from '../utils/edge-seo';
import { invalidateHomeCache } from '../utils/cache';
import { clearBulkMicroCache } from './bulk';

export const categoriesRouter = new Hono<AppEnv>();
export const adminCategoriesRouter = new Hono<AppEnv>();

categoriesRouter.get('/', async (c) => {
  const db = c.get('db');
  const list = await getAllCategoriesList(db);
  return c.json({ success: true, categories: list });
});

adminCategoriesRouter.post('/categories', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { category?: Category };
  const category = body?.category;
  if (!category || !category.id || !category.name) {
    return c.json({ success: false, message: 'ক্যাটাগরির নাম ও আইডি আবশ্যক।' }, 400);
  }

  const db = c.get('db');
  const now = new Date().toISOString();
  const existing = await db.select().from(categories).where(eq(categories.id, category.id)).get();
  const record = {
    id: category.id,
    name: category.name,
    slug: category.slug ? slugify(category.slug) : slugify(category.name),
    fabricWidth: category.fabricWidth || 'all',
    order: Number(category.order || 1),
    description: category.description || null,
    icon: category.icon || null,
    imageUrl: category.imageUrl || null,
    isActive: category.isActive !== false,
    updatedAt: now,
  };

  if (existing) {
    await db.update(categories).set(record).where(eq(categories.id, category.id));
    await appendAdminLog(db, `ক্যাটাগরি আপডেট: ${category.name}`, 'category', `স্লাগ: ${record.slug}`);
  } else {
    await db.insert(categories).values({ ...record, createdAt: now });
    await appendAdminLog(db, `নতুন ক্যাটাগরি যোগ: ${category.name}`, 'category', `স্লাগ: ${record.slug}`);
  }

  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  const baseUrl = (c.env?.SITE_URL || new URL(c.req.url).origin).replace(/\/+$/, '');
  scheduleSearchEnginePing(c, c.env, baseUrl, [
    `/category/${encodeURIComponent(record.slug)}`,
    '/shop',
    '/sitemap.xml',
  ]);

  const list = await getAllCategoriesList(db);
  return c.json({ success: true, categories: list });
});

adminCategoriesRouter.put('/categories-reorder', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { categories?: Category[] };
  const db = c.get('db');
  const now = new Date().toISOString();
  if (Array.isArray(body?.categories) && body.categories.length > 0) {
    for (let idx = 0; idx < body.categories.length; idx++) {
      const cat = body.categories[idx];
      await db
        .update(categories)
        .set({ order: idx + 1, updatedAt: now })
        .where(eq(categories.id, cat.id));
    }
    await invalidateHomeCache(c.env);
    clearBulkMicroCache();
  }
  const list = await getAllCategoriesList(db);
  return c.json({ success: true, categories: list });
});

adminCategoriesRouter.delete('/categories/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');
  const existing = await db.select().from(categories).where(eq(categories.id, id)).get();
  await db.delete(categories).where(eq(categories.id, id));
  if (existing) {
    await appendAdminLog(db, `ক্যাটাগরি মুছে ফেলা হয়েছে: ${existing.name}`, 'category', `আইডি: ${id}`);
  }
  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  const baseUrl = (c.env?.SITE_URL || new URL(c.req.url).origin).replace(/\/+$/, '');
  const pingUrls = existing?.slug
    ? [`/category/${encodeURIComponent(existing.slug)}`, '/shop', '/sitemap.xml']
    : ['/shop', '/sitemap.xml'];
  scheduleSearchEnginePing(c, c.env, baseUrl, pingUrls);

  const list = await getAllCategoriesList(db);
  return c.json({ success: true, categories: list });
});
