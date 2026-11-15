import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { getUniqueProductFabricImage } from './allProductsImageGenerator';
import {
  toBengaliNumber,
  getProductSubtitle,
  getColorSwatchHex
} from '../../utils/fabricHelpers';
import {
  Search,
  Heart,
  X,
  Eye,
  ChevronDown,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

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
  const widthLabel = product.fabricWidth === '3.5' ? '৩.৫ বহর' : '২.৫ বহর';

  const productImageUrl = useMemo(
    () => getUniqueProductFabricImage(product),
    [product]
  );

  const handleOpenDetails = () => {
    navigateTo('product-details', { productId: product.id });
  };

  const mobileSubtitle = getProductSubtitle(product);

  return (
    <article
      onClick={handleOpenDetails}
      className="group h-full w-full min-w-0 box-border bg-[#FFFDF9] rounded-[18px] sm:rounded-2xl border border-[#E5D4BE] hover:border-[#C59B48] shadow-[0_2px_8px_-4px_rgba(36,22,20,0.06),0_8px_22px_-12px_rgba(107,8,18,0.10)] hover:shadow-[0_18px_38px_-14px_rgba(107,8,18,0.16)] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer sm:cursor-default"
    >
      {/* 1. Product Image Container */}
      <div
        onClick={handleOpenDetails}
        className="relative overflow-hidden rounded-t-[17px] sm:rounded-t-2xl cursor-pointer bg-[#F4ECE0]"
      >
        <div className="aspect-[1.24/1] sm:aspect-[4/3] w-full overflow-hidden bg-[#F3ECE0] select-none">
          <img
            src={productImageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        </div>

        {/* Top-Left Width Badge (Desktop) */}
        <div className="hidden sm:flex absolute top-3 left-3 items-center gap-1.5 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full glass-control-light border border-white/60 text-[#6B0812] text-[11px] font-bold shadow-[0_2px_8px_rgba(36,22,20,0.10)]">
            {widthLabel}
          </span>
          {hasDiscount && (
            <span className="px-2.5 py-1 rounded-full bg-[#6B0812]/92 backdrop-blur-sm text-[#FFFDF9] text-[11px] font-semibold shadow-xs">
              ছাড়
            </span>
          )}
        </div>

        {/* Top-Right Frosted Glass Wishlist & Quick View Buttons */}
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full glass-control-light border border-white/70 shadow-[0_2px_10px_rgba(36,22,20,0.12)] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] ${
              isWishlisted
                ? 'text-[#6B0812]'
                : 'text-[#3B2321]/85 hover:text-[#6B0812]'
            }`}
            aria-label={isWishlisted ? 'উইশলিস্ট থেকে সরান' : 'উইশলিস্টে যোগ করুন'}
            title="উইশলিস্টে রাখুন"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#6B0812]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openQuickView(product);
            }}
            className="hidden sm:flex w-9 h-9 rounded-full glass-control-light border border-white/70 shadow-[0_2px_10px_rgba(36,22,20,0.12)] items-center justify-center text-[#3B2321]/85 hover:text-[#6B0812] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
            aria-label="কুইক ভিউ"
            title="কুইক ভিউ দেখুন"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2A. MOBILE CARD BODY (< sm) */}
      <div className="sm:hidden p-2.5 pt-2 flex-1 flex flex-col justify-between bg-[#FFFDF9] min-w-0">
        <div className="min-w-0">
          <h3
            className="text-[13px] min-[390px]:text-[13.5px] font-bold text-[#6B0812] leading-snug line-clamp-1"
            title={product.name}
          >
            {product.name}
          </h3>
          <p className="text-[11px] font-medium text-[#523A35] leading-snug line-clamp-1 mt-0.5">
            {mobileSubtitle}
          </p>
        </div>

        <div className="mt-2 pt-1 flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-baseline gap-0.5 shrink-0">
            <span className="text-[14px] min-[390px]:text-[15px] font-extrabold text-[#6B0812] tabular-nums leading-none">
              ৳{toBengaliNumber(effectivePrice)}
            </span>
            <span className="text-[11px] font-semibold text-[#523A35] whitespace-nowrap leading-none">
              / গজ
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetails();
            }}
            className="w-8 h-8 rounded-full bg-[#6B0812] hover:bg-[#53050D] text-white flex items-center justify-center shrink-0 shadow-[0_3px_10px_rgba(107,8,18,0.22)] transition-transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
            aria-label="বিস্তারিত দেখুন"
            title="বিস্তারিত দেখুন"
          >
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 2B. DESKTOP CARD BODY (sm:flex) — Calm Atelier Presentation */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="hidden sm:flex p-4 lg:p-5 flex-1 flex-col justify-between gap-3.5"
      >
        <div className="space-y-2">
          {/* Fabric Type & Category */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <span className="font-bold text-[#8A5A10] truncate max-w-[135px]">
              {product.fabricType}
            </span>
            <span className="text-[#C59B48]" aria-hidden="true">·</span>
            <span className="text-[#523A35] font-medium truncate">
              {product.category}
            </span>
          </div>

          {/* Product Name */}
          <h3
            onClick={handleOpenDetails}
            className="text-base lg:text-[17px] font-bold text-[#241614] group-hover:text-[#6B0812] transition-colors leading-snug cursor-pointer line-clamp-2 min-h-[2.7rem]"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Clean Circular Tactile Color Swatches */}
          <div className="pt-0.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex items-center gap-1" role="radiogroup" aria-label="রং নির্বাচন">
                {colorOptions.slice(0, 4).map((colorName) => {
                  const isSelected = selectedColor === colorName;
                  const swatchHex =
                    colorName === product.color
                      ? product.colorHex || '#C5A46D'
                      : getColorSwatchHex(colorName, product.colorHex || '#C5A46D');

                  return (
                    <button
                      key={colorName}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`রং: ${colorName}`}
                      title={colorName}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedColor(colorName);
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] ${
                        isSelected ? 'ring-1.5 ring-[#6B0812] scale-105' : 'hover:scale-105'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shadow-2xs"
                        style={{ backgroundColor: swatchHex }}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-medium text-[#523A35] truncate ml-0.5">
                {selectedColor}
              </span>
            </div>

            {colorOptions.length > 4 && (
              <span className="text-[11px] font-semibold text-[#6B0812]/80 shrink-0 tabular-nums">
                +{toBengaliNumber(colorOptions.length - 4)}
              </span>
            )}
          </div>
        </div>

        {/* 3. Price & Purchase Actions */}
        <div className="pt-3 border-t border-[#EDE0CE] space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-nowrap">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-lg lg:text-[21px] font-extrabold text-[#6B0812] tabular-nums">
                ৳{toBengaliNumber(effectivePrice)}
              </span>
              <span className="text-xs font-semibold text-[#523A35] whitespace-nowrap">/ গজ</span>
              {hasDiscount && (
                <span className="text-xs text-[#6E5750] line-through tabular-nums ml-1">
                  ৳{toBengaliNumber(product.pricePerYard)}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => addToCart(product, selectedYards, selectedColor)}
              className="min-h-[38px] py-2 px-2.5 rounded-xl bg-[#FAF3E8] hover:bg-[#F1E3CE] active:scale-[0.98] text-[#6B0812] border border-[#DFC9AA] hover:border-[#C59B48] text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
            >
              কার্টে যোগ
            </button>

            <button
              type="button"
              onClick={() => buyNow(product, selectedYards, selectedColor)}
              className="min-h-[38px] py-2 px-2.5 rounded-xl bg-gradient-to-b from-[#7D0A15] to-[#63060F] hover:from-[#8C0C18] hover:to-[#53050D] active:scale-[0.98] text-white text-xs font-semibold shadow-[0_3px_10px_rgba(107,8,18,0.18),inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-200 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
            >
              এখনই কিনুন
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const INITIAL_VISIBLE_COUNT = 12;

export const AllProductsSection: React.FC = () => {
  const { products, refreshData, navigateTo, settings } = useStore();

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWidth, setSelectedWidth] = useState<'all' | '3.5' | '2.5'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFabricType, setSelectedFabricType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'price-asc' | 'price-desc'>('latest');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);

  // Sync with storage events if admin updates products in another tab or window
  useEffect(() => {
    const handleStorageUpdate = () => {
      refreshData();
    };
    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, [refreshData]);

  // Reset visible count whenever filters change so matching items appear immediately
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [searchQuery, selectedWidth, selectedCategory, selectedFabricType, sortBy]);

  const activeProducts = useMemo(
    () => products.filter((p) => p.isActive !== false),
    [products]
  );

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(activeProducts.map((p) => p.category).filter(Boolean)));
  }, [activeProducts]);

  const fabricTypeOptions = useMemo(() => {
    return Array.from(new Set(activeProducts.map((p) => p.fabricType).filter(Boolean)));
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = activeProducts.filter((product) => {
      if (selectedWidth !== 'all' && product.fabricWidth !== selectedWidth) return false;
      if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
      if (selectedFabricType !== 'all' && product.fabricType !== selectedFabricType) return false;

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

        if (!searchableText.includes(query)) return false;
      }

      return true;
    });

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
          if (a.isNewArrival !== b.isNewArrival) {
            return a.isNewArrival ? -1 : 1;
          }
          return 0;
        }
      }
    });
  }, [activeProducts, searchQuery, selectedWidth, selectedCategory, selectedFabricType, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredProducts.length - displayedProducts.length);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedWidth !== 'all' ||
    selectedCategory !== 'all' ||
    selectedFabricType !== 'all' ||
    sortBy !== 'latest';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedWidth('all');
    setSelectedCategory('all');
    setSelectedFabricType('all');
    setSortBy('latest');
  };

  const allProdSec = settings.homepageConfig?.sections?.find((s) => s.id === 'all_products');

  return (
    <section
      id="all-products-section"
      className="!mt-0 pt-4 sm:pt-12 pb-6 sm:pb-12 bg-[#FAF6F0] w-full min-w-0"
    >
      <div className="max-w-[1400px] mx-auto px-2.5 sm:px-6 lg:px-8 min-w-0">
        {/* 1. Section Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-4 sm:mb-8 gap-3 sm:gap-5 min-w-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-extrabold tracking-[0.14em] sm:tracking-[0.16em] uppercase text-[#8A5A10]">
                {allProdSec?.eyebrow || 'EXPLORE ALL PRODUCTS'}
              </span>
              <span className="w-10 sm:w-14 h-[1.5px] bg-[#C59B48]/80 rounded-full" aria-hidden="true" />
            </div>

            <h2 className="text-xl sm:text-3xl lg:text-[36px] font-extrabold text-[#6B0812] tracking-tight leading-snug">
              {allProdSec?.heading || 'সকল কাপড়ের কালেকশন'}
            </h2>

            <p className="text-xs sm:text-base text-[#523A35] font-medium leading-relaxed">
              {allProdSec?.description || 'আপনার পছন্দের ডিজাইন, রং ও বহরের সব কাপড় এক জায়গায় খুঁজে নিন।'}
            </p>
          </div>

          {/* Fabric Width Quick Filter Pills */}
          <div className="inline-flex items-center gap-1 p-1 sm:p-1.5 bg-[#FFFDF9] border border-[#E2D0B8] rounded-full shadow-[0_2px_10px_rgba(36,22,20,0.05)] self-start lg:self-auto overflow-x-auto max-w-full no-scrollbar">
            {[
              { id: 'all', label: 'সকল বহর' },
              { id: '3.5', label: '৩.৫ বহর' },
              { id: '2.5', label: '২.৫ বহর' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedWidth(tab.id as 'all' | '3.5' | '2.5')}
                className={`min-h-[34px] px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] ${
                  selectedWidth === tab.id
                    ? 'bg-[#6B0812] text-white shadow-[0_3px_10px_rgba(107,8,18,0.22)]'
                    : 'text-[#523A35] hover:text-[#6B0812] hover:bg-[#FAF3E8]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Interactive Search, Filter & Sort Toolbar */}
        <div className="bg-[#FFFDF9] rounded-2xl border border-[#E5D4BE] p-3 sm:p-4 mb-5 sm:mb-8 shadow-[0_6px_24px_-12px_rgba(36,22,20,0.08)] space-y-3 min-w-0">
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-3 items-center min-w-0">
            {/* Search Input */}
            <div className="col-span-2 lg:col-span-5 relative min-w-0">
              <Search className="w-4 h-4 text-[#8A5A10] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="কাপড়ের নাম, ডিজাইন বা রং খুঁজুন..."
                aria-label="কাপড়ের কালেকশন খুঁজুন"
                className="w-full min-w-0 min-h-[40px] pl-10 pr-9 py-2 bg-[#FAF6F0] border border-[#DFCBB2] focus:border-[#6B0812] focus:bg-white rounded-xl text-xs sm:text-sm text-[#241614] placeholder:text-[#6E5750] outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[#6E5750] hover:text-[#6B0812] hover:bg-[#EFE5D5] cursor-pointer"
                  aria-label="সার্চ মুছুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="col-span-1 lg:col-span-2 relative min-w-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="ক্যাটাগরি অনুযায়ী ফিল্টার"
                className="w-full min-w-0 min-h-[40px] truncate appearance-none pl-3 pr-7 py-2 bg-[#FAF6F0] border border-[#DFCBB2] focus:border-[#6B0812] rounded-xl text-xs sm:text-sm font-medium text-[#241614] outline-none cursor-pointer transition-colors"
              >
                <option value="all">সকল ক্যাটাগরি</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8A5A10] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Fabric Type Filter */}
            <div className="col-span-1 lg:col-span-3 relative min-w-0">
              <select
                value={selectedFabricType}
                onChange={(e) => setSelectedFabricType(e.target.value)}
                aria-label="কাপড়ের ধরন অনুযায়ী ফিল্টার"
                className="w-full min-w-0 min-h-[40px] truncate appearance-none pl-3 pr-7 py-2 bg-[#FAF6F0] border border-[#DFCBB2] focus:border-[#6B0812] rounded-xl text-xs sm:text-sm font-medium text-[#241614] outline-none cursor-pointer transition-colors"
              >
                <option value="all">সকল কাপড়ের ধরন</option>
                {fabricTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8A5A10] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort Selector */}
            <div className="col-span-2 lg:col-span-2 relative min-w-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="সাজানোর ধরন"
                className="w-full min-w-0 min-h-[40px] truncate appearance-none pl-3 pr-7 py-2 bg-[#FAF6F0] border border-[#DFCBB2] focus:border-[#6B0812] rounded-xl text-xs sm:text-sm font-medium text-[#241614] outline-none cursor-pointer transition-colors"
              >
                <option value="latest">নতুন কালেকশন</option>
                <option value="popular">সবচেয়ে জনপ্রিয়</option>
                <option value="price-asc">দাম: কম থেকে বেশি</option>
                <option value="price-desc">দাম: বেশি থেকে কম</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#8A5A10] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Subtle Live Result Count & Reset Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EFE4D4] text-xs text-[#523A35]">
            <span className="font-medium tabular-nums">
              মোট <strong className="text-[#6B0812]">{toBengaliNumber(filteredProducts.length)}টি</strong> কাপড়ের মধ্যে{' '}
              <strong className="text-[#241614]">{toBengaliNumber(displayedProducts.length)}টি</strong> দেখানো হচ্ছে
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF3E8] hover:bg-[#F1E3CE] border border-[#DFC9AA] text-[#6B0812] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ফিল্টার রিসেট করুন</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Product Grid: 4 Cards per Row on Desktop, 2 on Mobile */}
        {displayedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5 lg:gap-6 items-stretch min-w-0">
              {displayedProducts.map((product) => (
                <AllProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Progressive Disclosure Footer */}
            {(remainingCount > 0 || filteredProducts.length > INITIAL_VISIBLE_COUNT) && (
              <div className="mt-7 sm:mt-10 flex flex-wrap items-center justify-center gap-3">
                {remainingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="min-h-[44px] px-6 py-2.5 rounded-full bg-gradient-to-b from-[#7D0A15] to-[#63060F] hover:from-[#8C0C18] hover:to-[#53050D] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-[0_6px_16px_-4px_rgba(107,8,18,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all cursor-pointer tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] focus-visible:ring-offset-2"
                  >
                    আরও কাপড় দেখুন (+{toBengaliNumber(remainingCount)}টি)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigateTo('shop')}
                  className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#FFFDF9] hover:bg-[#FAF3E8] text-[#6B0812] border border-[#C59B48] text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] focus-visible:ring-offset-2"
                >
                  <span>সম্পূর্ণ ক্যাটালগ দেখুন</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty State when search/filter returns no matches */
          <div className="bg-[#FFFDF9] rounded-2xl border border-[#E5D4BE] p-8 sm:p-12 text-center max-w-xl mx-auto my-4 space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#FAF3E8] border border-[#E5D0B1] text-[#6B0812] flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#6B0812]">
              আপনার অনুসন্ধান অনুযায়ী কোনো কাপড় পাওয়া যায়নি
            </h3>
            <p className="text-xs sm:text-sm text-[#523A35] leading-relaxed">
              অন্য কোনো নাম, ডিজাইন, রং বা বহর নির্বাচন করে আবার চেষ্টা করুন অথবা সব ফিল্টার রিসেট করুন।
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="min-h-[40px] px-5 py-2.5 rounded-full bg-[#6B0812] hover:bg-[#53050D] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
              >
                সব কাপড় দেখুন
              </button>
              <button
                type="button"
                onClick={() => navigateTo('custom-design')}
                className="min-h-[40px] px-5 py-2.5 rounded-full bg-[#FAF3E8] hover:bg-[#F1E4D1] text-[#6B0812] border border-[#DFC9AA] text-xs sm:text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
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
