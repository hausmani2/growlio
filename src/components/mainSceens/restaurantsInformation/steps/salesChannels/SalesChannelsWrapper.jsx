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

const SalesChannelsWrapperContent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { submitStepData, onboardingLoading: loading, onboardingError: error, clearError, completeOnboardingData, isOnBoardingCompleted, loadExistingOnboardingData } = useStore();
    const { validationErrors, clearFieldError, validateStep } = useStepValidation();
    const { navigateToNextStep, activeTab, tabs } = useTabHook();

    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Load existing onboarding data when opening "Your Setup" menu item
    const hasLoadedRef = useRef(false);
    useEffect(() => {
        const loadData = async () => {
            if (isUpdateMode && !hasLoadedRef.current) {
                hasLoadedRef.current = true;
                try {
                    // Call GET API to fetch onboarding data (force refresh to get latest data)
                    await loadExistingOnboardingData(true);
                } catch (error) {
                    console.error('Error loading onboarding data:', error);
                    hasLoadedRef.current = false; // Allow retry on error
                }
            }
        };
        
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isUpdateMode]);

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

            // Handle restaurant days - if days are returned from API, they are OPEN days
            // IMPORTANT: restaurant_days from API contains OPEN days (not closed)
            // If restaurant_days is empty array, it means all days are CLOSED
            // If restaurant_days has days, those are the OPEN days
            let selectedDays = {
                Sunday: false,
                Monday: false,
                Tuesday: false,
                Wednesday: false,
                Thursday: false,
                Friday: false,
                Saturday: false
            };

            // If restaurant_days is returned from API, those are the OPEN days
            if (data.restaurant_days && Array.isArray(data.restaurant_days) && data.restaurant_days.length > 0) {
                // Mark returned days as OPEN (true)
                // All other days remain false (closed)
                data.restaurant_days.forEach(day => {
                    const dayName = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
                    if (selectedDays.hasOwnProperty(dayName)) {
                        selectedDays[dayName] = true; // Open
                    }
                });
            } else {
                // If restaurant_days is empty array or not provided, all days are CLOSED
                // Keep all days as false (closed)
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

                        <div className="flex justify-end gap-3 mt-8 pt-6">
                            <button
                                onClick={() => {
                                    
                                    navigate('/dashboard/labor-information');
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

            <div className="flex justify-end gap-3 mt-8 pt-6">
                <button
                    onClick={() => {
                        navigate('/dashboard/labor-information');
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

const SalesChannelsWrapper = () => {
    return (
        <TabProvider>
            <SalesChannelsWrapperContent />
        </TabProvider>
    );
};

export default SalesChannelsWrapper;