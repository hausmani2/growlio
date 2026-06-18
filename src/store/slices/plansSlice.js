import { apiGet, apiPost, apiPut } from '../../utils/axiosInterceptors';
import { parsePackagesFromResponse, resolveRestaurantIdFromStore } from '../../utils/onboardingUtils';

const createPlansSlice = (set, get) => ({
  name: 'plans',
  
  // Plans state
  packages: [],
  currentPackage: null,
  subscriptionDetails: null,
  subscriptionDetailsLoading: false,
  subscriptionDetailsTimestamp: null,
  packagesLoading: false,
  currentPackageLoading: false,
  loading: false,
  error: null,
  
  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setPackages: (packages) => set({ packages }),
  setCurrentPackage: (currentPackage) => set({ currentPackage }),
  setSubscriptionDetails: (subscriptionDetails) => set({ subscriptionDetails }),
  setSubscriptionDetailsLoading: (subscriptionDetailsLoading) => set({ subscriptionDetailsLoading }),
  
  // Fetch all available packages
  fetchPackages: async (forceRefresh = false) => {
    const state = get();
    
    // Check if we already have packages loaded (unless force refresh)
    if (!forceRefresh && state.packages && state.packages.length > 0) {
      return { success: true, data: state.packages };
    }
    
    // Prevent multiple concurrent calls
    if (state.packagesLoading) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const currentState = get();
          if (!currentState.packagesLoading) {
            clearInterval(checkInterval);
            resolve({ success: true, data: currentState.packages || [] });
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve({ success: false, error: 'Request timeout' });
        }, 5000);
      });
    }
    
    set({ packagesLoading: true, loading: true, error: null });
    
    try {
      const restaurantId = await resolveRestaurantIdFromStore(get, { forceRefresh });
      const fetchPackagesUrl = (rid) =>
        rid
          ? `/restaurant_v2/packages/?restaurant_id=${encodeURIComponent(rid)}`
          : '/restaurant_v2/packages/';

      let response = await apiGet(fetchPackagesUrl(restaurantId));
      let packages = parsePackagesFromResponse(response);

      // Retry without restaurant_id if scoped request returned nothing
      if (packages.length === 0 && restaurantId) {
        response = await apiGet('/restaurant_v2/packages/');
        packages = parsePackagesFromResponse(response);
      }
      
      set({ 
        packages,
        packagesLoading: false,
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
        packagesLoading: false,
        loading: false,
        error: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  },
  
  // Get current restaurant's package/subscription
  getCurrentPackage: async (forceRefresh = false) => {
    const state = get();
    
    if (state.currentPackageLoading) {
      return { success: false, error: 'Request already in progress' };
    }
    
    const restaurantId = await resolveRestaurantIdFromStore(get, { forceRefresh });
    
    if (!restaurantId) {
      set({ currentPackage: null });
      return { success: false, error: 'Restaurant ID not found' };
    }
    
    set({ currentPackageLoading: true, error: null });
    
    try {
      let currentPackage = null;
      
      // First, try to get current subscription from the subscription/current endpoint
      try {
        const subscriptionResponse = await apiGet('/restaurant_v2/subscription/current/');
        const subscriptionData = subscriptionResponse.data?.data || subscriptionResponse.data;
        
        if (subscriptionData?.package_id || subscriptionData?.package) {
          const packagesResponse = await apiGet(
            `/restaurant_v2/packages/?restaurant_id=${encodeURIComponent(restaurantId)}`
          );
          let allPackages = parsePackagesFromResponse(packagesResponse);
          if (allPackages.length === 0) {
            const fallbackResponse = await apiGet('/restaurant_v2/packages/');
            allPackages = parsePackagesFromResponse(fallbackResponse);
          }
          
          const packageId = subscriptionData.package_id || subscriptionData.package?.id;
          if (packageId) {
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
      }
      
      // Fallback: Get from packages list (using is_current flag)
      if (!currentPackage) {
        const packagesResponse = await apiGet(
          `/restaurant_v2/packages/?restaurant_id=${encodeURIComponent(restaurantId)}`
        );
        let allPackages = parsePackagesFromResponse(packagesResponse);
        if (allPackages.length === 0) {
          const fallbackResponse = await apiGet('/restaurant_v2/packages/');
          allPackages = parsePackagesFromResponse(fallbackResponse);
        }
        
        currentPackage = allPackages.find(p => p.is_current) || null;
      }
      
      set({ 
        currentPackage,
        currentPackageLoading: false,
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
        currentPackage: null,
        currentPackageLoading: false
      });
      
      return { success: false, error: errorMessage };
    }
  },

  // Fetch current subscription details (package + restaurant + billing)
  // Source of truth for max_locations and addable locations
  fetchCurrentSubscriptionDetails: async (forceRefresh = false) => {
    const state = get();
    const now = Date.now();
    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

    if (!forceRefresh && state.subscriptionDetails && state.subscriptionDetailsTimestamp) {
      const age = now - state.subscriptionDetailsTimestamp;
      if (age < CACHE_DURATION) {
        return { success: true, data: state.subscriptionDetails };
      }
    }

    try {
      set({ subscriptionDetailsLoading: true, error: null });
      const response = await apiGet('/restaurant_v2/subscription/current/');
      const subscriptionData = response.data?.data || response.data || null;

      set({
        subscriptionDetails: subscriptionData,
        subscriptionDetailsTimestamp: now,
        subscriptionDetailsLoading: false,
        error: null
      });

      if (subscriptionData?.package) {
        set({ currentPackage: subscriptionData.package });
      }

      return { success: true, data: subscriptionData };
    } catch (error) {
      if (error.response?.status === 404) {
        set({
          subscriptionDetails: null,
          subscriptionDetailsTimestamp: now,
          subscriptionDetailsLoading: false,
          error: null
        });
        return { success: true, data: null };
      }

      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'Failed to fetch current subscription';

      set({
        error: errorMessage,
        subscriptionDetailsLoading: false
      });

      return { success: false, error: errorMessage };
    }
  },
  
  // Update restaurant subscription
  updateSubscription: async (data) => {
    set({ error: null });
    
    try {
      let { restaurant_id, package_id, number_of_locations } = data;
      
      if (!restaurant_id) {
        restaurant_id = await resolveRestaurantIdFromStore(get, { forceRefresh: true });
      }
      
      if (!restaurant_id || !package_id) {
        throw new Error('Restaurant ID and Package ID are required');
      }
      
      const response = await apiPost('/restaurant_v2/packages/', {
        restaurant_id,
        package_id,
        number_of_locations: number_of_locations || 1
      });
      
      const responseData = response.data || {};
      
      if (responseData.url) {
        set({ error: null });
        
        return { 
          success: true, 
          data: responseData,
          checkoutUrl: responseData.url,
          sessionId: responseData.session_id,
          requiresPayment: true
        };
      }
      
      const updatedPackage = responseData.package || responseData.data;
      
      if (updatedPackage) {
        set({ currentPackage: updatedPackage });
      } else {
        const packagesResponse = await apiGet(
          `/restaurant_v2/packages/?restaurant_id=${encodeURIComponent(restaurant_id)}`
        );
        let allPackages = parsePackagesFromResponse(packagesResponse);
        if (allPackages.length === 0) {
          const fallbackResponse = await apiGet('/restaurant_v2/packages/');
          allPackages = parsePackagesFromResponse(fallbackResponse);
        }
        const packageData = allPackages.find(p => p.id === package_id);
        if (packageData) {
          set({ currentPackage: packageData });
        }
      }

      // Refresh subscription + location limits after plan change
      await get().fetchCurrentSubscriptionDetails?.(true);
      if (typeof get().fetchLocations === 'function') {
        await get().fetchLocations(restaurant_id, true);
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
  
  clearPlans: () => {
    set({
      packages: [],
      currentPackage: null,
      subscriptionDetails: null,
      subscriptionDetailsLoading: false,
      subscriptionDetailsTimestamp: null,
      packagesLoading: false,
      currentPackageLoading: false,
      loading: false,
      error: null
    });
  }
});

export default createPlansSlice;
