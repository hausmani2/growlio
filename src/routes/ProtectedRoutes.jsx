import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store/store';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import { isImpersonating } from '../utils/tokenManager';
import useOnboardingStatus from '../hooks/useOnboardingStatus';
import {
  hasRestaurant,
  hasOneMonthSalesInfo,
  isSalesInformationComplete,
  getOnboardingRedirectRoute,
  ONBOARDING_ROUTES,
  isOnboardingComplete as checkOnboardingComplete,
} from '../utils/onboardingUtils';

const ProtectedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = useRef(false);
  const hasCheckedRestaurantRef = useRef(false); // Track if we've checked restaurant to prevent multiple checks
  const hasRedirectedRef = useRef(false); // Track if we've already redirected to prevent infinite loops
  const redirectTimeoutRef = useRef(null); // Track redirect timeout for cleanup
  const [isCheckingSimulationForDashboard, setIsCheckingSimulationForDashboard] = useState(false);
  const hasCheckedSimulationRef = useRef(false);
  
  // Get onboarding status to determine user mode
  // CRITICAL: This hook provides the decision logic for users with both restaurants
  const { 
    hasRegularRestaurants, 
    hasSimulationRestaurants,
    activateSimulationMode,
    refreshOnboardingStatus
  } = useOnboardingStatus();
  

  // Get store values - using individual selectors to prevent unnecessary re-renders
  // All hooks must be called in the same order on every render
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const storeToken = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const isOnBoardingCompleted = useStore((state) => state.isOnBoardingCompleted);
  const forceOnboardingCheck = useStore((state) => state.forceOnboardingCheck);
  const salesInformationData = useStore((state) => state.salesInformationData);
  const salesInformationLoading = useStore((state) => state.salesInformationLoading);
  const salesInformationError = useStore((state) => state.salesInformationError);
  const getSalesInformation = useStore((state) => state.getSalesInformation);
  const getRestaurantOnboarding = useStore((state) => state.getRestaurantOnboarding);
  const restaurantOnboardingData = useStore((state) => state.restaurantOnboardingData);
  const restaurantOnboardingDataTimestamp = useStore((state) => state.restaurantOnboardingDataTimestamp);
  const getRestaurantSimulation = useStore((state) => state.getRestaurantSimulation);
  const getSimulationOnboardingStatus = useStore((state) => state.getSimulationOnboardingStatus);
  const restaurantSimulationData = useStore((state) => state.restaurantSimulationData);
  const simulationOnboardingStatus = useStore((state) => state.simulationOnboardingStatus);
  
  // Check localStorage first (for cross-tab sync), then sessionStorage (for backward compatibility)
  const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
  const token = storeToken || storedToken;
  
  // Initialize restaurantData from cached store data if available
  // This prevents state being null on navigation when cached data exists
  const getInitialRestaurantData = () => {
    if (restaurantOnboardingData) {
      const now = Date.now();
      const CACHE_DURATION = 5000; // 5 seconds
      const cacheAge = restaurantOnboardingDataTimestamp ? now - restaurantOnboardingDataTimestamp : Infinity;
      // Only use cache if it's fresh (less than 5 seconds old)
      if (cacheAge < CACHE_DURATION) {
        return restaurantOnboardingData;
      }
    }
    return null;
  };
  
  // State to track restaurant and onboarding status
  // Initialize from cached store data to prevent null state on navigation
  const [restaurantData, setRestaurantData] = useState(getInitialRestaurantData);
  const [restaurantCheckLoading, setRestaurantCheckLoading] = useState(!getInitialRestaurantData());

   // Check if user is a simulation user with complete onboarding when on congratulations page
  // These hooks must be declared at the top level, before any conditional returns
  const [isSimulationUserComplete, setIsSimulationUserComplete] = useState(false);
  const [isCheckingSimulation, setIsCheckingSimulation] = useState(false);
  
  // Derived state from restaurant data
  const restaurantExists = hasRestaurant(restaurantData);
  const oneMonthSalesInfoComplete = hasOneMonthSalesInfo(restaurantData);
  const onboardingComplete = checkOnboardingComplete(restaurantData);
  
  // Simple onboarding check function
  const checkOnboardingStatus = async () => {
    try {
      const result = await forceOnboardingCheck();
        
      if (result.success) {
        
        // Update the store state based on the result
        if (result.isComplete) {
          // We need to get the setter from the store
          const setIsOnBoardingCompleted = useStore.getState().setIsOnBoardingCompleted;
          setIsOnBoardingCompleted(true);
        } else {
          const setIsOnBoardingCompleted = useStore.getState().setIsOnBoardingCompleted;
          setIsOnBoardingCompleted(false);
        }
        
        // Store restaurant ID if available
        if (result.restaurantId) {
          localStorage.setItem('restaurant_id', result.restaurantId.toString());
        }
      } else {
        // Set to false on failure
        const setIsOnBoardingCompleted = useStore.getState().setIsOnBoardingCompleted;
        setIsOnBoardingCompleted(false);
      }
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
      // Set to false on error
      const setIsOnBoardingCompleted = useStore.getState().setIsOnBoardingCompleted;
      setIsOnBoardingCompleted(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Update restaurantData when cached store data changes
  useEffect(() => {
    if (restaurantOnboardingData && restaurantOnboardingData !== restaurantData) {
      const now = Date.now();
      const CACHE_DURATION = 5000; // 5 seconds
      const cacheAge = restaurantOnboardingDataTimestamp ? now - restaurantOnboardingDataTimestamp : Infinity;
      // Only update if cache is fresh (less than 5 seconds old)
      if (cacheAge < CACHE_DURATION) {
        setRestaurantData(restaurantOnboardingData);
        setRestaurantCheckLoading(false);
      }
    }
  }, [restaurantOnboardingData, restaurantOnboardingDataTimestamp, restaurantData]);

  // Check if restaurant exists - only once per session
  useEffect(() => {
    // Clear session storage if user is not authenticated (logout scenario)
    if (!isAuthenticated || !token) {
      sessionStorage.removeItem('hasCheckedRestaurant');
      sessionStorage.removeItem('lastProcessedPath');
      hasCheckedRestaurantRef.current = false;
      setRestaurantCheckLoading(false);
      setRestaurantData(null);
      return;
    }
    
    // CRITICAL: Skip restaurant check for super admins when not impersonating
    const isSuperAdminUser = user?.is_superuser;
    const impersonating = isImpersonating();
    
    if (isSuperAdminUser && !impersonating) {
      // Super admins don't need restaurant checks
      setRestaurantCheckLoading(false);
      hasCheckedRestaurantRef.current = true;
      return;
    }
    
    // CRITICAL: If One Month Sales Info is complete and we're navigating between dashboard routes,
    // skip re-checking restaurant data to prevent unnecessary API calls and state resets
    // This prevents the redirect issue when clicking on setup items
    if (oneMonthSalesInfoComplete && location.pathname.startsWith('/dashboard') && restaurantData) {
      setRestaurantCheckLoading(false);
      return;
    }
    
    // CRITICAL: Only skip API call if we already have restaurant data AND we're not on /onboarding/score
    // If we're on /onboarding/score, we might have stale data (empty restaurants array), so re-fetch
    // This handles the case where handleSubmit in OnboardingWrapper navigates here after creating a restaurant
    if (restaurantData && location.pathname !== ONBOARDING_ROUTES.SCORE) {
      setRestaurantCheckLoading(false);
      return;
    }
    
    // If we're on /onboarding/score and have data but restaurants array is empty, re-fetch
    // This handles the case where restaurant was just created
    if (restaurantData && location.pathname === ONBOARDING_ROUTES.SCORE) {
      const hasRestaurants = hasRestaurant(restaurantData);
      if (!hasRestaurants) {
        // Clear the stale data and flags to force re-fetch
        setRestaurantData(null);
        hasCheckedRestaurantRef.current = false;
        sessionStorage.removeItem('hasCheckedRestaurant');
        // Continue to make API call below
      } else {
        setRestaurantCheckLoading(false);
        return;
      }
    }
    
    // If we're already loading, check if it's been too long (stuck)
    // If stuck for more than 5 seconds, clear it and allow retry
    if (restaurantCheckLoading) {
      const loadingStartTime = sessionStorage.getItem('restaurantLoadingStartTime');
      const now = Date.now();
      
      if (loadingStartTime) {
        const loadingDuration = now - parseInt(loadingStartTime);
        if (loadingDuration > 5000) {
          // Been loading for more than 5 seconds - clear it
          setRestaurantCheckLoading(false);
          hasCheckedRestaurantRef.current = false;
          sessionStorage.removeItem('restaurantLoadingStartTime');
          // Continue to make API call
        } else {
          return;
        }
      } else {
        // No start time recorded - might be stuck, clear and retry
        setRestaurantCheckLoading(false);
        hasCheckedRestaurantRef.current = false;
        // Continue to make API call
      }
    }
    
    // If we've already checked in this component and have data, don't check again
    if (hasCheckedRestaurantRef.current && restaurantData) {
      return;
    }
    
    // If we've checked but are still loading, wait
    if (hasCheckedRestaurantRef.current && restaurantCheckLoading) {
      return;
    }
    
    // IMPORTANT: Even if we've checked before, if we don't have data, we need to fetch it
    // The throttle in authSlice will prevent too many concurrent calls
    
    const checkRestaurant = async () => {
      // Don't check if onboarding is already complete and we're on dashboard
      // This prevents infinite loops when user completes onboarding
      if (isOnBoardingCompleted && location.pathname.startsWith('/dashboard')) {
        setRestaurantCheckLoading(false);
        hasCheckedRestaurantRef.current = true;
        sessionStorage.setItem('hasCheckedRestaurant', 'true');
        return;
      }
      
      // Mark as checking IMMEDIATELY to prevent concurrent calls
      hasCheckedRestaurantRef.current = true;
      sessionStorage.setItem('hasCheckedRestaurant', 'true');
      sessionStorage.setItem('restaurantLoadingStartTime', Date.now().toString());
      setRestaurantCheckLoading(true);
      
      // Set a timeout to prevent infinite loading (10 seconds max)
      const loadingTimeout = setTimeout(() => {
        setRestaurantCheckLoading(false);
        hasCheckedRestaurantRef.current = false;
        sessionStorage.removeItem('restaurantLoadingStartTime');
      }, 10000);
      
      try {
        const result = await getRestaurantOnboarding();
        clearTimeout(loadingTimeout);
        
        if (result.success && result.data) {
          // Store the full restaurant data for status checks (even if restaurants array is empty)
          setRestaurantData(result.data);
          clearTimeout(loadingTimeout);
          sessionStorage.removeItem('restaurantLoadingStartTime');
          setRestaurantCheckLoading(false);
        } else {
          // If throttled, clear loading immediately and allow retry
          if (result && result.error === 'Request throttled - please wait') {
            clearTimeout(loadingTimeout);
            sessionStorage.removeItem('restaurantLoadingStartTime');
            setRestaurantCheckLoading(false);
            hasCheckedRestaurantRef.current = false;
            return;
          }
          // If API failed or returned no data, set restaurantData to null
          clearTimeout(loadingTimeout);
          sessionStorage.removeItem('restaurantLoadingStartTime');
          setRestaurantData(null);
          setRestaurantCheckLoading(false);
        }
      } catch (error) {
        clearTimeout(loadingTimeout);
        sessionStorage.removeItem('restaurantLoadingStartTime');
        console.error('❌ [ProtectedRoutes] Error checking restaurant:', error);
        setRestaurantData(null);
        setRestaurantCheckLoading(false);
      }
    };
    
    checkRestaurant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, location.pathname]); // Re-check if auth status changes OR pathname changes (e.g., navigating to /onboarding/score)

  // Handle onboarding redirects based on restaurant and sales info status
  useEffect(() => {
    // CRITICAL: Skip ALL onboarding logic for super admins when not impersonating
    const isSuperAdminUser = user?.is_superuser;
    const impersonating = isImpersonating();
    
    if (isSuperAdminUser && !impersonating) {
      // Super admins should never be redirected to onboarding
      // If they're not on a super admin path, redirect them there
      if (!location.pathname.startsWith('/superadmin')) {
        hasRedirectedRef.current = false;
        navigate('/superadmin/dashboard', { replace: true });
      }
      return;
    }
    
    // CRITICAL: Skip redirect logic if still loading - prevents redirects on page reload
    // This must happen FIRST to prevent redirects before data is loaded
    if (
      restaurantCheckLoading ||
      isLoading ||
      salesInformationLoading ||
      !restaurantData // Don't redirect if we don't have restaurant data yet
    ) {
      return;
    }

    // CRITICAL: If onboarding is completely finished (onboarding_complete: true), 
    // allow ALL routes - user should NOT be redirected to /onboarding
    if (onboardingComplete) {
      hasRedirectedRef.current = false; // Reset redirect flag
      sessionStorage.setItem('lastProcessedPath', location.pathname);
      sessionStorage.removeItem('lastRedirectRoute'); // Clear any pending redirects
      return; // Allow access to all routes - exit early to prevent any redirects
    }

    // CRITICAL: If One Month Sales Info is complete, allow ALL dashboard routes
    // This check must happen AFTER loading checks, to prevent redirects
    // when navigating between dashboard pages or reloading any dashboard page
    if (oneMonthSalesInfoComplete && location.pathname.startsWith('/dashboard')) {
      hasRedirectedRef.current = false; // Reset redirect flag
      sessionStorage.setItem('lastProcessedPath', location.pathname);
      sessionStorage.removeItem('lastRedirectRoute'); // Clear any pending redirects
      return; // Allow access to all dashboard routes - exit early to prevent any redirects
    }

    // CRITICAL: If sales data is complete, allow ALL dashboard routes
    // This prevents redirects when reloading any dashboard page
    const hasSalesData = isSalesInformationComplete(salesInformationData);
    if (hasSalesData && location.pathname.startsWith('/dashboard')) {
      hasRedirectedRef.current = false; // Reset redirect flag
      sessionStorage.setItem('lastProcessedPath', location.pathname);
      sessionStorage.removeItem('lastRedirectRoute'); // Clear any pending redirects
      return; // Allow access to all dashboard routes - exit early to prevent any redirects
    }

    // CRITICAL: Check if user is on an allowed path FIRST, before any other logic
    // This ensures users can access /onboarding/score when restaurant exists
    if (restaurantExists && !oneMonthSalesInfoComplete) {
      const allowedPaths = [
        ONBOARDING_ROUTES.SCORE,
        ONBOARDING_ROUTES.PROFITABILITY,
        ONBOARDING_ROUTES.CONGRATULATIONS,
        '/onboarding/simulation', // Allow simulation onboarding
        '/simulation/dashboard', // Allow simulation dashboard
      ];
      
      // If user is on an allowed path, NEVER redirect - allow access immediately
      if (allowedPaths.includes(location.pathname)) {
        hasRedirectedRef.current = false;
        sessionStorage.setItem('lastProcessedPath', location.pathname);
        sessionStorage.removeItem('lastRedirectRoute');
        return; // Allow access, no redirect needed - this is the correct path
      }
    }

     // CRITICAL: Always allow simulation routes - they handle their own logic
     if (location.pathname === '/onboarding/simulation' || location.pathname === '/simulation/dashboard') {
      hasRedirectedRef.current = false;
      sessionStorage.setItem('lastProcessedPath', location.pathname);
      sessionStorage.removeItem('lastRedirectRoute');
      return; // Allow access to simulation routes - don't return JSX from useEffect
    }
    // Don't process redirects if we don't have restaurant data yet
    // This prevents redirects from triggering before we know the user's status
    if (!restaurantData && restaurantExists === false && isAuthenticated) {
      // Only proceed if we've confirmed there's no restaurant
      // Otherwise wait for the restaurant check to complete
      const hasChecked = sessionStorage.getItem('hasCheckedRestaurant') === 'true';
      if (!hasChecked) {
        return; // Wait for restaurant check to complete
      }
    }

    // Don't redirect if user is already on an allowed onboarding path
    const allowedOnboardingPaths = [
      ONBOARDING_ROUTES.ONBOARDING,
      ONBOARDING_ROUTES.SCORE,
      ONBOARDING_ROUTES.PROFITABILITY,
      ONBOARDING_ROUTES.CONGRATULATIONS,
      '/onboarding/simulation', // Allow simulation onboarding path
      '/simulation/dashboard', // Allow simulation dashboard path
    ];
    
    // Track the last path we processed to prevent duplicate redirects
    const lastProcessedPath = sessionStorage.getItem('lastProcessedPath');
    const lastRedirectRoute = sessionStorage.getItem('lastRedirectRoute');
    
    // If we've already processed this exact path and redirected, don't do it again
    if (lastProcessedPath === location.pathname && hasRedirectedRef.current) {
      // If we're already on the target route, don't redirect again
      if (lastRedirectRoute === location.pathname) {
        return;
      }
      // If we've redirected but haven't reached the target yet, wait
      return;
    }
    
    // CRITICAL: If user is on any dashboard route and has completed onboarding,
    // don't redirect - allow them to stay on whatever dashboard page they're on
    // This prevents redirects when reloading any dashboard page
    if (location.pathname.startsWith('/dashboard')) {
      if (oneMonthSalesInfoComplete || hasSalesData) {
        hasRedirectedRef.current = false;
        sessionStorage.setItem('lastProcessedPath', location.pathname);
        sessionStorage.removeItem('lastRedirectRoute');
        return; // Already on a valid dashboard route, no redirect needed
      }
    }
    
    // If we're already on the correct route based on our status, don't redirect
    if (oneMonthSalesInfoComplete && location.pathname === ONBOARDING_ROUTES.REPORT_CARD) {
      hasRedirectedRef.current = false; // Reset so we can redirect if needed later
      sessionStorage.setItem('lastProcessedPath', location.pathname);
      return; // Already on correct route
    }
    if (hasSalesData && location.pathname === ONBOARDING_ROUTES.REPORT_CARD) {
      hasRedirectedRef.current = false;
      sessionStorage.setItem('lastProcessedPath', location.pathname);
      return; // Already on correct route
    }
    
    // If One Month Sales Info is FALSE, block dashboard and /onboarding
    // BUT: Skip this check if oneMonthSalesInfoComplete is true (already handled above)
    if (restaurantExists && !oneMonthSalesInfoComplete) {
      // If user is trying to access /onboarding page, redirect to score
      if (location.pathname === ONBOARDING_ROUTES.ONBOARDING) {
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          sessionStorage.setItem('lastProcessedPath', location.pathname);
          sessionStorage.setItem('lastRedirectRoute', ONBOARDING_ROUTES.SCORE);
          setTimeout(() => {
            navigate(ONBOARDING_ROUTES.SCORE, { replace: true });
          }, 0);
        }
        return;
      }
      
      // If user is trying to access ANY dashboard route, redirect to score
      // BUT: Only if oneMonthSalesInfoComplete is actually false (double-check to prevent race conditions)
      if (location.pathname.startsWith('/dashboard') && !oneMonthSalesInfoComplete) {
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          sessionStorage.setItem('lastProcessedPath', location.pathname);
          sessionStorage.setItem('lastRedirectRoute', ONBOARDING_ROUTES.SCORE);
          setTimeout(() => {
            navigate(ONBOARDING_ROUTES.SCORE, { replace: true });
          }, 0);
        }
        return;
      }
    }
    
    // Determine if redirect is needed
    const redirectRoute = getOnboardingRedirectRoute({
      hasRestaurant: restaurantExists,
      hasOneMonthSalesInfo: oneMonthSalesInfoComplete,
      hasSalesData,
      isOnBoardingCompleted,
      currentPath: location.pathname,
      isOnboardingComplete: onboardingComplete,
    });

    // Perform redirect if needed - but only once per route change
    // IMPORTANT: Don't redirect if user is already on an allowed path
    if (redirectRoute && location.pathname !== redirectRoute) {
      // CRITICAL: If user is on /onboarding/score and has restaurant with One Month Sales Info = false,
      // they should be allowed to stay there - don't redirect
      if (restaurantExists && !oneMonthSalesInfoComplete) {
        const allowedPaths = [
          ONBOARDING_ROUTES.SCORE,
          ONBOARDING_ROUTES.PROFITABILITY,
          ONBOARDING_ROUTES.CONGRATULATIONS,
        ];
        if (allowedPaths.includes(location.pathname)) {
          // User is on an allowed path, don't redirect
          hasRedirectedRef.current = false;
          sessionStorage.setItem('lastProcessedPath', location.pathname);
          return;
        }
      }
      
      // Check if we've already redirected to this route from this path
      if (lastRedirectRoute === redirectRoute && lastProcessedPath === location.pathname) {
        // Already redirected, don't do it again
        return;
      }
      
      // Only redirect if we haven't redirected for this path yet
      if (!hasRedirectedRef.current || lastProcessedPath !== location.pathname) {
        hasRedirectedRef.current = true;
        sessionStorage.setItem('lastProcessedPath', location.pathname);
        sessionStorage.setItem('lastRedirectRoute', redirectRoute);
        
        // Clear any existing timeout
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
        // Use a small delay to batch navigation and prevent multiple calls
        redirectTimeoutRef.current = setTimeout(() => {
          navigate(redirectRoute, { replace: true });
          redirectTimeoutRef.current = null;
        }, 50);
        
        // Store timeout ID to clear if component unmounts
          // Cleanup function - clear timeout if component unmounts or dependencies change
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
      }
    }

    // Reset redirect ref when pathname changes to an allowed path
    if (allowedOnboardingPaths.includes(location.pathname)) {
      hasRedirectedRef.current = false;
      sessionStorage.setItem('lastProcessedPath', location.pathname);
      sessionStorage.removeItem('lastRedirectRoute');
    }
    
    // Update last processed path if it changed
    if (location.pathname !== lastProcessedPath) {
      sessionStorage.setItem('lastProcessedPath', location.pathname);
      // If we're on a stable route (not redirecting), clear redirect route
      if (!redirectRoute || redirectRoute === location.pathname) {
        sessionStorage.removeItem('lastRedirectRoute');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    restaurantExists,
    oneMonthSalesInfoComplete,
    salesInformationData,
    isOnBoardingCompleted,
    location.pathname,
    restaurantCheckLoading,
    isLoading,
    salesInformationLoading,
    restaurantData, // Add restaurantData to dependencies to ensure we have it before redirecting
  ]);

   // Check if user is a simulation user with complete onboarding when on congratulations page
  // This useEffect must be declared before route checks to avoid hook order issues
  useEffect(() => {
    const isCongratulationsPath = location.pathname === ONBOARDING_ROUTES.CONGRATULATIONS;
    if (isCongratulationsPath && isAuthenticated) {
      // Check cache first to avoid unnecessary API calls
      const cacheKey = 'simulationCheckCongratulations';
      const lastCheckTime = sessionStorage.getItem(`${cacheKey}LastCheck`);
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
      
      // If we have cached data and it's still fresh, skip API call
      if (lastCheckTime && (now - parseInt(lastCheckTime)) < CACHE_DURATION) {
        const cachedComplete = sessionStorage.getItem(`${cacheKey}Complete`);
        if (cachedComplete === 'true') {
          const cachedRestaurantId = sessionStorage.getItem('simulation_restaurant_id');
          if (cachedRestaurantId) {
            setIsSimulationUserComplete(true);
            // Check if user has both regular and simulation restaurants
            const regularRestaurants = restaurantData?.restaurants || restaurantOnboardingData?.restaurants || [];
            const simulationRestaurants = simulationOnboardingStatus?.restaurants || [];
            const hasRegularRestaurantsCheck = Array.isArray(regularRestaurants) && regularRestaurants.length > 0;
            const hasSimulationRestaurantsCheck = Array.isArray(simulationRestaurants) && simulationRestaurants.length > 0;
            // If both APIs have restaurants, navigate to dashboard/report-card instead of simulation/dashboard
            if (hasRegularRestaurantsCheck && hasSimulationRestaurantsCheck) {
              navigate(ONBOARDING_ROUTES.REPORT_CARD, { replace: true });
            } else {
              navigate('/simulation/dashboard', { replace: true });
            }
            return;
          }
        }
        setIsSimulationUserComplete(false);
        setIsCheckingSimulation(false);
        return;
      }
      
      setIsCheckingSimulation(true);
      const checkSimulation = async () => {
        try {
          const simulationResult = await getRestaurantSimulation();
          const isSimulator = simulationResult?.success && simulationResult?.data?.restaurant_simulation === true;
          
          if (isSimulator) {
            const onboardingResult = await getSimulationOnboardingStatus();
            // CRITICAL: Only redirect to simulation dashboard if simulation onboarding API has restaurants
            if (onboardingResult?.success && onboardingResult?.data?.restaurants && onboardingResult.data.restaurants.length > 0) {
              const restaurants = onboardingResult.data.restaurants;
              const completeRestaurant = restaurants.find(
                (r) => r.simulation_restaurant_name !== null && r.simulation_onboarding_complete === true
              );
              
              if (completeRestaurant) {
                // Check if user has both regular and simulation restaurants
                const regularRestaurants = restaurantData?.restaurants || restaurantOnboardingData?.restaurants || [];
                const hasRegularRestaurantsCheck = Array.isArray(regularRestaurants) && regularRestaurants.length > 0;
                const hasSimulationRestaurantsCheck = Array.isArray(restaurants) && restaurants.length > 0;
                
                setIsSimulationUserComplete(true);
                localStorage.setItem('simulation_restaurant_id', completeRestaurant.simulation_restaurant_id.toString());
                // Cache the result
                sessionStorage.setItem(`${cacheKey}Complete`, 'true');
                sessionStorage.setItem(`${cacheKey}LastCheck`, now.toString());
                // If both APIs have restaurants, navigate to dashboard/report-card instead of simulation/dashboard
                if (hasRegularRestaurantsCheck && hasSimulationRestaurantsCheck) {
                  navigate(ONBOARDING_ROUTES.REPORT_CARD, { replace: true });
                } else if (hasSimulationRestaurantsCheck) {
                  // Only redirect to simulation dashboard if simulation onboarding API has restaurants
                  navigate('/simulation/dashboard', { replace: true });
                }
                return;
              }
            }
          }
          setIsSimulationUserComplete(false);
          // Cache the result
          sessionStorage.setItem(`${cacheKey}Complete`, 'false');
          sessionStorage.setItem(`${cacheKey}LastCheck`, now.toString());
        } catch (error) {
          console.error('Error checking simulation status:', error);
          setIsSimulationUserComplete(false);
        } finally {
          setIsCheckingSimulation(false);
        }
      };
      
      checkSimulation();
    }
  }, [location.pathname, isAuthenticated, getRestaurantSimulation, getSimulationOnboardingStatus, navigate]);


  // Check sales information and onboarding status when component mounts
  useEffect(() => {
    // Prevent multiple fetches - use a combination of ref and loading state
    if (hasFetchedRef.current || salesInformationLoading) return;
    
    if (isAuthenticated && token) {
      // Skip onboarding check for superadmins when not impersonating
      const isSuperAdminUser = user?.is_superuser;
      const impersonating = isImpersonating();
      
      if (isSuperAdminUser && !impersonating) {
        // SuperAdmin doesn't need onboarding check - set completion to true and go directly to superadmin
        const setIsOnBoardingCompleted = useStore.getState().setIsOnBoardingCompleted;
        setIsOnBoardingCompleted(true);
        setIsLoading(false);
        hasFetchedRef.current = true;
        return;
      }
      
      // CRITICAL: Wait for initial onboarding APIs to complete before making other API calls
      // These APIs are called in the login function: 
      // 1. simulation/simulation-onboarding/ (GET)
      // 2. /restaurant_v2/restaurants-onboarding/ (GET)
      // We need to ensure these complete before calling getSalesInformation() and checkOnboardingStatus()
      const waitForInitialAPIs = async () => {
        // Check if initial APIs have completed by checking if we have restaurant data
        // Wait up to 5 seconds for the initial APIs to complete
        const maxWaitTime = 5000; // 5 seconds
        const checkInterval = 100; // Check every 100ms
        let elapsedTime = 0;
        
        while (elapsedTime < maxWaitTime) {
          // Check if we have restaurant onboarding data (from login API call)
          const hasRestaurantData = restaurantOnboardingData !== null && restaurantOnboardingData !== undefined;
          // Check if we have simulation onboarding data (from login API call)
          const hasSimulationData = simulationOnboardingStatus !== null && simulationOnboardingStatus !== undefined;
          
          // If we have at least one of the initial API responses, proceed
          // (Note: simulation data might be null for non-simulation users, which is OK)
          if (hasRestaurantData || hasSimulationData || elapsedTime > 2000) {
            // Initial APIs have completed (or we've waited long enough), proceed with other calls
            break;
          }
          
          // Wait before checking again
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          elapsedTime += checkInterval;
        }
      };
      
      // Check if sales information already exists in store
      // For new users, the API might return an empty array [], which is valid data
      // We should only fetch if we haven't fetched before (ref check) and data is truly null/undefined
      const currentSalesData = useStore.getState().salesInformationData;
      const hasSalesData = currentSalesData !== null && currentSalesData !== undefined;
      
      // Only fetch if we truly don't have any data (null/undefined), not if it's an empty array
      // Empty array means we've already checked and the user has no sales data
      const needsSalesFetch = !hasSalesData;
      
      // Mark as fetching immediately to prevent duplicate calls
      hasFetchedRef.current = true;
      
      // Fetch sales information and onboarding status together
      const fetchDataAndCheck = async () => {
        try {
          // CRITICAL: Wait for initial onboarding APIs to complete first
          await waitForInitialAPIs();
          
          // Only fetch sales information if we don't have it
          if (needsSalesFetch) {
            const result = await getSalesInformation();
            // If API call failed, don't proceed with onboarding check
            // This prevents redirecting to dashboard when API fails
            if (!result.success) {
              setIsLoading(false);
              hasFetchedRef.current = false;
              return;
            }
          }
          
          // Clear any cached onboarding status to force fresh check
          sessionStorage.removeItem('onboarding_completion_check_time');
          
          // Then check onboarding status
          await checkOnboardingStatus();
          
          // CRITICAL: Always clear loading state after all API calls complete
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching data:', error);
          setIsLoading(false);
          // Reset ref on error to allow retry
          hasFetchedRef.current = false;
        }
      };
      
      fetchDataAndCheck();
    } else {
      setIsLoading(false);
      hasFetchedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, restaurantOnboardingData, simulationOnboardingStatus]); // Added restaurantOnboardingData and simulationOnboardingStatus to deps

  // Check simulation status if user is trying to access dashboard
  useEffect(() => {
    const isDashboardPath = location.pathname.startsWith('/dashboard');
    
    if (isDashboardPath && isAuthenticated && !hasCheckedSimulationRef.current && !isCheckingSimulationForDashboard) {
      setIsCheckingSimulationForDashboard(true);
      hasCheckedSimulationRef.current = true;
      
      const checkSimulationStatus = async () => {
        try {
          // Use cached data if available
          let simulationResult = null;
          if (restaurantSimulationData) {
            simulationResult = { success: true, data: restaurantSimulationData };
          } else {
            simulationResult = await getRestaurantSimulation();
          }
          
          const isSimulator = simulationResult?.success && simulationResult?.data?.restaurant_simulation === true;
          
          if (isSimulator) {
            // User is in simulation mode, check simulation onboarding status
            let onboardingResult = null;
            if (simulationOnboardingStatus) {
              onboardingResult = { success: true, data: simulationOnboardingStatus };
            } else {
              onboardingResult = await getSimulationOnboardingStatus();
            }
            
            // CRITICAL: Only redirect to simulation dashboard if simulation onboarding API has restaurants
            if (onboardingResult?.success && onboardingResult?.data?.restaurants && onboardingResult.data.restaurants.length > 0) {
              const restaurants = onboardingResult.data.restaurants;
              const completeRestaurant = restaurants.find(
                (r) => r.simulation_restaurant_name !== null && r.simulation_onboarding_complete === true
              );
              
              if (completeRestaurant) {
                // Check if user has both regular and simulation restaurants
                // Check regular restaurants from restaurantData or restaurantOnboardingData
                const regularRestaurants = restaurantData?.restaurants || restaurantOnboardingData?.restaurants || [];
                const hasRegularRestaurantsCheck = Array.isArray(regularRestaurants) && regularRestaurants.length > 0;
                const hasSimulationRestaurantsCheck = Array.isArray(restaurants) && restaurants.length > 0;
                
                // Simulation onboarding is complete, redirect to simulation dashboard
                localStorage.setItem('simulation_restaurant_id', completeRestaurant.simulation_restaurant_id.toString());
                setIsCheckingSimulationForDashboard(false);
                // If both APIs have restaurants, navigate to dashboard/report-card instead of simulation/dashboard
                if (hasRegularRestaurantsCheck && hasSimulationRestaurantsCheck) {
                  navigate(ONBOARDING_ROUTES.REPORT_CARD, { replace: true });
                } else if (hasSimulationRestaurantsCheck) {
                  // Only redirect to simulation dashboard if simulation onboarding API has restaurants
                  navigate('/simulation/dashboard', { replace: true });
                }
                return;
              }
            }
          }
          
          setIsCheckingSimulationForDashboard(false);
        } catch (error) {
          console.error('Error checking simulation status for dashboard:', error);
          setIsCheckingSimulationForDashboard(false);
        }
      };
      
      checkSimulationStatus();
    }
  }, [location.pathname, isAuthenticated, isCheckingSimulationForDashboard, restaurantSimulationData, simulationOnboardingStatus, getRestaurantSimulation, getSimulationOnboardingStatus, navigate]);

  // CRITICAL: All hooks must be declared BEFORE any early returns
  // Calculate derived values needed for hooks
  const hasRestaurantData = restaurantData !== null && restaurantData !== undefined;
  const hasCachedRestaurantData = !!sessionStorage.getItem('cachedRestaurantData');
  const isDashboardPathCheck = location.pathname.startsWith('/dashboard');
  
  // Hook 1: Clear loading flags when data is available
  useEffect(() => {
    if (hasRestaurantData && (restaurantCheckLoading || isLoading)) {
      // Data is available, but loading flags are still set - clear them
      setRestaurantCheckLoading(false);
      setIsLoading(false);
    }
    
    // Also clear if we have sales data but salesInformationLoading is still true
    if (salesInformationData && salesInformationLoading) {
      // Note: salesInformationLoading is managed by the store, but we can check if it's stuck
      // The store should handle this, but this is a safety check
    }
  }, [hasRestaurantData, restaurantCheckLoading, isLoading, salesInformationData, salesInformationLoading]);
  
  // Hook 2: Safety timeout to clear loading if stuck for more than 10 seconds
  useEffect(() => {
    if (isLoading || restaurantCheckLoading || salesInformationLoading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ [ProtectedRoutes] Loading state stuck for 10+ seconds, clearing...');
        setIsLoading(false);
        setRestaurantCheckLoading(false);
      }, 10000);
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading, restaurantCheckLoading, salesInformationLoading]);

  // Early returns must come AFTER all hooks
  // If not authenticated, redirect to login
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // Show loading spinner while checking onboarding, sales data, or restaurant status
  // BUT: Don't show loading if we have cached restaurant data (prevents flashing)
  // Note: hasCachedRestaurantData, isDashboardPathCheck, and hasRestaurantData are already calculated above
  
  const hasRestaurants = hasRestaurant(restaurantData);
  
  // Only show loading if:
  // 1. We're actually loading AND don't have data yet
  // 2. OR we're on a route that requires data and don't have it
  const shouldShowLoading = (
    (isLoading && !hasRestaurantData) || 
    (salesInformationLoading && !salesInformationData) || 
    (restaurantCheckLoading && !hasRestaurantData && !hasCachedRestaurantData) || 
    (isCheckingSimulationForDashboard && isDashboardPathCheck && !hasRestaurantData)
  );
  
  if (shouldShowLoading) {
    return <LoadingSpinner message="Checking your setup..." />;
  }

  // Admin route guard
  const isAdminPath = location.pathname.startsWith('/admin');
  const isAdminUser = ((user?.role || '').toUpperCase() === 'ADMIN') || user?.is_staff;
  if (isAdminPath && !isAdminUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if sales information is complete (using utility function)
  const hasSalesData = () => {
    if (salesInformationError) return false;
    return isSalesInformationComplete(salesInformationData);
  };

  // Route path checks - be specific to avoid conflicts
  const isOnboardingMainPath = location.pathname === ONBOARDING_ROUTES.ONBOARDING;
  const isOnboardingPath = location.pathname.includes('/onboarding');
  const isCompleteStepsPath = location.pathname.includes('/complete');
  const isProfitabilityPath = location.pathname === '/profitability' || location.pathname.includes('/onboarding/profitability');
  const isScorePath = location.pathname === ONBOARDING_ROUTES.SCORE; // '/onboarding/score'
  const isReportCardPath = location.pathname === ONBOARDING_ROUTES.REPORT_CARD;
  const isCongratulationsPath = location.pathname === ONBOARDING_ROUTES.CONGRATULATIONS; // '/congratulations'
  // CRITICAL: Always allow simulation routes - they handle their own redirect logic
  const isSimulationPath = location.pathname === '/onboarding/simulation' || location.pathname === '/simulation/dashboard';
  const isDashboardPath = location.pathname.startsWith('/dashboard');
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isProfilePath = location.pathname === '/dashboard/profile';
  const salesDataComplete = hasSalesData();

    // If checking simulation status, show loading
    if (isCheckingSimulation && isCongratulationsPath) {
      return <LoadingSpinner message="Checking your setup..." />;
    }

  // SuperAdmin route guard - check if non-superadmin is trying to access superadmin routes
  const isSuperAdminUser = user?.is_superuser;
  const impersonating = isImpersonating();
  if (isSuperAdminPath && !isSuperAdminUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // CRITICAL: SuperAdmin routing - HIGHEST PRIORITY - must be checked before any onboarding logic
  // This prevents super admins from seeing onboarding pages or being redirected
  if (isSuperAdminUser && !impersonating) {
    // If super admin is trying to access onboarding or regular dashboard, redirect to super admin dashboard
    if (isOnboardingPath || (isDashboardPath && !isSuperAdminPath)) {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    // If already on super admin path or profile page, allow access
    if (isSuperAdminPath || isProfilePath) {
      return <Outlet />;
    }
    // Default: redirect to super admin dashboard
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  // CRITICAL: Show loading while checking restaurant status for onboarding-related routes
  // This prevents showing wrong route while data is loading
  // BUT: If we have restaurant data, don't show loading even if flag is set
  if (restaurantCheckLoading && !hasRestaurantData && (isOnboardingPath || isDashboardPath || isReportCardPath)) {
    // Only show loading if we haven't checked yet and we're on a route that depends on restaurant status
    const hasChecked = sessionStorage.getItem('hasCheckedRestaurant') === 'true';
    if (!hasChecked) {
      return <LoadingSpinner message="Checking your setup..." />;
    }
  }
  
  // If sales data is complete, user should access report card
  // CRITICAL: Allow ALL dashboard routes when sales data is complete
  // This prevents redirects when reloading any dashboard page
  if (salesDataComplete) {
    // CRITICAL: Only redirect to simulation dashboard if user is simulation-only (no regular restaurants)
    // If user has BOTH restaurants, they should be able to access regular dashboard routes
    // Per requirement: "If both exist → treat user as regular"
    if (isDashboardPath && restaurantSimulationData?.restaurant_simulation === true) {
      // Only redirect if user is simulation-only (no regular restaurants)
      if (!hasRegularRestaurants && hasSimulationRestaurants) {
        // User is simulation-only, check if they should be redirected
        // CRITICAL: Only redirect to simulation dashboard if simulation onboarding API has restaurants
        const simulationRestaurants = simulationOnboardingStatus?.restaurants || [];
        if (Array.isArray(simulationRestaurants) && simulationRestaurants.length > 0) {
          const completeRestaurant = simulationRestaurants.find(
            (r) => r.simulation_restaurant_name !== null && r.simulation_onboarding_complete === true
          );
          if (completeRestaurant) {
            // Only redirect to simulation dashboard if simulation onboarding API has restaurants
            return <Navigate to="/simulation/dashboard" replace />;
          }
        }
      } else if (hasRegularRestaurants && hasSimulationRestaurants) {
        // User has both restaurants - allow regular dashboard access (per requirement)
      }
    }
    
    // Block access to onboarding/score/profitability when sales data is complete
    if (isOnboardingPath && !isCompleteStepsPath) {
      return <Navigate to={ONBOARDING_ROUTES.REPORT_CARD} replace />;
    }
    // Allow all dashboard routes and other paths
    return <Outlet />;
  }

  // If One Month Sales Info is TRUE, user should access report card only
  // Block access to onboarding/score/profitability pages
  // CRITICAL: Allow ALL dashboard routes when One Month Sales Info is complete
  // This prevents redirects when reloading any dashboard page
  if (oneMonthSalesInfoComplete) {
    // CRITICAL: Only redirect to simulation dashboard if user is simulation-only (no regular restaurants)
    // If user has BOTH restaurants, they should be able to access regular dashboard routes
    // Per requirement: "If both exist → treat user as regular"
    if (isDashboardPath && restaurantSimulationData?.restaurant_simulation === true) {
      // Only redirect if user is simulation-only (no regular restaurants)
      if (!hasRegularRestaurants && hasSimulationRestaurants) {
        // User is simulation-only, check if they should be redirected
        // CRITICAL: Only redirect to simulation dashboard if simulation onboarding API has restaurants
        const simulationRestaurants = simulationOnboardingStatus?.restaurants || [];
        if (Array.isArray(simulationRestaurants) && simulationRestaurants.length > 0) {
          const completeRestaurant = simulationRestaurants.find(
            (r) => r.simulation_restaurant_name !== null && r.simulation_onboarding_complete === true
          );
          if (completeRestaurant) {
            // Only redirect to simulation dashboard if simulation onboarding API has restaurants
            return <Navigate to="/simulation/dashboard" replace />;
          }
        }
      } else if (hasRegularRestaurants && hasSimulationRestaurants) {
        // User has both restaurants - allow regular dashboard access (per requirement)
      }
    }
    
    // Block access to onboarding, score, and profitability pages
     // But allow simulation routes
     if (isOnboardingPath && !isCompleteStepsPath && !isSimulationPath) {
      return <Navigate to={ONBOARDING_ROUTES.REPORT_CARD} replace />;
    }
    if ((isScorePath || isProfitabilityPath) && !isSimulationPath) {
      return <Navigate to={ONBOARDING_ROUTES.REPORT_CARD} replace />;
    }
    // Allow access to report card and ALL other dashboard routes
    return <Outlet />;
  }

  // Simple check: If restaurant exists (restaurants array has items)
  // Block /onboarding page, allow score/profitability
  // CRITICAL: Always allow simulation routes FIRST - they handle their own redirect logic
  if (isSimulationPath) {
    // If user is trying to access simulation/dashboard, check if simulation onboarding API has restaurants
    if (location.pathname === '/simulation/dashboard') {
      const simulationRestaurants = simulationOnboardingStatus?.restaurants || [];
      const hasSimulationRestaurantsCheck = Array.isArray(simulationRestaurants) && simulationRestaurants.length > 0;
      
      // CRITICAL: Only allow access to simulation/dashboard if simulation onboarding API has restaurants
      // Allow explicit navigation even if both restaurants exist (user clicked button to go to simulation)
      // The redirect to dashboard/report-card only happens during automatic redirects (after login)
      if (!hasSimulationRestaurantsCheck) {
        // Simulation onboarding API has no restaurants, redirect to simulation onboarding
        return <Navigate to="/onboarding/simulation" replace />;
      }
    }
    return <Outlet />;
  }
  
  if (restaurantExists) {
    // CRITICAL: If onboarding is completely finished (onboarding_complete: true),
    // allow all routes and block /onboarding page
    if (onboardingComplete) {
      if (isOnboardingMainPath) {
        return <Navigate to={ONBOARDING_ROUTES.REPORT_CARD} replace />;
      }
      // Allow all other routes
      return <Outlet />;
    }
    
    // If restaurant exists, block access to /onboarding page
    // User must go to /onboarding/score instead
    if (isOnboardingMainPath) {
      return <Navigate to={ONBOARDING_ROUTES.SCORE} replace />;
    }
    
    // CRITICAL: If onboarding is complete, block congratulations page and redirect to dashboard
    if (onboardingComplete) {
      if (isCongratulationsPath) {
        return <Navigate to={ONBOARDING_ROUTES.REPORT_CARD} replace />;
      }
      // Allow all other routes
      return <Outlet />;
    }
    
    // Allow score, profitability, and congratulations pages (only if onboarding not complete)
    if (isScorePath || isProfitabilityPath || isCongratulationsPath) {
      return <Outlet />;
    }
    
    // If One Month Sales Info is FALSE, block dashboard routes
    // CRITICAL: Only block if we have restaurant data loaded
    // This prevents redirects when data is still loading on page reload
    if (!oneMonthSalesInfoComplete && restaurantData) {
      if (isDashboardPath) {
        return <Navigate to={ONBOARDING_ROUTES.SCORE} replace />;
      }
    }
    
    // If we're on a dashboard route but don't have restaurant data yet, show loading
    // This prevents redirects before data is loaded
    if (isDashboardPath && !restaurantData && restaurantCheckLoading) {
      return <LoadingSpinner message="Checking your setup..." />;
    }
    
  } else {
    return <Outlet />;
  }

  // If restaurant exists and One Month Sales Info is TRUE
  // Allow dashboard routes, block onboarding/score/profitability
  // (This case is already handled above at line 319, but adding explicit check for clarity)
  if (restaurantExists && oneMonthSalesInfoComplete) {
    // Block onboarding/score/profitability - redirect to report card
    if (isOnboardingPath && !isCompleteStepsPath) {
      return <Navigate to={ONBOARDING_ROUTES.REPORT_CARD} replace />;
    }
    if (isScorePath || isProfitabilityPath) {
      return <Navigate to={ONBOARDING_ROUTES.REPORT_CARD} replace />;
    }
    // Allow all dashboard and other routes
    return <Outlet />;
  }

  // New user with no restaurant (restaurants array is empty [])
  // Allow access ONLY to /onboarding page to create restaurant
  // Block dashboard and score/profitability until restaurant is created
  // IMPORTANT: Only check this if we have confirmed there's no restaurant (not just null/undefined)
  if (!restaurantExists) {
    // Check if we've actually checked for restaurant data
    const hasChecked = sessionStorage.getItem('hasCheckedRestaurant') === 'true';
    
    // If we haven't checked yet and restaurantData is null, wait for check to complete
    // This prevents blocking /onboarding when data is still loading
    if (!hasChecked && restaurantData === null && restaurantCheckLoading) {
      return <LoadingSpinner message="Checking your setup..." />;
    }
    
    // Allow ONLY the main onboarding page to create restaurant
    if (isOnboardingMainPath) {
      return <Outlet />;
    }
    
    // Block score/profitability pages - user must create restaurant first
    if (isScorePath || isProfitabilityPath) {
      return <Navigate to={ONBOARDING_ROUTES.ONBOARDING} replace />;
    }
    
    // Block access to report card - redirect to onboarding
    if (isReportCardPath) {
      return <Navigate to={ONBOARDING_ROUTES.ONBOARDING} replace />;
    }
    
    // Block dashboard access - redirect to onboarding
    if (isDashboardPath) {
      return <Navigate to={ONBOARDING_ROUTES.ONBOARDING} replace />;
    }
    
    // Allow congratulations page (for new user flow)
    if (isCongratulationsPath) {
      return <Outlet />;
    }
    
    // Redirect to onboarding if trying to access other routes
    return <Navigate to={ONBOARDING_ROUTES.ONBOARDING} replace />;
  }

  // Default: allow access for other cases
  return <Outlet />;
};

export default ProtectedRoutes;
