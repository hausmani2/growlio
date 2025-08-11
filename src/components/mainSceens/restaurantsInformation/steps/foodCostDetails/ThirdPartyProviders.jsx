import { Input, Select } from 'antd';
import { useState, useEffect } from 'react';
import PrimaryButton from '../../../../buttons/Buttons';


const ThirdPartyProviders = ({ data, updateData, errors = {} }) => {

    // State to manage multiple providers
    const [providers, setProviders] = useState([
        { id: 1, providerName: '', providerFee: '' }
    ]);

    // State to manage if location uses hired party delivery - default to 'false' if not provided
    const [useHiredPartyDelivery, setUseHiredPartyDelivery] = useState(
        data.useHiredPartyDelivery !== undefined ? data.useHiredPartyDelivery : 'false'
    );

    console.log('🔍 Debug - ThirdPartyProviders - Initial data:', data);
    console.log('🔍 Debug - ThirdPartyProviders - useHiredPartyDelivery state:', useHiredPartyDelivery);

    // Create percentage options from 1 to 50
    const percentageOptions = Array.from({ length: 50 }, (_, index) => {
        const percentage = index + 1;
        return {
            value: percentage.toString(),
            label: `${percentage}%`
        };
    });

    // Yes/No options for hired party delivery
    const yesNoOptions = [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
    ];

    // Provider name options
    const providerOptions = [
        { value: 'Door Dash', label: 'Door Dash' },
        { value: 'Skip/ Dishes', label: 'Skip/ Dishes' },
        { value: 'Uber Eats', label: 'Uber Eats' },
        { value: 'Other', label: 'Other' }
    ];

    // Initialize providers from data if it exists
    useEffect(() => {
        if (data.providers && data.providers.length > 0) {
            setProviders(data.providers);
        }
    }, [data.providers]);

    // Initialize useHiredPartyDelivery when data changes
    useEffect(() => {
        if (data.useHiredPartyDelivery !== undefined) {
            setUseHiredPartyDelivery(data.useHiredPartyDelivery);
        }
    }, [data.useHiredPartyDelivery]);

    // Handle hired party delivery change
    const handleHiredPartyDeliveryChange = (value) => {
        console.log('🔍 Debug - ThirdPartyProviders - handleHiredPartyDeliveryChange called with value:', value);
        setUseHiredPartyDelivery(value);
        updateData('useHiredPartyDelivery', value);
        
        // If "No" is selected, clear providers data
        if (value === 'false') {
            setProviders([{ id: 1, providerName: '', providerFee: '' }]);
            updateData('providers', []);
        }
    };

    // Add a new provider
    const addProvider = () => {
        const newProvider = {
            id: Date.now(),
            providerName: '',
            providerFee: ''
        };
        const updatedProviders = [...providers, newProvider];
        setProviders(updatedProviders);
        updateData('providers', updatedProviders);
    };

    // Delete a provider
    const deleteProvider = (providerId) => {
        // Don't allow deleting if there's only one provider
        if (providers.length <= 1) {
            return;
        }
        
        const updatedProviders = providers.filter(provider => provider.id !== providerId);
        setProviders(updatedProviders);
        updateData('providers', updatedProviders);
    };

    // Update a specific provider
    const updateProvider = (providerId, field, value) => {
        const updatedProviders = providers.map(provider =>
            provider.id === providerId
                ? { ...provider, [field]: value }
                : provider
        );
        setProviders(updatedProviders);
        updateData('providers', updatedProviders);
    };

    return (
        <div className="flex flex-col lg:flex-row mt-5 gap-4 lg:gap-0">
            {/* Left Section - Title and Description */}
            <div className="w-full lg:w-[40%]">
                <div className="flex flex-col gap-2">
                    <h4 className="text-lg !font-bold !mb-0">
                        Third-Party Providers
                    </h4>
                    <span className="text-sm sm:text-base text-neutral-600">
                        Does this Location use hired party delivery?
                    </span>
                </div>
            </div>
            
            {/* Right Section - Form Content */}
            <div className="w-full lg:w-[60%]">
                <div className="flex flex-col gap-3 p-4 sm:p-6 bg-white rounded-xl" >
                    {/* Hired Party Delivery Question */}
                    <div className="rounded-lg">
                        <div className="flex flex-col gap-2 sm:gap-3">
                            <label className="text-xs sm:text-sm lg:text-base !font-bold text-neutral-600">
                                Does this Location use third party delivery?
                                <span className="text-red-500">*</span>
                            </label>
                            <Select
                                placeholder="Select Yes or No"
                                className={`w-full p-2 !h-[40px] rounded-md text-xs sm:text-sm lg:text-base font-normal text-neutral-700 ${errors.useHiredPartyDelivery ? 'border-red-500' : 'border-gray-300'}`}
                                value={useHiredPartyDelivery || undefined}
                                onChange={handleHiredPartyDeliveryChange}
                                options={yesNoOptions}
                                status={errors.useHiredPartyDelivery ? 'error' : ''}
                            />
                            {errors.useHiredPartyDelivery && (
                                <span className="text-red-500 text-xs sm:text-sm lg:text-base">{errors.useHiredPartyDelivery}</span>
                            )}
                        </div>
                    </div>

                    {/* Provider Details - Only show if "Yes" is selected */}
                    {useHiredPartyDelivery === 'true' && (
                        <>
                            {providers.map((provider, index) => (
                                <div key={provider.id} className="rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4">
                                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                                        <h5 className="text-sm sm:text-base lg:text-lg font-semibold text-neutral-700">
                                            Provider {index + 1}
                                        </h5>
                                        {providers.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => deleteProvider(provider.id)}
                                                className="text-red-500 hover:text-red-700 text-xs sm:text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 sm:gap-3 mb-3 sm:mb-4">
                                        <label htmlFor={`providerName-${provider.id}`} className="text-xs sm:text-sm lg:text-base !font-bold text-neutral-600">
                                            Provider Name
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                            id={`providerName-${provider.id}`}
                                            placeholder="Select Provider Name"
                                            className={`w-full p-2 !h-[40px] rounded-md text-xs sm:text-sm lg:text-base font-normal text-neutral-700 ${errors[`provider_${index}_name`] ? 'border-red-500' : 'border-gray-300'}`}
                                            value={provider.providerName || undefined}
                                            onChange={(value) => updateProvider(provider.id, 'providerName', value)}
                                            options={providerOptions}
                                            status={errors[`provider_${index}_name`] ? 'error' : ''}
                                        />
                                        {errors[`provider_${index}_name`] && (
                                            <span className="text-red-500 text-xs sm:text-sm lg:text-base">{errors[`provider_${index}_name`]}</span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 sm:gap-3">
                                        <label htmlFor={`providerFee-${provider.id}`} className="text-xs sm:text-sm lg:text-base !font-bold text-neutral-600">
                                            Provider Fee
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                            type="text"
                                            id={`providerFee-${provider.id}`}
                                            placeholder="Select percentage"
                                            className={`w-full p-2 !h-[40px] rounded-md text-xs sm:text-sm lg:text-base font-normal text-neutral-700 ${errors[`provider_${index}_fee`] ? 'border-red-500' : 'border-gray-300'}`}
                                            value={provider.providerFee || undefined}
                                            onChange={(value) => updateProvider(provider.id, 'providerFee', value)}
                                            options={percentageOptions}
                                            status={errors[`provider_${index}_fee`] ? 'error' : ''}
                                        />
                                        {errors[`provider_${index}_fee`] && (
                                            <span className="text-red-500 text-xs sm:text-sm lg:text-base">{errors[`provider_${index}_fee`]}</span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-start">
                                <PrimaryButton
                                    title="Add Another Provider"
                                    className="bg-neutral-200 text-black h-[40px] rounded-md !text-xs sm:!text-sm lg:!text-base !font-bold w-full sm:w-auto"
                                    onClick={addProvider}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ThirdPartyProviders;