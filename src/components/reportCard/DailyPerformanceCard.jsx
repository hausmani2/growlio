import React, { useMemo, useState, useEffect, useCallback } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { CalendarOutlined, FlagOutlined, CheckOutlined } from "@ant-design/icons";
import { DatePicker, Spin, Empty, Alert } from "antd";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import useStore from "../../store/store";

dayjs.extend(weekOfYear);

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
const DailyGauge = ({ score, day, date, profitLoss }) => {
  const s = clamp(Number(score) || 0, 0, 100);
  const color = getScoreColor(s);
  const profitLossValue = Number(profitLoss) || 0;
  const isNegative = profitLossValue < 0;
  const amountColor = isNegative ? "text-red-600" : "text-green-600";
  
  const data = useMemo(() => [{ name: "score", value: s, fill: color }], [s, color]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 120, height: 120 }}>
        <RadialBarChart
          width={120}
          height={120}
          innerRadius="80%"
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
          <div className="text-2xl font-extrabold tabular-nums text-gray-900">
            {Math.round(s)}
          </div>
        </div>
      </div>
      
      {/* Day and date */}
      <div className="mt-2 text-sm font-medium text-center text-gray-700">
        {day}
      </div>
      <div className="text-xs text-center text-gray-500">
        {date}
      </div>
      
      {/* Profit/Loss */}
      <div className={`mt-1 text-sm font-semibold ${amountColor}`}>
        {isNegative ? "-" : ""}{formatCompactCurrency(Math.abs(profitLossValue))}
      </div>
    </div>
  );
};

// Key Finding Item Component
const FindingItem = ({ text, type = "success", onClick }) => {
  const iconClass = 
    type === "error" ? "text-red-600" :
    type === "warning" ? "text-yellow-500" :
    "text-green-600";
  
  const Icon = type === "success" ? CheckOutlined : FlagOutlined;

  return (
    <div 
      className={`flex items-start gap-2 ${onClick ? 'cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors' : ''}`}
      onClick={onClick}
    >
      <Icon className={`${iconClass} text-lg flex-shrink-0 mt-0.5`} />
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  );
};

