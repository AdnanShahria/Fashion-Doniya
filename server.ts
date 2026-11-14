import express, { type Request, type Response, type NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  Product,
  Category,
  StoreSettings,
  CustomerUser,
  ContactMessageRecord,
  ActivityLog,
  CustomDesignRequest,
  Order,
  OrderStatus,
  OrderTrackingHistory,
  CourierInformation,
  FabricCollectionType,
  FabricSectionRecord,
  FabricCategoryRecord,
  FabricCategoryDesignSettingsRecord,
  FabricCollectionSnapshot,
  FabricCollectionsDatabaseState,
  PaymentSettings,
  PaymentStatus
} from './src/types/index.ts';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_CONTACT_MESSAGES,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_CUSTOM_REQUESTS,
  INITIAL_DEMO_ORDERS,
  INITIAL_TRACKING_HISTORY,
  INITIAL_COURIER_INFO,
  INITIAL_PAYMENT_SETTINGS,
  INITIAL_HOMEPAGE_CONFIG,
  INITIAL_CONTENT_CONFIG,
  INITIAL_NAVIGATION_CONFIG,
  INITIAL_SEO_CONFIG,
  INITIAL_CAMPAIGNS,
  createInitialFabricCollectionsState
} from './src/data/seedData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'order_tracking_db.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

const VALID_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned'
];

interface AdminAccountRecord {
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
  passwordSalt: string;
  passwordHash: string;
  updatedAt: string;
}

function hashAdminPassword(password: string, salt?: string): { salt: string; hash: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash };
}

function verifyAdminPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const { hash } = hashAdminPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

interface DatabaseSchema {
  version: string;
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  customers: CustomerUser[];
  contact_messages: ContactMessageRecord[];
  custom_requests: CustomDesignRequest[];
  activity_logs: ActivityLog[];
  admin_account: AdminAccountRecord;
  orders: Order[];
  order_tracking_history: OrderTrackingHistory[];
  courier_information: CourierInformation[];
  fabric_sections: Record<FabricCollectionType, FabricSectionRecord>;
  fabric_categories: Record<FabricCollectionType, FabricCategoryRecord[]>;
  fabric_category_design_settings: Record<FabricCollectionType, FabricCategoryDesignSettingsRecord>;
  fabric_collection_drafts: Record<FabricCollectionType, FabricCollectionSnapshot>;
  fabric_collection_previous_published: Record<FabricCollectionType, FabricCollectionSnapshot | null>;
  fabric_collection_has_unpushed_draft: Record<FabricCollectionType, boolean>;
  payment_settings: PaymentSettings;
}

// Normalize Bangladeshi phone numbers (supports Bengali digits, +880, 880, spaces, hyphens)
function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const bengaliToEnglish = String(rawPhone).replace(/[০-৯]/g, (d) =>
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

function createDefaultAdminAccount(): AdminAccountRecord {
  const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@2026';
  const { salt, hash } = hashAdminPassword(defaultPass);
  return {
    email: 'admin@fashiondoniyabd.com',
    name: 'Fashion Doniya Admin',
    role: 'super_admin',
    passwordSalt: salt,
    passwordHash: hash,
    updatedAt: new Date().toISOString()
  };
}

function mergeSettingsWithDefaults(partial?: Partial<StoreSettings>, paymentOverride?: PaymentSettings): StoreSettings {
  const base: StoreSettings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));
  if (!partial) {
    if (paymentOverride) base.paymentSettings = paymentOverride;
    return base;
  }
  const mergedPayment: PaymentSettings = paymentOverride || partial.paymentSettings
    ? {
        bkash: { ...INITIAL_PAYMENT_SETTINGS.bkash, ...(partial.paymentSettings?.bkash || {}), ...(paymentOverride?.bkash || {}) },
        nagad: { ...INITIAL_PAYMENT_SETTINGS.nagad, ...(partial.paymentSettings?.nagad || {}), ...(paymentOverride?.nagad || {}) },
        cod: { ...INITIAL_PAYMENT_SETTINGS.cod, ...(partial.paymentSettings?.cod || {}), ...(paymentOverride?.cod || {}) }
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
          heroSlides: Array.isArray(partial.homepageConfig.heroSlides) && partial.homepageConfig.heroSlides.length > 0
            ? partial.homepageConfig.heroSlides
            : INITIAL_HOMEPAGE_CONFIG.heroSlides,
          sections: Array.isArray(partial.homepageConfig.sections) && partial.homepageConfig.sections.length > 0
            ? partial.homepageConfig.sections
            : INITIAL_HOMEPAGE_CONFIG.sections,
          promotionalBanners: Array.isArray(partial.homepageConfig.promotionalBanners)
            ? partial.homepageConfig.promotionalBanners
            : INITIAL_HOMEPAGE_CONFIG.promotionalBanners
        }
      : INITIAL_HOMEPAGE_CONFIG,
    contentConfig: partial.contentConfig
      ? {
          ...INITIAL_CONTENT_CONFIG,
          ...partial.contentConfig,
          aboutPage: { ...INITIAL_CONTENT_CONFIG.aboutPage, ...(partial.contentConfig.aboutPage || {}) },
          contactPage: { ...INITIAL_CONTENT_CONFIG.contactPage, ...(partial.contentConfig.contactPage || {}) },
          faqs: Array.isArray(partial.contentConfig.faqs) ? partial.contentConfig.faqs : INITIAL_CONTENT_CONFIG.faqs,
          deliveryPolicy: { ...INITIAL_CONTENT_CONFIG.deliveryPolicy, ...(partial.contentConfig.deliveryPolicy || {}) },
          returnPolicy: { ...INITIAL_CONTENT_CONFIG.returnPolicy, ...(partial.contentConfig.returnPolicy || {}) },
          privacyPolicy: { ...INITIAL_CONTENT_CONFIG.privacyPolicy, ...(partial.contentConfig.privacyPolicy || {}) },
          termsConditions: { ...INITIAL_CONTENT_CONFIG.termsConditions, ...(partial.contentConfig.termsConditions || {}) },
          footerContent: { ...INITIAL_CONTENT_CONFIG.footerContent, ...(partial.contentConfig.footerContent || {}) }
        }
      : INITIAL_CONTENT_CONFIG,
    navigationConfig: partial.navigationConfig
      ? {
          headerItems: Array.isArray(partial.navigationConfig.headerItems) && partial.navigationConfig.headerItems.length > 0
            ? partial.navigationConfig.headerItems
            : INITIAL_NAVIGATION_CONFIG.headerItems,
          footerFabricItems: Array.isArray(partial.navigationConfig.footerFabricItems) && partial.navigationConfig.footerFabricItems.length > 0
            ? partial.navigationConfig.footerFabricItems
            : INITIAL_NAVIGATION_CONFIG.footerFabricItems,
          footerSupportItems: Array.isArray(partial.navigationConfig.footerSupportItems) && partial.navigationConfig.footerSupportItems.length > 0
            ? partial.navigationConfig.footerSupportItems
            : INITIAL_NAVIGATION_CONFIG.footerSupportItems
        }
      : INITIAL_NAVIGATION_CONFIG,
    seoConfig: partial.seoConfig
      ? {
          ...INITIAL_SEO_CONFIG,
          ...partial.seoConfig,
          pages: { ...INITIAL_SEO_CONFIG.pages, ...(partial.seoConfig.pages || {}) }
        }
      : INITIAL_SEO_CONFIG,
    campaigns: Array.isArray(partial.campaigns) ? partial.campaigns : INITIAL_CAMPAIGNS,
    floatingWidgetConfig: partial.floatingWidgetConfig || INITIAL_SETTINGS.floatingWidgetConfig,
    addonFabricCollections: partial.addonFabricCollections || INITIAL_SETTINGS.addonFabricCollections
  };
}

