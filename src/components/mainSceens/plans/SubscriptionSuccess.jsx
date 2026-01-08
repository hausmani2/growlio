import React, { useEffect, useState } from 'react';
import { Result, Spin, message } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useStore from '../../../store/store';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const { fetchPackages, getCurrentPackage } = useStore();
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        // Set flag to force refresh when redirecting to plans page
        sessionStorage.setItem('returningFromPayment', 'true');
        
        // Force refresh packages and current package data to get latest subscription status
        await fetchPackages(true); // Force refresh
        await getCurrentPackage(true); // Force refresh to call subscription/current API
        
        // Show success message
        message.success('Subscription updated successfully!');
        
        // Redirect to plans page after a short delay
        setTimeout(() => {
          navigate('/dashboard/plans', { replace: true });
        }, 2000);
      } catch (error) {
        console.error('Error refreshing subscription data:', error);
        // Set flag anyway so plans page will refresh
        sessionStorage.setItem('returningFromPayment', 'true');
        message.error('Subscription updated, but failed to refresh data. Please refresh the page.');
        // Still redirect even if refresh fails
        setTimeout(() => {
          navigate('/dashboard/plans', { replace: true });
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      handleSuccess();
    } else {
      // No session ID, just redirect
      sessionStorage.setItem('returningFromPayment', 'true');
      message.warning('No session ID found. Redirecting to plans page...');
      setTimeout(() => {
        navigate('/dashboard/plans', { replace: true });
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
        subTitle="Your subscription has been updated successfully. Redirecting to plans page..."
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

