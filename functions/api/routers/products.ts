import { Hono } from 'hono';
import { eq, or } from 'drizzle-orm';
import type { AppEnv } from '../types';
import { products, productPriceHistory } from '../../../backend/server/db/schemas/index';
import type { Product } from '../../../frontend/src/types/index';
import { getAllProductsList, mapProductRow } from '../utils/mappers';
import { appendAdminLog, slugify } from '../utils/helpers';
import { invalidateHomeCache } from '../utils/cache';
import { clearBulkMicroCache } from './bulk';

export const productsRouter = new Hono<AppEnv>();
export const adminProductsRouter = new Hono<AppEnv>();

productsRouter.get('/', async (c) => {
  const db = c.get('db');
  const list = await getAllProductsList(db);
  return c.json({ success: true, products: list });
});

productsRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const db = c.get('db');
  const row = await db
    .select()
    .from(products)
    .where(or(eq(products.id, slug), eq(products.slug, slug)))
    .get();
  if (!row) {
    return c.json({ success: false, message: 'পণ্যটি খুঁজে পাওয়া যায়নি।' }, 404);
  }
  return c.json({ success: true, product: mapProductRow(row) });
});

adminProductsRouter.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { product?: Product };
  const product = body?.product;
  if (!product || !product.id || !product.name) {
    return c.json({ success: false, message: 'পণ্যের নাম ও আইডি আবশ্যক।' }, 400);
  }

  const db = c.get('db');
  const now = new Date().toISOString();
  const existing = await db.select().from(products).where(eq(products.id, product.id)).get();

  const record = {
    id: product.id,
    slug: existing?.slug || product.id || slugify(product.nameEn || product.name),
    name: product.name,
    nameEn: product.nameEn || null,
    description: product.description || '',
    sku: product.sku || product.id.toUpperCase(),
    fabricWidth: product.fabricWidth || '3.5',
    category: product.category || 'কামিজ',
    fabricType: product.fabricType || '',
    design: product.design || null,
    color: product.color || '',
    colorHex: product.colorHex || null,
    availableColors: JSON.stringify(product.availableColors || []),
    pricePerYard: Number(product.pricePerYard || 0),
    discountPrice: product.discountPrice != null ? Number(product.discountPrice) : null,
    stockYards: Number(product.stockYards || 0),
    minOrderQuantity: Number(product.minOrderQuantity || 1),
    stepYard: Number(product.stepYard || 0.5),
    images: JSON.stringify(product.images || []),
    patternType: product.patternType || 'cotton',
    isFeatured: Boolean(product.isFeatured),
    isBestSeller: Boolean(product.isBestSeller),
    isNewArrival: Boolean(product.isNewArrival),
    isActive: product.isActive !== false,
    rating: product.rating ?? 5,
    reviewCount: product.reviewCount ?? 0,
    customMeasurementConfig: product.customMeasurementConfig
      ? JSON.stringify(product.customMeasurementConfig)
      : null,
    seoTitle: product.seoTitle || null,
    seoDescription: product.seoDescription || null,
    seoKeywords: product.seoKeywords || null,
    imageAlt: product.imageAlt || null,
    updatedAt: now,
  };

  if (existing) {
    await db.update(products).set(record).where(eq(products.id, product.id));
    await appendAdminLog(
      db,
      `পণ্য আপডেট: ${product.name}`,
      'product',
      `SKU: ${record.sku} · মূল্য: ৳${record.discountPrice || record.pricePerYard}/গজ · স্টক: ${record.stockYards} গজ`
    );
  } else {
    await db.insert(products).values({ ...record, createdAt: now });
    await appendAdminLog(
      db,
      `নতুন পণ্য যোগ: ${product.name}`,
      'product',
      `ক্যাটাগরি: ${record.category} (${record.fabricWidth} বহর) · মূল্য: ৳${record.discountPrice || record.pricePerYard}/গজ`
    );
  }

  await db.insert(productPriceHistory).values({
    id: `pph-${Date.now()}`,
    productId: product.id,
    pricePerYard: record.pricePerYard,
    discountPrice: record.discountPrice,
    recordedAt: now,
  });

  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  const allProducts = await getAllProductsList(db);
  return c.json({ success: true, product, products: allProducts });
});

adminProductsRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as { product?: Partial<Product> } & Partial<Product>;
  const updates = body?.product || body;
  const db = c.get('db');
  const existing = await db.select().from(products).where(eq(products.id, id)).get();
  if (!existing) {
    return c.json({ success: false, message: 'পণ্যটি খুঁজে পাওয়া যায়নি।' }, 404);
  }

  const merged: Product = { ...mapProductRow(existing), ...updates, id };
  const now = new Date().toISOString();

  await db
    .update(products)
    .set({
      name: merged.name,
      nameEn: merged.nameEn || null,
      description: merged.description,
      sku: merged.sku,
      fabricWidth: merged.fabricWidth,
      category: merged.category,
      fabricType: merged.fabricType,
      design: merged.design || null,
      color: merged.color,
      colorHex: merged.colorHex || null,
      availableColors: JSON.stringify(merged.availableColors || []),
      pricePerYard: Number(merged.pricePerYard),
      discountPrice: merged.discountPrice != null ? Number(merged.discountPrice) : null,
      stockYards: Number(merged.stockYards),
      minOrderQuantity: Number(merged.minOrderQuantity),
      stepYard: Number(merged.stepYard),
      images: JSON.stringify(merged.images || []),
      patternType: merged.patternType,
      isFeatured: Boolean(merged.isFeatured),
      isBestSeller: Boolean(merged.isBestSeller),
      isNewArrival: Boolean(merged.isNewArrival),
      isActive: merged.isActive !== false,
      customMeasurementConfig: merged.customMeasurementConfig
        ? JSON.stringify(merged.customMeasurementConfig)
        : null,
      seoTitle: merged.seoTitle || null,
      seoDescription: merged.seoDescription || null,
      seoKeywords: merged.seoKeywords || null,
      imageAlt: merged.imageAlt || null,
      updatedAt: now,
    })
    .where(eq(products.id, id));

  await appendAdminLog(db, `পণ্য সম্পাদনা: ${merged.name}`, 'product', `SKU: ${merged.sku} আপডেট করা হয়েছে`);
  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  const allProducts = await getAllProductsList(db);
  return c.json({ success: true, product: merged, products: allProducts });
});

adminProductsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');
  const existing = await db.select().from(products).where(eq(products.id, id)).get();
  await db.delete(products).where(eq(products.id, id));
  if (existing) {
    await appendAdminLog(
      db,
      `পণ্য মুছে ফেলা হয়েছে: ${existing.name}`,
      'product',
      `SKU: ${existing.sku} ডাটাবেস থেকে মুছে ফেলা হয়েছে`
    );
  }
  await invalidateHomeCache(c.env);
  clearBulkMicroCache();
  const allProducts = await getAllProductsList(db);
  return c.json({ success: true, products: allProducts });
});
