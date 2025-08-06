import { useState, useEffect } from "react";
import { message } from "antd";
import LaborInformation from "./LaborInformation";
import LaborEntryMethod from "./LaborEntryMethod";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";
import { useLocation } from "react-router-dom";

const LaborInformationWrapperContent = () => {
    const location = useLocation();
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData } = useStore();
    const { validationErrors, clearFieldError, validateStep } = useStepValidation();
    const { navigateToNextStep } = useTabHook();

    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');

    // State for labor data
    const [laborData, setLaborData] = useState({
        labour_goal: '',
        avg_hourly_rate: '',
        labor_record_method: 'daily_hours_costs',
        daily_ticket_count: '',
        forward_prev_week_rate: ''
    });

    // Load saved data when component mounts or when completeOnboardingData changes
    useEffect(() => {
        const labourInfoData = completeOnboardingData["Labour Information"];
        if (labourInfoData && labourInfoData.data) {
            const data = labourInfoData.data;

            setLaborData(prev => ({
                ...prev,
                labour_goal: data.labour_goal?.toString() || '',
                avg_hourly_rate: data.avg_hourly_rate?.toString() || '',
                labor_record_method: data.labor_record_method || 'daily_hours_costs',
                daily_ticket_count: data.daily_ticket_count ? "2" : "1",
                forward_prev_week_rate: data.forward_prev_week_rate ? "2" : "1"
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

    const updateLaborData = (field, value) => {
        setLaborData(prev => ({
            ...prev,
            [field]: value
        }));
        clearFieldError(field);
    };

    // Function to handle save and continue
    const handleSaveAndContinue = async () => {
        try {
            console.log("=== Labour Information Save & Continue ===");
            console.log("Current laborData:", laborData);

            // Step 1: Validate form
            const validationResult = validateStep('Labour Information', laborData);
            console.log("Validation result:", validationResult);
            console.log("Validation passed:", validationResult);

            if (!validationResult) {
                console.log("Validation failed with errors:", validationErrors);
                message.error("Please fill in all required fields correctly");
                return { success: false, error: "Validation failed" };
            }

            // Step 2: Prepare data for API
            const stepData = {
                goal:"0",
                needs_attention:"0",
                danger:"0",
                labour_goal: laborData.labour_goal,
                avg_hourly_rate: parseFloat(laborData.avg_hourly_rate) || 0,
                labor_record_method: laborData.labor_record_method,
                daily_ticket_count: laborData.daily_ticket_count === "2",
                forward_prev_week_rate: laborData.forward_prev_week_rate === "2"
            };

            console.log("Prepared stepData for API:", stepData);

            // Step 3: Call API through Zustand store with success callback
            console.log("Calling submitStepData...");
            const result = await submitStepData("Labour Information", stepData, (responseData) => {
                // Success callback - handle navigation based on mode
                console.log("✅ Labour Information saved successfully");

                // Check if restaurant_id was returned and log it
                if (responseData && responseData.restaurant_id) {
                    console.log("✅ Restaurant ID received:", responseData.restaurant_id);
                }

                // Step 4: Handle navigation based on mode
                if (isUpdateMode) {
                    // In update mode, stay on the same page or go to dashboard
                    console.log("🔄 Update mode - staying on current page");
                    message.success("Labour information updated successfully!");
                } else {
                    // In onboarding mode, navigate to next step
                    console.log("🔄 Onboarding mode - navigating to next step");
                    message.success("Labor information saved successfully!");
                    navigateToNextStep();
                }
            });
            console.log("submitStepData result:", result);

            // Step 4: Handle success
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                message.error("Failed to save labor information. Please try again.");
                return { success: false, error: "API call failed" };
            }
        } catch (error) {
            console.error("Error saving labor information:", error);

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
                        You are updating your labour information. Changes will be saved when you click "Save & Continue".
                    </p>
                </div>
            )}

            <LaborInformation
                data={laborData}
                updateData={updateLaborData}
                errors={validationErrors}
            />
            <LaborEntryMethod
                data={laborData}
                updateData={updateLaborData}
                errors={validationErrors}
                onSaveAndContinue={handleSaveAndContinue}
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

const LaborInformationWrapper = () => {
    return (
        <TabProvider>
            <LaborInformationWrapperContent />
        </TabProvider>
    );
};

export default LaborInformationWrapper;