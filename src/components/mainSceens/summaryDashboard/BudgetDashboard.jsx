import React, { useState, useEffect, useMemo } from 'react';
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
import useRestaurantGoals from '../../../hooks/useRestaurantGoals';
import { useNavigate } from 'react-router-dom';
import useRestaurantRole from '../../../hooks/useRestaurantRole';

// Match SummaryTableDashboard fixed-cost fallbacks so totals align with "Your Budget For The Week" TOTAL row.
const parseNumericLikeTable = (value) => {
  if (value === null || value === undefined || value === 'None' || value === '') return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

const getEntryFixedCostBudget = (entry) => {
  if (entry.fixed_cost_total !== undefined && entry.fixed_cost_total !== null && entry.fixed_cost_total !== 'None') {
    return parseNumericLikeTable(entry.fixed_cost_total);
  }
  if (entry.budgeted_fixed_cost_total !== undefined && entry.budgeted_fixed_cost_total !== null && entry.budgeted_fixed_cost_total !== 'None') {
    return parseNumericLikeTable(entry.budgeted_fixed_cost_total);
  }
  if (Array.isArray(entry.fixed_costs)) {
    return entry.fixed_costs.reduce((sum, cost) => sum + parseNumericLikeTable(cost?.amount), 0);
  }
  if (Array.isArray(entry.fixed_costs_budget)) {
    return entry.fixed_costs_budget.reduce((sum, cost) => sum + parseNumericLikeTable(cost?.amount), 0);
  }
  if (entry.fixed_cost_budget !== undefined && entry.fixed_cost_budget !== null && entry.fixed_cost_budget !== 'None') {
    return parseNumericLikeTable(entry.fixed_cost_budget);
  }
  return parseNumericLikeTable(entry.fixed_cost);
};

const EXPENSE_PIE_PALETTE = {
  labor_budget: { bg: '#6366f1', border: '#4f46e5' },
  food_cost: { bg: '#ef4444', border: '#dc2626' },
  expenses: { bg: '#22c55e', border: '#16a34a' },
};

const SLICE_INSIDE_LINE_SETS = [
  ['Labor Budget'],
  ['Food Cost', '(COGS)'],
  ['Operational', 'Expense'],
];

const getEntryVariableCostBudget = (entry) => {
  if (entry.variable_cost_total !== undefined && entry.variable_cost_total !== null && entry.variable_cost_total !== 'None') {
    return parseNumericLikeTable(entry.variable_cost_total);
  }
  if (entry.budgeted_variable_cost_total !== undefined && entry.budgeted_variable_cost_total !== null && entry.budgeted_variable_cost_total !== 'None') {
    return parseNumericLikeTable(entry.budgeted_variable_cost_total);
  }
  if (Array.isArray(entry.variable_costs)) {
    return entry.variable_costs.reduce((sum, cost) => sum + parseNumericLikeTable(cost?.amount), 0);
  }
  if (Array.isArray(entry.variable_costs_budget)) {
    return entry.variable_costs_budget.reduce((sum, cost) => sum + parseNumericLikeTable(cost?.amount), 0);
  }
  if (entry.variable_cost_budget !== undefined && entry.variable_cost_budget !== null && entry.variable_cost_budget !== 'None') {
    return parseNumericLikeTable(entry.variable_cost_budget);
  }
  return parseNumericLikeTable(entry.variable_cost);
};

const getEntryAverageHourlyRate = (entry) => parseNumericLikeTable(
  entry.average_hourly_rate ??
  entry.avg_hourly_rate ??
  entry.averageHourlyRate
);

const formatAssumptionPercent = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `${Math.round(n)}%` : '—';
};

const formatAssumptionRate = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `$${n.toFixed(2)}/hr` : '—';
};

