import { eq, or } from 'drizzle-orm';
import type { Bindings } from '../api/types';
import { createDb } from '../api/utils/db-factory';
import { ensureSeeded } from '../api/utils/seed';
import { categories } from '../../backend/server/db/schemas/index';
import {
  getAllProductsList,
  getStoreAndPaymentSettings,
  mapCategoryRow,
} from '../api/utils/mappers';
import { escapeHtml } from '../api/utils/helpers';
import { injectSeoIntoHtml } from '../api/utils/edge-seo';

export const onRequestGet: PagesFunction<Bindings> = async (context) => {
  const { request, env, params } = context;
  const slugParts = Array.isArray(params.slug)
    ? params.slug
    : params.slug
      ? [String(params.slug)]
      : [];
  const slug = slugParts.join('/').trim();

  const nextResponse = await context.next();
  const baseHtml = await nextResponse.text();
  const url = new URL(request.url);
  const baseUrl = (env?.SITE_URL || url.origin).replace(/\/$/, '');

  if (!slug) {
    return new Response(baseHtml, {
      status: nextResponse.status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const db = createDb(env);
  await ensureSeeded(db, env);

  const [catRow, allProducts, { settings }] = await Promise.all([
    db.select().from(categories).where(or(eq(categories.slug, slug), eq(categories.id, slug))).get(),
    getAllProductsList(db),
    getStoreAndPaymentSettings(db),
  ]);

  const storeName = settings?.storeName || 'Fashion Doniya BD';

  if (!catRow || catRow.isActive === false) {
    const html404 = injectSeoIntoHtml(baseHtml, {
      title: `ক্যাটাগরি পাওয়া যায়নি | ${storeName}`,
      description: 'দুঃখিত, এই ক্যাটাগরিটি খুঁজে পাওয়া যায়নি।',
      canonicalUrl: `${baseUrl}/category/${encodeURIComponent(slug)}`,
      robots: 'noindex, nofollow',
      rootHtml: `<main style="padding:3rem;text-align:center;font-family:sans-serif;"><h1>404 — ক্যাটাগরি পাওয়া যায়নি</h1><a href="/shop">সব কালেকশন দেখুন</a></main>`,
    });
    return new Response(html404, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const category = mapCategoryRow(catRow);
  const matchingProducts = allProducts.filter(
    (p) => p.isActive !== false && p.category === category.name
  );

  const canonicalUrl = `${baseUrl}/category/${encodeURIComponent(category.slug)}`;
  const title = `${category.name} গজ কাপড় কালেকশন | ${storeName}`;
  const description =
    category.description || `${category.name} তৈরির জন্য প্রিমিয়াম ২.৫ ও ৩.৫ বহর গজ কাপড় সংগ্রহ।`;

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: canonicalUrl,
    numberOfItems: matchingProducts.length,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'হোম', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: category.name, item: canonicalUrl },
    ],
  };

  const itemsListHtml = matchingProducts
    .slice(0, 12)
    .map(
      (p) =>
        `<li><a href="/product/${escapeHtml(p.id)}">${escapeHtml(p.name)} — ৳${p.discountPrice || p.pricePerYard}/গজ</a></li>`
    )
    .join('');

  const semanticRoot = `<section data-edge-seo="category" style="max-width:960px;margin:2rem auto;padding:1.5rem;font-family:sans-serif;">
    <h1>${escapeHtml(category.name)}</h1>
    <p>${escapeHtml(description)}</p>
    <ul>${itemsListHtml}</ul>
  </section>`;

  const injected = injectSeoIntoHtml(baseHtml, {
    title,
    description,
    canonicalUrl,
    ogType: 'website',
    imageUrl: `${baseUrl}/assets/fabric-banner-3-5.png`,
    jsonLd: [collectionJsonLd, breadcrumbJsonLd],
    rootHtml: semanticRoot,
  });

  return new Response(injected, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
