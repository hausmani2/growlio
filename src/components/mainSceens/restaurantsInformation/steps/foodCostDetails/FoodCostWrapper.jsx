import { useState, useEffect } from "react";
import { message } from "antd";
import FoodCostDetails from "./FoodCostDetails";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../../../../layout/LoadingSpinner";
import OnboardingBreadcrumb from "../../../../common/OnboardingBreadcrumb";

const FoodCostWrapperContent = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData } = useStore();
    const { validationErrors, clearFieldError, validateFoodCostDetails, setValidationErrors, clearAllErrors } = useStepValidation();
    const { navigateToNextStep, activeTab, tabs } = useTabHook();
    
    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);
    
    // State for Food Cost Details
    const [foodCostData, setFoodCostData] = useState({
        cogs_goal: "30%" // Default to 30%
    });

    // Combined state for API
    const [combinedData, setCombinedData] = useState({
        cogs_goal: "30%" // Default to 30%
    });

    // Load saved data when component mounts or when completeOnboardingData changes
    useEffect(() => {
        const foodCostInfoData = completeOnboardingData["Food Cost Details"];
        
        if (foodCostInfoData && foodCostInfoData.data) {
            const data = foodCostInfoData.data;
            
            setFoodCostData(prev => ({
                ...prev,
                cogs_goal: data.cogs_goal ? (data.cogs_goal.toString().includes('%') ? data.cogs_goal.toString() : `${data.cogs_goal}%`) : prev.cogs_goal || "30%"
            }));
            
            setCombinedData(prev => ({
                ...prev,
                cogs_goal: data.cogs_goal ? (data.cogs_goal.toString().includes('%') ? data.cogs_goal.toString() : `${data.cogs_goal}%`) : prev.cogs_goal || "30%"
            }));
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


    // Function to handle save and continue
    const handleSaveAndContinue = async () => {
        try {
            
            // Step 1: Validate form - check if cogs_goal is filled
            if (!combinedData.cogs_goal || combinedData.cogs_goal.trim() === '' || combinedData.cogs_goal === '0%') {
                message.error("Please fill all the field");
                setValidationErrors({ cogs_goal: "COGS goal is required" });
                return { success: false, error: "COGS goal is required" };
            }

            // Step 2: Prepare data for API
            const cogsGoalClean = combinedData.cogs_goal ? combinedData.cogs_goal.toString().replace('%', '') : '';
            
            const stepData = {
                cogs_goal: parseFloat(cogsGoalClean) || 0
            };

            
            
            // Step 4: Call API through Zustand store with success callback
            const result = await submitStepData("Food Cost Details", stepData, (responseData) => {
                // Success callback - handle navigation based on mode
                
                // Check if restaurant_id was returned and log it
                if (responseData && responseData.restaurant_id) {
                    // Restaurant ID is available if needed
                }
                
                // Step 5: Handle navigation based on mode
                if (isUpdateMode) {
                    // In update mode, stay on the same page or go to dashboard
                    message.success("Food cost details updated successfully!");
                } else {
                    // In onboarding mode, navigate to next step
                    message.success("Food cost details saved successfully!");
                    navigateToNextStep(true); // Skip completion check since we just saved successfully
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

    // Show loading spinner overlay when loading
    if (loading) {
        return (
            <div className="relative">
                <div className="absolute inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
                    <LoadingSpinner 
                        message="Saving food cost details..." 
                        size="medium" 
                        subtext="Please wait while we save your changes..."
                        showSubtext={true}
                    />
                </div>
                <div className="opacity-50 pointer-events-none">
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
                        
                        <div className="flex justify-end gap-3 mt-8 pt-6">
                            <button
                                onClick={() => {
                                    navigate('/dashboard/third-party-delivery');
                                }}
                                disabled={loading}
                                className={`bg-gray-200 text-gray-700 px-8 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold ${
                                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'
                                }`}
                            >
                                Skip
                            </button>
                            {isUpdateMode && (
                                <button
                                    onClick={handleSaveAndContinue}
                                    disabled={loading}
                                    className={`bg-orange-500 text-white px-8 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold ${
                                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'
                                    }`}
                                >
                                    {loading && (
                                        <div className="animate-spin rounded-full border-b-2 border-white h-4 w-4"></div>
                                    )}
                                    Save Changes
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto">
            {/* Header Section with same styling as dashboard */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                <OnboardingBreadcrumb 
                    currentStep="Food Cost Details"
                    description="Set up your food cost management including COGS goals."
                />
            </div>
            
            {/* Content Section */}
            <div className="space-y-6">
                <FoodCostDetails 
                    data={foodCostData}
                    updateData={updateFoodCostData}
                    errors={validationErrors}
                />
            </div>
            
            <div className="flex justify-end gap-3 mt-8 pt-6">
                <button
                    onClick={() => {
                        navigate('/dashboard/third-party-delivery');
                    }}
                    disabled={loading}
                    className={`bg-gray-200 text-gray-700 px-8 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold ${
                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'
                    }`}
                >
                    Skip
                </button>
                {isUpdateMode && (
                    <button
                        onClick={handleSaveAndContinue}
                        disabled={loading}
                        className={`bg-orange-500 text-white px-8 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold ${
                            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'
                        }`}
                    >
                        {loading && (
                            <div className="animate-spin rounded-full border-b-2 border-white h-4 w-4"></div>
                        )}
                        Save Changes
                    </button>
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