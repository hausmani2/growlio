import React from 'react';
import ToggleSwitch from '../../../../buttons/ToggleSwitch';
import useTooltips from '../../../../../utils/useTooltips';
import TooltipIcon from '../../../../common/TooltipIcon';
import { WEEK_START_DAY_OPTIONS, normalizeWeekStartDay } from '../../../../../utils/weekStart';

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

    // Check if all days are selected (open)
    const allDaysSelected = days.every(day => data.selectedDays[day.name] === true);

    // Handle select all / deselect all
    const handleSelectAll = () => {
        const updatedSelectedDays = {};
        days.forEach(day => {
            // If all are selected, deselect all (close all)
            // If not all are selected, select all (open all)
            updatedSelectedDays[day.name] = !allDaysSelected;
        });
        updateData('selectedDays', updatedSelectedDays);
    };

    const weekStartDay = normalizeWeekStartDay(data.week_start_day);
    const weekOrder = [
        ...WEEK_START_DAY_OPTIONS.slice(weekStartDay),
        ...WEEK_START_DAY_OPTIONS.slice(0, weekStartDay),
    ];
    const startLabel = WEEK_START_DAY_OPTIONS[weekStartDay]?.label || 'Sunday';
    const endLabel = weekOrder[6]?.label || 'Saturday';

    const tooltips = useTooltips('onboarding-sales');

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
            {/* Header Section */}
            <div className="mb-6">
                <h3 className="text-xl font-bold text-orange-600 mb-2">Restaurant Operating Days</h3>
                
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
                {/* Week starts on — enhanced interactive week builder */}
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-orange-100 bg-orange-50/70 px-4 py-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">
                                Week starts on
                                <TooltipIcon
                                    text={
                                        tooltips['week_start_day'] ||
                                        'First day of your business week for Close Out and reports. Changing this regroups past weeks from daily data; daily totals are not changed.'
                                    }
                                />
                            </label>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Build your Close Out week — tap any day to start
                            </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-orange-200 bg-white px-3 py-1.5 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-xs font-semibold text-orange-600">
                                {startLabel}
                            </span>
                            <span className="text-xs text-gray-400">→</span>
                            <span className="text-xs font-medium text-gray-600">
                                {endLabel}
                            </span>
                        </div>
                    </div>

                    <div
                        role="radiogroup"
                        aria-label="Week starts on"
                        className="bg-white p-4"
                    >
                        {/* Progress track */}
                        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-300 transition-all duration-500 ease-out"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div
                            key={weekStartDay}
                            className="relative grid grid-cols-7 gap-1 sm:gap-2"
                        >
                            <div
                                className="pointer-events-none absolute left-[6%] right-[6%] top-[18px] h-[2px] bg-orange-100"
                                aria-hidden
                            />

                            {weekOrder.map((opt, idx) => {
                                const isStart = idx === 0;
                                const isEnd = idx === 6;
                                return (
                                    <button
                                        key={`${weekStartDay}-${opt.value}`}
                                        type="button"
                                        role="radio"
                                        aria-checked={isStart}
                                        aria-label={`Start week on ${opt.label}`}
                                        onClick={() => updateData('week_start_day', opt.value)}
                                        className={`group relative z-[1] flex flex-col items-center gap-1 rounded-xl border px-0.5 py-2.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 ${
                                            isStart
                                                ? '-translate-y-0.5 border-orange-400 bg-orange-500 text-white shadow-md shadow-orange-200/80'
                                                : 'border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:shadow-sm'
                                        }`}
                                    >
                                        <span
                                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-colors ${
                                                isStart
                                                    ? 'bg-white/25 text-white'
                                                    : isEnd
                                                    ? 'bg-orange-100 text-orange-600'
                                                    : 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-600'
                                            }`}
                                        >
                                            {idx + 1}
                                        </span>
                                        <span
                                            className={`text-[11px] font-bold sm:text-sm ${
                                                isStart ? 'text-white' : 'text-gray-800'
                                            }`}
                                        >
                                            {opt.label.slice(0, 3)}
                                        </span>
                                        <span
                                            className={`text-[8px] font-semibold uppercase tracking-wider sm:text-[9px] ${
                                                isStart
                                                    ? 'text-orange-100'
                                                    : isEnd
                                                    ? 'text-orange-500'
                                                    : 'text-gray-300 group-hover:text-orange-300'
                                            }`}
                                        >
                                            {isStart ? 'Start' : isEnd ? 'End' : 'Day'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 font-medium text-orange-700 border border-orange-100">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Business week
                                </span>
                                <span>
                                    {startLabel} through {endLabel}
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400">
                                Used in Close Out, cash flow &amp; reports
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">
                        Operating Days <span className="text-red-500">*</span>
                        <TooltipIcon text={tooltips['restaurant_days']} />
                    </label>
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    >
                        {allDaysSelected ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
                
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
