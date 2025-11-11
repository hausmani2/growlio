/**
 * Parse Google Geocoding API address components
 * Extracts city, state, zip code, and country from address_components
 * 
 * @param {Array} addressComponents - Address components from Google Geocoding API
 * @returns {Object} - { city, state, zipCode, country }
 */
export const parseAddressComponents = (addressComponents) => {
    if (!addressComponents || !Array.isArray(addressComponents)) {
        return { city: '', state: '', zipCode: '', country: '' };
    }

    const result = {
        city: '',
        state: '',
        zipCode: '',
        country: '',
    };

    addressComponents.forEach((component) => {
        const types = component.types;

        // Extract city
        if (types.includes('locality')) {
            result.city = component.long_name;
        } else if (!result.city && types.includes('administrative_area_level_2')) {
            result.city = component.long_name;
        }

        // Extract state/province
        if (types.includes('administrative_area_level_1')) {
            result.state = component.short_name; // Use short_name for state codes (e.g., "TX", "ON")
        }

        // Extract postal code
        if (types.includes('postal_code')) {
            result.zipCode = component.long_name;
        }

        // Extract country
        if (types.includes('country')) {
            result.country = component.short_name; // Use short_name for country codes (e.g., "US", "CA")
        }
    });

    return result;
};

/**
 * Map country code to form country value
 * Maps ISO country codes to form values (e.g., "US" -> "1", "CA" -> "2")
 * 
 * @param {string} countryCode - ISO country code (e.g., "US", "CA")
 * @returns {string} - Form country value
 */
export const mapCountryCodeToFormValue = (countryCode) => {
    const countryMap = {
        'US': '1', // United States of America
        'CA': '2', // Canada
    };
    return countryMap[countryCode] || '';
};

/**
 * Map form country value to country code
 * Maps form values to ISO country codes (e.g., "1" -> "US", "2" -> "CA")
 * 
 * @param {string} formValue - Form country value
 * @returns {string} - ISO country code for Google Places API
 */
export const mapFormValueToCountryCode = (formValue) => {
    const formMap = {
        '1': 'us', // United States of America
        '2': 'ca', // Canada
    };
    return formMap[formValue] || null;
};

