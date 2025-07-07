import { create } from 'zustand';
import { apiPost } from '../utils/axiosInterceptors';

// Auth slice
const createAuthSlice = (set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => set(() => ({ user, token, isAuthenticated: true })),
  logout: () => set(() => ({ user: null, token: null, isAuthenticated: false })),
  register: async (form) => {
    // Use Axios API utility for registration
    try {
      const res = await apiPost('/api/register', form);
      const data = res.data;
      set(() => ({ user: data.user, token: data.token, isAuthenticated: true }));
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(message);
    }
  },
});

// Example counter slice
const createCounterSlice = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
});

const useStore = create((set, get) => ({
  ...createAuthSlice(set, get),
  ...createCounterSlice(set, get),
}));

export default useStore; 