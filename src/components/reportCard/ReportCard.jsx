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
import { DatePicker } from "antd";
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

const ScoreDonut = ({ score = 0, size = 170 }) => {
  const s = clamp(Number(score) || 0, 0, 100);
  const segments = useMemo(() => buildScoreSegments(s), [s]);
  const grade = useMemo(() => getGrade(s), [s]);

  return (
    <div className="relative w-fit">
      {/* Segmented arc with gaps (matches screenshot style better than stacked radial bars) */}
      <PieChart width={size} height={size}>
        <Pie
          data={segments}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={Math.round(size * 0.33)}
          outerRadius={Math.round(size * 0.48)}
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

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold text-gray-900 leading-none">
          {grade}
        </div>
        <div className="text-6xl font-extrabold text-gray-900 leading-none tabular-nums">
          {Math.round(s)}
        </div>
      </div>
    </div>
  );
};

const MiniGauge = ({ label, goal, value, amount, deltaPct }) => {
  const v = clamp(Number(value) || 0, 0, 100);
  const g = clamp(Number(goal) || 0, 0, 100);
  const color = getColor(v, g);
  const isUp = Number(deltaPct) > 0;
  const deltaColor = isUp ? "text-red-600" : "text-green-600";
  const deltaSign = isUp ? "+" : "";

  const data = useMemo(() => [{ name: label, value: v, fill: color }], [label, v, color]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs font-semibold text-gray-900 flex items-center gap-1">
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
          <div className="text-xl font-extrabold text-gray-900 tabular-nums leading-none">
            {Math.round(v)}%
          </div>
          <div className="text-xs text-gray-700 font-semibold">{formatCurrency(amount)}</div>
          <div className={`text-[11px] font-semibold ${deltaColor}`}>
            {deltaSign}
            {Math.abs(Number(deltaPct) || 0)}%
          </div>
        </div>
      </div>

      <div className=" text-base font-bold text-gray-900">{label}</div>
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
}) => {
  // Initialize with last 30 days
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

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
      if (onDateRangeChange) {
        onDateRangeChange(dates);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-2xl font-bold text-gray-900 lg:ml-14">{title}</div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xs font-semibold text-gray-900">{formattedDateLabel}</div>
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            format="MMM D, YYYY"
            className="border border-gray-200 rounded-md"
            style={{
              borderRadius: '6px',
              height: '32px',
            }}
            size="small"
            allowClear={false}
            separator=" to "
            popupStyle={{ zIndex: 1000 }}
            getPopupContainer={(trigger) => trigger.parentNode}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-center">
        {/* Left: Score */}
        <div className="flex flex-col items-center">
          <ScoreDonut score={score} size={170} />
          <div className="mt-3 text-center leading-[1.05]">
            <div className="text-xl font-bold text-gray-900">Profitability</div>
            <div className="text-xl font-bold text-gray-900">Score</div>
          </div>
        </div>

        {/* Right: Gauges + summary */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <MiniGauge
              label="Labor"
              goal={goals.labor}
              value={metrics.labor?.value}
              amount={metrics.labor?.amount}
              deltaPct={metrics.labor?.deltaPct}
            />
            <MiniGauge
              label="COGs"
              goal={goals.cogs}
              value={metrics.cogs?.value}
              amount={metrics.cogs?.amount}
              deltaPct={metrics.cogs?.deltaPct}
            />
            <MiniGauge
              label="Rent"
              goal={goals.rent}
              value={metrics.rent?.value}
              amount={metrics.rent?.amount}
              deltaPct={metrics.rent?.deltaPct}
            />
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="text-lg font-medium text-gray-900">
              Sales:{" "}
              <span className="text-green-400 font-bold">{formatCompactCurrency(summary.sales)}</span>
            </div>
            <div className="text-lg font-medium text-gray-900">
              Profit:{" "}
              <span className="text-green-400 font-bold">{formatCompactCurrency(summary.profit)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;


