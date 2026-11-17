import React from 'react';
import { FabricYardCalculator } from '../components/calculator/FabricYardCalculator';
import { useStore } from '../context/StoreContext';
import { ArrowRight } from 'lucide-react';

const REFERENCE_CHART_ROWS = [
  {
    garment: 'কামিজ / কুর্তি',
    w35: '২.০ গজ',
    w25: '২.৫ গজ',
    tip: '৩.৫ বহরে সাইড জোড়া ছাড়াই ফুল ঘের তৈরি হয়।'
  },
  {
    garment: 'শর্ট কামিজ',
    w35: '১.৫ গজ',
    w25: '২.৫ গজ',
    tip: 'স্মার্ট ক্যাজুয়াল কুর্তি বা টপস।'
  },
  {
    garment: 'লং কটি',
    w35: '৩.৫ গজ',
    w25: '৪.৫ গজ',
    tip: '৩.৫ বহরে ১ গজ কম কাপড় লাগে।'
  },
  {
    garment: 'পার্টি গাউন / লেহেঙ্গা',
    w35: '৩.৫ গজ',
    w25: '৪.৫ গজ',
    tip: 'বিশাল ঘেরের আমব্রেলা কাটিংয়ের জন্য ৩.৫ বহর সেরা।'
  },
  {
    garment: 'প্যান্ট / সালোয়ার',
    w35: '২.০ গজ',
    w25: '২.৫ গজ',
    tip: 'প্লাজো বা সিগারেট প্যান্ট।'
  },
  {
    garment: 'ওড়না / দোপাট্টা',
    w35: '২.৫ গজ',
    w25: '২.৫ গজ',
    tip: 'স্ট্যান্ডার্ড মাপের নামাজি বা ক্যাজুয়াল ওড়না।'
  }
];

export const CalculatorPage: React.FC = () => {
  const { navigateTo } = useStore();

  return (
    <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 py-5 sm:py-10 space-y-6 sm:space-y-12 min-w-0 box-border overflow-x-hidden">
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2 sm:space-y-3 px-1">
        <div className="inline-flex items-center px-3 py-1 bg-[#C5A46D]/15 text-[#B87D14] rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider">
          <span>স্মার্ট ফেব্রিক মেজারমেন্ট টুল</span>
        </div>
        <h1 className="text-[clamp(1.25rem,5.2vw,2.25rem)] font-extrabold text-[#610710] leading-snug break-words">
          পোশাকের গজ ও বহর হিসাব ক্যালকুলেটর
        </h1>
        <p className="text-[clamp(0.75rem,2.9vw,0.875rem)] text-[#4E3631]/85 leading-relaxed break-words">
          কাপড় কেনার আগে আর আন্দাজে অনুমান করতে হবে না। আপনার পোশাকের ধরন, বহর এবং অতিরিক্ত অংশ (প্যান্ট, ওড়না, ইনার) নির্বাচন করুন—ক্যালকুলেটর স্বয়ংক্রিয়ভাবে নির্ভুল গজ হিসেব করে দেবে।
        </p>
      </div>

      {/* Main Interactive Calculator */}
      <FabricYardCalculator />

      {/* Reference Comparison Chart (৩.৫ বহর বনাম ২.৫ বহর) */}
      <div className="w-full min-w-0 box-border bg-white rounded-xl sm:rounded-2xl border border-[#EDE5D9] p-3.5 sm:p-8 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 border-b border-[#EDE5D9] pb-3.5 sm:pb-4 min-w-0">
          <div className="min-w-0">
            <h2 className="text-[clamp(1rem,4vw,1.25rem)] font-bold text-[#610710] leading-snug break-words">
              বহর ভিত্তিক প্রমিত গজ মাপের রেফারেন্স চার্ট
            </h2>
            <p className="text-xs text-[#5C433E] mt-0.5">
              অভিজ্ঞ টেইলার মাস্টারদের নির্দেশিকা অনুযায়ী প্রস্তুতকৃত
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('measurement-guide')}
            className="text-xs text-[#6B0812] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>পূর্ণাঙ্গ মাপ গাইড দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Stacked Cards (< sm) - Zero Horizontal Scroll */}
        <div className="sm:hidden grid grid-cols-1 gap-2.5 min-w-0">
          {REFERENCE_CHART_ROWS.map((row) => (
            <div
              key={row.garment}
              className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5D4BE] space-y-2 min-w-0"
            >
              <div className="font-bold text-sm text-[#2B1615]">{row.garment}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-[#E5D4BE]">
                  <span className="text-[10px] text-[#5C433E] block">৩.৫ বহর (৫৬-৬০ ইঞ্চি)</span>
                  <span className="font-extrabold text-[#6B0812] text-sm">{row.w35}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-[#E5D4BE]">
                  <span className="text-[10px] text-[#5C433E] block">২.৫ বহর (৪২-৪৪ ইঞ্চি)</span>
                  <span className="font-bold text-[#2B1615] text-sm">{row.w25}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#4E3631] leading-snug">{row.tip}</p>
            </div>
          ))}
        </div>

        {/* Desktop & Tablet Table (sm+) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F4] text-[#242424] font-bold border-b border-[#EDE5D9]">
                <th className="p-3">পোশাকের ধরন</th>
                <th className="p-3 text-center">৩.৫ বহর (৫৬-৬০ ইঞ্চি)</th>
                <th className="p-3 text-center">২.৫ বহর (৪২-৪৪ ইঞ্চি)</th>
                <th className="p-3">বিশেষ সুবিধা ও টিপস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE5D9] text-[#242424]/80">
              {REFERENCE_CHART_ROWS.map((row) => (
                <tr key={row.garment}>
                  <td className="p-3 font-semibold text-[#242424]">{row.garment}</td>
                  <td className="p-3 text-center font-bold text-[#6B0812] tabular-nums">{row.w35}</td>
                  <td className="p-3 text-center font-bold tabular-nums">{row.w25}</td>
                  <td className="p-3 text-[11px]">{row.tip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 sm:p-4 bg-[#FAF8F4] rounded-xl border border-[#EDE5D9] text-xs text-[#3B2321]">
          <p className="leading-relaxed break-words">
            <strong>বিশেষ নোট:</strong> গ্রাহকের উচ্চতা ৫ ফুট ৫ ইঞ্চির বেশি হলে অথবা বডি সাইজ ৪২ ইঞ্চির বেশি হলে অতিরিক্ত ০.২৫ গজ কাপড় নেওয়া নিরাপদ।
          </p>
        </div>
      </div>
    </div>
  );
};

