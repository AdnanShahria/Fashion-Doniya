import { Hono } from 'hono';
import type { AppEnv, Bindings } from '../types';
import { authRateLimiter } from '../utils/rateLimiter';

export const aiRouter = new Hono<AppEnv>();

const AI_CATEGORY_CONFIGS: Record<
  string,
  {
    nameBn: string;
    nameEn: string;
    descBn: string;
    yards35: number;
    yards25: number;
    prompt: string;
  }
> = {
  short_kameez: {
    nameBn: 'শর্ট কামিজ',
    nameEn: 'Short Kameez',
    descBn: 'ট্রেন্ডি থাই-লেন্থ কাট, সাইড স্লিট ও ৩/৪ হাতা',
    yards35: 1.5,
    yards25: 2.0,
    prompt:
      'Professional fashion studio product photography of a standalone Short Kameez tailored strictly from the EXACT fabric in the input image. Isolated ghost-mannequin display on neutral off-white background, no human models.',
  },
  long_kameez: {
    nameBn: 'লং কামিজ',
    nameEn: 'Long Kameez',
    descBn: 'ঐতিহ্যবাহী স্ট্রেইট লং ও মার্জিত কাট',
    yards35: 2.0,
    yards25: 2.5,
    prompt:
      'Professional fashion studio product photography of a traditional Bangladeshi Long Kameez tailored strictly from the EXACT fabric in the input image. Isolated ghost-mannequin display on light neutral background, no human models.',
  },
  kurti: {
    nameBn: 'কুর্তি',
    nameEn: 'Kurti',
    descBn: 'স্মার্ট ক্যাজুয়াল এ-লাইন ফ্লেয়ার্ড কুর্তি',
    yards35: 2.5,
    yards25: 3.0,
    prompt:
      'Professional boutique catalog photography of a South Asian A-line Kurti tailored strictly from the EXACT fabric in the input image. Isolated ghost-mannequin display on light studio backdrop, no human models.',
  },
  lehenga_gown: {
    nameBn: 'লেহেঙ্গা / গাউন',
    nameEn: 'Lehenga / Gown',
    descBn: 'ঘেরালো পার্টি গাউন বা ব্রাইডাল লেহেঙ্গা',
    yards35: 3.5,
    yards25: 4.5,
    prompt:
      'Luxury festive fashion product display of a flared circular Lehenga/Gown crafted strictly from the EXACT fabric in the input image. Isolated ghost-mannequin display on crisp neutral backdrop, no human models.',
  },
  saree: {
    nameBn: 'শাড়ি',
    nameEn: 'Saree',
    descBn: '১২ হাত ফুল বডি শাড়ি ও ব্লাউজ পিস',
    yards35: 6.0,
    yards25: 6.0,
    prompt:
      'Luxury boutique display photography of a Bangladeshi Saree neatly pleated with blouse piece, crafted strictly from the EXACT fabric in the input image. Isolated studio display, no human models.',
  },
  long_koti: {
    nameBn: 'লং কটি',
    nameEn: 'Long Koti',
    descBn: 'ওপেন-ফ্রন্ট ম্যান্ডারিন কলার ওভারলে শ্রাগ',
    yards35: 3.5,
    yards25: 4.5,
    prompt:
      'Professional fashion product photography of an ethnic Long Koti shrug tailored strictly from the EXACT fabric in the input image. Isolated ghost-mannequin display on light neutral backdrop, no human models.',
  },
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function isBlockedHost(rawHostname: string): boolean {
  const host = rawHostname.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return true;
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.includes('metadata') ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '::' ||
    host.startsWith('fe80:') ||
    host.startsWith('fc') ||
    host.startsWith('fd')
  ) {
    return true;
  }
  const ipv4Part = host.startsWith('::ffff:') ? host.slice(7) : host;
  const ipv4Match = ipv4Part.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const a = Number(ipv4Match[1]);
    const b = Number(ipv4Match[2]);
    if (
      a === 0 ||
      a === 127 ||
      a === 10 ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 172 && b >= 16 && b <= 31)
    ) {
      return true;
    }
  }
  if (/^(0x[0-9a-f]+|\d+)$/i.test(ipv4Part)) {
    return true;
  }
  return false;
}

