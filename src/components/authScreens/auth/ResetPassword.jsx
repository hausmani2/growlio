import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, message, Card } from 'antd';
import { apiPost } from '../../../utils/axiosInterceptors';
import GrowlioLogo from '../../common/GrowlioLogo';

const ResetPassword = () => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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

    setIsSubmitting(true);

    try {
      const response = await apiPost('/authentication/reset-password/', { token, password, confirm_password: confirmPassword });
      if (response.data.message) {
        message.success('Password reset successful!');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      message.error('Failed to reset password. Please try again.');
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
          <p className="text-gray-600">Enter your token and new password to reset your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">New Password</label>
            <Input.Password
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
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
      </Card>
    </div>
  );
};

export default ResetPassword;
