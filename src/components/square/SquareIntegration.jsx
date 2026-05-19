import React, { useEffect, useState } from 'react';
import { Button, Card, Space, Spin, Typography } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import SquareConnectButton from './SquareConnectButton';
import SquareStatusDisplay from './SquareStatusDisplay';
import useStore from '../../store/store';
import useTooltips from '../../utils/useTooltips';
import TooltipIcon from '../common/TooltipIcon';

const { Paragraph } = Typography;

const getPlanName = (plan) =>
  String(plan?.key || plan?.name || plan?.display_name || plan?.package_name || '')
    .trim()
    .toLowerCase();

const isPaidPosPlan = (planName) => planName.includes('grow') || planName.includes('pro');

/**
 * Square Integration Main Component
 * Main component for Square POS integration management
 */
const SquareIntegration = ({ restaurantId, className = '' }) => {
  const navigate = useNavigate();
  const checkSquareStatus = useStore((state) => state.checkSquareStatus);
  const squareStatus = useStore((state) => state.squareStatus);
  const subscriptionDetails = useStore((state) => state.subscriptionDetails);
  const subscriptionDetailsLoading = useStore((state) => state.subscriptionDetailsLoading);
  const fetchCurrentSubscriptionDetails = useStore((state) => state.fetchCurrentSubscriptionDetails);
  const currentPackage = useStore((state) => state.currentPackage);
  const tooltips = useTooltips('square-pos');
  const [isCheckingPlan, setIsCheckingPlan] = useState(true);
  const [latestPlanName, setLatestPlanName] = useState('');
  
  const restaurantIdToUse = restaurantId || localStorage.getItem('restaurant_id');
  
  useEffect(() => {
    let isMounted = true;

    // Check status on mount
    if (restaurantIdToUse) {
      checkSquareStatus(restaurantIdToUse);
      setIsCheckingPlan(true);
      const subscriptionPromise = fetchCurrentSubscriptionDetails?.(true);
      if (subscriptionPromise?.finally) {
        subscriptionPromise
          .then((result) => {
            if (isMounted) {
              setLatestPlanName(getPlanName(result?.data?.package));
            }
          })
          .finally(() => {
            if (isMounted) setIsCheckingPlan(false);
          });
      } else {
        setIsCheckingPlan(false);
      }
    } else {
      setIsCheckingPlan(false);
    }

    return () => {
      isMounted = false;
    };
  }, [restaurantIdToUse, checkSquareStatus, fetchCurrentSubscriptionDetails]);

  const currentPlanName = latestPlanName || getPlanName(subscriptionDetails?.package || currentPackage);
  const canUsePosIntegrations = isPaidPosPlan(currentPlanName);
  
  const handleConnect = () => {
    // Status will be checked after connection completes
    // This is handled by the callback handler
  };

  if (isCheckingPlan || subscriptionDetailsLoading) {
    return (
      <div className={`w-full mx-auto ${className}`}>
        <Card className="shadow-lg border border-gray-100">
          <div className="flex min-h-[220px] items-center justify-center">
            <Spin size="large" tip="Checking subscription..." />
          </div>
        </Card>
      </div>
    );
  }

  if (!canUsePosIntegrations) {
    return (
      <div className={`w-full mx-auto ${className}`}>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex-1 border-b border-gray-200 pb-3">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              POS Integration
              <TooltipIcon text={tooltips?.header} />
            </h1>
            <p className="text-gray-600 text-lg">
              Connect your point-of-sale system to unlock automated restaurant data sync.
            </p>
          </div>
        </div>

        <Card className="shadow-lg border border-orange-100">
          <div className="flex flex-col gap-5 p-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <StarOutlined className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Upgrade Required</h2>
                <Paragraph className="!mb-0 max-w-3xl text-gray-600 leading-6">
                  This feature is not available on the Lite plan. Upgrade to the Grow or Pro plans
                  to unlock POS integrations, automation tools, advanced insights, more access to
                  LIO, and more powerful ways to simplify your restaurant operations.
                </Paragraph>
              </div>
            </div>
            <Button type="primary" size="large" onClick={() => navigate('/dashboard/pricing')}>
              Upgrade My Plan
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`w-full mx-auto ${className}`}>
      {/* Header Section - Matching application design pattern */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
          {/* Left Side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              POS Integration
              <TooltipIcon text={tooltips?.header} />
            </h1>
            <p className="text-gray-600 text-lg">
              Connect your Square Point of Sale system to sync sales data, process payments, 
              and manage your restaurant operations seamlessly.
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="w-full">
        <Space direction="vertical" size="large" className="w-full">
          {/* Status Display */}
          <SquareStatusDisplay 
            restaurantId={restaurantIdToUse}
            showRefresh={true}
          />
          
          {/* Connect Button */}
          {squareStatus !== 'connected' && (
            <Card className="shadow-lg border border-gray-100">
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Get Started</h2>
                <Paragraph className="text-gray-600 mb-4">
                  Click the button below to connect your POS account. You'll be redirected 
                  to Square to authorize the connection.
                </Paragraph>
                <SquareConnectButton 
                  restaurantId={restaurantIdToUse}
                  onConnect={handleConnect}
                />
              </div>
            </Card>
          )}
          
          {/* Connected Info */}
          {squareStatus === 'connected' && (
            <Card className="shadow-lg border border-gray-100">
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Integration Active</h2>
                <Paragraph className="text-gray-600">
                  Your POS integration is connected and active. Sales data will be automatically 
                  synced to your dashboard.
                </Paragraph>
              </div>
            </Card>
          )}
        </Space>
      </div>
    </div>
  );
};

export default SquareIntegration;

