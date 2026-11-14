import React from 'react';
import {
  FabricWidth,
  Product,
  FabricSectionRecord,
  FabricCategoryRecord,
  FabricCategoryDesignSettingsRecord,
  CategoryIconName
} from '../../types';
import { getUniqueProductFabricImage } from '../home/allProductsImageGenerator';
import {
  ArrowRight,
  Scissors,
  Crown,
  Layers,
  Shirt,
  Feather,
  Gem,
  Palette
} from 'lucide-react';

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)]);
}

export function renderCategoryIcon(iconName: CategoryIconName, className = 'w-3.5 h-3.5') {
  switch (iconName) {
    case 'scissors':
      return <Scissors className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'shirt':
      return <Shirt className={className} />;
    case 'feather':
      return <Feather className={className} />;
    case 'gem':
      return <Gem className={className} />;
    case 'palette':
      return <Palette className={className} />;
    case 'sparkles':
    default:
      return <Gem className={className} />;
  }
}

interface BaharEditorialCategorySectionProps {
  width: FabricWidth;
  section: FabricSectionRecord;
  categories: FabricCategoryRecord[];
  designSettings: FabricCategoryDesignSettingsRecord;
  products: Product[];
  onSelectCategory: (cat: FabricCategoryRecord) => void;
  forceViewport?: 'responsive' | 'desktop' | 'mobile';
}

