import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Spin, Empty, Alert } from "antd";
import dayjs from "dayjs";
import useStore from "../../store/store";
import DailyDetailDrawer from "./DailyDetailDrawer";
import {
  filterDaysForWeek,
  shouldAcceptWeekResponse,
  weekKeyFor,
  weeksInsideRange,
} from "../../utils/dailyPerformanceWeek";

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

const getScoreColor = (score) => {
  const s = clamp(Number(score) || 0, 0, 100);
  return s >= 70 ? "#22c55e" : "#facc15";
};

const DailyGauge = ({ score, day, date, profitLoss, selected, onClick }) => {
  const s = clamp(Number(score) || 0, 0, 100);
  const color = getScoreColor(s);
  const profitLossValue = Number(profitLoss) || 0;
  const isNegative = profitLossValue < 0;
  const amountColor = isNegative ? "text-red-600" : "text-green-600";
  const data = useMemo(() => [{ name: "score", value: s, fill: color }], [s, color]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center rounded-xl px-1 py-1 bg-transparent border-0 cursor-pointer ${
        selected ? "ring-2 ring-orange-500" : ""
      }`}
      aria-pressed={selected}
    >
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-2xl font-extrabold tabular-nums text-gray-900">
            {Math.round(s)}
          </div>
        </div>
      </div>
      <div className="mt-2 text-sm font-medium text-center text-gray-700">{day}</div>
      <div className="text-xs text-center text-gray-500">{date}</div>
      <div className={`mt-1 text-sm font-semibold ${amountColor}`}>
        {isNegative ? "-" : ""}
        {formatCompactCurrency(Math.abs(profitLossValue))}
      </div>
    </button>
  );
};

const DailyPerformanceCard = ({ dateRange, goals }) => {
  const getDailyPerformanceData = useStore((s) => s.getDailyPerformanceData);
  const selectedLocationId = useStore((s) => s.selectedLocationId);
  const weeks = useMemo(() => weeksInsideRange(dateRange), [dateRange]);
  const rangeKey = useMemo(() => {
    if (!dateRange?.[0] || !dateRange?.[1]) return "";
    return `${dayjs(dateRange[0]).format("YYYY-MM-DD")}|${dayjs(dateRange[1]).format("YYYY-MM-DD")}`;
  }, [dateRange]);
  const preferredIndex = useMemo(() => {
    if (!weeks.length) return 0;
    const today = dayjs();
    const idx = weeks.findIndex(
      (week) =>
        (today.isAfter(week.start, "day") || today.isSame(week.start, "day")) &&
        (today.isBefore(week.end, "day") || today.isSame(week.end, "day"))
    );
    return idx >= 0 ? idx : weeks.length - 1;
  }, [weeks]);

  const [weekIndex, setWeekIndex] = useState(preferredIndex);
  const [selectedDate, setSelectedDate] = useState(null);
  const [appliedRangeKey, setAppliedRangeKey] = useState(rangeKey);
  const [weekData, setWeekData] = useState([]);
  const [weekLoading, setWeekLoading] = useState(false);
  const [weekError, setWeekError] = useState(null);
  const [loadedWeekKey, setLoadedWeekKey] = useState("");
  const requestSeqRef = useRef(0);
  const activeWeekKeyRef = useRef("");

  if (appliedRangeKey !== rangeKey) {
    setAppliedRangeKey(rangeKey);
    setWeekIndex(preferredIndex);
    setSelectedDate(null);
  }

  const activeWeek = weeks[weekIndex] || null;
  const activeWeekKey = activeWeek
    ? weekKeyFor(activeWeek.start, activeWeek.end)
    : "";
  activeWeekKeyRef.current = activeWeekKey;

  const changeWeek = useCallback((nextIndex) => {
    setWeekIndex(nextIndex);
    setSelectedDate(null);
  }, []);

  const fetchOwnedWeek = useCallback(
    async (week) => {
      if (!week?.start || !week?.end) return;
      const requestedKey = weekKeyFor(week.start, week.end);
      const requestId = ++requestSeqRef.current;
      setWeekLoading(true);
      setWeekError(null);
      try {
        const result = await getDailyPerformanceData(week.start, week.end, {
          silent: true,
        });
        if (requestId !== requestSeqRef.current) return;
        if (!shouldAcceptWeekResponse(requestedKey, activeWeekKeyRef.current)) {
          return;
        }
        if (!result?.success) {
          setWeekData([]);
          setLoadedWeekKey(requestedKey);
          setWeekError(result?.error || "Failed to fetch daily performance data");
          return;
        }
        setWeekData(Array.isArray(result.data) ? result.data : []);
        setLoadedWeekKey(requestedKey);
        setWeekError(null);
      } catch (error) {
        if (requestId !== requestSeqRef.current) return;
        if (!shouldAcceptWeekResponse(requestedKey, activeWeekKeyRef.current)) {
          return;
        }
        console.error("[DailyPerformanceCard] Error fetching daily data:", error);
        setWeekData([]);
        setLoadedWeekKey(requestedKey);
        setWeekError(error?.message || "Failed to fetch daily performance data");
      } finally {
        if (requestId === requestSeqRef.current) {
          setWeekLoading(false);
        }
      }
    },
    [getDailyPerformanceData]
  );

  useEffect(() => {
    if (!activeWeek?.start || !activeWeek?.end) {
      setWeekData([]);
      setLoadedWeekKey("");
      setSelectedDate(null);
      return;
    }
    fetchOwnedWeek(activeWeek);
  }, [
    activeWeekKey,
    selectedLocationId,
    fetchOwnedWeek,
  ]);

  const closedDayRows = useMemo(() => {
    if (loadedWeekKey !== activeWeekKey) return [];
    return filterDaysForWeek(weekData, activeWeek);
  }, [weekData, activeWeek, loadedWeekKey, activeWeekKey]);

  const showNoClosedDaysGuidance =
    !weekLoading &&
    !weekError &&
    loadedWeekKey === activeWeekKey &&
    closedDayRows.length === 0;

  const transformedDailyData = useMemo(() => {
    return closedDayRows.map((item) => {
      const dateObj = dayjs(item.date);
      let dayName = item.day || dateObj.format("ddd");
      if (dayName && dayName.length > 3) {
        const dayMap = {
          Monday: "Mon",
          Tuesday: "Tue",
          Wednesday: "Wed",
          Thursday: "Thu",
          Friday: "Fri",
          Saturday: "Sat",
          Sunday: "Sun",
        };
        dayName = dayMap[dayName] || dateObj.format("ddd");
      }
      return {
        raw: item,
        score: item.main_score || 0,
        day: dayName,
        date: dateObj.format("MM/DD"),
        iso: item.date,
        profitLoss: item.profit_loss || 0,
      };
    });
  }, [closedDayRows]);

  const selectedDay =
    transformedDailyData.find((day) => day.iso === selectedDate)?.raw || null;

  const weekLabel = activeWeek
    ? `${activeWeek.start.format("MMM DD")} - ${activeWeek.end.format("MMM DD, YYYY")}`
    : "";

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-orange-600 m-0">Daily Performance</h2>
            {weekLabel ? (
              <p className="text-sm text-gray-500 m-0 mt-1">{weekLabel}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              icon={<LeftOutlined />}
              disabled={weekIndex <= 0}
              onClick={() => changeWeek(Math.max(0, weekIndex - 1))}
              aria-label="Previous week in this date range"
            />
            <Button
              icon={<RightOutlined />}
              disabled={!weeks.length || weekIndex >= weeks.length - 1}
              onClick={() =>
                changeWeek(Math.min(weeks.length - 1, weekIndex + 1))
              }
              aria-label="Next week in this date range"
            />
          </div>
        </div>

        {weekLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : weekError ? (
          <div className="py-6">
            <Alert
              message="Error Loading Data"
              description={weekError}
              type="error"
              showIcon
            />
          </div>
        ) : showNoClosedDaysGuidance ? (
          <div className="py-12">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-center">
                  <div>No data available for this week</div>
                  <div className="mt-2 text-sm font-medium !text-orange-600">
                    Scoring becomes available once you&apos;ve entered your daily numbers and closed out the day.
                  </div>
                </div>
              }
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
                key={`${day.iso}-${idx}`}
                score={day.score}
                day={day.day}
                date={day.date}
                profitLoss={day.profitLoss}
                selected={day.iso === selectedDate}
                onClick={() => setSelectedDate(day.iso)}
              />
            ))}
          </div>
        )}
      </div>

      <DailyDetailDrawer
        open={Boolean(selectedDay)}
        day={selectedDay}
        goals={goals}
        onClose={() => setSelectedDate(null)}
        onViewPlan={() => {
          setSelectedDate(null);
          window.setTimeout(() => {
            const target = document.getElementById("lio-action-plan");
            const container = document.querySelector(
              '[data-app-scroll-container="true"]'
            );
            if (!target) return;
            if (container) {
              const top =
                target.getBoundingClientRect().top -
                container.getBoundingClientRect().top +
                container.scrollTop -
                12;
              container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
              return;
            }
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 280);
        }}
      />
    </div>
  );
};

export default DailyPerformanceCard;
