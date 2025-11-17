import { apiGet, apiPost } from '../../utils/axiosInterceptors';
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
                        
                        targetRestaurantId = null;
                    }
                    
                    if (!targetRestaurantId) {
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
                
                // For annual mode, use start_year and end_year instead of start_date and end_date
                if (groupBy === 'annual') {
                    if (startDate) {
                        // Extract year from startDate (format: YYYY-MM-DD or dayjs object)
                        const startYear = typeof startDate === 'string' 
                            ? startDate.split('-')[0] 
                            : dayjs(startDate).year();
                        params.start_year = startYear;
                    }
                    
                    if (endDate) {
                        // Extract year from endDate (format: YYYY-MM-DD or dayjs object)
                        const endYear = typeof endDate === 'string' 
                            ? endDate.split('-')[0] 
                            : dayjs(endDate).year();
                        params.end_year = endYear;
                    }
                } else {
                    // For other modes, use start_date and end_date
                    if (startDate) {
                        params.start_date = startDate;
                    }
                    
                    if (endDate) {
                        params.end_date = endDate;
                    }
                }
                
                // Convert params to query string
                const queryString = new URLSearchParams(params).toString();
                if (queryString) {
                    url += `?${queryString}`;
                }
                
                    
                
                const response = await apiGet(url);
                
                // Automatically fetch average hourly rate when summary API is called
                let avgHourlyRateData = null;
                try {
                    // Use the start date as week_start for the average hourly rate API
                    const weekStartForAvgRate = startDate || dayjs().startOf('week').format('YYYY-MM-DD');
                    avgHourlyRateData = await get().fetchAverageHourlyRate(targetRestaurantId, weekStartForAvgRate);
                } catch (error) {
                    console.error('Error fetching average hourly rate during summary fetch:', error);
                }
                
                // Add average hourly rate data to the response data
                const responseData = {
                    ...response.data,
                    average_hourly_rate: avgHourlyRateData?.average_hourly_rate || null,
                    previous_week_average_hourly_rate: avgHourlyRateData?.previous_week_average_hourly_rate || null
                };
                
                set({ 
                    dashboardSummaryData: responseData, 
                    loading: false,
                    lastFetchedDateRange: `${startDate}-${endDate}`,
                    lastFetchedGroupBy: groupBy,
                    currentViewMode: groupBy === 'weekly' ? 'weekly' : 'daily'
                });
                
                return responseData;
            } catch (error) {
                console.error('Error fetching dashboard summary:', error);
                set({ error: error.message, loading: false });
                throw error;
            }
        },

        // Fetch profit/loss category summary for pie chart
        fetchProfitLossCategorySummary: async (startDate, endDate, restaurantId = null) => {
            try {
                // Resolve restaurant id if not provided
                let targetRestaurantId = restaurantId;
                if (!targetRestaurantId) {
                    try {
                        targetRestaurantId = await get().fetchRestaurantId();
                    } catch (e) {
                        targetRestaurantId = null;
                    }
                    if (!targetRestaurantId) return null;
                }

                let url = '/restaurant/profit-loss-summary/';
                const params = new URLSearchParams({
                    restaurant_id: targetRestaurantId,
                    start_date: startDate,
                    end_date: endDate,
                }).toString();
                url += `?${params}`;
                const response = await apiGet(url);
                // Return full payload so caller can access categories as well
                return response?.data || null;
            } catch (error) {
                console.error('Error fetching profit/loss category summary:', error);
                return null;
            }
        },

        // Fetch budget allocation summary (Total Budget breakdown) for Budget page pie chart
        fetchBudgetAllocationSummary: async (startDate, endDate, restaurantId = null) => {
            try {
                let targetRestaurantId = restaurantId;
                if (!targetRestaurantId) {
                    try {
                        targetRestaurantId = await get().fetchRestaurantId();
                    } catch (e) {
                        targetRestaurantId = null;
                    }
                    if (!targetRestaurantId) return null;
                }

                let url = '/restaurant/budget-allocation-summary/';
                const params = new URLSearchParams({
                    restaurant_id: targetRestaurantId,
                    start_date: startDate,
                    end_date: endDate,
                }).toString();
                url += `?${params}`;
                const response = await apiGet(url);
                return response?.data || null;
            } catch (error) {
                console.error('Error fetching budget allocation summary:', error);
                return null;
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
        
        // Fetch average hourly rate for a specific week
        fetchAverageHourlyRate: async (restaurantId = null, weekStart = null) => {
            try {
                // Get restaurant ID if not provided
                let targetRestaurantId = restaurantId;
                if (!targetRestaurantId) {
                    try {
                        targetRestaurantId = await get().fetchRestaurantId();
                    } catch (error) {
                        console.error('Error fetching restaurant ID for average hourly rate:', error);
                        targetRestaurantId = null;
                    }
                    
                    if (!targetRestaurantId) {
                        return null;
                    }
                }

                // Build URL with parameters
                let url = '/restaurant/avg-hourly-rate/';
                let params = { 
                    restaurant_id: targetRestaurantId
                };
                
                if (weekStart) {
                    params.week_start = weekStart;
                }
                
                // Convert params to query string
                const queryString = new URLSearchParams(params).toString();
                if (queryString) {
                    url += `?${queryString}`;
                }
                
                const response = await apiGet(url);
                
                // Return the full response data to access both current and previous week rates
                return response.data || null;
            } catch (error) {
                console.error('Error fetching average hourly rate:', error);
                return null;
            }
        },

        // Check if average hourly rate is already available for the current week
        hasAverageHourlyRateForWeek: (weekStart) => {
            const { dashboardSummaryData, lastFetchedDateRange } = get();
            
            if (!dashboardSummaryData?.average_hourly_rate || !lastFetchedDateRange || !weekStart) {
                return false;
            }
            
            // Check if the weekStart falls within the last fetched date range
            const startDate = dayjs(weekStart).format('YYYY-MM-DD');
            const endDate = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD');
            const currentRange = `${startDate}-${endDate}`;
            
            return lastFetchedDateRange === currentRange;
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
        },

        // Weekly Average API functions
        weeklyAverageData: null,
        weeklyAverageLoading: false,
        weeklyAverageError: null,

        // Check if 3 weeks of data exist for the selected date range
        checkWeeklyAverageData: async (restaurantId = null, startDate = null, endDate = null) => {
            try {
                set({ weeklyAverageLoading: true, weeklyAverageError: null });
                
                // Get restaurant ID if not provided
                let targetRestaurantId = restaurantId;
                if (!targetRestaurantId) {
                    try {
                        targetRestaurantId = await get().fetchRestaurantId();
                    } catch (error) {
                        console.error('Error fetching restaurant ID for weekly average check:', error);
                        targetRestaurantId = null;
                    }
                    
                    if (!targetRestaurantId) {
                        set({ weeklyAverageLoading: false, weeklyAverageError: 'No restaurant ID available' });
                        return null;
                    }
                }

                // Use current week if no dates provided
                let targetStartDate = startDate;
                let targetEndDate = endDate;
                
                if (!targetStartDate || !targetEndDate) {
                    const currentWeekStart = dayjs().startOf('week');
                    const currentWeekEnd = dayjs().endOf('week');
                    targetStartDate = currentWeekStart.format('YYYY-MM-DD');
                    targetEndDate = currentWeekEnd.format('YYYY-MM-DD');
                }

                // Build URL with parameters
                let url = '/restaurant/weekly-average/';
                let params = { 
                    restaurant_id: targetRestaurantId,
                    start_date: targetStartDate,
                    end_date: targetEndDate
                };
                
                // Convert params to query string
                const queryString = new URLSearchParams(params).toString();
                if (queryString) {
                    url += `?${queryString}`;
                }
                
                const response = await apiGet(url);
                
                set({ 
                    weeklyAverageData: response.data, 
                    weeklyAverageLoading: false 
                });
                
                return response.data;
            } catch (error) {
                console.error('Error checking weekly average data:', error);
                set({ 
                    weeklyAverageError: error.message, 
                    weeklyAverageLoading: false 
                });
                throw error;
            }
        },

        // Submit manual weekly average data
        submitWeeklyAverageData: async (restaurantId = null, startDate = null, endDate = null, manualData = {}) => {
            try {
                set({ weeklyAverageLoading: true, weeklyAverageError: null });
                
                // Get restaurant ID if not provided
                let targetRestaurantId = restaurantId;
                if (!targetRestaurantId) {
                    try {
                        targetRestaurantId = await get().fetchRestaurantId();
                    } catch (error) {
                        console.error('Error fetching restaurant ID for weekly average submission:', error);
                        targetRestaurantId = null;
                    }
                    
                    if (!targetRestaurantId) {
                        set({ weeklyAverageLoading: false, weeklyAverageError: 'No restaurant ID available' });
                        return null;
                    }
                }

                // Use current week if no dates provided
                let targetStartDate = startDate;
                let targetEndDate = endDate;
                
                if (!targetStartDate || !targetEndDate) {
                    const currentWeekStart = dayjs().startOf('week');
                    const currentWeekEnd = dayjs().endOf('week');
                    targetStartDate = currentWeekStart.format('YYYY-MM-DD');
                    targetEndDate = currentWeekEnd.format('YYYY-MM-DD');
                }

                // Prepare payload
                const payload = {
                    restaurant_id: targetRestaurantId,
                    start_date: targetStartDate,
                    end_date: targetEndDate,
                    ...manualData
                };

                const response = await apiPost('/restaurant/weekly-average/', payload);
                
                set({ 
                    weeklyAverageData: response.data, 
                    weeklyAverageLoading: false 
                });
                
                return response.data;
            } catch (error) {
                console.error('Error submitting weekly average data:', error);
                set({ 
                    weeklyAverageError: error.message, 
                    weeklyAverageLoading: false 
                });
                throw error;
            }
        },

        // Get weekly average loading state
        getWeeklyAverageLoading: () => {
            const { weeklyAverageLoading } = get();
            return weeklyAverageLoading;
        },

        // Get weekly average error state
        getWeeklyAverageError: () => {
            const { weeklyAverageError } = get();
            return weeklyAverageError;
        },

        // Get weekly average data
        getWeeklyAverageData: () => {
            const { weeklyAverageData } = get();
            return weeklyAverageData;
        },

        // Reset weekly average state
        resetWeeklyAverage: () => {
            set(() => ({
                weeklyAverageData: null,
                weeklyAverageLoading: false,
                weeklyAverageError: null
            }));
        }
    };
};

export default createDashboardSummarySlice;
