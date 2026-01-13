import React, { useEffect } from 'react';
import { Result, Button } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const SubscriptionCancel = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard/plans', { replace: true });
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="w-full flex justify-center items-center min-h-screen bg-gray-50">
      <Result
        status="warning"
        icon={<CloseCircleOutlined style={{ color: '#faad14' }} />}
        title="Payment Cancelled"
        subTitle="Your subscription update was cancelled. No charges were made."
        extra={[
          <Button type="primary" key="back" onClick={() => navigate('/dashboard/plans')}>
            Back to Plans
          </Button>,
        ]}
      />
    </div>
  );
};

export default SubscriptionCancel;

