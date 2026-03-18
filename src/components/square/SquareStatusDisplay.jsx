import React, { useEffect } from 'react';
import { Card, Space, Typography, Tag, Button, Spin, Alert, Divider } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ReloadOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  GlobalOutlined,
  DollarOutlined,
  SafetyCertificateOutlined
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
  const squareMerchantDetail = useStore((state) => state.squareMerchantDetail);
  const merchantDetailLoading = useStore((state) => state.merchantDetailLoading);
  const lastStatusCheck = useStore((state) => state.lastStatusCheck);
  const checkSquareStatus = useStore((state) => state.checkSquareStatus);
  const fetchSquareMerchantDetail = useStore((state) => state.fetchSquareMerchantDetail);
  
  useEffect(() => {
    // Auto-check status on mount if not already checked
    if (!squareStatus && !squareLoading) {
      const restaurantIdToUse = restaurantId || localStorage.getItem('restaurant_id');
      if (restaurantIdToUse) {
        checkSquareStatus(restaurantIdToUse);
      }
    }
  }, [restaurantId, squareStatus, squareLoading, checkSquareStatus]);
  
  useEffect(() => {
    // Fetch merchant detail when connected
    if (squareStatus === 'connected') {
      const restaurantIdToUse = restaurantId || localStorage.getItem('restaurant_id');
      if (restaurantIdToUse && !squareMerchantDetail && !merchantDetailLoading) {
        fetchSquareMerchantDetail(restaurantIdToUse);
      }
    }
  }, [squareStatus, restaurantId, squareMerchantDetail, merchantDetailLoading, fetchSquareMerchantDetail]);
  
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
      
      {/* Connection Details & Merchant Info */}
      {isConnected && (squareConnectionData || squareMerchantDetail) && (
        <div className="mb-6">
          <Title level={5} className="!mb-4 !text-base font-semibold text-gray-900">
            Connection Details
          </Title>

          {merchantDetailLoading && (
            <div className="flex items-center justify-center gap-3 py-12 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-100">
              <Spin size="default" />
              <Text type="secondary" className="text-sm">Loading merchant details...</Text>
            </div>
          )}

          {!merchantDetailLoading && (squareMerchantDetail || squareConnectionData) && (
            <div className="space-y-4">
              {/* Merchant Hero Card - Business Name */}
              {(squareMerchantDetail?.business_name || squareConnectionData) && (
                <div className="rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border border-orange-100">
                  <div className="p-5 flex items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/80 border border-orange-100 flex items-center justify-center shadow-sm">
                      <ShopOutlined className="text-2xl text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text type="secondary" className="text-xs font-medium uppercase tracking-wider text-orange-600/80">
                        Connected Business
                      </Text>
                      <h3 className="text-lg font-bold text-gray-900 mt-0.5 truncate">
                        {squareMerchantDetail?.business_name || 'Square Merchant'}
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              {/* Details Grid - Business Name, Country, Currency, Merchant Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Country */}
                {squareMerchantDetail?.country && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <GlobalOutlined className="text-orange-500 text-base" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Country</Text>
                      <Text className="block text-sm font-medium text-gray-800 mt-1">{squareMerchantDetail.country}</Text>
                    </div>
                  </div>
                )}

                {/* Currency */}
                {squareMerchantDetail?.currency && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <DollarOutlined className="text-orange-500 text-base" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Currency</Text>
                      <Text className="block text-sm font-medium text-gray-800 mt-1">{squareMerchantDetail.currency}</Text>
                    </div>
                  </div>
                )}

                {/* Merchant Status */}
                {squareMerchantDetail?.merchant_status && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <SafetyCertificateOutlined className="text-orange-500 text-base" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Merchant Status</Text>
                      <Tag color="green" className="mt-1">
                        {squareMerchantDetail.merchant_status}
                      </Tag>
                    </div>
                  </div>
                )}

                {/* Merchant Created At */}
                {squareMerchantDetail?.merchant_created_at && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <ClockCircleOutlined className="text-orange-500 text-base" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Merchant Created</Text>
                      <Text className="block text-sm font-medium text-gray-800 mt-1">
                        {new Date(squareMerchantDetail.merchant_created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </div>
                  </div>
                )}

                {/* Connected Since (from status API) */}
                {squareConnectionData?.connected_at && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <ClockCircleOutlined className="text-orange-500 text-base" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">Connected Since</Text>
                      <Text className="block text-sm font-medium text-gray-800 mt-1">
                        {new Date(squareConnectionData.connected_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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

