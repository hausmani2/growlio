import { useState, useEffect } from "react";
import { message } from "antd";
import SalesChannel from "./SalesChannel";
import POSInformation from "./POSInformation";
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
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData } = useStore();
    const { validationErrors, clearFieldError, validateStep } = useStepValidation();
    const { navigateToNextStep } = useTabHook();

    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // State for Sales Channels
    const [salesChannelsData, setSalesChannelsData] = useState({
        in_store: true,
        online: false,
        from_app: false,
        third_party: false,
        providers: [],
        posSystem: '',
        posSystemOther: '',
        separateOnlineOrdering: false,
        posForEmployeeHours: false,
        thirdPartyOrdersToPos: false,
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
        
        const salesChannelsInfoData = completeOnboardingData["Sales Channels"];
        
        if (salesChannelsInfoData && salesChannelsInfoData.data) {
            const data = salesChannelsInfoData.data;

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
                // Mark returned days as CLOSED (false)
                data.restaurant_days.forEach(day => {
                    const dayName = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
                    if (selectedDays.hasOwnProperty(dayName)) {
                        selectedDays[dayName] = false; // Closed
                    }
                });
            } else {
            }

            setSalesChannelsData(prev => {
                
                // Process providers data to ensure proper format and IDs
                let processedProviders = [];
                if (data.providers && Array.isArray(data.providers)) {
                    processedProviders = data.providers.map((provider, index) => {
                        // Ensure provider fee is an integer
                        let providerFee = provider.provider_fee || provider.providerFee || '';
                        if (providerFee && !isNaN(providerFee)) {
                            providerFee = parseInt(providerFee, 10).toString();
                        }
                        
                        return {
                            id: provider.id || Date.now() + index + Math.random(), // Ensure unique ID
                            providerName: provider.provider_name || provider.providerName || '',
                            providerFee: providerFee
                        };
                    });
                }
                
                const newState = {
                    ...prev,
                    in_store: data.in_store !== undefined ? data.in_store : true,
                    online: data.online !== undefined ? data.online : false,
                    from_app: data.from_app !== undefined ? data.from_app : false,
                    third_party: data.third_party !== undefined ? data.third_party : false,
                    providers: processedProviders,
                    posSystem: data.pos_system !== undefined && data.pos_system !== null ? data.pos_system : (data.posSystem !== undefined && data.posSystem !== null ? data.posSystem : ''),
                    posSystemOther: data.pos_system_other !== undefined && data.pos_system_other !== null ? data.pos_system_other : (data.posSystemOther !== undefined && data.posSystemOther !== null ? data.posSystemOther : ''),
                    separateOnlineOrdering: data.separate_online_ordering !== undefined ? data.separate_online_ordering : (data.separateOnlineOrdering !== undefined ? data.separateOnlineOrdering : false),
                    posForEmployeeHours: data.pos_for_employee_hours !== undefined ? data.pos_for_employee_hours : (data.posForEmployeeHours !== undefined ? data.posForEmployeeHours : false),
                    thirdPartyOrdersToPos: data.third_party_orders_to_pos !== undefined ? data.third_party_orders_to_pos : (data.thirdPartyOrdersToPos !== undefined ? data.thirdPartyOrdersToPos : false),
                    selectedDays: selectedDays
                };
                return newState;
            });
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

    // Function to update sales channels data
    const updateSalesChannelsData = (field, value) => {
        if (field === 'selectedDays') {
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

            // Add POS system information
            if (salesChannelsData.posSystem) {
                stepData.pos_system = salesChannelsData.posSystem;
                // If "Other" is selected, include the custom name
                if (salesChannelsData.posSystem === 'Other' && salesChannelsData.posSystemOther) {
                    stepData.pos_system_other = salesChannelsData.posSystemOther;
                }
            }

            // Add POS Yes/No questions
            stepData.separate_online_ordering = salesChannelsData.separateOnlineOrdering || false;
            stepData.pos_for_employee_hours = salesChannelsData.posForEmployeeHours || false;
            stepData.third_party_orders_to_pos = salesChannelsData.thirdPartyOrdersToPos || false;

            // Add sales days data - send CLOSED days to API
            if (salesChannelsData.selectedDays) {
                const closedDays = Object.keys(salesChannelsData.selectedDays).filter(day => !salesChannelsData.selectedDays[day]);
                // Always include restaurant_days field, even if empty (meaning all days are open)
                stepData.restaurant_days = closedDays;
            }

            // Add providers data if third-party sales is enabled
            if (salesChannelsData.third_party && salesChannelsData.providers) {
                const providersForAPI = salesChannelsData.providers
                    .filter(provider => provider.providerName && provider.providerFee) // Only include providers with both name and fee
                    .map(provider => ({
                        provider_name: provider.providerName,
                        provider_fee: parseInt(provider.providerFee, 10) // Ensure it's sent as integer
                    }));
                
                if (providersForAPI.length > 0) {
                    stepData.providers = providersForAPI;
                }
            }

            // Step 3: Call API through Zustand store with success callback
            const result = await submitStepData("Sales Channels", stepData, (responseData) => {
                // Success callback - handle navigation based on mode

                // Check if restaurant_id was returned and log it
                if (responseData && responseData.restaurant_id) {
                }

                // Step 4: Handle navigation based on mode
                if (isUpdateMode) {
                    // In update mode, stay on the same page or go to dashboard
                    message.success("Sales channels updated successfully!");
                } else {
                    // In onboarding mode, navigate to next step
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
                <div className="absolute inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
                    <LoadingSpinner 
                        message="Saving sales channels..." 
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

                        <POSInformation
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
                    currentStep="Operating Information"
                    description="Configure your restaurant's operating information including sales channels and POS details."
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

            {/* POS Information Section */}
            <POSInformation
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