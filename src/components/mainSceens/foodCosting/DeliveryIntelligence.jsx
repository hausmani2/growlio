import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Checkbox, Drawer, InputNumber, Select, Spin, Table, Tag, message } from 'antd';
import lioMascot from '../../../assets/pngs/lio-mascot.png';
import {
  fetchDeliveryIntelligence,
  implementDeliveryRecommendation,
  saveDeliveryAssumptions,
  simulateDeliveryOrder,
  trackDeliveryRecommendation,
} from '../../../services/foodCostingApi';

const money = (value) => (value == null || value === '' ? '—' : `$${value}`);

const GRADE_TONE = {
  A: { stroke: '#16a34a', tag: 'green', pill: 'bg-emerald-50 text-emerald-700' },
  B: { stroke: '#2563eb', tag: 'blue', pill: 'bg-blue-50 text-blue-700' },
  C: { stroke: '#f59e0b', tag: 'gold', pill: 'bg-amber-50 text-amber-800' },
  D: { stroke: '#f97316', tag: 'orange', pill: 'bg-orange-50 text-orange-700' },
  F: { stroke: '#dc2626', tag: 'red', pill: 'bg-red-50 text-red-700' },
};

const gradeTone = (letter) => GRADE_TONE[letter] || { stroke: '#9ca3af', tag: 'default', pill: 'bg-gray-100 text-gray-600' };

const gradeTag = (letter, title) => {
  if (!letter) return <Tag>Not rated</Tag>;
  return <Tag color={gradeTone(letter).tag}>{`${letter} · ${title || ''}`.trim()}</Tag>;
};

