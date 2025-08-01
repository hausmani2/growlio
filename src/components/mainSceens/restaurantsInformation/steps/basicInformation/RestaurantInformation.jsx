import { Input, Select } from "antd";
import { useEffect, useState } from "react";
import useStore from "../../../../../store/store";

const RestaurantInformation = ({ data, updateData, errors = {} }) => {
    const { 
        checkRestaurantName, 
        clearRestaurantNameCheck,
        restaurantNameCheckLoading, 
        restaurantNameCheckError, 
        restaurantNameExists,
        completeOnboardingData
    } = useStore();
    
    // Debug: Log the data being passed to the component
    console.log("=== RestaurantInformation Component Debug ===");
    console.log("data:", data);
    console.log("errors:", errors);
    console.log("restaurantNameCheckLoading:", restaurantNameCheckLoading);
    console.log("restaurantNameCheckError:", restaurantNameCheckError);
    console.log("restaurantNameExists:", restaurantNameExists);
    
    // Check if Basic Information step is completed
    const isBasicInfoCompleted = completeOnboardingData["Basic Information"]?.status === true;
    console.log("isBasicInfoCompleted:", isBasicInfoCompleted);
    
    const [localRestaurantName, setLocalRestaurantName] = useState(data.restaurantName || "");
    const [debounceTimer, setDebounceTimer] = useState(null);

    // Debounced restaurant name check
    useEffect(() => {
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
    }, [localRestaurantName, checkRestaurantName, clearRestaurantNameCheck]);

    // Update local state and parent data
    const handleRestaurantNameChange = (value) => {
        setLocalRestaurantName(value);
        updateData('restaurantName', value);
    };

    // Handle blur event - check restaurant name when user moves to next field
    const handleRestaurantNameBlur = () => {
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
        <div>
            <div className="flex mt-5">
                <div className="w-[40%]">
                    <div className="flex flex-col gap-2">
                        <h4 className="text-lg !font-bold !mb-0">Restaurant Information</h4>
                        <span className="text-base text-neutral-600">
                            Tell us about your restaurant — name, category, and a short description to help customers get to know you.
                        </span>
                    </div>
                </div>
                <div className="w-[60%]">
                    <div className="flex flex-col gap-3 p-6 bg-white rounded-xl">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="restaurantName" className="text-base !font-bold text-neutral-600">
                                Restaurant Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                                                 <Input 
                                     type="text" 
                                     id="restaurantName" 
                                     placeholder="Enter your restaurant name" 
                                     className={`w-full p-2 border h-[40px] rounded-md text-base font-normal text-neutral-700 ${
                                         combinedErrors.restaurantName ? 'border-red-500' : 'border-gray-300'
                                     } ${isBasicInfoCompleted ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                     value={localRestaurantName}
                                     onChange={(e) => handleRestaurantNameChange(e.target.value)}
                                     onBlur={handleRestaurantNameBlur}
                                     status={combinedErrors.restaurantName ? 'error' : ''}
                                     disabled={restaurantNameCheckLoading || isBasicInfoCompleted}
                                 />
                                {restaurantNameCheckLoading && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                            </div>
                            {combinedErrors.restaurantName && (
                                <span className="text-red-500 text-sm">{combinedErrors.restaurantName}</span>
                            )}
                                                         {localRestaurantName && localRestaurantName.trim().length > 2 && !restaurantNameCheckLoading && !restaurantNameCheckError && !restaurantNameExists && (
                                 <span className="text-green-500 text-sm">✓ Restaurant name is available</span>
                             )}
                             {isBasicInfoCompleted && (
                                 <span className="text-blue-500 text-sm">🔒 Restaurant name is locked (cannot be changed after completion)</span>
                             )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label htmlFor="numberOfLocations" className="text-base !font-bold text-neutral-600">
                                Number of Locations <span className="text-red-500">*</span>
                            </label>
                            <Select 
                                id="numberOfLocations" 
                                placeholder="Select Locations" 
                                className={`w-full !h-[40px] rounded-md text-base font-normal text-neutral-700 ${
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
                                <span className="text-red-500 text-sm">{errors.numberOfLocations}</span>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label htmlFor="locationName" className="text-base !font-bold text-neutral-600">
                                Location Name <span className="text-red-500">*</span>
                            </label>
                            <Input 
                                type="text" 
                                id="locationName" 
                                placeholder="Enter your location" 
                                className={`w-full p-2 border h-[40px] rounded-md text-base font-normal text-neutral-700 ${
                                    errors.locationName ? 'border-red-500' : 'border-gray-300'
                                }`}
                                value={data.locationName || ""}
                                onChange={(e) => {
                                    console.log('Location name changed to:', e.target.value);
                                    updateData('locationName', e.target.value);
                                }}
                                status={errors.locationName ? 'error' : ''}
                            />
                            {errors.locationName && (
                                <span className="text-red-500 text-sm">{errors.locationName}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantInformation;