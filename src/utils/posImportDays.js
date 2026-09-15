import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { isDayCurrentlyOpen } from './dayCloseGuard';
import { getDailyEntryForDate } from './salesEnteredGate';
import { POS_IMPORT_MAX_DAYS } from '../services/posApi';

dayjs.extend(weekOfYear);

const toAmount = (value) => {
  if (value === null || value === undefined || value === '' || value === '-') return 0;
  const num =
    typeof value === 'string' ? parseFloat(value.replace(/[$,%\s,]/g, '')) : Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const getWeekStart = (value = dayjs()) => dayjs(value).startOf('week');

export const formatWeekLabel = (weekStart) => {
  const start = getWeekStart(weekStart);
  const end = start.add(6, 'day');
  return `Week ${start.week()} (${start.format('MMM DD')} - ${end.format('MMM DD, YYYY')})`;
};

export const buildWeekDays = (weekStart) => {
  const start = getWeekStart(weekStart);
  const today = dayjs().startOf('day');
  return Array.from({ length: 7 }, (_, index) => {
    const date = start.add(index, 'day');
    return {
      date: date.format('YYYY-MM-DD'),
      dayName: date.format('dddd'),
      displayDate: date.format('MMM DD, YYYY'),
      isFuture: date.isAfter(today, 'day'),
    };
  });
};

export const listImportWeeks = ({ includeCurrent = true, maxDays = POS_IMPORT_MAX_DAYS } = {}) => {
  const current = getWeekStart();
  const oldest = current.subtract(Math.max(maxDays - 1, 0), 'day').startOf('week');
  const weeks = [];
  let cursor = current;
  if (!includeCurrent) cursor = current.subtract(1, 'week');
  while (cursor.isSame(oldest, 'day') || cursor.isAfter(oldest, 'day')) {
    weeks.push({
      value: cursor.format('YYYY-MM-DD'),
      label: formatWeekLabel(cursor),
    });
    cursor = cursor.subtract(1, 'week');
  }
  return weeks;
};

export const normalizeWeeklyDashboardPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return null;
  const message = String(payload.message || '').toLowerCase();
  if (
    payload.data === null &&
    (payload.status === 'success' || message.includes('no weekly'))
  ) {
    return null;
  }
  if (Array.isArray(payload.daily_entries)) return payload;
  if (Array.isArray(payload.data?.daily_entries)) return payload.data;
  if (Array.isArray(payload.data?.data?.daily_entries)) return payload.data.data;
  return null;
};

export const dailyEntryHasOperatingActuals = (entry) => {
  if (!entry || typeof entry !== 'object') return false;
  const sales = entry['Sales Performance'] || entry;
  const labor = entry['Labor Performance'] || {};
  const cogs = entry['COGS Performance'] || {};
  if (
    toAmount(sales.net_sales_actual) > 0 ||
    toAmount(sales.actual_sales_in_store) > 0 ||
    toAmount(sales.actual_sales_app_online) > 0 ||
    toAmount(sales.actual_sales_online) > 0 ||
    toAmount(sales.daily_tickets) > 0 ||
    toAmount(labor.labor_hours_actual) > 0 ||
    toAmount(labor.actual_labor_dollars) > 0 ||
    toAmount(cogs.cogs_actual) > 0
  ) {
    return true;
  }
  const thirdParty = sales.third_party_sales;
  if (thirdParty && typeof thirdParty === 'object') {
    if (Object.values(thirdParty).some((value) => toAmount(value) > 0)) return true;
  }
  return Object.entries(sales).some(
    ([key, value]) => key.startsWith('actual_sales_') && toAmount(value) > 0
  );
};

export const annotateWeekDays = (days, dashboardData) => {
  const weekData = normalizeWeeklyDashboardPayload(dashboardData);
  return days.map((day) => {
    const entry = getDailyEntryForDate(weekData, day.date);
    const hasExisting = dailyEntryHasOperatingActuals(entry);
    const isOpen = isDayCurrentlyOpen({
      restaurant_open: entry?.['Sales Performance']?.restaurant_open ?? entry?.restaurant_open,
    });
    return {
      ...day,
      hasExisting,
      isOpen,
      canImport: !day.isFuture,
    };
  });
};
