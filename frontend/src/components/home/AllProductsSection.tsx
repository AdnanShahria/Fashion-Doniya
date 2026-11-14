import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { getUniqueProductFabricImage } from './allProductsImageGenerator';
import {
  Search,
  Heart,
  SlidersHorizontal,
  X,
  Plus,
  Minus,
  Eye,
  ChevronDown,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function toBengaliNumber(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)]);
}

function getProductSubtitle(product: Product): string {
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

const COLOR_HEX_MAP: Record<string, string> = {
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

function getColorSwatchHex(colorName: string, fallbackHex: string): string {
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (colorName.includes(key)) return hex;
  }
  return fallbackHex || '#C5A46D';
}

interface AllProductCardProps {
  product: Product;
}

const AllProductCard: React.FC<AllProductCardProps> = ({ product }) => {
  const {
    addToCart,
    buyNow,
    toggleWishlist,
    isInWishlist,
    navigateTo,
    openQuickView
  } = useStore();

  const minYards = 1;
  const stepYards = product.stepYard || 0.5;
  const colorOptions = useMemo(() => {
    if (product.availableColors && product.availableColors.length > 0) {
      return product.availableColors;
    }
    return [product.color || 'ডিফল্ট রং'];
  }, [product.availableColors, product.color]);

  const [selectedYards, setSelectedYards] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string>(colorOptions[0]);

  useEffect(() => {
    setSelectedYards(1);
  }, [product.id]);

  useEffect(() => {
    if (!colorOptions.includes(selectedColor)) {
      setSelectedColor(colorOptions[0]);
    }
  }, [colorOptions, selectedColor]);

  const isWishlisted = isInWishlist(product.id);
  const effectivePrice = product.discountPrice || product.pricePerYard;
  const hasDiscount = !!product.discountPrice && product.discountPrice < product.pricePerYard;
  const totalSelectedPrice = Math.round(effectivePrice * selectedYards);
  const widthLabel = product.fabricWidth === '3.5' ? '৩.৫ বহর' : '২.৫ বহর';

  const productImageUrl = useMemo(
    () => getUniqueProductFabricImage(product),
    [product]
  );

  const handleDecreaseYards = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedYards((prev) => {
      const next = Math.round((prev - stepYards) * 100) / 100;
      return next >= minYards ? next : minYards;
    });
  };

  const handleIncreaseYards = (e: React.MouseEvent) => {
    e.stopPropagation();
    const maxYards = product.stockYards > 0 ? product.stockYards : 50;
    setSelectedYards((prev) => {
      const next = Math.round((prev + stepYards) * 100) / 100;
      return next <= maxYards ? next : prev;
    });
  };

  const handleOpenDetails = () => {
    navigateTo('product-details', { productId: product.id });
  };

  const mobileSubtitle = getProductSubtitle(product);

  return (
    <article
      onClick={handleOpenDetails}
      className="group h-full w-full min-w-0 box-border bg-[#FFFDF9] rounded-[16px] sm:rounded-2xl border border-[#DFC79C] sm:border-[#E6D7C3] hover:border-[#C89B48] shadow-[0_4px_14px_-6px_rgba(97,7,16,0.10)] sm:shadow-[0_5px_20px_-10px_rgba(97,7,16,0.08)] hover:shadow-[0_14px_32px_-10px_rgba(97,7,16,0.15)] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer sm:cursor-default"
    >
      {/* 1. Product Image Container */}
      <div
        onClick={handleOpenDetails}
        className="relative overflow-hidden rounded-t-[15px] sm:rounded-t-2xl cursor-pointer bg-[#F4ECE0]"
      >
        <div className="aspect-[1.28/1] sm:aspect-[4/3] w-full overflow-hidden bg-[#F3EFE6]">
          <img
            src={productImageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </div>

        {/* Top-Left Width Badge (Desktop Only so Mobile Image Stays Clean Like Photo) */}
        <div className="hidden sm:flex absolute top-3 left-3 items-center gap-1.5 pointer-events-none">
          <span className="px-2.5 py-1 rounded-md bg-[#FFFDF9]/95 backdrop-blur-xs border border-[#E5D0B1] text-[#6B0812] text-xs font-bold shadow-xs">
            {widthLabel}
          </span>
          {hasDiscount && (
            <span className="px-2 py-1 rounded-md bg-[#6B0812] text-[#FFFDF9] text-[11px] font-semibold shadow-xs">
              ছাড়
            </span>
          )}
        </div>

        {/* Top-Right Wishlist & Quick View Buttons */}
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-xs border border-[#EADBC8]/80 shadow-xs flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer ${
              isWishlisted
                ? 'text-[#7A0915]'
                : 'text-[#7A0915] sm:text-[#3B2321]/75 hover:text-[#7A0915]'
            }`}
            aria-label="উইশলিস্টে যোগ করুন"
            title="উইশলিস্টে রাখুন"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#7A0915]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openQuickView(product);
            }}
            className="hidden sm:flex w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs border border-[#EADBC8]/80 shadow-xs items-center justify-center text-[#3B2321]/75 hover:text-[#6B0812] transition-all duration-200 hover:scale-105 cursor-pointer"
            aria-label="কুইক ভিউ"
            title="কুইক ভিউ দেখুন"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2A. MOBILE CARD BODY (< sm): Exact Reference Photo Design */}
      <div className="sm:hidden p-2 min-[390px]:p-2.5 pt-2 flex-1 flex flex-col justify-between bg-[#FFFDF9] min-w-0">
        <div className="min-w-0">
          <h3
            className="text-[13px] min-[390px]:text-[13.5px] font-bold text-[#7A0915] leading-snug line-clamp-1"
            title={product.name}
          >
            {product.name}
          </h3>
          <p className="text-[10px] min-[390px]:text-[10.5px] font-medium text-[#4A433F] leading-snug line-clamp-1 mt-0.5">
            {mobileSubtitle}
          </p>
        </div>

        <div className="mt-2 pt-0.5 flex items-center justify-between gap-1 min-w-0">
          {/* Price per Yard */}
          <div className="flex items-baseline gap-0.5 shrink-0">
            <span className="text-[13px] min-[390px]:text-[14.5px] font-extrabold text-[#7A0915] tabular-nums leading-none">
              ৳{toBengaliNumber(effectivePrice)}
            </span>
            <span className="text-[9.5px] min-[390px]:text-[10px] font-bold text-[#7A0915] whitespace-nowrap leading-none">
              / গজ
            </span>
          </div>

          {/* Circular Maroon Arrow Button to Open Details */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetails();
            }}
            className="w-6 h-6 min-[390px]:w-6.5 min-[390px]:h-6.5 rounded-full bg-[#7A0915] hover:bg-[#5A050E] text-white flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95 cursor-pointer"
            aria-label="বিস্তারিত দেখুন"
            title="বিস্তারিত দেখুন"
          >
            <ArrowRight className="w-3 h-3 min-[390px]:w-3.5 min-[390px]:h-3.5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 2B. DESKTOP CARD BODY (sm:flex): Unchanged Full Laptop Design */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="hidden sm:flex p-4 lg:p-5 flex-1 flex-col justify-between gap-3.5"
      >
        <div className="space-y-2">
          {/* Fabric Type & Category */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <span className="font-semibold text-[#8A5A14] truncate max-w-[135px]">
              {product.fabricType}
            </span>
            <span className="text-[#B8893A]" aria-hidden="true">•</span>
            <span className="text-[#5C433E] font-medium truncate">
              {product.category}
            </span>
          </div>

          {/* Product Name */}
          <h3
            onClick={handleOpenDetails}
            className="text-base lg:text-[17px] font-bold text-[#2B1615] group-hover:text-[#7A0915] transition-colors leading-snug cursor-pointer line-clamp-2 min-h-[2.65rem]"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Interactive Available Colors Selector */}
          <div className="pt-0.5 space-y-1">
            <div className="flex items-center justify-between text-xs text-[#523A35]">
              <span className="font-medium truncate">
                রং: <strong className="text-[#2B1615] font-semibold">{selectedColor}</strong>
              </span>
              <span className="text-[11px] text-[#7A0915]/80 font-medium shrink-0">
                {toBengaliNumber(colorOptions.length)}টি রং
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-1.5">
              {colorOptions.slice(0, 3).map((colorName) => {
                const isSelected = selectedColor === colorName;
                const swatchHex =
                  colorName === product.color
                    ? product.colorHex || '#C5A46D'
                    : getColorSwatchHex(colorName, product.colorHex || '#C5A46D');

                return (
                  <button
                    key={colorName}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedColor(colorName);
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#F8EFE2] border-[#6B0812] text-[#6B0812] shadow-2xs'
                        : 'bg-[#FFFDF9] border-[#E5D6C3] text-[#5C433E] hover:border-[#C89B48]'
                    }`}
                    title={`রং নির্বাচন করুন: ${colorName}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: swatchHex }}
                    />
                    <span className="truncate max-w-[68px]">{colorName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Price, Yardage Selector & Purchase Actions */}
        <div className="pt-3 border-t border-[#EDE0CE] space-y-2.5">
          {/* Price Per Yard */}
          <div className="flex items-center justify-between gap-2 flex-nowrap">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-lg lg:text-xl font-bold text-[#6B0812] tabular-nums">
                ৳{toBengaliNumber(effectivePrice)}
              </span>
              <span className="text-xs font-medium text-[#5C433E] whitespace-nowrap">/ গজ</span>
              {hasDiscount && (
                <span className="text-xs text-[#8C7A72] line-through tabular-nums ml-0.5">
                  ৳{toBengaliNumber(product.pricePerYard)}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => addToCart(product, selectedYards, selectedColor)}
              className="py-2 px-2.5 rounded-lg bg-[#FAF3E8] hover:bg-[#F1E4D1] text-[#6B0812] border border-[#DFC9AA] hover:border-[#C69C53] text-xs font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap"
            >
              কার্টে যোগ করুন
            </button>

            <button
              type="button"
              onClick={() => buyNow(product, selectedYards, selectedColor)}
              className="py-2 px-2.5 rounded-lg bg-[#6B0812] hover:bg-[#53050D] text-white text-xs font-semibold shadow-[0_3px_10px_rgba(107,8,18,0.16)] hover:shadow-[0_5px_14px_rgba(107,8,18,0.24)] transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              এখনই কিনুন
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export const AllProductsSection: React.FC = () => {
  const { products, refreshData, navigateTo } = useStore();

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWidth, setSelectedWidth] = useState<'all' | '3.5' | '2.5'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFabricType, setSelectedFabricType] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'price-asc' | 'price-desc'>('latest');

  // Sync with storage events if admin updates products in another tab or window
  useEffect(() => {
    const handleStorageUpdate = () => {
      refreshData();
    };
    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, [refreshData]);

  // All active products from the store database
  const activeProducts = useMemo(
    () => products.filter((p) => p.isActive !== false),
    [products]
  );

  // Dynamic Category Options derived directly from database products
  const categoryOptions = useMemo(() => {
    const unique = Array.from(
      new Set(activeProducts.map((p) => p.category).filter(Boolean))
    );
    return unique;
  }, [activeProducts]);

  // Dynamic Fabric Type Options derived directly from database products
  const fabricTypeOptions = useMemo(() => {
    const unique = Array.from(
      new Set(activeProducts.map((p) => p.fabricType).filter(Boolean))
    );
    return unique;
  }, [activeProducts]);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = activeProducts.filter((product) => {
      // 1. Fabric Width Filter
      if (selectedWidth !== 'all' && product.fabricWidth !== selectedWidth) {
        return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // 3. Fabric Type Filter
      if (selectedFabricType !== 'all' && product.fabricType !== selectedFabricType) {
        return false;
      }

      // 4. Price Range Filter
      const effectivePrice = product.discountPrice || product.pricePerYard;
      if (selectedPriceRange === 'under-300' && effectivePrice >= 300) return false;
      if (selectedPriceRange === '300-500' && (effectivePrice < 300 || effectivePrice > 500))
        return false;
      if (selectedPriceRange === '501-800' && (effectivePrice < 501 || effectivePrice > 800))
        return false;
      if (selectedPriceRange === 'above-800' && effectivePrice <= 800) return false;

      // 5. Search Query Filter (Name, English Name, Design/Pattern, Fabric Type, Category, Color, SKU)
      if (query) {
        const searchableText = [
          product.name,
          product.nameEn || '',
          product.description || '',
          product.fabricType,
          product.category,
          product.color,
          ...(product.availableColors || []),
          product.patternType,
          product.sku
        ]
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      const priceA = a.discountPrice || a.pricePerYard;
      const priceB = b.discountPrice || b.pricePerYard;

      switch (sortBy) {
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'popular': {
          const scoreA = (a.isBestSeller ? 100 : 0) + (a.reviewCount || 0) + (a.rating || 0) * 10;
          const scoreB = (b.isBestSeller ? 100 : 0) + (b.reviewCount || 0) + (b.rating || 0) * 10;
          return scoreB - scoreA;
        }
        case 'latest':
        default: {
          // Newest admin-added products are unshifted to the front of products array,
          // and products flagged isNewArrival get priority when at default order
          if (a.isNewArrival !== b.isNewArrival) {
            return a.isNewArrival ? -1 : 1;
          }
          return 0;
        }
      }
    });
  }, [
    activeProducts,
    searchQuery,
    selectedWidth,
    selectedCategory,
    selectedFabricType,
    selectedPriceRange,
    sortBy
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedWidth !== 'all' ||
    selectedCategory !== 'all' ||
    selectedFabricType !== 'all' ||
    selectedPriceRange !== 'all' ||
    sortBy !== 'latest';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedWidth('all');
    setSelectedCategory('all');
    setSelectedFabricType('all');
    setSelectedPriceRange('all');
    setSortBy('latest');
  };

  const { settings } = useStore();
  const allProdSec = settings.homepageConfig?.sections?.find((s) => s.id === 'all_products');

  return (
    <section
      id="all-products-section"
      className="!mt-0 pt-3.5 sm:pt-14 pb-4 sm:pb-12 bg-[#FAF7F2] w-full min-w-0"
    >
      <div className="max-w-[1400px] mx-auto px-2.5 sm:px-6 lg:px-8 min-w-0">
        {/* 1. Section Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-3.5 sm:mb-10 gap-2.5 sm:gap-5 min-w-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold tracking-[0.14em] sm:tracking-[0.16em] uppercase text-[#B87D14]">
                {allProdSec?.eyebrow || 'EXPLORE ALL PRODUCTS'}
              </span>
              <span className="w-10 sm:w-12 h-[1.5px] bg-[#C89B48]/70 rounded-full" aria-hidden="true" />
            </div>

            <h2 className="text-lg sm:text-3xl lg:text-[36px] font-bold text-[#6B0812] tracking-tight leading-snug">
              {allProdSec?.heading || 'সকল কাপড়ের কালেকশন'}
            </h2>

            <p className="text-[11px] sm:text-base text-[#4E3631] font-medium leading-snug sm:leading-relaxed">
              {allProdSec?.description || 'আপনার পছন্দের ডিজাইন, রং ও বহরের সব কাপড় এক জায়গায় খুঁজে নিন।'}
            </p>
          </div>

          {/* Fabric Width Quick Filter Pills */}
          <div className="inline-flex items-center gap-1 p-1 sm:p-1.5 bg-[#FFFDF9] border border-[#E5D3BC] rounded-full shadow-[0_2px_10px_rgba(107,8,18,0.05)] self-start lg:self-auto overflow-x-auto max-w-full no-scrollbar">
            {[
              { id: 'all', label: 'সকল বহর' },
              { id: '3.5', label: '৩.৫ বহর' },
              { id: '2.5', label: '২.৫ বহর' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedWidth(tab.id as 'all' | '3.5' | '2.5')}
                className={`px-3 sm:px-5 py-1 sm:py-2 text-[11px] sm:text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  selectedWidth === tab.id
                    ? 'bg-[#6B0812] text-white shadow-[0_2px_8px_rgba(107,8,18,0.22)]'
                    : 'text-[#522422] hover:text-[#6B0812] hover:bg-[#F7EFE2]/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Interactive Search & Filter Toolbar */}
        <div className="bg-[#FFFDF9] rounded-xl sm:rounded-2xl border border-[#E5D4BE] p-2.5 sm:p-5 mb-4 sm:mb-8 shadow-[0_6px_24px_-12px_rgba(107,8,18,0.06)] min-w-0">
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-3.5 items-center min-w-0">
            {/* Search Input (Full width on mobile, 6 cols on desktop) */}
            <div className="col-span-2 lg:col-span-6 relative min-w-0">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8A5A14] absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="কাপড়ের নাম, ডিজাইন বা রং খুঁজুন..."
                className="w-full min-w-0 pl-9 sm:pl-10 pr-8 sm:pr-9 py-2 sm:py-2.5 bg-[#FAF6F0] border border-[#E2D0B8] focus:border-[#6B0812] focus:bg-white rounded-lg sm:rounded-xl text-[11px] sm:text-sm text-[#2B1615] placeholder:text-[#8C7A72] outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[#8C7A72] hover:text-[#6B0812] cursor-pointer"
                  aria-label="সার্চ মুছুন"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>

            {/* Category Filter (1 col on mobile, 3 cols on desktop) */}
            <div className="col-span-1 lg:col-span-3 relative min-w-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="ক্যাটাগরি অনুযায়ী ফিল্টার"
                className="w-full min-w-0 truncate appearance-none pl-2.5 sm:pl-3.5 pr-6 sm:pr-8 py-2 sm:py-2.5 bg-[#FAF6F0] border border-[#E2D0B8] focus:border-[#6B0812] rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-medium text-[#3B2321] outline-none cursor-pointer transition-colors"
              >
                <option value="all">সকল ক্যাটাগরি</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8A5A14] absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Fabric Type Filter (1 col on mobile, 3 cols on desktop) */}
            <div className="col-span-1 lg:col-span-3 relative min-w-0">
              <select
                value={selectedFabricType}
                onChange={(e) => setSelectedFabricType(e.target.value)}
                aria-label="কাপড়ের ধরন অনুযায়ী ফিল্টার"
                className="w-full min-w-0 truncate appearance-none pl-2.5 sm:pl-3.5 pr-6 sm:pr-8 py-2 sm:py-2.5 bg-[#FAF6F0] border border-[#E2D0B8] focus:border-[#6B0812] rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-medium text-[#3B2321] outline-none cursor-pointer transition-colors"
              >
                <option value="all">সকল কাপড়ের ধরন</option>
                {fabricTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8A5A14] absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 3. Product Grid: 4 Cards per Row on Desktop, 2 on Mobile */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-5 lg:gap-6 items-stretch min-w-0">
            {filteredProducts.map((product) => (
              <AllProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Empty State when search/filter returns no matches */
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E5D4BE] p-8 sm:p-12 text-center max-w-xl mx-auto my-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FAF3E8] border border-[#E5D0B1] text-[#6B0812] flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#6B0812]">
              আপনার অনুসন্ধান অনুযায়ী কোনো কাপড় পাওয়া যায়নি
            </h3>
            <p className="text-xs sm:text-sm text-[#5C433E] leading-relaxed">
              অন্য কোনো নাম, ডিজাইন, রং বা বহর নির্বাচন করে আবার চেষ্টা করুন অথবা সব ফিল্টার রিসেট করুন।
            </p>
            <div className="pt-1 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-full bg-[#6B0812] hover:bg-[#53050D] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                সব কাপড় দেখুন
              </button>
              <button
                type="button"
                onClick={() => navigateTo('custom-design')}
                className="px-5 py-2.5 rounded-full bg-[#FAF3E8] hover:bg-[#F1E4D1] text-[#6B0812] border border-[#DFC9AA] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                কাস্টম ডিজাইন রিকোয়েস্ট
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
