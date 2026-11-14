import type { 
  Product, 
  Category, 
  MeasurementOutfitRule, 
  AdditionalClothingItem, 
  AddonFabricOption,
  CategoryMeasurementGuideRecord,
  StoreSettings, 
  Order,
  OrderTrackingHistory,
  CourierInformation,
  CustomDesignRequest,
  FabricCollectionType,
  FabricSectionRecord,
  FabricCategoryRecord,
  FabricCategoryDesignSettingsRecord,
  FabricCollectionsDatabaseState,
  PaymentSettings,
  HomepageConfig,
  WebsiteContentConfig,
  NavigationConfig,
  SeoConfig,
  PromotionCampaign,
  CustomerUser,
  ContactMessageRecord,
  ActivityLog,
  FabricWidthCardConfig,
  FloatingContactItem,
  FloatingWidgetConfig
} from '../types/index.ts';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-kamiz', name: 'কামিজ', slug: 'kamiz', fabricWidth: 'all', order: 1, description: 'নরম ও আরামদায়ক কামিজের আনস্টিচড থান ও গজ কাপড়' },
  { id: 'cat-short-kamiz', name: 'শর্ট কামিজ', slug: 'short-kamiz', fabricWidth: 'all', order: 2, description: 'আধুনিক শর্ট কামিজ ও টপস বানানোর ফেব্রিক' },
  { id: 'cat-long-koti', name: 'লং কটি', slug: 'long-koti', fabricWidth: 'all', order: 3, description: 'রয়েল ও গর্জিয়াস লং কটি এবং শ্রাগের কাপড়' },
  { id: 'cat-gown-lehenga', name: 'গাউন / লেহেঙ্গা', slug: 'gown-lehenga', fabricWidth: '3.5', order: 4, description: 'ফুল ঘেরের পার্টি গাউন ও ব্রাইডাল লেহেঙ্গার বড় বহর থান' },
  { id: 'cat-saree', name: 'শাড়ি', slug: 'saree', fabricWidth: '3.5', order: 5, description: 'ট্রেডিশনাল জামদানি, চান্দেরি সিল্ক ও পার্টি শাড়ির কাপড়' },
  { id: 'cat-gown', name: 'গাউন', slug: 'gown', fabricWidth: '2.5', order: 6, description: 'স্টাইলিশ ক্যাজুয়াল ও পার্টি গাউন ফেব্রিক' },
  { id: 'cat-custom-design', name: 'কাস্টম ডিজাইন', slug: 'custom-design', fabricWidth: 'all', order: 7, description: 'পছন্দমতো যেকোনো পোশাকের জন্য প্রিমিয়াম গজ কাপড়' }
];

