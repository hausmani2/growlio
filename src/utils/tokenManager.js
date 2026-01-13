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

// Use sessionStorage for impersonation and active token data
const storage = {
  getItem: (key) => {
    try { return sessionStorage.getItem(key); } catch { return null; }
  },
  setItem: (key, value) => {
    try { sessionStorage.setItem(key, value); } catch {}
  },
  removeItem: (key) => {
    try { sessionStorage.removeItem(key); } catch {}
  }
};

/**
 * Check if currently impersonating a user
 * @returns {boolean} True if impersonating, false otherwise
 */
export const isImpersonating = () => {
  return !!storage.getItem(TOKEN_KEYS.IMPERSONATED_USER);
};

/**
 * Get the currently impersonated user email
 * @returns {string|null} Impersonated user email or null
 */
export const getImpersonatedUser = () => {
  return storage.getItem(TOKEN_KEYS.IMPERSONATED_USER);
};

/**
 * Get the currently impersonated user data
 * @returns {Object|null} Impersonated user data or null
 */
export const getImpersonatedUserData = () => {
  const userData = storage.getItem(TOKEN_KEYS.IMPERSONATED_USER_DATA);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Get the impersonation message
 * @returns {string|null} Impersonation message or null
 */
export const getImpersonationMessage = () => {
  return storage.getItem(TOKEN_KEYS.IMPERSONATION_MESSAGE);
};

/**
 * Store impersonation data
 * @param {Object} impersonationData - The impersonation response data
 */
export const storeImpersonationData = (impersonationData) => {
  const { impersonated_user, access, refresh, message } = impersonationData;
  
  // Store impersonation data
  storage.setItem(TOKEN_KEYS.IMPERSONATED_USER, impersonated_user.email);
  storage.setItem(TOKEN_KEYS.IMPERSONATED_USER_DATA, JSON.stringify(impersonated_user));
  storage.setItem(TOKEN_KEYS.IMPERSONATION_ACCESS, access);
  storage.setItem(TOKEN_KEYS.IMPERSONATION_REFRESH, refresh);
  storage.setItem(TOKEN_KEYS.IMPERSONATION_MESSAGE, message);
  
  // Update main token to impersonation token in both sessionStorage and localStorage
  // localStorage for cross-tab sync, sessionStorage for backward compatibility
  storage.setItem(TOKEN_KEYS.MAIN_TOKEN, access);
  try {
    localStorage.setItem(TOKEN_KEYS.MAIN_TOKEN, access);
    localStorage.setItem('user', JSON.stringify(impersonated_user));
  } catch (error) {
    console.warn('Failed to store token in localStorage:', error);
  }
  
};

/**
 * Store original super admin data before impersonation
 * @param {Object} superAdminData - The original super admin user data
 */
export const storeOriginalSuperAdminData = (superAdminData) => {
  
  // Always store original super admin tokens if we have access token
  if (superAdminData.access) {
    storage.setItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN, superAdminData.access);
    storage.setItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_REFRESH, superAdminData.refresh);
  }
  
  // Store original restaurant_id if not already stored
  const originalRestaurantId = localStorage.getItem('restaurant_id');
  if (originalRestaurantId && !storage.getItem(TOKEN_KEYS.ORIGINAL_RESTAURANT_ID)) {
    storage.setItem(TOKEN_KEYS.ORIGINAL_RESTAURANT_ID, originalRestaurantId);
  }
  
  // Store original super admin user data
  storage.setItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN, JSON.stringify(superAdminData));
};

/**
 * Clear all impersonation data
 */
export const clearImpersonationData = () => {
  
  // Clear only impersonation-related data
  storage.removeItem(TOKEN_KEYS.IMPERSONATED_USER);
  storage.removeItem(TOKEN_KEYS.IMPERSONATED_USER_DATA);
  storage.removeItem(TOKEN_KEYS.IMPERSONATION_ACCESS);
  storage.removeItem(TOKEN_KEYS.IMPERSONATION_REFRESH);
  storage.removeItem(TOKEN_KEYS.IMPERSONATION_MESSAGE);
  storage.removeItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN);
  
};

/**
 * Clear original super admin tokens (called after successful restoration)
 */
