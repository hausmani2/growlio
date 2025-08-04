import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/store';

import ProtectedRoutes from './routes/ProtectedRoutes';
import LoginPage from './components/authScreens/LoginPage';
import SignUpPage from './components/authScreens/SignUpPage';
import Congratulations from './components/authScreens/auth/Congratulations';
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
import ExpenseWrapper from './components/mainSceens/restaurantsInformation/steps/Expense/ExpenseWrapper';

function App() {
  const initializeAuth = useStore((state) => state.initializeAuth);
  
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/congratulations" element={<Congratulations />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/onboarding" element={<OnboardingWrapper />} />
          <Route path="/onboarding/basic-information" element={<RestaurantInfo />} />
          <Route path="/onboarding/labour-information" element={<RestaurantInfo />} />
          <Route path="/onboarding/food-cost-details" element={<RestaurantInfo />} />
          <Route path="/onboarding/sales-channels" element={<RestaurantInfo />} />
          <Route path="/onboarding/expense" element={<RestaurantInfo />} />
          <Route path="/onboarding/complete" element={<CompleteSteps />} />
          <Route path="/complete-steps" element={<CompleteSteps />} />
          <Route path="/dashboard" element={<Wrapper showSidebar={true} children={<Dashboard />} />} />
          <Route path="/dashboard/basic-information" element={<Wrapper showSidebar={true} children={<RestaurantWrapper />} />} />
          <Route path="/dashboard/labour-information" element={<Wrapper showSidebar={true} children={<LaborInformationWrapper />} />} />
          <Route path="/dashboard/food-cost-details" element={<Wrapper showSidebar={true} children={<FoodCostDetailsWrapper />} />} />
          <Route path="/dashboard/sales-channels" element={<Wrapper showSidebar={true} children={<SalesChannelsWrapper />} />} />
          <Route path="/dashboard/expense" element={<Wrapper showSidebar={true} children={<ExpenseWrapper />} />} />
        </Route>

        {/* Catch-all: redirect unknown routes to home or login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
