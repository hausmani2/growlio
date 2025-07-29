import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import createAuthSlice from './slices/authSlice';
import createOnBoardingSlice from './slices/onBoardingSlice';
import createDashboardSlice from './slices/dashboardSlice';

const useStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...createAuthSlice(set, get),
        ...createOnBoardingSlice(set, get),
        ...createDashboardSlice(set, get),
      }),
      { name: 'growlio-store' }
    )
  )
);

export default useStore;