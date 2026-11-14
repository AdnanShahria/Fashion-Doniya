import { create } from 'zustand';

interface SysadmState {
  token: string | null;
  email: string | null;
  setSession: (token: string | null, email: string | null) => void;
}

export const useSysadmStore = create<SysadmState>((set) => ({
  token: null,
  email: null,
  setSession: (token, email) => set({ token, email }),
}));
