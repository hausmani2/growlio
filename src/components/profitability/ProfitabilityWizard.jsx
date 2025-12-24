import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import growlioLogo from "../../assets/svgs/growlio-logo.png";
import Header from "../layout/Header";

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
  { key: "lastMonthSales", title: "Last Month’s Sales", min: 0, max: 200000, step: 500 },
  { key: "lastMonthCOGS", title: "Last Month’s Cost of Goods (COGS)", min: 0, max: 150000, step: 500 },
  { key: "lastMonthLabor", title: "Last Month’s Labor Expense", min: 0, max: 150000, step: 500 },
  { key: "monthlyRent", title: "Your Monthly Rent", min: 0, max: 50000, step: 100 },
];

const ProfitabilityWizard = () => {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const measureRef = useRef(null);
  const [numberWidth, setNumberWidth] = useState(0);
  const [values, setValues] = useState({
    lastMonthSales: "40000",
    lastMonthCOGS: "",
    lastMonthLabor: "",
    monthlyRent: "",
  });

  const step = steps[stepIdx];
  const currentRawValue = values[step.key];
  const displayValue = useMemo(() => {
    if (isEditing) return String(currentRawValue || "");
    return formatMoney(currentRawValue) || "";
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

  // Measure the rendered number width so the $ can "stick" to the top-left of the number
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
      navigate("/profitability");
      return;
    }
    setStepIdx((s) => Math.max(0, s - 1));
  };

  const goNext = () => {
    if (stepIdx < steps.length - 1) {
      setStepIdx((s) => Math.min(steps.length - 1, s + 1));
      return;
    }
    // Done: go to report preview
    navigate("/report-card-test");
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gray-50">
      {/* Shared app header */}
      <Header />

      {/* Page body */}
      <div className="w-full flex items-center justify-center px-4 sm:px-4 lg:px-6 py-10">
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-100 px-6 py-10 sm:px-10 sm:py-12">
            {/* Growlio Logo */}
            <div className="flex justify-center mb-8">
              <img src={growlioLogo} alt="Growlio Logo" className="w-40 mx-auto" />
            </div>

            {/* Amount */}
            <div className="text-center">
              <div className="relative flex justify-center">
                {/* Invisible measurement span */}
                <span
                  ref={measureRef}
                  className="pointer-events-none absolute opacity-0 select-none whitespace-pre tabular-nums font-extrabold tracking-tight text-6xl sm:text-7xl leading-none"
                >
                  {displayValue || "0"}
                </span>

                {/* $ pinned to the top-left of the number (auto-adjusts as number grows) */}
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

              {/* slider (moves left->right to increase) */}
              <div className="mt-8 flex flex-col items-center">
                <div className="relative w-72 sm:w-80">
                  {/* track */}
                  <div className="h-2 bg-gray-200 rounded-full" />
                  {/* marker positioned by value */}
                  <div
                    className="absolute -bottom-2 w-1.5 h-6 bg-orange-500 rounded-full"
                    style={{
                      left: `${((numericValue - step.min) / (step.max - step.min || 1)) * 100}%`,
                      transform: "translateX(-50%)",
                    }}
                  />
                  {/* real slider (invisible but draggable) */}
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

            {/* Buttons */}
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
                className="px-7 py-2.5 rounded-md text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm"
              >
                {stepIdx === steps.length - 1 ? "Finish >" : "Next >"}
              </button>
            </div>


          </div>
            {/* Step dots + label */}
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={[
                      "h-2 w-2 rounded-full",
                      i <= stepIdx ? "bg-orange-500" : "bg-gray-300",
                    ].join(" ")}
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


