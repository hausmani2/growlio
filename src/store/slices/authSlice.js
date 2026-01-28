import { apiPost, apiGet } from '../../utils/axiosInterceptors';

// Simple token check - just undefined vs token
const hasToken = (token) => {
  return token && typeof token === 'string' && token.length > 0;
};

// Helper function to get token from localStorage (for cross-tab sync)
const getStoredToken = () => {
  // Check localStorage first (for cross-tab sync), then sessionStorage (for backward compatibility)
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Helper function to get user from storage
const getStoredUser = () => {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.warn('Failed to parse stored user data:', error);
      return null;
    }
  }
  return null;
};

// Auth slice
const createAuthSlice = (set, get) => {
  const storedToken = getStoredToken();
  const hasStoredToken = hasToken(storedToken);
  const storedUser = getStoredUser();
  
  
  return {
    name: 'auth',
    user: storedUser,
    token: hasStoredToken ? storedToken : null,
    isAuthenticated: hasStoredToken,
    // Impersonation session state (avoid name collision with function isImpersonating())
    isImpersonatingSession: !!sessionStorage.getItem('impersonated_user'),
    impersonatorId: sessionStorage.getItem('original_superadmin') ? (JSON.parse(sessionStorage.getItem('original_superadmin'))?.id || null) : null,
    originalToken: sessionStorage.getItem('original_superadmin_token') || null,
    activeToken: hasStoredToken ? storedToken : null,
    loading: false,
    error: null,
    // Cached restaurant onboarding data to avoid duplicate API calls
    restaurantOnboardingData: null,
    restaurantOnboardingDataTimestamp: null,
    // Note: Onboarding status checking is now handled by onBoardingSlice
    
    // Restaurant simulation status cache
    restaurantSimulationData: null,
    restaurantSimulationDataTimestamp: null,
    
    // Onboarding status checking is now handled by onBoardingSlice.checkOnboardingCompletion()
    
    login: async (credentials) => {
      set(() => ({ loading: true, error: null }));
      
      try {
        const response = await apiPost('/authentication/login/', credentials);
        // Handle both response structures: { access, ...userData } or { data: { access, ...userData } }
        const { access, ...userData } = response.data.data || response.data;
        
        // Check if access token exists
        if (!hasToken(access)) {
          console.error('No access token received from server');
          throw new Error('No authentication token received');
        }
        
        // Clear any existing data before setting new user data
        const currentState = get();
        if (currentState.clearPersistedState) {
          currentState.clearPersistedState();
        }
        
        // Store access token and user data in localStorage for cross-tab synchronization
        // Also store in sessionStorage for backward compatibility
        localStorage.setItem('token', access);
        localStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('token', access);
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        // Clear any old chat conversation ID on new login
        sessionStorage.removeItem('chat_conversation_id');
        
        // Clear simulation-related caches on new login to ensure fresh API calls
        sessionStorage.removeItem('isSimulationMode');
        sessionStorage.removeItem('simulationModeLastCheck');
        sessionStorage.removeItem('appSimulationMode');
        sessionStorage.removeItem('appSimulationModeLastCheck');
        sessionStorage.removeItem('headerSimulationMode');
        sessionStorage.removeItem('headerSimulationModeLastCheck');
        sessionStorage.removeItem('simulationCheckCongratulations');
        sessionStorage.removeItem('simulationCheckCongratulationsLastCheck');
        sessionStorage.removeItem('simulationCheckCongratulationsComplete');
        sessionStorage.removeItem('hasCheckedRestaurantSimulationGlobal');
        sessionStorage.removeItem('restaurantSimulationLastCheckTime');
        sessionStorage.removeItem('hasCheckedSimulationOnboardingGlobal');
        sessionStorage.removeItem('simulationOnboardingLastCheckTime');
        
        // Clear restaurant simulation data from store on login
        set(() => ({
          restaurantSimulationData: null,
          restaurantSimulationDataTimestamp: null
        }));
        
        // Clear simulation onboarding status from store on login
        if (currentState.clearSimulationState) {
          currentState.clearSimulationState();
        }
        
        // Dispatch custom event to notify other tabs/windows in same origin
        window.dispatchEvent(new Event('auth-storage-change'));
        
        // Update store state
        set(() => ({ 
          user: userData, 
          token: access,
          activeToken: access,
          isImpersonatingSession: false,
          impersonatorId: null,
          originalToken: null,
          isAuthenticated: true, 
          loading: false, 
          error: null 
        }));
        
        // CRITICAL: Call BOTH APIs immediately after login for ALL users
        // This ensures we have restaurant data from both sources before any redirects happen
        // We need to check both APIs to determine if user has restaurants in either one
        // ORDER: 1. simulation-onboarding API FIRST, 2. restaurants-onboarding API SECOND
        try {
          // STEP 1: Call simulation-onboarding API FIRST (GET /simulation/simulation-onboarding/)
          // This is needed to check if user has simulation restaurants
          // getSimulationOnboardingStatus is from simulationSlice, accessible via get()
          try {
            const simulationOnboardingResult = await get().getSimulationOnboardingStatus();
            // Result is cached in store, no need to do anything with it here
            console.log('✅ [authSlice] Simulation onboarding API called successfully');
          } catch (simError) {
            // If simulation API fails (e.g., user doesn't have access), continue
            // This is expected for non-simulation users, so we don't log it as an error
            console.log('ℹ️ [authSlice] Simulation onboarding check skipped (user may not have simulation access)');
          }
          
          // STEP 2: Call restaurants-onboarding API SECOND (GET /restaurant_v2/restaurants-onboarding/)
          const restaurantOnboardingResult = await get().getRestaurantOnboarding(true);
          console.log('✅ [authSlice] Restaurant onboarding API called successfully');
        } catch (onboardingError) {
          console.error('❌ [authSlice] Failed to check onboarding status after login:', onboardingError);
          // Don't fail login if onboarding check fails
        }
        
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Login error response:', error.response?.data);
        
        // Handle different error response formats
        let errorMessage = 'Login failed. Please check your credentials.';
        
        if (error.response?.data) {
          const errorData = error.response.data;
          
          // Handle non_field_errors format
          if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
            errorMessage = errorData.non_field_errors[0];
          }
          // Handle message format
          else if (errorData.message) {
            errorMessage = errorData.message;
          }
          // Handle error format
          else if (errorData.error) {
            errorMessage = errorData.error;
          }
          // Handle field-specific errors
          else if (typeof errorData === 'object') {
            const fieldErrors = Object.values(errorData).flat();
            if (fieldErrors.length > 0) {
              errorMessage = Array.isArray(fieldErrors[0]) ? fieldErrors[0][0] : fieldErrors[0];
            }
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        set(() => ({ 
          loading: false, 
          error: errorMessage,
          isAuthenticated: false 
        }));
        
        throw new Error(errorMessage);
      }
    },
    
    // Logout function - clears all state and redirects to login
    logout: () => {
      // Clear restaurant simulation cache on logout
      sessionStorage.removeItem('hasCheckedRestaurantSimulationGlobal');
      sessionStorage.removeItem('restaurantSimulationLastCheckTime');
      
      // Use the store's clearPersistedState function to completely reset all state
      const currentState = get();
      if (currentState.clearPersistedState) {
        currentState.clearPersistedState();
      }
      
      // Also call individual clear functions as backup
      if (currentState.clearOnboarding) {
        currentState.clearOnboarding();
      }
      
      if (currentState.clearDashboard) {
        currentState.clearDashboard();
      }
      
      if (currentState.clearDashboardSummary) {
        currentState.clearDashboardSummary();
      }
      
      // Clear all localStorage items related to the app
      const keysToRemove = [
        'token',
        'user', // Also remove user from localStorage
        'restaurant_id',
        'growlio-store' // This is the Zustand persist key
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear sessionStorage as well
      sessionStorage.clear();
      
      // Clear onboarding-specific session storage
      sessionStorage.removeItem('onboarding_completion_check_time');
      sessionStorage.removeItem('hasCheckedRestaurantOnboardingGlobal');
      sessionStorage.removeItem('restaurantOnboardingLastCheckTime');
      
      // Clear chat conversation ID on logout
      sessionStorage.removeItem('chat_conversation_id');
      
      // Dispatch custom event to notify other tabs/windows about logout
      window.dispatchEvent(new Event('auth-storage-change'));
      
      // Clear all auth state
      set(() => ({ 
        user: null, 
        token: null, 
        activeToken: null,
        isImpersonatingSession: false,
        impersonatorId: null,
        originalToken: null,
        isAuthenticated: false, 
        error: null, 
        loading: false
      }));
      
      // Force redirect to login page using window.location to ensure full page reload
      // This prevents any routing state issues and ensures clean logout
      const currentPath = window.location.pathname;
      const isAdminPath = currentPath.startsWith('/admin');
      
      if (isAdminPath) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
      
    },
    
    register: async (formData) => {
      set(() => ({ loading: true, error: null }));
      
      try {
        const response = await apiPost('/authentication/register/', formData);
        
        // Check if registration response includes a token
        // The response structure is: { status, message, data: { access, refresh, ...userData } }
        const { access, refresh, ...userData } = response.data.data || response.data;
        
        if (hasToken(access)) {
          // Registration successful with token - user is automatically authenticated
          // Store in localStorage for cross-tab sync and sessionStorage for backward compatibility
          localStorage.setItem('token', access);
          localStorage.setItem('user', JSON.stringify(userData));
          sessionStorage.setItem('token', access);
          sessionStorage.setItem('user', JSON.stringify(userData));
          
          // Dispatch custom event to notify other tabs/windows in same origin
          window.dispatchEvent(new Event('auth-storage-change'));
          
          set(() => ({ 
            user: userData, 
            token: access, 
            activeToken: access,
            isImpersonatingSession: false,
            impersonatorId: null,
            originalToken: null,
            isAuthenticated: true, 
            loading: false, 
            error: null 
          }));
          
          return { success: true, data: response.data, needsLogin: false, token: access };
        } else {
          // Registration successful but no token - user needs to login
          set(() => ({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            loading: false, 
            error: null 
          }));
          
          return { success: true, data: response.data, needsLogin: true };
        }
      } catch (error) {
        console.error('Registration error response:', error.response?.data);
        
        // Handle different error response formats
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.response?.data) {
          const errorData = error.response.data;
          
          // Handle non_field_errors format
          if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
            errorMessage = errorData.non_field_errors[0];
          }
          // Handle message format
          else if (errorData.message) {
            errorMessage = errorData.message;
          }
          // Handle error format
          else if (errorData.error) {
            errorMessage = errorData.error;
          }
          // Handle field-specific errors
          else if (typeof errorData === 'object') {
            const fieldErrors = Object.values(errorData).flat();
            if (fieldErrors.length > 0) {
              errorMessage = Array.isArray(fieldErrors[0]) ? fieldErrors[0][0] : fieldErrors[0];
            }
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        set(() => ({ 
          loading: false, 
          error: errorMessage,
          isAuthenticated: false 
        }));
        
        throw new Error(errorMessage);
      }
    },
    
    clearError: () => set(() => ({ error: null })),
    
    // Clear all application state (for logout or reset)
    // This function clears:
    // - All localStorage items (token, restaurant_id, growlio-store)
    // - All sessionStorage
    // - All auth state (user, token, isAuthenticated, etc.)
    // - All onboarding state (completeOnboardingData, tempFormData, etc.)
    // - All dashboard state (dashboardData, loading, error, etc.)
    clearAllState: () => {
      
      // Use the store's clearPersistedState function to completely reset all state
      const currentState = get();
      if (currentState.clearPersistedState) {
        currentState.clearPersistedState();
      }
      
      // Also call individual clear functions as backup
      if (currentState.clearOnboarding) {
        currentState.clearOnboarding();
      }
      
      if (currentState.clearDashboard) {
        currentState.clearDashboard();
      }
      
      if (currentState.clearDashboardSummary) {
        currentState.clearDashboardSummary();
      }
      
      // Clear all auth state
      set(() => ({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        error: null, 
        loading: false
      }));
      
    },
    
    // Initialize authentication state from localStorage (for cross-tab sync) or sessionStorage
    initializeAuth: () => {
      const token = getStoredToken();
      const userData = getStoredUser();
      
      if (hasToken(token)) {
        set(() => ({ 
          user: userData,
          token,
          activeToken: token,
          isImpersonatingSession: !!sessionStorage.getItem('impersonated_user'),
          impersonatorId: sessionStorage.getItem('original_superadmin') ? (JSON.parse(sessionStorage.getItem('original_superadmin'))?.id || null) : null,
          originalToken: sessionStorage.getItem('original_superadmin_token') || null,
          isAuthenticated: true 
        }));
        
        // Also check for restaurant ID in localStorage
        const restaurantId = localStorage.getItem('restaurant_id');
        if (restaurantId) {
          set(() => ({ restaurantId }));
        }
      } else {
        // Clear invalid tokens from both storages
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        set(() => ({ 
          user: null,
          token: null, 
          isAuthenticated: false 
        }));
      }
    },
    
    // Sync authentication state from storage events (for cross-tab synchronization)
    syncAuthFromStorage: () => {
      const token = getStoredToken();
      const userData = getStoredUser();
      
      if (hasToken(token)) {
        set(() => ({ 
          user: userData,
          token,
          activeToken: token,
          isImpersonatingSession: !!sessionStorage.getItem('impersonated_user'),
          impersonatorId: sessionStorage.getItem('original_superadmin') ? (JSON.parse(sessionStorage.getItem('original_superadmin'))?.id || null) : null,
          originalToken: sessionStorage.getItem('original_superadmin_token') || null,
          isAuthenticated: true 
        }));
      } else {
        // Token was removed in another tab - logout this tab
        set(() => ({ 
          user: null,
          token: null,
          activeToken: null,
          isAuthenticated: false 
        }));
      }
    },
    
    // Ensure restaurant ID is available (fetch from API if needed)
    ensureRestaurantId: async () => {
      const state = get();
      let restaurantId = state.restaurantId || localStorage.getItem('restaurant_id');
      
      if (!restaurantId) {
        // If no restaurant ID found, this means the user is new and hasn't completed onboarding
        // Don't make API calls - just return null and let the onboarding flow handle it
        
        return null;
      }
      
      return restaurantId;
    },

    // Get restaurant simulation status
    getRestaurantSimulation: async (forceRefresh = false) => {
      const currentState = get();
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
      
      // Check if we have cached data that's still fresh
      if (!forceRefresh && currentState.restaurantSimulationData && currentState.restaurantSimulationDataTimestamp) {
        const timeSinceCache = now - currentState.restaurantSimulationDataTimestamp;
        if (timeSinceCache < CACHE_DURATION) {
          return { 
            success: true, 
            data: currentState.restaurantSimulationData
          };
        }
      }
      
      // GLOBAL GUARD: Check sessionStorage to prevent multiple concurrent calls
      const hasCheckedGlobally = sessionStorage.getItem('hasCheckedRestaurantSimulationGlobal');
      const lastCheckTime = sessionStorage.getItem('restaurantSimulationLastCheckTime');
      
      // If we've checked in the last 2 seconds, return cached data if available
      if (hasCheckedGlobally === 'true' && lastCheckTime) {
        const timeSinceCheck = now - parseInt(lastCheckTime);
        if (timeSinceCheck < 2000) {
          // Too soon to check again - return cached data if available
          if (currentState.restaurantSimulationData) {
            return { 
              success: true, 
              data: currentState.restaurantSimulationData
            };
          }
          return { success: false, error: 'Request throttled - please wait' };
        }
      }
      
      // Mark that we're checking globally
      sessionStorage.setItem('hasCheckedRestaurantSimulationGlobal', 'true');
      sessionStorage.setItem('restaurantSimulationLastCheckTime', now.toString());
      
      set(() => ({ loading: true, error: null }));
      
      try {
        const response = await apiGet('/authentication/user/restaurant-simulation/');
        
        // Cache the result
        set(() => ({ 
          loading: false, 
          error: null,
          restaurantSimulationData: response.data,
          restaurantSimulationDataTimestamp: now
        }));
        
        return { success: true, data: response.data };
      } catch (error) {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Failed to get restaurant simulation status';
        set(() => ({ loading: false, error: errorMessage }));
        
        // Clear global check flag on error
        sessionStorage.removeItem('hasCheckedRestaurantSimulationGlobal');
        sessionStorage.removeItem('restaurantSimulationLastCheckTime');
        
        return { success: false, error: errorMessage };
      }
    },

    // Update restaurant simulation status
    updateRestaurantSimulation: async (payload) => {
      set(() => ({ loading: true, error: null }));
      
      try {
        const response = await apiPost('/authentication/user/restaurant-simulation/', payload);
        
        // Check if the response status is 200 (success)
        if (response.status === 200 || response.status === 201) {
          set(() => ({ loading: false, error: null }));
          
          // Automatically call restaurants-onboarding API after successful POST
          try {
            // Clear sessionStorage flags to ensure the call goes through
            sessionStorage.removeItem('hasCheckedRestaurantOnboardingGlobal');
            sessionStorage.removeItem('restaurantOnboardingLastCheckTime');
            
            // Use forceRefresh to bypass cache and get fresh data
            const onboardingResult = await get().getRestaurantOnboarding(true);
            if (onboardingResult.success) {
            } else {
              console.warn("⚠️ [authSlice] Failed to fetch restaurant onboarding data after simulation update:", onboardingResult.error);
            }
          } catch (onboardingError) {
            console.error("❌ [authSlice] Error fetching restaurant onboarding after simulation update:", onboardingError);
            // Don't fail the main request if onboarding fetch fails
          }
          
          return { success: true, data: response.data };
        } else {
          const errorMessage = `API request failed with status ${response.status}`;
          set(() => ({ loading: false, error: errorMessage }));
          return { success: false, error: errorMessage };
        }
      } catch (error) {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Failed to update restaurant simulation status';
        set(() => ({ loading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },

    // Get restaurant ID from restaurant-onboarding endpoint
    getRestaurantOnboarding: async (forceRefresh = false) => {
      // CRITICAL: Check if user is in simulation mode - if true, don't call non-simulation API
      // Use cached data from store to avoid unnecessary API calls
      const authState = get();
      let simulationCheck = null;
      
      if (authState.restaurantSimulationData) {
        const now = Date.now();
        const CACHE_DURATION = 5 * 60 * 1000;
        const timeSinceCache = authState.restaurantSimulationDataTimestamp 
          ? now - authState.restaurantSimulationDataTimestamp 
          : Infinity;
        
        if (timeSinceCache < CACHE_DURATION) {
          simulationCheck = {
            success: true,
            data: authState.restaurantSimulationData
          };
        }
      }
      
      if (!simulationCheck) {
        try {
          simulationCheck = await get().getRestaurantSimulation();
        } catch (error) {
          console.error('❌ [authSlice] Error checking simulation status:', error);
          // Continue with API call if check fails
        }
      }
      
      if (simulationCheck?.success && simulationCheck?.data?.restaurant_simulation === true) {
        // User is in simulation mode, don't call non-simulation API
        set(() => ({ loading: false, error: null }));
        return { 
          success: false, 
          error: 'User is in simulation mode. Non-simulation APIs are not available.',
          data: null
        };
      }
      
      const now = Date.now();
      const CACHE_DURATION = 5000; // 5 seconds cache
      
      // Get current state for cache checking
      const currentState = get();
      
      // Check if we have cached data that's still fresh
      if (!forceRefresh && currentState.restaurantOnboardingData && currentState.restaurantOnboardingDataTimestamp) {
        const timeSinceCache = now - currentState.restaurantOnboardingDataTimestamp;
        if (timeSinceCache < CACHE_DURATION) {
          return { 
            success: true, 
            data: currentState.restaurantOnboardingData,
            restaurantId: currentState.restaurantOnboardingData?.restaurant_id || currentState.restaurantOnboardingData?.restaurants?.[0]?.restaurant_id || null
          };
        }
      }
      
      // GLOBAL GUARD: Check sessionStorage FIRST to prevent infinite calls
      const hasCheckedGlobally = sessionStorage.getItem('hasCheckedRestaurantOnboardingGlobal');
      const lastCheckTime = sessionStorage.getItem('restaurantOnboardingLastCheckTime');
      
      // If we've checked in the last 2 seconds, return cached data if available
      if (hasCheckedGlobally === 'true' && lastCheckTime) {
        const timeSinceCheck = now - parseInt(lastCheckTime);
        if (timeSinceCheck < 2000) {
          // Too soon to check again - return cached data if available
          if (currentState.restaurantOnboardingData) {
            return { 
              success: true, 
              data: currentState.restaurantOnboardingData,
              restaurantId: currentState.restaurantOnboardingData?.restaurant_id || currentState.restaurantOnboardingData?.restaurants?.[0]?.restaurant_id || null
            };
          }
          return { success: false, error: 'Request throttled - please wait' };
        }
      }
      
      // Check if we're already loading to prevent concurrent calls
      if (currentState.loading) {
        // If already loading, return cached data if available
        if (currentState.restaurantOnboardingData) {
          return { 
            success: true, 
            data: currentState.restaurantOnboardingData,
            restaurantId: currentState.restaurantOnboardingData?.restaurant_id || currentState.restaurantOnboardingData?.restaurants?.[0]?.restaurant_id || null
          };
        }
        return { success: false, error: 'Request already in progress' };
      }
      
      // Mark as checking globally IMMEDIATELY
      sessionStorage.setItem('hasCheckedRestaurantOnboardingGlobal', 'true');
      sessionStorage.setItem('restaurantOnboardingLastCheckTime', now.toString());
      
      set(() => ({ loading: true, error: null }));
      
      try {
        const response = await apiGet('/restaurant_v2/restaurants-onboarding/');
        
        // IMPORTANT: The API response structure might be response.data or response.data.data
        // Let's handle both cases - check if response.data has a 'data' property with restaurants
        let restaurantData = response.data;
        
        // If response.data.data exists and has restaurants, use that
        if (response.data?.data && (response.data.data.restaurants || Array.isArray(response.data.data))) {
          restaurantData = response.data.data;
        } 
        // If response.data has restaurants directly, use it
        else if (response.data?.restaurants) {
          restaurantData = response.data;
        }
        // Otherwise, try response.data.data as fallback
        else if (response.data?.data) {
          restaurantData = response.data.data;
        }
        
        // IMPORTANT: Even if restaurants array is empty, we still need to return the data
        // This allows components to know that the API was called and user has no restaurants
        
        // Store the data in the store for caching
        set(() => ({ 
          loading: false, 
          error: null,
          restaurantOnboardingData: restaurantData,
          restaurantOnboardingDataTimestamp: now
        }));
        
        // Extract restaurant_id from response
        const restaurantId = restaurantData?.restaurant_id || restaurantData?.restaurants?.[0]?.restaurant_id || null;
        
        // Store restaurant_id in localStorage and store if found
        if (restaurantId) {
          localStorage.setItem('restaurant_id', restaurantId.toString());
          set(() => ({ restaurantId: restaurantId.toString() }));
        }
        
        return { success: true, data: restaurantData, restaurantId };
      } catch (error) {
        console.error('❌ [authSlice] API call failed:', error);
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Failed to get restaurant onboarding';
        set(() => ({ loading: false, error: errorMessage }));
        // Don't clear the global flag on error - we still checked
        return { success: false, error: errorMessage };
      }
    },
  };
};

export default createAuthSlice;