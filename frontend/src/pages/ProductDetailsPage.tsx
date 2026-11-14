import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { FabricPatternVisual, StudioViewAngle } from '../components/common/FabricPatternVisual';
import { ProductCard } from '../components/common/ProductCard';
import { OrangeBackButton } from '../components/common/OrangeBackButton';
import { getUniqueProductFabricImage } from '../components/home/allProductsImageGenerator';
import {
  measurementService,
  CUSTOM_MEASUREMENT_FIELDS
} from '../services/measurementService';
import {
  CategoryMeasurementGuideRecord,
  CustomerCustomMeasurements,
  CustomMeasurementFieldKey,
  ProductCustomizationPayload,
  AddonFabricOption,
  SelectedAddonDetail
} from '../types';
import { AddonFabricCollectionModal } from '../components/product/AddonFabricCollectionModal';
import { DynamicFabricGarmentImage } from '../components/product/DynamicFabricGarmentImage';
import { INITIAL_ADDON_FABRIC_COLLECTIONS } from '../data/seedData';
import {
  ShoppingCart,
  X,
  Star,
  Ruler,
  CheckCircle2,
  Scissors,
  Check,
  Shirt
} from 'lucide-react';

const PRODUCT_COLOR_SWATCHES: Record<string, string> = {
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
  'এমেরাল্ড গ্রিন': '#14533C',
  'বটল গ্রিন': '#16402D',
  'সবুজ': '#2E6F40',
  'অলিভ': '#556B2F',
  'রয়েল ব্লু': '#1D3557',
  'রয়্যাল ব্লু': '#1D3557',
  'নেভি ব্লু': '#121F3D',
  'ইনডিগো ব্লু': '#23395B',
  'ইনডিগো': '#23395B',
  'নীল': '#1D3557',
  'ব্ল্যাক': '#1C1917',
  'কালো': '#1C1917',
  'সাদা': '#F8F7F4',
  'হোয়াইট': '#F8F7F4',
  'ডাস্টি রোজ': '#C08081',
  'ব্লাশ পিঙ্ক': '#DF9B9B',
  'গোলাপি': '#DF9B9B',
  'পিচ': '#E2A287',
  'টেরাকোটা': '#A34828',
  'রাস্ট': '#9C4123',
  'মাস্টার্ড': '#C9972B',
  'হলুদ': '#E0AC2C',
  'পার্পল': '#5E2750',
  'বেগুনী': '#5E2750',
  'ল্যাভেন্ডার': '#8C7BAE',
  'টিয়াল': '#1F5662',
  'কপার': '#A85A3A',
  'ন্যাচারাল': '#C5A46D',
  'অ্যান্টিক গোল্ড': '#B68A3A',
  'শ্যাম্পেইন গোল্ড': '#D5B26E'
};

export interface ProductOutfitOption {
  id: string;
  name: string;
  nameEn: string;
  image: string;
  suggestedYards: {
    '3.5': number;
    '2.5': number;
  };
  description: string;
}

export const PRODUCT_OUTFIT_OPTIONS: ProductOutfitOption[] = [
  {
    id: 'kameez',
    name: 'কামিজ',
    nameEn: 'Kamiz',
    image: '/src/assets/images/sketch_kameez_hd_1794420343710.jpg',
    suggestedYards: { '3.5': 2.0, '2.5': 2.5 },
    description: 'রেগুলার বা ক্লাসিক কামিজ'
  },
  {
    id: 'short_kameez',
    name: 'শর্ট কামিজ',
    nameEn: 'Short Kamiz',
    image: '/src/assets/images/sketch_short_kameez_custom.png',
    suggestedYards: { '3.5': 1.5, '2.5': 2.0 },
    description: 'শর্ট কামিজ ও টপস'
  },
  {
    id: 'kurti',
    name: 'কটি',
    nameEn: 'Koti',
    image: '/src/assets/images/sketch_koti_hd_1794421085126.jpg',
    suggestedYards: { '3.5': 1.5, '2.5': 2.0 },
    description: 'স্মার্ট কটি'
  },
  {
    id: 'kamiz_dupatta',
    name: 'ওড়না সহ কামিজ',
    nameEn: 'Kamiz with Dupatta',
    image: '/src/assets/images/sketch_kamiz_dupatta_1794419377040.jpg',
    suggestedYards: { '3.5': 4.5, '2.5': 5.0 },
    description: 'ওড়না সহ থ্রি-পিস সেট'
  },
  {
    id: 'gown',
    name: 'গাউন',
    nameEn: 'Gown',
    image: '/src/assets/images/sketch_gown_1794419378820.jpg',
    suggestedYards: { '3.5': 3.5, '2.5': 4.5 },
    description: 'লং ফ্লেয়ার্ড গাউন'
  },
  {
    id: 'lehenga',
    name: 'লেহেঙ্গা',
    nameEn: 'Lehenga',
    image: '/src/assets/images/sketch_lehenga_1794419380763.jpg',
    suggestedYards: { '3.5': 4.0, '2.5': 5.0 },
    description: 'ঘেরালো পার্টি লেহেঙ্গা'
  },
  {
    id: 'saree',
    name: 'শাড়ি',
    nameEn: 'Saree',
    image: '/src/assets/images/sketch_saree_1794419379896.jpg',
    suggestedYards: { '3.5': 6.0, '2.5': 6.0 },
    description: '১২ হাত ফুল বডি শাড়ি'
  }
];

