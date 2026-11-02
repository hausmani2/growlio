import React, { useEffect, useMemo, useState } from "react";
import { Button, Drawer, Spin } from "antd";
import dayjs from "dayjs";
import useStore from "../../store/store";
import { salesTrendSentence } from "../../utils/dailyPerformanceWeek";

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
    return { label, pct: percent, target: goal || null, diff: null, tone: "neutral" };
  }
  const targetDollars = salesN * (goal / 100);
  const diff = actualN - targetDollars;
  let tone = "ok";
  if (diff > 0.5) tone = "over";
  else if (diff < -0.5) tone = "under";
  return { label, pct: percent, target: goal, diff, tone };
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
              row?.date &&
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
  const score = Number(day?.main_score) || 0;
  const strong = score >= 70;
  const sales = Number(day?.sales) || 0;
  const profit = Number(day?.profit_loss) || 0;

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

  const guidance = strong
    ? "How to Keep This Going"
    : "How to Prevent This in the Future";
  const guidanceBody = useMemo(() => {
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
    if (strong) {
      const heldText = held.length ? ` ${held.map(describe).join(", ")} stayed at or under target.` : "";
      return `Keep this ${weekdayName}: ${money(sales)} in sales and ${result}.${heldText}`;
    }
    const lead = overs.length
      ? `On the next ${weekdayName}, correct ${overs.map(describe).join(", ")}.`
      : `On the next ${weekdayName}, this day had ${money(sales)} in sales and ${result}.`;
    const foodOver = overs.some((row) => row.label === "Food");
    const base = foodOver
      ? `${lead} Tighten portions, waste, and invoice prices. Do not treat the food gap as a reason to simply buy less food.`
      : lead;
    if (!history.length || !historySummary) return base;
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
    if (!compared.length) return base;
    const countLabel = `${history.length} earlier ${weekdayName}${history.length === 1 ? "" : "s"}`;
    return `${base} Compared with the ${countLabel} found, ${compared.join("; ")}.`;
  }, [costs, history.length, historySummary, profit, sales, strong, weekdayName]);

  const toneClass = (tone) => {
    if (tone === "over") return "text-red-600 bg-red-50 border-red-100";
    if (tone === "under" || tone === "ok") return "text-green-700 bg-green-50 border-green-100";
    return "text-gray-900 bg-gray-50 border-gray-100";
  };

  return (
    <Drawer
      title={
        day ? (
          <div>
            <div className="text-base font-semibold text-gray-900">{weekdayName}</div>
            <div className="text-xs font-normal text-gray-500">
              {dayjs(day.date).format("MMM D, YYYY")}
            </div>
          </div>
        ) : (
          "Day detail"
        )
      }
      placement="right"
      open={open}
      onClose={onClose}
      width={typeof window !== "undefined" && window.innerWidth < 640 ? "100%" : 400}
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
          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Grade</div>
                <div className="text-4xl font-extrabold text-orange-600 leading-none mt-1">
                  {gradeFromScore(score)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wide text-gray-500">Score</div>
                <div className="text-2xl font-bold text-gray-900">{Math.round(score)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="text-xs text-gray-500">Sales</div>
                <div className="text-lg font-semibold">{money(sales)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="text-xs text-gray-500">{profit < 0 ? "Loss" : "Profit"}</div>
                <div className={`text-lg font-semibold ${profit < 0 ? "text-red-600" : "text-green-700"}`}>
                  {profit < 0 ? "-" : ""}
                  {money(Math.abs(profit))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <p className="m-0 mb-3 font-semibold">Costs vs. targets</p>
            <div className="grid grid-cols-2 gap-2">
              {costs.map((row) => (
                <div key={row.label} className={`rounded-xl border px-3 py-2 ${toneClass(row.tone)}`}>
                  <div className="text-xs opacity-80">{row.label}</div>
                  <div className="text-xl font-bold leading-tight">
                    {row.pct == null ? "—" : `${Math.round(row.pct)}%`}
                  </div>
                  <div className="text-xs opacity-80">
                    {row.target ? `Target ${Math.round(Number(row.target))}%` : "No target"}
                    {row.diff != null && Math.abs(row.diff) >= 0.5
                      ? ` · ${money(Math.abs(row.diff))} ${row.tone === "over" ? "over" : "under"}`
                      : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <p className="m-0 mb-2 font-semibold">Last 4 {weekdayName}s</p>
            {historyLoading ? (
              <Spin size="small" />
            ) : history.length === 0 ? (
              <p className="m-0 text-gray-500">
                Not enough history yet. No earlier completed {weekdayName}s were found.
              </p>
            ) : (
              <div className="space-y-2">
                {history.length < 4 ? (
                  <p className="m-0 text-gray-500">
                    Found {history.length} earlier {weekdayName}
                    {history.length === 1 ? "" : "s"}.
                  </p>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-xs text-gray-500">Avg sales</div>
                    <div className="font-semibold">{money(historySummary?.salesAvg)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-xs text-gray-500">Customers</div>
                    <div className="font-semibold">
                      {historySummary?.hasCustomers
                        ? Math.round(historySummary.customerAvg)
                        : "Not recorded"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-xs text-gray-500">Avg labor</div>
                    <div className="font-semibold">
                      {historySummary?.laborAvg == null ? "—" : `${Math.round(historySummary.laborAvg)}%`}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-xs text-gray-500">Avg food</div>
                    <div className="font-semibold">
                      {historySummary?.foodAvg == null ? "—" : `${Math.round(historySummary.foodAvg)}%`}
                    </div>
                  </div>
                </div>
                {historySummary?.salesTrend ? (
                  <p className="m-0 text-gray-600">{historySummary.salesTrend}</p>
                ) : null}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <p className="m-0 mb-1 font-semibold">What happened</p>
            <p className="m-0 text-gray-700">{insight}</p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
            <p className="m-0 font-semibold text-orange-800">{guidance}</p>
            <p className="m-0 mt-1 text-gray-700">{guidanceBody}</p>
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default DailyDetailDrawer;
