export type FabricWidth = '2.5' | '3.5';

export type CustomMeasurementFieldKey =
  | 'chest'
  | 'waist'
  | 'hip'
  | 'length'
  | 'sleeve'
  | 'shoulder';

export interface CustomerCustomMeasurements {
  chest?: string; // বুকের মাপ (ইঞ্চি)
  waist?: string; // কোমরের মাপ (ইঞ্চি)
  hip?: string; // হিপের মাপ (ইঞ্চি)
  length?: string; // পোশাকের লম্বা (ইঞ্চি)
  sleeve?: string; // হাতার মাপ (ইঞ্চি)
  shoulder?: string; // কাঁধের মাপ (ইঞ্চি)
}

export interface ProductCustomMeasurementConfig {
  enabled: boolean;
  standardGaj: number;
  minAllowedGaj: number;
  maxAllowedGaj: number;
  applicableFields: CustomMeasurementFieldKey[];
  measurementInstructions: string;
  additionalPricePerYard?: number; // Price per additional Gaj beyond standardGaj (defaults to product effective price)
}

export interface AddonFabricOption {
  id: string;
  addonId: string; // 'inner' | 'pant' | 'palazzo' | 'orna' | 'skirt' | 'blouse'
  name: string;
  fabricType: string;
  color: string;
  colorHex?: string;
  pricePerYard: number;
  image: string;
  fabricWidth?: FabricWidth;
  description?: string;
  isDefault?: boolean;
  isActive: boolean;
  order: number;
}

export interface SelectedAddonDetail {
  addonId: string;
  addonName: string;
  yardsPerUnit: number;
  count: number;
  fabricId: string;
  fabricName: string;
  fabricType: string;
  color?: string;
  pricePerYard: number;
  totalAddonPrice: number;
  image?: string;
}

export interface ProductCustomizationPayload {
  isCustomized: boolean;
  sizeMode: 'standard' | 'custom';
  standardGaj: number;
  customGaj: number;
  additionalGaj: number;
  measurements?: CustomerCustomMeasurements;
  customizationNotes?: string;
  additionalPricePerYard?: number;
  finalProductPrice: number;
  outfitCategory?: string;
  outfitId?: FixedOutfitCategoryId;
  outfitImage?: string;
  specialInstructions?: string;
  selectedAddons?: SelectedAddonDetail[];
}

