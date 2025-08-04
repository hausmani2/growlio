import { apiPost, apiGet } from '../../utils/axiosInterceptors';

// Simple token check - just undefined vs token
const hasToken = (token) => {
  return token && typeof token === 'string' && token.length > 0;
};

// Auth slice
const createAuthSlice = (set, get) => {
  const storedToken = localStorage.getItem('token');
  const hasStoredToken = hasToken(storedToken);
  
  
  return {
    name: 'auth',
    user: null,
    token: hasStoredToken ? storedToken : null,
    isAuthenticated: hasStoredToken,
    loading: false,
    error: null,
    onboardingStatus: null, // 'loading', 'complete', 'incomplete', null
    onboardingLoading: false, // Loading state for onboarding checks
    
    // Check onboarding status using /restaurant/restaurants-onboarding/ API
    checkOnboardingStatus: async () => {
      // Clear any cached onboarding status first
      set(() => ({ onboardingStatus: null, onboardingLoading: true }));
      
      try {
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        const apiPromise = apiGet('/restaurant/restaurants-onboarding/');
        const response = await Promise.race([apiPromise, timeoutPromise]);
        const onboardingData = response.data;
        
        // Safely get restaurant_id if available
        let restaurantId = null;
        if (onboardingData && onboardingData.restaurants && onboardingData.restaurants.length > 0) {
          restaurantId = onboardingData.restaurants[0].restaurant_id;
          set(() => ({ restaurantId }));
        }
        
        // Check if user has no restaurants (new user)
        if (onboardingData && onboardingData.message === "No restaurants found for this user." && 
            (!onboardingData.restaurants || onboardingData.restaurants.length === 0)) {
          set(() => ({ onboardingStatus: 'incomplete', onboardingLoading: false }));
          
          return {
            success: true,
            onboarding_complete: false,
            isNewUser: true,
            user: onboardingData.user
          };
        }
        
        // Check if user has restaurants
        if (onboardingData && onboardingData.restaurants && onboardingData.restaurants.length > 0) {
          // Check if any restaurant has onboarding_complete: true
          const hasCompletedOnboarding = onboardingData.restaurants.some(restaurant => 
            restaurant.onboarding_complete === true
          );
          
          if (hasCompletedOnboarding) {
            set(() => ({ onboardingStatus: 'complete', onboardingLoading: false }));
            
            return {
              success: true,
              onboarding_complete: true,
              isNewUser: false,
              user: onboardingData.user,
              restaurants: onboardingData.restaurants
            };
          } else {
            set(() => ({ onboardingStatus: 'incomplete', onboardingLoading: false }));
            
            return {
              success: true,
              onboarding_complete: false,
              isNewUser: false,
              user: onboardingData.user,
              restaurants: onboardingData.restaurants
            };
          }
        }
        
        // Fallback case
        set(() => ({ onboardingStatus: 'incomplete', onboardingLoading: false }));
        
        return {
          success: true,
          onboarding_complete: false,
          isNewUser: true,
          user: onboardingData?.user || null
        };
      } catch (error) {
        console.error('Onboarding status check failed:', error);
        
        let errorMessage = 'Failed to check onboarding status';
        
        if (error.message === 'Request timeout') {
          errorMessage = 'Request timed out. Please check your connection.';
        } else if (error.response?.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // If API fails, assume onboarding is incomplete
        set(() => ({ onboardingStatus: 'incomplete', onboardingLoading: false }));
        
        return {
          success: false,
          onboarding_complete: false,
          error: errorMessage
        };
      }
    },
    
    login: async (credentials) => {
      set(() => ({ loading: true, error: null }));
      
      try {
        const response = await apiPost('/authentication/login/', credentials);
        const { access, ...userData } = response.data;
        
        // Check if access token exists
        if (!hasToken(access)) {
          console.error('No access token received from server');
          throw new Error('No authentication token received');
        }
        
        // Store access token in localStorage
        localStorage.setItem('token', access);
        
        // Update store state
        set(() => ({ 
          user: userData, 
          token: access, 
          isAuthenticated: true, 
          loading: false, 
          error: null 
        }));
        
        // Check onboarding status after successful login
        try {
          // We'll check onboarding status separately after login
          // This will be handled by the component that calls login
        } catch (onboardingError) {
          console.error('Failed to check onboarding status after login:', onboardingError);
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
      
      // Clear all localStorage items related to the app
      const keysToRemove = [
        'token',
        'restaurant_id',
        'growlio-store' // This is the Zustand persist key
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear sessionStorage as well
      sessionStorage.clear(); 
      
      // Reset onboarding state first
      const currentState = get();
      if (currentState.resetOnboarding) {
        currentState.resetOnboarding();
      }
      
      // Clear dashboard state
      if (currentState.resetDashboard) {
        currentState.resetDashboard();
      }
      
      // Clear all auth state
      set(() => ({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        error: null, 
        onboardingStatus: null,
        loading: false,
        onboardingLoading: false
      }));
      
      // Use the store's clearPersistedState function to completely reset all state
      if (currentState.clearPersistedState) {
        currentState.clearPersistedState();
      }
      
    },
    
    register: async (formData) => {
      set(() => ({ loading: true, error: null }));
      
      try {
        const response = await apiPost('/authentication/register/', formData);
        
        // Registration successful but no token - user needs to login
        set(() => ({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          loading: false, 
          error: null 
        }));
        
        return { success: true, data: response.data, needsLogin: true };
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
    
    // Clear onboarding status cache and force fresh check
    clearOnboardingStatus: () => {
      set(() => ({ 
        onboardingStatus: null, 
        onboardingLoading: false 
      }));
    },
    
    // Force refresh onboarding status
    refreshOnboardingStatus: async () => {
      set(() => ({ onboardingStatus: null, onboardingLoading: true }));
      return await get().checkOnboardingStatus();
    },
    
    // Clear all application state (for logout or reset)
    // This function clears:
    // - All localStorage items (token, restaurant_id, growlio-store)
    // - All sessionStorage
    // - All auth state (user, token, isAuthenticated, etc.)
    // - All onboarding state (completeOnboardingData, tempFormData, etc.)
    // - All dashboard state (dashboardData, loading, error, etc.)
    clearAllState: () => {
      
      // Reset onboarding state first
      const currentState = get();
      if (currentState.resetOnboarding) {
        currentState.resetOnboarding();
      }
      
      // Clear dashboard state
      if (currentState.resetDashboard) {
        currentState.resetDashboard();
      }
      
      // Clear all auth state
      set(() => ({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        error: null, 
        onboardingStatus: null,
        loading: false,
        onboardingLoading: false
      }));
      
      // Use the store's clearPersistedState function to completely reset all state
      if (currentState.clearPersistedState) {
        currentState.clearPersistedState();
      }
      
    },
    
    // Initialize authentication state from localStorage
    initializeAuth: () => {
      const token = localStorage.getItem('token');
      
      if (hasToken(token)) {
        set(() => ({ 
          token, 
          isAuthenticated: true 
        }));
      } else {
        // Clear invalid token
        localStorage.removeItem('token');
        set(() => ({ 
          token: null, 
          isAuthenticated: false 
        }));
      }
    },
  };
};

export default createAuthSlice;