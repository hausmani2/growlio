import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store/store';
import LoadingSpinner from '../components/layout/LoadingSpinner';

const ProtectedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Check authentication from store and fallback to localStorage
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const storeToken = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const localStorageToken = localStorage.getItem('token');
  const token = storeToken || localStorageToken;
  
  // Get onboarding status from store and check function from onBoardingSlice
  const isOnBoardingCompleted = useStore((state) => state.isOnBoardingCompleted);
  const forceOnboardingCheck = useStore((state) => state.forceOnboardingCheck);

  // Simple onboarding check function
  const checkOnboardingStatus = async () => {
    try {
      const result = await forceOnboardingCheck();
        
      if (result.success) {
        console.log('🔍 ProtectedRoutes - Onboarding check successful, isComplete:', result.isComplete);
        
        // Update the store state based on the result
        if (result.isComplete) {
          console.log('🔍 ProtectedRoutes - Setting isOnBoardingCompleted to true');
          // We need to get the setter from the store
          const setIsOnBoardingCompleted = useStore.getState().setIsOnBoardingCompleted;
          setIsOnBoardingCompleted(true);
        } else {
          console.log('🔍 ProtectedRoutes - Setting isOnBoardingCompleted to false');
          const setIsOnBoardingCompleted = useStore.getState().setIsOnBoardingCompleted;
          setIsOnBoardingCompleted(false);
        }
        
        // Store restaurant ID if available
        if (result.restaurantId) {
          localStorage.setItem('restaurant_id', result.restaurantId.toString());
          console.log('🔍 ProtectedRoutes - Restaurant ID stored:', result.restaurantId);
        }
      } else {
        console.log('🔍 ProtectedRoutes - Onboarding check failed');
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

  // Check onboarding status when component mounts
  useEffect(() => {
    if (isAuthenticated && token) {
      // Clear any cached onboarding status to force fresh check
      sessionStorage.removeItem('onboarding_completion_check_time');
      
      checkOnboardingStatus();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  // If not authenticated, redirect to login
  if (!isAuthenticated || !token) {
    
    return <Navigate to="/login" replace />;
  }

  // Show loading spinner while checking onboarding
  if (isLoading) {
    
    return <LoadingSpinner message="Checking your setup..." />;
  }

  // Admin route guard
  const isAdminPath = location.pathname.startsWith('/admin');
  const isAdminUser = ((user?.role || '').toUpperCase() === 'ADMIN') || user?.is_staff;
  if (isAdminPath && !isAdminUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // SuperAdmin route guard
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isSuperAdminUser = user?.is_superuser;
  if (isSuperAdminPath && !isSuperAdminUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // Simple logic: If onboarding is complete, block access to onboarding paths and redirect to dashboard
  // If onboarding is incomplete, only allow onboarding routes
  const isOnboardingPath = location.pathname.includes('onboarding');
  const isCompleteStepsPath = location.pathname.includes('/complete');
  
  console.log('🔍 ProtectedRoutes - Current pathname:', location.pathname);
  console.log('🔍 ProtectedRoutes - isOnBoardingCompleted:', isOnBoardingCompleted);
  console.log('🔍 ProtectedRoutes - isOnboardingPath:', isOnboardingPath);
  console.log('🔍 ProtectedRoutes - isCompleteStepsPath:', isCompleteStepsPath);
  
  if (isOnBoardingCompleted) {
    // User has completed onboarding
    if (isOnboardingPath && !isCompleteStepsPath) {
      // User is trying to access onboarding path (but not completion page) - redirect to dashboard
      console.log('🔍 ProtectedRoutes - Completed user trying to access onboarding, redirecting to dashboard');
      return <Navigate to="/dashboard/budget" replace />;
    } else {
      // User is on non-onboarding path or completion page - allow access
      console.log('🔍 ProtectedRoutes - Completed user on valid path, allowing access');
      return <Outlet />;
    }
  } else {
    // User has not completed onboarding
    if (isOnboardingPath) {
      // User is on onboarding path - allow access
      console.log('🔍 ProtectedRoutes - Incomplete user on onboarding path, allowing access');
      return <Outlet />;
    } else {
      // User is not on onboarding path - redirect to onboarding
      console.log('🔍 ProtectedRoutes - Incomplete user not on onboarding path, redirecting to onboarding');
      return <Navigate to="/onboarding/budget" replace />;
    }
  }
};

export default ProtectedRoutes;
