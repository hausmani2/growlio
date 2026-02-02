import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import useStore from './store/store';
import { GuidanceProvider } from './contexts/GuidanceContext';
import LoadingSpinner from './components/layout/LoadingSpinner';


import ProtectedRoutes from './routes/ProtectedRoutes';
import LoginPage from './components/authScreens/LoginPage';
import SuperAdminLoginPage from './components/authScreens/SuperAdminLoginPage';
import SignUpPage from './components/authScreens/SignUpPage';
import Congratulations from './components/authScreens/auth/Congratulations';
import ForgotPassword from './components/authScreens/auth/ForgotPassword';
import SimulationOnboarding from './components/onBoarding/SimulationOnboarding';
import SimulationDashboard from './components/simulation/SimulationDashboard';
import ResetPassword from './components/authScreens/auth/ResetPassword';
import OnboardingWrapper from './components/onBoarding/OnboardingWrapper';
import RestaurantInfo from './components/mainSceens/restaurantsInformation/RestaurantInfo';
import CompleteSteps from './components/mainSceens/restaurantsInformation/CompleteSteps';
import Wrapper from './components/layout/Wrapper';
import Dashboard from './components/mainSceens/dashbaordComponents/Dashboard';
import Settings from './components/mainSceens/dashbaordComponents/Setting';

import RestaurantWrapper from './components/mainSceens/restaurantsInformation/steps/basicInformation/RestaurantWrapper';
import LaborInformationWrapper from './components/mainSceens/restaurantsInformation/steps/laborInformation/LaborInformationWrapper';
import FoodCostDetailsWrapper from './components/mainSceens/restaurantsInformation/steps/foodCostDetails/FoodCostWrapper';
import SalesChannelsWrapper from './components/mainSceens/restaurantsInformation/steps/salesChannels/SalesChannelsWrapper';
import ThirdPartyDeliveryWrapper from './components/mainSceens/restaurantsInformation/steps/thirdPartyDelivery/ThirdPartyDeliveryWrapper';
import ExpenseWrapper from './components/mainSceens/restaurantsInformation/steps/Expense/ExpenseWrapper';
import SalesDataWrapper from './components/mainSceens/restaurantsInformation/steps/salesData/SalesDataWrapper';
import SummaryDashboard from './components/mainSceens/summaryDashboard/SummaryDashboard';
import ProfitLossDashboard from './components/mainSceens/summaryDashboard/profitLossDashboard/ProfitLossDashboard';
import ProfileWrapper from './components/mainSceens/Profile/ProfileWrapper';
import UsersAdmin from './components/admin/UsersAdmin';
import TooltipsAdmin from './components/admin/TooltipsAdmin';
import GuidancePopupsAdmin from './components/admin/GuidancePopupsAdmin';
import SuperAdminDashboard from './components/superadmin/SuperAdminDashboard';
import SuperAdminUsers from './components/superadmin/SuperAdminUsers';
import SuperAdminTooltips from './components/superadmin/components/SuperAdminTooltips';
import SuperAdminUserManagement from './components/superadmin/components/SuperAdminUserManagement';
import SuperAdminUserInfo from './components/superadmin/components/SuperAdminUserInfo';
import SupportPage from './components/mainSceens/support/SupportPage';
import Training from './components/mainSceens/traning/Traning';
import PlansWrapper from './components/mainSceens/plans/PlansWrapper';
import SubscriptionSuccess from './components/mainSceens/plans/SubscriptionSuccess';
import SubscriptionCancel from './components/mainSceens/plans/SubscriptionCancel';
import FaqWrapper from './components/mainSceens/faq/FaqWrapper';
import ChatWidget from './components/chatbot/ChatWidget';
import ChatPage from './components/mainSceens/chat/ChatPage';
import { ProfitabilityScore, ProfitabilityWizard } from './components/profitability';
import ReportCardPage from './components/reportCard/ReportCardPage';
import { SquareIntegration, SquareCallbackHandler } from './components/square';

