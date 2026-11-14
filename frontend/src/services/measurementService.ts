import {
  MeasurementOutfitRule,
  AdditionalClothingItem,
  FabricWidth,
  CategoryMeasurementGuideRecord,
  Product,
  ProductCustomMeasurementConfig,
  CustomMeasurementFieldKey,
  CustomerCustomMeasurements
} from '../types';
import { StorageService } from './storageService';
import { INITIAL_CATEGORY_MEASUREMENT_GUIDES } from '../data/seedData';
import { api } from './api';

export const CUSTOM_MEASUREMENT_FIELDS: Array<{
  key: CustomMeasurementFieldKey;
  label: string;
  labelBn: string;
  shortLabel: string;
  placeholder: string;
}> = [
  { key: 'chest', label: 'বুকের মাপ (ইঞ্চি)', labelBn: 'বুকের মাপ (ইঞ্চি)', shortLabel: 'বুক', placeholder: 'যেমন: ৩৮' },
  { key: 'waist', label: 'কোমরের মাপ (ইঞ্চি)', labelBn: 'কোমরের মাপ (ইঞ্চি)', shortLabel: 'কোমর', placeholder: 'যেমন: ৩৪' },
  { key: 'hip', label: 'হিপের মাপ (ইঞ্চি)', labelBn: 'হিপের মাপ (ইঞ্চি)', shortLabel: 'হিপ', placeholder: 'যেমন: ৪০' },
  { key: 'length', label: 'পোশাকের লম্বা (ইঞ্চি)', labelBn: 'পোশাকের লম্বা (ইঞ্চি)', shortLabel: 'লম্বা', placeholder: 'যেমন: ৪৪' },
  { key: 'sleeve', label: 'হাতার মাপ (ইঞ্চি)', labelBn: 'হাতার মাপ (ইঞ্চি)', shortLabel: 'হাতা', placeholder: 'যেমন: ১৮' },
  { key: 'shoulder', label: 'কাঁধের মাপ (ইঞ্চি)', labelBn: 'কাঁধের মাপ (ইঞ্চি)', shortLabel: 'কাঁধ', placeholder: 'যেমন: ১৪.৫' }
];

function notifyMeasurementListeners() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fabric-measurements-updated'));
  }
}

