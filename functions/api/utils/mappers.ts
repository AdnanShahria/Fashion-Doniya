import { asc, desc, eq } from 'drizzle-orm';
import type { AppDatabase } from './db-factory';
import {
  products,
  categories,
  orders,
  trackings,
  courierInfo,
  systemSettings,
  fabricSections,
  fabricCategories,
  fabricDesignSettings,
  fabricSnapshots,
  sizeGuides,
  measurementRules,
  additionalItems,
} from '../../../backend/server/db/schemas/index';
import type {
  Product,
  ProductCustomMeasurementConfig,
  Category,
  Order,
  OrderTrackingHistory,
  CourierInformation,
  StoreSettings,
  PaymentSettings,
  FabricCollectionType,
  FabricSectionRecord,
  FabricCategoryRecord,
  FabricCategoryDesignSettingsRecord,
  FabricCollectionSnapshot,
  FabricCollectionsDatabaseState,
  MeasurementOutfitRule,
  AdditionalClothingItem,
  CategoryMeasurementGuideRecord,
} from '../../../frontend/src/types/index';
import {
  INITIAL_SETTINGS,
  INITIAL_PAYMENT_SETTINGS,
  INITIAL_HOMEPAGE_CONFIG,
  INITIAL_CONTENT_CONFIG,
  INITIAL_NAVIGATION_CONFIG,
  INITIAL_FOOTER_CONFIG,
  createInitialFabricCollectionsState,
} from '../../../frontend/src/data/seedData';
import { safeJsonParse, slugify } from './helpers';

export function mapProductRow(row: typeof products.$inferSelect): Product {
  const customCfg = row.customMeasurementConfig
    ? safeJsonParse<ProductCustomMeasurementConfig | undefined>(row.customMeasurementConfig, undefined)
    : undefined;

  return {
    id: row.id,
    slug: row.slug || slugify(row.nameEn || row.name) || row.id,
    name: row.name,
    nameEn: row.nameEn || undefined,
    description: row.description,
    sku: row.sku,
    fabricWidth: (row.fabricWidth === '2.5' ? '2.5' : '3.5'),
    category: row.category,
    fabricType: row.fabricType,
    design: row.design || undefined,
    color: row.color,
    colorHex: row.colorHex || undefined,
    availableColors: safeJsonParse<string[]>(row.availableColors, []),
    pricePerYard: Number(row.pricePerYard),
    discountPrice: row.discountPrice != null ? Number(row.discountPrice) : undefined,
    stockYards: Number(row.stockYards),
    minOrderQuantity: Number(row.minOrderQuantity),
    stepYard: Number(row.stepYard),
    images: safeJsonParse<string[]>(row.images, []),
    patternType: (row.patternType as Product['patternType']) || 'cotton',
    isFeatured: Boolean(row.isFeatured),
    isBestSeller: Boolean(row.isBestSeller),
    isNewArrival: Boolean(row.isNewArrival),
    isActive: Boolean(row.isActive),
    rating: row.rating != null ? Number(row.rating) : undefined,
    reviewCount: row.reviewCount != null ? Number(row.reviewCount) : undefined,
    customMeasurementConfig: customCfg,
    supportedOutfits:
      (Array.isArray(customCfg?.supportedOutfits) && customCfg.supportedOutfits.length > 0)
        ? customCfg.supportedOutfits
        : undefined,
    seoTitle: row.seoTitle || undefined,
    seoDescription: row.seoDescription || undefined,
    seoKeywords: row.seoKeywords || undefined,
    imageAlt: row.imageAlt || undefined,
  };
}

export function mapCategoryRow(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    fabricWidth: (row.fabricWidth as Category['fabricWidth']) || 'all',
    order: Number(row.order),
    description: row.description || undefined,
    icon: row.icon || undefined,
    imageUrl: row.imageUrl || undefined,
    isActive: Boolean(row.isActive),
  };
}

export async function getAllProductsList(db: AppDatabase): Promise<Product[]> {
  const rows = await db.select().from(products);
  return rows.map(mapProductRow);
}

