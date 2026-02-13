import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DatePicker, Card, Row, Col, Typography, Space, Select, Spin, Empty, Modal, Button, message } from 'antd';
import { CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);
import { apiGet } from '../../../utils/axiosInterceptors';
import useStore from '../../../store/store';
import SalesTable from './SalesTable';
import CogsTable from './CogsTable';
import LabourTable from './LabourTable';
import ProfitCogsTable from './ProfitCogsTable';
import FixedExpensesTable from './FixedExpenseTable';
import NetProfitTable from './NetProfitTable';
import RestaurantInfoCard from './RestaurantInfoCard';
import SummaryTableDashboard from '../summaryDashboard/SummaryTableDashboard';

const { Title } = Typography;
const { Option } = Select;

const Dashboard = () => {
  // Store integration for date selection persistence
  const { 
    fetchDashboardDataIfNeeded,
    fetchDashboardData: fetchDashboardDataFromStore,
    ensureRestaurantId,
    // Date selection from store
    selectedYear,
    selectedMonth,
    selectedWeek,
    availableWeeks,
    setSelectedDate,
    setSelectedYear,
    setSelectedMonth,
    setSelectedWeek,
    setAvailableWeeks,
    getDateSelection
  } = useStore();

  // Local loading states
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardMessage, setDashboardMessage] = useState(null);
  const [weekPickerValue, setWeekPickerValue] = useState(null);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState(null);

  // Restaurant goals functionality
  const { getRestaurentGoal, restaurantGoals, restaurantGoalsLoading, restaurantGoalsError } = useStore();

  // Weekly average data functionality
  const {
    checkWeeklyAverageData,
    submitWeeklyAverageData,
    weeklyAverageLoading,
    weeklyAverageError
  } = useStore();

  // Weekly average modal states
  const [isWeeklyAverageDataPopupVisible, setIsWeeklyAverageDataPopupVisible] = useState(false);
  const [weeklyAveragePopupData, setWeeklyAveragePopupData] = useState(null);
  const weeklyAverageModalShown = useRef(null);
  const isProcessingWeek = useRef(false);
  const [isAutoAverageLoading, setIsAutoAverageLoading] = useState(false);

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

  // Fetch calendar data for selected year and month
  const fetchCalendarData = async (year, month) => {
    setLoading(true);
    try {
      const response = await apiGet(`/restaurant/structured-calendar/?month=${month}&year=${year}`);

      // Extract weeks from the response
      if (response.data && response.data.weeks) {
        const weeks = Object.keys(response.data.weeks).map(weekKey => ({
          key: weekKey,
          weekNumber: response.data.weeks[weekKey].week_number,
          startDate: response.data.weeks[weekKey].start_date,
          endDate: response.data.weeks[weekKey].end_date,
          data: response.data.weeks[weekKey]
        }));
        setAvailableWeeks(weeks);
      } else {
        setAvailableWeeks([]);
      }

    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setAvailableWeeks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard data for the selected week
  const fetchDashboardData = async (weekStartDate) => {
    if (!weekStartDate) return;
    
    setDashboardLoading(true);
    setDashboardMessage(null);
    
    try {
      const data = await fetchDashboardDataIfNeeded(weekStartDate.format('YYYY-MM-DD'));
      
      // If no data returned (null), this means no restaurant ID was found
      if (!data) {
        setDashboardData(null);
        setDashboardMessage('Please complete your onboarding setup first to view dashboard data.');
        return;
      }
      
      // Check if the response indicates no data found
      // API response format: {"status":"success","message":"No weekly dashboard found","data":null}
      const isNoDataResponse = data && 
                               data.status === "success" && 
                               (data.message === "No weekly dashboard found" || 
                                data.message === "No weekly dashboard found for the given criteria.") &&
                               data.data === null;
      
      if (isNoDataResponse) {
        setDashboardData(null);
        setDashboardMessage(data.message);
      } else {
        // Data exists - populate it
        setDashboardData(data);
        setDashboardMessage(null);
      }
    } catch (error) {
      console.error('❌ Dashboard: Error fetching dashboard data:', error);
      setDashboardData(null);
      setDashboardMessage(null);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Process week selection - Check for data first, then weekly average
  const processWeekSelection = useCallback(async (weekStartDate) => {
    if (!weekStartDate) return;
    
    const startDate = weekStartDate.format('YYYY-MM-DD');
    const endDate = weekStartDate.endOf('week').format('YYYY-MM-DD');
    const dateRangeKey = `${startDate}-${endDate}`;
    
    // Prevent duplicate processing
    if (isProcessingWeek.current === dateRangeKey) {
      return;
    }
    
    // Mark as processing
    isProcessingWeek.current = dateRangeKey;
    
    // Reset modal states for new date range
    setIsWeeklyAverageDataPopupVisible(false);
    setWeeklyAveragePopupData(null);
    
    try {
      // Step 1: Fetch dashboard data and check if selected week has data
      const data = await fetchDashboardDataIfNeeded(startDate);
      
      // Check if response indicates no data found
      // API response format: {"status":"success","message":"No weekly dashboard found","data":null}
      const isNoDataResponse = data && 
                               data.status === "success" && 
                               (data.message === "No weekly dashboard found" || 
                                data.message === "No weekly dashboard found for the given criteria.") &&
                               data.data === null;
      
      // Check if selected week has valid data (data exists and is not null)
      const hasData = data && 
                     data.status === "success" && 
                     data.data !== null &&
                     !isNoDataResponse;
      
      // Update dashboard data state
      if (hasData) {
        setDashboardData(data);
        setDashboardMessage(null);
        // Week has data, proceed normally (no modals)
        isProcessingWeek.current = null;
        return;
      }
      
      // Step 2: Selected week has no data - check for 3 previous weeks data
      // Only proceed if we confirmed there's no data for this week
      // NOTE: Weekly Average Data modal is disabled for Close Out Your Day(s) page
      if (isNoDataResponse) {
        setDashboardData(null);
        setDashboardMessage(data.message || "No weekly dashboard found");
        
        // Weekly average modal is disabled for Close Out Your Day(s) page
        // Users should manually enter data instead
        weeklyAverageModalShown.current = dateRangeKey;
      } else {
        // If response format is unexpected, set data anyway and proceed
        setDashboardData(data);
        setDashboardMessage(data?.message || null);
        weeklyAverageModalShown.current = dateRangeKey;
      }
    } catch (error) {
      console.error('Error in week selection:', error);
      // Fallback: fetch dashboard data normally
      await fetchDashboardData(weekStartDate);
    } finally {
      // Reset processing flag after a delay to allow modal to show
      setTimeout(() => {
        isProcessingWeek.current = null;
      }, 1000);
    }
  }, [checkWeeklyAverageData, fetchDashboardDataIfNeeded]);

  // Callback function to refresh dashboard data after any component saves data
  const refreshDashboardData = async () => {
    const { weekStartDate } = getDateSelection();
    if (weekStartDate) {
      await fetchDashboardData(weekStartDate);
    }
  };

  // Handle weekly average data popup actions
  const handleAutoAverage = async () => {
    try {
      const { weekStartDate } = getDateSelection();
      if (weekStartDate) {
        const startDate = weekStartDate.format('YYYY-MM-DD');
        const endDate = weekStartDate.endOf('week').format('YYYY-MM-DD');
        const dateRangeKey = `${startDate}-${endDate}`;
        
        // Set loading state
        setIsAutoAverageLoading(true);
        
        // Close modal immediately to prevent duplicate clicks
        setIsWeeklyAverageDataPopupVisible(false);
        
        // Submit the previous 3 weeks data via POST API (same endpoint)
        const response = await submitWeeklyAverageData(null, startDate, endDate, {
          use_previous_data: true
        });
        
        // Check if API response indicates success
        // API response format: {"message": "Processed 1 weekly entries.", "entries": [...]}
        const isSuccess = response && 
                         (response.message?.includes('Processed') || 
                          response.entries?.length > 0);
        
        if (isSuccess && response.entries && response.entries.length > 0) {
          // Extract week_start from the response
          const createdEntry = response.entries[0];
          const responseWeekStart = createdEntry.week_start;
          
          // Mark as shown so it doesn't show again
          weeklyAverageModalShown.current = dateRangeKey;
          
          message.success('Previous 3 weeks data applied successfully! 🎉');
          
          // Wait a moment for the backend to process, then fetch the dashboard data for the created week
          setTimeout(async () => {
            if (responseWeekStart) {
              // Parse the week_start from response and fetch dashboard data for that week
              const createdWeekStartDate = dayjs(responseWeekStart);
              const createdWeekEndDate = createdWeekStartDate.endOf('week');
              const createdWeekKey = `${createdWeekStartDate.format('YYYY-MM-DD')}_${createdWeekEndDate.format('YYYY-MM-DD')}`;
              
              // Update selected date and week in store
              setSelectedDate(createdWeekStartDate);
              setSelectedYear(createdWeekStartDate.year());
              setSelectedMonth(createdWeekStartDate.month() + 1);
              setSelectedWeek(createdWeekKey);
              
              // Update week picker value
              setWeekPickerValue(createdWeekStartDate);
              
              // Update available weeks
              setAvailableWeeks([{
                key: createdWeekKey,
                weekNumber: createdWeekStartDate.week(),
                startDate: createdWeekStartDate.format('YYYY-MM-DD'),
                endDate: createdWeekEndDate.format('YYYY-MM-DD'),
                data: null
              }]);
              
              // Wait a bit more for backend to fully process
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Force fresh fetch from store (bypasses cache) - this updates the store
              let freshData = await fetchDashboardDataFromStore(responseWeekStart);
              
              // Check if we got valid data
              const hasValidData = freshData && 
                                 freshData.status === "success" && 
                                 freshData.data !== null &&
                                 !(freshData.message === "No weekly dashboard found" || 
                                   freshData.message === "No weekly dashboard found for the given criteria.");
              
              if (!hasValidData) {
                // If still no data, wait longer and try again
                await new Promise(resolve => setTimeout(resolve, 500));
                freshData = await fetchDashboardDataFromStore(responseWeekStart);
              }
              
              // Also use local fetchDashboardData to ensure local state is updated
              await fetchDashboardData(createdWeekStartDate);
              
              // Final refresh to ensure all components are updated
              await refreshDashboardData();
            } else {
              // Fallback: use the original weekStartDate
              await refreshDashboardData();
              await fetchDashboardData(weekStartDate);
            }
            
            // Clear loading state after data is populated
            setIsAutoAverageLoading(false);
          }, 800);
        } else {
          throw new Error('Unexpected response format');
        }
      }
    } catch (error) {
      console.error('Error using auto average:', error);
      message.error('Failed to apply previous data. Please try again.');
      // Clear loading state on error
      setIsAutoAverageLoading(false);
      // Re-open modal on error so user can try again
      setIsWeeklyAverageDataPopupVisible(true);
    }
  };

  const handleManualEntry = () => {
    setIsWeeklyAverageDataPopupVisible(false);
    // The user will manually add data via the SalesTable "Add Actual Weekly Sales" button
    // We can trigger it programmatically if needed, but for now just close the modal
  };

  const handleCloseWeeklyAverageDataPopup = () => {
    setIsWeeklyAverageDataPopupVisible(false);
    // Return to week selection state without making changes
    setWeeklyAveragePopupData(null);
    // Clear loading state if modal is closed
    setIsAutoAverageLoading(false);
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
      fetchCalendarData(selectedYear, month);
    }
  };

  // Handle week selection
  const handleWeekChange = async (weekKey) => {
    setSelectedWeek(weekKey);

    // Find the selected week data and set the date to the start of the week
    if (availableWeeks.length > 0) {
      const selectedWeekData = availableWeeks.find(week => week.key === weekKey);
      
      if (selectedWeekData) {
        const weekStartDate = dayjs(selectedWeekData.startDate);
        setSelectedDate(weekStartDate);
        // Process week selection (checks for data first, then weekly average)
        await processWeekSelection(weekStartDate);
      }
    }
  };

  // New: Single Week Picker handler (replaces Year/Month/Week dropdowns)
  const handleWeekPickerChange = async (date) => {
    if (!date) {
      setSelectedWeek(null);
      setAvailableWeeks([]);
      return;
    }

    // Compute start and end of the selected week
    const weekStart = dayjs(date).startOf('week');
    const weekEnd = dayjs(date).endOf('week');
    const weekKey = `${weekStart.format('YYYY-MM-DD')}_${weekEnd.format('YYYY-MM-DD')}`;

    // Show value in picker
    setWeekPickerValue(date);

    // Sync store state for backwards compatibility
    setSelectedYear(weekStart.year());
    setSelectedMonth(weekStart.month() + 1);

    // Provide a minimal availableWeeks entry so existing logic continues to work
    setAvailableWeeks([
      {
        key: weekKey,
        weekNumber: weekStart.week(),
        startDate: weekStart.format('YYYY-MM-DD'),
        endDate: weekEnd.format('YYYY-MM-DD'),
        data: null
      }
    ]);

    // Select week and process (checks for data first, then weekly average)
    setSelectedWeek(weekKey);
    setSelectedDate(weekStart);
    await processWeekSelection(weekStart);
  };

  // Generate week days based on selected week
  const getWeekDays = () => {
    if (!selectedWeek || !availableWeeks.length) {
      return [];
    }

    const selectedWeekData = availableWeeks.find(week => week.key === selectedWeek);
    if (!selectedWeekData) {
      return [];
    }

    // Use the days from the API response if available
    if (selectedWeekData.data && selectedWeekData.data.days) {
      return selectedWeekData.data.days
        .filter(day => day.belongs_to_year) // Only include days that belong to the selected year
        .map(day => ({
          date: dayjs(day.date),
          dayName: day.day_name,
          dayNumber: day.day_number,
          month: day.month,
          isWeekend: day.is_weekend,
          belongsToYear: day.belongs_to_year
        }));
    }

    // Fallback: Generate 7 days starting from the start date
    const weekDays = [];
    const startDate = dayjs(selectedWeekData.startDate);

    for (let i = 0; i < 7; i++) {
      const currentDate = startDate.add(i, 'day');
      weekDays.push({
        date: currentDate,
        dayName: currentDate.format('dddd'),
        dayNumber: currentDate.date(),
        month: currentDate.month() + 1,
        isWeekend: [0, 6].includes(currentDate.day()), // 0 = Sunday, 6 = Saturday
        belongsToYear: currentDate.year() === selectedYear // Check if the date belongs to the selected year
      });
    }

    return weekDays;
  };

  // Professional initialization with proper state management
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Check if we already have a selected year in the store
        const { selectedYear: storeSelectedYear, selectedMonth: storeSelectedMonth } = getDateSelection();
        
        let yearToUse = storeSelectedYear;
        let monthToUse = storeSelectedMonth;
        
        // If no year/month in store, use current date
        if (!yearToUse) {
          yearToUse = dayjs().year();
          setSelectedYear(yearToUse);
        }
        
        if (!monthToUse) {
          monthToUse = dayjs().month() + 1; // dayjs months are 0-indexed
          setSelectedMonth(monthToUse);
        }
        
        // Only clear selected week if we're initializing with current month
        // This prevents clearing a valid selection when navigating back
        const currentDate = dayjs();
        const currentYear = currentDate.year();
        const currentMonth = currentDate.month() + 1;
        
        if (yearToUse === currentYear && monthToUse === currentMonth) {
          // Only clear if we're viewing the current month, to allow auto-selection of current week
          setSelectedWeek(null);
        }
        
        // Fetch calendar data for the month
        await fetchCalendarData(yearToUse, monthToUse);

        // Default: select current week in picker and state
        const now = dayjs();
        setWeekPickerValue(now);
        const weekStart = now.startOf('week');
        const weekEnd = now.endOf('week');
        const weekKey = `${weekStart.format('YYYY-MM-DD')}_${weekEnd.format('YYYY-MM-DD')}`;
        setAvailableWeeks([
          {
            key: weekKey,
            weekNumber: now.week(),
            startDate: weekStart.format('YYYY-MM-DD'),
            endDate: weekEnd.format('YYYY-MM-DD'),
            data: null
          }
        ]);
        setSelectedWeek(weekKey);
        setSelectedDate(weekStart);
        await fetchDashboardData(weekStart);
        
        // Fetch restaurant goals
        await fetchRestaurantGoals();
        
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      }
    };

    const fetchRestaurantGoals = async () => {
      try {
        
        const restaurantId = await ensureRestaurantId();
        
        if (!restaurantId) {
          console.warn('⚠️ No restaurant ID available, cannot fetch goals');
          return;
        }
        
        // Always fetch fresh data on page load/reload
        // Don't skip if data exists - we want fresh data on reload
        const result = await getRestaurentGoal(restaurantId);
        
        if (result) {
          if (result.restaurant_days && Array.isArray(result.restaurant_days)) {
          } else {
          }
        } else {
          console.warn('⚠️ Restaurant goals API returned null');
        }
      } catch (error) {
        console.error('❌ Restaurant goals error:', error.message);
        
        if (error.message.includes('Restaurant ID is required') || 
            error.message.includes('Restaurant goals not found')) {
          console.warn('⚠️ Restaurant goals not available:', error.message);
        }
      }
    };

    initializeDashboard();
  }, []); // Only run once on mount

  // Handle navigation context from Summary Dashboard with improved state management
  useEffect(() => {
    const navigationContext = localStorage.getItem('dashboardNavigationContext');
    
    if (navigationContext) {
      try {
        const context = JSON.parse(navigationContext);
        
        // Set the selected date, year, and month
        if (context.selectedDate) {
          const targetDate = dayjs(context.selectedDate);
          const targetYear = targetDate.year();
          const targetMonth = targetDate.month() + 1; // dayjs months are 0-indexed
          
          setSelectedYear(targetYear);
          setSelectedMonth(targetMonth);
          
          // Fetch calendar data for the target month
          fetchCalendarData(targetYear, targetMonth).then(() => {
            // After calendar data is loaded, set the selected week
            if (context.selectedWeek) {
              setSelectedWeek(context.selectedWeek);
            }
          });
        }
        
        // Clear the navigation context
        localStorage.removeItem('dashboardNavigationContext');
        
      } catch (error) {
        console.error('Error processing navigation context:', error);
        localStorage.removeItem('dashboardNavigationContext');
      }
    }
  }, []);

  // Professional auto-select logic with proper state validation
  useEffect(() => {
    if (availableWeeks.length > 0 && !selectedWeek) {
      const currentDate = dayjs();
      const currentMonth = currentDate.month() + 1; // dayjs months are 0-indexed
      
      
      
      // Check if current month is the same as selected month
      if (selectedMonth === currentMonth) {
        // If same month, find the week that contains the current date
        const currentWeek = availableWeeks.find(week => {
          const weekStart = dayjs(week.startDate);
          const weekEnd = dayjs(week.endDate);
          
          
          // Check if current date is between week start and end (inclusive)
          return currentDate.isSame(weekStart, 'day') || 
                 currentDate.isSame(weekEnd, 'day') || 
                 (currentDate.isAfter(weekStart, 'day') && currentDate.isBefore(weekEnd, 'day'));
        });
        

        
        // If current week is found, select it; otherwise fall back to first week
        const weekToSelect = currentWeek || availableWeeks[0];
        
        setSelectedWeek(weekToSelect.key);
      } else {
        // If different month, select the first week
        
        setSelectedWeek(availableWeeks[0].key);
      }
    }
  }, [availableWeeks, selectedWeek, selectedMonth]);

  // Professional dashboard data fetching with proper state validation
  useEffect(() => {
    if (selectedWeek && availableWeeks.length > 0) {
      const selectedWeekData = availableWeeks.find(week => week.key === selectedWeek);
      
      
      if (selectedWeekData) {
        const weekStartDate = dayjs(selectedWeekData.startDate);
        
        setSelectedDate(weekStartDate);
        // Process week selection (checks for data first, then weekly average)
        processWeekSelection(weekStartDate);
      }
    }
  }, [selectedWeek, availableWeeks, processWeekSelection]);



  // Log restaurant goals data for debugging (can be removed later)
  useEffect(() => {
    if (restaurantGoalsError) {
      console.error('Restaurant goals error:', restaurantGoalsError);
    }
  }, [restaurantGoals, restaurantGoalsError, restaurantGoalsLoading]);

  // Show loading spinner when fetching dashboard data
  if (dashboardLoading) {
    return (
      <div className="w-full flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Loading dashboard data..." />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      {/* Weekly Average Data Popup - Show at top when 3 weeks data available - HIGHEST PRIORITY */}
      <Modal
        title="Weekly Average Data Available"
        open={isWeeklyAverageDataPopupVisible}
        onCancel={handleCloseWeeklyAverageDataPopup}
        footer={[
          <Button
            key="manual"
            onClick={handleManualEntry}
            className="border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200"
          >
            Manual
          </Button>,
          <Button
            key="auto"
            type="primary"
            icon={<DollarOutlined />}
            onClick={handleAutoAverage}
            loading={weeklyAverageLoading || isAutoAverageLoading}
            disabled={weeklyAverageLoading || isAutoAverageLoading}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Auto
          </Button>,
          <Button
            key="close"
            onClick={handleCloseWeeklyAverageDataPopup}
            className="border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200"
          >
            Close
          </Button>
        ]}
        width={600}
        centered
        maskClosable={false}
        destroyOnClose={true}
        zIndex={10000}
        getContainer={false}
        maskStyle={{ zIndex: 9999 }}
        style={{ zIndex: 10000 }}
        className="weekly-average-modal-top"
      >
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-md p-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-blue-800">
                We Found Your Last 3 Weeks of Data
                </h3>
              </div>
              <p className="text-blue-700 text-base leading-relaxed mb-4">
                Good news! Because you've entered your actual sales data for the past 3 weeks, the Auto feature is now active.
              </p>
              <p className="text-yellow-700 text-md leading-relaxed mb-4">When you choose Auto, Growlio will automatically complete your sales budget for the week using your daily averages. You'll still have full control to review and adjust any numbers afterward if needed.</p>
              
              <div className="bg-white rounded-lg p-4 border border-blue-200 mb-4">
                {/* <h4 className="font-semibold text-blue-800 mb-3">Your Options:</h4> */}
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><span className="font-medium">Auto:</span> When you select Auto, Growlio uses your last 3 weeks of sales data by day of the week, averaging all your Mondays, all your Tuesdays, and so on. This trailing 3-week average gives you a more accurate daily sales trend and helps you plan labor and food costs with confidence.</li>
                  <li><span className="font-medium">Manual:</span> Enter all data yourself. A quick warning will appear if it's a future week.</li>
                  <li><span className="font-medium">Close:</span> Return to the week selection screen without making changes.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Header Section with same styling as other dashboard pages */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
          {/* Left Side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              Enter Weekly Data
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your restaurant's weekly financial data including sales, costs, and labor information
            </p>
          </div>
          {/* Right Side - Week Picker */}
          <div className="w-full lg:w-auto" data-guidance="week_selector_help">
            <div className="min-w-[220px] w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Week</label>
              <DatePicker
                picker="week"
                style={{ width: '100%' }}
                value={weekPickerValue}
                format={(value) => {
                  if (!value) return 'Select week';
                  const start = dayjs(value).startOf('week');
                  const end = dayjs(value).endOf('week');
                  const wk = dayjs(value).week();
                  return `Week ${wk} (${start.format('MMM DD')} - ${end.format('MMM DD')})`;
                }}
                onChange={handleWeekPickerChange}
                allowClear
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="w-full">
        <div className="w-full mx-auto">
          {/* Week picker moved to header */}

          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Debug Component - Remove this in production */}
            
            {/* Restaurant Information Card */}
            <RestaurantInfoCard />
            
            {/* Only show dashboard components when a week is selected and dashboard data is available */}
            {selectedWeek && dashboardData ? (
              <>
                
                {/* Data Tables - Pass dashboard data to all components */}
                <SalesTable
                  selectedDate={getDateSelection().weekStartDate}
                  weekDays={getWeekDays()}
                  dashboardData={dashboardData}
                  refreshDashboardData={refreshDashboardData}
                  dashboardLoading={dashboardLoading}
                />
                <CogsTable 
                  selectedDate={getDateSelection().weekStartDate} 
                  weekDays={getWeekDays()} 
                  dashboardData={dashboardData}
                  refreshDashboardData={refreshDashboardData}
                />
                <LabourTable 
                  selectedDate={getDateSelection().weekStartDate} 
                  weekDays={getWeekDays()} 
                  dashboardData={dashboardData}
                  refreshDashboardData={refreshDashboardData}
                />
                {/* <ProfitCogsTable 
                  selectedDate={getDateSelection().weekStartDate} 
                  weekDays={getWeekDays()} 
                  dashboardData={dashboardData}
                  refreshDashboardData={refreshDashboardData}
                />
                <FixedExpensesTable 
                  selectedDate={getDateSelection().weekStartDate} 
                  weekDays={getWeekDays()} 
                  dashboardData={dashboardData}
                  refreshDashboardData={refreshDashboardData}
                />
                <NetProfitTable 
                  selectedDate={getDateSelection().weekStartDate} 
                  weekDays={getWeekDays()} 
                  dashboardData={dashboardData}
                  refreshDashboardData={refreshDashboardData}
                /> */}
              </>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      !selectedWeek 
                        ? "Please select a week to view dashboard data." 
                        : dashboardMessage || "No dashboard data available for the selected week."
                    }
                  />
                </div>
                <SalesTable
                  selectedDate={getDateSelection().weekStartDate}
                  weekDays={getWeekDays()}
                  dashboardData={dashboardData}
                  refreshDashboardData={refreshDashboardData}
                  dashboardLoading={dashboardLoading}
                />
              </Card>
            )}
          </Space>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;