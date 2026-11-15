import { Product } from '../types';

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** Convert Latin digits in a number or string to Bengali numerals. */
export function toBengaliNumber(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)]);
}

/** Derive a concise, customer-friendly Bengali subtitle for a fabric card. */
export function getProductSubtitle(product: Product): string {
  const name = product.name || '';
  const type = product.fabricType || '';
  const cat = product.category || '';

  if (name.includes('জামদানি') || type.includes('জামদানি')) {
    if (name.includes('রয়েল') || name.includes('প্রিমিয়াম')) {
      return 'প্রিমিয়াম জামদানি ডিজাইন';
    }
    return 'ঐতিহ্যবাহী প্রিমিয়াম ডিজাইন';
  }
  if (name.includes('জর্জেট') || type.includes('জর্জেট')) {
    return 'নরম ও প্রিমিয়াম ফ্যাব্রিক';
  }
  if (name.includes('ফ্লোরাল') || cat.includes('ফ্লোরাল')) {
    if (name.includes('প্রিমিয়াম')) {
      return 'নতুন ও আধুনিক ডিজাইন';
    }
    return 'প্রিমিয়াম ফ্লোরাল ডিজাইন';
  }
  if (name.includes('সিল্ক') || type.includes('সিল্ক')) {
    return 'মুলতানি সিল্ক লাক্সারি ফ্যাব্রিক';
  }
  if (name.includes('সুতি') || type.includes('কটন') || type.includes('সুতি')) {
    return 'আরামদায়ক খাঁটি কটন ফ্যাব্রিক';
  }
  if (type && cat) {
    return `${type} • ${cat}`;
  }
  return type || cat || 'প্রিমিয়াম কাপড়ের কালেকশন';
}

export const COLOR_HEX_MAP: Record<string, string> = {
  'আইভরি': '#F5EFE0',
  'অফ-হোয়াইট': '#FAF6EE',
  'ক্লাসিক ক্রিম': '#EFE5D2',
  'মেরুন': '#6B0812',
  'ডিপ মেরুন': '#58060E',
  'বারগান্ডি': '#721121',
  'গোল্ডেন': '#C89B48',
  'শ্যাম্পেইন গোল্ড': '#D5B26E',
  'অ্যান্টিক গোল্ড': '#B68A3A',
  'এমেরাল্ড গ্রিন': '#14533C',
  'বটল গ্রিন': '#1B4332',
  'অলিভ গ্রিন': '#556B2F',
  'রয়েল ব্লু': '#1D3557',
  'নেভি ব্লু': '#14213D',
  'টিল ব্লু': '#1F5662',
  'ডাস্টি রোজ': '#C08081',
  'ব্লাশ পিঙ্ক': '#E5B3B8',
  'পিচ': '#E8B49A',
  'ব্ল্যাক': '#1F1B1A',
  'চারকোল': '#363230',
  'বেইজ': '#D8C5A8',
  'কপার': '#A85A3A',
  'ল্যাভেন্ডার': '#9D8EC4',
  'মাস্টার্ড': '#C9972B'
};

/** Resolve a display hex color for a Bengali color label. */
export function getColorSwatchHex(colorName: string, fallbackHex: string): string {
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (colorName.includes(key)) return hex;
  }
  return fallbackHex || '#C5A46D';
}
