import { apiGet } from '../../utils/axiosInterceptors';
import dayjs from 'dayjs';

const createDashboardSummarySlice = (set, get) => {
    return {
        name: 'dashboardSummary',
        dashboardSummaryData: null,
        loading: false,
        error: null,
        lastFetchedWeek: null,

        // Actions
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setDashboardSummaryData: (data) => set({ dashboardSummaryData: data }),

        // Fetch dashboard summary data
        fetchDashboardSummary: async (weekStart = null, restaurantId = null) => {
            try {
                set({ loading: true, error: null });
                
                // Get restaurant ID if not provided
                let targetRestaurantId = restaurantId;
                if (!targetRestaurantId) {
                    targetRestaurantId = await get().fetchRestaurantId();
                    if (!targetRestaurantId) {
                        throw new Error('Restaurant ID not found');
                    }
                }
                
                // Build URL with parameters
                let url = '/restaurant/dashboard-summary/';
                let params = { restaurant_id: targetRestaurantId };
                
                if (weekStart) {
                    params.week_start = weekStart;
                }
                
                // Convert params to query string
                const queryString = new URLSearchParams(params).toString();
                if (queryString) {
                    url += `?${queryString}`;
                }
                
                console.log('Fetching dashboard summary from:', url);
                
                const response = await apiGet(url);
                
                set({ 
                    dashboardSummaryData: response.data, 
                    loading: false,
                    lastFetchedWeek: weekStart || new Date().toISOString()
                });
                
                return response.data;
            } catch (error) {
                console.error('Error fetching dashboard summary:', error);
                set({ error: error.message, loading: false });
                throw error;
            }
        },

        // Check if data needs to be refreshed
        shouldRefreshSummaryData: (weekStart) => {
            const { lastFetchedWeek, dashboardSummaryData } = get();
            if (!dashboardSummaryData || !lastFetchedWeek) return true;
            
            // If weekStart is provided, check if it matches the last fetched week
            if (weekStart) {
                const lastFetchedWeekStr = dayjs(lastFetchedWeek).startOf('week').format('YYYY-MM-DD');
                const requestedWeekStr = dayjs(weekStart).startOf('week').format('YYYY-MM-DD');
                return lastFetchedWeekStr !== requestedWeekStr;
            }
            
            return false;
        },

        // Fetch summary data only if needed
        fetchDashboardSummaryIfNeeded: async (weekStart = null, restaurantId = null) => {
            const shouldRefresh = get().shouldRefreshSummaryData(weekStart);
            if (shouldRefresh) {
                return await get().fetchDashboardSummary(weekStart, restaurantId);
            }
            return get().dashboardSummaryData;
        },

        // Get dashboard summary data
        getDashboardSummaryData: () => {
            const { dashboardSummaryData } = get();
            return dashboardSummaryData;
        },

        // Get loading state
        getLoading: () => {
            const { loading } = get();
            return loading;
        },

        // Get error state
        getError: () => {
            const { error } = get();
            return error;
        },

        // Reset dashboard summary state
        resetDashboardSummary: () => {
            set(() => ({
                dashboardSummaryData: null,
                loading: false,
                error: null,
                lastFetchedWeek: null
            }));
        }
    };
};

export default createDashboardSummarySlice;
