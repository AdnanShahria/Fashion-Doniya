import React, { useEffect, useState, useRef } from 'react';

export type StudioViewAngle = 'front' | 'drape' | 'texture';

interface FabricPatternVisualProps {
  patternType?: string;
  colorHex?: string;
  secondaryColorHex?: string;
  className?: string;
  fabricWidth?: '2.5' | '3.5';
  title?: string;
  productId?: string;
  aspectRatio?: 'square' | 'wide' | 'portrait' | 'banner' | 'editorial';
  zoomOnHover?: boolean;
  enableInteractiveLoupe?: boolean;
  categorySlug?: string;
  isCollage?: boolean;
  collageVariant?: 'hero' | '3.5-bahar' | '2.5-bahar';
  viewAngle?: StudioViewAngle;
}

// Memory cache so each studio photograph is rendered once and reused instantaneously
const studioPhotoCache = new Map<string, string>();

// Shared singleton loader for the studio reference textile photographs
interface LoadedStudioAssets {
  heroImg: HTMLImageElement | null;
  categoryImg: HTMLImageElement | null;
}

let studioAssetsPromise: Promise<LoadedStudioAssets> | null = null;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function getStudioAssets(): Promise<LoadedStudioAssets> {
  if (!studioAssetsPromise) {
    studioAssetsPromise = Promise.all([
      loadImage('/assets/aistudio/image_51cb33bd.png'),
      loadImage('/assets/aistudio/image_25b3796e.png'),
    ]).then(([heroImg, categoryImg]) => ({ heroImg, categoryImg }));
  }
  return studioAssetsPromise;
}

// Helper: parse hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) || 197;
    const g = parseInt(clean[1] + clean[1], 16) || 164;
    const b = parseInt(clean[2] + clean[2], 16) || 109;
    return [r, g, b];
  }
  const num = parseInt(clean.substring(0, 6), 16);
  if (isNaN(num)) return [197, 164, 109];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

interface StudioCropPreset {
  source: 'hero' | 'category';
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  filter?: string;
}

/**
 * Curated studio photography crops of authentic Mulberry Silk, Banarasi Brocade,
 * Korean Floral Silk, Jamdani Zari Silk, and Embroidered Organza/Lawn.
 * Every coordinate is strictly inside pure fabric regions with zero UI overlays or borders.
 */
