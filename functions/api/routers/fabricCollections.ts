import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AppEnv } from '../types';
import {
  fabricSections,
  fabricCategories,
  fabricDesignSettings,
  fabricSnapshots,
} from '../../../backend/server/db/schemas/index';
import type {
  FabricCollectionType,
  FabricSectionRecord,
  FabricCategoryRecord,
  FabricCategoryDesignSettingsRecord,
  FabricCollectionSnapshot,
} from '../../../frontend/src/types/index';
import { createInitialFabricCollectionsState } from '../../../frontend/src/data/seedData';
import { getFabricCollectionsState } from '../utils/mappers';
import { invalidateHomeCache } from '../utils/cache';
import { clearBulkMicroCache } from './bulk';

export const fabricCollectionsRouter = new Hono<AppEnv>();
export const adminFabricCollectionsRouter = new Hono<AppEnv>();

fabricCollectionsRouter.get('/', async (c) => {
  const db = c.get('db');
  const data = await getFabricCollectionsState(db);
  return c.json({ success: true, data });
});

function isValidCollectionType(val: string): val is FabricCollectionType {
  return val === '3.5_bahar' || val === '2.5_bahar';
}

adminFabricCollectionsRouter.put('/:collectionType/draft', async (c) => {
  const collectionType = c.req.param('collectionType');
  if (!isValidCollectionType(collectionType)) {
    return c.json(
      { success: false, message: 'Invalid collection_type. Must be 3.5_bahar or 2.5_bahar.' },
      400
    );
  }

  const body = (await c.req.json().catch(() => ({}))) as {
    section?: FabricSectionRecord;
    categories?: FabricCategoryRecord[];
    designSettings?: FabricCategoryDesignSettingsRecord;
  };
  const db = c.get('db');
  const currentState = await getFabricCollectionsState(db);
  const currentDraft = currentState.drafts[collectionType];
  const now = new Date().toISOString();

  const nextDraft: FabricCollectionSnapshot = {
    section: body.section
      ? { ...body.section, collection_type: collectionType, updatedAt: now }
      : currentDraft.section,
    categories: Array.isArray(body.categories)
      ? body.categories
          .map((cat, idx) => ({
            ...cat,
            collection_type: collectionType,
            order: typeof cat.order === 'number' ? cat.order : idx + 1,
            updatedAt: now,
          }))
          .sort((a, b) => a.order - b.order)
      : currentDraft.categories,
    designSettings: body.designSettings
      ? { ...body.designSettings, collection_type: collectionType, updatedAt: now }
      : currentDraft.designSettings,
    savedAt: now,
  };

  await db
    .insert(fabricSnapshots)
    .values({
      collectionType,
      draftSnapshot: JSON.stringify(nextDraft),
      previousPublishedSnapshot: currentState.previous_published[collectionType]
        ? JSON.stringify(currentState.previous_published[collectionType])
        : null,
      hasUnpushedDraft: true,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: fabricSnapshots.collectionType,
      set: {
        draftSnapshot: JSON.stringify(nextDraft),
        hasUnpushedDraft: true,
        updatedAt: now,
      },
    });

  const data = await getFabricCollectionsState(db);
  return c.json({ success: true, collectionType, draft: nextDraft, data });
});

async function writeLiveCollection(
  db: ReturnType<AppEnv['Variables']['db']['select']> extends never ? never : AppEnv['Variables']['db'],
  collectionType: FabricCollectionType,
  section: FabricSectionRecord,
  cats: FabricCategoryRecord[],
  design: FabricCategoryDesignSettingsRecord,
  now: string
) {
  await db
    .insert(fabricSections)
    .values({
      id: section.id,
      collectionType,
      eyebrow: section.eyebrow,
      heading: section.heading,
      subtitle: section.subtitle,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: fabricSections.id,
      set: {
        eyebrow: section.eyebrow,
        heading: section.heading,
        subtitle: section.subtitle,
        updatedAt: now,
      },
    });

  await db.delete(fabricCategories).where(eq(fabricCategories.collectionType, collectionType));
  for (let idx = 0; idx < cats.length; idx++) {
    const fc = cats[idx];
    await db.insert(fabricCategories).values({
      id: fc.id,
      collectionType,
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
      order: typeof fc.order === 'number' ? fc.order : idx + 1,
      isEnabled: Boolean(fc.isEnabled),
      updatedAt: now,
    });
  }

  await db
    .insert(fabricDesignSettings)
    .values({
      collectionType,
      data: JSON.stringify(design),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: fabricDesignSettings.collectionType,
      set: { data: JSON.stringify(design), updatedAt: now },
    });
}

