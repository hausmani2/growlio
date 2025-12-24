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

  // Helper function to get week start date for title
  const getWeekStartDate = useCallback(() => {
    if (!tableData || tableData.length === 0) return '';
    
    try {
      // Check if this is monthly data by looking for month_start field
      const hasMonthlyData = tableData.some(entry => entry.month_start);
      if (hasMonthlyData) return '';
      
      // Find the earliest date in the data
      const dates = tableData
        .map(entry => entry.date || entry.day)
        .filter(Boolean)
        .map(dateStr => dayjs(dateStr))
        .filter(date => date.isValid());
      
      if (dates.length === 0) return '';
      
      // Get the earliest date (week start)
      const weekStart = dates.reduce((earliest, current) => 
        current.isBefore(earliest) ? current : earliest
      );
      
      return weekStart.format('MMM DD, YYYY');
    } catch (error) {
      console.error('Error formatting week start date:', error);
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
      
       // Handle fixed_costs - use raw API values without calculation
       let fixedCostTotal = 0;
       // First try to get from direct API fields
       if (entry.fixed_cost_total !== undefined && entry.fixed_cost_total !== null && entry.fixed_cost_total !== 'None') {
         fixedCostTotal = parseNumericValue(entry.fixed_cost_total);
       } else if (entry.budgeted_fixed_cost_total !== undefined && entry.budgeted_fixed_cost_total !== null && entry.budgeted_fixed_cost_total !== 'None') {
         fixedCostTotal = parseNumericValue(entry.budgeted_fixed_cost_total);
       } else if (entry.fixed_costs && Array.isArray(entry.fixed_costs)) {
         // Fallback to array structure
         fixedCostTotal = entry.fixed_costs.reduce((sum, cost) => {
           const costAmount = parseNumericValue(cost.amount);
           return sum + costAmount;
         }, 0);
       } else {
         // Final fallback to direct field
         fixedCostTotal = parseNumericValue(entry.fixed_cost);
       }
       // Store the raw fixed cost value (no division by total days)
       processed.fixed_cost[dateKey] = fixedCostTotal;
       
       // Handle variable_costs - use raw API values without calculation
       let variableCostTotal = 0;
       // First try to get from direct API fields
       if (entry.variable_cost_total !== undefined && entry.variable_cost_total !== null && entry.variable_cost_total !== 'None') {
         variableCostTotal = parseNumericValue(entry.variable_cost_total);
       } else if (entry.budgeted_variable_cost_total !== undefined && entry.budgeted_variable_cost_total !== null && entry.budgeted_variable_cost_total !== 'None') {
         variableCostTotal = parseNumericValue(entry.budgeted_variable_cost_total);
       } else if (entry.variable_costs && Array.isArray(entry.variable_costs)) {
         // Fallback to array structure
         variableCostTotal = entry.variable_costs.reduce((sum, cost) => sum + parseNumericValue(cost.amount), 0);
       } else {
         // Final fallback to direct field
         variableCostTotal = parseNumericValue(entry.variable_cost);
       }
       // Store the raw variable cost value (no division by total days)
       processed.variable_cost[dateKey] = variableCostTotal;
      
      processed.budgeted_profit_loss[dateKey] = parseNumericValue(entry.budgeted_profit_loss);
    });

    setProcessedData(processed);
    setTableData(weekEntries);
    setDataTimestamp(Date.now()); // Force re-render
    

    

  }, [dashboardData, dashboardSummaryData, parseNumericValue]);

  // Categories for the summary table - Updated to match image design
  const categories = useMemo(() => [
    { key: 'sales_budget', label: 'Sales Goal', type: 'currency', bgColor: 'bg-green-100' },
    { key: 'labour', label: 'Labor Budget', type: 'currency', bgColor: 'bg-yellow-100' },
    { key: 'hours', label: 'Hours', type: 'number', bgColor: 'bg-yellow-100' },
    { key: 'average_hourly_rate', label: 'Avg Hourly Rate', type: 'currency', bgColor: 'bg-yellow-100' },
    { key: 'food_cost', label: 'COGs Budget', type: 'currency', bgColor: 'bg-purple-100' },
    { key: 'operating_expenses', label: 'Operating Expenses', type: 'currency', bgColor: 'bg-blue-100' },
    { key: 'budgeted_profit_loss', label: 'Profit/Loss', type: 'currency', bgColor: 'bg-white' },
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

  // Calculate totals for each category
  const calculateTotals = useCallback(() => {
    const totals = {};
    categories.forEach(category => {
      let total = 0;
      
      // Average hourly rate should be the same value (not a sum) - use first day's value
      if (category.key === 'average_hourly_rate') {
        if (tableData.length > 0) {
          const firstEntry = tableData[0];
          const dateKey = firstEntry.month_start || firstEntry.date || firstEntry.day || 'N/A';
          total = processedData[category.key]?.[dateKey] || 0;
        }
      } else {
        tableData.forEach(entry => {
          const dateKey = entry.month_start || entry.date || entry.day || 'N/A';
          let value = 0;
          if (category.key === 'operating_expenses') {
            // Combine fixed_cost and variable_cost for operating expenses
            const fixedCost = processedData['fixed_cost']?.[dateKey] || 0;
            const variableCost = processedData['variable_cost']?.[dateKey] || 0;
            value = fixedCost + variableCost;
          } else {
            value = processedData[category.key]?.[dateKey] || 0;
          }
          total += value;
        });
      }
      totals[category.key] = total;
    });
    return totals;
  }, [categories, tableData, processedData]);

  const totals = calculateTotals();

  // Formatting utilities
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
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(value || 0));
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
        shortDate: date.format('M/D'), // For "Mon 12/8" format
        fullDate: date.format('MMM DD, YYYY')
      };
    } catch {
      return {
        day: 'N/A',
        date: 'N/A',
        shortDate: 'N/A',
        fullDate: 'N/A'
      };
    }
  }, []);

  // Table data source - Redesigned: dates as rows, categories as columns
  // Moved before generateCSV to fix initialization order
  const tableDataSource = useMemo(() => {
    const rows = tableData.map((entry, index) => {
      let dateInfo, dateKey;
      
      // Handle monthly data structure
      if (entry.month_start) {
        const startDate = dayjs(entry.month_start);
        dateInfo = {
          day: startDate.format('MMM'),
          date: startDate.format('YYYY'),
          shortDate: startDate.format('M/D'),
          fullDate: startDate.format('MMMM YYYY')
        };
        dateKey = entry.month_start;
      } else {
        // Handle daily data structure
        dateInfo = formatDateForDisplay(entry.date || entry.day);
        dateKey = entry.date || entry.day || 'N/A';
      }
      
      const rowData = {
        key: `day-${dateKey}-${index}`,
        day: `${dateInfo.day} ${dateInfo.shortDate}`, // Format: "Mon 12/8"
      };
      
      // Add category values
      categories.forEach(category => {
        if (category.key === 'operating_expenses') {
          // Combine fixed_cost and variable_cost
          const fixedCost = processedData['fixed_cost']?.[dateKey] || 0;
          const variableCost = processedData['variable_cost']?.[dateKey] || 0;
          rowData[category.key] = fixedCost + variableCost;
        } else {
          rowData[category.key] = processedData[category.key]?.[dateKey] || 0;
        }
      });
      
      return rowData;
    });
    
    // Add total row
    const totalRow = {
      key: 'total',
      day: 'TOTAL',
    };
    
    categories.forEach(category => {
      totalRow[category.key] = totals[category.key] || 0;
    });
    
    return [...rows, totalRow];
  }, [tableData, categories, processedData, formatDateForDisplay, totals]);

  // CSV generation - Updated for new table structure
  const generateCSV = useCallback(() => {
    if (!tableData || tableData.length === 0) return '';
    
    const headers = ['Day', ...categories.map(c => c.label)];
    const rows = tableDataSource.map(row => {
      const rowData = [row.day];
      categories.forEach(category => {
        const value = row[category.key] || 0;
        rowData.push(value.toString());
      });
      return rowData.join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }, [tableData, categories, tableDataSource]);

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
  const weekStartDay = getWeekStartDate();

  // Table columns configuration - Redesigned to match image: dates as rows, categories as columns
  const tableColumns = useMemo(() => [
    {
      title: 'Day',
      dataIndex: 'day',
      key: 'day',
      width: 120,
      fixed: 'left',
      render: (text) => (
        <div className="bg-white px-3 py-2">
          <span className="font-semibold text-gray-800 text-sm">{text}</span>
        </div>
      ),
    },
    ...categories.map((category) => ({
      title: (
        <div className="text-center font-semibold text-gray-800 text-sm px-2">
          {category.label}
        </div>
      ),
      dataIndex: category.key,
      key: category.key,
      width: 130,
      align: 'center',
      render: (value, record) => {
        const isTotalRow = record.key === 'total';
        const bgColor = isTotalRow ? 'bg-orange-400' : category.bgColor;
        const textColor = isTotalRow ? 'text-white font-bold' : 'text-gray-800';
        
        let displayValue = value;
        if (category.type === 'currency') {
          if (category.key === 'budgeted_profit_loss') {
            displayValue = formatProfitLoss(value);
            const profitColor = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : textColor;
            return (
              <div className={`${bgColor} px-3 py-2 ${isTotalRow ? profitColor : textColor} text-sm`}>
                {displayValue}
              </div>
            );
          } else {
            displayValue = formatCurrency(value);
          }
        } else if (category.type === 'number') {
          displayValue = formatNumber(value);
        }
        
        return (
          <div className={`${bgColor} px-3 py-2 ${textColor} text-sm`}>
            {displayValue}
          </div>
        );
      },
    })),
  ], [categories, formatCurrency, formatNumber, formatProfitLoss]);
  
  

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
    <Card key={`dashboard-${dataTimestamp}`} className="shadow-lg border-0" data-guidance="summary_table">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-gray-200">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 mb-0">
              {isMonthlyView && monthDisplayName 
                ? `Your Budget For The Month of ${monthDisplayName}` 
                : weekStartDay 
                  ? `Your Budget For The Week of ${weekStartDay}` 
                  : "Your Budget Dashboard"}
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            icon={<EditOutlined />} 
            onClick={handleEdit}
            size="middle"
            disabled={!hasData}
            className="h-9 px-4 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 font-normal rounded-lg flex items-center gap-2"
          >
            <span className="hidden sm:inline">Edit Budget</span>
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
      <div className="hidden sm:block mt-4">
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {tableColumns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-2 border border-gray-200 font-semibold text-gray-800 text-sm ${
                      col.key === 'day' ? 'text-left' : 'text-center'
                    }`}
                    style={{ minWidth: col.width }}
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableDataSource.map((row) => {
                const isTotalRow = row.key === 'total';
                return (
                  <tr
                    key={row.key}
                    className={isTotalRow ? 'bg-orange-400 font-bold' : 'hover:bg-gray-50'}
                  >
                    {tableColumns.map((col) => {
                      const value = row[col.dataIndex];
                      const category = categories.find(c => c.key === col.key);
                      const isTotalRow = row.key === 'total';
                      const bgColor = isTotalRow ? 'bg-orange-400' : (category?.bgColor || 'bg-white');
                      const textColor = isTotalRow ? 'text-white font-bold' : 'text-gray-800';
                      
                      // Handle Day column separately
                      if (col.key === 'day') {
                        return (
                          <td
                            key={col.key}
                            className="bg-white px-3 py-2 border border-gray-200 text-left text-sm font-semibold text-gray-800"
                          >
                            {value}
                          </td>
                        );
                      }
                      
                      let displayValue = value;
                      if (category?.type === 'currency') {
                        if (category.key === 'budgeted_profit_loss') {
                          displayValue = formatProfitLoss(value);
                          // Profit/Loss: only red or green, no gray
                          const profitColor = value > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
                          return (
                            <td
                              key={col.key}
                              className={`${bgColor} px-3 py-2 border border-gray-200 text-center text-sm ${profitColor}`}
                            >
                              {displayValue}
                            </td>
                          );
                        } else {
                          displayValue = formatCurrency(value);
                        }
                      } else if (category?.type === 'number') {
                        displayValue = formatNumber(value);
                      }
                      
                      // All other columns: semibold text
                      return (
                        <td
                          key={col.key}
                          className={`${bgColor} px-3 py-2 border border-gray-200 text-center text-sm font-semibold ${textColor}`}
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile table */}
      <div className="block sm:hidden mt-4">
        <div className="space-y-2">
          {tableDataSource.map((row) => {
            const isTotalRow = row.key === 'total';
            return (
              <Card 
                key={row.key} 
                size="small" 
                className={`shadow-sm !mb-2 ${isTotalRow ? 'bg-orange-400' : ''}`}
              >
                <div className={`font-semibold mb-2 ${isTotalRow ? 'text-white' : 'text-gray-800'}`}>
                  {row.day}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => {
                    const value = row[category.key] || 0;
                    const bgColor = isTotalRow ? 'bg-orange-400' : category.bgColor;
                    const textColor = isTotalRow ? 'text-white font-bold' : 'text-gray-800';
                    
                    let displayValue = value;
                    if (category.type === 'currency') {
                      if (category.key === 'budgeted_profit_loss') {
                        displayValue = formatProfitLoss(value);
                        // Profit/Loss: only red or green, no gray
                        const profitColor = value > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
                        return (
                          <div key={category.key} className="flex justify-between text-xs">
                            <span className={textColor}>{category.label}</span>
                            <span className={profitColor}>{displayValue}</span>
                          </div>
                        );
                      } else {
                        displayValue = formatCurrency(value);
                      }
                    } else if (category.type === 'number') {
                      displayValue = formatNumber(value);
                    }
                    
                    // All other columns: semibold text
                    return (
                      <div key={category.key} className="flex justify-between text-xs">
                        <span className={textColor}>{category.label}</span>
                        <span className={`${textColor} font-semibold`}>{displayValue}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
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

