import { useState, useEffect } from "react";
import { message } from "antd";
import RestaurantInformation from "./RestaurantInformation";
import AddressInformation from "./AddressInformation";
import Address2Information from "./Address2Information";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useFormValidation from "./useFormValidation";
import { useLocation } from "react-router-dom";
import LoadingSpinner from "../../../../layout/LoadingSpinner";
import OnboardingBreadcrumb from "../../../../common/OnboardingBreadcrumb";
import StepDataManager from "../../StepDataManager";

const RestaurantWrapperContent = () => {
    const location = useLocation();
    const { 
        submitStepData, 
        onboardingLoading: loading, 
        onboardingError: error, 
        clearError, 
        completeOnboardingData,
        getTempFormData,
        updateTempFormData
    } = useStore();
    const { validationErrors, clearFieldError, validateAllForms } = useFormValidation();
    const { navigateToNextStep } = useTabHook();
    
    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    // Get temporary form data from store
    const tempFormData = getTempFormData("Basic Information");
    
    // State for Restaurant Information
    const [restaurantData, setRestaurantData] = useState(
        tempFormData?.restaurantData || {
            restaurantName: "",
            numberOfLocations: undefined,
            locationName: "",
            otherLocationName: ""
        }
    );

    // State for Address Information
    const [addressData, setAddressData] = useState(
        tempFormData?.addressData || {
            address1: "",
            address2: "",
            country: "",
            state: "",
            zipCode: ""
        }
    );

    // State for Address Type Information
    const [addressTypeData, setAddressTypeData] = useState(
        tempFormData?.addressTypeData || {
            sqft: "",
            isFranchise: "",
            royaltyPercentage: "",
            advertisementFee: "",
            restaurantType: "",
            menuType: ""
        }
    );

    // Load saved data when component mounts or when completeOnboardingData changes
    useEffect(() => {
        const basicInfoData = completeOnboardingData["Basic Information"];
        
        if (basicInfoData && basicInfoData.data) {
            const data = basicInfoData.data;
            
            // Load restaurant data
            console.log("🔍 Loading restaurant data:", data.restaurant_name);
            if (data.restaurant_name) {
                setRestaurantData(prev => ({
                    ...prev,
                    restaurantName: data.restaurant_name
                }));
                console.log("✅ Restaurant name set to:", data.restaurant_name);
            } else {
                console.log("❌ No restaurant_name found in API data");
            }
            
            if (data.number_of_locations) {
                setRestaurantData(prev => ({
                    ...prev,
                    numberOfLocations: data.number_of_locations
                }));
            }
            
            // Load location data
            if (data.locations && data.locations.length > 0) {
                const location = data.locations[0];
                setRestaurantData(prev => ({
                    ...prev,
                    locationName: location.location_name || location.name || ""
                }));
                
                setAddressData(prev => ({
                    ...prev,
                    address1: location.address_1 || "",
                    country: location.country === "USA" ? "1" : location.country === "Canada" ? "2" : "3",
                    state: location.state === "CA" ? "1" : location.state === "NY" ? "2" : "3",
                    zipCode: location.zip_code || ""
                }));
                
                setAddressTypeData(prev => ({
                    ...prev,
                    sqft: location.sqft?.toString() || "",
                    isFranchise: location.is_franchise ? "2" : "1"
                }));
            }
            
            // Load restaurant type and menu type
            if (data.restaurant_type) {
                setAddressTypeData(prev => ({
                    ...prev,
                    restaurantType: data.restaurant_type
                }));
            } else {
                console.log("❌ restaurant_type is missing from API data");
            }
            
            if (data.menu_type) {
                setAddressTypeData(prev => ({
                    ...prev,
                    menuType: data.menu_type
                }));
            } else {
                console.log("❌ menu_type is missing from API data");
            }
        } else {
            console.log("❌ No Basic Information data found in completeOnboardingData");
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

    // Function to update restaurant data
    const updateRestaurantData = (field, value) => {
        setRestaurantData(prev => ({
            ...prev,
            [field]: value
        }));
        // Also update in store
        updateTempFormData("Basic Information", "restaurantData", field, value);
        clearFieldError(field);
    };

    // Function to update address data
    const updateAddressData = (field, value) => {
        setAddressData(prev => ({
            ...prev,
            [field]: value
        }));
        // Also update in store
        updateTempFormData("Basic Information", "addressData", field, value);
        clearFieldError(field);
    };

    // Function to update address type data
    const updateAddressTypeData = (field, value) => {
        setAddressTypeData(prev => ({
            ...prev,
            [field]: value
        }));
        // Also update in store
        updateTempFormData("Basic Information", "addressTypeData", field, value);
        clearFieldError(field);
    };

    // Function to handle save and continue
    const handleSaveAndContinue = async () => {
        try {
            // Step 1: Validate all forms
            const isValid = validateAllForms(restaurantData, addressData, addressTypeData);

            if (!isValid) {
                message.error("Please fill in all required fields correctly");
                return { success: false, error: "Validation failed" };
            }

            // Step 1.5: Save temporary form data to store
            const { saveTempFormData, updateTempFormDataMultiple } = useStore.getState();
            
            // Update tempFormData with current state before saving
            updateTempFormDataMultiple("Basic Information", "restaurantData", restaurantData);
            updateTempFormDataMultiple("Basic Information", "addressData", addressData);
            updateTempFormDataMultiple("Basic Information", "addressTypeData", addressTypeData);
            
            saveTempFormData("Basic Information");

            // Step 2: Prepare data for API
            // Get existing restaurant_id if available (for updates)
            const existingRestaurantId = useStore.getState().getRestaurantId();
            
            const stepData = {
                restaurant_name: restaurantData.restaurantName,
                number_of_locations: parseInt(restaurantData.numberOfLocations),
                restaurant_type: addressTypeData.restaurantType,
                menu_type: addressTypeData.menuType,
                locations: [
                    {
                        location_name: restaurantData.locationName, // API expects 'location_name'
                        address_1: addressData.address1,
                        country: addressData.country === "1" ? "USA" : addressData.country === "2" ? "Canada" : "UK",
                        state: addressData.state === "1" ? "CA" : addressData.state === "2" ? "NY" : "TX",
                        zip_code: addressData.zipCode,
                        sqft: parseInt(addressTypeData.sqft),
                        is_franchise: addressTypeData.isFranchise === "2"
                    }
                ]
            };
            
            // Add restaurant_id to payload if it exists (for updates)
            if (existingRestaurantId) {
                stepData.restaurant_id = existingRestaurantId;
            }
            
            // Step 3: Call API through Zustand store with success callback
            console.log("Calling submitStepData...");
            const result = await submitStepData("Basic Information", stepData, (responseData) => {
                // Success callback - handle navigation based on mode
                
                // Check if restaurant_id was returned and log it
                if (responseData && responseData.restaurant_id) {
                }
                
                // Ensure step is marked as completed
                const { markStepCompleted } = useStore.getState();
                markStepCompleted("Basic Information");
                
                // Step 4: Handle navigation based on mode
                if (isUpdateMode) {
                    // In update mode, stay on the same page or go to dashboard
                    message.success("Basic information updated successfully!");
                } else {
                    // In onboarding mode, navigate to next step
                    message.success("Basic information saved successfully!");
                    
                    // Add a small delay to ensure state is updated before navigation
                    setTimeout(() => {
                        
                        // Debug: Check current state
                        const currentState = useStore.getState();
                        
                        navigateToNextStep(true); // Skip completion check since we just saved successfully
                    }, 200); // Increased delay to ensure state update
                }
            });
            
            // Step 4: Handle success
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                message.error("Failed to save basic information. Please try again.");
                return { success: false, error: "API call failed" };
            }
        } catch (error) {
            // Show user-friendly error message
            const errorMessage = error.message || "An unexpected error occurred. Please try again.";
            message.error(errorMessage);
            
            return { success: false, error: errorMessage };
        }
    };

    // Show loading spinner overlay when loading
    if (loading) {
        return (
            <StepDataManager stepName="Basic Information">
                <div className="relative">
                    <div className="absolute inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
                        <LoadingSpinner message="Saving basic information..." size="medium" />
                    </div>
                    <div className="opacity-50 pointer-events-none">
                        <div className="flex flex-col gap-6">
                            {isUpdateMode && (
                                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Update Mode</h3>
                                    <p className="text-blue-700">
                                        You are updating your basic restaurant information. Changes will be saved when you click "Save & Continue".
                                    </p>
                                </div>
                            )}
                            
                                                         <RestaurantInformation 
                                 data={restaurantData}
                                 updateData={updateRestaurantData}
                                 errors={validationErrors}
                                 isUpdateMode={isUpdateMode}
                             />

                            <AddressInformation 
                                data={addressData}
                                updateData={updateAddressData}
                                errors={validationErrors}
                            />
                            <Address2Information 
                                data={addressTypeData}
                                updateData={updateAddressTypeData}
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
                                                disabled={loading}
                                                className={`bg-orange-300 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-500'
                                                }`}
                                            >
                                                {loading && (
                                                    <div className="animate-spin rounded-full border-b-2 border-white h-4 w-4"></div>
                                                )}
                                                {isUpdateMode ? "Save Changes" : "Save & Continue"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </StepDataManager>
        );
    }

    return (
        <div className="w-full mx-auto">
            {/* Header Section with same styling as dashboard */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                <OnboardingBreadcrumb 
                    currentStep="Basic Information"
                    description="Set up your restaurant's basic details including location, contact information, and business specifications."
                />
            </div>

            {/* Content Section */}
            <div className="space-y-6">
                <RestaurantInformation
                    data={restaurantData}
                    updateData={updateRestaurantData}
                    errors={validationErrors}
                />
                <AddressInformation
                    data={addressData}
                    updateData={updateAddressData}
                    errors={validationErrors}
                />
                <Address2Information
                    data={addressTypeData}
                    updateData={updateAddressTypeData}
                    onSaveAndContinue={handleSaveAndContinue}
                    errors={validationErrors}
                    loading={loading}
                />
            </div>

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

const RestaurantWrapper = () => {
    return (
        <TabProvider>
            <RestaurantWrapperContent />
        </TabProvider>
    );
};

export default RestaurantWrapper;