import React, { useState } from 'react';
import { Popover, Typography } from 'antd';
import { DollarOutlined, ClockCircleOutlined, UserOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';

const { Text } = Typography;

const LaborDetailDropdown = ({ 
  children, 
  dayData, 
  laborData 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    laborActual: false
  });

  if (!dayData || !laborData) {
    return children;
  }


  // Calculate values - handle different possible field names
  const laborBudget = parseFloat(laborData.labour) || 
                     parseFloat(laborData.labor_budget) || 
                     parseFloat(laborData.budgeted_labor_dollars) || 0;
  
  const laborActual = parseFloat(laborData.labour_actual) || 
                     parseFloat(laborData.amount) || 
                     parseFloat(laborData.actual_labor_dollars) || 0;
  
  const laborHours = parseFloat(laborData.hours) || 
                    parseFloat(laborData.labor_hours_actual) || 
                    parseFloat(laborData.hours_actual) || 0;
  
  const averageHourlyRate = parseFloat(laborData.actua_daily_labor_rate) || 
                           parseFloat(laborData.average_hourly_rate) || 
                           parseFloat(laborData.daily_labor_rate) || 
                           parseFloat(laborData.hourly_rate) || 0;
  
  // Get over/under values directly from API response
  const amtOverUnder = parseFloat(laborData.labour_amount) || 0;
  const percentOverUnder = parseFloat(laborData.labour_amount_percent) || 0;

  // Get color for over/under values
  const getOverUnderColor = (value) => {
    if (value > 0) return '!text-red-600';
    if (value < 0) return '!text-green-600';
    return '!text-red-600';
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

  // Format percentage - API provides the value, format to 1 decimal place
  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${parseFloat(value).toFixed(1)}%`;
  };

  // Format hours
  const formatHours = (value) => {
    return `${value.toFixed(1)} hrs`;
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

        {/* Labor Budget */}
        <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2">
            <DollarOutlined className="text-blue-600 text-sm" />
            <Text className="text-sm font-semibold text-blue-800">Labor Budget:</Text>
          </div>
          <Text strong className="text-sm text-blue-900">{formatCurrency(laborBudget)}</Text>
        </div>

        {/* Labor Actual - Expandable */}
        <div className="border border-gray-200 rounded">
          <div 
            className="flex items-center justify-between p-2 bg-green-50 cursor-pointer hover:bg-green-100"
            onClick={() => toggleSection('laborActual')}
          >
            <div className="flex items-center gap-2">
              <UserOutlined className="text-green-600 text-sm" />
              <Text className="text-sm font-semibold text-green-800">Labor Actual:</Text>
            </div>
            <div className="flex items-center gap-2">
              <Text strong className="text-sm text-green-900">{formatCurrency(laborActual)}</Text>
              {expandedSections.laborActual ? (
                <MinusOutlined className="text-green-600 text-xs" />
              ) : (
                <PlusOutlined className="text-green-600 text-xs" />
              )}
            </div>
          </div>
          
          {/* Expanded Labor Actual Content */}
          {expandedSections.laborActual && (
            <div className="p-2 bg-white border-t border-gray-200 space-y-2">
              {/* Labor Hours */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-gray-600 text-xs" />
                  <Text className="text-xs font-medium text-gray-700">Labor Hours:</Text>
                </div>
                <Text className="text-xs font-semibold">{formatHours(laborHours)}</Text>
              </div>

          
              
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
            {/* Average Hourly Rate */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  <DollarOutlined className="text-gray-600 text-xs" />
                  <Text className="text-xs font-medium text-gray-700">Average Hourly Rate:</Text>
                </div>
                <Text className="text-xs font-semibold">{formatCurrency(averageHourlyRate)}</Text>
              </div>


              {/* Show message if no detailed labor data available */}
              {laborHours === 0 && averageHourlyRate === 0 && (
                <div className="text-center py-2 bg-gray-50 rounded border border-gray-200">
                  <Text className="text-xs text-gray-500 italic">
                    No detailed labor data available
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
      overlayClassName="labor-detail-popover"
      destroyTooltipOnHide
      overlayStyle={{
        zIndex: 1000,
      }}
    >
      {children}
    </Popover>
  );
};

export default LaborDetailDropdown;