export const BaharEditorialCategorySection: React.FC<BaharEditorialCategorySectionProps> = ({
  width,
  section,
  categories,
  designSettings,
  products,
  onSelectCategory,
  forceViewport = 'responsive'
}) => {
  const enabledCategories = categories
    .filter((c) => c.isEnabled)
    .sort((a, b) => a.order - b.order);

  const matchesCategoryName = (productCategory: string, cat: FabricCategoryRecord): boolean => {
    const targetName = cat.matchCategoryName || cat.name;
    if (productCategory === targetName || productCategory === cat.name) return true;
    if (
      (targetName === 'শার্ট কামিজ' || targetName === 'শর্ট কামিজ' || cat.slug === 'short-kamiz') &&
      (productCategory === 'শার্ট কামিজ' || productCategory === 'শর্ট কামিজ')
    ) {
      return true;
    }
    if (
      (targetName === 'গাউন / লেহেঙ্গা' || targetName === 'গাউন' || cat.slug === 'gown-lehenga' || cat.slug === 'gown') &&
      (productCategory === 'গাউন / লেহেঙ্গা' || productCategory === 'গাউন')
    ) {
      return true;
    }
    return false;
  };

  const resolveRepresentativeProduct = (cat: FabricCategoryRecord): Product => {
    const foundById = products.find((p) => p.id === cat.representativeProductId && p.fabricWidth === width);
    if (foundById) return foundById;

    const foundByCategory = products.find(
      (p) => p.fabricWidth === width && matchesCategoryName(p.category, cat)
    );
    if (foundByCategory) return foundByCategory;

    return {
      id: cat.representativeProductId || `fallback-${width}-${cat.slug}`,
      name: cat.name,
      description: cat.description,
      sku: cat.id,
      fabricWidth: width,
      category: cat.matchCategoryName || cat.name,
      fabricType: cat.sampleFabrics || 'প্রিমিয়াম ফেব্রিক',
      color: 'আইভরি গোল্ড',
      colorHex: cat.fallbackColorHex || '#850B1B',
      availableColors: [],
      pricePerYard: width === '3.5' ? 380 : 260,
      stockYards: 100,
      minOrderQuantity: 1.5,
      stepYard: 0.5,
      images: [],
      patternType: cat.fallbackPatternType || 'jamdani',
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: false,
      isActive: true
    };
  };

  const getProductCount = (cat: FabricCategoryRecord): number => {
    return products.filter(
      (p) => p.isActive && p.fabricWidth === width && matchesCategoryName(p.category, cat)
    ).length;
  };

  const bgHex = designSettings.backgroundColor || '#FAF6F0';
  const cardBgHex = designSettings.cardBackgroundColor || '#FFFCF7';
  const textHex = designSettings.textColor || '#850B1B';
  const bodyTextHex = designSettings.bodyTextColor || '#2B1816';
  const borderHex = designSettings.borderColor || '#D5A64A';
  const buttonHex = designSettings.buttonColor || '#850B1B';
  const buttonTextHex = designSettings.buttonTextColor || '#FFFFFF';
  const goldHex = designSettings.accentGoldColor || '#D5A64A';
  const isImageLeft = designSettings.imagePosition === 'left';
  const imgWidthPct = Math.min(52, Math.max(36, designSettings.imageWidthPercent || 44));
  const textWidthPct = 100 - imgWidthPct;
  const radiusPx = designSettings.cardBorderRadiusPx ?? 16;
  const gapPx = designSettings.cardGapPx ?? 20;
  const minHeightPx = designSettings.cardMinHeightPx ?? 220;

  const getDesktopAspectClass = () => {
    switch (designSettings.imageAspectRatio) {
      case '1/1':
        return 'aspect-square';
      case '3/4':
        return 'aspect-[3/4]';
      case '16/10':
        return 'aspect-[16/10]';
      case '4/5':
      default:
        return 'aspect-[4/5]';
    }
  };

  // Visibility classes for mobile vs desktop card architectures
  const mobileGridVisibility =
    forceViewport === 'mobile'
      ? 'grid'
      : forceViewport === 'desktop'
      ? 'hidden'
      : 'grid lg:hidden';

  const desktopGridVisibility =
    forceViewport === 'desktop'
      ? 'grid'
      : forceViewport === 'mobile'
      ? 'hidden'
      : 'hidden lg:grid';

  const mobileColsClass =
    designSettings.mobileColumns === 1 ? 'grid-cols-1' : 'grid-cols-2';
  const desktopColsClass =
    designSettings.desktopColumns === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <section
      style={{
        backgroundColor: bgHex
      }}
      className="transition-colors duration-300 space-y-4 sm:space-y-6"
    >
      {/* Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              style={{ color: goldHex }}
              className="text-[10px] sm:text-xs font-bold tracking-[0.16em] uppercase"
            >
              {section.eyebrow || `${width} BAHAR EDITORIAL COLLECTION`}
            </span>
            <span
              style={{ backgroundColor: goldHex }}
              className="w-8 sm:w-10 h-[1.5px] rounded-full opacity-80"
              aria-hidden="true"
            />
          </div>
          <h2
            style={{ color: textHex }}
            className="text-lg min-[375px]:text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight leading-snug"
          >
            {section.heading}
          </h2>
        </div>

        <p
          style={{ color: bodyTextHex }}
          className="text-xs sm:text-sm font-medium max-w-md leading-relaxed"
        >
          {section.subtitle}
        </p>
      </div>

      {/* ===================================================================== */}
      {/* MOBILE 2-COLUMN EDITORIAL CARDS (Matches Reference Image Inspiration) */}
      {/* ===================================================================== */}
      <div
        className={`${mobileGridVisibility} ${mobileColsClass} gap-2.5 min-[375px]:gap-3.5 sm:gap-4 items-stretch`}
      >
        {enabledCategories.map((cat) => {
          const repProduct = resolveRepresentativeProduct(cat);
          const resolvedImage =
            cat.customImageUrl && cat.customImageUrl.trim().length > 0
              ? cat.customImageUrl
              : getUniqueProductFabricImage(repProduct);

          return (
            <article
              key={`mob-${cat.id}`}
              onClick={() => onSelectCategory(cat)}
              style={{
                backgroundColor: cardBgHex,
                borderColor: `${borderHex}65`,
                borderRadius: `${radiusPx}px`
              }}
              className="group relative border shadow-[0_4px_14px_-4px_rgba(133,11,27,0.08)] hover:shadow-[0_10px_24px_-6px_rgba(133,11,27,0.15)] transition-all duration-300 p-1 min-[375px]:p-1.5 sm:p-2 flex flex-col justify-between h-full min-w-0 overflow-hidden cursor-pointer"
            >
              {/* Top: Large Prominent 4:3 Realistic Fabric Image (Edge-to-edge inside thin frame) */}
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#F3ECE1] shrink-0 relative">
                <img
                  src={resolvedImage}
                  alt={`${cat.name} - ${toBengaliDigits(width)} বহর`}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              {/* Bottom: Compact Left-Aligned Category Name, 2-Line Description, and Maroon Pill Button */}
              <div className="pt-1.5 pb-1 px-1.5 min-[375px]:px-2 flex-1 flex flex-col justify-between text-left min-w-0">
                <div className="space-y-0.5 min-w-0">
                  <h3
                    style={{ color: textHex }}
                    className="text-[14.5px] min-[360px]:text-[15.5px] min-[390px]:text-[16.5px] sm:text-[18px] font-extrabold leading-tight tracking-tight break-words"
                  >
                    {cat.name}
                  </h3>

                  <p
                    style={{ color: bodyTextHex }}
                    className="text-[10.5px] min-[360px]:text-[11px] min-[390px]:text-[11.5px] sm:text-xs leading-[1.3] font-medium line-clamp-2 break-words"
                  >
                    {cat.description}
                  </p>
                </div>

                {/* Compact Deep Maroon Pill Button ("কালেকশন দেখুন →") */}
                <div className="pt-1.5 pb-0.5 flex items-center justify-start">
                  <span
                    style={{
                      backgroundColor: buttonHex,
                      color: buttonTextHex
                    }}
                    className="inline-flex items-center justify-center gap-1 px-2.5 min-[360px]:px-3 min-[390px]:px-3.5 py-1 rounded-full text-[10px] min-[360px]:text-[11px] sm:text-xs font-bold shadow-xs group-hover:opacity-95 transition-all whitespace-nowrap max-w-full"
                  >
                    <span>
                      {cat.buttonLabel || 'কালেকশন দেখুন'}
                    </span>
                    <span aria-hidden="true" className="shrink-0 font-bold leading-none">
                      →
                    </span>
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* DESKTOP 3×2 EDITORIAL CARDS (Existing Desktop Layout Unchanged)       */}
      {/* ===================================================================== */}
      <div
        style={{ gap: `${gapPx}px` }}
        className={`${desktopGridVisibility} ${desktopColsClass} items-stretch`}
      >
        {enabledCategories.map((cat) => {
          const repProduct = resolveRepresentativeProduct(cat);
          const count = getProductCount(cat);
          const resolvedImage =
            cat.customImageUrl && cat.customImageUrl.trim().length > 0
              ? cat.customImageUrl
              : getUniqueProductFabricImage(repProduct);

          return (
            <article
              key={`desk-${cat.id}`}
              onClick={() => onSelectCategory(cat)}
              style={{
                backgroundColor: cardBgHex,
                borderColor: `${borderHex}85`,
                borderRadius: `${radiusPx}px`,
                minHeight: `${minHeightPx}px`
              }}
              className={`group relative border hover:shadow-[0_14px_30px_-10px_rgba(133,11,27,0.16)] shadow-[0_4px_16px_-6px_rgba(133,11,27,0.07)] transition-all duration-300 overflow-hidden cursor-pointer flex ${
                isImageLeft ? 'flex-row-reverse' : 'flex-row'
              } items-stretch`}
            >
              {/* Subtle top gold editorial hairline accent */}
              <div
                style={{ backgroundColor: goldHex }}
                className="absolute top-0 left-0 right-0 h-[2px] opacity-65 group-hover:opacity-100 transition-opacity z-10"
              />

              {/* Left Column: Category Editorial Text & Deep Maroon Action Button */}
              <div
                style={{ width: `${textWidthPct}%` }}
                className="p-4 lg:p-5 flex flex-col justify-between gap-3 z-10 text-left"
              >
                <div className="space-y-2">
                  {/* Top Meta Row: Standard Yardage Badge (No category icons/logos) */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      style={{
                        backgroundColor: bgHex,
                        borderColor: `${borderHex}65`,
                        color: textHex
                      }}
                      className="px-2 py-0.5 rounded text-[11px] font-bold border leading-tight truncate max-w-full"
                    >
                      {cat.standardYards}
                    </span>
                  </div>

                  {/* Category Title */}
                  <h3
                    style={{ color: textHex }}
                    className="text-lg lg:text-[19px] font-bold leading-snug tracking-tight"
                  >
                    {cat.name}
                  </h3>

                  {/* Editorial Description */}
                  <p
                    style={{ color: bodyTextHex }}
                    className="text-xs leading-relaxed line-clamp-3"
                  >
                    {cat.description}
                  </p>

                  {/* Fabric Type Note */}
                  {cat.sampleFabrics && (
                    <div className="pt-0.5">
                      <span
                        style={{
                          backgroundColor: bgHex,
                          borderColor: `${borderHex}55`,
                          color: bodyTextHex
                        }}
                        className="inline-block px-2 py-0.5 rounded border text-[10px] font-medium line-clamp-1"
                      >
                        ফেব্রিক: <strong style={{ color: textHex }}>{cat.sampleFabrics}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Action CTA Button */}
                <div className="pt-2 flex items-center justify-start">
                  <span
                    style={{
                      backgroundColor: buttonHex,
                      color: buttonTextHex,
                      borderColor: goldHex
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs group-hover:opacity-95 transition-all"
                  >
                    <span className="truncate">{cat.buttonLabel || 'কালেকশন দেখুন'}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>

              {/* Right Column: Clean Rectangular High-Resolution Fabric Photography */}
              <div
                style={{
                  width: `${imgWidthPct}%`,
                  borderColor: `${borderHex}55`
                }}
                className={`relative overflow-hidden bg-[#F3ECE1] shrink-0 ${
                  isImageLeft ? 'border-r' : 'border-l'
                }`}
              >
                <div className={`w-full h-full ${getDesktopAspectClass()} min-h-full relative`}>
                  <img
                    src={resolvedImage}
                    alt={`${cat.name} - ${toBengaliDigits(width)} বহর`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Subtle rectangular inner frame */}
                  <div
                    style={{ borderColor: `${goldHex}40` }}
                    className="absolute inset-2 border rounded-md pointer-events-none"
                  />

                  {/* Top-Right Fabric Count Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      style={{
                        backgroundColor: 'rgba(250, 246, 240, 0.94)',
                        borderColor: `${borderHex}90`,
                        color: textHex
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold border shadow-2xs backdrop-blur-xs"
                    >
                      {toBengaliDigits(count)}টি কাপড়
                    </span>
                  </div>

                  {/* Bottom-Right Bahar Tag */}
                  <div className="absolute bottom-2.5 right-2.5">
                    <span
                      style={{
                        backgroundColor: `${textHex}E6`,
                        borderColor: `${goldHex}80`,
                        color: '#FAF6F0'
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold border shadow-2xs"
                    >
                      {toBengaliDigits(width)} বহর
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
