import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { getUniqueProductFabricImage } from '../components/home/allProductsImageGenerator';
import { measurementService, CUSTOM_MEASUREMENT_FIELDS } from '../services/measurementService';
import {
  ProductCustomizationPayload,
  AddonFabricOption,
  SelectedAddonDetail,
  CustomMeasurementFieldKey,
  CustomerCustomMeasurements
} from '../types';
import {
  PRODUCT_OUTFIT_OPTIONS,
  ADDITIONAL_CLOTHING_OPTIONS,
  ProductOutfitOption
} from './ProductDetailsPage';
import { AddonFabricCollectionModal } from '../components/product/AddonFabricCollectionModal';
import { DynamicFabricGarmentImage } from '../components/product/DynamicFabricGarmentImage';
import { INITIAL_ADDON_FABRIC_COLLECTIONS } from '../data/seedData';
import {
  Sparkles,
  Search,
  Check,
  Scissors,
  Ruler,
  ShoppingCart,
  Shirt,
  Layers
} from 'lucide-react';

const BENGALI_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
function toBengaliNumber(val: number | string): string {
  return String(val).replace(/\d/g, (d) => BENGALI_NUMERALS[Number(d)]);
}

const COLOR_SWATCH_MAP: Record<string, string> = {
  'ক্রিমসন': '#6B0812',
  'রয়েল ক্রিমসন': '#6B0812',
  'রয়্যাল ক্রিমসন': '#6B0812',
  'মেরুন': '#6B0812',
  'ডিপ মেরুন': '#52060E',
  'বারগান্ডি': '#6E1220',
  'গোল্ডেন জরি': '#D4A045',
  'গোল্ডেন': '#D4A045',
  'সোনালী': '#D4A045',
  'আইভরি গোল্ড': '#6A2858',
  'আইভরি': '#E8DFD0',
  'অফ-হোয়াইট': '#FAF5EC',
  'ক্রিম': '#EFE5D2',
  'এমারেল্ড গ্রিন': '#14533C',
  'বটল গ্রিন': '#16402D',
  'সবুজ': '#2E6F40',
  'অলিভ': '#556B2F',
  'রয়েল ব্লু': '#1D3557',
  'রয়্যাল ব্লু': '#1D3557',
  'নেভি ব্লু': '#121F3D',
  'ইনডিগো': '#23395B',
  'নীল': '#1D3557',
  'ব্ল্যাক': '#1C1917',
  'কালো': '#1C1917',
  'সাদা': '#F8F7F4',
  'ডাস্টি রোজ': '#C08081',
  'ব্লাশ': '#DF9B9B',
  'পিচ': '#E2A287',
  'টেরাকোটা': '#A34828',
  'রাস্ট': '#9C4123',
  'মাস্টার্ড': '#C9972B',
  'টিল': '#1F5662',
  'শ্যাম্পেন': '#D5B26E'
};

function resolveColorSwatch(colorName: string, fallbackHex?: string): string {
  if (!colorName) return fallbackHex || '#C5A46D';
  for (const [key, hex] of Object.entries(COLOR_SWATCH_MAP)) {
    if (colorName.toLowerCase().includes(key.toLowerCase())) {
      return hex;
    }
  }
  return fallbackHex || '#C5A46D';
}

function getInitialOutfitId(
  category?: string,
  validOutfitOptions: ProductOutfitOption[] = PRODUCT_OUTFIT_OPTIONS
): string {
  const clean = (category || '').toLowerCase();
  let candidate = 'kameez';
  if (clean.includes('শর্ট') || clean.includes('short')) candidate = 'short_kameez';
  else if (clean.includes('কটি') || clean.includes('koti') || clean.includes('kurti')) candidate = 'kurti';
  else if (clean.includes('ওড়না') || clean.includes('orna')) candidate = 'kamiz_dupatta';
  else if (clean.includes('লেহেঙ্গা') || clean.includes('lehenga')) candidate = 'lehenga';
  else if (clean.includes('গাউন') || clean.includes('gown')) candidate = 'gown';
  else if (clean.includes('শাড়ি') || clean.includes('শাড়ি') || clean.includes('saree')) candidate = 'saree';
  else candidate = 'kameez';

  if (validOutfitOptions.length > 0) {
    if (validOutfitOptions.some((o) => o.id === candidate)) {
      return candidate;
    }
    return validOutfitOptions[0].id;
  }
  return candidate;
}

