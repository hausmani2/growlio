import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Select } from 'antd';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import useStore from '../../../../store/store';

const { Option } = Select;

// Lightweight in-slice label plugin
const SliceLabelsPlugin = {
  id: 'sliceLabels',
  afterDatasetsDraw(chart, args, pluginOptions) {
    const { ctx } = chart;
    const dataset = chart.data?.datasets?.[0];
    if (!dataset) return;
    const meta = chart.getDatasetMeta(0);
    const total = (dataset.data || []).reduce((a, b) => a + (Number(b) || 0), 0) || 1;
    ctx.save();
    meta.data.forEach((arc, index) => {
      const value = Number(dataset.data[index]) || 0;
      if (!value) return;
      const percentage = (value / total) * 100;
      if (percentage < 3) return; // skip tiny slices
      const label = chart.data?.labels?.[index] || '';
      const props = arc.getProps(['startAngle', 'endAngle', 'innerRadius', 'outerRadius', 'x', 'y'], true);
      const angle = (props.startAngle + props.endAngle) / 2;
      const r = props.innerRadius + (props.outerRadius - props.innerRadius) * 0.6;
      const x = props.x + Math.cos(angle) * r;
      const y = props.y + Math.sin(angle) * r;
      ctx.fillStyle = pluginOptions?.color || '#fff';
      ctx.font = pluginOptions?.font || 'bold 11px Inter, system-ui, -apple-system, Segoe UI, Roboto';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = `${label} ${percentage.toFixed(1)}%`;
      ctx.fillText(text, x, y);
    });
    ctx.restore();
  }
};

ChartJS.register(ArcElement, Tooltip, Legend, SliceLabelsPlugin);

const ProfitLossCategoryPie = ({ startDate, endDate }) => {
  const fetchProfitLossCategorySummary = useStore((s) => s.fetchProfitLossCategorySummary);
  const [categories, setCategories] = useState([]);
  const [signedValues, setSignedValues] = useState([]);
  const [selectedView, setSelectedView] = useState('totals');
  const [detailedBreakdowns, setDetailedBreakdowns] = useState({});
  const lastKey = useRef('');

  useEffect(() => {
    if (!startDate || !endDate) return;
    const key = `${startDate}|${endDate}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    fetchProfitLossCategorySummary(startDate, endDate).then((res) => {
      if (!res) return;
      
      // Handle the new data structure
      const payloadCategories = res.categories || res.data?.categories || [];
      const subcategories = res.subcategories || res.data?.subcategories || {};
      
      setCategories(payloadCategories);
      setSignedValues(payloadCategories.map((c) => c.value));
      
      // Store detailed breakdowns for dropdown functionality using subcategories
      setDetailedBreakdowns({
        sales: subcategories.sales || [],
        labor: subcategories.labor || [],
        food: subcategories.food || [],
        fixed_expenses: subcategories.fixed_expenses || [],
        variable_expenses: subcategories.variable_expenses || [],
      });
    });
  }, [startDate, endDate, fetchProfitLossCategorySummary]);

  // Get current data based on selected view
  const currentData = useMemo(() => {
    let data = [];
    
    if (selectedView === 'totals') {
      data = categories;
    } else {
      // For detailed breakdowns, use the actual subcategories data
      const breakdownData = detailedBreakdowns[selectedView] || [];
      data = breakdownData;
    }
    
    // Keep all data including both labor actual and budget
    return data;
  }, [selectedView, categories, detailedBreakdowns]);

  // Colors: sales green, others red/blue/orange/yellow
  const colors = useMemo(() => {
    const colorMap = {
      // Sales categories
      'sales': '#22c55e', // Green
      'in_store': '#22c55e', // Green
      'app_online': '#16a34a', // Darker green
      'third_party': '#10b981', // Teal green
      
      // Labor categories
      'labor': '#ef4444', // Red
      'labor_actual': '#ef4444', // Red
      'labor_budget': '#dc2626', // Darker red
      
      // Food/COGS categories
      'food': '#3b82f6', // Blue
      'cogs_actual': '#3b82f6', // Blue
      'cogs_budget': '#2563eb', // Darker blue
      
      // Fixed expenses
      'fixed_expenses': '#f97316', // Orange
      'fixed_rent': '#f97316', // Orange
      
      // Variable expenses
      'variable_expenses': '#eab308', // Yellow
      'variable_royalty': '#eab308', // Yellow
      'variable_brand/ad fund': '#ca8a04', // Darker yellow
      

    };
    
    const bg = currentData.map((c) => {
      const key = c.key?.toLowerCase() || c.label?.toLowerCase() || '';
      return colorMap[key] || '#6b7280'; // Default gray
    });
    const border = bg.map(col => col);
    return { bg, border };
  }, [currentData]);

  const data = {
    labels: currentData.map((c) => c.label),
    datasets: [
      {
        data: currentData.map((c) => Math.abs(Number(c.value || 0)) || 0.0001),
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const idx = ctx.dataIndex;
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0) || 1;
            const signed = currentData[idx]?.value || 0;
            const pct = ((ctx.parsed / total) * 100).toFixed(1);
            const sign = signed >= 0 ? '+' : '-';
            return `${ctx.label}: ${sign}$${Math.abs(signed).toLocaleString()} (${pct}%)`;
          }
        }
      },
      sliceLabels: { color: '#fff' }
    }
  };

  // Dropdown options
  const dropdownOptions = [
    { value: 'totals', label: 'Totals' },
    { value: 'sales', label: 'Sales Breakdown' },
    { value: 'labor', label: 'Labor Breakdown' },
    { value: 'food', label: 'Food Cost Breakdown' },
    { value: 'fixed_expenses', label: 'Fixed Expenses Breakdown' },
    { value: 'variable_expenses', label: 'Variable Expenses Breakdown' },
  ];

  // Handle dropdown change
  const handleViewChange = (value) => {
    setSelectedView(value);
  };

  return (
    <Card className="h-full">
      <div className="mb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 pb-3 border-b border-gray-200 gap-2">
          <h2 className="text-xl font-bold text-orange-600">P&L Breakdown</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">View:</span>
            <Select
              value={selectedView}
              onChange={handleViewChange}
              style={{ width: 180  , height: 40 }}
              size="small"
              placeholder="Select view"
            >
              {dropdownOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </div>
      <div style={{ height: '300px' }}>
        <Pie data={data} options={options} />
      </div>
      <div className="mt-3 text-sm text-gray-600">
        <p>
          <span className="font-medium text-green-600">Green</span>: Sales; 
          <span className="font-medium text-red-600"> Red</span>: Labor Actual; 
          <span className="font-medium text-red-800"> Dark Red</span>: Labor Budget; 
          <span className="font-medium text-blue-600"> Blue</span>: Food Cost; 
          <span className="font-medium text-orange-600"> Orange</span>: Fixed Expenses; 
          <span className="font-medium text-yellow-600"> Yellow</span>: Variable Expenses;
        </p>
      </div>
    </Card>
  );
};

export default ProfitLossCategoryPie;


