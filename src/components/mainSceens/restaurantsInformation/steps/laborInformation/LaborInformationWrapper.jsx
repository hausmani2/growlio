import { useState, useEffect } from "react";
import { message } from "antd";
import LaborInformation from "./LaborInformation";
import LaborEntryMethod from "./LaborEntryMethod";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../../../../layout/LoadingSpinner";
import OnboardingBreadcrumb from "../../../../common/OnboardingBreadcrumb";

const LaborInformationWrapperContent = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData } = useStore();
    const { validationErrors, clearFieldError, validateStep } = useStepValidation();
    const { navigateToNextStep, activeTab, tabs } = useTabHook();

    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // State for labor data
    const [laborData, setLaborData] = useState({
        labour_goal: '28', // Default to 28%
        avg_hourly_rate: '',
        labor_record_method: 'daily_hours_costs',
        daily_ticket_count: false,
        forward_previous_week_rate: false // Always default to false
    });

    // Load saved data when component mounts or when completeOnboardingData changes
    useEffect(() => {
        const labourInfoData = completeOnboardingData["Labor Information"];
        
        if (labourInfoData && labourInfoData.data) {
            const data = labourInfoData.data;

            setLaborData(prev => {
                const newData = {
                    ...prev,
                    labour_goal: data.goal ? Math.round(parseFloat(data.goal)).toString() : data.labour_goal ? Math.round(parseFloat(data.labour_goal)).toString() : prev.labour_goal || '28',
                    avg_hourly_rate: data.avg_hourly_rate?.toString() || '',
                    labor_record_method: data.labor_record_method || 'daily_hours_costs',
                    daily_ticket_count: data.daily_ticket_count,
                    forward_previous_week_rate: data.forward_previous_week_rate !== undefined ? data.forward_previous_week_rate : (data.forward_prev_week_rate !== undefined ? data.forward_prev_week_rate : false) // Default to true if not set
                };
                return newData;
            });
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
        setLaborData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };
            return newData;
        });
        clearFieldError(field);
    };

    // Function to handle save and continue
    const handleSaveAndContinue = async () => {
        try {

            // Step 1: Validate form
            const validationResult = validateStep('Labor Information', laborData);

            if (!validationResult) {
                message.error("Please fill in all required fields correctly");
                return { success: false, error: "Validation failed" };
            }

            // Additional check for labour_goal
            if (!laborData.labour_goal || laborData.labour_goal.trim() === '') {
                message.error("Please select a labor goal percentage");
                return { success: false, error: "Labor goal is required" };
            }

            // Step 2: Prepare data for API
            
            const stepData = {
                labour_goal: laborData.labour_goal,
                danger:"0",
                needs_attention:"0",
                avg_hourly_rate: parseFloat(laborData.avg_hourly_rate) || 0,
                labor_record_method: laborData.labor_record_method,
                daily_ticket_count: laborData.daily_ticket_count,
                forward_previous_week_rate: false // Always set to true by default
            };

            // Step 3: Call API through Zustand store with success callback
            const result = await submitStepData("Labor Information", stepData, (responseData) => {
                // Success callback - handle navigation based on mode

                // Step 4: Handle navigation based on mode
                if (isUpdateMode) {
                    // In update mode, stay on the same page or go to dashboard
                    message.success("Labor information updated successfully!");
                } else {
                    // In onboarding mode, navigate to next step
                    message.success("Labor information saved successfully!");
                    navigateToNextStep(true); // Skip completion check since we just saved successfully
                }
            });

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

    // Show loading spinner overlay when loading
    if (loading) {
        return (
            <div className="relative">
                <div className="absolute inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
                    <LoadingSpinner 
                        message="Saving labor information..." 
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

                        <div className="flex justify-end gap-3 mt-8 pt-6">
                            <button
                                onClick={() => {
                                   
                                    navigate('/dashboard/food-cost-details');
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
                    currentStep="Labor Information"
                    description="Configure your labor management settings including goals, hourly rates, and recording methods."
                />
            </div>

            {/* Content Section */}
            <div className="space-y-6">
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
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6">
                <button
                    onClick={() => {
                        navigate('/dashboard/food-cost-details');
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

const LaborInformationWrapper = () => {
    return (
        <TabProvider>
            <LaborInformationWrapperContent />
        </TabProvider>
    );
};

export default LaborInformationWrapper;