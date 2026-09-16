import React, { useMemo, useState } from 'react';
import { Button, Card, DatePicker, Progress, Segmented, Spin, Table, Tag, Tooltip } from 'antd';
import {
  CameraOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import lioMascot from '../../../assets/pngs/lio-mascot.png';

const money = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const moneyExact = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return `$${num.toFixed(2)}`;
};

const pct = (value, digits = 1) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return `${num.toFixed(digits)}%`;
};

const pts = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(1)} pts`;
};

const profitabilityTag = (status) => {
  if (status === 'Good') return <Tag color="green">Good</Tag>;
  if (status === 'Watch') return <Tag color="orange">Watch</Tag>;
  if (status === 'Poor') return <Tag color="red">Poor</Tag>;
  return <Tag>Unknown</Tag>;
};

const priorityTag = (priority) => {
  if (priority === 'high') return <Tag color="red">High Priority</Tag>;
  if (priority === 'medium') return <Tag color="orange">Medium Priority</Tag>;
  return <Tag>Low Priority</Tag>;
};

const Donut = ({ percent, label }) => {
  const value = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative h-24 w-24 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(#16a34a 0 ${value}%, #e5e7eb ${value}% 100%)`,
        }}
      >
        <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white text-center">
          <span className="text-lg font-semibold text-gray-900">{Math.round(value)}%</span>
        </div>
      </div>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
};

