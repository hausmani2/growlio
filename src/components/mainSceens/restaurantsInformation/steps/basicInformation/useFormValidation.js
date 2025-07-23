import { useState, useCallback } from 'react';
import { VALIDATION_MESSAGES } from './constants';

const useFormValidation = () => {
    const [validationErrors, setValidationErrors] = useState({});

    const clearFieldError = useCallback((fieldName) => {
        if (validationErrors[fieldName]) {
            setValidationErrors(prev => ({
                ...prev,
                [fieldName]: null
            }));
        }
    }, [validationErrors]);

    const validateRestaurantInfo = useCallback((restaurantData) => {
        const errors = {};

        if (!restaurantData.restaurantName?.trim()) {
            errors.restaurantName = VALIDATION_MESSAGES.RESTAURANT_NAME;
        }
        if (!restaurantData.numberOfLocations) {
            errors.numberOfLocations = VALIDATION_MESSAGES.NUMBER_OF_LOCATIONS;
        }
        if (!restaurantData.locationName?.trim()) {
            errors.locationName = VALIDATION_MESSAGES.LOCATION_NAME;
        }

        return errors;
    }, []);

    const validateAddressInfo = useCallback((addressData) => {
        const errors = {};

        if (!addressData.address1?.trim()) {
            errors.address1 = VALIDATION_MESSAGES.ADDRESS;
        }
        if (!addressData.country) {
            errors.country = VALIDATION_MESSAGES.COUNTRY;
        }
        if (!addressData.state) {
            errors.state = VALIDATION_MESSAGES.STATE;
        }
        if (!addressData.zipCode?.trim()) {
            errors.zipCode = VALIDATION_MESSAGES.ZIP_CODE;
        } else if (!/^\d{5}(-\d{4})?$/.test(addressData.zipCode)) {
            errors.zipCode = VALIDATION_MESSAGES.INVALID_ZIP;
        }

        return errors;
    }, []);

    const validateAddressTypeInfo = useCallback((addressTypeData) => {
        console.log("=== Address Type Validation ===");
        console.log("Validating addressTypeData:", addressTypeData);
        
        const errors = {};

        if (!addressTypeData.sqft?.trim()) {
            errors.sqft = VALIDATION_MESSAGES.SQFT;
            console.log("❌ SQFT validation failed: missing or empty");
        } else if (isNaN(addressTypeData.sqft) || parseInt(addressTypeData.sqft) <= 0) {
            errors.sqft = VALIDATION_MESSAGES.INVALID_SQFT;
            console.log("❌ SQFT validation failed: invalid value");
        } else {
            console.log("✅ SQFT validation passed:", addressTypeData.sqft);
        }
        
        if (!addressTypeData.isFranchise) {
            errors.isFranchise = VALIDATION_MESSAGES.FRANCHISE;
            console.log("❌ Franchise validation failed: missing");
        } else {
            console.log("✅ Franchise validation passed:", addressTypeData.isFranchise);
        }
        
        if (!addressTypeData.restaurantType?.trim()) {
            errors.restaurantType = VALIDATION_MESSAGES.RESTAURANT_TYPE;
            console.log("❌ Restaurant type validation failed: missing or empty");
        } else {
            console.log("✅ Restaurant type validation passed:", addressTypeData.restaurantType);
        }
        
        if (!addressTypeData.menuType?.trim()) {
            errors.menuType = VALIDATION_MESSAGES.MENU_TYPE;
            console.log("❌ Menu type validation failed: missing or empty");
        } else {
            console.log("✅ Menu type validation passed:", addressTypeData.menuType);
        }

        console.log("Address type validation errors:", errors);
        return errors;
    }, []);

    const validateAllForms = useCallback((restaurantData, addressData, addressTypeData) => {
        console.log("=== Basic Information Validation ===");
        console.log("restaurantData:", restaurantData);
        console.log("addressData:", addressData);
        console.log("addressTypeData:", addressTypeData);
        
        const restaurantErrors = validateRestaurantInfo(restaurantData);
        const addressErrors = validateAddressInfo(addressData);
        const addressTypeErrors = validateAddressTypeInfo(addressTypeData);

        console.log("Restaurant errors:", restaurantErrors);
        console.log("Address errors:", addressErrors);
        console.log("Address type errors:", addressTypeErrors);

        const allErrors = {
            ...restaurantErrors,
            ...addressErrors,
            ...addressTypeErrors
        };

        console.log("All validation errors:", allErrors);
        console.log("Validation passed:", Object.keys(allErrors).length === 0);

        setValidationErrors(allErrors);
        return Object.keys(allErrors).length === 0;
    }, [validateRestaurantInfo, validateAddressInfo, validateAddressTypeInfo]);

    const clearAllErrors = useCallback(() => {
        setValidationErrors({});
    }, []);

    return {
        validationErrors,
        clearFieldError,
        validateRestaurantInfo,
        validateAddressInfo,
        validateAddressTypeInfo,
        validateAllForms,
        clearAllErrors
    };
};

export default useFormValidation; 