import React from 'react';

const OnboardingBreadcrumb = ({ currentStep, description, heading, description2, heading2, description3 }) => {
    return (
        <div className="mb-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span className="hover:text-orange-600 cursor-pointer text-orange-500">Onboarding</span>
                <span className="text-orange-300">/</span>
                <span className="text-orange-600 font-medium">{currentStep}</span>
            </div>
            
            {/* Page Title */}
            <h1 className="text-2xl font-bold text-orange-600 mb-2">{currentStep}</h1>
            
            {/* Description */}
            <p className="text-gray-600 text-base ">{description}</p>
            <p className="text-orange-600 text-base font-medium">{heading} 
                 <span className="font-normal text-black"> {description2} </span>
            </p>
            <p className="text-gray-600 text-base font-medium text-orange-600">{heading2} 
                 <span className="font-normal text-black">{description3}</span>
            </p>
        </div>
    );
};

export default OnboardingBreadcrumb;
