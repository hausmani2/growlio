import React, { useEffect, useMemo, useState } from "react";
import { Button, Drawer, Spin } from "antd";
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import dayjs from "dayjs";
import useStore from "../../store/store";
import { salesTrendSentence } from "../../utils/dailyPerformanceWeek";
import lioMascot from "../../assets/pngs/lio-mascot.png";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const money = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0";
  return v.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
};

const gradeFromScore = (score) => {
  const s = Number(score) || 0;
  if (s >= 90) return "A+";
  if (s >= 80) return "A";
  if (s >= 70) return "B";
  if (s >= 60) return "C";
  if (s >= 50) return "D";
  return "F";
};

const pctOf = (row, key, amountKey) => {
  const direct = Number(row?.[key]);
  if (Number.isFinite(direct) && row?.[key] != null && row?.[key] !== "") {
    return direct;
  }
  const sales = Number(row?.sales);
  const amount = Number(row?.[amountKey]);
  if (!(sales > 0) || !Number.isFinite(amount)) return null;
  return (amount / sales) * 100;
};

const costSnapshot = (label, actual, sales, goalPct, pct) => {
  const salesN = Number(sales);
  const actualN = Number(actual);
  const goal = Number(goalPct);
  const percent = pct == null ? null : Number(pct);
  if (!(salesN > 0) || !Number.isFinite(actualN) || !(goal > 0)) {
    return { label, pct: percent, target: goal || null, diff: null, tone: "neutral", amount: actualN };
  }
  const targetDollars = salesN * (goal / 100);
  const diff = actualN - targetDollars;
  let tone = "ok";
  if (diff > 0.5) tone = "over";
  else if (diff < -0.5) tone = "under";
  return { label, pct: percent, target: goal, diff, tone, amount: actualN };
};

// A history row is usable only when it carries a verified daily figure.
const isUsableHistoryRow = (row) =>
  row &&
  row.date &&
  !row.sales_review &&
  row.main_score !== null &&
  row.main_score !== undefined &&
  row.sales != null;

const toneColor = (tone) => {
  if (tone === "over") return "#dc2626";
  if (tone === "under" || tone === "ok") return "#16a34a";
  return "#9ca3af";
};

const CostGaugeTile = ({ row }) => {
  const pct = row.pct == null ? null : Math.max(0, Math.min(100, Number(row.pct)));
  const color = toneColor(row.tone);
  const data = useMemo(
    () => [{ name: row.label, value: pct == null ? 0 : pct, fill: color }],
    [row.label, pct, color]
  );
  const chip =
    row.diff != null && Math.abs(row.diff) >= 0.5
      ? `${money(Math.abs(row.diff))} ${row.tone === "over" ? "over" : "under"}`
      : row.diff != null
        ? "On target"
        : "";
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-2 py-2 flex flex-col items-center">
      <div className="text-xs font-semibold text-gray-700">{row.label}</div>
      <div className="relative" style={{ width: 86, height: 86 }}>
        <RadialBarChart
          width={86}
          height={86}
          innerRadius="78%"
          outerRadius="100%"
          data={data}
          startAngle={210}
          endAngle={-30}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            background={{ fill: "#e5e7eb" }}
            dataKey="value"
            cornerRadius={6}
            isAnimationActive={false}
          />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-base font-extrabold tabular-nums text-gray-900">
            {pct == null ? "—" : `${Math.round(pct)}%`}
          </span>
        </div>
      </div>
      <div className="text-[11px] text-gray-500 leading-tight">
        {row.target ? `Target ${Math.round(Number(row.target))}%` : "No target"}
      </div>
      {chip ? (
        <div
          className={`text-[11px] font-semibold leading-tight ${
            row.tone === "over" ? "text-red-600" : "text-green-700"
          }`}
        >
          {chip}
        </div>
      ) : null}
    </div>
  );
};

