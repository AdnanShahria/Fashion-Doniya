import { Product } from '../../types';

const imageCache = new Map<string, string>();

function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || '#C5A46D').replace('#', '').trim();
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

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function mix(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  const a = Math.max(0, Math.min(1, t));
  return [
    c1[0] * (1 - a) + c2[0] * a,
    c1[1] * (1 - a) + c2[1] * a,
    c1[2] * (1 - a) + c2[2] * a
  ];
}

function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

type FoldMode =
  | 'diagonal-drape'
  | 'vertical-pleats'
  | 's-wave'
  | 'tailor-rolls'
  | 'fanned-corner'
  | 'soft-billow';

type MotifStyle =
  | 'dhakai-jamdani'
  | 'floral-georgette'
  | 'chanderi-tissue'
  | 'combed-cotton-dobby'
  | 'ivory-jamdani-buti'
  | 'swiss-lawn-embroidery'
  | 'blush-floral-organza'
  | 'linen-chevron-jacquard'
  | 'schiffli-cutwork'
  | 'banarasi-kolka-brocade'
  | 'botanical-sand-georgette'
  | 'espresso-zardozi-silk'
  | 'peach-sequin-georgette'
  | 'berry-butter-silk'
  | 'bridal-mandala-organza'
  | 'pearl-mulmul-muslin'
  | 'muga-tussar-silk'
  | 'terracotta-block-print'
  | 'mustard-nakshi-kantha'
  | 'indigo-voile-buti'
  | 'oatmeal-flax-linen'
  | 'forest-botanical-rayon'
  | 'bronze-damask-jacquard'
  | 'charcoal-khadi-jacquard'
  | 'wine-bubble-georgette'
  | 'rosegold-zari-crepe'
  | 'dustyrose-silky-crepe'
  | 'ivory-handloom-check';

interface ProductVisualSpec {
  base: [number, number, number];
  primaryMotif: [number, number, number];
  secondaryMotif: [number, number, number];
  borderAccent: [number, number, number];
  foldMode: FoldMode;
  foldAngle: number;
  foldFreq: number;
  motifStyle: MotifStyle;
  sheen: number;
  cellScale: number;
}

