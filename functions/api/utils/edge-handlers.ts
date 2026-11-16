import { asc, eq, or } from 'drizzle-orm';
import type { Bindings } from '../types';
import { categories, products } from '../../../backend/server/db/schemas/index';
import type { FaqItem, StoreSettings } from '../../../frontend/src/types/index';
import { DEFAULT_STORE_ORIGIN } from '../config/cloudflare-env';
import { createDb } from './db-factory';
import { ensureSeeded } from './seed';
import {
  getAllCategoriesList,
  getStoreAndPaymentSettings,
  mapCategoryRow,
  mapProductRow,
} from './mappers';
import { escapeHtml, slugify } from './helpers';
import {
  computeProductSeo,
  injectSeoIntoHtml,
  resolveProductImageUrl,
} from './edge-seo';

const MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  ico: 'image/x-icon',
  pdf: 'application/pdf',
  txt: 'text/plain; charset=utf-8',
  json: 'application/json',
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
};

export function applyEdgeSecurityHeaders(
  headersInit: HeadersInit | Record<string, string>,
  isHtml = false
): Headers {
  const headers = new Headers(headersInit);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  if (isHtml) {
    headers.set(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'self';"
    );
  }
  return headers;
}

const PRIVATE_ROUTE_PREFIXES = [
  '/admin',
  '/sysadm',
  '/account',
  '/cart',
  '/checkout',
  '/wishlist',
  '/order-confirmation',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

function resolveBaseUrl(env?: Bindings, originOverride?: string): string {
  return String(originOverride || env?.SITE_URL || DEFAULT_STORE_ORIGIN).replace(/\/+$/, '');
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveOgImage(rawImage: string | undefined, baseUrl: string): string {
  const clean = String(rawImage || '').trim();
  if (!clean || clean === '/assets/banners/hero_slide_1.png') {
    return `${baseUrl}/assets/fabric-banner-3-5.png`;
  }
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  return `${baseUrl}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

function isPrivateRoutePath(pathname: string): boolean {
  const normalized = pathname.toLowerCase();
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

function sanitizeMediaKey(rawKey: string): string | null {
  let decoded = rawKey;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      return null;
    }
  }

  const trimmed = decoded.replace(/^\/+/, '');
  if (!trimmed) return null;
  if (
    trimmed.includes('..') ||
    trimmed.includes('\\') ||
    trimmed.includes('//') ||
    trimmed.includes('\0') ||
    /[\x00-\x1f\x7f]/.test(trimmed)
  ) {
    return null;
  }
  return trimmed;
}

export async function serveR2MediaRequest(
  request: Request,
  env: Bindings,
  rawKey: string
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const cleanKey = sanitizeMediaKey(rawKey);
  if (!cleanKey) {
    return new Response('Invalid media key', { status: 400 });
  }

  if (!env?.MEDIA_BUCKET) {
    return new Response('Media bucket not configured', { status: 404 });
  }

  const object = await env.MEDIA_BUCKET.get(cleanKey);
  if (!object) {
    return new Response('Not Found', { status: 404 });
  }

  const ifNoneMatch = request.headers.get('if-none-match');
  if (ifNoneMatch && object.httpEtag && ifNoneMatch === object.httpEtag) {
    return new Response(null, { status: 304 });
  }

  const ext = cleanKey.split('.').pop()?.toLowerCase() || '';
  const contentType =
    object.httpMetadata?.contentType || MIME_MAP[ext] || 'application/octet-stream';

  const headers = new Headers();
  headers.set('Content-Type', contentType);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  if (object.httpEtag) {
    headers.set('ETag', object.httpEtag);
  }

  // Sandbox SVGs and force HTML downloads to prevent stored XSS
  if (ext === 'svg' || contentType.includes('svg')) {
    headers.set(
      'Content-Security-Policy',
      "default-src 'none'; sandbox; style-src 'unsafe-inline'"
    );
  } else if (ext === 'html' || ext === 'htm' || contentType.includes('text/html')) {
    headers.set('Content-Disposition', 'attachment');
    headers.set('Content-Security-Policy', "default-src 'none'; sandbox");
  }

  applyEdgeSecurityHeaders(headers, false);

  if (request.method === 'HEAD') {
    return new Response(null, { status: 200, headers });
  }

  return new Response(object.body, { status: 200, headers });
}

export async function buildSitemapXml(env: Bindings, originOverride?: string): Promise<string> {
  const db = createDb(env);
  await ensureSeeded(db, env);
  const [productRows, categoryRows] = await Promise.all([
    db.select().from(products),
    db.select().from(categories).orderBy(asc(categories.order)),
  ]);

  const baseUrl = resolveBaseUrl(env, originOverride);
  const today = new Date().toISOString().split('T')[0];

  const staticPaths = [
    '/',
    '/shop',
    '/fabric/3.5-bahar',
    '/fabric/2.5-bahar',
    '/calculator',
    '/custom-design',
    '/fabric-to-outfit',
    '/order-tracking',
    '/about',
    '/contact',
    '/faq',
    '/measurement-guide',
    '/delivery-policy',
    '/return-policy',
    '/privacy-policy',
    '/terms',
  ];

  const urls: string[] = staticPaths.map(
    (p) => `  <url>
    <loc>${escapeHtml(`${baseUrl}${p}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${p === '/' ? '1.0' : '0.8'}</priority>
  </url>`
  );

  for (const cat of categoryRows.filter((c) => c.isActive !== false)) {
    const lastmod = (cat.updatedAt || cat.createdAt || today).split('T')[0];
    urls.push(`  <url>
    <loc>${escapeHtml(`${baseUrl}/category/${encodeURIComponent(cat.slug)}`)}</loc>
    <lastmod>${escapeHtml(lastmod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  for (const row of productRows.filter((item) => item.isActive !== false)) {
    const p = mapProductRow(row);
    const prodSlug = row.slug || p.id;
    const resolvedImage = resolveProductImageUrl(p.images?.[0], p.id, baseUrl);
    const lastmod = (row.updatedAt || row.createdAt || today).split('T')[0];

    urls.push(`  <url>
    <loc>${escapeHtml(`${baseUrl}/product/${encodeURIComponent(prodSlug)}`)}</loc>
    <lastmod>${escapeHtml(lastmod)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <image:image>
      <image:loc>${escapeHtml(resolvedImage)}</image:loc>
      <image:title>${escapeHtml(p.name)}</image:title>
      <image:caption>${escapeHtml(p.imageAlt || p.name)}</image:caption>
    </image:image>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;
}

export async function buildMerchantFeedXml(env: Bindings, originOverride?: string): Promise<string> {
  const db = createDb(env);
  await ensureSeeded(db, env);
  const [productRows, { settings }] = await Promise.all([
    db.select().from(products),
    getStoreAndPaymentSettings(db),
  ]);

  const baseUrl = resolveBaseUrl(env, originOverride);
  const storeName = settings?.storeName || 'Fashion Doniya BD';

  const items = productRows
    .filter((row) => row.isActive !== false)
    .map((row) => {
      const p = mapProductRow(row);
      const prodSlug = row.slug || p.id;
      const hasDiscount = Boolean(p.discountPrice && p.discountPrice < p.pricePerYard);
      const imageLink = resolveProductImageUrl(p.images?.[0], p.id, baseUrl);
      const descText = p.seoDescription || p.description || p.name;

      return `    <item>
      <g:id>${escapeHtml(p.id)}</g:id>
      <g:title>${escapeHtml(p.name)}</g:title>
      <g:description>${escapeHtml(descText)}</g:description>
      <g:link>${escapeHtml(`${baseUrl}/product/${encodeURIComponent(prodSlug)}`)}</g:link>
      <g:image_link>${escapeHtml(imageLink)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${p.stockYards > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${Number(p.pricePerYard).toFixed(2)} BDT</g:price>${
        hasDiscount
          ? `\n      <g:sale_price>${Number(p.discountPrice).toFixed(2)} BDT</g:sale_price>`
          : ''
      }
      <g:brand>${escapeHtml(storeName)}</g:brand>
      <g:product_type>${escapeHtml(p.category)}</g:product_type>
      <g:mpn>${escapeHtml(p.sku)}</g:mpn>
    </item>`;
    });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeHtml(storeName)} Product Feed</title>
    <link>${escapeHtml(baseUrl)}</link>
    <description>Premium Unstitched Yard Fabrics — 2.5 &amp; 3.5 Bahar Collections</description>
${items.join('\n')}
  </channel>
</rss>`;
}

export async function renderProductSsrResponse(
  env: Bindings,
  requestUrl: string,
  slug: string,
  baseHtml: string
): Promise<Response> {
  const url = new URL(requestUrl);
  const baseUrl = resolveBaseUrl(env, url.origin);
  const decodedSlug = safeDecode(slug).trim();

  const db = createDb(env);
  await ensureSeeded(db, env);

  const [row, allCategories, { settings }] = await Promise.all([
    db
      .select()
      .from(products)
      .where(
        or(
          eq(products.slug, slug),
          eq(products.id, slug),
          eq(products.slug, decodedSlug),
          eq(products.id, decodedSlug)
        )
      )
      .get(),
    getAllCategoriesList(db),
    getStoreAndPaymentSettings(db),
  ]);

  const storeName = settings?.storeName || 'Fashion Doniya BD';

  if (!row || row.isActive === false) {
    const html404 = injectSeoIntoHtml(baseHtml, {
      title: `পণ্য পাওয়া যায়নি | ${storeName}`,
      description: 'দুঃখিত, আপনার অনুসন্ধানকৃত কাপড় বা পণ্যটি খুঁজে পাওয়া যায়নি।',
      canonicalUrl: `${baseUrl}/product/${encodeURIComponent(decodedSlug || slug)}`,
      siteName: storeName,
      robots: 'noindex, nofollow',
      stripStaticJsonLd: true,
      rootHtml: `<main data-edge-seo="product-404" style="max-width:720px;margin:3rem auto;padding:1.5rem;text-align:center;font-family:sans-serif;"><h1>৪০৪ — পণ্যটি পাওয়া যায়নি</h1><p>আপনার অনুসন্ধানকৃত কাপড় বা পণ্যটি বর্তমানে স্টকে নেই অথবা সরানো হয়েছে।</p><p><a href="/shop">সব গজ কাপড় দেখুন</a></p></main>`,
    });
    return new Response(html404, {
      status: 404,
      headers: applyEdgeSecurityHeaders(
        {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store',
        },
        true
      ),
    });
  }

  const product = mapProductRow(row);
  const prodSlug = row.slug || product.id;
  const canonicalUrl = `${baseUrl}/product/${encodeURIComponent(prodSlug)}`;
  const effectivePrice =
    product.discountPrice && product.discountPrice < product.pricePerYard
      ? product.discountPrice
      : product.pricePerYard;

  const resolvedImages = (
    product.images && product.images.length > 0 ? product.images : [undefined]
  ).map((img) => resolveProductImageUrl(img, product.id, baseUrl));
  const primaryImage = resolvedImages[0];

  const autoSeo = computeProductSeo(product, storeName);
  const title = product.seoTitle || autoSeo.seoTitle;
  const description = product.seoDescription || autoSeo.seoDescription;
  const keywords = product.seoKeywords || autoSeo.seoKeywords;
  const imageAlt = product.imageAlt || autoSeo.imageAlt;

  const matchedCat = allCategories.find((c) => c.name === product.category);
  const categoryUrl = matchedCat
    ? `${baseUrl}/category/${encodeURIComponent(matchedCat.slug)}`
    : `${baseUrl}/shop`;

  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    sku: product.sku,
    mpn: product.sku,
    image: resolvedImages,
    brand: { '@type': 'Brand', name: storeName },
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'BDT',
      price: Number(effectivePrice).toFixed(2),
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.stockYards > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: storeName,
        url: `${baseUrl}/`,
      },
    },
  };

  if (product.reviewCount && product.reviewCount > 0) {
    productJsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.rating || 5).toFixed(1),
      reviewCount: Number(product.reviewCount),
    };
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'হোম', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: product.category, item: categoryUrl },
      { '@type': 'ListItem', position: 3, name: product.name, item: canonicalUrl },
    ],
  };

  const semanticRoot = `<main data-edge-seo="product" style="max-width:960px;margin:2rem auto;padding:1.5rem;font-family:sans-serif;">
    <nav aria-label="Breadcrumb"><a href="/">হোম</a> &rsaquo; <a href="${escapeHtml(categoryUrl)}">${escapeHtml(product.category)}</a> &rsaquo; <span>${escapeHtml(product.name)}</span></nav>
    <article>
      <h1>${escapeHtml(product.name)}</h1>
      <img src="${escapeHtml(primaryImage)}" alt="${escapeHtml(imageAlt)}" width="640" height="640" style="max-width:100%;height:auto;" />
      <p>${escapeHtml(description)}</p>
      <p><strong>মূল্য:</strong> ৳${effectivePrice} / গজ · <strong>বহর:</strong> ${escapeHtml(product.fabricWidth)} · <strong>ক্যাটাগরি:</strong> ${escapeHtml(product.category)}</p>
      <p><strong>ধরন:</strong> ${escapeHtml(product.fabricType)} · <strong>রঙ:</strong> ${escapeHtml(product.color)}</p>
      <p><strong>SKU:</strong> ${escapeHtml(product.sku)} · <strong>স্টক:</strong> ${product.stockYards > 0 ? 'ইন স্টক' : 'স্টক শেষ'}</p>
    </article>
  </main>`;

  const injected = injectSeoIntoHtml(baseHtml, {
    title,
    description,
    keywords,
    canonicalUrl,
    siteName: storeName,
    ogType: 'product',
    imageUrl: primaryImage,
    imageAlt,
    price: effectivePrice,
    currency: 'BDT',
    availability: product.stockYards > 0 ? 'in stock' : 'out of stock',
    jsonLd: [productJsonLd, breadcrumbJsonLd],
    stripStaticJsonLd: true,
    rootHtml: semanticRoot,
  });

  return new Response(injected, {
    status: 200,
    headers: applyEdgeSecurityHeaders(
      {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
        Vary: 'Host, Accept-Encoding',
      },
      true
    ),
  });
}

export async function renderCategorySsrResponse(
  env: Bindings,
  requestUrl: string,
  slug: string,
  baseHtml: string
): Promise<Response> {
  const url = new URL(requestUrl);
  const baseUrl = resolveBaseUrl(env, url.origin);
  const decodedSlug = safeDecode(slug).trim();

  const db = createDb(env);
  await ensureSeeded(db, env);

  const [catRow, productRows, { settings }] = await Promise.all([
    decodedSlug === 'all'
      ? Promise.resolve(null)
      : db
          .select()
          .from(categories)
          .where(
            or(
              eq(categories.slug, slug),
              eq(categories.slug, decodedSlug),
              eq(categories.id, slug),
              eq(categories.name, decodedSlug)
            )
          )
          .get(),
    db.select().from(products),
    getStoreAndPaymentSettings(db),
  ]);

  const storeName = settings?.storeName || 'Fashion Doniya BD';
  const isAll = decodedSlug === 'all';

  if (!isAll && (!catRow || catRow.isActive === false)) {
    const html404 = injectSeoIntoHtml(baseHtml, {
      title: `ক্যাটাগরি পাওয়া যায়নি | ${storeName}`,
      description: 'দুঃখিত, এই ক্যাটাগরিটি খুঁজে পাওয়া যায়নি।',
      canonicalUrl: `${baseUrl}/category/${encodeURIComponent(decodedSlug || slug)}`,
      siteName: storeName,
      robots: 'noindex, nofollow',
      stripStaticJsonLd: true,
      rootHtml: `<main data-edge-seo="category-404" style="max-width:720px;margin:3rem auto;padding:1.5rem;text-align:center;font-family:sans-serif;"><h1>৪০৪ — ক্যাটাগরি পাওয়া যায়নি</h1><p><a href="/shop">সব কালেকশন দেখুন</a></p></main>`,
    });
    return new Response(html404, {
      status: 404,
      headers: applyEdgeSecurityHeaders(
        {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store',
        },
        true
      ),
    });
  }

  const category = catRow ? mapCategoryRow(catRow) : null;
  const categoryName = isAll ? 'সকল গজ কাপড় কালেকশন' : category!.name;
  const categorySlug = isAll ? 'all' : category!.slug;

  const activeRows = productRows.filter((row) => row.isActive !== false);
  const matchingRows = isAll
    ? activeRows
    : activeRows.filter((row) => row.category === categoryName);

  const canonicalUrl = `${baseUrl}/category/${encodeURIComponent(categorySlug)}`;
  const title = isAll
    ? `সকল প্রিমিয়াম গজ কাপড় কালেকশন | ${storeName}`
    : `${categoryName} গজ কাপড় কালেকশন | ${storeName}`;
  const description = isAll
    ? `কামিজ, শর্ট কামিজ, লং কটি, গাউন ও শাড়ির জন্য বাছাইকৃত প্রিমিয়াম ২.৫ ও ৩.৫ বহর গজ কাপড়ের সম্ভার — ${storeName}।`
    : category?.description ||
      `${categoryName} তৈরির জন্য প্রিমিয়াম ২.৫ ও ৩.৫ বহর গজ কাপড় সংগ্রহ — ${storeName}।`;
  const keywords = `${categoryName}, গজ কাপড়, ২.৫ বহর, ৩.৫ বহর, ${storeName}`;

  const firstProductRow = matchingRows[0];
  const categoryImage = firstProductRow
    ? resolveProductImageUrl(
        mapProductRow(firstProductRow).images?.[0],
        firstProductRow.id,
        baseUrl
      )
    : category?.imageUrl
      ? resolveProductImageUrl(category.imageUrl, category.id, baseUrl)
      : `${baseUrl}/assets/fabric-banner-3-5.png`;

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: canonicalUrl,
    numberOfItems: matchingRows.length,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: matchingRows.length,
      itemListElement: matchingRows.slice(0, 24).map((row, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${baseUrl}/product/${encodeURIComponent(row.slug || row.id)}`,
        name: row.name,
      })),
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'হোম', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: categoryName, item: canonicalUrl },
    ],
  };

  const itemsListHtml = matchingRows
    .slice(0, 24)
    .map((row) => {
      const p = mapProductRow(row);
      const price = p.discountPrice && p.discountPrice < p.pricePerYard ? p.discountPrice : p.pricePerYard;
      const prodSlug = row.slug || p.id;
      return `<li><a href="/product/${escapeHtml(encodeURIComponent(prodSlug))}">${escapeHtml(p.name)} — ৳${price}/গজ (${escapeHtml(p.fabricWidth)} বহর)</a></li>`;
    })
    .join('');

  const semanticRoot = `<main data-edge-seo="category" style="max-width:960px;margin:2rem auto;padding:1.5rem;font-family:sans-serif;">
    <nav aria-label="Breadcrumb"><a href="/">হোম</a> &rsaquo; <a href="/shop">সকল কাপড়</a> &rsaquo; <span>${escapeHtml(categoryName)}</span></nav>
    <h1>${escapeHtml(categoryName)}</h1>
    <p>${escapeHtml(description)}</p>
    <ul>${itemsListHtml}</ul>
  </main>`;

  const injected = injectSeoIntoHtml(baseHtml, {
    title,
    description,
    keywords,
    canonicalUrl,
    siteName: storeName,
    ogType: 'website',
    imageUrl: categoryImage,
    imageAlt: `${categoryName} | ${storeName}`,
    jsonLd: [collectionJsonLd, breadcrumbJsonLd],
    stripStaticJsonLd: true,
    rootHtml: semanticRoot,
  });

  return new Response(injected, {
    status: 200,
    headers: applyEdgeSecurityHeaders(
      {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
        Vary: 'Host, Accept-Encoding',
      },
      true
    ),
  });
}

