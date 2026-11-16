import React, { useState } from 'react';
import { Link } from 'react-router';
import { useStore } from '../context/StoreContext';
import { FabricPatternVisual } from '../components/common/FabricPatternVisual';
import { getUniqueProductFabricImage } from '../components/home/allProductsImageGenerator';
import { formatMeasurementsSummary } from '../services/measurementService';
import { 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  Tag, 
  Truck, 
  ShieldCheck, 
  RotateCcw,
  Sparkles,
  AlertCircle,
  Scissors
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { 
    cart, 
    cartSubtotal, 
    cartTotalYards, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart, 
    navigateTo, 
    settings,
    appliedCoupon,
    applyCoupon,
    clearCoupon,
    showToast 
  } = useStore();

  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || '');
  const [deliveryLocation, setDeliveryLocation] = useState<'inside' | 'outside'>('inside');

  const deliveryFee = Number(
    (deliveryLocation === 'inside'
      ? settings?.insideDhakaDeliveryFee
      : settings?.outsideDhakaDeliveryFee) ?? (deliveryLocation === 'inside' ? 80 : 150)
  );

  const isFreeDelivery = cartSubtotal >= Number(settings?.freeDeliveryThreshold ?? 2500);
  const effectiveDeliveryFee = isFreeDelivery ? 0 : deliveryFee;

  const discountAmount = appliedCoupon ? Number(appliedCoupon.discount || 0) : 0;
  const grandTotal = Math.max(0, cartSubtotal + effectiveDeliveryFee - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    applyCoupon(couponCode, cartSubtotal);
  };

  const handleRemoveCoupon = () => {
    clearCoupon();
    setCouponCode('');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-[#FAF8F4] text-[#C5A46D] rounded-full flex items-center justify-center mx-auto border border-[#EDE5D9]">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#242424]">আপনার শপিং ব্যাগটি খালি</h2>
          <p className="text-xs sm:text-sm text-[#242424]/65">
            আপনি এখনও কোনো কাপড় ব্যাগে যোগ করেননি। আমাদের প্রিমিয়াম ২.৫ ও ৩.৫ বহরের ফ্যাব্রিক কালেকশন ঘুরে দেখুন।
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigateTo('shop')}
            className="px-6 py-3 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer shadow-md"
          >
            কাপড় কালেকশন দেখুন
          </button>
          <button
            onClick={() => navigateTo('calculator')}
            className="px-6 py-3 bg-white border border-[#EDE5D9] hover:bg-[#FAF8F4] text-[#242424] text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            গজ হিসাব করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#EDE5D9] pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#C5A46D]">
            শপিং ব্যাগ
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#242424] mt-1">
            আপনার নির্বাচিত কাপড় সমূহ ({cart.length}টি আইটেম)
          </h1>
        </div>
        <button
          onClick={() => clearCart()}
          className="text-xs text-[#242424]/60 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>সম্পূর্ণ ব্যাগ খালি করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Cart Item List (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => {
            const itemSubtotal = item.finalProductPrice ?? Math.round(item.pricePerYard * item.yards);
            const stepAmount = item.isCustomized ? 0.25 : 0.5;
            const measurementSummary = formatMeasurementsSummary(item.customMeasurements);
            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 bg-white rounded-xl border border-[#EDE5D9] flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-xs"
              >
                {/* Visuals: Fabric Pattern + Outfit Preview Thumbnail */}
                <div 
                  onClick={() => navigateTo('product-details', { productId: item.productId })}
                  className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border border-[#EDE5D9] shrink-0 cursor-pointer bg-[#FAF8F4]"
                >
                  {getUniqueProductFabricImage(item.product) ? (
                    <img
                      src={getUniqueProductFabricImage(item.product)}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FabricPatternVisual
                      productId={item.productId}
                      patternType={item.product.patternType}
                      colorHex={item.product.colorHex}
                      fabricWidth={item.selectedWidth}
                      title={item.product.fabricType}
                      aspectRatio="square"
                    />
                  )}
                  {item.outfitCategory && (
                    <span className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[9px] font-bold py-0.5 px-1 rounded text-center truncate">
                      {item.outfitCategory}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 text-center sm:text-left space-y-1.5 w-full">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#242424]/60">
                    {item.outfitCategory && (
                      <span className="px-2 py-0.5 bg-[#850B1B] text-white font-bold rounded text-[11px]">
                        পোশাক: {item.outfitCategory}
                      </span>
                    )}
                    <span className="font-semibold text-[#C5A46D]">{item.selectedWidth} হাত বহর</span>
                    <span>·</span>
                    <span>রং: {item.selectedColor}</span>
                    {item.isCustomized ? (
                      <span className="px-2 py-0.5 bg-[#850B1B]/10 text-[#850B1B] font-bold rounded text-[11px] inline-flex items-center gap-1">
                        <Scissors className="w-3 h-3" />
                        নিজের মাপে কাস্টমাইজড
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-[#FAF8F4] border border-[#EDE5D9] text-[#242424]/70 font-semibold rounded text-[11px]">
                        স্ট্যান্ডার্ড সাইজ
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/product/${encodeURIComponent(item.product.slug || item.productId)}`}
                    className="block"
                  >
                    <h3 className="text-base font-bold text-[#242424] hover:text-[#C5A46D] cursor-pointer">
                      {item.product.name} {item.outfitCategory ? `(${item.outfitCategory})` : ''}
                    </h3>
                  </Link>

                  <div className="text-xs text-[#242424]/60 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1">
                    <span>
                      প্রতি গজ: <strong className="text-[#242424] tabular-nums">৳{item.pricePerYard}</strong>
                    </span>
                    {item.standardGaj !== undefined && (
                      <span>
                        স্ট্যান্ডার্ড গজ: <strong className="text-[#242424] tabular-nums">{item.standardGaj} গজ</strong>
                      </span>
                    )}
                    {item.isCustomized && (
                      <span>
                        নির্বাচিত কাস্টম গজ: <strong className="text-[#850B1B] tabular-nums">{item.yards} গজ</strong>
                        {item.additionalGaj !== undefined && item.additionalGaj > 0 && (
                          <span className="text-[#850B1B] font-semibold"> (+{item.additionalGaj} গজ অতিরিক্ত)</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Custom Measurement Details Box */}
                  {item.isCustomized && (measurementSummary || item.customizationNotes) && (
                    <div className="mt-2 p-2.5 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] text-left text-xs space-y-1">
                      {measurementSummary && (
                        <div className="text-[#242424]/85">
                          <strong className="text-[#850B1B]">কাস্টম মাপ:</strong> {measurementSummary}
                        </div>
                      )}
                      {item.customizationNotes && (
                        <div className="text-[#242424]/70">
                          <strong>নোট:</strong> {item.customizationNotes}
                        </div>
                      )}
                    </div>
                  )}

                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                      {item.selectedAddons.map((addon, idx) => (
                        <span
                          key={`${addon.addonId}-${addon.fabricId}-${idx}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FAF8F4] border border-[#EDE5D9] rounded-md text-[11px] text-[#242424]/80"
                        >
                          <span className="font-semibold text-[#850B1B]">{addon.addonName}</span>
                          <span>· {addon.fabricName}</span>
                          <span>×{addon.count}</span>
                          <span className="font-bold text-[#242424] tabular-nums">৳{addon.totalAddonPrice}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-[#EDE5D9] bg-[#FAF8F4] rounded-md overflow-hidden">
                    <button
                      onClick={() => updateCartQuantity(item.id, Number((item.yards - stepAmount).toFixed(2)))}
                      className="px-2.5 py-1 text-sm font-bold text-[#242424] hover:bg-[#EDE5D9] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold tabular-nums text-[#242424] min-w-[55px] text-center">
                      {item.yards} গজ
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.id, Number((item.yards + stepAmount).toFixed(2)))}
                      className="px-2.5 py-1 text-sm font-bold text-[#242424] hover:bg-[#EDE5D9] cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Item */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-[#242424]/40 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                    title="সরিয়ে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right sm:min-w-[90px]">
                  <span className="text-[11px] text-[#242424]/50 block sm:hidden">মোট</span>
                  <span className="text-base font-bold text-[#242424] tabular-nums">
                    ৳{itemSubtotal}
                  </span>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <button
              onClick={() => navigateTo('shop')}
              className="text-xs font-semibold text-[#C5A46D] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <span>← আরও পছন্দের কাপড় যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* Order Summary & Checkout (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#FAF8F4] rounded-xl border border-[#EDE5D9] p-6 space-y-6">
            
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-3">
              অর্ডার সারাংশ (Order Summary)
            </h2>

            {/* Calculations */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-[#242424]/75">
                <span>মোট গজ পরিমাণ:</span>
                <span className="font-semibold text-[#242424] tabular-nums">{cartTotalYards.toFixed(1)} গজ</span>
              </div>

              <div className="flex justify-between text-[#242424]/75">
                <span>কাপড়ের সাবটোটাল:</span>
                <span className="font-semibold text-[#242424] tabular-nums">৳{cartSubtotal}</span>
              </div>

              {/* Delivery Destination Toggle */}
              <div className="pt-2 border-t border-[#EDE5D9]/60">
                <span className="text-[#242424] font-semibold block mb-1.5">ডেলিভারি লোকেশন:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDeliveryLocation('inside')}
                    className={`p-2 rounded-md border text-center transition-all cursor-pointer ${
                      deliveryLocation === 'inside'
                        ? 'border-[#C5A46D] bg-white font-bold text-[#242424]'
                        : 'border-[#EDE5D9] text-[#242424]/70'
                    }`}
                  >
                    ঢাকা সিটি (৳{settings.insideDhakaDeliveryFee})
                  </button>
                  <button
                    onClick={() => setDeliveryLocation('outside')}
                    className={`p-2 rounded-md border text-center transition-all cursor-pointer ${
                      deliveryLocation === 'outside'
                        ? 'border-[#C5A46D] bg-white font-bold text-[#242424]'
                        : 'border-[#EDE5D9] text-[#242424]/70'
                    }`}
                  >
                    ঢাকার বাইরে (৳{settings.outsideDhakaDeliveryFee})
                  </button>
                </div>
              </div>

              <div className="flex justify-between text-[#242424]/75">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-semibold text-[#242424] tabular-nums">
                  {effectiveDeliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold">ফ্রি ডেলিভারি</span>
                  ) : (
                    `৳${effectiveDeliveryFee}`
                  )}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <div className="flex items-center gap-1">
                    <span>কুপন ছাড় ({appliedCoupon.code}):</span>
                    <button onClick={handleRemoveCoupon} className="text-rose-500 hover:underline text-[10px] cursor-pointer">
                      (মুছুন)
                    </button>
                  </div>
                  <span className="tabular-nums">-৳{appliedCoupon.discount}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="pt-3 border-t border-[#EDE5D9] flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-[#242424] block">সর্বমোট প্রদেয়:</span>
                  <span className="text-[11px] text-[#242424]/50">ক্যাশ অন ডেলিভারিতে প্রদেয়</span>
                </div>
                <span className="text-2xl font-extrabold text-[#242424] tabular-nums">
                  ৳{grandTotal}
                </span>
              </div>
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="কুপন কোড (যেমন: DONIYA10)"
                className="flex-1 bg-white border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs uppercase text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                প্রয়োগ
              </button>
            </form>

            {/* Sample Coupons hint */}
            <div className="text-[11px] text-[#523A35] bg-[#FAF8F4] p-2.5 rounded-lg border border-[#EDE5D9] flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#C59B48] shrink-0" />
              <span>
                কুপন ব্যবহার করুন: <span className="font-bold text-[#6B0812]">DONIYA10</span> (১০% ছাড়) অথবা <span className="font-bold text-[#6B0812]">FASHION50</span> (৳৫০ ছাড়)
              </span>
            </div>

            {/* Proceed to Checkout CTA */}
            <button
              onClick={() => navigateTo('checkout')}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#850B16] via-[#6B0812] to-[#54050D] hover:from-[#960D19] hover:to-[#6B0812] active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-xl shadow-[0_6px_20px_-4px_rgba(107,8,18,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>চেকআউটে এগিয়ে যান</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Trust note */}
            <div className="text-center text-[11px] text-[#523A35]/80 flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করুন</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
