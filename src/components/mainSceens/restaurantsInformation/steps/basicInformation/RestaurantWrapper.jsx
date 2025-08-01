import { useState, useEffect } from "react";
import { message } from "antd";
import RestaurantInformation from "./RestaurantInformation";
import AddressInformation from "./AddressInformation";
import AddressType from "./Address2Information";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useFormValidation from "./useFormValidation";
import StepDataManager from "../../StepDataManager";
import { useNavigate, useLocation } from "react-router-dom";

const RestaurantWrapperContent = () => {
    const navigate = useNavigate();
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
        console.log("=== Loading Basic Information Data ===");
        console.log("completeOnboardingData:", completeOnboardingData);
        console.log("basicInfoData:", basicInfoData);
        
        if (basicInfoData && basicInfoData.data) {
            const data = basicInfoData.data;
            console.log("Basic Information data from API:", data);
            
            // Load restaurant data
            if (data.restaurant_name) {
                console.log("Loading restaurant_name:", data.restaurant_name);
                setRestaurantData(prev => ({
                    ...prev,
                    restaurantName: data.restaurant_name
                }));
            }
            
            if (data.number_of_locations) {
                console.log("Loading number_of_locations:", data.number_of_locations);
                setRestaurantData(prev => ({
                    ...prev,
                    numberOfLocations: data.number_of_locations
                }));
            }
            
            // Load location data
            if (data.locations && data.locations.length > 0) {
                const location = data.locations[0];
                console.log("Loading location data:", location);
                
                console.log("Loading location name from:", location.location_name || location.name || "");
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
            console.log("Checking for restaurant_type:", data.restaurant_type);
            console.log("Checking for menu_type:", data.menu_type);
            
            if (data.restaurant_type) {
                console.log("Loading restaurant_type:", data.restaurant_type);
                setAddressTypeData(prev => ({
                    ...prev,
                    restaurantType: data.restaurant_type
                }));
            } else {
                console.log("❌ restaurant_type is missing from API data");
            }
            
            if (data.menu_type) {
                console.log("Loading menu_type:", data.menu_type);
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
            console.log("=== Basic Information Save & Continue ===");
            console.log("restaurantData:", restaurantData);
            console.log("addressData:", addressData);
            console.log("addressTypeData:", addressTypeData);
            
            // Step 1: Validate all forms
            const validationResult = validateAllForms(restaurantData, addressData, addressTypeData);
            console.log("Validation result:", validationResult);
            console.log("Validation passed:", Object.keys(validationResult).length === 0);
            
            if (!validationResult || Object.keys(validationResult).length > 0) {
                console.log("Validation failed with errors:", validationResult);
                message.error("Please fill in all required fields correctly");
                return { success: false, error: "Validation failed" };
            }

            // Step 1.5: Save temporary form data to store
            const { saveTempFormData } = useStore.getState();
            saveTempFormData("Basic Information");

            // Step 2: Prepare data for API
            // Get existing restaurant_id if available (for updates)
            const existingRestaurantId = useStore.getState().getRestaurantId();
            console.log("🔍 Existing restaurant_id:", existingRestaurantId);
            
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
                console.log("✅ Including existing restaurant_id in API payload:", existingRestaurantId);
            }
            
            console.log("Prepared stepData for API:", stepData);
            console.log("restaurant_type value:", stepData.restaurant_type);
            console.log("menu_type value:", stepData.menu_type);
            console.log("location name value:", stepData.locations[0].location_name);
            console.log("restaurantData.locationName:", restaurantData.locationName);
            
            // Step 3: Call API through Zustand store with success callback
            console.log("Calling submitStepData...");
            const result = await submitStepData("Basic Information", stepData, (responseData) => {
                // Success callback - handle navigation based on mode
                console.log("✅ Basic Information saved successfully");
                
                // Check if restaurant_id was returned and log it
                if (responseData && responseData.restaurant_id) {
                    console.log("✅ Restaurant ID received:", responseData.restaurant_id);
                }
                
                // Ensure step is marked as completed
                const { markStepCompleted } = useStore.getState();
                markStepCompleted("Basic Information");
                console.log("✅ Marked Basic Information as completed");
                
                // Step 4: Handle navigation based on mode
                if (isUpdateMode) {
                    // In update mode, stay on the same page or go to dashboard
                    console.log("🔄 Update mode - staying on current page");
                    message.success("Basic information updated successfully!");
                } else {
                    // In onboarding mode, navigate to next step
                    console.log("🔄 Onboarding mode - navigating to next step");
                    message.success("Basic information saved successfully!");
                    
                    // Add a small delay to ensure state is updated before navigation
                    setTimeout(() => {
                        console.log("🔄 Navigating to next step after state update...");
                        
                        // Debug: Check current state
                        const currentState = useStore.getState();
                        console.log("Current completeOnboardingData:", currentState.completeOnboardingData);
                        console.log("Basic Information status:", currentState.completeOnboardingData["Basic Information"]?.status);
                        
                        navigateToNextStep();
                    }, 200); // Increased delay to ensure state update
                }
            });
            console.log("submitStepData result:", result);
            
            // Step 4: Handle success
            if (result.success) {
                return { success: true, data: result.data };
            } else {
                message.error("Failed to save basic information. Please try again.");
                return { success: false, error: "API call failed" };
            }
        } catch (error) {
            console.error("Error saving basic information:", error);
            
            // Show user-friendly error message
            const errorMessage = error.message || "An unexpected error occurred. Please try again.";
            message.error(errorMessage);
            
            return { success: false, error: errorMessage };
        }
    };

    return (
        <StepDataManager stepName="Basic Information">
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
                />

                <AddressInformation 
                    data={addressData}
                    updateData={updateAddressData}
                    errors={validationErrors}
                />
                <AddressType 
                    data={addressTypeData}
                    updateData={updateAddressTypeData}
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
        </StepDataManager>
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