export async function getAllCategoriesList(db: AppDatabase): Promise<Category[]> {
  const rows = await db.select().from(categories).orderBy(asc(categories.order));
  return rows.map(mapCategoryRow);
}

export function mergeSettingsWithDefaults(
  partial?: Partial<StoreSettings>,
  paymentOverride?: PaymentSettings
): StoreSettings {
  const base: StoreSettings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));
  if (!partial) {
    if (paymentOverride) base.paymentSettings = paymentOverride;
    return base;
  }
  const mergedPayment: PaymentSettings =
    paymentOverride || partial.paymentSettings
      ? {
          bkash: {
            ...INITIAL_PAYMENT_SETTINGS.bkash,
            ...(partial.paymentSettings?.bkash || {}),
            ...(paymentOverride?.bkash || {}),
          },
          nagad: {
            ...INITIAL_PAYMENT_SETTINGS.nagad,
            ...(partial.paymentSettings?.nagad || {}),
            ...(paymentOverride?.nagad || {}),
          },
          cod: {
            ...INITIAL_PAYMENT_SETTINGS.cod,
            ...(partial.paymentSettings?.cod || {}),
            ...(paymentOverride?.cod || {}),
          },
        }
      : base.paymentSettings;

  return {
    ...base,
    ...partial,
    paymentSettings: mergedPayment,
    homepageConfig: partial.homepageConfig
      ? {
          ...INITIAL_HOMEPAGE_CONFIG,
          ...partial.homepageConfig,
          heroSlides:
            Array.isArray(partial.homepageConfig.heroSlides) &&
            partial.homepageConfig.heroSlides.length > 0
              ? partial.homepageConfig.heroSlides
              : INITIAL_HOMEPAGE_CONFIG.heroSlides,
          sections:
            Array.isArray(partial.homepageConfig.sections) &&
            partial.homepageConfig.sections.length > 0
              ? partial.homepageConfig.sections
              : INITIAL_HOMEPAGE_CONFIG.sections,
          promotionalBanners: Array.isArray(partial.homepageConfig.promotionalBanners)
            ? partial.homepageConfig.promotionalBanners
            : INITIAL_HOMEPAGE_CONFIG.promotionalBanners,
        }
      : INITIAL_HOMEPAGE_CONFIG,
    contentConfig: partial.contentConfig
      ? {
          ...INITIAL_CONTENT_CONFIG,
          ...partial.contentConfig,
          aboutPage: { ...INITIAL_CONTENT_CONFIG.aboutPage, ...(partial.contentConfig.aboutPage || {}) },
          contactPage: {
            ...INITIAL_CONTENT_CONFIG.contactPage,
            ...(partial.contentConfig.contactPage || {}),
          },
          faqs: Array.isArray(partial.contentConfig.faqs)
            ? partial.contentConfig.faqs
            : INITIAL_CONTENT_CONFIG.faqs,
          deliveryPolicy: {
            ...INITIAL_CONTENT_CONFIG.deliveryPolicy,
            ...(partial.contentConfig.deliveryPolicy || {}),
          },
          returnPolicy: {
            ...INITIAL_CONTENT_CONFIG.returnPolicy,
            ...(partial.contentConfig.returnPolicy || {}),
          },
          privacyPolicy: {
            ...INITIAL_CONTENT_CONFIG.privacyPolicy,
            ...(partial.contentConfig.privacyPolicy || {}),
          },
          termsConditions: {
            ...INITIAL_CONTENT_CONFIG.termsConditions,
            ...(partial.contentConfig.termsConditions || {}),
          },
          footerContent: {
            ...INITIAL_CONTENT_CONFIG.footerContent,
            ...(partial.contentConfig.footerContent || {}),
          },
        }
      : INITIAL_CONTENT_CONFIG,
    navigationConfig: partial.navigationConfig
      ? {
          headerItems:
            Array.isArray(partial.navigationConfig.headerItems) &&
            partial.navigationConfig.headerItems.length > 0
              ? partial.navigationConfig.headerItems
              : INITIAL_NAVIGATION_CONFIG.headerItems,
          footerFabricItems:
            Array.isArray(partial.navigationConfig.footerFabricItems) &&
            partial.navigationConfig.footerFabricItems.length > 0
              ? partial.navigationConfig.footerFabricItems
              : INITIAL_NAVIGATION_CONFIG.footerFabricItems,
          footerSupportItems:
            Array.isArray(partial.navigationConfig.footerSupportItems) &&
            partial.navigationConfig.footerSupportItems.length > 0
              ? partial.navigationConfig.footerSupportItems
              : INITIAL_NAVIGATION_CONFIG.footerSupportItems,
        }
      : INITIAL_NAVIGATION_CONFIG,
    footerConfig: partial.footerConfig || base.footerConfig || INITIAL_FOOTER_CONFIG,
  };
}

