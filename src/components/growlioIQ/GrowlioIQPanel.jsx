import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Collapse,
  DatePicker,
  Select,
  Space,
  Spin,
  Tag,
  message,
} from 'antd';
import {
  BulbOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../store/store';
import { pollGrowlioIQStatus, runGrowlioIQAnalysis } from '../../services/growlioIqApi';

const { RangePicker } = DatePicker;

const SUGGESTED_QUESTIONS = [
  { label: 'Analyze My Budget', focus: 'budget' },
  { label: 'How Can I Make More Money', focus: 'revenue' },
  { label: 'Why is my labor so high', focus: 'labor' },
];

const QUICK_RANGES = [
  {
    label: 'This Week',
    getValue: () => [dayjs().startOf('week'), dayjs()],
  },
  {
    label: 'Last Week',
    getValue: () => [
      dayjs().subtract(1, 'week').startOf('week'),
      dayjs().subtract(1, 'week').endOf('week'),
    ],
  },
  {
    label: 'This Month',
    getValue: () => [dayjs().startOf('month'), dayjs()],
  },
  {
    label: 'Last Month',
    getValue: () => [
      dayjs().subtract(1, 'month').startOf('month'),
      dayjs().subtract(1, 'month').endOf('month'),
    ],
  },
  {
    label: 'Year To Date',
    getValue: () => [dayjs().startOf('year'), dayjs()],
  },
];

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

const GrowlioIQPanel = ({ initialDateRange }) => {
  const fetchCurrentSubscriptionDetails = useStore(
    (s) => s.fetchCurrentSubscriptionDetails
  );
  const [planLoading, setPlanLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [planName, setPlanName] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [dateRange, setDateRange] = useState(
    initialDateRange || [
      dayjs().subtract(1, 'month').startOf('month'),
      dayjs().subtract(1, 'month').endOf('month'),
    ]
  );
  const [focus, setFocus] = useState('general');
  const [running, setRunning] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (initialDateRange?.[0] && initialDateRange?.[1]) {
      setDateRange(initialDateRange);
    }
  }, [initialDateRange]);

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

  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
    },
    []
  );

  const stopPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleRun = useCallback(async () => {
    if (!dateRange?.[0] || !dateRange?.[1]) {
      message.error('Select a date range first');
      return;
    }
    stopPoll();
    setRunning(true);
    setAnalysis(null);
    message.loading({
      content: 'Growlio IQ is analyzing your business…',
      key: 'growlio-iq',
      duration: 0,
    });

    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      const start = await runGrowlioIQAnalysis({ startDate, endDate, focus });
      if (!start?.job_id) {
        throw new Error(start?.error || 'Failed to start Growlio IQ analysis');
      }

      pollRef.current = setInterval(async () => {
        try {
          const poll = await pollGrowlioIQStatus(start.job_id);
          if (poll.status === 'done') {
            stopPoll();
            setRunning(false);
            setAnalysis(poll.analysis || null);
            message.success({
              content: 'Growlio IQ analysis complete',
              key: 'growlio-iq',
              duration: 4,
            });
          } else if (poll.status === 'error') {
            stopPoll();
            setRunning(false);
            message.error({
              content: poll.error || 'Growlio IQ analysis failed',
              key: 'growlio-iq',
              duration: 5,
            });
          }
        } catch {
          // keep polling on transient errors
        }
      }, 3000);
    } catch (error) {
      stopPoll();
      setRunning(false);
      message.error({
        content: error?.response?.data?.error || error.message || 'Analysis failed',
        key: 'growlio-iq',
        duration: 5,
      });
    }
  }, [dateRange, focus]);

  const periodLabel = useMemo(() => {
    if (!dateRange?.[0] || !dateRange?.[1]) return '';
    return `${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')}`;
  }, [dateRange]);

  if (planLoading) {
    return (
      <Card className="shadow-sm border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <Spin />
        </div>
      </Card>
    );
  }

  if (!allowed) {
    return (
      <Card className="shadow-sm border border-gray-100">
        <div className="flex items-start gap-3">
          <BulbOutlined className="text-2xl text-[#FF8132] mt-1" />
          <div>
            <h3 className="text-lg font-semibold m-0">Growlio IQ</h3>
            <p className="text-gray-600 mt-2 mb-0">
              AI-powered business analysis is available on Grow and Pro plans.
              {planName ? ` Your current plan: ${planName}.` : ''}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <BulbOutlined className="text-2xl text-[#FF8132]" />
          <div>
            <h3 className="text-lg font-semibold m-0">Growlio IQ</h3>
            <p className="text-sm text-gray-500 m-0">
              AI consultant review of your restaurant data
            </p>
          </div>
        </div>
        <Button onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {expanded ? (
        <div className="space-y-4">
          <Alert
            type="info"
            showIcon
            message="Growlio IQ reviews your sales, labor, food cost, budget, and operational data, then tells you what to fix next."
          />

          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((item) => (
              <Button
                key={item.focus}
                type={focus === item.focus ? 'primary' : 'default'}
                className={
                  focus === item.focus
                    ? '!bg-[#FF8132] hover:!bg-[#EB5B00] border-none'
                    : ''
                }
                onClick={() => setFocus(item.focus)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={null}
              placeholder="Quick range"
              style={{ minWidth: 160 }}
              onChange={(_, option) => {
                if (option?.getValue) setDateRange(option.getValue());
              }}
              options={QUICK_RANGES.map((range) => ({
                label: range.label,
                value: range.label,
                getValue: range.getValue,
              }))}
            />
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates)}
            />
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={running}
              className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
              onClick={handleRun}
            >
              Run Growlio IQ
            </Button>
          </div>

          {periodLabel ? (
            <p className="text-sm text-gray-500 m-0">Analyzing: {periodLabel}</p>
          ) : null}

          {running && !analysis ? (
            <div className="flex items-center gap-3 py-6">
              <Spin />
              <span className="text-gray-600">
                LIO is reviewing your business. This may take a minute…
              </span>
            </div>
          ) : null}

          {analysis ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <Tag color={healthColor(analysis.health_label)}>
                    {analysis.health_label || 'Analysis'}
                  </Tag>
                  <span className="text-2xl font-bold text-[#FF8132]">
                    {analysis.health_score ?? '—'}/100
                  </span>
                  <Tag icon={<CheckCircleOutlined />} color="blue">
                    Confidence {analysis.confidence_score ?? '—'}%
                  </Tag>
                </div>
                <p className="text-gray-700 m-0">{analysis.summary}</p>
              </div>

              <Collapse
                defaultActiveKey={['problems', 'actions']}
                items={[
                  {
                    key: 'problems',
                    label: (
                      <span>
                        <ExclamationCircleOutlined className="mr-2 text-red-500" />
                        Key Problems
                      </span>
                    ),
                    children: (
                      <div className="space-y-3">
                        {(analysis.problems || []).length === 0 ? (
                          <p className="text-gray-500 m-0">No major problems detected.</p>
                        ) : (
                          (analysis.problems || []).map((item, idx) => (
                            <div key={idx} className="rounded-lg border p-3">
                              <p className="font-semibold m-0">{item.title}</p>
                              <p className="text-sm text-gray-600 mt-1 mb-1">
                                {item.explanation}
                              </p>
                              {item.impact ? (
                                <p className="text-sm text-red-600 m-0">{item.impact}</p>
                              ) : null}
                            </div>
                          ))
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'positive',
                    label: (
                      <span>
                        <CheckCircleOutlined className="mr-2 text-green-500" />
                        Positive Trends
                      </span>
                    ),
                    children: (
                      <div className="space-y-3">
                        {(analysis.positive_trends || []).map((item, idx) => (
                          <div key={idx} className="rounded-lg border p-3">
                            <p className="font-semibold m-0">{item.title}</p>
                            <p className="text-sm text-gray-600 mt-1 mb-0">
                              {item.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    ),
                  },
                  {
                    key: 'actions',
                    label: (
                      <span>
                        <RocketOutlined className="mr-2 text-[#FF8132]" />
                        Recommended Action Plan
                      </span>
                    ),
                    children: (
                      <div className="space-y-2">
                        {(analysis.action_plan || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start justify-between gap-3 rounded-lg border p-3"
                          >
                            <p className="m-0">{item.action}</p>
                            <Tag>{item.priority || 'medium'}</Tag>
                          </div>
                        ))}
                      </div>
                    ),
                  },
                  {
                    key: 'opportunities',
                    label: 'Financial Opportunities',
                    children: (
                      <div className="space-y-3">
                        {(analysis.financial_opportunities || []).map((item, idx) => (
                          <div key={idx} className="rounded-lg border p-3">
                            <p className="font-semibold text-[#FF8132] m-0">
                              {item.estimate}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 mb-0">
                              {item.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-gray-600 m-0">
          Expand Growlio IQ to get an AI review of your biggest issues, wins, and next
          steps for {periodLabel || 'your selected period'}.
        </p>
      )}
    </Card>
  );
};

export default GrowlioIQPanel;
