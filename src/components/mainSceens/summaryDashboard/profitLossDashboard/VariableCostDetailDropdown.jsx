import React, { useState } from 'react';
import { Popover, Typography } from 'antd';
import { DollarOutlined, RiseOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';

const { Text } = Typography;

const VariableCostDetailDropdown = ({ 
  children, 
  dayData, 
  variableCostData,
  printFormat = 'dollar'
}) => {
  const [expandedSections, setExpandedSections] = useState({
    variableCostActual: false
  });

  if (!dayData || !variableCostData) {
    return children;
  }



  
  // Calculate actual from variable_costs array
  const variableCostActual = Array.isArray(variableCostData.variable_costs) 
    ? variableCostData.variable_costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0)
    : parseFloat(variableCostData.variable_cost_actual) || 
      parseFloat(variableCostData.actual_variable_cost) || 0;
  


  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${Math.round(parseFloat(value))}%`;
  };



  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const dropdownContent = (
    <div className="w-72 p-4 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="space-y-3">
        {/* Header */}
        <div className="text-center pb-2 border-b border-gray-200">
          <Text strong className="text-sm text-gray-700">
            {dayData.dayName} ({dayData.date})
          </Text>
        </div>
        {/* Variable Cost Actual - Expandable */}
        <div className="border border-gray-200 rounded">
          <div 
            className="flex items-center justify-between p-2 bg-green-50 cursor-pointer hover:bg-green-100"
            onClick={() => toggleSection('variableCostActual')}
          >
            <div className="flex items-center gap-2">
              <RiseOutlined className="text-green-600 text-sm" />
              <Text className="text-sm font-semibold text-green-800">Variable Fixed Cost:</Text>
            </div>
            <div className="flex items-center gap-2">
              <Text strong className="text-sm text-green-900">
                {printFormat === 'percentage' && variableCostData.percentage_variable_cost_total
                  ? formatPercentage(variableCostData.percentage_variable_cost_total)
                  : formatCurrency(variableCostActual)
                }
              </Text>
              {expandedSections.variableCostActual ? (
                <MinusOutlined className="text-green-600 text-xs" />
              ) : (
                <PlusOutlined className="text-green-600 text-xs" />
              )}
            </div>
          </div>
          
          {/* Expanded Variable Cost Actual Content */}
          {expandedSections.variableCostActual && (
            <div className="p-2 bg-white border-t border-gray-200 space-y-2">
              {Array.isArray(variableCostData.variable_costs) && variableCostData.variable_costs.length > 0 ? (
                variableCostData.variable_costs.map((cost, index) => (
                  <div key={cost.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Text className="text-xs font-medium text-gray-700">{cost.name}:</Text>
                    </div>
                    <Text className="text-xs font-semibold">
                      {printFormat === 'percentage' && cost.percent_of_sales
                        ? formatPercentage(cost.percent_of_sales)
                        : formatCurrency(cost.amount)
                      }
                    </Text>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 bg-gray-50 rounded border border-gray-200">
                  <Text className="text-xs text-gray-500 italic">
                    No variable cost details available
                  </Text>
                </div>
              )}
            </div>
          )}
        </div>


       
      </div>
    </div>
  );

  return (
    <Popover
      content={dropdownContent}
      title={null}
      trigger="click"
      placement="bottomLeft"
      overlayClassName="variable-cost-detail-popover"
      destroyTooltipOnHide
      overlayStyle={{
        zIndex: 1000,
      }}
    >
      {children}
    </Popover>
  );
};

export default VariableCostDetailDropdown;
