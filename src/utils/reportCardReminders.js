import { Modal } from 'antd';
import { createElement } from 'react';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import updateLocale from 'dayjs/plugin/updateLocale';
import useStore from '../store/store';
import { CalendarHelpers } from './CalendarHelpers';
import { apiGet } from './axiosInterceptors';
import {
  getDailyEntries,
  getFindingsScopeKey,
  getIncompleteOpenDaysForPreviousWeekWarning,
  getOpenDailyEntries,
  isDayCompleteFromDashboardEntry,
  normalizeCloseOutDate,
  shouldShowWeekCloseOutNotification,
  shouldWarnAboutPreviousWeek,
  snapshotCloseOutFingerprints,
} from './reportCardFindings';

dayjs.extend(weekOfYear);
dayjs.extend(updateLocale);
dayjs.updateLocale('en', { weekStart: 0 });

let closeOutModalOpen = false;
/** Prevents stacked "Previous week incomplete" modals while the async check is in flight */
let previousWeekWarningInFlight = false;
/** Session-only: `${scopeKey}:${selectedWeekStart}` after user chooses Proceed Anyway */
const previousWeekWarningDismissed = new Set();

/**
 * In-memory close-out flow session: accumulates dates updated across Sales → COGS → Labor
 * until the flow ends (save chain dismiss / labor save / modal cancel).
 * Not persisted — survives section navigation within the same page session only.
 *
 * baselineFingerprints = snapshot from the first save in this flow (the "before photo").
 * Kept so cancel/dismiss flushes can still detect a newly completed week.
 */
let closeOutFlowSession = {
  scopeKey: '',
  /** @type {Map<string, { sections: Set<string>, fingerprint: string }>} */
  dates: new Map(),
  /** @type {Record<string, string>|null} */
  baselineFingerprints: null,
};

export const NAVIGATE_TO_CLOSE_OUT_WEEK_EVENT = 'navigateToCloseOutWeek';

function createEmptyCloseOutFlowSession(scopeKey = '') {
  return {
    scopeKey,
    dates: new Map(),
    baselineFingerprints: null,
  };
}

function parseCloseOutFingerprint(fp = '') {
  const parts = String(fp || '').split('|');
  return {
    open: Number(parts[0]) || 0,
    sales: Number(parts[1]) || 0,
    cogs: Number(parts[2]) || 0,
    laborDollars: Number(parts[3]) || 0,
    laborHours: Number(parts[4]) || 0,
  };
}

function didSectionChange(beforeFp, afterFp, section) {
  const before = parseCloseOutFingerprint(beforeFp);
  const after = parseCloseOutFingerprint(afterFp);
  if (section === 'sales') return before.sales !== after.sales;
  if (section === 'cogs') return before.cogs !== after.cogs;
  if (section === 'labor') {
    return before.laborDollars !== after.laborDollars || before.laborHours !== after.laborHours;
  }
  return beforeFp !== afterFp;
}

function ensureCloseOutFlowSession(scopeKey) {
  if (closeOutFlowSession.scopeKey !== scopeKey) {
    closeOutFlowSession = createEmptyCloseOutFlowSession(scopeKey);
  }
}

export function clearCloseOutFlowSession() {
  closeOutFlowSession = createEmptyCloseOutFlowSession('');
}

function hasFingerprintSnapshot(fingerprints) {
  return (
    fingerprints &&
    typeof fingerprints === 'object' &&
    Object.keys(fingerprints).length > 0
  );
}

/**
 * Prefer the caller's before-save snapshot; fall back to the session baseline
 * so Labor/COGS cancel after a prior save still evaluates week completion.
 */
function resolveBeforeFingerprints(beforeFingerprints = {}) {
  if (hasFingerprintSnapshot(beforeFingerprints)) {
    return beforeFingerprints;
  }
  if (hasFingerprintSnapshot(closeOutFlowSession.baselineFingerprints)) {
    return closeOutFlowSession.baselineFingerprints;
  }
  return {};
}

/**
 * After a successful Sales/COGS/Labor save + refresh, record dates that section changed.
 * Does not show a modal — call flushCloseOutSessionNotification when the flow ends.
 */
