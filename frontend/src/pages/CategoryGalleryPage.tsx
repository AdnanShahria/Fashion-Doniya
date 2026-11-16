import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { OrangeBackButton } from '../components/common/OrangeBackButton';
import { categoryService } from '../services/categoryService';
import { measurementService } from '../services/measurementService';
import {
  FabricWidth,
  FabricCategoryRecord
} from '../types';
import {
  Search
} from 'lucide-react';

interface CategoryGalleryPageProps {
  width: FabricWidth;
  categorySlug: string;
}

const ITEMS_PER_PAGE = 6;

export const CategoryGalleryPage: React.FC<CategoryGalleryPageProps> = ({
  width,
  categorySlug
}) => {
  const { products, navigateTo } = useStore();

  const normalizedSlug = measurementService.resolveCategorySlug(categorySlug);
  const collectionKey = width === '3.5' ? '3.5_bahar' : '2.5_bahar';

  const [publishedCategories, setPublishedCategories] = useState<FabricCategoryRecord[]>(() =>
    categoryService.getPublishedCollection(collectionKey).categories.filter((c) => c.isEnabled)
  );

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE);

  // Reload dynamic categories when width/slug or admin updates change
  useEffect(() => {
    const refresh = () => {
      const col = categoryService.getPublishedCollection(width === '3.5' ? '3.5_bahar' : '2.5_bahar');
      setPublishedCategories(col.categories.filter((c) => c.isEnabled));
    };

    refresh();
    setVisibleCount(ITEMS_PER_PAGE);

    window.addEventListener('fabric-collections-updated', refresh);
    window.addEventListener('fabric-measurements-updated', refresh);
    return () => {
      window.removeEventListener('fabric-collections-updated', refresh);
      window.removeEventListener('fabric-measurements-updated', refresh);
    };
  }, [width, normalizedSlug]);

  const currentCategoryRecord = useMemo(() => {
    return (
      publishedCategories.find(
        (c) => measurementService.resolveCategorySlug(c.slug) === normalizedSlug
      ) || null
    );
  }, [publishedCategories, normalizedSlug]);

  const categoryDisplayName = useMemo(() => {
    if (currentCategoryRecord) return currentCategoryRecord.name;
    switch (normalizedSlug) {
      case 'short-kamiz':
        return 'শার্ট কামিজ';
      case 'long-koti':
        return 'লং কটি';
      case 'gown-lehenga':
        return 'গাউন / লেহেঙ্গা';
      case 'saree':
        return 'শাড়ি';
      case 'custom-design':
        return 'কাস্টম ডিজাইন';
      case 'kamiz':
      default:
        return 'কামিজ';
    }
  }, [currentCategoryRecord, normalizedSlug]);

  // Filter products strictly by selected Bahar (width) and category — never mix 3.5 and 2.5 Bahar products
  const categoryProducts = useMemo(() => {
    const exact = products.filter((p) => {
      if (!p.isActive) return false;
      if (p.fabricWidth !== width) return false;
      const productSlug = measurementService.resolveCategorySlug(p.category);
      if (productSlug === normalizedSlug) return true;
      if (
        currentCategoryRecord &&
        (p.category === currentCategoryRecord.name ||
          p.category === currentCategoryRecord.matchCategoryName)
      ) {
        return true;
      }
      return false;
    });
    return exact;
  }, [products, width, normalizedSlug, currentCategoryRecord]);

  const filteredProducts = useMemo(() => {
    return categoryProducts
      .filter((p) => {
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchEn = p.nameEn?.toLowerCase().includes(q);
          const matchType = p.fabricType.toLowerCase().includes(q);
          const matchColor = p.color.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          if (!matchName && !matchEn && !matchType && !matchColor && !matchSku) return false;
        }
        return true;
      })
      .sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }, [categoryProducts, search]);

  const displayedProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  const resetFilters = () => {
    setSearch('');
    setVisibleCount(ITEMS_PER_PAGE);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 pb-20">
      {/* 1. Top Back Navigation (Left) & Bahar Switcher (Right) */}
      <div className="flex items-center justify-between gap-2">
        <div className="shrink-0">
          <OrangeBackButton
            onClick={() => navigateTo('fabric-width', { width })}
            label="ফিরে যান"
          />
        </div>

        {/* Independent Bahar Switcher for this Category */}
        <div className="inline-flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-full bg-[#FFFDF9] border border-[#D5A64A]/45 shadow-2xs shrink-0">
          <Link
            to={`/fabric/3.5-bahar/${encodeURIComponent(normalizedSlug)}`}
            className={`px-2.5 min-[375px]:px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] min-[375px]:text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              width === '3.5'
                ? 'bg-[#850B1B] text-white shadow-xs'
                : 'text-[#4A2C2A] hover:text-[#850B1B]'
            }`}
          >
            ৩.৫ হাত বহর
          </Link>
          <Link
            to={`/fabric/2.5-bahar/${encodeURIComponent(normalizedSlug)}`}
            className={`px-2.5 min-[375px]:px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] min-[375px]:text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              width === '2.5'
                ? 'bg-[#850B1B] text-white shadow-xs'
                : 'text-[#4A2C2A] hover:text-[#850B1B]'
            }`}
          >
            ২.৫ হাত বহর
          </Link>
        </div>
      </div>

      {/* 2. Six Sibling Category Switcher Tabs & Search Bar */}
      <div className="space-y-4">
        {/* Category Switcher for current Bahar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5">
          {publishedCategories.map((cat) => {
            const catNormalized = measurementService.resolveCategorySlug(cat.slug);
            const active = catNormalized === normalizedSlug;
            return (
              <Link
                key={cat.id}
                to={`/fabric/${width}-bahar/${encodeURIComponent(cat.slug)}`}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                  active
                    ? 'bg-[#850B1B] text-white border-[#850B1B] shadow-2xs'
                    : 'bg-white text-[#4A2C2A] hover:text-[#850B1B] border-[#D5A64A]/45'
                }`}
              >
                <span>{cat.name}</span>
                {cat.standardYards && (
                  <span
                    className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded ${
                      active ? 'bg-white/20 text-white' : 'bg-[#FAF6F0] text-[#850B1B]'
                    }`}
                  >
                    {cat.standardYards}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Search Bar Only */}
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-[#1C1B19]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
            placeholder={`${categoryDisplayName} ক্যাটাগরিতে কাপড় খুঁজুন...`}
            className="w-full bg-white border border-[#E6DFD3] rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1C1B19] focus:outline-hidden focus:border-[#C5A46D] shadow-2xs"
          />
        </div>
      </div>

      {/* 3. Product Gallery Grid (3-Column Desktop, 2-Column Mobile) */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-14 text-center rounded-2xl border border-[#E6DFD3] space-y-4">
          <h3 className="text-lg font-bold text-[#1C1B19]">কোনো কাপড় পাওয়া যায়নি</h3>
          <p className="text-sm text-[#1C1B19]/65">
            আপনার অনুসন্ধান পরিবর্তন করে আবার চেষ্টা করুন।
          </p>
          <button
            onClick={resetFilters}
            className="px-6 py-2.5 bg-[#850B1B] text-white text-sm font-medium rounded-md cursor-pointer"
          >
            সার্চ রিসেট করুন
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Load More / Pagination */}
          {visibleCount < filteredProducts.length && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                className="px-7 py-3 rounded-full bg-[#850B1B] hover:bg-[#6B0815] text-white text-sm font-bold shadow-xs transition-all cursor-pointer"
              >
                আরও কাপড় দেখুন ({filteredProducts.length - visibleCount}টি বাকি)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
