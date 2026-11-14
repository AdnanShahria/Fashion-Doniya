import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  description: text('description').notNull().default(''),
  sku: text('sku').notNull(),
  fabricWidth: text('fabric_width').notNull().default('3.5'),
  category: text('category').notNull(),
  fabricType: text('fabric_type').notNull().default(''),
  design: text('design'),
  color: text('color').notNull().default(''),
  colorHex: text('color_hex'),
  availableColors: text('available_colors').notNull().default('[]'),
  pricePerYard: real('price_per_yard').notNull().default(0),
  discountPrice: real('discount_price'),
  stockYards: real('stock_yards').notNull().default(0),
  minOrderQuantity: real('min_order_quantity').notNull().default(1),
  stepYard: real('step_yard').notNull().default(0.5),
  images: text('images').notNull().default('[]'),
  patternType: text('pattern_type').notNull().default('cotton'),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  isBestSeller: integer('is_best_seller', { mode: 'boolean' }).notNull().default(false),
  isNewArrival: integer('is_new_arrival', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  rating: real('rating').default(5),
  reviewCount: integer('review_count').default(0),
  customMeasurementConfig: text('custom_measurement_config'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  seoKeywords: text('seo_keywords'),
  imageAlt: text('image_alt'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  fabricWidth: text('fabric_width').notNull().default('all'),
  order: integer('sort_order').notNull().default(1),
  description: text('description'),
  icon: text('icon'),
  imageUrl: text('image_url'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const productCategories = sqliteTable('product_categories', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  categoryId: text('category_id').notNull(),
});

export const banners = sqliteTable('banners', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  imageUrl: text('image_url').notNull(),
  linkUrl: text('link_url'),
  placement: text('placement').notNull().default('hero'),
  order: integer('sort_order').notNull().default(1),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const productPriceHistory = sqliteTable('product_price_history', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  pricePerYard: real('price_per_yard').notNull(),
  discountPrice: real('discount_price'),
  recordedAt: text('recorded_at').notNull(),
});

export const productSales = sqliteTable('product_sales', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  orderId: text('order_id').notNull(),
  yardsSold: real('yards_sold').notNull(),
  revenue: real('revenue').notNull(),
  soldAt: text('sold_at').notNull(),
});

export const fabricSections = sqliteTable('fabric_sections', {
  id: text('id').primaryKey(),
  collectionType: text('collection_type').notNull(),
  eyebrow: text('eyebrow').notNull(),
  heading: text('heading').notNull(),
  subtitle: text('subtitle').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const fabricCategories = sqliteTable('fabric_categories', {
  id: text('id').primaryKey(),
  collectionType: text('collection_type').notNull(),
  name: text('name').notNull(),
  matchCategoryName: text('match_category_name').notNull(),
  slug: text('slug').notNull(),
  description: text('description').notNull().default(''),
  sampleFabrics: text('sample_fabrics').notNull().default(''),
  standardYards: text('standard_yards').notNull().default(''),
  buttonLabel: text('button_label').notNull().default(''),
  buttonLink: text('button_link').notNull().default(''),
  icon: text('icon').notNull().default('sparkles'),
  representativeProductId: text('representative_product_id').notNull().default(''),
  fallbackColorHex: text('fallback_color_hex').notNull().default('#C5A46D'),
  fallbackPatternType: text('fallback_pattern_type').notNull().default('cotton'),
  customImageUrl: text('custom_image_url'),
  order: integer('sort_order').notNull().default(1),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull(),
});

export const fabricDesignSettings = sqliteTable('fabric_design_settings', {
  collectionType: text('collection_type').primaryKey(),
  data: text('data').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const fabricSnapshots = sqliteTable('fabric_snapshots', {
  collectionType: text('collection_type').primaryKey(),
  draftSnapshot: text('draft_snapshot'),
  previousPublishedSnapshot: text('previous_published_snapshot'),
  hasUnpushedDraft: integer('has_unpushed_draft', { mode: 'boolean' }).notNull().default(false),
  updatedAt: text('updated_at').notNull(),
});
