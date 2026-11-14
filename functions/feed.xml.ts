import type { Bindings } from './api/types';
import { buildMerchantFeedXml } from './api/utils/edge-handlers';

export const onRequestGet: PagesFunction<Bindings> = async (context) => {
  const origin = new URL(context.request.url).origin;
  const xml = await buildMerchantFeedXml(context.env, origin);
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  });
};
