import { apiGet } from '../utils/axiosInterceptors';

const buildSquareQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      query.set(key, String(value));
    }
  });
  const locationId = localStorage.getItem('selected_location_id');
  if (locationId && !query.has('location_id')) {
    query.set('location_id', locationId);
  }
  return query.toString();
};

export function fetchSquarePosOrders({ restaurantId, pageNumber = 1, pageSize = 10 }) {
  const qs = buildSquareQuery({
    restaurant_id: restaurantId ?? '',
    page: pageNumber,
    page_size: pageSize,
  });
  return apiGet(`/square_pos/orders/?${qs}`);
}

export function fetchSquarePosLocations({ restaurantId }) {
  const qs = buildSquareQuery({ restaurant_id: restaurantId ?? '' });
  return apiGet(`/square_pos/locations/?${qs}`);
}

export function fetchSquarePosPayments({ restaurantId, pageNumber = 1 }) {
  const qs = buildSquareQuery({
    restaurant_id: restaurantId ?? '',
    page: pageNumber,
  });
  return apiGet(`/square_pos/payments/?${qs}`);
}

export function fetchSquarePosTimecards({ restaurantId, pageNumber = 1 }) {
  const qs = buildSquareQuery({
    restaurant_id: restaurantId ?? '',
    page: pageNumber,
  });
  return apiGet(`/square_pos/timecards/?${qs}`);
}
