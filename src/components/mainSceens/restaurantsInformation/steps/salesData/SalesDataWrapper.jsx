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
  if (n === null || n === undefined || n === "") return "";
  const v = Number(n);
  if (!Number.isFinite(v) || isNaN(v)) return "";
  // Display $0 for zero values, otherwise format normally
  if (v === 0) return "$0";
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const SalesDataWrapper = () => {
  const navigate = useNavigate();
  const { submitStepData, loadExistingOnboardingData, completeOnboardingData, onboardingLoading } = useStore();
  const [rows, setRows] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing sales and labor data on mount
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    const loadData = async () => {
      if (hasLoadedRef.current) return;
      
      // Check if we already have sales data loaded
      const salesInfo = completeOnboardingData?.["Sales Information"];
      
      // Load sales data (which includes labour field)
      if (salesInfo && salesInfo.data && Array.isArray(salesInfo.data) && salesInfo.data.length > 0) {
        const transformedRows = salesInfo.data
          .filter(item => item.year && item.month)
          .map((item, idx) => ({
            id: item.id || Date.now() + idx,
            month: numberToMonth(item.month),
            year: String(item.year),
            sales: (item.sales !== null && item.sales !== undefined) ? String(item.sales) : "",
            expenses: (item.expenses !== null && item.expenses !== undefined) ? String(item.expenses) : "",
            laborCost: (item.labour !== null && item.labour !== undefined) ? String(item.labour) : "",
            cogs: (item.cogs !== null && item.cogs !== undefined) ? String(item.cogs) : "",
          }));
        
        if (transformedRows.length > 0) {
          setRows(transformedRows);
          hasLoadedRef.current = true;
          return;
        }
      }
      
      hasLoadedRef.current = true;
      try {
        // Load onboarding data which includes Sales Information
        await loadExistingOnboardingData();
        
        // Get updated state from store after loading
        const currentState = useStore.getState();
        const updatedSalesInfo = currentState.completeOnboardingData?.["Sales Information"];
        
        if (updatedSalesInfo && updatedSalesInfo.data && Array.isArray(updatedSalesInfo.data) && updatedSalesInfo.data.length > 0) {
          // Transform API data to component format (labour field from sales data)
          const transformedRows = updatedSalesInfo.data
            .filter(item => item.year && item.month)
            .map((item, idx) => ({
              id: item.id || Date.now() + idx,
              month: numberToMonth(item.month),
              year: String(item.year),
              sales: (item.sales !== null && item.sales !== undefined) ? String(item.sales) : "",
              expenses: (item.expenses !== null && item.expenses !== undefined) ? String(item.expenses) : "",
              laborCost: (item.labour !== null && item.labour !== undefined) ? String(item.labour) : "",
            }));
          
          if (transformedRows.length > 0) {
            setRows(transformedRows);
          }
        }
      } catch (error) {
        console.error('Error loading sales and labor data:', error);
        hasLoadedRef.current = false; // Allow retry on error
      }
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withCalculatedFields = useMemo(() => {
    return rows.map((r) => {
      const sales = toNumber(r.sales);
      const expenses = toNumber(r.expenses);
      const laborCost = toNumber(r.laborCost);
      const cogs = toNumber(r.cogs);
      // Profit = Sales - (COGS + Labor Cost + Expense)
      const profit = sales - (cogs + laborCost + expenses);
      
      return {
        ...r,
        profit,
      };
    });
  }, [rows]);

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };


  const handleSave = async () => {
    // Validate rows - all fields are optional, but at least one field must be filled per row
    const validRows = rows.filter(row => {
      const sales = toNumber(row.sales);
      const expenses = toNumber(row.expenses);
      const laborCost = toNumber(row.laborCost);
      const cogs = toNumber(row.cogs);
      const year = Number(row.year);
      
      // Row is valid if it has year, month, and at least one data field filled
      return year > 0 && row.month && (sales > 0 || expenses > 0 || laborCost > 0 || cogs > 0);
    });

    if (validRows.length === 0) {
      message.warning('Please add at least one entry with month, year, and at least one data field (sales, expenses, labor, or COGS).');
      return;
    }

    setIsSaving(true);
    try {
      // Save sales data with labour and cogs fields included
      const salesDataArray = validRows.map(row => {
        const sales = toNumber(row.sales);
        const expenses = toNumber(row.expenses);
        const laborCost = toNumber(row.laborCost);
        const cogs = toNumber(row.cogs);
        // Profit = Sales - (COGS + Labor Cost + Expense)
        const profit = sales - (cogs + laborCost + expenses);
        
        return {
          year: Number(row.year),
          month: monthToNumber(row.month),
          sales,
          expenses,
          profit,
          labour: laborCost > 0 ? laborCost : null,
          cogs: cogs > 0 ? cogs : null,
        };
      });

      // Save all data as Sales Information (includes labour field)
      const result = await submitStepData("Sales Information", salesDataArray, (responseData) => {
        message.success('Sales and labor data saved successfully!');
        // Navigate to Restaurant Details (Basic Information) after successful save
        setTimeout(() => {
          navigate("/dashboard/basic-information");
        }, 500); // Small delay to show success message
      });

      if (!result.success) {
        message.error('Failed to save data. Please try again.');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      message.error(error.message || 'Failed to save data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="text-xs text-gray-400 mb-2">Onboarding / Sales & Labor Data</div>
        <div className="text-lg font-bold text-orange-600">Sales & Labor Data</div>
        <div className="text-xs text-gray-600 mt-1 max-w-3xl">
          Enter any previous sales and labor information that you have to get a better analysis of your restaurant. All fields are optional - you can enter sales and labor and skip expenses, or vice versa.
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="text-sm font-bold text-orange-600">Previous Sales & Labor Information</div>

        <div className="mt-4">
          <div className="grid grid-cols-7 gap-4 text-xs font-semibold text-gray-700 px-2">
            <div>Month</div>
            <div>Year</div>
            <div>Sales</div>
            <div>Labor Cost</div>
            <div>COGS</div>
            <div>Expense</div>
            <div>Profit</div>
          </div>

          <div className="mt-3 space-y-2">
            {withCalculatedFields.map((r) => (
              <div key={r.id} className="grid grid-cols-7 gap-4 items-center bg-gray-50 rounded-lg p-3">
                <Select
                  value={r.month}
                  onChange={(v) => updateRow(r.id, { month: v })}
                  options={MONTHS.map((m) => ({ value: m, label: m }))}
                  className="w-full"
                  size="middle"
                  style={{ height: '40px' }}
                  readOnly
                  disabled
                />
                <Input
                  value={r.year}
                  onChange={(e) => updateRow(r.id, { year: e.target.value })}
                  className="w-full"
                  placeholder="2024"
                  style={{ height: '40px' }}
                  readOnly
                  disabled
                />
                <Input
                  value={formatMoney(r.sales)}
                  onChange={(e) => updateRow(r.id, { sales: String(toNumber(e.target.value)) })}
                  className="w-full"
                  placeholder="$0"
                  style={{ height: '40px' }}
                />
                <Input
                  value={formatMoney(r.laborCost)}
                  onChange={(e) => updateRow(r.id, { laborCost: String(toNumber(e.target.value)) })}
                  className="w-full"
                  placeholder="$0"
                  style={{ height: '40px' }}
                />
                <Input
                  value={formatMoney(r.cogs)}
                  onChange={(e) => updateRow(r.id, { cogs: String(toNumber(e.target.value)) })}
                  className="w-full"
                  placeholder="$0"
                  style={{ height: '40px' }}
                />
                <Input
                  value={formatMoney(r.expenses)}
                  onChange={(e) => updateRow(r.id, { expenses: String(toNumber(e.target.value)) })}
                  className="w-full"
                  placeholder="$0"
                  style={{ height: '40px' }}
                />
                <Input 
                  value={formatMoney(r.profit)} 
                  className="w-full" 
                  disabled 
                  style={{ height: '40px' }}
                />
              </div>
            ))}
          </div>

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


