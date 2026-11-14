import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  loginDemoUser: (phone: string, fullName: string) => void;
  loginUser: (phone: string, password: string) => boolean;
  registerUser: (fullName: string, phone: string, password: string) => boolean;
  resetPassword: (phone: string, newPassword: string) => boolean;
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
  // Initialize storage & sync orders, products, categories, settings, and measurements with backend database
  useEffect(() => {
    StorageService.initialize();
    orderService.syncWithBackend().catch(() => {});
    categoryService.syncFromBackend().catch(() => {});
    measurementService.syncFromBackend().catch(() => {});

    fetch('/api/bootstrap')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          if (Array.isArray(data.products) && data.products.length > 0) {
            StorageService.setProducts(data.products);
            setProducts(data.products);
          }
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            StorageService.setCategories(data.categories);
          }
          if (data.settings) {
            StorageService.setSettings(data.settings);
            setSettings(StorageService.getSettings());
          }
        }
      })
      .catch(() => {
        productService
          .syncFromBackend()
          .then((syncedProducts) => {
            if (Array.isArray(syncedProducts) && syncedProducts.length > 0) {
              setProducts(syncedProducts);
            }
          })
          .catch(() => {});
        settingsService
          .syncSettingsFromBackend()
          .then(() => {
            setSettings(StorageService.getSettings());
          })
          .catch(() => {});
      });

    // Subscribe to real-time SSE stream for instant frontend updates when Admin saves anything
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/orders/stream?publicStream=1');
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
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
              setSettings(StorageService.getSettings());
            }
          }
        } catch {
          // ignore parse error
        }
      };
    } catch {
      // ignore SSE error
    }

    return () => {
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
    return StorageService.getCurrentUser();
  });

  const [lastCompletedOrder, setLastCompletedOrder] = useState<Order | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  // Sync to localStorage
  useEffect(() => {
    StorageService.setCart(cart);
  }, [cart]);

  useEffect(() => {
    StorageService.setWishlist(wishlist);
  }, [wishlist]);

  useEffect(() => {
    StorageService.setCurrentUser(currentUser);
  }, [currentUser]);

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
    setSettings(StorageService.getSettings());
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
      case 'product-details':
        return `/product/${params?.productId || selectedProductId || ''}`;
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

  const parseUrlToState = (pathname: string) => {
    const catMatch = pathname.match(/^\/fabric\/(2\.5|3\.5)-bahar\/([a-z0-9-]+)/);
    if (catMatch) {
      const width = catMatch[1] as FabricWidth;
      const cat = catMatch[2];
      setCurrentPage('category-gallery');
      setSelectedWidthFilter(width);
      setSelectedCategory(cat);
      return;
    }

    const widthMatch = pathname.match(/^\/fabric\/(2\.5|3\.5)-bahar/);
    if (widthMatch) {
      const width = widthMatch[1] as FabricWidth;
      setCurrentPage('fabric-width');
      setSelectedWidthFilter(width);
      return;
    }

    const prodMatch = pathname.match(/^\/product\/([a-zA-Z0-9_-]+)/);
    if (prodMatch) {
      setCurrentPage('product-details');
      setSelectedProductId(prodMatch[1]);
      return;
    }

    if (pathname === '/cart') {
      setCurrentPage('cart');
    } else if (pathname === '/checkout') {
      setCurrentPage('checkout');
    } else if (pathname === '/calculator') {
      setCurrentPage('calculator');
    } else if (pathname === '/custom-design') {
      setCurrentPage('custom-design');
    } else if (pathname === '/order-tracking') {
      setCurrentPage('order-tracking');
    } else if (pathname === '/admin') {
      setCurrentPage('admin');
    } else if (pathname === '/wishlist') {
      setCurrentPage('wishlist');
    } else if (pathname === '/account') {
      setCurrentPage('account');
    } else if (pathname === '/shop') {
      setCurrentPage('shop');
    } else if (pathname === '/about') {
      setCurrentPage('about');
    } else if (pathname === '/contact') {
      setCurrentPage('contact');
    } else if (pathname === '/faq') {
      setCurrentPage('faq');
    } else if (pathname === '/' || pathname === '') {
      setCurrentPage('home');
    }
  };

  // Initial URL parsing and popstate listener
  useEffect(() => {
    parseUrlToState(window.location.pathname);

    const handlePopState = () => {
      parseUrlToState(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

    try {
      const targetUrl = getUrlForNavigation(page, params);
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({ page, params }, '', targetUrl);
      }
    } catch {
      // Safe fallback if history API is restricted in iframe
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

      try {
        const targetUrl = getUrlForNavigation(prevEntry.page, {
          productId: prevEntry.productId || undefined,
          category: prevEntry.category || undefined,
          width: prevEntry.width,
          search: prevEntry.search,
          orderNumber: prevEntry.orderNumber,
        });
        if (window.location.pathname !== targetUrl) {
          window.history.pushState({ page: prevEntry.page }, '', targetUrl);
        }
      } catch {
        // Safe fallback
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

  const addToCart = (
    product: Product,
    yards: number,
    selectedColor?: string,
    notify: boolean = true,
    customization?: ProductCustomizationPayload
  ) => {
    const color = selectedColor || product.color;
    const effectivePrice = product.discountPrice || product.pricePerYard;
    const cfg = measurementService.getProductCustomMeasurementConfig(product);
    const standardGaj = customization?.standardGaj ?? cfg.standardGaj;
    const cleanYards = Number(yards.toFixed(2));
    const isCustom = !!customization?.isCustomized;
    const outfitKey = customization?.outfitId ? `-outfit-${customization.outfitId}` : '';
    const measSummary = measurementService.formatMeasurementsSummary(customization?.measurements);
    const cartItemId = isCustom
      ? `${product.id}-${product.fabricWidth}-${color}${outfitKey}-custom-${measSummary}-${customization?.customizationNotes || ''}`
      : `${product.id}-${product.fabricWidth}-${color}${outfitKey}`;

    const calc = measurementService.calculateCustomFabricPrice(product, cleanYards, cfg);

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        const nextYards = Number((existing.yards + cleanYards).toFixed(2));
        const nextCalc = measurementService.calculateCustomFabricPrice(product, nextYards, cfg);
        return prev.map((item) =>
          item.id === cartItemId
            ? {
                ...item,
                yards: nextYards,
                customGaj: nextYards,
                additionalGaj: nextCalc.additionalGaj,
                finalProductPrice: nextCalc.totalPrice
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
          additionalGaj: customization?.additionalGaj ?? calc.additionalGaj,
          customMeasurements: customization?.measurements,
          customizationNotes: customization?.customizationNotes,
          additionalPricePerYard: customization?.additionalPricePerYard ?? calc.additionalPricePerYard,
          finalProductPrice: customization?.finalProductPrice ?? calc.totalPrice,
          outfitCategory: customization?.outfitCategory,
          outfitId: customization?.outfitId,
          outfitImage: customization?.outfitImage,
          specialInstructions: customization?.specialInstructions || customization?.customizationNotes
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
    if (newYards <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const cleanYards = Number(newYards.toFixed(2));
        const calc = measurementService.calculateCustomFabricPrice(item.product, cleanYards);
        return {
          ...item,
          yards: cleanYards,
          customGaj: cleanYards,
          additionalGaj: calc.additionalGaj,
          finalProductPrice: calc.totalPrice
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
    const color = selectedColor || product.color;
    const effectivePrice = product.discountPrice || product.pricePerYard;
    const cfg = measurementService.getProductCustomMeasurementConfig(product);
    const cleanYards = Number(yards.toFixed(2));
    const calc = measurementService.calculateCustomFabricPrice(product, cleanYards, cfg);
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
      additionalGaj: customization?.additionalGaj ?? calc.additionalGaj,
      customMeasurements: customization?.measurements,
      customizationNotes: customization?.customizationNotes,
      additionalPricePerYard: customization?.additionalPricePerYard ?? calc.additionalPricePerYard,
      finalProductPrice: customization?.finalProductPrice ?? calc.totalPrice,
      outfitCategory: customization?.outfitCategory,
      outfitId: customization?.outfitId,
      outfitImage: customization?.outfitImage,
      specialInstructions: customization?.specialInstructions || customization?.customizationNotes
    };

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

  const loginDemoUser = (phone: string, fullName: string) => {
    const user: CustomerUser = {
      id: `usr-${Date.now()}`,
      fullName,
      phone,
      email: `${phone}@example.com`,
      createdAt: new Date().toISOString()
    };
    setCurrentUser(user);
    showToast(`স্বাগতম, ${fullName}! লগইন সম্পন্ন হয়েছে।`, 'success');
  };

  const loginUser = (phone: string, password: string): boolean => {
    const res = StorageService.authenticateUser(phone, password);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      showToast(res.message, 'success');
      return true;
    }
    showToast(res.message, 'error');
    return false;
  };

  const registerUser = (fullName: string, phone: string, password: string): boolean => {
    const res = StorageService.registerUser(fullName, phone, password);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      showToast(res.message, 'success');
      return true;
    }
    showToast(res.message, 'error');
    return false;
  };

  const resetPassword = (phone: string, newPassword: string): boolean => {
    const res = StorageService.resetUserPassword(phone, newPassword);
    if (res.success) {
      showToast(res.message, 'success');
      return true;
    }
    showToast(res.message, 'error');
    return false;
  };

  const logoutUser = () => {
    setCurrentUser(null);
    showToast('লগআউট সম্পন্ন হয়েছে', 'info');
  };

  const updateUserProfile = (profile: Partial<CustomerUser>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...profile };
    setCurrentUser(updated);
    const saved = StorageService.getSavedUsers();
    const idx = saved.findIndex(
      (u) => StorageService.normalizePhone(u.phone) === StorageService.normalizePhone(updated.phone)
    );
    if (idx >= 0) {
      saved[idx] = { ...saved[idx], ...profile };
      StorageService.setSavedUsers([...saved]);
    }
    showToast('প্রোফাইল তথ্য আপডেট করা হয়েছে', 'success');
  };

  // Cart calculations
  const cartItemCount = cart.length;
  const cartTotalYards = cart.reduce((sum, item) => sum + item.yards, 0);
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + (item.finalProductPrice ?? Math.round(item.pricePerYard * item.yards)),
    0
  );

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
      loginDemoUser,
      loginUser,
      registerUser,
      resetPassword,
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
