import React, { useState, useEffect } from 'react';
import { DatePicker, Card, Row, Col, Typography, Space, Select, Spin, Empty, message } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
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
  const [selectedDate, setSelectedDate] = useState(null);

  // Calendar dropdown states
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [availableWeeks, setAvailableWeeks] = useState([]);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardMessage, setDashboardMessage] = useState(null);

  // Store integration
  const { 
    fetchDashboardDataIfNeeded
  } = useStore();

  // Restaurant goals functionality
  const { getRestaurentGoal, restaurantGoals, restaurantGoalsLoading, restaurantGoalsError } = useStore();

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
      
      // Check if the response indicates no data found
      if (data && data.status === "success" && data.message === "No weekly dashboard found for the given criteria." && data.data === null) {
        setDashboardData(null);
        setDashboardMessage(data.message);
      } else {
        setDashboardData(data);
        setDashboardMessage(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(null);
      setDashboardMessage(null);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Callback function to refresh dashboard data after any component saves data
  const refreshDashboardData = async () => {
    const weekStartDate = getSelectedWeekStartDate();
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
      }
    }
  };

  // Get the selected week start date
  const getSelectedWeekStartDate = () => {
    if (!selectedWeek || !availableWeeks.length) {
      return selectedDate;
    }

    const selectedWeekData = availableWeeks.find(week => week.key === selectedWeek);
    return selectedWeekData ? dayjs(selectedWeekData.startDate) : selectedDate;
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

  // Initialize with current year and fetch restaurant goals
  useEffect(() => {
    const currentYear = dayjs().year();
    setSelectedYear(currentYear);
    
    // Fetch restaurant goals when dashboard loads
    const fetchRestaurantGoals = async () => {
      try {
        await getRestaurentGoal();
      } catch (error) {
        console.error('Error fetching restaurant goals:', error);
      }
    };
    
    fetchRestaurantGoals();
  }, [getRestaurentGoal]);

  // Handle navigation context from Summary Dashboard
  useEffect(() => {
    const navigationContext = localStorage.getItem('dashboardNavigationContext');
    
    if (navigationContext) {
      try {
        const context = JSON.parse(navigationContext);
        
        // Check if this navigation came from Summary Dashboard
        if (context.source === 'summary-dashboard' && context.shouldOpenSalesModal) {
          console.log('🎯 Processing navigation context from Summary Dashboard:', context);
          
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
          
          // Don't clear the navigation context yet - let SalesTable handle it after opening modal
          // localStorage.removeItem('dashboardNavigationContext');
          
          // Show success message
          message.success('Welcome to Dashboard! Loading data for the selected week...');
        }
      } catch (error) {
        console.error('Error processing navigation context:', error);
        localStorage.removeItem('dashboardNavigationContext');
      }
    }
  }, []);

  // Log restaurant goals data for debugging (can be removed later)
  useEffect(() => {

    if (restaurantGoalsError) {
      console.error('Restaurant goals error:', restaurantGoalsError);
    }

  }, [restaurantGoals, restaurantGoalsError, restaurantGoalsLoading]);

  // Fetch dashboard data when selectedWeek changes and availableWeeks are loaded
  useEffect(() => {
    if (selectedWeek && availableWeeks.length > 0) {
      const selectedWeekData = availableWeeks.find(week => week.key === selectedWeek);
      if (selectedWeekData) {
        const weekStartDate = dayjs(selectedWeekData.startDate);
        setSelectedDate(weekStartDate);
        // Fetch dashboard data for the selected week
        fetchDashboardData(weekStartDate);
      }
    }
  }, [selectedWeek, availableWeeks]);

  // Show loading spinner when fetching dashboard data
  if (dashboardLoading) {
    return (
      <div className="w-full flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Loading dashboard data..." />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full mx-auto">
        <div className="mb-4 sm:mb-6">
          <Title level={3} className="mb-2 sm:mb-4 text-lg sm:text-xl lg:text-2xl">
            <CalendarOutlined className="mr-2" />
            Cash Flow Dashboard
          </Title>

          <Card className="p-4 sm:p-6">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Title level={4} className="text-base sm:text-lg lg:text-xl">Select Date</Title>
                <p className="text-gray-600 mb-2 sm:mb-4 text-sm sm:text-base">
                  Choose a year and month to view available weeks for that period.
                </p>
              </div>

              {/* Calendar Dropdowns */}
              <div className="space-y-4">
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
          {/* Restaurant Information Card */}
          <RestaurantInfoCard />
          
          {/* Only show dashboard components when a week is selected and dashboard data is available */}
          {selectedWeek && dashboardData ? (
            <>
              
              {/* Data Tables - Pass dashboard data to all components */}
              <SalesTable
                selectedDate={getSelectedWeekStartDate()}
                weekDays={getWeekDays()}
                dashboardData={dashboardData}
                refreshDashboardData={refreshDashboardData}
              />
              <CogsTable 
                selectedDate={getSelectedWeekStartDate()} 
                weekDays={getWeekDays()} 
                dashboardData={dashboardData}
                refreshDashboardData={refreshDashboardData}
              />
              <LabourTable 
                selectedDate={getSelectedWeekStartDate()} 
                weekDays={getWeekDays()} 
                dashboardData={dashboardData}
                refreshDashboardData={refreshDashboardData}
              />
              <ProfitCogsTable 
                selectedDate={getSelectedWeekStartDate()} 
                weekDays={getWeekDays()} 
                dashboardData={dashboardData}
                refreshDashboardData={refreshDashboardData}
              />
              <FixedExpensesTable 
                selectedDate={getSelectedWeekStartDate()} 
                weekDays={getWeekDays()} 
                dashboardData={dashboardData}
                refreshDashboardData={refreshDashboardData}
              />
              <NetProfitTable 
                selectedDate={getSelectedWeekStartDate()} 
                weekDays={getWeekDays()} 
                dashboardData={dashboardData}
                refreshDashboardData={refreshDashboardData}
              />
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
                selectedDate={getSelectedWeekStartDate()}
                weekDays={getWeekDays()}
                dashboardData={dashboardData}
                refreshDashboardData={refreshDashboardData}
              />
            </Card>
          )}
        </Space>
      </div>
    </div>
  );
};

export default Dashboard;