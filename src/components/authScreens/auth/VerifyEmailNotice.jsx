import React, { useMemo } from 'react';
import { Button, Card, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import growlioLogo from '../../../assets/svgs/growlio-logo.png';

const { Title, Text } = Typography;

const VerifyEmailNotice = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('email') || '';
  }, [location.search]);

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
              Verify your email
            </Title>
            <Text className="block text-base text-gray-600">
              Your account is created successfully. Check your inbox and click the verification link to activate your account.
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
              <Button size="large" className="h-11" onClick={() => navigate('/login')}>
                Back to Login
              </Button>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              Didn&apos;t receive it? Check your spam folder, then try signing up again if needed.
            </div>
          </div>
        </Card>

        <div className="mt-5 text-sm text-gray-600">
          Need help? <a href="mailto:support@growlio.com" className="text-orange-600 hover:text-orange-700">support@growlio.com</a>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailNotice;
