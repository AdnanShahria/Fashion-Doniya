import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { measurementService } from '../../services/measurementService';
import { settingsService } from '../../services/settingsService';
import {
  MeasurementOutfitRule,
  AdditionalClothingItem,
  FabricWidth,
  CategoryMeasurementGuideRecord,
  ClothingSizeMeasurementEntry,
  AddonFabricOption
} from '../../types';
import { Plus, Edit3, Trash2, Check, X, Calculator, Ruler, Shirt, Save, Layers } from 'lucide-react';
import { AdminAddonFabricManagerModal } from '../../components/admin/AdminAddonFabricManagerModal';
import { INITIAL_ADDON_FABRIC_COLLECTIONS } from '../../data/seedData';

function resolveAddonCollectionKey(item: { id: string; name: string; nameEn?: string }): string {
  const combined = `${item.id} ${item.name} ${item.nameEn || ''}`.toLowerCase();
  if (combined.includes('inner') || combined.includes('ইনার')) return 'inner';
  if (combined.includes('palazzo') || combined.includes('প্লাজো')) return 'palazzo';
  if (combined.includes('pant') || combined.includes('প্যান্ট')) return 'pant';
  if (combined.includes('orna') || combined.includes('ওড়না') || combined.includes('ওড়না')) return 'orna';
  if (combined.includes('skirt') || combined.includes('scarf') || combined.includes('স্কার্ট')) return 'skirt';
  if (combined.includes('blouse') || combined.includes('ব্লাউজ')) return 'blouse';
  return item.id;
}

