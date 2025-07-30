import React, { useState, useEffect } from 'react';
import { DatePicker, Card, Row, Col, Typography, Space, Select, Spin } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiGet } from '../../../utils/axiosInterceptors';
import SalesTable from './SalesTable';
import CogsTable from './CogsTable';
import LabourTable from './LabourTable';
import ProfitCogsTable from './ProfitCogsTable';
import FixedExpensesTable from './FixedExpenseTable';
import NetProfitTable from './NetProfitTable';

const { Title } = Typography;
const { Option } = Select;

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Calendar dropdown states
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);

  // Available options for dropdowns
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableWeeks, setAvailableWeeks] = useState([]);

  // Fetch calendar data
  const fetchCalendarData = async (year) => {
    setLoading(true);
    try {
      const response = await apiGet(`/restaurant/structured-calendar/?year=${year}`);
      setCalendarData(response.data);

      // Extract available years (assuming we can get multiple years)
      if (response.data.year) {
        setAvailableYears([response.data.year]);
        setSelectedYear(response.data.year);
      }

      // Extract available months
      if (response.data.months) {
        const months = Object.keys(response.data.months).map(monthKey => ({
          key: monthKey,
          name: response.data.months[monthKey].month_name,
          data: response.data.months[monthKey]
        }));
        setAvailableMonths(months);
      }

    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle year selection
  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedMonth(null);
    setSelectedWeek(null);
    setAvailableWeeks([]);
    fetchCalendarData(year);
  };

  // Handle month selection
  const handleMonthChange = (monthKey) => {
    setSelectedMonth(monthKey);
    setSelectedWeek(null);

    if (calendarData && calendarData.months && calendarData.months[monthKey]) {
      const monthData = calendarData.months[monthKey];
      const weeks = Object.keys(monthData.weeks).map(weekKey => ({
        key: weekKey,
        weekNumber: monthData.weeks[weekKey].week_number,
        startDate: monthData.weeks[weekKey].start_date,
        endDate: monthData.weeks[weekKey].end_date,
        data: monthData.weeks[weekKey]
      }));
      setAvailableWeeks(weeks);
    }
  };

  // Handle week selection
  const handleWeekChange = (weekKey) => {
    setSelectedWeek(weekKey);

    // Find the selected week data and set the date to the start of the week
    if (availableWeeks.length > 0) {
      const selectedWeekData = availableWeeks.find(week => week.key === weekKey);
      if (selectedWeekData) {
        setSelectedDate(dayjs(selectedWeekData.startDate));
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

  // Initialize with current year
  useEffect(() => {
    const currentYear = dayjs().year();
    fetchCalendarData(currentYear);
  }, []);

  return (
    <div className="w-full p-6">
      <div className="w-full mx-auto">
        <div className="mb-6">
          <Title level={2} className="mb-4">
            <CalendarOutlined className="mr-2" />
            Restaurant Dashboard
          </Title>

          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Title level={4}>Select Date</Title>
                <p className="text-gray-600 mb-4">
                  Choose a date to view and manage dashboard data for that period.
                </p>
              </div>

              {/* Calendar Dropdowns */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Year Dropdown */}
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <Select
                      placeholder="Select Year"
                      value={selectedYear}
                      onChange={handleYearChange}
                      style={{ width: '100%' }}
                      loading={loading}
                    >
                      {availableYears.map(year => (
                        <Option key={year} value={year}>
                          {year}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  {/* Month Dropdown */}
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <Select
                      placeholder="Select Month"
                      value={selectedMonth}
                      onChange={handleMonthChange}
                      style={{ width: '100%' }}
                      disabled={!selectedYear}
                    >
                      {availableMonths.map(month => (
                        <Option key={month.key} value={month.key}>
                          {month.name}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  {/* Week Dropdown */}
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Week
                    </label>
                    <Select
                      placeholder="Select Week"
                      value={selectedWeek}
                      onChange={handleWeekChange}
                      style={{ width: '100%' }}
                      disabled={!selectedMonth}
                    >
                      {availableWeeks.map(week => (
                        <Option key={week.key} value={week.key}>
                          Week {week.weekNumber} ({dayjs(week.startDate).format('MMM DD')} - {dayjs(week.endDate).format('MMM DD')})
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Original Date Picker
                <div style={{ maxWidth: '300px' }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or Select Specific Date
                  </label>
                  <DatePicker
                    picker="date"
                    value={selectedDate}
                    onChange={setSelectedDate}
                    style={{ width: '100%' }}
                    placeholder="Select date"
                    format="YYYY-MM-DD"
                  />
                </div> */}
              </div>
            </Space>
          </Card>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <SalesTable
            selectedDate={getSelectedWeekStartDate()}
            weekDays={getWeekDays()}
          />
          <CogsTable selectedDate={getSelectedWeekStartDate()} weekDays={getWeekDays()} />
          <LabourTable selectedDate={getSelectedWeekStartDate()} weekDays={getWeekDays()} />
          <ProfitCogsTable selectedDate={getSelectedWeekStartDate()} weekDays={getWeekDays()} />
          <FixedExpensesTable selectedDate={getSelectedWeekStartDate()} weekDays={getWeekDays()} />
          <NetProfitTable selectedDate={getSelectedWeekStartDate()} weekDays={getWeekDays()} />
        </Space>
      </div>
    </div>
  );
};

export default Dashboard;