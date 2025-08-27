import { Input, Select, Tooltip } from "antd";
import { useEffect, useState } from "react";
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
        completeOnboardingData
    } = useStore();
    const tooltips = useTooltips('onboarding-basic');
    
    // Check if Basic Information step is completed
    const isBasicInfoCompleted = completeOnboardingData["Basic Information"]?.status === true;
    
    const [localRestaurantName, setLocalRestaurantName] = useState("");
    
    // Initialize local state with data when component mounts or data changes
    useEffect(() => {
        console.log("🔍 RestaurantInformation received data:", data);
        console.log("🔍 Restaurant name in data:", data.restaurantName);
        if (data.restaurantName) {
            setLocalRestaurantName(data.restaurantName);
            console.log("✅ Local restaurant name set to:", data.restaurantName);
        }
    }, [data.restaurantName]);
    const [debounceTimer, setDebounceTimer] = useState(null);

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
                        Restaurant Name <span className="text-red-500">*</span>
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
                                console.log("🔍 Restaurant name display value:", {
                                    isUpdateMode,
                                    isBasicInfoCompleted,
                                    dataRestaurantName: data.restaurantName,
                                    localRestaurantName,
                                    finalValue: displayValue
                                });
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
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                    <label htmlFor="numberOfLocations" className="block text-sm font-semibold text-gray-700">
                        Number of Locations <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['number_of_locations']} />
                    </label>
                    </div>
                    <Select 
                        id="numberOfLocations" 
                        placeholder="Select Locations" 
                        className={`w-full h-11 rounded-lg text-sm ${
                            errors.numberOfLocations ? 'border-red-500' : ''
                        }`}
                        value={data.numberOfLocations}
                        onChange={(value) => updateData('numberOfLocations', value)}
                        status={errors.numberOfLocations ? 'error' : ''}
                        options={[
                            { value: '1', label: '1' }, 
                            { value: '2', label: '2', disabled: true }, 
                            { value: '3', label: '3', disabled: true }, 
                            { value: '4', label: '4', disabled: true }, 
                            { value: '5', label: '5', disabled: true }
                        ]}
                    />
                    {errors.numberOfLocations && (
                        <span className="text-red-500 text-xs mt-1">{errors.numberOfLocations}</span>
                    )}
                </div>
                
                {/* Location Name */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">

                    <label htmlFor="locationName" className="block text-sm font-semibold text-gray-700">
                        Location Name <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['location_name']} />
                    </label>
                    <Tooltip placement="topLeft" title="Enter the name of the location where the restaurant is located">
                            <img src={SubTrack} alt="SubTrack" className="w-4 h-4" />
                        </Tooltip>
                    </div>
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