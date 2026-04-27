import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/axiosInterceptors';
import useStore from '../store/store';

export const GuidanceContext = createContext(null);

export const useGuidance = () => {
  const context = useContext(GuidanceContext);
  if (!context) {
    // Return default values instead of throwing error to prevent crashes
    // This allows components to work even if GuidanceProvider is not available
    console.warn('useGuidance called outside GuidanceProvider, returning default values');
    return {
      startGuidance: () => Promise.resolve(),
      startDataGuidance: () => Promise.resolve(),
      stopGuidance: () => {},
      hasSeenGuidance: null,
      hasSeenDataGuidance: null,
      isActive: false,
      isDataGuidanceActive: false,
      popups: [],
      dataGuidancePopups: [],
      currentPopupIndex: 0,
      currentDataGuidanceIndex: 0,
      loading: false,
      currentPage: '',
      dismissGuidanceUIOnly: () => {},
    };
  }
  return context;
};

export const GuidanceProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isOnBoardingCompleted = useStore((state) => state.isOnBoardingCompleted);
  const [hasSeenGuidance, setHasSeenGuidance] = useState(null); // null = not checked yet, true = seen, false = not seen
  const [hasSeenDataGuidance, setHasSeenDataGuidance] = useState(null); // null = not checked yet, true = seen, false = not seen
  const [hasGuidanceForExpense, setHasGuidanceForExpense] = useState(null); // null = not checked yet, true = seen, false = not seen
  const [popups, setPopups] = useState([]);
  const [dataGuidancePopups, setDataGuidancePopups] = useState([]);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
  const [currentDataGuidanceIndex, setCurrentDataGuidanceIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isDataGuidanceActive, setIsDataGuidanceActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('');
  const hasInitializedRef = useRef(false); // Track if we've initialized guidance status
  const isCheckingStatusRef = useRef(false); // Track if we're currently checking status to prevent infinite loops
  const lastCheckedPathnameRef = useRef(''); // Track last pathname we checked to prevent duplicate calls
  const hasAutoStartedExpenseGuidanceRef = useRef(false); // Prevent repeated auto-start loops on the expense step
  const isDataGuidanceActiveRef = useRef(false);
  const hasSeenDataGuidanceRef = useRef(null);
  const dashboardGuidanceRetryTimerRef = useRef(null);

  useEffect(() => {
    isDataGuidanceActiveRef.current = isDataGuidanceActive;
  }, [isDataGuidanceActive]);

  useEffect(() => {
    hasSeenDataGuidanceRef.current = hasSeenDataGuidance;
  }, [hasSeenDataGuidance]);

  const getAuthToken = () => {
    // Axios interceptors often use localStorage; guidance logic must match that reality.
    const storeToken = useStore.getState().token;
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return storeToken || localToken || null;
  };

  const isGuidanceDebugEnabled = () => {
    try {
      return sessionStorage.getItem('debug_guidance') === 'true';
    } catch {
      return false;
    }
  };

  const isStaticFallbackEnabled = () => {
    // Default OFF: backend API is source of truth for title/text.
    // Turn ON only for debugging/emergency:
    // sessionStorage.setItem('guidance_static_fallback','true')
    try {
      return sessionStorage.getItem('guidance_static_fallback') === 'true';
    } catch {
      return false;
    }
  };

  /**
   * Data-guidance is a global tour (dashboard + P&L + expense onboarding).
   * The Budget page should NOT auto-run data guidance because it causes cross-page noise
   * and incorrectly implies per-page completion based on the global flag.
   */
  const isDataGuidanceAutoEnabledForPage = useCallback((pageName) => {
    if (pageName === 'budget') return false;
    return true;
  }, []);

  const debugLog = (...args) => {
    if (!isGuidanceDebugEnabled()) return;
    // Use a consistent prefix so it’s easy to filter in devtools
    // eslint-disable-next-line no-console
    console.log('[Guidance]', ...args);
  };

  // Map route paths to page names
  const getPageNameFromRoute = (pathname) => {
    // Remove leading slash and normalize
    const path = pathname.replace(/^\//, '').replace(/\/$/, '');
    
    // Map common routes to page names
    const routeMap = {
      'congratulations': 'congratulations',
      'onboarding': 'onboarding',
      'onboarding/basic-information': 'onboarding_basic_information',
      'onboarding/labor-information': 'onboarding_labor_information',
      'onboarding/food-cost-details': 'onboarding_food_cost_details',
      'onboarding/sales-channels': 'onboarding_sales_channels',
      'onboarding/expense': 'onboarding_expense',
      'dashboard': 'dashboard',
      'dashboard/budget': 'budget',
      'budget': 'budget',
      'dashboard/profit-loss': 'profit_loss',
      'dashboard/report-card': 'report_card',
      'dashboard/basic-information': 'basic_information',
      'dashboard/labor-information': 'labor_information',
      'dashboard/food-cost-details': 'food_cost_details',
      'dashboard/sales-channels': 'sales_channels',
      'dashboard/expense': 'expense',
      'dashboard/profile': 'profile',
      'dashboard/support': 'support',
      'dashboard/faq': 'faq',
      'admin/users': 'admin_users',
      'admin/tooltips': 'admin_tooltips',
      'superadmin/guidance-popups': 'superadmin_guidance_popups',
    };
    
    return routeMap[path] || path.replace(/\//g, '_');
  };

  // Check if user has seen guidance
  const checkGuidanceStatus = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isCheckingStatusRef.current) {
      // Return null to indicate we're already checking
      return { hasSeen: null, hasSeenData: null };
    }
    
    // Check if user is authenticated before making API call
    const token = getAuthToken();
    const isAuthenticated = !!token;
    
    // If not authenticated, skip API call and return default values
    if (!isAuthenticated) {
      setHasSeenGuidance(false);
      setHasSeenDataGuidance(false);
      setHasGuidanceForExpense(false);
      return { hasSeen: false, hasSeenData: false };
    }
    
    // Mark as checking to prevent concurrent calls
    isCheckingStatusRef.current = true;
    
    try {
      const response = await apiGet('/authentication/user/guidance-status/');
      // Use false as default instead of true, so guidance shows by default
      const hasSeen = response.data?.has_seen_user_guidance ?? false;
      const hasSeenData = response.data?.has_seen_user_guidance_data ?? false;
      const hasExpense = response.data?.has_guidance_for_expense ?? false;
      setHasSeenGuidance(hasSeen);
      setHasSeenDataGuidance(hasSeenData);
      setHasGuidanceForExpense(hasExpense);
      debugLog('guidance-status', { hasSeen, hasSeenData, hasExpense, path: location?.pathname });
      return { hasSeen, hasSeenData };
    } catch (error) {
      // Handle 401 errors gracefully - user is not authenticated
      // Don't log or show errors for 401 as this is expected on public routes
      if (error.response?.status === 401) {
        // Silently handle 401 - user is not authenticated, which is expected
        setHasSeenGuidance(false);
        setHasSeenDataGuidance(false);
        setHasGuidanceForExpense(false);
        return { hasSeen: false, hasSeenData: false };
      }
      
      // For other errors, log but don't break the flow
      console.error('❌ Failed to check guidance status:', error);
      // On error, default to false to allow guidance to show
      setHasSeenGuidance(false);
      setHasSeenDataGuidance(false);
      setHasGuidanceForExpense(false);
      return { hasSeen: false, hasSeenData: false };
    } finally {
      // Reset the checking flag after the call completes
      isCheckingStatusRef.current = false;
    }
  }, []);

  // Static/default popups for each page
  const getStaticPopups = useCallback((pageName) => {
    const staticPopups = {
      'onboarding_basic_information': [
        {
          id: 1,
          page: 'onboarding_basic_information',
          key: 'step_navigation_bar',
          title: 'Step Navigation Bar',
          text: 'This is your onboarding progress tracker. You can see all 5 steps here: Basic Information, Sales Channels, Labor Information, Food Cost Details, and Expenses. Complete each step in order to proceed to the next one.',
          is_active: true,
        },
        {
          id: 2,
          page: 'onboarding_basic_information',
          key: 'step_1_basic_information',
          title: 'Step 1: Basic Information',
          text: 'This is the first step of your onboarding. Fill in your restaurant\'s basic details like company name, number of locations, and location information. Once you complete this step, click "Save & Continue" to move to Step 2: Sales Channels.',
          is_active: true,
        },
        {
          id: 3,
          page: 'onboarding_basic_information',
          key: 'step_2_sales_channels',
          title: 'Step 2: Sales Channels',
          text: 'After completing Step 1, you\'ll move to Step 2: Sales Channels. Here you\'ll configure which sales channels your restaurant uses.',
          is_active: true,
        },
        {
          id: 4,
          page: 'onboarding_basic_information',
          key: 'step_3_labor_information',
          title: 'Step 3: Labor Information',
          text: 'After Step 2, you\'ll move to Step 3: Labor Information. Here you\'ll set your labor goals and preferences.',
          is_active: true,
        },
        {
          id: 5,
          page: 'onboarding_basic_information',
          key: 'step_4_food_cost_details',
          title: 'Step 4: Food Cost Details',
          text: 'After Step 3, you\'ll move to Step 4: Food Cost Details. Here you\'ll set your food cost goals and delivery preferences.',
          is_active: true,
        },
        {
          id: 6,
          page: 'onboarding_basic_information',
          key: 'step_5_expenses',
          title: 'Step 5: Expenses',
          text: 'After Step 4, you\'ll move to Step 5: Expenses - the final step! Here you\'ll add your fixed and variable costs.',
          is_active: true,
        },
      ],
      'congratulations': [
        {
          id: 1,
          page: 'congratulations',
          key: 'welcome_title',
          title: 'Welcome to Growlio!',
          text: 'Welcome! We\'re excited to have you here. Growlio helps you manage your restaurant\'s finances with ease. Let\'s get started on your journey to better profitability.',
          is_active: true,
        },
        {
          id: 2,
          page: 'congratulations',
          key: 'welcome_description',
          title: 'How Growlio Works',
          text: 'Growlio focuses on percentages, not just dollar amounts. When your sales change, your food and labor budgets automatically adjust. This helps you stay profitable no matter what happens with your sales.',
          is_active: true,
        },
        {
          id: 3,
          page: 'congratulations',
          key: 'welcome_get_started_button',
          title: 'Ready to Begin?',
          text: 'Click "Let\'s get started!" to begin setting up your restaurant. The process is quick and easy - we\'ll guide you through each step.',
          is_active: true,
        },
      ],
      'onboarding': [
        {
          id: 1,
          page: 'onboarding',
          key: 'restaurant_setup_title',
          title: 'Let\'s Set Up Your Restaurant',
          text: 'This is where your restaurant setup begins. We\'ll ask you a few simple questions to get your restaurant configured in Growlio. Don\'t worry - it only takes a few minutes!',
          is_active: true,
        },
        {
          id: 2,
          page: 'onboarding',
          key: 'restaurant_setup_option',
          title: 'Register Your Restaurant',
          text: 'This option is selected by default. It means you\'re creating a new restaurant profile on Growlio. Once you click "Get Started", we\'ll begin collecting your restaurant\'s basic information.',
          is_active: true,
        },
        {
          id: 3,
          page: 'onboarding',
          key: 'restaurant_setup_get_started_button',
          title: 'Start the Setup Process',
          text: 'Click this button to begin the onboarding process. You\'ll start with basic information like your restaurant name and location. We\'ll guide you through each step.',
          is_active: true,
        },
      ],
      'onboarding_sales_channels': [
        {
          id: 1,
          page: 'onboarding_sales_channels',
          key: 'step_navigation_bar',
          title: 'Step Navigation Bar',
          text: 'You\'re now on Step 2: Sales Channels. Complete this step to unlock Step 3: Labor Information.',
          is_active: true,
        },
        {
          id: 2,
          page: 'onboarding_sales_channels',
          key: 'step_1_basic_information',
          title: 'Step 1: Basic Information',
          text: 'You\'ve completed Step 1: Basic Information. You can click here to go back and review your basic information if needed.',
          is_active: true,
        },
        {
          id: 3,
          page: 'onboarding_sales_channels',
          key: 'step_2_sales_channels',
          title: 'Step 2: Sales Channels',
          text: 'Here you\'ll configure your sales channels. Select which channels your restaurant uses (In-Store, Online, App, Third-Party). Once you complete this step, click "Save & Continue" to move to Step 3: Labor Information.',
          is_active: true,
        },
        {
          id: 4,
          page: 'onboarding_sales_channels',
          key: 'step_3_labor_information',
          title: 'Step 3: Labor Information',
          text: 'After completing Step 2, you\'ll move to Step 3: Labor Information. Here you\'ll set your labor goals and preferences.',
          is_active: true,
        },
        {
          id: 5,
          page: 'onboarding_sales_channels',
          key: 'step_4_food_cost_details',
          title: 'Step 4: Food Cost Details',
          text: 'After Step 3, you\'ll move to Step 4: Food Cost Details. Here you\'ll set your food cost goals and delivery preferences.',
          is_active: true,
        },
        {
          id: 6,
          page: 'onboarding_sales_channels',
          key: 'step_5_expenses',
          title: 'Step 5: Expenses',
          text: 'After Step 4, you\'ll move to Step 5: Expenses - the final step! Here you\'ll add your fixed and variable costs.',
          is_active: true,
        },
      ],
      'onboarding_labor_information': [
        {
          id: 1,
          page: 'onboarding_labor_information',
          key: 'step_navigation_bar',
          title: 'Step Navigation Bar',
          text: 'You\'re now on Step 3: Labor Information. Complete this step to unlock Step 4: Food Cost Details.',
          is_active: true,
        },
        {
          id: 2,
          page: 'onboarding_labor_information',
          key: 'step_1_basic_information',
          title: 'Step 1: Basic Information',
          text: 'You\'ve completed Step 1: Basic Information. You can click here to go back and review your basic information if needed.',
          is_active: true,
        },
        {
          id: 3,
          page: 'onboarding_labor_information',
          key: 'step_2_sales_channels',
          title: 'Step 2: Sales Channels',
          text: 'You\'ve completed Step 2: Sales Channels. You can click here to go back and review your sales channels if needed.',
          is_active: true,
        },
        {
          id: 4,
          page: 'onboarding_labor_information',
          key: 'step_3_labor_information',
          title: 'Step 3: Labor Information',
          text: 'Here you\'ll set your labor goals and preferences. Fill in your target labor percentage and other labor details. Once you complete this step, click "Save & Continue" to move to Step 4: Food Cost Details.',
          is_active: true,
        },
        {
          id: 5,
          page: 'onboarding_labor_information',
          key: 'step_4_food_cost_details',
          title: 'Step 4: Food Cost Details',
          text: 'After completing Step 3, you\'ll move to Step 4: Food Cost Details. Here you\'ll set your food cost goals and delivery preferences.',
          is_active: true,
        },
        {
          id: 6,
          page: 'onboarding_labor_information',
          key: 'step_5_expenses',
          title: 'Step 5: Expenses',
          text: 'After Step 4, you\'ll move to Step 5: Expenses - the final step! Here you\'ll add your fixed and variable costs.',
          is_active: true,
        },
      ],
      'onboarding_food_cost_details': [
        {
          id: 1,
          page: 'onboarding_food_cost_details',
          key: 'step_navigation_bar',
          title: 'Step Navigation Bar',
          text: 'You\'re now on Step 4: Food Cost Details. Complete this step to unlock Step 5: Expenses.',
          is_active: true,
        },
        {
          id: 2,
          page: 'onboarding_food_cost_details',
          key: 'step_1_basic_information',
          title: 'Step 1: Basic Information',
          text: 'You\'ve completed Step 1: Basic Information. You can click here to go back and review your basic information if needed.',
          is_active: true,
        },
        {
          id: 3,
          page: 'onboarding_food_cost_details',
          key: 'step_2_sales_channels',
          title: 'Step 2: Sales Channels',
          text: 'You\'ve completed Step 2: Sales Channels. You can click here to go back and review your sales channels if needed.',
          is_active: true,
        },
        {
          id: 4,
          page: 'onboarding_food_cost_details',
          key: 'step_3_labor_information',
          title: 'Step 3: Labor Information',
          text: 'You\'ve completed Step 3: Labor Information. You can click here to go back and review your labor information if needed.',
          is_active: true,
        },
        {
          id: 5,
          page: 'onboarding_food_cost_details',
          key: 'step_4_food_cost_details',
          title: 'Step 4: Food Cost Details',
          text: 'Here you\'ll set your food cost goals and delivery preferences. Fill in your target COGS percentage and delivery days. Once you complete this step, click "Save & Continue" to move to Step 5: Expenses.',
          is_active: true,
        },
        {
          id: 6,
          page: 'onboarding_food_cost_details',
          key: 'step_5_expenses',
          title: 'Step 5: Expenses',
          text: 'After completing Step 4, you\'ll move to Step 5: Expenses - the final step! Here you\'ll add your fixed and variable costs.',
          is_active: true,
        },
      ],
      'onboarding_expense': [
        {
          id: 1,
          page: 'onboarding_expense',
          key: 'step_navigation_bar',
          title: 'Step Navigation Bar',
          text: 'You\'re now on Step 5: Expenses - the final step! Complete this step to finish your onboarding.',
          is_active: true,
        },
        {
          id: 2,
          page: 'onboarding_expense',
          key: 'step_1_basic_information',
          title: 'Step 1: Basic Information',
          text: 'You\'ve completed Step 1: Basic Information. You can click here to go back and review your basic information if needed.',
          is_active: true,
        },
        {
          id: 3,
          page: 'onboarding_expense',
          key: 'step_2_sales_channels',
          title: 'Step 2: Sales Channels',
          text: 'You\'ve completed Step 2: Sales Channels. You can click here to go back and review your sales channels if needed.',
          is_active: true,
        },
        {
          id: 4,
          page: 'onboarding_expense',
          key: 'step_3_labor_information',
          title: 'Step 3: Labor Information',
          text: 'You\'ve completed Step 3: Labor Information. You can click here to go back and review your labor information if needed.',
          is_active: true,
        },
        {
          id: 5,
          page: 'onboarding_expense',
          key: 'step_4_food_cost_details',
          title: 'Step 4: Food Cost Details',
          text: 'You\'ve completed Step 4: Food Cost Details. You can click here to go back and review your food cost details if needed.',
          is_active: true,
        },
        {
          id: 6,
          page: 'onboarding_expense',
          key: 'step_5_expenses',
          title: 'Step 5: Expenses',
          text: 'This is the final step! Here you\'ll add your fixed and variable costs. Fill in all your expenses and review your totals. Once you complete this step, click "Save & Continue" to finish your onboarding and proceed to the API call.',
          is_active: true,
        },
        {
          id: 7,
          page: 'onboarding_expense',
          key: 'expense_continue_button',
          title: 'Complete Onboarding',
          text: 'Click "Save & Continue" to complete your onboarding setup. This will save all your information and take you to your dashboard. You\'re all done!',
          is_active: true,
        },
        // Expense onboarding (field-level) guidance — used as fallback when API popups are missing
        {
          id: 101,
          page: 'onboarding_expense',
          key: 'total_weekly_expenses',
          title: 'Total Weekly Expenses',
          text: 'This is the estimated total of your active operating expenses converted to a weekly view (monthly expenses are divided by 4.33). Use this to compare against weekly sales and plan week-to-week performance.',
          is_active: true,
        },
        {
          id: 102,
          page: 'onboarding_expense',
          key: 'total_monthly_expenses',
          title: 'Total Monthly Expenses',
          text: 'This is the estimated total of your active operating expenses converted to a monthly view (weekly expenses are scaled using 4.33 weeks per month). Use this to understand your baseline monthly cash needs.',
          is_active: true,
        },
        {
          id: 103,
          page: 'onboarding_expense',
          key: 'expense_first_toggle',
          title: 'Turn an Expense On/Off',
          text: 'Use this switch to include or exclude an expense from your totals. Turn it off for seasonal, paused, or not-yet-applicable expenses—Growlio will keep it saved but won’t count it in totals.',
          is_active: true,
        },
        {
          id: 104,
          page: 'onboarding_expense',
          key: 'expense_first_type',
          title: 'Choose Dollar vs Percent',
          text: 'Select whether this expense is a fixed dollar amount ($) or a percentage (%). Use % for items tied to sales (like royalty/ad fund), and $ for standard bills (like rent, utilities, subscriptions).',
          is_active: true,
        },
        {
          id: 105,
          page: 'onboarding_expense',
          key: 'expense_first_frequency',
          title: 'Set Weekly vs Monthly',
          text: 'Choose how often this expense occurs. Pick Weekly for costs billed each week, and Monthly for costs billed once per month—Growlio will automatically convert it into both weekly and monthly totals.',
          is_active: true,
        },
        {
          id: 106,
          page: 'onboarding_expense',
          key: 'expense_first_amount',
          title: 'Enter the Amount',
          text: 'Enter the expense value based on the selected type and frequency. If you chose %, enter a percent value (e.g., 6.5). If you chose $, enter the dollar amount—Growlio will calculate the weekly/monthly impact automatically.',
          is_active: true,
        },
        {
          id: 107,
          page: 'onboarding_expense',
          key: 'expense_first_monthly_total',
          title: 'Monthly Total for This Expense',
          text: 'This shows the monthly impact of this expense based on your selections. If you entered a weekly amount, Growlio converts it to monthly using 4.33 weeks per month.',
          is_active: true,
        },
        {
          id: 108,
          page: 'onboarding_expense',
          key: 'expense_first_weekly_total',
          title: 'Weekly Total for This Expense',
          text: 'This shows the weekly impact of this expense based on your selections. If you entered a monthly amount, Growlio converts it to weekly by dividing by 4.33.',
          is_active: true,
        },
      ],
      // Dashboard "Operating Expenses" page uses the same UI anchors; provide the same fallback.
      'expense': [
        {
          id: 101,
          page: 'expense',
          key: 'total_weekly_expenses',
          title: 'Total Weekly Expenses',
          text: 'This is the estimated total of your active operating expenses converted to a weekly view (monthly expenses are divided by 4.33). Use this to compare against weekly sales and plan week-to-week performance.',
          is_active: true,
        },
        {
          id: 102,
          page: 'expense',
          key: 'total_monthly_expenses',
          title: 'Total Monthly Expenses',
          text: 'This is the estimated total of your active operating expenses converted to a monthly view (weekly expenses are scaled using 4.33 weeks per month). Use this to understand your baseline monthly cash needs.',
          is_active: true,
        },
        {
          id: 103,
          page: 'expense',
          key: 'expense_first_toggle',
          title: 'Turn an Expense On/Off',
          text: 'Use this switch to include or exclude an expense from your totals. Turn it off for seasonal, paused, or not-yet-applicable expenses—Growlio will keep it saved but won’t count it in totals.',
          is_active: true,
        },
        {
          id: 104,
          page: 'expense',
          key: 'expense_first_type',
          title: 'Choose Dollar vs Percent',
          text: 'Select whether this expense is a fixed dollar amount ($) or a percentage (%). Use % for items tied to sales (like royalty/ad fund), and $ for standard bills (like rent, utilities, subscriptions).',
          is_active: true,
        },
        {
          id: 105,
          page: 'expense',
          key: 'expense_first_frequency',
          title: 'Set Weekly vs Monthly',
          text: 'Choose how often this expense occurs. Pick Weekly for costs billed each week, and Monthly for costs billed once per month—Growlio will automatically convert it into both weekly and monthly totals.',
          is_active: true,
        },
        {
          id: 106,
          page: 'expense',
          key: 'expense_first_amount',
          title: 'Enter the Amount',
          text: 'Enter the expense value based on the selected type and frequency. If you chose %, enter a percent value (e.g., 6.5). If you chose $, enter the dollar amount—Growlio will calculate the weekly/monthly impact automatically.',
          is_active: true,
        },
        {
          id: 107,
          page: 'expense',
          key: 'expense_first_monthly_total',
          title: 'Monthly Total for This Expense',
          text: 'This shows the monthly impact of this expense based on your selections. If you entered a weekly amount, Growlio converts it to monthly using 4.33 weeks per month.',
          is_active: true,
        },
        {
          id: 108,
          page: 'expense',
          key: 'expense_first_weekly_total',
          title: 'Weekly Total for This Expense',
          text: 'This shows the weekly impact of this expense based on your selections. If you entered a monthly amount, Growlio converts it to weekly by dividing by 4.33.',
          is_active: true,
        },
      ],
      'budget': [
        {
          id: 1,
          page: 'budget',
          key: 'labor_rate_confirmation_title',
          title: 'Labor Rate Confirmation',
          text: 'This modal appears when you add sales data for a new week. It helps you confirm your labor rate - you can use last week\'s rate or enter a new one. Accurate labor rates ensure better profit/loss analysis.',
          is_active: true,
        },
        {
          id: 2,
          page: 'budget',
          key: 'labor_rate_confirmation_message',
          title: 'Confirm Your Labor Rate',
          text: 'Review the labor rate information shown here. You can use last week\'s rate if it hasn\'t changed, or enter a new rate if your labor costs have changed.',
          is_active: true,
        },
        {
          id: 3,
          page: 'budget',
          key: 'labor_rate_use_last_week_button',
          title: 'Use Last Week\'s Rate',
          text: 'Click this button to use last week\'s labor rate. This will automatically fill in the labor rate field with the previous week\'s value.',
          is_active: true,
        },
        {
          id: 4,
          page: 'budget',
          key: 'add_sales_data_title',
          title: 'Add Sales Data for Week',
          text: 'This is where you enter your weekly sales data. Fill in the budgeted sales, actual sales, and other details for each day of the week.',
          is_active: true,
        },
        {
          id: 5,
          page: 'budget',
          key: 'daily_sales_data_section',
          title: 'Daily Sales Data',
          text: 'Enter your daily sales data here. For each day, you can set whether the restaurant is open or closed, enter budgeted sales, actual sales, and other metrics.',
          is_active: true,
        },
        {
          id: 6,
          page: 'budget',
          key: 'budget_dashboard_title',
          title: 'Weekly Budgeted Dashboard',
          text: 'This is your main budget dashboard. Here you can see your weekly budget, estimated profit or loss, and all your financial metrics. Use it to plan your week and track your performance.',
          is_active: true,
        },
      ],
    };

    return staticPopups[pageName] || [];
  }, []);

  // Fetch popups for current page - ONLY from API, no static fallbacks
  const fetchPopups = useCallback(async (pageName, isDataGuidance = false) => {
    try {
      const response = await apiGet('/admin_access/guidance-popups/');
      const allPopups = response.data || [];
      debugLog('fetchPopups: api returned', {
        pageName,
        isDataGuidance,
        total: allPopups.length,
        keys: allPopups.map((p) => ({ page: p.page, key: p.key, is_active: p.is_active })),
      });

      // Some screens reuse the same UI but have different "page" names in routes.
      // Allow backend to configure once (e.g., onboarding_expense) and still display on dashboard expense page.
      const resolvePageNames = (name) => {
        if (name === 'expense') return ['expense', 'onboarding_expense'];
        // Sidebar anchors are shared across dashboard and budget routes.
        // Keep backward compatibility for CMS rows saved under either page.
        if (name === 'budget') return ['budget', 'dashboard'];
        return [name];
      };
      const acceptablePages = resolvePageNames(pageName);
      
      if (isDataGuidance) {
        // Budget: do not auto-run data guidance on this page (see isDataGuidanceAutoEnabledForPage).
        // We still allow fetching other data guidance popups for other pages normally.
        if (!isDataGuidanceAutoEnabledForPage(pageName)) {
          setDataGuidancePopups([]);
          return [];
        }

        // Data guidance keys are PAGE-SCOPED to prevent cross-page leakage.
        // IMPORTANT: Budget must never show the dashboard-only week selector help tooltip.
        const baseKeysByPage = {
          dashboard: [
            'close-your-days',
            // Global LIO chat widget (bottom-right floating button)
            'lio_chat_widget',
            'add-actual-weekly-sales',
            'actual-weekly-sales-table',
            'actual-weekly-sales-totals',
            'actual-weekly-cogs-performance',
            'actual-weekly-cogs-totals',
            'actual-weekly-labor-performance',
            'actual-weekly-labor-totals',
            // Close Out Your Day(s) header week picker (DOM: data-guidance="week_selector_help")
            'week_selector_help',
            // Back-compat key (DB rows may still be saved as week_selector)
            'week_selector',
          ],
          profit_loss: ['change-display-format', 'expand-category-details'],
          // Intentionally excluded from auto data guidance (see early return above).
          budget: ['summary_table', 'week_selector'],
          onboarding_expense: [
            'total_weekly_expenses',
            'total_monthly_expenses',
            'expense_first_toggle',
            'expense_first_type',
            'expense_first_frequency',
            'expense_first_amount',
            'expense_first_monthly_total',
            'expense_first_weekly_total',
          ],
          expense: [
            'total_weekly_expenses',
            'total_monthly_expenses',
            'expense_first_toggle',
            'expense_first_type',
            'expense_first_frequency',
            'expense_first_amount',
            'expense_first_monthly_total',
            'expense_first_weekly_total',
          ],
        };

        // Some pages share anchors (e.g., Summary tables appear on multiple screens).
        // Keep common keys explicit per page to avoid accidental bleed.
        const dataGuidanceKeys = baseKeysByPage[pageName] || [];

        const profitLossDomKeys = new Set(['change-display-format', 'expand-category-details']);
        const popupMatchesDataGuidancePage = (popup) => {
          if (acceptablePages.includes(popup.page)) return true;
          // CMS rows sometimes use page "dashboard" for P&L tooltips; anchors live on /dashboard/profit-loss
          if (pageName === 'profit_loss' && popup.page === 'dashboard' && profitLossDomKeys.has(popup.key)) {
            return true;
          }
          return false;
        };
        
        // Filter popups by current page and ensure key is in allowed list
        const filteredPopups = allPopups
          .filter(popup => 
            popupMatchesDataGuidancePage(popup) &&
            popup.is_active === true && 
            dataGuidanceKeys.includes(popup.key)
          )
          .sort((a, b) => {
            // Keep a predictable, UX-friendly order regardless of backend IDs.
            // Dashboard: show "week selector" hint first (it unlocks the rest of the page context).
            if (pageName === 'dashboard') {
              const rank = (key) => {
                if (key === 'week_selector_help' || key === 'week_selector') return -200;
                if (key === 'close-your-days') return -100;
                return 0;
              };
              const ra = rank(a.key);
              const rb = rank(b.key);
              if (ra !== rb) return ra - rb;
            }
            return a.id - b.id;
          });
        debugLog('fetchPopups: data guidance filter', {
          pageName,
          acceptablePages,
          allowedKeys: dataGuidanceKeys,
          matched: filteredPopups.map((p) => p.key),
          dropped: allPopups
            .filter((p) => acceptablePages.includes(p.page) && p.is_active === true && !dataGuidanceKeys.includes(p.key))
            .map((p) => p.key),
        });

        // Default behavior: backend API is the source of truth.
        // Optional fallback (OFF by default) can be enabled via sessionStorage for debugging.
        const shouldFallbackToStatic =
          isStaticFallbackEnabled() &&
          (pageName === 'onboarding_expense' || pageName === 'expense') &&
          filteredPopups.length === 0;
        const finalPopups = shouldFallbackToStatic
          ? (getStaticPopups(pageName) || []).filter((p) => dataGuidanceKeys.includes(p.key) && p.is_active === true)
          : filteredPopups;

        setDataGuidancePopups(finalPopups);
        return finalPopups;
      } else {
        // Regular guidance: allow ALL active popups for this page.
        // The "admin_access/guidance-popups" endpoint is already the source of truth.
        // A popup will still only render if a DOM element exists with data-guidance="<popup.key>".
        const onboardingBasicInformationOrder = {
          step_navigation_bar: 0,
          step_1_basic_information: 1,
          step_2_sales_channels: 2,
          step_3_labor_information: 3,
          step_4_food_cost_details: 4,
          step_5_expense: 5,
        };
        const budgetPageOrder = {
          sidebar_budget: 0,
          sidebar_dashboard: 1,
          'sidebar_profit-loss': 2,
          sidebar_onboarding: 3,
          summary_table: 4,
          week_selector: 5,
        };

        const normalizeRegularGuidanceKey = (key) => {
          const normalized = String(key || '').trim();
          if (normalized === 'sidebar_profit_loss') return 'sidebar_profit-loss';
          if (
            normalized === 'sidebar_close_out_your_day' ||
            normalized === 'sidebar_close_out_your_days' ||
            normalized === 'sidebar_close_out_your_day(s)'
          ) {
            return 'sidebar_dashboard';
          }
          return normalized;
        };

        const filteredPopups = allPopups
          .filter((popup) => acceptablePages.includes(popup.page) && popup.is_active === true)
          .map((popup) => ({ ...popup, key: normalizeRegularGuidanceKey(popup.key) }))
          .sort((a, b) => {
            if (pageName === 'onboarding_basic_information') {
              const aRank = onboardingBasicInformationOrder[a.key];
              const bRank = onboardingBasicInformationOrder[b.key];
              const hasExplicitRank = Number.isInteger(aRank) || Number.isInteger(bRank);

              if (hasExplicitRank) {
                const normalizedARank = Number.isInteger(aRank) ? aRank : Number.MAX_SAFE_INTEGER;
                const normalizedBRank = Number.isInteger(bRank) ? bRank : Number.MAX_SAFE_INTEGER;
                if (normalizedARank !== normalizedBRank) {
                  return normalizedARank - normalizedBRank;
                }
              }
            }

            if (pageName === 'budget') {
              const aRank = budgetPageOrder[a.key];
              const bRank = budgetPageOrder[b.key];
              const hasExplicitRank = Number.isInteger(aRank) || Number.isInteger(bRank);

              if (hasExplicitRank) {
                const normalizedARank = Number.isInteger(aRank) ? aRank : Number.MAX_SAFE_INTEGER;
                const normalizedBRank = Number.isInteger(bRank) ? bRank : Number.MAX_SAFE_INTEGER;
                if (normalizedARank !== normalizedBRank) {
                  return normalizedARank - normalizedBRank;
                }
              }
            }

            // Keep important popups in sensible order when present
            if (a.key === 'summary_table' && b.key !== 'summary_table') return -1;
            if (b.key === 'summary_table' && a.key !== 'summary_table') return 1;
            if (a.key === 'week_selector' && b.key !== 'week_selector') return 1;
            if (b.key === 'week_selector' && a.key !== 'week_selector') return -1;
            return a.id - b.id;
          });

        debugLog('fetchPopups: regular guidance filter', {
          pageName,
          acceptablePages,
          matched: filteredPopups.map((p) => p.key),
        });
        
        setPopups(filteredPopups);
        return filteredPopups;
      }
    } catch (error) {
      console.error('❌ Failed to fetch guidance popups:', error);
      if (isDataGuidance) {
        // Optional fallback on error (OFF by default)
        if (isStaticFallbackEnabled() && (pageName === 'onboarding_expense' || pageName === 'expense')) {
          const fallback = (getStaticPopups(pageName) || []).filter((p) => p.is_active === true);
          setDataGuidancePopups(fallback);
          return fallback;
        }
        setDataGuidancePopups([]);
      } else {
        setPopups([]);
      }
      return [];
    }
  }, []);

  const markExpenseGuidanceAsSeen = useCallback(async () => {
    const token = getAuthToken();
    const isAuthenticated = !!token;

    setHasGuidanceForExpense(true);
    setIsDataGuidanceActive(false);
    setDataGuidancePopups([]);
    setCurrentDataGuidanceIndex(0);
    hasAutoStartedExpenseGuidanceRef.current = true;

    if (!isAuthenticated) {
      debugLog('markExpenseGuidanceAsSeen (unauthenticated) -> local only');
      return;
    }

    try {
      const currentStatus = await apiGet('/authentication/user/guidance-status/');
      await apiPost('/authentication/user/guidance-status/', {
        has_seen_user_guidance: currentStatus.data?.has_seen_user_guidance ?? false,
        has_seen_user_guidance_data: currentStatus.data?.has_seen_user_guidance_data ?? false,
        has_guidance_for_expense: true,
      });
      debugLog('markExpenseGuidanceAsSeen -> posted');
    } catch (error) {
      if (error.response?.status === 401) {
        debugLog('markExpenseGuidanceAsSeen -> 401, local only');
        return;
      }
      console.error('❌ Failed to mark expense guidance as seen:', error);
    }
  }, []);

  const startExpenseGuidance = useCallback(async () => {
    const pageName = getPageNameFromRoute(location.pathname);
    if (pageName !== 'onboarding_expense' && pageName !== 'expense') return;

    // Do not start expense guidance until the user dismisses the Operating Expenses disclaimer.
    // This keeps the UX focused and prevents overlapping overlays.
    try {
      if (sessionStorage.getItem('expense_disclaimer_ack_v1') !== 'true') {
        debugLog('startExpenseGuidance -> blocked by disclaimer gate');
        return;
      }
    } catch {
      // If storage isn't available, continue (fail open).
    }

    const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/admin/login'];
    if (publicRoutes.includes(location.pathname)) return;

    if (hasGuidanceForExpense === true) {
      debugLog('startExpenseGuidance -> already seen, skipping');
      return;
    }

    // If status hasn't loaded yet, let the normal flow load it first
    if (hasGuidanceForExpense === null) {
      debugLog('startExpenseGuidance -> status not ready (null), skipping for now');
      return;
    }

    // Prevent repeating on rerenders / route refresh
    if (hasAutoStartedExpenseGuidanceRef.current) {
      debugLog('startExpenseGuidance -> already auto-started in this session, skipping');
      return;
    }

    // Ensure the overlay is allowed to render while we start the tour.
    // GuidanceOverlay returns null when `loading` is true.
    setLoading(false);

    // Fetch expense guidance popups via the "data guidance" channel so GuidanceOverlay can render them
    debugLog('startExpenseGuidance -> fetching popups');
    const pagePopups = await fetchPopups(pageName, true);

    if (pagePopups.length === 0) {
      debugLog('startExpenseGuidance -> no popups returned from API');
      setIsDataGuidanceActive(false);
      setLoading(false);
      return;
    }

    let retryCount = 0;
    const maxRetries = 20;

    const checkForElements = () => {
      const keysOnPage = Array.from(document.querySelectorAll('[data-guidance]')).map((el) =>
        el.getAttribute('data-guidance')
      );
      const uniqueKeys = [...new Set(keysOnPage)];
      const valid = pagePopups.filter((p) => uniqueKeys.includes(p.key));

      debugLog('startExpenseGuidance -> element check', {
        retryCount,
        foundAnchors: uniqueKeys,
        popupsFromApi: pagePopups.map((p) => p.key),
        validPopups: valid.map((p) => p.key),
      });

      if (valid.length > 0) {
        setDataGuidancePopups(valid);
        setCurrentDataGuidanceIndex(0);
        setIsDataGuidanceActive(true);
        hasAutoStartedExpenseGuidanceRef.current = true;
        setLoading(false);
        debugLog('startExpenseGuidance -> started', { count: valid.length });
        return;
      }

      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(checkForElements, 500);
      } else {
        debugLog('startExpenseGuidance -> failed: anchors not found');
        setIsDataGuidanceActive(false);
        setLoading(false);
      }
    };

    setTimeout(checkForElements, 1200);
  }, [location.pathname, hasGuidanceForExpense, fetchPopups]);

  // Mark guidance as completed
  const markGuidanceAsSeen = useCallback(async () => {
    // Check if user is authenticated before making API call
    const token = getAuthToken();
    const isAuthenticated = !!token;
    
    if (!isAuthenticated) {
      // If not authenticated, just close guidance locally
      setIsActive(false);
      setHasSeenGuidance(true);
      return;
    }
    
    try {
      // Get current status to preserve has_seen_user_guidance_data
      const currentStatus = await apiGet('/authentication/user/guidance-status/');
      const currentDataGuidanceStatus = currentStatus.data?.has_seen_user_guidance_data ?? false;
      
      // Send both flags in payload
      const response = await apiPost('/authentication/user/guidance-status/', {
        has_seen_user_guidance: true,
        has_seen_user_guidance_data: currentDataGuidanceStatus
      });
      
      setHasSeenGuidance(true);
      setIsActive(false);
      setCurrentPopupIndex(0);
      setPopups([]);
      
      if (!currentDataGuidanceStatus) {
        sessionStorage.setItem('show_data_guidance_after_user_guidance', 'true');
      }
    } catch (error) {
      // Handle 401 errors gracefully
      if (error.response?.status === 401) {
        // User is not authenticated, just close guidance locally
        setIsActive(false);
        setHasSeenGuidance(true);
        return;
      }
      
      console.error('❌ Failed to mark guidance as seen:', error);
      // Still close the guidance even if API call fails
      setIsActive(false);
      setHasSeenGuidance(true);
    }
  }, []);

  // Mark data guidance as completed
  const markDataGuidanceAsSeen = useCallback(async () => {
    // Check if user is authenticated before making API call
    const token = getAuthToken();
    const isAuthenticated = !!token;
    
    if (!isAuthenticated) {
      // If not authenticated, just close guidance locally
      setIsDataGuidanceActive(false);
      setHasSeenDataGuidance(true);
      return;
    }
    
    try {
      // Check current status first to preserve has_seen_user_guidance
      const currentStatus = await apiGet('/authentication/user/guidance-status/');
      const response = await apiPost('/authentication/user/guidance-status/', {
        has_seen_user_guidance: currentStatus.data?.has_seen_user_guidance ?? true,
        has_seen_user_guidance_data: true
      });
      setHasSeenDataGuidance(true);
      setIsDataGuidanceActive(false);
      setDataGuidancePopups([]);
    } catch (error) {
      // Handle 401 errors gracefully
      if (error.response?.status === 401) {
        // User is not authenticated, just close guidance locally
        setIsDataGuidanceActive(false);
        setHasSeenDataGuidance(true);
        return;
      }
      
      console.error('❌ Failed to mark data guidance as seen:', error);
      // Still close the guidance even if API call fails
      setIsDataGuidanceActive(false);
      setHasSeenDataGuidance(true);
    }
  }, []);

  // Start data guidance tour
  const startDataGuidance = useCallback(async (forceShow = false, skipStatusCheck = false) => {
    const pageName = getPageNameFromRoute(location.pathname);
    
    const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/admin/login'];
    if (publicRoutes.includes(location.pathname)) {
      return;
    }

    // Expense guidance has its own completion flag (`has_guidance_for_expense`).
    // Even if the global data-guidance tour is incomplete, we MUST NOT show the
    // expense/onboarding-expense tooltips once that flag is true.
    if (!forceShow && (pageName === 'expense' || pageName === 'onboarding_expense')) {
      if (hasGuidanceForExpense === true) {
        debugLog('startDataGuidance -> blocked by hasGuidanceForExpense', { pageName, path: location.pathname });
        return;
      }
      // If status hasn't loaded yet, do nothing (avoid flashing guidance while status resolves)
      if (hasGuidanceForExpense === null) {
        debugLog('startDataGuidance -> expense status not ready (null), skipping for now', { pageName, path: location.pathname });
        return;
      }
    }
    
    // If skipStatusCheck is true, we're explicitly bypassing status checks (e.g., for navigation-based guidance)
    // This allows guidance to show even if status says user has seen it
    if (!forceShow && !skipStatusCheck) {
      // Normal flow - check status
      if (hasSeenDataGuidance === true) {
        return;
      }
      if (hasSeenGuidance !== true || hasSeenDataGuidance === true) {
        return;
      }
      if (hasSeenGuidance === null || hasSeenDataGuidance === null) {
        const { hasSeen, hasSeenData } = await checkGuidanceStatus();
        if (hasSeen !== true || hasSeenData === true) {
          return;
        }
      } else {
        return;
      }
    } else if (forceShow) {
      setHasSeenDataGuidance(false);
    }
    // If skipStatusCheck is true, continue without checking status

    // Do not auto-run data guidance on Budget page.
    // Budget "week_selector" guidance is managed explicitly elsewhere (if ever needed),
    // but should not appear as part of the global data guidance tour.
    if (!forceShow && isDataGuidanceAutoEnabledForPage(pageName) === false) {
      debugLog('startDataGuidance -> blocked for page', { pageName, path: location.pathname });
      setIsDataGuidanceActive(false);
      setDataGuidancePopups([]);
      return;
    }

    const pagePopups = await fetchPopups(pageName, true);
    
    if (pagePopups.length > 0) {
      let retryCount = 0;
      // Dashboard tables (sales / COGS / labor) mount only after week + dashboardData load — allow extra time
      const maxRetries = pageName === 'dashboard' ? 45 : 25;
      
      const checkForElements = () => {
        // Check both regular DOM and modal content (modals might be in portals)
        const allElements = Array.from(document.querySelectorAll('[data-guidance]')).map(el => 
          el.getAttribute('data-guidance')
        );
        
        // Also check for elements in modal containers
        const modalContainers = document.querySelectorAll('.ant-modal-body, [role="dialog"]');
        modalContainers.forEach(container => {
          const modalElements = Array.from(container.querySelectorAll('[data-guidance]')).map(el => 
            el.getAttribute('data-guidance')
          );
          allElements.push(...modalElements);
        });
        
        const uniqueElements = [...new Set(allElements)]; // Remove duplicates
        const hasAnchor = (k) => uniqueElements.includes(k);
        const validPopups = pagePopups
          .filter((popup) => {
            if (hasAnchor(popup.key)) return true;
            // Close Out Your Day(s) uses data-guidance="week_selector_help".
            // Only allow the week_selector -> week_selector_help fallback on the ACTUAL dashboard route.
            if (
              location.pathname === '/dashboard' &&
              popup.key === 'week_selector' &&
              hasAnchor('week_selector_help') &&
              !hasAnchor('week_selector')
            ) {
              return true;
            }
            return false;
          })
          .map((popup) => {
            if (
              location.pathname === '/dashboard' &&
              popup.key === 'week_selector' &&
              !hasAnchor('week_selector') &&
              hasAnchor('week_selector_help')
            ) {
              return { ...popup, key: 'week_selector_help' };
            }
            return popup;
          });
        
        if (validPopups.length > 0) {
          setDataGuidancePopups(validPopups);
          setCurrentDataGuidanceIndex(0); // Reset to first popup
          setIsDataGuidanceActive(true);
          return;
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(checkForElements, 500);
        } else {
          setIsDataGuidanceActive(false);
        }
      };
      
      // For dashboard page, check if we're looking for modal elements (close-your-days)
      // If so, wait a bit longer for modal to render
      const hasModalElements = pagePopups.some(popup => popup.key === 'close-your-days');
      const initialDelay = hasModalElements ? 2000 : pageName === 'dashboard' ? 600 : 1200;
      setTimeout(checkForElements, initialDelay);
    } else {
      setIsDataGuidanceActive(false);
    }
  }, [location.pathname, hasSeenGuidance, hasSeenDataGuidance, checkGuidanceStatus, fetchPopups]);

  // Start guidance tour
  const startGuidance = useCallback(async (forceShow = false) => {
    const pageName = getPageNameFromRoute(location.pathname);
    setCurrentPage(pageName);
    debugLog('startGuidance: invoked', { forceShow, pageName, path: location.pathname, hasSeenGuidance, hasSeenDataGuidance });
    
    const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/admin/login'];
    if (publicRoutes.includes(location.pathname)) {
      setLoading(false);
      setIsActive(false);
      return;
    }
    
    if (!forceShow) {
      if (hasSeenGuidance === null) {
        const { hasSeen, hasSeenData } = await checkGuidanceStatus();
        if (hasSeen === true) {
          setIsActive(false);
          setLoading(false);
          // Only show data guidance if user hasn't seen it yet
          if (hasSeenData !== true) {
            startDataGuidance(false, true);
          }
          return;
        }
      } else if (hasSeenGuidance === true) {
        setIsActive(false);
        setLoading(false);
        // Check if user has seen data guidance - if both are true, don't show anything
        if (hasSeenDataGuidance === null) {
          const { hasSeenData } = await checkGuidanceStatus();
          if (hasSeenData !== true) {
            startDataGuidance(false, true);
          }
          // If hasSeenData is true, don't show anything - just return
          return;
        } else if (hasSeenDataGuidance === true) {
          // Both flags are true - don't show anything
          return;
        } else {
          // hasSeenDataGuidance is false - show data guidance
          startDataGuidance(false, true);
          return;
        }
      }
    } else {
      setHasSeenGuidance(false);
    }

    // Dashboard page doesn't have regular guidance popups, only data guidance
    // Skip regular guidance on dashboard and go straight to data guidance if needed
    if (pageName === 'dashboard') {
      setIsActive(false);
      setLoading(false);
      if (!forceShow && hasSeenDataGuidance !== true) {
        if (hasSeenDataGuidance === null) {
          const { hasSeenData } = await checkGuidanceStatus();
          if (hasSeenData !== true) {
            startDataGuidance(false, true);
          }
        } else {
          startDataGuidance(false, true);
        }
      }
      return;
    }

    if (pageName === 'profit_loss') {
      setIsActive(false);
      setLoading(false);
      if (!forceShow && hasSeenDataGuidance !== true) {
        startDataGuidance(false, true);
      }
      return;
    }

    const pagePopups = await fetchPopups(pageName);
    
    if (pagePopups.length > 0) {
      setTimeout(() => {
        const allElements = Array.from(document.querySelectorAll('[data-guidance]')).map(el => 
          el.getAttribute('data-guidance')
        );
        
        let validPopups = pagePopups.filter(popup => allElements.includes(popup.key));
        if (pageName === 'budget' && validPopups.length > 1) {
          const budgetPageOrder = {
            sidebar_budget: 0,
            sidebar_dashboard: 1,
            'sidebar_profit-loss': 2,
            sidebar_onboarding: 3,
            summary_table: 4,
            week_selector: 5,
          };
          validPopups = [...validPopups].sort((a, b) => {
            const aRank = budgetPageOrder[a.key];
            const bRank = budgetPageOrder[b.key];
            const normalizedARank = Number.isInteger(aRank) ? aRank : Number.MAX_SAFE_INTEGER;
            const normalizedBRank = Number.isInteger(bRank) ? bRank : Number.MAX_SAFE_INTEGER;
            if (normalizedARank !== normalizedBRank) {
              return normalizedARank - normalizedBRank;
            }
            return a.id - b.id;
          });
        }
        debugLog('startGuidance: dom check', {
          pageName,
          popupsFromApi: pagePopups.map((p) => p.key),
          anchorsOnPage: allElements,
          validPopups: validPopups.map((p) => p.key),
          invalidPopupsMissingAnchors: pagePopups.filter((p) => !allElements.includes(p.key)).map((p) => p.key),
        });
        
        if (validPopups.length > 0) {
          setPopups(validPopups);
          setCurrentPopupIndex(0);
          setIsActive(true);
        } else {
          setIsActive(false);
        }
        setLoading(false);
      }, 1000);
    } else {
      setIsActive(false);
      setLoading(false);
    }
  }, [location.pathname, hasSeenGuidance, hasSeenDataGuidance, checkGuidanceStatus, fetchPopups, startDataGuidance]);

  // Go to next popup
  const nextPopup = useCallback(() => {
    const currentPopup = popups[currentPopupIndex];
    const isLastPopup = currentPopupIndex === popups.length - 1;
    const isWeekSelector = currentPopup?.key === 'week_selector';
    
    if (isWeekSelector) {
      if (location.pathname !== '/dashboard') {
        sessionStorage.setItem('guidance_navigate_to_dashboard', 'true');
        navigate('/dashboard');
      } else {
        if (isLastPopup) {
          markGuidanceAsSeen();
        } else {
          setCurrentPopupIndex(currentPopupIndex + 1);
        }
      }
    } else if (isLastPopup) {
      markGuidanceAsSeen();
    } else {
      setCurrentPopupIndex(currentPopupIndex + 1);
    }
  }, [currentPopupIndex, popups, location.pathname, navigate, markGuidanceAsSeen]);

  // Skip all popups
  const skipGuidance = useCallback(() => {
    markGuidanceAsSeen();
  }, [markGuidanceAsSeen]);

  /** Close the overlay only (no API). Guidance can show again on next visit/reload. */
  const dismissGuidanceUIOnly = useCallback(() => {
    setIsActive(false);
    setIsDataGuidanceActive(false);
  }, []);

  // Get current popup
  const getCurrentPopup = useCallback(() => {
    if (!isActive || popups.length === 0 || currentPopupIndex >= popups.length) {
      return null;
    }
    return popups[currentPopupIndex];
  }, [isActive, popups, currentPopupIndex]);

  // Check if element exists for current popup
  const checkElementExists = useCallback((key) => {
    const element = document.querySelector(`[data-guidance="${key}"]`);
    return !!element;
  }, []);

  // Initialize guidance status on app load
  useEffect(() => {
    // Skip guidance status check on public routes or when not authenticated
    const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/admin/login'];
    const isPublicRoute = publicRoutes.includes(location.pathname);
    
    // Check if user is authenticated (has token)
    const token = getAuthToken();
    const isAuthenticated = !!token;
    
    // Only check guidance status if user is authenticated and not on a public route
    if (isPublicRoute || !isAuthenticated) {
      setHasSeenGuidance(true); // Default to true to prevent showing guidance on public routes
      setHasSeenDataGuidance(true);
      return;
    }
    
    // Check guidance status once on app initialization (only once, not on every route change)
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const initializeGuidanceStatus = async () => {
        try {
          const response = await apiGet('/authentication/user/guidance-status/');
          const hasSeen = response.data?.has_seen_user_guidance ?? false;
          const hasSeenData = response.data?.has_seen_user_guidance_data ?? false;
          const hasExpense = response.data?.has_guidance_for_expense ?? false;
                  
          // Simply use the API response - NO automatic marking
          // The backend should handle marking existing users as having seen guidance
          // API call to mark as seen ONLY happens when user completes/skips guidance
          setHasSeenGuidance(hasSeen);
          setHasSeenDataGuidance(hasSeenData);
          setHasGuidanceForExpense(hasExpense);
          debugLog('initialize guidance-status', { hasSeen, hasSeenData, hasExpense });
        } catch (error) {
          console.error('❌ Failed to initialize guidance status:', error);
          // On error, default based on onboarding status
          // Existing users (completed onboarding) should have has_seen_user_guidance = true in backend
          // New users should have has_seen_user_guidance = false in backend
          const currentOnBoardingStatus = useStore.getState().isOnBoardingCompleted;
          if (currentOnBoardingStatus) {
            // Existing user - backend should have marked them, but if API fails, assume true
            setHasSeenGuidance(true);
            setHasSeenDataGuidance(true);
            setHasGuidanceForExpense(true);
          } else {
            // New user - allow them to see guidance
            setHasSeenGuidance(false);
            setHasSeenDataGuidance(false);
            setHasGuidanceForExpense(false);
          }
        }
      };
      initializeGuidanceStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, not on route changes

  // Initialize guidance on route change
  useEffect(() => {
    if (isGuidanceDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.log('[Guidance] TRACE ENABLED', { path: location.pathname });
    }
    // Prevent multiple simultaneous calls
    if (isCheckingStatusRef.current) {
      return;
    }
    
    setLoading(true);
    setIsActive(false);
    setIsDataGuidanceActive(false);
    setCurrentPopupIndex(0);
    setCurrentDataGuidanceIndex(0);
    
    // Check if user is authenticated and not on a public route
    const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/admin/login'];
    const isPublicRoute = publicRoutes.includes(location.pathname);
    const token = getAuthToken();
    const isAuthenticated = !!token;
    
    // Skip guidance checks on public routes or when not authenticated
    if (isPublicRoute || !isAuthenticated) {
      setLoading(false);
      setIsActive(false);
      setIsDataGuidanceActive(false);
      setHasSeenGuidance(true); // Prevent showing guidance on public routes
      setHasSeenDataGuidance(true);
      return;
    }
    
    // Check for navigation flags FIRST before refreshing status
    // This ensures programmatic navigation works correctly
    const showDataGuidance = sessionStorage.getItem('show_data_guidance_after_user_guidance');
    const wasNavigatingToDashboard = sessionStorage.getItem('guidance_navigate_to_dashboard');
    const wasNavigatingToProfitLoss = sessionStorage.getItem('guidance_navigate_to_profit_loss');
    
    // If we have navigation flags, handle them immediately without blocking on status refresh
    if (showDataGuidance === 'true' || wasNavigatingToDashboard === 'true' || wasNavigatingToProfitLoss === 'true') {
      const timer = setTimeout(() => {
        if (showDataGuidance === 'true') {
          sessionStorage.removeItem('show_data_guidance_after_user_guidance');
          const pageName = getPageNameFromRoute(location.pathname);
          if (isDataGuidanceAutoEnabledForPage(pageName)) {
            startDataGuidance(false, true);
          } else {
            debugLog('navigation-flag: showDataGuidance suppressed for page', { pageName, path: location.pathname });
          }
          return;
        }
        
        if (wasNavigatingToDashboard === 'true' && location.pathname === '/dashboard') {
          sessionStorage.removeItem('guidance_navigate_to_dashboard');
          startGuidance();
          return;
        }
        
        if (wasNavigatingToProfitLoss === 'true' && location.pathname === '/dashboard/profit-loss') {
          sessionStorage.removeItem('guidance_navigate_to_profit_loss');
          // Show data guidance on profit_loss page - use skipStatusCheck to bypass status check
          // Use longer delay to ensure page is fully loaded and elements are rendered
          setTimeout(() => {
            startDataGuidance(false, true);
          }, 2000);
          return;
        }
      }, 1000);
      
      // Still refresh status in background, but don't let it block navigation-based guidance
      const refreshStatus = async () => {
        // Prevent concurrent calls
        if (isCheckingStatusRef.current) {
          return;
        }
        try {
          const { hasSeen, hasSeenData } = await checkGuidanceStatus();
          if (hasSeen !== null && hasSeenData !== null) {
            setHasSeenGuidance(hasSeen);
            setHasSeenDataGuidance(hasSeenData);
          }
        } catch (error) {
          // Silently handle errors - already handled in checkGuidanceStatus
        }
      };
      refreshStatus();
      
      return () => clearTimeout(timer);
    }
    
    // No navigation flags - normal route change, refresh status first
    // Only refresh if we haven't checked this pathname recently
    const lastCheckTime = sessionStorage.getItem('guidance_status_last_check');
    const now = Date.now();
    const thirtySeconds = 30 * 1000; // 30 seconds cache
    
    // If we already checked status for this pathname, skip ONLY the status refresh.
    // Do NOT return early here, because returning early can prevent startGuidance()
    // from running (especially in React StrictMode where effects mount/unmount twice).
    const alreadyCheckedThisPath = lastCheckedPathnameRef.current === location.pathname;
    
    // Only refresh if it's been more than 30 seconds since last check
    if (!alreadyCheckedThisPath && (!lastCheckTime || (now - parseInt(lastCheckTime)) > thirtySeconds)) {
      const refreshStatus = async () => {
        // Prevent concurrent calls
        if (isCheckingStatusRef.current) {
          return;
        }
        try {
          const { hasSeen, hasSeenData } = await checkGuidanceStatus();
          if (hasSeen !== null && hasSeenData !== null) {
            setHasSeenGuidance(hasSeen);
            setHasSeenDataGuidance(hasSeenData);
            // Store timestamp of last check and current pathname
            sessionStorage.setItem('guidance_status_last_check', now.toString());
            lastCheckedPathnameRef.current = location.pathname;
          }
        } catch (error) {
          // Silently handle errors - already handled in checkGuidanceStatus
        }
      };
      
      refreshStatus();
    } else {
      // Use cached status, just update loading state
      setLoading(false);
      if (!alreadyCheckedThisPath) {
        lastCheckedPathnameRef.current = location.pathname;
      }
    }
    
    const timer = setTimeout(() => {
      debugLog('route-change effect -> calling startGuidance', { path: location.pathname });
      startGuidance();
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Auto-start expense guidance when backend says it’s not completed
  useEffect(() => {
    const pageName = getPageNameFromRoute(location.pathname);
    if (pageName !== 'onboarding_expense' && pageName !== 'expense') {
      // Reset per-session flag when leaving expense page so a future visit can re-run if backend still says false
      hasAutoStartedExpenseGuidanceRef.current = false;
      return;
    }

    // Only auto-start when explicitly false (backend controlled)
    if (hasGuidanceForExpense === false) {
      debugLog('auto-start condition met (hasGuidanceForExpense=false)');
      startExpenseGuidance();
    } else {
      debugLog('auto-start skipped', { hasGuidanceForExpense });
    }
  }, [location.pathname, hasGuidanceForExpense, startExpenseGuidance]);

  // Listen for force show guidance event
  useEffect(() => {
    const handleForceShow = () => {
      startGuidance(true);
    };

    window.addEventListener('forceShowGuidance', handleForceShow);
    return () => {
      window.removeEventListener('forceShowGuidance', handleForceShow);
    };
  }, [startGuidance]);

  // Close Out Your Day(s): labor/sales/COGS anchors mount only after week + dashboard data load.
  // Retry data guidance when tables are on the page so API-driven keys (e.g. actual-weekly-labor-performance) resolve.
  useEffect(() => {
    const handleDashboardTablesMounted = () => {
      if (location.pathname !== '/dashboard') return;
      if (!getAuthToken()) return;
      if (hasSeenDataGuidanceRef.current === true) return;

      if (dashboardGuidanceRetryTimerRef.current) {
        clearTimeout(dashboardGuidanceRetryTimerRef.current);
      }
      dashboardGuidanceRetryTimerRef.current = setTimeout(() => {
        dashboardGuidanceRetryTimerRef.current = null;
        // If guidance already started with only header anchors, restart so the full tour includes table keys
        if (isDataGuidanceActiveRef.current) {
          setIsDataGuidanceActive(false);
          setCurrentDataGuidanceIndex(0);
        }
        startDataGuidance(false, true);
      }, 700);
    };

    window.addEventListener('growlio-dashboard-tables-mounted', handleDashboardTablesMounted);
    return () => {
      window.removeEventListener('growlio-dashboard-tables-mounted', handleDashboardTablesMounted);
      if (dashboardGuidanceRetryTimerRef.current) {
        clearTimeout(dashboardGuidanceRetryTimerRef.current);
      }
    };
  }, [location.pathname, startDataGuidance]);

  // Get current data guidance popup
  const getCurrentDataGuidancePopup = useCallback(() => {
    if (!isDataGuidanceActive || dataGuidancePopups.length === 0) {
      return null;
    }
    if (currentDataGuidanceIndex >= dataGuidancePopups.length) {
      return null;
    }
    return dataGuidancePopups[currentDataGuidanceIndex];
  }, [isDataGuidanceActive, dataGuidancePopups, currentDataGuidanceIndex]);

  // Go to next data guidance popup
  const nextDataGuidancePopup = useCallback(() => {
    if (currentDataGuidanceIndex < dataGuidancePopups.length - 1) {
      setCurrentDataGuidanceIndex(currentDataGuidanceIndex + 1);
    }
  }, [currentDataGuidanceIndex, dataGuidancePopups.length]);

  const value = {
    hasSeenGuidance,
    hasSeenDataGuidance,
    hasGuidanceForExpense,
    popups,
    dataGuidancePopups,
    currentPopupIndex,
    currentDataGuidanceIndex,
    isActive,
    isDataGuidanceActive,
    setIsDataGuidanceActive,
    loading,
    currentPage,
    getCurrentPopup,
    getCurrentDataGuidancePopup,
    nextPopup,
    nextDataGuidancePopup,
    skipGuidance,
    dismissGuidanceUIOnly,
    checkElementExists,
    startGuidance: (forceShow) => startGuidance(forceShow),
    startDataGuidance: (forceShow) => startDataGuidance(forceShow),
    startExpenseGuidance,
    markGuidanceAsSeen,
    markDataGuidanceAsSeen,
    markExpenseGuidanceAsSeen,
    setHasSeenGuidance, // Expose setter for external use
    setHasSeenDataGuidance, // Expose setter for external use
  };

  return (
    <GuidanceContext.Provider value={value}>
      {children}
    </GuidanceContext.Provider>
  );
};

