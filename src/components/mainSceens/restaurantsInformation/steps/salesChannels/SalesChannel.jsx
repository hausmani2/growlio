import React from 'react';
import ToggleSwitch from '../../../../buttons/ToggleSwitch';
import PrimaryButton from '../../../../buttons/Buttons';
import LeftArrow from '../../../../../assets/svgs/left-arrow.svg';
import { useTabHook } from '../../useTabHook';

const SalesChannel = ({ data, updateData, errors = {}, onSaveAndContinue, loading = false }) => {
    const { navigateToNextStep, navigateToPreviousStep } = useTabHook();
    
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

    const handleToggle = (channelKey) => {
        const currentValue = data?.[channelKey] ?? false;
        updateData(channelKey, !currentValue);
    };

    const handleGoBack = () => {
        navigateToPreviousStep();
    };

    const handleSaveAndContinueClick = async () => {
        if (onSaveAndContinue) {
            const result = await onSaveAndContinue();
            if (result?.success) {
                // Navigate to next step after successful save
                navigateToNextStep();
            }
        }
    };

    return (
        <div className="flex mt-5">
            <div className="w-[40%]">
                <div className="flex flex-col gap-2">
                    <h4 className="text-lg !font-bold !mb-0">Sales Channels</h4>
                    <span className="text-base text-neutral-600">
                        Define your active sales channels to accurately track your restaurant's financial performance.
                    </span>
                </div>
            </div>
            <div className="w-[60%]">
                <div className="flex flex-col gap-3 p-6 bg-white rounded-xl">
                    <div className="flex flex-col gap-4">
                        <label className="text-base !font-bold text-neutral-600 flex items-center">
                            Sales Channels <span className="text-red-500">*</span>
                        </label>
                        {salesChannels.map((channel, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between px-6 py-4 border border-gray-200 rounded-xl bg-white mb-3 ${
                                    errors.sales_channels ? 'border-red-500' : ''
                                }`}
                            >
                                <div className='flex flex-col gap-1'>
                                    <span className="text-base !font-bold text-neutral-600">{channel.title}</span>
                                    <span className="text-base font-regular text-neutral-600">{channel.description}</span>
                                </div>
                                <ToggleSwitch
                                    isOn={channel.enabled}
                                    setIsOn={() => handleToggle(channel.key)}
                                />
                            </div>
                        ))}
                        {errors.sales_channels && (
                            <span className="text-red-500 text-sm">{errors.sales_channels}</span>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center my-5">
                    <PrimaryButton 
                        icon={LeftArrow} 
                        title="Go Back" 
                        className="bg-gray-200 text-black h-[40px]" 
                        onClick={handleGoBack}
                        disabled={loading}
                    />
                    <PrimaryButton 
                        title={loading ? "Saving..." : "Save & Continue"} 
                        className="btn-brand"
                        onClick={handleSaveAndContinueClick}
                        disabled={loading}
                    />
                </div>
            </div>
        </div>
    );
};

export default SalesChannel;