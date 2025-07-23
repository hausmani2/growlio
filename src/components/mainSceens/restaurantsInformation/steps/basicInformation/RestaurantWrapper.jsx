import { useState, useEffect } from "react";
import { message } from "antd";
import RestaurantInformation from "./RestaurantInformation";
import AddressInformation from "./AddressInformation";
import AddressType from "./Address2Information";
import { TabProvider } from "../../TabContext";
import useStore from "../../../../../store/store";
import useFormValidation from "./useFormValidation";

const RestaurantWrapper = () => {
    const { submitStepData, loading, error, clearError, completeOnboardingData } = useStore();
    const { validationErrors, clearFieldError, validateAllForms } = useFormValidation();
    
    // State for Restaurant Information
    const [restaurantData, setRestaurantData] = useState({
        restaurantName: "",
        numberOfLocations: undefined,
        locationName: "",
        otherLocationName: ""
    });

    // State for Address Information
    const [addressData, setAddressData] = useState({
        address1: "",
        address2: "",
        country: "",
        state: "",
        zipCode: ""
    });

    // State for Address Type Information
    const [addressTypeData, setAddressTypeData] = useState({
        sqft: "",
        isFranchise: "",
        royaltyPercentage: "",
        advertisementFee: "",
        restaurantType: "",
        menuType: ""
    });

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
                
                setRestaurantData(prev => ({
                    ...prev,
                    locationName: location.name || ""
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
        clearFieldError(field);
    };

    // Function to update address data
    const updateAddressData = (field, value) => {
        setAddressData(prev => ({
            ...prev,
            [field]: value
        }));
        clearFieldError(field);
    };

    // Function to update address type data
    const updateAddressTypeData = (field, value) => {
        setAddressTypeData(prev => ({
            ...prev,
            [field]: value
        }));
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

            // Step 2: Prepare data for API
            const stepData = {
                restaurant_name: restaurantData.restaurantName,
                number_of_locations: parseInt(restaurantData.numberOfLocations),
                restaurant_type: addressTypeData.restaurantType,
                menu_type: addressTypeData.menuType,
                locations: [
                    {
                        location_name: restaurantData.locationName,
                        address_1: addressData.address1,
                        country: addressData.country === "1" ? "USA" : addressData.country === "2" ? "Canada" : "UK",
                        state: addressData.state === "1" ? "CA" : addressData.state === "2" ? "NY" : "TX",
                        zip_code: addressData.zipCode,
                        sqft: parseInt(addressTypeData.sqft),
                        is_franchise: addressTypeData.isFranchise === "2"
                    }
                ]
            };
            
            console.log("Prepared stepData for API:", stepData);
            console.log("restaurant_type value:", stepData.restaurant_type);
            console.log("menu_type value:", stepData.menu_type);
            
            // Step 3: Call API through Zustand store
            console.log("Calling submitStepData...");
            const result = await submitStepData("Basic Information", stepData);
            console.log("submitStepData result:", result);
            
            // Step 4: Handle success
            if (result.success) {
                message.success("Basic information saved successfully!");
                console.log("Basic information saved successfully, ready for next step");
                
                // Check if restaurant_id was returned and log it
                if (result.data && result.data.restaurant_id) {
                    console.log("✅ Restaurant ID received:", result.data.restaurant_id);
                }
                
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
        <TabProvider>
            <div className="flex flex-col">
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
            </div>
        </TabProvider>
    );
};

export default RestaurantWrapper;