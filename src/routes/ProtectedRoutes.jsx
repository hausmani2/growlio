import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useStore from '../store/store';

const ProtectedRoutes = () => {
  // Check authentication from store and fallback to localStorage
  const isAuthenticated = useStore((state) => state.isAuthenticated);
    const token = useStore((state) => state.token) && localStorage.getItem('token');

  if (!isAuthenticated && !token) {
    // Not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Authenticated, render child routes
  return <Outlet />;
};

export default ProtectedRoutes;
