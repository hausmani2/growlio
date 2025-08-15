import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Spin, Alert, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
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
    fetchDashboardSummary
  } = useStore();

  // Use the new calendar hook for state management
  const calendar = useCalendar({
    autoSelectCurrentWeek: true
  });

  // Local states
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState('daily');

  // Use refs to prevent infinite loops
  const isInitialized = useRef(false);

  // Simplified data validation function
  const hasValidData = useCallback(() => {
    return dashboardSummaryData?.status === 'success' && 
           Array.isArray(dashboardSummaryData?.data) && 
           dashboardSummaryData.data.length > 0;
  }, [dashboardSummaryData]);

  // Fetch dashboard summary data for selected date range
  const fetchSummaryData = useCallback(async (startDate, endDate, groupBy = 'daily') => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      await fetchDashboardSummary(startDate, endDate, groupBy);
    } catch (error) {
      console.error('Error in fetchDashboardSummary:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardSummary]);

  // Handle date change from calendar
  const handleDateChange = useCallback((dates) => {
    console.log('ProfitLossDashboard: handleDateChange called with:', dates?.map(d => d?.format('YYYY-MM-DD')));
    
    // Update the calendar state first
    calendar.handleDateChange(dates);
    
    if (dates && dates.length === 2) {
      const startDate = dates[0].format('YYYY-MM-DD');
      const endDate = dates[1].format('YYYY-MM-DD');
      console.log('ProfitLossDashboard: Fetching data for:', startDate, 'to', endDate);
      fetchSummaryData(startDate, endDate, groupBy);
    }
  }, [calendar, fetchSummaryData, groupBy]);

  // Handle group by selection
  const handleGroupByChange = useCallback((groupByValue) => {
    setGroupBy(groupByValue);
    // Refetch data with new group by if we have a date range
    if (calendar.dateRange && calendar.dateRange.length === 2) {
      const startDate = calendar.dateRange[0].format('YYYY-MM-DD');
      const endDate = calendar.dateRange[1].format('YYYY-MM-DD');
      fetchSummaryData(startDate, endDate, groupByValue);
    }
  }, [calendar.dateRange, fetchSummaryData]);



  // Initialize dashboard (only once)
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
  }, []);





  // Error Alert - show at top if there's an error
  const errorAlert = summaryError ? (
    <Alert
      message="Error Loading Data"
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

        {/* Calendar Component - new system */}
        {console.log('ProfitLossDashboard render - calendar.dateRange:', calendar.dateRange?.map(d => d?.format('YYYY-MM-DD')))}
        <CalendarUtils
          selectedDates={calendar.dateRange}
          onDateChange={handleDateChange}
          groupBy={groupBy}
          onGroupByChange={handleGroupByChange}
          title="Profit & Loss Dashboard"
          description="Track your profit and loss performance"
          loading={loading}
          error={calendar.error}
        />

        {/* Show dashboard components when a date range is selected */}
        {calendar.dateRange && calendar.dateRange.length === 2 ? (
          <>
            {(() => {
              console.log('Conditional rendering check:', {
                dateRange: calendar.dateRange,
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
                              {dashboardSummaryData?.message || 'No weekly profit and loss data found for the selected date range.'}
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
                         navigate('/dashboard');
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
                description="Please select a date range to view profit and loss data"
              />
            </div>
          </Card>
        )}

      </div>
    </div>
  );
};

export default ProfitLossDashboard;