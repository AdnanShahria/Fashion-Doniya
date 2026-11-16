import type { Context } from 'hono';
import type { AppEnv, Bindings } from '../types';
import { slugify } from './helpers';

export type MediaStorageProvider = 'r2' | 'imgbb' | 'inline-dev';

export interface ParsedImagePayload {
  bytes: Uint8Array;
  contentType: string;
  ext: string;
  fileNameBase: string;
  rawDataUrl: string;
}

export interface StoredMediaResult {
  provider: MediaStorageProvider;
  url: string;
  key?: string;
  dataUrl?: string;
  contentType: string;
  sizeBytes: number;
  durationMs: number;
  verifiedReadback?: boolean;
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Valid 1x1 gold (#C5A46D) PNG image bytes for synthetic upload testing.
 */
export function createSyntheticTestPng(): Uint8Array {
  const base64Png =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  return base64ToUint8Array(base64Png);
}

function toSeoFileNameBase(rawInput: string): string {
  return (
    slugify(rawInput)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'fabric-image'
  );
}

export async function parseImageUploadRequest(
  c: Context<AppEnv>
): Promise<ParsedImagePayload | null> {
  let bytes: Uint8Array | null = null;
  let contentType = 'image/png';
  let ext = 'png';
  let fileNameBase = 'fabric-image';
  let rawDataUrl = '';

  const reqContentType = (c.req.header('content-type') || '').toLowerCase();
  if (reqContentType.includes('multipart/form-data')) {
    const form = await c.req.formData().catch(() => null);
    const file = form?.get('file') || form?.get('image');
    const nameHint = String(form?.get('nameHint') || '').trim();
    if (file && typeof file === 'object' && 'arrayBuffer' in file) {
      const f = file as File;
      bytes = new Uint8Array(await f.arrayBuffer());
      contentType = f.type || 'image/png';
      ext =
        contentType.includes('jpeg') || contentType.includes('jpg')
          ? 'jpg'
          : contentType.includes('webp')
            ? 'webp'
            : contentType.includes('gif')
              ? 'gif'
              : contentType.includes('svg')
                ? 'svg'
                : 'png';
      const rawName = (f.name || 'fabric-image').replace(/\.[^.]+$/, '');
      fileNameBase = toSeoFileNameBase(nameHint || rawName);
    }
  } else {
    const body = (await c.req.json().catch(() => ({}))) as {
      dataUrl?: string;
      fileName?: string;
      nameHint?: string;
    };
    rawDataUrl = String(body?.dataUrl || '').trim();
    const rawName = String(body?.nameHint || body?.fileName || 'fabric-image')
      .replace(/\.[^.]+$/, '')
      .trim();
    fileNameBase = toSeoFileNameBase(rawName);
    const match = rawDataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,(.+)$/i);
    if (match) {
      const rawSubtype = match[1].toLowerCase();
      ext = rawSubtype === 'jpeg' ? 'jpg' : rawSubtype === 'svg+xml' ? 'svg' : rawSubtype;
      contentType = `image/${rawSubtype}`;
      bytes = base64ToUint8Array(match[2]);
    }
  }

  if (!bytes || bytes.length === 0) {
    return null;
  }

  return {
    bytes,
    contentType,
    ext,
    fileNameBase: fileNameBase || 'fabric-image',
    rawDataUrl,
  };
}

/**
 * Shared Image Upload Pipeline:
 * 1. Primary: Cloudflare R2 (env.MEDIA_BUCKET) -> /media/<key>
 * 2. Fallback: ImgBB API (env.IMGBB_API_KEY)
 * 3. Dev Fallback: inline base64 dataUrl
 */
export async function storeImageBytes(
  env: Bindings,
  payload: ParsedImagePayload,
  options?: { verifyR2Readback?: boolean }
): Promise<StoredMediaResult> {
  const startedAt = Date.now();
  const objectKey = `uploads/${payload.fileNameBase}-${Date.now()}.${payload.ext}`;

  // 1. Primary: Cloudflare R2
  if (env?.MEDIA_BUCKET) {
    await env.MEDIA_BUCKET.put(objectKey, payload.bytes, {
      httpMetadata: {
        contentType: payload.contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    let verifiedReadback: boolean | undefined;
    if (options?.verifyR2Readback) {
      try {
        const headObj = await env.MEDIA_BUCKET.head(objectKey);
        verifiedReadback = Boolean(headObj && headObj.size === payload.bytes.length);
      } catch {
        verifiedReadback = false;
      }
    }

    return {
      provider: 'r2',
      url: `/media/${objectKey}`,
      key: objectKey,
      contentType: payload.contentType,
      sizeBytes: payload.bytes.length,
      durationMs: Date.now() - startedAt,
      ...(verifiedReadback !== undefined ? { verifiedReadback } : {}),
    };
  }

  // 2. Fallback: ImgBB
  const imgbbKey = String(env?.IMGBB_API_KEY || '').trim();
  if (imgbbKey) {
    try {
      const formData = new FormData();
      formData.append('image', uint8ArrayToBase64(payload.bytes));
      const resp = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(imgbbKey)}`, {
        method: 'POST',
        body: formData,
      });
      if (resp.ok) {
        const json = (await resp.json()) as { data?: { url?: string } };
        if (json?.data?.url) {
          return {
            provider: 'imgbb',
            url: json.data.url,
            contentType: payload.contentType,
            sizeBytes: payload.bytes.length,
            durationMs: Date.now() - startedAt,
          };
        }
      }
    } catch {
      // fall through to inline-dev
    }
  }

  // 3. Dev Fallback
  const dataUrl =
    payload.rawDataUrl ||
    `data:${payload.contentType};base64,${uint8ArrayToBase64(payload.bytes)}`;

  return {
    provider: 'inline-dev',
    url: dataUrl,
    dataUrl,
    contentType: payload.contentType,
    sizeBytes: payload.bytes.length,
    durationMs: Date.now() - startedAt,
  };
}