function selectStudioCropPreset(
  productId: string,
  patternType: string,
  categorySlug: string,
  fabricWidth: '2.5' | '3.5',
  viewAngle: StudioViewAngle
): StudioCropPreset {
  // Specific deterministic mapping for featured & catalog products
  const map: Record<string, StudioCropPreset> = {
    // 1. Royal Dhakai Jamdani / Mulberry Crimson & Gold Zari
    'prod-35-saree-1': {
      source: 'hero',
      sx: 0.575,
      sy: 0.202,
      sw: 0.350,
      sh: 0.325,
      filter: 'contrast(1.04) saturate(1.06)',
    },
    // 2. Premium Floral Silky Georgette / Korean Floral Silk (Ivory & Blush Rose)
    'prod-35-saree-2': {
      source: 'hero',
      sx: 0.548,
      sy: 0.282,
      sw: 0.365,
      sh: 0.325,
      filter: 'brightness(1.03) saturate(1.05)',
    },
    // 3. Handloom Chanderi Tissue / Banarasi Gold & Emerald Silk Rolls
    'prod-35-saree-3': {
      source: 'category',
      sx: 0.332,
      sy: 0.515,
      sw: 0.148,
      sh: 0.320,
      filter: 'contrast(1.04) saturate(1.06)',
    },
    // 4. Prussian Teal & Emerald Mulberry / Combed Silk-Cotton
    'prod-35-kamiz-1': {
      source: 'hero',
      sx: 0.535,
      sy: 0.368,
      sw: 0.355,
      sh: 0.315,
      filter: 'contrast(1.05) saturate(1.08)',
    },
    // 5. Designer Jamdani Buti / Royal Blue, Ivory & Gold Banarasi Silk Rolls
    'prod-35-kamiz-2': {
      source: 'category',
      sx: 0.810,
      sy: 0.515,
      sw: 0.148,
      sh: 0.320,
      filter: 'contrast(1.04) saturate(1.05)',
    },
    // 6. Embroidered Resham & Zari Silk-Lawn
    'prod-35-kamiz-3': {
      source: 'hero',
      sx: 0.522,
      sy: 0.432,
      sw: 0.385,
      sh: 0.288,
      filter: 'contrast(1.03) saturate(1.06)',
    },
    // Additional 3.5 Bahar products
    'prod-35-skam-1': {
      source: 'hero',
      sx: 0.640,
      sy: 0.235,
      sw: 0.285,
      sh: 0.440,
      filter: 'brightness(1.04) saturate(1.04)',
    },
    'prod-35-koti-1': {
      source: 'category',
      sx: 0.812,
      sy: 0.525,
      sw: 0.145,
      sh: 0.310,
      filter: 'sepia(0.10) contrast(1.05) saturate(1.10)',
    },
    'prod-35-koti-3': {
      source: 'hero',
      sx: 0.565,
      sy: 0.210,
      sw: 0.355,
      sh: 0.340,
      filter: 'sepia(0.12) contrast(1.06)',
    },
    'prod-35-gown-1': {
      source: 'hero',
      sx: 0.525,
      sy: 0.445,
      sw: 0.375,
      sh: 0.278,
      filter: 'brightness(1.02) saturate(1.08)',
    },
    'prod-35-gown-3': {
      source: 'hero',
      sx: 0.515,
      sy: 0.205,
      sw: 0.410,
      sh: 0.510,
      filter: 'contrast(1.03) saturate(1.05)',
    },
    'prod-35-custom-1': {
      source: 'hero',
      sx: 0.655,
      sy: 0.245,
      sw: 0.270,
      sh: 0.435,
      filter: 'brightness(1.05) contrast(1.02)',
    },
    // 2.5 Bahar products
    'prod-25-kamiz-1': {
      source: 'category',
      sx: 0.810,
      sy: 0.515,
      sw: 0.148,
      sh: 0.320,
      filter: 'contrast(1.05) saturate(1.06)',
    },
    'prod-25-kamiz-2': {
      source: 'category',
      sx: 0.812,
      sy: 0.535,
      sw: 0.146,
      sh: 0.300,
      filter: 'sepia(0.08) saturate(1.12) contrast(1.04)',
    },
    'prod-25-kamiz-3': {
      source: 'hero',
      sx: 0.545,
      sy: 0.295,
      sw: 0.365,
      sh: 0.330,
      filter: 'hue-rotate(-8deg) contrast(1.04)',
    },
    'prod-25-skam-1': {
      source: 'hero',
      sx: 0.635,
      sy: 0.225,
      sw: 0.290,
      sh: 0.445,
      filter: 'sepia(0.08) brightness(1.03)',
    },
    'prod-25-koti-1': {
      source: 'category',
      sx: 0.332,
      sy: 0.515,
      sw: 0.148,
      sh: 0.320,
      filter: 'sepia(0.10) saturate(1.08) contrast(1.04)',
    },
    'prod-25-gown-1': {
      source: 'hero',
      sx: 0.568,
      sy: 0.205,
      sw: 0.355,
      sh: 0.335,
      filter: 'hue-rotate(-6deg) contrast(1.05)',
    },
    'prod-25-gown-2': {
      source: 'hero',
      sx: 0.525,
      sy: 0.438,
      sw: 0.380,
      sh: 0.285,
      filter: 'contrast(1.04) saturate(1.06)',
    },
    'prod-25-custom-2': {
      source: 'hero',
      sx: 0.510,
      sy: 0.205,
      sw: 0.415,
      sh: 0.510,
      filter: 'contrast(1.03) saturate(1.05)',
    },
  };

  const allPresets = Object.values(map);
  const fallbackPool =
    fabricWidth === '2.5'
      ? [
          map['prod-25-kamiz-1'],
          map['prod-25-kamiz-2'],
          map['prod-25-kamiz-3'],
          map['prod-25-skam-1'],
          map['prod-25-koti-1'],
          map['prod-25-gown-1'],
          map['prod-25-gown-2'],
          map['prod-25-custom-2'],
        ]
      : [
          map['prod-35-saree-1'],
          map['prod-35-saree-2'],
          map['prod-35-saree-3'],
          map['prod-35-kamiz-1'],
          map['prod-35-kamiz-2'],
          map['prod-35-kamiz-3'],
          map['prod-35-skam-1'],
          map['prod-35-koti-1'],
          map['prod-35-gown-1'],
          map['prod-35-gown-3'],
        ];

  const pool = fallbackPool.filter(Boolean).length > 0 ? fallbackPool.filter(Boolean) : allPresets;
  const deterministicPreset = pool[hashString(`${productId}-${patternType}-${categorySlug}`) % pool.length];

  const basePreset = map[productId] || deterministicPreset;

  if (viewAngle === 'texture') {
    // Macro zoom into the center of the fabric weave
    return {
      ...basePreset,
      sx: basePreset.sx + basePreset.sw * 0.18,
      sy: basePreset.sy + basePreset.sh * 0.18,
      sw: basePreset.sw * 0.64,
      sh: basePreset.sh * 0.64,
    };
  }
  if (viewAngle === 'drape') {
    return {
      ...basePreset,
      sx: Math.max(0.51, basePreset.sx - 0.02),
      sy: Math.max(0.20, basePreset.sy - 0.015),
    };
  }
  return basePreset;
}

