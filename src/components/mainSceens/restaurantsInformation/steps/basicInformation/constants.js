export const LOCATION_OPTIONS = [
    { value: '1', label: '1' }, 
    { value: '2', label: '2', disabled: true }, 
    { value: '3', label: '3', disabled: true }, 
    { value: '4', label: '4', disabled: true }, 
    { value: '5', label: '5', disabled: true }
];

export const COUNTRY_OPTIONS = [
    { value: '1', label: 'United States' },
    { value: '2', label: 'Canada' },
    { value: '3', label: 'United Kingdom' }
];

export const STATE_OPTIONS = [
    { value: '1', label: 'California' },
    { value: '2', label: 'New York' },
    { value: '3', label: 'Texas' }
];

export const FRANCHISE_OPTIONS = [
    { value: '1', label: 'No' },
    { value: '2', label: 'Yes' }
];

export const FORM_SECTIONS = {
    RESTAURANT_INFO: {
        title: 'Restaurant Information',
        description: 'Tell us about your restaurant — name, category, and a short description to help customers get to know you.'
    },
    ADDRESS_INFO: {
        title: 'Address Information',
        description: 'Tell us about your restaurant — name, category, and a short description to help customers get to know you.'
    },
    RESTAURANT_DETAILS: {
        title: 'Restaurant Details',
        description: 'Tell us about your restaurant — name, category, and a short description to help customers get to know you.'
    }
};

export const VALIDATION_MESSAGES = {
    REQUIRED: 'This field is required',
    INVALID_ZIP: 'Please enter a valid zip code',
    INVALID_SQFT: 'Please enter a valid square footage',
    RESTAURANT_NAME: 'Restaurant name is required',
    NUMBER_OF_LOCATIONS: 'Number of locations is required',
    LOCATION_NAME: 'Location name is required',
    ADDRESS: 'Address is required',
    COUNTRY: 'Country is required',
    STATE: 'State is required',
    ZIP_CODE: 'Zip code is required',
    SQFT: 'Square footage is required',
    FRANCHISE: 'Please select if this is a franchise',
    RESTAURANT_TYPE: 'Restaurant type is required',
    MENU_TYPE: 'Menu type is required'
}; 