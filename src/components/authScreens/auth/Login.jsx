 import React, { useState, useEffect } from 'react';
import useStore from '../../../store/store';
import { useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo.png';
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
    <div className="w-full max-w-sm relative">
      {/* Loading Overlay */}
      {showLoadingOverlay && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
          <div className="text-center">
            <Spin size="large" />
            <p className="mt-2 text-gray-600">Logging in...</p>
          </div>
        </div>
      )}
      
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white p-8 space-y-2"
      >
        <img src={logo} alt="logo" className="mb-6" />
        <div className='flex flex-col mt-4 gap-3'>
          <h5 className="text-lg !font-black text-start text-neutral drop-shadow !mb-0" >
            Login <span role="img" aria-label="peace">✌️</span>
          </h5>
          <p className="text-base text-neutral mb-8 font-medium" >
            Know Your Number and Grow Your Profits. Welcome to Growlio
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-base font-bold mb-2" htmlFor="email">
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
              placeholder="Enter Email Address"
              prefix={<img src={Message} alt="Message" className="h-6 w-6" />}
              size="large"
              className={`!h-[40px] rounded-md text-base tw-input input-brand ${
                formErrors.email ? 'border-red-500' : ''
              }`}
              status={formErrors.email ? 'error' : ''}
            />
            {formErrors.email && (
              <div className="text-red-500 text-sm mt-1">{formErrors.email}</div>
            )}
          </div>
          
          <div>
            <label className="block text-base font-bold mb-2" htmlFor="password">
              Password
            </label>
            <Input.Password
              id="password"
              name="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Enter Password"
              prefix={<img src={Lock} alt="Lock" className="h-6 w-6" />}
              size="large"
              className={`!h-[40px] rounded-md text-base tw-input input-brand ${
                formErrors.password ? 'border-red-500' : ''
              }`}
              status={formErrors.password ? 'error' : ''}
            />
            {formErrors.password && (
              <div className="text-red-500 text-sm mt-1">{formErrors.password}</div>
            )}
          </div>
          
          <div className='flex justify-end items-center'>
            <p className='text-neutral-900 text-sm font-bold cursor-pointer hover:text-[#FF8132] transition-colors'>
              Forgot Password?
            </p>
          </div>
        </div>
        
        {/* Global error display */}
        {error && (
          <div className="text-red-500 text-center text-sm bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}
        
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={isLoading}
          disabled={!isFormValid}
          className="w-full h-[48px] bg-[#FF8132] border-[#FF8132] hover:bg-[#EB5B00] hover:border-[#EB5B00] text-white font-bold text-base rounded-md"
          icon={isLoading ? <LoadingOutlined /> : null}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      
      <div className='flex justify-center items-center mt-6'>
        <p className='text-neutral-600 text-base font-bold'>
          Don't have an account? <Link to="/signup" className='text-[#FF8132] font-bold hover:text-[#EB5B00]'>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
