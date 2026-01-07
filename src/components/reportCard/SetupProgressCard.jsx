import React from "react";
import { useNavigate } from "react-router-dom";
import Mask from "../../assets/pngs/new-onboard.png";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Map item labels to their corresponding routes (fallback for static items)
const ITEM_ROUTES = {
  "Add operating expenses": "/dashboard/expense",
  "Enter additional sales data": "/dashboard/sales-data",
  "Restaurant details": "/dashboard/basic-information",
  "Operating information": "/dashboard/sales-channels",
  "Labor information": "/dashboard/labor-information",
  "COGs": "/dashboard/food-cost-details",
  "Add third-party delivery info": "/dashboard/third-party-delivery",
  "Go to your budget": "/dashboard/budget",
  "Enter one month of sales and expenses": "/onboarding/profitability",
};

/**
 * Matches the "Setup XX% Complete + checklist + right-side illustration" card UI.
 * Now supports dynamic items with completion status from API.
 */
const SetupProgressCard = ({
  percent = 33,
  items = [], // Array of items with { label, isCompleted, route, order }
  // 1-based index, like the screenshot
  currentStep = 3,
  imageSrc = Mask,
  imageAlt = "Onboarding illustration",
}) => {
  const navigate = useNavigate();
  const pct = clamp(Number(percent) || 0, 0, 100);
  
  // Sort items by order if provided
  const sortedItems = items.length > 0 
    ? [...items].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  
  const currentIdx = clamp(Number(currentStep) || 1, 1, sortedItems.length || 1);

  const handleItemClick = (item) => {
    // Use route from item object, or fallback to ITEM_ROUTES
    const route = item.route || ITEM_ROUTES[item.label];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-3">
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
            {sortedItems.length > 0 ? (
              sortedItems.map((item, idx) => {
                const stepNum = idx + 1;
                // Use isCompleted from API if available, otherwise use step comparison
                const isDone = item.isCompleted !== undefined 
                  ? item.isCompleted 
                  : stepNum < currentIdx;
                const isCurrent = !isDone && stepNum === currentIdx;
                const hasRoute = item.route || ITEM_ROUTES[item.label];
                const isClickable = hasRoute && !isDone;

                return (
                  <li key={item.order || stepNum} className="flex items-start gap-3">
                    <span
                      className={[
                        "w-5 text-right tabular-nums flex-shrink-0",
                        isCurrent ? "text-orange-600 font-semibold" : "text-gray-500",
                      ].join(" ")}
                    >
                      {stepNum}.
                    </span>
                    <span
                      onClick={() => isClickable && handleItemClick(item)}
                      className={[
                        "leading-5",
                        isDone ? "text-gray-400 line-through" : "",
                        isCurrent ? "text-orange-600 font-semibold" : "",
                        !isDone && !isCurrent ? "text-gray-900" : "",
                        isClickable ? "cursor-pointer hover:text-orange-600 hover:underline transition-colors" : "",
                      ].join(" ")}
                    >
                      {item.label}
                    </span>
                  </li>
                );
              })
            ) : (
              // Fallback if no items provided
              <li className="text-gray-500">No setup items available</li>
            )}
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


