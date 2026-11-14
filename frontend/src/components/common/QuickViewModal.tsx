import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { FabricPatternVisual } from './FabricPatternVisual';
import { getUniqueProductFabricImage } from '../home/allProductsImageGenerator';
import { X, Heart, ShoppingBag, Zap, Check, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

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
      setYards(1.0);
      setSelectedColor(quickViewProduct.color);
    }
  }, [quickViewProduct]);

  if (!quickViewProduct) return null;

  const productImageUrl = useMemo(
    () => (quickViewProduct ? getUniqueProductFabricImage(quickViewProduct) : ''),
    [quickViewProduct]
  );

  const effectivePrice = quickViewProduct.discountPrice || quickViewProduct.pricePerYard;
  const totalPrice = Math.round(effectivePrice * yards);
  const isWishlisted = isInWishlist(quickViewProduct.id);

  const handleYardChange = (delta: number) => {
    const min = 1.0;
    const nextVal = Number((yards + delta).toFixed(2));
    if (nextVal >= min && nextVal <= quickViewProduct.stockYards) {
      setYards(nextVal);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-[#EDE5D9] relative animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Left Orange Back Button & Top-Right Close Button */}
        <button
          type="button"
          onClick={closeQuickView}
          className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-full bg-[#FF7A00] hover:bg-[#E86E00] text-white text-xs font-bold shadow-[0_4px_12px_rgba(255,122,0,0.35)] flex items-center gap-1 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ফিরে যান</span>
        </button>

        <button
          onClick={closeQuickView}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-[#FF7A00] hover:bg-[#E86E00] text-white shadow-md flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Visual Left Column */}
        <div className="w-full md:w-1/2 bg-[#FAF8F4] flex items-center justify-center p-4 sm:p-6 border-b md:border-b-0 md:border-r border-[#EDE5D9]">
          <div className="w-full max-w-[320px] aspect-square rounded-lg overflow-hidden shadow-sm border border-[#EDE5D9] bg-[#F3EFE6]">
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
        <div className="w-full md:w-1/2 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Meta tags */}
            <div className="flex items-center gap-2 text-xs text-[#242424]/60 mb-1.5">
              <span>{quickViewProduct.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#C5A46D]">{quickViewProduct.fabricWidth} বহর</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[11px]">{quickViewProduct.sku}</span>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-[#242424] leading-snug mb-2">
              {quickViewProduct.name}
            </h3>

            {/* Price Per Yard */}
            <div className="flex items-baseline gap-2.5 mb-2.5">
              <span className="text-xl font-bold text-[#242424] tabular-nums">
                ৳{effectivePrice}
              </span>
              <span className="text-xs text-[#242424]/60">প্রতি গজ</span>
              {quickViewProduct.discountPrice && (
                <span className="text-xs text-[#242424]/40 line-through tabular-nums">
                  ৳{quickViewProduct.pricePerYard}
                </span>
              )}
            </div>

            {/* Quick Fabric Specs */}
            <div className="flex items-center justify-between text-[11px] text-[#242424]/75 bg-[#FAF8F4] px-2.5 py-1.5 rounded-md border border-[#EDE5D9] mb-3">
              <span><strong className="text-[#242424]">বহর:</strong> {quickViewProduct.fabricWidth} বহর ({quickViewProduct.fabricWidth === '3.5' ? '৫৬-৬০ ইঞ্চি' : '৪২-৪৪ ইঞ্চি'})</span>
              <span className="flex items-center gap-1 text-emerald-800 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>ক্যাশ অন ডেলিভারি</span>
              </span>
            </div>

            {/* Color Swatches */}
            {quickViewProduct.availableColors && quickViewProduct.availableColors.length > 0 && (
              <div className="mb-4">
                <span className="text-xs font-medium text-[#242424]/80 block mb-1.5">
                  রং নির্বাচন করুন: <span className="font-semibold text-[#242424]">{selectedColor}</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickViewProduct.availableColors.map((colorName) => (
                    <button
                      key={colorName}
                      onClick={() => setSelectedColor(colorName)}
                      className={`text-xs px-2.5 py-1 rounded-sm border transition-all cursor-pointer ${
                        selectedColor === colorName
                          ? 'border-[#C5A46D] bg-[#FAF8F4] text-[#242424] font-medium'
                          : 'border-[#EDE5D9] bg-white text-[#242424]/70 hover:border-[#242424]/40'
                      }`}
                    >
                      {colorName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Yard Stepper */}
            <div className="mb-4 p-3 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#242424]">
                  কত গজ নিবেন?
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center border border-[#EDE5D9] bg-white rounded-md overflow-hidden">
                  <button
                    onClick={() => handleYardChange(-0.5)}
                    className="px-3 py-1.5 text-sm font-semibold text-[#242424] hover:bg-[#FAF8F4] active:bg-[#EDE5D9] transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-sm font-bold tabular-nums text-[#242424] min-w-[56px] text-center">
                    {yards} গজ
                  </span>
                  <button
                    onClick={() => handleYardChange(0.5)}
                    className="px-3 py-1.5 text-sm font-semibold text-[#242424] hover:bg-[#FAF8F4] active:bg-[#EDE5D9] transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-[#242424]/60 block">মোট মূল্য</span>
                  <span className="text-base font-bold text-[#242424] tabular-nums">
                    ৳{totalPrice}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  addToCart(quickViewProduct, yards, selectedColor);
                  closeQuickView();
                }}
                className="py-2.5 px-3 bg-white border border-[#242424] text-[#242424] hover:bg-[#FAF8F4] rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>কার্টে যোগ করুন</span>
              </button>

              <button
                onClick={() => {
                  buyNow(quickViewProduct, yards, selectedColor);
                  closeQuickView();
                }}
                className="py-2.5 px-3 bg-[#242424] hover:bg-[#C5A46D] text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-[#C5A46D]" />
                <span>সরাসরি কিনুন</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => toggleWishlist(quickViewProduct.id)}
                className={`text-xs flex items-center gap-1 py-1 cursor-pointer transition-colors ${
                  isWishlisted ? 'text-rose-600 font-medium' : 'text-[#242424]/70 hover:text-[#242424]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                <span>{isWishlisted ? 'পছন্দের তালিকায় আছে' : 'উইশলিস্টে রাখুন'}</span>
              </button>

              <button
                onClick={() => {
                  navigateTo('product-details', { productId: quickViewProduct.id });
                  closeQuickView();
                }}
                className="text-xs text-[#C5A46D] hover:underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>বিস্তারিত বিবরণ দেখুন</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
