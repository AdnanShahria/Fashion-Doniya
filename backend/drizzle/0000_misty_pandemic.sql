CREATE TABLE `banners` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`image_url` text NOT NULL,
	`link_url` text,
	`placement` text DEFAULT 'hero' NOT NULL,
	`sort_order` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`fabric_width` text DEFAULT 'all' NOT NULL,
	`sort_order` integer DEFAULT 1 NOT NULL,
	`description` text,
	`icon` text,
	`image_url` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fabric_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_type` text NOT NULL,
	`name` text NOT NULL,
	`match_category_name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`sample_fabrics` text DEFAULT '' NOT NULL,
	`standard_yards` text DEFAULT '' NOT NULL,
	`button_label` text DEFAULT '' NOT NULL,
	`button_link` text DEFAULT '' NOT NULL,
	`icon` text DEFAULT 'sparkles' NOT NULL,
	`representative_product_id` text DEFAULT '' NOT NULL,
	`fallback_color_hex` text DEFAULT '#C5A46D' NOT NULL,
	`fallback_pattern_type` text DEFAULT 'cotton' NOT NULL,
	`custom_image_url` text,
	`sort_order` integer DEFAULT 1 NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fabric_design_settings` (
	`collection_type` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fabric_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_type` text NOT NULL,
	`eyebrow` text NOT NULL,
	`heading` text NOT NULL,
	`subtitle` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fabric_snapshots` (
	`collection_type` text PRIMARY KEY NOT NULL,
	`draft_snapshot` text,
	`previous_published_snapshot` text,
	`has_unpushed_draft` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`category_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_price_history` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`price_per_yard` real NOT NULL,
	`discount_price` real,
	`recorded_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_sales` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`order_id` text NOT NULL,
	`yards_sold` real NOT NULL,
	`revenue` real NOT NULL,
	`sold_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`name_en` text,
	`description` text DEFAULT '' NOT NULL,
	`sku` text NOT NULL,
	`fabric_width` text DEFAULT '3.5' NOT NULL,
	`category` text NOT NULL,
	`fabric_type` text DEFAULT '' NOT NULL,
	`design` text,
	`color` text DEFAULT '' NOT NULL,
	`color_hex` text,
	`available_colors` text DEFAULT '[]' NOT NULL,
	`price_per_yard` real DEFAULT 0 NOT NULL,
	`discount_price` real,
	`stock_yards` real DEFAULT 0 NOT NULL,
	`min_order_quantity` real DEFAULT 1 NOT NULL,
	`step_yard` real DEFAULT 0.5 NOT NULL,
	`images` text DEFAULT '[]' NOT NULL,
	`pattern_type` text DEFAULT 'cotton' NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`is_best_seller` integer DEFAULT false NOT NULL,
	`is_new_arrival` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`rating` real DEFAULT 5,
	`review_count` integer DEFAULT 0,
	`custom_measurement_config` text,
	`seo_title` text,
	`seo_description` text,
	`seo_keywords` text,
	`image_alt` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text DEFAULT 'Home' NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`district` text NOT NULL,
	`upazila` text,
	`area` text,
	`full_address` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`discount_type` text DEFAULT 'percentage' NOT NULL,
	`discount_value` real DEFAULT 0 NOT NULL,
	`min_order_amount` real DEFAULT 0,
	`max_discount_amount` real,
	`usage_limit` integer,
	`used_count` integer DEFAULT 0 NOT NULL,
	`expires_at` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `courier_info` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`order_number` text NOT NULL,
	`courier_name` text NOT NULL,
	`tracking_number` text NOT NULL,
	`consignment_id` text,
	`estimated_delivery_date` text,
	`tracking_url` text,
	`courier_status` text,
	`last_synced_at` text,
	`is_api_connected` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`sku` text,
	`yards` real DEFAULT 1 NOT NULL,
	`price_per_yard` real DEFAULT 0 NOT NULL,
	`line_total` real DEFAULT 0 NOT NULL,
	`selected_color` text,
	`customization` text
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text,
	`customer` text NOT NULL,
	`items` text NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`delivery_charge` real DEFAULT 0 NOT NULL,
	`discount_amount` real DEFAULT 0 NOT NULL,
	`coupon_code` text,
	`total_amount` real DEFAULT 0 NOT NULL,
	`payment_method` text DEFAULT 'cod' NOT NULL,
	`payment_status` text DEFAULT 'Pending' NOT NULL,
	`payment_details` text,
	`order_status` text DEFAULT 'Pending' NOT NULL,
	`estimated_delivery_date` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`code_hash` text NOT NULL,
	`purpose` text DEFAULT 'auth' NOT NULL,
	`expires_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`consumed_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `returns` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`refund_amount` real DEFAULT 0,
	`admin_note` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`user_id` text,
	`author_name` text NOT NULL,
	`rating` integer DEFAULT 5 NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`is_verified` integer DEFAULT false NOT NULL,
	`is_approved` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trackings` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`order_number` text NOT NULL,
	`status` text NOT NULL,
	`timestamp` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`location` text,
	`updated_by` text
);
--> statement-breakpoint
CREATE TABLE `user_carts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`session_id` text,
	`items` text DEFAULT '[]' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`password_hash` text,
	`password_salt` text,
	`role` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`district` text,
	`upazila` text,
	`area` text,
	`full_address` text,
	`saved_measurements` text,
	`wallet_balance` real DEFAULT 0 NOT NULL,
	`total_orders` integer DEFAULT 0 NOT NULL,
	`total_spent` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`reference_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'unread' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `custom_design_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`outfit_category` text NOT NULL,
	`fabric_details` text NOT NULL,
	`measurements` text,
	`reference_images` text DEFAULT '[]',
	`notes` text,
	`status` text DEFAULT 'Pending' NOT NULL,
	`admin_notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `loyalty_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reward_id` text NOT NULL,
	`points_spent` integer NOT NULL,
	`coupon_code` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `loyalty_rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`points_cost` integer NOT NULL,
	`reward_type` text DEFAULT 'coupon' NOT NULL,
	`reward_value` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `loyalty_tiers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`min_points` integer DEFAULT 0 NOT NULL,
	`multiplier` real DEFAULT 1 NOT NULL,
	`perks` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `loyalty_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`points` integer NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `newsletter_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`phone` text,
	`source` text DEFAULT 'footer',
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`link_url` text,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `popup_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`image_url` text,
	`cta_label` text,
	`cta_url` text,
	`is_active` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_similarity` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`similar_product_id` text NOT NULL,
	`score` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_interactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`session_id` text,
	`product_id` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_loyalty` (
	`user_id` text PRIMARY KEY NOT NULL,
	`points_balance` integer DEFAULT 0 NOT NULL,
	`lifetime_points` integer DEFAULT 0 NOT NULL,
	`tier_id` text DEFAULT 'tier-bronze' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `additional_items` (
	`id` text PRIMARY KEY NOT NULL,
	`fabric_width` text NOT NULL,
	`name` text NOT NULL,
	`yards_per_unit` real DEFAULT 0.5 NOT NULL,
	`data` text NOT NULL,
	`sort_order` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `measurement_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`fabric_width` text NOT NULL,
	`name` text NOT NULL,
	`base_yards` real DEFAULT 2.5 NOT NULL,
	`data` text NOT NULL,
	`sort_order` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `size_guides` (
	`id` text PRIMARY KEY NOT NULL,
	`category_name` text NOT NULL,
	`collection_type` text,
	`data` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`category` text DEFAULT 'system' NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`actor` text DEFAULT 'Admin' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `system_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`expires_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
