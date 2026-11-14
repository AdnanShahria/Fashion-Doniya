import { Hono } from 'hono';
import type { AppEnv } from '../types';
import {
  sizeGuides,
  measurementRules,
  additionalItems,
} from '../../../backend/server/db/schemas/index';
import type {
  CategoryMeasurementGuideRecord,
  MeasurementOutfitRule,
  AdditionalClothingItem,
} from '../../../frontend/src/types/index';
import { getMeasurementsState } from '../utils/mappers';
import { invalidateHomeCache } from '../utils/cache';
import { clearBulkMicroCache } from './bulk';

export const measurementsRouter = new Hono<AppEnv>();
export const adminMeasurementsRouter = new Hono<AppEnv>();

measurementsRouter.get('/size-guides', async (c) => {
  const db = c.get('db');
  const state = await getMeasurementsState(db);
  return c.json({ success: true, ...state });
});

adminMeasurementsRouter.put('/size-guides', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    guide?: CategoryMeasurementGuideRecord;
  };
  const guide = body?.guide;
  if (!guide || !guide.id) {
    return c.json({ success: false, message: 'সাইজ গাইড ডাটা আবশ্যক।' }, 400);
  }

  const db = c.get('db');
  const now = new Date().toISOString();
  await db
    .insert(sizeGuides)
    .values({
      id: guide.id,
      categoryName: guide.categoryName,
      collectionType: guide.fabricWidth ? `${guide.fabricWidth}_bahar` : null,
      data: JSON.stringify({ ...guide, updatedAt: now }),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: sizeGuides.id,
      set: {
        categoryName: guide.categoryName,
        collectionType: guide.fabricWidth ? `${guide.fabricWidth}_bahar` : null,
        data: JSON.stringify({ ...guide, updatedAt: now }),
        updatedAt: now,
      },
    });

  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  const state = await getMeasurementsState(db);
  return c.json({ success: true, guides: state.guides });
});

adminMeasurementsRouter.put('/measurement-rules', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    rules?: MeasurementOutfitRule[];
  };
  if (!Array.isArray(body?.rules)) {
    return c.json({ success: false, message: 'মেজারমেন্ট রুলস তালিকা আবশ্যক।' }, 400);
  }

  const db = c.get('db');
  const now = new Date().toISOString();
  await db.delete(measurementRules);
  for (let idx = 0; idx < body.rules.length; idx++) {
    const r = body.rules[idx];
    await db.insert(measurementRules).values({
      id: r.id,
      fabricWidth: r.fabricWidth,
      name: r.name,
      baseYards: Number(r.baseYards || 2.5),
      data: JSON.stringify(r),
      order: idx + 1,
      isActive: r.isActive !== false,
      updatedAt: now,
    });
  }

  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  const state = await getMeasurementsState(db);
  return c.json({ success: true, rules: state.rules });
});

adminMeasurementsRouter.put('/additional-items', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    additionalItems?: AdditionalClothingItem[];
  };
  if (!Array.isArray(body?.additionalItems)) {
    return c.json({ success: false, message: 'অ্যাডিশনাল আইটেম তালিকা আবশ্যক।' }, 400);
  }

  const db = c.get('db');
  const now = new Date().toISOString();
  await db.delete(additionalItems);
  for (let idx = 0; idx < body.additionalItems.length; idx++) {
    const item = body.additionalItems[idx];
    await db.insert(additionalItems).values({
      id: item.id,
      fabricWidth: item.fabricWidth,
      name: item.name,
      yardsPerUnit: Number(item.yardsPerUnit || 0.5),
      data: JSON.stringify(item),
      order: idx + 1,
      isActive: item.isActive !== false,
      updatedAt: now,
    });
  }

  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  const state = await getMeasurementsState(db);
  return c.json({ success: true, additionalItems: state.additionalItems });
});
