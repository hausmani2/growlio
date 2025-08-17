import React from 'react';

const GrowlioLogo = ({ 
  width = 120, 
  height = 32, 
  className = "", 
  showText = true,
  iconOnly = false 
}) => {
  if (iconOnly) {
    return (
      <svg 
        width={width} 
        height={height} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect x="4" y="4" width="24" height="24" rx="4" fill="#FF8132"/>
      </svg>
    );
  }

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 120 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Orange Square Block */}
      <rect x="0" y="4" width="24" height="24" rx="4" fill="#FF8132"/>
      
      {/* Growlio Text */}
      {showText && (
        <text x="32" y="22" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#FF8132">
          Growlio
        </text>
      )}
    </svg>
  );
};

export default GrowlioLogo;