export const CustomDesignPage: React.FC = () => {
  const { products, addToCart, buyNow, settings, showToast } = useStore();

  const activeProducts = useMemo(
    () => products.filter((p) => p.isActive !== false),
    [products]
  );

  // Step 1: Product Selection Filters
  const [widthFilter, setWidthFilter] = useState<'all' | '3.5' | '2.5'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    () => activeProducts[0]?.id || ''
  );

  const filteredProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      if (widthFilter !== 'all' && p.fabricWidth !== widthFilter) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchEn = (p.nameEn || '').toLowerCase().includes(q);
        const matchType = p.fabricType.toLowerCase().includes(q);
        const matchColor = p.color.toLowerCase().includes(q);
        if (!matchName && !matchEn && !matchType && !matchColor) return false;
      }
      return true;
    });
  }, [activeProducts, widthFilter, categoryFilter, searchQuery]);

  const product = useMemo(() => {
    return (
      activeProducts.find((p) => p.id === selectedProductId) ||
      filteredProducts[0] ||
      activeProducts[0]
    );
  }, [activeProducts, filteredProducts, selectedProductId]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set(activeProducts.map((p) => p.category).filter(Boolean)));
  }, [activeProducts]);

  // Step 2: Outfit, Color, Size Mode, Yards, Measurements & Addons
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>(() =>
    getInitialOutfitId(product?.category)
  );
  const [selectedColor, setSelectedColor] = useState<string>(product?.color || '');
  const [sizeMode, setSizeMode] = useState<'standard' | 'custom'>('custom');
  const [standardQuantity, setStandardQuantity] = useState<number>(1);
  const [yards, setYards] = useState<number>(2.5);
  const [customMeasurements, setCustomMeasurements] = useState<CustomerCustomMeasurements>({
    chest: '',
    waist: '',
    hip: '',
    length: '',
    sleeve: '',
    shoulder: ''
  });
  const [measurementErrors, setMeasurementErrors] = useState<
    Partial<Record<CustomMeasurementFieldKey, string>>
  >({});
  const [customizationNotes, setCustomizationNotes] = useState<string>('');
  const [additionalItemCounts, setAdditionalItemCounts] = useState<Record<string, number>>({});
  const [activeCollectionModalAddonId, setActiveCollectionModalAddonId] = useState<string | null>(
    null
  );

  const addonFabricCollections = useMemo<Record<string, AddonFabricOption[]>>(() => {
    return settings?.addonFabricCollections || INITIAL_ADDON_FABRIC_COLLECTIONS;
  }, [settings?.addonFabricCollections]);

  const [selectedAddonFabrics, setSelectedAddonFabrics] = useState<
    Record<string, AddonFabricOption>
  >(() => {
    const initial: Record<string, AddonFabricOption> = {};
    const collections = settings?.addonFabricCollections || INITIAL_ADDON_FABRIC_COLLECTIONS;
    for (const [addonId, list] of Object.entries(collections)) {
      if (list && list.length > 0) {
        const defaultOne =
          list.find((f) => f.isDefault && f.isActive !== false) ||
          list.find((f) => f.isActive !== false) ||
          list[0];
        if (defaultOne) initial[addonId] = defaultOne;
      }
    }
    return initial;
  });

  const availableOutfits = useMemo<ProductOutfitOption[]>(() => {
    const supported =
      product?.supportedOutfits && product.supportedOutfits.length > 0
        ? product.supportedOutfits
        : product?.customMeasurementConfig?.supportedOutfits &&
          product.customMeasurementConfig.supportedOutfits.length > 0
        ? product.customMeasurementConfig.supportedOutfits
        : null;

    if (supported && supported.length > 0) {
      const filtered = PRODUCT_OUTFIT_OPTIONS.filter((o) => supported.includes(o.id));
      if (filtered.length > 0) return filtered;
    }
    return PRODUCT_OUTFIT_OPTIONS;
  }, [product]);

  const selectedOutfit = useMemo(
    () =>
      availableOutfits.find((o) => o.id === selectedOutfitId) ||
      availableOutfits[0] ||
      PRODUCT_OUTFIT_OPTIONS[0],
    [availableOutfits, selectedOutfitId]
  );

  const customConfig = useMemo(() => {
    if (!product) {
      return measurementService.getDefaultProductCustomConfig('3.5', 'কামিজ', 250);
    }
    const baseCfg = measurementService.getProductCustomMeasurementConfig(product);
    const effectivePriceVal = product.discountPrice || product.pricePerYard;
    const outfitDefaults = measurementService.getDefaultProductCustomConfig(
      product.fabricWidth,
      selectedOutfit.name,
      effectivePriceVal
    );
    const outfitStandardGaj =
      selectedOutfit.suggestedYards[product.fabricWidth] ?? baseCfg.standardGaj;

    return {
      ...baseCfg,
      ...outfitDefaults,
      enabled: true,
      standardGaj: outfitStandardGaj,
      minAllowedGaj: Math.min(outfitDefaults.minAllowedGaj, outfitStandardGaj),
      maxAllowedGaj: Math.max(outfitDefaults.maxAllowedGaj, outfitStandardGaj + 3)
    };
  }, [product, selectedOutfit]);

  // Sync defaults when user picks a different product
  useEffect(() => {
    if (!product) return;
    const supported =
      product.supportedOutfits && product.supportedOutfits.length > 0
        ? product.supportedOutfits
        : product.customMeasurementConfig?.supportedOutfits &&
          product.customMeasurementConfig.supportedOutfits.length > 0
        ? product.customMeasurementConfig.supportedOutfits
        : null;
    const validOutfits = supported
      ? PRODUCT_OUTFIT_OPTIONS.filter((o) => supported.includes(o.id))
      : PRODUCT_OUTFIT_OPTIONS;
    const initialOutfitList = validOutfits.length > 0 ? validOutfits : PRODUCT_OUTFIT_OPTIONS;

    const initOutfit = getInitialOutfitId(product.category, initialOutfitList);
    setSelectedOutfitId(initOutfit);
    const matchedOutfit = initialOutfitList.find((o) => o.id === initOutfit) || initialOutfitList[0];
    const initialGaj =
      matchedOutfit?.suggestedYards[product.fabricWidth] ??
      customConfig.standardGaj ??
      (product.fabricWidth === '3.5' ? 2.0 : 2.5);
    setStandardQuantity(1);
    setYards(initialGaj);
    setSelectedColor(product.color);
  }, [product?.id]);

  const productFabricImage = useMemo(() => {
    if (!product) return '';
    const customUploads = (product.images || []).filter(
      (img) =>
        img.startsWith('http://') ||
        img.startsWith('https://') ||
        img.startsWith('data:image/') ||
        img.startsWith('/')
    );
    if (customUploads.length > 0) return customUploads[0];
    return getUniqueProductFabricImage(product);
  }, [product]);

  const effectivePrice = product ? (product.discountPrice || product.pricePerYard) : 0;
  const hasDiscount = !!product?.discountPrice && product.discountPrice < (product?.pricePerYard || 0);

  const extraAddonYards = useMemo(() => {
    let sum = 0;
    for (const item of ADDITIONAL_CLOTHING_OPTIONS) {
      const count = additionalItemCounts[item.id] || 0;
      if (count > 0) {
        sum += count * item.yardsPerUnit;
      }
    }
    return Number(sum.toFixed(2));
  }, [additionalItemCounts]);

  const combinedTotalYards = Number((yards + extraAddonYards).toFixed(2));

  const addonTotalPrice = useMemo(() => {
    let sum = 0;
    for (const item of ADDITIONAL_CLOTHING_OPTIONS) {
      const count = additionalItemCounts[item.id] || 0;
      if (count > 0) {
        const isSetOrna = item.id === 'orna';
        const chosenFabric = isSetOrna ? null : selectedAddonFabrics[item.id];
        const unitRate = chosenFabric ? chosenFabric.pricePerYard : effectivePrice;
        sum += Math.round(count * item.yardsPerUnit * unitRate);
      }
    }
    return sum;
  }, [additionalItemCounts, selectedAddonFabrics, effectivePrice]);

  if (!product) {
    return null;
  }

  const mainFabricBreakdown = measurementService.calculateCustomFabricPrice(
    product,
    yards,
    customConfig
  );

  const priceBreakdown = measurementService.calculateCustomFabricPrice(
    product,
    combinedTotalYards,
    customConfig
  );

  const totalPrice = mainFabricBreakdown.totalPrice + addonTotalPrice;

  const maxStandardQuantity = Math.max(
    1,
    Math.floor(product.stockYards / (customConfig.standardGaj || 1))
  );

  const minAllowedYards = sizeMode === 'custom' ? customConfig.minAllowedGaj : 0.5;
  const maxAllowedYards = Math.min(
    Math.max(1, product.stockYards),
    sizeMode === 'custom' ? customConfig.maxAllowedGaj : Math.max(1, product.stockYards)
  );

  const handleSelectOutfit = (outfit: ProductOutfitOption) => {
    setSelectedOutfitId(outfit.id);
    const neededYards = outfit.suggestedYards[product.fabricWidth] || 2.5;
    if (sizeMode === 'standard') {
      const maxQty = Math.max(1, Math.floor(product.stockYards / neededYards));
      const clampedQty = Math.min(standardQuantity, maxQty);
      setStandardQuantity(clampedQty);
      setYards(Number((clampedQty * neededYards).toFixed(2)));
    } else {
      setYards(neededYards);
    }
  };

  const handleSwitchSizeMode = (mode: 'standard' | 'custom') => {
    setSizeMode(mode);
    if (mode === 'standard') {
      const clampedQty = Math.max(1, Math.min(maxStandardQuantity, standardQuantity));
      setStandardQuantity(clampedQty);
      setYards(Number((clampedQty * customConfig.standardGaj).toFixed(2)));
    } else if (yards < customConfig.minAllowedGaj) {
      setYards(customConfig.standardGaj);
    }
  };

  const handleStandardQuantityChange = (nextQty: number) => {
    const clampedQty = Math.max(1, Math.min(maxStandardQuantity, nextQty));
    setStandardQuantity(clampedQty);
    setYards(Number((clampedQty * customConfig.standardGaj).toFixed(2)));
  };

  const handleYardChange = (delta: number) => {
    const nextVal = Number((yards + delta).toFixed(2));
    if (nextVal >= minAllowedYards && nextVal <= maxAllowedYards) {
      setYards(nextVal);
    }
  };

  const handleDirectYardInput = (nextVal: number) => {
    const clamped = Math.max(
      minAllowedYards,
      Math.min(maxAllowedYards, Number(nextVal.toFixed(2)))
    );
    setYards(clamped);
  };

  const applicableMeasurementFields = CUSTOM_MEASUREMENT_FIELDS.filter((field) =>
    customConfig.applicableFields.includes(field.key)
  );

  const handleMeasurementInput = (key: CustomMeasurementFieldKey, rawValue: string) => {
    setCustomMeasurements((prev) => ({
      ...prev,
      [key]: rawValue
    }));

    const trimmed = rawValue.trim();
    if (!trimmed) {
      setMeasurementErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    const asciiVal = trimmed.replace(/[০-৯]/g, (ch) => String('০১২৩৪৫৬৭৮৯'.indexOf(ch)));
    const num = Number(asciiVal);
    if (!/^\d+(\.\d{1,2})?$/.test(asciiVal) || Number.isNaN(num) || num <= 0 || num > 120) {
      setMeasurementErrors((prev) => ({
        ...prev,
        [key]: 'সঠিক ইঞ্চি মাপ দিন (১–১২০)'
      }));
    } else {
      setMeasurementErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleAdditionalItemToggle = (itemId: string, delta: number) => {
    setAdditionalItemCounts((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, Math.min(10, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const handleSelectAddonFabric = (addonId: string, fabric: AddonFabricOption) => {
    setSelectedAddonFabrics((prev) => ({
      ...prev,
      [addonId]: fabric
    }));
    setAdditionalItemCounts((prev) => {
      const current = prev[addonId] || 0;
      if (current === 0) {
        return { ...prev, [addonId]: 1 };
      }
      return prev;
    });
    setActiveCollectionModalAddonId(null);
    if (showToast) {
      showToast(`${fabric.name} নির্বাচন করা হয়েছে`, 'success');
    }
  };

  const buildCustomizationPayload = (): ProductCustomizationPayload => {
    const cleanedMeasurements: CustomerCustomMeasurements = {};
    if (sizeMode === 'custom') {
      for (const field of CUSTOM_MEASUREMENT_FIELDS) {
        const val = customMeasurements[field.key]?.trim();
        if (val) {
          cleanedMeasurements[field.key] = val;
        }
      }
    }
    const hasMeasurements = Object.keys(cleanedMeasurements).length > 0;

    const selectedAddonsDetails: SelectedAddonDetail[] = ADDITIONAL_CLOTHING_OPTIONS.filter(
      (item) => (additionalItemCounts[item.id] || 0) > 0
    ).map((item) => {
      const c = additionalItemCounts[item.id];
      const isSetOrna = item.id === 'orna';
      const chosenFabric = isSetOrna ? null : selectedAddonFabrics[item.id];
      const rate = chosenFabric ? chosenFabric.pricePerYard : effectivePrice;
      return {
        addonId: item.id,
        addonName: item.name,
        yardsPerUnit: item.yardsPerUnit,
        count: c,
        fabricId: chosenFabric?.id || `set-${item.id}`,
        fabricName: chosenFabric?.name || `${product.name} (${item.shortName})`,
        fabricType: chosenFabric?.fabricType || product.fabricType,
        color: chosenFabric?.color || selectedColor,
        pricePerYard: rate,
        totalAddonPrice: Math.round(c * item.yardsPerUnit * rate),
        image: chosenFabric?.image || item.image
      };
    });

    const selectedAddonsSummary = ADDITIONAL_CLOTHING_OPTIONS.filter(
      (item) => (additionalItemCounts[item.id] || 0) > 0
    )
      .map((item) => {
        const c = additionalItemCounts[item.id];
        const isSetOrna = item.id === 'orna';
        const chosenFabric = isSetOrna ? null : selectedAddonFabrics[item.id];
        const fabricTag = isSetOrna
          ? ' (সেটের কাপড়)'
          : chosenFabric
            ? ` (${chosenFabric.fabricType})`
            : '';
        return c > 1
          ? `${item.shortName}${fabricTag} (${toBengaliNumber(c)}টি)`
          : `${item.shortName}${fabricTag}`;
      })
      .join(', ');

    const combinedOutfitCategory = selectedOutfit?.name
      ? selectedAddonsSummary
        ? `${selectedOutfit.name} + ${selectedAddonsSummary}`
        : selectedOutfit.name
      : selectedAddonsSummary || undefined;

    return {
      isCustomized: true,
      sizeMode,
      standardGaj: customConfig.standardGaj,
      customGaj: combinedTotalYards,
      additionalGaj: priceBreakdown.additionalGaj,
      measurements: sizeMode === 'custom' && hasMeasurements ? cleanedMeasurements : undefined,
      customizationNotes: customizationNotes.trim() || undefined,
      additionalPricePerYard: priceBreakdown.additionalPricePerYard,
      finalProductPrice: totalPrice,
      outfitCategory: combinedOutfitCategory,
      outfitId: selectedOutfit?.id as any,
      outfitImage: selectedOutfit?.image,
      selectedAddons: selectedAddonsDetails.length > 0 ? selectedAddonsDetails : undefined
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#FAF3E8] border border-[#DFC9AA] text-[#850B1B] rounded-full text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A46D]" />
          <span>কাস্টম ডিজাইন ও পোশাক কাস্টমাইজেশন স্টুডিও</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold text-[#1C1B19]">
          প্রোডাক্ট নির্বাচন করে সম্পূর্ণ পোশাক কাস্টমাইজ করুন
        </h1>
        <p className="text-xs sm:text-sm text-[#5C433E]">
          আপনার পছন্দের কাপড় বেছে নিন, পোশাকের ধরন, শরীরের মাপ, প্রয়োজনীয় গজ এবং ইনার, প্যান্ট ও সেটের ওড়নাসহ সবকিছু নিজের মতো সাজিয়ে নিন।
        </p>
      </div>

      {/* STEP 1: PRODUCT SELECTOR BAR */}
      <div className="p-4 sm:p-6 bg-[#FAF8F4] rounded-2xl border border-[#E6DFD3] space-y-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#850B1B] text-white text-xs font-bold flex items-center justify-center shrink-0">
              ১
            </span>
            <h2 className="text-sm sm:text-base font-bold text-[#1C1B19]">
              পছন্দের কাপড় / প্রোডাক্ট নির্বাচন করুন ({toBengaliNumber(filteredProducts.length)}টি)
            </h2>
          </div>

          {/* Filters: Width, Category & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-white border border-[#E6DFD3] p-0.5">
              {[
                { key: 'all', label: 'সকল বহর' },
                { key: '3.5', label: '৩.৫ বহর' },
                { key: '2.5', label: '২.৫ বহর' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setWidthFilter(tab.key as any)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    widthFilter === tab.key
                      ? 'bg-[#850B1B] text-white'
                      : 'text-[#5C433E] hover:text-[#850B1B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E6DFD3] text-xs font-semibold text-[#1C1B19] focus:outline-hidden focus:border-[#850B1B] cursor-pointer"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-52 min-w-[160px]">
              <Search className="w-3.5 h-3.5 text-[#850B1B] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="কাপড়ের নাম বা রং খুঁজুন..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#E6DFD3] text-xs text-[#1C1B19] focus:outline-hidden focus:border-[#850B1B]"
              />
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Product Cards */}
        <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-0.5 scrollbar-thin">
          {filteredProducts.map((item) => {
            const isSelected = item.id === product.id;
            const imgUrl = getUniqueProductFabricImage(item);
            const itemPrice = item.discountPrice || item.pricePerYard;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedProductId(item.id)}
                className={`w-44 sm:w-52 shrink-0 rounded-xl p-2.5 text-left transition-all cursor-pointer border flex flex-col justify-between gap-2 relative ${
                  isSelected
                    ? 'bg-[#FFFBF5] border-2 border-[#850B1B] shadow-sm'
                    : 'bg-white border-[#E6DFD3] hover:border-[#C5A46D]'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-4 right-4 z-10 w-6 h-6 rounded-full bg-[#850B1B] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                  </span>
                )}

                <div className="space-y-2">
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#F4ECE0] border border-[#E6DFD3]">
                    <img
                      src={imgUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-[#FAF3E8] border border-[#DFC9AA] text-[#850B1B] font-bold">
                      {item.fabricWidth === '3.5' ? '৩.৫ বহর' : '২.৫ বহর'}
                    </span>
                    <span className="text-[#5C433E] truncate font-medium">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#1C1B19] line-clamp-2 leading-snug">
                    {item.name}
                  </h3>
                </div>

                <div className="pt-1.5 border-t border-[#EFE6D8] flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-extrabold text-[#850B1B] tabular-nums">
                    ৳{toBengaliNumber(itemPrice)}
                    <span className="text-[10px] font-medium text-[#5C433E]">/গজ</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-[#850B1B] text-white'
                        : 'bg-[#FAF3E8] text-[#850B1B]'
                    }`}
                  >
                    {isSelected ? 'নির্বাচিত' : 'সিলেক্ট করুন'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN CUSTOMIZATION WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN (5 cols): Live Fabric & 3D Garment Preview + Summary */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#E6DFD3] shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF3E8] border border-[#DFC9AA] text-xs font-bold text-[#850B1B]">
                <Layers className="w-3.5 h-3.5" />
                <span>লাইভ কাস্টম প্রিভিউ</span>
              </span>
              <span className="text-xs font-bold text-[#850B1B] bg-[#850B1B]/10 px-2.5 py-1 rounded-md">
                {product.fabricWidth === '3.5' ? '৩.৫ বহর' : '২.৫ বহর'} · ৳{toBengaliNumber(effectivePrice)}/গজ
              </span>
            </div>

            {/* Side-by-side Fabric + 3D Outfit Render */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="aspect-[3/4] rounded-xl overflow-hidden border border-[#E6DFD3] bg-[#F4ECE0]">
                  <img
                    src={productFabricImage}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[11px] font-semibold text-center text-[#5C433E]">
                  নির্বাচিত কাপড় ({selectedColor})
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-[#850B1B] bg-[#F5EFE4] relative">
                  <DynamicFabricGarmentImage
                    templateSrc={selectedOutfit.image}
                    fabricSrc={productFabricImage}
                    colorTintHex={resolveColorSwatch(selectedColor || product.color, product.colorHex)}
                    alt={selectedOutfit.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[11px] font-bold text-center text-[#850B1B]">
                  {selectedOutfit.name} প্রিভিউ ({toBengaliNumber(yards)} গজ)
                </p>
              </div>
            </div>

            {/* Selected Product Title & Color Selector */}
            <div className="pt-3 border-t border-[#EFE6D8] space-y-2.5">
              <div>
                <span className="text-[11px] font-semibold text-[#8A5A14]">
                  {product.fabricType} • {product.category}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#1C1B19] leading-snug mt-0.5">
                  {product.name}
                </h2>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-[#850B1B] tabular-nums">
                  ৳{toBengaliNumber(effectivePrice)}
                </span>
                <span className="text-xs font-medium text-[#5C433E]">/ গজ</span>
                {hasDiscount && (
                  <span className="text-xs text-[#8C7A72] line-through tabular-nums">
                    ৳{toBengaliNumber(product.pricePerYard)}
                  </span>
                )}
              </div>

              {product.availableColors && product.availableColors.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold text-[#1C1B19] block">
                    পছন্দের রং নির্বাচন করুন: <strong className="text-[#850B1B]">{selectedColor}</strong>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.availableColors.map((c) => {
                      const active = selectedColor === c;
                      const swatchHex = resolveColorSwatch(c, product.colorHex);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer border ${
                            active
                              ? 'bg-[#850B1B] text-white border-[#850B1B] font-semibold'
                              : 'bg-[#FAF8F4] text-[#1C1B19] border-[#E6DFD3] hover:border-[#C5A46D]'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                            style={{ backgroundColor: swatchHex }}
                          />
                          <span>{c}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Complete Live Price Summary */}
            <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E6DFD3] space-y-2 text-xs">
              <div className="font-bold text-[#1C1B19] border-b border-[#E6DFD3] pb-1.5">
                কাস্টমাইজেশন ও মূল্যের বিবরণী:
              </div>

              <div className="flex items-center justify-between text-[#1C1B19]/85">
                <span>
                  মূল পোশাক ({selectedOutfit.name} · {toBengaliNumber(yards)} গজ):
                </span>
                <strong className="text-[#1C1B19] tabular-nums">
                  ৳{toBengaliNumber(mainFabricBreakdown.totalPrice)}
                </strong>
              </div>

              {ADDITIONAL_CLOTHING_OPTIONS.filter(
                (item) => (additionalItemCounts[item.id] || 0) > 0
              ).map((item) => {
                const c = additionalItemCounts[item.id];
                const isSetOrna = item.id === 'orna';
                const chosen = isSetOrna ? null : selectedAddonFabrics[item.id];
                const rate = chosen ? chosen.pricePerYard : effectivePrice;
                const itemYards = Number((c * item.yardsPerUnit).toFixed(2));
                const itemCost = Math.round(itemYards * rate);

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-[#5C433E]"
                  >
                    <span className="truncate pr-2">
                      + {item.shortName}{' '}
                      {isSetOrna
                        ? '(সেটের কাপড়)'
                        : chosen
                          ? `(${chosen.fabricType})`
                          : ''}{' '}
                      × {toBengaliNumber(c)}টি ({toBengaliNumber(itemYards)} গজ):
                    </span>
                    <strong className="text-[#1C1B19] tabular-nums shrink-0">
                      ৳{toBengaliNumber(itemCost)}
                    </strong>
                  </div>
                );
              })}

              <div className="pt-2 border-t border-[#DFC9AA] flex items-center justify-between text-sm font-extrabold">
                <span className="text-[#1C1B19]">
                  সর্বমোট ({toBengaliNumber(combinedTotalYards)} গজ):
                </span>
                <span className="text-base text-[#850B1B] tabular-nums">
                  ৳{toBengaliNumber(totalPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Outfit Selection, Measurements & Inner/Addons */}
        <div className="lg:col-span-7 space-y-5">
          {/* SECTION 1: এই কাপড় দিয়ে আপনি যা যা বানাতে পারবেন */}
          <div className="p-3.5 sm:p-5 bg-[#FAF7F0] rounded-2xl border border-[#E6DCCB] space-y-3.5">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-1.5 sm:py-2 bg-white rounded-full border border-[#E2D6C1] shadow-2xs">
                <Shirt className="w-4 h-4 text-[#850B1B] shrink-0" />
                <span className="text-xs sm:text-[15px] font-bold text-[#1C1B19]">
                  এই কাপড় দিয়ে আপনি যা যা বানাতে পারবেন
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {availableOutfits.map((outfit) => {
                const isSelected = selectedOutfitId === outfit.id;
                const outfitYards = outfit.suggestedYards[product.fabricWidth];
                return (
                  <button
                    key={outfit.id}
                    type="button"
                    onClick={() => handleSelectOutfit(outfit)}
                    className={`group rounded-xl overflow-hidden transition-all cursor-pointer flex flex-col text-center border ${
                      isSelected
                        ? 'bg-[#FFFBF5] border-2 border-[#850B1B] shadow-sm'
                        : 'bg-[#F5EFE4] border border-[#E2D6C3] hover:border-[#C5A46D]'
                    }`}
                  >
                    <div className="w-full aspect-[3/3.6] overflow-hidden bg-[#EDE3D2] relative">
                      <DynamicFabricGarmentImage
                        templateSrc={outfit.image}
                        fabricSrc={productFabricImage}
                        colorTintHex={resolveColorSwatch(selectedColor || product.color, product.colorHex)}
                        alt={outfit.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#850B1B] text-white flex items-center justify-center shadow-2xs">
                          <Check className="w-3 h-3 stroke-[2.8]" />
                        </span>
                      )}
                    </div>
                    <div
                      className={`py-2 px-1.5 w-full transition-colors ${
                        isSelected
                          ? 'bg-[#850B1B] text-white'
                          : 'bg-[#F5EFE4] text-[#1C1B19]'
                      }`}
                    >
                      <span className="text-xs sm:text-[13px] font-bold block leading-tight">
                        {outfit.name}
                      </span>
                      <span
                        className={`text-[10px] block mt-0.5 ${
                          isSelected ? 'text-white/85' : 'text-[#5C433E]'
                        }`}
                      >
                        প্রস্তাবিত: {toBengaliNumber(outfitYards)} গজ
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: পোশাকের মাপ ও কাস্টমাইজেশন অপশন */}
          <div className="p-3.5 sm:p-4 bg-[#FAF8F4] rounded-2xl border border-[#E6DFD3] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#850B1B] shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-[#1C1B19]">
                  পোশাকের মাপ ও কাস্টমাইজেশন অপশন
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#850B1B] bg-[#850B1B]/10 px-2.5 py-0.5 rounded-md">
                স্ট্যান্ডার্ড গজ: {customConfig.standardGaj} গজ
              </span>
            </div>

            {/* Two Options: স্ট্যান্ডার্ড সাইজ | নিজের মাপে কাস্টমাইজ করুন */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => handleSwitchSizeMode('standard')}
                className={`px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between gap-1 ${
                  sizeMode === 'standard'
                    ? 'bg-[#850B1B] text-white border-[#850B1B] shadow-sm'
                    : 'bg-white text-[#1C1B19] border-[#E6DFD3] hover:border-[#850B1B]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      sizeMode === 'standard'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#FAF8F4] text-[#850B1B] border border-[#E6DFD3]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                  <span
                    className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                      sizeMode === 'standard'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#850B1B]/10 text-[#850B1B]'
                    }`}
                  >
                    {sizeMode === 'standard' && standardQuantity > 1
                      ? `${standardQuantity}টি · ${yards} গজ`
                      : `${customConfig.standardGaj} গজ`}
                  </span>
                </div>
                <div className="w-full space-y-0">
                  <span className="text-xs sm:text-sm font-bold block leading-tight">
                    স্ট্যান্ডার্ড সাইজ
                  </span>
                  <span
                    className={`text-[11px] block leading-tight mt-0.5 ${
                      sizeMode === 'standard' ? 'text-white/85' : 'text-[#1C1B19]/65'
                    }`}
                  >
                    ডিফল্ট রেগুলার সাইজ
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchSizeMode('custom')}
                className={`px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between gap-1 ${
                  sizeMode === 'custom'
                    ? 'bg-[#850B1B] text-white border-[#850B1B] shadow-sm'
                    : 'bg-white text-[#1C1B19] border-[#D5A64A]/80 hover:border-[#850B1B] shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      sizeMode === 'custom'
                        ? 'bg-[#D5A64A] text-[#1C1B19]'
                        : 'bg-[#D5A64A]/25 text-[#7A4E12] border border-[#D5A64A]/40'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5" />
                  </span>
                  <span
                    className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 inline-flex items-center gap-1 ${
                      sizeMode === 'custom'
                        ? 'bg-[#D5A64A] text-[#1C1B19]'
                        : 'bg-[#D5A64A]/20 text-[#7A4E12] border border-[#D5A64A]/50'
                    }`}
                  >
                    <Scissors className="w-3 h-3" />
                    <span>কাস্টম ফিটিং</span>
                  </span>
                </div>
                <div className="w-full space-y-0">
                  <span className="text-xs sm:text-sm font-bold block leading-tight">
                    নিজের মাপে কাস্টমাইজ করুন
                  </span>
                  <span
                    className={`text-[11px] block leading-tight mt-0.5 ${
                      sizeMode === 'custom' ? 'text-white/85' : 'text-[#850B1B] font-medium'
                    }`}
                  >
                    শরীরের মাপ ও গজ দিন
                  </span>
                </div>
              </button>
            </div>

            {sizeMode === 'standard' && (
              <div className="px-3 py-2 sm:px-3.5 sm:py-2 bg-white rounded-xl border border-[#E6DFD3] flex flex-wrap items-center justify-between gap-1.5">
                <div className="space-y-0">
                  <span className="text-xs font-bold text-[#1C1B19] block leading-tight">
                    পোশাকের সংখ্যা নির্বাচন করুন (প্রতিটি {customConfig.standardGaj} গজ):
                  </span>
                  <span className="text-xs text-[#1C1B19]/75 block leading-tight mt-0.5">
                    নির্বাচিত: <strong className="text-[#850B1B]">{standardQuantity}টি {selectedOutfit.name}</strong> ({yards} গজ) · মোট: <strong className="text-[#850B1B]">৳{totalPrice}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStandardQuantityChange(standardQuantity - 1)}
                    disabled={standardQuantity <= 1}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FAF8F4] border border-[#DCD3C2] text-sm font-bold text-[#850B1B] hover:bg-[#EDE5D9]/60 disabled:opacity-40 flex items-center justify-center cursor-pointer"
                  >
                    −
                  </button>
                  <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-[#FAF8F4] border border-[#DCD3C2] rounded-lg text-center min-w-[66px]">
                    <span className="text-xs font-bold text-[#1C1B19] tabular-nums block leading-tight">
                      {standardQuantity}টি
                    </span>
                    <span className="text-[10px] font-semibold text-[#850B1B] tabular-nums block leading-none">
                      {yards} গজ
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStandardQuantityChange(standardQuantity + 1)}
                    disabled={standardQuantity >= maxStandardQuantity}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FAF8F4] border border-[#DCD3C2] text-sm font-bold text-[#850B1B] hover:bg-[#EDE5D9]/60 disabled:opacity-40 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {sizeMode === 'custom' && (
              <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-[#D5A64A]/45 space-y-4">
                {/* 1. Yardage Selection */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-[#1C1B19]">
                      কাস্টম মাপের জন্য কাপড়ের গজ নির্বাচন করুন:
                    </span>
                    <span className="text-[11px] text-[#1C1B19]/65">
                      অনুমোদিত সীমা: {customConfig.minAllowedGaj} গজ – {Math.min(customConfig.maxAllowedGaj, Math.max(1, product.stockYards))} গজ
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {Array.from(
                      new Set([
                        customConfig.standardGaj,
                        Number((customConfig.standardGaj + 0.25).toFixed(2)),
                        Number((customConfig.standardGaj + 0.5).toFixed(2)),
                        Number((customConfig.standardGaj + 0.75).toFixed(2)),
                        Number((customConfig.standardGaj + 1).toFixed(2))
                      ])
                    )
                      .filter(
                        (g) =>
                          g >= customConfig.minAllowedGaj &&
                          g <= Math.min(customConfig.maxAllowedGaj, Math.max(1, product.stockYards))
                      )
                      .map((gajOption) => (
                        <button
                          key={gajOption}
                          type="button"
                          onClick={() => handleDirectYardInput(gajOption)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            yards === gajOption
                              ? 'bg-[#850B1B] text-white'
                              : 'bg-[#FAF8F4] border border-[#E6DFD3] text-[#1C1B19]/80 hover:border-[#850B1B]'
                          }`}
                        >
                          {gajOption} গজ
                          {gajOption === customConfig.standardGaj ? ' (স্ট্যান্ডার্ড)' : ''}
                        </button>
                      ))}
                  </div>

                  <div className="p-2.5 sm:p-3 bg-[#FAF8F4] rounded-lg border border-[#E6DFD3] flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleYardChange(-0.25)}
                        disabled={yards <= customConfig.minAllowedGaj}
                        className="px-2.5 py-1.5 bg-white border border-[#DCD3C2] rounded text-xs font-bold text-[#850B1B] hover:bg-[#EDE5D9]/50 disabled:opacity-40 cursor-pointer"
                      >
                        − 0.25 গজ
                      </button>
                      <input
                        type="number"
                        step="0.25"
                        min={customConfig.minAllowedGaj}
                        max={Math.min(customConfig.maxAllowedGaj, Math.max(1, product.stockYards))}
                        value={yards}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) handleDirectYardInput(val);
                        }}
                        className="w-16 py-1.5 bg-white border border-[#DCD3C2] rounded text-center text-xs font-bold text-[#1C1B19] tabular-nums focus:outline-hidden focus:border-[#850B1B]"
                      />
                      <button
                        type="button"
                        onClick={() => handleYardChange(0.25)}
                        disabled={yards >= Math.min(customConfig.maxAllowedGaj, Math.max(1, product.stockYards))}
                        className="px-2.5 py-1.5 bg-white border border-[#DCD3C2] rounded text-xs font-bold text-[#850B1B] hover:bg-[#EDE5D9]/50 disabled:opacity-40 cursor-pointer"
                      >
                        + 0.25 গজ
                      </button>
                    </div>

                      <div className="text-xs space-y-0.5 text-right">
                        <div className="text-[#1C1B19]/75">
                          স্ট্যান্ডার্ড গজ: <strong>{customConfig.standardGaj} গজ</strong> · নির্বাচিত গজ: <strong className="text-[#850B1B]">{yards} গজ</strong>
                        </div>
                        <div className="text-[#1C1B19]/80">
                          মোট কাপড়ের মূল্য: <strong className="text-[#850B1B]">৳{totalPrice}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Body Measurement Inputs Grid */}
                  <div className="space-y-2.5 pt-2 border-t border-[#EDE5D9]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#1C1B19] flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-[#850B1B]" />
                        <span>আপনার শরীরের মাপ দিন (ইঞ্চিতে, ঐচ্ছিক):</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {(applicableMeasurementFields.length > 0
                        ? applicableMeasurementFields
                        : CUSTOM_MEASUREMENT_FIELDS
                      ).map((field) => {
                        const err = measurementErrors[field.key];
                        return (
                          <div key={field.key} className="space-y-1">
                            <label className="text-[11px] font-semibold text-[#1C1B19]/80 block">
                              {field.labelBn}
                            </label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={customMeasurements[field.key] || ''}
                              onChange={(e) => handleMeasurementInput(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className={`w-full px-2.5 py-1.5 bg-[#FAF8F4] border rounded-md text-xs text-[#1C1B19] focus:outline-hidden ${
                                err
                                  ? 'border-rose-500 bg-rose-50/30'
                                  : 'border-[#DCD3C2] focus:border-[#850B1B]'
                              }`}
                            />
                            {err && (
                              <p className="text-[10px] text-rose-600 font-medium leading-tight">
                                {err}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Customization Notes */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#1C1B19]/80 block">
                      কাস্টমাইজেশন নোট / বিশেষ নির্দেশনা (ঐচ্ছিক):
                    </label>
                    <input
                      type="text"
                      value={customizationNotes}
                      onChange={(e) => setCustomizationNotes(e.target.value)}
                      placeholder="যেমন: লুজ ফিট হবে, হাতায় কুচি বা অন্য কোনো নির্দেশনা..."
                      className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DCD3C2] rounded-md text-xs text-[#1C1B19] focus:outline-hidden focus:border-[#850B1B]"
                    />
                  </div>
              </div>
            )}
          </div>

          {/* SECTION 3: ২. অতিরিক্ত পোশাকের অংশ যোগ করুন (ইনার, প্যান্ট, প্লাজো, সেটের ওড়না, স্কার্ট, ব্লাউজ) */}
          <div className="p-4 sm:p-5 bg-[#FAF8F4] rounded-2xl border border-[#E6DFD3] space-y-3.5">
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-[#1C1B19]">
                ২. অতিরিক্ত পোশাকের অংশ যোগ করুন (ঐচ্ছিক):
              </h3>
              <p className="text-[11px] sm:text-xs text-[#5C433E]/85">
                প্যান্ট, সেটের ওড়না, ইনার ইত্যাদি পছন্দমতো প্রোডাক্ট কালেকশন থেকে যোগ করুন
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {ADDITIONAL_CLOTHING_OPTIONS.map((item) => {
                const count = additionalItemCounts[item.id] || 0;
                const isSetOrna = item.id === 'orna';
                const collectionForItem = isSetOrna
                  ? []
                  : (addonFabricCollections[item.id] || []).filter(
                      (f) => f.isActive !== false
                    );
                const selectedFabric = isSetOrna
                  ? null
                  : selectedAddonFabrics[item.id] || collectionForItem[0] || null;
                const displayUnitRate = isSetOrna
                  ? effectivePrice
                  : selectedFabric
                    ? selectedFabric.pricePerYard
                    : effectivePrice;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 transition-all ${
                      count > 0
                        ? 'border-[#850B1B] bg-[#FAF3E8] shadow-2xs'
                        : 'border-[#E6D7C3] bg-white'
                    }`}
                  >
                    <div
                      onClick={() => {
                        if (!isSetOrna) {
                          setActiveCollectionModalAddonId(item.id);
                        }
                      }}
                      className={`flex items-center gap-3 min-w-0 w-full ${
                        isSetOrna ? '' : 'cursor-pointer group'
                      }`}
                      title={
                        isSetOrna
                          ? `${item.name} — মূল পোশাকের সেটের কাপড়`
                          : `${item.name} এর প্রোডাক্ট কালেকশন দেখুন`
                      }
                    >
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-lg overflow-hidden border border-[#E6D7C3] bg-[#FAF3E8] shrink-0 relative">
                        <img
                          src={
                            isSetOrna
                              ? productFabricImage
                              : selectedFabric?.image || item.image
                          }
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="text-xs sm:text-[13.5px] font-bold text-[#1C1B19] group-hover:text-[#850B1B] transition-colors leading-snug">
                          {item.name}
                        </h4>
                        <p className="text-[11px] sm:text-xs font-medium text-[#5C433E] leading-snug">
                          {item.yardsLabel} · ৳{toBengaliNumber(displayUnitRate)}/গজ
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EFE6D8] w-full">
                      {isSetOrna ? (
                        <span className="text-[11px] font-semibold text-[#850B1B] truncate">
                          মূল পোশাকের সেটের কাপড়
                        </span>
                      ) : collectionForItem.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setActiveCollectionModalAddonId(item.id)}
                          className="text-[11px] font-semibold text-[#850B1B] hover:text-[#6B0812] underline text-left truncate cursor-pointer"
                        >
                          {count > 0 && selectedFabric
                            ? `${selectedFabric.fabricType} (পরিবর্তন)`
                            : `কালেকশন দেখুন (${toBengaliNumber(collectionForItem.length)}টি)`}
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#5C433E]/70">স্ট্যান্ডার্ড কাপড়</span>
                      )}

                      <div className="flex items-center gap-1.5 border border-[#DFC9AA] bg-[#FFFDF9] rounded-xl px-2 py-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAdditionalItemToggle(item.id, -1)}
                          disabled={count === 0}
                          className="w-6 h-6 sm:w-6.5 sm:h-6.5 flex items-center justify-center text-[#850B1B] font-bold text-sm hover:bg-[#FAF3E8] disabled:opacity-35 rounded-md cursor-pointer transition-colors"
                          aria-label={`${item.name} কমান`}
                        >
                          −
                        </button>
                        <span className="min-w-[20px] text-center text-xs sm:text-sm font-bold tabular-nums text-[#6B0812]">
                          {toBengaliNumber(count)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdditionalItemToggle(item.id, 1)}
                          className="w-6 h-6 sm:w-6.5 sm:h-6.5 flex items-center justify-center text-[#850B1B] font-bold text-sm hover:bg-[#FAF3E8] rounded-md cursor-pointer transition-colors"
                          aria-label={`${item.name} যোগ করুন`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {extraAddonYards > 0 && (
              <div className="p-2.5 bg-white rounded-lg border border-[#D5A64A]/45 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[#1C1B19]/80">
                  অতিরিক্ত অংশের কাপড়: <strong className="text-[#850B1B]">+{extraAddonYards} গজ</strong>
                </span>
                <span className="text-[#1C1B19] font-semibold">
                  সর্বমোট কাপড়: <strong className="text-[#850B1B]">{combinedTotalYards} গজ (৳{totalPrice})</strong>
                </span>
              </div>
            )}
          </div>

          {/* Primary Action Buttons: Add to Cart & Buy Now */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
            <button
              type="button"
              onClick={() =>
                addToCart(
                  product,
                  combinedTotalYards,
                  selectedColor,
                  true,
                  buildCustomizationPayload()
                )
              }
              disabled={product.stockYards <= 0}
              className="py-3 px-4 sm:py-3.5 sm:px-6 bg-[#FAF6EE] hover:bg-[#F3ECE0] text-[#850B1B] border border-[#850B1B] rounded-xl text-xs sm:text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-[#850B1B] shrink-0" />
              <span className="whitespace-nowrap">কার্টে যোগ করুন</span>
            </button>

            <button
              type="button"
              onClick={() =>
                buyNow(
                  product,
                  combinedTotalYards,
                  selectedColor,
                  buildCustomizationPayload()
                )
              }
              disabled={product.stockYards <= 0}
              className="py-3 px-4 sm:py-3.5 sm:px-6 bg-[#850B1B] hover:bg-[#6B0815] text-white rounded-xl text-xs sm:text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <span className="truncate">এখনই কিনুন · ৳{totalPrice}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Addon Fabric Collection Modal */}
      {activeCollectionModalAddonId && (() => {
        const addonOption = ADDITIONAL_CLOTHING_OPTIONS.find(
          (a) => a.id === activeCollectionModalAddonId
        );
        if (!addonOption) return null;
        const fabricsList = (addonFabricCollections[addonOption.id] || []).filter(
          (f) => f.isActive !== false
        );
        const currentSelected =
          selectedAddonFabrics[addonOption.id] || fabricsList[0] || null;

        return (
          <AddonFabricCollectionModal
            isOpen={true}
            onClose={() => setActiveCollectionModalAddonId(null)}
            addonId={addonOption.id}
            addonName={addonOption.name}
            addonTemplateImage={addonOption.image}
            yardsPerUnit={addonOption.yardsPerUnit}
            fabrics={fabricsList}
            selectedFabricId={currentSelected?.id || null}
            onSelectFabric={(fabric) => handleSelectAddonFabric(addonOption.id, fabric)}
            toBengaliNumber={toBengaliNumber}
          />
        );
      })()}
    </div>
  );
};
