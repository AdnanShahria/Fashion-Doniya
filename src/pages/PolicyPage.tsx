import React from 'react';
import { useStore } from '../context/StoreContext';
import { OrangeBackButton } from '../components/common/OrangeBackButton';
import { ShieldCheck, Truck, RotateCcw, FileText } from 'lucide-react';

export const PolicyPage: React.FC = () => {
  const { currentPage, settings } = useStore();
  const contentCfg = settings.contentConfig;

  const getPolicyContent = () => {
    switch (currentPage) {
      case 'delivery-policy': {
        const doc = contentCfg?.deliveryPolicy;
        return {
          title: doc?.title || 'ডেলিভারি পলিসি ও চার্জ',
          icon: Truck,
          intro: doc?.intro || doc?.subtitle || 'Fashion Doniya BD সমগ্র বাংলাদেশে অত্যন্ত দ্রুত ও নির্ভরযোগ্য ক্যাশ অন ডেলিভারি সেবা প্রদান করে থাকে।',
          sections:
            doc?.sections && doc.sections.length > 0
              ? doc.sections.map((s) => ({ h: s.heading, p: s.paragraph || s.body }))
              : [
                  {
                    h: 'ডেলিভারি সময়সীমা',
                    p: 'ঢাকা মেট্রোপলিটন সিটির ভেতরে ২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়। ঢাকা সিটির বাইরে বাংলাদেশের যেকোনো জেলা বা উপজেলায় ২ থেকে ৩ কার্যদিবসের মধ্যে কুরিয়ারের মাধ্যমে পণ্য পৌঁছে দেওয়া হয়।'
                  },
                  {
                    h: 'ডেলিভারি চার্জ',
                    p: `ঢাকা সিটির ভেতরে ডেলিভারি চার্জ মাত্র ৳${settings.insideDhakaDeliveryFee} এবং ঢাকার বাইরে ৳${settings.outsideDhakaDeliveryFee}। মোট ৳${settings.freeDeliveryThreshold} বা তার বেশি টাকার কেনাকাটায় সারা বাংলাদেশে ডেলিভারি সম্পূর্ণ ফ্রি!`
                  },
                  {
                    h: 'পণ্য রিসিভ করার নিয়ম',
                    p: 'ক্যাশ অন ডেলিভারিতে পার্সেল রিসিভ করার সময় কুরিয়ার ডেলিভারি প্রতিনিধির উপস্থিতিতে পার্সেল চেক করে মূল্য পরিশোধ করুন।'
                  }
                ]
        };
      }

      case 'return-policy': {
        const doc = contentCfg?.returnPolicy;
        return {
          title: doc?.title || 'রিটার্ন ও এক্সচেঞ্জ পলিসি',
          icon: RotateCcw,
          intro: doc?.intro || doc?.subtitle || 'গ্রাহকদের শতভাগ সন্তুষ্টি আমাদের মূল অগ্রাধিকার। কোনো পণ্যে ত্রুটি থাকলে আমরা দ্রুত সমাধানের ব্যবস্থা করি।',
          sections:
            doc?.sections && doc.sections.length > 0
              ? doc.sections.map((s) => ({ h: s.heading, p: s.paragraph || s.body }))
              : [
                  {
                    h: 'রিটার্নের শর্তাবলী',
                    p: 'যদি কাপড়ে কোনো ছেঁড়া, ডিফেক্ট, রঙের বড় অমিল বা ভুল গজ সরবরাহ করা হয়, তবে ডেলিভারি গ্রহণের ৪৮ ঘণ্টার মধ্যে আমাদের হেল্পলাইনে কল করে অবহিত করতে হবে।'
                  },
                  {
                    h: 'কাপড় কাটিং সংক্রান্ত নিয়ম',
                    p: 'যেহেতু থান থেকে গ্রাহকের চাহিদা অনুযায়ী গজ মেপে কাপড় কাটা হয়, তাই কোনো ত্রুটি ছাড়া শুধুমাত্র মন পরিবর্তনের কারণে কাটা কাপড় ফেরতযোগ্য নয়। তবে ভুল পণ্য বা ত্রুটিযুক্ত কাপড়ে ১০০% ফ্রি এক্সচেঞ্জ প্রযোজ্য।'
                  },
                  {
                    h: 'রিফান্ড প্রক্রিয়া',
                    p: 'রিটার্ন যাচাইয়ের পর ৩ কার্যদিবসের মধ্যে বিকাশ বা নগদ একাউন্টে টাকা রিফান্ড করা হয়।'
                  }
                ]
        };
      }

      case 'privacy-policy': {
        const doc = contentCfg?.privacyPolicy;
        return {
          title: doc?.title || 'গোপনীয়তা ও প্রাইভেসী নীতি',
          icon: ShieldCheck,
          intro: doc?.intro || doc?.subtitle || 'Fashion Doniya BD গ্রাহকের ব্যক্তিগত তথ্যের সর্বোচ্চ সুরক্ষা ও গোপনীয়তা বজায় রাখে।',
          sections:
            doc?.sections && doc.sections.length > 0
              ? doc.sections.map((s) => ({ h: s.heading, p: s.paragraph || s.body }))
              : [
                  {
                    h: 'তথ্য সংগ্রহ ও ব্যবহার',
                    p: 'আমরা কেবল অর্ডার প্রসেসিং ও ডেলিভারির সুবিধার্থে গ্রাহকের নাম, মোবাইল নম্বর এবং ঠিকানা সংরক্ষণ করি।'
                  },
                  {
                    h: 'তৃতীয় পক্ষের সাথে তথ্য শেয়ার না করা',
                    p: 'আমরা কোনো অবস্থাতেই আপনার ব্যক্তিগত তথ্য বাণিজ্যিক উদ্দেশ্যে কোনো তৃতীয় পক্ষের কাছে বিক্রি বা শেয়ার করি না।'
                  }
                ]
        };
      }

      case 'terms':
      default: {
        const doc = contentCfg?.termsConditions;
        return {
          title: doc?.title || 'শর্তাবলী ও নিয়মাবলী',
          icon: FileText,
          intro: doc?.intro || doc?.subtitle || 'Fashion Doniya BD ওয়েবসাইট ব্যবহার এবং পণ্য ক্রয়ের ক্ষেত্রে নিম্নলিখিত শর্তাবলী প্রযোজ্য।',
          sections:
            doc?.sections && doc.sections.length > 0
              ? doc.sections.map((s) => ({ h: s.heading, p: s.paragraph || s.body }))
              : [
                  {
                    h: 'অর্ডার অনুমোদন',
                    p: 'ওয়েবসাইটে অর্ডার প্লেস করার পর আমাদের প্রতিনিধি আপনার নম্বরে কল করে বা এসএমএস দিয়ে কনফার্ম করবেন।'
                  },
                  {
                    h: 'দাম ও স্টক পরিবর্তন',
                    p: 'যেকোনো পণ্যের মূল্য বা স্টকের পরিমাণ পূর্ব নোটিশ ছাড়াই বাজারের সুতোর দরের পরিবর্তনের কারণে হালনাগাদ হতে পারে।'
                  }
                ]
        };
      }
    }
  };

  const policy = getPolicyContent();
  const Icon = policy.icon;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-[#FAF8F4] text-[#C5A46D] flex items-center justify-center mx-auto border border-[#EDE5D9]">
          <Icon className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#242424]">
          {policy.title}
        </h1>
        <p className="text-xs sm:text-sm text-[#242424]/70 max-w-md mx-auto">
          {policy.intro}
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EDE5D9] shadow-sm space-y-6 text-xs sm:text-sm text-[#242424]/80 leading-relaxed">
        {policy.sections.map((sec, idx) => (
          <div key={idx} className="space-y-1.5 pb-4 border-b border-[#EDE5D9]/60 last:border-0 last:pb-0">
            <h3 className="text-base font-bold text-[#242424]">{sec.h}</h3>
            <p>{sec.p}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <OrangeBackButton label="কেনাকাটায় ফিরে যান" />
      </div>

    </div>
  );
};
