import { apiGet, apiPost } from '../../utils/axiosInterceptors';
import { message } from 'antd';

const createSimulationSlice = (set, get) => ({
  name: 'simulation',
  
  // Simulation onboarding status
  simulationOnboardingStatus: null,
  simulationOnboardingStatusTimestamp: null,
  simulationOnboardingLoading: false,
  simulationOnboardingError: null,
  
  // Simulation dashboard data
  simulationDashboardData: null,
  simulationDashboardLoading: false,
  simulationDashboardError: null,
  
  // Get simulation onboarding status
  getSimulationOnboardingStatus: async () => {
    // CRITICAL: Check if user is in simulation mode before calling simulation API
    // First check cached data from store to avoid unnecessary API calls
    const currentState = get();
    let simulationCheck = null;
    
    // Check if we have cached restaurant simulation data
    if (currentState.restaurantSimulationData) {
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      const timeSinceCache = currentState.restaurantSimulationDataTimestamp 
        ? now - currentState.restaurantSimulationDataTimestamp 
        : Infinity;
      
      if (timeSinceCache < CACHE_DURATION) {
        // Use cached data
        simulationCheck = {
          success: true,
          data: currentState.restaurantSimulationData
        };
      }
    }
    
    // If no cached data, call API (which will use its own cache)
    if (!simulationCheck) {
      try {
        const { getRestaurantSimulation } = get();
        simulationCheck = await getRestaurantSimulation();
      } catch (error) {
        console.error('❌ [simulationSlice] Error checking simulation status:', error);
        set({ 
          simulationOnboardingLoading: false, 
          simulationOnboardingError: 'Failed to verify simulation mode' 
        });
        return { success: false, error: 'Failed to verify simulation mode' };
      }
    }
    
    // CRITICAL: Allow calling API even if user is not in simulation mode
    // This is needed for new users to check if they have simulation restaurants
    // We'll try to call the API regardless, and handle errors gracefully
    
    // Check if we have cached data that's still fresh
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
    
    if (currentState.simulationOnboardingStatus && currentState.simulationOnboardingStatusTimestamp) {
      const timeSinceCache = now - currentState.simulationOnboardingStatusTimestamp;
      if (timeSinceCache < CACHE_DURATION) {
        // Return cached data
        return { 
          success: true, 
          data: currentState.simulationOnboardingStatus
        };
      }
    }
    
    // GLOBAL GUARD: Check sessionStorage to prevent multiple concurrent calls
    const hasCheckedGlobally = sessionStorage.getItem('hasCheckedSimulationOnboardingGlobal');
    const lastCheckTime = sessionStorage.getItem('simulationOnboardingLastCheckTime');
    
    // If we've checked in the last 2 seconds, return cached data if available
    if (hasCheckedGlobally === 'true' && lastCheckTime) {
      const timeSinceCheck = now - parseInt(lastCheckTime);
      if (timeSinceCheck < 2000) {
        // Too soon to check again - return cached data if available
        if (currentState.simulationOnboardingStatus) {
          return { 
            success: true, 
            data: currentState.simulationOnboardingStatus
          };
        }
        return { success: false, error: 'Request throttled - please wait' };
      }
    }
    
    // Mark that we're checking globally
    sessionStorage.setItem('hasCheckedSimulationOnboardingGlobal', 'true');
    sessionStorage.setItem('simulationOnboardingLastCheckTime', now.toString());
    
    set({ simulationOnboardingLoading: true, simulationOnboardingError: null });
    
    try {
      const response = await apiGet('/simulation/simulation-onboarding/');
      
      // Cache the result
      set({
        simulationOnboardingStatus: response.data,
        simulationOnboardingStatusTimestamp: now,
        simulationOnboardingLoading: false,
        simulationOnboardingError: null
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ [simulationSlice] API call failed:', error);
      console.error('❌ [simulationSlice] Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error.message || 
                          'Failed to fetch simulation onboarding status';
      
      // CRITICAL: If user is not in simulation mode, return success with empty array
      // This allows the login flow to check both APIs without errors
      const isSimulator = simulationCheck?.success && simulationCheck?.data?.restaurant_simulation === true;
      if (!isSimulator && (error.response?.status === 403 || error.response?.status === 401 || errorMessage.includes('simulation') || errorMessage.includes('not available'))) {
        // User is not in simulation mode, return empty result (not an error)
        set({
          simulationOnboardingStatus: { restaurants: [] },
          simulationOnboardingStatusTimestamp: Date.now(),
          simulationOnboardingLoading: false,
          simulationOnboardingError: null
        });
        
        // Clear global check flag
        sessionStorage.removeItem('hasCheckedSimulationOnboardingGlobal');
        sessionStorage.removeItem('simulationOnboardingLastCheckTime');
        
        return { success: true, data: { restaurants: [] } };
      }
      
      console.error('❌ [simulationSlice] Error message:', errorMessage);
      
      // Clear global check flag on error
      sessionStorage.removeItem('hasCheckedSimulationOnboardingGlobal');
      sessionStorage.removeItem('simulationOnboardingLastCheckTime');
      
      set({
        simulationOnboardingLoading: false,
        simulationOnboardingError: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  },
  
  // Create/Update simulation dashboard
  createSimulationDashboard: async (payload) => {
    // CRITICAL: Check if user is in simulation mode before calling simulation API
    // Use cached data from store to avoid unnecessary API calls
    const currentState = get();
    let simulationCheck = null;
    
    if (currentState.restaurantSimulationData) {
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000;
      const timeSinceCache = currentState.restaurantSimulationDataTimestamp 
        ? now - currentState.restaurantSimulationDataTimestamp 
        : Infinity;
      
      if (timeSinceCache < CACHE_DURATION) {
        simulationCheck = {
          success: true,
          data: currentState.restaurantSimulationData
        };
      }
    }
    
    if (!simulationCheck) {
      try {
        const { getRestaurantSimulation } = get();
        simulationCheck = await getRestaurantSimulation();
      } catch (error) {
        console.error('❌ [simulationSlice] Error checking simulation status:', error);
        set({ 
          simulationDashboardLoading: false, 
          simulationDashboardError: 'Failed to verify simulation mode' 
        });
        return { success: false, error: 'Failed to verify simulation mode' };
      }
    }
    
    if (!simulationCheck?.success || simulationCheck?.data?.restaurant_simulation !== true) {
      const errorMessage = 'User is not in simulation mode. Simulation APIs are not available.';
      set({ 
        simulationDashboardLoading: false, 
        simulationDashboardError: errorMessage
      });
      return { success: false, error: errorMessage };
    }
    
    set({ simulationDashboardLoading: true, simulationDashboardError: null });
    
    try {
      const response = await apiPost('/simulation/dashboard/', payload);
   
      
      // Store the dashboard data from response
      // Response can be either a single object or an array
      if (response.data) {
        // If it's an array, use it directly
        // If it's a single object, wrap it in an array for consistency
        const dashboardData = Array.isArray(response.data) 
          ? response.data 
          : [response.data];
        
        
        set({
          simulationDashboardData: dashboardData,
          simulationDashboardLoading: false,
          simulationDashboardError: null
        });
      } else {
        set({
          simulationDashboardLoading: false,
          simulationDashboardError: null
        });
      }
      
      message.success('Dashboard data saved successfully');
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error.message || 
                          'Failed to save dashboard data';
      
      console.error('❌ [simulationSlice] Error creating dashboard:', error);
      
      set({
        simulationDashboardLoading: false,
        simulationDashboardError: errorMessage
      });
      
      message.error(errorMessage);
      
      return { success: false, error: errorMessage };
    }
  },
  
  // Get simulation dashboard data
  getSimulationDashboard: async (restaurantId, year = null, month = null) => {
    // CRITICAL: Check if user is in simulation mode before calling simulation API
    // Use cached data from store to avoid unnecessary API calls
    const currentState = get();
    let simulationCheck = null;
    
    if (currentState.restaurantSimulationData) {
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000;
      const timeSinceCache = currentState.restaurantSimulationDataTimestamp 
        ? now - currentState.restaurantSimulationDataTimestamp 
        : Infinity;
      
      if (timeSinceCache < CACHE_DURATION) {
        simulationCheck = {
          success: true,
          data: currentState.restaurantSimulationData
        };
      }
    }
    
    if (!simulationCheck) {
      try {
        const { getRestaurantSimulation } = get();
        simulationCheck = await getRestaurantSimulation();
      } catch (error) {
        console.error('❌ [simulationSlice] Error checking simulation status:', error);
        set({ 
          simulationDashboardLoading: false, 
          simulationDashboardError: 'Failed to verify simulation mode' 
        });
        return { success: false, error: 'Failed to verify simulation mode' };
      }
    }
    
    if (!simulationCheck?.success || simulationCheck?.data?.restaurant_simulation !== true) {
      const errorMessage = 'User is not in simulation mode. Simulation APIs are not available.';
      set({ 
        simulationDashboardLoading: false, 
        simulationDashboardError: errorMessage
      });
      return { success: false, error: errorMessage };
    }
    set({ simulationDashboardLoading: true, simulationDashboardError: null });
    
    try {
      // Call GET API with restaurant_id (required), year and month (optional)
      // Format: /simulation/dashboard/?restaurant_id=2&year=2026&month=1
      // restaurant_id is required by the API
      if (!restaurantId) {
        const errorMsg = 'Restaurant ID is required to fetch dashboard data';
        console.error('❌ [simulationSlice]', errorMsg);
        set({
          simulationDashboardLoading: false,
          simulationDashboardError: errorMsg
        });
        return { success: false, error: errorMsg };
      }
      
      const params = new URLSearchParams();
      params.append('restaurant_id', restaurantId);
      
      // Add optional year and month parameters if provided
      if (year !== null && year !== undefined) {
        params.append('year', year);
      }
      if (month !== null && month !== undefined) {
        params.append('month', month);
      }
      
      const queryString = params.toString();
      const url = `/simulation/dashboard/?${queryString}`;
      
      const response = await apiGet(url);

      
      set({
        simulationDashboardData: response.data,
        simulationDashboardLoading: false,
        simulationDashboardError: null
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error.message || 
                          'Failed to fetch dashboard data';
      
      set({
        simulationDashboardLoading: false,
        simulationDashboardError: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  },
  
  // Submit simulation onboarding data
  submitSimulationOnboarding: async (payload) => {
    // CRITICAL: Check if user is in simulation mode before calling simulation API
    // Use cached data from store to avoid unnecessary API calls
    const currentState = get();
    let simulationCheck = null;
    
    if (currentState.restaurantSimulationData) {
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000;
      const timeSinceCache = currentState.restaurantSimulationDataTimestamp 
        ? now - currentState.restaurantSimulationDataTimestamp 
        : Infinity;
      
      if (timeSinceCache < CACHE_DURATION) {
        simulationCheck = {
          success: true,
          data: currentState.restaurantSimulationData
        };
      }
    }
    
    if (!simulationCheck) {
      try {
        const { getRestaurantSimulation } = get();
        simulationCheck = await getRestaurantSimulation();
      } catch (error) {
        console.error('❌ [simulationSlice] Error checking simulation status:', error);
        set({ 
          simulationOnboardingLoading: false, 
          simulationOnboardingError: 'Failed to verify simulation mode' 
        });
        message.error('Failed to verify simulation mode');
        return { success: false, error: 'Failed to verify simulation mode' };
      }
    }
    
    if (!simulationCheck?.success || simulationCheck?.data?.restaurant_simulation !== true) {
      const errorMessage = 'User is not in simulation mode. Simulation APIs are not available.';
      set({ 
        simulationOnboardingLoading: false, 
        simulationOnboardingError: errorMessage
      });
      message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
    
    set({ simulationOnboardingLoading: true, simulationOnboardingError: null });
    
    try {
      const response = await apiPost('/simulation/onboarding/', payload);
      
      // Extract restaurant_id from response if available
      const restaurantId = response.data?.restaurant_id;
      if (restaurantId) {
        localStorage.setItem('simulation_restaurant_id', restaurantId.toString());
      }
      
      set({
        simulationOnboardingLoading: false,
        simulationOnboardingError: null
      });
      
      message.success('Onboarding data saved successfully');
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error.message || 
                          'Failed to save onboarding data';
      
      set({
        simulationOnboardingLoading: false,
        simulationOnboardingError: errorMessage
      });
      
      message.error(errorMessage);
      
      return { success: false, error: errorMessage };
    }
  },
  
  // Clear simulation state
  clearSimulationState: () => {
    set({
      simulationOnboardingStatus: null,
      simulationOnboardingStatusTimestamp: null,
      simulationOnboardingLoading: false,
      simulationOnboardingError: null,
      simulationDashboardData: null,
      simulationDashboardLoading: false,
      simulationDashboardError: null
    });
    
    // Clear sessionStorage cache
    sessionStorage.removeItem('hasCheckedSimulationOnboardingGlobal');
    sessionStorage.removeItem('simulationOnboardingLastCheckTime');
  }
});

export default createSimulationSlice;