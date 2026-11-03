import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Spin, Tag } from 'antd';
import {
  BulbOutlined,
  ReloadOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useLioFeatureUsage from '../../hooks/useLioFeatureUsage';
import {
  LIO_FEATURE,
  pollGrowlioIQStatus,
  runGrowlioIQAnalysis,
} from '../../services/growlioIqApi';
import lioMascot from '../../assets/pngs/lio-mascot.png';

const priorityColor = (priority) => {
  const value = String(priority || '').toLowerCase();
  if (value === 'high') return 'red';
  if (value === 'low') return 'default';
  return 'orange';
};

const metricKeyOf = (metric) => {
  const value = String(metric || '').toLowerCase();
  if (value === 'labor' || value === 'labour') return 'labor';
  if (value === 'cogs' || value === 'food_cost' || value === 'food') return 'cogs';
  if (value === 'sales') return 'sales';
  if (value === 'expenses' || value === 'operating_expenses' || value === 'opex') return 'expenses';
  if (value === 'rent') return 'rent';
  return value || 'general';
};

// Client-specified card order: Sales, Labor, Food Cost, Rent, Operating Expenses.
const METRIC_ORDER = ['sales', 'labor', 'cogs', 'rent', 'expenses'];

const metricLabel = (metric) => {
  const key = metricKeyOf(metric);
  if (key === 'labor') return 'Labor';
  if (key === 'cogs') return 'Food Cost';
  if (key === 'sales') return 'Sales';
  if (key === 'expenses') return 'Operating Expenses';
  if (key === 'rent') return 'Rent';
  return metric || 'Metric';
};

const statusTone = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'over' || value === 'behind') return 'error';
  if (value === 'under' || value === 'on_track') return 'success';
  return 'warning';
};

const statusLabel = (status, metric) => {
  const value = String(status || '').toLowerCase();
  const key = metricKeyOf(metric);
  if (value === 'behind') return 'Below Target';
  if (value === 'over') return key === 'sales' ? 'Above Target' : 'Over Target';
  if (value === 'under') return key === 'sales' ? 'Below Target' : 'Under Target';
  if (value === 'on_track') return 'On Track';
  return 'Needs Attention';
};

const statusChipClass = (status) => {
  const tone = statusTone(status);
  if (tone === 'error') return 'bg-red-50 text-red-700 border-red-200';
  if (tone === 'success') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
};

// Split a LIO action sentence block into numbered steps for compact display.
const actionSteps = (action) => {
  const text = String(action || '').trim();
  if (!text) return [];
  const parts = text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts : [text];
};

const sortPlanByMetric = (items) =>
  [...(items || [])].sort((a, b) => {
    const ia = METRIC_ORDER.indexOf(metricKeyOf(a?.metric));
    const ib = METRIC_ORDER.indexOf(metricKeyOf(b?.metric));
    return (ia === -1 ? METRIC_ORDER.length : ia) - (ib === -1 ? METRIC_ORDER.length : ib);
  });

/**
 * AI-driven Key Findings → weekly action plan for Report Card.
 * Uses Growlio IQ focus=weekly_recovery for the selected week.
 */
