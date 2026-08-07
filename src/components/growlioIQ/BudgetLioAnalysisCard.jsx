import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Spin, Tag, message } from 'antd';
import {
  BulbOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useStore from '../../store/store';
import { pollGrowlioIQStatus, runGrowlioIQAnalysis } from '../../services/growlioIqApi';

const getPlanName = (plan) =>
  String(plan?.key || plan?.name || plan?.display_name || plan?.package_name || '')
    .trim()
    .toLowerCase();

const isGrowlioIQPlan = (planName) =>
  planName.includes('grow') || planName.includes('pro');

const healthColor = (label) => {
  const value = String(label || '').toLowerCase();
  if (value.includes('healthy')) return 'success';
  if (value.includes('critical')) return 'error';
  return 'warning';
};

/**
 * Compact LIO budget feedback for the Budget screen.
 * Reuses Growlio IQ with focus=budget for the selected week.
 */
const BudgetLioAnalysisCard = ({ startDate, endDate, autoRun = true }) => {
  const navigate = useNavigate();
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
  const lastRangeRef = useRef('');
  const autoRanRef = useRef('');

  const rangeKey = useMemo(() => {
    if (!startDate || !endDate) return '';
    return `${startDate}|${endDate}`;
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
    if (!startDate || !endDate) {
      message.error('Select a budget week first');
      return;
    }
    stopPoll();
    setRunning(true);
    setError('');
    setAnalysis(null);
    lastRangeRef.current = rangeKey;

    try {
      const start = await runGrowlioIQAnalysis({
        startDate,
        endDate,
        focus: 'budget',
      });
      if (!start?.job_id) {
        throw new Error(start?.error || 'Failed to start LIO budget analysis');
      }

      pollRef.current = setInterval(async () => {
        try {
          const poll = await pollGrowlioIQStatus(start.job_id);
          if (poll.status === 'done') {
            stopPoll();
            setRunning(false);
            setAnalysis(poll.analysis || null);
          } else if (poll.status === 'error') {
            stopPoll();
            setRunning(false);
            setError(poll.error || 'LIO budget analysis failed');
          }
        } catch {
          // keep polling on transient errors
        }
      }, 3000);
    } catch (err) {
      stopPoll();
      setRunning(false);
      setError(
        err?.response?.data?.error || err.message || 'LIO budget analysis failed'
      );
    }
  }, [startDate, endDate, rangeKey, stopPoll]);

  // Auto-run once per selected week for Grow/Pro users.
  useEffect(() => {
    if (!autoRun || !allowed || planLoading || !rangeKey) return;
    if (autoRanRef.current === rangeKey) return;
    autoRanRef.current = rangeKey;
    handleRun();
  }, [autoRun, allowed, planLoading, rangeKey, handleRun]);

  if (planLoading) {
    return (
      <Card className="shadow-sm border border-orange-100 mb-0">
        <div className="flex items-center gap-3 py-2">
          <Spin size="small" />
          <span className="text-gray-600 text-sm">Loading LIO Budget Analysis…</span>
        </div>
      </Card>
    );
  }

  if (!allowed) {
    return (
      <Card className="shadow-sm border border-orange-100">
        <div className="flex items-start gap-3">
          <BulbOutlined className="text-xl text-[#FF8132] mt-0.5" />
          <div>
            <h3 className="text-base font-semibold m-0">LIO Budget Analysis</h3>
            <p className="text-gray-600 text-sm mt-1 mb-0">
              Quick AI feedback on your week’s budget is available on Grow and Pro.
              {planName ? ` Current plan: ${planName}.` : ''}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const problems = (analysis?.problems || []).slice(0, 4);
  const actions = (analysis?.action_plan || []).slice(0, 3);

  return (
    <Card
      className="shadow-sm border border-orange-100"
      styles={{ body: { padding: '16px 20px' } }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <BulbOutlined className="text-2xl text-[#FF8132] mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold m-0">LIO Budget Analysis</h3>
            <p className="text-sm text-gray-500 m-0">
              Quick feedback for {periodLabel || 'this week'} — labor, food cost, and
              overspending signals
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="primary"
            size="small"
            icon={analysis ? <ReloadOutlined /> : <ThunderboltOutlined />}
            loading={running}
            className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
            onClick={handleRun}
          >
            {analysis ? 'Refresh' : 'Analyze this week'}
          </Button>
          <Button size="small" onClick={() => navigate('/dashboard/report-card')}>
            Full analysis
          </Button>
        </div>
      </div>

      {running && !analysis ? (
        <div className="flex items-center gap-3 py-4">
          <Spin />
          <span className="text-gray-600 text-sm">
            LIO is reviewing your budget for this week…
          </span>
        </div>
      ) : null}

      {error ? (
        <Alert
          type="error"
          showIcon
          className="mb-0"
          message={error}
          action={
            <Button size="small" onClick={handleRun}>
              Retry
            </Button>
          }
        />
      ) : null}

      {!running && !error && !analysis ? (
        <p className="text-gray-600 text-sm m-0">
          Run analysis to get quick notes like high labor, overspending on specific
          expenses, or where you’re ahead of budget.
        </p>
      ) : null}

      {analysis ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-orange-100 bg-orange-50/80 p-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Tag color={healthColor(analysis.health_label)}>
                {analysis.health_label || 'Budget review'}
              </Tag>
              {analysis.health_score != null ? (
                <span className="text-sm font-semibold text-[#FF8132]">
                  {analysis.health_score}/100
                </span>
              ) : null}
            </div>
            <p className="text-gray-800 text-sm m-0 leading-relaxed">
              {analysis.summary}
            </p>
          </div>

          {problems.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 m-0 flex items-center gap-1.5">
                <ExclamationCircleOutlined className="text-red-500" />
                What to watch
              </p>
              <ul className="m-0 pl-5 space-y-1.5">
                {problems.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    <span className="font-medium">{item.title}</span>
                    {item.explanation ? (
                      <span className="text-gray-600"> — {item.explanation}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {actions.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700 m-0">Next steps</p>
              <ul className="m-0 pl-5 space-y-1">
                {actions.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    {item.action}
                    {item.priority ? (
                      <Tag className="ml-2" style={{ fontSize: 11 }}>
                        {item.priority}
                      </Tag>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
};

export default BudgetLioAnalysisCard;
