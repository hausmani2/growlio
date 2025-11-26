import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../utils/axiosInterceptors';
import useStore from '../store/store';

export const GuidanceContext = createContext(null);

export const useGuidance = () => {
  const context = useContext(GuidanceContext);
  if (!context) {
    throw new Error('useGuidance must be used within GuidanceProvider');
  }
  return context;
};

export const GuidanceProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isOnBoardingCompleted = useStore((state) => state.isOnBoardingCompleted);
  const [hasSeenGuidance, setHasSeenGuidance] = useState(null); // null = not checked yet, true = seen, false = not seen
  const [hasSeenDataGuidance, setHasSeenDataGuidance] = useState(null); // null = not checked yet, true = seen, false = not seen
  const [popups, setPopups] = useState([]);
  const [dataGuidancePopups, setDataGuidancePopups] = useState([]);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);
  const [currentDataGuidanceIndex, setCurrentDataGuidanceIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isDataGuidanceActive, setIsDataGuidanceActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('');
  const hasInitializedRef = useRef(false); // Track if we've initialized guidance status

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
    try {
      const response = await apiGet('/authentication/user/guidance-status/');
      // Use false as default instead of true, so guidance shows by default
      const hasSeen = response.data?.has_seen_user_guidance ?? false;
      const hasSeenData = response.data?.has_seen_user_guidance_data ?? false;
      setHasSeenGuidance(hasSeen);
      setHasSeenDataGuidance(hasSeenData);
      return { hasSeen, hasSeenData };
    } catch (error) {
      console.error('❌ Failed to check guidance status:', error);
      // On error, default to false to allow guidance to show
      setHasSeenGuidance(false);
      setHasSeenDataGuidance(false);
      return { hasSeen: false, hasSeenData: false };
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
      
      if (isDataGuidance) {
        const dataGuidanceKeys = [
          'close-your-days',
          'add-actual-weekly-sales',
          'actual-weekly-sales-table',
          'actual-weekly-sales-totals',
          'actual-weekly-cogs-performance',
          'actual-weekly-cogs-totals',
          'actual-weekly-labor-performance',
          'actual-weekly-labor-totals',
          'change-display-format',
          'expand-category-details',
          'summary_table',
          'week_selector'
        ];
        
        const filteredPopups = allPopups
          .filter(popup => 
            popup.page === pageName && 
            popup.is_active === true && 
            dataGuidanceKeys.includes(popup.key)
          )
          .sort((a, b) => a.id - b.id);
        
        setDataGuidancePopups(filteredPopups);
        return filteredPopups;
      } else {
        // Regular guidance: sidebar popups + week_selector (only on budget page)
        const allowedSidebarKeys = ['sidebar_budget', 'sidebar_dashboard', 'sidebar_profit-loss', 'sidebar_profit_loss', 'sidebar_onboarding', 'week_selector', 'summary_table'];
        
        const filteredPopups = allPopups
          .filter(popup => 
            popup.page === pageName && 
            popup.is_active === true && 
            allowedSidebarKeys.includes(popup.key)
          )
          .map(popup => popup.key === 'sidebar_profit_loss' ? { ...popup, key: 'sidebar_profit-loss' } : popup)
          .sort((a, b) => {
            // summary_table first, then sidebar items, then week_selector last
            if (a.key === 'summary_table' && b.key !== 'summary_table') return -1;
            if (b.key === 'summary_table' && a.key !== 'summary_table') return 1;
            if (a.key === 'week_selector' && b.key !== 'week_selector') return 1;
            if (b.key === 'week_selector' && a.key !== 'week_selector') return -1;
            return a.id - b.id;
          });
        
        setPopups(filteredPopups);
        return filteredPopups;
      }
    } catch (error) {
      console.error('❌ Failed to fetch guidance popups:', error);
      if (isDataGuidance) {
        setDataGuidancePopups([]);
      } else {
        setPopups([]);
      }
      return [];
    }
  }, []);

  // Mark guidance as completed
  const markGuidanceAsSeen = useCallback(async () => {
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
      console.error('❌ Failed to mark guidance as seen:', error);
      // Still close the guidance even if API call fails
      setIsActive(false);
      setHasSeenGuidance(true);
    }
  }, []);

  // Mark data guidance as completed
  const markDataGuidanceAsSeen = useCallback(async () => {
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
    
    // Always check local state first - if user has seen data guidance, don't show it
    if (!forceShow && hasSeenDataGuidance === true) {
      return;
    }
    
    if (!forceShow && !skipStatusCheck) {
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

    const pagePopups = await fetchPopups(pageName, true);
    
    if (pagePopups.length > 0) {
      let retryCount = 0;
      const maxRetries = 15;
      
      const checkForElements = () => {
        const allElements = Array.from(document.querySelectorAll('[data-guidance]')).map(el => 
          el.getAttribute('data-guidance')
        );
        
        const validPopups = pagePopups.filter(popup => allElements.includes(popup.key));
        
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
      
      setTimeout(checkForElements, 1000);
    } else {
      setIsDataGuidanceActive(false);
    }
  }, [location.pathname, hasSeenGuidance, hasSeenDataGuidance, checkGuidanceStatus, fetchPopups]);

  // Start guidance tour
  const startGuidance = useCallback(async (forceShow = false) => {
    const pageName = getPageNameFromRoute(location.pathname);
    setCurrentPage(pageName);
    
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
      if (!forceShow) {
        // Only show data guidance if user has seen regular guidance but not data guidance
        if (hasSeenGuidance === true && hasSeenDataGuidance !== true) {
          if (hasSeenDataGuidance === null) {
            const { hasSeenData } = await checkGuidanceStatus();
            if (hasSeenData !== true) {
              startDataGuidance(false, true);
            }
          } else {
            startDataGuidance(false, true);
          }
        }
      }
      return;
    }

    const pagePopups = await fetchPopups(pageName);
    
    if (pagePopups.length > 0) {
      setTimeout(() => {
        const allElements = Array.from(document.querySelectorAll('[data-guidance]')).map(el => 
          el.getAttribute('data-guidance')
        );
        
        const validPopups = pagePopups.filter(popup => allElements.includes(popup.key));
        
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
  }, [location.pathname, hasSeenGuidance, checkGuidanceStatus, fetchPopups, startDataGuidance]);

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
    const token = useStore.getState().token;
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
                  
          // Simply use the API response - NO automatic marking
          // The backend should handle marking existing users as having seen guidance
          // API call to mark as seen ONLY happens when user completes/skips guidance
          setHasSeenGuidance(hasSeen);
          setHasSeenDataGuidance(hasSeenData);
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
          } else {
            // New user - allow them to see guidance
            setHasSeenGuidance(false);
            setHasSeenDataGuidance(false);
          }
        }
      };
      initializeGuidanceStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, not on route changes

  // Initialize guidance on route change
  useEffect(() => {
    setLoading(true);
    setIsActive(false);
    setIsDataGuidanceActive(false);
    setCurrentPopupIndex(0);
    setCurrentDataGuidanceIndex(0);
    
    // Refresh guidance status from backend on route change to ensure it's in sync
    const refreshStatus = async () => {
      try {
        const { hasSeen, hasSeenData } = await checkGuidanceStatus();
        // Only update if we got valid responses
        if (hasSeen !== null && hasSeenData !== null) {
          setHasSeenGuidance(hasSeen);
          setHasSeenDataGuidance(hasSeenData);
        }
      } catch (error) {
        console.error('Failed to refresh guidance status on route change:', error);
      }
    };
    
    refreshStatus();
    
    const timer = setTimeout(() => {
      const showDataGuidance = sessionStorage.getItem('show_data_guidance_after_user_guidance');
      if (showDataGuidance === 'true') {
        sessionStorage.removeItem('show_data_guidance_after_user_guidance');
        startDataGuidance(false, true);
        return;
      }
      
      const wasNavigatingToDashboard = sessionStorage.getItem('guidance_navigate_to_dashboard');
      if (wasNavigatingToDashboard === 'true' && location.pathname === '/dashboard') {
        sessionStorage.removeItem('guidance_navigate_to_dashboard');
        startGuidance();
      } else {
        startGuidance();
      }
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
    checkElementExists,
    startGuidance: (forceShow) => startGuidance(forceShow),
    startDataGuidance: (forceShow) => startDataGuidance(forceShow),
    markGuidanceAsSeen,
    markDataGuidanceAsSeen,
    setHasSeenGuidance, // Expose setter for external use
    setHasSeenDataGuidance, // Expose setter for external use
  };

  return (
    <GuidanceContext.Provider value={value}>
      {children}
    </GuidanceContext.Provider>
  );
};

