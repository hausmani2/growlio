import { Input, Select } from 'antd';
import useTooltips from '../../../../../utils/useTooltips';
import TooltipIcon from '../../../../common/TooltipIcon';
import PlaceSearchInput from '../../../../common/PlaceSearchInput';
import { US_STATES, CANADA_PROVINCES, COUNTRY_OPTIONS } from './constants';
import { parseAddressComponents, mapCountryCodeToFormValue, mapFormValueToCountryCode } from '../../../../../utils/parseAddressComponents';

const AddressInformation = ({ data, updateData, errors = {} }) => {
    const tooltips = useTooltips('onboarding-basic');
    
    // Get Google Maps API key from environment variables
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    // Handle address selection from Google Places
    const handleAddressSelect = (formattedAddress, latitude, longitude, details) => {
        // Update address1 with formatted address
        updateData('address1', formattedAddress);
        
        // Update latitude and longitude if available
        if (latitude !== null && longitude !== null) {
            updateData('latitude', latitude);
            updateData('longitude', longitude);
        } else {
        }
        
        // Parse and auto-fill address components if available
        if (details && details.address_components) {
            const parsed = parseAddressComponents(details.address_components);
            
            // Update city
            if (parsed.city) {
                updateData('city', parsed.city);
            }
            
            // Update state/province
            if (parsed.state) {
                updateData('state', parsed.state);
            }
            
            // Update zip code
            if (parsed.zipCode) {
                updateData('zipCode', parsed.zipCode);
            }
            
            // Update country if it matches our options
            if (parsed.country) {
                const countryFormValue = mapCountryCodeToFormValue(parsed.country);
                if (countryFormValue) {
                    updateData('country', countryFormValue);
                }
            }
        }
    };
    
    // Get country restriction for Google Places API
    const getCountryRestriction = () => {
        if (!data.country) return null;
        return mapFormValueToCountryCode(data.country);
    };

    // Helper function to get country display value
    const getCountryDisplayValue = () => {
        return data.country || undefined;
    };

    // Helper function to get state display value
    const getStateDisplayValue = () => {
        if (!data.state) return undefined;
        
        const countryCode = getCountryCodeForStates();
        
        // For US states, return the state code (dropdown will show the name)
        if (countryCode === 'US' && US_STATES[data.state]) {
            return data.state; // Return "TX" for Texas
        }
        
        // For Canadian provinces, return the province code (dropdown will show the name)
        if (countryCode === 'CA') {
            const province = CANADA_PROVINCES.find(p => p.value === data.state);
            if (province) {
                return data.state; // Return "ON" for Ontario
            }
        }
        
        return data.state;
    };

    // Helper function to get country code for state dropdown logic
    const getCountryCodeForStates = () => {
        if (!data.country) return null;
        
        // Map from COUNTRY_OPTIONS values to country codes
        const countryMap = {
            '1': 'US', // United States of America
            '2': 'CA'  // Canada
        };
        
        return countryMap[data.country] || null;
    };

    // Helper function to get state display label
    const getStateDisplayLabel = () => {
        if (!data.state) return undefined;
        
        const countryCode = getCountryCodeForStates();
        
        // For US states, return the state name
        if (countryCode === 'US' && US_STATES[data.state]) {
            return US_STATES[data.state]; // Return the full state name
        }
        
        // For Canadian provinces, return the province name
        if (countryCode === 'CA') {
            const province = CANADA_PROVINCES.find(p => p.value === data.state);
            if (province) {
                return province.label; // Return the full province name
            }
        }
        
        return data.state; // Fallback to the code if not found
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600 mb-2">Location Address</h3>
                    {/* <p className="text-gray-600 text-sm">
                        Tell us about your restaurant location and address details.
                    </p> */}
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
                   {/* Country */}
                   <div>
                    <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                        Country <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['country']} />
                    </label>
                    <Select 
                        id="country" 
                        placeholder="Select Country" 
                        className={`w-full h-11 rounded-lg text-sm ${
                            errors.country ? 'border-red-500' : ''
                        }`}
                        value={getCountryDisplayValue()}
                        onChange={(value) => {
                            updateData('country', value);
                            // Clear state when country changes
                            updateData('state', '');
                        }}
                        status={errors.country ? 'error' : ''}
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {COUNTRY_OPTIONS.map((country) => (
                            <Select.Option key={country.value} value={country.value}>
                                {country.label}
                            </Select.Option>
                        ))}
                    </Select>
                    {errors.country && (
                        <span className="text-red-500 text-xs mt-1">{errors.country}</span>
                    )}
                </div>
                {/* Address 1 */}
                <div>
                    <label htmlFor="address1" className="block text-sm font-semibold text-gray-700 mb-2">
                        Address 1 <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['address_1']} />
                    </label>
                    {GOOGLE_MAPS_API_KEY ? (
                        <PlaceSearchInput
                            apiKey={GOOGLE_MAPS_API_KEY}
                            placeholder="Search for an address or type manually..."
                            value={data.address1}
                            onChange={(value) => updateData('address1', value)}
                            onSelect={handleAddressSelect}
                            countryRestriction={getCountryRestriction()}
                            hasError={!!errors.address1}
                        />
                    ) : (
                        <Input.TextArea 
                            id="address1" 
                            placeholder="Enter Address" 
                            className={`w-full h-16 rounded-lg text-sm ${
                                errors.address1 ? 'border-red-500' : 'border-gray-300'
                            }`}
                            value={data.address1}
                            onChange={(e) => updateData('address1', e.target.value)}
                            status={errors.address1 ? 'error' : ''}
                        />
                    )}
                    {errors.address1 && (
                        <span className="text-red-500 text-xs mt-1">{errors.address1}</span>
                    )}
                    {!GOOGLE_MAPS_API_KEY && (
                        <span className="text-gray-500 text-xs mt-1">
                            Note: Add VITE_GOOGLE_MAPS_API_KEY to your .env file to enable address autocomplete
                        </span>
                    )}
                </div>
               
               {/* Address 2 */}
               <div>
                    <label htmlFor="address2" className="block text-sm font-semibold text-gray-700 mb-2">
                        Address 2 <span className="text-red-500"></span>
                    </label>
                    <Input.TextArea 
                        id="address2" 
                        placeholder="Enter Address" 
                        className={`w-full h-16 rounded-lg text-sm ${
                            errors.address1 ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={data.address2}
                        onChange={(e) => updateData('address2', e.target.value)}
                        status={errors.address2 ? 'error' : ''}
                    />
                    {errors.address2 && (
                        <span className="text-red-500 text-xs mt-1">{errors.address2}</span>
                    )}
                </div>

                {/* City */}
                <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['city']} />
                    </label>
                    <Input 
                        type="text" 
                        id="city" 
                        placeholder="Enter City" 
                        className={`w-full h-11 rounded-lg text-sm ${
                            errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={data.city}
                        onChange={(e) => updateData('city', e.target.value)}
                        status={errors.city ? 'error' : ''}
                    />
                    {errors.city && (
                        <span className="text-red-500 text-xs mt-1">{errors.city}</span>
                    )}
                </div>
             
                
                {/* State/Province */}
                <div>
                    <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-2">
                      State/Province <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['state']} />
                    </label>
                    <Select 
                        id="state" 
                        placeholder={`Select State/Province`}
                        className={`w-full h-11 rounded-lg text-sm cursor-pointer ${
                            errors.state ? 'border-red-500' : ''
                        }`}
                        value={getStateDisplayValue()}
                        onChange={(value) => updateData('state', value)}
                        status={errors.state ? 'error' : ''}
                        allowClear
                        disabled={!data.country}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {getCountryCodeForStates() === 'US' && Object.entries(US_STATES).map(([code, name]) => (
                            <Select.Option key={code} value={code}>{name}</Select.Option>
                        ))}
                        {getCountryCodeForStates() === 'CA' && CANADA_PROVINCES.map((province) => (
                            <Select.Option key={province.value} value={province.value}>
                                {province.label}
                            </Select.Option>
                        ))}
                    </Select>
               
                    {errors.state && (
                        <span className="text-red-500 text-xs mt-1">{errors.state}</span>
                    )}
                </div>
                
                {/* Postal Code */}
                <div>
                    <label htmlFor="zipCode" className="block text-sm font-semibold text-gray-700 mb-2">
                        Zip Code <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['zip_code']} />
                    </label>
                    <Input 
                        type="text" 
                        id="zipCode" 
                        placeholder={
                            data.country === '1' 
                                ? "Enter ZIP Code (e.g., 12345 or 12345-6789)" 
                                : data.country === '2' 
                                ? "Enter Postal Code (e.g., K1A 0A6)" 
                                : "Enter Postal Code"
                        }
                        className={`w-full h-11 rounded-lg text-sm ${
                            errors.zipCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={data.zipCode}
                        onChange={(e) => updateData('zipCode', e.target.value)}
                        status={errors.zipCode ? 'error' : ''}
                    />
                    {errors.zipCode && (
                        <span className="text-red-500 text-xs mt-1">{errors.zipCode}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddressInformation;