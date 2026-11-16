import type { Bindings } from '../types';
import type { Product } from '../../../frontend/src/types/index';
import { DEFAULT_INDEXNOW_KEY, DEFAULT_STORE_ORIGIN } from '../config/cloudflare-env';
import { escapeHtml, safeWaitUntil } from './helpers';

export interface ComputedProductSeo {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  imageAlt: string;
}

export type ProductSeoInput = Partial<Product> & Pick<Product, 'name' | 'pricePerYard'>;

export interface InjectSeoOptions {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl: string;
  siteName?: string;
  ogType?: string;
  imageUrl?: string;
  imageAlt?: string;
  price?: number;
  currency?: string;
  availability?: string;
  jsonLd?: unknown[];
  stripStaticJsonLd?: boolean;
  rootHtml?: string;
  robots?: string;
}

export function resolveProductImageUrl(
  rawImage: string | null | undefined,
  productId: string,
  baseUrl: string
): string {
  const base = String(baseUrl || DEFAULT_STORE_ORIGIN).replace(/\/+$/, '');
  if (!rawImage || rawImage.startsWith('data:')) {
    return productId.startsWith('prod-')
      ? `${base}/assets/fabrics/gen_${productId.replace(/-/g, '_')}.png`
      : `${base}/assets/fabric-banner-3-5.png`;
  }
  if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
    return rawImage;
  }
  if (!rawImage.includes('/') && !rawImage.includes('.')) {
    return productId.startsWith('prod-')
      ? `${base}/assets/fabrics/gen_${productId.replace(/-/g, '_')}.png`
      : `${base}/assets/fabric-banner-3-5.png`;
  }
  return `${base}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
}

function buildAutoProductSeo(product: ProductSeoInput, storeName: string): ComputedProductSeo {
  const effectivePrice =
    product.discountPrice && product.discountPrice < product.pricePerYard
      ? product.discountPrice
      : product.pricePerYard;

  const width = product.fabricWidth || '3.5';
  const suffix = ` (${width} বহর) | ${storeName}`;
  const fullAutoTitle = `${product.name}${suffix}`;
  const autoTitle =
    fullAutoTitle.length > 100
      ? `${product.name.slice(0, Math.max(20, 100 - suffix.length - 1)).trim()}…${suffix}`
      : fullAutoTitle;

  const plainDesc = String(product.description || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const autoDescription =
    plainDesc.length >= 40
      ? `${plainDesc.slice(0, 140)} — ৳${effectivePrice}/গজ | ${storeName}`.slice(0, 165)
      : `${product.name} — ${product.fabricType || 'প্রিমিয়াম গজ কাপড়'} (${width} হাত বহর), রঙ: ${product.color || 'আকর্ষণীয়'}। মূল্য: ৳${effectivePrice}/গজ। ${storeName}-এ অর্ডার করুন।`;

  const autoKeywords = Array.from(
    new Set(
      [
        product.name,
        product.nameEn,
        product.category,
        product.fabricType,
        `${width} হাত বহর`,
        product.color,
        product.design,
        storeName,
        'গজ কাপড়',
        'অনলাইন ফ্যাব্রিক বাংলাদেশ',
      ].filter(Boolean)
    )
  ).join(', ');

  const colorPart = product.color ? `, ${product.color}` : '';
  const autoImageAlt = `${product.name} - ${product.fabricType || 'প্রিমিয়াম গজ কাপড়'} (${width} বহর${colorPart}) | ${storeName}`
    .replace(/\s+,/g, ',')
    .trim();

  return {
    seoTitle: autoTitle,
    seoDescription: autoDescription,
    seoKeywords: autoKeywords,
    imageAlt: autoImageAlt,
  };
}

export function computeProductSeo(
  product: ProductSeoInput,
  storeName = 'Fashion Doniya BD',
  previousProduct?: ProductSeoInput | null
): ComputedProductSeo {
  const auto = buildAutoProductSeo(product, storeName);
  const incomingTitle = String(product.seoTitle || '').trim();
  const incomingDesc = String(product.seoDescription || '').trim();
  const incomingKeywords = String(product.seoKeywords || '').trim();
  const incomingAlt = String(product.imageAlt || '').trim();

  if (previousProduct) {
    const prevAuto = buildAutoProductSeo(previousProduct, storeName);
    return {
      seoTitle:
        !incomingTitle || incomingTitle === prevAuto.seoTitle ? auto.seoTitle : incomingTitle,
      seoDescription:
        !incomingDesc || incomingDesc === prevAuto.seoDescription
          ? auto.seoDescription
          : incomingDesc,
      seoKeywords:
        !incomingKeywords || incomingKeywords === prevAuto.seoKeywords
          ? auto.seoKeywords
          : incomingKeywords,
      imageAlt: !incomingAlt || incomingAlt === prevAuto.imageAlt ? auto.imageAlt : incomingAlt,
    };
  }

  return {
    seoTitle: incomingTitle || auto.seoTitle,
    seoDescription: incomingDesc || auto.seoDescription,
    seoKeywords: incomingKeywords || auto.seoKeywords,
    imageAlt: incomingAlt || auto.imageAlt,
  };
}

export async function pingSearchEngines(
  env: Bindings,
  baseUrl: string,
  urls: string[]
): Promise<{ indexNowOk: boolean; googlePingOk: boolean; submitted: number }> {
  const cleanBase = String(env?.SITE_URL || baseUrl || DEFAULT_STORE_ORIGIN).replace(/\/+$/, '');
  let parsedBase: URL;
  try {
    parsedBase = new URL(cleanBase);
  } catch {
    parsedBase = new URL(DEFAULT_STORE_ORIGIN);
  }

  const hostname = parsedBase.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return { indexNowOk: false, googlePingOk: false, submitted: 0 };
  }

  const key = String(env?.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY).trim();
  const fullUrls = Array.from(
    new Set(
      (urls || [])
        .filter(Boolean)
        .map((u) =>
          u.startsWith('http://') || u.startsWith('https://')
            ? u
            : `${cleanBase}${u.startsWith('/') ? '' : '/'}${u}`
        )
    )
  );
  if (fullUrls.length === 0) {
    fullUrls.push(`${cleanBase}/`);
  }

  const indexNowPromise = fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: parsedBase.host,
      key,
      keyLocation: `${cleanBase}/${key}.txt`,
      urlList: fullUrls,
    }),
  });

  const googlePingPromise = fetch(
    `https://www.google.com/ping?sitemap=${encodeURIComponent(`${cleanBase}/sitemap.xml`)}`
  );

  const [indexNowRes, googleRes] = await Promise.allSettled([indexNowPromise, googlePingPromise]);
  return {
    indexNowOk: indexNowRes.status === 'fulfilled' && indexNowRes.value.ok,
    googlePingOk: googleRes.status === 'fulfilled' && googleRes.value.ok,
    submitted: fullUrls.length,
  };
}

