import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  message,
} from 'antd';
import {
  DeleteOutlined,
  ExperimentOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  applySimulatorChanges,
  archiveSimulatorScenario,
  fetchSimulatorApplyPlan,
  fetchSimulatorBaseline,
  fetchSimulatorOpportunities,
  fetchSimulatorScenarios,
  fetchSimulatorSnapshots,
  previewSimulatorChanges,
  previewSimulatorScenario,
  saveSimulatorScenario,
} from '../../../services/foodCostingApi';

const { RangePicker } = DatePicker;

const money = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
};

const pct = (v) => (v == null || v === '' ? '—' : `${Number(v).toFixed(1)}%`);

const CHANGE_TYPES = [
  { value: 'price_delta', label: 'Menu price ± $' },
  { value: 'price_set', label: 'Set menu price $' },
  { value: 'ingredient_cost_pct', label: 'Ingredient cost ± %' },
  { value: 'ingredient_cost_set', label: 'Set ingredient cost / unit' },
  { value: 'portion_delta', label: 'Portion ± qty' },
  { value: 'portion_pct', label: 'Portion ± %' },
];

const needsMenuItem = (type) =>
  ['price_delta', 'price_set', 'portion_delta', 'portion_pct', 'portion_set'].includes(
    type
  );

const needsIngredient = (type) =>
  [
    'ingredient_cost_pct',
    'ingredient_cost_set',
    'portion_delta',
    'portion_pct',
    'portion_set',
  ].includes(type);

const emptyChange = () => ({
  key: `${Date.now()}-${Math.random()}`,
  type: 'price_delta',
  menu_item_id: undefined,
  ingredient_id: undefined,
  value: 1,
  volume_elasticity_pct: undefined,
});

const buildChangePayload = (row) => {
  const change = { type: row.type, value: row.value };
  if (needsMenuItem(row.type)) change.menu_item_id = row.menu_item_id;
  if (needsIngredient(row.type)) change.ingredient_id = row.ingredient_id;
  if (row.volume_elasticity_pct != null && row.volume_elasticity_pct !== '') {
    change.volume_elasticity_pct = row.volume_elasticity_pct;
  }
  return change;
};

/**
 * Menu Profitability Simulator tab (Food Costing only).
 */
