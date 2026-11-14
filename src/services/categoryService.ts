import {
  Category,
  FabricCollectionType,
  FabricSectionRecord,
  FabricCategoryRecord,
  FabricCategoryDesignSettingsRecord,
  FabricCollectionSnapshot,
  FabricCollectionsDatabaseState
} from '../types';
import { StorageService } from './storageService';
import { createInitialFabricCollectionsState } from '../data/seedData';

const ADMIN_TOKEN = 'fd-admin-secure-2026';

function notifyListeners() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fabric-collections-updated'));
  }
}

export const categoryService = {
  // General Categories (synced with backend /api/categories)
  getAllCategories(): Category[] {
    StorageService.initialize();
    return StorageService.getCategories().sort((a, b) => a.order - b.order);
  },

  getCategoriesByWidth(width: 'all' | '2.5' | '3.5'): Category[] {
    return this.getAllCategories().filter(
      (c) => (c.isActive !== false) && (c.fabricWidth === 'all' || c.fabricWidth === width)
    );
  },

  async syncGeneralCategoriesFromBackend(): Promise<Category[]> {
    StorageService.initialize();
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const json = await res.json();
        if (json?.success && Array.isArray(json.categories)) {
          StorageService.setCategories(json.categories);
          return json.categories;
        }
      }
    } catch {
      // Offline fallback
    }
    return this.getAllCategories();
  },

  saveCategory(category: Category): Category[] {
    const list = this.getAllCategories();
    const idx = list.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      list[idx] = category;
    } else {
      list.push({ ...category, isActive: category.isActive !== false });
    }
    list.sort((a, b) => a.order - b.order);
    StorageService.setCategories(list);

    fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_TOKEN
      },
      body: JSON.stringify({ category })
    }).catch(() => {});

    return list;
  },

  reorderCategories(categories: Category[]): Category[] {
    const ordered = categories.map((c, idx) => ({ ...c, order: idx + 1 }));
    StorageService.setCategories(ordered);

    fetch('/api/admin/categories-reorder', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': ADMIN_TOKEN
      },
      body: JSON.stringify({ categories: ordered })
    }).catch(() => {});

    return ordered;
  },

  deleteCategory(id: string): Category[] {
    const list = this.getAllCategories().filter((c) => c.id !== id);
    StorageService.setCategories(list);

    fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': ADMIN_TOKEN }
    }).catch(() => {});

    return list;
  },

  // ==========================================================================
  // Fabric Collections Database Service (3.5_bahar & 2.5_bahar)
  // Tables: fabric_sections, fabric_categories, fabric_category_design_settings
  // ==========================================================================
  getDatabaseState(): FabricCollectionsDatabaseState {
    StorageService.initialize();
    return StorageService.getFabricCollectionsState();
  },

  async syncFromBackend(): Promise<FabricCollectionsDatabaseState> {
    StorageService.initialize();
    try {
      const res = await fetch('/api/fabric-collections');
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data?.fabric_sections) {
          StorageService.setFabricCollectionsState(json.data);
          notifyListeners();
          return json.data as FabricCollectionsDatabaseState;
        }
      }
    } catch {
      // Fallback to localStorage state when offline
    }
    return StorageService.getFabricCollectionsState();
  },

  getPublishedCollection(collectionType: FabricCollectionType): {
    section: FabricSectionRecord;
    categories: FabricCategoryRecord[];
    designSettings: FabricCategoryDesignSettingsRecord;
  } {
    const state = this.getDatabaseState();
    const defaults = createInitialFabricCollectionsState();

    const section =
      state.fabric_sections?.[collectionType] || defaults.fabric_sections[collectionType];
    const categories = (
      state.fabric_categories?.[collectionType] || defaults.fabric_categories[collectionType]
    )
      .slice()
      .sort((a, b) => a.order - b.order);
    const designSettings =
      state.fabric_category_design_settings?.[collectionType] ||
      defaults.fabric_category_design_settings[collectionType];

    return {
      section,
      categories,
      designSettings
    };
  },

  getDraftCollection(collectionType: FabricCollectionType): {
    section: FabricSectionRecord;
    categories: FabricCategoryRecord[];
    designSettings: FabricCategoryDesignSettingsRecord;
    savedAt: string;
    hasUnpushedDraft: boolean;
    hasPreviousPublished: boolean;
  } {
    const state = this.getDatabaseState();
    const published = this.getPublishedCollection(collectionType);
    const draft = state.drafts?.[collectionType];

    return {
      section: draft?.section
        ? JSON.parse(JSON.stringify(draft.section))
        : JSON.parse(JSON.stringify(published.section)),
      categories: (draft?.categories
        ? JSON.parse(JSON.stringify(draft.categories))
        : JSON.parse(JSON.stringify(published.categories))
      ).sort((a: FabricCategoryRecord, b: FabricCategoryRecord) => a.order - b.order),
      designSettings: draft?.designSettings
        ? JSON.parse(JSON.stringify(draft.designSettings))
        : JSON.parse(JSON.stringify(published.designSettings)),
      savedAt: draft?.savedAt || published.section.updatedAt,
      hasUnpushedDraft: Boolean(state.has_unpushed_draft?.[collectionType]),
      hasPreviousPublished: Boolean(state.previous_published?.[collectionType])
    };
  },

  async saveDraft(
    collectionType: FabricCollectionType,
    payload: {
      section: FabricSectionRecord;
      categories: FabricCategoryRecord[];
      designSettings: FabricCategoryDesignSettingsRecord;
    }
  ): Promise<FabricCollectionsDatabaseState> {
    const state = this.getDatabaseState();
    const now = new Date().toISOString();

    const orderedCategories = payload.categories
      .map((cat, idx) => ({
        ...cat,
        collection_type: collectionType,
        order: idx + 1,
        updatedAt: now
      }))
      .sort((a, b) => a.order - b.order);

    const nextDraft: FabricCollectionSnapshot = {
      section: {
        ...payload.section,
        collection_type: collectionType,
        updatedAt: now
      },
      categories: orderedCategories,
      designSettings: {
        ...payload.designSettings,
        collection_type: collectionType,
        updatedAt: now
      },
      savedAt: now
    };

    state.drafts[collectionType] = nextDraft;
    state.has_unpushed_draft[collectionType] = true;
    StorageService.setFabricCollectionsState(state);
    notifyListeners();

    try {
      const res = await fetch(`/api/admin/fabric-collections/${collectionType}/draft`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': ADMIN_TOKEN
        },
        body: JSON.stringify(nextDraft)
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          StorageService.setFabricCollectionsState(json.data);
          notifyListeners();
          return json.data;
        }
      }
    } catch {
      // Saved in localStorage fallback
    }

    return state;
  },

  async publishCollection(
    collectionType: FabricCollectionType,
    payload?: {
      section: FabricSectionRecord;
      categories: FabricCategoryRecord[];
      designSettings: FabricCategoryDesignSettingsRecord;
    }
  ): Promise<FabricCollectionsDatabaseState> {
    const state = this.getDatabaseState();
    const now = new Date().toISOString();

    // Save previous published snapshot for 1-click revert
    state.previous_published[collectionType] = {
      section: JSON.parse(JSON.stringify(state.fabric_sections[collectionType])),
      categories: JSON.parse(JSON.stringify(state.fabric_categories[collectionType])),
      designSettings: JSON.parse(
        JSON.stringify(state.fabric_category_design_settings[collectionType])
      ),
      savedAt: now
    };

    const source = payload || state.drafts[collectionType];
    const orderedCategories = source.categories
      .map((cat, idx) => ({
        ...cat,
        collection_type: collectionType,
        order: idx + 1,
        updatedAt: now
      }))
      .sort((a, b) => a.order - b.order);

    const nextSection: FabricSectionRecord = {
      ...source.section,
      collection_type: collectionType,
      updatedAt: now
    };

    const nextDesign: FabricCategoryDesignSettingsRecord = {
      ...source.designSettings,
      collection_type: collectionType,
      updatedAt: now
    };

    state.fabric_sections[collectionType] = JSON.parse(JSON.stringify(nextSection));
    state.fabric_categories[collectionType] = JSON.parse(JSON.stringify(orderedCategories));
    state.fabric_category_design_settings[collectionType] = JSON.parse(JSON.stringify(nextDesign));

    state.drafts[collectionType] = {
      section: JSON.parse(JSON.stringify(nextSection)),
      categories: JSON.parse(JSON.stringify(orderedCategories)),
      designSettings: JSON.parse(JSON.stringify(nextDesign)),
      savedAt: now
    };
    state.has_unpushed_draft[collectionType] = false;

    StorageService.setFabricCollectionsState(state);
    notifyListeners();

    try {
      const res = await fetch(`/api/admin/fabric-collections/${collectionType}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': ADMIN_TOKEN
        },
        body: JSON.stringify({
          section: nextSection,
          categories: orderedCategories,
          designSettings: nextDesign
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          StorageService.setFabricCollectionsState(json.data);
          notifyListeners();
          return json.data;
        }
      }
    } catch {
      // Published in localStorage fallback
    }

    return state;
  },

  async revertCollection(
    collectionType: FabricCollectionType,
    resetToFactory = false
  ): Promise<FabricCollectionsDatabaseState> {
    const state = this.getDatabaseState();
    const defaults = createInitialFabricCollectionsState();
    const prev = state.previous_published?.[collectionType];
    const now = new Date().toISOString();

    const targetSnapshot: FabricCollectionSnapshot =
      !resetToFactory && prev
        ? prev
        : {
            section: defaults.fabric_sections[collectionType],
            categories: defaults.fabric_categories[collectionType],
            designSettings: defaults.fabric_category_design_settings[collectionType],
            savedAt: now
          };

    state.fabric_sections[collectionType] = JSON.parse(JSON.stringify(targetSnapshot.section));
    state.fabric_categories[collectionType] = JSON.parse(JSON.stringify(targetSnapshot.categories));
    state.fabric_category_design_settings[collectionType] = JSON.parse(
      JSON.stringify(targetSnapshot.designSettings)
    );

    state.drafts[collectionType] = {
      section: JSON.parse(JSON.stringify(targetSnapshot.section)),
      categories: JSON.parse(JSON.stringify(targetSnapshot.categories)),
      designSettings: JSON.parse(JSON.stringify(targetSnapshot.designSettings)),
      savedAt: now
    };
    state.has_unpushed_draft[collectionType] = false;

    StorageService.setFabricCollectionsState(state);
    notifyListeners();

    try {
      const res = await fetch(`/api/admin/fabric-collections/${collectionType}/revert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': ADMIN_TOKEN
        },
        body: JSON.stringify({ resetToFactory })
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          StorageService.setFabricCollectionsState(json.data);
          notifyListeners();
          return json.data;
        }
      }
    } catch {
      // Reverted in localStorage fallback
    }

    return state;
  }
};
