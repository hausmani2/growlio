import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import updateLocale from 'dayjs/plugin/updateLocale';

// Extend dayjs with plugins
dayjs.extend(weekOfYear);
dayjs.extend(updateLocale);

// Configure dayjs to use Sunday as the start of the week
dayjs.updateLocale('en', {
  weekStart: 0 // 0 = Sunday, 1 = Monday
});

/**
 * Custom hook for managing calendar state with Ant Design DatePicker
 * 
 * Features:
 * - Manages date range state
 * - Provides preset handlers for common date ranges
 * - Handles validation for Sunday-Saturday week ranges
 * - Provides loading and error states
 * 
 * @param {Object} options - Hook options
 * @param {Array} options.initialDates - Initial date range [startDate, endDate]
 * @param {boolean} options.autoSelectCurrentWeek - Whether to auto-select current week on mount
 * @returns {Object} Calendar state and handlers
 */
const useCalendar = ({
  initialDates = [],
  autoSelectCurrentWeek = true
} = {}) => {
  const [dateRange, setDateRange] = useState(initialDates);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to get week boundaries (Sunday to Saturday)
  const getWeekBoundaries = (date) => {
    const startOfWeek = dayjs(date).startOf('week'); // Sunday
    const endOfWeek = dayjs(date).endOf('week'); // Saturday
    return [startOfWeek, endOfWeek];
  };

  // Helper function to validate Sunday to Saturday range
  const validateWeekRange = (startDate, endDate) => {
    if (!startDate || !endDate) return false;
    
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    // Check if start date is Sunday
    if (start.day() !== 0) {
      return { valid: false, message: 'Start date must be Sunday' };
    }
    
    // Check if end date is Saturday
    if (end.day() !== 6) {
      return { valid: false, message: 'End date must be Saturday' };
    }
    
    // Check if it's a valid week range (7 days)
    const daysDiff = end.diff(start, 'day');
    if (daysDiff !== 6) {
      return { valid: false, message: 'Date range must be exactly 7 days (Sunday to Saturday)' };
    }
    
    return { valid: true };
  };

  // Auto-select current week on mount if enabled and no dates are provided
  useEffect(() => {
    if (autoSelectCurrentWeek && (!initialDates || initialDates.length === 0) && (!dateRange || dateRange.length === 0)) {
      const [start, end] = getWeekBoundaries(dayjs());
      setDateRange([start, end]);
    } else if (initialDates && initialDates.length === 2) {
      setDateRange(initialDates);
    }
  }, [autoSelectCurrentWeek, initialDates]); // Run only once on mount

  // Handle date range change
  const handleDateChange = (dates) => {
    setDateRange(dates);
    setError(null);
    
    // Allow any date range - no validation restrictions
    if (dates && dates.length === 2) {
      const daysDiff = dates[1].diff(dates[0], 'day');
      
      // Optional: Log if it's a week range for debugging
      if (daysDiff === 6 && dates[0].day() === 0 && dates[1].day() === 6) {
        
      }
    }
  };

  // Preset handlers
  const selectThisWeek = () => {
    const [start, end] = getWeekBoundaries(dayjs());
    const newRange = [start, end];
    setDateRange(newRange);
    setError(null);
    return newRange;
  };

  const selectLastWeek = () => {
    const lastWeek = dayjs().subtract(1, 'week');
    const [start, end] = getWeekBoundaries(lastWeek);
    const newRange = [start, end];
    setDateRange(newRange);
    setError(null);
    return newRange;
  };

  const selectLastMonth = () => {
    const lastMonth = dayjs().subtract(1, 'month');
    const start = lastMonth.startOf('month');
    const end = lastMonth.endOf('month');
    const newRange = [start, end];
    setDateRange(newRange);
    setError(null);
    return newRange;
  };

  const selectCustomRange = (startDate, endDate) => {
    const validation = validateWeekRange(startDate, endDate);
    if (!validation.valid) {
      setError(validation.message);
      return null;
    }
    
    const newRange = [dayjs(startDate), dayjs(endDate)];
    setDateRange(newRange);
    setError(null);
    return newRange;
  };

  // Utility functions
  const formatDate = (date) => {
    return dayjs(date).format('MMM DD, YYYY');
  };

  const formatDateRange = () => {
    if (!dateRange || dateRange.length !== 2) return '';
    return `${formatDate(dateRange[0])} - ${formatDate(dateRange[1])}`;
  };

  const getWeekNumber = () => {
    if (!dateRange || dateRange.length !== 2) return null;
    return dayjs(dateRange[0]).week();
  };

  const isCurrentWeek = () => {
    if (!dateRange || dateRange.length !== 2) return false;
    const [currentStart, currentEnd] = getWeekBoundaries(dayjs());
    return dayjs(dateRange[0]).isSame(currentStart, 'day') && 
           dayjs(dateRange[1]).isSame(currentEnd, 'day');
  };

  const isLastWeek = () => {
    if (!dateRange || dateRange.length !== 2) return false;
    const lastWeek = dayjs().subtract(1, 'week');
    const [lastStart, lastEnd] = getWeekBoundaries(lastWeek);
    return dayjs(dateRange[0]).isSame(lastStart, 'day') && 
           dayjs(dateRange[1]).isSame(lastEnd, 'day');
  };

  const isLastMonth = () => {
    if (!dateRange || dateRange.length !== 2) return false;
    const lastMonth = dayjs().subtract(1, 'month');
    const start = lastMonth.startOf('month');
    const end = lastMonth.endOf('month');
    return dayjs(dateRange[0]).isSame(start, 'day') && 
           dayjs(dateRange[1]).isSame(end, 'day');
  };

  const isCustomRange = () => {
    return dateRange && dateRange.length === 2 && 
           !isCurrentWeek() && 
           !isLastWeek() && 
           !isLastMonth();
  };

  // Reset calendar
  const resetCalendar = () => {
    setDateRange([]);
    setError(null);
    setLoading(false);
  };

  // Set loading state
  const setLoadingState = (isLoading) => {
    setLoading(isLoading);
  };

  // Set error state
  const setErrorState = (errorMessage) => {
    setError(errorMessage);
  };

  return {
    // State
    dateRange,
    loading,
    error,
    
    // Handlers
    handleDateChange,
    selectThisWeek,
    selectLastWeek,
    selectLastMonth,
    selectCustomRange,
    resetCalendar,
    setLoadingState,
    setErrorState,
    
    // Utility functions
    formatDate,
    formatDateRange,
    getWeekNumber,
    isCurrentWeek,
    isLastWeek,
    isLastMonth,
    isCustomRange,
    validateWeekRange,
    getWeekBoundaries
  };
};

export default useCalendar;


