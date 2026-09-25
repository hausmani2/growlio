import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Card, DatePicker, Popover, Spin, Tag } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  FaBriefcase,
  FaShoppingBasket,
  FaHome,
  FaTools,
  FaWallet,
} from 'react-icons/fa';
import dayjs from 'dayjs';
import useStore from '../../../../store/store';
import lioMascot from '../../../../assets/pngs/lio-mascot.png';

const money = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  const abs = Math.abs(num).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return num < 0 ? `-$${abs}` : `$${abs}`;
};

/** Positive / zero → In your pocket; negative → Out of pocket. */
const pocketLabel = (value, { estimated = false, prefix = '' } = {}) => {
  const num = Number(value);
  const base =
    Number.isFinite(num) && num < 0 ? 'Out of pocket' : 'In your pocket';
  const withEstimate = estimated ? `Estimated ${base}` : base;
  return prefix ? `${prefix}${withEstimate}` : withEstimate;
};

const SOURCE_LABELS = {
  actual: 'Actual',
  budget: 'Budget',
  estimate: 'Estimate',
};

const sourceColor = (source) => {
  if (source === 'actual') return 'green';
  if (source === 'budget') return 'blue';
  return 'orange';
};

const weakestSource = (...sources) => {
  const list = sources.filter(Boolean);
  if (list.includes('estimate')) return 'estimate';
  if (list.includes('budget')) return 'budget';
  if (list.includes('actual')) return 'actual';
  return 'estimate';
};

const statusClass = (status) => {
  if (status === 'short') return 'text-red-600';
  if (status === 'over') return 'text-emerald-600';
  return 'text-gray-500';
};

const ENVELOPES = [
  {
    key: 'labor',
    title: 'Labor',
    accent: 'bg-sky-500',
    tint: 'bg-sky-50 border-sky-100',
    icon: FaBriefcase,
    iconWrap: 'bg-sky-100 text-sky-600',
    bar: 'bg-sky-500',
  },
  {
    key: 'cogs',
    title: 'COGS / Food',
    accent: 'bg-orange-500',
    tint: 'bg-orange-50 border-orange-100',
    icon: FaShoppingBasket,
    iconWrap: 'bg-orange-100 text-orange-600',
    bar: 'bg-orange-500',
  },
  {
    key: 'rent',
    title: 'Rent',
    accent: 'bg-violet-500',
    tint: 'bg-violet-50 border-violet-100',
    icon: FaHome,
    iconWrap: 'bg-violet-100 text-violet-600',
    bar: 'bg-violet-500',
  },
  {
    key: 'operating_expenses',
    title: 'Operating Expenses',
    accent: 'bg-teal-500',
    tint: 'bg-teal-50 border-teal-100',
    icon: FaTools,
    iconWrap: 'bg-teal-100 text-teal-600',
    bar: 'bg-teal-500',
  },
];

const ACTUAL_VS_BUDGET_HELP = (
  <div className="max-w-sm space-y-2 text-sm text-gray-700">
    <p className="font-semibold text-gray-900">Why does this say Actual or Budget?</p>
    <p>
      Growlio uses the best information available to calculate how much you should set aside.
    </p>
    <p>
      <span className="font-semibold text-emerald-700">ACTUAL</span>
      {' — '}
      You entered the actual expense in Close Day, so Growlio uses what you really spent.
    </p>
    <p>
      <span className="font-semibold text-blue-600">BUDGET</span>
      {' — '}
      No actual expense has been entered yet, so Growlio estimates the amount using your budget.
    </p>
    <p>
      Once actual numbers are entered, Growlio automatically replaces the budget estimate with the
      actual amount.
    </p>
    <p className="text-xs text-gray-500">
      For example, if yesterday’s sales were $4,250 and your Food/COGS budget is 30%, Growlio will
      show $1,275 — From Budget until the actual food cost is entered. If you enter $1,190 in Close
      Day, it changes to $1,190 — From Actual.
    </p>
  </div>
);

