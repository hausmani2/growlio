import { countOverGoalFindings, getFindingsScopeKey } from '../../utils/reportCardFindings';

const createReportCardSlice = (set, get) => ({
  name: 'reportCard',
  unseenFindingsCount: 0,
  unseenFindingsScopeKey: null,
  // `${scopeKey}:${YYYY-MM-DD}` -> fingerprint last acknowledged for Close-out complete
  closeOutNotifiedByDate: {},
  // `${scopeKey}:${weekStart YYYY-MM-DD}` -> fingerprint last acknowledged for week close-out
  weekCloseOutNotifiedByWeek: {},

  setUnseenFindings: (count) => {
    const state = get();
    const scopeKey = getFindingsScopeKey(state.restaurantId, state.selectedLocationId);
    set({
      unseenFindingsCount: Math.max(0, count),
      unseenFindingsScopeKey: scopeKey,
    });
  },

  clearUnseenFindings: () => {
    set({ unseenFindingsCount: 0 });
  },

  markCloseOutDaysNotified: (days = []) => {
    if (!Array.isArray(days) || days.length === 0) return;
    const state = get();
    const scopeKey = getFindingsScopeKey(state.restaurantId, state.selectedLocationId);
    const next = { ...(state.closeOutNotifiedByDate || {}) };
    days.forEach((day) => {
      if (!day?.date || !day?.fingerprint) return;
      next[`${scopeKey}:${day.date}`] = day.fingerprint;
    });
    set({ closeOutNotifiedByDate: next });
  },

  markWeekCloseOutNotified: ({ weekStart, fingerprint } = {}) => {
    if (!weekStart || !fingerprint) return;
    const state = get();
    const scopeKey = getFindingsScopeKey(state.restaurantId, state.selectedLocationId);
    set({
      weekCloseOutNotifiedByWeek: {
        ...(state.weekCloseOutNotifiedByWeek || {}),
        [`${scopeKey}:${weekStart}`]: fingerprint,
      },
    });
  },

  getEffectiveUnseenFindingsCount: () => {
    const state = get();
    const scopeKey = getFindingsScopeKey(state.restaurantId, state.selectedLocationId);
    if (state.unseenFindingsScopeKey !== scopeKey) return 0;
    return state.unseenFindingsCount || 0;
  },

  refreshFindingsAfterCloseOut: async (startDate, endDate, { requireCompleteDays = true, hasCompleteDays = false } = {}) => {
    if (requireCompleteDays && !hasCompleteDays) {
      return { count: 0, skipped: true };
    }

    const { getDailyPerformanceData } = get();
    const result = await getDailyPerformanceData(startDate, endDate);
    if (!result?.success) {
      return { count: 0 };
    }

    const count = countOverGoalFindings(result.data);
    if (count > 0) {
      get().setUnseenFindings(count);
    }
    return { count };
  },
});

export default createReportCardSlice;