function getInitialOutfitId(category?: string): string {
  const clean = (category || '').toLowerCase();
  if (clean.includes('শর্ট') || clean.includes('short')) return 'short_kameez';
  if (clean.includes('কটি') || clean.includes('koti') || clean.includes('kurti')) return 'kurti';
  if (clean.includes('ওড়না') || clean.includes('orna')) return 'kamiz_dupatta';
  if (clean.includes('লেহেঙ্গা') || clean.includes('lehenga')) return 'lehenga';
  if (clean.includes('গাউন') || clean.includes('gown')) return 'gown';
  if (clean.includes('শাড়ি') || clean.includes('শাড়ি') || clean.includes('saree')) return 'saree';
  return 'kameez';
}

export interface AdditionalProductItemOption {
  id: string;
  name: string;
  shortName: string;
  yardsLabel: string;
  yardsPerUnit: number;
  image: string;
}

export const ADDITIONAL_CLOTHING_OPTIONS: AdditionalProductItemOption[] = [
  {
    id: 'inner',
    name: 'ইনার (Inner)',
    shortName: 'ইনার',
    yardsLabel: 'প্রতিটি ২ গজ',
    yardsPerUnit: 2.0,
    image: '/src/assets/images/addon_inner_no_human_1794225834157.jpg'
  },
  {
    id: 'pant',
    name: 'প্যান্ট (Pant)',
    shortName: 'প্যান্ট',
    yardsLabel: 'প্রতিটি ২ গজ',
    yardsPerUnit: 2.0,
    image: '/src/assets/images/addon_pant_no_human_1794225834730.jpg'
  },
  {
    id: 'palazzo',
    name: 'প্লাজো (Palazzo)',
    shortName: 'প্লাজো',
    yardsLabel: 'প্রতিটি ২.৫ গজ',
    yardsPerUnit: 2.5,
    image: '/src/assets/images/addon_palazzo_no_human_1794225836589.jpg'
  },
  {
    id: 'orna',
    name: 'সেটের ওড়না (Orna)',
    shortName: 'সেটের ওড়না',
    yardsLabel: 'প্রতিটি ২.৫ গজ',
    yardsPerUnit: 2.5,
    image: '/src/assets/images/addon_set_orna_no_human_1794225838844.jpg'
  },
  {
    id: 'skirt',
    name: 'স্কার্ট (Skirt)',
    shortName: 'স্কার্ট',
    yardsLabel: 'প্রতিটি ৩ গজ',
    yardsPerUnit: 3.0,
    image: '/src/assets/images/outfit_lehenga_no_human_1794205254301.jpg'
  },
  {
    id: 'blouse',
    name: 'ব্লাউজ (Blouse)',
    shortName: 'ব্লাউজ',
    yardsLabel: 'প্রতিটি ১.৫ গজ',
    yardsPerUnit: 1.5,
    image: '/src/assets/images/addon_blouse_no_human_1794225839884.jpg'
  }
];

const BENGALI_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
function toBengaliNumber(val: number | string): string {
  return String(val).replace(/\d/g, (d) => BENGALI_NUMERALS[Number(d)]);
}

const resolveColorSwatch = (colorName: string, fallbackHex?: string): string => {
  if (!colorName) return fallbackHex || '#C5A46D';
  for (const [key, hex] of Object.entries(PRODUCT_COLOR_SWATCHES)) {
    if (colorName.toLowerCase().includes(key.toLowerCase())) {
      return hex;
    }
  }
  return fallbackHex || '#C5A46D';
};

