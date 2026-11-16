import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { settingsService } from '../../services/settingsService';
import { productService } from '../../services/productService';
import { SeoConfig, Product } from '../../types';
import { INITIAL_SEO_CONFIG } from '../../data/seedData';
import { Globe, Save, Search } from 'lucide-react';

const SEO_PAGE_LIST: { key: string; label: string }[] = [
  { key: 'home', label: 'হোমপেজ (Home Page)' },
  { key: 'shop-3-5', label: '৩.৫ বহর কাপড় কালেকশন (3.5 Bahar)' },
  { key: 'shop-2-5', label: '২.৫ বহর কাপড় কালেকশন (2.5 Bahar)' },
  { key: 'shop', label: 'সকল কাপড় শপ পেজ (Shop Page)' },
  { key: 'calculator', label: 'গজ ক্যালকুলেটর পেজ (Calculator)' },
  { key: 'about', label: 'আমাদের সম্পর্কে (About Page)' },
  { key: 'contact', label: 'যোগাযোগ পেজ (Contact Page)' },
  { key: 'faq', label: 'প্রশ্নোত্তর (FAQ Page)' },
  { key: 'order-tracking', label: 'অর্ডার ট্র্যাকিং পেজ (Order Tracking)' }
];

export const AdminSeo: React.FC = () => {
  const { settings, products, refreshData, showToast } = useStore();

  const hasEditedRef = useRef(false);

  const [seoConfig, setSeoConfigRaw] = useState<SeoConfig>(() => {
    const existing = settings.seoConfig || INITIAL_SEO_CONFIG;
    return JSON.parse(JSON.stringify(existing));
  });
  const setSeoConfig: React.Dispatch<React.SetStateAction<SeoConfig>> = (val) => {
    hasEditedRef.current = true;
    setSeoConfigRaw(val);
  };

  useEffect(() => {
    if (!hasEditedRef.current && settings.seoConfig) {
      setSeoConfigRaw(JSON.parse(JSON.stringify(settings.seoConfig)));
    }
  }, [settings.seoConfig]);

  const [activeTab, setActiveTab] = useState<'global' | 'pages' | 'products'>('global');
  const [selectedPageKey, setSelectedPageKey] = useState('home');
  const [prodSearch, setProdSearch] = useState('');

  const handleSaveSeoConfig = () => {
    hasEditedRef.current = false;
    settingsService.updateSettings({ seoConfig });
    refreshData();
    showToast('SEO ও মেটা সেটিংস সফলভাবে সংরক্ষিত হয়েছে!', 'success');
  };

  const currentPageSeo = seoConfig.pages[selectedPageKey] || {
    page: selectedPageKey,
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    keywords: seoConfig.defaultKeywords
  };

  const updateCurrentPageSeo = (patch: Partial<typeof currentPageSeo>) => {
    setSeoConfig((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [selectedPageKey]: {
          ...currentPageSeo,
          ...patch
        }
      }
    }));
  };

  const handleProductSeoSave = (prod: Product, patch: Partial<Product>) => {
    const updated: Product = { ...prod, ...patch };
    productService.saveProduct(updated);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#242424]">
            এসইও ও মেটা ট্যাগ ম্যানেজমেন্ট (SEO Management)
          </h2>
          <p className="text-xs text-[#242424]/60 mt-0.5">
            গ্লোবাল মেটা টাইটেল, পেজভিত্তিক SEO ডিসক্রিপশন, কীওয়ার্ড এবং পণ্যের ছবির Alt Text পরিচালনা করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSeoConfig}
          className="px-5 py-2.5 bg-[#850B1B] hover:bg-[#6B0812] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4 text-[#D5A64A]" />
          <span>SEO সেটিংস সংরক্ষণ করুন</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-[#EDE5D9] text-xs">
        {[
          { id: 'global', label: '১. গ্লোবাল SEO ডিফল্ট (Global SEO)' },
          { id: 'pages', label: '২. পেজভিত্তিক SEO (Page Titles & Meta)' },
          { id: 'products', label: '৩. পণ্যভিত্তিক SEO ও ইমেজ Alt Text' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-colors ${
              activeTab === t.id
                ? 'bg-[#242424] text-white font-bold'
                : 'text-[#242424]/75 hover:bg-[#FAF8F4]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Global SEO */}
      {activeTab === 'global' && (
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-[#EDE5D9] pb-2">
            <Globe className="w-4 h-4 text-[#C5A46D]" />
            <h3 className="text-sm font-bold text-[#242424]">গ্লোবাল মেটা সেটিংস</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold mb-1">ডিফল্ট ওয়েবসাইট টাইটেল (Default Meta Title)</label>
              <input
                type="text"
                value={seoConfig.defaultTitle}
                onChange={(e) => setSeoConfig({ ...seoConfig, defaultTitle: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">ডিফল্ট মেটা ডিসক্রিপশন (Meta Description)</label>
              <textarea
                rows={3}
                value={seoConfig.defaultDescription}
                onChange={(e) =>
                  setSeoConfig({ ...seoConfig, defaultDescription: e.target.value })
                }
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">ডিফল্ট কীওয়ার্ডস (Meta Keywords)</label>
              <input
                type="text"
                value={seoConfig.defaultKeywords}
                onChange={(e) => setSeoConfig({ ...seoConfig, defaultKeywords: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Open Graph Share Image URL</label>
              <input
                type="text"
                value={seoConfig.ogImageUrl || ''}
                onChange={(e) => setSeoConfig({ ...seoConfig, ogImageUrl: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Page-specific SEO */}
      {activeTab === 'pages' && (
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#242424] mb-1.5">পেজ নির্বাচন করুন:</label>
            <div className="flex flex-wrap gap-2">
              {SEO_PAGE_LIST.map((pg) => (
                <button
                  key={pg.key}
                  type="button"
                  onClick={() => setSelectedPageKey(pg.key)}
                  className={`px-3 py-1.5 rounded-lg font-semibold border cursor-pointer ${
                    selectedPageKey === pg.key
                      ? 'bg-[#850B1B] text-white border-[#850B1B]'
                      : 'bg-[#FAF8F4] text-[#242424] border-[#EDE5D9]'
                  }`}
                >
                  {pg.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#EDE5D9] space-y-3">
            <div>
              <label className="block font-semibold mb-1">পেজ টাইটেল (Page Title)</label>
              <input
                type="text"
                value={currentPageSeo.title}
                onChange={(e) => updateCurrentPageSeo({ title: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">মেটা ডিসক্রিপশন (Meta Description)</label>
              <textarea
                rows={3}
                value={currentPageSeo.description}
                onChange={(e) => updateCurrentPageSeo({ description: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">কীওয়ার্ডস (Keywords)</label>
              <input
                type="text"
                value={currentPageSeo.keywords}
                onChange={(e) => updateCurrentPageSeo({ keywords: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Product SEO & Image Alt Text */}
      {activeTab === 'products' && (
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-[#242424]">
              পণ্যের SEO টাইটেল ও ছবির Alt Text কন্ট্রোল
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#242424]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                placeholder="পণ্য খুঁজুন..."
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg pl-9 pr-3 py-1.5"
              />
            </div>
          </div>

          <div className="space-y-3">
            {products
              .filter(
                (p) =>
                  !prodSearch.trim() ||
                  p.name.toLowerCase().includes(prodSearch.toLowerCase())
              )
              .map((prod) => (
                <div
                  key={prod.id}
                  className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#EDE5D9] grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
                >
                  <div>
                    <span className="font-bold text-[#242424] block">{prod.name}</span>
                    <span className="text-[10px] text-[#242424]/50 font-mono">
                      {prod.sku} · {prod.fabricWidth} বহর
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#242424]/60 mb-0.5">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      defaultValue={prod.seoTitle || prod.name}
                      onBlur={(e) => {
                        handleProductSeoSave(prod, { seoTitle: e.target.value });
                        showToast(`"${prod.name}" SEO আপডেট হয়েছে`, 'info');
                      }}
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-2.5 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#242424]/60 mb-0.5">
                      Image Alt Text
                    </label>
                    <input
                      type="text"
                      defaultValue={prod.imageAlt || prod.name}
                      onBlur={(e) => {
                        handleProductSeoSave(prod, { imageAlt: e.target.value });
                        showToast(`"${prod.name}" Alt Text আপডেট হয়েছে`, 'info');
                      }}
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
