import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Input, Button, message } from 'antd';
import { LockOutlined, KeyOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { apiPost } from '../../../utils/axiosInterceptors';
import GrowlioLogo from '../../common/GrowlioLogo';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    token: searchParams.get('token') || '',
    new_password: '',
    confirm_password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.token.trim()) {
      message.error('Reset token is required');
      return false;
    }
    
    if (!form.new_password) {
      message.error('New password is required');
      return false;
    }
    
    if (form.new_password.length < 8) {
      message.error('Password must be at least 8 characters long');
      return false;
    }
    
    if (form.new_password !== form.confirm_password) {
      message.error('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await apiPost('/authentication/reset-password/', {
        token: form.token,
        new_password: form.new_password
      });
      
      if (response.data.message) {
        setIsSuccess(true);
        message.success('Password reset successful! You can now login with your new password.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error('Failed to reset password. Please check your token and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo Section - Outside the form box */}
          <div className="text-center mb-8">
            <GrowlioLogo width={180} height={60} className="mx-auto" />
          </div>
          
          <div className="w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LockOutlined className="text-2xl text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-orange-600 mb-3">
                Password Reset Successful! 🎉
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed max-w-sm mx-auto">
                Your password has been successfully reset. You can now login with your new password.
              </p>
            </div>
            
            <div className="mt-6">
              <Button
                type="primary"
                size="large"
                onClick={handleBackToLogin}
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 border-0 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
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
              Reset Your Password 🔐
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-sm mx-auto">
              Enter the reset token from your email and create a new password.
            </p>
          </div>
          
          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="token">
                Reset Token
              </label>
              <Input
                id="token"
                name="token"
                value={form.token}
                onChange={handleChange}
                placeholder="Enter the reset token from your email"
                prefix={<KeyOutlined className="text-gray-400" />}
                size="large"
                className="!h-11 rounded-lg text-base transition-all duration-200 !border-gray-300 hover:!border-orange-400 focus:!border-orange-500 focus:!shadow-lg focus:!shadow-orange-100"
                required
              />
              <p className="text-xs text-gray-500 mt-1 text-left">
                Check your email for the reset token
              </p>
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="new_password">
                New Password
              </label>
              <Input.Password
                id="new_password"
                name="new_password"
                value={form.new_password}
                onChange={handleChange}
                placeholder="Enter your new password"
                prefix={<LockOutlined className="text-gray-400" />}
                size="large"
                className="!h-11 rounded-lg text-base transition-all duration-200 !border-gray-300 hover:!border-orange-400 focus:!border-orange-500 focus:!shadow-lg focus:!shadow-orange-100"
                required
              />
              <p className="text-xs text-gray-500 mt-1 text-left">
                Password must be at least 8 characters long
              </p>
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="confirm_password">
                Confirm New Password
              </label>
              <Input.Password
                id="confirm_password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                placeholder="Confirm your new password"
                prefix={<LockOutlined className="text-gray-400" />}
                size="large"
                className="!h-11 rounded-lg text-base transition-all duration-200 !border-gray-300 hover:!border-orange-400 focus:!border-orange-500 focus:!shadow-lg focus:!shadow-orange-100"
                required
              />
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="mt-6">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={isSubmitting}
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 border-0 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </div>
        </form>
        
        {/* Back to Login Link */}
        <div className="text-center mt-8">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToLogin}
            className="text-orange-600 hover:text-orange-700 transition-colors duration-200 hover:underline"
          >
            Back to Login
          </Button>
        </div>
        
        {/* Request New Token Link */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Don't have a token?{' '}
            <Link 
              to="/forgot-password" 
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Request a new one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