const WHY_ENVELOPES_HELP = (
  <div className="max-w-md max-h-[70vh] overflow-y-auto space-y-3 text-sm text-gray-700 pr-1">
    <p className="font-semibold text-gray-900 text-base">Why Envelopes?</p>
    <p className="font-medium text-gray-800">
      Sales in the bank don’t mean the money is yours to spend.
    </p>
    <p>
      Every dollar that comes into your restaurant has a job. Some of it needs to pay for labor,
      some for food, some for rent, and some for operating expenses.
    </p>
    <p>
      The problem is that you don’t always pay those expenses on the same day you make the sales.
      Payroll may be next week. A food invoice may be due later. Rent may not be due until the end
      of the month.
    </p>
    <p className="font-medium text-gray-800">That’s where the envelopes come in.</p>
    <p>
      Each day, Growlio calculates how much of your sales should be allocated to each expense based
      on your actual numbers when available and your budget when they’re not. Those amounts are
      added to your envelopes throughout the week.
    </p>
    <p>
      Think of it as setting aside the money as you earn it instead of waiting until the bill
      arrives and hoping the money is still there.
    </p>
    <p>
      The goal is simple: when the bill comes due, you’ve already planned for the money to be there.
    </p>
    <p>
      After funding your Labor, Food/COGS, Rent, and Operating Expense envelopes, Growlio shows
      what’s In Your Pocket. If your sales aren’t enough to fund those expenses, Growlio shows
      what’s Out of Pocket.
    </p>
    <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
      <p className="font-semibold">Important</p>
      <p>
        Growlio is a financial planning and management tool—not a bank, accounting system, or
        financial advisor. Growlio does not access, hold, transfer, reserve, or move your money.
      </p>
      <p>
        Envelope amounts and other cash-flow calculations are estimates based on the sales,
        expenses, budgets, targets, and other information you enter or connect to Growlio. The
        accuracy of these estimates depends on the accuracy and completeness of that information.
      </p>
      <p>
        Growlio may not include every expense, payment, tax, debt obligation, fee, timing
        difference, or other financial commitment of your business.
      </p>
      <p>
        The amounts shown should not be considered a complete representation of the cash required
        to operate your restaurant or the actual cash available in your bank account. You are
        responsible for reviewing your numbers, accounting for expenses not included in Growlio,
        and determining how much money to set aside and maintain in your own accounts to meet your
        financial obligations.
      </p>
    </div>
  </div>
);

const ActualBudgetInfoIcon = () => (
  <Popover
    content={ACTUAL_VS_BUDGET_HELP}
    trigger={['hover', 'click']}
    placement="bottomLeft"
  >
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      aria-label="Why does this say Actual or Budget?"
      onClick={(e) => e.stopPropagation()}
    >
      <InfoCircleOutlined className="text-sm" />
    </button>
  </Popover>
);

const WhyEnvelopesButton = () => (
  <Popover content={WHY_ENVELOPES_HELP} trigger={['click']} placement="bottomLeft">
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      <InfoCircleOutlined />
      Why Envelopes?
    </button>
  </Popover>
);

const SourceBadge = ({ source, label }) => {
  const text = label || SOURCE_LABELS[source];
  if (!text) return null;
  return (
    <span className="inline-flex items-center gap-1">
      <Tag color={sourceColor(source)} className="m-0">
        {text}
      </Tag>
      <ActualBudgetInfoIcon />
    </span>
  );
};

