import type { Bindings } from '../api/types';
import { serveR2MediaRequest } from '../api/utils/edge-handlers';

export const onRequest: PagesFunction<Bindings> = async (context) => {
  const { request, env, params } = context;
  const keyParts = Array.isArray(params.key)
    ? params.key
    : params.key
      ? [String(params.key)]
      : [];
  return serveR2MediaRequest(request, env, keyParts.join('/'));
};
