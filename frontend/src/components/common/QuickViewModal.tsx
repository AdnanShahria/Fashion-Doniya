import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { FabricPatternVisual } from './FabricPatternVisual';
import { getUniqueProductFabricImage } from '../home/allProductsImageGenerator';
import { toBengaliNumber, getColorSwatchHex } from '../../utils/fabricHelpers';
import { X, Heart, ShoppingBag, Zap, ArrowRight, ShieldCheck, Plus, Minus } from 'lucide-react';

export const QuickViewModal: React.FC = () => {
  const {
    quickViewProduct,
    closeQuickView,
    addToCart,
    buyNow,
    toggleWishlist,
    isInWishlist,
    navigateTo
  } = useStore();

  const [yards, setYards] = useState<number>(1.0);
  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    if (quickViewProduct) {
      setYards(Math.max(1.0, quickViewProduct.minOrderQuantity || 1.0));
      setSelectedColor(quickViewProduct.color);
    }
  }, [quickViewProduct]);

  useEffect(() => {
    if (!quickViewProduct) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeQuickView();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [quickViewProduct, closeQuickView]);

  const productImageUrl = useMemo(
    () => (quickViewProduct ? getUniqueProductFabricImage(quickViewProduct) : ''),
    [quickViewProduct]
  );

  if (!quickViewProduct) return null;

  const effectivePrice = quickViewProduct.discountPrice || quickViewProduct.pricePerYard;
  const totalPrice = Math.round(effectivePrice * yards);
  const isWishlisted = isInWishlist(quickViewProduct.id);
  const isOutOfStock = quickViewProduct.stockYards <= 0;
  const yardStep = quickViewProduct.stepYard || 0.5;

  const handleYardChange = (delta: number) => {
    const min = Math.max(0.5, quickViewProduct.minOrderQuantity || 1.0);
    const nextVal = Number((yards + delta).toFixed(2));
    if (nextVal >= min && nextVal <= quickViewProduct.stockYards) {
      setYards(nextVal);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={quickViewProduct.name}
      onClick={closeQuickView}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#1C0B0D]/55 backdrop-blur-sm"
    >
      <div
        className="bg-[#FFFDF9] rounded-2xl sm:rounded-3xl shadow-[0_24px_60px_-15px_rgba(36,22,20,0.38)] max-w-2xl w-full overflow-hidden border border-[#E5D4BE] relative max-h-[92vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Warm Frosted Close Control */}
        <button
          type="button"
          onClick={closeQuickView}
          aria-label="বন্ধ করুন"
          className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full glass-control-light hover:bg-[#FFFDF9] border border-[#DFCBB2] text-[#6B0812] shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
        >
          <X className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Product Visual Left Column */}
        <div className="w-full md:w-[46%] bg-[#FAF6F0] flex items-center justify-center p-4 sm:p-6 border-b md:border-b-0 md:border-r border-[#EDE0CE]">
          <div className="w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden shadow-[0_8px_24px_-8px_rgba(36,22,20,0.16)] border border-[#E5D4BE] bg-[#F3ECE0]">
            {productImageUrl ? (
              <img
                src={productImageUrl}
                alt={quickViewProduct.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <FabricPatternVisual
                productId={quickViewProduct.id}
                patternType={quickViewProduct.patternType}
                colorHex={quickViewProduct.colorHex}
                fabricWidth={quickViewProduct.fabricWidth}
                title={quickViewProduct.fabricType}
                aspectRatio="square"
              />
            )}
          </div>
        </div>

        {/* Product Details Right Column */}
        <div className="w-full md:w-[54%] p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Meta tags */}
            <div className="flex items-center flex-wrap gap-1.5 text-xs text-[#523A35] mb-1.5 pr-10">
              <span className="font-semibold">{quickViewProduct.category}</span>
              <span aria-hidden="true" className="text-[#C59B48]">·</span>
              <span className="font-bold text-[#8A5A10]">
                {toBengaliNumber(quickViewProduct.fabricWidth)} বহর
              </span>
              <span aria-hidden="true" className="text-[#C59B48]">·</span>
              <span className="font-mono text-[11px] text-[#6E5750]">{quickViewProduct.sku}</span>
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-extrabold text-[#241614] leading-snug mb-2">
              {quickViewProduct.name}
            </h3>

            {/* Price Per Yard */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-extrabold text-[#6B0812] tabular-nums">
                ৳{toBengaliNumber(effectivePrice)}
              </span>
              <span className="text-xs font-semibold text-[#523A35]">/ গজ</span>
              {quickViewProduct.discountPrice && (
                <span className="text-xs text-[#6E5750] line-through tabular-nums">
                  ৳{toBengaliNumber(quickViewProduct.pricePerYard)}
                </span>
              )}
            </div>

            {/* Quick Fabric Specs */}
            <div className="flex items-center justify-between text-[11.5px] text-[#523A35] bg-[#FAF6F0] px-3 py-2 rounded-xl border border-[#E6D7C3] mb-4">
              <span>
                <strong className="text-[#241614]">বহর:</strong> {toBengaliNumber(quickViewProduct.fabricWidth)} বহর ({quickViewProduct.fabricWidth === '3.5' ? '৫৬–৬০ ইঞ্চি' : '৪২–৪৪ ইঞ্চি'})
              </span>
              <span className="flex items-center gap-1 text-[#14533C] font-semibold shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-[#14533C]" />
                <span>ক্যাশ অন ডেলিভারি</span>
              </span>
            </div>

            {/* Color Swatches */}
            {quickViewProduct.availableColors && quickViewProduct.availableColors.length > 0 && (
              <div className="mb-4">
                <span className="text-xs font-medium text-[#523A35] block mb-2">
                  রং নির্বাচন করুন: <strong className="font-bold text-[#241614]">{selectedColor}</strong>
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickViewProduct.availableColors.map((colorName) => {
                    const isSelected = selectedColor === colorName;
                    const hex =
                      colorName === quickViewProduct.color
                        ? quickViewProduct.colorHex || '#C5A46D'
                        : getColorSwatchHex(colorName, quickViewProduct.colorHex || '#C5A46D');
                    return (
                      <button
                        key={colorName}
                        type="button"
                        onClick={() => setSelectedColor(colorName)}
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] ${
                          isSelected
                            ? 'border-[#6B0812] bg-[#FAF3E8] text-[#6B0812] font-bold shadow-2xs'
                            : 'border-[#E5D4BE] bg-[#FFFDF9] text-[#523A35] hover:border-[#C59B48]'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        <span>{colorName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Yard Stepper */}
            <div className="mb-4 p-3 bg-[#FAF6F0] rounded-xl border border-[#E5D4BE]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#241614]">
                  কত গজ নিবেন?
                </span>
                <span className="text-[11px] text-[#523A35] tabular-nums">
                  স্টক: {toBengaliNumber(quickViewProduct.stockYards)} গজ
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center border border-[#DFC9AA] bg-[#FFFDF9] rounded-xl p-0.5">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleYardChange(-yardStep)}
                    aria-label="গজ কমান"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B0812] hover:bg-[#FAF3E8] active:bg-[#EFE2CE] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3.5 py-1 text-sm font-extrabold tabular-nums text-[#241614] min-w-[68px] text-center">
                    {toBengaliNumber(yards)} গজ
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleYardChange(yardStep)}
                    aria-label="গজ বাড়ান"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B0812] hover:bg-[#FAF3E8] active:bg-[#EFE2CE] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-[#523A35] block">মোট মূল্য</span>
                  <span className="text-lg font-extrabold text-[#6B0812] tabular-nums">
                    ৳{toBengaliNumber(totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => {
                  addToCart(quickViewProduct, yards, selectedColor);
                  closeQuickView();
                }}
                className="min-h-[44px] py-2.5 px-3 bg-[#FAF3E8] hover:bg-[#F1E3CE] disabled:opacity-50 disabled:cursor-not-allowed border border-[#DFC9AA] text-[#6B0812] rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'স্টক শেষ' : 'কার্টে যোগ করুন'}</span>
              </button>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => {
                  buyNow(quickViewProduct, yards, selectedColor);
                  closeQuickView();
                }}
                className="min-h-[44px] py-2.5 px-3 bg-gradient-to-b from-[#7D0A15] to-[#63060F] hover:from-[#8C0C18] hover:to-[#53050D] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold shadow-[0_6px_16px_-4px_rgba(107,8,18,0.32),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
              >
                <Zap className="w-4 h-4 text-[#F3D8A4]" />
                <span>{isOutOfStock ? 'অপ্রাপ্য' : 'সরাসরি কিনুন'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => toggleWishlist(quickViewProduct.id)}
                className={`text-xs flex items-center gap-1.5 py-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] rounded-md ${
                  isWishlisted ? 'text-[#6B0812] font-bold' : 'text-[#523A35] hover:text-[#6B0812]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-[#6B0812]' : ''}`} />
                <span>{isWishlisted ? 'পছন্দের তালিকায় আছে' : 'উইশলিস্টে রাখুন'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigateTo('product-details', { productId: quickViewProduct.id });
                  closeQuickView();
                }}
                className="text-xs text-[#8A5A10] hover:text-[#6B0812] hover:underline font-bold flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] rounded-md py-1"
              >
                <span>বিস্তারিত বিবরণ দেখুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
