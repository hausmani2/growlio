import { apiGet } from '../../utils/axiosInterceptors';
import dayjs from 'dayjs';

const STORAGE_KEY = 'selected_location_id';

const readStoredLocationId = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const ONBOARDING_PATH_SEGMENTS = [
  'basic-information',
  'labor-information',
  'food-cost-details',
  'sales-channels',
  'third-party-delivery',
  'expense',
];

const createLocationSlice = (set, get) => ({
  name: 'location',
  locations: [],
  selectedLocationId: readStoredLocationId(),
  locationsLoading: false,
  locationsError: null,
  locationsRestaurantId: null,

  setSelectedLocationId: (locationId) => {
    if (locationId != null) {
      localStorage.setItem(STORAGE_KEY, String(locationId));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ selectedLocationId: locationId ?? null });
  },

  /** Drop cached API results so the next fetch uses the new location. */
  clearLocationScopedCaches: () => {
    set((state) => ({
      dashboardData: null,
      lastFetchedDate: null,
      lastFetchedLocationId: null,
      goalsData: null,
      lastGoalsLocationId: null,
      dashboardSummaryData: null,
      lastFetchedDateRange: null,
      lastFetchedSummaryLocationId: null,
      salesInformationData: null,
      salesInformationSummary: null,
      salesInformationSummaryLastFetch: null,
      salesInformationSummaryLoading: false,
      salesInformationSummaryError: null,
      dailyPerformanceData: null,
      dailyPerformanceError: null,
      dailyPerformanceLoading: false,
    }));
    sessionStorage.removeItem('onboarding_completion_check_time');
  },

  /**
   * User changed location in the header — update selection and invalidate caches.
   * Wrapper refetches the current route only.
   */
  changeLocation: (locationId) => {
    if (locationId == null) return;
    const previous = get().selectedLocationId;
    get().setSelectedLocationId(locationId);
    if (previous === locationId) return;
    get().clearLocationScopedCaches();
    if (typeof get().resetLocationScopedOnboardingSteps === 'function') {
      get().resetLocationScopedOnboardingSteps();
    }
    window.dispatchEvent(
      new CustomEvent('growlio:location-changed', { detail: { locationId } })
    );
  },

  /**
   * Refetch data for the page the user is on (and when they navigate, for that page).
   */
  refreshCurrentPage: async (pathname) => {
    const locationId = await get().getSelectedLocationId();
    if (!locationId || !pathname) return;

    const path = pathname.toLowerCase();

    try {
      if (path === '/dashboard') {
        const { weekStartDate } = get().getDateSelection?.() || {};
        const weekStart = weekStartDate
          ? weekStartDate.format('YYYY-MM-DD')
          : dayjs().startOf('week').format('YYYY-MM-DD');
        await get().fetchDashboardData(weekStart);
        get().fetchGoalsData?.().catch(() => {});
        return;
      }

      if (
        path === '/dashboard/budget' ||
        path === '/dashboard/profit-loss' ||
        path === '/dashboard/report-card'
      ) {
        const summaryRange = get().activeSummaryRange;
        const summaryStart =
          summaryRange?.start ?? dayjs().startOf('week').format('YYYY-MM-DD');
        const summaryEnd =
          summaryRange?.end ?? dayjs().endOf('week').format('YYYY-MM-DD');
        const summaryGroupBy = summaryRange?.groupBy ?? 'daily';

        if (path !== '/dashboard/report-card') {
          await get().fetchDashboardSummary(
            summaryStart,
            summaryEnd,
            summaryGroupBy
          );
        }
        if (path === '/dashboard/report-card') {
          const reportRange = get().activeReportCardRange;
          const reportStart =
            reportRange?.start ??
            dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
          const reportEnd =
            reportRange?.end ??
            dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
          get()
            .getSalesInformationSummary?.(reportStart, reportEnd)
            .catch(() => {});
          const dailyStart =
            summaryRange?.start ?? dayjs().startOf('week').format('YYYY-MM-DD');
          const dailyEnd =
            summaryRange?.end ?? dayjs().endOf('week').format('YYYY-MM-DD');
          get()
            .getDailyPerformanceData?.(dailyStart, dailyEnd)
            .catch(() => {});
        }
        if (path === '/dashboard/profit-loss') {
          get()
            .fetchProfitLossCategorySummary?.(summaryStart, summaryEnd)
            .catch(() => {});
        }
        if (path === '/dashboard/budget') {
          get()
            .fetchBudgetAllocationSummary?.(summaryStart, summaryEnd)
            .catch(() => {});
        }
        return;
      }

      if (ONBOARDING_PATH_SEGMENTS.some((segment) => path.includes(segment))) {
        if (typeof get().loadExistingOnboardingData === 'function') {
          await get().loadExistingOnboardingData();
        }
        return;
      }

      if (path.includes('/dashboard/square') || path.includes('/dashboard/pos')) {
        const restaurantId =
          localStorage.getItem('restaurant_id') || get().restaurantId;
        if (restaurantId) {
          get().checkSquareStatus?.(restaurantId).catch(() => {});
        }
      }
    } catch (error) {
      console.warn('[location] refreshCurrentPage failed:', path, error);
    }
  },

  fetchLocations: async (restaurantId = null, forceRefresh = false) => {
    try {
      let targetRestaurantId = restaurantId;
      if (!targetRestaurantId && typeof get().fetchRestaurantId === 'function') {
        targetRestaurantId = await get().fetchRestaurantId();
      }
      if (!targetRestaurantId) {
        set({ locationsLoading: false, locations: [] });
        return [];
      }

      const currentState = get();
      if (
        !forceRefresh &&
        currentState.locations.length > 0 &&
        String(currentState.locationsRestaurantId) === String(targetRestaurantId)
      ) {
        return currentState.locations;
      }

      if (currentState.locationsLoading) {
        await new Promise((resolve) => {
          let timeoutId;
          const interval = setInterval(() => {
            if (!get().locationsLoading) {
              clearInterval(interval);
              clearTimeout(timeoutId);
              resolve();
            }
          }, 50);
          timeoutId = setTimeout(() => {
            clearInterval(interval);
            resolve();
          }, 15000);
        });
        const latestState = get();
        if (
          String(latestState.locationsRestaurantId) === String(targetRestaurantId)
        ) {
          return latestState.locations;
        }
      }

      set({ locationsLoading: true, locationsError: null });
      const response = await apiGet(
        `/restaurant_v2/locations/?restaurant_id=${targetRestaurantId}`
      );
      const locations = response.data?.locations || [];
      let selected = get().selectedLocationId;
      const stillValid = locations.some((loc) => loc.id === selected);
      if (!stillValid && locations.length > 0) {
        selected = locations[0].id;
        get().setSelectedLocationId(selected);
      }
      set({
        locations,
        locationsLoading: false,
        locationsRestaurantId: String(targetRestaurantId),
      });
      return locations;
    } catch (error) {
      set({
        locationsLoading: false,
        locationsError: error?.message || 'Failed to load locations',
      });
      throw error;
    }
  },

  getSelectedLocationId: async () => {
    let id = get().selectedLocationId;
    if (id) return id;
    const locations = await get().fetchLocations();
    return locations[0]?.id ?? null;
  },

  withLocationParams: async (params = {}) => {
    const locationId = await get().getSelectedLocationId();
    if (!locationId) return { ...params };
    return { ...params, location_id: locationId };
  },

  appendLocationToUrl: async (url) => {
    const locationId = await get().getSelectedLocationId();
    if (!locationId) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}location_id=${locationId}`;
  },

  clearLocationState: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      locations: [],
      selectedLocationId: null,
      locationsLoading: false,
      locationsError: null,
      locationsRestaurantId: null,
    });
  },
});

export default createLocationSlice;
