import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Card, Row, Col } from 'antd';
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title } = Typography;

const SummaryTableDashboard = ({ dashboardData }) => {
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'weekly'
     const [tableData, setTableData] = useState({
     sales: {},
     laborHours: {},
     laborAmount: {},
     averageHourlyRate: {},
     foodCost: {},
     budget: {},
     netProfit: {}
   });

     // Categories for the summary table
   const categories = [
     { key: 'sales', label: 'Sales' },
     { key: 'laborHours', label: 'Labor Hours (Budgeted)' },
     { key: 'laborAmount', label: 'Labor Amount (Budgeted)' },
     { key: 'averageHourlyRate', label: 'Average Hourly Rate' },
     { key: 'foodCost', label: 'Food Cost' },
     { key: 'netProfit', label: 'Net Profit' }
   ];

  // Process dashboard data to extract summary information
  useEffect(() => {
    if (dashboardData) {
      processDashboardData();
    }
  }, [dashboardData]);

                 const processDashboardData = () => {
       if (!dashboardData) return;

       const processedData = {
         sales: {},
         laborHours: {},
         laborAmount: {},
         averageHourlyRate: {},
         foodCost: {},
         netProfit: {}
       };

       // Use all daily entries from the API
       const weekEntries = dashboardData.daily_entries || [];
       
               weekEntries.forEach((dailyEntry) => {
          const dayKey = dailyEntry.day.substring(0, 3); // Mon, Tue, etc.
          
          // Sales data
          if (dailyEntry['Sales Performance']?.net_sales_actual) {
            processedData.sales[dayKey] = parseFloat(dailyEntry['Sales Performance'].net_sales_actual);
          } else {
            processedData.sales[dayKey] = 0;
          }

                     // Labor Hours - extract budgeted hours from daily_entries
           processedData.laborHours[dayKey] = parseFloat(dailyEntry['Labor Performance']?.labor_hours_budget || 0);
           
           // Labor Amount - extract budgeted labor dollars from daily_entries
           processedData.laborAmount[dayKey] = parseFloat(dailyEntry['Labor Performance']?.budgeted_labor_dollars || 0);
          
          // Average hourly rate from daily entry
          processedData.averageHourlyRate[dayKey] = parseFloat(dailyEntry['Labor Performance']?.daily_labor_rate || 0);

          // Food cost (COGS) - extract from daily_entries
          processedData.foodCost[dayKey] = parseFloat(dailyEntry['COGS Performance']?.cogs_actual || 0);


          // Net Profit - use the actual net profit from API
          processedData.netProfit[dayKey] = parseFloat(dailyEntry['Net Profit']?.net_profit || 0);

        });

       console.log('Setting table data:', processedData);
       setTableData(processedData);
     };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Implement export functionality (CSV, Excel, etc.)
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-table-${viewMode}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

     const generateCSV = () => {
     const days = dashboardData?.daily_entries?.map(entry => entry.day.substring(0, 3)) || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
     const headers = ['Category', ...days];
     const rows = categories.map(category => {
       const rowData = [category.label];
       days.forEach(day => {
         rowData.push(tableData[category.key][day] || '');
       });
       return rowData.join(',');
     });
     return [headers.join(','), ...rows].join('\n');
   };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Prepare table data for Ant Design Table
  const tableColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 200,
      render: (text, record) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">{text}</span>
        
          {record.key === 'laborHours' && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-blue-600 flex items-center">
              </div>
            </div>
          )}
          {record.key === 'laborAmount' && (
            <div className="mt-2 space-y-1">
              <div className="text-xs text-blue-600 flex items-center">
              </div>
            </div>
          )}
        </div>
      ),
      fixed: 'left'
    },
         ...(dashboardData?.daily_entries?.map((entry, index) => ({
       title: (
         <div className="text-center">
           <div className="font-semibold">{entry.day.substring(0, 3)}</div>
           {index === 0 && <div className="text-xs text-gray-500 italic">Date</div>}
         </div>
       ),
       dataIndex: entry.day.substring(0, 3).toLowerCase(),
       key: entry.day.substring(0, 3).toLowerCase(),
       width: 120,
       render: (value, record) => {
         const categoryKey = record.key;
         const dayKey = entry.day.substring(0, 3);
         
         if (categoryKey === 'sales') {
           return formatCurrency(tableData[categoryKey][dayKey] || 0);
         }
         if (categoryKey === 'laborHours') {
           return formatNumber(tableData[categoryKey][dayKey] || 0);
         }
         if (['laborAmount', 'averageHourlyRate', 'foodCost', 'netProfit'].includes(categoryKey)) {
           return formatCurrency(tableData[categoryKey][dayKey] || 0);
         }
         return value;
       }
     })) || [])
  ];

           const tableDataSource = categories.map(category => ({
      key: category.key,
      category: category.label,
      ...(dashboardData?.daily_entries?.reduce((acc, entry) => {
        const dayKey = entry.day.substring(0, 3);
        acc[dayKey.toLowerCase()] = tableData[category.key][dayKey] || 0;
        return acc;
      }, {}) || {})
    }));

     // Show message when no data is available
   if (!dashboardData) {
     return (
       <Card className="shadow-lg border-0">
         <div className="text-center py-8">
           <div className="mb-4">
             <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
             </svg>
           </div>
           <h3 className="text-lg font-medium text-gray-900 mb-2">No Dashboard Data Available</h3>
           <p className="text-gray-500 mb-4">
             No weekly dashboard data found for the selected criteria. This could be because:
           </p>
           <ul className="text-sm text-gray-500 text-left max-w-md mx-auto space-y-1">
             <li>• No data has been entered for this week yet</li>
             <li>• The selected week is in the future</li>
             <li>• Data hasn't been processed for this period</li>
           </ul>
           <p className="text-gray-500 mt-4">
             Please select a different week or ensure data has been entered for the selected period.
           </p>
         </div>
       </Card>
     );
   }

  return (
    <Card className="shadow-lg border-0">
      <div className="mb-6">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} className="mb-0 font-serif text-gray-800">
              Budget Summary
            </Title>
          </Col>
          <Col>
            <Space size="middle">
              <div className="flex items-center gap-2">
                <button 
                  type="text" 
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                  className=" border border-gray-200 px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Print
                </button>
                <button 
                  type="text" 
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                  className=" border border-gray-200 px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Export
                </button>
              </div>
              <div className="flex gap-2 overflow-hidden">
                <Button 
                  type={viewMode === 'daily' ? 'primary' : 'default'}
                  onClick={() => setViewMode('daily')}
                  className="border-0 rounded-none"
                  disabled={true}
                >
                  Daily
                </Button>
                <Button 
                  type={viewMode === 'weekly' ? 'primary' : 'default'}
                  onClick={() => setViewMode('weekly')}
                  className="border-0 rounded-none"
                  disabled={true}
                >
                  Weekly
                </Button>
              </div>
            </Space>
          </Col>
        </Row>
      </div>

             <div className="overflow-x-auto">
         {console.log('Table data source:', tableDataSource)}
         <Table
           columns={tableColumns}
           dataSource={tableDataSource}
           pagination={false}
           bordered
           size="middle"
           className="summary-table"
           rowClassName={(record) => 
             record.key === 'sales' ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
           }
           scroll={{ x: 'max-content' }}
         />
       </div>
    </Card>
  );
};

export default SummaryTableDashboard;
