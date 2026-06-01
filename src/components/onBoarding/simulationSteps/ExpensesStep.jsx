import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Select, InputNumber, Switch, Button, Modal, Input, message } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { DEFAULT_EXPENSES, EXPENSE_CATEGORIES, formatExpenseForAPI, calculateMonthlyCost, calculateWeeklyCost } from '../../../utils/simulationUtils';
import { formatCurrency } from '../../../utils/formatUtils';

const { Option } = Select;

const ADVERTISING_MARKETING_NAMES = new Set([
  'advertising and marketing',
  'advertising & marketing'
]);
const ADVERTISING_PROMOTION_CATEGORY = 'Advertising and Promotion';
const ADVERTISING_MARKETING_NAME = 'Advertising and Marketing';

const isAdvertisingMarketingExpense = (expense) => (
  ADVERTISING_MARKETING_NAMES.has(String(expense?.name || '').trim().toLowerCase())
);

const getExpenseKey = (expense) => (
  `${String(expense?.category || '').trim().toLowerCase()}::${
    isAdvertisingMarketingExpense(expense)
      ? ADVERTISING_MARKETING_NAME.toLowerCase()
      : String(expense?.name || '').trim().toLowerCase()
  }`
);

const normalizeRequiredExpense = (expense) => {
  if (!isAdvertisingMarketingExpense(expense)) return expense;

  return {
    ...expense,
    name: ADVERTISING_MARKETING_NAME,
    category: ADVERTISING_PROMOTION_CATEGORY,
    is_value_type: true,
    amount: 500,
    fixed_expense_type: 'MONTHLY',
  };
};

const getRequiredDefaultExpenses = () => (
  DEFAULT_EXPENSES.filter(isAdvertisingMarketingExpense)
);

const mergeRequiredDefaultExpenses = (expenses) => {
  const current = Array.isArray(expenses) ? expenses.map(normalizeRequiredExpense) : [];
  const existingKeys = new Set(current.map(getExpenseKey));
  const missing = getRequiredDefaultExpenses().filter((expense) => !existingKeys.has(getExpenseKey(expense)));

  return missing.length > 0 ? [...current, ...missing] : current;
};

