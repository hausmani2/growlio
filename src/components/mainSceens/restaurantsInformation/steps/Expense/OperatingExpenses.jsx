import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import MonthlyWeeklyToggle from "../../../../buttons/MonthlyWeeklyToggle";

// Removed COST_TYPES - no longer using fixed/variable distinction

const clampStrAmount = (v) => {
  if (v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return "0";
  return String(v);
};

/**
 * Single list to manage BOTH fixed + variable costs (as requested).
 * Internally it still updates `dynamicFixedFields` and `dynamicVariableFields`
 * so existing totals + API mapping keep working.
 */
const OperatingExpenses = ({ data, updateData, errors = {}, isFranchise = false }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  // Franchise: ensure royalty & brand fields exist in expense list
  useEffect(() => {
    if (!isFranchise) return;
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
      });
    }
    if (!hasBrand) {
      next.push({
        id: Date.now() + Math.random() + 1,
        label: "Brand/Ad Fund",
        value: "",
        key: `dynamic_expense_brand_ad_fund_${Date.now()}_${Math.random()}`,
        expense_type: "monthly",
      });
    }
    updateData("dynamicFixedFields", next);
  }, [isFranchise, data.dynamicFixedFields, updateData]);

  const rows = useMemo(() => {
    // Combine all expenses into a single list
    const allExpenses = (data.dynamicFixedFields || []).map((f) => ({
      ...f,
      __costType: "expense",
      __freq: f.expense_type || f.fixed_expense_type || "monthly",
    }));
    // Also include variable fields if they exist (for backward compatibility)
    const variableExpenses = (data.dynamicVariableFields || []).map((f) => ({
      ...f,
      __costType: "expense",
      __freq: f.expense_type || f.variable_expense_type || "monthly",
    }));
    return [...allExpenses, ...variableExpenses];
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
    };
    updateData("dynamicFixedFields", [...(data.dynamicFixedFields || []), newField]);

    handleCancel();
  };

  const updateAmount = useCallback(
    (row, value) => {
      const v = clampStrAmount(value);
      // Update in fixed fields (we're treating all expenses the same)
      const fixedFields = data.dynamicFixedFields || [];
      const variableFields = data.dynamicVariableFields || [];
      
      // Check if row exists in fixed fields
      const inFixed = fixedFields.some(f => f.id === row.id);
      if (inFixed) {
        const next = fixedFields.map((f) =>
          f.id === row.id ? { ...f, value: v } : f
        );
        updateData("dynamicFixedFields", next);
      } else {
        // Check if row exists in variable fields (for backward compatibility)
        const next = variableFields.map((f) =>
          f.id === row.id ? { ...f, value: v } : f
        );
        updateData("dynamicVariableFields", next);
      }
    },
    [data.dynamicFixedFields, data.dynamicVariableFields, updateData]
  );

  const updateFrequency = useCallback(
    (row, isMonthly) => {
      const freq = isMonthly ? "monthly" : "weekly";
      const fixedFields = data.dynamicFixedFields || [];
      const variableFields = data.dynamicVariableFields || [];
      
      // Check if row exists in fixed fields
      const inFixed = fixedFields.some(f => f.id === row.id);
      if (inFixed) {
        const next = fixedFields.map((f) =>
          f.id === row.id ? { ...f, expense_type: freq, fixed_expense_type: freq } : f
        );
        updateData("dynamicFixedFields", next);
      } else {
        // Check if row exists in variable fields (for backward compatibility)
        const next = variableFields.map((f) =>
          f.id === row.id ? { ...f, expense_type: freq, variable_expense_type: freq } : f
        );
        updateData("dynamicVariableFields", next);
      }
    },
    [data.dynamicFixedFields, data.dynamicVariableFields, updateData]
  );

  const deleteRow = useCallback(
    (row) => {
      const fixedFields = data.dynamicFixedFields || [];
      const variableFields = data.dynamicVariableFields || [];
      
      // Check if row exists in fixed fields
      const inFixed = fixedFields.some(f => f.id === row.id);
      if (inFixed) {
        updateData(
          "dynamicFixedFields",
          fixedFields.filter((f) => f.id !== row.id)
        );
      } else {
        // Check if row exists in variable fields (for backward compatibility)
        updateData(
          "dynamicVariableFields",
          variableFields.filter((f) => f.id !== row.id)
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

        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={`${row.__costType}-${row.id}`}
              className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 w-full sm:w-auto">
                <Input
                  type="text"
                  value={row.label}
                  className="w-full sm:w-48 h-10 rounded-lg text-sm"
                  disabled
                />
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={row.value}
                  onChange={(e) => updateAmount(row, e.target.value)}
                  className="w-full sm:w-full h-10 rounded-lg text-sm"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <MonthlyWeeklyToggle
                  isMonthly={row.__freq === "monthly"}
                  setIsMonthly={(isMonthly) => updateFrequency(row, isMonthly)}
                  size="medium"
                />
              </div>
              <Button
                type="text"
                danger
                onClick={() => deleteRow(row)}
                className="h-11 px-4 text-sm"
              >
                Delete
              </Button>
            </div>
          ))}

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

export default OperatingExpenses;


