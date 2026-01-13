// Calendar utilities exports
export { default as CalendarUtils } from './CalendarUtils';
export { default as useCalendar } from './useCalendar';
export { default as CalendarHelpers } from './CalendarHelpers';

// Tooltip helpers
export const fetchTooltips = async (page, apiGetFn) => {
  if (!page) return {};
  try {
    const res = await apiGetFn(`/restaurant/tooltips/lookup/?page=${encodeURIComponent(page)}`);
    return res.data || {};
  } catch (e) {
    return {};
  }
};
