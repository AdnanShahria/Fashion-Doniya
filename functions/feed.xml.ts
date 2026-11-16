import type { Bindings } from './api/types';
import { buildMerchantFeedXml } from './api/utils/edge-handlers';

type FeedContext = Parameters<PagesFunction<Bindings>>[0];

async function handleFeed(context: FeedContext): Promise<Response> {
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    return context.next();
  }
  const origin = new URL(context.request.url).origin;
  const xml = await buildMerchantFeedXml(context.env, origin);
  return new Response(context.request.method === 'HEAD' ? null : xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  });
}

export const onRequestGet: PagesFunction<Bindings> = handleFeed;
export const onRequestHead: PagesFunction<Bindings> = handleFeed;
export const onRequest: PagesFunction<Bindings> = handleFeed;
