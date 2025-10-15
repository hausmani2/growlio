import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/store';
import AuthWrapper from './auth/AuthWrapper';
import SuperAdminLogin from './auth/SuperAdminLogin';

const SuperAdminLoginPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const user = useStore((state) => state.user);

  useEffect(() => {
    if (isAuthenticated) {
      // Check if user is superuser first
      if (user?.is_superuser) {
        navigate('/superadmin');
      } else if (user?.is_staff || user?.role === 'admin') {
        // Regular admin
        navigate('/admin/users');
      } else {
        // Regular user, redirect to dashboard
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div>
        <SuperAdminLogin />
    </div>
  );
};

export default SuperAdminLoginPage;