export const INITIAL_PRODUCTS: Product[] = [
  // ==========================================
  // ৩.৫ বহর কাপড় (56-60 inch Broad Width)
  // ==========================================

  // ৩.৫ বহর — শাড়ি (Saree Fabrics)
  {
    id: 'prod-35-saree-1',
    name: 'রয়েল ঢাকাই জামদানি উইভ শাড়ির থান (৩.৫ বহর)',
    nameEn: 'Royal Dhakai Jamdani Weave Saree Fabric',
    description: '',
    sku: 'FD-SAR-3501',
    fabricWidth: '3.5',
    category: 'শাড়ি',
    fabricType: 'জামদানি জরি সিল্ক',
    color: 'রয়্যাল ক্রিমসন ও গোল্ডেন জরি',
    colorHex: '#8A2430',
    availableColors: ['রয়্যাল ক্রিমসন ও গোল্ডেন জরি', 'আইভরি গোল্ড', 'এমারেল্ড গ্রিন'],
    pricePerYard: 420,
    discountPrice: 380,
    stockYards: 110,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['jamdani_saree_1'],
    patternType: 'jamdani',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    rating: 4.9,
    reviewCount: 47
  },
  {
    id: 'prod-35-saree-2',
    name: 'প্রিমিয়াম ফ্লোরাল সিল্কি জর্জেট শাড়ির কাপড় (৩.৫ বহর)',
    nameEn: 'Premium Floral Print Saree Fabric',
    description: '',
    sku: 'FD-SAR-3502',
    fabricWidth: '3.5',
    category: 'শাড়ি',
    fabricType: 'বোটানিক্যাল প্রিন্ট সিল্কি জর্জেট',
    color: 'শ্যাম্পেন আইভরি ও ব্লাশ রোজ',
    colorHex: '#D8C3A5',
    availableColors: ['শ্যাম্পেন আইভরি ও ব্লাশ রোজ', 'টিল গ্রিন ফ্লোরাল', 'মেরুন জারদোজ'],
    pricePerYard: 350,
    discountPrice: 310,
    stockYards: 160,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['saree_floral_1'],
    patternType: 'floral',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    isActive: true,
    rating: 5.0,
    reviewCount: 39
  },
  {
    id: 'prod-35-saree-3',
    name: 'হ্যান্ডলুম চান্দেরি টিস্যু সিল্ক শাড়ি ফেব্রিক (৩.৫ বহর)',
    nameEn: 'Royal Chanderi Silk Saree Yard Fabric',
    description: '',
    sku: 'FD-SAR-3503',
    fabricWidth: '3.5',
    category: 'শাড়ি',
    fabricType: 'পিওর চান্দেরি সিল্ক',
    color: 'অ্যান্টিক শ্যাম্পেন গোল্ড',
    colorHex: '#C5A46D',
    availableColors: ['অ্যান্টিক শ্যাম্পেন গোল্ড', 'কাজল ব্ল্যাক ও জরি', 'রুবী রেড'],
    pricePerYard: 440,
    discountPrice: 390,
    stockYards: 95,
    minOrderQuantity: 2.0,
    stepYard: 0.5,
    images: ['silk_saree_1'],
    patternType: 'chanderi',
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.8,
    reviewCount: 22
  },

  // ৩.৫ বহর — কামিজ (Kamiz Fabrics)
  {
    id: 'prod-35-kamiz-1',
    name: 'প্রিমিয়াম সফট কম্বড কটন কামিজ থান (৩.৫ বহর)',
    nameEn: 'Premium Soft Cotton Kameez Fabric',
    description: '',
    sku: 'FD-KAM-3501',
    fabricWidth: '3.5',
    category: 'কামিজ',
    fabricType: '১০০% পিওর কটন',
    color: 'প্রুশিয়ান টিল ব্লু',
    colorHex: '#2C526C',
    availableColors: ['প্রুশিয়ান টিল ব্লু', 'সফট অলিভ', 'পাউডার রোজ'],
    pricePerYard: 260,
    discountPrice: 230,
    stockYards: 240,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['cotton_blue_1'],
    patternType: 'cotton',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    rating: 4.9,
    reviewCount: 58
  },
  {
    id: 'prod-35-kamiz-2',
    name: 'ডিজাইনার জামদানি বুটি কামিজ ফেব্রিক (৩.৫ বহর)',
    nameEn: 'Designer Jamdani Kameez Fabric',
    description: '',
    sku: 'FD-KAM-3502',
    fabricWidth: '3.5',
    category: 'কামিজ',
    fabricType: 'জামদানি কটন সিল্ক',
    color: 'ওয়ার্ম আইভরি ও গোল্ড বুটি',
    colorHex: '#E5D3BD',
    availableColors: ['ওয়ার্ম আইভরি ও গোল্ড বুটি', 'সি-গ্রিন', 'ডিপ নেভি'],
    pricePerYard: 360,
    discountPrice: 320,
    stockYards: 140,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['jamdani_kamiz_1'],
    patternType: 'jamdani',
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: true,
    isActive: true,
    rating: 4.8,
    reviewCount: 31
  },
  {
    id: 'prod-35-kamiz-3',
    name: 'রেশমি সুতার এমব্রয়ডারি লন কটন থান (৩.৫ বহর)',
    nameEn: 'Embroidered Swiss Lawn Cotton Fabric',
    description: '',
    sku: 'FD-KAM-3503',
    fabricWidth: '3.5',
    category: 'কামিজ',
    fabricType: 'সুইস লন এমব্রয়ডারি',
    color: 'সেজ গ্রিন ও পার্ল থ্রেড',
    colorHex: '#5A7864',
    availableColors: ['সেজ গ্রিন ও পার্ল থ্রেড', 'ডাস্টি পিচ', 'মাস্টার্ড গোল্ড'],
    pricePerYard: 340,
    discountPrice: 295,
    stockYards: 130,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['lawn_kamiz_3'],
    patternType: 'embroidery',
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 27
  },

  // ৩.৫ বহর — শর্ট কামিজ (Short Kamiz Fabrics)
  {
    id: 'prod-35-skam-1',
    name: 'রয়েল ফ্লোরাল অর্গানজা শর্ট কামিজ ফেব্রিক (৩.৫ বহর)',
    nameEn: 'Floral Organza Short Kameez Fabric',
    description: '',
    sku: 'FD-SKM-3501',
    fabricWidth: '3.5',
    category: 'শর্ট কামিজ',
    fabricType: 'পিওর ফ্লোরাল অর্গানজা',
    color: 'ব্লাশ রোজ ও গোল্ডেন থ্রেড',
    colorHex: '#D8A7A2',
    availableColors: ['ব্লাশ রোজ ও গোল্ডেন থ্রেড', 'আইসি মিন্ট', 'শ্যাম্পেন ক্রিম'],
    pricePerYard: 380,
    discountPrice: 340,
    stockYards: 85,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['org_pink_1'],
    patternType: 'embroidery',
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.7,
    reviewCount: 19
  },
  {
    id: 'prod-35-skam-2',
    name: 'লিনেন জ্যাকার্ড শর্ট কামিজ ও টপস ফেব্রিক (৩.৫ বহর)',
    nameEn: 'Linen Jacquard Short Kurti Fabric',
    description: '',
    sku: 'FD-SKM-3502',
    fabricWidth: '3.5',
    category: 'শর্ট কামিজ',
    fabricType: 'ফ্লেক্স লিনেন জ্যাকার্ড',
    color: 'আর্থি স্যান্ড বেজ',
    colorHex: '#C9B49F',
    availableColors: ['আর্থি স্যান্ড বেজ', 'অলিভ গ্রিন', 'টেরাকোটা রাস্ট'],
    pricePerYard: 320,
    discountPrice: 285,
    stockYards: 120,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['linen_kurti_1'],
    patternType: 'linen',
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    rating: 4.9,
    reviewCount: 26
  },
  {
    id: 'prod-35-skam-3',
    name: 'শিফলি কাটওয়ার্ক কটন শর্ট কুর্তি ফেব্রিক (৩.৫ বহর)',
    nameEn: 'Schiffli Cutwork Cotton Short Kurti Fabric',
    description: '',
    sku: 'FD-SKM-3503',
    fabricWidth: '3.5',
    category: 'শর্ট কামিজ',
    fabricType: 'শিফলি এমব্রয়ডারি কটন',
    color: 'অলিভ সেজ গ্রিন',
    colorHex: '#4E6B58',
    availableColors: ['অলিভ সেজ গ্রিন', 'অফ-হোয়াইট আইভরি', 'কোরাল পিচ'],
    pricePerYard: 350,
    discountPrice: 310,
    stockYards: 95,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['schiffli_skam_3'],
    patternType: 'linen',
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.8,
    reviewCount: 21
  },

  // ৩.৫ বহর — লং কটি (Long Koti Fabrics)
  {
    id: 'prod-35-koti-1',
    name: 'লাক্সারি বেনারসি ব্রোকেড জ্যাকার্ড লং কটি ফেব্রিক (৩.৫ বহর)',
    nameEn: 'Luxury Brocade Jacquard Long Koti Fabric',
    description: '',
    sku: 'FD-KOT-3501',
    fabricWidth: '3.5',
    category: 'লং কটি',
    fabricType: 'বেনারসি ব্রোকেড জ্যাকার্ড',
    color: 'অ্যান্টিক ব্রোঞ্জ গোল্ড',
    colorHex: '#B89758',
    availableColors: ['অ্যান্টিক ব্রোঞ্জ গোল্ড', 'এসপ্রেসো চারকোল জরি', 'মেরুন ব্রোকেড'],
    pricePerYard: 450,
    discountPrice: 395,
    stockYards: 90,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['jac_koti_1'],
    patternType: 'chanderi',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 34
  },
  {
    id: 'prod-35-koti-2',
    name: 'ডিজাইনার বোটানিক্যাল প্রিন্ট জর্জেট কটি ফেব্রিক (৩.৫ বহর)',
    nameEn: 'Botanical Print Georgette Koti Fabric',
    description: '',
    sku: 'FD-KOT-3502',
    fabricWidth: '3.5',
    category: 'লং কটি',
    fabricType: 'বোটানিক্যাল প্রিন্ট জর্জেট',
    color: 'ওয়ার্ম স্যান্ড ও ফ্লোরাল মোটিফ',
    colorHex: '#D8C7B2',
    availableColors: ['ওয়ার্ম স্যান্ড ও ফ্লোরাল মোটিফ', 'ডিপ টিল প্রিন্ট', 'টেরাকোটা রেড'],
    pricePerYard: 330,
    discountPrice: 290,
    stockYards: 150,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['dig_koti_1'],
    patternType: 'floral',
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.7,
    reviewCount: 18
  },
  {
    id: 'prod-35-koti-3',
    name: 'রয়েল জারদোজি এমব্রয়ডারি র-সিল্ক কটি ফেব্রিক (৩.৫ বহর)',
    nameEn: 'Royal Zardozi Raw Silk Koti Fabric',
    description: '',
    sku: 'FD-KOT-3503',
    fabricWidth: '3.5',
    category: 'লং কটি',
    fabricType: 'এমব্রয়ডারি র-সিল্ক',
    color: 'এসপ্রেসো ব্রাউন ও গোল্ড জরি',
    colorHex: '#3A302A',
    availableColors: ['এসপ্রেসো ব্রাউন ও গোল্ড জরি', 'বটল গ্রিন', 'বারগান্ডি মেরুন'],
    pricePerYard: 480,
    discountPrice: 425,
    stockYards: 75,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['raw_silk_koti_3'],
    patternType: 'embroidery',
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 23
  },

  // ৩.৫ বহর — গাউন / লেহেঙ্গা (Gown / Lehenga Fabrics)
  {
    id: 'prod-35-gown-1',
    name: 'লাক্সারি জারদোজি এমব্রয়ডারি জর্জেট গাউন থান (৩.৫ বহর)',
    nameEn: 'Luxury Embroidered Georgette Gown Fabric',
    description: '',
    sku: 'FD-GWN-3501',
    fabricWidth: '3.5',
    category: 'গাউন / লেহেঙ্গা',
    fabricType: 'ওয়েটলেস এমব্রয়ডারি জর্জেট',
    color: 'ডাস্টি রোজ পিচ ও সিকোয়েন্স',
    colorHex: '#C98A82',
    availableColors: ['ডাস্টি রোজ পিচ ও সিকোয়েন্স', 'শ্যাম্পেন গোল্ড', 'মিন্ট গ্রিন', 'আইভরি হোয়াইট'],
    pricePerYard: 460,
    discountPrice: 410,
    stockYards: 85,
    minOrderQuantity: 2.0,
    stepYard: 0.5,
    images: ['emb_peach_1'],
    patternType: 'embroidery',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    rating: 5.0,
    reviewCount: 45
  },
  {
    id: 'prod-35-gown-2',
    name: 'সফট বাটার সিল্ক পার্টি গাউন ফেব্রিক (৩.৫ বহর)',
    nameEn: 'Soft Butter Silk Gown & Lehenga Fabric',
    description: '',
    sku: 'FD-GWN-3502',
    fabricWidth: '3.5',
    category: 'গাউন / লেহেঙ্গা',
    fabricType: 'পিওর বাটার সিল্ক',
    color: 'ডিপ বেরি মেরুন',
    colorHex: '#7A2838',
    availableColors: ['ডিপ বেরি মেরুন', 'শ্যাম্পেন বেজ', 'এমারেল্ড গ্রিন'],
    pricePerYard: 360,
    discountPrice: 315,
    stockYards: 110,
    minOrderQuantity: 2.0,
    stepYard: 0.5,
    images: ['silk_gown_1'],
    patternType: 'silk',
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: true,
    isActive: true,
    rating: 4.8,
    reviewCount: 29
  },
  {
    id: 'prod-35-gown-3',
    name: 'ব্রাইডাল জরি ও রেশম এমব্রয়ডারি অরগানজা লেহেঙ্গা থান (৩.৫ বহর)',
    nameEn: 'Bridal Zari Organza Lehenga Fabric',
    description: '',
    sku: 'FD-GWN-3503',
    fabricWidth: '3.5',
    category: 'গাউন / লেহেঙ্গা',
    fabricType: 'ব্রাইডাল অরগানজা সিল্ক',
    color: 'শ্যাম্পেন গোল্ড ও আইভরি',
    colorHex: '#D8C29D',
    availableColors: ['শ্যাম্পেন গোল্ড ও আইভরি', 'রুবী ক্রিমসন', 'প্যাস্টেল পিচ'],
    pricePerYard: 520,
    discountPrice: 460,
    stockYards: 65,
    minOrderQuantity: 2.0,
    stepYard: 0.5,
    images: ['bridal_gown_3'],
    patternType: 'embroidery',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    isActive: true,
    rating: 5.0,
    reviewCount: 38
  },

  // ৩.৫ বহর — কাস্টম ডিজাইন (Custom Design Fabrics)
  {
    id: 'prod-35-custom-1',
    name: 'লাক্সারি মলমল মসলিন কটন কাস্টম থান (৩.৫ বহর)',
    nameEn: 'Luxury Muslin Cotton Fabric for Custom Tailoring',
    description: '',
    sku: 'FD-CUS-3501',
    fabricWidth: '3.5',
    category: 'কাস্টম ডিজাইন',
    fabricType: 'মলমল মসলিন কটন',
    color: 'পার্ল আইভরি ও গোল্ড সেলভেজ',
    colorHex: '#EFEAE1',
    availableColors: ['পার্ল আইভরি ও গোল্ড সেলভেজ', 'স্যাফরন ক্রিম', 'সফট পিচ'],
    pricePerYard: 490,
    discountPrice: 430,
    stockYards: 70,
    minOrderQuantity: 2.0,
    stepYard: 0.5,
    images: ['muslin_custom_1'],
    patternType: 'jamdani',
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 28
  },
  {
    id: 'prod-35-custom-2',
    name: 'পিওর মুগা তসর সিল্ক কাস্টম ফেব্রিক (৩.৫ বহর)',
    nameEn: 'Pure Tussar Silk Yardage for Custom Outfits',
    description: '',
    sku: 'FD-CUS-3502',
    fabricWidth: '3.5',
    category: 'কাস্টম ডিজাইন',
    fabricType: 'পিওর তসর সিল্ক',
    color: 'র-গোল্ডেন হানি বেজ',
    colorHex: '#C8AA78',
    availableColors: ['র-গোল্ডেন হানি বেজ', 'আর্থ ব্রাউন', 'অ্যান্টিক কপার'],
    pricePerYard: 460,
    discountPrice: 410,
    stockYards: 85,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['tussar_custom_2'],
    patternType: 'chanderi',
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: true,
    isActive: true,
    rating: 4.8,
    reviewCount: 19
  },

  // ==========================================
  // ২.৫ বহর কাপড় (42-44 inch Standard Width)
  // ==========================================

  // ২.৫ বহর — কামিজ (Kamiz Fabrics)
  {
    id: 'prod-25-kamiz-1',
    name: 'হ্যান্ড-ব্লক প্রিন্ট সুতি কামিজ ফেব্রিক (২.৫ বহর)',
    nameEn: 'Handloom Block Print Cotton Kameez Fabric',
    description: '',
    sku: 'FD-KAM-2501',
    fabricWidth: '2.5',
    category: 'কামিজ',
    fabricType: '১০০% ব্লক প্রিন্ট কটন',
    color: 'টেরাকোটা রাস্ট ও ক্রিম ব্লক',
    colorHex: '#A8523E',
    availableColors: ['টেরাকোটা রাস্ট ও ক্রিম ব্লক', 'ইনডিগো ব্লু প্রিন্ট', 'বটল গ্রিন', 'মারুন প্রিন্ট'],
    pricePerYard: 220,
    discountPrice: 195,
    stockYards: 310,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['print_indigo_1'],
    patternType: 'floral',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    rating: 4.8,
    reviewCount: 65
  },
  {
    id: 'prod-25-kamiz-2',
    name: 'ডিজাইনার নকশি কাঁথা এমব্রয়ডারি কামিজ ফেব্রিক (২.৫ বহর)',
    nameEn: 'Designer Kantha Embroidered Cotton Kameez Fabric',
    description: '',
    sku: 'FD-KAM-2502',
    fabricWidth: '2.5',
    category: 'কামিজ',
    fabricType: 'এমব্রয়ডারি কটন',
    color: 'রয়্যাল মাস্টার্ড ও কাঁথা স্টিচ',
    colorHex: '#C9963E',
    availableColors: ['রয়্যাল মাস্টার্ড ও কাঁথা স্টিচ', 'সি-গ্রিন', 'টেরাকোটা রেড'],
    pricePerYard: 280,
    discountPrice: 245,
    stockYards: 180,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['emb_mustard_1'],
    patternType: 'embroidery',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    rating: 4.8,
    reviewCount: 46
  },
  {
    id: 'prod-25-kamiz-3',
    name: 'প্রিমিয়াম বেক্সি ভয়েল ও সুতি কামিজ থান (২.৫ বহর)',
    nameEn: 'Premium Daily Wear Cotton Voile Fabric',
    description: '',
    sku: 'FD-KAM-2503',
    fabricWidth: '2.5',
    category: 'কামিজ',
    fabricType: 'সুতি কটন ভয়েল',
    color: 'ইনডিগো নীল ও আইভরি বুটি',
    colorHex: '#2E4C6D',
    availableColors: ['ইনডিগো নীল ও আইভরি বুটি', 'ক্লাসিক আইভরি', 'সফট অলিভ'],
    pricePerYard: 190,
    discountPrice: 170,
    stockYards: 400,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['cot_ivory_1'],
    patternType: 'cotton',
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    rating: 4.9,
    reviewCount: 72
  },

  // ২.৫ বহর — শর্ট কামিজ (Short Kamiz Fabrics)
  {
    id: 'prod-25-skam-1',
    name: 'প্রিমিয়াম অর্গানিক পিওর ফ্লেক্স লিনেন (২.৫ বহর)',
    nameEn: 'Premium Organic Pure Linen Fabric',
    description: '',
    sku: 'FD-SKM-2501',
    fabricWidth: '2.5',
    category: 'শর্ট কামিজ',
    fabricType: 'পিওর ফ্লেক্স লিনেন',
    color: 'ন্যাচারাল ওটমিল বেজ',
    colorHex: '#D7C4B7',
    availableColors: ['ন্যাচারাল ওটমিল বেজ', 'অলিভ ড্রাব', 'রাস্ট অরেঞ্জ'],
    pricePerYard: 310,
    discountPrice: 275,
    stockYards: 140,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['linen_beige_1'],
    patternType: 'linen',
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 33
  },
  {
    id: 'prod-25-skam-2',
    name: 'বোটানিক্যাল প্রিন্ট ভিসকোস রেয়ন ফেব্রিক (২.৫ বহর)',
    nameEn: 'Royal Viscose Rayon Floral Fabric',
    description: '',
    sku: 'FD-SKM-2502',
    fabricWidth: '2.5',
    category: 'শর্ট কামিজ',
    fabricType: 'ভিসকোস রেয়ন',
    color: 'ফরেস্ট সেজ ফ্লোরাল',
    colorHex: '#355843',
    availableColors: ['ফরেস্ট সেজ ফ্লোরাল', 'কোরাল রেড', 'ওয়ার্ম স্যান্ড'],
    pricePerYard: 230,
    discountPrice: 200,
    stockYards: 175,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['ray_green_1'],
    patternType: 'floral',
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.7,
    reviewCount: 18
  },

  // ২.৫ বহর — লং কটি (Long Koti Fabrics)
  {
    id: 'prod-25-koti-1',
    name: 'লাক্সারি ডামাস্ক জ্যাকার্ড লং কটি ফেব্রিক (২.৫ বহর)',
    nameEn: 'Luxury Floral Brocade Jacquard Fabric',
    description: '',
    sku: 'FD-KOT-2501',
    fabricWidth: '2.5',
    category: 'লং কটি',
    fabricType: 'ব্রোকেড জ্যাকার্ড',
    color: 'অ্যান্টিক ব্রোঞ্জ গোল্ড',
    colorHex: '#B89758',
    availableColors: ['অ্যান্টিক ব্রোঞ্জ গোল্ড', 'চারকোল গোল্ড', 'ডিপ মেরুন'],
    pricePerYard: 360,
    discountPrice: 315,
    stockYards: 90,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['jac_bronze_1'],
    patternType: 'chanderi',
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.8,
    reviewCount: 15
  },
  {
    id: 'prod-25-koti-2',
    name: 'হ্যান্ডলুম খাদি কটন জ্যাকার্ড কটি থান (২.৫ বহর)',
    nameEn: 'Handloom Khadi Jacquard Koti Fabric',
    description: '',
    sku: 'FD-KOT-2502',
    fabricWidth: '2.5',
    category: 'লং কটি',
    fabricType: 'খাদি জ্যাকার্ড',
    color: 'চারকোল টোপ ও গোল্ড সুতো',
    colorHex: '#4A423B',
    availableColors: ['চারকোল টোপ ও গোল্ড সুতো', 'টেরাকোটা', 'অলিভ গ্রিন'],
    pricePerYard: 290,
    discountPrice: 255,
    stockYards: 115,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['khadi_koti_2'],
    patternType: 'linen',
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    rating: 4.8,
    reviewCount: 22
  },

  // ২.৫ বহর — গাউন (Gown Fabrics)
  {
    id: 'prod-25-gown-1',
    name: 'সফট পার্টি ওয়্যার বাবল জর্জেট গাউন ফেব্রিক (২.৫ বহর)',
    nameEn: 'Party Wear Plain Bubble Georgette Fabric',
    description: '',
    sku: 'FD-GWN-2501',
    fabricWidth: '2.5',
    category: 'গাউন',
    fabricType: 'হেভি বাবল জর্জেট',
    color: 'ডিপ ওয়াইন বেরি',
    colorHex: '#6E2A3C',
    availableColors: ['ডিপ ওয়াইন বেরি', 'টিফানি টিল', 'মিডনাইট চারকোল'],
    pricePerYard: 240,
    discountPrice: 210,
    stockYards: 220,
    minOrderQuantity: 2.0,
    stepYard: 0.5,
    images: ['geo_berry_1'],
    patternType: 'silk',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    rating: 4.7,
    reviewCount: 25
  },
  {
    id: 'prod-25-gown-2',
    name: 'জরির বুটি ক্র্যাপ সিল্ক গাউন থান (২.৫ বহর)',
    nameEn: 'Zari Buti Crepe Silk Gown Fabric',
    description: '',
    sku: 'FD-GWN-2502',
    fabricWidth: '2.5',
    category: 'গাউন',
    fabricType: 'জরি ক্র্যাপ সিল্ক',
    color: 'শ্যাম্পেন রোজ গোল্ড',
    colorHex: '#C79B8B',
    availableColors: ['শ্যাম্পেন রোজ গোল্ড', 'পিকক গ্রিন', 'মেরুন'],
    pricePerYard: 330,
    discountPrice: 290,
    stockYards: 125,
    minOrderQuantity: 2.0,
    stepYard: 0.5,
    images: ['crepe_gown_2'],
    patternType: 'embroidery',
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 19
  },

  // ২.৫ বহর — কাস্টম ডিজাইন (Custom Design Fabrics)
  {
    id: 'prod-25-custom-1',
    name: 'সিল্কি ক্র্যাপ কাস্টম ড্রেস ফেব্রিক (২.৫ বহর)',
    nameEn: 'Silky Crepe Custom Dress Fabric',
    description: '',
    sku: 'FD-CUS-2501',
    fabricWidth: '2.5',
    category: 'কাস্টম ডিজাইন',
    fabricType: 'পিওর সিল্কি ক্র্যাপ',
    color: 'ডাস্টি রোজ টোপ',
    colorHex: '#C08081',
    availableColors: ['ডাস্টি রোজ টোপ', 'ওয়ার্ম স্যান্ড', 'সেজ গ্রিন'],
    pricePerYard: 250,
    discountPrice: 220,
    stockYards: 130,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['crp_rose_1'],
    patternType: 'silk',
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isActive: true,
    rating: 4.6,
    reviewCount: 21
  },
  {
    id: 'prod-25-custom-2',
    name: 'আর্টিজানাল হ্যান্ডলুম কটন সিল্ক থান (২.৫ বহর)',
    nameEn: 'Artisanal Handloom Cotton Silk Fabric',
    description: '',
    sku: 'FD-CUS-2502',
    fabricWidth: '2.5',
    category: 'কাস্টম ডিজাইন',
    fabricType: 'হ্যান্ডলুম কটন সিল্ক',
    color: 'আইভরি স্যান্ড ও গোল্ড বর্ডার',
    colorHex: '#E4DACB',
    availableColors: ['আইভরি স্যান্ড ও গোল্ড বর্ডার', 'অলিভ গোল্ড', 'টেরাকোটা'],
    pricePerYard: 310,
    discountPrice: 270,
    stockYards: 105,
    minOrderQuantity: 1.5,
    stepYard: 0.5,
    images: ['handloom_cus_2'],
    patternType: 'jamdani',
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 24
  }
];

