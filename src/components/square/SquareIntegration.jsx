import React, { useEffect } from 'react';
import { Card, Space, Typography, Divider } from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';
import SquareConnectButton from './SquareConnectButton';
import SquareStatusDisplay from './SquareStatusDisplay';
import useStore from '../../store/store';

const { Paragraph } = Typography;

/**
 * Square Integration Main Component
 * Main component for Square POS integration management
 */
const SquareIntegration = ({ restaurantId, className = '' }) => {
  const checkSquareStatus = useStore((state) => state.checkSquareStatus);
  const squareStatus = useStore((state) => state.squareStatus);
  
  const restaurantIdToUse = restaurantId || localStorage.getItem('restaurant_id');
  
  useEffect(() => {
    // Check status on mount
    if (restaurantIdToUse) {
      checkSquareStatus(restaurantIdToUse);
    }
  }, [restaurantIdToUse, checkSquareStatus]);
  
  const handleConnect = () => {
    // Status will be checked after connection completes
    // This is handled by the callback handler
  };
  
  return (
    <div className={`w-full mx-auto ${className}`}>
      {/* Header Section - Matching application design pattern */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
          {/* Left Side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              Square POS Integration
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
                  Click the button below to connect your Square POS account. You'll be redirected 
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
                  Your Square POS is connected and active. Sales data will be automatically 
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

