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

export const runGrowlioIQAnalysis = async ({
  startDate,
  endDate,
  focus = 'general',
}) => {
  const { restaurant_id, location_id } = withIds();
  const res = await apiPost('/growlio_iq/analyze/', {
    restaurant_id,
    location_id,
    start_date: startDate,
    end_date: endDate,
    focus,
  });
  return res.data;
};

export const pollGrowlioIQStatus = async (jobId) => {
  const res = await apiGet(`/growlio_iq/status/${jobId}/`);
  return res.data;
};
