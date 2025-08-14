import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Space, Typography, Card, Row, Col, Spin, Alert } from 'antd';
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import SalesDetailDropdown from './SalesDetailDropdown';
import LaborDetailDropdown from './LaborDetailDropdown';
import FoodCostDetailDropdown from './FoodCostDetailDropdown';
import FixedCostDetailDropdown from './FixedCostDetailDropdown';
import VariableCostDetailDropdown from './VariableCostDetailDropdown';

const { Title, Text } = Typography;

const ProfitLossTableDashboard = ({ dashboardData, dashboardSummaryData, loading, error, viewMode }) => {
  const [tableData, setTableData] = useState([]);
  const [processedData, setProcessedData] = useState({});

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

    let weekEntries = [];
    
    // Extract data based on structure
    if (Array.isArray(dataToProcess.data)) {
      weekEntries = dataToProcess.data;
    } else if (Array.isArray(dataToProcess)) {
      weekEntries = dataToProcess;
    } else if (dataToProcess.daily_entries) {
      weekEntries = dataToProcess.daily_entries;
    }

    if (weekEntries.length === 0) {
      setTableData([]);
      setProcessedData({});
      return;
    }

    // Process the data - Updated to match new API response structure with profit columns
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

    weekEntries.forEach((entry) => {
      // Use full date as key for better data organization
      const dateKey = entry.date || entry.day || 'N/A';
      
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
    setTableData(weekEntries);
  }, [dashboardData, dashboardSummaryData, parseNumericValue]);

  // Categories for the summary table - Updated to remove profit columns as separate rows
  const categories = useMemo(() => [
    { key: 'sales_budget', label: 'Sales Budget', type: 'currency' },
    { key: 'labour', label: 'Labor', type: 'number' },
    { key: 'food_cost', label: 'Food Cost', type: 'currency' },
    { key: 'fixedCost', label: 'Fixed Cost', type: 'currency' },
    { key: 'variableCost', label: 'Variable Cost', type: 'currency' },
    { key: 'profit_loss', label: 'Profit & Loss', type: 'currency' },
 
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

  // Format date for display
  const formatDateForDisplay = useCallback((dateString) => {
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
  }, []);

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



  // Table columns configuration
  const tableColumns = useMemo(() => [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 180,
      fixed: 'left',
      render: (text) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 text-sm">{text}</span>
        </div>
      ),
      responsive: ['md']
    },
    ...tableData.map((entry, index) => {
      const dateInfo = formatDateForDisplay(entry.date || entry.day);
      const uniqueKey = `${dateInfo.fullDate}-${index}`;
      
      return {
        title: (
          <div className="text-start">
            <div className="font-semibold text-xs text-gray-800">
              {dateInfo.day}
            </div>
            { viewMode === 'monthly' && (
              <div className="text-xs text-gray-600">
                {dateInfo.date}
              </div>
            )}
            {/* <div className="text-xs text-gray-600">
              {dateInfo.date}
            </div> */}
          </div>
        ),
        dataIndex: uniqueKey,
        key: uniqueKey,
        width: 120,
        
                 render: (value, record) => {
           const categoryKey = record.key;
           const dateKey = entry.date || entry.day || 'N/A';
           const rawValue = processedData[categoryKey]?.[dateKey] || 0;
           
           
          
                     // Check if the original value was None/null/undefined
           // For fixed cost and variable cost, we calculate from arrays, so check the calculated value
           let originalValue, displayValue;
           if (categoryKey === 'fixedCost' || categoryKey === 'variableCost') {
             // For calculated fields, use the rawValue directly
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
                dayName: formatDateForDisplay(dateKey).day,
                date: formatDateForDisplay(dateKey).fullDate
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
                 dayName: formatDateForDisplay(dateKey).day,
                 date: formatDateForDisplay(dateKey).fullDate
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
                 dayName: formatDateForDisplay(dateKey).day,
                 date: formatDateForDisplay(dateKey).fullDate
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
                 dayName: formatDateForDisplay(dateKey).day,
                 date: formatDateForDisplay(dateKey).fullDate
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
                dayName: formatDateForDisplay(dateKey).day,
                date: formatDateForDisplay(dateKey).fullDate
              };
              
              return (
                <div className="flex items-start justify-start">
                    <span 
                      className="text-sm text-gray-700 flex items-center gap-1 "
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
        }
      };
    })
  ], [tableData, processedData, formatCurrency, formatNumber, getProfitLossColor, formatDateForDisplay, handleValue, formatProfitLoss, formatPercentage, getPercentageColor]);

  // Table data source
  const tableDataSource = useMemo(() => 
    categories.map(category => ({
      key: category.key,
      category: category.label,
      ...tableData.reduce((acc, entry, index) => {
        const dateInfo = formatDateForDisplay(entry.date || entry.day);
        const uniqueKey = `${dateInfo.fullDate}-${index}`;
        const dateKey = entry.date || entry.day || 'N/A';
        acc[uniqueKey] = processedData[category.key]?.[dateKey] || 0;
        return acc;
      }, {})
    })), [categories, tableData, processedData, formatDateForDisplay]);

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
          <Title level={4} className="mb-0 text-lg sm:text-xl">
          Profit & Loss Dashboard
          </Title>
        </div>
        <Space className="flex sm:flex-row gap-2">
          <Button 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            className="flex items-center text-xs sm:text-sm"
            size="small"
          >
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExport}
            className="flex items-center text-xs sm:text-sm"
            size="small"
          >
            <span className="hidden sm:inline">Export</span>
          </Button>
        </Space>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <Table
          columns={tableColumns}
          dataSource={tableDataSource}
          pagination={false}
          scroll={{ x: 'max-content' }}
          className="summary-table"
          rowKey="key"
          size="small"
        />
      </div>

      {/* Mobile table */}
      <div className="block sm:hidden">
        <div className="space-y-4">
          {tableDataSource.map((row) => (
            <Card key={row.key} size="small" className="shadow-sm !mb-4">
              <div className="font-semibold text-gray-800 mb-3 border-b pb-2">
                {row.category}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {tableData.map((entry, index) => {
                  const dateInfo = formatDateForDisplay(entry.date || entry.day);
                  const uniqueKey = `${dateInfo.fullDate}-${index}`;
                  const dateKey = entry.date || entry.day || 'N/A';
                                     const rawValue = processedData[row.key]?.[dateKey] || 0;
                   let originalValue, displayValue;
                   if (row.key === 'fixedCost' || row.key === 'variableCost') {
                     // For calculated fields, use the rawValue directly
                     displayValue = rawValue > 0 ? rawValue.toString() : '-';
                   } else {
                     originalValue = entry[row.key];
                     displayValue = handleValue(originalValue);
                   }
                  
                  // Get profit percentage for inline display
                  let profitPercentage = null;
                  if (row.key === 'sales_budget' && entry.sales_budeget_profit) {
                    profitPercentage = formatPercentage(entry.sales_budeget_profit);
                  } else if (row.key === 'labour' && entry.labour_profit) {
                    profitPercentage = formatPercentage(entry.labour_profit);
                  } else if (row.key === 'food_cost' && entry.food_cost_profit) {
                    profitPercentage = formatPercentage(entry.food_cost_profit);
                  }
                  
                  return (
                    <div key={uniqueKey} className="flex justify-between text-xs">
                      <span className="text-gray-600">
                        {dateInfo.day} {dateInfo.date}
                      </span>
                                              <div className="flex items-center">
                          {row.key === 'sales_budget' && rawValue > 0 ? (
                            <SalesDetailDropdown 
                              dayData={{
                                dayName: dateInfo.day,
                                date: dateInfo.fullDate
                              }} 
                              salesData={entry}
                            >
                              <span 
                                className={`font-medium ${
                                  displayValue === '-' ? 'text-gray-500' :
                                  row.key === 'profit_loss'
                                    ? getProfitLossColor(rawValue) : 'text-gray-600'
                                } cursor-pointer hover:text-blue-600 hover:underline flex items-center gap-1`}
                                title="Click to view sales details"
                              >
                                {displayValue === '-' ? '-' :
                                 row.key === 'profit_loss'
                                   ? formatProfitLoss(rawValue)
                                   : row.key === 'sales_budget' || row.key === 'food_cost' || 
                                     row.key === 'amount' || row.key === 'average_hourly_rate'
                                   ? formatCurrency(rawValue)
                                   : row.key === 'labour' || row.key === 'hours'
                                   ? formatNumber(rawValue)
                                   : rawValue
                                }
                                <span className="text-xs text-blue-500 opacity-60">ⓘ</span>
                              </span>
                            </SalesDetailDropdown>
                          ) : row.key === 'labour' && rawValue > 0 ? (
                            <LaborDetailDropdown 
                              dayData={{
                                dayName: dateInfo.day,
                                date: dateInfo.fullDate
                              }} 
                              laborData={entry}
                            >
                              <span 
                                className={`font-medium ${
                                  displayValue === '-' ? 'text-gray-500' : 'text-gray-600'
                                } cursor-pointer hover:text-blue-600 hover:underline flex items-center gap-1`}
                                title="Click to view labor details"
                              >
                                {displayValue === '-' ? '-' : formatNumber(rawValue)}
                                <span className="text-xs text-blue-500 opacity-60">ⓘ</span>
                              </span>
                            </LaborDetailDropdown>
                                                     ) : row.key === 'food_cost' && rawValue > 0 ? (
                             <FoodCostDetailDropdown 
                               dayData={{
                                 dayName: dateInfo.day,
                                 date: dateInfo.fullDate
                               }} 
                               foodCostData={entry}
                             >
                               <span 
                                 className={`font-medium ${
                                   displayValue === '-' ? 'text-gray-500' : 'text-gray-600'
                                 } cursor-pointer hover:text-blue-600 hover:underline flex items-center gap-1`}
                                 title="Click to view food cost details"
                               >
                                 {displayValue === '-' ? '-' : formatCurrency(rawValue)}
                                 <span className="text-xs text-blue-500 opacity-60">ⓘ</span>
                               </span>
                             </FoodCostDetailDropdown>
                                                       ) : row.key === 'fixedCost' ? (
                              rawValue > 0 ? (
                                <FixedCostDetailDropdown 
                                  dayData={{
                                    dayName: dateInfo.day,
                                    date: dateInfo.fullDate
                                  }} 
                                  fixedCostData={entry}
                                >
                                  <span 
                                    className={`font-medium ${
                                      displayValue === '-' ? 'text-gray-500' : 'text-gray-600'
                                    } cursor-pointer hover:text-blue-600 hover:underline flex items-center gap-1`}
                                    title="Click to view fixed cost details"
                                  >
                                    {displayValue === '-' ? '-' : formatCurrency(rawValue)}
                                    <span className="text-xs text-blue-500 opacity-60">ⓘ</span>
                                  </span>
                                </FixedCostDetailDropdown>
                              ) : (
                                <span 
                                  className={`font-medium ${
                                    displayValue === '-' ? 'text-gray-500' : 'text-gray-600'
                                  }`}
                                >
                                  {displayValue === '-' ? '-' : formatCurrency(rawValue)}
                                </span>
                              )
                                                         ) : row.key === 'variableCost' ? (
                               rawValue > 0 ? (
                                 <VariableCostDetailDropdown 
                                   dayData={{
                                     dayName: dateInfo.day,
                                     date: dateInfo.fullDate
                                   }} 
                                   variableCostData={entry}
                                 >
                                   <span 
                                     className={`font-medium ${
                                       displayValue === '-' ? 'text-gray-500' : 'text-gray-600'
                                     } cursor-pointer hover:text-blue-600 hover:underline flex items-center gap-1`}
                                     title="Click to view variable cost details"
                                   >
                                     {displayValue === '-' ? '-' : formatCurrency(rawValue)}
                                     <span className="text-xs text-blue-500 opacity-60">ⓘ</span>
                                   </span>
                                 </VariableCostDetailDropdown>
                               ) : (
                                 <span 
                                   className={`font-medium ${
                                     displayValue === '-' ? 'text-gray-500' : 'text-gray-600'
                                   }`}
                                 >
                                   {displayValue === '-' ? '-' : formatCurrency(rawValue)}
                                 </span>
                               )
                           ) : (
                            <span 
                              className={`font-medium ${
                                displayValue === '-' ? 'text-gray-500' :
                                row.key === 'profit_loss'
                                  ? getProfitLossColor(rawValue) : 'text-gray-600'
                              }`}
                            >
                              {displayValue === '-' ? '-' :
                               row.key === 'profit_loss'
                                 ? formatProfitLoss(rawValue)
                                 : row.key === 'sales_budget' || row.key === 'food_cost' || 
                                   row.key === 'amount' || row.key === 'average_hourly_rate'
                                 ? formatCurrency(rawValue)
                                 : row.key === 'labour' || row.key === 'hours'
                                 ? formatNumber(rawValue)
                                 : rawValue
                              }
                            </span>
                          )}
                         {profitPercentage && (
                           <span className={`text-xs ml-1 ${getPercentageColor(entry.sales_budeget_profit || entry.labour_profit || entry.food_cost_profit)} font-bold`}>
                             {profitPercentage}
                           </span>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
             </Card>
           ))}
         </div>
       </div>
     </Card>
   );
 };

export default ProfitLossTableDashboard;

