import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const loyaltyTiers = sqliteTable('loyalty_tiers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  minPoints: integer('min_points').notNull().default(0),
  multiplier: real('multiplier').notNull().default(1),
  perks: text('perks').notNull().default('[]'),
});

export const loyaltyRewards = sqliteTable('loyalty_rewards', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  pointsCost: integer('points_cost').notNull(),
  rewardType: text('reward_type').notNull().default('coupon'),
  rewardValue: real('reward_value').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

export const loyaltyTransactions = sqliteTable('loyalty_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  points: integer('points').notNull(),
  type: text('type').notNull(),
  description: text('description').notNull(),
  createdAt: text('created_at').notNull(),
});

export const loyaltyRedemptions = sqliteTable('loyalty_redemptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  rewardId: text('reward_id').notNull(),
  pointsSpent: integer('points_spent').notNull(),
  couponCode: text('coupon_code'),
  createdAt: text('created_at').notNull(),
});

export const userLoyalty = sqliteTable('user_loyalty', {
  userId: text('user_id').primaryKey(),
  pointsBalance: integer('points_balance').notNull().default(0),
  lifetimePoints: integer('lifetime_points').notNull().default(0),
  tierId: text('tier_id').notNull().default('tier-bronze'),
  updatedAt: text('updated_at').notNull(),
});

export const userInteractions = sqliteTable('user_interactions', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  sessionId: text('session_id'),
  productId: text('product_id').notNull(),
  action: text('action').notNull(),
  createdAt: text('created_at').notNull(),
});

export const productSimilarity = sqliteTable('product_similarity', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  similarProductId: text('similar_product_id').notNull(),
  score: real('score').notNull().default(0),
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  linkUrl: text('link_url'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const newsletterLeads = sqliteTable('newsletter_leads', {
  id: text('id').primaryKey(),
  email: text('email'),
  phone: text('phone'),
  source: text('source').default('footer'),
  createdAt: text('created_at').notNull(),
});

export const popupSettings = sqliteTable('popup_settings', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  imageUrl: text('image_url'),
  ctaLabel: text('cta_label'),
  ctaUrl: text('cta_url'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  updatedAt: text('updated_at').notNull(),
});

export const contactMessages = sqliteTable('contact_messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('unread'),
  createdAt: text('created_at').notNull(),
});

export const customDesignRequests = sqliteTable('custom_design_requests', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  outfitCategory: text('outfit_category').notNull(),
  fabricDetails: text('fabric_details').notNull(),
  measurements: text('measurements'),
  referenceImages: text('reference_images').default('[]'),
  notes: text('notes'),
  status: text('status').notNull().default('Pending'),
  adminNotes: text('admin_notes'),
  createdAt: text('created_at').notNull(),
});
