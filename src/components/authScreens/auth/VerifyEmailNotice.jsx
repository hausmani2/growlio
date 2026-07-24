import React, { useMemo, useState } from 'react';
import { Button, Card, Typography, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import growlioLogo from '../../../assets/svgs/growlio-logo.png';
import { apiPost } from '../../../utils/axiosInterceptors';

const { Title, Text } = Typography;

const VerifyEmailNotice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [resending, setResending] = useState(false);

  const email = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('email') || '';
  }, [location.search]);

  const handleResend = async () => {
    if (!email) {
      message.error('Missing email address.');
      return;
    }
    setResending(true);
    try {
      const redirectUrl = `${window.location.origin}/set-password`;
      await apiPost(
        `/authentication/resend-verification/?redirect_url=${encodeURIComponent(redirectUrl)}`,
        { email, redirect_url: redirectUrl }
      );
      message.success('Setup email resent. Check your inbox.');
    } catch (error) {
      const data = error?.response?.data;
      message.error(data?.message || data?.error || 'Could not resend email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 via-white to-white px-4 py-8">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center">
        <img src={growlioLogo} alt="Growlio Logo" className="mb-6 w-44" />

        <Card className="w-full rounded-2xl border border-gray-100 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-2xl">
              ✉️
            </div>
            <Title level={2} className="!mb-2 !text-orange-600">
              Set your password
            </Title>
            <Text className="block text-base text-gray-600">
              Check your inbox and click <span className="font-semibold">Set Password</span> to
              activate your account. The link stays valid until you finish.
            </Text>
            {email && (
              <Text className="mt-3 block text-sm text-gray-700">
                We sent the email to <span className="font-semibold">{email}</span>
              </Text>
            )}

            <div className="mt-6 grid gap-3">
              <Button
                type="primary"
                size="large"
                className="h-11 bg-gradient-to-r from-orange-500 to-orange-600 border-0 hover:from-orange-600 hover:to-orange-700"
                onClick={() => window.open('https://mail.google.com/', '_blank', 'noopener,noreferrer')}
              >
                Open Gmail
              </Button>
              {email && (
                <Button size="large" className="h-11" loading={resending} onClick={handleResend}>
                  Resend setup email
                </Button>
              )}
              <Button size="large" className="h-11" onClick={() => navigate('/login')}>
                Back to Login
              </Button>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              Didn&apos;t receive it? Check spam, then resend the setup email.
            </div>
          </div>
        </Card>

        <div className="mt-5 text-sm text-gray-600">
          Need help?{' '}
          <a href="mailto:support@growlio.com" className="text-orange-600 hover:text-orange-700">
            support@growlio.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailNotice;
