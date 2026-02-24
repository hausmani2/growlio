import React, { useState, useEffect } from 'react';
import { Checkbox, Input, Select, Button } from 'antd';
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

const SalesChannelsStep = ({ data, updateData, onNext, onBack }) => {
  const [inStore, setInStore] = useState(data?.inStore ?? true);
  const [online, setOnline] = useState(data?.online ?? false);
  const [fromApp, setFromApp] = useState(data?.fromApp ?? false);
  
  // Initialize third party providers - show all 3 by default with 28% fee
  const [thirdPartyProviders, setThirdPartyProviders] = useState(() => {
    // If data exists, use it
    if (data?.thirdPartyProviders && Array.isArray(data.thirdPartyProviders) && data.thirdPartyProviders.length > 0) {
      // Ensure we have all 3 default providers, merge with existing data
      const existingProviders = data.thirdPartyProviders.map(p => ({
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
    if (data?.thirdPartyInfo && typeof data.thirdPartyInfo === 'object') {
      const providersFromInfo = Object.entries(data.thirdPartyInfo).map(([name, fee], index) => ({
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
      inStore,
      online,
      fromApp,
      usesThirdPartyDelivery: true, // Always true since we show providers by default
      thirdPartyProviders,
      thirdPartyInfo: Object.keys(thirdPartyInfo).length > 0 ? thirdPartyInfo : undefined
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inStore, online, fromApp, thirdPartyProviders]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sales Channels</h2>
        <p className="text-gray-600">
          Select all the ways your restaurant receives orders.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-2 rounded-lg p-4 hover:border-orange-300 transition-colors">
          <Checkbox
            checked={inStore}
            onChange={(e) => setInStore(e.target.checked)}
            className="text-base"
          >
            <span className="ml-2 font-medium">In-Store</span>
          </Checkbox>
          <p className="text-sm text-gray-500 ml-6 mt-1">
            Orders placed directly at your restaurant
          </p>
        </div>

        <div className="border-2 rounded-lg p-4 hover:border-orange-300 transition-colors">
          <Checkbox
            checked={online}
            onChange={(e) => setOnline(e.target.checked)}
            className="text-base"
          >
            <span className="ml-2 font-medium">Online</span>
          </Checkbox>
          <p className="text-sm text-gray-500 ml-6 mt-1">
            Orders placed through your website
          </p>
        </div>

        <div className="border-2 rounded-lg p-4 hover:border-orange-300 transition-colors">
          <Checkbox
            checked={fromApp}
            onChange={(e) => setFromApp(e.target.checked)}
            className="text-base"
          >
            <span className="ml-2 font-medium">From App</span>
          </Checkbox>
          <p className="text-sm text-gray-500 ml-6 mt-1">
            Orders placed through your mobile app
          </p>
        </div>
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
  );
};

export default SalesChannelsStep;