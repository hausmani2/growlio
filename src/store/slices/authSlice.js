import { apiPost } from '../../utils/axiosInterceptors';

// Simple token check - just undefined vs token
const hasToken = (token) => {
  return token && typeof token === 'string' && token.length > 0;
};

// Auth slice
const createAuthSlice = (set, get) => {
  const storedToken = sessionStorage.getItem('token');
  const hasStoredToken = hasToken(storedToken);
  
  
  return {
    name: 'auth',
    user: null,
    token: hasStoredToken ? storedToken : null,
    isAuthenticated: hasStoredToken,
    // Impersonation session state (avoid name collision with function isImpersonating())
    isImpersonatingSession: !!sessionStorage.getItem('impersonated_user'),
    impersonatorId: sessionStorage.getItem('original_superadmin') ? (JSON.parse(sessionStorage.getItem('original_superadmin'))?.id || null) : null,
    originalToken: sessionStorage.getItem('original_superadmin_token') || null,
    activeToken: hasStoredToken ? storedToken : null,
    loading: false,
    error: null,
    // Note: Onboarding status checking is now handled by onBoardingSlice
    
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
        
        // Store access token and user data in sessionStorage
        sessionStorage.setItem('token', access);
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        // Update store state
        console.log('🔍 AuthSlice - Login successful, setting user data:', {
          userEmail: userData?.email,
          isSuperuser: userData?.is_superuser,
          role: userData?.role,
          hasAccess: !!access
        });
        
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
          sessionStorage.setItem('token', access);
          sessionStorage.setItem('user', JSON.stringify(userData));
          
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
    
    // Initialize authentication state from sessionStorage
    initializeAuth: () => {
      const token = sessionStorage.getItem('token');
      
      if (hasToken(token)) {
        // Try to get user data from sessionStorage (stored during login)
        const storedUser = sessionStorage.getItem('user');
        let userData = null;
        
        if (storedUser) {
          try {
            userData = JSON.parse(storedUser);
          } catch (error) {
            console.warn('Failed to parse stored user data:', error);
          }
        }
        
        console.log('🔍 AuthSlice - InitializeAuth:', {
          hasToken: !!token,
          hasStoredUser: !!userData,
          userEmail: userData?.email,
          isSuperuser: userData?.is_superuser
        });
        
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
        // Clear invalid token
        sessionStorage.removeItem('token');
        set(() => ({ 
          token: null, 
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
  };
};

export default createAuthSlice;