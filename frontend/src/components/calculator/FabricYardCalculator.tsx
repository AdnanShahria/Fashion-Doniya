import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { FabricWidth } from '../../types';
import { measurementService } from '../../services/measurementService';
import { toBengaliNumber } from '../../utils/fabricHelpers';
import { Plus, Minus, Check, Ruler } from 'lucide-react';

interface FabricYardCalculatorProps {
  initialWidth?: FabricWidth;
  preSelectedProductId?: string;
  isEmbedded?: boolean;
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

  const [heightFit] = useState<'standard' | 'tall' | 'petite'>('standard');
  const [bodyLengthInches] = useState<string>('44');

  const rules = useMemo(() => measurementService.getRulesByWidth(fabricWidth), [fabricWidth]);
  const additionalItems = useMemo(() => measurementService.getAdditionalItemsByWidth(fabricWidth), [fabricWidth]);

  React.useEffect(() => {
    if (rules.length > 0 && (!selectedOutfitRuleId || !rules.some(r => r.id === selectedOutfitRuleId))) {
      setSelectedOutfitRuleId(rules[0].id);
    }
  }, [rules, selectedOutfitRuleId]);

  const matchingFabrics = useMemo(() => {
    return products.filter(p => p.fabricWidth === fabricWidth && p.isActive);
  }, [products, fabricWidth]);

