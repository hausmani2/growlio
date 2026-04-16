import { apiGet, apiPost } from '../utils/axiosInterceptors';

export const POS_SYNC_POLL_INTERVAL_MS = 10000;

export const posQueryKeys = {
  merchantStatus: (restaurantId) => ['pos-sync', 'merchant-status', String(restaurantId)],
  dashboard: (restaurantId, weekStart) => ['dashboard', String(restaurantId), weekStart],
};

export const triggerPosSync = async (restaurantId) => {
  const response = await apiGet(`/square_pos/sync_data/?restaurant_id=${restaurantId}`);
  return response.data;
};

export const getMerchantDetail = async (restaurantId) => {
  const response = await apiGet(`/square_pos/merchant-detail/?restaurant_id=${restaurantId}`);
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
  const response = await apiGet(
    `/restaurant/dashboard/?restaurant_id=${restaurantId}&week_start=${weekStart}`
  );

  return response.data;
};
