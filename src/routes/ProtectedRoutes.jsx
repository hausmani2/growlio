import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useStore from '../store/store';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import { isImpersonating } from '../utils/tokenManager';

const ProtectedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Check authentication from store and fallback to localStorage (for cross-tab sync)
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const storeToken = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  // Check localStorage first (for cross-tab sync), then sessionStorage (for backward compatibility)
  const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
  const token = storeToken || storedToken;
  
  // Get onboarding status from store and check function from onBoardingSlice
  const isOnBoardingCompleted = useStore((state) => state.isOnBoardingCompleted);
  const forceOnboardingCheck = useStore((state) => state.forceOnboardingCheck);

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

  // Check onboarding status when component mounts
  useEffect(() => {
    if (isAuthenticated && token) {
      // Skip onboarding check for superadmins when not impersonating
      const isSuperAdminUser = user?.is_superuser;
      const impersonating = isImpersonating();
      
      if (isSuperAdminUser && !impersonating) {
        // SuperAdmin doesn't need onboarding check - set completion to true and go directly to superadmin
        const setIsOnBoardingCompleted = useStore.getState().setIsOnBoardingCompleted;
        setIsOnBoardingCompleted(true);
        setIsLoading(false);
        return;
      }
      
      // Clear any cached onboarding status to force fresh check
      sessionStorage.removeItem('onboarding_completion_check_time');
      
      checkOnboardingStatus();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, token, user]);

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

  // SuperAdmin route guard + redirect logic
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');
  const isSuperAdminUser = user?.is_superuser;
  const impersonating = isImpersonating();
  if (isSuperAdminPath && !isSuperAdminUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Allow superadmin to access profile page
  const isProfilePath = location.pathname === '/dashboard/profile';
  
  // If current user is SuperAdmin and not impersonating, redirect to SuperAdmin dashboard
  // EXCEPT for profile page which should be accessible to all users
  if (isSuperAdminUser && !impersonating && !isSuperAdminPath && !isProfilePath) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  // Simple logic: If onboarding is complete, block access to onboarding paths and redirect to dashboard
  // If onboarding is incomplete, only allow onboarding routes
  const isOnboardingPath = location.pathname.includes('onboarding');
  const isCompleteStepsPath = location.pathname.includes('/complete');
  
  if (isSuperAdminUser && !impersonating && !isSuperAdminPath && !isProfilePath) {
    // SuperAdmin should never see onboarding; force superadmin dashboard
    // EXCEPT for profile page which should be accessible to all users
    return <Navigate to="/superadmin/dashboard" replace />;
  } else if (isOnBoardingCompleted) {
    // User has completed onboarding
    if (isOnboardingPath && !isCompleteStepsPath) {
      // User is trying to access onboarding path (but not completion page) - redirect to dashboard
      return <Navigate to="/dashboard/budget" replace />;
    } else {
      // User is on non-onboarding path or completion page - allow access
      return <Outlet />;
    }
  } else {
    // User has not completed onboarding
    if (isOnboardingPath) {
      // User is on onboarding path - allow access
      return <Outlet />;
    } else {
      // User is not on onboarding path - redirect to onboarding
      return <Navigate to="/onboarding/budget" replace />;
    }
  }
};

export default ProtectedRoutes;
