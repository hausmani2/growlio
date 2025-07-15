import React from 'react';
import ToggleSwitch from '../../../../buttons/ToggleSwitch';
import PrimaryButton from '../../../../buttons/Buttons';
import LeftArrow from '../../../../../assets/svgs/left-arrow.svg';
import { useTabHook } from '../../useTabHook';

const SalesChannel = ({ data, updateData }) => {
    const { handleTabClick } = useTabHook();
    
    const salesChannels = [
        { title: 'In-Store Sales', description: "Sales made directly at your restaurant's physical location.", key: 'inStoreSales', enabled: data?.salesChannels?.inStoreSales ?? true },
        { title: 'Online Sales', description: "Sales made through your restaurant's website or online ordering system.", key: 'onlineSales', enabled: data?.salesChannels?.onlineSales ?? false },
        { title: 'Sales From an App', description: "Sales made through a dedicated mobile application for your restaurant.", key: 'appSales', enabled: data?.salesChannels?.appSales ?? false },
        { title: 'Third-Party Sales', description: "Sales made through third-party platforms like Grubhub or DoorDash.", key: 'thirdPartySales', enabled: data?.salesChannels?.thirdPartySales ?? false },
    ];

    const handleToggle = (channelKey) => {
        const currentValue = data?.salesChannels?.[channelKey] ?? false;
        updateData(channelKey, !currentValue);
    };

    const handleGoBack = () => {
        handleTabClick(2); // Navigate to Food Cost Details (tab index 1)
    };

    const handleSaveAndContinue = () => {
        console.log("data");
    };

    return (
        <div className="flex mt-5">
            <div className="w-[40%]">
                <div className="flex flex-col gap-2">
                    <h4 className="text-lg !font-bold !mb-0">Sales Channel</h4>
                    <span className="text-base text-neutral-600">Define your active sales channels to accurately track your restaurant's financial performance.</span>
                </div>
            </div>
            <div className="w-[60%]">
                <div className="flex flex-col gap-3 p-6 bg-white rounded-xl">
                    <div className="flex flex-col gap-4">
                        <label htmlFor="cogs" className="text-base !font-bold text-neutral flex items-center ">Sales Channels</label>
                        {salesChannels.map((channel, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between px-6 py-4 border border-gray-200 rounded-xl bg-white mb-3`}
                            >
                                <div className='flex flex-col gap-1'>
                                    <span className="text-base !font-bold text-neutral-600">{channel.title}</span>
                                    <span className="text-base font-regular text-neutral-600 ">{channel.description}</span>
                                </div>
                                <ToggleSwitch
                                    isOn={channel.enabled}
                                    setIsOn={() => handleToggle(channel.key)}

                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-between items-center my-5">
                        <PrimaryButton icon={LeftArrow} title="Go Back" className="bg-gray-200 text-black h-[40px]" onClick={handleGoBack} />
                        <PrimaryButton 
                            title="Save & Continue" 
                            className="btn-brand"
                            onClick={handleSaveAndContinue}
                        />
                </div>
               
            </div>
        </div>
    );
}

export default SalesChannel;