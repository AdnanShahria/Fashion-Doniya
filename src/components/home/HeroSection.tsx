import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ShoppingCart,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Layers,
  Truck,
  Award,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface HeroSlide {
  id: number;
  kicker: string;
  headlineLine1: string;
  headlineLine2: string;
  mobileHeadline: string;
  mobileSubHeadline: string;
  mobileDescription: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  primaryAction: () => void;
  filterCss: string;
  imageUrl?: string;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Seamlessly inpaints a rectangular/curved region in an ImageData buffer using
 * boundary-sampled Coons-patch bilinear interpolation + smoothstep feathering.
 * Guarantees zero seams, zero rectangular edges, and exact color continuity with surrounding pixels.
 */
function coonsPatchInpaintRect(
  data: Uint8ClampedArray,
  W: number,
  H: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  featherPx: number = 14
) {
  const clampX = (x: number) => Math.max(0, Math.min(W - 1, Math.round(x)));
  const clampY = (y: number) => Math.max(0, Math.min(H - 1, Math.round(y)));

  const getRgb = (x: number, y: number): [number, number, number] => {
    const idx = (clampY(y) * W + clampX(x)) * 4;
    return [data[idx], data[idx + 1], data[idx + 2]];
  };

  // Sample smoothed boundary curves
  const sampleSmoothed = (x: number, y: number, radius: number = 4): [number, number, number] => {
    let r = 0, g = 0, b = 0, count = 0;
    for (let dy = -radius; dy <= radius; dy += 2) {
      for (let dx = -radius; dx <= radius; dx += 2) {
        const [pr, pg, pb] = getRgb(x + dx, y + dy);
        r += pr;
        g += pg;
        b += pb;
        count++;
      }
    }
    return [r / count, g / count, b / count];
  };

  const P00 = sampleSmoothed(x0, y0, 6);
  const P10 = sampleSmoothed(x1, y0, 6);
  const P01 = sampleSmoothed(x0, y1, 6);
  const P11 = sampleSmoothed(x1, y1, 6);

  const topRow: Array<[number, number, number]> = [];
  const botRow: Array<[number, number, number]> = [];
  for (let x = x0; x <= x1; x++) {
    topRow[x - x0] = sampleSmoothed(x, y0, 5);
    botRow[x - x0] = sampleSmoothed(x, y1, 5);
  }

  const leftCol: Array<[number, number, number]> = [];
  const rightCol: Array<[number, number, number]> = [];
  for (let y = y0; y <= y1; y++) {
    leftCol[y - y0] = sampleSmoothed(x0, y, 5);
    rightCol[y - y0] = sampleSmoothed(x1, y, 5);
  }

  const spanX = Math.max(1, x1 - x0);
  const spanY = Math.max(1, y1 - y0);

  for (let y = y0; y <= y1; y++) {
    const t = (y - y0) / spanY;
    const L = leftCol[y - y0];
    const R = rightCol[y - y0];
    const wy = Math.min(
      smoothstep(0, featherPx, y - y0),
      smoothstep(0, featherPx, y1 - y)
    );

    for (let x = x0; x <= x1; x++) {
      const s = (x - x0) / spanX;
      const T = topRow[x - x0];
      const B = botRow[x - x0];
      const wx = Math.min(
        smoothstep(0, featherPx, x - x0),
        smoothstep(0, featherPx, x1 - x)
      );
      const weight = wx * wy;

      const idx = (y * W + x) * 4;
      for (let c = 0; c < 3; c++) {
        const coons =
          (1 - t) * T[c] +
          t * B[c] +
          (1 - s) * L[c] +
          s * R[c] -
          ((1 - s) * (1 - t) * P00[c] +
            s * (1 - t) * P10[c] +
            (1 - s) * t * P01[c] +
            s * t * P11[c]);

        data[idx + c] = Math.round(data[idx + c] * (1 - weight) + coons * weight);
      }
    }
  }
}

export const HeroSection: React.FC = () => {
  const { navigateTo, settings } = useStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [cleanBannerUrl, setCleanBannerUrl] = useState<string>('');
  const [mobilePhotoUrl, setMobilePhotoUrl] = useState<string>('');
  const isMounted = useRef(true);

  const defaultSlides: HeroSlide[] = [
    {
      id: 0,
      kicker: 'PREMIUM FABRIC COLLECTION',
      headlineLine1: 'আপনার পছন্দের কাপড়,',
      headlineLine2: 'এখন গজ হিসেবে',
      mobileHeadline: 'পোশাকে ফুটুক আপনার আভিজাত্য',
      mobileSubHeadline: 'ঐতিহ্যে আধুনিকতা',
      mobileDescription: 'প্রিমিয়াম মানের জামদানি, সিল্ক ও আকর্ষণীয় ডিজাইনের কাপড় বেছে নিন আপনার পছন্দের পোশাক তৈরির জন্য।',
      description: 'প্রিমিয়াম মানের কাপড় বেছে নিন আপনার পছন্দের ডিজাইন ও পোশাক তৈরির জন্য।',
      primaryCta: 'কাপড় কিনুন',
      secondaryCta: 'গজ হিসাব করুন',
      primaryAction: () => navigateTo('shop'),
      filterCss: 'none'
    },
    {
      id: 1,
      kicker: '3.5 BAHAR LUXURY COLLECTION',
      headlineLine1: '৩.৫ বহরের রাজকীয় কাপড়,',
      headlineLine2: 'জোড়া ছাড়াই পোশাক',
      mobileHeadline: '৩.৫ বহরের রাজকীয় কাপড়',
      mobileSubHeadline: 'জোড়া ছাড়াই পোশাক',
      mobileDescription: 'কামিজ, লং কটি, পার্টি গাউন, লেহেঙ্গা ও ১২ হাত শাড়ির জন্য প্রশস্ত ৫৬–৬০ ইঞ্চি বহরের প্রিমিয়াম থান।',
      description: 'কামিজ, লং কটি, পার্টি গাউন, লেহেঙ্গা ও ১২ হাত শাড়ির জন্য প্রশস্ত ৫৬–৬০ ইঞ্চি বহরের প্রিমিয়াম থান।',
      primaryCta: '৩.৫ বহর দেখুন',
      secondaryCta: 'গজ হিসাব করুন',
      primaryAction: () => navigateTo('fabric-width', { width: '3.5' }),
      filterCss: 'none',
      imageUrl: '/assets/aistudio/image_ebb4447e.png'
    },
    {
      id: 2,
      kicker: '2.5 BAHAR ARTISANAL TEXTILES',
      headlineLine1: 'খাঁটি সুতি ও এমব্রয়ডারি,',
      headlineLine2: 'সঠিক গজের নিশ্চয়তা',
      mobileHeadline: 'খাঁটি সুতি ও এমব্রয়ডারি',
      mobileSubHeadline: 'সঠিক গজের নিশ্চয়তা',
      mobileDescription: 'প্রতিদিনের আরামদায়ক কামিজ, শর্ট কুর্তি ও গাউনের জন্য ২.৫ বহরের বাছাইকৃত সুতি, লিনেন ও জর্জেট কাপড়।',
      description: 'প্রতিদিনের আরামদায়ক কামিজ, শর্ট কুর্তি ও গাউনের জন্য ২.৫ বহরের বাছাইকৃত সুতি, লিনেন ও জর্জেট কাপড়।',
      primaryCta: '২.৫ বহর দেখুন',
      secondaryCta: 'গজ হিসাব করুন',
      primaryAction: () => navigateTo('fabric-width', { width: '2.5' }),
      filterCss: 'none',
      imageUrl: '/assets/aistudio/image_fc061659.png'
    },
    {
      id: 3,
      kicker: 'BESPOKE TAILORING YARDAGE',
      headlineLine1: 'বারো হাত শাড়ি বা গাউন,',
      headlineLine2: 'নিজের মাপে অর্ডার করুন',
      mobileHeadline: 'বারো হাত শাড়ি বা গাউন',
      mobileSubHeadline: 'নিজের মাপে অর্ডার করুন',
      mobileDescription: 'আমাদের স্মার্ট গজ ক্যালকুলেটরে আপনার উচ্চতা ও পোশাকের ধরন দিয়ে সহজেই প্রয়োজনীয় গজ জেনে নিন।',
      description: 'আমাদের স্মার্ট গজ ক্যালকুলেটরে আপনার উচ্চতা ও পোশাকের ধরন দিয়ে সহজেই প্রয়োজনীয় গজ জেনে নিন।',
      primaryCta: 'কাস্টম ডিজাইন',
      secondaryCta: 'গজ হিসাব করুন',
      primaryAction: () => navigateTo('custom-design'),
      filterCss: 'none',
      imageUrl: '/assets/aistudio/image_04b252d4.png'
    }
  ];

  const configuredSlides = (settings.homepageConfig?.heroSlides || []).filter(
    (s) => s.isActive !== false && !s.image?.startsWith('/assets/banners/hero_slide_')
  );

  const slides: HeroSlide[] =
    configuredSlides.length > 0
      ? configuredSlides.map((s, idx) => ({
          id: idx,
          kicker: s.badge || defaultSlides[idx % defaultSlides.length].kicker,
          headlineLine1: s.headlineDesktop1 || defaultSlides[idx % defaultSlides.length].headlineLine1,
          headlineLine2: s.headlineDesktop2 || defaultSlides[idx % defaultSlides.length].headlineLine2,
          mobileHeadline: s.headlineMobile1 || defaultSlides[idx % defaultSlides.length].mobileHeadline,
          mobileSubHeadline: s.headlineMobile2 || defaultSlides[idx % defaultSlides.length].mobileSubHeadline,
          mobileDescription: s.priceHighlight || s.subheadline || defaultSlides[idx % defaultSlides.length].mobileDescription,
          description: s.subheadline || defaultSlides[idx % defaultSlides.length].description,
          primaryCta: s.ctaPrimary || defaultSlides[idx % defaultSlides.length].primaryCta,
          secondaryCta: s.ctaSecondary || defaultSlides[idx % defaultSlides.length].secondaryCta,
          primaryAction: () => {
            if (s.ctaPrimaryPage === 'fabric-width' && s.ctaPrimary.includes('২.৫')) {
              navigateTo('fabric-width', { width: '2.5' });
            } else if (s.ctaPrimaryPage === 'fabric-width') {
              navigateTo('fabric-width', { width: '3.5' });
            } else {
              navigateTo(s.ctaPrimaryPage || 'shop');
            }
          },
          filterCss: 'none',
          imageUrl: s.image || undefined
        }))
      : defaultSlides;

  useEffect(() => {
    isMounted.current = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/assets/aistudio/image_51cb33bd.png';

    img.onload = () => {
      if (!isMounted.current) return;
      const canvas = document.createElement('canvas');
      // Exact 2.82:1 aspect ratio of the reference hero banner
      const W = 1600;
      const H = 568;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Crop the exact hero banner from the reference image
      const sx = img.width * 0.0182;
      const sy = img.height * 0.189;
      const sw = img.width * 0.9636;
      const sh = img.height * 0.606;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

      const imgData = ctx.getImageData(0, 0, W, H);
      const data = imgData.data;

      // 2. First remove the 3 small static UI widgets (left arrow, right arrow, bottom-right dots)
      // using Coons-patch boundary interpolation so their background silk is 100% clean
      coonsPatchInpaintRect(data, W, H, Math.round(W * 0.002), Math.round(W * 0.046), Math.round(H * 0.42), Math.round(H * 0.59), 10);
      coonsPatchInpaintRect(data, W, H, Math.round(W * 0.954), Math.round(W * 0.996), Math.round(H * 0.42), Math.round(H * 0.59), 10);
      coonsPatchInpaintRect(data, W, H, Math.round(W * 0.912), Math.round(W * 0.990), Math.round(H * 0.89), Math.round(H * 0.985), 10);

      // 3. Seamlessly reconstruct the left silk backdrop over the baked-in text/buttons area
      // while preserving 100% of the top-left floral corner and 100% of the right-side lantern + fabrics.
      const vTop = Math.round(H * 0.025);
      const vBot = Math.round(H * 0.962);
      const xRight = Math.round(W * 0.452);

      const getLeftBoundaryX = (y: number): number => {
        const v = y / H;
        if (v < 0.38) {
          // Curve smoothly around the top-left floral cluster
          const flowerU = 0.124 * Math.pow(1 - v / 0.38, 1.35) + 0.016;
          return Math.round(W * Math.max(0.044, flowerU));
        }
        return Math.round(W * 0.044);
      };

      const sampleClean = (x: number, y: number, r: number = 5): [number, number, number] => {
        let sr = 0, sg = 0, sb = 0, cnt = 0;
        for (let dy = -r; dy <= r; dy += 2) {
          for (let dx = -r; dx <= r; dx += 2) {
            const cx = Math.max(0, Math.min(W - 1, Math.round(x + dx)));
            const cy = Math.max(0, Math.min(H - 1, Math.round(y + dy)));
            const idx = (cy * W + cx) * 4;
            sr += data[idx];
            sg += data[idx + 1];
            sb += data[idx + 2];
            cnt++;
          }
        }
        return [sr / cnt, sg / cnt, sb / cnt];
      };

      // Pre-sample right boundary, left boundary, top boundary, bottom boundary
      const xLeftTop = getLeftBoundaryX(vTop);
      const xLeftBot = getLeftBoundaryX(vBot);

      const P00 = sampleClean(xLeftTop, vTop, 6);
      const P10 = sampleClean(xRight, vTop, 6);
      const P01 = sampleClean(xLeftBot, vBot, 6);
      const P11 = sampleClean(xRight, vBot, 6);

      const topSamples: Array<[number, number, number]> = [];
      const botSamples: Array<[number, number, number]> = [];
      const numS = 400;
      for (let i = 0; i <= numS; i++) {
        const s = i / numS;
        const xt = xLeftTop + s * (xRight - xLeftTop);
        const xb = xLeftBot + s * (xRight - xLeftBot);
        topSamples[i] = sampleClean(xt, vTop, 6);
        botSamples[i] = sampleClean(xb, vBot, 6);
      }

      const leftSamples: Array<[number, number, number]> = [];
      const rightSamples: Array<[number, number, number]> = [];
      for (let y = vTop; y <= vBot; y++) {
        const xl = getLeftBoundaryX(y);
        leftSamples[y - vTop] = sampleClean(xl, y, 6);
        rightSamples[y - vTop] = sampleClean(xRight, y, 6);
      }

      const featherX = 28;
      const featherY = 22;
      const spanY = Math.max(1, vBot - vTop);

      for (let y = vTop; y <= vBot; y++) {
        const xl = getLeftBoundaryX(y);
        const spanX = Math.max(1, xRight - xl);
        const t = (y - vTop) / spanY;
        const L = leftSamples[y - vTop];
        const R = rightSamples[y - vTop];

        const wy = Math.min(
          smoothstep(0, featherY, y - vTop),
          smoothstep(0, featherY, vBot - y)
        );

        for (let x = xl; x <= xRight; x++) {
          const s = (x - xl) / spanX;
          const sIdx = Math.min(numS, Math.max(0, Math.round(s * numS)));
          const T = topSamples[sIdx];
          const B = botSamples[sIdx];

          const wx = Math.min(
            smoothstep(0, featherX, x - xl),
            smoothstep(0, featherX, xRight - x)
          );
          const weight = wx * wy;

          // Subtle diagonal silk wave harmonic to preserve natural silk drape sheen
          const silkWave =
            2.5 * Math.sin((x / W) * 18 + (y / H) * 9) * Math.sin(s * Math.PI) * Math.sin(t * Math.PI);

          const idx = (y * W + x) * 4;
          for (let c = 0; c < 3; c++) {
            const coons =
              (1 - t) * T[c] +
              t * B[c] +
              (1 - s) * L[c] +
              s * R[c] -
              ((1 - s) * (1 - t) * P00[c] +
                s * (1 - t) * P10[c] +
                (1 - s) * t * P01[c] +
                s * t * P11[c]) +
              silkWave;

            data[idx + c] = Math.max(
              0,
              Math.min(255, Math.round(data[idx + c] * (1 - weight) + coons * weight))
            );
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      try {
        setCleanBannerUrl(canvas.toDataURL('image/jpeg', 0.95));
      } catch {
        setCleanBannerUrl('/assets/aistudio/image_51cb33bd.png');
      }
    };

    // Prepare the dedicated mobile top studio photo from the mobile reference card
    const mobileImg = new Image();
    mobileImg.crossOrigin = 'anonymous';
    mobileImg.src = '/assets/aistudio/image_0746490e.png';

    mobileImg.onload = () => {
      if (!isMounted.current) return;

      // Step 1: Clean the baked-in "03 / 03" pill at 1:1 native resolution (568x537)
      // BEFORE scaling so bilinear interpolation never bleeds dark maroon pixels
      const nW = mobileImg.width;
      const nH = mobileImg.height;
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = nW;
      srcCanvas.height = nH;
      const srcCtx = srcCanvas.getContext('2d');
      if (!srcCtx) return;

      srcCtx.drawImage(mobileImg, 0, 0);
      const nImgData = srcCtx.getImageData(0, 0, nW, nH);
      const nData = nImgData.data;
      const nOrig = new Uint8ClampedArray(nData);

      // In image_0746490e.png (568x537), the "03 / 03" pill + its anti-aliased edge
      // occupies x = 451..520, y = 223..247.
      // Clean boundary lines just outside the pill:
      // Left: x = 450, Right: x = 521, Top: y = 222, Bottom: y = 248 (pure cream silk above the flower at y >= 249)
      const bx0 = Math.round(nW * (450 / 568));
      const bx1 = Math.round(nW * (521 / 568));
      const by0 = Math.round(nH * (222 / 537));
      const by1 = Math.round(nH * (248 / 537));

      const getRGB = (px: number, py: number): [number, number, number] => {
        const cx = Math.max(0, Math.min(nW - 1, px));
        const cy = Math.max(0, Math.min(nH - 1, py));
        const i = (cy * nW + cx) * 4;
        return [nOrig[i], nOrig[i + 1], nOrig[i + 2]];
      };

      const cP00 = getRGB(bx0, by0);
      const cP10 = getRGB(bx1, by0);
      const cP01 = getRGB(bx0, by1);
      const cP11 = getRGB(bx1, by1);

      const spanX = Math.max(1, bx1 - bx0);
      const spanY = Math.max(1, by1 - by0);
      const shiftY = spanY + 2;

      for (let y = by0 + 1; y < by1; y++) {
        const t = (y - by0) / spanY;
        const L = getRGB(bx0, y);
        const R = getRGB(bx1, y);

        for (let x = bx0 + 1; x < bx1; x++) {
          const s = (x - bx0) / spanX;
          const T = getRGB(x, by0);
          const B = getRGB(x, by1);

          // Sample subtle silk weave detail from clean silk directly above (y - shiftY)
          const ty = Math.max(2, y - shiftY);
          const tx = Math.max(2, Math.min(nW - 3, x - 3));
          const tRGB = getRGB(tx, ty);
          const tLeft = getRGB(tx - 1, ty);
          const tRight = getRGB(tx + 1, ty);
          const tUp = getRGB(tx, ty - 1);
          const tDown = getRGB(tx, ty + 1);
          const avgR = (tLeft[0] + tRight[0] + tUp[0] + tDown[0]) * 0.25;
          const avgG = (tLeft[1] + tRight[1] + tUp[1] + tDown[1]) * 0.25;
          const avgB = (tLeft[2] + tRight[2] + tUp[2] + tDown[2]) * 0.25;

          const dR = (tRGB[0] - avgR) * 0.7;
          const dG = (tRGB[1] - avgG) * 0.7;
          const dB = (tRGB[2] - avgB) * 0.7;

          const coonsR =
            (1 - t) * T[0] + t * B[0] + (1 - s) * L[0] + s * R[0] -
            ((1 - s) * (1 - t) * cP00[0] + s * (1 - t) * cP10[0] + (1 - s) * t * cP01[0] + s * t * cP11[0]) + dR;
          const coonsG =
            (1 - t) * T[1] + t * B[1] + (1 - s) * L[1] + s * R[1] -
            ((1 - s) * (1 - t) * cP00[1] + s * (1 - t) * cP10[1] + (1 - s) * t * cP01[1] + s * t * cP11[1]) + dG;
          const coonsB =
            (1 - t) * T[2] + t * B[2] + (1 - s) * L[2] + s * R[2] -
            ((1 - s) * (1 - t) * cP00[2] + s * (1 - t) * cP10[2] + (1 - s) * t * cP01[2] + s * t * cP11[2]) + dB;

          const pIdx = (y * nW + x) * 4;
          nData[pIdx] = Math.max(0, Math.min(255, Math.round(coonsR)));
          nData[pIdx + 1] = Math.max(0, Math.min(255, Math.round(coonsG)));
          nData[pIdx + 2] = Math.max(0, Math.min(255, Math.round(coonsB)));
        }
      }

      srcCtx.putImageData(nImgData, 0, 0);

      // Step 2: Crop exact studio photo frame from cleaned srcCanvas into mCanvas
      const mCanvas = document.createElement('canvas');
      const mW = 960;
      const mH = 516;
      mCanvas.width = mW;
      mCanvas.height = mH;
      const mCtx = mCanvas.getContext('2d');
      if (!mCtx) return;

      const msx = nW * 0.074;
      const msy = nH * 0.064;
      const msw = nW * 0.862;
      const msh = nH * 0.418;
      mCtx.drawImage(srcCanvas, msx, msy, msw, msh, 0, 0, mW, mH);

      try {
        setMobilePhotoUrl(mCanvas.toDataURL('image/jpeg', 0.98));
      } catch {
        setMobilePhotoUrl('/assets/aistudio/image_0746490e.png');
      }
    };

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Auto-advance slider every 6 seconds when not hovered
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const touchStartX = useRef<number | null>(null);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        handleNextSlide();
      } else {
        handlePrevSlide();
      }
    }
    touchStartX.current = null;
    setIsPaused(false);
  };

  const currentSlide = slides[activeSlide];

  const featureCards = [
    {
      title: 'উন্নতমানের কাপড়',
      subtitle: 'নির্বাচিত ও প্রিমিয়াম কোয়ালিটি',
      icon: Award,
      onClick: () => navigateTo('shop')
    },
    {
      title: 'গজ অনুযায়ী ক্রয়',
      subtitle: 'আপনার প্রয়োজন অনুযায়ী গজ নিন',
      icon: Layers,
      onClick: () => navigateTo('calculator')
    },
    {
      title: 'নিরাপদ অর্ডার',
      subtitle: 'সহজ ও নির্ভরযোগ্য অর্ডার প্রক্রিয়া',
      icon: ShieldCheck,
      onClick: () => navigateTo('order-tracking')
    },
    {
      title: 'সারা দেশে ডেলিভারি',
      subtitle: 'বাংলাদেশের যেকোনো স্থানে',
      icon: Truck,
      onClick: () => navigateTo('delivery-policy')
    }
  ];

  return (
    <section className="max-w-[1400px] mx-auto px-2.5 sm:px-6 lg:px-8 pt-2.5 sm:pt-5 pb-3 sm:pb-8 space-y-2.5 sm:space-y-5">
      {/* MOBILE PREMIUM STACKED HERO CARD (< 640px) — Matches reference image_0746490e.png */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="sm:hidden rounded-[22px] bg-[#FAF6F0] border border-[#E8D9C5] p-3 shadow-[0_8px_24px_-10px_rgba(107,8,18,0.10)]"
      >
        {/* Top Luxury Fabric & Lantern Studio Photo */}
        <div className="relative w-full aspect-[960/516] rounded-[16px] overflow-hidden bg-[#F5EAE0]">
          {(currentSlide.imageUrl || mobilePhotoUrl) && (
            <img
              src={currentSlide.imageUrl || mobilePhotoUrl}
              alt={currentSlide.mobileHeadline}
              style={{ filter: currentSlide.filterCss }}
              className="w-full h-full object-cover transition-all duration-500 select-none"
              draggable={false}
            />
          )}

          {/* Bottom-Right Slide Counter Pill (e.g. 01 / 04) */}
          <button
            type="button"
            onClick={handleNextSlide}
            aria-label="পরবর্তী স্লাইড"
            className="absolute bottom-[5.2%] right-[2.2%] z-10 bg-[#5B0810] text-white border border-[#C5A46D]/60 rounded-full px-3 py-0.5 text-[11px] font-bold tracking-wider tabular-nums cursor-pointer"
          >
            {`0${activeSlide + 1} / 0${slides.length}`}
          </button>
        </div>

        {/* Bottom Bengali Content & Dual Pill CTA Buttons */}
        <div className="pt-3.5 px-1 pb-1">
          {/* Gold Kicker + Horizontal Gold Rule */}
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-extrabold tracking-[0.08em] text-[#B37E22] uppercase">
              {currentSlide.kicker}
            </span>
            <span className="w-11 h-[1.5px] bg-[#C59B48] rounded-full shrink-0" />
          </div>

          {/* Main Bold Maroon Headline */}
          <h1 className="text-[20px] min-[380px]:text-[22px] font-extrabold text-[#6E0811] leading-[1.28] tracking-tight mt-1.5">
            {currentSlide.mobileHeadline}
          </h1>

          {/* Golden Italic Sub-headline + Curved Gold Brush Swoosh */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[17px] min-[380px]:text-[18.5px] font-bold italic text-[#B68226] leading-snug">
              {currentSlide.mobileSubHeadline}
            </span>
            <svg
              className="w-14 h-3 text-[#C59B48] shrink-0 translate-y-0.5"
              viewBox="0 0 64 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M2 9.5C18 3.5 40 3.5 62 7.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Supporting Bengali Description */}
          <p className="text-[12.5px] min-[380px]:text-[13px] font-medium text-[#3B2F2D] leading-[1.55] mt-2">
            {currentSlide.mobileDescription}
          </p>

          {/* Two Pill CTA Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-3.5">
            <button
              type="button"
              onClick={currentSlide.primaryAction}
              className="py-2.5 px-3 rounded-full bg-gradient-to-r from-[#820711] to-[#68050D] active:scale-[0.98] text-white font-bold text-[13px] shadow-[0_6px_14px_rgba(110,8,17,0.25)] flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <ShoppingCart className="w-4 h-4 text-white stroke-[2] shrink-0" />
              <span>{currentSlide.primaryCta}</span>
              <ArrowRight className="w-3.5 h-3.5 text-white stroke-[2] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('calculator')}
              className="py-2.5 px-3 rounded-full bg-[#FFFDF9] active:bg-[#FAF3E8] active:scale-[0.98] text-[#6E0811] border-[1.5px] border-[#C69A45] font-bold text-[13px] shadow-[0_2px_8px_rgba(198,154,69,0.12)] flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <Calculator className="w-4 h-4 text-[#B8821E] stroke-[2] shrink-0" />
              <span>{currentSlide.secondaryCta}</span>
            </button>
          </div>
        </div>
      </div>

      {/* LAPTOP / DESKTOP HERO BANNER (Unchanged >= 640px) */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          backgroundImage:
            currentSlide.imageUrl || cleanBannerUrl
              ? `url(${currentSlide.imageUrl || cleanBannerUrl})`
              : undefined,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
          filter: currentSlide.filterCss
        }}
        className="hidden sm:flex relative w-full rounded-2xl overflow-hidden border border-[#E6D8C5] bg-[#F5EAE0] min-h-[380px] lg:min-h-[440px] bg-cover items-center transition-all duration-500"
      >
        {currentSlide.imageUrl && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-[62%] bg-gradient-to-r from-[#FAF4EC]/95 via-[#FAF4EC]/80 to-transparent z-0"
          />
        )}
        {/* Left Content Layer */}
        <div className="relative z-10 w-[54%] lg:w-[48%] pl-14 pr-8 lg:pl-20 lg:pr-6 py-10 space-y-4">
          {/* Small Gold Kicker */}
          <div className="inline-flex items-center gap-1.5">
            <span className="w-6 h-[1px] bg-[#C58B1E]" />
            <span className="text-[11px] font-bold tracking-[0.14em] text-[#9E690C] uppercase whitespace-nowrap">
              {currentSlide.kicker}
            </span>
          </div>

          {/* Clean Bengali Headline */}
          <h1 className="text-4xl lg:text-[44px] font-bold text-[#6B0812] leading-[1.2] tracking-tight">
            <span className="block">{currentSlide.headlineLine1}</span>
            <span className="block mt-0.5 text-[#52050D]">{currentSlide.headlineLine2}</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-[16px] font-normal text-[#4E2A28] leading-relaxed max-w-md line-clamp-2">
            {currentSlide.description}
          </p>

          {/* Clean Minimal CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1.5">
            <button
              type="button"
              onClick={currentSlide.primaryAction}
              className="px-6 py-3 rounded-xl bg-[#6B0812] hover:bg-[#55060E] text-white font-semibold text-[15px] transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShoppingCart className="w-4 h-4 text-white stroke-[1.9] shrink-0" />
              <span>{currentSlide.primaryCta}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('calculator')}
              className="px-6 py-3 rounded-xl bg-[#FFFDF9]/95 hover:bg-[#FAF3E8] text-[#6B0812] border border-[#C58B1E]/80 font-semibold text-[15px] transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Calculator className="w-4 h-4 text-[#B87D14] stroke-[1.9] shrink-0" />
              <span>{currentSlide.secondaryCta}</span>
            </button>
          </div>
        </div>

        {/* Small, Elegant Left Carousel Arrow */}
        <button
          type="button"
          onClick={handlePrevSlide}
          aria-label="পূর্ববর্তী স্লাইড"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#FFFDF9]/90 hover:bg-[#FFFDF9] border border-[#E6D8C5] text-[#6B0812] flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.8]" />
        </button>

        {/* Small, Elegant Right Carousel Arrow */}
        <button
          type="button"
          onClick={handleNextSlide}
          aria-label="পরবর্তী স্লাইড"
          className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#FFFDF9]/90 hover:bg-[#FFFDF9] border border-[#E6D8C5] text-[#6B0812] flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 stroke-[1.8]" />
        </button>

        {/* Small, Elegant Slide Indicators */}
        <div className="absolute bottom-4 right-5 z-20 bg-[#FFFDF9]/85 backdrop-blur-xs border border-[#E6D8C5] px-2 py-1 rounded-full flex items-center gap-1.5">
          {slides.map((slide, idx) => {
            const isActive = idx === activeSlide;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                aria-label={`স্লাইড ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'w-4 bg-[#6B0812]'
                    : 'w-1.5 bg-[#C58B1E]/55 hover:bg-[#6B0812]/60'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* 4 FEATURE CARDS BELOW HERO BANNER (Clean 2-Column Mobile Grid Matching Laptop Aesthetic) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {featureCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div
              key={index}
              onClick={card.onClick}
              className="group bg-[#FFFDF9] rounded-xl border border-[#E6D8C5] hover:border-[#C58B1E] px-2.5 py-2.5 sm:px-4 sm:py-3.5 transition-colors flex items-center gap-2 sm:gap-3.5 cursor-pointer"
            >
              {/* Small Burgundy Outline Icon */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#FAF5ED] border border-[#EAE0D2] flex items-center justify-center text-[#6B0812] shrink-0">
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
              </div>

              {/* Complete Readable Bengali Title & Subtitle */}
              <div className="min-w-0">
                <h3 className="text-[11px] sm:text-[15px] font-bold text-[#6B0812] leading-snug">
                  {card.title}
                </h3>
                <p className="text-[9.5px] sm:text-xs text-[#6E5048] mt-0.5 leading-snug">
                  {card.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