async function resolveImageData(
  imageRef: string
): Promise<{ base64Data: string; mimeType: string } | null> {
  const trimmed = String(imageRef || '').trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:')) {
    const match = trimmed.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const mime = match[1].toLowerCase();
      if (mime.startsWith('image/') && !mime.includes('svg')) {
        return { mimeType: match[1], base64Data: match[2] };
      }
      return null;
    }
  }

  if (trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:') {
        return null;
      }
      if (isBlockedHost(parsed.hostname)) {
        return null;
      }
      const resp = await fetch(parsed.toString(), {
        redirect: 'error',
        signal: AbortSignal.timeout(8000),
      });
      if (resp.ok) {
        const contentType = (resp.headers.get('content-type') || '').toLowerCase();
        if (!contentType.startsWith('image/') || contentType.includes('svg')) {
          return null;
        }
        const contentLength = Number(resp.headers.get('content-length') || 0);
        if (contentLength > 5 * 1024 * 1024) {
          return null;
        }
        const buf = new Uint8Array(await resp.arrayBuffer());
        if (buf.length > 5 * 1024 * 1024) return null;
        return {
          mimeType: contentType.split(';')[0].trim() || 'image/jpeg',
          base64Data: bytesToBase64(buf),
        };
      }
    } catch {
      return null;
    }
  }

  const sanitized = trimmed.replace(/\s+/g, '');
  if (
    sanitized.length > 100 &&
    sanitized.length <= 5 * 1024 * 1024 &&
    sanitized.length % 4 === 0 &&
    /^[A-Za-z0-9+/=]+$/.test(sanitized)
  ) {
    return { mimeType: 'image/jpeg', base64Data: sanitized };
  }
  return null;
}

async function generateOutfitWithGeminiRest(
  env: Bindings,
  resolvedImage: { base64Data: string; mimeType: string },
  categoryKey: string
): Promise<string | null> {
  const apiKey = String(env?.GEMINI_API_KEY || '').trim();
  const cfg = AI_CATEGORY_CONFIGS[categoryKey];
  if (!apiKey || !cfg) return null;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    data: resolvedImage.base64Data,
                    mimeType: resolvedImage.mimeType,
                  },
                },
                { text: cfg.prompt },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        }),
      }
    );

    if (!resp.ok) return null;
    const json = (await resp.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
        };
      }>;
    };
    for (const part of json?.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

aiRouter.get('/status', (c) => {
  return c.json({
    success: true,
    hasGeminiApiKey: Boolean(c.env?.GEMINI_API_KEY),
    categories: Object.keys(AI_CATEGORY_CONFIGS),
  });
});

aiRouter.post('/fabric-to-outfit', authRateLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    fabricImage?: string;
    categories?: string[];
  };
  const fabricImage = body?.fabricImage;
  if (!fabricImage || typeof fabricImage !== 'string') {
    return c.json({ success: false, message: 'অনুগ্রহ করে একটি কাপড়ের ছবি প্রদান করুন।' }, 400);
  }

  const resolvedImage = await resolveImageData(fabricImage);
  if (!resolvedImage) {
    return c.json({ success: false, message: 'সঠিক ফরম্যাটের কাপড়ের ছবি প্রদান করুন (PNG, JPEG, WEBP)।' }, 400);
  }

  const rawKeys =
    Array.isArray(body.categories) && body.categories.length > 0
      ? body.categories
      : Object.keys(AI_CATEGORY_CONFIGS);
  const keys = Array.from(new Set(rawKeys)).slice(0, 6);

  const designs = [];
  for (const catKey of keys) {
    const cfg = AI_CATEGORY_CONFIGS[catKey];
    if (!cfg) continue;
    const generatedImage = c.env?.GEMINI_API_KEY
      ? await generateOutfitWithGeminiRest(c.env, resolvedImage, catKey)
      : null;
    designs.push({
      id: `outfit-${catKey}-${Date.now()}`,
      categoryKey: catKey,
      categoryNameBn: cfg.nameBn,
      categoryNameEn: cfg.nameEn,
      descriptionBn: cfg.descBn,
      suggestedYards35: cfg.yards35,
      suggestedYards25: cfg.yards25,
      imageUrl: generatedImage || fabricImage,
      isAiGenerated: Boolean(generatedImage),
      generatedAt: new Date().toISOString(),
    });
  }

  return c.json({ success: true, designs });
});

aiRouter.post('/fabric-to-outfit/single', authRateLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    fabricImage?: string;
    category?: string;
  };
  const cfg = body?.category ? AI_CATEGORY_CONFIGS[body.category] : undefined;
  if (!body?.fabricImage || !body?.category || !cfg) {
    return c.json({ success: false, message: 'কাপড়ের ছবি এবং সঠিক ক্যাটাগরি আবশ্যক।' }, 400);
  }

  const resolved = await resolveImageData(body.fabricImage);
  if (!resolved) {
    return c.json({ success: false, message: 'সঠিক ফরম্যাটের কাপড়ের ছবি প্রদান করুন (PNG, JPEG, WEBP)।' }, 400);
  }

  const generatedImage = c.env?.GEMINI_API_KEY
    ? await generateOutfitWithGeminiRest(c.env, resolved, body.category)
    : null;

  return c.json({
    success: true,
    design: {
      id: `outfit-${body.category}-${Date.now()}`,
      categoryKey: body.category,
      categoryNameBn: cfg.nameBn,
      categoryNameEn: cfg.nameEn,
      descriptionBn: cfg.descBn,
      suggestedYards35: cfg.yards35,
      suggestedYards25: cfg.yards25,
      imageUrl: generatedImage || body.fabricImage,
      isAiGenerated: Boolean(generatedImage),
      generatedAt: new Date().toISOString(),
    },
  });
});
