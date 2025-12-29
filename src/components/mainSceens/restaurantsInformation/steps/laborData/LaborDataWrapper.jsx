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

const LaborDataWrapper = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([
    { id: 1, month: "January", year: "2024", laborHours: "1200", laborCost: "18000" },
    { id: 2, month: "February", year: "2024", laborHours: "1150", laborCost: "17250" },
  ]);

  const withAverageRate = useMemo(() => {
    return rows.map((r) => {
      const hours = toNumber(r.laborHours);
      const cost = toNumber(r.laborCost);
      const avgRate = hours > 0 ? cost / hours : 0;
      return {
        ...r,
        averageRate: avgRate,
      };
    });
  }, [rows]);

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: Date.now(), month: "January", year: String(new Date().getFullYear()), laborHours: "", laborCost: "" },
    ]);
  };

  return (
    <div className="w-full">
      {/* Top Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="text-xs text-gray-400 mb-2">Onboarding / Labor Data</div>
        <div className="text-lg font-bold text-orange-600">Labor Data</div>
        <div className="text-xs text-gray-600 mt-1 max-w-3xl">
          Enter any previous labor information that you have to get a better analysis of your restaurant.
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="text-sm font-bold text-orange-600">Previous Labor Information</div>

        <div className="mt-4">
          <div className="grid grid-cols-5 gap-4 text-xs font-semibold text-gray-700 px-2">
            <div>Month</div>
            <div>Year</div>
            <div>Labor Hours</div>
            <div>Labor Cost</div>
            <div>Avg Hourly Rate</div>
          </div>

          <div className="mt-3 space-y-2">
            {withAverageRate.map((r) => (
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
                  value={r.laborHours ? r.laborHours : ""}
                  onChange={(e) => updateRow(r.id, { laborHours: String(toNumber(e.target.value)) })}
                  className="w-full"
                  placeholder="0"
                />
                <Input
                  value={r.laborCost ? formatMoney(r.laborCost) : ""}
                  onChange={(e) => updateRow(r.id, { laborCost: String(toNumber(e.target.value)) })}
                  className="w-full"
                  placeholder="$0"
                />
                <Input value={formatMoney(r.averageRate)} className="w-full" disabled />
              </div>
            ))}
          </div>

          <button
            onClick={addRow}
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
          >
            <PlusOutlined />
            Add Labor Data
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

export default LaborDataWrapper;

