import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { HelpCircle, ChevronDown, Calculator, ArrowRight } from 'lucide-react';

export const FaqPage: React.FC = () => {
  const { navigateTo, settings } = useStore();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const contentCfg = settings.contentConfig;

  const defaultFaqs = [
    {
      q: '৩.৫ বহর ও ২.৫ বহর কাপড়ের মধ্যে পার্থক্য কী?',
      a: 'বহর বলতে কাপড়ের প্রস্থ (Width) বোঝায়। ২.৫ বহর কাপড়ের প্রস্থ সাধারণত ৪২ থেকে ৪৪ ইঞ্চি হয়ে থাকে, যা কামিজ বা কুর্তি তৈরিতে স্ট্যান্ডার্ড। অন্যদিকে ৩.৫ বহরের প্রস্থ ৫৬ থেকে ৬০ ইঞ্চি (অনেক সময় ৬৫ ইঞ্চি পর্যন্ত) হয়। ৩.৫ বহরের কাপড়ে কোনো সাইড জোড়া দেওয়া ছাড়াই বিশাল ঘেরের পার্টি গাউন, লং কটি, কিংবা মাত্র ২ গজে ফুল সাইজ কামিজ তৈরি করা যায়।'
    },
    {
      q: 'আমি কি ১.৫ বা ২.৫ গজের মতো ভগ্নাংশ গজ কিনতে পারব?',
      a: 'হ্যাঁ, অবশ্যই! Fashion Doniya BD এর অন্যতম প্রধান সুবিধা হলো আপনি আপনার নিখুঁত প্রয়োজন অনুযায়ী ০.৫ গজ বৃদ্ধির ভিত্তিতে ভগ্নাংশ গজ অর্ডার করতে পারেন। এতে আপনার বাড়তি টাকা খরচ হবে না এবং কাপড়ের অপচয়ও রোধ হবে।'
    },
    {
      q: 'একটি স্ট্যান্ডার্ড কামিজের জন্য কত গজ কাপড় লাগবে?',
      a: 'যদি আপনি ৩.৫ বহরের কাপড় নেন, তবে বেশিরভাগ প্রাপ্তবয়স্ক নারীর জন্য মাত্র ২.০ গজ কাপড়েই কামিজ হয়ে যাবে। কিন্তু ২.৫ বহরের কাপড় হলে সাধারণত ২.৫ গজ কাপড় প্রয়োজন হবে। উচ্চতা ৫ ফুট ৫ ইঞ্চির বেশি হলে অতিরিক্ত ০.২৫ গজ নেওয়া উচিত।'
    },
    {
      q: 'ডেলিভারি চার্জ কত এবং কতদিনে পাব?',
      a: `ঢাকা সিটির ভেতরে ডেলিভারি চার্জ ${settings.insideDhakaDeliveryFee} টাকা এবং ২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়। ঢাকার বাইরে ডেলিভারি চার্জ ${settings.outsideDhakaDeliveryFee} টাকা এবং ২ থেকে ৩ কার্যদিবসের মধ্যে কুরিয়ারের মাধ্যমে পৌঁছায়। মোট ${settings.freeDeliveryThreshold || 2500} টাকার বেশি কেনাকাটায় ডেলিভারি সম্পূর্ণ ফ্রি।`
    },
    {
      q: 'পণ্য পছন্দ না হলে কি রিটার্ন করা যাবে?',
      a: 'পণ্য হাতে পাওয়ার পর যদি কাপড়ে কোনো ডিফেক্ট, ভুল রং বা মাপের ত্রুটি থাকে, তবে ডেলিভারি ম্যান থাকা অবস্থায় বা ৪৮ ঘণ্টার মধ্যে আমাদের হেল্পলাইনে জানালে আমরা সম্পূর্ণ ফ্রিতে এক্সচেঞ্জ বা সমাধান করে থাকি।'
    },
    {
      q: 'ক্যাশ অন ডেলিভারিতে কি অর্ডার করা যাবে?',
      a: 'হ্যাঁ, আমাদের সকল অর্ডারে সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। কাপড় হাতে পেয়ে দেখে তারপর মূল্য পরিশোধ করবেন।'
    }
  ];

  const activeConfigFaqs = contentCfg?.faqs
    ? contentCfg.faqs
        .filter((f) => f.isActive !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((f) => ({ q: f.question || f.q, a: f.answer || f.a }))
    : null;

  const faqs = activeConfigFaqs && activeConfigFaqs.length > 0 ? activeConfigFaqs : defaultFaqs;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#C5A46D]">
          {contentCfg?.faqEyebrow || 'সচরাচর জিজ্ঞাসিত প্রশ্ন'}
        </span>
        <h1 className="text-3xl font-extrabold text-[#242424]">
          {contentCfg?.faqTitle || 'সাধারণ প্রশ্নোত্তর (FAQ)'}
        </h1>
        <p className="text-xs sm:text-sm text-[#242424]/70">
          {contentCfg?.faqSubtitle || 'বহর নির্বাচন, গজ মাপ, ডেলিভারি ও পেমেন্ট সম্পর্কিত সব সাধারণ প্রশ্নের উত্তর জেনে নিন।'}
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-[#EDE5D9] overflow-hidden transition-all shadow-xs"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-[#242424] hover:bg-[#FAF8F4] transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-[#C5A46D] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-[#242424]/75 leading-relaxed border-t border-[#EDE5D9]/60 bg-[#FAF8F4]/50">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Calculator promo */}
      <div className="p-6 bg-[#FAF8F4] rounded-xl border border-[#EDE5D9] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-[#242424]">সঠিক গজ মাপ নিজে হিসেব করতে চান?</h4>
          <p className="text-xs text-[#242424]/60">আমাদের স্বয়ংক্রিয় গজ ক্যালকুলেটর ব্যবহার করুন।</p>
        </div>
        <button
          onClick={() => navigateTo('calculator')}
          className="px-5 py-2.5 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>ক্যালকুলেটর খুলুন</span>
        </button>
      </div>

    </div>
  );
};