function loadDatabase(): DatabaseSchema {
  const defaultFc = createInitialFabricCollectionsState();
  const legacyDemoOrderIds = new Set(['ord-1042', 'ord-1038', 'ord-1025']);
  const legacyDemoOrderNums = new Set(['FD-2026-1042', 'FD-2026-1038', 'FD-2026-1025']);
  const legacyDemoCustomerIds = new Set(['cust-101', 'cust-102', 'cust-103']);
  const legacyDemoMsgIds = new Set(['msg-101']);
  const legacyDemoReqIds = new Set(['req-201']);
  const legacyDemoActIds = new Set(['act-1', 'act-2', 'act-3']);

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      if (
        parsed &&
        Array.isArray(parsed.orders) &&
        Array.isArray(parsed.order_tracking_history) &&
        Array.isArray(parsed.courier_information)
      ) {
        const isCurrentVersion = parsed.version === '5.1.0';
        const mergedPayment: PaymentSettings = parsed.payment_settings
          ? {
              bkash: { ...INITIAL_PAYMENT_SETTINGS.bkash, ...parsed.payment_settings.bkash },
              nagad: { ...INITIAL_PAYMENT_SETTINGS.nagad, ...parsed.payment_settings.nagad },
              cod: { ...INITIAL_PAYMENT_SETTINGS.cod, ...parsed.payment_settings.cod }
            }
          : JSON.parse(JSON.stringify(INITIAL_PAYMENT_SETTINGS));

        const cleanOrders = parsed.orders.filter(
          (o) => !legacyDemoOrderIds.has(o.id) && !legacyDemoOrderNums.has((o.orderNumber || '').toUpperCase())
        );
        const cleanHistory = parsed.order_tracking_history.filter(
          (h) => !legacyDemoOrderIds.has(h.orderId) && !legacyDemoOrderNums.has((h.orderNumber || '').toUpperCase())
        );
        const cleanCouriers = parsed.courier_information.filter(
          (c) => !legacyDemoOrderIds.has(c.orderId) && !legacyDemoOrderNums.has((c.orderNumber || '').toUpperCase())
        );
        const cleanCustomers = Array.isArray(parsed.customers)
          ? parsed.customers.filter((c) => !legacyDemoCustomerIds.has(c.id))
          : [];
        const cleanMessages = Array.isArray(parsed.contact_messages)
          ? parsed.contact_messages.filter((m) => !legacyDemoMsgIds.has(m.id))
          : [];
        const cleanRequests = Array.isArray(parsed.custom_requests)
          ? parsed.custom_requests.filter((r) => !legacyDemoReqIds.has(r.id))
          : [];
        const cleanLogs = Array.isArray(parsed.activity_logs)
          ? parsed.activity_logs.filter((l) => !legacyDemoActIds.has(l.id))
          : [];

        const merged: DatabaseSchema = {
          version: '5.1.0',
          products: Array.isArray(parsed.products) && parsed.products.length > 0
            ? parsed.products
            : JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
            ? parsed.categories
            : JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
          settings: mergeSettingsWithDefaults(parsed.settings, mergedPayment),
          customers: cleanCustomers,
          contact_messages: cleanMessages,
          custom_requests: cleanRequests,
          activity_logs: cleanLogs,
          admin_account: parsed.admin_account && parsed.admin_account.passwordHash
            ? parsed.admin_account
            : createDefaultAdminAccount(),
          orders: cleanOrders,
          order_tracking_history: cleanHistory,
          courier_information: cleanCouriers,
          fabric_sections: parsed.fabric_sections || defaultFc.fabric_sections,
          fabric_categories: parsed.fabric_categories || defaultFc.fabric_categories,
          fabric_category_design_settings:
            parsed.fabric_category_design_settings || defaultFc.fabric_category_design_settings,
          fabric_collection_drafts: parsed.fabric_collection_drafts || defaultFc.drafts,
          fabric_collection_previous_published:
            parsed.fabric_collection_previous_published || defaultFc.previous_published,
          fabric_collection_has_unpushed_draft:
            parsed.fabric_collection_has_unpushed_draft || defaultFc.has_unpushed_draft,
          payment_settings: mergedPayment
        };
        if (!isCurrentVersion) {
          saveDatabase(merged);
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('Initializing fresh database:', err);
  }

  const initialPayment = JSON.parse(JSON.stringify(INITIAL_PAYMENT_SETTINGS));
  const initialDb: DatabaseSchema = {
    version: '5.1.0',
    products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
    categories: JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
    settings: mergeSettingsWithDefaults(INITIAL_SETTINGS, initialPayment),
    customers: [],
    contact_messages: [],
    custom_requests: [],
    activity_logs: [],
    admin_account: createDefaultAdminAccount(),
    orders: [],
    order_tracking_history: [],
    courier_information: [],
    fabric_sections: defaultFc.fabric_sections,
    fabric_categories: defaultFc.fabric_categories,
    fabric_category_design_settings: defaultFc.fabric_category_design_settings,
    fabric_collection_drafts: defaultFc.drafts,
    fabric_collection_previous_published: defaultFc.previous_published,
    fabric_collection_has_unpushed_draft: defaultFc.has_unpushed_draft,
    payment_settings: initialPayment
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

let db: DatabaseSchema = loadDatabase();

function appendActivityLog(
  action: string,
  category: ActivityLog['category'],
  details: string,
  actor = 'Admin'
) {
  const entry: ActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    category,
    details,
    actor,
    timestamp: new Date().toISOString()
  };
  db.activity_logs.unshift(entry);
  if (db.activity_logs.length > 150) {
    db.activity_logs = db.activity_logs.slice(0, 150);
  }
}

// Hydrate an order with its relational order_tracking_history and courier_information rows
function hydrateOrder(order: Order): Order {
  const history = db.order_tracking_history
    .filter(
      (h) =>
        h.orderId === order.id ||
        h.orderNumber.toUpperCase() === order.orderNumber.toUpperCase()
    )
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const courier = db.courier_information.find(
    (c) =>
      c.orderId === order.id ||
      c.orderNumber.toUpperCase() === order.orderNumber.toUpperCase()
  );

  const finalHistory: OrderTrackingHistory[] =
    history.length > 0
      ? history
      : (order.statusHistory || []).map((sh, idx) => ({
          id: sh.id || `trk-${order.id}-${idx}`,
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
}

// Generate a guaranteed unique Order Number (e.g., FD-2026-4829)
function generateUniqueOrderNumber(): string {
  const existingSet = new Set(db.orders.map((o) => o.orderNumber.toUpperCase()));
  for (let attempt = 0; attempt < 100; attempt++) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const candidate = `FD-2026-${randomNum}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }
  return `FD-2026-${Date.now().toString().slice(-5)}`;
}

// Build automatic courier tracking URL for major Bangladeshi couriers
function buildCourierTrackingUrl(courierName: string, trackingNumber: string): string | undefined {
  const cleanName = courierName.toLowerCase();
  const code = encodeURIComponent(trackingNumber.trim());
  if (!code) return undefined;
  if (cleanName.includes('steadfast')) {
    return `https://steadfast.com.bd/t/${code}`;
  }
  if (cleanName.includes('pathao')) {
    return `https://merchant.pathao.com/tracking?consignment_id=${code}`;
  }
  if (cleanName.includes('redx')) {
    return `https://redx.com.bd/track-global-parcel/?trackingId=${code}`;
  }
  if (cleanName.includes('paperfly')) {
    return `https://go.paperfly.com.bd/track/order/${code}`;
  }
  if (cleanName.includes('sundarban')) {
    return `https://tracking.sundarbancourierltd.com/?cn=${code}`;
  }
  return undefined;
}

// Real-Time Server-Sent Events (SSE) clients for instant tracking updates
interface SSEClient {
  id: string;
  orderNumber?: string;
  phone?: string;
  isAdmin?: boolean;
  res: Response;
}
const sseClients: SSEClient[] = [];

function broadcastOrderUpdate(updatedOrder: Order) {
  const hydrated = hydrateOrder(updatedOrder);
  const payload = JSON.stringify({
    type: 'ORDER_UPDATED',
    order: hydrated,
    timestamp: new Date().toISOString()
  });

  for (const client of sseClients) {
    try {
      if (client.isAdmin) {
        client.res.write(`data: ${payload}\n\n`);
      } else if (
        client.orderNumber &&
        client.orderNumber.toUpperCase() === hydrated.orderNumber.toUpperCase()
      ) {
        const orderPhone = normalizePhone(hydrated.customer.phone);
        const altPhone = hydrated.customer.altPhone
          ? normalizePhone(hydrated.customer.altPhone)
          : '';
        if (
          client.phone &&
          (client.phone === orderPhone || (altPhone && client.phone === altPhone))
        ) {
          client.res.write(`data: ${payload}\n\n`);
        }
      }
    } catch {
      // Ignore disconnected socket
    }
  }
}

function broadcastSiteStateUpdate(scope?: string) {
  const payload = JSON.stringify({
    type: 'SITE_STATE_UPDATED',
    scope: scope || 'all',
    products: db.products,
    categories: db.categories,
    settings: db.settings,
    timestamp: new Date().toISOString()
  });

  for (const client of sseClients) {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch {
      // Ignore disconnected socket
    }
  }
}

// Rate limiter per IP for public tracking verification endpoints
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function trackingRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'local';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 45; // 45 lookups per minute per IP

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  record.count += 1;
  if (record.count > maxRequests) {
    return res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      message:
        'অতিরিক্ত চেষ্টার কারণে সাময়িকভাবে বিরতি দেওয়া হয়েছে। অনুগ্রহ করে ১ মিনিট পর আবার চেষ্টা করুন।'
    });
  }
  return next();
}

// Admin authorization middleware
const ADMIN_SECRET_TOKEN = process.env.ADMIN_API_TOKEN || 'fd-admin-secure-2026';
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token =
    req.headers['x-admin-token'] ||
    req.headers['authorization']?.toString().replace('Bearer ', '') ||
    req.query.adminToken;

  if (token !== ADMIN_SECRET_TOKEN) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED_ADMIN',
      message: 'অ্যাডমিন অনুমোদন ব্যর্থ হয়েছে (Unauthorized Admin Access)।'
    });
  }
  return next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // ============================================================================
  // 1. CUSTOMER ORDER VERIFICATION & TRACKING API
  // ============================================================================
  const handleVerifyAndTrackOrder = (req: Request, res: Response) => {
    const rawOrderId = String(
      req.body?.orderNumber || req.body?.orderId || req.query?.orderNumber || req.query?.orderId || ''
    ).trim();
    const rawPhone = String(req.body?.phone || req.query?.phone || '').trim();

    if (!rawOrderId || !rawPhone) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FIELDS',
        message: 'অর্ডার ট্র্যাক করতে আপনার অর্ডার আইডি এবং অর্ডারে ব্যবহৃত মোবাইল নম্বর উভয়ই প্রদান করুন।'
      });
    }

    const cleanOrderId = rawOrderId.toUpperCase();
    const normalizedInputPhone = normalizePhone(rawPhone);

    if (!/^01[3-9]\d{8}$/.test(normalizedInputPhone)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PHONE',
        message: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01711223344)।'
      });
    }

    const matchedOrder = db.orders.find(
      (o) =>
        o.orderNumber.toUpperCase() === cleanOrderId ||
        o.id.toUpperCase() === cleanOrderId
    );

    if (!matchedOrder) {
      return res.status(404).json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: `"${rawOrderId}" অর্ডার আইডি দিয়ে আমাদের ডাটাবেসে কোনো অর্ডার পাওয়া যায়নি। অনুগ্রহ করে ইনভয়েস বা এসএমএস দেখে সঠিক অর্ডার আইডি দিন।`
      });
    }

    const orderPrimaryPhone = normalizePhone(matchedOrder.customer.phone);
    const orderAltPhone = matchedOrder.customer.altPhone
      ? normalizePhone(matchedOrder.customer.altPhone)
      : '';

    const isPhoneVerified =
      normalizedInputPhone === orderPrimaryPhone ||
      (Boolean(orderAltPhone) && normalizedInputPhone === orderAltPhone);

    if (!isPhoneVerified) {
      // Never expose another customer's order or personal info
      return res.status(403).json({
        success: false,
        code: 'PHONE_MISMATCH',
        message:
          'প্রদত্ত মোবাইল নম্বরটি এই অর্ডার আইডির সাথে মিলছে না। গ্রাহকের তথ্যের নিরাপত্তার স্বার্থে অর্ডারে ব্যবহৃত সঠিক মোবাইল নম্বরটি দিন।'
      });
    }

    const hydrated = hydrateOrder(matchedOrder);
    return res.json({
      success: true,
      order: hydrated,
      trackingHistory: hydrated.trackingHistory || [],
      courierInfo: hydrated.courierInfo || null
    });
  };

  app.post('/api/orders/verify', trackingRateLimiter, handleVerifyAndTrackOrder);
  app.get('/api/orders/track', trackingRateLimiter, handleVerifyAndTrackOrder);

  // ============================================================================
  // 2. REAL-TIME TRACKING SUBSCRIPTION (Server-Sent Events)
  // ============================================================================
  app.get('/api/orders/stream', (req: Request, res: Response) => {
    const orderNumber = String(req.query.orderNumber || '').trim().toUpperCase();
    const phone = normalizePhone(String(req.query.phone || ''));
    const adminToken = String(req.query.adminToken || '');
    const isAdmin = adminToken === ADMIN_SECRET_TOKEN;

    if (!isAdmin) {
      if (!orderNumber || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Order number and phone required for live tracking stream.'
        });
      }
      const order = db.orders.find((o) => o.orderNumber.toUpperCase() === orderNumber);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }
      const orderPhone = normalizePhone(order.customer.phone);
      const altPhone = order.customer.altPhone ? normalizePhone(order.customer.altPhone) : '';
      if (phone !== orderPhone && (!altPhone || phone !== altPhone)) {
        return res.status(403).json({ success: false, message: 'Phone verification failed.' });
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const clientId = `sse-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const client: SSEClient = {
      id: clientId,
      orderNumber,
      phone,
      isAdmin,
      res
    };
    sseClients.push(client);

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId })}\n\n`);

    req.on('close', () => {
      const idx = sseClients.findIndex((c) => c.id === clientId);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
  });

  // ============================================================================
  // 3. CREATE NEW ORDER API (Customer Checkout)
  // ============================================================================
  app.post('/api/orders', (req: Request, res: Response) => {
    try {
      const body = req.body;
      if (!body || !body.customer || !body.customer.fullName || !body.customer.phone || !Array.isArray(body.items) || body.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'অর্ডার তৈরির জন্য গ্রাহকের নাম, মোবাইল নম্বর এবং অন্তত ১টি পণ্য আবশ্যক।'
        });
      }

      const normalizedPhone = normalizePhone(body.customer.phone);
      if (!/^01[3-9]\d{8}$/.test(normalizedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।'
        });
      }

      const now = new Date().toISOString();
      const orderId = body.id || `ord-${Date.now()}`;
      const orderNumber =
        body.orderNumber &&
        !db.orders.some((o) => o.orderNumber.toUpperCase() === String(body.orderNumber).toUpperCase())
          ? String(body.orderNumber).toUpperCase()
          : generateUniqueOrderNumber();

      // Default estimated delivery: 3 days for Dhaka, 5 days outside Dhaka
      const isDhaka =
        String(body.customer.district || '').toLowerCase().includes('ঢাকা') ||
        String(body.customer.district || '').toLowerCase().includes('dhaka');
      const estDate = new Date(Date.now() + (isDhaka ? 3 : 5) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const initialTrackingEvent: OrderTrackingHistory = {
        id: `trk-${Date.now()}-1`,
        orderId,
        orderNumber,
        status: 'Pending',
        timestamp: now,
        note: 'অর্ডারটি সফলভাবে গৃহীত হয়েছে এবং ভেরিফিকেশনের জন্য অপেক্ষমান রয়েছে।',
        location: 'অনলাইন স্টোর (Fashion Doniya BD)',
        updatedBy: 'Customer'
      };

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        customer: {
          fullName: String(body.customer.fullName).trim(),
          phone: normalizedPhone,
          altPhone: body.customer.altPhone ? normalizePhone(body.customer.altPhone) : undefined,
          district: String(body.customer.district || 'ঢাকা').trim(),
          upazila: String(body.customer.upazila || '').trim(),
          area: String(body.customer.area || '').trim(),
          fullAddress: String(body.customer.fullAddress || '').trim(),
          deliveryNotes: body.customer.deliveryNotes ? String(body.customer.deliveryNotes).trim() : undefined
        },
        items: body.items,
        subtotal: Number(body.subtotal) || 0,
        deliveryCharge: Number(body.deliveryCharge) || 0,
        discount: Number(body.discount) || 0,
        couponCode: body.couponCode ? String(body.couponCode) : undefined,
        grandTotal: Number(body.grandTotal) || 0,
        paymentMethod: body.paymentMethod || 'cod',
        paymentDetails:
          (body.paymentMethod === 'bkash' || body.paymentMethod === 'nagad' || body.paymentMethod === 'bKash' || body.paymentMethod === 'Nagad') &&
          body.paymentDetails
            ? {
                receiverNumber: String(body.paymentDetails.receiverNumber || '').trim(),
                senderNumber: normalizePhone(String(body.paymentDetails.senderNumber || '')),
                trxId: String(body.paymentDetails.trxId || '').trim().toUpperCase(),
                accountType: body.paymentDetails.accountType || 'Personal'
              }
            : undefined,
        paymentStatus:
          body.paymentStatus ||
          (body.paymentMethod === 'bkash' || body.paymentMethod === 'nagad'
            ? 'pending_verification'
            : 'unpaid'),
        orderStatus: 'Pending',
        createdAt: now,
        updatedAt: now,
        estimatedDeliveryDate: estDate,
        trackingHistory: [initialTrackingEvent],
        statusHistory: [initialTrackingEvent]
      };

      db.orders.unshift(newOrder);
      db.order_tracking_history.push(initialTrackingEvent);
      saveDatabase(db);

      const hydrated = hydrateOrder(newOrder);
      broadcastOrderUpdate(hydrated);

      return res.status(201).json({
        success: true,
        order: hydrated
      });
    } catch (err) {
      console.error('Error creating order:', err);
      return res.status(500).json({
        success: false,
        message: 'অর্ডার সংরক্ষণে সার্ভার ত্রুটি ঘটেছে।'
      });
    }
  });

  // Sync client localStorage orders into backend DB so no orders are ever lost
  app.post('/api/orders/sync-client', (req: Request, res: Response) => {
    const legacyDemoOrderNums = new Set(['FD-2026-1042', 'FD-2026-1038', 'FD-2026-1025']);
    const clientOrders: Order[] = Array.isArray(req.body?.orders) ? req.body.orders : [];
    let changed = false;

    for (const co of clientOrders) {
      if (!co || !co.orderNumber || !co.customer?.phone) continue;
      if (legacyDemoOrderNums.has(co.orderNumber.toUpperCase())) continue;
      const exists = db.orders.some(
        (o) => o.orderNumber.toUpperCase() === co.orderNumber.toUpperCase() || o.id === co.id
      );
      if (!exists) {
        db.orders.unshift(co);
        const histList = co.trackingHistory || co.statusHistory || [];
        for (let i = 0; i < histList.length; i++) {
          const h = histList[i];
          db.order_tracking_history.push({
            id: h.id || `trk-${co.id}-${i}`,
            orderId: co.id,
            orderNumber: co.orderNumber,
            status: h.status,
            timestamp: h.timestamp,
            note: h.note,
            location: h.location || 'অনলাইন স্টোর',
            updatedBy: (h.updatedBy as any) || 'Customer'
          });
        }
        if (co.courierInfo) {
          db.courier_information.push(co.courierInfo);
        }
        changed = true;
      }
    }

    if (changed) {
      saveDatabase(db);
    }

    return res.json({
      success: true,
      orders: db.orders.map(hydrateOrder),
      order_tracking_history: db.order_tracking_history,
      courier_information: db.courier_information
    });
  });

  // ============================================================================
  // 4. ADMIN ORDER MANAGEMENT & TRACKING APIs
  // ============================================================================
  app.get('/api/admin/orders', requireAdminAuth, (req: Request, res: Response) => {
    const search = String(req.query.search || '').trim().toLowerCase();
    const orderIdFilter = String(req.query.orderId || '').trim().toLowerCase();
    const phoneFilter = normalizePhone(String(req.query.phone || ''));
    const statusFilter = String(req.query.status || 'all').trim();

    let results = db.orders.map(hydrateOrder);

    if (statusFilter && statusFilter !== 'all') {
      results = results.filter((o) => o.orderStatus === statusFilter);
    }

    if (orderIdFilter) {
      results = results.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(orderIdFilter) ||
          o.id.toLowerCase().includes(orderIdFilter)
      );
    }

    if (phoneFilter) {
      results = results.filter((o) => {
        const p1 = normalizePhone(o.customer.phone);
        const p2 = o.customer.altPhone ? normalizePhone(o.customer.altPhone) : '';
        return p1.includes(phoneFilter) || p2.includes(phoneFilter);
      });
    }

    if (search) {
      const normalizedSearchPhone = normalizePhone(search);
      results = results.filter((o) => {
        const matchOrderNum = o.orderNumber.toLowerCase().includes(search);
        const matchName = o.customer.fullName.toLowerCase().includes(search);
        const matchPhone =
          o.customer.phone.includes(search) ||
          (normalizedSearchPhone.length >= 4 &&
            normalizePhone(o.customer.phone).includes(normalizedSearchPhone));
        const matchTracking =
          o.courierInfo?.trackingNumber?.toLowerCase().includes(search) || false;
        return matchOrderNum || matchName || matchPhone || matchTracking;
      });
    }

    return res.json({
      success: true,
      orders: results,
      order_tracking_history: db.order_tracking_history,
      courier_information: db.courier_information
    });
  });

  // Update Order Status (Admin) + Automatically create timestamped order_tracking_history record
  app.patch('/api/admin/orders/:id/status', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const status = req.body?.status as OrderStatus;
    const note = String(req.body?.note || '').trim();
    const location = String(req.body?.location || '').trim();
    const estimatedDeliveryDate = req.body?.estimatedDeliveryDate
      ? String(req.body.estimatedDeliveryDate).trim()
      : undefined;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `অবৈধ অর্ডার স্ট্যাটাস। অনুমোদিত স্ট্যাটাসসমূহ: ${VALID_STATUSES.join(', ')}`
      });
    }

    const order = db.orders.find(
      (o) => o.id === id || o.orderNumber.toUpperCase() === id.toUpperCase()
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।'
      });
    }

    const defaultStatusNotes: Record<OrderStatus, string> = {
      Pending: 'অর্ডারটি সিস্টেমে অপেক্ষমান (Pending) অবস্থায় রয়েছে।',
      Confirmed: 'গ্রাহকের সাথে ফোনে কথা বলে অর্ডারটি নিশ্চিত (Confirmed) করা হয়েছে।',
      Processing: 'ফেব্রিক রোল থেকে সঠিক মাপে কাটিং, ফিনিশিং ও কোয়ালিটি চেক চলছে।',
      Shipped: order.courierInfo?.courierName
        ? `পার্সেলটি ${order.courierInfo.courierName}-এ হস্তান্তর করা হয়েছে (ট্র্যাকিং: ${order.courierInfo.trackingNumber})।`
        : 'পার্সেলটি ডেলিভারির জন্য কুরিয়ার সার্ভিসে হস্তান্তর করা হয়েছে।',
      'Out for Delivery': 'ডেলিভারি রাইডার পার্সেলটি নিয়ে গ্রাহকের ঠিকানায় রওনা হয়েছেন।',
      Delivered: 'অর্ডারটি সফলভাবে গ্রাহকের কাছে ডেলিভারি সম্পন্ন হয়েছে।',
      Cancelled: 'অর্ডারটি বাতিল (Cancelled) করা হয়েছে।',
      Returned: 'পার্সেলটি রিটার্ন (Returned) হিসেবে ওয়্যারহাউসে ফেরত এসেছে।'
    };

    const now = new Date().toISOString();
    order.orderStatus = status;
    order.updatedAt = now;
    if (estimatedDeliveryDate !== undefined) {
      order.estimatedDeliveryDate = estimatedDeliveryDate;
    }
    if (status === 'Delivered') {
      order.paymentStatus = 'Paid';
    }

    const historyEntry: OrderTrackingHistory = {
      id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status,
      timestamp: now,
      note: note || defaultStatusNotes[status],
      location: location || 'Fashion Doniya BD অপারেশন সেন্টার',
      updatedBy: 'Admin'
    };

    db.order_tracking_history.push(historyEntry);
    saveDatabase(db);

    const hydrated = hydrateOrder(order);
    broadcastOrderUpdate(hydrated);

    return res.json({
      success: true,
      order: hydrated,
      historyEntry
    });
  });

  // Add standalone tracking history note / event (Admin)
  app.post('/api/admin/orders/:id/tracking', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const note = String(req.body?.note || '').trim();
    const location = String(req.body?.location || '').trim();
    const status = (req.body?.status as OrderStatus) || undefined;

    if (!note) {
      return res.status(400).json({
        success: false,
        message: 'ট্র্যাকিং নোট লিখুন।'
      });
    }

    const order = db.orders.find(
      (o) => o.id === id || o.orderNumber.toUpperCase() === id.toUpperCase()
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।'
      });
    }

    const now = new Date().toISOString();
    const effectiveStatus =
      status && VALID_STATUSES.includes(status) ? status : order.orderStatus;

    if (effectiveStatus !== order.orderStatus) {
      order.orderStatus = effectiveStatus;
      if (effectiveStatus === 'Delivered') {
        order.paymentStatus = 'Paid';
      }
    }
    order.updatedAt = now;

    const historyEntry: OrderTrackingHistory = {
      id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: effectiveStatus,
      timestamp: now,
      note,
      location: location || 'Fashion Doniya BD ডেস্ক',
      updatedBy: 'Admin'
    };

    db.order_tracking_history.push(historyEntry);
    saveDatabase(db);

    const hydrated = hydrateOrder(order);
    broadcastOrderUpdate(hydrated);

    return res.json({
      success: true,
      order: hydrated,
      historyEntry
    });
  });

  // Save or Update Courier Information (Admin)
  app.put('/api/admin/orders/:id/courier', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const courierName = String(req.body?.courierName || '').trim();
    const trackingNumber = String(req.body?.trackingNumber || '').trim();
    const consignmentId = req.body?.consignmentId ? String(req.body.consignmentId).trim() : undefined;
    const estimatedDeliveryDate = req.body?.estimatedDeliveryDate
      ? String(req.body.estimatedDeliveryDate).trim()
      : undefined;
    const customTrackingUrl = req.body?.trackingUrl ? String(req.body.trackingUrl).trim() : undefined;
    const courierStatus = req.body?.courierStatus ? String(req.body.courierStatus).trim() : undefined;
    const autoMarkShipped = Boolean(req.body?.autoMarkShipped);
    const note = req.body?.note ? String(req.body.note).trim() : '';

    if (!courierName || !trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'কুরিয়ার কোম্পানির নাম এবং ট্র্যাকিং নম্বর উভয়ই আবশ্যক।'
      });
    }

    const order = db.orders.find(
      (o) => o.id === id || o.orderNumber.toUpperCase() === id.toUpperCase()
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।'
      });
    }

    const now = new Date().toISOString();
    const trackingUrl = customTrackingUrl || buildCourierTrackingUrl(courierName, trackingNumber);
    const isSupportedCourier = /steadfast|pathao|redx|paperfly|sundarban/i.test(courierName);

    const existingCourierIdx = db.courier_information.findIndex(
      (c) => c.orderId === order.id || c.orderNumber.toUpperCase() === order.orderNumber.toUpperCase()
    );

    const courierRecord: CourierInformation = {
      id: existingCourierIdx >= 0 ? db.courier_information[existingCourierIdx].id : `cr-${Date.now()}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      courierName,
      trackingNumber,
      consignmentId: consignmentId || trackingNumber,
      estimatedDeliveryDate: estimatedDeliveryDate || order.estimatedDeliveryDate,
      trackingUrl,
      courierStatus: courierStatus || 'Booked / Handed over to Courier',
      lastSyncedAt: now,
      isApiConnected: isSupportedCourier,
      updatedAt: now
    };

    if (existingCourierIdx >= 0) {
      db.courier_information[existingCourierIdx] = courierRecord;
    } else {
      db.courier_information.push(courierRecord);
    }

    if (estimatedDeliveryDate) {
      order.estimatedDeliveryDate = estimatedDeliveryDate;
    }
    if (autoMarkShipped && (order.orderStatus === 'Pending' || order.orderStatus === 'Confirmed' || order.orderStatus === 'Processing')) {
      order.orderStatus = 'Shipped';
    }
    order.updatedAt = now;

    const historyEntry: OrderTrackingHistory = {
      id: `trk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      timestamp: now,
      note:
        note ||
        `কুরিয়ার তথ্য যুক্ত করা হয়েছে: ${courierName} (ট্র্যাকিং নম্বর: ${trackingNumber})${
          estimatedDeliveryDate ? ` · সম্ভাব্য ডেলিভারি: ${estimatedDeliveryDate}` : ''
        }`,
      location: `${courierName} হাব`,
      updatedBy: 'Admin'
    };

    db.order_tracking_history.push(historyEntry);
    saveDatabase(db);

    const hydrated = hydrateOrder(order);
    broadcastOrderUpdate(hydrated);

    return res.json({
      success: true,
      order: hydrated,
      courierInfo: courierRecord,
      historyEntry
    });
  });

  // Update Payment Status (Admin)
  app.patch('/api/admin/orders/:id/payment', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const paymentStatus = req.body?.paymentStatus as PaymentStatus;
    if (!['Pending', 'Paid', 'Failed', 'pending_verification', 'unpaid'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'অবৈধ পেমেন্ট স্ট্যাটাস।'
      });
    }

    const order = db.orders.find(
      (o) => o.id === id || o.orderNumber.toUpperCase() === id.toUpperCase()
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।'
      });
    }

    const now = new Date().toISOString();
    order.paymentStatus = paymentStatus;
    order.updatedAt = now;

    saveDatabase(db);
    const hydrated = hydrateOrder(order);
    broadcastOrderUpdate(hydrated);

    return res.json({
      success: true,
      order: hydrated
    });
  });

  // Dynamic Payment Settings API (Public GET + Admin PUT)
  app.get('/api/payment-settings', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      paymentSettings: db.payment_settings
    });
  });

  app.put('/api/admin/payment-settings', requireAdminAuth, (req: Request, res: Response) => {
    const incoming = req.body?.paymentSettings || req.body;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'পেমেন্ট সেটিংস ডাটা সঠিক নয়।'
      });
    }

    db.payment_settings = {
      bkash: {
        ...db.payment_settings.bkash,
        ...(incoming.bkash || {})
      },
      nagad: {
        ...db.payment_settings.nagad,
        ...(incoming.nagad || {})
      },
      cod: {
        ...db.payment_settings.cod,
        ...(incoming.cod || {})
      }
    };
    saveDatabase(db);

    return res.json({
      success: true,
      paymentSettings: db.payment_settings
    });
  });

  // ============================================================================
  // 5. COURIER API WEBHOOK & SYNCHRONIZATION ENDPOINTS
  // ============================================================================
  const COURIER_WEBHOOK_SECRET = process.env.COURIER_WEBHOOK_SECRET || 'fd-courier-webhook-2026';

  const mapCourierStatusToOrderStatus = (rawCourierStatus: string, currentStatus: OrderStatus): OrderStatus => {
    const s = rawCourierStatus.toLowerCase();
    if (s.includes('deliver') && !s.includes('out')) return 'Delivered';
    if (s.includes('out_for_delivery') || s.includes('out for delivery') || s.includes('assigned_for_delivery')) {
      return 'Out for Delivery';
    }
    if (s.includes('return')) return 'Returned';
    if (s.includes('cancel')) return 'Cancelled';
    if (s.includes('transit') || s.includes('shipped') || s.includes('picked') || s.includes('hub')) {
      return 'Shipped';
    }
    return currentStatus;
  };

  // Authenticated webhook endpoint for Steadfast / Pathao / RedX / Paperfly shipment updates
  app.post('/api/courier/webhook', (req: Request, res: Response) => {
    const secret =
      req.headers['x-courier-webhook-secret'] ||
      req.headers['x-Admin-Token'] ||
      req.headers['x-admin-token'] ||
      req.body?.webhookSecret;

    if (secret !== COURIER_WEBHOOK_SECRET && secret !== ADMIN_SECRET_TOKEN) {
      return res.status(401).json({
        success: false,
        message: 'Invalid courier webhook signature or secret.'
      });
    }

    const {
      orderNumber,
      trackingNumber,
      courierStatus,
      note,
      location
    } = req.body || {};

    if (!orderNumber && !trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'orderNumber or trackingNumber is required in webhook payload.'
      });
    }

    const courierRec = db.courier_information.find(
      (c) =>
        (trackingNumber && c.trackingNumber.toUpperCase() === String(trackingNumber).toUpperCase()) ||
        (orderNumber && c.orderNumber.toUpperCase() === String(orderNumber).toUpperCase())
    );

    const order = db.orders.find(
      (o) =>
        (orderNumber && o.orderNumber.toUpperCase() === String(orderNumber).toUpperCase()) ||
        (courierRec && o.id === courierRec.orderId)
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Matching order not found for courier webhook.'
      });
    }

    const now = new Date().toISOString();
    const mappedStatus = mapCourierStatusToOrderStatus(
      String(courierStatus || ''),
      order.orderStatus
    );

    order.orderStatus = mappedStatus;
    order.updatedAt = now;
    if (mappedStatus === 'Delivered') {
      order.paymentStatus = 'Paid';
    }

    if (courierRec) {
      courierRec.courierStatus = String(courierStatus || mappedStatus);
      courierRec.lastSyncedAt = now;
      courierRec.updatedAt = now;
    }

    const historyEntry: OrderTrackingHistory = {
      id: `trk-wh-${Date.now()}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: mappedStatus,
      timestamp: now,
      note:
        note ||
        `কুরিয়ার সিঙ্ক আপডেট (${courierRec?.courierName || 'Courier'}): ${
          courierStatus || mappedStatus
        }`,
      location: location || `${courierRec?.courierName || 'কুরিয়ার'} হাব`,
      updatedBy: 'Courier API'
    };

    db.order_tracking_history.push(historyEntry);
    saveDatabase(db);

    const hydrated = hydrateOrder(order);
    broadcastOrderUpdate(hydrated);

    return res.json({
      success: true,
      order: hydrated,
      historyEntry
    });
  });

  // Synchronize courier status for an order (Admin or Scheduled Sync)
  app.post('/api/courier/sync/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const simulatedCourierStatus = req.body?.courierStatus
      ? String(req.body.courierStatus).trim()
      : undefined;
    const customLocation = req.body?.location ? String(req.body.location).trim() : undefined;

    const order = db.orders.find(
      (o) => o.id === id || o.orderNumber.toUpperCase() === id.toUpperCase()
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।'
      });
    }

    const courierRec = db.courier_information.find(
      (c) => c.orderId === order.id || c.orderNumber.toUpperCase() === order.orderNumber.toUpperCase()
    );

    if (!courierRec) {
      return res.status(400).json({
        success: false,
        message: 'এই অর্ডারে এখনো কোনো কুরিয়ার তথ্য যুক্ত করা হয়নি। প্রথমে কুরিয়ার ও ট্র্যাকিং নম্বর সংরক্ষণ করুন।'
      });
    }

    const now = new Date().toISOString();
    courierRec.lastSyncedAt = now;
    courierRec.updatedAt = now;

    let historyEntry: OrderTrackingHistory | null = null;

    if (simulatedCourierStatus) {
      const nextStatus = mapCourierStatusToOrderStatus(simulatedCourierStatus, order.orderStatus);
      order.orderStatus = nextStatus;
      order.updatedAt = now;
      if (nextStatus === 'Delivered') {
        order.paymentStatus = 'Paid';
      }
      courierRec.courierStatus = simulatedCourierStatus;

      const statusDescriptions: Record<string, string> = {
        'Picked Up by Courier': `কুরিয়ার এজেন্ট (${courierRec.courierName}) পার্সেলটি পিকআপ করেছেন এবং সর্টিং হাবে পাঠিয়েছেন।`,
        'In Transit to Destination Hub': `পার্সেলটি ${courierRec.courierName}-এর মাধ্যমে গন্তব্য জেলা হাবের পথে রয়েছে।`,
        'Out for Delivery': `${courierRec.courierName}-এর ডেলিভারি রাইডার পার্সেলটি নিয়ে গ্রাহকের ঠিকানায় ডেলিভারির পথে রয়েছেন।`,
        Delivered: `${courierRec.courierName} নিশ্চিত করেছে যে পার্সেলটি গ্রাহকের কাছে সফলভাবে ডেলিভারি করা হয়েছে।`,
        Returned: `গ্রাহক পার্সেলটি গ্রহণ না করায় বা ঠিকানা সমস্যায় ${courierRec.courierName} পার্সেলটি রিটার্ন হিসেবে চিহ্নিত করেছে।`
      };

      historyEntry = {
        id: `trk-sync-${Date.now()}`,
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: nextStatus,
        timestamp: now,
        note:
          statusDescriptions[simulatedCourierStatus] ||
          `${courierRec.courierName} স্ট্যাটাস সিঙ্ক: ${simulatedCourierStatus}`,
        location: customLocation || `${courierRec.courierName} (${order.customer.district} হাব)`,
        updatedBy: 'Courier API'
      };
      db.order_tracking_history.push(historyEntry);
    }

    saveDatabase(db);
    const hydrated = hydrateOrder(order);
    broadcastOrderUpdate(hydrated);

    return res.json({
      success: true,
      order: hydrated,
      courierInfo: courierRec,
      historyEntry
    });
  });

  // ============================================================================
  // 6. FABRIC COLLECTIONS (3.5 BAHAR & 2.5 BAHAR) DATABASE & ADMIN ENDPOINTS
  //    Tables: fabric_sections, fabric_categories, fabric_category_design_settings
  // ============================================================================
  const buildFabricCollectionsPayload = (): FabricCollectionsDatabaseState => ({
    fabric_sections: db.fabric_sections,
    fabric_categories: db.fabric_categories,
    fabric_category_design_settings: db.fabric_category_design_settings,
    drafts: db.fabric_collection_drafts,
    previous_published: db.fabric_collection_previous_published,
    has_unpushed_draft: db.fabric_collection_has_unpushed_draft
  });

  // Public & Admin GET: returns fabric_sections, fabric_categories, fabric_category_design_settings
  app.get('/api/fabric-collections', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      data: buildFabricCollectionsPayload()
    });
  });

  // Admin PUT Draft: saves draft changes for '3.5_bahar' or '2.5_bahar' without publishing live yet
  app.put(
    '/api/admin/fabric-collections/:collectionType/draft',
    requireAdminAuth,
    (req: Request, res: Response) => {
      const collectionType = req.params.collectionType as FabricCollectionType;
      if (collectionType !== '3.5_bahar' && collectionType !== '2.5_bahar') {
        return res.status(400).json({
          success: false,
          message: 'Invalid collection_type. Must be 3.5_bahar or 2.5_bahar.'
        });
      }

      const { section, categories, designSettings } = req.body || {};
      const now = new Date().toISOString();

      const currentDraft = db.fabric_collection_drafts[collectionType];
      const nextDraft: FabricCollectionSnapshot = {
        section: section
          ? { ...section, collection_type: collectionType, updatedAt: now }
          : currentDraft.section,
        categories: Array.isArray(categories)
          ? categories
              .map((cat: FabricCategoryRecord, idx: number) => ({
                ...cat,
                collection_type: collectionType,
                order: typeof cat.order === 'number' ? cat.order : idx + 1,
                updatedAt: now
              }))
              .sort((a: FabricCategoryRecord, b: FabricCategoryRecord) => a.order - b.order)
          : currentDraft.categories,
        designSettings: designSettings
          ? { ...designSettings, collection_type: collectionType, updatedAt: now }
          : currentDraft.designSettings,
        savedAt: now
      };

      db.fabric_collection_drafts[collectionType] = nextDraft;
      db.fabric_collection_has_unpushed_draft[collectionType] = true;
      saveDatabase(db);

      return res.json({
        success: true,
        collectionType,
        draft: nextDraft,
        data: buildFabricCollectionsPayload()
      });
    }
  );

  // Admin POST Publish: publishes draft (or provided snapshot) to live database tables
  app.post(
    '/api/admin/fabric-collections/:collectionType/publish',
    requireAdminAuth,
    (req: Request, res: Response) => {
      const collectionType = req.params.collectionType as FabricCollectionType;
      if (collectionType !== '3.5_bahar' && collectionType !== '2.5_bahar') {
        return res.status(400).json({
          success: false,
          message: 'Invalid collection_type. Must be 3.5_bahar or 2.5_bahar.'
        });
      }

      const now = new Date().toISOString();

      // Store current live state into previous_published so Admin can revert anytime
      const previousLiveSnapshot: FabricCollectionSnapshot = {
        section: JSON.parse(JSON.stringify(db.fabric_sections[collectionType])),
        categories: JSON.parse(JSON.stringify(db.fabric_categories[collectionType])),
        designSettings: JSON.parse(JSON.stringify(db.fabric_category_design_settings[collectionType])),
        savedAt: now
      };
      db.fabric_collection_previous_published[collectionType] = previousLiveSnapshot;

      const { section, categories, designSettings } = req.body || {};
      const draftSource = db.fabric_collection_drafts[collectionType];

      const publishedSection: FabricSectionRecord = section
        ? { ...section, collection_type: collectionType, updatedAt: now }
        : { ...draftSource.section, collection_type: collectionType, updatedAt: now };

      const publishedCategories: FabricCategoryRecord[] = (
        Array.isArray(categories) ? categories : draftSource.categories
      )
        .map((cat: FabricCategoryRecord, idx: number) => ({
          ...cat,
          collection_type: collectionType,
          order: typeof cat.order === 'number' ? cat.order : idx + 1,
          updatedAt: now
        }))
        .sort((a: FabricCategoryRecord, b: FabricCategoryRecord) => a.order - b.order);

      const publishedDesign: FabricCategoryDesignSettingsRecord = designSettings
        ? { ...designSettings, collection_type: collectionType, updatedAt: now }
        : { ...draftSource.designSettings, collection_type: collectionType, updatedAt: now };

      // Write to live tables
      db.fabric_sections[collectionType] = publishedSection;
      db.fabric_categories[collectionType] = publishedCategories;
      db.fabric_category_design_settings[collectionType] = publishedDesign;

      // Sync draft with newly published state
      db.fabric_collection_drafts[collectionType] = {
        section: JSON.parse(JSON.stringify(publishedSection)),
        categories: JSON.parse(JSON.stringify(publishedCategories)),
        designSettings: JSON.parse(JSON.stringify(publishedDesign)),
        savedAt: now
      };
      db.fabric_collection_has_unpushed_draft[collectionType] = false;

      saveDatabase(db);

      return res.json({
        success: true,
        collectionType,
        data: buildFabricCollectionsPayload()
      });
    }
  );

  // Admin POST Revert: reverts to previously published settings (or factory defaults if requested)
  app.post(
    '/api/admin/fabric-collections/:collectionType/revert',
    requireAdminAuth,
    (req: Request, res: Response) => {
      const collectionType = req.params.collectionType as FabricCollectionType;
      if (collectionType !== '3.5_bahar' && collectionType !== '2.5_bahar') {
        return res.status(400).json({
          success: false,
          message: 'Invalid collection_type. Must be 3.5_bahar or 2.5_bahar.'
        });
      }

      const resetToFactory = Boolean(req.body?.resetToFactory);
      const prev = db.fabric_collection_previous_published[collectionType];
      const defaults = createInitialFabricCollectionsState();
      const now = new Date().toISOString();

      const targetSnapshot: FabricCollectionSnapshot =
        !resetToFactory && prev
          ? prev
          : {
              section: defaults.fabric_sections[collectionType],
              categories: defaults.fabric_categories[collectionType],
              designSettings: defaults.fabric_category_design_settings[collectionType],
              savedAt: now
            };

      db.fabric_sections[collectionType] = JSON.parse(JSON.stringify(targetSnapshot.section));
      db.fabric_categories[collectionType] = JSON.parse(JSON.stringify(targetSnapshot.categories));
      db.fabric_category_design_settings[collectionType] = JSON.parse(
        JSON.stringify(targetSnapshot.designSettings)
      );

      db.fabric_collection_drafts[collectionType] = {
        section: JSON.parse(JSON.stringify(targetSnapshot.section)),
        categories: JSON.parse(JSON.stringify(targetSnapshot.categories)),
        designSettings: JSON.parse(JSON.stringify(targetSnapshot.designSettings)),
        savedAt: now
      };
      db.fabric_collection_has_unpushed_draft[collectionType] = false;

      saveDatabase(db);

      return res.json({
        success: true,
        collectionType,
        data: buildFabricCollectionsPayload()
      });
    }
  );

  // ============================================================================
  // 7. AI FABRIC TO OUTFIT DESIGN GENERATOR API
  // ============================================================================
  const aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const AI_CATEGORY_CONFIGS: Record<
    string,
    {
      nameBn: string;
      nameEn: string;
      descBn: string;
      yards35: number;
      yards25: number;
      prompt: string;
    }
  > = {
    short_kameez: {
      nameBn: 'শর্ট কামিজ',
      nameEn: 'Short Kameez',
      descBn: 'ট্রেন্ডি থাই-লেন্থ কাট, সাইড স্লিট ও ৩/৪ হাতা',
      yards35: 1.5,
      yards25: 2.0,
      prompt: `Professional high-end fashion studio product photography of a single, standalone Short Kameez (women's ethnic tunic, thigh-length cut, tailored round neckline with subtle button slit, side slits, three-quarter sleeves). 
FABRIC MAPPING INSTRUCTION: The garment is tailored strictly from the EXACT uploaded fabric in the input image. Meticulously preserve the authentic textile weave, prints, motifs, color shades, embroidery, and surface texture from the reference fabric, wrapping them naturally along the seams, sleeves, and chest folds.
PRODUCT DISPLAY RULES: Isolated ghost-mannequin catalog display only. Absolutely NO human models, NO faces, NO heads, NO limbs, NO mannequins, NO bodies. Show ONLY the complete tailored short kameez garment suspended with 3D volume on a pure neutral off-white studio background with soft ambient natural drop shadow.`
    },
    long_kameez: {
      nameBn: 'লং কামিজ',
      nameEn: 'Long Kameez',
      descBn: 'ঐতিহ্যবাহী স্ট্রেইট লং ও মার্জিত কাট',
      yards35: 2.0,
      yards25: 2.5,
      prompt: `Professional high-end fashion studio product photography of an elegant traditional Bangladeshi Long Kameez (calf-length straight cut, modest graceful neckline, full sleeves, clean tailored hem).
FABRIC MAPPING INSTRUCTION: The garment is crafted entirely from the EXACT textile and fabric pattern provided in the reference image. The exact colors, weaves, motifs, and texture of the uploaded fabric must be realistically mapped across the entire kameez body and sleeves with authentic physical draping.
PRODUCT DISPLAY RULES: Isolated ghost-mannequin product display. Absolutely NO human models, NO human figures, NO mannequin heads or limbs. Show ONLY the complete long kameez garment displayed in clean 3D volume on an elegant light neutral studio background with gentle soft drop shadow.`
    },
    kurti: {
      nameBn: 'কুর্তি',
      nameEn: 'Kurti',
      descBn: 'স্মার্ট ক্যাজুয়াল এ-লাইন ফ্লেয়ার্ড কুর্তি',
      yards35: 2.5,
      yards25: 3.0,
      prompt: `Professional boutique fashion catalog product photography of a contemporary South Asian A-line Kurti (stylish flared silhouette, elegant neck placket, 3/4 sleeves, flared bottom hem).
FABRIC MAPPING INSTRUCTION: The kurti is tailored using the EXACT fabric, motifs, and color palette from the reference image. Preserve the precise textile pattern density, borders, and weave characteristics across all panels of the kurti.
PRODUCT DISPLAY RULES: Isolated product display only. Zero human models, zero faces, zero mannequins, zero human bodies. Display only the complete kurti garment floating in 3D shape against a clean light studio backdrop with soft natural shadows.`
    },
    lehenga_gown: {
      nameBn: 'লেহেঙ্গা / গাউন',
      nameEn: 'Lehenga / Gown',
      descBn: 'ঘেরালো পার্টি গাউন বা ব্রাইডাল লেহেঙ্গা',
      yards35: 3.5,
      yards25: 4.5,
      prompt: `Luxury bridal & festive fashion studio product display of a magnificent floor-length flared circular Lehenga with Choli (or floor-sweeping festive Gown) with extensive umbrella flares and rich hemline pleats.
FABRIC MAPPING INSTRUCTION: The entire attire is constructed strictly from the EXACT uploaded fabric in the reference image, realistically maintaining the original fabric's color, intricate motifs, zari or embroidery, and authentic textile drape along the wide circular flare.
PRODUCT DISPLAY RULES: Clean isolated ghost-mannequin product photograph. Absolutely NO human models, NO faces, NO limbs, NO human figures. Only the complete garment displayed with full volumetric flare on a crisp light neutral backdrop with natural soft shadow.`
    },
    saree: {
      nameBn: 'শাড়ি',
      nameEn: 'Saree',
      descBn: '১২ হাত ফুল বডি শাড়ি ও ব্লাউজ পিস',
      yards35: 6.0,
      yards25: 6.0,
      prompt: `Professional luxury boutique display photography of a traditional Bangladeshi Saree (12-haat designer saree draped gracefully into elegant pleats and decorative pleated aanchal/pallu, displayed alongside a matching tailored unstitched blouse piece).
FABRIC MAPPING INSTRUCTION: The saree is crafted with the EXACT textile, motifs, color tones, and weave structure of the reference fabric image, with the pallu and body exhibiting the fabric's precise pattern and sheen.
PRODUCT DISPLAY RULES: Isolated product display styling only. Absolutely NO human models, NO faces, NO mannequin heads or figures. The saree is artfully pleated and arranged in a clean catalog display on a soft off-white backdrop with gentle studio lighting and subtle shadows.`
    },
    long_koti: {
      nameBn: 'লং কটি',
      nameEn: 'Long Koti',
      descBn: 'ওপেন-ফ্রন্ট ম্যান্ডারিন কলার ওভারলে শ্রাগ',
      yards35: 3.5,
      yards25: 4.5,
      prompt: `Professional fashion product photography of an ethnic Long Koti / Shrug (long open-front overlay jacket, tailored mandarin band collar, straight structured long fall).
FABRIC MAPPING INSTRUCTION: The koti is tailored exclusively from the EXACT fabric from the reference image, showcasing the fabric's specific print, jacquard or embroidery pattern, texture, and colors faithfully.
PRODUCT DISPLAY RULES: Isolated ghost-mannequin fashion display. Absolutely NO human models, NO faces, NO mannequins, NO body parts. Only the standalone long koti garment displayed in 3D volume on a clean light studio background with soft natural ambient shadow.`
    }
  };

  async function resolveImageBytes(imageRef: string): Promise<{ base64Data: string; mimeType: string } | null> {
    if (!imageRef || typeof imageRef !== 'string') return null;
    const trimmed = imageRef.trim();
    if (trimmed.startsWith('data:')) {
      const match = trimmed.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return { mimeType: match[1], base64Data: match[2] };
      }
    }
    if (trimmed.startsWith('/')) {
      const publicPath = path.join(__dirname, 'public', trimmed);
      if (fs.existsSync(publicPath)) {
        const fileBuf = await fs.promises.readFile(publicPath);
        const ext = path.extname(publicPath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        return { mimeType, base64Data: fileBuf.toString('base64') };
      }
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const resp = await fetch(trimmed);
        if (resp.ok) {
          const arrBuf = await resp.arrayBuffer();
          const buffer = Buffer.from(arrBuf);
          const mimeType = resp.headers.get('content-type') || 'image/jpeg';
          return { mimeType, base64Data: buffer.toString('base64') };
        }
      } catch (e) {
        console.warn('Failed to fetch remote fabric image for Gemini:', e);
      }
    }

    // Check if imageRef corresponds to a file in public/assets or public/
    const possiblePaths = [
      path.join(__dirname, 'public', 'assets', trimmed),
      path.join(__dirname, 'public', 'assets', trimmed + '.png'),
      path.join(__dirname, 'public', 'assets', trimmed + '.jpg'),
      path.join(__dirname, 'public', 'assets', 'aistudio', trimmed),
      path.join(__dirname, 'public', 'assets', 'aistudio', trimmed + '.png'),
      path.join(__dirname, 'public', 'assets', 'categories', trimmed + '.png'),
      path.join(__dirname, 'public', trimmed),
      path.join(__dirname, 'public', trimmed + '.png')
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          const stat = await fs.promises.stat(p);
          if (stat.isFile()) {
            const fileBuf = await fs.promises.readFile(p);
            const ext = path.extname(p).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
            return { mimeType, base64Data: fileBuf.toString('base64') };
          }
        } catch {
          // ignore
        }
      }
    }

    // Check if trimmed itself is a valid raw base64 string
    const sanitized = trimmed.replace(/\s+/g, '');
    const isBase64 = sanitized.length > 100 && sanitized.length % 4 === 0 && /^[A-Za-z0-9+/=]+$/.test(sanitized);
    if (isBase64) {
      return { mimeType: 'image/jpeg', base64Data: sanitized };
    }

    // If it's a symbolic name like "saree_floral_1", return null so Gemini is not called with invalid bytes
    return null;
  }

  let geminiImageQuotaExhausted = false;

  async function generateOutfitWithGemini(
    fabricDataUri: string,
    categoryKey: string
  ): Promise<string | null> {
    if (!process.env.GEMINI_API_KEY || geminiImageQuotaExhausted) return null;
    const resolved = await resolveImageBytes(fabricDataUri);
    if (!resolved || !resolved.base64Data) {
      return null;
    }
    const { base64Data, mimeType } = resolved;
    const cfg = AI_CATEGORY_CONFIGS[categoryKey];
    if (!cfg) return null;

    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || 'image/jpeg'
              }
            },
            {
              text: cfg.prompt
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: '3:4'
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${part.inlineData.data}`;
        }
      }
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      if (
        err?.status === 429 ||
        err?.code === 429 ||
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('Quota exceeded')
      ) {
        geminiImageQuotaExhausted = true;
      }
    }
    return null;
  }

  app.get('/api/ai/status', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      categories: Object.keys(AI_CATEGORY_CONFIGS)
    });
  });

  app.post('/api/ai/fabric-to-outfit', async (req: Request, res: Response) => {
    try {
      const { fabricImage, categories } = req.body || {};
      if (!fabricImage || typeof fabricImage !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'অনুগ্রহ করে একটি কাপড়ের ছবি প্রদান করুন।'
        });
      }

      const requestedKeys: string[] = Array.isArray(categories) && categories.length > 0
        ? categories
        : Object.keys(AI_CATEGORY_CONFIGS);

      const designs = [];
      for (const catKey of requestedKeys) {
        const cfg = AI_CATEGORY_CONFIGS[catKey];
        if (!cfg) continue;

        let generatedImage: string | null = null;
        if (process.env.GEMINI_API_KEY) {
          generatedImage = await generateOutfitWithGemini(fabricImage, catKey);
        }

        designs.push({
          id: `outfit-${catKey}-${Date.now()}`,
          categoryKey: catKey,
          categoryNameBn: cfg.nameBn,
          categoryNameEn: cfg.nameEn,
          descriptionBn: cfg.descBn,
          suggestedYards35: cfg.yards35,
          suggestedYards25: cfg.yards25,
          imageUrl: generatedImage || fabricImage,
          isAiGenerated: Boolean(generatedImage),
          generatedAt: new Date().toISOString()
        });
      }

      return res.json({
        success: true,
        designs
      });
    } catch (err: any) {
      console.error('Error generating AI outfits:', err);
      return res.status(500).json({
        success: false,
        message: 'এআই আউটফিট তৈরিতে সার্ভার ত্রুটি ঘটেছে।'
      });
    }
  });

  app.post('/api/ai/fabric-to-outfit/single', async (req: Request, res: Response) => {
    try {
      const { fabricImage, category } = req.body || {};
      const cfg = AI_CATEGORY_CONFIGS[category];
      if (!fabricImage || !cfg) {
        return res.status(400).json({
          success: false,
          message: 'কাপড়ের ছবি এবং সঠিক ক্যাটাগরি আবশ্যক।'
        });
      }

      let generatedImage: string | null = null;
      if (process.env.GEMINI_API_KEY) {
        generatedImage = await generateOutfitWithGemini(fabricImage, category);
      }

      return res.json({
        success: true,
        design: {
          id: `outfit-${category}-${Date.now()}`,
          categoryKey: category,
          categoryNameBn: cfg.nameBn,
          categoryNameEn: cfg.nameEn,
          descriptionBn: cfg.descBn,
          suggestedYards35: cfg.yards35,
          suggestedYards25: cfg.yards25,
          imageUrl: generatedImage || fabricImage,
          isAiGenerated: Boolean(generatedImage),
          generatedAt: new Date().toISOString()
        }
      });
    } catch (err: any) {
      console.error('Error generating single AI outfit:', err);
      return res.status(500).json({
        success: false,
        message: 'এআই ডিজাইন তৈরিতে সমস্যা হয়েছে।'
      });
    }
  });

  // ============================================================================
  // 7B. COMPLETE DYNAMIC STOREFRONT & ADMIN DASHBOARD APIs
  // ============================================================================

  // Public bootstrap endpoint: returns products, categories, settings, paymentSettings in one call
  app.get('/api/bootstrap', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      products: db.products,
      categories: db.categories,
      settings: db.settings,
      paymentSettings: db.payment_settings
    });
  });

  // --- ADMIN AUTHENTICATION & PASSWORD SECURITY ---
  app.post('/api/admin/auth/login', (req: Request, res: Response) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'অ্যাডমিন ইমেইল এবং পাসওয়ার্ড উভয়ই প্রদান করুন।'
      });
    }

    const admin = db.admin_account;
    if (
      email !== admin.email.toLowerCase() ||
      !verifyAdminPassword(password, admin.passwordSalt, admin.passwordHash)
    ) {
      return res.status(401).json({
        success: false,
        message: 'অ্যাডমিন ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।'
      });
    }

    appendActivityLog(
      'অ্যাডমিন প্যানেলে লগইন সম্পন্ন',
      'security',
      `${admin.name} (${admin.email}) লগইন করেছেন`,
      admin.name
    );
    saveDatabase(db);

    return res.json({
      success: true,
      token: ADMIN_SECRET_TOKEN,
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  });

  app.get('/api/admin/auth/me', requireAdminAuth, (_req: Request, res: Response) => {
    return res.json({
      success: true,
      admin: {
        email: db.admin_account.email,
        name: db.admin_account.name,
        role: db.admin_account.role
      }
    });
  });

  app.post('/api/admin/auth/change-password', requireAdminAuth, (req: Request, res: Response) => {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    const newEmail = String(req.body?.newEmail || '').trim().toLowerCase();
    const newName = String(req.body?.newName || '').trim();

    if (
      !currentPassword ||
      !verifyAdminPassword(currentPassword, db.admin_account.passwordSalt, db.admin_account.passwordHash)
    ) {
      return res.status(400).json({
        success: false,
        message: 'বর্তমান পাসওয়ার্ড সঠিক নয়।'
      });
    }

    if (newPassword && newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
      });
    }

    if (newPassword) {
      const { salt, hash } = hashAdminPassword(newPassword);
      db.admin_account.passwordSalt = salt;
      db.admin_account.passwordHash = hash;
    }
    if (newEmail && newEmail.includes('@')) {
      db.admin_account.email = newEmail;
    }
    if (newName) {
      db.admin_account.name = newName;
    }
    db.admin_account.updatedAt = new Date().toISOString();

    appendActivityLog(
      'অ্যাডমিন নিরাপত্তা তথ্য আপডেট',
      'security',
      'অ্যাডমিন অ্যাকাউন্টের পাসওয়ার্ড/প্রোফাইল আপডেট করা হয়েছে'
    );
    saveDatabase(db);

    return res.json({
      success: true,
      message: 'অ্যাডমিন নিরাপত্তা তথ্য সফলভাবে আপডেট হয়েছে।',
      admin: {
        email: db.admin_account.email,
        name: db.admin_account.name,
        role: db.admin_account.role
      }
    });
  });

  // --- PRODUCTS CRUD APIs ---
  app.get('/api/products', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      products: db.products
    });
  });

  app.post('/api/admin/products', requireAdminAuth, (req: Request, res: Response) => {
    const product = req.body?.product as Product;
    if (!product || !product.id || !product.name) {
      return res.status(400).json({
        success: false,
        message: 'পণ্যের নাম ও আইডি আবশ্যক।'
      });
    }

    const idx = db.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      db.products[idx] = { ...db.products[idx], ...product };
      appendActivityLog(
        `পণ্য আপডেট: ${product.name}`,
        'product',
        `SKU: ${product.sku} · মূল্য: ৳${product.discountPrice || product.pricePerYard}/গজ · স্টক: ${product.stockYards} গজ`
      );
    } else {
      db.products.unshift(product);
      appendActivityLog(
        `নতুন পণ্য যোগ: ${product.name}`,
        'product',
        `ক্যাটাগরি: ${product.category} (${product.fabricWidth} বহর) · মূল্য: ৳${product.discountPrice || product.pricePerYard}/গজ`
      );
    }

    saveDatabase(db);
    broadcastSiteStateUpdate('products');

    return res.json({
      success: true,
      product,
      products: db.products
    });
  });

  app.put('/api/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body?.product || req.body;
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({
        success: false,
        message: 'পণ্যটি খুঁজে পাওয়া যায়নি।'
      });
    }

    db.products[idx] = { ...db.products[idx], ...updates, id };
    appendActivityLog(
      `পণ্য সম্পাদনা: ${db.products[idx].name}`,
      'product',
      `SKU: ${db.products[idx].sku} আপডেট করা হয়েছে`
    );
    saveDatabase(db);
    broadcastSiteStateUpdate('products');

    return res.json({
      success: true,
      product: db.products[idx],
      products: db.products
    });
  });

  app.delete('/api/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const target = db.products.find((p) => p.id === id);
    db.products = db.products.filter((p) => p.id !== id);
    if (target) {
      appendActivityLog(
        `পণ্য মুছে ফেলা হয়েছে: ${target.name}`,
        'product',
        `SKU: ${target.sku} ডাটাবেস থেকে মুছে ফেলা হয়েছে`
      );
    }
    saveDatabase(db);
    broadcastSiteStateUpdate('products');

    return res.json({
      success: true,
      products: db.products
    });
  });

  // --- CATEGORIES CRUD APIs ---
  app.get('/api/categories', (_req: Request, res: Response) => {
    const sorted = [...db.categories].sort((a, b) => a.order - b.order);
    return res.json({
      success: true,
      categories: sorted
    });
  });

  app.post('/api/admin/categories', requireAdminAuth, (req: Request, res: Response) => {
    const category = req.body?.category as Category;
    if (!category || !category.id || !category.name) {
      return res.status(400).json({
        success: false,
        message: 'ক্যাটাগরির নাম ও আইডি আবশ্যক।'
      });
    }

    const idx = db.categories.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      db.categories[idx] = { ...db.categories[idx], ...category };
      appendActivityLog(`ক্যাটাগরি আপডেট: ${category.name}`, 'category', `স্লাগ: ${category.slug}`);
    } else {
      db.categories.push({ ...category, isActive: category.isActive !== false });
      appendActivityLog(`নতুন ক্যাটাগরি যোগ: ${category.name}`, 'category', `স্লাগ: ${category.slug}`);
    }

    db.categories.sort((a, b) => a.order - b.order);
    saveDatabase(db);
    broadcastSiteStateUpdate('categories');

    return res.json({
      success: true,
      categories: db.categories
    });
  });

  app.put('/api/admin/categories-reorder', requireAdminAuth, (req: Request, res: Response) => {
    const categories = req.body?.categories as Category[];
    if (Array.isArray(categories) && categories.length > 0) {
      db.categories = categories.map((c, idx) => ({ ...c, order: idx + 1 }));
      saveDatabase(db);
      broadcastSiteStateUpdate('categories');
    }
    return res.json({
      success: true,
      categories: db.categories
    });
  });

  app.delete('/api/admin/categories/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const target = db.categories.find((c) => c.id === id);
    db.categories = db.categories.filter((c) => c.id !== id);
    if (target) {
      appendActivityLog(`ক্যাটাগরি মুছে ফেলা হয়েছে: ${target.name}`, 'category', `আইডি: ${id}`);
    }
    saveDatabase(db);
    broadcastSiteStateUpdate('categories');

    return res.json({
      success: true,
      categories: db.categories
    });
  });

  // --- ADMIN EDIT ORDER DETAILS (Customer Info, Delivery Address, Payment Info) ---
  app.put('/api/admin/orders/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const order = db.orders.find(
      (o) => o.id === id || o.orderNumber.toUpperCase() === id.toUpperCase()
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'অর্ডারটি খুঁজে পাওয়া যায়নি।'
      });
    }

    const customerUpdates = req.body?.customer;
    if (customerUpdates && typeof customerUpdates === 'object') {
      order.customer = {
        ...order.customer,
        fullName: customerUpdates.fullName ? String(customerUpdates.fullName).trim() : order.customer.fullName,
        phone: customerUpdates.phone ? normalizePhone(String(customerUpdates.phone)) : order.customer.phone,
        altPhone:
          customerUpdates.altPhone !== undefined
            ? customerUpdates.altPhone
              ? normalizePhone(String(customerUpdates.altPhone))
              : undefined
            : order.customer.altPhone,
        district: customerUpdates.district ? String(customerUpdates.district).trim() : order.customer.district,
        upazila: customerUpdates.upazila !== undefined ? String(customerUpdates.upazila).trim() : order.customer.upazila,
        area: customerUpdates.area !== undefined ? String(customerUpdates.area).trim() : order.customer.area,
        fullAddress: customerUpdates.fullAddress ? String(customerUpdates.fullAddress).trim() : order.customer.fullAddress,
        deliveryNotes:
          customerUpdates.deliveryNotes !== undefined
            ? String(customerUpdates.deliveryNotes).trim()
            : order.customer.deliveryNotes
      };
    }

    if (req.body?.paymentStatus) {
      order.paymentStatus = req.body.paymentStatus as PaymentStatus;
    }

    order.updatedAt = new Date().toISOString();
    appendActivityLog(
      `অর্ডার তথ্য সম্পাদনা (${order.orderNumber})`,
      'order',
      `গ্রাহক: ${order.customer.fullName} · ঠিকানা: ${order.customer.fullAddress}`
    );
    saveDatabase(db);

    const hydrated = hydrateOrder(order);
    broadcastOrderUpdate(hydrated);

    return res.json({
      success: true,
      order: hydrated
    });
  });

  // --- CUSTOMERS MANAGEMENT APIs ---
  app.get('/api/admin/customers', requireAdminAuth, (_req: Request, res: Response) => {
    return res.json({
      success: true,
      customers: db.customers
    });
  });

  app.post('/api/customers/sync', (req: Request, res: Response) => {
    const user = req.body?.user as CustomerUser;
    if (!user || !user.phone) {
      return res.status(400).json({ success: false, message: 'গ্রাহকের মোবাইল নম্বর আবশ্যক।' });
    }
    const normPhone = normalizePhone(user.phone);
    const existing = db.customers.find((c) => normalizePhone(c.phone) === normPhone || c.id === user.id);
    if (existing && existing.status === 'blocked') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_BLOCKED',
        message: 'আপনার অ্যাকাউন্টটি ব্লক করা হয়েছে।'
      });
    }

    const now = new Date().toISOString();
    if (existing) {
      Object.assign(existing, {
        ...user,
        id: existing.id,
        phone: normPhone,
        status: existing.status || 'active',
        updatedAt: now
      });
    } else {
      db.customers.unshift({
        ...user,
        id: user.id || `cust-${Date.now()}`,
        phone: normPhone,
        status: 'active',
        createdAt: user.createdAt || now,
        updatedAt: now
      });
    }
    saveDatabase(db);
    return res.json({
      success: true,
      customer: existing || db.customers[0]
    });
  });

  app.put('/api/admin/customers/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = db.customers.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'গ্রাহক খুঁজে পাওয়া যায়নি।' });
    }
    const updates = req.body?.customer || req.body;
    db.customers[idx] = {
      ...db.customers[idx],
      ...updates,
      id,
      phone: updates.phone ? normalizePhone(String(updates.phone)) : db.customers[idx].phone,
      updatedAt: new Date().toISOString()
    };
    appendActivityLog(
      `গ্রাহক প্রোফাইল আপডেট: ${db.customers[idx].fullName}`,
      'customer',
      `ফোন: ${db.customers[idx].phone}`
    );
    saveDatabase(db);
    return res.json({
      success: true,
      customer: db.customers[idx],
      customers: db.customers
    });
  });

  app.patch('/api/admin/customers/:id/status', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const status = req.body?.status === 'blocked' ? 'blocked' : 'active';
    const customer = db.customers.find((c) => c.id === id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'গ্রাহক খুঁজে পাওয়া যায়নি।' });
    }
    customer.status = status;
    customer.updatedAt = new Date().toISOString();
    appendActivityLog(
      `গ্রাহক অ্যাকাউন্ট ${status === 'blocked' ? 'ব্লক' : 'সক্রিয়'} করা হয়েছে`,
      'customer',
      `${customer.fullName} (${customer.phone})`
    );
    saveDatabase(db);
    return res.json({
      success: true,
      customer,
      customers: db.customers
    });
  });

  app.delete('/api/admin/customers/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    db.customers = db.customers.filter((c) => c.id !== id);
    saveDatabase(db);
    return res.json({
      success: true,
      customers: db.customers
    });
  });

  // --- WEBSITE SETTINGS, HOMEPAGE, CONTENT, NAVIGATION, SEO & PROMOTIONS APIs ---
  app.get('/api/settings', (_req: Request, res: Response) => {
    return res.json({
      success: true,
      settings: db.settings
    });
  });

  app.put('/api/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
    const incoming = (req.body?.settings || req.body) as Partial<StoreSettings>;
    if (!incoming || typeof incoming !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'বৈধ সেটিংস ডেটা প্রদান করুন।'
      });
    }

    if (incoming.paymentSettings) {
      db.payment_settings = {
        bkash: { ...db.payment_settings.bkash, ...(incoming.paymentSettings.bkash || {}) },
        nagad: { ...db.payment_settings.nagad, ...(incoming.paymentSettings.nagad || {}) },
        cod: { ...db.payment_settings.cod, ...(incoming.paymentSettings.cod || {}) }
      };
    }

    db.settings = mergeSettingsWithDefaults(
      { ...db.settings, ...incoming },
      db.payment_settings
    );

    appendActivityLog(
      'ওয়েবসাইট কনফিগারেশন ও কন্টেন্ট আপডেট',
      'settings',
      `স্টোর: ${db.settings.storeName} · মেইনটেন্যান্স: ${db.settings.maintenanceMode ? 'চালু' : 'বন্ধ'}`
    );
    saveDatabase(db);
    broadcastSiteStateUpdate('settings');

    return res.json({
      success: true,
      settings: db.settings
    });
  });

  // --- CONTACT MESSAGES & CUSTOM REQUESTS & ACTIVITY LOGS ---
  app.get('/api/admin/contact-messages', requireAdminAuth, (_req: Request, res: Response) => {
    return res.json({
      success: true,
      messages: db.contact_messages
    });
  });

  app.post('/api/contact-messages', (req: Request, res: Response) => {
    const name = String(req.body?.name || '').trim();
    const phone = normalizePhone(String(req.body?.phone || ''));
    const message = String(req.body?.message || '').trim();

    if (!name || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'নাম, মোবাইল নম্বর এবং বার্তা আবশ্যক।'
      });
    }

    const record: ContactMessageRecord = {
      id: `msg-${Date.now()}`,
      name,
      phone,
      message,
      status: 'unread',
      createdAt: new Date().toISOString()
    };
    db.contact_messages.unshift(record);
    appendActivityLog(
      `নতুন যোগাযোগ বার্তা (${name})`,
      'content',
      `ফোন: ${phone} · বার্তা: ${message.slice(0, 60)}`,
      'Customer'
    );
    saveDatabase(db);

    return res.status(201).json({
      success: true,
      record
    });
  });

  app.patch('/api/admin/contact-messages/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const msg = db.contact_messages.find((m) => m.id === id);
    if (msg && req.body?.status) {
      msg.status = req.body.status;
      saveDatabase(db);
    }
    return res.json({
      success: true,
      messages: db.contact_messages
    });
  });

  app.delete('/api/admin/contact-messages/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    db.contact_messages = db.contact_messages.filter((m) => m.id !== id);
    saveDatabase(db);
    return res.json({
      success: true,
      messages: db.contact_messages
    });
  });

  app.get('/api/admin/activity-logs', requireAdminAuth, (_req: Request, res: Response) => {
    return res.json({
      success: true,
      logs: db.activity_logs
    });
  });

  // --- ADMIN IMAGE UPLOAD API ---
  app.post('/api/admin/upload', requireAdminAuth, (req: Request, res: Response) => {
    try {
      const dataUrl = String(req.body?.dataUrl || '').trim();
      const fileName = String(req.body?.fileName || 'image').replace(/[^a-zA-Z0-9_-]/g, '_');

      const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,(.+)$/i);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'শুধুমাত্র বৈধ ছবির ফাইল (PNG, JPG, WEBP, GIF) আপলোড করা যাবে।'
        });
      }

      const ext = match[1] === 'jpeg' ? 'jpg' : match[1] === 'svg+xml' ? 'svg' : match[1];
      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইটের মধ্যে হতে হবে।'
        });
      }

      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const uniqueFile = `${fileName}_${Date.now()}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, uniqueFile);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${uniqueFile}`;
      return res.json({
        success: true,
        url: publicUrl,
        dataUrl
      });
    } catch (err) {
      console.error('Image upload error:', err);
      return res.status(500).json({
        success: false,
        message: 'ছবি আপলোডে সমস্যা হয়েছে।'
      });
    }
  });

  // ============================================================================
  // 8. VITE DEV MIDDLEWARE OR PRODUCTION STATIC ASSETS
  // ============================================================================
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fashion Doniya BD Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
