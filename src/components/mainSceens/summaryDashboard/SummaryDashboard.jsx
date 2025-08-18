import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import useSalesDataPopup from '../../../utils/useSalesDataPopup';



const { Title } = Typography;

const SummaryDashboard = () => {
  const navigate = useNavigate();

  // Use local state for calendar to prevent infinite loops
  const [calendarDateRange, setCalendarDateRange] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState(null);

  // Initialize with current week
  useEffect(() => {
    if (calendarDateRange.length === 0) {
      const startOfWeek = dayjs().startOf('week');
      const endOfWeek = dayjs().endOf('week');
      setCalendarDateRange([startOfWeek, endOfWeek]);
    }
  }, [calendarDateRange.length]);

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
  const [showSuccessFlashMessage, setShowSuccessFlashMessage] = useState(false);
  
  // Sales data popup hook
  const { shouldShowPopup, isLoading: popupLoading, markPopupAsShown } = useSalesDataPopup();

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

  // Enhanced data validation function with better logging
  const hasValidData = useCallback(() => {
    const isValid = dashboardSummaryData?.status === 'success' && 
                   Array.isArray(dashboardSummaryData?.data) && 
                   dashboardSummaryData.data.length > 0;
    
    console.log('hasValidData check:', {
      status: dashboardSummaryData?.status,
      isArray: Array.isArray(dashboardSummaryData?.data),
      dataLength: dashboardSummaryData?.data?.length,
      isValid
    });
    
    return isValid;
  }, [dashboardSummaryData]);



  // Fetch dashboard summary data for selected date range
  const fetchSummaryData = useCallback(async (startDate, endDate, groupBy = 'daily') => {
    if (!startDate || !endDate) return;

    try {
      console.log('SummaryDashboard: Fetching data for:', startDate, 'to', endDate);
      await fetchDashboardSummary(startDate, endDate, groupBy);
    } catch (error) {
      console.error('Error in fetchDashboardSummary:', error);
    }
  }, [fetchDashboardSummary]);

  // Handle date change from calendar
  const handleDateChange = useCallback((dates) => {
    console.log('SummaryDashboard: Date range changed:', dates?.map(d => d?.format('YYYY-MM-DD')));
    if (dates && dates.length === 2) {
      const startDate = dates[0].format('YYYY-MM-DD');
      const endDate = dates[1].format('YYYY-MM-DD');
      console.log('SummaryDashboard: Fetching data for:', startDate, 'to', endDate);
      
      // Update calendar state first
      handleCalendarDateChange(dates);
      
      // Fetch the data directly
      fetchSummaryData(startDate, endDate, groupBy);
    }
  }, [fetchSummaryData, groupBy, handleCalendarDateChange]);

  // Handle group by selection
  const handleGroupByChange = useCallback((groupByValue) => {
    setGroupBy(groupByValue);
    // Refetch data with new group by if we have a date range
    if (calendarDateRange && calendarDateRange.length === 2) {
      const startDate = calendarDateRange[0].format('YYYY-MM-DD');
      const endDate = calendarDateRange[1].format('YYYY-MM-DD');
      fetchSummaryData(startDate, endDate, groupByValue);
    }
  }, [calendarDateRange, fetchSummaryData]);

  // Handle sales modal visibility
  const handleShowSalesModal = () => {
    // Ensure we have a valid date range before opening the modal
    if (!calendarDateRange || calendarDateRange.length !== 2) {
      // If no date range is selected, use the current week
      const currentWeekRange = selectThisWeek();
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

    if (calendarDateRange && calendarDateRange.length === 2) {
      const startDate = calendarDateRange[0].format('YYYY-MM-DD');
      const endDate = calendarDateRange[1].format('YYYY-MM-DD');
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
    dismissPopup();
    navigate('/dashboard');
  };

  // Sync calendar state with store state (for backward compatibility)
  useEffect(() => {
    if (calendarDateRange && calendarDateRange.length === 2) {
      const startDate = calendarDateRange[0];
      setSelectedYear(startDate.year());
      setSelectedMonth(startDate.month() + 1);
      setSelectedWeek(`${startDate.year()}_${startDate.week()}`);
    }
  }, [calendarDateRange, setSelectedYear, setSelectedMonth, setSelectedWeek]);

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
    
    const currentDateRange = calendarDateRange && calendarDateRange.length === 2 
      ? `${calendarDateRange[0].format('YYYY-MM-DD')}-${calendarDateRange[1].format('YYYY-MM-DD')}`
      : null;
    
    if (currentDateRange && currentDateRange !== lastDateRange.current) {
      lastDateRange.current = currentDateRange;
      // Reset the fail response handler for new date range
      hasHandledFailResponse.current = false;
      // Reset modal states for new date range
      setHasManuallyClosedModal(false);
      const startDate = calendarDateRange[0].format('YYYY-MM-DD');
      const endDate = calendarDateRange[1].format('YYYY-MM-DD');
      fetchSummaryData(startDate, endDate, groupBy);
    }
  }, [calendarDateRange, fetchSummaryData, groupBy]);

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
      
      // Debug log to understand the modal decision
      console.log('SummaryDashboard: Modal decision factors:', {
        hasNoData,
        groupBy,
        hasManuallyClosedModal,
        isSalesModalVisible,
        hasHandledFailResponse: hasHandledFailResponse.current,
        apiStatus: dashboardSummaryData?.status,
        isDataArray: Array.isArray(dashboardSummaryData?.data),
        dataLength: dashboardSummaryData?.data?.length
      });
      
      // Only show modal when there's truly no data (API failed or returned empty array) and groupBy is daily
      // AND we haven't manually closed it AND it's not already visible AND we haven't handled this response yet
      if (hasNoData && 
          groupBy === 'daily' && 
          !hasManuallyClosedModal && 
          !isSalesModalVisible && 
          !hasHandledFailResponse.current) {
        console.log('SummaryDashboard: Showing sales modal for no data (daily view)');
        hasHandledFailResponse.current = true;
        setIsSalesModalVisible(true);
      }
      // Flash message is now controlled by the hook - no need to manually manage it
      // Ensure modal is closed when we have valid data
      if (hasValidData() && isSalesModalVisible) {
        console.log('SummaryDashboard: Closing sales modal because we have valid data');
        setIsSalesModalVisible(false);
      }
    }
  }, [dashboardSummaryData, summaryLoading, hasValidData, groupBy]);



  // Success flash message
  if (showSuccessFlashMessage) {
    return (
      <div className="w-full mx-auto">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-xl font-bold text-green-800">
                  Sales Data Added Successfully!
                </h3>
              </div>
              <p className="text-green-700 text-lg leading-relaxed">
                Your sales data has been saved. The dashboard will now reflect your updated information.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="large"
                type="primary"
                icon={<DollarOutlined />}
                onClick={handleFlashMessageButtonClick}
                className="bg-gradient-to-r from-green-500 to-emerald-500 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                View Dashboard
                <ArrowRightOutlined />
              </Button>
              <Button
                size="large"
                onClick={() => setShowSuccessFlashMessage(false)}
                className="border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200"
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
        {/* Enhanced Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
            {/* Left Side - Title and Description */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-orange-600 mb-2">
                Weekly Budgeted Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Monitor your restaurant's financial performance and track budget vs. actual results
              </p>
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

      {/* Enhanced Flash Message for Sales Budget */}
      {shouldShowPopup && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-md p-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-green-800">
                  Keep Your Sales Data Updated
                </h3>
              </div>
              <p className="text-green-700 text-base leading-relaxed">
                Enter your sales data daily to ensure your dashboard reflects accurate and up-to-date results. Use the button below to go to the Sales Data page.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="middle"
                type="primary"
                icon={<DollarOutlined />}
                onClick={handleFlashMessageButtonClick}
                className="bg-gradient-to-r from-green-500 to-emerald-500 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                View Dashboard
                <ArrowRightOutlined />
              </Button>
              <Button
                size="middle"
                onClick={markPopupAsShown}
                className="border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {calendarDateRange && calendarDateRange.length === 2 ? (
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
                <BudgetDashboard
                  dashboardData={dashboardSummaryData}
                  loading={summaryLoading}
                  error={summaryError}
                  startDate={calendarDateRange?.[0]?.format('YYYY-MM-DD')}
                  endDate={calendarDateRange?.[1]?.format('YYYY-MM-DD')}
                  onEditData={() => {
                    // Navigate to dashboard for editing
                    navigate('/dashboard');
                  }}
                />
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
          if (calendarDateRange && calendarDateRange.length === 2) {
            const weekData = {
              startDate: calendarDateRange[0].format('YYYY-MM-DD'),
              endDate: calendarDateRange[1].format('YYYY-MM-DD'),
              weekNumber: calendarDateRange[0].week()
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