import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AutoComplete,
  Button,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Tooltip,
  message,
} from 'antd';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { createVendor, estimateIngredientYield } from '../../../services/foodCostingApi';

const PURCHASE_BY_OPTIONS = [
  { value: 'case', label: 'Case' },
  { value: 'each', label: 'Each' },
];

const PACKAGE_TYPE_OPTIONS = [
  { value: 'bag', label: 'Bag(s)' },
  { value: 'can', label: 'Can(s)' },
  { value: 'bottle', label: 'Bottle(s)' },
  { value: 'container', label: 'Container(s)' },
  { value: 'jar', label: 'Jar(s)' },
  { value: 'box', label: 'Box(s)' },
  { value: 'carton', label: 'Carton(s)' },
  { value: 'jug', label: 'Jug(s)' },
  { value: 'pouch', label: 'Pouch(es)' },
  { value: 'tub', label: 'Tub(s)' },
  { value: 'tray', label: 'Tray(s)' },
  { value: 'each', label: 'Each' },
];

const CONTENTS_UNIT_OPTIONS = [
  { value: 'oz', label: 'oz' },
  { value: 'lb', label: 'lb' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'cup', label: 'Cup' },
  { value: 'pint', label: 'Pint' },
  { value: 'gal', label: 'Gal' },
  { value: 'mL', label: 'mL' },
  { value: 'L', label: 'L' },
  { value: 'each', label: 'Each' },
];

const RECIPE_UNIT_OPTIONS = [
  { value: 'oz', label: 'oz' },
  { value: 'g', label: 'g' },
  { value: 'mL', label: 'mL' },
  { value: 'each', label: 'Each' },
];

const WEIGHT_TO_G = {
  g: 1,
  gram: 1,
  grams: 1,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
};

const VOLUME_TO_ML = {
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  gal: 3785.41,
  gallon: 3785.41,
  gallons: 3785.41,
  cup: 236.588,
  pint: 473.176,
  pt: 473.176,
};

const EACH_UNITS = new Set(['each', 'ea', 'pc', 'pcs', 'piece', 'pieces']);

const HOVER_TIPS = {
  category: 'Choose a category first so Growlio can narrow ingredient-name matches. Example: Produce.',
  name: 'Start typing to search existing ingredients. Pick a match to avoid duplicates, or continue if this is truly new.',
  vendor: 'Select how you buy this ingredient. Add a new vendor if it is not in the list. Example: Sysco.',
  vendor_item_number:
    'Vendor catalog number. The same ingredient can have different item numbers at different vendors.',
  catch_weight:
    'Turn on if the actual weight changes each delivery. Growlio will use invoice weight and invoice cost, not a fixed pack size.',
  purchase_by: 'Select how you normally buy this ingredient, such as case, bag, box, bottle or each.',
  pack_qty: 'Enter the number of purchase units included in this cost. Example: 1 case.',
  price: 'Enter the total price for the quantity purchased.',
  inner_qty: 'Enter how many smaller packages are inside. Example: 6 bags in a case. Skip this if there are no smaller packages.',
  package_type: 'Select how the product is packed inside the purchase unit, such as bags, cans or bottles. Skip this if there is no inner packaging.',
  contents_qty:
    'Enter how much product is in each package. Example: 2 lb per bag or 72 oz per can. If there is no inner package, enter the total amount in the purchased unit.',
  contents_unit: 'Select the measurement for the amount above, such as lb, oz, kg, g, L, mL or each.',
  recipe_unit:
    'Select how you normally measure this ingredient in a recipe. Growlio will automatically convert the purchase information and calculate the cost per recipe unit.',
  use_all:
    'Choose whether the entire purchased amount is usable or some is lost through draining, trimming, peeling, cooking or prep.',
  usable_amount: 'Enter how much product is actually usable after draining or prep. Growlio will calculate the yield percentage for you.',
  lio: 'LIO will estimate the usable amount or yield. You can confirm the actual amount later to improve the Confidence Score.',
  yield_percent: 'The percentage of the purchased product that is actually usable. Growlio calculates this automatically from the usable amount you provide.',
};