adminFabricCollectionsRouter.post('/:collectionType/publish', async (c) => {
  const collectionType = c.req.param('collectionType');
  if (!isValidCollectionType(collectionType)) {
    return c.json(
      { success: false, message: 'Invalid collection_type. Must be 3.5_bahar or 2.5_bahar.' },
      400
    );
  }

  const body = (await c.req.json().catch(() => ({}))) as {
    section?: FabricSectionRecord;
    categories?: FabricCategoryRecord[];
    designSettings?: FabricCategoryDesignSettingsRecord;
  };
  const db = c.get('db');
  const currentState = await getFabricCollectionsState(db);
  const now = new Date().toISOString();

  const previousLiveSnapshot: FabricCollectionSnapshot = {
    section: currentState.fabric_sections[collectionType],
    categories: currentState.fabric_categories[collectionType],
    designSettings: currentState.fabric_category_design_settings[collectionType],
    savedAt: now,
  };

  const draftSource = currentState.drafts[collectionType];
  const publishedSection: FabricSectionRecord = body.section
    ? { ...body.section, collection_type: collectionType, updatedAt: now }
    : { ...draftSource.section, collection_type: collectionType, updatedAt: now };

  const publishedCategories: FabricCategoryRecord[] = (
    Array.isArray(body.categories) ? body.categories : draftSource.categories
  )
    .map((cat, idx) => ({
      ...cat,
      collection_type: collectionType,
      order: typeof cat.order === 'number' ? cat.order : idx + 1,
      updatedAt: now,
    }))
    .sort((a, b) => a.order - b.order);

  const publishedDesign: FabricCategoryDesignSettingsRecord = body.designSettings
    ? { ...body.designSettings, collection_type: collectionType, updatedAt: now }
    : { ...draftSource.designSettings, collection_type: collectionType, updatedAt: now };

  await writeLiveCollection(
    db,
    collectionType,
    publishedSection,
    publishedCategories,
    publishedDesign,
    now
  );

  const syncedDraft: FabricCollectionSnapshot = {
    section: publishedSection,
    categories: publishedCategories,
    designSettings: publishedDesign,
    savedAt: now,
  };

  await db
    .insert(fabricSnapshots)
    .values({
      collectionType,
      draftSnapshot: JSON.stringify(syncedDraft),
      previousPublishedSnapshot: JSON.stringify(previousLiveSnapshot),
      hasUnpushedDraft: false,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: fabricSnapshots.collectionType,
      set: {
        draftSnapshot: JSON.stringify(syncedDraft),
        previousPublishedSnapshot: JSON.stringify(previousLiveSnapshot),
        hasUnpushedDraft: false,
        updatedAt: now,
      },
    });

  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  const data = await getFabricCollectionsState(db);
  return c.json({ success: true, collectionType, data });
});

adminFabricCollectionsRouter.post('/:collectionType/revert', async (c) => {
  const collectionType = c.req.param('collectionType');
  if (!isValidCollectionType(collectionType)) {
    return c.json(
      { success: false, message: 'Invalid collection_type. Must be 3.5_bahar or 2.5_bahar.' },
      400
    );
  }

  const body = (await c.req.json().catch(() => ({}))) as { resetToFactory?: boolean };
  const db = c.get('db');
  const currentState = await getFabricCollectionsState(db);
  const defaults = createInitialFabricCollectionsState();
  const now = new Date().toISOString();

  const prev = currentState.previous_published[collectionType];
  const target: FabricCollectionSnapshot =
    !body.resetToFactory && prev
      ? prev
      : {
          section: defaults.fabric_sections[collectionType],
          categories: defaults.fabric_categories[collectionType],
          designSettings: defaults.fabric_category_design_settings[collectionType],
          savedAt: now,
        };

  await writeLiveCollection(
    db,
    collectionType,
    target.section,
    target.categories,
    target.designSettings,
    now
  );

  await db
    .insert(fabricSnapshots)
    .values({
      collectionType,
      draftSnapshot: JSON.stringify({ ...target, savedAt: now }),
      previousPublishedSnapshot: prev ? JSON.stringify(prev) : null,
      hasUnpushedDraft: false,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: fabricSnapshots.collectionType,
      set: {
        draftSnapshot: JSON.stringify({ ...target, savedAt: now }),
        hasUnpushedDraft: false,
        updatedAt: now,
      },
    });

  await invalidateHomeCache(c.env);
  clearBulkMicroCache();

  const data = await getFabricCollectionsState(db);
  return c.json({ success: true, collectionType, data });
});