const PRODUCT_SPECS: Record<string, ProductVisualSpec> = {
  // 1. রয়েল ঢাকাই জামদানি উইভ শাড়ির থান (৩.৫ বহর) - রয়্যাল ক্রিমসন ও গোল্ডেন জরি
  'prod-35-saree-1': {
    base: [134, 24, 38],
    primaryMotif: [236, 198, 112],
    secondaryMotif: [250, 232, 184],
    borderAccent: [224, 182, 92],
    foldMode: 'vertical-pleats',
    foldAngle: 0.18,
    foldFreq: 13.5,
    motifStyle: 'dhakai-jamdani',
    sheen: 0.32,
    cellScale: 54
  },
  // 2. প্রিমিয়াম ফ্লোরাল সিল্কি জর্জেট শাড়ির কাপড় (৩.৫ বহর) - শ্যাম্পেন আইভরি ও ব্লাশ রোজ
  'prod-35-saree-2': {
    base: [242, 231, 213],
    primaryMotif: [208, 102, 118],
    secondaryMotif: [96, 134, 108],
    borderAccent: [228, 162, 172],
    foldMode: 's-wave',
    foldAngle: 0.42,
    foldFreq: 10.0,
    motifStyle: 'floral-georgette',
    sheen: 0.18,
    cellScale: 66
  },
  // 3. হ্যান্ডলুম চান্দেরি টিস্যু সিল্ক শাড়ি ফেব্রিক (৩.৫ বহর) - অ্যান্টিক শ্যাম্পেন গোল্ড
  'prod-35-saree-3': {
    base: [204, 168, 106],
    primaryMotif: [252, 236, 186],
    secondaryMotif: [168, 124, 58],
    borderAccent: [246, 218, 142],
    foldMode: 'diagonal-drape',
    foldAngle: 0.55,
    foldFreq: 11.5,
    motifStyle: 'chanderi-tissue',
    sheen: 0.46,
    cellScale: 50
  },
  // 4. প্রিমিয়াম সফট কম্বড কটন কামিজ থান (৩.৫ বহর) - প্রুশিয়ান টিল ব্লু
  'prod-35-kamiz-1': {
    base: [38, 82, 108],
    primaryMotif: [84, 136, 166],
    secondaryMotif: [212, 228, 236],
    borderAccent: [62, 112, 142],
    foldMode: 'tailor-rolls',
    foldAngle: -0.32,
    foldFreq: 9.5,
    motifStyle: 'combed-cotton-dobby',
    sheen: 0.08,
    cellScale: 36
  },
  // 5. ডিজাইনার জামদানি বুটি কামিজ ফেব্রিক (৩.৫ বহর) - ওয়ার্ম আইভরি ও গোল্ড বুটি
  'prod-35-kamiz-2': {
    base: [238, 224, 202],
    primaryMotif: [194, 148, 68],
    secondaryMotif: [176, 108, 92],
    borderAccent: [208, 164, 82],
    foldMode: 'fanned-corner',
    foldAngle: 0.36,
    foldFreq: 11.0,
    motifStyle: 'ivory-jamdani-buti',
    sheen: 0.22,
    cellScale: 46
  },
  // 6. রেশমি সুতার এমব্রয়ডারি লন কটন থান (৩.৫ বহর) - সেজ গ্রিন ও পার্ল থ্রেড
  'prod-35-kamiz-3': {
    base: [88, 120, 100],
    primaryMotif: [246, 242, 232],
    secondaryMotif: [222, 198, 148],
    borderAccent: [236, 230, 216],
    foldMode: 'vertical-pleats',
    foldAngle: -0.22,
    foldFreq: 12.0,
    motifStyle: 'swiss-lawn-embroidery',
    sheen: 0.14,
    cellScale: 58
  },
  // 7. রয়েল ফ্লোরাল অর্গানজা শর্ট কামিজ ফেব্রিক (৩.৫ বহর) - ব্লাশ রোজ ও গোল্ডেন থ্রেড
  'prod-35-skam-1': {
    base: [222, 168, 164],
    primaryMotif: [248, 226, 172],
    secondaryMotif: [252, 244, 240],
    borderAccent: [218, 178, 106],
    foldMode: 'soft-billow',
    foldAngle: 0.48,
    foldFreq: 9.0,
    motifStyle: 'blush-floral-organza',
    sheen: 0.36,
    cellScale: 62
  },
  // 8. লিনেন জ্যাকার্ড শর্ট কামিজ ও টপস ফেব্রিক (৩.৫ বহর) - আর্থি স্যান্ড বেজ
  'prod-35-skam-2': {
    base: [201, 180, 159],
    primaryMotif: [235, 222, 206],
    secondaryMotif: [162, 138, 114],
    borderAccent: [182, 158, 134],
    foldMode: 'tailor-rolls',
    foldAngle: 0.28,
    foldFreq: 8.5,
    motifStyle: 'linen-chevron-jacquard',
    sheen: 0.07,
    cellScale: 42
  },
  // 9. শিফলি কাটওয়ার্ক কটন শর্ট কুর্তি ফেব্রিক (৩.৫ বহর) - অলিভ সেজ গ্রিন
  'prod-35-skam-3': {
    base: [76, 106, 86],
    primaryMotif: [148, 178, 156],
    secondaryMotif: [34, 52, 40],
    borderAccent: [226, 232, 220],
    foldMode: 'diagonal-drape',
    foldAngle: -0.4,
    foldFreq: 10.5,
    motifStyle: 'schiffli-cutwork',
    sheen: 0.09,
    cellScale: 52
  },
  // 10. লাক্সারি বেনারসি ব্রোকেড জ্যাকার্ড লং কটি ফেব্রিক (৩.৫ বহর) - অ্যান্টিক ব্রোঞ্জ গোল্ড
  'prod-35-koti-1': {
    base: [132, 96, 46],
    primaryMotif: [242, 208, 124],
    secondaryMotif: [252, 234, 176],
    borderAccent: [228, 188, 96],
    foldMode: 'diagonal-drape',
    foldAngle: 0.62,
    foldFreq: 11.0,
    motifStyle: 'banarasi-kolka-brocade',
    sheen: 0.42,
    cellScale: 58
  },
  // 11. ডিজাইনার বোটানিক্যাল প্রিন্ট জর্জেট কটি ফেব্রিক (৩.৫ বহর) - ওয়ার্ম স্যান্ড ও ফ্লোরাল মোটিফ
  'prod-35-koti-2': {
    base: [222, 205, 182],
    primaryMotif: [178, 84, 62],
    secondaryMotif: [58, 104, 88],
    borderAccent: [198, 138, 68],
    foldMode: 's-wave',
    foldAngle: -0.35,
    foldFreq: 11.5,
    motifStyle: 'botanical-sand-georgette',
    sheen: 0.14,
    cellScale: 64
  },
  // 12. রয়েল জারদোজি এমব্রয়ডারি র-সিল্ক কটি ফেব্রিক (৩.৫ বহর) - এসপ্রেসো ব্রাউন ও গোল্ড জরি
  'prod-35-koti-3': {
    base: [58, 44, 38],
    primaryMotif: [232, 192, 104],
    secondaryMotif: [194, 132, 68],
    borderAccent: [242, 208, 126],
    foldMode: 'vertical-pleats',
    foldAngle: 0.24,
    foldFreq: 10.0,
    motifStyle: 'espresso-zardozi-silk',
    sheen: 0.34,
    cellScale: 56
  },
  // 13. লাক্সারি জারদোজি এমব্রয়ডারি জর্জেট গাউন থান (৩.৫ বহর) - ডাস্টি রোজ পিচ ও সিকোয়েন্স
  'prod-35-gown-1': {
    base: [201, 136, 128],
    primaryMotif: [250, 232, 186],
    secondaryMotif: [244, 204, 188],
    borderAccent: [238, 206, 138],
    foldMode: 'fanned-corner',
    foldAngle: -0.48,
    foldFreq: 13.0,
    motifStyle: 'peach-sequin-georgette',
    sheen: 0.28,
    cellScale: 54
  },
  // 14. সফট বাটার সিল্ক পার্টি গাউন ফেব্রিক (৩.৫ বহর) - ডিপ বেরি মেরুন
  'prod-35-gown-2': {
    base: [118, 32, 50],
    primaryMotif: [168, 58, 78],
    secondaryMotif: [218, 168, 118],
    borderAccent: [152, 46, 66],
    foldMode: 'soft-billow',
    foldAngle: 0.38,
    foldFreq: 12.5,
    motifStyle: 'berry-butter-silk',
    sheen: 0.48,
    cellScale: 48
  },
  // 15. ব্রাইডাল জরি ও রেশম এমব্রয়ডারি অরগানজা লেহেঙ্গা থান (৩.৫ বহর) - শ্যাম্পেন গোল্ড ও আইভরি
  'prod-35-gown-3': {
    base: [228, 210, 178],
    primaryMotif: [204, 154, 64],
    secondaryMotif: [252, 246, 234],
    borderAccent: [192, 138, 52],
    foldMode: 'vertical-pleats',
    foldAngle: -0.15,
    foldFreq: 14.0,
    motifStyle: 'bridal-mandala-organza',
    sheen: 0.38,
    cellScale: 60
  },
  // 16. লাক্সারি মলমল মসলিন কটন কাস্টম থান (৩.৫ বহর) - পার্ল আইভরি ও গোল্ড সেলভেজ
  'prod-35-custom-1': {
    base: [244, 239, 229],
    primaryMotif: [212, 174, 98],
    secondaryMotif: [228, 218, 200],
    borderAccent: [204, 162, 82],
    foldMode: 'soft-billow',
    foldAngle: 0.3,
    foldFreq: 9.5,
    motifStyle: 'pearl-mulmul-muslin',
    sheen: 0.16,
    cellScale: 48
  },
  // 17. পিওর মুগা তসর সিল্ক কাস্টম ফেব্রিক (৩.৫ বহর) - র-গোল্ডেন হানি বেজ
  'prod-35-custom-2': {
    base: [200, 168, 116],
    primaryMotif: [236, 208, 152],
    secondaryMotif: [148, 96, 52],
    borderAccent: [168, 112, 58],
    foldMode: 'tailor-rolls',
    foldAngle: -0.26,
    foldFreq: 10.0,
    motifStyle: 'muga-tussar-silk',
    sheen: 0.35,
    cellScale: 50
  },
  // 18. হ্যান্ড-ব্লক প্রিন্ট সুতি কামিজ ফেব্রিক (২.৫ বহর) - টেরাকোটা রাস্ট ও ক্রিম ব্লক
  'prod-25-kamiz-1': {
    base: [168, 78, 58],
    primaryMotif: [246, 234, 214],
    secondaryMotif: [46, 52, 62],
    borderAccent: [238, 218, 188],
    foldMode: 'diagonal-drape',
    foldAngle: 0.44,
    foldFreq: 10.5,
    motifStyle: 'terracotta-block-print',
    sheen: 0.08,
    cellScale: 52
  },
  // 19. ডিজাইনার নকশি কাঁথা এমব্রয়ডারি কামিজ ফেব্রিক (২.৫ বহর) - রয়্যাল মাস্টার্ড ও কাঁথা স্টিচ
  'prod-25-kamiz-2': {
    base: [201, 148, 54],
    primaryMotif: [250, 242, 226],
    secondaryMotif: [124, 32, 42],
    borderAccent: [246, 236, 212],
    foldMode: 'fanned-corner',
    foldAngle: -0.36,
    foldFreq: 11.0,
    motifStyle: 'mustard-nakshi-kantha',
    sheen: 0.12,
    cellScale: 50
  },
  // 20. প্রিমিয়াম বেক্সি ভয়েল ও সুতি কামিজ থান (২.৫ বহর) - ইনডিগো নীল ও আইভরি বুটি
  'prod-25-kamiz-3': {
    base: [42, 72, 106],
    primaryMotif: [244, 238, 226],
    secondaryMotif: [148, 188, 218],
    borderAccent: [224, 216, 198],
    foldMode: 'vertical-pleats',
    foldAngle: 0.25,
    foldFreq: 12.0,
    motifStyle: 'indigo-voile-buti',
    sheen: 0.09,
    cellScale: 42
  },
  // 21. প্রিমিয়াম অর্গানিক পিওর ফ্লেক্স লিনেন (২.৫ বহর) - ন্যাচারাল ওটমিল বেজ
  'prod-25-skam-1': {
    base: [218, 200, 186],
    primaryMotif: [242, 232, 222],
    secondaryMotif: [168, 146, 128],
    borderAccent: [148, 126, 108],
    foldMode: 'soft-billow',
    foldAngle: -0.28,
    foldFreq: 8.5,
    motifStyle: 'oatmeal-flax-linen',
    sheen: 0.06,
    cellScale: 44
  },
  // 22. বোটানিক্যাল প্রিন্ট ভিসকোস রেয়ন ফেব্রিক (২.৫ বহর) - ফরেস্ট সেজ ফ্লোরাল
  'prod-25-skam-2': {
    base: [48, 86, 64],
    primaryMotif: [244, 234, 218],
    secondaryMotif: [224, 138, 112],
    borderAccent: [218, 182, 108],
    foldMode: 's-wave',
    foldAngle: 0.52,
    foldFreq: 11.0,
    motifStyle: 'forest-botanical-rayon',
    sheen: 0.16,
    cellScale: 62
  },
  // 23. লাক্সারি ডামাস্ক জ্যাকার্ড লং কটি ফেব্রিক (২.৫ বহর) - অ্যান্টিক ব্রোঞ্জ গোল্ড
  'prod-25-koti-1': {
    base: [112, 82, 38],
    primaryMotif: [226, 188, 108],
    secondaryMotif: [246, 222, 158],
    borderAccent: [204, 162, 84],
    foldMode: 'tailor-rolls',
    foldAngle: -0.45,
    foldFreq: 10.5,
    motifStyle: 'bronze-damask-jacquard',
    sheen: 0.36,
    cellScale: 60
  },
  // 24. হ্যান্ডলুম খাদি কটন জ্যাকার্ড কটি থান (২.৫ বহর) - চারকোল টোপ ও গোল্ড সুতো
  'prod-25-koti-2': {
    base: [68, 60, 54],
    primaryMotif: [214, 172, 92],
    secondaryMotif: [232, 222, 202],
    borderAccent: [198, 152, 74],
    foldMode: 'diagonal-drape',
    foldAngle: 0.32,
    foldFreq: 9.5,
    motifStyle: 'charcoal-khadi-jacquard',
    sheen: 0.1,
    cellScale: 46
  },
  // 25. সফট পার্টি ওয়্যার বাবল জর্জেট গাউন ফেব্রিক (২.৫ বহর) - ডিপ ওয়াইন বেরি
  'prod-25-gown-1': {
    base: [104, 34, 54],
    primaryMotif: [148, 56, 82],
    secondaryMotif: [72, 18, 34],
    borderAccent: [188, 128, 142],
    foldMode: 'vertical-pleats',
    foldAngle: -0.3,
    foldFreq: 13.5,
    motifStyle: 'wine-bubble-georgette',
    sheen: 0.15,
    cellScale: 38
  },
  // 26. জরির বুটি ক্র্যাপ সিল্ক গাউন থান (২.৫ বহর) - শ্যাম্পেন রোজ গোল্ড
  'prod-25-gown-2': {
    base: [199, 152, 136],
    primaryMotif: [248, 222, 156],
    secondaryMotif: [252, 240, 218],
    borderAccent: [236, 198, 118],
    foldMode: 's-wave',
    foldAngle: 0.4,
    foldFreq: 11.5,
    motifStyle: 'rosegold-zari-crepe',
    sheen: 0.34,
    cellScale: 48
  },
  // 27. সিল্কি ক্র্যাপ কাস্টম ড্রেস ফেব্রিক (২.৫ বহর) - ডাস্টি রোজ টোপ
  'prod-25-custom-1': {
    base: [188, 124, 126],
    primaryMotif: [222, 168, 170],
    secondaryMotif: [148, 88, 92],
    borderAccent: [236, 198, 198],
    foldMode: 'fanned-corner',
    foldAngle: 0.5,
    foldFreq: 10.5,
    motifStyle: 'dustyrose-silky-crepe',
    sheen: 0.3,
    cellScale: 44
  },
  // 28. আর্টিজানাল হ্যান্ডলুম কটন সিল্ক থান (২.৫ বহর) - আইভরি স্যান্ড ও গোল্ড বর্ডার
  'prod-25-custom-2': {
    base: [228, 218, 203],
    primaryMotif: [198, 156, 82],
    secondaryMotif: [166, 118, 62],
    borderAccent: [212, 172, 92],
    foldMode: 'tailor-rolls',
    foldAngle: 0.22,
    foldFreq: 10.0,
    motifStyle: 'ivory-handloom-check',
    sheen: 0.24,
    cellScale: 48
  }
};