export const AdminMeasurements: React.FC = () => {
  const { showToast, refreshData, settings } = useStore();
  const [activeWidth, setActiveWidth] = useState<FabricWidth>('3.5');
  const [rules, setRules] = useState<MeasurementOutfitRule[]>(() => measurementService.getRules());
  const [additionalItems, setAdditionalItems] = useState<AdditionalClothingItem[]>(() => measurementService.getAdditionalItems());
  const [managingAddonCollection, setManagingAddonCollection] = useState<{ key: string; title: string } | null>(null);

  const addonFabricCollections: Record<string, AddonFabricOption[]> =
    settings?.addonFabricCollections || INITIAL_ADDON_FABRIC_COLLECTIONS;

  const handleSaveAddonCollections = (updatedCollections: Record<string, AddonFabricOption[]>) => {
    settingsService.updateSettings({ addonFabricCollections: updatedCollections });
    refreshData();
    showToast('অতিরিক্ত অংশের কাপড়ের কালেকশন সংরক্ষিত হয়েছে', 'success');
  };

  // Category & Clothing Size Guide Management State
  const [guides, setGuides] = useState<CategoryMeasurementGuideRecord[]>(() =>
    measurementService.getCategoryMeasurementGuides()
  );
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('kamiz');
  const [editingGuide, setEditingGuide] = useState<CategoryMeasurementGuideRecord | null>(null);

  // Sync editingGuide whenever activeWidth, selectedCategorySlug, or guides change
  useEffect(() => {
    const match = guides.find(
      (g) => g.fabricWidth === activeWidth && g.categorySlug === selectedCategorySlug
    ) || guides.find((g) => g.fabricWidth === activeWidth) || null;
    if (match) {
      setEditingGuide(JSON.parse(JSON.stringify(match)));
    }
  }, [activeWidth, selectedCategorySlug, guides]);

  // Edit Outfit Rule Modal
  const [editingRule, setEditingRule] = useState<MeasurementOutfitRule | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleYards, setRuleYards] = useState<number>(2.0);
  const [ruleDesc, setRuleDesc] = useState('');

  // Edit Addition Item Modal
  const [editingItem, setEditingItem] = useState<AdditionalClothingItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemYards, setItemYards] = useState<number>(2.0);

  const reload = () => {
    setRules(measurementService.getRules());
    setAdditionalItems(measurementService.getAdditionalItems());
    setGuides(measurementService.getCategoryMeasurementGuides());
    refreshData();
  };

  const handleSizeEntryChange = (
    index: number,
    field: keyof ClothingSizeMeasurementEntry,
    value: string | number | null
  ) => {
    if (!editingGuide) return;
    const nextSizes = [...editingGuide.sizes];
    nextSizes[index] = {
      ...nextSizes[index],
      [field]: value
    };
    setEditingGuide({
      ...editingGuide,
      sizes: nextSizes
    });
  };

  const handleSaveCategoryGuide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuide) return;

    const normalizedGuide: CategoryMeasurementGuideRecord = {
      ...editingGuide,
      suggestedYards: editingGuide.isAdminDefined
        ? null
        : Number(editingGuide.suggestedYards || 2.0),
      suggestedYardsLabel: editingGuide.isAdminDefined
        ? editingGuide.suggestedYardsLabel?.trim() || 'অ্যাডমিন নির্ধারিত'
        : `${Number(editingGuide.suggestedYards || 2.0)} গজ`,
      updatedAt: new Date().toISOString()
    };

    measurementService.saveCategoryMeasurementGuide(normalizedGuide);
    reload();
    showToast(`${normalizedGuide.categoryName} (${normalizedGuide.fabricWidth} বহর) সাইজ ও গজ গাইড সংরক্ষিত হয়েছে`, 'success');
  };

  const handleOpenAddRule = () => {
    setEditingRule(null);
    setRuleName('');
    setRuleYards(activeWidth === '3.5' ? 2.0 : 2.5);
    setRuleDesc('');
    setIsRuleModalOpen(true);
  };

  const handleOpenEditRule = (r: MeasurementOutfitRule) => {
    setEditingRule(r);
    setRuleName(r.name);
    setRuleYards(r.baseYards);
    setRuleDesc(r.description || '');
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !ruleYards) return;

    measurementService.saveRule({
      id: editingRule ? editingRule.id : `rule-${Date.now()}`,
      name: ruleName.trim(),
      nameEn: editingRule?.nameEn || ruleName.trim(),
      fabricWidth: activeWidth,
      baseYards: Number(ruleYards),
      category: ruleName.trim(),
      description: ruleDesc.trim() || undefined,
      isActive: true
    });

    reload();
    setIsRuleModalOpen(false);
    showToast('পোশাকের পরিমাপ সংরক্ষিত হয়েছে', 'success');
  };

  const handleDeleteRule = (id: string, name: string) => {
    if (window.confirm(`আপনি কি "${name}" পোশাকের পরিমাপ নিয়মটি মুছে ফেলতে চান?`)) {
      measurementService.deleteRule(id);
      reload();
      showToast('নিয়ম মুছে ফেলা হয়েছে', 'info');
    }
  };

  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemName('');
    setItemYards(2.0);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: AdditionalClothingItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemYards(item.yardsPerUnit);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemYards) return;

    measurementService.saveAdditionalItem({
      id: editingItem ? editingItem.id : `add-${Date.now()}`,
      name: itemName.trim(),
      nameEn: editingItem?.nameEn || itemName.trim(),
      fabricWidth: activeWidth,
      yardsPerUnit: Number(itemYards),
      isActive: true
    });

    reload();
    setIsItemModalOpen(false);
    showToast('অতিরিক্ত অংশের গজ সংরক্ষিত হয়েছে', 'success');
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`আপনি কি "${name}" অংশটি মুছে ফেলতে চান?`)) {
      measurementService.deleteAdditionalItem(id);
      reload();
      showToast('অতিরিক্ত অংশ মুছে ফেলা হয়েছে', 'info');
    }
  };

  const widthGuides = guides.filter((g) => g.fabricWidth === activeWidth);
  const filteredRules = rules.filter((r) => r.fabricWidth === activeWidth);
  const filteredItems = additionalItems.filter((i) => i.fabricWidth === activeWidth);

  return (
    <div className="space-y-8">
      
      {/* Header & Width Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#242424]">গজ ও সাইজ গাইড ব্যবস্থাপনা (Size & Gaj Management)</h2>
          <p className="text-xs text-[#242424]/60">
            ৩.৫ হাত বহর ও ২.৫ হাত বহরের ৬টি ক্যাটাগরির প্রস্তাবিত গজ, S/M/L/XL সাইজ চার্ট এবং ক্যালকুলেটরের নিয়মাবলী পরিচালনা করুন।
          </p>
        </div>

        {/* Width Switcher */}
        <div className="flex items-center p-1 bg-white border border-[#EDE5D9] rounded-lg self-start">
          <button
            onClick={() => setActiveWidth('3.5')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeWidth === '3.5'
                ? 'bg-[#242424] text-white shadow-xs'
                : 'text-[#242424]/60 hover:text-[#242424]'
            }`}
          >
            ৩.৫ হাত বহর
          </button>
          <button
            onClick={() => setActiveWidth('2.5')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeWidth === '2.5'
                ? 'bg-[#242424] text-white shadow-xs'
                : 'text-[#242424]/60 hover:text-[#242424]'
            }`}
          >
            ২.৫ হাত বহর
          </button>
        </div>
      </div>

      {/* Part 0: Category-Wise Fabric Measurement & S/M/L/XL Size Guide Management */}
      <div className="bg-white rounded-xl border border-[#EDE5D9] p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDE5D9] pb-4">
          <div>
            <h3 className="text-sm font-bold text-[#242424] flex items-center gap-2">
              <Shirt className="w-4 h-4 text-[#C5A46D]" />
              <span>ক্যাটাগরি ভিত্তিক প্রস্তাবিত গজ ও সাইজ গাইড (S, M, L, XL) — {activeWidth} হাত বহর</span>
            </h3>
            <p className="text-[11px] text-[#242424]/60 mt-0.5">
              পোশাকের ক্যাটাগরি নির্বাচন করে প্রস্তাবিত গজ এবং বুক, কোমর, হিপ ও লম্বার মাপ সংরক্ষণ করুন।
            </p>
          </div>
        </div>

        {/* Category Tabs (6 Categories) */}
        <div className="flex flex-wrap gap-2">
          {widthGuides.map((guide) => {
            const isSelected = guide.categorySlug === selectedCategorySlug;
            return (
              <button
                key={guide.id}
                type="button"
                onClick={() => setSelectedCategorySlug(guide.categorySlug)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#6B0F1A] text-white border-[#6B0F1A] shadow-xs'
                    : 'bg-[#FAF8F4] text-[#242424] border-[#EDE5D9] hover:border-[#C5A46D]'
                }`}
              >
                <span>{guide.categoryName}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#EDE5D9]/70 text-[#242424]/75'
                  }`}
                >
                  {guide.isAdminDefined ? 'অ্যাডমিন নির্ধারিত' : `${guide.suggestedYards} গজ`}
                </span>
              </button>
            );
          })}
        </div>

        {editingGuide && (
          <form onSubmit={handleSaveCategoryGuide} className="space-y-5 pt-2">
            {/* Suggested Gaj & Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#FAF8F4] p-4 rounded-xl border border-[#EDE5D9]">
              <div>
                <label className="block text-xs font-bold text-[#242424] mb-1.5">
                  ক্যাটাগরির প্রস্তাবিত গজ ({editingGuide.categoryName})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    disabled={editingGuide.isAdminDefined}
                    value={editingGuide.suggestedYards ?? ''}
                    onChange={(e) =>
                      setEditingGuide({
                        ...editingGuide,
                        suggestedYards: e.target.value ? Number(e.target.value) : null,
                        suggestedYardsLabel: e.target.value ? `${e.target.value} গজ` : 'অ্যাডমিন নির্ধারিত'
                      })
                    }
                    placeholder="যেমন: 2.0"
                    className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs font-bold text-[#242424] disabled:opacity-50"
                  />
                  <span className="text-xs font-semibold text-[#242424]/70 shrink-0">গজ</span>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#242424] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingGuide.isAdminDefined}
                    onChange={(e) =>
                      setEditingGuide({
                        ...editingGuide,
                        isAdminDefined: e.target.checked,
                        suggestedYards: e.target.checked ? null : editingGuide.suggestedYards || 2.0,
                        suggestedYardsLabel: e.target.checked
                          ? 'অ্যাডমিন নির্ধারিত'
                          : `${editingGuide.suggestedYards || 2.0} গজ`
                      })
                    }
                    className="accent-[#6B0F1A] w-4 h-4"
                  />
                  <span>অ্যাডমিন নির্ধারিত / কাস্টম গজ</span>
                </label>
                <span className="text-[11px] text-[#242424]/55 mt-1">
                  শাড়ি (২.৫ বহর) বা কাস্টম ডিজাইনের ক্ষেত্রে কাস্টমার নিজের পছন্দমতো গজ নির্বাচন করতে পারবেন।
                </span>
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#242424] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingGuide.sizeGuideEnabled}
                    onChange={(e) =>
                      setEditingGuide({
                        ...editingGuide,
                        sizeGuideEnabled: e.target.checked
                      })
                    }
                    className="accent-[#6B0F1A] w-4 h-4"
                  />
                  <span>S, M, L, XL সাইজ গাইড সক্রিয় রাখুন</span>
                </label>
                <span className="text-[11px] text-[#242424]/55 mt-1">
                  সক্রিয় থাকলে প্রোডাক্ট ও ক্যাটাগরি পেজে S, M, L, XL সাইজ চার্ট প্রদর্শিত হবে।
                </span>
              </div>
            </div>

            {/* S, M, L, XL Size Table Editor */}
            {editingGuide.sizeGuideEnabled && (
              <div className="overflow-x-auto border border-[#EDE5D9] rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F4] text-[#242424] font-bold border-b border-[#EDE5D9]">
                      <th className="p-2.5 w-20 text-center">সাইজ</th>
                      <th className="p-2.5">বুক (ইঞ্চি)</th>
                      <th className="p-2.5">কোমর (ইঞ্চি)</th>
                      <th className="p-2.5">হিপ (ইঞ্চি)</th>
                      <th className="p-2.5">লম্বা (ইঞ্চি)</th>
                      <th className="p-2.5">অন্যান্য প্রয়োজনীয় মাপ</th>
                      <th className="p-2.5 w-32 text-center">প্রস্তাবিত গজ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE5D9]">
                    {editingGuide.sizes.map((entry, idx) => (
                      <tr key={entry.size} className="hover:bg-[#FAF8F4]/50">
                        <td className="p-2.5 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-7 rounded-md bg-[#6B0F1A] text-white font-bold text-xs">
                            {entry.size}
                          </span>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={entry.chest}
                            onChange={(e) => handleSizeEntryChange(idx, 'chest', e.target.value)}
                            placeholder="অ্যাডমিন নির্ধারিত"
                            className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-md px-2.5 py-1.5 text-xs text-[#242424]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={entry.waist}
                            onChange={(e) => handleSizeEntryChange(idx, 'waist', e.target.value)}
                            placeholder="অ্যাডমিন নির্ধারিত"
                            className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-md px-2.5 py-1.5 text-xs text-[#242424]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={entry.hip}
                            onChange={(e) => handleSizeEntryChange(idx, 'hip', e.target.value)}
                            placeholder="অ্যাডমিন নির্ধারিত"
                            className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-md px-2.5 py-1.5 text-xs text-[#242424]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={entry.length}
                            onChange={(e) => handleSizeEntryChange(idx, 'length', e.target.value)}
                            placeholder="অ্যাডমিন নির্ধারিত"
                            className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-md px-2.5 py-1.5 text-xs text-[#242424]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={entry.otherMeasurements}
                            onChange={(e) => handleSizeEntryChange(idx, 'otherMeasurements', e.target.value)}
                            placeholder="হাতা / ঘের / শোল্ডার"
                            className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-md px-2.5 py-1.5 text-xs text-[#242424]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={entry.suggestedGaj ?? ''}
                            onChange={(e) =>
                              handleSizeEntryChange(
                                idx,
                                'suggestedGaj',
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            placeholder="গজ"
                            className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-md px-2.5 py-1.5 text-xs font-bold text-center text-[#242424]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Measurement Instructions & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#242424] mb-1">
                  মাপ নির্দেশনা (Measurement Instructions)
                </label>
                <textarea
                  rows={2}
                  value={editingGuide.measurementInstructions}
                  onChange={(e) =>
                    setEditingGuide({ ...editingGuide, measurementInstructions: e.target.value })
                  }
                  placeholder="কাস্টমারদের জন্য কাপড়ের মাপ ও কাটিং নির্দেশনা..."
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2.5 text-xs text-[#242424]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#242424] mb-1">
                  মাপ নোট (Measurement Notes)
                </label>
                <textarea
                  rows={2}
                  value={editingGuide.measurementNotes}
                  onChange={(e) =>
                    setEditingGuide({ ...editingGuide, measurementNotes: e.target.value })
                  }
                  placeholder="অতিরিক্ত নোট (যেমন: সাইজ অনুযায়ী ০.৫ গজ কম-বেশি হতে পারে)..."
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2.5 text-xs text-[#242424]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#6B0F1A] hover:bg-[#850B1B] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{editingGuide.categoryName} ({editingGuide.fabricWidth} বহর) সংরক্ষণ করুন</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Part 1: Main Outfit Rules */}
      <div className="bg-white rounded-xl border border-[#EDE5D9] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#242424] flex items-center gap-2">
              <Ruler className="w-4 h-4 text-[#C5A46D]" />
              <span>মূল পোশাকের প্রমিত গজ ({activeWidth} বহর)</span>
            </h3>
            <p className="text-[11px] text-[#242424]/60">কামিজ, শার্ট কামিজ, লং কটি, গাউন বা শাড়ির ভিত্তি গজ পরিমাণ</p>
          </div>

          <button
            onClick={handleOpenAddRule}
            className="px-3 py-1.5 bg-[#FAF8F4] hover:bg-[#EDE5D9] text-[#242424] border border-[#EDE5D9] rounded-md text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span>নতুন পোশাক নিয়ম যোগ করুন</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F4] text-[#242424] font-bold border-b border-[#EDE5D9]">
                <th className="p-2.5">পোশাকের নাম</th>
                <th className="p-2.5 text-center">বহর</th>
                <th className="p-2.5 text-center">প্রয়োজনীয় গজ</th>
                <th className="p-2.5">বর্ণনা / নোট</th>
                <th className="p-2.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE5D9] text-[#242424]/80">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#FAF8F4]/50">
                  <td className="p-2.5 font-bold text-[#242424]">{rule.name}</td>
                  <td className="p-2.5 text-center font-medium text-[#C5A46D]">{rule.fabricWidth} বহর</td>
                  <td className="p-2.5 text-center font-bold tabular-nums text-sm text-[#242424]">
                    {rule.baseYards} গজ
                  </td>
                  <td className="p-2.5 text-[#242424]/65">{rule.description || '—'}</td>
                  <td className="p-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditRule(rule)}
                        className="p-1.5 text-[#242424] hover:text-[#C5A46D] rounded-md transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id, rule.name)}
                        className="p-1.5 text-[#242424]/40 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Part 2: Additional Clothing Items */}
      <div className="bg-white rounded-xl border border-[#EDE5D9] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#242424] flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#C5A46D]" />
              <span>অতিরিক্ত কাপড়ের অংশ (Additional Clothing Items)</span>
            </h3>
            <p className="text-[11px] text-[#242424]/60">প্যান্ট, প্লাজো, ওড়না, ইনার ইত্যাদি অংশের জন্য গজ</p>
          </div>

          <button
            onClick={handleOpenAddItem}
            className="px-3 py-1.5 bg-[#FAF8F4] hover:bg-[#EDE5D9] text-[#242424] border border-[#EDE5D9] rounded-md text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span>নতুন অংশ যোগ করুন</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F4] text-[#242424] font-bold border-b border-[#EDE5D9]">
                <th className="p-2.5">অংশের নাম</th>
                <th className="p-2.5 text-center">বহর</th>
                <th className="p-2.5 text-center">প্রতি পিসে গজ</th>
                <th className="p-2.5 text-center">কাপড়ের কালেকশন</th>
                <th className="p-2.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE5D9] text-[#242424]/80">
              {filteredItems.map((item) => {
                const addonKey = resolveAddonCollectionKey(item);
                const collectionCount = (addonFabricCollections[addonKey] || []).length;
                return (
                  <tr key={item.id} className="hover:bg-[#FAF8F4]/50">
                    <td className="p-2.5 font-bold text-[#242424]">{item.name}</td>
                    <td className="p-2.5 text-center font-medium text-[#C5A46D]">{item.fabricWidth} বহর</td>
                    <td className="p-2.5 text-center font-bold tabular-nums text-sm text-[#242424]">
                      {item.yardsPerUnit} গজ
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setManagingAddonCollection({
                            key: addonKey,
                            title: item.name
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF3E8] hover:bg-[#850B1B] text-[#850B1B] hover:text-white border border-[#DFC9AA] text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        <Layers className="w-3 h-3" />
                        <span>কালেকশন পরিচালনা ({collectionCount}টি কাপড়)</span>
                      </button>
                    </td>
                    <td className="p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditItem(item)}
                          className="p-1.5 text-[#242424] hover:text-[#C5A46D] rounded-md transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-1.5 text-[#242424]/40 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outfit Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#EDE5D9] p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDE5D9] pb-3">
              <h3 className="font-bold text-sm text-[#242424]">
                {editingRule ? 'পোশাক নিয়ম সম্পাদনা' : 'নতুন পোশাক নিয়ম'} ({activeWidth} বহর)
              </h3>
              <button onClick={() => setIsRuleModalOpen(false)}>
                <X className="w-4 h-4 text-[#242424]" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">পোশাকের নাম (বাংলায়) *</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="যেমন: লং গাউন"
                  required
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">প্রয়োজনীয় গজ *</label>
                <input
                  type="number"
                  step="0.1"
                  value={ruleYards}
                  onChange={(e) => setRuleYards(Number(e.target.value))}
                  required
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">বিবরণ / কাটিং নোট</label>
                <input
                  type="text"
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  placeholder="যেমন: কোনো সাইড জোড়া ছাড়া"
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EDE5D9]">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 border border-[#EDE5D9] rounded-md font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#242424] text-white rounded-md font-semibold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Additional Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#EDE5D9] p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#EDE5D9] pb-3">
              <h3 className="font-bold text-sm text-[#242424]">
                {editingItem ? 'অতিরিক্ত অংশ সম্পাদনা' : 'নতুন অতিরিক্ত অংশ'} ({activeWidth} বহর)
              </h3>
              <button onClick={() => setIsItemModalOpen(false)}>
                <X className="w-4 h-4 text-[#242424]" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">অংশের নাম *</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="যেমন: ইনার (Inner)"
                  required
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">প্রতি পিসে প্রয়োজনীয় গজ *</label>
                <input
                  type="number"
                  step="0.1"
                  value={itemYards}
                  onChange={(e) => setItemYards(Number(e.target.value))}
                  required
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EDE5D9]">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 border border-[#EDE5D9] rounded-md font-medium"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#242424] text-white rounded-md font-semibold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {managingAddonCollection && (
        <AdminAddonFabricManagerModal
          isOpen={true}
          onClose={() => setManagingAddonCollection(null)}
          addonKey={managingAddonCollection.key}
          addonTitle={managingAddonCollection.title}
          collections={addonFabricCollections}
          onSaveCollections={handleSaveAddonCollections}
        />
      )}
    </div>
  );
};

