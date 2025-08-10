import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store/store';
import LoadingSpinner from '../components/layout/LoadingSpinner';

const ProtectedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [redirectPath, setRedirectPath] = useState(null);
  const hasCheckedForPath = useRef(new Set());
  
  // Check authentication from store and fallback to localStorage
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const storeToken = useStore((state) => state.token);
  const localStorageToken = localStorage.getItem('token');
  const token = storeToken || localStorageToken;
  
  // Get onboarding status and check function
  const refreshOnboardingStatus = useStore((state) => state.refreshOnboardingStatus);
  const redirectToOnboardingIfNeeded = useStore((state) => state.redirectToOnboardingIfNeeded);


  // Check onboarding status for authenticated users
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // First check if user needs to be redirected to onboarding (no restaurants)
        const redirectCheck = await redirectToOnboardingIfNeeded();
        
        if (redirectCheck.shouldRedirect) {
          console.log('🆕 Redirecting to onboarding:', redirectCheck.reason);
          if (location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')) {
            setRedirectPath('/onboarding');
            return;
          }
        }
        
        // Then check general onboarding status
        const result = await refreshOnboardingStatus();
        
        if (result.success) {
          const isComplete = result.onboarding_complete;
          
          if (!isComplete && (location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/'))) {
            setRedirectPath('/onboarding');
            return;
          }
          
          if (isComplete && (location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/'))) {
            setRedirectPath('/dashboard/summary');
            return;
          }
        } else {
          if (location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')) {
            setRedirectPath('/onboarding');
            return;
          }
        }
      } catch (error) {
        console.error('ProtectedRoutes - Error checking onboarding status:', error);
        if (location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')) {
          setRedirectPath('/onboarding');
          return;
        }
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    // Only check if we're authenticated and have a token
    if (isAuthenticated && token) {
      // Only check for dashboard routes or if we're currently checking
      if ((location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')) && 
          !hasCheckedForPath.current.has(location.pathname)) {
        hasCheckedForPath.current.add(location.pathname);
        setIsCheckingOnboarding(true);
        checkOnboarding();
      } else if (isCheckingOnboarding) {
        checkOnboarding();
      }
    } else {
      setIsCheckingOnboarding(false);
    }
  }, [location.pathname, isAuthenticated, token]); // Removed refreshOnboardingStatus and navigate from dependencies

  useEffect(() => {
    return () => {
      hasCheckedForPath.current.clear();
    };
  }, []);

  useEffect(() => {
    if (redirectPath && !isCheckingOnboarding) {
      navigate(redirectPath, { replace: true });
      setRedirectPath(null);
    }
  }, [redirectPath, isCheckingOnboarding, navigate]);

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  if (isCheckingOnboarding) {
    return <LoadingSpinner message="Checking your setup..." />;
  }

  
  return <Outlet />;
};

export default ProtectedRoutes;
