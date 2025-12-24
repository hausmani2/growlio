import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import MonthlyWeeklyToggle from "../../../../buttons/MonthlyWeeklyToggle";

const COST_TYPES = [
  { value: "fixed", label: "Fixed" },
  { value: "variable", label: "Variable" },
];

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
  const [newType, setNewType] = useState("fixed");

  // Franchise: ensure royalty & brand fields exist in variable list (keeps previous behavior)
  useEffect(() => {
    if (!isFranchise) return;
    const current = Array.isArray(data.dynamicVariableFields) ? data.dynamicVariableFields : [];
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
        key: `dynamic_variable_royalty_${Date.now()}_${Math.random()}`,
        variable_expense_type: "monthly",
      });
    }
    if (!hasBrand) {
      next.push({
        id: Date.now() + Math.random() + 1,
        label: "Brand/Ad Fund",
        value: "",
        key: `dynamic_variable_brand_ad_fund_${Date.now()}_${Math.random()}`,
        variable_expense_type: "monthly",
      });
    }
    updateData("dynamicVariableFields", next);
  }, [isFranchise, data.dynamicVariableFields, updateData]);

  const rows = useMemo(() => {
    const fixed = (data.dynamicFixedFields || []).map((f) => ({
      ...f,
      __costType: "fixed",
      __freq: f.fixed_expense_type || "monthly",
    }));
    const variable = (data.dynamicVariableFields || []).map((f) => ({
      ...f,
      __costType: "variable",
      __freq: f.variable_expense_type || "monthly",
    }));
    return [...fixed, ...variable];
  }, [data.dynamicFixedFields, data.dynamicVariableFields]);

  const showModal = () => setIsModalVisible(true);
  const handleCancel = () => {
    setIsModalVisible(false);
    setNewLabel("");
    setNewType("fixed");
  };

  const handleOk = () => {
    const label = newLabel.trim();
    if (!label || label.length < 2) return;

    if (newType === "fixed") {
      const newField = {
        id: Date.now() + Math.random(),
        label,
        value: "",
        key: `dynamic_fixed_${Date.now()}_${Math.random()}`,
        fixed_expense_type: "monthly",
      };
      updateData("dynamicFixedFields", [...(data.dynamicFixedFields || []), newField]);
    } else {
      const newField = {
        id: Date.now() + Math.random(),
        label,
        value: "",
        key: `dynamic_variable_${Date.now()}_${Math.random()}`,
        variable_expense_type: "monthly",
      };
      updateData("dynamicVariableFields", [...(data.dynamicVariableFields || []), newField]);
    }

    handleCancel();
  };

  const updateAmount = useCallback(
    (row, value) => {
      const v = clampStrAmount(value);
      if (row.__costType === "fixed") {
        const next = (data.dynamicFixedFields || []).map((f) =>
          f.id === row.id ? { ...f, value: v } : f
        );
        updateData("dynamicFixedFields", next);
      } else {
        const next = (data.dynamicVariableFields || []).map((f) =>
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
      if (row.__costType === "fixed") {
        const next = (data.dynamicFixedFields || []).map((f) =>
          f.id === row.id ? { ...f, fixed_expense_type: freq } : f
        );
        updateData("dynamicFixedFields", next);
      } else {
        const next = (data.dynamicVariableFields || []).map((f) =>
          f.id === row.id ? { ...f, variable_expense_type: freq } : f
        );
        updateData("dynamicVariableFields", next);
      }
    },
    [data.dynamicFixedFields, data.dynamicVariableFields, updateData]
  );

  const deleteRow = useCallback(
    (row) => {
      if (row.__costType === "fixed") {
        updateData(
          "dynamicFixedFields",
          (data.dynamicFixedFields || []).filter((f) => f.id !== row.id)
        );
      } else {
        updateData(
          "dynamicVariableFields",
          (data.dynamicVariableFields || []).filter((f) => f.id !== row.id)
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
            <label className="text-sm font-medium">Expense Type</label>
            <Select
              value={newType}
              onChange={setNewType}
              options={COST_TYPES}
              className="w-full mt-1"
            />
          </div>
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