export interface Product {
  id: string;
  slug?: string;
  name: string;
  nameEn?: string;
  description: string;
  sku: string;
  fabricWidth: FabricWidth; // '2.5' | '3.5'
  category: string; // e.g., 'কামিজ', 'শাড়ি', 'গাউন / লেহেঙ্গা'
  fabricType: string; // e.g., 'পিওর কটন', 'জামদানি সিল্ক', 'জর্জেট', 'লিনেন'
  design?: string; // e.g., 'জামদানি জরি বুটি', 'ফ্লোরাল এমব্রয়ডারি'
  color: string;
  colorHex?: string;
  availableColors: string[];
  pricePerYard: number; // in BDT (৳)
  discountPrice?: number;
  stockYards: number; // in yards
  minOrderQuantity: number; // typically 1 or 1.5
  stepYard: number; // 0.5 or 0.25 yard increments
  images: string[];
  patternType: 'jamdani' | 'embroidery' | 'silk' | 'cotton' | 'georgette' | 'linen' | 'floral' | 'chanderi';
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
  customMeasurementConfig?: ProductCustomMeasurementConfig;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  imageAlt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  fabricWidth: 'all' | '2.5' | '3.5';
  order: number;
  description?: string;
  icon?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export type FabricCollectionType = '2.5_bahar' | '3.5_bahar';

export type CategoryIconName =
  | 'sparkles'
  | 'scissors'
  | 'crown'
  | 'layers'
  | 'shirt'
  | 'feather'
  | 'gem'
  | 'palette';

export interface FabricSectionRecord {
  id: string;
  collection_type: FabricCollectionType;
  eyebrow: string;
  heading: string;
  subtitle: string;
  updatedAt: string;
}

export interface FabricCategoryRecord {
  id: string;
  collection_type: FabricCollectionType;
  name: string;
  matchCategoryName: string; // matches Product.category for accurate count & gallery routing
  slug: string;
  description: string;
  sampleFabrics: string;
  standardYards: string;
  buttonLabel: string;
  buttonLink: string; // e.g. 'category-gallery:kamiz' or custom route/slug
  icon: CategoryIconName;
  representativeProductId: string;
  fallbackColorHex: string;
  fallbackPatternType: Product['patternType'];
  customImageUrl?: string;
  order: number;
  isEnabled: boolean;
  updatedAt: string;
}

export interface FabricCategoryDesignSettingsRecord {
  id: string;
  collection_type: FabricCollectionType;
  backgroundColor: string; // default '#FAF6F0'
  cardBackgroundColor: string; // default '#FFFDF9'
  textColor: string; // default '#850B1B'
  bodyTextColor: string; // default '#4A2C2A'
  borderColor: string; // default '#D5A64A'
  buttonColor: string; // default '#850B1B'
  buttonTextColor: string; // default '#FFFFFF'
  accentGoldColor: string; // default '#D5A64A'
  imagePosition: 'right' | 'left'; // default 'right' (text left, image right)
  imageAspectRatio: '4/5' | '1/1' | '3/4' | '16/10'; // default '4/5'
  imageWidthPercent: number; // default 44 (44% image on right, 56% text on left)
  cardMinHeightPx: number; // default 220
  cardBorderRadiusPx: number; // default 16
  cardGapPx: number; // default 20
  sectionPaddingPx: number; // default 32
  desktopColumns: 2 | 3; // default 3 (3 columns x 2 rows)
  mobileColumns: 1 | 2; // default 2 (2 compact columns on mobile)
  updatedAt: string;
}

export interface FabricCollectionSnapshot {
  section: FabricSectionRecord;
  categories: FabricCategoryRecord[];
  designSettings: FabricCategoryDesignSettingsRecord;
  savedAt: string;
}

export interface FabricCollectionsDatabaseState {
  fabric_sections: Record<FabricCollectionType, FabricSectionRecord>;
  fabric_categories: Record<FabricCollectionType, FabricCategoryRecord[]>;
  fabric_category_design_settings: Record<FabricCollectionType, FabricCategoryDesignSettingsRecord>;
  drafts: Record<FabricCollectionType, FabricCollectionSnapshot>;
  previous_published: Record<FabricCollectionType, FabricCollectionSnapshot | null>;
  has_unpushed_draft: Record<FabricCollectionType, boolean>;
}

export type FixedOutfitCategoryId =
  | 'kameez'
  | 'short_kameez'
  | 'long_koti'
  | 'lehenga_gown'
  | 'saree';

export interface OutfitCategoryDefinition {
  id: FixedOutfitCategoryId;
  nameBn: string; // 'কামিজ', 'শর্ট কামিজ', 'লং কটি', 'লেহেঙ্গা / গাউন', 'শাড়ি'
  nameEn: string;
  defaultDescription: string;
  defaultPhotoUrl: {
    '3.5': string;
    '2.5': string;
  };
  defaultYardage: {
    '3.5': number;
    '2.5': number;
  };
  minYardage: {
    '3.5': number;
    '2.5': number;
  };
  maxYardage: {
    '3.5': number;
    '2.5': number;
  };
  stepYard: number; // 0.25 or 0.5
  isEnabled: boolean;
  order: number;
  tailoringInstructions?: string;
}

export interface ProductOutfitOverride {
  outfitId: FixedOutfitCategoryId;
  isEnabled: boolean;
  customDescription?: string;
  customPhotoUrl?: string;
  customYardage?: {
    '3.5'?: number;
    '2.5'?: number;
  };
}

export interface FabricProductOutfitAssignment {
  productId: string;
  assignedOutfitIds: FixedOutfitCategoryId[];
  overrides?: Partial<Record<FixedOutfitCategoryId, ProductOutfitOverride>>;
  updatedAt?: string;
}

export interface CartItem {
  id: string; // unique item cart key
  productId: string;
  productName?: string;
  product: Product;
  selectedWidth: FabricWidth;
  selectedColor: string;
  yards: number;
  pricePerYard: number;
  isCustomized?: boolean;
  sizeMode?: 'standard' | 'custom';
  standardGaj?: number;
  customGaj?: number;
  additionalGaj?: number;
  customMeasurements?: CustomerCustomMeasurements;
  customizationNotes?: string;
  additionalPricePerYard?: number;
  finalProductPrice?: number;
  outfitCategory?: string; // e.g. 'কামিজ', 'শাড়ি'
  outfitId?: FixedOutfitCategoryId;
  outfitImage?: string;
  specialInstructions?: string;
  selectedAddons?: SelectedAddonDetail[];
}

export interface MeasurementOutfitRule {
  id: string;
  name: string;
  nameEn: string;
  fabricWidth: FabricWidth;
  baseYards: number;
  description?: string;
  category: string;
  isActive: boolean;
}

export interface AdditionalClothingItem {
  id: string;
  name: string;
  nameEn: string;
  fabricWidth: FabricWidth;
  yardsPerUnit: number;
  isActive: boolean;
  defaultPricePerYard?: number;
  fabricCollection?: AddonFabricOption[];
}

export type ClothingSizeCode = 'S' | 'M' | 'L' | 'XL';

export interface ClothingSizeMeasurementEntry {
  size: ClothingSizeCode;
  chest: string; // বুক
  waist: string; // কোমর
  hip: string; // হিপ
  length: string; // লম্বা
  otherMeasurements: string; // অন্যান্য প্রয়োজনীয় মাপ
  suggestedGaj: number | null; // Size-wise suggested fabric quantity (null = Admin-defined / custom)
}

export interface CategoryMeasurementGuideRecord {
  id: string; // e.g. 'guide-3.5-kamiz'
  fabricWidth: FabricWidth; // '3.5' | '2.5'
  categorySlug: string; // 'kamiz' | 'short-kamiz' | 'long-koti' | 'gown-lehenga' | 'saree' | 'custom-design'
  categoryName: string; // 'কামিজ' | 'শার্ট কামিজ' | 'লং কটি' | 'গাউন / লেহেঙ্গা' | 'শাড়ি' | 'কাস্টম ডিজাইন'
  suggestedYards: number | null; // null when Admin-defined
  isAdminDefined: boolean;
  suggestedYardsLabel: string; // e.g. '২.০ গজ' or 'অ্যাডমিন নির্ধারিত'
  measurementInstructions: string;
  measurementNotes: string;
  sizeGuideEnabled: boolean;
  sizes: ClothingSizeMeasurementEntry[];
  updatedAt: string;
}

export interface CustomDesignRequest {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  fabricWidth: FabricWidth;
  productId?: string;
  productName?: string;
  outfitType: string;
  requiredYards: number;
  additionalItems: string[];
  measurements: {
    height?: string;
    chest?: string;
    waist?: string;
    length?: string;
    sleeve?: string;
    notes?: string;
  };
  preferredColor: string;
  description: string;
  budget?: string;
  referenceImageBase64?: string;
  status: 'Pending' | 'Reviewing' | 'Quoted' | 'In Progress' | 'Completed' | 'Rejected';
  createdAt: string;
  adminNotes?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export type MfsAccountType = 'Personal' | 'Merchant' | 'Agent';

export interface MfsPaymentMethodConfig {
  enabled: boolean;
  number: string;
  type: MfsAccountType;
  instructions: string;
}

export interface CodPaymentMethodConfig {
  enabled: boolean;
  note: string;
}

export interface PaymentSettings {
  bkash: MfsPaymentMethodConfig;
  nagad: MfsPaymentMethodConfig;
  cod: CodPaymentMethodConfig;
}

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'Cash on Delivery' | 'bKash' | 'Nagad';

export type PaymentStatus =
  | 'pending_verification'
  | 'unpaid'
  | 'Paid'
  | 'Pending'
  | 'Failed';

export interface OrderPaymentDetails {
  receiverNumber: string;
  senderNumber: string;
  trxId: string;
  accountType: MfsAccountType;
}

export interface OrderItem {
  productId: string;
  productName: string;
  fabricWidth: FabricWidth;
  color: string;
  yards: number;
  pricePerYard: number;
  subtotal: number;
  image?: string;
  patternType?: string;
  isCustomized?: boolean;
  sizeMode?: 'standard' | 'custom';
  standardGaj?: number;
  customGaj?: number;
  additionalGaj?: number;
  customMeasurements?: CustomerCustomMeasurements;
  customizationNotes?: string;
  additionalPricePerYard?: number;
  finalProductPrice?: number;
  outfitCategory?: string;
  outfitId?: FixedOutfitCategoryId;
  outfitImage?: string;
  specialInstructions?: string;
  selectedAddons?: SelectedAddonDetail[];
}

export interface OrderTrackingHistory {
  id: string;
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  timestamp: string;
  note: string;
  location?: string;
  updatedBy?: 'Customer' | 'Admin' | 'System' | 'Courier API';
}

export interface CourierInformation {
  id: string;
  orderId: string;
  orderNumber: string;
  courierName: string;
  trackingNumber: string;
  estimatedDeliveryDate?: string;
  trackingUrl?: string;
  consignmentId?: string;
  courierStatus?: string;
  lastSyncedAt?: string;
  isApiConnected?: boolean;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. FD-2026-1082
  userId?: string;
  customer: {
    fullName: string;
    phone: string;
    altPhone?: string;
    email?: string;
    district: string;
    upazila: string;
    area: string;
    fullAddress: string;
    deliveryNotes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  couponCode?: string;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: OrderPaymentDetails;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  estimatedDeliveryDate?: string;
  courierInfo?: CourierInformation;
  trackingHistory?: OrderTrackingHistory[];
  statusHistory: {
    id?: string;
    status: OrderStatus;
    timestamp: string;
    note: string;
    location?: string;
    updatedBy?: string;
  }[];
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount?: number;
  expiresAt?: string;
  isActive: boolean;
  description: string;
}

export interface HeroSlideConfig {
  id: string;
  image: string;
  badge: string;
  headlineMobile1: string;
  headlineMobile2: string;
  headlineDesktop1: string;
  headlineDesktop2: string;
  subheadline: string;
  priceHighlight: string;
  ctaPrimary: string;
  ctaSecondary: string;
  ctaPrimaryPage?: NavigationPage;
  ctaSecondaryPage?: NavigationPage;
  isActive: boolean;
}

export interface PromotionalBannerConfig {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonPage: NavigationPage;
  backgroundImage?: string;
  isActive: boolean;
}

export type HomepageSectionId =
  | 'hero'
  | 'fabric_width'
  | 'exclusive'
  | 'all_products'
  | 'promo_banner'
  | 'calculator';

export interface HomepageSectionConfig {
  id: HomepageSectionId;
  label: string;
  eyebrow?: string;
  heading: string;
  description: string;
  buttonText?: string;
  isVisible: boolean;
  order: number;
}

export interface FabricWidthCardConfig {
  widthKey: '3.5' | '2.5';
  badgeTitle: string;
  descLine1: string;
  descLine2: string;
  ctaText: string;
  fabricImage: string;
  fabricAlt: string;
}

export interface HomepageConfig {
  heroSlides: HeroSlideConfig[];
  sections: HomepageSectionConfig[];
  promotionalBanners: PromotionalBannerConfig[];
  fabricWidthCards?: FabricWidthCardConfig[];
  showExclusiveTabFeatured: boolean;
  showExclusiveTabBestSeller: boolean;
  showExclusiveTabNewArrival: boolean;
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
  question?: string;
  answer?: string;
  order: number;
  isActive: boolean;
}

export interface PolicySectionItem {
  heading: string;
  body: string;
  paragraph?: string;
}

export interface PolicyDocumentConfig {
  badge?: string;
  title: string;
  subtitle: string;
  intro?: string;
  sections: PolicySectionItem[];
}

export interface AboutPageContentConfig {
  badge: string;
  heroTitle: string;
  heroDescription: string;
  storyBadge: string;
  storyTitle: string;
  storyParagraph1: string;
  storyParagraph2: string;
  valuesTitle: string;
  valuesSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  feature1Title?: string;
  feature1Desc?: string;
  feature2Title?: string;
  feature2Desc?: string;
  feature3Title?: string;
  feature3Desc?: string;
  ctaButtonText?: string;
}

export interface ContactPageContentConfig {
  title: string;
  subtitle: string;
  formTitle: string;
  workingHours: string;
  eyebrow?: string;
  officeTitle?: string;
  serviceHours?: string;
}

export interface FooterContentConfig {
  brandDescription: string;
  copyrightText: string;
  bottomTagline: string;
  fabricSectionTitle: string;
  supportSectionTitle: string;
  contactSectionTitle: string;
  trustBadge1Title?: string;
  trustBadge1Sub?: string;
}

export interface WebsiteContentConfig {
  aboutPage: AboutPageContentConfig;
  contactPage: ContactPageContentConfig;
  faqs: FaqItem[];
  faqEyebrow?: string;
  faqTitle: string;
  faqSubtitle: string;
  deliveryPolicy: PolicyDocumentConfig;
  returnPolicy: PolicyDocumentConfig;
  privacyPolicy: PolicyDocumentConfig;
  termsConditions: PolicyDocumentConfig;
  footerContent: FooterContentConfig;
}

export interface NavigationMenuItem {
  id: string;
  label: string;
  page: NavigationPage;
  order: number;
  isActive: boolean;
  isEnabled?: boolean;
  highlightGold?: boolean;
}

export interface NavigationConfig {
  headerItems: NavigationMenuItem[];
  footerFabricItems: NavigationMenuItem[];
  footerSupportItems: NavigationMenuItem[];
  footerQuickLinks?: NavigationMenuItem[];
  footerPolicyLinks?: NavigationMenuItem[];
}

export interface SeoPageConfig {
  pageKey?: string;
  pageName?: string;
  page?: string;
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
}

export interface SeoConfig {
  defaultTitle: string;
  titleSuffix: string;
  defaultDescription: string;
  defaultKeywords: string;
  ogImage: string;
  ogImageUrl?: string;
  pages: Record<string, SeoPageConfig>;
}

export interface PromotionCampaign {
  id: string;
  name: string;
  badgeText: string;
  description: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  bannerImage?: string;
  bannerImageUrl?: string;
  targetCategory?: string;
  couponCode?: string;
  isActive: boolean;
}

export interface ContactMessageRecord {
  id: string;
  name: string;
  phone: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  category: 'order' | 'product' | 'category' | 'customer' | 'settings' | 'content' | 'security';
  details: string;
  actor: string;
  timestamp: string;
}

export type FloatingContactIconType =
  | 'facebook'
  | 'messenger'
  | 'whatsapp'
  | 'phone'
  | 'instagram'
  | 'telegram'
  | 'youtube'
  | 'email'
  | 'custom';

export interface FloatingContactItem {
  id: string;
  label: string;
  url: string;
  iconType: FloatingContactIconType;
  customIconUrl?: string;
  iconBgColor?: string;
  isActive: boolean;
  order: number;
}

export interface FloatingWidgetConfig {
  isEnabled: boolean;
  tooltipText?: string;
  items: FloatingContactItem[];
}

export interface StoreSettings {
  storeName: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  currency?: string;
  currencyCode?: string;
  currencySymbol?: string;
  taglineBengali: string;
  announcementText: string;
  heroTitle: string;
  heroDescription: string;
  heroButtonPrimaryText: string;
  heroButtonSecondaryText: string;
  whatsappNumber: string;
  supportPhone: string;
  supportEmail: string;
  address: string;
  insideDhakaDeliveryFee: number;
  outsideDhakaDeliveryFee: number;
  freeDeliveryThreshold: number;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  coupons: Coupon[];
  paymentSettings: PaymentSettings;
  homepageConfig?: HomepageConfig;
  contentConfig?: WebsiteContentConfig;
  navigationConfig?: NavigationConfig;
  seoConfig?: SeoConfig;
  campaigns?: PromotionCampaign[];
  floatingWidgetConfig?: FloatingWidgetConfig;
  addonFabricCollections?: Record<string, AddonFabricOption[]>;
}

export interface CustomerUser {
  id: string;
  fullName: string;
  phone: string;
  altPhone?: string;
  email?: string;
  role?: 'user' | 'admin' | 'super_admin' | 'sysadm';
  district?: string;
  upazila?: string;
  fullAddress?: string;
  status?: 'active' | 'blocked';
  notes?: string;
  walletBalance?: number;
  totalOrders?: number;
  totalSpent?: number;
  address?: {
    district: string;
    upazila: string;
    area: string;
    fullAddress: string;
  };
  savedMeasurements?: {
    height?: string;
    chest?: string;
    length?: string;
    waist?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export type PageRoute = NavigationPage;

export type NavigationPage = 
  | 'home'
  | 'shop'
  | 'fabric-width'
  | 'category-gallery'
  | 'shop-2-5'
  | 'shop-3-5'
  | 'product-details'
  | 'calculator'
  | 'custom-design'
  | 'fabric-to-outfit'
  | 'cart'
  | 'checkout'
  | 'order-confirmation'
  | 'order-tracking'
  | 'wishlist'
  | 'account'
  | 'about'
  | 'contact'
  | 'faq'
  | 'measurement-guide'
  | 'delivery-policy'
  | 'return-policy'
  | 'privacy-policy'
  | 'terms'
  | 'admin'
  | 'sysadm';

export type AIOutfitCategoryKey =
  | 'short_kameez'
  | 'long_kameez'
  | 'kurti'
  | 'lehenga_gown'
  | 'saree'
  | 'long_koti';

export interface GeneratedOutfitDesign {
  id: string;
  categoryKey: AIOutfitCategoryKey;
  categoryNameBn: string;
  categoryNameEn: string;
  imageUrl: string;
  descriptionBn: string;
  suggestedYards35: number;
  suggestedYards25: number;
  generatedAt: string;
  isAiGenerated?: boolean;
}

export type AdminTab = 
  | 'overview'
  | 'homepage'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'content'
  | 'navigation'
  | 'seo'
  | 'promotions'
  | 'measurements'
  | 'fabric-studio'
  | 'custom-requests'
  | 'settings';

