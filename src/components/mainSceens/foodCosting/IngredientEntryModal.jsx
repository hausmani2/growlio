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
  Row,
  Select,
  Space,
  Steps,
  Tag,
  Tooltip,
  message,
} from 'antd';
import {
  CalculatorOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  PercentageOutlined,
  PlusOutlined,
  ProfileOutlined,
  ShoppingCartOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  createVendor,
  estimateIngredientYield,
  fetchIngredients,
} from '../../../services/foodCostingApi';

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

const PACKAGE_WORDS = {
  bag: { one: 'bag', many: 'bags' },
  can: { one: 'can', many: 'cans' },
  bottle: { one: 'bottle', many: 'bottles' },
  container: { one: 'container', many: 'containers' },
  jar: { one: 'jar', many: 'jars' },
  box: { one: 'box', many: 'boxes' },
  carton: { one: 'carton', many: 'cartons' },
  jug: { one: 'jug', many: 'jugs' },
  pouch: { one: 'pouch', many: 'pouches' },
  tub: { one: 'tub', many: 'tubs' },
  tray: { one: 'tray', many: 'trays' },
  each: { one: 'each', many: 'each' },
};

const CONTENTS_UNIT_OPTIONS = [
  { value: 'oz', label: 'Oz' },
  { value: 'lb', label: 'Pounds' },
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
  { value: 'oz', label: 'Ounces' },
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
  purchase_by: 'Select how you buy this ingredient: Case or Each.',
  pack_qty: 'Enter how many cases or eaches you purchased. Example: 1.',
  price: 'Enter the price for one purchase unit. Example: $41.00 for 1 case.',
  inner_qty: 'Enter how many packages are inside one purchase unit, then choose the package type. Example: 6 bags in a case.',
  package_type: 'Select the package type inside the purchase unit, such as bags, cans, or bottles.',
  contents_qty:
    'Enter how much product is in each package, then choose the unit. Example: 2 pounds per bag.',
  contents_unit: 'Select the measurement for the amount above, such as Oz, lb, g, kg, Cup, Pint, Gal, mL, L, or Each.',
  recipe_unit:
    'Select how you measure this ingredient in recipes. Growlio converts the purchase pack and shows cost per recipe unit.',
  use_all:
    'Yield is asked for every ingredient so draining, trim, peel, and cook loss are never missed. Choose whether you use the whole product.',
  usable_amount:
    'Enter how much remains after draining or prep — not a percentage. Example: a 72 oz can of chickpeas produces 60 oz after draining.',
  lio: 'LIO estimates usable amount from the ingredient. The estimate is marked so it can affect Confidence Score until you confirm it later.',
  yield_percent: 'Optional. Enter a known yield percentage only if you already know it. This is not the main workflow.',
};

const LabelWithTip = ({ text, tip }) => (
  <span className="inline-flex items-center gap-1">
    {text}
    <Tooltip title={tip}>
      <InfoCircleOutlined className="text-gray-400" />
    </Tooltip>
  </span>
);

const QtyUnitRow = ({
  qtyName,
  unitName,
  qtyProps = {},
  unitProps = {},
  required = false,
}) => (
  <div className="grid w-full grid-cols-2 gap-3">
    <Form.Item
      name={qtyName}
      className="mb-0"
      rules={required ? [{ required: true, message: 'Required' }] : undefined}
    >
      <InputNumber className="w-full" style={{ width: '100%' }} {...qtyProps} />
    </Form.Item>
    <Form.Item
      name={unitName}
      className="mb-0"
      rules={required ? [{ required: true, message: 'Required' }] : undefined}
    >
      <Select className="w-full" {...unitProps} />
    </Form.Item>
  </div>
);

const packageWord = (type, qty = 1) => {
  const words = PACKAGE_WORDS[type];
  if (!words) return Number(qty) === 1 ? 'package' : 'packages';
  return Number(qty) === 1 ? words.one : words.many;
};

const innerNoun = (type, qty = 1) => {
  if (!type || type === 'each') return Number(qty) === 1 ? 'unit' : 'units';
  return packageWord(type, qty);
};

const purchaseNoun = (unit, qty = 1) => {
  if (unit === 'each') return 'each';
  return Number(qty) === 1 ? 'case' : 'cases';
};

const normalizeUnit = (unit) => String(unit || '').trim().toLowerCase().replace('.', '');

const WEIGHT_TO_OZ = {
  oz: 1,
  ounce: 1,
  ounces: 1,
  lb: 16,
  lbs: 16,
  pound: 16,
  pounds: 16,
  g: 0.03527396,
  gram: 0.03527396,
  grams: 0.03527396,
  kg: 35.27396,
  kilogram: 35.27396,
  kilograms: 35.27396,
};

