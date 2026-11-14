import { create } from 'zustand';

interface UIState {
  isCategoryDrawerOpen: boolean;
  setCategoryDrawerOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCategoryDrawerOpen: false,
  setCategoryDrawerOpen: (open) => set({ isCategoryDrawerOpen: open }),
}));
