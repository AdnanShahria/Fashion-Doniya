import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { categoryService } from '../../services/categoryService';
import { uploadAdminImage } from '../../services/uploadService';
import {
  Category,
  FabricCollectionType,
  FabricSectionRecord,
  FabricCategoryRecord,
  FabricCategoryDesignSettingsRecord,
  CategoryIconName
} from '../../types';
import {
  BaharEditorialCategorySection,
  renderCategoryIcon,
  toBengaliDigits
} from '../../components/common/BaharEditorialCategorySection';
import { getUniqueProductFabricImage } from '../../components/home/allProductsImageGenerator';
import {
  Plus,
  Edit3,
  Trash2,
  X,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  Palette,
  LayoutGrid,
  Monitor,
  Smartphone,
  Columns,
  Image as ImageIcon,
  Layers,
  Copy
} from 'lucide-react';

const ICON_OPTIONS: { value: CategoryIconName; label: string }[] = [
  { value: 'shirt', label: 'কামিজ / পোশাক (Shirt)' },
  { value: 'scissors', label: 'কাটিং / শর্ট কামিজ (Scissors)' },
  { value: 'crown', label: 'রয়েল / কটি (Crown)' },
  { value: 'sparkles', label: 'গাউন / পার্টি (Gem)' },
  { value: 'gem', label: 'শাড়ি / জামদানি (Gem)' },
  { value: 'feather', label: 'নকশি / এমব্রয়ডারি (Feather)' },
  { value: 'palette', label: 'কাস্টম ডিজাইন (Palette)' },
  { value: 'layers', label: 'ফেব্রিক থান (Layers)' }
];

const LINK_PRESETS: { value: string; label: string }[] = [
  { value: 'category-gallery:kamiz', label: 'কামিজ গ্যালারি (kamiz)' },
  { value: 'category-gallery:short-kamiz', label: 'শার্ট / শর্ট কামিজ গ্যালারি (short-kamiz)' },
  { value: 'category-gallery:long-koti', label: 'নেহ কটি / লং কটি গ্যালারি (long-koti)' },
  { value: 'category-gallery:gown-lehenga', label: 'গাউন / লেহেঙ্গা গ্যালারি (gown-lehenga)' },
  { value: 'category-gallery:gown', label: 'গাউন গ্যালারি (gown)' },
  { value: 'category-gallery:saree', label: 'শাড়ি গ্যালারি (saree)' },
  { value: 'category-gallery:custom-design', label: 'কাস্টম ডিজাইন গ্যালারি (custom-design)' },
  { value: 'calculator', label: 'গজ ক্যালকুলেটর পেজ (calculator)' },
  { value: 'custom-design-page', label: 'কাস্টম অর্ডার ফর্ম (custom-design-page)' }
];

