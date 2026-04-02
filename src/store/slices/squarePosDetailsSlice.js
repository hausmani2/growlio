import { message } from 'antd';
import {
  fetchSquarePosLocations,
  fetchSquarePosOrders,
  fetchSquarePosPayments,
  fetchSquarePosTimecards,
} from '../../services/squarePosApi';

const normalizePaged = ({ currentPage, pageSize, totalCount, totalPages }) => ({
  current_page: currentPage,
  page_size: pageSize,
  total_count: totalCount,
  total_pages: totalPages,
  has_next: currentPage < totalPages,
  has_previous: currentPage > 1,
});

const getRestaurantIdOrThrow = (restaurantId, get) => {
  const rid = restaurantId || localStorage.getItem('restaurant_id') || get()?.restaurantId;
  if (!rid) throw new Error('Restaurant ID is required');
  return rid;
};

const createSquarePosDetailsSlice = (set, get) => ({
  name: 'square-pos-details',

  posOrdersLoading: false,
  posOrdersError: null,
  posOrders: [],
  posOrdersPagination: null,

  posLocationsLoading: false,
  posLocationsError: null,
  posLocations: [],

  posPaymentsLoading: false,
  posPaymentsError: null,
  posPayments: [],
  posPaymentsPagination: null,

  posTimecardsLoading: false,
  posTimecardsError: null,
  posTimecards: [],
  posTimecardsPagination: null,

  resetSquarePosDetailsState: () =>
    set({
      posOrdersLoading: false,
      posOrdersError: null,
      posOrders: [],
      posOrdersPagination: null,
      posLocationsLoading: false,
      posLocationsError: null,
      posLocations: [],
      posPaymentsLoading: false,
      posPaymentsError: null,
      posPayments: [],
      posPaymentsPagination: null,
      posTimecardsLoading: false,
      posTimecardsError: null,
      posTimecards: [],
      posTimecardsPagination: null,
    }),

  fetchPosOrders: async ({ restaurantId = null, pageNumber = 1, pageSize = 10, silent = false } = {}) => {
    set({ posOrdersLoading: true, posOrdersError: null });
    try {
      const rid = getRestaurantIdOrThrow(restaurantId, get);
      const res = await fetchSquarePosOrders({ restaurantId: rid, pageNumber, pageSize });
      const data = res?.data?.data || res?.data;
      set({
        posOrdersLoading: false,
        posOrdersError: null,
        posOrders: data?.orders || [],
        posOrdersPagination: data?.pagination || null,
      });
      return { success: true, data };
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch POS orders';
      set({ posOrdersLoading: false, posOrdersError: errorMessage, posOrders: [], posOrdersPagination: null });
      if (!silent) message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  fetchPosLocations: async ({ restaurantId = null, silent = false } = {}) => {
    set({ posLocationsLoading: true, posLocationsError: null });
    try {
      const rid = getRestaurantIdOrThrow(restaurantId, get);
      const res = await fetchSquarePosLocations({ restaurantId: rid });
      const data = res?.data?.data || res?.data;
      set({
        posLocationsLoading: false,
        posLocationsError: null,
        posLocations: data?.locations || [],
      });
      return { success: true, data };
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch POS locations';
      set({ posLocationsLoading: false, posLocationsError: errorMessage, posLocations: [] });
      if (!silent) message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  fetchPosPayments: async ({ restaurantId = null, pageNumber = 1, silent = false } = {}) => {
    set({ posPaymentsLoading: true, posPaymentsError: null });
    try {
      const rid = getRestaurantIdOrThrow(restaurantId, get);
      const res = await fetchSquarePosPayments({ restaurantId: rid, pageNumber });
      const data = res?.data?.data || res?.data;

      const currentPage = Number(data?.current_page || pageNumber || 1);
      const totalPages = Number(data?.num_pages || 1);
      const totalCount = Number(data?.total || 0);
      const pageSize = totalPages > 0 ? Math.max(1, Math.ceil(totalCount / totalPages)) : 10;

      set({
        posPaymentsLoading: false,
        posPaymentsError: null,
        posPayments: data?.results || [],
        posPaymentsPagination: normalizePaged({ currentPage, pageSize, totalCount, totalPages }),
      });
      return { success: true, data };
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch POS payments';
      set({ posPaymentsLoading: false, posPaymentsError: errorMessage, posPayments: [], posPaymentsPagination: null });
      if (!silent) message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  fetchPosTimecards: async ({ restaurantId = null, pageNumber = 1, silent = false } = {}) => {
    set({ posTimecardsLoading: true, posTimecardsError: null });
    try {
      const rid = getRestaurantIdOrThrow(restaurantId, get);
      const res = await fetchSquarePosTimecards({ restaurantId: rid, pageNumber });
      const data = res?.data?.data || res?.data;

      const currentPage = Number(data?.current_page || pageNumber || 1);
      const totalPages = Number(data?.num_pages || 1);
      const totalCount = Number(data?.total || 0);
      const pageSize = totalPages > 0 ? Math.max(1, Math.ceil(totalCount / totalPages)) : 10;

      set({
        posTimecardsLoading: false,
        posTimecardsError: null,
        posTimecards: data?.results || [],
        posTimecardsPagination: normalizePaged({ currentPage, pageSize, totalCount, totalPages }),
      });
      return { success: true, data };
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fetch POS timecards';
      set({ posTimecardsLoading: false, posTimecardsError: errorMessage, posTimecards: [], posTimecardsPagination: null });
      if (!silent) message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },
});

export default createSquarePosDetailsSlice;

