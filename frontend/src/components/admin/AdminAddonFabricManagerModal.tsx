import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Save,
  CheckCircle2
} from 'lucide-react';
import { AddonFabricOption } from '../../types';

interface AdminAddonFabricManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  addonKey: string; // e.g. 'inner', 'pant', etc.
  addonTitle: string; // e.g. 'ইনার (Inner)'
  collections: Record<string, AddonFabricOption[]>;
  onSaveCollections: (updated: Record<string, AddonFabricOption[]>) => void;
}

export const AdminAddonFabricManagerModal: React.FC<AdminAddonFabricManagerModalProps> = ({
  isOpen,
  onClose,
  addonKey,
  addonTitle,
  collections,
  onSaveCollections
}) => {
  const currentList: AddonFabricOption[] = collections[addonKey] || [];

  // Local state for the fabrics in this addon
  const [fabrics, setFabrics] = useState<AddonFabricOption[]>(currentList);

  // Form modal for adding / editing a single fabric
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingFabricId, setEditingFabricId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [fabricType, setFabricType] = useState('');
  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState('#850B1B');
  const [pricePerYard, setPricePerYard] = useState<number>(120);
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingFabricId(null);
    setName('');
    setFabricType('বাটার সিল্ক');
    setColor('ম্যাচিং ডাই');
    setColorHex('#850B1B');
    setPricePerYard(120);
    setImage('/src/assets/images/addon_inner_no_human_1794225834157.jpg');
    setDescription('');
    setIsDefault(fabrics.length === 0);
    setIsActive(true);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (fab: AddonFabricOption) => {
    setEditingFabricId(fab.id);
    setName(fab.name);
    setFabricType(fab.fabricType);
    setColor(fab.color);
    setColorHex(fab.colorHex || '#850B1B');
    setPricePerYard(fab.pricePerYard);
    setImage(fab.image);
    setDescription(fab.description || '');
    setIsDefault(!!fab.isDefault);
    setIsActive(fab.isActive !== false);
    setIsEditorOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFabricForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let updatedList = [...fabrics];

    if (isDefault) {
      // Unset previous default
      updatedList = updatedList.map((f) => ({ ...f, isDefault: false }));
    }

    if (editingFabricId) {
      updatedList = updatedList.map((f) =>
        f.id === editingFabricId
          ? {
              ...f,
              name: name.trim(),
              fabricType: fabricType.trim() || 'বাটার সিল্ক',
              color: color.trim() || 'ম্যাচিং ডাই',
              colorHex,
              pricePerYard: Number(pricePerYard) || 100,
              image: image || f.image,
              description: description.trim() || undefined,
              isDefault,
              isActive
            }
          : f
      );
    } else {
      const newOption: AddonFabricOption = {
        id: `addon-${addonKey}-${Date.now()}`,
        addonId: addonKey,
        name: name.trim(),
        fabricType: fabricType.trim() || 'বাটার সিল্ক',
        color: color.trim() || 'ম্যাচিং ডাই',
        colorHex,
        pricePerYard: Number(pricePerYard) || 100,
        image: image || '/src/assets/images/addon_inner_no_human_1794225834157.jpg',
        description: description.trim() || undefined,
        isDefault,
        isActive,
        order: updatedList.length + 1
      };
      updatedList.push(newOption);
    }

    setFabrics(updatedList);
    setIsEditorOpen(false);

    // Save immediately
    const updatedCollections = {
      ...collections,
      [addonKey]: updatedList
    };
    onSaveCollections(updatedCollections);
  };

  const handleDeleteFabric = (fabricId: string, fabricName: string) => {
    if (!window.confirm(`আপনি কি "${fabricName}" ফেব্রিকটি কালেকশন থেকে মুছে ফেলতে চান?`)) {
      return;
    }
    const updatedList = fabrics.filter((f) => f.id !== fabricId);
    setFabrics(updatedList);
    const updatedCollections = {
      ...collections,
      [addonKey]: updatedList
    };
    onSaveCollections(updatedCollections);
  };

  const handleToggleActive = (fabricId: string) => {
    const updatedList = fabrics.map((f) =>
      f.id === fabricId ? { ...f, isActive: !f.isActive } : f
    );
    setFabrics(updatedList);
    const updatedCollections = {
      ...collections,
      [addonKey]: updatedList
    };
    onSaveCollections(updatedCollections);
  };

  const handleSetDefault = (fabricId: string) => {
    const updatedList = fabrics.map((f) => ({
      ...f,
      isDefault: f.id === fabricId
    }));
    setFabrics(updatedList);
    const updatedCollections = {
      ...collections,
      [addonKey]: updatedList
    };
    onSaveCollections(updatedCollections);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
    >
      <div
        className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-[#EDE5D9] flex flex-col overflow-hidden text-[#242424]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EDE5D9] bg-[#FAF8F4] flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF3E8] border border-[#DFC9AA] text-[11px] font-bold text-[#850B1B]">
              <Layers className="w-3.5 h-3.5 text-[#C5A46D]" />
              <span>এডমিন প্যানেল · ফেব্রিক কালেকশন ম্যানেজমেন্ট</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#242424] mt-1">
              "{addonTitle}" এর কাপড়ের কালেকশন পরিচালনা
            </h3>
            <p className="text-xs text-[#242424]/70">
              কাস্টমার যখন এই অংশটি বেছে নেবেন, তখন তারা এই কাপড়ের কালেকশন ও প্রতি গজের মূল্য দেখতে পাবেন।
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#EDE5D9] bg-white hover:bg-[#FAF8F4] flex items-center justify-center text-[#242424]/60 hover:text-rose-600 cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-5 py-3 bg-white border-b border-[#EDE5D9] flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-[#242424]/80">
            মোট কাপড়: <strong className="text-[#850B1B]">{fabrics.length}টি</strong>
          </span>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 rounded-lg bg-[#850B1B] hover:bg-[#6B0812] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন কাপড় যোগ করুন</span>
          </button>
        </div>

        {/* Fabrics Table / Cards */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 bg-[#FAF8F4]">
          {fabrics.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-[#EDE5D9] space-y-2">
              <p className="text-xs font-semibold text-[#242424]/60">
                এই অংশে এখনো কোনো কাপড় যুক্ত করা হয়নি।
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="text-xs font-bold text-[#850B1B] hover:underline"
              >
                + এখনই প্রথম কাপড় যোগ করুন
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {fabrics.map((fabric) => (
                <div
                  key={fabric.id}
                  className={`p-3.5 bg-white rounded-xl border transition-all flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 ${
                    fabric.isActive !== false ? 'border-[#EDE5D9]' : 'border-[#EDE5D9]/60 opacity-60'
                  }`}
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#EDE5D9] bg-[#FAF8F4] shrink-0 relative">
                      <img
                        src={fabric.image}
                        alt={fabric.name}
                        className="w-full h-full object-cover"
                      />
                      {fabric.colorHex && (
                        <div
                          className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: fabric.colorHex }}
                          title={fabric.color}
                        />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-[#242424] leading-snug">
                          {fabric.name}
                        </h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FAF3E8] border border-[#DFC9AA] text-[#850B1B]">
                          {fabric.fabricType}
                        </span>
                        {fabric.isDefault ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ডিফল্ট কাপড়
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(fabric.id)}
                            className="text-[10px] text-[#242424]/60 hover:text-[#850B1B] underline cursor-pointer"
                          >
                            ডিফল্ট করুন
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#242424]/75">
                        <span>রং: <strong>{fabric.color}</strong></span>
                        <span>•</span>
                        <span className="text-[#850B1B] font-bold">
                          ৳{fabric.pricePerYard} / গজ
                        </span>
                      </div>

                      {fabric.description && (
                        <p className="text-[10px] text-[#242424]/60 truncate max-w-md">
                          {fabric.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(fabric.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer border ${
                        fabric.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}
                    >
                      {fabric.isActive !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(fabric)}
                      className="p-1.5 rounded-md hover:bg-[#FAF3E8] text-[#242424]/80 hover:text-[#850B1B] border border-[#EDE5D9] transition-colors cursor-pointer"
                      title="সম্পাদনা করুন"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteFabric(fabric.id, fabric.name)}
                      className="p-1.5 rounded-md hover:bg-rose-50 text-[#242424]/40 hover:text-rose-600 border border-[#EDE5D9] transition-colors cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#EDE5D9] flex items-center justify-between gap-3">
          <p className="text-[11px] text-[#242424]/60 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>যেকোনো পরিবর্তন সাথে সাথে লাইভ ওয়েবসাইটে সংরক্ষিত ও সক্রিয় হবে</span>
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#242424] hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>

      {/* Fabric Add / Edit Sub-Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-[#EDE5D9] p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
              <h4 className="text-sm font-bold text-[#242424]">
                {editingFabricId ? 'ফেব্রিক তথ্য সম্পাদনা' : 'নতুন ফেব্রিক যুক্ত করুন'}
              </h4>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-[#242424]/60 hover:text-[#242424]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFabricForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#242424] mb-1">
                  ফেব্রিকের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: রয়েল বাটার সিল্ক ইনার ফেব্রিক"
                  className="w-full px-3 py-2 border border-[#EDE5D9] rounded-lg focus:border-[#850B1B] outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#242424] mb-1">
                    ফেব্রিকের ধরন
                  </label>
                  <input
                    type="text"
                    value={fabricType}
                    onChange={(e) => setFabricType(e.target.value)}
                    placeholder="যেমন: বাটার সিল্ক / সেন্টুন / সুতি"
                    className="w-full px-3 py-2 border border-[#EDE5D9] rounded-lg focus:border-[#850B1B] outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#242424] mb-1">
                    প্রতি গজের মূল্য (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={pricePerYard}
                    onChange={(e) => setPricePerYard(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#EDE5D9] rounded-lg focus:border-[#850B1B] outline-none text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#242424] mb-1">
                    রং / শেড
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="যেমন: ম্যাচিং ডাই / অফ-হোয়াইট"
                    className="w-full px-3 py-2 border border-[#EDE5D9] rounded-lg focus:border-[#850B1B] outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#242424] mb-1">
                    কালার সোয়াচ
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-8 h-8 rounded border border-[#EDE5D9] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-full px-2 py-1.5 border border-[#EDE5D9] rounded text-[11px] font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#242424] mb-1">
                  ফেব্রিকের ছবি (URL বা ডিভাইস থেকে আপলোড)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="/src/assets/images/... অথবা https://..."
                    className="flex-1 px-3 py-2 border border-[#EDE5D9] rounded-lg focus:border-[#850B1B] outline-none text-xs"
                  />
                  <label className="px-3 py-2 bg-[#FAF8F4] border border-[#EDE5D9] hover:bg-[#FAF3E8] rounded-lg cursor-pointer text-xs font-semibold flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>আপলোড</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {image && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#EDE5D9] relative">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#242424] mb-1">
                  বিবরণ (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="যেমন: কামিজের ভেতরের জন্য অত্যন্ত মোলায়েম, মসৃণ ও দীর্ঘস্থায়ী কাপড়ের অপশন।"
                  className="w-full px-3 py-2 border border-[#EDE5D9] rounded-lg focus:border-[#850B1B] outline-none text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-[#242424]">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 text-[#850B1B] rounded border-[#EDE5D9]"
                  />
                  <span>ডিফল্ট কাপড় হিসেবে সেট করুন</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-[#242424]">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#850B1B] rounded border-[#EDE5D9]"
                  />
                  <span>সক্রিয় রাখুন</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#EDE5D9] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-3.5 py-1.5 border border-[#EDE5D9] rounded-lg text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#850B1B] hover:bg-[#6B0812] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
