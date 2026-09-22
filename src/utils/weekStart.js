import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';

dayjs.extend(updateLocale);

export const WEEK_START_DAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const DEFAULT_WEEK_START_DAY = 0;

let currentWeekStartDay = DEFAULT_WEEK_START_DAY;

export const normalizeWeekStartDay = (value) => {
  if (value === null || value === undefined || value === '') {
    return DEFAULT_WEEK_START_DAY;
  }
  if (typeof value === 'string') {
    const key = value.trim().toLowerCase();
    const byLabel = WEEK_START_DAY_OPTIONS.find(
      (opt) => opt.label.toLowerCase() === key || opt.label.slice(0, 3).toLowerCase() === key
    );
    if (byLabel) return byLabel.value;
    const parsed = parseInt(key, 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 6) return parsed;
    return DEFAULT_WEEK_START_DAY;
  }
  const day = Number(value);
  if (Number.isInteger(day) && day >= 0 && day <= 6) return day;
  return DEFAULT_WEEK_START_DAY;
};

/**
 * Apply restaurant/location week_start_day to dayjs so startOf('week') matches Close Out.
 */
export const setDayjsWeekStart = (weekStartDay) => {
  const day = normalizeWeekStartDay(weekStartDay);
  if (day === currentWeekStartDay) return day;
  currentWeekStartDay = day;
  dayjs.updateLocale('en', { weekStart: day });
  return day;
};

export const getDayjsWeekStart = () => currentWeekStartDay;

// Default Sunday to match historical Growlio behavior
setDayjsWeekStart(DEFAULT_WEEK_START_DAY);
