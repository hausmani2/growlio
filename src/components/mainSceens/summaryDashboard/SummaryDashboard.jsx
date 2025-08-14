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
  const { getRestaurentGoal } = useStore();

  // Auth functionality for restaurant ID
  const { ensureRestaurantId } = useStore();

  // Simplified data validation function
  const hasValidData = useCallback(() => {
    return dashboardSummaryData?.status === 'success' && 
           Array.isArray(dashboardSummaryData?.data) && 
           dashboardSummaryData.data.length > 0;
  }, [dashboardSummaryData]);

  // Fetch dashboard summary data for selected week
  const fetchSummaryData = useCallback(async (weekKey) => {
    if (!weekKey) return;

    const selectedWeekData = calendarState.availableWeeks.find(week => week.key === weekKey);
    if (!selectedWeekData) {
      console.error('No selected week data found for key:', weekKey);
      return;
    }

    // Reset the manual close flag when starting a new fetch
    setHasManuallyClosedModal(false);

    try {
      await fetchDashboardSummary(selectedWeekData.startDate);
    } catch (error) {
      console.error('Error in fetchDashboardSummary:', error);
    }
  }, [calendarState.availableWeeks, fetchDashboardSummary]);

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

        calendarState.setAvailableWeeks(weeks);

        // Auto-select week
        if (shouldAutoSelectWeek && weeks.length > 0) {
          const now = dayjs();
          const isCurrentMonth = (now.month() + 1) === month && now.year() === year;
          let weekToSelect = null;
          
          if (isCurrentMonth) {
            const todayStr = now.format('YYYY-MM-DD');
            const found = weeks.find(w => 
              todayStr >= dayjs(w.startDate).format('YYYY-MM-DD') && 
              todayStr <= dayjs(w.endDate).format('YYYY-MM-DD')
            );
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
    calendarState.setSelectedMonth(month);
    if (calendarState.selectedYear) {
      fetchCalendarData(calendarState.selectedYear, month, true);
    }
  };

  // Handle week selection
  const handleWeekChange = (weekKey) => {
    setHasManuallyClosedModal(false);
    calendarState.handleWeekChange(weekKey);
    
    if (weekKey) {
      const selectedWeekData = calendarState.availableWeeks.find(week => week.key === weekKey);
      if (selectedWeekData) {
        fetchDashboardSummary(selectedWeekData.startDate);
      }
    }
  };

  // Handle group by selection
  const handleGroupByChange = (groupByValue) => {
    setGroupBy(groupByValue);
  };

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
    setHasManuallyClosedModal(false);
    setShowSuccessFlashMessage(true);

    if (calendarState.selectedWeek) {
      await fetchSummaryData(calendarState.selectedWeek);
    }

    message.success('Sales data added successfully! 🎉');

    setTimeout(() => {
      setShowSuccessFlashMessage(false);
    }, 5000);

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
        duration: 0,
        placement: 'top',
        style: {
          width: 450,
          zIndex: 99999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: '8px',
          marginTop: '20px',
        }
      });
    }, 1000);
  };

  // Handle flash message button click
  const handleFlashMessageButtonClick = () => {
    const selectedWeekData = getSelectedWeekData();

    if (selectedWeekData) {
      let budgetedSalesData = [];

      if (hasValidData()) {
        budgetedSalesData = dashboardSummaryData.data.map(day => ({
          budgetedSales: parseFloat(day.budgeted_sales) || 0,
          actualSalesInStore: parseFloat(day.actual_sales_in_store) || 0,
          actualSalesAppOnline: parseFloat(day.actual_sales_app_online) || 0,
          dailyTickets: parseFloat(day.daily_tickets) || 0,
          averageDailyTicket: parseFloat(day.average_daily_ticket) || 0
        }));
      }

      const navigationContext = {
        selectedDate: selectedWeekData.startDate,
        selectedWeek: calendarState.selectedWeek,
        selectedYear: calendarState.selectedYear,
        selectedMonth: calendarState.selectedMonth,
        shouldOpenSalesModal: true,
        source: 'summary-dashboard',
        budgetedSalesData: budgetedSalesData
      };

      localStorage.setItem('dashboardNavigationContext', JSON.stringify(navigationContext));
      localStorage.setItem('budgetedSalesData', JSON.stringify(budgetedSalesData));

      message.success('Navigating to Dashboard...');
      navigate('/dashboard');
      setShowFlashMessage(false);
    } else {
      message.error('Unable to navigate: No week data selected');
    }
  };

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        if (calendarState.selectedYear && calendarState.selectedMonth) {
          await fetchCalendarData(calendarState.selectedYear, calendarState.selectedMonth, true);
        }
        await fetchRestaurantGoals();
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      }
    };

    const fetchRestaurantGoals = async () => {
      try {
        const restaurantId = await ensureRestaurantId();
        if (!restaurantId) {
          console.warn('No restaurant ID available. Skipping restaurant goals fetch.');
          return;
        }
        await getRestaurentGoal(restaurantId);
      } catch (error) {
        if (!error.message.includes('Restaurant ID is required') && 
            !error.message.includes('Restaurant goals not found')) {
          console.error('Restaurant goals error:', error.message);
        }
      }
    };

    initializeDashboard();
  }, [ensureRestaurantId, getRestaurentGoal, calendarState.selectedYear, calendarState.selectedMonth, fetchCalendarData]);

  // Fetch summary data when selectedWeek changes
  useEffect(() => {
    if (calendarState.selectedWeek && calendarState.availableWeeks.length > 0) {
      fetchSummaryData(calendarState.selectedWeek);
    }
  }, [calendarState.selectedWeek, calendarState.availableWeeks, fetchSummaryData]);

  // Consolidated flash message and modal logic
  useEffect(() => {
    if (!calendarState.selectedWeek || summaryLoading) {
      setShowFlashMessage(false);
      return;
    }

    const hasData = hasValidData();
    
    if (!hasData && !isSalesModalVisible && !hasManuallyClosedModal) {
      setIsSalesModalVisible(true);
      setShowFlashMessage(false);
    } else if (hasData && !hasManuallyClosedModal) {
      setShowFlashMessage(true);
    } else {
      setShowFlashMessage(false);
    }
  }, [calendarState.selectedWeek, dashboardSummaryData, isSalesModalVisible, hasManuallyClosedModal, summaryLoading, hasValidData]);

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
          {calendarState.selectedWeek ? (
            <>
              {summaryLoading ? (
                <Card>
                  <div className="text-center py-8">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-600">Loading dashboard data...</p>
                  </div>
                </Card>
              ) : !hasValidData() ? (
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
              ) : (
                <>
                  <SummaryTableDashboard
                    dashboardSummaryData={dashboardSummaryData}
                    loading={summaryLoading}
                    error={summaryError}
                    selectedWeekData={getSelectedWeekData()}
                    viewMode={'weekly'}
                  />
                  
                  <BudgetDashboard
                    dashboardData={dashboardSummaryData}
                    loading={summaryLoading}
                    error={summaryError}
                    onAddData={handleShowSalesModal}
                    onEditData={() => {
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
              )}
            </>
          ) : (
            <Card>
              <div className="text-center py-8">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Please select a week to view dashboard data."
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
        autoOpenFromSummary={!hasValidData()}
      />
    </div>
  );
};

export default SummaryDashboard;