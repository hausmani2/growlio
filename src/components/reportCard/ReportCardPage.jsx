import React, { useState, useEffect, useRef, useMemo } from "react";
import { ReportCard, SetupProgressCard, YourGradeCard, DailyPerformanceCard } from "./index";
import useStore from "../../store/store";
import LoadingSpinner from "../layout/LoadingSpinner";
import { message } from "antd";
import { getOnboardingProgress } from "../../utils/onboardingUtils";
import dayjs from "dayjs";

// Calculate grade based on score - moved outside component to avoid hoisting issues
const getGradeFromScore = (score) => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
};

// Generate message based on score - moved outside component
const getMessageFromScore = (score) => {
  if (score >= 80) {
    return "Great job! Your restaurant is performing well.\nKeep up the excellent work!";
  } else if (score >= 60) {
    return "You're on the right track!\nFocus on optimizing labor, COGs, and rent to improve your grade.";
  } else {
    return "Labor, COGs, and rent are too high.\nReduce to improve your grade.";
  }
};

const ReportCardPage = () => {
  const [showSetupProgress, setShowSetupProgress] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(1, 'month').startOf('month'),
    dayjs().subtract(1, 'month').endOf('month'),
  ]);
  
  const { 
    getSalesInformationSummary, 
    salesInformationSummary, 
    salesInformationSummaryLoading,
    salesInformationSummaryError,
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
        console.error("❌ [ReportCardPage] Error calculating progress from cache:", error);
        return null;
      }
    }
    return null;
  }, [restaurantOnboardingData]);

  // State to hold progress from API calls (will be merged with cached progress)
  const [fetchedOnboardingProgress, setFetchedOnboardingProgress] = useState(null);

  // Use cached progress if available, otherwise use fetched progress
  const onboardingProgress = cachedOnboardingProgress || fetchedOnboardingProgress;

  // Fetch sales information summary when date range changes
  const fetchSummaryData = async (startDate, endDate) => {
    try {
      await getSalesInformationSummary(startDate, endDate);
    } catch (error) {
      console.error("Error fetching sales summary:", error);
      message.error("Failed to load report card data");
    }
  };

  // Fetch sales information summary and onboarding data on mount
  useEffect(() => {
    const fetchData = async () => {
      // Fetch sales information summary with initial date range
      if (!hasFetchedRef.current) {
        if (!summaryData && !salesInformationSummaryLoading) {
          hasFetchedRef.current = true;
          await fetchSummaryData(dateRange[0], dateRange[1]);
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
            console.warn("⚠️ [ReportCardPage] API call failed or no data:", result);
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
          console.error("❌ [ReportCardPage] Error fetching onboarding progress:", error);
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

  // Fetch data when date range changes
  useEffect(() => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      fetchSummaryData(dateRange[0], dateRange[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // Show loading while fetching data
  if (salesInformationSummaryLoading && !summaryData) {
    return <LoadingSpinner message="Loading report card..." />;
  }

  // Extract and map data from API response
  // API response structure: { restaurant_id, start_date, end_date, summary: { sales, expenses, labour, cogs, profit, overall_score, grade } }
  const apiSummary = summaryData?.summary || summaryData;
  
  // Check if API returned an error message like "Insufficient Data"
  const hasError = salesInformationSummaryError === "Insufficient Data" ||
                   summaryData?.message === "Insufficient Data" || 
                   summaryData?.error === "Insufficient Data" ||
                   apiSummary?.message === "Insufficient Data" ||
                   apiSummary?.error === "Insufficient Data" ||
                   !apiSummary || 
                   !summaryData;
  
  // Map API response to component props
  // Clamp score to 0-100 range (API might return 1000, which should be 100)
  // If there's an error or insufficient data, set score to 0
  const rawScore = hasError ? 0 : (apiSummary?.overall_score || summaryData?.overall_score || summaryData?.score || summaryData?.profitability_score || 0);
  const score = Math.min(100, Math.max(0, rawScore)); // Clamp between 0 and 100
  const grade = apiSummary?.grade || getGradeFromScore(score);
  
  // Extract grade details from API response
  const gradeDetails = apiSummary?.grade_details || summaryData?.grade_details || null;
  
  // Map goals from API response - use sales_information_goal if available
  const salesInfoGoal = summaryData?.sales_information_goal || apiSummary?.sales_information_goal;
  const goals = {
    labor: salesInfoGoal?.labour || salesInfoGoal?.labor || apiSummary?.labour?.goal || apiSummary?.labor?.goal || 18,
    cogs: salesInfoGoal?.cogs || apiSummary?.cogs?.goal || 16,
    rent: salesInfoGoal?.expenses || apiSummary?.expenses?.goal || 10,
  };
  
  // Map metrics from API response - ensure all values are properly extracted
  // Note: percentage prop in MiniGauge is actually the score, deltaPct prop is the percentage
  const metrics = {
    labor: {
      value: Number(apiSummary?.labour?.value) || Number(apiSummary?.labor?.value) || 0,
      percentage: Number(apiSummary?.labour?.score) || Number(apiSummary?.labor?.score) || 0, // score goes to percentage prop
      amount: Number(apiSummary?.labour?.value) || Number(apiSummary?.labor?.value) || 0,
      deltaPct: Number(apiSummary?.labour?.percentage) || Number(apiSummary?.labor?.percentage) || 0, // percentage goes to deltaPct prop
    },
    cogs: {
      value: Number(apiSummary?.cogs?.value) || 0,
      percentage: Number(apiSummary?.cogs?.score) || 0, // score goes to percentage prop
      amount: Number(apiSummary?.cogs?.value) || 0,
      deltaPct: Number(apiSummary?.cogs?.percentage) || 0, // percentage goes to deltaPct prop
    },
    rent: {
      value: Number(apiSummary?.expenses?.value) || 0,
      percentage: Number(apiSummary?.expenses?.score) || 0, // score goes to percentage prop
      amount: Number(apiSummary?.expenses?.value) || 0,
      deltaPct: Number(apiSummary?.expenses?.percentage) || 0, // percentage goes to deltaPct prop
    },
  };
  
  // Map summary from API response - ensure sales and profit are properly extracted
  const summary = {
    sales: Number(apiSummary?.sales) || Number(summaryData?.sales) || 0,
    profit: Number(apiSummary?.profit) || Number(summaryData?.profit) || 0,
  };

  // Get dynamic onboarding progress data
  const completionPercentage = onboardingProgress?.completionPercentage ?? 0;
  const currentStep = onboardingProgress?.currentStep ?? 1;
  const setupItems = onboardingProgress?.items ?? [];
  const restaurant = onboardingProgress?.restaurant;
  const isOnboardingComplete = restaurant?.onboarding_complete === true;
  

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
          onDateRangeChange={setDateRange}
          loading={salesInformationSummaryLoading}
          gradeDetails={gradeDetails}
          showNextSteps={!isOnboardingComplete}
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

export default ReportCardPage;