export async function getStoreAndPaymentSettings(db: AppDatabase): Promise<{
  settings: StoreSettings;
  paymentSettings: PaymentSettings;
}> {
  const rows = await db.select().from(systemSettings);
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const rawStore = safeJsonParse<Partial<StoreSettings> | undefined>(
    byKey.get('store_settings'),
    undefined
  );
  const rawPayment = safeJsonParse<PaymentSettings | undefined>(
    byKey.get('payment_settings'),
    undefined
  );
  const paymentSettings = rawPayment
    ? {
        bkash: { ...INITIAL_PAYMENT_SETTINGS.bkash, ...(rawPayment.bkash || {}) },
        nagad: { ...INITIAL_PAYMENT_SETTINGS.nagad, ...(rawPayment.nagad || {}) },
        cod: { ...INITIAL_PAYMENT_SETTINGS.cod, ...(rawPayment.cod || {}) },
      }
    : INITIAL_PAYMENT_SETTINGS;

  return {
    settings: mergeSettingsWithDefaults(rawStore, paymentSettings),
    paymentSettings,
  };
}

export async function hydrateOrderRow(
  db: AppDatabase,
  row: typeof orders.$inferSelect
): Promise<Order> {
  const historyRows = await db
    .select()
    .from(trackings)
    .where(eq(trackings.orderId, row.id))
    .orderBy(asc(trackings.timestamp));

  const courierRow = await db
    .select()
    .from(courierInfo)
    .where(eq(courierInfo.orderId, row.id))
    .get();

  const trackingHistory: OrderTrackingHistory[] = historyRows.map((h) => ({
    id: h.id,
    orderId: h.orderId,
    orderNumber: h.orderNumber,
    status: h.status as Order['orderStatus'],
    timestamp: h.timestamp,
    note: h.note,
    location: h.location || undefined,
    updatedBy: (h.updatedBy as OrderTrackingHistory['updatedBy']) || undefined,
  }));

  const courier: CourierInformation | undefined = courierRow
    ? {
        id: courierRow.id,
        orderId: courierRow.orderId,
        orderNumber: courierRow.orderNumber,
        courierName: courierRow.courierName,
        trackingNumber: courierRow.trackingNumber,
        consignmentId: courierRow.consignmentId || undefined,
        estimatedDeliveryDate: courierRow.estimatedDeliveryDate || undefined,
        trackingUrl: courierRow.trackingUrl || undefined,
        courierStatus: courierRow.courierStatus || undefined,
        lastSyncedAt: courierRow.lastSyncedAt || undefined,
        isApiConnected: Boolean(courierRow.isApiConnected),
        updatedAt: courierRow.updatedAt,
      }
    : undefined;

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.userId || undefined,
    customer: safeJsonParse(row.customer, {
      fullName: 'Guest',
      phone: '',
      district: 'Dhaka',
      upazila: '',
      area: '',
      fullAddress: '',
    }),
    items: safeJsonParse(row.items, []),
    subtotal: Number(row.subtotal),
    deliveryCharge: Number(row.deliveryCharge),
    discount: Number(row.discountAmount),
    couponCode: row.couponCode || undefined,
    grandTotal: Number(row.totalAmount),
    paymentMethod: row.paymentMethod as Order['paymentMethod'],
    paymentStatus: row.paymentStatus as Order['paymentStatus'],
    paymentDetails: row.paymentDetails ? safeJsonParse(row.paymentDetails, undefined) : undefined,
    orderStatus: row.orderStatus as Order['orderStatus'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    estimatedDeliveryDate: row.estimatedDeliveryDate || undefined,
    trackingHistory,
    statusHistory: trackingHistory.map((h) => ({
      id: h.id,
      status: h.status,
      timestamp: h.timestamp,
      note: h.note,
    })),
    courierInfo: courier,
  };
}

