import React, { useMemo, useState, useEffect, useRef } from "react";
import { Input, Select, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useStore from "../../../../../store/store";

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

// Convert month name to number (1-12)
const monthToNumber = (monthName) => {
  const index = MONTHS.findIndex(m => m === monthName);
  return index >= 0 ? index + 1 : 1;
};

// Convert month number to name
const numberToMonth = (monthNum) => {
  return MONTHS[monthNum - 1] || "January";
};

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
  const { submitStepData, loadExistingOnboardingData, completeOnboardingData, onboardingLoading } = useStore();
  const [rows, setRows] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing sales data on mount
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    const loadSalesData = async () => {
      if (hasLoadedRef.current) return;
      
      // Check if we already have sales data loaded
      const salesInfo = completeOnboardingData?.["Sales Information"];
      if (salesInfo && salesInfo.data && Array.isArray(salesInfo.data) && salesInfo.data.length > 0) {
        // Data already loaded, transform and use it
        const transformedRows = salesInfo.data
          .filter(item => item.year && item.month) // Only include items with year and month
          .map((item, idx) => ({
            id: item.id || Date.now() + idx,
            month: numberToMonth(item.month),
            year: String(item.year),
            sales: item.sales ? String(item.sales) : "",
            expenses: item.expenses ? String(item.expenses) : "",
          }));
        
        if (transformedRows.length > 0) {
          setRows(transformedRows);
        }
        hasLoadedRef.current = true;
        return;
      }
      
      hasLoadedRef.current = true;
      try {
        // Load onboarding data which includes Sales Information
        await loadExistingOnboardingData();
        
        // Get updated state from store after loading
        const currentState = useStore.getState();
        const updatedSalesInfo = currentState.completeOnboardingData?.["Sales Information"];
        
        if (updatedSalesInfo && updatedSalesInfo.data && Array.isArray(updatedSalesInfo.data) && updatedSalesInfo.data.length > 0) {
          // Transform API data to component format
          const transformedRows = updatedSalesInfo.data
            .filter(item => item.year && item.month) // Only include items with year and month
            .map((item, idx) => ({
              id: item.id || Date.now() + idx,
              month: numberToMonth(item.month),
              year: String(item.year),
              sales: item.sales ? String(item.sales) : "",
              expenses: item.expenses ? String(item.expenses) : "",
            }));
          
          if (transformedRows.length > 0) {
            setRows(transformedRows);
          }
        }
      } catch (error) {
        console.error('Error loading sales data:', error);
        hasLoadedRef.current = false; // Allow retry on error
      }
    };
    
    loadSalesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSave = async () => {
    // Validate rows
    const validRows = rows.filter(row => {
      const sales = toNumber(row.sales);
      const expenses = toNumber(row.expenses);
      const year = Number(row.year);
      return sales > 0 && expenses >= 0 && year > 0 && row.month;
    });

    if (validRows.length === 0) {
      message.warning('Please add at least one valid sales entry with sales, expenses, month, and year.');
      return;
    }

    setIsSaving(true);
    try {
      // Transform rows to API format matching the expected structure
      const salesDataArray = validRows.map(row => ({
        year: Number(row.year),
        month: monthToNumber(row.month),
        sales: toNumber(row.sales),
        expenses: toNumber(row.expenses),
        profit: toNumber(row.sales) - toNumber(row.expenses),
      }));

      // Use submitStepData from onboarding slice
      const result = await submitStepData("Sales Information", salesDataArray, (responseData) => {
        message.success('Sales data saved successfully!');
        navigate("/dashboard/budget");
      });

      if (!result.success) {
        message.error('Failed to save sales data. Please try again.');
      }
    } catch (error) {
      console.error('Error saving sales data:', error);
      message.error(error.message || 'Failed to save sales data. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
          onClick={() => {
            navigate("/dashboard/basic-information");
          }}
          disabled={isSaving || onboardingLoading}
        >
          Skip
        </button>
        <button
          className="px-10 py-2.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={isSaving || onboardingLoading}
        >
          {isSaving || onboardingLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default SalesDataWrapper;


