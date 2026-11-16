import { 
  Product, 
  Category, 
  MeasurementOutfitRule, 
  AdditionalClothingItem, 
  StoreSettings, 
  Order, 
  OrderTrackingHistory,
  CourierInformation,
  CustomDesignRequest,
  CartItem,
  CustomerUser,
  FabricCollectionsDatabaseState,
  CategoryMeasurementGuideRecord
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CATEGORIES, 
  INITIAL_MEASUREMENT_RULES, 
  INITIAL_ADDITIONAL_ITEMS, 
  INITIAL_SETTINGS, 
  INITIAL_DEMO_ORDERS,
  INITIAL_TRACKING_HISTORY,
  INITIAL_COURIER_INFO,
  INITIAL_CUSTOM_REQUESTS,
  INITIAL_CATEGORY_MEASUREMENT_GUIDES,
  createInitialFabricCollectionsState
} from '../data/seedData';

const STORAGE_KEYS = {
  VERSION: 'fashion_doniya_version',
  PRODUCTS: 'fashion_doniya_products',
  CATEGORIES: 'fashion_doniya_categories',
  FABRIC_COLLECTIONS: 'fashion_doniya_fabric_collections',
  MEASUREMENT_RULES: 'fashion_doniya_measurement_rules',
  ADDITIONAL_ITEMS: 'fashion_doniya_additional_items',
  CATEGORY_MEASUREMENT_GUIDES: 'fashion_doniya_category_measurement_guides',
  SETTINGS: 'fashion_doniya_settings',
  ORDERS: 'fashion_doniya_orders',
  ORDER_TRACKING_HISTORY: 'fashion_doniya_order_tracking_history',
  COURIER_INFORMATION: 'fashion_doniya_courier_information',
  CUSTOM_REQUESTS: 'fashion_doniya_custom_requests',
  CART: 'fashion_doniya_cart',
  WISHLIST: 'fashion_doniya_wishlist',
  CURRENT_USER: 'fashion_doniya_current_user',
};

const CURRENT_VERSION = '6.0.0';

const LEGACY_DEMO_ORDER_NUMBERS = new Set([
  'FD-2026-1042',
  'FD-2026-1038',
  'FD-2026-1025'
]);

export class StorageService {
  private static isInitialized = false;

