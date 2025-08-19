import React from 'react';
import { Popover, Typography, Table } from 'antd';
import { CalendarOutlined, DollarOutlined, UserOutlined, ShoppingOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

const WeeklyDetailDropdown = ({ 
  children, 
  categoryData, 
  tableData,
  categoryKey,
  processedData 
}) => {
  if (!categoryData || !tableData || !categoryKey) {
    return children;
  }

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === 'None' || value === '') {
      return '-';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Format number
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === 'None' || value === '') {
      return '-';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Format profit/loss
  const formatProfitLoss = (value) => {
    if (value === null || value === undefined || value === 'None' || value === '') {
      return '-';
    }
    const formattedValue = formatCurrency(Math.abs(value));
    if (value > 0) {
      return `+${formattedValue}`;
    } else if (value < 0) {
      return `-${formattedValue}`;
    }
    return formattedValue;
  };

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = dayjs(dateString);
      return {
        day: date.format('ddd'),
        date: date.format('MMM DD'),
        fullDate: date.format('MMM DD, YYYY')
      };
    } catch {
      return {
        day: 'N/A',
        date: 'N/A',
        fullDate: 'N/A'
      };
    }
  };

  // Get color for profit/loss values
  const getProfitLossColor = (value) => {
    if (value === null || value === undefined || value === 'None' || value === '') {
      return 'text-gray-500';
    }
    if (value > 0) {
      return 'text-green-600 font-semibold';
    } else if (value < 0) {
      return 'text-red-600 font-semibold';
    }
    return 'text-gray-600';
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'sales_budget':
        return <DollarOutlined className="text-blue-600" />;
      case 'labour':
        return <UserOutlined className="text-green-600" />;
      case 'food_cost':
        return <ShoppingOutlined className="text-orange-600" />;
      case 'fixedCost':
        return <SettingOutlined className="text-purple-600" />;
      case 'variableCost':
        return <SettingOutlined className="text-indigo-600" />;
      case 'profit_loss':
        return <DollarOutlined className="text-emerald-600" />;
      default:
        return <CalendarOutlined className="text-gray-600" />;
    }
  };

  // Get category label
  const getCategoryLabel = (category) => {
    switch (category) {
      case 'sales_budget':
        return 'Sales Budget';
      case 'labour':
        return 'Labor';
      case 'food_cost':
        return 'Food Cost';
      case 'fixedCost':
        return 'Fixed Cost';
      case 'variableCost':
        return 'Variable Cost';
      case 'profit_loss':
        return 'Profit & Loss';
      default:
        return category;
    }
  };

  // Prepare table data for the weekly breakdown
  const weeklyTableData = tableData.map((entry, index) => {
    const dateInfo = formatDateForDisplay(entry.date || entry.day);
    const dateKey = entry.date || entry.day || 'N/A';
    const rawValue = processedData[categoryKey]?.[dateKey] || 0;
    
    // Get profit percentage if available
    let profitPercentage = null;
    if (categoryKey === 'sales_budget' && entry.sales_budeget_profit) {
      profitPercentage = `${entry.sales_budeget_profit > 0 ? '+' : ''}${parseFloat(entry.sales_budeget_profit).toFixed(1)}%`;
    } else if (categoryKey === 'labour' && entry.labour_profit) {
      profitPercentage = `${entry.labour_profit > 0 ? '+' : ''}${parseFloat(entry.labour_profit).toFixed(1)}%`;
    } else if (categoryKey === 'food_cost' && entry.food_cost_profit) {
      profitPercentage = `${entry.food_cost_profit > 0 ? '+' : ''}${parseFloat(entry.food_cost_profit).toFixed(1)}%`;
    }

    // Format value based on category type
    let formattedValue;
    if (categoryKey === 'profit_loss') {
      formattedValue = formatProfitLoss(rawValue);
    } else if (categoryKey === 'sales_budget' || categoryKey === 'food_cost' || 
               categoryKey === 'fixedCost' || categoryKey === 'variableCost') {
      formattedValue = formatCurrency(rawValue);
    } else if (categoryKey === 'labour') {
      formattedValue = formatNumber(rawValue);
    } else {
      formattedValue = rawValue.toString();
    }

    return {
      key: index,
      day: dateInfo.day,
      date: dateInfo.date,
      fullDate: dateInfo.fullDate,
      value: formattedValue,
      rawValue: rawValue,
      profitPercentage: profitPercentage,
      colorClass: categoryKey === 'profit_loss' ? getProfitLossColor(rawValue) : 'text-gray-700'
    };
  });

  // Table columns for weekly breakdown
  const columns = [
    {
      title: 'Day',
      dataIndex: 'day',
      key: 'day',
      width: 80,
      render: (text, record) => (
        <div className="text-center">
          <div className="font-semibold text-xs text-gray-800">{text}</div>
          <div className="text-xs text-gray-600">{record.date}</div>
        </div>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      render: (text, record) => (
        <div className="text-center">
          <div className={`text-sm font-semibold ${record.colorClass}`}>
            {text}
          </div>
          {record.profitPercentage && (
            <div className={`text-xs ${
              record.profitPercentage.includes('+') ? 'text-green-600' : 'text-red-600'
            } font-bold`}>
              {record.profitPercentage}
            </div>
          )}
        </div>
      ),
    },
  ];

  const dropdownContent = (
    <div className="w-96 p-4 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="space-y-3">
        {/* Header */}
        <div className="text-center pb-2 border-b border-gray-200">
          <div className="flex items-center justify-center gap-2 mb-1">
            {getCategoryIcon(categoryKey)}
            <Text strong className="text-sm text-gray-700">
              {getCategoryLabel(categoryKey)} - Weekly Breakdown
            </Text>
          </div>
          <Text className="text-xs text-gray-500">
            Daily values for the selected period
          </Text>
        </div>

        {/* Weekly Table */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <Table
            columns={columns}
            dataSource={weeklyTableData}
            pagination={false}
            size="small"
            className="weekly-detail-table"
            rowClassName="hover:bg-gray-50"
          />
        </div>

        {/* Summary */}
        <div className="p-2 bg-gray-50 rounded border border-gray-200">
          <div className="flex items-center justify-between">
            <Text className="text-xs font-semibold text-gray-700">Weekly Total:</Text>
            <Text className={`text-sm font-bold ${
              categoryKey === 'profit_loss' 
                ? getProfitLossColor(weeklyTableData.reduce((sum, row) => sum + row.rawValue, 0))
                : 'text-gray-800'
            }`}>
              {categoryKey === 'profit_loss' 
                ? formatProfitLoss(weeklyTableData.reduce((sum, row) => sum + row.rawValue, 0))
                : categoryKey === 'sales_budget' || categoryKey === 'food_cost' || 
                  categoryKey === 'fixedCost' || categoryKey === 'variableCost'
                ? formatCurrency(weeklyTableData.reduce((sum, row) => sum + row.rawValue, 0))
                : categoryKey === 'labour'
                ? formatNumber(weeklyTableData.reduce((sum, row) => sum + row.rawValue, 0))
                : weeklyTableData.reduce((sum, row) => sum + row.rawValue, 0).toString()
              }
            </Text>
          </div>
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
      overlayClassName="weekly-detail-popover"
      destroyTooltipOnHide
      overlayStyle={{
        zIndex: 1000,
      }}
    >
      {children}
    </Popover>
  );
};

export default WeeklyDetailDropdown;
