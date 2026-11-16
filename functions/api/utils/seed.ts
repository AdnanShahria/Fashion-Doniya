import { eq } from 'drizzle-orm';
import type { Bindings } from '../types';
import type { AppDatabase } from './db-factory';
import {
  products,
  categories,
  fabricSections,
  fabricCategories,
  fabricDesignSettings,
  fabricSnapshots,
  users,
  orders,
  trackings,
  courierInfo,
  sizeGuides,
  measurementRules,
  additionalItems,
  contactMessages,
  customDesignRequests,
  adminLogs,
  systemSettings,
  loyaltyTiers,
  coupons,
} from '../../../backend/server/db/schemas/index';
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
  INITIAL_MEASUREMENT_RULES,
  INITIAL_ADDITIONAL_ITEMS,
  INITIAL_CATEGORY_MEASUREMENT_GUIDES,
  createInitialFabricCollectionsState,
} from '../../../frontend/src/data/seedData';
import type { CustomerUser } from '../../../frontend/src/types/index';
import { hashPassword } from './auth-helper';
import { normalizePhone, slugify } from './helpers';

const SEED_MARKER_KEY = 'seed.version';
const SEED_VERSION = 'v2';
let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(db: AppDatabase, env?: Bindings): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = runEnsureSeeded(db, env).finally(() => {
    seedPromise = null;
  });
  return seedPromise;
}

