/**
 * Format utility functions for currency, numbers, etc.
 */

/**
 * Format number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: $)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = '$') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currency}0.00`;
  }
  
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currency}${formatted}`;
};

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number string
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  return Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted percentage string
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Keep in-progress decimal strings in controlled inputs.
 * parseFloat("10.0") === 10, so storing a number on each keystroke
 * makes zeros after the decimal impossible to type.
 */
export const sanitizeDecimalInput = (rawValue, maxDecimals = 2) => {
  if (rawValue === null || rawValue === undefined) return '';
  let str = String(rawValue).replace(/[^\d.]/g, '');
  const firstDot = str.indexOf('.');
  if (firstDot !== -1) {
    str = str.slice(0, firstDot + 1) + str.slice(firstDot + 1).replace(/\./g, '');
    if (maxDecimals >= 0) {
      str = str.slice(0, firstDot + 1 + maxDecimals);
    }
  }
  str = str.replace(/^0+(?=\d)/, '');
  return str;
};

export const roundToCents = (value) => {
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
};