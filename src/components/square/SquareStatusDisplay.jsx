import React, { useEffect } from 'react';
import { Card, Space, Typography, Tag, Button, Spin, Alert, Divider } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ReloadOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import useStore from '../../store/store';

const { Title, Text, Paragraph } = Typography;

/**
 * Square Status Display Component
 * Shows the current Square POS connection status and allows status refresh
 */
const SquareStatusDisplay = ({ restaurantId, showRefresh = true, className = '' }) => {
  const squareStatus = useStore((state) => state.squareStatus);
  const squareLoading = useStore((state) => state.squareLoading);
  const squareError = useStore((state) => state.squareError);
  const squareConnectionData = useStore((state) => state.squareConnectionData);
  const lastStatusCheck = useStore((state) => state.lastStatusCheck);
  const checkSquareStatus = useStore((state) => state.checkSquareStatus);
  
  useEffect(() => {
    // Auto-check status on mount if not already checked
    if (!squareStatus && !squareLoading) {
      const restaurantIdToUse = restaurantId || localStorage.getItem('restaurant_id');
      if (restaurantIdToUse) {
        checkSquareStatus(restaurantIdToUse);
      }
    }
  }, [restaurantId, squareStatus, squareLoading, checkSquareStatus]);
  
  const handleRefresh = () => {
    const restaurantIdToUse = restaurantId || localStorage.getItem('restaurant_id');
    if (restaurantIdToUse) {
      checkSquareStatus(restaurantIdToUse);
    }
  };
  
  const getStatusConfig = () => {
    switch (squareStatus) {
      case 'connected':
        return {
          icon: <CheckCircleOutlined className="text-3xl" />,
          iconColor: 'text-green-500',
          bgGradient: 'bg-gradient-to-r from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          badgeClass: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
          text: 'Connected',
          description: 'Square POS is connected and ready to use. Your sales data will be automatically synced.',
          statusColor: 'success'
        };
      case 'connecting':
        return {
          icon: <Spin size="large" />,
          iconColor: 'text-blue-500',
          bgGradient: 'bg-gradient-to-r from-blue-50 to-cyan-50',
          borderColor: 'border-blue-200',
          badgeClass: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
          text: 'Connecting...',
          description: 'Establishing secure connection with Square POS. Please wait...',
          statusColor: 'processing'
        };
      case 'error':
        return {
          icon: <CloseCircleOutlined className="text-3xl" />,
          iconColor: 'text-red-500',
          bgGradient: 'bg-gradient-to-r from-red-50 to-rose-50',
          borderColor: 'border-red-200',
          badgeClass: 'bg-gradient-to-r from-red-500 to-rose-500 text-white',
          text: 'Connection Error',
          description: 'There was an error establishing the Square connection. Please try again.',
          statusColor: 'error'
        };
      case 'disconnected':
      default:
        return {
          icon: <CloseCircleOutlined className="text-3xl" />,
          iconColor: 'text-gray-400',
          bgGradient: 'bg-gradient-to-r from-gray-50 to-slate-50',
          borderColor: 'border-gray-200',
          badgeClass: 'bg-gradient-to-r from-gray-400 to-slate-400 text-white',
          text: 'Not Connected',
          description: 'Square POS is not connected. Connect to enable Square features and sync sales data.',
          statusColor: 'default'
        };
    }
  };
  
  const statusConfig = getStatusConfig();
  const isConnected = squareStatus === 'connected';
  
  const formatLastChecked = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  return (
    <Card 
      className={`shadow-lg border border-gray-100 ${className}`}
      style={{ borderRadius: '16px' }}
      loading={squareLoading && !squareStatus}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${statusConfig.bgGradient}`}>
            <InfoCircleOutlined className="text-xl text-gray-600" />
          </div>
          <div>
            <Title level={4} className="!mb-0 !text-xl font-bold text-gray-900">
              Square POS Status
            </Title>
            <Text type="secondary" className="text-sm">
              Integration connection status
            </Text>
          </div>
        </div>
        {showRefresh && (
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={squareLoading}
            size="middle"
            className="border-gray-300 hover:border-orange-400 hover:text-orange-500"
          >
            Refresh
          </Button>
        )}
      </div>

      {/* Status Display Section */}
      <div className={`rounded-xl p-6 mb-6 border-2 ${statusConfig.bgGradient} ${statusConfig.borderColor}`}>
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div className={`flex-shrink-0 ${statusConfig.iconColor}`}>
            {statusConfig.icon}
          </div>
          
          {/* Status Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm ${statusConfig.badgeClass}`}>
                {statusConfig.text}
              </span>
            </div>
            <Paragraph className="!mb-0 text-gray-700 leading-relaxed">
              {statusConfig.description}
            </Paragraph>
          </div>
        </div>
      </div>
        
      {/* Error Message */}
      {squareError && (
        <Alert
          message="Connection Error"
          description={squareError}
          type="error"
          showIcon
          closable
          className="mb-6 rounded-lg"
        />
      )}
      
      {/* Connection Details */}
      {isConnected && squareConnectionData && (
        <div className="mb-6">
          <Title level={5} className="!mb-4 !text-base font-semibold text-gray-900">
            Connection Details
          </Title>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {squareConnectionData.merchant_id && (
              <div className="flex items-center justify-between">
                <Text className="text-sm font-medium text-gray-600">Merchant ID</Text>
                <Text code className="text-sm bg-white px-2 py-1 rounded border border-gray-200">
                  {squareConnectionData.merchant_id}
                </Text>
              </div>
            )}
            {squareConnectionData.location_id && (
              <div className="flex items-center justify-between">
                <Text className="text-sm font-medium text-gray-600">Location ID</Text>
                <Text code className="text-sm bg-white px-2 py-1 rounded border border-gray-200">
                  {squareConnectionData.location_id}
                </Text>
              </div>
            )}
            {squareConnectionData.connected_at && (
              <div className="flex items-center justify-between">
                <Text className="text-sm font-medium text-gray-600">Connected Since</Text>
                <Text className="text-sm text-gray-700">
                  {new Date(squareConnectionData.connected_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Last Check Time */}
      {lastStatusCheck && (
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          <ClockCircleOutlined className="text-gray-400" />
          <Text type="secondary" className="text-xs">
            Last checked: {formatLastChecked(lastStatusCheck)}
          </Text>
        </div>
      )}
    </Card>
  );
};

export default SquareStatusDisplay;

