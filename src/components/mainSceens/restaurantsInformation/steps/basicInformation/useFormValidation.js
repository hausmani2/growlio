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
            // Flexible validation - allow any combination of letters and numbers
            const zipCode = addressData.zipCode.trim();
            // Allow any combination of letters, numbers, spaces, and hyphens
            // Minimum 2 characters, maximum 20 characters
            const isValid = /^[A-Za-z0-9\s-]{2,20}$/.test(zipCode);
            
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

    const validateAdditionalLocations = useCallback((additionalLocations = []) => {
        const errors = {};

        additionalLocations.forEach((loc, idx) => {
            const locationNumber = idx + 2; // locations start from 2 here

            if (!loc?.locationName?.trim()) {
                errors[`location_${locationNumber}_locationName`] = VALIDATION_MESSAGES.LOCATION_NAME;
            }
            if (!loc?.address1?.trim()) {
                errors[`location_${locationNumber}_address1`] = VALIDATION_MESSAGES.ADDRESS;
            }
            if (!loc?.country) {
                errors[`location_${locationNumber}_country`] = VALIDATION_MESSAGES.COUNTRY;
            }
            if (!loc?.state) {
                errors[`location_${locationNumber}_state`] = VALIDATION_MESSAGES.STATE;
            }
            if (!loc?.city) {
                errors[`location_${locationNumber}_city`] = VALIDATION_MESSAGES.CITY;
            }

            if (!loc?.zipCode?.trim()) {
                errors[`location_${locationNumber}_zipCode`] = VALIDATION_MESSAGES.ZIP_CODE;
            } else {
                const zipCode = loc.zipCode.trim();
                const isValid = /^[A-Za-z0-9\s-]{2,20}$/.test(zipCode);
                if (!isValid) {
                    errors[`location_${locationNumber}_zipCode`] = VALIDATION_MESSAGES.INVALID_ZIP;
                }
            }
        });

        return errors;
    }, []);

    const validateAllForms = useCallback((restaurantData, addressData, addressTypeData, additionalLocations = []) => {
        const restaurantErrors = validateRestaurantInfo(restaurantData);
        const addressErrors = validateAddressInfo(addressData);
        const addressTypeErrors = validateAddressTypeInfo(addressTypeData);
        const additionalLocationsErrors = validateAdditionalLocations(additionalLocations);

        const allErrors = {
            ...restaurantErrors,
            ...addressErrors,
            ...addressTypeErrors,
            ...additionalLocationsErrors
        };

        setValidationErrors(allErrors);
        return Object.keys(allErrors).length === 0;
    }, [validateRestaurantInfo, validateAddressInfo, validateAddressTypeInfo, validateAdditionalLocations]);

    const clearAllErrors = useCallback(() => {
        setValidationErrors({});
    }, []);

    return {
        validationErrors,
        clearFieldError,
        validateRestaurantInfo,
        validateAddressInfo,
        validateAddressTypeInfo,
        validateAdditionalLocations,
        validateAllForms,
        clearAllErrors
    };
};

export default useFormValidation; 