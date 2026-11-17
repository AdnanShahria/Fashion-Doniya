import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router';
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
  ChevronLeft,
  ChevronRight,
  Home,
  Tag,
  Scissors,
  Truck,
  Calculator
} from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();
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
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrolledDropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // High-stability scroll tracking & animated navbar state (from Ecomm-Demo)
  const [scrollNavState, setScrollNavState] = useState<'relaxed' | 'scrolled-down' | 'scrolled-up'>('relaxed');
  const scrollNavStateRef = useRef<'relaxed' | 'scrolled-down' | 'scrolled-up'>('relaxed');
  const lastScrollYRef = useRef(0);
  const accumulatedDeltaRef = useRef(0);
  const lastStateChangeTimeRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  // Keep ref synchronized with state to prevent stale closures
  useEffect(() => {
    scrollNavStateRef.current = scrollNavState;
  }, [scrollNavState]);

  // Reset scroll state on route change so every page starts relaxed with CategoryBar visible
  useEffect(() => {
    setScrollNavState('relaxed');
    scrollNavStateRef.current = 'relaxed';
    lastScrollYRef.current = typeof window !== 'undefined' ? window.scrollY : 0;
    accumulatedDeltaRef.current = 0;
    lastStateChangeTimeRef.current = 0;
    setCategoryDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const now = Date.now();

    setIsScrolled(currentScrollY > 12);

    // Guard: Ignore reflow scroll artifacts during the transition cooldown (420ms)
    if (now - lastStateChangeTimeRef.current < 420) {
      lastScrollYRef.current = currentScrollY <= 0 ? 0 : currentScrollY;
      return;
    }

    // Top of page threshold: always relaxed at the top
    if (currentScrollY <= 25) {
      accumulatedDeltaRef.current = 0;
      if (scrollNavStateRef.current !== 'relaxed') {
        scrollNavStateRef.current = 'relaxed';
        lastStateChangeTimeRef.current = now;
        setScrollNavState('relaxed');
      }
      lastScrollYRef.current = currentScrollY <= 0 ? 0 : currentScrollY;
      return;
    }

    const delta = currentScrollY - lastScrollYRef.current;
    lastScrollYRef.current = currentScrollY <= 0 ? 0 : currentScrollY;

    // Accumulate delta in consistent direction, reset on flip
    if ((delta > 0 && accumulatedDeltaRef.current < 0) || (delta < 0 && accumulatedDeltaRef.current > 0)) {
      accumulatedDeltaRef.current = delta;
    } else {
      accumulatedDeltaRef.current += delta;
    }

    // Scrolling downward: user intentionally scrolled down > 30px and is past top zone
    if (accumulatedDeltaRef.current > 30 && currentScrollY > 70) {
      if (scrollNavStateRef.current !== 'scrolled-down') {
        scrollNavStateRef.current = 'scrolled-down';
        lastStateChangeTimeRef.current = now;
        accumulatedDeltaRef.current = 0;
        setScrollNavState('scrolled-down');
        setCategoryDropdownOpen(false);
      }
    }
    // Scrolling upward: user intentionally scrolled up > 35px
    else if (accumulatedDeltaRef.current < -35 && currentScrollY > 25) {
      if (scrollNavStateRef.current !== 'scrolled-up') {
        scrollNavStateRef.current = 'scrolled-up';
        lastStateChangeTimeRef.current = now;
        accumulatedDeltaRef.current = 0;
        setScrollNavState('scrolled-up');
      }
    }
  }, []);

  const onScroll = useCallback(() => {
    if (rafIdRef.current === null) {
      rafIdRef.current = window.requestAnimationFrame(() => {
        handleScroll();
        rafIdRef.current = null;
      });
    }
  }, [handleScroll]);

  // High-stability scroll tracking immune to DOM reflow feedback loops across all storefront pages
  useEffect(() => {
    lastScrollYRef.current = typeof window !== 'undefined' ? window.scrollY : 0;
    accumulatedDeltaRef.current = 0;
    lastStateChangeTimeRef.current = 0;

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [onScroll]);

  const scrollNav = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCategoryTriggerClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileMenuOpen((prev) => !prev);
      setCategoryDropdownOpen(false);
    } else {
      setCategoryDropdownOpen((prev) => !prev);
      setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    setSearchInput(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyDocumentLanguage(lang);
    }, 20);
    return () => window.clearTimeout(timer);
  }, [currentPage, selectedWidthFilter, selectedCategory, lang]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideRelaxed = dropdownRef.current?.contains(target);
      const insideScrolled = scrolledDropdownRef.current?.contains(target);
      if (!insideRelaxed && !insideScrolled) {
        setCategoryDropdownOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCategoryDropdownOpen(false);
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
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

  const resolveHeaderHref = (page: string): string => {
    if (page === 'home') return '/';
    if (page === 'shop-3-5') return '/fabric/3.5-bahar';
    if (page === 'shop-2-5') return '/fabric/2.5-bahar';
    return `/${page}`;
  };

  const defaultMainNavLinks = [
    {
      label: 'হোম',
      to: '/',
      isHome: true,
      isActive: currentPage === 'home'
    },
    {
      label: '৩.৫ বহর কাপড়',
      to: '/fabric/3.5-bahar',
      isActive: currentPage === 'fabric-width' && selectedWidthFilter === '3.5'
    },
    {
      label: '২.৫ বহর কাপড়',
      to: '/fabric/2.5-bahar',
      isActive: currentPage === 'fabric-width' && selectedWidthFilter === '2.5'
    },
    {
      label: 'সকল কাপড়',
      to: '/shop',
      isActive: currentPage === 'shop'
    },
    {
      label: 'শাড়ি',
      to: '/fabric/3.5-bahar/saree',
      isActive: currentPage === 'category-gallery' && selectedCategory === 'saree'
    },
    {
      label: 'কামিজ',
      to: '/fabric/3.5-bahar/kamiz',
      isActive: currentPage === 'category-gallery' && selectedCategory === 'kamiz'
    },
    {
      label: 'গাউন / লেহেঙ্গা',
      to: '/fabric/3.5-bahar/gown-lehenga',
      isActive: currentPage === 'category-gallery' && selectedCategory === 'gown-lehenga'
    },
    {
      label: 'কাস্টম ডিজাইন',
      to: '/custom-design',
      isActive: currentPage === 'custom-design'
    },
    {
      label: 'গজ হিসাব',
      to: '/calculator',
      isActive: currentPage === 'calculator'
    }
  ];

  const customHeaderItems = (settings.navigationConfig?.headerItems || [])
    .filter((item) => item.isActive !== false && item.page !== 'fabric-to-outfit' && item.label !== 'এআই আউটফিট')
    .sort((a, b) => a.order - b.order);

  // Use custom navigation whenever Admin configured headerItems, otherwise use default links
  const mainNavLinks =
    customHeaderItems.length > 0
      ? customHeaderItems.map((item) => ({
          label: item.label,
          to: resolveHeaderHref(item.page),
          isHome: item.page === 'home',
          page: item.page,
          highlightGold: item.highlightGold || item.page === 'calculator',
          isActive:
            item.page === 'shop-3-5'
              ? currentPage === 'fabric-width' && selectedWidthFilter === '3.5'
              : item.page === 'shop-2-5'
              ? currentPage === 'fabric-width' && selectedWidthFilter === '2.5'
              : currentPage === item.page
        }))
      : defaultMainNavLinks.map((item) => ({
          ...item,
          page: item.to.replace('/', '') || 'home',
          highlightGold: item.to === '/calculator'
        }));

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
          <Link
            to="/fabric/3.5-bahar/kamiz"
            onClick={closeMenu}
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
          </Link>

          {/* 2. শর্ট কামিজ */}
          <Link
            to="/fabric/3.5-bahar/short-kamiz"
            onClick={closeMenu}
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
          </Link>

          {/* 3. গাউন / লেহেঙ্গা */}
          <Link
            to="/fabric/3.5-bahar/gown-lehenga"
            onClick={closeMenu}
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
          </Link>

          {/* 4. কোটি */}
          <Link
            to="/fabric/3.5-bahar/long-koti"
            onClick={closeMenu}
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
          </Link>

          {/* 5. শাড়ি */}
          <Link
            to="/fabric/3.5-bahar/saree"
            onClick={closeMenu}
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
          </Link>

          {/* 6. ব্লাউজ */}
          <Link
            to="/custom-design"
            onClick={closeMenu}
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
          </Link>
        </div>

        {/* Full-Width কাস্টম ডিজাইন Card */}
        <Link
          to="/custom-design"
          onClick={closeMenu}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] hover:bg-[#FAF2E6] border border-[#E6D8C5] text-[#241614] shadow-[0_2px_6px_rgba(107,8,18,0.04)] transition-all cursor-pointer group"
        >
          <span className="flex items-center gap-3">
            <Scissors className="w-[19px] h-[19px] text-[#7A0916] stroke-[2]" />
            <span className="text-[14px] font-bold text-[#241614] group-hover:text-[#6B0812]">
              কাস্টম ডিজাইন
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-[#6B0812] transition-transform group-hover:translate-x-0.5" />
        </Link>
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
          <Link
            to="/order-tracking"
            onClick={closeMenu}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] hover:bg-[#FAF2E6] border border-[#E6D8C5] text-[#241614] shadow-[0_2px_6px_rgba(107,8,18,0.04)] transition-all cursor-pointer group"
          >
            <span className="flex items-center gap-3">
              <Truck className="w-[19px] h-[19px] text-[#7A0916] stroke-[2]" />
              <span className="text-[14px] font-bold text-[#241614] group-hover:text-[#6B0812]">
                অর্ডার ট্র্যাকিং
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#6B0812] transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* 2. গজ হিসাব ক্যালকুলেটর */}
          <Link
            to="/calculator"
            onClick={closeMenu}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FDFBF7] hover:bg-[#FAF2E6] border border-[#E6D8C5] text-[#241614] shadow-[0_2px_6px_rgba(107,8,18,0.04)] transition-all cursor-pointer group"
          >
            <span className="flex items-center gap-3">
              <Calculator className="w-[19px] h-[19px] text-[#7A0916] stroke-[2]" />
              <span className="text-[14px] font-bold text-[#241614] group-hover:text-[#6B0812]">
                গজ হিসাব ক্যালকুলেটর
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-[#6B0812] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );

  const isScrolledDown = scrollNavState === 'scrolled-down';
  const showCategoryBar = scrollNavState !== 'scrolled-down';
  const showNavbarHamburger = scrollNavState === 'scrolled-down';

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* 1. TOP ROW: Brand Logo + Lockup, Desktop Search Bar & Action Icons */}
      <div
        className={`relative z-20 w-full glass-functional border-b transition-all duration-300 ${
          isScrolled
            ? 'border-[#DFCBB2]/90 shadow-[0_4px_20px_rgba(36,22,20,0.08)] bg-[#FFFDF9]/98'
            : 'border-[#E6D9C8]/85 bg-[#FFFDF9]/95'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="py-2 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
            
            {/* Left: Brand Logo & Category Hamburger Trigger (slides in on scroll-down) */}
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
              {/* Category Drawer Trigger (5 Lines) with Apple-grade arrival when scrolled down */}
              <div 
                className={`relative transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center shrink-0 transform-gpu ${
                  showNavbarHamburger 
                    ? 'w-10 sm:w-11 max-w-11 opacity-100 -ml-1 sm:mr-1' 
                    : 'w-0 max-w-0 opacity-0 ml-0 pointer-events-none'
                }`}
                ref={scrolledDropdownRef}
              >
                <button
                  type="button"
                  onClick={handleCategoryTriggerClick}
                  aria-expanded={categoryDropdownOpen && showNavbarHamburger}
                  className={`group p-2 sm:p-2.5 bg-[#FFFDF9]/95 hover:bg-[#FAF2E6] active:bg-[#F5E8D3] text-[#241614] rounded-xl border border-[#DFCBB2] hover:border-[#8A5A10] shadow-[0_1.5px_3px_rgba(36,22,20,0.06),inset_0_1px_0.5px_rgba(255,255,255,0.9)] transition-all duration-300 cursor-pointer flex items-center justify-center active:scale-[0.93] select-none transform-gpu ${
                    showNavbarHamburger 
                      ? 'translate-x-0 opacity-100 scale-100 pointer-events-auto' 
                      : '-translate-x-8 opacity-0 scale-90 pointer-events-none'
                  }`}
                  aria-label="সকল ক্যাটাগরি"
                  title="সকল ক্যাটাগরি"
                >
                  {/* Bespoke 5-Line Icon */}
                  <div className="flex flex-col justify-center gap-[2px] w-3.5">
                    <span className="h-[2px] w-[14px] bg-[#6B0812] rounded-full transition-all duration-200 group-hover:bg-[#8A5A10]" />
                    <span className="h-[2px] w-[10px] bg-[#6B0812] rounded-full transition-all duration-200 group-hover:w-[13px] group-hover:bg-[#8A5A10]" />
                    <span className="h-[2px] w-[6px] bg-[#6B0812] rounded-full transition-all duration-200 group-hover:w-[10px] group-hover:bg-[#8A5A10]" />
                    <span className="h-[2px] w-[10px] bg-[#6B0812] rounded-full transition-all duration-200 group-hover:w-[13px] group-hover:bg-[#8A5A10]" />
                    <span className="h-[2px] w-[14px] bg-[#6B0812] rounded-full transition-all duration-200 group-hover:bg-[#8A5A10]" />
                  </div>
                </button>

                {/* Scrolled-mode category dropdown */}
                {categoryDropdownOpen && showNavbarHamburger && (
                  <div className="hidden lg:block absolute left-0 top-full mt-2.5 w-[356px] bg-[#FFFDF9]/98 backdrop-blur-xl rounded-2xl shadow-[0_18px_42px_-10px_rgba(36,22,20,0.22)] border border-[#E6D6C1] p-3.5 z-50">
                    {renderCategorySectionMenu(() => setCategoryDropdownOpen(false))}
                  </div>
                )}
              </div>

              {/* Fashion Doniya BD Brand Lockup */}
              <Link
                to="/"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCategoryDropdownOpen(false);
                }}
                className="block text-left group cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] focus-visible:ring-offset-2 min-w-0"
              >
                <div className="min-w-0">
                  <div className="font-['Playfair_Display'] text-[18px] sm:text-[28px] lg:text-[30px] font-bold tracking-tight leading-none whitespace-nowrap flex items-baseline">
                    <span className="text-[#6B0812]">Fashion</span>
                    <span className="relative inline-block font-['Great_Vibes'] font-normal text-[23px] sm:text-[35px] lg:text-[38px] text-[#9E3D43] mx-1 sm:mx-1.5 leading-none tracking-normal">
                      Doniya
                      {/* Curved calligraphic underline swash */}
                      <svg
                        className="absolute left-[22%] bottom-[1px] sm:bottom-[2px] w-[52%] h-[5px] sm:h-[7px] text-[#9E3D43] pointer-events-none"
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
                    <span className="text-[#9E690C]">BD</span>
                  </div>
                  <p className="text-[10px] sm:text-[12.5px] font-medium text-[#5E4037] mt-0.5 sm:mt-1 tracking-normal text-left whitespace-nowrap">
                    প্রিমিয়াম কাপড়, এখন গজ হিসেবে
                  </p>
                </div>
              </Link>
            </div>

            {/* Center: Clean Search Bar (Tablet & Desktop) */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-xl items-center bg-[#FFFDF9]/95 border border-[#DFCBB2] rounded-full pl-4 pr-1.5 py-1 shadow-[inset_0_1px_2px_rgba(36,22,20,0.04)] focus-within:border-[#8A5A10] focus-within:ring-2 focus-within:ring-[#C59B48]/25 transition-all"
            >
              <Search className="w-4 h-4 text-[#6B0812]/75 shrink-0 mr-2.5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="কাপড়ের নাম, ডিজাইন বা ক্যাটাগরি খুঁজুন..."
                aria-label="কাপড় খুঁজুন"
                className="w-full bg-transparent text-sm text-[#241614] placeholder-[#6E5750] focus:outline-none"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  aria-label="সার্চ মুছুন"
                  className="w-7 h-7 rounded-full text-[#6E5750] hover:text-[#6B0812] hover:bg-[#FAF6F0] flex items-center justify-center mr-1 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                aria-label="খুঁজুন"
                className="w-8 h-8 rounded-full bg-[#6B0812] hover:bg-[#53050D] active:scale-95 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
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
                className="md:hidden h-9 px-2.5 rounded-full bg-[#FFFDF9]/90 border border-[#DFCBB2] hover:border-[#8A5A10] flex items-center gap-1.5 text-[#6B0812] text-xs font-semibold transition-all active:scale-95 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
                aria-label="কাপড় খুঁজুন"
                title="খুঁজুন"
              >
                <Search className="w-3.5 h-3.5 stroke-[2]" />
                <span className="hidden xs:inline text-[#5E4037]">খুঁজুন</span>
              </button>

              {/* Language Switcher (Desktop XL) */}
              <button
                type="button"
                data-no-translate="true"
                onClick={() => setLang(lang === 'BN' ? 'EN' : 'BN')}
                className="hidden xl:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FFFDF9]/90 border border-[#DFCBB2] text-xs font-semibold text-[#5C0811] hover:border-[#8A5A10] hover:bg-[#FFFDF9] transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
                title="ভাষা পরিবর্তন / Switch Language"
              >
                <Globe className="w-3.5 h-3.5 text-[#6B0812]" />
                <span className={lang === 'BN' ? 'text-[#6B0812] font-bold' : 'text-[#5E4037]'}>
                  বাংলা
                </span>
                <span className="text-[#D4C5B4]">|</span>
                <span className={lang === 'EN' ? 'text-[#6B0812] font-bold' : 'text-[#5E4037]'}>
                  EN
                </span>
              </button>

              {/* Account Button (Desktop/Tablet only; Mobile uses Bottom Nav) */}
              <Link
                to="/account"
                className="hidden sm:flex sm:w-auto sm:h-9 sm:px-3.5 rounded-full bg-[#FFFDF9]/90 border border-[#DFCBB2] hover:border-[#8A5A10] hover:bg-[#FAF8F5] active:scale-95 text-[13px] font-semibold text-[#241614] items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
                title="কাস্টমার অ্যাকাউন্ট"
                aria-label="কাস্টমার অ্যাকাউন্ট"
              >
                <User className="w-4 h-4 text-[#6B0812]" />
                <span>
                  {currentUser ? currentUser.fullName.split(' ')[0] : 'অ্যাকাউন্ট'}
                </span>
              </Link>

              {/* Wishlist Button */}
              <Link
                to="/wishlist"
                className="w-9 h-9 sm:w-auto sm:h-9 sm:px-3.5 rounded-full bg-[#FFFDF9]/90 border border-[#DFCBB2] hover:border-[#8A5A10] hover:bg-[#FAF8F5] text-xs sm:text-[13px] font-semibold text-[#241614] flex items-center justify-center gap-1.5 transition-all active:scale-95 relative cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10]"
                title="উইশলিস্ট"
                aria-label="উইশলিস্ট"
              >
                <Heart className="w-4 h-4 text-[#6B0812] stroke-[2]" />
                <span className="hidden sm:inline">উইশলিস্ট</span>
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 sm:static sm:ml-0.5 min-w-[17px] h-[17px] px-1 bg-[#6B0812] text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Shopping Cart Pill Button (Primary Prominent Header Action) */}
              <Link
                to="/cart"
                className="h-10 px-4 rounded-full bg-[#6B0812] hover:bg-[#53050D] active:scale-[0.97] text-white text-xs sm:text-[13.5px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-[0_4px_14px_rgba(107,8,18,0.25),inset_0_1px_0_rgba(255,255,255,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A5A10] focus-visible:ring-offset-2"
                title="শপিং কার্ট"
                aria-label="শপিং কার্ট"
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2] shrink-0" />
                <span className="tabular-nums">কার্ট ({cartItemCount})</span>
              </Link>
            </div>
          </div>

          {/* Collapsible Mobile Search Bar */}
          {mobileSearchOpen && (
            <div className="md:hidden pb-2.5 pt-0.5">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center bg-[#FFFDF9] border border-[#D8C5AE] focus-within:border-[#6B0812] focus-within:ring-2 focus-within:ring-[#C59B48]/25 rounded-full pl-3.5 pr-1 py-1"
              >
                <Search className="w-3.5 h-3.5 text-[#6B0812] shrink-0 mr-2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="কাপড়ের নাম, ডিজাইন বা ক্যাটাগরি খুঁজুন..."
                  autoFocus
                  className="w-full bg-transparent text-xs text-[#241614] placeholder-[#6E5750] focus:outline-none"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput('')}
                    className="p-1.5 text-[#6E5750] hover:text-[#6B0812] cursor-pointer"
                    aria-label="মুছুন"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-full bg-[#6B0812] text-white text-xs font-semibold shrink-0 ml-1 cursor-pointer"
                >
                  খুঁজুন
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* 2. SECONDARY BAR: All Categories Dropdown + Scrolling Nav Pill Cards (Hides on scroll-down, reappears on scroll-up) */}
      <div 
        className={`relative z-10 transition-all duration-450 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu will-change-[transform,max-height,opacity] ${
          showCategoryBar 
            ? 'max-h-[64px] opacity-100 translate-y-0 overflow-visible' 
            : 'max-h-0 opacity-0 -translate-y-full pointer-events-none overflow-hidden'
        }`}
      >
        <div 
          className={`w-full backdrop-blur-xl border-b border-[#EFE4D4]/80 bg-[#FFFDF9]/95 shadow-[0_4px_12px_rgba(36,22,20,0.02)] transition-all duration-450 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu ${
            isScrolledDown ? '-translate-y-8 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 pointer-events-auto'
          }`}
        >
          <div className="max-w-[1400px] mx-auto px-2.5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-1.5 sm:py-2">
              
              {/* Left: সকল ক্যাটাগরি Dropdown Trigger */}
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={handleCategoryTriggerClick}
                  aria-expanded={categoryDropdownOpen && !showNavbarHamburger}
                  className={`group flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#6B0812] hover:bg-[#53050D] active:scale-[0.96] text-white text-xs sm:text-[13px] font-semibold transition-all duration-200 shadow-2xs border border-[#6B0812] select-none cursor-pointer transform-gpu ${
                    isScrolledDown
                      ? '-translate-y-6 opacity-0 scale-95 pointer-events-none'
                      : 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
                  }`}
                  aria-label="সকল ক্যাটাগরি"
                  title="সকল ক্যাটাগরি"
                >
                  {/* Bespoke 5-Line Design */}
                  <div className="flex flex-col justify-center gap-[2px] w-3.5 shrink-0">
                    <span className="h-[2px] w-[14px] bg-white rounded-full transition-all duration-200 group-hover:bg-[#E8C27B]" />
                    <span className="h-[2px] w-[10px] bg-white rounded-full transition-all duration-200 group-hover:w-[12px] group-hover:bg-[#E8C27B]" />
                    <span className="h-[2px] w-[6px] bg-white rounded-full transition-all duration-200 group-hover:w-[9px] group-hover:bg-[#E8C27B]" />
                    <span className="h-[2px] w-[10px] bg-white rounded-full transition-all duration-200 group-hover:w-[12px] group-hover:bg-[#E8C27B]" />
                    <span className="h-[2px] w-[14px] bg-white rounded-full transition-all duration-200 group-hover:bg-[#E8C27B]" />
                  </div>
                  <span>সকল ক্যাটাগরি</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      categoryDropdownOpen && !showNavbarHamburger ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {categoryDropdownOpen && !showNavbarHamburger && (
                  <div className="hidden lg:block absolute left-0 top-full mt-2.5 w-[356px] bg-[#FFFDF9]/98 backdrop-blur-xl rounded-2xl shadow-[0_18px_42px_-10px_rgba(36,22,20,0.22)] border border-[#E6D6C1] p-3.5 z-50">
                    {renderCategorySectionMenu(() => setCategoryDropdownOpen(false))}
                  </div>
                )}
              </div>

              {/* Left scroll control for desktop */}
              <button
                type="button"
                onClick={() => scrollNav('left')}
                className={`hidden md:flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[#6B0812] hover:text-[#53050D] hover:bg-[#FAF2E6] active:scale-95 transition-all duration-200 flex-shrink-0 cursor-pointer border border-[#DFCBB2]/70 shadow-2xs ${
                  isScrolledDown ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
                }`}
                aria-label="Scroll left"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Horizontal Scrolling Card Strip */}
              <div
                ref={scrollContainerRef}
                className={`flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-grow py-0.5 px-0.5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu ${
                  isScrolledDown
                    ? '-translate-x-12 opacity-0 pointer-events-none'
                    : 'translate-x-0 opacity-100 delay-100 pointer-events-auto'
                }`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {mainNavLinks.map((link) => {
                  const isGold = link.highlightGold;
                  return (
                    <Link
                      key={link.label}
                      to={link.to}
                      onClick={() => {
                        setCategoryDropdownOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 flex items-center gap-1.5 min-h-[32px] sm:min-h-[34px] active:scale-[0.96] cursor-pointer shadow-2xs border select-none ${
                        link.isActive
                          ? 'bg-[#6B0812]/10 text-[#6B0812] border-[#6B0812]/30 font-bold shadow-xs'
                          : isGold
                          ? 'bg-[#FFF8EC] border-[#E8C27B] text-[#8A5A10] hover:bg-[#FDF2D9] font-bold shadow-2xs'
                          : 'bg-[#FFFDF9]/90 border-[#DFCBB2]/70 hover:bg-[#FAF2E6] text-[#241614] hover:text-[#6B0812] hover:border-[#8A5A10]/50'
                      }`}
                    >
                      {link.isHome && <Home className="w-3.5 h-3.5 text-current shrink-0" />}
                      {link.page === 'calculator' && <Calculator className="w-3.5 h-3.5 text-current shrink-0" />}
                      {link.page === 'custom-design' && <Scissors className="w-3.5 h-3.5 text-current shrink-0" />}
                      {link.page === 'fabric-width' && <Tag className="w-3.5 h-3.5 text-current shrink-0" />}
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Right scroll control for desktop */}
              <button
                type="button"
                onClick={() => scrollNav('right')}
                className={`hidden md:flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[#6B0812] hover:text-[#53050D] hover:bg-[#FAF2E6] active:scale-95 transition-all duration-200 flex-shrink-0 cursor-pointer border border-[#DFCBB2]/70 shadow-2xs ${
                  isScrolledDown ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
                }`}
                aria-label="Scroll right"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mobile & Tablet Full-Page Category View */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF6F0]/98 backdrop-blur-xl border-t border-[#EFE4D4] px-3.5 pt-4 pb-28 min-h-[calc(100dvh-82px)] overflow-y-auto">
          {renderCategorySectionMenu(() => setMobileMenuOpen(false))}
        </div>
      )}
    </header>
  );
};
