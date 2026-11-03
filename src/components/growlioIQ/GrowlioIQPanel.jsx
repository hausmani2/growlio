import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Collapse,
  DatePicker,
  Input,
  Select,
  Spin,
  Tag,
  message,
} from 'antd';
import {
  BulbOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RocketOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useLioFeatureUsage from '../../hooks/useLioFeatureUsage';
import useStore from '../../store/store';
import {
  LIO_FEATURE,
  pollGrowlioIQStatus,
  runGrowlioIQAnalysis,
} from '../../services/growlioIqApi';
import lioMascot from '../../assets/pngs/lio-mascot.png';

const { RangePicker } = DatePicker;

const SUGGESTED_QUESTIONS = [
  { label: 'Analyze My Budget', focus: 'budget' },
  { label: 'How Can I Make More Money', focus: 'revenue' },
  { label: 'Why is my labor so high', focus: 'labor' },
  { label: 'Weekly Recovery Plan', focus: 'weekly_recovery' },
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

const healthColor = (label) => {
  const value = String(label || '').toLowerCase();
  if (value.includes('healthy')) return 'success';
  if (value.includes('critical')) return 'error';
  return 'warning';
};

const GrowlioIQPanel = ({ initialDateRange, hideDateControls = false }) => {
  const navigate = useNavigate();
  const { planLoading, locked, remainingCopy, applyUsage, lockFeature } =
    useLioFeatureUsage(LIO_FEATURE.GROWLIO_IQ);
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
  const [customQuestion, setCustomQuestion] = useState('');
  const setPendingChatMessage = useStore((state) => state.setPendingChatMessage);
  const pollRef = useRef(null);

  useEffect(() => {
    if (initialDateRange?.[0] && initialDateRange?.[1]) {
      setDateRange(initialDateRange);
    }
  }, [initialDateRange]);

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

  const handleRun = useCallback(async (focusOverride) => {
    const runFocus =
      typeof focusOverride === 'string' && focusOverride ? focusOverride : focus;
    if (locked) {
      navigate('/dashboard/pricing');
      return;
    }
    if (!dateRange?.[0] || !dateRange?.[1]) {
      message.error('Select a date range first');
      return;
    }
    stopPoll();
    setExpanded(true);
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
      const start = await runGrowlioIQAnalysis({
        startDate,
        endDate,
        focus: runFocus,
        feature: LIO_FEATURE.GROWLIO_IQ,
      });
      if (start?.usage) applyUsage(start.usage);
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
      const data = error?.response?.data;
      if (data?.upgrade_required) lockFeature(data);
      message.error({
        content: data?.error || error.message || 'Analysis failed',
        key: 'growlio-iq',
        duration: 5,
      });
    }
  }, [applyUsage, dateRange, focus, lockFeature, locked, navigate]);

  const periodLabel = useMemo(() => {
    if (!dateRange?.[0] || !dateRange?.[1]) return '';
    return `${dateRange[0].format('MMM D, YYYY')} - ${dateRange[1].format('MMM D, YYYY')}`;
  }, [dateRange]);

  // Custom questions go to the LIO chat advisor with the selected period attached,
  // so answers stay date-aware without a second date control.
  const handleAskCustom = useCallback(() => {
    const question = customQuestion.trim();
    if (!question) {
      message.info('Type a question for LIO first');
      return;
    }
    if (typeof setPendingChatMessage !== 'function') {
      message.error('LIO chat is not available right now');
      return;
    }
    const prefixed = periodLabel
      ? `For the period ${periodLabel}: ${question}`
      : question;
    setPendingChatMessage(prefixed);
    setCustomQuestion('');
  }, [customQuestion, periodLabel, setPendingChatMessage]);

  const handlePreset = useCallback(
    (item) => {
      setFocus(item.focus);
      handleRun(item.focus);
    },
    [handleRun]
  );

  if (planLoading) {
    return (
      <Card className="shadow-sm border border-gray-100">
        <div className="flex items-center justify-center py-8">
          <Spin />
        </div>
      </Card>
    );
  }

  const presetButtons = (
    <div className="flex flex-wrap gap-2">
      {SUGGESTED_QUESTIONS.map((item) => (
        <Button
          key={item.focus}
          size="small"
          shape="round"
          type={focus === item.focus ? 'primary' : 'default'}
          disabled={running}
          className={
            focus === item.focus
              ? '!bg-[#FF8132] hover:!bg-[#EB5B00] border-none'
              : '!border-orange-200 !text-gray-700 hover:!text-[#FF8132] hover:!border-[#FF8132]'
          }
          onClick={() => handlePreset(item)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );

  const customQuestionInput = (
    <div className="flex items-stretch gap-2">
      <Input
        value={customQuestion}
        onChange={(e) => setCustomQuestion(e.target.value)}
        onPressEnter={handleAskCustom}
        placeholder="Ask LIO anything about this period…"
        maxLength={500}
        allowClear
        aria-label="Ask LIO a custom question"
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
        onClick={handleAskCustom}
        disabled={!customQuestion.trim()}
      >
        Ask
      </Button>
    </div>
  );

  return (
    <Card className="shadow-sm border border-gray-100" styles={{ body: { padding: 16 } }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={lioMascot}
            alt="LIO"
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold m-0 flex items-center gap-2">
              <BulbOutlined className="text-[#FF8132]" />
              Ask LIO — Growlio IQ
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 m-0">
              {hideDateControls
                ? `Uses the Report Card dates${periodLabel ? ` · ${periodLabel}` : ''}`
                : 'AI consultant review of your restaurant data'}
              {remainingCopy ? ` · ${remainingCopy}` : ''}
            </p>
          </div>
        </div>
        <Button size="small" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Hide full analysis' : 'Full analysis'}
        </Button>
      </div>

      {/* Compact state: presets + custom question are always available. */}
      {!locked ? (
        <div className="space-y-2 mb-3">
          {presetButtons}
          {customQuestionInput}
        </div>
      ) : null}

      {locked ? (
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message="You've used all 5 free LIO reviews for this feature this month. Upgrade to Grow or Pro to keep using LIO."
          action={
            <Button
              type="primary"
              size="small"
              className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
              onClick={() => navigate('/dashboard/pricing')}
            >
              Upgrade
            </Button>
          }
        />
      ) : null}

      {expanded ? (
        <div className="space-y-4">
          <Alert
            type="info"
            showIcon
            message="Growlio IQ reviews your sales, labor, food cost, budget, and operational data, then tells you what to fix next."
          />

          <div className="flex flex-wrap items-center gap-3">
            {hideDateControls ? null : (
              <>
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
              </>
            )}
            {locked ? (
              <Button
                type="primary"
                className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
                onClick={() => navigate('/dashboard/pricing')}
              >
                Upgrade to Grow or Pro
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                loading={running}
                className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
                onClick={() => handleRun()}
              >
                Run Growlio IQ
              </Button>
            )}
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
        <p className="text-xs text-gray-500 m-0">
          Pick a question above or open the full analysis for a complete review of{' '}
          {periodLabel || 'your selected period'}.
        </p>
      )}
    </Card>
  );
};

export default GrowlioIQPanel;
