import { create } from 'zustand';

const usePosStore = create((set) => ({
  isSyncing: false,
  syncStatus: 'idle',
  activeRestaurantId: null,
  lastCompletedAt: null,
  syncError: null,
  setSyncing: (isSyncing) => set({ isSyncing }),
  setStatus: (syncStatus) => set({ syncStatus }),
  setActiveRestaurantId: (activeRestaurantId) => set({ activeRestaurantId }),
  setSyncError: (syncError) => set({ syncError }),
  markCompleted: () =>
    set({
      isSyncing: false,
      syncStatus: 'completed',
      syncError: null,
      lastCompletedAt: new Date().toISOString(),
    }),
  resetSyncState: () =>
    set({
      isSyncing: false,
      syncStatus: 'idle',
      activeRestaurantId: null,
      syncError: null,
    }),
}));

export default usePosStore;
