import React from 'react';
import LeftArrow from '../../../../../assets/svgs/left-arrow.svg';
import ToggleSwitch from '../../../../buttons/ToggleSwitch';
import PrimaryButton from '../../../../buttons/Buttons';
import { useTabHook } from '../../useTabHook';
import { useLocation } from 'react-router-dom';
import useTooltips from '../../../../../utils/useTooltips';
import TooltipIcon from '../../../../common/TooltipIcon';

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

    const handleSelectAll = () => {
        const allDaysSelected = {};
        days.forEach(day => {
            if (!day.disabled) {
                allDaysSelected[day.name] = true;
            }
        });
        updateData('selectedDays', allDaysSelected);
    };

    // Check if all non-disabled days are selected
    const areAllDaysSelected = days
        .filter(day => !day.disabled)
        .every(day => data.selectedDays[day.name] === true);

    const handleGoBack = () => {
        navigateToPreviousStep();
    };

    const handleSaveAndContinueClick = async () => {
        if (onSaveAndContinue) {
            try {
                const result = await onSaveAndContinue();

                if (result?.success) {
                    // Navigate to next step after successful save
                    navigateToNextStep(true); // Skip completion check since we just saved successfully
                }
            } catch (error) {
                console.error('Error in handleSaveAndContinueClick:', error);
            }
        }
    };

    const tooltips = useTooltips('onboarding-food');

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600 mb-2">Delivery Frequency</h3>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">
                        Select your delivery days <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['delivery_days']} />
                    </label>
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 transition-colors duration-200"
                    >
                        Select All
                    </button>
                </div>
                
                <div className="space-y-3">
                    {days.map((day, index) => (
                        <div
                            key={index}
                            onClick={() => !day.disabled && handleDayToggle(day.name)}
                            className={`flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg ${day.disabled
                                    ? 'opacity-60 cursor-not-allowed bg-gray-100'
                                    : 'cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 bg-white'
                                }`}
                        >
                            <span className={`text-sm ${day.disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                                {day.name}
                            </span>
                            <ToggleSwitch
                                isOn={data.selectedDays[day.name] || false}
                                setIsOn={() => !day.disabled && handleDayToggle(day.name)}
                                disabled={day.disabled}
                                size="large"
                            />
                        </div>
                    ))}
                </div>

                {errors.delivery_days && (
                    <span className="text-red-500 text-xs mt-1">{errors.delivery_days}</span>
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
                        className="btn-brand w-full sm:w-auto text-sm h-11"
                        onClick={() => {
                            handleSaveAndContinueClick();
                        }}
                        disabled={loading}
                    />
                </div>
            )}
        </div>
    );
}

export default DeliveryFrequency;