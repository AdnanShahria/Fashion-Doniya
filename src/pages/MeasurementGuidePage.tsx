import React from 'react';
import { useStore } from '../context/StoreContext';
import { Ruler, Scissors, Calculator, CheckCircle2, ArrowRight } from 'lucide-react';

export const MeasurementGuidePage: React.FC = () => {
  const { navigateTo } = useStore();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      
      {/* Intro */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-[#C5A46D]">
          টেইলারিং নির্দেশিকা
        </span>
        <h1 className="text-3xl font-extrabold text-[#242424]">
          কাপড়ের বহর ও গজ মাপের পূর্ণাঙ্গ গাইড
        </h1>
        <p className="text-xs sm:text-sm text-[#242424]/75">
          সঠিক পোশাক তৈরিতে কাপড়ের বহর ও পরিমাপের খুঁটিনাটি জেনে নিন।
        </p>
      </div>

      {/* Section 1: Bahor Explanation */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EDE5D9] shadow-sm space-y-4 text-xs sm:text-sm text-[#242424]/80 leading-relaxed">
        <h2 className="text-lg font-bold text-[#242424] flex items-center gap-2">
          <Ruler className="w-5 h-5 text-[#C5A46D]" />
          <span>১. কাপড়ের বহর (Width) কী এবং কেন গুরুত্বপূর্ণ?</span>
        </h2>
        <p>
          কাপড়ের বহর হলো থানের প্রস্থের মাপ। সাধারণ ভাষায়:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#242424]">
          <li><strong>২.৫ বহর:</strong> কাপড়ের প্রস্থ ৪২ থেকে ৪৪ ইঞ্চি। এতে কামিজ বা সাধারণ সোজা কাটিংয়ের পোশাক তৈরিতে আড়াই (২.৫) গজ লাগে।</li>
          <li><strong>৩.৫ বহর:</strong> কাপড়ের প্রস্থ ৫৬ থেকে ৬০ ইঞ্চি। এটি বড় বহর হওয়ায় মাত্র ২ গজে ফুল সাইজ কামিজ এবং ৩.৫ গজে ফুল ঘেরের গাউন বানানো সম্ভব। কোনো ধরনের সাইড জোড়া (কলি) দিতে হয় না।</li>
        </ul>
      </div>

      {/* Section 2: Step by Step Body Measurement */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EDE5D9] shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-[#242424] flex items-center gap-2">
          <Scissors className="w-5 h-5 text-[#C5A46D]" />
          <span>২. ঘরে বসে সহজে শরীরের মাপ নেওয়ার নিয়ম</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#242424]/80">
          <div className="p-4 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] space-y-1">
            <span className="font-bold text-[#242424] block">১. ঝুলের মাপ (Length):</span>
            <p>কাঁধের উঁচু অংশ থেকে শুরু করে পায়ের গোড়ালি বা হাঁটু পর্যন্ত যেখানে পোশাক শেষ করতে চান সেই পর্যন্ত মাপুন।</p>
          </div>

          <div className="p-4 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] space-y-1">
            <span className="font-bold text-[#242424] block">২. বডির মাপ (Chest / Bust):</span>
            <p>বুকের সবচেয়ে প্রশস্ত অংশের চারিদিকে ইঞ্চি ফিতা দিয়ে আলতোভাবে মাপুন। ফিতা যেন খুব টানটান না থাকে।</p>
          </div>

          <div className="p-4 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] space-y-1">
            <span className="font-bold text-[#242424] block">৩. কোমরের মাপ (Waist):</span>
            <p>নাভির ঠিক উপরে শরীরের স্বাভাবিক বাঁকে কোমর মাপুন।</p>
          </div>

          <div className="p-4 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] space-y-1">
            <span className="font-bold text-[#242424] block">৪. হাতার লম্বা (Sleeve Length):</span>
            <p>কাঁধের জোড়া থেকে কব্জি বা কনুই পর্যন্ত আপনার পছন্দের স্টাইল অনুযায়ী মাপুন।</p>
          </div>
        </div>
      </div>

      {/* Direct CTA */}
      <div className="p-6 bg-[#242424] text-white rounded-xl flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">অনলাইনে সরাসরি গজ হিসাব করুন</h3>
          <p className="text-xs text-[#EDE5D9]/70">আমাদের গজ ক্যালকুলেটরে এক ক্লিকে ফলাফল জানুন।</p>
        </div>
        <button
          onClick={() => navigateTo('calculator')}
          className="px-5 py-2.5 bg-[#C5A46D] hover:bg-[#b08e57] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          ক্যালকুলেটর ব্যবহার করুন
        </button>
      </div>

    </div>
  );
};
