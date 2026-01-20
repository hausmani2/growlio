import React, { useState, useEffect } from 'react';
import { Input, Select, message } from 'antd';

const { Option } = Select;

const BasicInformationStep = ({ data, updateData, onNext, onBack }) => {
  const [restaurantName, setRestaurantName] = useState(data?.restaurantName || '');
  const [restaurantType, setRestaurantType] = useState(data?.restaurantType || '');
  const [menuType, setMenuType] = useState(data?.menuType || '');
  const [isFranchise, setIsFranchise] = useState(data?.isFranchise || false);
  const [city, setCity] = useState(data?.locationAddress?.city || '');
  const [state, setState] = useState(data?.locationAddress?.state || '');
  const [fullAddress, setFullAddress] = useState(data?.locationAddress?.fullAddress || '');
  const [address2, setAddress2] = useState(data?.locationAddress?.address2 || '');
  const [zipCode, setZipCode] = useState(data?.locationAddress?.zipCode || '');
  const [sqft, setSqft] = useState(data?.locationAddress?.sqft || '');

  useEffect(() => {
    updateData({
      restaurantName,
      restaurantType,
      menuType,
      isFranchise,
      locationAddress: {
        city,
        state,
        fullAddress,
        address2,
        zipCode,
        sqft
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantName, restaurantType, menuType, isFranchise, city, state, fullAddress, address2, zipCode, sqft]);

  const handleNextClick = () => {
    // Validate required fields
    if (!restaurantName.trim()) {
      message.error('Restaurant Name is required');
      return;
    }
    if (!city.trim()) {
      message.error('City is required');
      return;
    }
    if (!state) {
      message.error('State is required');
      return;
    }
    if (onNext) {
      onNext();
    }
  };

  const US_STATES = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-gray-600">
          Let's start with the basics. Tell us about your restaurant.
        </p>
      </div>

      {/* Restaurant Name Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Restaurant Name</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter restaurant name"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="h-11"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used as your Location Name
            </p>
          </div>
        </div>
      </div>

      {/* Location Address Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Location Address</h3>
          <p className="text-sm text-gray-600 mb-4">
            City and State are required. Full address is optional since this might be a possible restaurant location.
          </p>
          <div className="space-y-3">
            <div>
              <Input
                placeholder="Address Line 1 (Optional)"
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <Input
                placeholder="Address Line 2 (Optional)"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <Select
                  placeholder="Select State"
                  value={state}
                  onChange={setState}
                  className="w-full h-11"
                  required
                >
                  {US_STATES.map(state => (
                    <Option key={state.value} value={state.value}>
                      {state.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <Input
                  placeholder="ZIP Code (Optional)"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Square Footage
                </label>
                <Input
                  placeholder="Sqft (Optional)"
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Detail Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Restaurant Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Type
              </label>
              <Input
                placeholder="e.g., Fast Casual, Fine Dining, etc."
                value={restaurantType}
                onChange={(e) => setRestaurantType(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Menu Type
              </label>
              <Input
                placeholder="e.g., Veg & Non-Veg, Vegetarian, etc."
                value={menuType}
                onChange={(e) => setMenuType(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFranchise}
                  onChange={(e) => setIsFranchise(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700">Is this a franchise location?</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInformationStep;