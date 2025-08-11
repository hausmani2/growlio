import { apiGet } from '../../utils/axiosInterceptors';
import dayjs from 'dayjs';

const createDashboardSummarySlice = (set, get) => {
    return {
        name: 'dashboardSummary',
        dashboardSummaryData: null,
        loading: false,
        error: null,
        lastFetchedWeek: null,
        lastFetchedMonth: null,
        currentViewMode: 'weekly', // Add view mode tracking

        // Actions
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setDashboardSummaryData: (data) => set({ dashboardSummaryData: data }),
        setViewMode: (mode) => set({ currentViewMode: mode }),
        getViewMode: () => get().currentViewMode,

        // Fetch dashboard summary data (weekly)
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
                
                console.log('Fetching weekly dashboard summary from:', url);
                
                const response = await apiGet(url);
                console.log('Dashboard summary API response:', response);
                console.log('Response data:', response.data);
                
                set({ 
                    dashboardSummaryData: response.data, 
                    loading: false,
                    lastFetchedWeek: weekStart || new Date().toISOString(),
                    currentViewMode: 'weekly'
                });
                
                return response.data;
            } catch (error) {
                console.error('Error fetching dashboard summary:', error);
                set({ error: error.message, loading: false });
                throw error;
            }
        },

        // Fetch monthly dashboard summary data
        fetchMonthlyDashboardSummary: async (year = null, month = null, restaurantId = null) => {
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
                
                // Use current year and month if not provided
                const currentDate = dayjs();
                const targetYear = year || currentDate.year();
                const targetMonth = month || currentDate.month() + 1;
                
                // Format month as "YYYY-MM" for the API
                const monthParam = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;
                
                // Build URL with parameters
                let url = '/restaurant/dashboard-summary/';
                let params = { 
                    restaurant_id: targetRestaurantId,
                    month: monthParam
                };
                
                // Convert params to query string
                const queryString = new URLSearchParams(params).toString();
                if (queryString) {
                    url += `?${queryString}`;
                }
                
                console.log('Fetching monthly dashboard summary from:', url);
                
                const response = await apiGet(url);
                console.log('Monthly dashboard summary API response:', response);
                console.log('Response data:', response.data);
                
                set({ 
                    dashboardSummaryData: response.data, 
                    loading: false,
                    lastFetchedMonth: monthParam,
                    currentViewMode: 'monthly'
                });
                
                return response.data;
            } catch (error) {
                console.error('Error fetching monthly dashboard summary:', error);
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

        // Check if monthly data needs to be refreshed
        shouldRefreshMonthlyData: (year, month) => {
            const { lastFetchedMonth, dashboardSummaryData, currentViewMode } = get();
            if (!dashboardSummaryData || currentViewMode !== 'monthly') return true;
            
            const requestedMonth = `${year}-${month.toString().padStart(2, '0')}`;
            return lastFetchedMonth !== requestedMonth;
        },

        // Fetch summary data only if needed
        fetchDashboardSummaryIfNeeded: async (weekStart = null, restaurantId = null) => {
            const shouldRefresh = get().shouldRefreshSummaryData(weekStart);
            if (shouldRefresh) {
                return await get().fetchDashboardSummary(weekStart, restaurantId);
            }
            return get().dashboardSummaryData;
        },

        // Fetch monthly summary data only if needed
        fetchMonthlyDashboardSummaryIfNeeded: async (year = null, month = null, restaurantId = null) => {
            const shouldRefresh = get().shouldRefreshMonthlyData(year, month);
            if (shouldRefresh) {
                return await get().fetchMonthlyDashboardSummary(year, month, restaurantId);
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
                lastFetchedWeek: null,
                lastFetchedMonth: null,
                currentViewMode: 'weekly'
            }));
        }
    };
};

export default createDashboardSummarySlice;
