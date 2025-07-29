import { apiPost, apiGet } from '../../utils/axiosInterceptors';

// Simple token check - just undefined vs token
const hasToken = (token) => {
  return token && typeof token === 'string' && token.length > 0;
};

// Auth slice
const createAuthSlice = (set, get) => {
  const storedToken = localStorage.getItem('token');
  const hasStoredToken = hasToken(storedToken);
  
  console.log('Creating auth slice with stored token:', {
    storedToken: storedToken ? 'TOKEN_EXISTS' : 'UNDEFINED',
    hasStoredToken,
    tokenType: typeof storedToken
  });
  
  return {
    name: 'auth',
    user: null,
    token: hasStoredToken ? storedToken : null,
    isAuthenticated: hasStoredToken,
    loading: false,
    error: null,
    onboardingStatus: null, // 'loading', 'complete', 'incomplete', null
    
    // Check onboarding status using /restaurant/restaurants-onboarding/ API
    checkOnboardingStatus: async () => {
      set(() => ({ onboardingStatus: 'loading' }));
      
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        const apiPromise = apiGet('/restaurant/restaurants-onboarding/');
        const response = await Promise.race([apiPromise, timeoutPromise]);
        const onboardingData = response.data;
        const restaurantId = onboardingData.restaurants[0].restaurant_id;
        set(() => ({ restaurantId }));
        
        console.log('Onboarding Status Check - Raw data:', onboardingData);
        
        // Check if user has no restaurants (new user)
        if (onboardingData && onboardingData.message === "No restaurants found for this user." && 
            (!onboardingData.restaurants || onboardingData.restaurants.length === 0)) {
          console.log('✅ New user with no restaurants - onboarding incomplete');
          set(() => ({ onboardingStatus: 'incomplete' }));
          
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
            console.log('✅ User has restaurants with completed onboarding - onboarding complete');
            set(() => ({ onboardingStatus: 'complete' }));
            
            return {
              success: true,
              onboarding_complete: true,
              isNewUser: false,
              user: onboardingData.user,
              restaurants: onboardingData.restaurants
            };
          } else {
            console.log('⚠️ User has restaurants but onboarding is not complete - onboarding incomplete');
            set(() => ({ onboardingStatus: 'incomplete' }));
            
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
        console.log('⚠️ Unexpected response format - assuming onboarding incomplete');
        set(() => ({ onboardingStatus: 'incomplete' }));
        
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
        set(() => ({ onboardingStatus: 'incomplete' }));
        
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
        
        console.log('Login Response:', { 
          userData, 
          access: access ? 'TOKEN_EXISTS' : 'UNDEFINED', 
          tokenType: typeof access 
        });
        
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
        
        console.log('Login successful - Token stored and state updated');
        
        // Check onboarding status after successful login
        try {
          // We'll check onboarding status separately after login
          // This will be handled by the component that calls login
          console.log('Login successful - onboarding status will be checked by component');
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
      // Use the comprehensive clearAllState function
      const state = get();
      if (state.clearAllState) {
        state.clearAllState();
      } else {
        // Fallback if clearAllState is not available
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
        
        // Clear all auth state
        set(() => ({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          error: null, 
          onboardingStatus: null,
          loading: false
        }));
        
        // Reset onboarding state
        if (state.resetOnboarding) {
          state.resetOnboarding();
        }
      }
      
      console.log('🚪 Logout completed - all state and localStorage cleared');
    },
    
    register: async (formData) => {
      set(() => ({ loading: true, error: null }));
      
      try {
        const response = await apiPost('/authentication/register/', formData);
        const userData = response.data;
        
        console.log('Register Response:', { 
          userData, 
          hasAccessToken: false,
          message: 'User created successfully, redirecting to login'
        });
        
        // Registration successful but no token - user needs to login
        set(() => ({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          loading: false, 
          error: null 
        }));
        
        console.log('Registration successful - User created, redirecting to login');
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
    
    // Clear all application state (for logout or reset)
    // This function clears:
    // - All localStorage items (token, restaurant_id, growlio-store)
    // - All sessionStorage
    // - All auth state (user, token, isAuthenticated, etc.)
    // - All onboarding state (completeOnboardingData, tempFormData, etc.)
    clearAllState: () => {
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
      
      // Clear all auth state
      set(() => ({ 
        user: null, 
        token: null, 
        isAuthenticated: false, 
        error: null, 
        onboardingStatus: null,
        loading: false
      }));
      
      // Reset onboarding state
      const state = get();
      if (state.resetOnboarding) {
        state.resetOnboarding();
      }
      
      console.log('🧹 All application state cleared');
    },
    
    // Initialize authentication state from localStorage
    initializeAuth: () => {
      const token = localStorage.getItem('token');
      console.log('Initializing auth from localStorage:', { 
        token: token ? 'TOKEN_EXISTS' : 'UNDEFINED', 
        tokenType: typeof token,
        hasToken: !!token 
      });
      
      if (hasToken(token)) {
        set(() => ({ 
          token, 
          isAuthenticated: true 
        }));
        console.log('Auth initialized successfully');
      } else {
        console.log('No token found in localStorage, clearing auth state');
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