export const INITIAL_MEASUREMENT_RULES: MeasurementOutfitRule[] = [
  // ৩.৫ বহর Outfit rules
  { id: 'rule-35-1', name: 'কামিজ', nameEn: 'Kameez', fabricWidth: '3.5', baseYards: 2.0, category: 'কামিজ', description: 'স্ট্যান্ডার্ড কামিজের জন্য ৩.৫ বহরে মাত্র ২.০ গজ লাগে', isActive: true },
  { id: 'rule-35-2', name: 'শর্ট কামিজ', nameEn: 'Short Kameez', fabricWidth: '3.5', baseYards: 1.5, category: 'শর্ট কামিজ', description: 'শর্ট লেন্থ বা কুর্তি স্টাইল', isActive: true },
  { id: 'rule-35-3', name: 'লং কটি', nameEn: 'Long Koti', fabricWidth: '3.5', baseYards: 3.5, category: 'লং কটি', description: 'ফুল লেন্থ গর্জিয়াস লং কটি', isActive: true },
  { id: 'rule-35-4', name: 'গাউন / লেহেঙ্গা', nameEn: 'Gown / Lehenga', fabricWidth: '3.5', baseYards: 3.5, category: 'গাউন / লেহেঙ্গা', description: 'ভারী ঘেরের পার্টি গাউন বা লেহেঙ্গার নিচের অংশ', isActive: true },
  { id: 'rule-35-5', name: 'শাড়ি', nameEn: 'Saree', fabricWidth: '3.5', baseYards: 6.0, category: 'শাড়ি', description: '১২ হাত ফুল শাড়ি ব্লাউজ ছাড়া', isActive: true },
  { id: 'rule-35-6', name: 'কাস্টম ডিজাইন', nameEn: 'Custom Design', fabricWidth: '3.5', baseYards: 2.5, category: 'কাস্টম ডিজাইন', description: 'আপনার প্রয়োজনমতো গজ নির্বাচন', isActive: true },

  // ২.৫ বহর Outfit rules
  { id: 'rule-25-1', name: 'কামিজ', nameEn: 'Kameez', fabricWidth: '2.5', baseYards: 2.5, category: 'কামিজ', description: '২.৫ বহরে কামিজ তৈরিতে সাধারণত ২.৫ গজ লাগে', isActive: true },
  { id: 'rule-25-2', name: 'শর্ট কামিজ', nameEn: 'Short Kameez', fabricWidth: '2.5', baseYards: 2.5, category: 'শর্ট কামিজ', description: 'শর্ট কামিজ বা কুর্তির জন্য', isActive: true },
  { id: 'rule-25-3', name: 'লং কটি', nameEn: 'Long Koti', fabricWidth: '2.5', baseYards: 4.5, category: 'লং কটি', description: '২.৫ বহরের জন্য ফুল ঘের লং কটিতে ৪.৫ গজ লাগে', isActive: true },
  { id: 'rule-25-4', name: 'গাউন', nameEn: 'Gown', fabricWidth: '2.5', baseYards: 4.5, category: 'গাউন', description: 'স্টাইলিশ গাউনের জন্য ৪.৫ গজ', isActive: true },
  { id: 'rule-25-5', name: 'কাস্টম ডিজাইন', nameEn: 'Custom Design', fabricWidth: '2.5', baseYards: 3.0, category: 'কাস্টম ডিজাইন', description: 'আপনার পছন্দমতো গজ হিসাব', isActive: true }
];

export const INITIAL_ADDITIONAL_ITEMS: AdditionalClothingItem[] = [
  // ৩.৫ বহর additions
  { id: 'add-35-inner', name: 'ইনার (Inner)', nameEn: 'Inner', fabricWidth: '3.5', yardsPerUnit: 2.0, isActive: true },
  { id: 'add-35-pant', name: 'প্যান্ট (Pant)', nameEn: 'Pant', fabricWidth: '3.5', yardsPerUnit: 2.0, isActive: true },
  { id: 'add-35-palazzo', name: 'প্লাজো (Palazzo)', nameEn: 'Palazzo', fabricWidth: '3.5', yardsPerUnit: 2.5, isActive: true },
  { id: 'add-35-orna', name: 'সেটের ওড়না (Orna)', nameEn: 'Set Orna', fabricWidth: '3.5', yardsPerUnit: 2.5, isActive: true },
  { id: 'add-35-scarf', name: 'স্কার্ট (Skirt)', nameEn: 'Skirt', fabricWidth: '3.5', yardsPerUnit: 3.0, isActive: true },
  { id: 'add-35-blouse', name: 'ব্লাউজ (Blouse)', nameEn: 'Blouse', fabricWidth: '3.5', yardsPerUnit: 1.5, isActive: true },

  // ২.৫ বহর additions
  { id: 'add-25-pant', name: 'প্যান্ট (Pant)', nameEn: 'Pant', fabricWidth: '2.5', yardsPerUnit: 2.5, isActive: true },
  { id: 'add-25-palazzo', name: 'প্লাজো প্যান্ট (Palazzo Pant)', nameEn: 'Palazzo Pant', fabricWidth: '2.5', yardsPerUnit: 2.5, isActive: true },
  { id: 'add-25-orna', name: 'সেটের ওড়না (Orna)', nameEn: 'Set Orna', fabricWidth: '2.5', yardsPerUnit: 2.5, isActive: true },
  { id: 'add-25-scarf', name: 'স্কার্ট (Skirt)', nameEn: 'Skirt', fabricWidth: '2.5', yardsPerUnit: 3.0, isActive: true }
];

export const INITIAL_ADDON_FABRIC_COLLECTIONS: Record<string, AddonFabricOption[]> = {
  inner: [
    {
      id: 'addon-inner-1',
      addonId: 'inner',
      name: 'রয়েল বাটার সিল্ক ইনার ফেব্রিক (Royal Butter Silk)',
      fabricType: 'বাটার সিল্ক (Butter Silk)',
      color: 'ম্যাচিং ডাই (পোশাকের রঙ অনুযায়ী)',
      colorHex: '#C5A46D',
      pricePerYard: 120,
      image: '/src/assets/images/addon_inner_no_human_1794225834157.jpg',
      description: 'কামিজ ও গাউনের ভেতরের জন্য অত্যন্ত মোলায়েম, মসৃণ ও প্রিমিয়াম কমফোর্ট বাটার সিল্ক।',
      isDefault: true,
      isActive: true,
      order: 1
    },
    {
      id: 'addon-inner-2',
      addonId: 'inner',
      name: 'পিওর সেন্টুন সিল্ক ইনার ফেব্রিক (Pure Shantoon)',
      fabricType: 'সেন্টুন সিল্ক (Pure Shantoon)',
      color: 'পার্টি শাইন ডাই',
      colorHex: '#850B1B',
      pricePerYard: 150,
      image: '/src/assets/images/addon_inner_no_human_1794225834157.jpg',
      description: 'ভারী জামদানি, জর্জেট ও ব্রাইডাল পোশাকের জন্য সেরা দীর্ঘস্থায়ী ও উজ্জ্বল শাইন সেন্টুন।',
      isDefault: false,
      isActive: true,
      order: 2
    },
    {
      id: 'addon-inner-3',
      addonId: 'inner',
      name: '১০০% পিওর কটন নরম কমফোর্ট ইনার (Pure Cotton)',
      fabricType: '১০০% পিওর সুতি ভয়েল',
      color: 'ন্যাচারাল সফট আইভরি / ম্যাচিং ডাই',
      colorHex: '#FAF3E8',
      pricePerYard: 110,
      image: '/src/assets/images/addon_inner_no_human_1794225834157.jpg',
      description: 'গরমের দিনে দৈনন্দিন ব্যবহারের জন্য সর্বোচ্চ আরামদায়ক, কোমল ও ঘাম শোষক ১০০% সুতি।',
      isDefault: false,
      isActive: true,
      order: 3
    },
    {
      id: 'addon-inner-4',
      addonId: 'inner',
      name: 'সফট জাপানিজ ক্রেপ ইনার (Japanese Soft Crepe)',
      fabricType: 'সিল্কি ক্রেপ',
      color: 'ম্যাট ফিনিশ ডাই',
      colorHex: '#3D3D3D',
      pricePerYard: 130,
      image: '/src/assets/images/addon_inner_no_human_1794225834157.jpg',
      description: 'রিংকেল-ফ্রি, লাইটওয়েট এবং শরীরে চমৎকার কুঁচি ফল দেওয়ার জন্য আধুনিক জাপানিজ ক্রেপ।',
      isDefault: false,
      isActive: true,
      order: 4
    },
    {
      id: 'addon-inner-5',
      addonId: 'inner',
      name: 'চান্দেরি সিল্ক ইনার লাইনিং (Chanderi Silk Lining)',
      fabricType: 'চান্দেরি সিল্ক',
      color: 'গোল্ডেন আইভরি লাস্টার',
      colorHex: '#DFC9AA',
      pricePerYard: 140,
      image: '/src/assets/images/addon_inner_no_human_1794225834157.jpg',
      description: 'পার্টি ওয়্যার ও গর্জিয়াস কামিজের জন্য রাজকীয় চান্দেরি শাইন ও স্ট্রাকচারড ড্রেপ।',
      isDefault: false,
      isActive: true,
      order: 5
    }
  ],
  pant: [
    {
      id: 'addon-pant-1',
      addonId: 'pant',
      name: 'রয়েল র সিল্ক প্যান্ট ফেব্রিক (Royal Raw Silk)',
      fabricType: 'র সিল্ক (Raw Silk)',
      color: 'ম্যাচিং ডাই',
      colorHex: '#850B1B',
      pricePerYard: 180,
      image: '/src/assets/images/addon_pant_no_human_1794225834730.jpg',
      description: 'সিগার প্যান্ট ও ট্রাউজারের নিখুঁত ফল ও গর্জিয়াস লুকিং র সিল্ক ফেব্রিক।',
      isDefault: true,
      isActive: true,
      order: 1
    },
    {
      id: 'addon-pant-2',
      addonId: 'pant',
      name: 'পিওর সুতি ভয়েল প্যান্ট কাপড় (Pure Cotton Pant)',
      fabricType: '১০০% পিওর কটন',
      color: 'ন্যাচারাল সফট ডাই',
      colorHex: '#FAF3E8',
      pricePerYard: 130,
      image: '/src/assets/images/addon_pant_no_human_1794225834730.jpg',
      description: 'দৈনন্দিন আরাম ও নিয়মিত পরিধানের জন্য শতভাগ নরম সুতি কাপড়।',
      isDefault: false,
      isActive: true,
      order: 2
    },
    {
      id: 'addon-pant-3',
      addonId: 'pant',
      name: 'স্ট্রেচেবল লাইক্রা কটন প্যান্ট (Lycra Stretch Cotton)',
      fabricType: 'লাইক্রা কটন',
      color: 'ম্যাচিং ডাই',
      colorHex: '#4A3B32',
      pricePerYard: 160,
      image: '/src/assets/images/addon_pant_no_human_1794225834730.jpg',
      description: 'অতিরিক্ত আরামদায়ক ও স্ট্রেচ সুবিধার কারণে পারফেক্ট ফিটিং প্যান্ট তৈরি হয়।',
      isDefault: false,
      isActive: true,
      order: 3
    }
  ],
  palazzo: [
    {
      id: 'addon-palazzo-1',
      addonId: 'palazzo',
      name: 'সফট জর্জেট ফ্লোয়িং প্লাজো কাপড় (Heavy Georgette)',
      fabricType: 'হেভি সিল্কি জর্জেট',
      color: 'ম্যাচিং ডাই',
      colorHex: '#850B1B',
      pricePerYard: 170,
      image: '/src/assets/images/addon_palazzo_no_human_1794225836589.jpg',
      description: 'চমৎকার কুঁচি, ঘের এবং ফ্লোয়িং লুকের জন্য হাই-গ্রেড জর্জেট ফেব্রিক।',
      isDefault: true,
      isActive: true,
      order: 1
    },
    {
      id: 'addon-palazzo-2',
      addonId: 'palazzo',
      name: 'প্রিমিয়াম কটন রিংকেল ফ্রি প্লাজো (Cotton Palazzo)',
      fabricType: 'সফট কটন',
      color: 'অফ-হোয়াইট / ম্যাচিং ডাই',
      colorHex: '#EAE5D9',
      pricePerYard: 140,
      image: '/src/assets/images/addon_palazzo_no_human_1794225836589.jpg',
      description: 'নরম সুতি ফেব্রিক যা দীর্ঘসময় পরিধানে শরীর আরামদায়ক ও ঠান্ডা রাখে।',
      isDefault: false,
      isActive: true,
      order: 2
    }
  ],
  orna: [
    {
      id: 'addon-orna-1',
      addonId: 'orna',
      name: 'শিফন জর্জেট ম্যাচিং ওড়না কাপড় (Pure Chiffon)',
      fabricType: 'পিওর শিফন জর্জেট',
      color: 'ম্যাচিং ডাই',
      colorHex: '#850B1B',
      pricePerYard: 160,
      image: '/src/assets/images/addon_set_orna_no_human_1794225838844.jpg',
      description: 'হালকা, মোলায়েম ও মাথায় চমৎকারভাবে আটকে থাকার মতো প্রিমিয়াম শিফন জর্জেট।',
      isDefault: true,
      isActive: true,
      order: 1
    },
    {
      id: 'addon-orna-2',
      addonId: 'orna',
      name: 'চান্দেরি জরি পার ওড়না কাপড় (Chanderi Zari)',
      fabricType: 'চান্দেরি জরি উইভিং',
      color: 'গোল্ডেন জরি বর্ডার',
      colorHex: '#D4AF37',
      pricePerYard: 210,
      image: '/src/assets/images/addon_set_orna_no_human_1794225838844.jpg',
      description: 'পার্টি ও বিয়ের অনুষ্ঠানের জন্য গর্জিয়াস জরি পার দেওয়া চান্দেরি সিল্ক ওড়না।',
      isDefault: false,
      isActive: true,
      order: 2
    }
  ],
  skirt: [
    {
      id: 'addon-skirt-1',
      addonId: 'skirt',
      name: 'স্যাটিন সিল্ক ফ্ল্যায়ার্ড স্কার্ট ফেব্রিক (Satin Silk)',
      fabricType: 'হেভি স্যাটিন সিল্ক',
      color: 'ম্যাচিং শাইন ডাই',
      colorHex: '#6B0812',
      pricePerYard: 190,
      image: '/src/assets/images/outfit_lehenga_no_human_1794205254301.jpg',
      description: 'বড় ঘেরের স্কার্টের জন্য চমৎকার গ্লেজি শাইন ও ভারী ড্রেপ কোয়ালিটি।',
      isDefault: true,
      isActive: true,
      order: 1
    }
  ],
  blouse: [
    {
      id: 'addon-blouse-1',
      addonId: 'blouse',
      name: 'বেনারসি জরি উইভ ব্লাউজ থান (Banarasi Zari Brocade)',
      fabricType: 'বেনারসি ব্রোকেড সিল্ক',
      color: 'রয়েল গোল্ডেন জরি উইভিং',
      colorHex: '#C5A46D',
      pricePerYard: 250,
      image: '/src/assets/images/addon_blouse_no_human_1794225839884.jpg',
      description: 'শাড়ি ও লেহেঙ্গার সাথে পরার জন্য গর্জিয়াস গোল্ডেন জরির খাঁটি বেনারসি ফেব্রিক।',
      isDefault: true,
      isActive: true,
      order: 1
    },
    {
      id: 'addon-blouse-2',
      addonId: 'blouse',
      name: 'রয়েল র সিল্ক ব্লাউজ পিস (Royal Raw Silk)',
      fabricType: 'র সিল্ক',
      color: 'ম্যাচিং সলিড ডাই',
      colorHex: '#850B1B',
      pricePerYard: 200,
      image: '/src/assets/images/addon_blouse_no_human_1794225839884.jpg',
      description: 'ক্লাসিক ও মার্জিত ডিজাইনের আধুনিক ব্লাউজের জন্য আদর্শ সিল্কি ফেব্রিক।',
      isDefault: false,
      isActive: true,
      order: 2
    }
  ]
};

