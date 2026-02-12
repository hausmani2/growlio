import React, { useState, useEffect, useCallback } from 'react';
import { Checkbox, Select, Button, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

// Provider name options (same as regular onboarding)
const PROVIDER_OPTIONS = [
  { value: "Door Dash", label: "Door Dash" },
  { value: "Skip The Dishes", label: "Skip The Dishes" },
  { value: "Grubhub", label: "Grubhub" },
  { value: "Uber Eats", label: "Uber Eats" },
  { value: "UberEats", label: "UberEats" },
  { value: "Other", label: "Other" },
];

// Percentage options from 1 to 50
const PERCENTAGE_OPTIONS = Array.from({ length: 50 }, (_, index) => {
  const percentage = index + 1;
  return {
    value: percentage.toString(),
    label: `${percentage}%`,
  };
});

const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' }
];

const SalesChannelsAndOperatingDaysStep = ({ data, updateData, onNext, onBack, validateStep }) => {
  const [errors, setErrors] = useState({});
  // Sales Channels state - third party delivery with multiple providers (same as regular onboarding)
  const [usesThirdPartyDelivery, setUsesThirdPartyDelivery] = useState(data?.saleschannels?.usesThirdPartyDelivery ?? false);
  const [thirdPartyProviders, setThirdPartyProviders] = useState(() => {
    // Initialize from data or create empty array
    if (data?.saleschannels?.thirdPartyProviders && Array.isArray(data.saleschannels.thirdPartyProviders)) {
      return data.saleschannels.thirdPartyProviders;
    }
    // If third_party_info exists, convert it to providers array
    if (data?.saleschannels?.thirdPartyInfo && typeof data.saleschannels.thirdPartyInfo === 'object') {
      return Object.entries(data.saleschannels.thirdPartyInfo).map(([name, fee], index) => ({
        id: Date.now() + index,
        providerName: name,
        providerFee: fee.toString()
      }));
    }
    return [];
  });

  // Operating Days state
  const initialDays = Array.isArray(data?.restaurant_operating_days) 
    ? data.restaurant_operating_days 
    : Array.isArray(data?.operatingdays) 
      ? data.operatingdays 
      : [];
  const [selectedDays, setSelectedDays] = useState(initialDays);

  // Check if all days are selected
  const allDaysSelected = DAYS_OF_WEEK.every(day => selectedDays.includes(day.value));

  // Update parent data when local state changes
  useEffect(() => {
    // Convert providers array to third_party_info object format (same as regular onboarding)
    const thirdPartyInfo = {};
    thirdPartyProviders.forEach(provider => {
      if (provider.providerName && provider.providerFee) {
        thirdPartyInfo[provider.providerName] = parseInt(provider.providerFee) || 0;
      }
    });

    updateData({
      saleschannels: {
        usesThirdPartyDelivery,
        thirdPartyProviders,
        thirdPartyInfo: Object.keys(thirdPartyInfo).length > 0 ? thirdPartyInfo : undefined
      },
      restaurant_operating_days: selectedDays
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usesThirdPartyDelivery, thirdPartyProviders, selectedDays]);

  const toggleDay = (day) => {
    setSelectedDays(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      // Normalize day values for comparison (handle both 'mon' and 'monday' formats)
      const normalizeDay = (d) => {
        const dayMap = {
          'monday': 'mon',
          'tuesday': 'tue',
          'wednesday': 'wed',
          'thursday': 'thu',
          'friday': 'fri',
          'saturday': 'sat',
          'sunday': 'sun'
        };
        return dayMap[d] || d;
      };
      
      const normalizedDay = normalizeDay(day);
      const normalizedPrev = prevArray.map(normalizeDay);
      
      const newDays = normalizedPrev.includes(normalizedDay)
        ? prevArray.filter(d => normalizeDay(d) !== normalizedDay)
        : [...prevArray, day]; // Keep original format when adding
      
      // Clear error when days are selected
      if (newDays.length > 0 && errors.operatingDays) {
        setErrors(prev => ({ ...prev, operatingDays: '' }));
      }
      
      return newDays;
    });
  };

  const toggleAllDays = (e) => {
    e.stopPropagation();
    if (allDaysSelected) {
      setSelectedDays([]);
    } else {
      setSelectedDays(DAYS_OF_WEEK.map(day => day.value));
    }
    // Clear error when days are selected
    if (errors.operatingDays) {
      setErrors(prev => ({ ...prev, operatingDays: '' }));
    }
  };

  // Validation function that can be called from parent
  // Use useCallback to ensure the function reference is stable and uses latest values
  const validate = useCallback(() => {
    const newErrors = {};
    
    if (!selectedDays || selectedDays.length === 0) {
      newErrors.operatingDays = 'Please select at least one operating day';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      message.error(firstError);
      return false;
    }
    
    return true;
  }, [selectedDays]);

  // Expose validate function to parent via validateStep prop
  useEffect(() => {
    if (validateStep) {
      validateStep.current = validate;
    }
  }, [validateStep, validate]);

  return (
    <div className="space-y-8">
      {/* Restaurant Operating Days Section - First */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Operating Days</h2>
          <p className="text-gray-600">
            Select the days your restaurant is open for business.
          </p>
        </div>

        {/* Select All Days Option */}
        <div
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all mb-3 ${
            allDaysSelected
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={toggleAllDays}
        >
          <Checkbox
            checked={allDaysSelected}
            onChange={toggleAllDays}
            className="text-base"
          >
            <span className="ml-2 font-medium">Select All Days</span>
          </Checkbox>
        </div>

        <div className="space-y-3">
          {DAYS_OF_WEEK.map(day => {
            // Normalize day values for comparison (handle both 'mon' and 'monday' formats)
            const normalizeDay = (d) => {
              const dayMap = {
                'monday': 'mon',
                'tuesday': 'tue',
                'wednesday': 'wed',
                'thursday': 'thu',
                'friday': 'fri',
                'saturday': 'sat',
                'sunday': 'sun'
              };
              return dayMap[d] || d;
            };
            
            const normalizedDayValue = normalizeDay(day.value);
            const normalizedSelectedDays = Array.isArray(selectedDays) 
              ? selectedDays.map(normalizeDay)
              : [];
            const isSelected = normalizedSelectedDays.includes(normalizedDayValue);
            
            return (
              <div
                key={day.value}
                className={`border-2 rounded-lg p-4 transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => {
                    toggleDay(day.value);
                  }}
                  className="text-base cursor-pointer"
                >
                  <span className="ml-2 font-medium cursor-pointer">{day.label}</span>
                </Checkbox>
              </div>
            );
          })}
        </div>

        {selectedDays.length === 0 && (
          <div className={`border rounded-lg p-4 mt-4 ${
            errors.operatingDays 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <p className={`text-sm ${
              errors.operatingDays ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {errors.operatingDays || 'Please select at least one operating day.'}
            </p>
          </div>
        )}
      </div>

      {/* Sales Channels Section - Second */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sales Channels</h2>
          <p className="text-gray-600">
            Select if your restaurant uses third-party delivery services.
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-2 rounded-lg p-4 hover:border-orange-300 transition-colors">
            <Checkbox
              checked={usesThirdPartyDelivery}
              onChange={(e) => {
                setUsesThirdPartyDelivery(e.target.checked);
                if (!e.target.checked) {
                  setThirdPartyProviders([]);
                } else if (thirdPartyProviders.length === 0) {
                  // Add first provider when enabling
                  setThirdPartyProviders([{
                    id: Date.now(),
                    providerName: '',
                    providerFee: ''
                  }]);
                }
              }}
              className="text-base"
            >
              <span className="ml-2 font-medium">Third-Party Delivery</span>
            </Checkbox>
            <p className="text-sm text-gray-500 ml-6 mt-1">
              Orders placed through third-party delivery services
            </p>
          </div>

          {/* Third-Party Provider Details (same as regular onboarding) */}
          {usesThirdPartyDelivery && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Third-Party Provider Details
                </h3>
                <p className="text-xs text-gray-500">
                  Add your third-party delivery services and their fee percentages
                </p>
              </div>

              <div className="space-y-3">
                {thirdPartyProviders.map((provider, index) => {
                  const availableProviders = PROVIDER_OPTIONS.filter(opt => {
                    // Don't show providers that are already selected in other rows
                    return !thirdPartyProviders.some((p, idx) => 
                      idx !== index && p.providerName === opt.value
                    );
                  });

                  return (
                    <div
                      key={provider.id}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-700">
                          Provider {index + 1}
                        </span>
                        {thirdPartyProviders.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              setThirdPartyProviders(prev => 
                                prev.filter(p => p.id !== provider.id)
                              );
                            }}
                            size="small"
                          >
                            Delete
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Provider Name
                          </label>
                          <Select
                            placeholder="Select Provider"
                            value={provider.providerName || undefined}
                            onChange={(value) => {
                              setThirdPartyProviders(prev =>
                                prev.map(p =>
                                  p.id === provider.id
                                    ? { ...p, providerName: value }
                                    : p
                                )
                              );
                            }}
                            className="w-full h-10"
                            options={availableProviders}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Fee Percentage
                          </label>
                          <Select
                            placeholder="Select percentage"
                            value={provider.providerFee || undefined}
                            onChange={(value) => {
                              setThirdPartyProviders(prev =>
                                prev.map(p =>
                                  p.id === provider.id
                                    ? { ...p, providerFee: value }
                                    : p
                                )
                              );
                            }}
                            className="w-full h-10"
                            options={PERCENTAGE_OPTIONS}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setThirdPartyProviders(prev => [
                      ...prev,
                      {
                        id: Date.now() + Math.random(),
                        providerName: '',
                        providerFee: ''
                      }
                    ]);
                  }}
                  className="w-full"
                >
                  Add Another Provider
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesChannelsAndOperatingDaysStep;