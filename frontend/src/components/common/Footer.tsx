import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { StorageService } from '../../services/storageService';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  RotateCcw, 
  Truck, 
  Headphones,
  Send,
  RefreshCw,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings, navigateTo, showToast, refreshData } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleResetData = () => {
    StorageService.resetDemoData();
    refreshData();
    showToast('ডেমো ডাটা সফলভাবে রিসেট করা হয়েছে!', 'success');
    navigateTo('home');
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      showToast('নিউজলেটারে সফলভাবে সাবস্ক্রাইব করা হয়েছে!', 'success');
      setNewsletterEmail('');
    } else {
      showToast('অনুগ্রহ করে আপনার ইমেইল প্রদান করুন।', 'error');
    }
  };

  const serviceFeatures = [
    {
      icon: Truck,
      title: 'সারা দেশে দ্রুত ডেলিভারি',
      desc: 'ঢাকা ও দেশজুড়ে হোম ডেলিভারি'
    },
    {
      icon: ShieldCheck,
      title: '১০০% নিরাপদ পেমেন্ট',
      desc: 'ক্যাশ অন ডেলিভারি ও মোবাইল ব্যাংকিং'
    },
    {
      icon: RotateCcw,
      title: 'সহজ রিটার্ন সুবিধা',
      desc: '৭ দিনের মধ্যে সহজ এক্সচেঞ্জ ও রিটার্ন'
    },
    {
      icon: Headphones,
      title: '২৪/৭ গ্রাহক সহায়তা',
      desc: 'যেকোনো প্রয়োজনে কল ও হোয়াটসঅ্যাপ সেবা'
    }
  ];

  return (
    <footer className="w-full min-w-0 bg-[#260D10] text-[#FFFDF9] pt-8 sm:pt-14 pb-20 sm:pb-12 border-t border-[#3D1418] select-none">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 min-w-0">
        
        {/* 1. Service Features Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 pb-8 sm:pb-12 border-b border-[#3D1418]/80">
          {serviceFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx} 
                className="flex items-center gap-2.5 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-lg bg-[#311115]/50 border border-[#48191E]/60 min-w-0"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#401419] border border-[#D5A64A]/30 flex items-center justify-center shrink-0 text-[#D5A64A]">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-[13.5px] font-bold text-[#FFFDF9] leading-tight truncate">
                    {feat.title}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#EDE5D9]/80 leading-tight truncate mt-0.5">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Main 4-Column Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 py-8 sm:py-12 border-b border-[#3D1418]/80 min-w-0">
          
          {/* Column 1: Brand Info & Contact */}
          <div className="space-y-3.5 min-w-0">
            <h2 className="font-['Playfair_Display'] font-bold text-xl sm:text-2xl text-[#FFFDF9] tracking-tight">
              {settings.storeName ? (
                settings.storeName.includes('BD') ? (
                  <>
                    {settings.storeName.replace(/\s*BD$/, '')}{' '}
                    <span className="text-[#D5A64A]">BD</span>
                  </>
                ) : (
                  settings.storeName
                )
              ) : (
                <>
                  Fashion Doniya <span className="text-[#D5A64A]">BD</span>
                </>
              )}
            </h2>
            <p className="text-xs sm:text-[13px] text-[#EDE5D9]/80 leading-relaxed">
              {settings.contentConfig?.footerContent?.brandDescription ||
                'বাংলাদেশের রুচিশীল ক্রেতাদের জন্য প্রিমিয়াম কোয়ালিটির আনস্টিচড থান ও গজ কাপড়ের বিশ্বস্ত শোরুম। আপনার পছন্দমতো সঠিক গজ মেপে কিনুন সহজেই।'}
            </p>

            <div className="pt-1 space-y-2 text-xs sm:text-[13px] text-[#EDE5D9]/85 min-w-0">
              <div className="flex items-start gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-[#D5A64A] shrink-0 mt-0.5" />
                <span className="break-words min-w-0 leading-snug">{settings.address || 'ঢাকা, বাংলাদেশ'}</span>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <Phone className="w-4 h-4 text-[#D5A64A] shrink-0" />
                <a href={`tel:${settings.supportPhone || '+8801700000000'}`} className="hover:text-[#D5A64A] transition-colors">
                  {settings.supportPhone || '+880 1700-000000'}
                </a>
              </div>
              <div className="flex items-center gap-2.5 min-w-0">
                <Mail className="w-4 h-4 text-[#D5A64A] shrink-0" />
                <a href={`mailto:${settings.supportEmail || 'support@fashiondoniyabd.com'}`} className="hover:text-[#D5A64A] transition-colors break-all">
                  {settings.supportEmail || 'support@fashiondoniyabd.com'}
                </a>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="pt-2 flex items-center gap-2">
              <a 
                href={settings.facebookUrl || 'https://facebook.com'} 
                target="_blank" 
                rel="noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-[#351317] hover:bg-[#D5A64A] text-[#EDE5D9] hover:text-[#260D10] border border-[#48191E] flex items-center justify-center transition-all cursor-pointer"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href={settings.instagramUrl || 'https://instagram.com'} 
                target="_blank" 
                rel="noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-[#351317] hover:bg-[#D5A64A] text-[#EDE5D9] hover:text-[#260D10] border border-[#48191E] flex items-center justify-center transition-all cursor-pointer"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href={settings.youtubeUrl || 'https://youtube.com'} 
                target="_blank" 
                rel="noreferrer"
                aria-label="YouTube"
                className="w-8 h-8 rounded-full bg-[#351317] hover:bg-[#D5A64A] text-[#EDE5D9] hover:text-[#260D10] border border-[#48191E] flex items-center justify-center transition-all cursor-pointer"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a 
                href={`https://wa.me/${(settings.whatsappNumber || '8801700000000').replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noreferrer"
                aria-label="WhatsApp"
                className="w-8 h-8 rounded-full bg-[#351317] hover:bg-[#D5A64A] text-[#EDE5D9] hover:text-[#260D10] border border-[#48191E] flex items-center justify-center transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Fabric Collection Links */}
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#D5A64A] mb-3 sm:mb-4">
              ফেব্রিক সংগ্রহ
            </h3>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-[13px] text-[#EDE5D9]/80">
              <li>
                <button onClick={() => navigateTo('fabric-width', { width: '3.5' })} className="text-left hover:text-[#D5A64A] transition-colors cursor-pointer">
                  ৩.৫ বহর কাপড় (৫৬–৬০ ইঞ্চি)
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('fabric-width', { width: '2.5' })} className="text-left hover:text-[#D5A64A] transition-colors cursor-pointer">
                  ২.৫ বহর কাপড় (৪২–৪৪ ইঞ্চি)
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('category-gallery', { width: '3.5', category: 'saree' })} className="text-left hover:text-[#D5A64A] transition-colors cursor-pointer">
                  শাড়ির কাপড় কালেকশন
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('category-gallery', { width: '3.5', category: 'kamiz' })} className="text-left hover:text-[#D5A64A] transition-colors cursor-pointer">
                  কামিজ ও কুর্তি ফেব্রিক
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('shop')} className="text-left hover:text-[#D5A64A] transition-colors cursor-pointer">
                  সকল প্রিমিয়াম থান কাপড়
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('calculator')} className="text-left hover:text-[#D5A64A] text-[#D5A64A] font-semibold transition-colors cursor-pointer">
                  স্বয়ংক্রিয় গজ ক্যালকুলেটর →
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('custom-design')} className="text-left hover:text-[#D5A64A] transition-colors cursor-pointer">
                  কাস্টম ডিজাইন ও সাইজিং
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Policy Links */}
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#D5A64A] mb-3 sm:mb-4">
              গ্রাহক সেবা ও গাইড
            </h3>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-[13px] text-[#EDE5D9]/80">
              <li>
                <button onClick={() => navigateTo('order-tracking')} className="text-left hover:text-[#D5A64A] transition-colors cursor-pointer">
                  অর্ডার ট্র্যাকিং করুন
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('measurement-guide')} className="text-left hover:text-[#D5A64A] transition-colors cursor-pointer">
                  কাপড়ের বহর ও মাপের গাইড
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('faq')} className="text-left hover:text-[#D5A64A] transition-colors cursor-pointer">
                  সাধারণ জিজ্ঞাসা (FAQ)
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('delivery-policy')} className="text-left hover:text-[#D5A64A] transition-colors cursor-pointer">
                  ডেলিভারি পলিসি ও সময়সীমা
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('return-policy')} className="text-left hover:text-[#D5A64A] transition-colors cursor-pointer">
                  রিটার্ন ও রিফান্ড নীতি
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('terms')} className="text-left hover:text-[#D5A64A] transition-colors cursor-pointer">
                  শর্তাবলী ও নিয়মাবলী
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('privacy-policy')} className="text-left hover:text-[#D5A64A] transition-colors cursor-pointer">
                  গোপনীয়তা রক্ষা নীতি
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Company */}
          <div className="space-y-3.5 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#D5A64A]">
              নিউজলেটার সাবস্ক্রিপশন
            </h3>
            <p className="text-xs sm:text-[13px] text-[#EDE5D9]/80 leading-relaxed">
              নতুন কাপড়ের কালেকশন, ডিসকাউন্ট ও অফারের নিয়মিত আপডেট পেতে আপনার ইমেইল যুক্ত করুন।
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex items-center rounded-lg bg-[#1F0A0C] border border-[#48191E] focus-within:border-[#D5A64A] overflow-hidden">
                <input 
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="আপনার ইমেইল অ্যাড্রেস..."
                  className="w-full bg-transparent px-3 py-2 text-xs text-[#FFFDF9] placeholder-[#EDE5D9]/60 focus:outline-none"
                />
                <button 
                  type="submit"
                  aria-label="সাবস্ক্রাইব করুন"
                  className="px-3.5 py-2 bg-[#D5A64A] hover:bg-[#BF933E] text-[#260D10] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-[#3D1418]/60 space-y-2">
              <div className="flex items-center gap-3 text-xs text-[#EDE5D9]/85">
                <button onClick={() => navigateTo('about')} className="hover:text-[#D5A64A] transition-colors cursor-pointer">
                  আমাদের সম্পর্কে
                </button>
                <span>·</span>
                <button onClick={() => navigateTo('contact')} className="hover:text-[#D5A64A] transition-colors cursor-pointer">
                  যোগাযোগ
                </button>
                <span>·</span>
                <button 
                  onClick={() => navigateTo('admin')} 
                  className="hover:text-[#D5A64A] transition-colors cursor-pointer text-[#E5C687]"
                >
                  অ্যাডমিন প্যানেল
                </button>
              </div>

              <div>
                <button 
                  onClick={handleResetData}
                  className="text-xs text-[#EDE5D9]/75 hover:text-red-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="রিসেট করে প্রাথমিক স্যাম্পল ডাটায় ফেরত যান"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>ডেমো ডাটা রিসেট করুন</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* 3. Bottom Bar: Copyright & Payment Methods */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-[#EDE5D9]/80">
          <p>© {new Date().getFullYear()} Fashion Doniya BD. সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 text-xs text-[#EDE5D9]/85">
            <span className="text-[#D5A64A] font-semibold">পেমেন্ট সুবিধা:</span>
            <span className="px-2 py-0.5 rounded bg-[#351317] border border-[#48191E]">ক্যাশ অন ডেলিভারি</span>
            <span className="px-2 py-0.5 rounded bg-[#351317] border border-[#48191E]">বিকাশ</span>
            <span className="px-2 py-0.5 rounded bg-[#351317] border border-[#48191E]">নগদ</span>
            <span className="px-2 py-0.5 rounded bg-[#351317] border border-[#48191E]">রকেট</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

