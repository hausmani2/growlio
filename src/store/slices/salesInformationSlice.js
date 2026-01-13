import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/axiosInterceptors';

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
            const response = await apiGet('/restaurant_v2/sales-information/');
            
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
            // If payload already has restaurant_id, use it; otherwise get from store/localStorage
            const state = get();
            const restaurantId = payload.restaurant_id || state.restaurantId || localStorage.getItem('restaurant_id');
            
            // Prepare final payload - preserve structure if restaurant_id is already in payload
            const finalPayload = payload.restaurant_id 
                ? payload 
                : {
                    restaurant_id: restaurantId ? Number(restaurantId) : null,
                    ...payload
                  };
            
            const response = await apiPost('/restaurant_v2/sales-information/', finalPayload);
            
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
            
            let errorMessage = 'Failed to create sales information. Please try again.';
            
            if (error.response?.data) {
                const errorData = error.response.data;
                
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
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
            // Get restaurant_id from store or localStorage
            const state = get();
            const restaurantId = state.restaurantId || localStorage.getItem('restaurant_id');
            
            // Prepare payload with restaurant_id
            const finalPayload = {
                restaurant_id: restaurantId ? Number(restaurantId) : null,
                ...payload
            };
            
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
            const response = await apiDelete('/restaurant_v2/sales-information/');
            
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
            // Get restaurant_id from store or localStorage
            const currentState = get();
            const restaurantId = currentState.restaurantId || localStorage.getItem('restaurant_id');
            
            if (!restaurantId) {
                throw new Error('Restaurant ID is required');
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
            const params = new URLSearchParams({
                restaurant_id: restaurantId.toString(),
                start_date: startDateStr,
                end_date: endDateStr
            });
            
            const response = await apiGet(`/restaurant_v2/sales-information/summary/?${params.toString()}`);
            
            set(() => ({ 
                salesInformationSummaryLoading: false, 
                salesInformationSummaryError: null,
                salesInformationSummary: response.data,
                salesInformationSummaryLastFetch: Date.now() // Store fetch timestamp
            }));
            
            return { 
                success: true, 
                data: response.data 
            };
        } catch (error) {
            console.error('❌ Error fetching sales information summary:', error);
            
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
    }
});

export default createSalesInformationSlice;

