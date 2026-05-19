import React from 'react';
import { Typography } from 'antd';
import { CheckOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { buildPlanDisplayFeatures } from '../../../utils/packageDisplay';

const { Text } = Typography;

const FeatureRow = ({ feature }) => (
  <div className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
    {feature.included ? (
      <CheckOutlined className="text-green-500 mt-0.5 flex-shrink-0" />
    ) : (
      <CloseCircleOutlined className="text-gray-300 mt-0.5 flex-shrink-0" />
    )}
    <div className="flex-1">
      <Text className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
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

const FeaturesTable = ({ features, plan }) => {
  const displayFeatures = plan
    ? buildPlanDisplayFeatures(plan)
    : features && typeof features === 'object' && !Array.isArray(features)
    ? buildPlanDisplayFeatures({ features })
    : [];

  if (displayFeatures.length > 0) {
    return (
      <div className="space-y-1">
        {displayFeatures.map((feature) => (
          <FeatureRow key={feature.key} feature={feature} />
        ))}
      </div>
    );
  }

  if (Array.isArray(features) && features.length > 0 && typeof features[0] === 'string') {
    return (
      <div className="space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
            <CheckOutlined className="text-green-500 mt-1 flex-shrink-0" />
            <Text className="text-sm text-gray-700">{feature}</Text>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <Text type="secondary">No features available for this plan.</Text>
    </div>
  );
};

export default FeaturesTable;
