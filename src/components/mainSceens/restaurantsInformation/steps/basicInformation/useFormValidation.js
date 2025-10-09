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
        if (!addressData.city) {
            errors.city = VALIDATION_MESSAGES.CITY;
        }
        if (!addressData.zipCode?.trim()) {
            errors.zipCode = VALIDATION_MESSAGES.ZIP_CODE;
        } else {
            // Country-specific validation
            const zipCode = addressData.zipCode.trim();
            let isValid = false;
            
            if (addressData.country === '1') { // United States
                // US ZIP code: 5 digits or 5 digits + 4 digits (12345 or 12345-6789)
                isValid = /^\d{5}(-\d{4})?$/.test(zipCode);
            } else if (addressData.country === '2') { // Canada
                // Canadian postal code: A1A 1A1 format (letter-digit-letter space digit-letter-digit)
                isValid = /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(zipCode);
            } else {
                // For other countries, use flexible alphanumeric validation
                isValid = /^[A-Za-z0-9\s-]{3,10}$/.test(zipCode);
            }
            
            if (!isValid) {
                errors.zipCode = VALIDATION_MESSAGES.INVALID_ZIP;
            }
        }

        return errors;
    }, []);

    const validateAddressTypeInfo = useCallback((addressTypeData) => {
        const errors = {};

        if (!addressTypeData.sqft?.trim()) {
            errors.sqft = VALIDATION_MESSAGES.SQFT;
        } else if (isNaN(addressTypeData.sqft) || parseInt(addressTypeData.sqft) <= 0) {
            errors.sqft = VALIDATION_MESSAGES.INVALID_SQFT;
        }
        
        if (!addressTypeData.isFranchise) {
            errors.isFranchise = VALIDATION_MESSAGES.FRANCHISE;
        }
        
        if (!addressTypeData.restaurantType?.trim()) {
            errors.restaurantType = VALIDATION_MESSAGES.RESTAURANT_TYPE;
        }
        
        if (!addressTypeData.menuType?.trim()) {
            errors.menuType = VALIDATION_MESSAGES.MENU_TYPE;
        } else {
        }

        return errors;
    }, []);

    const validateAllForms = useCallback((restaurantData, addressData, addressTypeData) => {
        const restaurantErrors = validateRestaurantInfo(restaurantData);
        const addressErrors = validateAddressInfo(addressData);
        const addressTypeErrors = validateAddressTypeInfo(addressTypeData);

        const allErrors = {
            ...restaurantErrors,
            ...addressErrors,
            ...addressTypeErrors
        };

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