const MenuProfitabilitySimulator = () => {
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [range, setRange] = useState([dayjs().subtract(89, 'day'), dayjs()]);
  const [baseline, setBaseline] = useState(null);
  const [preview, setPreview] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [changes, setChanges] = useState([emptyChange()]);
  const [globalVolume, setGlobalVolume] = useState(0);
  const [activeScenarioId, setActiveScenarioId] = useState(null);

  const [saveOpen, setSaveOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [saving, setSaving] = useState(false);

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMode, setApplyMode] = useState('apply_now');
  const [scheduledFor, setScheduledFor] = useState(null);
  const [applyPlan, setApplyPlan] = useState(null);
  const [applying, setApplying] = useState(false);

  const dateFrom = range?.[0]?.format('YYYY-MM-DD');
  const dateTo = range?.[1]?.format('YYYY-MM-DD');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [base, opps, sc, snaps] = await Promise.all([
        fetchSimulatorBaseline({ dateFrom, dateTo }),
        fetchSimulatorOpportunities({ dateFrom, dateTo, limit: 8 }),
        fetchSimulatorScenarios().catch(() => ({ scenarios: [] })),
        fetchSimulatorSnapshots().catch(() => ({ snapshots: [] })),
      ]);
      setBaseline(base);
      setOpportunities(opps?.opportunities || []);
      setScenarios(sc?.scenarios || []);
      setSnapshots(snaps?.snapshots || []);
    } catch (error) {
      const data = error?.response?.data;
      message.error(data?.error || 'Failed to load simulator baseline');
      setBaseline(null);
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const menuOptions = useMemo(
    () =>
      (baseline?.items || []).map((item) => ({
        value: item.menu_item_id,
        label: `${item.name} (${money(item.selling_price)})`,
      })),
    [baseline]
  );

  const ingredientOptions = useMemo(
    () =>
      (baseline?.ingredients || []).map((ing) => ({
        value: ing.id,
        label: `${ing.name} · ${money(ing.cost_per_unit)}/${ing.unit} · ${ing.menu_item_ids.length} items`,
      })),
    [baseline]
  );

  const validateChanges = () => {
    const payload = [];
    for (const row of changes) {
      if (row.value === null || row.value === undefined || row.value === '') {
        message.error('Each change needs a value');
        return null;
      }
      if (needsMenuItem(row.type) && !row.menu_item_id) {
        message.error('Select a menu item for price/portion changes');
        return null;
      }
      if (needsIngredient(row.type) && !row.ingredient_id) {
        message.error('Select an ingredient for cost/portion changes');
        return null;
      }
      payload.push(buildChangePayload(row));
    }
    if (!payload.length) {
      message.error('Add at least one change');
      return null;
    }
    return payload;
  };

  const runPreview = async () => {
    const payload = validateChanges();
    if (!payload) return;
    setPreviewing(true);
    try {
      const result = await previewSimulatorChanges({
        date_from: dateFrom,
        date_to: dateTo,
        volume_elasticity_pct: globalVolume || 0,
        changes: payload,
      });
      setPreview(result);
      if (result?.warnings?.length) message.warning(result.warnings[0]);
      else message.success('Simulation preview ready');
    } catch (error) {
      message.error(error?.response?.data?.error || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const applyOpportunity = (opp) => {
    if (!opp?.change) return;
    setChanges([
      {
        ...emptyChange(),
        type: opp.change.type,
        menu_item_id: opp.change.menu_item_id,
        ingredient_id: opp.change.ingredient_id,
        value: opp.change.value,
      },
    ]);
    setActiveScenarioId(null);
  };

  const handleSaveScenario = async () => {
    const payload = validateChanges();
    if (!payload) return;
    if (!scenarioName.trim()) {
      message.error('Enter a scenario name');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveSimulatorScenario({
        name: scenarioName.trim(),
        date_from: dateFrom,
        date_to: dateTo,
        volume_elasticity_pct: globalVolume || 0,
        changes: payload,
      });
      message.success('Scenario saved');
      setSaveOpen(false);
      setScenarioName('');
      setActiveScenarioId(saved.id);
      setScenarios((prev) => [saved, ...prev.filter((s) => s.id !== saved.id)]);
      if (saved.last_preview) setPreview(saved.last_preview);
    } catch (error) {
      message.error(error?.response?.data?.error || 'Failed to save scenario');
    } finally {
      setSaving(false);
    }
  };

  const loadScenario = async (scenario) => {
    setActiveScenarioId(scenario.id);
    if (scenario.date_from && scenario.date_to) {
      setRange([dayjs(scenario.date_from), dayjs(scenario.date_to)]);
    }
    setGlobalVolume(Number(scenario.volume_elasticity_pct || 0));
    setChanges(
      (scenario.changes || []).map((ch) => ({
        ...emptyChange(),
        type: ch.type,
        menu_item_id: ch.menu_item_id,
        ingredient_id: ch.ingredient_id,
        value: ch.value,
        volume_elasticity_pct: ch.volume_elasticity_pct,
      }))
    );
    try {
      const res = await previewSimulatorScenario(scenario.id);
      setPreview(res.preview || scenario.last_preview || null);
      message.success(`Loaded “${scenario.name}”`);
    } catch {
      setPreview(scenario.last_preview || null);
    }
  };

  const openApplyWizard = async () => {
    const payload = validateChanges();
    if (!payload) return;
    setApplying(true);
    try {
      const plan = await fetchSimulatorApplyPlan(payload);
      setApplyPlan(plan);
      setApplyOpen(true);
    } catch (error) {
      message.error(error?.response?.data?.error || 'Failed to build apply plan');
    } finally {
      setApplying(false);
    }
  };

  const confirmApply = async () => {
    const payload = validateChanges();
    if (!payload) return;
    if (applyMode === 'apply_future' && !scheduledFor) {
      message.error('Pick a future date');
      return;
    }
    setApplying(true);
    try {
      const res = await applySimulatorChanges({
        mode: applyMode,
        changes: payload,
        scenario_id: activeScenarioId || undefined,
        scheduled_for:
          applyMode === 'apply_future'
            ? scheduledFor.format('YYYY-MM-DD')
            : undefined,
      });
      message.success(res?.result?.message || 'Apply completed');
      setApplyOpen(false);
      await load();
      if (applyMode === 'apply_now') {
        // refresh preview against new live baseline
        setPreview(null);
      }
    } catch (error) {
      message.error(error?.response?.data?.error || 'Apply failed');
    } finally {
      setApplying(false);
    }
  };

  const salesSourceLabel = {
    square: 'Square POS mix',
    sales_share_percent: 'Menu sales-share estimates',
    equal_weight_estimate: 'Equal-weight estimate',
    none: 'No sales data',
  };

  const updateChange = (key, patch) => {
    setChanges((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  };

  return (
    <Spin spinning={loading || previewing || applying}>
      <Alert
        className="mb-4"
        type="info"
        showIcon
        message="Menu Profitability Simulator"
        description="Test multiple price/cost/portion changes, save scenarios, and optionally apply to live Food Costing (with a version snapshot). Separate from sidebar Simulation mode."
      />

      <Card className="mb-4 shadow-sm" size="small">
        <Space wrap className="w-full justify-between">
          <Space wrap>
            <span className="text-gray-600">Sales window</span>
            <RangePicker
              value={range}
              onChange={(vals) => vals && setRange(vals)}
              allowClear={false}
            />
            {baseline?.sales_meta?.sales_source && (
              <Tag color="blue">
                {salesSourceLabel[baseline.sales_meta.sales_source] ||
                  baseline.sales_meta.sales_source}
              </Tag>
            )}
          </Space>
          <Button icon={<ReloadOutlined />} onClick={load}>
            Refresh
          </Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]} className="mb-4">
        {[
          { title: 'Period revenue', value: money(baseline?.totals?.period_revenue) },
          {
            title: 'Contribution profit',
            value: money(baseline?.totals?.period_contribution_profit),
          },
          { title: 'Food cost %', value: pct(baseline?.totals?.food_cost_percent) },
          { title: 'Menu items', value: baseline?.totals?.menu_item_count ?? '—' },
        ].map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.title}>
            <Card className="shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm mb-1">{card.title}</p>
              <p className="text-xl font-semibold text-[#FF8132]">{card.value}</p>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <span>
                <ExperimentOutlined className="mr-2" />
                Quick simulation
              </span>
            }
            className="shadow-sm mb-4"
            extra={
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setChanges((prev) => [...prev, emptyChange()])}
              >
                Add change
              </Button>
            }
          >
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-1">
                Global volume change % (all changes)
              </div>
              <InputNumber
                className="w-full"
                value={globalVolume}
                onChange={(v) => setGlobalVolume(v || 0)}
              />
            </div>

            {changes.map((row, idx) => (
              <Card
                key={row.key}
                size="small"
                className="mb-3 border border-gray-100"
                title={`Change ${idx + 1}`}
                extra={
                  changes.length > 1 ? (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        setChanges((prev) => prev.filter((c) => c.key !== row.key))
                      }
                    />
                  ) : null
                }
              >
                <Form layout="vertical" size="small">
                  <Form.Item label="Change type" required>
                    <Select
                      value={row.type}
                      options={CHANGE_TYPES}
                      onChange={(type) => updateChange(row.key, { type })}
                    />
                  </Form.Item>
                  {needsMenuItem(row.type) && (
                    <Form.Item label="Menu item" required>
                      <Select
                        showSearch
                        optionFilterProp="label"
                        options={menuOptions}
                        value={row.menu_item_id}
                        onChange={(menu_item_id) =>
                          updateChange(row.key, { menu_item_id })
                        }
                      />
                    </Form.Item>
                  )}
                  {needsIngredient(row.type) && (
                    <Form.Item label="Ingredient" required>
                      <Select
                        showSearch
                        optionFilterProp="label"
                        options={ingredientOptions}
                        value={row.ingredient_id}
                        onChange={(ingredient_id) =>
                          updateChange(row.key, { ingredient_id })
                        }
                      />
                    </Form.Item>
                  )}
                  <Form.Item label="Value" required>
                    <InputNumber
                      className="w-full"
                      value={row.value}
                      onChange={(value) => updateChange(row.key, { value })}
                    />
                  </Form.Item>
                </Form>
              </Card>
            ))}

            <Space direction="vertical" className="w-full">
              <Button
                type="primary"
                className="!bg-[#FF8132] hover:!bg-[#EB5B00] border-none"
                block
                onClick={runPreview}
              >
                Run preview
              </Button>
              <Button icon={<SaveOutlined />} block onClick={() => setSaveOpen(true)}>
                Save scenario
              </Button>
              <Button block onClick={openApplyWizard} disabled={!preview}>
                Apply changes…
              </Button>
            </Space>
          </Card>

          <Card title="Saved scenarios" className="shadow-sm mb-4">
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={scenarios}
              locale={{ emptyText: 'No saved scenarios yet.' }}
              columns={[
                {
                  title: 'Name',
                  dataIndex: 'name',
                  render: (t, row) => (
                    <div>
                      <div className="font-medium">{t}</div>
                      <Tag>{row.status}</Tag>
                    </div>
                  ),
                },
                {
                  title: '',
                  width: 150,
                  render: (_, row) => (
                    <Space>
                      <Button size="small" onClick={() => loadScenario(row)}>
                        Load
                      </Button>
                      <Popconfirm
                        title="Archive this scenario?"
                        onConfirm={async () => {
                          await archiveSimulatorScenario(row.id);
                          setScenarios((prev) => prev.filter((s) => s.id !== row.id));
                          message.success('Archived');
                        }}
                      >
                        <Button size="small" danger>
                          Archive
                        </Button>
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>

          <Card title="Top opportunities" className="shadow-sm">
            <Table
              size="small"
              rowKey={(r) => `${r.type}-${r.title}`}
              pagination={false}
              dataSource={opportunities}
              locale={{ emptyText: 'No ranked opportunities yet.' }}
              columns={[
                {
                  title: 'Idea',
                  dataIndex: 'title',
                  render: (t, row) => (
                    <div>
                      <div className="font-medium">{t}</div>
                      <div className="text-xs text-gray-500">
                        {row.lio_note || row.rationale}
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Est. annual',
                  dataIndex: 'estimated_annual_impact',
                  width: 110,
                  render: (v) => money(v),
                },
                {
                  title: '',
                  width: 90,
                  render: (_, row) => (
                    <Button size="small" onClick={() => applyOpportunity(row)}>
                      Use
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          {preview ? (
            <Card title="Projected impact" className="shadow-sm mb-4">
              <Row gutter={[12, 12]} className="mb-4">
                {[
                  ['Period', preview.impact?.profit?.period],
                  ['Day', preview.impact?.profit?.day],
                  ['Week', preview.impact?.profit?.week],
                  ['Month', preview.impact?.profit?.month],
                  ['Year', preview.impact?.profit?.year],
                ].map(([label, value]) => (
                  <Col xs={12} sm={8} md={4} key={label}>
                    <div className="rounded-lg border border-gray-100 p-3">
                      <div className="text-xs text-gray-500">{label}</div>
                      <div
                        className={`text-lg font-semibold ${
                          Number(value) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {money(value)}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>

              <div className="mb-3 text-sm text-gray-600">
                Current FC {pct(preview.current_totals?.food_cost_percent)} → Projected{' '}
                {pct(preview.projected_totals?.food_cost_percent)}
              </div>

              {(preview.lio_guidance || []).map((tip, i) => (
                <Alert
                  key={`lio-${i}`}
                  className="mb-2"
                  type="info"
                  showIcon
                  message="LIO guidance"
                  description={tip}
                />
              ))}

              {(preview.ingredient_cascade || []).map((c) => (
                <Alert
                  key={c.ingredient_id}
                  className="mb-3"
                  type="warning"
                  showIcon
                  message={`${c.ingredient_name} affects ${c.affected_count} menu items`}
                  description={(c.affected_menu_items || []).slice(0, 8).join(', ')}
                />
              ))}

              <Table
                size="small"
                rowKey="menu_item_id"
                dataSource={preview.item_deltas || []}
                pagination={{ pageSize: 6 }}
                columns={[
                  { title: 'Item', dataIndex: 'name' },
                  {
                    title: 'Δ period',
                    dataIndex: 'delta_profit_period',
                    render: (v) => (
                      <span className={Number(v) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {money(v)}
                      </span>
                    ),
                  },
                  {
                    title: 'Δ annual',
                    dataIndex: 'delta_profit_annual',
                    render: (v) => (
                      <span
                        className={
                          Number(v) >= 0
                            ? 'text-green-600 font-semibold'
                            : 'text-red-600 font-semibold'
                        }
                      >
                        {money(v)}
                      </span>
                    ),
                  },
                ]}
              />
            </Card>
          ) : (
            <Card className="shadow-sm mb-4">
              <p className="text-gray-500">
                Add one or more changes, then run preview to see day/week/month/year impact.
              </p>
            </Card>
          )}

          <Card title="Baseline menu mix" className="shadow-sm mb-4">
            <Table
              size="small"
              rowKey="menu_item_id"
              dataSource={baseline?.items || []}
              pagination={{ pageSize: 8 }}
              scroll={{ x: true }}
              columns={[
                { title: 'Item', dataIndex: 'name' },
                {
                  title: 'Price',
                  dataIndex: 'selling_price',
                  render: (v) => money(v),
                },
                {
                  title: 'Plate cost',
                  dataIndex: 'plate_cost',
                  render: (v) => money(v),
                },
                {
                  title: 'FC %',
                  dataIndex: 'food_cost_percent',
                  render: (v) => pct(v),
                },
                {
                  title: 'Units',
                  dataIndex: 'units_sold',
                  render: (v) => Number(v || 0).toFixed(1),
                },
                {
                  title: 'Sales share',
                  dataIndex: 'sales_share_percent',
                  render: (v) => pct(v),
                },
                {
                  title: 'Period profit',
                  dataIndex: 'period_profit',
                  render: (v) => money(v),
                },
              ]}
            />
          </Card>

          {snapshots?.length > 0 && (
            <Card title="Costing version snapshots" className="shadow-sm" size="small">
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={snapshots}
                columns={[
                  { title: 'Label', dataIndex: 'label' },
                  {
                    title: 'Created',
                    dataIndex: 'created_at',
                    render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—'),
                  },
                  { title: 'Items', dataIndex: 'menu_item_count' },
                  { title: 'Recipes', dataIndex: 'recipe_count' },
                ]}
              />
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title="Save scenario"
        open={saveOpen}
        onCancel={() => setSaveOpen(false)}
        onOk={handleSaveScenario}
        confirmLoading={saving}
        okText="Save"
      >
        <Input
          placeholder="e.g. Summer Pricing Strategy"
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
        />
      </Modal>

      <Modal
        title="Apply simulation to Food Costing"
        open={applyOpen}
        onCancel={() => setApplyOpen(false)}
        onOk={confirmApply}
        confirmLoading={applying}
        okText="Confirm apply"
        width={640}
      >
        <Alert
          className="mb-3"
          type="warning"
          showIcon
          message="This can change live prices, ingredient costs, or portions."
          description="A version snapshot is created before apply_now / due apply_future jobs."
        />
        <Radio.Group
          className="mb-3"
          value={applyMode}
          onChange={(e) => setApplyMode(e.target.value)}
        >
          <Space direction="vertical">
            <Radio value="simulation_only">Simulation only (do not change live data)</Radio>
            <Radio value="apply_now">Apply to current recipes & costing</Radio>
            <Radio value="apply_future">Apply starting on a future date</Radio>
          </Space>
        </Radio.Group>
        {applyMode === 'apply_future' && (
          <DatePicker
            className="mb-3 w-full"
            value={scheduledFor}
            onChange={setScheduledFor}
            disabledDate={(d) => d && d.isBefore(dayjs(), 'day')}
          />
        )}
        <div className="text-sm font-medium mb-2">
          What will change ({applyPlan?.action_count || 0})
        </div>
        <Table
          size="small"
          pagination={false}
          rowKey={(_, i) => String(i)}
          dataSource={applyPlan?.actions || []}
          columns={[
            { title: 'Type', dataIndex: 'kind', width: 120 },
            { title: 'Detail', dataIndex: 'detail' },
          ]}
        />
        {(applyPlan?.lio_guidance || []).slice(0, 3).map((tip, i) => (
          <Alert key={i} className="mt-2" type="info" showIcon description={tip} />
        ))}
      </Modal>
    </Spin>
  );
};

export default MenuProfitabilitySimulator;