export async function getAllOrdersHydrated(db: AppDatabase): Promise<{
  orders: Order[];
  order_tracking_history: OrderTrackingHistory[];
  courier_information: CourierInformation[];
}> {
  const [orderRows, trackingRows, courierRows] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(trackings).orderBy(asc(trackings.timestamp)),
    db.select().from(courierInfo),
  ]);

  const trackingByOrder = new Map<string, OrderTrackingHistory[]>();
  const allTracking: OrderTrackingHistory[] = trackingRows.map((h) => {
    const rec: OrderTrackingHistory = {
      id: h.id,
      orderId: h.orderId,
      orderNumber: h.orderNumber,
      status: h.status as Order['orderStatus'],
      timestamp: h.timestamp,
      note: h.note,
      location: h.location || undefined,
      updatedBy: (h.updatedBy as OrderTrackingHistory['updatedBy']) || undefined,
    };
    const arr = trackingByOrder.get(h.orderId) || [];
    arr.push(rec);
    trackingByOrder.set(h.orderId, arr);
    return rec;
  });

  const courierByOrder = new Map<string, CourierInformation>();
  const allCouriers: CourierInformation[] = courierRows.map((c) => {
    const rec: CourierInformation = {
      id: c.id,
      orderId: c.orderId,
      orderNumber: c.orderNumber,
      courierName: c.courierName,
      trackingNumber: c.trackingNumber,
      consignmentId: c.consignmentId || undefined,
      estimatedDeliveryDate: c.estimatedDeliveryDate || undefined,
      trackingUrl: c.trackingUrl || undefined,
      courierStatus: c.courierStatus || undefined,
      lastSyncedAt: c.lastSyncedAt || undefined,
      isApiConnected: Boolean(c.isApiConnected),
      updatedAt: c.updatedAt,
    };
    courierByOrder.set(c.orderId, rec);
    return rec;
  });

  const hydratedOrders: Order[] = orderRows.map((row) => {
    const history = trackingByOrder.get(row.id) || [];
    return {
      id: row.id,
      orderNumber: row.orderNumber,
      userId: row.userId || undefined,
      customer: safeJsonParse(row.customer, {
        fullName: 'Guest',
        phone: '',
        district: 'Dhaka',
        upazila: '',
        area: '',
        fullAddress: '',
      }),
      items: safeJsonParse(row.items, []),
      subtotal: Number(row.subtotal),
      deliveryCharge: Number(row.deliveryCharge),
      discount: Number(row.discountAmount),
      couponCode: row.couponCode || undefined,
      grandTotal: Number(row.totalAmount),
      paymentMethod: row.paymentMethod as Order['paymentMethod'],
      paymentStatus: row.paymentStatus as Order['paymentStatus'],
      paymentDetails: row.paymentDetails ? safeJsonParse(row.paymentDetails, undefined) : undefined,
      orderStatus: row.orderStatus as Order['orderStatus'],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      estimatedDeliveryDate: row.estimatedDeliveryDate || undefined,
      trackingHistory: history,
      statusHistory: history.map((h) => ({
        id: h.id,
        status: h.status,
        timestamp: h.timestamp,
        note: h.note,
      })),
      courierInfo: courierByOrder.get(row.id),
    };
  });

  return {
    orders: hydratedOrders,
    order_tracking_history: allTracking,
    courier_information: allCouriers,
  };
}

