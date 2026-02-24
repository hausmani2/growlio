import React, { useState, useEffect, useCallback } from 'react';
import { Checkbox, Input, Select, Button, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ToggleSwitch from '../../buttons/ToggleSwitch';

// Default 3 providers with 28% fee
const DEFAULT_PROVIDERS = [
  { name: "Door Dash", fee: "28", enabled: true },
  { name: "Uber Eats", fee: "28", enabled: true },
  { name: "Grubhub", fee: "28", enabled: true },
];

// Provider name options for adding new providers
const PROVIDER_OPTIONS = [
  { value: "Door Dash", label: "Door Dash" },
  { value: "Skip The Dishes", label: "Skip The Dishes" },
  { value: "Grubhub", label: "Grubhub" },
  { value: "Uber Eats", label: "Uber Eats" },
  { value: "UberEats", label: "UberEats" },
  { value: "Other", label: "Other" },
];

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
  
  // Initialize third party providers - show all 3 by default with 28% fee
  const [thirdPartyProviders, setThirdPartyProviders] = useState(() => {
    // If data exists, use it
    if (data?.saleschannels?.thirdPartyProviders && Array.isArray(data.saleschannels.thirdPartyProviders) && data.saleschannels.thirdPartyProviders.length > 0) {
      // Ensure we have all 3 default providers, merge with existing data
      const existingProviders = data.saleschannels.thirdPartyProviders.map(p => ({
        id: p.id || Date.now() + Math.random(),
        providerName: p.providerName || p.provider_name || '',
        providerFee: p.providerFee || p.provider_fee || '28',
        enabled: p.enabled !== undefined ? p.enabled : true
      }));
      
      // Add any missing default providers
      const defaultNames = DEFAULT_PROVIDERS.map(p => p.name);
      const missingProviders = DEFAULT_PROVIDERS
        .filter(p => !existingProviders.some(ep => ep.providerName === p.name))
        .map(p => ({
          id: Date.now() + Math.random(),
          providerName: p.name,
          providerFee: p.fee,
          enabled: p.enabled
        }));
      
      // Return existing providers + missing default providers (don't limit to 3, allow more)
      return [...existingProviders, ...missingProviders];
    }
    
    // If third_party_info exists, convert it to providers array
    if (data?.saleschannels?.thirdPartyInfo && typeof data.saleschannels.thirdPartyInfo === 'object') {
      const providersFromInfo = Object.entries(data.saleschannels.thirdPartyInfo).map(([name, fee], index) => ({
        id: Date.now() + index,
        providerName: name,
        providerFee: fee.toString(),
        enabled: true
      }));
      
      // Merge with default providers
      const defaultNames = DEFAULT_PROVIDERS.map(p => p.name);
      const missingProviders = DEFAULT_PROVIDERS
        .filter(p => !providersFromInfo.some(ep => ep.providerName === p.name))
        .map(p => ({
          id: Date.now() + Math.random() + 100,
          providerName: p.name,
          providerFee: p.fee,
          enabled: p.enabled
        }));
      
      // Return providers from info + missing default providers (don't limit to 3, allow more)
      return [...providersFromInfo, ...missingProviders];
    }
    
    // Default: show all 3 providers with 28% fee
    return DEFAULT_PROVIDERS.map((p, index) => ({
      id: Date.now() + index,
      providerName: p.name,
      providerFee: p.fee,
      enabled: p.enabled
    }));
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
    // Convert providers array to third_party_info object format
    // Only include enabled providers
    const thirdPartyInfo = {};
    thirdPartyProviders.forEach(provider => {
      if (provider.enabled && provider.providerName && provider.providerFee) {
        thirdPartyInfo[provider.providerName] = parseInt(provider.providerFee) || 0;
      }
    });

    updateData({
      saleschannels: {
        usesThirdPartyDelivery: true, // Always true since we show providers by default
        thirdPartyProviders,
        thirdPartyInfo: Object.keys(thirdPartyInfo).length > 0 ? thirdPartyInfo : undefined
      },
      restaurant_operating_days: selectedDays
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thirdPartyProviders, selectedDays]);

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

        {/* Third-Party Delivery Section */}
        <div className="mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">3rd Party</h3>
            <p className="text-sm text-gray-600">
              Orders placed through third-party delivery services
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Third-Party Provider Details
              </h4>
              <p className="text-xs text-gray-500">
                Toggle on/off and edit fee percentage for each provider
              </p>
            </div>

            <div className="space-y-3">
              {thirdPartyProviders.map((provider, index) => {
                const isDefaultProvider = DEFAULT_PROVIDERS.some(dp => dp.name === provider.providerName);
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
                      {!isDefaultProvider && thirdPartyProviders.length > 1 && (
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

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <ToggleSwitch
                          isOn={provider.enabled !== false}
                          setIsOn={(enabled) => {
                            setThirdPartyProviders(prev =>
                              prev.map(p =>
                                p.id === provider.id
                                  ? { ...p, enabled }
                                  : p
                              )
                            );
                          }}
                          size="default"
                        />
                        <div className="flex-1">
                          {isDefaultProvider ? (
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {provider.providerName}
                            </label>
                          ) : (
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
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={provider.providerFee}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Allow empty, 0-100
                                if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 100)) {
                                  setThirdPartyProviders(prev =>
                                    prev.map(p =>
                                      p.id === provider.id
                                        ? { ...p, providerFee: value }
                                        : p
                                    )
                                  );
                                }
                              }}
                              suffix="%"
                              className="w-24"
                              disabled={!provider.enabled}
                              placeholder="28"
                            />
                            <span className="text-xs text-gray-500">fee</span>
                          </div>
                        </div>
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
                      providerFee: '28',
                      enabled: true
                    }
                  ]);
                }}
                className="w-full"
              >
                Add Another Provider
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesChannelsAndOperatingDaysStep;