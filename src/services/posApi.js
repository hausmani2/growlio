import { apiGet, apiPost } from '../utils/axiosInterceptors';

export const POS_SYNC_POLL_INTERVAL_MS = 10000;

export const posQueryKeys = {
  merchantStatus: (restaurantId) => ['pos-sync', 'merchant-status', String(restaurantId)],
  dashboard: (restaurantId, weekStart) => ['dashboard', String(restaurantId), weekStart],
};

export const triggerPosSync = async (restaurantId, options = {}) => {
  const { startDate, endDate, createSalesInformation = false } = options;
  const query = new URLSearchParams({
    restaurant_id: String(restaurantId),
  });

  if (startDate) query.set('start_date', startDate);
  if (endDate) query.set('end_date', endDate);
  if (createSalesInformation) query.set('create_sales_information', 'true');
  const locationId = localStorage.getItem('selected_location_id');
  if (locationId) query.set('location_id', locationId);

  const response = await apiGet(`/square_pos/sync_data/?${query.toString()}`);
  return response.data;
};

export const getLastCalendarMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  const fmt = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  return {
    startDate: fmt(start),
    endDate: fmt(end),
  };
};

/** Format a Date / dayjs-like value as YYYY-MM-DD. */
export const formatPosDate = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  if (typeof value?.format === 'function') return value.format('YYYY-MM-DD');
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const POS_IMPORT_MAX_DAYS = 90;

export const POS_IMPORT_PRESET_OPTIONS = [
  { value: 'last_week', label: 'Last week' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_month', label: 'Last month' },
  { value: 'custom', label: 'Custom range' },
];

export const getPosImportRangeForPreset = (preset, dayjsLib) => {
  if (!dayjsLib) return null;
  const today = dayjsLib();

  switch (preset) {
    case 'last_week':
      return [today.subtract(6, 'day'), today];
    case 'last_30_days':
      return [today.subtract(29, 'day'), today];
    case 'last_month':
      return [
        today.subtract(1, 'month').startOf('month'),
        today.subtract(1, 'month').endOf('month'),
      ];
    default:
      return null;
  }
};

/** @deprecated Prefer PosImportDateRangeSelect dropdown options. */
export const getPosImportPresets = (dayjsLib) => {
  if (!dayjsLib) return [];
  return [
    {
      label: 'Last week',
      value: getPosImportRangeForPreset('last_week', dayjsLib),
    },
    {
      label: 'Last 30 days',
      value: getPosImportRangeForPreset('last_30_days', dayjsLib),
    },
    {
      label: 'Last month',
      value: getPosImportRangeForPreset('last_month', dayjsLib),
    },
  ];
};

/**
 * Block future dates and ranges longer than POS_IMPORT_MAX_DAYS.
 * Compatible with Ant Design RangePicker `disabledDate(current, info)`.
 */
export const isPosImportDateDisabled = (current, info, dayjsLib) => {
  if (!current || !dayjsLib) return false;
  const today = dayjsLib().endOf('day');
  if (current.isAfter(today)) return true;

  const from = info?.from;
  if (from) {
    const diffDays = Math.abs(current.startOf('day').diff(from.startOf('day'), 'day'));
    return diffDays >= POS_IMPORT_MAX_DAYS;
  }
  return false;
};

/** Returns true when inclusive day count is within the allowed max. */
export const isPosImportRangeAllowed = (start, end, dayjsLib) => {
  if (!start || !end || !dayjsLib) return false;
  const startDay = dayjsLib(start).startOf('day');
  const endDay = dayjsLib(end).startOf('day');
  if (endDay.isBefore(startDay)) return false;
  const days = endDay.diff(startDay, 'day') + 1;
  return days <= POS_IMPORT_MAX_DAYS;
};

export const getMerchantDetail = async (restaurantId) => {
  const locationId = localStorage.getItem('selected_location_id');
  const locationQuery = locationId ? `&location_id=${locationId}` : '';
  const response = await apiGet(
    `/square_pos/merchant-detail/?restaurant_id=${restaurantId}${locationQuery}`
  );
  return response.data;
};

export const getMerchantSyncStatus = async (restaurantId) => {
  const payload = await getMerchantDetail(restaurantId);
  const status =
    payload?.square_sync_status ??
    payload?.data?.square_sync_status ??
    payload?.merchant?.square_sync_status ??
    payload?.data?.merchant?.square_sync_status ??
    null;

  return {
    payload,
    squareSyncStatus: status,
    isCompleted: status === 'completed',
  };
};

export const getDashboardData = async ({ restaurantId, weekStart }) => {
  const locationId = localStorage.getItem('selected_location_id');
  const locationQuery = locationId ? `&location_id=${locationId}` : '';
  const response = await apiGet(
    `/restaurant/dashboard/?restaurant_id=${restaurantId}&week_start=${weekStart}${locationQuery}`
  );

  return response.data;
};