function buildSpecForDynamicProduct(product: Product): ProductVisualSpec {
  const existing = PRODUCT_SPECS[product.id];
  if (existing) return existing;

  const seed = hashStr(`${product.id}-${product.name}-${product.color}-${product.fabricType}`);
  const base = hexToRgb(product.colorHex || '#C5A46D');
  const foldModes: FoldMode[] = [
    'diagonal-drape',
    'vertical-pleats',
    's-wave',
    'tailor-rolls',
    'fanned-corner',
    'soft-billow'
  ];

  let motifStyle: MotifStyle = 'ivory-jamdani-buti';
  if (product.patternType === 'floral') motifStyle = 'floral-georgette';
  else if (product.patternType === 'embroidery') motifStyle = 'swiss-lawn-embroidery';
  else if (product.patternType === 'chanderi') motifStyle = 'banarasi-kolka-brocade';
  else if (product.patternType === 'linen') motifStyle = 'linen-chevron-jacquard';
  else if (product.patternType === 'silk') motifStyle = 'berry-butter-silk';
  else if (product.patternType === 'cotton') motifStyle = 'combed-cotton-dobby';

  return {
    base,
    primaryMotif: [238, 206, 132],
    secondaryMotif: [248, 242, 230],
    borderAccent: [212, 172, 96],
    foldMode: foldModes[seed % foldModes.length],
    foldAngle: (((seed % 70) - 35) * Math.PI) / 180,
    foldFreq: 9.5 + (seed % 5),
    motifStyle,
    sheen: product.patternType === 'silk' || product.patternType === 'chanderi' ? 0.36 : 0.14,
    cellScale: 46 + (seed % 18)
  };
}

