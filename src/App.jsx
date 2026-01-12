import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { message } from 'antd';
import useStore from './store/store';
import { GuidanceProvider } from './contexts/GuidanceContext';

import ProtectedRoutes from './routes/ProtectedRoutes';
import LoginPage from './components/authScreens/LoginPage';
import SuperAdminLoginPage from './components/authScreens/SuperAdminLoginPage';
import SignUpPage from './components/authScreens/SignUpPage';
import Congratulations from './components/authScreens/auth/Congratulations';
import ForgotPassword from './components/authScreens/auth/ForgotPassword';
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
import LaborDataWrapper from './components/mainSceens/restaurantsInformation/steps/laborData/LaborDataWrapper';
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
import PlansWrapper from './components/mainSceens/plans/PlansWrapper';
import SubscriptionSuccess from './components/mainSceens/plans/SubscriptionSuccess';
import SubscriptionCancel from './components/mainSceens/plans/SubscriptionCancel';
import FaqWrapper from './components/mainSceens/faq/FaqWrapper';
import ChatWidget from './components/chatbot/ChatWidget';
import ChatPage from './components/mainSceens/chat/ChatPage';
import { ProfitabilityScore, ProfitabilityWizard } from './components/profitability';
import ReportCardPage from './components/reportCard/ReportCardPage';
import { SquareIntegration, SquareCallbackHandler } from './components/square';

function App() {
  const initializeAuth = useStore((state) => state.initializeAuth);
  const syncAuthFromStorage = useStore((state) => state.syncAuthFromStorage);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const token = useStore((state) => state.token);
  
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
          <Route path="/" element={<Navigate to="/congratulations" replace />} />
          <Route path="/onboarding" element={<OnboardingWrapper />} />
          <Route path="/onboarding/setup" element={<OnboardingWrapper />} />
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
          <Route path="/dashboard/labor-data" element={<Wrapper showSidebar={true} children={<LaborDataWrapper />} />} />
          <Route path="/dashboard/expense" element={<Wrapper showSidebar={true} children={<ExpenseWrapper />} />} />
          <Route path="/dashboard/profile" element={<Wrapper showSidebar={true} children={<ProfileWrapper />} />} />
          <Route path="/dashboard/support" element={<Wrapper showSidebar={true} children={<SupportPage />} />} />
          <Route path="/dashboard/plans" element={<Wrapper showSidebar={true} children={<PlansWrapper />} />} />
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
      
      {/* Chatbot Widget - Only show when authenticated */}
      {isAuthenticated && <ChatWidget botName="Growlio Assistant" />}
      </GuidanceProvider>
    </Router>
  );
}

export default App;
