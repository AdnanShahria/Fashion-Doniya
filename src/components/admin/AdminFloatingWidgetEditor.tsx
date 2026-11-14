import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { settingsService } from '../../services/settingsService';
import { INITIAL_FLOATING_WIDGET_CONFIG } from '../../data/seedData';
import {
  FloatingWidgetConfig,
  FloatingContactItem,
  FloatingContactIconType
} from '../../types';
import {
  MessageCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Upload,
  Globe,
  Check
} from 'lucide-react';

const ICON_OPTIONS: { type: FloatingContactIconType; label: string; defaultBg: string }[] = [
  { type: 'facebook', label: 'Facebook (ফেসবুক)', defaultBg: '#1877F2' },
  { type: 'messenger', label: 'Messenger (মেসেঞ্জার)', defaultBg: 'linear-gradient(45deg, #006AFF, #0099FF, #A033FF, #FF5280)' },
  { type: 'whatsapp', label: 'WhatsApp (হোয়াটসঅ্যাপ)', defaultBg: '#25D366' },
  { type: 'phone', label: 'Phone / Call (ফোন কল)', defaultBg: '#10B981' },
  { type: 'instagram', label: 'Instagram (ইনস্টাগ্রাম)', defaultBg: 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF)' },
  { type: 'telegram', label: 'Telegram (টেলিগ্রাম)', defaultBg: '#229ED9' },
  { type: 'youtube', label: 'YouTube (ইউটিউব)', defaultBg: '#FF0000' },
  { type: 'email', label: 'Email (ইমেইল)', defaultBg: '#EA4335' },
  { type: 'custom', label: 'Custom Link (কাস্টম লিংক ও আইকন)', defaultBg: '#850B1B' }
];