function buildStorefrontGraphSchemas(
  baseUrl: string,
  settings: StoreSettings,
  includeFaqPage: boolean
): unknown[] {
  const storeName = settings?.storeName || 'Fashion Doniya BD';
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: storeName,
      url: `${baseUrl}/`,
      logo: `${baseUrl}/assets/fabric-roll-icon.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: settings?.supportPhone || '+8801712-345678',
        contactType: 'customer service',
        areaServed: 'BD',
        availableLanguage: ['bn', 'en'],
      },
    },
    {
      '@type': 'OnlineStore',
      '@id': `${baseUrl}/#store`,
      name: storeName,
      url: `${baseUrl}/`,
      currenciesAccepted: 'BDT',
      paymentAccepted: 'bKash, Nagad, Cash on Delivery',
    },
    {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
      url: `${baseUrl}/`,
      name: storeName,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/shop?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];

  if (includeFaqPage) {
    const activeFaqs: FaqItem[] = (settings?.contentConfig?.faqs || []).filter(
      (f) => f.isActive !== false && (f.q || f.question) && (f.a || f.answer)
    );
    const faqEntities =
      activeFaqs.length > 0
        ? activeFaqs.map((f) => ({
            '@type': 'Question',
            name: f.q || f.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: f.a || f.answer,
            },
          }))
        : [
            {
              '@type': 'Question',
              name: '২.৫ বহর ও ৩.৫ বহর কাপড়ের মধ্যে পার্থক্য কী?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '২.৫ বহর কাপড়ের প্রস্থ সাধারণত ৩৬–৪৪ ইঞ্চি এবং ৩.৫ বহর কাপড়ের প্রস্থ ৫৬–৬০ ইঞ্চি, যাতে কম গজে ফুল-ঘেরের পোশাক তৈরি করা যায়।',
              },
            },
            {
              '@type': 'Question',
              name: 'সর্বনিম্ন কত গজ কাপড় অর্ডার করা যায়?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: `${storeName} থেকে ১ গজ থেকে শুরু করে ০.২৫ বা ০.৫ গজ ইনক্রিমেন্টে কাস্টম কাটিং অর্ডার করা যায়।`,
              },
            },
          ];

    graph.push({
      '@type': 'FAQPage',
      '@id': `${baseUrl}/#faq`,
      mainEntity: faqEntities,
    });
  }

  return [{ '@context': 'https://schema.org', '@graph': graph }];
}