export const INITIAL_PAYMENT_SETTINGS: PaymentSettings = {
  bkash: {
    enabled: true,
    number: '01712345678',
    type: 'Personal',
    instructions: 'প্রথমে উপরের বিকাশ নম্বরে Send Money করুন, তারপর নিচের ঘরে আপনার বিকাশ নম্বর ও Transaction ID (TrxID) লিখে অর্ডার নিশ্চিত করুন।'
  },
  nagad: {
    enabled: true,
    number: '01812345678',
    type: 'Personal',
    instructions: 'প্রথমে উপরের নগদ নম্বরে Send Money করুন, তারপর নিচের ঘরে আপনার নগদ নম্বর ও Transaction ID (TrxID) লিখে অর্ডার নিশ্চিত করুন।'
  },
  cod: {
    enabled: true,
    note: 'কাপড় হাতে পেয়ে দেখে ডেলিভারি ম্যানের কাছে মূল্য পরিশোধ করুন। কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।'
  }
};

export const INITIAL_FABRIC_WIDTH_CARDS: FabricWidthCardConfig[] = [
  {
    widthKey: '3.5',
    badgeTitle: '৩.৫ হাত বহর',
    descLine1: 'প্রশস্ত ও রাজকীয় পোশাক',
    descLine2: 'তৈরির জন্য আদর্শ কাপড়',
    ctaText: 'কাপড় দেখুন',
    fabricImage: '/assets/fabric-banner-3-5.png',
    fabricAlt: '৩.৫ হাত বহর প্রিমিয়াম লাল ও আইভরি সিল্ক কাপড়',
  },
  {
    widthKey: '2.5',
    badgeTitle: '২.৫ হাত বহর',
    descLine1: 'হালকা ও দৈনন্দিন পোশাক',
    descLine2: 'তৈরির জন্য উপযোগী কাপড়',
    ctaText: 'কাপড় দেখুন',
    fabricImage: '/assets/fabric-banner-2-5.png',
    fabricAlt: '২.৫ হাত বহর প্রিমিয়াম মিস্টি পিঙ্ক সিল্ক কাপড়',
  },
];

export const INITIAL_HOMEPAGE_CONFIG: HomepageConfig = {
  heroSlides: [
    {
      id: 'slide-1',
      image: '',
      badge: 'PREMIUM FABRIC COLLECTION',
      headlineMobile1: 'পোশাকে ফুটুক আপনার আভিজাত্য',
      headlineMobile2: 'ঐতিহ্যে আধুনিকতা',
      headlineDesktop1: 'আপনার পছন্দের কাপড়,',
      headlineDesktop2: 'এখন গজ হিসেবে',
      subheadline: 'প্রিমিয়াম মানের কাপড় বেছে নিন আপনার পছন্দের ডিজাইন ও পোশাক তৈরির জন্য।',
      priceHighlight: 'প্রিমিয়াম মানের জামদানি, সিল্ক ও আকর্ষণীয় ডিজাইনের কাপড় বেছে নিন আপনার পছন্দের পোশাক তৈরির জন্য।',
      ctaPrimary: 'কাপড় কিনুন',
      ctaSecondary: 'গজ হিসাব করুন',
      ctaPrimaryPage: 'shop',
      ctaSecondaryPage: 'calculator',
      isActive: true
    },
    {
      id: 'slide-2',
      image: '/assets/aistudio/image_ebb4447e.png',
      badge: '3.5 BAHAR LUXURY COLLECTION',
      headlineMobile1: '৩.৫ বহরের রাজকীয় কাপড়',
      headlineMobile2: 'জোড়া ছাড়াই পোশাক',
      headlineDesktop1: '৩.৫ বহরের রাজকীয় কাপড়,',
      headlineDesktop2: 'জোড়া ছাড়াই পোশাক',
      subheadline: 'কামিজ, লং কটি, পার্টি গাউন, লেহেঙ্গা ও ১২ হাত শাড়ির জন্য প্রশস্ত ৫৬–৬০ ইঞ্চি বহরের প্রিমিয়াম থান।',
      priceHighlight: 'কামিজ, লং কটি, পার্টি গাউন, লেহেঙ্গা ও ১২ হাত শাড়ির জন্য প্রশস্ত ৫৬–৬০ ইঞ্চি বহরের প্রিমিয়াম থান।',
      ctaPrimary: '৩.৫ বহর দেখুন',
      ctaSecondary: 'গজ হিসাব করুন',
      ctaPrimaryPage: 'fabric-width',
      ctaSecondaryPage: 'calculator',
      isActive: true
    },
    {
      id: 'slide-3',
      image: '/assets/aistudio/image_fc061659.png',
      badge: '2.5 BAHAR ARTISANAL TEXTILES',
      headlineMobile1: 'খাঁটি সুতি ও এমব্রয়ডারি',
      headlineMobile2: 'সঠিক গজের নিশ্চয়তা',
      headlineDesktop1: 'খাঁটি সুতি ও এমব্রয়ডারি,',
      headlineDesktop2: 'সঠিক গজের নিশ্চয়তা',
      subheadline: 'প্রতিদিনের আরামদায়ক কামিজ, শর্ট কুর্তি ও গাউনের জন্য ২.৫ বহরের বাছাইকৃত সুতি, লিনেন ও জর্জেট কাপড়।',
      priceHighlight: 'প্রতিদিনের আরামদায়ক কামিজ, শর্ট কুর্তি ও গাউনের জন্য ২.৫ বহরের বাছাইকৃত সুতি, লিনেন ও জর্জেট কাপড়।',
      ctaPrimary: '২.৫ বহর দেখুন',
      ctaSecondary: 'গজ হিসাব করুন',
      ctaPrimaryPage: 'fabric-width',
      ctaSecondaryPage: 'calculator',
      isActive: true
    },
    {
      id: 'slide-4',
      image: '/assets/aistudio/image_04b252d4.png',
      badge: 'BESPOKE TAILORING YARDAGE',
      headlineMobile1: 'বারো হাত শাড়ি বা গাউন',
      headlineMobile2: 'নিজের মাপে অর্ডার করুন',
      headlineDesktop1: 'বারো হাত শাড়ি বা গাউন,',
      headlineDesktop2: 'নিজের মাপে অর্ডার করুন',
      subheadline: 'আমাদের স্মার্ট গজ ক্যালকুলেটরে আপনার উচ্চতা ও পোশাকের ধরন দিয়ে সহজেই প্রয়োজনীয় গজ জেনে নিন।',
      priceHighlight: 'আমাদের স্মার্ট গজ ক্যালকুলেটরে আপনার উচ্চতা ও পোশাকের ধরন দিয়ে সহজেই প্রয়োজনীয় গজ জেনে নিন।',
      ctaPrimary: 'কাস্টম ডিজাইন',
      ctaSecondary: 'গজ হিসাব করুন',
      ctaPrimaryPage: 'custom-design',
      ctaSecondaryPage: 'calculator',
      isActive: true
    }
  ],
  sections: [
    {
      id: 'hero',
      label: 'হিরো স্লাইডার ব্যানার (Hero Slider)',
      eyebrow: 'PREMIUM FABRIC COLLECTION',
      heading: 'আপনার পছন্দের কাপড়, এখন গজ হিসেবে',
      description: 'প্রিমিয়াম মানের কাপড় বেছে নিন আপনার পছন্দের ডিজাইন ও পোশাক তৈরির জন্য।',
      buttonText: 'কাপড় কিনুন',
      isVisible: true,
      order: 1
    },
    {
      id: 'fabric_width',
      label: 'বহর ভিত্তিক কালেকশন (৩.৫ ও ২.৫ বহর)',
      eyebrow: 'Fabric Collection',
      heading: 'বহর অনুযায়ী কাপড় বেছে নিন',
      description: 'আপনার প্রয়োজন অনুযায়ী ৩.৫ ও ২.৫ বহরের প্রিমিয়াম সিল্ক কাপড়ের কালেকশন দেখুন।',
      buttonText: 'কালেকশন দেখুন',
      isVisible: true,
      order: 2
    },
    {
      id: 'exclusive',
      label: 'এক্সক্লুসিভ কালেকশন (ফিচারড / বেস্ট-সেলার / নতুন)',
      eyebrow: 'EXCLUSIVE FABRIC COLLECTION',
      heading: 'প্রিমিয়াম কাপড়ের বিশেষ কালেকশন',
      description: 'আপনার পছন্দের ডিজাইন, রং ও বহর অনুযায়ী বেছে নিন সেরা মানের কাপড়।',
      buttonText: 'সম্পূর্ণ কালেকশন দেখুন',
      isVisible: true,
      order: 3
    },
    {
      id: 'all_products',
      label: 'সকল কাপড়ের কালেকশন (All Products)',
      eyebrow: 'EXPLORE ALL PRODUCTS',
      heading: 'সকল কাপড়ের কালেকশন',
      description: 'আপনার পছন্দের ডিজাইন, রং ও বহরের সব কাপড় এক জায়গায় খুঁজে নিন।',
      buttonText: 'সব কাপড় দেখুন',
      isVisible: true,
      order: 4
    },
    {
      id: 'promo_banner',
      label: 'প্রমোশনাল অফার ব্যানার (Promotional Banner)',
      eyebrow: 'স্পেশাল ফেস্টিভ অফার',
      heading: '২৫০০ টাকার বেশি অর্ডারে সারা বাংলাদেশে ফ্রি ডেলিভারি!',
      description: 'প্রিমিয়াম জামদানি, সিল্ক, অরগানজা ও সুতি থান কাপড়ে চলছে বিশেষ মূল্যছাড়। কুপন কোড DONIYA10 ব্যবহারে ১০% ছাড়!',
      buttonText: 'অফার কালেকশন দেখুন',
      isVisible: false,
      order: 5
    },
    {
      id: 'calculator',
      label: 'স্মার্ট গজ ক্যালকুলেটর (Yardage Calculator)',
      eyebrow: 'SMART YARDAGE CALCULATOR',
      heading: 'পোশাকের জন্য কত গজ কাপড় লাগবে হিসাব করুন',
      description: 'কাপড়ের বহর, পোশাকের ধরন এবং আপনার উচ্চতা নির্বাচন করলেই সঠিক গজের পরিমাণ ও আনুমানিক মূল্য সাথে সাথে জানতে পারবেন।',
      buttonText: 'গজ হিসাব করুন',
      isVisible: true,
      order: 6
    }
  ],
  promotionalBanners: [
    {
      id: 'promo-1',
      badge: 'স্পেশাল ফেস্টিভ অফার · সীমিত সময়',
      title: '২৫০০ টাকার বেশি অর্ডারে সারা বাংলাদেশে ফ্রি ডেলিভারি!',
      subtitle: 'প্রিমিয়াম জামদানি, সিল্ক, অরগানজা ও সুতি থান কাপড়ে চলছে বিশেষ মূল্যছাড়। কুপন কোড DONIYA10 ব্যবহারে ১০% ছাড়!',
      buttonText: 'অফার কালেকশন দেখুন',
      buttonPage: 'shop',
      backgroundImage: '/assets/aistudio/image_ebb4447e.png',
      isActive: false
    }
  ],
  fabricWidthCards: INITIAL_FABRIC_WIDTH_CARDS,
  showExclusiveTabFeatured: true,
  showExclusiveTabBestSeller: true,
  showExclusiveTabNewArrival: true
};

