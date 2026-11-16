import { Hono } from 'hono';
import { eq, or } from 'drizzle-orm';
import type { AppEnv } from '../types';
import type { AppDatabase } from '../utils/db-factory';
import { products, productPriceHistory } from '../../../backend/server/db/schemas/index';
import type { Product } from '../../../frontend/src/types/index';
import { getAllProductsList, getStoreAndPaymentSettings, mapProductRow } from '../utils/mappers';
import { appendAdminLog, slugify } from '../utils/helpers';
import { computeProductSeo, scheduleSearchEnginePing } from '../utils/edge-seo';
import { invalidateHomeCache } from '../utils/cache';
import { clearBulkMicroCache } from './bulk';

export const productsRouter = new Hono<AppEnv>();
export const adminProductsRouter = new Hono<AppEnv>();

export async function resolveUniqueProductSlug(
  db: AppDatabase,
  desiredSlug: string,
  currentId?: string
): Promise<string> {
  const base = slugify(desiredSlug) || 'item';
  const rows = await db.select({ id: products.id, slug: products.slug }).from(products);
  const taken = new Set(
    rows.filter((r) => !currentId || r.id !== currentId).map((r) => r.slug)
  );
  if (!taken.has(base)) {
    return base;
  }
  let counter = 2;
  while (taken.has(`${base}-${counter}`)) {
    counter += 1;
  }
  return `${base}-${counter}`;
}

productsRouter.get('/', async (c) => {
  const db = c.get('db');
  const list = await getAllProductsList(db);
  return c.json({ success: true, products: list });
});

productsRouter.get('/:slug', async (c) => {
  const rawSlug = c.req.param('slug');
  let decodedSlug = rawSlug;
  try {
    decodedSlug = decodeURIComponent(rawSlug);
  } catch {
    decodedSlug = rawSlug;
  }
  const db = c.get('db');
  const row = await db
    .select()
    .from(products)
    .where(
      or(
        eq(products.id, rawSlug),
        eq(products.slug, rawSlug),
        eq(products.id, decodedSlug),
        eq(products.slug, decodedSlug)
      )
    )
    .get();
  if (!row) {
    return c.json({ success: false, message: 'পণ্যটি খুঁজে পাওয়া যায়নি।' }, 404);
  }
  return c.json({ success: true, product: { ...mapProductRow(row), slug: row.slug } });
});

adminProductsRouter.post('/', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { product?: Product };
  const product = body?.product;
  if (!product || !product.id || !product.name) {
    return c.json({ success: false, message: 'পণ্যের নাম ও আইডি আবশ্যক।' }, 400);
  }

  const db = c.get('db');
  const now = new Date().toISOString();
  const [existing, { settings }] = await Promise.all([
    db.select().from(products).where(eq(products.id, product.id)).get(),
    getStoreAndPaymentSettings(db),
  ]);
  const storeName = settings?.storeName || 'Fashion Doniya BD';

  const desiredSlug = product.slug
    ? slugify(product.slug)
    : existing?.slug || slugify(product.nameEn || product.name) || product.id;
  const uniqueSlug = await resolveUniqueProductSlug(db, desiredSlug, product.id);

  const normalizedPrice = Math.max(0, Number(product.pricePerYard || 0));
  const normalizedDiscount =
    product.discountPrice != null ? Math.max(0, Number(product.discountPrice)) : undefined;

  const existingMapped = existing ? mapProductRow(existing) : undefined;
  const seo = computeProductSeo(
    {
      ...product,
      pricePerYard: normalizedPrice,
      discountPrice: normalizedDiscount,
      fabricWidth: product.fabricWidth || '3.5',
      category: product.category || 'কামিজ',
      fabricType: product.fabricType || '',
      color: product.color || '',
    },
    storeName,
    existingMapped
  );

  const record = {
    id: product.id,
    slug: uniqueSlug,
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
    pricePerYard: normalizedPrice,
    discountPrice: normalizedDiscount ?? null,
    stockYards: Math.max(0, Number(product.stockYards || 0)),
    minOrderQuantity: Math.max(0.25, Number(product.minOrderQuantity || 1)),
    stepYard: Math.max(0.25, Number(product.stepYard || 0.5)),
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
    seoTitle: seo.seoTitle,
    seoDescription: seo.seoDescription,
    seoKeywords: seo.seoKeywords,
    imageAlt: seo.imageAlt,
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

  const baseUrl = (c.env?.SITE_URL || new URL(c.req.url).origin).replace(/\/+$/, '');
  scheduleSearchEnginePing(c, c.env, baseUrl, [
    `/product/${encodeURIComponent(uniqueSlug)}`,
    '/shop',
    '/sitemap.xml',
  ]);

  const savedRow = await db.select().from(products).where(eq(products.id, product.id)).get();
  const allProducts = await getAllProductsList(db);
  return c.json({
    success: true,
    product: savedRow ? { ...mapProductRow(savedRow), slug: savedRow.slug } : product,
    products: allProducts,
  });
});

adminProductsRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) as { product?: Partial<Product> } & Partial<Product>;
  const updates = body?.product || body;
  const db = c.get('db');
  const [existing, { settings }] = await Promise.all([
    db.select().from(products).where(eq(products.id, id)).get(),
    getStoreAndPaymentSettings(db),
  ]);
  if (!existing) {
    return c.json({ success: false, message: 'পণ্যটি খুঁজে পাওয়া যায়নি।' }, 404);
  }

  const storeName = settings?.storeName || 'Fashion Doniya BD';
  const existingMapped = mapProductRow(existing);
  const merged: Product = { ...existingMapped, ...updates, id };
  const now = new Date().toISOString();

  const prevAutoSlug = slugify(existing.nameEn || existing.name);
  let desiredSlug = existing.slug;
  if (updates.slug && String(updates.slug).trim()) {
    desiredSlug = slugify(String(updates.slug));
  } else if (
    (updates.nameEn !== undefined && updates.nameEn !== existing.nameEn) ||
    (updates.name !== undefined && updates.name !== existing.name)
  ) {
    if (!existing.slug || existing.slug === prevAutoSlug) {
      desiredSlug = slugify(merged.nameEn || merged.name) || id;
    }
  }
  const uniqueSlug = await resolveUniqueProductSlug(db, desiredSlug, id);

  const nextPricePerYard = Math.max(0, Number(merged.pricePerYard));
  const nextDiscountPrice =
    merged.discountPrice != null ? Math.max(0, Number(merged.discountPrice)) : null;

  const seo = computeProductSeo(
    {
      ...merged,
      pricePerYard: nextPricePerYard,
      discountPrice: nextDiscountPrice ?? undefined,
    },
    storeName,
    existingMapped
  );

  await db
    .update(products)
    .set({
      slug: uniqueSlug,
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
      pricePerYard: nextPricePerYard,
      discountPrice: nextDiscountPrice,
      stockYards: Math.max(0, Number(merged.stockYards)),
      minOrderQuantity: Math.max(0.25, Number(merged.minOrderQuantity)),
      stepYard: Math.max(0.25, Number(merged.stepYard)),
      images: JSON.stringify(merged.images || []),
      patternType: merged.patternType,
      isFeatured: Boolean(merged.isFeatured),
      isBestSeller: Boolean(merged.isBestSeller),
      isNewArrival: Boolean(merged.isNewArrival),
      isActive: merged.isActive !== false,
      customMeasurementConfig: merged.customMeasurementConfig
        ? JSON.stringify(merged.customMeasurementConfig)
        : null,
      seoTitle: seo.seoTitle,
      seoDescription: seo.seoDescription,
      seoKeywords: seo.seoKeywords,
      imageAlt: seo.imageAlt,
      updatedAt: now,
    })
    .where(eq(products.id, id));

  if (
    existing.pricePerYard !== nextPricePerYard ||
    (existing.discountPrice ?? null) !== nextDiscountPrice
  ) {
    await db.insert(productPriceHistory).values({
      id: `pph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: id,
      pricePerYard: nextPricePerYard,
      discountPrice: nextDiscountPrice,
      recordedAt: now,
    });
  }

  await appendAdminLog(db, `পণ্য সম্পাদনা: ${merged.name}`, 'product', `SKU: ${merged.sku} আপডেট করা হয়েছে`);
  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  const baseUrl = (c.env?.SITE_URL || new URL(c.req.url).origin).replace(/\/+$/, '');
  scheduleSearchEnginePing(c, c.env, baseUrl, [
    `/product/${encodeURIComponent(uniqueSlug)}`,
    '/shop',
    '/sitemap.xml',
  ]);

  const savedRow = await db.select().from(products).where(eq(products.id, id)).get();
  const allProducts = await getAllProductsList(db);
  return c.json({
    success: true,
    product: savedRow ? { ...mapProductRow(savedRow), slug: savedRow.slug } : merged,
    products: allProducts,
  });
});

adminProductsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');
  const existing = await db.select().from(products).where(eq(products.id, id)).get();
  if (!existing) {
    return c.json({ success: false, message: 'পণ্যটি খুঁজে পাওয়া যায়নি।' }, 404);
  }
  await db.delete(products).where(eq(products.id, id));
  await appendAdminLog(
    db,
    `পণ্য মুছে ফেলা হয়েছে: ${existing.name}`,
    'product',
    `SKU: ${existing.sku} ডাটাবেস থেকে মুছে ফেলা হয়েছে`
  );
  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  const baseUrl = (c.env?.SITE_URL || new URL(c.req.url).origin).replace(/\/+$/, '');
  scheduleSearchEnginePing(c, c.env, baseUrl, ['/shop', '/sitemap.xml']);

  const allProducts = await getAllProductsList(db);
  return c.json({ success: true, products: allProducts });
});
