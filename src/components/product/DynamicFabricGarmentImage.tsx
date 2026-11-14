import React, { useEffect, useState } from 'react';

import sketchKameezImg from '../../assets/images/sketch_kameez_hd_1794420343710.jpg';
import sketchShortKameezImg from '../../assets/images/sketch_short_kameez_custom.png';
import sketchKurtiImg from '../../assets/images/sketch_koti_hd_1794421085126.jpg';
import sketchKamizDupattaImg from '../../assets/images/sketch_kamiz_dupatta_1794419377040.jpg';
import sketchGownImg from '../../assets/images/sketch_gown_1794419378820.jpg';
import sketchLehengaImg from '../../assets/images/sketch_lehenga_1794419380763.jpg';
import sketchSareeImg from '../../assets/images/sketch_saree_1794419379896.jpg';

interface DynamicFabricGarmentImageProps {
  templateSrc: string;
  fabricSrc: string;
  colorTintHex?: string;
  alt: string;
  className?: string;
}

const OUT_W = 420;
const OUT_H = 560;

const enhancedSketchCache = new Map<string, string>();
const pendingEnhanceMap = new Map<string, Promise<string>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

export function resolveSketchArtForGarment(templateSrc: string, alt = ''): string {
  const s = `${templateSrc} ${alt}`.toLowerCase();
  if (s.includes('short_kameez') || s.includes('শর্ট কামিজ') || s.includes('শট কামিজ')) {
    return sketchShortKameezImg;
  }
  if (s.includes('kamiz_dupatta') || s.includes('ওড়না সহ কামিজ') || s.includes('ওড়না সহ কামিজ')) {
    return sketchKamizDupattaImg;
  }
  if (
    s.includes('kurti') ||
    s.includes('koti') ||
    s.includes('কটি') ||
    s.includes('কুর্তি') ||
    s.includes('long_koti')
  ) {
    return sketchKurtiImg;
  }
  if (s.includes('gown') || s.includes('গাউন')) {
    return sketchGownImg;
  }
  if (s.includes('lehenga') || s.includes('লেহেঙ্গা')) {
    return sketchLehengaImg;
  }
  if (s.includes('saree') || s.includes('শাড়ি') || s.includes('শাড়ি')) {
    return sketchSareeImg;
  }
  return sketchKameezImg;
}

/**
 * Tightly crops the watercolor sketch around the garment + hanger (so it never looks distant),
 * and applies unsharp masking + ink-stroke contrast thickening + watercolor saturation boost
 * so thumbnail cards look crystal-clear and focused.
 */
