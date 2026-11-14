import { useState, useEffect } from 'react';
import { INITIAL_PRODUCTS } from '../data/seedData';

export type AppLanguage = 'BN' | 'EN';

const STORAGE_KEY = 'fdbd_site_language';

let currentLang: AppLanguage = (() => {
  if (typeof window === 'undefined') return 'BN';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'EN' ? 'EN' : 'BN';
})();

const listeners = new Set<(lang: AppLanguage) => void>();

// Build exact dictionary starting with all seed product names -> nameEn
const EXACT_PHRASE_MAP: Record<string, string> = {};
for (const prod of INITIAL_PRODUCTS) {
  if (prod.name && prod.nameEn) {
    EXACT_PHRASE_MAP[prod.name.trim()] = `${prod.nameEn} (${prod.fabricWidth} Bahar)`;
  }
}

const STATIC_DICTIONARY: Record<string, string> = {
  // Brand & Header
  'প্রিমিয়াম কাপড়, এখন গজ হিসেবে': 'Premium Fabric, Now by the Yard',
  'কাপড়ের নাম, ডিজাইন বা ক্যাটাগরি খুঁজুন...': 'Search fabric name, design or category...',
  'খুঁজুন': 'Search',
  'অ্যাকাউন্ট': 'Account',
  'উইশলিস্ট': 'Wishlist',
  'সকল ক্যাটাগরি': 'All Categories',
  'হোম': 'Home',
  '৩.৫ বহর কাপড়': '3.5 Bahar Fabric',
  '২.৫ বহর কাপড়': '2.5 Bahar Fabric',
  '৩.৫ বহর কাপড় (সকল)': '3.5 Bahar Fabric (All)',
  '২.৫ বহর কাপড় (সকল)': '2.5 Bahar Fabric (All)',
  'সকল কাপড়': 'All Fabrics',
  'শাড়ি': 'Saree',
  'শাড়ি': 'Saree',
  'কামিজ': 'Kameez',
  'শর্ট কামিজ': 'Short Kameez',
  'শট কামিজ': 'Short Kameez',
  'কুর্তি': 'Kurti',
  'ওড়না সহ কামিজ': 'Kameez with Orna',
  'ওড়না সহ কামিজ': 'Kameez with Orna',
  'লং কটি': 'Long Koti',
  'কোটি': 'Koti',
  'গাউন': 'Gown',
  'লেহেঙ্গা': 'Lehenga',
  'গাউন / লেহেঙ্গা': 'Gown / Lehenga',
  'লেহেঙ্গা / গাউন': 'Lehenga / Gown',
  'ব্লাউজ': 'Blouse',
  'কাস্টম ডিজাইন': 'Custom Design',
  'এআই আউটফিট': 'AI Outfit',
  'গজ হিসাব': 'Yard Calculator',
  'গজ ক্যালকুলেটর': 'Yard Calculator',
  'গজ হিসাব ক্যালকুলেটর': 'Yard Calculator',
  'পোশাকের ক্যাটাগরি': 'Garment Categories',
  'এআই ফ্যাব্রিক টু আউটফিট স্টুডিও': 'AI Fabric to Outfit Studio',
  '✨ এআই ফ্যাব্রিক টু আউটফিট': '✨ AI Fabric to Outfit',
  'সেবা ও অন্যান্য': 'Services & More',
  'অর্ডার ট্র্যাকিং': 'Order Tracking',
  'কাস্টম ডিজাইন কাপড়': 'Custom Design Fabric',
  'ডেমো অ্যাডমিন প্যানেল': 'Demo Admin Panel',
  'লগআউট': 'Logout',
  'লগইন / রেজিস্টার': 'Login / Register',
  'আমার অ্যাকাউন্ট': 'My Account',
  'ভাষা পরিবর্তন': 'Switch Language',

  // Product Card & Grid
  'কার্টে যোগ করুন': 'Add to Cart',
  'এখনই কিনুন': 'Buy Now',
  '৩.৫ বহর': '3.5 Bahar',
  '২.৫ বহর': '2.5 Bahar',
  '/ গজ': '/ Yard',
  '/গজ': '/Yard',
  'গজ': 'Yard',
  'বিস্তারিত দেখুন': 'View Details',
  'কুইক ভিউ': 'Quick View',
  'কুইক ভিউ দেখুন': 'Quick View',
  'সব দেখুন →': 'View All →',
  'সব দেখুন': 'View All',

  // Product Details Page
  'এই কাপড় দিয়ে আপনি যা যা বানাতে পারবেন': 'What You Can Make With This Fabric',
  'এই কাপড় দিয়ে আপনি যা যা বানাতে পারবেন': 'What You Can Make With This Fabric',
  'পোশাকের মাপ ও কাস্টমাইজেশন অপশন': 'Garment Size & Customization Options',
  'স্ট্যান্ডার্ড সাইজ': 'Standard Size',
  'ডিফল্ট রেগুলার সাইজ': 'Default Regular Size',
  'নিজের মাপে কাস্টমাইজ করুন': 'Customize to Your Size',
  'শরীরের মাপ ও গজ দিন': 'Enter Body Measurements & Yards',
  'কাস্টম ফিটিং ✂️': 'Custom Fitting ✂️',
  '২. অতিরিক্ত পোশাকের অংশ যোগ করুন (ঐচ্ছিক):': '2. Add Extra Garment Parts (Optional):',
  'প্যান্ট, সেটের ওড়না, ইনার ইত্যাদি': 'Pant, Set Orna, Inner, etc.',
  'ইনার (Inner)': 'Inner Lining (Inner)',
  'প্যান্ট (Pant)': 'Trouser / Pant (Pant)',
  'প্লাজো (Palazzo)': 'Palazzo Pant (Palazzo)',
  'সেটের ওড়না (Orna)': 'Matching Set Orna (Orna)',
  'স্কার্ট (Skirt)': 'Flared Skirt (Skirt)',
  'ব্লাউজ (Blouse)': 'Blouse Piece (Blouse)',
  'মূল পোশাকের সেটের কাপড়': 'Main Dress Set Fabric',
  'স্ট্যান্ডার্ড কাপড়': 'Standard Fabric',
  'সমজাতীয় কালেকশন': 'Similar Collection',
  'হোমে ফিরে যান': 'Back to Home',
  'পিছনে যান': 'Go Back',
  'ফেব্রিক প্রোডাক্ট কালেকশন': 'Fabric Product Collection',
  'সকল প্রোডাক্ট তালিকায় ফিরে যান': 'Back to All Products',
  'এই প্রোডাক্টটি নির্বাচন করুন': 'Select This Product',
  'জনপ্রিয়': 'Popular',
  'জনপ্রিয় প্রোডাক্ট': 'Popular Product',
  'নির্বাচিত': 'Selected',
  'বেছে নিন': 'Choose',
  'দেখুন': 'View',
  'সম্পন্ন': 'Done',
  'বন্ধ করুন': 'Close',

  // Categories & Subtitles
  'প্রিমিয়াম জামদানি ডিজাইন': 'Premium Jamdani Design',
  'ঐতিহ্যবাহী প্রিমিয়াম ডিজাইন': 'Traditional Premium Design',
  'নরম ও প্রিমিয়াম ফ্যাব্রিক': 'Soft & Premium Fabric',
  'নতুন ও আধুনিক ডিজাইন': 'New & Modern Design',
  'প্রিমিয়াম ফ্লোরাল ডিজাইন': 'Premium Floral Design',
  'মুলতানি সিল্ক লাক্সারি ফ্যাব্রিক': 'Luxury Multani Silk Fabric',
  'আরামদায়ক খাঁটি কটন ফ্যাব্রিক': 'Comfortable Pure Cotton Fabric',
  'প্রিমিয়াম কাপড়ের কালেকশন': 'Premium Fabric Collection',

  // Fabric Types
  'জামদানি জরি সিল্ক': 'Jamdani Zari Silk',
  'বোটানিক্যাল প্রিন্ট সিল্কি জর্জেট': 'Botanical Print Silky Georgette',
  'পিওর চান্দেরি সিল্ক': 'Pure Chanderi Silk',
  '১০০% পিওর কটন': '100% Pure Cotton',
  'জামদানি কটন সিল্ক': 'Jamdani Cotton Silk',
  'সুইস লন এমব্রয়ডারি': 'Swiss Lawn Embroidery',
  'পিওর ফ্লোরাল অর্গানজা': 'Pure Floral Organza',
  'ফ্লেক্স লিনেন জ্যাকার্ড': 'Flax Linen Jacquard',
  'শিফলি এমব্রয়ডারি কটন': 'Schiffli Embroidered Cotton',
  'বেনারসি ব্রোকেড জ্যাকার্ড': 'Banarasi Brocade Jacquard',
  'বোটানিক্যাল প্রিন্ট জর্জেট': 'Botanical Print Georgette',
  'এমব্রয়ডারি র-সিল্ক': 'Embroidered Raw Silk',
  'ওয়েটলেস এমব্রয়ডারি জর্জেট': 'Weightless Embroidered Georgette',
  'পিওর বাটার সিল্ক': 'Pure Butter Silk',
  'বাটার সিল্ক (Butter Silk)': 'Butter Silk',
  'সেন্টুন সিল্ক (Pure Shantoon)': 'Pure Shantoon Silk',
  '১০০% পিওর সুতি ভয়েল': '100% Pure Cotton Voile',
  'সিল্কি ক্রেপ': 'Silky Crepe',
  'চান্দেরি সিল্ক': 'Chanderi Silk',
  'র সিল্ক (Raw Silk)': 'Raw Silk',
  'লাইক্রা কটন': 'Lycra Stretch Cotton',
  'হেভি সিল্কি জর্জেট': 'Heavy Silky Georgette',
  'সফট কটন': 'Soft Cotton',
  'হেভি স্যাটিন সিল্ক': 'Heavy Satin Silk',
  'বেনারসি ব্রোকেড সিল্ক': 'Banarasi Brocade Silk',
  'র সিল্ক': 'Raw Silk',
  'ব্রাইডাল অরগানজা সিল্ক': 'Bridal Organza Silk',
  'মলমল মসলিন কটন': 'Mulmul Muslin Cotton',
  'পিওর তসর সিল্ক': 'Pure Tussar Silk',
  '১০০% ব্লক প্রিন্ট কটন': '100% Block Print Cotton',
  'এমব্রয়ডারি কটন': 'Embroidered Cotton',
  'সুতি কটন ভয়েল': 'Cotton Voile',
  'পিওর ফ্লেক্স লিনেন': 'Pure Flax Linen',
  'ভিসকোস রেয়ন': 'Viscose Rayon',
  'ব্রোকেড জ্যাকার্ড': 'Brocade Jacquard',
  'খাদি জ্যাকার্ড': 'Khadi Jacquard',
  'হেভি বাবল জর্জেট': 'Heavy Bubble Georgette',
  'জরি ক্র্যাপ সিল্ক': 'Zari Crepe Silk',
  'পিওর সিল্কি ক্র্যাপ': 'Pure Silky Crepe',
  'হ্যান্ডলুম কটন সিল্ক': 'Handloom Cotton Silk',

  // Colors
  'রয়্যাল ক্রিমসন ও গোল্ডেন জরি': 'Royal Crimson & Golden Zari',
  'আইভরি গোল্ড': 'Ivory Gold',
  'এমারেল্ড গ্রিন': 'Emerald Green',
  'শ্যাম্পেন আইভরি ও ব্লাশ রোজ': 'Champagne Ivory & Blush Rose',
  'টিল গ্রিন ফ্লোরাল': 'Teal Green Floral',
  'মেরুন জারদোজ': 'Maroon Zardozi',
  'অ্যান্টিক শ্যাম্পেন গোল্ড': 'Antique Champagne Gold',
  'কাজল ব্ল্যাক ও জরি': 'Kajal Black & Zari',
  'রুবী রেড': 'Ruby Red',
  'প্রুশিয়ান টিল ব্লু': 'Prussian Teal Blue',
  'সফট অলিভ': 'Soft Olive',
  'পাউডার রোজ': 'Powder Rose',
  'ওয়ার্ম আইভরি ও গোল্ড বুটি': 'Warm Ivory & Gold Buti',
  'সি-গ্রিন': 'Sea Green',
  'ডিপ নেভি': 'Deep Navy',
  'সেজ গ্রিন ও পার্ল থ্রেড': 'Sage Green & Pearl Thread',
  'ডাস্টি পিচ': 'Dusty Peach',
  'মাস্টার্ড গোল্ড': 'Mustard Gold',
  'ব্লাশ রোজ ও গোল্ডেন থ্রেড': 'Blush Rose & Golden Thread',
  'আইসি মিন্ট': 'Icy Mint',
  'শ্যাম্পেন ক্রিম': 'Champagne Cream',
  'আর্থি স্যান্ড বেজ': 'Earthy Sand Beige',
  'অলিভ গ্রিন': 'Olive Green',
  'টেরাকোটা রাস্ট': 'Terracotta Rust',
  'অলিভ সেজ গ্রিন': 'Olive Sage Green',
  'অফ-হোয়াইট আইভরি': 'Off-White Ivory',
  'কোরাল পিচ': 'Coral Peach',
  'অ্যান্টিক ব্রোঞ্জ গোল্ড': 'Antique Bronze Gold',
  'এসপ্রেসো চারকোল জরি': 'Espresso Charcoal Zari',
  'মেরুন ব্রোকেড': 'Maroon Brocade',
  'ওয়ার্ম স্যান্ড ও ফ্লোরাল মোটিফ': 'Warm Sand & Floral Motif',
  'ডিপ টিল প্রিন্ট': 'Deep Teal Print',
  'টেরাকোটা রেড': 'Terracotta Red',
  'এসপ্রেসো ব্রাউন ও গোল্ড জরি': 'Espresso Brown & Gold Zari',
  'বটল গ্রিন': 'Bottle Green',
  'বারগান্ডি মেরুন': 'Burgundy Maroon',
  'ডাস্টি রোজ পিচ ও সিকোয়েন্স': 'Dusty Rose Peach & Sequins',
  'শ্যাম্পেন গোল্ড': 'Champagne Gold',
  'মিন্ট গ্রিন': 'Mint Green',
  'আইভরি হোয়াইট': 'Ivory White',
  'ডিপ বেরি মেরুন': 'Deep Berry Maroon',
  'শ্যাম্পেন বেজ': 'Champagne Beige',
  'শ্যাম্পেন গোল্ড ও আইভরি': 'Champagne Gold & Ivory',
  'রুবী ক্রিমসন': 'Ruby Crimson',
  'প্যাস্টেল পিচ': 'Pastel Peach',
  'পার্ল আইভরি ও গোল্ড সেলভেজ': 'Pearl Ivory & Gold Selvedge',
  'স্যাফরন ক্রিম': 'Saffron Cream',
  'সফট পিচ': 'Soft Peach',
  'র-গোল্ডেন হানি বেজ': 'Raw Golden Honey Beige',
  'আর্থ ব্রাউন': 'Earth Brown',
  'অ্যান্টিক কপার': 'Antique Copper',
  'টেরাকোটা রাস্ট ও ক্রিম ব্লক': 'Terracotta Rust & Cream Block',
  'ইনডিগো ব্লু প্রিন্ট': 'Indigo Blue Print',
  'মারুন প্রিন্ট': 'Maroon Print',
  'রয়্যাল মাস্টার্ড ও কাঁথা স্টিচ': 'Royal Mustard & Kantha Stitch',
  'ইনডিগো নীল ও আইভরি বুটি': 'Indigo Blue & Ivory Buti',
  'ক্লাসিক আইভরি': 'Classic Ivory',
  'ন্যাচারাল ওটমিল বেজ': 'Natural Oatmeal Beige',
  'অলিভ ড্রাব': 'Olive Drab',
  'রাস্ট অরেঞ্জ': 'Rust Orange',
  'ফরেস্ট সেজ ফ্লোরাল': 'Forest Sage Floral',
  'কোরাল রেড': 'Coral Red',
  'ওয়ার্ম স্যান্ড': 'Warm Sand',
  'চারকোল গোল্ড': 'Charcoal Gold',
  'ডিপ মেরুন': 'Deep Maroon',
  'চারকোল টোপ ও গোল্ড সুতো': 'Charcoal Taupe & Gold Thread',
  'টেরাকোটা': 'Terracotta',
  'ডিপ ওয়াইন বেরি': 'Deep Wine Berry',
  'টিফানি টিল': 'Tiffany Teal',
  'মিডনাইট চারকোল': 'Midnight Charcoal',
  'শ্যাম্পেন রোজ গোল্ড': 'Champagne Rose Gold',
  'পিকক গ্রিন': 'Peacock Green',
  'মেরুন': 'Maroon',
  'ডাস্টি রোজ টোপ': 'Dusty Rose Taupe',
  'সেজ গ্রিন': 'Sage Green',
  'আইভরি স্যান্ড ও গোল্ড বর্ডার': 'Ivory Sand & Gold Border',
  'অলিভ গোল্ড': 'Olive Gold',

  // Footer & Common Sections
  'কাপড়ের বহর ও কালেকশন': 'Fabric Width & Collections',
  'গ্রাহক সেবা ও নীতিমালা': 'Customer Support & Policies',
  'যোগাযোগ': 'Contact Us',
  'যোগাযোগ করুন': 'Contact Us',
  'আমাদের সম্পর্কে': 'About Us',
  'ডেলিভারি পলিসি': 'Delivery Policy',
  'রিটার্ন ও রিফান্ড পলিসি': 'Return & Refund Policy',
  'প্রাইভেসি পলিসি': 'Privacy Policy',
  'শর্তাবলী': 'Terms & Conditions',
  'সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)': 'Frequently Asked Questions (FAQ)'
};

