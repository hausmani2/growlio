import { useState, useEffect } from "react";
import { message } from "antd";
import SalesChannel from "./SalesChannel";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../../../../layout/LoadingSpinner";
import OnboardingBreadcrumb from "../../../../common/OnboardingBreadcrumb";
import SalesDays from "./SalesDays";

const SalesChannelsWrapperContent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData, loadExistingOnboardingData } = useStore();
    const { validationErrors, clearFieldError, validateStep } = useStepValidation();
    const { navigateToNextStep } = useTabHook();

    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');

    // State for Sales Channels
    const [salesChannelsData, setSalesChannelsData] = useState({
        in_store: true,
        online: false,
        from_app: false,
        third_party: false,
        providers: [],
        selectedDays: {
            Sunday: true,
            Monday: true,
            Tuesday: true,
            Wednesday: true,
            Thursday: true,
            Friday: true,
            Saturday: true
        }
    });

    // Load saved data when component mounts or when completeOnboardingData changes
    useEffect(() => {
        console.log("🔄 useEffect triggered - completeOnboardingData changed:", completeOnboardingData);
        console.log("🔄 completeOnboardingData keys:", Object.keys(completeOnboardingData || {}));
        
        const salesChannelsInfoData = completeOnboardingData["Sales Channels"];
        console.log("📋 Sales Channels data from store:", salesChannelsInfoData);
        
        if (salesChannelsInfoData && salesChannelsInfoData.data) {
            const data = salesChannelsInfoData.data;
            console.log("📊 Raw data from API:", data);

            // Handle restaurant days - if days are returned from API, they are CLOSED days
            // If no days are returned, all days are OPEN by default
            let selectedDays = {
                Sunday: true,
                Monday: true,
                Tuesday: true,
                Wednesday: true,
                Thursday: true,
                Friday: true,
                Saturday: true
            };

            // If restaurant_days is returned from API, those are the CLOSED days
            if (data.restaurant_days && Array.isArray(data.restaurant_days)) {
                console.log("📅 Loading restaurant days from API:", data.restaurant_days);
                // Mark returned days as CLOSED (false)
                data.restaurant_days.forEach(day => {
                    const dayName = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
                    if (selectedDays.hasOwnProperty(dayName)) {
                        selectedDays[dayName] = false; // Closed
                        console.log(`🔒 Marking ${dayName} as CLOSED`);
                    }
                });
            } else {
                console.log("📅 No restaurant_days in API response, all days will be OPEN by default");
            }

            console.log("📅 Final selectedDays state:", selectedDays);
            setSalesChannelsData(prev => {
                console.log("🔄 Previous state:", prev);
                const newState = {
                    ...prev,
                    in_store: data.in_store || true,
                    online: data.online || false,
                    from_app: data.from_app || false,
                    third_party: data.third_party || false,
                    providers: data.providers || [],
                    selectedDays: selectedDays
                };
                console.log("🔄 New state:", newState);
                return newState;
            });
        } else {
            console.log("❌ No Sales Channels data found in completeOnboardingData");
            console.log("❌ completeOnboardingData is:", completeOnboardingData);
        }
    }, [completeOnboardingData]);

    // Load data when component mounts
    useEffect(() => {
        console.log("🚀 Component mounted - loading existing data...");
        const loadData = async () => {
            try {
                const result = await loadExistingOnboardingData();
                console.log("🚀 Load data result:", result);
            } catch (error) {
                console.error("🚀 Error loading data:", error);
            }
        };
        loadData();
    }, [loadExistingOnboardingData]);

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
        if (field === 'selectedDays') {
            console.log("🔄 Updating selectedDays:", value);
        }
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
            const isValid = validateStep("Sales Channels", salesChannelsData);
            if (!isValid) {
                console.log("Validation errors:", validationErrors);
                // Show the first validation error message
                const firstError = Object.values(validationErrors)[0];
                message.error(firstError);
                return { success: false, error: "Validation failed" };
            }

            // Step 2: Prepare data for API
            const stepData = {
                in_store: salesChannelsData.in_store,
                online: salesChannelsData.online,
                from_app: salesChannelsData.from_app,
                third_party: salesChannelsData.third_party
            };

            // Add sales days data - send CLOSED days to API
            if (salesChannelsData.selectedDays) {
                const closedDays = Object.keys(salesChannelsData.selectedDays).filter(day => !salesChannelsData.selectedDays[day]);
                // Always include restaurant_days field, even if empty (meaning all days are open)
                stepData.restaurant_days = closedDays;
                console.log("🔍 Restaurant days data:", {
                    selectedDays: salesChannelsData.selectedDays,
                    closedDays: closedDays,
                    willSendToAPI: stepData.restaurant_days
                });
            }

            // Add providers data if third-party sales is enabled
            if (salesChannelsData.third_party && salesChannelsData.providers) {
                const providersForAPI = salesChannelsData.providers
                    .filter(provider => provider.providerName && provider.providerFee) // Only include providers with both name and fee
                    .map(provider => ({
                        provider_name: provider.providerName,
                        provider_fee: provider.providerFee
                    }));
                
                if (providersForAPI.length > 0) {
                    stepData.providers = providersForAPI;
                }
            }

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
                    navigateToNextStep(true); // Skip completion check since we just saved successfully
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

    // Show loading spinner overlay when loading
    if (loading) {
        return (
            <div className="relative">
                <div className="absolute inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
                    <LoadingSpinner message="Saving sales channels..." size="medium" />
                </div>
                <div className="opacity-50 pointer-events-none">
                    <div className="flex flex-col gap-6">
                        {isUpdateMode && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h3 className="text-lg font-semibold text-blue-800 mb-2">Update Mode</h3>
                                <p className="text-blue-700">
                                    You are updating your sales channels. Changes will be saved when you click "Save & Continue".
                                </p>
                            </div>
                        )}

                        <SalesDays
                            data={salesChannelsData}
                            updateData={updateSalesChannelsData}
                            errors={validationErrors}
                        />

                        <SalesChannel
                            data={salesChannelsData}
                            updateData={updateSalesChannelsData}
                            errors={validationErrors}
                            onSaveAndContinue={handleSaveAndContinue}
                            loading={loading}
                        />

                        {isUpdateMode && (
                            <div className="flex justify-end mt-8 pt-6">
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
                            </div>
                        )}
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
                    currentStep="Sales Channels"
                    description="Configure your restaurant's sales channels including in-store, online, app, and third-party delivery options."
                />
            </div>

            <SalesDays
                data={salesChannelsData}
                updateData={updateSalesChannelsData}
                errors={validationErrors}
            />

            {/* Content Section */}
            <SalesChannel
                data={salesChannelsData}
                updateData={updateSalesChannelsData}
                errors={validationErrors}
                onSaveAndContinue={handleSaveAndContinue}
                loading={loading}
            />

            {isUpdateMode && (
                <div className="flex justify-end mt-8 pt-6">
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
                </div>
            )}
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