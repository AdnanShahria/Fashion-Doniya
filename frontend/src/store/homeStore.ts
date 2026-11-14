import { create } from 'zustand';
import type {
  Product,
  Category,
  FabricCollectionsDatabaseState,
  CategoryMeasurementGuideRecord,
  MeasurementOutfitRule,
  AdditionalClothingItem,
} from '../types';
import { api, cachedGet } from '../services/api';
import { StorageService } from '../services/storageService';

interface BulkHomeResponse {
  success: boolean;
  products?: Product[];
  categories?: Category[];
  settings?: Record<string, unknown>;
  fabricCollections?: FabricCollectionsDatabaseState;
  measurements?: {
    guides?: CategoryMeasurementGuideRecord[];
    rules?: MeasurementOutfitRule[];
    additionalItems?: AdditionalClothingItem[];
  };
  tierCapabilities?: Record<string, boolean>;
}

interface HomeState {
  products: Product[];
  categories: Category[];
  tierCapabilities: Record<string, boolean>;
  isLoading: boolean;
  hasFetched: boolean;
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  fetchHomeData: () => Promise<BulkHomeResponse | null>;
}

export const useHomeStore = create<HomeState>((set) => ({
  products: [],
  categories: [],
  tierCapabilities: {},
  isLoading: false,
  hasFetched: false,
  setProducts: (products) => set({ products }),
  setCategories: (categories) => set({ categories }),
  fetchHomeData: async () => {
    set({ isLoading: true });
    try {
      const data = await cachedGet<BulkHomeResponse>('/bulk/home', 30_000);
      if (data?.success) {
        if (Array.isArray(data.products)) {
          StorageService.setProducts(data.products);
          set({ products: data.products });
        }
        if (Array.isArray(data.categories)) {
          StorageService.setCategories(data.categories);
          set({ categories: data.categories });
        }
        if (data.settings) {
          StorageService.setSettings(data.settings as never);
        }
        if (data.fabricCollections) {
          StorageService.setFabricCollectionsState(data.fabricCollections);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('fabric-collections-updated'));
          }
        }
        if (data.measurements) {
          if (Array.isArray(data.measurements.guides)) {
            StorageService.setCategoryMeasurementGuides(data.measurements.guides);
          }
          if (Array.isArray(data.measurements.rules)) {
            StorageService.setMeasurementRules(data.measurements.rules);
          }
          if (Array.isArray(data.measurements.additionalItems)) {
            StorageService.setAdditionalItems(data.measurements.additionalItems);
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('fabric-measurements-updated'));
          }
        }
        if (data.tierCapabilities) {
          set({ tierCapabilities: data.tierCapabilities });
        }
        set({ hasFetched: true, isLoading: false });
        return data;
      }
    } catch {
      // Fallback to localStorage seed
    }
    set({ isLoading: false });
    return null;
  },
}));

export async function triggerBulkRefresh() {
  const res = await api.get<BulkHomeResponse>('/bulk/home');
  return res.data;
}
