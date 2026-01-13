import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store/store';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import { isImpersonating } from '../utils/tokenManager';
import {
  hasRestaurant,
  hasOneMonthSalesInfo,
  isSalesInformationComplete,
  getOnboardingRedirectRoute,
  ONBOARDING_ROUTES,
} from '../utils/onboardingUtils';

const ProtectedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = useRef(false);
  const hasCheckedRestaurantRef = useRef(false); // Track if we've checked restaurant to prevent multiple checks
  const hasRedirectedRef = useRef(false); // Track if we've already redirected to prevent infinite loops
  
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
  
  // Derived state from restaurant data
  const restaurantExists = hasRestaurant(restaurantData);
  const oneMonthSalesInfoComplete = hasOneMonthSalesInfo(restaurantData);
  
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
      ];
      
      // If user is on an allowed path, NEVER redirect - allow access immediately
      if (allowedPaths.includes(location.pathname)) {
        hasRedirectedRef.current = false;
        sessionStorage.setItem('lastProcessedPath', location.pathname);
        sessionStorage.removeItem('lastRedirectRoute');
        return; // Allow access, no redirect needed - this is the correct path
      }
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
        
        // Use a small delay to batch navigation and prevent multiple calls
        const redirectTimeout = setTimeout(() => {
          navigate(redirectRoute, { replace: true });
        }, 50);
        
        // Store timeout ID to clear if component unmounts
        return () => clearTimeout(redirectTimeout);
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
  }, [isAuthenticated, token]); // Removed user from deps to prevent unnecessary re-runs

  // Early returns must come AFTER all hooks
  // If not authenticated, redirect to login
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // Show loading spinner while checking onboarding, sales data, or restaurant status
  // BUT: Don't show loading if we have cached restaurant data (prevents flashing)
  const hasCachedRestaurantData = !!sessionStorage.getItem('cachedRestaurantData');
  const shouldShowLoading = (isLoading || salesInformationLoading || (restaurantCheckLoading && !hasCachedRestaurantData));
  
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
  const isCongratulationsPath = location.pathname === ONBOARDING_ROUTES.CONGRATULATIONS;
  const isDashboardPath = location.pathname.startsWith('/dashboard');
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isProfilePath = location.pathname === '/dashboard/profile';
  const salesDataComplete = hasSalesData();

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
  if (restaurantCheckLoading && (isOnboardingPath || isDashboardPath || isReportCardPath)) {
    // Only show loading if we haven't checked yet and we're on a route that depends on restaurant status
    const hasChecked = sessionStorage.getItem('hasCheckedRestaurant') === 'true';
    if (!hasChecked) {
      return <LoadingSpinner message="Checking your setup..." />;
    }
  }

  // Show loading while checking restaurant status (only if we're on onboarding-related routes)
  // This prevents showing wrong route while data is loading
  if (restaurantCheckLoading && (isOnboardingPath || isDashboardPath || isReportCardPath)) {
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
    // Block access to onboarding, score, and profitability pages
    if (isOnboardingPath && !isCompleteStepsPath) {
      return <Navigate to={ONBOARDING_ROUTES.REPORT_CARD} replace />;
    }
    if (isScorePath || isProfitabilityPath) {
      return <Navigate to={ONBOARDING_ROUTES.REPORT_CARD} replace />;
    }
    // Allow access to report card and ALL other dashboard routes
    return <Outlet />;
  }

  // Simple check: If restaurant exists (restaurants array has items)
  // Block /onboarding page, allow score/profitability
  
  if (restaurantExists) {
    
    // If restaurant exists, block access to /onboarding page
    // User must go to /onboarding/score instead
    if (isOnboardingMainPath) {
      return <Navigate to={ONBOARDING_ROUTES.SCORE} replace />;
    }
    
    // Allow score, profitability, and congratulations pages
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
