import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Spin, Alert, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../../store/store';
import CalendarUtils from '../../../../utils/CalendarUtils';
import dayjs from 'dayjs';

import ProfitLossTableDashboard from './ProfitLossTableDashboard';
import BudgetDashboard from '../BudgetDashboard';
import ProfitLossCategoryPie from './ProfitLossCategoryPie';
import ProfitLossTrendLine from './ProfitLossTrendLine';
import { printUtils } from '../../../../utils/printUtils';

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

  // Use local state for calendar to prevent infinite loops
  const [calendarDateRange, setCalendarDateRange] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState(null);
  
  // Local states - declare groupBy before useEffect that uses it
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState('daily');

  // Initialize with current week or current year based on groupBy
  useEffect(() => {
    if (calendarDateRange.length === 0) {
      if (groupBy === 'annual') {
        const currentYear = dayjs().year();
        setCalendarDateRange([dayjs().year(currentYear).startOf('year'), dayjs().year(currentYear).endOf('year')]);
      } else {
        const startOfWeek = dayjs().startOf('week');
        const endOfWeek = dayjs().endOf('week');
        setCalendarDateRange([startOfWeek, endOfWeek]);
      }
    }
  }, [calendarDateRange.length, groupBy]);

  // Calendar functions
  const handleCalendarDateChange = useCallback((dates) => {
    setCalendarDateRange(dates);
    setCalendarError(null);
  }, []);

  const selectThisWeek = useCallback(() => {
    const startOfWeek = dayjs().startOf('week');
    const endOfWeek = dayjs().endOf('week');
    const newRange = [startOfWeek, endOfWeek];
    setCalendarDateRange(newRange);
    setCalendarError(null);
    return newRange;
  }, []);

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
      // For annual mode, pass dayjs objects directly (they will be converted to years in the store)
      // For other modes, pass formatted date strings
      if (groupBy === 'annual') {
        await fetchDashboardSummary(startDate, endDate, groupBy);
      } else {
        const startDateStr = typeof startDate === 'string' ? startDate : startDate.format('YYYY-MM-DD');
        const endDateStr = typeof endDate === 'string' ? endDate : endDate.format('YYYY-MM-DD');
        await fetchDashboardSummary(startDateStr, endDateStr, groupBy);
      }
    } catch (error) {
      console.error('Error in fetchDashboardSummary:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardSummary]);

  // Handle date change from calendar
  const handleDateChange = useCallback((dates) => {
    // Update the calendar state first
    handleCalendarDateChange(dates);
    
    // Only trigger API call if we have valid dates
    if (dates && dates.length === 2 && dates[0] && dates[1]) {
      // For annual mode, pass dayjs objects directly
      // For other modes, format as date strings
      if (groupBy === 'annual') {
        // Ensure dates are dayjs objects with proper year boundaries
        const startYear = dates[0].startOf('year');
        const endYear = dates[1].endOf('year');
        fetchSummaryData(startYear, endYear, groupBy);
      } else {
        const startDate = dates[0].format('YYYY-MM-DD');
        const endDate = dates[1].format('YYYY-MM-DD');
        fetchSummaryData(startDate, endDate, groupBy);
      }
    }
  }, [handleCalendarDateChange, fetchSummaryData, groupBy]);

  // Handle group by selection
  const handleGroupByChange = useCallback((groupByValue) => {
    const previousGroupBy = groupBy;
    setGroupBy(groupByValue);
    
    // When switching to annual mode, set date range to current year and trigger API call
    if (groupByValue === 'annual') {
      const currentYear = dayjs().year();
      const newRange = [dayjs().year(currentYear).startOf('year'), dayjs().year(currentYear).endOf('year')];
      setCalendarDateRange(newRange);
      // Trigger API call with year values
      fetchSummaryData(newRange[0], newRange[1], groupByValue);
    } else if (previousGroupBy === 'annual') {
      // Switching from annual to another mode
      const startOfWeek = dayjs().startOf('week');
      const endOfWeek = dayjs().endOf('week');
      const newRange = [startOfWeek, endOfWeek];
      setCalendarDateRange(newRange);
      const startDate = newRange[0].format('YYYY-MM-DD');
      const endDate = newRange[1].format('YYYY-MM-DD');
      fetchSummaryData(startDate, endDate, groupByValue);
    } else {
      // Same mode type, just refetch with current date range
      if (calendarDateRange && calendarDateRange.length === 2) {
        const startDate = calendarDateRange[0].format('YYYY-MM-DD');
        const endDate = calendarDateRange[1].format('YYYY-MM-DD');
        fetchSummaryData(startDate, endDate, groupByValue);
      }
    }
  }, [calendarDateRange, fetchSummaryData, groupBy]);

  // Print handler - directly print report only
  const handlePrint = useCallback(() => {
    // Use dashboardSummaryData as the data source for printing
    const dataToUse = dashboardSummaryData?.data || dashboardSummaryData;
    printUtils.handleProfitLossPrint(dataToUse, dashboardSummaryData, dashboardSummaryData);
  }, [dashboardSummaryData]);


  // Initialize dashboard and fetch initial data
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    // Fetch initial data for current week or year
    if (calendarDateRange && calendarDateRange.length === 2) {
      // For annual mode, pass dayjs objects directly
      // For other modes, format as date strings
      if (groupBy === 'annual') {
        fetchSummaryData(calendarDateRange[0], calendarDateRange[1], groupBy);
      } else {
        const startDate = calendarDateRange[0].format('YYYY-MM-DD');
        const endDate = calendarDateRange[1].format('YYYY-MM-DD');
        fetchSummaryData(startDate, endDate, groupBy);
      }
    }
  }, [calendarDateRange, groupBy, fetchSummaryData]);





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

        {/* Header Section with Calendar (match Budget page) */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
            {/* Left Side - Title and Description */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-red-600 mb-2">Profit & Loss Dashboard</h1>
              <p className="text-gray-600 text-lg">Monitor your restaurant's financial performance and track budget vs. actual results</p>
            </div>

            {/* Right Side - Date Picker and Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <CalendarUtils
                selectedDates={calendarDateRange}
                onDateChange={handleDateChange}
                groupBy={groupBy}
                onGroupByChange={handleGroupByChange}
                title=""
                description=""
                loading={calendarLoading}
                error={calendarError}
                autoSelectCurrentWeek={true}
              />
            </div>
          </div>
        </div>

        {/* Show dashboard components when a date range is selected */}
        {calendarDateRange && calendarDateRange.length === 2 ? (
          <>
            {(() => {
              
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
                  {/* Profit & Loss Line + Category Pie side-by-side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {(() => {
                      
                      return <ProfitLossTrendLine dashboardData={dashboardSummaryData} viewMode={groupBy} />;
                    })()}
                    <ProfitLossCategoryPie
                      startDate={calendarDateRange?.[0]?.format('YYYY-MM-DD')}
                      endDate={calendarDateRange?.[1]?.format('YYYY-MM-DD')}
                    />
                  </div>
                  <div>
                    {/* Profit Loss Table - Second */}
                    <ProfitLossTableDashboard
                      dashboardData={dashboardSummaryData}
                      loading={summaryLoading}
                      error={summaryError}
                      viewMode={groupBy}
                      onPrint={handlePrint}
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