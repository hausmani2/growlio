import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPostWithTimeout,
  AI_UPLOAD_TIMEOUT,
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

export const fetchIngredients = async (search = '') => {
  const { query } = withIds();
  const q = search ? `${query}&search=${encodeURIComponent(search)}` : query;
  const res = await apiGet(`/food_costing/ingredients/?${q}`);
  return res.data;
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

export const updateIngredient = async (id, payload) => {
  const res = await apiPatch(`/food_costing/ingredients/${id}/`, payload);
  return res.data;
};

export const archiveIngredient = async (id) => {
  const res = await apiDelete(`/food_costing/ingredients/${id}/`);
  return res.data;
};

export const fetchMenuItems = async () => {
  const { query } = withIds();
  const res = await apiGet(`/food_costing/menu-items/?${query}`);
  return res.data;
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

export const fetchRecipeDrafts = async (status = 'pending') => {
  const { query } = withIds();
  const statusParam = status ? `&status=${encodeURIComponent(status)}` : '';
  const res = await apiGet(`/food_costing/drafts/?${query}${statusParam}`);
  return res.data;
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

export const fetchInvoices = async (status = '') => {
  const { query } = withIds();
  const statusParam = status ? `&status=${encodeURIComponent(status)}` : '';
  const res = await apiGet(`/food_costing/invoices/?${query}${statusParam}`);
  return res.data;
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
