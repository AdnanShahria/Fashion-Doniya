import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useParams } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { FloatingWhatsApp } from './components/common/FloatingWhatsApp';
import { QuickViewModal } from './components/common/QuickViewModal';
import { ToastNotification } from './components/common/ToastNotification';
import { OrangeBackButton } from './components/common/OrangeBackButton';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { PageSkeleton, AdminPageSkeleton } from './components/common/Skeletons';
import { ProtectedRoute, FeatureRoute } from './components/common/RouteGuards';
import type { FabricWidth } from './types';

// Code-split routes via React.lazy (mapped from named exports)
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const ProductDetailsPage = lazy(() =>
  import('./pages/ProductDetailsPage').then((m) => ({ default: m.ProductDetailsPage }))
);
const CalculatorPage = lazy(() =>
  import('./pages/CalculatorPage').then((m) => ({ default: m.CalculatorPage }))
);
const CustomDesignPage = lazy(() =>
  import('./pages/CustomDesignPage').then((m) => ({ default: m.CustomDesignPage }))
);
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() =>
  import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage }))
);
const OrderConfirmationPage = lazy(() =>
  import('./pages/OrderConfirmationPage').then((m) => ({ default: m.OrderConfirmationPage }))
);
const OrderTrackingPage = lazy(() =>
  import('./pages/OrderTrackingPage').then((m) => ({ default: m.OrderTrackingPage }))
);
const WishlistPage = lazy(() =>
  import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage }))
);
const AccountPage = lazy(() =>
  import('./pages/AccountPage').then((m) => ({ default: m.AccountPage }))
);
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const FaqPage = lazy(() => import('./pages/FaqPage').then((m) => ({ default: m.FaqPage })));
const MeasurementGuidePage = lazy(() =>
  import('./pages/MeasurementGuidePage').then((m) => ({ default: m.MeasurementGuidePage }))
);
const PolicyPage = lazy(() =>
  import('./pages/PolicyPage').then((m) => ({ default: m.PolicyPage }))
);
const FabricWidthCategoryPage = lazy(() =>
  import('./pages/FabricWidthCategoryPage').then((m) => ({ default: m.FabricWidthCategoryPage }))
);
const CategoryGalleryPage = lazy(() =>
  import('./pages/CategoryGalleryPage').then((m) => ({ default: m.CategoryGalleryPage }))
);
const AdminLayout = lazy(() =>
  import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const SysAdmPage = lazy(() =>
  import('./pages/sysadm/SysAdmPage').then((m) => ({ default: m.SysAdmPage }))
);

const FabricWidthRouteView: React.FC = () => {
  const { widthSlug } = useParams<{ widthSlug: string }>();
  const { selectedWidthFilter } = useStore();
  const parsed: FabricWidth = widthSlug?.startsWith('2.5')
    ? '2.5'
    : widthSlug?.startsWith('3.5')
      ? '3.5'
      : selectedWidthFilter === 'all'
        ? '3.5'
        : selectedWidthFilter;
  return <FabricWidthCategoryPage width={parsed} />;
};

const CategoryGalleryRouteView: React.FC = () => {
  const { widthSlug, catSlug, slug } = useParams<{
    widthSlug?: string;
    catSlug?: string;
    slug?: string;
  }>();
  const { selectedWidthFilter, selectedCategory } = useStore();
  const resolvedWidth: FabricWidth = widthSlug?.startsWith('2.5')
    ? '2.5'
    : widthSlug?.startsWith('3.5')
      ? '3.5'
      : selectedWidthFilter === 'all'
        ? '3.5'
        : selectedWidthFilter;
  const resolvedCategory = catSlug || slug || selectedCategory || 'kamiz';
  return <CategoryGalleryPage width={resolvedWidth} categorySlug={resolvedCategory} />;
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

const AppContent: React.FC = () => {
  const location = useLocation();
  const {
    currentPage,
    selectedWidthFilter,
    selectedCategory,
    selectedProductId,
    products,
    settings,
    navigateTo,
  } = useStore();
  const selectedProduct =
    products.find((p) => p.id === selectedProductId || p.slug === selectedProductId) || null;

  // Dynamic SEO, Robots, Canonical/Hreflang, OpenGraph/Twitter & JSON-LD synchronization
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

    const setLink = (selector: string, attrs: Record<string, string>) => {
      let el = document.querySelector(selector) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        document.head.appendChild(el);
      }
      for (const [key, val] of Object.entries(attrs)) {
        el.setAttribute(key, val);
      }
    };

    const pathname = location.pathname;
    const origin = window.location.origin;
    const canonicalUrl = `${origin}${pathname === '/' ? '' : pathname}`;

    const privatePrefixes = [
      '/admin',
      '/sysadm',
      '/account',
      '/cart',
      '/checkout',
      '/wishlist',
      '/order-confirmation',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
    ];
    const isPrivatePath = privatePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    setMeta(
      'meta[name="robots"]',
      'content',
      isPrivatePath
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    setLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });
    setLink('link[rel="alternate"][hreflang="bn-BD"]', {
      rel: 'alternate',
      hreflang: 'bn-BD',
      href: canonicalUrl,
    });
    setLink('link[rel="alternate"][hreflang="en"]', {
      rel: 'alternate',
      hreflang: 'en',
      href: canonicalUrl,
    });
    setLink('link[rel="alternate"][hreflang="x-default"]', {
      rel: 'alternate',
      hreflang: 'x-default',
      href: canonicalUrl,
    });

    const toAbsoluteImageUrl = (raw?: string): string => {
      if (!raw || raw.startsWith('data:')) return '';
      if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
      return `${origin}${raw.startsWith('/') ? raw : `/${raw}`}`;
    };

    const rawOgImage =
      (currentPage === 'product-details' && selectedProduct
        ? selectedProduct.images?.find((img) => img && !img.startsWith('data:'))
        : undefined) ||
      pageSeo?.ogImage ||
      seo?.ogImageUrl ||
      seo?.ogImage ||
      '/assets/fabric-banner-3-5.png';

    const resolvedOgImage = toAbsoluteImageUrl(rawOgImage);
    const resolvedImageAlt =
      currentPage === 'product-details' && selectedProduct
        ? selectedProduct.imageAlt || selectedProduct.name || title
        : title || settings.storeName;

    if (description) {
      setMeta('meta[name="description"]', 'content', description);
      setMeta('meta[property="og:description"]', 'content', description);
      setMeta('meta[name="twitter:description"]', 'content', description);
    }
    if (title) {
      setMeta('meta[property="og:title"]', 'content', title);
      setMeta('meta[name="twitter:title"]', 'content', title);
    }
    if (keywords) {
      setMeta('meta[name="keywords"]', 'content', keywords);
    }
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta(
      'meta[property="og:type"]',
      'content',
      currentPage === 'product-details' && selectedProduct ? 'product' : 'website'
    );
    if (resolvedOgImage) {
      setMeta('meta[property="og:image"]', 'content', resolvedOgImage);
      setMeta('meta[name="twitter:image"]', 'content', resolvedOgImage);
    }
    if (resolvedImageAlt) {
      setMeta('meta[property="og:image:alt"]', 'content', resolvedImageAlt);
      setMeta('meta[name="twitter:image:alt"]', 'content', resolvedImageAlt);
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

    // Dynamic Route JSON-LD for product-details & category-gallery
    const existingJsonLd = document.getElementById('dynamic-route-jsonld');
    if (currentPage === 'product-details' && selectedProduct) {
      const productImages = (selectedProduct.images || [])
        .map((img) => toAbsoluteImageUrl(img))
        .filter(Boolean);
      const effectivePrice = selectedProduct.discountPrice || selectedProduct.pricePerYard;
      const widthLabel = `${selectedProduct.fabricWidth} বহর`;
      const jsonLdPayload = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Product',
            name: selectedProduct.name,
            description:
              selectedProduct.seoDescription || selectedProduct.description || description,
            sku: selectedProduct.sku,
            ...(productImages.length > 0
              ? { image: productImages }
              : resolvedOgImage
                ? { image: [resolvedOgImage] }
                : {}),
            brand: {
              '@type': 'Brand',
              name: settings.storeName,
            },
            category: selectedProduct.category,
            offers: {
              '@type': 'Offer',
              url: canonicalUrl,
              priceCurrency: 'BDT',
              price: String(effectivePrice),
              availability:
                selectedProduct.stockYards > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              itemCondition: 'https://schema.org/NewCondition',
            },
            ...(selectedProduct.rating && selectedProduct.reviewCount
              ? {
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: String(selectedProduct.rating),
                    reviewCount: String(selectedProduct.reviewCount),
                  },
                }
              : {}),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: settings.storeName,
                item: `${origin}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: widthLabel,
                item: `${origin}/fabric/${selectedProduct.fabricWidth}-bahar`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: selectedProduct.name,
                item: canonicalUrl,
              },
            ],
          },
        ],
      };

      const scriptEl =
        existingJsonLd ||
        (() => {
          const s = document.createElement('script');
          s.id = 'dynamic-route-jsonld';
          s.type = 'application/ld+json';
          document.head.appendChild(s);
          return s;
        })();
      scriptEl.textContent = JSON.stringify(jsonLdPayload);
    } else if (currentPage === 'category-gallery') {
      const resolvedWidth = selectedWidthFilter === 'all' ? '3.5' : selectedWidthFilter;
      const categoryLabel = selectedCategory || 'কালেকশন';
      const jsonLdPayload = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            name: `${categoryLabel} (${resolvedWidth} বহর) | ${settings.storeName}`,
            description: description || `${resolvedWidth} বহর ${categoryLabel} গজ কাপড় সংগ্রহ`,
            url: canonicalUrl,
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: settings.storeName,
                item: `${origin}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: `${resolvedWidth} বহর`,
                item: `${origin}/fabric/${resolvedWidth}-bahar`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: categoryLabel,
                item: canonicalUrl,
              },
            ],
          },
        ],
      };

      const scriptEl =
        existingJsonLd ||
        (() => {
          const s = document.createElement('script');
          s.id = 'dynamic-route-jsonld';
          s.type = 'application/ld+json';
          document.head.appendChild(s);
          return s;
        })();
      scriptEl.textContent = JSON.stringify(jsonLdPayload);
    } else if (existingJsonLd) {
      existingJsonLd.remove();
    }
  }, [
    currentPage,
    selectedProduct,
    selectedCategory,
    selectedWidthFilter,
    settings,
    location.pathname,
  ]);

  // Surface 1: SysAdm Console (Disconnected as requested; preserved without deletion)
  /*
  if (location.pathname.startsWith('/sysadm') || currentPage === 'sysadm') {
    return (
      <div data-layoutless="true">
        <Suspense fallback={<AdminPageSkeleton />}>
          <SysAdmPage />
        </Suspense>
        <ToastNotification />
      </div>
    );
  }
  */

  // Surface 2: Layoutless Admin Dashboard
  if (location.pathname.startsWith('/admin') || currentPage === 'admin') {
    return (
      <div data-layoutless="true">
        <Suspense fallback={<AdminPageSkeleton />}>
          <AdminLayout />
        </Suspense>
        <ToastNotification />
      </div>
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
            {settings.maintenanceMessage ||
              'আমাদের ওয়েবসাইটে বর্তমানে মানোন্নয়নের কাজ চলছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'}
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
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/fabric/:widthSlug" element={<FabricWidthRouteView />} />
            <Route path="/fabric/:widthSlug/:catSlug" element={<CategoryGalleryRouteView />} />
            <Route path="/category/:slug" element={<CategoryGalleryRouteView />} />
            <Route path="/product/:slug" element={<ProductDetailsPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/custom-design" element={<CustomDesignPage />} />
            <Route path="/fabric-to-outfit" element={<CustomDesignPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
            <Route path="/order-tracking" element={<OrderTrackingPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route
              path="/account/*"
              element={
                <FeatureRoute feature="feature.dashboard">
                  <ProtectedRoute role="user">
                    <AccountPage />
                  </ProtectedRoute>
                </FeatureRoute>
              }
            />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/measurement-guide" element={<MeasurementGuidePage />} />
            <Route path="/delivery-policy" element={<PolicyPage />} />
            <Route path="/return-policy" element={<PolicyPage />} />
            <Route path="/privacy-policy" element={<PolicyPage />} />
            <Route path="/terms" element={<PolicyPage />} />
            <Route
              path="/shop-2-5"
              element={
                <FabricWidthCategoryPage
                  width={selectedWidthFilter === '2.5' ? '2.5' : '2.5'}
                />
              }
            />
            <Route path="/shop-3-5" element={<FabricWidthCategoryPage width="3.5" />} />
            <Route path="/login" element={<AccountPage />} />
            <Route path="/register" element={<AccountPage />} />
            <Route path="/forgot-password" element={<AccountPage />} />
            <Route path="/account/forgot-password" element={<AccountPage />} />
            <Route path="/reset-password" element={<AccountPage />} />
            <Route path="/account/reset-password" element={<AccountPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </Suspense>
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
    <HelmetProvider>
      <BrowserRouter>
        <StoreProvider>
          <AppContent />
          <Toaster position="bottom-right" />
        </StoreProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
