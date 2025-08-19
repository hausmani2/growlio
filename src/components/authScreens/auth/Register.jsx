import React, { useState, useEffect } from 'react';
import useStore from '../../../store/store';
import { useNavigate } from 'react-router-dom';
import GrowlioLogo from '../../common/GrowlioLogo';
import Message from "../../../assets/svgs/Message_open.svg"
import Lock from "../../../assets/svgs/lock.svg"
import User from "../../../assets/svgs/User.svg"
import { Link } from 'react-router-dom';
import { Input, message, Button, Spin, Checkbox } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import DisclaimerModal from './DisclaimerModal';

const Register = () => {
  const [form, setForm] = useState({ 
    full_name: '', 
    email: '', 
    username: '', 
    password: '' 
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  
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

  const isFormValid = form.full_name && form.email && form.username && form.password && disclaimerAccepted;
  const isLoading = loading || isSubmitting;

  const handleDisclaimerAccept = () => {
    setDisclaimerAccepted(true);
    setShowDisclaimerModal(false);
  };

  const handleDisclaimerModalClose = () => {
    setShowDisclaimerModal(false);
  };

  return (
    <div className="w-full max-w-md">
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
            Join Growlio Today! <span role="img" aria-label="rocket" className="text-2xl">🚀</span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-sm mx-auto">
            Get discovered, manage bookings, and showcase your menu — all in one place.
          </p>
        </div>
        
        {/* Form Fields */}
        <div className="space-y-4">
          {/* Full Name Field */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="full_name">
              Full Name
            </label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              prefix={<img src={User} alt="User" className="h-5 w-5 text-gray-400" />}
              size="large"
              className={`!h-11 rounded-lg text-base transition-all duration-200 ${
                formErrors.full_name 
                  ? '!border-red-500 !shadow-sm !shadow-red-100' 
                  : '!border-gray-300 hover:!border-orange-400 focus:!border-orange-500 focus:!shadow-lg focus:!shadow-orange-100'
              }`}
              status={formErrors.full_name ? 'error' : ''}
            />
            {formErrors.full_name && (
              <div className="text-red-500 text-sm mt-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                {formErrors.full_name}
              </div>
            )}
          </div>
          
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
          
          {/* Username Field */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="username">
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
              placeholder="Choose a username"
              prefix={<img src={User} alt="User" className="h-5 w-5 text-gray-400" />}
              size="large"
              className={`!h-11 rounded-lg text-base transition-all duration-200 ${
                formErrors.username 
                  ? '!border-red-500 !shadow-sm !shadow-red-100' 
                  : '!border-gray-300 hover:!border-orange-400 focus:!border-orange-500 focus:!shadow-lg focus:!shadow-orange-100'
              }`}
              status={formErrors.username ? 'error' : ''}
            />
            {formErrors.username && (
              <div className="text-red-500 text-sm mt-1 flex items-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                {formErrors.username}
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
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Create a strong password"
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
          
          {/* Terms and Conditions */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                disabled={!disclaimerAccepted && !showDisclaimerModal}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="text-sm text-gray-700 leading-relaxed">
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowDisclaimerModal(true)}
                    className="text-orange-600 font-semibold hover:text-orange-700 transition-colors duration-200 underline"
                  >
                    Terms and Conditions
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={() => setShowDisclaimerModal(true)}
                    className="text-orange-600 font-semibold hover:text-orange-700 transition-colors duration-200 underline"
                  >
                    Privacy Policy
                  </button>
                </p>
              </div>
            </div>
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>
      </form>
      
      {/* Login Link */}
      <div className="text-center mt-8">
        <p className="text-gray-600 text-base">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="text-orange-600 font-semibold hover:text-orange-700 transition-colors duration-200 hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>

      <DisclaimerModal
        isOpen={showDisclaimerModal}
        onClose={handleDisclaimerModalClose}
        onAccept={handleDisclaimerAccept}
        title="Terms and Conditions"
      />
    </div>
  );
};

export default Register;
