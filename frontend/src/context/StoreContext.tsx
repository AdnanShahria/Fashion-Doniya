import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { 
  Product, 
  CartItem, 
  StoreSettings, 
  CustomerUser, 
  NavigationPage, 
  AdminTab, 
  FabricWidth,
  Order,
  ProductCustomizationPayload
} from '../types';
import { StorageService } from '../services/storageService';
import { productService } from '../services/productService';
import { settingsService } from '../services/settingsService';
import { orderService } from '../services/orderService';
import { categoryService } from '../services/categoryService';
import { measurementService } from '../services/measurementService';
import { api, getCustomerAuthToken } from '../services/api';
import { apiCache } from '../services/apiCache';
import { useHomeStore } from '../store/homeStore';
import { useSettingsStore } from '../store/settingsStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useRecentlyViewedStore } from '../store/recentlyViewedStore';

interface NavigationParams {
  productId?: string;
  category?: string;
  width?: FabricWidth | 'all';
  search?: string;
  orderNumber?: string;
  trackingPhone?: string;
}

interface ToastInfo {
  id: number;
  text: string;
  type: 'success' | 'info' | 'error';
}

interface AppliedCouponState {
  code: string;
  discount: number;
  msg: string;
}

interface StoreContextType {
  // Navigation & Page State
  currentPage: NavigationPage;
  adminTab: AdminTab;
  selectedProductId: string | null;
  selectedCategory: string | null;
  selectedWidthFilter: FabricWidth | 'all';
  searchQuery: string;
  trackingQuery: string;
  trackingPhone: string;
  
  // Data
  products: Product[];
  settings: StoreSettings;
  cart: CartItem[];
  appliedCoupon: AppliedCouponState | null;
  wishlist: string[];
  currentUser: CustomerUser | null;
  lastCompletedOrder: Order | null;
  quickViewProduct: Product | null;
  buyNowItem: CartItem | null;
  toast: ToastInfo | null;
  
  // Actions
  navigateTo: (page: NavigationPage, params?: NavigationParams) => void;
  goBack: () => void;
  setAdminTab: (tab: AdminTab) => void;
  addToCart: (
    product: Product,
    yards: number,
    selectedColor?: string,
    notify?: boolean,
    customization?: ProductCustomizationPayload
  ) => void;
  updateCartQuantity: (itemId: string, newYards: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  buyNow: (
    product: Product,
    yards: number,
    selectedColor?: string,
    customization?: ProductCustomizationPayload
  ) => void;
  clearBuyNow: () => void;
  setLastCompletedOrder: (order: Order | null) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  loginUser: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (
    fullName: string,
    emailOrPhone: string,
    password: string,
    optionalPhoneOrEmail?: string
  ) => Promise<{ success: boolean; message?: string }>;
  requestPasswordResetOtp: (
    identifier: string
  ) => Promise<{ success: boolean; devOtp?: string; message?: string }>;
  resetPassword: (
    identifier: string,
    newPassword: string,
    otp?: string
  ) => Promise<{ success: boolean; message?: string }>;
  changeUserPassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; message?: string }>;
  applyCoupon: (code: string, subtotalOverride?: number) => boolean;
  clearCoupon: (silent?: boolean) => void;
  logoutUser: () => void;
  updateUserProfile: (profile: Partial<CustomerUser>) => void;
  refreshData: () => void;
  
  // Computed
  cartTotalYards: number;
  cartSubtotal: number;
  cartItemCount: number;
}

