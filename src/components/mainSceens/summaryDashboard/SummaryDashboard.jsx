import React, { useState, useEffect, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import { Card, Typography, Space, Spin, Empty, Button, message, notification, App } from 'antd';
import { PlusOutlined, DollarOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/store';
import SummaryTableDashboard from './SummaryTableDashboard';
import WeeklySummaryTable from './WeeklySummaryTable';
import BudgetDashboard from './BudgetDashboard';
import SalesDataModal from './SalesDataModal';
import CalendarUtils from '../../../utils/CalendarUtils';
import useCalendar from '../../../utils/useCalendar';


const { Title } = Typography;

const SummaryDashboard = () => {
  const navigate = useNavigate();

  // Use the new calendar utility hook
  const calendar = useCalendar({
    autoSelectCurrentWeek: true,
    initialDates: [] // Ensure no initial dates so auto-selection works
  });

  // Store integration for date selection persistence
  const {
    setSelectedYear,
    setSelectedMonth,
    setSelectedWeek
  } = useStore();

  // Local state for group by selection
  const [groupBy, setGroupBy] = useState('daily');

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

  // Use refs to prevent infinite loops
  const isInitialized = useRef(false);
  const lastDateRange = useRef(null);
  const hasHandledFailResponse = useRef(false);

  // Simplified data validation function
  const hasValidData = useCallback(() => {
    return dashboardSummaryData?.status === 'success' && 
           Array.isArray(dashboardSummaryData?.data) && 
           dashboardSummaryData.data.length > 0;
  }, [dashboardSummaryData]);



  // Fetch dashboard summary data for selected date range
  const fetchSummaryData = useCallback(async (startDate, endDate, groupBy = 'daily') => {
    if (!startDate || !endDate) return;

    try {
      console.log('SummaryDashboard: Fetching data for:', startDate, 'to', endDate);
      await fetchDashboardSummary(startDate, endDate, groupBy);
      
      // Add a small delay to ensure the data is processed
      setTimeout(() => {
        console.log('SummaryDashboard: Checking data after fetch');
        if (dashboardSummaryData && hasValidData() && !showFlashMessage) {
          console.log('SummaryDashboard: Triggering flash message after fetch for valid data');
          setShowFlashMessage(true);
        }
      }, 500);
    } catch (error) {
      console.error('Error in fetchDashboardSummary:', error);
    }
  }, [fetchDashboardSummary, dashboardSummaryData, hasValidData, showFlashMessage]);

  // Handle date change from calendar
  const handleDateChange = useCallback((dates) => {
    console.log('SummaryDashboard: Date range changed:', dates?.map(d => d?.format('YYYY-MM-DD')));
    if (dates && dates.length === 2) {
      const startDate = dates[0].format('YYYY-MM-DD');
      const endDate = dates[1].format('YYYY-MM-DD');
      console.log('SummaryDashboard: Fetching data for:', startDate, 'to', endDate);
      
      // Update calendar state first
      calendar.handleDateChange(dates);
      
      // Fetch the data directly
      fetchSummaryData(startDate, endDate, groupBy);
    }
  }, [fetchSummaryData, groupBy, calendar]);

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

  // Handle sales modal visibility
  const handleShowSalesModal = () => {
    // Ensure we have a valid date range before opening the modal
    if (!calendar.dateRange || calendar.dateRange.length !== 2) {
      // If no date range is selected, use the current week
      const currentWeekRange = calendar.selectThisWeek();
      console.log('No date range selected, using current week:', currentWeekRange);
    }
    
    setIsSalesModalVisible(true);
  };

  const handleCloseSalesModal = () => {
    setIsSalesModalVisible(false);
    setHasManuallyClosedModal(true);
    // Reset the fail response handler when modal is manually closed
    hasHandledFailResponse.current = false;
  };

  // Handle data saved callback
  const handleDataSaved = async () => {
    setHasManuallyClosedModal(false);
    setShowSuccessFlashMessage(true);

    if (calendar.dateRange && calendar.dateRange.length === 2) {
      const startDate = calendar.dateRange[0].format('YYYY-MM-DD');
      const endDate = calendar.dateRange[1].format('YYYY-MM-DD');
      await fetchSummaryData(startDate, endDate, groupBy);
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
          borderRadius: '8px'
        }
      });
    }, 1000);
  };

  // Handle flash message button click
  const handleFlashMessageButtonClick = () => {
    setShowFlashMessage(false);
    navigate('/dashboard');
  };

  // Sync calendar state with store state (for backward compatibility)
  useEffect(() => {
    if (calendar.dateRange && calendar.dateRange.length === 2) {
      const startDate = calendar.dateRange[0];
      setSelectedYear(startDate.year());
      setSelectedMonth(startDate.month() + 1);
      setSelectedWeek(`${startDate.year()}_${startDate.week()}`);
    }
  }, [calendar.dateRange, setSelectedYear, setSelectedMonth, setSelectedWeek]);

  // Initialize restaurant ID and fetch initial data (only once)
  useEffect(() => {
    if (isInitialized.current) return;
    
    const initializeDashboard = async () => {
      try {
        await ensureRestaurantId();
        await getRestaurentGoal();
        isInitialized.current = true;
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      }
    };

    initializeDashboard();
  }, [ensureRestaurantId, getRestaurentGoal]);

  // Fetch data when date range changes (but not on initial load)
  useEffect(() => {
    if (!isInitialized.current) return;
    
    const currentDateRange = calendar.dateRange && calendar.dateRange.length === 2 
      ? `${calendar.dateRange[0].format('YYYY-MM-DD')}-${calendar.dateRange[1].format('YYYY-MM-DD')}`
      : null;
    
    if (currentDateRange && currentDateRange !== lastDateRange.current) {
      lastDateRange.current = currentDateRange;
      // Reset the fail response handler for new date range
      hasHandledFailResponse.current = false;
      // Reset modal states for new date range
      setHasManuallyClosedModal(false);
      setShowFlashMessage(false);
      const startDate = calendar.dateRange[0].format('YYYY-MM-DD');
      const endDate = calendar.dateRange[1].format('YYYY-MM-DD');
      fetchSummaryData(startDate, endDate, groupBy);
    }
  }, [calendar.dateRange, fetchSummaryData]);

  // Handle API response changes to show modal or flash message
  useEffect(() => {
    // Only run when we have a valid API response and we're not loading
    if (!summaryLoading && dashboardSummaryData !== null && dashboardSummaryData !== undefined) {
      console.log('SummaryDashboard: Processing API response:', {
        status: dashboardSummaryData?.status,
        message: dashboardSummaryData?.message,
        dataLength: dashboardSummaryData?.data?.length,
        hasValidData: hasValidData(),
        hasManuallyClosedModal,
        isSalesModalVisible,
        hasHandledFailResponse: hasHandledFailResponse.current
      });
      
      const hasNoData = !hasValidData();
      
      // Show modal when there's no data (fail response or empty data) and groupBy is daily
      if (hasNoData && groupBy === 'daily' && !hasManuallyClosedModal && !isSalesModalVisible && !hasHandledFailResponse.current) {
        console.log('SummaryDashboard: Showing sales modal for no data (daily view)');
        hasHandledFailResponse.current = true;
        setIsSalesModalVisible(true);
        setShowFlashMessage(false);
      }
      // Show flash message when we have valid data
      else if (hasValidData() && !showFlashMessage) {
        console.log('SummaryDashboard: Showing flash message for valid data');
        setShowFlashMessage(true);
        setShowSuccessFlashMessage(false);
      }
      // Hide flash message when no data (to avoid showing both modal and flash)
      else if (hasNoData) {
        console.log('SummaryDashboard: Hiding flash message - no data');
        setShowFlashMessage(false);
      }
    }
  }, [dashboardSummaryData, summaryLoading, hasValidData, hasManuallyClosedModal, isSalesModalVisible, showFlashMessage, groupBy]);

  // Additional effect to ensure flash message shows when data is fetched and valid
  useEffect(() => {
    if (!summaryLoading && dashboardSummaryData !== null && dashboardSummaryData !== undefined) {
      console.log('SummaryDashboard: Additional check for flash message');
      
      // If we have valid data, show flash message
      if (hasValidData() && !showFlashMessage) {
        console.log('SummaryDashboard: Triggering flash message from additional effect for valid data');
        setShowFlashMessage(true);
      }
    }
  }, [dashboardSummaryData, summaryLoading, hasValidData, showFlashMessage]);

  // Success flash message
  if (showSuccessFlashMessage) {
    return (
      <div className="w-full mx-auto">
        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800">
                ✅ Sales Data Added Successfully!
              </h3>
              <p className="text-green-700">
                Your sales data has been saved. The dashboard will now reflect your updated information.
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
                View Dashboard
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
      </div>
    );
  }

  return (
    <App>
      <div className="w-full mx-auto">
      <div className="mb-2">
        <CalendarUtils
          selectedDates={calendar.dateRange}
          onDateChange={handleDateChange}
          groupBy={groupBy}
          onGroupByChange={handleGroupByChange}
          title="Weekly Budgeted Dashboard"
          description="Select a date range for your dashboard data"
          loading={calendar.loading}
          error={calendar.error}
          autoSelectCurrentWeek={true}
                />
        
      </div>

      {/* Flash Message for Sales Budget */}
      {showFlashMessage && (
        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800 ">
                📊 Keep Your Sales Data Updated
              </h3>
              <p className="text-green-700 ">
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
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a',
                  fontSize: '12px'
                }}
              >
                View Dashboard
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
        {calendar.dateRange && calendar.dateRange.length === 2 ? (
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
                          {dashboardSummaryData?.message || `No ${groupBy} dashboard data found for the selected date range.`}
                        </p>
                        {groupBy === 'daily' && (
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleShowSalesModal}
                            size="large"
                          >
                            Add Sales Data
                          </Button>
                        )}
                      </div>
                    }
                  />
                </div>
              </Card>
            ) : (
              <>
                {groupBy === 'week' ? (
                  <WeeklySummaryTable
                    dashboardSummaryData={dashboardSummaryData}
                    loading={summaryLoading}
                    error={summaryError}
                  />
                ) : (
                  <SummaryTableDashboard
                    dashboardSummaryData={dashboardSummaryData}
                    loading={summaryLoading}
                    error={summaryError}
                    groupBy={groupBy}
                    viewMode={groupBy === 'month' ? 'monthly' : groupBy === 'week' ? 'weekly' : 'daily'}
                  />
                )}
                <BudgetDashboard
                  dashboardData={dashboardSummaryData}
                  loading={summaryLoading}
                  error={summaryError}
                  onEditData={() => {
                    // Navigate to dashboard for editing
                    navigate('/dashboard');
                  }}
                />
              </>
            )}
          </>
        ) : (
          <Card>
            <div className="text-center py-8">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Please select a date range to view dashboard data"
              />
            </div>
          </Card>
        )}
      </Space>

      {/* Sales Data Modal */}
      <SalesDataModal
        visible={isSalesModalVisible}
        onCancel={handleCloseSalesModal}
        onDataSaved={handleDataSaved}
        selectedWeekData={(() => {
          // Always use the current calendar date range
          if (calendar.dateRange && calendar.dateRange.length === 2) {
            const weekData = {
              startDate: calendar.dateRange[0].format('YYYY-MM-DD'),
              endDate: calendar.dateRange[1].format('YYYY-MM-DD'),
              weekNumber: calendar.dateRange[0].week()
            };
            console.log('SalesDataModal: Using calendar date range:', weekData);
            return weekData;
          } else {
            // Fallback to current week if no date range is selected
            const currentWeekStart = dayjs().startOf('week');
            const currentWeekEnd = dayjs().endOf('week');
            const weekData = {
              startDate: currentWeekStart.format('YYYY-MM-DD'),
              endDate: currentWeekEnd.format('YYYY-MM-DD'),
              weekNumber: currentWeekStart.week()
            };
            console.log('SalesDataModal: Using fallback current week:', weekData);
            return weekData;
          }
        })()}
        autoOpenFromSummary={true}
      />
    </div>
    </App>
  );
};

export default SummaryDashboard;