async function buildFocusedSketchDataUrl(sketchSrc: string): Promise<string> {
  if (enhancedSketchCache.has(sketchSrc)) {
    return enhancedSketchCache.get(sketchSrc)!;
  }
  if (pendingEnhanceMap.has(sketchSrc)) {
    return pendingEnhanceMap.get(sketchSrc)!;
  }

  const promise = (async (): Promise<string> => {
    try {
      const img = await loadImage(sketchSrc);
      const srcW = img.width || 768;
      const srcH = img.height || 1024;

      // 1. Detect tight bounding box of the garment & hanger on a fast scan canvas
      const scanW = 240;
      const scanH = 320;
      const scanCanvas = document.createElement('canvas');
      scanCanvas.width = scanW;
      scanCanvas.height = scanH;
      const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true });
      if (!scanCtx) return sketchSrc;

      scanCtx.drawImage(img, 0, 0, scanW, scanH);
      const scanData = scanCtx.getImageData(0, 0, scanW, scanH).data;

      let minX = scanW;
      let minY = scanH;
      let maxX = 0;
      let maxY = 0;

      for (let y = 4; y < scanH - 4; y++) {
        for (let x = 4; x < scanW - 4; x++) {
          const p = (y * scanW + x) * 4;
          const r = scanData[p];
          const g = scanData[p + 1];
          const b = scanData[p + 2];
          // Paper background is ~ (244, 244, 240). Any garment pixel is darker or has pink/wood chroma.
          const isInkOrShadow = r < 216 || g < 216 || b < 212;
          const isPinkOrWood = Math.abs(r - g) > 10 || Math.abs(r - b) > 12;
          if (isInkOrShadow || isPinkOrWood) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX <= minX + 20 || maxY <= minY + 20) {
        minX = 18;
        maxX = scanW - 18;
        minY = 14;
        maxY = scanH - 14;
      }

      // Add a tight 3% margin so the garment is zoomed-in and close-up inside the card
      const padX = Math.round(scanW * 0.028);
      const padY = Math.round(scanH * 0.025);
      minX = Math.max(0, minX - padX);
      maxX = Math.min(scanW - 1, maxX + padX);
      minY = Math.max(0, minY - padY);
      maxY = Math.min(scanH - 1, maxY + padY);

      let boxW = maxX - minX + 1;
      let boxH = maxY - minY + 1;
      const targetAspect = OUT_W / OUT_H; // 0.75 (3:4)
      const currentAspect = boxW / boxH;

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      if (currentAspect > targetAspect) {
        boxH = boxW / targetAspect;
      } else {
        boxW = boxH * targetAspect;
      }

      let cropX = ((centerX - boxW / 2) / scanW) * srcW;
      let cropY = ((centerY - boxH / 2) / scanH) * srcH;
      let cropW = (boxW / scanW) * srcW;
      let cropH = (boxH / scanH) * srcH;

      if (cropX < 0) cropX = 0;
      if (cropY < 0) cropY = 0;
      if (cropX + cropW > srcW) cropW = srcW - cropX;
      if (cropY + cropH > srcH) cropH = srcH - cropY;

      // 2. Render cropped close-up onto OUT_W x OUT_H canvas
      const canvas = document.createElement('canvas');
      canvas.width = OUT_W;
      canvas.height = OUT_H;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return sketchSrc;

      ctx.fillStyle = '#F7F5F0';
      ctx.fillRect(0, 0, OUT_W, OUT_H);
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, OUT_W, OUT_H);

      // 3. Apply Unsharp Mask + Ink Line Boldness + Watercolor Clarity Boost
      const imgData = ctx.getImageData(0, 0, OUT_W, OUT_H);
      const src = new Uint8ClampedArray(imgData.data);
      const dst = imgData.data;

      for (let y = 1; y < OUT_H - 1; y++) {
        for (let x = 1; x < OUT_W - 1; x++) {
          const idx = (y * OUT_W + x) * 4;
          const r = src[idx];
          const g = src[idx + 1];
          const b = src[idx + 2];

          // 3x3 neighborhood average & minimum luminance (for ink line darkening)
          let sumR = 0;
          let sumG = 0;
          let sumB = 0;
          let minLum = 255;

          for (let dy = -1; dy <= 1; dy++) {
            const row = (y + dy) * OUT_W;
            for (let dx = -1; dx <= 1; dx++) {
              const np = (row + (x + dx)) * 4;
              const nr = src[np];
              const ng = src[np + 1];
              const nb = src[np + 2];
              sumR += nr;
              sumG += ng;
              sumB += nb;
              const nLum = nr * 0.299 + ng * 0.587 + nb * 0.114;
              if (nLum < minLum) minLum = nLum;
            }
          }

          const blurR = sumR / 9;
          const blurG = sumG / 9;
          const blurB = sumB / 9;

          // Unsharp mask amount = 1.45 for crisp, focused detail at thumbnail sizes
          const usmAmount = 1.45;
          let nr = r + (r - blurR) * usmAmount;
          let ng = g + (g - blurG) * usmAmount;
          let nb = b + (b - blurB) * usmAmount;

          const lum = r * 0.299 + g * 0.587 + b * 0.114;
          const blurLum = blurR * 0.299 + blurG * 0.587 + blurB * 0.114;

          // Darken fine ink outlines & lace strokes so they stay bold and clear from a distance
          if (blurLum - lum > 4 || lum < 185) {
            const inkBoost = Math.min(0.42, Math.max(0, (205 - lum) / 260));
            nr = nr * (1 - inkBoost) + minLum * 0.65 * inkBoost;
            ng = ng * (1 - inkBoost) + minLum * 0.62 * inkBoost;
            nb = nb * (1 - inkBoost) + minLum * 0.62 * inkBoost;
          }

          // Deepen pastel blush-pink watercolor saturation slightly so the garment pops clearly
          const pinkDelta = nr - ng;
          if (pinkDelta > 7 && nr > 170) {
            nr = Math.min(252, nr + pinkDelta * 0.14);
            ng = Math.max(0, ng - pinkDelta * 0.26);
            nb = Math.max(0, nb - pinkDelta * 0.10);
          }

          dst[idx] = Math.max(0, Math.min(255, Math.round(nr)));
          dst[idx + 1] = Math.max(0, Math.min(255, Math.round(ng)));
          dst[idx + 2] = Math.max(0, Math.min(255, Math.round(nb)));
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const outUrl = canvas.toDataURL('image/jpeg', 0.94);
      enhancedSketchCache.set(sketchSrc, outUrl);
      return outUrl;
    } catch {
      return sketchSrc;
    } finally {
      pendingEnhanceMap.delete(sketchSrc);
    }
  })();

  pendingEnhanceMap.set(sketchSrc, promise);
  return promise;
}

export async function renderGarmentWithFabric(
  templateSrc: string,
  _fabricSrc: string,
  _colorTintHex?: string,
  altText = ''
): Promise<string | null> {
  const rawSketch = resolveSketchArtForGarment(templateSrc, altText);
  return buildFocusedSketchDataUrl(rawSketch);
}

export const DynamicFabricGarmentImage: React.FC<DynamicFabricGarmentImageProps> = ({
  templateSrc,
  alt,
  className
}) => {
  const baseSketchSrc = resolveSketchArtForGarment(templateSrc, alt);
  const [focusedSrc, setFocusedSrc] = useState<string>(() => {
    return enhancedSketchCache.get(baseSketchSrc) || baseSketchSrc;
  });

  useEffect(() => {
    let isMounted = true;
    const cached = enhancedSketchCache.get(baseSketchSrc);
    if (cached) {
      setFocusedSrc(cached);
      return;
    }
    setFocusedSrc(baseSketchSrc);
    buildFocusedSketchDataUrl(baseSketchSrc).then((url) => {
      if (isMounted && url) {
        setFocusedSrc(url);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [baseSketchSrc]);

  return (
    <img
      src={focusedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      loading="lazy"
    />
  );
};