Object.assign(EXACT_PHRASE_MAP, STATIC_DICTIONARY);

// Phrase-level replacements sorted longest first
const SUBSTRING_REPLACEMENTS: Array<[string, string]> = [
  ['পোশাকের সংখ্যা নির্বাচন করুন', 'Select Number of Outfits'],
  ['অতিরিক্ত পোশাকের অংশ যোগ করুন (ঐচ্ছিক)', 'Add Extra Garment Parts (Optional)'],
  ['পোশাকের মাপ ও কাস্টমাইজেশন অপশন', 'Garment Size & Customization Options'],
  ['এই কাপড় দিয়ে আপনি যা যা বানাতে পারবেন', 'What You Can Make With This Fabric'],
  ['এই কাপড় দিয়ে আপনি যা যা বানাতে পারবেন', 'What You Can Make With This Fabric'],
  ['আপনার পছন্দ হতে পারে এমন আরও কাপড়', 'More Fabrics You May Like'],
  ['কাস্টম মাপের জন্য কাপড়ের গজ নির্বাচন করুন', 'Select Fabric Yards for Custom Size'],
  ['কাস্টমাইজেশন নোট / বিশেষ নির্দেশনা (ঐচ্ছিক)', 'Customization Notes / Special Instructions (Optional)'],
  ['মূল পোশাকের সেটের কাপড়', 'Main Dress Set Fabric'],
  ['নিজের মাপে কাস্টমাইজ করুন', 'Customize to Your Size'],
  ['শরীরের মাপ ও গজ দিন', 'Enter Body Measurements & Yards'],
  ['ডিফল্ট রেগুলার সাইজ', 'Default Regular Size'],
  ['স্ট্যান্ডার্ড সাইজ', 'Standard Size'],
  ['কাস্টম ফিটিং', 'Custom Fitting'],
  ['স্ট্যান্ডার্ড গজ:', 'Standard Yard:'],
  ['নির্বাচিত গজ:', 'Selected Yard:'],
  ['অতিরিক্ত গজ:', 'Extra Yard:'],
  ['মোট কাপড়ের মূল্য:', 'Total Fabric Price:'],
  ['অতিরিক্ত অংশের কাপড়:', 'Extra Parts Fabric:'],
  ['সর্বমোট কাপড়:', 'Total Fabric:'],
  ['অনুমোদিত সীমা:', 'Allowed Range:'],
  ['কালেকশন দেখুন', 'View Collection'],
  ['কার্টে যোগ করুন', 'Add to Cart'],
  ['এখনই কিনুন', 'Buy Now'],
  ['বোটানিক্যাল প্রিন্ট সিল্কি জ...', 'Botanical Print Silky...'],
  ['৩.৫ হাত বহর', '3.5 Haat Bahar'],
  ['২.৫ হাত বহর', '2.5 Haat Bahar'],
  ['হাত বহর', 'Haat Bahar'],
  ['৩.৫ বহর', '3.5 Bahar'],
  ['২.৫ বহর', '2.5 Bahar'],
  ['বহর', 'Bahar'],
  ['প্রতিটি', 'Each'],
  ['নির্বাচিত:', 'Selected:'],
  ['মোট:', 'Total:'],
  ['রং:', 'Color:'],
  ['কার্ট', 'Cart'],
  ['টি রং', ' Colors'],
  ['টি)', ')'],
  ['টি ', ' pcs '],
  ['গজ', 'Yard'],
  ['শাড়ি', 'Saree'],
  ['শাড়ি', 'Saree'],
  ['কামিজ', 'Kameez'],
  ['কুর্তি', 'Kurti'],
  ['লেহেঙ্গা', 'Lehenga'],
  ['গাউন', 'Gown'],
  ['ওড়না', 'Orna'],
  ['ওড়না', 'Orna'],
  ['ইনার', 'Inner'],
  ['প্যান্ট', 'Pant'],
  ['প্লাজো', 'Palazzo'],
  ['স্কার্ট', 'Skirt'],
  ['ব্লাউজ', 'Blouse'],
  ['পরিবর্তন', 'Change'],
  ['স্ট্যান্ডার্ড', 'Standard']
];