export const AdminCategories: React.FC = () => {
  const { showToast, products } = useStore();

  // Top-level management mode: 3.5 Bahar, 2.5 Bahar, or General Categories
  const [activeCollectionTab, setActiveCollectionTab] = useState<
    '3.5_bahar' | '2.5_bahar' | 'general'
  >('3.5_bahar');

  // Sub-panel inside a Bahar collection: Content Management, Design Customization, or Live Preview
  const [subTab, setSubTab] = useState<'content' | 'design' | 'preview'>('content');

  // Preview controls
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [previewCompareBoth, setPreviewCompareBoth] = useState<boolean>(false);

  // Draft state for 3.5_bahar and 2.5_bahar
  const [draft35, setDraft35] = useState(() => categoryService.getDraftCollection('3.5_bahar'));
  const [draft25, setDraft25] = useState(() => categoryService.getDraftCollection('2.5_bahar'));
  const [isSaving, setIsSaving] = useState(false);

  // Drag-and-drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Category Edit / Add Modal state for Bahar collections
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<FabricCategoryRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Legacy General Categories state
  const [categories, setCategories] = useState<Category[]>(() =>
    categoryService.getAllCategories()
  );
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false);
  const [editingLegacyCategory, setEditingLegacyCategory] = useState<Category | null>(null);
  const [legacyName, setLegacyName] = useState('');
  const [legacySlug, setLegacySlug] = useState('');
  const [legacyFabricWidth, setLegacyFabricWidth] = useState<'all' | '2.5' | '3.5'>('all');
  const [legacyDescription, setLegacyDescription] = useState('');

  // Load latest state from backend on mount
  useEffect(() => {
    categoryService.syncFromBackend().then(() => {
      setDraft35(categoryService.getDraftCollection('3.5_bahar'));
      setDraft25(categoryService.getDraftCollection('2.5_bahar'));
    });
  }, []);

  const currentCollectionType: FabricCollectionType =
    activeCollectionTab === '2.5_bahar' ? '2.5_bahar' : '3.5_bahar';
  const currentWidth = currentCollectionType === '3.5_bahar' ? '3.5' : '2.5';
  const currentDraft = currentCollectionType === '3.5_bahar' ? draft35 : draft25;

  const updateCurrentDraft = (
    updater: (prev: typeof draft35) => {
      section: FabricSectionRecord;
      categories: FabricCategoryRecord[];
      designSettings: FabricCategoryDesignSettingsRecord;
      savedAt?: string;
      hasUnpushedDraft?: boolean;
      hasPreviousPublished?: boolean;
    }
  ) => {
    if (currentCollectionType === '3.5_bahar') {
      setDraft35((prev) => {
        const next = updater(prev);
        return {
          ...prev,
          ...next,
          hasUnpushedDraft: true
        };
      });
    } else {
      setDraft25((prev) => {
        const next = updater(prev);
        return {
          ...prev,
          ...next,
          hasUnpushedDraft: true
        };
      });
    }
  };

  // ==========================================================================
  // Publishing & Draft Handlers
  // ==========================================================================
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await categoryService.saveDraft(currentCollectionType, {
        section: currentDraft.section,
        categories: currentDraft.categories,
        designSettings: currentDraft.designSettings
      });
      setDraft35(categoryService.getDraftCollection('3.5_bahar'));
      setDraft25(categoryService.getDraftCollection('2.5_bahar'));
      showToast(
        `${toBengaliDigits(currentWidth)} বহরের ড্রাফট সফলভাবে সংরক্ষিত হয়েছে (অপ্রকাশিত)`,
        'info'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      await categoryService.publishCollection(currentCollectionType, {
        section: currentDraft.section,
        categories: currentDraft.categories,
        designSettings: currentDraft.designSettings
      });
      setDraft35(categoryService.getDraftCollection('3.5_bahar'));
      setDraft25(categoryService.getDraftCollection('2.5_bahar'));
      showToast(
        `${toBengaliDigits(currentWidth)} বহরের ক্যাটাগরি ও ডিজাইন সফলভাবে লাইভ ওয়েবসাইটে পাবলিশ হয়েছে!`,
        'success'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevertToPrevious = async (resetToFactory = false) => {
    setIsSaving(true);
    try {
      await categoryService.revertCollection(currentCollectionType, resetToFactory);
      setDraft35(categoryService.getDraftCollection('3.5_bahar'));
      setDraft25(categoryService.getDraftCollection('2.5_bahar'));
      showToast(
        resetToFactory
          ? `${toBengaliDigits(currentWidth)} বহর ডিফল্ট এডিটোরিয়াল ডিজাইনে রিসেট হয়েছে`
          : `${toBengaliDigits(currentWidth)} বহর পূর্ববর্তী পাবলিশকৃত অবস্থায় ফিরিয়ে আনা হয়েছে`,
        'info'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyDesignToOtherBahar = () => {
    const targetType: FabricCollectionType =
      currentCollectionType === '3.5_bahar' ? '2.5_bahar' : '3.5_bahar';
    const copiedDesign: FabricCategoryDesignSettingsRecord = {
      ...JSON.parse(JSON.stringify(currentDraft.designSettings)),
      id: targetType === '3.5_bahar' ? 'fdesign-35-bahar' : 'fdesign-25-bahar',
      collection_type: targetType,
      updatedAt: new Date().toISOString()
    };

    if (targetType === '3.5_bahar') {
      setDraft35((prev) => ({
        ...prev,
        designSettings: copiedDesign,
        hasUnpushedDraft: true
      }));
    } else {
      setDraft25((prev) => ({
        ...prev,
        designSettings: copiedDesign,
        hasUnpushedDraft: true
      }));
    }
    showToast(
      `ডিজাইন সেটিংস ${targetType === '3.5_bahar' ? '৩.৫ বহরে' : '২.৫ বহরে'} কপি করা হয়েছে!`,
      'success'
    );
  };

  // ==========================================================================
  // Drag-and-Drop & Reordering Handlers
  // ==========================================================================
  const reorderCategories = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    updateCurrentDraft((prev) => {
      const list = [...prev.categories].sort((a, b) => a.order - b.order);
      if (toIdx >= list.length) return prev;
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      const reindexed = list.map((item, idx) => ({
        ...item,
        order: idx + 1
      }));
      return {
        ...prev,
        categories: reindexed
      };
    });
  };

  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragOverIndex !== idx) {
      setDragOverIndex(idx);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIdx) {
      reorderCategories(draggedIndex, dropIdx);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleToggleCategoryEnabled = (id: string) => {
    updateCurrentDraft((prev) => ({
      ...prev,
      categories: prev.categories.map((c) =>
        c.id === id ? { ...c, isEnabled: !c.isEnabled } : c
      )
    }));
  };

  const handleDeleteBaharCategory = (id: string) => {
    updateCurrentDraft((prev) => {
      const filtered = prev.categories
        .filter((c) => c.id !== id)
        .map((c, idx) => ({ ...c, order: idx + 1 }));
      return {
        ...prev,
        categories: filtered
      };
    });
    showToast('ক্যাটাগরিটি ড্রাফট থেকে সরানো হয়েছে (পাবলিশ করলে লাইভ হবে)', 'info');
  };

  const handleOpenAddBaharCategory = () => {
    const widthProds = products.filter((p) => p.fabricWidth === currentWidth);
    const defaultRepProd =
      widthProds[0]?.id || (currentWidth === '3.5' ? 'prod-35-kamiz-1' : 'prod-25-kamiz-1');

    setEditingCat({
      id: `fcat-${currentWidth.replace('.', '')}-${Date.now()}`,
      collection_type: currentCollectionType,
      name: '',
      matchCategoryName: 'কামিজ',
      slug: 'kamiz',
      description: '',
      sampleFabrics: '',
      standardYards: currentWidth === '3.5' ? '২.০ গজ' : '২.৫ গজ',
      buttonLabel: 'কালেকশন দেখুন',
      buttonLink: 'category-gallery:kamiz',
      icon: 'sparkles',
      representativeProductId: defaultRepProd,
      fallbackColorHex: '#850B1B',
      fallbackPatternType: 'jamdani',
      customImageUrl: '',
      order: currentDraft.categories.length + 1,
      isEnabled: true,
      updatedAt: new Date().toISOString()
    });
    setIsCatModalOpen(true);
  };

  const handleOpenEditBaharCategory = (cat: FabricCategoryRecord) => {
    setEditingCat(JSON.parse(JSON.stringify(cat)));
    setIsCatModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCat) return;

    try {
      const url = await uploadAdminImage(file);
      setEditingCat((prev) => (prev ? { ...prev, customImageUrl: url } : null));
      showToast('ক্যাটাগরি ছবি সফলভাবে আপলোড হয়েছে', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'ছবি আপলোড করতে সমস্যা হয়েছে',
        'error'
      );
    }
    e.target.value = '';
  };

  const handleSaveBaharCategoryModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editingCat.name.trim()) return;

    const cleaned: FabricCategoryRecord = {
      ...editingCat,
      name: editingCat.name.trim(),
      slug:
        editingCat.slug.trim() ||
        editingCat.name.trim().toLowerCase().replace(/\s+/g, '-'),
      buttonLabel: editingCat.buttonLabel.trim() || 'কালেকশন দেখুন',
      updatedAt: new Date().toISOString()
    };

    updateCurrentDraft((prev) => {
      const existsIdx = prev.categories.findIndex((c) => c.id === cleaned.id);
      let nextList: FabricCategoryRecord[];
      if (existsIdx >= 0) {
        nextList = [...prev.categories];
        nextList[existsIdx] = cleaned;
      } else {
        nextList = [...prev.categories, cleaned];
      }
      return {
        ...prev,
        categories: nextList.map((c, idx) => ({ ...c, order: idx + 1 }))
      };
    });

    setIsCatModalOpen(false);
    setEditingCat(null);
    showToast('ক্যাটাগরি পরিবর্তন ড্রাফটে যুক্ত হয়েছে। লাইভ করতে "পাবলিশ করুন" চাপুন।', 'success');
  };

  // ==========================================================================
  // Legacy General Categories Handlers
  // ==========================================================================
  const reloadLegacy = () => {
    setCategories(categoryService.getAllCategories());
  };

  const handleOpenLegacyAdd = () => {
    setEditingLegacyCategory(null);
    setLegacyName('');
    setLegacySlug('');
    setLegacyFabricWidth('all');
    setLegacyDescription('');
    setIsLegacyModalOpen(true);
  };

  const handleOpenLegacyEdit = (cat: Category) => {
    setEditingLegacyCategory(cat);
    setLegacyName(cat.name);
    setLegacySlug(cat.slug);
    setLegacyFabricWidth(cat.fabricWidth);
    setLegacyDescription(cat.description || '');
    setIsLegacyModalOpen(true);
  };

  const handleLegacyDelete = (id: string) => {
    categoryService.deleteCategory(id);
    reloadLegacy();
    showToast('ক্যাটাগরি মুছে ফেলা হয়েছে', 'info');
  };

  const handleLegacySave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!legacyName.trim()) return;

    const catToSave: Category = {
      id: editingLegacyCategory ? editingLegacyCategory.id : `cat-${Date.now()}`,
      name: legacyName.trim(),
      slug: legacySlug.trim() || legacyName.trim().toLowerCase().replace(/\s+/g, '-'),
      fabricWidth: legacyFabricWidth,
      order: editingLegacyCategory ? editingLegacyCategory.order : categories.length + 1,
      description: legacyDescription.trim() || undefined
    };

    categoryService.saveCategory(catToSave);
    reloadLegacy();
    setIsLegacyModalOpen(false);
    showToast('ক্যাটাগরি সংরক্ষিত হয়েছে', 'success');
  };

  // Filter products strictly matching the active Bahar so 2.5 Bahar never uses 3.5 Bahar images
  const matchingWidthProducts = products.filter((p) => p.fabricWidth === currentWidth);

  return (
    <div className="space-y-6">
      {/* Top Header & Independent Bahar Collection Switcher */}
      <div className="bg-white rounded-xl border border-[#EDE5D9] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#242424]">
              ৩.৫ ও ২.৫ বহর প্রিমিয়াম ক্যাটাগরি ও ডিজাইন ম্যানেজমেন্ট
            </h2>
            <p className="text-xs text-[#242424]/65 mt-0.5">
              ৩.৫ বহর এবং ২.৫ বহরের ইনার ক্যাটাগরি সেকশন, ছবি, টেক্সট, কালার ও লেআউট আলাদাভাবে কাস্টমাইজ, প্রিভিউ এবং পাবলিশ করুন।
            </p>
          </div>

          {/* Collection Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-[#FAF6F0] p-1.5 rounded-xl border border-[#E5D5BE]">
            <button
              type="button"
              onClick={() => setActiveCollectionTab('3.5_bahar')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeCollectionTab === '3.5_bahar'
                  ? 'bg-[#850B1B] text-white shadow-xs'
                  : 'text-[#4A2C2A] hover:text-[#850B1B]'
              }`}
            >
              <span>৩.৫ বহর ক্যাটাগরি ম্যানেজমেন্ট</span>
              {draft35.hasUnpushedDraft && (
                <span className="w-2 h-2 rounded-full bg-[#D5A64A]" title="অপ্রকাশিত ড্রাফট রয়েছে" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveCollectionTab('2.5_bahar')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeCollectionTab === '2.5_bahar'
                  ? 'bg-[#850B1B] text-white shadow-xs'
                  : 'text-[#4A2C2A] hover:text-[#850B1B]'
              }`}
            >
              <span>২.৫ বহর ক্যাটাগরি ম্যানেজমেন্ট</span>
              {draft25.hasUnpushedDraft && (
                <span className="w-2 h-2 rounded-full bg-[#D5A64A]" title="অপ্রকাশিত ড্রাফট রয়েছে" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveCollectionTab('general')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCollectionTab === 'general'
                  ? 'bg-[#242424] text-white'
                  : 'text-[#4A2C2A] hover:text-[#242424]'
              }`}
            >
              সাধারণ ক্যাটাগরি তালিকা
            </button>
          </div>
        </div>

        {/* Action & Publishing Toolbar when in 3.5_bahar or 2.5_bahar */}
        {activeCollectionTab !== 'general' && (
          <div className="pt-3 border-t border-[#EDE5D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Sub-navigation: Content | Design | Preview */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSubTab('content')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  subTab === 'content'
                    ? 'bg-[#FAF6F0] text-[#850B1B] border border-[#D5A64A]'
                    : 'text-[#242424]/70 hover:bg-[#FAF8F4]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>কনটেন্ট ও ক্যাটাগরি ({toBengaliDigits(currentDraft.categories.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('design')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  subTab === 'design'
                    ? 'bg-[#FAF6F0] text-[#850B1B] border border-[#D5A64A]'
                    : 'text-[#242424]/70 hover:bg-[#FAF8F4]'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>ডিজাইন ও লেআউট কাস্টমাইজেশন</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('preview')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  subTab === 'preview'
                    ? 'bg-[#FAF6F0] text-[#850B1B] border border-[#D5A64A]'
                    : 'text-[#242424]/70 hover:bg-[#FAF8F4]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>লাইভ প্রিভিউ (৩.৫ ও ২.৫ বহর)</span>
              </button>
            </div>

            {/* Publishing Workflow Buttons: Save Draft, Preview, Revert, Publish */}
            <div className="flex flex-wrap items-center gap-2">
              {currentDraft.hasUnpushedDraft && (
                <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-semibold">
                  আনপাবলিশড পরিবর্তন রয়েছে
                </span>
              )}

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleRevertToPrevious(false)}
                className="px-3 py-1.5 rounded-lg border border-[#D5A64A]/70 bg-[#FAF6F0] hover:bg-[#F3ECE0] text-[#850B1B] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                title="পূর্বে প্রকাশিত অবস্থায় ফিরে যান"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>পূর্বের পাবলিশে ফিরুন</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveDraft}
                className="px-3.5 py-1.5 rounded-lg border border-[#242424]/25 bg-white hover:bg-[#FAF8F4] text-[#242424] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ড্রাফট সেভ করুন</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={handlePublish}
                className="px-4 py-1.5 rounded-lg bg-[#850B1B] hover:bg-[#6B0812] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D5A64A]" />
                <span>পাবলিশ করুন ({toBengaliDigits(currentWidth)} বহর)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* BAHAR COLLECTION MANAGEMENT: CONTENT TAB                             */}
      {/* ==================================================================== */}
      {activeCollectionTab !== 'general' && subTab === 'content' && (
        <div className="space-y-6">
          {/* 1. Section Heading & Subtitle Editor (fabric_sections) */}
          <div className="bg-white rounded-xl border border-[#EDE5D9] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#850B1B]">
                  {toBengaliDigits(currentWidth)} বহর সেকশন হেডিং ও সাবটাইটেল (`fabric_sections`)
                </h3>
                <p className="text-[11px] text-[#242424]/60">
                  ইনার ক্যাটাগরি সেকশনের উপরের শিরোনাম ও বর্ণনা পরিবর্তন করুন
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#FAF6F0] border border-[#D5A64A]/50 text-[#850B1B] text-[11px] font-mono font-bold">
                collection_type: {currentCollectionType}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#242424] mb-1">
                  উপরের ছোট ট্যাগ (Eyebrow)
                </label>
                <input
                  type="text"
                  value={currentDraft.section.eyebrow}
                  onChange={(e) =>
                    updateCurrentDraft((prev) => ({
                      ...prev,
                      section: { ...prev.section, eyebrow: e.target.value }
                    }))
                  }
                  className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs text-[#242424] focus:border-[#850B1B] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#242424] mb-1">
                  প্রধান শিরোনাম (Section Heading) *
                </label>
                <input
                  type="text"
                  value={currentDraft.section.heading}
                  onChange={(e) =>
                    updateCurrentDraft((prev) => ({
                      ...prev,
                      section: { ...prev.section, heading: e.target.value }
                    }))
                  }
                  className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs font-bold text-[#850B1B] focus:border-[#850B1B] outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#242424] mb-1">
                  সাবটাইটেল / সংক্ষিপ্ত নির্দেশিকা (Subtitle)
                </label>
                <input
                  type="text"
                  value={currentDraft.section.subtitle}
                  onChange={(e) =>
                    updateCurrentDraft((prev) => ({
                      ...prev,
                      section: { ...prev.section, subtitle: e.target.value }
                    }))
                  }
                  className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs text-[#242424] focus:border-[#850B1B] outline-none"
                />
              </div>
            </div>
          </div>

          {/* 2. Categories List with Drag-and-Drop Reorder, Enable/Disable, Edit, Delete */}
          <div className="bg-white rounded-xl border border-[#EDE5D9] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDE5D9] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#850B1B]">
                  {toBengaliDigits(currentWidth)} বহরের ক্যাটাগরি কার্ড তালিকা (`fabric_categories`)
                </h3>
                <p className="text-[11px] text-[#242424]/60">
                  মাউস দিয়ে টেনে (Drag & Drop) অথবা তীর চিহ্ন দিয়ে ক্যাটাগরির ক্রম সাজান। প্রতিটি কার্ডের নাম, বিবরণ, বাটন, আইকন ও ছবি কাস্টমাইজ করুন।
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddBaharCategory}
                className="px-3.5 py-2 rounded-lg bg-[#850B1B] hover:bg-[#6B0812] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-[#D5A64A]" />
                <span>নতুন {toBengaliDigits(currentWidth)} বহর ক্যাটাগরি যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {currentDraft.categories.map((cat, idx) => {
                const repProd =
                  products.find((p) => p.id === cat.representativeProductId) ||
                  matchingWidthProducts[0];
                const previewImg =
                  cat.customImageUrl && cat.customImageUrl.trim().length > 0
                    ? cat.customImageUrl
                    : repProd
                    ? getUniqueProductFabricImage(repProd)
                    : '';

                return (
                  <div
                    key={cat.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`p-3 sm:p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      dragOverIndex === idx
                        ? 'border-[#850B1B] bg-[#FAF6F0] shadow-md'
                        : cat.isEnabled
                        ? 'border-[#E5D5BE] bg-[#FAF6F0]/60 hover:bg-[#FAF6F0]'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    {/* Left: Drag Handle + Order + Rectangular Thumbnail + Text Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="cursor-grab active:cursor-grabbing text-[#850B1B]/60 hover:text-[#850B1B] p-1"
                        title="টেনে ক্রম পরিবর্তন করুন (Drag to reorder)"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      <span className="w-6 h-6 rounded-full bg-[#850B1B] text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {toBengaliDigits(idx + 1)}
                      </span>

                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#D5A64A] bg-[#F3ECE1] shrink-0 relative">
                        {previewImg && (
                          <img
                            src={previewImg}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {cat.customImageUrl && (
                          <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-[#850B1B] text-white text-[8px] rounded">
                            Custom
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#D5A64A]/20 text-[#850B1B]">
                            {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                          </span>
                          <h4 className="text-sm font-bold text-[#850B1B] truncate">
                            {cat.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded bg-white border border-[#D5A64A]/60 text-[#850B1B] text-[10px] font-bold">
                            {cat.standardYards}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white border border-[#EDE5D9] text-[#242424]/70 text-[10px] font-mono">
                            {cat.buttonLink}
                          </span>
                          {!cat.isEnabled && (
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                              নিষ্ক্রিয় (Disabled)
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#4A2C2A] line-clamp-1">
                          {cat.description}
                        </p>

                        <p className="text-[11px] text-[#242424]/60 line-clamp-1">
                          ফেব্রিক: <strong className="text-[#850B1B]">{cat.sampleFabrics}</strong> · বাটন: <strong className="text-[#850B1B]">{cat.buttonLabel}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Right: Reorder Up/Down, Enable/Disable, Edit, Delete */}
                    <div className="flex items-center justify-end gap-1.5 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-[#E5D5BE]">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => reorderCategories(idx, idx - 1)}
                        className="p-1.5 rounded-lg border border-[#E5D5BE] bg-white hover:bg-[#FAF6F0] disabled:opacity-35 text-[#242424] cursor-pointer"
                        title="উপরে নিন"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={idx === currentDraft.categories.length - 1}
                        onClick={() => reorderCategories(idx, idx + 1)}
                        className="p-1.5 rounded-lg border border-[#E5D5BE] bg-white hover:bg-[#FAF6F0] disabled:opacity-35 text-[#242424] cursor-pointer"
                        title="নিচে নিন"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleCategoryEnabled(cat.id)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                          cat.isEnabled
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-gray-300 bg-gray-100 text-gray-600'
                        }`}
                        title={cat.isEnabled ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                      >
                        {cat.isEnabled ? (
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
                        onClick={() => handleOpenEditBaharCategory(cat)}
                        className="px-3 py-1.5 rounded-lg bg-[#850B1B] hover:bg-[#6B0812] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>সম্পাদনা</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBaharCategory(cat.id)}
                        className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instant Live Section Preview at Bottom of Content Tab */}
          <div className="bg-white rounded-xl border border-[#EDE5D9] p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#850B1B]">
                লাইভ ড্রাফট প্রিভিউ ({toBengaliDigits(currentWidth)} বহর ইনার ক্যাটাগরি সেকশন)
              </h3>
              <span className="text-xs text-[#242424]/60">
                নিচের কার্ডগুলোতে আপনার সর্বশেষ ড্রাফট পরিবর্তনগুলো তাৎক্ষণিকভাবে দেখা যাচ্ছে
              </span>
            </div>

            <BaharEditorialCategorySection
              width={currentWidth}
              section={currentDraft.section}
              categories={currentDraft.categories}
              designSettings={currentDraft.designSettings}
              products={products}
              onSelectCategory={() => {}}
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* BAHAR COLLECTION MANAGEMENT: DESIGN CUSTOMIZATION TAB                */}
      {/* ==================================================================== */}
      {activeCollectionTab !== 'general' && subTab === 'design' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#EDE5D9] p-5 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDE5D9] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#850B1B]">
                  {toBengaliDigits(currentWidth)} বহর ডিজাইন ও লেআউট সেটিংস (`fabric_category_design_settings`)
                </h3>
                <p className="text-[11px] text-[#242424]/60">
                  ব্যাকগ্রাউন্ড (#FAF6F0), ডিপ মেরুন (#850B1B), গোল্ড বর্ডার (#D5A64A), ছবির পজিশন, অনুপাত এবং গ্রিড কলাম নিয়ন্ত্রণ করুন।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyDesignToOtherBahar}
                  className="px-3 py-1.5 rounded-lg border border-[#D5A64A] bg-[#FAF6F0] hover:bg-[#F3ECE0] text-[#850B1B] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>
                    এই ডিজাইনটি {currentCollectionType === '3.5_bahar' ? '২.৫ বহরে' : '৩.৫ বহরে'} কপি করুন
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRevertToPrevious(true)}
                  className="px-3 py-1.5 rounded-lg border border-[#EDE5D9] bg-white hover:bg-[#FAF8F4] text-[#242424] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ডিফল্ট এডিটোরিয়াল থিমে রিসেট</span>
                </button>
              </div>
            </div>

            {/* Color Customization Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#850B1B]">
                ১. কালার প্যালেট (Colors)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] flex items-center justify-between gap-3">
                  <div>
                    <label className="font-bold text-[#242424] block">সেকশন ব্যাকগ্রাউন্ড (Cream)</label>
                    <span className="text-[11px] text-[#242424]/60 font-mono">
                      {currentDraft.designSettings.backgroundColor}
                    </span>
                  </div>
                  <input
                    type="color"
                    value={currentDraft.designSettings.backgroundColor}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          backgroundColor: e.target.value
                        }
                      }))
                    }
                    className="w-10 h-9 rounded cursor-pointer border border-[#D5A64A]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] flex items-center justify-between gap-3">
                  <div>
                    <label className="font-bold text-[#242424] block">কার্ড ব্যাকগ্রাউন্ড (Warm Ivory)</label>
                    <span className="text-[11px] text-[#242424]/60 font-mono">
                      {currentDraft.designSettings.cardBackgroundColor}
                    </span>
                  </div>
                  <input
                    type="color"
                    value={currentDraft.designSettings.cardBackgroundColor}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          cardBackgroundColor: e.target.value
                        }
                      }))
                    }
                    className="w-10 h-9 rounded cursor-pointer border border-[#D5A64A]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] flex items-center justify-between gap-3">
                  <div>
                    <label className="font-bold text-[#242424] block">শিরোনাম ও টেক্সট কালার (Deep Maroon)</label>
                    <span className="text-[11px] text-[#242424]/60 font-mono">
                      {currentDraft.designSettings.textColor}
                    </span>
                  </div>
                  <input
                    type="color"
                    value={currentDraft.designSettings.textColor}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          textColor: e.target.value
                        }
                      }))
                    }
                    className="w-10 h-9 rounded cursor-pointer border border-[#D5A64A]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] flex items-center justify-between gap-3">
                  <div>
                    <label className="font-bold text-[#242424] block">বর্ডার ও গোল্ড অ্যাকসেন্ট (Subtle Gold)</label>
                    <span className="text-[11px] text-[#242424]/60 font-mono">
                      {currentDraft.designSettings.borderColor}
                    </span>
                  </div>
                  <input
                    type="color"
                    value={currentDraft.designSettings.borderColor}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          borderColor: e.target.value,
                          accentGoldColor: e.target.value
                        }
                      }))
                    }
                    className="w-10 h-9 rounded cursor-pointer border border-[#D5A64A]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] flex items-center justify-between gap-3">
                  <div>
                    <label className="font-bold text-[#242424] block">বাটন ব্যাকগ্রাউন্ড (Deep Maroon)</label>
                    <span className="text-[11px] text-[#242424]/60 font-mono">
                      {currentDraft.designSettings.buttonColor}
                    </span>
                  </div>
                  <input
                    type="color"
                    value={currentDraft.designSettings.buttonColor}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          buttonColor: e.target.value
                        }
                      }))
                    }
                    className="w-10 h-9 rounded cursor-pointer border border-[#D5A64A]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] flex items-center justify-between gap-3">
                  <div>
                    <label className="font-bold text-[#242424] block">বডি টেক্সট কালার</label>
                    <span className="text-[11px] text-[#242424]/60 font-mono">
                      {currentDraft.designSettings.bodyTextColor}
                    </span>
                  </div>
                  <input
                    type="color"
                    value={currentDraft.designSettings.bodyTextColor}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          bodyTextColor: e.target.value
                        }
                      }))
                    }
                    className="w-10 h-9 rounded cursor-pointer border border-[#D5A64A]"
                  />
                </div>
              </div>
            </div>

            {/* Layout, Image Position, Aspect Ratio & Dimensions */}
            <div className="space-y-3 pt-2 border-t border-[#EDE5D9]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#850B1B]">
                ২. কার্ড স্ট্রাকচার, ছবির অবস্থান ও গ্রিড কলাম
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    ছবির অবস্থান (Image Position)
                  </label>
                  <select
                    value={currentDraft.designSettings.imagePosition}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          imagePosition: e.target.value as 'right' | 'left'
                        }
                      }))
                    }
                    className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs font-semibold text-[#850B1B]"
                  >
                    <option value="right">বামে টেক্সট · ডানে আয়তাকার ছবি (Recommended)</option>
                    <option value="left">বামে আয়তাকার ছবি · ডানে টেক্সট</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    ছবির অনুপাত (Image Aspect Ratio)
                  </label>
                  <select
                    value={currentDraft.designSettings.imageAspectRatio}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          imageAspectRatio: e.target.value as any
                        }
                      }))
                    }
                    className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs font-semibold text-[#850B1B]"
                  >
                    <option value="4/5">৪:৫ পোর্ট্রেট এডিটোরিয়াল (4:5)</option>
                    <option value="3/4">৩:৪ ক্লাসিক ফ্যাশন (3:4)</option>
                    <option value="1/1">১:১ স্কয়ার (1:1)</option>
                    <option value="16/10">১৬:১০ ওয়াইড (16:10)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    ডেস্কটপ লেআউট (Desktop Columns)
                  </label>
                  <select
                    value={currentDraft.designSettings.desktopColumns}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          desktopColumns: Number(e.target.value) as 2 | 3
                        }
                      }))
                    }
                    className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs font-semibold text-[#850B1B]"
                  >
                    <option value={3}>৩ কলাম × ২ সারি (3 Columns - Standard)</option>
                    <option value={2}>২ কলাম × ৩ সারি (2 Columns)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    মোবাইল লেআউট (Mobile Columns)
                  </label>
                  <select
                    value={currentDraft.designSettings.mobileColumns}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          mobileColumns: Number(e.target.value) as 1 | 2
                        }
                      }))
                    }
                    className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs font-semibold text-[#850B1B]"
                  >
                    <option value={2}>২ কলাম কমপ্যাক্ট কার্ড (2 Columns - Standard)</option>
                    <option value={1}>১ কলাম ফুল-উইডথ (1 Column)</option>
                  </select>
                </div>
              </div>

              {/* Dimension Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 text-xs">
                <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span>ছবির প্রস্থ (Image Width)</span>
                    <span className="text-[#850B1B] font-bold">
                      {currentDraft.designSettings.imageWidthPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={36}
                    max={50}
                    value={currentDraft.designSettings.imageWidthPercent}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          imageWidthPercent: Number(e.target.value)
                        }
                      }))
                    }
                    className="w-full accent-[#850B1B]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span>কার্ডের উচ্চতা (Min Height)</span>
                    <span className="text-[#850B1B] font-bold">
                      {currentDraft.designSettings.cardMinHeightPx}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={180}
                    max={280}
                    step={4}
                    value={currentDraft.designSettings.cardMinHeightPx}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          cardMinHeightPx: Number(e.target.value)
                        }
                      }))
                    }
                    className="w-full accent-[#850B1B]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span>কার্ডের গ্যাপ (Card Spacing)</span>
                    <span className="text-[#850B1B] font-bold">
                      {currentDraft.designSettings.cardGapPx}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={32}
                    step={2}
                    value={currentDraft.designSettings.cardGapPx}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          cardGapPx: Number(e.target.value)
                        }
                      }))
                    }
                    className="w-full accent-[#850B1B]"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#FAF8F4] border border-[#EDE5D9] space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span>কর্নার রেডিয়াস (Rounded)</span>
                    <span className="text-[#850B1B] font-bold">
                      {currentDraft.designSettings.cardBorderRadiusPx}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={28}
                    step={2}
                    value={currentDraft.designSettings.cardBorderRadiusPx}
                    onChange={(e) =>
                      updateCurrentDraft((prev) => ({
                        ...prev,
                        designSettings: {
                          ...prev.designSettings,
                          cardBorderRadiusPx: Number(e.target.value)
                        }
                      }))
                    }
                    className="w-full accent-[#850B1B]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Design Preview */}
          <div className="bg-white rounded-xl border border-[#EDE5D9] p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#850B1B]">
              লাইভ ডিজাইন প্রিভিউ ({toBengaliDigits(currentWidth)} বহর)
            </h3>
            <BaharEditorialCategorySection
              width={currentWidth}
              section={currentDraft.section}
              categories={currentDraft.categories}
              designSettings={currentDraft.designSettings}
              products={products}
              onSelectCategory={() => {}}
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* BAHAR COLLECTION MANAGEMENT: DUAL LIVE PREVIEW TAB                   */}
      {/* ==================================================================== */}
      {activeCollectionTab !== 'general' && subTab === 'preview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#EDE5D9] p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewViewport('desktop')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                  previewViewport === 'desktop'
                    ? 'bg-[#850B1B] text-white'
                    : 'bg-[#FAF6F0] text-[#4A2C2A] border border-[#E5D5BE]'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>ডেস্কটপ ভিউ (৩ কলাম × ২ সারি)</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewViewport('mobile')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                  previewViewport === 'mobile'
                    ? 'bg-[#850B1B] text-white'
                    : 'bg-[#FAF6F0] text-[#4A2C2A] border border-[#E5D5BE]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>মোবাইল ভিউ (২ কলাম কমপ্যাক্ট)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewCompareBoth((v) => !v)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border ${
                  previewCompareBoth
                    ? 'bg-[#FAF6F0] border-[#850B1B] text-[#850B1B]'
                    : 'bg-white border-[#EDE5D9] text-[#242424]'
                }`}
              >
                <Columns className="w-4 h-4" />
                <span>
                  {previewCompareBoth
                    ? 'শুধু বর্তমান বহর দেখুন'
                    : '৩.৫ ও ২.৫ উভয় বহর একসাথে প্রিভিউ করুন'}
                </span>
              </button>
            </div>
          </div>

          <div
            className={
              previewViewport === 'mobile'
                ? 'max-w-[430px] mx-auto space-y-8 border-2 border-dashed border-[#D5A64A] p-3 rounded-3xl bg-[#FAF7F2]'
                : 'space-y-8'
            }
          >
            {previewCompareBoth ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-[#850B1B] uppercase tracking-wider">
                      ১. ৩.৫ বহর কালেকশন প্রিভিউ (3.5 Bahar)
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await categoryService.publishCollection('3.5_bahar', {
                          section: draft35.section,
                          categories: draft35.categories,
                          designSettings: draft35.designSettings
                        });
                        setDraft35(categoryService.getDraftCollection('3.5_bahar'));
                        showToast('৩.৫ বহর সফলভাবে পাবলিশ হয়েছে!', 'success');
                      }}
                      className="px-3 py-1 rounded bg-[#850B1B] text-white text-[11px] font-bold cursor-pointer"
                    >
                      ৩.৫ বহর পাবলিশ করুন
                    </button>
                  </div>
                  <BaharEditorialCategorySection
                    width="3.5"
                    section={draft35.section}
                    categories={draft35.categories}
                    designSettings={draft35.designSettings}
                    products={products}
                    onSelectCategory={() => {}}
                    forceViewport={previewViewport}
                  />
                </div>

                <div className="space-y-2 pt-4 border-t border-[#E5D5BE]">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-[#850B1B] uppercase tracking-wider">
                      ২. ২.৫ বহর কালেকশন প্রিভিউ (2.5 Bahar)
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await categoryService.publishCollection('2.5_bahar', {
                          section: draft25.section,
                          categories: draft25.categories,
                          designSettings: draft25.designSettings
                        });
                        setDraft25(categoryService.getDraftCollection('2.5_bahar'));
                        showToast('২.৫ বহর সফলভাবে পাবলিশ হয়েছে!', 'success');
                      }}
                      className="px-3 py-1 rounded bg-[#850B1B] text-white text-[11px] font-bold cursor-pointer"
                    >
                      ২.৫ বহর পাবলিশ করুন
                    </button>
                  </div>
                  <BaharEditorialCategorySection
                    width="2.5"
                    section={draft25.section}
                    categories={draft25.categories}
                    designSettings={draft25.designSettings}
                    products={products}
                    onSelectCategory={() => {}}
                    forceViewport={previewViewport}
                  />
                </div>
              </>
            ) : (
              <BaharEditorialCategorySection
                width={currentWidth}
                section={currentDraft.section}
                categories={currentDraft.categories}
                designSettings={currentDraft.designSettings}
                products={products}
                onSelectCategory={() => {}}
                forceViewport={previewViewport}
              />
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / EDIT BAHAR CATEGORY ITEM                                */}
      {/* ==================================================================== */}
      {isCatModalOpen && editingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-[#D5A64A] p-6 space-y-4 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#EDE5D9] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#850B1B]">
                  {toBengaliDigits(currentWidth)} বহর ক্যাটাগরি কার্ড সম্পাদনা
                </h3>
                <p className="text-[11px] text-[#242424]/60">
                  ক্যাটাগরির নাম, বিবরণ, বাটন টেক্সট, লিংক, আইকন এবং কাপড়ের ছবি কাস্টমাইজ করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCatModalOpen(false);
                  setEditingCat(null);
                }}
                className="p-1.5 rounded-lg hover:bg-[#FAF6F0] cursor-pointer"
              >
                <X className="w-4 h-4 text-[#242424]" />
              </button>
            </div>

            <form onSubmit={handleSaveBaharCategoryModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    ক্যাটাগরির প্রদর্শিত নাম (Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCat.name}
                    onChange={(e) =>
                      setEditingCat({ ...editingCat, name: e.target.value })
                    }
                    placeholder="যেমন: কামিজ / শার্ট কামিজ / নেহ কটি"
                    className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs font-bold text-[#850B1B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    পণ্য ফিল্টার ক্যাটাগরি (Product Match Category)
                  </label>
                  <select
                    value={editingCat.matchCategoryName}
                    onChange={(e) =>
                      setEditingCat({ ...editingCat, matchCategoryName: e.target.value })
                    }
                    className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="কামিজ">কামিজ</option>
                    <option value="শর্ট কামিজ">শর্ট কামিজ / শার্ট কামিজ</option>
                    <option value="লং কটি">লং কটি / নেহ কটি</option>
                    <option value="গাউন / লেহেঙ্গা">গাউন / লেহেঙ্গা</option>
                    <option value="গাউন">গাউন</option>
                    <option value="শাড়ি">শাড়ি</option>
                    <option value="কাস্টম ডিজাইন">কাস্টম ডিজাইন</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    প্রয়োজনীয় গজ ব্যাজ (Standard Yards)
                  </label>
                  <input
                    type="text"
                    value={editingCat.standardYards}
                    onChange={(e) =>
                      setEditingCat({ ...editingCat, standardYards: e.target.value })
                    }
                    placeholder="যেমন: ২.০ গজ"
                    className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    ক্যাটাগরি আইকন (Icon)
                  </label>
                  <select
                    value={editingCat.icon}
                    onChange={(e) =>
                      setEditingCat({
                        ...editingCat,
                        icon: e.target.value as CategoryIconName
                      })
                    }
                    className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs"
                  >
                    {ICON_OPTIONS.map((ic) => (
                      <option key={ic.value} value={ic.value}>
                        {ic.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#242424] mb-1">
                  সংক্ষিপ্ত বিবরণ (Description) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingCat.description}
                  onChange={(e) =>
                    setEditingCat({ ...editingCat, description: e.target.value })
                  }
                  placeholder="ক্যাটাগরির সংক্ষিপ্ত বিবরণ লিখুন..."
                  className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#242424] mb-1">
                  উপযুক্ত ফেব্রিকের উদাহরণ (Sample Fabrics)
                </label>
                <input
                  type="text"
                  value={editingCat.sampleFabrics}
                  onChange={(e) =>
                    setEditingCat({ ...editingCat, sampleFabrics: e.target.value })
                  }
                  placeholder="যেমন: সফট কম্বড কটন, সুইস লন ও জামদানি বুটি থান"
                  className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    বাটনের লেখা (Button Label)
                  </label>
                  <input
                    type="text"
                    value={editingCat.buttonLabel}
                    onChange={(e) =>
                      setEditingCat({ ...editingCat, buttonLabel: e.target.value })
                    }
                    placeholder="কালেকশন দেখুন"
                    className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs font-semibold text-[#850B1B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">
                    বাটনের গন্তব্য লিংক (Button Destination Link)
                  </label>
                  <select
                    value={editingCat.buttonLink}
                    onChange={(e) => {
                      const val = e.target.value;
                      const derivedSlug = val.startsWith('category-gallery:')
                        ? val.replace('category-gallery:', '')
                        : editingCat.slug;
                      setEditingCat({
                        ...editingCat,
                        buttonLink: val,
                        slug: derivedSlug
                      });
                    }}
                    className="w-full bg-[#FAF6F0] border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs"
                  >
                    {LINK_PRESETS.map((lp) => (
                      <option key={lp.value} value={lp.value}>
                        {lp.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Image Management: Upload, Replace, Delete or Pick Bahar Studio Fabric */}
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#D5A64A]/60 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="font-bold text-[#850B1B] block">
                      ক্যাটাগরির কাপড়ের ছবি (Upload / Replace / Delete Image)
                    </label>
                    <span className="text-[11px] text-[#4A2C2A]">
                      নতুন ছবি আপলোড করুন অথবা {toBengaliDigits(currentWidth)} বহরের নিজস্ব স্টুডিও ফেব্রিক বেছে নিন
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-[#850B1B] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>ছবি আপলোড / পরিবর্তন</span>
                    </button>

                    {editingCat.customImageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingCat({ ...editingCat, customImageUrl: '' })
                        }
                        className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>কাস্টম ছবি মুছুন</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block font-semibold text-[#242424] mb-1">
                      ডিফল্ট {toBengaliDigits(currentWidth)} বহর স্টুডিও ফেব্রিক (Representative Product)
                    </label>
                    <select
                      value={editingCat.representativeProductId}
                      onChange={(e) =>
                        setEditingCat({
                          ...editingCat,
                          representativeProductId: e.target.value
                        })
                      }
                      className="w-full bg-white border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs"
                    >
                      {matchingWidthProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#242424] mb-1">
                      অথবা সরাসরি ছবির URL দিন
                    </label>
                    <input
                      type="text"
                      value={editingCat.customImageUrl || ''}
                      onChange={(e) =>
                        setEditingCat({ ...editingCat, customImageUrl: e.target.value })
                      }
                      placeholder="/assets/... অথবা https://..."
                      className="w-full bg-white border border-[#E2D4C0] rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EDE5D9]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCatModalOpen(false);
                    setEditingCat(null);
                  }}
                  className="px-4 py-2 border border-[#EDE5D9] rounded-lg font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#850B1B] hover:bg-[#6B0812] text-white rounded-lg font-bold cursor-pointer"
                >
                  ক্যাটাগরি আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* GENERAL CATEGORIES TAB (Preserved Store-wide Categories)             */}
      {/* ==================================================================== */}
      {activeCollectionTab === 'general' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#242424]">
                সাধারণ ফিল্টার ক্যাটাগরি তালিকা (Store-wide Categories)
              </h3>
              <p className="text-xs text-[#242424]/60">
                ক্যাটাগরির নাম, ছবি, ক্রম (Display Order) এবং দৃশ্যমানতা (Enable/Disable) পরিচালনা করুন।
              </p>
            </div>
            <button
              onClick={handleOpenLegacyAdd}
              className="px-4 py-2 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ক্যাটাগরি যোগ করুন</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#EDE5D9] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F4] text-[#242424] font-bold border-b border-[#EDE5D9]">
                  <th className="p-3">ক্রম</th>
                  <th className="p-3">ক্যাটাগরি ও ছবি</th>
                  <th className="p-3">স্ল্যাগ</th>
                  <th className="p-3 text-center">বহর প্রাপ্যতা</th>
                  <th className="p-3">বিবরণ</th>
                  <th className="p-3 text-center">স্ট্যাটাস</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE5D9] text-[#242424]/80">
                {categories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-[#FAF8F4]/50">
                    <td className="p-3 font-mono font-semibold text-[#242424]">
                      <div className="flex items-center gap-1">
                        <span>{idx + 1}</span>
                        <div className="flex flex-col ml-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const list = [...categories];
                              const [moved] = list.splice(idx, 1);
                              list.splice(idx - 1, 0, moved);
                              const updated = categoryService.reorderCategories(list);
                              setCategories(updated);
                              showToast('ক্যাটাগরির ক্রম আপডেট হয়েছে', 'info');
                            }}
                            className="p-0.5 hover:bg-[#EDE5D9] rounded disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === categories.length - 1}
                            onClick={() => {
                              const list = [...categories];
                              const [moved] = list.splice(idx, 1);
                              list.splice(idx + 1, 0, moved);
                              const updated = categoryService.reorderCategories(list);
                              setCategories(updated);
                              showToast('ক্যাটাগরির ক্রম আপডেট হয়েছে', 'info');
                            }}
                            className="p-0.5 hover:bg-[#EDE5D9] rounded disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-9 h-9 rounded-md object-cover border border-[#EDE5D9]"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-[#FAF8F4] border border-[#EDE5D9] flex items-center justify-center text-[#C5A46D]">
                            <Layers className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-bold text-[#242424]">{cat.name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#242424]/60">{cat.slug}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-[#FAF8F4] border border-[#EDE5D9] text-[#C5A46D] font-bold rounded-xs">
                        {cat.fabricWidth === 'all' ? 'সকল বহর' : `${cat.fabricWidth} বহর`}
                      </span>
                    </td>
                    <td className="p-3 text-[#242424]/70">{cat.description || '—'}</td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const updatedCat: Category = { ...cat, isActive: cat.isActive === false ? true : false };
                          categoryService.saveCategory(updatedCat);
                          reloadLegacy();
                          showToast(`ক্যাটাগরি ${updatedCat.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`, 'info');
                        }}
                        className={`px-2 py-0.5 rounded-xs text-[10px] font-bold border cursor-pointer ${
                          cat.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}
                      >
                        {cat.isActive !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenLegacyEdit(cat)}
                          className="p-1.5 text-[#242424] hover:text-[#C5A46D] rounded-md transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleLegacyDelete(cat.id)}
                          className="p-1.5 text-[#242424]/40 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isLegacyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-[#EDE5D9] p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-[#EDE5D9] pb-3">
                  <h3 className="font-bold text-sm text-[#242424]">
                    {editingLegacyCategory ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি'}
                  </h3>
                  <button onClick={() => setIsLegacyModalOpen(false)}>
                    <X className="w-4 h-4 text-[#242424]" />
                  </button>
                </div>

                <form onSubmit={handleLegacySave} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">ক্যাটাগরির নাম (বাংলায়) *</label>
                    <input
                      type="text"
                      value={legacyName}
                      onChange={(e) => setLegacyName(e.target.value)}
                      placeholder="যেমন: লেহেঙ্গা / গাউন"
                      required
                      className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">স্ল্যাগ (Slug)</label>
                    <input
                      type="text"
                      value={legacySlug}
                      onChange={(e) => setLegacySlug(e.target.value)}
                      placeholder="যেমন: gown-lehenga"
                      className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">বহর নির্ধারণ</label>
                    <select
                      value={legacyFabricWidth}
                      onChange={(e) => setLegacyFabricWidth(e.target.value as any)}
                      className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="all">উভয় বহর (সকল)</option>
                      <option value="3.5">কেবল ৩.৫ বহর</option>
                      <option value="2.5">কেবল ২.৫ বহর</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">সংক্ষিপ্ত বিবরণ</label>
                    <input
                      type="text"
                      value={legacyDescription}
                      onChange={(e) => setLegacyDescription(e.target.value)}
                      placeholder="যেমন: ফুল ঘেরের পোশাক"
                      className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-[#EDE5D9]">
                    <button
                      type="button"
                      onClick={() => setIsLegacyModalOpen(false)}
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
        </div>
      )}
    </div>
  );
};
