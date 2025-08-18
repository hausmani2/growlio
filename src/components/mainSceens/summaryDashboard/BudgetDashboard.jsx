import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Row, Col, Typography, Progress, Button, Space, Spin, Alert } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { 
  DollarOutlined, 
  ShoppingOutlined, 
  TeamOutlined, 
  PlusOutlined,
  EditOutlined
} from '@ant-design/icons';
import useStore from '../../../store/store';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const { Title: AntTitle, Text } = Typography;

const BudgetDashboard = ({ dashboardData, loading, error, onAddData, onEditData, startDate, endDate }) => {
  const [chartData, setChartData] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [categorySummary, setCategorySummary] = useState(null);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const lastFetchKeyRef = useRef('');
  const fetchDebounceRef = useRef(null);
  const fetchProfitLossCategorySummary = useStore((s) => s.fetchProfitLossCategorySummary);

  // Process data for charts
  // 1) Process incoming dashboard data (compute chartData + summaryData)
  useEffect(() => {
    if (!dashboardData || !dashboardData.data) {
      setChartData([]);
      setSummaryData({});
      return;
    }

    const data = dashboardData.data;
    
    // Process data for charts
    const processedData = data.map(entry => ({
      day: entry.day || entry.date,
      salesBudget: parseFloat(entry.sales_budget) || 0,
      salesActual: parseFloat(entry.actual_sales) || 0,
      foodCostBudget: parseFloat(entry.food_cost_budget) || 0,
      foodCostActual: parseFloat(entry.food_cost) || 0,
      laborBudget: parseFloat(entry.labor_budget) || 0,
      laborActual: parseFloat(entry.labor) || 0,
      profit: parseFloat(entry.profit_loss) || 0
    }));

    setChartData(processedData);

    // Calculate summary data
    const summary = {
      totalSalesBudget: processedData.reduce((sum, item) => sum + item.salesBudget, 0),
      totalSalesActual: processedData.reduce((sum, item) => sum + item.salesActual, 0),
      totalFoodCostBudget: processedData.reduce((sum, item) => sum + item.foodCostBudget, 0),
      totalFoodCostActual: processedData.reduce((sum, item) => sum + item.foodCostActual, 0),
      totalLaborBudget: processedData.reduce((sum, item) => sum + item.laborBudget, 0),
      totalLaborActual: processedData.reduce((sum, item) => sum + item.laborActual, 0),
      totalProfit: processedData.reduce((sum, item) => sum + item.profit, 0)
    };

    setSummaryData(summary);
  }, [dashboardData]);

  // 2) Fetch category summary from backend when date range changes (debounced + deduped)
  useEffect(() => {
    const start = startDate;
    const end = endDate;
    // Reset local state when dates not ready
    if (!start || !end) {
      setCategorySummary(null);
      setDynamicCategories([]);
      return;
    }
    const key = `${start}|${end}`;
    if (lastFetchKeyRef.current === key) return; // dedupe identical requests

    // Debounce to avoid rapid re-requests during range selection
    if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
    fetchDebounceRef.current = setTimeout(() => {
      lastFetchKeyRef.current = key;
      fetchProfitLossCategorySummary(start, end).then((res) => {
        if (res) {
          const payload = res.data || res;
          const payloadCategories = res.categories || res.data?.categories;
          setCategorySummary(payload);
          if (Array.isArray(payloadCategories)) {
            setDynamicCategories(payloadCategories);
          } else {
            setDynamicCategories([]);
          }
        }
      });
    }, 250);

    return () => {
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
    };
  }, [startDate, endDate, fetchProfitLossCategorySummary]);

  // Calculate progress percentages
  const progressData = useMemo(() => {
    if (!summaryData.totalSalesBudget) return {};

    return {
      salesProgress: Math.min((summaryData.totalSalesActual / summaryData.totalSalesBudget) * 100, 100),
      foodCostProgress: Math.min((summaryData.totalFoodCostActual / summaryData.totalFoodCostBudget) * 100, 100),
      laborProgress: Math.min((summaryData.totalLaborActual / summaryData.totalLaborBudget) * 100, 100)
    };
  }, [summaryData]);

  // Get status colors
  const getStatusColor = (actual, budget) => {
    const percentage = (actual / budget) * 100;
    if (percentage >= 90 && percentage <= 110) return '#52c41a'; // Green - on track
    if (percentage > 110) return '#ff4d4f'; // Red - over budget
    return '#faad14'; // Orange - under budget
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Chart.js options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  // Sales comparison chart data
  const salesChartData = {
    labels: chartData.map(item => item.day),
    datasets: [
      {
        label: 'Sales Budget',
        data: chartData.map(item => item.salesBudget),
        backgroundColor: 'rgba(24, 144, 255, 0.8)',
        borderColor: 'rgba(24, 144, 255, 1)',
        borderWidth: 2,
      },
      {
        label: 'Sales Actual',
        data: chartData.map(item => item.salesActual),
        backgroundColor: 'rgba(82, 196, 26, 0.8)',
        borderColor: 'rgba(82, 196, 26, 1)',
        borderWidth: 2,
      }
    ]
  };

  // Cost comparison chart data
  const costChartData = {
    labels: chartData.map(item => item.day),
    datasets: [
      {
        label: 'Food Cost Budget',
        data: chartData.map(item => item.foodCostBudget),
        backgroundColor: 'rgba(250, 173, 20, 0.8)',
        borderColor: 'rgba(250, 173, 20, 1)',
        borderWidth: 2,
      },
      {
        label: 'Food Cost Actual',
        data: chartData.map(item => item.foodCostActual),
        backgroundColor: 'rgba(255, 77, 79, 0.8)',
        borderColor: 'rgba(255, 77, 79, 1)',
        borderWidth: 2,
      },
      {
        label: 'Labor Budget',
        data: chartData.map(item => item.laborBudget),
        backgroundColor: 'rgba(114, 46, 209, 0.8)',
        borderColor: 'rgba(114, 46, 209, 1)',
        borderWidth: 2,
      },
      {
        label: 'Labor Actual',
        data: chartData.map(item => item.laborActual),
        backgroundColor: 'rgba(235, 47, 150, 0.8)',
        borderColor: 'rgba(235, 47, 150, 1)',
        borderWidth: 2,
      }
    ]
  };

  // Profit trend chart data
  const profitChartData = {
    labels: chartData.map(item => item.day),
    datasets: [
      {
        label: 'Profit/Loss',
        data: chartData.map(item => item.profit),
        borderColor: 'rgba(82, 196, 26, 1)',
        backgroundColor: 'rgba(82, 196, 26, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(82, 196, 26, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
      }
    ]
  };

  // Profit/Loss breakdown by category (Sales, Labor, Food Cost)
  const categoryNet = useMemo(() => {
    return {
      sales: (summaryData.totalSalesActual || 0) - (summaryData.totalSalesBudget || 0),
      // For costs, being under budget is positive towards profit
      labor: (summaryData.totalLaborBudget || 0) - (summaryData.totalLaborActual || 0),
      food: (summaryData.totalFoodCostBudget || 0) - (summaryData.totalFoodCostActual || 0),
    };
  }, [summaryData]);

  // Build dynamic categories either from backend or fallback to three categories
  const computedCategories = dynamicCategories.length
    ? dynamicCategories
    : [
        { key: 'sales', label: 'Sales', value: (summaryData.totalSalesActual || 0) - (summaryData.totalSalesBudget || 0) },
        { key: 'labor', label: 'Labor', value: (summaryData.totalLaborBudget || 0) - (summaryData.totalLaborActual || 0) },
        { key: 'food', label: 'Food Cost', value: (summaryData.totalFoodCostBudget || 0) - (summaryData.totalFoodCostActual || 0) },
      ];

  // Ensure at least minimal slice for very small values
  const categoryPieData = {
    labels: computedCategories.map((c) => c.label),
    datasets: [
      {
        data: computedCategories.map((c) => {
          const v = Math.abs(Number(c.value) || 0);
          return v === 0 ? 0.0001 : v;
        }),
        backgroundColor: computedCategories.map((c) => (Number(c.value) >= 0 ? 'rgba(82, 196, 26, 0.8)' : 'rgba(255, 77, 79, 0.8)')),
        borderColor: computedCategories.map((c) => (Number(c.value) >= 0 ? 'rgba(82, 196, 26, 1)' : 'rgba(255, 77, 79, 1)')),
        borderWidth: 2,
      },
    ],
  };

  const categoryPieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const idx = context.dataIndex;
            const signedValues = computedCategories.map((c) => c.value);
            const total = context.dataset.data.reduce((a, b) => a + b, 0) || 1;
            const value = signedValues[idx];
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            const sign = value >= 0 ? '+' : '-';
            return `${context.label}: ${sign}${formatCurrency(Math.abs(value))} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-8">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">Loading budget dashboard...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        message="Error Loading Data"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  // No data state
  if (!chartData.length) {
    return (
      <Card className="text-center py-8">
        <div className="mb-4">
          <ShoppingOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
        </div>
        <AntTitle level={4} className="text-gray-500"> Data Available</AntTitle>
        <Text className="text-gray-400 mb-6 block">
          Start by adding your weekly budget and actual sales data.
        </Text>
        <Space>
        
        </Space>
      </Card>
    );
  }

  return (
    <div className="space-y-6">     

      {/* Summary Cards */}
      {/* <Row gutter={[16, 16]}> */}
        {/* Sales Summary */}
        {/* <Col xs={24} sm={12} lg={8}>
          <Card className="h-full">
            <div className="text-center">
              <ShoppingOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
              <AntTitle level={4} className="mt-2 mb-1">Sales Goal vs Actual</AntTitle>
              <div className="mb-3">
                <Text className="text-lg font-bold text-green-600">
                  {formatCurrency(summaryData.totalSalesActual)}
                </Text>
                <Text className="text-gray-500 ml-2">
                  of {formatCurrency(summaryData.totalSalesBudget)}
                </Text>
              </div>
              <Progress
                percent={progressData.salesProgress}
                strokeColor={getStatusColor(summaryData.totalSalesActual, summaryData.totalSalesBudget)}
                showInfo={false}
                size="small"
              />
              <Text className="text-sm text-gray-600 mt-2 block">
                {progressData.salesProgress >= 90 && progressData.salesProgress <= 110 
                  ? '🎯 On Track' 
                  : progressData.salesProgress > 110 
                    ? '⚠️ Over Budget' 
                    : '📉 Under Budget'}
              </Text>
            </div>
          </Card>
        </Col> */}

        {/* Food Cost Summary */}
        {/* <Col xs={24} sm={12} lg={8}>
          <Card className="h-full">
            <div className="text-center">
              <ShoppingOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
              <AntTitle level={4} className="mt-2 mb-1">Food Cost Budget vs Actual</AntTitle>
              <div className="mb-3">
                <Text className="text-lg font-bold text-red-600">
                  {formatCurrency(summaryData.totalFoodCostActual)}
                </Text>
                <Text className="text-gray-500 ml-2">
                  of {formatCurrency(summaryData.totalFoodCostBudget)}
                </Text>
              </div>
              <Progress
                percent={progressData.foodCostProgress}
                strokeColor={getStatusColor(summaryData.totalFoodCostActual, summaryData.totalFoodCostBudget)}
                showInfo={false}
                size="small"
              />
              <Text className="text-sm text-gray-600 mt-2 block">
                {progressData.foodCostProgress <= 100 
                  ? '✅ Under Budget' 
                  : '⚠️ Over Budget'}
              </Text>
            </div>
          </Card>
        </Col> */}

        {/* Labor Summary */}
        {/* <Col xs={24} sm={12} lg={8}>
          <Card className="h-full">
            <div className="text-center">
              <TeamOutlined style={{ fontSize: '32px', color: '#faad14' }} />
              <AntTitle level={4} className="mt-2 mb-1">Labor Cost Budget vs Actual</AntTitle>
              <div className="mb-3">
                <Text className="text-lg font-bold text-orange-600">
                  {formatCurrency(summaryData.totalLaborActual)}
                </Text>
                <Text className="text-gray-500 ml-2">
                  of {formatCurrency(summaryData.totalLaborBudget)}
                </Text>
              </div>
              <Progress
                percent={progressData.laborProgress}
                strokeColor={getStatusColor(summaryData.totalLaborActual, summaryData.totalLaborBudget)}
                showInfo={false}
                size="small"
              />
              <Text className="text-sm text-gray-600 mt-2 block">
                {progressData.laborProgress <= 100 
                  ? '✅ Under Budget' 
                  : '⚠️ Over Budget'}
              </Text>
            </div>
          </Card>
        </Col> */}
      {/* </Row> */}

      {/* Charts */}
      {/* <Row gutter={[16, 16]}> */}
        {/* Sales Comparison Chart */}
        {/* <Col xs={24} lg={12}>
          <Card title="Daily Sales: Budget vs Actual" className="h-full">
            <div style={{ height: '300px' }}>
              <Bar data={salesChartData} options={chartOptions} />
            </div>
          </Card>
        </Col> */}

        {/* Cost Comparison Chart */}
        {/* <Col xs={24} lg={12}>
          <Card title="Daily Costs: Budget vs Actual" className="h-full">
            <div style={{ height: '300px' }}>
              <Bar data={costChartData} options={chartOptions} />
            </div>
          </Card>
        </Col> */}
      {/* </Row> */}

      {/* Profit Trend + Category Breakdown */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card className="h-full">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-gray-200">
                <h2 className="text-xl font-bold text-orange-600">Daily Profit/Loss Trend</h2>
              </div>
            </div>
            <div style={{ height: '300px' }}>
              <Line data={profitChartData} options={chartOptions} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="h-full">
            <div className="mb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 pb-3 border-b border-gray-200">
                <h2 className="text-xl font-bold text-orange-600">Profit/Loss by Category</h2>
              </div>
            </div>
            <div style={{ height: '300px' }}>
              <Pie data={categoryPieData} options={categoryPieOptions} />
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p><span className="font-medium">Green</span>: positive contribution to profit; <span className="font-medium">Red</span>: negative impact.</p>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Budget Distribution Pie Chart */}
      <Row gutter={[16, 16]}>
        {/* <Col xs={24} lg={12}>
          <Card title="Budget Distribution" className="h-full">
            <div style={{ height: '300px' }}>
              <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          </Card>
        </Col> */}

        {/* Remaining Budget */}
        {/* <Col xs={24} lg={12}>
          <Card title="Remaining Budget for the Week" className="h-full">
            <div className="space-y-4">
              <div className="text-center">
                <AntTitle level={2} className="text-green-600">
                  {formatCurrency(summaryData.totalSalesBudget - summaryData.totalSalesActual)}
                </AntTitle>
                <Text className="text-gray-600">Remaining Sales Budget</Text>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <Text className="text-lg font-bold text-orange-600">
                    {formatCurrency(summaryData.totalFoodCostBudget - summaryData.totalFoodCostActual)}
                  </Text>
                  <Text className="text-sm text-gray-600 block">Food Cost Remaining</Text>
                </div>
                <div className="text-center">
                  <Text className="text-lg font-bold text-purple-600">
                    {formatCurrency(summaryData.totalLaborBudget - summaryData.totalLaborActual)}
                  </Text>
                  <Text className="text-sm text-gray-600 block">Labor Remaining</Text>
                </div>
              </div>

              <div className="text-center pt-4 border-t">
                <AntTitle level={3} className={summaryData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {summaryData.totalProfit >= 0 ? '+' : ''}{formatCurrency(summaryData.totalProfit)}
                </AntTitle>
                <Text className="text-gray-600">Total Weekly Profit/Loss</Text>
              </div>
            </div>
          </Card>
        </Col> */}
      </Row>
    </div>
  );
};

export default BudgetDashboard;
