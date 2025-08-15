import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

// Extend dayjs with week plugin
dayjs.extend(weekOfYear);

export const CalendarHelpers = {
  /**
   * Get week boundaries (Sunday to Saturday) for a given date
   * @param {dayjs.Dayjs|Date|string} date - The date to get week boundaries for
   * @returns {Array} [startDate, endDate] as dayjs objects
   */
  getWeekBoundaries: (date) => {
    const startOfWeek = dayjs(date).startOf('week'); // Sunday
    const endOfWeek = dayjs(date).endOf('week'); // Saturday
    return [startOfWeek, endOfWeek];
  },

  /**
   * Validate if a date range follows Sunday to Saturday week format
   * @param {dayjs.Dayjs|Date|string} startDate - Start date
   * @param {dayjs.Dayjs|Date|string} endDate - End date
   * @returns {Object} { valid: boolean, message?: string }
   */
  validateWeekRange: (startDate, endDate) => {
    if (!startDate || !endDate) {
      return { valid: false, message: 'Both start and end dates are required' };
    }
    
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
  },

  /**
   * Format a date range for display
   * @param {dayjs.Dayjs|Date|string} startDate - Start date
   * @param {dayjs.Dayjs|Date|string} endDate - End date
   * @param {string} format - Date format (default: 'MMM DD')
   * @returns {string} Formatted date range
   */
  formatDateRange: (startDate, endDate, format = 'MMM DD') => {
    return `${dayjs(startDate).format(format)} - ${dayjs(endDate).format(format)}`;
  },

  /**
   * Check if a date range represents the current week
   * @param {dayjs.Dayjs|Date|string} startDate - Start date
   * @param {dayjs.Dayjs|Date|string} endDate - End date
   * @returns {boolean} True if it's the current week
   */
  isCurrentWeek: (startDate, endDate) => {
    const currentDate = dayjs();
    const [currentStart, currentEnd] = CalendarHelpers.getWeekBoundaries(currentDate);
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    return start.isSame(currentStart, 'day') && end.isSame(currentEnd, 'day');
  },

  /**
   * Check if a date range represents the last week
   * @param {dayjs.Dayjs|Date|string} startDate - Start date
   * @param {dayjs.Dayjs|Date|string} endDate - End date
   * @returns {boolean} True if it's the last week
   */
  isLastWeek: (startDate, endDate) => {
    const lastWeek = dayjs().subtract(1, 'week');
    const [lastStart, lastEnd] = CalendarHelpers.getWeekBoundaries(lastWeek);
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    return start.isSame(lastStart, 'day') && end.isSame(lastEnd, 'day');
  },

  /**
   * Check if a date range represents the last month
   * @param {dayjs.Dayjs|Date|string} startDate - Start date
   * @param {dayjs.Dayjs|Date|string} endDate - End date
   * @returns {boolean} True if it's the last month
   */
  isLastMonth: (startDate, endDate) => {
    const lastMonth = dayjs().subtract(1, 'month');
    const lastMonthStart = lastMonth.startOf('month');
    const lastMonthEnd = lastMonth.endOf('month');
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    return start.isSame(lastMonthStart, 'day') && end.isSame(lastMonthEnd, 'day');
  },

  /**
   * Get the week number for a given date
   * @param {dayjs.Dayjs|Date|string} date - The date to get week number for
   * @returns {number} Week number
   */
  getWeekNumber: (date) => {
    return dayjs(date).week();
  },

  /**
   * Get the current week key from a list of weeks
   * @param {Array} weeks - Array of week objects with startDate and endDate
   * @returns {string|null} Current week key or null if not found
   */
  getCurrentWeekKey: (weeks) => {
    const currentDate = dayjs();
    return weeks.find(week => {
      const weekStart = dayjs(week.startDate);
      const weekEnd = dayjs(week.endDate);
      return currentDate.isSame(weekStart, 'day') ||
             currentDate.isSame(weekEnd, 'day') ||
             (currentDate.isAfter(weekStart, 'day') && currentDate.isBefore(weekEnd, 'day'));
    })?.key;
  },

  /**
   * Get week days for a given week data
   * @param {Object} weekData - Week data object
   * @returns {Array} Array of day objects
   */
  getWeekDays: (weekData) => {
    if (!weekData || !weekData.days) return [];
    return weekData.days
      .filter(day => day.belongs_to_year)
      .map(day => ({
        date: dayjs(day.date),
        dayName: day.day_name,
        dayNumber: day.day_number,
        month: day.month,
        isWeekend: day.is_weekend,
        belongsToYear: day.belongs_to_year
      }));
  },

  /**
   * Get preset date ranges
   * @returns {Object} Object with preset date ranges
   */
  getPresetRanges: () => {
    const now = dayjs();
    const [thisWeekStart, thisWeekEnd] = CalendarHelpers.getWeekBoundaries(now);
    const [lastWeekStart, lastWeekEnd] = CalendarHelpers.getWeekBoundaries(now.subtract(1, 'week'));
    const lastMonthStart = now.subtract(1, 'month').startOf('month');
    const lastMonthEnd = now.subtract(1, 'month').endOf('month');

    return {
      thisWeek: [thisWeekStart, thisWeekEnd],
      lastWeek: [lastWeekStart, lastWeekEnd],
      lastMonth: [lastMonthStart, lastMonthEnd]
    };
  },

  /**
   * Format a single date
   * @param {dayjs.Dayjs|Date|string} date - The date to format
   * @param {string} format - Date format (default: 'MMM DD, YYYY')
   * @returns {string} Formatted date
   */
  formatDate: (date, format = 'MMM DD, YYYY') => {
    return dayjs(date).format(format);
  },

  /**
   * Get day name for a date
   * @param {dayjs.Dayjs|Date|string} date - The date to get day name for
   * @returns {string} Day name (e.g., 'Sunday', 'Monday')
   */
  getDayName: (date) => {
    return dayjs(date).format('dddd');
  },

  /**
   * Check if a date is a weekend
   * @param {dayjs.Dayjs|Date|string} date - The date to check
   * @returns {boolean} True if it's a weekend
   */
  isWeekend: (date) => {
    const day = dayjs(date).day();
    return day === 0 || day === 6; // Sunday or Saturday
  },

  /**
   * Get the number of days between two dates
   * @param {dayjs.Dayjs|Date|string} startDate - Start date
   * @param {dayjs.Dayjs|Date|string} endDate - End date
   * @returns {number} Number of days
   */
  getDaysDifference: (startDate, endDate) => {
    return dayjs(endDate).diff(dayjs(startDate), 'day');
  }
};

export default CalendarHelpers;