export function scheduleSearchEnginePing(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  c: any,
  env: Bindings,
  baseUrl: string,
  urls: string[]
): void {
  const task = pingSearchEngines(env, baseUrl, urls).catch(() => undefined);
  if (c) {
    safeWaitUntil(c, task);
  }
}

export function stripDefaultMetaTags(html: string, stripJsonLd = false): string {
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta[^>]+name=["'](?:title|description|keywords|robots)["'][^>]*>/gi, '')
    .replace(/<meta[^>]+property=["'](?:og:|product:)[^"']+["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/<link[^>]+rel=["'](?:canonical|alternate)["'][^>]*>/gi, '');
  if (stripJsonLd) {
    out = out.replace(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
      ''
    );
  }
  return out;
}

export function injectSeoIntoHtml(baseHtml: string, options: InjectSeoOptions): string {
  const cleaned = stripDefaultMetaTags(baseHtml, Boolean(options.stripStaticJsonLd));
  const safeTitle = escapeHtml(options.title);
  const safeDesc = escapeHtml(options.description);
  const safeCanon = escapeHtml(options.canonicalUrl);
  const safeSiteName = escapeHtml(options.siteName || 'Fashion Doniya BD');
  const safeImage = options.imageUrl ? escapeHtml(options.imageUrl) : '';
  const safeImageAlt = options.imageAlt ? escapeHtml(options.imageAlt) : '';
  const robotsContent =
    options.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const headInjections = [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDesc}" />`,
    options.keywords ? `<meta name="keywords" content="${escapeHtml(options.keywords)}" />` : '',
    `<meta name="robots" content="${escapeHtml(robotsContent)}" />`,
    `<link rel="canonical" href="${safeCanon}" />`,
    `<link rel="alternate" hreflang="bn-BD" href="${safeCanon}" />`,
    `<link rel="alternate" hreflang="en" href="${safeCanon}" />`,
    `<link rel="alternate" hreflang="x-default" href="${safeCanon}" />`,
    `<meta property="og:site_name" content="${safeSiteName}" />`,
    `<meta property="og:type" content="${escapeHtml(options.ogType || 'website')}" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDesc}" />`,
    `<meta property="og:url" content="${safeCanon}" />`,
    safeImage ? `<meta property="og:image" content="${safeImage}" />` : '',
    safeImage ? `<meta property="og:image:secure_url" content="${safeImage}" />` : '',
    safeImage && safeImageAlt ? `<meta property="og:image:alt" content="${safeImageAlt}" />` : '',
    options.price !== undefined
      ? `<meta property="product:price:amount" content="${Number(options.price).toFixed(2)}" />\n    <meta property="product:price:currency" content="${escapeHtml(options.currency || 'BDT')}" />`
      : '',
    options.availability
      ? `<meta property="product:availability" content="${escapeHtml(options.availability)}" />`
      : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDesc}" />`,
    safeImage ? `<meta name="twitter:image" content="${safeImage}" />` : '',
    safeImage && safeImageAlt ? `<meta name="twitter:image:alt" content="${safeImageAlt}" />` : '',
    ...(options.jsonLd || []).map(
      (schema) =>
        `<script type="application/ld+json">${JSON.stringify(schema)
          .replace(/</g, '\\u003c')
          .replace(/>/g, '\\u003e')
          .replace(/&/g, '\\u0026')}</script>`
    ),
  ]
    .filter(Boolean)
    .join('\n    ');

  const withHead = cleaned.replace(/<\/head>/i, `    ${headInjections}\n  </head>`);
  if (options.rootHtml !== undefined) {
    return withHead.replace(
      /<div\s+id=["']root["'][^>]*>\s*<\/div>/i,
      `<div id="root">${options.rootHtml}</div>`
    );
  }
  return withHead;
}
