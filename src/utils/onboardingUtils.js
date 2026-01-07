/**
 * Onboarding Utility Functions
 * 
 * Centralized logic for checking onboarding status, restaurant existence,
 * and sales information completion.
 */

/**
 * Route constants for onboarding flow
 */
export const ONBOARDING_ROUTES = {
  ONBOARDING: '/onboarding',
  SCORE: '/onboarding/score',
  SIMULATION: '/onboarding/simulation',
  PROFITABILITY: '/onboarding/profitability',
  REPORT_CARD: '/dashboard/report-card',
  DASHBOARD_BUDGET: '/dashboard/budget',
  CONGRATULATIONS: '/congratulations',
};

/**
 * Restaurant onboarding status keys from API
 */
export const RESTAURANT_STATUS_KEYS = {
  ONE_MONTH_SALES_INFO: 'One Month Sales Information',
  CREATE_ACCOUNT: 'Create Account',
  EXPENSE: 'Expense',
  SALES_INFORMATION: 'Sales Information',
  BASIC_INFORMATION: 'Basic Information',
  OPERATING_INFORMATION: 'Operating Information',
  LABOUR_INFORMATION: 'Labour Information',
  FOOD_COST_DETAILS: 'Food Cost Details',
  THIRD_PARTY_INFO: 'Third-Party Info',
};

/**
 * Setup items configuration with their corresponding API field keys
 */
export const SETUP_ITEMS = [
  {
    label: 'Create your account',
    key: RESTAURANT_STATUS_KEYS.CREATE_ACCOUNT,
    route: null, // Account creation is done
    order: 1,
  },
  {
    label: 'Enter one month of sales and expenses',
    key: RESTAURANT_STATUS_KEYS.ONE_MONTH_SALES_INFO,
    route: '/onboarding/profitability',
    order: 2,
  },
  {
    label: 'Add operating expenses',
    key: RESTAURANT_STATUS_KEYS.EXPENSE,
    route: '/dashboard/expense',
    order: 3,
  },
  {
    label: 'Enter additional sales data',
    key: RESTAURANT_STATUS_KEYS.SALES_INFORMATION,
    route: '/dashboard/sales-data',
    order: 4,
  },
  {
    label: 'Restaurant details',
    key: RESTAURANT_STATUS_KEYS.BASIC_INFORMATION,
    route: '/dashboard/basic-information',
    order: 5,
  },
  {
    label: 'Operating information',
    key: RESTAURANT_STATUS_KEYS.OPERATING_INFORMATION,
    route: '/dashboard/sales-channels',
    order: 6,
  },
  {
    label: 'Labor information',
    key: RESTAURANT_STATUS_KEYS.LABOUR_INFORMATION,
    route: '/dashboard/labor-information',
    order: 7,
  },
  {
    label: 'COGs',
    key: RESTAURANT_STATUS_KEYS.FOOD_COST_DETAILS,
    route: '/dashboard/food-cost-details',
    order: 8,
  },
  {
    label: 'Add third-party delivery info',
    key: RESTAURANT_STATUS_KEYS.THIRD_PARTY_INFO,
    route: '/dashboard/third-party-delivery',
    order: 9,
  },
  {
    label: 'Go to your budget',
    key: null, // This is always available
    route: '/dashboard/budget',
    order: 10,
  },
];

/**
 * Get onboarding progress data from restaurant object
 * @param {Object} restaurantData - Response from restaurants-onboarding API
 * @returns {Object} - Progress data with completion percentage, completed items, and current step
 */
