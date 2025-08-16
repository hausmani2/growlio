import { apiGet } from '../../utils/axiosInterceptors';
import dayjs from 'dayjs';

const createDashboardSummarySlice = (set, get) => {
    return {
        name: 'dashboardSummary',
        dashboardSummaryData: null,
        loading: false,
        error: null,
        lastFetchedDateRange: null,
        lastFetchedGroupBy: null,
        currentViewMode: 'weekly', // Add view mode tracking

        // Actions
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setDashboardSummaryData: (data) => set({ dashboardSummaryData: data }),
        setViewMode: (mode) => set({ currentViewMode: mode }),
        getViewMode: () => get().currentViewMode,

        // Fetch dashboard summary data with new API format
        fetchDashboardSummary: async (startDate = null, endDate = null, groupBy = 'daily', restaurantId = null) => {
            try {
                set({ loading: true, error: null });
                
                // Get restaurant ID if not provided
                let targetRestaurantId = restaurantId;
                if (!targetRestaurantId) {
                    try {
                        targetRestaurantId = await get().fetchRestaurantId();
                    } catch (error) {
                        console.log('⚠️ Error fetching restaurant ID:', error);
                        targetRestaurantId = null;
                    }
                    
                    if (!targetRestaurantId) {
                        console.log('ℹ️ No restaurant ID available - user needs to complete onboarding first');
                        set({ loading: false, error: null });
                        return null;
                    }
                }
                
                // Build URL with new parameters
                let url = '/restaurant/dashboard-summary/';
                let params = { 
                    restaurant_id: targetRestaurantId,
                    group_by: groupBy
                };
                
                if (startDate) {
                    params.start_date = startDate;
                }
                
                if (endDate) {
                    params.end_date = endDate;
                }
                
                // Convert params to query string
                const queryString = new URLSearchParams(params).toString();
                if (queryString) {
                    url += `?${queryString}`;
                }
                
                console.log('Fetching dashboard summary from:', url);
                console.log('Parameters:', params);
                
                const response = await apiGet(url);
                console.log('Dashboard summary API response:', response);
                console.log('Response data:', response.data);
                
                set({ 
                    dashboardSummaryData: response.data, 
                    loading: false,
                    lastFetchedDateRange: `${startDate}-${endDate}`,
                    lastFetchedGroupBy: groupBy,
                    currentViewMode: groupBy === 'weekly' ? 'weekly' : 'daily'
                });
                
                return response.data;
            } catch (error) {
                console.error('Error fetching dashboard summary:', error);
                set({ error: error.message, loading: false });
                throw error;
            }
        },

        // Legacy method for backward compatibility (converts week_start to start_date/end_date)
        fetchDashboardSummaryLegacy: async (weekStart = null, restaurantId = null) => {
            if (!weekStart) {
                return await get().fetchDashboardSummary(null, null, 'daily', restaurantId);
            }
            
            // Convert week_start to start_date and end_date
            const startDate = dayjs(weekStart).format('YYYY-MM-DD');
            const endDate = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD');
            
            return await get().fetchDashboardSummary(startDate, endDate, 'daily', restaurantId);
        },

        // Fetch weekly data (Sunday to Saturday)
        fetchWeeklyDashboardSummary: async (startDate = null, restaurantId = null) => {
            if (!startDate) {
                // Use current week if no start date provided
                const currentWeekStart = dayjs().startOf('week').format('YYYY-MM-DD');
                const currentWeekEnd = dayjs().endOf('week').format('YYYY-MM-DD');
                return await get().fetchDashboardSummary(currentWeekStart, currentWeekEnd, 'daily', restaurantId);
            }
            
            // Calculate end date (7 days from start date)
            const endDate = dayjs(startDate).add(6, 'day').format('YYYY-MM-DD');
            
            return await get().fetchDashboardSummary(startDate, endDate, 'daily', restaurantId);
        },

        // Fetch monthly data
        fetchMonthlyDashboardSummary: async (year = null, month = null, restaurantId = null) => {
            // Use current year and month if not provided
            const currentDate = dayjs();
            const targetYear = year || currentDate.year();
            const targetMonth = month || currentDate.month() + 1;
            
            // Calculate start and end dates for the month
            const startDate = dayjs(`${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`).format('YYYY-MM-DD');
            const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD');
            
            return await get().fetchDashboardSummary(startDate, endDate, 'daily', restaurantId);
        },

        // Check if data needs to be refreshed
        shouldRefreshSummaryData: (startDate, endDate, groupBy = 'daily') => {
            const { lastFetchedDateRange, lastFetchedGroupBy, dashboardSummaryData } = get();
            if (!dashboardSummaryData || !lastFetchedDateRange || !lastFetchedGroupBy) return true;
            
            const currentRange = `${startDate}-${endDate}`;
            return lastFetchedDateRange !== currentRange || lastFetchedGroupBy !== groupBy;
        },

        // Check if weekly data needs to be refreshed
        shouldRefreshWeeklyData: (startDate) => {
            if (!startDate) return true;
            
            const endDate = dayjs(startDate).add(6, 'day').format('YYYY-MM-DD');
            return get().shouldRefreshSummaryData(startDate, endDate, 'daily');
        },

        // Check if monthly data needs to be refreshed
        shouldRefreshMonthlyData: (year, month) => {
            const currentDate = dayjs();
            const targetYear = year || currentDate.year();
            const targetMonth = month || currentDate.month() + 1;
            
            const startDate = dayjs(`${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`).format('YYYY-MM-DD');
            const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD');
            
            return get().shouldRefreshSummaryData(startDate, endDate, 'daily');
        },

        // Fetch summary data only if needed
        fetchDashboardSummaryIfNeeded: async (startDate = null, endDate = null, groupBy = 'daily', restaurantId = null) => {
            const shouldRefresh = get().shouldRefreshSummaryData(startDate, endDate, groupBy);
            if (shouldRefresh) {
                return await get().fetchDashboardSummary(startDate, endDate, groupBy, restaurantId);
            }
            return get().dashboardSummaryData;
        },

        // Fetch weekly summary data only if needed
        fetchWeeklyDashboardSummaryIfNeeded: async (startDate = null, restaurantId = null) => {
            const shouldRefresh = get().shouldRefreshWeeklyData(startDate);
            if (shouldRefresh) {
                return await get().fetchWeeklyDashboardSummary(startDate, restaurantId);
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
                lastFetchedDateRange: null,
                lastFetchedGroupBy: null,
                currentViewMode: 'weekly'
            }));
        },
        
        // Clear all dashboard summary state (for logout)
        clearDashboardSummary: () => {
            set(() => ({
                dashboardSummaryData: null,
                loading: false,
                error: null,
                lastFetchedDateRange: null,
                lastFetchedGroupBy: null,
                currentViewMode: 'weekly'
            }));
        }
    };
};

export default createDashboardSummarySlice;