export const INITIAL_CONTENT_CONFIG: WebsiteContentConfig = {
  aboutPage: {
    badge: 'আমাদের গল্প ও ঐতিহ্য',
    heroTitle: 'বাংলার ঐতিহ্যবাহী বুনন ও প্রিমিয়াম গজ কাপড়ের বিশ্বস্ত ঠিকানা',
    heroDescription: 'Fashion Doniya BD শুধুমাত্র একটি কাপড়ের দোকান নয় — এটি আপনার স্বপ্নের পোশাক তৈরির প্রথম ধাপ। আমরা বিশ্বাস করি প্রতিটি মানুষের শরীরের গড়ন ও রুচি আলাদা, তাই রেডিমেড পোশাকের সীমাবদ্ধতা ছাড়িয়ে আমরা নিয়ে এসেছি সেরা মানের আনস্টিচড গজ কাপড়।',
    storyBadge: 'কেন গজ কাপড়?',
    storyTitle: 'আপনার মাপ, আপনার ডিজাইন, আমাদের সেরা ফেব্রিক',
    storyParagraph1: 'অনেকেই অনলাইনে পোশাক কিনে সাইজ বা কাপড়ের মান নিয়ে হতাশ হন। আবার টেইলারের দোকানে গিয়ে কাপড় কিনতে গেলে ঠিক কত গজ কাপড় লাগবে তা নিয়ে দ্বিধায় পড়েন — বিশেষ করে ২.৫ হাত বহর এবং ৩.৫ হাত বহরের পার্থক্যের কারণে।',
    storyParagraph2: 'এই সমস্যার স্থায়ী সমাধান দিতেই Fashion Doniya BD তৈরি করেছে বাংলাদেশে প্রথম স্মার্ট গজ ক্যালকুলেটর সমৃদ্ধ অনলাইন ফেব্রিক স্টোর। এখানে আপনি নিজেই পোশাকের ধরন, শরীরের উচ্চতা ও অতিরিক্ত অংশ (ওড়না, সালোয়ার, প্লাজো) বেছে নিয়ে সঠিক গজ জেনে অর্ডার করতে পারবেন।',
    valuesTitle: 'আমাদের বিশেষত্ব',
    valuesSubtitle: 'প্রতিটি সুতায় কোয়ালিটি এবং বিশ্বস্ততার অঙ্গীকার',
    ctaTitle: 'আজই আপনার পছন্দের কাপড় বেছে নিন',
    ctaSubtitle: 'সারা বাংলাদেশে দ্রুত ক্যাশ অন ডেলিভারি সুবিধা।'
  },
  contactPage: {
    title: 'যোগাযোগ করুন',
    subtitle: 'কাপড়ের বহর, গজ হিসাব বা অর্ডার সংক্রান্ত যেকোনো প্রশ্নে আমরা আছি আপনার পাশে',
    formTitle: 'আমাদের মেসেজ পাঠান',
    workingHours: 'শনিবার - বৃহস্পতিবার (সকাল ১০টা - রাত ১০টা)'
  },
  faqTitle: 'সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)',
  faqSubtitle: 'গজ কাপড়, বহর এবং অর্ডার সংক্রান্ত সকল প্রশ্নের সহজ উত্তর',
  faqs: [
    {
      id: 'faq-1',
      q: '২.৫ বহর এবং ৩.৫ বহর কাপড়ের মধ্যে পার্থক্য কী?',
      a: '২.৫ হাত বহর কাপড়ের চওড়া সাধারণত ৪২ থেকে ৪৪ ইঞ্চি হয়, যা রেগুলার কামিজ ও সালোয়ারের জন্য ব্যবহৃত হয়। অন্যদিকে ৩.৫ হাত বহর কাপড়ের চওড়া ৫৬ থেকে ৬০ ইঞ্চি (বড় বহর) হয়, ফলে এতে তুলনামূলক কম গজে পূর্ণাঙ্গ কামিজ, গাউন বা শাড়ি তৈরি করা যায়।',
      order: 1,
      isActive: true
    },
    {
      id: 'faq-2',
      q: 'একটি সাধারণ কামিজ বানাতে কত গজ কাপড় লাগে?',
      a: '৩.৫ হাত বড় বহরের কাপড়ে সাধারণত ২ গজ থেকে ২.৫ গজেই ফুল হাতা কামিজ হয়ে যায়। আর ২.৫ হাত বহরের কাপড়ে কামিজের জন্য ৩ গজ কাপড় প্রয়োজন হয়। আমাদের "গজ ক্যালকুলেটর" ব্যবহার করে আপনার উচ্চতা ও বডি সাইজ অনুযায়ী নিখুঁত হিসাব দেখে নিতে পারেন।',
      order: 2,
      isActive: true
    },
    {
      id: 'faq-3',
      q: 'আমি কি দশমিক বা আধা গজ (যেমন ২.৫ গজ বা ৩.৫ গজ) অর্ডার করতে পারব?',
      a: 'হ্যাঁ! Fashion Doniya BD-তে আপনি ০.৫ গজ (আধা গজ) বিরতিতে যেমন ১.৫ গজ, ২.০ গজ, ২.৫ গজ, ৩.৫ গজ ইত্যাদি যেকোনো পরিমাণে কাপড় অর্ডার করতে পারবেন।',
      order: 3,
      isActive: true
    },
    {
      id: 'faq-4',
      q: 'আপনারা কি পোশাক সেলাই করে দেন নাকি শুধু গজ কাপড় বিক্রি করেন?',
      a: 'আমরা মূলত প্রিমিয়াম আনস্টিচড গজ কাপড় (Thaan/Yard Fabric) বিক্রি করি যাতে আপনি আপনার নিজের পছন্দের টেইলার দিয়ে নিখুঁত ফিটিংয়ে সেলাই করে নিতে পারেন। তবে কাস্টম ডিজাইন রিকোয়েস্টের মাধ্যমে বিশেষ অর্ডারে আমরা গাইডলাইন প্রদান করি।',
      order: 4,
      isActive: true
    },
    {
      id: 'faq-5',
      q: 'ডেলিভারি চার্জ কত এবং কত দিনে ডেলিভারি পাব?',
      a: 'ঢাকা সিটির ভেতরে ডেলিভারি চার্জ ৬০ টাকা (১-২ কার্যদিবস) এবং ঢাকার বাইরে সারা বাংলাদেশে ১২০ টাকা (২-৪ কার্যদিবস)। ২৫০০ টাকার বেশি অর্ডারে ডেলিভারি সম্পূর্ণ ফ্রি!',
      order: 5,
      isActive: true
    },
    {
      id: 'faq-6',
      q: 'কাপড় হাতে পাওয়ার পর কোনো সমস্যা থাকলে রিটার্ন করা যাবে কি?',
      a: 'যেহেতু প্রতিটি অর্ডারে আপনার নির্দিষ্ট মাপ অনুযায়ী থান থেকে কাপড় কাটা হয়, তাই কাটা কাপড় সাধারণত পরিবর্তনযোগ্য নয়। তবে কাপড়ে কোনো ছেঁড়া, দাগ বা ভুল ডিজাইন ডেলিভারি হলে ডেলিভারি ম্যানের সামনে চেক করে সাথে সাথে রিটার্ন বা এক্সচেঞ্জ করতে পারবেন।',
      order: 6,
      isActive: true
    }
  ],
  deliveryPolicy: {
    badge: 'শিপিং ও ডেলিভারি তথ্য',
    title: 'ডেলিভারি পলিসি (Delivery Policy)',
    subtitle: 'সারা বাংলাদেশে দ্রুত, নিরাপদ এবং যত্নসহকারে গজ কাপড় পৌঁছে দেওয়ার অঙ্গীকার',
    sections: [
      {
        heading: '১. ডেলিভারি সময়সীমা',
        body: 'অর্ডার কনফার্ম হওয়ার পর আমাদের দক্ষ কাটিং টিম আপনার নির্দিষ্ট গজ অনুযায়ী কাপড় নিখুঁতভাবে কেটে ও ভাঁজ করে প্যাকিং করে। ঢাকা মেট্রোপলিটন এলাকার ভেতরে ১ থেকে ২ কার্যদিবস এবং ঢাকার বাইরে যেকোনো জেলা বা উপজেলায় ২ থেকে ৪ কার্যদিবসের মধ্যে হোম ডেলিভারি সম্পন্ন হয়।'
      },
      {
        heading: '২. ডেলিভারি চার্জ ও ফ্রি ডেলিভারি সুবিধা',
        body: 'ঢাকা সিটির ভেতরে ডেলিভারি চার্জ মাত্র ৬০ টাকা এবং ঢাকার বাইরে সারা বাংলাদেশে ১২০ টাকা। তবে এক অর্ডারে ২,৫০০ টাকা বা তার বেশি মূল্যের কাপড় অর্ডার করলে সারা বাংলাদেশে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!'
      },
      {
        heading: '৩. ক্যাশ অন ডেলিভারি ও পার্সেল চেকিং',
        body: 'আমরা দিচ্ছি ১০০% ক্যাশ অন ডেলিভারি সুবিধা। ডেলিভারি ম্যানের কাছ থেকে পার্সেল বুঝে নেওয়ার সময় অনুগ্রহ করে কাপড়ের রং, বহর এবং গজ মিলিয়ে দেখে নিন।'
      },
      {
        heading: '৪. কুরিয়ার পার্টনার ও ট্র্যাকিং',
        body: 'আমরা Steadfast, Pathao এবং RedX কুরিয়ারের মাধ্যমে সারা বাংলাদেশে হোম ডেলিভারি প্রদান করি। পার্সেল শিপমেন্ট হওয়ার সাথে সাথেই আপনার মোবাইলে ট্র্যাকিং আইডি পৌঁছে যাবে।'
      }
    ]
  },
  returnPolicy: {
    badge: 'রিটার্ন ও এক্সচেঞ্জ গাইডলাইন',
    title: 'রিটার্ন ও রিফান্ড পলিসি (Return Policy)',
    subtitle: 'স্বচ্ছ ও গ্রাহকবান্ধব রিটার্ন নীতিমালা',
    sections: [
      {
        heading: '১. কাটা গজ কাপড়ের বিশেষ নিয়ম',
        body: 'যেহেতু প্রতিটি অর্ডারে গ্রাহকের চাহিদা অনুযায়ী মূল থান (Roll) থেকে নির্দিষ্ট গজ কাপড় কাটা হয়, তাই ব্যক্তিগত পছন্দ পরিবর্তন বা ভুল মাপ অর্ডারের কারণে কাটা কাপড় ফেরত বা পরিবর্তনযোগ্য নয়।'
      },
      {
        heading: '২. কখন আপনি রিটার্ন বা এক্সচেঞ্জ করতে পারবেন?',
        body: 'যদি আমাদের দিক থেকে ভুল রঙের কাপড়, ভুল বহর (যেমন ৩.৫ বহরের বদলে ২.৫ বহর), অর্ডারের চেয়ে কম গজ অথবা কাপড়ে কোনো ত্রুটি/দাগ বা ছেঁড়া থাকে — তবে আপনি বিনা খরচে কাপড়টি রিটার্ন বা এক্সচেঞ্জ করতে পারবেন।'
      },
      {
        heading: '৩. অভিযোগ জানানোর সময়সীমা',
        body: 'ডেলিভারি ম্যানের সামনেই পার্সেল খুলে চেক করার অনুরোধ করা হচ্ছে। কোনো ত্রুটি থাকলে ডেলিভারি ম্যানের কাছেই পার্সেল ফেরত দিন অথবা ডেলিভারি পাওয়ার ২৪ ঘণ্টার মধ্যে আনবক্সিং ভিডিও/ছবিসহ আমাদের WhatsApp নম্বরে জানান।'
      },
      {
        heading: '৪. রিফান্ড প্রক্রিয়া',
        body: 'যদি আপনি বিকাশ বা নগদে অগ্রিম পেমেন্ট করে থাকেন এবং রিটার্ন অনুমোদিত হয়, তবে ৩ থেকে ৫ কার্যদিবসের মধ্যে আপনার বিকাশ/নগদ নম্বরে সম্পূর্ণ অর্থ ফেরত (Refund) দেওয়া হবে।'
      }
    ]
  },
  privacyPolicy: {
    badge: 'তথ্য নিরাপত্তা ও গোপনীয়তা',
    title: 'প্রাইভেসি পলিসি (Privacy Policy)',
    subtitle: 'আপনার ব্যক্তিগত তথ্য ও শরীরের মাপের সম্পূর্ণ গোপনীয়তা রক্ষা আমাদের সর্বোচ্চ অগ্রাধিকার',
    sections: [
      {
        heading: '১. আমরা কী কী তথ্য সংগ্রহ করি?',
        body: 'আপনার অর্ডার সম্পন্ন করার জন্য আমরা আপনার নাম, মোবাইল নম্বর, ডেলিভারি ঠিকানা এবং আপনি যদি কাস্টম মাপ সংরক্ষণ করেন তবে পোশাকের মাপ সংক্রান্ত তথ্য সংগ্রহ করি।'
      },
      {
        heading: '২. তথ্যের ব্যবহার',
        body: 'সংগৃহীত তথ্য শুধুমাত্র আপনার অর্ডার প্রসেসিং, সঠিক গজ কাটিং, কুরিয়ার ডেলিভারি এবং অর্ডার আপডেট জানানোর কাজে ব্যবহৃত হয়। আমরা কোনো তৃতীয় পক্ষের কাছে গ্রাহকের তথ্য বিক্রি বা শেয়ার করি না।'
      },
      {
        heading: '৩. পেমেন্ট ও ডেটা সিকিউরিটি',
        body: 'আমাদের ওয়েবসাইটে আপনার প্রদত্ত সকল তথ্য নিরাপদ সার্ভারে সংরক্ষিত থাকে। বিকাশ বা নগদ ট্রানজেকশন আইডি শুধুমাত্র পেমেন্ট যাচাইয়ের জন্য ব্যবহৃত হয়।'
      }
    ]
  },
  termsConditions: {
    badge: 'ব্যবহারের শর্তাবলী',
    title: 'শর্তাবলী (Terms & Conditions)',
    subtitle: 'Fashion Doniya BD ওয়েবসাইট ব্যবহার ও অর্ডার করার নিয়মাবলী',
    sections: [
      {
        heading: '১. পণ্যের বিবরণ ও রঙের সামান্য তারতম্য',
        body: 'আমরা প্রতিটি কাপড়ের আসল রঙ ও বুনন ফুটিয়ে তোলার সর্বোচ্চ চেষ্টা করি। তবে ফটোগ্রাফিক লাইটিং অথবা আপনার মোবাইল/কম্পিউটার স্ক্রিনের রেজোলিউশনের কারণে কাপড়ের রঙে ৫-১০% সামান্য তারতম্য হতে পারে।'
      },
      {
        heading: '২. গজ ও বহরের হিসাব',
        body: '১ গজ = ৩৬ ইঞ্চি (২ হাত)। আমাদের ওয়েবসাইটে প্রদর্শিত গজ ক্যালকুলেটর স্ট্যান্ডার্ড টেইলারিং মাপ অনুযায়ী পরামর্শ দেয়। তবে বিশেষ ডিজাইনের হাতা বা অতিরিক্ত ঘেরের জন্য আপনার টেইলারের পরামর্শ অনুযায়ী গজ অর্ডার করার অনুরোধ করা হচ্ছে।'
      },
      {
        heading: '৩. মূল্য ও স্টক প্রাপ্যতা',
        body: 'ওয়েবসাইটে প্রদর্শিত সকল কাপড়ের মূল্য প্রতি গজ (Per Yard) হিসেবে বাংলা টাকায় (৳) নির্ধারিত। কোনো কাপড়ের স্টক শেষ হয়ে গেলে অ্যাডমিন প্যানেল থেকে আপনাকে দ্রুত অবহিত করা হবে।'
      },
      {
        heading: '৪. অর্ডার বাতিলকরণ',
        body: 'থান থেকে কাপড় কাটিং শুরু হওয়ার আগ পর্যন্ত আপনি আমাদের হেল্পলাইন বা হোয়াটসঅ্যাপে যোগাযোগ করে অর্ডার পরিবর্তন বা বাতিল করতে পারবেন। কাপড় একবার কাটা হয়ে গেলে অর্ডার বাতিল করা সম্ভব নয়।'
      }
    ]
  },
  footerContent: {
    brandDescription: 'বাংলাদেশের প্রিমিয়াম আনস্টিচড গজ কাপড়ের বিশ্বস্ত অনলাইন স্টোর। ৩.৫ বহর এবং ২.৫ বহরের জামদানি, সিল্ক, অরগানজা, সুতি ও লিনেন কাপড় কিনুন নিজের সঠিক মাপ অনুযায়ী।',
    copyrightText: '© ২০২৬ Fashion Doniya BD. সর্বস্বত্ব সংরক্ষিত।',
    bottomTagline: 'প্রিমিয়াম গজ কাপড় ও কাস্টম পরিমাপ সিস্টেম · বাংলাদেশ',
    fabricSectionTitle: 'কাপড়ের বহর ও কালেকশন',
    supportSectionTitle: 'গ্রাহক সেবা ও নীতিমালা',
    contactSectionTitle: 'যোগাযোগ'
  }
};

