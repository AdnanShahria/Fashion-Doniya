import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { settingsService } from '../../services/settingsService';
import { PromotionCampaign, Coupon } from '../../types';
import { INITIAL_CAMPAIGNS } from '../../data/seedData';
import { Tag, Plus, Trash2, Save, Percent } from 'lucide-react';

export const AdminPromotions: React.FC = () => {
  const { settings, refreshData, showToast } = useStore();

  const hasEditedRef = useRef(false);

  const [campaigns, setCampaignsRaw] = useState<PromotionCampaign[]>(() => {
    const existing = settings.campaigns || INITIAL_CAMPAIGNS;
    return JSON.parse(JSON.stringify(existing));
  });
  const setCampaigns: React.Dispatch<React.SetStateAction<PromotionCampaign[]>> = (val) => {
    hasEditedRef.current = true;
    setCampaignsRaw(val);
  };

  const [coupons, setCouponsRaw] = useState<Coupon[]>(() => {
    return JSON.parse(JSON.stringify(settings.coupons || []));
  });
  const setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>> = (val) => {
    hasEditedRef.current = true;
    setCouponsRaw(val);
  };

  useEffect(() => {
    if (!hasEditedRef.current) {
      const existingCampaigns = settings.campaigns || INITIAL_CAMPAIGNS;
      setCampaignsRaw(JSON.parse(JSON.stringify(existingCampaigns)));
      setCouponsRaw(JSON.parse(JSON.stringify(settings.coupons || [])));
    }
  }, [settings.campaigns, settings.coupons]);

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState<number>(10);
  const [newCouponMin, setNewCouponMin] = useState<number>(1000);

  const handleSavePromotions = () => {
    hasEditedRef.current = false;
    settingsService.updateSettings({ campaigns, coupons });
    refreshData();
    showToast('প্রোমোশনাল ক্যাম্পেইন ও কুপন সফলভাবে সংরক্ষিত হয়েছে!', 'success');
  };

  const handleAddCampaign = () => {
    const newCamp: PromotionCampaign = {
      id: `camp-${Date.now()}`,
      name: 'নতুন ডিসকাউন্ট ক্যাম্পেইন',
      description: 'নির্বাচিত ৩.৫ ও ২.৫ বহরের কাপড়ে বিশেষ ছাড়।',
      discountPercentage: 15,
      couponCode: 'FESTIVE15',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      bannerImageUrl: '/images/hero/slide-1-jamdani.png',
      badgeText: '১৫% ছাড়',
      isActive: true
    };
    setCampaigns((prev) => [...prev, newCamp]);
  };

  const updateCampaign = (id: string, patch: Partial<PromotionCampaign>) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const created: Coupon = {
      code: newCouponCode.trim().toUpperCase(),
      discountType: newCouponType,
      discountValue: Number(newCouponValue),
      minOrderAmount: Number(newCouponMin),
      isActive: true,
      description:
        newCouponType === 'percentage'
          ? `${newCouponMin} টাকার অর্ডারে ${newCouponValue}% ছাড়`
          : `${newCouponMin} টাকার অর্ডারে ৳${newCouponValue} ফ্ল্যাট ছাড়`
    };
    const next = [...coupons.filter((c) => c.code !== created.code), created];
    setCoupons(next);
    settingsService.updateSettings({ campaigns, coupons: next });
    refreshData();
    setNewCouponCode('');
    showToast(`কুপন কোড ${created.code} যুক্ত হয়েছে!`, 'success');
  };

  const handleToggleCoupon = (code: string) => {
    const next = coupons.map((c) =>
      c.code === code ? { ...c, isActive: !c.isActive } : c
    );
    setCoupons(next);
    settingsService.updateSettings({ campaigns, coupons: next });
    refreshData();
  };

  const handleDeleteCoupon = (code: string) => {
    const next = coupons.filter((c) => c.code !== code);
    setCoupons(next);
    settingsService.updateSettings({ campaigns, coupons: next });
    refreshData();
    showToast('কুপন মুছে ফেলা হয়েছে', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#242424]">
            প্রোমোশন ও ডিসকাউন্ট ক্যাম্পেইন (Promotional Management)
          </h2>
          <p className="text-xs text-[#242424]/60 mt-0.5">
            ডিসকাউন্ট ক্যাম্পেইন, অফারের মেয়াদ, প্রোমো ব্যানার এবং কুপন কোড পরিচালনা করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={handleSavePromotions}
          className="px-5 py-2.5 bg-[#850B1B] hover:bg-[#6B0812] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4 text-[#D5A64A]" />
          <span>প্রোমোশন সংরক্ষণ করুন</span>
        </button>
      </div>

      {/* 1. Discount Campaigns */}
      <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-[#C5A46D]" />
            <h3 className="text-sm font-bold text-[#242424]">
              ডিসকাউন্ট ক্যাম্পেইন সমূহ ({campaigns.length}টি)
            </h3>
          </div>

          <button
            type="button"
            onClick={handleAddCampaign}
            className="px-3.5 py-2 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন ক্যাম্পেইন তৈরি করুন</span>
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="p-4 rounded-xl bg-[#FAF8F4] border border-[#EDE5D9] space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-sm text-[#850B1B]">{camp.name}</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={camp.isActive}
                      onChange={(e) => updateCampaign(camp.id, { isActive: e.target.checked })}
                      className="accent-emerald-600"
                    />
                    <span>সক্রিয় (Active)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCampaign(camp.id)}
                    className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">ক্যাম্পেইনের নাম</label>
                  <input
                    type="text"
                    value={camp.name}
                    onChange={(e) => updateCampaign(camp.id, { name: e.target.value })}
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">ছাড়ের হার (Discount %)</label>
                  <input
                    type="number"
                    value={camp.discountPercentage}
                    onChange={(e) =>
                      updateCampaign(camp.id, { discountPercentage: Number(e.target.value) })
                    }
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">কুপন কোড (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={camp.couponCode || ''}
                    onChange={(e) =>
                      updateCampaign(camp.id, { couponCode: e.target.value.toUpperCase() })
                    }
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">শুরুর তারিখ (Start Date)</label>
                  <input
                    type="date"
                    value={camp.startDate}
                    onChange={(e) => updateCampaign(camp.id, { startDate: e.target.value })}
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">শেষের তারিখ (End Date)</label>
                  <input
                    type="date"
                    value={camp.endDate}
                    onChange={(e) => updateCampaign(camp.id, { endDate: e.target.value })}
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">প্রোমো ব্যানার ছবির URL</label>
                  <input
                    type="text"
                    value={camp.bannerImageUrl || ''}
                    onChange={(e) => updateCampaign(camp.id, { bannerImageUrl: e.target.value })}
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-semibold mb-1">বিবরণ</label>
                  <input
                    type="text"
                    value={camp.description}
                    onChange={(e) => updateCampaign(camp.id, { description: e.target.value })}
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Coupon Codes */}
      <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#EDE5D9] pb-2">
          <Tag className="w-4 h-4 text-[#C5A46D]" />
          <h3 className="text-sm font-bold text-[#242424]">
            চেকআউট কুপন ও প্রোমো কোড সমূহ ({coupons.length}টি)
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          {coupons.map((coupon) => (
            <div
              key={coupon.code}
              className="p-3 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <span className="font-mono font-bold text-sm text-[#850B1B]">
                  {coupon.code}
                </span>
                <span className="text-[#242424]/70 ml-3">
                  {coupon.discountType === 'percentage'
                    ? `${coupon.discountValue}% ছাড়`
                    : `৳${coupon.discountValue} ছাড়`}{' '}
                  (সর্বনিম্ন অর্ডার: ৳{coupon.minOrderAmount})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleCoupon(coupon.code)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                    coupon.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border-gray-300'
                  }`}
                >
                  {coupon.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCoupon(coupon.code)}
                  className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleAddCoupon}
          className="pt-3 border-t border-[#EDE5D9] grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs items-end"
        >
          <div>
            <label className="block font-semibold mb-1">কুপন কোড</label>
            <input
              type="text"
              value={newCouponCode}
              onChange={(e) => setNewCouponCode(e.target.value)}
              placeholder="উদাঃ EID20"
              className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 uppercase font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">ছাড়ের ধরন</label>
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
            <label className="block font-semibold mb-1">মান (% বা ৳)</label>
            <input
              type="number"
              value={newCouponValue}
              onChange={(e) => setNewCouponValue(Number(e.target.value))}
              className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">সর্বনিম্ন অর্ডার (৳)</label>
            <input
              type="number"
              value={newCouponMin}
              onChange={(e) => setNewCouponMin(Number(e.target.value))}
              className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="py-2.5 px-4 bg-[#242424] hover:bg-[#C5A46D] text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            + কুপন যোগ করুন
          </button>
        </form>
      </div>
    </div>
  );
};
