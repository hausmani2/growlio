import { apiGet, apiPost } from '../utils/axiosInterceptors';

export const LIO_FEATURE = {
  GROWLIO_IQ: 'growlio_iq',
  BUDGET: 'budget',
  ACTION_PLAN: 'action_plan',
};

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
  feature = LIO_FEATURE.GROWLIO_IQ,
}) => {
  const { restaurant_id, location_id } = withIds();
  const res = await apiPost('/growlio_iq/analyze/', {
    restaurant_id,
    location_id,
    start_date: startDate,
    end_date: endDate,
    focus,
    feature,
  });
  return res.data;
};

export const pollGrowlioIQStatus = async (jobId) => {
  const res = await apiGet(`/growlio_iq/status/${jobId}/`);
  return res.data;
};

export const fetchGrowlioIQUsage = async () => {
  const { restaurant_id, location_id } = withIds();
  const res = await apiGet('/growlio_iq/usage/', {
    params: { restaurant_id, location_id },
  });
  return res.data;
};

export const remainingLioReviewsCopy = (featureUsage) => {
  if (!featureUsage || featureUsage.unlimited) return '';
  const remaining = Number(featureUsage.remaining ?? 0);
  const limit = Number(featureUsage.limit ?? 5);
  return `${remaining} of ${limit} free LIO reviews left this month.`;
};
