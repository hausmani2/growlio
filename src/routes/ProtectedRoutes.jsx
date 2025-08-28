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
      console.log('🔄 Checking onboarding status...');
      const result = await forceOnboardingCheck();
      console.log('📊 Onboarding check result:', result);
      console.log('🔍 Result details:', {
        success: result.success,
        isComplete: result.isComplete,
        restaurantId: result.restaurantId,
        message: result.message
      });
      
      if (result.success) {
        console.log('✅ Store onboarding status updated to:', result.isComplete);
        
        // Store restaurant ID if available
        if (result.restaurantId) {
          localStorage.setItem('restaurant_id', result.restaurantId.toString());
          console.log('✅ Stored restaurant ID:', result.restaurantId);
        }
      } else {
        console.log('⚠️ Onboarding check failed, assuming incomplete');
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
      console.log('🔄 Clearing cache and checking onboarding status...');
      checkOnboardingStatus();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  // If not authenticated, redirect to login
  if (!isAuthenticated || !token) {
    console.log('🔒 Redirecting to login - not authenticated');
    return <Navigate to="/login" replace />;
  }

  // Show loading spinner while checking onboarding
  if (isLoading) {
    console.log('⏳ Showing loading spinner');
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
  
  console.log('🔍 Final decision:', {
    isOnBoardingCompleted,
    currentPath: location.pathname,
    isOnboardingPath,
    willAllowAccess: !isOnBoardingCompleted || !isOnboardingPath
  });
  
  if (isOnBoardingCompleted) {
    // User has completed onboarding
    if (isOnboardingPath) {
      // User is trying to access onboarding path - redirect to dashboard
      console.log('🚫 Onboarding complete - blocking access to onboarding path:', location.pathname);
      return <Navigate to="/dashboard/budget" replace />;
    } else {
      // User is on non-onboarding path - allow access
      console.log('✅ Onboarding complete - allowing access to:', location.pathname);
      return <Outlet />;
    }
  } else {
    // User has not completed onboarding
    if (isOnboardingPath) {
      // User is on onboarding path - allow access
      console.log('🆕 Onboarding incomplete - allowing access to onboarding path:', location.pathname);
      return <Outlet />;
    } else {
      // User is not on onboarding path - redirect to onboarding
      console.log('🆕 Onboarding incomplete - redirecting to onboarding from:', location.pathname);
      return <Navigate to="/onboarding/budget" replace />;
    }
  }
};

export default ProtectedRoutes;
