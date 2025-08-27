import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store/store';
import LoadingSpinner from '../components/layout/LoadingSpinner';

const ProtectedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);
  const hasCheckedOnboarding = useRef(false);
  const isNavigating = useRef(false);
  const isCheckingRef = useRef(false);
  
  // Check authentication from store and fallback to localStorage
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const storeToken = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const localStorageToken = localStorage.getItem('token');
  const token = storeToken || localStorageToken;
  
  // Get onboarding status check function from onBoardingSlice
  const checkOnboardingCompletion = useStore((state) => state.checkOnboardingCompletion);
  const forceOnboardingCheck = useStore((state) => state.forceOnboardingCheck);
  console.log('🔍 checkOnboardingCompletion function:', typeof checkOnboardingCompletion);

  // Simple and robust onboarding check function
  const performOnboardingCheck = useCallback(async () => {
    console.log('🔍 performOnboardingCheck called');
    // Prevent multiple simultaneous checks
    if (isNavigating.current) {
      console.log('🔍 Navigation in progress, skipping check');
      setIsCheckingOnboarding(false);
      isCheckingRef.current = false;
      return;
    }
    
    // Check if we've already checked onboarding status in this session
    const sessionChecked = sessionStorage.getItem('onboarding_status_checked');
    if (sessionChecked === 'true') {
      console.log('🔍 Onboarding status already checked in this session, skipping');
      setIsCheckingOnboarding(false);
      isCheckingRef.current = false;
      hasCheckedOnboarding.current = true;
      return;
    }
    
    // Skip onboarding check for specific dashboard pages (update mode)
    const isUpdateModePage = [
      '/dashboard/basic-information',
      '/dashboard/sales-channels', 
      '/dashboard/labor-information',
      '/dashboard/food-cost-details',
      '/dashboard/expense'
    ].includes(location.pathname);
    
    if (isUpdateModePage) {
      console.log('✅ Update mode page detected - skipping onboarding check entirely');
      setIsCheckingOnboarding(false);
      isCheckingRef.current = false;
      hasCheckedOnboarding.current = true;
      sessionStorage.setItem('onboarding_status_checked', 'true');
      return;
    }

    try {
      // Skip onboarding checks for admin area
      if (location.pathname.startsWith('/admin')) {
        return;
      }
      console.log('🔄 ProtectedRoutes - Checking onboarding status...');
      console.log('🔍 Current pathname:', location.pathname);
      console.log('🔍 About to call checkOnboardingCompletion...');
      
      // Use force check to ensure we get fresh data
      const result = await forceOnboardingCheck();
      console.log('📊 Onboarding check result:', result);
      console.log('🔍 Restaurant ID from result:', result.restaurantId);
      
      // If we got a restaurant ID from the onboarding check, store it
      if (result.restaurantId) {
        console.log('✅ Setting restaurant ID from onboarding check:', result.restaurantId);
        localStorage.setItem('restaurant_id', result.restaurantId.toString());
      }

      if (result.success) {
        const isComplete = result.isComplete;
        console.log('🔍 Is complete:', isComplete);
        
        // Handle redirects based on completion status and current path
        console.log('🔍 Redirect logic check:', {
          isComplete,
          pathname: location.pathname,
          isOnboardingPath: location.pathname.includes('onboarding'),
          isMainDashboard: location.pathname === '/dashboard',
          isSpecificDashboard: location.pathname.includes('/dashboard/') && location.pathname !== '/dashboard'
        });
        
        if (isComplete && location.pathname.includes('onboarding')) {
          console.log('✅ User completed onboarding - redirecting to /dashboard/budget');
          setRedirectPath('/dashboard/budget');
        } else if (!isComplete && location.pathname === '/dashboard') {
          // Only redirect main dashboard to onboarding if incomplete
          console.log('🆕 User needs onboarding - redirecting main dashboard to /onboarding/budget');
          setRedirectPath('/onboarding/budget');
        } else if (isComplete && location.pathname === '/dashboard') {
          // If user is on main dashboard and onboarding is complete, redirect to budget dashboard
          console.log('✅ User on main dashboard with completed onboarding - redirecting to /dashboard/budget');
          setRedirectPath('/dashboard/budget');
        } else {
          // For all other cases (including specific dashboard pages), no redirect needed
          console.log('✅ User is on correct path - no redirect needed');
        }
      } else {
        console.log('⚠️ Onboarding check failed, assuming incomplete');
        if (location.pathname === '/dashboard') {
          setRedirectPath('/onboarding/budget');
        }
      }
    } catch (error) {
      console.error('ProtectedRoutes - Error checking onboarding status:', error);
      // On error, assume incomplete and redirect to onboarding if on main dashboard only
      if (location.pathname === '/dashboard') {
        setRedirectPath('/onboarding/budget');
      }
    } finally {
      setIsCheckingOnboarding(false);
      hasCheckedOnboarding.current = true;
      isCheckingRef.current = false;
      // Mark that we've checked onboarding status in this session
      sessionStorage.setItem('onboarding_status_checked', 'true');
    }
  }, [forceOnboardingCheck, location.pathname]);

  // Check onboarding status when component mounts
  useEffect(() => {
    console.log('🔍 useEffect triggered:', {
      isAuthenticated,
      hasToken: !!token,
      isCheckingRef: isCheckingRef.current,
      isNavigating: isNavigating.current,
      hasCheckedOnboarding: hasCheckedOnboarding.current,
      pathname: location.pathname
    });
    
    // Skip onboarding check for specific dashboard pages (update mode)
    const isUpdateModePage = [
      '/dashboard/basic-information',
      '/dashboard/sales-channels', 
      '/dashboard/labor-information',
      '/dashboard/food-cost-details',
      '/dashboard/expense'
    ].includes(location.pathname);
    
    if (isUpdateModePage) {
      console.log('✅ Update mode page detected - skipping onboarding check entirely');
      hasCheckedOnboarding.current = true;
      sessionStorage.setItem('onboarding_status_checked', 'true');
      return;
    }
    
    if (isAuthenticated && token && !isCheckingRef.current && !isNavigating.current && !hasCheckedOnboarding.current) {
      const isOnOnboardingPath = location.pathname.includes('onboarding');
      const isOnDashboardPath = location.pathname.includes('dashboard');
      
      // Only check if we're on onboarding or dashboard paths
      if (isOnOnboardingPath || isOnDashboardPath) {
        console.log('🚀 Starting onboarding check for path:', location.pathname);
        console.log('🔍 Path details:', {
          pathname: location.pathname,
          isOnOnboardingPath,
          isOnDashboardPath,
          isMainDashboard: location.pathname === '/dashboard'
        });
        isCheckingRef.current = true;
        // Add a small delay to ensure proper initialization
        setTimeout(() => {
          setIsCheckingOnboarding(true);
          performOnboardingCheck();
        }, 100);
      }
    }
  }, [isAuthenticated, token]); // Only check once when authenticated

  // Force check when user completes onboarding (listen for store changes)
  const isOnBoardingCompleted = useStore((state) => state.isOnBoardingCompleted);
  useEffect(() => {
    // Skip force check for update mode pages
    const isUpdateModePage = [
      '/dashboard/basic-information',
      '/dashboard/sales-channels', 
      '/dashboard/labor-information',
      '/dashboard/food-cost-details',
      '/dashboard/expense'
    ].includes(location.pathname);
    
    if (isUpdateModePage) {
      console.log('✅ Update mode page detected - skipping force check');
      return;
    }
    
    // Only reset the flag if we're actually on an onboarding page AND onboarding was just completed
    if (isOnBoardingCompleted && hasCheckedOnboarding.current && location.pathname.includes('/onboarding/')) {
      console.log('🔄 User completed onboarding, forcing redirect check');
      hasCheckedOnboarding.current = false;
      if (!isCheckingRef.current && !isNavigating.current) {
        isCheckingRef.current = true;
        setTimeout(() => {
          setIsCheckingOnboarding(true);
          performOnboardingCheck();
        }, 100);
      }
    } else if (isOnBoardingCompleted && !location.pathname.includes('/onboarding/')) {
      // If onboarding is completed but we're not on an onboarding page, don't do anything
      console.log('✅ Onboarding completed but not on onboarding page - no action needed');
    }
  }, [isOnBoardingCompleted, location.pathname]);

  // Handle redirects
  useEffect(() => {
    // Prevent redirects for update mode pages
    const isUpdateModePage = [
      '/dashboard/basic-information',
      '/dashboard/sales-channels', 
      '/dashboard/labor-information',
      '/dashboard/food-cost-details',
      '/dashboard/expense'
    ].includes(location.pathname);
    
    if (isUpdateModePage) {
      console.log('✅ Update mode page detected - preventing any redirects');
      setRedirectPath(null);
      return;
    }
    
    if (redirectPath && !isNavigating.current) {
      console.log('🚀 Navigating to:', redirectPath);
      isNavigating.current = true;
      navigate(redirectPath, { replace: true });
      setRedirectPath(null);
      
      // Reset navigation flag after navigation
      setTimeout(() => {
        isNavigating.current = false;
      }, 500);
    }
  }, [redirectPath, navigate, location.pathname]);

  // Reset flags when user logs out
  useEffect(() => {
    if (!isAuthenticated || !token) {
      console.log('🔄 Resetting onboarding check flags - user logged out');
      hasCheckedOnboarding.current = false;
      isNavigating.current = false;
      isCheckingRef.current = false;
      setIsCheckingOnboarding(false);
      setRedirectPath(null);
      // Clear session storage when user logs out
      sessionStorage.removeItem('onboarding_status_checked');
    }
  }, [isAuthenticated, token]);

  // Reset loading state on component unmount
  useEffect(() => {
    return () => {
      if (isCheckingRef.current) {
        console.log('🔄 Component unmounting - resetting loading state');
        setIsCheckingOnboarding(false);
        isCheckingRef.current = false;
      }
    };
  }, []);

  // Note: We only check onboarding status once per session to avoid unnecessary API calls
  // The check happens when the component first mounts and the user is authenticated

  // Debug logging
  console.log('🔍 ProtectedRoutes Debug:', {
    isAuthenticated,
    hasToken: !!token,
    currentPath: location.pathname,
    isCheckingOnboarding,
    hasCheckedOnboarding: hasCheckedOnboarding.current,
    isNavigating: isNavigating.current,
    isCheckingRef: isCheckingRef.current,
    redirectPath
  });



  // If not authenticated, redirect to login
  if (!isAuthenticated || !token) {
    console.log('🔒 Redirecting to login - not authenticated');
    return <Navigate to="/login" replace />;
  }

  // Show loading spinner while checking onboarding
  if (isCheckingOnboarding) {
    console.log('⏳ Showing loading spinner');
    return <LoadingSpinner message="Checking your setup..." />;
  }

  // Admin route guard
  const isAdminPath = location.pathname.startsWith('/admin');
  const isAdminUser = ((user?.role || '').toUpperCase() === 'ADMIN') || user?.is_staff;
  if (isAdminPath && !isAdminUser) {
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ Rendering protected route content');
  return <Outlet />;
};

export default ProtectedRoutes;
