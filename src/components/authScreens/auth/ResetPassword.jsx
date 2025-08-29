import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input, Button, message, Card } from 'antd';
import { apiPost } from '../../../utils/axiosInterceptors';
import GrowlioLogo from '../../common/GrowlioLogo';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenFromUrl, setTokenFromUrl] = useState('');
  const navigate = useNavigate();

  // Extract token from URL query parameters on component mount
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setTokenFromUrl(urlToken);
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token.trim() || !password || !confirmPassword) {
      message.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      message.error('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiPost('/authentication/reset-password/', { 
        token, 
        new_password: password, 
        confirm_password: confirmPassword 
      });
      
      if (response.data.message) {
        message.success('Password reset successful! Please login with your new password.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to reset password. Please check your token and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <div className="text-center mb-6">
          <GrowlioLogo width={200} height={70} className="mx-auto" />
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
          <p className="text-gray-600">
            {tokenFromUrl 
              ? 'Enter your new password to complete the reset.' 
              : 'Enter your token and new password to reset your account.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tokenFromUrl && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Token</label>
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter the reset token"
                size="large"
                className="h-11 rounded-lg"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">New Password</label>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password (min 8 characters)"
              size="large"
              className="h-11 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">Confirm Password</label>
            <Input.Password
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
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
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            type="text"
            onClick={() => navigate('/login')}
            className="text-orange-600 hover:text-orange-700"
          >
            Back to Login
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;
