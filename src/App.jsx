import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/mainSceens/Home';
import Settings from './components/mainSceens/Settings';
import ProtectedRoutes from './routes/ProtectedRoutes';
import LoginPage from './components/authScreens/LoginPage';
import SignUpPage from './components/authScreens/SignUpPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Catch-all: redirect unknown routes to home or login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
