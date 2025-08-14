import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { Card, Typography, Space, Spin, Empty, Button, message, notification } from 'antd';
import { PlusOutlined, DollarOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/store';
import SummaryTableDashboard from './SummaryTableDashboard';
import BudgetDashboard from './BudgetDashboard';
import SalesDataModal from './SalesDataModal';
import CalendarUtils from '../../../utils/CalendarUtils';
import useCalendar from '../../../utils/useCalendar';
import { apiGet } from '../../../utils/axiosInterceptors';

const { Title } = Typography;

const SummaryDashboard = () => {
  const navigate = useNavigate();

  // Use the calendar utility hook (weekly-only)
  const calendarState = useCalendar({
    initialViewMode: 'weekly'
  });

  // Store integration for date selection persistence
  const {
    // Date selection from store - we'll sync with calendar state
    setSelectedYear,
    setSelectedMonth,
    setSelectedWeek,
    setAvailableWeeks
  } = useStore();

  // Local state for group by selection
  const [groupBy, setGroupBy] = useState('weekly');

  // Sync calendar state with store state
  useEffect(() => {
    if (calendarState.selectedYear) {
      setSelectedYear(calendarState.selectedYear);
    }
  }, [calendarState.selectedYear, setSelectedYear]);

  useEffect(() => {
    if (calendarState.selectedMonth) {
      setSelectedMonth(calendarState.selectedMonth);
    }
  }, [calendarState.selectedMonth, setSelectedMonth]);

  useEffect(() => {
    if (calendarState.selectedWeek) {
      setSelectedWeek(calendarState.selectedWeek);
    }
  }, [calendarState.selectedWeek, setSelectedWeek]);

  useEffect(() => {
    if (calendarState.availableWeeks.length > 0) {
      setAvailableWeeks(calendarState.availableWeeks);
    }
  }, [calendarState.availableWeeks, setAvailableWeeks]);

  // Local loading states - loading is now handled by CalendarUtils

  // Modal states
  const [isSalesModalVisible, setIsSalesModalVisible] = useState(false);
  const [hasManuallyClosedModal, setHasManuallyClosedModal] = useState(false);

  // Flash message state
  const [showFlashMessage, setShowFlashMessage] = useState(false);
  const [showSuccessFlashMessage, setShowSuccessFlashMessage] = useState(false);

  // Dashboard summary functionality
  const {
    fetchDashboardSummary,
    dashboardSummaryData,
    loading: summaryLoading,
    error: summaryError
  } = useStore();

  // Restaurant goals functionality
  const { getRestaurentGoal, restaurantGoals, restaurantGoalsLoading, restaurantGoalsError } = useStore();

  // Auth functionality for restaurant ID
  const { ensureRestaurantId } = useStore();

  // Note: Redirection logic is handled by ProtectedRoutes.jsx
  // No need to duplicate the redirect check here

  // Calendar data is now handled by CalendarUtils component

  // Calendar functions are now handled by CalendarUtils component

  // Fetch dashboard summary data for selected week
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

      // Reset the manual close flag when starting a new fetch
      setHasManuallyClosedModal(false);

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
  }, [calendarState.availableWeeks, fetchDashboardSummary, setHasManuallyClosedModal]);

  // Monthly flow removed (weekly-only)

  // Parent-level fetch for calendar weeks
  const fetchCalendarData = useCallback(async (year, month, shouldAutoSelectWeek = true) => {
    if (!year || !month) return;
    try {
      const response = await apiGet(`/restaurant/structured-calendar/?month=${month}&year=${year}`);
      if (response?.data?.weeks) {
        const weeks = Object.keys(response.data.weeks).map(weekKey => ({
          key: weekKey,
          weekNumber: response.data.weeks[weekKey].week_number,
          startDate: response.data.weeks[weekKey].start_date,
          endDate: response.data.weeks[weekKey].end_date,
          data: response.data.weeks[weekKey]
        }));

        // Set available weeks
        calendarState.setAvailableWeeks(weeks);

        // Auto-select week
        if (shouldAutoSelectWeek && weeks.length > 0) {
          const now = dayjs();
          const isCurrentMonth = (now.month() + 1) === month && now.year() === year;
          let weekToSelect = null;
          if (isCurrentMonth) {
            const todayStr = now.format('YYYY-MM-DD');
            const found = weeks.find(w => todayStr >= dayjs(w.startDate).format('YYYY-MM-DD') && todayStr <= dayjs(w.endDate).format('YYYY-MM-DD'));
            weekToSelect = found ? found.key : null;
          }
          if (!weekToSelect) {
            weekToSelect = weeks[0].key;
          }
          calendarState.setSelectedWeek(weekToSelect);
        } else if (!shouldAutoSelectWeek) {
          calendarState.setSelectedWeek(null);
        }
      } else {
        calendarState.setAvailableWeeks([]);
        calendarState.setSelectedWeek(null);
      }
    } catch (error) {
      console.error('Calendar weeks fetch failed:', error);
      calendarState.setAvailableWeeks([]);
      calendarState.setSelectedWeek(null);
    }
  }, [calendarState.setAvailableWeeks, calendarState.setSelectedWeek]);

  // Handle year selection
  const handleYearChange = (year) => {
    calendarState.handleYearChange(year);
  };

  // Handle month selection
  const handleMonthChange = (month) => {
    // Set selected month then fetch weeks
    calendarState.setSelectedMonth(month);
    if (calendarState.selectedYear) {
      fetchCalendarData(calendarState.selectedYear, month, true);
    }
  };

  // Handle week selection
  const handleWeekChange = (weekKey) => {
    console.log('🔍 handleWeekChange called with weekKey:', weekKey);
    setHasManuallyClosedModal(false);
    calendarState.handleWeekChange(weekKey);
    // Directly fetch data for the selected week
    if (weekKey) {
      // Find the week data from available weeks
      const selectedWeekData = calendarState.availableWeeks.find(week => week.key === weekKey);
      console.log('🔍 Selected week data:', selectedWeekData);
      console.log('🔍 Available weeks:', calendarState.availableWeeks);
      
      if (selectedWeekData) {
        const weekStartDate = selectedWeekData.startDate;
        console.log(`🔍 Fetching dashboard summary for week starting: ${weekStartDate}`);
        console.log('🔍 Calling fetchDashboardSummary with:', weekStartDate);
        fetchDashboardSummary(weekStartDate);
      } else {
        console.error('❌ No selected week data found for key:', weekKey);
        console.log('🔍 Available weeks keys:', calendarState.availableWeeks.map(w => w.key));
      }
    }
  };

  // Handle group by selection
  const handleGroupByChange = (groupByValue) => {
    setGroupBy(groupByValue);
    // You can add logic here to handle different grouping modes
    console.log('Group by changed to:', groupByValue);
  };

  // Handle view mode change (weekly/monthly) with improved state management
  // View mode removed (weekly-only)

  // Handle sales modal visibility
  const handleShowSalesModal = () => {
    setIsSalesModalVisible(true);
  };

  const handleCloseSalesModal = () => {
    setIsSalesModalVisible(false);
    setHasManuallyClosedModal(true);
  };

  // Handle data saved callback
  const handleDataSaved = async () => {
    // Reset the flag when data is saved
    setHasManuallyClosedModal(false);

    // Set success flash message flag
    setShowSuccessFlashMessage(true);

      // Refresh the dashboard data based on current view mode
  if (calendarState.selectedWeek) {
    await fetchSummaryData(calendarState.selectedWeek);
  }

    // Show success flash message
    message.success('Sales data added successfully! 🎉');

    // Auto-hide success flash message after 5 seconds
    setTimeout(() => {
      setShowSuccessFlashMessage(false);
    }, 5000);

    // Show popup asking if user wants to add actual sales
    // This will show after successful API response (200)
    setTimeout(() => {
      notification.info({
        message: (
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
            🎉 Sales Data Added Successfully!
          </div>
        ),
        description: (
          <div style={{ marginTop: '8px' }}>
            <p style={{ marginBottom: '8px' }}>
              Your sales data has been saved successfully.
            </p>
            <p style={{ marginBottom: '12px', color: '#666' }}>
              Would you like to add more sales data or edit existing data for this week?
            </p>
            <Button
              type="primary"
              size="small"
              icon={<DollarOutlined />}
              onClick={() => {
                notification.destroy();
                handleFlashMessageButtonClick();
              }}
              style={{
                marginTop: '8px',
                backgroundColor: '#52c41a',
                borderColor: '#52c41a'
              }}
            >
              Add More Sales Data
              <ArrowRightOutlined />
            </Button>
          </div>
        ),
        duration: 0, // Don't auto-close
        placement: 'top',
        style: {
          width: 450,
          zIndex: 99999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: '8px',
          marginTop: '20px',
        },
        onClose: () => {
          console.log('Sales data success popup closed');
        }
      });
    }, 1000); // Show after 1 second
  };

  // Handle flash message button click - Navigate to Dashboard with selected date
  const handleFlashMessageButtonClick = () => {
    {
      const selectedWeekData = getSelectedWeekData();

      if (selectedWeekData) {
        // Get the budgeted sales data from the dashboard summary data
        let budgetedSalesData = [];

        if (dashboardSummaryData && dashboardSummaryData.data && dashboardSummaryData.data.length > 0) {
          // Extract budgeted sales data from the dashboard summary data
          budgetedSalesData = dashboardSummaryData.data.map(day => ({
            budgetedSales: parseFloat(day.budgeted_sales) || 0,
            actualSalesInStore: parseFloat(day.actual_sales_in_store) || 0,
            actualSalesAppOnline: parseFloat(day.actual_sales_app_online) || 0,
            dailyTickets: parseFloat(day.daily_tickets) || 0,
            averageDailyTicket: parseFloat(day.average_daily_ticket) || 0
          }));
        }

                        // Store navigation context for the Dashboard component
                const navigationContext = {
                  selectedDate: selectedWeekData.startDate,
                  selectedWeek: calendarState.selectedWeek,
                  selectedYear: calendarState.selectedYear,
                  selectedMonth: calendarState.selectedMonth,
                  shouldOpenSalesModal: true,
                  source: 'summary-dashboard',
                  budgetedSalesData: budgetedSalesData // Include budgeted sales data
                };

        // Store in localStorage for Dashboard component to access
        localStorage.setItem('dashboardNavigationContext', JSON.stringify(navigationContext));

        // Also store budgeted sales data separately for easy access
        localStorage.setItem('budgetedSalesData', JSON.stringify(budgetedSalesData));

        // Show success message
        message.success('Navigating to Dashboard...');

        // Navigate to the main Dashboard component
        navigate('/dashboard');

        // Clear flash message
        setShowFlashMessage(false);
      } else {
        message.error('Unable to navigate: No week data selected');
      }
    }
  };

  // Initialize with current year, month, and week
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // If we already have year/month, fetch weeks
        if (calendarState.selectedYear && calendarState.selectedMonth) {
          await fetchCalendarData(calendarState.selectedYear, calendarState.selectedMonth, true);
        }

        // Fetch restaurant goals when dashboard loads
        await fetchRestaurantGoals();

      } catch (error) {
        console.error('Error initializing dashboard:', error);
      }
    };

    const fetchRestaurantGoals = async () => {
      try {
        // Ensure restaurant ID is available
        const restaurantId = await ensureRestaurantId();

        if (!restaurantId) {
          console.warn('No restaurant ID available. Skipping restaurant goals fetch.');
          return;
        }

        const result = await getRestaurentGoal(restaurantId);
        if (result === null) {
          console.log('ℹ️ No restaurant goals available yet - this is normal for new users');
        }
      } catch (error) {
        console.error('Restaurant goals error:', error.message);

        // Don't show error to user if it's just that no goals exist yet
        if (error.message.includes('Restaurant ID is required') ||
          error.message.includes('Restaurant goals not found')) {
          console.log('ℹ️ No restaurant goals available yet - this is normal for new users');
        }
      }
    };

    initializeDashboard();
  }, [ensureRestaurantId, getRestaurentGoal, calendarState.selectedYear, calendarState.selectedMonth, fetchCalendarData]);

  // Fetch summary data when selectedWeek changes
  useEffect(() => {
    console.log('selectedWeek useEffect triggered:', { selectedWeek: calendarState.selectedWeek, availableWeeks: calendarState.availableWeeks.length });
    if (calendarState.selectedWeek && calendarState.availableWeeks.length > 0) {
      console.log('Calling fetchSummaryData for week:', calendarState.selectedWeek);
      fetchSummaryData(calendarState.selectedWeek);
    } else if (calendarState.selectedWeek && calendarState.availableWeeks.length === 0) {
      console.log('Week selected but no available weeks yet');
    }
  }, [calendarState.selectedWeek, calendarState.availableWeeks, fetchSummaryData]);

  // View mode logic removed

  // Monthly data flow removed

  // Log restaurant goals data for debugging (can be removed later)
  useEffect(() => {
    if (restaurantGoalsError) {
      console.error('Restaurant goals error:', restaurantGoalsError);
    }
  }, [restaurantGoals, restaurantGoalsError, restaurantGoalsLoading]);

  // Check if there's no data available
  const hasNoData = useCallback(() => {
    console.log('hasNoData check:', {
      viewMode: 'weekly',
      dashboardSummaryData: dashboardSummaryData ? 'exists' : 'null',
      status: dashboardSummaryData?.status,
      data: dashboardSummaryData?.data,
      dataLength: dashboardSummaryData?.data?.length,
      isArray: Array.isArray(dashboardSummaryData?.data),
      hasValidData: dashboardSummaryData?.data && Array.isArray(dashboardSummaryData.data) && dashboardSummaryData.data.length > 0,
      summaryLoading
    });

    // If still loading, don't make a decision yet
    if (summaryLoading) {
      console.log('hasNoData: Still loading - deferring decision');
      return false; // Return false to show loading state instead of "no data"
    }

    // If no dashboardSummaryData object exists, show "Add Sales Data"
    if (!dashboardSummaryData) {
      console.log('hasNoData: No dashboardSummaryData object - showing Add Sales Data');
      return true;
    }

    // If response status is not 'success', show "Add Sales Data"
    if (dashboardSummaryData.status !== 'success') {
      console.log('hasNoData: Response status is not success - showing Add Sales Data');
      return true;
    }

    // If data is empty, null, or not an array, show "Add Sales Data"
    if (!dashboardSummaryData.data || !Array.isArray(dashboardSummaryData.data) || dashboardSummaryData.data.length === 0) {
      console.log('hasNoData: No valid data array or empty array - showing Add Sales Data');
      return true;
    }

    // If we reach here, we have valid data with success status
    console.log('hasNoData: Valid data with success status - showing dashboard');
    return false;
  }, [dashboardSummaryData, summaryLoading]);



  // Show flash message and handle auto-opening when no data is available (weekly view only)
  useEffect(() => {
    console.log('Flash message useEffect triggered:', {
      viewMode: calendarState.viewMode,
      selectedWeek: calendarState.selectedWeek,
      selectedYear: calendarState.selectedYear,
      selectedMonth: calendarState.selectedMonth,
      hasNoData: hasNoData(),
      isSalesModalVisible,
      hasManuallyClosedModal,
      summaryLoading,
      dashboardSummaryData: dashboardSummaryData ? 'exists' : 'null',
      hasData: dashboardSummaryData && dashboardSummaryData.data && dashboardSummaryData.data.length > 0
    });

    // Only proceed if a week is selected
    if (!calendarState.selectedWeek) {
      console.log('Not weekly view or no week selected - hiding flash message');
      setShowFlashMessage(false);
      return;
    }

    // Don't make decisions while loading
    if (summaryLoading) {
      console.log('Still loading - deferring flash message and modal decisions');
      setShowFlashMessage(false);
      return;
    }

    // If no data exists and not loading, show the sales modal directly (not flash message)
    if (hasNoData() && !isSalesModalVisible && !hasManuallyClosedModal) {
      console.log('No data found - opening sales modal directly');
      setIsSalesModalVisible(true);
      setShowFlashMessage(false);
    }
    // If data exists, show flash message (regardless of modal visibility)
    else if (dashboardSummaryData && dashboardSummaryData.data && dashboardSummaryData.data.length > 0 &&
      !hasManuallyClosedModal) {
      console.log('Data exists - showing flash message to add more sales');
      setShowFlashMessage(true);
    } else {
      console.log('Setting flash message to false - conditions not met');
      setShowFlashMessage(false);
    }
  }, [calendarState.selectedWeek, dashboardSummaryData, isSalesModalVisible, hasManuallyClosedModal, summaryLoading, hasNoData]);

  // Get selected week data
  const getSelectedWeekData = () => {
    if (!calendarState.selectedWeek || !calendarState.availableWeeks.length) return null;
    return calendarState.availableWeeks.find(week => week.key === calendarState.selectedWeek);
  };

  return (
    <div className="w-full">


      {/* Success Flash Message for New Data Added */}
      {showSuccessFlashMessage && (
        <div className="mb-2 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm animate-pulse">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                🎉 Sales Data Added Successfully!
              </h3>
              <p className="text-green-700 mt-1">
                Your sales data has been saved and the dashboard has been updated. You can now view the updated information below.
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                size="small"
                type="primary"
                icon={<DollarOutlined />}
                onClick={handleFlashMessageButtonClick}
                style={{
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a',
                  fontSize: '12px'
                }}
              >
                Add More Data
                <ArrowRightOutlined />
              </Button>
              <Button
                size="small"
                onClick={() => setShowSuccessFlashMessage(false)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}





      <div className="w-full mx-auto">
        <div className="mb-2">




              {/* Use CalendarUtils component */}
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
                loading={calendarState.loading}
                error={null}
                title="Weekly Budgeted Dashboard"
                showFlashMessage={false}
              />
        </div>

        {/* Flash Message for Sales Budget */}
        {showFlashMessage && (
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-800 ">
                  📊 Keep Your Sales Data Updated
                </h3>
                <p className="text-blue-700 ">
                  Enter your sales data daily to ensure your dashboard reflects accurate and up-to-date results. Use the button below to go to the Sales Data page.
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  size="small"
                  type="primary"
                  icon={<DollarOutlined />}
                  onClick={handleFlashMessageButtonClick}
                  style={{
                    backgroundColor: '#1890ff',
                    borderColor: '#1890ff',
                    fontSize: '12px'
                  }}
                >
                  Add Sales Budgets
                  <ArrowRightOutlined />
                </Button>
                <Button
                  size="small"
                  onClick={() => setShowFlashMessage(false)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        <Space direction="vertical" size="large" style={{ width: '100%' }}>



          {/* Show dashboard components when a week is selected (weekly view) or when monthly view is selected */}
          {calendarState.selectedWeek ? (
            <>
              {(() => {
                console.log('Conditional rendering check:', {
                  selectedWeek: calendarState.selectedWeek,
                  selectedYear: calendarState.selectedYear,
                  selectedMonth: calendarState.selectedMonth,
                  summaryLoading,
                  hasNoData: hasNoData(),
                  shouldShowLoading: summaryLoading,
                  shouldShowEmpty: !summaryLoading && hasNoData(),
                  shouldShowDashboard: !summaryLoading && !hasNoData()
                });

                // Always show loading first if still loading
                if (summaryLoading) {
                  return (
                    <Card>
                      <div className="text-center py-8">
                        <Spin size="large" />
                        <p className="mt-4 text-gray-600">Loading dashboard data...</p>
                      </div>
                    </Card>
                  );
                }

                // After loading is complete, check if we have data
                const noData = hasNoData();
                if (noData) {
                  return (
                    <Card>
                      <div className="text-center py-8">
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description={
                            <div>
                              <p className="text-gray-600 mb-4">
                                {dashboardSummaryData?.message || 'No weekly dashboard data found for the selected week.'}
                              </p>
                              <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleShowSalesModal}
                                size="large"
                              >
                                Add Sales Data
                              </Button>
                            </div>
                          }
                        />
                      </div>
                    </Card>
                  );
                } else {
                  return (
                    <>
                      {/* Summary Table - First */}
                      <SummaryTableDashboard
                        dashboardSummaryData={dashboardSummaryData}
                        loading={summaryLoading}
                        error={summaryError}
                        selectedWeekData={getSelectedWeekData()}
                        viewMode={'weekly'}
                      />
                  

                      {/* Budget Dashboard - Second */}
                      <BudgetDashboard
                        dashboardData={dashboardSummaryData}
                        loading={summaryLoading}
                        error={summaryError}
                        onAddData={handleShowSalesModal}
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
                    </>
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
                      ? "Please select a week to view dashboard data."
                      : "No dashboard data available for the selected period."
                  }
                />
              </div>
            </Card>
          )}
        </Space>
      </div>

      {/* Sales Data Modal */}
      <SalesDataModal
        visible={isSalesModalVisible}
        onCancel={handleCloseSalesModal}
        selectedWeekData={getSelectedWeekData()}
        weekDays={[]}
        onDataSaved={handleDataSaved}
        autoOpenFromSummary={hasNoData()}
      />


    </div>
  );
};

export default SummaryDashboard;