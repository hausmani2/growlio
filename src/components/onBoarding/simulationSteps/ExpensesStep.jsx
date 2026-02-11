import React, { useState, useEffect, useMemo } from 'react';
import { Select, InputNumber, Switch, Button, Modal, Input, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { DEFAULT_EXPENSES, EXPENSE_CATEGORIES, formatExpenseForAPI, calculateMonthlyCost, calculateWeeklyCost } from '../../../utils/simulationUtils';

const { Option } = Select;

const ExpensesStep = ({ data, updateData, onNext, onBack }) => {
  // Initialize with default expenses if no data provided, or merge with existing data
  const [expenses, setExpenses] = useState(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      return data;
    }
    return DEFAULT_EXPENSES;
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalForm, setModalForm] = useState({
    category: '',
    name: '',
    is_value_type: true,
    amount: 0,
    fixed_expense_type: 'MONTHLY',
    is_active: true
  });

  useEffect(() => {
    updateData(expenses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses]);

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const grouped = {};
    expenses.forEach(expense => {
      if (!grouped[expense.category]) {
        grouped[expense.category] = [];
      }
      grouped[expense.category].push(expense);
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
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleExpenseActive = (index) => {
    updateExpense(index, 'is_active', !expenses[index].is_active);
  };

  const toggleValueType = (index) => {
    updateExpense(index, 'is_value_type', !expenses[index].is_value_type);
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
      amount: parseFloat(modalForm.amount) || 0
    };

    setExpenses(prev => [...prev, newExpense]);
    handleModalCancel();
    message.success('Expense added successfully');
  };

  const deleteExpense = (index) => {
    setExpenses(prev => prev.filter((_, i) => i !== index));
    message.success('Expense removed');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Expenses</h2>
        <p className="text-gray-600">
          Manage your restaurant expenses. Toggle each expense as active/inactive, set as percentage or value, and choose monthly or weekly.
          By default, all expenses are turned on and expense amounts are estimates and may not reflect current costs.
        </p>
      </div>

      {/* Totals Summary */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Monthly Cost</p>
            <p className="text-2xl font-bold text-orange-600">
              ${totals.monthly.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Weekly Cost</p>
            <p className="text-2xl font-bold text-orange-600">
              ${totals.weekly.toFixed(2)}
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
              {categoryExpenses.map((expense, index) => {
                const globalIndex = expenses.findIndex(e => 
                  e.category === expense.category && 
                  e.name === expense.name
                );
                
                return (
                  <ExpenseRow
                    key={`${expense.category}-${expense.name}-${globalIndex}`}
                    expense={expense}
                    index={globalIndex}
                    onToggleActive={() => toggleExpenseActive(globalIndex)}
                    onToggleValueType={() => toggleValueType(globalIndex)}
                    onToggleExpenseType={() => toggleExpenseType(globalIndex)}
                    onUpdateAmount={(value) => updateExpense(globalIndex, 'amount', value)}
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
                onChange={(checked) => setModalForm(prev => ({ ...prev, is_value_type: checked }))}
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
  onToggleActive, 
  onToggleValueType, 
  onToggleExpenseType, 
  onUpdateAmount,
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