interface NavHistoryEntry {
  page: NavigationPage;
  productId: string | null;
  category: string | null;
  width: FabricWidth | 'all';
  search: string;
  orderNumber: string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize storage & sync orders, products, categories, settings, and measurements with backend database
  useEffect(() => {
    StorageService.initialize();
    orderService.syncWithBackend().catch(() => {});
    categoryService.syncFromBackend().catch(() => {});
    measurementService.syncFromBackend().catch(() => {});

    useHomeStore
      .getState()
      .fetchHomeData()
      .then((data) => {
        if (data?.success) {
          if (Array.isArray(data.products)) {
            StorageService.setProducts(data.products);
            setProducts(data.products);
          }
          if (Array.isArray(data.categories)) {
            StorageService.setCategories(data.categories);
          }
          if (data.settings) {
            StorageService.setSettings(data.settings as never);
            const updatedSettings = StorageService.getSettings();
            setSettings(updatedSettings);
            useSettingsStore.getState().setSettings(updatedSettings);
          }
        } else {
          productService
            .syncFromBackend()
            .then((syncedProducts) => {
              if (Array.isArray(syncedProducts)) {
                setProducts(syncedProducts);
              }
            })
            .catch(() => {});
          settingsService
            .syncSettingsFromBackend()
            .then(() => {
              const updatedSettings = StorageService.getSettings();
              setSettings(updatedSettings);
              useSettingsStore.getState().setSettings(updatedSettings);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        productService
          .syncFromBackend()
          .then((syncedProducts) => {
            if (Array.isArray(syncedProducts)) {
              setProducts(syncedProducts);
            }
          })
          .catch(() => {});
        settingsService
          .syncSettingsFromBackend()
          .then(() => {
            const updatedSettings = StorageService.getSettings();
            setSettings(updatedSettings);
            useSettingsStore.getState().setSettings(updatedSettings);
          })
          .catch(() => {});
      });

    const handleSettingsUpdated = () => {
      const latest = StorageService.getSettings();
      setSettings(latest);
      useSettingsStore.getState().setSettings(latest);
    };
    const handleProductsUpdated = () => {
      setProducts(StorageService.getProducts());
    };
    const handleCustomerUnauthorized = () => {
      setCurrentUser(null);
      StorageService.setCurrentUser(null);
      useAuthStore.getState().logout();
      useUserStore.getState().reset();
      setToast({
        id: Date.now(),
        text: 'সেশনের মেয়াদ শেষ হয়েছে, অনুগ্রহ করে পুনরায় লগইন করুন।',
        type: 'error',
      });
    };
    window.addEventListener('settings-updated', handleSettingsUpdated);
    window.addEventListener('products-updated', handleProductsUpdated);
    window.addEventListener('customer-unauthorized', handleCustomerUnauthorized);

    // Re-validate customer auth session on startup
    const token = getCustomerAuthToken();
    if (token) {
      api
        .get<{ success?: boolean; user?: CustomerUser }>('/auth/me')
        .then((res) => {
          if (res.data?.success && res.data.user) {
            setCurrentUser(res.data.user);
            StorageService.setCurrentUser(res.data.user);
            useAuthStore.getState().setAuth(res.data.user, token);
          }
        })
        .catch((err: unknown) => {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 401 || status === 403) {
            setCurrentUser(null);
            StorageService.setCurrentUser(null);
            useAuthStore.getState().logout();
          }
        });
    } else {
      setCurrentUser(null);
      StorageService.setCurrentUser(null);
    }

    // Subscribe to real-time SSE stream for instant frontend updates when Admin saves anything
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/v1/orders/stream?publicStream=1');
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload?.type === 'CONNECTED') {
            // Edge Worker stream closes after snapshot; close cleanly to avoid 3s reconnect storm
            es?.close();
            return;
          }
          if (payload?.type === 'SITE_STATE_UPDATED') {
            if (Array.isArray(payload.products)) {
              StorageService.setProducts(payload.products);
              setProducts(payload.products);
            }
            if (Array.isArray(payload.categories)) {
              StorageService.setCategories(payload.categories);
            }
            if (payload.settings) {
              StorageService.setSettings(payload.settings);
              const latest = StorageService.getSettings();
              setSettings(latest);
              useSettingsStore.getState().setSettings(latest);
            }
          }
        } catch {
          // ignore parse error
        }
      };
      es.onerror = () => {
        es?.close();
      };
    } catch {
      // ignore SSE error
    }

    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdated);
      window.removeEventListener('products-updated', handleProductsUpdated);
      window.removeEventListener('customer-unauthorized', handleCustomerUnauthorized);
      es?.close();
    };
  }, []);

  const [currentPage, setCurrentPage] = useState<NavigationPage>('home');
  const [navHistory, setNavHistory] = useState<NavHistoryEntry[]>([]);
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWidthFilter, setSelectedWidthFilter] = useState<FabricWidth | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trackingQuery, setTrackingQuery] = useState<string>('');
  const [trackingPhone, setTrackingPhone] = useState<string>('');

  const [products, setProducts] = useState<Product[]>(() => {
    StorageService.initialize();
    return StorageService.getProducts();
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    StorageService.initialize();
    return StorageService.getSettings();
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    StorageService.initialize();
    return StorageService.getCart();
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    StorageService.initialize();
    return StorageService.getWishlist();
  });

  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() => {
    StorageService.initialize();
    if (!getCustomerAuthToken()) return null;
    return StorageService.getCurrentUser() || useAuthStore.getState().user;
  });

  const [lastCompletedOrder, setLastCompletedOrderState] = useState<Order | null>(() => {
    try {
      const saved = sessionStorage.getItem('fd_last_completed_order');
      return saved ? (JSON.parse(saved) as Order) : null;
    } catch {
      return null;
    }
  });
  const setLastCompletedOrder = (order: Order | null) => {
    setLastCompletedOrderState(order);
    try {
      if (order) {
        sessionStorage.setItem('fd_last_completed_order', JSON.stringify(order));
      } else {
        sessionStorage.removeItem('fd_last_completed_order');
      }
    } catch {
      // ignore storage errors
    }
  };
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponState | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  // Sync to localStorage & Zustand stores
  useEffect(() => {
    StorageService.setCart(cart);
    useCartStore.getState().setItems(cart);
  }, [cart]);

  useEffect(() => {
    StorageService.setWishlist(wishlist);
  }, [wishlist]);

  useEffect(() => {
    StorageService.setCurrentUser(currentUser);
    if (currentUser) {
      useAuthStore.getState().setAuth(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    useSettingsStore.getState().setSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (currentPage === 'product-details' && selectedProductId) {
      useRecentlyViewedStore.getState().addViewed(selectedProductId);
    }
  }, [currentPage, selectedProductId]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ id: Date.now(), text, type });
  };

  const refreshData = () => {
    setProducts(StorageService.getProducts());
    const latestSettings = StorageService.getSettings();
    setSettings(latestSettings);
    useSettingsStore.getState().setSettings(latestSettings);
    setCart(StorageService.getCart());
    setWishlist(StorageService.getWishlist());
    setCurrentUser(StorageService.getCurrentUser());
  };

  const getUrlForNavigation = (page: NavigationPage, params?: NavigationParams): string => {
    switch (page) {
      case 'home':
        return '/';
      case 'fabric-width':
        return `/fabric/${params?.width || selectedWidthFilter || '3.5'}-bahar`;
      case 'category-gallery': {
        const w = params?.width || selectedWidthFilter || '3.5';
        const c = params?.category || selectedCategory || 'kamiz';
        return `/fabric/${w}-bahar/${c}`;
      }
      case 'product-details': {
        const key = params?.productId || selectedProductId || '';
        const matched = products.find((p) => p.id === key || p.slug === key);
        return `/product/${encodeURIComponent(matched?.slug || key)}`;
      }
      case 'shop':
        return '/shop';
      case 'shop-2-5':
        return '/fabric/2.5-bahar';
      case 'shop-3-5':
        return '/fabric/3.5-bahar';
      case 'cart':
        return '/cart';
      case 'checkout':
        return '/checkout';
      case 'calculator':
        return '/calculator';
      case 'custom-design':
        return '/custom-design';
      case 'fabric-to-outfit':
        return '/fabric-to-outfit';
      case 'order-tracking':
        return '/order-tracking';
      case 'order-confirmation':
        return '/order-confirmation';
      case 'wishlist':
        return '/wishlist';
      case 'account':
        return '/account';
      case 'admin':
        return '/admin';
      case 'sysadm':
        return '/sysadm';
      case 'about':
        return '/about';
      case 'contact':
        return '/contact';
      case 'faq':
        return '/faq';
      case 'measurement-guide':
        return '/measurement-guide';
      default:
        return `/${page}`;
    }
  };

  const parseUrlToState = useCallback((pathname: string) => {
    const cleanPath = pathname.replace(/\/+$/, '') || '/';

    const catMatch = cleanPath.match(/^\/fabric\/(2\.5|3\.5)-bahar\/([a-zA-Z0-9_-]+)/);
    if (catMatch) {
      const width = catMatch[1] as FabricWidth;
      const cat = catMatch[2];
      setCurrentPage('category-gallery');
      setSelectedWidthFilter(width);
      setSelectedCategory(cat);
      return;
    }

    const widthMatch = cleanPath.match(/^\/fabric\/(2\.5|3\.5)-bahar/);
    if (widthMatch) {
      const width = widthMatch[1] as FabricWidth;
      setCurrentPage('fabric-width');
      setSelectedWidthFilter(width);
      return;
    }

    const categorySlugMatch = cleanPath.match(/^\/category\/([^/?#]+)/);
    if (categorySlugMatch) {
      let slug = categorySlugMatch[1];
      try {
        slug = decodeURIComponent(slug);
      } catch {
        // keep raw slug if malformed URI component
      }
      const allCategories = StorageService.getCategories();
      const matched = allCategories.find(
        (c) =>
          c.id === slug ||
          c.slug.toLowerCase() === slug.toLowerCase() ||
          c.name === slug ||
          c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug.toLowerCase()
      );
      setCurrentPage('category-gallery');
      setSelectedCategory(matched?.slug || matched?.id || slug);
      if (matched?.fabricWidth) {
        setSelectedWidthFilter(matched.fabricWidth);
      }
      return;
    }

    const prodMatch = cleanPath.match(/^\/product\/([^/?#]+)/);
    if (prodMatch) {
      let decoded = prodMatch[1];
      try {
        decoded = decodeURIComponent(decoded);
      } catch {
        // keep raw if malformed URI component
      }
      const matched = StorageService.getProducts().find(
        (p) => p.id === decoded || p.slug === decoded
      );
      setCurrentPage('product-details');
      setSelectedProductId(matched?.id || decoded);
      return;
    }

    if (cleanPath === '/cart') {
      setCurrentPage('cart');
    } else if (cleanPath === '/checkout') {
      setCurrentPage('checkout');
    } else if (cleanPath === '/calculator') {
      setCurrentPage('calculator');
    } else if (cleanPath === '/custom-design') {
      setCurrentPage('custom-design');
    } else if (cleanPath === '/fabric-to-outfit') {
      setCurrentPage('fabric-to-outfit');
    } else if (cleanPath === '/order-confirmation') {
      setCurrentPage('order-confirmation');
    } else if (cleanPath === '/order-tracking') {
      setCurrentPage('order-tracking');
    } else if (cleanPath === '/admin' || cleanPath.startsWith('/admin/')) {
      setCurrentPage('admin');
    // Disconnected: sysadm route handling preserved without deletion
    // } else if (cleanPath === '/sysadm' || cleanPath.startsWith('/sysadm/')) {
    //   setCurrentPage('sysadm');
    } else if (cleanPath === '/wishlist') {
      setCurrentPage('wishlist');
    } else if (
      cleanPath === '/account' ||
      cleanPath.startsWith('/account/') ||
      cleanPath === '/login' ||
      cleanPath === '/register' ||
      cleanPath === '/forgot-password' ||
      cleanPath === '/reset-password'
    ) {
      setCurrentPage('account');
    } else if (cleanPath === '/shop') {
      setCurrentPage('shop');
    } else if (cleanPath === '/about') {
      setCurrentPage('about');
    } else if (cleanPath === '/contact') {
      setCurrentPage('contact');
    } else if (cleanPath === '/faq') {
      setCurrentPage('faq');
    } else if (cleanPath === '/measurement-guide') {
      setCurrentPage('measurement-guide');
    } else if (cleanPath === '/delivery-policy') {
      setCurrentPage('delivery-policy');
    } else if (cleanPath === '/return-policy') {
      setCurrentPage('return-policy');
    } else if (cleanPath === '/privacy-policy') {
      setCurrentPage('privacy-policy');
    } else if (cleanPath === '/terms') {
      setCurrentPage('terms');
    } else if (cleanPath === '/') {
      setCurrentPage('home');
    }
  }, []);

  // Sync StoreContext page state whenever React Router location changes
  useEffect(() => {
    parseUrlToState(location.pathname);
  }, [location.pathname, parseUrlToState]);

  const navigateTo = (page: NavigationPage, params?: NavigationParams) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const nextProductId = params?.productId !== undefined ? params.productId : selectedProductId;
    const nextCategory = params?.category !== undefined ? params.category : selectedCategory;
    const nextWidth = params?.width !== undefined ? params.width : selectedWidthFilter;

    if (
      page !== currentPage ||
      nextProductId !== selectedProductId ||
      nextCategory !== selectedCategory ||
      nextWidth !== selectedWidthFilter
    ) {
      setNavHistory((prev) => [
        ...prev.slice(-24),
        {
          page: currentPage,
          productId: selectedProductId,
          category: selectedCategory,
          width: selectedWidthFilter,
          search: searchQuery,
          orderNumber: trackingQuery,
        },
      ]);
    }

    setCurrentPage(page);

    if (params?.productId) {
      setSelectedProductId(params.productId);
    }
    if (params?.category !== undefined) {
      setSelectedCategory(params.category);
    }
    if (params?.width) {
      setSelectedWidthFilter(params.width);
    }
    if (params?.search !== undefined) {
      setSearchQuery(params.search);
    }
    if (params?.orderNumber !== undefined) {
      setTrackingQuery(params.orderNumber);
    }
    if (params?.trackingPhone !== undefined) {
      setTrackingPhone(params.trackingPhone);
    }

    const targetUrl = getUrlForNavigation(page, params);
    if (location.pathname !== targetUrl) {
      navigate(targetUrl);
    }
  };

  const goBack = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (navHistory.length > 0) {
      const prevEntry = navHistory[navHistory.length - 1];
      setNavHistory((prev) => prev.slice(0, -1));
      setCurrentPage(prevEntry.page);
      setSelectedProductId(prevEntry.productId);
      setSelectedCategory(prevEntry.category);
      setSelectedWidthFilter(prevEntry.width);
      setSearchQuery(prevEntry.search);
      setTrackingQuery(prevEntry.orderNumber);

      const targetUrl = getUrlForNavigation(prevEntry.page, {
        productId: prevEntry.productId || undefined,
        category: prevEntry.category || undefined,
        width: prevEntry.width,
        search: prevEntry.search,
        orderNumber: prevEntry.orderNumber,
      });
      if (location.pathname !== targetUrl) {
        navigate(targetUrl);
      }
      return;
    }

    // Smart fallback if user landed directly on a subpage without history
    if (currentPage === 'product-details') {
      navigateTo('category-gallery', {
        width: selectedWidthFilter === 'all' ? '3.5' : selectedWidthFilter,
        category: selectedCategory || 'kamiz',
      });
    } else if (currentPage === 'category-gallery') {
      navigateTo('fabric-width', {
        width: selectedWidthFilter === 'all' ? '3.5' : selectedWidthFilter,
      });
    } else if (currentPage === 'checkout') {
      if (buyNowItem) {
        clearBuyNow();
        navigateTo('shop');
      } else {
        navigateTo('cart');
      }
    } else {
      navigateTo('home');
    }
  };

  const getAddonTotals = (selectedAddons?: CartItem['selectedAddons']) => {
    let addonYards = 0;
    let addonPrice = 0;
    let setBoltYards = 0;
    if (Array.isArray(selectedAddons)) {
      for (const addon of selectedAddons) {
        const y = Number((Number(addon.count || 0) * Number(addon.yardsPerUnit || 0)).toFixed(2));
        addonYards = Number((addonYards + y).toFixed(2));
        addonPrice += Number(addon.totalAddonPrice || 0);
        if (addon.addonId === 'orna' || !addon.fabricId || String(addon.fabricId).startsWith('set-')) {
          setBoltYards = Number((setBoltYards + y).toFixed(2));
        }
      }
    }
    return { addonYards, addonPrice, setBoltYards };
  };

  const computeLineBreakdown = (
    product: Product,
    totalYards: number,
    cfg: ReturnType<typeof measurementService.getProductCustomMeasurementConfig>,
    selectedAddons?: CartItem['selectedAddons']
  ) => {
    const { addonYards, addonPrice, setBoltYards } = getAddonTotals(selectedAddons);
    const mainYards =
      addonYards > 0 && totalYards > addonYards + 0.01
        ? Number((totalYards - addonYards).toFixed(2))
        : Number(totalYards.toFixed(2));
    const calc = measurementService.calculateCustomFabricPrice(product, mainYards, cfg);
    return {
      mainYards,
      boltYards: Number((mainYards + setBoltYards).toFixed(2)),
      addonYards,
      addonPrice,
      calc,
      finalProductPrice: Math.round(calc.totalPrice + addonPrice),
    };
  };

  const addToCart = (
    product: Product,
    yards: number,
    selectedColor?: string,
    notify: boolean = true,
    customization?: ProductCustomizationPayload
  ) => {
    if (product.stockYards <= 0) {
      showToast(`দুঃখিত, "${product.name}" বর্তমানে স্টক শেষ!`, 'error');
      return;
    }

    const color = selectedColor || product.color;
    const effectivePrice = product.discountPrice || product.pricePerYard;
    const cfg = measurementService.getProductCustomMeasurementConfig(product);
    const standardGaj = customization?.standardGaj ?? cfg.standardGaj;
    const cleanYards = Number(Math.max(product.minOrderQuantity || 0.5, yards).toFixed(2));
    const isCustom = !!customization?.isCustomized;
    const outfitKey = customization?.outfitId ? `-outfit-${customization.outfitId}` : '';
    const measSummary = measurementService.formatMeasurementsSummary(customization?.measurements);
    const addonKey = customization?.selectedAddons?.length
      ? `-addons-${customization.selectedAddons.map((a) => `${a.addonId}:${a.count}:${a.fabricId}`).join('|')}`
      : '';
    const cartItemId = isCustom || addonKey
      ? `${product.id}-${product.fabricWidth}-${color}${outfitKey}${addonKey}-custom-${measSummary}-${customization?.customizationNotes || ''}`
      : `${product.id}-${product.fabricWidth}-${color}${outfitKey}`;

    const initialCalc = computeLineBreakdown(product, cleanYards, cfg, customization?.selectedAddons);

    // Check cumulative bolt stock across cart lines for this product
    const existingOtherBoltYards = cart
      .filter((i) => i.productId === product.id)
      .reduce((sum, i) => sum + computeLineBreakdown(product, i.yards, cfg, i.selectedAddons).boltYards, 0);
    if (existingOtherBoltYards + initialCalc.boltYards > product.stockYards + 0.001) {
      showToast(
        `দুঃখিত, "${product.name}"-এর সর্বোচ্চ ${product.stockYards} গজ স্টকে আছে!`,
        'error'
      );
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        const nextYards = Number((existing.yards + cleanYards).toFixed(2));
        const nextLine = computeLineBreakdown(product, nextYards, cfg, existing.selectedAddons);
        return prev.map((item) =>
          item.id === cartItemId
            ? {
                ...item,
                yards: nextYards,
                customGaj: nextYards,
                additionalGaj: nextLine.calc.additionalGaj,
                finalProductPrice: nextLine.finalProductPrice
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          productName: product.name,
          product,
          selectedWidth: product.fabricWidth,
          selectedColor: color,
          yards: cleanYards,
          pricePerYard: effectivePrice,
          isCustomized: isCustom,
          sizeMode: customization?.sizeMode || 'standard',
          standardGaj,
          customGaj: cleanYards,
          additionalGaj: customization?.additionalGaj ?? initialCalc.calc.additionalGaj,
          customMeasurements: customization?.measurements,
          customizationNotes: customization?.customizationNotes,
          additionalPricePerYard: customization?.additionalPricePerYard ?? initialCalc.calc.additionalPricePerYard,
          finalProductPrice: customization?.finalProductPrice ?? initialCalc.finalProductPrice,
          outfitCategory: customization?.outfitCategory,
          outfitId: customization?.outfitId,
          outfitImage: customization?.outfitImage,
          specialInstructions: customization?.specialInstructions || customization?.customizationNotes,
          selectedAddons: customization?.selectedAddons
        }
      ];
    });

    if (notify) {
      const outfitLabel = customization?.outfitCategory ? ` (${customization.outfitCategory})` : '';
      showToast(
        isCustom
          ? `${product.name}${outfitLabel} (নিজের মাপে · ${cleanYards} গজ) কার্টে যোগ করা হয়েছে!`
          : `${product.name}${outfitLabel} (${cleanYards} গজ) কার্টে যোগ করা হয়েছে!`,
        'success'
      );
    }
  };

  const updateCartQuantity = (itemId: string, newYards: number) => {
    const targetItem = cart.find((i) => i.id === itemId);
    if (!targetItem) return;
    const { addonYards } = getAddonTotals(targetItem.selectedAddons);
    const minTotal = Number(((targetItem.product.minOrderQuantity || 0.5) + addonYards).toFixed(2));
    if (newYards <= addonYards + 0.01) {
      removeFromCart(itemId);
      return;
    }
    const boundedYards = Math.max(minTotal, Number(newYards.toFixed(2)));
    const cfg = measurementService.getProductCustomMeasurementConfig(targetItem.product);
    const nextLine = computeLineBreakdown(targetItem.product, boundedYards, cfg, targetItem.selectedAddons);
    const otherBoltYards = cart
      .filter((i) => i.id !== itemId && i.productId === targetItem.productId)
      .reduce((sum, i) => sum + computeLineBreakdown(i.product, i.yards, cfg, i.selectedAddons).boltYards, 0);
    if (otherBoltYards + nextLine.boltYards > targetItem.product.stockYards + 0.001) {
      showToast(
        `দুঃখিত, "${targetItem.product.name}"-এর সর্বোচ্চ ${targetItem.product.stockYards} গজ স্টকে আছে!`,
        'error'
      );
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          yards: boundedYards,
          customGaj: boundedYards,
          additionalGaj: nextLine.calc.additionalGaj,
          finalProductPrice: nextLine.finalProductPrice
        };
      })
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
    showToast('পণ্যটি কার্ট থেকে সরানো হয়েছে', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('উইশলিস্ট থেকে সরানো হয়েছে', 'info');
        return prev.filter(id => id !== productId);
      } else {
        showToast('উইশলিস্টে যোগ করা হয়েছে!', 'success');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string): boolean => {
    return wishlist.includes(productId);
  };

  const buyNow = (
    product: Product,
    yards: number,
    selectedColor?: string,
    customization?: ProductCustomizationPayload
  ) => {
    if (product.stockYards <= 0) {
      showToast(`দুঃখিত, "${product.name}" বর্তমানে স্টক শেষ!`, 'error');
      return;
    }
    const color = selectedColor || product.color;
    const effectivePrice = product.discountPrice || product.pricePerYard;
    const cfg = measurementService.getProductCustomMeasurementConfig(product);
    const cleanYards = Number(Math.max(product.minOrderQuantity || 0.5, yards).toFixed(2));
    const lineCalc = computeLineBreakdown(product, cleanYards, cfg, customization?.selectedAddons);
    if (lineCalc.boltYards > product.stockYards + 0.001) {
      showToast(
        `দুঃখিত, "${product.name}"-এর সর্বোচ্চ ${product.stockYards} গজ স্টকে আছে!`,
        'error'
      );
      return;
    }
    const buyItem: CartItem = {
      id: `buynow-${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      product,
      selectedWidth: product.fabricWidth,
      selectedColor: color,
      yards: cleanYards,
      pricePerYard: effectivePrice,
      isCustomized: !!customization?.isCustomized,
      sizeMode: customization?.sizeMode || 'standard',
      standardGaj: customization?.standardGaj ?? cfg.standardGaj,
      customGaj: cleanYards,
      additionalGaj: customization?.additionalGaj ?? lineCalc.calc.additionalGaj,
      customMeasurements: customization?.measurements,
      customizationNotes: customization?.customizationNotes,
      additionalPricePerYard: customization?.additionalPricePerYard ?? lineCalc.calc.additionalPricePerYard,
      finalProductPrice: customization?.finalProductPrice ?? lineCalc.finalProductPrice,
      outfitCategory: customization?.outfitCategory,
      outfitId: customization?.outfitId,
      outfitImage: customization?.outfitImage,
      specialInstructions: customization?.specialInstructions || customization?.customizationNotes,
      selectedAddons: customization?.selectedAddons
    };

    setAppliedCoupon(null);
    setBuyNowItem(buyItem);
    navigateTo('checkout');
  };

  const clearBuyNow = () => {
    setBuyNowItem(null);
  };

  const openQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  const loginUser = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const r = await api.post('/auth/login', {
        identifier,
        phone: identifier,
        email: identifier,
        password,
      });
      if (r.data?.success && r.data.user && r.data.token) {
        useAuthStore.getState().setAuth(r.data.user, r.data.token);
        setCurrentUser(r.data.user);
        StorageService.setCurrentUser(r.data.user);
        const msg = r.data.message || `স্বাগতম, ${r.data.user.fullName}!`;
        showToast(msg, 'success');
        return { success: true, message: msg };
      }
      const msg = r.data?.message || 'মোবাইল নম্বর/ইমেইল বা পাসওয়ার্ড সঠিক নয়।';
      showToast(msg, 'error');
      return { success: false, message: msg };
    } catch (err: unknown) {
      const errObj = err as { response?: { status?: number; data?: { message?: string } } };
      const msg = errObj?.response
        ? errObj.response.data?.message || 'মোবাইল নম্বর/ইমেইল বা পাসওয়ার্ড সঠিক নয়।'
        : 'সার্ভারে সংযোগ করা যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const registerUser = async (
    fullName: string,
    emailOrPhone: string,
    password: string,
    optionalPhoneOrEmail?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const isFirstArgEmail = emailOrPhone.includes('@');
      const email = isFirstArgEmail
        ? emailOrPhone.trim().toLowerCase()
        : (optionalPhoneOrEmail?.trim().toLowerCase() || '');
      const rawPhone = isFirstArgEmail ? (optionalPhoneOrEmail || '') : emailOrPhone;
      const phone = rawPhone ? StorageService.normalizePhone(rawPhone) : '';

      const r = await api.post('/auth/register', {
        fullName: fullName.trim(),
        email: email || undefined,
        ...(phone ? { phone } : {}),
        password,
      });
      if (r.data?.success && r.data.user && r.data.token) {
        useAuthStore.getState().setAuth(r.data.user, r.data.token);
        setCurrentUser(r.data.user);
        StorageService.setCurrentUser(r.data.user);
        const msg = r.data.message || `রেজিস্ট্রেশন সফল হয়েছে! স্বাগতম, ${r.data.user.fullName}!`;
        showToast(msg, 'success');
        return { success: true, message: msg };
      }
      const msg = r.data?.message || 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি।';
      showToast(msg, 'error');
      return { success: false, message: msg };
    } catch (err: unknown) {
      const errObj = err as { response?: { status?: number; data?: { message?: string } } };
      const msg = errObj?.response
        ? errObj.response.data?.message || 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি।'
        : 'সার্ভারে সংযোগ করা যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const applyCoupon = (code: string, subtotalOverride?: number): boolean => {
    const targetSubtotal = subtotalOverride !== undefined ? subtotalOverride : cartSubtotal;
    if (!code.trim()) return false;
    const res = settingsService.validateCoupon(code, targetSubtotal);
    if (res.isValid) {
      setAppliedCoupon({
        code: res.coupon?.code || code.trim().toUpperCase(),
        discount: res.discountAmount,
        msg: res.message,
      });
      showToast(res.message, 'success');
      return true;
    }
    showToast(res.message, 'error');
    return false;
  };

  const clearCoupon = (silent: boolean = false) => {
    setAppliedCoupon(null);
    if (!silent) {
      showToast('কুপন ডিসকাউন্ট সরানো হয়েছে', 'info');
    }
  };

  const requestPasswordResetOtp = async (
    identifier: string
  ): Promise<{ success: boolean; devOtp?: string; message?: string }> => {
    try {
      const r = await api.post('/auth/forgot-password', { identifier });
      if (r.data?.success) {
        const msg = r.data.message || 'ভেরিফিকেশন কোড (OTP) পাঠানো হয়েছে।';
        showToast(msg, 'success');
        return { success: true, devOtp: r.data.devOtp, message: msg };
      }
      const errMsg = r.data?.message || 'OTP পাঠানো যায়নি';
      showToast(errMsg, 'error');
      return { success: false, message: errMsg };
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'সার্ভারে সংযোগ করা যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const resetPassword = async (
    identifier: string,
    newPassword: string,
    otp?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const r = await api.post('/auth/reset-password', {
        identifier,
        phone: identifier,
        email: identifier,
        code: otp,
        otp,
        newPassword,
      });
      if (r.data?.success) {
        const msg = r.data.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!';
        showToast(msg, 'success');
        return { success: true, message: msg };
      }
      const msg = r.data?.message || 'পাসওয়ার্ড রিসেট করা যায়নি।';
      showToast(msg, 'error');
      return { success: false, message: msg };
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } };
      const msg = errObj?.response
        ? errObj.response.data?.message || 'পাসওয়ার্ড রিসেট করা যায়নি।'
        : 'সার্ভারে সংযোগ করা যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const changeUserPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const r = await api.post('/auth/change-password', { currentPassword, newPassword });
      if (r.data?.success) {
        if (r.data?.token) {
          useAuthStore.getState().setAuth(currentUser, r.data.token);
        }
        const msg = r.data.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!';
        showToast(msg, 'success');
        return { success: true, message: msg };
      }
      const msg = r.data?.message || 'পাসওয়ার্ড পরিবর্তন করা যায়নি।';
      showToast(msg, 'error');
      return { success: false, message: msg };
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'পাসওয়ার্ড পরিবর্তন করা যায়নি। অনুগ্রহ করে পুনরায় লগইন করে চেষ্টা করুন।';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const logoutUser = () => {
    api.post('/auth/logout').catch(() => {});
    setCurrentUser(null);
    StorageService.setCurrentUser(null);
    useAuthStore.getState().logout();
    useUserStore.getState().reset();
    apiCache.invalidatePrefix();
    setLastCompletedOrderState(null);
    try {
      sessionStorage.removeItem('fd_last_completed_order');
      localStorage.removeItem('fashion_doniya_orders');
      localStorage.removeItem('fashion_doniya_order_tracking_history');
      localStorage.removeItem('fashion_doniya_courier_information');
    } catch {
      // ignore storage errors
    }
    showToast('লগআউট সম্পন্ন হয়েছে', 'info');
  };

  const updateUserProfile = (profile: Partial<CustomerUser>) => {
    if (!currentUser) return;
    const mergedAddress = profile.address
      ? {
          district: profile.address.district ?? currentUser.address?.district ?? currentUser.district ?? '',
          upazila: profile.address.upazila ?? currentUser.address?.upazila ?? currentUser.upazila ?? '',
          area: profile.address.area ?? currentUser.address?.area ?? '',
          fullAddress:
            profile.address.fullAddress ??
            currentUser.address?.fullAddress ??
            currentUser.fullAddress ??
            '',
        }
      : currentUser.address;

    const updated: CustomerUser = {
      ...currentUser,
      ...profile,
      ...(mergedAddress ? { address: mergedAddress } : {}),
      district: profile.district ?? mergedAddress?.district ?? currentUser.district,
      upazila: profile.upazila ?? mergedAddress?.upazila ?? currentUser.upazila,
      fullAddress: profile.fullAddress ?? mergedAddress?.fullAddress ?? currentUser.fullAddress,
    };

    const previousUser = currentUser;
    setCurrentUser(updated);
    StorageService.setCurrentUser(updated);

    api
      .post<{ success?: boolean; customer?: CustomerUser; message?: string }>('/customers/sync', {
        user: updated,
      })
      .then((res) => {
        if (res.data?.success && res.data.customer) {
          const syncedUser: CustomerUser = {
            ...updated,
            ...res.data.customer,
            address: res.data.customer.address || updated.address,
          };
          setCurrentUser(syncedUser);
          StorageService.setCurrentUser(syncedUser);
        }
        showToast('প্রোফাইল তথ্য আপডেট করা হয়েছে', 'success');
      })
      .catch((err: unknown) => {
        setCurrentUser(previousUser);
        StorageService.setCurrentUser(previousUser);
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'সার্ভারে সংযোগ করা যায়নি। প্রোফাইল তথ্য সংরক্ষণ করা যায়নি।';
        showToast(msg, 'error');
      });
  };

  // Cart calculations
  const cartItemCount = cart.length;
  const cartTotalYards = cart.reduce((sum, item) => sum + item.yards, 0);
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + (item.finalProductPrice ?? Math.round(item.pricePerYard * item.yards)),
    0
  );

  useEffect(() => {
    if (appliedCoupon && !buyNowItem) {
      if (cart.length === 0) {
        setAppliedCoupon(null);
        return;
      }
      const res = settingsService.validateCoupon(appliedCoupon.code, cartSubtotal);
      if (!res.isValid) {
        setAppliedCoupon(null);
        showToast(`সাবটোটাল পরিবর্তন হওয়ায় কুপন "${appliedCoupon.code}" বাতিল করা হয়েছে।`, 'info');
      } else if (res.discountAmount !== appliedCoupon.discount) {
        setAppliedCoupon({
          code: appliedCoupon.code,
          discount: res.discountAmount,
          msg: res.message,
        });
      }
    }
  }, [cartSubtotal, cart.length, appliedCoupon?.code, appliedCoupon?.discount, buyNowItem]);

  return (
    <StoreContext.Provider value={{
      currentPage,
      adminTab,
      selectedProductId,
      selectedCategory,
      selectedWidthFilter,
      searchQuery,
      trackingQuery,
      trackingPhone,
      products,
      settings,
      cart,
      appliedCoupon,
      wishlist,
      currentUser,
      lastCompletedOrder,
      quickViewProduct,
      buyNowItem,
      toast,
      navigateTo,
      goBack,
      setAdminTab,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isInWishlist,
      buyNow,
      clearBuyNow,
      setLastCompletedOrder,
      showToast,
      openQuickView,
      closeQuickView,
      loginUser,
      registerUser,
      requestPasswordResetOtp,
      resetPassword,
      changeUserPassword,
      applyCoupon,
      clearCoupon,
      logoutUser,
      updateUserProfile,
      refreshData,
      cartTotalYards,
      cartSubtotal,
      cartItemCount
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