const BN_TO_EN_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9'
};

export function bengaliDigitsToEnglish(str: string): string {
  return str.replace(/[০-৯]/g, (d) => BN_TO_EN_DIGITS[d] || d);
}

export function translateBnToEn(input: string): string {
  if (!input) return input;
  const trimmed = input.trim();
  if (!trimmed) return input;

  // Check if string has any Bengali characters at all
  if (!/[\u0980-\u09FF]/.test(trimmed)) {
    return input;
  }

  // 1. Direct match in dictionary
  if (EXACT_PHRASE_MAP[trimmed]) {
    const leading = input.slice(0, input.indexOf(trimmed));
    const trailing = input.slice(input.indexOf(trimmed) + trimmed.length);
    return `${leading}${EXACT_PHRASE_MAP[trimmed]}${trailing}`;
  }

  let result = input;

  // 2. Replace exact known color/fabric/product names if embedded (e.g. "রং: শ্যাম্পেন আইভরি ও ব্লাশ রোজ")
  if (trimmed.startsWith('রং:')) {
    const colorPart = trimmed.slice(3).trim();
    const mappedColor = EXACT_PHRASE_MAP[colorPart] || colorPart;
    result = `Color: ${mappedColor}`;
  }

  // 3. Apply longest-first substring replacements
  for (const [bn, en] of SUBSTRING_REPLACEMENTS) {
    if (result.includes(bn)) {
      result = result.split(bn).join(en);
    }
  }

  // 4. Convert all Bengali digits to English digits
  result = bengaliDigitsToEnglish(result);

  return result;
}

