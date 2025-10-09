export const LOCATION_OPTIONS = [
    { value: '1', label: '1' }, 
    { value: '2', label: '2', disabled: true }, 
    { value: '3', label: '3', disabled: true }, 
    { value: '4', label: '4', disabled: true }, 
    { value: '5', label: '5', disabled: true }
];

export const COUNTRY_OPTIONS = [
    { value: '1', label: 'United States of America' },
    { value: '2', label: 'Canada' },
];

// export const STATE_OPTIONS = [
//     { value: '1', label: 'California' },
//     { value: '2', label: 'New York' },
//     { value: '3', label: 'Texas' }
// ];

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
    INVALID_ZIP: 'Please enter a valid postal code',
    INVALID_SQFT: 'Please enter a valid square footage',
    RESTAURANT_NAME: 'Restaurant name is required',
    NUMBER_OF_LOCATIONS: 'Number of locations is required',
    LOCATION_NAME: 'Location name is required',
    ADDRESS: 'Address is required',
    COUNTRY: 'Country is required',
    STATE: 'State is required',
    ZIP_CODE: 'Postal code is required',
    SQFT: 'Square footage is required',
    FRANCHISE: 'Please select if this is a franchise',
    RESTAURANT_TYPE: 'Restaurant type is required',
    MENU_TYPE: 'Menu type is required',
    CITY: 'City is required'
}; 


export const US_STATES = {
  'AL': 'Alabama',
  'AK': 'Alaska',
  'AZ': 'Arizona',
  'AR': 'Arkansas',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DE': 'Delaware',
  'FL': 'Florida',
  'GA': 'Georgia',
  'HI': 'Hawaii',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'IA': 'Iowa',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'ME': 'Maine',
  'MD': 'Maryland',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MS': 'Mississippi',
  'MO': 'Missouri',
  'MT': 'Montana',
  'NE': 'Nebraska',
  'NV': 'Nevada',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NY': 'New York',
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'RI': 'Rhode Island',
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VT': 'Vermont',
  'VA': 'Virginia',
  'WA': 'Washington',
  'WV': 'West Virginia',
  'WI': 'Wisconsin',
  'WY': 'Wyoming',
  'DC': 'District of Columbia',
  'AS': 'American Samoa',
  'GU': 'Guam',
  'MP': 'Northern Mariana Islands',
  'PR': 'Puerto Rico',
  'UM': 'United States Minor Outlying Islands',
  'VI': 'Virgin Islands, U.S.'
};

export const CANADA_PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' }
];