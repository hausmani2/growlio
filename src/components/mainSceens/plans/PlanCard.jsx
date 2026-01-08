import React from 'react';
import { Card, Button, Typography, Tag, Divider, Badge } from 'antd';
import { CheckCircleOutlined, StarOutlined, CaretUpOutlined, CaretDownOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PlanCard = ({ 
  plan, 
  isCurrentPlan = false, 
  isPopular = false,
  onClick,
  onToggleFeatures,
  isFeaturesExpanded = false
}) => {
  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Free';
    return `$${parseFloat(price).toFixed(0)}`;
  };

  // Convert features object to array for display
  const featuresArray = plan.features ? Object.entries(plan.features).map(([key, value]) => ({
    key: key,
    label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    value: value,
    included: value !== false && value !== null && value !== 'false'
  })) : [];

  // Get top features for preview (first 5)
  const topFeatures = featuresArray.slice(0, 5);

  return (
    <div className="relative w-full h-full flex">
      {/* Popular/Current Badge */}
      {(isPopular || isCurrentPlan) && (
        <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 z-20 px-4 py-1 rounded-full text-white text-xs font-bold shadow-lg whitespace-nowrap ${
          isCurrentPlan 
            ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600'
        }`}>
          {isCurrentPlan ? (
            <span className="flex items-center gap-1.5">
              <CheckCircleOutlined className="text-sm" />
              <span>Current Plan</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <StarOutlined className="text-sm" />
              <span>Most Popular</span>
            </span>
          )}
        </div>
      )}

      <Card
        className={`relative w-full h-full transition-all duration-300 flex flex-col ${
          isCurrentPlan 
            ? 'border-2 border-orange-500 shadow-2xl bg-white' 
            : isPopular
            ? 'border-2 border-blue-500 shadow-xl bg-white hover:shadow-2xl'
            : 'border border-gray-200 hover:border-orange-400 hover:shadow-xl bg-white'
        }`}
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        bodyStyle={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px'
        }}
        onClick={(e) => {
          // Prevent card click from interfering with button clicks
          if (e.target.closest('button')) {
            return;
          }
        }}
      >
        <div className="flex flex-col h-full flex-1">
          {/* Plan Header with Gradient Background */}
          <div className={`text-center mb-2 pt-5 pb-5 -mx-6 -mt-6 rounded-t-lg ${
            isCurrentPlan 
              ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
              : isPopular
              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
              : 'bg-gradient-to-r from-gray-100 to-gray-200'
          }`}>
            <Title 
              level={2} 
              className={`!mb-0 !text-2xl font-bold ${
                isCurrentPlan || isPopular ? 'text-white' : 'text-gray-800'
              }`}
            >
              {plan.display_name || plan.name}
            </Title>
            {plan.max_locations && (
              <Text className={`text-xs mt-1.5 block ${
                isCurrentPlan || isPopular ? 'text-orange-100' : 'text-gray-600'
              }`}>
                {plan.max_locations === 9999 ? 'Unlimited' : `Up to ${plan.max_locations}`} Locations
              </Text>
            )}
          </div>

          {/* Price Section */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <Text className="text-4xl font-bold text-gray-900">
                {formatPrice(plan.price_per_location)}
              </Text>
              {plan.price_per_location && plan.price_per_location > 0 && (
                <Text type="secondary" className="text-base">
                  /location/month
                </Text>
              )}
            </div>
            {plan.max_users && plan.max_users !== 9999 && (
              <Text type="secondary" className="text-xs block mt-2">
                {plan.max_users} {plan.max_users === 1 ? 'User' : 'Users'} Included
              </Text>
            )}
            {plan.max_users === 9999 && (
              <Text type="secondary" className="text-xs block mt-2">
                Unlimited Users
              </Text>
            )}
          </div>

          <Divider className="my-4" />

          {/* Features Preview */}
          {topFeatures.length > 0 && (
            <div className="flex-1 mb-4 min-h-[160px]">
              <Text strong className="text-gray-800 mb-3 block text-xs font-semibold">
                Key Features:
              </Text>
              <div className="space-y-2">
                {topFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    {feature.included ? (
                      <CheckOutlined className="text-green-500 mt-0.5 flex-shrink-0 text-xs" />
                    ) : (
                      <CloseOutlined className="text-gray-300 mt-0.5 flex-shrink-0 text-xs" />
                    )}
                    <div className="flex-1 min-w-0">
                      <Text className={`text-xs leading-relaxed ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.label}
                      </Text>
                      {typeof feature.value === 'string' && feature.value !== 'true' && feature.value !== 'false' && (
                        <Text type="secondary" className="text-xs block mt-0.5">
                          ({feature.value})
                        </Text>
                      )}
                    </div>
                  </div>
                ))}
                {featuresArray.length > 5 && (
                  <Text type="secondary" className="text-xs block pl-5 mt-2 font-medium">
                    +{featuresArray.length - 5} more features
                  </Text>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-auto space-y-2 pt-4 border-t border-gray-100">
            {featuresArray.length > 0 && (
              <Button
                type="text"
                block
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (onToggleFeatures) {
                    onToggleFeatures(e);
                  }
                }}
                className="flex items-center justify-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-10 text-sm font-medium transition-all duration-200 rounded-lg"
                size="middle"
                icon={
                  isFeaturesExpanded ? (
                    <CaretUpOutlined className="text-base transition-transform duration-200" />
                  ) : (
                    <CaretDownOutlined className="text-base transition-transform duration-200" />
                  )
                }
              >
                {isFeaturesExpanded ? 'Hide All Features' : 'View All Features'}
              </Button>
            )}
            
            <Button
              type={isCurrentPlan ? 'default' : 'primary'}
              block
              size="large"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              disabled={isCurrentPlan}
              className={`h-11 text-sm font-semibold transition-all ${
                isCurrentPlan 
                  ? 'bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-0 shadow-lg hover:shadow-xl'
              }`}
            >
              {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
            </Button>
          </div>
        </div>

        {/* Expanded Features Section */}
        {isFeaturesExpanded && featuresArray.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <FeaturesList features={featuresArray} />
          </div>
        )}
      </Card>
    </div>
  );
};

