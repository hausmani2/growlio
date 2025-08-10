import React, { useState, useEffect } from 'react';
import { DatePicker, Card, Row, Col, Typography, Space, Select, Spin, Empty, Button, message, notification } from 'antd';
import { CalendarOutlined, PlusOutlined, DollarOutlined, ArrowRightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../utils/axiosInterceptors';
import useStore from '../../../store/store';
import SummaryTableDashboard from './SummaryTableDashboard';
import BudgetDashboard from './BudgetDashboard';
import SalesDataModal from './SalesDataModal';

const { Title } = Typography;
const { Option } = Select;

const SummaryDashboard = () => {
  const navigate = useNavigate();
  
  // Calendar dropdown states
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [availableWeeks, setAvailableWeeks] = useState([]);

  // Modal states
  const [isSalesModalVisible, setIsSalesModalVisible] = useState(false);
  const [hasManuallyClosedModal, setHasManuallyClosedModal] = useState(false);
  
  // Flash message state
  const [showFlashMessage, setShowFlashMessage] = useState(false);
  


  // Dashboard data state

  // Restaurant goals functionality
  const { getRestaurentGoal, restaurantGoals, restaurantGoalsLoading, restaurantGoalsError } = useStore();

  // Dashboard summary functionality
  const { 
    fetchDashboardSummary, 
    dashboardSummaryData, 
    loading: summaryLoading, 
    error: summaryError 
  } = useStore();

  // Auth functionality for restaurant ID
  const { ensureRestaurantId } = useStore();

  // Note: Redirection logic is handled by ProtectedRoutes.jsx
  // No need to duplicate the redirect check here

  // Static years and months
  const years = Array.from({ length: 9 }, (_, i) => 2021 + i); // 2021 to 2029
  const months = [
    { key: 1, name: 'January' },
    { key: 2, name: 'February' },
    { key: 3, name: 'March' },
    { key: 4, name: 'April' },
    { key: 5, name: 'May' },
    { key: 6, name: 'June' },
    { key: 7, name: 'July' },
    { key: 8, name: 'August' },
    { key: 9, name: 'September' },
    { key: 10, name: 'October' },
    { key: 11, name: 'November' },
    { key: 12, name: 'December' }
  ];

  // Helper function to find the current week based on current date
  const findCurrentWeek = (weeks, currentDate) => {
    if (!weeks || !currentDate || weeks.length === 0) return null;
    
    for (const week of weeks) {
      const startDate = dayjs(week.startDate);
      const endDate = dayjs(week.endDate);
      
      // Check if current date falls within this week's range (inclusive)
      // Using manual comparison since isBetween plugin might not be available
      const currentDateStr = currentDate.format('YYYY-MM-DD');
      const startDateStr = startDate.format('YYYY-MM-DD');
      const endDateStr = endDate.format('YYYY-MM-DD');
      
      if (currentDateStr >= startDateStr && currentDateStr <= endDateStr) {
        return week.key;
      }
    }
    
    return null;
  };

  // Fetch calendar data for selected year and month
  const fetchCalendarData = async (year, month, shouldAutoSelectWeek = false) => {
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
        setAvailableWeeks(weeks);
        
        // Auto-select current week if requested
        if (shouldAutoSelectWeek) {
          const currentDate = dayjs();
          console.log('Current date:', currentDate.format('YYYY-MM-DD'));
          const currentWeekKey = findCurrentWeek(weeks, currentDate);
          console.log('Found current week key:', currentWeekKey);
          if (currentWeekKey) {
            setSelectedWeek(currentWeekKey);
          }
        }
      } else {
        console.log('No weeks data in response');
        setAvailableWeeks([]);
      }

    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setAvailableWeeks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard summary data for selected week
  const fetchSummaryData = async (weekKey) => {
    if (!weekKey) return;
    
    try {
      const selectedWeekData = availableWeeks.find(week => week.key === weekKey);
      if (selectedWeekData) {
        const weekStartDate = selectedWeekData.startDate;
        console.log(`Fetching dashboard summary for week starting: ${weekStartDate}`);
        // Reset the manual close flag when starting a new fetch
        setHasManuallyClosedModal(false);
        await fetchDashboardSummary(weekStartDate);
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    }
  };

  // Handle year selection
  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedMonth(null);
    setSelectedWeek(null);
    setAvailableWeeks([]);
  };

  // Handle month selection
  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setSelectedWeek(null);
    
    if (selectedYear) {
      fetchCalendarData(selectedYear, month, true);
    }
  };

  // Handle week selection
  const handleWeekChange = (weekKey) => {
    setSelectedWeek(weekKey);
    setHasManuallyClosedModal(false); // Reset the flag when week changes
    // Fetch dashboard summary data when week is selected
    fetchSummaryData(weekKey);
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
    // Reset the flag when data is saved
    setHasManuallyClosedModal(false);
    
    // Refresh the dashboard data
    if (selectedWeek) {
      await fetchSummaryData(selectedWeek);
    }
    
    // Show popup asking if user wants to add actual sales
    // This will show after successful API response (200)
    setTimeout(() => {
      notification.info({
        message: (
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
            🎉 Budgeted Sales Added Successfully!
          </div>
        ),
        description: (
          <div style={{ marginTop: '8px' }}>
            <p style={{ marginBottom: '8px' }}>
              Your budgeted sales have been saved successfully.
            </p>
            <p style={{ marginBottom: '12px', color: '#666' }}>
              Would you like to add actual sales data for this week?
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
              Add Actual Sales
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
          console.log('Budgeted sales success popup closed');
        }
      });
    }, 1000); // Show after 1 second
  };

  // Handle flash message button click - Navigate to Dashboard with selected date
          const handleFlashMessageButtonClick = () => {
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
              selectedWeek: selectedWeek,
              selectedYear: selectedYear,
              selectedMonth: selectedMonth,
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
        };

  // Initialize with current year, month, and week
  useEffect(() => {
    const initializeDashboard = async () => {
      const currentDate = dayjs();
      const currentYear = currentDate.year();
      const currentMonth = currentDate.month() + 1; // dayjs months are 0-indexed
      
      console.log(`Initializing dashboard with current year: ${currentYear}, month: ${currentMonth}`);
      
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth);
      
      // Fetch calendar data for current month and auto-select current week
      await fetchCalendarData(currentYear, currentMonth, true);
      
      // Fetch restaurant goals when dashboard loads
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
  }, []); // Remove getRestaurentGoal from dependencies to avoid re-renders

  // Fetch summary data when selectedWeek changes
  useEffect(() => {
    if (selectedWeek) {
      fetchSummaryData(selectedWeek);
    }
  }, [selectedWeek]);

  // Log restaurant goals data for debugging (can be removed later)
  useEffect(() => {
    if (restaurantGoalsError) {
      console.error('Restaurant goals error:', restaurantGoalsError);
    }
  }, [restaurantGoals, restaurantGoalsError, restaurantGoalsLoading]);

  // Check if there's no data available
  const hasNoData = () => {
    console.log('hasNoData check:', {
      dashboardSummaryData: dashboardSummaryData ? 'exists' : 'null',
      status: dashboardSummaryData?.status,
      data: dashboardSummaryData?.data,
      dataLength: dashboardSummaryData?.data?.length
    });
    
    if (!dashboardSummaryData) return true;
    
    // Check for API error responses
    if (dashboardSummaryData.status === 'fail' || dashboardSummaryData.status === 'error') {
      return true;
    }
    
    // Check if data is empty or null
    if (!dashboardSummaryData.data || dashboardSummaryData.data.length === 0) {
      return true;
    }
    
    return false;
  };

  // Check if the API response indicates no weekly dashboard data
  const shouldShowAddSalesModal = () => {
    // Use the hasNoData function which has comprehensive logic
    return hasNoData();
  };

  // Show flash message and handle auto-opening when no data is available
  useEffect(() => {
    console.log('Flash message useEffect triggered:', {
      selectedWeek,
      shouldShowAddSalesModal: shouldShowAddSalesModal(),
      isSalesModalVisible,
      hasManuallyClosedModal,
      summaryLoading,
      dashboardSummaryData: dashboardSummaryData ? 'exists' : 'null',
      hasData: dashboardSummaryData && dashboardSummaryData.data && dashboardSummaryData.data.length > 0
    });

    // Only proceed if a week is selected
    if (!selectedWeek) {
      console.log('No week selected - hiding flash message');
      setShowFlashMessage(false);
      return;
    }

    // If no data exists, show the sales modal directly (not flash message)
    if (shouldShowAddSalesModal() && !isSalesModalVisible && !hasManuallyClosedModal && !summaryLoading) {
      console.log('No data found - opening sales modal directly');
      setIsSalesModalVisible(true);
      setShowFlashMessage(false);
    } 
    // If data exists, show flash message (regardless of modal visibility)
    else if (dashboardSummaryData && dashboardSummaryData.data && dashboardSummaryData.data.length > 0 && 
             !hasManuallyClosedModal && !summaryLoading) {
      console.log('Data exists - showing flash message to add more sales');
      setShowFlashMessage(true);
    } else {
      console.log('Setting flash message to false - conditions not met');
      setShowFlashMessage(false);
    }
  }, [selectedWeek, dashboardSummaryData, isSalesModalVisible, hasManuallyClosedModal, summaryLoading]);

  // Get selected week data
  const getSelectedWeekData = () => {
    if (!selectedWeek || !availableWeeks.length) return null;
    return availableWeeks.find(week => week.key === selectedWeek);
  };

  return (
    <div className="w-full">


      {/* Flash Message for Sales Budget */}
      {showFlashMessage && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-800 ">
                💡 Want to Add More Sales Data?
              </h3>
              <p className="text-blue-700 ">
                Sales data exists for this week. Click the button below to navigate to Dashboard and edit or add more sales data for this week.
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



      <div className="w-full mx-auto">
        <div className="mb-2">

          <Card className="p-4 sm:p-6">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">


              {/* Calendar Dropdowns */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Year Dropdown */}
                  <div className="flex-1 min-w-[150px] w-full sm:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <Select
                      placeholder="Select Year"
                      value={selectedYear}
                      onChange={handleYearChange}
                      style={{ width: '100%' }}
                      className="w-full"
                    >
                      {years.map(year => (
                        <Option key={year} value={year}>
                          {year}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  {/* Month Dropdown */}
                  <div className="flex-1 min-w-[150px] w-full sm:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <Select
                      placeholder="Select Month"
                      value={selectedMonth}
                      onChange={handleMonthChange}
                      style={{ width: '100%' }}
                      disabled={!selectedYear}
                      loading={loading}
                      className="w-full"
                    >
                      {months.map(month => (
                        <Option key={month.key} value={month.key}>
                          {month.name}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  {/* Week Dropdown */}
                  <div className="flex-1 min-w-[150px] w-full sm:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Week
                    </label>
                    <Select
                      placeholder="Select Week"
                      value={selectedWeek}
                      onChange={handleWeekChange}
                      style={{ width: '100%' }}
                      disabled={!selectedMonth}
                      loading={loading}
                    >
                      {availableWeeks.map(week => (
                        <Option key={week.key} value={week.key}>
                          Week {week.weekNumber} ({dayjs(week.startDate).format('MMM DD')} - {dayjs(week.endDate).format('MMM DD')})
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Loading indicator for weeks */}
                {selectedMonth && loading && availableWeeks.length === 0 && (
                  <div className="text-center py-4">
                    <Spin size="small" /> Loading weeks...
                  </div>
                )}

                {/* No weeks available message */}
                {selectedMonth && !loading && availableWeeks.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No weeks available for the selected month.
                  </div>
                )}
              </div>
            </Space>
          </Card>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          

          
          {/* Only show dashboard components when a week is selected and dashboard data is available */}
          {selectedWeek ? (
            <>
              {summaryLoading ? (
                <Card>
                  <div className="text-center py-8">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-600">Loading dashboard data...</p>
                  </div>
                </Card>
              ) : shouldShowAddSalesModal() ? (
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
              ) : hasNoData() ? (
                <Card>
                  <div className="text-center py-8">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <div>
                          <p className="text-gray-600 mb-4">
                            No weekly dashboard data found for the selected week.
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
                   {/* Summary Table - First */}
                   <SummaryTableDashboard 
                     dashboardSummaryData={dashboardSummaryData}
                     loading={summaryLoading}
                     error={summaryError}
                     selectedWeekData={getSelectedWeekData()}
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
                           selectedWeek: selectedWeek,
                           selectedYear: selectedYear,
                           selectedMonth: selectedMonth,
                           shouldOpenSalesModal: true,
                           source: 'summary-dashboard'
                         };
                         localStorage.setItem('dashboardNavigationContext', JSON.stringify(navigationContext));
                         navigate('/dashboard');
                       }
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
                  description={
                    !selectedWeek 
                      ? "Please select a week to view dashboard data." 
                      : "No dashboard data available for the selected week."
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
        autoOpenFromSummary={shouldShowAddSalesModal()}
      />
    </div>
  );
};

export default SummaryDashboard;