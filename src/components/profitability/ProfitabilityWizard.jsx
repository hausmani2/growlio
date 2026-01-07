import React, { useLayoutEffect, useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import growlioLogo from "../../assets/svgs/growlio-logo.png";
import Header from "../layout/Header";
import useStore from "../../store/store";
import { message } from "antd";

const formatMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const parseMoney = (raw) => {
  if (raw == null) return "";
  const cleaned = String(raw).replace(/[^\d]/g, "");
  if (!cleaned) return "";
  return cleaned;
};

const steps = [
  { key: "lastMonthSales", title: "Last Month's Sales", min: 0, max: 200000, step: 500, apiField: "sales" },
  { key: "lastMonthCOGS", title: "Last Month's Cost of Goods (COGS)", min: 0, max: 150000, step: 500, apiField: "cogs" },
  { key: "lastMonthLabor", title: "Last Month's Labor Expense", min: 0, max: 150000, step: 500, apiField: "labour" },
  { key: "monthlyRent", title: "Your Monthly Rent", min: 0, max: 50000, step: 100, apiField: "expenses" },
];

const ProfitabilityWizard = () => {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const measureRef = useRef(null);
  const [numberWidth, setNumberWidth] = useState(0);
  const [values, setValues] = useState({
    lastMonthSales: "",
    lastMonthCOGS: "",
    lastMonthLabor: "",
    monthlyRent: "",
  });
  const { createSalesInformation, getSalesInformation, salesInformationData } = useStore();

  // Helper function to extract data from API response
  const extractData = (data) => {
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    if (data?.results) {
      return typeof data.results === 'object' ? data.results : (Array.isArray(data.results) ? data.results[0] : null);
    }
    if (data?.data) {
      return Array.isArray(data.data) ? data.data[0] : data.data;
    }
    if (data && typeof data === 'object' && ('sales' in data || 'cogs' in data)) {
      return data;
    }
    return null;
  };

  // Helper function to check if sales information exists
  const hasSalesInformation = () => {
    if (!salesInformationData) return false;
    const data = extractData(salesInformationData);
    if (!data) return false;
    return (
      data.sales != null &&
      data.expenses != null &&
      data.labour != null &&
      data.cogs != null
    );
  };

  // Fetch existing sales information on mount
  useEffect(() => {
    const currentData = useStore.getState().salesInformationData;
    if (!currentData) {
      getSalesInformation().catch(console.error);
    }
  }, []);

  // Load existing values from API on initial load only
  useEffect(() => {
    if (!salesInformationData) return;
    
    const data = extractData(salesInformationData);
    if (!data) return;

    setValues((prev) => {
      const newValues = {
        lastMonthSales: data.sales != null ? String(data.sales) : prev.lastMonthSales,
        lastMonthCOGS: data.cogs != null ? String(data.cogs) : prev.lastMonthCOGS,
        lastMonthLabor: data.labour != null ? String(data.labour) : prev.lastMonthLabor,
        monthlyRent: data.expenses != null ? String(data.expenses) : prev.monthlyRent,
      };

      // Only update if values actually changed
      if (
        newValues.lastMonthSales === prev.lastMonthSales &&
        newValues.lastMonthCOGS === prev.lastMonthCOGS &&
        newValues.lastMonthLabor === prev.lastMonthLabor &&
        newValues.monthlyRent === prev.monthlyRent
      ) {
        return prev;
      }

      return newValues;
    });
  }, [salesInformationData]);

  const step = steps[stepIdx];
  if (!step) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  const currentRawValue = values[step.key] || "";
  const displayValue = useMemo(() => {
    return isEditing ? String(currentRawValue || "") : formatMoney(currentRawValue) || "";
  }, [currentRawValue, isEditing]);

  const numericValue = useMemo(() => {
    const n = Number(currentRawValue);
    return Number.isFinite(n) ? n : 0;
  }, [currentRawValue]);

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const setCurrentValue = (nextRaw) => {
    const rawDigits = parseMoney(nextRaw);
    const n = clamp(Number(rawDigits || 0), step.min, step.max);
    setValues((prev) => ({ ...prev, [step.key]: String(n) }));
  };

  const setCurrentValueFromSlider = (next) => {
    const n = clamp(Number(next || 0), step.min, step.max);
    setValues((prev) => ({ ...prev, [step.key]: String(n) }));
  };

  // Measure number width for $ positioning
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => setNumberWidth(el.getBoundingClientRect().width || 0);
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [displayValue, stepIdx]);

  const goBack = () => {
    if (stepIdx === 0) {
      navigate(hasSalesInformation() ? "/dashboard/budget" : "/onboarding");
      return;
    }
    setStepIdx(stepIdx - 1);
  };

  const goNext = async () => {
    if (isProcessing || !step) return;

    const currentValue = values[step.key];
    const numericValue = Number(currentValue);

    if (!currentValue || isNaN(numericValue) || numericValue <= 0) {
      message.warning(`Please enter a valid ${step.title.toLowerCase()}`);
      return;
    }

    // If not on last step, just move to next step
    if (stepIdx < steps.length - 1) {
      setStepIdx(stepIdx + 1);
      return;
    }

    // On last step, save all data with one API call
    setIsProcessing(true);

    try {
      const payload = {
        restaurant_id: useStore.getState().restaurantId || Number(localStorage.getItem('restaurant_id')),
        data: {
          sales: Number(values.lastMonthSales) || 0,
          cogs: Number(values.lastMonthCOGS) || 0,
          labour: Number(values.lastMonthLabor) || 0,
          expenses: Number(values.monthlyRent) || 0,
        }
      };

      const result = await createSalesInformation(payload);

      if (!result.success) {
        message.error(result.error || 'Failed to save data. Please try again.');
        setIsProcessing(false);
        return;
      }

      message.success('Sales information saved successfully!');
      navigate("/dashboard/report-card");
    } catch (error) {
      console.error('Error saving sales information:', error);
      message.error('Failed to save data. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gray-50">
      <Header />

      <div className="w-full flex items-center justify-center px-4 sm:px-4 lg:px-6 py-10">
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 px-6 py-10 sm:px-10 sm:py-12">
            <div className="flex justify-center mb-8">
              <img src={growlioLogo} alt="Growlio Logo" className="w-40 mx-auto" />
            </div>

            <div className="text-center">
              <div className="relative flex justify-center">
                <span
                  ref={measureRef}
                  className="pointer-events-none absolute opacity-0 select-none whitespace-pre tabular-nums font-extrabold tracking-tight text-6xl sm:text-7xl leading-none"
                >
                  {displayValue || "0"}
                </span>

                <span
                  className="text-orange-500 font-bold text-4xl sm:text-5xl leading-none absolute"
                  style={{
                    left: `calc(50% - ${numberWidth / 2}px - 26px)`,
                    top: "6px",
                  }}
                >
                  $
                </span>

                <input
                  inputMode="numeric"
                  value={displayValue}
                  onFocus={() => setIsEditing(true)}
                  onBlur={() => setIsEditing(false)}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder="0"
                  className="w-full max-w-[520px] text-center text-orange-500 font-extrabold tracking-tight tabular-nums text-6xl sm:text-7xl leading-none bg-transparent outline-none border-0 p-0 placeholder:text-orange-200"
                  aria-label={step.title}
                />
              </div>

              <div className="mt-8 flex flex-col items-center">
                <div className="relative w-72 sm:w-80">
                  <div className="h-2 bg-gray-200 rounded-full" />
                  <div
                    className="absolute -bottom-2 w-1.5 h-6 bg-orange-500 rounded-full"
                    style={{
                      left: `${((numericValue - step.min) / (step.max - step.min || 1)) * 100}%`,
                      transform: "translateX(-50%)",
                    }}
                  />
                  <input
                    type="range"
                    min={step.min}
                    max={step.max}
                    step={step.step}
                    value={numericValue}
                    onChange={(e) => setCurrentValueFromSlider(e.target.value)}
                    className="absolute inset-0 w-full h-6 -top-2 opacity-0 cursor-pointer"
                    aria-label={`${step.title} slider`}
                  />
                </div>
                <div className="mt-4 text-lg sm:text-xl font-bold text-gray-900">
                  {step.title}
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                onClick={goBack}
                className="px-6 py-2.5 rounded-md text-sm font-semibold bg-gray-300 text-white hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={stepIdx === 0}
              >
                {"< Back"}
              </button>
              <button
                onClick={goNext}
                disabled={isProcessing}
                className="px-7 py-2.5 rounded-md text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Saving..." : (stepIdx === steps.length - 1 ? "Finish >" : "Next >")}
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i <= stepIdx ? "bg-orange-500" : "bg-gray-300"}`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-700">
              Step {stepIdx + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityWizard;
