import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
      // Theme State (Dark/Light)
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      // Eye Button State (Visible/Hidden Balances)
      isHidden: false,
      toggleHidden: () => set((state) => ({ isHidden: !state.isHidden })),

      // Auth State Handled purely by Firebase, no need to store full user here unless needed
      userId: null,
      setUserId: (userId) => set({ userId }),
    }),
    {
      name: 'finance-app-storage',
      partialize: (state) => ({ theme: state.theme, isHidden: state.isHidden }), // only persist these
    }
  )
);

export default useStore;
