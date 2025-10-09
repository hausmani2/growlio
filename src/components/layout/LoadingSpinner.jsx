import React from 'react';

const LoadingSpinner = ({ 
  message = "Loading...", 
  size = "medium",
  showSubtext = true,
  subtext = "Please wait...",
  className = ""
}) => {
  // Size configurations
  const sizeConfig = {
    small: {
      spinner: "h-6 w-6",
      text: "text-sm",
      subtext: "text-xs"
    },
    medium: {
      spinner: "h-8 w-8", 
      text: "text-base",
      subtext: "text-sm"
    },
    large: {
      spinner: "h-12 w-12",
      text: "text-lg", 
      subtext: "text-sm"
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className={`animate-spin rounded-full ${config.spinner} border-2 border-gray-300 border-t-orange-500 mx-auto mb-3`}></div>
        <p className={`text-gray-700 font-medium ${config.text}`}>{message}</p>
        {showSubtext && (
          <p className={`text-gray-500 ${config.subtext} mt-1`}>{subtext}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner; 