// DOM TextNode & Attribute Translator with WeakMap for 100% lossless BN <-> EN toggling
interface TextNodeRecord {
  bn: string;
  en: string;
}

const textNodeRegistry = new WeakMap<Text, TextNodeRecord>();
const trackedTextNodes = new Set<Text>();
let domObserver: MutationObserver | null = null;
let isApplyingTranslation = false;

function shouldSkipElement(el: Element | null): boolean {
  if (!el) return true;
  const tag = el.tagName;
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA') {
    return true;
  }
  if (el.closest('[data-no-translate="true"]')) {
    return true;
  }
  return false;
}

function processTextNode(node: Text) {
  if (shouldSkipElement(node.parentElement)) return;
  const currentVal = node.nodeValue || '';

  if (currentLang === 'EN') {
    const existing = textNodeRegistry.get(node);
    if (existing) {
      // If React updated the node with a new Bengali string, re-translate it
      if (currentVal !== existing.en && /[\u0980-\u09FF]/.test(currentVal)) {
        const nextEn = translateBnToEn(currentVal);
        textNodeRegistry.set(node, { bn: currentVal, en: nextEn });
        trackedTextNodes.add(node);
        if (node.nodeValue !== nextEn) {
          node.nodeValue = nextEn;
        }
      } else if (currentVal === existing.bn && existing.en !== existing.bn) {
        node.nodeValue = existing.en;
      }
    } else if (/[\u0980-\u09FF]/.test(currentVal)) {
      const nextEn = translateBnToEn(currentVal);
      if (nextEn !== currentVal) {
        textNodeRegistry.set(node, { bn: currentVal, en: nextEn });
        trackedTextNodes.add(node);
        node.nodeValue = nextEn;
      }
    }
  } else {
    // Restore original Bengali
    const existing = textNodeRegistry.get(node);
    if (existing && currentVal !== existing.bn) {
      node.nodeValue = existing.bn;
    }
  }
}

