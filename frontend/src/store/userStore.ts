import { create } from 'zustand';

interface UserState {
  walletBalance: number;
  loyaltyPoints: number;
  unreadNotifications: number;
  setUserExtras: (data: Partial<Omit<UserState, 'setUserExtras'>>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  walletBalance: 0,
  loyaltyPoints: 0,
  unreadNotifications: 0,
  setUserExtras: (data) => set((state) => ({ ...state, ...data })),
}));
