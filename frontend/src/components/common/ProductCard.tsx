import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { getUniqueProductFabricImage } from '../home/allProductsImageGenerator';
import { Heart, Plus, Minus, ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

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

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    addToCart,
    buyNow,
    toggleWishlist,
    isInWishlist,
    navigateTo
  } = useStore();

  const minYards = 1;
  const stepYards = product.stepYard || 0.5;
  const [selectedYards, setSelectedYards] = useState<number>(1);

  useEffect(() => {
    setSelectedYards(1);
  }, [product.id]);

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

  const widthLabel = product.fabricWidth === '3.5' ? '৩.৫ বহর' : '২.৫ বহর';
  const availableColorCount = product.availableColors?.length || 1;
  const mobileSubtitle = getProductSubtitle(product);

  return (
    <article
      onClick={handleCardClick}
      className="group h-full w-full min-w-0 box-border bg-[#FFFDF9] rounded-[16px] sm:rounded-2xl border border-[#DFC79C] sm:border-[#E6D7C3] hover:border-[#C89B48] shadow-[0_4px_14px_-6px_rgba(97,7,16,0.10)] sm:shadow-[0_6px_24px_-10px_rgba(97,7,16,0.08)] hover:shadow-[0_14px_34px_-10px_rgba(97,7,16,0.14)] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer sm:cursor-default"
    >
      {/* 1. Large High-Quality Fabric Image with Rounded Top Corners */}
      <div
        onClick={handleCardClick}
        className="relative overflow-hidden rounded-t-[15px] sm:rounded-t-2xl cursor-pointer bg-[#F4ECE0]"
      >
        <div className="relative overflow-hidden w-full aspect-[1.28/1] sm:aspect-[4/3] bg-[#F3EFE6] select-none">
          <img
            src={productImageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </div>

        {/* Single Wishlist Heart Icon (Top-Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/95 backdrop-blur-xs border border-[#EADBC8]/80 shadow-xs flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer ${
            isWishlisted
              ? 'text-[#7A0915]'
              : 'text-[#7A0915] sm:text-[#3B2321]/75 hover:text-[#7A0915]'
          }`}
          aria-label="উইশলিস্টে যোগ করুন"
          title="উইশলিস্টে রাখুন"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#7A0915]' : ''}`} />
        </button>
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
              handleCardClick();
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
        className="hidden sm:flex p-5 lg:p-6 flex-1 flex-col justify-between gap-4"
      >
        <div className="space-y-2.5">
          {/* Fabric Width, Fabric Type & Category Information */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#F9F1E4] border border-[#E5D0B1] text-[#7A0915] font-semibold shrink-0">
              {widthLabel}
            </span>
            <span className="text-[#B8893A]" aria-hidden="true">•</span>
            <span className="font-semibold text-[#8A5A14] truncate max-w-[145px]">
              {product.fabricType}
            </span>
            <span className="text-[#B8893A]" aria-hidden="true">•</span>
            <span className="text-[#5C433E] font-medium shrink-0">
              {product.category}
            </span>
          </div>

          {/* Bengali Product Name (Consistent 2-Line Height) */}
          <h3
            onClick={handleCardClick}
            className="text-[17px] lg:text-[18px] font-bold text-[#2B1615] group-hover:text-[#7A0915] transition-colors leading-snug cursor-pointer line-clamp-2 min-h-[2.75rem]"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Available Color Information */}
          <div className="flex items-center justify-between gap-2 pt-0.5 text-[13px] text-[#523A35]">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                style={{ backgroundColor: product.colorHex }}
              />
              <span className="truncate font-medium">রং: {product.color}</span>
            </div>
            {availableColorCount > 1 && (
              <span className="text-xs text-[#7A0915]/80 font-medium shrink-0">
                {toBengaliNumber(availableColorCount)}টি রং
              </span>
            )}
          </div>
        </div>

        {/* 3. Price Per Yard, Quantity Selector & Action Buttons */}
        <div className="pt-3.5 border-t border-[#EDE0CE] space-y-3">
          <div className="flex items-center justify-between gap-2 flex-nowrap">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-[22px] font-bold text-[#6B0812] tabular-nums">
                ৳{toBengaliNumber(effectivePrice)}
              </span>
              <span className="text-xs font-medium text-[#5C433E] whitespace-nowrap">/ গজ</span>
              {hasDiscount && (
                <span className="text-sm text-[#8C7A72] line-through tabular-nums ml-0.5">
                  ৳{toBengaliNumber(product.pricePerYard)}
                </span>
              )}
            </div>
          </div>

          {/* Two Clear Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => addToCart(product, selectedYards)}
              className="py-2.5 px-3 rounded-lg bg-[#FAF3E8] hover:bg-[#F1E4D1] text-[#6B0812] border border-[#DFC9AA] hover:border-[#C69C53] text-sm font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap"
            >
              কার্টে যোগ করুন
            </button>

            <button
              type="button"
              onClick={() => buyNow(product, selectedYards)}
              className="py-2.5 px-3 rounded-lg bg-[#6B0812] hover:bg-[#53050D] text-white text-sm font-semibold shadow-[0_3px_10px_rgba(107,8,18,0.16)] hover:shadow-[0_5px_14px_rgba(107,8,18,0.24)] transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              এখনই কিনুন
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

