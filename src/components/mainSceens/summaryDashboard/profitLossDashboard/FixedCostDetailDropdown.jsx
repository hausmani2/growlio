import React, { useState } from 'react';
import { Popover, Typography } from 'antd';
import { DollarOutlined, SettingOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';

const { Text } = Typography;

const FixedCostDetailDropdown = ({ 
  children, 
  dayData, 
  fixedCostData 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    fixedCostActual: false
  });

  if (!dayData || !fixedCostData) {
    return children;
  }


  // Calculate values - handle different possible field names
  const fixedCostBudget = parseFloat(fixedCostData.fixed_cost) || 
                         parseFloat(fixedCostData.fixed_cost_budget) || 
                         parseFloat(fixedCostData.budgeted_fixed_cost) || 0;
  
  // Calculate actual from fixed_costs array
  const fixedCostActual = Array.isArray(fixedCostData.fixed_costs) 
    ? fixedCostData.fixed_costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0)
    : parseFloat(fixedCostData.fixed_cost_actual) || 
      parseFloat(fixedCostData.actual_fixed_cost) || 0;
  
  const amtOverUnder = fixedCostActual - fixedCostBudget;
  const percentOverUnder = fixedCostBudget > 0 ? ((amtOverUnder / fixedCostBudget) * 100) : 0;

  // Get color for over/under values
  const getOverUnderColor = (value) => {
    if (value > 0) return 'text-red-600';
    if (value < 0) return 'text-green-600';
    return 'text-gray-600';
  };

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
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
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

    
        {/* Fixed Cost Actual - Expandable */}
        <div className="border border-gray-200 rounded">
          <div 
            className="flex items-center justify-between p-2 bg-green-50 cursor-pointer hover:bg-green-100"
            onClick={() => toggleSection('fixedCostActual')}
          >
            <div className="flex items-center gap-2">
              <SettingOutlined className="text-green-600 text-sm" />
              <Text className="text-sm font-semibold text-green-800">Fixed Cost:</Text>
            </div>
            <div className="flex items-center gap-2">
              <Text strong className="text-sm text-green-900">{formatCurrency(fixedCostActual)}</Text>
              {expandedSections.fixedCostActual ? (
                <MinusOutlined className="text-green-600 text-xs" />
              ) : (
                <PlusOutlined className="text-green-600 text-xs" />
              )}
            </div>
          </div>
          
          {/* Expanded Fixed Cost Actual Content */}
          {expandedSections.fixedCostActual && (
            <div className="p-2 bg-white border-t border-gray-200 space-y-2">
              {Array.isArray(fixedCostData.fixed_costs) && fixedCostData.fixed_costs.length > 0 ? (
                fixedCostData.fixed_costs.map((cost, index) => (
                  <div key={cost.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Text className="text-xs font-medium text-gray-700">{cost.name}:</Text>
                    </div>
                    <Text className="text-xs font-semibold">{formatCurrency(cost.amount)}</Text>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 bg-gray-50 rounded border border-gray-200">
                  <Text className="text-xs text-gray-500 italic">
                    No fixed cost details available
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
      overlayClassName="fixed-cost-detail-popover"
      destroyTooltipOnHide
      overlayStyle={{
        zIndex: 1000,
      }}
    >
      {children}
    </Popover>
  );
};

export default FixedCostDetailDropdown;
