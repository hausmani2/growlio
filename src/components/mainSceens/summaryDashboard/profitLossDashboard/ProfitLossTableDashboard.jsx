import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Space, Typography, Card, Row, Col, Spin, Alert, Collapse } from 'antd';
import { PrinterOutlined, DownloadOutlined, CaretRightOutlined, CaretDownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import SalesDetailDropdown from './SalesDetailDropdown';
import LaborDetailDropdown from './LaborDetailDropdown';
import FoodCostDetailDropdown from './FoodCostDetailDropdown';
import FixedCostDetailDropdown from './FixedCostDetailDropdown';
import VariableCostDetailDropdown from './VariableCostDetailDropdown';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const ProfitLossTableDashboard = ({ dashboardData, dashboardSummaryData, loading, error, viewMode }) => {
  const [tableData, setTableData] = useState([]);
  const [processedData, setProcessedData] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Helper function to handle None/null/undefined values
  const handleValue = useCallback((value) => {
    if (value === null || value === undefined || value === 'None' || value === '') {
      return '-';
    }
    return value;
  }, []);

  // Helper function to parse numeric values safely
  const parseNumericValue = useCallback((value) => {
    if (value === null || value === undefined || value === 'None' || value === '') {
      return 0;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  // Helper function to determine if data is weekly format
  const isWeeklyData = useCallback((data) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    const firstEntry = data[0];
    return Object.prototype.hasOwnProperty.call(firstEntry, 'week_start') && Object.prototype.hasOwnProperty.call(firstEntry, 'week_end');
  }, []);

  // Helper function to format date for display
  const formatDateForDisplay = useCallback((dateString, isWeekly = false) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = dayjs(dateString);
      if (isWeekly) {
        return {
          day: `Week ${date.format('MMM DD')}`,
          date: `${date.format('MMM DD')} - ${dayjs(dateString).add(6, 'day').format('MMM DD, YYYY')}`,
          shortDate: date.format('MMM DD'),
          fullDate: `${date.format('MMM DD')} - ${dayjs(dateString).add(6, 'day').format('MMM DD, YYYY')}`
        };
      } else {
        return {
          day: date.format('ddd'),
          date: date.format('MMM DD'),
          shortDate: date.format('MMM DD'),
          fullDate: date.format('MMM DD, YYYY')
        };
      }
    } catch (error) {
      return {
        day: 'Invalid Date',
        date: 'Invalid Date',
        shortDate: 'Invalid',
        fullDate: 'Invalid Date'
      };
    }
  }, []);

  // Toggle row expansion - Optimized for performance
  const toggleRowExpansion = useCallback((recordKey) => {
    setExpandedRows(prev => {
      if (prev.has(recordKey)) {
        const newSet = new Set(prev);
        newSet.delete(recordKey);
        return newSet;
      } else {
        return new Set([...prev, recordKey]);
      }
    });
  }, []);

  // Process data
  useEffect(() => {
    const dataToProcess = dashboardSummaryData || dashboardData;
    
    if (!dataToProcess) {
      setTableData([]);
      setProcessedData({});
      return;
    }

    // Handle API error responses
    if (dataToProcess.status === 'fail' || dataToProcess.status === 'error') {
      setTableData([]);
      setProcessedData({});
      return;
    }

    let entries = [];
    
    // Extract data based on structure
    if (Array.isArray(dataToProcess.data)) {
      entries = dataToProcess.data;
    } else if (Array.isArray(dataToProcess)) {
      entries = dataToProcess;
    } else if (dataToProcess.daily_entries) {
      entries = dataToProcess.daily_entries;
    }

    if (entries.length === 0) {
      setTableData([]);
      setProcessedData({});
      return;
    }

    // Determine if this is weekly data
    const isWeekly = isWeeklyData(entries);
    console.log('ProfitLossTableDashboard: Processing data format:', isWeekly ? 'weekly' : 'daily');

    // Process the data - Updated to handle both daily and weekly structures
    const processed = {
      sales_budget: {},
      sales_budeget_profit: {},
      labour: {},
      labour_profit: {},
      food_cost: {},
      food_cost_profit: {},
      hours: {},
      amount: {},
      average_hourly_rate: {},
      profit_loss: {},
      fixedCost: {},
      variableCost: {}
    };

    entries.forEach((entry, index) => {
      // Create appropriate date key based on data format
      let dateKey;
      if (isWeekly) {
        // For weekly data, use week_start as the key
        dateKey = entry.week_start || `week-${index}`;
      } else {
        // For daily data, use date or day field
        dateKey = entry.date || entry.day || `day-${index}`;
      }
      
      processed.sales_budget[dateKey] = parseNumericValue(entry.sales_budget);
      processed.sales_budeget_profit[dateKey] = parseNumericValue(entry.sales_budeget_profit);
      processed.labour[dateKey] = parseNumericValue(entry.labour);
      processed.labour_profit[dateKey] = parseNumericValue(entry.labour_profit);
      processed.food_cost[dateKey] = parseNumericValue(entry.food_cost);
      processed.food_cost_profit[dateKey] = parseNumericValue(entry.food_cost_profit);
      processed.hours[dateKey] = parseNumericValue(entry.hours);
      processed.amount[dateKey] = parseNumericValue(entry.amount);
      processed.average_hourly_rate[dateKey] = parseNumericValue(entry.average_hourly_rate);
      processed.profit_loss[dateKey] = parseNumericValue(entry.profit_loss);
      
      // Calculate fixed cost total from array
      const fixedCostTotal = Array.isArray(entry.fixed_costs) 
        ? entry.fixed_costs.reduce((sum, cost) => sum + parseNumericValue(cost.amount), 0)
        : 0;
      processed.fixedCost[dateKey] = fixedCostTotal;
      
      // Calculate variable cost total from array
      const variableCostTotal = Array.isArray(entry.variable_costs)
        ? entry.variable_costs.reduce((sum, cost) => sum + parseNumericValue(cost.amount), 0)
        : 0;
      processed.variableCost[dateKey] = variableCostTotal;
      

    });

    setProcessedData(processed);
    setTableData(entries);
  }, [dashboardData, dashboardSummaryData, parseNumericValue, isWeeklyData]);

  // Categories for the summary table with expandable details
  const categories = useMemo(() => [
    { 
      key: 'sales_budget', 
      label: 'Sales Budget', 
      type: 'currency',
      hasDetails: true,
      detailLabel: 'Sales Details',
      detailFields: [
        { key: 'sales_budget', label: 'Total Sales', type: 'currency' },
        { key: 'sales_budeget_profit', label: 'Sales Profit %', type: 'percentage' }
      ]
    },
    { 
      key: 'labour', 
      label: 'Labor', 
      type: 'number',
      hasDetails: true,
      detailLabel: 'Labor Details',
      detailFields: [
        { key: 'labour', label: 'Labor Hours', type: 'number' },
        { key: 'labour_profit', label: 'Labor Profit %', type: 'percentage' },
        { key: 'average_hourly_rate', label: 'Avg Hourly Rate', type: 'currency' }
      ]
    },
    { 
      key: 'food_cost', 
      label: 'Food Cost', 
      type: 'currency',
      hasDetails: true,
      detailLabel: 'Food Cost Details',
      detailFields: [
        { key: 'food_cost', label: 'Total Food Cost', type: 'currency' },
        { key: 'food_cost_profit', label: 'Food Cost Profit %', type: 'percentage' }
      ]
    },
    { 
      key: 'fixedCost', 
      label: 'Fixed Cost', 
      type: 'currency',
      hasDetails: true,
      detailLabel: 'Fixed Cost Breakdown',
      detailFields: [
        { key: 'fixedCost', label: 'Total Fixed Cost', type: 'currency' }
      ]
    },
    { 
      key: 'variableCost', 
      label: 'Variable Cost', 
      type: 'currency',
      hasDetails: true,
      detailLabel: 'Variable Cost Breakdown',
      detailFields: [
        { key: 'variableCost', label: 'Total Variable Cost', type: 'currency' }
      ]
    },
    { 
      key: 'profit_loss', 
      label: 'Profit & Loss', 
      type: 'currency',
      hasDetails: false
    },
 
  ], []);

  // Helper function to format percentage
  const formatPercentage = useCallback((value) => {
    if (value === null || value === undefined || value === 'None' || value === '') {
      return null;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    return `${numValue > 0 ? '+' : ''}${numValue.toFixed(1)}%`;
  }, []);

  // Helper function to get percentage color
  const getPercentageColor = useCallback((value) => {
    if (value === null || value === undefined || value === 'None' || value === '') {
      return 'text-gray-400';
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'text-gray-400';
    if (numValue > 0) return 'text-green-600';
    if (numValue < 0) return 'text-red-600';
    return 'text-gray-600';
  }, []);

  // Formatting utilities
  const formatCurrency = useCallback((value) => {
    if (value === '-') return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  }, []);

  const formatNumber = useCallback((value) => {
    if (value === '-') return '-';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  }, []);

  // Color coding for profit/loss values
  const getProfitLossColor = useCallback((value) => {
    if (value === '-') return 'text-gray-500';
    if (value > 0) {
      return 'text-green-600 font-semibold'; // Green for profit
    } else if (value < 0) {
      return 'text-red-600 font-semibold'; // Red for loss
    }
    return 'text-gray-600'; // Default color for zero
  }, []);

  // Format profit/loss with trading-like display (+ for positive values)
  const formatProfitLoss = useCallback((value) => {
    if (value === '-') return '-';
    const formattedValue = formatCurrency(Math.abs(value));
    if (value > 0) {
      return `+${formattedValue}`;
    } else if (value < 0) {
      return `-${formattedValue}`;
    }
    return formattedValue;
  }, [formatCurrency]);



  // Generate grouped columns with multi-level headers
  const generateGroupedColumns = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];

    // Group dates by week if monthly view
    const groupedDates = viewMode === 'monthly' ? 
      tableData.reduce((groups, entry, index) => {
        const dateInfo = formatDateForDisplay(entry.date || entry.day);
        const weekKey = dayjs(entry.date || entry.day).format('YYYY-[W]WW');
        
        if (!groups[weekKey]) {
          groups[weekKey] = {
            weekKey,
            weekLabel: `Week ${dayjs(entry.date || entry.day).format('WW')}`,
            dates: []
          };
        }
        
        groups[weekKey].dates.push({
          entry,
          index,
          dateInfo
        });
        
        return groups;
      }, {}) : 
      tableData.map((entry, index) => {
        const dateInfo = formatDateForDisplay(entry.date || entry.day);
        return {
          weekKey: `day-${index}`,
          weekLabel: dateInfo.day,
          dates: [{ entry, index, dateInfo }]
        };
      });

    const groupedColumns = [
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
        width: 200,
        fixed: 'left',
        render: (text, record) => {
          const category = categories.find(cat => cat.key === record.key);
          
          return (
            <div className="flex items-center gap-2">
           
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800 text-sm">{text}</span>
                {category?.hasDetails && (
                  <span className="text-xs text-gray-500">Click to expand details</span>
                )}
              </div>
            </div>
          );
        },
        responsive: ['md']
      }
    ];

    // Add grouped date columns
    Object.values(groupedDates).forEach((weekGroup) => {
      if (weekGroup.dates.length === 1) {
        // Single day column
        const { entry, index, dateInfo } = weekGroup.dates[0];
        const uniqueKey = `${dateInfo.fullDate}-${index}`;
        
        groupedColumns.push({
          title: (
            <div className="text-center">
              <div className="font-semibold text-xs text-gray-800">
                {dateInfo.day}
              </div>
              {viewMode === 'monthly' && (
                <div className="text-xs text-gray-600">
                  {dateInfo.date}
                </div>
              )}
            </div>
          ),
          dataIndex: uniqueKey,
          key: uniqueKey,
          width: 120,
          render: (value, record) => renderCellValue(value, record, entry, dateInfo)
        });
      } else {
        // Multiple days - create grouped header
        const children = weekGroup.dates.map(({ entry, index, dateInfo }) => {
          const uniqueKey = `${dateInfo.fullDate}-${index}`;
          
          return {
            title: (
              <div className="text-center">
                <div className="font-semibold text-xs text-gray-800">
                  {dateInfo.day}
                </div>
                <div className="text-xs text-gray-600">
                  {dateInfo.date}
                </div>
              </div>
            ),
            dataIndex: uniqueKey,
            key: uniqueKey,
            width: 120,
            render: (value, record) => renderCellValue(value, record, entry, dateInfo)
          };
        });

        groupedColumns.push({
          title: (
            <div className="text-center">
              <div className="font-semibold text-xs text-gray-800">
                {weekGroup.weekLabel}
              </div>
            </div>
          ),
          children: children
        });
      }
    });

    return groupedColumns;
  }, [tableData, viewMode, formatDateForDisplay, expandedRows, categories]);

  // Render cell value with proper formatting
  const renderCellValue = useCallback((value, record, entry, dateInfo) => {
    const categoryKey = record.key;
    const dateKey = entry.date || entry.day || 'N/A';
    const rawValue = processedData[categoryKey]?.[dateKey] || 0;
    
    // Check if the original value was None/null/undefined
    let originalValue, displayValue;
    if (categoryKey === 'fixedCost' || categoryKey === 'variableCost') {
      displayValue = rawValue > 0 ? rawValue.toString() : '-';
    } else {
      originalValue = entry[categoryKey];
      displayValue = handleValue(originalValue);
    }
    
    if (displayValue === '-') {
      return <span className="text-xs text-gray-500">-</span>;
    }
    
    // Get profit percentage for inline display
    let profitPercentage = null;
    if (categoryKey === 'sales_budget' && entry.sales_budeget_profit) {
      profitPercentage = formatPercentage(entry.sales_budeget_profit);
    } else if (categoryKey === 'labour' && entry.labour_profit) {
      profitPercentage = formatPercentage(entry.labour_profit);
    } else if (categoryKey === 'food_cost' && entry.food_cost_profit) {
      profitPercentage = formatPercentage(entry.food_cost_profit);
    }
    
    // Handle currency fields
    if (categoryKey === 'sales_budget' || categoryKey === 'food_cost' || 
        categoryKey === 'fixedCost' || categoryKey === 'variableCost' ||
        categoryKey === 'amount' || categoryKey === 'average_hourly_rate' || 
        categoryKey === 'profit_loss') {
      const colorClass = categoryKey === 'profit_loss' ? getProfitLossColor(rawValue) : 'text-gray-700';
      const formattedValue = categoryKey === 'profit_loss' ? formatProfitLoss(rawValue) : formatCurrency(rawValue);
      
      // Make sales budget clickable with dropdown
      if (categoryKey === 'sales_budget' && rawValue > 0) {
        const dayData = {
          dayName: dateInfo.day,
          date: dateInfo.fullDate
        };
        
        return (
          <div className="flex items-start justify-start">
            <span 
              className={`text-sm ${colorClass} flex items-center gap-1`}
              title="Click to view sales details"
            >
              {formattedValue}
            </span>
            {profitPercentage && (
              <SalesDetailDropdown dayData={dayData} salesData={entry}>
                <span className={`text-xs ml-1 mb-2 cursor-pointer hover:text-blue-600 hover:underline ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit)} font-bold`}>
                  {profitPercentage}
                </span>
              </SalesDetailDropdown>
            )}
          </div>
        );
      }
      
      // Make food cost clickable with dropdown
      if (categoryKey === 'food_cost' && rawValue > 0) {
        const dayData = {
          dayName: dateInfo.day,
          date: dateInfo.fullDate
        };
        
        return (
          <div className="flex items-start justify-start">
            <span 
              className={`text-sm ${colorClass} flex items-center`}
              title="Click to view food cost details"
            >
              {formattedValue}
            </span>
            {profitPercentage && (
              <FoodCostDetailDropdown dayData={dayData} foodCostData={entry}>
                <span className={`text-xs ml-1 mb-2 cursor-pointer hover:text-blue-600 hover:underline ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit)} font-bold`}>
                  {profitPercentage}
                </span>
              </FoodCostDetailDropdown>
            )}
          </div>
        );
      }
      
      // Make fixed cost clickable with dropdown
      if (categoryKey === 'fixedCost') {
        const dayData = {
          dayName: dateInfo.day,
          date: dateInfo.fullDate
        };
        
        if (rawValue > 0) {
          return (
            <div className="flex items-start justify-start">
              <FixedCostDetailDropdown dayData={dayData} fixedCostData={entry}>
                <span 
                  className={`text-sm ${colorClass} flex items-center gap-1 cursor-pointer hover:text-blue-600 hover:underline`}
                  title="Click to view fixed cost details"
                >
                  {formattedValue} ⓘ
                </span>
              </FixedCostDetailDropdown>
              {profitPercentage && (
                <span className={`text-xs ml-1 mb-2 ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit)} font-bold`}>
                  {profitPercentage}
                </span>
              )}
            </div>
          );
        } else {
          return (
            <div className="flex items-start justify-start">
              <span className={`text-sm ${colorClass}`}>{formattedValue}</span>
              {profitPercentage && (
                <span className={`text-xs ml-1 mb-2 ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit)} font-bold`}>
                  {profitPercentage}
                </span>
              )}
            </div>
          );
        }
      }
      
      // Make variable cost clickable with dropdown
      if (categoryKey === 'variableCost') {
        const dayData = {
          dayName: dateInfo.day,
          date: dateInfo.fullDate
        };
        
        if (rawValue > 0) {
          return (
            <div className="flex items-start justify-start">
              <VariableCostDetailDropdown dayData={dayData} variableCostData={entry}>
                <span 
                  className={`text-sm ${colorClass} flex items-center gap-1 cursor-pointer hover:text-blue-600 hover:underline`}
                  title="Click to view variable cost details"
                >
                  {formattedValue} ⓘ
                </span>
              </VariableCostDetailDropdown>
              {profitPercentage && (
                <span className={`text-xs ml-1 mb-2 ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit)} font-bold`}>
                  {profitPercentage}
                </span>
              )}
            </div>
          );
        } else {
          return (
            <div className="flex items-start justify-start">
              <span className={`text-sm ${colorClass}`}>{formattedValue}</span>
              {profitPercentage && (
                <span className={`text-xs ml-1 mb-2 ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit)} font-bold`}>
                  {profitPercentage}
                </span>
              )}
            </div>
          );
        }
      }
      
      return (
        <div className="flex items-start justify-start">
          <span className={`text-sm ${colorClass}`}>{formattedValue}</span>
          {profitPercentage && (
            <span className={`text-xs ml-1 mb-2 ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit)} font-bold`}>
              {profitPercentage}
            </span>
          )}
        </div>
      );
    }
    
    // Handle number fields
    if (categoryKey === 'labour' || categoryKey === 'hours') {
      // Make labor clickable with dropdown
      if (categoryKey === 'labour' && rawValue > 0) {
        const dayData = {
          dayName: dateInfo.day,
          date: dateInfo.fullDate
        };
        
        return (
          <div className="flex items-start justify-start">
            <span 
              className="text-sm text-gray-700 flex items-center gap-1"
              title="Click to view labor details"
            >
              {formatNumber(rawValue)} 
            </span>
            {profitPercentage && (
              <LaborDetailDropdown dayData={dayData} laborData={entry}>
                <span className={`text-xs ml-1 mb-2 cursor-pointer hover:text-blue-600 hover:underline ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit)} font-bold`}>
                  {profitPercentage}
                </span>
              </LaborDetailDropdown>
            )}
          </div>
        );
      }
      
      return (
        <div className="flex items-start justify-start">
          <span className="text-sm text-gray-700">{formatNumber(rawValue)}</span>
          {profitPercentage && (
            <span className={`text-xs ml-1 ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit)} font-bold`}>
              {profitPercentage}
            </span>
          )}
        </div>
      );
    }
    
    return <span className="text-sm text-gray-700">{rawValue}</span>;
  }, [processedData, handleValue, formatCurrency, formatNumber, getProfitLossColor, formatProfitLoss, formatPercentage, getPercentageColor]);

  // Generate expandable row data
  const generateExpandableData = useMemo(() => {
    return categories.map(category => {
      const baseRow = {
        key: category.key,
        category: category.label,
        ...tableData.reduce((acc, entry, index) => {
          const dateInfo = formatDateForDisplay(entry.date || entry.day);
          const uniqueKey = `${dateInfo.fullDate}-${index}`;
          const dateKey = entry.date || entry.day || 'N/A';
          acc[uniqueKey] = processedData[category.key]?.[dateKey] || 0;
          return acc;
        }, {})
      };

      // Add expandable details if category has them
      if (category.hasDetails) {
        baseRow.children = category.detailFields.map(field => ({
          key: `${category.key}_${field.key}`,
          category: `  ${field.label}`,
          isDetail: true,
          ...tableData.reduce((acc, entry, index) => {
            const dateInfo = formatDateForDisplay(entry.date || entry.day);
            const uniqueKey = `${dateInfo.fullDate}-${index}`;
            const dateKey = entry.date || entry.day || 'N/A';
            
            let value;
            if (field.key === 'fixedCost' || field.key === 'variableCost') {
              value = processedData[field.key]?.[dateKey] || 0;
            } else {
              value = entry[field.key] || 0;
            }
            
            acc[uniqueKey] = value;
            return acc;
          }, {})
        }));
      }

      return baseRow;
    });
  }, [categories, tableData, processedData, formatDateForDisplay]);

  // CSV generation
  const generateCSV = useCallback(() => {
    if (!tableData || tableData.length === 0) return '';
    
    const dates = tableData.map(entry => {
      const dateInfo = formatDateForDisplay(entry.date || entry.day);
      return dateInfo.fullDate;
    });
    const headers = ['Category', ...dates];
    const rows = categories.map(category => {
      const rowData = [category.label];
      dates.forEach((_, index) => {
        const entry = tableData[index];
        const dateKey = entry.date || entry.day || 'N/A';
        const value = processedData[category.key]?.[dateKey] || 0;
        rowData.push(value.toString());
      });
      return rowData.join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }, [tableData, categories, processedData, formatDateForDisplay]);

  // Export handler
  const handleExport = useCallback(() => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-table-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [generateCSV]);

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);





  // Calculate weekly totals - Memoized for performance
  const calculateWeeklyTotals = useMemo(() => {
    if (!tableData || tableData.length === 0) return {};

    const totals = {
      sales_budget: 0,
      sales_actual: 0,
      labour: 0,
      labour_actual: 0,
      food_cost: 0,
      food_cost_actual: 0,
      hours: 0,
      fixed_costs: 0,
      variable_costs: 0,
      tickets: 0,
      app_online_sales: 0,
      in_store_sales: 0
    };

    tableData.forEach(entry => {
      totals.sales_budget += parseFloat(entry.sales_budget) || 0;
      totals.sales_actual += parseFloat(entry.sales_actual) || 0;
      totals.labour += parseFloat(entry.labour) || 0;
      totals.labour_actual += parseFloat(entry.labour_actual || entry.amount) || 0;
      totals.food_cost += parseFloat(entry.food_cost) || 0;
      totals.food_cost_actual += parseFloat(entry.food_cost_actual) || 0;
      totals.hours += parseFloat(entry.hours) || 0;
      totals.tickets += parseFloat(entry.tickets) || 0;
      totals.app_online_sales += parseFloat(entry.app_online_sales) || 0;
      totals.in_store_sales += parseFloat(entry.in_store_sales || entry['in-store_sales']) || 0;

      // Handle fixed costs array
      if (Array.isArray(entry.fixed_costs)) {
        entry.fixed_costs.forEach(cost => {
          totals.fixed_costs += parseFloat(cost.amount) || 0;
        });
      }

      // Handle variable costs array
      if (Array.isArray(entry.variable_costs)) {
        entry.variable_costs.forEach(cost => {
          totals.variable_costs += parseFloat(cost.amount) || 0;
        });
      }
    });

    return totals;
  }, [tableData]);

  // Render weekly summary - Optimized for performance
  const renderWeeklySummary = useCallback((categoryKey, totals) => {
    switch (categoryKey) {
      case 'sales_budget':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Sales Budget</div>
              <div className="text-sm font-bold text-blue-900">{formatCurrency(totals.sales_budget)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Net Sales</div>
              <div className="text-sm font-bold text-green-900">{formatCurrency(totals.sales_actual)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Tickets</div>
              <div className="text-sm font-bold text-gray-900">{formatNumber(totals.tickets)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Avg Ticket</div>
              <div className="text-sm font-bold text-gray-900">
                {totals.tickets > 0 ? formatCurrency(totals.sales_actual / totals.tickets) : '$0'}
              </div>
            </div>
          </div>
        );
      case 'labour':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Labor Budget</div>
              <div className="text-sm font-bold text-blue-900">{formatCurrency(totals.labour)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Labor Actual</div>
              <div className="text-sm font-bold text-green-900">{formatCurrency(totals.labour_actual)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Hours</div>
              <div className="text-sm font-bold text-gray-900">{formatNumber(totals.hours)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Avg Hourly Rate</div>
              <div className="text-sm font-bold text-gray-900">
                {totals.hours > 0 ? formatCurrency(totals.labour_actual / totals.hours) : '$0'}
              </div>
            </div>
          </div>
        );
      case 'food_cost':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Food Cost Budget</div>
              <div className="text-sm font-bold text-blue-900">{formatCurrency(totals.food_cost)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Food Cost Actual</div>
              <div className="text-sm font-bold text-green-900">{formatCurrency(totals.food_cost_actual)}</div>
            </div>
          </div>
        );
      case 'fixedCost':
        return (
          <div className="text-center">
            <div className="text-xs text-gray-600">Total Fixed Costs</div>
            <div className="text-sm font-bold text-blue-900">{formatCurrency(totals.fixed_costs)}</div>
          </div>
        );
      case 'variableCost':
        return (
          <div className="text-center">
            <div className="text-xs text-gray-600">Total Variable Costs</div>
            <div className="text-sm font-bold text-blue-900">{formatCurrency(totals.variable_costs)}</div>
          </div>
        );
      default:
        return null;
    }
  }, [formatCurrency, formatNumber]);

  // State for expandable details within each category
  const [expandedDetails, setExpandedDetails] = useState(new Set());

  // Toggle detail expansion - Optimized for performance
  const toggleDetailExpansion = useCallback((detailKey) => {
    setExpandedDetails(prev => {
      if (prev.has(detailKey)) {
        const newSet = new Set(prev);
        newSet.delete(detailKey);
        return newSet;
      } else {
        return new Set([...prev, detailKey]);
      }
    });
  }, []);

  // Render sales details
  const renderSalesDetails = useCallback((salesData) => {
    const salesBudget = parseFloat(salesData.sales_budget) || 0;
    const salesActual = parseFloat(salesData.sales_actual) || 0;
    const appOnlineSales = parseFloat(salesData.app_online_sales) || 0;
    const tickets = parseFloat(salesData.tickets) || 0;
    const avgTicket = parseFloat(salesData.average_ticket) || (tickets > 0 ? salesActual / tickets : 0);
    const amtOverUnder = parseFloat(salesData.sales_amount) || 0;
    const percentOverUnder = parseFloat(salesData.sales_amount_percent) || 0;

    // Handle third party sales
    const thirdPartyProviders = [];
    if (salesData.third_party_sales && Array.isArray(salesData.third_party_sales)) {
      salesData.third_party_sales.forEach((provider, index) => {
        if (provider.provider_name && provider.provider_fee) {
          const providerFee = parseFloat(provider.provider_fee) || 0;
          if (providerFee > 0) {
            thirdPartyProviders.push({
              name: provider.provider_name,
              key: `provider_${index}`,
              sales: providerFee
            });
          }
        }
      });
    }

    const getOverUnderColor = (value) => {
      if (value > 0) return 'text-red-600';
      if (value < 0) return 'text-green-600';
      return 'text-red-600';
    };

    const detailKey = `sales_${salesData.date || salesData.day || 'default'}`;
    const isExpanded = expandedDetails.has(detailKey);

    return (
      <div className="space-y-4">
        {/* Sales Budget */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-sm">💰</span>
            <span className="text-sm font-semibold text-blue-800">Sales Budget:</span>
          </div>
          <span className="text-sm font-bold text-blue-900">{formatCurrency(salesBudget)}</span>
        </div>

        {/* Net Sales - Expandable */}
        <div className="border border-gray-200 rounded">
          <div 
            className="flex items-center justify-between p-3 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => toggleDetailExpansion(detailKey)}
          >
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-sm">🛒</span>
              <span className="text-sm font-semibold text-green-800">Net Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-green-900">{formatCurrency(salesActual)}</span>
              <button className="text-green-600 hover:text-green-800 transition-colors">
                {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
              </button>
            </div>
          </div>
          
          {isExpanded && (
            <div className="p-3 bg-white border-t border-gray-200 space-y-3">
              {/* In-Store Sales */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs">🏪</span>
                  <span className="text-xs font-medium text-gray-700">In-Store Sales:</span>
                </div>
                <span className="text-xs font-semibold">
                  {formatCurrency(parseFloat(salesData?.in_store_sales || salesData?.['in-store_sales']) || 0)}
                </span>
              </div>

              {/* App/Online Sales */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs">📱</span>
                  <span className="text-xs font-medium text-gray-700">App/Online Sales:</span>
                </div>
                <span className="text-xs font-semibold">{formatCurrency(appOnlineSales)}</span>
              </div>

              {/* Third Party Sales */}
              {thirdPartyProviders.length > 0 && (
                <div className="border border-gray-200 rounded">
                  <div className="flex items-center justify-between p-2 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs">🚗</span>
                      <span className="text-xs font-medium text-gray-700">Third Party Sales:</span>
                    </div>
                    <span className="text-xs font-semibold">
                      {thirdPartyProviders.reduce((total, provider) => total + provider.sales, 0)}%
                    </span>
                  </div>
                  <div className="p-2 bg-white border-t border-gray-200 space-y-2">
                    {thirdPartyProviders.map((provider) => (
                      <div key={provider.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">🚗</span>
                          <span className="text-xs font-medium text-gray-600">{provider.name}:</span>
                        </div>
                        <span className="text-xs font-semibold">{provider.sales}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ticket Information */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-600"># Tickets:</span>
                  <span className="text-xs font-semibold">{tickets}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-600">AVG Ticket:</span>
                  <span className="text-xs font-semibold">{formatCurrency(avgTicket)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Over/Under Analysis */}
        <div className="p-3 bg-orange-50 rounded border border-orange-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Amt Over/Under:</span>
              <span className={`text-xs font-bold ${getOverUnderColor(amtOverUnder)}`}>
                {formatCurrency(amtOverUnder)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">% Over/Under:</span>
              <span className={`text-xs font-bold ${getOverUnderColor(percentOverUnder)}`}>
                {formatPercentage(percentOverUnder)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }, [formatCurrency, formatPercentage, expandedDetails, toggleDetailExpansion]);

  // Render labor details
  const renderLaborDetails = useCallback((laborData) => {
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
    const amtOverUnder = parseFloat(laborData.labour_amount) || 0;
    const percentOverUnder = parseFloat(laborData.labour_amount_percent) || 0;

    const getOverUnderColor = (value) => {
      if (value > 0) return 'text-red-600';
      if (value < 0) return 'text-green-600';
      return 'text-red-600';
    };

    const formatHours = (value) => {
      return `${value.toFixed(1)} hrs`;
    };

    const detailKey = `labor_${laborData.date || laborData.day || 'default'}`;
    const isExpanded = expandedDetails.has(detailKey);

    return (
      <div className="space-y-4">
        {/* Labor Budget */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-sm">💰</span>
            <span className="text-sm font-semibold text-blue-800">Labor Budget:</span>
          </div>
          <span className="text-sm font-bold text-blue-900">{formatCurrency(laborBudget)}</span>
        </div>

        {/* Labor Actual - Expandable */}
        <div className="border border-gray-200 rounded">
          <div 
            className="flex items-center justify-between p-3 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => toggleDetailExpansion(detailKey)}
          >
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-sm">⏰</span>
              <span className="text-sm font-semibold text-green-800">Labor Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-green-900">{formatCurrency(laborActual)}</span>
              <button className="text-green-600 hover:text-green-800 transition-colors">
                {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
              </button>
            </div>
          </div>
          
          {isExpanded && (
            <div className="p-3 bg-white border-t border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-600">Hours:</span>
                  <span className="text-xs font-semibold">{formatHours(laborHours)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-600">Avg Hourly Rate:</span>
                  <span className="text-xs font-semibold">{formatCurrency(averageHourlyRate)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Over/Under Analysis */}
        <div className="p-3 bg-orange-50 rounded border border-orange-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Amt Over/Under:</span>
              <span className={`text-xs font-bold ${getOverUnderColor(amtOverUnder)}`}>
                {formatCurrency(amtOverUnder)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">% Over/Under:</span>
              <span className={`text-xs font-bold ${getOverUnderColor(percentOverUnder)}`}>
                {formatPercentage(percentOverUnder)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }, [formatCurrency, formatPercentage, expandedDetails, toggleDetailExpansion]);

  // Render food cost details
  const renderFoodCostDetails = useCallback((foodCostData) => {
    const foodCostBudget = parseFloat(foodCostData.food_cost) || 0;
    const foodCostActual = parseFloat(foodCostData.food_cost_actual) || 0;
    const amtOverUnder = parseFloat(foodCostData.food_cost_amount) || 0;
    const percentOverUnder = parseFloat(foodCostData.food_cost_amount_percent) || 0;

    const getOverUnderColor = (value) => {
      if (value > 0) return 'text-red-600';
      if (value < 0) return 'text-green-600';
      return 'text-red-600';
    };

    const detailKey = `food_${foodCostData.date || foodCostData.day || 'default'}`;
    const isExpanded = expandedDetails.has(detailKey);

    return (
      <div className="space-y-4">
        {/* Food Cost Budget */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-sm">💰</span>
            <span className="text-sm font-semibold text-blue-800">Food Cost Budget:</span>
          </div>
          <span className="text-sm font-bold text-blue-900">{formatCurrency(foodCostBudget)}</span>
        </div>

        {/* Food Cost Actual - Expandable */}
        <div className="border border-gray-200 rounded">
          <div 
            className="flex items-center justify-between p-3 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => toggleDetailExpansion(detailKey)}
          >
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-sm">🍽️</span>
              <span className="text-sm font-semibold text-green-800">Food Cost Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-green-900">{formatCurrency(foodCostActual)}</span>
              <button className="text-green-600 hover:text-green-800 transition-colors">
                {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
              </button>
            </div>
          </div>
          
          {isExpanded && (
            <div className="p-3 bg-white border-t border-gray-200 space-y-3">
              {/* Food Cost Breakdown */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs">🍽️</span>
                  <span className="text-xs font-medium text-gray-700">Total Food Cost:</span>
                </div>
                <span className="text-xs font-semibold">{formatCurrency(foodCostActual)}</span>
              </div>
              
              {/* Additional food cost details can be added here */}
              <div className="text-center py-2 bg-gray-50 rounded border border-gray-200">
                <span className="text-xs text-gray-500 italic">Food cost breakdown details</span>
              </div>
            </div>
          )}
        </div>

        {/* Over/Under Analysis */}
        <div className="p-3 bg-orange-50 rounded border border-orange-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Amt Over/Under:</span>
              <span className={`text-xs font-bold ${getOverUnderColor(amtOverUnder)}`}>
                {formatCurrency(amtOverUnder)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">% Over/Under:</span>
              <span className={`text-xs font-bold ${getOverUnderColor(percentOverUnder)}`}>
                {formatPercentage(percentOverUnder)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }, [formatCurrency, formatPercentage, expandedDetails, toggleDetailExpansion]);

  // Render fixed cost details
  const renderFixedCostDetails = useCallback((fixedCostData) => {
    const fixedCosts = Array.isArray(fixedCostData.fixed_costs) ? fixedCostData.fixed_costs : [];
    const totalFixedCost = fixedCosts.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);

    const detailKey = `fixed_${fixedCostData.date || fixedCostData.day || 'default'}`;
    const isExpanded = expandedDetails.has(detailKey);

    return (
      <div className="space-y-4">
        {/* Total Fixed Cost */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-sm">💰</span>
            <span className="text-sm font-semibold text-blue-800">Total Fixed Cost:</span>
          </div>
          <span className="text-sm font-bold text-blue-900">{formatCurrency(totalFixedCost)}</span>
        </div>

        {/* Fixed Cost Breakdown - Expandable */}
        {fixedCosts.length > 0 ? (
          <div className="border border-gray-200 rounded">
            <div 
              className="p-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
              onClick={() => toggleDetailExpansion(detailKey)}
            >
              <span className="text-sm font-semibold text-gray-800">Fixed Cost Breakdown</span>
              <button className="text-gray-600 hover:text-gray-800 transition-colors">
                {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
              </button>
            </div>
            {isExpanded && (
              <div className="p-3 bg-white space-y-2">
                {fixedCosts.map((cost, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{cost.name || `Fixed Cost ${index + 1}`}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(parseFloat(cost.amount || 0))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded border border-gray-200">
            <span className="text-sm text-gray-500 italic">No fixed cost data available</span>
          </div>
        )}
      </div>
    );
  }, [formatCurrency, expandedDetails, toggleDetailExpansion]);

  // Render variable cost details
  const renderVariableCostDetails = useCallback((variableCostData) => {
    const variableCosts = Array.isArray(variableCostData.variable_costs) ? variableCostData.variable_costs : [];
    const totalVariableCost = variableCosts.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);

    const detailKey = `variable_${variableCostData.date || variableCostData.day || 'default'}`;
    const isExpanded = expandedDetails.has(detailKey);

    return (
      <div className="space-y-4">
        {/* Total Variable Cost */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-sm">💰</span>
            <span className="text-sm font-semibold text-blue-800">Total Variable Cost:</span>
          </div>
          <span className="text-sm font-bold text-blue-900">{formatCurrency(totalVariableCost)}</span>
        </div>

        {/* Variable Cost Breakdown - Expandable */}
        {variableCosts.length > 0 ? (
          <div className="border border-gray-200 rounded">
            <div 
              className="p-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
              onClick={() => toggleDetailExpansion(detailKey)}
            >
              <span className="text-sm font-semibold text-gray-800">Variable Cost Breakdown</span>
              <button className="text-gray-600 hover:text-gray-800 transition-colors">
                {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
              </button>
            </div>
            {isExpanded && (
              <div className="p-3 bg-white space-y-2">
                {variableCosts.map((cost, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{cost.name || `Variable Cost ${index + 1}`}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(parseFloat(cost.amount || 0))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded border border-gray-200">
            <span className="text-sm text-gray-500 italic">No variable cost data available</span>
          </div>
        )}
      </div>
    );
  }, [formatCurrency, expandedDetails, toggleDetailExpansion]);

  // Render detailed content for expandable rows - Optimized with memoization
  const renderDetailedContent = useCallback((categoryKey, entry) => {
    switch (categoryKey) {
      case 'sales_budget':
        return renderSalesDetails(entry);
      case 'labour':
        return renderLaborDetails(entry);
      case 'food_cost':
        return renderFoodCostDetails(entry);
      case 'fixedCost':
        return renderFixedCostDetails(entry);
      case 'variableCost':
        return renderVariableCostDetails(entry);
      default:
        return null;
    }
  }, [renderSalesDetails, renderLaborDetails, renderFoodCostDetails, renderFixedCostDetails, renderVariableCostDetails]);

  // Render weekly detailed content for all days - Optimized with memoization
  const renderWeeklyDetailedContent = useCallback((categoryKey) => {
    if (!tableData || tableData.length === 0) return null;

    // Use memoized weekly totals
    const weeklyTotals = calculateWeeklyTotals;

    return (
      <div className="space-y-6">
        {/* Weekly Summary */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h5 className="font-semibold text-blue-800 text-sm mb-3">Weekly Summary</h5>
          {renderWeeklySummary(categoryKey, weeklyTotals)}
        </div>

        {/* Daily Breakdown */}
        <div className="space-y-4">
          <h5 className="font-semibold text-gray-800 text-sm">Daily Breakdown</h5>
          {tableData.map((entry, index) => {
            const dateInfo = formatDateForDisplay(entry.date || entry.day);
            const detailKey = `${categoryKey}_${entry.date || entry.day || index}`;
            
            return (
              <div key={detailKey} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                  <h5 className="font-semibold text-gray-800 text-sm">
                    {dateInfo.day} - {dateInfo.fullDate}
                  </h5>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Day {index + 1}
                  </span>
                </div>
                {renderDetailedContent(categoryKey, entry)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [tableData, formatDateForDisplay, renderDetailedContent, calculateWeeklyTotals, renderWeeklySummary]);

  // Check if we have data
  const hasData = tableData.length > 0;
  const dataToProcess = dashboardSummaryData || dashboardData;
  const isFailStatus = dataToProcess?.status === 'fail';

  // Loading state
  if (loading) {
    return (
      <Card className="shadow-lg border-0">
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Loading dashboard summary data...</p>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="shadow-lg border-0">
        <Alert
          message="Error Loading Data"
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  // No data state or fail status
  if (!hasData || isFailStatus) {
    const errorMessage = dataToProcess?.status === 'fail' && dataToProcess?.message 
      ? dataToProcess.message 
      : "No weekly dashboard data found for the selected criteria.";

    return (
      <Card className="shadow-lg border-0">
       {errorMessage}
      </Card>
    );
  }

  return (

    
    <Card className="shadow-lg border-0">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-bold text-orange-600 mb-0">
            Profit & Loss Dashboard
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              icon={<PrinterOutlined />} 
              onClick={handlePrint}
              size="middle"
              className="h-9 px-4 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 font-normal rounded-lg flex items-center gap-2"
            >
              <span className="hidden sm:inline">Print Report</span>
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
            size="middle"
            className="h-9 px-4 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 font-normal rounded-lg flex items-center gap-2"
          >
            <span className="hidden sm:inline">Export Data</span>
          </Button>
        </div>
      </div>
    </div>

      {/* Desktop table with expandable rows and grouped columns */}
      <div className="hidden sm:block">
        <Table
          columns={generateGroupedColumns}
          dataSource={generateExpandableData}
          pagination={false}
          scroll={{ x: 'max-content' }}
          className="summary-table"
          rowKey="key"
          size="small"
          expandable={{
            expandedRowKeys: Array.from(expandedRows),
            onExpand: (expanded, record) => {
              if (expanded) {
                setExpandedRows(prev => new Set([...prev, record.key]));
              } else {
                setExpandedRows(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(record.key);
                  return newSet;
                });
              }
            },
            expandIcon: ({ expanded, onExpand, record }) => {
              const category = categories.find(cat => cat.key === record.key);
              if (!category?.hasDetails) return null;
              
              return (
                <button
                  onClick={(e) => onExpand(record, e)}
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {expanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                </button>
              );
            },
                         expandedRowRender: (record) => {
               const category = categories.find(cat => cat.key === record.key);
               if (!category?.hasDetails) return null;
               
               return (
                 <div key={`expanded-${record.key}`} className="bg-gray-50 p-4 rounded-lg">
                   <h4 className="font-semibold text-gray-800 mb-3">{category.detailLabel}</h4>
                   {renderWeeklyDetailedContent(category.key)}
                 </div>
               );
             }
          }}
        />
      </div>

      {/* Mobile table with expandable cards */}
      <div className="block sm:hidden">
        <div className="space-y-4">
          {generateExpandableData.map((row) => {
            const category = categories.find(cat => cat.key === row.key);
            const isExpanded = expandedRows.has(row.key);
            
            return (
              <Card key={row.key} size="small" className="shadow-sm !mb-4">
                <div 
                  className="font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center justify-between cursor-pointer"
                  onClick={() => category?.hasDetails && toggleRowExpansion(row.key)}
                >
                  <span>{row.category}</span>
                  {category?.hasDetails && (
                    <button className="text-gray-500 hover:text-blue-600 transition-colors">
                      {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                    </button>
                  )}
                </div>
                
                {/* Main row data */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {tableData.map((entry, index) => {
                    const dateInfo = formatDateForDisplay(entry.date || entry.day);
                    const uniqueKey = `${dateInfo.fullDate}-${index}`;
                    const dateKey = entry.date || entry.day || 'N/A';
                    const rawValue = processedData[row.key]?.[dateKey] || 0;
                    
                    return (
                      <div key={uniqueKey} className="flex justify-between text-xs">
                        <span className="text-gray-600">
                          {dateInfo.day} {dateInfo.date}
                        </span>
                        <div className="flex items-center">
                          {renderCellValue(rawValue, row, entry, dateInfo)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Expandable details */}
                {category?.hasDetails && isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="font-semibold text-gray-700 mb-3 text-sm">{category.detailLabel}</h5>
                    {renderWeeklyDetailedContent(category.key)}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default ProfitLossTableDashboard;

