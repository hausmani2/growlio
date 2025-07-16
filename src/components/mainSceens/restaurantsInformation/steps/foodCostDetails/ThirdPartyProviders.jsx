import { Select } from 'antd';
import { useState, useEffect } from 'react';
import PrimaryButton from '../../../../buttons/Buttons';


const ThirdPartyProviders = ({ data, updateData }) => {

    // State to manage multiple providers
    const [providers, setProviders] = useState([
        { id: 1, providerName: '', providerFee: '' }
    ]);

    // State to manage if location uses hired party delivery
    const [useHiredPartyDelivery, setUseHiredPartyDelivery] = useState(data.useHiredPartyDelivery || '');

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
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
    ];

    // Initialize providers from data if it exists
    useEffect(() => {
        if (data.providers && data.providers.length > 0) {
            setProviders(data.providers);
        }
    }, [data.providers]);

    // Handle hired party delivery change
    const handleHiredPartyDeliveryChange = (value) => {
        setUseHiredPartyDelivery(value);
        updateData('useHiredPartyDelivery', value);
        
        // If "No" is selected, clear providers data
        if (value === 'no') {
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

    // Remove a provider
    // const removeProvider = (providerId) => {
    //     const updatedProviders = providers.filter(provider => provider.id !== providerId);
    //     setProviders(updatedProviders);
    //     updateData('providers', updatedProviders);
    // };

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
        <div className="flex mt-5">
            <div className="w-[40%]">
                <div className="flex flex-col gap-2">
                    <h4 className="text-lg !font-bold !mb-0">Third-Party Providers</h4>
                    <span className="text-base text-neutral-600">Does this Location use hired party delivery?</span>
                </div>
            </div>
            <div className="w-[60%]">
                <div className="flex flex-col gap-3 p-6 bg-white rounded-xl" >

                    {/* Hired Party Delivery Question */}
                    <div className=" rounded-lg">
                        <div className="flex flex-col gap-2">
                            <label className="text-base !font-bold text-neutral-600">Does this Location use third party delivery?</label>
                            <Select
                                placeholder="Select Yes or No"
                                className="w-full p-2 !h-[40px] rounded-md text-base font-normal text-neutral-700"
                                value={useHiredPartyDelivery}
                                onChange={handleHiredPartyDeliveryChange}
                                options={yesNoOptions}
                            />
                        </div>
                    </div>

                    {/* Provider Details - Only show if "Yes" is selected */}
                    {useHiredPartyDelivery === 'yes' && (
                        <>
                            {providers.map((provider) => (
                                <div key={provider.id} className=" rounded-lg ">
                                    <div className="flex flex-col gap-2 mb-4">
                                        <label htmlFor={`providerName-${provider.id}`} className="text-base !font-bold text-neutral-600">Provider Name</label>
                                        <input
                                            type="text"
                                            id={`providerName-${provider.id}`}
                                            placeholder="Enter Provider Name"
                                            className="w-full p-2 border border-gray-300 !h-[40px] rounded-md text-base font-normal text-neutral-700"
                                            value={provider.providerName || undefined}
                                            onChange={(e) => updateProvider(provider.id, 'providerName', e.target.value)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label htmlFor={`providerFee-${provider.id}`} className="text-base !font-bold text-neutral-600">Provider Fee</label>
                                        <Select
                                            type="text"
                                            id={`providerFee-${provider.id}`}
                                            placeholder="Select percentage"
                                            className="w-full p-2  !h-[40px] rounded-md text-base font-normal text-neutral-700"
                                            value={provider.providerFee || undefined}
                                            onChange={(value) => updateProvider(provider.id, 'providerFee', value)}
                                            options={percentageOptions}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-start">
                                <PrimaryButton
                                    title="Add Another Provider"
                                    className="bg-neutral-200 text-black h-[40px] rounded-md !text-base !font-bold"
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