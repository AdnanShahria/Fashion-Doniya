import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const sizeGuides = sqliteTable('size_guides', {
  id: text('id').primaryKey(),
  categoryName: text('category_name').notNull(),
  collectionType: text('collection_type'),
  data: text('data').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const measurementRules = sqliteTable('measurement_rules', {
  id: text('id').primaryKey(),
  fabricWidth: text('fabric_width').notNull(),
  name: text('name').notNull(),
  baseYards: real('base_yards').notNull().default(2.5),
  data: text('data').notNull(),
  order: integer('sort_order').notNull().default(1),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull(),
});

export const additionalItems = sqliteTable('additional_items', {
  id: text('id').primaryKey(),
  fabricWidth: text('fabric_width').notNull(),
  name: text('name').notNull(),
  yardsPerUnit: real('yards_per_unit').notNull().default(0.5),
  data: text('data').notNull(),
  order: integer('sort_order').notNull().default(1),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull(),
});
