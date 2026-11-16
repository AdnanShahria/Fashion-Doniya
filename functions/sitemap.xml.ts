import type { Bindings } from './api/types';
import { buildSitemapXml } from './api/utils/edge-handlers';

type SitemapContext = Parameters<PagesFunction<Bindings>>[0];

async function handleSitemap(context: SitemapContext): Promise<Response> {
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return context.next();
  }
  const origin = new URL(context.request.url).origin;
  const xml = await buildSitemapXml(context.env, origin);
  return new Response(context.request.method === 'HEAD' ? null : xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  });
}

export const onRequestGet: PagesFunction<Bindings> = handleSitemap;
export const onRequestHead: PagesFunction<Bindings> = handleSitemap;
export const onRequest: PagesFunction<Bindings> = handleSitemap;
