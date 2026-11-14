import { eq, or } from 'drizzle-orm';
import type { Bindings } from '../api/types';
import { createDb } from '../api/utils/db-factory';
import { ensureSeeded } from '../api/utils/seed';
import { products } from '../../backend/server/db/schemas/index';
import { getStoreAndPaymentSettings, mapProductRow } from '../api/utils/mappers';
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

  const [row, { settings }] = await Promise.all([
    db.select().from(products).where(or(eq(products.id, slug), eq(products.slug, slug))).get(),
    getStoreAndPaymentSettings(db),
  ]);

  const storeName = settings?.storeName || 'Fashion Doniya BD';

  if (!row || row.isActive === false) {
    const html404 = injectSeoIntoHtml(baseHtml, {
      title: `পণ্য পাওয়া যায়নি | ${storeName}`,
      description: 'দুঃখিত, আপনার অনুসন্ধানকৃত কাপড় বা পণ্যটি খুঁজে পাওয়া যায়নি।',
      canonicalUrl: `${baseUrl}/product/${encodeURIComponent(slug)}`,
      robots: 'noindex, nofollow',
      rootHtml: `<main style="padding:3rem;text-align:center;font-family:sans-serif;"><h1>404 — পণ্য পাওয়া যায়নি</h1><p>আপনার অনুরোধকৃত পণ্যটি বর্তমানে স্টকে নেই বা সরানো হয়েছে।</p><a href="/shop">সব কাপড় দেখুন</a></main>`,
    });
    return new Response(html404, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const product = mapProductRow(row);
  const effectivePrice =
    product.discountPrice && product.discountPrice < product.pricePerYard
      ? product.discountPrice
      : product.pricePerYard;

  const firstImg = product.images?.[0];
  const resolvedImage =
    firstImg && !firstImg.startsWith('data:')
      ? firstImg.startsWith('http')
        ? firstImg
        : `${baseUrl}${firstImg.startsWith('/') ? '' : '/'}${firstImg}`
      : `${baseUrl}/assets/fabric-banner-3-5.png`;

  const canonicalUrl = `${baseUrl}/product/${encodeURIComponent(product.id)}`;
  const title = product.seoTitle || `${product.name} | ${storeName}`;
  const description = product.seoDescription || product.description || product.name;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    sku: product.sku,
    image: [resolvedImage],
    brand: { '@type': 'Brand', name: storeName },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'BDT',
      price: effectivePrice,
      availability:
        product.stockYards > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'হোম', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: product.category, item: `${baseUrl}/shop` },
      { '@type': 'ListItem', position: 3, name: product.name, item: canonicalUrl },
    ],
  };

  const semanticRoot = `<article data-edge-seo="product" style="max-width:960px;margin:2rem auto;padding:1.5rem;font-family:sans-serif;">
    <h1>${escapeHtml(product.name)}</h1>
    <p>${escapeHtml(description)}</p>
    <p><strong>মূল্য:</strong> ৳${effectivePrice} / গজ · <strong>বহর:</strong> ${escapeHtml(product.fabricWidth)} · <strong>ক্যাটাগরি:</strong> ${escapeHtml(product.category)}</p>
    <p><strong>SKU:</strong> ${escapeHtml(product.sku)} · <strong>স্টক:</strong> ${product.stockYards > 0 ? 'ইন স্টক' : 'স্টক শেষ'}</p>
  </article>`;

  const injected = injectSeoIntoHtml(baseHtml, {
    title,
    description,
    canonicalUrl,
    ogType: 'product',
    imageUrl: resolvedImage,
    price: effectivePrice,
    currency: 'BDT',
    jsonLd: [productJsonLd, breadcrumbJsonLd],
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
