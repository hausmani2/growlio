import React, { useState, useEffect } from 'react';
import useStore from '../../../store/store';
import { useNavigate } from 'react-router-dom';
import GrowlioLogo from '../../common/GrowlioLogo';
import Message from "../../../assets/svgs/Message_open.svg"
import Lock from "../../../assets/svgs/lock.svg"
import { Link } from 'react-router-dom';
import { Input, message, Button, Spin, Card, Checkbox, Divider } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const SuperAdminLogin = () => {
  const [form, setForm] = useState({ 
    email: '', 
    password: '' 
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Zustand store hooks
  const { 
    error, 
    isAuthenticated, 
    clearError
  } = useStore();
  const superAdminLogin = useStore((state) => state.superAdminLogin);
  
  // Get onboarding status check from onboarding slice
  const checkOnboardingCompletion = useStore((state) => state.checkOnboardingCompletion);
  
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/superadmin/dashboard');
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
      const result = await superAdminLogin(form);
      
      if (result.success) {
        message.success('SuperAdmin login successful! Redirecting...');
        
        // Check if user is superuser and redirect accordingly
        const userData = result.data.data || result.data;
        if (userData.is_superuser) {
          // Superuser - redirect to superadmin dashboard
          setTimeout(() => {
            navigate('/superadmin/dashboard');
          }, 700);
        } else if (userData.is_staff || userData.role === 'admin') {
          // Regular admin - redirect to admin panel
          setTimeout(() => {
            navigate('/admin/users');
          }, 1000);
        } else {
          // Regular user - redirect to dashboard
          setTimeout(() => {
            navigate('/dashboard');
          }, 1000);
        }
      }
    } catch (err) {
      // Error is already handled in the store
      console.error('SuperAdmin login error:', err);
    } finally {
      // Ensure both loading states are reset
      setIsSubmitting(false);
    }
  };

  const isFormValid = form.email && form.password;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border border-gray-100 rounded-xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center">
            <GrowlioLogo />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mt-3">SuperAdmin Sign In</h1>
          <p className="text-gray-500 mt-1">Manage users and platform settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                size="large"
                className={`h-12 px-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                prefix={<img src={Message} alt="Email" className="w-5 h-5" />}
                status={formErrors.email ? 'error' : ''}
              />
            </div>
            {formErrors.email && (
              <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Input.Password
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                size="large"
                className={`h-12 px-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                prefix={<img src={Lock} alt="Password" className="w-5 h-5" />}
                status={formErrors.password ? 'error' : ''}
              />
            </div>
            {formErrors.password && (
              <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
            )}
          </div>


          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <Divider className="my-0" style={{ marginTop: 0 }} />
          {/* Submit Button */}
          <Button
            type="primary"
            htmlType="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full h-12 border-0 rounded-lg font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: 'white' }} spin />} />
            ) : (
              'Sign In as SuperAdmin'
            )}
          </Button>

          {/* Regular Login Link */}
          <div className="text-center">
            <Link 
              to="/login" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Regular User Login
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SuperAdminLogin;
