import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { settingsService } from '../../services/settingsService';
import { NavigationConfig, NavigationMenuItem, PageRoute } from '../../types';
import { INITIAL_NAVIGATION_CONFIG } from '../../data/seedData';
import { AdminFloatingWidgetEditor } from '../../components/admin/AdminFloatingWidgetEditor';
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Compass,
  RotateCcw
} from 'lucide-react';

const AVAILABLE_PAGES: { route: PageRoute; label: string }[] = [
  { route: 'home', label: 'হোম (home)' },
  { route: 'shop-3-5', label: '৩.৫ বহর কাপড় (shop-3-5)' },
  { route: 'shop-2-5', label: '২.৫ বহর কাপড় (shop-2-5)' },
  { route: 'shop', label: 'সকল কাপড় (shop)' },
  { route: 'calculator', label: 'গজ ক্যালকুলেটর (calculator)' },
  { route: 'custom-design', label: 'কাস্টম ডিজাইন (custom-design)' },
  { route: 'measurement-guide', label: 'মাপ নির্দেশিকা (measurement-guide)' },
  { route: 'order-tracking', label: 'অর্ডার ট্র্যাকিং (order-tracking)' },
  { route: 'about', label: 'আমাদের সম্পর্কে (about)' },
  { route: 'contact', label: 'যোগাযোগ (contact)' },
  { route: 'faq', label: 'প্রশ্নোত্তর FAQ (faq)' },
  { route: 'delivery-policy', label: 'ডেলিভারি পলিসি (delivery-policy)' },
  { route: 'return-policy', label: 'রিটার্ন পলিসি (return-policy)' },
  { route: 'privacy-policy', label: 'প্রাইভেসী পলিসি (privacy-policy)' },
  { route: 'terms', label: 'শর্তাবলী (terms)' }
];

