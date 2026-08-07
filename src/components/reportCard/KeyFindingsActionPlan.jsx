import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Spin, Tag } from 'antd';
import {
  BulbOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../store/store';
import { pollGrowlioIQStatus, runGrowlioIQAnalysis } from '../../services/growlioIqApi';

const getPlanName = (plan) =>
  String(plan?.key || plan?.name || plan?.display_name || plan?.package_name || '')
    .trim()
    .toLowerCase();

const isGrowlioIQPlan = (planName) =>
  planName.includes('grow') || planName.includes('pro');

const priorityColor = (priority) => {
  const value = String(priority || '').toLowerCase();
  if (value === 'high') return 'red';
  if (value === 'low') return 'default';
  return 'orange';
};

const metricLabel = (metric) => {
  const value = String(metric || '').toLowerCase();
  if (value === 'labor' || value === 'labour') return 'Labor';
  if (value === 'cogs') return 'COGS';
  if (value === 'sales') return 'Sales';
  if (value === 'expenses') return 'Expenses';
  return metric || 'Metric';
};

const statusTone = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'over' || value === 'behind') return 'error';
  if (value === 'under' || value === 'on_track') return 'success';
  return 'warning';
};

/**
 * AI-driven Key Findings → weekly action plan for Report Card.
 * Uses Growlio IQ focus=weekly_recovery for the selected week.
 */
const KeyFindingsActionPlan = ({
  startDate,
  endDate,
  statusFindings = { over: [], under: [] },
  showNoClosedDaysGuidance = false,
  autoRun = true,
}) => {
  const fetchCurrentSubscriptionDetails = useStore(
    (s) => s.fetchCurrentSubscriptionDetails
  );
  const [planLoading, setPlanLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [planName, setPlanName] = useState('');
  const [running, setRunning] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
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

  const periodLabel = useMemo(() => {
    if (!startDate || !endDate) return '';
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    if (!start.isValid() || !end.isValid()) return '';
    return `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`;
  }, [startDate, endDate]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setPlanLoading(true);
      try {
        const result = await fetchCurrentSubscriptionDetails?.(false);
        const storeState = useStore.getState();
        const name = getPlanName(
          result?.data?.package ||
            storeState.subscriptionDetails?.package ||
            storeState.currentPackage
        );
        if (!mounted) return;
        setPlanName(name);
        setAllowed(isGrowlioIQPlan(name));
      } catch {
        const storeState = useStore.getState();
        const name = getPlanName(
          storeState.subscriptionDetails?.package || storeState.currentPackage
        );
        if (!mounted) return;
        setPlanName(name);
        setAllowed(isGrowlioIQPlan(name));
      } finally {
        if (mounted) setPlanLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [fetchCurrentSubscriptionDetails]);

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
      });
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
      setError(
        err?.response?.data?.error || err.message || 'LIO action plan failed'
      );
    }
  }, [rangeKey, stopPoll]);

  useEffect(() => {
    if (!autoRun || !allowed || planLoading || !rangeKey) return;
    if (showNoClosedDaysGuidance) return;
    if (autoRanRef.current === rangeKey) return;
    autoRanRef.current = rangeKey;
    handleRun();
  }, [
    autoRun,
    allowed,
    planLoading,
    rangeKey,
    showNoClosedDaysGuidance,
    handleRun,
  ]);

  const weeklyPlan = useMemo(() => {
    const fromWeekly = analysis?.weekly_action_plan;
    if (Array.isArray(fromWeekly) && fromWeekly.length) return fromWeekly;
    // Fallback: map generic action_plan into actionable cards
    return (analysis?.action_plan || []).map((item) => ({
      metric: 'general',
      status: 'over',
      title: item.priority === 'high' ? 'Priority action' : 'Recommended action',
      finding: '',
      variance_amount: '',
      remaining_days: null,
      daily_target: '',
      action: item.action,
      priority: item.priority || 'medium',
    }));
  }, [analysis]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BulbOutlined className="text-xl text-[#FF8132]" />
            <h2 className="text-2xl font-bold text-orange-600 mb-0">
              LIO Action Plan
            </h2>
          </div>
          <p className="text-sm text-gray-500 m-0">
            Not just findings — what to do the rest of the week to get sales, COGS,
            and labor back on track
            {periodLabel ? ` · ${periodLabel}` : ''}
          </p>
        </div>
        {allowed && !showNoClosedDaysGuidance ? (
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

      {!planLoading && !allowed ? (
        <Alert
          type="info"
          showIcon
          message="AI weekly action plans are available on Grow and Pro."
          description={
            planName
              ? `Your current plan: ${planName}. Upgrade to get daily recovery targets from LIO.`
              : 'Upgrade to get daily recovery targets from LIO.'
          }
        />
      ) : null}

      {showNoClosedDaysGuidance ? (
        <div className="text-sm font-medium text-orange-600 text-center py-4">
          Action plans appear once you&apos;ve entered your daily numbers and closed
          out the day.
        </div>
      ) : null}

      {allowed && !showNoClosedDaysGuidance ? (
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
                    Actionable plan for the rest of the week
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {weeklyPlan.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Tag color={statusTone(item.status)}>
                            {metricLabel(item.metric)}
                          </Tag>
                          <Tag color={priorityColor(item.priority)}>
                            {item.priority || 'medium'}
                          </Tag>
                        </div>
                        <p className="font-semibold text-gray-900 m-0 mb-1">
                          {item.title || item.action}
                        </p>
                        {item.finding ? (
                          <p className="text-sm text-gray-600 m-0 mb-2">
                            {item.finding}
                            {item.variance_amount
                              ? ` · ${item.variance_amount}`
                              : ''}
                          </p>
                        ) : null}
                        {item.daily_target ? (
                          <div className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2 mb-2">
                            <p className="text-xs uppercase tracking-wide text-orange-700 m-0 mb-0.5">
                              Daily target
                              {item.remaining_days
                                ? ` · ${item.remaining_days} day(s) left`
                                : ''}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 m-0">
                              {item.daily_target}
                            </p>
                          </div>
                        ) : null}
                        {item.action ? (
                          <p className="text-sm text-gray-700 m-0">
                            <span className="font-medium">Do this: </span>
                            {item.action}
                          </p>
                        ) : null}
                      </div>
                    ))}
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

      {/* Keep rule-based over/under as a quick status snapshot */}
      {!showNoClosedDaysGuidance &&
      ((statusFindings.over || []).length > 0 ||
        (statusFindings.under || []).length > 0) ? (
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3 m-0">
            Status snapshot (this week)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              {(statusFindings.over || []).length > 0 ? (
                statusFindings.over.map((finding, idx) => (
                  <div key={`over-${idx}`} className="flex items-start gap-2">
                    <ExclamationCircleOutlined className="text-red-500 mt-0.5" />
                    <span className="text-sm text-gray-700">{finding.text}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400 italic">No over-goal items</div>
              )}
            </div>
            <div className="space-y-2">
              {(statusFindings.under || []).length > 0 ? (
                statusFindings.under.map((finding, idx) => (
                  <div key={`under-${idx}`} className="flex items-start gap-2">
                    <CheckOutlined className="text-green-600 mt-0.5" />
                    <span className="text-sm text-gray-700">{finding.text}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400 italic">No under-goal items</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default KeyFindingsActionPlan;