export const getOnboardingProgress = (restaurantData) => {
  console.log("🔍 [getOnboardingProgress] Input restaurantData:", restaurantData);
  
  // Handle case where restaurantData might be nested
  let dataToProcess = restaurantData;
  if (restaurantData?.data && Array.isArray(restaurantData.data.restaurants)) {
    dataToProcess = restaurantData.data;
  } else if (restaurantData?.restaurants) {
    dataToProcess = restaurantData;
  }
  
  console.log("🔍 [getOnboardingProgress] Processed data:", dataToProcess);
  
  const restaurant = getFirstRestaurant(dataToProcess);
  console.log("🔍 [getOnboardingProgress] First restaurant:", restaurant);
  
  if (!restaurant) {
    console.warn("⚠️ [getOnboardingProgress] No restaurant found in data");
    return {
      completionPercentage: 0,
      completedItems: [],
      currentStep: 1,
      items: SETUP_ITEMS.map(item => ({ ...item, isCompleted: false })),
    };
  }

  // Map each setup item to its completion status
  const itemsWithStatus = SETUP_ITEMS.map((item) => {
    let isCompleted = false;
    
    if (item.key === null) {
      // "Go to your budget" is always available (not based on API field)
      isCompleted = false; // This is the final step, not completed until all others are done
    } else {
      // Check if the corresponding field is true in the restaurant object
      isCompleted = restaurant[item.key] === true;
    }
    
    return {
      ...item,
      isCompleted,
    };
  });

  // Calculate completion percentage
  // Count completed items (excluding the last "Go to your budget" item)
  const itemsToCount = itemsWithStatus.slice(0, -1); // Exclude last item
  const completedCount = itemsToCount.filter(item => item.isCompleted).length;
  const totalItems = itemsToCount.length;
  const completionPercentage = totalItems > 0 
    ? Math.round((completedCount / totalItems) * 100) 
    : 0;

  // Find current step (first incomplete item)
  const currentStepIndex = itemsWithStatus.findIndex(item => !item.isCompleted);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : itemsWithStatus.length;

  // Use API completion_percentage if available, otherwise use calculated
  const finalCompletionPercentage = restaurant.completion_percentage !== undefined 
    ? restaurant.completion_percentage 
    : completionPercentage;

  console.log("🔍 [getOnboardingProgress] Final completion percentage:", finalCompletionPercentage);
  console.log("🔍 [getOnboardingProgress] Restaurant completion_percentage:", restaurant.completion_percentage);
  console.log("🔍 [getOnboardingProgress] Calculated completion percentage:", completionPercentage);

  return {
    completionPercentage: finalCompletionPercentage,
    completedItems: itemsWithStatus.filter(item => item.isCompleted),
    currentStep,
    items: itemsWithStatus,
    restaurant,
  };
};

/**
 * Check if restaurant exists in the API response
 * @param {Object} restaurantData - Response from restaurants-onboarding API
 * @returns {boolean} - True if restaurant exists
 */
export const hasRestaurant = (restaurantData) => {
  
  if (!restaurantData?.restaurants) {
    return false;
  }
  
  const result = Array.isArray(restaurantData.restaurants) && restaurantData.restaurants.length > 0;
  return result;
};

/**
 * Get the first restaurant from the API response
 * @param {Object} restaurantData - Response from restaurants-onboarding API
 * @returns {Object|null} - First restaurant object or null
 */
export const getFirstRestaurant = (restaurantData) => {
  if (!hasRestaurant(restaurantData)) return null;
  return restaurantData.restaurants[0];
};

/**
 * Check if "One Month Sales Information" is completed
 * @param {Object} restaurantData - Response from restaurants-onboarding API
 * @returns {boolean} - True if One Month Sales Information is completed
 */
export const hasOneMonthSalesInfo = (restaurantData) => {
  const restaurant = getFirstRestaurant(restaurantData);
  if (!restaurant) return false;
  return restaurant[RESTAURANT_STATUS_KEYS.ONE_MONTH_SALES_INFO] === true;
};

/**
 * Check if sales information data is complete (all 4 fields filled)
 * @param {any} salesInformationData - Sales information data from store
 * @returns {boolean} - True if all required fields are filled
 */
