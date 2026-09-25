import React, { useMemo } from 'react';
import { Tag } from 'antd';

const money = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  const abs = Math.abs(num).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return num < 0 ? `-$${abs}` : `$${abs}`;
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

const PERIOD_LABELS = {
  daily: 'This day',
  weekly: 'This week',
  monthly: 'This month',
  annually: 'This year',
};

const count = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return Math.round(num).toLocaleString();
};

const cashLeftMoney = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return money(Math.max(0, num));
};

const SimulatorCashFlow = ({ cashflow, period = 'daily', customerCount, profitOrLoss }) => {
  const envelopes = cashflow?.envelopes || {};
  const setAside = Number(cashflow?.set_aside) || 0;
  const periodLabel = PERIOD_LABELS[period] || 'This period';
  const profitLossValue =
    profitOrLoss ?? cashflow?.cash_left;
  const profitLossLabel =
    Number(profitLossValue) < 0 ? 'Out of pocket' : 'In your pocket';

  const stacked = useMemo(() => {
    return ENVELOPES.map((item) => {
      const amount = Number(envelopes[item.key]?.amount) || 0;
      const pct = setAside > 0 ? Math.max(0, (amount / setAside) * 100) : 0;
      return { ...item, amount, pct };
    });
  }, [envelopes, setAside]);

  if (!cashflow) return null;

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-5 shadow-sm mb-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Cash Flow
        </p>
        <h2 className="text-2xl font-bold text-gray-900">
          {periodLabel}: sales, set aside, cash left
        </h2>
        <p className="text-sm text-gray-600">
          This uses your simulated forecast — not yesterday’s actuals. Growlio is not moving money.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">{periodLabel} sales</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {money(cashflow.sales)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Simulated</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total customers</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-blue-600">
            {count(customerCount)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{periodLabel}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total to set aside</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-[#c2410c]">
            {money(cashflow.set_aside)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Labor + food + rent + operating expenses</p>
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
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-gray-500">Cash left</p>
            <Tag color={cashflow.status === 'short' ? 'red' : 'green'}>
              {cashflow.status === 'short' ? 'Short' : 'Over'}
            </Tag>
          </div>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {cashLeftMoney(cashflow.cash_left)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {cashflow.status === 'short'
              ? 'No cash remaining after set-aside'
              : 'After setting money aside from simulated sales'}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">{profitLossLabel}</p>
          <p
            className={`mt-1 text-3xl font-semibold tracking-tight ${
              Number(profitLossValue) < 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {money(profitLossValue)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {Number(profitLossValue) < 0
              ? 'Out of pocket after simulated costs'
              : 'In your pocket after simulated costs'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ENVELOPES.map((item) => {
          const row = envelopes[item.key] || {};
          return (
            <div key={item.key} className={`rounded-2xl border p-4 ${item.tint}`}>
              <p className="font-medium text-gray-800">{item.title}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{money(row.amount)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimulatorCashFlow;
