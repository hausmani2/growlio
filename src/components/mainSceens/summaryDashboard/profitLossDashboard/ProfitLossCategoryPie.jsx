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
      const payloadCategories = res.categories || res.data?.categories || [];
      
      // Enhanced categories including fixed and variable costs
      const enhancedCategories = [
        ...payloadCategories,
        // Add fixed costs if not already present
        ...(payloadCategories.find(c => c.key === 'fixed_costs') ? [] : [{
          key: 'fixed_costs',
          label: 'Fixed Costs',
          value: res.fixed_costs || res.data?.fixed_costs || 0
        }]),
        // Add variable costs if not already present
        ...(payloadCategories.find(c => c.key === 'variable_costs') ? [] : [{
          key: 'variable_costs',
          label: 'Variable Costs',
          value: res.variable_costs || res.data?.variable_costs || 0
        }])
      ];
      
      setCategories(enhancedCategories);
      setSignedValues(enhancedCategories.map((c) => c.value));
      
      // Store detailed breakdowns for dropdown functionality
      setDetailedBreakdowns({
        sales: res.sales_breakdown || res.data?.sales_breakdown || [],
        fixed_costs: res.fixed_costs_breakdown || res.data?.fixed_costs_breakdown || [],
        variable_costs: res.variable_costs_breakdown || res.data?.variable_costs_breakdown || [],
        labor: res.labor_breakdown || res.data?.labor_breakdown || [],
        cogs: res.cogs_breakdown || res.data?.cogs_breakdown || []
      });
    });
  }, [startDate, endDate, fetchProfitLossCategorySummary]);

  // Get current data based on selected view
  const currentData = useMemo(() => {
    if (selectedView === 'totals') {
      return categories;
    }
    
    // For detailed breakdowns, create mock data if not available
    const breakdownData = detailedBreakdowns[selectedView] || [];
    
    // If no breakdown data is available, create some sample data for demonstration
    if (breakdownData.length === 0) {
      switch (selectedView) {
        case 'sales':
          return [
            { key: 'in_store', label: 'In-Store', value: 4500 },
            { key: 'third_party', label: '3rd-Party', value: 800 },
            { key: 'online', label: 'Online Ordering', value: 700 }
          ];
        case 'fixed_costs':
          return [
            { key: 'rent', label: 'Rent', value: -2000 },
            { key: 'utilities', label: 'Utilities', value: -500 },
            { key: 'insurance', label: 'Insurance', value: -300 }
          ];
        case 'variable_costs':
          return [
            { key: 'marketing', label: 'Marketing', value: -400 },
            { key: 'packaging', label: 'Packaging', value: -200 },
            { key: 'supplies', label: 'Supplies', value: -150 }
          ];
        case 'labor':
          return [
            { key: 'wages', label: 'Wages', value: -2500 },
            { key: 'benefits', label: 'Benefits', value: -300 },
            { key: 'overtime', label: 'Overtime', value: -200 }
          ];
        case 'cogs':
          return [
            { key: 'food', label: 'Food Cost', value: -1800 },
            { key: 'beverages', label: 'Beverages', value: -400 },
            { key: 'supplies', label: 'Kitchen Supplies', value: -100 }
          ];
        default:
          return categories;
      }
    }
    
    return breakdownData;
  }, [selectedView, categories, detailedBreakdowns]);

  // Colors: sales green, others red/blue/orange/yellow
  const colors = useMemo(() => {
    const colorMap = {
      // Sales categories
      'sales': '#22c55e', // Green
      'sales_budget': '#22c55e', // Green
      'sales_actual': '#22c55e', // Green
      'in_store': '#22c55e', // Green
      'third_party': '#16a34a', // Darker green
      'online': '#10b981', // Teal green
      
      // Labor categories
      'labor': '#ef4444', // Red
      'labor_budget': '#ef4444', // Red
      'labor_actual': '#ef4444', // Red
      'wages': '#ef4444', // Red
      'benefits': '#dc2626', // Darker red
      'overtime': '#f87171', // Light red
      
      // COGS categories
      'food_cost': '#3b82f6', // Blue
      'cogs': '#3b82f6', // Blue
      'food': '#3b82f6', // Blue
      'beverages': '#2563eb', // Darker blue
      'kitchen supplies': '#60a5fa', // Light blue
      
      // Fixed costs
      'fixed_costs': '#f97316', // Orange
      'rent': '#f97316', // Orange
      'utilities': '#ea580c', // Darker orange
      'insurance': '#fb923c', // Light orange
      
      // Variable costs
      'variable_costs': '#eab308', // Yellow
      'marketing': '#eab308', // Yellow
      'packaging': '#ca8a04', // Darker yellow
      'supplies': '#facc15', // Light yellow
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
    { value: 'fixed_costs', label: 'Fixed Costs Breakdown' },
    { value: 'variable_costs', label: 'Variable Costs Breakdown' },
    { value: 'labor', label: 'Labor Breakdown' },
    { value: 'cogs', label: 'COGS Breakdown' }
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
          <span className="font-medium text-red-600"> Red</span>: Labor; 
          <span className="font-medium text-blue-600"> Blue</span>: COGS; 
          <span className="font-medium text-orange-600"> Orange</span>: Fixed Costs; 
          <span className="font-medium text-yellow-600"> Yellow</span>: Variable Costs
        </p>
      </div>
    </Card>
  );
};

export default ProfitLossCategoryPie;


