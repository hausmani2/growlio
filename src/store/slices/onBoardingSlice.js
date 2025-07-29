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
        "Labour Information": {
            laborData: {
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
            foodCostData: {
                cogs_goal: "",
                use_third_party_delivery: false,
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
                apiData = {
                    restaurant_name: restaurantData.restaurantName,
                    number_of_locations: parseInt(restaurantData.numberOfLocations) || 1,
                    restaurant_type: addressTypeData.restaurantType,
                    menu_type: addressTypeData.menuType,
                    locations: [
                        {
                            name: restaurantData.locationName, // API expects 'name' not 'location_name'
                            address_1: addressData.address1,
                            address_2: addressData.address2,
                            country: addressData.country === "1" ? "USA" : addressData.country === "2" ? "Canada" : "UK",
                            state: addressData.state === "1" ? "CA" : addressData.state === "2" ? "NY" : "TX",
                            zip_code: addressData.zipCode,
                            sqft: parseInt(addressTypeData.sqft) || 0,
                            is_franchise: addressTypeData.isFranchise === "2"
                        }
                    ]
                };
                break;
            }
            case "Labour Information": {
                const { laborData } = tempData;
                apiData = {
                    goal: parseFloat(laborData.goal) || 0,
                    attention: parseFloat(laborData.needs_attention) || 0, // API expects 'attention'
                    danger: parseFloat(laborData.danger) || 0,
                    avg_hourly_rate: parseFloat(laborData.avg_hourly_rate) || 0,
                    labor_record_method: laborData.labor_record_method || "daily_hours_costs",
                    daily_ticket_count: laborData.daily_ticket_count || false,
                    forward_previous_week_rate: laborData.forward_prev_week_rate || false // API expects 'forward_previous_week_rate'
                };
                break;
            }
            case "Food Cost Details": {
                const { foodCostData } = tempData;
                apiData = {
                    cogs_goal: parseFloat(foodCostData.cogs_goal) || 0,
                    uses_third_party_delivery: foodCostData.use_third_party_delivery || false, // API expects 'uses_third_party_delivery'
                    delivery_days: foodCostData.delivery_days || []
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
            case "Labour Information": {
                const tempData = {
                    laborData: {
                        goal: savedData.goal?.toString() || "",
                        needs_attention: savedData.attention?.toString() || savedData.needs_attention?.toString() || "",
                        danger: savedData.danger?.toString() || "",
                        avg_hourly_rate: savedData.avg_hourly_rate || 0,
                        labor_record_method: savedData.labor_record_method || "daily_hours_costs",
                        daily_ticket_count: savedData.daily_ticket_count || false,
                        forward_prev_week_rate: savedData.forward_prev_week_rate || savedData.forward_previous_week_rate || false
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
                        use_third_party_delivery: savedData.use_third_party_delivery || savedData.uses_third_party_delivery || false,
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
                        third_party: savedData.third_party || false
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
            const response = await apiPost('/restaurant/onboarding/', currentData);
            
            console.log('Complete onboarding API response:', response);
            console.log('Response status:', response.status);
            
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
            
            console.log('✅ Complete onboarding API request successful with status 200');
            
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
            console.log('Response status:', response.status);
            
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
            
            console.log('✅ API request successful with status 200');
            
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
                console.log('✅ Step saved successfully with status 200, calling success callback for navigation');
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
        set(() => ({ onboardingLoading: true, onboardingError: null }));
        
        try {
            const response = await apiGet('/restaurant/onboarding/');
            
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
        set(() => ({ onboardingLoading: true, onboardingError: null }));
        
        try {
            console.log('🔄 Loading existing onboarding data from API...');
            
            // Add timeout to prevent infinite loading
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 15000)
            );
            
            const apiPromise = apiGet('/restaurant/onboarding/');
            const response = await Promise.race([apiPromise, timeoutPromise]);
            const apiData = response.data;
            
            console.log('📥 API Response:', apiData);
            
            if (!apiData) {
                console.log('❌ No data received from API');
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
            } else {
                // Handle object format (fallback)
                console.log('⚠️ API response is not in array format, treating as object');
                stepsData = Object.entries(apiData).map(([step, data]) => ({
                    step,
                    status: data.status,
                    data: data.data
                }));
            }
            
            console.log('📋 Processing steps data:', stepsData);
            
            // Process each step from the API response
            stepsData.forEach(stepInfo => {
                const { step: stepName, status, data, restaurant_id } = stepInfo;
                console.log(`📋 Processing step "${stepName}":`, { status, data, restaurant_id });
                
                // Extract restaurant_id from first step if available
                if (restaurant_id && !updatedOnboardingData.restaurant_id) {
                    updatedOnboardingData.restaurant_id = restaurant_id;
                    localStorage.setItem('restaurant_id', restaurant_id);
                    console.log('✅ Found restaurant_id:', restaurant_id);
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
                    console.log(`📋 Basic Information processed data:`, processedData);
                } else if (stepName === "Labour Information" && data) {
                    // Handle Labour Information data mapping
                    processedData = {
                        goal: data.goal || "",
                        needs_attention: data.attention || "", // API uses 'attention', we expect 'needs_attention'
                        danger: data.danger || "",
                        avg_hourly_rate: data.avg_hourly_rate || 0,
                        labor_record_method: data.labor_record_method || "daily_hours_costs",
                        daily_ticket_count: data.daily_ticket_count || false,
                        forward_prev_week_rate: data.forward_previous_week_rate || false // API uses 'forward_previous_week_rate'
                    };
                    console.log(`📋 Labour Information processed data:`, processedData);
                    console.log(`📋 Field mappings - API attention: ${data.attention} → Frontend needs_attention: ${processedData.needs_attention}`);
                    console.log(`📋 Field mappings - API forward_previous_week_rate: ${data.forward_previous_week_rate} → Frontend forward_prev_week_rate: ${processedData.forward_prev_week_rate}`);
                } else if (stepName === "Food Cost Details" && data) {
                    // Handle Food Cost Details data mapping
                    processedData = {
                        cogs_goal: data.cogs_goal || "",
                        use_third_party_delivery: data.uses_third_party_delivery || false, // API uses 'uses_third_party_delivery'
                        delivery_days: data.delivery_days || []
                    };
                    console.log(`📋 Food Cost Details processed data:`, processedData);
                    console.log(`📋 Field mappings - API uses_third_party_delivery: ${data.uses_third_party_delivery} → Frontend use_third_party_delivery: ${processedData.use_third_party_delivery}`);
                } else if (stepName === "Sales Channels" && data) {
                    // Handle Sales Channels data mapping
                    processedData = {
                        in_store: data.in_store !== undefined ? data.in_store : true,
                        online: data.online || false,
                        from_app: data.from_app || false,
                        third_party: data.third_party || false
                    };
                    console.log(`📋 Sales Channels processed data:`, processedData);
                } else if (stepName === "Expense" && data) {
                    // Handle Expense data mapping
                    processedData = {
                        fixed_costs: data.fixed_costs || [],
                        variable_costs: data.variable_costs || []
                    };
                    console.log(`📋 Expense processed data:`, processedData);
                }
                
                // Update the step data and status
                updatedOnboardingData[stepName] = {
                    status: status || false,
                    data: processedData
                };
                
                console.log(`✅ ${stepName} - Status: ${status}, Has Data: ${!!data}`);
            });
            
            // Update the store with the loaded data
            set(() => ({
                completeOnboardingData: updatedOnboardingData,
                onboardingLoading: false,
                onboardingError: null
            }));
            
            console.log('✅ Successfully loaded existing onboarding data');
            
            // Return information about completed and incomplete steps
            const steps = ["Basic Information", "Labour Information", "Food Cost Details", "Sales Channels", "Expense"];
            const completedSteps = steps.filter(stepName => 
                updatedOnboardingData[stepName]?.status === true
            );
            
            const incompleteSteps = steps.filter(stepName => 
                updatedOnboardingData[stepName]?.status === false
            );
            
            console.log('📊 Step Summary:', {
                completed: completedSteps,
                incomplete: incompleteSteps,
                total: steps.length
            });
            
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
            
            if (error.message === 'Request timeout') {
                errorMessage = 'Request timed out. Please check your connection and try again.';
            } else if (error.response?.status === 404) {
                errorMessage = 'No onboarding data found. Starting fresh setup.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentication required. Please log in again.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({ 
                loading: false, 
                error: errorMessage 
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
            
            console.log('Update onboarding API response:', response);
            console.log('Response status:', response.status);
            
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
            
            console.log('✅ Update onboarding API request successful with status 200');
            
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
        console.log('🗑️ Cleared restaurant_id from localStorage');
        
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
                "Labour Information": {
                    laborData: {
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
                    foodCostData: {
                        cogs_goal: "",
                        use_third_party_delivery: false,
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
            }
        }));
        
        console.log('🗑️ All onboarding state reset to initial values');
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
    
    // Check if onboarding is complete by calling the restaurants-onboarding API
    checkOnboardingCompletion: async () => {
        set(() => ({ loading: true, error: null }));
        
        try {
            console.log('🔄 Checking if onboarding is complete...');
            const response = await apiGet('/restaurant/restaurants-onboarding/');
            const onboardingData = response.data;

            console.log("onboardingData----------------", onboardingData);
            
            console.log('📥 Restaurants Onboarding API Response:', onboardingData);
            
            if (!onboardingData) {
                console.log('❌ No data received from restaurants-onboarding API');
                set(() => ({ onboardingLoading: false, onboardingError: null }));
                return { success: false, message: 'No onboarding data found' };
            }
            
            // Check if user has restaurants with completed onboarding
            if (onboardingData && onboardingData.restaurants && onboardingData.restaurants.length > 0) {
                const hasCompletedOnboarding = onboardingData.restaurants.some(restaurant => 
                    restaurant.onboarding_complete === true
                );
                
                if (hasCompletedOnboarding) {
                    console.log('✅ Onboarding is complete!');
                    set(() => ({ 
                        isOnBoardingCompleted: true,
                        onboardingLoading: false, 
                        onboardingError: null 
                    }));
                    
                    return { 
                        success: true, 
                        isComplete: true,
                        message: 'Onboarding completed successfully!'
                    };
                } else {
                    console.log('⚠️ Onboarding is not yet complete');
                    set(() => ({ 
                        isOnBoardingCompleted: false,
                        onboardingLoading: false, 
                        onboardingError: null 
                    }));
                    
                    return { 
                        success: true, 
                        isComplete: false,
                        message: 'Onboarding not yet complete'
                    };
                }
            } else {
                console.log('⚠️ No restaurants found in response');
                set(() => ({ 
                    isOnBoardingCompleted: false,
                    onboardingLoading: false, 
                    onboardingError: null 
                }));
                
                return { 
                    success: true, 
                    isComplete: false,
                    message: 'No restaurants found'
                };
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
        }
    },
    
    // Manually refresh existing onboarding data (useful for debugging or manual refresh)
    refreshExistingOnboardingData: async () => {
        console.log('🔄 Manually refreshing existing onboarding data...');
        return await get().loadExistingOnboardingData();
    },
    
    // Get detailed step status information
    getStepStatusInfo: () => {
        const state = get();
        const data = state.completeOnboardingData;
        
        const steps = ["Basic Information", "Labour Information", "Food Cost Details", "Sales Channels", "Expense"];
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