import React, { useState } from 'react';
import { X, Check, Sparkles, ShieldCheck, Eye, ArrowLeft } from 'lucide-react';
import { AddonFabricOption } from '../../types';

interface AddonFabricCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  addonId: string;
  addonName: string;
  addonTemplateImage?: string;
  yardsPerUnit: number;
  fabrics: AddonFabricOption[];
  selectedFabricId: string | null;
  onSelectFabric: (fabric: AddonFabricOption) => void;
  toBengaliNumber: (val: number | string) => string;
}

export const AddonFabricCollectionModal: React.FC<AddonFabricCollectionModalProps> = ({
  isOpen,
  onClose,
  addonName,
  addonTemplateImage,
  yardsPerUnit,
  fabrics,
  selectedFabricId,
  onSelectFabric,
  toBengaliNumber
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [previewFabric, setPreviewFabric] = useState<AddonFabricOption | null>(null);

  if (!isOpen) return null;

  // Unique fabric types for filtering
  const fabricTypes = Array.from(new Set(fabrics.map((f) => f.fabricType).filter(Boolean)));

  const filteredFabrics = fabrics.filter((f) => {
    if (filterType === 'all') return true;
    return f.fabricType === filterType;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="addon-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        className="bg-[#FAF8F4] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-[#DFC9AA] flex flex-col overflow-hidden text-[#1C1B19]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#DFC9AA]/70 bg-white flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF3E8] border border-[#DFC9AA] text-[11px] font-bold text-[#850B1B]">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>ফেব্রিক প্রোডাক্ট কালেকশন</span>
            </div>
            <h3 id="addon-modal-title" className="text-base sm:text-lg font-bold text-[#1C1B19] leading-snug">
              {previewFabric ? previewFabric.name : `${addonName} এর প্রোডাক্ট কালেকশন`}
            </h3>
            <p className="text-xs text-[#5C433E]/85">
              {previewFabric
                ? `${addonName} তৈরির জন্য প্রিমিয়াম ফেব্রিক প্রোডাক্ট ডিটেইলস`
                : `আপনার পছন্দের প্রোডাক্ট বেছে নিন · প্রতি ${toBengaliNumber(yardsPerUnit)} গজের প্রয়োজন অনুযায়ী মূল্য হিসাব হবে`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#DFC9AA] bg-[#FAF8F4] hover:bg-[#FAF3E8] flex items-center justify-center text-[#1C1B19]/70 hover:text-[#850B1B] cursor-pointer transition-colors shrink-0"
            aria-label="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {previewFabric ? (
          /* Single Product Detail View inside Modal */
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            <button
              type="button"
              onClick={() => setPreviewFabric(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#DFC9AA] text-xs font-bold text-[#850B1B] hover:bg-[#FAF3E8] cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>সকল প্রোডাক্ট তালিকায় ফিরে যান</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-white p-4 rounded-xl border border-[#DFC9AA]">
              <div className="sm:col-span-5 aspect-[3/4] rounded-xl overflow-hidden border border-[#E6D7C3] bg-[#FAF3E8] relative">
                <img
                  src={previewFabric.image || addonTemplateImage}
                  alt={previewFabric.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="sm:col-span-7 flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#FAF3E8] border border-[#DFC9AA] text-[#850B1B]">
                      {previewFabric.fabricType}
                    </span>
                    {previewFabric.isDefault && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        জনপ্রিয় প্রোডাক্ট
                      </span>
                    )}
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-[#1C1B19] leading-snug">
                    {previewFabric.name}
                  </h4>

                  {previewFabric.color && (
                    <div className="flex items-center gap-2 text-xs text-[#5C433E]">
                      {previewFabric.colorHex && (
                        <span
                          className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: previewFabric.colorHex }}
                        />
                      )}
                      <span>
                        রং: <strong className="text-[#1C1B19]">{previewFabric.color}</strong>
                      </span>
                    </div>
                  )}

                  {previewFabric.description && (
                    <p className="text-xs text-[#5C433E] leading-relaxed bg-[#FAF8F4] p-3 rounded-lg border border-[#DFC9AA]/50">
                      {previewFabric.description}
                    </p>
                  )}

                  <div className="p-3 rounded-lg bg-[#FAF3E8]/70 border border-[#DFC9AA] space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-[#5C433E]">প্রতি গজের মূল্য:</span>
                      <span className="text-sm font-bold text-[#850B1B]">
                        ৳{toBengaliNumber(previewFabric.pricePerYard)} / গজ
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-[#5C433E]">প্রয়োজনীয় পরিমাণ ({addonName}):</span>
                      <span className="text-xs font-bold text-[#1C1B19]">
                        {toBengaliNumber(yardsPerUnit)} গজ
                      </span>
                    </div>
                    <div className="pt-1 border-t border-[#DFC9AA]/60 flex items-baseline justify-between">
                      <span className="text-xs font-bold text-[#1C1B19]">মোট প্রোডাক্ট মূল্য:</span>
                      <span className="text-base font-extrabold text-[#850B1B]">
                        ৳{toBengaliNumber(Math.round(previewFabric.pricePerYard * yardsPerUnit))}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectFabric(previewFabric)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#850B1B] hover:bg-[#6B0812] text-white text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>এই প্রোডাক্টটি নির্বাচন করুন</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Filter Chips if multiple fabric types */}
            {fabricTypes.length > 1 && (
              <div className="px-4 py-2.5 bg-[#FAF3E8]/60 border-b border-[#DFC9AA]/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-semibold text-[#5C433E] shrink-0">ফিল্টার:</span>
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-[#850B1B] text-white shadow-2xs'
                      : 'bg-white text-[#1C1B19] border border-[#DFC9AA] hover:bg-[#FAF3E8]'
                  }`}
                >
                  সকল প্রোডাক্ট ({toBengaliNumber(fabrics.length)})
                </button>
                {fabricTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterType(type)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                      filterType === type
                        ? 'bg-[#850B1B] text-white shadow-2xs'
                        : 'bg-white text-[#1C1B19] border border-[#DFC9AA] hover:bg-[#FAF3E8]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {/* Fabrics Grid */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {filteredFabrics.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-[#DFC9AA]/60 text-xs text-[#5C433E]">
                  কোনো প্রোডাক্ট পাওয়া যায়নি।
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredFabrics.map((fabric) => {
                    const isSelected = selectedFabricId === fabric.id;
                    const totalCostForAddon = Math.round(fabric.pricePerYard * yardsPerUnit);

                    return (
                      <div
                        key={fabric.id}
                        onClick={() => setPreviewFabric(fabric)}
                        className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left group ${
                          isSelected
                            ? 'border-[#850B1B] bg-[#FFFBF7] shadow-sm ring-1 ring-[#850B1B]'
                            : 'border-[#DFC9AA]/80 bg-white hover:border-[#850B1B]/60 hover:bg-[#FAF3E8]/40'
                        }`}
                      >
                        {/* Top Row: Thumbnail + Info */}
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-20 rounded-lg overflow-hidden border border-[#DFC9AA] bg-[#FAF8F4] shrink-0 relative">
                            <img
                              src={fabric.image || addonTemplateImage}
                              alt={fabric.name}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {fabric.colorHex && (
                              <div
                                className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                                style={{ backgroundColor: fabric.colorHex }}
                                title={fabric.color}
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#FAF3E8] border border-[#DFC9AA] text-[#850B1B]">
                                {fabric.fabricType}
                              </span>
                              {fabric.isDefault && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  জনপ্রিয়
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs sm:text-[13px] font-bold text-[#1C1B19] group-hover:text-[#850B1B] transition-colors leading-snug">
                              {fabric.name}
                            </h4>

                            {fabric.color && (
                              <p className="text-[11px] text-[#5C433E]/85">
                                রং: <span className="font-medium text-[#1C1B19]">{fabric.color}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Description if present */}
                        {fabric.description && (
                          <p className="text-[11px] text-[#5C433E]/90 line-clamp-2 leading-relaxed bg-[#FAF8F4] p-1.5 rounded-md border border-[#DFC9AA]/40">
                            {fabric.description}
                          </p>
                        )}

                        {/* Price & Selection Footer */}
                        <div className="pt-2 border-t border-[#DFC9AA]/50 flex items-center justify-between gap-2">
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs sm:text-sm font-extrabold text-[#850B1B] tabular-nums">
                                ৳{toBengaliNumber(fabric.pricePerYard)}
                              </span>
                              <span className="text-[10px] text-[#5C433E]/80 font-medium">/ গজ</span>
                            </div>
                            <p className="text-[10px] text-[#5C433E]/75">
                              {toBengaliNumber(yardsPerUnit)} গজে মোট ৳{toBengaliNumber(totalCostForAddon)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewFabric(fabric);
                              }}
                              className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-white hover:bg-[#FAF3E8] text-[#5C433E] border border-[#DFC9AA] flex items-center gap-1 cursor-pointer transition-colors"
                              title="প্রোডাক্ট বিস্তারিত দেখুন"
                            >
                              <Eye className="w-3 h-3 text-[#850B1B]" />
                              <span>দেখুন</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectFabric(fabric);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-[#850B1B] text-white shadow-2xs'
                                  : 'bg-[#FAF3E8] hover:bg-[#850B1B] text-[#850B1B] hover:text-white border border-[#DFC9AA]'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>নির্বাচিত</span>
                                </>
                              ) : (
                                <span>বেছে নিন</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer info notice */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#DFC9AA]/70 flex flex-wrap items-center justify-between gap-2.5 text-xs text-[#5C433E]">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>১০০% আসল কাপড় ও আপনার মূল পোশাকের রঙের সাথে নিখুঁত ম্যাচিং করে দেওয়া হবে</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#850B1B] hover:bg-[#6B0812] text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
};