const convertUnits = (qty, fromUnit, toUnit) => {
  const amount = Number(qty);
  if (!(amount >= 0) || Number.isNaN(amount)) return null;
  const src = normalizeUnit(fromUnit);
  const dst = normalizeUnit(toUnit);
  if (!src || !dst) return null;
  if (src === dst) return amount;
  if (WEIGHT_TO_OZ[src] != null && WEIGHT_TO_OZ[dst] != null) {
    return (amount * WEIGHT_TO_OZ[src]) / WEIGHT_TO_OZ[dst];
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
  if (Math.abs(n - Math.round(n)) < 0.0005) return String(Math.round(n));
  return n.toFixed(n < 10 ? 2 : 1).replace(/\.0+$/, '');
};

const formatMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0.00';
  return `$${n.toFixed(2)}`;
};

const unitShortLabel = (unit) => {
  const raw = normalizeUnit(unit);
  const labels = {
    oz: 'oz',
    ounce: 'oz',
    ounces: 'oz',
    lb: 'lb',
    lbs: 'lb',
    pound: 'lb',
    pounds: 'lb',
    g: 'g',
    kg: 'kg',
    cup: 'cup',
    pint: 'pint',
    gal: 'gal',
    ml: 'mL',
    l: 'L',
    each: 'each',
  };
  return labels[raw] || unit || '';
};

const conversionSummary = (preview) => {
  if (!preview) return { chain: '', cost: '' };
  const inner = preview.inner || 1;
  const contentsOne = inner * preview.contents;
  const parts = [`1 ${purchaseNoun(preview.purchaseLabel, 1)}`];
  if (preview.packageType) {
    parts.push(`${formatQty(inner)} ${packageWord(preview.packageType, inner)}`);
  }
  parts.push(`${formatQty(contentsOne)} ${unitShortLabel(preview.contentsUnit)}`);
  if (normalizeUnit(preview.recipeUnit) !== normalizeUnit(preview.contentsUnit)) {
    parts.push(`${formatQty(preview.purchased)} ${unitShortLabel(preview.recipeUnit)}`);
  }
  const recipeLabel = unitShortLabel(preview.recipeUnit);
  const cost = `Cost before prep = ${formatMoney(preview.cost)} / ${formatQty(preview.purchased)} ${recipeLabel} = $${preview.costBeforePrep.toFixed(4)} per ${recipeLabel}`;
  return { chain: parts.join(' = '), cost };
};

const formatYieldPercent = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  if (Math.abs(n - 100) < 0.05) return '100%';
  return `${n.toFixed(1)}%`;
};

