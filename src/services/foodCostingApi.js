import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPostWithTimeout,
  apiGetWithTimeout,
  AI_UPLOAD_TIMEOUT,
  API_TIMEOUT,
} from '../utils/axiosInterceptors';

const withIds = (params = {}) => {
  const restaurantId =
    params.restaurant_id || localStorage.getItem('restaurant_id');
  const locationId =
    params.location_id || localStorage.getItem('selected_location_id');
  const query = new URLSearchParams();
  if (restaurantId) query.set('restaurant_id', String(restaurantId));
  if (locationId) query.set('location_id', String(locationId));
  return {
    restaurant_id: restaurantId ? Number(restaurantId) : null,
    location_id: locationId ? Number(locationId) : null,
    query: query.toString(),
  };
};

/** Normalize paginated API responses; still accepts legacy bare arrays. */
export const normalizePaginated = (data) => {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      page: 1,
      page_size: data.length,
      results: data,
    };
  }
  return {
    count: data?.count ?? (data?.results?.length || 0),
    page: data?.page ?? 1,
    page_size: data?.page_size ?? (data?.results?.length || 0),
    results: Array.isArray(data?.results) ? data.results : [],
  };
};

export const fetchFoodCostingDashboard = async () => {
  const { query } = withIds();
  const res = await apiGet(`/food_costing/dashboard/?${query}`);
  return res.data;
};

export const fetchVendors = async () => {
  const { query } = withIds();
  const res = await apiGet(`/food_costing/vendors/?${query}`);
  return res.data;
};

export const createVendor = async (payload) => {
  const { restaurant_id } = withIds();
  const res = await apiPost('/food_costing/vendors/', {
    ...payload,
    restaurant_id,
    restaurant: restaurant_id,
  });
  return res.data;
};

export const updateVendor = async (id, payload) => {
  const res = await apiPatch(`/food_costing/vendors/${id}/`, payload);
  return res.data;
};

export const archiveVendor = async (id) => {
  const res = await apiDelete(`/food_costing/vendors/${id}/`);
  return res.data;
};

export const fetchIngredients = async ({
  search = '',
  category = '',
  ordering = 'name',
  page = 1,
  pageSize = 25,
} = {}) => {
  const { query } = withIds();
  const params = new URLSearchParams(query);
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (ordering) params.set('ordering', ordering);
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  const res = await apiGet(`/food_costing/ingredients/?${params.toString()}`);
  return normalizePaginated(res.data);
};

export const createIngredient = async (payload) => {
  const { restaurant_id } = withIds();
  const res = await apiPost('/food_costing/ingredients/', {
    ...payload,
    restaurant_id,
    restaurant: restaurant_id,
  });
  return res.data;
};

export const estimateIngredientYield = async (payload) => {
  const { restaurant_id } = withIds();
  const res = await apiPost('/food_costing/ingredients/estimate-yield/', {
    ...payload,
    restaurant_id,
  });
  return res.data;
};

export const updateIngredient = async (id, payload) => {
  const res = await apiPatch(`/food_costing/ingredients/${id}/`, payload);
  return res.data;
};

export const archiveIngredient = async (id) => {
  const res = await apiDelete(`/food_costing/ingredients/${id}/`);
  return res.data;
};

export const fetchMenuItems = async ({
  search = '',
  page = 1,
  pageSize = 25,
  ordering = '',
} = {}) => {
  const { query } = withIds();
  const params = new URLSearchParams(query);
  if (search) params.set('search', search);
  if (ordering) params.set('ordering', ordering);
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  const res = await apiGet(`/food_costing/menu-items/?${params.toString()}`);
  return normalizePaginated(res.data);
};

/** Fetch every menu item (for category grouping view). Pages at 100 (API max). */
export const fetchAllMenuItems = async ({ search = '' } = {}) => {
  const pageSize = 100;
  const first = await fetchMenuItems({ search, page: 1, pageSize });
  let results = [...first.results];
  const totalPages = Math.ceil(first.count / pageSize);
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchMenuItems({ search, page, pageSize });
    results = results.concat(next.results);
  }
  return { count: first.count, results };
};

