import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { settingsService } from '../../services/settingsService';
import { StorageService } from '../../services/storageService';
import { StoreSettings, Coupon } from '../../types';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle,
  Megaphone
} from 'lucide-react';
import { AdminFloatingWidgetEditor } from '../../components/admin/AdminFloatingWidgetEditor';

export const AdminSettings: React.FC = () => {
  const { settings, refreshData, showToast, navigateTo } = useStore();
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });

  // Coupon state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState<number>(10);
  const [newCouponMin, setNewCouponMin] = useState<number>(1000);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSettings(formData);
    refreshData();
    showToast('ওয়েবসাইটের সেটিংস সফলভাবে আপডেট হয়েছে!', 'success');
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    const newCoupon: Coupon = {
      code: newCouponCode.trim().toUpperCase(),
      discountType: newCouponType,
      discountValue: Number(newCouponValue),
      minOrderAmount: Number(newCouponMin),
      isActive: true,
      description: newCouponType === 'percentage' 
        ? `${newCouponMin} টাকার অর্ডারে ${newCouponValue}% ছাড়` 
        : `${newCouponMin} টাকার অর্ডারে ৳${newCouponValue} ফ্ল্যাট ছাড়`
    };

    const updatedCoupons = [...(formData.coupons || []), newCoupon];
    const updated = settingsService.updateSettings({ coupons: updatedCoupons });
    setFormData(updated);
    refreshData();
    setNewCouponCode('');
    showToast(`কুপন কোড ${newCoupon.code} যোগ করা হয়েছে`, 'success');
  };

  const handleDeleteCoupon = (code: string) => {
    const updatedCoupons = formData.coupons.filter(c => c.code !== code);
    const updated = settingsService.updateSettings({ coupons: updatedCoupons });
    setFormData(updated);
    refreshData();
    showToast('কুপন মুছে ফেলা হয়েছে', 'info');
  };

  const handleResetAllData = () => {
    if (window.confirm('সতর্কতা: এটি সম্পূর্ণ ডেমো ডাটা রিসেট করবে এবং প্রাথমিক স্যাম্পল পণ্য ও সেটিংস পুনরায় লোড করবে। আপনি কি নিশ্চিত?')) {
      StorageService.resetDemoData();
      refreshData();
      showToast('সকল ডেমো ডাটা সফলভাবে রিসেট হয়েছে!', 'success');
      navigateTo('home');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#242424]">ওয়েবসাইট ও স্টোর সেটিংস (Store Settings)</h2>
          <p className="text-xs text-[#242424]/60">হোমপেজ ব্যানার, ডেলিভারি চার্জ, কুপন ও হেল্পলাইন নাম্বার পরিবর্তন করুন।</p>
        </div>

        <button
          onClick={handleResetAllData}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>ডেমো ডাটা রিসেট করুন</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        
        {/* Section 0: Brand Identity, Logo, Favicon, Currency & Maintenance Mode */}
        <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-2">
            ০. ওয়েবসাইটের নাম, লোগো, কারেন্সি ও মেইনটেন্যান্স মোড (General Brand Settings)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#242424] mb-1">ওয়েবসাইটের নাম (Website Name)</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-bold text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">ট্যাগলাইন / স্লোগান (Tagline)</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">লোগো URL (Website Logo)</label>
              <input
                type="text"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="খালি রাখলে ডিফল্ট টাইপোগ্রাফি লোগো দেখাবে"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">ফেভিকন URL (Favicon)</label>
              <input
                type="text"
                value={formData.faviconUrl || ''}
                onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                placeholder="/favicon.ico বা ছবির লিংক"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">কারেন্সি কোড (Currency Code)</label>
              <input
                type="text"
                value={formData.currencyCode || 'BDT'}
                onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">কারেন্সি প্রতীক (Currency Symbol)</label>
              <input
                type="text"
                value={formData.currencySymbol || '৳'}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-bold text-xs"
              />
            </div>

            <div className="sm:col-span-2 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
              <label className="flex items-center justify-between gap-2 cursor-pointer font-bold text-amber-950">
                <span>ওয়েবসাইট মেইনটেন্যান্স মোড (Website Maintenance Mode)</span>
                <input
                  type="checkbox"
                  checked={!!formData.maintenanceMode}
                  onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                  className="accent-amber-600 w-4 h-4"
                />
              </label>
              <input
                type="text"
                value={formData.maintenanceMessage || ''}
                onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                placeholder="মেইনটেন্যান্স চলাকালীন গ্রাহকদের জন্য বার্তা..."
                className="w-full bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 1: Hero Banner & Announcement */}
        <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-2 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-[#C5A46D]" />
            <span>১. হোমপেজ হিরো ব্যানার ও শীর্ষ বার্তা</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#242424] mb-1">
                ঘোষণা বার্তার টেক্সট (শীর্ষে প্রদর্শিত হবে)
              </label>
              <input
                type="text"
                value={formData.announcementText}
                onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">
                হিরো হেডলাইন টাইটেল (বড় শিরোনাম)
              </label>
              <input
                type="text"
                value={formData.heroTitle}
                onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">
                হিরো বিবরণ (বর্ণনামূলক লেখা)
              </label>
              <textarea
                rows={2}
                value={formData.heroDescription}
                onChange={(e) => setFormData({ ...formData, heroDescription: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2.5 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#242424] mb-1">প্রধান বোতামের নাম</label>
                <input
                  type="text"
                  value={formData.heroButtonPrimaryText}
                  onChange={(e) => setFormData({ ...formData, heroButtonPrimaryText: e.target.value })}
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#242424] mb-1">দ্বিতীয় বোতামের নাম</label>
                <input
                  type="text"
                  value={formData.heroButtonSecondaryText}
                  onChange={(e) => setFormData({ ...formData, heroButtonSecondaryText: e.target.value })}
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact, WhatsApp & Address */}
        <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-2">
            ২. যোগাযোগ ও সোশ্যাল মিডিয়া
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#242424] mb-1">হোয়াটসঅ্যাপ নম্বর *</label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="+8801712345678"
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">হেল্পলাইন ফোন</label>
              <input
                type="text"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">সাপোর্ট ইমেইল</label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">Facebook Page URL</label>
              <input
                type="text"
                value={formData.facebookUrl}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">Instagram URL</label>
              <input
                type="text"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">YouTube Channel URL</label>
              <input
                type="text"
                value={formData.youtubeUrl || ''}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-[#242424] mb-1">শোরুম ও আউটলেট ঠিকানা</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2.1: Floating Chat & Social Media Widget Customizer */}
        <div className="pt-2">
          <AdminFloatingWidgetEditor />
        </div>

        {/* Section 3: Delivery Charges */}
        <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-2">
            ৩. ডেলিভারি চার্জ নির্ধারণ (Delivery Fees)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#242424] mb-1">ঢাকা সিটির ভেতরে চার্জ (৳)</label>
              <input
                type="number"
                value={formData.insideDhakaDeliveryFee}
                onChange={(e) => setFormData({ ...formData, insideDhakaDeliveryFee: Number(e.target.value) })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">ঢাকার বাইরে চার্জ (৳)</label>
              <input
                type="number"
                value={formData.outsideDhakaDeliveryFee}
                onChange={(e) => setFormData({ ...formData, outsideDhakaDeliveryFee: Number(e.target.value) })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#242424] mb-1">ফ্রি ডেলিভারি থ্রেশহোল্ড (৳)</label>
              <input
                type="number"
                value={formData.freeDeliveryThreshold}
                onChange={(e) => setFormData({ ...formData, freeDeliveryThreshold: Number(e.target.value) })}
                className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Dynamic Manual Payment Configuration (bKash, Nagad & COD) */}
        <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] shadow-xs space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-2">
              ৪. পেমেন্ট গেটওয়ে ও বিকাশ/নগদ সেটিংস (Payment Methods Configuration)
            </h3>
            <p className="text-[11px] text-[#242424]/60 mt-1.5">
              চেকআউট পেজে বিকাশ, নগদ ও ক্যাশ অন ডেলিভারি চালু/বন্ধ করুন এবং নম্বর ও অ্যাকাউন্ট টাইপ (Personal / Merchant / Agent) পরিবর্তন করুন।
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* bKash Configuration Card */}
            <div className="p-4 rounded-xl border border-[#E2136E]/30 bg-[#FDF2F7]/50 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#E2136E] text-white font-extrabold text-[11px]">
                    bKash
                  </span>
                  <span className="font-bold text-[#242424] text-sm">বিকাশ পেমেন্ট সেটিংস</span>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-[#242424]">
                  <input
                    type="checkbox"
                    checked={formData.paymentSettings?.bkash?.enabled ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentSettings: {
                          ...formData.paymentSettings,
                          bkash: {
                            ...formData.paymentSettings.bkash,
                            enabled: e.target.checked
                          }
                        }
                      })
                    }
                    className="accent-[#E2136E] w-4 h-4"
                  />
                  <span>সক্রিয় (Enabled)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    বিকাশ নম্বর (bKash Number)
                  </label>
                  <input
                    type="tel"
                    value={formData.paymentSettings?.bkash?.number || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentSettings: {
                          ...formData.paymentSettings,
                          bkash: {
                            ...formData.paymentSettings.bkash,
                            number: e.target.value
                          }
                        }
                      })
                    }
                    placeholder="01712345678"
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    অ্যাকাউন্টের ধরন (Account Type)
                  </label>
                  <select
                    value={formData.paymentSettings?.bkash?.type || 'Personal'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentSettings: {
                          ...formData.paymentSettings,
                          bkash: {
                            ...formData.paymentSettings.bkash,
                            type: e.target.value as 'Personal' | 'Merchant' | 'Agent'
                          }
                        }
                      })
                    }
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Personal">Personal (Send Money)</option>
                    <option value="Merchant">Merchant (Payment)</option>
                    <option value="Agent">Agent (Cash Out)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#242424] mb-1">
                    বিকাশ নির্দেশনা / নোট (Instructions)
                  </label>
                  <input
                    type="text"
                    value={formData.paymentSettings?.bkash?.instructions || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentSettings: {
                          ...formData.paymentSettings,
                          bkash: {
                            ...formData.paymentSettings.bkash,
                            instructions: e.target.value
                          }
                        }
                      })
                    }
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Nagad Configuration Card */}
            <div className="p-4 rounded-xl border border-[#F16522]/30 bg-[#FFF6F0]/60 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-gradient-to-r from-[#EC1C24] to-[#F7941D] text-white font-extrabold text-[11px]">
                    Nagad
                  </span>
                  <span className="font-bold text-[#242424] text-sm">নগদ পেমেন্ট সেটিংস</span>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-[#242424]">
                  <input
                    type="checkbox"
                    checked={formData.paymentSettings?.nagad?.enabled ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentSettings: {
                          ...formData.paymentSettings,
                          nagad: {
                            ...formData.paymentSettings.nagad,
                            enabled: e.target.checked
                          }
                        }
                      })
                    }
                    className="accent-[#F16522] w-4 h-4"
                  />
                  <span>সক্রিয় (Enabled)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    নগদ নম্বর (Nagad Number)
                  </label>
                  <input
                    type="tel"
                    value={formData.paymentSettings?.nagad?.number || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentSettings: {
                          ...formData.paymentSettings,
                          nagad: {
                            ...formData.paymentSettings.nagad,
                            number: e.target.value
                          }
                        }
                      })
                    }
                    placeholder="01812345678"
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    অ্যাকাউন্টের ধরন (Account Type)
                  </label>
                  <select
                    value={formData.paymentSettings?.nagad?.type || 'Personal'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentSettings: {
                          ...formData.paymentSettings,
                          nagad: {
                            ...formData.paymentSettings.nagad,
                            type: e.target.value as 'Personal' | 'Merchant' | 'Agent'
                          }
                        }
                      })
                    }
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Personal">Personal (Send Money)</option>
                    <option value="Merchant">Merchant (Payment)</option>
                    <option value="Agent">Agent (Cash Out)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-[#242424] mb-1">
                    নগদ নির্দেশনা / নোট (Instructions)
                  </label>
                  <input
                    type="text"
                    value={formData.paymentSettings?.nagad?.instructions || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentSettings: {
                          ...formData.paymentSettings,
                          nagad: {
                            ...formData.paymentSettings.nagad,
                            instructions: e.target.value
                          }
                        }
                      })
                    }
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Cash on Delivery (COD) Configuration Card */}
            <div className="p-4 rounded-xl border border-[#EDE5D9] bg-[#FAF8F4] space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#242424] text-white font-bold text-[11px]">
                    COD
                  </span>
                  <span className="font-bold text-[#242424] text-sm">
                    ক্যাশ অন ডেলিভারি (Cash on Delivery) সেটিংস
                  </span>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-[#242424]">
                  <input
                    type="checkbox"
                    checked={formData.paymentSettings?.cod?.enabled ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentSettings: {
                          ...formData.paymentSettings,
                          cod: {
                            ...formData.paymentSettings.cod,
                            enabled: e.target.checked
                          }
                        }
                      })
                    }
                    className="accent-[#C5A46D] w-4 h-4"
                  />
                  <span>সক্রিয় (Enabled)</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-[#242424] mb-1">
                  ক্যাশ অন ডেলিভারি নোট (COD Note)
                </label>
                <input
                  type="text"
                  value={formData.paymentSettings?.cod?.note || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentSettings: {
                        ...formData.paymentSettings,
                        cod: {
                          ...formData.paymentSettings.cod,
                          note: e.target.value
                        }
                      }
                    })
                  }
                  className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Settings Button */}
        <div>
          <button
            type="submit"
            className="px-8 py-3 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>সকল সেটিংস সংরক্ষণ করুন</span>
          </button>
        </div>

      </form>

      {/* Section 4: Coupons Management */}
      <div className="bg-white p-6 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#242424] border-b border-[#EDE5D9] pb-2">
          ৪. কুপন ও প্রোমো কোড (Coupons)
        </h3>

        {/* Existing Coupons Table */}
        <div className="space-y-2 text-xs">
          {formData.coupons?.map((coupon) => (
            <div key={coupon.code} className="p-3 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-sm text-[#242424]">{coupon.code}</span>
                <span className="text-[#242424]/60 ml-3">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}% ছাড়` : `৳${coupon.discountValue} ছাড়`} (সর্বনিম্ন অর্ডার: ৳{coupon.minOrderAmount})
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteCoupon(coupon.code)}
                className="p-1 text-[#242424]/40 hover:text-rose-600 rounded-md cursor-pointer"
                title="মুছে ফেলুন"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Coupon Form */}
        <form onSubmit={handleAddCoupon} className="pt-2 border-t border-[#EDE5D9] grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs items-end">
          <div>
            <label className="block text-[#242424]/70 mb-1">কুপন কোড</label>
            <input
              type="text"
              value={newCouponCode}
              onChange={(e) => setNewCouponCode(e.target.value)}
              placeholder="উদাঃ EID20"
              className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-[#242424]/70 mb-1">ছাড়ের ধরন</label>
            <select
              value={newCouponType}
              onChange={(e) => setNewCouponType(e.target.value as any)}
              className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-2.5 py-2"
            >
              <option value="percentage">শতাংশ (%)</option>
              <option value="fixed">টাকা (৳ ফিক্সড)</option>
            </select>
          </div>

          <div>
            <label className="block text-[#242424]/70 mb-1">মান (% বা ৳)</label>
            <input
              type="number"
              value={newCouponValue}
              onChange={(e) => setNewCouponValue(Number(e.target.value))}
              className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[#242424]/70 mb-1">সর্বনিম্ন অর্ডার (৳)</label>
            <input
              type="number"
              value={newCouponMin}
              onChange={(e) => setNewCouponMin(Number(e.target.value))}
              className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 tabular-nums"
            />
          </div>

          <button
            type="submit"
            className="py-2.5 px-4 bg-[#242424] hover:bg-[#C5A46D] text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            কুপন যোগ করুন
          </button>
        </form>
      </div>

    </div>
  );
};
