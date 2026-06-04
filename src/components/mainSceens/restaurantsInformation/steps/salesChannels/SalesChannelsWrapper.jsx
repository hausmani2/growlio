import { useState, useEffect, useRef } from "react";
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
import useSetupPageLocationReload from "../../../../../hooks/useSetupPageLocationReload";

const DEFAULT_SALES_CHANNELS_STATE = {
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
};

const mapSalesChannelsFromStore = (salesChannelsInfoData) => {
    if (!salesChannelsInfoData?.data) {
        return DEFAULT_SALES_CHANNELS_STATE;
    }

    const data = salesChannelsInfoData.data;
    const allOpen = {
        Sunday: true,
        Monday: true,
        Tuesday: true,
        Wednesday: true,
        Thursday: true,
        Friday: true,
        Saturday: true
    };
    const allClosed = {
        Sunday: false,
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false
    };

    const stepCompleted = salesChannelsInfoData?.status === true;
    let selectedDays = allOpen;

    if (Array.isArray(data.restaurant_days)) {
        if (data.restaurant_days.length === 0 && !stepCompleted) {
            selectedDays = allOpen;
        } else {
            selectedDays = { ...allClosed };
            if (data.restaurant_days.length > 0) {
                data.restaurant_days.forEach((day) => {
                    const dayName = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
                    if (Object.prototype.hasOwnProperty.call(selectedDays, dayName)) {
                        selectedDays[dayName] = true;
                    }
                });
            }
        }
    }

    let processedProviders = [];
    if (data.providers && Array.isArray(data.providers)) {
        const seenProviderNames = new Set();
        processedProviders = data.providers
            .map((provider, index) => {
                let providerFee = provider.provider_fee || provider.providerFee || '';
                if (providerFee && !isNaN(providerFee)) {
                    providerFee = parseInt(providerFee, 10).toString();
                }
                const providerName = provider.provider_name || provider.providerName || '';
                return {
                    id: provider.id || `provider-${index}-${providerName}`,
                    providerName,
                    providerFee,
                };
            })
            .filter((provider) => {
                const key = provider.providerName.trim().toLowerCase();
                if (!key || seenProviderNames.has(key)) return false;
                seenProviderNames.add(key);
                return true;
            });
    }

    return {
        in_store: data.in_store !== undefined ? data.in_store : true,
        online: data.online !== undefined ? data.online : false,
        from_app: data.from_app !== undefined ? data.from_app : false,
        third_party: data.third_party !== undefined ? data.third_party : false,
        providers: processedProviders,
        posSystem: data.pos_system !== undefined && data.pos_system !== null
            ? data.pos_system
            : (data.posSystem !== undefined && data.posSystem !== null ? data.posSystem : ''),
        posSystemOther: data.pos_system_other !== undefined && data.pos_system_other !== null
            ? data.pos_system_other
            : (data.posSystemOther !== undefined && data.posSystemOther !== null ? data.posSystemOther : ''),
        separateOnlineOrdering: data.separate_online_ordering !== undefined
            ? data.separate_online_ordering
            : (data.separateOnlineOrdering !== undefined ? data.separateOnlineOrdering : false),
        posForEmployeeHours: data.pos_for_employee_hours !== undefined
            ? data.pos_for_employee_hours
            : (data.posForEmployeeHours !== undefined ? data.posForEmployeeHours : false),
        thirdPartyOrdersToPos: data.third_party_orders_to_pos !== undefined
            ? data.third_party_orders_to_pos
            : (data.thirdPartyOrdersToPos !== undefined ? data.thirdPartyOrdersToPos : false),
        selectedDays
    };
};

