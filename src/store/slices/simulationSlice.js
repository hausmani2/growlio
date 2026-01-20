import { apiGet, apiPost } from '../../utils/axiosInterceptors';
import { message } from 'antd';

const createSimulationSlice = (set, get) => ({
  name: 'simulation',
  
  // Simulation onboarding status
  simulationOnboardingStatus: null,
  simulationOnboardingLoading: false,
  simulationOnboardingError: null,
  
  // Simulation dashboard data
  simulationDashboardData: null,
  simulationDashboardLoading: false,
  simulationDashboardError: null,
  
  // Get simulation onboarding status
  getSimulationOnboardingStatus: async () => {
    
    set({ simulationOnboardingLoading: true, simulationOnboardingError: null });
    
    try {
      const response = await apiGet('/simulation/simulation-onboarding/');
      
      set({
        simulationOnboardingStatus: response.data,
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
      
      console.error('❌ [simulationSlice] Error message:', errorMessage);
      
      set({
        simulationOnboardingLoading: false,
        simulationOnboardingError: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  },
  
  // Create/Update simulation dashboard
  createSimulationDashboard: async (payload) => {
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
      simulationOnboardingLoading: false,
      simulationOnboardingError: null,
      simulationDashboardData: null,
      simulationDashboardLoading: false,
      simulationDashboardError: null
    });
  }
});

export default createSimulationSlice;