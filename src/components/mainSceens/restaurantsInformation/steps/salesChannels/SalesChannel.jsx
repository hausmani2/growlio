import React from 'react';
import ToggleSwitch from '../../../../buttons/ToggleSwitch';
import PrimaryButton from '../../../../buttons/Buttons';
import LeftArrow from '../../../../../assets/svgs/left-arrow.svg';
import { useTabHook } from '../../useTabHook';
import { useLocation } from 'react-router-dom';

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
        <div className="flex flex-col lg:flex-row mt-5 gap-4 lg:gap-0">
            <div className="w-full lg:w-[40%]">
                <div className="flex flex-col gap-2">
                    <h4 className="text-lg !font-bold !mb-0">Sales Channels</h4>
                    <span className="text-sm sm:text-base text-neutral-600">
                        Define your active sales channels to accurately track your restaurant's financial performance.
                    </span>
                </div>
            </div>
            <div className="w-full lg:w-[60%]">
                <div className="flex flex-col gap-3 p-4 sm:p-6 bg-white rounded-xl">
                    <div className="flex flex-col gap-4">
                        <label className="text-sm sm:text-base !font-bold text-neutral-600 flex items-center">
                            Sales Channels <span className="text-red-500">*</span>
                        </label>
                        {salesChannels.map((channel, index) => (
                            <div
                                key={index}
                                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 border border-gray-200 rounded-xl bg-white mb-3 gap-3 sm:gap-0 ${
                                    errors.sales_channels ? 'border-red-500' : ''
                                }`}
                            >
                                <div className='flex flex-col gap-1 flex-1'>
                                    <span className="text-sm sm:text-base !font-bold text-neutral-600">{channel.title}</span>
                                    <span className="text-xs sm:text-base font-regular text-neutral-600">{channel.description}</span>
                                </div>
                                <ToggleSwitch
                                    isOn={channel.enabled}
                                    setIsOn={() => handleToggle(channel.key)}
                                />
                            </div>
                        ))}
                        {errors.sales_channels && (
                            <span className="text-red-500 text-xs sm:text-sm">{errors.sales_channels}</span>
                        )}
                    </div>
                </div>
                {!isUpdateMode && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 my-5">
                        <PrimaryButton 
                            title="Back" 
                            className="border-none w-full sm:w-auto"
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
        </div>
    );
};

export default SalesChannel;