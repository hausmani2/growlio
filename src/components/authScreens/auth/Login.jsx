import React, { useState, useEffect } from 'react';
import useStore from '../../../store/store';
import { useNavigate } from 'react-router-dom';
import GrowlioLogo from '../../common/GrowlioLogo';
import Message from "../../../assets/svgs/Message_open.svg"
import Lock from "../../../assets/svgs/lock.svg"
import { Link } from 'react-router-dom';
import { Input, message, Button, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const Login = () => {
  const [form, setForm] = useState({ 
    email: '', 
    password: '' 
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Zustand store hooks
  const { 
    login, 
    error, 
    isAuthenticated, 
    clearError
  } = useStore();
  
  // Get onboarding status check from onboarding slice
  const checkOnboardingCompletion = useStore((state) => state.checkOnboardingCompletion);
  
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Clear error when component unmounts or form changes
  useEffect(() => {
    return () => {
      try {
        clearError();
      } catch (error) {
        // Silently handle errors during cleanup
        console.warn('Error during cleanup:', error);
      }
    };
  }, [clearError]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!form.password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear global error when user makes changes
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      message.error('Please fix the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await login(form);
      
      if (result.success) {
        message.success('Login successful! Checking your onboarding status...');
        
        // Check onboarding status after successful login
        const onboardingResult = await checkOnboardingCompletion();
        
        if (onboardingResult.success) {
          const isComplete = onboardingResult.isComplete;
          
          if (isComplete) {
            message.success('Welcome back! Redirecting to dashboard...');
            setTimeout(() => {
              navigate('/dashboard/budget');
            }, 1000);
          } else {
            message.info('Please complete your onboarding setup...');
            setTimeout(() => {
              navigate('/onboarding/budget');
            }, 1000);
          }
        } else {
          // Fallback to onboarding if check fails
          message.info('Redirecting to onboarding...');
          setTimeout(() => {
            navigate('/onboarding/budget');
          }, 1000);
        }
      }
    } catch (err) {
      // Error is already handled in the store
      console.error('Login error:', err);
    } finally {
      // Ensure both loading states are reset
      setIsSubmitting(false);
    }
  };

  const isFormValid = form.email && form.password;
  // Use only local isSubmitting state for button loading to avoid conflicts
  const isLoading = isSubmitting;
  
  // Show loading overlay during onboarding check
  const showLoadingOverlay = isSubmitting;

  return (
    <div className="w-full max-w-md relative">
      {/* Loading Overlay */}
      {showLoadingOverlay && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 rounded-xl shadow-lg">
          <div className="text-center">
            <Spin size="large" />
            <p className="mt-3 text-gray-600 font-medium">Logging in...</p>
          </div>
        </div>
      )}
      
      {/* Logo Section - Outside the form box */}
      <div className="text-center mb-8">
        <GrowlioLogo width={180} height={60} className="mx-auto" />
      </div>
      
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100"
      >
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600 mb-3">
            Welcome Back! <span role="img" aria-label="wave" className="text-2xl">👋</span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-sm mx-auto">
            Know Your Numbers and Grow Your Profits
          </p>
        </div>
        
        {/* Form Fields */}
        <div className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="email">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              prefix={<img src={Message} alt="Email" className="h-5 w-5 text-gray-400" />}
              size="large"
              className={`!h-11 rounded-lg text-base transition-all duration-200 ${
                formErrors.email 
                  ? '!border-red-500 !shadow-sm !shadow-red-100' 
                  : '!border-gray-300 hover:!border-orange-400 focus:!border-orange-500 focus:!shadow-lg focus:!shadow-orange-100'
              }`}
              status={formErrors.email ? 'error' : ''}
            />
            {formErrors.email && (
              <div className="text-red-500 text-sm mt-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                {formErrors.email}
              </div>
            )}
          </div>
          
          {/* Password Field */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <Input.Password
              id="password"
              name="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              prefix={<img src={Lock} alt="Lock" className="h-5 w-5 text-gray-400" />}
              size="large"
              className={`!h-11 rounded-lg text-base transition-all duration-200 ${
                formErrors.password 
                  ? '!border-red-500 !shadow-sm !shadow-red-100' 
                  : '!border-gray-300 hover:!border-orange-400 focus:!border-orange-500 focus:!shadow-lg focus:!shadow-orange-100'
              }`}
              status={formErrors.password ? 'error' : ''}
            />
            {formErrors.password && (
              <div className="text-red-500 text-sm mt-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                {formErrors.password}
              </div>
            )}
          </div>
          
          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors duration-200 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
        
        {/* Global Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="mt-6">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={isLoading}
            disabled={!isFormValid}
            className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 border-0 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            icon={isLoading ? <LoadingOutlined /> : null}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </div>
      </form>
      
      {/* Sign Up Link */}
      <div className="text-center mt-8">
        <p className="text-gray-600 text-base">
          Don't have an account?{' '}
          <Link 
            to="/signup" 
            className="text-orange-600 font-semibold hover:text-orange-700 transition-colors duration-200 hover:underline"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
