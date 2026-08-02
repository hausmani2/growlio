/**
 * Frontend-only Sales-first gate for Close Out Day.
 * Labor/COGS actuals for a day require Sales to be entered for that same day.
 *
 * Detection (no backend flag):
 * 1. localStorage marks set when Sales are saved for touched / non-zero days
 * 2. Dashboard Sales amounts / tickets > 0 (covers POS sync and prior saves)
 */

export const SALES_FIRST_LABOR_MESSAGE =
  'Please add sales for the day first before adding Labor.';

export const SALES_FIRST_COGS_MESSAGE =
  'Please add sales for the day first before adding COGS.';

export const OPEN_SALES_MODAL_EVENT = 'openSalesModal';

const STORAGE_KEY = 'growlio_sales_entered_days';

export function normalizeCloseOutDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0];
  if (date.format) return date.format('YYYY-MM-DD');
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

export function getCloseOutScopeKey(restaurantId, locationId) {
  const rid = restaurantId ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('restaurant_id') : null);
  const lid =
    locationId ??
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem('selected_location_id') || localStorage.getItem('location_id')
      : null);
  return `${rid || 'unknown'}:${lid || 'default'}`;
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / private mode
  }
}

export function markSalesEnteredDates(dates, restaurantId = null, locationId = null) {
  const scope = getCloseOutScopeKey(restaurantId, locationId);
  const store = readStore();
  const set = new Set(Array.isArray(store[scope]) ? store[scope] : []);
  (dates || []).forEach((d) => {
    const key = normalizeCloseOutDate(d);
    if (key) set.add(key);
  });
  store[scope] = Array.from(set);
  writeStore(store);
}

export function isSalesEnteredInStorage(date, restaurantId = null, locationId = null) {
  const scope = getCloseOutScopeKey(restaurantId, locationId);
  const store = readStore();
  const list = Array.isArray(store[scope]) ? store[scope] : [];
  return list.includes(normalizeCloseOutDate(date));
}

function toNumber(value) {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[$,%\s,]/g, '')) : parseFloat(value);
  return Number.isFinite(num) ? num : 0;
}

/** True when Sales Performance shows real entered/synced amounts (including tickets). */
export function hasSalesAmountEvidence(salesPerformance) {
  if (!salesPerformance || typeof salesPerformance !== 'object') return false;
  if (salesPerformance.sales_entered === true) return true;

  const net =
    toNumber(salesPerformance.net_sales_actual) ||
    toNumber(salesPerformance.daily_net_sales);
  if (net > 0) return true;

  const channels =
    toNumber(salesPerformance.actual_sales_in_store) +
    toNumber(salesPerformance.actual_sales_app_online) +
    toNumber(salesPerformance.actual_sales_online);
  if (channels > 0) return true;

  if (toNumber(salesPerformance.daily_tickets) > 0) return true;

  // Dynamic provider keys: actual_sales_*
  for (const [key, value] of Object.entries(salesPerformance)) {
    if (key.startsWith('actual_sales_') && toNumber(value) > 0) return true;
  }

  return false;
}

export function getDailyEntryForDate(dashboardData, date) {
  const dateKey = normalizeCloseOutDate(date);
  if (!dashboardData || !dateKey) return null;
  const entries = dashboardData.daily_entries || dashboardData?.data?.daily_entries || [];
  return (
    entries.find((entry) => normalizeCloseOutDate(entry?.date) === dateKey) || null
  );
}

export function isSalesEnteredForDay(dashboardData, date, restaurantId = null, locationId = null) {
  const dateKey = normalizeCloseOutDate(date);
  if (!dateKey) return false;

  if (isSalesEnteredInStorage(dateKey, restaurantId, locationId)) return true;

  const entry = getDailyEntryForDate(dashboardData, dateKey);
  const sales = entry?.['Sales Performance'];
  return hasSalesAmountEvidence(sales);
}

/**
 * Sales day form row → whether this day should be marked entered after save.
 * Includes intentional $0 via touchedDates.
 */