// Features List Component
const FeaturesList = ({ features }) => {
  // Group features by category
  const categorizedFeatures = {
    'Core Features': [],
    'Analytics & Reporting': [],
    'Integrations': [],
    'Support': [],
    'Other': []
  };

  features.forEach(feature => {
    const key = feature.key.toLowerCase();
    if (key.includes('user') || key.includes('location') || key.includes('dashboard')) {
      categorizedFeatures['Core Features'].push(feature);
    } else if (key.includes('report') || key.includes('forecast') || key.includes('analytics') || key.includes('budget')) {
      categorizedFeatures['Analytics & Reporting'].push(feature);
    } else if (key.includes('integration') || key.includes('pos')) {
      categorizedFeatures['Integrations'].push(feature);
    } else if (key.includes('support') || key.includes('priority')) {
      categorizedFeatures['Support'].push(feature);
    } else {
      categorizedFeatures['Other'].push(feature);
    }
  });

  return (
    <div className="space-y-4">
      {Object.entries(categorizedFeatures).map(([category, categoryFeatures]) => {
        if (categoryFeatures.length === 0) return null;
        
        return (
          <div key={category}>
            <Text strong className="text-gray-800 mb-2 block text-sm">
              {category}
            </Text>
            <div className="space-y-2">
              {categoryFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {feature.included ? (
                    <CheckOutlined className="text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CloseOutlined className="text-gray-300 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <Text className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                      {feature.label}
                    </Text>
                    {typeof feature.value === 'string' && feature.value !== 'true' && feature.value !== 'false' && (
                      <Text type="secondary" className="text-xs block mt-0.5">
                        {feature.value}
                      </Text>
                    )}
                  </div>
                  {feature.included && typeof feature.value === 'boolean' && (
                    <Tag color="green" className="text-xs">Included</Tag>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlanCard;
