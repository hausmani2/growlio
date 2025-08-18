import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Card, Spin, Alert } from 'antd';
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const ProfitLossTableDashboard = ({ dashboardData, dashboardSummaryData, loading, error, viewMode }) => {
  const [tableData, setTableData] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Helper function to format date for display
  const formatDateForDisplay = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = dayjs(dateString);
      return {
        day: date.format('ddd'),
        date: date.format('MMM DD'),
        fullDate: date.format('MMM DD, YYYY')
      };
    } catch (error) {
      return {
        day: 'Invalid Date',
        date: 'Invalid Date',
        fullDate: 'Invalid Date'
      };
    }
  }, []);

  // Process data
  useEffect(() => {
    const dataToProcess = dashboardSummaryData || dashboardData;
    
    if (!dataToProcess) {
      setTableData([]);
      return;
    }

    // Handle API error responses
    if (dataToProcess.status === 'fail' || dataToProcess.status === 'error') {
      setTableData([]);
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

    setTableData(entries);
  }, [dashboardData, dashboardSummaryData]);

  // Formatting utilities
  const formatCurrency = useCallback((value) => {
    if (value === null || value === undefined || value === 'None' || value === '') return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  }, []);

  const formatNumber = useCallback((value) => {
    if (value === null || value === undefined || value === 'None' || value === '') return '-';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  }, []);

  const formatPercentage = useCallback((value) => {
    if (value === null || value === undefined || value === 'None' || value === '') return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    return `${numValue > 0 ? '+' : ''}${numValue.toFixed(1)}%`;
  }, []);

  // Categories for the summary table
  const categories = useMemo(() => [
    { 
      key: 'sales_budget', 
      label: 'Sales Budget', 
      type: 'currency'
    },
    { 
      key: 'labour', 
      label: 'Labor', 
      type: 'number'
    },
    { 
      key: 'food_cost', 
      label: 'Food Cost', 
      type: 'currency'
    },
    { 
      key: 'fixedCost', 
      label: 'Fixed Cost', 
      type: 'currency'
    },
    { 
      key: 'variableCost', 
      label: 'Variable Cost', 
      type: 'currency'
    },
    { 
      key: 'profit_loss', 
      label: 'Profit & Loss', 
      type: 'currency'
    }
  ], []);

  // Generate grouped columns with multi-level headers
  const generateGroupedColumns = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];

    const groupedColumns = [
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
        width: 200,
        fixed: 'left'
      }
    ];

    // Add date columns
    tableData.forEach((entry, index) => {
      const dateInfo = formatDateForDisplay(entry.date || entry.day);
      const uniqueKey = `${dateInfo.fullDate}-${index}`;
      
      groupedColumns.push({
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
        render: (value, record) => {
          const categoryKey = record.key;
          const dateKey = entry.date || entry.day || 'N/A';
          
          let rawValue = 0;
          if (categoryKey === 'fixedCost' || categoryKey === 'variableCost') {
            if (categoryKey === 'fixedCost' && Array.isArray(entry.fixed_costs)) {
              rawValue = entry.fixed_costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
            } else if (categoryKey === 'variableCost' && Array.isArray(entry.variable_costs)) {
              rawValue = entry.variable_costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
            }
          } else {
            rawValue = parseFloat(entry[categoryKey]) || 0;
          }
          
          if (rawValue === 0) {
            return <span className="text-xs text-gray-500">-</span>;
          }
          
          if (categoryKey === 'profit_loss') {
            const colorClass = rawValue > 0 ? 'text-green-600 font-semibold' : rawValue < 0 ? 'text-red-600 font-semibold' : 'text-gray-600';
            const formattedValue = rawValue > 0 ? `+${formatCurrency(rawValue)}` : formatCurrency(rawValue);
            return <span className={`text-sm ${colorClass}`}>{formattedValue}</span>;
          }
          
          if (categoryKey === 'sales_budget' || categoryKey === 'food_cost' || categoryKey === 'fixedCost' || categoryKey === 'variableCost') {
            return <span className="text-sm text-gray-700">{formatCurrency(rawValue)}</span>;
          }
          
          if (categoryKey === 'labour') {
            return <span className="text-sm text-gray-700">{formatNumber(rawValue)}</span>;
          }
          
          return <span className="text-sm text-gray-700">{rawValue}</span>;
        }
      });
    });

    return groupedColumns;
  }, [tableData, formatDateForDisplay, formatCurrency, formatNumber]);

  // Generate expandable row data
  const generateExpandableData = useMemo(() => {
    return categories.map(category => {
      const baseRow = {
        key: category.key,
        category: category.label
      };

      // Add values for each date
      tableData.forEach((entry, index) => {
        const dateInfo = formatDateForDisplay(entry.date || entry.day);
        const uniqueKey = `${dateInfo.fullDate}-${index}`;
        const dateKey = entry.date || entry.day || 'N/A';
        
        let value = 0;
        if (category.key === 'fixedCost' || category.key === 'variableCost') {
          if (category.key === 'fixedCost' && Array.isArray(entry.fixed_costs)) {
            value = entry.fixed_costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
          } else if (category.key === 'variableCost' && Array.isArray(entry.variable_costs)) {
            value = entry.variable_costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
          }
        } else {
          value = parseFloat(entry[category.key]) || 0;
        }
        
        baseRow[uniqueKey] = value;
      });

      return baseRow;
    });
  }, [categories, tableData, formatDateForDisplay]);

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
        
        let value = 0;
        if (category.key === 'fixedCost' || category.key === 'variableCost') {
          if (category.key === 'fixedCost' && Array.isArray(entry.fixed_costs)) {
            value = entry.fixed_costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
          } else if (category.key === 'variableCost' && Array.isArray(entry.variable_costs)) {
            value = entry.variable_costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
          }
        } else {
          value = parseFloat(entry[category.key]) || 0;
        }
        
        rowData.push(value.toString());
      });
      return rowData.join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }, [tableData, categories, formatDateForDisplay]);

  // Export handler
  const handleExport = useCallback(() => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-loss-summary-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [generateCSV]);

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

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
          <div className="flex flex-col sm:flex-row gap-4 items-center">
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

      {/* Original grouped columns structure */}
      <div className="block">
        <Table
          columns={generateGroupedColumns}
          dataSource={generateExpandableData}
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="small"
          rowKey="key"
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
            expandedRowRender: (record) => {
              switch (record.key) {
                                case 'sales_budget':
                  return (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Sales Budget Breakdown</h4>
                      
                      {/* Summary Table */}
                      <div className="mb-4">
                        <Table
                          size="small"
                          pagination={false}
                          dataSource={[
                            {
                              key: 'summary',
                              metric: 'Total Sales Budget',
                              value: formatCurrency(tableData.reduce((sum, entry) => sum + (parseFloat(entry.sales_budget) || 0), 0)),
                              className: 'text-blue-600 font-semibold'
                            },
                            {
                              key: 'actual',
                              metric: 'Total Net Sales',
                              value: formatCurrency(tableData.reduce((sum, entry) => sum + (parseFloat(entry.sales_actual) || 0), 0)),
                              className: 'text-green-600 font-semibold'
                            },
                            {
                              key: 'variance',
                              metric: 'Total Variance',
                              value: (() => {
                                const totalBudget = tableData.reduce((sum, entry) => sum + (parseFloat(entry.sales_budget) || 0), 0);
                                const totalActual = tableData.reduce((sum, entry) => sum + (parseFloat(entry.sales_actual) || 0), 0);
                                const variance = totalActual - totalBudget;
                                const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;
                                return `${variance >= 0 ? '+' : ''}${formatCurrency(variance)} (${variancePercent >= 0 ? '+' : ''}${variancePercent.toFixed(1)}%)`;
                              })(),
                              className: 'text-gray-800 font-semibold'
                            }
                          ]}
                          columns={[
                            { title: 'Metric', dataIndex: 'metric', key: 'metric', width: 200 },
                            { 
                              title: 'Value', 
                              dataIndex: 'value', 
                              key: 'value',
                              render: (value, record) => (
                                <span className={record.className}>{value}</span>
                              )
                            }
                          ]}
                        />
                      </div>

                      {/* Daily Breakdown Table */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Daily Breakdown</h5>
                        <Table
                          size="small"
                          pagination={false}
                          dataSource={tableData.map((entry, index) => {
                            const dateInfo = formatDateForDisplay(entry.date || entry.day);
                            const salesBudget = parseFloat(entry.sales_budget) || 0;
                            const salesActual = parseFloat(entry.sales_actual) || 0;
                            const inStoreSales = parseFloat(entry.in_store_sales || entry['in-store_sales']) || 0;
                            const appOnlineSales = parseFloat(entry.app_online_sales) || 0;
                            const tickets = parseFloat(entry.tickets) || 0;
                            const averageTicket = parseFloat(entry.average_ticket) || (tickets > 0 ? salesActual / tickets : 0);
                            const variance = salesActual - salesBudget;
                            const variancePercent = salesBudget > 0 ? (variance / salesBudget) * 100 : 0;
                            const salesBudgetProfit = parseFloat(entry.sales_budget_profit) || 0;
                            const salesAmount = parseFloat(entry.sales_amount) || 0;
                            const salesAmountPercent = parseFloat(entry.sales_amount_percent) || 0;
                            
                            return {
                              key: index,
                              day: `${dateInfo.day} - ${dateInfo.date}`,
                              salesBudget: formatCurrency(salesBudget),
                              inStoreSales: formatCurrency(inStoreSales),
                              appOnlineSales: formatCurrency(appOnlineSales),
                              tickets: formatNumber(tickets),
                              averageTicket: formatCurrency(averageTicket),
                              salesActual: formatCurrency(salesActual),
                              variance: `${variance >= 0 ? '+' : ''}${formatCurrency(variance)}`,
                              variancePercent: `${variancePercent >= 0 ? '+' : ''}${variancePercent.toFixed(1)}%`,
                              salesBudgetProfit: `${salesBudgetProfit >= 0 ? '+' : ''}${salesBudgetProfit.toFixed(1)}%`,
                              salesAmount: `${salesAmount >= 0 ? '+' : ''}${formatCurrency(salesAmount)}`,
                              salesAmountPercent: `${salesAmountPercent >= 0 ? '+' : ''}${salesAmountPercent.toFixed(1)}%`,
                              varianceColor: variance >= 0 ? 'text-green-600' : 'text-red-600',
                              profitColor: salesBudgetProfit >= 0 ? 'text-green-600' : 'text-red-600',
                              amountColor: salesAmount >= 0 ? 'text-red-600' : 'text-green-600'
                            };
                          })}
                          columns={[
                            { title: 'Day', dataIndex: 'day', key: 'day', width: 120, fixed: 'left' },
                            { title: 'Sales Budget', dataIndex: 'salesBudget', key: 'salesBudget', width: 100 },
                            { title: 'In-Store Sales', dataIndex: 'inStoreSales', key: 'inStoreSales', width: 100 },
                            { title: 'App/Online Sales', dataIndex: 'appOnlineSales', key: 'appOnlineSales', width: 120 },
                            { title: '# Tickets', dataIndex: 'tickets', key: 'tickets', width: 80 },
                            { title: 'Avg Ticket', dataIndex: 'averageTicket', key: 'averageTicket', width: 100 },
                            { title: 'Sales Actual', dataIndex: 'salesActual', key: 'salesActual', width: 100 },
                            { 
                              title: 'Variance', 
                              dataIndex: 'variance', 
                              key: 'variance', 
                              width: 100,
                              render: (value, record) => (
                                <span className={record.varianceColor}>{value}</span>
                              )
                            },
                            { 
                              title: 'Variance %', 
                              dataIndex: 'variancePercent', 
                              key: 'variancePercent', 
                              width: 100,
                              render: (value, record) => (
                                <span className={record.varianceColor}>{value}</span>
                              )
                            },
                            { 
                              title: 'Budget Profit %', 
                              dataIndex: 'salesBudgetProfit', 
                              key: 'salesBudgetProfit', 
                              width: 120,
                              render: (value, record) => (
                                <span className={record.profitColor}>{value}</span>
                              )
                            },
                            { 
                              title: 'Amount Over/Under', 
                              dataIndex: 'salesAmount', 
                              key: 'salesAmount', 
                              width: 140,
                              render: (value, record) => (
                                <span className={record.amountColor}>{value}</span>
                              )
                            },
                            { 
                              title: '% Over/Under', 
                              dataIndex: 'salesAmountPercent', 
                              key: 'salesAmountPercent', 
                              width: 120,
                              render: (value, record) => (
                                <span className={record.amountColor}>{value}</span>
                              )
                            }
                          ]}
                          scroll={{ x: 'max-content' }}
                        />
                      </div>
                    </div>
                  );
                case 'labour':
                  return (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Labor Breakdown</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Total Labor Budget</span>
                              <span className="font-semibold text-blue-600">
                                {formatCurrency(tableData.reduce((sum, entry) => sum + (parseFloat(entry.labour) || 0), 0))}
                              </span>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Total Labor Hours</span>
                              <span className="font-semibold text-green-600">
                                {formatNumber(tableData.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Daily Labor Details</h5>
                          <div className="space-y-2">
                            {tableData.map((entry, index) => {
                              const dateInfo = formatDateForDisplay(entry.date || entry.day);
                              const laborBudget = parseFloat(entry.labour) || 0;
                              const laborHours = parseFloat(entry.hours) || 0;
                              const avgHourlyRate = laborHours > 0 ? laborBudget / laborHours : 0;
                              
                              return (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-700">{dateInfo.day} - {dateInfo.date}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="text-gray-600">Budget: {formatCurrency(laborBudget)}</span>
                                    <span className="text-gray-600">Hours: {formatNumber(laborHours)}</span>
                                    <span className="text-gray-600">Avg Rate: {formatCurrency(avgHourlyRate)}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                case 'food_cost':
                  return (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Food Cost Breakdown</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Total Food Cost Budget</span>
                              <span className="font-semibold text-blue-600">
                                {formatCurrency(tableData.reduce((sum, entry) => sum + (parseFloat(entry.food_cost) || 0), 0))}
                              </span>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Total Food Cost Actual</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(tableData.reduce((sum, entry) => sum + (parseFloat(entry.food_cost_actual) || 0), 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Daily Food Cost Details</h5>
                          <div className="space-y-2">
                            {tableData.map((entry, index) => {
                              const dateInfo = formatDateForDisplay(entry.date || entry.day);
                              const foodBudget = parseFloat(entry.food_cost) || 0;
                              const foodActual = parseFloat(entry.food_cost_actual) || 0;
                              const variance = foodActual - foodBudget;
                              const variancePercent = foodBudget > 0 ? (variance / foodBudget) * 100 : 0;
                              
                              return (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-700">{dateInfo.day} - {dateInfo.date}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="text-gray-600">Budget: {formatCurrency(foodBudget)}</span>
                                    <span className="text-gray-600">Actual: {formatCurrency(foodActual)}</span>
                                    <span className={`font-medium ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {variance >= 0 ? '+' : ''}{formatCurrency(variance)} ({variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                case 'fixedCost':
                  return (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Fixed Cost Breakdown</h4>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Fixed Costs</span>
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(tableData.reduce((sum, entry) => {
                                if (Array.isArray(entry.fixed_costs)) {
                                  return sum + entry.fixed_costs.reduce((costSum, cost) => costSum + (parseFloat(cost.amount) || 0), 0);
                                }
                                return sum;
                              }, 0))}
                            </span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Daily Fixed Cost Details</h5>
                          <div className="space-y-2">
                            {tableData.map((entry, index) => {
                              const dateInfo = formatDateForDisplay(entry.date || entry.day);
                              const fixedCosts = Array.isArray(entry.fixed_costs) ? entry.fixed_costs : [];
                              const totalFixedCost = fixedCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
                              
                              return (
                                <div key={index} className="space-y-2">
                                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm font-medium text-gray-700">{dateInfo.day} - {dateInfo.date}</span>
                                    <span className="font-semibold text-gray-800">{formatCurrency(totalFixedCost)}</span>
                                  </div>
                                  {fixedCosts.length > 0 && (
                                    <div className="ml-4 space-y-1">
                                      {fixedCosts.map((cost, costIndex) => (
                                        <div key={costIndex} className="flex items-center justify-between text-xs text-gray-600">
                                          <span>{cost.name || `Fixed Cost ${costIndex + 1}`}</span>
                                          <span>{formatCurrency(parseFloat(cost.amount) || 0)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                case 'variableCost':
                  return (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Variable Cost Breakdown</h4>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Variable Costs</span>
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(tableData.reduce((sum, entry) => {
                                if (Array.isArray(entry.variable_costs)) {
                                  return sum + entry.variable_costs.reduce((costSum, cost) => costSum + (parseFloat(cost.amount) || 0), 0);
                                }
                                return sum;
                              }, 0))}
                            </span>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Daily Variable Cost Details</h5>
                          <div className="space-y-2">
                            {tableData.map((entry, index) => {
                              const dateInfo = formatDateForDisplay(entry.date || entry.day);
                              const variableCosts = Array.isArray(entry.variable_costs) ? entry.variable_costs : [];
                              const totalVariableCost = variableCosts.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0);
                              
                              return (
                                <div key={index} className="space-y-2">
                                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <span className="text-sm font-medium text-gray-700">{dateInfo.day} - {dateInfo.date}</span>
                                    <span className="font-semibold text-gray-800">{formatCurrency(totalVariableCost)}</span>
                                  </div>
                                  {variableCosts.length > 0 && (
                                    <div className="ml-4 space-y-1">
                                      {variableCosts.map((cost, costIndex) => (
                                        <div key={costIndex} className="flex items-center justify-between text-xs text-gray-600">
                                          <span>{cost.name || `Variable Cost ${costIndex + 1}`}</span>
                                          <span>{formatCurrency(parseFloat(cost.amount) || 0)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                case 'profit_loss':
                  return (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Profit & Loss Summary</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Total Revenue</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(tableData.reduce((sum, entry) => sum + (parseFloat(entry.sales_actual) || 0), 0))}
                              </span>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Total Costs</span>
                              <span className="font-semibold text-red-600">
                                {formatCurrency(tableData.reduce((sum, entry) => {
                                  const laborCost = parseFloat(entry.labour) || 0;
                                  const foodCost = parseFloat(entry.food_cost_actual) || 0;
                                  const fixedCosts = Array.isArray(entry.fixed_costs) ? entry.fixed_costs.reduce((costSum, cost) => costSum + (parseFloat(cost.amount) || 0), 0) : 0;
                                  const variableCosts = Array.isArray(entry.variable_costs) ? entry.variable_costs.reduce((costSum, cost) => costSum + (parseFloat(cost.amount) || 0), 0) : 0;
                                  return sum + laborCost + foodCost + fixedCosts + variableCosts;
                                }, 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Daily P&L Details</h5>
                          <div className="space-y-2">
                            {tableData.map((entry, index) => {
                              const dateInfo = formatDateForDisplay(entry.date || entry.day);
                              const revenue = parseFloat(entry.sales_actual) || 0;
                              const laborCost = parseFloat(entry.labour) || 0;
                              const foodCost = parseFloat(entry.food_cost_actual) || 0;
                              const fixedCosts = Array.isArray(entry.fixed_costs) ? entry.fixed_costs.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0) : 0;
                              const variableCosts = Array.isArray(entry.variable_costs) ? entry.variable_costs.reduce((sum, cost) => sum + (parseFloat(cost.amount) || 0), 0) : 0;
                              const totalCosts = laborCost + foodCost + fixedCosts + variableCosts;
                              const profitLoss = revenue - totalCosts;
                              
                              return (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-700">{dateInfo.day} - {dateInfo.date}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="text-gray-600">Revenue: {formatCurrency(revenue)}</span>
                                    <span className="text-gray-600">Costs: {formatCurrency(totalCosts)}</span>
                                    <span className={`font-medium ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                default:
                  return (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Detailed breakdown for {record.category} will be implemented later.
                      </p>
                    </div>
                  );
              }
            }
          }}
        />
      </div>
    </Card>
  );
};

export default ProfitLossTableDashboard;

