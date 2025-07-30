import { apiGet, apiPost } from "../../utils/axiosInterceptors";

const createDashboardSlice = (set, get) => {
    return {
        name: 'dashboard',
        dashboardData: null,
        loading: false,
        error: null,
        restaurantId: null,

        // Actions
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setDashboardData: (data) => set({ dashboardData: data }),

        // Fetch dashboard data
        fetchDashboardData: async (weekStart = null) => {
            try {
                set({ loading: true, error: null });
                
                // Get restaurant ID
                const restaurantId = await get().fetchRestaurantId();
                if (!restaurantId) {
                    throw new Error('Restaurant ID not found');
                }
                
                let url = '/restaurant/dashboard/';
                let params = { restaurant_id: restaurantId };
                
                if (weekStart) {
                    params.week_start = weekStart;
                }
                
                // Convert params to query string
                const queryString = new URLSearchParams(params).toString();
                if (queryString) {
                    url += `?${queryString}`;
                }
                
                const response = await apiGet(url);
                set({ dashboardData: response.data, loading: false });
                return response.data;
            } catch (error) {
                set({ error: error.message, loading: false });
                throw error;
            }
        },

        // Get sales performance data
        getSalesPerformance: () => {
            const { dashboardData } = get();
            return dashboardData?.["Sales Performance"] || null;
        },

        // Get COGS performance data
        getCogsPerformance: () => {
            const { dashboardData } = get();
            return dashboardData?.["COGS Performance"] || null;
        },

        // Get labor performance data
        getLaborPerformance: () => {
            const { dashboardData } = get();
            return dashboardData?.["Labor Performance"] || null;
        },

        // Get profit after COGS & labor data
        getProfitAfterCogsLabor: () => {
            const { dashboardData } = get();
            return dashboardData?.Profit || null;
        },

        // Get fixed expenses data
        getFixedExpenses: () => {
            const { dashboardData } = get();
            return dashboardData?.["Expenses and Net Profit"] || null;
        },

        // Get net profit data
        getNetProfit: () => {
            const { dashboardData } = get();
            return dashboardData?.["Expenses and Net Profit"] || null;
        },

        // Get daily entries
        getDailyEntries: () => {
            const { dashboardData } = get();
            return dashboardData?.daily_entries || [];
        },


        // Save dashboard data
        saveDashboardData: async (dashboardData) => {
            try {
                set({ loading: true, error: null });
                
                // Check if this is the new payload format (has section_data)
                const isNewPayloadFormat = dashboardData.section_data && dashboardData.section;
                
                if (isNewPayloadFormat) {
                    // Handle new payload format
                    // Get restaurant ID for new payload format
                    const restaurantId = await get().fetchRestaurantId();
                    
                    if (!restaurantId) {
                        throw new Error('Restaurant ID not found');
                    }
                    
                    // Add restaurant_id to the new payload format
                    const payloadWithRestaurantId = {
                        ...dashboardData,
                        restaurant_id: restaurantId
                    };
                    
                    const response = await apiPost('/restaurant/dashboard/', payloadWithRestaurantId);
                    set({ loading: false });
                    return response.data;
                }
                
                // Handle old payload format (backward compatibility)
                // Get restaurant ID using the fetchRestaurantId method
                const restaurantId = await get().fetchRestaurantId();

                if (!restaurantId) {
                    throw new Error('Restaurant ID not found');
                }

                // First, get existing data to merge with new data
                let existingData = {};
                try {
                    const weekStart = dashboardData.week_start || dashboardData.month;
                    const existingResponse = await apiGet(`/restaurant/dashboard/?restaurant_id=${restaurantId}&week_start=${weekStart}`);
                    if (existingResponse.data) {
                        existingData = existingResponse.data;
                    }
                } catch (fetchError) {
                    // If no existing data, that's fine - we'll create new
                    console.log('No existing data found, creating new dashboard entry:', fetchError.message);
                }

                // Check if this is a sales-only payload (has sales_budget at root level)
                const isSalesOnlyPayload = 'sales_budget' in dashboardData && 
                                          !('Sales Performance' in dashboardData);

                let mergedData;
                
                if (isSalesOnlyPayload) {
                    // For sales-only payload, use the simplified structure
                    mergedData = {
                        ...dashboardData,
                        restaurant_id: restaurantId
                    };
                } else {
                    // For full dashboard payload, merge with existing data and add default sections
                    mergedData = {
                        ...existingData,
                        ...dashboardData,
                        restaurant_id: restaurantId
                    };

                    // Ensure all required sections have at least default values
                    const defaultSections = {
                        "Sales Performance": {
                            sales_budget: "0.00",
                            actual_sales_in_store: "0.00",
                            actual_sales_app_online: "0.00",
                            actual_sales_door_dash: "0.00",
                            net_sales_actual: "0.00",
                            daily_tickets: 0,
                            average_daily_ticket: "0.00"
                        },
                        "COGS Performance": {
                            cogs_budget: "0.00",
                            cogs_actual: "0.00",
                            weekly_remaining_cog: "0.00"
                        },
                        "Labor Performance": {
                            labor_hours_budget: "0.00",
                            labor_hours_actual: "0.00",
                            budgeted_labor_dollars: "0.00",
                            actual_labor_dollars: "0.00",
                            daily_labor_rate: "0.00"
                        },
                        "Profit After COGS & Labor": {
                            third_party_fees: "0.00",
                            profit_after_cogs_labor: "0.00",
                            daily_variable_profit_percent: "0.00",
                            weekly_variable_profit_percent: "0.00"
                        },
                        "Fixed Expenses": {
                            fixed_weekly_expenses: "0.00"
                        },
                        "Net Profit": {
                            net_profit: "0.00",
                            net_profit_margin: "0.00"
                        }
                    };

                    // Ensure all sections exist with at least default values
                    Object.keys(defaultSections).forEach(sectionKey => {
                        if (!mergedData[sectionKey]) {
                            mergedData[sectionKey] = defaultSections[sectionKey];
                        } else {
                            // Merge existing section data with defaults
                            mergedData[sectionKey] = {
                                ...defaultSections[sectionKey],
                                ...mergedData[sectionKey]
                            };
                        }
                    });
                }

                // Handle daily entries - merge existing with new
                if (!mergedData.daily_entries) {
                    mergedData.daily_entries = [];
                }

                // If new data has daily entries, merge them
                if (dashboardData.daily_entries && dashboardData.daily_entries.length > 0) {
                    dashboardData.daily_entries.forEach(newEntry => {
                        const existingEntryIndex = mergedData.daily_entries.findIndex(
                            existing => existing.date === newEntry.date
                        );

                        if (isSalesOnlyPayload) {
                            // For sales-only payload, use simplified structure
                            const salesOnlyEntry = {
                                date: newEntry.date,
                                day: newEntry.day,
                                "Sales Performance": newEntry["Sales Performance"] || {
                                    status: true,
                                    data: {
                                        sales_budget: "0.00",
                                        actual_sales_in_store: "0.00",
                                        actual_sales_app_online: "0.00",
                                        actual_sales_door_dash: "0.00",
                                        net_sales_actual: "0.00",
                                        daily_tickets: 0,
                                        average_daily_ticket: "0.00"
                                    }
                                }
                            };

                            if (existingEntryIndex >= 0) {
                                // Update existing entry for sales-only
                                mergedData.daily_entries[existingEntryIndex] = {
                                    ...mergedData.daily_entries[existingEntryIndex],
                                    ...salesOnlyEntry
                                };
                            } else {
                                // Add new entry for sales-only
                                mergedData.daily_entries.push(salesOnlyEntry);
                            }
                        } else {
                            // For full dashboard payload, use complete structure
                            const defaultDailyEntry = {
                                date: newEntry.date,
                                day: newEntry.day,
                                "Sales Performance": {
                                    sales_budget: "0.00",
                                    actual_sales_in_store: "0.00",
                                    actual_sales_app_online: "0.00",
                                    actual_sales_door_dash: "0.00",
                                    net_sales_actual: "0.00",
                                    daily_tickets: 0,
                                    average_daily_ticket: "0.00"
                                },
                               
                            };

                            if (existingEntryIndex >= 0) {
                                // Update existing entry - merge with defaults and new data
                                const existingEntry = mergedData.daily_entries[existingEntryIndex];
                                mergedData.daily_entries[existingEntryIndex] = {
                                    ...defaultDailyEntry,
                                    ...existingEntry,
                                    ...newEntry,
                                    // Ensure all sections are properly merged
                                    "Sales Performance": {
                                        ...defaultDailyEntry["Sales Performance"],
                                        ...existingEntry["Sales Performance"],
                                        ...newEntry["Sales Performance"]
                                    },
                                    "COGS Performance": {
                                        ...defaultDailyEntry["COGS Performance"],
                                        ...existingEntry["COGS Performance"],
                                        ...newEntry["COGS Performance"]
                                    },
                                    "Labor Performance": {
                                        ...defaultDailyEntry["Labor Performance"],
                                        ...existingEntry["Labor Performance"],
                                        ...newEntry["Labor Performance"]
                                    },
                                    "Profit After COGS & Labor": {
                                        ...defaultDailyEntry["Profit After COGS & Labor"],
                                        ...existingEntry["Profit After COGS & Labor"],
                                        ...newEntry["Profit After COGS & Labor"]
                                    },
                                    "Fixed Expenses": {
                                        ...defaultDailyEntry["Fixed Expenses"],
                                        ...existingEntry["Fixed Expenses"],
                                        ...newEntry["Fixed Expenses"]
                                    },
                                    "Net Profit": {
                                        ...defaultDailyEntry["Net Profit"],
                                        ...existingEntry["Net Profit"],
                                        ...newEntry["Net Profit"]
                                    }
                                };
                            } else {
                                // Add new entry - merge with defaults
                                mergedData.daily_entries.push({
                                    ...defaultDailyEntry,
                                    ...newEntry,
                                    // Ensure all sections are properly merged
                                    "Sales Performance": {
                                        ...defaultDailyEntry["Sales Performance"],
                                        ...newEntry["Sales Performance"]
                                    },
                                    "COGS Performance": {
                                        ...defaultDailyEntry["COGS Performance"],
                                        ...newEntry["COGS Performance"]
                                    },
                                    "Labor Performance": {
                                        ...defaultDailyEntry["Labor Performance"],
                                        ...newEntry["Labor Performance"]
                                    },
                                    "Profit After COGS & Labor": {
                                        ...defaultDailyEntry["Profit After COGS & Labor"],
                                        ...newEntry["Profit After COGS & Labor"]
                                    },
                                    "Fixed Expenses": {
                                        ...defaultDailyEntry["Fixed Expenses"],
                                        ...newEntry["Fixed Expenses"]
                                    },
                                    "Net Profit": {
                                        ...defaultDailyEntry["Net Profit"],
                                        ...newEntry["Net Profit"]
                                    }
                                });
                            }
                        }
                    });
                }

                const response = await apiPost('/restaurant/dashboard/', mergedData);
                set({ loading: false });
                return response.data;
            } catch (error) {
                set({ error: error.message, loading: false });
                throw error;
            }
        },

        // Get restaurant ID
        getRestaurantId: () => {
            const { restaurantId } = get();
            return restaurantId;
        },

        // Fetch restaurant ID from onboarding data or localStorage
        fetchRestaurantId: async () => {
            const state = get();
            const storeRestaurantId = state.restaurantId;
            
            if (storeRestaurantId) {
                return storeRestaurantId;
            }
            
            // Try to get from onboarding slice
            const onboardingRestaurantId = state.getRestaurantIdWithFallback?.();
            if (onboardingRestaurantId) {
                set({ restaurantId: onboardingRestaurantId });
                return onboardingRestaurantId;
            }
            
            // Try localStorage as last resort
            const localRestaurantId = localStorage.getItem('restaurant_id');
            if (localRestaurantId) {
                set({ restaurantId: localRestaurantId });
                return localRestaurantId;
            }
            
            return null;
        },

        // Set restaurant ID
        setRestaurantId: (id) => set({ restaurantId: id }),
        
        // Reset dashboard state (for logout)
        resetDashboard: () => {
            set(() => ({
                dashboardData: null,
                loading: false,
                error: null,
                restaurantId: null
            }));
            console.log('🗑️ Dashboard state reset');
        }
    }
}

export default createDashboardSlice;``