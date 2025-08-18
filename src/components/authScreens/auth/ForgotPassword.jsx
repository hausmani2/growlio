import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input, Button, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { apiPost } from '../../../utils/axiosInterceptors';
import GrowlioLogo from '../../common/GrowlioLogo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      message.error('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await apiPost('/authentication/forgot-password/', { email });
      
      if (response.data.message) {
        setEmailSent(true);
        message.success('If the email is valid, a reset link has been sent.');
      }
    } catch (error) {
      console.error('Error sending reset email:', error);
      message.error('Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (emailSent) {
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
                <MailOutlined className="text-2xl text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-orange-600 mb-3">
                Check Your Email! 📧
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed max-w-sm mx-auto">
                We've sent a password reset token to <strong>{email}</strong>
              </p>
            </div>
            
            <div className="mb-6 p-4 bg-blue-50 rounded-lg text-left">
              <h4 className="font-semibold text-blue-800 mb-2">Next Steps:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Check your email for the password reset email</li>
                <li>2. Click the "Reset Password Now" button in the email</li>
                <li>3. Or copy the token and go to the reset password page</li>
                <li>4. Enter your new password and complete the reset</li>
              </ol>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/reset-password')}
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 border-0 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Go to Reset Password
              </Button>
              
              <Button
                type="default"
                size="large"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-11 border border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-600 transition-all duration-200 rounded-lg"
              >
                Resend Email
              </Button>
              
              <Button
                type="text"
                size="large"
                onClick={handleBackToLogin}
                className="w-full text-orange-600 hover:text-orange-700 transition-colors duration-200 hover:underline"
              >
                Back to Login
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
              Forgot Password? 🔑
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed max-w-sm mx-auto">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="email">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                prefix={<MailOutlined className="text-gray-400" />}
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
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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
      </div>
    </div>
  );
};

export default ForgotPassword;
