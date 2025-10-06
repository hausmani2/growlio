import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Space, Typography, Card, Row, Col, Spin, Alert } from 'antd';
import { PrinterOutlined, DownloadOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import SalesDataModal from './SalesDataModal';

const { Title, Text } = Typography;

const SummaryTableDashboard = ({ dashboardData, dashboardSummaryData, loading, error, viewMode, groupBy, onDataRefresh, onPrint }) => {
  const [tableData, setTableData] = useState([]);
  const [processedData, setProcessedData] = useState({});
  const [dataTimestamp, setDataTimestamp] = useState(Date.now());
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedWeekForEdit, setSelectedWeekForEdit] = useState(null);

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

  // Helper function to get month display name from data
  const getMonthDisplayName = useCallback(() => {
    if (!tableData || tableData.length === 0) return '';
    
    try {
      const firstEntry = tableData[0];
      // Check for monthly data structure
      if (firstEntry.month_start) {
        const startDate = dayjs(firstEntry.month_start);
        return startDate.format('MMMM YYYY');
      }
      // Fallback to date/day fields
      const firstDate = firstEntry.date || firstEntry.day;
      if (firstDate) {
        const date = dayjs(firstDate);
        return date.format('MMMM YYYY');
      }
    } catch (error) {
      console.error('Error formatting month display:', error);
    }
    return '';
  }, [tableData]);

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

    // Extract total_days from the first entry (since it's in each entry, not at response level)
    let totalDays = 1; // Default to 1 if not provided
    if (weekEntries.length > 0) {
      const firstEntry = weekEntries[0];
      totalDays = parseNumericValue(firstEntry.total_days) || 1;
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
      fixed_cost: {},
      variable_cost: {},
      profit_loss: {},
      budgeted_profit_loss: {}
    };

    weekEntries.forEach((entry) => {
      // Use appropriate key based on data structure
      let dateKey;
      if (entry.month_start) {
        // Monthly data structure
        dateKey = entry.month_start;
      } else {
        // Daily data structure
        dateKey = entry.date || entry.day || 'N/A';
      }
      
      
      processed.sales_budget[dateKey] = parseNumericValue(entry.sales_budget);
      processed.labour[dateKey] = parseNumericValue(entry.labour);
      processed.food_cost[dateKey] = parseNumericValue(entry.food_cost);
      processed.hours[dateKey] = parseNumericValue(entry.hours);
      processed.amount[dateKey] = parseNumericValue(entry.amount);
      processed.average_hourly_rate[dateKey] = parseNumericValue(entry.average_hourly_rate);
      
       // Handle fixed_costs array structure and divide by total days
       let fixedCostTotal = 0;
       if (entry.fixed_costs && Array.isArray(entry.fixed_costs)) {
         fixedCostTotal = entry.fixed_costs.reduce((sum, cost) => {
           const costAmount = parseNumericValue(cost.amount);
           return sum + costAmount;
         }, 0);
       } else {
         fixedCostTotal = parseNumericValue(entry.fixed_cost);
       }
       // Store the per-day fixed cost (divided by total days) in the main fixed_cost field
       const fixedCostPerDay = fixedCostTotal / totalDays;
       processed.fixed_cost[dateKey] = fixedCostPerDay;
       
       // Handle variable_costs array structure and divide by total days
       let variableCostTotal = 0;
       if (entry.variable_costs && Array.isArray(entry.variable_costs)) {
         variableCostTotal = entry.variable_costs.reduce((sum, cost) => sum + parseNumericValue(cost.amount), 0);
       } else {
         variableCostTotal = parseNumericValue(entry.variable_cost);
       }
       // Store the per-day variable cost (divided by total days) in the main variable_cost field
       const variableCostPerDay = variableCostTotal / totalDays;
       processed.variable_cost[dateKey] = variableCostPerDay;
      
      processed.budgeted_profit_loss[dateKey] = parseNumericValue(entry.budgeted_profit_loss);
    });

    setProcessedData(processed);
    setTableData(weekEntries);
    setDataTimestamp(Date.now()); // Force re-render
    

    

  }, [dashboardData, dashboardSummaryData, parseNumericValue]);

  // Categories for the summary table - Updated to remove profit columns as separate rows
  const categories = useMemo(() => [
    { key: 'sales_budget', label: 'Sales Budget', type: 'currency' },
    { key: 'labour', label: 'Labor Budget', type: 'currency' },
    { key: 'hours', label: 'Hours', type: 'number' },
    { key: 'average_hourly_rate', label: 'Average Hourly Rate', type: 'currency' },
    { key: 'food_cost', label: 'Food Cost', type: 'currency' },
    { key: 'fixed_cost', label: 'Fixed Cost (Per Day)', type: 'currency' },
    { key: 'variable_cost', label: 'Variable Cost (Per Day)', type: 'currency' },
    { key: 'budgeted_profit_loss', label: 'Profit/Loss', type: 'currency' },
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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

  // Print handler - use the passed onPrint function
  const handlePrint = useCallback(() => {
    if (onPrint) {
      onPrint();
    }
  }, [onPrint]);

  // Edit handler
  const handleEdit = useCallback(() => {
    if (!tableData || tableData.length === 0) {
      return;
    }

    // Get the first entry to determine the week start date
    const firstEntry = tableData[0];
    let startDate;
    
    if (firstEntry.month_start) {
      // For monthly data, use the month start date
      startDate = dayjs(firstEntry.month_start);
    } else {
      // For daily data, find the earliest date
      const dates = tableData.map(entry => dayjs(entry.date || entry.day)).filter(Boolean);
      if (dates.length > 0) {
        startDate = dates.reduce((earliest, current) => current.isBefore(earliest) ? current : earliest);
      } else {
        startDate = dayjs();
      }
    }

    // Create week data for the edit modal
    const weekData = {
      startDate: startDate.format('YYYY-MM-DD'),
      weekNumber: startDate.week(),
      dailyData: tableData.map(entry => {
        let entryDate;
        if (entry.month_start) {
          entryDate = dayjs(entry.month_start);
        } else {
          entryDate = dayjs(entry.date || entry.day);
        }

        return {
          key: `day-${entryDate.format('YYYY-MM-DD')}`,
          date: entryDate, // This is already a dayjs object
          dayName: entryDate.format('dddd'),
          budgetedSales: parseNumericValue(entry.sales_budget),
          actualSalesInStore: parseNumericValue(entry.actual_sales_in_store),
          actualSalesAppOnline: parseNumericValue(entry.actual_sales_app_online),
          dailyTickets: parseNumericValue(entry.daily_tickets),
          restaurant_open: entry.restaurant_open === 1 || entry.restaurant_open === true ? 1 : 0,
          // Add any other fields that might be present, but ensure date is a dayjs object
          ...Object.fromEntries(
            Object.entries(entry).filter(([key, value]) => key !== 'date' && key !== 'day')
          )
        };
      })
    };


    
    setSelectedWeekForEdit(weekData);
    setIsEditModalVisible(true);
  }, [tableData, parseNumericValue]);

  // Handle edit modal close
  const handleEditModalClose = useCallback(() => {
    setIsEditModalVisible(false);
    setSelectedWeekForEdit(null);
  }, []);

  // Handle data saved from edit modal
  const handleEditDataSaved = useCallback(() => {
    if (onDataRefresh) {
      onDataRefresh();
    }
    handleEditModalClose();
  }, [onDataRefresh, handleEditModalClose]);

  // Check if we have data
  const hasData = tableData.length > 0;
  const dataToProcess = dashboardSummaryData || dashboardData;
  const isFailStatus = dataToProcess?.status === 'fail';

  // Determine if we're in monthly view
  const isMonthlyView = viewMode === 'monthly' || groupBy === 'month' || dataToProcess?.group_by === 'month';
  const monthDisplayName = getMonthDisplayName();

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
      let dateInfo, uniqueKey, dateKey;
      
      // Handle monthly data structure
      if (entry.month_start) {
        const startDate = dayjs(entry.month_start);
        dateInfo = {
          day: startDate.format('MMM'),
          date: startDate.format('YYYY'),
          fullDate: startDate.format('MMMM YYYY')
        };
        uniqueKey = `month-${entry.month_start}-${index}`;
        dateKey = entry.month_start;
      } else {
        // Handle daily data structure
        dateInfo = formatDateForDisplay(entry.date || entry.day);
        uniqueKey = `${dateInfo.fullDate}-${index}`;
        dateKey = entry.date || entry.day || 'N/A';
      }
      
      return {
        title: (
          <div className="text-start">
            <div className="font-semibold text-xs text-gray-800">
              {dateInfo.day}
            </div>
            { isMonthlyView ? (
              <div className="text-xs text-gray-600">
                {dateInfo.date}
              </div>
            ) : (
              <div className="text-xs text-gray-600">
                {dateInfo.date}
              </div>
            )}
          </div>
        ),
        dataIndex: uniqueKey,
        key: uniqueKey,
        width: 120,
        
        render: (value, record) => {
          const categoryKey = record.key;
          const rawValue = processedData[categoryKey]?.[dateKey] || 0;
          
          
          // For fixed_cost and variable_cost, we need to check if we have any cost data to display
          let shouldDisplay = true;
          if (categoryKey === 'fixed_cost') {
            // Check if we have any fixed cost data (either from array or direct field)
            const hasFixedCosts = entry.fixed_costs && Array.isArray(entry.fixed_costs) && entry.fixed_costs.length > 0;
            const hasFixedCost = entry.fixed_cost && entry.fixed_cost !== 'None' && entry.fixed_cost !== null && entry.fixed_cost !== undefined;
            shouldDisplay = hasFixedCosts || hasFixedCost;
          } else if (categoryKey === 'variable_cost') {
            // Check if we have any variable cost data (either from array or direct field)
            const hasVariableCosts = entry.variable_costs && Array.isArray(entry.variable_costs) && entry.variable_costs.length > 0;
            const hasVariableCost = entry.variable_cost && entry.variable_cost !== 'None' && entry.variable_cost !== null && entry.variable_cost !== undefined;
            shouldDisplay = hasVariableCosts || hasVariableCost;
          } else {
            // Check if the original value was None/null/undefined for other fields
            const originalValue = entry[categoryKey];
            const displayValue = handleValue(originalValue);
            shouldDisplay = displayValue !== '-';
          }
          
          if (!shouldDisplay) {
            return <span className="text-xs text-gray-500">-</span>;
          }
          

          
          // Handle currency fields
          if (categoryKey === 'sales_budget' || categoryKey === 'labour' || categoryKey === 'food_cost' || 
              categoryKey === 'amount' || categoryKey === 'average_hourly_rate' || 
              categoryKey === 'fixed_cost' || categoryKey === 'variable_cost' ||
              categoryKey === 'budgeted_profit_loss') {
            const colorClass = categoryKey === 'budgeted_profit_loss' ? getProfitLossColor(rawValue) : 'text-gray-700';
            const formattedValue = categoryKey === 'budgeted_profit_loss' ? formatProfitLoss(rawValue) : formatCurrency(rawValue);
            
            return (
              <div className="flex items-start justify-start">
                <span className={`text-sm ${colorClass}`}>{formattedValue}</span>
              </div>
            );
          }
          // Handle number fields
          if (categoryKey === 'hours') {
            return (
              <div className="flex items-start justify-start">
                <span className="text-sm text-gray-700">{formatNumber(rawValue)}</span>

              </div>
            );
          }
          return <span className="text-sm text-gray-700">{rawValue}</span>;
        }
      };
    })
  ], [tableData, processedData, formatCurrency, formatNumber, getProfitLossColor, formatDateForDisplay, handleValue, formatProfitLoss, formatPercentage, getPercentageColor, isMonthlyView]);

  // Table data source
  const tableDataSource = useMemo(() => 
    categories.map(category => ({
      key: category.key,
      category: category.label,
      ...tableData.reduce((acc, entry, index) => {
        let uniqueKey, dateKey;
        
        // Handle monthly data structure
        if (entry.month_start) {
          uniqueKey = `month-${entry.month_start}-${index}`;
          dateKey = entry.month_start;
        } else {
          // Handle daily data structure
          const dateInfo = formatDateForDisplay(entry.date || entry.day);
          uniqueKey = `${dateInfo.fullDate}-${index}`;
          dateKey = entry.date || entry.day || 'N/A';
        }
        
        acc[uniqueKey] = processedData[category.key]?.[dateKey] || 0;
        return acc;
      }, {})
    })), [categories, tableData, processedData, formatDateForDisplay]);
  
  

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
    <Card key={`dashboard-${dataTimestamp}`} className="shadow-lg border-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-gray-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-orange-600 mb-0">
              {viewMode === 'monthly' && monthDisplayName ? `Budget Dashboard - ${monthDisplayName}` : "Budget Dashboard"}
          </h2>
          {dataToProcess?.total_days && (
            <p className="text-sm text-gray-600 mt-1">
              Fixed and Variable costs calculated per day (Total days: {dataToProcess.total_days})
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            icon={<EditOutlined />} 
            onClick={handleEdit}
            size="middle"
            disabled={!hasData}
            className="h-9 px-4 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 font-normal rounded-lg flex items-center gap-2"
          >
            <span className="hidden sm:inline">Edit Sales Data</span>
          </Button>
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
                  let dateInfo, uniqueKey, dateKey;
                  
                  // Handle monthly data structure
                  if (entry.month_start) {
                    const startDate = dayjs(entry.month_start);
                    dateInfo = {
                      day: startDate.format('MMM'),
                      date: startDate.format('YYYY'),
                      fullDate: startDate.format('MMMM YYYY')
                    };
                    uniqueKey = `month-${entry.month_start}-${index}`;
                    dateKey = entry.month_start;
                  } else {
                    // Handle daily data structure
                    dateInfo = formatDateForDisplay(entry.date || entry.day);
                    uniqueKey = `${dateInfo.fullDate}-${index}`;
                    dateKey = entry.date || entry.day || 'N/A';
                  }
                  
                  const rawValue = processedData[row.key]?.[dateKey] || 0;
                  
                   // For fixed_cost and variable_cost, we need to check if we have any cost data to display
                   let shouldDisplay = true;
                   if (row.key === 'fixed_cost') {
                     // Check if we have any fixed cost data (either from array or direct field)
                     const hasFixedCosts = entry.fixed_costs && Array.isArray(entry.fixed_costs) && entry.fixed_costs.length > 0;
                     const hasFixedCost = entry.fixed_cost && entry.fixed_cost !== 'None' && entry.fixed_cost !== null && entry.fixed_cost !== undefined;
                     shouldDisplay = hasFixedCosts || hasFixedCost;
                   } else if (row.key === 'variable_cost') {
                     // Check if we have any variable cost data (either from array or direct field)
                     const hasVariableCosts = entry.variable_costs && Array.isArray(entry.variable_costs) && entry.variable_costs.length > 0;
                     const hasVariableCost = entry.variable_cost && entry.variable_cost !== 'None' && entry.variable_cost !== null && entry.variable_cost !== undefined;
                     shouldDisplay = hasVariableCosts || hasVariableCost;
                   } else {
                     // Check if the original value was None/null/undefined for other fields
                     const originalValue = entry[row.key];
                     const displayValue = handleValue(originalValue);
                     shouldDisplay = displayValue !== '-';
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
                        <span className={`font-medium ${
                          !shouldDisplay ? 'text-gray-500' :
                          row.key === 'budgeted_profit_loss'
                            ? getProfitLossColor(rawValue) : 'text-gray-600'
                        }`}>
                          {!shouldDisplay ? '-' :
                           row.key === 'budgeted_profit_loss'
                            ? formatProfitLoss(rawValue)
                            : row.key === 'sales_budget' || row.key === 'labour' || row.key === 'food_cost' || 
                              row.key === 'amount' || row.key === 'average_hourly_rate' ||
                              row.key === 'fixed_cost' || row.key === 'variable_cost'
                            ? formatCurrency(rawValue)
                            : row.key === 'hours'
                            ? formatNumber(rawValue)
                            : rawValue
                          }
                        </span>
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

      {/* Edit Sales Data Modal */}
      <SalesDataModal
        visible={isEditModalVisible}
        onCancel={handleEditModalClose}
        selectedWeekData={selectedWeekForEdit}
        onDataSaved={handleEditDataSaved}
        autoOpenFromSummary={true}
      />

    </Card>
  );
};

export default SummaryTableDashboard;