const SalesChannelsWrapperContent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData, isOnBoardingCompleted } = useStore();
    const { validationErrors, clearFieldError, validateStep } = useStepValidation();
    const { navigateToNextStep, activeTab, tabs } = useTabHook();

    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const {
        selectedLocationId,
        isLoadingLocationData,
    } = useSetupPageLocationReload(isUpdateMode);
    const lastLoadedOnboardingLocationId = useStore(
        (s) => s.lastLoadedOnboardingLocationId
    );
    const salesChannelsStep = completeOnboardingData["Sales Channels"];

    const [salesChannelsData, setSalesChannelsData] = useState(DEFAULT_SALES_CHANNELS_STATE);

    const skipLocalResetRef = useRef(true);
    useEffect(() => {
        if (skipLocalResetRef.current) {
            skipLocalResetRef.current = false;
            return;
        }
        if (!selectedLocationId) return;
        setSalesChannelsData(DEFAULT_SALES_CHANNELS_STATE);
    }, [selectedLocationId]);

    useEffect(() => {
        if (
            !selectedLocationId ||
            lastLoadedOnboardingLocationId !== selectedLocationId
        ) {
            return;
        }
        setSalesChannelsData(mapSalesChannelsFromStore(salesChannelsStep));
    }, [salesChannelsStep, lastLoadedOnboardingLocationId, selectedLocationId]);


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

            // Add sales days data - send ONLY OPEN days to API
            // IMPORTANT: restaurant_days should contain days when restaurant is OPEN (not closed)
            // selectedDays[day] = true means OPEN, selectedDays[day] = false means CLOSED
            if (salesChannelsData.selectedDays) {
                // Filter for days where selectedDays[day] is true (OPEN)
                // We want to send only OPEN days to the API, NOT closed days
                const openDays = Object.keys(salesChannelsData.selectedDays).filter(day => {
                    const isOpen = salesChannelsData.selectedDays[day];
                    // Only include days that are OPEN (isOpen === true)
                    // If isOpen is true, the day is OPEN and SHOULD be in restaurant_days
                    // If isOpen is false, the day is CLOSED and should NOT be in restaurant_days
                    return isOpen === true;
                });
                
                // Validate: Ensure we're not accidentally sending closed days
                const closedDays = Object.keys(salesChannelsData.selectedDays).filter(day => 
                    salesChannelsData.selectedDays[day] === false
                );
                
                // Always include restaurant_days field with OPEN days
                // If all days are open, restaurant_days will contain all 7 days
                // If some days are closed, restaurant_days will only contain open days
                stepData.restaurant_days = openDays;
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
                // Step 4: Always navigate to next step after saving
                if (isUpdateMode && isOnBoardingCompleted) {
                    // In update mode AND onboarding is complete: show success and navigate
                    message.success("Sales channels updated successfully!");
                } else {
                    // In onboarding mode OR new user in update mode: show success and navigate
                    message.success("Sales channels saved successfully!");
                }
                // Always navigate to next step (Labor Information)
                navigateToNextStep(true); // Skip completion check since we just saved successfully
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

    if ((isUpdateMode && isLoadingLocationData && !loading) || loading) {
        return (
            <div className="w-full min-h-[320px] flex items-center justify-center py-16">
                <LoadingSpinner
                    message={
                        loading
                            ? 'Saving operating information...'
                            : 'Loading operating information...'
                    }
                    size="medium"
                    subtext={
                        loading
                            ? 'Please wait while we save your changes...'
                            : 'Fetching data for the selected location'
                    }
                    showSubtext={true}
                />
            </div>
        );
    }

    const formSections = (
        <>
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
                hideSectionTitle={isUpdateMode}
            />

            <POSInformation
                data={salesChannelsData}
                updateData={updateSalesChannelsData}
                errors={validationErrors}
                onSaveAndContinue={handleSaveAndContinue}
                loading={loading}
            />

            <div className="flex justify-end gap-3 mt-8 pt-6">
                <button
                    onClick={() => navigate('/dashboard/labor-information')}
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
        </>
    );

    return (
        <div className="w-full mx-auto">
            {/* Header Section with same styling as dashboard */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                <OnboardingBreadcrumb 
                    currentStep="Operating Information"
                    description="Configure your restaurant's operating information including sales channels and POS details."
                />
            </div>

            {formSections}
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

export { SalesChannelsWrapperContent };
export default SalesChannelsWrapper;