const yieldHeadline = (preview, { estimated = false } = {}) => {
  if (!preview || preview.yieldPercent == null) return '';
  const unit = unitShortLabel(preview.recipeUnit);
  const label = estimated ? 'Estimated Usable Yield' : 'Usable Yield';
  return `${label}: ${formatYieldPercent(preview.yieldPercent)} | ${formatQty(preview.purchased)} ${unit} purchased -> ${formatQty(preview.usable)} ${unit} usable`;
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

const tokenize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const tokenScore = (query, name) => {
  const qTokens = tokenize(query);
  const nTokens = tokenize(name);
  if (!qTokens.length || !nTokens.length) return 0;
  const scores = qTokens.map((qt) =>
    Math.max(
      ...nTokens.map((nt) => {
        if (nt === qt) return 1;
        if (nt.includes(qt) || qt.includes(nt)) return 0.88;
        const dist = levenshtein(qt, nt);
        const maxLen = Math.max(qt.length, nt.length) || 1;
        return 1 - dist / maxLen;
      }),
      0
    )
  );
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
};

const similarIngredients = (query, ingredients, category) => {
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 2) return [];
  return ingredients
    .map((item) => {
      const name = String(item.name || '').toLowerCase();
      if (!name) return { item, score: 0 };
      let score = 0;
      if (name === q) score = 1;
      else if (name.startsWith(q) || name.includes(q)) score = 0.92;
      else if (q.includes(name) && name.length >= 3) score = 0.86;
      else {
        const dist = levenshtein(q, name);
        const full = 1 - dist / (Math.max(q.length, name.length) || 1);
        score = Math.max(full, tokenScore(q, name));
      }
      if (category && String(item.category || '') === category) score += 0.05;
      return { item, score };
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
  // Costing is always for 1 purchase unit. Pack qty is how many were bought.
  const totalContents = inner * contents;
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
      usable = inner * usableEach;
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
  [
    'purchase_inner_pack_qty',
    'purchase_inner_pack_type',
    'purchase_contents_qty',
    'purchase_contents_unit',
  ],
  ['standardized_unit'],
  ['yield_choice'],
];

const YIELD_CARDS = [
  {
    value: 'all',
    title: 'Yes, I use all of it',
    description: 'Growlio records 100% usable yield. No extra question is needed.',
    icon: <CheckCircleOutlined className="text-lg text-emerald-600" />,
  },
  {
    value: 'lost',
    title: 'No, some is lost during prep',
    description: 'Enter how much remains after draining, trimming, peeling, or cooking — not a percentage.',
    icon: <ExperimentOutlined className="text-lg text-orange-500" />,
  },
  {
    value: 'lio',
    title: 'Let LIO estimate it',
    description: 'LIO suggests a usable amount. It is clearly marked as an estimate until you confirm it later.',
    icon: <ThunderboltOutlined className="text-lg text-[#FF8132]" />,
  },
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
  const [watched, setWatched] = useState({});
  const [nameQuery, setNameQuery] = useState('');
  const [catalogIngredients, setCatalogIngredients] = useState([]);

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
      similarIngredients(
        nameQuery || watched.name,
        catalogIngredients.length ? catalogIngredients : ingredients,
        watched.category
      ).filter((item) => !editingIngredient || item.id !== editingIngredient.id),
    [
      nameQuery,
      watched.name,
      watched.category,
      catalogIngredients,
      ingredients,
      editingIngredient,
    ]
  );

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    fetchIngredients({ ordering: 'name' })
      .then((data) => {
        if (!cancelled) setCatalogIngredients(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCatalogIngredients(ingredients);
      });
    return () => {
      cancelled = true;
    };
  }, [open, ingredients]);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setLioNote('');
    setNewCategory('');
    setNewVendorName('');
    setNameQuery('');
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
    setWatched(form.getFieldsValue(true));
    setNameQuery(form.getFieldValue('name') || '');
  }, [open, editingIngredient, form]);

  const purchaseBy = watched.purchase_unit_label === 'each' ? 'each' : 'case';
  const innerType = watched.purchase_inner_pack_type || '';
  const innerLabel = innerNoun(innerType, 1);
  const purchaseContainsLabel =
    purchaseBy === 'each' ? 'Each unit contains' : 'Each case contains';
  const packContainsLabel = `Each ${innerLabel} contains`;
  const conversion = conversionSummary(preview);

  const applyExistingIngredient = (item) => {
    onSaved?.({ useExisting: item });
  };

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
      const values = form.getFieldsValue(true);
      const result = await estimateIngredientYield({
        name: values.name,
        contents_qty: values.purchase_contents_qty,
        contents_unit: values.purchase_contents_unit,
        inner_pack_qty: values.purchase_inner_pack_qty,
        package_type: values.purchase_inner_pack_type,
      });
      form.setFieldsValue({
        yield_choice: 'lio',
        yield_usable_qty: result.yield_usable_qty,
        yield_usable_unit: result.yield_usable_unit || values.purchase_contents_unit,
        yield_percent: result.yield_percent,
      });
      setLioNote(
        result.note ||
          'LIO estimated the usable amount. Confirm later to improve the Confidence Score.'
      );
      setWatched(form.getFieldsValue(true));
    } catch (error) {
      message.error(error?.response?.data?.error || 'Could not estimate yield');
    } finally {
      setEstimating(false);
    }
  };

  const selectYieldChoice = (value) => {
    const patch = { yield_choice: value };
    if (value === 'all') {
      patch.yield_percent = 100;
      patch.yield_usable_qty = null;
      setLioNote('');
    }
    if (value === 'lost') {
      patch.yield_usable_unit =
        form.getFieldValue('yield_usable_unit') ||
        form.getFieldValue('purchase_contents_unit') ||
        'oz';
      setLioNote('');
    }
    form.setFieldsValue(patch);
    setWatched(form.getFieldsValue(true));
    if (value === 'lio') handleLioEstimate();
  };

  const handleSave = async () => {
    try {
      await form.validateFields(STEP_FIELDS[4]);
      const values = form.getFieldsValue(true);
      if (!values.yield_choice) {
        message.error('Please choose whether you use all of this product');
        return;
      }
      if (values.yield_choice === 'lost' && !(Number(values.yield_usable_qty) > 0)) {
        message.error('Enter how much of each package is actually usable after prep');
        return;
      }
      if (values.yield_choice === 'percent' && !(Number(values.yield_percent) > 0)) {
        message.error('Enter the yield percentage');
        return;
      }
      if (
        values.yield_choice === 'lio' &&
        !(Number(values.yield_usable_qty) > 0) &&
        !(Number(values.yield_percent) > 0)
      ) {
        message.error('Wait for the LIO estimate, or choose another option');
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
      width={820}
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
        className="mb-8 ingredient-entry-steps"
        size="small"
        current={step}
        labelPlacement="vertical"
        items={[
          { title: 'Item Details', icon: <ProfileOutlined /> },
          { title: 'Purchase Information', icon: <ShoppingCartOutlined /> },
          { title: 'Package Information', icon: <InboxOutlined /> },
          { title: 'Recipe Costing', icon: <CalculatorOutlined /> },
          { title: 'Usable Yield', icon: <PercentageOutlined /> },
        ]}
      />
      <Form
        form={form}
        layout="vertical"
        onValuesChange={(changed, allValues) => {
          setWatched(allValues);
          if (Object.prototype.hasOwnProperty.call(changed, 'name')) {
            setNameQuery(changed.name || '');
          }
        }}
      >
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
            label={<LabelWithTip text="Ingredient Name" tip={HOVER_TIPS.name} />}
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <AutoComplete
              placeholder="Start typing, e.g. Mozzeralla Cheese"
              options={nameMatches.map((item) => ({
                value: item.name,
                label: `${item.name}${item.category ? ` · ${item.category}` : ''}`,
              }))}
              filterOption={false}
              defaultActiveFirstOption={false}
              onSearch={setNameQuery}
              notFoundContent={
                String(nameQuery || watched.name || '').trim().length >= 2
                  ? 'No similar ingredients found. You can create this as new.'
                  : null
              }
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
                        onClick={() => applyExistingIngredient(item)}
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
          <p className="text-gray-600 mb-4">Purchase Information</p>
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
                    text={
                      purchaseBy === 'each'
                        ? 'How many did you purchase?'
                        : 'How many cases did you purchase?'
                    }
                    tip={HOVER_TIPS.pack_qty}
                  />
                }
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber className="w-full" min={1} step={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="purchase_total_cost"
                label={
                  <LabelWithTip
                    text={`Price for 1 ${purchaseNoun(purchaseBy, 1)}`}
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
          <p className="text-gray-600 mb-4">Package Information</p>
          <Form.Item
            label={<LabelWithTip text={purchaseContainsLabel} tip={HOVER_TIPS.inner_qty} />}
            required
          >
            <QtyUnitRow
              qtyName="purchase_inner_pack_qty"
              unitName="purchase_inner_pack_type"
              required
              qtyProps={{ min: 0, step: 1, placeholder: '6' }}
              unitProps={{ options: PACKAGE_TYPE_OPTIONS, placeholder: 'Bags' }}
            />
          </Form.Item>
          <Form.Item
            label={<LabelWithTip text={packContainsLabel} tip={HOVER_TIPS.contents_qty} />}
            required
          >
            <QtyUnitRow
              qtyName="purchase_contents_qty"
              unitName="purchase_contents_unit"
              required
              qtyProps={{ min: 0, step: 0.1, placeholder: '2' }}
              unitProps={{
                options: CONTENTS_UNIT_OPTIONS,
                onChange: (unit) => {
                  form.setFieldValue('standardized_unit', suggestedRecipeUnit(unit));
                  if (!form.getFieldValue('yield_usable_unit')) {
                    form.setFieldValue('yield_usable_unit', unit);
                  }
                },
              }}
            />
          </Form.Item>
        </div>

        <div className={step === 3 ? 'block' : 'hidden'}>
          <p className="text-gray-600 mb-4">Recipe Costing</p>
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
          {preview && conversion.chain ? (
            <Alert
              type="success"
              showIcon
              message={conversion.chain}
              description={conversion.cost}
            />
          ) : (
            <Alert
              type="info"
              showIcon
              message="Enter package contents and price to see the conversion."
            />
          )}
        </div>

        <div className={step === 4 ? 'block' : 'hidden'}>
          <p className="text-gray-600 mb-1">Usable Yield</p>
          <p className="text-gray-500 text-sm mb-4">
            Asked for every ingredient so draining, trim, peel, and cook loss are never missed.
            Growlio does not ask for a yield percentage first.
          </p>
          <Form.Item
            name="yield_choice"
            label={<LabelWithTip text="Do you use all of this product?" tip={HOVER_TIPS.use_all} />}
            rules={[{ required: true, message: 'Please choose one' }]}
          >
            <div className="grid gap-3 md:grid-cols-3">
              {YIELD_CARDS.map((card) => {
                const selected = watched.yield_choice === card.value;
                return (
                  <button
                    key={card.value}
                    type="button"
                    onClick={() => selectYieldChoice(card.value)}
                    className={`text-left rounded-lg border p-3 transition ${
                      selected
                        ? 'border-[#FF8132] bg-orange-50'
                        : 'border-gray-200 hover:border-[#FF8132]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-gray-800">
                      {card.icon}
                      {card.title}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 mb-0">{card.description}</p>
                  </button>
                );
              })}
            </div>
          </Form.Item>

          {watched.yield_choice === 'all' && preview?.yieldPercent != null ? (
            <Alert
              type="success"
              showIcon
              message={yieldHeadline(preview)}
              description="Growlio is using 100% usable yield for costing. No further yield question is needed."
            />
          ) : null}

          {watched.yield_choice === 'lost' ? (
            <Form.Item
              label={
                <LabelWithTip
                  text={`After draining or prep, how much of each ${innerLabel} is actually usable?`}
                  tip={HOVER_TIPS.usable_amount}
                />
              }
              extra="Example: A 72 oz can of chickpeas produces 60 oz after draining."
              required
            >
              <QtyUnitRow
                qtyName="yield_usable_qty"
                unitName="yield_usable_unit"
                required
                qtyProps={{ min: 0, step: 0.1, placeholder: '60' }}
                unitProps={{ options: CONTENTS_UNIT_OPTIONS }}
              />
            </Form.Item>
          ) : null}

          {watched.yield_choice === 'lost' && preview?.yieldPercent != null ? (
            <Alert
              className="mb-3"
              type="success"
              showIcon
              message={yieldHeadline(preview)}
              description={
                Number(watched.yield_usable_qty) > 0 && Number(watched.purchase_contents_qty) > 0
                  ? `Growlio calculates: ${formatQty(watched.yield_usable_qty)} / ${formatQty(watched.purchase_contents_qty)} ${unitShortLabel(watched.yield_usable_unit || watched.purchase_contents_unit)} = ${formatYieldPercent(preview.yieldPercent)} usable yield.`
                  : null
              }
            />
          ) : null}

          {watched.yield_choice === 'lio' ? (
            <div className="mb-4">
              <Alert
                type="warning"
                showIcon
                message={
                  <span className="inline-flex items-center gap-2">
                    <LabelWithTip text="LIO estimate" tip={HOVER_TIPS.lio} />
                    <Tag color="orange">LIO estimate</Tag>
                  </span>
                }
                description={
                  <div>
                    <p className="mb-2">
                      {lioNote ||
                        (estimating
                          ? 'LIO is estimating the usable amount…'
                          : 'LIO will estimate the usable amount from this ingredient.')}
                    </p>
                    {Number(watched.yield_usable_qty) > 0 ? (
                      <p className="mb-2">
                        Estimated usable amount: {formatQty(watched.yield_usable_qty)}{' '}
                        {unitShortLabel(watched.yield_usable_unit || watched.purchase_contents_unit)} per{' '}
                        {innerLabel}.
                      </p>
                    ) : null}
                    {preview?.yieldPercent != null ? (
                      <p className="mb-2 font-medium">{yieldHeadline(preview, { estimated: true })}</p>
                    ) : null}
                    <p className="mb-0 text-xs">
                      This is a LIO estimate. Confirm the actual usable amount later to improve the
                      Confidence Score.
                    </p>
                  </div>
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
            onClick={() => {
              form.setFieldValue('yield_choice', 'percent');
              setWatched(form.getFieldsValue(true));
            }}
          >
            Know your yield percentage? Enter it instead.
          </Button>
          {watched.yield_choice === 'percent' ? (
            <Form.Item
              name="yield_percent"
              label={<LabelWithTip text="Usable yield %" tip={HOVER_TIPS.yield_percent} />}
              extra="Optional for experienced users. The main workflow is to enter a usable amount."
              rules={[{ required: true, message: 'Enter yield %' }]}
            >
              <InputNumber className="w-full" min={1} max={100} step={0.1} />
            </Form.Item>
          ) : null}

          {watched.yield_choice === 'percent' && preview?.yieldPercent != null ? (
            <Alert
              className="mt-3"
              type="success"
              showIcon
              message={yieldHeadline(preview)}
              description={
                preview.costUsable != null
                  ? `True usable cost: ${formatMoney(preview.cost)} / ${formatQty(preview.usable)} ${unitShortLabel(preview.recipeUnit)} = $${preview.costUsable.toFixed(4)} per usable ${unitShortLabel(preview.recipeUnit)}`
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