// Smart redirect component that checks simulation status and restaurant onboarding
const RootRedirect = () => {
  const navigate = useNavigate();
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const getRestaurantSimulation = useStore((state) => state.getRestaurantSimulation);
  const getSimulationOnboardingStatus = useStore((state) => state.getSimulationOnboardingStatus);
  const getRestaurantOnboarding = useStore((state) => state.getRestaurantOnboarding);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    
    const checkAndRedirect = async () => {
      try {
        // CRITICAL: Check BOTH APIs to determine user status
        // 1. Check restaurant simulation status
        const simulationResult = await getRestaurantSimulation();
        const isSimulator = simulationResult?.success && simulationResult?.data?.restaurant_simulation === true;
        
        // 2. Check simulation onboarding status (regardless of isSimulator flag)
        const simulationOnboardingResult = await getSimulationOnboardingStatus();
        const simulationRestaurants = simulationOnboardingResult?.success && simulationOnboardingResult?.data?.restaurants 
          ? simulationOnboardingResult.data.restaurants 
          : [];
        const hasSimulationRestaurant = simulationRestaurants.length > 0;
        
        // 3. Check regular restaurant onboarding status
        const restaurantResult = await getRestaurantOnboarding();
        const regularRestaurants = restaurantResult?.success && restaurantResult?.data?.restaurants 
          ? restaurantResult.data.restaurants 
          : [];
        const hasRegularRestaurant = regularRestaurants.length > 0;
        
        // CRITICAL: If BOTH don't have restaurants, redirect to congratulations (new user)
        if (!hasSimulationRestaurant && !hasRegularRestaurant) {
          navigate('/congratulations', { replace: true });
          return;
        }
        
        // CRITICAL: If both APIs have restaurants, navigate to dashboard/report-card (treat as regular user)
        if (hasRegularRestaurant && hasSimulationRestaurant) {
          // Find restaurant with completed onboarding
          const completeRestaurant = regularRestaurants.find(
            (r) => r.onboarding_complete === true
          );
          
          if (completeRestaurant) {
            // Restaurant onboarding is complete, redirect to dashboard
            const restaurantId = completeRestaurant.restaurant_id;
            localStorage.setItem('restaurant_id', restaurantId.toString());
            navigate('/dashboard/report-card', { replace: true });
            return;
          }
          
          // User has restaurant but onboarding not complete
          navigate('/onboarding/score', { replace: true });
          return;
        }
        
        // If user has ONLY simulation restaurant (no regular restaurant), handle simulation flow
        if (hasSimulationRestaurant && !hasRegularRestaurant) {
          // CRITICAL: Only redirect to simulation dashboard if simulation onboarding API has restaurants
          if (simulationRestaurants.length > 0) {
            const completeSimulationRestaurant = simulationRestaurants.find(
              (r) => r.simulation_restaurant_name !== null && r.simulation_onboarding_complete === true
            );
            
            if (completeSimulationRestaurant) {
              // Simulation onboarding is complete, redirect to simulation dashboard
              localStorage.setItem('simulation_restaurant_id', completeSimulationRestaurant.simulation_restaurant_id.toString());
              navigate('/simulation/dashboard', { replace: true });
              return;
            }
            
            // Simulation restaurant exists but not complete, redirect to simulation onboarding
            navigate('/onboarding/simulation', { replace: true });
            return;
          }
          // If simulation onboarding API has no restaurants, redirect to onboarding
          navigate('/onboarding/simulation', { replace: true });
          return;
        }
        
        // If user has ONLY regular restaurant (no simulation restaurant), handle regular flow
        if (hasRegularRestaurant && !hasSimulationRestaurant) {
          // Find restaurant with completed onboarding
          const completeRestaurant = regularRestaurants.find(
            (r) => r.onboarding_complete === true
          );
          
          if (completeRestaurant) {
            // Restaurant onboarding is complete, redirect to dashboard
            const restaurantId = completeRestaurant.restaurant_id;
            localStorage.setItem('restaurant_id', restaurantId.toString());
            navigate('/dashboard/report-card', { replace: true });
            return;
          }
          
          // User has restaurant but onboarding not complete
          navigate('/onboarding/score', { replace: true });
          return;
        }
        
        // Fallback: redirect to congratulations
        navigate('/congratulations', { replace: true });
      } catch (error) {
        console.error('Error checking status:', error);
        // On error, default to congratulations
        navigate('/congratulations', { replace: true });
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAndRedirect();
  }, [isAuthenticated, getRestaurantSimulation, getSimulationOnboardingStatus, getRestaurantOnboarding, navigate]);
  
  if (isChecking) {
    return <LoadingSpinner message="Checking your setup..." />;
  }
  
  return null;
};

