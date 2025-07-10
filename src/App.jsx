import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoutes from './routes/ProtectedRoutes';
import LoginPage from './components/authScreens/LoginPage';
import SignUpPage from './components/authScreens/SignUpPage';
import Congratulations from './components/authScreens/auth/Congratulations';
import OnboardingWrapper from './components/onBoarding/OnboardingWrapper';
import RestaurantInfo from './components/mainSceens/restaurantsInformation/RestaurantInfo';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/congratulations" element={<Congratulations />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/onboarding" element={<OnboardingWrapper />} />
          <Route path="/create-restaurant-info" element={<RestaurantInfo />} />
        </Route>

        {/* Catch-all: redirect unknown routes to home or login */}
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
