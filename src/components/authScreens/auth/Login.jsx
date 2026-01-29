import React, { useState, useEffect } from 'react';
import useStore from '../../../store/store';
import { useNavigate } from 'react-router-dom';
import Message from "../../../assets/svgs/Message_open.svg"
import Lock from "../../../assets/svgs/lock.svg"
import { Link } from 'react-router-dom';
import { Input, message, Button, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import growlioLogo from "../../../assets/svgs/growlio-logo.png"

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
      navigate('/dashboard/report-card');
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
        // CRITICAL: simulation-onboarding and restaurants-onboarding APIs are already called in login() function
        // They are called in this order:
        // 1. simulation/simulation-onboarding/ (GET) - FIRST
        // 2. /restaurant_v2/restaurants-onboarding/ (GET) - SECOND
        // We should use the cached results from login() instead of calling them again
        message.success('Login successful! Checking your setup...');
        
        // Get store state - these should already be populated from login() function
        const restaurantSimulationData = useStore.getState().restaurantSimulationData;
        const simulationOnboardingStatus = useStore.getState().simulationOnboardingStatus;
        const restaurantOnboardingData = useStore.getState().restaurantOnboardingData;
        
        // CRITICAL: Wait for login() API calls to complete, then check onboarding status
        // The login function calls both APIs asynchronously, so we need to wait for them
        try {
          // Wait for API calls to complete (with timeout)
          let attempts = 0;
          const maxAttempts = 20; // Wait up to 2 seconds (20 * 100ms)
          
          while (attempts < maxAttempts) {
            const currentSimulationOnboardingStatus = useStore.getState().simulationOnboardingStatus;
            const currentRestaurantOnboardingData = useStore.getState().restaurantOnboardingData;
            
            // If we have both data sets, proceed
            if (currentRestaurantOnboardingData !== null && currentRestaurantOnboardingData !== undefined) {
              break;
            }
            
            // Wait 100ms before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          // Get fresh state after waiting
          const currentSimulationOnboardingStatus = useStore.getState().simulationOnboardingStatus;
          const currentRestaurantOnboardingData = useStore.getState().restaurantOnboardingData;
          
          // Use cached simulation onboarding data (from login function)
          let simulationOnboardingResult = null;
          if (currentSimulationOnboardingStatus) {
            simulationOnboardingResult = { success: true, data: currentSimulationOnboardingStatus };
          } else {
            // Fallback: if data not available, call API
            console.log('ℹ️ [Login] Simulation onboarding data not found in cache, calling API');
            const getSimulationOnboardingStatus = useStore.getState().getSimulationOnboardingStatus;
            simulationOnboardingResult = await getSimulationOnboardingStatus();
          }
          
          const simulationRestaurants = simulationOnboardingResult?.success && simulationOnboardingResult?.data?.restaurants 
            ? simulationOnboardingResult.data.restaurants 
            : [];
          const hasSimulationRestaurant = simulationRestaurants.length > 0;
          
          // Use cached restaurant onboarding data (from login function)
          let restaurantResult = null;
          if (currentRestaurantOnboardingData) {
            restaurantResult = { success: true, data: currentRestaurantOnboardingData };
          } else {
            // Fallback: if data not available, call API
            console.log('ℹ️ [Login] Restaurant onboarding data not found in cache, calling API');
            const getRestaurantOnboarding = useStore.getState().getRestaurantOnboarding;
            restaurantResult = await getRestaurantOnboarding();
          }
          
          // CRITICAL: Check the actual data structure from API response
          // The API returns: { restaurants: [...], user: {...}, message: "..." }
          const regularRestaurants = restaurantResult?.success && restaurantResult?.data?.restaurants 
            ? (Array.isArray(restaurantResult.data.restaurants) ? restaurantResult.data.restaurants : [])
            : [];
          const hasRegularRestaurant = regularRestaurants.length > 0;
          
          console.log('📊 [Login] Onboarding check results:', {
            hasSimulationRestaurant,
            hasRegularRestaurant,
            regularRestaurantsCount: regularRestaurants.length,
            simulationRestaurantsCount: simulationRestaurants.length
          });
          
          // CRITICAL: If BOTH don't have restaurants, redirect to congratulations (new user)
          if (!hasSimulationRestaurant && !hasRegularRestaurant) {
            message.success('Welcome to Growlio! Let\'s get you set up.');
            setTimeout(() => {
              navigate('/congratulations', { replace: true });
            }, 500);
            return;
          }
          
          // If user has simulation restaurant, handle simulation flow
          if (hasSimulationRestaurant) {
            const completeSimulationRestaurant = simulationRestaurants.find(
              (r) => r.simulation_restaurant_name !== null && r.simulation_onboarding_complete === true
            );
            
            if (completeSimulationRestaurant) {
              // Simulation onboarding is complete, redirect to simulation dashboard
              localStorage.setItem('simulation_restaurant_id', completeSimulationRestaurant.simulation_restaurant_id.toString());
              message.success('Welcome back! Redirecting to simulation dashboard...');
              setTimeout(() => {
                navigate('/simulation/dashboard', { replace: true });
              }, 500);
              return;
            }
            
            // Simulation restaurant exists but not complete
            message.success('Welcome to Growlio! Let\'s complete your setup.');
            setTimeout(() => {
              navigate('/onboarding/simulation', { replace: true });
            }, 500);
            return;
          }
          
          // If user has regular restaurant (but no simulation restaurant), handle regular flow
          if (hasRegularRestaurant) {
            console.log('🏪 [Login] User has regular restaurant, checking completion status...');
            console.log('📋 [Login] Restaurants data:', regularRestaurants);
            
            // Find restaurant with completed onboarding
            const completeRestaurant = regularRestaurants.find(
              (r) => r.onboarding_complete === true
            );
            
            console.log('✅ [Login] Complete restaurant found:', completeRestaurant);
            
            if (completeRestaurant) {
              // Restaurant onboarding is complete, redirect to dashboard
              const restaurantId = completeRestaurant.restaurant_id;
              localStorage.setItem('restaurant_id', restaurantId.toString());
              console.log('✅ [Login] Redirecting to dashboard with restaurant_id:', restaurantId);
              message.success('Welcome back! Redirecting to dashboard...');
              setTimeout(() => {
                navigate('/dashboard/report-card', { replace: true });
              }, 500);
              return;
            }
            
            // User has restaurant but onboarding not complete
            console.log('ℹ️ [Login] Restaurant exists but onboarding not complete');
            message.success('Welcome back! Continuing your setup...');
            setTimeout(() => {
              navigate('/onboarding/score', { replace: true });
            }, 500);
            return;
          }
          
          // Fallback: redirect to congratulations
          message.success('Welcome to Growlio! Let\'s get you set up.');
          setTimeout(() => {
            navigate('/congratulations', { replace: true });
          }, 500);
        } catch (error) {
          console.error('Error checking status:', error);
          // On error, default to congratulations
          message.success('Welcome to Growlio! Let\'s get you set up.');
          setTimeout(() => {
            navigate('/congratulations', { replace: true });
          }, 500);
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
        <img src={growlioLogo} alt="Growlio Logo" className="w-48 mx-auto" />
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