export const isSalesInformationComplete = (salesInformationData) => {
  if (!salesInformationData) return false;

  // Extract data from various response formats
  let data = null;
  if (Array.isArray(salesInformationData)) {
    if (salesInformationData.length === 0) return false;
    data = salesInformationData[0];
  } else if (salesInformationData.results) {
    if (Array.isArray(salesInformationData.results) && salesInformationData.results.length > 0) {
      data = salesInformationData.results[0];
    } else {
      data = salesInformationData.results;
    }
  } else if (salesInformationData.data) {
    if (Array.isArray(salesInformationData.data) && salesInformationData.data.length > 0) {
      data = salesInformationData.data[0];
    } else {
      data = salesInformationData.data;
    }
  } else {
    data = salesInformationData;
  }

  // Check if all 4 required fields have non-null values
  if (data) {
    return (
      data.sales !== null && data.sales !== undefined &&
      data.expenses !== null && data.expenses !== undefined &&
      data.labour !== null && data.labour !== undefined &&
      data.cogs !== null && data.cogs !== undefined
    );
  }

  return false;
};

/**
 * Determine the appropriate route based on onboarding status
 * @param {Object} params - Status parameters
 * @param {boolean} params.hasRestaurant - Whether restaurant exists
 * @param {boolean} params.hasOneMonthSalesInfo - Whether One Month Sales Info is complete
 * @param {boolean} params.hasSalesData - Whether sales data is complete
 * @param {boolean} params.isOnBoardingCompleted - Whether onboarding is completed
 * @param {string} params.currentPath - Current route path
 * @returns {string|null} - Route to redirect to, or null if no redirect needed
 */
export const getOnboardingRedirectRoute = ({
  hasRestaurant,
  hasOneMonthSalesInfo,
  hasSalesData,
  isOnBoardingCompleted,
  currentPath,
}) => {
  // If sales data is complete, user should go to report card
  if (hasSalesData) {
    if (currentPath === ONBOARDING_ROUTES.ONBOARDING) {
      return ONBOARDING_ROUTES.REPORT_CARD;
    }
    return null; // Already on correct path
  }

  // If One Month Sales Info is complete, allow all dashboard routes
  // Only redirect if trying to access onboarding pages
  if (hasOneMonthSalesInfo) {
    // Block onboarding/score/profitability pages - redirect to report card
    if (currentPath === ONBOARDING_ROUTES.ONBOARDING || 
        currentPath === ONBOARDING_ROUTES.SCORE || 
        currentPath === ONBOARDING_ROUTES.PROFITABILITY) {
      return ONBOARDING_ROUTES.REPORT_CARD;
    }
    // Allow all dashboard routes and other paths
    return null;
  }

  // If restaurant exists but One Month Sales Info is not complete
  // Block ALL dashboard routes, block /onboarding, only allow score/profitability
  if (hasRestaurant && !hasOneMonthSalesInfo) {
    // User can access score page or profitability (NOT /onboarding)
    const allowedPaths = [
      ONBOARDING_ROUTES.SCORE,
      ONBOARDING_ROUTES.PROFITABILITY,
      ONBOARDING_ROUTES.CONGRATULATIONS,
    ];
    
    // CRITICAL: If user is on any allowed path, don't redirect - allow access
    if (allowedPaths.includes(currentPath)) {
      return null; // Allow access - user is where they should be
    }
    
    // IMPORTANT: If trying to access /onboarding page, redirect to score
    // User has restaurant, cannot access /onboarding anymore
    if (currentPath === ONBOARDING_ROUTES.ONBOARDING) {
      return ONBOARDING_ROUTES.SCORE;
    }
    
    // If trying to access ANY dashboard route, redirect to score
    if (currentPath.startsWith('/dashboard')) {
      return ONBOARDING_ROUTES.SCORE;
    }
    
    // For other paths, redirect to score
    return ONBOARDING_ROUTES.SCORE;
  }

  // New user with no restaurant - should go through onboarding
  if (!hasRestaurant) {
    if (currentPath === ONBOARDING_ROUTES.ONBOARDING) {
      return null; // Allow access to onboarding
    }
    // If trying to access other routes, redirect to onboarding
    if (currentPath.startsWith('/onboarding')) {
      return null; // Allow onboarding-related routes
    }
    return ONBOARDING_ROUTES.ONBOARDING;
  }

  return null;
};

