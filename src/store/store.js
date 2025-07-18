import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import createAuthSlice from './slices/authSlice';
import createOnBoardingSlice from './slices/onBoarding';

const useStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...createAuthSlice(set, get),
        ...createOnBoardingSlice(),
      }),
      { name: 'app-store' }
    )
  )
);

export default useStore;