import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, message } from 'antd';
import Lock from '../../../assets/svgs/lock.svg';
import growlioLogo from '../../../assets/svgs/growlio-logo.png';
import useStore from '../../../store/store';
import { apiPost } from '../../../utils/axiosInterceptors';
import { clearClientSessionStorage } from '../../../utils/clearClientSession';

const SetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const applyAuth = (payload) => {
    const { access, refresh, ...userData } = payload?.data || payload || {};
    if (!access) return false;
    clearClientSessionStorage();
    localStorage.setItem('token', access);
    localStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('token', access);
    sessionStorage.setItem('user', JSON.stringify(userData));
    useStore.setState({
      user: userData,
      token: access,
      activeToken: access,
      isAuthenticated: true,
      loading: false,
      error: null,
    });
    window.dispatchEvent(new Event('auth-storage-change'));
    return true;
  };

  const parseBackendErrors = (data) => {
    if (!data) return { password: 'Failed to set password' };

    // Django validate_password: { "error": ["This password is too common.", ...] }
    if (Array.isArray(data.error)) {
      return { password: data.error.filter(Boolean).join(' ') };
    }
    if (typeof data.error === 'string') {
      return { password: data.error };
    }
    // Serializer field errors: { password: ["..."], confirm_password: ["..."] }
    const next = {};
    if (Array.isArray(data.password) && data.password.length) {
      next.password = data.password.join(' ');
    } else if (typeof data.password === 'string') {
      next.password = data.password;
    }
    if (Array.isArray(data.confirm_password) && data.confirm_password.length) {
      next.confirmPassword = data.confirm_password.join(' ');
    } else if (typeof data.confirm_password === 'string') {
      next.confirmPassword = data.confirm_password;
    }
    if (typeof data.detail === 'string') {
      next.password = next.password || data.detail;
    }
    if (!next.password && !next.confirmPassword) {
      next.password = 'Failed to set password';
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!token) nextErrors.token = 'Missing setup link. Open the Set Password button from your email.';
    if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      const res = await apiPost('/authentication/set-password/', {
        token,
        password,
        confirm_password: confirmPassword,
      });
      const ok = applyAuth(res.data);
      message.success('Password set successfully');
      navigate(ok ? '/congratulations' : '/login', {
        replace: true,
        state: { skipSetupCheck: true },
      });
    } catch (error) {
      const parsed = parseBackendErrors(error?.response?.data);
      setErrors(parsed);
      if (parsed.password) {
        message.error(parsed.password);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={growlioLogo} alt="Growlio Logo" className="w-48 mx-auto" />
        </div>
        <form
          onSubmit={handleSubmit}
          className="w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-orange-600 mb-2">Set your password</h1>
            <p className="text-gray-600 text-sm">
              {email
                ? `Finish setting up ${email}`
                : 'Create a password to secure your Growlio account.'}
            </p>
          </div>

          {!token && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Open the <span className="font-semibold">Set Password</span> button from your
              signup email, or{' '}
              <Link to="/signup" className="underline font-semibold">
                sign up again
              </Link>
              .
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <Input.Password
                size="large"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="Enter password"
                prefix={<img src={Lock} alt="" className="h-5 w-5" />}
                className="!h-11"
                status={errors.password ? 'error' : ''}
              />
              {errors.password ? (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              ) : (
                <p className="text-gray-500 text-sm mt-1">
                  Password must be at least 8 characters
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Confirm password
              </label>
              <Input.Password
                size="large"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                placeholder="Re-enter password"
                prefix={<img src={Lock} alt="" className="h-5 w-5" />}
                className="!h-11"
                status={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {errors.token && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errors.token}
            </div>
          )}

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            className="w-full mt-6 h-11 bg-gradient-to-r from-orange-500 to-orange-600 border-0"
          >
            Save password & continue
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already finished?{' '}
            <Link to="/login" className="text-orange-600 font-semibold">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SetPassword;