/**
 * Renders an authentic studio textile photograph from the loaded high-res reference assets
 */
function renderPhotographicTextileCrop(
  assets: LoadedStudioAssets,
  params: {
    key: string;
    width: number;
    height: number;
    productId: string;
    patternType: string;
    categorySlug: string;
    fabricWidth: '2.5' | '3.5';
    viewAngle: StudioViewAngle;
  }
): string | null {
  const cached = studioPhotoCache.get(params.key);
  if (cached) return cached;

  const preset = selectStudioCropPreset(
    params.productId,
    params.patternType,
    params.categorySlug,
    params.fabricWidth,
    params.viewAngle
  );

  const img = preset.source === 'category' ? assets.categoryImg : assets.heroImg;
  if (!img) return null;

  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  if (!W || !H) return null;

  const canvas = document.createElement('canvas');
  canvas.width = params.width;
  canvas.height = params.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (preset.filter) {
    ctx.filter = preset.filter;
  }

  ctx.drawImage(
    img,
    preset.sx * W,
    preset.sy * H,
    preset.sw * W,
    preset.sh * H,
    0,
    0,
    params.width,
    params.height
  );

  ctx.filter = 'none';

  const url = canvas.toDataURL('image/jpeg', 0.93);
  studioPhotoCache.set(params.key, url);
  return url;
}

/**
 * Procedural fallback generator if studio assets are still loading
 */
