/**
 * Utility functions for handling third-party sales data
 * Provides professional formatting and data extraction for third-party sales providers
 */

/**
 * Extracts provider name from API field name by removing 'actual_sales_' prefix
 * and formatting to show only the last two words (e.g., "Door Dash", "Skip The Dishes")
 * 
 * @param {string} fieldName - The API field name (e.g., "actual_sales_door_dash")
 * @returns {string} - Formatted provider name (e.g., "Door Dash")
 */
export const extractProviderName = (fieldName) => {
  if (!fieldName || typeof fieldName !== 'string') {
    return 'Unknown Provider';
  }

  // Remove 'actual_sales_' prefix if present
  const cleanName = fieldName.replace(/^actual_sales_/, '');
  
  // Convert snake_case to Title Case
  const titleCase = cleanName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Extract last two words for cleaner display
  const words = titleCase.split(' ');
  if (words.length >= 2) {
    return words.slice(-2).join(' ');
  }
  
  return titleCase;
};

/**
 * Processes third-party sales data from API response
 * Handles both the new object format and legacy array format
 * 
 * @param {Object|Array} thirdPartyData - The third-party sales data from API
 * @returns {Array} - Array of processed provider objects
 */
export const processThirdPartySales = (thirdPartyData) => {
  if (!thirdPartyData) {
    return [];
  }

  const providers = [];

  // Handle new object format: { "actual_sales_door_dash": 100.0, "actual_sales_skip_the_dishes": 200.0 }
  if (typeof thirdPartyData === 'object' && !Array.isArray(thirdPartyData)) {
    Object.entries(thirdPartyData).forEach(([fieldName, value]) => {
      // Skip non-sales fields
      if (fieldName === 'uses_third_party_delivery' || fieldName === 'message') {
        return;
      }

      const salesValue = parseFloat(value) || 0;
      if (salesValue > 0) {
        providers.push({
          name: extractProviderName(fieldName),
          key: fieldName,
          sales: salesValue,
          originalField: fieldName
        });
      }
    });
  }
  // Handle legacy array format (backward compatibility)
  else if (Array.isArray(thirdPartyData)) {
    thirdPartyData.forEach((provider, index) => {
      if (provider.provider_name && provider.provider_fee) {
        const providerFee = parseFloat(provider.provider_fee) || 0;
        if (providerFee > 0) {
          providers.push({
            name: provider.provider_name,
            key: `provider_${index}`,
            sales: providerFee,
            originalField: provider.provider_name
          });
        }
      }
    });
  }

  return providers;
};

/**
 * Gets the total third-party sales value
 * 
 * @param {Array} providers - Array of provider objects
 * @returns {number} - Total sales value
 */
export const getTotalThirdPartySales = (providers) => {
  return providers.reduce((total, provider) => total + (provider.sales || 0), 0);
};

/**
 * Formats third-party sales for display based on print format
 * 
 * @param {number} value - The sales value
 * @param {string} printFormat - The display format ('dollar', 'percentage', 'number')
 * @returns {string} - Formatted value string
 */
export const formatThirdPartySalesValue = (value, printFormat = 'dollar') => {
  if (printFormat === 'percentage') {
    return `${parseFloat(value).toFixed(1)}%`;
  } else if (printFormat === 'number') {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
};

/**
 * Creates a unique key for third-party provider sections
 * 
 * @param {string} providerName - The provider name
 * @param {number} index - The provider index
 * @returns {string} - Unique key for the provider
 */
export const createProviderKey = (providerName, index) => {
  return `third_party_${providerName.toLowerCase().replace(/\s+/g, '_')}_${index}`;
};
