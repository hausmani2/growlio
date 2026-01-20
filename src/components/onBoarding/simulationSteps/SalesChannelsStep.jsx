import React, { useState, useEffect } from 'react';
import { Checkbox, Select, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;

// Provider name options
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

const SalesChannelsStep = ({ data, updateData, onNext, onBack }) => {
  const [inStore, setInStore] = useState(data?.inStore ?? true);
  const [online, setOnline] = useState(data?.online ?? false);
  const [fromApp, setFromApp] = useState(data?.fromApp ?? false);
  const [usesThirdPartyDelivery, setUsesThirdPartyDelivery] = useState(data?.usesThirdPartyDelivery ?? false);
  const [thirdPartyProviders, setThirdPartyProviders] = useState(() => {
    // Initialize from data or create empty array
    if (data?.thirdPartyProviders && Array.isArray(data.thirdPartyProviders)) {
      return data.thirdPartyProviders;
    }
    // If third_party_info exists, convert it to providers array
    if (data?.thirdPartyInfo && typeof data.thirdPartyInfo === 'object') {
      return Object.entries(data.thirdPartyInfo).map(([name, fee], index) => ({
        id: Date.now() + index,
        providerName: name,
        providerFee: fee.toString()
      }));
    }
    return [];
  });

  useEffect(() => {
    // Convert providers array to third_party_info object format
    const thirdPartyInfo = {};
    thirdPartyProviders.forEach(provider => {
      if (provider.providerName && provider.providerFee) {
        thirdPartyInfo[provider.providerName] = parseInt(provider.providerFee) || 0;
      }
    });

    updateData({
      inStore,
      online,
      fromApp,
      usesThirdPartyDelivery,
      thirdPartyProviders,
      thirdPartyInfo: Object.keys(thirdPartyInfo).length > 0 ? thirdPartyInfo : undefined
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inStore, online, fromApp, usesThirdPartyDelivery, thirdPartyProviders]);

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
          Orders placed through third-party delivery services (optional for simulation)
        </p>
      </div>

      {/* Third-Party Provider Details */}
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Third-party provider details are optional for simulation.
        </p>
      </div>
    </div>
  );
};

export default SalesChannelsStep;