const ExpensesStep = ({ data, updateData, onNext, onBack, isFranchise = false, onInlineSave, isSaving = false }) => {
  // Initialize with default expenses if no data provided, or merge with existing data
  const [expenses, setExpenses] = useState(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      return mergeRequiredDefaultExpenses(data);
    }
    return DEFAULT_EXPENSES;
  });
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isOeTutorialModalVisible, setIsOeTutorialModalVisible] = useState(false);
  const [modalForm, setModalForm] = useState({
    category: '',
    name: '',
    is_value_type: true,
    amount: 0,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  });
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState([]);
  const [isInlineSaveInProgress, setIsInlineSaveInProgress] = useState(false);
  const [hasInitializedSavedSnapshot, setHasInitializedSavedSnapshot] = useState(false);

  // Show the Operating Expenses disclaimer once per session when this step is opened
  useEffect(() => {
    try {
      if (sessionStorage.getItem('simulation_expense_disclaimer_shown_v1') === 'true') return;
      sessionStorage.setItem('simulation_expense_disclaimer_shown_v1', 'true');
    } catch {
      // ignore storage errors (still show on this mount)
    }
    setIsDisclaimerOpen(true);
  }, []);

  const acknowledgeDisclaimer = useCallback(() => {
    try {
      sessionStorage.setItem('simulation_expense_disclaimer_ack_v1', 'true');
    } catch {
      // ignore
    }
    setIsDisclaimerOpen(false);
  }, []);

  const normalizeExpenseAmount = (amount, isValueType) => {
    const raw = Number(amount ?? 0);
    const safe = Number.isFinite(raw) ? raw : 0;
    if (isValueType) return Math.max(0, safe);
    return Math.min(100, Math.max(0, safe));
  };

  // Initialize expenses from data prop when it changes
  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0 && !hasInitialized) {
      setExpenses(mergeRequiredDefaultExpenses(data));
      setHasInitialized(true);
    } else if (!hasInitialized && (!data || !Array.isArray(data) || data.length === 0)) {
      setHasInitialized(true);
    }
  }, [data, hasInitialized]);

  // Handle franchise logic: add/remove royalty and brand fields based on franchise status
  useEffect(() => {
    if (!hasInitialized) return;
    
    setExpenses(prev => {
      const lower = (s) => String(s || "").toLowerCase();
      
      // Find existing royalty and brand fields to preserve their data
      const existingRoyalty = prev.find((e) => lower(e.name).includes("royalty"));
      const existingBrand = prev.find(
        (e) => lower(e.name).includes("brand") || lower(e.name).includes("ad fund")
      );

      let updated = [...prev];

      if (isFranchise) {
        // If franchise is true, ensure royalty and brand fields exist
        // Preserve existing data if it exists, otherwise create new fields
        if (!existingRoyalty) {
          updated.push({
            category: 'Royalty + Ad Fund',
            name: 'Royalty',
            is_value_type: false, // Royalty is typically a percentage
            amount: 0,
            fixed_expense_type: 'MONTHLY',
            is_active: true
          });
        }
        if (!existingBrand) {
          updated.push({
            category: 'Royalty + Ad Fund',
            name: 'Brand/Ad Fund',
            is_value_type: false, // Brand/Ad Fund is typically a percentage
            amount: 0,
            fixed_expense_type: 'MONTHLY',
            is_active: true
          });
        }
      } else {
        // If not franchise, remove royalty and brand fields
        updated = updated.filter(
          (e) => !lower(e.name).includes("royalty") && 
                 !lower(e.name).includes("brand") && 
                 !lower(e.name).includes("ad fund")
        );
      }

      return updated;
    });
  }, [isFranchise, hasInitialized]);

  useEffect(() => {
    updateData(expenses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses]);

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const grouped = {};
    expenses.forEach((expense, index) => {
      if (!grouped[expense.category]) {
        grouped[expense.category] = [];
      }
      grouped[expense.category].push({ expense, index });
    });
    return grouped;
  }, [expenses]);

  // Calculate totals
  const totals = useMemo(() => {
    const monthlyTotal = expenses
      .filter(e => e.is_active)
      .reduce((sum, expense) => sum + calculateMonthlyCost(expense), 0);
    
    const weeklyTotal = expenses
      .filter(e => e.is_active)
      .reduce((sum, expense) => sum + calculateWeeklyCost(expense), 0);

    return {
      monthly: monthlyTotal,
      weekly: weeklyTotal
    };
  }, [expenses]);

  const updateExpense = (index, field, value) => {
    setExpenses(prev => {
      const updated = [...prev];
      const current = updated[index] || {};
      if (field === 'amount') {
        const raw = Number(value ?? 0);
        const safe = Number.isFinite(raw) ? raw : 0;
        const normalized = current.is_value_type ? Math.max(0, safe) : Math.min(100, Math.max(0, safe));
        updated[index] = { ...current, amount: normalized };
      } else if (field === 'is_value_type') {
        const raw = Number(current.amount ?? 0);
        const safe = Number.isFinite(raw) ? raw : 0;
        const normalized = value ? Math.max(0, safe) : Math.min(100, Math.max(0, safe));
        updated[index] = { ...current, is_value_type: value, amount: normalized };
      } else {
        updated[index] = { ...current, [field]: value };
      }
      return updated;
    });
  };

  const toggleExpenseActive = (index) => {
    updateExpense(index, 'is_active', !expenses[index].is_active);
  };

  const toggleValueType = (index, checked) => {
    updateExpense(index, 'is_value_type', checked);
  };

  const toggleExpenseType = (index) => {
    const currentType = expenses[index].fixed_expense_type;
    updateExpense(index, 'fixed_expense_type', currentType === 'MONTHLY' ? 'WEEKLY' : 'MONTHLY');
  };

  const showModal = () => {
    setModalForm({
      category: '',
      name: '',
      is_value_type: true,
      amount: 0,
      fixed_expense_type: 'MONTHLY',
      is_active: true
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setModalForm({
      category: '',
      name: '',
      is_value_type: true,
      amount: 0,
      fixed_expense_type: 'MONTHLY',
      is_active: true
    });
  };

  const handleModalSubmit = () => {
    // Validate
    if (!modalForm.category) {
      message.error('Please select a category');
      return;
    }
    if (!modalForm.name.trim()) {
      message.error('Please enter an expense name');
      return;
    }
    if (modalForm.amount <= 0) {
      message.error('Please enter a valid amount');
      return;
    }

    // Add new expense
    const newExpense = {
      ...modalForm,
      name: modalForm.name.trim(),
      amount: normalizeExpenseAmount(parseFloat(modalForm.amount) || 0, !!modalForm.is_value_type)
    };

    setExpenses(prev => [...prev, newExpense]);
    handleModalCancel();
    message.success('Expense added successfully');
  };

  const deleteExpense = (index) => {
    setExpenses(prev => prev.filter((_, i) => i !== index));
    message.success('Expense removed');
  };

  const getComparableExpense = useCallback((expense) => ({
    category: String(expense?.category || '').trim(),
    name: String(expense?.name || '').trim(),
    amount: Number(parseFloat(expense?.amount || 0).toFixed(2)),
    is_value_type: expense?.is_value_type !== undefined ? expense.is_value_type : true,
    fixed_expense_type: String(expense?.fixed_expense_type || 'MONTHLY').toUpperCase(),
    is_active: expense?.is_active !== undefined ? expense.is_active : true,
  }), []);

  useEffect(() => {
    if (hasInitializedSavedSnapshot) return;
    if (!Array.isArray(expenses) || expenses.length === 0) return;
    setLastSavedSnapshot(expenses.map(getComparableExpense));
    setHasInitializedSavedSnapshot(true);
  }, [expenses, getComparableExpense, hasInitializedSavedSnapshot]);

  const isExpenseDirty = useCallback((index) => {
    const current = expenses[index];
    if (!current) return false;
    const saved = lastSavedSnapshot[index];
    if (!saved) return true;
    return JSON.stringify(getComparableExpense(current)) !== JSON.stringify(saved);
  }, [expenses, getComparableExpense, lastSavedSnapshot]);

  const handleInlineSave = useCallback(async () => {
    if (!onInlineSave || isInlineSaveInProgress || isSaving) return;
    setIsInlineSaveInProgress(true);
    try {
      const saved = await onInlineSave();
      if (saved) {
        setLastSavedSnapshot(expenses.map(getComparableExpense));
      }
    } finally {
      setIsInlineSaveInProgress(false);
    }
  }, [onInlineSave, isInlineSaveInProgress, isSaving, expenses, getComparableExpense]);

  return (
    <div className="space-y-6">
      {/* Operating Expenses Disclaimer (shown once per session on first visit) */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="text-orange-600 font-bold">ℹ️</span>
            <span>Operating Expenses Disclaimer</span>
          </div>
        }
        open={isDisclaimerOpen}
        onCancel={acknowledgeDisclaimer}
        footer={null}
        width={720}
        centered={false}
        destroyOnClose
        maskClosable={false}
        style={{ top: 20 }}
        zIndex={10050}
      >
        <div className="space-y-3">
          <p className="text-gray-800">
            These expenses are preloaded as a guide. The amounts shown are not your actual numbers—replace
            them with your real costs.
          </p>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            <li>Only keep the expenses that apply to your restaurant and turn off anything you don’t use.</li>
            <li>Do not include Labor or Cost of Goods (COGS) here. Growlio calculates those separately.</li>
            <li>Not sure about an expense? Ask LIO for help.</li>
          </ul>
          <div className="pt-3 flex justify-end">
            <button
              type="button"
              onClick={acknowledgeDisclaimer}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>

      {/* Header / description verbiage (matches Operating Expenses page) */}
      <div>
        <h2 className="text-2xl font-bold text-orange-600 mb-2">Expenses</h2>
        <p className="text-gray-600 text-base">
          When running a restaurant, it's important to understand your cost structure—especially when
          calculating your break-even point and managing cash flow.
        </p>
        <p className="text-orange-600 text-base font-medium mt-1">
          Operating Expenses=
          <span className="font-normal text-black">
            {' '}Operating expenses are everything you pay to run the business—except food and labor.
          </span>
        </p>
      </div>

      {/* Tutorial Video Banner (matches Operating Expenses page) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-base text-orange-600">
            Watch a tutorial on{' '}
            <button
              type="button"
              onClick={() => setIsOeTutorialModalVisible(true)}
              className="text-purple-600 hover:text-purple-700 underline decoration-transparent hover:decoration-current transition-colors"
              title="Watch Operating Expenses Tutorial"
            >
              Operating Expenses I Have
            </button>
          </p>
          <button
            onClick={() => setIsOeTutorialModalVisible(true)}
            className="text-blue-600 hover:text-blue-800 transition-colors font-medium text-sm border border-blue-600 rounded-md px-3 py-2"
            title="Watch Operating Expenses Tutorial"
            aria-label="Watch Operating Expenses Tutorial"
            type="button"
          >
            Watch Video
          </button>
        </div>
      </div>

      {/* Tutorial Video Modal */}
      <Modal
        title="Operating Expenses Tutorial"
        open={isOeTutorialModalVisible}
        onCancel={() => setIsOeTutorialModalVisible(false)}
        footer={null}
        width={900}
        centered
        destroyOnClose
      >
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%' }}>
          <iframe
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0
            }}
            src="https://www.youtube.com/embed/XYxZacU_zsk?rel=0"
            title="Operating Expenses Tutorial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Modal>

      {/* Totals Summary */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Monthly Cost</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(totals.monthly)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Weekly Cost</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(totals.weekly)}
            </p>
          </div>
        </div>
      </div>

      {/* Expenses by Category */}
      <div className="space-y-6">
        {Object.entries(expensesByCategory).map(([category, categoryExpenses]) => (
          <div key={category} className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{category}</h3>
            <div className="space-y-3">
              {categoryExpenses.map(({ expense, index: globalIndex }) => {
                return (
                  <ExpenseRow
                    key={`${expense.category}-${expense.name}-${globalIndex}`}
                    expense={expense}
                    index={globalIndex}
                    isDirty={isExpenseDirty(globalIndex)}
                    isSaving={isSaving || isInlineSaveInProgress}
                    onToggleActive={() => toggleExpenseActive(globalIndex)}
                    onToggleValueType={(checked) => toggleValueType(globalIndex, checked)}
                    onToggleExpenseType={() => toggleExpenseType(globalIndex)}
                    onUpdateAmount={(value) => updateExpense(globalIndex, 'amount', value)}
                    onSave={handleInlineSave}
                    onDelete={() => deleteExpense(globalIndex)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Expense Button */}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={showModal}
        className="w-full h-12 text-base"
        size="large"
      >
        Add Custom Expense
      </Button>

      {/* Custom Expense Modal */}
      <Modal
        title="Add Custom Expense"
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleModalCancel}
        okText="Add Expense"
        cancelText="Cancel"
        width={600}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="Select Category"
              value={modalForm.category}
              onChange={(value) => setModalForm(prev => ({ ...prev, category: value }))}
              className="w-full h-11"
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expense Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter expense name"
              value={modalForm.name}
              onChange={(e) => setModalForm(prev => ({ ...prev, name: e.target.value }))}
              className="h-11"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Value Type</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${!modalForm.is_value_type ? 'font-semibold' : 'text-gray-500'}`}>
                Percentage
              </span>
              <Switch
                checked={modalForm.is_value_type}
                onChange={(checked) =>
                  setModalForm(prev => ({
                    ...prev,
                    is_value_type: checked,
                    amount: normalizeExpenseAmount(prev.amount, checked)
                  }))
                }
              />
              <span className={`text-sm ${modalForm.is_value_type ? 'font-semibold' : 'text-gray-500'}`}>
                Value
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Frequency</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${modalForm.fixed_expense_type === 'WEEKLY' ? 'font-semibold' : 'text-gray-500'}`}>
                Weekly
              </span>
              <Switch
                checked={modalForm.fixed_expense_type === 'MONTHLY'}
                onChange={(checked) => setModalForm(prev => ({ 
                  ...prev, 
                  fixed_expense_type: checked ? 'MONTHLY' : 'WEEKLY' 
                }))}
              />
              <span className={`text-sm ${modalForm.fixed_expense_type === 'MONTHLY' ? 'font-semibold' : 'text-gray-500'}`}>
                Monthly
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <InputNumber
              placeholder="0.00"
              value={modalForm.amount}
              onChange={(value) => setModalForm(prev => ({ ...prev, amount: value || 0 }))}
              min={0}
              max={!modalForm.is_value_type ? 100 : undefined}
              step={0.01}
              precision={2}
              className="w-full h-11"
              prefix={modalForm.is_value_type ? "$" : undefined}
              suffix={!modalForm.is_value_type ? "%" : undefined}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Expense Row Component
const ExpenseRow = ({ 
  expense, 
  index, 
  isDirty = false,
  isSaving = false,
  onToggleActive, 
  onToggleValueType, 
  onToggleExpenseType, 
  onUpdateAmount,
  onSave,
  onDelete 
}) => {
  const monthlyCost = calculateMonthlyCost(expense);
  const weeklyCost = calculateWeeklyCost(expense);

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      expense.is_active 
        ? 'border-orange-200 bg-orange-50' 
        : 'border-gray-200 bg-gray-50 opacity-60'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Switch
            checked={expense.is_active}
            onChange={onToggleActive}
            size="small"
          />
          <span className="font-medium text-gray-800">{expense.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="text"
            icon={<SaveOutlined />}
            onClick={onSave}
            size="small"
            disabled={!isDirty || isSaving}
            className={!isDirty || isSaving ? "" : "!text-orange-600 hover:!text-orange-700"}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={onDelete}
            size="small"
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Value Type Toggle */}
        <div className="flex items-center justify-between p-2 bg-white rounded border">
          <span className="text-xs text-gray-600">Type</span>
          <div className="flex items-center gap-1">
            <span className={`text-xs ${!expense.is_value_type ? 'font-semibold text-orange-600' : 'text-gray-400'}`}>
              %
            </span>
            <Switch
              checked={expense.is_value_type}
              onChange={onToggleValueType}
              size="small"
            />
            <span className={`text-xs ${expense.is_value_type ? 'font-semibold text-orange-600' : 'text-gray-400'}`}>
              $
            </span>
          </div>
        </div>

        {/* Frequency Toggle */}
        <div className="flex items-center justify-between p-2 bg-white rounded border">
          <span className="text-xs text-gray-600">Frequency</span>
          <div className="flex items-center gap-1">
            <span className={`text-xs ${expense.fixed_expense_type === 'WEEKLY' ? 'font-semibold text-orange-600' : 'text-gray-400'}`}>
              W
            </span>
            <Switch
              checked={expense.fixed_expense_type === 'MONTHLY'}
              onChange={(checked) => onToggleExpenseType()}
              size="small"
            />
            <span className={`text-xs ${expense.fixed_expense_type === 'MONTHLY' ? 'font-semibold text-orange-600' : 'text-gray-400'}`}>
              M
            </span>
          </div>
        </div>

        {/* Amount Input */}
        <div className="md:col-span-2">
          <InputNumber
            placeholder="0.00"
            value={expense.amount}
            onChange={onUpdateAmount}
            min={0}
            step={0.01}
            precision={2}
            className="w-full h-9"
            prefix={expense.is_value_type ? "$" : undefined}
            suffix={!expense.is_value_type ? "%" : undefined}
            disabled={!expense.is_active}
          />
        </div>
      </div>

      {/* Cost Display */}
      {expense.is_active && expense.amount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Monthly: <strong className="text-orange-600">${monthlyCost.toFixed(2)}</strong></span>
            <span>Weekly: <strong className="text-orange-600">${weeklyCost.toFixed(2)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesStep;
