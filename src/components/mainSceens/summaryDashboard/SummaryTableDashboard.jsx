import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Space, Typography, Card, Row, Col, Spin, Alert } from 'antd';
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const SummaryTableDashboard = ({ dashboardData, dashboardSummaryData, loading, error }) => {
  const [tableData, setTableData] = useState([]);
  const [processedData, setProcessedData] = useState({});

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

    // Process the data - Updated to match new API response structure
    const processed = {
      sales_budget: {},
      labour: {},
      food_cost: {},
      hours: {},
      amount: {},
      average_hourly_rate: {},
      profit_loss: {}
    };

    weekEntries.forEach((entry) => {
      const dayKey = entry.day ? entry.day.substring(0, 3) : entry.date ? dayjs(entry.date).format('ddd') : 'N/A';
      
      processed.sales_budget[dayKey] = parseFloat(entry.sales_budget || 0);
      processed.labour[dayKey] = parseFloat(entry.labour || 0);
      processed.food_cost[dayKey] = parseFloat(entry.food_cost || 0);
      processed.hours[dayKey] = parseFloat(entry.hours || 0);
      processed.amount[dayKey] = parseFloat(entry.amount || 0);
      processed.average_hourly_rate[dayKey] = parseFloat(entry.average_hourly_rate || 0);
      processed.profit_loss[dayKey] = parseFloat(entry.profit_loss || 0);
    });

    setProcessedData(processed);
    setTableData(weekEntries);
  }, [dashboardData, dashboardSummaryData]);

  // Categories for the summary table - Updated to match new API response structure
  const categories = useMemo(() => [
    { key: 'sales_budget', label: 'Sales Budget', type: 'currency' },
    { key: 'labour', label: 'Labor', type: 'number' },
    { key: 'hours', label: 'Hours', type: 'number' },
    { key: 'amount', label: 'Labor Amount', type: 'currency' },
    { key: 'average_hourly_rate', label: 'Average Hourly Rate', type: 'currency' },
    { key: 'food_cost', label: 'Food Cost', type: 'currency' },
    { key: 'profit_loss', label: 'Profit/Loss', type: 'currency' }
  ], []);

  // Formatting utilities
  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  }, []);

  const formatNumber = useCallback((value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2
    }).format(value || 0);
  }, []);

  // Color coding for profit/loss values
  const getProfitLossColor = useCallback((value) => {
    if (value > 0) {
      return 'text-green-600 font-semibold'; // Green for profit
    } else if (value < 0) {
      return 'text-red-600 font-semibold'; // Red for loss
    }
    return 'text-gray-600'; // Default color for zero
  }, []);

  // CSV generation
  const generateCSV = useCallback(() => {
    if (!tableData || tableData.length === 0) return '';
    
    const days = tableData.map(entry => entry.day ? entry.day.substring(0, 3) : dayjs(entry.date).format('ddd'));
    const headers = ['Category', ...days];
    const rows = categories.map(category => {
      const rowData = [category.label];
      days.forEach(day => {
        const value = processedData[category.key]?.[day] || 0;
        rowData.push(value.toString());
      });
      return rowData.join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }, [tableData, categories, processedData]);

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
      width: 200,
      fixed: 'left',
      render: (text) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 text-sm sm:text-base">{text}</span>
        </div>
      ),
      responsive: ['md']
    },
    ...tableData.map((entry, index) => {
      const dayKey = entry.day ? entry.day.substring(0, 3) : (entry.date ? dayjs(entry.date).format('ddd') : 'N/A');
      const uniqueKey = `${dayKey}-${index}`;
      
      return {
        title: (
          <div className="text-center">
            <div className="font-semibold text-xs sm:text-sm">
              {dayKey}
            </div>
            {index === 0 && <div className="text-xs text-gray-500 italic hidden sm:block">Date</div>}
          </div>
        ),
        dataIndex: uniqueKey,
        key: uniqueKey,
        width: 120,
        render: (value, record) => {
          const categoryKey = record.key;
          const dataValue = processedData[categoryKey]?.[dayKey] || 0;
          
          // Handle currency fields
          if (categoryKey === 'sales_budget' || categoryKey === 'food_cost' || categoryKey === 'amount' || categoryKey === 'average_hourly_rate' || categoryKey === 'profit_loss') {
            const colorClass = categoryKey === 'profit_loss' ? getProfitLossColor(dataValue) : 'text-gray-600';
            return <span className={`text-xs sm:text-sm ${colorClass}`}>{formatCurrency(dataValue)}</span>;
          }
          // Handle number fields
          if (categoryKey === 'labour' || categoryKey === 'hours') {
            return <span className="text-xs sm:text-sm">{formatNumber(dataValue)}</span>;
          }
          return <span className="text-xs sm:text-sm">{dataValue}</span>;
        }
      };
    })
  ], [tableData, processedData, formatCurrency, formatNumber, getProfitLossColor]);

  // Table data source
  const tableDataSource = useMemo(() => 
    categories.map(category => ({
      key: category.key,
      category: category.label,
      ...tableData.reduce((acc, entry, index) => {
        const dayKey = entry.day ? entry.day.substring(0, 3) : dayjs(entry.date).format('ddd');
        const uniqueKey = `${dayKey}-${index}`;
        acc[uniqueKey] = processedData[category.key]?.[dayKey] || 0;
        return acc;
      }, {})
    })), [categories, tableData, processedData]);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Title level={4} className="mb-0 text-lg sm:text-xl">
          Weekly Summary Dashboard
        </Title>
        <Space className="flex  sm:flex-row gap-2">
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

      {/* Mobile-friendly summary cards */}
      {/* <div className="block sm:hidden mb-6">
        <Row gutter={[16, 16]}>
          {categories.map(category => {
            const totalValue = Object.values(processedData[category.key] || {}).reduce((sum, val) => sum + val, 0);
            const colorClass = category.key === 'profit_loss' ? getProfitLossColor(totalValue) : 'text-gray-800';
            
            return (
              <Col xs={24} sm={12} key={category.key}>
                <Card size="small" className="text-center">
                  <div className="text-sm font-semibold text-gray-600 mb-2">{category.label}</div>
                  <div className={`text-lg font-bold ${colorClass}`}>
                    {category.type === 'currency' 
                      ? formatCurrency(totalValue)
                      : formatNumber(totalValue)
                    }
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div> */}

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
                  const dayKey = entry.day ? entry.day.substring(0, 3) : (entry.date ? dayjs(entry.date).format('ddd') : 'N/A');
                  const uniqueKey = `${dayKey}-${index}`;
                  const value = processedData[row.key]?.[dayKey] || 0;
                  
                  return (
                    <div key={uniqueKey} className="flex justify-between text-xs">
                      <span className="text-gray-600">{dayKey}:</span>
                      <span className={`font-medium ${
                        row.key === 'profit_loss' ? getProfitLossColor(value) : 'text-gray-600'
                      }`}>
                        {row.key === 'sales_budget' || row.key === 'food_cost' || row.key === 'amount' || row.key === 'average_hourly_rate' || row.key === 'profit_loss'
                          ? formatCurrency(value)
                          : row.key === 'labour' || row.key === 'hours'
                          ? formatNumber(value)
                          : value
                        }
                      </span>
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

export default SummaryTableDashboard;