const DailyPerformanceCard = ({ onCloseOutDays }) => {
  // Store hooks
  const { 
    getDailyPerformanceData, 
    dailyPerformanceData, 
    dailyPerformanceLoading, 
    dailyPerformanceError,
    setPendingChatMessage
  } = useStore();

  // Week picker state - initialize with current week
  const [weekPickerValue, setWeekPickerValue] = useState(dayjs());
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('week'),
    dayjs().endOf('week'),
  ]);

  // Fetch daily performance data
  const fetchDailyData = useCallback(async (startDate, endDate) => {
    if (!startDate || !endDate) return;
    
    try {
      await getDailyPerformanceData(startDate, endDate);
    } catch (error) {
      console.error('❌ [DailyPerformanceCard] Error fetching daily data:', error);
    }
  }, [getDailyPerformanceData]);

  // Initialize with current week on mount and fetch data
  useEffect(() => {
    const startOfWeek = dayjs().startOf('week');
    const endOfWeek = dayjs().endOf('week');
    setDateRange([startOfWeek, endOfWeek]);
    setWeekPickerValue(dayjs());
    fetchDailyData(startOfWeek, endOfWeek);
  }, [fetchDailyData]);

  // Handle week picker change
  const handleWeekPickerChange = useCallback((date) => {
    if (!date) return;
    setWeekPickerValue(date);
    const start = dayjs(date).startOf('week');
    const end = dayjs(date).endOf('week');
    setDateRange([start, end]);
    fetchDailyData(start, end);
  }, [fetchDailyData]);

  // Transform API data to component format
  const transformedDailyData = useMemo(() => {
    if (!dailyPerformanceData || !Array.isArray(dailyPerformanceData)) {
      return [];
    }

    return dailyPerformanceData.map((item) => {
      const dateObj = dayjs(item.date);
      
      // Convert full day name to short format (e.g., "Monday" -> "Mon")
      let dayName = item.day || dateObj.format('ddd');
      if (dayName && dayName.length > 3) {
        // If it's a full day name, convert to short format
        const dayMap = {
          'Monday': 'Mon',
          'Tuesday': 'Tue',
          'Wednesday': 'Wed',
          'Thursday': 'Thu',
          'Friday': 'Fri',
          'Saturday': 'Sat',
          'Sunday': 'Sun'
        };
        dayName = dayMap[dayName] || dateObj.format('ddd');
      }
      const dateFormatted = dateObj.format('MM/DD');
      
      return {
        score: item.main_score || 0,
        day: dayName,
        date: dateFormatted,
        profitLoss: item.profit_loss || 0,
        dateObj: dateObj
      };
    });
  }, [dailyPerformanceData]);

  // Generate key findings from data - over on left, under on right
  const keyFindings = useMemo(() => {
    if (!dailyPerformanceData || !Array.isArray(dailyPerformanceData)) {
      return { over: [], under: [] };
    }

    const over = [];
    const under = [];

    // Analyze data and generate findings
    dailyPerformanceData.forEach((item) => {
      // Use full day name (Sunday, Monday, etc.)
      let dayName = item.day || dayjs(item.date).format('dddd');
      // Ensure we have full day name
      if (dayName && dayName.length <= 3) {
        const dayMap = {
          'Mon': 'Monday',
          'Tue': 'Tuesday',
          'Wed': 'Wednesday',
          'Thu': 'Thursday',
          'Fri': 'Friday',
          'Sat': 'Saturday',
          'Sun': 'Sunday'
        };
        dayName = dayMap[dayName] || dayjs(item.date).format('dddd');
      }
      
      // Check COGS status
      if (item.cogs_status === 'over_goal' && item.cogs_difference) {
        over.push({
          text: `${dayName} Cogs over ${Math.round(Math.abs(item.cogs_difference))}%`,
          type: "error",
          item: item
        });
      } else if (item.cogs_status === 'under_goal' && item.cogs_difference) {
        under.push({
          text: `${dayName} Cogs under ${Math.round(Math.abs(item.cogs_difference))}%`,
          type: "success",
          item: item
        });
      }

      // Check Labour status
      if (item.labour_status === 'over_goal' && item.labour_difference) {
        over.push({
          text: `${dayName} Labor over ${Math.round(Math.abs(item.labour_difference))}%`,
          type: "error",
          item: item
        });
      } else if (item.labour_status === 'under_goal' && item.labour_difference) {
        under.push({
          text: `${dayName} Labor under ${Math.round(Math.abs(item.labour_difference))}%`,
          type: "success",
          item: item
        });
      }

      // Check Expense status
      if (item.expense_status === 'over_goal' && item.expense_difference) {
        over.push({
          text: `${dayName} Expenses over ${Math.round(Math.abs(item.expense_difference))}%`,
          type: "error",
          item: item
        });
      } else if (item.expense_status === 'under_goal' && item.expense_difference) {
        under.push({
          text: `${dayName} Expenses under ${Math.round(Math.abs(item.expense_difference))}%`,
          type: "success",
          item: item
        });
      }
    });

    return { over, under };
  }, [dailyPerformanceData]);

  // Handle clicking on a finding - send summary to chat
  const handleFindingClick = useCallback((finding) => {
    if (!finding.item || !finding.item.summary) {
      return;
    }

    // Extract summary - it might be an object with 'user' property or a string
    const summaryData = finding.item.summary;
    const summaryText = typeof summaryData === 'string' 
      ? summaryData 
      : (summaryData?.user || JSON.stringify(summaryData));
    
    if (!summaryText) {
      return;
    }

    const findingText = finding.text;
    
    // Create a prompt that includes the summary and asks about the specific finding
    const prompt = `${summaryText}\n\nBased on this performance data, can you provide insights and suggestions regarding: ${findingText}?`;
    
    // Send to chat widget
    setPendingChatMessage(prompt);
  }, [setPendingChatMessage]);

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
          <h2 className="text-2xl font-bold text-orange-600">
            {dateRange[0] && dateRange[1] 
              ? `Week of ${dateRange[0].format('MMM DD')} - ${dateRange[1].format('MMM DD, YYYY')}`
              : 'Last 7 Days'
            }
          </h2>
          <DatePicker
            picker="week"
            value={weekPickerValue}
            onChange={handleWeekPickerChange}
            style={{ width: 220 }}
            allowClear={false}
            format={(value) => {
              if (!value) return 'Select week';
              const start = dayjs(value).startOf('week');
              const end = dayjs(value).endOf('week');
              const wk = dayjs(value).week();
              return `Week ${wk} (${start.format('MMM DD')} - ${end.format('MMM DD')})`;
            }}
            className="border border-gray-200 rounded-md bg-white"
            size="small"
            popupStyle={{ zIndex: 1000 }}
            getPopupContainer={(trigger) => trigger.parentNode}
            suffixIcon={<CalendarOutlined className="text-gray-400" />}
          />
        </div>

        {/* Daily Gauges */}
        {dailyPerformanceLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : dailyPerformanceError ? (
          <div className="py-6">
            <Alert
              message="Error Loading Data"
              description={dailyPerformanceError}
              type="error"
              showIcon
            />
          </div>
        ) : transformedDailyData.length === 0 ? (
          <div className="py-12">
            <Empty 
              description="No data available for this week" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 justify-items-center">
            {transformedDailyData.map((day, idx) => (
              <DailyGauge
                key={`${day.date}-${idx}`}
                score={day.score}
                day={day.day}
                date={day.date}
                profitLoss={day.profitLoss}
              />
            ))}
          </div>
        )}
      </div>

      {/* Key Findings Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6">
        <h2 className="text-2xl font-bold text-orange-600 mb-6">Key Findings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Over */}
          <div className="space-y-3">
            {keyFindings.over.length > 0 ? (
              keyFindings.over.map((finding, idx) => (
                <FindingItem
                  key={idx}
                  text={finding.text}
                  type={finding.type}
                  onClick={() => handleFindingClick(finding)}
                />
              ))
            ) : (
              <div className="text-sm text-gray-400 italic">No over-goal items</div>
            )}
          </div>

          {/* Right Column - Under */}
          <div className="space-y-3">
            {keyFindings.under.length > 0 ? (
              keyFindings.under.map((finding, idx) => (
                <FindingItem
                  key={idx}
                  text={finding.text}
                  type={finding.type}
                  onClick={() => handleFindingClick(finding)}
                />
              ))
            ) : (
              <div className="text-sm text-gray-400 italic">No under-goal items</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyPerformanceCard;

