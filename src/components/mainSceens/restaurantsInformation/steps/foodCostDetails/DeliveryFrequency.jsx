import React from 'react';
import LeftArrow from '../../../../../assets/svgs/left-arrow.svg';
import ToggleSwitch from '../../../../buttons/ToggleSwitch';
import PrimaryButton from '../../../../buttons/Buttons';
import { useTabHook } from '../../useTabHook';
import { useLocation } from 'react-router-dom';

const DeliveryFrequency = ({ data, updateData, onSaveAndContinue, loading = false, errors = {} }) => {
    const location = useLocation();
    const { navigateToNextStep, navigateToPreviousStep } = useTabHook();
    
    // Check if this is update mode (accessed from sidebar) or onboarding mode
    const isUpdateMode = !location.pathname.includes('/onboarding');
    
    const days = [
        { name: 'Sunday', disabled: false },
        { name: 'Monday', disabled: false },
        { name: 'Tuesday', disabled: false },
        { name: 'Wednesday', disabled: false },
        { name: 'Thursday', disabled: false },
        { name: 'Friday', disabled: false },
        { name: 'Saturday', disabled: false },
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
        if (onSaveAndContinue) {
            try {
                const result = await onSaveAndContinue();
                
                if (result?.success) {
                    // Navigate to next step after successful save
                    navigateToNextStep();
                } 
            } catch (error) {
                console.error('Error in handleSaveAndContinueClick:', error);
            }
        }
    };

    return (
        <div className="flex flex-col lg:flex-row mt-5 gap-4 lg:gap-0">
            {/* Left Section - Title and Description */}
            <div className="w-full lg:w-[40%]">
                <div className="flex flex-col gap-2">
                    <h4 className="text-lg !font-bold !mb-0">
                        Delivery Frequency
                    </h4>
                    <span className="text-sm sm:text-base text-neutral-600">
                        How many times per week are receiving deliveries from your suppliers?
                    </span>
                </div>
            </div>
            
            {/* Right Section - Form Content */}
            <div className="w-full lg:w-[60%]">
                <div className="flex flex-col gap-3 p-4 sm:p-6 bg-white rounded-xl" >
                    <div className="flex flex-col gap-4 sm:gap-5">
                        <label htmlFor="cogs" className="text-xs sm:text-sm lg:text-base !font-bold text-neutral-600 flex items-center gap-1 sm:gap-2 mb-2">
                            Select your delivery days
                            <span className="text-red-500">*</span>
                        </label>
                        {days.map((day, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border border-gray-200 rounded-lg sm:rounded-xl bg-white ${day.disabled ? 'opacity-60 cursor-not-allowed' : ''} mb-2 sm:mb-3`}
                            >
                                <span className={`text-xs sm:text-sm lg:text-base ${day.disabled ? 'text-gray-400' : 'text-neutral-600'}`}>
                                    {day.name}
                                </span>
                                <ToggleSwitch
                                    isOn={data.selectedDays[day.name] || false}
                                    setIsOn={() => !day.disabled && handleDayToggle(day.name)}
                                    disabled={day.disabled}
                                />
                            </div>
                        ))}
                        {errors.delivery_days && (
                            <span className="text-red-500 text-xs sm:text-sm lg:text-base">{errors.delivery_days}</span>
                        )}
                    </div>
                </div>
                
                {!isUpdateMode && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 my-4 sm:my-5 lg:my-6">
                        <PrimaryButton 
                            icon={LeftArrow} 
                            title="Go Back" 
                            className="bg-gray-200 text-black h-[40px] w-full sm:w-auto text-xs sm:text-sm lg:text-base" 
                            onClick={handleGoBack} 
                            disabled={loading} 
                        />
                        <PrimaryButton 
                            title={loading ? "Saving..." : "Save & Continue"} 
                            className="btn-brand w-full sm:w-auto text-xs sm:text-sm lg:text-base"
                            onClick={() => {
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