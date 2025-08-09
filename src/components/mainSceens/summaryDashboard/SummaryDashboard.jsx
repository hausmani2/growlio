import React, { useState, useEffect } from 'react';
import { DatePicker, Card, Row, Col, Typography, Space, Select, Spin, Empty, Button } from 'antd';
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiGet } from '../../../utils/axiosInterceptors';
import useStore from '../../../store/store';
import SummaryTableDashboard from './SummaryTableDashboard';
import SalesDataModal from './SalesDataModal';

const { Title } = Typography;
const { Option } = Select;

const SummaryDashboard = () => {
  // Calendar dropdown states
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [availableWeeks, setAvailableWeeks] = useState([]);

  // Modal states
  const [isSalesModalVisible, setIsSalesModalVisible] = useState(false);

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
    // Fetch dashboard summary data when week is selected
    fetchSummaryData(weekKey);
  };

  // Handle sales modal visibility
  const handleShowSalesModal = () => {
    setIsSalesModalVisible(true);
  };

  const handleCloseSalesModal = () => {
    setIsSalesModalVisible(false);
  };

  // Handle data saved callback
  const handleDataSaved = async () => {
    // Refresh the dashboard data
    if (selectedWeek) {
      await fetchSummaryData(selectedWeek);
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
        await getRestaurentGoal();
      } catch (error) {
        console.error('Error fetching restaurant goals:', error);
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

  // Get selected week data
  const getSelectedWeekData = () => {
    if (!selectedWeek || !availableWeeks.length) return null;
    return availableWeeks.find(week => week.key === selectedWeek);
  };

  return (
    <div className="w-full">
      <div className="w-full mx-auto">
        <div className="mb-4 sm:mb-6">
          <Title level={3} className="mb-2 sm:mb-4 text-lg sm:text-xl lg:text-2xl">
           Summary Dashboard
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
          
          {/* Only show dashboard components when a week is selected and dashboard data is available */}
          {selectedWeek ? (
            <>
              {hasNoData() ? (
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
                <SummaryTableDashboard 
                  dashboardSummaryData={dashboardSummaryData}
                  loading={summaryLoading}
                  error={summaryError}
                />
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
      />
    </div>
  );
};

export default SummaryDashboard;