import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Card, DatePicker, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import useStore from '../../../../store/store';
import lioMascot from '../../../../assets/pngs/lio-mascot.png';

const money = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  const abs = Math.abs(num).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return num < 0 ? `-$${abs}` : `$${abs}`;
};

const cashLeftMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return money(Math.max(0, num));
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
  { key: 'labor', title: 'Labor', accent: 'bg-sky-500', tint: 'bg-sky-50 border-sky-100' },
  { key: 'cogs', title: 'COGS / Food', accent: 'bg-orange-500', tint: 'bg-orange-50 border-orange-100' },
  { key: 'rent', title: 'Rent', accent: 'bg-violet-500', tint: 'bg-violet-50 border-violet-100' },
  {
    key: 'operating_expenses',
    title: 'Operating Expenses',
    accent: 'bg-teal-500',
    tint: 'bg-teal-50 border-teal-100',
  },
];

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

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Cash Flow
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              {dayLabel}: sales, set aside, cash left
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
                label={cashLeftSource === 'estimate' ? 'Estimated Cash Left' : 'Cash Left'}
                value={cashLeftMoney(yesterday.cash_left)}
                hint={cashStatus === 'short' ? 'Short' : cashStatus === 'over' ? 'Over' : ''}
                valueClass={statusClass(cashStatus)}
                badge={
                  <Tag color={sourceColor(cashLeftSource)}>
                    {SOURCE_LABELS[cashLeftSource]}
                  </Tag>
                }
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {ENVELOPES.map((item) => {
                const row = envelopes[item.key] || {};
                return (
                  <div key={item.key} className={`rounded-2xl border p-4 ${item.tint}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-gray-800">{item.title}</p>
                      {row.label ? <Tag color={sourceColor(row.source)}>{row.label}</Tag> : null}
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{money(row.amount)}</p>
                  </div>
                );
              })}
            </div>
          </Spin>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="shadow-sm border border-gray-100 xl:col-span-3" title="Week to Date">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">WTD Sales</p>
              <p className="text-xl font-semibold">{money(wtd.sales)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">WTD Set Aside</p>
              <p className="text-xl font-semibold text-[#c2410c]">{money(wtd.set_aside)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">WTD Cash Left</p>
              <p className={`text-xl font-semibold ${statusClass(wtd.status)}`}>
                {money(wtd.cash_left)}
              </p>
            </div>
          </div>
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
                  <p className={`text-sm font-semibold ${muted ? 'text-gray-400' : statusClass(day.status)}`}>
                    {muted ? label : `${label} ${money(day.cash_left)}`}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        <Card
          className={`shadow-sm border xl:col-span-2 ${
            lio.tone === 'warning' ? 'border-red-100 bg-red-50' : 'border-emerald-100 bg-emerald-50'
          }`}
          title="LIO · Your Cash Flow Banker"
        >
          <div className="flex items-start gap-3">
            <img src={lioMascot} alt="LIO" className="h-16 w-auto shrink-0 object-contain" />
            <div>
              <p className="font-medium text-gray-900">{lio.headline || 'Checking yesterday’s cash…'}</p>
              <p className="mt-1 text-sm text-gray-700">
                {lio.message || 'Add Close Out or budget numbers so LIO can explain the day.'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CashFlowModule;
