import React from 'react';
import { Button, Space, Typography } from 'antd';
import { CheckCircleOutlined, LinkOutlined, LoadingOutlined } from '@ant-design/icons';
import useStore from '../../store/store';

const { Text } = Typography;

/**
 * Square Connect Button Component
 * Initiates the Square POS OAuth connection flow
 */
const SquareConnectButton = ({
  restaurantId,
  onConnect,
  className = '',
  disabled = false,
  size = 'large',
  connectLabel = 'Connect POS Integration',
  hideWhenConnected = false,
  ctaClassName = '',
  connectIcon = null,
}) => {
  const squareStatus = useStore((state) => state.squareStatus);
  const squareLoading = useStore((state) => state.squareLoading);
  const connectSquare = useStore((state) => state.connectSquare);
  
  const handleConnect = async () => {
    if (disabled) return;
    const restaurantIdToUse = restaurantId || localStorage.getItem('restaurant_id');
    
    if (!restaurantIdToUse) {
      return;
    }
    
    if (onConnect) {
      onConnect();
    }
    
    await connectSquare(restaurantIdToUse);
  };
  
  const isConnected = squareStatus === 'connected';
  const isConnecting = squareStatus === 'connecting' || squareLoading;

  if (hideWhenConnected && isConnected) {
    return null;
  }
  
  return (
    <Space direction="vertical" size="middle" className={`w-full ${className}`}>
      {isConnected ? (
        <Button
          type="default"
          icon={<CheckCircleOutlined />}
          disabled
          className="w-full"
          size={size}
        >
          POS Integration Connected
        </Button>
      ) : (
        <Button
          type="primary"
          icon={isConnecting ? <LoadingOutlined /> : (connectIcon || <LinkOutlined />)}
          onClick={handleConnect}
          loading={isConnecting}
          disabled={disabled || isConnecting || !restaurantId}
          className={`w-full !bg-orange-500 hover:!bg-orange-600 !border-orange-500 ${ctaClassName}`}
          size={size}
        >
          {isConnecting ? 'Connecting to Square...' : connectLabel}
        </Button>
      )}
      
      {!restaurantId && (
        <Text type="secondary" className="text-xs">
          Restaurant ID is required to connect Square
        </Text>
      )}
    </Space>
  );
};

export default SquareConnectButton;

