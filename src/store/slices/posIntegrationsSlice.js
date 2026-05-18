import { apiGet } from '../../utils/axiosInterceptors';

const createPosIntegrationsSlice = (set, get) => ({
  posIntegrations: [],
  posIntegrationsLoading: false,
  posIntegrationsError: null,

  fetchPosIntegrations: async () => {
    set({ posIntegrationsLoading: true, posIntegrationsError: null });
    try {
      const res = await apiGet('/admin_access/pos-integrations/');
      const payload = res?.data ?? {};
      const data = payload?.data ?? (Array.isArray(payload) ? payload : []);
      set({
        posIntegrations: Array.isArray(data) ? data : [],
        posIntegrationsLoading: false,
      });
      return data;
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load POS integrations';
      set({ posIntegrationsError: message, posIntegrationsLoading: false });
      throw error;
    }
  },

  clearPosIntegrationsError: () => set({ posIntegrationsError: null }),
});

export default createPosIntegrationsSlice;
