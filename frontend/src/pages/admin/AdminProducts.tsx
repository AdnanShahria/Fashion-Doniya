import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { productService } from '../../services/productService';
import { uploadAdminImage } from '../../services/uploadService';
import {
  CUSTOM_MEASUREMENT_FIELDS,
  getDefaultProductCustomConfig,
  getProductCustomMeasurementConfig,
} from '../../services/measurementService';
import { Product, FabricWidth, CustomMeasurementFieldKey } from '../../types';
import { FabricPatternVisual } from '../../components/common/FabricPatternVisual';
import { DynamicFabricGarmentImage } from '../../components/product/DynamicFabricGarmentImage';
import { PRODUCT_OUTFIT_OPTIONS } from '../ProductDetailsPage';
import { getUniqueProductFabricImage } from '../../components/home/allProductsImageGenerator';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Upload,
  Image as ImageIcon,
  Scissors,
  Shirt
} from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const { products, refreshData, showToast } = useStore();

  const [search, setSearch] = useState('');
  const [widthFilter, setWidthFilter] = useState<FabricWidth | 'all'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Form fields for create/edit
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    nameEn: '',
    description: '',
    sku: '',
    fabricWidth: '3.5',
    category: 'কামিজ',
    fabricType: 'পিওর কটন',
    design: 'ফ্লোরাল ও জরি বুনন',
    color: 'আইভরি',
    colorHex: '#C5A46D',
    availableColors: ['আইভরি', 'ব্ল্যাক', 'মেরুন'],
    pricePerYard: 250,
    discountPrice: 220,
    stockYards: 100,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    patternType: 'cotton',
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    images: []
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setImageUrlInput('');
    setFormData({
      id: `prod-${Date.now()}`,
      name: '',
      description: '',
      sku: `FD-${Math.floor(1000 + Math.random() * 9000)}`,
      fabricWidth: '3.5',
      category: 'কামিজ',
      fabricType: 'পিওর কটন',
      design: 'প্রিমিয়াম এমব্রয়ডারি ও জরি বুনন',
      color: 'ক্লাসিক ক্রিম',
      colorHex: '#C5A46D',
      availableColors: ['ক্লাসিক ক্রিম', 'মেরুন', 'নেভি ব্লু'],
      pricePerYard: 280,
      discountPrice: 250,
      stockYards: 120,
      minOrderQuantity: 1.5,
      stepYard: 0.5,
      patternType: 'cotton',
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      isActive: true,
      images: [],
      customMeasurementConfig: getDefaultProductCustomConfig('কামিজ', '3.5', 250)
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setImageUrlInput('');
    setFormData({
      ...prod,
      images: prod.images ? [...prod.images] : [],
      customMeasurementConfig: getProductCustomMeasurementConfig(prod)
    });
    setIsModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const url = await uploadAdminImage(file);
        uploadedUrls.push(url);
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'ছবি আপলোড করতে সমস্যা হয়েছে',
          'error'
        );
      }
    }
    if (uploadedUrls.length > 0) {
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls]
      }));
      showToast(`${uploadedUrls.length}টি ছবি সফলভাবে যোগ হয়েছে`, 'success');
    }
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), trimmed]
    }));
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে "${name}" পণ্যটি মুছে ফেলতে চান?`)) {
      productService.deleteProduct(id);
      refreshData();
      showToast('পণ্যটি সফলভাবে মুছে ফেলা হয়েছে', 'info');
    }
  };

  const handleToggleActive = (prod: Product) => {
    const updated = { ...prod, isActive: !prod.isActive };
    productService.saveProduct(updated);
    refreshData();
    showToast(`পণ্যটি ${updated.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`, 'info');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.pricePerYard) {
      showToast('পণ্যের নাম ও দাম আবশ্যক', 'error');
      return;
    }

    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: formData.name.trim(),
      nameEn: formData.nameEn?.trim(),
      description: formData.description?.trim() || '',
      sku: formData.sku?.trim() || `FD-${Math.floor(1000 + Math.random() * 9000)}`,
      fabricWidth: (formData.fabricWidth as FabricWidth) || '3.5',
      category: formData.category || 'কামিজ',
      fabricType: formData.fabricType || 'পিওর কটন',
      design: formData.design?.trim() || undefined,
      color: formData.color || 'ন্যাচারাল',
      colorHex: formData.colorHex || '#C5A46D',
      availableColors: formData.availableColors && formData.availableColors.length > 0 ? formData.availableColors : [formData.color || 'ন্যাচারাল'],
      pricePerYard: Number(formData.pricePerYard),
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
      stockYards: Number(formData.stockYards || 100),
      minOrderQuantity: Number(formData.minOrderQuantity || 1.5),
      stepYard: Number(formData.stepYard || 0.5),
      patternType: (formData.patternType as any) || 'cotton',
      isFeatured: !!formData.isFeatured,
      isBestSeller: !!formData.isBestSeller,
      isNewArrival: !!formData.isNewArrival,
      isActive: formData.isActive !== false,
      images: formData.images || [],
      seoTitle: formData.seoTitle?.trim() || undefined,
      seoDescription: formData.seoDescription?.trim() || undefined,
      seoKeywords: formData.seoKeywords?.trim() || undefined,
      imageAlt: formData.imageAlt?.trim() || undefined,
      customMeasurementConfig:
        formData.customMeasurementConfig ||
        getDefaultProductCustomConfig(
          formData.category || 'কামিজ',
          (formData.fabricWidth as FabricWidth) || '3.5',
          Number(formData.discountPrice || formData.pricePerYard)
        )
    };

    productService.saveProduct(productToSave);
    refreshData();
    setIsModalOpen(false);
    showToast(editingProduct ? 'পণ্য সফলভাবে আপডেট হয়েছে!' : 'নতুন পণ্য যুক্ত হয়েছে!', 'success');
  };

  const filteredProducts = products.filter(p => {
    if (widthFilter !== 'all' && p.fabricWidth !== widthFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#242424]">পণ্য ব্যবস্থাপনা (Product Management)</h2>
          <p className="text-xs text-[#242424]/60">স্টোরে ৩.৫ ও ২.৫ বহরের নতুন কাপড় যুক্ত করুন, একাধিক ছবি, দাম ও স্টক পরিবর্তন করুন।</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন কাপড় যোগ করুন</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-[#EDE5D9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#242424]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম, ক্যাটাগরি বা SKU দিয়ে খুঁজুন..."
            className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg pl-9 pr-3 py-2 text-xs text-[#242424] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[#242424]/60">বহর:</span>
          {['all', '3.5', '2.5'].map((w) => (
            <button
              key={w}
              onClick={() => setWidthFilter(w as any)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                widthFilter === w 
                  ? 'bg-[#242424] text-white font-bold' 
                  : 'bg-[#FAF8F4] text-[#242424] border border-[#EDE5D9]'
              }`}
            >
              {w === 'all' ? 'সকল' : `${w} বহর`}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#EDE5D9] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F4] text-[#242424] font-bold border-b border-[#EDE5D9]">
                <th className="p-3">কাপড়</th>
                <th className="p-3">ক্যাটাগরি</th>
                <th className="p-3 text-center">বহর</th>
                <th className="p-3 text-right">দাম/গজ (৳)</th>
                <th className="p-3 text-center">স্টক (গজ)</th>
                <th className="p-3 text-center">স্ট্যাটাস</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE5D9] text-[#242424]/80">
              {filteredProducts.map((product) => {
                const effectivePrice = product.discountPrice || product.pricePerYard;
                const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;
                return (
                  <tr key={product.id} className="hover:bg-[#FAF8F4]/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md overflow-hidden border border-[#EDE5D9] shrink-0 bg-[#FAF8F4]">
                          {firstImage ? (
                            <img src={firstImage} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <FabricPatternVisual
                              patternType={product.patternType}
                              colorHex={product.colorHex}
                              fabricWidth={product.fabricWidth}
                              aspectRatio="square"
                            />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-[#242424] block">{product.name}</span>
                          <span className="text-[11px] text-[#242424]/50 font-mono">{product.sku} · {product.fabricType}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-medium text-[#242424]">{product.category}</td>

                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-[#FAF8F4] border border-[#EDE5D9] text-[#C5A46D] font-bold rounded-xs">
                        {product.fabricWidth} বহর
                      </span>
                    </td>

                    <td className="p-3 text-right tabular-nums">
                      <span className="font-bold text-[#242424]">৳{effectivePrice}</span>
                      {product.discountPrice && (
                        <span className="text-[10px] text-[#242424]/40 line-through block">
                          ৳{product.pricePerYard}
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center tabular-nums">
                      <span className={`font-semibold ${product.stockYards <= 100 ? 'text-rose-600' : 'text-[#242424]'}`}>
                        {product.stockYards} গজ
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`px-2 py-0.5 rounded-xs font-semibold text-[10px] cursor-pointer border ${
                          product.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}
                      >
                        {product.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </button>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="p-1.5 text-[#242424] hover:text-[#C5A46D] hover:bg-[#FAF8F4] rounded-md transition-colors cursor-pointer"
                          title="সম্পাদনা করুন"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-1.5 text-[#242424]/40 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#EDE5D9] p-6 space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-3">
              <h3 className="text-base font-bold text-[#242424]">
                {editingProduct ? 'কাপড় সম্পাদনা করুন' : 'নতুন কাপড় যুক্ত করুন'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-[#FAF8F4] rounded-md">
                <X className="w-4 h-4 text-[#242424]" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#242424] mb-1">কাপড়ের নাম (বাংলায়) *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="যেমন: রয়েল জামদানি ফেব্রিক"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">SKU কোড</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="FD-JAM-3501"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 font-mono text-[#242424] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">কাপড়ের বহর *</label>
                  <select
                    value={formData.fabricWidth}
                    onChange={(e) => setFormData({ ...formData, fabricWidth: e.target.value as any })}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  >
                    <option value="3.5">৩.৫ হাত বহর (৫৬-৬০ ইঞ্চি)</option>
                    <option value="2.5">২.৫ হাত বহর (৪২-৪৪ ইঞ্চি)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">ক্যাটাগরি *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  >
                    <option value="কামিজ">১. কামিজ</option>
                    <option value="শার্ট কামিজ">২. শার্ট কামিজ</option>
                    <option value="লং কটি">৩. লং কটি</option>
                    <option value="গাউন / লেহেঙ্গা">৪. গাউন / লেহেঙ্গা</option>
                    <option value="শাড়ি">৫. শাড়ি</option>
                    <option value="কাস্টম ডিজাইন">৬. কাস্টম ডিজাইন</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">কাপড়ের ধরন (Fabric Type)</label>
                  <input
                    type="text"
                    value={formData.fabricType || ''}
                    onChange={(e) => setFormData({ ...formData, fabricType: e.target.value })}
                    placeholder="যেমন: মুলতানি সিল্ক / ঢাকাই জামদানি / পিওর কটন"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">ডিজাইন ও বুনন (Design)</label>
                  <input
                    type="text"
                    value={formData.design || ''}
                    onChange={(e) => setFormData({ ...formData, design: e.target.value })}
                    placeholder="যেমন: ফ্লোরাল এমব্রয়ডারি ও জরি পাড়"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">মূল্য প্রতি গজ (৳) *</label>
                  <input
                    type="number"
                    value={formData.pricePerYard}
                    onChange={(e) => setFormData({ ...formData, pricePerYard: Number(e.target.value) })}
                    required
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">ছাড়ের মূল্য (ঐচ্ছিক ৳)</label>
                  <input
                    type="number"
                    value={formData.discountPrice || ''}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="যেমন: ৩৪০"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">মজুদ স্টক (গজ)</label>
                  <input
                    type="number"
                    value={formData.stockYards}
                    onChange={(e) => setFormData({ ...formData, stockYards: Number(e.target.value) })}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">সর্বনিম্ন অর্ডারের গজ</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.minOrderQuantity}
                    onChange={(e) => setFormData({ ...formData, minOrderQuantity: Number(e.target.value) })}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">প্রধান রং</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="যেমন: রয়্যাল গোল্ডেন"
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">কালার কোড (Hex)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.colorHex || '#C5A46D'}
                      onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                      className="w-8 h-8 rounded-md border border-[#EDE5D9] p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.colorHex || '#C5A46D'}
                      onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                      className="flex-1 bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-1.5 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#242424] mb-1">ফ্যাব্রিক টেক্সচার প্যাটার্ন</label>
                  <select
                    value={formData.patternType}
                    onChange={(e) => setFormData({ ...formData, patternType: e.target.value as any })}
                    className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424] focus:outline-hidden"
                  >
                    <option value="jamdani">জামদানি উইভ (Jamdani)</option>
                    <option value="embroidery">এমব্রয়ডারি সিকোয়েন্স (Embroidery)</option>
                    <option value="cotton">খাঁটি সুতি (Pure Cotton)</option>
                    <option value="silk">সিল্কি টেক্সচার (Silk)</option>
                    <option value="linen">অর্গানিক লিনেন (Linen)</option>
                    <option value="floral">ফ্লোরাল প্রিন্ট (Floral)</option>
                    <option value="georgette">জর্জেট (Georgette)</option>
                  </select>
                </div>
              </div>

              {/* Multiple Product Images Upload & URL Manager */}
              <div className="bg-[#FAF8F4] border border-[#EDE5D9] rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-[#242424] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#C5A46D]" />
                      <span>পণ্যের ছবি গ্যালারি (Multiple Product Images)</span>
                    </label>
                    <p className="text-[11px] text-[#242424]/60">
                      একাধিক কাপড়ের ছবি আপলোড করুন অথবা ছবির লিংক যোগ করুন।
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#242424] hover:bg-[#6B0F1A] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors self-start">
                    <Upload className="w-3.5 h-3.5" />
                    <span>ছবি আপলোড করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="ছবির URL বা পাথ দিন (যেমন: /images/categories/kamiz-fabric.png)"
                    className="flex-1 bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 text-xs text-[#242424]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 bg-white hover:bg-[#EDE5D9] border border-[#EDE5D9] rounded-lg text-xs font-semibold text-[#242424] cursor-pointer"
                  >
                    + লিংক যোগ করুন
                  </button>
                </div>

                {formData.images && formData.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-1">
                    {formData.images.map((imgUrl, idx) => (
                      <div
                        key={`${imgUrl}-${idx}`}
                        className="relative group aspect-square rounded-lg overflow-hidden border border-[#EDE5D9] bg-white"
                      >
                        <img
                          src={imgUrl}
                          alt={`Product ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-90 hover:bg-rose-600 cursor-pointer"
                          title="ছবি সরান"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Live Outfit Garment Auto-Preview from Admin's Fabric Photo */}
                {(() => {
                  const customImgs = (formData.images || []).filter(
                    (img) =>
                      img.startsWith('http://') ||
                      img.startsWith('https://') ||
                      img.startsWith('data:image/') ||
                      img.startsWith('/')
                  );
                  const previewFabricSrc =
                    customImgs[0] ||
                    getUniqueProductFabricImage({
                      id: formData.id || 'preview',
                      name: formData.name || 'প্রিমিয়াম কাপড়',
                      description: '',
                      sku: formData.sku || 'FD-001',
                      fabricWidth: (formData.fabricWidth as FabricWidth) || '3.5',
                      category: formData.category || 'কামিজ',
                      fabricType: formData.fabricType || 'পিওর কটন',
                      color: formData.color || 'ক্রিম',
                      colorHex: formData.colorHex || '#C5A46D',
                      availableColors: formData.availableColors || [],
                      pricePerYard: Number(formData.pricePerYard) || 250,
                      stockYards: 100,
                      minOrderQuantity: 1.5,
                      stepYard: 0.5,
                      images: [],
                      patternType: (formData.patternType as any) || 'cotton',
                      isFeatured: false,
                      isBestSeller: false,
                      isNewArrival: true,
                      isActive: true,
                      rating: 5,
                      reviewCount: 1
                    });

                  return (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-[#EDE5D9] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#850B1B] flex items-center gap-1.5">
                          <Shirt className="w-3.5 h-3.5" />
                          <span>এই কাপড়ের ছবিতে পোশাকের অটো-প্রিভিউ (পাবলিক পেজে যা দেখাবে):</span>
                        </span>
                      </div>
                      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
                        {PRODUCT_OUTFIT_OPTIONS.map((outfit) => (
                          <div
                            key={outfit.id}
                            className="w-[74px] shrink-0 rounded-lg overflow-hidden border border-[#DCD3C5] bg-white flex flex-col"
                          >
                            <div className="aspect-[3/4] w-full bg-[#FAF3E8] overflow-hidden">
                              <DynamicFabricGarmentImage
                                templateSrc={outfit.image}
                                fabricSrc={previewFabricSrc}
                                alt={outfit.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="py-1 px-1 text-center font-bold text-[10px] bg-[#F5EDE1] text-[#1C1B19] truncate">
                              {outfit.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block font-semibold text-[#242424] mb-1">বিস্তারিত বর্ণনা</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-lg p-2.5 text-[#242424] focus:outline-hidden"
                />
              </div>

              {/* Product-Specific Custom Measurement Settings */}
              {(() => {
                const currentCustomConfig =
                  formData.customMeasurementConfig ||
                  getDefaultProductCustomConfig(
                    formData.category || 'কামিজ',
                    (formData.fabricWidth as FabricWidth) || '3.5',
                    Number(formData.discountPrice || formData.pricePerYard || 250)
                  );

                const updateCustomConfig = (
                  patch: Partial<typeof currentCustomConfig>
                ) => {
                  setFormData((prev) => ({
                    ...prev,
                    customMeasurementConfig: {
                      ...currentCustomConfig,
                      ...patch
                    }
                  }));
                };

                const toggleApplicableField = (fieldKey: CustomMeasurementFieldKey) => {
                  const exists = currentCustomConfig.applicableFields.includes(fieldKey);
                  const nextFields = exists
                    ? currentCustomConfig.applicableFields.filter(
                        (f: CustomMeasurementFieldKey) => f !== fieldKey
                      )
                    : [...currentCustomConfig.applicableFields, fieldKey];
                  updateCustomConfig({ applicableFields: nextFields });
                };

                return (
                  <div className="bg-[#FAF8F4] border border-[#EDE5D9] rounded-xl p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE5D9] pb-2.5">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-[#850B1B]" />
                        <div>
                          <span className="font-bold text-[#242424] block">
                            কাস্টম মাপ ও গজ সেটিংস (Custom Measurement Settings)
                          </span>
                          <span className="text-[11px] text-[#242424]/60">
                            এই পণ্যের জন্য স্ট্যান্ডার্ড গজ, সর্বনিম্ন/সর্বোচ্চ গজ, প্রযোজ্য মাপের ঘর এবং অতিরিক্ত কাপড়ের মূল্য নির্ধারণ করুন।
                          </span>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-[#850B1B]">
                        <input
                          type="checkbox"
                          checked={currentCustomConfig.enabled}
                          onChange={(e) => updateCustomConfig({ enabled: e.target.checked })}
                          className="accent-[#850B1B]"
                        />
                        <span>কাস্টম মাপ সক্রিয়</span>
                      </label>
                    </div>

                    {currentCustomConfig.enabled && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block font-semibold text-[#242424] mb-1">
                              স্ট্যান্ডার্ড গজ (Standard Gaj)
                            </label>
                            <input
                              type="number"
                              step="0.25"
                              min="0.5"
                              value={currentCustomConfig.standardGaj}
                              onChange={(e) =>
                                updateCustomConfig({
                                  standardGaj: Math.max(0.5, Number(e.target.value))
                                })
                              }
                              className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 text-[#242424]"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-[#242424] mb-1">
                              সর্বনিম্ন অনুমোদিত গজ
                            </label>
                            <input
                              type="number"
                              step="0.25"
                              min="0.5"
                              value={currentCustomConfig.minAllowedGaj}
                              onChange={(e) =>
                                updateCustomConfig({
                                  minAllowedGaj: Math.max(0.5, Number(e.target.value))
                                })
                              }
                              className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 text-[#242424]"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-[#242424] mb-1">
                              সর্বোচ্চ অনুমোদিত গজ
                            </label>
                            <input
                              type="number"
                              step="0.25"
                              min="1"
                              value={currentCustomConfig.maxAllowedGaj}
                              onChange={(e) =>
                                updateCustomConfig({
                                  maxAllowedGaj: Math.max(1, Number(e.target.value))
                                })
                              }
                              className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 text-[#242424]"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-[#242424] mb-1">
                              অতিরিক্ত কাপড়ের মূল্য/গজ (৳)
                            </label>
                            <input
                              type="number"
                              min="1"
                              placeholder={`${formData.discountPrice || formData.pricePerYard || 250}`}
                              value={currentCustomConfig.additionalPricePerYard ?? ''}
                              onChange={(e) =>
                                updateCustomConfig({
                                  additionalPricePerYard: e.target.value
                                    ? Number(e.target.value)
                                    : undefined
                                })
                              }
                              className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 text-[#242424]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-[#242424] mb-1.5">
                            প্রযোজ্য মাপের ঘরসমূহ (Applicable Measurement Fields):
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {CUSTOM_MEASUREMENT_FIELDS.map((field) => {
                              const checked = currentCustomConfig.applicableFields.includes(
                                field.key
                              );
                              return (
                                <label
                                  key={field.key}
                                  className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                                    checked
                                      ? 'bg-white border-[#850B1B] text-[#850B1B] font-semibold'
                                      : 'bg-white/60 border-[#EDE5D9] text-[#242424]/70'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleApplicableField(field.key)}
                                    className="accent-[#850B1B]"
                                  />
                                  <span>{field.labelBn}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-[#242424] mb-1">
                            মাপ দেওয়ার নির্দেশনা (Measurement Instructions):
                          </label>
                          <input
                            type="text"
                            value={currentCustomConfig.measurementInstructions || ''}
                            onChange={(e) =>
                              updateCustomConfig({
                                measurementInstructions: e.target.value
                              })
                            }
                            placeholder="যেমন: স্ট্যান্ডার্ড কামিজের জন্য ২ গজ কাপড় নির্ধারিত। বড় সাইজের ক্ষেত্রে ২.২৫ বা ২.৫ গজ নির্বাচন করুন।"
                            className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424]"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-[#242424] mb-1">
                            উপলব্ধ রঙসমূহ (Available Colors - কমা দিয়ে আলাদা করুন)
                          </label>
                          <input
                            type="text"
                            value={(formData.availableColors || []).join(', ')}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                availableColors: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                              })
                            }
                            placeholder="যেমন: আইভরি গোল্ড, মেরুন, এমারেল্ড গ্রিন"
                            className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-2 text-[#242424]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Product SEO Settings */}
              <div className="bg-[#FAF8F4] border border-[#EDE5D9] rounded-xl p-4 space-y-3">
                <span className="font-bold text-[#242424] block">
                  পণ্য এসইও সেটিংস (Product SEO & Alt Text)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#242424] mb-1">SEO Title (মেটা টাইটেল)</label>
                    <input
                      type="text"
                      value={formData.seoTitle || ''}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder={formData.name || 'পণ্যের মেটা টাইটেল'}
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#242424] mb-1">Image Alt Text (ছবির অল্ট টেক্সট)</label>
                    <input
                      type="text"
                      value={formData.imageAlt || ''}
                      onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                      placeholder={formData.name || 'ছবির বিবরণ'}
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#242424] mb-1">SEO Keywords (কীওয়ার্ড)</label>
                    <input
                      type="text"
                      value={formData.seoKeywords || ''}
                      onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                      placeholder="jamdani, 3.5 bahar, unstitched fabric"
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#242424] mb-1">SEO Meta Description</label>
                    <input
                      type="text"
                      value={formData.seoDescription || ''}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      placeholder="সার্চ ইঞ্জিনের জন্য সংক্ষিপ্ত বিবরণ..."
                      className="w-full bg-white border border-[#EDE5D9] rounded-lg px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Status checkboxes */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="accent-[#C5A46D]"
                  />
                  <span>ফিচার্ড পণ্য</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    className="accent-[#C5A46D]"
                  />
                  <span>বেস্ট সেলার</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNewArrival}
                    onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                    className="accent-[#C5A46D]"
                  />
                  <span>নতুন কালেকশন</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="accent-emerald-600"
                  />
                  <span>ওয়েবসাইটে দৃশ্যমান (Active)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#EDE5D9]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#EDE5D9] hover:bg-[#FAF8F4] text-[#242424] rounded-md font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#242424] hover:bg-[#C5A46D] text-white rounded-md font-semibold cursor-pointer shadow-xs"
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