export function getUniqueProductFabricImage(product: Product): string {
  // If product has an explicit uploaded photo URL or data URI from admin, use it
  if (
    product.images &&
    product.images.length > 0 &&
    (product.images[0].startsWith('http') ||
      product.images[0].startsWith('data:image') ||
      product.images[0].startsWith('/'))
  ) {
    return product.images[0];
  }

  const cacheKey = `all-prod-img-v2-${product.id}-${product.colorHex}-${product.patternType}-${product.fabricType}`;
  const cached = imageCache.get(cacheKey);
  if (cached) return cached;

  const width = 320;
  const height = 240;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const spec = buildSpecForDynamicProduct(product);
  const seed = hashStr(product.id + product.name);
  const phaseA = ((seed % 360) * Math.PI) / 180;
  const phaseB = (((seed >> 5) % 360) * Math.PI) / 180;

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const cosA = Math.cos(spec.foldAngle);
  const sinA = Math.sin(spec.foldAngle);
  const cell = spec.cellScale;

  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;

      // Rotated cloth coordinates
      const rx = nx * cosA + ny * sinA;
      const ry = -nx * sinA + ny * cosA;

      // 1. Distinct 3D Fold & Drape Topology per FoldMode
      let clothHeight = 0;
      let slope = 0;
      let rollShadow = 1.0;

      if (spec.foldMode === 'tailor-rolls') {
        const bandPos = (rx * 0.85 + 0.03 * Math.sin(ry * 9 + phaseA) + 1.2) * 3.2;
        const localU = bandPos - Math.floor(bandPos);
        clothHeight = Math.sin(localU * Math.PI);
        slope = Math.cos(localU * Math.PI) * 1.15;
        rollShadow = localU < 0.08 ? 0.58 + (localU / 0.08) * 0.42 : 1.0;
      } else if (spec.foldMode === 'fanned-corner') {
        const dx = nx + 0.15;
        const dy = ny + 0.12;
        const fanAngle = Math.atan2(dy, dx);
        const fanRadius = Math.sqrt(dx * dx + dy * dy);
        const w1 = Math.sin(fanAngle * spec.foldFreq * 1.4 + phaseA);
        const w2 = 0.35 * Math.cos(fanRadius * 14 - fanAngle * 4);
        clothHeight = (w1 + w2) / 1.35;
        slope = Math.cos(fanAngle * spec.foldFreq * 1.4 + phaseA) * 0.95;
      } else if (spec.foldMode === 's-wave') {
        const sCurve = rx + 0.12 * Math.sin(ry * Math.PI * 2.2 + phaseA);
        const w1 = Math.sin(sCurve * spec.foldFreq + phaseB);
        const w2 = 0.38 * Math.sin(sCurve * spec.foldFreq * 1.9 - ry * 4.5);
        clothHeight = (w1 + w2) / 1.38;
        slope =
          (Math.cos(sCurve * spec.foldFreq + phaseB) +
            0.7 * Math.cos(sCurve * spec.foldFreq * 1.9 - ry * 4.5)) *
          0.75;
      } else if (spec.foldMode === 'vertical-pleats') {
        const pleatX = nx + 0.04 * Math.sin(ny * 7.5 + phaseA);
        const w1 = Math.sin(pleatX * spec.foldFreq + phaseA);
        const w2 = 0.3 * Math.sin(pleatX * spec.foldFreq * 2.2 + phaseB);
        clothHeight = (w1 + w2) / 1.3;
        slope =
          (Math.cos(pleatX * spec.foldFreq + phaseA) +
            0.6 * Math.cos(pleatX * spec.foldFreq * 2.2 + phaseB)) *
          0.82;
      } else if (spec.foldMode === 'soft-billow') {
        const w1 = Math.sin(rx * spec.foldFreq * 0.78 + phaseA + 0.4 * Math.cos(ry * 5.0));
        const w2 = 0.45 * Math.cos(ry * spec.foldFreq * 0.65 - rx * 3.5 + phaseB);
        clothHeight = (w1 + w2) / 1.45;
        slope = Math.cos(rx * spec.foldFreq * 0.78 + phaseA) * 0.85;
      } else {
        // diagonal-drape
        const w1 = Math.sin(rx * spec.foldFreq + phaseA + 0.3 * Math.sin(ry * 5.5 + phaseB));
        const w2 = 0.4 * Math.sin(rx * spec.foldFreq * 2.0 - ry * 3.6 + phaseB);
        clothHeight = (w1 + w2) / 1.4;
        slope =
          (Math.cos(rx * spec.foldFreq + phaseA) +
            0.75 * Math.cos(rx * spec.foldFreq * 2.0 - ry * 3.6 + phaseB)) *
          0.8;
      }

      // Surface cloth UV coordinates warped by fold height (mapped to 640x480 space for exact motif scale)
      const u = nx * 640 + clothHeight * 22 * cosA;
      const v = ny * 480 + clothHeight * 22 * sinA;

      // 2. Base Yarn & Micro-Weave Texture
      const warp = Math.sin(u * 1.75);
      const weft = Math.sin(v * 1.75);
      let yarnDelta = warp * weft * 8.5;

      let r = spec.base[0];
      let g = spec.base[1];
      let b = spec.base[2];
      let bump = 0;
      let isMetallic = false;

      // Cell coordinates for repeating motifs
      const cellX = Math.floor(u / cell);
      const cellY = Math.floor(v / cell);
      const stagger = (cellY & 1) * (cell * 0.5);
      const mu = (((u + stagger) % cell) + cell) % cell - cell * 0.5;
      const mv = ((v % cell) + cell) % cell - cell * 0.5;
      const dist = Math.sqrt(mu * mu + mv * mv);
      const angle = Math.atan2(mv, mu);

      // 3. Product-Specific Pattern & Textile Surface Synthesis
      switch (spec.motifStyle) {
        case 'dhakai-jamdani': {
          // Saree zari temple border at bottom + Dhakai geometric diamond floral butis
          const borderPos = ny + 0.06 * clothHeight;
          if (borderPos > 0.77 && borderPos < 0.94) {
            const temple = Math.abs((u % 22) - 11) / 11;
            const inTemple = borderPos < 0.81 && (borderPos - 0.77) / 0.04 > temple;
            const zariWeave = Math.sin(u * 0.95) * Math.cos(v * 0.95) > -0.25;
            if ((borderPos >= 0.81 || inTemple) && zariWeave) {
              [r, g, b] = spec.borderAccent;
              isMetallic = true;
              bump = 0.26;
            }
          } else {
            const diamond = Math.abs(mu) + Math.abs(mv);
            const outerRing = Math.abs(diamond - 14) < 2.1;
            const innerStar = dist < 9.5 && Math.cos(angle * 8) > 0.25;
            const centerGem = dist < 3.0;
            if (outerRing || innerStar || centerGem) {
              const col = centerGem ? spec.secondaryMotif : spec.primaryMotif;
              [r, g, b] = col;
              isMetallic = true;
              bump = 0.24;
            }
          }
          break;
        }

        case 'floral-georgette': {
          // Watercolor botanical rose bouquets + green leaves on champagne ivory georgette
          const petalR = 12.5 + 4.2 * Math.cos(angle * 5) + 2.0 * Math.sin(angle * 3);
          const centerR = 4.0;
          const leaf1 =
            Math.sqrt((mu - 14) * (mu - 14) + (mv - 10) * (mv - 10)) < 7.5 &&
            Math.abs(mu - 14 - (mv - 10)) < 4.5;
          const leaf2 =
            Math.sqrt((mu + 13) * (mu + 13) + (mv + 9) * (mv + 9)) < 6.8 &&
            Math.abs(mu + 13 + (mv + 9)) < 4.2;
          const stem = Math.abs(mu - 6 * Math.sin(v * 0.06)) < 1.3 && dist > 10;

          if (dist < centerR) {
            [r, g, b] = [218, 164, 78];
          } else if (dist < petalR) {
            const ringT = (dist - centerR) / (petalR - centerR);
            const petalCol = mix(spec.primaryMotif, spec.borderAccent, ringT * 0.7);
            [r, g, b] = mix([r, g, b], petalCol, 0.86);
          } else if (leaf1 || leaf2 || stem) {
            [r, g, b] = mix([r, g, b], spec.secondaryMotif, 0.78);
          }
          break;
        }

        case 'chanderi-tissue': {
          // Metallic golden tissue warp sheen + zari border + small lotus butis
          const tissueShimmer = Math.sin(u * 0.65) * 10 + Math.cos(v * 1.4) * 6;
          yarnDelta += tissueShimmer;
          const borderPos = ny + 0.05 * clothHeight;
          if (borderPos > 0.74 && borderPos < 0.92) {
            const stripe = Math.sin((borderPos - 0.74) * 90) > -0.3;
            if (stripe) {
              [r, g, b] = spec.primaryMotif;
              isMetallic = true;
              bump = 0.22;
            }
          } else {
            const lotus = dist < 8.5 && Math.cos(angle * 6) > 0.3;
            if (lotus) {
              [r, g, b] = spec.primaryMotif;
              isMetallic = true;
              bump = 0.2;
            }
          }
          break;
        }

        case 'combed-cotton-dobby': {
          // Crisp combed cotton weave + subtle tonal geometric Swiss-dot dobby
          const dobbyDot = Math.abs(mu) + Math.abs(mv) < 4.2;
          const fineCheck = Math.abs(mu) < 0.9 || Math.abs(mv) < 0.9;
          if (dobbyDot) {
            [r, g, b] = mix([r, g, b], spec.secondaryMotif, 0.55);
            bump = 0.16;
          } else if (fineCheck) {
            [r, g, b] = mix([r, g, b], spec.primaryMotif, 0.35);
          }
          break;
        }

        case 'ivory-jamdani-buti': {
          // All-over small Jamdani diamond & floral butis on warm ivory cotton-silk
          const diamond = Math.abs(mu) + Math.abs(mv);
          const buti =
            (diamond < 8.5 && diamond > 4.2) ||
            (dist < 4.0) ||
            (Math.abs(mu) < 1.8 && Math.abs(mv) < 9.5) ||
            (Math.abs(mv) < 1.8 && Math.abs(mu) < 9.5);
          if (buti) {
            const useCopper = (cellX + cellY) % 3 === 0 && dist < 4.0;
            [r, g, b] = useCopper ? spec.secondaryMotif : spec.primaryMotif;
            isMetallic = true;
            bump = 0.2;
          }
          break;
        }

        case 'swiss-lawn-embroidery': {
          // Raised pearl-white & gold floral vine embroidery on sage green Swiss lawn
          const vine = Math.abs(mu - 9 * Math.sin(v * 0.075)) < 1.6;
          const flower = dist < 9.5 + 2.8 * Math.cos(angle * 5) && dist > 2.5;
          const centerBead = dist <= 2.5;
          if (centerBead) {
            [r, g, b] = spec.secondaryMotif;
            isMetallic = true;
            bump = 0.35;
          } else if (flower || vine) {
            const stitchWave = 0.9 + 0.18 * Math.sin(u * 1.5 + v * 1.5);
            [r, g, b] = [
              spec.primaryMotif[0] * stitchWave,
              spec.primaryMotif[1] * stitchWave,
              spec.primaryMotif[2] * stitchWave
            ];
            bump = 0.3;
          }
          break;
        }

        case 'blush-floral-organza': {
          // Sheer blush rose organza with golden zari outline & ivory blossom embroidery
          const organzaGrid = ((Math.floor(u) + Math.floor(v)) & 1) * 6;
          yarnDelta += organzaGrid;
          const petal = 11.5 + 3.8 * Math.sin(angle * 5);
          const isOutline = Math.abs(dist - petal) < 1.8 || Math.abs(dist - 3.5) < 1.2;
          if (isOutline) {
            [r, g, b] = spec.primaryMotif;
            isMetallic = true;
            bump = 0.28;
          } else if (dist < petal && dist > 3.5) {
            [r, g, b] = mix([r, g, b], spec.secondaryMotif, 0.65);
            bump = 0.14;
          }
          break;
        }

        case 'linen-chevron-jacquard': {
          // Flax linen slub + self-woven herringbone chevron jacquard
          const slub =
            Math.sin(u * 0.16 + seed) * Math.cos(v * 1.4) +
            Math.cos(v * 0.14) * Math.sin(u * 1.3);
          yarnDelta += slub * 12;
          const chevron = Math.sin((u * 0.35) + Math.abs((v % 28) - 14) * 0.45);
          if (chevron > 0.45) {
            [r, g, b] = mix([r, g, b], spec.primaryMotif, 0.65);
            bump = 0.18;
          } else if (chevron < -0.55) {
            [r, g, b] = mix([r, g, b], spec.secondaryMotif, 0.4);
          }
          break;
        }

        case 'schiffli-cutwork': {
          // Olive sage cotton with dark eyelet holes & satin-stitched cutwork rings
          const isEyeletHole = dist < 4.2;
          const isEyeletRim = dist >= 4.2 && dist < 7.2;
          const petalRing =
            dist >= 8.5 && dist < 13.5 && Math.cos(angle * 8) > 0.2;
          if (isEyeletHole) {
            [r, g, b] = spec.secondaryMotif;
            bump = -0.35;
          } else if (isEyeletRim || petalRing) {
            [r, g, b] = petalRing ? spec.primaryMotif : spec.borderAccent;
            bump = 0.32;
          }
          break;
        }

        case 'banarasi-kolka-brocade': {
          // Rich Banarasi gold brocade with paisley/kolka and lattice jaal
          const kolkaCurve = Math.sqrt(
            Math.pow(mu - 3 * Math.sin(mv * 0.15), 2) + Math.pow(mv * 0.85, 2)
          );
          const inKolka =
            kolkaCurve < 13.5 &&
            kolkaCurve > 3.5 &&
            Math.cos(angle * 4 + dist * 0.2) > -0.15;
          const lattice =
            Math.abs(Math.abs(mu) + Math.abs(mv) - 22) < 1.8;
          if (inKolka || lattice) {
            [r, g, b] = inKolka ? spec.primaryMotif : spec.borderAccent;
            isMetallic = true;
            bump = 0.3;
          }
          break;
        }

        case 'botanical-sand-georgette': {
          // Botanical leaves & terracotta blooms on warm sand georgette
          const fernLeaf =
            Math.abs(mv - 0.6 * mu) < 7.5 &&
            Math.abs(mu) < 15 &&
            Math.cos((mu + mv) * 0.7) > 0.1;
          const blossom =
            Math.sqrt((mu + 10) * (mu + 10) + (mv - 8) * (mv - 8)) <
            7.5 + 2.2 * Math.cos(angle * 5);
          if (blossom) {
            [r, g, b] = mix([r, g, b], spec.primaryMotif, 0.85);
          } else if (fernLeaf) {
            [r, g, b] = mix([r, g, b], spec.secondaryMotif, 0.8);
          }
          break;
        }

        case 'espresso-zardozi-silk': {
          // Horizontal raw-silk slubs on espresso brown + heavy gold zardozi medallions
          const rawSlub = Math.sin(v * 0.45 + Math.sin(u * 0.08) * 3) * 10;
          yarnDelta += rawSlub;
          const medallion =
            (dist < 14 && dist > 10.5) ||
            (dist < 8.5 && Math.cos(angle * 6) > 0.2) ||
            dist < 3.0;
          const arch = Math.abs(Math.abs(mu) - 18) < 1.5 && Math.abs(mv) < 14;
          if (medallion || arch) {
            [r, g, b] = dist < 3.0 ? spec.secondaryMotif : spec.primaryMotif;
            isMetallic = true;
            bump = 0.35;
          }
          break;
        }

        case 'peach-sequin-georgette': {
          // Dusty rose peach georgette + diamond trellis + sparkling sequins
          const trellis = Math.abs(Math.abs(mu) + Math.abs(mv) - 18) < 1.5;
          const floret = dist < 7.5 && Math.cos(angle * 4) > 0.25;
          const sequinDot =
            dist < 2.8 ||
            Math.sqrt((mu - 12) * (mu - 12) + (mv - 12) * (mv - 12)) < 2.2;
          if (sequinDot) {
            [r, g, b] = [255, 245, 205];
            isMetallic = true;
            bump = 0.45;
          } else if (trellis || floret) {
            [r, g, b] = spec.primaryMotif;
            isMetallic = true;
            bump = 0.24;
          }
          break;
        }

        case 'berry-butter-silk': {
          // Pure liquid-satin butter silk in deep berry maroon with subtle tonal sheen weave
          const satinTwill = Math.sin((u + v * 1.6) * 1.2) * 6;
          yarnDelta = satinTwill;
          const subtleHighlight = Math.max(0, Math.sin(rx * spec.foldFreq + phaseA));
          [r, g, b] = mix(spec.base, spec.primaryMotif, subtleHighlight * 0.35);
          break;
        }

        case 'bridal-mandala-organza': {
          // Champagne gold & ivory bridal organza with heavy zari mandala & lehenga border
          const mandala =
            (Math.abs(dist - 15) < 1.8) ||
            (dist < 12 && dist > 5 && Math.cos(angle * 8) > 0.15) ||
            dist < 3.5;
          const jaal = Math.abs(Math.abs(mu) - Math.abs(mv)) < 1.4 && dist > 15;
          if (mandala || jaal) {
            [r, g, b] = dist < 3.5 ? spec.secondaryMotif : spec.primaryMotif;
            isMetallic = true;
            bump = 0.32;
          }
          break;
        }

        case 'pearl-mulmul-muslin': {
          // Gossamer pearl ivory mulmul muslin + golden zari selvedge band + subtle jamdani dot
          const gauze = (Math.sin(u * 1.3) + Math.cos(v * 1.3)) * 5;
          yarnDelta = gauze;
          const selvedgePos = nx + 0.04 * clothHeight;
          if (selvedgePos > 0.82 && selvedgePos < 0.91) {
            [r, g, b] = spec.primaryMotif;
            isMetallic = true;
            bump = 0.22;
          } else if (dist < 2.6 && (cellX + cellY) % 2 === 0) {
            [r, g, b] = spec.primaryMotif;
            isMetallic = true;
            bump = 0.16;
          }
          break;
        }

        case 'muga-tussar-silk': {
          // Raw golden honey Muga Tussar wild silk with horizontal slubs & tribal stripe band
          const wildSlub =
            Math.sin(v * 0.55 + Math.cos(u * 0.05) * 4) * 12 +
            Math.cos(v * 1.8) * 5;
          yarnDelta += wildSlub;
          const stripeBand = ny + 0.04 * clothHeight;
          if (stripeBand > 0.76 && stripeBand < 0.88) {
            const stripePattern = Math.sin((stripeBand - 0.76) * 140) > 0;
            [r, g, b] = stripePattern ? spec.secondaryMotif : spec.primaryMotif;
            isMetallic = true;
            bump = 0.2;
          }
          break;
        }

        case 'terracotta-block-print': {
          // Hand-block print cream & charcoal-indigo motifs on terracotta rust cotton
          const blockFrame = Math.abs(Math.abs(mu) - 16) < 1.5 && Math.abs(mv) < 16;
          const blockFlower = dist < 10.5 && Math.cos(angle * 6) > 0.1;
          const blockCenter = dist < 4.2;
          if (blockCenter || blockFrame) {
            [r, g, b] = spec.secondaryMotif;
          } else if (blockFlower) {
            [r, g, b] = spec.primaryMotif;
          }
          break;
        }

        case 'mustard-nakshi-kantha': {
          // Running-stitch Nakshi Kantha embroidery on royal mustard cotton
          const waveY = ((v + 12 * Math.sin(u * 0.08)) % 24 + 24) % 24;
          const isDash = Math.floor(u / 4) % 2 === 0;
          const runningWave = waveY < 2.0 && isDash;
          const kanthaWheel =
            (Math.abs(dist - 11) < 1.6 || Math.abs(dist - 6) < 1.5) && isDash;
          if (kanthaWheel) {
            [r, g, b] = dist < 8 ? spec.secondaryMotif : spec.primaryMotif;
            bump = 0.28;
          } else if (runningWave) {
            [r, g, b] = spec.primaryMotif;
            bump = 0.22;
          }
          break;
        }

        case 'indigo-voile-buti': {
          // Indigo blue cotton voile with crisp ivory & sky-blue small diamond-flower butis
          const diamond = Math.abs(mu) + Math.abs(mv);
          const smallButi = diamond < 7.5 && diamond > 2.8;
          const centerDot = diamond <= 2.8;
          if (centerDot) {
            [r, g, b] = spec.secondaryMotif;
          } else if (smallButi) {
            [r, g, b] = spec.primaryMotif;
            bump = 0.14;
          }
          break;
        }

        case 'oatmeal-flax-linen': {
          // Organic oatmeal flax linen with pronounced cross-hatched linen slub yarns
          const warpSlub =
            Math.sin(u * 0.22 + seed) * Math.pow(Math.cos(v * 0.9), 2) * 16;
          const weftSlub =
            Math.cos(v * 0.2 + seed) * Math.pow(Math.sin(u * 0.9), 2) * 16;
          yarnDelta += warpSlub + weftSlub;
          if (Math.abs(u % 64) < 2.2) {
            [r, g, b] = mix([r, g, b], spec.secondaryMotif, 0.35);
          }
          break;
        }

        case 'forest-botanical-rayon': {
          // Forest sage green viscose rayon with cream, coral & gold botanical print
          const tropicalPetal = dist < 12 + 4.5 * Math.sin(angle * 5);
          const coralCore = dist < 5.0;
          const leafBlade =
            Math.abs(mu + mv * 0.8 - 14) < 4.5 && Math.abs(mu - mv) < 12;
          if (coralCore) {
            [r, g, b] = spec.secondaryMotif;
          } else if (tropicalPetal) {
            [r, g, b] = mix([r, g, b], spec.primaryMotif, 0.85);
          } else if (leafBlade) {
            [r, g, b] = mix([r, g, b], spec.borderAccent, 0.75);
          }
          break;
        }

        case 'bronze-damask-jacquard': {
          // Symmetrical classical baroque Damask jacquard weave in burnished bronze & gold
          const symX = Math.abs(mu);
          const symY = Math.abs(mv);
          const damaskCrest =
            Math.cos(symX * 0.22) * Math.cos(symY * 0.22) +
            0.45 * Math.cos((symX + symY) * 0.16);
          if (damaskCrest > 0.35 && dist < 22) {
            [r, g, b] = damaskCrest > 0.65 ? spec.secondaryMotif : spec.primaryMotif;
            isMetallic = true;
            bump = 0.26;
          }
          break;
        }

        case 'charcoal-khadi-jacquard': {
          // Charcoal taupe handspun khadi basket weave + golden geometric tribal bands
          const khadiSlub =
            ((Math.floor(u / 3) + Math.floor(v / 3)) % 2 === 0 ? 7 : -7) +
            Math.sin(v * 0.3) * 6;
          yarnDelta += khadiSlub;
          const bandY = ((v % 46) + 46) % 46;
          if (bandY > 16 && bandY < 30) {
            const zig = Math.abs(((u % 16) - 8)) + Math.abs(bandY - 23);
            if (zig < 6.5) {
              [r, g, b] = zig < 3.0 ? spec.secondaryMotif : spec.primaryMotif;
              bump = 0.22;
            }
          }
          break;
        }

        case 'wine-bubble-georgette': {
          // Deep wine berry heavy pebble/bubble crinkle georgette texture
          const pebble1 = Math.sin(u * 0.55 + Math.cos(v * 0.45) * 2.5);
          const pebble2 = Math.cos(v * 0.55 - Math.sin(u * 0.45) * 2.5);
          const bubbleRelief = pebble1 * pebble2 * 22;
          yarnDelta += bubbleRelief;
          bump = pebble1 * pebble2 * 0.28;
          break;
        }

        case 'rosegold-zari-crepe': {
          // Champagne rose-gold crepe silk with golden zari star-flower butis
          const starButi =
            (dist < 8.0 && Math.cos(angle * 6) > 0.35) || dist < 2.6;
          if (starButi) {
            [r, g, b] = dist < 2.6 ? spec.secondaryMotif : spec.primaryMotif;
            isMetallic = true;
            bump = 0.25;
          }
          break;
        }

        case 'dustyrose-silky-crepe': {
          // Smooth dusty-rose taupe silky crepe with fine crepe grain & fanned sheen
          const crepeGrain = Math.sin(u * 1.1 + Math.sin(v * 0.9) * 1.8) * 6;
          yarnDelta = crepeGrain;
          const sheenWave = Math.max(0, Math.cos(rx * spec.foldFreq + phaseA));
          [r, g, b] = mix(spec.base, spec.primaryMotif, sheenWave * 0.32);
          break;
        }

        case 'ivory-handloom-check': {
          // Ivory sand handloom cotton-silk with golden katan warp/weft checks & temple border
          const checkU = Math.abs(mu) < 1.6;
          const checkV = Math.abs(mv) < 1.6;
          const borderPos = ny + 0.05 * clothHeight;
          if (borderPos > 0.78 && borderPos < 0.92) {
            [r, g, b] = spec.primaryMotif;
            isMetallic = true;
            bump = 0.22;
          } else if (checkU || checkV) {
            [r, g, b] = checkU && checkV ? spec.secondaryMotif : spec.primaryMotif;
            isMetallic = true;
            bump = 0.15;
          }
          break;
        }
      }

      // 4. Studio Lighting, Fold Shadows & Specular Highlights
      const ao = 0.82 + 0.18 * clothHeight;
      const diffuse = Math.max(
        0.34,
        Math.min(1.22, (0.76 + (slope + bump) * 0.34) * ao * rollShadow)
      );

      const specPower = isMetallic ? 10 : spec.sheen > 0.3 ? 8 : 16;
      const specAmp = isMetallic ? 0.42 : spec.sheen;
      const specular =
        Math.pow(Math.max(0, 1 - Math.abs(slope + bump - 0.36)), specPower) *
        specAmp;

      const vx = nx - 0.5;
      const vy = ny - 0.5;
      const vignette = 1 - (vx * vx + vy * vy) * 0.2;

      const finalLight = diffuse * vignette;
      const idx = (y * width + x) * 4;

      data[idx] = clamp((r + yarnDelta) * finalLight + specular * 255);
      data[idx + 1] = clamp((g + yarnDelta) * finalLight + specular * 245);
      data[idx + 2] = clamp((b + yarnDelta) * finalLight + specular * 224);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const url = canvas.toDataURL('image/jpeg', 0.92);
  imageCache.set(cacheKey, url);
  return url;
}
