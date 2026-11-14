import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AnnouncementBar } from './components/common/AnnouncementBar';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { FloatingWhatsApp } from './components/common/FloatingWhatsApp';
import { QuickViewModal } from './components/common/QuickViewModal';
import { ToastNotification } from './components/common/ToastNotification';
import { OrangeBackButton } from './components/common/OrangeBackButton';
import { MobileBottomNav } from './components/common/MobileBottomNav';

// Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { CustomDesignPage } from './pages/CustomDesignPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { WishlistPage } from './pages/WishlistPage';
import { AccountPage } from './pages/AccountPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FaqPage } from './pages/FaqPage';
import { MeasurementGuidePage } from './pages/MeasurementGuidePage';
import { PolicyPage } from './pages/PolicyPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { FabricWidthCategoryPage } from './pages/FabricWidthCategoryPage';
import { CategoryGalleryPage } from './pages/CategoryGalleryPage';

const AppContent: React.FC = () => {
  const { currentPage, selectedWidthFilter, selectedCategory, selectedProductId, products, settings, navigateTo } = useStore();
  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;

  // Dynamic SEO & Favicon synchronization
  React.useEffect(() => {
    const seo = settings.seoConfig;
    const pageSeo = seo?.pages?.[currentPage];

    let title = pageSeo?.title || seo?.defaultTitle || `${settings.storeName} — ${settings.tagline}`;
    let description = pageSeo?.description || seo?.defaultDescription || '';
    let keywords = pageSeo?.keywords || seo?.defaultKeywords || '';

    if (currentPage === 'product-details' && selectedProduct) {
      title = selectedProduct.seoTitle || `${selectedProduct.name} | ${settings.storeName}`;
      description = selectedProduct.seoDescription || selectedProduct.description || description;
      keywords = selectedProduct.seoKeywords || keywords;
    }

    if (title) document.title = title;

    const setMeta = (selector: string, attr: string, val: string) => {
      if (!val) return;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (selector.includes('property=')) {
          const propMatch = selector.match(/property="([^"]+)"/);
          if (propMatch) el.setAttribute('property', propMatch[1]);
        } else {
          const nameMatch = selector.match(/name="([^"]+)"/);
          if (nameMatch) el.setAttribute('name', nameMatch[1]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, val);
    };

    if (description) {
      setMeta('meta[name="description"]', 'content', description);
      setMeta('meta[property="og:description"]', 'content', description);
    }
    if (title) {
      setMeta('meta[property="og:title"]', 'content', title);
    }
    if (keywords) {
      setMeta('meta[name="keywords"]', 'content', keywords);
    }

    if (settings.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.faviconUrl;
    }
  }, [currentPage, selectedProduct, settings]);

  // If in Admin mode, render the dedicated admin dashboard layout
  if (currentPage === 'admin') {
    return (
      <>
        <AdminLayout />
        <ToastNotification />
      </>
    );
  }

  // Maintenance mode gate (only active if explicitly toggled on by Admin)
  if (settings.maintenanceMode) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#EDE5D9] p-8 shadow-lg space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            মেইনটেন্যান্স মোড সক্রিয়
          </span>
          <h1 className="text-2xl font-extrabold text-[#242424]">{settings.storeName}</h1>
          <p className="text-sm text-[#242424]/75 leading-relaxed">
            {settings.maintenanceMessage || 'আমাদের ওয়েবসাইটে বর্তমানে মানোন্নয়নের কাজ চলছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'}
          </p>
          <div className="pt-3 border-t border-[#EDE5D9] flex items-center justify-center gap-3">
            <button
              onClick={() => navigateTo('admin')}
              className="px-4 py-2 bg-[#242424] hover:bg-[#C5A46D] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করুন
            </button>
          </div>
        </div>
        <ToastNotification />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'fabric-width':
        return <FabricWidthCategoryPage width={selectedWidthFilter === 'all' ? '3.5' : selectedWidthFilter} />;
      case 'category-gallery':
        return (
          <CategoryGalleryPage 
            width={selectedWidthFilter === 'all' ? '3.5' : selectedWidthFilter} 
            categorySlug={selectedCategory || 'kamiz'} 
          />
        );
      case 'shop':
        return <ShopPage />;
      case 'shop-2-5':
        return <FabricWidthCategoryPage width="2.5" />;
      case 'shop-3-5':
        return <FabricWidthCategoryPage width="3.5" />;
      case 'product-details':
        return <ProductDetailsPage />;
      case 'calculator':
        return <CalculatorPage />;
      case 'custom-design':
        return <CustomDesignPage />;
      case 'cart':
        return <CartPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'order-confirmation':
        return <OrderConfirmationPage />;
      case 'order-tracking':
        return <OrderTrackingPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'account':
        return <AccountPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'faq':
        return <FaqPage />;
      case 'measurement-guide':
        return <MeasurementGuidePage />;
      case 'delivery-policy':
      case 'return-policy':
      case 'privacy-policy':
      case 'terms':
        return <PolicyPage />;
      default:
        return <HomePage />;
    }
  };

  const pagesWithInlineBackBar = new Set([
    'home',
    'fabric-width',
    'shop-2-5',
    'shop-3-5',
    'category-gallery',
    'product-details',
    'checkout',
  ]);

  const showGlobalSubpageBackBar = !pagesWithInlineBackBar.has(currentPage);

  return (
    <div className="min-h-screen w-full overflow-x-clip flex flex-col bg-[#FAF6F0] text-[#241614] pb-[60px] md:pb-0">
      {/* 1. Responsive Luxury Header Navigation */}
      <Header />

      {/* 2. Page Content */}
      <main className="flex-1 w-full overflow-x-clip">
        {showGlobalSubpageBackBar && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
            <OrangeBackButton label="ফিরে যান" />
          </div>
        )}
        {renderPage()}
      </main>

      {/* 3. Luxury Footer */}
      <Footer />

      {/* 4. Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Floating Elements & Overlays */}
      <FloatingWhatsApp />
      <QuickViewModal />
      <ToastNotification />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
