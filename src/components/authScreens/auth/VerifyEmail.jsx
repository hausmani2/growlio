import React, { useEffect, useRef, useState } from 'react';
import { Button, Result, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet } from '../../../utils/axiosInterceptors';

/**
 * Legacy /authentication/verify-email/:token/ links redirect to set-password
 * with the same durable token (email is verified only when password is saved).
 */
const VerifyEmail = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const hasRequestedRef = useRef(false);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Preparing your password setup...');
  const [setupToken, setSetupToken] = useState('');
  const [email, setEmail] = useState('');

  const goToSetPassword = (tokenValue, emailValue) => {
    const emailParam = emailValue
      ? `&email=${encodeURIComponent(emailValue)}`
      : '';
    navigate(
      `/set-password?token=${encodeURIComponent(tokenValue)}${emailParam}`,
      { replace: true }
    );
  };

  useEffect(() => {
    if (!token || hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;

    const prepareSetup = async () => {
      try {
        const response = await apiGet(`/authentication/verify-email/${token}/`);
        const data = response?.data || {};
        const nextSetupToken = data.setup_token || token;
        const nextEmail = data?.data?.email || '';

        if (data.needs_password_setup && nextSetupToken) {
          setStatus('success');
          setSetupToken(nextSetupToken);
          setEmail(nextEmail);
          setMessage('Redirecting to set your password...');
          window.setTimeout(() => {
            goToSetPassword(nextSetupToken, nextEmail);
          }, 600);
          return;
        }

        setStatus('success');
        setMessage(data.message || 'Account already set up. Redirecting to login...');
        window.setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1200);
      } catch (error) {
        const backendMessage =
          error?.response?.data?.message || error?.response?.data?.error || '';
        setStatus('error');
        setMessage(
          backendMessage ||
            'This setup link is invalid or has already been used. Request a new one from signup.'
        );
      }
    };

    prepareSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, token]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Spin size="large" />
          <p className="mt-4 text-base text-gray-700">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Result
        status={status}
        title={status === 'success' ? 'Continue setup' : 'Setup link invalid'}
        subTitle={message}
        extra={
          status === 'success' ? (
            <Button
              type="primary"
              onClick={() => {
                if (setupToken) {
                  goToSetPassword(setupToken, email);
                } else {
                  navigate('/login', { replace: true });
                }
              }}
            >
              {setupToken ? 'Set Password' : 'Go to Login'}
            </Button>
          ) : (
            <Button onClick={() => navigate('/signup', { replace: true })}>
              Back to Signup
            </Button>
          )
        }
      />
    </div>
  );
};

export default VerifyEmail;
