import { Modal } from 'antd';
import {
  getDailyEntryForDate,
  normalizeCloseOutDate,
} from './salesEnteredGate';

export const CANNOT_CLOSE_DAY_WITH_DATA_MESSAGE =
  'This day contains actual sales, labor, or COGS data and cannot be closed. Closing this day would cause that data to no longer appear in Growlio.';

export function showCannotCloseDayWithDataModal() {
  Modal.warning({
    title: 'This day cannot be closed',
    content: CANNOT_CLOSE_DAY_WITH_DATA_MESSAGE,
    okText: 'OK',
    centered: true,
    closable: false,
    maskClosable: false,
  });
}

function toNumber(value) {
  if (value === null || value === undefined || value === '' || value === '-') return 0;
  const num = typeof value === 'string'
    ? parseFloat(value.replace(/[$,%\s,]/g, ''))
    : Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formHasKeys(obj, keys) {
  if (!obj || typeof obj !== 'object') return false;
  return keys.some((key) => obj[key] !== undefined && obj[key] !== null);
}

function hasPositive(obj, keys) {
  if (!obj || typeof obj !== 'object') return false;
  return keys.some((key) => toNumber(obj[key]) > 0);
}

/** Fields the budget/sales form actually edits. Ignore leftover API keys like sales_budget. */
const FORM_SALES_KEYS = [
  'budgetedSales',
  'actualSalesInStore',
  'actualSalesAppOnline',
  'actualSalesOnline',
  'netSalesActual',
  'dailyTickets',
];

const SAVED_SALES_KEYS = [
  'sales_budget',
  'actual_sales_in_store',
  'actual_sales_app_online',
  'actual_sales_online',
  'net_sales_actual',
  'daily_tickets',
  'sales_actual',
];

const FORM_LABOR_KEYS = [
  'laborHoursBudget',
  'laborHoursActual',
  'budgetedLaborDollars',
  'actualLaborDollars',
];

const SAVED_LABOR_ACTUAL_KEYS = [
  'labor_hours_actual',
  'actual_labor_dollars',
];

const FORM_COGS_KEYS = [
  'budget',
  'actual',
];

const SAVED_COGS_ACTUAL_KEYS = [
  'cogs_actual',
];

function hasFormProviderSales(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.entries(obj).some(([key, value]) => {
    if (key.startsWith('actualSales')) {
      return toNumber(value) > 0;
    }
    return false;
  });
}

function hasSavedProviderSales(obj) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.entries(obj).some(([key, value]) => {
    if (key.startsWith('actual_sales_')) {
      return toNumber(value) > 0;
    }
    return false;
  });
}

function hasThirdPartySales(obj) {
  const nested = obj?.third_party_sales;
  if (!nested || typeof nested !== 'object') return false;
  return Object.values(nested).some((value) => toNumber(value) > 0);
}

function hasFormSalesData(day) {
  return hasPositive(day, FORM_SALES_KEYS) || hasFormProviderSales(day);
}

function hasSavedSalesData(source) {
  return (
    hasPositive(source, SAVED_SALES_KEYS) ||
    hasPositive(source, FORM_SALES_KEYS) ||
    hasSavedProviderSales(source) ||
    hasFormProviderSales(source) ||
    hasThirdPartySales(source)
  );
}

/**
 * True when a day currently has sales, labor, or COGS amounts.
 * Editable form fields win over previously saved API values, so typing 0
 * after a save unlocks the closed toggle.
 */
export function dayHasExistingOperatingData(day = {}, dashboardData = null) {
  const dateKey = normalizeCloseOutDate(day?.date);
  const dashboardEntry = getDailyEntryForDate(dashboardData, dateKey);
  const salesPerf = dashboardEntry?.['Sales Performance'];
  const laborPerf = dashboardEntry?.['Labor Performance'];
  const cogsPerf = dashboardEntry?.['COGS Performance'];

  const formHasSales = formHasKeys(day, FORM_SALES_KEYS) || hasFormProviderSales(day);
  if (formHasSales) {
    if (hasFormSalesData(day)) return true;
  } else if (hasSavedSalesData(dashboardEntry) || hasSavedSalesData(salesPerf)) {
    return true;
  }

  const formHasLabor = formHasKeys(day, FORM_LABOR_KEYS);
  if (formHasLabor) {
    if (hasPositive(day, FORM_LABOR_KEYS)) return true;
  } else if (
    hasPositive(laborPerf, SAVED_LABOR_ACTUAL_KEYS) ||
    hasPositive(dashboardEntry, SAVED_LABOR_ACTUAL_KEYS)
  ) {
    return true;
  }

  const formHasCogs = formHasKeys(day, FORM_COGS_KEYS);
  if (formHasCogs) {
    if (hasPositive(day, FORM_COGS_KEYS)) return true;
  } else if (
    hasPositive(cogsPerf, SAVED_COGS_ACTUAL_KEYS) ||
    hasPositive(dashboardEntry, SAVED_COGS_ACTUAL_KEYS)
  ) {
    return true;
  }

  return false;
}

export function isDayCurrentlyOpen(day = {}) {
  const value = day.restaurant_open ?? day.restaurantOpen;
  if (typeof value === 'boolean') return value;
  if (value === 0 || value === '0' || value === false) return false;
  return value !== 0 && value !== false;
}

export function canMarkDayClosed(day = {}, dashboardData = null) {
  if (!dayHasExistingOperatingData(day, dashboardData)) {
    return { allowed: true, message: '' };
  }
  return { allowed: false, message: CANNOT_CLOSE_DAY_WITH_DATA_MESSAGE };
}