const Kpi = ({ label, value, hint, valueClass, bar, badge }) => (
  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm text-gray-500">{label}</p>
      {badge}
    </div>
    <p className={`mt-1 text-3xl font-semibold tracking-tight ${valueClass || 'text-gray-900'}`}>
      {value}
    </p>
    {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    {bar}
  </div>
);

const EnvelopeProgress = ({ percent, barClass }) => {
  const width = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>{Math.round(width)}% of weekly target</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
};

const CashFlowModule = () => {
  const {
    cashFlowData,
    cashFlowLoading,
    cashFlowError,
    fetchCashFlow,
    selectedLocationId,
  } = useStore();
  const [selectedDate, setSelectedDate] = React.useState(() => dayjs().subtract(1, 'day'));
  const loadedKey = useRef('');

  const load = useCallback(
    (dateValue) => {
      const dateStr = (dateValue || selectedDate).format('YYYY-MM-DD');
      fetchCashFlow(dateStr);
    },
    [fetchCashFlow, selectedDate]
  );

  useEffect(() => {
    const key = `${selectedDate.format('YYYY-MM-DD')}|${selectedLocationId || ''}`;
    if (loadedKey.current === key) return;
    loadedKey.current = key;
    load(selectedDate);
  }, [selectedDate, selectedLocationId, load]);

  const yesterday = cashFlowData?.yesterday || {};
  const wtd = cashFlowData?.week_to_date || {};
  const lio = cashFlowData?.lio || {};
  const envelopes = yesterday.envelopes || {};
  const wtdEnvelopes = wtd.envelopes || {};
  const setAside = Number(yesterday.set_aside) || 0;

  const stacked = useMemo(() => {
    return ENVELOPES.map((item) => {
      const amount = Number(envelopes[item.key]?.amount) || 0;
      const pct = setAside > 0 ? Math.max(0, (amount / setAside) * 100) : 0;
      return { ...item, amount, pct };
    });
  }, [envelopes, setAside]);

  const cashStatus = yesterday.status;
  const cashLeftSource = weakestSource(
    yesterday.sales?.source,
    envelopes.labor?.source,
    envelopes.cogs?.source,
    envelopes.rent?.source,
    envelopes.operating_expenses?.source
  );
  const isYesterday = selectedDate.isSame(dayjs().subtract(1, 'day'), 'day');
  const dayLabel = isYesterday ? 'Yesterday' : selectedDate.format('ddd, MMM D');
  const dayPocketLabel = pocketLabel(yesterday.cash_left, {
    estimated: cashLeftSource === 'estimate',
  });
  const pocketWtd = wtdEnvelopes.pocket || {};
  const pocketAmount = Number(pocketWtd.amount ?? wtd.cash_left) || 0;
  const pocketTitle =
    pocketWtd.label || (pocketAmount < 0 ? 'Out of pocket' : 'In your pocket');

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Cash Flow
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              {dayLabel}: sales, set aside,{' '}
              {Number(yesterday.cash_left) < 0 ? 'out of pocket' : 'in your pocket'}
            </h2>
            <p className="text-sm text-gray-600">
              Growlio is not moving money. This is what should be set aside from sales, and what is
              estimated to remain.
            </p>
          </div>
          <DatePicker
            allowClear={false}
            value={selectedDate}
            onChange={(value) => {
              if (!value) return;
              setSelectedDate(value);
            }}
            disabledDate={(current) => current && current.isAfter(dayjs(), 'day')}
          />
        </div>

        {cashFlowError ? (
          <p className="text-sm text-red-600">{cashFlowError}</p>
        ) : (
          <Spin spinning={cashFlowLoading}>
            <div className="grid gap-3 md:grid-cols-3">
              <Kpi
                label={`${dayLabel}'s Sales`}
                value={money(yesterday.sales?.amount)}
                hint={yesterday.sales?.label ? `${yesterday.sales.label} sales` : 'Sales'}
                valueClass="text-gray-900"
              />
              <Kpi
                label="Total to Set Aside"
                value={money(yesterday.set_aside)}
                hint="Labor + food + rent + operating expenses"
                valueClass="text-[#c2410c]"
                bar={
                  <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-gray-100">
                    {stacked.map((item) => (
                      <div
                        key={item.key}
                        className={item.accent}
                        style={{ width: `${item.pct}%` }}
                        title={`${item.title} ${money(item.amount)}`}
                      />
                    ))}
                  </div>
                }
              />
              <Kpi
                label={dayPocketLabel}
                value={money(yesterday.cash_left)}
                hint={cashStatus === 'short' ? 'Short' : cashStatus === 'over' ? 'Over' : ''}
                valueClass={statusClass(cashStatus)}
                badge={<SourceBadge source={cashLeftSource} />}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {ENVELOPES.map((item) => {
                const row = envelopes[item.key] || {};
                const Icon = item.icon;
                return (
                  <div key={item.key} className={`rounded-2xl border p-4 ${item.tint}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${item.iconWrap}`}
                        >
                          <Icon className="text-sm" />
                        </span>
                        <p className="font-medium text-gray-800">{item.title}</p>
                      </div>
                      {row.label || row.source ? (
                        <SourceBadge source={row.source} label={row.label} />
                      ) : null}
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{money(row.amount)}</p>
                    <p className="mt-1 text-xs text-gray-500">Add to envelope</p>
                  </div>
                );
              })}
            </div>
          </Spin>
        )}
      </div>

      <Card
        className="shadow-sm border border-emerald-100"
        title={
          <div className="flex flex-col gap-2 py-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <FaWallet />
              </span>
              <div>
                <p className="text-base font-semibold text-gray-900">
                  Your Envelopes – Week to Date
                </p>
                <p className="text-sm font-normal text-gray-600 max-w-3xl">
                  Set it aside as you earn it. Each day, Growlio calculates how much of your sales
                  should be reserved for labor, food, rent, and operating expenses — so when bills
                  are due, the money is already accounted for.
                </p>
              </div>
            </div>
            <WhyEnvelopesButton />
          </div>
        }
      >
        <Spin spinning={cashFlowLoading}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {ENVELOPES.map((item) => {
              const row = wtdEnvelopes[item.key] || {};
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${item.iconWrap}`}
                    >
                      <Icon className="text-sm" />
                    </span>
                    <p className="font-medium text-gray-800">{item.title} Envelope</p>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-gray-900">{money(row.amount)}</p>
                  <EnvelopeProgress percent={row.percent_of_target} barClass={item.bar} />
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-gray-500">
                    <span>Target: {money(row.target)}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{row.source_note || '—'}</p>
                </div>
              );
            })}

            <div
              className={`rounded-2xl border p-4 shadow-sm ${
                pocketAmount < 0
                  ? 'border-red-100 bg-red-50'
                  : 'border-emerald-100 bg-emerald-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                    pocketAmount < 0
                      ? 'bg-red-100 text-red-600'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <FaWallet />
                </span>
                <p className="font-medium text-gray-800">{pocketTitle}</p>
              </div>
              <p
                className={`mt-3 text-2xl font-semibold ${
                  pocketAmount < 0 ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {money(pocketAmount)}
              </p>
              <EnvelopeProgress
                percent={pocketWtd.percent_of_target}
                barClass={pocketAmount < 0 ? 'bg-red-500' : 'bg-emerald-500'}
              />
              <div className="mt-3 text-xs text-gray-500">
                Target: {money(pocketWtd.target)}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {pocketWtd.source_note ||
                  'Target based on your profit goal (after all set asides).'}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <p className="mb-2 text-sm font-medium text-gray-700">This week by day</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {(wtd.days || []).map((day) => {
                  const isFuture = day.status === 'upcoming';
                  const isClosed = day.status === 'closed';
                  const muted = isFuture || isClosed;
                  const label =
                    day.status === 'short'
                      ? 'Short'
                      : day.status === 'over'
                        ? 'Over'
                        : isClosed
                          ? 'Closed'
                          : '—';
                  return (
                    <button
                      key={day.date}
                      type="button"
                      className={`rounded-xl border p-2 text-left ${
                        day.date === yesterday.date
                          ? 'border-[#FF8132] bg-orange-50'
                          : 'border-gray-100 bg-gray-50'
                      }`}
                      onClick={() => setSelectedDate(dayjs(day.date))}
                      disabled={isFuture}
                    >
                      <p className="text-xs text-gray-500">{dayjs(day.date).format('ddd D')}</p>
                      <p
                        className={`text-sm font-semibold ${
                          muted ? 'text-gray-400' : statusClass(day.status)
                        }`}
                      >
                        {muted ? label : `${label} ${money(day.cash_left)}`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 xl:col-span-2 ${
                lio.tone === 'warning'
                  ? 'border-red-100 bg-red-50'
                  : 'border-emerald-100 bg-emerald-50'
              }`}
            >
              <p className="mb-2 text-sm font-semibold text-gray-800">
                LIO · Your Cash Flow Banker
              </p>
              <div className="flex items-start gap-3">
                <img
                  src={lioMascot}
                  alt="LIO"
                  className="h-16 w-auto shrink-0 object-contain"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {lio.headline || 'Checking yesterday’s cash…'}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {lio.message ||
                      'Add Close Out or budget numbers so LIO can explain the day.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Spin>
      </Card>
    </div>
  );
};

export default CashFlowModule;
