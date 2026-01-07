import React, { useState, useEffect, useRef, useMemo } from "react";
import { ReportCard, SetupProgressCard, YourGradeCard, DailyPerformanceCard } from "./index";
import useStore from "../../store/store";
import LoadingSpinner from "../layout/LoadingSpinner";
import { message } from "antd";
import { getOnboardingProgress } from "../../utils/onboardingUtils";

const ReportCardTestPage = () => {
  const [showSetupProgress, setShowSetupProgress] = useState(false);
  const { 
    getSalesInformationSummary, 
    salesInformationSummary, 
    salesInformationSummaryLoading,
    getRestaurantOnboarding,
    restaurantOnboardingData,
    restaurantOnboardingDataTimestamp
  } = useStore();
  const hasFetchedRef = useRef(false); // Prevent multiple API calls
  const hasFetchedOnboardingRef = useRef(false); // Prevent multiple onboarding API calls
  
  // Use summary data from store if available
  const summaryData = salesInformationSummary;

  // Calculate onboarding progress from cached store data
  // This prevents showing null state on re-renders by always using the latest cached data
  const cachedOnboardingProgress = useMemo(() => {
    if (restaurantOnboardingData) {
      try {
        const progress = getOnboardingProgress(restaurantOnboardingData);
        return progress;
      } catch (error) {
        console.error("❌ [ReportCardTestPage] Error calculating progress from cache:", error);
        return null;
      }
    }
    return null;
  }, [restaurantOnboardingData]);

  // State to hold progress from API calls (will be merged with cached progress)
  const [fetchedOnboardingProgress, setFetchedOnboardingProgress] = useState(null);

  // Use cached progress if available, otherwise use fetched progress
  const onboardingProgress = cachedOnboardingProgress || fetchedOnboardingProgress;

  // Fetch sales information summary and onboarding data on mount
  useEffect(() => {
    const fetchData = async () => {
      // Fetch sales information summary
      if (!hasFetchedRef.current) {
        if (!summaryData && !salesInformationSummaryLoading) {
          hasFetchedRef.current = true;
          try {
            await getSalesInformationSummary();
          } catch (error) {
            console.error("Error fetching sales summary:", error);
            message.error("Failed to load report card data");
            hasFetchedRef.current = false;
          }
        } else if (summaryData) {
          hasFetchedRef.current = true;
        }
      }

      // Fetch onboarding progress data - only if we don't have cached data or need refresh
      // Check if cached data is still fresh (less than 5 seconds old)
      const now = Date.now();
      const cacheAge = restaurantOnboardingDataTimestamp ? now - restaurantOnboardingDataTimestamp : Infinity;
      const CACHE_DURATION = 5000; // 5 seconds
      const hasFreshCache = restaurantOnboardingData && cacheAge < CACHE_DURATION;

      if (!hasFetchedOnboardingRef.current && !hasFreshCache) {
        hasFetchedOnboardingRef.current = true;
        try {
          // Force refresh to get latest data
          const result = await getRestaurantOnboarding(true);
              
          if (result.success && result.data) {
            
            const progress = getOnboardingProgress(result.data);
            setFetchedOnboardingProgress(progress);
          } else {
            console.warn("⚠️ [ReportCardTestPage] API call failed or no data:", result);
            // Only set default if we don't have cached data
            if (!cachedOnboardingProgress) {
              setFetchedOnboardingProgress({
                completionPercentage: 0,
                completedItems: [],
                currentStep: 1,
                items: [],
              });
            }
          }
        } catch (error) {
          console.error("❌ [ReportCardTestPage] Error fetching onboarding progress:", error);
          // Only set default if we don't have cached data
          if (!cachedOnboardingProgress) {
            setFetchedOnboardingProgress({
              completionPercentage: 0,
              completedItems: [],
              currentStep: 1,
              items: [],
            });
          }
        }
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch on mount only

  // Show loading while fetching data
  if (salesInformationSummaryLoading && !summaryData) {
    return <LoadingSpinner message="Loading report card..." />;
  }

  // Extract data from API response or use defaults
  const score = summaryData?.score || summaryData?.profitability_score || 85;
  const goals = summaryData?.goals || { labor: 30, cogs: 32, rent: 10 };
  const metrics = summaryData?.metrics || {
    labor: { value: 38, amount: 15000, deltaPct: 13 },
    cogs: { value: 31, amount: 12000, deltaPct: 6 },
    rent: { value: 18, amount: 7000, deltaPct: -2 },
  };
  const summary = summaryData?.summary || { sales: 40000, profit: 6000 };

  // Get dynamic onboarding progress data
  const completionPercentage = onboardingProgress?.completionPercentage ?? 0;
  const currentStep = onboardingProgress?.currentStep ?? 1;
  const setupItems = onboardingProgress?.items ?? [];
  const restaurant = onboardingProgress?.restaurant;
  const isOnboardingComplete = restaurant?.onboarding_complete === true;
  

  // Calculate grade based on score
  const getGradeFromScore = (score) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const grade = getGradeFromScore(score);

  // Generate message based on score
  const getMessageFromScore = (score) => {
    if (score >= 80) {
      return "Great job! Your restaurant is performing well.\nKeep up the excellent work!";
    } else if (score >= 60) {
      return "You're on the right track!\nFocus on optimizing labor, COGs, and rent to improve your grade.";
    } else {
      return "Labor, COGs, and rent are too high.\nReduce to improve your grade.";
    }
  };

  // Handle close out previous days button
  const handleCloseOutDays = () => {
    // TODO: Implement close out previous days functionality
    message.info("Close out previous days functionality will be implemented");
  };

  return (
    <div className="w-full mx-auto">
      <div className="w-full flex flex-col gap-3">
        <ReportCard
          score={score}
          goals={goals}
          metrics={metrics}
          summary={summary}
        />
        
        {/* Show Daily Performance Card when onboarding is complete */}
        {isOnboardingComplete ? (
          <DailyPerformanceCard onCloseOutDays={handleCloseOutDays} />
        ) : (
          <>
            {!showSetupProgress ? (
              <YourGradeCard
                grade={grade}
                setupPercent={completionPercentage}
                message={getMessageFromScore(score)}
                title="Get the Most Out of Growlio"
                subtitle="This is a great start! Enter more information to complete setup."
                ctaLabel="Continue"
                onContinue={() => setShowSetupProgress(true)}
              />
            ) : (
              <SetupProgressCard 
                percent={completionPercentage} 
                currentStep={currentStep}
                items={setupItems}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportCardTestPage;


