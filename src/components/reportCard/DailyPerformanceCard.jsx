import React, { useMemo } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { CalendarOutlined, FlagOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const formatCompactCurrency = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0";
  if (Math.abs(v) >= 1000) {
    const k = v / 1000;
    const decimals = Math.abs(k) >= 10 ? 0 : 1;
    return `$${k.toFixed(decimals)}K`.replace(".0K", "K");
  }
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

// Get color for score: green for >= 70, yellow for < 70
const getScoreColor = (score) => {
  const s = clamp(Number(score) || 0, 0, 100);
  return s >= 70 ? "#22c55e" : "#facc15"; // green : yellow
};

// Daily Gauge Component
const DailyGauge = ({ score, day, date, amount, isNegative = false }) => {
  const s = clamp(Number(score) || 0, 0, 100);
  const color = getScoreColor(s);
  const amountColor = isNegative ? "text-red-600" : "text-green-600";
  
  // Calculate angle for the white circle indicator
  // Score 0 = 180deg (left), Score 100 = 0deg (right)
  const angle = 180 - (s / 100) * 180;
  const radius = 50; // Half of width/height (120/2 = 60, but using 50 for inner radius)
  const centerX = 60;
  const centerY = 60;
  const indicatorRadius = 60; // Outer radius
  const indicatorX = centerX + Math.cos((angle - 90) * Math.PI / 180) * indicatorRadius;
  const indicatorY = centerY - Math.sin((angle - 90) * Math.PI / 180) * indicatorRadius;
  
  const data = useMemo(() => [{ name: "score", value: s, fill: color }], [s, color]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 120, height: 120 }}>
        <RadialBarChart
          width={120}
          height={120}
          innerRadius="85%"
          outerRadius="100%"
          data={data}
          startAngle={210}
          endAngle={-30}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar 
            background={{ fill: "#e5e7eb" }} 
            dataKey="value" 
            cornerRadius={8}
            isAnimationActive={false}
          />
        </RadialBarChart>
        
        {/* Score number in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-2xl font-extrabold text-gray-900 tabular-nums">
            {Math.round(s)}
          </div>
        </div>
        
     
      </div>
      
      {/* Day and date */}
      <div className="mt-2 text-xs font-medium text-gray-700 text-center">
        {day}
      </div>
      <div className="text-xs text-gray-500 text-center">
        {date}
      </div>
      
      {/* Amount */}
      <div className={`mt-1 text-sm font-semibold ${amountColor}`}>
        {isNegative ? "-" : ""}{formatCompactCurrency(Math.abs(amount))}
      </div>
    </div>
  );
};

// Key Finding Item Component
const FindingItem = ({ text, type = "success" }) => {
  const iconClass = 
    type === "error" ? "text-red-600" :
    type === "warning" ? "text-yellow-500" :
    "text-green-600";
  
  const Icon = type === "success" ? CheckCircleOutlined : FlagOutlined;

  return (
    <div className="flex items-start gap-2">
      <Icon className={`${iconClass} text-lg flex-shrink-0 mt-0.5`} />
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  );
};

const DailyPerformanceCard = ({ onCloseOutDays }) => {
  // Static data for 7 days
  const dailyData = [
    { score: 73, day: "Mon", date: "10/27", amount: 1200, isNegative: false },
    { score: 65, day: "Tue", date: "10/28", amount: 900, isNegative: false },
    { score: 87, day: "Wed", date: "10/29", amount: 2500, isNegative: false },
    { score: 54, day: "Thu", date: "10/30", amount: 200, isNegative: true },
    { score: 85, day: "Fri", date: "10/31", amount: 3500, isNegative: false },
    { score: 89, day: "Sat", date: "11/1", amount: 5000, isNegative: false },
    { score: 94, day: "Sun", date: "11/2", amount: 3500, isNegative: false },
  ];

  // Static key findings
  const keyFindings = {
    issues: [
      { text: "Monday labor over 8%", type: "error" },
      { text: "Tuesday labor over 3%", type: "warning" },
      { text: "Wednesday COGS over 5%", type: "error" },
      { text: "Thursday labor over 2%", type: "warning" },
    ],
    successes: [
      { text: "Monday COGS under 8%", type: "success" },
      { text: "Tuesday COGS under 3%", type: "success" },
      { text: "Wednesday sales over 10%", type: "success" },
      { text: "Thursday COGS under 2%", type: "success" },
    ],
  };

  const [dateRange, setDateRange] = React.useState([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Close Out Previous Days Button */}
      <button
        onClick={onCloseOutDays}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
      >
        Close Out Previous Days
      </button>

      {/* Last 7 Days Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-orange-600">Last 7 Days</h2>
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates)}
            format="MMM D, YYYY"
            className="border border-gray-200 rounded-md bg-white"
            style={{
              borderRadius: '6px',
              height: '32px',
            }}
            size="small"
            allowClear={false}
            separator=" to "
            popupStyle={{ zIndex: 1000 }}
            getPopupContainer={(trigger) => trigger.parentNode}
            suffixIcon={<CalendarOutlined className="text-gray-400" />}
          />
        </div>

        {/* Daily Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 justify-items-center">
          {dailyData.map((day, idx) => (
            <DailyGauge
              key={idx}
              score={day.score}
              day={day.day}
              date={day.date}
              amount={day.amount}
              isNegative={day.isNegative}
            />
          ))}
        </div>
      </div>

      {/* Key Findings Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6">
        <h2 className="text-2xl font-bold text-orange-600 mb-6">Key Findings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Issues */}
          <div className="space-y-3">
            {keyFindings.issues.map((finding, idx) => (
              <FindingItem
                key={idx}
                text={finding.text}
                type={finding.type}
              />
            ))}
          </div>

          {/* Right Column - Successes */}
          <div className="space-y-3">
            {keyFindings.successes.map((finding, idx) => (
              <FindingItem
                key={idx}
                text={finding.text}
                type={finding.type}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyPerformanceCard;

