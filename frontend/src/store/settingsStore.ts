import { create } from 'zustand';
import type { StoreSettings } from '../types';
import { INITIAL_SETTINGS } from '../data/seedData';

interface SettingsState {
  settings: StoreSettings;
  setSettings: (settings: StoreSettings) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: INITIAL_SETTINGS,
  setSettings: (settings) => set({ settings }),
}));