export const INITIAL_NAVIGATION_CONFIG: NavigationConfig = {
  headerItems: [
    { id: 'nav-1', label: 'হোম', page: 'home', order: 1, isActive: true },
    { id: 'nav-2', label: 'সকল কাপড়', page: 'shop', order: 2, isActive: true },
    { id: 'nav-3', label: '৩.৫ বহর কাপড়', page: 'shop-3-5', order: 3, isActive: true },
    { id: 'nav-4', label: '২.৫ বহর কাপড়', page: 'shop-2-5', order: 4, isActive: true },
    { id: 'nav-5', label: 'কাপড়ের বহর গাইড', page: 'fabric-width', order: 5, isActive: true },
    { id: 'nav-6', label: 'গজ ক্যালকুলেটর', page: 'calculator', order: 6, isActive: true, highlightGold: true },
    { id: 'nav-7', label: 'কাস্টম ডিজাইন', page: 'custom-design', order: 7, isActive: true },
    { id: 'nav-8', label: 'আমাদের সম্পর্কে', page: 'about', order: 8, isActive: true },
    { id: 'nav-9', label: 'যোগাযোগ', page: 'contact', order: 9, isActive: true }
  ],
  footerFabricItems: [
    { id: 'fnav-1', label: '৩.৫ বহর কাপড় কালেকশন (বড় বহর)', page: 'shop-3-5', order: 1, isActive: true },
    { id: 'fnav-2', label: '২.৫ বহর কাপড় কালেকশন (রেগুলার বহর)', page: 'shop-2-5', order: 2, isActive: true },
    { id: 'fnav-3', label: 'সকল গজ কাপড় দেখুন', page: 'shop', order: 3, isActive: true },
    { id: 'fnav-4', label: 'স্মার্ট গজ ক্যালকুলেটর', page: 'calculator', order: 4, isActive: true },
    { id: 'fnav-5', label: 'কাস্টম ডিজাইন অনুরোধ', page: 'custom-design', order: 5, isActive: true },
    { id: 'fnav-6', label: 'কাপড়ের বহর ও মাপ নির্দেশিকা', page: 'measurement-guide', order: 6, isActive: true }
  ],
  footerSupportItems: [
    { id: 'snav-1', label: 'অর্ডার ট্র্যাকিং (Order Tracking)', page: 'order-tracking', order: 1, isActive: true },
    { id: 'snav-2', label: 'আমাদের সম্পর্কে (About Us)', page: 'about', order: 2, isActive: true },
    { id: 'snav-3', label: 'সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)', page: 'faq', order: 3, isActive: true },
    { id: 'snav-4', label: 'ডেলিভারি পলিসি (Delivery Policy)', page: 'delivery-policy', order: 4, isActive: true },
    { id: 'snav-5', label: 'রিটার্ন ও এক্সচেঞ্জ পলিসি', page: 'return-policy', order: 5, isActive: true },
    { id: 'snav-6', label: 'গোপনীয়তা নীতি (Privacy Policy)', page: 'privacy-policy', order: 6, isActive: true },
    { id: 'snav-7', label: 'শর্তাবলী (Terms & Conditions)', page: 'terms', order: 7, isActive: true }
  ]
};

export const INITIAL_SEO_CONFIG: SeoConfig = {
  defaultTitle: 'Fashion Doniya BD | আপনার পছন্দের কাপড়, এখন গজ হিসেবে',
  titleSuffix: ' | Fashion Doniya BD',
  defaultDescription: 'প্রিমিয়াম কাপড়ের ডিজাইন দেখুন, পছন্দের কাপড় বেছে নিন এবং নিজের প্রয়োজন অনুযায়ী ৩.৫ ও ২.৫ বহরের গজ হিসাব করে অর্ডার করুন।',
  defaultKeywords: 'গজ কাপড়, থান কাপড়, ৩.৫ বহর কাপড়, ২.৫ বহর কাপড়, জামদানি শাড়ির কাপড়, কামিজের কাপড়, Fashion Doniya BD',
  ogImage: '/assets/banners/hero_slide_1.png',
  pages: {
    home: {
      pageKey: 'home',
      pageName: 'হোম পেজ (Home)',
      title: 'Fashion Doniya BD | আপনার পছন্দের কাপড়, এখন গজ হিসেবে',
      description: 'বাংলাদেশের প্রিমিয়াম আনস্টিচড গজ কাপড়ের বিশ্বস্ত অনলাইন স্টোর। ৩.৫ বহর এবং ২.৫ বহরের জামদানি, সিল্ক, অরগানজা ও সুতি কাপড় কিনুন।',
      keywords: 'Fashion Doniya BD, গজ কাপড়, থান কাপড়, ৩.৫ বহর, ২.৫ বহর, আনস্টিচড ফেব্রিক'
    },
    shop: {
      pageKey: 'shop',
      pageName: 'সকল কাপড় (All Products)',
      title: 'সকল প্রিমিয়াম গজ কাপড় কালেকশন | Fashion Doniya BD',
      description: 'কামিজ, শর্ট কামিজ, লং কটি, গাউন ও শাড়ির জন্য বাছাইকৃত প্রিমিয়াম গজ কাপড়ের সম্ভার।',
      keywords: 'সকল গজ কাপড়, কামিজ ফেব্রিক, গাউন কাপড়, শাড়ির থান'
    },
    'shop-3-5': {
      pageKey: 'shop-3-5',
      pageName: '৩.৫ বহর কাপড় (3.5 Bahar)',
      title: '৩.৫ বহর (৫৬-৬০ ইঞ্চি) প্রিমিয়াম গজ কাপড় | Fashion Doniya BD',
      description: 'বড় বহরের জামদানি, ব্রাইডাল অরগানজা, সিল্ক ও সুতি গজ কাপড় — কম গজে পূর্ণাঙ্গ পোশাক তৈরি করুন।',
      keywords: '৩.৫ বহর কাপড়, বড় বহর থান, জামদানি গজ কাপড়, গাউন ফেব্রিক'
    },
    'shop-2-5': {
      pageKey: 'shop-2-5',
      pageName: '২.৫ বহর কাপড় (2.5 Bahar)',
      title: '২.৫ বহর (৪২-৪৪ ইঞ্চি) স্ট্যান্ডার্ড গজ কাপড় | Fashion Doniya BD',
      description: 'খাঁটি সুতি হ্যান্ড-ব্লক, নকশি কাঁথা, লিনেন ও জ্যাকার্ড ২.৫ বহরের গজ কাপড়।',
      keywords: '২.৫ বহর কাপড়, সুতি গজ কাপড়, নকশি কাঁথা ফেব্রিক, লিনেন কাপড়'
    },
    calculator: {
      pageKey: 'calculator',
      pageName: 'গজ ক্যালকুলেটর (Yardage Calculator)',
      title: 'স্মার্ট গজ ক্যালকুলেটর | কত গজ কাপড় লাগবে হিসাব করুন',
      description: 'পোশাকের ধরন, বহর ও আপনার শরীরের মাপ অনুযায়ী ঠিক কত গজ কাপড় লাগবে তা মুহূর্তেই হিসাব করুন।',
      keywords: 'গজ ক্যালকুলেটর, কত গজ কাপড় লাগে, কামিজে কত গজ লাগে'
    },
    about: {
      pageKey: 'about',
      pageName: 'আমাদের সম্পর্কে (About Us)',
      title: 'আমাদের সম্পর্কে | Fashion Doniya BD',
      description: 'বাংলার ঐতিহ্যবাহী বুনন ও প্রিমিয়াম গজ কাপড়ের বিশ্বস্ত ঠিকানা Fashion Doniya BD সম্পর্কে জানুন।',
      keywords: 'Fashion Doniya BD সম্পর্কে, প্রিমিয়াম ফেব্রিক স্টোর বাংলাদেশ'
    },
    contact: {
      pageKey: 'contact',
      pageName: 'যোগাযোগ (Contact Us)',
      title: 'যোগাযোগ করুন | Fashion Doniya BD হেল্পলাইন',
      description: 'কাপড়ের বহর, গজ হিসাব বা অর্ডার সংক্রান্ত যেকোনো প্রশ্নে আমাদের সাথে যোগাযোগ করুন।',
      keywords: 'Fashion Doniya BD যোগাযোগ, হেল্পলাইন, হোয়াটসঅ্যাপ অর্ডার'
    }
  }
};

export const INITIAL_CAMPAIGNS: PromotionCampaign[] = [
  {
    id: 'camp-1',
    name: 'রয়্যাল ফেস্টিভ ও ব্রাইডাল সেল ২০২৬',
    badgeText: 'ফেস্টিভ অফার · ১০% ছাড়',
    description: '১০০০ টাকার বেশি যেকোনো গজ কাপড় অর্ডারে DONIYA10 কুপন ব্যবহার করলেই পাচ্ছেন ১০% বিশেষ ডিসকাউন্ট!',
    discountPercentage: 10,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    bannerImage: '/assets/banners/hero_slide_1.png',
    targetCategory: 'all',
    couponCode: 'DONIYA10',
    isActive: true
  },
  {
    id: 'camp-2',
    name: 'ফ্রি হোম ডেলিভারি ক্যাম্পেইন',
    badgeText: 'ফ্রি ডেলিভারি',
    description: '২,৫০০ টাকা বা তার বেশি মূল্যের কাপড় অর্ডার করলেই সারা বাংলাদেশে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!',
    discountPercentage: 0,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    bannerImage: '/assets/banners/hero_slide_2.png',
    targetCategory: 'all',
    isActive: true
  }
];

export const INITIAL_CUSTOMERS: CustomerUser[] = [];

export const INITIAL_CONTACT_MESSAGES: ContactMessageRecord[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];

