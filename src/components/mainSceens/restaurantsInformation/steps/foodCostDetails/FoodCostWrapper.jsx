import { useState, useEffect } from "react";
import { message } from "antd";
import FoodCostDetails from "./FoodCostDetails";
import DeliveryFrequency from "./DeliveryFrequency";
import ThirdPartyProviders from "./ThirdPartyProviders";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";
import { useNavigate, useLocation } from "react-router-dom";

const FoodCostWrapperContent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData } = useStore();
    const { validationErrors, clearFieldError, validateFoodCostDetails } = useStepValidation();
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
        providers: []
    });

    // Combined state for API
    const [combinedData, setCombinedData] = useState({
        cogs_goal: "",
        use_third_party_delivery: false,
        delivery_days: []
    });

    // Load saved data when component mounts or when completeOnboardingData changes
    useEffect(() => {
        const foodCostInfoData = completeOnboardingData["Food Cost Details"];
        console.log("=== Loading Food Cost Details Data ===");
        console.log("completeOnboardingData:", completeOnboardingData);
        console.log("foodCostInfoData:", foodCostInfoData);
        
        if (foodCostInfoData && foodCostInfoData.data) {
            const data = foodCostInfoData.data;
            console.log("Food Cost Details data from API:", data);
            
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
                console.log("Loading delivery_days:", data.delivery_days);
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
        } else {
            console.log("❌ No Food Cost Details data found in completeOnboardingData");
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
        clearFieldError(field);
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
            console.log("Selected days for API:", selectedDays);
            setCombinedData(prev => ({
                ...prev,
                delivery_days: selectedDays,
                use_third_party_delivery: selectedDays.length > 0
            }));
        }
        clearFieldError(field);
    };

    // Function to update third party data
    const updateThirdPartyData = (field, value) => {
        setThirdPartyData(prev => ({
            ...prev,
            [field]: value
        }));
        clearFieldError(field);
    };

    // Function to handle save and continue
    const handleSaveAndContinue = async () => {
        try {
            console.log("=== Food Cost Details Save & Continue ===");
            console.log("Current combinedData:", combinedData);
            console.log("Current foodCostData:", foodCostData);
            console.log("Current deliveryData:", deliveryData);
            console.log("Current thirdPartyData:", thirdPartyData);
            
            // Step 1: Validate form
            const validationResult = validateFoodCostDetails(combinedData);
            console.log("Validation result:", validationResult);
            console.log("Validation passed:", Object.keys(validationResult).length === 0);
            
            if (!validationResult || Object.keys(validationResult).length > 0) {
                console.log("Validation failed with errors:", validationResult);
                message.error("Please fill in all required fields correctly");
                return { success: false, error: "Validation failed" };
            }

            // Step 2: Prepare data for API
            const cogsGoalClean = combinedData.cogs_goal ? combinedData.cogs_goal.toString().replace('%', '') : '';
            const stepData = {
                cogs_goal: parseFloat(cogsGoalClean) || 0,
                use_third_party_delivery: combinedData.use_third_party_delivery || false,
                delivery_days: combinedData.delivery_days.map(day => day.toLowerCase()) || []
            };
            
            console.log("Prepared stepData for API:", stepData);
            console.log("Original cogs_goal:", combinedData.cogs_goal);
            console.log("Cleaned cogs_goal:", cogsGoalClean);
            console.log("Final cogs_goal for API:", stepData.cogs_goal);
            console.log("delivery_days:", stepData.delivery_days);
            
            // Step 3: Call API through Zustand store with success callback
            console.log("Calling submitStepData...");
            const result = await submitStepData("Food Cost Details", stepData, (responseData) => {
                // Success callback - handle navigation based on mode
                console.log("✅ Food Cost Details saved successfully");
                
                // Check if restaurant_id was returned and log it
                if (responseData && responseData.restaurant_id) {
                    console.log("✅ Restaurant ID received:", responseData.restaurant_id);
                }
                
                // Step 4: Handle navigation based on mode
                if (isUpdateMode) {
                    // In update mode, stay on the same page or go to dashboard
                    console.log("🔄 Update mode - staying on current page");
                    message.success("Food cost details updated successfully!");
                } else {
                    // In onboarding mode, navigate to next step
                    console.log("🔄 Onboarding mode - navigating to next step");
                    message.success("Food cost details saved successfully!");
                    navigateToNextStep();
                }
            });
            console.log("submitStepData result:", result);
            
            // Step 4: Handle success
            if (result.success) {
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
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                )}
                <div className="ml-auto">
                    <button
                        onClick={handleSaveAndContinue}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {isUpdateMode ? "Save Changes" : "Save & Continue"}
                    </button>
                </div>
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