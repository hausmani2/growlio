import { apiGet } from '../utils/axiosInterceptors';

export function fetchSquarePosOrders({ restaurantId, pageNumber = 1, pageSize = 10 }) {
  return apiGet(
    `/square_pos/orders/?page=${pageNumber}&page_size=${pageSize}&restaurant_id=${restaurantId ?? ''}`
  );
}

export function fetchSquarePosLocations({ restaurantId }) {
  return apiGet(`/square_pos/locations/?restaurant_id=${restaurantId ?? ''}`);
}

export function fetchSquarePosPayments({ restaurantId, pageNumber = 1 }) {
  return apiGet(`/square_pos/payments/?restaurant_id=${restaurantId ?? ''}&page=${pageNumber}`);
}

export function fetchSquarePosTimecards({ restaurantId, pageNumber = 1 }) {
  return apiGet(`/square_pos/timecards/?restaurant_id=${restaurantId ?? ''}&page=${pageNumber}`);
}

