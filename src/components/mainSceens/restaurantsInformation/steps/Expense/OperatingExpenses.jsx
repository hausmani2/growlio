import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Switch, InputNumber } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import MonthlyWeeklyToggle from "../../../../buttons/MonthlyWeeklyToggle";
import { DEFAULT_EXPENSES, calculateMonthlyCost, calculateWeeklyCost } from "../../../../../utils/simulationUtils";

// Removed COST_TYPES - no longer using fixed/variable distinction

const clampStrAmount = (v) => {
  if (v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return "0";
  return String(v);
};

/**
 * Convert DEFAULT_EXPENSES format to dynamicFixedFields format
 */
const convertDefaultExpensesToFields = (defaultExpenses) => {
  return defaultExpenses.map((expense, index) => ({
    id: Date.now() + index + Math.random(),
    label: expense.name,
    value: expense.amount ? expense.amount.toString() : "0",
    key: `dynamic_expense_${Date.now()}_${index}_${Math.random()}`,
    expense_type: expense.fixed_expense_type === 'MONTHLY' ? 'monthly' : 'weekly',
    is_active: expense.is_active !== undefined ? expense.is_active : true,
    is_value_type: expense.is_value_type !== undefined ? expense.is_value_type : true,
    category: expense.category || 'Other',
  }));
};

/**
 * Single list to manage BOTH fixed + variable costs (as requested).
 * Internally it still updates `dynamicFixedFields` and `dynamicVariableFields`
 * so existing totals + API mapping keep working.
 */
const OperatingExpenses = ({ data, updateData, errors = {}, isFranchise = false }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize with default expenses if no data exists - do this immediately on mount
  useEffect(() => {
    if (hasInitialized) return;
    
    const current = Array.isArray(data.dynamicFixedFields) ? data.dynamicFixedFields : [];
    
    // If array is empty, initialize with default expenses (like ExpensesStep does)
    if (current.length === 0) {
      const defaultFields = convertDefaultExpensesToFields(DEFAULT_EXPENSES);
      updateData("dynamicFixedFields", defaultFields);
      setHasInitialized(true);
      return;
    }
    
    // If we have existing data, ensure all fields have required properties
    const fieldsWithDefaults = current.map(field => ({
      ...field,
      is_active: field.is_active !== undefined ? field.is_active : true,
      is_value_type: field.is_value_type !== undefined ? field.is_value_type : true,
      category: field.category || "Other"
    }));
    
    // Check if any fields need updating
    const needsUpdate = fieldsWithDefaults.some((field, index) => {
      const original = current[index];
      if (!original) return true;
      return (
        field.is_active !== (original.is_active !== undefined ? original.is_active : true) ||
        field.is_value_type !== (original.is_value_type !== undefined ? original.is_value_type : true) ||
        field.category !== (original.category || "Other")
      );
    });
    
    if (needsUpdate) {
      updateData("dynamicFixedFields", fieldsWithDefaults);
    }
    
    setHasInitialized(true);
  }, [data.dynamicFixedFields, updateData, hasInitialized]);

  // Franchise: ensure royalty & brand fields exist in expense list
  useEffect(() => {
    if (!isFranchise || !hasInitialized) return;
    const current = Array.isArray(data.dynamicFixedFields) ? data.dynamicFixedFields : [];
    const lower = (s) => String(s || "").toLowerCase();
    const hasRoyalty = current.some((f) => lower(f.label).includes("royalty"));
    const hasBrand = current.some(
      (f) => lower(f.label).includes("brand") || lower(f.label).includes("ad fund") || lower(f.label).includes("fund")
    );
    if (hasRoyalty && hasBrand) return;

    const next = [...current];
    if (!hasRoyalty) {
      next.push({
        id: Date.now() + Math.random(),
        label: "Royalty",
        value: "",
        key: `dynamic_expense_royalty_${Date.now()}_${Math.random()}`,
        expense_type: "monthly",
        is_active: true,
        is_value_type: false, // Royalty is typically a percentage
        category: "Royalty + Ad Fund",
      });
    }
    if (!hasBrand) {
      next.push({
        id: Date.now() + Math.random() + 1,
        label: "Brand/Ad Fund",
        value: "",
        key: `dynamic_expense_brand_ad_fund_${Date.now()}_${Math.random()}`,
        expense_type: "monthly",
        is_active: true,
        is_value_type: false, // Brand/Ad Fund is typically a percentage
        category: "Royalty + Ad Fund",
      });
    }
    updateData("dynamicFixedFields", next);
  }, [isFranchise, data.dynamicFixedFields, updateData, hasInitialized]);

  // Convert fields to expense format and group by category
  const expensesByCategory = useMemo(() => {
    // Combine all expenses into a single list
    const fixedFields = Array.isArray(data.dynamicFixedFields) ? data.dynamicFixedFields : [];
    const variableFields = Array.isArray(data.dynamicVariableFields) ? data.dynamicVariableFields : [];
    
    const allExpenses = [
      ...fixedFields,
      ...variableFields
    ].filter(f => f && f.id) // Filter out any invalid entries
    .map((f) => {
      const expenseType = f.expense_type || f.fixed_expense_type || f.variable_expense_type || "monthly";
      return {
        id: f.id,
        name: f.label || '',
        amount: parseFloat(f.value || 0),
        fixed_expense_type: expenseType.toUpperCase() === "MONTHLY" ? "MONTHLY" : "WEEKLY",
        is_active: f.is_active !== undefined ? f.is_active : true,
        is_value_type: f.is_value_type !== undefined ? f.is_value_type : true, // Default to value type
        category: f.category || "Other",
        __originalField: f, // Keep reference to original field for updates
      };
    });

    // Group by category
    const grouped = {};
    allExpenses.forEach(expense => {
      if (!grouped[expense.category]) {
        grouped[expense.category] = [];
      }
      grouped[expense.category].push(expense);
    });
    return grouped;
  }, [data.dynamicFixedFields, data.dynamicVariableFields]);

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => {
    setIsModalVisible(false);
    setNewLabel("");
  };

  const handleOk = () => {
    const label = newLabel.trim();
    if (!label || label.length < 2) return;

    // Add to fixed fields (we'll treat all expenses the same way)
    const newField = {
      id: Date.now() + Math.random(),
      label,
      value: "",
      key: `dynamic_expense_${Date.now()}_${Math.random()}`,
      expense_type: "monthly",
      is_active: true,
      is_value_type: true,
      category: "Other",
    };
    updateData("dynamicFixedFields", [...(data.dynamicFixedFields || []), newField]);

    handleCancel();
  };

  const updateExpense = useCallback(
    (expense, field, value) => {
      const fixedFields = data.dynamicFixedFields || [];
      const variableFields = data.dynamicVariableFields || [];
      
      // Check if row exists in fixed fields
      const inFixed = fixedFields.some(f => f.id === expense.id);
      if (inFixed) {
        const next = fixedFields.map((f) => {
          if (f.id === expense.id) {
            if (field === 'amount') {
              return { ...f, value: value ? value.toString() : "0" };
            } else if (field === 'name') {
              return { ...f, label: value };
            } else if (field === 'is_active') {
              return { ...f, is_active: value };
            } else if (field === 'is_value_type') {
              return { ...f, is_value_type: value };
            } else if (field === 'fixed_expense_type') {
              const freq = value === 'MONTHLY' ? 'monthly' : 'weekly';
              return { ...f, expense_type: freq, fixed_expense_type: freq };
            }
          }
          return f;
        });
        updateData("dynamicFixedFields", next);
      } else {
        // Check if row exists in variable fields (for backward compatibility)
        const next = variableFields.map((f) => {
          if (f.id === expense.id) {
            if (field === 'amount') {
              return { ...f, value: value ? value.toString() : "0" };
            } else if (field === 'name') {
              return { ...f, label: value };
            } else if (field === 'is_active') {
              return { ...f, is_active: value };
            } else if (field === 'is_value_type') {
              return { ...f, is_value_type: value };
            } else if (field === 'fixed_expense_type') {
              const freq = value === 'MONTHLY' ? 'monthly' : 'weekly';
              return { ...f, expense_type: freq, variable_expense_type: freq };
            }
          }
          return f;
        });
        updateData("dynamicVariableFields", next);
      }
    },
    [data.dynamicFixedFields, data.dynamicVariableFields, updateData]
  );

  const toggleExpenseActive = useCallback(
    (expense) => {
      updateExpense(expense, 'is_active', !expense.is_active);
    },
    [updateExpense]
  );

  const toggleValueType = useCallback(
    (expense) => {
      updateExpense(expense, 'is_value_type', !expense.is_value_type);
    },
    [updateExpense]
  );

  const toggleExpenseType = useCallback(
    (expense) => {
      const newType = expense.fixed_expense_type === 'MONTHLY' ? 'WEEKLY' : 'MONTHLY';
      updateExpense(expense, 'fixed_expense_type', newType);
    },
    [updateExpense]
  );

  const deleteExpense = useCallback(
    (expense) => {
      const fixedFields = data.dynamicFixedFields || [];
      const variableFields = data.dynamicVariableFields || [];
      
      // Check if row exists in fixed fields
      const inFixed = fixedFields.some(f => f.id === expense.id);
      if (inFixed) {
        updateData(
          "dynamicFixedFields",
          fixedFields.filter((f) => f.id !== expense.id)
        );
      } else {
        // Check if row exists in variable fields (for backward compatibility)
        updateData(
          "dynamicVariableFields",
          variableFields.filter((f) => f.id !== expense.id)
        );
      }
    },
    [data.dynamicFixedFields, data.dynamicVariableFields, updateData]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-orange-600">Expenses</h3>
        <p className="text-gray-600 text-sm">Non-negotiable. Always plan for them.</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Operating Expenses <span className="text-red-500">*</span>
        </label>

        {/* Expenses by Category */}
        <div className="space-y-6">
          {Object.keys(expensesByCategory).length > 0 ? (
            Object.entries(expensesByCategory).map(([category, categoryExpenses]) => (
              <div key={category} className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{category}</h3>
                <div className="space-y-3">
                  {categoryExpenses.map((expense) => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      onToggleActive={() => toggleExpenseActive(expense)}
                      onToggleValueType={() => toggleValueType(expense)}
                      onToggleExpenseType={() => toggleExpenseType(expense)}
                      onUpdateAmount={(value) => updateExpense(expense, 'amount', value)}
                      onUpdateName={(value) => updateExpense(expense, 'name', value)}
                      onDelete={() => deleteExpense(expense)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Loading expenses...</p>
            </div>
          )}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={showModal}
            className="h-11 text-sm"
          >
            Add New Expense
          </Button>
        </div>

        {(errors.no_expenses || errors.no_fixed_costs || errors.no_variable_costs) && (
          <span className="text-red-500 text-xs mt-1">
            {errors.no_expenses || errors.no_fixed_costs || errors.no_variable_costs}
          </span>
        )}
      </div>

      <Modal
        title="Add New Expense"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Add"
        cancelText="Cancel"
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium">Expense Name</label>
            <Input
              placeholder="Enter expense name"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="h-11 text-sm mt-1"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Expense Row Component (similar to simulator)
const ExpenseRow = ({ 
  expense, 
  onToggleActive, 
  onToggleValueType, 
  onToggleExpenseType, 
  onUpdateAmount,
  onUpdateName,
  onDelete 
}) => {
  // Convert expense to format needed for calculations
  const expenseForCalc = {
    ...expense,
    is_active: expense.is_active !== undefined ? expense.is_active : true,
    fixed_expense_type: expense.fixed_expense_type || 'MONTHLY',
    amount: expense.amount || 0
  };
  
  const monthlyCost = calculateMonthlyCost(expenseForCalc);
  const weeklyCost = calculateWeeklyCost(expenseForCalc);

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
          <Input
            type="text"
            value={expense.name}
            onChange={(e) => onUpdateName(e.target.value)}
            className="w-48 h-9 text-sm font-medium"
            disabled={!expense.is_active}
            placeholder="Expense name"
          />
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
              disabled={!expense.is_active}
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
              disabled={!expense.is_active}
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

export default OperatingExpenses;


