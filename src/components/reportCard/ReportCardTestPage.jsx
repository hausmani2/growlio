import React, { useState } from "react";
import { ReportCard, SetupProgressCard, YourGradeCard } from "./index";

const ReportCardTestPage = () => {
  const [showSetupProgress, setShowSetupProgress] = useState(false);

  return (
    <div className="py-4 w-full">
      <div className="w-full flex flex-col gap-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Report Card Test</h1>
          <p className="text-sm text-gray-600">
            Temporary route to preview the Recharts report card component.
          </p>
        </div>

        <ReportCard
          score={85}
          goals={{ labor: 30, cogs: 32, rent: 10 }}
          metrics={{
            labor: { value: 38, amount: 15000, deltaPct: 13 },
            cogs: { value: 31, amount: 12000, deltaPct: 6 },
            rent: { value: 18, amount: 7000, deltaPct: -2 },
          }}
          summary={{ sales: 40000, profit: 6000 }}
        />
        {!showSetupProgress ? (
          <YourGradeCard
            grade="B"
            setupPercent={33}
            message={"Labor, COGs, and rent are too high.\nReduce to improve your grade."}
            title="Get the Most Out of Growlio"
            subtitle="This is a great start! Enter more information to complete setup."
            ctaLabel="Continue"
            onContinue={() => setShowSetupProgress(true)}
          />
        ) : (
          <SetupProgressCard percent={33} currentStep={3} />
        )}
      </div>
    </div>
  );
};

export default ReportCardTestPage;


