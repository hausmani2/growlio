import React from "react";
import Mask from "../../assets/pngs/new-onboard.png";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const DEFAULT_ITEMS = [
  "Create your account",
  "Enter one month of sales and expenses",
  "Add operating expenses",
  "Enter additional sales data",
  "Restaurant details",
  "Operating information",
  "Labor information",
  "COGs",
  "Add third-party delivery info",
  "Go to your budget",
];

/**
 * Matches the “Setup XX% Complete + checklist + right-side illustration” card UI.
 */
const SetupProgressCard = ({
  percent = 33,
  items = DEFAULT_ITEMS,
  // 1-based index, like the screenshot
  currentStep = 3,
  imageSrc = Mask,
  imageAlt = "Onboarding illustration",
}) => {
  const pct = clamp(Number(percent) || 0, 0, 100);
  const currentIdx = clamp(Number(currentStep) || 1, 1, items.length);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] px-6 py-6 sm:px-10 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
        {/* Left side */}
        <div>
          <div className="text-sm font-semibold text-gray-900">
            Setup {pct}% Complete
          </div>

          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden max-w-sm">
            <div
              className="h-full bg-lime-500 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>

          <ol className="mt-5 space-y-2 text-sm">
            {items.map((label, idx) => {
              const stepNum = idx + 1;
              const isDone = stepNum < currentIdx;
              const isCurrent = stepNum === currentIdx;

              return (
                <li key={stepNum} className="flex items-start gap-3">
                  <span
                    className={[
                      "w-5 text-right tabular-nums flex-shrink-0",
                      isCurrent ? "text-orange-600 font-semibold" : "text-gray-500",
                    ].join(" ")}
                  >
                    {stepNum}.
                  </span>
                  <span
                    className={[
                      "leading-5",
                      isDone ? "text-gray-400 line-through" : "",
                      isCurrent ? "text-orange-600 font-semibold" : "",
                      !isDone && !isCurrent ? "text-gray-900" : "",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Right side image */}
        <div className="flex items-center justify-center lg:justify-end">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full max-w-md h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default SetupProgressCard;


