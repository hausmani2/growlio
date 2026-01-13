import React from 'react';
import ToggleSwitch from '../../../../buttons/ToggleSwitch';
import useTooltips from '../../../../../utils/useTooltips';
import TooltipIcon from '../../../../common/TooltipIcon';

const SalesDays = ({ data, updateData, errors = {} }) => {

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

    const tooltips = useTooltips('onboarding-sales');

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600 mb-2">Restaurant Operating Days</h3>
                
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Operating Days <span className="text-red-500">*</span>
                    <TooltipIcon text={tooltips['restaurant_days']} />
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {days.map((day, index) => {
                        const isSelected = data.selectedDays[day.name];
                        
                        return (
                        <div
                            key={index}
                            onClick={() => !day.disabled && handleDayToggle(day.name)}
                            className={`flex items-center justify-between px-4 py-3 border rounded-lg transition-all duration-200 ${
                                day.disabled
                                    ? 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-200'
                                    : isSelected
                                    ? 'cursor-pointer bg-orange-50 border-orange-200 hover:bg-orange-100'
                                    : 'cursor-pointer bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${
                                    day.disabled 
                                        ? 'text-gray-400' 
                                        : data.selectedDays[day.name]
                                        ? 'text-orange-700'
                                        : 'text-gray-700'
                                }`}>
                                    {day.name}
                                </span>
                                {data.selectedDays[day.name] && (
                                    <span className="text-xs text-green-600 font-medium">OPEN</span>
                                )}
                                {!data.selectedDays[day.name] && (
                                    <span className="text-xs text-red-600 font-medium">CLOSED</span>
                                )}
                            </div>
                            <ToggleSwitch
                                isOn={isSelected || false}
                                setIsOn={() => !day.disabled && handleDayToggle(day.name)}
                                disabled={day.disabled}
                                size="large"
                            />
                        </div>
                    );
                    })}
                </div>

                {errors.restaurant_days && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <span className="text-red-600 text-sm flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {errors.restaurant_days}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SalesDays;