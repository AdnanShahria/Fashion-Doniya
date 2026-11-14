import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { FabricWidth } from '../../types';
import { measurementService } from '../../services/measurementService';
import {
  Plus,
  Minus,
  Check
} from 'lucide-react';

interface FabricYardCalculatorProps {
  initialWidth?: FabricWidth;
  preSelectedProductId?: string;
  isEmbedded?: boolean;
}

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function toBengaliNumber(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)]);
}

export const FabricYardCalculator: React.FC<FabricYardCalculatorProps> = ({
  initialWidth = '3.5',
  preSelectedProductId,
  isEmbedded = false
}) => {
  const { products, addToCart, buyNow, navigateTo, showToast } = useStore();

  const [fabricWidth, setFabricWidth] = useState<FabricWidth>(initialWidth);
  const [selectedOutfitRuleId, setSelectedOutfitRuleId] = useState<string>('');
  const [outfitCount, setOutfitCount] = useState<number>(1);
  const [additionalSelections, setAdditionalSelections] = useState<{ [id: string]: number }>({});
  const [selectedProductId, setSelectedProductId] = useState<string>(preSelectedProductId || '');

  // Custom measurement inputs
  const [heightFit, setHeightFit] = useState<'standard' | 'tall' | 'petite'>('standard');
  const [bodyLengthInches, setBodyLengthInches] = useState<string>('44');
  const [chestSizeInches, setChestSizeInches] = useState<string>('38');

  // Load rules and additions for current width
  const rules = useMemo(() => measurementService.getRulesByWidth(fabricWidth), [fabricWidth]);
  const additionalItems = useMemo(() => measurementService.getAdditionalItemsByWidth(fabricWidth), [fabricWidth]);

  // Set default selected rule when width changes
  React.useEffect(() => {
    if (rules.length > 0 && (!selectedOutfitRuleId || !rules.some(r => r.id === selectedOutfitRuleId))) {
      setSelectedOutfitRuleId(rules[0].id);
    }
  }, [rules, selectedOutfitRuleId]);

  // Available fabrics matching the width
  const matchingFabrics = useMemo(() => {
    return products.filter(p => p.fabricWidth === fabricWidth && p.isActive);
  }, [products, fabricWidth]);

  // Active chosen product
  const chosenProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || matchingFabrics[0];
  }, [products, selectedProductId, matchingFabrics]);

  // Calculate adjustment for tall height or extra body length
  const customAdjustment = useMemo(() => {
    let adj = 0;
    if (heightFit === 'tall') adj += 0.25;
    const lengthNum = Number(bodyLengthInches);
    if (!isNaN(lengthNum) && lengthNum > 46) adj += 0.25;
    return adj;
  }, [heightFit, bodyLengthInches]);

  // Calculation result
  const calculation = useMemo(() => {
    return measurementService.calculateRequiredYards({
      fabricWidth,
      outfitRuleId: selectedOutfitRuleId,
      outfitCount,
      additionalItemSelections: additionalSelections,
      customAdjustmentYards: customAdjustment
    });
  }, [fabricWidth, selectedOutfitRuleId, outfitCount, additionalSelections, customAdjustment]);

  const pricePerYard = chosenProduct ? (chosenProduct.discountPrice || chosenProduct.pricePerYard) : 300;
  const estimatedCost = Math.round(calculation.totalYards * pricePerYard);

  const handleAdditionalItemToggle = (itemId: string, increment: boolean) => {
    setAdditionalSelections(prev => {
      const current = prev[itemId] || 0;
      const next = increment ? current + 1 : Math.max(0, current - 1);
      return { ...prev, [itemId]: next };
    });
  };

  const handleAddToCartCalculated = () => {
    if (!chosenProduct) {
      showToast('অনুগ্রহ করে একটি কাপড় নির্বাচন করুন', 'info');
      return;
    }
    addToCart(chosenProduct, calculation.totalYards);
  };

  const handleBuyNowCalculated = () => {
    if (!chosenProduct) {
      showToast('অনুগ্রহ করে একটি কাপড় নির্বাচন করুন', 'info');
      return;
    }
    buyNow(chosenProduct, calculation.totalYards);
  };

  return (
    <div
      className={`w-full max-w-full min-w-0 box-border bg-white rounded-xl sm:rounded-2xl border border-[#EDE5D9] shadow-xs overflow-hidden ${
        isEmbedded ? 'p-3 sm:p-6' : 'p-3 sm:p-6 lg:p-8'
      }`}
    >
      {/* Title Header + Width Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3.5 sm:pb-6 border-b border-[#EDE5D9] gap-3 sm:gap-4 min-w-0">
        <div className="min-w-0 space-y-1">
          <div className="text-[#B87D14] font-bold text-[10px] sm:text-xs uppercase tracking-wider">
            <span>স্মার্ট গজ পরিমাপক</span>
          </div>
          <h2 className="text-[clamp(1.05rem,4.2vw,1.5rem)] font-bold text-[#610710] leading-snug break-words">
            কাপড়ের স্বয়ংক্রিয় গজ ক্যালকুলেটর
          </h2>
          <p className="text-[clamp(0.75rem,2.8vw,0.875rem)] text-[#4E3631]/80 leading-relaxed break-words">
            আপনার পোশাকের ধরন ও বহর নির্বাচন করুন, প্রয়োজনীয় নিখুঁত গজের হিসাব পেয়ে যান নিমেষেই।
          </p>
        </div>

        {/* Width Switcher (৩.৫ বহর vs ২.৫ বহর) - Full width 2-col on mobile, inline on desktop */}
        <div className="w-full md:w-auto grid grid-cols-2 md:inline-flex items-center p-1 bg-[#FAF6F0] border border-[#E5D4BE] rounded-xl shrink-0 box-border">
          <button
            type="button"
            onClick={() => {
              setFabricWidth('3.5');
              setAdditionalSelections({});
            }}
            className={`min-h-[38px] px-2.5 sm:px-4 py-1.5 text-[clamp(0.72rem,2.8vw,0.8125rem)] font-bold rounded-lg transition-all cursor-pointer text-center leading-tight ${
              fabricWidth === '3.5'
                ? 'bg-[#6B0812] text-white shadow-xs'
                : 'text-[#4E3631] hover:text-[#6B0812]'
            }`}
          >
            ৩.৫ বহর (বড় বহর)
          </button>
          <button
            type="button"
            onClick={() => {
              setFabricWidth('2.5');
              setAdditionalSelections({});
            }}
            className={`min-h-[38px] px-2.5 sm:px-4 py-1.5 text-[clamp(0.72rem,2.8vw,0.8125rem)] font-bold rounded-lg transition-all cursor-pointer text-center leading-tight ${
              fabricWidth === '2.5'
                ? 'bg-[#6B0812] text-white shadow-xs'
                : 'text-[#4E3631] hover:text-[#6B0812]'
            }`}
          >
            ২.৫ বহর (সাধারণ বহর)
          </button>
        </div>
      </div>

      {/* Main Layout: Single-Column Stacked on Mobile, 12-Column Split on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7 lg:gap-8 pt-4 sm:pt-6 min-w-0">
        {/* Left/Top Column: Garment Selection & Measurement Form (Col 7 on Desktop) */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6 min-w-0">
          {/* Step 1: Select Main Outfit */}
          <div className="min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-[clamp(0.78rem,3vw,0.875rem)] font-bold text-[#2B1615]">
                ১. মূল পোশাকের ধরন নির্বাচন করুন:
              </label>

              {/* Touch-friendly Outfit Quantity Stepper */}
              <div className="inline-flex items-center gap-1.5 bg-[#FAF6F0] border border-[#E5D4BE] rounded-lg px-2 py-1">
                <span className="text-[11px] font-semibold text-[#4E3631]">সংখ্যা:</span>
                <button
                  type="button"
                  onClick={() => setOutfitCount(prev => Math.max(1, prev - 1))}
                  disabled={outfitCount <= 1}
                  className="w-6 h-6 rounded-md bg-white border border-[#DFC9AA] flex items-center justify-center text-[#6B0812] disabled:opacity-40 cursor-pointer"
                  aria-label="পোশাকের সংখ্যা কমান"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="min-w-[22px] text-center text-xs font-bold text-[#6B0812] tabular-nums">
                  {toBengaliNumber(outfitCount)}টি
                </span>
                <button
                  type="button"
                  onClick={() => setOutfitCount(prev => Math.min(10, prev + 1))}
                  className="w-6 h-6 rounded-md bg-white border border-[#DFC9AA] flex items-center justify-center text-[#6B0812] cursor-pointer"
                  aria-label="পোশাকের সংখ্যা বাড়ান"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Responsive Garment Cards Grid: 1 col at <340px, 2 cols on mobile, 3 cols on sm+ */}
            <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 min-w-0">
              {rules.map((rule) => {
                const isSelected = selectedOutfitRuleId === rule.id;
                return (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => setSelectedOutfitRuleId(rule.id)}
                    className={`w-full min-w-0 box-border p-2.5 sm:p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                      isSelected
                        ? 'border-[#6B0812] bg-[#FAF3E8] ring-1 ring-[#6B0812]/30 shadow-2xs'
                        : 'border-[#E6D7C3] bg-white hover:border-[#C5A46D]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 min-w-0">
                      <span className="text-[clamp(0.78rem,2.9vw,0.85rem)] font-bold text-[#2B1615] leading-snug break-words">
                        {rule.name}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-[#6B0812] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-[#8A5A14] block tabular-nums">
                      ভিত্তি: {toBengaliNumber(rule.baseYards)} গজ
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Additional Clothing Items */}
          <div className="min-w-0 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2">
              <label className="text-[clamp(0.78rem,3vw,0.875rem)] font-bold text-[#2B1615]">
                ২. অতিরিক্ত পোশাকের অংশ যোগ করুন (ঐচ্ছিক):
              </label>
              <span className="text-[11px] text-[#5C433E]/80">
                প্যান্ট, ওড়না, ইনার ইত্যাদি
              </span>
            </div>

            {/* Single-column on mobile so Bengali labels and touch steppers never cramp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 min-w-0">
              {additionalItems.map((item) => {
                const count = additionalSelections[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className={`w-full min-w-0 box-border p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      count > 0
                        ? 'border-[#6B0812] bg-[#FAF3E8]'
                        : 'border-[#E6D7C3] bg-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[clamp(0.78rem,2.9vw,0.85rem)] font-bold text-[#2B1615] leading-snug break-words">
                        {item.name}
                      </h4>
                      <p className="text-[11px] font-medium text-[#5C433E] tabular-nums mt-0.5">
                        প্রতিটি {toBengaliNumber(item.yardsPerUnit)} গজ
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 border border-[#DFC9AA] bg-[#FFFDF9] rounded-lg p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAdditionalItemToggle(item.id, false)}
                        disabled={count === 0}
                        className="w-7 h-7 sm:w-7 sm:h-7 flex items-center justify-center text-[#6B0812] hover:bg-[#FAF3E8] disabled:opacity-35 rounded-md cursor-pointer transition-colors"
                        aria-label={`${item.name} কমান`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="min-w-[22px] text-center text-xs sm:text-sm font-bold tabular-nums text-[#6B0812]">
                        {toBengaliNumber(count)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdditionalItemToggle(item.id, true)}
                        className="w-7 h-7 sm:w-7 sm:h-7 flex items-center justify-center text-[#6B0812] hover:bg-[#FAF3E8] rounded-md cursor-pointer transition-colors"
                        aria-label={`${item.name} যোগ করুন`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 4: Pick a Fabric to Pair */}
          <div className="min-w-0 space-y-2">
            <label className="block text-[clamp(0.78rem,3vw,0.875rem)] font-bold text-[#2B1615]">
              ৪. কোন কাপড়ে বানাতে চান? (কাপড় নির্বাচন করুন):
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 min-w-0">
              <select
                value={chosenProduct?.id || ''}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full sm:flex-1 min-w-0 min-h-[42px] box-border bg-white border border-[#DFC9AA] focus:border-[#6B0812] rounded-xl px-3 py-2 text-xs sm:text-[13px] font-medium text-[#2B1615] focus:outline-hidden"
              >
                {matchingFabrics.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} — ৳{toBengaliNumber(prod.discountPrice || prod.pricePerYard)}/গজ ({prod.fabricType})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => navigateTo('shop', { width: fabricWidth })}
                className="w-full sm:w-auto min-h-[38px] px-3.5 py-2 rounded-xl bg-[#FAF3E8] hover:bg-[#F1E4D1] border border-[#DFC9AA] text-xs font-bold text-[#6B0812] transition-colors cursor-pointer shrink-0 text-center"
              >
                সকল কাপড় দেখুন →
              </button>
            </div>
          </div>
        </div>

        {/* Right/Bottom Column: Full-Width Calculation Summary Card (Sticky only on lg+ Desktop) */}
        <div className="lg:col-span-5 min-w-0">
          <div className="w-full min-w-0 box-border bg-[#FAF6F0] p-3.5 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl border border-[#E5D4BE] lg:sticky lg:top-24 space-y-3.5 sm:space-y-4">
            {/* Summary Header */}
            <div className="flex items-center justify-between gap-2 border-b border-[#E5D4BE] pb-2.5 sm:pb-3 min-w-0">
              <h3 className="text-[clamp(0.85rem,3.2vw,0.95rem)] font-bold text-[#610710] truncate">
                পরিমাপ সারাংশ (Breakdown)
              </h3>
              <span className="text-xs px-2.5 py-0.5 bg-white border border-[#DFC9AA] text-[#6B0812] font-bold rounded-full shrink-0">
                {toBengaliNumber(fabricWidth)} বহর
              </span>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2 text-xs sm:text-[13px] min-w-0">
              {calculation.breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 text-[#3B2321] min-w-0"
                >
                  <span className="break-words min-w-0 flex-1">
                    {item.item} {item.count > 1 ? `(${toBengaliNumber(item.count)}টি)` : ''}
                  </span>
                  <span className="font-bold text-[#2B1615] tabular-nums shrink-0">
                    {toBengaliNumber(item.yards)} গজ
                  </span>
                </div>
              ))}
              {customAdjustment > 0 && (
                <div className="flex items-start justify-between gap-2 text-[#5C433E] italic min-w-0">
                  <span className="break-words min-w-0 flex-1">
                    উচ্চতা ও কাটিং অতিরিক্ত মার্জিন
                  </span>
                  <span className="font-semibold tabular-nums shrink-0">
                    +{toBengaliNumber(customAdjustment)} গজ
                  </span>
                </div>
              )}
            </div>

            {/* Grand Total Yards & Price Highlight Box */}
            <div className="w-full min-w-0 box-border p-3 sm:p-4 bg-white rounded-xl border border-[#DFC9AA] grid grid-cols-2 gap-2 items-center shadow-2xs">
              <div className="min-w-0">
                <span className="text-[11px] sm:text-xs font-medium text-[#5C433E] block">
                  মোট প্রয়োজনীয় কাপড়:
                </span>
                <span className="text-[clamp(1.15rem,4.8vw,1.5rem)] font-extrabold text-[#6B0812] tabular-nums leading-tight block mt-0.5">
                  {toBengaliNumber(calculation.totalYards)} গজ
                </span>
              </div>
              <div className="text-right min-w-0 border-l border-[#EFE3D2] pl-2">
                <span className="text-[11px] sm:text-xs font-medium text-[#5C433E] block">
                  আনুমানিক ফ্যাব্রিক খরচ:
                </span>
                <span className="text-[clamp(1.1rem,4.5vw,1.35rem)] font-extrabold text-[#B87D14] tabular-nums leading-tight block mt-0.5">
                  ৳{toBengaliNumber(estimatedCost)}
                </span>
              </div>
            </div>

            {/* Chosen Product Summary */}
            {chosenProduct && (
              <div className="w-full min-w-0 box-border text-xs text-[#4E3631] p-2.5 sm:p-3 bg-white/80 rounded-xl border border-[#E5D4BE]">
                <div className="font-bold text-[#2B1615] break-words leading-snug">
                  {chosenProduct.name}
                </div>
                <div className="text-[11px] text-[#5C433E] mt-1">
                  প্রতি গজ ৳{toBengaliNumber(chosenProduct.discountPrice || chosenProduct.pricePerYard)} · উপলব্ধ স্টক: {toBengaliNumber(chosenProduct.stockYards)} গজ
                </div>
              </div>
            )}

            {/* Touch-Friendly Full-Width Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 pt-1 min-w-0">
              <button
                type="button"
                onClick={handleAddToCartCalculated}
                className="w-full min-h-[44px] py-2.5 px-3 bg-white hover:bg-[#FAF3E8] border border-[#6B0812] text-[#6B0812] rounded-xl text-xs sm:text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs text-center"
              >
                <span>কার্টে যোগ করুন ({toBengaliNumber(calculation.totalYards)} গজ)</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNowCalculated}
                className="w-full min-h-[44px] py-2.5 px-3 bg-[#6B0812] hover:bg-[#53050D] text-white rounded-xl text-xs sm:text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-center"
              >
                <span>অর্ডার করুন (৳{toBengaliNumber(estimatedCost)})</span>
              </button>
            </div>

            {/* Bengali Disclaimer */}
            <div className="pt-2 text-[11px] text-[#5C433E]/85 leading-relaxed border-t border-[#E5D4BE] break-words">
              <span>
                এই হিসাবটি আনুমানিক। পোশাকের ডিজাইন, সাইজ ও কাটিং অনুযায়ী কাপড়ের পরিমাণ পরিবর্তিত হতে পারে।
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

