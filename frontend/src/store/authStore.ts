import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomerUser } from '../types';
import { AUTH_STORAGE_KEY } from '../services/api';

interface AuthState {
  token: string | null;
  user: CustomerUser | null;
  setAuth: (user: CustomerUser | null, token?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (user, token) =>
        set((state) => ({
          user,
          token: token !== undefined ? token : state.token,
        })),
      logout: () => set({ user: null, token: null }),
    }),
    { name: AUTH_STORAGE_KEY }
  )
);