function processElementAttributes(root: Element) {
  const elements = root.querySelectorAll('[placeholder], [title]');
  elements.forEach((el) => {
    if (shouldSkipElement(el)) return;

    // Placeholder
    const currentPlaceholder = el.getAttribute('placeholder');
    if (currentPlaceholder) {
      const origPlaceholder = el.getAttribute('data-bn-placeholder');
      if (currentLang === 'EN') {
        if (!origPlaceholder && /[\u0980-\u09FF]/.test(currentPlaceholder)) {
          el.setAttribute('data-bn-placeholder', currentPlaceholder);
          el.setAttribute('placeholder', translateBnToEn(currentPlaceholder));
        } else if (origPlaceholder) {
          el.setAttribute('placeholder', translateBnToEn(origPlaceholder));
        }
      } else if (origPlaceholder) {
        el.setAttribute('placeholder', origPlaceholder);
      }
    }

    // Title
    const currentTitle = el.getAttribute('title');
    if (currentTitle) {
      const origTitle = el.getAttribute('data-bn-title');
      if (currentLang === 'EN') {
        if (!origTitle && /[\u0980-\u09FF]/.test(currentTitle)) {
          el.setAttribute('data-bn-title', currentTitle);
          el.setAttribute('title', translateBnToEn(currentTitle));
        } else if (origTitle) {
          el.setAttribute('title', translateBnToEn(origTitle));
        }
      } else if (origTitle) {
        el.setAttribute('title', origTitle);
      }
    }
  });
}

