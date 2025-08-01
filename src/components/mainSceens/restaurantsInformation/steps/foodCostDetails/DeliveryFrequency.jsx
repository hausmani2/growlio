import React from 'react';
import LeftArrow from '../../../../../assets/svgs/left-arrow.svg';
import ToggleSwitch from '../../../../buttons/ToggleSwitch';
import PrimaryButton from '../../../../buttons/Buttons';
import { useTabHook } from '../../useTabHook';
import { useLocation } from 'react-router-dom';

const DeliveryFrequency = ({ data, updateData, onSaveAndContinue, loading = false }) => {
    const location = useLocation();
    const { navigateToNextStep, navigateToPreviousStep } = useTabHook();
    
    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    const days = [
        { name: 'Sunday', disabled: true },
        { name: 'Monday', disabled: false },
        { name: 'Tuesday', disabled: false },
        { name: 'Wednesday', disabled: false },
        { name: 'Thursday', disabled: false },
        { name: 'Friday', disabled: false },
        { name: 'Saturday', disabled: true },
    ];

    const handleDayToggle = (day) => {
        const updatedSelectedDays = {
            ...data.selectedDays,
            [day]: !data.selectedDays[day]
        };
        updateData('selectedDays', updatedSelectedDays);
    };

    const handleGoBack = () => {
        navigateToPreviousStep();
    };

    const handleSaveAndContinueClick = async () => {
        console.log("=== DeliveryFrequency Save & Continue Click ===");
        console.log("onSaveAndContinue prop:", onSaveAndContinue);
        console.log("loading prop:", loading);
        console.log("Current data:", data);
        console.log("Current selectedDays:", data.selectedDays);
        
        if (onSaveAndContinue) {
            try {
                console.log("Calling onSaveAndContinue...");
                const result = await onSaveAndContinue();
                console.log("onSaveAndContinue result:", result);
                
                if (result?.success) {
                    console.log("Success! Navigating to next step...");
                    // Navigate to next step after successful save
                    navigateToNextStep();
                } else {
                    console.log("Save failed:", result);
                }
            } catch (error) {
                console.error('Error in handleSaveAndContinueClick:', error);
            }
        } else {
            console.log("❌ onSaveAndContinue prop is not provided!");
        }
    };

    return (
        <div className="flex mt-5">
            <div className="w-[40%]">
                <div className="flex flex-col gap-2">
                    <h4 className="text-lg !font-bold !mb-0">Delivery Frequency</h4>
                    <span className="text-base text-neutral-600">How many times per week are receiving deliveries from your suppliers?</span>
                </div>
            </div>
            <div className="w-[60%]">
                <div className="flex flex-col gap-3 p-6 bg-white rounded-xl" >
                    <div className="flex flex-col gap-4">
                        <label htmlFor="cogs" className="text-base !font-bold text-neutral-600 flex items-center gap-2 mb-2">Select your delivery days</label>
                        {days.map((day, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between px-6 py-4 border border-gray-200 rounded-xl bg-white ${day.disabled ? 'opacity-60 cursor-not-allowed' : ''} mb-3`}
                            >
                                <span className={`text-base ${day.disabled ? 'text-gray-400' : 'text-neutral-600'}`}>{day.name}</span>
                                <ToggleSwitch
                                    isOn={data.selectedDays[day.name] || false}
                                    setIsOn={() => !day.disabled && handleDayToggle(day.name)}
                                    disabled={day.disabled}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                {!isUpdateMode && (
                    <div className="flex justify-between items-center my-5">
                        <PrimaryButton icon={LeftArrow} title="Go Back" className="bg-gray-200 text-black h-[40px]" onClick={handleGoBack} disabled={loading} />
                        <PrimaryButton 
                            title={loading ? "Saving..." : "Save & Continue"} 
                            className="btn-brand"
                            onClick={() => {
                                console.log("Save & Continue button clicked!");
                                handleSaveAndContinueClick();
                            }}
                            disabled={loading}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default DeliveryFrequency;