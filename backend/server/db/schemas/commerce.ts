import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  passwordHash: text('password_hash'),
  passwordSalt: text('password_salt'),
  role: text('role').notNull().default('user'),
  status: text('status').notNull().default('active'),
  district: text('district'),
  upazila: text('upazila'),
  area: text('area'),
  fullAddress: text('full_address'),
  savedMeasurements: text('saved_measurements'),
  walletBalance: real('wallet_balance').notNull().default(0),
  totalOrders: integer('total_orders').notNull().default(0),
  totalSpent: real('total_spent').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const addresses = sqliteTable('addresses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  label: text('label').notNull().default('Home'),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  district: text('district').notNull(),
  upazila: text('upazila'),
  area: text('area'),
  fullAddress: text('full_address').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const userCarts = sqliteTable('user_carts', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  sessionId: text('session_id'),
  items: text('items').notNull().default('[]'),
  updatedAt: text('updated_at').notNull(),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull(),
  userId: text('user_id'),
  customer: text('customer').notNull(),
  items: text('items').notNull(),
  subtotal: real('subtotal').notNull().default(0),
  deliveryCharge: real('delivery_charge').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  couponCode: text('coupon_code'),
  totalAmount: real('total_amount').notNull().default(0),
  paymentMethod: text('payment_method').notNull().default('cod'),
  paymentStatus: text('payment_status').notNull().default('Pending'),
  paymentDetails: text('payment_details'),
  orderStatus: text('order_status').notNull().default('Pending'),
  estimatedDeliveryDate: text('estimated_delivery_date'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  sku: text('sku'),
  yards: real('yards').notNull().default(1),
  pricePerYard: real('price_per_yard').notNull().default(0),
  lineTotal: real('line_total').notNull().default(0),
  selectedColor: text('selected_color'),
  customization: text('customization'),
});

export const trackings = sqliteTable('trackings', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  orderNumber: text('order_number').notNull(),
  status: text('status').notNull(),
  timestamp: text('timestamp').notNull(),
  note: text('note').notNull().default(''),
  location: text('location'),
  updatedBy: text('updated_by'),
});

export const courierInfo = sqliteTable('courier_info', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  orderNumber: text('order_number').notNull(),
  courierName: text('courier_name').notNull(),
  trackingNumber: text('tracking_number').notNull(),
  consignmentId: text('consignment_id'),
  estimatedDeliveryDate: text('estimated_delivery_date'),
  trackingUrl: text('tracking_url'),
  courierStatus: text('courier_status'),
  lastSyncedAt: text('last_synced_at'),
  isApiConnected: integer('is_api_connected', { mode: 'boolean' }).notNull().default(false),
  updatedAt: text('updated_at').notNull(),
});

export const returns = sqliteTable('returns', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  orderNumber: text('order_number').notNull(),
  userId: text('user_id').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('requested'),
  refundAmount: real('refund_amount').default(0),
  adminNote: text('admin_note'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  userId: text('user_id'),
  authorName: text('author_name').notNull(),
  rating: integer('rating').notNull().default(5),
  comment: text('comment').notNull().default(''),
  isVerified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
  isApproved: integer('is_approved', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

export const coupons = sqliteTable('coupons', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  discountType: text('discount_type').notNull().default('percentage'),
  discountValue: real('discount_value').notNull().default(0),
  minOrderAmount: real('min_order_amount').default(0),
  maxDiscountAmount: real('max_discount_amount'),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').notNull().default(0),
  expiresAt: text('expires_at'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

export const walletTransactions = sqliteTable('wallet_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  amount: real('amount').notNull(),
  type: text('type').notNull(),
  description: text('description').notNull(),
  referenceId: text('reference_id'),
  createdAt: text('created_at').notNull(),
});

export const otpCodes = sqliteTable('otp_codes', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  codeHash: text('code_hash').notNull(),
  purpose: text('purpose').notNull().default('auth'),
  expiresAt: text('expires_at').notNull(),
  attempts: integer('attempts').notNull().default(0),
  consumedAt: text('consumed_at'),
  createdAt: text('created_at').notNull(),
});