export const ProductDetailsPage: React.FC = () => {
  const {
    selectedProductId,
    products,
    addToCart,
    buyNow,
    navigateTo,
    settings,
    showToast
  } = useStore();

  const product = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  const catSlug = useMemo(
    () => (product ? measurementService.resolveCategorySlug(product.category) : 'kamiz'),
    [product]
  );

  const [measurementGuide, setMeasurementGuide] = useState<CategoryMeasurementGuideRecord>(() =>
    measurementService.getCategoryMeasurementGuide(product?.fabricWidth || '3.5', catSlug)
  );

  const [selectedOutfitId, setSelectedOutfitId] = useState<string>(() =>
    getInitialOutfitId(product?.category)
  );

  const selectedOutfit = useMemo(
    () =>
      PRODUCT_OUTFIT_OPTIONS.find((o) => o.id === selectedOutfitId) ||
      PRODUCT_OUTFIT_OPTIONS[0],
    [selectedOutfitId]
  );

  const customConfig = useMemo(() => {
    if (!product) {
      return measurementService.getDefaultProductCustomConfig('3.5', 'কামিজ', 250);
    }
    void measurementGuide;
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
      enabled: baseCfg.enabled,
      standardGaj: outfitStandardGaj,
      minAllowedGaj: Math.min(outfitDefaults.minAllowedGaj, outfitStandardGaj),
      maxAllowedGaj: Math.max(outfitDefaults.maxAllowedGaj, outfitStandardGaj + 3)
    };
  }, [product, measurementGuide, selectedOutfit]);

  const [sizeMode, setSizeMode] = useState<'standard' | 'custom'>('standard');
  const [customMeasurements, setCustomMeasurements] = useState<CustomerCustomMeasurements>({
    chest: '',
    waist: '',
    hip: '',
    length: '',
    sleeve: '',
    shoulder: ''
  });
  const [customizationNotes, setCustomizationNotes] = useState<string>('');
  const [standardQuantity, setStandardQuantity] = useState<number>(1);
  const [additionalItemCounts, setAdditionalItemCounts] = useState<Record<string, number>>({});
  const [activeCollectionModalAddonId, setActiveCollectionModalAddonId] = useState<string | null>(null);

  const addonFabricCollections = useMemo<Record<string, AddonFabricOption[]>>(() => {
    return settings?.addonFabricCollections || INITIAL_ADDON_FABRIC_COLLECTIONS;
  }, [settings?.addonFabricCollections]);

  const [selectedAddonFabrics, setSelectedAddonFabrics] = useState<Record<string, AddonFabricOption>>(() => {
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

  const handleSelectAddonFabric = (addonId: string, fabric: AddonFabricOption) => {
    setSelectedAddonFabrics((prev) => ({
      ...prev,
      [addonId]: fabric
    }));
    // Auto-increment quantity to 1 if it was 0 so the user gets what they just picked
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
  const [yards, setYards] = useState<number>(() => {
    const initOutfit = PRODUCT_OUTFIT_OPTIONS.find((o) => o.id === getInitialOutfitId(product?.category));
    return (product ? initOutfit?.suggestedYards[product.fabricWidth] : undefined) || customConfig.standardGaj || 2.0;
  });
  const [selectedColor, setSelectedColor] = useState<string>(product?.color || '');
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);
  const [isDeepZoomed, setIsDeepZoomed] = useState<boolean>(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Build gallery images list from uploaded URLs/DataURIs + default studio fabric image
  const galleryImages = useMemo(() => {
    if (!product) return [];
    const primaryDefault = getUniqueProductFabricImage(product);
    const customUploads = (product.images || []).filter(
      (img) =>
        img.startsWith('http://') ||
        img.startsWith('https://') ||
        img.startsWith('data:image/') ||
        img.startsWith('/')
    );
    if (customUploads.length > 0) {
      return customUploads;
    }
    return [primaryDefault];
  }, [product]);

  useEffect(() => {
    if (product) {
      const slug = measurementService.resolveCategorySlug(product.category);
      const guide = measurementService.getCategoryMeasurementGuide(product.fabricWidth, slug);
      setMeasurementGuide(guide);
      const resolvedCfg = measurementService.getProductCustomMeasurementConfig(product);
      const initOutfit = getInitialOutfitId(product.category);
      setSelectedOutfitId(initOutfit);
      const matchedOutfit = PRODUCT_OUTFIT_OPTIONS.find((o) => o.id === initOutfit);
      const initialGaj =
        matchedOutfit?.suggestedYards[product.fabricWidth] ??
        resolvedCfg.standardGaj ??
        guide.suggestedYards ??
        product.minOrderQuantity ??
        (product.fabricWidth === '3.5' ? 2.0 : 2.5);
      setSizeMode('standard');
      setStandardQuantity(1);
      setAdditionalItemCounts({});
      setCustomMeasurements({
        chest: '',
        waist: '',
        hip: '',
        length: '',
        sleeve: '',
        shoulder: ''
      });
      setCustomizationNotes('');
      setYards(initialGaj);
      setSelectedColor(product.color);
      setActiveSlideIndex(0);
      setIsZoomModalOpen(false);
      setIsDeepZoomed(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product]);

  const handleSelectOutfit = (outfit: ProductOutfitOption) => {
    if (!product) return;
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

  useEffect(() => {
    const handleGuideRefresh = () => {
      if (!product) return;
      const slug = measurementService.resolveCategorySlug(product.category);
      setMeasurementGuide(measurementService.getCategoryMeasurementGuide(product.fabricWidth, slug));
    };
    window.addEventListener('fabric-measurements-updated', handleGuideRefresh);
    return () => window.removeEventListener('fabric-measurements-updated', handleGuideRefresh);
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-lg font-bold text-[#1C1B19]">পণ্যটি খুঁজে পাওয়া যায়নি</p>
        <OrangeBackButton label="হোমে ফিরে যান" onClick={() => navigateTo('home')} />
      </div>
    );
  }

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

  const handleAdditionalItemToggle = (itemId: string, delta: number) => {
    setAdditionalItemCounts((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, Math.min(10, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const effectivePrice = product.discountPrice || product.pricePerYard;
  const mainFabricBreakdown = measurementService.calculateCustomFabricPrice(
    product,
    yards,
    customConfig
  );

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

  const priceBreakdown = measurementService.calculateCustomFabricPrice(
    product,
    combinedTotalYards,
    customConfig
  );
  const totalPrice = mainFabricBreakdown.totalPrice + addonTotalPrice;
  const hasDiscount = !!product.discountPrice && product.discountPrice < product.pricePerYard;

  const applicableMeasurementFields = CUSTOM_MEASUREMENT_FIELDS.filter((field) =>
    customConfig.applicableFields.includes(field.key)
  );

  // Related products from the same Bahar & category (never mixing 3.5 and 2.5 Bahar automatically)
  const relatedProducts = products
    .filter(
      (p) =>
        p.id !== product.id &&
        p.isActive &&
        p.fabricWidth === product.fabricWidth &&
        (measurementService.resolveCategorySlug(p.category) === catSlug ||
          p.fabricWidth === product.fabricWidth)
    )
    .slice(0, 3);

  const minAllowedYards = sizeMode === 'custom' ? customConfig.minAllowedGaj : 0.5;
  const maxAllowedYards = Math.min(
    Math.max(1, product.stockYards),
    sizeMode === 'custom' ? customConfig.maxAllowedGaj : Math.max(1, product.stockYards)
  );

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

  const handleMeasurementInput = (
    key: CustomMeasurementFieldKey,
    value: string
  ) => {
    setCustomMeasurements((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const maxStandardQuantity = Math.max(
    1,
    Math.floor(product.stockYards / (customConfig.standardGaj || 1))
  );

  const handleStandardQuantityChange = (nextQty: number) => {
    const clampedQty = Math.max(1, Math.min(maxStandardQuantity, nextQty));
    setStandardQuantity(clampedQty);
    setYards(Number((clampedQty * customConfig.standardGaj).toFixed(2)));
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

  const buildCustomizationPayload = (): ProductCustomizationPayload => {
    const cleanedMeasurements: CustomerCustomMeasurements = {};
    if (sizeMode === 'custom') {
      for (const field of applicableMeasurementFields) {
        const val = customMeasurements[field.key]?.trim();
        if (val) {
          cleanedMeasurements[field.key] = val;
        }
      }
    }
    const currentOutfit = PRODUCT_OUTFIT_OPTIONS.find((o) => o.id === selectedOutfitId);
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

    const combinedOutfitCategory = currentOutfit?.name
      ? selectedAddonsSummary
        ? `${currentOutfit.name} + ${selectedAddonsSummary}`
        : currentOutfit.name
      : selectedAddonsSummary || undefined;

    return {
      isCustomized: sizeMode === 'custom' || !!currentOutfit || !!selectedAddonsSummary,
      sizeMode,
      standardGaj: customConfig.standardGaj,
      customGaj: combinedTotalYards,
      additionalGaj: priceBreakdown.additionalGaj,
      measurements: sizeMode === 'custom' ? cleanedMeasurements : undefined,
      customizationNotes:
        sizeMode === 'custom' && customizationNotes.trim()
          ? customizationNotes.trim()
          : undefined,
      additionalPricePerYard: priceBreakdown.additionalPricePerYard,
      finalProductPrice: totalPrice,
      outfitCategory: combinedOutfitCategory,
      outfitId: currentOutfit?.id as any,
      outfitImage: currentOutfit?.image,
      selectedAddons: selectedAddonsDetails.length > 0 ? selectedAddonsDetails : undefined
    };
  };



  const studioAngles: Array<{ id: StudioViewAngle; label: string; subtitle: string }> = [
    { id: 'drape', label: 'ড্র্যাপিং ও কুঁচির ফল', subtitle: 'প্লিট ভিউ' },
    { id: 'texture', label: 'ম্যাক্রো সুতা ও বুনন', subtitle: 'ক্লোজ-আপ জুম' }
  ];

  // Unified side-by-side slides inside the single gallery box
  const gallerySlides = [
    ...galleryImages.map((imgUrl, idx) => ({
      key: `img-${idx}`,
      type: 'image' as const,
      src: imgUrl,
      label: idx === 0 ? 'আসল ফ্যাব্রিক ফটো' : `ফ্যাব্রিক ফটো #${idx + 1}`,
      subtitle: 'এইচডি ছবি'
    })),
    ...studioAngles.map((angle) => ({
      key: `angle-${angle.id}`,
      type: 'angle' as const,
      angle: angle.id,
      label: angle.label,
      subtitle: angle.subtitle
    }))
  ];

  const totalSlides = gallerySlides.length;
  const safeSlideIndex = Math.min(activeSlideIndex, Math.max(0, totalSlides - 1));
  const currentSlide = gallerySlides[safeSlideIndex] || gallerySlides[0];

  const handlePrevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDeepZoomed(false);
    setActiveSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDeepZoomed(false);
    setActiveSlideIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length > 0) {
      setTouchStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || !e.changedTouches || e.changedTouches.length === 0) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        handleNextSlide();
      } else {
        handlePrevSlide();
      }
    }
    setTouchStartX(null);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-3 sm:px-8 py-3 sm:py-6 space-y-3 sm:space-y-6 pb-20 sm:pb-24">
      {/* 1. Top Orange Back Button */}
      <div className="flex items-center">
        <OrangeBackButton label="ফিরে যান" />
      </div>

      {/* 2. Main Contiguous Purchase Module (Sticky Gallery Left + Sticky Purchase Module Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-8 lg:gap-14 items-start">
        {/* Left Column: Clean Single Frame Side-by-Side Image Viewer with Click-to-Zoom Full View (6 Cols) */}
        <div className="lg:col-span-6 lg:sticky lg:top-28">
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-[#F3EFE6] border border-[#E6DFD3] select-none">
            {/* Side-by-Side Horizontal Scroll-Snap Track Inside Single Box */}
            <div
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.clientWidth > 0) {
                  const idx = Math.round(el.scrollLeft / el.clientWidth);
                  if (idx !== safeSlideIndex && idx >= 0 && idx < totalSlides) {
                    setActiveSlideIndex(idx);
                  }
                }
              }}
              className="flex w-full aspect-[4/3] sm:aspect-square overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {gallerySlides.map((slide, idx) => (
                <div
                  key={slide.key}
                  onClick={() => {
                    setActiveSlideIndex(idx);
                    setIsDeepZoomed(false);
                    setIsZoomModalOpen(true);
                  }}
                  className="w-full h-full shrink-0 snap-center relative overflow-hidden bg-[#F3EFE6] cursor-zoom-in"
                >
                  {slide.type === 'image' ? (
                    <img
                      src={slide.src}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FabricPatternVisual
                      productId={product.id}
                      patternType={product.patternType}
                      colorHex={product.colorHex}
                      fabricWidth={product.fabricWidth}
                      categorySlug={catSlug}
                      title={product.name}
                      aspectRatio="square"
                      viewAngle={slide.angle}
                      enableInteractiveLoupe={false}
                      zoomOnHover={false}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Contiguous Purchase Module (6 Cols) */}
        <div className="lg:col-span-6 space-y-3.5 sm:space-y-6 bg-white p-3.5 sm:p-10 rounded-xl sm:rounded-2xl border border-[#E6DFD3]">
          {/* Metadata, Title & Customer Reviews */}
          <div className="space-y-2 sm:space-y-3 border-b border-[#E6DFD3] pb-3 sm:pb-6">
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] sm:text-sm text-[#1C1B19]/65">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-[#850B1B] bg-[#FAF6F0] px-2 py-0.5 sm:px-2.5 rounded border border-[#D5A64A]/45">
                  {product.fabricWidth} হাত বহর ({product.fabricWidth === '3.5' ? '৫৬–৬০ ইঞ্চি' : '৪২–৪৪ ইঞ্চি'})
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#1C1B19]">{product.category}</span>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span className="hidden sm:inline font-mono text-xs">{product.sku}</span>
              </div>

              {product.rating && (
                <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#850B1B] bg-[#FAF6F0] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-[#D5A64A]/40">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#D5A64A] text-[#D5A64A]" />
                  <span>{product.rating}</span>
                  {product.reviewCount && (
                    <span className="text-[#1C1B19]/60 font-medium">
                      ({product.reviewCount}টি রিভিউ)
                    </span>
                  )}
                </div>
              )}
            </div>

            <h1 className="text-[17px] sm:text-3xl font-bold text-[#1C1B19] leading-snug">
              {product.name}
            </h1>

            {product.description?.trim() ? (
              <p className="text-xs sm:text-base text-[#1C1B19]/75 leading-relaxed">
                {product.description}
              </p>
            ) : null}
          </div>

          {/* Price Per Yard & Stock Availability */}
          <div className="flex items-center justify-between gap-2 bg-[#FAF8F4] sm:bg-transparent p-2.5 sm:p-0 rounded-xl sm:rounded-none border border-[#EDE5D9] sm:border-0">
            <div>
              <span className="text-[11px] sm:text-xs text-[#1C1B19]/60 block mb-0.5 sm:mb-1">গজ প্রতি মূল্য</span>
              <div className="flex items-baseline gap-1.5 sm:gap-2.5">
                <span className="text-xl sm:text-4xl font-bold text-[#850B1B] tabular-nums">
                  ৳{effectivePrice}
                </span>
                <span className="text-[11px] sm:text-sm font-medium text-[#1C1B19]/70">/ প্রতি গজ</span>
                {hasDiscount && (
                  <span className="text-xs sm:text-base text-[#1C1B19]/40 line-through tabular-nums">
                    ৳{product.pricePerYard}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`text-xs sm:text-sm font-semibold block ${
                  product.stockYards > 0 ? 'text-emerald-800' : 'text-rose-700'
                }`}
              >
                {product.stockYards > 0
                  ? `স্টকে উপলব্ধ (${product.stockYards} গজ)`
                  : 'স্টক আউট'}
              </span>
              <span className="text-[11px] sm:text-xs text-[#850B1B] font-semibold">
                প্রস্তাবিত পরিমাণ: {customConfig.standardGaj} গজ
              </span>
            </div>
          </div>

          {/* এই কাপড় দিয়ে আপনি যা যা বানাতে পারবেন — Matches image_667c3d82.png */}
          <div className="bg-[#FAF7F2] p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E8DEC8] relative space-y-2.5">
            {/* Header: Clean box shape, no background color fill — Matches image_f0a41ea8.png */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-lg border border-[#E6DFD3] bg-white text-[#1C1B19] shadow-2xs">
                <Shirt className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#850B1B] shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-[#1C1B19]">
                  এই কাপড় দিয়ে আপনি যা যা বানাতে পারবেন
                </span>
              </div>
            </div>

            {/* Horizontal Outfit Cards Row — Box-shaped, larger size for crystal-clear view */}
            <div className="flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto pb-1.5 pt-1 scrollbar-thin scrollbar-thumb-[#D5A64A]/30">
              {PRODUCT_OUTFIT_OPTIONS.map((outfit) => {
                const isSelected = selectedOutfitId === outfit.id;
                return (
                  <button
                    key={outfit.id}
                    type="button"
                    onClick={() => handleSelectOutfit(outfit)}
                    className={`group w-[96px] sm:w-[116px] shrink-0 rounded-lg overflow-hidden text-left transition-all cursor-pointer relative flex flex-col ${
                      isSelected
                        ? 'border-2 border-[#850B1B] shadow-sm bg-white'
                        : 'border border-[#DCD3C5] hover:border-[#850B1B]/50 bg-white'
                    }`}
                  >
                    {/* Selected Checkmark Badge (top-right, box shape) */}
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md bg-[#850B1B] text-white flex items-center justify-center shadow-xs z-10">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}

                    {/* Outfit Garment Photo dynamically rendered in this product's exact fabric */}
                    <div className="aspect-[3/4] w-full bg-[#FAF3E8] overflow-hidden relative">
                      <DynamicFabricGarmentImage
                        templateSrc={outfit.image}
                        fabricSrc={galleryImages[0] || getUniqueProductFabricImage(product)}
                        colorTintHex={resolveColorSwatch(selectedColor || product.color, product.colorHex)}
                        alt={outfit.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Bottom Box Label */}
                    <div
                      className={`py-1.5 px-1 text-center font-bold text-xs sm:text-[13px] leading-tight transition-colors ${
                        isSelected
                          ? 'bg-[#850B1B] text-white'
                          : 'bg-[#F5EDE1] text-[#1C1B19] group-hover:bg-[#ECE1D1]'
                      }`}
                    >
                      <span className="block truncate">{outfit.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector — Matches image_c3ac35f9.png */}
          {product.availableColors && product.availableColors.length > 0 && (
            <div className="space-y-2 sm:space-y-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-[#850B1B]">
                রং নির্বাচন করুন
              </h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {product.availableColors.map((c) => {
                  const active = selectedColor === c;
                  const swatchHex = resolveColorSwatch(c, product.colorHex);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm transition-all cursor-pointer border ${
                        active
                          ? 'bg-[#850B1B] text-white border-[#850B1B] shadow-2xs font-semibold'
                          : 'bg-white text-[#1C1B19] border-[#E6DFD3] hover:border-[#C5A46D] font-medium'
                      }`}
                    >
                      <span
                        className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full shrink-0 border border-black/15 shadow-2xs"
                        style={{ backgroundColor: swatchHex }}
                      />
                      <span>{c}</span>
                      {active && (
                        <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white flex items-center justify-center shrink-0 ml-0.5">
                          <Check className="w-2 sm:w-2.5 h-2 sm:h-2.5 text-[#850B1B] stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Measurement Feature: স্ট্যান্ডার্ড সাইজ vs নিজের মাপে কাস্টমাইজ করুন */}
          {customConfig.enabled && (
            <div className="p-3 sm:p-4 bg-[#FAF8F4] rounded-xl border border-[#E6DFD3] space-y-2 sm:space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#850B1B] shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-[#1C1B19]">
                    পোশাকের মাপ ও কাস্টমাইজেশন অপশন
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[#850B1B] bg-[#850B1B]/10 px-2 py-0.5 rounded-md">
                  স্ট্যান্ডার্ড গজ: {customConfig.standardGaj} গজ
                </span>
              </div>

              {/* Two Options: স্ট্যান্ডার্ড সাইজ | নিজের মাপে কাস্টমাইজ করুন */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {/* 1. Standard Size Option */}
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

                {/* 2. Custom Measurement Option */}
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
                      className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        sizeMode === 'custom'
                          ? 'bg-[#D5A64A] text-[#1C1B19]'
                          : 'bg-[#D5A64A]/20 text-[#7A4E12] border border-[#D5A64A]/50'
                      }`}
                    >
                      কাস্টম ফিটিং ✂️
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
                <div className="px-3 py-2 sm:px-3.5 sm:py-2 bg-white rounded-lg border border-[#E6DFD3] flex flex-wrap items-center justify-between gap-1.5">
                  <div className="space-y-0">
                    <span className="text-[11px] sm:text-xs font-bold text-[#1C1B19] block leading-tight">
                      পোশাকের সংখ্যা নির্বাচন করুন (প্রতিটি {customConfig.standardGaj} গজ):
                    </span>
                    <span className="text-[11px] sm:text-xs text-[#1C1B19]/75 block leading-tight mt-0.5">
                      নির্বাচিত: <strong className="text-[#850B1B]">{standardQuantity}টি {selectedOutfit.name}</strong> ({yards} গজ) · মোট: <strong className="text-[#850B1B]">৳{totalPrice}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStandardQuantityChange(standardQuantity - 1)}
                      disabled={standardQuantity <= 1}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FAF8F4] border border-[#DCD3C2] text-sm font-bold text-[#850B1B] hover:bg-[#EDE5D9]/60 disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors"
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
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FAF8F4] border border-[#DCD3C2] text-sm font-bold text-[#850B1B] hover:bg-[#EDE5D9]/60 disabled:opacity-40 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {sizeMode === 'custom' && (
                <div className="p-3 sm:p-4 bg-white rounded-lg border border-[#D5A64A]/45 space-y-3 sm:space-y-4">
                  {/* Fabric Quantity Customization (0.25 Gaj steps + Quick Presets + Comparison with Standard Gaj) */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="text-[11px] sm:text-xs font-bold text-[#1C1B19]">
                        কাস্টম মাপের জন্য কাপড়ের গজ নির্বাচন করুন:
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-[#1C1B19]/65">
                        অনুমোদিত সীমা: {customConfig.minAllowedGaj} গজ – {Math.min(customConfig.maxAllowedGaj, Math.max(1, product.stockYards))} গজ
                      </span>
                    </div>

                    {/* Quick 0.25 Gaj Step Pills Around Standard Gaj */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {Array.from(
                        new Set([
                          customConfig.standardGaj,
                          Number((customConfig.standardGaj + 0.25).toFixed(2)),
                          Number((customConfig.standardGaj + 0.5).toFixed(2)),
                          Number((customConfig.standardGaj + 0.75).toFixed(2)),
                          Number((customConfig.standardGaj + 1).toFixed(2)),
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
                            className={`px-2 py-1 sm:px-2.5 rounded text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer ${
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

                    {/* Manual 0.25 Gaj Adjuster & Live Comparison Summary */}
                    <div className="p-2.5 sm:p-3 bg-[#FAF8F4] rounded-lg border border-[#E6DFD3] flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleYardChange(-0.25)}
                          disabled={yards <= customConfig.minAllowedGaj}
                          className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-white border border-[#DCD3C2] rounded text-[11px] sm:text-xs font-bold text-[#850B1B] hover:bg-[#EDE5D9]/50 disabled:opacity-40 cursor-pointer"
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
                          className="w-14 sm:w-16 py-1 sm:py-1.5 bg-white border border-[#DCD3C2] rounded text-center text-xs font-bold text-[#1C1B19] tabular-nums focus:outline-hidden focus:border-[#850B1B]"
                        />
                        <button
                          type="button"
                          onClick={() => handleYardChange(0.25)}
                          disabled={yards >= Math.min(customConfig.maxAllowedGaj, Math.max(1, product.stockYards))}
                          className="px-2 py-1 sm:px-2.5 sm:py-1.5 bg-white border border-[#DCD3C2] rounded text-[11px] sm:text-xs font-bold text-[#850B1B] hover:bg-[#EDE5D9]/50 disabled:opacity-40 cursor-pointer"
                        >
                          + 0.25 গজ
                        </button>
                      </div>

                      <div className="text-[11px] sm:text-xs space-y-0.5 text-right">
                        <div className="text-[#1C1B19]/75">
                          স্ট্যান্ডার্ড গজ: <strong>{customConfig.standardGaj} গজ</strong> · নির্বাচিত গজ: <strong className="text-[#850B1B]">{yards} গজ</strong>
                        </div>
                        <div className="text-[#1C1B19]/80">
                          অতিরিক্ত গজ:{' '}
                          <strong className="text-[#850B1B]">
                            {priceBreakdown.additionalGaj > 0 ? `+${priceBreakdown.additionalGaj} গজ` : '০ গজ'}
                          </strong>
                          {' · '}মোট কাপড়ের মূল্য: <strong className="text-[#850B1B]">৳{totalPrice}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optional Customization Notes */}
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-[11px] font-semibold text-[#1C1B19]/80 block">
                      কাস্টমাইজেশন নোট / বিশেষ নির্দেশনা (ঐচ্ছিক):
                    </label>
                    <input
                      type="text"
                      value={customizationNotes}
                      onChange={(e) => setCustomizationNotes(e.target.value)}
                      placeholder="যেমন: লুজ ফিট হবে, হাতায় কুচি বা অন্য কোনো নির্দেশনা..."
                      className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 bg-[#FAF8F4] border border-[#DCD3C2] rounded-md text-xs text-[#1C1B19] focus:outline-hidden focus:border-[#850B1B]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ২. অতিরিক্ত পোশাকের অংশ যোগ করুন (ঐচ্ছিক) — Matches image_42629bcf.png with garment photos & সেটের ওড়না */}
          <div className="p-3 sm:p-5 bg-[#FAF8F4] rounded-xl border border-[#E6DFD3] space-y-2.5 sm:space-y-3.5">
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-[#1C1B19]">
                ২. অতিরিক্ত পোশাকের অংশ যোগ করুন (ঐচ্ছিক):
              </h3>
              <p className="text-[11px] sm:text-xs text-[#5C433E]/85">
                প্যান্ট, সেটের ওড়না, ইনার ইত্যাদি
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
                              ? galleryImages[0] || getUniqueProductFabricImage(product)
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

          {/* Primary Action Buttons: Add to Cart & Buy Now — Matches image_6859b2cb.png */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 pt-1 sm:pt-2">
            <button
              type="button"
              onClick={() => addToCart(product, combinedTotalYards, selectedColor, true, buildCustomizationPayload())}
              disabled={product.stockYards <= 0}
              className="py-2.5 px-3 sm:py-3.5 sm:px-6 bg-[#FAF6EE] hover:bg-[#F3ECE0] text-[#850B1B] border border-[#850B1B] rounded-xl text-xs sm:text-base font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2.5 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-[#850B1B] shrink-0" />
              <span className="whitespace-nowrap">কার্টে যোগ করুন</span>
            </button>

            <button
              type="button"
              onClick={() => buyNow(product, combinedTotalYards, selectedColor, buildCustomizationPayload())}
              disabled={product.stockYards <= 0}
              className="py-2.5 px-3 sm:py-3.5 sm:px-6 bg-[#850B1B] hover:bg-[#6B0815] text-white rounded-xl text-xs sm:text-base font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <span className="truncate">এখনই কিনুন · ৳{totalPrice}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Related Products in 3-Column Grid */}
      {relatedProducts.length > 0 && (
        <section className="pt-6 sm:pt-12 border-t border-[#E6DFD3] space-y-4 sm:space-y-8">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-[#850B1B]">সমজাতীয় কালেকশন</p>
              <h2 className="text-base sm:text-3xl font-bold text-[#1C1B19] mt-0.5 sm:mt-1">
                আপনার পছন্দ হতে পারে এমন আরও কাপড় ({product.fabricWidth} হাত বহর)
              </h2>
            </div>
            <button
              onClick={() =>
                navigateTo('category-gallery', {
                  width: product.fabricWidth,
                  category: catSlug
                })
              }
              className="text-xs sm:text-sm font-semibold text-[#850B1B] hover:underline cursor-pointer shrink-0"
            >
              সব দেখুন →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Fullscreen Zoom & Side-by-Side Lightbox Modal */}
      {isZoomModalOpen && (
        <div
          onClick={() => {
            setIsZoomModalOpen(false);
            setIsDeepZoomed(false);
          }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none"
        >
          <button
            type="button"
            onClick={() => {
              setIsZoomModalOpen(false);
              setIsDeepZoomed(false);
            }}
            aria-label="বন্ধ করুন"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer z-30"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Center Zoomable Side-by-Side Slide Viewer */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsDeepZoomed((prev) => !prev);
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative w-full max-w-2xl aspect-square flex items-center justify-center overflow-hidden rounded-2xl"
          >
            <div
              className={`relative w-full h-full overflow-hidden bg-[#F3EFE6] transition-transform duration-300 ${
                isDeepZoomed ? 'scale-150 sm:scale-175 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
              }`}
            >
              {currentSlide?.type === 'image' ? (
                <img
                  src={currentSlide.src}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain bg-[#F3EFE6]"
                />
              ) : currentSlide ? (
                <FabricPatternVisual
                  productId={product.id}
                  patternType={product.patternType}
                  colorHex={product.colorHex}
                  fabricWidth={product.fabricWidth}
                  categorySlug={catSlug}
                  title={product.name}
                  aspectRatio="square"
                  viewAngle={currentSlide.angle}
                  enableInteractiveLoupe={true}
                  zoomOnHover={false}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

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
