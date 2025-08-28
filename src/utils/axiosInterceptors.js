import axios from 'axios';
import useStore from '../store/store';

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
    console.warn('⚠️ clearPersistedState function not found in store');
  }
  
  // Also clear any remaining localStorage items
  localStorage.removeItem('token');
  localStorage.removeItem('restaurant_id');
  localStorage.removeItem('growlio-store');
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Redirect to login page if not already there
  if (window.location.pathname !== '/login') {
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
    const token = localStorage.getItem('token');
    
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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
          // Unauthorized - clear token and all store data, then redirect to login
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
