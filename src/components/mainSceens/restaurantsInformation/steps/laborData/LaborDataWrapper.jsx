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

const toNumber = (v) => {
  const n = Number(String(v || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return "";
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

// Convert month name to number (1-12)
const monthToNumber = (monthName) => {
  const index = MONTHS.findIndex(m => m === monthName);
  return index >= 0 ? index + 1 : 1;
};

// Convert month number to name
const numberToMonth = (monthNum) => {
  return MONTHS[monthNum - 1] || "January";
};

const LaborDataWrapper = () => {
  const navigate = useNavigate();
  const { submitStepData, loadExistingOnboardingData, completeOnboardingData, onboardingLoading } = useStore();
  const [rows, setRows] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing labor data on mount
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    const loadLaborData = async () => {
      if (hasLoadedRef.current) return;
      
      // Check if we already have labor data loaded
      const laborData = completeOnboardingData?.["Labor Data"];
      if (laborData && laborData.data && Array.isArray(laborData.data) && laborData.data.length > 0) {
        // Data already loaded, transform and use it
        const transformedRows = laborData.data
          .filter(item => item.year && item.month) // Only include items with year and month
          .map((item, idx) => ({
            id: item.id || Date.now() + idx,
            month: numberToMonth(item.month),
            year: String(item.year),
            laborHours: item.labor_hours ? String(item.labor_hours) : "",
            laborCost: item.labor_cost ? String(item.labor_cost) : "",
          }));
        
        if (transformedRows.length > 0) {
          setRows(transformedRows);
        }
        hasLoadedRef.current = true;
        return;
      }
      
      hasLoadedRef.current = true;
      try {
        // Load onboarding data which includes Labor Data
        await loadExistingOnboardingData();
        
        // Get updated state from store after loading
        const currentState = useStore.getState();
        const updatedLaborData = currentState.completeOnboardingData?.["Labor Data"];
        
        if (updatedLaborData && updatedLaborData.data && Array.isArray(updatedLaborData.data) && updatedLaborData.data.length > 0) {
          // Transform API data to component format
          const transformedRows = updatedLaborData.data
            .filter(item => item.year && item.month) // Only include items with year and month
            .map((item, idx) => ({
              id: item.id || Date.now() + idx,
              month: numberToMonth(item.month),
              year: String(item.year),
              laborHours: item.labor_hours ? String(item.labor_hours) : "",
              laborCost: item.labor_cost ? String(item.labor_cost) : "",
            }));
          
          if (transformedRows.length > 0) {
            setRows(transformedRows);
          }
        }
      } catch (error) {
        console.error('Error loading labor data:', error);
        hasLoadedRef.current = false; // Allow retry on error
      }
    };
    
    loadLaborData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSave = async () => {
    // Validate rows
    const validRows = rows.filter(row => {
      const laborHours = toNumber(row.laborHours);
      const laborCost = toNumber(row.laborCost);
      const year = Number(row.year);
      return laborHours > 0 && laborCost > 0 && year > 0 && row.month;
    });

    if (validRows.length === 0) {
      message.warning('Please add at least one valid labor entry with labor hours, labor cost, month, and year.');
      return;
    }

    setIsSaving(true);
    try {
      // Transform rows to API format matching the expected structure
      const laborDataArray = validRows.map(row => {
        const hours = toNumber(row.laborHours);
        const cost = toNumber(row.laborCost);
        const avgRate = hours > 0 ? cost / hours : 0;
        
        return {
          year: Number(row.year),
          month: monthToNumber(row.month),
          labor_hours: hours,
          labor_cost: cost,
          avg_hourly_rate: avgRate,
        };
      });

      // Use submitStepData from onboarding slice
      const result = await submitStepData("Labor Data", laborDataArray, (responseData) => {
        message.success('Labor data saved successfully!');
        navigate("/dashboard/budget");
      });

      if (!result.success) {
        message.error('Failed to save labor data. Please try again.');
      }
    } catch (error) {
      console.error('Error saving labor data:', error);
      message.error(error.message || 'Failed to save labor data. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
          onClick={() => {
            navigate("/dashboard/food-cost-details");
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

export default LaborDataWrapper;

