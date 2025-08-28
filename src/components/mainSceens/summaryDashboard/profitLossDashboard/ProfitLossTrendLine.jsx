import React, { useMemo } from 'react';
import { Card } from 'antd';
import dayjs from 'dayjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

const ProfitLossTrendLine = ({ dashboardData, viewMode = 'daily' }) => {
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

  const { labels, dataset } = useMemo(() => {
    const entries = Array.isArray(dashboardData?.data) ? dashboardData.data : [];
    
    if (entries.length === 0) {
      return { labels: [], dataset: [] };
    }

    // Determine data format
    const isWeekly = isWeeklyData(entries);
    const isMonthly = isMonthlyData(entries);
    
    

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

    const profits = entries.map((entry, index) => {
      // Try multiple possible field names for profit/loss data
      const profitLoss = parseFloat(entry.profit_loss ?? entry.profit ?? entry.net_profit ?? 0) || 0;
      
      // If no direct profit field, calculate from components
      if (profitLoss === 0) {
        const salesActual = parseFloat(entry.sales_actual ?? entry.actual_sales ?? entry.sales_budget ?? 0) || 0;
        const foodActual = parseFloat(entry.food_cost_actual ?? entry.cogs_actual ?? entry.food_cost ?? 0) || 0;
        const laborActual = parseFloat(entry.labour_actual ?? entry.labor_hours_actual ?? entry.actual_labor_dollars ?? entry.labour ?? 0) || 0;
        
        // Calculate fixed and variable costs
        let fixedCosts = 0;
        let variableCosts = 0;
        
        if (Array.isArray(entry.fixed_costs)) {
          fixedCosts = entry.fixed_costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
        }
        
        if (Array.isArray(entry.variable_costs)) {
          variableCosts = entry.variable_costs.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);
        }
        
        const calculatedProfit = salesActual - (foodActual + laborActual + fixedCosts + variableCosts);
        
        
        
        return Number(calculatedProfit);
      }
      
      
      return Number(profitLoss);
    });

    

    return {
      labels,
      dataset: profits,
    };
  }, [dashboardData, viewMode]);

  const data = {
    labels,
    datasets: [
      {
        label: 'Profit/Loss',
        data: dataset,
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

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y || 0;
            return `Profit/Loss: $${Number(value).toLocaleString()}`;
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

  // Determine the appropriate title based on data format
  const getTitle = () => {
    if (!dashboardData?.data || !Array.isArray(dashboardData.data) || dashboardData.data.length === 0) {
      return 'Profit/Loss Trend';
    }
    
    const isWeekly = isWeeklyData(dashboardData.data);
    const isMonthly = isMonthlyData(dashboardData.data);
    
    if (isMonthly) {
      return 'Monthly Profit/Loss Trend';
    } else if (isWeekly) {
      return 'Weekly Profit/Loss Trend';
    } else {
      return 'Daily Profit/Loss Trend';
    }
  };

  return (
    <Card className="h-full">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-bold text-orange-600">{getTitle()}</h2>
        </div>
      </div>
      <div style={{ height: '300px' }}>
        {dataset.length > 0 && dataset.some(value => value !== 0) ? (
          <Line data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-sm">No profit/loss data available</p>
              <p className="text-xs text-gray-400 mt-1">
                {dataset.length > 0 ? 'All values are zero' : 'No data points found'}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProfitLossTrendLine;


