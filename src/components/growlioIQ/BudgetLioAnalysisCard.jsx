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
import useLioFeatureUsage from '../../hooks/useLioFeatureUsage';
import {
  LIO_FEATURE,
  pollGrowlioIQStatus,
  runGrowlioIQAnalysis,
} from '../../services/growlioIqApi';

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
const BudgetLioAnalysisCard = ({ startDate, endDate, autoRun = false }) => {
  const navigate = useNavigate();
  const { planLoading, unlimited, locked, remainingCopy, applyUsage, lockFeature } =
    useLioFeatureUsage(LIO_FEATURE.BUDGET);
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
        feature: LIO_FEATURE.BUDGET,
      });
      if (start?.usage) applyUsage(start.usage);
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
      const data = err?.response?.data;
      if (data?.upgrade_required) lockFeature(data);
      setError(data?.error || err.message || 'LIO budget analysis failed');
    }
  }, [
    applyUsage,
    endDate,
    lockFeature,
    locked,
    navigate,
    rangeKey,
    startDate,
    stopPoll,
  ]);

  // Only auto-run when the parent explicitly opts in, and never on Lite quota.
  useEffect(() => {
    if (!autoRun || !unlimited || planLoading || !rangeKey) return;
    if (autoRanRef.current === rangeKey) return;
    autoRanRef.current = rangeKey;
    handleRun();
  }, [autoRun, unlimited, planLoading, rangeKey, handleRun]);

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
          {locked ? (
            <Button
              type="primary"
              size="small"
              className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
              onClick={() => navigate('/dashboard/pricing')}
            >
              Upgrade to Grow or Pro
            </Button>
          ) : (
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
          )}
          <Button size="small" onClick={() => navigate('/dashboard/report-card')}>
            Full analysis
          </Button>
        </div>
      </div>

      {remainingCopy ? (
        <p className="text-sm text-gray-500 mb-3 m-0">{remainingCopy}</p>
      ) : null}

      {locked ? (
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          message="You've used all 5 free LIO reviews for this feature this month. Upgrade to Grow or Pro to keep using LIO."
        />
      ) : null}

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

      {!running && !error && !analysis && !locked ? (
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
