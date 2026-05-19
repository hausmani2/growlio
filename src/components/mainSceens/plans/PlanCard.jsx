import React from 'react';
import { Card, Button, Typography, Divider } from 'antd';
import { CheckCircleOutlined, StarOutlined, CaretUpOutlined, CaretDownOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import {
  buildPlanDisplayFeatures,
  formatLocationsSubtitle,
  formatPrice,
  formatUsersSubtitle,
  getPlanDescription,
} from '../../../utils/packageDisplay';

const { Title, Text } = Typography;

const PlanCard = ({
  plan,
  isCurrentPlan = false,
  isPopular = false,
  onClick,
  onToggleFeatures,
  isFeaturesExpanded = false,
}) => {
  const displayFeatures = buildPlanDisplayFeatures(plan);
  const topFeatures = displayFeatures.slice(0, 5);
  const planDescription = getPlanDescription(plan);
  const price = plan?.price_per_location;

  return (
    <div className="relative w-full h-full flex">
      {(isPopular || isCurrentPlan) && (
        <div
          className={`absolute -top-3 left-1/2 transform -translate-x-1/2 z-20 px-4 py-1 rounded-full text-white text-xs font-bold shadow-lg whitespace-nowrap ${
            isCurrentPlan
              ? 'bg-gradient-to-r from-orange-500 to-orange-600'
              : 'bg-gradient-to-r from-blue-500 to-blue-600'
          }`}
        >
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
          flexDirection: 'column',
        }}
        bodyStyle={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
        }}
        onClick={(e) => {
          if (e.target.closest('button')) {
            return;
          }
        }}
      >
        <div className="flex flex-col h-full flex-1">
          <div
            className={`text-center mb-2 pt-5 pb-5 -mx-6 -mt-6 rounded-t-lg ${
              isCurrentPlan
                ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                : isPopular
                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                : 'bg-gradient-to-r from-gray-100 to-gray-200'
            }`}
          >
            <Title
              level={2}
              className={`!mb-0 !text-2xl font-bold ${
                isCurrentPlan || isPopular ? 'text-white' : 'text-gray-800'
              }`}
            >
              {plan.display_name || plan.name}
            </Title>
            <Text
              className={`text-xs mt-1.5 block ${
                isCurrentPlan || isPopular ? 'text-orange-100' : 'text-gray-600'
              }`}
            >
              {formatLocationsSubtitle(plan)}
            </Text>
          </div>

          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <Text className="text-4xl font-bold text-gray-900">{formatPrice(price)}</Text>
              {price > 0 && (
                <Text type="secondary" className="text-base">
                  /location/month
                </Text>
              )}
            </div>
            <Text type="secondary" className="text-xs block mt-2 capitalize">
              {formatUsersSubtitle(plan)}
            </Text>
          </div>

          {planDescription && (
            <Text type="secondary" className="text-xs block mt-3 text-center leading-relaxed px-1">
              {planDescription}
            </Text>
          )}

          <Divider className="my-4" />

          {topFeatures.length > 0 && (
            <div className="flex-1 mb-4 min-h-[160px]">
              <Text strong className="text-gray-800 mb-3 block text-xs font-semibold">
                Key Features:
              </Text>
              <div className="space-y-2">
                {topFeatures.map((feature) => (
                  <FeatureRow key={feature.key} feature={feature} />
                ))}
                {displayFeatures.length > 5 && (
                  <Text type="secondary" className="text-xs block pl-5 mt-2 font-medium">
                    +{displayFeatures.length - 5} more features
                  </Text>
                )}
              </div>
            </div>
          )}

          <div className="mt-auto space-y-2 pt-4 border-t border-gray-100">
            {displayFeatures.length > 0 && (
              <Button
                type="text"
                block
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onToggleFeatures?.(e);
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

        {isFeaturesExpanded && displayFeatures.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <FeaturesList features={displayFeatures} />
          </div>
        )}
      </Card>
    </div>
  );
};

const FeatureRow = ({ feature }) => (
  <div className="flex items-start gap-2">
    {feature.included ? (
      <CheckOutlined className="text-green-500 mt-0.5 flex-shrink-0 text-xs" />
    ) : (
      <CloseOutlined className="text-gray-300 mt-0.5 flex-shrink-0 text-xs" />
    )}
    <div className="flex-1 min-w-0">
      <Text className={`text-xs leading-relaxed ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
        {feature.label}
        {feature.detail ? (
          <Text type="secondary" className="text-xs">
            {' '}
            ({feature.detail})
          </Text>
        ) : null}
      </Text>
    </div>
  </div>
);

const FeaturesList = ({ features }) => (
  <div className="space-y-2">
    {features.map((feature) => (
      <FeatureRow key={feature.key} feature={feature} />
    ))}
  </div>
);

export default PlanCard;
