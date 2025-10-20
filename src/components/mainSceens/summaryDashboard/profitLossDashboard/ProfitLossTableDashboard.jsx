import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Space, Typography, Card, Row, Col, Spin, Alert, Collapse, Dropdown, Menu, Tooltip } from 'antd';
import { PrinterOutlined, DownloadOutlined, CaretRightOutlined, CaretDownOutlined, DownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import SalesDetailDropdown from './SalesDetailDropdown';
import LaborDetailDropdown from './LaborDetailDropdown';
import FoodCostDetailDropdown from './FoodCostDetailDropdown';
import FixedCostDetailDropdown from './FixedCostDetailDropdown';
import VariableCostDetailDropdown from './VariableCostDetailDropdown';
import { 
  processThirdPartySales, 
  getTotalThirdPartySales, 
  formatThirdPartySalesValue,
  processThirdPartySalesWithPercentages,
  getTotalThirdPartySalesByFormat,
  formatThirdPartySalesValueWithPercentage,
  getTotalThirdPartySalesFromAPI
} from '../../../../utils/thirdPartySalesUtils';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const ProfitLossTableDashboard = ({ dashboardData, dashboardSummaryData, loading, error, viewMode, onPrint }) => {
  const [tableData, setTableData] = useState([]);
  const [processedData, setProcessedData] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [printFormat, setPrintFormat] = useState('dollar');
  const [isFormatChanging, setIsFormatChanging] = useState(false);
  const [forceRender, setForceRender] = useState(0);

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

  // Helper function to determine if data is monthly format
  const isMonthlyData = useCallback((data) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    const firstEntry = data[0];
    return Object.prototype.hasOwnProperty.call(firstEntry, 'month_start') && Object.prototype.hasOwnProperty.call(firstEntry, 'month_end');
  }, []);

  // Helper function to format date for display
  const formatDateForDisplay = useCallback((dateString, isWeekly = false, isMonthly = false) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = dayjs(dateString);
      if (isMonthly) {
        return {
          day: `Month ${date.format('MMM')}`,
          date: `${date.format('MMM YYYY')}`,
          shortDate: date.format('MMM'),
          fullDate: `${date.format('MMM YYYY')}`
        };
      } else if (isWeekly) {
        return {
          day: `Week ${date.format('MMM DD')}`,
          date: `${date.format('MMM DD')} - ${dayjs(dateString).add(6, 'day').format('MMM DD, YYYY')}`,
          shortDate: date.format('MMM DD'),
          fullDate: `${date.format('MMM DD')} - ${dayjs(dateString).add(6, 'day').format('MMM DD, YYYY')}`
        };
      } else {
        return {
          day: `${date.format('ddd')}`,
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

    // Determine data format
    const isWeekly = isWeeklyData(entries);
    const isMonthly = isMonthlyData(entries);
    const dataFormat = isMonthly ? 'monthly' : (isWeekly ? 'weekly' : 'daily');

    // Process the data - Updated to handle both daily and weekly structures
    const processed = {
      sales_budget: {},
      sales_actual: {},
      sales_budeget_profit: {},
      labour: {},
      labour_actual: {},
      labour_profit: {},
      food_cost: {},
      food_cost_actual: {},
      food_cost_profit: {},
      hours: {},
      hours_actual: {},
      amount: {},
      average_hourly_rate: {},
      actual_daily_labor_rate: {},
      profit_loss: {},
      fixedCost: {},
      variableCost: {},
      fixedCostPercent: {},
      variableCostPercent: {},
      percentage_food_cost: {},
      percentage_fixed_cost_total: {},
      percentage_variable_cost_total: {}
    };

    entries.forEach((entry, index) => {
      // Create appropriate date key based on data format
      let dateKey;
      if (isMonthly) {
        // For monthly data, use month_start as the key
        dateKey = entry.month_start || `month-${index}`;
      } else if (isWeekly) {
        // For weekly data, use week_start as the key
        dateKey = entry.week_start || `week-${index}`;
      } else {
        // For daily data, use date or day field
        dateKey = entry.date || entry.day || `day-${index}`;
      }

      
      processed.sales_budget[dateKey] = parseNumericValue(entry.sales_budget);
      processed.sales_actual[dateKey] = parseNumericValue(entry.sales_actual);
      processed.sales_budeget_profit[dateKey] = parseNumericValue(entry.sales_budeget_profit);
      processed.labour[dateKey] = parseNumericValue(entry.labour);
      processed.hours_actual[dateKey] = parseNumericValue(entry.hours_actual);
      processed.actual_daily_labor_rate[dateKey] = parseNumericValue(entry.actual_daily_labor_rate);
      processed.labour_actual[dateKey] = parseNumericValue(entry.labour_actual);
      processed.labour_profit[dateKey] = parseNumericValue(entry.labour_profit);
      processed.food_cost[dateKey] = parseNumericValue(entry.food_cost);
      processed.food_cost_actual[dateKey] = parseNumericValue(entry.food_cost_actual);
      processed.food_cost_profit[dateKey] = parseNumericValue(entry.food_cost_profit);
      processed.hours[dateKey] = parseNumericValue(entry.hours);
      processed.amount[dateKey] = parseNumericValue(entry.amount);
      processed.average_hourly_rate[dateKey] = parseNumericValue(entry.average_hourly_rate);
      processed.profit_loss[dateKey] = parseNumericValue(entry.profit_loss);
      
      // Process the new percentage fields
      processed.percentage_food_cost[dateKey] = parseNumericValue(entry.percentage_food_cost);
      processed.percentage_fixed_cost_total[dateKey] = parseNumericValue(entry.percentage_fixed_cost_total);
      processed.percentage_variable_cost_total[dateKey] = parseNumericValue(entry.percentage_variable_cost_total);
      
             // Calculate fixed cost total from array
       const fixedCostTotal = Array.isArray(entry.fixed_costs) 
         ? entry.fixed_costs.reduce((sum, cost) => sum + parseNumericValue(cost.amount), 0)
         : 0;
       
       // Calculate variable cost total from array
       const variableCostTotal = Array.isArray(entry.variable_costs)
         ? entry.variable_costs.reduce((sum, cost) => sum + parseNumericValue(cost.amount), 0)
         : 0;
       
       // Calculate fixed cost percentage total from array
       const fixedCostPercentTotal = Array.isArray(entry.fixed_costs) 
         ? entry.fixed_costs.reduce((sum, cost) => sum + parseNumericValue(cost.percent_of_sales), 0)
         : 0;
       
       // Calculate variable cost percentage total from array
       const variableCostPercentTotal = Array.isArray(entry.variable_costs)
         ? entry.variable_costs.reduce((sum, cost) => sum + parseNumericValue(cost.percent_of_sales), 0)
         : 0;
       
       // Store both amount and percentage totals
       processed.fixedCost[dateKey] = fixedCostTotal;
       processed.variableCost[dateKey] = variableCostTotal;
       processed.fixedCostPercent[dateKey] = fixedCostPercentTotal;
       processed.variableCostPercent[dateKey] = variableCostPercentTotal;
      

    });

    setProcessedData(processed);
    setTableData(entries);
    
  }, [dashboardData, dashboardSummaryData, parseNumericValue, isWeeklyData, isMonthlyData, printFormat]);

  // Categories for the summary table with expandable details
  const categories = useMemo(() => [
    { 
      key: 'sales_actual', 
      label: 'Net Sales', 
      type: 'currency',
      hasDetails: true,
      detailLabel: 'Sales Details',
      detailFields: [
        // { key: 'sales_budget', label: 'Total Sales', type: 'currency' },
        // { key: 'sales_budeget_profit', label: 'Sales Profit %', type: 'percentage' }
      ]
    },
    { 
      key: 'labour_actual', 
      label: 'Labor Cost', 
      type: 'currency',
      hasDetails: true,
      detailLabel: 'Labor Details',
      detailFields: [
        // { key: 'labour', label: 'Labor Hours', type: 'currency' },
        // { key: 'labour_profit', label: 'Labor Profit %', type: 'percentage' },
        // { key: 'average_hourly_rate', label: 'Avg Hourly Rate', type: 'currency' }
      ]
    },
    { 
      key: 'food_cost_actual', 
      label: 'Food Cost', 
      type: 'currency',
      hasDetails: true,
      detailLabel: 'Food Cost Details',
      detailFields: [
        // { key: 'food_cost', label: 'Total Food Cost', type: 'currency' },
        // { key: 'food_cost_profit', label: 'Food Cost Profit %', type: 'percentage' }
      ]
    },
    { 
      key: 'fixedCost', 
      label: 'Fixed Cost (Total)', 
      type: 'currency',
      hasDetails: true,
      detailLabel: 'Fixed Cost Breakdown',
      detailFields: [
        // { key: 'fixedCost', label: 'Total Fixed Cost', type: 'currency' }
      ]
    },
    { 
      key: 'variableCost', 
      label: 'Variable Cost (Total)', 
      type: 'currency',
      hasDetails: true,
      detailLabel: 'Variable Cost Breakdown',
      detailFields: [
        // { key: 'variableCost', label: 'Total Variable Cost', type: 'currency' }
      ]
    },
    { 
      key: 'profit_loss', 
      label: 'Profit & Loss', 
      type: 'currency',
      hasDetails: false
    }
 
  ], []);

  // Helper function to format percentage
  const formatPercentage = useCallback((value) => {
    if (value === null || value === undefined || value === 'None' || value === '') {
      return null;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    return `${numValue > 0 ? '+' : ''}${Math.round(numValue)}%`;
  }, []);

  // Helper function to get percentage color based on category
  const getPercentageColor = useCallback((value, categoryKey = null) => {
    if (value === null || value === undefined || value === 'None' || value === '') {
      return 'text-gray-400';
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'text-gray-400';
    
    
    // For sales: positive is good (green), negative is bad (red)
    if (categoryKey === 'sales_actual' || categoryKey === 'sales_budget') {
      if (numValue > 0) return 'text-green-600';
      if (numValue < 0) return 'text-red-600';
      return 'text-gray-600';
    }
    
    // For costs (labor, food): positive is bad (red), negative is good (green)
    if (categoryKey === 'labour_actual' || categoryKey === 'food_cost_actual') {
      if (numValue > 0) return 'text-red-600';
      if (numValue < 0) return 'text-green-600';
      return 'text-gray-600';
    }
    
    // Default: positive is good (green), negative is bad (red)
    if (numValue > 0) return 'text-green-600';
    if (numValue < 0) return 'text-red-600';
    return 'text-gray-600';
  }, []);

  // Helper function to check if a day is closed
  const isDayClosed = useCallback((entry) => {
    if (!entry) return false;
    
    // Handle both boolean and integer values for restaurant_open
    if (typeof entry.restaurant_open === 'boolean') {
      return !entry.restaurant_open;
    }
    return entry.restaurant_open === 0;
  }, []);

  // Helper function to get dynamic variable name based on format
  const getDynamicVariableName = useCallback((baseKey) => {
    if (printFormat === 'percentage') {
      let dynamicKey;
      switch (baseKey) {
        case 'labour_actual':
          dynamicKey = 'percentage_labour_actual';
          break;
        case 'food_cost_actual':
          dynamicKey = 'percentage_food_cost_actual';
          break;
        case 'profit_loss':
          dynamicKey = 'percentage_profit_loss';
          break;
        case 'in_store_sales':
          dynamicKey = 'percentage_in_store_sales';
          break;
        case 'app_online_sales':
          dynamicKey = 'percentage_app_online_sales';
          break;
        case 'food_cost':
          dynamicKey = 'percentage_food_cost';
          break;
        case 'labour':
          dynamicKey = 'percentage_labour';
          break;
        case 'fixedCost':
          dynamicKey = 'fixedCostPercent';
          break;
        case 'variableCost':
          dynamicKey = 'variableCostPercent';
          break;
        case 'percentage_food_cost':
          dynamicKey = 'percentage_food_cost';
          break;
        case 'percentage_fixed_cost_total':
          dynamicKey = 'percentage_fixed_cost_total';
          break;
        case 'percentage_variable_cost_total':
          dynamicKey = 'percentage_variable_cost_total';
          break;
        default:
          dynamicKey = baseKey;
      }
      
      return dynamicKey;
    }
    
    return baseKey;
  }, [printFormat]);

  // Formatting utilities - Clean and explicit
  const formatCurrency = useCallback((value) => {
    if (value === '-') return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value || 0));
  }, []);

  const formatNumber = useCallback((value) => {
    if (value === '-') return '-';
    // Format as plain number without any currency symbols
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value || 0));
  }, []);

  // Format value based on current format setting
  const formatValue = useCallback((value, categoryKey) => {
    if (value === '-') return '-';
    
    let formattedResult;
    let formatType;
    
    // Handle percentage format
    if (printFormat === 'percentage') {
      if (categoryKey === 'labour_actual' || categoryKey === 'food_cost_actual' || categoryKey === 'profit_loss' || categoryKey === 'fixedCost' || categoryKey === 'variableCost' || categoryKey === 'percentage_food_cost' || categoryKey === 'percentage_fixed_cost_total' || categoryKey === 'percentage_variable_cost_total') {
        formattedResult = formatPercentage(value);
        formatType = 'percentage';
      } else {
        // For other fields in percentage mode, still show as currency
        formattedResult = formatCurrency(value);
        formatType = 'currency (in percentage mode)';
      }
    }
    // Handle number format
    else if (printFormat === 'number') {
      formattedResult = formatNumber(value);
      formatType = 'number';
    }
    // Handle dollar format (default)
    else if (printFormat === 'dollar') {
      formattedResult = formatCurrency(value);
      formatType = 'currency (dollar)';
    }
    // Fallback to currency format
    else {
      formattedResult = formatCurrency(value);
      formatType = 'currency (fallback)';
    }
    
    
    return formattedResult;
  }, [printFormat, formatCurrency, formatNumber, formatPercentage, forceRender]);

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
    
    // Use the appropriate formatter based on current format
    let formattedValue;
    let formatType;
    
    if (printFormat === 'number') {
      formattedValue = formatNumber(Math.abs(value));
      formatType = 'number';
    } else if (printFormat === 'percentage') {
      formattedValue = formatPercentage(value);
      formatType = 'percentage';
    } else {
      formattedValue = formatCurrency(Math.abs(value));
      formatType = 'currency';
    }
    
    let finalResult;
    if (printFormat === 'percentage') {
      finalResult = formattedValue; // Percentage already includes +/- signs
    } else {
      if (value > 0) {
        finalResult = `+${formattedValue}`;
      } else if (value < 0) {
        finalResult = `-${formattedValue}`;
      } else {
        finalResult = formattedValue;
      }
    }
    
 
    
    return finalResult;
  }, [formatCurrency, formatNumber, formatPercentage, printFormat, forceRender]);



  // Generate grouped columns with multi-level headers
  const generateGroupedColumns = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];

    // Determine data format
    const isWeekly = isWeeklyData(tableData);
    const isMonthly = isMonthlyData(tableData);

    // Group dates by week if monthly view
    const groupedDates = viewMode === 'monthly' ? 
      tableData.reduce((groups, entry, index) => {
        // Use appropriate date field based on data format
        let dateField;
        if (isMonthly) {
          dateField = entry.month_start;
        } else if (isWeekly) {
          dateField = entry.week_start;
        } else {
          dateField = entry.date || entry.day;
        }
        
        const dateInfo = formatDateForDisplay(dateField, isWeekly, isMonthly);
        const weekKey = dayjs(dateField).format('YYYY-[W]WW');
        
        if (!groups[weekKey]) {
          groups[weekKey] = {
            weekKey,
            weekLabel: isMonthly ? `Month ${dayjs(dateField).format('MMM')}` : `Week ${dayjs(dateField).format('WW')}`,
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
        // Use appropriate date field based on data format
        let dateField;
        if (isMonthly) {
          dateField = entry.month_start;
        } else if (isWeekly) {
          dateField = entry.week_start;
        } else {
          dateField = entry.date || entry.day;
        }
        
        const dateInfo = formatDateForDisplay(dateField, isWeekly, isMonthly);
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
        
        const isClosed = isDayClosed(entry);
        groupedColumns.push({
          title: (
            <div className={`${isClosed ? 'opacity-60' : ''}`}>
              <div className={`font-semibold text-sm ${isClosed ? 'text-gray-500' : 'text-gray-800'}`}>
                {dateInfo.day}
                {isClosed && <span className="ml-1 text-xs">🔒</span>}
              </div>
              <div className={`text-xs ${isClosed ? 'text-gray-400' : 'text-gray-600'}`}>
                {dateInfo.date}
              </div>
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
          const isClosed = isDayClosed(entry);
          
          return {
            title: (
              <div className={`${isClosed ? 'opacity-60' : ''}`}>
                <div className={`font-semibold text-xs ${isClosed ? 'text-gray-500' : 'text-gray-800'}`}>
                  {dateInfo.day}
                  {isClosed && <span className="ml-1 text-xs">🔒</span>}
                </div>
                <div className={`text-xs ${isClosed ? 'text-gray-400' : 'text-gray-600'}`}>
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
            <div className="">
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
  }, [tableData, viewMode, formatDateForDisplay, expandedRows, categories, isWeeklyData, isMonthlyData, forceRender]);

  // Render cell value with proper formatting
  const renderCellValue = useCallback((value, record, entry, dateInfo) => {
    const categoryKey = record.key;
    const isClosed = isDayClosed(entry);
    
    // Determine data format and use appropriate date key
    const isWeekly = isWeeklyData(tableData);
    const isMonthly = isMonthlyData(tableData);
    let dateKey;
    if (isMonthly) {
      dateKey = entry.month_start || 'N/A';
    } else if (isWeekly) {
      dateKey = entry.week_start || 'N/A';
    } else {
      dateKey = entry.date || entry.day || 'N/A';
    }
    
    // Get dynamic variable name based on format
    const dynamicKey = getDynamicVariableName(categoryKey);
    let rawValue;
    
    // Simple logic: just get the value based on format, no auto-calculation
    if (printFormat === 'percentage' && (
      categoryKey === 'labour_actual' || 
      categoryKey === 'food_cost_actual' || 
      categoryKey === 'profit_loss' ||
      categoryKey === 'in_store_sales' ||
      categoryKey === 'app_online_sales' ||
      categoryKey === 'food_cost' ||
      categoryKey === 'labour' ||
      categoryKey === 'fixedCost' ||
      categoryKey === 'variableCost' ||
      categoryKey === 'percentage_food_cost' ||
      categoryKey === 'percentage_fixed_cost_total' ||
      categoryKey === 'percentage_variable_cost_total'
    )) {
      // For percentage format, get the percentage value from the entry or processed data
      if (categoryKey === 'fixedCost') {
        // Use direct API percentage value for fixed cost
        rawValue = parseNumericValue(entry.percentage_fixed_cost_total);
      } else if (categoryKey === 'variableCost') {
        // Use direct API percentage value for variable cost
        rawValue = parseNumericValue(entry.percentage_variable_cost_total);
      } else if (categoryKey === 'percentage_food_cost' || categoryKey === 'percentage_fixed_cost_total' || categoryKey === 'percentage_variable_cost_total') {
        // Use processed percentage data for the new percentage fields
        rawValue = processedData[dynamicKey]?.[dateKey] || 0;
      } else {
        // For other fields, get the percentage value from the entry
        const percentageValue = entry[dynamicKey];
        rawValue = parseNumericValue(percentageValue); // This will return 0 if undefined
      }
      
    } else {
      // For dollar and number formats, use the processed data
      rawValue = processedData[categoryKey]?.[dateKey] || 0;
    }
    
    // Check if the original value was None/null/undefined
    let originalValue, displayValue;
    if (categoryKey === 'fixedCost' || categoryKey === 'variableCost' || categoryKey === 'percentage_food_cost' || categoryKey === 'percentage_fixed_cost_total' || categoryKey === 'percentage_variable_cost_total') {
      displayValue = rawValue > 0 ? rawValue.toString() : '-';
    } else {
      originalValue = entry[categoryKey];
      displayValue = handleValue(originalValue);
    }
    
    if (displayValue === '-') {
      return (
        <span className={`text-xs ${isClosed ? 'text-gray-300 opacity-30' : 'text-gray-500'}`}>
          {isClosed ? 'Closed' : '-'}
        </span>
      );
    }
    
    // Get profit percentage for inline display
    let profitPercentage = null;
    if (categoryKey === 'sales_actual' && entry.sales_budeget_profit) {
      profitPercentage = formatPercentage(entry.sales_budeget_profit);
    } else if (categoryKey === 'labour_actual' && entry.labour_profit) {
      profitPercentage = formatPercentage(entry.labour_profit);
    } else if (categoryKey === 'food_cost_actual' && entry.food_cost_profit) {
      profitPercentage = formatPercentage(entry.food_cost_profit);
    }
    
    // Debug logging for weekly/monthly data
    if ((isWeeklyData(tableData) || isMonthlyData(tableData)) && (categoryKey === 'sales_actual' || categoryKey === 'labour_actual' || categoryKey === 'food_cost_actual')) {
      const dataType = isMonthlyData(tableData) ? 'Monthly' : 'Weekly';

    }
    
    // Handle currency fields
    if (categoryKey === 'sales_actual' || categoryKey === 'food_cost_actual' || 
        categoryKey === 'fixedCost' || categoryKey === 'variableCost' ||
        categoryKey === 'amount' || categoryKey === 'actual_daily_labor_rate' || 
        categoryKey === 'profit_loss' || categoryKey === 'percentage_food_cost' ||
        categoryKey === 'percentage_fixed_cost_total' || categoryKey === 'percentage_variable_cost_total') {
      const colorClass = categoryKey === 'profit_loss' ? getProfitLossColor(rawValue) : 'text-gray-700';
      
      // Simple formatting based on format type
      let formattedValue;
      
      if (categoryKey === 'profit_loss') {
        formattedValue = formatProfitLoss(rawValue);
      } else {
        formattedValue = formatValue(rawValue, categoryKey);
      }
      

      
      // Make sales budget clickable with dropdown
      if (categoryKey === 'sales_actual' && rawValue > 0) {
        const dayData = {
          dayName: dateInfo.day,
          date: dateInfo.fullDate
        };
        
        return (
          <div className={`flex items-start justify-start ${isClosed ? 'opacity-50' : ''}`}>
            <SalesDetailDropdown dayData={dayData} salesData={entry} printFormat={printFormat}>
              <span 
                className={`text-sm ${isClosed ? 'text-gray-400' : colorClass} flex items-center gap-1 ${isClosed ? '' : 'cursor-pointer hover:text-blue-600 hover:underline'}`}
                title={isClosed ? "Restaurant is closed on this day" : "Click to view sales details"}
              >
                {formattedValue}
              </span>
            </SalesDetailDropdown>
            {profitPercentage && !isClosed && (
              <SalesDetailDropdown dayData={dayData} salesData={entry} printFormat={printFormat}>
                <span className={`text-xs ml-1 mb-2 cursor-pointer hover:text-blue-600 hover:underline ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_amount_percent, categoryKey)} font-bold`}>
                  {profitPercentage}
                </span>
              </SalesDetailDropdown>
            )}
          
          </div>
        );
      }
      
      // Make food cost clickable with dropdown
      if (categoryKey === 'food_cost_actual' && rawValue > 0) {
        const dayData = {
          dayName: dateInfo.day,
          date: dateInfo.fullDate
        };
        
        return (
          <div className={`flex items-start justify-start ${isClosed ? 'opacity-50' : ''}`}>
            <span 
              className={`text-sm ${isClosed ? 'text-gray-400' : colorClass} flex items-center`}
              title={isClosed ? "Restaurant is closed on this day" : "Click to view food cost details"}
            >
              {formattedValue}
            </span>
            {profitPercentage && !isClosed && (
              <FoodCostDetailDropdown dayData={dayData} foodCostData={entry} printFormat={printFormat}>
                <span className={`text-xs ml-1 mb-2 cursor-pointer hover:text-blue-600 hover:underline ${getPercentageColor(entry.food_cost_profit, categoryKey)} font-bold`}>
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
            <div className={`flex items-start justify-start ${isClosed ? 'opacity-50' : ''}`}>
              <FixedCostDetailDropdown dayData={dayData} fixedCostData={entry} printFormat={printFormat}>
                <span 
                  className={`text-sm ${isClosed ? 'text-gray-400' : colorClass} flex items-center gap-1 ${isClosed ? '' : 'cursor-pointer hover:text-blue-600 hover:underline'}`}
                  title={isClosed ? "Restaurant is closed on this day" : "Click to view fixed cost details"}
                >
                  {formattedValue} ⓘ
                </span>
              </FixedCostDetailDropdown>
              {profitPercentage && !isClosed && (
                <span className={`text-xs ml-1 mb-2 ${getPercentageColor(entry.fixed_costs_profit || entry.fixedCost_profit, categoryKey)} font-bold`}>
                  {profitPercentage}
                </span>
              )}
            </div>
          );
        } else {
          return (
            <div className={`flex items-start justify-start ${isClosed ? 'opacity-50' : ''}`}>
              <span className={`text-sm ${isClosed ? 'text-gray-400' : colorClass}`}>{formattedValue}</span>
              {profitPercentage && !isClosed && (
                <span className={`text-xs ml-1 mb-2 ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit, categoryKey)} font-bold`}>
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
            <div className={`flex items-start justify-start ${isClosed ? 'opacity-50' : ''}`}>
              <VariableCostDetailDropdown dayData={dayData} variableCostData={entry} printFormat={printFormat}>
                <span 
                  className={`text-sm ${isClosed ? 'text-gray-400' : colorClass} flex items-center gap-1 ${isClosed ? '' : 'cursor-pointer hover:text-blue-600 hover:underline'}`}
                  title={isClosed ? "Restaurant is closed on this day" : "Click to view variable cost details"}
                >
                  {formattedValue} ⓘ
                </span>
              </VariableCostDetailDropdown>
              {profitPercentage && !isClosed && (
                <span className={`text-xs ml-1 mb-2 ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit, categoryKey)} font-bold`}>
                  {profitPercentage}
                </span>
              )}
            </div>
          );
        } else {
          return (
            <div className={`flex items-start justify-start ${isClosed ? 'opacity-50' : ''}`}>
              <span className={`text-sm ${isClosed ? 'text-gray-400' : colorClass}`}>{formattedValue}</span>
              {profitPercentage && !isClosed && (
                <span className={`text-xs ml-1 mb-2 ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit, categoryKey)} font-bold`}>
                  {profitPercentage}
                </span>
              )}
            </div>
          );
        }
      }
      
      return (
        <div className={`flex items-start justify-start ${isClosed ? 'opacity-50' : ''}`}>
          <span className={`text-sm ${isClosed ? 'text-gray-400' : colorClass}`}>{formattedValue}</span>
          {profitPercentage && !isClosed && (
            <span className={`text-xs ml-1 mb-2 ${getPercentageColor(entry[`${categoryKey}_profit`] || entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit, categoryKey)} font-bold`}>
              {profitPercentage}
            </span>
          )}
        </div>
      );
    }
    
    // Handle number fields
    if (categoryKey === 'labour_actual' || categoryKey === 'hours_actual') {
      // Simple formatting for labour_actual
      const formattedLabourValue = formatValue(rawValue, categoryKey);
      

      
      // Make labor clickable with dropdown
      if (categoryKey === 'labour_actual' && rawValue > 0) {
        const dayData = {
          dayName: dateInfo.day,
          date: dateInfo.fullDate
        };
        
        return (
          <div className={`flex items-start justify-start ${isClosed ? 'opacity-50' : ''}`}>
            <span 
              className={`text-sm ${isClosed ? 'text-gray-400' : 'text-gray-700'} flex items-center gap-1`}
              title={isClosed ? "Restaurant is closed on this day" : "Click to view labor details"}
            >
              {formattedLabourValue} 
            </span>
            {profitPercentage && !isClosed && (
              <LaborDetailDropdown dayData={dayData} laborData={entry} printFormat={printFormat}>
                <span className={`text-xs ml-1 mb-2 cursor-pointer hover:text-blue-600 hover:underline ${getPercentageColor(entry.labour_profit, categoryKey)} font-bold`}>
                  {profitPercentage}
                </span>
              </LaborDetailDropdown>
            )}
          </div>
        );
      }
      
      return (
        <div className={`flex items-start justify-start ${isClosed ? 'opacity-50' : ''}`}>
          <span className={`text-sm ${isClosed ? 'text-gray-400' : 'text-gray-700'}`}>{formattedLabourValue}</span>
          {profitPercentage && !isClosed && (
            <span className={`text-xs ml-1 ${getPercentageColor(entry.labour_profit, categoryKey)} font-bold`}>
              {profitPercentage}
            </span>
          )}
        </div>
      );
    }
    
    
    return <span className={`text-sm ${isClosed ? 'text-gray-400 opacity-50' : 'text-gray-700'}`}>{rawValue}</span>;
  }, [processedData, handleValue, formatCurrency, formatNumber, getProfitLossColor, formatProfitLoss, formatPercentage, getPercentageColor, tableData, isWeeklyData, isMonthlyData, getDynamicVariableName, printFormat, parseNumericValue, formatValue, forceRender, isDayClosed]);

  // Generate expandable row data
  const generateExpandableData = useMemo(() => {
    // Determine data format
    const isWeekly = isWeeklyData(tableData);
    const isMonthly = isMonthlyData(tableData);
    
    return categories.map(category => {
      const baseRow = {
        key: category.key,
        category: category.label,
        ...tableData.reduce((acc, entry, index) => {
          // Use appropriate date field based on data format
          let dateField;
          if (isMonthly) {
            dateField = entry.month_start;
          } else if (isWeekly) {
            dateField = entry.week_start;
          } else {
            dateField = entry.date || entry.day;
          }
          
          const dateInfo = formatDateForDisplay(dateField, isWeekly, isMonthly);
          const uniqueKey = `${dateInfo.fullDate}-${index}`;
          
          let dateKey;
          if (isMonthly) {
            dateKey = entry.month_start || 'N/A';
          } else if (isWeekly) {
            dateKey = entry.week_start || 'N/A';
          } else {
            dateKey = entry.date || entry.day || 'N/A';
          }
          
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
                // Use appropriate date field based on data format
                let dateField;
                if (isMonthly) {
                  dateField = entry.month_start;
                } else if (isWeekly) {
                  dateField = entry.week_start;
                } else {
                  dateField = entry.date || entry.day;
                }
                
                const dateInfo = formatDateForDisplay(dateField, isWeekly, isMonthly);
                const uniqueKey = `${dateInfo.fullDate}-${index}`;
                
                let dateKey;
                if (isMonthly) {
                  dateKey = entry.month_start || 'N/A';
                } else if (isWeekly) {
                  dateKey = entry.week_start || 'N/A';
                } else {
                  dateKey = entry.date || entry.day || 'N/A';
                }
                
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
  }, [categories, tableData, processedData, formatDateForDisplay, isWeeklyData, isMonthlyData, forceRender]);

  // CSV generation
  const generateCSV = useCallback(() => {
    if (!tableData || tableData.length === 0) return '';
    
    // Determine data format
    const isWeekly = isWeeklyData(tableData);
    const isMonthly = isMonthlyData(tableData);
    
    const dates = tableData.map(entry => {
      // Use appropriate date field based on data format
      let dateField;
      if (isMonthly) {
        dateField = entry.month_start;
      } else if (isWeekly) {
        dateField = entry.week_start;
      } else {
        dateField = entry.date || entry.day;
      }
      
      const dateInfo = formatDateForDisplay(dateField, isWeekly, isMonthly);
      // Use the same format as displayed in table columns
      return `${dateInfo.day} ${dateInfo.date}`;
    });
    const headers = ['"Category"', ...dates.map(date => `"${date}"`)];
    const rows = categories.map(category => {
      const rowData = [`"${category.label}"`];
      dates.forEach((_, index) => {
        const entry = tableData[index];
        let dateKey;
        if (isMonthly) {
          dateKey = entry.month_start || 'N/A';
        } else if (isWeekly) {
          dateKey = entry.week_start || 'N/A';
        } else {
          dateKey = entry.date || entry.day || 'N/A';
        }
        
        // Get the appropriate value based on current format
        let rawValue;
        if (printFormat === 'percentage' && (
          category.key === 'labour_actual' || 
          category.key === 'food_cost_actual' || 
          category.key === 'profit_loss' ||
          category.key === 'fixedCost' ||
          category.key === 'variableCost' ||
          category.key === 'percentage_food_cost' ||
          category.key === 'percentage_fixed_cost_total' ||
          category.key === 'percentage_variable_cost_total'
        )) {
          // For percentage format, get the percentage value
          if (category.key === 'fixedCost' || category.key === 'variableCost') {
            // Use processed percentage data for fixed/variable costs
            const dynamicKey = getDynamicVariableName(category.key);
            rawValue = processedData[dynamicKey]?.[dateKey] || 0;
          } else if (category.key === 'percentage_food_cost' || category.key === 'percentage_fixed_cost_total' || category.key === 'percentage_variable_cost_total') {
            // Use processed percentage data for the new percentage fields
            const dynamicKey = getDynamicVariableName(category.key);
            rawValue = processedData[dynamicKey]?.[dateKey] || 0;
          } else {
            // For other fields, get the percentage value from the entry
            const dynamicKey = getDynamicVariableName(category.key);
            const percentageValue = entry[dynamicKey];
            rawValue = parseNumericValue(percentageValue);
          }
        } else {
          // For dollar and number formats, use the processed data
          rawValue = processedData[category.key]?.[dateKey] || 0;
        }
        
        // Format the value based on current format
        const formattedValue = formatValue(rawValue, category.key);
        // Wrap in quotes to preserve commas and other formatting in CSV
        rowData.push(`"${formattedValue}"`);
      });
      return rowData.join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }, [tableData, categories, processedData, formatDateForDisplay, isWeeklyData, isMonthlyData, printFormat, getDynamicVariableName, parseNumericValue, formatValue]);

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

  // Print handler - use the passed onPrint function
  const handlePrint = useCallback(() => {
    if (onPrint) {
      onPrint();
    }
  }, [onPrint]);

  // Function to get display text for format
  const getFormatDisplayText = (format) => {
    switch (format) {
      case 'dollar':
        return 'Dollar ($)';
      case 'percentage':
        return 'Percentage (%)';
      default:
        return 'Select Format';
    }
  };

  // Create dropdown menu for format selection
  const formatMenuItems = [
    {
      key: 'dollar',
      label: 'Dollar ($)',
      icon: '💰',
    },
    {
      key: 'percentage',
      label: 'Percentage (%)',
      icon: '📊',
    },
  ];

  // Handle format change with immediate update
  const handleFormatChange = useCallback(({ key }) => {
    if (key === printFormat) return; // Prevent unnecessary updates

    
    setIsFormatChanging(true);
    setPrintFormat(key);
    
    // Force immediate re-render
    setForceRender(prev => prev + 1);
    
    // Clear loading state after a brief delay to show smooth transition
    setTimeout(() => {
      setIsFormatChanging(false);
    }, 100);
  }, [printFormat]);

  // Get format icon for display
  const getFormatIcon = useCallback((format) => {
    switch (format) {
      case 'dollar':
        return '💰';
      case 'percentage':
        return '📊';
      default:
        return '💰';
    }
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
      hours_actual: 0,
      fixed_costs: 0,
      variable_costs: 0,
      fixed_costs_percent: 0,
      variable_costs_percent: 0,
      tickets: 0,
      app_online_sales: 0,
      in_store_sales: 0,
      total_days: 0
    };

         tableData.forEach(entry => {
       totals.sales_budget += parseFloat(entry.sales_budget) || 0;
       totals.sales_actual += parseFloat(entry.sales_actual) || 0;
       totals.labour += parseFloat(entry.labour) || 0;
       totals.labour_actual += parseFloat(entry.labour_actual || entry.amount) || 0;
       totals.food_cost += parseFloat(entry.food_cost) || 0;
       totals.food_cost_actual += parseFloat(entry.food_cost_actual) || 0;
       totals.hours_actual += parseFloat(entry.hours_actual) || 0;
       totals.tickets += parseFloat(entry.tickets) || 0;
       totals.app_online_sales += parseFloat(entry.app_online_sales) || 0;
       totals.in_store_sales += parseFloat(entry.in_store_sales || entry['in-store_sales']) || 0;

       // Handle fixed costs array
       if (Array.isArray(entry.fixed_costs)) {
         entry.fixed_costs.forEach(cost => {
           totals.fixed_costs += parseFloat(cost.amount) || 0;
           totals.fixed_costs_percent += parseFloat(cost.percent_of_sales) || 0;
         });
       }

       // Handle variable costs array
       if (Array.isArray(entry.variable_costs)) {
         entry.variable_costs.forEach(cost => {
           totals.variable_costs += parseFloat(cost.amount) || 0;
           totals.variable_costs_percent += parseFloat(cost.percent_of_sales) || 0;
         });
       }
     });

     // Show total costs without dividing by days
     // totals.fixed_costs and totals.variable_costs are already the totals

    return totals;
     }, [tableData, dashboardSummaryData, dashboardData, parseNumericValue]);

  // Render period summary - Optimized for performance
  const renderWeeklySummary = useCallback((categoryKey, totals) => {
    switch (categoryKey) {
      case 'sales_budget':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Sales Budget</div>
              <div className="text-sm font-bold text-blue-900">{formatValue(totals.sales_budget, 'sales_budget')}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Net Sales</div>
              <div className="text-sm font-bold text-green-900">{formatValue(totals.sales_actual, 'sales_actual')}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Tickets</div>
              <div className="text-sm font-bold text-gray-900">{formatNumber(totals.tickets)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Avg Ticket</div>
              <div className="text-sm font-bold text-gray-900">
                {totals.tickets > 0 ? formatValue(totals.sales_actual / totals.tickets, 'sales_actual') : formatValue(0, 'sales_actual')}
              </div>
            </div>
          </div>
        );
      case 'labour':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Labor Budget</div>
              <div className="text-sm font-bold text-blue-900">{formatValue(totals.labour, 'labour')}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Labor Actual</div>
              <div className="text-sm font-bold text-green-900">{formatValue(totals.labour_actual, 'labour_actual')}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Total Hours</div>
              <div className="text-sm font-bold text-gray-900">{formatNumber(totals.hours_actual)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Avg Hourly Rate</div>
              <div className="text-sm font-bold text-gray-900">
                {tableData && tableData.length > 0 ? formatValue(tableData[0].actual_daily_labor_rate, 'actual_daily_labor_rate') : formatValue(0, 'actual_daily_labor_rate')}
              </div>
            </div>
          </div>
        );
      case 'food_cost_actual':
        return 
        // (
        //   <div className="grid grid-cols-2 gap-3">
        //     <div className="text-center">
        //       <div className="text-xs text-gray-600">Total Food Cost Budget</div>
        //       <div className="text-sm font-bold text-blue-900">{formatValue(totals.food_cost, 'food_cost')}</div>
        //     </div>
        //     <div className="text-center">
        //       <div className="text-xs text-gray-600">Total Food Cost Actual</div>
        //       <div className="text-sm font-bold text-green-900">{formatValue(totals.food_cost_actual, 'food_cost_actual')}</div>
        //     </div>
        //   </div>
        // );
             case 'fixedCost':
         return 
        //  (
        //    <div className="text-center">
        //      <div className="text-xs text-gray-600">Total Fixed Cost</div>
        //      <div className="text-sm font-bold text-blue-900">
        //        {printFormat === 'percentage' ? formatValue(totals.fixed_costs_percent, 'fixedCost') : formatValue(totals.fixed_costs, 'fixedCost')}
        //      </div>
        //    </div>
        //  );
       case 'variableCost':
         return
        //   (
        //    <div className="text-center">
        //      <div className="text-xs text-gray-600">Total Variable Cost</div>
        //      <div className="text-sm font-bold text-blue-900">
        //        {printFormat === 'percentage' ? formatValue(totals.variable_costs_percent, 'variableCost') : formatValue(totals.variable_costs, 'variableCost')}
        //      </div>
        //    </div>
        //  );
      default:
        return null;
    }
  }, [formatCurrency, formatNumber, formatValue, printFormat]);

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
    const isClosed = isDayClosed(salesData);
    const salesBudget = parseFloat(salesData.sales_budget) || 0;
    const salesActual = parseFloat(salesData.sales_actual) || 0;
    const appOnlineSales = parseFloat(salesData.app_online_sales) || 0;
    const tickets = parseFloat(salesData.tickets) || 0;
    const avgTicket = parseFloat(salesData.average_ticket) || (tickets > 0 ? salesActual / tickets : 0);
    const amtOverUnder = parseFloat(salesData.sales_amount) || 0;
    const percentOverUnder = parseFloat(salesData.sales_amount_percent) || 0;

    // Handle third party sales using utility functions with percentage support
    // Check if third-party sales data is nested or at root level
    const thirdPartyData = salesData.third_party_Sales || salesData.third_party_sales || salesData;
    const thirdPartyProviders = processThirdPartySalesWithPercentages(
      thirdPartyData, 
      printFormat
    );
    // Try to get total from API first, fallback to calculated total
    const apiTotal = getTotalThirdPartySalesFromAPI(salesData, printFormat);
    const calculatedTotal = getTotalThirdPartySalesByFormat(thirdPartyProviders, printFormat);
    const totalThirdPartySales = apiTotal > 0 ? apiTotal : calculatedTotal;

    const getOverUnderColor = (value) => {
      if (value > 0) return 'text-red-600';
      if (value < 0) return 'text-green-600';
      return 'text-red-600';
    };

    const detailKey = `sales_${salesData.date || salesData.day || 'default'}`;
    const isExpanded = expandedDetails.has(detailKey);

    return (
      <div className={`space-y-4 ${isClosed ? 'opacity-60' : ''}`}>
        {/* Sales Budget */}
        <div className={`flex items-center justify-between p-3 rounded border ${isClosed ? 'bg-gray-100 border-gray-300' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isClosed ? 'text-gray-500' : 'text-blue-600'}`}>💰</span>
            <span className={`text-sm font-semibold ${isClosed ? 'text-gray-600' : 'text-blue-800'}`}>Sales Budget:</span>
          </div>
          <span className={`text-sm font-bold ${isClosed ? 'text-gray-500' : 'text-blue-900'}`}>{formatCurrency(salesBudget)}</span>
        </div>

        {/* Net Sales - Expandable */}
        <div className={`border rounded ${isClosed ? 'border-gray-300' : 'border-gray-200'}`}>
          <div 
            className={`flex items-center justify-between p-3 transition-colors ${isClosed ? 'bg-gray-100 cursor-default' : 'bg-green-50 cursor-pointer hover:bg-green-100'}`}
            onClick={() => !isClosed && toggleDetailExpansion(detailKey)}
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isClosed ? 'text-gray-500' : 'text-green-600'}`}>🛒</span>
              <span className={`text-sm font-semibold ${isClosed ? 'text-gray-600' : 'text-green-800'}`}>Net Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${isClosed ? 'text-gray-500' : 'text-green-900'}`}>{formatCurrency(salesActual)}</span>
              {!isClosed && (
                <button className="text-green-600 hover:text-green-800 transition-colors">
                  {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                </button>
              )}
            </div>
          </div>
          
          {isExpanded && !isClosed && (
            <div className="p-3 bg-white border-t border-gray-200 space-y-3">
              {/* In-Store Sales */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs">🏪</span>
                  <span className="text-xs font-medium text-gray-700">In-Store Sales:</span>
                </div>
                <span className="text-xs font-semibold">
                  {printFormat === 'percentage' 
                    ? formatPercentage(parseFloat(salesData?.percentage_in_store_sales || 0))
                    : formatCurrency(parseFloat(salesData?.in_store_sales || salesData?.['in-store_sales']) || 0)
                  }
                </span>
              </div>

              {/* App/Online Sales */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs">📱</span>
                  <span className="text-xs font-medium text-gray-700">App/Online Sales:</span>
                </div>
                <span className="text-xs font-semibold">
                  {printFormat === 'percentage' 
                    ? formatPercentage(parseFloat(salesData?.percentage_app_online_sales || 0))
                    : formatCurrency(appOnlineSales)
                  }
                </span>
              </div>

              {/* Third Party Sales - Professional Display */}
              {thirdPartyProviders.length > 0 && (
                <div className="border border-gray-200 rounded">
                  <div className="flex items-center justify-between p-2 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs">🚗</span>
                      <span className="text-xs font-medium text-gray-700">Third Party Sales:</span>
                    </div>
                    <span className="text-xs font-semibold">
                      {formatThirdPartySalesValueWithPercentage(totalThirdPartySales, printFormat)}
                    </span>
                  </div>
                  <div className="p-2 bg-white border-t border-gray-200 space-y-2">
                    {thirdPartyProviders.map((provider) => (
                      <div key={provider.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">🚗</span>
                          <span className="text-xs font-medium text-gray-600">{provider.name}:</span>
                        </div>
                        <span className="text-xs font-semibold">
                          {formatThirdPartySalesValueWithPercentage(
                            printFormat === 'percentage' ? provider.percentage : provider.sales, 
                            printFormat
                          )}
                        </span>
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
        <div className={`p-3 rounded border ${isClosed ? 'bg-gray-100 border-gray-300' : 'bg-orange-50 border-orange-200'}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isClosed ? 'text-gray-600' : 'text-gray-700'}`}>Amt Over/Under:</span>
              <span className={`text-xs font-bold ${isClosed ? 'text-gray-500' : getOverUnderColor(amtOverUnder)}`}>
                {formatCurrency(amtOverUnder)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isClosed ? 'text-gray-600' : 'text-gray-700'}`}>% Over/Under:</span>
              <span className={`text-xs font-bold ${isClosed ? 'text-gray-500' : getOverUnderColor(percentOverUnder)}`}>
                {formatPercentage(percentOverUnder)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }, [formatCurrency, formatPercentage, expandedDetails, toggleDetailExpansion, printFormat, isDayClosed]);

  // Render labor details
  const renderLaborDetails = useCallback((laborData) => {
    const isClosed = isDayClosed(laborData);
    const laborBudget = parseFloat(laborData.labour) || 
                       parseFloat(laborData.labor_budget) || 
                       parseFloat(laborData.budgeted_labor_dollars) || 0;
    
    // Use dynamic variable based on format
    const dynamicLaborKey = getDynamicVariableName('labour_actual');
    const laborActual = printFormat === 'percentage' ? 
      parseFloat(laborData[dynamicLaborKey]) || 0 :
      parseFloat(laborData.labour_actual) || 
      parseFloat(laborData.amount) || 
      parseFloat(laborData.actual_labor_dollars) || 0;
    const laborHours = parseFloat(laborData.labor_hours_actual) || 
                      parseFloat(laborData.hours_actual) || 0;
    const averageHourlyRate = parseFloat(laborData.actual_daily_labor_rate) || 0;
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
      <div className={`space-y-4 ${isClosed ? 'opacity-60' : ''}`}>
        {/* Labor Budget */}
        <div className={`flex items-center justify-between p-3 rounded border ${isClosed ? 'bg-gray-100 border-gray-300' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isClosed ? 'text-gray-500' : 'text-blue-600'}`}>💰</span>
            <span className={`text-sm font-semibold ${isClosed ? 'text-gray-600' : 'text-blue-800'}`}>Labor Budget:</span>
          </div>
          <span className={`text-sm font-bold ${isClosed ? 'text-gray-500' : 'text-blue-900'}`}>
            {printFormat === 'percentage' && laborData.percentage_labour
              ? formatPercentage(laborData.percentage_labour)
              : formatValue(laborBudget, 'labour')
            }
          </span>
        </div>

        {/* Labor Actual - Expandable */}
        <div className={`border rounded ${isClosed ? 'border-gray-300' : 'border-gray-200'}`}>
          <div 
            className={`flex items-center justify-between p-3 transition-colors ${isClosed ? 'bg-gray-100 cursor-default' : 'bg-green-50 cursor-pointer hover:bg-green-100'}`}
            onClick={() => !isClosed && toggleDetailExpansion(detailKey)}
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isClosed ? 'text-gray-500' : 'text-green-600'}`}>⏰</span>
              <span className={`text-sm font-semibold ${isClosed ? 'text-gray-600' : 'text-green-800'}`}>Labor Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${isClosed ? 'text-gray-500' : 'text-green-900'}`}>{formatValue(laborActual, 'labour_actual')}</span>
              {!isClosed && (
                <button className="text-green-600 hover:text-green-800 transition-colors">
                  {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                </button>
              )}
            </div>
          </div>
          
          {isExpanded && !isClosed && (
            <div className="p-3 bg-white border-t border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-600">Hours:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold">{formatHours(laborHours)}</span>
                    {printFormat === 'percentage' && laborData.percentage_labour_actual && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-1 py-0.5 rounded">
                        {formatPercentage(laborData.percentage_labour_actual)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-600">Avg Hourly Rate:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold">{formatCurrency(averageHourlyRate)}</span>
                    {printFormat === 'percentage' && laborData.percentage_labour && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-1 py-0.5 rounded">
                        {formatPercentage(laborData.percentage_labour)}
                      </span>
                    )}
                  </div>
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
  }, [formatCurrency, formatPercentage, expandedDetails, toggleDetailExpansion, getDynamicVariableName, printFormat, formatValue]);

  // Render food cost details
  const renderFoodCostDetails = useCallback((foodCostData) => {
    const isClosed = isDayClosed(foodCostData);
    const foodCostBudget = parseFloat(foodCostData.food_cost) || 0;
    
    // Use dynamic variable based on format
    const dynamicFoodCostKey = getDynamicVariableName('food_cost_actual');
    const foodCostActual = printFormat === 'percentage' ? 
      parseFloat(foodCostData[dynamicFoodCostKey]) || 0 :
      parseFloat(foodCostData.food_cost_actual) || 0;
    
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
      <div className={`space-y-4 ${isClosed ? 'opacity-60' : ''}`}>
        {/* Food Cost Budget */}
        <div className={`flex items-center justify-between p-3 rounded border ${isClosed ? 'bg-gray-100 border-gray-300' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isClosed ? 'text-gray-500' : 'text-blue-600'}`}>💰</span>
            <span className={`text-sm font-semibold ${isClosed ? 'text-gray-600' : 'text-blue-800'}`}>Food Cost Budget:</span>
          </div>
          <span className={`text-sm font-bold ${isClosed ? 'text-gray-500' : 'text-blue-900'}`}>
            {printFormat === 'percentage' && foodCostData.percentage_food_cost 
              ? formatPercentage(foodCostData.percentage_food_cost)
              : formatValue(foodCostBudget, 'food_cost')
            }
          </span>
        </div>

        {/* Food Cost Actual - Expandable */}
        <div className={`border rounded ${isClosed ? 'border-gray-300' : 'border-gray-200'}`}>
          <div 
            className={`flex items-center justify-between p-3 transition-colors ${isClosed ? 'bg-gray-100 cursor-default' : 'bg-green-50 cursor-pointer hover:bg-green-100'}`}
            onClick={() => !isClosed && toggleDetailExpansion(detailKey)}
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isClosed ? 'text-gray-500' : 'text-green-600'}`}>🍽️</span>
              <span className={`text-sm font-semibold ${isClosed ? 'text-gray-600' : 'text-green-800'}`}>Food Cost Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${isClosed ? 'text-gray-500' : 'text-green-900'}`}>{formatValue(foodCostActual, 'food_cost_actual')}</span>
              {!isClosed && (
                <button className="text-green-600 hover:text-green-800 transition-colors">
                  {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                </button>
              )}
            </div>
          </div>
          
          {isExpanded && !isClosed && (
            <div className="p-3 bg-white border-t border-gray-200 space-y-3">
              {/* Food Cost Breakdown */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs">🍽️</span>
                  <span className="text-xs font-medium text-gray-700">Total Food Cost:</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold">{formatCurrency(foodCostActual)}</span>
                  {printFormat === 'percentage' && foodCostData.percentage_food_cost_actual && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-1 py-0.5 rounded">
                      {formatPercentage(foodCostData.percentage_food_cost_actual)}
                    </span>
                  )}
                </div>
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
  }, [formatCurrency, formatPercentage, expandedDetails, toggleDetailExpansion, getDynamicVariableName, printFormat, formatValue]);

  // Render fixed cost details
  const renderFixedCostDetails = useCallback((fixedCostData) => {
    const isClosed = isDayClosed(fixedCostData);
    const fixedCosts = Array.isArray(fixedCostData.fixed_costs) ? fixedCostData.fixed_costs : [];
    const totalFixedCost = fixedCosts.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
    const totalFixedCostPercent = fixedCosts.reduce((sum, cost) => sum + parseFloat(cost.percent_of_sales || 0), 0);

    const detailKey = `fixed_${fixedCostData.date || fixedCostData.day || 'default'}`;
    const isExpanded = expandedDetails.has(detailKey);

    return (
      <div className={`space-y-4 ${isClosed ? 'opacity-60' : ''}`}>
        {/* Total Fixed Cost */}
        <div className={`flex items-center justify-between p-3 rounded border ${isClosed ? 'bg-gray-100 border-gray-300' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isClosed ? 'text-gray-500' : 'text-blue-600'}`}>💰</span>
            <span className={`text-sm font-semibold ${isClosed ? 'text-gray-600' : 'text-blue-800'}`}>Total Fixed Cost:</span>
          </div>
          <span className={`text-sm font-bold ${isClosed ? 'text-gray-500' : 'text-blue-900'}`}>
            {printFormat === 'percentage' && fixedCostData.percentage_fixed_cost_total
              ? formatPercentage(fixedCostData.percentage_fixed_cost_total)
              : formatValue(totalFixedCost, 'fixedCost')
            }
          </span>
        </div>

        {/* Fixed Cost Breakdown - Expandable */}
        {fixedCosts.length > 0 ? (
          <div className={`border rounded ${isClosed ? 'border-gray-300' : 'border-gray-200'}`}>
            <div 
              className={`p-3 border-b transition-colors flex items-center justify-between ${isClosed ? 'bg-gray-100 cursor-default' : 'bg-gray-50 cursor-pointer hover:bg-gray-100'}`}
              onClick={() => !isClosed && toggleDetailExpansion(detailKey)}
            >
              <span className={`text-sm font-semibold ${isClosed ? 'text-gray-600' : 'text-gray-800'}`}>Fixed Cost Breakdown</span>
              {!isClosed && (
                <button className="text-gray-600 hover:text-gray-800 transition-colors">
                  {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                </button>
              )}
            </div>
            {isExpanded && !isClosed && (
              <div className="p-3 bg-white space-y-2">
                {fixedCosts.map((cost, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{cost.name || `Fixed Cost ${index + 1}`}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {printFormat === 'percentage' ? formatValue(parseFloat(cost.percent_of_sales || 0), 'fixedCost') : formatValue(parseFloat(cost.amount || 0), 'fixedCost')}
                      </span>
                      {printFormat === 'percentage' && cost.percent_of_sales && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-1 py-0.5 rounded">
                          {formatPercentage(parseFloat(cost.percent_of_sales))}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={`text-center py-4 rounded border ${isClosed ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200'}`}>
            <span className={`text-sm italic ${isClosed ? 'text-gray-400' : 'text-gray-500'}`}>No fixed cost data available</span>
          </div>
        )}
      </div>
    );
  }, [formatCurrency, expandedDetails, toggleDetailExpansion, formatValue, printFormat, isDayClosed]);

  // Render variable cost details
  const renderVariableCostDetails = useCallback((variableCostData) => {
    const isClosed = isDayClosed(variableCostData);
    const variableCosts = Array.isArray(variableCostData.variable_costs) ? variableCostData.variable_costs : [];
    const totalVariableCost = variableCosts.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
    const totalVariableCostPercent = variableCosts.reduce((sum, cost) => sum + parseFloat(cost.percent_of_sales || 0), 0);

    const detailKey = `variable_${variableCostData.date || variableCostData.day || 'default'}`;
    const isExpanded = expandedDetails.has(detailKey);

    return (
      <div className={`space-y-4 ${isClosed ? 'opacity-60' : ''}`}>
        {/* Total Variable Cost */}
        <div className={`flex items-center justify-between p-3 rounded border ${isClosed ? 'bg-gray-100 border-gray-300' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isClosed ? 'text-gray-500' : 'text-blue-600'}`}>💰</span>
            <span className={`text-sm font-semibold ${isClosed ? 'text-gray-600' : 'text-blue-800'}`}>Total Variable Cost:</span>
          </div>
          <span className={`text-sm font-bold ${isClosed ? 'text-gray-500' : 'text-blue-900'}`}>
            {printFormat === 'percentage' && variableCostData.percentage_variable_cost_total
              ? formatPercentage(variableCostData.percentage_variable_cost_total)
              : formatValue(totalVariableCost, 'variableCost')
            }
          </span>
        </div>

        {/* Variable Cost Breakdown - Expandable */}
        {variableCosts.length > 0 ? (
          <div className={`border rounded ${isClosed ? 'border-gray-300' : 'border-gray-200'}`}>
            <div 
              className={`p-3 border-b transition-colors flex items-center justify-between ${isClosed ? 'bg-gray-100 cursor-default' : 'bg-gray-50 cursor-pointer hover:bg-gray-100'}`}
              onClick={() => !isClosed && toggleDetailExpansion(detailKey)}
            >
              <span className={`text-sm font-semibold ${isClosed ? 'text-gray-600' : 'text-gray-800'}`}>Variable Cost Breakdown</span>
              {!isClosed && (
                <button className="text-gray-600 hover:text-gray-800 transition-colors">
                  {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                </button>
              )}
            </div>
            {isExpanded && !isClosed && (
              <div className="p-3 bg-white space-y-2">
                {variableCosts.map((cost, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{cost.name || `Variable Cost ${index + 1}`}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {printFormat === 'percentage' ? formatValue(parseFloat(cost.percent_of_sales || 0), 'variableCost') : formatValue(parseFloat(cost.amount || 0), 'variableCost')}
                      </span>
                      {printFormat === 'percentage' && cost.percent_of_sales && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-1 py-0.5 rounded">
                          {formatPercentage(parseFloat(cost.percent_of_sales))}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={`text-center py-4 rounded border ${isClosed ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200'}`}>
            <span className={`text-sm italic ${isClosed ? 'text-gray-400' : 'text-gray-500'}`}>No variable cost data available</span>
          </div>
        )}
      </div>
    );
  }, [formatCurrency, expandedDetails, toggleDetailExpansion, formatValue, printFormat, isDayClosed]);

  // Render detailed content for expandable rows - Optimized with memoization
  const renderDetailedContent = useCallback((categoryKey, entry) => {
    switch (categoryKey) {
      case 'sales_actual':
        return renderSalesDetails(entry);
      case 'labour_actual':
        return renderLaborDetails(entry);
      case 'food_cost_actual':
        return renderFoodCostDetails(entry);
      case 'fixedCost':
        return renderFixedCostDetails(entry);
      case 'variableCost':
        return renderVariableCostDetails(entry);
      default:
        return null;
    }
  }, [renderSalesDetails, renderLaborDetails, renderFoodCostDetails, renderFixedCostDetails, renderVariableCostDetails, isDayClosed]);

  // Render weekly/monthly detailed content for all periods - Optimized with memoization
  const renderWeeklyDetailedContent = useCallback((categoryKey) => {
    if (!tableData || tableData.length === 0) return null;

    // Use memoized weekly totals
    const weeklyTotals = calculateWeeklyTotals;
    const isWeekly = isWeeklyData(tableData);
    const isMonthly = isMonthlyData(tableData);
    const periodType = isMonthly ? 'Monthly' : (isWeekly ? 'Weekly' : 'Daily');

    return (
      <div className="space-y-3">
        {/* Period Summary */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h5 className="font-semibold text-blue-800 text-sm mb-3">{periodType} Summary</h5>
          {renderWeeklySummary(categoryKey, weeklyTotals)}
        </div>

        {/* Period Breakdown */}
        <div className="flex flex-row gap-4 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {tableData.map((entry, index) => {
            // Determine data format
            let dateField;
            if (isMonthly) {
              dateField = entry.month_start;
            } else if (isWeekly) {
              dateField = entry.week_start;
            } else {
              dateField = entry.date || entry.day;
            }
            
            const dateInfo = formatDateForDisplay(dateField, isWeekly, isMonthly);
            const detailKey = `${categoryKey}_${dateField || index}`;
            
            let periodLabel;
            if (isMonthly) {
              periodLabel = `Month ${index + 1}`;
            } else if (isWeekly) {
              periodLabel = `Week ${index + 1}`;
            } else {
              periodLabel = `Day ${index + 1}`;
            }
            
            const isClosed = isDayClosed(entry);
            return (
              <div key={detailKey} className={`bg-white p-4 rounded-lg border border-gray-200 min-w-[280px] flex-shrink-0 ${isClosed ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                  <h5 className={`font-semibold text-sm ${isClosed ? 'text-gray-500' : 'text-gray-800'} flex items-center gap-2`}>
                    {dateInfo.day} - {dateInfo.fullDate}
                    {isClosed && <span className="text-xs">🔒</span>}
                  </h5>
                  <span className={`text-xs px-2 py-1 rounded ${isClosed ? 'text-gray-400 bg-gray-200' : 'text-gray-500 bg-gray-100'}`}>
                    {periodLabel}
                  </span>
                </div>
                {renderDetailedContent(categoryKey, entry)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [tableData, formatDateForDisplay, renderDetailedContent, calculateWeeklyTotals, renderWeeklySummary, isWeeklyData, isMonthlyData, isDayClosed]);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
        <div>
          <Title level={4} className="mb-0 text-lg sm:text-xl !text-red-600">
          Profit & Loss Dashboard
          </Title>
        </div>
        <Space className="flex sm:flex-row gap-2"> 
        <Tooltip title="Change display format for all values in the dashboard">
          <Dropdown 
            menu={{ 
              items: formatMenuItems,
              onClick: handleFormatChange,
              selectable: true,
              selectedKeys: [printFormat]
            }} 
            trigger={['click']} 
            placement="bottomRight"
          >
            <Button 
              className={`h-9 px-4 bg-orange-500 text-white border-0 hover:bg-orange-600 transition-all duration-200 font-medium rounded-md shadow-sm flex items-center gap-2 ${isFormatChanging ? 'opacity-75' : ''}`}
              size="middle"
              loading={isFormatChanging}
            >
              {!isFormatChanging && <span className="text-sm">{getFormatIcon(printFormat)}</span>}
              <span className="hidden sm:inline">{getFormatDisplayText(printFormat)}</span>
              {!isFormatChanging && <DownOutlined className="ml-1" />}
            </Button>
          </Dropdown>
        </Tooltip>
          <Button 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            className="h-9 px-4 bg-orange-500 text-white border-0 hover:bg-orange-600 transition-all duration-200 font-medium rounded-md shadow-sm flex items-center gap-2"
            size="middle"
          >
            <span className="hidden sm:inline">Print Report</span>
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
            className="h-9 px-4 bg-orange-500 text-white border-0 hover:bg-orange-600 transition-all duration-200 font-medium rounded-md shadow-sm flex items-center gap-2"
            size="middle"
          >
            <span className="hidden sm:inline">Export Data</span>
          </Button>
        </Space>
      </div>

      {/* Desktop table with expandable rows and grouped columns */}
      <div className={`hidden sm:block transition-opacity duration-200 ${isFormatChanging ? 'opacity-50' : 'opacity-100'}`}>
        <Table
          key={`table-${printFormat}-${forceRender}`}
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
                 <div key={`expanded-${record.key}`} className="bg-gray-50 rounded-lg">
                   <h4 className="font-semibold text-gray-800 mb-3">{category.detailLabel}</h4>
                   {renderWeeklyDetailedContent(category.key)}
                 </div>
               );
             }
          }}
        />
      </div>

      {/* Mobile table with expandable cards */}
      <div key={`mobile-${printFormat}-${forceRender}`} className={`block sm:hidden transition-opacity duration-200 ${isFormatChanging ? 'opacity-50' : 'opacity-100'}`}>
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
                    // Determine data format
                    const isWeekly = isWeeklyData(tableData);
                    const isMonthly = isMonthlyData(tableData);
                    
                    let dateField;
                    if (isMonthly) {
                      dateField = entry.month_start;
                    } else if (isWeekly) {
                      dateField = entry.week_start;
                    } else {
                      dateField = entry.date || entry.day;
                    }
                    
                    const dateInfo = formatDateForDisplay(dateField, isWeekly, isMonthly);
                    const uniqueKey = `${dateInfo.fullDate}-${index}`;
                    
                    let dateKey;
                    if (isMonthly) {
                      dateKey = entry.month_start || 'N/A';
                    } else if (isWeekly) {
                      dateKey = entry.week_start || 'N/A';
                    } else {
                      dateKey = entry.date || entry.day || 'N/A';
                    }
                    
                    const rawValue = processedData[row.key]?.[dateKey] || 0;
                    
                    const isClosed = isDayClosed(entry);
                    return (
                      <div key={uniqueKey} className={`flex justify-between text-xs ${isClosed ? 'opacity-50' : ''}`}>
                        <span className={`${isClosed ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-1`}>
                          {dateInfo.day} {dateInfo.date}
                          {isClosed && <span className="text-xs">🔒</span>}
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

