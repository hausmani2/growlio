import React, { useMemo, useState } from 'react';
import { Card, Select } from 'antd';
import dayjs from 'dayjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

const ProfitLossTrendLine = ({ dashboardData, viewMode = 'daily' }) => {
  const [selectedMetric, setSelectedMetric] = useState('sales');
  // Helper function to determine if data is weekly format
  const isWeeklyData = (data) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    const firstEntry = data[0];
    return Object.prototype.hasOwnProperty.call(firstEntry, 'week_start') && Object.prototype.hasOwnProperty.call(firstEntry, 'week_end');
  };

  // Helper function to determine if data is monthly format
  const isMonthlyData = (data) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    const firstEntry = data[0];
    return Object.prototype.hasOwnProperty.call(firstEntry, 'month_start') && Object.prototype.hasOwnProperty.call(firstEntry, 'month_end');
  };

  // Helper function to format date for display
  const formatDateForDisplay = (dateString, isWeekly = false, isMonthly = false) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = dayjs(dateString);
      if (isMonthly) {
        return date.format('MMM YYYY');
      } else if (isWeekly) {
        return `Week ${date.format('MMM DD')}`;
      } else {
        return date.format('MMM DD');
      }
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const { labels, budgetDataset, actualDataset, weekRange } = useMemo(() => {
    const entries = Array.isArray(dashboardData?.data) ? dashboardData.data : [];
    
    if (entries.length === 0) {
      return { labels: [], budgetDataset: [], actualDataset: [], weekRange: '' };
    }

    // Determine data format
    const isWeekly = isWeeklyData(entries);
    const isMonthly = isMonthlyData(entries);
    
    // For weekly data, we need to get the week range for the title
    let weekRange = '';
    if (isWeekly && entries.length > 0) {
      const firstEntry = entries[0];
      if (firstEntry.week_start && firstEntry.week_end) {
        const startDate = dayjs(firstEntry.week_start);
        const endDate = dayjs(firstEntry.week_end);
        weekRange = `${startDate.format('MMM DD')} - ${endDate.format('MMM DD')}`;
      }
    }

    const labels = entries.map((entry, index) => {
      // Use appropriate date field based on data format
      let dateField;
      if (isMonthly) {
        dateField = entry.month_start;
      } else if (isWeekly) {
        dateField = entry.week_start;
      } else {
        dateField = entry.date || entry.day;
      }
      
      const formattedLabel = formatDateForDisplay(dateField, isWeekly, isMonthly);
      
      return formattedLabel;
    });

    // Extract data based on selected metric
    const budgetDataset = entries.map((entry) => {
      let budgetValue = 0;
      
      if (selectedMetric === 'sales') {
        budgetValue = parseFloat(entry.sales_budget ?? entry.salesBudget ?? 0) || 0;
      } else if (selectedMetric === 'labor') {
        budgetValue = parseFloat(entry.labour ?? entry.labor_budget ?? entry.laborBudget ?? entry.budgeted_labor_dollars ?? 0) || 0;
      } else if (selectedMetric === 'cogs') {
        budgetValue = parseFloat(entry.food_cost ?? entry.food_cost_budget ?? entry.foodCostBudget ?? 0) || 0;
      }
      
      return Number(budgetValue);
    });

    const actualDataset = entries.map((entry) => {
      let actualValue = 0;
      
      if (selectedMetric === 'sales') {
        actualValue = parseFloat(entry.sales_actual ?? entry.actual_sales ?? entry.salesActual ?? 0) || 0;
      } else if (selectedMetric === 'labor') {
        actualValue = parseFloat(entry.labour_actual ?? entry.labor ?? entry.laborActual ?? entry.actual_labor_dollars ?? entry.amount ?? 0) || 0;
      } else if (selectedMetric === 'cogs') {
        actualValue = parseFloat(entry.food_cost_actual ?? entry.food_cost_actuals ?? entry.foodCostActual ?? 0) || 0;
      }
      
      return Number(actualValue);
    });

    return {
      labels,
      budgetDataset,
      actualDataset,
      weekRange,
    };
  }, [dashboardData, viewMode, selectedMetric]);

  // Get labels and colors based on selected metric
  const getMetricLabels = () => {
    switch (selectedMetric) {
      case 'labor':
        return { budget: 'Labor Budget', actual: 'Labor Actual' };
      case 'cogs':
        return { budget: 'COGS Budget', actual: 'COGS Actual' };
      default:
        return { budget: 'Sales Budget', actual: 'Sales Actual' };
    }
  };

  const metricLabels = getMetricLabels();

  const data = {
    labels,
    datasets: [
      {
        label: metricLabels.budget,
        data: budgetDataset,
        backgroundColor: 'rgba(24, 144, 255, 0.8)',
        borderColor: 'rgba(24, 144, 255, 1)',
        borderWidth: 2,
      },
      {
        label: metricLabels.actual,
        data: actualDataset,
        backgroundColor: 'rgba(82, 196, 26, 0.8)',
        borderColor: 'rgba(82, 196, 26, 1)',
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y || 0;
            return `${context.dataset.label}: $${Number(value).toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `$${Number(value).toLocaleString()}`;
          }
        }
      }
    }
  };

  // Determine the appropriate title based on data format and selected metric
  const getTitle = () => {
    const metricName = selectedMetric === 'labor' ? 'Labor' : (selectedMetric === 'cogs' ? 'COGS' : 'Sales');
    
    if (!dashboardData?.data || !Array.isArray(dashboardData.data) || dashboardData.data.length === 0) {
      return `Daily ${metricName}: Budget vs Actual`;
    }
    
    const isWeekly = isWeeklyData(dashboardData.data);
    const isMonthly = isMonthlyData(dashboardData.data);
    
    if (isMonthly) {
      return `Monthly ${metricName}: Budget vs Actual`;
    } else if (isWeekly) {
      return `Daily ${metricName}: Budget vs Actual for week of ${weekRange}`;
    } else {
      return `Daily ${metricName}: Budget vs Actual`;
    }
  };

  return (
    <Card className="h-full">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-gray-200 gap-4">
          <h2 className="text-xl font-bold text-orange-600">{getTitle()}</h2>
          <Select
            value={selectedMetric}
            onChange={setSelectedMetric}
            style={{ width: 200 }}
            options={[
              { label: 'Sales (Budget to Actual)', value: 'sales' },
              { label: 'Labor (Budget to Actual)', value: 'labor' },
              { label: 'COGS (Budget to Actual)', value: 'cogs' },
            ]}
          />
        </div>
      </div>
      <div style={{ height: '300px' }}>
        {(budgetDataset.length > 0 || actualDataset.length > 0) && 
         (budgetDataset.some(value => value !== 0) || actualDataset.some(value => value !== 0)) ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-sm">No {selectedMetric === 'labor' ? 'labor' : (selectedMetric === 'cogs' ? 'COGS' : 'sales')} data available</p>
              <p className="text-xs text-gray-400 mt-1">
                {(budgetDataset.length > 0 || actualDataset.length > 0) ? 'All values are zero' : 'No data points found'}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProfitLossTrendLine;


