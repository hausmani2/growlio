import { useState, useEffect } from "react";
import { message } from "antd";
import SalesChannel from "./SalesChannel";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";
import { useNavigate, useLocation } from "react-router-dom";

const SalesChannelsWrapperContent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData } = useStore();
    const { validationErrors, clearFieldError, validateSalesChannels } = useStepValidation();
    const { navigateToNextStep } = useTabHook();

    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');

    // State for Sales Channels
    const [salesChannelsData, setSalesChannelsData] = useState({
        in_store: true,
        online: false,
        from_app: false,
        third_party: false
    });

    // Load saved data when component mounts or when completeOnboardingData changes
    useEffect(() => {
        const salesChannelsInfoData = completeOnboardingData["Sales Channels"];
        if (salesChannelsInfoData && salesChannelsInfoData.data) {
            const data = salesChannelsInfoData.data;

            setSalesChannelsData(prev => ({
                ...prev,
                in_store: data.in_store || true,
                online: data.online || false,
                from_app: data.from_app || false,
                third_party: data.third_party || false
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

    // Function to update sales channels data
    const updateSalesChannelsData = (field, value) => {
        setSalesChannelsData(prev => ({
            ...prev,
            [field]: value
        }));
        clearFieldError(field);
    };

    // Function to handle save and continue
    const handleSaveAndContinue = async () => {
        try {
            // Step 1: Validate form
            if (!validateSalesChannels(salesChannelsData)) {
                message.error("Please select at least one sales channel");
                return { success: false, error: "Validation failed" };
            }

            // Step 2: Prepare data for API
            const stepData = {
                in_store: salesChannelsData.in_store,
                online: salesChannelsData.online,
                from_app: salesChannelsData.from_app,
                third_party: salesChannelsData.third_party
            };

            console.log("Submitting Sales Channels data:", stepData);

            // Step 3: Call API through Zustand store with success callback
            const result = await submitStepData("Sales Channels", stepData, (responseData) => {
                // Success callback - handle navigation based on mode
                console.log("✅ Sales Channels saved successfully");

                // Check if restaurant_id was returned and log it
                if (responseData && responseData.restaurant_id) {
                    console.log("✅ Restaurant ID received:", responseData.restaurant_id);
                }

                // Step 4: Handle navigation based on mode
                if (isUpdateMode) {
                    // In update mode, stay on the same page or go to dashboard
                    console.log("🔄 Update mode - staying on current page");
                    message.success("Sales channels updated successfully!");
                } else {
                    // In onboarding mode, navigate to next step
                    console.log("🔄 Onboarding mode - navigating to next step");
                    message.success("Sales channels saved successfully!");
                    navigateToNextStep();
                }
            });

            // Step 4: Handle success
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                message.error("Failed to save sales channels. Please try again.");
                return { success: false, error: "API call failed" };
            }
        } catch (error) {
            console.error("Error saving sales channels:", error);

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
                        You are updating your sales channels. Changes will be saved when you click "Save & Continue".
                    </p>
                </div>
            )}

            <SalesChannel
                data={salesChannelsData}
                updateData={updateSalesChannelsData}
                errors={validationErrors}
                onSaveAndContinue={handleSaveAndContinue}
                loading={loading}
            />

            <div className="flex justify-between mt-6">
                {isUpdateMode && (
                    <>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                        <div className="ml-auto">
                            <button
                                onClick={handleSaveAndContinue}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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

const SalesChannelsWrapper = () => {
    return (
        <TabProvider>
            <SalesChannelsWrapperContent />
        </TabProvider>
    );
};

export default SalesChannelsWrapper;