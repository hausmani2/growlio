import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from 'antd';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import useStore from '../../../../store/store';

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
  const lastKey = useRef('');

  useEffect(() => {
    if (!startDate || !endDate) return;
    const key = `${startDate}|${endDate}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    fetchProfitLossCategorySummary(startDate, endDate).then((res) => {
      if (!res) return;
      const payloadCategories = res.categories || res.data?.categories || [];
      setCategories(payloadCategories);
      setSignedValues(payloadCategories.map((c) => c.value));
    });
  }, [startDate, endDate, fetchProfitLossCategorySummary]);

  // Colors by sign: positive green, negative red; consistent shades
  const colors = useMemo(() => {
    const greens = ['#22c55e', '#16a34a', '#10b981', '#34d399'];
    const reds = ['#ef4444', '#dc2626', '#f87171', '#fb7185'];
    let g = 0, r = 0;
    const bg = categories.map((c) => {
      const v = Number(c.value || 0);
      if (v >= 0) return greens[g++ % greens.length];
      return reds[r++ % reds.length];
    });
    const border = bg.map(col => col);
    return { bg, border };
  }, [categories]);

  const data = {
    labels: categories.map((c) => c.label),
    datasets: [
      {
        data: categories.map((c) => Math.abs(Number(c.value || 0)) || 0.0001),
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
            const signed = signedValues[idx] || 0;
            const pct = ((ctx.parsed / total) * 100).toFixed(1);
            const sign = signed >= 0 ? '+' : '-';
            return `${ctx.label}: ${sign}$${Math.abs(signed).toLocaleString()} (${pct}%)`;
          }
        }
      },
      sliceLabels: { color: '#fff' }
    }
  };

  return (
    <Card className="h-full">
      <div className="mb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-bold text-orange-600"> Budget vs Actual Sales</h2>
        </div>
      </div>
      <div style={{ height: '300px' }}>
        <Pie data={data} options={options} />
      </div>
      <div className="mt-3 text-sm text-gray-600">
        <p><span className="font-medium">Green</span>: positive contribution to profit; <span className="font-medium">Red</span>: negative impact.</p>
      </div>
    </Card>
  );
};

export default ProfitLossCategoryPie;