export function collectSalesEnteredDatesFromFormDays(dailyData, touchedDates = []) {
  const touched = new Set(
    (touchedDates || []).map(normalizeCloseOutDate).filter(Boolean)
  );
  const result = [];

  (dailyData || []).forEach((day) => {
    const dateKey = normalizeCloseOutDate(day?.date);
    if (!dateKey) return;

    const open =
      day.restaurant_open !== 0 &&
      day.restaurant_open !== false &&
      day.restaurantOpen !== false;

    if (!open) return;

    const net =
      toNumber(day.net_sales_actual) ||
      toNumber(day.netSalesActual) ||
      toNumber(day.actualSalesInStore) +
        toNumber(day.actualSalesAppOnline) +
        toNumber(day.actualSalesOnline) +
        Object.keys(day || {})
          .filter((k) => k.startsWith('actualSales') && k !== 'actualSalesInStore' && k !== 'actualSalesAppOnline' && k !== 'actualSalesOnline')
          .reduce((sum, k) => sum + toNumber(day[k]), 0);

    const tickets = toNumber(day.dailyTickets) || toNumber(day.daily_tickets);
    const hasAmount = net > 0 || tickets > 0;

    if (hasAmount || touched.has(dateKey)) {
      result.push(dateKey);
    }
  });

  return result;
}

export function getDatesMissingSalesForActuals(dailyRows, dashboardData, options = {}) {
  const {
    restaurantId = null,
    locationId = null,
    getDate = (row) => row?.date,
    hasActual = (row) => false,
  } = options;

  const blocked = [];
  (dailyRows || []).forEach((row) => {
    if (!hasActual(row)) return;
    const dateKey = normalizeCloseOutDate(getDate(row));
    if (!dateKey) return;
    if (!isSalesEnteredForDay(dashboardData, dateKey, restaurantId, locationId)) {
      blocked.push(dateKey);
    }
  });
  return blocked;
}

/**
 * True when any open, non-future day in the week is missing sales.
 * Used to show/hide the Labor/COGS sales-first banner.
 */
export function hasOpenDaysMissingSales(dailyRows, dashboardData, options = {}) {
  const {
    restaurantId = null,
    locationId = null,
    getDate = (row) => row?.date,
    isFuture = (date) => {
      if (!date) return false;
      try {
        const dateKey = normalizeCloseOutDate(date);
        if (!dateKey) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const record = new Date(`${dateKey}T00:00:00`);
        return record.getTime() > today.getTime();
      } catch {
        return false;
      }
    },
  } = options;

  return (dailyRows || []).some((row) => {
    if (row?.restaurantOpen === false) return false;
    const date = getDate(row);
    if (isFuture(date)) return false;
    return !isSalesEnteredForDay(dashboardData, date, restaurantId, locationId);
  });
}

export function assertLaborOrCogsAllowedBySales(payload, dashboardData, restaurantId, locationId) {
  const section = payload?.section;
  if (section !== 'COGS Performance' && section !== 'Labor Performance') {
    return { ok: true };
  }

  const daily = payload?.section_data?.daily || [];
  const blocked = [];

  daily.forEach((day) => {
    const dateKey = normalizeCloseOutDate(day?.date);
    if (!dateKey) return;

    let hasActual = false;
    if (section === 'COGS Performance') {
      hasActual = toNumber(day.cogs_actual) > 0;
    } else {
      hasActual =
        toNumber(day.actual_labor_dollars) > 0 || toNumber(day.labor_hours_actual) > 0;
    }

    if (!hasActual) return;

    if (!isSalesEnteredForDay(dashboardData, dateKey, restaurantId, locationId)) {
      blocked.push(dateKey);
    }
  });

  if (blocked.length === 0) return { ok: true };
  return {
    ok: false,
    message:
      section === 'COGS Performance'
        ? SALES_FIRST_COGS_MESSAGE
        : SALES_FIRST_LABOR_MESSAGE,
    dates: blocked,
  };
}

export function dispatchOpenSalesModal(weekStartDate) {
  window.dispatchEvent(
    new CustomEvent(OPEN_SALES_MODAL_EVENT, {
      detail: { weekStartDate },
    })
  );
}
