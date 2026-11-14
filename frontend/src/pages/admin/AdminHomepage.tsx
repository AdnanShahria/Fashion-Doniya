import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { settingsService } from '../../services/settingsService';
import { productService } from '../../services/productService';
import { uploadAdminImage } from '../../services/uploadService';
import {
  HomepageConfig,
  HeroSlideConfig,
  HomepageSectionConfig,
  PromotionalBannerConfig,
  FabricWidthCardConfig,
  Product
} from '../../types';
import { INITIAL_HOMEPAGE_CONFIG, INITIAL_FABRIC_WIDTH_CARDS } from '../../data/seedData';
import {
  Monitor,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Layers,
  Star,
  Ruler,
  RotateCcw
} from 'lucide-react';

export const AdminHomepage: React.FC = () => {
  const { settings, products, refreshData, showToast } = useStore();

  const [homepageConfig, setHomepageConfig] = useState<HomepageConfig>(() => {
    const existing = settings.homepageConfig || INITIAL_HOMEPAGE_CONFIG;
    const clone: HomepageConfig = JSON.parse(JSON.stringify(existing));
    if (!clone.fabricWidthCards || clone.fabricWidthCards.length === 0) {
      clone.fabricWidthCards = JSON.parse(JSON.stringify(INITIAL_FABRIC_WIDTH_CARDS));
    }
    return clone;
  });

  const [activeSubTab, setActiveSubTab] = useState<
    'hero' | 'fabric-width' | 'sections' | 'banners' | 'curated-products'
  >('hero');

  const handleSaveHomepageConfig = () => {
    const firstSlide = homepageConfig.heroSlides[0];
    settingsService.updateSettings({
      homepageConfig,
      heroTitle: firstSlide
        ? `${firstSlide.headlineDesktop1} ${firstSlide.headlineDesktop2}`.trim()
        : settings.heroTitle,
      heroDescription: firstSlide?.subheadline || settings.heroDescription,
      heroButtonPrimaryText: firstSlide?.ctaPrimary || settings.heroButtonPrimaryText,
      heroButtonSecondaryText: firstSlide?.ctaSecondary || settings.heroButtonSecondaryText
    });
    refreshData();
    showToast('হোমপেজ কনফিগারেশন সফলভাবে সংরক্ষিত ও লাইভ হয়েছে!', 'success');
  };

  // Hero Slides Helpers
  const updateSlide = (idx: number, patch: Partial<HeroSlideConfig>) => {
    setHomepageConfig((prev) => {
      const nextSlides = [...prev.heroSlides];
      nextSlides[idx] = { ...nextSlides[idx], ...patch };
      return { ...prev, heroSlides: nextSlides };
    });
  };

  const handleSlideImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAdminImage(file);
      updateSlide(idx, { image: url });
      showToast('হিরো স্লাইডের ছবি আপলোড হয়েছে', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'ছবি আপলোড ব্যর্থ হয়েছে', 'error');
    }
    e.target.value = '';
  };

  const addHeroSlide = () => {
    const newSlide: HeroSlideConfig = {
      id: `slide-${Date.now()}`,
      image: '/assets/aistudio/image_ebb4447e.png',
      badge: 'PREMIUM FABRIC COLLECTION',
      headlineMobile1: 'পোশাকে ফুটুক আপনার আভিজাত্য',
      headlineMobile2: 'ঐতিহ্যে আধুনিকতা',
      headlineDesktop1: 'আপনার পছন্দের কাপড়,',
      headlineDesktop2: 'এখন গজ হিসেবে',
      subheadline: 'প্রিমিয়াম মানের কাপড় বেছে নিন আপনার পছন্দের ডিজাইন ও পোশাক তৈরির জন্য।',
      priceHighlight:
        'প্রিমিয়াম মানের জামদানি, সিল্ক ও আকর্ষণীয় ডিজাইনের কাপড় বেছে নিন আপনার পছন্দের পোশাক তৈরির জন্য।',
      ctaPrimary: 'কাপড় কিনুন',
      ctaSecondary: 'গজ হিসাব করুন',
      ctaPrimaryPage: 'shop',
      ctaSecondaryPage: 'calculator',
      isActive: true
    };
    setHomepageConfig((prev) => ({
      ...prev,
      heroSlides: [...prev.heroSlides, newSlide]
    }));
  };

  const removeHeroSlide = (idx: number) => {
    if (homepageConfig.heroSlides.length <= 1) {
      showToast('কমপক্ষে ১টি হিরো স্লাইড থাকা আবশ্যক', 'error');
      return;
    }
    setHomepageConfig((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.filter((_, i) => i !== idx)
    }));
  };

  // Sections Helpers
  const moveSection = (idx: number, dir: -1 | 1) => {
    setHomepageConfig((prev) => {
      const sorted = [...prev.sections].sort((a, b) => a.order - b.order);
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= sorted.length) return prev;
      const [moved] = sorted.splice(idx, 1);
      sorted.splice(targetIdx, 0, moved);
      const reindexed = sorted.map((s, i) => ({ ...s, order: i + 1 }));
      return { ...prev, sections: reindexed };
    });
  };

  const updateSection = (id: string, patch: Partial<HomepageSectionConfig>) => {
    setHomepageConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s))
    }));
  };

  // Fabric Width Cards Helpers
  const updateFabricWidthCard = (idx: number, patch: Partial<FabricWidthCardConfig>) => {
    setHomepageConfig((prev) => {
      const existingCards =
        prev.fabricWidthCards && prev.fabricWidthCards.length > 0
          ? [...prev.fabricWidthCards]
          : JSON.parse(JSON.stringify(INITIAL_FABRIC_WIDTH_CARDS));
      existingCards[idx] = { ...existingCards[idx], ...patch };
      return { ...prev, fabricWidthCards: existingCards };
    });
  };

  const handleFabricCardImageUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAdminImage(file);
      updateFabricWidthCard(idx, { fabricImage: url });
      showToast('বহর কার্ডের ছবি সফলভাবে আপলোড হয়েছে', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'ছবি আপলোড ব্যর্থ হয়েছে', 'error');
    }
    e.target.value = '';
  };

  const resetFabricCardToDefault = (idx: number) => {
    const defCard = INITIAL_FABRIC_WIDTH_CARDS[idx];
    if (defCard) {
      updateFabricWidthCard(idx, { ...defCard });
      showToast('ডিফল্ট তথ্যে সফলভাবে রিসেট হয়েছে', 'info');
    }
  };

  // Promotional Banners Helpers
  const addPromoBanner = () => {
    const newBanner: PromotionalBannerConfig = {
      id: `promo-${Date.now()}`,
      badge: 'বিশেষ অফার',
      title: 'ঈদ ও ফেস্টিভ কালেকশনে বিশেষ ছাড়!',
      subtitle: '৳২৫০০+ অর্ডারে সারা বাংলাদেশে সম্পূর্ণ ফ্রি হোম ডেলিভারি।',
      buttonText: 'কালেকশন দেখুন',
      buttonPage: 'shop',
      backgroundImage: '/assets/aistudio/image_ebb4447e.png',
      isActive: true
    };
    setHomepageConfig((prev) => ({
      ...prev,
      promotionalBanners: [...(prev.promotionalBanners || []), newBanner]
    }));
  };

  const updatePromoBanner = (id: string, patch: Partial<PromotionalBannerConfig>) => {
    setHomepageConfig((prev) => ({
      ...prev,
      promotionalBanners: (prev.promotionalBanners || []).map((b) =>
        b.id === id ? { ...b, ...patch } : b
      )
    }));
  };

  const removePromoBanner = (id: string) => {
    setHomepageConfig((prev) => ({
      ...prev,
      promotionalBanners: (prev.promotionalBanners || []).filter((b) => b.id !== id)
    }));
  };

  // Product Flag Toggle (Featured, Best Seller, New Arrival)
  const toggleProductFlag = (
    prod: Product,
    flag: 'isFeatured' | 'isBestSeller' | 'isNewArrival'
  ) => {
    const updated: Product = { ...prod, [flag]: !prod[flag] };
    productService.saveProduct(updated);
    refreshData();
    showToast(`"${prod.name}" আপডেট হয়েছে`, 'info');
  };

  const sortedSections = [...homepageConfig.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#242424]">
            হোমপেজ ম্যানেজমেন্ট (Homepage Management)
          </h2>
          <p className="text-xs text-[#242424]/60 mt-0.5">
            হিরো স্লাইডার, সেকশন শিরোনাম, সেকশন ক্রম (Show/Hide & Order), প্রোমোশনাল ব্যানার এবং ফিচার্ড/বেস্ট-সেলার পণ্য নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveHomepageConfig}
          className="px-5 py-2.5 bg-[#850B1B] hover:bg-[#6B0812] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4 text-[#D5A64A]" />
          <span>হোমপেজ পরিবর্তন সংরক্ষণ করুন</span>
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-[#EDE5D9]">
        {[
          { id: 'hero', label: '১. হিরো স্লাইডার ও ব্যানার', icon: Monitor },
          { id: 'fabric-width', label: '২. বহর অনুযায়ী কাপড় ব্যানার কার্ড (৩.৫ ও ২.৫ বহর)', icon: Ruler },
          { id: 'sections', label: '৩. সেকশন শিরোনাম, দৃশ্যমানতা ও ক্রম', icon: Layers },
          { id: 'banners', label: '৪. প্রোমোশনাল ব্যানার সমূহ', icon: ImageIcon },
          { id: 'curated-products', label: '৫. ফিচার্ড, বেস্ট-সেলার ও নিউ অ্যারাইভাল পণ্য', icon: Star }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                active
                  ? 'bg-[#242424] text-white font-bold shadow-2xs'
                  : 'text-[#242424]/75 hover:bg-[#FAF8F4]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#C5A46D]' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HERO SLIDES */}
      {activeSubTab === 'hero' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#242424]">
              হিরো সেকশন স্লাইড সমূহ ({homepageConfig.heroSlides.length}টি)
            </h3>
            <button
              type="button"
              onClick={addHeroSlide}
              className="px-3.5 py-2 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন স্লাইড যোগ করুন</span>
            </button>
          </div>

          <div className="space-y-4">
            {homepageConfig.heroSlides.map((slide, idx) => (
              <div
                key={slide.id}
                className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE5D9] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#850B1B] text-white font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm text-[#242424]">
                      {slide.headlineDesktop1} {slide.headlineDesktop2}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={slide.isActive !== false}
                        onChange={(e) => updateSlide(idx, { isActive: e.target.checked })}
                        className="accent-emerald-600"
                      />
                      <span>সক্রিয়</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeHeroSlide(idx)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                      title="স্লাইড মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Slide Image Preview & Upload */}
                  <div className="md:col-span-4 space-y-2">
                    <div className="aspect-[16/10] rounded-lg overflow-hidden border border-[#EDE5D9] bg-[#FAF8F4] flex items-center justify-center">
                      <img
                        src={slide.image || '/assets/aistudio/image_0746490e.png'}
                        alt={slide.headlineDesktop1}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-[#242424] hover:bg-[#850B1B] text-white rounded-md font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>ছবি আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSlideImageUpload(idx, e)}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        value={slide.image}
                        onChange={(e) => updateSlide(idx, { image: e.target.value })}
                        placeholder="ছবির URL (খালি রাখলে ডিফল্ট)"
                        className="flex-1 bg-[#FAF8F4] border border-[#EDE5D9] rounded-md px-2.5 py-1.5 text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Slide Text Fields */}
                  <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#242424] mb-1">
                        টপ ব্যাজ / কিকার (Badge)
                      </label>
                      <input
                        type="text"
                        value={slide.badge}
                        onChange={(e) => updateSlide(idx, { badge: e.target.value })}
                        className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#242424] mb-1">
                        ডেস্কটপ শিরোনাম ১ (Desktop Line 1)
                      </label>
                      <input
                        type="text"
                        value={slide.headlineDesktop1}
                        onChange={(e) => updateSlide(idx, { headlineDesktop1: e.target.value })}
                        className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-1.5 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#242424] mb-1">
                        ডেস্কটপ গোল্ডেন শিরোনাম ২ (Desktop Line 2)
                      </label>
                      <input
                        type="text"
                        value={slide.headlineDesktop2}
                        onChange={(e) => updateSlide(idx, { headlineDesktop2: e.target.value })}
                        className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-1.5 font-bold text-[#850B1B]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#242424] mb-1">
                        মোবাইল শিরোনাম ১ (Mobile Headline)
                      </label>
                      <input
                        type="text"
                        value={slide.headlineMobile1}
                        onChange={(e) => updateSlide(idx, { headlineMobile1: e.target.value })}
                        className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#242424] mb-1">
                        সাবটাইটেল / বিবরণ (Subtitle / Description)
                      </label>
                      <textarea
                        rows={2}
                        value={slide.subheadline}
                        onChange={(e) =>
                          updateSlide(idx, {
                            subheadline: e.target.value,
                            priceHighlight: e.target.value
                          })
                        }
                        className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#242424] mb-1">
                        প্রধান বাটন টেক্সট (Primary CTA)
                      </label>
                      <input
                        type="text"
                        value={slide.ctaPrimary}
                        onChange={(e) => updateSlide(idx, { ctaPrimary: e.target.value })}
                        className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#242424] mb-1">
                        দ্বিতীয় বাটন টেক্সট (Secondary CTA)
                      </label>
                      <input
                        type="text"
                        value={slide.ctaSecondary}
                        onChange={(e) => updateSlide(idx, { ctaSecondary: e.target.value })}
                        className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: FABRIC WIDTH BANNER CARDS (3.5 & 2.5 BAHAR) */}
      {activeSubTab === 'fabric-width' && (() => {
        const fabricWidthSec = homepageConfig.sections.find((s) => s.id === 'fabric_width') || {
          id: 'fabric_width',
          label: 'বহর ভিত্তিক কালেকশন (৩.৫ ও ২.৫ বহর)',
          eyebrow: 'Fabric Collection',
          heading: 'বহর অনুযায়ী কাপড় বেছে নিন',
          description: 'আপনার প্রয়োজন অনুযায়ী ৩.৫ ও ২.৫ বহরের প্রিমিয়াম সিল্ক কাপড়ের কালেকশন দেখুন।',
          buttonText: 'কালেকশন দেখুন',
          isVisible: true,
          order: 2
        };
        const cards =
          homepageConfig.fabricWidthCards && homepageConfig.fabricWidthCards.length > 0
            ? homepageConfig.fabricWidthCards
            : INITIAL_FABRIC_WIDTH_CARDS;

        return (
          <div className="space-y-6">
            {/* 1. Section Header & Visibility Controls */}
            <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE5D9] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#850B1B] text-white font-bold text-xs flex items-center justify-center">
                      ২
                    </span>
                    <h3 className="text-sm font-bold text-[#242424]">
                      বহর অনুযায়ী কাপড় সেকশন হেডার ও সেটিংস
                    </h3>
                  </div>
                  <p className="text-xs text-[#242424]/60 mt-0.5">
                    হোমপেজে প্রদর্শিত "Fabric Collection / বহর অনুযায়ী কাপড় বেছে নিন" সেকশনের মূল হেডিং ও বর্ণনা পরিবর্তন করুন।
                  </p>
                </div>

                {/* Visibility Toggle Button */}
                <button
                  type="button"
                  onClick={() =>
                    updateSection('fabric_width', { isVisible: !fabricWidthSec.isVisible })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    fabricWidthSec.isVisible
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-rose-50 text-rose-700 border border-rose-300'
                  }`}
                >
                  {fabricWidthSec.isVisible ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>হোমপেজে দৃশ্যমান (Visible)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                      <span>হোমপেজে লুকানো (Hidden)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    টপ আইব্রো ট্যাগ (Eyebrow Tag)
                  </label>
                  <input
                    type="text"
                    value={fabricWidthSec.eyebrow || ''}
                    onChange={(e) => updateSection('fabric_width', { eyebrow: e.target.value })}
                    placeholder="যেমন: Fabric Collection"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-bold text-[#B30C15]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#242424] mb-1">
                    মূল সেকশন শিরোনাম (Section Heading)
                  </label>
                  <input
                    type="text"
                    value={fabricWidthSec.heading}
                    onChange={(e) => updateSection('fabric_width', { heading: e.target.value })}
                    placeholder="যেমন: বহর অনুযায়ী কাপড় বেছে নিন"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-bold text-[#9E0B14]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-semibold text-[#242424] mb-1">
                    সাবটাইটেল / বিবরণ (Section Description)
                  </label>
                  <textarea
                    rows={2}
                    value={fabricWidthSec.description || ''}
                    onChange={(e) => updateSection('fabric_width', { description: e.target.value })}
                    placeholder="যেমন: আপনার প্রয়োজন অনুযায়ী ৩.৫ ও ২.৫ বহরের প্রিমিয়াম সিল্ক কাপড়ের কালেকশন দেখুন।"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2.5 text-[#1E1E1E]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Both Cards Editor (3.5 Bahar & 2.5 Bahar) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {cards.map((card, cardIdx) => {
                const isThreeHalf = card.widthKey === '3.5';
                return (
                  <div
                    key={card.widthKey}
                    className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4 text-xs"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#850B1B] text-white font-extrabold text-xs">
                          {isThreeHalf ? '৩.৫ বহর কার্ড' : '২.৫ বহর কার্ড'}
                        </span>
                        <span className="font-bold text-sm text-[#242424]">
                          {card.badgeTitle}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => resetFabricCardToDefault(cardIdx)}
                        title="ডিফল্ট তথ্যে রিসেট করুন"
                        className="text-xs text-[#242424]/60 hover:text-[#850B1B] flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>রিসেট</span>
                      </button>
                    </div>

                    {/* Badge Title & CTA Button Text */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#242424] mb-1">
                          ব্যানার ব্যাজ শিরোনাম (Badge Title)
                        </label>
                        <input
                          type="text"
                          value={card.badgeTitle}
                          onChange={(e) =>
                            updateFabricWidthCard(cardIdx, { badgeTitle: e.target.value })
                          }
                          placeholder={isThreeHalf ? '৩.৫ হাত বহর' : '২.৫ হাত বহর'}
                          className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-bold text-[#850B1B]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#242424] mb-1">
                          বাটন টেক্সট (CTA Button Text)
                        </label>
                        <input
                          type="text"
                          value={card.ctaText}
                          onChange={(e) =>
                            updateFabricWidthCard(cardIdx, { ctaText: e.target.value })
                          }
                          placeholder="যেমন: কাপড় দেখুন"
                          className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-semibold"
                        />
                      </div>
                    </div>

                    {/* Description Line 1 & Line 2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#242424] mb-1">
                          বিবরণ লাইন ১ (Description Line 1)
                        </label>
                        <input
                          type="text"
                          value={card.descLine1}
                          onChange={(e) =>
                            updateFabricWidthCard(cardIdx, { descLine1: e.target.value })
                          }
                          placeholder={isThreeHalf ? 'প্রশস্ত ও রাজকীয় পোশাক' : 'হালকা ও দৈনন্দিন পোশাক'}
                          className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#242424] mb-1">
                          বিবরণ লাইন ২ (Description Line 2)
                        </label>
                        <input
                          type="text"
                          value={card.descLine2}
                          onChange={(e) =>
                            updateFabricWidthCard(cardIdx, { descLine2: e.target.value })
                          }
                          placeholder={isThreeHalf ? 'তৈরির জন্য আদর্শ কাপড়' : 'তৈরির জন্য উপযোগী কাপড়'}
                          className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>

                    {/* Image URL & File Upload */}
                    <div className="space-y-2 pt-1 border-t border-[#EDE5D9]/70">
                      <label className="block font-semibold text-[#242424]">
                        কাপড়ের ব্যানার ছবি (Fabric Banner Photo)
                      </label>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="w-28 h-16 rounded-lg border border-[#EDE5D9] bg-[#FAF8F4] overflow-hidden shrink-0 flex items-center justify-center relative">
                          <img
                            src={card.fabricImage}
                            alt={card.fabricAlt}
                            className="w-full h-full object-cover object-right"
                          />
                        </div>

                        <div className="flex-1 w-full space-y-1.5">
                          <input
                            type="text"
                            value={card.fabricImage}
                            onChange={(e) =>
                              updateFabricWidthCard(cardIdx, { fabricImage: e.target.value })
                            }
                            placeholder="ছবির URL লিখুন বা নিচের বাটন দিয়ে আপলোড করুন"
                            className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-1.5 font-mono text-[11px]"
                          />

                          <div className="flex items-center gap-2">
                            <label className="px-3 py-1 bg-[#242424] hover:bg-[#850B1B] text-white rounded-md text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                              <Upload className="w-3 h-3" />
                              <span>ডিভাইস থেকে আপলোড</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFabricCardImageUpload(cardIdx, e)}
                                className="hidden"
                              />
                            </label>
                            <span className="text-[10px] text-[#242424]/50">
                              (পিএনজি বা জেপিজি ফরম্যাট)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Image Alt Text */}
                    <div>
                      <label className="block font-semibold text-[#242424] mb-1">
                        ছবির অল্টারনেটিভ টেক্সট (Alt Text for SEO & Accessibility)
                      </label>
                      <input
                        type="text"
                        value={card.fabricAlt}
                        onChange={(e) =>
                          updateFabricWidthCard(cardIdx, { fabricAlt: e.target.value })
                        }
                        placeholder="যেমন: ৩.৫ হাত বহর প্রিমিয়াম সিল্ক কাপড়"
                        className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424]/75"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. Real-Time Live Preview */}
            <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-sm font-bold text-[#242424]">
                    লাইভ প্রিভিউ (হোমপেজে যেমন দেখাবে)
                  </h4>
                </div>
                <span className="text-[11px] text-[#242424]/60 bg-[#FAF8F4] px-2.5 py-1 rounded-md border border-[#EDE5D9]">
                  রিয়েল-টাইম লাইভ ডেমো
                </span>
              </div>

              {/* Scaled Preview of the Actual Section */}
              <div className="p-3 sm:p-5 rounded-xl bg-[#FAF6F0] border border-[#E5D0B1]/60">
                <div className="mb-3 sm:mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs sm:text-[14px] font-bold text-[#B30C15] tracking-tight">
                      {fabricWidthSec.eyebrow || 'Fabric Collection'}
                    </span>
                    <div className="w-16 sm:w-28 h-[1.5px] bg-[#B30C15]/80" />
                  </div>
                  <h3 className="text-base sm:text-xl font-extrabold text-[#9E0B14] tracking-tight">
                    {fabricWidthSec.heading || 'বহর অনুযায়ী কাপড় বেছে নিন'}
                  </h3>
                  <p className="text-xs text-[#1E1E1E] mt-0.5 font-medium">
                    {fabricWidthSec.description || 'আপনার প্রয়োজন অনুযায়ী ৩.৫ ও ২.৫ বহরের প্রিমিয়াম সিল্ক কাপড়ের কালেকশন দেখুন।'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
                  {cards.map((card) => (
                    <div
                      key={card.widthKey}
                      className="@container relative rounded-[16px] sm:rounded-[22px] bg-[#FEFAF6] border border-[#E5D0B1]/85 shadow-[0_6px_20px_-6px_rgba(120,20,20,0.12)] overflow-hidden aspect-[1000/410] sm:aspect-[1000/358]"
                    >
                      <img
                        src={card.fabricImage}
                        alt={card.fabricAlt}
                        className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none"
                      />

                      <div className="relative z-10 h-full w-[56%] pl-[4.6%] pr-1 py-[5.5%] sm:py-[6.2%] flex flex-col justify-between items-start">
                        <div className="relative flex items-center">
                          <div className="relative z-20 w-[clamp(1.75rem,8.2cqw,4.5rem)] h-[clamp(1.75rem,8.2cqw,4.5rem)] rounded-full shrink-0 shadow-sm overflow-hidden bg-[#B8050C]">
                            <img
                              src="/assets/fabric-roll-icon.png"
                              alt=""
                              className="w-full h-full object-cover block"
                            />
                          </div>

                          <div className="-ml-[clamp(0.5rem,2.2cqw,1.2rem)] pl-[clamp(0.8rem,3.6cqw,2rem)] pr-[clamp(0.75rem,3.2cqw,1.8rem)] py-[clamp(0.22rem,1cqw,0.65rem)] rounded-r-full bg-gradient-to-r from-[#C3060E] via-[#B4040C] to-[#9E0309] shadow-sm flex items-center">
                            <h4 className="text-white font-extrabold text-[clamp(0.72rem,3.4cqw,1.9rem)] leading-none tracking-tight whitespace-nowrap">
                              {card.badgeTitle}
                            </h4>
                          </div>
                        </div>

                        <p className="pl-[0.4%] text-[#141414] font-bold text-[clamp(0.58rem,2.6cqw,1.4rem)] leading-[1.3] tracking-tight whitespace-nowrap">
                          <span className="block">{card.descLine1}</span>
                          <span className="block">{card.descLine2}</span>
                        </p>

                        <div className="inline-flex items-center gap-1.5 px-[clamp(0.75rem,3.8cqw,2rem)] py-[clamp(0.24rem,1.1cqw,0.7rem)] rounded-full bg-gradient-to-r from-[#BE0710] to-[#870207] text-white font-bold text-[clamp(0.58rem,2.4cqw,1.3rem)] leading-none whitespace-nowrap shadow-sm">
                          <span>{card.ctaText}</span>
                          <span>→</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: HOMEPAGE SECTIONS ORDER, VISIBILITY & HEADINGS */}
      {activeSubTab === 'sections' && (
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#242424]">
              হোমপেজ সেকশন শিরোনাম, দৃশ্যমানতা (Show/Hide) এবং ক্রম (Order)
            </h3>
            <p className="text-xs text-[#242424]/60">
              যেকোনো সেকশনের শিরোনাম ও বিবরণ পরিবর্তন করুন, সেকশন লুকান/দেখান অথবা উপরে-নিচে সরিয়ে ক্রম পরিবর্তন করুন।
            </p>
          </div>

          <div className="space-y-3">
            {sortedSections.map((sec, idx) => (
              <div
                key={sec.id}
                className={`p-4 rounded-xl border transition-all space-y-3 text-xs ${
                  sec.isVisible
                    ? 'bg-[#FAF8F4] border-[#EDE5D9]'
                    : 'bg-gray-50 border-gray-200 opacity-65'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#242424] text-white font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm text-[#242424]">{sec.label}</span>
                    <span className="px-2 py-0.5 bg-white border border-[#EDE5D9] rounded font-mono text-[10px] text-[#242424]/60">
                      ID: {sec.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, -1)}
                      className="p-1.5 bg-white border border-[#EDE5D9] rounded-md hover:bg-[#EDE5D9] disabled:opacity-30 cursor-pointer"
                      title="উপরে নিন"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sortedSections.length - 1}
                      onClick={() => moveSection(idx, 1)}
                      className="p-1.5 bg-white border border-[#EDE5D9] rounded-md hover:bg-[#EDE5D9] disabled:opacity-30 cursor-pointer"
                      title="নিচে নিন"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSection(sec.id, { isVisible: !sec.isVisible })}
                      className={`px-3 py-1.5 rounded-md font-bold inline-flex items-center gap-1 border cursor-pointer ${
                        sec.isVisible
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-200 text-gray-600 border-gray-300'
                      }`}
                    >
                      {sec.isVisible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>দৃশ্যমান (Visible)</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>লুকানো (Hidden)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#242424] mb-1">
                      উপরের ছোট ট্যাগ (Eyebrow)
                    </label>
                    <input
                      type="text"
                      value={sec.eyebrow || ''}
                      onChange={(e) => updateSection(sec.id, { eyebrow: e.target.value })}
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#242424] mb-1">
                      সেকশন শিরোনাম (Section Heading)
                    </label>
                    <input
                      type="text"
                      value={sec.heading}
                      onChange={(e) => updateSection(sec.id, { heading: e.target.value })}
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#242424] mb-1">
                      সংক্ষিপ্ত বিবরণ (Section Description)
                    </label>
                    <input
                      type="text"
                      value={sec.description}
                      onChange={(e) => updateSection(sec.id, { description: e.target.value })}
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PROMOTIONAL BANNERS */}
      {activeSubTab === 'banners' && (
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#242424]">
                প্রোমোশনাল ব্যানার ম্যানেজমেন্ট (Promotional Banners)
              </h3>
              <p className="text-xs text-[#242424]/60">
                বিশেষ অফার বা ক্যাম্পেইন ব্যানার যুক্ত করুন। সক্রিয় করলে হোমপেজে প্রদর্শিত হবে।
              </p>
            </div>
            <button
              type="button"
              onClick={addPromoBanner}
              className="px-3.5 py-2 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন প্রোমো ব্যানার</span>
            </button>
          </div>

          <div className="space-y-3">
            {(homepageConfig.promotionalBanners || []).map((banner) => (
              <div
                key={banner.id}
                className="p-4 rounded-xl bg-[#FAF8F4] border border-[#EDE5D9] space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#242424]">{banner.title}</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                      <input
                        type="checkbox"
                        checked={banner.isActive}
                        onChange={(e) =>
                          updatePromoBanner(banner.id, { isActive: e.target.checked })
                        }
                        className="accent-emerald-600"
                      />
                      <span>হোমপেজে প্রদর্শন করুন</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removePromoBanner(banner.id)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">ব্যাজ টেক্সট</label>
                    <input
                      type="text"
                      value={banner.badge}
                      onChange={(e) => updatePromoBanner(banner.id, { badge: e.target.value })}
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">ব্যানার শিরোনাম</label>
                    <input
                      type="text"
                      value={banner.title}
                      onChange={(e) => updatePromoBanner(banner.id, { title: e.target.value })}
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">বাটন টেক্সট</label>
                    <input
                      type="text"
                      value={banner.buttonText}
                      onChange={(e) =>
                        updatePromoBanner(banner.id, { buttonText: e.target.value })
                      }
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold mb-1">সাবটাইটেল / অফার বিবরণ</label>
                    <input
                      type="text"
                      value={banner.subtitle}
                      onChange={(e) => updatePromoBanner(banner.id, { subtitle: e.target.value })}
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">ব্যানার ছবির URL</label>
                    <input
                      type="text"
                      value={banner.backgroundImage || ''}
                      onChange={(e) =>
                        updatePromoBanner(banner.id, { backgroundImage: e.target.value })
                      }
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FEATURED, BEST-SELLING & NEW ARRIVAL PRODUCTS */}
      {activeSubTab === 'curated-products' && (
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#242424]">
              হোমপেজ ফিচার্ড, বেস্ট-সেলার এবং নতুন কালেকশন পণ্য নির্বাচন
            </h3>
            <p className="text-xs text-[#242424]/60">
              যেকোনো পণ্যের পাশে টিক দিয়ে হোমপেজে Featured, Best-Selling অথবা New Arrival হিসেবে নির্ধারণ করুন।
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F4] text-[#242424] font-bold border-b border-[#EDE5D9]">
                  <th className="p-3">পণ্যের নাম</th>
                  <th className="p-3 text-center">বহর ও ক্যাটাগরি</th>
                  <th className="p-3 text-center">ফিচার্ড (Featured)</th>
                  <th className="p-3 text-center">বেস্ট সেলার (Best-Selling)</th>
                  <th className="p-3 text-center">নতুন কালেকশন (New Arrival)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE5D9]">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#FAF8F4]/50">
                    <td className="p-3 font-bold text-[#242424]">{prod.name}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-[#FAF8F4] border border-[#EDE5D9] rounded text-[11px]">
                        {prod.fabricWidth} বহর · {prod.category}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!prod.isFeatured}
                        onChange={() => toggleProductFlag(prod, 'isFeatured')}
                        className="w-4 h-4 accent-[#850B1B] cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!prod.isBestSeller}
                        onChange={() => toggleProductFlag(prod, 'isBestSeller')}
                        className="w-4 h-4 accent-[#850B1B] cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!prod.isNewArrival}
                        onChange={() => toggleProductFlag(prod, 'isNewArrival')}
                        className="w-4 h-4 accent-[#850B1B] cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