export const importSquareMenuItems = async () => {
  const { query } = withIds();
  const res = await apiPost(`/square_pos/menu-items/?${query}`, {});
  return res.data;
};

export const pollSquareImportStatus = async (jobId) => {
  const { query } = withIds();
  const res = await apiGet(`/square_pos/menu-items/status/${jobId}/?${query}`);
  return res.data;
};

export const scanPrintedMenu = async ({ file }) => {
  const { restaurant_id, location_id } = withIds();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('restaurant_id', String(restaurant_id));
  if (location_id) formData.append('location_id', String(location_id));
  const res = await apiPostWithTimeout(
    '/food_costing/menu-items/from-menu-scan/',
    formData,
    AI_UPLOAD_TIMEOUT
  );
  return res.data;
};

export const createMenuItem = async (payload) => {
  const { restaurant_id, location_id } = withIds();
  const res = await apiPost('/food_costing/menu-items/', {
    ...payload,
    restaurant_id,
    location_id,
  });
  return res.data;
};

export const updateMenuItem = async (id, payload) => {
  const res = await apiPatch(`/food_costing/menu-items/${id}/`, payload);
  return res.data;
};

export const archiveMenuItem = async (id) => {
  const res = await apiDelete(`/food_costing/menu-items/${id}/`);
  return res.data;
};

export const createPhotoDraft = async ({ image, menuItemId, menuItemName }) => {
  const { restaurant_id, location_id } = withIds();
  const formData = new FormData();
  formData.append('image', image);
  formData.append('restaurant_id', String(restaurant_id));
  formData.append('location_id', String(location_id));
  if (menuItemId) formData.append('menu_item_id', String(menuItemId));
  if (menuItemName) formData.append('menu_item_name', menuItemName);

  const res = await apiPostWithTimeout(
    '/food_costing/drafts/from-photo/',
    formData,
    AI_UPLOAD_TIMEOUT
  );
  return res.data;
};

export const fetchRecipeDrafts = async (status = 'pending', { page = 1, pageSize = 20 } = {}) => {
  const { query } = withIds();
  const statusParam = status ? `&status=${encodeURIComponent(status)}` : '';
  const res = await apiGet(
    `/food_costing/drafts/?${query}${statusParam}&page=${page}&page_size=${pageSize}`
  );
  return normalizePaginated(res.data);
};

export const fetchRecipeDraft = async (draftId) => {
  const res = await apiGet(`/food_costing/drafts/${draftId}/`);
  return res.data;
};

export const confirmRecipeDraft = async (draftId, payload) => {
  const res = await apiPost(`/food_costing/drafts/${draftId}/confirm/`, payload);
  return res.data;
};

export const discardRecipeDraft = async (draftId) => {
  const res = await apiDelete(`/food_costing/drafts/${draftId}/`);
  return res.data;
};

export const fetchInvoices = async (status = '', { page = 1, pageSize = 20 } = {}) => {
  const { query } = withIds();
  const statusParam = status ? `&status=${encodeURIComponent(status)}` : '';
  const res = await apiGet(
    `/food_costing/invoices/?${query}${statusParam}&page=${page}&page_size=${pageSize}`
  );
  return normalizePaginated(res.data);
};

export const createInvoice = async ({
  file,
  extractWithAi = false,
  vendorName = '',
  vendorId = null,
  invoiceNumber = '',
  invoiceDate = '',
  lines = [],
}) => {
  const { restaurant_id, location_id } = withIds();
  const formData = new FormData();
  formData.append('restaurant_id', String(restaurant_id));
  if (location_id) formData.append('location_id', String(location_id));
  if (vendorName) formData.append('vendor_name', vendorName);
  if (vendorId) formData.append('vendor_id', String(vendorId));
  if (invoiceNumber) formData.append('invoice_number', invoiceNumber);
  if (invoiceDate) formData.append('invoice_date', invoiceDate);
  if (extractWithAi) formData.append('extract_with_ai', 'true');
  if (file) formData.append('file', file);
  if (lines?.length) formData.append('lines', JSON.stringify(lines));
  const timeout = extractWithAi && file ? AI_UPLOAD_TIMEOUT : 30000;
  const res = await apiPostWithTimeout('/food_costing/invoices/', formData, timeout);
  return res.data;
};

