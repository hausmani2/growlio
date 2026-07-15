import { Modal, message } from 'antd';
import { clearImpersonationData } from './tokenManager';

/** Known app keys that must not survive logout / account switch. */
const LOCAL_STORAGE_KEYS = [
  'token',
  'user',
  'refresh_token',
  'restaurant_id',
  'simulation_restaurant_id',
  'selected_location_id',
  'growlio-store',
  'dashboardNavigationContext',
  'budgetedSalesData',
  'pendingCogsModal',
  'pendingLaborModal',
  'original_superadmin_token',
  'original_superadmin_refresh',
  'original_superadmin',
  'original_restaurant_id',
  'impersonation_access_token',
  'impersonation_refresh_token',
  'impersonated_user',
  'impersonated_user_data',
  'impersonation_message',
];

/**
 * Best-effort clear of document cookies for this host.
 * HttpOnly cookies can only be cleared by the server; this removes JS-readable ones.
 */
export const clearBrowserCookies = () => {
  try {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    const hostname = window.location.hostname;
    const expire = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';

    cookies.forEach((cookie) => {
      const eqPos = cookie.indexOf('=');
      const name = (eqPos > -1 ? cookie.slice(0, eqPos) : cookie).trim();
      if (!name) return;

      document.cookie = `${name}=;${expire};path=/`;
      document.cookie = `${name}=;${expire};path=/;SameSite=Lax`;
      if (hostname) {
        document.cookie = `${name}=;${expire};path=/;domain=${hostname}`;
        document.cookie = `${name}=;${expire};path=/;domain=.${hostname}`;
      }
    });
  } catch (_) {
    // ignore
  }
};

/**
 * Clear localStorage + sessionStorage + cookies + open Ant Design overlays.
 * Does NOT touch the Zustand in-memory store — callers should reset that separately.
 */
export const clearClientSessionStorage = () => {
  LOCAL_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (_) {
      // ignore
    }
  });

  // Sweep leftover growlio / setup-gate keys
  try {
    const extraKeys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('growlio') ||
          key.startsWith('setup_required_modal') ||
          key.includes('onboarding') ||
          key.includes('simulation'))
      ) {
        extraKeys.push(key);
      }
    }
    extraKeys.forEach((key) => localStorage.removeItem(key));
  } catch (_) {
    // ignore
  }

  try {
    sessionStorage.clear();
  } catch (_) {
    // ignore
  }

  clearBrowserCookies();

  try {
    clearImpersonationData();
  } catch (_) {
    // ignore
  }

  try {
    Modal.destroyAll();
  } catch (_) {
    // ignore
  }

  try {
    message.destroy();
  } catch (_) {
    // ignore
  }
};
