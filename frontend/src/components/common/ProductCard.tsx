import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { getUniqueProductFabricImage } from '../home/allProductsImageGenerator';
import { toBengaliNumber, getProductSubtitle } from '../../utils/fabricHelpers';
import { Heart, Eye, ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    addToCart,
    buyNow,
    toggleWishlist,
    isInWishlist,
    navigateTo,
    openQuickView
  } = useStore();

  const [selectedYards, setSelectedYards] = useState<number>(product.minOrderQuantity || 1);

  useEffect(() => {
    setSelectedYards(product.minOrderQuantity || 1);
  }, [product.id, product.minOrderQuantity]);

  const isOutOfStock = product.stockYards <= 0;

  const isWishlisted = isInWishlist(product.id);
  const effectivePrice = product.discountPrice || product.pricePerYard;
  const hasDiscount = !!product.discountPrice && product.discountPrice < product.pricePerYard;

  const productImageUrl = useMemo(
    () => getUniqueProductFabricImage(product),
    [product]
  );

  const handleCardClick = () => {
    navigateTo('product-details', { productId: product.id });
  };

  const widthLabel = product.fabricWidth === '3.5' ? '৩.৫ বহর' : '২.৫ বহর';
  const availableColorCount = product.availableColors?.length || 1;
  const mobileSubtitle = getProductSubtitle(product);

  return (
    <article
      onClick={handleCardClick}
      className="group h-full w-full min-w-0 box-border bg-[#FFFDF9] rounded-[18px] sm:rounded-2xl border border-[#E5D4BE] hover:border-[#C59B48] shadow-[0_2px_8px_-4px_rgba(36,22,20,0.06),0_10px_26px_-12px_rgba(107,8,18,0.10)] hover:shadow-[0_18px_40px_-14px_rgba(107,8,18,0.16)] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer sm:cursor-default"
    >
      {/* 1. High-Resolution Fabric Photography */}
      <div
        onClick={handleCardClick}
        className="relative overflow-hidden rounded-t-[17px] sm:rounded-t-2xl cursor-pointer bg-[#F4ECE0]"
      >
        <div className="relative overflow-hidden w-full aspect-[1.24/1] sm:aspect-[4/3] bg-[#F3ECE0] select-none">
          <img
            src={productImageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        </div>

        {/* Top-Left Width & Discount Badges (Desktop) */}
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

        {/* Top-Right Floating Glass Controls (Wishlist + Quick View) */}
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
            aria-label="কুইক ভিউ দেখুন"
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
              handleCardClick();
            }}
            className="w-8 h-8 rounded-full bg-[#6B0812] hover:bg-[#53050D] text-white flex items-center justify-center shrink-0 shadow-[0_3px_10px_rgba(107,8,18,0.22)] transition-transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
            aria-label="বিস্তারিত দেখুন"
            title="বিস্তারিত দেখুন"
          >
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* 2B. DESKTOP CARD BODY (sm:flex) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="hidden sm:flex p-5 lg:p-6 flex-1 flex-col justify-between gap-4"
      >
        <div className="space-y-2.5">
          {/* Fabric Width, Fabric Type & Category Information */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <span className="font-bold text-[#8A5A10] truncate max-w-[145px]">
              {product.fabricType}
            </span>
            <span className="text-[#C59B48]" aria-hidden="true">·</span>
            <span className="text-[#523A35] font-medium shrink-0">
              {product.category}
            </span>
          </div>

          {/* Bengali Product Name (Consistent 2-Line Height) */}
          <h3
            onClick={handleCardClick}
            className="text-[17px] lg:text-[18px] font-bold text-[#241614] group-hover:text-[#6B0812] transition-colors leading-snug cursor-pointer line-clamp-2 min-h-[2.8rem]"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Available Color Information */}
          <div className="flex items-center justify-between gap-2 pt-0.5 text-[13px] text-[#523A35]">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs shrink-0"
                style={{ backgroundColor: product.colorHex }}
              />
              <span className="truncate font-medium">রং: {product.color}</span>
            </div>
            {availableColorCount > 1 && (
              <span className="text-xs text-[#6B0812]/85 font-semibold shrink-0">
                {toBengaliNumber(availableColorCount)}টি রং
              </span>
            )}
          </div>
        </div>

        {/* 3. Price Per Yard & Action Buttons */}
        <div className="pt-3.5 border-t border-[#EDE0CE] space-y-3">
          <div className="flex items-center justify-between gap-2 flex-nowrap">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-[22px] font-extrabold text-[#6B0812] tabular-nums">
                ৳{toBengaliNumber(effectivePrice)}
              </span>
              <span className="text-xs font-semibold text-[#523A35] whitespace-nowrap">/ গজ</span>
              {hasDiscount && (
                <span className="text-sm text-[#6E5750] line-through tabular-nums ml-0.5">
                  ৳{toBengaliNumber(product.pricePerYard)}
                </span>
              )}
            </div>
          </div>

          {/* Two Clear Action Buttons (40px+ comfortable hit height) */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => addToCart(product, selectedYards)}
              className="min-h-[40px] py-2 px-3 rounded-xl bg-[#FAF3E8] hover:bg-[#F1E3CE] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-[#6B0812] border border-[#DFC9AA] hover:border-[#C59B48] text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
            >
              {isOutOfStock ? 'স্টক শেষ' : 'কার্টে যোগ করুন'}
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => buyNow(product, selectedYards)}
              className="min-h-[40px] py-2 px-3 rounded-xl bg-gradient-to-b from-[#7D0A15] to-[#63060F] hover:from-[#8C0C18] hover:to-[#53050D] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white text-sm font-semibold shadow-[0_4px_12px_rgba(107,8,18,0.20),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-200 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
            >
              {isOutOfStock ? 'অপ্রাপ্য' : 'এখনই কিনুন'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