export const updateInvoice = async (invoiceId, payload) => {
  const res = await apiPatch(`/food_costing/invoices/${invoiceId}/`, payload);
  return res.data;
};

export const applyInvoiceCosts = async (
  invoiceId,
  { createMissingIngredients = false } = {}
) => {
  const res = await apiPost(`/food_costing/invoices/${invoiceId}/apply/`, {
    create_missing_ingredients: createMissingIngredients,
  });
  return res.data;
};

export const discardInvoice = async (invoiceId) => {
  const res = await apiDelete(`/food_costing/invoices/${invoiceId}/`);
  return res.data;
};

/** Menu Profitability Simulator — single bootstrap (baseline computed once). */
export const fetchSimulatorBootstrap = async ({ dateFrom, dateTo, limit = 8 } = {}) => {
  const { query } = withIds();
  const params = new URLSearchParams(query);
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  if (limit) params.set('limit', String(limit));
  const res = await apiGetWithTimeout(
    `/food_costing/simulator/bootstrap/?${params.toString()}`,
    Math.max(API_TIMEOUT, 60000)
  );
  return res.data;
};

/** Menu Profitability Simulator (Food Costing) — read-only preview APIs */
export const fetchSimulatorBaseline = async ({ dateFrom, dateTo } = {}) => {
  const { query } = withIds();
  const params = new URLSearchParams(query);
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  const res = await apiGetWithTimeout(
    `/food_costing/simulator/baseline/?${params.toString()}`,
    Math.max(API_TIMEOUT, 60000)
  );
  return res.data;
};

export const previewSimulatorChanges = async (payload) => {
  const { restaurant_id, location_id } = withIds();
  const res = await apiPost('/food_costing/simulator/preview/', {
    restaurant_id,
    location_id,
    ...payload,
  });
  return res.data;
};

export const fetchSimulatorOpportunities = async ({
  dateFrom,
  dateTo,
  limit = 10,
} = {}) => {
  const { query } = withIds();
  const params = new URLSearchParams(query);
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);
  if (limit) params.set('limit', String(limit));
  const res = await apiGet(
    `/food_costing/simulator/opportunities/?${params.toString()}`
  );
  return res.data;
};

export const fetchSimulatorScenarios = async () => {
  const { query } = withIds();
  const res = await apiGet(`/food_costing/simulator/scenarios/?${query}`);
  return res.data;
};

export const saveSimulatorScenario = async (payload) => {
  const { restaurant_id, location_id } = withIds();
  const res = await apiPost('/food_costing/simulator/scenarios/', {
    restaurant_id,
    location_id,
    ...payload,
  });
  return res.data;
};

export const updateSimulatorScenario = async (id, payload) => {
  const { restaurant_id, location_id } = withIds();
  const res = await apiPatch(`/food_costing/simulator/scenarios/${id}/`, {
    restaurant_id,
    location_id,
    ...payload,
  });
  return res.data;
};

export const archiveSimulatorScenario = async (id) => {
  const { restaurant_id, location_id, query } = withIds();
  const res = await apiDelete(
    `/food_costing/simulator/scenarios/${id}/?${query}`,
    { data: { restaurant_id, location_id } }
  );
  return res.data;
};

export const previewSimulatorScenario = async (id) => {
  const { restaurant_id, location_id } = withIds();
  const res = await apiPost(`/food_costing/simulator/scenarios/${id}/preview/`, {
    restaurant_id,
    location_id,
  });
  return res.data;
};

export const fetchSimulatorApplyPlan = async (changes) => {
  const { restaurant_id, location_id } = withIds();
  const res = await apiPost('/food_costing/simulator/apply-plan/', {
    restaurant_id,
    location_id,
    changes,
  });
  return res.data;
};

export const applySimulatorChanges = async (payload) => {
  const { restaurant_id, location_id } = withIds();
  const res = await apiPost('/food_costing/simulator/apply/', {
    restaurant_id,
    location_id,
    confirm: true,
    ...payload,
  });
  return res.data;
};

export const fetchSimulatorSnapshots = async () => {
  const { query } = withIds();
  const res = await apiGet(`/food_costing/simulator/snapshots/?${query}`);
  return res.data;
};