// Custom plugin: multi-line labels inside slices (avoids clipping long names like "Operational Expense")
const SliceLabelsPlugin = {
  id: 'sliceLabels',
  afterDatasetsDraw(chart, args, pluginOptions) {
    const { ctx } = chart;
    const dataset = chart.data?.datasets?.[0];
    if (!dataset) return;
    const meta = chart.getDatasetMeta(0);
    const rawValues = (dataset.data || []).map((v) => Math.abs(Number(v) || 0));
    const total = rawValues.reduce((a, b) => a + b, 0) || 1;
    const opts = pluginOptions || chart.options?.plugins?.sliceLabels || {};
    const lineSets = opts.lineSets || SLICE_INSIDE_LINE_SETS;
    const font = opts.font || '600 10px Inter, system-ui, -apple-system, Segoe UI, Roboto';
    const lineHeight = opts.lineHeight ?? 12;

    ctx.save();
    meta.data.forEach((arc, index) => {
      const value = rawValues[index] || 0;
      if (!value) return;
      const percentage = (value / total) * 100;
      if (percentage < 3) return;

      const props = arc.getProps(['startAngle', 'endAngle', 'innerRadius', 'outerRadius', 'x', 'y'], true);
      const angle = (props.startAngle + props.endAngle) / 2;
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * 0.55;
      const x = props.x + Math.cos(angle) * r;
      const y = props.y + Math.sin(angle) * r;

      const fallbackLabel = String(chart.data?.labels?.[index] || '').replace(/\n/g, ' ');
      const linesFromOpt = Array.isArray(lineSets?.[index]) ? lineSets[index].filter(Boolean) : null;
      const textLines = linesFromOpt?.length ? [...linesFromOpt, `${percentage.toFixed(1)}%`] : [`${fallbackLabel}`, `${percentage.toFixed(1)}%`];

      ctx.fillStyle = opts.color || '#fff';
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const blockH = (textLines.length - 1) * lineHeight;
      let yCursor = y - blockH / 2;
      textLines.forEach((line) => {
        ctx.fillText(line, x, yCursor);
        yCursor += lineHeight;
      });
    });
    ctx.restore();
  }
};

// Register Chart.js components and custom plugin
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
  Filler,
  SliceLabelsPlugin
);

const { Title: AntTitle, Text } = Typography;