async function runEnsureSeeded(db: AppDatabase, env?: Bindings): Promise<void> {
  try {
    const marker = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, SEED_MARKER_KEY))
      .get();
    if (marker?.value === SEED_VERSION) {
      return;
    }
  } catch {
    // Table might not exist before migration; let caller handle error cleanly
    return;
  }

  const now = new Date().toISOString();

  const existingProducts = await db.select({ id: products.id }).from(products).limit(1);
  if (existingProducts.length === 0) {
    for (const p of INITIAL_PRODUCTS) {
      await db
        .insert(products)
        .values({
          id: p.id,
          slug: slugify(p.nameEn || p.name) || p.id,
          name: p.name,
          nameEn: p.nameEn || null,
          description: p.description,
          sku: p.sku,
          fabricWidth: p.fabricWidth,
          category: p.category,
          fabricType: p.fabricType,
          design: p.design || null,
          color: p.color,
          colorHex: p.colorHex || null,
          availableColors: JSON.stringify(p.availableColors || []),
          pricePerYard: p.pricePerYard,
          discountPrice: p.discountPrice ?? null,
          stockYards: p.stockYards,
          minOrderQuantity: p.minOrderQuantity,
          stepYard: p.stepYard,
          images: JSON.stringify(p.images || []),
          patternType: p.patternType,
          isFeatured: Boolean(p.isFeatured),
          isBestSeller: Boolean(p.isBestSeller),
          isNewArrival: Boolean(p.isNewArrival),
          isActive: p.isActive !== false,
          rating: p.rating ?? 5,
          reviewCount: p.reviewCount ?? 0,
          customMeasurementConfig: p.customMeasurementConfig
            ? JSON.stringify(p.customMeasurementConfig)
            : null,
          seoTitle: p.seoTitle || null,
          seoDescription: p.seoDescription || null,
          seoKeywords: p.seoKeywords || null,
          imageAlt: p.imageAlt || null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }
  } else {
    for (const p of INITIAL_PRODUCTS) {
      const targetSlug = slugify(p.nameEn || p.name) || p.id;
      const existingProd = await db
        .select({ id: products.id, slug: products.slug })
        .from(products)
        .where(eq(products.id, p.id))
        .get();
      if (existingProd && existingProd.slug === existingProd.id && targetSlug !== existingProd.slug) {
        await db
          .update(products)
          .set({ slug: targetSlug, updatedAt: now })
          .where(eq(products.id, p.id));
      }
    }
  }

  const existingCats = await db.select({ id: categories.id }).from(categories).limit(1);
  if (existingCats.length === 0) {
    for (const c of INITIAL_CATEGORIES) {
      await db
        .insert(categories)
        .values({
          id: c.id,
          name: c.name,
          slug: c.slug,
          fabricWidth: c.fabricWidth,
          order: c.order,
          description: c.description || null,
          icon: c.icon || null,
          imageUrl: c.imageUrl || null,
          isActive: c.isActive !== false,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }
  } else {
    for (const p of INITIAL_PRODUCTS) {
      const targetSlug = slugify(p.nameEn || p.name) || p.id;
      const existingProd = await db
        .select({ id: products.id, slug: products.slug })
        .from(products)
        .where(eq(products.id, p.id))
        .get();
      if (existingProd && existingProd.slug === existingProd.id && targetSlug !== existingProd.slug) {
        await db
          .update(products)
          .set({ slug: targetSlug, updatedAt: now })
          .where(eq(products.id, p.id));
      }
    }
  }

  // Fabric Collections (2.5_bahar & 3.5_bahar)
  const existingSections = await db.select({ id: fabricSections.id }).from(fabricSections).limit(1);
  if (existingSections.length === 0) {
    const fcState = createInitialFabricCollectionsState();
    for (const colType of ['3.5_bahar', '2.5_bahar'] as const) {
      const sec = fcState.fabric_sections[colType];
      await db
        .insert(fabricSections)
        .values({
          id: sec.id,
          collectionType: colType,
          eyebrow: sec.eyebrow,
          heading: sec.heading,
          subtitle: sec.subtitle,
          updatedAt: sec.updatedAt || now,
        })
        .onConflictDoNothing();

      for (const fc of fcState.fabric_categories[colType]) {
        await db
          .insert(fabricCategories)
          .values({
            id: fc.id,
            collectionType: colType,
            name: fc.name,
            matchCategoryName: fc.matchCategoryName,
            slug: fc.slug,
            description: fc.description,
            sampleFabrics: fc.sampleFabrics,
            standardYards: fc.standardYards,
            buttonLabel: fc.buttonLabel,
            buttonLink: fc.buttonLink,
            icon: fc.icon,
            representativeProductId: fc.representativeProductId,
            fallbackColorHex: fc.fallbackColorHex,
            fallbackPatternType: fc.fallbackPatternType,
            customImageUrl: fc.customImageUrl || null,
            order: fc.order,
            isEnabled: fc.isEnabled,
            updatedAt: fc.updatedAt || now,
          })
          .onConflictDoNothing();
      }

      const design = fcState.fabric_category_design_settings[colType];
      await db
        .insert(fabricDesignSettings)
        .values({
          collectionType: colType,
          data: JSON.stringify(design),
          updatedAt: design.updatedAt || now,
        })
        .onConflictDoNothing();

      await db
        .insert(fabricSnapshots)
        .values({
          collectionType: colType,
          draftSnapshot: JSON.stringify(fcState.drafts[colType]),
          previousPublishedSnapshot: null,
          hasUnpushedDraft: false,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }
  }

  // Size guides, rules, additional items
  const existingGuides = await db.select({ id: sizeGuides.id }).from(sizeGuides).limit(1);
  if (existingGuides.length === 0) {
    for (const g of INITIAL_CATEGORY_MEASUREMENT_GUIDES) {
      await db
        .insert(sizeGuides)
        .values({
          id: g.id,
          categoryName: g.categoryName,
          collectionType: g.fabricWidth ? `${g.fabricWidth}_bahar` : null,
          data: JSON.stringify(g),
          updatedAt: g.updatedAt || now,
        })
        .onConflictDoNothing();
    }
  }

  const existingRules = await db.select({ id: measurementRules.id }).from(measurementRules).limit(1);
  if (existingRules.length === 0) {
    for (let idx = 0; idx < INITIAL_MEASUREMENT_RULES.length; idx++) {
      const r = INITIAL_MEASUREMENT_RULES[idx];
      await db
        .insert(measurementRules)
        .values({
          id: r.id,
          fabricWidth: r.fabricWidth,
          name: r.name,
          baseYards: r.baseYards,
          data: JSON.stringify(r),
          order: idx + 1,
          isActive: r.isActive,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }
  }

  const existingAddons = await db.select({ id: additionalItems.id }).from(additionalItems).limit(1);
  if (existingAddons.length === 0) {
    for (let idx = 0; idx < INITIAL_ADDITIONAL_ITEMS.length; idx++) {
      const item = INITIAL_ADDITIONAL_ITEMS[idx];
      await db
        .insert(additionalItems)
        .values({
          id: item.id,
          fabricWidth: item.fabricWidth,
          name: item.name,
          yardsPerUnit: item.yardsPerUnit,
          data: JSON.stringify(item),
          order: idx + 1,
          isActive: item.isActive,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }
  }

  // Customers
  const demoCustomerDefaults: CustomerUser = {
    id: 'cust-1',
    fullName: 'নুসরাত জাহান',
    phone: '01711223344',
    email: '01711223344@fashiondoniya.com',
    status: 'active' as const,
    district: 'ঢাকা',
    upazila: 'ধানমন্ডি',
    address: {
      district: 'ঢাকা',
      upazila: 'ধানমন্ডি',
      area: 'রোড ৮',
      fullAddress: 'ফ্ল্যাট ৪বি, বাড়ি ২৭, রোড ৮, ধানমন্ডি, ঢাকা',
    },
    fullAddress: 'ফ্ল্যাট ৪বি, বাড়ি ২৭, রোড ৮, ধানমন্ডি, ঢাকা',
    createdAt: now,
    updatedAt: now,
  };
  const customersToSeed =
    INITIAL_CUSTOMERS.length > 0
      ? INITIAL_CUSTOMERS.some(
          (c) => c.id === 'cust-1' || normalizePhone(c.phone) === '01711223344'
        )
        ? INITIAL_CUSTOMERS
        : [demoCustomerDefaults, ...INITIAL_CUSTOMERS]
      : [demoCustomerDefaults];

  const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
  if (existingUsers.length === 0) {
    const { salt: cSalt, hash: cHash } = await hashPassword('123456');
    for (const c of customersToSeed) {
      await db
        .insert(users)
        .values({
          id: c.id,
          fullName: c.fullName,
          phone: normalizePhone(c.phone),
          email: c.email || null,
          passwordHash: cHash,
          passwordSalt: cSalt,
          role: 'user',
          status: c.status || 'active',
          district: c.district || c.address?.district || null,
          upazila: c.upazila || c.address?.upazila || null,
          area: c.address?.area || null,
          fullAddress: c.fullAddress || c.address?.fullAddress || null,
          savedMeasurements: c.savedMeasurements ? JSON.stringify(c.savedMeasurements) : null,
          walletBalance: 0,
          totalOrders: 0,
          totalSpent: 0,
          createdAt: c.createdAt || now,
          updatedAt: c.updatedAt || now,
        })
        .onConflictDoNothing();
    }
  } else {
    const demoUserById = await db.select().from(users).where(eq(users.id, 'cust-1')).get();
    const demoUserByPhone =
      demoUserById || (await db.select().from(users).where(eq(users.phone, '01711223344')).get());
    if (demoUserByPhone && (!demoUserByPhone.passwordHash || !demoUserByPhone.passwordSalt)) {
      const { salt: cSalt, hash: cHash } = await hashPassword('123456');
      await db
        .update(users)
        .set({ passwordHash: cHash, passwordSalt: cSalt, updatedAt: now })
        .where(eq(users.id, demoUserByPhone.id));
    } else if (!demoUserByPhone) {
      const { salt: cSalt, hash: cHash } = await hashPassword('123456');
      await db
        .insert(users)
        .values({
          id: demoCustomerDefaults.id,
          fullName: demoCustomerDefaults.fullName,
          phone: demoCustomerDefaults.phone,
          email: demoCustomerDefaults.email,
          passwordHash: cHash,
          passwordSalt: cSalt,
          role: 'user',
          status: demoCustomerDefaults.status,
          district: demoCustomerDefaults.district,
          upazila: demoCustomerDefaults.upazila,
          area: demoCustomerDefaults.address?.area || null,
          fullAddress: demoCustomerDefaults.fullAddress,
          savedMeasurements: null,
          walletBalance: 0,
          totalOrders: 0,
          totalSpent: 0,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }
  }

  // Demo Orders + Tracking + Courier
  const existingOrders = await db.select({ id: orders.id }).from(orders).limit(1);
  if (existingOrders.length === 0) {
    for (const o of INITIAL_DEMO_ORDERS) {
      await db
        .insert(orders)
        .values({
          id: o.id,
          orderNumber: o.orderNumber,
          userId: null,
          customer: JSON.stringify(o.customer),
          items: JSON.stringify(o.items),
          subtotal: o.subtotal,
          deliveryCharge: o.deliveryCharge,
          discountAmount: o.discount || 0,
          couponCode: o.couponCode || null,
          totalAmount: o.grandTotal,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          paymentDetails: o.paymentDetails ? JSON.stringify(o.paymentDetails) : null,
          orderStatus: o.orderStatus,
          estimatedDeliveryDate: o.estimatedDeliveryDate || null,
          notes: o.customer?.deliveryNotes || null,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt || o.createdAt,
        })
        .onConflictDoNothing();
    }
    for (const t of INITIAL_TRACKING_HISTORY) {
      await db
        .insert(trackings)
        .values({
          id: t.id,
          orderId: t.orderId,
          orderNumber: t.orderNumber,
          status: t.status,
          timestamp: t.timestamp,
          note: t.note,
          location: t.location || null,
          updatedBy: t.updatedBy || 'System',
        })
        .onConflictDoNothing();
    }
    for (const ci of INITIAL_COURIER_INFO) {
      await db
        .insert(courierInfo)
        .values({
          id: ci.id,
          orderId: ci.orderId,
          orderNumber: ci.orderNumber,
          courierName: ci.courierName,
          trackingNumber: ci.trackingNumber,
          consignmentId: ci.consignmentId || null,
          estimatedDeliveryDate: ci.estimatedDeliveryDate || null,
          trackingUrl: ci.trackingUrl || null,
          courierStatus: ci.courierStatus || null,
          lastSyncedAt: ci.lastSyncedAt || null,
          isApiConnected: Boolean(ci.isApiConnected),
          updatedAt: ci.updatedAt || now,
        })
        .onConflictDoNothing();
    }
  }

  // Contact Messages & Custom Requests & Activity Logs
  const existingMsgs = await db.select({ id: contactMessages.id }).from(contactMessages).limit(1);
  if (existingMsgs.length === 0) {
    for (const m of INITIAL_CONTACT_MESSAGES) {
      await db.insert(contactMessages).values(m).onConflictDoNothing();
    }
  }

  const existingReqs = await db.select({ id: customDesignRequests.id }).from(customDesignRequests).limit(1);
  if (existingReqs.length === 0) {
    for (const r of INITIAL_CUSTOM_REQUESTS) {
      await db
        .insert(customDesignRequests)
        .values({
          id: r.id,
          customerName: r.customerName,
          phone: r.phone,
          outfitCategory: r.outfitType,
          fabricDetails: r.description,
          measurements: r.measurements ? JSON.stringify(r.measurements) : null,
          referenceImages: JSON.stringify(r.referenceImageBase64 ? [r.referenceImageBase64] : []),
          notes: r.measurements?.notes || null,
          status: r.status,
          adminNotes: r.adminNotes || null,
          createdAt: r.createdAt,
        })
        .onConflictDoNothing();
    }
  }

  const existingLogs = await db.select({ id: adminLogs.id }).from(adminLogs).limit(1);
  if (existingLogs.length === 0) {
    for (const l of INITIAL_ACTIVITY_LOGS) {
      await db
        .insert(adminLogs)
        .values({
          id: l.id,
          action: l.action,
          category: l.category,
          details: l.details,
          actor: l.actor || 'System',
          createdAt: l.timestamp,
        })
        .onConflictDoNothing();
    }
  }

  // Loyalty Tiers & Initial Coupons
  const existingTiers = await db.select({ id: loyaltyTiers.id }).from(loyaltyTiers).limit(1);
  if (existingTiers.length === 0) {
    for (const tier of [
      { id: 'tier-bronze', name: 'Bronze', minPoints: 0, multiplier: 1, perks: '["Standard Delivery"]' },
      { id: 'tier-silver', name: 'Silver', minPoints: 500, multiplier: 1.25, perks: '["Priority Support","5% Birthday Bonus"]' },
      { id: 'tier-gold', name: 'Gold', minPoints: 1500, multiplier: 1.5, perks: '["Free Cutting Service","Early Collection Access"]' },
    ]) {
      await db.insert(loyaltyTiers).values(tier).onConflictDoNothing();
    }
  }

  if (Array.isArray(INITIAL_SETTINGS.coupons)) {
    for (const cp of INITIAL_SETTINGS.coupons) {
      await db
        .insert(coupons)
        .values({
          id: `cp-${cp.code}`,
          code: cp.code,
          discountType: cp.discountType,
          discountValue: cp.discountValue,
          minOrderAmount: cp.minOrderAmount || 0,
          isActive: cp.isActive !== false,
          usedCount: 0,
          createdAt: now,
        })
        .onConflictDoNothing();
    }
  }

  // System settings & Admin account
  const defaultPass = String(env?.ADMIN_PASSWORD || 'Admin@2026');
  const { salt, hash } = await hashPassword(defaultPass);
  const adminAccount = {
    email: String(env?.ADMIN_EMAIL || 'admin@fashiondoniyabd.com').toLowerCase(),
    name: 'Fashion Doniya Admin',
    role: 'super_admin',
    passwordSalt: salt,
    passwordHash: hash,
    updatedAt: now,
  };

  const settingsEntries: Array<{ key: string; value: string }> = [
    { key: 'store_settings', value: JSON.stringify(INITIAL_SETTINGS) },
    { key: 'payment_settings', value: JSON.stringify(INITIAL_PAYMENT_SETTINGS) },
    { key: 'admin_account', value: JSON.stringify(adminAccount) },
    { key: 'demo.mode', value: 'false' },
    {
      key: 'tier_capabilities',
      value: JSON.stringify({
        'feature.dashboard': true,
        'feature.wallet': true,
        'feature.loyalty': true,
        'feature.returns': true,
        'feature.aiStudio': true,
        'feature.customDesign': true,
        'feature.calculator': true,
      }),
    },
    { key: SEED_MARKER_KEY, value: SEED_VERSION },
  ];

  for (const entry of settingsEntries) {
    if (entry.key === SEED_MARKER_KEY) {
      await db
        .insert(systemSettings)
        .values({ key: entry.key, value: entry.value, updatedAt: now })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value: entry.value, updatedAt: now },
        });
    } else {
      await db
        .insert(systemSettings)
        .values({ key: entry.key, value: entry.value, updatedAt: now })
        .onConflictDoNothing();
    }
  }
}