function App() {
  const initializeAuth = useStore((state) => state.initializeAuth);
  const syncAuthFromStorage = useStore((state) => state.syncAuthFromStorage);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const token = useStore((state) => state.token);

  const getRestaurantSimulation = useStore((state) => state.getRestaurantSimulation);
  const getSimulationOnboardingStatus = useStore((state) => state.getSimulationOnboardingStatus);
  
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  
  // Check if user is in simulation mode - only on login/authentication change
  useEffect(() => {
    if (!isAuthenticated) {
      setIsSimulationMode(false);
      // Clear cache on logout
      sessionStorage.removeItem('appSimulationMode');
      sessionStorage.removeItem('appSimulationModeLastCheck');
      return;
    }
    
    // Check cache first to avoid unnecessary API calls
    const cacheKey = 'appSimulationMode';
    const lastCheckTime = sessionStorage.getItem(`${cacheKey}LastCheck`);
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
    
    // If we have cached data and it's still fresh, use it
    if (lastCheckTime && (now - parseInt(lastCheckTime)) < CACHE_DURATION) {
      const cachedMode = sessionStorage.getItem(cacheKey);
      if (cachedMode !== null) {
        setIsSimulationMode(cachedMode === 'true');
        return;
      }
    }
    
    const checkSimulationMode = async () => {
      try {
        // Check restaurant simulation status
        const simulationResult = await getRestaurantSimulation();
        const isSimulator = simulationResult?.success && simulationResult?.data?.restaurant_simulation === true;
        
        if (isSimulator) {
          // Check simulation onboarding status
          const onboardingResult = await getSimulationOnboardingStatus();
          const restaurants = onboardingResult?.data?.restaurants || [];
          const isOnboardingComplete = onboardingResult?.success && 
                                     restaurants.some((r) => r.simulation_onboarding_complete === true);
          
          // Only set simulation mode if onboarding is complete
          const simulationMode = isOnboardingComplete;
          setIsSimulationMode(simulationMode);
          
          // Cache the result
          sessionStorage.setItem(cacheKey, simulationMode.toString());
          sessionStorage.setItem(`${cacheKey}LastCheck`, now.toString());
        } else {
          setIsSimulationMode(false);
          // Cache the result
          sessionStorage.setItem(cacheKey, 'false');
          sessionStorage.setItem(`${cacheKey}LastCheck`, now.toString());
        }
      } catch (error) {
        console.error('❌ [App] Error checking simulation mode:', error);
        setIsSimulationMode(false);
      }
    };
    
    checkSimulationMode();
  }, [isAuthenticated, getRestaurantSimulation, getSimulationOnboardingStatus]);
  
  // Configure Ant Design message
  useEffect(() => {
    message.config({
      top: 100,
      duration: 3,
      maxCount: 3,
      rtl: false,
    });
  }, []);
  
  // Initialize auth on mount
  useEffect(() => {
    try {
      initializeAuth();
    } catch (error) {
      console.error('❌ App - Auth initialization failed:', error);
    }
  }, [initializeAuth]);
  
  // Listen for storage events to sync auth state across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Only sync when token or user changes in localStorage
      if (e.key === 'token' || e.key === 'user') {
        try {
          syncAuthFromStorage();
        } catch (error) {
          console.error('❌ App - Auth sync failed:', error);
        }
      }
    };
    
    // Listen to storage events (fires when localStorage changes in other tabs)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen to custom events for same-tab updates (localStorage events don't fire in same tab)
    const handleCustomStorageChange = () => {
      try {
        syncAuthFromStorage();
      } catch (error) {
        console.error('❌ App - Auth sync failed:', error);
      }
    };
    
    window.addEventListener('auth-storage-change', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-storage-change', handleCustomStorageChange);
    };
  }, [syncAuthFromStorage]);


  return (
    <Router>
      <GuidanceProvider>
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<SuperAdminLoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/congratulations" element={<Congratulations />} />
        
        {/* Square OAuth Callback - Public route for OAuth redirect */}
        <Route path="/square/callback" element={<SquareCallbackHandler />} />

    

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes />}>
         <Route path="/" element={<RootRedirect />} />
          <Route path="/onboarding" element={<OnboardingWrapper />} />
          <Route path="/onboarding/setup" element={<OnboardingWrapper />} />
          <Route path="/onboarding/simulation" element={<SimulationOnboarding />} />
          <Route path="/simulation/dashboard" element={<Wrapper showSidebar={true} children={<SimulationDashboard />} />} />
          <Route path="/onboarding/score" element={<ProfitabilityScore />} />
          <Route path="/onboarding/profitability" element={<ProfitabilityWizard />} />
          <Route path="/onboarding/basic-information" element={<RestaurantInfo />} />
          <Route path="/onboarding/labor-information" element={<RestaurantInfo />} />
          <Route path="/onboarding/food-cost-details" element={<RestaurantInfo />} />
          <Route path="/onboarding/sales-channels" element={<RestaurantInfo />} />
          <Route path="/onboarding/expense" element={<RestaurantInfo />} />
          <Route path="/onboarding/complete" element={<CompleteSteps />} />
          <Route path="/complete-steps" element={<CompleteSteps />} />
          <Route path="/dashboard/budget" element={<Wrapper showSidebar={true} children={<SummaryDashboard />} />} />
          <Route path="/dashboard/profit-loss" element={<Wrapper showSidebar={true} children={<ProfitLossDashboard />} />} />
          <Route path="/dashboard" element={<Wrapper showSidebar={true} children={<Dashboard />} />} />
          <Route path="/dashboard/basic-information" element={<Wrapper showSidebar={true} children={<RestaurantWrapper />} />} />
          <Route path="/dashboard/labor-information" element={<Wrapper showSidebar={true} children={<LaborInformationWrapper />} />} />
          <Route path="/dashboard/food-cost-details" element={<Wrapper showSidebar={true} children={<FoodCostDetailsWrapper />} />} />
          <Route path="/dashboard/sales-channels" element={<Wrapper showSidebar={true} children={<SalesChannelsWrapper />} />} />
          <Route path="/dashboard/third-party-delivery" element={<Wrapper showSidebar={true} children={<ThirdPartyDeliveryWrapper />} />} />
          <Route path="/dashboard/sales-data" element={<Wrapper showSidebar={true} children={<SalesDataWrapper />} />} />
          <Route path="/dashboard/expense" element={<Wrapper showSidebar={true} children={<ExpenseWrapper />} />} />
          <Route path="/dashboard/profile" element={<Wrapper showSidebar={true} children={<ProfileWrapper />} />} />
          <Route path="/dashboard/support" element={<Wrapper showSidebar={true} children={<SupportPage />} />} />
          <Route path="/dashboard/training" element={<Wrapper showSidebar={true} children={<Training />} />} />
          <Route path="/dashboard/pricing" element={<Wrapper showSidebar={true} children={<PlansWrapper />} />} />
          <Route path="/subscription/success" element={<SubscriptionSuccess />} />
          <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
          <Route path="/dashboard/faq" element={<Wrapper showSidebar={true} children={<FaqWrapper />} />} />
          <Route path="/dashboard/chat" element={<Wrapper showSidebar={true} children={<ChatPage />} className="!p-0 !h-full relative" />} />
          <Route path="/dashboard/square" element={<Wrapper showSidebar={true} children={<SquareIntegration />} />} />
              {/* Profitability Score Routes - Can be accessed before full onboarding */}
        <Route path="/onboarding/profitability" element={<Wrapper showSidebar={true} children={<ProfitabilityScore />} />} />
        <Route path="/onboarding/profitability/form" element={<Wrapper showSidebar={true} children={<ProfitabilityWizard />} />} />
        <Route path="/onboarding/profitability/results" element={<Wrapper showSidebar={true} children={<Navigate to="/onboarding/profitability/form" replace />} />} />

        {/* Report Card Route */}
        <Route path="/dashboard/report-card" element={<Wrapper showSidebar={true} children={<ReportCardPage />} />} />
          {/* Admin */}
          {/* <Route path="/admin/users" element={<Wrapper showSidebar={true} children={<UsersAdmin />} />} />
          <Route path="/admin/tooltips" element={<Wrapper showSidebar={true} children={<TooltipsAdmin />} />} /> */}
          
          {/* SuperAdmin */}
          <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="/superadmin/dashboard" element={<Wrapper showSidebar={true} children={<SuperAdminDashboard />} />} />
          <Route path="/superadmin/users" element={<Wrapper showSidebar={true} children={<SuperAdminUsers />} />} />
          <Route path="/superadmin/user-management" element={<Wrapper showSidebar={true} children={<SuperAdminUserManagement />} />} />
          <Route path="/superadmin/user-info" element={<Wrapper showSidebar={true} children={<SuperAdminUserInfo />} />} />
          <Route path="/superadmin/tooltips" element={<Wrapper showSidebar={true} children={<SuperAdminTooltips />} />} />
          <Route path="/superadmin/faq" element={<Wrapper showSidebar={true} children={<FaqWrapper />} />} />
          <Route path="/superadmin/superadmin-chat" element={<Wrapper showSidebar={true} children={<ChatPage />} className="!p-0 !h-full relative" />} />          <Route path="/superadmin/guidance-popups" element={<Wrapper showSidebar={true} children={<GuidancePopupsAdmin />} />} />

        </Route>

        {/* Catch-all: redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      
        {/* Chatbot Widget - Only show when authenticated and NOT in simulation mode */}
        {isAuthenticated && !isSimulationMode && <ChatWidget botName="Growlio Assistant" />}
      </GuidanceProvider>
    </Router>
  );
}

export default App;
