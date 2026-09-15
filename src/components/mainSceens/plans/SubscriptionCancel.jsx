import React, { useEffect, useState } from 'react';
import { Result, Button } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { consumePosUpgradeReturn, ONBOARDING_ROUTES } from '../../../utils/onboardingUtils';

const getCancelRoute = () => {
  if (consumePosUpgradeReturn()) {
    return ONBOARDING_ROUTES.CONNECT_POS;
  }
  return '/dashboard/pricing';
};

const SubscriptionCancel = () => {
  const navigate = useNavigate();
  const [cancelRoute] = useState(() => getCancelRoute());

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(cancelRoute, { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [cancelRoute, navigate]);

  return (
    <div className="w-full flex justify-center items-center min-h-screen bg-gray-50">
      <Result
        status="warning"
        icon={<CloseCircleOutlined style={{ color: '#faad14' }} />}
        title="Payment Cancelled"
        subTitle="Your subscription update was cancelled. No charges were made."
        extra={[
          <Button type="primary" key="back" onClick={() => navigate(cancelRoute)}>
            Continue setup
          </Button>,
        ]}
      />
    </div>
  );
};

export default SubscriptionCancel;