  public static initialize(): void {
    if (this.isInitialized) return;
    try {
      const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
      if (!storedVersion || storedVersion !== CURRENT_VERSION) {
        // Initialize clean localStorage slots without static catalog lists;
        // live storefront data is hydrated directly from the D1 database (/api/v1/bulk/home).
        localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.MEASUREMENT_RULES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.ADDITIONAL_ITEMS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CATEGORY_MEASUREMENT_GUIDES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.ORDER_TRACKING_HISTORY, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.COURIER_INFORMATION, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.CUSTOM_REQUESTS, JSON.stringify([]));
      } else {
        if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
          this.setProducts([]);
        }
        if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
          this.setCategories([]);
        }
        if (!localStorage.getItem(STORAGE_KEYS.MEASUREMENT_RULES)) {
          this.setMeasurementRules([]);
        }
        if (!localStorage.getItem(STORAGE_KEYS.ADDITIONAL_ITEMS)) {
          this.setAdditionalItems([]);
        }
        if (!localStorage.getItem(STORAGE_KEYS.CATEGORY_MEASUREMENT_GUIDES)) {
          this.setCategoryMeasurementGuides([]);
        }
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
          this.setSettings(INITIAL_SETTINGS);
        }
        if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
          this.setOrders([]);
        }
        if (!localStorage.getItem(STORAGE_KEYS.ORDER_TRACKING_HISTORY)) {
          this.setOrderTrackingHistory([]);
        }
        if (!localStorage.getItem(STORAGE_KEYS.COURIER_INFORMATION)) {
          this.setCourierInformation([]);
        }
        if (!localStorage.getItem(STORAGE_KEYS.CUSTOM_REQUESTS)) {
          this.setCustomRequests([]);
        }
      }
      // Remove legacy plaintext-password storage if present
      localStorage.removeItem('fashion_doniya_saved_users');
      this.isInitialized = true;
    } catch (e) {
      console.warn('LocalStorage access error, falling back to memory defaults', e);
    }
  }

  public static seedAllDefaults(): void {
    try {
      const existingOrdersRaw = localStorage.getItem(STORAGE_KEYS.ORDERS);
      let mergedOrders: Order[] = [];
      let mergedHistory: OrderTrackingHistory[] = [];
      let mergedCourier: CourierInformation[] = [];

      if (existingOrdersRaw) {
        try {
          const parsedOrders: Order[] = JSON.parse(existingOrdersRaw);
          const customOrders = parsedOrders.filter(
            (o) => !LEGACY_DEMO_ORDER_NUMBERS.has((o.orderNumber || '').toUpperCase())
          );
          mergedOrders = [...customOrders];
          for (const co of customOrders) {
            if (co.statusHistory && co.statusHistory.length > 0) {
              co.statusHistory.forEach((sh, idx) => {
                mergedHistory.push({
                  id: sh.id || `trk-${co.id}-${idx}`,
                  orderId: co.id,
                  orderNumber: co.orderNumber,
                  status: sh.status,
                  timestamp: sh.timestamp,
                  note: sh.note,
                  location: sh.location,
                  updatedBy: (sh.updatedBy as any) || 'System'
                });
              });
            }
            if (co.courierInfo) {
              mergedCourier.push(co.courierInfo);
            }
          }
        } catch {
          // ignore
        }
      }

      const fabricCollectionsState = createInitialFabricCollectionsState();

      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      localStorage.setItem(STORAGE_KEYS.FABRIC_COLLECTIONS, JSON.stringify(fabricCollectionsState));
      localStorage.setItem(STORAGE_KEYS.MEASUREMENT_RULES, JSON.stringify(INITIAL_MEASUREMENT_RULES));
      localStorage.setItem(STORAGE_KEYS.ADDITIONAL_ITEMS, JSON.stringify(INITIAL_ADDITIONAL_ITEMS));
      localStorage.setItem(
        STORAGE_KEYS.CATEGORY_MEASUREMENT_GUIDES,
        JSON.stringify(INITIAL_CATEGORY_MEASUREMENT_GUIDES)
      );
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(mergedOrders));
      localStorage.setItem(STORAGE_KEYS.ORDER_TRACKING_HISTORY, JSON.stringify(mergedHistory));
      localStorage.setItem(STORAGE_KEYS.COURIER_INFORMATION, JSON.stringify(mergedCourier));
      localStorage.setItem(STORAGE_KEYS.CUSTOM_REQUESTS, JSON.stringify(INITIAL_CUSTOM_REQUESTS));
      localStorage.removeItem('fashion_doniya_saved_users');
    } catch (e) {
      console.error('Failed to seed defaults into localStorage', e);
    }
  }

  public static resetDemoData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CART);
      localStorage.removeItem(STORAGE_KEYS.WISHLIST);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      this.seedAllDefaults();
    } catch (e) {
      console.error('Error resetting demo data', e);
    }
  }

  // Generic getter / setter
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Error reading ${key} from localStorage`, e);
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage`, e);
    }
  }

  // Products
  public static getProducts(): Product[] {
    return this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  }

  public static setProducts(products: Product[]): void {
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
  }

  // Categories
  public static getCategories(): Category[] {
    return this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  }

  public static setCategories(categories: Category[]): void {
    this.setItem(STORAGE_KEYS.CATEGORIES, categories);
  }

  // Fabric Collections (3.5_bahar & 2.5_bahar sections, categories, design settings, drafts)
  public static getFabricCollectionsState(): FabricCollectionsDatabaseState {
    const state = this.getItem<FabricCollectionsDatabaseState>(
      STORAGE_KEYS.FABRIC_COLLECTIONS,
      createInitialFabricCollectionsState()
    );
    if (!state?.fabric_sections || !state?.fabric_categories || !state?.fabric_category_design_settings) {
      const fresh = createInitialFabricCollectionsState();
      this.setItem(STORAGE_KEYS.FABRIC_COLLECTIONS, fresh);
      return fresh;
    }
    return state;
  }

  public static setFabricCollectionsState(state: FabricCollectionsDatabaseState): void {
    this.setItem(STORAGE_KEYS.FABRIC_COLLECTIONS, state);
  }

  // Measurement Rules
  public static getMeasurementRules(): MeasurementOutfitRule[] {
    return this.getItem<MeasurementOutfitRule[]>(STORAGE_KEYS.MEASUREMENT_RULES, INITIAL_MEASUREMENT_RULES);
  }

  public static setMeasurementRules(rules: MeasurementOutfitRule[]): void {
    this.setItem(STORAGE_KEYS.MEASUREMENT_RULES, rules);
  }

  // Additional Items
  public static getAdditionalItems(): AdditionalClothingItem[] {
    const items = this.getItem<AdditionalClothingItem[]>(STORAGE_KEYS.ADDITIONAL_ITEMS, INITIAL_ADDITIONAL_ITEMS);
    return items.map((item) => {
      if (item.name.includes('স্কার্ফ') || item.nameEn === 'Scarf') {
        return { ...item, name: 'স্কার্ট (Skirt)', nameEn: 'Skirt' };
      }
      if (item.name === 'ওড়না (Orna)') {
        return { ...item, name: 'সেটের ওড়না (Orna)', nameEn: 'Set Orna' };
      }
      return item;
    });
  }

  public static setAdditionalItems(items: AdditionalClothingItem[]): void {
    this.setItem(STORAGE_KEYS.ADDITIONAL_ITEMS, items);
  }

  // Category Measurement & Clothing Size Guides
  public static getCategoryMeasurementGuides(): CategoryMeasurementGuideRecord[] {
    const guides = this.getItem<CategoryMeasurementGuideRecord[]>(
      STORAGE_KEYS.CATEGORY_MEASUREMENT_GUIDES,
      INITIAL_CATEGORY_MEASUREMENT_GUIDES
    );
    if (!Array.isArray(guides) || guides.length === 0) {
      this.setItem(STORAGE_KEYS.CATEGORY_MEASUREMENT_GUIDES, INITIAL_CATEGORY_MEASUREMENT_GUIDES);
      return INITIAL_CATEGORY_MEASUREMENT_GUIDES;
    }
    return guides;
  }

  public static setCategoryMeasurementGuides(guides: CategoryMeasurementGuideRecord[]): void {
    this.setItem(STORAGE_KEYS.CATEGORY_MEASUREMENT_GUIDES, guides);
  }

  // Store Settings
  public static getSettings(): StoreSettings {
    const raw = this.getItem<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    const defaultPs = INITIAL_SETTINGS.paymentSettings;
    return {
      ...INITIAL_SETTINGS,
      ...raw,
      paymentSettings: {
        bkash: {
          ...defaultPs.bkash,
          ...(raw?.paymentSettings?.bkash || {})
        },
        nagad: {
          ...defaultPs.nagad,
          ...(raw?.paymentSettings?.nagad || {})
        },
        cod: {
          ...defaultPs.cod,
          ...(raw?.paymentSettings?.cod || {})
        }
      },
      addonFabricCollections: raw?.addonFabricCollections || INITIAL_SETTINGS.addonFabricCollections
    };
  }

  public static setSettings(settings: StoreSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  // Orders (Relational Join with order_tracking_history and courier_information)
  public static getRawOrders(): Order[] {
    return this.getItem<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_DEMO_ORDERS);
  }

  public static getOrderTrackingHistory(): OrderTrackingHistory[] {
    return this.getItem<OrderTrackingHistory[]>(
      STORAGE_KEYS.ORDER_TRACKING_HISTORY,
      INITIAL_TRACKING_HISTORY
    );
  }

  public static setOrderTrackingHistory(history: OrderTrackingHistory[]): void {
    this.setItem(STORAGE_KEYS.ORDER_TRACKING_HISTORY, history);
  }

  public static getCourierInformation(): CourierInformation[] {
    return this.getItem<CourierInformation[]>(
      STORAGE_KEYS.COURIER_INFORMATION,
      INITIAL_COURIER_INFO
    );
  }

  public static setCourierInformation(couriers: CourierInformation[]): void {
    this.setItem(STORAGE_KEYS.COURIER_INFORMATION, couriers);
  }

  public static getOrders(): Order[] {
    const rawOrders = this.getRawOrders();
    const allHistory = this.getOrderTrackingHistory();
    const allCouriers = this.getCourierInformation();

    return rawOrders.map((order) => {
      const orderHist = allHistory
        .filter(
          (h) =>
            h.orderId === order.id ||
            h.orderNumber.toUpperCase() === order.orderNumber.toUpperCase()
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const courier = allCouriers.find(
        (c) =>
          c.orderId === order.id ||
          c.orderNumber.toUpperCase() === order.orderNumber.toUpperCase()
      );

      const finalHistory =
        orderHist.length > 0
          ? orderHist
          : (order.statusHistory || []).map((sh, i) => ({
              id: sh.id || `trk-${order.id}-${i}`,
              orderId: order.id,
              orderNumber: order.orderNumber,
              status: sh.status,
              timestamp: sh.timestamp,
              note: sh.note,
              location: sh.location,
              updatedBy: (sh.updatedBy as any) || 'System'
            }));

      return {
        ...order,
        courierInfo: courier || order.courierInfo,
        estimatedDeliveryDate:
          courier?.estimatedDeliveryDate || order.estimatedDeliveryDate,
        trackingHistory: finalHistory,
        statusHistory: finalHistory
      };
    });
  }

  public static setOrders(orders: Order[]): void {
    this.setItem(STORAGE_KEYS.ORDERS, orders);
  }

  // Custom Design Requests
  public static getCustomRequests(): CustomDesignRequest[] {
    return this.getItem<CustomDesignRequest[]>(STORAGE_KEYS.CUSTOM_REQUESTS, INITIAL_CUSTOM_REQUESTS);
  }

  public static setCustomRequests(requests: CustomDesignRequest[]): void {
    this.setItem(STORAGE_KEYS.CUSTOM_REQUESTS, requests);
  }

  // Cart
  public static getCart(): CartItem[] {
    return this.getItem<CartItem[]>(STORAGE_KEYS.CART, []);
  }

  public static setCart(cart: CartItem[]): void {
    this.setItem(STORAGE_KEYS.CART, cart);
  }

  // Wishlist (array of product IDs)
  public static getWishlist(): string[] {
    return this.getItem<string[]>(STORAGE_KEYS.WISHLIST, []);
  }

  public static setWishlist(wishlist: string[]): void {
    this.setItem(STORAGE_KEYS.WISHLIST, wishlist);
  }

  // Current User
  public static getCurrentUser(): CustomerUser | null {
    return this.getItem<CustomerUser | null>(STORAGE_KEYS.CURRENT_USER, null);
  }

  public static setCurrentUser(user: CustomerUser | null): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  // Phone Normalization Helper (supports Bengali digits & +880 prefix)
  public static normalizePhone(rawPhone: string): string {
    const bengaliToEnglish = rawPhone.replace(/[০-৯]/g, (d) =>
      String('০১২৩৪৫৬৭৮৯'.indexOf(d))
    );
    const digits = bengaliToEnglish.replace(/\D/g, '');
    if (digits.startsWith('880') && digits.length >= 13) {
      return '0' + digits.slice(3, 13);
    }
    if (digits.startsWith('1') && digits.length === 10) {
      return '0' + digits;
    }
    return digits;
  }
}

