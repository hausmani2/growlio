import React from "react";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const ArrowScribble = ({ className }) => (
  <svg
    viewBox="0 0 180 90"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M14 58c28-18 58-26 88-22 16 2 32 7 46 16"
      stroke="#111827"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <path
      d="M132 20c10 10 19 19 30 30-12 4-25 7-38 10"
      stroke="#111827"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const YourGradeCard = ({
  grade = "B",
  message = "Labor, COGs, and rent are too high.\nReduce to improve your grade.",
  setupPercent = 33,
  title = "Get the Most Out of Growlio",
  subtitle = "This is a great start! Enter more information to complete setup.",
  ctaLabel = "Continue",
  onContinue,
}) => {
  const pct = clamp(Number(setupPercent) || 0, 0, 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] px-6 py-7 sm:px-10 sm:py-8">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_1.35fr] gap-6 items-center">
        {/* Left */}
        <div className="text-center md:text-left flex flex-col items-center">
          <div className="text-2xl font-extrabold text-gray-900">Your Grade</div>
          <div className="mt-2 text-7xl sm:text-8xl font-extrabold text-orange-600 leading-none">
            {grade}
          </div>
          <div className="mt-3 text-xs text-gray-700 whitespace-pre-line max-w-xs mx-auto md:mx-0">
            {message}
          </div>
        </div>

        {/* Middle arrow */}
        <div className="flex items-center justify-center">
          <ArrowScribble className="w-24 sm:w-28 md:w-32" />
        </div>

        {/* Right */}
        <div className="flex flex-col items-center md:items-start">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between w-full mb-2">
              <div className="text-sm font-semibold text-gray-900 text-center flex-1">
                Setup {pct}% Complete
              </div>
            </div>

            {/* progress bar */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-lime-500 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="mt-4 text-2xl font-extrabold text-gray-900 text-center">
              {title}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-gray-700 text-center max-w-md">
              {subtitle}
            </div>

            <div className="mt-4 flex justify-center w-full">
              <button
                type="button"
                onClick={onContinue}
                className="px-10 py-2.5 rounded-lg bg-lime-500 hover:bg-lime-600 text-white font-bold text-sm shadow-sm transition-colors"
              >
                {ctaLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YourGradeCard;


