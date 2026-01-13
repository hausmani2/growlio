import React from 'react';

const ToggleSwitch = ({ isOn, setIsOn, size = 'default', className = '' }) => {
    const sizeClasses = {
        small: 'w-[28px] h-[28px]',
        default: 'w-[36px] h-[24px]',
        large: 'w-[44px] h-[28px]'
    };

    const sliderSizes = {
        small: 'w-[12px] h-[20px]',
        default: 'w-[16px] h-[18px]',
        large: 'w-[20px] h-[20px]'
    };

    const sliderMargins = {
        small: { on: 'ml-[14px]', off: 'ml-[2px]' },
        default: { on: 'ml-[18px]', off: 'ml-[2px]' },
        large: { on: 'ml-[22px]', off: 'ml-[2px]' }
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