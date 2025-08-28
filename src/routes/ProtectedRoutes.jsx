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
        
        
        // Store restaurant ID if available
        if (result.restaurantId) {
          localStorage.setItem('restaurant_id', result.restaurantId.toString());
          
        }
      } else {
        
      }
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
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

  // Logic: If onboarding is complete, block access to onboarding paths and redirect to dashboard
  // If onboarding is incomplete, only allow onboarding routes
  const isOnboardingPath = location.pathname.includes('onboarding');
  
  
  
  if (isOnBoardingCompleted) {
    // User has completed onboarding
    if (isOnboardingPath) {
      // User is trying to access onboarding path - redirect to dashboard
      
      return <Navigate to="/dashboard/budget" replace />;
    } else {
      // User is on non-onboarding path - allow access
      
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
