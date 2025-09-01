import React from 'react';

const MonthlyWeeklyToggle = ({ isMonthly, setIsMonthly, size = 'medium', className = '' }) => {
    const sizeClasses = {
        small: 'w-16 h-7',
        medium: 'w-[110px] h-[34px]',
        large: 'w-28 h-10'
    };

    const textSizes = {
        small: 'text-xs',
        medium: 'text-xs',
        large: 'text-sm'
    };

    // Calculate proper dimensions for consistent alignment
    const getSliderDimensions = (size) => {
        switch (size) {
            case 'small':
                return { width: 'w-10', height: 'h-6' };
            case 'medium':
                return { width: 'w-12', height: 'h-7' };
            case 'large':
                return { width: 'w-12', height: 'h-9' };
            default:
                return { width: 'w-10', height: 'h-7' };
        }
    };

    const getButtonDimensions = (size) => {
        switch (size) {
            case 'small':
                return { width: 'w-10', height: 'h-6', padding: 'px-1' };
            case 'medium':
                return { width: 'w-10', height: 'h-7', padding: 'px-1.5' };
            case 'large':
                return { width: 'w-12', height: 'h-9', padding: 'px-2' };
            default:
                return { width: 'w-10', height: 'h-7', padding: 'px-1.5' };
        }
    };

    const handleToggle = () => {
        setIsMonthly(!isMonthly);
    };

    const sliderDims = getSliderDimensions(size);
    const buttonDims = getButtonDimensions(size);

    return (
        <div className={`relative ${sizeClasses[size]} bg-gray-100 border border-gray-300 rounded-full cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 ${className}`} onClick={handleToggle}>
            {/* Sliding background */}
            <div 
                className={`absolute top-0.5 bottom-0.5 rounded-full transition-all duration-200 ${
                    isMonthly 
                        ? 'right-0.5' 
                        : 'left-0.5'
                } ${sliderDims.width} ${sliderDims.height} ${
                    isMonthly ? 'bg-orange-500' : 'bg-blue-500'
                }`}
            />
            
            {/* Weekly Button */}
            <button
                className={`absolute top-0.5 left-1 z-10 ${buttonDims.width} ${buttonDims.height} ${buttonDims.padding} rounded-full font-medium transition-all duration-200 flex items-center justify-center ${
                    textSizes[size]
                } ${
                    !isMonthly 
                        ? 'text-white font-semibold' 
                        : 'text-gray-800 hover:text-gray-700 '
                }`}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsMonthly(false);
                }}
            >
                Weekly
            </button>
            
            {/* Monthly Button */}
            <button
                className={`absolute top-0.5 right-1.5 z-10 ${buttonDims.width} ${buttonDims.height} ${buttonDims.padding} rounded-full font-medium transition-all duration-200 flex items-center justify-center ${
                    textSizes[size]
                } ${
                    isMonthly 
                        ? 'text-white font-semibold' 
                        : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsMonthly(true);
                }}
            >
                Monthly
            </button>
            
            {/* Current selection indicator */}
            <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                isMonthly ? 'bg-orange-500' : 'bg-blue-500'
            }`} />
        </div>
    );
};

export default MonthlyWeeklyToggle;