const LabelWithTip = ({ text, tip }) => (
  <span className="inline-flex items-center gap-1">
    {text}
    <Tooltip title={tip}>
      <InfoCircleOutlined className="text-gray-400" />
    </Tooltip>
  </span>
);

const normalizeUnit = (unit) => String(unit || '').trim().toLowerCase().replace('.', '');

const convertUnits = (qty, fromUnit, toUnit) => {
  const amount = Number(qty);
  if (!(amount >= 0) || Number.isNaN(amount)) return null;
  const src = normalizeUnit(fromUnit);
  const dst = normalizeUnit(toUnit);
  if (!src || !dst) return null;
  if (src === dst) return amount;
  if (WEIGHT_TO_G[src] != null && WEIGHT_TO_G[dst] != null) {
    return (amount * WEIGHT_TO_G[src]) / WEIGHT_TO_G[dst];
  }
  if (VOLUME_TO_ML[src] != null && VOLUME_TO_ML[dst] != null) {
    return (amount * VOLUME_TO_ML[src]) / VOLUME_TO_ML[dst];
  }
  if (EACH_UNITS.has(src) && EACH_UNITS.has(dst)) return amount;
  return null;
};

const suggestedRecipeUnit = (contentsUnit) => {
  const raw = normalizeUnit(contentsUnit);
  if (WEIGHT_TO_G[raw] != null) {
    if (['g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms'].includes(raw)) return 'g';
    return 'oz';
  }
  if (VOLUME_TO_ML[raw] != null) return 'mL';
  if (EACH_UNITS.has(raw)) return 'each';
  return 'oz';
};

const formatQty = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(n < 10 ? 2 : 1).replace(/\.0+$/, '');
};

