import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Input, Button, message, Card } from 'antd';
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <div className="text-center">
            <div className="mb-6">
              <GrowlioLogo width={120} height={40} className="mx-auto" />
            </div>
            
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LockOutlined className="text-2xl text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful!</h2>
              <p className="text-gray-600">
                Your password has been successfully reset. You can now login with your new password.
              </p>
            </div>
            
            <Button
              type="primary"
              size="large"
              onClick={handleBackToLogin}
              className="w-full bg-orange-500 hover:bg-orange-600 border-0"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <div className="text-center mb-6">
          <GrowlioLogo width={120} height={40} className="mx-auto" />
        </div>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Your Password</h2>
          <p className="text-gray-600">
            Enter the reset token from your email and create a new password.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
              Reset Token
            </label>
            <Input
              name="token"
              value={form.token}
              onChange={handleChange}
              placeholder="Enter the reset token from your email"
              prefix={<KeyOutlined className="text-gray-400" />}
              size="large"
              className="h-11 rounded-lg"
              required
            />
            <p className="text-xs text-gray-500 mt-1 text-left">
              Check your email for the reset token
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
              New Password
            </label>
            <Input.Password
              name="new_password"
              value={form.new_password}
              onChange={handleChange}
              placeholder="Enter your new password"
              prefix={<LockOutlined className="text-gray-400" />}
              size="large"
              className="h-11 rounded-lg"
              required
            />
            <p className="text-xs text-gray-500 mt-1 text-left">
              Password must be at least 8 characters long
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
              Confirm New Password
            </label>
            <Input.Password
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="Confirm your new password"
              prefix={<LockOutlined className="text-gray-400" />}
              size="large"
              className="h-11 rounded-lg"
              required
            />
          </div>
          
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={isSubmitting}
            className="w-full h-11 bg-orange-500 hover:bg-orange-600 border-0"
          >
            {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToLogin}
            className="text-orange-600 hover:text-orange-700"
          >
            Back to Login
          </Button>
        </div>
        
        <div className="mt-4 text-center">
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
      </Card>
    </div>
  );
};

export default ResetPassword;
