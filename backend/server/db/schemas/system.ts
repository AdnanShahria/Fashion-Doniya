import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const systemSettings = sqliteTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const systemCache = sqliteTable('system_cache', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  expiresAt: text('expires_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const adminLogs = sqliteTable('admin_logs', {
  id: text('id').primaryKey(),
  action: text('action').notNull(),
  category: text('category').notNull().default('system'),
  details: text('details').notNull().default(''),
  actor: text('actor').notNull().default('Admin'),
  createdAt: text('created_at').notNull(),
});