export function recordCloseOutSessionChanges(beforeFingerprints = {}, section) {
  if (!section) return [];

  const state = useStore.getState();
  const scopeKey = getFindingsScopeKey(state.restaurantId, state.selectedLocationId);
  ensureCloseOutFlowSession(scopeKey);

  // Keep the first save's "before photo" for the whole Sales → COGS → Labor flow
  if (
    hasFingerprintSnapshot(beforeFingerprints) &&
    !hasFingerprintSnapshot(closeOutFlowSession.baselineFingerprints)
  ) {
    closeOutFlowSession.baselineFingerprints = { ...beforeFingerprints };
  }

  const afterFingerprints = snapshotCloseOutFingerprints(state.dashboardData);
  const allDates = new Set([
    ...Object.keys(beforeFingerprints || {}),
    ...Object.keys(afterFingerprints || {}),
  ]);

  const recorded = [];
  allDates.forEach((date) => {
    const beforeFp = beforeFingerprints?.[date] || '';
    const afterFp = afterFingerprints?.[date] || '';
    if (!didSectionChange(beforeFp, afterFp, section)) return;

    const existing = closeOutFlowSession.dates.get(date) || {
      sections: new Set(),
      fingerprint: afterFp,
    };
    existing.sections.add(section);
    existing.fingerprint = afterFp;
    closeOutFlowSession.dates.set(date, existing);
    recorded.push(date);
  });

  return recorded;
}

