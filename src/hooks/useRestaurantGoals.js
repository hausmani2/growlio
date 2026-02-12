import { useEffect, useCallback, useRef } from 'react';
import useStore from '../store/store';

/**
 * Custom hook to manage restaurant goals data fetching
 * 
 * This hook provides a centralized, professional way to:
 * - Fetch restaurant goals API data
 * - Handle loading and error states
 * - Ensure restaurant ID is available before fetching
 * - Prevent duplicate API calls
 * - Provide helper functions to check if days are open/closed
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoFetch - Whether to automatically fetch on mount (default: true)
 * @param {boolean} options.refreshOnMount - Whether to force refresh even if data exists (default: false)
 * @param {string} options.componentName - Name of component using this hook (for logging)
 * 
 * @returns {Object} Restaurant goals data and utilities
 */
const useRestaurantGoals = ({ 
  autoFetch = true, 
  refreshOnMount = false,
  componentName = 'Component'
} = {}) => {
  const {
    getRestaurentGoal,
    restaurantGoals,
    restaurantGoalsLoading,
    restaurantGoalsError,
    ensureRestaurantId
  } = useStore();

  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  /**
   * Fetch restaurant goals from API
   * Handles restaurant ID validation and prevents duplicate calls
   * 
   * @param {boolean} forceRefresh - Force refresh even if data exists
   * @returns {Promise<Object|null>} Goals data or null if error
   */
  const fetchGoals = useCallback(async (forceRefresh = false) => {
    // Prevent duplicate concurrent calls
    if (isFetchingRef.current) {
      console.log(`[${componentName}] Goals API call already in progress, skipping...`);
      return restaurantGoals;
    }

    // Skip if we already have data and not forcing refresh
    if (!forceRefresh && !refreshOnMount && hasFetchedRef.current && restaurantGoals) {
      console.log(`[${componentName}] Using existing restaurant goals data`);
      return restaurantGoals;
    }

    try {
      isFetchingRef.current = true;
      console.log(`[${componentName}] 🔄 Fetching restaurant goals from API...`);

      // Ensure restaurant ID is available
      const restaurantId = await ensureRestaurantId();
      if (!restaurantId) {
        console.warn(`[${componentName}] ⚠️ No restaurant ID available, cannot fetch goals`);
        return null;
      }

      // Fetch goals data
      const goalsData = await getRestaurentGoal(restaurantId);

      if (goalsData) {
        console.log(`[${componentName}] ✅ Restaurant goals fetched successfully`);
        if (goalsData.restaurant_days && Array.isArray(goalsData.restaurant_days)) {
          console.log(`[${componentName}] 📅 Restaurant OPEN days:`, goalsData.restaurant_days);
        } else {
          console.warn(`[${componentName}] ⚠️ restaurant_days is missing or not an array:`, goalsData.restaurant_days);
        }
        hasFetchedRef.current = true;
        return goalsData;
      } else {
        console.warn(`[${componentName}] ⚠️ Restaurant goals API returned null or undefined`);
        return null;
      }
    } catch (error) {
      console.error(`[${componentName}] ❌ Error fetching restaurant goals:`, error);
      return null;
    } finally {
      isFetchingRef.current = false;
    }
  }, [getRestaurentGoal, ensureRestaurantId, restaurantGoals, refreshOnMount, componentName]);

  /**
   * Check if a specific day is open based on restaurant goals
   * 
   * @param {string} dayName - Day name (e.g., "Sunday", "Monday")
   * @returns {boolean} True if day is open, false if closed
   */
  const isDayOpen = useCallback((dayName) => {
    if (!restaurantGoals || !restaurantGoals.restaurant_days) {
      return false;
    }

    if (!Array.isArray(restaurantGoals.restaurant_days)) {
      console.warn('restaurant_days is not an array:', restaurantGoals.restaurant_days);
      return false;
    }

    if (restaurantGoals.restaurant_days.length === 0) {
      return false;
    }

    const normalizedDayName = dayName ? dayName.trim().toLowerCase() : '';
    const normalizedRestaurantDays = restaurantGoals.restaurant_days.map(day => 
      day ? day.trim().toLowerCase() : ''
    );

    return normalizedRestaurantDays.includes(normalizedDayName);
  }, [restaurantGoals]);

  /**
   * Get all open days from restaurant goals
   * 
   * @returns {Array<string>} Array of open day names
   */
  const getOpenDays = useCallback(() => {
    if (!restaurantGoals || !restaurantGoals.restaurant_days) {
      return [];
    }
    return Array.isArray(restaurantGoals.restaurant_days) ? restaurantGoals.restaurant_days : [];
  }, [restaurantGoals]);

  /**
   * Get all closed days (days not in restaurant_days)
   * 
   * @returns {Array<string>} Array of closed day names
   */
  const getClosedDays = useCallback(() => {
    const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const openDays = getOpenDays().map(day => day.toLowerCase());
    return allDays.filter(day => !openDays.includes(day.toLowerCase()));
  }, [getOpenDays]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchGoals(refreshOnMount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, refreshOnMount]);

  return {
    // Data
    restaurantGoals,
    restaurantGoalsLoading,
    restaurantGoalsError,
    
    // Actions
    fetchGoals,
    refreshGoals: () => fetchGoals(true),
    
    // Utilities
    isDayOpen,
    getOpenDays,
    getClosedDays,
    
    // Status
    hasData: !!restaurantGoals,
    hasRestaurantDays: !!(restaurantGoals?.restaurant_days && Array.isArray(restaurantGoals.restaurant_days))
  };
};

export default useRestaurantGoals;