export const INITIAL_FLOATING_WIDGET_CONFIG: FloatingWidgetConfig = {
  isEnabled: true,
  tooltipText: 'ফেসবুক ও মেসেঞ্জারে যোগাযোগ করুন',
  items: [
    {
      id: 'item-facebook',
      label: 'Facebook',
      url: 'https://www.facebook.com/share/1EwKnnudVx/',
      iconType: 'facebook',
      isActive: true,
      order: 1
    },
    {
      id: 'item-messenger',
      label: 'Messenger',
      url: 'https://www.facebook.com/share/1EwKnnudVx/',
      iconType: 'messenger',
      isActive: true,
      order: 2
    }
  ]
};

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'Fashion Doniya BD',
  logoUrl: '',
  faviconUrl: '',
  currency: 'BDT',
  currencySymbol: '৳',
  taglineBengali: 'আপনার পছন্দের কাপড়, এখন গজ হিসেবে',
  announcementText: 'সারা বাংলাদেশে দ্রুত ও নিরাপদ ক্যাশ অন ডেলিভারি · যেকোনো কাপড়ে নিখুঁত গজ কাটিং',
  heroTitle: 'আপনার পছন্দের কাপড়, এখন গজ হিসেবে',
  heroDescription: 'প্রিমিয়াম কাপড়ের ডিজাইন দেখুন, পছন্দের কাপড় বেছে নিন এবং নিজের প্রয়োজন অনুযায়ী গজ হিসাব করে অর্ডার করুন।',
  heroButtonPrimaryText: 'কাপড় কিনুন',
  heroButtonSecondaryText: 'গজ হিসাব করুন',
  whatsappNumber: '+8801712345678',
  supportPhone: '+8801712-345678',
  supportEmail: 'support@fashiondoniyabd.com',
  address: 'বাড়ি #১২, রোড #০৪, ধানমন্ডি, ঢাকা - ১২০৫',
  insideDhakaDeliveryFee: 60,
  outsideDhakaDeliveryFee: 120,
  freeDeliveryThreshold: 2500,
  facebookUrl: 'https://www.facebook.com/share/1EwKnnudVx/',
  instagramUrl: 'https://instagram.com',
  youtubeUrl: 'https://youtube.com',
  maintenanceMode: false,
  maintenanceMessage: 'আমাদের ওয়েবসাইটে নতুন কাপড়ের কালেকশন ও সিস্টেম আপডেট চলছে। খুব শীঘ্রই আমরা ফিরে আসছি। জরুরি অর্ডারের জন্য WhatsApp করুন।',
  coupons: [
    { code: 'DONIYA10', discountType: 'percentage', discountValue: 10, minOrderAmount: 1000, isActive: true, description: '১০০০ টাকার অর্ডারে ১০% ছাড়' },
    { code: 'FASHION50', discountType: 'fixed', discountValue: 50, minOrderAmount: 800, isActive: true, description: '৮০০ টাকার অর্ডারে ৳৫০ ফ্ল্যাট ডিসকাউন্ট' }
  ],
  paymentSettings: INITIAL_PAYMENT_SETTINGS,
  homepageConfig: INITIAL_HOMEPAGE_CONFIG,
  contentConfig: INITIAL_CONTENT_CONFIG,
  navigationConfig: INITIAL_NAVIGATION_CONFIG,
  seoConfig: INITIAL_SEO_CONFIG,
  campaigns: INITIAL_CAMPAIGNS,
  floatingWidgetConfig: INITIAL_FLOATING_WIDGET_CONFIG,
  addonFabricCollections: INITIAL_ADDON_FABRIC_COLLECTIONS
};

export const INITIAL_TRACKING_HISTORY: OrderTrackingHistory[] = [];

export const INITIAL_COURIER_INFO: CourierInformation[] = [];

export const INITIAL_DEMO_ORDERS: Order[] = [];

export const INITIAL_CUSTOM_REQUESTS: CustomDesignRequest[] = [];

export const INITIAL_FABRIC_SECTIONS: Record<FabricCollectionType, FabricSectionRecord> = {
  '3.5_bahar': {
    id: 'sec-35-bahar',
    collection_type: '3.5_bahar',
    eyebrow: '3.5 BAHAR EDITORIAL COLLECTION',
    heading: 'পোশাক অনুযায়ী ৩.৫ বহর কাপড় বেছে নিন',
    subtitle: 'পছন্দের পোশাকের ক্যাটাগরিতে ক্লিক করে ৫৬–৬০ ইঞ্চি প্রশস্ত বহরের প্রিমিয়াম কাপড়ের কালেকশন দেখুন',
    updatedAt: '2026-11-05T10:00:00Z'
  },
  '2.5_bahar': {
    id: 'sec-25-bahar',
    collection_type: '2.5_bahar',
    eyebrow: '2.5 BAHAR EDITORIAL COLLECTION',
    heading: 'পোশাক অনুযায়ী ২.৫ বহর কাপড় বেছে নিন',
    subtitle: 'পছন্দের পোশাকের ক্যাটাগরিতে ক্লিক করে ৪২–৪৪ ইঞ্চি স্ট্যান্ডার্ড বহরের প্রিমিয়াম কাপড়ের কালেকশন দেখুন',
    updatedAt: '2026-11-05T10:00:00Z'
  }
};

export const INITIAL_FABRIC_CATEGORIES: Record<FabricCollectionType, FabricCategoryRecord[]> = {
  '3.5_bahar': [
    {
      id: 'fcat-35-kamiz',
      collection_type: '3.5_bahar',
      name: 'কামিজ',
      matchCategoryName: 'কামিজ',
      slug: 'kamiz',
      description: 'ঐতিহ্যবাহী ও ফরমাল কামিজের জন্য প্রিমিয়াম কাপড়',
      sampleFabrics: 'সফট কম্বড কটন, সুইস লন ও জামদানি বুটি থান',
      standardYards: '২.০ গজ',
      buttonLabel: 'কালেকশন দেখুন',
      buttonLink: 'category-gallery:kamiz',
      icon: 'shirt',
      representativeProductId: 'prod-35-kamiz-1',
      fallbackColorHex: '#2C526C',
      fallbackPatternType: 'cotton',
      customImageUrl: '/assets/categories/bahar35_kamiz.png',
      order: 1,
      isEnabled: true,
      updatedAt: '2026-11-06T08:30:00Z'
    },
    {
      id: 'fcat-35-short-kamiz',
      collection_type: '3.5_bahar',
      name: 'শার্ট কামিজ',
      matchCategoryName: 'শর্ট কামিজ',
      slug: 'short-kamiz',
      description: 'স্টাইলিশ ও আরামদায়ক শার্ট কামিজের কাপড়',
      sampleFabrics: 'ফ্লোরাল অর্গানজা, লিনেন জ্যাকার্ড ও শিফলি কটন',
      standardYards: '১.৫ গজ',
      buttonLabel: 'কালেকশন দেখুন',
      buttonLink: 'category-gallery:short-kamiz',
      icon: 'scissors',
      representativeProductId: 'prod-35-skam-1',
      fallbackColorHex: '#D8A7A2',
      fallbackPatternType: 'embroidery',
      customImageUrl: '/assets/categories/bahar35_short_kamiz.png',
      order: 2,
      isEnabled: true,
      updatedAt: '2026-11-06T08:30:00Z'
    },
    {
      id: 'fcat-35-long-koti',
      collection_type: '3.5_bahar',
      name: 'নেহ কটি',
      matchCategoryName: 'লং কটি',
      slug: 'long-koti',
      description: 'ঐতিহ্যবাহী ও ফরমাল কটির জন্য বিশেষ কাপড়',
      sampleFabrics: 'বেনারসি ব্রোকেড জ্যাকার্ড, র-সিল্ক ও বোটানিক্যাল জর্জেট',
      standardYards: '৩.৫ গজ',
      buttonLabel: 'কালেকশন দেখুন',
      buttonLink: 'category-gallery:long-koti',
      icon: 'crown',
      representativeProductId: 'prod-35-koti-1',
      fallbackColorHex: '#B89758',
      fallbackPatternType: 'chanderi',
      customImageUrl: '/assets/categories/bahar35_long_koti.png',
      order: 3,
      isEnabled: true,
      updatedAt: '2026-11-06T08:30:00Z'
    },
    {
      id: 'fcat-35-gown-lehenga',
      collection_type: '3.5_bahar',
      name: 'গাউন / লেহেঙ্গা',
      matchCategoryName: 'গাউন / লেহেঙ্গা',
      slug: 'gown-lehenga',
      description: 'গাউন ও লেহেঙ্গার জন্য আকর্ষণীয় ডিজাইনের কাপড়',
      sampleFabrics: 'জারদোজি এমব্রয়ডারি জর্জেট, ব্রাইডাল অর্গানজা ও বাটার সিল্ক',
      standardYards: '৩.৫ গজ',
      buttonLabel: 'কালেকশন দেখুন',
      buttonLink: 'category-gallery:gown-lehenga',
      icon: 'sparkles',
      representativeProductId: 'prod-35-gown-1',
      fallbackColorHex: '#C98A82',
      fallbackPatternType: 'embroidery',
      customImageUrl: '/assets/categories/bahar35_gown_lehenga.png',
      order: 4,
      isEnabled: true,
      updatedAt: '2026-11-06T08:30:00Z'
    },
    {
      id: 'fcat-35-saree',
      collection_type: '3.5_bahar',
      name: 'শাড়ি',
      matchCategoryName: 'শাড়ি',
      slug: 'saree',
      description: 'ঐতিহ্য ও আধুনিকতার সমন্বয়ে শাড়ির বিশেষ কাপড়',
      sampleFabrics: 'ঢাকাই জামদানি উইভ, চান্দেরি টিস্যু সিল্ক ও ফ্লোরাল জর্জেট',
      standardYards: '৬.০ গজ',
      buttonLabel: 'কালেকশন দেখুন',
      buttonLink: 'category-gallery:saree',
      icon: 'gem',
      representativeProductId: 'prod-35-saree-1',
      fallbackColorHex: '#8A2430',
      fallbackPatternType: 'jamdani',
      customImageUrl: '/assets/categories/bahar35_saree.png',
      order: 5,
      isEnabled: true,
      updatedAt: '2026-11-06T08:30:00Z'
    },
    {
      id: 'fcat-35-custom-design',
      collection_type: '3.5_bahar',
      name: 'কাস্টম ডিজাইন',
      matchCategoryName: 'কাস্টম ডিজাইন',
      slug: 'custom-design',
      description: 'আপনার পছন্দ অনুযায়ী কাস্টম ডিজাইনের কাপড়',
      sampleFabrics: 'মলমল মসলিন কটন ও পিওর মুগা তসর সিল্ক',
      standardYards: 'পছন্দমতো গজ',
      buttonLabel: 'কালেকশন দেখুন',
      buttonLink: 'category-gallery:custom-design',
      icon: 'palette',
      representativeProductId: 'prod-35-custom-1',
      fallbackColorHex: '#EFEAE1',
      fallbackPatternType: 'jamdani',
      customImageUrl: '/assets/categories/bahar35_custom_design.png',
      order: 6,
      isEnabled: true,
      updatedAt: '2026-11-06T08:30:00Z'
    }
  ],
  '2.5_bahar': [
    {
      id: 'fcat-25-kamiz',
      collection_type: '2.5_bahar',
      name: 'কামিজ',
      matchCategoryName: 'কামিজ',
      slug: 'kamiz',
      description: 'খাঁটি সুতি হ্যান্ড-ব্লক ও এমব্রয়ডারি কামিজের প্রিমিয়াম কাপড়',
      sampleFabrics: 'হ্যান্ড-ব্লক প্রিন্ট কটন, নকশি কাঁথা ও বেক্সি ভয়েল',
      standardYards: '২.৫ গজ',
      buttonLabel: 'কালেকশন দেখুন',
      buttonLink: 'category-gallery:kamiz',
      icon: 'shirt',
      representativeProductId: 'prod-25-kamiz-1',
      fallbackColorHex: '#A8523E',
      fallbackPatternType: 'floral',
      customImageUrl: '/assets/categories/bahar25_kamiz.png',
      order: 1,
      isEnabled: true,
      updatedAt: '2026-11-06T08:30:00Z'
    },
    {
      id: 'fcat-25-short-kamiz',
      collection_type: '2.5_bahar',
      name: 'শর্ট কামিজ',
      matchCategoryName: 'শর্ট কামিজ',
      slug: 'short-kamiz',
      description: 'পিওর লিনেন ও ভিসকোস রেয়নে আরামদায়ক শর্ট কামিজের কাপড়',
      sampleFabrics: 'পিওর ফ্লেক্স লিনেন ও বোটানিক্যাল ভিসকোস রেয়ন',
      standardYards: '২.০ – ২.৫ গজ',
      buttonLabel: 'কালেকশন দেখুন',
      buttonLink: 'category-gallery:short-kamiz',
      icon: 'scissors',
      representativeProductId: 'prod-25-skam-1',
      fallbackColorHex: '#D7C4B7',
      fallbackPatternType: 'linen',
      customImageUrl: '/assets/categories/bahar25_short_kamiz.png',
      order: 2,
      isEnabled: true,
      updatedAt: '2026-11-06T08:30:00Z'
    },
    {
      id: 'fcat-25-long-koti',
      collection_type: '2.5_bahar',
      name: 'লং কটি',
      matchCategoryName: 'লং কটি',
      slug: 'long-koti',
      description: 'গর্জিয়াস ব্রোকেড জ্যাকার্ড ও হ্যান্ডলুম খাদি কটির কাপড়',
      sampleFabrics: 'ডামাস্ক ব্রোকেড জ্যাকার্ড ও হ্যান্ডলুম খাদি কটন',
      standardYards: '৪.৫ গজ',
      buttonLabel: 'কালেকশন দেখুন',
      buttonLink: 'category-gallery:long-koti',
      icon: 'crown',
      representativeProductId: 'prod-25-koti-1',
      fallbackColorHex: '#4A423B',
      fallbackPatternType: 'chanderi',
      customImageUrl: '/assets/categories/bahar25_long_koti.png',
      order: 3,
      isEnabled: true,
      updatedAt: '2026-11-06T08:30:00Z'
    },
    {
      id: 'fcat-25-gown',
      collection_type: '2.5_bahar',
      name: 'গাউন',
      matchCategoryName: 'গাউন',
      slug: 'gown',
      description: 'পার্টি ও ফ্লোয়িং গাউনের জন্য বাবল জর্জেট ও জরি সিল্ক কাপড়',
      sampleFabrics: 'হেভি বাবল জর্জেট ও জরি বুটি ক্র্যাপ সিল্ক',
      standardYards: '৪.৫ গজ',
      buttonLabel: 'কালেকশন দেখুন',
      buttonLink: 'category-gallery:gown',
      icon: 'sparkles',
      representativeProductId: 'prod-25-gown-1',
      fallbackColorHex: '#6E2A3C',
      fallbackPatternType: 'silk',
      customImageUrl: '/assets/categories/bahar25_gown.png',
      order: 4,
      isEnabled: true,
      updatedAt: '2026-11-06T08:30:00Z'
    },
    {
      id: 'fcat-25-nakshi-kurti',
      collection_type: '2.5_bahar',
      name: 'নকশি ও কুর্তি',
      matchCategoryName: 'কামিজ',
      slug: 'kamiz',
      description: 'অল-ওভার কাঁথা স্টিচ ও সূক্ষ্ম সুতার ডিজাইনার কুর্তির কাপড়',
      sampleFabrics: 'রয়্যাল মাস্টার্ড নকশি কাঁথা ও এমব্রয়ডারি কটন',
      standardYards: '২.৫ গজ',
      buttonLabel: 'কালেকশন দেখুন',
      buttonLink: 'category-gallery:kamiz',
      icon: 'feather',
      representativeProductId: 'prod-25-kamiz-2',
      fallbackColorHex: '#C9963E',
      fallbackPatternType: 'embroidery',
      customImageUrl: '/assets/categories/bahar25_nakshi_kurti.png',
      order: 5,
      isEnabled: true,
      updatedAt: '2026-11-06T08:30:00Z'
    },
    {
      id: 'fcat-25-custom-design',
      collection_type: '2.5_bahar',
      name: 'কাস্টম ডিজাইন',
      matchCategoryName: 'কাস্টম ডিজাইন',
      slug: 'custom-design',
      description: 'পছন্দের যেকোনো প্যাটার্ন ও পোশাকের জন্য প্রিমিয়াম ২.৫ বহর কাপড়',
      sampleFabrics: 'পিওর সিল্কি ক্র্যাপ ও আর্টিজানাল হ্যান্ডলুম কটন সিল্ক',
      standardYards: 'পছন্দমতো গজ',
      buttonLabel: 'কালেকশন দেখুন',
      buttonLink: 'category-gallery:custom-design',
      icon: 'palette',
      representativeProductId: 'prod-25-custom-2',
      fallbackColorHex: '#E4DACB',
      fallbackPatternType: 'jamdani',
      customImageUrl: '/assets/categories/bahar25_custom_design.png',
      order: 6,
      isEnabled: true,
      updatedAt: '2026-11-06T08:30:00Z'
    }
  ]
};

