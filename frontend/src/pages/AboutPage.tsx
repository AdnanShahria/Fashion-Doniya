import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, ShieldCheck, Heart, Award, ArrowRight, Truck } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { navigateTo, settings } = useStore();
  const about = settings.contentConfig?.aboutPage;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      
      {/* Hero */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[#C5A46D]">
          {about?.eyebrow || about?.badge || 'আমাদের গল্প ও ঐতিহ্য'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#242424]">
          {about?.title || about?.heroTitle || 'Fashion Doniya BD — ফ্যাব্রিক কেনায় নতুন অভিজ্ঞতা'}
        </h1>
        <p className="text-sm sm:text-base text-[#242424]/75 max-w-2xl mx-auto leading-relaxed">
          {about?.subtitle || about?.heroDescription || '"আপনার পছন্দের কাপড়, এখন গজ হিসেবে" — এই স্লোগানকে সামনে রেখে বাংলাদেশের রুচিশীল নারীদের জন্য প্রিমিয়াম আনস্টিচড কাপড়ের নির্ভরযোগ্য ঠিকানা।'}
        </p>
      </div>

      {/* Main Story Narrative */}
      <div className="bg-white p-8 rounded-2xl border border-[#EDE5D9] shadow-sm space-y-6 text-sm text-[#242424]/80 leading-relaxed">
        <h2 className="text-xl font-bold text-[#242424]">
          {about?.storyTitle || 'কেন Fashion Doniya BD এর শুরু?'}
        </h2>
        <p>
          {about?.storyParagraph1 || 'পোশাক তৈরিতে সবচেয়ে বড় সমস্যা হলো সঠিক কাপড়ের বহর ও পরিমাপ না জানা। অনেক সময় ২.৫ বহরের কাপড় দিয়ে বড় ঘেরের পোশাক বানাতে গিয়ে সাইডে জোড়া দিতে হয়, যা দেখতে অপছন্দজনক লাগে। অন্যদিকে দোকানগুলোতে পছন্দমতো ভগ্নাংশ গজ (যেমন ১.৫ গজ বা ৩.৫ গজ) কিনতে সমস্যায় পড়তে হয়।'}
        </p>
        <p>
          {about?.storyParagraph2 || 'Fashion Doniya BD এই সমস্যার আধুনিক সমাধান নিয়ে এসেছে। আমরা সরাসরি তাঁতি ও আন্তর্জাতিক মিল থেকে সংগৃহীত খাঁটি সুতি, জামদানি সিল্ক, ওয়েটলেস জর্জেট, লিনেন ও মসলিন কাপড়ের ৩.৫ ও ২.৫ বহর সংগ্রহ গ্রাহকের কাছে উন্মুক্ত করেছি। আপনি আপনার পোশাকের ধরন অনুযায়ী ভগ্নাংশ গজ নির্বাচন করতে পারেন।'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-4 bg-[#FAF8F4] rounded-xl border border-[#EDE5D9] text-center space-y-2">
            <ShieldCheck className="w-6 h-6 text-[#C5A46D] mx-auto" />
            <h3 className="font-bold text-[#242424] text-xs">{about?.feature1Title || '১০০% সঠিক পরিমাপ'}</h3>
            <p className="text-[11px] text-[#242424]/65">{about?.feature1Desc || 'ডিজিটাল কাটিংয়ে নিখুঁত গজ কাটিংয়ের গ্যারান্টি।'}</p>
          </div>

          <div className="p-4 bg-[#FAF8F4] rounded-xl border border-[#EDE5D9] text-center space-y-2">
            <Sparkles className="w-6 h-6 text-[#C5A46D] mx-auto" />
            <h3 className="font-bold text-[#242424] text-xs">{about?.feature2Title || '৩.৫ বহর বিশেষত্ব'}</h3>
            <p className="text-[11px] text-[#242424]/65">{about?.feature2Desc || 'সাইড জোড়া ছাড়াই বিশাল ঘের ও রাজকীয় ফল।'}</p>
          </div>

          <div className="p-4 bg-[#FAF8F4] rounded-xl border border-[#EDE5D9] text-center space-y-2">
            <Truck className="w-6 h-6 text-[#C5A46D] mx-auto" />
            <h3 className="font-bold text-[#242424] text-xs">{about?.feature3Title || 'সারাদেশে ক্যাশ অন ডেলিভারি'}</h3>
            <p className="text-[11px] text-[#242424]/65">{about?.feature3Desc || 'পণ্য হাতে পেয়ে দেখে মূল্য পরিশোধের সুবিধা।'}</p>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="p-8 bg-[#242424] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div>
          <h3 className="text-xl font-bold">{about?.ctaTitle || 'আজই আপনার পছন্দের কাপড় বেছে নিন'}</h3>
          <p className="text-xs text-[#EDE5D9]/70 mt-1">{about?.ctaSubtitle || 'গজ ক্যালকুলেটরে সঠিক পরিমাপ জেনে অর্ডার করুন।'}</p>
        </div>
        <button
          onClick={() => navigateTo('shop')}
          className="px-6 py-3 bg-[#C5A46D] hover:bg-[#b08e57] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
        >
          {about?.ctaButtonText || 'কাপড় কালেকশন দেখুন'}
        </button>
      </div>

    </div>
  );
};
