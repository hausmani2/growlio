import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useStore from '../store/store';

const ProtectedRoutes = () => {
  const location = useLocation();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  
  // Check authentication from store and fallback to localStorage
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const storeToken = useStore((state) => state.token);
  const localStorageToken = localStorage.getItem('token');
  const token = storeToken || localStorageToken;
  
  // Get onboarding status and check function
  const onboardingStatus = useStore((state) => state.onboardingStatus);
  const checkOnboardingStatus = useStore((state) => state.checkOnboardingStatus);

  // Simple token check - just undefined vs token
  console.log('ProtectedRoutes - Token Check:', {
    isAuthenticated,
    token: token ? 'TOKEN_EXISTS' : 'UNDEFINED',
    tokenType: typeof token,
    onboardingStatus,
    currentPath: location.pathname
  });

  // Check onboarding status for authenticated users
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        console.log('ProtectedRoutes - Checking onboarding status...');
        const result = await checkOnboardingStatus();
        
        console.log('ProtectedRoutes - Onboarding check result:', result);
        
        if (result.success) {
          const isComplete = result.onboarding_complete;
          
          // Only redirect if user is trying to access dashboard but onboarding is incomplete
          if (!isComplete && location.pathname === '/dashboard') {
            console.log('Onboarding incomplete - redirecting to onboarding');
            window.location.href = '/onboarding';
            return;
          }
          
          // Only redirect if user is on onboarding pages but onboarding is complete
          if (isComplete && (location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/'))) {
            console.log('Onboarding complete - redirecting to dashboard');
            window.location.href = '/dashboard';
            return;
          }
        }
      } catch (error) {
        console.error('ProtectedRoutes - Error checking onboarding status:', error);
        // On error, only redirect if user is trying to access dashboard
        if (location.pathname === '/dashboard') {
          console.log('Onboarding check failed - redirecting to onboarding as fallback');
          window.location.href = '/onboarding';
          return;
        }
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    // Only check onboarding if we haven't checked yet and user is authenticated
    if (isCheckingOnboarding && isAuthenticated && token) {
      checkOnboarding();
    } else if (!isAuthenticated || !token) {
      // If not authenticated, stop checking
      setIsCheckingOnboarding(false);
    }
  }, [checkOnboardingStatus, location.pathname, isCheckingOnboarding, isAuthenticated, token]);

  // Check authentication first
  if (!isAuthenticated || !token) {
    console.log('Access denied - redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Show loading while checking onboarding status
  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking your setup...</p>
        </div>
      </div>
    );
  }

  console.log('Access granted - token is valid and onboarding status checked');
  return <Outlet />;
};

export default ProtectedRoutes;