function renderPreviewBadge(item: FloatingContactItem) {
  switch (item.iconType) {
    case 'facebook':
      return (
        <span className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
          </svg>
        </span>
      );

    case 'messenger':
      return (
        <span
          style={{
            background:
              'linear-gradient(45deg, #006AFF 0%, #0099FF 45%, #A033FF 85%, #FF5280 100%)'
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.912 1.454 5.511 3.727 7.21V22l3.405-1.869c.909.252 1.871.388 2.868.388 5.523 0 10-4.145 10-9.259C22 6.145 17.523 2 12 2zm1.008 12.463l-2.548-2.718-4.97 2.718 5.468-5.805 2.61 2.718 4.908-2.718-5.468 5.805z" />
          </svg>
        </span>
      );

    case 'whatsapp':
      return (
        <span className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.35C9.34 7.35 9.14 7.37 8.97 7.69C8.79 8 8.27 8.49 8.27 9.5C8.27 10.5 9 11.47 9.1 11.61C9.2 11.75 10.53 13.8 12.58 14.68C14.28 15.42 14.63 15.27 15 15.23C15.37 15.2 16.18 14.75 16.35 14.28C16.52 13.81 16.52 13.41 16.47 13.33C16.42 13.24 16.27 13.19 16.05 13.08C15.82 12.97 14.72 12.43 14.52 12.35C14.31 12.28 14.16 12.24 14.02 12.46C13.87 12.69 13.45 13.19 13.32 13.33C13.2 13.48 13.07 13.5 12.85 13.39C12.62 13.28 11.89 13.04 11.02 12.27C10.34 11.67 9.89 10.92 9.76 10.7C9.64 10.48 9.75 10.36 9.86 10.25C9.96 10.15 10.09 9.98 10.2 9.85C10.31 9.72 10.35 9.62 10.43 9.47C10.5 9.32 10.46 9.19 10.41 9.08C10.35 8.97 9.93 7.94 9.75 7.52C9.58 7.11 9.4 7.17 9.27 7.16C9.15 7.16 9.01 7.15 8.87 7.15L9.53 7.35Z" />
          </svg>
        </span>
      );

    case 'phone':
      return (
        <span className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
        </span>
      );

    case 'instagram':
      return (
        <span
          style={{
            background:
              'linear-gradient(45deg, #F58529 0%, #FEDA77 25%, #DD2A7B 50%, #8134AF 75%, #515BD4 100%)'
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </span>
      );

    case 'telegram':
      return (
        <span className="w-8 h-8 rounded-full bg-[#229ED9] flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
        </span>
      );

    case 'youtube':
      return (
        <span className="w-8 h-8 rounded-full bg-[#FF0000] flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </span>
      );

    case 'email':
      return (
        <span className="w-8 h-8 rounded-full bg-[#EA4335] flex items-center justify-center text-white shrink-0 shadow-xs">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        </span>
      );

    case 'custom':
    default:
      if (item.customIconUrl) {
        return (
          <span className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white border border-gray-200 shrink-0 shadow-xs">
            <img src={item.customIconUrl} alt={item.label} className="w-full h-full object-cover" />
          </span>
        );
      }
      return (
        <span
          style={{ backgroundColor: item.iconBgColor || '#850B1B' }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
        >
          <Globe className="w-4 h-4 text-white" />
        </span>
      );
  }
}

export const AdminFloatingWidgetEditor: React.FC = () => {
  const { settings, refreshData, showToast } = useStore();

  const [widgetConfig, setWidgetConfig] = useState<FloatingWidgetConfig>(() => {
    const existing = settings.floatingWidgetConfig || INITIAL_FLOATING_WIDGET_CONFIG;
    return JSON.parse(JSON.stringify(existing));
  });

  const handleSave = () => {
    settingsService.updateSettings({
      floatingWidgetConfig: widgetConfig
    });
    refreshData();
    showToast('ভাসমান চ্যাট ও সোশ্যাল আইকন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!', 'success');
  };

  const handleResetToDefault = () => {
    if (window.confirm('আপনি কি ডিফল্ট (Facebook & Messenger) চ্যাট আইকনে রিসেট করতে চান?')) {
      const def = JSON.parse(JSON.stringify(INITIAL_FLOATING_WIDGET_CONFIG));
      setWidgetConfig(def);
      settingsService.updateSettings({ floatingWidgetConfig: def });
      refreshData();
      showToast('ডিফল্ট তথ্যে সফলভাবে রিসেট হয়েছে!', 'info');
    }
  };

  const handleAddItem = (type: FloatingContactIconType = 'whatsapp') => {
    const defaultLabels: Record<FloatingContactIconType, { label: string; url: string }> = {
      facebook: { label: 'Facebook', url: settings.facebookUrl || 'https://facebook.com' },
      messenger: { label: 'Messenger', url: settings.facebookUrl || 'https://m.me' },
      whatsapp: { label: 'WhatsApp', url: settings.whatsappNumber ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}` : 'https://wa.me/8801712345678' },
      phone: { label: 'হটলাইন কল', url: settings.supportPhone || 'tel:+8801712345678' },
      instagram: { label: 'Instagram', url: settings.instagramUrl || 'https://instagram.com' },
      telegram: { label: 'Telegram', url: 'https://t.me/' },
      youtube: { label: 'YouTube', url: settings.youtubeUrl || 'https://youtube.com' },
      email: { label: 'সাপোর্ট ইমেইল', url: settings.supportEmail ? `mailto:${settings.supportEmail}` : 'mailto:support@fashiondoniyabd.com' },
      custom: { label: 'নতুন লিংক', url: 'https://' }
    };

    const def = defaultLabels[type] || defaultLabels.custom;
    const newItem: FloatingContactItem = {
      id: `item-${Date.now()}`,
      label: def.label,
      url: def.url,
      iconType: type,
      isActive: true,
      order: widgetConfig.items.length + 1
    };

    setWidgetConfig((prev) => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    showToast(`"${newItem.label}" সফলভাবে যোগ করা হয়েছে`, 'info');
  };

  const updateItem = (id: string, patch: Partial<FloatingContactItem>) => {
    setWidgetConfig((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it))
    }));
  };

  const deleteItem = (id: string) => {
    if (widgetConfig.items.length <= 1) {
      showToast('উইজেটে কমপক্ষে ১টি অপশন থাকা আবশ্যক (অথবা পুরো উইজেটটি নিষ্ক্রিয় করুন)', 'error');
      return;
    }
    setWidgetConfig((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id)
    }));
    showToast('আইটেমটি মুছে ফেলা হয়েছে', 'info');
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    setWidgetConfig((prev) => {
      const sorted = [...prev.items].sort((a, b) => a.order - b.order);
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= sorted.length) return prev;
      const [moved] = sorted.splice(idx, 1);
      sorted.splice(targetIdx, 0, moved);
      const reindexed = sorted.map((it, i) => ({ ...it, order: i + 1 }));
      return { ...prev, items: reindexed };
    });
  };

  const handleCustomImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateItem(id, { customIconUrl: reader.result });
        showToast('কাস্টম আইকন ছবি আপলোড হয়েছে', 'info');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sortedItems = [...widgetConfig.items].sort((a, b) => a.order - b.order);
  const activeItemsForPreview = sortedItems.filter((it) => it.isActive);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA5500]" />
            <h3 className="text-base font-bold text-[#242424]">
              ভাসমান যোগাযোগ / চ্যাট আইকন উইজেট কাস্টমাইজার (Floating Widget)
            </h3>
          </div>
          <p className="text-xs text-[#242424]/60 mt-1">
            স্ক্রিনের নিচের কোণায় গোল অরেঞ্জ বাটনে ক্লিক করলে যে পপআপ কার্ড (Facebook, Messenger, WhatsApp, Phone, etc.) খোলে, তা সম্পূর্ণভাবে এডিট ও নতুন অপশন যুক্ত করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 bg-[#FAF8F4] hover:bg-[#EDE5D9] text-[#242424] text-xs font-semibold rounded-lg border border-[#EDE5D9] flex items-center gap-1.5 cursor-pointer"
            title="ডিফল্ট ফেসবুক ও মেসেঞ্জারে ফিরিয়ে নিন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ডিফল্ট রিসেট</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-[#850B1B] hover:bg-[#6B0812] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#D5A64A]" />
            <span>সংরক্ষণ করুন</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Controls & Items List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* General Controls Card */}
          <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE5D9] pb-3">
              <span className="font-bold text-sm text-[#242424]">সাধারণ উইজেট সেটিংস</span>

              {/* Enable / Disable Switch */}
              <button
                type="button"
                onClick={() =>
                  setWidgetConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  widgetConfig.isEnabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-rose-50 text-rose-700 border border-rose-300'
                }`}
              >
                {widgetConfig.isEnabled ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>উইজেট সক্রিয় (Visible)</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                    <span>উইজেট নিষ্ক্রিয় (Hidden)</span>
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">
                বাটন হোভার টুলটিপ টেক্সট (Tooltip / Accessibility Label)
              </label>
              <input
                type="text"
                value={widgetConfig.tooltipText || ''}
                onChange={(e) =>
                  setWidgetConfig((prev) => ({ ...prev, tooltipText: e.target.value }))
                }
                placeholder="যেমন: ফেসবুক ও মেসেঞ্জারে যোগাযোগ করুন"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Items / Channels List Header & Add Button */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-[#242424]">
                যোগাযোগের চ্যানেল ও লিংক সমূহ ({sortedItems.length}টি)
              </h4>
              <p className="text-[11px] text-[#242424]/60">
                পপআপে যে অপশনগুলো দেখাবেন তা নিচে সাজান।
              </p>
            </div>

            {/* Quick Add Dropdown / Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAddItem('whatsapp')}
                className="px-2.5 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>+ WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddItem('phone')}
                className="px-2.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>+ Phone Call</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddItem('custom')}
                className="px-2.5 py-1.5 bg-[#242424] hover:bg-[#850B1B] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>+ নতুন লিংক</span>
              </button>
            </div>
          </div>

          {/* Items Accordion / Cards */}
          <div className="space-y-3">
            {sortedItems.map((item, idx) => (
              <div
                key={item.id}
                className={`bg-white p-4 rounded-xl border transition-all text-xs space-y-3 ${
                  item.isActive
                    ? 'border-[#EDE5D9] shadow-xs'
                    : 'border-gray-200 bg-gray-50/70 opacity-60'
                }`}
              >
                {/* Top Row: Icon preview + Label + Reorder/Delete */}
                <div className="flex items-center justify-between gap-2 border-b border-[#EDE5D9]/70 pb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#242424] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    {renderPreviewBadge(item)}
                    <span className="font-bold text-sm text-[#242424] truncate">
                      {item.label || '(নামহীন লিংক)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Active Toggle */}
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { isActive: !item.isActive })}
                      className={`p-1.5 rounded-md border text-xs cursor-pointer ${
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      }`}
                      title={item.isActive ? 'পপআপে সক্রিয়' : 'পপআপে লুকানো'}
                    >
                      {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveItem(idx, -1)}
                      className="p-1.5 bg-[#FAF8F4] border border-[#EDE5D9] rounded-md hover:bg-[#EDE5D9] disabled:opacity-30 cursor-pointer"
                      title="উপরে নিন"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={idx === sortedItems.length - 1}
                      onClick={() => moveItem(idx, 1)}
                      className="p-1.5 bg-[#FAF8F4] border border-[#EDE5D9] rounded-md hover:bg-[#EDE5D9] disabled:opacity-30 cursor-pointer"
                      title="নিচে নিন"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-md cursor-pointer ml-1"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Form Inputs for Item */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Icon Type Selection */}
                  <div className="sm:col-span-4">
                    <label className="block font-semibold text-[#242424] mb-1">
                      চ্যানেল / আইকন টাইপ
                    </label>
                    <select
                      value={item.iconType}
                      onChange={(e) => {
                        const newType = e.target.value as FloatingContactIconType;
                        updateItem(item.id, { iconType: newType });
                      }}
                      className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.type} value={opt.type}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Label */}
                  <div className="sm:col-span-8">
                    <label className="block font-semibold text-[#242424] mb-1">
                      ডিসপ্লে নাম (Display Label)
                    </label>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateItem(item.id, { label: e.target.value })}
                      placeholder="যেমন: Facebook, WhatsApp, ইত্যাদি"
                      className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-1.5 text-xs font-semibold"
                    />
                  </div>

                  {/* Target URL */}
                  <div className="sm:col-span-12">
                    <label className="block font-semibold text-[#242424] mb-1">
                      টার্গেট লিংক / ফোন নম্বর / পেজ URL (Target URL / Link)
                    </label>
                    <input
                      type="text"
                      value={item.url}
                      onChange={(e) => updateItem(item.id, { url: e.target.value })}
                      placeholder={
                        item.iconType === 'phone'
                          ? 'যেমন: +8801712345678 বা 01712345678'
                          : item.iconType === 'email'
                          ? 'যেমন: support@fashiondoniyabd.com'
                          : 'যেমন: https://facebook.com/..., https://wa.me/..., ইত্যাদি'
                      }
                      className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-1.5 font-mono text-[11px]"
                    />
                  </div>

                  {/* Custom Icon Image if type === 'custom' */}
                  {item.iconType === 'custom' && (
                    <div className="sm:col-span-12 p-2.5 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] flex flex-wrap items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                        {item.customIconUrl ? (
                          <img src={item.customIconUrl} alt="custom icon" className="w-full h-full object-cover" />
                        ) : (
                          <Globe className="w-5 h-5 text-[#850B1B]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-[200px] space-y-1">
                        <input
                          type="text"
                          value={item.customIconUrl || ''}
                          onChange={(e) => updateItem(item.id, { customIconUrl: e.target.value })}
                          placeholder="কাস্টম আইকন ছবির URL লিখুন"
                          className="w-full bg-white border border-[#EDE5D9] rounded-md px-2 py-1 text-[11px]"
                        />
                        <div className="flex items-center gap-2">
                          <label className="px-2.5 py-1 bg-[#242424] hover:bg-[#850B1B] text-white rounded-md text-[10px] font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors">
                            <Upload className="w-3 h-3" />
                            <span>ডিভাইস থেকে ছবি আপলোড</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleCustomImageUpload(item.id, e)}
                              className="hidden"
                            />
                          </label>
                          <span className="text-[10px] text-[#242424]/50">
                            (গোলাকার আইকনের জন্য পিএনজি ছবি)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Exact Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs sticky top-20 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-sm font-bold text-[#242424]">লাইভ প্রিভিউ (Live Preview)</h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                রিয়েল-টাইম ডেমো
              </span>
            </div>

            <p className="text-xs text-[#242424]/60">
              ওয়েবসাইটে ইউজাররা যেভাবে পপআপ ও বাটন দেখতে পাবেন:
            </p>

            {/* Preview Box Container simulating webpage canvas */}
            <div className="p-6 rounded-2xl bg-[#FDFBF7] border border-[#EBE3D5] flex flex-col items-end justify-end min-h-[300px] relative overflow-hidden shadow-inner">
              <span className="absolute top-3 left-3 text-[10px] font-mono font-bold text-[#242424]/40 uppercase tracking-widest">
                ওয়েবসাইট ক্যানভাস
              </span>

              {widgetConfig.isEnabled ? (
                <div className="flex flex-col items-end gap-3">
                  {/* Simulated Popup Card */}
                  <div className="w-[205px] bg-white rounded-[20px] shadow-[0_10px_35px_rgba(0,0,0,0.12)] border border-black/[0.06] px-4 py-1.5 transition-all">
                    {activeItemsForPreview.length === 0 ? (
                      <div className="py-4 text-center text-xs text-gray-400">
                        কোনো সক্রিয় চ্যানেল নেই
                      </div>
                    ) : (
                      activeItemsForPreview.map((item, idx) => (
                        <React.Fragment key={item.id}>
                          {idx > 0 && <div className="h-[1px] bg-gray-100 mx-1" />}
                          <div className="flex items-center justify-between py-2.5 px-1 rounded-xl hover:bg-gray-50/90 transition-colors cursor-pointer group">
                            <span className="text-[15px] font-medium text-[#2B2B2B] group-hover:text-[#850B1B] transition-colors truncate pr-2">
                              {item.label}
                            </span>
                            {renderPreviewBadge(item)}
                          </div>
                        </React.Fragment>
                      ))
                    )}
                  </div>

                  {/* Simulated 3D Orange Button with Speech Bubble */}
                  <div
                    style={{
                      background:
                        'radial-gradient(circle at 48% 20%, #FCA05E 0%, #F47119 46%, #EA5500 100%)',
                      boxShadow:
                        '0 5px 14px rgba(234, 85, 0, 0.34), inset 0 1.5px 2.5px rgba(255, 255, 255, 0.42), inset 0 -2px 3px rgba(175, 52, 0, 0.25)'
                    }}
                    className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-white cursor-pointer shadow-md hover:scale-105 transition-transform"
                    title={widgetConfig.tooltipText || 'যোগাযোগ করুন'}
                  >
                    <svg
                      className="w-[26px] h-[26px] text-white drop-shadow-[0_1px_1px_rgba(160,45,0,0.25)]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 4.5a7.5 7.5 0 0 0-6.48 11.27l-.92 2.86a.55.55 0 0 0 .68.68l2.86-.92A7.5 7.5 0 1 0 12 4.5Z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-full text-center py-12 text-xs text-rose-500 font-bold bg-rose-50/80 rounded-xl border border-dashed border-rose-300 p-4">
                  উইজেটটি বর্তমানে নিষ্ক্রিয় করা আছে (Hidden)
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-amber-700" />
                <span>অ্যাডমিন টিপস:</span>
              </div>
              <p>
                যেসব চ্যানেলের পাশে সবুজ চোখের আইকন থাকবে সেগুলোই হোমপেজের ভাসমান উইজেটে দেখা যাবে। যেকোনো চ্যানেল উপরে বা নিচে সরাতে তীর চিহ্নে ক্লিক করুন।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