const levenshtein = (a, b) => {
  const s = a.toLowerCase();
  const t = b.toLowerCase();
  const rows = Array.from({ length: s.length + 1 }, (_, i) =>
    Array.from({ length: t.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= s.length; i += 1) {
    for (let j = 1; j <= t.length; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + cost
      );
    }
  }
  return rows[s.length][t.length];
};

const similarIngredients = (query, ingredients, category) => {
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 2) return [];
  return ingredients
    .filter((item) => !category || String(item.category || '') === category)
    .map((item) => {
      const name = String(item.name || '').toLowerCase();
      if (!name) return { item, score: 0 };
      if (name === q) return { item, score: 1 };
      if (name.includes(q) || q.includes(name)) return { item, score: 0.85 };
      const dist = levenshtein(q, name);
      const maxLen = Math.max(q.length, name.length) || 1;
      return { item, score: 1 - dist / maxLen };
    })
    .filter((row) => row.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((row) => row.item);
};

const purchasePreview = (values) => {
  const pack = Number(values.purchase_pack_qty || 1);
  const inner = Number(values.purchase_inner_pack_qty || 1) || 1;
  const contents = Number(values.purchase_contents_qty);
  const cost = Number(values.purchase_total_cost);
  const contentsUnit = values.purchase_contents_unit || 'lb';
  const recipeUnit = values.standardized_unit || suggestedRecipeUnit(contentsUnit);
  if (!(contents > 0) || !(cost >= 0) || Number.isNaN(cost)) return null;
  const totalContents = pack * inner * contents;
  const purchased = convertUnits(totalContents, contentsUnit, recipeUnit);
  if (!(purchased > 0)) return null;

  let yieldPercent = null;
  let usable = purchased;
  if (values.yield_choice === 'all') {
    yieldPercent = 100;
  } else if (values.yield_choice === 'percent' && Number(values.yield_percent) > 0) {
    yieldPercent = Number(values.yield_percent);
    usable = purchased * (yieldPercent / 100);
  } else if (Number(values.yield_usable_qty) > 0) {
    const usableEach = convertUnits(
      values.yield_usable_qty,
      values.yield_usable_unit || contentsUnit,
      recipeUnit
    );
    if (usableEach > 0) {
      usable = pack * inner * usableEach;
      const contentsEach = convertUnits(contents, contentsUnit, recipeUnit);
      if (contentsEach > 0) yieldPercent = (usableEach / contentsEach) * 100;
    }
  }

  return {
    pack,
    inner,
    contents,
    contentsUnit,
    recipeUnit,
    totalContents,
    purchased,
    usable,
    yieldPercent,
    cost,
    costBeforePrep: cost / purchased,
    costUsable: usable > 0 ? cost / usable : null,
    purchaseLabel: values.purchase_unit_label || 'case',
    packageType: values.purchase_inner_pack_type || '',
  };
};

const STEP_FIELDS = [
  ['category', 'name'],
  ['purchase_unit_label', 'purchase_pack_qty', 'purchase_total_cost'],
  ['purchase_contents_qty', 'purchase_contents_unit'],
  ['standardized_unit'],
  ['yield_choice'],
];

const IngredientEntryModal = ({
  open,
  editingIngredient,
  ingredients = [],
  vendors = [],
  onCancel,
  onSaved,
  onVendorsChanged,
  saveIngredient,
}) => {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newVendorName, setNewVendorName] = useState('');
  const [addingVendor, setAddingVendor] = useState(false);
  const [extraSkus, setExtraSkus] = useState([]);
  const [lioNote, setLioNote] = useState('');

  const watched = Form.useWatch(
    [
      'name',
      'category',
      'purchase_unit_label',
      'purchase_pack_qty',
      'purchase_total_cost',
      'purchase_inner_pack_qty',
      'purchase_inner_pack_type',
      'purchase_contents_qty',
      'purchase_contents_unit',
      'standardized_unit',
      'yield_choice',
      'yield_usable_qty',
      'yield_usable_unit',
      'yield_percent',
      'is_catch_weight',
    ],
    form
  ) || {};
  const preview = useMemo(() => purchasePreview(watched), [watched]);

  const categoryOptions = useMemo(() => {
    const set = new Set(
      ingredients.map((item) => String(item.category || '').trim()).filter(Boolean)
    );
    return [...set].sort().map((value) => ({ value, label: value }));
  }, [ingredients]);

  const vendorOptions = useMemo(
    () => vendors.map((vendor) => ({ value: vendor.id, label: vendor.name })),
    [vendors]
  );

  const nameMatches = useMemo(
    () =>
      similarIngredients(watched.name, ingredients, watched.category).filter(
        (item) => !editingIngredient || item.id !== editingIngredient.id
      ),
    [watched.name, watched.category, ingredients, editingIngredient]
  );

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setLioNote('');
    setNewCategory('');
    setNewVendorName('');
    form.resetFields();
    if (editingIngredient) {
      const extra = (editingIngredient.vendor_items || []).filter((item) => !item.is_primary);
      setExtraSkus(
        extra.map((item) => ({
          vendor: item.vendor,
          vendor_item_number: item.vendor_item_number,
        }))
      );
      const source = editingIngredient.yield_source;
      let yieldChoice = 'all';
      if (source === 'usable_amount') yieldChoice = 'lost';
      else if (source === 'lio_estimate') yieldChoice = 'lio';
      else if (source === 'known_percent') yieldChoice = 'percent';
      else if (source === 'unconfirmed') yieldChoice = undefined;
      form.setFieldsValue({
        ...editingIngredient,
        purchase_unit_label: editingIngredient.purchase_unit_label || 'case',
        yield_choice: yieldChoice,
        yield_usable_unit:
          editingIngredient.yield_usable_unit ||
          editingIngredient.purchase_contents_unit ||
          'lb',
      });
    } else {
      setExtraSkus([]);
      form.setFieldsValue({
        purchase_unit_label: 'case',
        purchase_pack_qty: 1,
        purchase_contents_unit: 'lb',
        purchase_inner_pack_type: 'bag',
        standardized_unit: 'oz',
        is_catch_weight: false,
        yield_usable_unit: 'lb',
      });
    }
  }, [open, editingIngredient, form]);

  const purchaseLabel = watched.purchase_unit_label === 'each' ? 'each' : 'case';
  const packageLabel = watched.purchase_inner_pack_type || 'package';

  const goNext = async () => {
    try {
      await form.validateFields(STEP_FIELDS[step]);
      if (step === 0 && !String(form.getFieldValue('name') || '').trim()) {
        message.error('Ingredient name is required');
        return;
      }
      if (step === 3) {
        const contentsUnit = form.getFieldValue('purchase_contents_unit');
        const recipeUnit = form.getFieldValue('standardized_unit');
        if (
          convertUnits(1, contentsUnit, recipeUnit) == null &&
          !EACH_UNITS.has(normalizeUnit(contentsUnit))
        ) {
          message.error(
            'Recipe unit must match the package unit type (weight to weight, volume to volume, or count to count).'
          );
          return;
        }
      }
      setStep((current) => Math.min(current + 1, 4));
    } catch {
      /* field errors shown by form */
    }
  };

  const handleAddVendor = async () => {
    const name = newVendorName.trim();
    if (!name) return;
    try {
      setAddingVendor(true);
      const created = await createVendor({ name });
      onVendorsChanged?.();
      form.setFieldValue('vendor', created.id);
      setNewVendorName('');
      message.success(`Added vendor ${created.name}`);
    } catch (error) {
      message.error(error?.response?.data?.error || 'Failed to add vendor');
    } finally {
      setAddingVendor(false);
    }
  };

  const handleLioEstimate = async () => {
    try {
      setEstimating(true);
      const values = form.getFieldsValue();
      const result = await estimateIngredientYield({
        name: values.name,
        contents_qty: values.purchase_contents_qty,
        contents_unit: values.purchase_contents_unit,
        inner_pack_qty: values.purchase_inner_pack_qty,
      });
      form.setFieldsValue({
        yield_choice: 'lio',
        yield_usable_qty: result.yield_usable_qty,
        yield_usable_unit: result.yield_usable_unit || values.purchase_contents_unit,
        yield_percent: result.yield_percent,
      });
      setLioNote(result.note || 'LIO estimated this yield. Confirm later to improve confidence.');
      message.success('LIO estimated usable yield');
    } catch (error) {
      message.error(error?.response?.data?.error || 'Could not estimate yield');
    } finally {
      setEstimating(false);
    }
  };

  const handleSave = async () => {
    try {
      await form.validateFields(STEP_FIELDS[4]);
      const values = form.getFieldsValue(true);
      if (!values.yield_choice) {
        message.error('Please choose whether you use all of this product');
        return;
      }
      setSaving(true);
      const yieldSourceMap = {
        all: 'confirmed_100',
        lost: 'usable_amount',
        lio: 'lio_estimate',
        percent: 'known_percent',
      };
      const vendorItems = [
        {
          vendor: values.vendor || null,
          vendor_item_number: values.vendor_item_number || '',
          is_primary: true,
        },
        ...extraSkus
          .filter((row) => row.vendor || row.vendor_item_number)
          .map((row) => ({
            vendor: row.vendor || null,
            vendor_item_number: row.vendor_item_number || '',
            is_primary: false,
          })),
      ];
      const payload = {
        ...values,
        yield_source: yieldSourceMap[values.yield_choice] || 'unconfirmed',
        yield_percent:
          values.yield_choice === 'all' ? 100 : values.yield_percent || preview?.yieldPercent,
        yield_usable_qty:
          values.yield_choice === 'all' ? null : values.yield_usable_qty,
        vendor_items: vendorItems,
      };
      delete payload.yield_choice;
      delete payload.cost_per_standardized_unit;
      await saveIngredient(payload, editingIngredient);
      onSaved?.();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error || 'Failed to save ingredient');
    } finally {
      setSaving(false);
    }
  };

  const addCategoryOption = () => {
    const value = newCategory.trim();
    if (!value) return;
    form.setFieldValue('category', value);
    setNewCategory('');
  };

  return (
    <Modal
      title={
        editingIngredient
          ? 'Edit ingredient'
          : 'Manually enter your ingredient in 5 easy steps'
      }
      open={open}
      onCancel={onCancel}
      width={760}
      destroyOnClose
      footer={
        <div className="flex justify-between">
          <Button onClick={onCancel}>Cancel</Button>
          <Space>
            {step > 0 ? <Button onClick={() => setStep(step - 1)}>Back</Button> : null}
            {step < 4 ? (
              <Button type="primary" className="!bg-[#FF8132] border-none" onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button
                type="primary"
                className="!bg-[#FF8132] border-none"
                loading={saving}
                onClick={handleSave}
              >
                Save ingredient
              </Button>
            )}
          </Space>
        </div>
      }
    >
      <Steps
        className="mb-6"
        size="small"
        current={step}
        items={[
          { title: 'Details' },
          { title: 'Purchase' },
          { title: 'Package' },
          { title: 'Recipe' },
          { title: 'Yield' },
        ]}
      />
      <Form form={form} layout="vertical">
        <div className={step === 0 ? 'block' : 'hidden'}>
          <Form.Item
            name="category"
            label={<LabelWithTip text="Category" tip={HOVER_TIPS.category} />}
            rules={[{ required: true, message: 'Select or add a category' }]}
          >
            <Select
              showSearch
              placeholder="Example: Produce"
              options={categoryOptions}
              optionFilterProp="label"
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider className="my-2" />
                  <Space className="px-2 pb-2">
                    <Input
                      placeholder="New category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onPressEnter={addCategoryOption}
                    />
                    <Button icon={<PlusOutlined />} onClick={addCategoryOption}>
                      Add
                    </Button>
                  </Space>
                </>
              )}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label={<LabelWithTip text="Ingredient name" tip={HOVER_TIPS.name} />}
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <AutoComplete
              placeholder="Romaine Lettuce"
              options={nameMatches.map((item) => ({
                value: item.name,
                label: `${item.name}${item.category ? ` · ${item.category}` : ''}`,
              }))}
              filterOption={false}
            />
          </Form.Item>
          {nameMatches.length > 0 && !editingIngredient ? (
            <Alert
              className="mb-4"
              type="warning"
              showIcon
              message="Possible existing ingredient"
              description={
                <div className="space-y-1">
                  {nameMatches.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between gap-2">
                      <span>
                        {item.name}
                        {item.category ? ` · ${item.category}` : ''}
                      </span>
                      <Button
                        size="small"
                        type="link"
                        onClick={() => onSaved?.({ useExisting: item })}
                      >
                        Use this instead
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 m-0">
                    Continue if this is truly a different ingredient.
                  </p>
                </div>
              }
            />
          ) : null}
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="vendor"
                label={<LabelWithTip text="Vendor" tip={HOVER_TIPS.vendor} />}
              >
                <Select
                  allowClear
                  showSearch
                  placeholder="Example: Sysco"
                  options={vendorOptions}
                  optionFilterProp="label"
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider className="my-2" />
                      <Space className="px-2 pb-2">
                        <Input
                          placeholder="New vendor"
                          value={newVendorName}
                          onChange={(e) => setNewVendorName(e.target.value)}
                          onPressEnter={handleAddVendor}
                        />
                        <Button
                          icon={<PlusOutlined />}
                          loading={addingVendor}
                          onClick={handleAddVendor}
                        >
                          Add
                        </Button>
                      </Space>
                    </>
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="vendor_item_number"
                label={<LabelWithTip text="Vendor item number" tip={HOVER_TIPS.vendor_item_number} />}
              >
                <Input placeholder="Optional SKU" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="is_catch_weight"
            label={<LabelWithTip text="Catch weight" tip={HOVER_TIPS.catch_weight} />}
            initialValue={false}
          >
            <Select
              options={[
                { value: false, label: 'No' },
                { value: true, label: 'Yes — weight changes each delivery' },
              ]}
            />
          </Form.Item>
          {watched.is_catch_weight ? (
            <Alert
              className="mb-3"
              type="info"
              showIcon
              message="Catch-weight items use the actual invoice weight and cost each delivery. Package size below is only a typical reference."
            />
          ) : null}
          <div className="mb-2">
            <Button
              size="small"
              onClick={() =>
                setExtraSkus((rows) => [...rows, { vendor: undefined, vendor_item_number: '' }])
              }
            >
              Add another vendor / item number
            </Button>
          </div>
          {extraSkus.map((row, index) => (
            <Row gutter={12} key={`sku-${index}`} className="mb-2">
              <Col span={11}>
                <Select
                  allowClear
                  showSearch
                  className="w-full"
                  placeholder="Vendor"
                  options={vendorOptions}
                  optionFilterProp="label"
                  value={row.vendor}
                  onChange={(val) => {
                    const next = [...extraSkus];
                    next[index] = { ...row, vendor: val };
                    setExtraSkus(next);
                  }}
                />
              </Col>
              <Col span={11}>
                <Input
                  placeholder="Item number"
                  value={row.vendor_item_number}
                  onChange={(e) => {
                    const next = [...extraSkus];
                    next[index] = { ...row, vendor_item_number: e.target.value };
                    setExtraSkus(next);
                  }}
                />
              </Col>
              <Col span={2}>
                <Button
                  type="link"
                  danger
                  onClick={() => setExtraSkus(extraSkus.filter((_, i) => i !== index))}
                >
                  ×
                </Button>
              </Col>
            </Row>
          ))}
        </div>

        <div className={step === 1 ? 'block' : 'hidden'}>
          <p className="text-gray-600 mb-4">How do I buy it?</p>
          <Form.Item
            name="purchase_unit_label"
            label={<LabelWithTip text="I purchase it by" tip={HOVER_TIPS.purchase_by} />}
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select options={PURCHASE_BY_OPTIONS} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="purchase_pack_qty"
                label={
                  <LabelWithTip
                    text={`How many ${purchaseLabel === 'each' ? 'did you purchase' : 'cases did you purchase'}?`}
                    tip={HOVER_TIPS.pack_qty}
                  />
                }
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber className="w-full" min={0} step={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="purchase_total_cost"
                label={
                  <LabelWithTip
                    text={`Price for 1 ${purchaseLabel}`}
                    tip={HOVER_TIPS.price}
                  />
                }
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber className="w-full" min={0} step={0.01} precision={2} prefix="$" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div className={step === 2 ? 'block' : 'hidden'}>
          <p className="text-gray-600 mb-4">What is inside it?</p>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="purchase_inner_pack_qty"
                label={
                  <LabelWithTip
                    text={`Each ${purchaseLabel} contains`}
                    tip={HOVER_TIPS.inner_qty}
                  />
                }
              >
                <InputNumber className="w-full" min={0} step={1} placeholder="6" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="purchase_inner_pack_type"
                label={<LabelWithTip text="Package type" tip={HOVER_TIPS.package_type} />}
              >
                <Select allowClear options={PACKAGE_TYPE_OPTIONS} placeholder="Bags, cans…" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="purchase_contents_qty"
                label={
                  <LabelWithTip
                    text={`Each ${packageLabel} contains`}
                    tip={HOVER_TIPS.contents_qty}
                  />
                }
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber className="w-full" min={0} step={0.1} placeholder="2" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="purchase_contents_unit"
                label={<LabelWithTip text="Unit of measure" tip={HOVER_TIPS.contents_unit} />}
                rules={[{ required: true, message: 'Required' }]}
              >
                <Select
                  options={CONTENTS_UNIT_OPTIONS}
                  onChange={(unit) => {
                    form.setFieldValue('standardized_unit', suggestedRecipeUnit(unit));
                    if (!form.getFieldValue('yield_usable_unit')) {
                      form.setFieldValue('yield_usable_unit', unit);
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div className={step === 3 ? 'block' : 'hidden'}>
          <p className="text-gray-600 mb-4">How do I use it in recipes?</p>
          <Form.Item
            name="standardized_unit"
            label={
              <LabelWithTip
                text="I use this ingredient in recipes by"
                tip={HOVER_TIPS.recipe_unit}
              />
            }
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select options={RECIPE_UNIT_OPTIONS} />
          </Form.Item>
          {preview ? (
            <Alert
              type="success"
              showIcon
              message={
                watched.purchase_inner_pack_qty
                  ? `${formatQty(preview.pack)} ${preview.purchaseLabel} = ${formatQty(preview.inner)} ${preview.packageType || 'packages'} = ${formatQty(preview.totalContents)} ${preview.contentsUnit} = ${formatQty(preview.purchased)} ${preview.recipeUnit}`
                  : `${formatQty(preview.pack)} ${preview.purchaseLabel} = ${formatQty(preview.totalContents)} ${preview.contentsUnit} = ${formatQty(preview.purchased)} ${preview.recipeUnit}`
              }
              description={`Cost before prep = $${Number(preview.cost).toFixed(2)} / ${formatQty(preview.purchased)} ${preview.recipeUnit} = $${preview.costBeforePrep.toFixed(4)} per ${preview.recipeUnit}`}
            />
          ) : (
            <Alert type="info" showIcon message="Enter package contents and price to see the conversion." />
          )}
        </div>

        <div className={step === 4 ? 'block' : 'hidden'}>
          <p className="text-gray-600 mb-4">How much is actually usable?</p>
          <Form.Item
            name="yield_choice"
            label={<LabelWithTip text="Do you use all of this product?" tip={HOVER_TIPS.use_all} />}
            rules={[{ required: true, message: 'Please choose one' }]}
          >
            <Radio.Group
              className="flex flex-col gap-2"
              onChange={(e) => {
                if (e.target.value === 'all') {
                  form.setFieldsValue({ yield_percent: 100, yield_usable_qty: null });
                  setLioNote('');
                }
                if (e.target.value === 'lio') handleLioEstimate();
              }}
            >
              <Radio value="all">Yes, I use all of it</Radio>
              <Radio value="lost">No, some is lost during prep</Radio>
              <Radio value="lio">Let LIO estimate it</Radio>
            </Radio.Group>
          </Form.Item>

          {watched.yield_choice === 'lost' ? (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  name="yield_usable_qty"
                  label={
                    <LabelWithTip
                      text={`After draining or prep, how much of each ${packageLabel} is actually usable?`}
                      tip={HOVER_TIPS.usable_amount}
                    />
                  }
                  rules={[{ required: true, message: 'Enter the usable amount' }]}
                >
                  <InputNumber className="w-full" min={0} step={0.1} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="yield_usable_unit" label="Unit">
                  <Select options={CONTENTS_UNIT_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
          ) : null}

          {watched.yield_choice === 'lio' ? (
            <div className="mb-4">
              <Alert
                type="warning"
                showIcon
                message={<LabelWithTip text="LIO estimate" tip={HOVER_TIPS.lio} />}
                description={
                  lioNote ||
                  'LIO will estimate the usable amount. Confirm later to improve the Confidence Score.'
                }
              />
              <Button className="mt-2" loading={estimating} onClick={handleLioEstimate}>
                Recalculate LIO estimate
              </Button>
            </div>
          ) : null}

          <Button
            type="link"
            className="px-0"
            onClick={() => form.setFieldValue('yield_choice', 'percent')}
          >
            Know your yield percentage? Enter it instead.
          </Button>
          {watched.yield_choice === 'percent' ? (
            <Form.Item
              name="yield_percent"
              label={<LabelWithTip text="Usable yield %" tip={HOVER_TIPS.yield_percent} />}
              rules={[{ required: true, message: 'Enter yield %' }]}
            >
              <InputNumber className="w-full" min={1} max={100} step={0.1} />
            </Form.Item>
          ) : null}

          {preview?.yieldPercent != null ? (
            <Alert
              className="mt-3"
              type="success"
              showIcon
              message={`Usable yield: ${preview.yieldPercent.toFixed(1)}% | ${formatQty(preview.purchased)} ${preview.recipeUnit} purchased → ${formatQty(preview.usable)} ${preview.recipeUnit} usable`}
              description={
                preview.costUsable != null
                  ? `True usable cost: $${Number(preview.cost).toFixed(2)} / ${formatQty(preview.usable)} ${preview.recipeUnit} = $${preview.costUsable.toFixed(4)} per usable ${preview.recipeUnit}`
                  : null
              }
            />
          ) : null}
        </div>
      </Form>
    </Modal>
  );
};

export default IngredientEntryModal;
