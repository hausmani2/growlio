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
  
  // Store integration for date selection persistence
  const { 
    // Date selection from store
    selectedYear,
    selectedMonth,
    selectedWeek,
    availableWeeks,
    setSelectedYear,
    setSelectedMonth,
    setSelectedWeek,
    setAvailableWeeks
  } = useStore();

  // Local loading states
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isSalesModalVisible, setIsSalesModalVisible] = useState(false);
  const [hasManuallyClosedModal, setHasManuallyClosedModal] = useState(false);
  
  // Flash message state
  const [showFlashMessage, setShowFlashMessage] = useState(false);
  const [showSuccessFlashMessage, setShowSuccessFlashMessage] = useState(false);

  // View mode state (weekly/monthly)
  const [viewMode, setViewMode] = useState('monthly');
  


  // Dashboard data state

  // Restaurant goals functionality
  const { getRestaurentGoal, restaurantGoals, restaurantGoalsLoading, restaurantGoalsError } = useStore();

  // Dashboard summary functionality
  const { 
    fetchDashboardSummary, 
    fetchMonthlyDashboardSummary,
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
    console.log('fetchSummaryData called with weekKey:', weekKey);
    if (!weekKey) {
      console.log('No weekKey provided, returning');
      return;
    }
    
    console.log('Available weeks:', availableWeeks);
    const selectedWeekData = availableWeeks.find(week => week.key === weekKey);
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
      console.log('Available weeks keys:', availableWeeks.map(w => w.key));
    }
  };

  // Fetch monthly dashboard summary data
  const fetchMonthlyData = async (year, month) => {
    console.log('fetchMonthlyData called with year:', year, 'month:', month);
    if (!year || !month) {
      console.log('No year or month provided, returning');
      return;
    }
    
    // Format month as "YYYY-MM" for logging
    const monthParam = `${year}-${month.toString().padStart(2, '0')}`;
    console.log(`Fetching monthly dashboard summary for month: ${monthParam}`);
    
    try {
      const result = await fetchMonthlyDashboardSummary(year, month);
      console.log('fetchMonthlyDashboardSummary result:', result);
    } catch (error) {
      console.error('Error in fetchMonthlyDashboardSummary:', error);
    }
  };

  // Handle year selection
  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedMonth(null);
    setSelectedWeek(null);
    setAvailableWeeks([]);
    
    // If in monthly view, fetch monthly data for the new year and current month
    if (viewMode === 'monthly' && selectedMonth) {
      fetchMonthlyData(year, selectedMonth);
    }
  };

  // Handle month selection
  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    setSelectedWeek(null);
    
    if (selectedYear) {
      if (viewMode === 'weekly') {
        fetchCalendarData(selectedYear, month, true);
      } else if (viewMode === 'monthly') {
        // Fetch monthly data when month changes in monthly view
        fetchMonthlyData(selectedYear, month);
      }
    }
  };

  // Handle week selection
  const handleWeekChange = (weekKey) => {
    setSelectedWeek(weekKey);
    setHasManuallyClosedModal(false); // Reset the flag when week changes
    // Fetch dashboard summary data when week is selected
    fetchSummaryData(weekKey);
  };

  // Handle view mode change (weekly/monthly) with improved state management
  const handleViewModeChange = async (mode) => {
    setViewMode(mode);
    
    if (mode === 'monthly') {
      // Clear week selection when switching to monthly view
      setSelectedWeek(null);
      
      // Fetch monthly data for the selected year and month
      if (selectedYear && selectedMonth) {
        console.log('Switching to monthly view - fetching monthly data');
        await fetchMonthlyData(selectedYear, selectedMonth);
      }
    } else if (mode === 'weekly') {
      // If switching back to weekly, ensure we have calendar data and a selected week
      if (selectedYear && selectedMonth) {
        if (availableWeeks.length === 0) {
          // Fetch calendar data if not available
          await fetchCalendarData(selectedYear, selectedMonth, true);
        } else if (selectedWeek) {
          // If we have weeks and a selected week, fetch weekly data
          console.log('Switching back to weekly view - fetching weekly data');
          await fetchSummaryData(selectedWeek);
        } else {
          // Auto-select current week if no week is selected
          const currentDate = dayjs();
          const currentWeekKey = findCurrentWeek(availableWeeks, currentDate);
          if (currentWeekKey) {
            setSelectedWeek(currentWeekKey);
          }
        }
      }
    }
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
    
    // Set success flash message flag
    setShowSuccessFlashMessage(true);
    
    // Refresh the dashboard data based on current view mode
    if (viewMode === 'weekly' && selectedWeek) {
      await fetchSummaryData(selectedWeek);
    } else if (viewMode === 'monthly' && selectedYear && selectedMonth) {
      await fetchMonthlyData(selectedYear, selectedMonth);
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
              Would you like to add more sales data or edit existing data for this {viewMode === 'weekly' ? 'week' : 'month'}?
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
          if (viewMode === 'weekly') {
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
          } else if (viewMode === 'monthly') {
            // Handle monthly view navigation
            if (selectedYear && selectedMonth) {
              // Store navigation context for the Dashboard component
              const navigationContext = {
                selectedYear: selectedYear,
                selectedMonth: selectedMonth,
                shouldOpenSalesModal: true,
                source: 'summary-dashboard',
                viewMode: 'monthly'
              };
              
              // Store in localStorage for Dashboard component to access
              localStorage.setItem('dashboardNavigationContext', JSON.stringify(navigationContext));
              
              // Show success message
              message.success('Navigating to Dashboard...');
              
              // Navigate to the main Dashboard component
              navigate('/dashboard');
              
              // Clear flash message
              setShowFlashMessage(false);
            } else {
              message.error('Unable to navigate: No year or month selected');
            }
          }
        };

  // Initialize with current year, month, and week
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Check if we already have selected year and month in the store
        if (!selectedYear || !selectedMonth) {
          const currentDate = dayjs();
          const currentYear = currentDate.year();
          const currentMonth = currentDate.month() + 1; // dayjs months are 0-indexed
          
          console.log(`Initializing dashboard with current year: ${currentYear}, month: ${currentMonth}`);
          
          setSelectedYear(currentYear);
          setSelectedMonth(currentMonth);
          
          // Fetch data based on current view mode
          if (viewMode === 'weekly') {
            // Fetch calendar data for current month and auto-select current week
            await fetchCalendarData(currentYear, currentMonth, true);
          } else if (viewMode === 'monthly') {
            // Fetch monthly data for current month
            await fetchMonthlyData(currentYear, currentMonth);
          }
        } else {
          // Use existing selected year and month from store
          console.log(`Using existing selection: year: ${selectedYear}, month: ${selectedMonth}`);
          
          // Fetch data based on current view mode
          if (viewMode === 'weekly') {
            // Fetch calendar data for the selected month
            await fetchCalendarData(selectedYear, selectedMonth, false);
          } else if (viewMode === 'monthly') {
            // Fetch monthly data for the selected month
            await fetchMonthlyData(selectedYear, selectedMonth);
          }
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
  }, [viewMode]); // Add viewMode to dependencies

  // Fetch summary data when selectedWeek changes
  useEffect(() => {
    console.log('selectedWeek useEffect triggered:', { selectedWeek, availableWeeks: availableWeeks.length });
    if (selectedWeek && availableWeeks.length > 0) {
      console.log('Calling fetchSummaryData for week:', selectedWeek);
      fetchSummaryData(selectedWeek);
    } else if (selectedWeek && availableWeeks.length === 0) {
      console.log('Week selected but no available weeks yet');
    }
  }, [selectedWeek, availableWeeks]);

  // Fetch monthly data when year or month changes in monthly view
  useEffect(() => {
    console.log('Monthly data useEffect triggered:', { 
      viewMode, 
      selectedYear, 
      selectedMonth,
      shouldFetch: viewMode === 'monthly' && selectedYear && selectedMonth 
    });
    
    if (viewMode === 'monthly' && selectedYear && selectedMonth) {
      console.log('Fetching monthly data for year:', selectedYear, 'month:', selectedMonth);
      fetchMonthlyData(selectedYear, selectedMonth);
    }
  }, [viewMode, selectedYear, selectedMonth]);

  // Log restaurant goals data for debugging (can be removed later)
  useEffect(() => {
    if (restaurantGoalsError) {
      console.error('Restaurant goals error:', restaurantGoalsError);
    }
  }, [restaurantGoals, restaurantGoalsError, restaurantGoalsLoading]);

  // Check if there's no data available
  const hasNoData = () => {
    console.log('hasNoData check:', {
      viewMode,
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
  };



  // Show flash message and handle auto-opening when no data is available (weekly view only)
  useEffect(() => {
    console.log('Flash message useEffect triggered:', {
      viewMode,
      selectedWeek,
      selectedYear,
      selectedMonth,
      hasNoData: hasNoData(),
      isSalesModalVisible,
      hasManuallyClosedModal,
      summaryLoading,
      dashboardSummaryData: dashboardSummaryData ? 'exists' : 'null',
      hasData: dashboardSummaryData && dashboardSummaryData.data && dashboardSummaryData.data.length > 0
    });

    // Only proceed for weekly view and if a week is selected
    if (viewMode !== 'weekly' || !selectedWeek) {
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
  }, [viewMode, selectedWeek, dashboardSummaryData, isSalesModalVisible, hasManuallyClosedModal, summaryLoading]);

  // Get selected week data
  const getSelectedWeekData = () => {
    if (!selectedWeek || !availableWeeks.length) return null;
    return availableWeeks.find(week => week.key === selectedWeek);
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

          <Card className="p-4 sm:p-6">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">


              {/* Calendar Dropdowns */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Year Dropdown */}
                  <div className="flex-1 min-w-[150px] w-full sm:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month
                    </label>
                    <Select
                      placeholder="Select Month"
                      value={selectedMonth}
                      onChange={handleMonthChange}
                      style={{ width: '100%', }}
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

                  {/* Week Dropdown - Only show in weekly view */}
                  {viewMode === 'weekly' && (
                    <div className="flex-1 min-w-[150px] w-full sm:w-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  )}
                {/* View Mode Toggle */}
                <div className="flex-1 min-w-[150px] w-full sm:w-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    View Mode
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewModeChange('weekly')}
                      className={` rounded-md text-sm font-medium transition-colors h-[32px] w-[100px] ${
                        viewMode === 'weekly'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => handleViewModeChange('monthly')}
                      className={` rounded-md text-sm font-medium transition-colors h-[32px] w-[100px]  ${
                        viewMode === 'monthly'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
                </div>

                {/* Loading indicator for weeks - Only show in weekly view */}
                {viewMode === 'weekly' && selectedMonth && loading && availableWeeks.length === 0 && (
                  <div className="text-center py-4">
                    <Spin size="small" /> Loading weeks...
                  </div>
                )}

                {/* No weeks available message - Only show in weekly view */}
                {viewMode === 'weekly' && selectedMonth && !loading && availableWeeks.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No weeks available for the selected month.
                  </div>
                )}
              </div>
            </Space>
          </Card>
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
           {(selectedWeek || viewMode === 'monthly') ? (
             <>
               {(() => {
                 console.log('Conditional rendering check:', {
                   selectedWeek,
                   viewMode,
                   selectedYear,
                   selectedMonth,
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
                                 {dashboardSummaryData?.message || (viewMode === 'weekly' ? 'No weekly dashboard data found for the selected week.' : 'No monthly dashboard data found for the selected month.')}
                               </p>
                               {viewMode === 'weekly' && (
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
                          viewMode={viewMode}
                        />
                        
                        {/* Budget Dashboard - Second */}
                        <BudgetDashboard 
                          dashboardData={dashboardSummaryData}
                          loading={summaryLoading}
                          error={summaryError}
                          onAddData={handleShowSalesModal}
                          onEditData={() => {
                            // Navigate to dashboard for editing
                            if (viewMode === 'weekly') {
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
                            } else if (viewMode === 'monthly') {
                              // For monthly view, navigate with month context
                              const navigationContext = {
                                selectedYear: selectedYear,
                                selectedMonth: selectedMonth,
                                shouldOpenSalesModal: true,
                                source: 'summary-dashboard',
                                viewMode: 'monthly'
                              };
                              localStorage.setItem('dashboardNavigationContext', JSON.stringify(navigationContext));
                              navigate('/dashboard');
                            }
                          }}
                          viewMode={viewMode}
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
                      viewMode === 'weekly' && !selectedWeek
                        ? "Please select a week to view dashboard data." 
                        : viewMode === 'monthly' && (!selectedYear || !selectedMonth)
                        ? "Please select a year and month to view monthly dashboard data."
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