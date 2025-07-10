import React from 'react';

const ToggleSwitch = ({ isOn, setIsOn, size = 'default', className = '' }) => {
    const sizeClasses = {
        small: 'w-[20px] h-[20px]',
        default: 'w-[24px] h-[24px]',
        large: 'w-[32px] h-[32px]'
    };

    const sliderSizes = {
        small: 'w-[8px] h-[16px]',
        default: 'w-[11px] h-[20px]',
        large: 'w-[14px] h-[26px]'
    };

    const sliderMargins = {
        small: { on: 'ml-[10px]', off: 'ml-[2px]' },
        default: { on: 'ml-[12px]', off: 'ml-[2px]' },
        large: { on: 'ml-[16px]', off: 'ml-[2px]' }
    };

    return (
        <div
            onClick={() => setIsOn(!isOn)}
            className={`cursor-pointer ${sizeClasses[size]} rounded-[8px] flex items-center transition-colors duration-300 shadow-md ${isOn ? 'bg-orange-600' : 'bg-gray-200'} ${className}`}
            style={{ boxShadow: '0 8px 16px 0 rgba(0,0,0,0.10)' }}
        >
            <div
                className={`${sliderSizes[size]} rounded-[8px] bg-white transition-all duration-300 shadow ${isOn ? sliderMargins[size].on : sliderMargins[size].off}`}
            ></div>
        </div>
    );
};

export default ToggleSwitch; 