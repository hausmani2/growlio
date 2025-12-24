import React, { useMemo, useState } from "react";
import { Input, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const toNumber = (v) => {
  const n = Number(String(v || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "";
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const SalesDataWrapper = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([
    { id: 1, month: "January", year: "2024", sales: "50000", expenses: "39000" },
    { id: 2, month: "February", year: "2024", sales: "42000", expenses: "39000" },
  ]);

  const withProfit = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      profit: toNumber(r.sales) - toNumber(r.expenses),
    }));
  }, [rows]);

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: Date.now(), month: "January", year: String(new Date().getFullYear()), sales: "", expenses: "" },
    ]);
  };

  return (
    <div className="w-full">
      {/* Top Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="text-xs text-gray-400 mb-2">Onboarding / Sales Data</div>
        <div className="text-lg font-bold text-orange-600">Sales Data</div>
        <div className="text-xs text-gray-600 mt-1 max-w-3xl">
          Enter any previous sales information that you have to get a better analysis of your restaurant.
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="text-sm font-bold text-orange-600">Previous Sales Information</div>

        <div className="mt-4">
          <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-gray-700 px-2">
            <div>Month</div>
            <div>Year</div>
            <div>Sales</div>
            <div>Expenses</div>
            <div>Profit</div>
          </div>

          <div className="mt-3 space-y-2">
            {withProfit.map((r) => (
              <div key={r.id} className="grid grid-cols-5 gap-4 items-center bg-gray-50 rounded-lg p-3">
                <Select
                  value={r.month}
                  onChange={(v) => updateRow(r.id, { month: v })}
                  options={MONTHS.map((m) => ({ value: m, label: m }))}
                  className="w-full"
                  size="middle"
                />
                <Input
                  value={r.year}
                  onChange={(e) => updateRow(r.id, { year: e.target.value })}
                  className="w-full"
                  placeholder="2024"
                />
                <Input
                  value={r.sales ? formatMoney(r.sales) : ""}
                  onChange={(e) => updateRow(r.id, { sales: String(toNumber(e.target.value)) })}
                  className="w-full"
                  placeholder="$0"
                />
                <Input
                  value={r.expenses ? formatMoney(r.expenses) : ""}
                  onChange={(e) => updateRow(r.id, { expenses: String(toNumber(e.target.value)) })}
                  className="w-full"
                  placeholder="$0"
                />
                <Input value={formatMoney(r.profit)} className="w-full" disabled />
              </div>
            ))}
          </div>

          <button
            onClick={addRow}
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
          >
            <PlusOutlined />
            Add Sales Data
          </button>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 mt-8">
        <button
          className="px-10 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
          onClick={() => navigate("/dashboard/budget")}
        >
          Skip
        </button>
        <button
          className="px-10 py-2.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600"
          onClick={() => navigate("/dashboard/budget")}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SalesDataWrapper;


