import { escapeHtml } from './helpers';

export function stripDefaultMetaTags(html: string): string {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta[^>]+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '');
}

export function injectSeoIntoHtml(
  baseHtml: string,
  options: {
    title: string;
    description: string;
    canonicalUrl: string;
    ogType?: string;
    imageUrl?: string;
    price?: number;
    currency?: string;
    jsonLd?: unknown[];
    rootHtml: string;
    robots?: string;
  }
): string {
  const cleaned = stripDefaultMetaTags(baseHtml);
  const safeTitle = escapeHtml(options.title);
  const safeDesc = escapeHtml(options.description);
  const safeCanon = escapeHtml(options.canonicalUrl);
  const safeImage = options.imageUrl ? escapeHtml(options.imageUrl) : '';

  const headInjections = [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDesc}" />`,
    options.robots ? `<meta name="robots" content="${escapeHtml(options.robots)}" />` : '',
    `<link rel="canonical" href="${safeCanon}" />`,
    `<link rel="alternate" hreflang="bn-BD" href="${safeCanon}" />`,
    `<meta property="og:type" content="${escapeHtml(options.ogType || 'website')}" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDesc}" />`,
    `<meta property="og:url" content="${safeCanon}" />`,
    safeImage ? `<meta property="og:image" content="${safeImage}" />` : '',
    options.price !== undefined
      ? `<meta property="product:price:amount" content="${Number(options.price).toFixed(2)}" />\n    <meta property="product:price:currency" content="${escapeHtml(options.currency || 'BDT')}" />`
      : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDesc}" />`,
    safeImage ? `<meta name="twitter:image" content="${safeImage}" />` : '',
    ...(options.jsonLd || []).map(
      (schema) =>
        `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`
    ),
  ]
    .filter(Boolean)
    .join('\n    ');

  const withHead = cleaned.replace(/<\/head>/i, `    ${headInjections}\n  </head>`);
  return withHead.replace(
    /<div id="root">\s*<\/div>/i,
    `<div id="root">${options.rootHtml}</div>`
  );
}
