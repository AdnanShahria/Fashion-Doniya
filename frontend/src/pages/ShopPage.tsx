import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { FabricWidth, Product } from '../types';
import { getUniqueProductFabricImage } from '../components/home/allProductsImageGenerator';
import { 
  Search, 
  SlidersHorizontal, 
  LayoutGrid, 
  List, 
  X, 
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Zap,
  Heart
} from 'lucide-react';
import { FabricPatternVisual } from '../components/common/FabricPatternVisual';

export const ShopPage: React.FC = () => {
  const { 
    products, 
    selectedWidthFilter, 
    searchQuery, 
    selectedCategory, 
    navigateTo,
    addToCart,
    buyNow,
    toggleWishlist,
    isInWishlist,
    openQuickView
  } = useStore();

  const [search, setSearch] = useState(searchQuery || '');
  const [widthFilter, setWidthFilter] = useState<FabricWidth | 'all'>(selectedWidthFilter || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>(selectedCategory || 'all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'newest'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(12);

  useEffect(() => {
    setSearch(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    setWidthFilter(selectedWidthFilter || 'all');
  }, [selectedWidthFilter]);

  useEffect(() => {
    setCategoryFilter(selectedCategory || 'all');
  }, [selectedCategory]);

  const activeProducts = useMemo(
    () => products.filter(p => p.isActive !== false),
    [products]
  );

  // Extract unique categories & colors
  const categories = useMemo(() => {
    const set = new Set<string>();
    activeProducts.forEach(p => set.add(p.category));
    return Array.from(set);
  }, [activeProducts]);

  const colors = useMemo(() => {
    const set = new Set<string>();
    activeProducts.forEach(p => {
      if (p.color) set.add(p.color);
    });
    return Array.from(set);
  }, [activeProducts]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (!product.isActive) return false;

      // Width filter
      if (widthFilter !== 'all' && product.fabricWidth !== widthFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && product.category !== categoryFilter) {
        return false;
      }

      // Color filter
      if (colorFilter !== 'all' && product.color !== colorFilter) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = product.name.toLowerCase().includes(q);
        const matchEn = product.nameEn?.toLowerCase().includes(q) || false;
        const matchDesc = product.description.toLowerCase().includes(q);
        const matchType = product.fabricType.toLowerCase().includes(q);
        const matchSku = product.sku.toLowerCase().includes(q);
        if (!matchName && !matchEn && !matchDesc && !matchType && !matchSku) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.discountPrice || a.pricePerYard;
      const priceB = b.discountPrice || b.pricePerYard;

      switch (sortBy) {
        case 'price-low':
          return priceA - priceB;
        case 'price-high':
          return priceB - priceA;
        case 'newest':
          return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
        case 'featured':
        default:
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      }
    });
  }, [products, widthFilter, categoryFilter, colorFilter, search, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const resetFilters = () => {
    setWidthFilter('all');
    setCategoryFilter('all');
    setColorFilter('all');
    setSearch('');
    setSortBy('featured');
  };

  const isFiltered = widthFilter !== 'all' || categoryFilter !== 'all' || colorFilter !== 'all' || search.trim() !== '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#EDE5D9] pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#C5A46D]">
            কাপড় ক্যাটালগ
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#242424] mt-1">
            {widthFilter === '3.5' 
              ? '৩.৫ বহর কাপড় সংগ্রহ (Broad Width)' 
              : widthFilter === '2.5' 
              ? '২.৫ বহর কাপড় সংগ্রহ (Standard Width)' 
              : 'সকল প্রিমিয়াম আনস্টিচড কাপড়'}
          </h1>
          <p className="text-xs sm:text-sm text-[#242424]/65 mt-1">
            মোট <span className="font-bold text-[#242424] tabular-nums">{filteredProducts.length}</span> টি কাপড় উপলব্ধ
          </p>
        </div>

        {/* View mode & Sort controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden px-3 py-2 bg-white border border-[#EDE5D9] rounded-lg text-xs font-semibold text-[#242424] flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span>ফিল্টার</span>
            {isFiltered && <span className="w-2 h-2 rounded-full bg-[#C5A46D]"></span>}
          </button>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-[#EDE5D9] rounded-lg px-3 py-2 text-xs font-medium text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
          >
            <option value="featured">ফিচার্ড ও জনপ্রিয়</option>
            <option value="newest">নতুন কালেকশন</option>
            <option value="price-low">দাম: কম থেকে বেশি</option>
            <option value="price-high">দাম: বেশি থেকে কম</option>
          </select>

          {/* Grid vs List Toggles */}
          <div className="hidden sm:flex items-center bg-white border border-[#EDE5D9] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === 'grid' ? 'bg-[#FAF8F4] text-[#C5A46D]' : 'text-[#242424]/40 hover:text-[#242424]'
              }`}
              title="গ্রিড ভিউ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === 'list' ? 'bg-[#FAF8F4] text-[#C5A46D]' : 'text-[#242424]/40 hover:text-[#242424]'
              }`}
              title="লিস্ট ভিউ"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[#EDE5D9] space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE5D9]">
              <h3 className="text-sm font-bold text-[#242424] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#C5A46D]" />
                <span>ফিল্টার সমূহ</span>
              </h3>
              {isFiltered && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-[#C5A46D] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>রিসেট</span>
                </button>
              )}
            </div>

            {/* Search filter input */}
            <div>
              <label className="text-xs font-semibold text-[#242424] block mb-2">
                কাপড় খুঁজুন:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#242424]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="নাম বা উপাদান..."
                  className="w-full bg-[#FAF8F4] border border-[#EDE5D9] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#242424] focus:outline-hidden focus:border-[#C5A46D]"
                />
              </div>
            </div>

            {/* Fabric Width Filter */}
            <div>
              <label className="text-xs font-bold text-[#242424] block mb-2">
                কাপড়ের বহর:
              </label>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'সকল বহর', value: 'all' },
                  { label: '৩.৫ বহর (Broad Width)', value: '3.5' },
                  { label: '২.৫ বহর (Standard Width)', value: '2.5' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setWidthFilter(item.value as any)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-all flex items-center justify-between cursor-pointer ${
                      widthFilter === item.value 
                        ? 'bg-[#FAF8F4] font-bold text-[#C5A46D] border border-[#C5A46D]/40' 
                        : 'text-[#242424]/80 hover:bg-[#FAF8F4]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[11px] text-[#242424]/50 tabular-nums">
                      {item.value === 'all' 
                        ? activeProducts.length 
                        : activeProducts.filter(p => p.fabricWidth === item.value).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-bold text-[#242424] block mb-2">
                ক্যাটাগরি:
              </label>
              <div className="space-y-1 text-xs max-h-48 overflow-y-auto">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                    categoryFilter === 'all' ? 'font-bold text-[#C5A46D] bg-[#FAF8F4]' : 'text-[#242424]/80 hover:bg-[#FAF8F4]'
                  }`}
                >
                  সকল ক্যাটাগরি
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                      categoryFilter === cat ? 'font-bold text-[#C5A46D] bg-[#FAF8F4]' : 'text-[#242424]/80 hover:bg-[#FAF8F4]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Filter */}
            {colors.length > 0 && (
              <div>
                <label className="text-xs font-bold text-[#242424] block mb-2">
                  রং:
                </label>
                <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
                  <button
                    onClick={() => setColorFilter('all')}
                    className={`w-full text-left px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      colorFilter === 'all' ? 'font-bold text-[#C5A46D]' : 'text-[#242424]/70 hover:text-[#242424]'
                    }`}
                  >
                    সকল রং
                  </button>
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColorFilter(c)}
                      className={`w-full text-left px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        colorFilter === c ? 'font-bold text-[#C5A46D]' : 'text-[#242424]/70 hover:text-[#242424]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Help box */}
            <div className="p-3 bg-[#FAF8F4] rounded-lg border border-[#EDE5D9] text-xs space-y-1.5">
              <span className="font-bold text-[#242424] block">গজ মাপ নিয়ে দ্বিধায় আছেন?</span>
              <p className="text-[11px] text-[#242424]/70">
                আমাদের গজ ক্যালকুলেটরে সঠিক বহর ও মাপ জেনে নিন।
              </p>
              <button
                onClick={() => navigateTo('calculator')}
                className="text-xs font-semibold text-[#C5A46D] hover:underline block pt-1 cursor-pointer"
              >
                ক্যালকুলেটর ব্যবহার করুন →
              </button>
            </div>

          </div>
        </aside>

        {/* Product Grid / List (Col 3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Active Filter Chips */}
          {isFiltered && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-lg border border-[#EDE5D9] text-xs">
              <span className="text-[#242424]/60">ফিল্টার:</span>
              {widthFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF8F4] border border-[#EDE5D9] rounded-md font-medium text-[#242424]">
                  {widthFilter} বহর
                  <button onClick={() => setWidthFilter('all')} className="hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
              {categoryFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF8F4] border border-[#EDE5D9] rounded-md font-medium text-[#242424]">
                  {categoryFilter}
                  <button onClick={() => setCategoryFilter('all')} className="hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
              {colorFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF8F4] border border-[#EDE5D9] rounded-md font-medium text-[#242424]">
                  {colorFilter}
                  <button onClick={() => setColorFilter('all')} className="hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF8F4] border border-[#EDE5D9] rounded-md font-medium text-[#242424]">
                  "{search}"
                  <button onClick={() => setSearch('')} className="hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-xs text-[#C5A46D] hover:underline ml-auto font-medium cursor-pointer"
              >
                সব মুছুন
              </button>
            </div>
          )}

          {/* Products Render */}
          {displayedProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-[#EDE5D9] space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF8F4] text-[#C5A46D] flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#242424]">কোনো কাপড় খুঁজে পাওয়া যায়নি</h3>
              <p className="text-xs text-[#242424]/60 max-w-sm mx-auto">
                আপনার দেওয়া ফিল্টারে কোনো কাপড় মেলেনি। ফিল্টার রিসেট করে আবার চেষ্টা করুন।
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#242424] text-white text-xs font-semibold rounded-md hover:bg-[#C5A46D] transition-colors cursor-pointer"
              >
                সব ফিল্টার মুছুন
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8">
              {displayedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-4">
              {displayedProducts.map(product => {
                const effectivePrice = product.discountPrice || product.pricePerYard;
                const isWishlisted = isInWishlist(product.id);
                const listImage = getUniqueProductFabricImage(product);
                const isOutOfStock = product.stockYards <= 0;
                return (
                  <div
                    key={product.id}
                    className="p-5 bg-white rounded-xl border border-[#EDE5D9] hover:border-[#C5A46D] transition-all flex flex-col sm:flex-row items-center gap-6"
                  >
                    <div 
                      onClick={() => navigateTo('product-details', { productId: product.id })}
                      className="w-full sm:w-44 aspect-[4/3] shrink-0 rounded-lg overflow-hidden border border-[#EDE5D9] cursor-pointer bg-[#FAF6F0]"
                    >
                      {listImage ? (
                        <img
                          src={listImage}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FabricPatternVisual
                          productId={product.id}
                          patternType={product.patternType}
                          colorHex={product.colorHex}
                          fabricWidth={product.fabricWidth}
                          title={product.fabricType}
                          aspectRatio="square"
                        />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 text-left w-full">
                      <div className="flex items-center gap-2 text-xs text-[#242424]/60">
                        <span>{product.category}</span>
                        <span>·</span>
                        <span className="font-semibold text-[#C5A46D]">{product.fabricWidth} বহর</span>
                        <span>·</span>
                        <span>{product.fabricType}</span>
                      </div>

                      <h3
                        onClick={() => navigateTo('product-details', { productId: product.id })}
                        className="text-base font-bold text-[#242424] hover:text-[#C5A46D] cursor-pointer"
                      >
                        {product.name}
                      </h3>

                      <p className="text-xs text-[#242424]/70 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-lg font-bold text-[#242424] tabular-nums">
                          ৳{effectivePrice}
                        </span>
                        <span className="text-xs text-[#242424]/60">/ প্রতি গজ</span>
                        {product.discountPrice && (
                          <span className="text-xs text-[#242424]/40 line-through tabular-nums">
                            ৳{product.pricePerYard}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(product, product.minOrderQuantity || 1.5)}
                        className="flex-1 sm:flex-none py-2 px-4 bg-[#FAF8F4] hover:bg-[#EDE5D9] disabled:opacity-50 disabled:cursor-not-allowed text-[#242424] border border-[#EDE5D9] rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#C5A46D]" />
                        <span>{isOutOfStock ? 'স্টক শেষ' : 'কার্টে যোগ'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => buyNow(product, product.minOrderQuantity || 1.5)}
                        className="flex-1 sm:flex-none py-2 px-4 bg-[#6B0812] hover:bg-[#53050D] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#C59B48]" />
                        <span>{isOutOfStock ? 'অপ্রাপ্য' : 'সরাসরি কিনুন'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-6">
              <button
                onClick={() => setVisibleCount(prev => prev + 8)}
                className="px-6 py-2.5 bg-white border border-[#242424] hover:bg-[#FAF8F4] text-[#242424] text-xs font-semibold rounded-md transition-colors cursor-pointer shadow-xs"
              >
                আরও কাপড় দেখুন (বাকি {filteredProducts.length - visibleCount}টি)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Slide-over / Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 lg:hidden">
          <div className="w-80 max-w-full bg-white h-full p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE5D9]">
              <h3 className="text-sm font-bold text-[#242424]">ফিল্টার সমূহ</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 hover:bg-[#FAF8F4] rounded-md">
                <X className="w-5 h-5 text-[#242424]" />
              </button>
            </div>

            {/* Width */}
            <div>
              <label className="text-xs font-bold text-[#242424] block mb-2">বহর নির্বাচন:</label>
              <div className="space-y-1.5 text-xs">
                {['all', '3.5', '2.5'].map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      setWidthFilter(w as any);
                      setMobileFilterOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-md ${
                      widthFilter === w ? 'bg-[#C5A46D] text-white font-bold' : 'bg-[#FAF8F4] text-[#242424]'
                    }`}
                  >
                    {w === 'all' ? 'সকল বহর' : `${w} বহর কাপড়`}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold text-[#242424] block mb-2">ক্যাটাগরি:</label>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setMobileFilterOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-md ${categoryFilter === 'all' ? 'bg-[#242424] text-white' : 'bg-[#FAF8F4]'}`}
                >
                  সকল ক্যাটাগরি
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCategoryFilter(c);
                      setMobileFilterOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-md ${categoryFilter === c ? 'bg-[#242424] text-white' : 'bg-[#FAF8F4]'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                resetFilters();
                setMobileFilterOpen(false);
              }}
              className="w-full py-2 bg-[#FAF8F4] border border-[#EDE5D9] text-[#242424] text-xs font-semibold rounded-md"
            >
              সব ফিল্টার রিসেট
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
