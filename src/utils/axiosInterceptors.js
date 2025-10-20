import axios from 'axios';
import useStore from '../store/store';
import { clearImpersonationData } from './tokenManager';

/**
 * Utility function to clear all store data and redirect to login
 * 
 * This function is called when:
 * 1. A 401 Unauthorized error occurs (token expired)
 * 2. Any API call fails with authentication error
 * 
 * It ensures that:
 * - All Redux store data is cleared (prevents showing previous user's data)
 * - All localStorage items are removed
 * - All sessionStorage is cleared
 * - User is redirected to login page
 * 
 * This prevents the issue where a new user would see the previous user's data
 * when creating an account in the same browser.
 */
export const clearStoreAndRedirectToLogin = () => {
  
  // Get the store instance and clear all persisted state
  const store = useStore.getState();
  if (store.clearPersistedState) {
    store.clearPersistedState();
  } else {
  }
  
  // Also clear any remaining localStorage items
  localStorage.removeItem('token');
  localStorage.removeItem('restaurant_id');
  localStorage.removeItem('growlio-store');
  
  // Clear impersonation data kept in sessionStorage
  try { clearImpersonationData(); } catch {}
  
  // Note: We intentionally keep original_superadmin_token and original_superadmin_refresh
  // These are only cleared when stopping impersonation, not on logout
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Check if user was on admin route and redirect accordingly
  const currentPath = window.location.pathname;
  const isAdminPath = currentPath.startsWith('/admin');
  
  // Redirect to appropriate login page
  if (isAdminPath && currentPath !== '/superadmin-login') {
    window.location.href = '/superadmin-login';
  } else if (currentPath !== '/login') {
    window.location.href = '/login';
  }
};

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_ROOT_URL  , // Updated to match your API
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if available
api.interceptors.request.use(
  (config) => {
    // Skip token attachment for authentication endpoints
    const isAuthEndpoint = config.url && (
      config.url.includes('/authentication/login/') ||
      config.url.includes('/authentication/superadmin-login/') ||
      config.url.includes('/authentication/register/') ||
      config.url.includes('/authentication/forgot-password/') ||
      config.url.includes('/authentication/reset-password/')
    );
    
    if (isAuthEndpoint) {
      console.log('🔐 Skipping token attachment for auth endpoint:', config.url);
      return config;
    }
    
    // Check if this is a user management API call that needs super admin token
    const isUserManagementCall = config.url && (
      config.url.includes('/authentication/users/') ||
      config.url.includes('/admin_access/dashboard/') ||
      config.url.includes('/superadmin/analytics/')
    );
    
    // Check if we're currently impersonating
    const isImpersonating = sessionStorage.getItem('impersonated_user');
    const originalSuperadminToken = sessionStorage.getItem('original_superadmin_token');
    const mainToken = sessionStorage.getItem('token');
    
    // Debug logging
    console.log('🔍 API Request Debug:', {
      url: config.url,
      isUserManagementCall,
      isImpersonating,
      hasOriginalSuperadminToken: !!originalSuperadminToken,
      hasMainToken: !!mainToken,
      originalSuperadminTokenPreview: originalSuperadminToken ? originalSuperadminToken.substring(0, 20) + '...' : 'null',
      mainTokenPreview: mainToken ? mainToken.substring(0, 20) + '...' : 'null'
    });
    
    let token;
    
    // If we're impersonating and this is a user management call, use super admin token
    if (isImpersonating && isUserManagementCall) {
      if (originalSuperadminToken) {
        token = originalSuperadminToken;
        console.log('✅ Using Super Admin Token for:', config.url);
      } else {
        // If no original super admin token, try to use the main token as fallback
        token = mainToken;
        console.log('⚠️ No original super admin token, using main token as fallback for:', config.url);
      }
    } else {
      // Otherwise use the main token
      token = mainToken;
      console.log('✅ Using Main Token for:', config.url);
    }
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Token attached:', token.substring(0, 20) + '...');
    } else {
      console.error('❌ No token available for request:', config.url);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific status codes
      switch (error.response.status) {
        case 401:
          // Unauthorized: if impersonating, auto-restore original session
          try {
            const hasImpersonation = !!sessionStorage.getItem('impersonation_access_token');
            const originalToken = sessionStorage.getItem('original_superadmin_token');
            if (hasImpersonation && originalToken) {
              // Clear impersonation and restore original
              clearImpersonationData();
              sessionStorage.setItem('token', originalToken);
              // Soft reload to refresh app state
              window.location.reload();
              break;
            }
          } catch {}
          // Otherwise, clear and redirect to login
          clearStoreAndRedirectToLogin();
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 500:
          // Server error
          console.error('Server error occurred');
          break;
        default:
          // Other errors
          console.error('API Error:', error.response.status, error.response.data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - no response received');
    } else {
      // Other error
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API utility functions
export const apiGet = (url, config = {}) => api.get(url, config);
export const apiPost = (url, data, config = {}) => api.post(url, data, config);
export const apiPut = (url, data, config = {}) => api.put(url, data, config);
export const apiDelete = (url, config = {}) => api.delete(url, config);

// Optionally, export the raw instance for custom use
export default api;