export async function getFabricCollectionsState(
  db: AppDatabase
): Promise<FabricCollectionsDatabaseState> {
  const defaults = createInitialFabricCollectionsState();
  const [secRows, catRows, designRows, snapRows] = await Promise.all([
    db.select().from(fabricSections),
    db.select().from(fabricCategories).orderBy(asc(fabricCategories.order)),
    db.select().from(fabricDesignSettings),
    db.select().from(fabricSnapshots),
  ]);

  const sections = { ...defaults.fabric_sections };
  for (const row of secRows) {
    const ct = row.collectionType as FabricCollectionType;
    if (ct === '2.5_bahar' || ct === '3.5_bahar') {
      sections[ct] = {
        id: row.id,
        collection_type: ct,
        eyebrow: row.eyebrow,
        heading: row.heading,
        subtitle: row.subtitle,
        updatedAt: row.updatedAt,
      };
    }
  }

  const cats: Record<FabricCollectionType, FabricCategoryRecord[]> = {
    '3.5_bahar': [],
    '2.5_bahar': [],
  };
  for (const row of catRows) {
    const ct = row.collectionType as FabricCollectionType;
    if (ct === '2.5_bahar' || ct === '3.5_bahar') {
      cats[ct].push({
        id: row.id,
        collection_type: ct,
        name: row.name,
        matchCategoryName: row.matchCategoryName,
        slug: row.slug,
        description: row.description,
        sampleFabrics: row.sampleFabrics,
        standardYards: row.standardYards,
        buttonLabel: row.buttonLabel,
        buttonLink: row.buttonLink,
        icon: row.icon as FabricCategoryRecord['icon'],
        representativeProductId: row.representativeProductId,
        fallbackColorHex: row.fallbackColorHex,
        fallbackPatternType: row.fallbackPatternType as Product['patternType'],
        customImageUrl: row.customImageUrl || undefined,
        order: Number(row.order),
        isEnabled: Boolean(row.isEnabled),
        updatedAt: row.updatedAt,
      });
    }
  }

  const designSettings = { ...defaults.fabric_category_design_settings };
  for (const row of designRows) {
    const ct = row.collectionType as FabricCollectionType;
    if (ct === '2.5_bahar' || ct === '3.5_bahar') {
      designSettings[ct] = safeJsonParse<FabricCategoryDesignSettingsRecord>(
        row.data,
        defaults.fabric_category_design_settings[ct]
      );
    }
  }

  const drafts = { ...defaults.drafts };
  const previousPublished = { ...defaults.previous_published };
  const hasUnpushedDraft = { ...defaults.has_unpushed_draft };

  for (const row of snapRows) {
    const ct = row.collectionType as FabricCollectionType;
    if (ct === '2.5_bahar' || ct === '3.5_bahar') {
      if (row.draftSnapshot) {
        drafts[ct] = safeJsonParse<FabricCollectionSnapshot>(row.draftSnapshot, drafts[ct]);
      }
      if (row.previousPublishedSnapshot) {
        previousPublished[ct] = safeJsonParse<FabricCollectionSnapshot | null>(
          row.previousPublishedSnapshot,
          null
        );
      }
      hasUnpushedDraft[ct] = Boolean(row.hasUnpushedDraft);
    }
  }

  return {
    fabric_sections: sections,
    fabric_categories: cats,
    fabric_category_design_settings: designSettings,
    drafts,
    previous_published: previousPublished,
    has_unpushed_draft: hasUnpushedDraft,
  };
}

export async function getMeasurementsState(db: AppDatabase): Promise<{
  guides: CategoryMeasurementGuideRecord[];
  rules: MeasurementOutfitRule[];
  additionalItems: AdditionalClothingItem[];
}> {
  const [guideRows, ruleRows, addonRows] = await Promise.all([
    db.select().from(sizeGuides),
    db.select().from(measurementRules).orderBy(asc(measurementRules.order)),
    db.select().from(additionalItems).orderBy(asc(additionalItems.order)),
  ]);

  return {
    guides: guideRows
      .map((r) => safeJsonParse<CategoryMeasurementGuideRecord | null>(r.data, null))
      .filter((x): x is CategoryMeasurementGuideRecord => Boolean(x)),
    rules: ruleRows
      .map((r) => safeJsonParse<MeasurementOutfitRule | null>(r.data, null))
      .filter((x): x is MeasurementOutfitRule => Boolean(x)),
    additionalItems: addonRows
      .map((r) => safeJsonParse<AdditionalClothingItem | null>(r.data, null))
      .filter((x): x is AdditionalClothingItem => Boolean(x)),
  };
}