  const chosenProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || matchingFabrics[0];
  }, [products, selectedProductId, matchingFabrics]);

  const customAdjustment = useMemo(() => {
    let adj = 0;
    if (heightFit === 'tall') adj += 0.25;
    const lengthNum = Number(bodyLengthInches);
    if (!isNaN(lengthNum) && lengthNum > 46) adj += 0.25;
    return adj;
  }, [heightFit, bodyLengthInches]);

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
      showToast('অনুগ্রহ করে একটি কাপড় নির্বাচন করুন', 'info');
      return;
    }
    addToCart(chosenProduct, calculation.totalYards);
  };

  const handleBuyNowCalculated = () => {
    if (!chosenProduct) {
      showToast('অনুগ্রহ করে একটি কাপড় নির্বাচন করুন', 'info');
      return;
    }
    buyNow(chosenProduct, calculation.totalYards);
  };

  return (
    <div
      className={`w-full max-w-full min-w-0 box-border ${
        isEmbedded
          ? 'bg-transparent'
          : 'bg-[#FFFDF9] rounded-2xl border border-[#E5D4BE] shadow-[0_12px_36px_-14px_rgba(107,8,18,0.10)] p-4 sm:p-6 lg:p-8'
      }`}
    >
      {/* Title Header + Width Segmented Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 sm:pb-6 border-b border-[#EDE0CE] gap-3 sm:gap-4 min-w-0">
        <div className="min-w-0 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-[#8A5A10] font-extrabold text-[11px] sm:text-xs uppercase tracking-[0.12em]">
            <Ruler className="w-3.5 h-3.5" />
            <span>স্মার্ট গজ পরিমাপক</span>
          </div>
          <h3 className="text-[clamp(1.05rem,4.2vw,1.45rem)] font-extrabold text-[#6B0812] leading-snug break-words">
            কাপড়ের স্বয়ংক্রিয় গজ ক্যালকুলেটর
          </h3>
          <p className="text-xs sm:text-sm text-[#523A35] leading-relaxed break-words">
            আপনার পোশাকের ধরন ও বহর নির্বাচন করুন, প্রয়োজনীয় নিখুঁত গজের হিসাব পেয়ে যান নিমেষেই।
          </p>
        </div>

        {/* Width Segmented Switcher */}
        <div
          role="tablist"
          aria-label="কাপড়ের বহর নির্বাচন"
          className="w-full md:w-auto grid grid-cols-2 md:inline-flex items-center gap-1 p-1.5 bg-[#FAF6F0] border border-[#E2D0B8] rounded-2xl shrink-0 box-border"
        >
          <button
            type="button"
            role="tab"
            aria-selected={fabricWidth === '3.5'}
            onClick={() => {
              setFabricWidth('3.5');
              setAdditionalSelections({});
            }}
            className={`min-h-[42px] px-3 sm:px-4 py-1.5 rounded-xl transition-all cursor-pointer text-center leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] ${
              fabricWidth === '3.5'
                ? 'bg-[#6B0812] text-white shadow-[0_4px_12px_rgba(107,8,18,0.22)]'
                : 'text-[#523A35] hover:text-[#6B0812] hover:bg-[#FFFDF9]/80'
            }`}
          >
            <span className="block text-xs sm:text-[13px] font-bold">৩.৫ বহর (বড় বহর)</span>
            <span className={`block text-[10.5px] font-medium mt-0.5 ${fabricWidth === '3.5' ? 'text-[#FAF5EC]/85' : 'text-[#6E5750]'}`}>
              ৫৬–৬০ ইঞ্চি প্রস্থ
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={fabricWidth === '2.5'}
            onClick={() => {
              setFabricWidth('2.5');
              setAdditionalSelections({});
            }}
            className={`min-h-[42px] px-3 sm:px-4 py-1.5 rounded-xl transition-all cursor-pointer text-center leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] ${
              fabricWidth === '2.5'
                ? 'bg-[#6B0812] text-white shadow-[0_4px_12px_rgba(107,8,18,0.22)]'
                : 'text-[#523A35] hover:text-[#6B0812] hover:bg-[#FFFDF9]/80'
            }`}
          >
            <span className="block text-xs sm:text-[13px] font-bold">২.৫ বহর (সাধারণ বহর)</span>
            <span className={`block text-[10.5px] font-medium mt-0.5 ${fabricWidth === '2.5' ? 'text-[#FAF5EC]/85' : 'text-[#6E5750]'}`}>
              ৪২–৪৪ ইঞ্চি প্রস্থ
            </span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7 lg:gap-8 pt-4 sm:pt-6 min-w-0">
        {/* Left Column: Garment Selection & Measurement Form */}
        <div className="lg:col-span-7 space-y-5 sm:space-y-6 min-w-0">
          {/* Step 1: Select Main Outfit */}
          <div className="min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs sm:text-sm font-bold text-[#241614]">
                ১. মূল পোশাকের ধরন নির্বাচন করুন:
              </label>

              {/* Touch-friendly Outfit Quantity Stepper */}
              <div className="inline-flex items-center gap-2 bg-[#FAF6F0] border border-[#DFCBB2] rounded-xl px-2.5 py-1">
                <span className="text-xs font-semibold text-[#523A35]">সংখ্যা:</span>
                <button
                  type="button"
                  onClick={() => setOutfitCount(prev => Math.max(1, prev - 1))}
                  disabled={outfitCount <= 1}
                  className="w-8 h-8 rounded-lg bg-[#FFFDF9] border border-[#DFC9AA] hover:border-[#8A5A10] flex items-center justify-center text-[#6B0812] disabled:opacity-40 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
                  aria-label="পোশাকের সংখ্যা কমান"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="min-w-[26px] text-center text-xs sm:text-sm font-bold text-[#6B0812] tabular-nums">
                  {toBengaliNumber(outfitCount)}টি
                </span>
                <button
                  type="button"
                  onClick={() => setOutfitCount(prev => Math.min(10, prev + 1))}
                  className="w-8 h-8 rounded-lg bg-[#FFFDF9] border border-[#DFC9AA] hover:border-[#8A5A10] flex items-center justify-center text-[#6B0812] cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
                  aria-label="পোশাকের সংখ্যা বাড়ান"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 min-w-0">
              {rules.map((rule) => {
                const isSelected = selectedOutfitRuleId === rule.id;
                return (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => setSelectedOutfitRuleId(rule.id)}
                    className={`w-full min-w-0 min-h-[60px] box-border p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] ${
                      isSelected
                        ? 'border-[#6B0812] bg-[#FAF3E8] ring-1 ring-[#6B0812]/25 shadow-[0_4px_12px_-6px_rgba(107,8,18,0.20)]'
                        : 'border-[#E6D7C3] bg-[#FFFDF9] hover:border-[#C59B48]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 min-w-0">
                      <span className="text-xs sm:text-[13.5px] font-bold text-[#241614] leading-snug break-words">
                        {rule.name}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-[#6B0812] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-[#8A5A10] block tabular-nums">
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
              <label className="text-xs sm:text-sm font-bold text-[#241614]">
                ২. অতিরিক্ত পোশাকের অংশ যোগ করুন (ঐচ্ছিক):
              </label>
              <span className="text-xs text-[#523A35]">
                প্যান্ট, ওড়না, ইনার ইত্যাদি
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 min-w-0">
              {additionalItems.map((item) => {
                const count = additionalSelections[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className={`w-full min-w-0 box-border p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                      count > 0
                        ? 'border-[#6B0812] bg-[#FAF3E8]'
                        : 'border-[#E6D7C3] bg-[#FFFDF9]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-[13.5px] font-bold text-[#241614] leading-snug break-words">
                        {item.name}
                      </h4>
                      <p className="text-[11px] font-medium text-[#523A35] tabular-nums mt-0.5">
                        প্রতিটি {toBengaliNumber(item.yardsPerUnit)} গজ
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 border border-[#DFC9AA] bg-[#FFFDF9] rounded-xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAdditionalItemToggle(item.id, false)}
                        disabled={count === 0}
                        className="w-8 h-8 flex items-center justify-center text-[#6B0812] hover:bg-[#FAF3E8] disabled:opacity-35 rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
                        aria-label={`${item.name} কমান`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="min-w-[24px] text-center text-xs sm:text-sm font-bold tabular-nums text-[#6B0812]">
                        {toBengaliNumber(count)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdditionalItemToggle(item.id, true)}
                        className="w-8 h-8 flex items-center justify-center text-[#6B0812] hover:bg-[#FAF3E8] rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
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

          {/* Step 3: Pick a Fabric to Pair */}
          <div className="min-w-0 space-y-2">
            <label htmlFor="calc-fabric-select" className="block text-xs sm:text-sm font-bold text-[#241614]">
              ৩. কোন কাপড়ে বানাতে চান? (কাপড় নির্বাচন করুন):
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 min-w-0">
              <select
                id="calc-fabric-select"
                value={chosenProduct?.id || ''}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full sm:flex-1 min-w-0 min-h-[44px] box-border bg-[#FFFDF9] border border-[#DFC9AA] focus:border-[#6B0812] rounded-xl px-3.5 py-2 text-xs sm:text-[13px] font-medium text-[#241614] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
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
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-[#FAF3E8] hover:bg-[#F1E3CE] border border-[#DFC9AA] text-xs font-bold text-[#6B0812] transition-colors cursor-pointer shrink-0 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
              >
                সকল কাপড় দেখুন →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Bespoke Atelier Measurement Summary Card */}
        <div className="lg:col-span-5 min-w-0">
          <div className="w-full min-w-0 box-border bg-[#FAF6F0] p-4 sm:p-5 lg:p-6 rounded-2xl border border-[#E2D0B8] shadow-[0_6px_20px_-10px_rgba(36,22,20,0.08)] lg:sticky lg:top-28 space-y-4">
            {/* Summary Header */}
            <div className="flex items-center justify-between gap-2 border-b border-[#E2D0B8] pb-3 min-w-0">
              <h4 className="text-sm sm:text-base font-extrabold text-[#6B0812] truncate">
                পরিমাপ সারাংশ (Breakdown)
              </h4>
              <span className="text-xs px-2.5 py-1 bg-[#FFFDF9] border border-[#DFC9AA] text-[#6B0812] font-bold rounded-full shrink-0 tabular-nums">
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
                  <span className="font-bold text-[#241614] tabular-nums shrink-0">
                    {toBengaliNumber(item.yards)} গজ
                  </span>
                </div>
              ))}
              {customAdjustment > 0 && (
                <div className="flex items-start justify-between gap-2 text-[#523A35] italic min-w-0">
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
            <div className="w-full min-w-0 box-border p-3.5 sm:p-4 bg-[#FFFDF9] rounded-xl border border-[#DFC9AA] grid grid-cols-2 gap-3 items-center shadow-2xs">
              <div className="min-w-0">
                <span className="text-[11px] sm:text-xs font-medium text-[#523A35] block">
                  মোট প্রয়োজনীয় কাপড়:
                </span>
                <span className="text-[clamp(1.2rem,4.8vw,1.55rem)] font-extrabold text-[#6B0812] tabular-nums leading-tight block mt-0.5">
                  {toBengaliNumber(calculation.totalYards)} গজ
                </span>
              </div>
              <div className="text-right min-w-0 border-l border-[#EDE0CE] pl-3">
                <span className="text-[11px] sm:text-xs font-medium text-[#523A35] block">
                  আনুমানিক ফ্যাব্রিক খরচ:
                </span>
                <span className="text-[clamp(1.15rem,4.5vw,1.4rem)] font-extrabold text-[#8A5A10] tabular-nums leading-tight block mt-0.5">
                  ৳{toBengaliNumber(estimatedCost)}
                </span>
              </div>
            </div>

            {/* Chosen Product Summary */}
            {chosenProduct && (
              <div className="w-full min-w-0 box-border text-xs text-[#523A35] p-3 bg-[#FFFDF9]/90 rounded-xl border border-[#E5D4BE]">
                <div className="font-bold text-[#241614] break-words leading-snug">
                  {chosenProduct.name}
                </div>
                <div className="text-[11px] text-[#523A35] mt-1 tabular-nums">
                  প্রতি গজ ৳{toBengaliNumber(chosenProduct.discountPrice || chosenProduct.pricePerYard)} · উপলব্ধ স্টক: {toBengaliNumber(chosenProduct.stockYards)} গজ
                </div>
              </div>
            )}

            {/* Touch-Friendly Action Buttons (44px+ height) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 pt-1 min-w-0">
              <button
                type="button"
                onClick={handleAddToCartCalculated}
                className="w-full min-h-[44px] py-2.5 px-3 bg-[#FFFDF9] hover:bg-[#FAF3E8] active:scale-[0.99] border border-[#6B0812] text-[#6B0812] rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
              >
                <span>কার্টে যোগ করুন ({toBengaliNumber(calculation.totalYards)} গজ)</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNowCalculated}
                className="w-full min-h-[44px] py-2.5 px-3 bg-gradient-to-b from-[#7D0A15] to-[#63060F] hover:from-[#8C0C18] hover:to-[#53050D] active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_6px_16px_-4px_rgba(107,8,18,0.32),inset_0_1px_0_rgba(255,255,255,0.18)] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
              >
                <span>অর্ডার করুন (৳{toBengaliNumber(estimatedCost)})</span>
              </button>
            </div>

            {/* Bengali Disclaimer */}
            <div className="pt-2 text-[11px] text-[#523A35] leading-relaxed border-t border-[#E2D0B8] break-words">
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
