import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { BrandLogo } from './BrandLogo';
import { useAppLanguage, applyDocumentLanguage } from '../../utils/languageTranslator';
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  X,
  Globe,
  List,
  ChevronDown,
  ChevronRight,
  Home,
  Tag,
  Scissors,
  Truck,
  Calculator
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentPage,
    selectedWidthFilter,
    selectedCategory,
    navigateTo,
    cartItemCount,
    wishlist,
    currentUser,
    searchQuery,
    settings
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [lang, setLang] = useAppLanguage();
  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyDocumentLanguage(lang);
    }, 20);
    return () => window.clearTimeout(timer);
  }, [currentPage, selectedWidthFilter, selectedCategory, lang]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigateTo('shop', { search: searchInput.trim() });
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
    } else {
      navigateTo('shop');
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
    }
  };

  const categoryMenuItems = [
    { label: '৩.৫ বহর কাপড় (সকল)', action: () => navigateTo('fabric-width', { width: '3.5' }) },
    { label: '২.৫ বহর কাপড় (সকল)', action: () => navigateTo('fabric-width', { width: '2.5' }) },
    { label: 'শাড়ির কাপড় (৩.৫ বহর)', action: () => navigateTo('category-gallery', { width: '3.5', category: 'saree' }) },
    { label: 'কামিজের কাপড় (৩.৫ বহর)', action: () => navigateTo('category-gallery', { width: '3.5', category: 'kamiz' }) },
    { label: 'কামিজের কাপড় (২.৫ বহর)', action: () => navigateTo('category-gallery', { width: '2.5', category: 'kamiz' }) },
    { label: 'শর্ট কামিজ ও কুর্তি', action: () => navigateTo('category-gallery', { width: '3.5', category: 'short-kamiz' }) },
    { label: 'লং কটি ফেব্রিক', action: () => navigateTo('category-gallery', { width: '3.5', category: 'long-koti' }) },
    { label: 'গাউন / লেহেঙ্গা ফেব্রিক', action: () => navigateTo('category-gallery', { width: '3.5', category: 'gown-lehenga' }) },
    { label: 'কাস্টম ডিজাইন কাপড়', action: () => navigateTo('custom-design') },
    { label: 'অর্ডার ট্র্যাকিং', action: () => navigateTo('order-tracking') },
    { label: 'ডেমো অ্যাডমিন প্যানেল', action: () => navigateTo('admin') }
  ];

  const defaultMainNavLinks = [
    {
      label: 'হোম',
      isHome: true,
      isActive: currentPage === 'home',
      onClick: () => navigateTo('home')
    },
    {
      label: '৩.৫ বহর কাপড়',
      isActive: currentPage === 'fabric-width' && selectedWidthFilter === '3.5',
      onClick: () => navigateTo('fabric-width', { width: '3.5' })
    },
    {
      label: '২.৫ বহর কাপড়',
      isActive: currentPage === 'fabric-width' && selectedWidthFilter === '2.5',
      onClick: () => navigateTo('fabric-width', { width: '2.5' })
    },
    {
      label: 'সকল কাপড়',
      isActive: currentPage === 'shop',
      onClick: () => navigateTo('shop', { width: 'all' })
    },
    {
      label: 'শাড়ি',
      isActive: currentPage === 'category-gallery' && selectedCategory === 'saree',
      onClick: () => navigateTo('category-gallery', { width: '3.5', category: 'saree' })
    },
    {
      label: 'কামিজ',
      isActive: currentPage === 'category-gallery' && selectedCategory === 'kamiz',
      onClick: () => navigateTo('category-gallery', { width: '3.5', category: 'kamiz' })
    },
    {
      label: 'গাউন / লেহেঙ্গা',
      isActive: currentPage === 'category-gallery' && selectedCategory === 'gown-lehenga',
      onClick: () => navigateTo('category-gallery', { width: '3.5', category: 'gown-lehenga' })
    },
    {
      label: 'কাস্টম ডিজাইন',
      isActive: currentPage === 'custom-design',
      onClick: () => navigateTo('custom-design')
    },
    {
      label: 'গজ হিসাব',
      isActive: currentPage === 'calculator',
      onClick: () => navigateTo('calculator')
    }
  ];

  const customHeaderItems = (settings.navigationConfig?.headerItems || [])
    .filter((item) => item.isActive !== false && item.page !== 'fabric-to-outfit' && item.label !== 'এআই আউটফিট')
    .sort((a, b) => a.order - b.order);

  // Use custom navigation if Admin modified it via Navigation Management, otherwise preserve exact 10 links
  const isCustomNavModified =
    customHeaderItems.length > 0 &&
    customHeaderItems.some((item) => item.id.startsWith('custom-nav-'));

  const mainNavLinks = isCustomNavModified
    ? customHeaderItems.map((item) => ({
        label: item.label,
        isHome: item.page === 'home',
        isActive: currentPage === item.page,
        onClick: () => {
          if (item.page === 'shop-3-5') {
            navigateTo('fabric-width', { width: '3.5' });
          } else if (item.page === 'shop-2-5') {
            navigateTo('fabric-width', { width: '2.5' });
          } else {
            navigateTo(item.page);
          }
        }
      }))
    : defaultMainNavLinks;

  const renderCategorySectionMenu = (closeMenu: () => void) => (
    <div className="space-y-3.5 text-[#241614]">
      {/* Section 1: পোশাকের ক্যাটাগরি */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 px-0.5">
          <Tag className="w-4 h-4 text-[#7A0916] stroke-[2.2] shrink-0" />
          <span className="text-[14px] font-bold text-[#7A0916] shrink-0">
            পোশাকের ক্যাটাগরি
          </span>
          <span className="flex-1 h-[1.5px] bg-[#D5A64A]/80 rounded-full ml-1" />
        </div>

        {/* 2×3 Grid of Outfit Category Cards */}
        <div className="grid grid-cols-2 gap-2">
          {/* 1. কামিজ */}
          <button
            type="button"
            onClick={() => {
              navigateTo('category-gallery', { width: '3.5', category: 'kamiz' });
              closeMenu();
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#FDFBF7] hover:bg-[#FAF2E6] border border-[#E6D8C5] shadow-[0_2px_6px_rgba(107,8,18,0.04)] transition-all cursor-pointer group text-left"
          >
            <svg className="w-6 h-6 shrink-0 text-[#7A0916]" viewBox="0 0 28 28" fill="none">
              <path
                d="M10.5 4.5L14 7.5L17.5 4.5L22.5 8.5L20 12.5L18.5 10.5V24.5H9.5V10.5L8 12.5L5.5 8.5L10.5 4.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M14 7.5V12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-[13.5px] font-bold text-[#241614] group-hover:text-[#6B0812] truncate">
              কামিজ
            </span>
          </button>

          {/* 2. শর্ট কামিজ */}
          <button
            type="button"
            onClick={() => {
              navigateTo('category-gallery', { width: '3.5', category: 'short-kamiz' });
              closeMenu();
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#FDFBF7] hover:bg-[#FAF2E6] border border-[#E6D8C5] shadow-[0_2px_6px_rgba(107,8,18,0.04)] transition-all cursor-pointer group text-left"
          >
            <svg className="w-6 h-6 shrink-0 text-[#7A0916]" viewBox="0 0 28 28" fill="none">
              <path
                d="M10.5 5L14 8.5L17.5 5L22.5 9.5L20.5 14L18.5 11.5V22H9.5V11.5L7.5 14L5.5 9.5L10.5 5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M14 8.5V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-[13.5px] font-bold text-[#241614] group-hover:text-[#6B0812] truncate">
              শর্ট কামিজ
            </span>
          </button>

          {/* 3. গাউন / লেহেঙ্গা */}
          <button
            type="button"
            onClick={() => {
              navigateTo('category-gallery', { width: '3.5', category: 'gown-lehenga' });
              closeMenu();
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#FDFBF7] hover:bg-[#FAF2E6] border border-[#E6D8C5] shadow-[0_2px_6px_rgba(107,8,18,0.04)] transition-all cursor-pointer group text-left"
          >
            <svg className="w-6 h-6 shrink-0 text-[#7A0916]" viewBox="0 0 28 28" fill="none">
              <path
                d="M11 4.5L14 7L17 4.5L18.5 8.5L16.5 12H11.5L9.5 8.5L11 4.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.5 12L6.5 23.5C9.5 25 18.5 25 21.5 23.5L16.5 12H11.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M12.5 12L10.5 24M15.5 12L17.5 24" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="text-[13px] font-bold text-[#241614] group-hover:text-[#6B0812] truncate">
              গাউন / লেহেঙ্গা
            </span>
          </button>

          {/* 4. কোটি */}
          <button
            type="button"
            onClick={() => {
              navigateTo('category-gallery', { width: '3.5', category: 'long-koti' });
              closeMenu();
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#FDFBF7] hover:bg-[#FAF2E6] border border-[#E6D8C5] shadow-[0_2px_6px_rgba(107,8,18,0.04)] transition-all cursor-pointer group text-left"
          >
            <svg className="w-6 h-6 shrink-0 text-[#7A0916]" viewBox="0 0 28 28" fill="none">
              <path
                d="M9.5 4.5L14 10.5L18.5 4.5L20 9.5V23.5H15L14 21.5L13 23.5H8V9.5L9.5 4.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M14 10.5V21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M9.5 18.5H12M16 18.5H18.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="text-[13.5px] font-bold text-[#241614] group-hover:text-[#6B0812] truncate">
              কোটি
            </span>
          </button>

          {/* 5. শাড়ি */}
          <button
            type="button"
            onClick={() => {
              navigateTo('category-gallery', { width: '3.5', category: 'saree' });
              closeMenu();
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#FDFBF7] hover:bg-[#FAF2E6] border border-[#E6D8C5] shadow-[0_2px_6px_rgba(107,8,18,0.04)] transition-all cursor-pointer group text-left"
          >
            <svg className="w-6 h-6 shrink-0 text-[#7A0916]" viewBox="0 0 28 28" fill="none">
              <path
                d="M8 23.5L17.5 4.5L21.5 6.5L13 23.5H8Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 11.5C8.5 9.5 10.5 8 13.5 8M14.5 19.5H20.5V12.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[13.5px] font-bold text-[#241614] group-hover:text-[#6B0812] truncate">
              শাড়ি
            </span>
          </button>

          {/* 6. ব্লাউজ */}
          <button
            type="button"
            onClick={() => {
              navigateTo('category-gallery', { width: '3.5', category: 'short-kamiz' });
              closeMenu();
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#FDFBF7] hover:bg-[#FAF2E6] border border-[#E6D8C5] shadow-[0_2px_6px_rgba(107,8,18,0.04)] transition-all cursor-pointer group text-left"
          >
            <svg className="w-6 h-6 shrink-0 text-[#7A0916]" viewBox="0 0 28 28" fill="none">
              <path
                d="M9.5 7.5C11 10.5 13 11.5 14 11.5C15 11.5 17 10.5 18.5 7.5L23 10.5L21 15L18.5 13.5V20.5H9.5V13.5L7 15L5 10.5L9.5 7.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9.5 18H18.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span className="text-[13.5px] font-bold text-[#241614] group-hover:text-[#6B0812] truncate">
              ব্লাউজ
            </span>
          </button>
        </div>

        {/* Full-Width কাস্টম ডিজাইন Card */}
        <button
          type="button"
          onClick={() => {
            navigateTo('custom-design');
            closeMenu();
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] hover:bg-[#FAF2E6] border border-[#E6D8C5] text-[#241614] shadow-[0_2px_6px_rgba(107,8,18,0.04)] transition-all cursor-pointer group"
        >
          <span className="flex items-center gap-3">
            <Scissors className="w-[19px] h-[19px] text-[#7A0916] stroke-[2]" />
            <span className="text-[14px] font-bold text-[#241614] group-hover:text-[#6B0812]">
              কাস্টম ডিজাইন
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-[#6B0812] transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Section 2: সেবা ও অন্যান্য */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2 px-0.5">
          <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2.5L2.5 7.5L12 12.5L21.5 7.5L12 2.5Z"
              fill="#E2A84B"
              stroke="#7A0916"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2.5 12.5L12 17.5L21.5 12.5"
              stroke="#7A0916"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2.5 17L12 22L21.5 17"
              stroke="#7A0916"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[14px] font-bold text-[#7A0916] shrink-0">
            সেবা ও অন্যান্য
          </span>
          <span className="flex-1 h-[1.5px] bg-[#D5A64A]/80 rounded-full ml-1" />
        </div>

        <div className="space-y-2">
          {/* 1. অর্ডার ট্র্যাকিং */}
          <button
            type="button"
            onClick={() => {
              navigateTo('order-tracking');
              closeMenu();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] hover:bg-[#FAF2E6] border border-[#E6D8C5] text-[#241614] shadow-[0_2px_6px_rgba(107,8,18,0.04)] transition-all cursor-pointer group"
          >
            <span className="flex items-center gap-3">
              <Truck className="w-[19px] h-[19px] text-[#7A0916] stroke-[2]" />
              <span className="text-[14px] font-bold text-[#241614] group-hover:text-[#6B0812]">
                অর্ডার ট্র্যাকিং
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#6B0812] transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* 2. গজ হিসাব ক্যালকুলেটর */}
          <button
            type="button"
            onClick={() => {
              navigateTo('calculator');
              closeMenu();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] hover:bg-[#FAF2E6] border border-[#E6D8C5] text-[#241614] shadow-[0_2px_6px_rgba(107,8,18,0.04)] transition-all cursor-pointer group"
          >
            <span className="flex items-center gap-3">
              <Calculator className="w-[19px] h-[19px] text-[#7A0916] stroke-[2]" />
              <span className="text-[14px] font-bold text-[#241614] group-hover:text-[#6B0812]">
                গজ হিসাব ক্যালকুলেটর
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#6B0812] transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E6D9C8]">
      <div className="max-w-[1400px] mx-auto px-2.5 sm:px-6 lg:px-8">
        {/* TOP ROW: Brand Logo + Lockup, Desktop Search Bar & Action Icons */}
        <div className="py-2 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
          {/* Left: Fashion Doniya BD Brand Lockup */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="text-left group cursor-pointer focus:outline-hidden min-w-0"
            >
              <div className="min-w-0">
                <div className="font-['Playfair_Display'] text-[18px] sm:text-[28px] lg:text-[30px] font-bold tracking-tight leading-none whitespace-nowrap flex items-baseline">
                  <span className="text-[#6B0812]">Fashion</span>
                  <span className="relative inline-block font-['Great_Vibes'] font-normal text-[23px] sm:text-[35px] lg:text-[38px] text-[#A84A50] mx-1 sm:mx-1.5 leading-none tracking-normal">
                    Doniya
                    {/* Curved calligraphic underline swash */}
                    <svg
                      className="absolute left-[22%] bottom-[1px] sm:bottom-[2px] w-[52%] h-[5px] sm:h-[7px] text-[#A84A50] pointer-events-none"
                      viewBox="0 0 80 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 10.5C22 2.5 54 1.5 78 5.5C54 3.8 24 5.2 2 10.5Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <span className="text-[#C58B1E]">BD</span>
                </div>
                <p className="text-[9.5px] sm:text-[12.5px] font-medium text-[#7A5448] mt-0.5 sm:mt-1 tracking-normal text-left whitespace-nowrap">
                  প্রিমিয়াম কাপড়, এখন গজ হিসেবে
                </p>
              </div>
            </button>
          </div>

          {/* Center: Clean Search Bar (Tablet & Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl items-center bg-[#FFFDF9] border border-[#E5D7C4] rounded-full pl-4 pr-1.5 py-1 focus-within:border-[#C58B1E] transition-colors"
          >
            <Search className="w-4 h-4 text-[#6B0812]/70 shrink-0 mr-2.5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="কাপড়ের নাম, ডিজাইন বা ক্যাটাগরি খুঁজুন..."
              className="w-full bg-transparent text-sm text-[#2E1A18] placeholder-[#7A625A] focus:outline-hidden"
            />
            <button
              type="submit"
              aria-label="খুঁজুন"
              className="w-8 h-8 rounded-full bg-[#6B0812] hover:bg-[#56060E] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Right: Search (Mobile), Language (XL), Account, Wishlist & Shopping Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mobile Search Pill Button */}
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                if (!mobileSearchOpen) setMobileMenuOpen(false);
              }}
              className="md:hidden h-8 px-2.5 rounded-full bg-[#FFFDF9] border border-[#E5D7C4] hover:border-[#C58B1E] flex items-center gap-1 text-[#6B0812] text-[11px] font-medium transition-colors cursor-pointer shrink-0"
              aria-label="কাপড় খুঁজুন"
              title="খুঁজুন"
            >
              <Search className="w-3.5 h-3.5 stroke-[2]" />
              <span className="hidden xs:inline text-[#7A625A]">খুঁজুন</span>
            </button>

            {/* Language Switcher (Desktop XL) */}
            <button
              type="button"
              data-no-translate="true"
              onClick={() => setLang(lang === 'BN' ? 'EN' : 'BN')}
              className="hidden xl:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FFFDF9] border border-[#E5D7C4] text-xs font-semibold text-[#5C0811] hover:border-[#C58B1E] transition-colors cursor-pointer whitespace-nowrap"
              title="ভাষা পরিবর্তন / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#6B0812]" />
              <span className={lang === 'BN' ? 'text-[#6B0812] font-bold' : 'text-[#2E1A18]/60'}>
                বাংলা
              </span>
              <span className="text-[#D4C5B4]">|</span>
              <span className={lang === 'EN' ? 'text-[#6B0812] font-bold' : 'text-[#2E1A18]/60'}>
                EN
              </span>
            </button>

            {/* Account Button (Desktop/Tablet only; Mobile uses Bottom Nav) */}
            <button
              type="button"
              onClick={() => navigateTo('account')}
              className="hidden sm:flex sm:w-auto sm:h-auto sm:px-3.5 sm:py-2 rounded-full bg-[#FFFDF9] border border-[#E5D7C4] hover:border-[#C58B1E] text-[13px] font-semibold text-[#2E1A18] items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="কাস্টমার অ্যাকাউন্ট"
              aria-label="কাস্টমার অ্যাকাউন্ট"
            >
              <User className="w-4 h-4 text-[#6B0812]" />
              <span>
                {currentUser ? currentUser.fullName.split(' ')[0] : 'অ্যাকাউন্ট'}
              </span>
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={() => navigateTo('wishlist')}
              className="w-8 h-8 sm:w-auto sm:h-auto sm:px-3.5 sm:py-2 rounded-full bg-[#FFFDF9] border border-[#E5D7C4] hover:border-[#C58B1E] text-xs sm:text-[13px] font-semibold text-[#2E1A18] flex items-center justify-center gap-1.5 transition-colors relative cursor-pointer whitespace-nowrap shrink-0"
              title="উইশলিস্ট"
              aria-label="উইশলিস্ট"
            >
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6B0812] stroke-[2]" />
              <span className="hidden sm:inline">উইশলিস্ট</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 sm:static sm:ml-0.5 min-w-[15px] h-[15px] px-1 bg-[#6B0812] text-white text-[9px] font-bold rounded-full flex items-center justify-center tabular-nums">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Pill Button (Matches Laptop Style) */}
            <button
              type="button"
              onClick={() => navigateTo('cart')}
              className="h-8 sm:h-auto px-3 sm:px-4 sm:py-2 rounded-full bg-[#6B0812] hover:bg-[#56060E] text-white text-[11.5px] sm:text-[13.5px] font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
              title="শপিং কার্ট"
              aria-label="শপিং কার্ট"
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2] shrink-0" />
              <span className="tabular-nums">কার্ট ({cartItemCount})</span>
            </button>
          </div>
        </div>

        {/* MOBILE & TABLET NAVIGATION ROW (Laptop-Style "সকল ক্যাটাগরি" Pill + Clean Nav Links) */}
        <div className="lg:hidden flex items-center gap-3.5 py-2 border-t border-[#EFE4D4] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="px-3 py-1 rounded-full bg-[#6B0812] text-white text-[11px] font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <List className="w-3 h-3" />
            <span>সকল ক্যাটাগরি</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <nav className="flex items-center gap-4 text-[12px] font-semibold shrink-0 pr-2">
            {mainNavLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={link.onClick}
                className={`relative py-1 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                  link.isActive
                    ? 'text-[#6B0812] font-bold'
                    : 'text-[#241614] hover:text-[#6B0812]'
                }`}
              >
                {link.isHome && <Home className="w-3.5 h-3.5 text-[#6B0812]" />}
                <span>{link.label}</span>
                {link.isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6B0812] rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Collapsible Mobile Search Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-2.5 pt-0.5">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-[#FFFDF9] border border-[#D8C5AE] focus-within:border-[#6B0812] rounded-lg pl-3 pr-1 py-1"
            >
              <Search className="w-3.5 h-3.5 text-[#6B0812] shrink-0 mr-2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="কাপড়ের নাম, ডিজাইন বা ক্যাটাগরি খুঁজুন..."
                autoFocus
                className="w-full bg-transparent text-xs text-[#2E1A18] placeholder-[#7A625A] focus:outline-hidden"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="p-1 text-[#7A625A] hover:text-[#6B0812]"
                  aria-label="মুছুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="px-2.5 py-1 rounded-md bg-[#6B0812] text-white text-[11px] font-medium shrink-0 ml-1"
              >
                খুঁজুন
              </button>
            </form>
          </div>
        )}

        {/* SECOND ROW: All Categories Dropdown + Category Navigation Links (Desktop) */}
        <div className="hidden lg:flex items-center justify-between gap-6 py-2.5 border-t border-[#EFE4D4]">
          {/* Left: সকল ক্যাটাগরি Dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="px-5 py-2 rounded-full bg-[#6B0812] hover:bg-[#56060E] text-white text-sm font-semibold flex items-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <List className="w-4 h-4" />
              <span>সকল ক্যাটাগরি</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  categoryDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {categoryDropdownOpen && (
              <div className="absolute left-0 mt-2.5 w-[350px] bg-[#FAF6F0] rounded-2xl shadow-[0_14px_34px_-8px_rgba(107,8,18,0.18)] border border-[#E6D6C1] p-3.5 z-50">
                {renderCategorySectionMenu(() => setCategoryDropdownOpen(false))}
              </div>
            )}
          </div>

          {/* Right/Center Navigation Links */}
          <nav className="flex items-center justify-between flex-1 max-w-4xl text-[15px] font-semibold">
            {mainNavLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={link.onClick}
                className={`relative py-1.5 px-1 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  link.isActive
                    ? 'text-[#6B0812] font-bold'
                    : 'text-[#241614] hover:text-[#6B0812]'
                }`}
              >
                {link.isHome && <Home className="w-4 h-4 text-[#6B0812]" />}
                <span>{link.label}</span>
                {link.isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6B0812] rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile & Tablet Full-Page Category View */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FDFBF7] border-t border-[#EFE4D4] px-3.5 pt-4 pb-28 min-h-[calc(100dvh-82px)] overflow-y-auto">
          {renderCategorySectionMenu(() => setMobileMenuOpen(false))}
        </div>
      )}
    </header>
  );
};
