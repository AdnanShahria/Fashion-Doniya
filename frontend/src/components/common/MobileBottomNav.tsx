import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  X,
  ChevronRight,
  Sparkles,
  Calculator,
  Layers,
  ShoppingBag,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    currentPage,
    selectedWidthFilter,
    navigateTo,
    cartItemCount,
    wishlist,
  } = useStore();

  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const isHomeActive = currentPage === 'home' && !categorySheetOpen;
  const isCategoryActive =
    categorySheetOpen ||
    currentPage === 'fabric-width' ||
    currentPage === 'category-gallery' ||
    currentPage === 'shop' ||
    currentPage === 'shop-2-5' ||
    currentPage === 'shop-3-5';
  const isCartActive =
    (currentPage === 'cart' || currentPage === 'checkout') && !categorySheetOpen;
  const isTrackingActive =
    currentPage === 'order-tracking' && !categorySheetOpen;
  const isAccountActive = currentPage === 'account' && !categorySheetOpen;

  const categoryItems = [
    {
      label: '৩.৫ হাত বহর কাপড় (সকল)',
      sub: 'প্রশস্ত ৫৬–৬০ ইঞ্চি বহর',
      badge: '৩.৫ বহর',
      action: () => navigateTo('fabric-width', { width: '3.5' }),
    },
    {
      label: '২.৫ হাত বহর কাপড় (সকল)',
      sub: 'নিয়মিত ৪২–৪৪ ইঞ্চি বহর',
      badge: '২.৫ বহর',
      action: () => navigateTo('fabric-width', { width: '2.5' }),
    },
    {
      label: 'শাড়ির কাপড় কালেকশন',
      sub: 'জামদানি, সিল্ক ও জর্জেট শাড়ির থান',
      action: () =>
        navigateTo('category-gallery', { width: '3.5', category: 'saree' }),
    },
    {
      label: 'কামিজের কাপড় (৩.৫ বহর)',
      sub: 'প্রিমিয়াম কটন, লন ও এমব্রয়ডারি',
      action: () =>
        navigateTo('category-gallery', { width: '3.5', category: 'kamiz' }),
    },
    {
      label: 'কামিজের কাপড় (২.৫ বহর)',
      sub: 'সুতি, ব্লক প্রিন্ট ও নকশি কাঁথা',
      action: () =>
        navigateTo('category-gallery', { width: '2.5', category: 'kamiz' }),
    },
    {
      label: 'শর্ট কামিজ ও কুর্তি ফেব্রিক',
      sub: 'অর্গানজা, লিনেন ও কাটওয়ার্ক',
      action: () =>
        navigateTo('category-gallery', {
          width: '3.5',
          category: 'short-kamiz',
        }),
    },
    {
      label: 'লং কটি ফেব্রিক',
      sub: 'বেনারসি ব্রোকেড ও র-সিল্ক',
      action: () =>
        navigateTo('category-gallery', { width: '3.5', category: 'long-koti' }),
    },
    {
      label: 'গাউন ও লেহেঙ্গা ফেব্রিক',
      sub: 'পার্টি গাউন, বাটার সিল্ক ও অরগানজা',
      action: () =>
        navigateTo('category-gallery', {
          width: '3.5',
          category: 'gown-lehenga',
        }),
    },
  ];

  const handleNavClick = (action: () => void) => {
    setCategorySheetOpen(false);
    action();
  };

  return (
    <>
      {/* Category Slide-Up Sheet for Mobile when "ক্যাটাগরি" is tapped */}
      {categorySheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1C0B0D]/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setCategorySheetOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="কাপড়ের ক্যাটাগরি সমূহ"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-[82px] left-2.5 right-2.5 bg-[#FFFDF9]/96 backdrop-blur-xl rounded-2xl border border-[#DFCBB2] shadow-[0_-14px_38px_rgba(36,22,20,0.22)] max-h-[70vh] flex flex-col overflow-hidden"
          >
            {/* Sheet Header */}
            <div className="px-4 py-3 bg-[#FAF5ED] border-b border-[#EAE0D2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#6B0812]" />
                <h3 className="text-sm font-extrabold text-[#6B0812]">
                  কাপড়ের ক্যাটাগরি সমূহ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCategorySheetOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FFFDF9] border border-[#DFCBB2] text-[#6B0812] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
                aria-label="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category List */}
            <div className="p-3 overflow-y-auto space-y-2">
              <div className="grid grid-cols-1 gap-1.5">
                {categoryItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleNavClick(item.action)}
                    className="w-full min-h-[48px] px-3 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F3E8D8] active:scale-[0.98] border border-[#E6D6C1] flex items-center justify-between gap-2 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#241614] truncate">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-[#6B0812] text-white text-[10px] font-bold shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#523A35] mt-0.5 truncate">
                        {item.sub}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#6B0812] shrink-0" />
                  </button>
                ))}
              </div>

              {/* Bottom Quick Action Buttons in Sheet */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#EFE4D4]">
                <button
                  type="button"
                  onClick={() =>
                    handleNavClick(() => navigateTo('shop', { width: 'all' }))
                  }
                  className="min-h-[40px] py-2 px-2 rounded-xl bg-[#6B0812] text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                  <span>সকল কাপড়</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick(() => navigateTo('calculator'))}
                  className="min-h-[40px] py-2 px-2 rounded-xl bg-[#FAF3E8] border border-[#DFC9AA] text-[#6B0812] text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5 shrink-0" />
                  <span>গজ হিসাব</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleNavClick(() => navigateTo('custom-design'))
                  }
                  className="min-h-[40px] py-2 px-2 rounded-xl bg-[#FAF3E8] border border-[#DFC9AA] text-[#6B0812] text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>কাস্টম অর্ডার</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar (Mobile Only — Warm Liquid Glass with Safe Area) */}
      <nav
        aria-label="মোবাইল বটম নেভিগেশন"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-functional border-t border-[#DFCBB2]/90 shadow-[0_-8px_28px_rgba(36,22,20,0.12)] select-none pb-[env(safe-area-inset-bottom)]"
      >
        <div className="relative max-w-md mx-auto px-2 pt-1.5 pb-2">
          <div className="grid grid-cols-5 items-center">
            {/* 1. হোম (Home) */}
            <button
              type="button"
              onClick={() => handleNavClick(() => navigateTo('home'))}
              className="min-h-[44px] flex flex-col items-center justify-center gap-1 py-0.5 cursor-pointer group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
            >
              <div className="relative flex items-center justify-center h-6">
                <svg
                  className={`w-[22px] h-[22px] transition-colors ${
                    isHomeActive
                      ? 'text-[#6B0812]'
                      : 'text-[#3D1410] group-hover:text-[#6B0812]'
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 10.8L12 3.2l9 7.6" />
                  <path d="M5.2 9.5V20a1 1 0 001 1h11.6a1 1 0 001-1V9.5" />
                  <path d="M9.8 21v-6.2h4.4V21" />
                </svg>
              </div>
              <span
                className={`text-[11px] leading-none tracking-tight font-extrabold ${
                  isHomeActive ? 'text-[#6B0812]' : 'text-[#3D1410]'
                }`}
              >
                হোম
              </span>
            </button>

            {/* 2. ক্যাটাগরি (Category) */}
            <button
              type="button"
              onClick={() => setCategorySheetOpen((prev) => !prev)}
              className="min-h-[44px] flex flex-col items-center justify-center gap-1 py-0.5 cursor-pointer group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
            >
              <div className="relative flex items-center justify-center h-6">
                <svg
                  className={`w-[21px] h-[21px] transition-colors ${
                    isCategoryActive
                      ? 'text-[#6B0812]'
                      : 'text-[#3D1410] group-hover:text-[#6B0812]'
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
                  <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
                  <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
                  <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
                </svg>
              </div>
              <span
                className={`text-[11px] leading-none tracking-tight font-extrabold ${
                  isCategoryActive ? 'text-[#6B0812]' : 'text-[#3D1410]'
                }`}
              >
                ক্যাটাগরি
              </span>
            </button>

            {/* 3. কার্ট (Elevated Center Crimson Medallion with Zari Gold Rim) */}
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleNavClick(() => navigateTo('cart'))}
                aria-label="শপিং কার্ট"
                className={`-mt-6 -mb-1.5 w-[64px] h-[64px] rounded-full p-[3px] bg-gradient-to-b from-[#F5DDA7] via-[#DFB464] to-[#C5933B] shadow-[0_8px_20px_rgba(107,8,18,0.28)] active:scale-95 transition-transform cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] ${
                  isCartActive ? 'ring-2 ring-[#6B0812]/35' : ''
                }`}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-b from-[#8A0B17] via-[#6B0812] to-[#4E050C] border border-[#FFF3D6]/50 flex flex-col items-center justify-center pt-0.5">
                  <div className="relative flex items-center justify-center">
                    <svg
                      className="w-[23px] h-[23px] text-white -ml-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="9" cy="19.5" r="1.6" />
                      <circle cx="17" cy="19.5" r="1.6" />
                      <path d="M2.5 4h2.6l2.1 10.5a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.55-1.2L20.5 7H6" />
                    </svg>

                    <span className="absolute -top-2 -right-3 min-w-[19px] h-[19px] px-1 rounded-full bg-[#F5DDA7] border border-[#FFFDF9] text-[#6B0812] text-[10.5px] font-extrabold flex items-center justify-center leading-none tabular-nums shadow-xs">
                      {cartItemCount}
                    </span>
                  </div>

                  <span className="text-white text-[11px] font-extrabold leading-none mt-1 tracking-tight">
                    কার্ট
                  </span>
                </div>
              </button>
            </div>

            {/* 4. অর্ডার ট্র্যাকিং */}
            <button
              type="button"
              onClick={() => handleNavClick(() => navigateTo('order-tracking'))}
              className="min-h-[44px] flex flex-col items-center justify-center gap-1 py-0.5 cursor-pointer group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
            >
              <div className="relative flex items-center justify-center h-6">
                <svg
                  className="w-[24px] h-[24px]"
                  viewBox="0 0 26 26"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2.8L3.8 7.2V16.8L12 21.2L16.5 18.8"
                    stroke={isTrackingActive ? '#6B0812' : '#3D1410'}
                    strokeWidth="2.0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 2.8L20.2 7.2V11.5"
                    stroke={isTrackingActive ? '#6B0812' : '#3D1410'}
                    strokeWidth="2.0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.8 7.2L12 11.6L20.2 7.2"
                    stroke={isTrackingActive ? '#6B0812' : '#3D1410'}
                    strokeWidth="2.0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 11.6V21.2"
                    stroke={isTrackingActive ? '#6B0812' : '#3D1410'}
                    strokeWidth="2.0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="7.1"
                    r="1.15"
                    fill={isTrackingActive ? '#6B0812' : '#3D1410'}
                  />
                  <path
                    d="M19.2 12.2C16.88 12.2 15 14.05 15 16.33C15 19.35 19.2 23.4 19.2 23.4C19.2 23.4 23.4 19.35 23.4 16.33C23.4 14.05 21.52 12.2 19.2 12.2Z"
                    fill="#6B0812"
                  />
                  <circle cx="19.2" cy="16.2" r="1.7" fill="#FAF6F0" />
                </svg>
              </div>
              <span
                className={`text-[11px] leading-none tracking-tight font-extrabold whitespace-nowrap ${
                  isTrackingActive ? 'text-[#6B0812]' : 'text-[#3D1410]'
                }`}
              >
                অর্ডার ট্র্যাকিং
              </span>
            </button>

            {/* 5. অ্যাকাউন্ট (Account) */}
            <button
              type="button"
              onClick={() => handleNavClick(() => navigateTo('account'))}
              className="min-h-[44px] flex flex-col items-center justify-center gap-1 py-0.5 cursor-pointer group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
            >
              <div className="relative flex items-center justify-center h-6">
                <svg
                  className={`w-[22px] h-[22px] transition-colors ${
                    isAccountActive
                      ? 'text-[#6B0812]'
                      : 'text-[#3D1410] group-hover:text-[#6B0812]'
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4.1" />
                  <path d="M4.8 20.5c0-3.6 3.22-6.5 7.2-6.5s7.2 2.9 7.2 6.5" />
                </svg>
              </div>
              <span
                className={`text-[11px] leading-none tracking-tight font-extrabold whitespace-nowrap ${
                  isAccountActive ? 'text-[#6B0812]' : 'text-[#3D1410]'
                }`}
              >
                অ্যাকাউন্ট
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};
