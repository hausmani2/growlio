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


  // Check onboarding status for authenticated users
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const result = await refreshOnboardingStatus();
        
        if (result.success) {
          const isComplete = result.onboarding_complete;
          
          if (!isComplete && (location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/'))) {
            setRedirectPath('/onboarding');
            return;
          }
          
          if (isComplete && (location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/'))) {
            setRedirectPath('/dashboard');
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

    if ((location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')) && isAuthenticated && token) {
      if (!hasCheckedForPath.current.has(location.pathname)) {
        hasCheckedForPath.current.add(location.pathname);
        setIsCheckingOnboarding(true);
        checkOnboarding();
      }
    } else if (isCheckingOnboarding && isAuthenticated && token) {
      checkOnboarding();
    } else if (!isAuthenticated || !token) {
      setIsCheckingOnboarding(false);
    }
  }, [refreshOnboardingStatus, location.pathname, isCheckingOnboarding, isAuthenticated, token, navigate]);

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