export const clearOriginalSuperAdminTokens = () => {
  
  storage.removeItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN);
  storage.removeItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_REFRESH);
  storage.removeItem(TOKEN_KEYS.ORIGINAL_RESTAURANT_ID);
  
};

/**
 * Restore super admin token and data
 * @param {Function} setUser - Function to update user state
 * @returns {Object} Restoration result
 */
export const restoreSuperAdminToken = (setUser) => {
  try {
    const originalSuperadmin = storage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN);
    const originalSuperadminToken = storage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN);
    const originalSuperadminRefresh = storage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_REFRESH);
    const originalRestaurantId = storage.getItem(TOKEN_KEYS.ORIGINAL_RESTAURANT_ID);
    
    if (!originalSuperadmin || !originalSuperadminToken) {
      return { success: false, error: 'No original super admin data found' };
    }
    
    // Restore the main token to super admin token in both sessionStorage and localStorage
    storage.setItem(TOKEN_KEYS.MAIN_TOKEN, originalSuperadminToken);
    try {
      localStorage.setItem(TOKEN_KEYS.MAIN_TOKEN, originalSuperadminToken);
      const originalUser = JSON.parse(originalSuperadmin);
      localStorage.setItem('user', JSON.stringify(originalUser));
    } catch (error) {
      console.warn('Failed to restore token in localStorage:', error);
    }
    
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
  const currentToken = storage.getItem(TOKEN_KEYS.MAIN_TOKEN) || localStorage.getItem(TOKEN_KEYS.MAIN_TOKEN);
  const originalSuperadminToken = storage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN);
  
  // If we're impersonating, use the original super admin token for this request
  if (originalSuperadminToken && isImpersonating()) {
    storage.setItem(TOKEN_KEYS.MAIN_TOKEN, originalSuperadminToken);
    try {
      localStorage.setItem(TOKEN_KEYS.MAIN_TOKEN, originalSuperadminToken);
    } catch (error) {
      console.warn('Failed to update token in localStorage:', error);
    }
  }
  
  try {
    const result = await apiCall();
    return result;
  } finally {
    // Always restore the current token after the request
    if (currentToken && currentToken !== originalSuperadminToken) {
      storage.setItem(TOKEN_KEYS.MAIN_TOKEN, currentToken);
      try {
        localStorage.setItem(TOKEN_KEYS.MAIN_TOKEN, currentToken);
      } catch (error) {
        console.warn('Failed to restore token in localStorage:', error);
      }
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
  } else if (storage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN)) {
    return 'superadmin';
  } else {
    return 'regular';
  }
};


/**
 * Force store original super admin token (for debugging)
 */
export const forceStoreOriginalToken = (superAdminData) => {
  storage.setItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN, superAdminData.access);
  storage.setItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_REFRESH, superAdminData.refresh);
  storage.setItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN, JSON.stringify(superAdminData));
};

/**
 * Execute an API call with super admin token (for impersonation operations)
 * @param {Function} apiCall - The API call function to execute
 * @returns {Promise} The API call result
 */
export const withSuperAdminTokenForImpersonation = async (apiCall) => {
  const currentToken = storage.getItem(TOKEN_KEYS.MAIN_TOKEN) || localStorage.getItem(TOKEN_KEYS.MAIN_TOKEN);
  const originalSuperadminToken = storage.getItem(TOKEN_KEYS.ORIGINAL_SUPERADMIN_TOKEN);
  
  // If we have an original super admin token and we're not already using it
  if (originalSuperadminToken && currentToken !== originalSuperadminToken) {
    storage.setItem(TOKEN_KEYS.MAIN_TOKEN, originalSuperadminToken);
    try {
      localStorage.setItem(TOKEN_KEYS.MAIN_TOKEN, originalSuperadminToken);
    } catch (error) {
      console.warn('Failed to update token in localStorage:', error);
    }
  }
  
  try {
    const result = await apiCall();
    return result;
  } finally {
    // Always restore the current token after the request
    if (currentToken && currentToken !== originalSuperadminToken) {
      storage.setItem(TOKEN_KEYS.MAIN_TOKEN, currentToken);
      try {
        localStorage.setItem(TOKEN_KEYS.MAIN_TOKEN, currentToken);
      } catch (error) {
        console.warn('Failed to restore token in localStorage:', error);
      }
    }
  }
};
