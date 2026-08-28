/**
 * Shared helpers for Report Card key findings and per-day close-out completion.
 *
 * A day is complete when that same date has actual Sales + COGS + Labor.
 * restaurant_open === 0/false means the restaurant was shut — not "closed out".
 */

export function isClosedDay(item) {
  if (item == null) return false;
  if (
    item.is_closed === false ||
    item.day_closed === false ||
    item.is_day_closed === false
  ) {
    return false;
  }
  return true;
}

export function getDailyEntries(dashboardData) {
  if (!dashboardData) return [];
  if (Array.isArray(dashboardData.daily_entries)) return dashboardData.daily_entries;
  if (Array.isArray(dashboardData?.data?.daily_entries)) return dashboardData.data.daily_entries;
  return [];
}

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

function isRestaurantOpenOnEntry(entry) {
  const open = entry?.['Sales Performance']?.restaurant_open;
  return open !== 0 && open !== false;
}

function toPositiveNumber(value) {
  const num = parseFloat(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function hasPositiveSales(entry) {
  return toPositiveNumber(entry?.['Sales Performance']?.net_sales_actual) > 0;
}

function hasPositiveCogs(entry) {
  return toPositiveNumber(entry?.['COGS Performance']?.cogs_actual) > 0;
}

function hasPositiveLabor(entry) {
  return (
    toPositiveNumber(entry?.['Labor Performance']?.actual_labor_dollars) > 0 ||
    toPositiveNumber(entry?.['Labor Performance']?.labor_hours_actual) > 0
  );
}

/**
 * Day complete when open and that date has Sales + COGS + Labor actuals.
 * Values must be > 0 so untouched week rows saved as 0 do not count as complete.
 */
export function isDayCompleteFromDashboardEntry(entry) {
  if (!entry || !isRestaurantOpenOnEntry(entry)) return false;
  return hasPositiveSales(entry) && hasPositiveCogs(entry) && hasPositiveLabor(entry);
}

export function isDayCompleteFromCloseOut({
  restaurantOpen,
  actualLaborDollars,
  laborHoursActual,
  netSalesActual,
  cogsActual,
}) {
  if (restaurantOpen === false || restaurantOpen === 0) return false;

  const hasSales = toPositiveNumber(netSalesActual) > 0;
  const hasCogs = toPositiveNumber(cogsActual) > 0;
  const hasLabor =
    toPositiveNumber(actualLaborDollars) > 0 || toPositiveNumber(laborHoursActual) > 0;

  return hasSales && hasCogs && hasLabor;
}

/** Fingerprint of a day's Sales/COGS/Labor actuals — used to detect edits vs already-notified state. */
export function getDayCloseOutFingerprint(entry) {
  if (!entry) return '';
  const sales = toPositiveNumber(entry['Sales Performance']?.net_sales_actual);
  const cogs = toPositiveNumber(entry['COGS Performance']?.cogs_actual);
  const laborDollars = toPositiveNumber(entry['Labor Performance']?.actual_labor_dollars);
  const laborHours = toPositiveNumber(entry['Labor Performance']?.labor_hours_actual);
  const open = isRestaurantOpenOnEntry(entry) ? 1 : 0;
  return `${open}|${sales}|${cogs}|${laborDollars}|${laborHours}`;
}

export function snapshotCloseOutFingerprints(dashboardData) {
  const map = {};
  getDailyEntries(dashboardData).forEach((entry) => {
    const date = normalizeCloseOutDate(entry?.date);
    if (!date) return;
    map[date] = getDayCloseOutFingerprint(entry);
  });
  return map;
}

/**
 * Days that should show Close-out complete:
 * - complete for that date
 * - fingerprint changed in this save (last missing item added, or an edit)
 * - not already acknowledged for this same fingerprint
 */
export function getDaysNeedingCloseOutNotification({
  dashboardData,
  beforeFingerprints = {},
  notifiedByDate = {},
  scopeKey = '',
}) {
  const result = [];

  getDailyEntries(dashboardData).forEach((entry) => {
    if (!isDayCompleteFromDashboardEntry(entry)) return;

    const date = normalizeCloseOutDate(entry.date);
    if (!date) return;

    const fingerprint = getDayCloseOutFingerprint(entry);
    const beforeFp = beforeFingerprints[date];

    // Unchanged in this operation — e.g. Monday already complete while editing Tuesday
    if (beforeFp === fingerprint) return;

    const notifiedKey = `${scopeKey}:${date}`;
    if (notifiedByDate[notifiedKey] === fingerprint) return;

    result.push({ date, fingerprint });
  });

  return result;
}

export function countCompleteDaysFromDashboard(dashboardData) {
  return getDailyEntries(dashboardData).filter(isDayCompleteFromDashboardEntry).length;
}

/** Open restaurant days in the dashboard week (shut days excluded). */
export function getOpenDailyEntries(dashboardData) {
  return getDailyEntries(dashboardData).filter(isRestaurantOpenOnEntry);
}

/**
 * Actual week completion: every open day has Sales + COGS + Labor actuals.
 * Returns false when there are no open days (nothing to close out).
 * Do not use this for previous-week incomplete warnings — those use a
 * looser COGS rule (see shouldWarnAboutPreviousWeek).
 */
export function isWeekCompleteFromDashboard(dashboardData) {
  const openDays = getOpenDailyEntries(dashboardData);
  if (openDays.length === 0) return false;
  return openDays.every(isDayCompleteFromDashboardEntry);
}

/**
 * True when the week has at least one COGS actual > 0 on any day.
 * Used only by previous-week warning eligibility, not actual week completion.
 */
export function weekHasAtLeastOneValidCogsEntry(dashboardData) {
  return getDailyEntries(dashboardData).some(hasPositiveCogs);
}

/**
 * Previous-week warning eligibility (NOT actual week completion):
 * existing Sales criteria + existing Labor criteria + at least one COGS entry
 * anywhere in that week. Closed/shut days are excluded from Sales/Labor checks.
 */
export function shouldWarnAboutPreviousWeek(dashboardData) {
  const openDays = getOpenDailyEntries(dashboardData);
  if (openDays.length === 0) return false;

  const salesComplete = openDays.every(hasPositiveSales);
  const laborComplete = openDays.every(hasPositiveLabor);
  const cogsSatisfiedForWarning = weekHasAtLeastOneValidCogsEntry(dashboardData);

  return !salesComplete || !laborComplete || !cogsSatisfiedForWarning;
}

/** Stable fingerprint of the full week's close-out state (open days only). */
export function getWeekCloseOutFingerprint(dashboardData) {
  return getOpenDailyEntries(dashboardData)
    .map((entry) => {
      const date = normalizeCloseOutDate(entry?.date);
      return `${date}:${getDayCloseOutFingerprint(entry)}`;
    })
    .filter(Boolean)
    .sort()
    .join(';');
}

function mapOpenDaysToIncompleteList(entries) {
  return entries
    .map((entry) => ({
      date: normalizeCloseOutDate(entry.date),
      fingerprint: getDayCloseOutFingerprint(entry),
    }))
    .filter((day) => day.date)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Open days that still need Sales, COGS, or Labor under the strict
 * actual-completion rule (all three required per day). Sorted chronologically.
 */
export function getIncompleteOpenDaysFromDashboard(dashboardData) {
  return mapOpenDaysToIncompleteList(
    getOpenDailyEntries(dashboardData).filter((entry) => !isDayCompleteFromDashboardEntry(entry))
  );
}

/**
 * Incomplete open days for the previous-week warning list.
 *
 * Sales and Labor still use the existing per-day rules.
 * If the week has at least one valid COGS entry, missing COGS on other days
 * does not mark those days incomplete for this warning.
 */
export function getIncompleteOpenDaysForPreviousWeekWarning(dashboardData) {
  const cogsSatisfiedForWarning = weekHasAtLeastOneValidCogsEntry(dashboardData);

  return mapOpenDaysToIncompleteList(
    getOpenDailyEntries(dashboardData).filter((entry) => {
      if (!hasPositiveSales(entry) || !hasPositiveLabor(entry)) return true;
      if (!cogsSatisfiedForWarning && !hasPositiveCogs(entry)) return true;
      return false;
    })
  );
}

/**
 * Whether the week was already complete before this save, based on pre-save fingerprints.
 */
export function wasWeekCompleteBeforeSave(dashboardData, beforeFingerprints = {}) {
  const openDays = getOpenDailyEntries(dashboardData);
  if (openDays.length === 0) return false;

  return openDays.every((entry) => {
    const date = normalizeCloseOutDate(entry.date);
    if (!date) return false;
    const beforeFp = beforeFingerprints[date];
    if (!beforeFp) return false;

    const parts = String(beforeFp).split('|');
    if (parts.length < 5) return false;
    const open = Number(parts[0]);
    const sales = Number(parts[1]);
    const cogs = Number(parts[2]);
    const laborDollars = Number(parts[3]);
    const laborHours = Number(parts[4]);
    if (open !== 1) return false;
    return sales > 0 && cogs > 0 && (laborDollars > 0 || laborHours > 0);
  });
}

/**
 * Whether to show the week close-out congratulations modal.
 *
 * Show once when the week newly becomes complete (last day(s) finished, or all
 * days completed together). Do not re-show for edits to an already-complete week,
 * even if every open day was touched in this session.
 */
export function shouldShowWeekCloseOutNotification({
  dashboardData,
  beforeFingerprints = {},
  notifiedByWeek = {},
  scopeKey = '',
  weekStart = '',
  // Kept for callers; full-week touch no longer bypasses first-time / newly-complete checks
  sessionCoversFullWeek: _sessionCoversFullWeek = false,
} = {}) {
  if (!weekStart || !isWeekCompleteFromDashboard(dashboardData)) {
    return null;
  }

  const fingerprint = getWeekCloseOutFingerprint(dashboardData);
  if (!fingerprint) return null;

  // Already congratulated for this week — once only
  const notifiedKey = `${scopeKey}:${weekStart}`;
  if (notifiedByWeek[notifiedKey]) return null;

  // Week newly became complete in this save/session (was incomplete before)
  if (!wasWeekCompleteBeforeSave(dashboardData, beforeFingerprints)) {
    return { weekStart, fingerprint };
  }

  return null;
}

export function countOverGoalFindings(dailyPerformanceData) {
  if (!Array.isArray(dailyPerformanceData)) return 0;

  let count = 0;
  dailyPerformanceData.filter(isClosedDay).forEach((item) => {
    if (item.cogs_status === 'over_goal' && item.cogs_difference) count += 1;
    if (item.labour_status === 'over_goal' && item.labour_difference) count += 1;
    if (item.expense_status === 'over_goal' && item.expense_difference) count += 1;
    if (item.rent_status === 'over_goal' && item.rent_difference) count += 1;
  });
  return count;
}

export function getFindingsScopeKey(restaurantId, locationId) {
  const rid = restaurantId || (typeof localStorage !== 'undefined' ? localStorage.getItem('restaurant_id') : '') || '';
  const lid = locationId || (typeof localStorage !== 'undefined' ? localStorage.getItem('selected_location_id') : '') || '';
  return `${rid}:${lid}`;
}
