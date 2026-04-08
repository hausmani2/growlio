import { useState, useEffect, useMemo, useRef } from "react";
import { message } from "antd";
import RestaurantInformation from "./RestaurantInformation";
import AddressInformation from "./AddressInformation";
import Address2Information from "./Address2Information";
import { TabProvider } from "../../TabContext";
import { useTabHook } from "../../useTabHook";
import useStore from "../../../../../store/store";
import useFormValidation from "./useFormValidation";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../../../../layout/LoadingSpinner";
import OnboardingBreadcrumb from "../../../../common/OnboardingBreadcrumb";
import StepDataManager from "../../StepDataManager";
import PrimaryButton from "../../../../../components/buttons/Buttons";
import { Input } from "antd";

const RestaurantWrapperContent = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { 
        submitStepData, 
        onboardingLoading: loading, 
        onboardingError: error, 
        clearError, 
        completeOnboardingData,
        getTempFormData,
        updateTempFormData,
        isOnBoardingCompleted,
        loadExistingOnboardingData
    } = useStore();
    const { validationErrors, clearFieldError, validateAllForms } = useFormValidation();
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
            city: "",
            state: "",
            zipCode: "",
            latitude: null,
            longitude: null
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

    // Additional locations (Location 2..N)
    const [additionalLocations, setAdditionalLocations] = useState(
        Array.isArray(tempFormData?.additionalLocations) ? tempFormData.additionalLocations : []
    );

    // Load saved data when component mounts or when completeOnboardingData changes
    useEffect(() => {
        if (!completeOnboardingData) return;
        
        const basicInfoData = completeOnboardingData["Basic Information"];
        
        if (basicInfoData && basicInfoData.data) {
            const data = basicInfoData.data;
            
            // Load restaurant data
            if (data.restaurant_name) {
                setRestaurantData(prev => ({
                    ...prev,
                    restaurantName: data.restaurant_name
                }));
            } else {
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
                    address2: location.address_2 || "",
                    country: location.country === "USA" ? "1" : location.country === "Canada" ? "2" : "",
                    city: location.city || "",
                    state: location.state || "", // Keep the actual state code (TX, CA, NY, etc.)
                    zipCode: location.zip_code || "",
                    latitude: location.latitude || location.lat || null,
                    longitude: location.longitude || location.lng || null
                }));
                
                setAddressTypeData(prev => ({
                    ...prev,
                    sqft: location.sqft?.toString() || "",
                    isFranchise: location.is_franchise ? "2" : "1"
                }));

                // Populate Location 2..N into additionalLocations
                const extraLocations = data.locations.slice(1).map((loc) => ({
                    locationName: loc.location_name || loc.name || "",
                    address1: loc.address_1 || "",
                    address2: loc.address_2 || "",
                    country: loc.country === "USA" ? "1" : loc.country === "Canada" ? "2" : "",
                    city: loc.city || "",
                    state: loc.state || "",
                    zipCode: loc.zip_code || "",
                    latitude: loc.latitude || loc.lat || null,
                    longitude: loc.longitude || loc.lng || null
                }));

                setAdditionalLocations(Array.isArray(extraLocations) ? extraLocations : []);

                // Persist into temp form data (best-effort)
                try {
                    const { updateTempFormDataMultiple } = useStore.getState();
                    updateTempFormDataMultiple?.("Basic Information", "additionalLocations", extraLocations);
                } catch (e) {
                    // ignore
                }
            }
            
            // Load restaurant type and menu type
            if (data.restaurant_type) {
                setAddressTypeData(prev => ({
                    ...prev,
                    restaurantType: data.restaurant_type
                }));
            } else {
            }
            
            if (data.menu_type) {
                setAddressTypeData(prev => ({
                    ...prev,
                    menuType: data.menu_type
                }));
            } else {
            }
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

    const desiredLocationsCount = useMemo(() => {
        const n = Number(restaurantData.numberOfLocations || 1);
        return Number.isFinite(n) && n > 0 ? n : 1;
    }, [restaurantData.numberOfLocations]);

    // Ensure additionalLocations array matches the selected number of locations
    useEffect(() => {
        const neededAdditional = Math.max(0, desiredLocationsCount - 1);
        setAdditionalLocations((prev) => {
            const next = Array.isArray(prev) ? [...prev] : [];
            if (next.length === neededAdditional) return next;

            if (next.length < neededAdditional) {
                for (let i = next.length; i < neededAdditional; i += 1) {
                    next.push({
                        locationName: "",
                        address1: "",
                        address2: "",
                        country: "",
                        city: "",
                        state: "",
                        zipCode: "",
                        latitude: null,
                        longitude: null
                    });
                }
            } else {
                next.length = neededAdditional;
            }

            // Persist for this step (best-effort)
            try {
                const { updateTempFormDataMultiple } = useStore.getState();
                updateTempFormDataMultiple?.("Basic Information", "additionalLocations", next);
            } catch (e) {
                // ignore
            }

            return next;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [desiredLocationsCount]);

    const updateAdditionalLocation = (index, field, value) => {
        setAdditionalLocations((prev) => {
            const next = Array.isArray(prev) ? [...prev] : [];
            if (!next[index]) return prev;
            next[index] = { ...next[index], [field]: value };
            try {
                const { updateTempFormDataMultiple } = useStore.getState();
                updateTempFormDataMultiple?.("Basic Information", "additionalLocations", next);
            } catch (e) {
                // ignore
            }
            return next;
        });
    };

    const getAdditionalLocationErrors = (locationNumber) => {
        // Map flat validation keys to AddressInformation expected keys
        // locationNumber starts at 2
        const prefix = `location_${locationNumber}_`;
        return {
            locationName: validationErrors[`${prefix}locationName`],
            address1: validationErrors[`${prefix}address1`],
            country: validationErrors[`${prefix}country`],
            city: validationErrors[`${prefix}city`],
            state: validationErrors[`${prefix}state`],
            zipCode: validationErrors[`${prefix}zipCode`]
        };
    };

    // Function to handle save and continue
    const handleSaveAndContinue = async () => {
        try {
            // Step 1: Validate all forms
            const isValid = validateAllForms(restaurantData, addressData, addressTypeData, additionalLocations);

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
            
            // Build location object with conditional latitude/longitude
            const buildLocationObj = (locName, addr) => {
                const locationObj = {
                    location_name: locName,
                    address_1: addr.address1,
                    address_2: addr.address2,
                    city: addr.city,
                    country: addr.country === "1" ? "USA" : addr.country === "2" ? "Canada" : "",
                    state: addr.state,
                    zip_code: addr.zipCode,
                    sqft: parseInt(addressTypeData.sqft),
                    is_franchise: addressTypeData.isFranchise === "2"
                };
                if (addr.latitude !== null && addr.latitude !== undefined && !isNaN(parseFloat(addr.latitude))) {
                    locationObj.latitude = parseFloat(addr.latitude);
                }
                if (addr.longitude !== null && addr.longitude !== undefined && !isNaN(parseFloat(addr.longitude))) {
                    locationObj.longitude = parseFloat(addr.longitude);
                }
                return locationObj;
            };

            const locationsPayload = [
                buildLocationObj(restaurantData.locationName, addressData),
                ...additionalLocations.map((loc) =>
                    buildLocationObj(loc.locationName, loc)
                )
            ];
            
            const stepData = {
                restaurant_name: restaurantData.restaurantName,
                number_of_locations: parseInt(restaurantData.numberOfLocations),
                restaurant_type: addressTypeData.restaurantType,
                menu_type: addressTypeData.menuType,
                locations: locationsPayload
            };
            
            // Add restaurant_id to payload if it exists (for updates)
            if (existingRestaurantId) {
                stepData.restaurant_id = existingRestaurantId;
            }
            
            // Step 3: Call API through Zustand store with success callback
            const result = await submitStepData("Basic Information", stepData, (responseData) => {
                // Success callback - handle navigation based on mode
                
                // Check if restaurant_id was returned and log it
                if (responseData && responseData.restaurant_id) {
                }
                
                // Ensure step is marked as completed
                const { markStepCompleted } = useStore.getState();
                markStepCompleted("Basic Information");
                
                // Step 4: Always navigate to next step after saving
                if (isUpdateMode && isOnBoardingCompleted) {
                    // In update mode AND onboarding is complete: show success and navigate
                    message.success("Basic information updated successfully!");
                } else {
                    // In onboarding mode OR new user in update mode: show success and navigate
                    message.success("Basic information saved successfully!");
                }
                // Navigation rule:
                // - Update mode (settings flow): go to Operating Expenses next (RD -> Expenses).
                // - Onboarding flow: continue normal step navigation.
                setTimeout(() => {
                    // In dashboard "Your Setup" flow (non-/onboarding routes), always take RD -> Expenses.
                    // This avoids depending on potentially stale `isOnBoardingCompleted`.
                    if (isUpdateMode) {
                        navigate('/dashboard/expense');
                        return;
                    }
                    navigateToNextStep(true); // Skip completion check since we just saved successfully
                }, 200); // Small delay to ensure state update
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
                    <div className="absolute inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
                        <LoadingSpinner 
                            message="Saving basic information..." 
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
                                <div className="flex gap-3 ml-auto">
                                    <button
                                        onClick={() => {
                                            // Update mode: RD -> Expenses. Otherwise continue normal flow.
                                            if (isUpdateMode) {
                                                navigate('/dashboard/expense');
                                                return;
                                            }
                                            navigate('/dashboard/sales-channels');
                                        }}
                                        disabled={loading}
                                        className={`bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                                            loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'
                                        }`}
                                    >
                                        Skip
                                    </button>
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
                    title="Location Address 1"
                />

                {/* Additional Locations */}
                {(Array.isArray(additionalLocations) ? additionalLocations : []).map((loc, idx) => {
                    const locationNumber = idx + 2;
                    const locErrors = getAdditionalLocationErrors(locationNumber);
                    return (
                        <div key={`additional-location-${locationNumber}`} className="space-y-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-orange-600 mb-2">
                                        Location {locationNumber}
                                    </h3>
                                </div>
                                <div>
                                    <label
                                        htmlFor={`locationName_${locationNumber}`}
                                        className="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        Location Name <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        id={`locationName_${locationNumber}`}
                                        placeholder={`Enter location ${locationNumber} name`}
                                        className={`w-full h-11 rounded-lg text-sm ${locErrors.locationName ? 'border-red-500' : 'border-gray-300'}`}
                                        value={loc.locationName || ""}
                                        onChange={(e) => updateAdditionalLocation(idx, 'locationName', e.target.value)}
                                    />
                                    {locErrors.locationName && (
                                        <span className="text-red-500 text-xs mt-1">{locErrors.locationName}</span>
                                    )}
                                </div>
                            </div>

                            <AddressInformation
                                data={loc}
                                updateData={(field, value) => updateAdditionalLocation(idx, field, value)}
                                errors={locErrors}
                                title={`Location Address ${locationNumber}`}
                            />
                        </div>
                    );
                })}

                <Address2Information
                    data={addressTypeData}
                    updateData={updateAddressTypeData}
                    onSaveAndContinue={handleSaveAndContinue}
                    errors={validationErrors}
                    loading={loading}
                />
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6">
                <button
                    onClick={() => {
                        // Update mode: RD -> Expenses. Otherwise continue normal flow.
                        if (isUpdateMode) {
                            navigate('/dashboard/expense');
                            return;
                        }
                        navigate('/dashboard/sales-channels');
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

const RestaurantWrapper = () => {
    return (
        <TabProvider>
            <RestaurantWrapperContent />
        </TabProvider>
    );
};

export default RestaurantWrapper;