export const INITIAL_FABRIC_DESIGN_SETTINGS: Record<FabricCollectionType, FabricCategoryDesignSettingsRecord> = {
  '3.5_bahar': {
    id: 'fdesign-35-bahar',
    collection_type: '3.5_bahar',
    backgroundColor: '#FAF6F0',
    cardBackgroundColor: '#FFFCF7',
    textColor: '#850B1B',
    bodyTextColor: '#241815',
    borderColor: '#D5A64A',
    buttonColor: '#850B1B',
    buttonTextColor: '#FFFFFF',
    accentGoldColor: '#D5A64A',
    imagePosition: 'right',
    imageAspectRatio: '4/5',
    imageWidthPercent: 44,
    cardMinHeightPx: 220,
    cardBorderRadiusPx: 16,
    cardGapPx: 20,
    sectionPaddingPx: 32,
    desktopColumns: 3,
    mobileColumns: 2,
    updatedAt: '2026-11-06T08:30:00Z'
  },
  '2.5_bahar': {
    id: 'fdesign-25-bahar',
    collection_type: '2.5_bahar',
    backgroundColor: '#FAF6F0',
    cardBackgroundColor: '#FFFCF7',
    textColor: '#850B1B',
    bodyTextColor: '#241815',
    borderColor: '#D5A64A',
    buttonColor: '#850B1B',
    buttonTextColor: '#FFFFFF',
    accentGoldColor: '#D5A64A',
    imagePosition: 'right',
    imageAspectRatio: '4/5',
    imageWidthPercent: 44,
    cardMinHeightPx: 220,
    cardBorderRadiusPx: 16,
    cardGapPx: 20,
    sectionPaddingPx: 32,
    desktopColumns: 3,
    mobileColumns: 2,
    updatedAt: '2026-11-06T08:30:00Z'
  }
};

export function createInitialFabricCollectionsState(): FabricCollectionsDatabaseState {
  const clone = <T,>(val: T): T => JSON.parse(JSON.stringify(val));
  const now = '2026-11-05T10:00:00Z';
  return {
    fabric_sections: clone(INITIAL_FABRIC_SECTIONS),
    fabric_categories: clone(INITIAL_FABRIC_CATEGORIES),
    fabric_category_design_settings: clone(INITIAL_FABRIC_DESIGN_SETTINGS),
    drafts: {
      '3.5_bahar': {
        section: clone(INITIAL_FABRIC_SECTIONS['3.5_bahar']),
        categories: clone(INITIAL_FABRIC_CATEGORIES['3.5_bahar']),
        designSettings: clone(INITIAL_FABRIC_DESIGN_SETTINGS['3.5_bahar']),
        savedAt: now
      },
      '2.5_bahar': {
        section: clone(INITIAL_FABRIC_SECTIONS['2.5_bahar']),
        categories: clone(INITIAL_FABRIC_CATEGORIES['2.5_bahar']),
        designSettings: clone(INITIAL_FABRIC_DESIGN_SETTINGS['2.5_bahar']),
        savedAt: now
      }
    },
    previous_published: {
      '3.5_bahar': null,
      '2.5_bahar': null
    },
    has_unpushed_draft: {
      '3.5_bahar': false,
      '2.5_bahar': false
    }
  };
}

export const INITIAL_CATEGORY_MEASUREMENT_GUIDES: CategoryMeasurementGuideRecord[] = [
  {
    id: 'guide-3.5-kamiz',
    fabricWidth: '3.5',
    categorySlug: 'kamiz',
    categoryName: 'কামিজ',
    suggestedYards: 2.0,
    isAdminDefined: false,
    suggestedYardsLabel: '২.০ গজ',
    measurementInstructions: '৩.৫ বহরে স্ট্যান্ডার্ড ফুল হাতা কামিজের জন্য ২.০ গজ কাপড় যথেষ্ট।',
    measurementNotes: 'লম্বা ৪৪ ইঞ্চির বেশি হলে ২.২৫ গজ নেওয়া ভালো।',
    sizeGuideEnabled: true,
    sizes: [
      { size: 'S', chest: '৩৬ ইঞ্চি', waist: '৩২ ইঞ্চি', hip: '৩৮ ইঞ্চি', length: '৪২ ইঞ্চি', otherMeasurements: 'হাতা ১৮ ইঞ্চি', suggestedGaj: 2.0 },
      { size: 'M', chest: '৩৮ ইঞ্চি', waist: '৩৪ ইঞ্চি', hip: '৪০ ইঞ্চি', length: '৪৩ ইঞ্চি', otherMeasurements: 'হাতা ১৮ ইঞ্চি', suggestedGaj: 2.0 },
      { size: 'L', chest: '৪০ ইঞ্চি', waist: '৩৬ ইঞ্চি', hip: '৪২ ইঞ্চি', length: '৪৪ ইঞ্চি', otherMeasurements: 'হাতা ১৯ ইঞ্চি', suggestedGaj: 2.25 },
      { size: 'XL', chest: '৪২-৪৪ ইঞ্চি', waist: '৩৮-৪০ ইঞ্চি', hip: '৪৪-৪৬ ইঞ্চি', length: '৪৫ ইঞ্চি', otherMeasurements: 'হাতা ১৯ ইঞ্চি', suggestedGaj: 2.5 }
    ],
    updatedAt: '2026-11-06T08:30:00Z'
  },
  {
    id: 'guide-3.5-short-kamiz',
    fabricWidth: '3.5',
    categorySlug: 'short-kamiz',
    categoryName: 'শার্ট কামিজ',
    suggestedYards: 1.5,
    isAdminDefined: false,
    suggestedYardsLabel: '১.৫ গজ',
    measurementInstructions: '৩.৫ বহরে শর্ট কামিজ বা কুর্তির জন্য ১.৫ গজ কাপড় যথেষ্ট।',
    measurementNotes: '',
    sizeGuideEnabled: true,
    sizes: [
      { size: 'S', chest: '৩৬ ইঞ্চি', waist: '৩২ ইঞ্চি', hip: '৩৮ ইঞ্চি', length: '৩৪ ইঞ্চি', otherMeasurements: '', suggestedGaj: 1.5 },
      { size: 'M', chest: '৩৮ ইঞ্চি', waist: '৩৪ ইঞ্চি', hip: '৪০ ইঞ্চি', length: '৩৫ ইঞ্চি', otherMeasurements: '', suggestedGaj: 1.5 },
      { size: 'L', chest: '৪০ ইঞ্চি', waist: '৩৬ ইঞ্চি', hip: '৪২ ইঞ্চি', length: '৩৬ ইঞ্চি', otherMeasurements: '', suggestedGaj: 1.75 },
      { size: 'XL', chest: '৪২ ইঞ্চি', waist: '৩৮ ইঞ্চি', hip: '৪৪ ইঞ্চি', length: '৩৭ ইঞ্চি', otherMeasurements: '', suggestedGaj: 2.0 }
    ],
    updatedAt: '2026-11-06T08:30:00Z'
  },
  {
    id: 'guide-3.5-long-koti',
    fabricWidth: '3.5',
    categorySlug: 'long-koti',
    categoryName: 'নেহ কটি',
    suggestedYards: 2.5,
    isAdminDefined: false,
    suggestedYardsLabel: '২.৫ গজ',
    measurementInstructions: '৩.৫ বহরে কটি বা লং কটির জন্য ২.০–২.৫ গজ কাপড় প্রয়োজন।',
    measurementNotes: '',
    sizeGuideEnabled: true,
    sizes: [
      { size: 'S', chest: '৩৬ ইঞ্চি', waist: '৩২ ইঞ্চি', hip: '৩৮ ইঞ্চি', length: '৪২ ইঞ্চি', otherMeasurements: '', suggestedGaj: 2.0 },
      { size: 'M', chest: '৩৮ ইঞ্চি', waist: '৩৪ ইঞ্চি', hip: '৪০ ইঞ্চি', length: '৪৪ ইঞ্চি', otherMeasurements: '', suggestedGaj: 2.5 },
      { size: 'L', chest: '৪০ ইঞ্চি', waist: '৩৬ ইঞ্চি', hip: '৪২ ইঞ্চি', length: '৪৫ ইঞ্চি', otherMeasurements: '', suggestedGaj: 2.5 },
      { size: 'XL', chest: '৪২ ইঞ্চি', waist: '৩৮ ইঞ্চি', hip: '৪৪ ইঞ্চি', length: '৪৬ ইঞ্চি', otherMeasurements: '', suggestedGaj: 3.0 }
    ],
    updatedAt: '2026-11-06T08:30:00Z'
  },
  {
    id: 'guide-3.5-gown-lehenga',
    fabricWidth: '3.5',
    categorySlug: 'gown-lehenga',
    categoryName: 'গাউন / লেহেঙ্গা',
    suggestedYards: 3.5,
    isAdminDefined: false,
    suggestedYardsLabel: '৩.৫ গজ',
    measurementInstructions: 'ফুল ঘেরের গাউন ও লেহেঙ্গার জন্য ৩.৫ থেকে ৪.০ গজ কাপড় প্রয়োজন।',
    measurementNotes: '',
    sizeGuideEnabled: true,
    sizes: [
      { size: 'S', chest: '৩৬ ইঞ্চি', waist: '৩০ ইঞ্চি', hip: '৩৮ ইঞ্চি', length: '৫২ ইঞ্চি', otherMeasurements: '', suggestedGaj: 3.5 },
      { size: 'M', chest: '৩৮ ইঞ্চি', waist: '৩২ ইঞ্চি', hip: '৪০ ইঞ্চি', length: '৫৪ ইঞ্চি', otherMeasurements: '', suggestedGaj: 3.5 },
      { size: 'L', chest: '৪০ ইঞ্চি', waist: '৩৪ ইঞ্চি', hip: '৪২ ইঞ্চি', length: '৫৫ ইঞ্চি', otherMeasurements: '', suggestedGaj: 4.0 },
      { size: 'XL', chest: '৪২ ইঞ্চি', waist: '৩৬ ইঞ্চি', hip: '৪৪ ইঞ্চি', length: '৫৬ ইঞ্চি', otherMeasurements: '', suggestedGaj: 4.5 }
    ],
    updatedAt: '2026-11-06T08:30:00Z'
  },
  {
    id: 'guide-3.5-saree',
    fabricWidth: '3.5',
    categorySlug: 'saree',
    categoryName: 'শাড়ি',
    suggestedYards: 6.0,
    isAdminDefined: false,
    suggestedYardsLabel: '৬.০ গজ',
    measurementInstructions: 'পূর্ণাঙ্গ ১২ হাত শাড়ির জন্য ৬.০ গজ কাপড় প্রয়োজন।',
    measurementNotes: '',
    sizeGuideEnabled: false,
    sizes: [
      { size: 'S', chest: '', waist: '', hip: '', length: '১২ হাত', otherMeasurements: '', suggestedGaj: 6.0 },
      { size: 'M', chest: '', waist: '', hip: '', length: '১২ হাত', otherMeasurements: '', suggestedGaj: 6.0 },
      { size: 'L', chest: '', waist: '', hip: '', length: '১২ হাত', otherMeasurements: '', suggestedGaj: 6.0 },
      { size: 'XL', chest: '', waist: '', hip: '', length: '১২ হাত', otherMeasurements: '', suggestedGaj: 6.5 }
    ],
    updatedAt: '2026-11-06T08:30:00Z'
  },
  {
    id: 'guide-2.5-kamiz',
    fabricWidth: '2.5',
    categorySlug: 'kamiz',
    categoryName: 'কামিজ',
    suggestedYards: 2.5,
    isAdminDefined: false,
    suggestedYardsLabel: '২.৫ গজ',
    measurementInstructions: '২.৫ বহরে স্ট্যান্ডার্ড কামিজের জন্য ২.৫ গজ কাপড় প্রয়োজন।',
    measurementNotes: '',
    sizeGuideEnabled: true,
    sizes: [
      { size: 'S', chest: '৩৬ ইঞ্চি', waist: '৩২ ইঞ্চি', hip: '৩৮ ইঞ্চি', length: '৪২ ইঞ্চি', otherMeasurements: '', suggestedGaj: 2.5 },
      { size: 'M', chest: '৩৮ ইঞ্চি', waist: '৩৪ ইঞ্চি', hip: '৪০ ইঞ্চি', length: '৪৩ ইঞ্চি', otherMeasurements: '', suggestedGaj: 2.5 },
      { size: 'L', chest: '৪০ ইঞ্চি', waist: '৩৬ ইঞ্চি', hip: '৪২ ইঞ্চি', length: '৪৪ ইঞ্চি', otherMeasurements: '', suggestedGaj: 3.0 },
      { size: 'XL', chest: '৪২ ইঞ্চি', waist: '৩৮ ইঞ্চি', hip: '৪৪ ইঞ্চি', length: '৪৫ ইঞ্চি', otherMeasurements: '', suggestedGaj: 3.0 }
    ],
    updatedAt: '2026-11-06T08:30:00Z'
  }
];

