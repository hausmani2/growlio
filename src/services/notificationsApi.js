import { apiGet, apiPost } from '../utils/axiosInterceptors';

const withIds = (params = {}) => {
  const restaurantId =
    params.restaurant_id || localStorage.getItem('restaurant_id');
  const locationId =
    params.location_id || localStorage.getItem('selected_location_id');
  return {
    restaurant_id: restaurantId ? Number(restaurantId) : null,
    location_id: locationId ? Number(locationId) : null,
  };
};

export const fetchNotifications = async ({ unreadOnly = false, limit = 30 } = {}) => {
  const { restaurant_id, location_id } = withIds();
  const params = new URLSearchParams();
  if (restaurant_id) params.set('restaurant_id', String(restaurant_id));
  if (location_id) params.set('location_id', String(location_id));
  if (unreadOnly) params.set('unread_only', 'true');
  if (limit) params.set('limit', String(limit));
  const res = await apiGet(`/notifications/?${params.toString()}`);
  return res.data;
};

export const fetchUnreadNotificationCount = async () => {
  const { restaurant_id } = withIds();
  const params = new URLSearchParams();
  if (restaurant_id) params.set('restaurant_id', String(restaurant_id));
  const res = await apiGet(`/notifications/unread-count/?${params.toString()}`);
  return res.data;
};

export const markNotificationRead = async (id) => {
  const res = await apiPost(`/notifications/${id}/mark-read/`, {});
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const { restaurant_id } = withIds();
  const res = await apiPost('/notifications/mark-read/', {
    mark_all: true,
    restaurant_id,
  });
  return res.data;
};
