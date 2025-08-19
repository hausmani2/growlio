import React, { useMemo } from 'react';
import { Card } from 'antd';
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

const ProfitLossTrendLine = ({ dashboardData }) => {
  const { labels, dataset } = useMemo(() => {
    const entries = Array.isArray(dashboardData?.data) ? dashboardData.data : [];
    const labels = entries.map((e) => e.day || e.date);

    const profits = entries.map((entry) => {
      const salesActual = parseFloat(entry.sales_actual ?? entry.actual_sales ?? 0) || 0;
      const foodActual = parseFloat(entry.food_cost_actual ?? entry.cogs_actual ?? 0) || 0;
      const laborActual = parseFloat(entry.labour_actual ?? entry.labor_hours_actual ?? entry.actual_labor_dollars ?? 0) || 0;
      const fallback = salesActual - (foodActual + laborActual);
      const profit = parseFloat(entry.profit_loss ?? entry.profit ?? fallback) || 0;
      return Number(profit);
    });

    return {
      labels,
      dataset: profits,
    };
  }, [dashboardData]);

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

  return (
    <Card className="h-full">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-bold text-orange-600">Daily Profit/Loss Trend</h2>
        </div>
      </div>
      <div style={{ height: '300px' }}>
        <Line data={data} options={options} />
      </div>
    </Card>
  );
};

export default ProfitLossTrendLine;