export const measurementService = {
  resolveCategorySlug(slugOrName: string): string {
    const clean = (slugOrName || '').trim().toLowerCase();
    if (clean === 'kamiz' || slugOrName === 'কামিজ' || slugOrName === 'নকশি ও কুর্তি') {
      return 'kamiz';
    }
    if (
      clean === 'short-kamiz' ||
      slugOrName === 'শার্ট কামিজ' ||
      slugOrName === 'শর্ট কামিজ'
    ) {
      return 'short-kamiz';
    }
    if (clean === 'long-koti' || slugOrName === 'লং কটি' || slugOrName === 'নেহ কটি' || slugOrName === 'কটি') {
      return 'long-koti';
    }
    if (
      clean === 'gown-lehenga' ||
      clean === 'gown' ||
      slugOrName === 'গাউন / লেহেঙ্গা' ||
      slugOrName === 'গাউন' ||
      slugOrName === 'লেহেঙ্গা'
    ) {
      return 'gown-lehenga';
    }
    if (clean === 'saree' || slugOrName === 'শাড়ি') {
      return 'saree';
    }
    if (clean === 'custom-design' || slugOrName === 'কাস্টম ডিজাইন') {
      return 'custom-design';
    }
    return clean || 'kamiz';
  },

  getDefaultProductCustomConfig(
    fabricWidth: FabricWidth,
    category: string,
    effectivePricePerYard?: number
  ): ProductCustomMeasurementConfig {
    const slug = this.resolveCategorySlug(category);
    const guide = this.getCategoryMeasurementGuide(fabricWidth, slug);
    const is35 = fabricWidth === '3.5';

    switch (slug) {
      case 'short-kamiz':
        return {
          enabled: true,
          standardGaj: guide?.suggestedYards ?? (is35 ? 1.5 : 2.5),
          minAllowedGaj: is35 ? 1.25 : 1.5,
          maxAllowedGaj: 6.0,
          applicableFields: ['chest', 'waist', 'hip', 'length', 'sleeve', 'shoulder'],
          measurementInstructions:
            'শর্ট কামিজ বা কুর্তির জন্য বুক, কোমর, হিপ, লম্বা, হাতা ও কাঁধের মাপ ইঞ্চিতে লিখুন। অতিরিক্ত ঢিলেঢালা ফিটিং বা লম্বা হাতার জন্য গজ বাড়িয়ে নিতে পারেন।',
          additionalPricePerYard: effectivePricePerYard
        };
      case 'long-koti':
        return {
          enabled: true,
          standardGaj: guide?.suggestedYards ?? (is35 ? 3.5 : 4.5),
          minAllowedGaj: 1.5,
          maxAllowedGaj: 10.0,
          applicableFields: ['chest', 'waist', 'length', 'sleeve', 'shoulder'],
          measurementInstructions:
            'লং কটি বা শ্রাগের জন্য বুক, কোমর, লম্বা, হাতা ও কাঁধের মাপ ইঞ্চিতে দিন। বেশি ঘের বা ফ্লেয়ার চাইলে প্রয়োজনমতো গজ বাড়িয়ে নিন।',
          additionalPricePerYard: effectivePricePerYard
        };
      case 'gown-lehenga':
        return {
          enabled: true,
          standardGaj: guide?.suggestedYards ?? (is35 ? 3.5 : 4.5),
          minAllowedGaj: 2.5,
          maxAllowedGaj: 12.0,
          applicableFields: ['chest', 'waist', 'hip', 'length', 'sleeve', 'shoulder'],
          measurementInstructions:
            'গাউন বা লেহেঙ্গার ফুল ঘেরের জন্য বুক, কোমর, হিপ ও লম্বার মাপ ইঞ্চিতে লিখুন। ডাবল ঘের বা কুঁচির জন্য অতিরিক্ত গজ নির্বাচন করতে পারেন।',
          additionalPricePerYard: effectivePricePerYard
        };
      case 'saree':
        return {
          enabled: true,
          standardGaj: guide?.suggestedYards ?? 6.0,
          minAllowedGaj: 5.0,
          maxAllowedGaj: 9.0,
          applicableFields: ['length', 'chest', 'waist', 'sleeve', 'shoulder'],
          measurementInstructions:
            'স্ট্যান্ডার্ড ১২ হাত শাড়ির জন্য ৬.০ গজ কাপড় নির্ধারিত। সাথে ব্লাউজ পিস বা অতিরিক্ত আঁচল/কুঁচির জন্য গজ বাড়াতে এবং ব্লাউজের মাপ দিতে পারেন।',
          additionalPricePerYard: effectivePricePerYard
        };
      case 'custom-design':
        return {
          enabled: true,
          standardGaj: guide?.suggestedYards ?? (is35 ? 2.5 : 3.0),
          minAllowedGaj: 1.0,
          maxAllowedGaj: 15.0,
          applicableFields: ['chest', 'waist', 'hip', 'length', 'sleeve', 'shoulder'],
          measurementInstructions:
            'আপনার কাস্টম পোশাকের প্রয়োজনীয় মাপগুলো ইঞ্চিতে লিখুন এবং ডিজাইন অনুযায়ী গজ নির্ধারণ করুন।',
          additionalPricePerYard: effectivePricePerYard
        };
      case 'kamiz':
      default:
        return {
          enabled: true,
          standardGaj: guide?.suggestedYards ?? (is35 ? 2.0 : 2.5),
          minAllowedGaj: is35 ? 1.5 : 2.0,
          maxAllowedGaj: 8.0,
          applicableFields: ['chest', 'waist', 'hip', 'length', 'sleeve', 'shoulder'],
          measurementInstructions:
            'আপনার বডির সঠিক মাপ ইঞ্চিতে লিখুন। ঢিলেঢালা বা বড় সাইজের কামিজের জন্য স্ট্যান্ডার্ড গজের চেয়ে ০.২৫ বা ০.৫ গজ বেশি কাপড় নিতে পারেন।',
          additionalPricePerYard: effectivePricePerYard
        };
    }
  },

  getProductCustomMeasurementConfig(product: Product): ProductCustomMeasurementConfig {
    const effectivePrice = product.discountPrice || product.pricePerYard;
    const defaults = this.getDefaultProductCustomConfig(
      product.fabricWidth,
      product.category,
      effectivePrice
    );
    if (!product.customMeasurementConfig) {
      return defaults;
    }
    const cfg = product.customMeasurementConfig;
    return {
      enabled: cfg.enabled !== false,
      standardGaj:
        typeof cfg.standardGaj === 'number' && cfg.standardGaj > 0
          ? cfg.standardGaj
          : defaults.standardGaj,
      minAllowedGaj:
        typeof cfg.minAllowedGaj === 'number' && cfg.minAllowedGaj > 0
          ? cfg.minAllowedGaj
          : defaults.minAllowedGaj,
      maxAllowedGaj:
        typeof cfg.maxAllowedGaj === 'number' && cfg.maxAllowedGaj > 0
          ? cfg.maxAllowedGaj
          : Math.min(product.stockYards || 15, defaults.maxAllowedGaj),
      applicableFields:
        Array.isArray(cfg.applicableFields) && cfg.applicableFields.length > 0
          ? cfg.applicableFields
          : defaults.applicableFields,
      measurementInstructions:
        cfg.measurementInstructions?.trim() || defaults.measurementInstructions,
      additionalPricePerYard:
        typeof cfg.additionalPricePerYard === 'number' && cfg.additionalPricePerYard > 0
          ? cfg.additionalPricePerYard
          : effectivePrice
    };
  },

  calculateCustomFabricPrice(
    product: Product,
    selectedGaj: number,
    config?: ProductCustomMeasurementConfig
  ): {
    standardGaj: number;
    selectedGaj: number;
    additionalGaj: number;
    basePricePerYard: number;
    additionalPricePerYard: number;
    totalPrice: number;
  } {
    const resolved = config || this.getProductCustomMeasurementConfig(product);
    const basePricePerYard = product.discountPrice || product.pricePerYard;
    const additionalPricePerYard = resolved.additionalPricePerYard || basePricePerYard;
    const standardGaj = resolved.standardGaj;
    const cleanSelected = Number(selectedGaj.toFixed(2));
    const additionalGaj = Math.max(0, Number((cleanSelected - standardGaj).toFixed(2)));

    let totalPrice = 0;
    if (cleanSelected <= standardGaj) {
      totalPrice = Math.round(cleanSelected * basePricePerYard);
    } else {
      totalPrice = Math.round(
        standardGaj * basePricePerYard + additionalGaj * additionalPricePerYard
      );
    }

    return {
      standardGaj,
      selectedGaj: cleanSelected,
      additionalGaj,
      basePricePerYard,
      additionalPricePerYard,
      totalPrice
    };
  },

  formatMeasurementsSummary(measurements?: CustomerCustomMeasurements): string {
    if (!measurements) return '';
    const parts: string[] = [];
    for (const field of CUSTOM_MEASUREMENT_FIELDS) {
      const val = measurements[field.key]?.trim();
      if (val) {
        parts.push(`${field.shortLabel}: ${val}"`);
      }
    }
    return parts.join(' · ');
  },

  getCategoryMeasurementGuides(): CategoryMeasurementGuideRecord[] {
    StorageService.initialize();
    const guides = StorageService.getCategoryMeasurementGuides();
    if (!Array.isArray(guides) || guides.length === 0) {
      return INITIAL_CATEGORY_MEASUREMENT_GUIDES;
    }
    return guides;
  },

  getCategoryMeasurementGuidesByWidth(width: FabricWidth): CategoryMeasurementGuideRecord[] {
    return this.getCategoryMeasurementGuides().filter((g) => g.fabricWidth === width);
  },

  getCategoryMeasurementGuide(
    width: FabricWidth,
    categorySlugOrName: string
  ): CategoryMeasurementGuideRecord {
    const slug = this.resolveCategorySlug(categorySlugOrName);
    const guides = this.getCategoryMeasurementGuides();
    const found = guides.find((g) => g.fabricWidth === width && g.categorySlug === slug);
    if (found) return found;

    const fallback = INITIAL_CATEGORY_MEASUREMENT_GUIDES.find(
      (g) => g.fabricWidth === width && g.categorySlug === slug
    );
    if (fallback) return fallback;

    return INITIAL_CATEGORY_MEASUREMENT_GUIDES[0];
  },

  async saveCategoryMeasurementGuide(
    guide: CategoryMeasurementGuideRecord
  ): Promise<CategoryMeasurementGuideRecord> {
    const guides = this.getCategoryMeasurementGuides().slice();
    const now = new Date().toISOString();
    const normalizedGuide: CategoryMeasurementGuideRecord = {
      ...guide,
      suggestedYardsLabel: guide.isAdminDefined || guide.suggestedYards === null
        ? 'অ্যাডমিন নির্ধারিত'
        : `${guide.suggestedYards} গজ`,
      updatedAt: now
    };

    const idx = guides.findIndex(
      (g) =>
        g.id === normalizedGuide.id ||
        (g.fabricWidth === normalizedGuide.fabricWidth &&
          g.categorySlug === normalizedGuide.categorySlug)
    );
    if (idx >= 0) {
      guides[idx] = normalizedGuide;
    } else {
      guides.push(normalizedGuide);
    }

    StorageService.setCategoryMeasurementGuides(guides);

    // Also keep outfit rule baseYards in sync if suggestedYards is numeric
    if (normalizedGuide.suggestedYards !== null && normalizedGuide.suggestedYards > 0) {
      const rules = this.getRules().slice();
      const ruleIdx = rules.findIndex(
        (r) =>
          r.fabricWidth === normalizedGuide.fabricWidth &&
          this.resolveCategorySlug(r.category || r.name) === normalizedGuide.categorySlug
      );
      if (ruleIdx >= 0) {
        rules[ruleIdx] = {
          ...rules[ruleIdx],
          baseYards: normalizedGuide.suggestedYards
        };
        StorageService.setMeasurementRules(rules);
      }
    }

    notifyMeasurementListeners();

    try {
      const res = await api.put('/admin/size-guides', { guide: normalizedGuide });
      const json = res.data;
      if (json?.success && Array.isArray(json.guides)) {
        StorageService.setCategoryMeasurementGuides(json.guides);
        notifyMeasurementListeners();
      }
    } catch {
      // Saved locally
    }

    return normalizedGuide;
  },

  async syncFromBackend(): Promise<void> {
    StorageService.initialize();
    try {
      const res = await api.get('/size-guides');
      const json = res.data;
      if (json?.success) {
        if (Array.isArray(json.guides) && json.guides.length > 0) {
          StorageService.setCategoryMeasurementGuides(json.guides);
        }
        if (Array.isArray(json.rules) && json.rules.length > 0) {
          StorageService.setMeasurementRules(json.rules);
        }
        if (Array.isArray(json.additionalItems) && json.additionalItems.length > 0) {
          StorageService.setAdditionalItems(json.additionalItems);
        }
        notifyMeasurementListeners();
      }
    } catch {
      // Offline fallback
    }
  },

  getRules(): MeasurementOutfitRule[] {
    StorageService.initialize();
    return StorageService.getMeasurementRules();
  },

  getRulesByWidth(width: FabricWidth): MeasurementOutfitRule[] {
    return this.getRules().filter(r => r.fabricWidth === width && r.isActive);
  },

  getAdditionalItems(): AdditionalClothingItem[] {
    StorageService.initialize();
    return StorageService.getAdditionalItems();
  },

  getAdditionalItemsByWidth(width: FabricWidth): AdditionalClothingItem[] {
    return this.getAdditionalItems().filter(item => item.fabricWidth === width && item.isActive);
  },

  calculateRequiredYards(params: {
    fabricWidth: FabricWidth;
    outfitRuleId: string;
    outfitCount: number;
    additionalItemSelections: { [itemId: string]: number }; // item ID -> quantity
    customAdjustmentYards?: number;
  }): {
    totalYards: number;
    outfitYards: number;
    additionalYards: number;
    breakdown: { item: string; yards: number; count: number }[];
  } {
    const rules = this.getRules();
    const additionalItems = this.getAdditionalItems();
    
    const selectedRule = rules.find(r => r.id === params.outfitRuleId);
    const outfitBaseYards = selectedRule ? selectedRule.baseYards : 2.5;
    const outfitCount = Math.max(1, params.outfitCount || 1);
    const outfitTotalYards = outfitBaseYards * outfitCount;

    const breakdown: { item: string; yards: number; count: number }[] = [];
    if (selectedRule) {
      breakdown.push({
        item: selectedRule.name,
        yards: outfitTotalYards,
        count: outfitCount
      });
    }

    let additionalTotalYards = 0;
    for (const [itemId, count] of Object.entries(params.additionalItemSelections)) {
      if (count > 0) {
        const item = additionalItems.find(i => i.id === itemId);
        if (item) {
          const itemYards = item.yardsPerUnit * count;
          additionalTotalYards += itemYards;
          breakdown.push({
            item: item.name,
            yards: itemYards,
            count
          });
        }
      }
    }

    const adjustment = params.customAdjustmentYards || 0;
    const grandTotal = Math.max(0.5, outfitTotalYards + additionalTotalYards + adjustment);

    return {
      totalYards: Number(grandTotal.toFixed(2)),
      outfitYards: Number(outfitTotalYards.toFixed(2)),
      additionalYards: Number(additionalTotalYards.toFixed(2)),
      breakdown
    };
  },

  saveRule(rule: MeasurementOutfitRule): void {
    const rules = this.getRules();
    const idx = rules.findIndex(r => r.id === rule.id);
    if (idx >= 0) {
      rules[idx] = rule;
    } else {
      rules.push(rule);
    }
    StorageService.setMeasurementRules(rules);
    notifyMeasurementListeners();
    api.put('/admin/measurement-rules', { rules }).catch(() => {});
  },

  deleteRule(id: string): void {
    const rules = this.getRules().filter(r => r.id !== id);
    StorageService.setMeasurementRules(rules);
    notifyMeasurementListeners();
    api.put('/admin/measurement-rules', { rules }).catch(() => {});
  },

  saveAdditionalItem(item: AdditionalClothingItem): void {
    const items = this.getAdditionalItems();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.push(item);
    }
    StorageService.setAdditionalItems(items);
    notifyMeasurementListeners();
    api.put('/admin/additional-items', { additionalItems: items }).catch(() => {});
  },

  deleteAdditionalItem(id: string): void {
    const items = this.getAdditionalItems().filter(i => i.id !== id);
    StorageService.setAdditionalItems(items);
    notifyMeasurementListeners();
    api.put('/admin/additional-items', { additionalItems: items }).catch(() => {});
  }
};

export const formatMeasurementsSummary = (
  measurements?: CustomerCustomMeasurements
): string => measurementService.formatMeasurementsSummary(measurements);

export const getDefaultProductCustomConfig = (
  categoryOrWidth: string,
  fabricWidthOrCategory: string,
  effectivePricePerYard?: number
): ProductCustomMeasurementConfig => {
  const isFirstWidth = categoryOrWidth === '3.5' || categoryOrWidth === '2.5';
  const width: FabricWidth = isFirstWidth
    ? (categoryOrWidth as FabricWidth)
    : ((fabricWidthOrCategory === '2.5' ? '2.5' : '3.5') as FabricWidth);
  const category = isFirstWidth ? fabricWidthOrCategory : categoryOrWidth;
  return measurementService.getDefaultProductCustomConfig(
    width,
    category,
    effectivePricePerYard
  );
};

export const getProductCustomMeasurementConfig = (
  product: Product
): ProductCustomMeasurementConfig =>
  measurementService.getProductCustomMeasurementConfig(product);

export const calculateCustomFabricPrice = (
  product: Product,
  selectedGaj: number,
  config?: ProductCustomMeasurementConfig
) => measurementService.calculateCustomFabricPrice(product, selectedGaj, config);

