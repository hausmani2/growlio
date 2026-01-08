import { apiGet, apiPost, apiPut } from '../../utils/axiosInterceptors';

const createPlansSlice = (set, get) => ({
  name: 'plans',
  
  // Plans state
  packages: [],
  currentPackage: null,
  loading: false,
  error: null,
  
  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setPackages: (packages) => set({ packages }),
  setCurrentPackage: (currentPackage) => set({ currentPackage }),
  
  // Fetch all available packages
  fetchPackages: async (forceRefresh = false) => {
    const state = get();
    
    // Check if we already have packages loaded (unless force refresh)
    if (!forceRefresh && state.packages && state.packages.length > 0) {
      return { success: true, data: state.packages };
    }
    
    // Prevent multiple concurrent calls
    if (state.loading) {
      // Wait for existing call to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const currentState = get();
          if (!currentState.loading) {
            clearInterval(checkInterval);
            resolve({ success: true, data: currentState.packages || [] });
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve({ success: false, error: 'Request timeout' });
        }, 5000);
      });
    }
    
    set({ loading: true, error: null });
    
    try {
      const response = await apiGet('/restaurant_v2/packages/');
      
      // Handle the API response structure: { success: true, packages: [...] }
      let packages = response.data?.packages || response.data?.results || response.data?.data || [];
      
      // Ensure packages is always an array
      if (!Array.isArray(packages)) {
        // If it's an object, try to extract array from common keys
        if (packages && typeof packages === 'object') {
          packages = packages.packages || packages.items || Object.values(packages).find(Array.isArray) || [];
        } else {
          packages = [];
        }
      }
      
      // Final safety check
      if (!Array.isArray(packages)) {
        packages = [];
      }
      
      set({ 
        packages: packages,
        loading: false,
        error: null
      });
      
      return { success: true, data: packages };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error.message || 
                          'Failed to fetch subscription packages';
      
      set({ 
        loading: false,
        error: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  },
  
  // Get current restaurant's package/subscription
  getCurrentPackage: async (forceRefresh = false) => {
    const state = get();
    
    // Prevent multiple concurrent calls
    if (state.loading) {
      return { success: false, error: 'Request already in progress' };
    }
    
    const restaurantId = localStorage.getItem('restaurant_id');
    
    if (!restaurantId) {
      set({ currentPackage: null });
      return { success: false, error: 'Restaurant ID not found' };
    }
    
    // Always call API to check current subscription, even if we have cached data
    // This ensures we always have the latest subscription status
    // Note: Don't set loading state here to avoid blocking UI - use local loading state in components
    
    try {
      let currentPackage = null;
      
      // First, try to get current subscription from the subscription/current endpoint
      try {
        const subscriptionResponse = await apiGet('/restaurant_v2/subscription/current/');
        const subscriptionData = subscriptionResponse.data?.data || subscriptionResponse.data;
        
        if (subscriptionData?.package_id || subscriptionData?.package) {
          // Get all packages to find the full package details
          const packagesResponse = await apiGet('/restaurant_v2/packages/');
          const allPackages = packagesResponse.data?.packages || 
                             packagesResponse.data?.results || 
                             packagesResponse.data?.data || 
                             [];
          
          const packageId = subscriptionData.package_id || subscriptionData.package?.id;
          if (packageId) {
            // Find the package by ID - this is the source of truth
            const foundPackage = allPackages.find(p => p.id === packageId);
            if (foundPackage) {
              currentPackage = foundPackage;
            } else if (subscriptionData.package) {
              currentPackage = subscriptionData.package;
            }
          }
        }
      } catch (subscriptionError) {
        // Silently fallback to other methods
        // Fallback to packages endpoint
      }
      
      // Fallback: Get from packages list (using is_current flag)
      if (!currentPackage) {
        const packagesResponse = await apiGet('/restaurant_v2/packages/');
        const allPackages = packagesResponse.data?.packages || 
                           packagesResponse.data?.results || 
                           packagesResponse.data?.data || 
                           [];
        
        // Find package with is_current flag
        currentPackage = allPackages.find(p => p.is_current) || null;
      }
      
      // Final fallback: Extract package info from restaurant onboarding data
      if (!currentPackage) {
        try {
          const restaurantResponse = await apiGet(`/restaurant/restaurants-onboarding/`);
          const restaurantData = restaurantResponse.data?.data || restaurantResponse.data;
          
          if (restaurantData?.restaurants && restaurantData.restaurants.length > 0) {
            const restaurant = restaurantData.restaurants[0];
            if (restaurant.package_id || restaurant.package) {
              const packagesResponse = await apiGet('/restaurant_v2/packages/');
              const allPackages = packagesResponse.data?.packages || 
                                 packagesResponse.data?.results || 
                                 packagesResponse.data?.data || 
                                 [];
              
              const packageId = restaurant.package_id || restaurant.package?.id;
              if (packageId) {
                currentPackage = allPackages.find(p => p.id === packageId) || 
                               restaurant.package || 
                               { id: packageId, name: 'Current Plan' };
              } else {
                currentPackage = restaurant.package;
              }
            }
          }
        } catch (restaurantError) {
          console.warn('⚠️ [plansSlice] Failed to fetch from restaurant endpoint:', restaurantError);
        }
      }
      
      set({ 
        currentPackage,
        error: null
      });
      
      return { success: true, data: currentPackage };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error.message || 
                          'Failed to fetch current package';
      
      set({ 
        error: errorMessage,
        currentPackage: null
      });
      
      return { success: false, error: errorMessage };
    }
  },
  
  // Update restaurant subscription
  updateSubscription: async (data) => {
    // Don't set global loading state - let components handle their own loading
    set({ error: null });
    
    try {
      const { restaurant_id, package_id, number_of_locations } = data;
      
      if (!restaurant_id || !package_id) {
        throw new Error('Restaurant ID and Package ID are required');
      }
      
      // Update subscription via API
      const response = await apiPost('/restaurant_v2/packages/', {
        restaurant_id,
        package_id,
        number_of_locations: number_of_locations || 1
      });
      
      const responseData = response.data || {};
      
      // Check if response contains Stripe checkout URL
      if (responseData.url) {
        // Return the checkout URL for redirect
        set({ error: null });
        
        return { 
          success: true, 
          data: responseData,
          checkoutUrl: responseData.url,
          sessionId: responseData.session_id,
          requiresPayment: true
        };
      }
      
      // If no checkout URL, update was successful without payment
      const updatedPackage = responseData.package || responseData.data;
      
      // Update current package in store
      if (updatedPackage) {
        set({ currentPackage: updatedPackage });
      } else {
        // If package not in response, fetch it
        const packagesResponse = await apiGet('/restaurant_v2/packages/');
        const allPackages = packagesResponse.data?.packages || 
                           packagesResponse.data?.results || 
                           packagesResponse.data?.data || 
                           [];
        const packageData = allPackages.find(p => p.id === package_id);
        if (packageData) {
          set({ currentPackage: packageData });
        }
      }
      
      set({ error: null });
      
      return { 
        success: true, 
        data: updatedPackage || responseData,
        requiresPayment: false
      };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error.message || 
                          'Failed to update subscription';
      
      set({ error: errorMessage });
      
      return { success: false, error: errorMessage };
    }
  },
  
  // Clear plans state
  clearPlans: () => {
    set({
      packages: [],
      currentPackage: null,
      loading: false,
      error: null
    });
  }
});

export default createPlansSlice;