const BudgetDashboard = ({ dashboardData, loading, error, onAddData, onEditData, startDate, endDate }) => {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [weekRange, setWeekRange] = useState('');
  const restaurantGoals = useStore((s) => s.restaurantGoals);
  const { canCreateBudget } = useRestaurantRole();
  
  // Restaurant goals functionality - using custom hook for professional handling
  // This ensures goals API is called when budget dashboard mounts
  useRestaurantGoals({
    autoFetch: true,
    refreshOnMount: true, // Always fetch fresh data when budget dashboard mounts
    componentName: 'BudgetDashboard'
  });

  // Calculate week range from startDate and endDate props
  useEffect(() => {
    if (startDate && endDate) {
      // Parse the date strings properly
      const start = new Date(startDate + 'T00:00:00'); // Add time to avoid timezone issues
      const end = new Date(endDate + 'T00:00:00');
      
      // Check if dates are valid
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const startDay = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endDay = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const weekRangeValue = `${startDay} - ${endDay}`;
        setWeekRange(weekRangeValue);
      } else {
        setWeekRange('');
      }
    } else {
      setWeekRange('');
    }
  }, [startDate, endDate]);

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
    const processedData = data.map(entry => {
      
      // Handle daily, weekly, and monthly data structures
      let dayLabel;
      if (entry.day || entry.date) {
        // Daily data
        dayLabel = entry.day || entry.date;
      } else if (entry.week_start && entry.week_end) {
        // Weekly data - create a readable label
        const startDate = new Date(entry.week_start);
        const endDate = new Date(entry.week_end);
        const startDay = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endDay = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dayLabel = `${startDay} - ${endDay}`;
      } else if (entry.month_start && entry.month_end) {
        // Monthly data - create a readable label
        const startDate = new Date(entry.month_start);
        const monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        dayLabel = monthName;
      } else {
        // Fallback
        dayLabel = 'Unknown Period';
      }
      
      const salesBudget = parseFloat(entry.sales_budget ?? entry.salesBudget ?? 0) || 0;
      const salesActual = parseFloat(entry.sales_actual ?? entry.actual_sales ?? entry.salesActual ?? 0) || 0;
      const foodCostBudget = parseFloat(entry.food_cost ?? entry.food_cost_budget ?? entry.foodCostBudget ?? 0) || 0;
      const foodCostActual = parseFloat(entry.food_cost_actual ?? entry.food_cost_actuals ?? entry.foodCostActual ?? 0) || 0;
      const laborBudget = parseFloat(entry.labour ?? entry.labor_budget ?? entry.laborBudget ?? 0) || 0;
      const laborActual = parseFloat(entry.labour_actual ?? entry.labor ?? entry.laborActual ?? 0) || 0;
      
      // Operational expense (budget): same field fallbacks as SummaryTableDashboard TOTAL row
      const fixedCostsBudget = getEntryFixedCostBudget(entry);
      const variableCostsBudget = getEntryVariableCostBudget(entry);
      const operationalExpenseBudget = fixedCostsBudget + variableCostsBudget;

      // Actuals: support array or scalar shapes from API
      let fixedCostsActual = 0;
      let variableCostsActual = 0;
      if (Array.isArray(entry.fixed_costs_actual)) {
        fixedCostsActual = entry.fixed_costs_actual.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
      } else if (entry.fixed_cost_actual) {
        fixedCostsActual = parseFloat(entry.fixed_cost_actual) || 0;
      }
      if (Array.isArray(entry.variable_costs_actual)) {
        variableCostsActual = entry.variable_costs_actual.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
      } else if (entry.variable_cost_actual) {
        variableCostsActual = parseFloat(entry.variable_cost_actual) || 0;
      }
      const operationalExpenseActual = fixedCostsActual + variableCostsActual;
      
      // Use the pre-calculated profit/loss values from the data if available
      const budgetProfit = parseFloat(entry.budgeted_profit_loss ?? entry.budgetProfit ?? 0) || 
                          (salesBudget - (foodCostBudget + laborBudget + operationalExpenseBudget));
      const actualProfit = parseFloat(entry.actual_profit_loss ?? entry.actualProfit ?? 0) || 
                          (salesActual - (foodCostActual + laborActual + operationalExpenseActual));
      
      const processedEntry = {
        day: dayLabel,
        salesBudget,
        salesActual,
        foodCostBudget,
        foodCostActual,
        laborBudget,
        laborActual,
        operationalExpenseBudget,
        operationalExpenseActual,
        budgetProfit,
        actualProfit,
        profit: actualProfit // Keep for backward compatibility
      };
      
      return processedEntry;
    });

    setChartData(processedData);

    // Extract week range for title
    if (data.length > 0) {
      const firstEntry = data[0];
      if (firstEntry.week_start && firstEntry.week_end) {
        const startDate = new Date(firstEntry.week_start);
        const endDate = new Date(firstEntry.week_end);
        const startDay = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endDay = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        setWeekRange(`${startDay} - ${endDay}`);
      } else {
        setWeekRange('');
      }
    }

    // Calculate summary data (pie chart uses these totals so it stays in sync with the budget table)
    const summary = {
      totalSalesBudget: processedData.reduce((sum, item) => sum + item.salesBudget, 0),
      totalSalesActual: processedData.reduce((sum, item) => sum + item.salesActual, 0),
      totalFoodCostBudget: processedData.reduce((sum, item) => sum + item.foodCostBudget, 0),
      totalFoodCostActual: processedData.reduce((sum, item) => sum + item.foodCostActual, 0),
      totalLaborBudget: processedData.reduce((sum, item) => sum + item.laborBudget, 0),
      totalLaborActual: processedData.reduce((sum, item) => sum + item.laborActual, 0),
      totalOperationalExpenseBudget: processedData.reduce((sum, item) => sum + item.operationalExpenseBudget, 0),
      totalOperationalExpenseActual: processedData.reduce((sum, item) => sum + item.operationalExpenseActual, 0),
      totalProfit: processedData.reduce((sum, item) => sum + item.profit, 0)
    };

    setSummaryData(summary);
  }, [dashboardData]);

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
        beginAtZero: false, // Allow negative values for profit/loss
        suggestedMax: function(context) {
          // Get the maximum value from budget profit data only
          const maxValue = Math.max(...chartData.map(item => item.budgetProfit));
          // Add 20% padding above the max value
          return Math.ceil(maxValue * 1.2);
        },
        suggestedMin: function(context) {
          // Get the minimum value from budget profit data only
          const minValue = Math.min(...chartData.map(item => item.budgetProfit));
          // Add 20% padding below the min value
          return Math.floor(minValue * 1.2);
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curves
        borderWidth: 3,
      },
      point: {
        radius: 5,
        hoverRadius: 8,
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

  // Profit/Loss chart data - Budget only
  const profitChartData = {
    labels: chartData.map(item => item.day),
    datasets: [
      {
        label: 'Budget Profit/Loss',
        data: chartData.map(item => item.budgetProfit),
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        borderColor: 'rgba(24, 144, 255, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(24, 144, 255, 1)',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
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

  // Pie slices: same dollar totals as the budget table TOTAL row (Labor + COGS + Operating Expenses only)
  const computedCategories = useMemo(() => {
    const labor = Math.max(0, Number(summaryData.totalLaborBudget) || 0);
    const food = Math.max(0, Number(summaryData.totalFoodCostBudget) || 0);
    const ops = Math.max(0, Number(summaryData.totalOperationalExpenseBudget) || 0);
    return [
      { key: 'labor_budget', label: 'Labor Budget', value: labor },
      { key: 'food_cost', label: 'Food Cost (COGS)', value: food },
      { key: 'expenses', label: 'Operational Expense', value: ops },
    ];
  }, [
    summaryData.totalLaborBudget,
    summaryData.totalFoodCostBudget,
    summaryData.totalOperationalExpenseBudget,
  ]);

  const budgetAssumptions = useMemo(() => {
    const entries = Array.isArray(dashboardData?.data)
      ? dashboardData.data
      : Array.isArray(dashboardData?.daily_entries)
        ? dashboardData.daily_entries
        : Array.isArray(dashboardData)
          ? dashboardData
          : [];

    const totalSalesBudget = summaryData.totalSalesBudget || 0;
    const totalLaborBudget = summaryData.totalLaborBudget || 0;
    const totalFoodCostBudget = summaryData.totalFoodCostBudget || 0;

    const laborGoalFromBudget = totalSalesBudget > 0
      ? (totalLaborBudget / totalSalesBudget) * 100
      : 0;
    const cogsGoalFromBudget = totalSalesBudget > 0
      ? (totalFoodCostBudget / totalSalesBudget) * 100
      : 0;
    const rateFromBudget = entries.reduce((foundValue, entry) => {
      if (foundValue > 0) return foundValue;
      const rate = getEntryAverageHourlyRate(entry);
      return rate > 0 ? rate : foundValue;
    }, 0);

    return {
      laborGoal: parseNumericLikeTable(restaurantGoals?.labour_goal) || laborGoalFromBudget,
      cogsGoal: parseNumericLikeTable(restaurantGoals?.cogs_goal) || cogsGoalFromBudget,
      avgHourlyRate: parseNumericLikeTable(restaurantGoals?.avg_hourly_rate) || rateFromBudget,
    };
  }, [
    dashboardData,
    restaurantGoals,
    summaryData.totalFoodCostBudget,
    summaryData.totalLaborBudget,
    summaryData.totalSalesBudget,
  ]);

  const categoryPieData = useMemo(
    () => ({
      labels: computedCategories.map((c) => c.label),
      datasets: [
        {
          data: computedCategories.map((c) => Number(c.value) || 0),
          backgroundColor: computedCategories.map((c) => EXPENSE_PIE_PALETTE[c.key].bg),
          borderColor: computedCategories.map((c) => EXPENSE_PIE_PALETTE[c.key].border),
          borderWidth: 2,
        },
      ],
    }),
    [computedCategories]
  );

  const categoryPieOptions = useMemo(() => {
    const rawTotal =
      computedCategories.reduce((sum, c) => sum + (Math.abs(Number(c.value)) || 0), 0) || 1;
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const idx = context.dataIndex;
              const value = Number(computedCategories[idx]?.value) || 0;
              const percentage = ((Math.abs(value) / rawTotal) * 100).toFixed(1);
              const sign = value >= 0 ? '+' : '-';
              return `${context.label}: ${sign}${formatCurrency(Math.abs(value))} (${percentage}%)`;
            },
          },
        },
        sliceLabels: {
          color: '#ffffff',
          font: '600 10px Inter, system-ui, -apple-system, Segoe UI, Roboto',
          lineHeight: 12,
          lineSets: SLICE_INSIDE_LINE_SETS,
        },
      },
    };
  }, [computedCategories]);

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
    <div className="">     

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
                <h2 className="text-xl font-bold text-orange-600">
                  {startDate ? `Daily Budgeted Profit Loss Trend for week of ${new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Daily Budgeted Profit Loss Trend'}
                </h2>
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
                <h2 className="text-xl font-bold text-orange-600">Total Expense Allocation</h2>
              </div>
            </div>
            <div style={{ height: '300px' }}>
              <Pie
                key={`expense-pie-${summaryData.totalLaborBudget}-${summaryData.totalFoodCostBudget}-${summaryData.totalOperationalExpenseBudget}`}
                data={categoryPieData}
                options={categoryPieOptions}
              />
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p>This chart shows how your weekly expenses are allocated across Labor Budget, Food Cost (COGS), and Operational Expense.</p>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Budget assumptions (what budgets are based on) */}
      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24}>
          <Card className="h-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-orange-600 mb-1">Budget assumptions</h3>
                <p className="text-sm text-gray-600">
                  These settings are used to calculate your weekly budgets.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-600">Labor % target</div>
                  <div className="text-base font-semibold text-gray-900">
                    {formatAssumptionPercent(budgetAssumptions.laborGoal)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-600">COGS % target</div>
                  <div className="text-base font-semibold text-gray-900">
                    {formatAssumptionPercent(budgetAssumptions.cogsGoal)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-600">Avg hourly rate</div>
                  <div className="text-base font-semibold text-gray-900">
                    {formatAssumptionRate(budgetAssumptions.avgHourlyRate)}
                  </div>
                </div>
              </div>

              {canCreateBudget && (
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => navigate('/dashboard/labor-information')}
                  >
                    Edit labor & rate
                  </Button>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => navigate('/dashboard/food-cost-details')}
                  >
                    Edit COGS
                  </Button>
                </div>
              )}
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
