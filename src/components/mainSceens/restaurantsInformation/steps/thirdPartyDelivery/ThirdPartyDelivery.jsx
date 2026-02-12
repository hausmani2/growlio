import React, { useEffect } from "react";
import { Select } from "antd";
import PrimaryButton from "../../../../buttons/Buttons";

const ThirdPartyDelivery = ({ data, updateData, errors = {} }) => {
  // Create percentage options from 1 to 50
  const percentageOptions = Array.from({ length: 50 }, (_, index) => {
    const percentage = index + 1;
    return {
      value: percentage.toString(),
      label: `${percentage}%`,
    };
  });

  // Provider name options
  const allProviderOptions = [
    { value: "Door Dash", label: "Door Dash" },
    { value: "Skip The Dishes", label: "Skip The Dishes" },
    { value: "Grubhub", label: "Grubhub" },
    { value: "Uber Eats", label: "Uber Eats" },
    { value: "Other", label: "Other" },
  ];

  // Function to get available provider options for a specific provider (excluding already selected ones)
  const getAvailableProviderOptions = (currentProviderId) => {
    const currentProviders = data?.providers || [];
    const selectedProviders = currentProviders
      .filter(
        (provider) =>
          provider.id !== currentProviderId &&
          (provider.providerName || provider.provider_name)
      )
      .map((provider) => provider.providerName || provider.provider_name);

    return allProviderOptions.filter((option) => !selectedProviders.includes(option.value));
  };

  // Ensure at least one provider row exists
  useEffect(() => {
    const currentProviders = data?.providers || [];
    if (currentProviders.length > 0) return;
    updateData("providers", [
      {
        id: Date.now() + Math.random(),
        providerName: "",
        providerFee: "",
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a new provider
  const addProvider = () => {
    const currentProviders = data?.providers || [];
    const newProvider = {
      id: Date.now() + Math.random(),
      providerName: "",
      providerFee: "",
    };
    updateData("providers", [...currentProviders, newProvider]);
  };

  // Delete a provider
  const deleteProvider = (providerId) => {
    const currentProviders = data?.providers || [];
    const updatedProviders = currentProviders.filter((provider) => provider.id !== providerId);
    updateData("providers", updatedProviders);
  };

  // Update a specific provider
  const updateProvider = (providerId, field, value) => {
    const currentProviders = data?.providers || [];
    const updatedProviders = currentProviders.map((provider) =>
      provider.id === providerId
        ? {
            ...provider,
            [field]:
              field === "providerFee" && value ? parseInt(value, 10).toString() : value,
          }
        : provider
    );
    updateData("providers", updatedProviders);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="mb-4">
        <div className="text-sm font-bold text-orange-600">Third- party Delivery Information</div>
        <div className="text-xs text-gray-600 mt-1">
          Add your Third-party delivery services below.
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold text-gray-700 mb-3">
          Third-Party Provider Details
        </div>

        <div className="space-y-3">
          {(data?.providers || []).map((provider, index) => {
            const providerName = provider.providerName || provider.provider_name || "";
            const providerFee = provider.providerFee || provider.provider_fee || "";

            return (
              <div
                key={provider.id}
                className="border border-gray-200 rounded-lg bg-gray-50 p-4"
              >
                <div className="text-xs font-semibold text-gray-700 mb-3">
                  Provider {index + 1}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor={`providerName-${provider.id}`}
                      className="block text-xs font-semibold text-gray-700 mb-2"
                    >
                      Provider Name
                    </label>
                    <Select
                      id={`providerName-${provider.id}`}
                      placeholder="Select Provider Name"
                      className="w-full h-11 rounded-lg text-sm"
                      value={providerName || undefined}
                      onChange={(value) => updateProvider(provider.id, "providerName", value)}
                      options={getAvailableProviderOptions(provider.id)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`providerFee-${provider.id}`}
                      className="block text-xs font-semibold text-gray-700 mb-2"
                    >
                      Provider Fee
                    </label>
                    <Select
                      id={`providerFee-${provider.id}`}
                      placeholder="Select percentage"
                      className="w-full h-11 rounded-lg text-sm"
                      value={providerFee || undefined}
                      onChange={(value) => updateProvider(provider.id, "providerFee", value)}
                      options={percentageOptions}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => deleteProvider(provider.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold px-3 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete Provider
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-start">
            <PrimaryButton
              title="Add Another Provider"
              className="bg-gray-200 text-black h-10 rounded-lg text-xs font-semibold w-full sm:w-auto"
              onClick={addProvider}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThirdPartyDelivery;


