import React from "react";

export default function PrimaryBtn({
  onClick,
  title,
  className = "",
  disabled = false,
  icon = null,
  icon2 = null,
  iconSize = 16,
  color = "gray",
}) {
  // Base classes that work with the new Tailwind configuration
  const baseClasses = "border rounded-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50 hover:border-black px-4 py-2 sm:px-6 sm:py-3";
  
  // Dynamic color classes - using Tailwind's color system
  const colorClasses = {
    gray: "border-gray-300 hover:border-gray-600",
    primary: "border-primary-500 hover:border-primary-700",
    secondary: "border-secondary-500 hover:border-secondary-700",
    success: "border-success-500 hover:border-success-700",
    warning: "border-warning-500 hover:border-warning-700",
    error: "border-error-500 hover:border-error-700",
    brand: "border-brand-orange hover:border-brand-orange-dark",
  };

  const selectedColorClass = colorClasses[color] || colorClasses.gray;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${selectedColorClass} ${className}`}
    >
      {icon && <img src={icon} alt="icon" style={{ height: `${iconSize}px`, width: `${iconSize}px` }} />}
      <span className="text-sm sm:text-base font-medium">{title}</span>
      {icon2 && <img src={icon2} alt="icon2" style={{ height: `${iconSize}px`, width: `${iconSize}px` }} />}
    </button>
  );
}
