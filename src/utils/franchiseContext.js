/**
 * Client-side franchise read-only viewing context.
 * Backend enforces read-only; this drives UI switcher + write CTA hiding.
 */

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