const KpiCard = ({ title, value, hint, valueClassName, footer }) => (
  <Card className="h-full shadow-sm border border-gray-100">
    <p className="mb-1 text-sm text-gray-500">{title}</p>
    <p className={`text-2xl font-semibold ${valueClassName || 'text-gray-900'}`}>{value}</p>
    {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    {footer}
  </Card>
);

const trendTag = (trend) => {
  const direction = trend?.direction;
  const label = trend?.label || '—';
  if (direction === 'up') return <span className="font-medium text-emerald-600">↑ {label}</span>;
  if (direction === 'down') return <span className="font-medium text-red-600">↓ {label}</span>;
  if (direction === 'new') return <span className="text-gray-500">New</span>;
  return <span className="text-gray-500">{label}</span>;
};

const DriverListCard = ({ title, subtitle, sharePct, shareLabel, items, extra }) => (
  <Card
    className="shadow-sm border border-gray-100 h-full"
    title={title}
    extra={extra}
  >
    <p className="mb-4 text-sm text-gray-500">{subtitle}</p>
    <div className="mb-4">
      <Donut percent={sharePct} label={shareLabel} />
    </div>
    <Table
      size="small"
      rowKey="menu_item_id"
      pagination={false}
      dataSource={items || []}
      columns={[
        { title: 'Item', dataIndex: 'name', key: 'name' },
        {
          title: '% of Sales',
          dataIndex: 'sales_share_percent',
          key: 's',
          render: (v) => pct(v),
        },
        {
          title: 'Food Cost %',
          dataIndex: 'food_cost_percent',
          key: 'fc',
          render: (v) => (
            <span className={Number(v) >= 35 ? 'text-red-600' : ''}>{pct(v)}</span>
          ),
        },
        { title: 'Margin $', dataIndex: 'contribution', key: 'm', render: (v) => moneyExact(v) },
        {
          title: 'Total Contribution',
          dataIndex: 'period_profit',
          key: 'p',
          render: (v) => moneyExact(v),
        },
      ]}
    />
  </Card>
);

const MenuIntelligenceEmptyState = ({ empty, posConnected, onAction }) => {
  const type = empty?.type;
  return (
    <div className="space-y-6">
      <Card className="shadow-sm border border-gray-100">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <img src={lioMascot} alt="LIO" className="mx-auto h-40 w-auto object-contain lg:mx-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold text-gray-900">
              {empty?.title || "Let's Build Your Menu Intelligence"}
            </h2>
            <p className="mt-2 text-gray-600">{empty?.message}</p>
            <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Once we have more information, you&apos;ll see true food costs, menu margins,
              biggest profit opportunities, and which items have the greatest impact on your business.
            </div>
          </div>
          <div className="w-full max-w-xs rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="mb-2 font-medium text-gray-800">What you&apos;ll get</p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>Sales-weighted food cost vs actual</li>
              <li>Menu margins and contribution</li>
              <li>Items that drive your business</li>
              <li>LIO opportunities with dollar impact</li>
              <li>Accuracy and confidence insights</li>
            </ul>
            {posConnected ? (
              <p className="mt-3 text-sm font-medium text-emerald-700">POS connected · Square</p>
            ) : null}
          </div>
        </div>
      </Card>

      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">How would you like to get started?</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Button
            type="primary"
            size="large"
            icon={<CameraOutlined />}
            className="!h-auto !whitespace-normal !bg-[#FF8132] !py-3"
            onClick={() => onAction('build_from_photo')}
          >
            {empty?.primary_label || 'Build from Menu or Photo with LIO'}
          </Button>
          <Button size="large" className="!h-auto !whitespace-normal !py-3" onClick={() => onAction('import_pos')}>
            Import Menu from POS
          </Button>
          <Button
            size="large"
            icon={<PlusOutlined />}
            className="!h-auto !whitespace-normal !py-3"
            onClick={() => onAction('add_menu_item')}
          >
            Add a Menu Item Manually
          </Button>
          <Button
            size="large"
            icon={<UploadOutlined />}
            className="!h-auto !whitespace-normal !py-3"
            onClick={() => onAction('upload_invoice')}
          >
            Upload an Invoice
          </Button>
        </div>
      </div>

      {type === 'pos_uncosted' || type === 'missing_costs' || type === 'partial' ? (
        <div className="flex flex-wrap gap-3">
          <Button type="primary" className="!bg-[#16a34a] border-none" onClick={() => onAction(empty.primary_action)}>
            {empty.primary_label}
          </Button>
          {empty.secondary_action ? (
            <Button onClick={() => onAction(empty.secondary_action)}>{empty.secondary_label}</Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const MenuIntelligenceDashboard = ({
  loading,
  dashboard,
  dateFrom,
  dateTo,
  onDateChange,
  onRefresh,
  onAction,
}) => {
  const navigate = useNavigate();
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const intel = dashboard?.intelligence;
  const empty = intel?.empty_state;
  const showEmptyOnly = Boolean(empty && empty.type !== 'partial');

  const kpi = intel?.kpis || {};
  const salesDrivers = intel?.sales_drivers || {};
  const profitDrivers = intel?.profit_drivers || {};
  const opportunities = intel?.opportunities || [];
  const accuracyActions = intel?.accuracy_actions || [];
  const performance = intel?.performance || [];

  const filteredPerformance = useMemo(() => {
    if (performanceFilter === 'opportunity') {
      return performance.filter((row) => row.is_biggest_opportunity);
    }
    if (performanceFilter === 'review') {
      return performance.filter((row) => row.needs_review);
    }
    return performance;
  }, [performance, performanceFilter]);

  const performanceColumns = useMemo(
    () => [
      {
        title: 'Menu Item',
        dataIndex: 'name',
        key: 'name',
        fixed: 'left',
        width: 180,
        render: (name, record) => (
          <button
            type="button"
            className="bg-transparent p-0 text-left font-medium text-[#FF8132] hover:underline"
            onClick={() => onAction('edit_menu_item', record)}
          >
            {name}
          </button>
        ),
      },
      {
        title: 'Sales $',
        dataIndex: 'sales_dollars',
        key: 'sales',
        render: (v) => money(v),
        sorter: (a, b) => Number(a.sales_dollars || 0) - Number(b.sales_dollars || 0),
      },
      {
        title: '% of Sales',
        dataIndex: 'sales_share_percent',
        key: 'share',
        render: (v) => pct(v),
        sorter: (a, b) => Number(a.sales_share_percent || 0) - Number(b.sales_share_percent || 0),
      },
      {
        title: 'Theo. FC%',
        dataIndex: 'theoretical_fc_pct',
        key: 'theo',
        render: (v) => (
          <span className={Number(v) >= 35 ? 'font-medium text-red-600' : ''}>{pct(v)}</span>
        ),
      },
      {
        title: (
          <Tooltip title="Location Close Out actual — not tracked per item">
            <span>Actual FC%</span>
          </Tooltip>
        ),
        dataIndex: 'actual_fc_pct',
        key: 'actual',
        render: (v) => pct(v),
      },
      {
        title: (
          <Tooltip title="Item theoretical FC% minus location actual FC%">
            <span>Variance</span>
          </Tooltip>
        ),
        dataIndex: 'variance_pts',
        key: 'var',
        render: (v) => {
          const num = Number(v);
          if (!Number.isFinite(num)) return '—';
          return (
            <span className={num > 0 ? 'text-red-600' : 'text-emerald-600'}>{pts(v)}</span>
          );
        },
      },
      {
        title: 'Margin %',
        dataIndex: 'margin_pct',
        key: 'marginPct',
        render: (v) => pct(v),
      },
      {
        title: 'Margin $',
        dataIndex: 'contribution',
        key: 'margin',
        render: (v) => moneyExact(v),
      },
      {
        title: 'Total Contribution',
        dataIndex: 'period_profit',
        key: 'contrib',
        render: (v) => moneyExact(v),
      },
      {
        title: 'Trend',
        dataIndex: 'trend',
        key: 'trend',
        render: trendTag,
      },
      {
        title: 'Profitability',
        dataIndex: 'profitability',
        key: 'profit',
        render: profitabilityTag,
      },
      {
        title: 'Confidence',
        dataIndex: 'confidence',
        key: 'conf',
        render: (v) => (
          <span className={Number(v) < 71 ? 'font-medium text-red-600' : 'text-gray-700'}>
            {pct(v, 0)}
          </span>
        ),
      },
    ],
    [onAction]
  );

  if (!intel) {
    return (
      <Spin spinning={loading}>
        <Card className="shadow-sm border border-gray-100">
          <p className="text-gray-600">
            {loading
              ? 'Building Menu Intelligence…'
              : 'Menu Intelligence could not be calculated yet. Refresh, or add recipes and costs in Menu Items.'}
          </p>
        </Card>
      </Spin>
    );
  }

  if (showEmptyOnly) {
    return (
      <Spin spinning={loading}>
        <MenuIntelligenceEmptyState
          empty={empty}
          posConnected={intel?.pos_connected}
          onAction={onAction}
        />
      </Spin>
    );
  }

  const varianceClass =
    Number(kpi.food_cost_variance_pts) > 0 ? 'text-red-600' : 'text-emerald-600';

  return (
    <Spin spinning={loading}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            {intel?.date_from && intel?.date_to
              ? `Showing ${dayjs(intel.date_from).format('MMM D')} – ${dayjs(intel.date_to).format('MMM D, YYYY')}`
              : 'Last 28 days'}
            {intel?.sales_source === 'square' ? ' · POS sales mix' : ' · Estimated sales mix'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <DatePicker.RangePicker
              allowClear={false}
              value={
                dateFrom && dateTo ? [dayjs(dateFrom), dayjs(dateTo)] : intel?.date_from
                  ? [dayjs(intel.date_from), dayjs(intel.date_to)]
                  : null
              }
              onChange={(range) => {
                if (!range?.[0] || !range?.[1]) return;
                onDateChange?.(range[0].format('YYYY-MM-DD'), range[1].format('YYYY-MM-DD'));
              }}
            />
            <Button icon={<ReloadOutlined />} onClick={onRefresh}>
              Refresh
            </Button>
          </div>
        </div>

        {empty?.type === 'partial' ? (
          <Card className="border border-emerald-100 bg-emerald-50 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-gray-900">{empty.title}</p>
                <p className="text-sm text-gray-600">{empty.message}</p>
              </div>
              <div className="flex items-center gap-4">
                <Progress
                  type="circle"
                  percent={Math.round(Number(kpi.sales_costed_pct) || 0)}
                  size={72}
                  strokeColor="#16a34a"
                />
                <Button type="primary" className="!bg-[#16a34a] border-none" onClick={() => onAction(empty.primary_action)}>
                  {empty.primary_label}
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <KpiCard
            title="Sales-Weighted Food Cost"
            value={pct(kpi.sales_weighted_food_cost_pct)}
            hint="Theoretical, based on what you sold"
            valueClassName="text-emerald-600"
          />
          <KpiCard
            title="Actual Food Cost"
            value={pct(kpi.actual_food_cost_pct)}
            hint="From invoices / Close Out COGS"
            valueClassName="text-[#FF8132]"
          />
          <KpiCard
            title="Food Cost Variance"
            value={pts(kpi.food_cost_variance_pts)}
            hint={
              kpi.food_cost_variance_dollars != null
                ? `${money(Math.abs(kpi.food_cost_variance_dollars))} vs theoretical`
                : 'Same period comparison'
            }
            valueClassName={varianceClass}
          />
          <KpiCard
            title="Average Menu Margin"
            value={pct(kpi.average_menu_margin_pct)}
            hint="Contribution on items sold"
          />
          <KpiCard
            title="Menu Opportunity"
            value={money(kpi.menu_opportunity_annual)}
            hint="Estimated annual opportunity"
            valueClassName="text-sky-700"
          />
          <KpiCard
            title="Menu Accuracy"
            value={pct(kpi.menu_accuracy_pct, 0)}
            hint={`${kpi.items_needing_attention || 0} items need attention`}
            footer={
              <Progress
                percent={Math.round(Number(kpi.menu_accuracy_pct) || 0)}
                showInfo={false}
                strokeColor="#16a34a"
                className="mt-2"
              />
            }
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DriverListCard
            title={
              salesDrivers.item_count
                ? `Sales Drivers · ${salesDrivers.item_count} items`
                : 'Sales Drivers'
            }
            subtitle={`What guests buy. These items represent ${pct(salesDrivers.sales_share_pct, 0)} of sales.`}
            sharePct={salesDrivers.sales_share_pct}
            shareLabel={`${pct(salesDrivers.sales_share_pct, 0)} of sales from ${salesDrivers.item_count || 0} items`}
            items={salesDrivers.items}
            extra={
              <Button type="link" onClick={() => onAction('view_menu')}>
                View all menu items
              </Button>
            }
          />
          <DriverListCard
            title={
              profitDrivers.item_count
                ? `Profit Drivers · ${profitDrivers.item_count} items`
                : 'Profit Drivers'
            }
            subtitle={`What makes contribution $. These items represent ${pct(profitDrivers.contribution_share_pct, 0)} of contribution.`}
            sharePct={profitDrivers.contribution_share_pct}
            shareLabel={`${pct(profitDrivers.contribution_share_pct, 0)} of contribution from ${profitDrivers.item_count || 0} items`}
            items={profitDrivers.items}
          />
        </div>

        <Card
          className="shadow-sm border border-gray-100"
          title="LIO Menu Insights"
          extra={<span className="text-xs text-gray-400">Updated just now</span>}
        >
          <p className="mb-3 font-medium text-gray-900">
            LIO found {money(kpi.menu_opportunity_annual)} in annual menu opportunities.
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {opportunities.length ? (
              opportunities.map((opp, index) => (
                <button
                  key={`${opp.type}-${opp.menu_item_id || opp.ingredient_id || index}`}
                  type="button"
                  className="w-full rounded-xl border border-gray-100 p-3 text-left hover:border-[#FF8132]"
                  onClick={() =>
                    onAction(
                      opp.type === 'accuracy_before_action' ? 'edit_menu_item' : 'view_simulator',
                      opp
                    )
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {index + 1}. {opp.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">{opp.lio_note || opp.rationale}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-emerald-700">
                      {money(opp.estimated_annual_impact)}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                Cost more high-selling items to unlock LIO opportunities.
              </p>
            )}
          </div>
          <Button type="link" className="mt-2 px-0" onClick={() => onAction('view_simulator')}>
            See all opportunities
          </Button>
        </Card>

        <div className="grid gap-4 xl:grid-cols-5">
          <Card
            className="shadow-sm border border-gray-100 xl:col-span-2"
            title="Accuracy & Action Center"
            extra={
              <span className="text-sm text-gray-500">{accuracyActions.length} items</span>
            }
          >
            <p className="mb-3 text-sm text-gray-500">
              Improve the accuracy of your data to get the best Menu Intelligence. High-impact items
              come first — not only the lowest confidence scores.
            </p>
            <div className="space-y-2">
              {accuracyActions.length ? (
                accuracyActions.map((row) => (
                  <div
                    key={`${row.menu_item_id}-${row.message}`}
                    className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {row.name} recipe is {Math.round(row.confidence)}% confirmed
                      </p>
                      <p className="text-sm text-gray-600">{row.message}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {priorityTag(row.priority)}
                        <span className="text-xs text-gray-500">{row.impact_label}</span>
                      </div>
                    </div>
                    <Button
                      size="small"
                      onClick={() =>
                        onAction(row.action || 'edit_menu_item', {
                          menu_item_id: row.menu_item_id,
                          name: row.name,
                          ingredient_id: row.ingredient_id,
                          ingredient_name: row.ingredient_name,
                        })
                      }
                    >
                      Review
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No high-impact accuracy gaps right now.</p>
              )}
            </div>
          </Card>

          <Card
            className="shadow-sm border border-gray-100 xl:col-span-3"
            title="Menu Item Performance"
            extra={
              <Segmented
                size="small"
                value={performanceFilter}
                onChange={setPerformanceFilter}
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Biggest opportunity', value: 'opportunity' },
                  { label: 'Needs review', value: 'review' },
                ]}
              />
            }
          >
            <Table
              size="small"
              rowKey="menu_item_id"
              dataSource={filteredPerformance}
              columns={performanceColumns}
              scroll={{ x: 1280 }}
              pagination={{ pageSize: 8, showSizeChanger: false }}
            />
          </Card>
        </div>

        <Card className="border border-emerald-100 bg-emerald-50 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <CheckCircleOutlined className="text-lg text-emerald-700" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">LIO is here to help</p>
              <p className="text-sm text-gray-600">
                Ask LIO anything about your menu: costs, margins, pricing, portions, or opportunities.
              </p>
            </div>
            <Button type="primary" className="!bg-[#16a34a] border-none" onClick={() => navigate('/dashboard/chat')}>
              Ask LIO
            </Button>
          </div>
        </Card>
      </div>
    </Spin>
  );
};

export default MenuIntelligenceDashboard;