export async function renderStorefrontSsrResponse(
  env: Bindings,
  requestUrl: string,
  baseHtml: string
): Promise<Response> {
  const url = new URL(requestUrl);
  const baseUrl = resolveBaseUrl(env, url.origin);
  const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');

  const db = createDb(env);
  await ensureSeeded(db, env);
  const [{ settings }, productRows, categoryRows] = await Promise.all([
    getStoreAndPaymentSettings(db),
    db.select().from(products),
    getAllCategoriesList(db),
  ]);

  const storeName = settings?.storeName || 'Fashion Doniya BD';
  const seoConfig = settings?.seoConfig;
  const pages = seoConfig?.pages || {};
  const defaultOgImage = resolveOgImage(seoConfig?.ogImageUrl || seoConfig?.ogImage, baseUrl);
  const canonicalUrl = `${baseUrl}${pathname === '/' ? '/' : pathname}`;

  // Private / transactional / auth routes -> noindex, nofollow
  if (isPrivateRoutePath(pathname)) {
    const privateLabelMap: Record<string, string> = {
      '/admin': 'অ্যাডমিন প্যানেল',
      '/sysadm': 'সিস্টেম অ্যাডমিন',
      '/account': 'আমার অ্যাকাউন্ট',
      '/cart': 'শপিং কার্ট',
      '/checkout': 'চেকআউট',
      '/wishlist': 'উইশলিস্ট',
      '/order-confirmation': 'অর্ডার কনফার্মেশন',
      '/login': 'লগইন',
      '/register': 'রেজিস্ট্রেশন',
      '/forgot-password': 'পাসওয়ার্ড রিসেট',
      '/reset-password': 'পাসওয়ার্ড পরিবর্তন',
    };
    const matchedPrefix =
      PRIVATE_ROUTE_PREFIXES.find(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      ) || '/account';
    const label = privateLabelMap[matchedPrefix] || storeName;

    const privateHtml = injectSeoIntoHtml(baseHtml, {
      title: `${label} | ${storeName}`,
      description: `${storeName} — ${label}`,
      canonicalUrl,
      siteName: storeName,
      imageUrl: defaultOgImage,
      robots: 'noindex, nofollow',
      stripStaticJsonLd: true,
    });

    return new Response(privateHtml, {
      status: 200,
      headers: applyEdgeSecurityHeaders(
        {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow',
          'Cache-Control': 'no-store',
        },
        true
      ),
    });
  }

  // Public storefront routes
  let pageKey = 'home';
  let title = pages.home?.title || seoConfig?.defaultTitle || `${storeName} — গজ হিসেবে প্রিমিয়াম ফ্যাব্রিক স্টোর`;
  let description =
    pages.home?.description ||
    seoConfig?.defaultDescription ||
    'প্রিমিয়াম ২.৫ ও ৩.৫ বহর গজ কাপড় সংগ্রহ ও স্মার্ট গজ ক্যালকুলেটর।';
  let keywords = pages.home?.keywords || seoConfig?.defaultKeywords || '';
  let imageUrl = resolveOgImage(pages.home?.ogImage, baseUrl) || defaultOgImage;
  let heading = settings?.heroTitle || storeName;
  let includeFaq = pathname === '/' || pathname === '/faq';

  const activeProducts = productRows.filter((r) => r.isActive !== false);
  const activeCategories = categoryRows.filter((c) => c.isActive !== false);

  if (pathname === '/shop') {
    pageKey = 'shop';
    const cfg = pages.shop;
    title = cfg?.title || `সকল প্রিমিয়াম গজ কাপড় কালেকশন | ${storeName}`;
    description = cfg?.description || description;
    keywords = cfg?.keywords || keywords;
    imageUrl = cfg?.ogImage ? resolveOgImage(cfg.ogImage, baseUrl) : defaultOgImage;
    heading = 'সকল প্রিমিয়াম গজ কাপড় কালেকশন';
  } else if (pathname === '/shop-3-5' || pathname === '/fabric/3.5-bahar') {
    pageKey = 'shop-3-5';
    const cfg = pages['shop-3-5'];
    title = cfg?.title || `৩.৫ বহর (৫৬-৬০ ইঞ্চি) প্রিমিয়াম গজ কাপড় | ${storeName}`;
    description =
      cfg?.description ||
      'বড় বহরের জামদানি, ব্রাইডাল অরগানজা, সিল্ক ও সুতি গজ কাপড় — কম গজে পূর্ণাঙ্গ পোশাক তৈরি করুন।';
    keywords = cfg?.keywords || keywords;
    imageUrl = `${baseUrl}/assets/fabric-banner-3-5.png`;
    heading = '৩.৫ বহর (৫৬–৬০ ইঞ্চি) প্রিমিয়াম গজ কাপড়';
  } else if (pathname === '/shop-2-5' || pathname === '/fabric/2.5-bahar') {
    pageKey = 'shop-2-5';
    const cfg = pages['shop-2-5'];
    title = cfg?.title || `২.৫ বহর (৩৬-৪৪ ইঞ্চি) স্ট্যান্ডার্ড গজ কাপড় | ${storeName}`;
    description =
      cfg?.description ||
      'খাঁটি সুতি হ্যান্ড-ব্লক, নকশি কাঁথা, লিনেন ও জ্যাকার্ড ২.৫ বহরের গজ কাপড়।';
    keywords = cfg?.keywords || keywords;
    imageUrl = `${baseUrl}/assets/fabric-banner-2-5.png`;
    heading = '২.৫ বহর (৩৬–৪৪ ইঞ্চি) স্ট্যান্ডার্ড গজ কাপড়';
  } else if (pathname.startsWith('/fabric/')) {
    const parts = pathname.replace(/^\/fabric\//, '').split('/').filter(Boolean);
    const widthSlug = parts[0] || '';
    const catSlug = parts[1] ? safeDecode(parts[1]) : '';
    const widthLabel = widthSlug.startsWith('2.5') ? '২.৫ বহর' : '৩.৫ বহর';
    const matchedCat = activeCategories.find(
      (c) => c.slug === catSlug || c.name === catSlug || slugify(c.name) === catSlug
    );
    const catLabel = matchedCat?.name || catSlug || 'কালেকশন';
    title = `${catLabel} (${widthLabel}) গজ কাপড় | ${storeName}`;
    description = `${widthLabel} ${catLabel} তৈরির প্রিমিয়াম আনস্টিচড গজ কাপড় সংগ্রহ — ${storeName}।`;
    keywords = `${catLabel}, ${widthLabel}, গজ কাপড়, ${storeName}`;
    imageUrl = widthSlug.startsWith('2.5')
      ? `${baseUrl}/assets/fabric-banner-2-5.png`
      : `${baseUrl}/assets/fabric-banner-3-5.png`;
    heading = `${catLabel} (${widthLabel})`;
  } else if (pathname === '/calculator') {
    pageKey = 'calculator';
    const cfg = pages.calculator;
    title = cfg?.title || `স্মার্ট গজ ক্যালকুলেটর | ${storeName}`;
    description =
      cfg?.description ||
      'পোশাকের ধরন, বহর ও শরীরের মাপ অনুযায়ী ঠিক কত গজ কাপড় লাগবে তা মুহূর্তেই হিসাব করুন।';
    keywords = cfg?.keywords || keywords;
    heading = 'স্মার্ট গজ ক্যালকুলেটর';
  } else if (pathname === '/custom-design' || pathname === '/fabric-to-outfit') {
    pageKey = 'custom-design';
    const cfg = pages['custom-design'] || pages['fabric-to-outfit'];
    title = cfg?.title || `কাস্টম ডিজাইন ও আউটফিট প্রিভিউ | ${storeName}`;
    description =
      cfg?.description ||
      'আপনার নিজের মাপ ও পছন্দের ডিজাইন অনুযায়ী কাস্টম গজ কাপড় ও আউটফিট প্রিভিউ অর্ডার করুন।';
    keywords = cfg?.keywords || keywords;
    heading = 'কাস্টম ডিজাইন স্টুডিও';
  } else if (pathname === '/order-tracking') {
    pageKey = 'order-tracking';
    const cfg = pages['order-tracking'];
    title = cfg?.title || `অর্ডার ট্র্যাকিং | ${storeName}`;
    description =
      cfg?.description ||
      'অর্ডার নম্বর ও ফোন নম্বর দিয়ে আপনার কাপড় ডেলিভারির রিয়েল-টাইম কুরিয়ার আপডেট দেখুন।';
    keywords = cfg?.keywords || keywords;
    heading = 'অর্ডার ট্র্যাকিং';
  } else if (pathname === '/about') {
    pageKey = 'about';
    const cfg = pages.about;
    title = cfg?.title || `আমাদের সম্পর্কে | ${storeName}`;
    description =
      cfg?.description ||
      settings?.contentConfig?.aboutPage?.heroDescription ||
      'বাংলার ঐতিহ্যবাহী বুনন ও প্রিমিয়াম গজ কাপড়ের বিশ্বস্ত ঠিকানা।';
    keywords = cfg?.keywords || keywords;
    heading = settings?.contentConfig?.aboutPage?.heroTitle || 'আমাদের সম্পর্কে';
  } else if (pathname === '/contact') {
    pageKey = 'contact';
    const cfg = pages.contact;
    title = cfg?.title || `যোগাযোগ করুন | ${storeName}`;
    description =
      cfg?.description ||
      settings?.contentConfig?.contactPage?.subtitle ||
      'কাপড়ের বহর, গজ হিসাব বা অর্ডার সংক্রান্ত যেকোনো প্রশ্নে আমাদের সাথে যোগাযোগ করুন।';
    keywords = cfg?.keywords || keywords;
    heading = settings?.contentConfig?.contactPage?.title || 'যোগাযোগ করুন';
  } else if (pathname === '/faq') {
    pageKey = 'faq';
    includeFaq = true;
    const cfg = pages.faq;
    title = cfg?.title || `সাধারণ প্রশ্নোত্তর (FAQ) | ${storeName}`;
    description =
      cfg?.description ||
      settings?.contentConfig?.faqSubtitle ||
      '২.৫ ও ৩.৫ বহর, গজ হিসাব, কাস্টম কাটিং ও ডেলিভারি সংক্রান্ত সাধারণ প্রশ্নের উত্তর।';
    keywords = cfg?.keywords || keywords;
    heading = settings?.contentConfig?.faqTitle || 'সাধারণ প্রশ্নোত্তর (FAQ)';
  } else if (pathname === '/measurement-guide') {
    pageKey = 'measurement-guide';
    const cfg = pages['measurement-guide'];
    title = cfg?.title || `পোশাকের মাপ ও গজ গাইড | ${storeName}`;
    description =
      cfg?.description ||
      'কামিজ, শর্ট কামিজ, লং কটি, গাউন ও শাড়ির জন্য স্ট্যান্ডার্ড মাপ ও প্রয়োজনীয় গজের সম্পূর্ণ গাইড।';
    keywords = cfg?.keywords || keywords;
    heading = 'পোশাকের মাপ ও গজ গাইড';
  } else if (pathname === '/delivery-policy') {
    pageKey = 'delivery-policy';
    const doc = settings?.contentConfig?.deliveryPolicy;
    title = `${doc?.title || 'ডেলিভারি নীতিমালা'} | ${storeName}`;
    description = doc?.subtitle || `${storeName} সারা বাংলাদেশ ডেলিভারি নীতিমালা ও চার্জ।`;
    heading = doc?.title || 'ডেলিভারি নীতিমালা';
  } else if (pathname === '/return-policy') {
    pageKey = 'return-policy';
    const doc = settings?.contentConfig?.returnPolicy;
    title = `${doc?.title || 'রিটার্ন ও এক্সচেঞ্জ নীতিমালা'} | ${storeName}`;
    description = doc?.subtitle || `${storeName} রিটার্ন ও এক্সচেঞ্জ সংক্রান্ত শর্তাবলি।`;
    heading = doc?.title || 'রিটার্ন ও এক্সচেঞ্জ নীতিমালা';
  } else if (pathname === '/privacy-policy') {
    pageKey = 'privacy-policy';
    const doc = settings?.contentConfig?.privacyPolicy;
    title = `${doc?.title || 'গোপনীয়তা নীতিমালা'} | ${storeName}`;
    description = doc?.subtitle || `${storeName} গ্রাহকের তথ্যের গোপনীয়তা ও নিরাপত্তা নীতিমালা।`;
    heading = doc?.title || 'গোপনীয়তা নীতিমালা';
  } else if (pathname === '/terms') {
    pageKey = 'terms';
    const doc = settings?.contentConfig?.termsConditions;
    title = `${doc?.title || 'শর্তাবলি ও নিয়মকানুন'} | ${storeName}`;
    description = doc?.subtitle || `${storeName} ব্যবহারের শর্তাবলি ও নিয়মকানুন।`;
    heading = doc?.title || 'শর্তাবলি ও নিয়মকানুন';
  }

  const categoryLinksHtml = activeCategories
    .slice(0, 12)
    .map(
      (c) =>
        `<li><a href="/category/${escapeHtml(encodeURIComponent(c.slug))}">${escapeHtml(c.name)}</a></li>`
    )
    .join('');

  const productLinksHtml = activeProducts
    .slice(0, 16)
    .map((row) => {
      const p = mapProductRow(row);
      const price = p.discountPrice && p.discountPrice < p.pricePerYard ? p.discountPrice : p.pricePerYard;
      const prodSlug = row.slug || p.id;
      return `<li><a href="/product/${escapeHtml(encodeURIComponent(prodSlug))}">${escapeHtml(p.name)} — ৳${price}/গজ</a></li>`;
    })
    .join('');

  const semanticRoot = `<main data-edge-seo="storefront" data-page="${escapeHtml(pageKey)}" style="max-width:960px;margin:2rem auto;padding:1.5rem;font-family:sans-serif;">
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(description)}</p>
    <nav aria-label="Primary Collections"><ul>${categoryLinksHtml}</ul></nav>
    <section aria-label="Featured Yard Fabrics"><ul>${productLinksHtml}</ul></section>
  </main>`;

  const jsonLd = buildStorefrontGraphSchemas(baseUrl, settings, includeFaq);

  const html = injectSeoIntoHtml(baseHtml, {
    title,
    description,
    keywords,
    canonicalUrl,
    siteName: storeName,
    ogType: 'website',
    imageUrl,
    imageAlt: title,
    jsonLd,
    stripStaticJsonLd: true,
    rootHtml: semanticRoot,
  });

  return new Response(html, {
    status: 200,
    headers: applyEdgeSecurityHeaders(
      {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
        Vary: 'Host, Accept-Encoding',
      },
      true
    ),
  });
}

export function buildRobotsTxt(env: Bindings, origin: string): string {
  const baseUrl = resolveBaseUrl(env, origin);
  const disallowLines = [
    'Disallow: /admin/',
    'Disallow: /admin',
    'Disallow: /sysadm/',
    'Disallow: /sysadm',
    'Disallow: /account/',
    'Disallow: /account',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /wishlist',
    'Disallow: /order-confirmation',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /forgot-password',
    'Disallow: /reset-password',
    'Disallow: /api/',
  ];

  const allowLines = [
    'Allow: /',
    'Allow: /llms.txt',
    'Allow: /llms-full.txt',
    'Allow: /feed.xml',
  ];

  const blockForAgent = (agent: string) =>
    [`User-agent: ${agent}`, ...allowLines, ...disallowLines].join('\n');

  return [
    blockForAgent('*'),
    '',
    blockForAgent('GPTBot'),
    '',
    blockForAgent('OAI-SearchBot'),
    '',
    blockForAgent('PerplexityBot'),
    '',
    blockForAgent('ClaudeBot'),
    '',
    blockForAgent('Google-Extended'),
    '',
    blockForAgent('Applebot-Extended'),
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `# Google Merchant Center Product Feed: ${baseUrl}/feed.xml`,
    '',
  ].join('\n');
}

export async function buildLlmsTxt(
  env: Bindings,
  origin: string,
  full: boolean
): Promise<string> {
  const baseUrl = resolveBaseUrl(env, origin);
  const db = createDb(env);
  await ensureSeeded(db, env);

  const [productRows, categoryRows, { settings }] = await Promise.all([
    db.select().from(products),
    getAllCategoriesList(db),
    getStoreAndPaymentSettings(db),
  ]);

  const storeName = settings?.storeName || 'Fashion Doniya BD';
  const activeCategories = categoryRows.filter((c) => c.isActive !== false);
  const activeProducts = productRows
    .filter((p) => p.isActive !== false)
    .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));

  const lines: string[] = [
    `# ${storeName}`,
    '',
    `> ${settings?.taglineBengali || 'প্রিমিয়াম ২.৫ ও ৩.৫ বহর গজ কাপড়ের অনলাইন স্টোর'} — Unstitched yardage fabric storefront in Bangladesh specializing in 2.5 Bahar (36–44 inch) and 3.5 Bahar (56–60 inch) fabrics, smart yardage calculation, custom measurements, and nationwide courier delivery.`,
    '',
    '## Key Pages',
    `- [Home](${baseUrl}/): Featured 2.5 & 3.5 Bahar fabric collections and editorial showcases`,
    `- [Shop](${baseUrl}/shop): Complete yardage fabric catalog with width, category, and price filters`,
    `- [3.5 Bahar Collection](${baseUrl}/fabric/3.5-bahar): Broad-width 56–60 inch fabrics`,
    `- [2.5 Bahar Collection](${baseUrl}/fabric/2.5-bahar): Standard-width 36–44 inch fabrics`,
    `- [Fabric Yard Calculator](${baseUrl}/calculator): Automatic yardage calculation by outfit type and addons`,
    `- [Custom Design Studio](${baseUrl}/custom-design): Custom measurements and AI fabric-to-outfit preview`,
    `- [Order Tracking](${baseUrl}/order-tracking): Real-time phone-verified order and courier tracking`,
    '',
    '## Active Categories',
    ...activeCategories.map(
      (c) =>
        `- [${c.name}](${baseUrl}/category/${encodeURIComponent(c.slug)}): ${c.description || `${c.name} গজ কাপড় কালেকশন`}`
    ),
    '',
    '## Products',
    ...(full ? activeProducts : activeProducts.slice(0, 20)).map((row) => {
      const p = mapProductRow(row);
      const prodSlug = row.slug || p.id;
      const effectivePrice =
        p.discountPrice && p.discountPrice < p.pricePerYard ? p.discountPrice : p.pricePerYard;
      const baseLine = `- [${p.name}](${baseUrl}/product/${encodeURIComponent(prodSlug)}): ৳${effectivePrice}/গজ · ${p.fabricWidth} বহর · ${p.category} · ${p.fabricType}`;
      if (!full) return baseLine;
      const details = [
        p.color ? `Color: ${p.color}` : '',
        p.sku ? `SKU: ${p.sku}` : '',
        p.stockYards > 0 ? `Stock: ${p.stockYards} yards` : 'Out of stock',
        p.seoDescription || p.description || '',
      ]
        .filter(Boolean)
        .join(' | ');
      return `${baseLine}${details ? ` — ${details}` : ''}`;
    }),
    '',
    '## Machine-Readable Feeds',
    `- [XML Sitemap](${baseUrl}/sitemap.xml)`,
    `- [Google Merchant Feed](${baseUrl}/feed.xml)`,
    `- [${full ? 'Summary Context' : 'Full Context'}](${baseUrl}/${full ? 'llms.txt' : 'llms-full.txt'})`,
    '',
  ];

  return lines.join('\n');
}