const KeyFindingsActionPlan = ({
  startDate,
  endDate,
  showNoClosedDaysGuidance = false,
  autoRun = true,
}) => {
  const navigate = useNavigate();
  const { planLoading, unlimited, locked, remainingCopy, applyUsage, lockFeature } =
    useLioFeatureUsage(LIO_FEATURE.ACTION_PLAN);
  const [running, setRunning] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState({});
  const pollRef = useRef(null);
  const autoRanRef = useRef('');

  const rangeKey = useMemo(() => {
    if (!startDate || !endDate) return '';
    const start = dayjs.isDayjs(startDate)
      ? startDate.format('YYYY-MM-DD')
      : String(startDate);
    const end = dayjs.isDayjs(endDate)
      ? endDate.format('YYYY-MM-DD')
      : String(endDate);
    return `${start}|${end}`;
  }, [startDate, endDate]);

  useEffect(() => {
    setDetailsOpen({});
  }, [rangeKey]);

  const periodOpen = useMemo(() => {
    if (!endDate) return true;
    const end = dayjs(endDate).endOf('day');
    return !end.isBefore(dayjs(), 'day');
  }, [endDate]);

  const planTitle = periodOpen ? 'LIO Action Plan' : 'LIO Performance Review';
  const planSubtitle = periodOpen
    ? 'What to do with the days still left in this period'
    : 'What happened in this period, and how to keep it from repeating';

  const periodLabel = useMemo(() => {
    if (!startDate || !endDate) return '';
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    if (!start.isValid() || !end.isValid()) return '';
    return `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`;
  }, [startDate, endDate]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      stopPoll();
    },
    [stopPoll]
  );

  const handleRun = useCallback(async () => {
    if (locked) {
      navigate('/dashboard/pricing');
      return;
    }
    if (!rangeKey) return;
    const [start, end] = rangeKey.split('|');
    stopPoll();
    setRunning(true);
    setError('');
    setAnalysis(null);

    try {
      const startRes = await runGrowlioIQAnalysis({
        startDate: start,
        endDate: end,
        focus: 'weekly_recovery',
        feature: LIO_FEATURE.ACTION_PLAN,
      });
      if (startRes?.usage) applyUsage(startRes.usage);
      if (!startRes?.job_id) {
        throw new Error(startRes?.error || 'Failed to start LIO action plan');
      }

      pollRef.current = setInterval(async () => {
        try {
          const poll = await pollGrowlioIQStatus(startRes.job_id);
          if (poll.status === 'done') {
            stopPoll();
            setRunning(false);
            setAnalysis(poll.analysis || null);
          } else if (poll.status === 'error') {
            stopPoll();
            setRunning(false);
            setError(poll.error || 'LIO action plan failed');
          }
        } catch {
          // keep polling
        }
      }, 3000);
    } catch (err) {
      stopPoll();
      setRunning(false);
      const data = err?.response?.data;
      if (data?.upgrade_required) lockFeature(data);
      setError(data?.error || err.message || 'LIO action plan failed');
    }
  }, [applyUsage, lockFeature, locked, navigate, rangeKey, stopPoll]);

  useEffect(() => {
    if (!autoRun || !unlimited || planLoading || !rangeKey) return;
    if (showNoClosedDaysGuidance) return;
    if (autoRanRef.current === rangeKey) return;
    autoRanRef.current = rangeKey;
    handleRun();
  }, [
    autoRun,
    unlimited,
    planLoading,
    rangeKey,
    showNoClosedDaysGuidance,
    handleRun,
  ]);

  const weeklyPlan = useMemo(() => {
    const fromWeekly = analysis?.weekly_action_plan;
    const rentConfigured =
      analysis?.metrics_snapshot?.weekly_recovery_authority?.rent_configured ??
      analysis?.metrics_snapshot?.daily_week_progress?.rent_configured ??
      analysis?.metrics_snapshot?.report_card?.rent_configured;
    const outlook =
      analysis?.metrics_snapshot?.weekly_recovery_authority?.fixed_cost_outlook ||
      analysis?.metrics_snapshot?.daily_week_progress?.fixed_cost_outlook ||
      {};

    const formatMoney = (n) =>
      n == null || Number.isNaN(Number(n))
        ? null
        : `$${Number(n).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}`;
    const formatPct = (n) =>
      n == null || Number.isNaN(Number(n)) ? null : `${Number(n).toFixed(1)}%`;

    const buildPeriodOutlook = (metric) => {
      const key =
        metric === 'rent'
          ? 'rent'
          : metric === 'expenses' ||
              metric === 'operating_expenses' ||
              metric === 'opex'
            ? 'operating_expenses'
            : null;
      if (!key || !outlook?.[key]) return null;
      const block = outlook[key];
      const weekAmt = formatMoney(block.this_week_amount);
      const weekPct = formatPct(block.this_week_pct_of_sales);
      const mtdAmt = formatMoney(block.month_to_date_amount);
      const mtdPct = formatPct(block.month_to_date_pct_of_sales);
      const target = formatPct(block.monthly_target_pct);
      const salesNeeded = formatMoney(block.sales_needed_for_target);
      const projected = formatMoney(block.projected_month_sales);
      const projectedPct = formatPct(block.projected_month_pct_of_sales);
      let insight = '';
      if (block.on_track) {
        insight = `Currently on target for the month.${
          salesNeeded
            ? ` Keep monthly sales above ${salesNeeded} to stay at or below ${target}.`
            : ''
        }`;
      } else if (block.points_above_target != null) {
        insight = `Running ${Number(block.points_above_target).toFixed(1)} points above the monthly target.${
          salesNeeded && projected
            ? ` Need about ${salesNeeded} monthly sales (pace projects ${projected}${
                projectedPct ? ` → ${projectedPct}` : ''
              }).`
            : ''
        }`;
      }
      return {
        this_week: [weekAmt && `${weekAmt} allocated`, weekPct && `${weekPct} of sales`]
          .filter(Boolean)
          .join(' · '),
        month_to_date: [mtdAmt, mtdPct && `${mtdPct} of sales`].filter(Boolean).join(' · '),
        monthly_target: target ? `≤ ${target}` : '',
        insight,
      };
    };

    const enrich = (items) =>
      (items || []).map((item) => {
        const metric = String(item?.metric || '').toLowerCase();
        if (
          metric !== 'rent' &&
          metric !== 'expenses' &&
          metric !== 'operating_expenses' &&
          metric !== 'opex'
        ) {
          return item;
        }
        if (item.period_outlook?.this_week || item.period_outlook?.month_to_date) {
          return item;
        }
        const period_outlook = buildPeriodOutlook(metric);
        return period_outlook ? { ...item, period_outlook, daily_target: '' } : item;
      });

    const filterRent = (items) => {
      if (!Array.isArray(items)) return [];
      if (rentConfigured === false) {
        return items.filter(
          (item) => String(item?.metric || '').toLowerCase() !== 'rent'
        );
      }
      return items;
    };
    if (Array.isArray(fromWeekly) && fromWeekly.length) {
      return sortPlanByMetric(enrich(filterRent(fromWeekly)));
    }
    return enrich(
      filterRent(
        (analysis?.action_plan || []).map((item) => ({
          metric: 'general',
          status: 'over',
          title: item.priority === 'high' ? 'Priority action' : 'Recommended action',
          finding: '',
          variance_amount: '',
          remaining_days: null,
          daily_target: '',
          action: item.action,
          priority: item.priority || 'medium',
        }))
      )
    );
  }, [analysis]);

  return (
    <div
      id="lio-action-plan"
      className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <img
            src={lioMascot}
            alt="LIO"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <BulbOutlined className="text-lg text-[#FF8132]" />
              <h2 className="text-xl sm:text-2xl font-bold text-orange-600 mb-0">
                {planTitle}
              </h2>
            </div>
            <p className="text-sm text-gray-500 m-0">
              {planSubtitle}
              {periodLabel ? ` · ${periodLabel}` : ''}
            </p>
          </div>
        </div>
        {locked && !showNoClosedDaysGuidance ? (
          <Button
            type="primary"
            size="small"
            className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
            onClick={() => navigate('/dashboard/pricing')}
          >
            Upgrade to Grow or Pro
          </Button>
        ) : !showNoClosedDaysGuidance ? (
          <Button
            type="primary"
            size="small"
            icon={analysis ? <ReloadOutlined /> : <ThunderboltOutlined />}
            loading={running}
            className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
            onClick={handleRun}
          >
            {analysis ? 'Refresh plan' : 'Build action plan'}
          </Button>
        ) : null}
      </div>

      {planLoading ? (
        <div className="flex items-center gap-3 py-6">
          <Spin />
          <span className="text-gray-600 text-sm">Loading LIO…</span>
        </div>
      ) : null}

      {remainingCopy && !showNoClosedDaysGuidance ? (
        <p className="text-sm text-gray-500 mb-3 m-0">{remainingCopy}</p>
      ) : null}

      {locked && !showNoClosedDaysGuidance ? (
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message="You've used all 5 free LIO reviews for this feature this month. Upgrade to Grow or Pro to keep using LIO."
        />
      ) : null}

      {showNoClosedDaysGuidance ? (
        <div className="text-sm font-medium text-orange-600 text-center py-4">
          Action plans appear once you&apos;ve entered your daily numbers and closed
          out the day.
        </div>
      ) : null}

      {!showNoClosedDaysGuidance ? (
        <>
          {running && !analysis ? (
            <div className="flex items-center gap-3 py-6">
              <Spin />
              <span className="text-gray-600 text-sm">
                LIO is building your weekly recovery plan…
              </span>
            </div>
          ) : null}

          {error ? (
            <Alert
              type="error"
              showIcon
              className="mb-4"
              message={error}
              action={
                <Button size="small" onClick={handleRun}>
                  Retry
                </Button>
              }
            />
          ) : null}

          {analysis ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-orange-100 bg-orange-50/80 p-4">
                <p className="text-gray-800 text-sm m-0 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>

              {weeklyPlan.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-800 m-0 flex items-center gap-2">
                    <RocketOutlined className="text-[#FF8132]" />
                    {periodOpen
                      ? 'Actionable plan for the days still left'
                      : 'Review of this finished period'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3">
                    {weeklyPlan.map((item, idx) => {
                      const open = Boolean(detailsOpen[idx]);
                      const steps = actionSteps(item.action);
                      const hasDetails = Boolean(
                        item.action ||
                          (item.period_outlook &&
                            (item.period_outlook.this_week ||
                              item.period_outlook.month_to_date ||
                              item.period_outlook.monthly_target ||
                              item.period_outlook.insight))
                      );
                      return (
                      <div
                        key={idx}
                        className="flex flex-col rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                          <span className="text-sm font-bold text-gray-900">
                            {metricLabel(item.metric)}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusChipClass(item.status)}`}
                          >
                            {statusLabel(item.status, item.metric)}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 m-0 mb-1 leading-snug">
                          {item.title || item.action}
                        </p>
                        {item.finding ? (
                          <p className={`text-xs text-gray-600 m-0 mb-2 leading-relaxed ${open ? '' : 'line-clamp-3'}`}>
                            {item.finding}
                            {item.variance_amount
                              ? ` · ${item.variance_amount}`
                              : ''}
                          </p>
                        ) : null}
                        {item.daily_target ? (
                          <div className="rounded-lg bg-orange-50 border border-orange-100 px-2.5 py-1.5 mb-2">
                            <p className="text-[10px] uppercase tracking-wide text-orange-700 m-0 mb-0.5">
                              {periodOpen ? 'Daily target' : 'Period result'}
                              {periodOpen && item.remaining_days
                                ? ` · ${item.remaining_days} day(s) left`
                                : ''}
                            </p>
                            <p className="text-xs font-semibold text-gray-900 m-0 leading-snug">
                              {item.daily_target}
                            </p>
                          </div>
                        ) : null}
                        {open && item.period_outlook &&
                        (item.period_outlook.this_week ||
                          item.period_outlook.month_to_date ||
                          item.period_outlook.monthly_target ||
                          item.period_outlook.insight) ? (
                          <div className="rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 mb-2 space-y-1">
                            {item.period_outlook.this_week ? (
                              <p className="text-xs text-gray-800 m-0">
                                <span className="font-medium">This Week: </span>
                                {item.period_outlook.this_week}
                              </p>
                            ) : null}
                            {item.period_outlook.month_to_date ? (
                              <p className="text-xs text-gray-800 m-0">
                                <span className="font-medium">Month to Date: </span>
                                {item.period_outlook.month_to_date}
                              </p>
                            ) : null}
                            {item.period_outlook.monthly_target ? (
                              <p className="text-xs text-gray-800 m-0">
                                <span className="font-medium">Monthly Target: </span>
                                {item.period_outlook.monthly_target}
                              </p>
                            ) : null}
                            {item.period_outlook.insight ? (
                              <p className="text-xs text-gray-700 m-0 pt-1">
                                <span className="font-medium">LIO Insight: </span>
                                {item.period_outlook.insight}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                        {open && steps.length ? (
                          <ol className="text-xs text-gray-700 m-0 mb-2 pl-4 space-y-1 list-decimal">
                            {steps.map((step, stepIdx) => (
                              <li key={stepIdx}>{step}</li>
                            ))}
                          </ol>
                        ) : null}
                        <div className="mt-auto flex items-center justify-between gap-2">
                          {hasDetails ? (
                            <button
                              type="button"
                              className="text-xs font-semibold text-[#FF8132] hover:text-[#EB5B00] bg-transparent border-0 p-0 cursor-pointer"
                              onClick={() =>
                                setDetailsOpen((current) => ({
                                  ...current,
                                  [idx]: !current[idx],
                                }))
                              }
                            >
                              {open ? 'Hide Details' : 'View Details →'}
                            </button>
                          ) : <span />}
                          <Tag
                            color={priorityColor(item.priority)}
                            className="!m-0 !text-[10px] !leading-4 !px-1.5"
                          >
                            {item.priority || 'medium'} priority
                          </Tag>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 m-0">
                  No recovery actions needed for this week based on closed days so
                  far.
                </p>
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default KeyFindingsActionPlan;
