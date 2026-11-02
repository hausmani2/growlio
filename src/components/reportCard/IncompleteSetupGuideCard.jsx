import React, { useMemo } from "react";
import { CheckCircleFilled, LockOutlined } from "@ant-design/icons";
import lioMascot from "../../assets/pngs/lio-mascot.png";
import { RESTAURANT_STATUS_KEYS } from "../../utils/onboardingUtils";

const STEP_DEFS = [
  {
    id: "company",
    title: "Company Details",
    keys: [
      RESTAURANT_STATUS_KEYS.CREATE_ACCOUNT,
      RESTAURANT_STATUS_KEYS.BASIC_INFORMATION,
    ],
    bulletsDone: ["Restaurant name", "Restaurant type", "Address & contact"],
    bulletsTodo: ["Add restaurant details to personalize your score"],
  },
  {
    id: "menu",
    title: "Menu & Food Information",
    keys: [RESTAURANT_STATUS_KEYS.FOOD_COST_DETAILS],
    bulletsDone: ["COGS / food cost details"],
    bulletsTodo: ["Enter the food-cost fields required for targets"],
  },
  {
    id: "budget",
    title: "Set Your Targets & Budget",
    keys: [
      RESTAURANT_STATUS_KEYS.ONE_MONTH_SALES_INFO,
      RESTAURANT_STATUS_KEYS.SALES_INFORMATION,
      RESTAURANT_STATUS_KEYS.EXPENSE,
      RESTAURANT_STATUS_KEYS.OPERATING_INFORMATION,
      RESTAURANT_STATUS_KEYS.LABOUR_INFORMATION,
      RESTAURANT_STATUS_KEYS.THIRD_PARTY_INFO,
    ],
    bulletsDone: ["Sales history", "Labor & expenses", "Operating targets"],
    bulletsTodo: ["Finish sales, labor, expenses, and operating info"],
  },
  {
    id: "pos",
    title: "Connect Your POS",
    keys: [RESTAURANT_STATUS_KEYS.CONNECT_POS],
    optional: true,
    bulletsDone: ["POS connected"],
    bulletsTodo: ["Optional paid upgrade — skip and stay on Free"],
  },
  {
    id: "done",
    title: "You're All Set!",
    keys: [],
    bulletsDone: [
      "Personalized Report Card",
      "Daily close-out & budget",
      "LIO Action Plan & insights",
    ],
    bulletsTodo: ["Complete the required steps above to unlock everything"],
  },
];

const buildGuidedSteps = (items = []) => {
  const byKey = new Map(
    (Array.isArray(items) ? items : [])
      .filter((item) => item?.key)
      .map((item) => [item.key, item])
  );

  const requiredDefs = STEP_DEFS.filter((step) => step.id !== "done");
  const requiredComplete = requiredDefs
    .filter((step) => !step.optional)
    .every((step) =>
      step.keys.every((key) => byKey.get(key)?.isCompleted === true)
    );

  return STEP_DEFS.map((step) => {
    if (step.id === "done") {
      return {
        ...step,
        isCompleted: requiredComplete,
        isCurrent: requiredComplete,
      };
    }
    const related = step.keys
      .map((key) => byKey.get(key))
      .filter(Boolean);
    const isCompleted =
      related.length > 0 && related.every((item) => item.isCompleted === true);
    return {
      ...step,
      isCompleted,
      related,
    };
  }).map((step, index, all) => {
    if (step.id === "done") return step;
    const firstIncomplete = all.findIndex(
      (s) => s.id !== "done" && !s.optional && !s.isCompleted
    );
    return {
      ...step,
      isCurrent: firstIncomplete === index,
    };
  });
};

const IncompleteSetupGuideCard = ({
  items = [],
  setupPercent = 0,
  onContinue,
  onWatchSetupVideo,
}) => {
  const steps = useMemo(() => buildGuidedSteps(items), [items]);
  const pct = Math.min(100, Math.max(0, Number(setupPercent) || 0));
  const started = pct > 0;
  const ctaLabel = started ? "Continue Setup →" : "Get Started with Setup →";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className="p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <div className="flex-1 w-full min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 m-0">
                  Let&apos;s Set Up Your Restaurant
                </h2>
                <p className="text-sm text-gray-600 mt-2 mb-0 max-w-xl">
                  Setup unlocks your budget, daily close-outs, personalized LIO
                  recommendations, and the full Report Card. Your progress is saved.
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Setup progress
                </div>
                <div className="text-2xl font-extrabold text-orange-600 leading-none mt-1">
                  {pct}%
                </div>
              </div>
            </div>

            <div className="mt-4 h-2.5 bg-gray-100 rounded-full overflow-hidden max-w-xl">
              <div
                className="h-full bg-[#FF8132] rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>

            <ol className="mt-6 space-y-4">
              {steps.map((step, index) => {
                const tone = step.isCompleted
                  ? "border-orange-200 bg-orange-50/60"
                  : step.isCurrent
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-100 bg-gray-50";
                const bullets = step.isCompleted
                  ? step.bulletsDone
                  : step.bulletsTodo;
                return (
                  <li
                    key={step.id}
                    className={`rounded-xl border px-4 py-3 ${tone}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {step.isCompleted ? (
                          <CheckCircleFilled className="text-orange-500 text-lg" />
                        ) : step.optional ? (
                          <LockOutlined className="text-gray-400 text-base" />
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 text-[11px] font-bold text-gray-600">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">
                            {index + 1}. {step.title}
                          </span>
                          {step.optional ? (
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                              Upgrade to enable
                            </span>
                          ) : null}
                          {step.isCurrent && !step.isCompleted ? (
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-700 bg-white border border-orange-200 rounded-full px-2 py-0.5">
                              Next
                            </span>
                          ) : null}
                        </div>
                        <ul className="mt-2 space-y-1">
                          {bullets.map((line) => (
                            <li
                              key={line}
                              className="text-sm text-gray-700 flex items-start gap-2"
                            >
                              <span className="text-orange-500 mt-0.5">
                                {step.isCompleted ? "✓" : "•"}
                              </span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#FF8132] hover:bg-[#EB5B00] text-white font-bold text-base shadow-sm transition-colors"
              >
                {ctaLabel}
              </button>
              <span className="text-xs text-gray-500">Takes about 5 minutes</span>
            </div>
          </div>

          <div className="w-full lg:w-56 flex-shrink-0 flex flex-col items-center justify-start gap-3">
            <img
              src={lioMascot}
              alt="LIO"
              className="w-40 sm:w-48 h-auto object-contain"
            />
            <p className="text-center text-sm font-semibold text-gray-800 m-0">
              LIO is ready when you are
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-5 sm:px-7 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-900">Need Help?</div>
          <div className="text-sm text-gray-600">
            Watch a short setup walkthrough, then pick up where you left off.
          </div>
        </div>
        <button
          type="button"
          onClick={onWatchSetupVideo}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50 font-medium text-sm transition-colors"
        >
          Watch Setup Video
        </button>
      </div>
    </div>
  );
};

export default IncompleteSetupGuideCard;
