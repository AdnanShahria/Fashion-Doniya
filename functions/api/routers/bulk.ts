import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import type { AppEnv, Bindings } from '../types';
import {
  orders,
  users,
  banners,
  notifications,
  walletTransactions,
  userLoyalty,
  systemSettings,
} from '../../../backend/server/db/schemas/index';
import { getHomeCache, setHomeCache } from '../utils/cache';
import {
  getAllProductsList,
  getAllCategoriesList,
  getStoreAndPaymentSettings,
  getFabricCollectionsState,
  getMeasurementsState,
} from '../utils/mappers';
import { safeJsonParse } from '../utils/helpers';

export const bulkRouter = new Hono<AppEnv>();

// 15s router micro-cache + in-flight request coalescing
interface MicroCacheEntry<T> {
  data: T;
  expiresAt: number;
}
const microCache = new Map<string, MicroCacheEntry<unknown>>();
const inFlightMap = new Map<string, Promise<unknown>>();
const MICRO_TTL_MS = 15_000;

async function withCoalescedMicroCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = microCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }
  const existingFlight = inFlightMap.get(key);
  if (existingFlight) {
    return existingFlight as Promise<T>;
  }
  const promise = fetcher()
    .then((data) => {
      microCache.set(key, { data, expiresAt: Date.now() + MICRO_TTL_MS });
      return data;
    })
    .finally(() => {
      inFlightMap.delete(key);
    });
  inFlightMap.set(key, promise);
  return promise;
}

export function clearBulkMicroCache() {
  microCache.clear();
}

export async function getBulkHomePayload(db: AppEnv['Variables']['db'], env?: Bindings) {
  return await withCoalescedMicroCache('bulk:home', async () => {
    const edgeCached = env ? await getHomeCache<Record<string, unknown>>(env) : null;
    if (edgeCached) {
      return { ...edgeCached, cached: true };
    }

    const [
      productsList,
      categoriesList,
      { settings, paymentSettings },
      fabricCollections,
      measurements,
      bannerRows,
      tierRow,
    ] = await Promise.all([
      getAllProductsList(db),
      getAllCategoriesList(db),
      getStoreAndPaymentSettings(db),
      getFabricCollectionsState(db),
      getMeasurementsState(db),
      db.select().from(banners),
      db.select().from(systemSettings).where(eq(systemSettings.key, 'tier_capabilities')).get(),
    ]);

    const freshPayload = {
      success: true,
      products: productsList,
      categories: categoriesList,
      settings,
      paymentSettings,
      fabricCollections,
      measurements,
      banners: bannerRows,
      tierCapabilities: safeJsonParse<Record<string, boolean>>(tierRow?.value, {}),
      generatedAt: new Date().toISOString(),
    };

    if (env) {
      await setHomeCache(env, freshPayload);
    }
    return freshPayload;
  });
}

bulkRouter.get('/home', async (c) => {
  const db = c.get('db');
  const payload = await getBulkHomePayload(db, c.env);
  return c.json(payload);
});

bulkRouter.get('/user', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
  const db = c.get('db');
  const data = await withCoalescedMicroCache(`bulk:user:${user.id}`, async () => {
    const [profile, walletRows, loyaltyRow, notifRows] = await Promise.all([
      db.select().from(users).where(eq(users.id, user.id)).get(),
      db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.userId, user.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(20),
      db.select().from(userLoyalty).where(eq(userLoyalty.userId, user.id)).get(),
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(20),
    ]);

    return {
      success: true,
      profile: profile
        ? {
            id: profile.id,
            fullName: profile.fullName,
            phone: profile.phone,
            email: profile.email,
            district: profile.district,
            upazila: profile.upazila,
            area: profile.area,
            fullAddress: profile.fullAddress,
            walletBalance: profile.walletBalance,
            savedMeasurements: safeJsonParse(profile.savedMeasurements, undefined),
          }
        : null,
      walletTransactions: walletRows,
      loyalty: loyaltyRow || { userId: user.id, pointsBalance: 0, lifetimePoints: 0, tierId: 'tier-bronze' },
      notifications: notifRows,
    };
  });
  return c.json(data);
});

bulkRouter.get('/admin-stats', async (c) => {
  if (!c.get('isAdmin')) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
  const db = c.get('db');
  const stats = await withCoalescedMicroCache('bulk:admin-stats', async () => {
    const [allOrders, allProducts, allUsers] = await Promise.all([
      db.select().from(orders),
      getAllProductsList(db),
      db.select({ id: users.id }).from(users),
    ]);

    const totalRevenue = allOrders
      .filter((o) => o.orderStatus !== 'Cancelled' && o.orderStatus !== 'Returned')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    const pendingOrders = allOrders.filter((o) => o.orderStatus === 'Pending').length;
    const lowStockProducts = allProducts.filter((p) => Number(p.stockYards) <= 15).length;

    return {
      success: true,
      stats: {
        totalOrders: allOrders.length,
        pendingOrders,
        totalRevenue,
        totalProducts: allProducts.length,
        lowStockProducts,
        totalCustomers: allUsers.length,
      },
    };
  });
  return c.json(stats);
});
