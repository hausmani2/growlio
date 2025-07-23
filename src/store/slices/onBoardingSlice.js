import { apiPost, apiGet, apiPut } from '../../utils/axiosInterceptors';

const createOnBoardingSlice = (set, get) => ({
    name: 'onBoarding',
    user: null,
    isOnBoardingCompleted: false,
    loading: false,
    error: null,
    onboardingData: null,
    
    // Complete onboarding data structure
    completeOnboardingData: {
        restaurant_id: null,
        "Basic Information": {
            status: false,
            data: {
                restaurant_name: "",
                number_of_locations: 1,
                restaurant_type: "",
                menu_type: "",
                locations: [
                    {
                        location_name: "",
                        address_1: "",
                        country: "",
                        state: "",
                        zip_code: "",
                        sqft: "",
                        is_franchise: false
                    }
                ]
            }
        },
        "Labour Information": {
            status: false,
            data: {
                goal: "",
                needs_attention: "",
                danger: "",
                avg_hourly_rate: 0,
                labor_record_method: "daily_hours_costs",
                daily_ticket_count: false,
                forward_prev_week_rate: false
            }
        },
        "Food Cost Details": {
            status: false,
            data: {
                cogs_goal: "",
                use_third_party_delivery: false,
                delivery_days: []
            }
        },
        "Sales Channels": {
            status: false,
            data: {
                in_store: true,
                online: false,
                from_app: false,
                third_party: false
            }
        },
        "Expense": {
            status: false,
            data: {
                fixed_costs: [],
                variable_costs: []
            }
        }
    },
    
    setIsOnBoardingCompleted: (isOnBoardingCompleted) => set({ isOnBoardingCompleted }),
    
    // Update specific step data
    updateStepData: (stepName, data) => {
        set((state) => ({
            completeOnboardingData: {
                ...state.completeOnboardingData,
                [stepName]: {
                    ...state.completeOnboardingData[stepName],
                    data: {
                        ...state.completeOnboardingData[stepName].data,
                        ...data
                    }
                }
            }
        }));
    },
    
    // Mark step as completed
    markStepCompleted: (stepName) => {
        set((state) => ({
            completeOnboardingData: {
                ...state.completeOnboardingData,
                [stepName]: {
                    ...state.completeOnboardingData[stepName],
                    status: true
                }
            }
        }));
    },

    // Reset step status to false
    resetStepStatus: (stepName) => {
        set((state) => ({
            completeOnboardingData: {
                ...state.completeOnboardingData,
                [stepName]: {
                    ...state.completeOnboardingData[stepName],
                    status: false
                }
            }
        }));
    },
    
    // Submit complete onboarding data
    submitCompleteOnboarding: async () => {
        set(() => ({ loading: true, error: null }));
        
        try {
            const currentData = get().completeOnboardingData;
            const response = await apiPost('/restaurant/onboarding/', currentData);
            
            set(() => ({ 
                isOnBoardingCompleted: true,
                onboardingData: response.data,
                loading: false, 
                error: null 
            }));
            
            return { success: true, data: response.data };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error || 
                                error.message || 
                                'Onboarding submission failed. Please try again.';
            
            set(() => ({ 
                loading: false, 
                error: errorMessage 
            }));
            
            throw new Error(errorMessage);
        }
    },
    
    // Submit individual step data
    submitStepData: async (stepName, stepData) => {
        set(() => ({ loading: true, error: null }));
        
        try {
            const currentState = get().completeOnboardingData;
            console.log('Submitting step:', stepName, 'with data:', stepData);
            
            // Get restaurant ID based on step type
            const restaurantId = get().getRestaurantIdForStep(stepName);
            
            // Create payload with active step and Basic Information always included
            const payload = {
                restaurant_id: restaurantId
            };
            
            // Add the active step being submitted
            payload[stepName] = {
                status: true,
                data: stepData
            };
            
            // Always include Basic Information with status: false if it's not the active step
            if (stepName !== "Basic Information") {
                payload["Basic Information"] = {
                    status: false,
                    data: currentState["Basic Information"]?.data || {}
                };
            }
            
            // Add other steps with status: false if they're not the active step
            const otherSteps = ["Labour Information", "Food Cost Details", "Sales Channels", "Expense"];
            otherSteps.forEach(step => {
                if (step !== stepName) {
                    payload[step] = {
                        status: false,
                        data: currentState[step]?.data || {}
                    };
                }
            });
            
            console.log('Sending payload with only active step having status: true');
            
            // Call API to save the payload with only active step having status: true
            const response = await apiPost('/restaurant/onboarding/', payload);
            console.log('API response:', response);
            
            // Update the store with the response data (which includes restaurant_id)
            let foundRestaurantId = null;
            
            if (response.data) {
                // Check direct property
                if (response.data.restaurant_id) {
                    foundRestaurantId = response.data.restaurant_id;
                }
                // Check if it's nested in the first step data
                else if (response.data["Basic Information"] && response.data["Basic Information"].data && response.data["Basic Information"].data.restaurant_id) {
                    foundRestaurantId = response.data["Basic Information"].data.restaurant_id;
                }
                // Check if it's in the locations array
                else if (response.data["Basic Information"] && response.data["Basic Information"].data && response.data["Basic Information"].data.locations && response.data["Basic Information"].data.locations[0] && response.data["Basic Information"].data.locations[0].restaurant_id) {
                    foundRestaurantId = response.data["Basic Information"].data.locations[0].restaurant_id;
                }
                // Check if response is an array and look for restaurant_id in any step
                else if (Array.isArray(response.data)) {
                    for (const step of response.data) {
                        if (step.data && step.data.restaurant_id) {
                            foundRestaurantId = step.data.restaurant_id;
                            break;
                        }
                    }
                }
            }
            
            if (foundRestaurantId) {
                // Save restaurant_id to localStorage for persistence
                localStorage.setItem('restaurant_id', foundRestaurantId);
                console.log('✅ Saved restaurant_id to localStorage:', foundRestaurantId);
                
                // Preserve existing step statuses and only update the current step
                const updatedData = {
                    ...currentState,
                    [stepName]: {
                        status: true,
                        data: stepData
                    },
                    restaurant_id: foundRestaurantId
                };
                
                set(() => ({
                    completeOnboardingData: updatedData,
                    loading: false,
                    error: null
                }));
            } else {
                // If no restaurant_id in response, preserve existing data and update current step
                const updatedData = {
                    ...currentState,
                    [stepName]: {
                        status: true,
                        data: stepData
                    }
                };
                
                set(() => ({
                    completeOnboardingData: updatedData,
                    loading: false,
                    error: null
                }));
            }
            
            return { success: true, data: response.data };
        } catch (error) {
            console.error('API Error Details:', error);
            
            const errorMessage = error.response?.data?.message ||
                                error.response?.data?.error ||
                                error.message ||
                                `Failed to save ${stepName}. Please try again.`;
            
            set(() => ({
                loading: false,
                error: errorMessage
            }));
            
            throw new Error(errorMessage);
        }
    },
    
    // Submit onboarding data (legacy - for basic information)
    submitOnboarding: async (onboardingData) => {
        set(() => ({ loading: true, error: null }));
        
        try {
            const response = await apiPost('/restaurant/onboarding/', onboardingData);
            
            set(() => ({ 
                isOnBoardingCompleted: true,
                onboardingData: response.data,
                loading: false, 
                error: null 
            }));
            
            return { success: true, data: response.data };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error || 
                                error.message || 
                                'Onboarding submission failed. Please try again.';
            
            set(() => ({ 
                loading: false, 
                error: errorMessage 
            }));
            
            throw new Error(errorMessage);
        }
    },
    
    // Get onboarding status
    getOnboardingStatus: async () => {
        set(() => ({ loading: true, error: null }));
        
        try {
            const response = await apiGet('/onboarding/status');
            
            set(() => ({ 
                isOnBoardingCompleted: response.data.isCompleted,
                onboardingData: response.data.onboardingData,
                loading: false, 
                error: null 
            }));
            
            return { success: true, data: response.data };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error || 
                                error.message || 
                                'Failed to fetch onboarding status.';
            
            set(() => ({ 
                loading: false, 
                error: errorMessage 
            }));
            
            throw new Error(errorMessage);
        }
    },
    
    // Update onboarding data
    updateOnboarding: async (onboardingData) => {
        set(() => ({ loading: true, error: null }));
        
        try {
            const response = await apiPut('/onboarding/update', onboardingData);
            
            set(() => ({ 
                onboardingData: response.data,
                loading: false, 
                error: null 
            }));
            
            return { success: true, data: response.data };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error || 
                                error.message || 
                                'Failed to update onboarding data.';
            
            set(() => ({ 
                loading: false, 
                error: errorMessage 
            }));
            
            throw new Error(errorMessage);
        }
    },
    
    // Reset onboarding
    resetOnboarding: () => {
        // Clear restaurant_id from localStorage
        localStorage.removeItem('restaurant_id');
        console.log('🗑️ Cleared restaurant_id from localStorage');
        
        set(() => ({ 
            isOnBoardingCompleted: false,
            onboardingData: null,
            error: null 
        }));
    },
    
    clearError: () => set(() => ({ error: null })),
    
    // Get current restaurant ID for debugging
    getRestaurantId: () => {
        const state = get();
        return state.completeOnboardingData?.restaurant_id || null;
    },
    
    // Get restaurant ID with fallback to localStorage
    getRestaurantIdWithFallback: () => {
        const state = get();
        const storeRestaurantId = state.completeOnboardingData?.restaurant_id;
        
        // If we have it in store, use it
        if (storeRestaurantId) {
            return storeRestaurantId;
        }
        
        // Fallback to localStorage if available
        const localRestaurantId = localStorage.getItem('restaurant_id');
        if (localRestaurantId) {
            return localRestaurantId;
        }
        
        return null;
    },
    
    // Get restaurant ID for step submission
    getRestaurantIdForStep: (stepName) => {
        // For Basic Information step (first step), always return null for new users
        if (stepName === "Basic Information") {
            return null;
        }
        
        // For other steps, get from state or localStorage
        const state = get();
        const storeRestaurantId = state.completeOnboardingData?.restaurant_id;
        
        if (storeRestaurantId) {
            return storeRestaurantId;
        }
        
        const localRestaurantId = localStorage.getItem('restaurant_id');
        if (localRestaurantId) {
            return localRestaurantId;
        }
        
        // If no restaurant_id found for non-Basic Information steps, this might be an issue
        console.warn(`⚠️ No restaurant_id found for step "${stepName}" - Basic Information might not be completed`);
        return null;
    },
    
    // Ensure all steps are properly initialized
    ensureAllStepsInitialized: () => {
        const state = get();
        const currentData = state.completeOnboardingData;
        
        // Check if all required steps exist in the data structure
        const requiredSteps = ["Basic Information", "Labour Information", "Food Cost Details", "Sales Channels", "Expense"];
        let needsUpdate = false;
        
        const updatedData = { ...currentData };
        
        requiredSteps.forEach(stepName => {
            if (!updatedData[stepName]) {
                needsUpdate = true;
                // Initialize with default structure based on step type
                switch (stepName) {
                    case "Basic Information":
                        updatedData[stepName] = {
                            status: false,
                            data: {
                                restaurant_name: "",
                                number_of_locations: 1,
                                restaurant_type: "",
                                menu_type: "",
                                locations: [
                                    {
                                        location_name: "",
                                        address_1: "",
                                        country: "",
                                        state: "",
                                        zip_code: "",
                                        sqft: "",
                                        is_franchise: false
                                    }
                                ]
                            }
                        };
                        break;
                    case "Labour Information":
                        updatedData[stepName] = {
                            status: false,
                            data: {
                                goal: "",
                                needs_attention: "",
                                danger: "",
                                avg_hourly_rate: 0,
                                labor_record_method: "daily_hours_costs",
                                daily_ticket_count: false,
                                forward_prev_week_rate: false
                            }
                        };
                        break;
                    case "Food Cost Details":
                        updatedData[stepName] = {
                            status: false,
                            data: {
                                cogs_goal: "",
                                use_third_party_delivery: false,
                                delivery_days: []
                            }
                        };
                        break;
                    case "Sales Channels":
                        updatedData[stepName] = {
                            status: false,
                            data: {
                                in_store: true,
                                online: false,
                                from_app: false,
                                third_party: false
                            }
                        };
                        break;
                    case "Expense":
                        updatedData[stepName] = {
                            status: false,
                            data: {
                                fixed_costs: [],
                                variable_costs: []
                            }
                        };
                        break;
                    default:
                        updatedData[stepName] = {
                            status: false,
                            data: {}
                        };
                }
            }
        });
        
        // Ensure restaurant_id exists
        if (!updatedData.restaurant_id) {
            updatedData.restaurant_id = null;
            needsUpdate = true;
        }
        
        // Update state if needed
        if (needsUpdate) {
            set(() => ({
                completeOnboardingData: updatedData
            }));
            console.log('✅ All onboarding steps initialized');
        }
    },
    
    // Check if onboarding is complete
    isOnboardingComplete: () => {
        const state = get();
        const data = state.completeOnboardingData;
        
        const requiredSteps = ["Basic Information", "Labour Information", "Food Cost Details", "Sales Channels", "Expense"];
        const completedSteps = requiredSteps.filter(stepName => 
            data[stepName] && data[stepName].status === true
        );
        
        const isComplete = completedSteps.length === requiredSteps.length;
        
        return {
            isComplete,
            completedSteps,
            totalSteps: requiredSteps.length,
            completedCount: completedSteps.length
        };
    },
});

export default createOnBoardingSlice;