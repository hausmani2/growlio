import React, { useMemo, useState } from 'react';
import { Button, Select, Table, message } from 'antd';
import { DownloadOutlined, FileSearchOutlined } from '@ant-design/icons';
import useStore from '../../store/store';
import { formatNumber } from '../../utils/formatUtils';

const { Option } = Select;

const REPORT_TYPES = [
  { value: 'yearly_by_month', label: 'Yearly by month' },
  { value: 'yearly_by_year', label: 'Yearly by year' },
];

const compactMoney = (value, { signed = true, floorZero = false } = {}) => {
  let num = Number(value);
  if (!Number.isFinite(num)) return '—';
  if (floorZero) num = Math.max(0, num);
  const abs = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  if (!signed) return `$${abs}`;
  if (num < 0) return `-$${abs}`;
  if (num > 0) return `$${abs}`;
  return `$${abs}`;
};

const moneyClass = (value, { floorZero = false } = {}) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'text-gray-500';
  if (floorZero) return 'text-gray-900';
  if (num < 0) return 'text-red-600';
  if (num > 0) return 'text-emerald-600';
  return 'text-gray-900';
};

const shortPeriodLabel = (period, reportType) => {
  const label = period?.label || period?.key || '';
  if (reportType === 'yearly_by_month') {
    return String(label).split(' ')[0];
  }
  return label;
};