export function applyDocumentLanguage(lang: AppLanguage = currentLang) {
  if (typeof document === 'undefined' || !document.body) return;
  if (isApplyingTranslation) return;
  isApplyingTranslation = true;

  try {
    document.documentElement.lang = lang === 'EN' ? 'en' : 'bn';

    if (lang === 'BN') {
      trackedTextNodes.forEach((node) => {
        const rec = textNodeRegistry.get(node);
        if (rec && node.nodeValue !== rec.bn) {
          node.nodeValue = rec.bn;
        }
      });
    } else {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
      );
      let currentNode = walker.nextNode();
      while (currentNode) {
        processTextNode(currentNode as Text);
        currentNode = walker.nextNode();
      }
    }

    processElementAttributes(document.body);
  } finally {
    isApplyingTranslation = false;
  }
}

function ensureDomObserver() {
  if (typeof window === 'undefined' || typeof document === 'undefined' || domObserver) return;

  domObserver = new MutationObserver((mutations) => {
    if (isApplyingTranslation || currentLang !== 'EN') return;
    isApplyingTranslation = true;
    try {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
          processTextNode(mutation.target as Text);
        } else if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((added) => {
            if (added.nodeType === Node.TEXT_NODE) {
              processTextNode(added as Text);
            } else if (added.nodeType === Node.ELEMENT_NODE) {
              const el = added as Element;
              const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
              let n = walker.nextNode();
              while (n) {
                processTextNode(n as Text);
                n = walker.nextNode();
              }
              processElementAttributes(el);
            }
          });
        }
      }
    } finally {
      isApplyingTranslation = false;
    }
  });

  if (document.body) {
    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
}

export function getAppLanguage(): AppLanguage {
  return currentLang;
}

export function setAppLanguage(nextLang: AppLanguage) {
  currentLang = nextLang;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, nextLang);
  }
  ensureDomObserver();
  applyDocumentLanguage(nextLang);
  listeners.forEach((cb) => cb(nextLang));
}

export function useAppLanguage(): [AppLanguage, (next: AppLanguage) => void] {
  const [lang, setLangState] = useState<AppLanguage>(currentLang);

  useEffect(() => {
    ensureDomObserver();
    applyDocumentLanguage(currentLang);

    const handler = (updated: AppLanguage) => {
      setLangState(updated);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return [lang, setAppLanguage];
}