const DeliveryIntelligence = ({ onSetupMenu, onSetupDelivery }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);
  const [tracked, setTracked] = useState(null);
  const [setupKey, setSetupKey] = useState(null);
  const [draft, setDraft] = useState(null);
  const [projection, setProjection] = useState(null);

  const load = async (platforms) => {
    setLoading(true);
    try {
      const data = await fetchDeliveryIntelligence(platforms);
      setReport(data);
      setSelected(
        (data.platforms || []).filter((row) => row.included !== false).map((row) => row.key)
      );
      const first = data.platforms?.[0];
      if (first && !draft) {
        setSetupKey(first.key);
        setDraft(assumptionDraft(first));
      }
    } catch (error) {
      message.error(error?.response?.data?.error || 'Delivery Intelligence could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const togglePlatform = (key, checked) => {
    const next = checked
      ? [...selected, key]
      : selected.filter((item) => item !== key);
    setSelected(next);
    load(next);
  };

  const saveSetup = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await saveDeliveryAssumptions({
        platforms: [
          {
            platform_key: setupKey,
            is_selected: true,
            confirm_fees: true,
            confirm_labor: true,
            confirm_packaging: true,
            confirm_mix: true,
            fee_rule: {
              percentage_fees: [
                {
                  name: 'Commission',
                  rate: String(Number(draft.commission || 0) / 100),
                  base: draft.commissionBase,
                },
              ],
              fixed_fees: draft.fixedFee
                ? [{ name: 'Fixed fee', amount: String(draft.fixedFee) }]
                : [],
              processing_rate: String(Number(draft.processingRate || 0) / 100),
              processing_base: draft.processingBase,
              processing_base_amount: draft.processingBaseAmount,
              processing_fixed: draft.processingFixed || '0',
            },
            labor_model: draft.laborModel,
            labor_minutes: draft.laborMinutes,
            labor_wage: draft.laborWage,
            labor_allocated: draft.laborAllocated,
            packaging_in_cogs: draft.packagingInCogs,
            extra_packaging: draft.extraPackaging || '0',
            other_variable: draft.other || '0',
            target_margin_pct: draft.target,
            platform_sales: draft.platformSales,
            sales_source: 'user_entered',
            expected_monthly_orders: draft.expectedOrders,
            mix_source: draft.mixSource,
            items: (draft.items || []).filter((item) => item.selling_price != null).map((item) => ({
              menu_item_id: item.menu_item_id,
              selling_price: item.selling_price,
              order_count: item.order_count,
              confirm_price: true,
            })),
          },
        ],
      });
      message.success('Delivery assumptions saved.');
      await load(selected);
    } catch (error) {
      message.error(error?.response?.data?.error || 'Could not save delivery assumptions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !report) {
    return (
      <Card className="shadow-sm border border-gray-100">
        <div className="flex min-h-[240px] items-center justify-center">
          <Spin tip="Loading Delivery Intelligence…" />
        </div>
      </Card>
    );
  }

  if (report?.empty_state) {
    const needsDeliverySetup = report.empty_state.primary_action === 'setup_third_party';
    return (
      <Card className="shadow-sm border border-gray-100">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <img src={lioMascot} alt="LIO" className="mx-auto h-36 w-auto object-contain lg:mx-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-semibold text-gray-900">
              {needsDeliverySetup ? 'Choose your delivery platforms' : 'Delivery Intelligence needs menu costs'}
            </h2>
            <p className="mt-2 max-w-3xl text-gray-600">{report.empty_state.message}</p>
            <Button
              type="primary"
              size="large"
              className="mt-4 !bg-[#FF8132] border-none"
              onClick={needsDeliverySetup ? onSetupDelivery : onSetupMenu}
            >
              {report.empty_state.primary_label}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const summary = report?.summary || {};
  const platform = (report?.platforms || []).find((row) => row.key === setupKey) || report?.platforms?.[0];
  const recommendations = report?.recommendations || [];

  return (
    <Spin spinning={loading}>
      <div className="space-y-4">
        <Card className="shadow-sm border border-gray-100" title="Your Delivery Scorecard">
          <div className="grid items-center gap-6 xl:grid-cols-[200px_minmax(0,1fr)_280px]">
            <GradeGauge letter={summary.grade} title={summary.grade_title} />
            <div className="divide-y divide-gray-100">
              <Metric label="Total delivery sales" value={money(summary.delivery_sales)} hint="Estimated" />
              <Metric
                label="Delivery COGS %"
                value={summary.delivery_cogs_pct == null ? '—' : `${summary.delivery_cogs_pct}%`}
                hint="Costed sales only"
                valueClassName="text-[#FF8132]"
              />
              <Metric
                label="Profit per order"
                value={money(summary.profit_per_order)}
                hint={report?.profit_label}
              />
              <Metric
                label="Delivery mix of total sales"
                value={summary.delivery_mix_pct == null ? '—' : `${summary.delivery_mix_pct}%`}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Select platforms to compare</p>
              <div className="space-y-2">
                {(report?.platforms || []).map((row) => {
                  const checked = selected.includes(row.key);
                  return (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => togglePlatform(row.key, !checked)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                        checked ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-gray-900">{row.name}</span>
                        <span className="text-xs text-gray-500">
                          {money(row.delivery_sales)} sales
                          {row.delivery_cogs_pct == null ? '' : ` · COGS ${row.delivery_cogs_pct}%`}
                        </span>
                      </span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                          checked ? 'border-[#FF8132] bg-[#FF8132] text-white' : 'border-gray-300 bg-white text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mb-0 mt-2 text-xs text-gray-500">
                {report?.connection_label}. Unchecking a platform leaves it here and takes its numbers out of the scorecard.
              </p>
            </div>
          </div>
        </Card>

        <Alert
          type="info"
          showIcon
          message={`Restaurant sales: ${report?.restaurant_sales?.label || 'Sales unavailable'}${
            report?.restaurant_sales?.amount ? ` · ${money(report.restaurant_sales.amount)}` : ''
          }`}
          description={`Coverage ${summary.coverage_pct == null ? '—' : `${summary.coverage_pct}%`} of delivery sales.${
            report?.restaurant_sales?.verified ? '' : ' This is not verified POS data unless the label says Square.'
          }`}
        />
        {summary.partial ? (
          <Alert
            type="warning"
            showIcon
            message="Partial coverage"
            description="Profit uses only delivery sales with a complete recipe and a platform price. Missing costs are not spread across the rest."
          />
        ) : null}
        {!summary.loss_claim_allowed ? (
          <Alert
            type="warning"
            showIcon
            message="This is an estimate"
            description="Confidence is limited, so this does not say the restaurant is definitely losing money."
          />
        ) : null}

        <Card className="shadow-sm border border-gray-100" title="Platform Performance">
          <Table
            size="middle"
            rowKey="key"
            pagination={false}
            dataSource={report?.platforms || []}
            rowClassName={(row) => (row.included === false ? 'opacity-45' : '')}
            columns={[
              {
                title: 'Platform',
                dataIndex: 'name',
                render: (name, row) => (
                  <div>
                    <p className="m-0 font-medium text-gray-900">{name}</p>
                    <p className="m-0 text-xs text-gray-500">
                      {row.sales_source?.label}
                      {row.mix_label ? ` · ${row.mix_label}` : ''} · Not connected
                      {row.included === false ? ' · Left out of the scorecard' : ''}
                    </p>
                  </div>
                ),
              },
              { title: 'Sales', dataIndex: 'delivery_sales', render: (value) => money(value) },
              {
                title: 'COGS %',
                dataIndex: 'delivery_cogs_pct',
                render: (value) => (value == null ? '—' : `${value}%`),
              },
              { title: 'Profit per order', dataIndex: 'profit_per_order', render: (value) => money(value) },
              {
                title: 'Grade',
                dataIndex: 'grade',
                render: (value, row) => gradeTag(value, row.grade_title),
              },
            ]}
          />
        </Card>

        <Card
          className="shadow-sm border border-gray-100"
          title="LIO Recommendations"
          extra={<span className="text-sm text-gray-500">{recommendations.length} of 3</span>}
        >
          {recommendations.length === 0 ? (
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <img src={lioMascot} alt="LIO" className="h-16 w-auto object-contain" />
              <p className="m-0 text-sm text-gray-600">
                Recommendations appear after you confirm fees, labor, a target margin, and at least one platform price.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={`${rec.platform_key}-${rec.menu_item_id}`}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="m-0 font-medium text-gray-900">
                      {rec.menu_item_name} · {rec.platform_name}
                    </p>
                    <p className="mb-0 mt-1 text-sm text-gray-700">{rec.summary}</p>
                    <p className="mb-0 mt-1 text-sm text-gray-500">
                      Estimated {money(rec.per_order)} per order
                      {rec.monthly ? ` · ${rec.monthly} this month if expected orders hold` : ''}. Not a guaranteed result.
                    </p>
                  </div>
                  <Button
                    type="primary"
                    className="!bg-[#FF8132] border-none"
                    onClick={() => {
                      setDetail(rec);
                      setTracked(null);
                    }}
                  >
                    More Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="shadow-sm border border-gray-100" title="Delivery profit simulator">
          <p className="mt-0 text-sm text-gray-500">
            A price change keeps food cost dollars the same. A portion change recalculates them.
          </p>
          {platform ? (
            <Simulator platform={platform} projection={projection} setProjection={setProjection} />
          ) : null}
        </Card>

        <Card className="shadow-sm border border-gray-100" title="Delivery confidence">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xl font-semibold text-[#FF8132]">
              {report?.confidence?.score ?? '—'}
            </div>
            <p className="m-0 text-sm text-gray-600">
              Weighted from recipe coverage, ingredient freshness, platform prices, commissions, item mix, labor, and packaging.
              {report?.confidence?.low ? ' Below 50, projections stay estimated.' : ''}
              {report?.confidence?.missing?.length ? ` Still open: ${report.confidence.missing.join(', ')}.` : ''}
            </p>
          </div>
        </Card>

        <Card className="shadow-sm border border-gray-100" title="Enter delivery costs">
          <div className="mb-4 flex flex-wrap gap-2">
            {(report?.platforms || []).map((row) => (
              <button
                key={row.key}
                type="button"
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  setupKey === row.key ? 'bg-[#FF8132] text-white' : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => {
                  setSetupKey(row.key);
                  setDraft(assumptionDraft(row));
                  setProjection(null);
                }}
              >
                {row.name}
              </button>
            ))}
          </div>
          {draft ? <AssumptionForm draft={draft} setDraft={setDraft} onSave={saveSetup} saving={saving} /> : null}
        </Card>

        <Drawer
          title={detail ? `${detail.menu_item_name} · ${detail.platform_name}` : 'Recommendation'}
          open={!!detail}
          onClose={() => setDetail(null)}
          width={480}
        >
          {detail ? (
            <div className="space-y-4 text-sm text-gray-700">
              <p className="m-0">
                {detail.why} {detail.summary}
              </p>
              <Compare title="Where the money goes" current={detail.current} projected={detail.projected} />
              {detail.price_flag ? (
                <Alert
                  type="warning"
                  showIcon
                  message="This price is well above the in-store price. Check whether guests will still order it."
                />
              ) : null}
              {detail.alternative ? (
                <p className="m-0">
                  Another option: {detail.alternative.summary} Estimated {money(detail.alternative.per_order)} per order, food cost {money(detail.alternative.food_cost)}.
                </p>
              ) : null}
              <p className="m-0">{detail.how_to_verify}</p>
              <p className="m-0">
                Estimated impact {money(detail.per_order)} per order
                {detail.monthly ? `, ${detail.monthly} per month` : ''}. Realized impact:{' '}
                {tracked?.realized_improvement_per_order == null ? 'not verified yet' : money(tracked.realized_improvement_per_order)}.
              </p>
              {tracked?.note ? <Alert type="info" showIcon message={tracked.note} /> : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="primary"
                  className="!bg-[#FF8132] border-none"
                  onClick={async () => {
                    const saved = await implementDeliveryRecommendation(detail);
                    setTracked(saved);
                    message.success('Marked as implemented. Estimated impact is saved separately from realized results.');
                  }}
                >
                  Mark as Implemented
                </Button>
                <Button
                  disabled={!tracked?.id}
                  onClick={async () => setTracked(await trackDeliveryRecommendation(tracked.id))}
                >
                  Track Results
                </Button>
              </div>
            </div>
          ) : null}
        </Drawer>
      </div>
    </Spin>
  );
};

const GradeGauge = ({ letter, title }) => {
  const tone = gradeTone(letter);
  const portion = { A: 0.92, B: 0.76, C: 0.6, D: 0.4, F: 0.2 }[letter] || 0;
  const length = Math.PI * 70;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 180 108" className="h-28 w-44" aria-hidden="true">
        <path d="M20 96 A70 70 0 0 1 160 96" fill="none" stroke="#e5e7eb" strokeWidth="14" strokeLinecap="round" />
        <path
          d="M20 96 A70 70 0 0 1 160 96"
          fill="none"
          stroke={tone.stroke}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${length * portion} ${length}`}
        />
        <text x="90" y="88" textAnchor="middle" fontSize="40" fontWeight="700" fill="#111827">
          {letter || '—'}
        </text>
      </svg>
      <span className={`-mt-1 rounded-full px-3 py-1 text-xs font-semibold ${tone.pill}`}>{title || 'Not rated'}</span>
    </div>
  );
};

const Metric = ({ label, value, hint, valueClassName }) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <div>
      <p className="m-0 text-sm text-gray-500">{label}</p>
      {hint ? <p className="m-0 text-xs text-gray-400">{hint}</p> : null}
    </div>
    <p className={`m-0 text-lg font-semibold text-gray-900 ${valueClassName || ''}`}>{value}</p>
  </div>
);

const Compare = ({ current, projected }) => (
  <div className="overflow-hidden rounded-xl border border-gray-100">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left text-gray-500">
        <tr>
          <th className="px-3 py-2 font-medium"> </th>
          <th className="px-3 py-2 font-medium">Current</th>
          <th className="px-3 py-2 font-medium">After</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['Price', 'selling_price'],
          ['Food cost', 'food_cost'],
          ['COGS %', 'cogs_pct'],
          ['Fees', 'fees'],
          ['Labor', 'labor'],
          ['Packaging', 'packaging'],
          ['Total cost', 'total_costs'],
          ['Profit', 'profit'],
        ].map(([label, key]) => (
          <tr key={key} className="border-t border-gray-100">
            <td className="px-3 py-2 text-gray-600">{label}</td>
            <td className="px-3 py-2">{key === 'cogs_pct' ? current?.[key] ?? '—' : money(current?.[key])}</td>
            <td className="px-3 py-2 font-medium text-gray-900">
              {key === 'cogs_pct' ? projected?.[key] ?? '—' : money(projected?.[key])}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Simulator = ({ platform, projection, setProjection }) => {
  const [itemId, setItemId] = useState(platform.items?.[0]?.menu_item_id);
  const [price, setPrice] = useState(null);
  const item = (platform.items || []).find((row) => row.menu_item_id === itemId);

  useEffect(() => {
    setItemId(platform.items?.[0]?.menu_item_id);
    setPrice(null);
  }, [platform.key]);

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <Field label="Menu item">
          <Select
            className="w-full"
            value={itemId}
            options={(platform.items || []).map((row) => ({ value: row.menu_item_id, label: row.name }))}
            onChange={setItemId}
          />
        </Field>
        <Field label="Projected delivery price">
          <InputNumber className="w-full" min={0} prefix="$" value={price} onChange={setPrice} />
        </Field>
        <Button
          type="primary"
          className="!bg-[#FF8132] border-none"
          onClick={async () => {
            const result = await simulateDeliveryOrder({
              platform_key: platform.key,
              menu_item_id: itemId,
              selling_price: price || item?.delivery_price,
              change: { kind: 'price', price: price || item?.delivery_price },
            });
            setProjection(result);
          }}
        >
          Project price
        </Button>
      </div>
      <div>
        {projection ? (
          <Compare current={projection.current} projected={projection.projected} />
        ) : (
          <div className="flex h-full min-h-[160px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-500">
            Choose an item and a price to see the projected order.
          </div>
        )}
      </div>
    </div>
  );
};

const assumptionDraft = (platform) => {
  const fee = platform?.assumptions?.fee_rule?.percentage_fees?.[0];
  const assumptions = platform?.assumptions || {};
  return {
    commission: fee?.rate != null ? Number(fee.rate) * 100 : null,
    commissionBase: fee?.base || 'selling_price',
    fixedFee: assumptions.fee_rule?.fixed_fees?.[0]?.amount || null,
    processingRate: assumptions.fee_rule?.processing_rate != null ? Number(assumptions.fee_rule.processing_rate) * 100 : null,
    processingBase: assumptions.fee_rule?.processing_base || 'selling_price',
    processingBaseAmount: assumptions.fee_rule?.processing_base_amount,
    processingFixed: assumptions.fee_rule?.processing_fixed,
    laborModel: assumptions.labor_model || 'allocated',
    laborMinutes: assumptions.labor_minutes,
    laborWage: assumptions.labor_wage,
    laborAllocated: assumptions.labor_allocated,
    packagingInCogs: assumptions.packaging_in_cogs !== false,
    extraPackaging: assumptions.extra_packaging,
    other: assumptions.other_variable,
    target: assumptions.target_margin_pct,
    platformSales: assumptions.platform_sales,
    expectedOrders: assumptions.expected_monthly_orders,
    mixSource: assumptions.mix_source && assumptions.mix_source !== 'none' ? assumptions.mix_source : 'user_entered',
    items: (platform?.items || []).map((item) => ({
      menu_item_id: item.menu_item_id,
      name: item.name,
      selling_price: item.delivery_price,
      order_count: null,
    })),
  };
};

const AssumptionForm = ({ draft, setDraft, onSave, saving }) => {
  const set = (key, value) => setDraft({ ...draft, [key]: value });
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <FormSection title="Platform fees">
          <Field label="Commission %">
            <InputNumber className="w-full" min={0} max={100} value={draft.commission} onChange={(value) => set('commission', value)} />
          </Field>
          <Field label="Commission base">
            <Select
              className="w-full"
              value={draft.commissionBase}
              options={[
                { value: 'selling_price', label: 'Platform selling price' },
                { value: 'subtotal_before_discounts', label: 'Subtotal before discounts' },
                { value: 'user_entered', label: 'User-entered base' },
              ]}
              onChange={(value) => set('commissionBase', value)}
            />
          </Field>
          <Field label="Fixed fee per order">
            <InputNumber className="w-full" min={0} prefix="$" value={draft.fixedFee} onChange={(value) => set('fixedFee', value)} />
          </Field>
          <Field label="Processing %">
            <InputNumber className="w-full" min={0} value={draft.processingRate} onChange={(value) => set('processingRate', value)} />
          </Field>
          <Field label="Processing base">
            <Select
              className="w-full"
              value={draft.processingBase}
              options={[
                { value: 'selling_price', label: 'Platform selling price' },
                { value: 'user_entered', label: 'Fixed dollar base' },
              ]}
              onChange={(value) => set('processingBase', value)}
            />
          </Field>
          <Field label="Processing fixed charge">
            <InputNumber className="w-full" min={0} prefix="$" value={draft.processingFixed} onChange={(value) => set('processingFixed', value)} />
          </Field>
        </FormSection>
        <FormSection title="Labor, sales, and target">
          <Field label="Labor model">
            <Select
              className="w-full"
              value={draft.laborModel}
              options={[
                { value: 'allocated', label: 'Allocated dollars per order' },
                { value: 'incremental', label: 'Incremental minutes × wage' },
              ]}
              onChange={(value) => set('laborModel', value)}
            />
          </Field>
          {draft.laborModel === 'incremental' ? (
            <>
              <Field label="Minutes">
                <InputNumber className="w-full" min={0} value={draft.laborMinutes} onChange={(value) => set('laborMinutes', value)} />
              </Field>
              <Field label="Loaded wage / hour">
                <InputNumber className="w-full" min={0} prefix="$" value={draft.laborWage} onChange={(value) => set('laborWage', value)} />
              </Field>
            </>
          ) : (
            <Field label="Allocated labor / order">
              <InputNumber className="w-full" min={0} prefix="$" value={draft.laborAllocated} onChange={(value) => set('laborAllocated', value)} />
            </Field>
          )}
          <Field label="Target margin %">
            <InputNumber className="w-full" value={draft.target} onChange={(value) => set('target', value)} />
          </Field>
          <Field label="Platform sales">
            <InputNumber className="w-full" min={0} prefix="$" value={draft.platformSales} onChange={(value) => set('platformSales', value)} />
          </Field>
          <Field label="Expected monthly orders">
            <InputNumber className="w-full" min={0} value={draft.expectedOrders} onChange={(value) => set('expectedOrders', value)} />
          </Field>
          <Field label="Item mix">
            <Select
              className="w-full"
              value={draft.mixSource}
              options={[
                { value: 'user_entered', label: 'User-entered mix' },
                { value: 'pos_proxy', label: 'Estimated using overall menu sales mix' },
                { value: 'verified', label: 'Verified platform items' },
              ]}
              onChange={(value) => set('mixSource', value)}
            />
          </Field>
        </FormSection>
      </div>
      <label className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        <Checkbox checked={draft.packagingInCogs} onChange={(event) => set('packagingInCogs', event.target.checked)} />
        Packaging is already inside the plate cost
      </label>
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-900">Platform prices</p>
        <div className="max-h-80 overflow-auto rounded-xl border border-gray-100">
          <div className="sticky top-0 grid grid-cols-[minmax(0,1fr)_150px_130px] gap-2 bg-gray-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            <span>Item</span>
            <span>Delivery price</span>
            <span>Orders</span>
          </div>
          {(draft.items || []).map((item, index) => (
            <div key={item.menu_item_id} className="grid grid-cols-[minmax(0,1fr)_150px_130px] items-center gap-2 border-t border-gray-100 px-3 py-2">
              <span className="truncate text-sm text-gray-800">{item.name}</span>
              <InputNumber
                className="w-full"
                min={0}
                prefix="$"
                placeholder="Price"
                value={item.selling_price}
                onChange={(value) => {
                  const items = [...draft.items];
                  items[index] = { ...item, selling_price: value };
                  set('items', items);
                }}
              />
              <InputNumber
                className="w-full"
                min={0}
                placeholder="Orders"
                value={item.order_count}
                onChange={(value) => {
                  const items = [...draft.items];
                  items[index] = { ...item, order_count: value };
                  set('items', items);
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <Button type="primary" loading={saving} className="!bg-[#FF8132] border-none" onClick={onSave}>
        Save delivery assumptions
      </Button>
    </div>
  );
};

const FormSection = ({ title, children }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
    <p className="mb-3 text-sm font-semibold text-gray-900">{title}</p>
    <div className="grid gap-3 sm:grid-cols-2">{children}</div>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    {children}
  </label>
);

export default DeliveryIntelligence;
