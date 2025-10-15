/**
 * Token Management Utility for Super Admin Impersonation
 * 
 * This utility handles the complex token management required for super admin
 * impersonation functionality, ensuring proper token isolation and restoration.
 */

/**
 * Token storage keys
 */
const TOKEN_KEYS = {
  MAIN_TOKEN: 'token',
  ORIGINAL_SUPERADMIN_TOKEN: 'original_superadmin_token',
  ORIGINAL_SUPERADMIN_REFRESH: 'original_superadmin_refresh',
  IMPERSONATION_ACCESS: 'impersonation_access_token',
  IMPERSONATION_REFRESH: 'impersonation_refresh_token',
  IMPERSONATED_USER: 'impersonated_user',
  IMPERSONATED_USER_DATA: 'impersonated_user_data',
  IMPERSONATION_MESSAGE: 'impersonation_message',
  ORIGINAL_SUPERADMIN: 'original_superadmin',
  ORIGINAL_RESTAURANT_ID: 'original_restaurant_id'
};

/**
 * Check if currently impersonating a user
 * @returns {boolean} True if impersonating, false otherwise
 */
export const isImpersonating = () => {
  return !!localStorage.getItem(TOKEN_KEYS.IMPERSONATED_USER);
};

/**
 * Get the currently impersonated user email
 * @returns {string|null} Impersonated user email or null
 */
export const getImpersonatedUser = () => {
  return localStorage.getItem(TOKEN_KEYS.IMPERSONATED_USER);
};

/**
 * Get the currently impersonated user data
 * @returns {Object|null} Impersonated user data or null
 */
export const getImpersonatedUserData = () => {
  const userData = localStorage.getItem(TOKEN_KEYS.IMPERSONATED_USER_DATA);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Get the impersonation message
 * @returns {string|null} Impersonation message or null
 */
export const getImpersonationMessage = () => {
  return localStorage.getItem(TOKEN_KEYS.IMPERSONATION_MESSAGE);
};

/**
 * Store impersonation data
 * @param {Object} impersonationData - The impersonation response data
 */
export const storeImpersonationData = (impersonationData) => {
  const { impersonated_user, access, refresh, message } = impersonationData;
  
  console.log('🔍 Storing Impersonation Data:', {
    impersonatedUser: impersonated_user?.email,
    hasAccess: !!access,
    hasRefresh: !!refresh,
    message: message
  });
  
  // Store impersonation data
  localStorage.setItem(TOKEN_KEYS.IMPERSONATED_USER, impersonated_user.email);
  localStorage.setItem(TOKEN_KEYS.IMPERSONATED_USER_DATA, JSON.stringify(impersonated_user));
  localStorage.setItem(TOKEN_KEYS.IMPERSONATION_ACCESS, access);
  localStorage.setItem(TOKEN_KEYS.IMPERSONATION_REFRESH, refresh);
  localStorage.setItem(TOKEN_KEYS.IMPERSONATION_MESSAGE, message);
  
  // Update main token to impersonation token
  localStorage.setItem(TOKEN_KEYS.MAIN_TOKEN, access);
  
  console.log('✅ Impersonation data stored, main token updated to impersonation token');
};

/**
 * Store original super admin data before impersonation
 * @param {Object} superAdminData - The original super admin user data
 */
export const storeOriginalSuperAdminData = (superAdminData) => {
  console.log('🔍 Storing Original Super Admin Data:', {
    hasAccess: !!superAdminData.access,
    hasRefresh: !!superAdminData.refresh,
    email: superAdminData.email,
    alreadyStored: !!localStorage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN)
  });
  
  // Always store original super admin tokens if we have access token
  if (superAdminData.access) {
    localStorage.setItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN, superAdminData.access);
    localStorage.setItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_REFRESH, superAdminData.refresh);
    console.log('✅ Stored original super admin tokens');
  } else {
    console.log('❌ No access token available in super admin data');
  }
  
  // Store original restaurant_id if not already stored
  const originalRestaurantId = localStorage.getItem('restaurant_id');
  if (originalRestaurantId && !localStorage.getItem(TOKEN_KEYS.ORIGINAL_RESTAURANT_ID)) {
    localStorage.setItem(TOKEN_KEYS.ORIGINAL_RESTAURANT_ID, originalRestaurantId);
    console.log('✅ Stored original restaurant ID');
  }
  
  // Store original super admin user data
  localStorage.setItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN, JSON.stringify(superAdminData));
  console.log('✅ Stored original super admin user data');
};

/**
 * Clear all impersonation data
 */
export const clearImpersonationData = () => {
  console.log('🧹 Clearing impersonation data...');
  
  // Clear only impersonation-related data
  localStorage.removeItem(TOKEN_KEYS.IMPERSONATED_USER);
  localStorage.removeItem(TOKEN_KEYS.IMPERSONATED_USER_DATA);
  localStorage.removeItem(TOKEN_KEYS.IMPERSONATION_ACCESS);
  localStorage.removeItem(TOKEN_KEYS.IMPERSONATION_REFRESH);
  localStorage.removeItem(TOKEN_KEYS.IMPERSONATION_MESSAGE);
  localStorage.removeItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN);
  
  console.log('✅ Impersonation data cleared');
  console.log('ℹ️ Super admin tokens preserved:', {
    hasOriginalToken: !!localStorage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN),
    hasOriginalRefresh: !!localStorage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_REFRESH),
    hasOriginalRestaurantId: !!localStorage.getItem(TOKEN_KEYS.ORIGINAL_RESTAURANT_ID)
  });
};

