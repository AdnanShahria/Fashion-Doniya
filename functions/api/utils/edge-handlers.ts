import type { Bindings } from '../types';
import { createDb } from './db-factory';
import { ensureSeeded } from './seed';
import { getAllCategoriesList, getAllProductsList, getStoreAndPaymentSettings } from './mappers';
import { escapeHtml } from './helpers';

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

  if (request.method === 'HEAD') {
    return new Response(null, { status: 200, headers });
  }

  return new Response(object.body, { status: 200, headers });
}

export async function buildSitemapXml(env: Bindings, originOverride?: string): Promise<string> {
  const db = createDb(env);
  await ensureSeeded(db, env);
  const [productsList, categoriesList] = await Promise.all([
    getAllProductsList(db),
    getAllCategoriesList(db),
  ]);

  const baseUrl = (originOverride || env?.SITE_URL || 'https://fashiondoniyabd.com').replace(
    /\/$/,
    ''
  );
  const today = new Date().toISOString().split('T')[0];

  const staticPaths = [
    '/',
    '/shop',
    '/fabric/3.5-bahar',
    '/fabric/2.5-bahar',
    '/calculator',
    '/custom-design',
    '/order-tracking',
    '/about',
    '/contact',
    '/faq',
    '/measurement-guide',
  ];

  const urls: string[] = staticPaths.map(
    (p) => `  <url>
    <loc>${escapeHtml(`${baseUrl}${p}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${p === '/' ? '1.0' : '0.8'}</priority>
  </url>`
  );

  for (const cat of categoriesList.filter((c) => c.isActive !== false)) {
    urls.push(`  <url>
    <loc>${escapeHtml(`${baseUrl}/category/${encodeURIComponent(cat.slug)}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  for (const p of productsList.filter((item) => item.isActive !== false)) {
    const primaryImage = p.images?.[0];
    const resolvedImage =
      primaryImage && !primaryImage.startsWith('data:')
        ? primaryImage.startsWith('http')
          ? primaryImage
          : `${baseUrl}${primaryImage.startsWith('/') ? '' : '/'}${primaryImage}`
        : null;

    urls.push(`  <url>
    <loc>${escapeHtml(`${baseUrl}/product/${encodeURIComponent(p.id)}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>${
      resolvedImage
        ? `\n    <image:image>\n      <image:loc>${escapeHtml(resolvedImage)}</image:loc>\n      <image:title>${escapeHtml(p.name)}</image:title>\n    </image:image>`
        : ''
    }
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
  const [productsList, { settings }] = await Promise.all([
    getAllProductsList(db),
    getStoreAndPaymentSettings(db),
  ]);

  const baseUrl = (originOverride || env?.SITE_URL || 'https://fashiondoniyabd.com').replace(
    /\/$/,
    ''
  );
  const storeName = settings?.storeName || 'Fashion Doniya BD';

  const items = productsList
    .filter((p) => p.isActive !== false)
    .map((p) => {
      const price = p.discountPrice && p.discountPrice < p.pricePerYard ? p.discountPrice : p.pricePerYard;
      const primaryImage = p.images?.[0];
      const imageLink =
        primaryImage && !primaryImage.startsWith('data:')
          ? primaryImage.startsWith('http')
            ? primaryImage
            : `${baseUrl}${primaryImage.startsWith('/') ? '' : '/'}${primaryImage}`
          : `${baseUrl}/assets/fabric-banner-3-5.png`;

      return `    <item>
      <g:id>${escapeHtml(p.id)}</g:id>
      <g:title>${escapeHtml(p.name)}</g:title>
      <g:description>${escapeHtml(p.description || p.name)}</g:description>
      <g:link>${escapeHtml(`${baseUrl}/product/${encodeURIComponent(p.id)}`)}</g:link>
      <g:image_link>${escapeHtml(imageLink)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${p.stockYards > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${Number(price).toFixed(2)} BDT</g:price>
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
