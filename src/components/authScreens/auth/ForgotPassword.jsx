import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input, Button, message, Card } from 'antd';
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <div className="text-center">
            <div className="mb-6">
              <GrowlioLogo width={200} height={70} className="mx-auto" />
            </div>
            
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MailOutlined className="text-2xl text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Check Your Email</h2>
              <p className="text-gray-600">
                We've sent a password reset token to <strong>{email}</strong>
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left">
                <h4 className="font-semibold text-blue-800 mb-2">Next Steps:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Check your email for the password reset email</li>
                  <li>2. Click the "Reset Password Now" button in the email</li>
                  <li>3. Or copy the token and go to the reset password page</li>
                  <li>4. Enter your new password and complete the reset</li>
                </ol>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/reset-password')}
                className="w-full bg-orange-500 hover:bg-orange-600 border-0"
              >
                Go to Reset Password
              </Button>
              
              <Button
                type="default"
                size="large"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full"
              >
                Resend Email
              </Button>
              
              <Button
                type="default"
                size="large"
                onClick={handleBackToLogin}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <div className="text-center mb-6">
          <GrowlioLogo width={200} height={70} className="mx-auto" />
        </div>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password?</h2>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              prefix={<MailOutlined className="text-gray-400" />}
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
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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
      </Card>
    </div>
  );
};

export default ForgotPassword;
