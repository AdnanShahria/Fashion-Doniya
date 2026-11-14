import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { OrangeBackButton } from '../components/common/OrangeBackButton';
import { BaharEditorialCategorySection } from '../components/common/BaharEditorialCategorySection';
import { categoryService } from '../services/categoryService';
import { FabricWidth, FabricCollectionType, FabricCategoryRecord } from '../types';
import { Search, X } from 'lucide-react';

interface FabricWidthCategoryPageProps {
  width: FabricWidth;
}

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function toBengaliNumber(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)]);
}

export const FabricWidthCategoryPage: React.FC<FabricWidthCategoryPageProps> = ({ width }) => {
  const { navigateTo, products } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high'>('featured');
  const [collectionVersion, setCollectionVersion] = useState(0);

  const is35 = width === '3.5';
  const collectionType: FabricCollectionType = is35 ? '3.5_bahar' : '2.5_bahar';

  const shortTitle = is35 ? '৩.৫ বহর কাপড়' : '২.৫ বহর কাপড়';

  // Sync dynamic category & design settings from backend database
  useEffect(() => {
    let active = true;
    categoryService.syncFromBackend().then(() => {
      if (active) setCollectionVersion((v) => v + 1);
    });
    const onUpdated = () => setCollectionVersion((v) => v + 1);
    window.addEventListener('fabric-collections-updated', onUpdated);
    return () => {
      active = false;
      window.removeEventListener('fabric-collections-updated', onUpdated);
    };
  }, [collectionType]);

  const publishedCollection = useMemo(() => {
    void collectionVersion;
    return categoryService.getPublishedCollection(collectionType);
  }, [collectionType, collectionVersion]);

  const handleCategoryClick = (cat: FabricCategoryRecord) => {
    const link = (cat.buttonLink || '').trim();
    if (link.startsWith('category-gallery:')) {
      const targetSlug = link.replace('category-gallery:', '').trim() || cat.slug || 'kamiz';
      navigateTo('category-gallery', { width, category: targetSlug });
      return;
    }
    if (link === 'calculator') {
      navigateTo('calculator', { width });
      return;
    }
    if (link === 'custom-design-page') {
      navigateTo('custom-design', { width });
      return;
    }
    navigateTo('category-gallery', { width, category: cat.slug || 'kamiz' });
  };

  const widthProducts = useMemo(() => {
    let list = products.filter((p) => p.isActive && p.fabricWidth === width);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.fabricType.toLowerCase().includes(q) ||
          p.color.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const pa = a.discountPrice || a.pricePerYard;
      const pb = b.discountPrice || b.pricePerYard;
      if (sortBy === 'price-low') return pa - pb;
      if (sortBy === 'price-high') return pb - pa;
      return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
    });
  }, [products, width, searchQuery, sortBy]);

  return (
    <div className="bg-[#FAF7F2] min-h-screen pb-16">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-5 sm:space-y-8">
        {/* 1. Compact Top Bar: Orange Back Button (Left) + Highlighted Bahar Collection Switcher (Top Right) */}
        <div className="flex items-center justify-between gap-2">
          <div className="shrink-0">
            <OrangeBackButton onClick={() => navigateTo('home')} label="ফিরে যান" />
          </div>

          {/* Clearly Highlighted Active Bahar Switcher on Top Right */}
          <div className="inline-flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-[#FFFDF9] border border-[#E2D0B8] rounded-full shadow-[0_2px_8px_rgba(107,8,18,0.05)] shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('fabric-width', { width: '3.5' })}
              className={`px-2.5 min-[375px]:px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] min-[375px]:text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                is35
                  ? 'bg-[#6B0812] text-white shadow-[0_2px_8px_rgba(107,8,18,0.22)]'
                  : 'text-[#522422] hover:text-[#6B0812] hover:bg-[#F7EFE2]/70'
              }`}
            >
              ৩.৫ বহর কাপড়
            </button>
            <button
              type="button"
              onClick={() => navigateTo('fabric-width', { width: '2.5' })}
              className={`px-2.5 min-[375px]:px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] min-[375px]:text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                !is35
                  ? 'bg-[#6B0812] text-white shadow-[0_2px_8px_rgba(107,8,18,0.22)]'
                  : 'text-[#522422] hover:text-[#6B0812] hover:bg-[#F7EFE2]/70'
              }`}
            >
              ২.৫ বহর কাপড়
            </button>
          </div>
        </div>

        {/* Premium Editorial Outfit Category Section (Shared Design System for 3.5 & 2.5 Bahar) */}
        <BaharEditorialCategorySection
          width={width}
          section={publishedCollection.section}
          categories={publishedCollection.categories}
          designSettings={publishedCollection.designSettings}
          products={products}
          onSelectCategory={handleCategoryClick}
        />

        {/* 4. Complete Product Grid for Selected Bahar */}
        <section id="bahar-products-grid" className="space-y-6 pt-6 border-t border-[#E6D7C3]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-bold tracking-[0.15em] uppercase text-[#B87D14]">
                  COMPLETE {width} BAHAR COLLECTION
                </span>
                <span className="w-10 h-[1.5px] bg-[#C89B48]/70 rounded-full" aria-hidden="true" />
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#6B0812]">
                সকল {shortTitle} ({toBengaliNumber(widthProducts.length)}টি)
              </h2>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-[#8A5A14] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`${shortTitle} খুঁজুন...`}
                  className="w-full bg-[#FFFDF9] border border-[#E2D0B8] focus:border-[#6B0812] rounded-xl pl-10 pr-8 py-2.5 text-xs sm:text-sm text-[#2B1615] placeholder:text-[#8C7A72] outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C7A72] hover:text-[#6B0812] cursor-pointer"
                    aria-label="সার্চ মুছুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#FFFDF9] border border-[#E2D0B8] focus:border-[#6B0812] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#6B0812] outline-none cursor-pointer transition-colors"
              >
                <option value="featured">জনপ্রিয় কাপড়</option>
                <option value="price-low">মূল্য: কম থেকে বেশি</option>
                <option value="price-high">মূল্য: বেশি থেকে কম</option>
              </select>
            </div>
          </div>

          {widthProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 lg:gap-7 items-stretch">
              {widthProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-[#FFFDF9] rounded-2xl border border-[#E5D4BE] p-8 sm:p-12 text-center max-w-lg mx-auto space-y-3">
              <p className="text-base sm:text-lg font-bold text-[#6B0812]">
                আপনার অনুসন্ধান অনুযায়ী কোনো কাপড় পাওয়া যায়নি
              </p>
              <p className="text-xs sm:text-sm text-[#5C433E]">
                অন্য কোনো নাম বা রং লিখে খুঁজুন অথবা সার্চ রিসেট করুন।
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-5 py-2 rounded-full bg-[#6B0812] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                সব {shortTitle} দেখুন
              </button>
            </div>
          )}
        </section>

        {/* Bottom Back Navigation */}
        <div className="pt-6 border-t border-[#E6D7C3] flex items-center justify-between">
          <OrangeBackButton onClick={() => navigateTo('home')} label="হোমে ফিরে যান" />
        </div>
      </div>
    </div>
  );
};
