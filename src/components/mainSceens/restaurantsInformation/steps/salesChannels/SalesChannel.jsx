import React from 'react';
import ToggleSwitch from '../../../../buttons/ToggleSwitch';
import PrimaryButton from '../../../../buttons/Buttons';
import LeftArrow from '../../../../../assets/svgs/left-arrow.svg';
import { useTabHook } from '../../useTabHook';
import { useLocation } from 'react-router-dom';
import useTooltips from '../../../../../utils/useTooltips';
import TooltipIcon from '../../../../common/TooltipIcon';
import { Input, Select } from 'antd';

const SalesChannel = ({ data, updateData, errors = {}, onSaveAndContinue, loading = false }) => {
    const location = useLocation();
    const { navigateToNextStep, navigateToPreviousStep } = useTabHook();
    
    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    const salesChannels = [
        { 
            title: 'In-Store Sales', 
            description: "Sales made directly at your restaurant's physical location.", 
            key: 'in_store', 
            enabled: data?.in_store ?? true 
        },
        { 
            title: 'Online Sales', 
            description: "Sales made through your restaurant's website or online ordering system.", 
            key: 'online', 
            enabled: data?.online ?? false 
        },
        { 
            title: 'Sales From an App', 
            description: "Sales made through a dedicated mobile application for your restaurant.", 
            key: 'from_app', 
            enabled: data?.from_app ?? false 
        },
        { 
            title: 'Third-Party Sales', 
            description: "Sales made through third-party platforms like Grubhub or DoorDash.", 
            key: 'third_party', 
            enabled: data?.third_party ?? false 
        },
    ];

    // Create percentage options from 1 to 50
    const percentageOptions = Array.from({ length: 50 }, (_, index) => {
        const percentage = index + 1;
        return {
            value: percentage.toString(),
            label: `${percentage}%`
        };
    });

    // Provider name options
    const allProviderOptions = [
        { value: 'Door Dash', label: 'Door Dash' },
        { value: 'Skip The Dishes', label: 'Skip The Dishes' }, 
        { value: 'Grubhub', label: 'Grubhub' }, 
        { value: 'Uber Eats', label: 'Uber Eats' },
        { value: 'Other', label: 'Other' }
    ];

    // Function to get available provider options for a specific provider (excluding already selected ones)
    const getAvailableProviderOptions = (currentProviderId) => {
        const currentProviders = data?.providers || [];
        const selectedProviders = currentProviders
            .filter(provider => provider.id !== currentProviderId && (provider.providerName || provider.provider_name))
            .map(provider => provider.providerName || provider.provider_name);
        
        return allProviderOptions.filter(option => 
            !selectedProviders.includes(option.value)
        );
    };

    const handleToggle = (channelKey) => {
        const currentValue = data?.[channelKey] ?? false;
        updateData(channelKey, !currentValue);
        
        // If third-party is being enabled, add a default provider
        if (channelKey === 'third_party' && !currentValue) {
            const defaultProvider = {
                id: Date.now() + Math.random(), // Ensure unique ID
                providerName: '',
                providerFee: ''
            };
            updateData('providers', [defaultProvider]);
        }
        
        // If third-party is being disabled, clear providers data
        if (channelKey === 'third_party' && currentValue) {
            updateData('providers', []);
        }
    };

    const handleGoBack = () => {
        navigateToPreviousStep();
    };

    const handleSaveAndContinueClick = async () => {
        if (onSaveAndContinue) {
            const result = await onSaveAndContinue();
            if (result?.success) {
                // Navigate to next step after successful save
                navigateToNextStep(true); // Skip completion check since we just saved successfully
            }
        }
    };

    // Add a new provider
    const addProvider = () => {
        const currentProviders = data?.providers || [];
        const newProvider = {
            id: Date.now() + Math.random(), // Ensure unique ID
            providerName: '',
            providerFee: ''
        };
        const updatedProviders = [...currentProviders, newProvider];
        updateData('providers', updatedProviders);
    };

    // Delete a provider
    const deleteProvider = (providerId) => {
        const currentProviders = data?.providers || [];
        // Don't allow deleting if there's only one provider
        if (currentProviders.length <= 1) {
            return;
        }
        
        const updatedProviders = currentProviders.filter(provider => provider.id !== providerId);
        updateData('providers', updatedProviders);
    };

    // Update a specific provider
    const updateProvider = (providerId, field, value) => {
        const currentProviders = data?.providers || [];
        const updatedProviders = currentProviders.map(provider =>
            provider.id === providerId
                ? { 
                    ...provider, 
                    [field]: field === 'providerFee' && value ? parseInt(value, 10).toString() : value 
                }
                : provider
        );
        updateData('providers', updatedProviders);
        
        // Clear any general provider errors when user starts typing
        // This helps provide immediate feedback
        if (errors.providers) {
            // Note: This would need to be passed down from parent component
            // For now, we'll rely on the improved validation logic
        }
    };
    const tooltips = useTooltips('onboarding-sales');

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6" data-guidance="sales_channels_title">
                <h3 className="text-xl font-bold text-orange-600 mb-2">Sales Channels</h3>
                {/* <p className="text-gray-600 text-sm">
                    Define your active sales channels to accurately track your restaurant's financial performance.
                </p> */}
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2" data-guidance="sales_channels_section">
                    Sales Channels <span className="text-red-500">*</span>
                    <TooltipIcon text={tooltips['sales_channels']} />
                </label>
                
                <div className="space-y-3">
                    {salesChannels.map((channel, index) => (
                        <div
                            key={index}
                            data-guidance={`sales_channel_${channel.key}`}
                            onClick={() => handleToggle(channel.key)}
                            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 gap-3 sm:gap-0 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 ${
                                errors.sales_channels ? 'border-red-500' : ''
                            }`}
                        >
                            <div className='flex flex-col gap-1 flex-1'>
                                <span className="text-sm font-semibold text-gray-700">{channel.title}</span>
                                <span className="text-xs text-gray-600">{channel.description}</span>
                            </div>
                            <ToggleSwitch
                                isOn={channel.enabled}
                                setIsOn={() => handleToggle(channel.key)}
                                size="large"
                            />
                        </div>
                    ))}
                </div>
                
                {errors.sales_channels && (
                    <span className="text-red-500 text-xs mt-1">{errors.sales_channels}</span>
                )}

                {/* Third Party Provider Details - Only show if third-party sales is enabled */}
                {data?.third_party && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4">Third-Party Provider Details</h4>
                        
                        {/* Show error if no providers are added */}
                        {errors.providers && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <span className="text-red-600 text-sm">{errors.providers}</span>
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            {(data?.providers || []).map((provider, index) => {
                                // Handle both camelCase and snake_case field names
                                const providerName = provider.providerName || provider.provider_name || '';
                                const providerFee = provider.providerFee || provider.provider_fee || '';
                                
                                return (
                                <div key={provider.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h5 className="text-base font-semibold text-gray-700">
                                            Provider {index + 1}
                                        </h5>
                                        {(data?.providers || []).length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => deleteProvider(provider.id)}
                                                className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor={`providerName-${provider.id}`} className="block text-sm font-semibold text-gray-700 mb-2">
                                                Provider Name
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <Select
                                                id={`providerName-${provider.id}`}
                                                placeholder="Select Provider Name"
                                                className={`w-full h-11 rounded-lg text-sm ${
                                                    errors[`provider_${index}_name`] ? 'border-red-500' : ''
                                                }`}
                                                value={providerName || undefined}
                                                onChange={(value) => updateProvider(provider.id, 'providerName', value)}
                                                options={getAvailableProviderOptions(provider.id)}
                                                status={errors[`provider_${index}_name`] ? 'error' : ''}
                                            />
                                            {errors[`provider_${index}_name`] && (
                                                <span className="text-red-500 text-xs mt-1">{errors[`provider_${index}_name`]}</span>
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor={`providerFee-${provider.id}`} className="block text-sm font-semibold text-gray-700 mb-2">
                                                Provider Fee
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <Select
                                                id={`providerFee-${provider.id}`}
                                                placeholder="Select percentage"
                                                className={`w-full h-11 rounded-lg text-sm ${
                                                    errors[`provider_${index}_fee`] ? 'border-red-500' : ''
                                                }`}
                                                value={providerFee || undefined}
                                                onChange={(value) => updateProvider(provider.id, 'providerFee', value)}
                                                options={percentageOptions}
                                                status={errors[`provider_${index}_fee`] ? 'error' : ''}
                                            />
                                            {errors[`provider_${index}_fee`] && (
                                                <span className="text-red-500 text-xs mt-1">{errors[`provider_${index}_fee`]}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                            })}

                            <div className="flex justify-start">
                                <PrimaryButton
                                    title="Add Another Provider"
                                    className="bg-gray-200 text-black h-11 rounded-lg text-sm font-semibold w-full sm:w-auto"
                                    onClick={addProvider}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Navigation Buttons */}
            {!isUpdateMode && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6">
                     <PrimaryButton 
                        icon={LeftArrow} 
                        title="Go Back" 
                        className="bg-gray-200 text-black h-11 w-full sm:w-auto text-sm" 
                        onClick={handleGoBack} 
                        disabled={loading} 
                    />
                    <PrimaryButton 
                        title={loading ? "Saving..." : "Save & Continue"} 
                        className="btn-brand w-full sm:w-auto"
                        onClick={handleSaveAndContinueClick}
                        disabled={loading}
                    />
                </div>
            )}
        </div>
    );
};

export default SalesChannel;