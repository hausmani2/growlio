import React, { useState, useEffect } from 'react';
import useStore from '../../../store/store';
import { useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo.png';
import Message from "../../../assets/svgs/Message_open.svg"
import Lock from "../../../assets/svgs/lock.svg"
import User from "../../../assets/svgs/User.svg"
import { Link } from 'react-router-dom';
import { Input, message, Button, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const Register = () => {
  const [form, setForm] = useState({ 
    full_name: '', 
    email: '', 
    username: '', 
    password: '' 
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Zustand store hooks
  const { 
    register, 
    loading, 
    error, 
    isAuthenticated, 
    clearError 
  } = useStore();
  
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard/summary');
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
    
    if (!form.full_name.trim()) {
      errors.full_name = 'Full name is required';
    } else if (form.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters';
    }
    
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!form.username.trim()) {
      errors.username = 'Username is required';
    } else if (form.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!form.password) {
      errors.password = 'Password is required';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
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
      const result = await register(form);
      
      if (result.success) {
        message.success('Registration successful! Please login to continue.');
        if (result.needsLogin) {
          message.success('Registration successful! Please login to continue.');
          // Navigate to login after successful registration
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        } else {
          message.success('Registration successful! Welcome to Growlio!');
          // Navigate to onboarding after successful registration with token
          setTimeout(() => {
            navigate('/onboarding/summary');
          }, 1500);
        }
      }
    } catch (err) {
      // Error is already handled in the store
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = form.full_name && form.email && form.username && form.password;
  const isLoading = loading || isSubmitting;

  return (
    <div className="w-full max-w-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full bg-white p-8 space-y-2"
      >
        <img src={logo} alt="logo" className="mb-6" />
        <div className='flex flex-col mt-4 gap-3'>
          <h2 className="text-lg !font-black text-start text-neutral !mb-0">
            Join Growlio Today
          </h2>
          <p className="text-base text-neutral mb-2" >
            Get discovered, manage bookings, and showcase your menu — all in one place.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-base font-bold mb-2" htmlFor="name">
              Full Name
            </label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="full_name"
              required
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter Full Name"
              prefix={<img src={User} alt="User" className="h-4 w-4" />}
              size="large"
              className={`h-[40px] rounded-md text-lg tw-input input-brand ${
                formErrors.full_name ? 'border-red-500' : ''
              }`}
              status={formErrors.full_name ? 'error' : ''}
            />
            {formErrors.full_name && (
              <div className="text-red-500 text-sm mt-1">{formErrors.full_name}</div>
            )}
          </div>
          
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
              prefix={<img src={Message} alt="Message" className="h-4 w-4" />}
              size="large"
              className={`h-[40px] rounded-md text-lg tw-input input-brand ${
                formErrors.email ? 'border-red-500' : ''
              }`}
              status={formErrors.email ? 'error' : ''}
            />
            {formErrors.email && (
              <div className="text-red-500 text-sm mt-1">{formErrors.email}</div>
            )}
          </div>
          
          <div>
            <label className="block text-base font-bold mb-2" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={form.username}
              onChange={handleChange}
              placeholder="Enter Username"
              prefix={<img src={User} alt="User" className="h-4 w-4" />}
              size="large"
              className={`h-[40px] rounded-md text-lg tw-input input-brand ${
                formErrors.username ? 'border-red-500' : ''
              }`}
              status={formErrors.username ? 'error' : ''}
            />
            {formErrors.username && (
              <div className="text-red-500 text-sm mt-1">{formErrors.username}</div>
            )}
          </div>
          
          <div>
            <label className="block text-base font-bold mb-2" htmlFor="password">
              Password
            </label>
            <Input.Password
              id="password"
              name="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Enter Password"
              prefix={<img src={Lock} alt="Lock" className="h-4 w-4" />}
              size="large"
              className={`h-[40px] rounded-md text-lg tw-input input-brand ${
                formErrors.password ? 'border-red-500' : ''
              }`}
              status={formErrors.password ? 'error' : ''}
            />
            {formErrors.password && (
              <div className="text-red-500 text-sm mt-1">{formErrors.password}</div>
            )}
          </div>
          
          <div className='flex justify-end items-center'>
            <p className='text-neutral-900 text-sm font-bold'>Forgot Password?</p>
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
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
      
      <div className='flex justify-center items-center mt-6'>
        <p className='text-neutral-600 text-base font-bold'>
          Already have an account? <Link to="/login" className='text-[#FF8132] font-bold hover:text-[#EB5B00]'>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
