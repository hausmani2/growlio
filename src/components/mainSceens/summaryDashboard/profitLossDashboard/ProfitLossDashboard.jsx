import React, { useState, useEffect, useCallback } from 'react';
import { Card, Spin, Alert, Empty, Button } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { apiGet } from '../../../../utils/axiosInterceptors';
import useStore from '../../../../store/store';
import CalendarUtils from '../../../../utils/CalendarUtils';
import useCalendar from '../../../../utils/useCalendar';
import ProfitLossTableDashboard from './ProfitLossTableDashboard';
import BudgetDashboard from '../BudgetDashboard';

/**
 * ProfitLossDashboard Component
 * 
 * Displays the profit and loss dashboard with comprehensive financial data.
 * This component handles loading states, error states, and data presentation
 * for both weekly and monthly view modes.
 * 
 * @component
 * @example
 * ```jsx
 * <ProfitLossDashboard />
 * ```
 */
const ProfitLossDashboard = () => {
  const navigate = useNavigate();

  // Get data from the store
  const {
    dashboardSummaryData,
    loading: summaryLoading,
    error: summaryError,
    currentViewMode: viewMode,
    fetchDashboardSummary
  } = useStore();

  // Use the calendar hook for state management
  const calendarState = useCalendar({
    initialViewMode: viewMode || 'weekly'
  });

  // Local states - same as SummaryDashboard
  const [showFlashMessage, setShowFlashMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState('weekly');

  // Helper function to find the current week based on current date - same as SummaryDashboard
  const findCurrentWeek = (weeks, currentDate) => {
    if (!weeks || !currentDate || weeks.length === 0) return null;

    for (const week of weeks) {
      const startDate = dayjs(week.startDate);
      const endDate = dayjs(week.endDate);

      // Check if current date falls within this week's range (inclusive)
      const currentDateStr = currentDate.format('YYYY-MM-DD');
      const startDateStr = startDate.format('YYYY-MM-DD');
      const endDateStr = endDate.format('YYYY-MM-DD');

      if (currentDateStr >= startDateStr && currentDateStr <= endDateStr) {
        return week.key;
      }
    }

    return null;
  };

  // Fetch calendar data for selected year and month - same as SummaryDashboard
  const fetchCalendarData = useCallback(async (year, month, shouldAutoSelectWeek = false) => {
    if (!year || !month) return;

    setLoading(true);
    try {
      console.log(`Fetching calendar data for year: ${year}, month: ${month}`);
      const response = await apiGet(`/restaurant/structured-calendar/?month=${month}&year=${year}`);

      console.log('Calendar API response:', response);

      // Extract weeks from the response
      if (response.data && response.data.weeks) {
        const weeks = Object.keys(response.data.weeks).map(weekKey => ({
          key: weekKey,
          weekNumber: response.data.weeks[weekKey].week_number,
          startDate: response.data.weeks[weekKey].start_date,
          endDate: response.data.weeks[weekKey].end_date,
          data: response.data.weeks[weekKey]
        }));

        console.log('Processed weeks:', weeks);
        calendarState.setAvailableWeeks(weeks);

        // Auto-select current week if requested
        if (shouldAutoSelectWeek) {
          const currentDate = dayjs();
          console.log('Current date:', currentDate.format('YYYY-MM-DD'));
          const currentWeekKey = findCurrentWeek(weeks, currentDate);
          console.log('Found current week key:', currentWeekKey);
          if (currentWeekKey) {
            calendarState.setSelectedWeek(currentWeekKey);
          }
        }
      } else {
        console.log('No weeks data in response');
        calendarState.setAvailableWeeks([]);
      }

    } catch (error) {
      console.error('Error fetching calendar data:', error);
      calendarState.setAvailableWeeks([]);
    } finally {
      setLoading(false);
    }
  }, [calendarState.setAvailableWeeks, calendarState.setSelectedWeek]);

  // Helper function to check if we have valid data
  const hasValidData = () => {
    if (!dashboardSummaryData) return false;
    if (dashboardSummaryData.status !== 'success') return false;
    if (!dashboardSummaryData.data || !Array.isArray(dashboardSummaryData.data)) return false;
    return dashboardSummaryData.data.length > 0;
  };

  // Helper function to get selected week data - same as SummaryDashboard
  const getSelectedWeekData = () => {
    if (!calendarState.selectedWeek || !calendarState.availableWeeks.length) return null;
    return calendarState.availableWeeks.find(week => week.key === calendarState.selectedWeek);
  };

  // Fetch summary data for selected week - same as SummaryDashboard
  const fetchSummaryData = useCallback(async (weekKey) => {
    console.log('fetchSummaryData called with weekKey:', weekKey);
    if (!weekKey) {
      console.log('No weekKey provided, returning');
      return;
    }

    console.log('Available weeks:', calendarState.availableWeeks);
    const selectedWeekData = calendarState.availableWeeks.find(week => week.key === weekKey);
    console.log('Selected week data found:', selectedWeekData);

    if (selectedWeekData) {
      const weekStartDate = selectedWeekData.startDate;
      console.log(`Fetching dashboard summary for week starting: ${weekStartDate}`);
      console.log('Selected week data:', selectedWeekData);
      console.log('Week start date type:', typeof weekStartDate);
      console.log('Week start date value:', weekStartDate);

      try {
        const result = await fetchDashboardSummary(weekStartDate);
        console.log('fetchDashboardSummary result:', result);
      } catch (error) {
        console.error('Error in fetchDashboardSummary:', error);
      }
    } else {
      console.error('No selected week data found for key:', weekKey);
      console.log('Available weeks keys:', calendarState.availableWeeks.map(w => w.key));
    }
  }, [calendarState.availableWeeks, fetchDashboardSummary]);

  // Fetch monthly dashboard summary data - same as SummaryDashboard
  // Monthly flow removed (weekly-only)

  // Handle year selection - same as SummaryDashboard
  const handleYearChange = (year) => {
    calendarState.handleYearChange(year);
  };

  // Handle month selection - same as SummaryDashboard
  const handleMonthChange = (month) => {
    calendarState.setSelectedMonth(month);
    if (calendarState.selectedYear) {
      fetchCalendarData(calendarState.selectedYear, month, true);
    }
  };

  // Handle week selection - same as SummaryDashboard
  const handleWeekChange = (weekKey) => {
    calendarState.handleWeekChange(weekKey);
    // Fetch dashboard summary data when week is selected
    fetchSummaryData(weekKey);
  };

  // Handle group by selection
  const handleGroupByChange = (groupByValue) => {
    setGroupBy(groupByValue);
    // You can add logic here to handle different grouping modes
    console.log('Group by changed to:', groupByValue);
  };

  // View mode removed (weekly-only)

  // Handle flash message button click - same as SummaryDashboard
  const handleFlashMessageButtonClick = () => {
    if (calendarState.viewMode === 'weekly') {
      const selectedWeekData = getSelectedWeekData();

      if (selectedWeekData) {
        // Store navigation context for the Dashboard component
        const navigationContext = {
          selectedDate: selectedWeekData.startDate,
          selectedWeek: calendarState.selectedWeek,
          selectedYear: calendarState.selectedYear,
          selectedMonth: calendarState.selectedMonth,
          shouldOpenSalesModal: true,
          source: 'profit-loss-dashboard'
        };

        // Store in localStorage for Dashboard component to access
        localStorage.setItem('dashboardNavigationContext', JSON.stringify(navigationContext));

        // Navigate to dashboard
        navigate('/dashboard');
      }
    } else if (calendarState.viewMode === 'monthly') {
      // For monthly view, navigate with month context
      const navigationContext = {
        selectedYear: calendarState.selectedYear,
        selectedMonth: calendarState.selectedMonth,
        shouldOpenSalesModal: true,
        source: 'profit-loss-dashboard',
        viewMode: 'monthly'
      };
      localStorage.setItem('dashboardNavigationContext', JSON.stringify(navigationContext));
      navigate('/dashboard');
    }
  };

  // Auto-fetch data when week changes
  useEffect(() => {
    if (calendarState.selectedWeek && calendarState.availableWeeks.length > 0) {
      fetchSummaryData(calendarState.selectedWeek);
    }
  }, [calendarState.selectedWeek, calendarState.availableWeeks, fetchSummaryData]);

  // Monthly data flow removed

  // Show flash message when data exists - same as SummaryDashboard
  useEffect(() => {
    if (dashboardSummaryData && dashboardSummaryData.data && dashboardSummaryData.data.length > 0) {
      setShowFlashMessage(true);
    } else {
      setShowFlashMessage(false);
    }
  }, [dashboardSummaryData]);

  // Initialize calendar data on component mount
  useEffect(() => {
    if (calendarState.selectedYear && calendarState.selectedMonth && calendarState.viewMode === 'weekly') {
      fetchCalendarData(calendarState.selectedYear, calendarState.selectedMonth, true);
    }
  }, [calendarState.selectedYear, calendarState.selectedMonth, calendarState.viewMode, fetchCalendarData]);

  // Error state - show at top if there's an error
  const errorAlert = summaryError ? (
    <Alert
      message="Error Loading Profit & Loss Data"
      description={summaryError}
      type="error"
      showIcon
      className="mb-4"
    />
  ) : null;

  return (
    <div className="w-full">
      <div className="w-full mx-auto space-y-4">
        {/* Error Alert - show at top if there's an error */}
        {errorAlert}

        {/* Calendar Component - weekly-only */}
        <CalendarUtils
          selectedYear={calendarState.selectedYear}
          selectedMonth={calendarState.selectedMonth}
          selectedWeek={calendarState.selectedWeek}
          availableWeeks={calendarState.availableWeeks}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
          onWeekChange={handleWeekChange}
          onGroupByChange={handleGroupByChange}
          groupBy={groupBy}
          loading={loading}
          error={null}
          title="Profit & Loss Dashboard"
          description="Track your profit and loss performance"
          showFlashMessage={showFlashMessage}
          onFlashMessageClick={handleFlashMessageButtonClick}
        />

        {/* Show dashboard components when a week is selected */}
        {calendarState.selectedWeek ? (
          <>
            {(() => {
              console.log('Conditional rendering check:', {
                selectedWeek: calendarState.selectedWeek,
                selectedYear: calendarState.selectedYear,
                selectedMonth: calendarState.selectedMonth,
                summaryLoading,
                hasNoData: hasValidData(),
                shouldShowLoading: summaryLoading,
                shouldShowEmpty: !summaryLoading && !hasValidData(),
                shouldShowDashboard: !summaryLoading && hasValidData()
              });

              // Always show loading first if still loading
              if (summaryLoading) {
                return (
                  <Card>
                    <div className="text-center py-8">
                      <Spin size="large" />
                      <p className="mt-4 text-gray-600">Loading profit and loss data...</p>
                    </div>
                  </Card>
                );
              }

              // After loading is complete, check if we have data
              const noData = !hasValidData();
              if (noData) {
                return (
                  <Card>
                    <div className="text-center py-8">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <div>
                            <p className="text-gray-600 mb-4">
                              {dashboardSummaryData?.message || 'No weekly profit and loss data found for the selected week.'}
                            </p>
                          </div>
                        }
                      />
                    </div>
                  </Card>
                );
              } else {
                return (
                  <div className="space-y-4">
                  {/* Profit Loss Table - First */}
                  <div>

                  <ProfitLossTableDashboard
                    dashboardData={dashboardSummaryData}
                    loading={summaryLoading}
                    error={summaryError}
                    viewMode={'weekly'}
                  />
                  </div>
                  <div>

                  
                       {/* Budget Dashboard - Second */}
                       <BudgetDashboard
                       dashboardData={dashboardSummaryData}
                       loading={summaryLoading}
                       error={summaryError}
                       onEditData={() => {
                         // Navigate to dashboard for editing
                         const selectedWeekData = getSelectedWeekData();
                         if (selectedWeekData) {
                           const navigationContext = {
                             selectedDate: selectedWeekData.startDate,
                             selectedWeek: calendarState.selectedWeek,
                             selectedYear: calendarState.selectedYear,
                             selectedMonth: calendarState.selectedMonth,
                             shouldOpenSalesModal: true,
                             source: 'summary-dashboard'
                           };
                           localStorage.setItem('dashboardNavigationContext', JSON.stringify(navigationContext));
                           navigate('/dashboard');
                         }
                       }}
                       viewMode={'weekly'}
                     />
                     </div>
                     </div>
                );
              }
            })()}
          </>
        ) : (
          <Card>
            <div className="text-center py-8">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  !calendarState.selectedWeek
                    ? 'Please select a week to view profit and loss data.'
                    : 'No profit and loss data available for the selected period.'
                }
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfitLossDashboard;