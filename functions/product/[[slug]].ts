import type { Bindings } from '../api/types';
import { renderProductSsrResponse } from '../api/utils/edge-handlers';

type ProductPageContext = Parameters<PagesFunction<Bindings>>[0];

async function handleProductSsr(context: ProductPageContext): Promise<Response> {
  const { request, env, params } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return context.next();
  }

  const slugParts = Array.isArray(params.slug)
    ? params.slug
    : params.slug
      ? [String(params.slug)]
      : [];
  const slug = slugParts.join('/').trim();

  const nextResponse = await context.next();
  const baseHtml = await nextResponse.text();

  if (!slug) {
    return new Response(request.method === 'HEAD' ? null : baseHtml, {
      status: nextResponse.status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const res = await renderProductSsrResponse(env, request.url, slug, baseHtml);
  if (request.method === 'HEAD') {
    return new Response(null, { status: res.status, headers: res.headers });
  }
  return res;
}

export const onRequestGet: PagesFunction<Bindings> = handleProductSsr;
export const onRequestHead: PagesFunction<Bindings> = handleProductSsr;
export const onRequest: PagesFunction<Bindings> = handleProductSsr;
