import { useMemo } from 'react';
import useStore from '../store/store';

/**
 * Custom hook to centralize onboarding state and user mode decision logic
 * 
 * This hook provides a clean decision layer that:
 * - Centralizes onboarding state from both regular and simulation APIs
 * - Exposes clear flags for user mode determination
 * - Handles all 4 onboarding scenarios
 * - Prevents duplicate API calls through caching
 * 
 * @returns {Object} Onboarding status flags and data
 */
const useOnboardingStatus = () => {
  // Get onboarding data from store (cached from login)
  const restaurantOnboardingData = useStore((state) => state.restaurantOnboardingData);
  const simulationOnboardingStatus = useStore((state) => state.simulationOnboardingStatus);
  const restaurantSimulationData = useStore((state) => state.restaurantSimulationData);
  
  // Get API functions for refreshing data
  const getRestaurantOnboarding = useStore((state) => state.getRestaurantOnboarding);
  const getSimulationOnboardingStatus = useStore((state) => state.getSimulationOnboardingStatus);
  const updateRestaurantSimulation = useStore((state) => state.updateRestaurantSimulation);
  const getRestaurantSimulation = useStore((state) => state.getRestaurantSimulation);

  // Memoize the decision logic to avoid recalculations
  const onboardingStatus = useMemo(() => {
    // Extract restaurants from both sources
    const regularRestaurants = restaurantOnboardingData?.restaurants || [];
    const simulationRestaurants = simulationOnboardingStatus?.restaurants || [];
    
    // Check if user has restaurants in each category
    const hasRegularRestaurants = Array.isArray(regularRestaurants) && regularRestaurants.length > 0;
    const hasSimulationRestaurants = Array.isArray(simulationRestaurants) && simulationRestaurants.length > 0;
    
    // Check onboarding completion status
    const hasCompletedRegularOnboarding = hasRegularRestaurants && 
      regularRestaurants.some(r => r.onboarding_complete === true);
    const hasCompletedSimulationOnboarding = hasSimulationRestaurants && 
      simulationRestaurants.some(r => r.simulation_onboarding_complete === true);
    
    // Determine user mode based on requirements:
    // - If only regular restaurant exists → normal flow
    // - If only simulation restaurant exists → simulation-only UI
    // - If both exist → treat user as regular
    // - If neither exists → keep existing behavior (new user)
    const isRegularUser = hasRegularRestaurants;
    const isSimulationUser = hasSimulationRestaurants && !hasRegularRestaurants;
    const hasSimulationAccess = hasSimulationRestaurants || restaurantSimulationData?.restaurant_simulation === true;
    
    // Determine if user can access training
    // Training is available if:
    // 1. User has completed regular onboarding, OR
    // 2. User has simulation access
    const canAccessTraining = hasCompletedRegularOnboarding || hasSimulationAccess;
    
    // Comprehensive logging for debugging
    
    return {
      // Raw data
      regularRestaurants,
      simulationRestaurants,
      restaurantSimulationData,
      
      // User mode flags
      isRegularUser,
      isSimulationUser,
      hasSimulationAccess,
      
      // Onboarding completion flags
      hasCompletedRegularOnboarding,
      hasCompletedSimulationOnboarding,
      hasRegularRestaurants,
      hasSimulationRestaurants,
      
      // Access control flags
      canAccessTraining,
      
      // Loading states (from store)
      loading: false, // Can be extended if needed
    };
  }, [
    restaurantOnboardingData,
    simulationOnboardingStatus,
    restaurantSimulationData,
  ]);

  /**
   * Refresh both onboarding APIs in parallel
   * Used after activating simulation mode
   */
  const refreshOnboardingStatus = async () => {
    try {
      const [regularResult, simulationResult] = await Promise.all([
        getRestaurantOnboarding(true), // forceRefresh = true
        getSimulationOnboardingStatus(true), // forceRefresh = true
      ]);
      
      return {
        success: true,
        regular: regularResult,
        simulation: simulationResult,
      };
    } catch (error) {
      console.error('Error refreshing onboarding status:', error);
      return {
        success: false,
        error: error.message || 'Failed to refresh onboarding status',
      };
    }
  };

  /**
   * Activate simulation mode
   * POST to /authentication/user/restaurant-simulation/ with { restaurant_simulation: true }
   * Then refresh both onboarding APIs
   */
  const activateSimulationMode = async () => {
    try {
      // Step 1: POST to activate simulation
      const result = await updateRestaurantSimulation({ restaurant_simulation: true });
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to activate simulation mode',
        };
      }
      
      // Step 2: Refresh both onboarding APIs in parallel
      const refreshResult = await refreshOnboardingStatus();
      
      if (!refreshResult.success) {
        // Even if refresh fails, simulation was activated
        return {
          success: true,
          warning: 'Simulation mode activated, but failed to refresh onboarding status',
        };
      }
      
      return {
        success: true,
        data: result.data,
        refreshResult,
      };
    } catch (error) {
      console.error('Error activating simulation mode:', error);
      return {
        success: false,
        error: error.message || 'Failed to activate simulation mode',
      };
    }
  };

  return {
    ...onboardingStatus,
    refreshOnboardingStatus,
    activateSimulationMode,
  };
};

export default useOnboardingStatus;
