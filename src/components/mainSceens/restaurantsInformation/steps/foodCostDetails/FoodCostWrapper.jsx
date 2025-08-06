import { useState, useEffect } from "react";
import { message } from "antd";
import FoodCostDetails from "./FoodCostDetails";
import DeliveryFrequency from "./DeliveryFrequency";
import ThirdPartyProviders from "./ThirdPartyProviders";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";
import { useLocation } from "react-router-dom";

const FoodCostWrapperContent = () => {
    const location = useLocation();
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData } = useStore();
    const { validationErrors, clearFieldError, validateFoodCostDetails, setValidationErrors, clearAllErrors } = useStepValidation();
    const { navigateToNextStep } = useTabHook();
    
    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    // State for Food Cost Details
    const [foodCostData, setFoodCostData] = useState({
        cogs_goal: ""
    });

    // State for Delivery Frequency
    const [deliveryData, setDeliveryData] = useState({
        selectedDays: {}
    });

    // State for Third Party Providers
    const [thirdPartyData, setThirdPartyData] = useState({
        providers: [],
        useHiredPartyDelivery: 'false' // Default to false
    });

    // Combined state for API
    const [combinedData, setCombinedData] = useState({
        cogs_goal: "",
        use_third_party_delivery: false, // Default to false
        delivery_days: []
    });

    // Load saved data when component mounts or when completeOnboardingData changes
    useEffect(() => {
        const foodCostInfoData = completeOnboardingData["Food Cost Details"];
        
        if (foodCostInfoData && foodCostInfoData.data) {
            const data = foodCostInfoData.data;
            
            setFoodCostData(prev => ({
                ...prev,
                cogs_goal: data.cogs_goal ? data.cogs_goal.toString() : ""
            }));
            
            setCombinedData(prev => ({
                ...prev,
                cogs_goal: data.cogs_goal ? data.cogs_goal.toString() : "",
                use_third_party_delivery: data.use_third_party_delivery || false,
                delivery_days: data.delivery_days || []
            }));
            
            // Set delivery days
            if (data.delivery_days && Array.isArray(data.delivery_days)) {
                const selectedDays = {};
                data.delivery_days.forEach(day => {
                    // Convert to proper case for display
                    const dayName = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
                    selectedDays[dayName] = true;
                });
                setDeliveryData(prev => ({
                    ...prev,
                    selectedDays
                }));
            }
            
            // Set third party providers data
            if (data.providers && Array.isArray(data.providers)) {
                const providersData = data.providers.map((provider, index) => ({
                    id: index + 1,
                    providerName: provider.provider_name || "",
                    providerFee: provider.provider_fee || ""
                }));
                
                setThirdPartyData(prev => ({
                    ...prev,
                    providers: providersData.length > 0 ? providersData : [{ id: 1, providerName: '', providerFee: '' }],
                    useHiredPartyDelivery: data.use_third_party_delivery ? 'true' : 'false'
                }));
            } else {
                // Set default third party data
                setThirdPartyData(prev => ({
                    ...prev,
                    providers: [{ id: 1, providerName: '', providerFee: '' }],
                    useHiredPartyDelivery: data.use_third_party_delivery ? 'true' : 'false'
                }));
            }
            
            // Update combined data with third party delivery status
            setCombinedData(prev => ({
                ...prev,
                use_third_party_delivery: data.use_third_party_delivery || false
            }));
        } else {
        }
    }, [completeOnboardingData]);

    // Clear error when component mounts
    useEffect(() => {
        clearError();
    }, [clearError]);

    // Show error message when there's an error
    useEffect(() => {
        if (error) {
            message.error(error);
        }
    }, [error]);

    // Function to update food cost data
    const updateFoodCostData = (field, value) => {
        setFoodCostData(prev => ({
            ...prev,
            [field]: value
        }));
        setCombinedData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear validation error for this field when user starts typing
        if (validationErrors[field]) {
            clearFieldError(field);
        }
    };

    // Function to update delivery data
    const updateDeliveryData = (field, value) => {
        setDeliveryData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Update combined data
        if (field === 'selectedDays') {
            const selectedDays = Object.keys(value).filter(day => value[day]);
            setCombinedData(prev => ({
                ...prev,
                delivery_days: selectedDays,
                use_third_party_delivery: selectedDays.length > 0
            }));
        }
        // Clear validation error for this field when user starts typing
        if (validationErrors[field]) {
            clearFieldError(field);
        }
    };

    // Function to update third party data
    const updateThirdPartyData = (field, value) => {
        console.log('🔍 Debug - updateThirdPartyData called with field:', field, 'value:', value);
        setThirdPartyData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Update combined data when useHiredPartyDelivery changes
        if (field === 'useHiredPartyDelivery') {
            console.log('🔍 Debug - Updating combined data with use_third_party_delivery:', value === 'true');
            setCombinedData(prev => ({
                ...prev,
                use_third_party_delivery: value === 'true'
            }));
        }
        
        // Clear validation error for this field when user starts typing
        if (validationErrors[field]) {
            clearFieldError(field);
        }
    };

    // Function to handle save and continue
    const handleSaveAndContinue = async () => {
        try {
            
            // Step 1: Prepare comprehensive data for validation
            const validationData = {
                ...combinedData,
                selectedDays: deliveryData.selectedDays,
                providers: thirdPartyData.providers,
                useHiredPartyDelivery: thirdPartyData.useHiredPartyDelivery
            };
            
            
            // Step 2: Validate form
            const validationResult = validateFoodCostDetails(validationData);
            
            if (!validationResult || Object.keys(validationResult).length > 0) {
                // Set validation errors in state so they display in UI
                setValidationErrors(validationResult);
                message.error("Please fill in all required fields correctly");
                return { success: false, error: "Validation failed" };
            }

            // Step 3: Prepare data for API
            const cogsGoalClean = combinedData.cogs_goal ? combinedData.cogs_goal.toString().replace('%', '') : '';
            
            // Prepare providers data for API
            let providersForAPI = [];
            if (thirdPartyData.useHiredPartyDelivery === 'true' && thirdPartyData.providers) {
                providersForAPI = thirdPartyData.providers
                    .filter(provider => provider.providerName && provider.providerFee) // Only include providers with both name and fee
                    .map(provider => ({
                        provider_name: provider.providerName,
                        provider_fee: provider.providerFee
                    }));
            }
            
            const stepData = {
                cogs_goal: parseFloat(cogsGoalClean) || 0,
                uses_third_party_delivery: combinedData.use_third_party_delivery || false,
                delivery_days: combinedData.delivery_days.map(day => day.toLowerCase()) || [],
                providers: providersForAPI // Include providers array in API payload
            };

            console.log('🔍 Debug - Step data being sent to API:', stepData);
            console.log('🔍 Debug - Third party delivery value:', combinedData.use_third_party_delivery);
            console.log('🔍 Debug - Third party data state:', thirdPartyData);
            
            // Step 4: Call API through Zustand store with success callback
            const result = await submitStepData("Food Cost Details", stepData, (responseData) => {
                // Success callback - handle navigation based on mode
                
                // Check if restaurant_id was returned and log it
                if (responseData && responseData.restaurant_id) {
                }
                
                // Step 5: Handle navigation based on mode
                if (isUpdateMode) {
                    // In update mode, stay on the same page or go to dashboard
                    message.success("Food cost details updated successfully!");
                } else {
                    // In onboarding mode, navigate to next step
                    message.success("Food cost details saved successfully!");
                    navigateToNextStep();
                }
            });
            
            // Step 6: Handle success
            if (result.success) {
                // Clear all validation errors on successful save
                clearAllErrors();
                return { success: true, data: result.data };
            } else {
                message.error("Failed to save food cost details. Please try again.");
                return { success: false, error: "API call failed" };
            }
        } catch (error) {
            console.error("Error saving food cost details:", error);
            
            // Show user-friendly error message
            const errorMessage = error.message || "An unexpected error occurred. Please try again.";
            message.error(errorMessage);
            
            return { success: false, error: errorMessage };
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {isUpdateMode && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Update Mode</h3>
                    <p className="text-blue-700">
                        You are updating your food cost details. Changes will be saved when you click "Save & Continue".
                    </p>
                </div>
            )}
            
            <FoodCostDetails 
                data={foodCostData}
                updateData={updateFoodCostData}
                errors={validationErrors}
            />
            <ThirdPartyProviders
                data={thirdPartyData}
                updateData={updateThirdPartyData}
                errors={validationErrors}
            />
            <DeliveryFrequency 
                data={deliveryData}
                updateData={updateDeliveryData}
                onSaveAndContinue={handleSaveAndContinue}
                errors={validationErrors}
                loading={loading}
            />
            
            <div className="flex justify-between mt-6">
                {isUpdateMode && (
                    <>
                <div className="ml-auto">
                    <button
                        onClick={handleSaveAndContinue}
                        className="bg-orange-300 text-white px-6 py-2 rounded-lg hover:bg-orange-500 transition-colors"
                        >
                        {isUpdateMode ? "Save Changes" : "Save & Continue"}
                    </button>
                </div>
                        </>
                    )}
            </div>
        </div>
    );
};

const FoodCostWrapper = () => {
    return (
        <TabProvider>
            <FoodCostWrapperContent />
        </TabProvider>
    );
};

export default FoodCostWrapper;