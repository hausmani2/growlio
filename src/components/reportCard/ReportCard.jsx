import React, { useMemo, useState, useEffect } from "react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { InfoCircleOutlined } from "@ant-design/icons";
import { DatePicker, Button, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

export const getColor = (value, goal) => {
  if (value > goal) return "#dc2626"; // red
  if (value < goal) return "#16a34a"; // green
  return "#facc15"; // yellow
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const formatCurrency = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0";
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const formatCompactCurrency = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0";
  if (Math.abs(v) >= 1000) {
    const k = v / 1000;
    const decimals = Math.abs(k) >= 10 ? 0 : 1;
    return `$${k.toFixed(decimals)}K`.replace(".0K", "K");
  }
  return formatCurrency(v);
};

const getGrade = (score) => {
  const s = clamp(Number(score) || 0, 0, 100);
  if (s >= 90) return "A";
  if (s >= 80) return "B";
  if (s >= 70) return "C";
  if (s >= 60) return "D";
  return "F";
};

const SCORE_COLORS = [
  "#7f1d1d",
  "#b91c1c",
  "#dc2626",
  "#ea580c",
  "#f59e0b",
  "#facc15",
  "#a3e635",
  "#84cc16",
  "#22c55e",
  "#16a34a",
];

const buildScoreSegments = (score) => {
  const totalSegments = 20;
  const per = 100 / totalSegments; // 5
  const filled = clamp(Math.round((Number(score) || 0) / per), 0, totalSegments);

  return Array.from({ length: totalSegments }, (_, i) => {
    // gradient from red -> green across the arc
    const t = totalSegments <= 1 ? 1 : i / (totalSegments - 1);
    const colorIdx = Math.round(t * (SCORE_COLORS.length - 1));
    const fill = i < filled ? SCORE_COLORS[colorIdx] : "#e5e7eb";
    return { name: `seg-${i}`, value: per, fill, isFilled: i < filled };
  });
};

const ScoreDonut = ({ score = 0, size = 200 }) => {
  const s = clamp(Number(score) || 0, 0, 100);
  const segments = useMemo(() => buildScoreSegments(s), [s]);
  const grade = useMemo(() => getGrade(s), [s]);

  // Calculate inner radius to leave proper space for text
  const innerRadius = Math.round(size * 0.40); // Increased from 0.33 to 0.40 for more text space
  const outerRadius = Math.round(size * 0.48);
  const centerY = size / 2;

  return (
    <div className="relative w-fit mx-auto" style={{ width: size, height: size }}>
      {/* Segmented arc with gaps (matches screenshot style better than stacked radial bars) */}
      <PieChart width={size} height={size}>
        <Pie
          data={segments}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={240}
          endAngle={-60}
          paddingAngle={2}
          stroke="transparent"
          isAnimationActive={false}
        >
          {segments.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>

      {/* Text overlay - positioned to fit within inner circle */}
      <div 
        className="absolute flex flex-col items-center justify-center"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${innerRadius * 2}px`,
          height: `${innerRadius * 2}px`,
          pointerEvents: 'none'
        }}
      >
        {/* Grade - Large and bold at top */}
        <div className="text-4xl font-bold text-gray-900 leading-none mb-0.5">
          {grade}
        </div>
        {/* Score - Very large and prominent */}
        <div className="text-6xl font-extrabold text-gray-900 leading-none tabular-nums">
          {Math.round(s)}
        </div>
      </div>
    </div>
  );
};

const MiniGauge = ({ label, goal, value, amount, deltaPct, percentage }) => {
  // percentage prop is actually the score value
  const scoreValue = percentage !== undefined && percentage !== null 
    ? clamp(Number(percentage) || 0, 0, 100)
    : null;
  
  // deltaPct prop is actually the percentage value
  const percentageValue = deltaPct !== undefined && deltaPct !== null
    ? clamp(Number(deltaPct) || 0, 0, 100)
    : clamp(Number(value) || 0, 0, 100);
  
  const g = clamp(Number(goal) || 0, 0, 100);
  const color = getColor(percentageValue, g);
  const isUp = Number(deltaPct) > 0;
  const deltaColor = isUp ? "text-red-600" : "text-green-600";
  const deltaSign = isUp ? "+" : "";

  // Use percentage for the progress bar visualization
  const data = useMemo(() => [{ name: label, value: percentageValue, fill: color }], [label, percentageValue, color]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-base font-semibold text-gray-900 flex items-center gap-1">
        GOAL {g}%
        <InfoCircleOutlined className="text-gray-400" />
      </div>

      <div className="relative mt-2">
        <RadialBarChart
          width={150}
          height={150}
          innerRadius="85%"
          outerRadius="100%"
          data={data}
          startAngle={210}
          endAngle={-30}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background dataKey="value" cornerRadius={10} />
        </RadialBarChart>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Center: Score (100) - percentage prop is actually the score */}
          <div className="text-4xl font-extrabold text-gray-900 tabular-nums leading-none mb-1">
            {scoreValue !== null ? Math.round(scoreValue) : Math.round(percentageValue)} <span className="text-sm text-gray-500 absolute top-10 ml-1">%</span>
          </div>
          {/* Below center: Dollar amount ($15,000) */}
          <div className="text-sm text-gray-900 font-semibold mb-0.5">
            {formatCurrency(amount || 0)}
          </div>
          {/* Below dollar: Percentage (16.95%) - deltaPct prop is actually the percentage */}
          {scoreValue !== null && deltaPct !== undefined && deltaPct !== null && (
            <div className="text-sm font-semibold text-gray-900 leading-none">
              {Math.round(percentageValue)}%
            </div>
          )}
        </div>
      </div>

      {/* Label at bottom (Labor) */}
      <div className="text-lg font-bold text-gray-900">{label}</div>
    </div>
  );
};

const ReportCard = ({
  title = "Report Card",
  dateLabel = "Last 30 Days (10/30/25 - Present)",
  score = 85,
  goals = { labor: 30, cogs: 32, rent: 10 },
  metrics = {
    labor: { value: 38, amount: 15000, deltaPct: 13 },
    cogs: { value: 31, amount: 12000, deltaPct: 6 },
    rent: { value: 18, amount: 7000, deltaPct: -2 },
  },
  summary = { sales: 40000, profit: 6000 },
  onDateRangeChange,
  loading = false,
}) => {
  // Initialize with last month (default for report card)
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(1, 'month').startOf('month'),
    dayjs().subtract(1, 'month').endOf('month'),
  ]);
  const [quickSelectLabel, setQuickSelectLabel] = useState('Last Month');

  // Format date label based on selected range
  const formattedDateLabel = useMemo(() => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].format('MMM D, YYYY');
      const end = dateRange[1].format('MMM D, YYYY');
      return `${start} - ${end}`;
    }
    return dateLabel;
  }, [dateRange, dateLabel]);

  // Handle date range change
  const handleDateChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates);
      // Update quick select label based on selection
      const today = dayjs();
      const lastMonthStart = today.subtract(1, 'month').startOf('month');
      const lastMonthEnd = today.subtract(1, 'month').endOf('month');
      const last3MonthsStart = today.subtract(3, 'month').startOf('month');
      const last6MonthsStart = today.subtract(6, 'month').startOf('month');
      const lastYearStart = today.subtract(1, 'year').startOf('year');
      const lastYearEnd = today.subtract(1, 'year').endOf('year');
      const currentMonthStart = today.startOf('month');
      const currentMonthEnd = today.endOf('month');
      
      if (dates[0].isSame(currentMonthStart, 'day') && dates[1].isSame(currentMonthEnd, 'day')) {
        setQuickSelectLabel('Current Month');
      } else if (dates[0].isSame(lastMonthStart, 'day') && dates[1].isSame(lastMonthEnd, 'day')) {
        setQuickSelectLabel('Last Month');
      } else if (dates[0].isSame(last3MonthsStart, 'day') && dates[1].isSame(currentMonthEnd, 'day')) {
        setQuickSelectLabel('Last 3 Months');
      } else if (dates[0].isSame(last6MonthsStart, 'day') && dates[1].isSame(currentMonthEnd, 'day')) {
        setQuickSelectLabel('Last 6 Months');
      } else if (dates[0].isSame(lastYearStart, 'day') && dates[1].isSame(lastYearEnd, 'day')) {
        setQuickSelectLabel('Last Year');
      } else {
        setQuickSelectLabel('Custom');
      }
      
      if (onDateRangeChange) {
        onDateRangeChange(dates);
      }
    }
  };

  // Quick select handlers
  const handleQuickSelect = (option) => {
    let newDates = null;
    switch (option) {
      case 'current_month':
        newDates = [dayjs().startOf('month'), dayjs().endOf('month')];
        setQuickSelectLabel('Current Month');
        break;
      case 'last_month':
        newDates = [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')];
        setQuickSelectLabel('Last Month');
        break;
      case 'last_3_months':
        newDates = [dayjs().subtract(3, 'month').startOf('month'), dayjs().endOf('month')];
        setQuickSelectLabel('Last 3 Months');
        break;
      case 'last_6_months':
        newDates = [dayjs().subtract(6, 'month').startOf('month'), dayjs().endOf('month')];
        setQuickSelectLabel('Last 6 Months');
        break;
      case 'last_year':
        newDates = [dayjs().subtract(1, 'year').startOf('year'), dayjs().subtract(1, 'year').endOf('year')];
        setQuickSelectLabel('Last Year');
        break;
      case 'custom':
        setQuickSelectLabel('Custom');
        return; // Let user select custom range
      default:
        return;
    }
    if (newDates) {
      handleDateChange(newDates);
    }
  };

  const quickSelectMenu = {
    items: [
      { key: 'current_month', label: 'Current Month' },
      { key: 'last_month', label: 'Last Month' },
      { key: 'last_3_months', label: 'Last 3 Months' },
      { key: 'last_6_months', label: 'Last 6 Months' },
      { key: 'last_year', label: 'Last Year' },
      { key: 'custom', label: 'Custom' },
    ],
    onClick: ({ key }) => handleQuickSelect(key),
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-3">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 flex-wrap">
        <div className="text-2xl font-bold text-gray-900">{title}</div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xs font-semibold text-gray-900 hidden lg:block">{formattedDateLabel}</div>
          <div className="flex items-center gap-2">
            {/* Quick Select Dropdown */}
            <Dropdown
              menu={quickSelectMenu}
              trigger={['click']}
              disabled={loading}
            >
              <Button
                style={{
                  borderRadius: '6px',
                  height: '40px',
                  minWidth: '120px'
                }}
                disabled={loading}
              >
                {quickSelectLabel} <DownOutlined />
              </Button>
            </Dropdown>
            
            {/* Date Range Picker */}
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            format="MMM D, YYYY"
              placeholder={['Start Date', 'End Date']}
              disabled={loading}
            style={{
              borderRadius: '6px',
                width: 'auto',
                minWidth: '280px',
                height: '40px',
                cursor: 'pointer'
            }}
            allowClear={false}
              size="middle"
            separator=" to "
              showTime={false}
              inputReadOnly={true}
              showToday={true}
            popupStyle={{ zIndex: 1000 }}
            getPopupContainer={(trigger) => trigger.parentNode}
              disabledDate={() => false}
          />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
        {/* Left: Score */}
        <div className="flex flex-col items-center justify-center">
          <ScoreDonut score={score} size={200} />
          <div className="mt-4 text-center leading-tight">
            <div className="text-2xl font-bold text-gray-900">Profitability</div>
            <div className="text-2xl font-bold text-gray-900">Score</div>
          </div>
        </div>

        {/* Right: Gauges + summary */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <MiniGauge
              label="Labor"
              goal={goals.labor}
              value={metrics.labor?.value}
              percentage={metrics.labor?.percentage}
              amount={metrics.labor?.amount}
              deltaPct={metrics.labor?.deltaPct}
            />
            <MiniGauge
              label="COGs"
              goal={goals.cogs}
              value={metrics.cogs?.value}
              percentage={metrics.cogs?.percentage}
              amount={metrics.cogs?.amount}
              deltaPct={metrics.cogs?.deltaPct}
            />
            <MiniGauge
              label="Rent"
              goal={goals.rent}
              value={metrics.rent?.value}
              percentage={metrics.rent?.percentage}
              amount={metrics.rent?.amount}
              deltaPct={metrics.rent?.deltaPct}
            />
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="text-lg font-medium text-gray-900">
              Sales:{" "}
              <span className="text-green-500 font-bold">{formatCurrency(summary.sales || 0)}</span>
            </div>
            <div className="text-lg font-medium text-gray-900">
              Profit:{" "}
              <span className="text-green-500 font-bold">{formatCurrency(summary.profit || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;


