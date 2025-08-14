import dayjs from 'dayjs';

export const CalendarHelpers = {
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

  formatDateRange: (startDate, endDate) => {
    return `${dayjs(startDate).format('MMM DD')} - ${dayjs(endDate).format('MMM DD')}`;
  },

  isCurrentWeek: (weekStart, weekEnd) => {
    const currentDate = dayjs();
    const start = dayjs(weekStart);
    const end = dayjs(weekEnd);
    return currentDate.isSame(start, 'day') ||
           currentDate.isSame(end, 'day') ||
           (currentDate.isAfter(start, 'day') && currentDate.isBefore(end, 'day'));
  },

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
  }
};

export default CalendarHelpers;