/**
 * Clear original super admin tokens (called after successful restoration)
 */
export const clearOriginalSuperAdminTokens = () => {
  console.log('🧹 Clearing temporary original super admin tokens...');
  
  localStorage.removeItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN);
  localStorage.removeItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_REFRESH);
  localStorage.removeItem(TOKEN_KEYS.ORIGINAL_RESTAURANT_ID);
  
  console.log('✅ Temporary original super admin tokens cleared');
  console.log('ℹ️ Main token and user data preserved');
};

/**
 * Restore super admin token and data
 * @param {Function} setUser - Function to update user state
 * @returns {Object} Restoration result
 */
export const restoreSuperAdminToken = (setUser) => {
  try {
    const originalSuperadmin = localStorage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN);
    const originalSuperadminToken = localStorage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN);
    const originalSuperadminRefresh = localStorage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_REFRESH);
    const originalRestaurantId = localStorage.getItem(TOKEN_KEYS.ORIGINAL_RESTAURANT_ID);
    
    if (!originalSuperadmin || !originalSuperadminToken) {
      return { success: false, error: 'No original super admin data found' };
    }
    
    // Restore the main token to super admin token
    localStorage.setItem(TOKEN_KEYS.MAIN_TOKEN, originalSuperadminToken);
    
    // Restore the original restaurant_id
    if (originalRestaurantId) {
      localStorage.setItem('restaurant_id', originalRestaurantId);
    }
    
    // Restore original super admin user data
    if (setUser) {
      const originalUser = JSON.parse(originalSuperadmin);
      setUser({
        ...originalUser,
        access: originalSuperadminToken,
        refresh: originalSuperadminRefresh || originalUser.refresh,
        is_impersonated: false
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error restoring super admin token:', error);
    return { success: false, error: 'Failed to restore super admin token' };
  }
};

/**
 * Execute an API call with super admin token (temporarily switch token)
 * @param {Function} apiCall - The API call function to execute
 * @returns {Promise} The API call result
 */
export const withSuperAdminToken = async (apiCall) => {
  const currentToken = localStorage.getItem(TOKEN_KEYS.MAIN_TOKEN);
  const originalSuperadminToken = localStorage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN);
  
  // If we're impersonating, use the original super admin token for this request
  if (originalSuperadminToken && isImpersonating()) {
    localStorage.setItem(TOKEN_KEYS.MAIN_TOKEN, originalSuperadminToken);
  }
  
  try {
    const result = await apiCall();
    return result;
  } finally {
    // Always restore the current token after the request
    if (currentToken !== originalSuperadminToken) {
      localStorage.setItem(TOKEN_KEYS.MAIN_TOKEN, currentToken);
    }
  }
};

/**
 * Get current token type for debugging
 * @returns {string} Token type description
 */
export const getCurrentTokenType = () => {
  if (isImpersonating()) {
    return 'impersonation';
  } else if (localStorage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN)) {
    return 'superadmin';
  } else {
    return 'regular';
  }
};

/**
 * Debug function to log current token state
 */
export const debugTokenState = () => {
  console.log('=== Token State Debug ===');
  console.log('Is Impersonating:', isImpersonating());
  console.log('Current Token Type:', getCurrentTokenType());
  console.log('Has Original Super Admin Token:', !!localStorage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN));
  console.log('Has Impersonation Token:', !!localStorage.getItem(TOKEN_KEYS.IMPERSONATION_ACCESS));
  console.log('Main Token (first 20 chars):', localStorage.getItem(TOKEN_KEYS.MAIN_TOKEN)?.substring(0, 20));
  console.log('Original Super Admin Token (first 20 chars):', localStorage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN)?.substring(0, 20));
  console.log('Impersonation Token (first 20 chars):', localStorage.getItem(TOKEN_KEYS.IMPERSONATION_ACCESS)?.substring(0, 20));
  console.log('Impersonated User:', localStorage.getItem(TOKEN_KEYS.IMPERSONATED_USER));
  console.log('========================');
};

/**
 * Force store original super admin token (for debugging)
 */
export const forceStoreOriginalToken = (superAdminData) => {
  console.log('🔧 Force storing original super admin token...');
  localStorage.setItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN, superAdminData.access);
  localStorage.setItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_REFRESH, superAdminData.refresh);
  localStorage.setItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN, JSON.stringify(superAdminData));
  console.log('✅ Original super admin token force stored');
};

/**
 * Execute an API call with super admin token (for impersonation operations)
 * @param {Function} apiCall - The API call function to execute
 * @returns {Promise} The API call result
 */
export const withSuperAdminTokenForImpersonation = async (apiCall) => {
  const currentToken = localStorage.getItem(TOKEN_KEYS.MAIN_TOKEN);
  const originalSuperadminToken = localStorage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN);
  
  // If we have an original super admin token and we're not already using it
  if (originalSuperadminToken && currentToken !== originalSuperadminToken) {
    console.log('🔑 Temporarily switching to super admin token for impersonation API call');
    localStorage.setItem(TOKEN_KEYS.MAIN_TOKEN, originalSuperadminToken);
  }
  
  try {
    const result = await apiCall();
    return result;
  } finally {
    // Always restore the current token after the request
    if (currentToken !== originalSuperadminToken) {
      localStorage.setItem(TOKEN_KEYS.MAIN_TOKEN, currentToken);
      console.log('🔑 Restored impersonation token after API call');
    }
  }
};
