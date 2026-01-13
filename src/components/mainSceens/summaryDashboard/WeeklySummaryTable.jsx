import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Space, Typography, Card, Spin, Alert } from 'antd';
import { PrinterOutlined, DownloadOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';


const { Title, Text } = Typography;

const WeeklySummaryTable = ({ dashboardData, dashboardSummaryData, loading, error }) => {
  const [tableData, setTableData] = useState([]);
  const [processedData, setProcessedData] = useState({});

  // Helper function to parse numeric values safely
  const parseNumericValue = useCallback((value) => {
    if (value === null || value === undefined || value === 'None' || value === '') {
      return 0;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  // Helper function to format week display
  const formatWeekDisplay = useCallback((weekStart, weekEnd) => {
    try {
      const start = dayjs(weekStart);
      const end = dayjs(weekEnd);
      
      // Get week number of the year
      const weekNumber = start.week();
      
      // Format date range
      const startFormatted = start.format('MMM DD');
      const endFormatted = end.format('MMM DD, YYYY');
      
      return {
        weekNumber,
        dateRange: `${startFormatted} - ${endFormatted}`,
        shortRange: `${startFormatted} - ${end.format('MMM DD')}`,
        month: start.format('MMMM YYYY'),
        year: start.format('YYYY')
      };
    } catch {
      return {
        weekNumber: 0,
        dateRange: 'Invalid Date',
        shortRange: 'Invalid',
        month: 'Invalid',
        year: 'Invalid'
      };
    }
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


    // Process the data - Same structure as SummaryTableDashboard
    const processed = {
      sales_budget: {},
      labour: {},
      hours: {},
      average_hourly_rate: {},
      food_cost: {},
      profit_loss: {}
    };

    entries.forEach((entry) => {
      const weekKey = entry.week_start;
      
      // Process only the fields that match SummaryTableDashboard
      processed.sales_budget[weekKey] = parseNumericValue(entry.sales_budget);
      processed.labour[weekKey] = parseNumericValue(entry.labour);
      processed.hours[weekKey] = parseNumericValue(entry.hours);
      processed.average_hourly_rate[weekKey] = parseNumericValue(entry.average_hourly_rate);
      processed.food_cost[weekKey] = parseNumericValue(entry.food_cost);
      processed.profit_loss[weekKey] = parseNumericValue(entry.profit_loss);
    });

    
    
    setProcessedData(processed);
    setTableData(entries);
  }, [dashboardData, dashboardSummaryData, parseNumericValue, formatWeekDisplay]);

  // Categories for the weekly summary table - Same as SummaryTableDashboard
  const categories = useMemo(() => [
    { key: 'sales_budget', label: 'Sales Budget', type: 'currency' },
    { key: 'labour', label: 'Labor Budget', type: 'currency' },
    { key: 'hours', label: 'Hours', type: 'number' },
    { key: 'average_hourly_rate', label: 'Average Hourly Rate', type: 'currency' },
    { key: 'food_cost', label: 'Food Cost', type: 'currency' },
    { key: 'profit_loss', label: 'Profit/Loss', type: 'currency' }
  ], []);

  // Formatting utilities - Same as SummaryTableDashboard
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

  // Color coding for profit/loss values - Same as SummaryTableDashboard
  const getProfitLossColor = useCallback((value) => {
    if (value === '-') return 'text-gray-500';
    if (value > 0) {
      return 'text-green-600 font-semibold'; // Green for profit
    } else if (value < 0) {
      return 'text-red-600 font-semibold'; // Red for loss
    }
    return 'text-gray-600'; // Default color for zero
  }, []);

  // Format profit/loss with trading-like display (+ for positive values) - Same as SummaryTableDashboard
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

  // Get dynamic title based on data structure
  const getDynamicTitle = useCallback(() => {
    if (!tableData || tableData.length === 0) {
      return 'Summary Dashboard';
    }

    const firstEntry = tableData[0];
    
    // Check if data has week_start and week_end (weekly data)
    if (firstEntry.week_start && firstEntry.week_end) {
      return 'Weekly Summary Dashboard';
    }
    
    // Check if data has date or day (daily data)
    if (firstEntry.date || firstEntry.day) {
      return 'Daily Summary Dashboard';
    }
    
    // Check if data has month or year (monthly data)
    if (firstEntry.month || firstEntry.year) {
      return 'Monthly Summary Dashboard';
    }
    
    // Default fallback
    return 'Summary Dashboard';
  }, [tableData]);

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

  // CSV generation - Same as SummaryTableDashboard
  const generateCSV = useCallback(() => {
    if (!tableData || tableData.length === 0) return '';
    
    const dates = tableData.map(entry => {
      const weekInfo = formatWeekDisplay(entry.week_start, entry.week_end);
      return `Week ${weekInfo.weekNumber} (${weekInfo.shortRange})`;
    });
    const headers = ['Category', ...dates];
    const rows = categories.map(category => {
      const rowData = [category.label];
      dates.forEach((_, index) => {
        const entry = tableData[index];
        const weekKey = entry.week_start || 'N/A';
        const value = processedData[category.key]?.[weekKey] || 0;
        rowData.push(value.toString());
      });
      return rowData.join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }, [tableData, categories, processedData, formatWeekDisplay]);

  // Export handler - Same as SummaryTableDashboard
  const handleExport = useCallback(() => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-summary-table-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [generateCSV]);

  // Print handler - Same as SummaryTableDashboard
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Table columns configuration - Same structure as SummaryTableDashboard
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
      const weekInfo = formatWeekDisplay(entry.week_start, entry.week_end);
      const uniqueKey = `week-${weekInfo.weekNumber}-${index}`;
      
      return {
        title: (
          <div className="text-start">
            <div className="font-semibold text-xs text-gray-800">
              Week {weekInfo.weekNumber}
            </div>
            <div className="text-xs text-gray-600">
              {weekInfo.shortRange}
            </div>
          </div>
        ),
        dataIndex: uniqueKey,
        key: uniqueKey,
        width: 120,
        
        render: (value, record) => {
          const categoryKey = record.key;
          const weekKey = entry.week_start || 'N/A';
          const rawValue = processedData[categoryKey]?.[weekKey] || 0;
          
          // Handle currency fields - Same as SummaryTableDashboard
          if (categoryKey === 'sales_budget' || categoryKey === 'food_cost' || 
              categoryKey === 'average_hourly_rate' || categoryKey === 'profit_loss') {
            const colorClass = categoryKey === 'profit_loss' ? getProfitLossColor(rawValue) : 'text-gray-700';
            const formattedValue = categoryKey === 'profit_loss' ? formatProfitLoss(rawValue) : formatCurrency(rawValue);
            
            return (
              <div className="flex items-start justify-start">
                <span className={`text-sm ${colorClass}`}>{formattedValue}</span>
              </div>
            );
          }
          // Handle number fields - Same as SummaryTableDashboard
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
  ], [tableData, processedData, formatCurrency, formatNumber, getProfitLossColor, formatDateForDisplay, formatProfitLoss, formatWeekDisplay]);

  // Table data source - Same structure as SummaryTableDashboard
  const tableDataSource = useMemo(() => 
    categories.map(category => ({
      key: category.key,
      category: category.label,
      ...tableData.reduce((acc, entry, index) => {
        const weekInfo = formatWeekDisplay(entry.week_start, entry.week_end);
        const uniqueKey = `week-${weekInfo.weekNumber}-${index}`;
        const weekKey = entry.week_start || 'N/A';
        acc[uniqueKey] = processedData[category.key]?.[weekKey] || 0;
        return acc;
      }, {})
    })), [categories, tableData, processedData, formatWeekDisplay]);

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
          <p className="mt-4 text-gray-600">Loading weekly summary data...</p>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-gray-200">
                <Title level={4} className="mb-0 text-xl sm:text-2xl font-bold text-orange-600">
                    {getDynamicTitle()}
                </Title>
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
                  const weekInfo = formatWeekDisplay(entry.week_start, entry.week_end);
                  const uniqueKey = `week-${weekInfo.weekNumber}-${index}`;
                  const weekKey = entry.week_start || 'N/A';
                  const rawValue = processedData[row.key]?.[weekKey] || 0;
                  
                  return (
                    <div key={uniqueKey} className="flex justify-between text-xs">
                      <span className="text-gray-600">
                        Week {weekInfo.weekNumber}
                      </span>
                      <div className="flex items-center">
                        <span className={`font-medium ${
                          row.key === 'profit_loss'
                            ? getProfitLossColor(rawValue) : 'text-gray-600'
                        }`}>
                          {row.key === 'profit_loss'
                            ? formatProfitLoss(rawValue)
                            : row.key === 'sales_budget' || row.key === 'food_cost' || 
                              row.key === 'average_hourly_rate'
                            ? formatCurrency(rawValue)
                            : row.key === 'hours'
                            ? formatNumber(rawValue)
                            : rawValue
                          }
                        </span>
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

export default WeeklySummaryTable;
