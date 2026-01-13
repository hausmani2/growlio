import { apiPost, apiGet, apiPut } from '../../utils/axiosInterceptors';

const createOnBoardingSlice = (set, get) => ({
    name: 'onBoarding',
    user: null,
    isOnBoardingCompleted: false,
    onboardingLoading: false,
    onboardingError: null,
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
        "Labor Information": {
            status: false,
            data: {
                goal: "",
                needs_attention: "",
                danger: "",
                labour_goal: 0,
                avg_hourly_rate: 0,
                labor_record_method: "daily-hours-costs",
                daily_ticket_count: false,
                forward_previous_week_rate: false
            }
        },
        "Food Cost Details": {
            status: false,
            data: {
                cogs_goal: "",
                delivery_days: []
            }
        },
        "Sales Channels": {
            status: false,
            data: {
                in_store: true,
                online: false,
                from_app: false,
                third_party: false,
                providers: []
            }
        },
        "Expense": {
            status: false,
            data: {
                fixed_costs: [],
                variable_costs: []
            }
        },
        "Sales Information": {
            status: false,
            data: []
        },
        "Labor Data": {
            status: false,
            data: []
        }
    },

    // Temporary form data for each step (for unsaved changes)
    tempFormData: {
        "Basic Information": {
            restaurantData: {
                restaurantName: "",
                numberOfLocations: undefined,
                locationName: "",
                otherLocationName: ""
            },
            addressData: {
                address1: "",
                address2: "",
                country: "",
                state: "",
                zipCode: ""
            },
            addressTypeData: {
                sqft: "",
                isFranchise: "",
                royaltyPercentage: "",
                advertisementFee: "",
                restaurantType: "",
                menuType: ""
            }
        },
        "Labor Information": {
            laborData: {
                goal: "",
                needs_attention: "",
                danger: "",
                labour_goal: 0,
                avg_hourly_rate: 0,
                labor_record_method: "daily-hours-costs",
                daily_ticket_count: false,
                forward_previous_week_rate: false
            }
        },
        "Food Cost Details": {
            foodCostData: {
                cogs_goal: "",
                delivery_days: []
            }
        },
        "Sales Channels": {
            salesData: {
                in_store: true,
                online: false,
                from_app: false,
                third_party: false
            }
        },
        "Expense": {
            expenseData: {
                fixed_costs: [],
                variable_costs: []
            }
        }
    },
    
    setIsOnBoardingCompleted: (isOnBoardingCompleted) => set({ isOnBoardingCompleted }),
    
    // Update temporary form data for a specific step
    updateTempFormData: (stepName, formSection, field, value) => {
        set((state) => ({
            tempFormData: {
                ...state.tempFormData,
                [stepName]: {
                    ...state.tempFormData[stepName],
                    [formSection]: {
                        ...state.tempFormData[stepName]?.[formSection],
                        [field]: value
                    }
                }
            }
        }));
    },

    // Update multiple fields in temporary form data
    updateTempFormDataMultiple: (stepName, formSection, updates) => {
        set((state) => ({
            tempFormData: {
                ...state.tempFormData,
                [stepName]: {
                    ...state.tempFormData[stepName],
                    [formSection]: {
                        ...state.tempFormData[stepName]?.[formSection],
                        ...updates
                    }
                }
            }
        }));
    },

    // Save temporary form data to permanent storage
    saveTempFormData: (stepName) => {
        const state = get();
        const tempData = state.tempFormData[stepName];
        
        if (!tempData) return;

        // Convert temp form data to API format based on step
        let apiData = {};
        
        switch (stepName) {
            case "Basic Information": {
                const { restaurantData, addressData, addressTypeData } = tempData;
                // Build location object with conditional latitude/longitude
                const locationObj = {
                    name: restaurantData.locationName, // API expects 'name' not 'location_name'
                    address_1: addressData.address1,
                    address_2: addressData.address2,
                    country: addressData.country === "1" ? "USA" : addressData.country === "2" ? "Canada" : "UK",
                    state: addressData.state === "1" ? "CA" : addressData.state === "2" ? "NY" : "TX",
                    zip_code: addressData.zipCode,
                    sqft: parseInt(addressTypeData.sqft) || 0,
                    is_franchise: addressTypeData.isFranchise === "2"
                };
                
                // Only include latitude and longitude if they have valid values
                if (addressData.latitude !== null && addressData.latitude !== undefined && !isNaN(parseFloat(addressData.latitude))) {
                    locationObj.latitude = parseFloat(addressData.latitude);
                }
                if (addressData.longitude !== null && addressData.longitude !== undefined && !isNaN(parseFloat(addressData.longitude))) {
                    locationObj.longitude = parseFloat(addressData.longitude);
                }
                
                apiData = {
                    restaurant_name: restaurantData.restaurantName,
                    number_of_locations: parseInt(restaurantData.numberOfLocations) || 1,
                    restaurant_type: addressTypeData.restaurantType,
                    menu_type: addressTypeData.menuType,
                    locations: [locationObj]
                };
                break;
            }
            case "Labor Information": {
                const { laborData } = tempData;
                apiData = {
                    goal: parseFloat(laborData.goal) || 0,
                    attention: parseFloat(laborData.needs_attention) || 0, // API expects 'attention'
                    danger: parseFloat(laborData.danger) || 0,
                    labour_goal: parseFloat(laborData.labour_goal) || 0,
                    avg_hourly_rate: parseFloat(laborData.avg_hourly_rate) || 0,
                    labor_record_method: laborData.labor_record_method || "daily-hours-costs",
                    daily_ticket_count: laborData.daily_ticket_count || false,
                    forward_previous_week_rate: laborData.forward_previous_week_rate || false // API expects 'forward_previous_week_rate'
                };
                break;
            }
            case "Food Cost Details": {
                const { foodCostData } = tempData;
                apiData = {
                    cogs_goal: parseFloat(foodCostData.cogs_goal) || 0,
                    uses_third_party_delivery: foodCostData.uses_third_party_delivery || false, // API expects 'uses_third_party_delivery'
                    delivery_days: foodCostData.delivery_days || [],
                    providers: foodCostData.providers || [] // Include providers array in API payload
                };
                break;
            }
            case "Sales Channels": {
                const { salesData } = tempData;
                apiData = {
                    in_store: salesData.in_store !== undefined ? salesData.in_store : true,
                    online: salesData.online || false,
                    from_app: salesData.from_app || false,
                    third_party: salesData.third_party || false
                };
                break;
            }
            case "Expense": {
                const { expenseData } = tempData;
                apiData = {
                    fixed_costs: expenseData.fixed_costs || [],
                    variable_costs: expenseData.variable_costs || []
                };
                break;
            }
        }

        // Update the complete onboarding data
        set((state) => ({
            completeOnboardingData: {
                ...state.completeOnboardingData,
                [stepName]: {
                    ...state.completeOnboardingData[stepName],
                    data: apiData
                }
            }
        }));

        return apiData;
    },

    // Load saved data into temporary form data
    loadDataToTempForm: (stepName) => {
        const state = get();
        const savedData = state.completeOnboardingData[stepName]?.data;
        
        if (!savedData) return;

        switch (stepName) {
            case "Basic Information": {
                const tempData = {
                    restaurantData: {
                        restaurantName: savedData.restaurant_name || "",
                        numberOfLocations: savedData.number_of_locations || undefined,
                        locationName: savedData.locations?.[0]?.name || savedData.locations?.[0]?.location_name || "",
                        otherLocationName: ""
                    },
                    addressData: {
                        address1: savedData.locations?.[0]?.address_1 || "",
                        address2: savedData.locations?.[0]?.address_2 || "",
                        country: savedData.locations?.[0]?.country === "USA" ? "1" : 
                                savedData.locations?.[0]?.country === "Canada" ? "2" : "3",
                        state: savedData.locations?.[0]?.state === "CA" ? "1" : 
                               savedData.locations?.[0]?.state === "NY" ? "2" : "3",
                        zipCode: savedData.locations?.[0]?.zip_code || ""
                    },
                    addressTypeData: {
                        sqft: savedData.locations?.[0]?.sqft?.toString() || "",
                        isFranchise: savedData.locations?.[0]?.is_franchise ? "2" : "1",
                        royaltyPercentage: "",
                        advertisementFee: "",
                        restaurantType: savedData.restaurant_type || "",
                        menuType: savedData.menu_type || ""
                    }
                };
                
                set((state) => ({
                    tempFormData: {
                        ...state.tempFormData,
                        [stepName]: tempData
                    }
                }));
                break;
            }
            case "Labor Information": {
                const tempData = {
                    laborData: {
                        goal: savedData.goal?.toString() || "",
                        needs_attention: savedData.attention?.toString() || savedData.needs_attention?.toString() || "",
                        danger: savedData.danger?.toString() || "",
                        labour_goal: savedData.labour_goal || 0,
                        avg_hourly_rate: savedData.avg_hourly_rate || 0,
                        labor_record_method: savedData.labor_record_method || "daily-hours-costs",
                        daily_ticket_count: savedData.daily_ticket_count || false,
                        forward_previous_week_rate: savedData.forward_previous_week_rate || false
                    }
                };
                
                set((state) => ({
                    tempFormData: {
                        ...state.tempFormData,
                        [stepName]: tempData
                    }
                }));
                break;
            }
            case "Food Cost Details": {
                const tempData = {
                    foodCostData: {
                        cogs_goal: savedData.cogs_goal?.toString() || "",
                        delivery_days: savedData.delivery_days || []
                    }
                };
                
                set((state) => ({
                    tempFormData: {
                        ...state.tempFormData,
                        [stepName]: tempData
                    }
                }));
                break;
            }
            case "Sales Channels": {
                const tempData = {
                    salesData: {
                        in_store: savedData.in_store !== undefined ? savedData.in_store : true,
                        online: savedData.online || false,
                        from_app: savedData.from_app || false,
                        third_party: savedData.third_party || false,
                        providers: savedData.providers || []
                    }
                };
                
                set((state) => ({
                    tempFormData: {
                        ...state.tempFormData,
                        [stepName]: tempData
                    }
                }));
                break;
            }
            case "Expense": {
                const tempData = {
                    expenseData: {
                        fixed_costs: savedData.fixed_costs || [],
                        variable_costs: savedData.variable_costs || []
                    }
                };
                
                set((state) => ({
                    tempFormData: {
                        ...state.tempFormData,
                        [stepName]: tempData
                    }
                }));
                break;
            }
        }
    },

    // Get temporary form data for a step
    getTempFormData: (stepName) => {
        const state = get();
        return state.tempFormData[stepName] || null;
    },

    // Clear temporary form data for a step
    clearTempFormData: (stepName) => {
        set((state) => ({
            tempFormData: {
                ...state.tempFormData,
                [stepName]: null
            }
        }));
    },
    
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
        set(() => ({ onboardingLoading: true, onboardingError: null }));
        
        try {
            const currentData = get().completeOnboardingData;
            const response = await apiPost('/restaurant_v2/onboarding/', currentData);
            
            
            // Check if the response status is 200 (success)
            if (response.status !== 200) {
                console.error('❌ Complete onboarding API request failed with status:', response.status);
                const errorMessage = `Complete onboarding failed with status ${response.status}. Please try again.`;
                
                set(() => ({
                    onboardingLoading: false,
                    onboardingError: errorMessage
                }));
                
                throw new Error(errorMessage);
            }
            
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
    submitStepData: async (stepName, stepData, onSuccess) => {
        set(() => ({ onboardingLoading: true, onboardingError: null }));
        
        try {
            const currentState = get().completeOnboardingData;
            
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
            const otherSteps = ["Labor Information", "Food Cost Details", "Sales Channels", "Expense", "Sales Information", "Labor Data"];
            otherSteps.forEach(step => {
                if (step !== stepName) {
                    payload[step] = {
                        status: false,
                        data: currentState[step]?.data || {}
                    };
                }
            });
            
            // Check if we have an existing restaurant_id and add it to payload if it exists
            const existingRestaurantId = get().getRestaurantId();
            
            // Add restaurant_id to payload if it exists (for updates)
            if (existingRestaurantId) {
                payload.restaurant_id = existingRestaurantId;
            }
            
            // Always use POST endpoint, restaurant_id in payload determines create vs update
            const response = await apiPost('/restaurant_v2/onboarding/', payload);
            
            // Check if the response status is 200 (success)
            if (response.status !== 200) {
                console.error('❌ API request failed with status:', response.status);
                const errorMessage = `API request failed with status ${response.status}. Please try again.`;
                
                set(() => ({
                    onboardingLoading: false,
                    onboardingError: errorMessage
                }));
                
                throw new Error(errorMessage);
            }
            
            // Update the store with the response data (which includes restaurant_id)
            let foundRestaurantId = null;
            
            if (response.data) {
                
                // Check direct property (most common case)
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
                } else {
                    // No restaurant_id found in response data
                }
            }
            
            if (foundRestaurantId) {
                // Save restaurant_id to localStorage for persistence
                localStorage.setItem('restaurant_id', foundRestaurantId);
                
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
                    onboardingLoading: false,
                    onboardingError: null
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
                    onboardingLoading: false,
                    onboardingError: null
                }));
            }
            
            // Call success callback if provided (for navigation to next step) - ONLY if status is 200
            if (onSuccess && typeof onSuccess === 'function') {
                onSuccess(response.data);
            }
            
            return { success: true, data: response.data };
        } catch (error) {
            console.error('API Error Details:', error);
            
            const errorMessage = error.response?.data?.message ||
                                error.response?.data?.error ||
                                error.message ||
                                `Failed to save ${stepName}. Please try again.`;
            
            set(() => ({
                onboardingLoading: false,
                onboardingError: errorMessage
            }));
            
            throw new Error(errorMessage);
        }
    },
    
    // Submit onboarding data (legacy - for basic information)
    submitOnboarding: async (onboardingData) => {
        set(() => ({ onboardingLoading: true, onboardingError: null }));
        
        try {
            const response = await apiPost('/restaurant_v2/onboarding/', onboardingData);
            
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
        set(() => ({ onboardingLoading: true, onboardingError: null }));
        
        try {
            const response = await apiGet('/restaurant_v2/onboarding/');
            
            set(() => ({ 
                isOnBoardingCompleted: response.data.isCompleted,
                onboardingData: response.data.onboardingData,
                onboardingLoading: false, 
                onboardingError: null 
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
    
    // Load existing onboarding data from API and populate forms
    loadExistingOnboardingData: async () => {
        const state = get();
        
        // Prevent multiple concurrent calls - if already loading, return the existing promise
        if (state.onboardingLoading) {
            // Wait for the existing request to complete
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    const currentState = get();
                    if (!currentState.onboardingLoading) {
                        clearInterval(checkInterval);
                        // Return the current data if available
                        resolve({
                            success: true,
                            data: currentState.completeOnboardingData,
                            message: 'Data already loaded'
                        });
                    }
                }, 100);
                
                // Timeout after 15 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve({ success: false, message: 'Request timeout' });
                }, 15000);
            });
        }
        
        // Check if we already have complete data loaded (prevent unnecessary calls)
        const hasCompleteData = state.completeOnboardingData?.restaurant_id && 
            Object.values(state.completeOnboardingData).some(step => 
                step && typeof step === 'object' && step.status === true
            );
        
        if (hasCompleteData) {
            // Data already loaded, return it without making API call
            return {
                success: true,
                data: state.completeOnboardingData,
                message: 'Data already loaded'
            };
        }
        
        set(() => ({ onboardingLoading: true, onboardingError: null }));
        
        try {
            // First, ensure we have a restaurant ID
            let restaurantId = state.completeOnboardingData?.restaurant_id || localStorage.getItem('restaurant_id');
            
            // If no restaurant ID, this means the user is new and hasn't completed onboarding
            // Don't make API calls - just return early
            if (!restaurantId) {
                set(() => ({ onboardingLoading: false, onboardingError: null }));
                return { 
                    success: false, 
                    message: 'No restaurant ID found - user needs to complete onboarding first',
                    isNewUser: true
                };
            }
            
            // Add timeout to prevent infinite loading
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 15000)
            );
            
            const apiPromise = apiGet('/restaurant_v2/onboarding/');
            const response = await Promise.race([apiPromise, timeoutPromise]);
            const apiData = response.data;
            
            if (!apiData) {
                set(() => ({ onboardingLoading: false, onboardingError: null }));
                return { success: false, message: 'No onboarding data found' };
            }
            
            // Initialize the complete onboarding data structure
            let updatedOnboardingData = {
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
                "Labor Information": {
                    status: false,
                    data: {
                        goal: "",
                        needs_attention: "",
                        danger: "",
                        labour_goal: 0,
                        avg_hourly_rate: 0,
                        labor_record_method: "daily_hours_costs",
                        daily_ticket_count: false,
                        forward_previous_week_rate: false
                    }
                },
                "Food Cost Details": {
                    status: false,
                    data: {
                        cogs_goal: "",
                        delivery_days: []
                    }
                },
                "Sales Channels": {
                    status: false,
                    data: {
                        in_store: true,
                        online: false,
                        from_app: false,
                        third_party: false,
                        providers: []
                    }
                },
                "Expense": {
                    status: false,
                    data: {
                        fixed_costs: [],
                        variable_costs: []
                    }
                },
                "Sales Information": {
                    status: false,
                    data: []
                },
                "Labor Data": {
                    status: false,
                    data: []
                }
            };
            
            // Handle array format response
            let stepsData = [];
           
            
            if (Array.isArray(apiData)) {
                // If it's a nested array, flatten it
                if (apiData.length > 0 && Array.isArray(apiData[0])) {
                    stepsData = apiData[0];
                } else {
                    stepsData = apiData;
                    
                }
                
                // Additional check for double-nested arrays (like [[{...}]])
                if (stepsData.length > 0 && Array.isArray(stepsData[0])) {
                    stepsData = stepsData[0];
                    
                }
            } else {
                // Handle object format (fallback)
                stepsData = Object.entries(apiData).map(([step, data]) => ({
                    step,
                    status: data.status,
                    data: data.data
                }));
                
            }
            
            // Process each step from the API response
            stepsData.forEach(stepInfo => {
                const { step: stepName, status, data, restaurant_id } = stepInfo;
                
                // Extract restaurant_id from first step if available
                if (restaurant_id && !updatedOnboardingData.restaurant_id) {
                    updatedOnboardingData.restaurant_id = restaurant_id;
                    localStorage.setItem('restaurant_id', restaurant_id);
                }
                
                // Map API field names to our expected format
                let processedData = data || {};
                
                if (stepName === "Basic Information" && data) {
                    // Handle Basic Information data mapping
                    processedData = {
                        restaurant_name: data.restaurant_name || "",
                        number_of_locations: data.number_of_locations || 1,
                        restaurant_type: data.restaurant_type || "",
                        menu_type: data.menu_type || "",
                        locations: data.locations || []
                    };
                } else if (stepName === "Labor Information" && data) {
                    
                    // Handle Labour Information data mapping
                    processedData = {
                        goal: data.labour_goal || data.goal || "",
                        needs_attention: data.attention || "", // API uses 'attention', we expect 'needs_attention'
                        danger: data.danger || "",
                        labour_goal: data.labour_goal || 0,
                        avg_hourly_rate: data.avg_hourly_rate || 0,
                        labor_record_method: data.labor_record_method || "daily-hours-costs",
                        daily_ticket_count: data.daily_ticket_count || false,
                        forward_previous_week_rate: data.forward_previous_week_rate || false
                    };
                    
                } else if (stepName === "Food Cost Details" && data) {
                    // Handle Food Cost Details data mapping
                    processedData = {
                        cogs_goal: data.cogs_goal || "",
                        delivery_days: data.delivery_days || []
                    };
                } else if (stepName === "Sales Channels" && data) {
                    // Handle Sales Channels data mapping
                    processedData = {
                        in_store: data.in_store !== undefined ? data.in_store : true,
                        online: data.online !== undefined ? data.online : false,
                        from_app: data.from_app !== undefined ? data.from_app : false,
                        third_party: data.third_party !== undefined ? data.third_party : false,
                        providers: data.providers || [],
                        restaurant_days: data.restaurant_days || [],
                        pos_system: data.pos_system || '',
                        pos_system_other: data.pos_system_other || '',
                        separate_online_ordering: data.separate_online_ordering !== undefined ? data.separate_online_ordering : false,
                        pos_for_employee_hours: data.pos_for_employee_hours !== undefined ? data.pos_for_employee_hours : false,
                        third_party_orders_to_pos: data.third_party_orders_to_pos !== undefined ? data.third_party_orders_to_pos : false
                    };
                } else if (stepName === "Expense" && data) {
                    // Handle Expenses data mapping
                    // Support both new format (expenses array) and old format (fixed_costs/variable_costs)
                    if (data.expenses && Array.isArray(data.expenses)) {
                        // New format: expenses array
                        processedData = {
                            expenses: data.expenses,
                            fixed_costs: [], // Keep for backward compatibility
                            variable_costs: [] // Keep for backward compatibility
                        };
                    } else {
                        // Old format: fixed_costs and variable_costs
                        processedData = {
                            expenses: [
                                ...(data.fixed_costs || []),
                                ...(data.variable_costs || [])
                            ],
                            fixed_costs: data.fixed_costs || [],
                            variable_costs: data.variable_costs || []
                        };
                    }
                }
                
                // Update the step data and status
                updatedOnboardingData[stepName] = {
                    status: status || false,
                    data: processedData
                };
                
            });
            
            // Update the store with the loaded data
            
            set(() => ({
                completeOnboardingData: updatedOnboardingData,
                onboardingLoading: false,
                onboardingError: null
            }));
            
            // Return information about completed and incomplete steps
            const steps = ["Basic Information", "Labor Information", "Food Cost Details", "Sales Channels", "Expense"];
            const completedSteps = steps.filter(stepName => 
                updatedOnboardingData[stepName]?.status === true
            );
            
            const incompleteSteps = steps.filter(stepName => 
                updatedOnboardingData[stepName]?.status === false
            );
            
            return { 
                success: true, 
                data: updatedOnboardingData,
                completedSteps,
                incompleteSteps,
                totalSteps: steps.length
            };
            
        } catch (error) {
            console.error('❌ Error loading existing onboarding data:', error);
            
            let errorMessage = 'Failed to load existing onboarding data.';
            let shouldSetError = true;
            
            if (error.message === 'Request timeout') {
                errorMessage = 'Request timed out. Please check your connection and try again.';
            } else if (error.response?.status === 404) {
                // 404 is not an error - it just means no data exists yet
                errorMessage = 'No onboarding data found. Starting fresh setup.';
                shouldSetError = false;
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentication required. Please log in again.';
                
                // Clear all store data when token expires and redirect to login
                // Import the utility function dynamically to avoid circular imports
                import('../../utils/axiosInterceptors').then(({ clearStoreAndRedirectToLogin }) => {
                    clearStoreAndRedirectToLogin();
                });
                
                return { success: false, message: errorMessage, error: error };
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({ 
                onboardingLoading: false, 
                onboardingError: shouldSetError ? errorMessage : null 
            }));
            
            // Don't throw error, return failure result instead
            return { 
                success: false, 
                message: errorMessage,
                error: error 
            };
        }
    },
    
    // Update onboarding data
    updateOnboarding: async (onboardingData) => {
        set(() => ({ loading: true, error: null }));
        
        try {
            const response = await apiPut('/onboarding/update', onboardingData);
            
            // Check if the response status is 200 (success)
            if (response.status !== 200) {
                console.error('❌ Update onboarding API request failed with status:', response.status);
                const errorMessage = `Update onboarding failed with status ${response.status}. Please try again.`;
                
                set(() => ({
                    onboardingLoading: false,
                    onboardingError: errorMessage
                }));
                
                throw new Error(errorMessage);
            }

            set(() => ({ 
                onboardingData: response.data,
                onboardingLoading: false, 
                onboardingError: null 
            }));
            
            return { success: true, data: response.data };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error || 
                                error.message || 
                                'Failed to update onboarding data.';
            
            set(() => ({ 
                onboardingLoading: false, 
                onboardingError: errorMessage 
            }));
            
            throw new Error(errorMessage);
        }
    },
    
    // Reset onboarding
    resetOnboarding: () => {
        // Clear restaurant_id from localStorage
        localStorage.removeItem('restaurant_id');
        
        // Clear session storage timestamps
        sessionStorage.removeItem('onboarding_completion_check_time');
        
        // Reset onboarding completion state
        set(() => ({ 
            isOnBoardingCompleted: false,
            onboardingLoading: false,
            onboardingError: null
        }));
        
        // Reset to initial state
        set(() => ({ 
            user: null,
            isOnBoardingCompleted: false,
            onboardingLoading: false,
            onboardingError: null,
            onboardingData: null,
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
                "Labor Information": {
                    status: false,
                    data: {
                        goal: "",
                        needs_attention: "",
                        danger: "",
                        labour_goal: 0,
                        avg_hourly_rate: 0,
                        labor_record_method: "daily_hours_costs",
                        daily_ticket_count: false,
                        forward_previous_week_rate: false
                    }
                },
                "Food Cost Details": {
                    status: false,
                    data: {
                        cogs_goal: "",
                        delivery_days: []
                    }
                },
                "Sales Channels": {
                    status: false,
                    data: {
                        in_store: true,
                        online: false,
                        from_app: false,
                        third_party: false,
                        providers: []
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
            tempFormData: {
                "Basic Information": {
                    restaurantData: {
                        restaurantName: "",
                        numberOfLocations: undefined,
                        locationName: "",
                        otherLocationName: ""
                    },
                    addressData: {
                        address1: "",
                        address2: "",
                        country: "",
                        state: "",
                        zipCode: ""
                    },
                    addressTypeData: {
                        sqft: "",
                        isFranchise: "",
                        royaltyPercentage: "",
                        advertisementFee: "",
                        restaurantType: "",
                        menuType: ""
                    }
                },
                "Labor Information": {
                    laborData: {
                        goal: "",
                        needs_attention: "",
                        danger: "",
                        labour_goal: 0,
                        avg_hourly_rate: 0,
                        labor_record_method: "daily-hours-costs",
                        daily_ticket_count: false,
                        forward_previous_week_rate: false
                    }
                },
                "Food Cost Details": {
                    foodCostData: {
                        cogs_goal: "",
                        delivery_days: []
                    }
                },
                "Sales Channels": {
                    salesData: {
                        in_store: true,
                        online: false,
                        from_app: false,
                        third_party: false,
                        providers: []
                    }
                },
                "Expense": {
                    expenseData: {
                        fixed_costs: [],
                        variable_costs: []
                    }
                }
            },
            // Clear restaurant goals state
            restaurantGoalsLoading: false,
            restaurantGoalsError: null,
            restaurantGoals: null,
            // Clear restaurant name check state
            restaurantNameCheckLoading: false,
            restaurantNameCheckError: null,
            restaurantNameExists: false
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
        const state = get();
        const storeRestaurantId = state.completeOnboardingData?.restaurant_id;
        const localRestaurantId = localStorage.getItem('restaurant_id');
        
        // For Basic Information step, check if we have an existing restaurant_id
        if (stepName === "Basic Information") {
            // If we have a restaurant_id in store or localStorage, this is an update
            if (storeRestaurantId || localRestaurantId) {
                const existingId = storeRestaurantId || localRestaurantId;
                return existingId;
            }
            // If no restaurant_id exists, this is a new user
            return null;
        }
        
        // For other steps, get from state or localStorage
        if (storeRestaurantId) {
            return storeRestaurantId;
        }
        
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
        const requiredSteps = ["Basic Information", "Labor Information", "Food Cost Details", "Sales Channels", "Expense"];
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
                    case "Labor Information":
                        updatedData[stepName] = {
                            status: false,
                            data: {
                                goal: "",
                                needs_attention: "",
                                danger: "",
                                labour_goal: 0,
                                avg_hourly_rate: 0,
                                labor_record_method: "daily_hours_costs",
                                daily_ticket_count: false,
                                forward_previous_week_rate: false
                            }
                        };
                        break;
                    case "Food Cost Details":
                        updatedData[stepName] = {
                            status: false,
                            data: {
                                cogs_goal: "",
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
                                third_party: false,
                                providers: []
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
            
        }
    },
    
    // Check if onboarding is complete by calling the restaurants-onboarding API
    checkOnboardingCompletion: async () => {
        const currentState = get();
        
        // Check if we're already loading to prevent multiple simultaneous calls
        if (currentState.onboardingLoading) {
            return {
                success: false,
                isComplete: false,
                error: 'Check already in progress'
            };
        }
        
        // Check session storage for recent check to prevent rapid successive calls
        const lastCheckTime = sessionStorage.getItem('onboarding_completion_check_time');
        const now = Date.now();
        const timeSinceLastCheck = lastCheckTime ? now - parseInt(lastCheckTime) : Infinity;
        
        
        // If we checked within the last 10 seconds, use cached result
        if (timeSinceLastCheck < 10000) {
            return {
                success: true,
                isComplete: currentState.isOnBoardingCompleted || false,
                message: 'Using cached result'
            };
        }
        
        // Record this check time
        sessionStorage.setItem('onboarding_completion_check_time', now.toString());
        
        set(() => ({ onboardingLoading: true, error: null }));
        
        // Add timeout to prevent stuck loading state
        const timeoutId = setTimeout(() => {
            set(() => ({ onboardingLoading: false }));
        }, 30000); // 30 second timeout
        
        try {
            const response = await apiGet('/restaurant_v2/restaurants-onboarding/');
            const onboardingData = response.data;

            
            if (!onboardingData) {
                set(() => ({ onboardingLoading: false, onboardingError: null }));
                return { success: false, message: 'No onboarding data found' };
            }
            
            // Check if user has restaurants with completed onboarding
            if (onboardingData && onboardingData.restaurants && onboardingData.restaurants.length > 0) {
                const hasCompletedOnboarding = onboardingData.restaurants.some(restaurant => 
                    restaurant.onboarding_complete === true
                );
                

                
                // Extract restaurant ID from the first restaurant (or the completed one)
                let restaurantId = null;
                if (hasCompletedOnboarding) {
                    // Get the restaurant ID from the completed restaurant
                    const completedRestaurant = onboardingData.restaurants.find(restaurant => 
                        restaurant.onboarding_complete === true
                    );
                    restaurantId = completedRestaurant?.restaurant_id;
                } else {
                    // Get the restaurant ID from the first restaurant (for incomplete onboarding)
                    restaurantId = onboardingData.restaurants[0]?.restaurant_id;
                }
                
                
                // Store restaurant ID in localStorage and store if found
                if (restaurantId) {
                    localStorage.setItem('restaurant_id', restaurantId.toString());
                }
                
                if (hasCompletedOnboarding) {
                    set(() => ({ 
                        isOnBoardingCompleted: true,
                        onboardingLoading: false, 
                        onboardingError: null 
                    }));
                    
                    return { 
                        success: true, 
                        isComplete: true,
                        message: 'Onboarding completed successfully!',
                        restaurantId: restaurantId
                    };
                } else {
                    set(() => ({ 
                        isOnBoardingCompleted: false,
                        onboardingLoading: false, 
                        onboardingError: null 
                    }));
                    
                    return { 
                        success: true, 
                        isComplete: false,
                        message: 'Onboarding not yet complete',
                        restaurantId: restaurantId
                    };
                }
            } else {
                // No restaurants found - check if user is superuser
                const currentState = get();
                const isSuperUser = currentState.user?.is_superuser;
                
                if (isSuperUser) {
                    // Superuser with no restaurants - skip onboarding and go to dashboard
                        set(() => ({ 
                        isOnBoardingCompleted: true,
                        onboardingLoading: false, 
                        onboardingError: null 
                    }));
                    
                    return { 
                        success: true, 
                        isComplete: true,
                        message: 'Superuser with no restaurants - onboarding skipped',
                        restaurantId: null
                    };
                } else {
                    // Regular user with no restaurants - needs onboarding
                    set(() => ({ 
                        isOnBoardingCompleted: false,
                        onboardingLoading: false, 
                        onboardingError: null 
                    }));
                    
                    return { 
                        success: true, 
                        isComplete: false,
                        message: 'No restaurants found - onboarding required'
                    };
                }
            }
            
        } catch (error) {
            console.error('❌ Error checking onboarding completion:', error);
            
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error || 
                                error.message || 
                                'Failed to check onboarding completion.';
            
            set(() => ({ 
                onboardingLoading: false, 
                onboardingError: errorMessage 
            }));
            
            throw new Error(errorMessage);
        } finally {
            // Clear timeout and reset loading state
            clearTimeout(timeoutId);
            set(() => ({ onboardingLoading: false }));
        }
    },
    
    // Manually refresh existing onboarding data (useful for debugging or manual refresh)
    refreshExistingOnboardingData: async () => {
        return await get().loadExistingOnboardingData();
    },
    
    // Force a fresh onboarding completion check by clearing cache
    forceOnboardingCheck: async () => {
        // Clear the cache to force a fresh API call
        sessionStorage.removeItem('onboarding_completion_check_time');
        // Reset loading state to ensure clean start
        set(() => ({ onboardingLoading: false }));
        return await get().checkOnboardingCompletion();
    },
    
    // Get detailed step status information
    getStepStatusInfo: () => {
        const state = get();
        const data = state.completeOnboardingData;
        
        const steps = ["Basic Information", "Labor Information", "Food Cost Details", "Sales Channels", "Expense"];
        const stepStatus = {};
        
        steps.forEach(stepName => {
            const stepData = data[stepName];
            stepStatus[stepName] = {
                status: stepData?.status || false,
                hasData: !!(stepData?.data && Object.keys(stepData.data).length > 0),
                data: stepData?.data || {}
            };
        });
        
        const completedSteps = steps.filter(stepName => stepStatus[stepName].status === true);
        const incompleteSteps = steps.filter(stepName => stepStatus[stepName].status === false);
        
        return {
            stepStatus,
            completedSteps,
            incompleteSteps,
            totalSteps: steps.length,
            completedCount: completedSteps.length,
            incompleteCount: incompleteSteps.length,
            restaurantId: data.restaurant_id || localStorage.getItem('restaurant_id')
        };
    },
    
    // Check if onboarding is complete
    isOnboardingComplete: () => {
        const state = get();
        const data = state.completeOnboardingData;
        
        const requiredSteps = ["Basic Information", "Labor Information", "Food Cost Details", "Sales Channels", "Expense"];
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

    // Restaurant name checking functionality
    restaurantNameCheckLoading: false,
    restaurantNameCheckError: null,
    restaurantNameExists: false,

    // Check if restaurant name already exists
    checkRestaurantName: async (restaurantName, restaurantId = null) => {
        if (!restaurantName || restaurantName.trim() === '') {
            set(() => ({
                restaurantNameCheckError: 'Restaurant name is required',
                restaurantNameExists: false
            }));
            return { exists: false, error: 'Restaurant name is required' };
        }

        set(() => ({ 
            restaurantNameCheckLoading: true, 
            restaurantNameCheckError: null,
            restaurantNameExists: false
        }));

        try {
            // Get restaurant_id from store or localStorage if not provided
            let finalRestaurantId = restaurantId;
            if (!finalRestaurantId) {
                const state = get();
                finalRestaurantId = state.completeOnboardingData?.restaurant_id || localStorage.getItem('restaurant_id');
            }

            // Build the API URL with both parameters
            let apiUrl = `/restaurant/check-restaurant/?restaurant_name=${encodeURIComponent(restaurantName.trim())}`;
            if (finalRestaurantId) {
                apiUrl += `&restaurant_id=${encodeURIComponent(finalRestaurantId)}`;
            }
            
            const response = await apiGet(apiUrl);
                        
            // Check if restaurant exists (API should return true if exists, false if not)
            const exists = response.data?.exists || response.data?.restaurant_exists || false;
            
            set(() => ({
                restaurantNameCheckLoading: false,
                restaurantNameCheckError: null,
                restaurantNameExists: exists
            }));

            if (exists) {
                const errorMessage = 'Restaurant name already exists. Please choose a different name.';
                set(() => ({ restaurantNameCheckError: errorMessage }));
                return { exists: true, error: errorMessage };
            }

            return { exists: false, error: null };
        } catch (error) {
            console.error('❌ Error checking restaurant name:', error);
            
            let errorMessage = 'Failed to check restaurant name. Please try again.';
            
            if (error.response?.status === 400) {
                errorMessage = error.response.data?.message || 'Invalid restaurant name format.';
            } else if (error.response?.status === 500) {
                errorMessage = 'Server error occurred while checking restaurant name.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({
                restaurantNameCheckLoading: false,
                restaurantNameCheckError: errorMessage,
                restaurantNameExists: false
            }));
            
            return { exists: false, error: errorMessage };
        }
    },

    // Restaurant goals functionality
    restaurantGoalsLoading: false,
    restaurantGoalsError: null,
    restaurantGoals: null,

    getRestaurentGoal: async (restaurantId = null) => {
        const state = get();
        
        // Prevent multiple concurrent calls - if already loading, wait for existing request
        if (state.restaurantGoalsLoading) {
            // Wait for the existing request to complete
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    const currentState = get();
                    if (!currentState.restaurantGoalsLoading) {
                        clearInterval(checkInterval);
                        // Return the current data if available
                        resolve(currentState.restaurantGoals);
                    }
                }, 100);
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve(null);
                }, 10000);
            });
        }
        
        // Check if we already have goals data loaded for this restaurant
        if (state.restaurantGoals) {
            // Verify it's for the correct restaurant
            let finalRestaurantId = restaurantId;
            if (!finalRestaurantId) {
                finalRestaurantId = state.completeOnboardingData?.restaurant_id || localStorage.getItem('restaurant_id');
            }
            
            // If we have data and restaurant ID matches (or we don't have a specific ID to check), return cached data
            if (!restaurantId || !finalRestaurantId || state.restaurantGoals.restaurant_id === finalRestaurantId) {
                return state.restaurantGoals;
            }
        }
        
        set(() => ({ 
            restaurantGoalsLoading: true, 
            restaurantGoalsError: null 
        }));

        try {
            // Get restaurant_id from store or localStorage if not provided
            let finalRestaurantId = restaurantId;
            if (!finalRestaurantId) {
                finalRestaurantId = state.completeOnboardingData?.restaurant_id || localStorage.getItem('restaurant_id');
            }

            // If no restaurant ID found, this means the user is new and hasn't completed onboarding
            if (!finalRestaurantId) {
                set(() => ({
                    restaurantGoalsLoading: false,
                    restaurantGoalsError: 'Restaurant ID is required - please complete onboarding first',
                    restaurantGoals: null
                }));
                return null;
            }

            const response = await apiGet(`/restaurant/goals/?restaurant_id=${encodeURIComponent(finalRestaurantId)}`);
            
            set(() => ({
                restaurantGoalsLoading: false,
                restaurantGoalsError: null,
                restaurantGoals: response.data
            }));

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching restaurant goals:', error);
            
            let errorMessage = 'Failed to fetch restaurant goals. Please try again.';
            
            if (error.response?.status === 400) {
                errorMessage = error.response.data?.message || 'Invalid restaurant ID.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Restaurant goals not found.';
            } else if (error.response?.status === 500) {
                errorMessage = 'Server error occurred while fetching restaurant goals.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({
                restaurantGoalsLoading: false,
                restaurantGoalsError: errorMessage,
                restaurantGoals: null
            }));
            
            // Don't throw the error to prevent infinite loops in components
            console.warn('⚠️ Restaurant goals fetch failed:', errorMessage);
            return null;
        }
    },

    // Clear restaurant goals state
    clearRestaurantGoals: () => {
        set(() => ({
            restaurantGoalsLoading: false,
            restaurantGoalsError: null,
            restaurantGoals: null
        }));
    },

    // Clear all onboarding state (for logout)
    clearOnboarding: () => {
        // Clear restaurant_id from localStorage
        localStorage.removeItem('restaurant_id');
        
        // Clear session storage timestamps
        sessionStorage.removeItem('onboarding_completion_check_time');
        
        // Reset to initial state
        set(() => ({ 
            user: null,
            isOnBoardingCompleted: false,
            onboardingLoading: false,
            onboardingError: null,
            onboardingData: null,
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
                "Labor Information": {
                    status: false,
                    data: {
                        goal: "",
                        needs_attention: "",
                        danger: "",
                        labour_goal: 0,
                        avg_hourly_rate: 0,
                        labor_record_method: "daily_hours_costs",
                        daily_ticket_count: false,
                        forward_previous_week_rate: false
                    }
                },
                "Food Cost Details": {
                    status: false,
                    data: {
                        cogs_goal: "",
                        delivery_days: []
                    }
                },
                "Sales Channels": {
                    status: false,
                    data: {
                        in_store: true,
                        online: false,
                        from_app: false,
                        third_party: false,
                        providers: []
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
            tempFormData: {
                "Basic Information": {
                    restaurantData: {
                        restaurantName: "",
                        numberOfLocations: undefined,
                        locationName: "",
                        otherLocationName: ""
                    },
                    addressData: {
                        address1: "",
                        address2: "",
                        country: "",
                        state: "",
                        zipCode: ""
                    },
                    addressTypeData: {
                        sqft: "",
                        isFranchise: "",
                        royaltyPercentage: "",
                        advertisementFee: "",
                        restaurantType: "",
                        menuType: ""
                    }
                },
                "Labor Information": {
                    laborData: {
                        goal: "",
                        needs_attention: "",
                        danger: "",
                        avg_hourly_rate: 0,
                        labor_record_method: "daily_hours_costs",
                        daily_ticket_count: false,
                        forward_previous_week_rate: false
                    }
                },
                "Food Cost Details": {
                    foodCostData: {
                        cogs_goal: "",
                        delivery_days: []
                    }
                },
                "Sales Channels": {
                    salesData: {
                        in_store: true,
                        online: false,
                        from_app: false,
                        third_party: false,
                        providers: []
                    }
                },
                "Expense": {
                    expenseData: {
                        fixed_costs: [],
                        variable_costs: []
                    }
                }
            },
            // Clear restaurant goals state
            restaurantGoalsLoading: false,
            restaurantGoalsError: null,
            restaurantGoals: null,
            // Clear restaurant name check state
            restaurantNameCheckLoading: false,
            restaurantNameCheckError: null,
            restaurantNameExists: false
        }));
    },

    // Clear restaurant name check state
    clearRestaurantNameCheck: () => {
        set(() => ({
            restaurantNameCheckLoading: false,
            restaurantNameCheckError: null,
            restaurantNameExists: false
        }));
    },

    // Getter for restaurant name
    restaurantName: () => {
        const state = get();
        return state.completeOnboardingData?.["Basic Information"]?.data?.restaurant_name || "";
    },
});

export default createOnBoardingSlice;