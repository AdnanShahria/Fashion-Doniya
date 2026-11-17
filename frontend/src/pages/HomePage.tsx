import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { HeroSection } from '../components/home/HeroSection';
import { FabricWidthCategorySection } from '../components/home/FabricWidthCategorySection';
import { ProductCard } from '../components/common/ProductCard';
import { AllProductsSection } from '../components/home/AllProductsSection';
import { FabricYardCalculator } from '../components/calculator/FabricYardCalculator';
import { HomepageSectionConfig, HomepageSectionId, PromotionalBannerConfig } from '../types';
import { INITIAL_HOMEPAGE_CONFIG } from '../data/seedData';

export const HomePage: React.FC = () => {
  const { products, settings, navigateTo } = useStore();
  const [featuredTab, setFeaturedTab] = useState<'all' | '3.5' | '2.5'>('all');

  const hpConfig = settings.homepageConfig || INITIAL_HOMEPAGE_CONFIG;
  const sections: HomepageSectionConfig[] = (
    Array.isArray(hpConfig.sections) && hpConfig.sections.length > 0
      ? hpConfig.sections
      : INITIAL_HOMEPAGE_CONFIG.sections
  )
    .slice()
    .sort((a: HomepageSectionConfig, b: HomepageSectionConfig) => a.order - b.order);

  const getSec = (id: HomepageSectionId): HomepageSectionConfig =>
    sections.find((s: HomepageSectionConfig) => s.id === id) ||
    INITIAL_HOMEPAGE_CONFIG.sections.find((s: HomepageSectionConfig) => s.id === id)!;

  const activeProducts = products.filter((p) => p.isActive);

  const displayedProducts = activeProducts
    .filter((p) => {
      if (featuredTab === 'all') {
        const allowFeatured = hpConfig.showExclusiveTabFeatured !== false && p.isFeatured;
        const allowBest = hpConfig.showExclusiveTabBestSeller !== false && p.isBestSeller;
        const allowNew = hpConfig.showExclusiveTabNewArrival === true && p.isNewArrival;
        return allowFeatured || allowBest || allowNew;
      }
      return p.fabricWidth === featuredTab;
    })
    .slice(0, 6);

  const exclusiveSec = getSec('exclusive');
  const calcSec = getSec('calculator');
  const promoSec = getSec('promo_banner');
  const activePromoBanners: PromotionalBannerConfig[] = (hpConfig.promotionalBanners || []).filter(
    (b: PromotionalBannerConfig) => b.isActive
  );

  const renderSectionById = (sec: HomepageSectionConfig) => {
    if (!sec.isVisible) return null;

    switch (sec.id) {
      case 'hero':
        return <HeroSection key="hero" />;

      case 'fabric_width':
        return <FabricWidthCategorySection key="fabric_width" />;

      case 'exclusive':
        return (
          <section key="exclusive" className="pt-3 sm:pt-10 pb-2 sm:pb-0 bg-[#FAF8F5] w-full min-w-0">
            <div className="max-w-[1400px] mx-auto px-2.5 sm:px-6 lg:px-8 min-w-0">
              {/* Top Header Row: Left Compact Heading + Right Fabric-Width Filter */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-4 sm:mb-9 gap-3 sm:gap-5 min-w-0">
                {/* Compact Top-Left Section Heading */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] sm:text-xs font-extrabold tracking-[0.14em] sm:tracking-[0.16em] uppercase text-[#8A5A10]">
                      {exclusiveSec.eyebrow || 'EXCLUSIVE FABRIC COLLECTION'}
                    </span>
                    <span className="w-10 sm:w-14 h-[1.5px] bg-[#C59B48]/80 rounded-full" aria-hidden="true" />
                  </div>

                  <h2 className="text-xl sm:text-3xl lg:text-[36px] font-extrabold text-[#6B0812] tracking-tight leading-snug">
                    {exclusiveSec.heading || 'প্রিমিয়াম কাপড়ের বিশেষ কালেকশন'}
                  </h2>

                  <p className="text-xs sm:text-base text-[#523A35] font-medium leading-relaxed">
                    {exclusiveSec.description || 'আপনার পছন্দের ডিজাইন, রং ও বহর অনুযায়ী বেছে নিন সেরা মানের কাপড়।'}
                  </p>
                </div>

                {/* Top-Right Fabric-Width Segmented Filter */}
                <div className="inline-flex items-center gap-1 p-1 sm:p-1.5 bg-[#FFFDF9] border border-[#E2D0B8] rounded-full shadow-[0_2px_10px_rgba(36,22,20,0.05)] self-start lg:self-auto overflow-x-auto max-w-full no-scrollbar">
                  {[
                    { id: 'all', label: 'সকল বহর' },
                    { id: '3.5', label: '৩.৫ বহর কাপড়' },
                    { id: '2.5', label: '২.৫ বহর কাপড়' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFeaturedTab(tab.id as 'all' | '3.5' | '2.5')}
                      className={`min-h-[34px] px-3.5 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] ${
                        featuredTab === tab.id
                          ? 'bg-[#6B0812] text-white shadow-[0_3px_10px_rgba(107,8,18,0.22)]'
                          : 'text-[#523A35] hover:text-[#6B0812] hover:bg-[#FAF3E8]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clean Responsive Product Grid (2-Column Mobile, 3-Column Desktop) */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-7 items-stretch min-w-0">
                {displayedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        );

      case 'all_products':
        return <AllProductsSection key="all_products" />;

      case 'promo_banner':
        return (
          <section key="promo_banner" className="max-w-[1400px] mx-auto px-2.5 sm:px-6 lg:px-8">
            {activePromoBanners.length > 0 ? (
              <div className="space-y-4">
                {activePromoBanners.map((banner) => (
                  <div
                    key={banner.id}
                    className="relative rounded-2xl overflow-hidden border border-[#E5D3BC] bg-gradient-to-r from-[#6B0812] to-[#4A050C] text-[#FAF5EC] p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <span className="inline-block px-3 py-1 rounded-full bg-[#C5A46D]/20 border border-[#C5A46D]/40 text-[#F3D8A4] text-xs font-bold">
                        {banner.badge}
                      </span>
                      <h3 className="text-xl sm:text-3xl font-bold leading-snug">{banner.title}</h3>
                      <p className="text-xs sm:text-sm text-[#FAF5EC]/85 leading-relaxed">{banner.subtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateTo(banner.buttonPage || 'shop')}
                      className="px-6 py-3 rounded-full bg-[#C5A46D] hover:bg-[#D4B57E] text-[#1E1412] font-bold text-sm transition-colors shrink-0 cursor-pointer"
                    >
                      {banner.buttonText || 'অফার দেখুন'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-[#E5D3BC] bg-gradient-to-r from-[#6B0812] to-[#4A050C] text-[#FAF5EC] p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="space-y-2 max-w-2xl">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#C5A46D]/20 border border-[#C5A46D]/40 text-[#F3D8A4] text-xs font-bold">
                    {promoSec.eyebrow}
                  </span>
                  <h3 className="text-xl sm:text-3xl font-bold leading-snug">{promoSec.heading}</h3>
                  <p className="text-xs sm:text-sm text-[#FAF5EC]/85 leading-relaxed">{promoSec.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('shop')}
                  className="px-6 py-3 rounded-full bg-[#C5A46D] hover:bg-[#D4B57E] text-[#1E1412] font-bold text-sm transition-colors shrink-0 cursor-pointer"
                >
                  {promoSec.buttonText || 'অফার কালেকশন দেখুন'}
                </button>
              </div>
            )}
          </section>
        );

      case 'calculator':
        return (
          <section key="calculator" className="w-full max-w-[1400px] mx-auto px-2.5 sm:px-6 lg:px-8 pt-2 sm:pt-2 min-w-0 box-border">
            <div className="w-full min-w-0 box-border bg-[#FFFDF9] rounded-2xl sm:rounded-3xl border border-[#E6D7C3] p-3.5 sm:p-8 lg:p-11 shadow-[0_12px_36px_-14px_rgba(107,8,18,0.10)]">
              <div className="max-w-2xl mb-4 sm:mb-8 space-y-1.5 min-w-0 px-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] sm:text-xs font-extrabold tracking-[0.14em] sm:tracking-[0.15em] uppercase text-[#8A5A10]">
                    {calcSec.eyebrow || 'SMART YARDAGE CALCULATOR'}
                  </p>
                  <span className="w-10 h-[1.5px] bg-[#C59B48]/80 rounded-full" aria-hidden="true" />
                </div>
                <h2 className="text-[clamp(1.15rem,4.5vw,2rem)] font-extrabold text-[#6B0812] leading-snug break-words">
                  {calcSec.heading || 'পোশাকের জন্য কত গজ কাপড় লাগবে হিসাব করুন'}
                </h2>
                <p className="text-xs sm:text-base text-[#523A35] leading-relaxed break-words">
                  {calcSec.description ||
                    'কাপড়ের বহর, পোশাকের ধরন এবং আপনার উচ্চতা নির্বাচন করলেই সঠিক গজের পরিমাণ ও আনুমানিক মূল্য সাথে সাথে জানতে পারবেন।'}
                </p>
              </div>

              <FabricYardCalculator isEmbedded />
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3 sm:space-y-14 pb-10 sm:pb-24 bg-[#FAF8F5] w-full min-w-0">
      {sections.map((sec) => renderSectionById(sec))}
    </div>
  );
};
