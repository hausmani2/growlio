import React from 'react';
import { Collapse, Typography, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DownOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Text } = Typography;

const FeaturesTable = ({ features, showAsTable = false }) => {
  // Handle features as object (from API)
  if (features && typeof features === 'object' && !Array.isArray(features)) {
    const featuresArray = Object.entries(features).map(([key, value]) => ({
      key: key,
      label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      value: value,
      included: value !== false && value !== null && value !== 'false'
    }));

    // Group features by category
    const categorizedFeatures = {
      'Core Features': [],
      'Analytics & Reporting': [],
      'Integrations': [],
      'Support': [],
      'Other': []
    };

    featuresArray.forEach(feature => {
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
      <Collapse
        defaultActiveKey={Object.keys(categorizedFeatures)}
        ghost
        expandIcon={({ isActive }) => (isActive ? <DownOutlined /> : <RightOutlined />)}
        className="features-collapse"
      >
        {Object.entries(categorizedFeatures).map(([category, categoryFeatures]) => {
          if (categoryFeatures.length === 0) return null;
          
          return (
            <Panel
              header={
                <Text strong className="text-base text-gray-800">
                  {category}
                </Text>
              }
              key={category}
            >
              <div className="space-y-2">
                {categoryFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {feature.included ? (
                      <CheckOutlined className="text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <CloseCircleOutlined className="text-gray-300 mt-0.5 flex-shrink-0" />
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
            </Panel>
          );
        })}
      </Collapse>
    );
  }

  // Handle features as array of strings
  if (Array.isArray(features) && features.length > 0 && typeof features[0] === 'string') {
    return (
      <div className="space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
            <CheckCircleOutlined className="text-green-500 mt-1 flex-shrink-0" />
            <Text className="text-sm text-gray-700">{feature}</Text>
          </div>
        ))}
      </div>
    );
  }

  // Handle features as array of objects
  if (Array.isArray(features) && features.length > 0) {
    return (
      <div className="space-y-2">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
          >
            {feature.included !== false ? (
              <CheckCircleOutlined className="text-green-500 mt-1 flex-shrink-0" />
            ) : (
              <CloseCircleOutlined className="text-gray-300 mt-1 flex-shrink-0" />
            )}
            <div className="flex-1">
              <Text strong={feature.included !== false} className="text-sm text-gray-700">
                {feature.name || feature.title || feature.feature || feature.label}
              </Text>
              {feature.description && (
                <Text type="secondary" className="text-xs block mt-1">
                  {feature.description}
                </Text>
              )}
            </div>
            {feature.limit && (
              <Tag color="blue">{feature.limit}</Tag>
            )}
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