function generateStudioTextilePhoto(params: {
  key: string;
  width: number;
  height: number;
  patternType: string;
  colorHex: string;
  fabricWidth: '2.5' | '3.5';
  categorySlug: string;
  isCollage: boolean;
  collageVariant: 'hero' | '3.5-bahar' | '2.5-bahar';
  viewAngle: StudioViewAngle;
}): string {
  const cached = studioPhotoCache.get(params.key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = params.width;
  canvas.height = params.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const { width, height, patternType, colorHex, fabricWidth, categorySlug, isCollage, collageVariant, viewAngle } = params;
  const seed = hashString(params.key);
  const phase1 = ((seed % 360) * Math.PI) / 180;
  const phase2 = (((seed >> 4) % 360) * Math.PI) / 180;
  const foldAngle = (((seed % 50) - 25) * Math.PI) / 180 + (viewAngle === 'drape' ? 0.12 : 0.45);

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  let baseRgb = hexToRgb(colorHex);
  let accentRgb: [number, number, number] = [212, 175, 106];
  let secondaryRgb: [number, number, number] = [244, 236, 222];

  if (categorySlug === 'saree') {
    if (colorHex === '#C5A46D') baseRgb = [138, 36, 48];
    accentRgb = [226, 190, 112];
    secondaryRgb = [248, 238, 220];
  } else if (categorySlug === 'gown-lehenga') {
    if (colorHex === '#C5A46D' || colorHex === '#2B1B3D') baseRgb = [188, 124, 118];
    accentRgb = [232, 202, 145];
    secondaryRgb = [250, 240, 234];
  } else if (categorySlug === 'gown') {
    if (colorHex === '#C5A46D') baseRgb = [122, 42, 58];
    accentRgb = [218, 182, 124];
    secondaryRgb = [242, 225, 220];
  } else if (categorySlug === 'long-koti') {
    if (colorHex === '#C5A46D' || colorHex === '#2C2A29') baseRgb = [56, 48, 42];
    accentRgb = [214, 176, 104];
    secondaryRgb = [194, 158, 98];
  } else if (categorySlug === 'kamiz') {
    if (colorHex === '#C5A46D' || colorHex === '#1D3557') {
      baseRgb = fabricWidth === '3.5' ? [44, 82, 108] : [168, 82, 62];
    }
    accentRgb = [236, 224, 202];
    secondaryRgb = [212, 168, 96];
  } else if (categorySlug === 'short-kamiz') {
    if (colorHex === '#C5A46D' || colorHex === '#2A4736') {
      baseRgb = fabricWidth === '3.5' ? [82, 112, 92] : [214, 196, 176];
    }
    accentRgb = [246, 242, 234];
    secondaryRgb = [168, 138, 104];
  } else if (categorySlug === 'custom-design') {
    if (colorHex === '#C5A46D') baseRgb = [242, 235, 222];
    accentRgb = [202, 164, 98];
    secondaryRgb = [225, 212, 192];
  }

  if (isCollage) {
    const palettes: Array<{
      base: [number, number, number];
      zari: [number, number, number];
      style: 'jamdani' | 'embroidery' | 'floral' | 'linen' | 'brocade';
    }> =
      collageVariant === '2.5-bahar'
        ? [
            { base: [172, 84, 62], zari: [245, 236, 220], style: 'floral' },
            { base: [218, 202, 182], zari: [250, 246, 238], style: 'linen' },
            { base: [44, 78, 108], zari: [238, 226, 204], style: 'floral' },
            { base: [212, 162, 76], zari: [252, 244, 225], style: 'embroidery' }
          ]
        : collageVariant === '3.5-bahar'
        ? [
            { base: [132, 32, 46], zari: [228, 192, 114], style: 'jamdani' },
            { base: [236, 224, 204], zari: [206, 166, 94], style: 'brocade' },
            { base: [196, 138, 132], zari: [242, 216, 164], style: 'embroidery' },
            { base: [42, 86, 76], zari: [218, 182, 108], style: 'jamdani' }
          ]
        : [
            { base: [238, 228, 212], zari: [204, 164, 92], style: 'jamdani' },
            { base: [142, 38, 50], zari: [230, 194, 116], style: 'jamdani' },
            { base: [198, 144, 134], zari: [244, 222, 176], style: 'embroidery' },
            { base: [52, 88, 106], zari: [238, 226, 204], style: 'floral' },
            { base: [188, 152, 92], zari: [248, 234, 192], style: 'brocade' }
          ];

    const cosA = Math.cos(0.38);
    const sinA = Math.sin(0.38);

    for (let y = 0; y < height; y++) {
      const ny = y / height;
      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const rx = nx * cosA + ny * sinA;
        const ry = -nx * sinA + ny * cosA;

        const bandCount = palettes.length;
        const waveEdge = 0.032 * Math.sin(ry * 14 + nx * 6) + 0.015 * Math.cos(ry * 27);
        const bandPos = (rx * 0.82 + waveEdge) * bandCount;
        const bandIdx = Math.max(0, Math.min(bandCount - 1, Math.floor(bandPos)));
        const localU = bandPos - Math.floor(bandPos);

        const pal = palettes[bandIdx];

        const cylinderArch = Math.sin(localU * Math.PI);
        const pleatWave = 0.18 * Math.sin(localU * Math.PI * 3 + ry * 8);
        const slope = Math.cos(localU * Math.PI) * 1.1 + 0.45 * Math.cos(localU * Math.PI * 3 + ry * 8);

        const edgeShadow = localU < 0.09 ? 0.55 + (localU / 0.09) * 0.45 : 1.0;

        const diffuse = Math.max(0.32, Math.min(1.18, 0.72 + slope * 0.28 + cylinderArch * 0.18));
        const spec = Math.pow(Math.max(0, 1 - Math.abs(slope - 0.35)), 9) * (pal.style === 'linen' || pal.style === 'floral' ? 0.08 : 0.28);

        const uCloth = (x + slope * 18) * 0.85;
        const vCloth = (y + pleatWave * 22) * 0.85;
        const warp = Math.sin(uCloth * 1.9);
        const weft = Math.sin(vCloth * 1.9);
        const weaveDelta = (warp * weft) * 9;

        let r = pal.base[0];
        let g = pal.base[1];
        let b = pal.base[2];

        const mx = ((uCloth + bandIdx * 37) % 44 + 44) % 44 - 22;
        const my = ((vCloth + bandIdx * 23) % 44 + 44) % 44 - 22;
        const dist = Math.sqrt(mx * mx + my * my);
        const angle = Math.atan2(my, mx);

        if (pal.style === 'jamdani') {
          const isZariBorder = localU > 0.78 && localU < 0.93;
          const diamond = Math.abs(mx) + Math.abs(my);
          const petal = dist < 9.5 && Math.cos(angle * 4) > 0.15;
          if (isZariBorder) {
            const borderWeave = Math.sin(uCloth * 0.8) * Math.cos(vCloth * 0.8) > -0.2;
            if (borderWeave) {
              r = pal.zari[0];
              g = pal.zari[1];
              b = pal.zari[2];
            }
          } else if (petal || (diamond < 6 && diamond > 3)) {
            r = pal.zari[0];
            g = pal.zari[1];
            b = pal.zari[2];
          }
        } else if (pal.style === 'embroidery') {
          const rose = dist < 10 + 2.5 * Math.sin(angle * 5) && dist > 2.5;
          const vine = Math.abs(my - 7 * Math.sin(uCloth * 0.12)) < 1.6;
          if (rose || vine) {
            const stitch = 0.88 + 0.24 * Math.sin(uCloth * 1.4 + vCloth * 1.4);
            r = pal.zari[0] * stitch;
            g = pal.zari[1] * stitch;
            b = pal.zari[2] * stitch;
          }
        } else if (pal.style === 'floral') {
          const petalRadius = 7 + 3.5 * Math.cos(angle * 6);
          if (dist < petalRadius) {
            const blend = dist < 3 ? 0.9 : 0.75;
            r = r * (1 - blend) + pal.zari[0] * blend;
            g = g * (1 - blend) + pal.zari[1] * blend;
            b = b * (1 - blend) + pal.zari[2] * blend;
          }
        } else if (pal.style === 'brocade') {
          const brocade = Math.sin(uCloth * 0.22) * Math.sin(vCloth * 0.22) + 0.3 * Math.cos(uCloth * 0.44);
          if (brocade > 0.32) {
            r = pal.zari[0];
            g = pal.zari[1];
            b = pal.zari[2];
          }
        } else if (pal.style === 'linen') {
          const slub = Math.sin(uCloth * 0.15) * Math.cos(vCloth * 1.6);
          if (slub > 0.65) {
            r += 16;
            g += 15;
            b += 12;
          }
        }

        const idx = (y * width + x) * 4;
        const light = diffuse * edgeShadow;
        data[idx] = clampByte((r + weaveDelta) * light + spec * 255);
        data[idx + 1] = clampByte((g + weaveDelta) * light + spec * 245);
        data[idx + 2] = clampByte((b + weaveDelta) * light + spec * 225);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const url = canvas.toDataURL('image/jpeg', 0.92);
    studioPhotoCache.set(params.key, url);
    return url;
  }

  const cosF = Math.cos(foldAngle);
  const sinF = Math.sin(foldAngle);
  const zoomScale = viewAngle === 'texture' ? 2.4 : viewAngle === 'drape' ? 0.85 : 1.0;

  const isSilkOrSatin =
    patternType === 'silk' ||
    patternType === 'jamdani' ||
    patternType === 'chanderi' ||
    categorySlug === 'saree' ||
    categorySlug === 'long-koti';

  const isLinen = patternType === 'linen' || categorySlug === 'short-kamiz';
  const isEmbroidery = patternType === 'embroidery' || categorySlug === 'gown-lehenga';
  const isFloralPrint = patternType === 'floral';
  const hasZariBorder =
    categorySlug === 'saree' ||
    patternType === 'jamdani' ||
    patternType === 'chanderi' ||
    categorySlug === 'custom-design';

  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;

      const rx = nx * cosF + ny * sinF;
      const ry = -nx * sinF + ny * cosF;

      const foldFreq = viewAngle === 'drape' ? 16.0 : viewAngle === 'texture' ? 6.0 : 10.5;
      const w1 = Math.sin(rx * foldFreq + phase1 + 0.35 * Math.sin(ry * 5.2 + phase2));
      const w2 = 0.42 * Math.sin(rx * foldFreq * 2.1 - ry * 3.8 + phase2);
      const w3 = 0.2 * Math.cos(ry * 8.5 + rx * 4.0);
      const clothHeight = (w1 + w2 + w3) / 1.62;

      const d1 = Math.cos(rx * foldFreq + phase1 + 0.35 * Math.sin(ry * 5.2 + phase2));
      const d2 = 0.88 * Math.cos(rx * foldFreq * 2.1 - ry * 3.8 + phase2);
      const normalSlope = (d1 + d2) * (viewAngle === 'texture' ? 0.45 : 0.85);

      const displace = viewAngle === 'texture' ? 8 : 24;
      const u = (x / zoomScale) + clothHeight * displace * cosF;
      const v = (y / zoomScale) + clothHeight * displace * sinF;

      const threadScale = viewAngle === 'texture' ? 0.95 : 1.65;
      const warpThread = Math.sin(u * threadScale);
      const weftThread = Math.sin(v * threadScale);
      let yarnRelief = warpThread * weftThread * (viewAngle === 'texture' ? 16 : 9);

      if (isLinen) {
        const slubWarp = Math.sin(u * 0.19 + seed) * Math.cos(v * 1.3);
        const slubWeft = Math.cos(v * 0.17 + seed) * Math.sin(u * 1.3);
        yarnRelief += (slubWarp + slubWeft) * 11;
      }

      let r = baseRgb[0];
      let g = baseRgb[1];
      let b = baseRgb[2];
      let bumpExtra = 0;
      let isMetallicThread = false;

      const cellSize = isFloralPrint ? 64 : isEmbroidery ? 58 : 52;
      const cellX = Math.floor(u / cellSize);
      const cellY = Math.floor(v / cellSize);
      const rowOffset = (cellY & 1) * (cellSize * 0.5);
      const mu = (((u + rowOffset) % cellSize) + cellSize) % cellSize - cellSize * 0.5;
      const mv = ((v % cellSize) + cellSize) % cellSize - cellSize * 0.5;
      const mDist = Math.sqrt(mu * mu + mv * mv);
      const mAngle = Math.atan2(mv, mu);

      const borderBand = ny + 0.08 * clothHeight;
      if (hasZariBorder && viewAngle !== 'texture' && borderBand > 0.79 && borderBand < 0.94) {
        const borderLocal = (borderBand - 0.79) / 0.15;
        const templeEdge = Math.abs((u % 18) - 9) / 9;
        const inTemple = borderBand < 0.82 && (borderBand - 0.79) / 0.03 > templeEdge;
        const zariWeave = Math.sin(u * 0.9) * Math.cos(v * 0.9) > -0.35;

        if ((borderLocal > 0.18 || inTemple) && zariWeave) {
          r = accentRgb[0];
          g = accentRgb[1];
          b = accentRgb[2];
          isMetallicThread = true;
          bumpExtra = 0.25;
        }
      } else if (patternType === 'jamdani' || categorySlug === 'saree') {
        const diamond = Math.abs(mu) + Math.abs(mv);
        const eightPetal = mDist < 12.5 && mDist > 3.0 && Math.cos(mAngle * 6) > 0.18;
        const centerDot = mDist < 3.2;
        const cornerLeaf = Math.abs(diamond - 14) < 1.8 && (Math.abs(mu) < 4 || Math.abs(mv) < 4);

        if (eightPetal || centerDot || cornerLeaf) {
          const threadPick = (Math.floor(u * 0.8) + Math.floor(v * 0.8)) % 2 === 0;
          if (threadPick || viewAngle !== 'texture') {
            const useSecondary = centerDot;
            const col = useSecondary ? secondaryRgb : accentRgb;
            r = col[0];
            g = col[1];
            b = col[2];
            isMetallicThread = true;
            bumpExtra = 0.22;
          }
        }
      } else if (isEmbroidery) {
        const roseRadius = 11.5 + 3.5 * Math.sin(mAngle * 5 + (seed % 7));
        const inRose = mDist < roseRadius && mDist > 2.8;
        const sequin = mDist <= 2.8;
        const vineWave = Math.abs(mv - 10 * Math.sin(u * 0.09)) < 1.7;
        const leaf = Math.abs(mu - 9 * Math.cos(v * 0.09)) < 2.2 && Math.abs(mv) < 7;

        if (sequin) {
          r = 250;
          g = 232;
          b = 185;
          isMetallicThread = true;
          bumpExtra = 0.45;
        } else if (inRose) {
          const satinStitch = Math.sin(mAngle * 14 + mDist * 0.7);
          const col = satinStitch > 0 ? secondaryRgb : accentRgb;
          r = col[0] + satinStitch * 14;
          g = col[1] + satinStitch * 12;
          b = col[2] + satinStitch * 10;
          bumpExtra = 0.35;
        } else if (vineWave || leaf) {
          r = accentRgb[0];
          g = accentRgb[1];
          b = accentRgb[2];
          isMetallicThread = true;
          bumpExtra = 0.25;
        }
      } else if (isFloralPrint) {
        const blossomRadius = 10.5 + 4.2 * Math.cos(mAngle * 5);
        const innerBud = mDist < 4.2;
        const stem = Math.abs(mu - 8 * Math.sin(v * 0.07)) < 1.4 && mv > 0;
        const smallLeaf =
          Math.sqrt((mu - 14) * (mu - 14) + (mv + 10) * (mv + 10)) < 6.5 &&
          Math.abs(mu - 14 + (mv + 10)) < 5.0;

        if (innerBud) {
          r = secondaryRgb[0] * 0.85 + r * 0.15;
          g = secondaryRgb[1] * 0.85 + g * 0.15;
          b = secondaryRgb[2] * 0.85 + b * 0.15;
        } else if (mDist < blossomRadius) {
          r = accentRgb[0] * 0.82 + r * 0.18;
          g = accentRgb[1] * 0.82 + g * 0.18;
          b = accentRgb[2] * 0.82 + b * 0.18;
        } else if (stem || smallLeaf) {
          r = secondaryRgb[0] * 0.7 + r * 0.3;
          g = secondaryRgb[1] * 0.7 + g * 0.3;
          b = secondaryRgb[2] * 0.7 + b * 0.3;
        }
      } else if (patternType === 'chanderi' || categorySlug === 'long-koti') {
        const damask =
          Math.cos(mu * 0.24) * Math.cos(mv * 0.24) +
          0.4 * Math.cos((mu + mv) * 0.18) * Math.cos((mu - mv) * 0.18);
        if (damask > 0.42 && mDist < 20) {
          r = accentRgb[0];
          g = accentRgb[1];
          b = accentRgb[2];
          isMetallicThread = true;
          bumpExtra = 0.2;
        }
      } else {
        const schiffli = mDist < 6.5 && Math.cos(mAngle * 4) > 0.25;
        const kanthaStitch = Math.abs(mu) < 1.1 && ((Math.floor(v / 5) + cellX) % 3 === 0);
        if (schiffli || kanthaStitch) {
          r = r * 0.35 + accentRgb[0] * 0.65;
          g = g * 0.35 + accentRgb[1] * 0.65;
          b = b * 0.35 + accentRgb[2] * 0.65;
          bumpExtra = 0.18;
        }
      }

      const ambientOcclusion = 0.82 + 0.18 * clothHeight;
      const diffuseLight = Math.max(
        0.34,
        Math.min(1.22, (0.76 + (normalSlope + bumpExtra) * 0.34) * ambientOcclusion)
      );

      const specPower = isMetallicThread ? 11 : isSilkOrSatin ? 8 : 16;
      const specStrength = isMetallicThread ? 0.38 : isSilkOrSatin ? 0.24 : 0.06;
      const specular = Math.pow(Math.max(0, 1 - Math.abs(normalSlope + bumpExtra - 0.38)), specPower) * specStrength;

      const vx = nx - 0.5;
      const vy = ny - 0.5;
      const vignette = 1 - (vx * vx + vy * vy) * 0.22;

      const idx = (y * width + x) * 4;
      const finalLight = diffuseLight * vignette;

      data[idx] = clampByte((r + yarnRelief) * finalLight + specular * 255);
      data[idx + 1] = clampByte((g + yarnRelief) * finalLight + specular * 246);
      data[idx + 2] = clampByte((b + yarnRelief) * finalLight + specular * 228);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  studioPhotoCache.set(params.key, dataUrl);
  return dataUrl;
}

export const FabricPatternVisual: React.FC<FabricPatternVisualProps> = ({
  patternType = 'cotton',
  colorHex = '#C5A46D',
  className = '',
  fabricWidth = '3.5',
  title = '',
  productId = '',
  aspectRatio = 'square',
  zoomOnHover = true,
  enableInteractiveLoupe = false,
  categorySlug = '',
  isCollage = false,
  collageVariant = 'hero',
  viewAngle = 'front'
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [loupePos, setLoupePos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'banner':
        return 'aspect-[21/9] sm:aspect-[24/9]';
      case 'editorial':
        return 'aspect-[16/10]';
      case 'wide':
        return 'aspect-[16/9]';
      case 'portrait':
        return 'aspect-[4/5]';
      case 'square':
      default:
        return 'aspect-[4/3]';
    }
  };

  useEffect(() => {
    let isMounted = true;
    const isWide = aspectRatio === 'wide' || aspectRatio === 'editorial' || aspectRatio === 'banner' || isCollage;
    const width = isWide ? 720 : 640;
    const height = isWide ? 450 : 480;

    const photoKey = `photo-${productId}-${categorySlug}-${patternType}-${fabricWidth}-${viewAngle}-${width}x${height}`;
    const fallbackKey = `proc-${productId}-${title}-${categorySlug}-${patternType}-${colorHex}-${fabricWidth}-${isCollage}-${collageVariant}-${viewAngle}-${width}x${height}`;

    if (!isCollage) {
      const existingPhoto = studioPhotoCache.get(photoKey);
      if (existingPhoto) {
        setDataUrl(existingPhoto);
        return;
      }

      getStudioAssets().then((assets) => {
        if (!isMounted) return;
        const photoUrl = renderPhotographicTextileCrop(assets, {
          key: photoKey,
          width,
          height,
          productId,
          patternType,
          categorySlug,
          fabricWidth,
          viewAngle,
        });

        if (photoUrl) {
          setDataUrl(photoUrl);
        } else {
          const fallbackUrl = generateStudioTextilePhoto({
            key: fallbackKey,
            width,
            height,
            patternType,
            colorHex,
            fabricWidth,
            categorySlug,
            isCollage,
            collageVariant,
            viewAngle,
          });
          setDataUrl(fallbackUrl);
        }
      });
    } else {
      const url = generateStudioTextilePhoto({
        key: fallbackKey,
        width,
        height,
        patternType,
        colorHex,
        fabricWidth,
        categorySlug,
        isCollage,
        collageVariant,
        viewAngle,
      });
      setDataUrl(url);
    }

    return () => {
      isMounted = false;
    };
  }, [productId, title, categorySlug, patternType, colorHex, fabricWidth, isCollage, collageVariant, viewAngle, aspectRatio]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableInteractiveLoupe || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLoupePos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setLoupePos(null)}
      className={`relative overflow-hidden w-full ${getAspectClass()} bg-[#F3EFE6] select-none ${
        enableInteractiveLoupe ? 'cursor-crosshair' : ''
      } ${className}`}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={title || `${fabricWidth} বহর প্রিমিয়াম ফেব্রিক`}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
            zoomOnHover && !enableInteractiveLoupe ? 'group-hover:scale-105' : ''
          }`}
        />
      ) : (
        <div
          className="w-full h-full animate-pulse"
          style={{ backgroundColor: colorHex || '#EDE5D9' }}
        />
      )}

      {/* Interactive Macro Texture Loupe on PDP */}
      {enableInteractiveLoupe && loupePos && dataUrl && (
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-150"
          style={{
            backgroundImage: `url(${dataUrl})`,
            backgroundPosition: `${loupePos.x}% ${loupePos.y}%`,
            backgroundSize: '235%',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute bottom-4 right-4 bg-[#1C1B19]/85 backdrop-blur-xs text-[#FAF8F4] text-xs px-3 py-1.5 rounded-sm tracking-wide">
            ম্যাক্রো বুনন ও সুতার টেক্সচার জুম (২.৪x)
          </div>
        </div>
      )}
    </div>
  );
};
