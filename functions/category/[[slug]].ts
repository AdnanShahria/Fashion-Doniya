import type { Bindings } from '../api/types';
import { renderCategorySsrResponse } from '../api/utils/edge-handlers';

type CategoryPageContext = Parameters<PagesFunction<Bindings>>[0];

async function handleCategorySsr(context: CategoryPageContext): Promise<Response> {
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

  const res = await renderCategorySsrResponse(env, request.url, slug, baseHtml);
  if (request.method === 'HEAD') {
    return new Response(null, { status: res.status, headers: res.headers });
  }
  return res;
}

export const onRequestGet: PagesFunction<Bindings> = handleCategorySsr;
export const onRequestHead: PagesFunction<Bindings> = handleCategorySsr;
export const onRequest: PagesFunction<Bindings> = handleCategorySsr;
