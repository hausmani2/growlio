import { Input, Select, Tooltip } from "antd";
import { useEffect, useMemo, useState } from "react";
import useStore from "../../../../../store/store";
import { apiGet } from "../../../../../utils/axiosInterceptors";
import { fetchTooltips } from "../../../../../utils";
import SubTrack from "../../../../../assets/svgs/Subtract.svg";
import useTooltips from "../../../../../utils/useTooltips";
import TooltipIcon from "../../../../common/TooltipIcon";

const RestaurantInformation = ({ data, updateData, errors = {}, isUpdateMode = false }) => {
    const { 
        checkRestaurantName, 
        clearRestaurantNameCheck,
        restaurantNameCheckLoading, 
        restaurantNameCheckError, 
        restaurantNameExists,
        completeOnboardingData,
        subscriptionDetails,
        fetchCurrentSubscriptionDetails
    } = useStore();
    const tooltips = useTooltips('onboarding-basic');
    
    // Check if Basic Information step is completed
    const isBasicInfoCompleted = completeOnboardingData["Basic Information"]?.status === true;
    
    const [localRestaurantName, setLocalRestaurantName] = useState("");
    
    // Initialize local state with data when component mounts or data changes
    useEffect(() => {

        if (data.restaurantName) {
            setLocalRestaurantName(data.restaurantName);
        }
    }, [data.restaurantName]);
    const [debounceTimer, setDebounceTimer] = useState(null);

    // Load subscription details to drive dynamic location limits + pricing
    useEffect(() => {
        // Don't block UX if this fails; UI will gracefully fall back
        fetchCurrentSubscriptionDetails?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const locationSelectModel = useMemo(() => {
        const pkg = subscriptionDetails?.package || null;
        const restaurant = subscriptionDetails?.restaurant || null;

        const maxFromPlan = typeof pkg?.max_locations === 'number' ? pkg.max_locations : null;
        const pricePerLocation = typeof pkg?.price_per_location === 'number' ? pkg.price_per_location : null;

        const actualCount = typeof restaurant?.actual_location_count === 'number' ? restaurant.actual_location_count : null;
        const remainingAddable = typeof restaurant?.remaining_addable_locations === 'number' ? restaurant.remaining_addable_locations : null;
        const computedMaxAddableTotal = (actualCount !== null && remainingAddable !== null) ? (actualCount + remainingAddable) : null;

        // Hard safety caps (avoid huge dropdowns if backend misconfigures max_locations)
        const hardCap = 100;
        const maxDropdown = Math.max(
            1,
            Math.min(
                hardCap,
                maxFromPlan ?? computedMaxAddableTotal ?? 5
            )
        );

        // If API gives an explicit addable total, disable options above it.
        const maxSelectable = Math.max(
            1,
            Math.min(maxDropdown, computedMaxAddableTotal ?? maxDropdown)
        );

        return {
            maxDropdown,
            maxSelectable,
            pricePerLocation,
            actualCount,
            remainingAddable
        };
    }, [subscriptionDetails]);

    const numberOfLocationsOptions = useMemo(() => {
        const options = [];
        for (let i = 1; i <= locationSelectModel.maxDropdown; i += 1) {
            const disabled = i > locationSelectModel.maxSelectable;
            options.push({ value: String(i), label: String(i), disabled });
        }
        return options;
    }, [locationSelectModel.maxDropdown, locationSelectModel.maxSelectable]);

    // Clear restaurant name validation state when in update mode
    useEffect(() => {
        if (isUpdateMode) {
            clearRestaurantNameCheck();
        }
    }, [isUpdateMode, clearRestaurantNameCheck]);

    // Debounced restaurant name check
    useEffect(() => {
        // Skip restaurant name validation in update mode
        if (isUpdateMode) {
            return;
        }

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        if (localRestaurantName && localRestaurantName.trim().length > 2) {
            const timer = setTimeout(() => {
                checkRestaurantName(localRestaurantName);
            }, 1000); // 1 second delay

            setDebounceTimer(timer);
        } else {
            clearRestaurantNameCheck();
        }

        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
        };
    }, [localRestaurantName, checkRestaurantName, clearRestaurantNameCheck, isUpdateMode]);

    // Update local state and parent data
    const handleRestaurantNameChange = (value) => {
        setLocalRestaurantName(value);
        updateData('restaurantName', value);
    };

    // Handle blur event - check restaurant name when user moves to next field
    const handleRestaurantNameBlur = () => {
        // Skip restaurant name validation in update mode
        if (isUpdateMode) {
            return;
        }
        
        if (localRestaurantName && localRestaurantName.trim().length > 2) {
            checkRestaurantName(localRestaurantName);
        }
    };

    // Combine local errors with API errors
    const combinedErrors = {
        ...errors,
        restaurantName: errors.restaurantName || restaurantNameCheckError
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600 mb-2">Restaurant Information</h3>
               
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
                {/* Restaurant Name */}
                <div>
                    <label htmlFor="restaurantName" className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Name <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips["restaurant_name"]} />
                    </label>
                    <div className="relative">
                        <Input 
                            type="text" 
                            id="restaurantName" 
                            placeholder="Enter your company name" 
                            className={`w-full h-11 rounded-lg text-sm ${
                                combinedErrors.restaurantName ? 'border-red-500' : 'border-gray-300'
                            } ${(isBasicInfoCompleted || isUpdateMode) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            value={(() => {
                                const displayValue = isUpdateMode || isBasicInfoCompleted ? (data.restaurantName || "") : localRestaurantName;
                                
                                return displayValue;
                            })()}
                            onChange={(e) => handleRestaurantNameChange(e.target.value)}
                            onBlur={handleRestaurantNameBlur}
                            status={combinedErrors.restaurantName ? 'error' : ''}
                            disabled={restaurantNameCheckLoading || isBasicInfoCompleted || isUpdateMode}
                        />
                        {restaurantNameCheckLoading && !isUpdateMode && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                    {combinedErrors.restaurantName && !isUpdateMode && (
                        <span className="text-red-500 text-xs mt-1">{combinedErrors.restaurantName}</span>
                    )}
                    {localRestaurantName && localRestaurantName.trim().length > 2 && !restaurantNameCheckLoading && !restaurantNameCheckError && !restaurantNameExists && !isUpdateMode && (
                        <span className="text-green-500 text-xs mt-1">✓ Company name is available</span>
                    )}
                    {isBasicInfoCompleted && !isUpdateMode && (
                        <span className="text-blue-500 text-xs mt-1">🔒 Company name is locked (cannot be changed after completion)</span>
                    )}
                    {isUpdateMode && (
                        <span className="text-blue-500 text-xs mt-1">🔒 Company name is locked in update mode</span>
                    )}
                    </div>
                </div>
                
                {/* Number of Locations */}
                <div>

                    <label htmlFor="numberOfLocations" className="block text-sm font-semibold text-gray-700 mb-2">
                        Number of Locations <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['number_of_locations']} />
                    </label>

                    <Select 
                        id="numberOfLocations" 
                        placeholder="Select Locations" 
                        className={`w-full h-11 rounded-lg text-sm ${
                            errors.numberOfLocations ? 'border-red-500' : ''
                        }`}
                        value={data.numberOfLocations}
                        onChange={(value) => updateData('numberOfLocations', value)}
                        status={errors.numberOfLocations ? 'error' : ''}
                        options={numberOfLocationsOptions}
                    />
                    {errors.numberOfLocations && (
                        <span className="text-red-500 text-xs mt-1">{errors.numberOfLocations}</span>
                    )}

                    {/* Professional helper text driven by subscription/current */}
                    <div className="mt-2 text-xs text-gray-600">
                        {subscriptionDetails?.package?.max_locations !== undefined && (
                            <div>
                                Your plan allows up to <span className="font-semibold">{subscriptionDetails.package.max_locations}</span> locations.
                                {locationSelectModel.actualCount !== null && (
                                    <>
                                        {" "}You currently have <span className="font-semibold">{locationSelectModel.actualCount}</span>.
                                    </>
                                )}
                                {locationSelectModel.remainingAddable !== null && (
                                    <>
                                        {" "}You can add <span className="font-semibold">{locationSelectModel.remainingAddable}</span> more.
                                    </>
                                )}
                            </div>
                        )}
                        {locationSelectModel.pricePerLocation !== null && data.numberOfLocations && (
                            <div className="mt-1">
                                Estimated monthly total:{" "}
                                <span className="font-semibold">
                                    ${Number(locationSelectModel.pricePerLocation * Number(data.numberOfLocations || 1)).toFixed(0)}
                                </span>
                                {" "}(${Number(locationSelectModel.pricePerLocation).toFixed(0)}/location)
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Location Name */}
                <div>
                    <label htmlFor="locationName" className="block text-sm font-semibold text-gray-700 mb-2">
                        Location Name <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['location_name']} />
                    </label>
                    <Input 
                        type="text" 
                        id="locationName" 
                        placeholder="Enter your location" 
                        className={`w-full h-11 rounded-lg text-sm ${
                            errors.locationName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={data.locationName || ""}
                        onChange={(e) => {
                            updateData('locationName', e.target.value);
                        }}
                        status={errors.locationName ? 'error' : ''}
                    />
                    {errors.locationName && (
                        <span className="text-red-500 text-xs mt-1">{errors.locationName}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RestaurantInformation;