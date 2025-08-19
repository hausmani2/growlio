
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/store';
import AuthWrapper from './auth/AuthWrapper';
import Login from './auth/Login';

const LoginPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div>
      <AuthWrapper>
        <Login />
      </AuthWrapper>
    </div>
  );
};

export default LoginPage;