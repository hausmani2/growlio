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
    ];

    const handleToggle = (channelKey) => {
        const currentValue = data?.[channelKey] ?? false;
        updateData(channelKey, !currentValue);
    };
    const tooltips = useTooltips('onboarding-sales');

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6" >
                <h3 className="text-xl font-bold text-orange-600 mb-2">Operating Information</h3>
                {/* <p className="text-gray-600 text-sm">
                    Define your active sales channels to accurately track your restaurant's financial performance.
                </p> */}
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2" >
                    Sales Channels <span className="text-red-500">*</span>
                    <TooltipIcon text={tooltips['sales_channels']} />
                </label>
                
                <div className="space-y-3">
                    {salesChannels.map((channel, index) => (
                        <div
                            key={index}
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

            </div>
            
            {/* Navigation Buttons */}
 
        </div>
    );
};

export default SalesChannel;