const SimulatorAnnualReport = ({ restaurantId, defaultYear }) => {
  const currentYear = defaultYear || new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i),
    []
  );
  const [reportType, setReportType] = useState('yearly_by_month');
  const [year, setYear] = useState(currentYear);
  const [startYear, setStartYear] = useState(currentYear);
  const [endYear, setEndYear] = useState(currentYear + 4);
  const {
    simulationReportData,
    simulationReportLoading,
    getSimulationReport,
    downloadSimulationReportExcel,
  } = useStore();

  const maxEndYear = startYear + 4;
  const allowedEndYears = years.filter((value) => value >= startYear && value <= maxEndYear);

  const reportParams = () => ({
    restaurantId,
    reportType,
    year,
    startYear,
    endYear,
  });

  const handleRun = async () => {
    if (!restaurantId) {
      message.error('Complete onboarding first so a restaurant is available.');
      return;
    }
    if (reportType === 'yearly_by_year' && endYear - startYear + 1 > 5) {
      message.error('Year-by-year reports can cover at most 5 years.');
      return;
    }
    const result = await getSimulationReport(reportParams());
    if (!result.success) {
      message.error(result.error || 'Failed to run report.');
    }
  };

  const handleExport = async () => {
    if (!restaurantId) {
      message.error('Complete onboarding first so a restaurant is available.');
      return;
    }
    const result = await downloadSimulationReportExcel(reportParams());
    if (result.success) {
      message.success('Excel download started.');
    } else {
      message.error(result.error || 'Failed to export Excel.');
    }
  };

  const periods = simulationReportData?.periods || [];
  const totals = simulationReportData?.totals;
  const activeReportType = simulationReportData?.report_type || reportType;
  const projectedCount = periods.filter((period) => period.source === 'projected').length;
  const mixedCount = periods.filter((period) => period.source === 'mixed').length;

  const cash = (period, path) => {
    let node = period?.cashflow || {};
    for (const key of path) {
      node = node?.[key];
    }
    return typeof node === 'object' && node !== null ? node.amount : node;
  };

  const summary = useMemo(() => {
    if (!totals) return null;
    return {
      sales: totals.total_income,
      customers: totals.no_of_customer,
      setAside: cash(totals, ['set_aside']),
      cashLeft: cash(totals, ['cash_left']),
      profit: totals.profit_or_loss,
    };
  }, [totals]);

  const columns = useMemo(() => {
    const renderCell = (value, record) => {
      if (record.kind === 'section') return null;
      if (record.kind === 'count') {
        return <span className="tabular-nums text-gray-800">{formatNumber(value)}</span>;
      }
      return (
        <span className={`tabular-nums font-medium ${moneyClass(value, { floorZero: record.floorZero })}`}>
          {compactMoney(value ?? 0, { floorZero: record.floorZero })}
        </span>
      );
    };

    const periodCols = periods.map((period) => ({
      title: (
        <div className="text-center leading-tight">
          <div className="font-semibold text-gray-800">{shortPeriodLabel(period, activeReportType)}</div>
          {period.source === 'projected' ? (
            <span className="mt-0.5 inline-block h-1 w-1 rounded-full bg-amber-400" title="Projected" />
          ) : period.source === 'mixed' ? (
            <span className="mt-0.5 inline-block h-1 w-1 rounded-full bg-sky-400" title="Mixed" />
          ) : (
            <span className="mt-0.5 inline-block h-1 w-1 rounded-full bg-emerald-400" title="Saved" />
          )}
        </div>
      ),
      dataIndex: period.key,
      key: period.key,
      align: 'right',
      width: 92,
      render: renderCell,
    }));

    return [
      {
        title: <span className="text-gray-500 font-medium">Line item</span>,
        dataIndex: 'label',
        key: 'label',
        fixed: 'left',
        width: 168,
        render: (label, record) =>
          record.kind === 'section' ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              {label}
            </span>
          ) : (
            <span className={`text-sm ${record.emphasize ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
              {label}
            </span>
          ),
      },
      ...periodCols,
      {
        title: <span className="font-semibold text-gray-900">Total</span>,
        dataIndex: 'total',
        key: 'total',
        align: 'right',
        fixed: 'right',
        width: 108,
        render: renderCell,
      },
    ];
  }, [periods, activeReportType]);

  const tableData = useMemo(() => {
    if (!periods.length) return [];
    const row = (key, label, getter, extra = {}) => {
      const entry = { key, label, kind: extra.kind || 'money', ...extra };
      periods.forEach((period) => {
        entry[period.key] = getter(period);
      });
      entry.total = totals ? getter(totals) : 0;
      return entry;
    };
    return [
      { key: 'income-section', label: 'Income', kind: 'section' },
      row('sales', 'Sales', (p) => p.total_income, { emphasize: true }),
      row('customers', 'Customers', (p) => p.no_of_customer, { kind: 'count' }),
      row('ticket', 'Avg ticket', (p) => p.average_ticket_per_customer),
      { key: 'cost-section', label: 'Set aside', kind: 'section' },
      row('labor', 'Labor', (p) => cash(p, ['envelopes', 'labor'])),
      row('cogs', 'COGS / Food', (p) => cash(p, ['envelopes', 'cogs'])),
      row('rent', 'Rent', (p) => cash(p, ['envelopes', 'rent'])),
      row('opex', 'Operating expenses', (p) => cash(p, ['envelopes', 'operating_expenses'])),
      row('set_aside', 'Total set aside', (p) => cash(p, ['set_aside']), { emphasize: true }),
      { key: 'result-section', label: 'Result', kind: 'section' },
      row('cash_left', 'Cash left', (p) => cash(p, ['cash_left']), { floorZero: true, emphasize: true }),
      row(
        'profit',
        Number(totals?.profit_or_loss) < 0 ? 'Out of pocket' : 'In your pocket',
        (p) => p.profit_or_loss,
        { emphasize: true }
      ),
    ];
  }, [periods, totals]);

  const rangeLabel =
    activeReportType === 'yearly_by_year'
      ? `${simulationReportData?.start_year}–${simulationReportData?.end_year}`
      : String(simulationReportData?.year || year);

  return (
    <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-emerald-50 p-5 shadow-sm mb-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
            Annual Report
          </p>
          <h2 className="text-2xl font-bold text-gray-900">Yearly forecast</h2>
          <p className="text-sm text-gray-600">
            View 12 months or up to 5 years, then export the same numbers to Excel.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <Select
              value={reportType}
              onChange={setReportType}
              size="middle"
              style={{ minWidth: 168 }}
            >
              {REPORT_TYPES.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </div>
          {reportType === 'yearly_by_month' ? (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
              <Select value={year} onChange={setYear} size="middle" style={{ minWidth: 110 }}>
                {years.map((value) => (
                  <Option key={value} value={value}>
                    {value}
                  </Option>
                ))}
              </Select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
                <Select
                  value={startYear}
                  onChange={(value) => {
                    setStartYear(value);
                    if (endYear < value) setEndYear(value);
                    if (endYear > value + 4) setEndYear(value + 4);
                  }}
                  size="middle"
                  style={{ minWidth: 110 }}
                >
                  {years.map((value) => (
                    <Option key={value} value={value}>
                      {value}
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
                <Select
                  value={endYear}
                  onChange={setEndYear}
                  size="middle"
                  style={{ minWidth: 110 }}
                >
                  {allowedEndYears.map((value) => (
                    <Option key={value} value={value}>
                      {value}
                    </Option>
                  ))}
                </Select>
              </div>
            </>
          )}
          <Button
            type="primary"
            icon={<FileSearchOutlined />}
            onClick={handleRun}
            loading={simulationReportLoading}
            className="bg-orange-500 hover:bg-orange-600 border-orange-500"
          >
            Run on screen
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Excel
          </Button>
        </div>
      </div>

      {periods.length > 0 ? (
        <>
          {summary ? (
            <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
              <div className="rounded-2xl border border-white/80 bg-white p-3 shadow-sm">
                <p className="text-xs text-gray-500">{rangeLabel} sales</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {compactMoney(summary.sales)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white p-3 shadow-sm">
                <p className="text-xs text-gray-500">Customers</p>
                <p className="mt-1 text-xl font-semibold text-blue-600">
                  {formatNumber(summary.customers)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white p-3 shadow-sm">
                <p className="text-xs text-gray-500">Set aside</p>
                <p className="mt-1 text-xl font-semibold text-[#c2410c]">
                  {compactMoney(summary.setAside)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white p-3 shadow-sm">
                <p className="text-xs text-gray-500">Cash left</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {compactMoney(summary.cashLeft, { floorZero: true })}
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white p-3 shadow-sm col-span-2 xl:col-span-1">
                <p className="text-xs text-gray-500">
                  {Number(summary.profit) < 0 ? 'Out of pocket' : 'In your pocket'}
                </p>
                <p className={`mt-1 text-xl font-semibold ${moneyClass(summary.profit)}`}>
                  {compactMoney(summary.profit)}
                </p>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <Table
              dataSource={tableData}
              columns={columns}
              pagination={false}
              scroll={{ x: 168 + periods.length * 92 + 108 }}
              size="small"
              rowClassName={(record) => {
                if (record.kind === 'section') return 'bg-gray-50/80';
                if (record.key === 'profit') return 'bg-red-50/40';
                if (record.key === 'cash_left' || record.key === 'set_aside' || record.key === 'sales') {
                  return 'bg-orange-50/30';
                }
                return '';
              }}
              className="simulator-annual-report-table"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Saved forecast
            </span>
            {mixedCount > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" /> Mixed
              </span>
            ) : null}
            {projectedCount > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Projected from latest forecast
              </span>
            ) : null}
            <span>Cash left never goes below $0. In your pocket / Out of pocket can be negative.</span>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-white/70 px-4 py-8 text-center text-sm text-gray-500">
          Generate a forecast, then run a report to see the year on this screen.
        </div>
      )}
    </div>
  );
};

export default SimulatorAnnualReport;
