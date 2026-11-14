import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { Heart, ArrowRight, ShoppingBag } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { wishlist, products, navigateTo } = useStore();

  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  if (wishlistedProducts.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-[#FAF8F4] text-[#C5A46D] rounded-full flex items-center justify-center mx-auto border border-[#EDE5D9]">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#242424]">আপনার পছন্দের তালিকা খালি</h2>
        <p className="text-xs text-[#242424]/65">
          আপনার পছন্দের কাপড়ে হার্ট আইকনে ক্লিক করে সহজেই এখানে সেভ করে রাখতে পারেন।
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="px-6 py-2.5 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
        >
          কাপড় দেখতে যান
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-[#EDE5D9] pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#C5A46D]">
            সংরক্ষিত কালেকশন
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#242424] mt-0.5">
            আপনার পছন্দের তালিকা ({wishlistedProducts.length}টি কাপড়)
          </h1>
        </div>
        <button
          onClick={() => navigateTo('shop')}
          className="text-xs font-semibold text-[#242424] hover:text-[#C5A46D] flex items-center gap-1 cursor-pointer"
        >
          <span>আরও কাপড় খুঁজুন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {wishlistedProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
