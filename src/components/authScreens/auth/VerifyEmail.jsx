import React, { useEffect, useRef, useState } from 'react';
import { Button, Result, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet } from '../../../utils/axiosInterceptors';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const hasRequestedRef = useRef(false);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token || hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;

    const verifyEmail = async () => {
      try {
        await apiGet(`/authentication/verify-email/${token}/`);
        setStatus('success');
        setMessage('Email verified successfully. Redirecting to login...');

        window.setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      } catch (error) {
        const statusCode = error?.response?.status;
        const backendMessage =
          error?.response?.data?.message || error?.response?.data?.error || '';

        let errorMessage = 'This verification link is invalid or has expired.';

        if (
          statusCode === 403 ||
          /access forbidden|permission to perform this action/i.test(backendMessage)
        ) {
          errorMessage = 'This verification link is invalid, expired, or has already been used.';
        } else if (backendMessage) {
          errorMessage = backendMessage;
        }

        setStatus('error');
        setMessage(errorMessage);
      }
    };

    verifyEmail();
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
        title={status === 'success' ? 'Email Verified' : 'Verification Failed'}
        subTitle={message}
        extra={
          status === 'success' ? (
            <Button type="primary" onClick={() => navigate('/login', { replace: true })}>
              Go to Login
            </Button>
          ) : (
            <Button onClick={() => navigate('/signup', { replace: true })}>
              Create Account Again
            </Button>
          )
        }
      />
    </div>
  );
};

export default VerifyEmail;
