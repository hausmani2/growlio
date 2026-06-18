import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/axiosInterceptors';

const SALES_INFO_CACHE_MS = 30000;
const salesInfoFetchCacheByKey = new Map();

const buildSalesInfoFetchKey = (restaurantId, locationId) =>
    `${restaurantId || 'none'}-${locationId || 'none'}`;

const getSalesInfoCacheEntry = (key) => {
    if (!salesInfoFetchCacheByKey.has(key)) {
        salesInfoFetchCacheByKey.set(key, {
            promise: null,
            fetchedAt: 0,
            noAccess: false,
        });
    }
    return salesInfoFetchCacheByKey.get(key);
};

const resetSalesInfoFetchCache = () => {
    salesInfoFetchCacheByKey.clear();
};

/** Build POST/PUT body for /restaurant_v2/sales-information/ with stable restaurant + location IDs. */
const buildSalesInformationPayload = async (get, rawPayload = {}) => {
    const state = get();
    const nested = rawPayload.data;
    const source =
        nested && typeof nested === 'object' && !Array.isArray(nested) ? nested : rawPayload;

    const salesData = {
        sales: Number(source.sales) || 0,
        cogs: Number(source.cogs) || 0,
        labour: Number(source.labour) || 0,
        expenses: Number(source.expenses) || 0,
    };

    let restaurantId = null;
    let locationId = state.selectedLocationId || null;

    // Authoritative IDs come from onboarding API — not stale localStorage
    if (typeof state.getRestaurantOnboarding === 'function') {
        const onboardingResult = await state.getRestaurantOnboarding(
            true,
            locationId || undefined
        );
        const restaurants =
            onboardingResult?.data?.restaurants || onboardingResult?.restaurants || [];
        if (restaurants.length > 0) {
            let match = null;
            if (locationId != null) {
                match = restaurants.find(
                    (r) => Number(r.location_id) === Number(locationId)
                );
            }
            match = match || restaurants[0];
            restaurantId = match?.restaurant_id ?? null;
            if (match?.location_id) {
                locationId = match.location_id;
                if (typeof state.setSelectedLocationId === 'function') {
                    state.setSelectedLocationId(locationId);
                }
            }
        }
    }

    if (!restaurantId) {
        const fallback = state.restaurantId || localStorage.getItem('restaurant_id');
        if (fallback && Number(fallback) > 0) {
            restaurantId = Number(fallback);
        }
    }

    if (typeof state.fetchLocations === 'function' && restaurantId) {
        try {
            const locations = await state.fetchLocations(restaurantId, true);
            if (Array.isArray(locations) && locations.length > 0) {
                const validLocation =
                    locations.find((loc) => Number(loc.id) === Number(locationId)) || locations[0];
                locationId = validLocation?.id ?? null;
                if (locationId && typeof state.setSelectedLocationId === 'function') {
                    state.setSelectedLocationId(locationId);
                }
            }
        } catch {
            // keep location from onboarding when locations API is unavailable
        }
    }

    const parsedRestaurantId = Number(restaurantId);
    if (!Number.isFinite(parsedRestaurantId) || parsedRestaurantId <= 0) {
        throw new Error('Restaurant not found. Please complete restaurant setup first.');
    }

    const payload = {
        restaurant_id: parsedRestaurantId,
        data: salesData,
    };

    if (locationId) {
        payload.location_id = Number(locationId);
    }

    return payload;
};

