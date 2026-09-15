import React, { useEffect, useState } from 'react';
import { Result, Spin, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useStore from '../../../store/store';
import { consumePosUpgradeReturn, ONBOARDING_ROUTES } from '../../../utils/onboardingUtils';

const getPostPaymentRoute = () => {
  if (consumePosUpgradeReturn()) {
    return `${ONBOARDING_ROUTES.CONNECT_POS}?upgraded=1`;
  }
  return '/dashboard/pricing';
};

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const { fetchPackages, getCurrentPackage } = useStore();
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const handleSuccess = async () => {
      const nextRoute = getPostPaymentRoute();
      try {
        sessionStorage.setItem('returningFromPayment', 'true');
        await fetchPackages(true);
        await getCurrentPackage(true);
        message.success('Subscription updated successfully!');
        setTimeout(() => {
          navigate(nextRoute, { replace: true });
        }, 2000);
      } catch (error) {
        console.error('Error refreshing subscription data:', error);
        sessionStorage.setItem('returningFromPayment', 'true');
        message.error('Subscription updated, but failed to refresh data. Please refresh the page.');
        setTimeout(() => {
          navigate(nextRoute, { replace: true });
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      handleSuccess();
    } else {
      sessionStorage.setItem('returningFromPayment', 'true');
      const nextRoute = getPostPaymentRoute();
      message.warning('No session ID found. Redirecting...');
      setTimeout(() => {
        navigate(nextRoute, { replace: true });
      }, 1500);
    }
  }, [sessionId, navigate, fetchPackages, getCurrentPackage]);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Processing your subscription..." />
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center min-h-screen bg-gray-50">
      <Result
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        title="Payment Successful!"
        subTitle="Your subscription has been updated successfully. Taking you back to setup..."
        extra={
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              {sessionId && `Session ID: ${sessionId}`}
            </p>
            <p className="text-sm text-gray-500">
              You will be redirected automatically in a few seconds.
            </p>
          </div>
        }
      />
    </div>
  );
};

export default SubscriptionSuccess;
