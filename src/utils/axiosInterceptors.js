import axios from 'axios';
import { message } from 'antd';
import useStore from '../store/store';
import { clearImpersonationData } from './tokenManager';

// API Timeout Configuration
// You can set this via environment variable VITE_API_TIMEOUT (in milliseconds)
// Default is 30 seconds (30000ms)
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

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
  localStorage.removeItem('user'); // Also remove user from localStorage
  localStorage.removeItem('restaurant_id');
  localStorage.removeItem('growlio-store');
  
  // Clear impersonation data kept in sessionStorage
  try { clearImpersonationData(); } catch {}
  
  // Note: We intentionally keep original_superadmin_token and original_superadmin_refresh
  // These are only cleared when stopping impersonation, not on logout
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Dispatch custom event to notify other tabs/windows about logout
  window.dispatchEvent(new Event('auth-storage-change'));
  
  // Check if user was on admin route and redirect accordingly
  const currentPath = window.location.pathname;
  const isAdminPath = currentPath.startsWith('/admin');
  const isAdminLoginPath = currentPath === '/admin/login';
  
  // Redirect to appropriate login page
  // Don't redirect if already on a login page
  if (isAdminLoginPath || currentPath === '/login') {
    // Already on a login page, don't redirect
    return;
  }
  
  if (isAdminPath) {
    // User was on an admin route, redirect to admin login
    window.location.href = '/admin/login';
  } else {
    // User was on a regular route, redirect to regular login
    window.location.href = '/login';
  }
};

// Create an Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_ROOT_URL  , // Updated to match your API
  timeout: API_TIMEOUT, // Configurable timeout (default: 30 seconds)
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
      return config;
    }
    
    // Check if this is a user management API call that needs super admin token
    const isUserManagementCall = config.url && (
      config.url.includes('/authentication/users/') ||
      config.url.includes('/admin_access/dashboard/')
    );
    
    // Check if we're currently impersonating
    const isImpersonating = sessionStorage.getItem('impersonated_user');
    const originalSuperadminToken = sessionStorage.getItem('original_superadmin_token');
    // Check localStorage first (for cross-tab sync), then sessionStorage (for backward compatibility)
    const mainToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Debug logging
    
    let token;
    
    // If we're impersonating and this is a user management call, use super admin token
    if (isImpersonating && isUserManagementCall) {
      if (originalSuperadminToken) {
        token = originalSuperadminToken;
      } else {
        // If no original super admin token, try to use the main token as fallback
        token = mainToken;
      }
    } else {
      // Otherwise use the main token
      token = mainToken;
    }
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message === 'timeout of ' + API_TIMEOUT + 'ms exceeded' || error.message.includes('timeout')) {
      const timeoutSeconds = Math.round(API_TIMEOUT / 1000);
      message.error({
        content: `Request timed out after ${timeoutSeconds} seconds. Please check your connection and try again.`,
        duration: 5,
      });
      console.error(`⏱️ API Timeout: Request exceeded ${timeoutSeconds}s limit`, error.config?.url);
      return Promise.reject(error);
    }

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
          message.error('Access forbidden. You do not have permission to perform this action.');
          console.error('Access forbidden');
          break;
        case 404:
          // Not found
          message.error('Resource not found. Please check the URL and try again.');
          console.error('Resource not found');
          break;
        case 408:
          // Request Timeout
          message.error('Request timeout. The server took too long to respond. Please try again.');
          console.error('Request timeout');
          break;
        case 500:
          // Server error
          message.error('Server error occurred. Please try again later.');
          console.error('Server error occurred');
          break;
        case 502:
        case 503:
        case 504:
          // Server unavailable errors
          message.error('Server is temporarily unavailable. Please try again later.');
          console.error('Server unavailable:', error.response.status);
          break;
        default:
          // Other errors
          console.error('API Error:', error.response.status, error.response.data);
      }
    } else if (error.request) {
      // Network error - request was made but no response received
      message.error('Network error. Please check your internet connection and try again.');
      console.error('Network error - no response received', error.request);
    } else {
      // Other error (configuration error, etc.)
      console.error('Error:', error.message);
      if (error.message) {
        message.error(`An error occurred: ${error.message}`);
      }
    }
    
    return Promise.reject(error);
  }
);

// API utility functions
export const apiGet = (url, config = {}) => api.get(url, config);
export const apiPost = (url, data, config = {}) => api.post(url, data, config);
export const apiPut = (url, data, config = {}) => api.put(url, data, config);
export const apiDelete = (url, config = {}) => api.delete(url, config);

// Helper functions for custom timeout requests
// Use these when you need a different timeout for specific requests
export const apiGetWithTimeout = (url, timeout = API_TIMEOUT, config = {}) => {
  return api.get(url, { ...config, timeout });
};

export const apiPostWithTimeout = (url, data, timeout = API_TIMEOUT, config = {}) => {
  return api.post(url, data, { ...config, timeout });
};

export const apiPutWithTimeout = (url, data, timeout = API_TIMEOUT, config = {}) => {
  return api.put(url, data, { ...config, timeout });
};

export const apiDeleteWithTimeout = (url, timeout = API_TIMEOUT, config = {}) => {
  return api.delete(url, { ...config, timeout });
};

// Export the timeout constant for reference in other parts of the app
export { API_TIMEOUT };

// Optionally, export the raw instance for custom use
export default api;
