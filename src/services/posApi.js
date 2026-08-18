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
