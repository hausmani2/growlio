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

    try {
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
        if (isComplete && location.pathname.includes('onboarding')) {
          console.log('✅ User completed onboarding - redirecting to /dashboard/budget');
          setRedirectPath('/dashboard/budget');
        } else if (!isComplete && location.pathname.includes('dashboard')) {
          console.log('🆕 User needs onboarding - redirecting to /onboarding/budget');
          setRedirectPath('/onboarding/budget');
        } else {
          console.log('✅ User is on correct path - no redirect needed');
        }
      } else {
        console.log('⚠️ Onboarding check failed, assuming incomplete');
        if (location.pathname.includes('dashboard')) {
          setRedirectPath('/onboarding/budget');
        }
      }
    } catch (error) {
      console.error('ProtectedRoutes - Error checking onboarding status:', error);
      // On error, assume incomplete and redirect to onboarding if on dashboard
      if (location.pathname.includes('dashboard')) {
        setRedirectPath('/onboarding/budget');
      }
    } finally {
      setIsCheckingOnboarding(false);
      hasCheckedOnboarding.current = true;
      isCheckingRef.current = false;
    }
  }, [forceOnboardingCheck, location.pathname]);

  // Check onboarding status when component mounts
  useEffect(() => {
    if (isAuthenticated && token && !isCheckingRef.current && !isNavigating.current && !hasCheckedOnboarding.current) {
      const isOnOnboardingPath = location.pathname.includes('onboarding');
      const isOnDashboardPath = location.pathname.includes('dashboard');
      
      // Only check if we're on onboarding or dashboard paths
      if (isOnOnboardingPath || isOnDashboardPath) {
        console.log('🚀 Starting onboarding check for path:', location.pathname);
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
    if (isOnBoardingCompleted && hasCheckedOnboarding.current && location.pathname.includes('onboarding')) {
      console.log('🔄 User completed onboarding, forcing redirect check');
      hasCheckedOnboarding.current = false;
      if (!isCheckingRef.current && !isNavigating.current) {
        isCheckingRef.current = true;
        setTimeout(() => {
          setIsCheckingOnboarding(true);
          performOnboardingCheck();
        }, 100);
      }
    }
  }, [isOnBoardingCompleted, location.pathname]);

  // Handle redirects
  useEffect(() => {
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
  }, [redirectPath, navigate]);

  // Reset flags when user logs out
  useEffect(() => {
    if (!isAuthenticated || !token) {
      console.log('🔄 Resetting onboarding check flags');
      hasCheckedOnboarding.current = false;
      isNavigating.current = false;
      isCheckingRef.current = false;
      setIsCheckingOnboarding(false);
      setRedirectPath(null);
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

  console.log('✅ Rendering protected route content');
  return <Outlet />;
};

export default ProtectedRoutes;
