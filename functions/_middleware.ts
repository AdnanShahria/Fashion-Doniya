import type { Bindings } from './api/types';
import { DEFAULT_INDEXNOW_KEY } from './api/config/cloudflare-env';
import {
  buildLlmsTxt,
  buildRobotsTxt,
  renderStorefrontSsrResponse,
} from './api/utils/edge-handlers';

const STATIC_EXT_RE =
  /\.(?:js|mjs|css|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|eot|json|xml|txt|map|pdf|avif|mp4|webm)$/i;

function isBypassPath(pathname: string): boolean {
  return (
    pathname === '/api' ||
    pathname.startsWith('/api/') ||
    pathname === '/media' ||
    pathname.startsWith('/media/') ||
    pathname === '/product' ||
    pathname.startsWith('/product/') ||
    pathname === '/category' ||
    pathname.startsWith('/category/') ||
    pathname === '/sitemap.xml' ||
    pathname === '/feed.xml' ||
    pathname.startsWith('/assets/') ||
    STATIC_EXT_RE.test(pathname)
  );
}

export const onRequest: PagesFunction<Bindings> = async (context) => {
  const { request, env } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return context.next();
  }

  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname === '/robots.txt') {
    const body = buildRobotsTxt(env, url.origin);
    return new Response(request.method === 'HEAD' ? null : body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  if (pathname === '/llms.txt' || pathname === '/llms-full.txt') {
    const body = await buildLlmsTxt(env, url.origin, pathname === '/llms-full.txt');
    return new Response(request.method === 'HEAD' ? null : body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=1800',
      },
    });
  }

  const expectedKey = String(env?.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY).trim();
  if (pathname === `/${expectedKey}.txt`) {
    return new Response(request.method === 'HEAD' ? null : expectedKey, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  if (pathname === '/BingSiteAuth.xml' || /^\/google[a-z0-9_-]*\.html$/i.test(pathname)) {
    return context.next();
  }

  if (isBypassPath(pathname)) {
    return context.next();
  }

  const nextRes = await context.next();
  const contentType = (nextRes.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('text/html')) {
    return nextRes;
  }

  const baseHtml = await nextRes.text();
  const ssrRes = await renderStorefrontSsrResponse(env, request.url, baseHtml);
  if (request.method === 'HEAD') {
    return new Response(null, { status: ssrRes.status, headers: ssrRes.headers });
  }
  return ssrRes;
};
