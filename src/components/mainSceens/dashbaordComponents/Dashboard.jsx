import React, { useState, useEffect } from 'react';
import { DatePicker, Card, Row, Col, Typography, Space, Select, Spin, Empty } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
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
      if (data && data.status === "success" && data.message === "No weekly dashboard found for the given criteria." && data.data === null) {
        setDashboardData(null);
        setDashboardMessage(data.message);
      } else {
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

  // Callback function to refresh dashboard data after any component saves data
  const refreshDashboardData = async () => {
    const { weekStartDate } = getDateSelection();
    if (weekStartDate) {
      await fetchDashboardData(weekStartDate);
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
      fetchCalendarData(selectedYear, month);
    }
  };

  // Handle week selection
  const handleWeekChange = (weekKey) => {
    setSelectedWeek(weekKey);

    // Find the selected week data and set the date to the start of the week
    if (availableWeeks.length > 0) {
      const selectedWeekData = availableWeeks.find(week => week.key === weekKey);
      
      if (selectedWeekData) {
        const weekStartDate = dayjs(selectedWeekData.startDate);
        setSelectedDate(weekStartDate);
        // Fetch dashboard data for the selected week
        fetchDashboardData(weekStartDate);
      } else {
      }
    } else {
    }
  };

  // New: Single Week Picker handler (replaces Year/Month/Week dropdowns)
  const handleWeekPickerChange = (date) => {
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

    // Select week and fetch
    setSelectedWeek(weekKey);
    setSelectedDate(weekStart);
    fetchDashboardData(weekStart);
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
          return;
        }
        
        const result = await getRestaurentGoal(restaurantId);
        if (result === null) {
        }
      } catch (error) {
        console.error('Restaurant goals error:', error.message);
        
        if (error.message.includes('Restaurant ID is required') || 
            error.message.includes('Restaurant goals not found')) {
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
        // Fetch dashboard data for the selected week
        fetchDashboardData(weekStartDate);
      } else {

      }
    } else {
      
    }
  }, [selectedWeek, availableWeeks]);



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
          <div className="w-full lg:w-auto">
            <div className="min-w-[220px] w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Week Picker</label>
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