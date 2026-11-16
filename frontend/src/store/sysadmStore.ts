import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SysadmState {
  token: string | null;
  email: string | null;
  setSession: (token: string | null, email: string | null) => void;
}

export const useSysadmStore = create<SysadmState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      setSession: (token, email) => set({ token, email }),
    }),
    {
      name: 'fd_sysadm_session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
