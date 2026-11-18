/**
 * Client-side franchise read-only viewing context.
 * Backend enforces read-only; this drives UI switcher + write CTA hiding.
 *
 * Invite return URL must live in localStorage: login/set-password call
 * sessionStorage.clear() and would wipe a session-only return path.
 */

const INVITE_RETURN_KEY = 'franchise_invite_return';

export const setFranchiseInviteReturn = (path) => {
  if (!path || !String(path).startsWith('/franchise/invite/')) return;
  try {
    localStorage.setItem(INVITE_RETURN_KEY, path);
    sessionStorage.setItem(INVITE_RETURN_KEY, path);
  } catch (_) {
    /* ignore */
  }
};

export const getFranchiseInviteReturn = () => {
  try {
    const fromLocal = localStorage.getItem(INVITE_RETURN_KEY);
    if (fromLocal && fromLocal.startsWith('/franchise/invite/')) return fromLocal;
  } catch (_) {
    /* ignore */
  }
  try {
    const fromSession = sessionStorage.getItem(INVITE_RETURN_KEY);
    if (fromSession && fromSession.startsWith('/franchise/invite/')) return fromSession;
  } catch (_) {
    /* ignore */
  }
  return null;
};

export const clearFranchiseInviteReturn = () => {
  try {
    localStorage.removeItem(INVITE_RETURN_KEY);
  } catch (_) {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(INVITE_RETURN_KEY);
  } catch (_) {
    /* ignore */
  }
};

export const getFranchiseHomeRestaurantId = () => {
  try {
    return localStorage.getItem('franchise_home_restaurant_id');
  } catch {
    return null;
  }
};

export const isFranchiseReadOnlyView = () => {
  try {
    return localStorage.getItem('franchise_view_readonly') === 'true';
  } catch {
    return false;
  }
};

export const enterFranchiseReadOnlyView = ({
  homeRestaurantId,
  franchiseeRestaurantId,
  label,
}) => {
  const home =
    homeRestaurantId ||
    localStorage.getItem('franchise_home_restaurant_id') ||
    localStorage.getItem('restaurant_id');
  if (home) {
    localStorage.setItem('franchise_home_restaurant_id', String(home));
  }
  localStorage.setItem('franchise_view_readonly', 'true');
  if (label) {
    localStorage.setItem('franchise_view_label', label);
  }
  if (franchiseeRestaurantId) {
    localStorage.setItem('restaurant_id', String(franchiseeRestaurantId));
  }
  window.dispatchEvent(new Event('franchise-view-changed'));
};

export const exitFranchiseReadOnlyView = () => {
  const home = localStorage.getItem('franchise_home_restaurant_id');
  localStorage.removeItem('franchise_view_readonly');
  localStorage.removeItem('franchise_view_label');
  if (home) {
    localStorage.setItem('restaurant_id', String(home));
  }
  localStorage.removeItem('franchise_home_restaurant_id');
  window.dispatchEvent(new Event('franchise-view-changed'));
};

export const getFranchiseViewLabel = () => {
  try {
    return localStorage.getItem('franchise_view_label') || 'Franchisee location';
  } catch {
    return 'Franchisee location';
  }
};
