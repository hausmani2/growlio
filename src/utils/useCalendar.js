import { useState } from 'react';
import dayjs from 'dayjs';

// Weekly-only calendar state hook
const useCalendar = ({
  initialViewMode = 'weekly',
  initialYear = null,
  initialMonth = null
} = {}) => {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [selectedYear, setSelectedYear] = useState(initialYear || dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || dayjs().month() + 1);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setSelectedMonth(null);
    setSelectedWeek(null);
    setAvailableWeeks([]);
  };

  const handleMonthChange = (month, weeks = []) => {
    setSelectedMonth(month);
    setSelectedWeek(null);
    if (weeks.length > 0) {
      setAvailableWeeks(weeks);

      const currentDate = dayjs();
      const currentMonth = currentDate.month() + 1;
      const currentYear = currentDate.year();

      let weekToSelect = null;
      if (month === currentMonth && selectedYear === currentYear) {
        weekToSelect = weeks.find(week => {
          const weekStart = dayjs(week.startDate);
          const weekEnd = dayjs(week.endDate);
          return currentDate.isSame(weekStart, 'day') ||
                 currentDate.isSame(weekEnd, 'day') ||
                 (currentDate.isAfter(weekStart, 'day') && currentDate.isBefore(weekEnd, 'day'));
        })?.key;
      }
      if (!weekToSelect) {
        weekToSelect = weeks[0].key;
      }
      if (weekToSelect) {
        setSelectedWeek(weekToSelect);
      }
    }
  };

  const handleWeekChange = (weekKey) => {
    setSelectedWeek(weekKey);
  };

  const handleViewModeChange = () => {
    setViewMode('weekly');
  };

  const resetCalendar = () => {
    setSelectedYear(dayjs().year());
    setSelectedMonth(dayjs().month() + 1);
    setSelectedWeek(null);
    setAvailableWeeks([]);
    setError(null);
  };

  return {
    viewMode,
    selectedYear,
    selectedMonth,
    selectedWeek,
    availableWeeks,
    loading,
    error,
    setViewMode,
    setSelectedYear,
    setSelectedMonth,
    setSelectedWeek,
    setAvailableWeeks,
    setLoading,
    setError,
    handleYearChange,
    handleMonthChange,
    handleWeekChange,
    handleViewModeChange,
    resetCalendar
  };
};

export default useCalendar;


