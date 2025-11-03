import React, { useState } from 'react';
import { Popover, Typography } from 'antd';
import { DollarOutlined, ShoppingOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';

const { Text } = Typography;

const FoodCostDetailDropdown = ({ 
  children, 
  dayData, 
  foodCostData,
  printFormat = 'dollar'
}) => {
  const [expandedSections, setExpandedSections] = useState({
    foodCostActual: false
  });

  if (!dayData || !foodCostData) {
    return children;
  }


  // Calculate values - handle different possible field names
  const foodCostBudget = parseFloat(foodCostData.food_cost) || 
                        parseFloat(foodCostData.fc_budget) || 
                        parseFloat(foodCostData.food_cost_budget) || 
                        parseFloat(foodCostData.budgeted_food_cost) || 0;
  
  const foodCostActual = parseFloat(foodCostData.food_cost_actual) || 
                        parseFloat(foodCostData.fc_actual) || 
                        parseFloat(foodCostData.actual_food_cost) || 0;
  
  // Get over/under values directly from API response
  const amtOverUnder = parseFloat(foodCostData.food_cost_amount) || 0;
  const percentOverUnder = parseFloat(foodCostData.food_cost_amount_percent) || 0;

  // Get color for over/under values
  const getOverUnderColor = (value) => {
    
    if (value > 0) return '!text-red-600';
    if (value < 0) return '!text-green-600';
    return '!text-gray-600';
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

  // Format percentage - API provides the value, format to whole number
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

        {/* FC Budget */}
        <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2">
            <DollarOutlined className="text-blue-600 text-sm" />
            <Text className="text-sm font-semibold text-blue-800">FC Budget:</Text>
          </div>
          <Text strong className="text-sm text-blue-900">
            {printFormat === 'percentage' && foodCostData.percentage_food_cost
              ? formatPercentage(foodCostData.percentage_food_cost)
              : formatCurrency(foodCostBudget)
            }
          </Text>
        </div>

        {/* FC Actual - Expandable */}
        <div className="border border-gray-200 rounded">
          <div 
            className="flex items-center justify-between p-2 bg-green-50 cursor-pointer hover:bg-green-100"
            onClick={() => toggleSection('foodCostActual')}
          >
            <div className="flex items-center gap-2">
              <ShoppingOutlined className="text-green-600 text-sm" />
              <Text className="text-sm font-semibold text-green-800">FC Actual:</Text>
            </div>
            <div className="flex items-center gap-2">
              <Text strong className="text-sm text-green-900">
                {printFormat === 'percentage' && foodCostData.percentage_food_cost_actual
                  ? formatPercentage(foodCostData.percentage_food_cost_actual)
                  : formatCurrency(foodCostActual)
                }
              </Text>
              {expandedSections.foodCostActual ? (
                <MinusOutlined className="text-green-600 text-xs" />
              ) : (
                <PlusOutlined className="text-green-600 text-xs" />
              )}
            </div>
          </div>
          
          {/* Expanded Food Cost Actual Content */}
          {expandedSections.foodCostActual && (
            <div className="p-2 bg-white border-t border-gray-200 space-y-2">
                 {/* Over/Under Analysis */}
        <div className="p-2 bg-orange-50 rounded border border-orange-200">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Text className="text-xs font-semibold text-gray-700">Amt Over/Under:</Text>
              <Text className={`text-xs font-bold ${getOverUnderColor(amtOverUnder)}`}>
                {formatCurrency(amtOverUnder)}
              </Text>
            </div>
            <div className="flex items-center justify-between">
              <Text className="text-xs font-semibold text-gray-700">% Over/Under:</Text>
              <Text className={`text-xs font-bold ${getOverUnderColor(percentOverUnder)}`}>
                {formatPercentage(percentOverUnder)}
              </Text>
            </div>
          </div>
        </div>

            
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
      overlayClassName="food-cost-detail-popover"
      destroyTooltipOnHide
      overlayStyle={{
        zIndex: 1000,
      }}
    >
      {children}
    </Popover>
  );
};

export default FoodCostDetailDropdown;