export const AdminNavigation: React.FC = () => {
  const { settings, refreshData, showToast } = useStore();

  const [navConfig, setNavConfig] = useState<NavigationConfig>(() => {
    const existing = settings.navigationConfig || INITIAL_NAVIGATION_CONFIG;
    return JSON.parse(JSON.stringify(existing));
  });

  const [activeMenu, setActiveMenu] = useState<
    'headerItems' | 'footerFabricItems' | 'footerSupportItems' | 'floatingWidget'
  >('headerItems');

  const handleSaveNavigation = () => {
    // Prefix header item IDs with 'custom-nav-' so Header.tsx knows Admin customized the navigation
    const updatedNav: NavigationConfig = {
      ...navConfig,
      headerItems: navConfig.headerItems.map((it, idx) => ({
        ...it,
        id: it.id.startsWith('custom-nav-') ? it.id : `custom-nav-${it.id}-${idx}`
      }))
    };
    setNavConfig(updatedNav);
    settingsService.updateSettings({ navigationConfig: updatedNav });
    refreshData();
    showToast('নেভিগেশন ও মেনু সফলভাবে আপডেট হয়েছে!', 'success');
  };

  const handleResetDefaultNav = () => {
    const fresh = JSON.parse(JSON.stringify(INITIAL_NAVIGATION_CONFIG));
    setNavConfig(fresh);
    settingsService.updateSettings({ navigationConfig: fresh });
    refreshData();
    showToast('নেভিগেশন ডিফল্ট অবস্থায় রিসেট হয়েছে', 'info');
  };

  const currentList =
    activeMenu === 'floatingWidget'
      ? []
      : [...(navConfig[activeMenu] || [])].sort((a, b) => a.order - b.order);

  const updateMenuList = (nextList: NavigationMenuItem[]) => {
    const reindexed = nextList.map((item, idx) => ({ ...item, order: idx + 1 }));
    setNavConfig((prev) => ({
      ...prev,
      [activeMenu]: reindexed
    }));
  };

  const handleAddMenuItem = () => {
    const newItem: NavigationMenuItem = {
      id: `custom-nav-${Date.now()}`,
      label: 'নতুন মেনু লিংক',
      page: 'shop',
      order: currentList.length + 1,
      isActive: true
    };
    updateMenuList([...currentList, newItem]);
  };

  const handleMoveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= currentList.length) return;
    const copy = [...currentList];
    const [moved] = copy.splice(idx, 1);
    copy.splice(target, 0, moved);
    updateMenuList(copy);
  };

  const handleUpdateItem = (id: string, patch: Partial<NavigationMenuItem>) => {
    updateMenuList(currentList.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const handleDeleteItem = (id: string) => {
    updateMenuList(currentList.filter((it) => it.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#242424]">
            নেভিগেশন ও মেনু ম্যানেজমেন্ট (Navigation & Menu Management)
          </h2>
          <p className="text-xs text-[#242424]/60 mt-0.5">
            হেডার মেনু এবং ফুটারের লিংকসমূহ যোগ করুন, নাম পরিবর্তন করুন, ক্রম সাজান এবং সক্রিয়/নিষ্ক্রিয় করুন।
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleResetDefaultNav}
            className="px-3.5 py-2 bg-[#FAF8F4] hover:bg-[#EDE5D9] text-[#242424] border border-[#EDE5D9] text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ডিফল্ট মেনু</span>
          </button>

          <button
            type="button"
            onClick={handleSaveNavigation}
            className="px-5 py-2.5 bg-[#850B1B] hover:bg-[#6B0812] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#D5A64A]" />
            <span>মেনু সংরক্ষণ করুন</span>
          </button>
        </div>
      </div>

      {/* Menu Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-[#EDE5D9] text-xs">
        {[
          { id: 'headerItems', label: '১. হেডার নেভিগেশন মেনু (Header Menu)' },
          { id: 'footerFabricItems', label: '২. ফুটার ফেব্রিক সংগ্রহ লিংকস (Footer Fabric Links)' },
          { id: 'footerSupportItems', label: '৩. ফুটার গ্রাহক সেবা ও পলিসি লিংকস (Footer Support Links)' },
          { id: 'floatingWidget', label: '৪. ভাসমান চ্যাট ও সোশ্যাল বাটন (Floating Widget)' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveMenu(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-semibold cursor-pointer transition-colors ${
              activeMenu === tab.id
                ? 'bg-[#242424] text-white font-bold'
                : 'text-[#242424]/75 hover:bg-[#FAF8F4]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeMenu === 'floatingWidget' ? (
        <AdminFloatingWidgetEditor />
      ) : (
        /* Menu Items Editor */
        <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#C5A46D]" />
            <span className="text-sm font-bold text-[#242424]">
              মেনু আইটেম তালিকা ({currentList.length}টি)
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddMenuItem}
            className="px-3.5 py-2 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন মেনু আইটেম যোগ করুন</span>
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          {currentList.map((item, idx) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.isActive !== false
                  ? 'bg-[#FAF8F4] border-[#EDE5D9]'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <span className="w-6 h-6 rounded-full bg-[#242424] text-white font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-[180px]">
                  <label className="block text-[10px] text-[#242424]/60 mb-0.5">
                    মেনু নাম (Label)
                  </label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => handleUpdateItem(item.id, { label: e.target.value })}
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 font-bold text-[#242424]"
                  />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] text-[#242424]/60 mb-0.5">
                    গন্তব্য পেজ (Destination Route)
                  </label>
                  <select
                    value={item.page}
                    onChange={(e) =>
                      handleUpdateItem(item.id, { page: e.target.value as PageRoute })
                    }
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 text-[#242424]"
                  >
                    {AVAILABLE_PAGES.map((pg) => (
                      <option key={pg.route} value={pg.route}>
                        {pg.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveItem(idx, -1)}
                  className="p-1.5 bg-white border border-[#EDE5D9] rounded-md hover:bg-[#EDE5D9] disabled:opacity-30 cursor-pointer"
                  title="উপরে নিন"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={idx === currentList.length - 1}
                  onClick={() => handleMoveItem(idx, 1)}
                  className="p-1.5 bg-white border border-[#EDE5D9] rounded-md hover:bg-[#EDE5D9] disabled:opacity-30 cursor-pointer"
                  title="নিচে নিন"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleUpdateItem(item.id, { isActive: item.isActive === false ? true : false })
                  }
                  className={`px-2.5 py-1.5 rounded-md font-bold inline-flex items-center gap-1 border cursor-pointer ${
                    item.isActive !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-200 text-gray-600 border-gray-300'
                  }`}
                >
                  {item.isActive !== false ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>সক্রিয়</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>নিষ্ক্রিয়</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};
