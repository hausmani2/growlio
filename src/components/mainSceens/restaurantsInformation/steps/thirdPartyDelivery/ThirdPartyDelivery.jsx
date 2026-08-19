import React from "react";
import { Select, Modal } from "antd";
import PrimaryButton from "../../../../buttons/Buttons";
import ToggleSwitch from "../../../../buttons/ToggleSwitch";

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

  // Delete a provider with confirmation
  const deleteProvider = (providerId) => {
    const currentProviders = data?.providers || [];
    const providerToDelete = currentProviders.find((provider) => provider.id === providerId);
    const providerName = providerToDelete?.providerName || providerToDelete?.provider_name || "this provider";
    
    Modal.confirm({
      title: "Delete Provider",
      content: `Are you sure you want to delete ${providerName}?`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        const updatedProviders = currentProviders.filter((provider) => provider.id !== providerId);
        updateData("providers", updatedProviders);
      },
    });
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

  const isEnabled = !!data?.third_party;

  // Toggle third-party delivery on/off
  const handleToggle = (checked) => {
    updateData("third_party", checked);
    if (!checked) {
      // Off → clear all providers
      updateData("providers", []);
    } else if ((data?.providers || []).length === 0) {
      // On → start with one empty provider row to prompt the user
      updateData("providers", [
        { id: Date.now() + Math.random(), providerName: "", providerFee: "" },
      ]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="mb-4">
        <div className="text-sm font-bold text-orange-600">Third- party Delivery Information</div>
        <div className="text-xs text-gray-600 mt-1">
          Add your Third-party delivery services below.
        </div>
      </div>

      <div
        onClick={() => handleToggle(!isEnabled)}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 gap-3 sm:gap-0 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
      >
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-sm font-semibold text-gray-700">
            Do you use third-party delivery?
          </span>
          <span className="text-xs text-gray-600">
            Select Yes to add delivery providers and their fees.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${isEnabled ? "text-gray-400" : "text-gray-700"}`}>
            No
          </span>
          <ToggleSwitch
            isOn={isEnabled}
            setIsOn={() => handleToggle(!isEnabled)}
            size="large"
          />
          <span className={`text-sm font-medium ${isEnabled ? "text-gray-700" : "text-gray-400"}`}>
            Yes
          </span>
        </div>
      </div>

      {isEnabled && (
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
              title={(data?.providers || []).length === 0 ? "Add Provider" : "Add Another Provider"}
              className="bg-gray-200 text-black h-10 rounded-lg text-xs font-semibold w-full sm:w-auto"
              onClick={addProvider}
            />
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default ThirdPartyDelivery;