const pctChange = (now, avg) => {
  if (!(Number(avg) > 0) || now == null || !Number.isFinite(Number(now))) return null;
  return ((Number(now) - Number(avg)) / Number(avg)) * 100;
};

const ComparisonChart = ({ title, points, format, nowLabel, trend }) => {
  const hasData = points.some((p) => p.value != null);
  if (!hasData) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-2 py-2">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-gray-700">{title}</span>
        {trend?.text ? (
          <span className={`text-[11px] font-semibold ${trend.cls}`}>{trend.text}</span>
        ) : null}
      </div>
      <div style={{ width: "100%", height: 72 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barCategoryGap="30%">
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={false} tickLine={false} interval={0} />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              formatter={(value) => [format(value), title]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.full || label}
              contentStyle={{ fontSize: 11, padding: "4px 8px" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {points.map((p) => (
                <Cell key={p.key} fill={p.label === nowLabel ? "#FF8132" : "#cbd5e1"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const DailyDetailDrawer = ({ open, day, goals, onClose, onViewPlan }) => {
  const getDailyPerformanceData = useStore((s) => s.getDailyPerformanceData);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!open || !day?.date) {
      setHistory([]);
      return undefined;
    }
    let cancelled = false;
    const end = dayjs(day.date);
    const start = end.subtract(16, "week");
    setHistoryLoading(true);
    getDailyPerformanceData(start, end, { silent: true })
      .then((result) => {
        if (cancelled) return;
        const rows = Array.isArray(result?.data) ? result.data : [];
        const weekday = end.day();
        const same = rows
          .filter(
            (row) =>
              isUsableHistoryRow(row) &&
              row.date !== day.date &&
              dayjs(row.date).day() === weekday
          )
          .sort((a, b) => (a.date < b.date ? 1 : -1))
          .slice(0, 4);
        setHistory(same);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, day?.date, getDailyPerformanceData]);

  const weekdayName = day?.date
    ? dayjs(day.date).format("dddd")
    : WEEKDAYS[dayjs().day()];
  const salesReview = Boolean(day?.sales_review);
  const score = salesReview ? null : (Number(day?.main_score) || 0);
  const strong = !salesReview && score >= 70;
  const sales = salesReview || day?.sales == null ? null : Number(day?.sales);
  const profit = salesReview || day?.profit_loss == null ? null : Number(day?.profit_loss);
  const tickets = Number(day?.daily_tickets) || 0;
  const avgTicket = tickets > 0 && sales > 0 ? sales / tickets : null;

  const costs = useMemo(() => {
    if (!day) return [];
    return [
      costSnapshot("Labor", day.actual_labour, day.sales, goals?.labor, pctOf(day, "labour_pct", "actual_labour")),
      costSnapshot("Food", day.actual_cogs, day.sales, goals?.cogs, pctOf(day, "cogs_pct", "actual_cogs")),
      costSnapshot("Rent", day.actual_rent, day.sales, goals?.rent, pctOf(day, "rent_pct", "actual_rent")),
      costSnapshot(
        "Operating",
        day.actual_expenses,
        day.sales,
        goals?.operatingExpenses,
        pctOf(day, "expense_pct", "actual_expenses")
      ),
    ];
  }, [day, goals]);

  const insight = useMemo(() => {
    if (!day) return "";
    if (day.sales_review) {
      const kind = day.sales_figure_kind === 'estimated_legacy'
        ? 'This day is an estimate from a monthly total, not verified daily sales.'
        : 'Sales need review before a percentage can be shown.';
      return kind;
    }
    const outcome = profit < 0 ? `lost ${money(Math.abs(profit))}` : `made ${money(profit)}`;
    const overs = costs.filter((row) => row.tone === "over" && row.diff != null);
    if (!overs.length) {
      return `${weekdayName} sold ${money(sales)} and ${outcome}. Costs stayed at or under target.`;
    }
    const details = overs
      .map((row) => `${row.label.toLowerCase()} was ${money(Math.abs(row.diff))} over target`)
      .join(", ");
    return `${weekdayName} sold ${money(sales)} and ${outcome}. ${details.charAt(0).toUpperCase()}${details.slice(1)}.`;
  }, [costs, day, profit, sales, weekdayName]);

  const historySummary = useMemo(() => {
    if (!history.length) return null;
    const avg = (pick) => {
      const values = history
        .map(pick)
        .filter((value) => value != null && Number.isFinite(Number(value)))
        .map(Number);
      if (!values.length) return null;
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    };
    const salesAvg = avg((row) => row.sales);
    const laborAvg = avg((row) => pctOf(row, "labour_pct", "actual_labour"));
    const foodAvg = avg((row) => pctOf(row, "cogs_pct", "actual_cogs"));
    const customers = history.map((row) => Number(row.daily_tickets) || 0);
    const customerAvg = customers.reduce((sum, n) => sum + n, 0) / history.length;
    const salesNow = Number(day?.sales) || 0;
    const weekdayName = day?.date
      ? dayjs(day.date).format("dddd")
      : "weekday";
    const salesTrend = salesTrendSentence({
      salesNow,
      salesAvg,
      earlierCount: history.length,
      weekdayName,
    });
    return {
      salesAvg,
      laborAvg,
      foodAvg,
      customerAvg,
      hasCustomers: customers.some((n) => n > 0),
      salesTrend,
    };
  }, [history, day]);

  // Compact per-metric comparison series (oldest → newest → this day).
  const comparison = useMemo(() => {
    if (!day || salesReview || !history.length) return null;
    const ordered = [...history].sort((a, b) => (a.date < b.date ? -1 : 1));
    const nowLabel = "This day";
    const build = (pick) => [
      ...ordered.map((row) => ({
        key: row.date,
        label: dayjs(row.date).format("M/D"),
        full: dayjs(row.date).format("ddd, MMM D"),
        value: pick(row),
      })),
      {
        key: day.date,
        label: nowLabel,
        full: dayjs(day.date).format("ddd, MMM D"),
        value: pick(day),
      },
    ];
    const trendFor = (now, avg, lowerIsBetter, fmtDelta) => {
      const change = pctChange(now, avg);
      if (change == null) return null;
      if (Math.abs(change) < 0.5) return { text: "In line with average", cls: "text-gray-500" };
      const up = change > 0;
      const good = lowerIsBetter ? !up : up;
      return {
        text: `${up ? "▲" : "▼"} ${fmtDelta(Math.abs(change))} vs avg`,
        cls: good ? "text-green-700" : "text-red-600",
      };
    };
    const pctDelta = (n) => `${n.toFixed(0)}%`;
    const laborNow = pctOf(day, "labour_pct", "actual_labour");
    const foodNow = pctOf(day, "cogs_pct", "actual_cogs");
    const custNow = Number(day.daily_tickets) || null;
    return {
      nowLabel,
      sales: {
        points: build((row) => (row.sales == null ? null : Number(row.sales))),
        trend: trendFor(sales, historySummary?.salesAvg, false, pctDelta),
      },
      labor: {
        points: build((row) => pctOf(row, "labour_pct", "actual_labour")),
        trend: trendFor(laborNow, historySummary?.laborAvg, true, pctDelta),
      },
      food: {
        points: build((row) => pctOf(row, "cogs_pct", "actual_cogs")),
        trend: trendFor(foodNow, historySummary?.foodAvg, true, pctDelta),
      },
      customers: historySummary?.hasCustomers
        ? {
            points: build((row) => (Number(row.daily_tickets) > 0 ? Number(row.daily_tickets) : null)),
            trend: trendFor(custNow, historySummary?.customerAvg, false, pctDelta),
          }
        : null,
    };
  }, [day, history, historySummary, sales, salesReview]);

  const guidance = strong
    ? "How to Keep This Going"
    : "How to Prevent This in the Future";
  const guidanceSteps = useMemo(() => {
    if (day?.sales_review) {
      return ['Confirm this day\'s sales in Close Day so LIO can score it.'];
    }
    const describe = (row) => {
      const pct = row.pct == null ? "" : ` ${Math.round(row.pct)}%`;
      const gap =
        row.diff != null && Math.abs(row.diff) >= 0.5
          ? ` (${money(Math.abs(row.diff))} ${row.tone === "over" ? "over" : "under"})`
          : "";
      return `${row.label}${pct}${gap}`;
    };
    const overs = costs.filter((row) => row.tone === "over");
    const held = costs.filter((row) => row.tone === "under" || row.tone === "ok");
    const result =
      profit < 0
        ? `a loss of ${money(Math.abs(profit))}`
        : `a profit of ${money(profit)}`;
    const steps = [];
    if (strong) {
      steps.push(`Keep this ${weekdayName}: ${money(sales)} in sales and ${result}.`);
      if (held.length) {
        steps.push(`${held.map(describe).join(", ")} stayed at or under target — repeat the same staffing and purchasing.`);
      }
    } else {
      if (overs.length) {
        steps.push(`On the next ${weekdayName}, correct ${overs.map(describe).join(", ")}.`);
      } else {
        steps.push(`On the next ${weekdayName}, this day had ${money(sales)} in sales and ${result}.`);
      }
      if (overs.some((row) => row.label === "Labor")) {
        steps.push("Match scheduled hours to the sales this weekday actually brings in; trim early-shift or late-shift overlap first.");
      }
      if (overs.some((row) => row.label === "Food")) {
        steps.push("Tighten portions, waste, and invoice prices. Do not treat the food gap as a reason to simply buy less food.");
      }
      if (overs.some((row) => row.label === "Rent" || row.label === "Operating")) {
        steps.push("Rent and operating costs are mostly fixed — the lever is sales. Plan a traffic or ticket push for this weekday.");
      }
    }
    if (history.length && historySummary) {
      const compared = [];
      if (historySummary.salesAvg > 0) {
        const direction = sales >= historySummary.salesAvg ? "above" : "below";
        compared.push(`sales were ${direction} their ${money(historySummary.salesAvg)} average`);
      }
      const laborNow = costs.find((row) => row.label === "Labor")?.pct;
      if (laborNow != null && historySummary.laborAvg != null) {
        compared.push(
          `labor was ${Math.round(laborNow)}% versus their ${Math.round(historySummary.laborAvg)}% average`
        );
      }
      const foodNow = costs.find((row) => row.label === "Food")?.pct;
      if (foodNow != null && historySummary.foodAvg != null) {
        compared.push(
          `food was ${Math.round(foodNow)}% versus their ${Math.round(historySummary.foodAvg)}% average`
        );
      }
      if (compared.length) {
        const countLabel = `${history.length} earlier ${weekdayName}${history.length === 1 ? "" : "s"}`;
        steps.push(`Compared with the ${countLabel} found, ${compared.join("; ")}.`);
      }
    }
    return steps;
  }, [costs, day?.sales_review, history.length, historySummary, profit, sales, strong, weekdayName]);

  const gradeTone = strong
    ? "text-green-700"
    : salesReview
      ? "text-amber-600"
      : "text-orange-600";

  return (
    <Drawer
      title={
        day ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-gray-900">{weekdayName}</div>
              <div className="text-xs font-normal text-gray-500">
                {dayjs(day.date).format("MMM D, YYYY")}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold leading-none ${gradeTone}`}>
                {salesReview ? 'Review' : gradeFromScore(score)}
              </span>
              {!salesReview ? (
                <span className="text-sm font-semibold text-gray-600 tabular-nums">
                  {Math.round(score)}/100
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          "Day detail"
        )
      }
      placement="right"
      open={open}
      onClose={onClose}
      width={typeof window !== "undefined" && window.innerWidth < 640 ? "100%" : 420}
      destroyOnClose={false}
      styles={{ body: { padding: 16, background: "#f8fafc" }, footer: { padding: 16 } }}
      footer={
        <Button
          type="primary"
          block
          size="large"
          className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
          onClick={onViewPlan}
        >
          View Weekly Action Plan
        </Button>
      }
    >
      {!day ? null : (
        <div className="flex flex-col gap-3 text-sm text-gray-800">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white border border-gray-100 px-3 py-3">
              <div className="text-xs text-gray-500">Daily {profit < 0 ? "Loss" : "Profit"}</div>
              <div className={`text-xl font-bold leading-tight ${profit < 0 ? "text-red-600" : "text-green-700"}`}>
                {salesReview || profit == null ? '—' : `${profit < 0 ? "-" : ""}${money(Math.abs(profit))}`}
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-gray-100 px-3 py-3">
              <div className="text-xs text-gray-500">Daily Sales</div>
              <div className="text-xl font-bold leading-tight text-gray-900">
                {salesReview ? 'Review' : money(sales)}
              </div>
              {!salesReview && tickets > 0 ? (
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {tickets.toLocaleString()} customers · {money(avgTicket)} avg ticket
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-3">
            <p className="m-0 mb-2 font-semibold">Costs vs. Targets</p>
            <div className="grid grid-cols-2 gap-2">
              {costs.map((row) => (
                <CostGaugeTile key={row.label} row={row} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-3">
            <p className="m-0 mb-1 font-semibold">Compared to Your Last 4 {weekdayName}s</p>
            {historyLoading ? (
              <Spin size="small" />
            ) : history.length === 0 || !comparison ? (
              <p className="m-0 text-gray-500">
                Not enough history yet. No earlier completed {weekdayName}s were found.
              </p>
            ) : (
              <div className="space-y-2">
                {history.length < 4 ? (
                  <p className="m-0 text-xs text-gray-500">
                    Only {history.length} earlier completed {weekdayName}
                    {history.length === 1 ? "" : "s"} available — trends use what exists.
                  </p>
                ) : null}
                <ComparisonChart
                  title="Sales"
                  points={comparison.sales.points}
                  format={money}
                  nowLabel={comparison.nowLabel}
                  trend={comparison.sales.trend}
                />
                <div className="grid grid-cols-2 gap-2">
                  <ComparisonChart
                    title="Labor %"
                    points={comparison.labor.points}
                    format={(v) => `${Math.round(v)}%`}
                    nowLabel={comparison.nowLabel}
                    trend={comparison.labor.trend}
                  />
                  <ComparisonChart
                    title="Food %"
                    points={comparison.food.points}
                    format={(v) => `${Math.round(v)}%`}
                    nowLabel={comparison.nowLabel}
                    trend={comparison.food.trend}
                  />
                </div>
                {comparison.customers ? (
                  <ComparisonChart
                    title="Customers"
                    points={comparison.customers.points}
                    format={(v) => Math.round(v).toLocaleString()}
                    nowLabel={comparison.nowLabel}
                    trend={comparison.customers.trend}
                  />
                ) : (
                  <p className="m-0 text-xs text-gray-400">Customer counts were not recorded on these days.</p>
                )}
                {historySummary?.salesTrend ? (
                  <p className="m-0 text-xs text-gray-600">{historySummary.salesTrend}</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-3">
            <div className="flex items-center gap-2 mb-1">
              <img src={lioMascot} alt="LIO" className="w-7 h-7 object-contain" />
              <p className="m-0 font-semibold">LIO&apos;s Insight — What Happened?</p>
            </div>
            <p className="m-0 text-gray-700">{insight}</p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-3">
            <p className="m-0 font-semibold text-orange-800">{guidance}</p>
            {guidanceSteps.length ? (
              <ol className="m-0 mt-1 pl-4 space-y-1 text-gray-700 list-decimal">
                {guidanceSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            ) : null}
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default DailyDetailDrawer;