const createSalesInformationSlice = (set, get) => ({
    name: 'salesInformation',
    
    // Sales information state
    salesInformationLoading: false,
    salesInformationError: null,
    salesInformationData: null,
    salesInformationSummary: null,
    salesInformationSummaryLoading: false,
    salesInformationSummaryError: null,
    salesInformationSummaryLastFetch: null, // Track when summary was last fetched
    activeReportCardRange: null,
    // Daily performance data
    dailyPerformanceData: null,
    dailyPerformanceLoading: false,
    dailyPerformanceError: null,
    // Daily performance data
    dailyPerformanceData: null,
    dailyPerformanceLoading: false,
    dailyPerformanceError: null,
    
    // Actions
    setSalesInformationLoading: (loading) => set({ salesInformationLoading: loading }),
    setSalesInformationError: (error) => set({ salesInformationError: error }),
    
    // GET: Fetch sales information
    getSalesInformation: async () => {
        set(() => ({ 
            salesInformationLoading: true, 
            salesInformationError: null 
        }));
        
        try {
            const restaurantId = get().restaurantId || localStorage.getItem('restaurant_id');
            const queryParams = await get().withLocationParams(
                restaurantId ? { restaurant: restaurantId } : {}
            );
            const qs = new URLSearchParams(
                Object.entries(queryParams).reduce((acc, [k, v]) => {
                    if (v != null && v !== '') acc[k] = String(v);
                    return acc;
                }, {})
            ).toString();
            const url = `/restaurant_v2/sales-information/${qs ? `?${qs}` : ''}`;
            const response = await apiGet(url);
            
            // API returns array directly: [{ id, restaurant_id, sales, expenses, labour, cogs, ... }]
            const data = Array.isArray(response.data) ? response.data : response.data;
            
            set(() => ({ 
                salesInformationLoading: false, 
                salesInformationError: null,
                salesInformationData: data
            }));
            
            return { 
                success: true, 
                data: data 
            };
        } catch (error) {
            console.error('❌ Error fetching sales information:', error);
            
            let errorMessage = 'Failed to fetch sales information. Please try again.';
            
            if (error.response?.data) {
                const errorData = error.response.data;
                
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({ 
                salesInformationLoading: false, 
                salesInformationError: errorMessage,
                salesInformationData: null
            }));
            
            return { 
                success: false, 
                error: errorMessage 
            };
        }
    },
    
    // POST: Create sales information
    createSalesInformation: async (payload) => {
        set(() => ({ 
            salesInformationLoading: true, 
            salesInformationError: null 
        }));
        
        try {
            const finalPayload = await buildSalesInformationPayload(get, payload);
            let response;
            try {
                response = await apiPost('/restaurant_v2/sales-information/', finalPayload);
            } catch (postError) {
                // Initial profitability flow may not be location-scoped yet
                if (postError.response?.status === 403 && finalPayload.location_id) {
                    const { location_id: _omit, ...withoutLocation } = finalPayload;
                    response = await apiPost('/restaurant_v2/sales-information/', withoutLocation);
                } else {
                    throw postError;
                }
            }
            
            set(() => ({ 
                salesInformationLoading: false, 
                salesInformationError: null,
                salesInformationData: response.data
            }));
            
            return { 
                success: true, 
                data: response.data 
            };
        } catch (error) {
            console.error('❌ Error creating sales information:', error);

            let errorMessage = error.message || 'Failed to create sales information. Please try again.';
            
            if (error.response?.data) {
                const errorData = error.response.data;
                
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (Array.isArray(errorData) && errorData.length > 0) {
                    errorMessage = String(errorData[0]);
                } else if (typeof errorData === 'object') {
                    // Handle field-specific errors
                    const fieldErrors = Object.values(errorData).flat();
                    if (fieldErrors.length > 0) {
                        errorMessage = Array.isArray(fieldErrors[0]) ? fieldErrors[0][0] : fieldErrors[0];
                    }
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({ 
                salesInformationLoading: false, 
                salesInformationError: errorMessage
            }));
            
            return { 
                success: false, 
                error: errorMessage 
            };
        }
    },
    
    // PUT: Update sales information
    updateSalesInformation: async (payload) => {
        set(() => ({ 
            salesInformationLoading: true, 
            salesInformationError: null 
        }));
        
        try {
            const finalPayload = await buildSalesInformationPayload(get, payload);
            const response = await apiPut('/restaurant_v2/sales-information/', finalPayload);
            
            set(() => ({ 
                salesInformationLoading: false, 
                salesInformationError: null,
                salesInformationData: response.data
            }));
            
            return { 
                success: true, 
                data: response.data 
            };
        } catch (error) {
            console.error('❌ Error updating sales information:', error);
            
            let errorMessage = 'Failed to update sales information. Please try again.';
            
            if (error.response?.data) {
                const errorData = error.response.data;
                
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (Array.isArray(errorData) && errorData.length > 0) {
                    errorMessage = String(errorData[0]);
                } else if (typeof errorData === 'object') {
                    // Handle field-specific errors
                    const fieldErrors = Object.values(errorData).flat();
                    if (fieldErrors.length > 0) {
                        errorMessage = Array.isArray(fieldErrors[0]) ? fieldErrors[0][0] : fieldErrors[0];
                    }
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({ 
                salesInformationLoading: false, 
                salesInformationError: errorMessage
            }));
            
            return { 
                success: false, 
                error: errorMessage 
            };
        }
    },
    
    // DELETE: Delete sales information
    deleteSalesInformation: async () => {
        set(() => ({ 
            salesInformationLoading: true, 
            salesInformationError: null 
        }));
        
        try {
            const deleteUrl = await get().appendLocationToUrl('/restaurant_v2/sales-information/');
            const response = await apiDelete(deleteUrl);
            
            set(() => ({ 
                salesInformationLoading: false, 
                salesInformationError: null,
                salesInformationData: null
            }));
            
            return { 
                success: true, 
                data: response.data 
            };
        } catch (error) {
            console.error('❌ Error deleting sales information:', error);
            
            let errorMessage = 'Failed to delete sales information. Please try again.';
            
            if (error.response?.data) {
                const errorData = error.response.data;
                
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({ 
                salesInformationLoading: false, 
                salesInformationError: errorMessage
            }));
            
            return { 
                success: false, 
                error: errorMessage 
            };
        }
    },
    
    // GET: Fetch sales information summary (for report card)
    // Accepts optional date parameters for dynamic date selection
    getSalesInformationSummary: async (startDate = null, endDate = null) => {
        set(() => ({ 
            salesInformationSummaryLoading: true, 
            salesInformationSummaryError: null 
        }));
        
        try {
            // Get restaurant_id and restaurant data from store
            const currentState = get();
            const restaurantId = currentState.restaurantId || localStorage.getItem('restaurant_id');
            const restaurantOnboardingData = currentState.restaurantOnboardingData;
            
            // CRITICAL: Check if restaurant exists
            // This API should only be called when a restaurant exists
            let hasRestaurant = false;
            
            if (restaurantOnboardingData?.restaurants) {
                const restaurants = Array.isArray(restaurantOnboardingData.restaurants) 
                    ? restaurantOnboardingData.restaurants 
                    : [];
                
                // Check if any restaurant exists
                hasRestaurant = restaurants.length > 0;
            } else if (restaurantId) {
                // Fallback: if restaurant_id exists, assume restaurant exists
                hasRestaurant = true;
            }
            
            // If no restaurant exists, block the API call
            if (!hasRestaurant || !restaurantId) {
                const errorMsg = 'No restaurant found. Please complete onboarding first.';
                set(() => ({ 
                    salesInformationSummaryLoading: false, 
                    salesInformationSummaryError: errorMsg 
                }));
                return { 
                    success: false, 
                    error: errorMsg 
                };
            }
            
            // Use provided dates or calculate previous month's start and end dates
            let startDateStr, endDateStr;
            
            if (startDate && endDate) {
                // Format provided dates (dayjs objects or strings)
                const formatDate = (date) => {
                    if (typeof date === 'string') {
                        return date.split('T')[0]; // Extract YYYY-MM-DD from ISO string
                    }
                    // Handle dayjs objects
                    const d = date.format ? date : new Date(date);
                    const year = d.format ? d.year() : d.getFullYear();
                    const month = d.format ? d.month() + 1 : d.getMonth() + 1;
                    const day = d.format ? d.date() : d.getDate();
                    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                };
                
                startDateStr = formatDate(startDate);
                endDateStr = formatDate(endDate);
            } else {
                // Default to previous month if no dates provided
            const today = new Date();
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
                startDateStr = formatDate(lastMonth);
                endDateStr = formatDate(lastMonthEnd);
            }
            
            // Build query parameters
            const params = new URLSearchParams(
                await get().withLocationParams({
                    restaurant_id: restaurantId.toString(),
                    start_date: startDateStr,
                    end_date: endDateStr,
                })
            );
            
            const apiUrl = `/restaurant_v2/sales-information/summary/?${params.toString()}`;
            
            
            const response = await apiGet(apiUrl);
            
            
            set(() => ({ 
                salesInformationSummaryLoading: false, 
                salesInformationSummaryError: null,
                salesInformationSummary: response.data,
                salesInformationSummaryLastFetch: Date.now(),
                activeReportCardRange: {
                    start: startDateStr,
                    end: endDateStr,
                },
            }));
            
            return { 
                success: true, 
                data: response.data 
            };
        } catch (error) {
            console.error('❌ [getSalesInformationSummary] Error fetching sales information summary:', error);
            console.error('❌ [getSalesInformationSummary] Error details:', {
                message: error.message,
                response: error.response,
                status: error.response?.status,
                data: error.response?.data,
                config: error.config
            });
            
            let errorMessage = 'Failed to fetch sales information summary. Please try again.';
            
            if (error.response?.data) {
                const errorData = error.response.data;
                
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({ 
                salesInformationSummaryLoading: false, 
                salesInformationSummaryError: errorMessage
            }));
            
            return { 
                success: false, 
                error: errorMessage 
            };
        }
    },
    
    // Clear sales information error
    clearSalesInformationError: () => set({ salesInformationError: null }),
    
    // Clear all sales information state
    clearSalesInformation: () => {
        set({
            salesInformationLoading: false,
            salesInformationError: null,
            salesInformationData: null
        });
    },

    // GET: Fetch daily sales information summary for performance card
    getDailyPerformanceData: async (startDate, endDate) => {
        set(() => ({ 
            dailyPerformanceLoading: true, 
            dailyPerformanceError: null 
        }));
        
        try {
            // Get restaurant_id from store or localStorage
            const currentState = get();
            const restaurantId = currentState.restaurantId || localStorage.getItem('restaurant_id');
            
            if (!restaurantId) {
                throw new Error('Restaurant ID is required');
            }
            
            // Format dates (handle dayjs objects or strings)
            const formatDate = (date) => {
                if (!date) return null;
                if (typeof date === 'string') {
                    return date.split('T')[0]; // Extract YYYY-MM-DD from ISO string
                }
                // Handle dayjs objects
                if (date.format) {
                    return date.format('YYYY-MM-DD');
                }
                // Handle Date objects
                const d = new Date(date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
            const startDateStr = formatDate(startDate);
            const endDateStr = formatDate(endDate);
            
            if (!startDateStr || !endDateStr) {
                throw new Error('Start date and end date are required');
            }
            
            // Build query parameters
            const params = new URLSearchParams(
                await get().withLocationParams({
                    restaurant_id: restaurantId.toString(),
                    start_date: startDateStr,
                    end_date: endDateStr,
                })
            );
            
            const response = await apiGet(`/restaurant_v2/sales-information-daily/summary/?${params.toString()}`);
            
            // Handle response structure
            const responseData = response.data?.data || response.data || [];
            
            set(() => ({ 
                dailyPerformanceData: responseData,
                dailyPerformanceLoading: false,
                dailyPerformanceError: null
            }));
            
            return { 
                success: true, 
                data: responseData 
            };
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 
                                error?.message || 
                                'Failed to fetch daily performance data';
            
            console.error('❌ [salesInformationSlice] Error fetching daily performance data:', error);
            
            set(() => ({ 
                dailyPerformanceData: null,
                dailyPerformanceLoading: false,
                dailyPerformanceError: errorMessage
            }));
            
            return { 
                success: false, 
                error: errorMessage 
            };
        }
    }
});

export default createSalesInformationSlice;