function getSessionCloseOutDays() {
  return [...closeOutFlowSession.dates.entries()]
    .map(([date, meta]) => ({
      date,
      fingerprint: meta.fingerprint || '',
      sections: [...(meta.sections || [])],
    }))
    .filter((day) => day.date)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function formatCloseOutDayLabel(dateStr) {
  const date = dayjs(dateStr);
  if (!date.isValid()) return dateStr;
  return `${date.format('dddd')} (${date.format('MM/DD')})`;
}

function formatCloseOutDaysPhrase(days = []) {
  const labels = [...days]
    .map((day) => day.date)
    .filter(Boolean)
    .sort()
    .map(formatCloseOutDayLabel);

  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

function formatDayNamesPhrase(dates = []) {
  const labels = [...dates]
    .filter(Boolean)
    .sort()
    .map((dateStr) => {
      const date = dayjs(dateStr);
      return date.isValid() ? date.format('dddd') : dateStr;
    });

  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

function getSelectedWeekStart(dashboardData, fallbackDate) {
  const raw =
    dashboardData?.week_start ||
    dashboardData?.data?.week_start ||
    dashboardData?.month ||
    fallbackDate;
  if (!raw) return '';
  const parsed = dayjs(raw);
  if (!parsed.isValid()) return '';
  return parsed.startOf('week').format('YYYY-MM-DD');
}

/**
 * Snapshot fingerprints before a Sales/COGS/Labor save.
 */
export function captureCloseOutFingerprintsBeforeSave() {
  return snapshotCloseOutFingerprints(useStore.getState().dashboardData);
}

/**
 * Fetch a week's dashboard payload without writing into the global store
 * (avoids clobbering the week the user is currently closing out).
 */
async function fetchDashboardDataForWeek(weekStart) {
  const state = useStore.getState();
  const restaurantId =
    state.restaurantId ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('restaurant_id') : null);
  if (!restaurantId || !weekStart) return null;

  const locationId =
    typeof state.getSelectedLocationId === 'function'
      ? await state.getSelectedLocationId()
      : state.selectedLocationId;

  const params = new URLSearchParams({
    restaurant_id: restaurantId,
    week_start: weekStart,
  });
  if (locationId) params.set('location_id', locationId);

  const response = await apiGet(`/restaurant/dashboard/?${params.toString()}`);
  return response?.data ?? null;
}

function isNoWeeklyDashboardResponse(data) {
  return (
    data &&
    data.status === 'success' &&
    (data.message === 'No weekly dashboard found' ||
      data.message === 'No weekly dashboard found for the given criteria.') &&
    data.data === null
  );
}

/**
 * Show week close-out congratulations when all open days have Sales + COGS + Labor.
 * Owners get a Report Card CTA; managers (no report-card access) get dismiss-only.
 */
export async function maybeShowWeekCloseoutComplete({
  navigate,
  beforeFingerprints = {},
  canAccessReportCard = false,
  sessionCoversFullWeek = false,
  weekStart: weekStartOverride = '',
} = {}) {
  if (closeOutModalOpen) {
    return { shown: false };
  }

  const state = useStore.getState();
  const scopeKey = getFindingsScopeKey(state.restaurantId, state.selectedLocationId);
  const weekStart =
    weekStartOverride ||
    getSelectedWeekStart(state.dashboardData, state.selectedDate);
  const eligible = shouldShowWeekCloseOutNotification({
    dashboardData: state.dashboardData,
    beforeFingerprints,
    notifiedByWeek: state.weekCloseOutNotifiedByWeek || {},
    scopeKey,
    weekStart,
    sessionCoversFullWeek,
  });

  if (!eligible) {
    return { shown: false };
  }

  closeOutModalOpen = true;
  if (typeof state.markWeekCloseOutNotified === 'function') {
    state.markWeekCloseOutNotified(eligible);
  }

  const weekContent =
    'Congratulations! You have successfully closed out the entire week.';

  if (canAccessReportCard) {
    Modal.confirm({
      title: 'Week close-out complete',
      content: weekContent,
      okText: 'View Report Card',
      cancelText: 'Dismiss',
      centered: true,
      onOk: () => {
        closeOutModalOpen = false;
        if (navigate) navigate('/dashboard/report-card');
      },
      onCancel: () => {
        closeOutModalOpen = false;
      },
      afterClose: () => {
        closeOutModalOpen = false;
      },
    });
  } else {
    // Same Modal.confirm style as owner (warning icon), without Report Card CTA
    Modal.confirm({
      title: 'Week close-out complete',
      content: weekContent,
      okText: 'Dismiss',
      okCancel: false,
      centered: true,
      onOk: () => {
        closeOutModalOpen = false;
      },
      afterClose: () => {
        closeOutModalOpen = false;
      },
    });
  }

  return { shown: true, weekStart: eligible.weekStart };
}

/**
 * Show Close-out complete only for dates that are fully closed out in this session
 * (Sales + COGS + Labor actuals > 0). Partial saves (e.g. sales only) do not notify.
 * When the whole week just became complete, show the week congratulations instead.
 */
export async function maybeShowDayCloseoutComplete({
  navigate,
  beforeFingerprints = {},
  canAccessReportCard = false,
  /** @type {'sales'|'cogs'|'labor'|null} */
  section = null,
} = {}) {
  if (closeOutModalOpen) {
    return { shown: false, days: [] };
  }

  // Accumulate this save's changed dates into the session (safe if already recorded)
  if (section) {
    recordCloseOutSessionChanges(beforeFingerprints, section);
  }

  return flushCloseOutSessionNotification({
    navigate,
    beforeFingerprints,
    canAccessReportCard,
  });
}

/**
 * Session days that are actually closed out (Sales + COGS + Labor) and not yet
 * acknowledged for the current fingerprint. Sales-only / partial saves stay silent.
 */
function getCompleteSessionCloseOutDays(sessionDays, dashboardData, scopeKey, notifiedByDate = {}) {
  const entriesByDate = new Map();
  getDailyEntries(dashboardData).forEach((entry) => {
    const date = normalizeCloseOutDate(entry?.date);
    if (date) entriesByDate.set(date, entry);
  });

  return (sessionDays || []).filter((day) => {
    if (!day?.date) return false;
    const entry = entriesByDate.get(day.date);
    if (!isDayCompleteFromDashboardEntry(entry)) return false;

    const fingerprint = day.fingerprint || '';
    const notifiedKey = `${scopeKey}:${day.date}`;
    if (notifiedByDate[notifiedKey] === fingerprint) return false;
    return true;
  });
}

/**
 * End of close-out flow: show one notification only for dates that are fully
 * closed out in this session (Sales + COGS + Labor), not sales-only saves.
 * Report Card CTA / findings only when the user can access Report Card.
 */
export async function flushCloseOutSessionNotification({
  navigate,
  beforeFingerprints = {},
  canAccessReportCard = false,
} = {}) {
  if (closeOutModalOpen) {
    return { shown: false, days: [] };
  }

  const state = useStore.getState();
  const scopeKey = getFindingsScopeKey(state.restaurantId, state.selectedLocationId);
  ensureCloseOutFlowSession(scopeKey);

  const sessionDays = getSessionCloseOutDays();
  const completeSessionDays = getCompleteSessionCloseOutDays(
    sessionDays,
    state.dashboardData,
    scopeKey,
    state.closeOutNotifiedByDate || {}
  );
  let weekStart = getSelectedWeekStart(state.dashboardData, state.selectedDate);
  if (!weekStart && sessionDays.length > 0) {
    weekStart = dayjs(sessionDays[0].date).startOf('week').format('YYYY-MM-DD');
  }

  const openDays = getOpenDailyEntries(state.dashboardData);
  // Any section change (sales/cogs/labor) on every open day in this flow = full-week update
  const sessionTouchedDates = new Set(sessionDays.map((day) => day.date));
  const sessionCoversFullWeek =
    openDays.length > 0 &&
    openDays.every((entry) => sessionTouchedDates.has(normalizeCloseOutDate(entry.date)));

  // Use caller's snapshot, or the session baseline from the first save in this flow.
  // Cancel/dismiss after COGS (without fingerprints) can still detect a newly completed week.
  const effectiveBeforeFingerprints = resolveBeforeFingerprints(beforeFingerprints);
  const weekEligible = hasFingerprintSnapshot(effectiveBeforeFingerprints)
    ? shouldShowWeekCloseOutNotification({
        dashboardData: state.dashboardData,
        beforeFingerprints: effectiveBeforeFingerprints,
        notifiedByWeek: state.weekCloseOutNotifiedByWeek || {},
        scopeKey,
        weekStart,
        sessionCoversFullWeek,
      })
    : null;

  // Prefer week congratulations when this flow finished the entire week
  if (weekEligible) {
    if (completeSessionDays.length > 0) {
      const dates = completeSessionDays.map((day) => day.date).sort();
      if (canAccessReportCard) {
        try {
          if (typeof state.refreshFindingsAfterCloseOut === 'function') {
            await state.refreshFindingsAfterCloseOut(dates[0], dates[dates.length - 1], {
              requireCompleteDays: true,
              hasCompleteDays: true,
            });
          }
        } catch (error) {
          console.warn('Failed to refresh report card findings after close-out:', error);
        }
      }
      if (typeof state.markCloseOutDaysNotified === 'function') {
        state.markCloseOutDaysNotified(completeSessionDays);
      }
    }
    clearCloseOutFlowSession();
    return maybeShowWeekCloseoutComplete({
      navigate,
      beforeFingerprints: effectiveBeforeFingerprints,
      canAccessReportCard,
      sessionCoversFullWeek,
      weekStart: weekEligible.weekStart || weekStart,
    });
  }

  // Partial close-out (e.g. sales only) — clear session, do not claim complete
  if (completeSessionDays.length === 0) {
    clearCloseOutFlowSession();
    return { shown: false, days: [] };
  }

  const dates = completeSessionDays.map((day) => day.date).sort();
  const rangeStart = dates[0];
  const rangeEnd = dates[dates.length - 1];

  let findingsCount = 0;
  if (canAccessReportCard) {
    try {
      if (typeof state.refreshFindingsAfterCloseOut === 'function') {
        const result = await state.refreshFindingsAfterCloseOut(rangeStart, rangeEnd, {
          requireCompleteDays: true,
          hasCompleteDays: true,
        });
        findingsCount = result?.count || 0;
      }
    } catch (error) {
      console.warn('Failed to refresh report card findings after close-out:', error);
    }
  }

  closeOutModalOpen = true;
  if (typeof state.markCloseOutDaysNotified === 'function') {
    state.markCloseOutDaysNotified(completeSessionDays);
  }
  clearCloseOutFlowSession();

  const daysPhrase = formatCloseOutDaysPhrase(completeSessionDays);
  const dayLabel = completeSessionDays.length === 1 ? 'day' : 'days';
  const bodyText = canAccessReportCard
    ? `You've successfully closed out the ${dayLabel} ${daysPhrase}. Check your Report Card for the latest Profitability Score and key findings.`
    : `You've successfully closed out the ${dayLabel} ${daysPhrase}.`;

  const attentionHint =
    canAccessReportCard && findingsCount === 1
      ? '1 finding needs your attention.'
      : canAccessReportCard && findingsCount > 1
        ? `${findingsCount} findings need your attention.`
        : null;

  const content = createElement(
    'div',
    null,
    createElement('p', null, bodyText),
    attentionHint
      ? createElement('p', { style: { marginTop: 8, fontWeight: 600 } }, attentionHint)
      : null
  );

  if (canAccessReportCard) {
    Modal.confirm({
      title: 'Close-out complete',
      content,
      okText: 'View Report Card',
      cancelText: 'Dismiss',
      centered: true,
      onOk: () => {
        closeOutModalOpen = false;
        if (navigate) navigate('/dashboard/report-card');
      },
      onCancel: () => {
        closeOutModalOpen = false;
      },
      afterClose: () => {
        closeOutModalOpen = false;
      },
    });
  } else {
    // Same Modal.confirm style as owner (warning icon), without Report Card CTA
    Modal.confirm({
      title: 'Close-out complete',
      content,
      okText: 'Dismiss',
      okCancel: false,
      centered: true,
      onOk: () => {
        closeOutModalOpen = false;
      },
      afterClose: () => {
        closeOutModalOpen = false;
      },
    });
  }

  return { shown: true, days: completeSessionDays };
}

/**
 * Warn if the week immediately before the *current* calendar week still fails
 * previous-week warning eligibility (Sales + Labor + at least one COGS entry).
 *
 * Only runs when the selected/viewed week is the actual current week.
 * Historical week selection and "Complete Previous Week" navigation must not
 * recursively check older weeks. Does not block — user may proceed anyway.
 *
 * Duplicate clicks while a check is in flight (or a close-out modal is open)
 * are ignored and do not call onProceed.
 *
 * @returns {Promise<boolean>} true if the caller should continue with onProceed
 *   (either no warning, or user already dismissed / Proceed Anyway was chosen
 *   synchronously because the warning was previously dismissed).
 *   false if a warning modal was shown (Proceed Anyway may still call onProceed
 *   later), user chose Complete Previous Week, or a duplicate click was ignored.
 */
export async function maybeWarnPreviousWeekIncomplete({
  weekStartDate,
  onProceed,
} = {}) {
  const proceed = () => {
    if (typeof onProceed === 'function') onProceed();
  };

  if (!weekStartDate) {
    proceed();
    return true;
  }

  const weekStart = dayjs(weekStartDate).startOf('week');
  if (!weekStart.isValid()) {
    proceed();
    return true;
  }

  // Reminder is only for entering the current week — never while editing history.
  if (!CalendarHelpers.isCurrentWeek(weekStart, weekStart.endOf('week'))) {
    proceed();
    return true;
  }

  const state = useStore.getState();
  const scopeKey = getFindingsScopeKey(state.restaurantId, state.selectedLocationId);
  const selectedWeekStart = weekStart.format('YYYY-MM-DD');
  const dismissKey = `${scopeKey}:${selectedWeekStart}`;

  if (previousWeekWarningDismissed.has(dismissKey)) {
    proceed();
    return true;
  }

  // Ignore duplicate clicks while checking or while a close-out modal is already open
  if (closeOutModalOpen || previousWeekWarningInFlight) {
    return false;
  }

  previousWeekWarningInFlight = true;
  let openedModal = false;

  try {
    const previousWeekStart = weekStart.subtract(1, 'week').startOf('week').format('YYYY-MM-DD');

    let previousWeekData = null;
    try {
      previousWeekData = await fetchDashboardDataForWeek(previousWeekStart);
    } catch (error) {
      console.warn('Failed to check previous week close-out status:', error);
      proceed();
      return true;
    }

    if (!previousWeekData || isNoWeeklyDashboardResponse(previousWeekData)) {
      proceed();
      return true;
    }

    if (!shouldWarnAboutPreviousWeek(previousWeekData)) {
      proceed();
      return true;
    }

    const incompleteDays = getIncompleteOpenDaysForPreviousWeekWarning(previousWeekData);
    if (incompleteDays.length === 0) {
      proceed();
      return true;
    }

    const daysPhrase = formatDayNamesPhrase(incompleteDays.map((day) => day.date));

    closeOutModalOpen = true;
    openedModal = true;

    Modal.confirm({
      title: 'Previous week incomplete',
      content: createElement(
        'div',
        null,
        createElement(
          'p',
          null,
          'The previous week has not been fully closed out. The following days are still incomplete:'
        ),
        createElement('p', { style: { marginTop: 8, fontWeight: 600 } }, daysPhrase),
        createElement(
          'p',
          { style: { marginTop: 12 } },
          'Would you like to return and complete these days, or proceed with this week?'
        )
      ),
      okText: 'Complete Previous Week',
      cancelText: 'Proceed Anyway',
      centered: true,
      closable: false,
      maskClosable: false,
      onOk: () => {
        closeOutModalOpen = false;
        previousWeekWarningInFlight = false;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(NAVIGATE_TO_CLOSE_OUT_WEEK_EVENT, {
              detail: { weekStart: previousWeekStart },
            })
          );
        }
      },
      onCancel: () => {
        previousWeekWarningDismissed.add(dismissKey);
        closeOutModalOpen = false;
        previousWeekWarningInFlight = false;
        proceed();
      },
      afterClose: () => {
        closeOutModalOpen = false;
        previousWeekWarningInFlight = false;
      },
    });

    // Modal is open; user may Proceed Anyway later via onCancel → onProceed.
    // Return immediately so callers can clear button loading.
    return false;
  } finally {
    if (!openedModal) {
      previousWeekWarningInFlight = false;
    }
  }
}

/** @deprecated Kept for compatibility — prefer maybeShowDayCloseoutComplete */
export function showReportCardFindingsModal(_findingsCount, navigate) {
  console.warn('showReportCardFindingsModal is deprecated; use maybeShowDayCloseoutComplete');
  return maybeShowDayCloseoutComplete({
    navigate,
    beforeFingerprints: captureCloseOutFingerprintsBeforeSave(),
    canAccessReportCard: true,
  });
}
