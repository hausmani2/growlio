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

/**
 * Active restaurant for API calls. In franchisee view, always the franchisee
 * (pinned separately so onboarding/fetchRestaurantId cannot overwrite HQ back in).
 */
export const getActiveRestaurantId = () => {
  try {
    if (isFranchiseReadOnlyView()) {
      return (
        localStorage.getItem('franchise_view_restaurant_id') ||
        localStorage.getItem('restaurant_id')
      );
    }
    return localStorage.getItem('restaurant_id');
  } catch {
    return null;
  }
};

/** Re-assert franchisee restaurant_id into localStorage if something wiped it. */
export const ensureFranchiseRestaurantIdPersisted = () => {
  if (!isFranchiseReadOnlyView()) return null;
  const franchiseeId = localStorage.getItem('franchise_view_restaurant_id');
  if (franchiseeId) {
    localStorage.setItem('restaurant_id', String(franchiseeId));
  }
  return franchiseeId || localStorage.getItem('restaurant_id');
};

/**
 * Persist a location that belongs to the franchisee restaurant.
 * Call after fetching franchisee locations.
 */
export const setFranchiseViewLocationId = (locationId) => {
  if (locationId == null) return;
  localStorage.setItem('franchise_view_location_id', String(locationId));
  localStorage.setItem('selected_location_id', String(locationId));
};

export const getFranchiseViewLocationId = () => {
  try {
    return localStorage.getItem('franchise_view_location_id');
  } catch {
    return null;
  }
};

/**
 * Write restaurant_id only when NOT viewing a franchisee.
 * Prevents HQ onboarding flows from stomping franchisee context.
 */
export const setRestaurantIdUnlessFranchiseView = (id) => {
  if (id == null || id === '') return false;
  if (isFranchiseReadOnlyView()) {
    ensureFranchiseRestaurantIdPersisted();
    return false;
  }
  localStorage.setItem('restaurant_id', String(id));
  return true;
};

export const enterFranchiseReadOnlyView = ({
  homeRestaurantId,
  franchiseeRestaurantId,
  label,
  homeLocationId = null,
}) => {
  const home =
    homeRestaurantId ||
    localStorage.getItem('franchise_home_restaurant_id') ||
    localStorage.getItem('restaurant_id');
  if (home) {
    localStorage.setItem('franchise_home_restaurant_id', String(home));
  }
  // Preserve HQ location once (do not overwrite with a franchisee location).
  if (!localStorage.getItem('franchise_home_location_id')) {
    const hqLocationId =
      homeLocationId || localStorage.getItem('selected_location_id');
    if (hqLocationId) {
      localStorage.setItem('franchise_home_location_id', String(hqLocationId));
    }
  }
  localStorage.removeItem('selected_location_id');
  localStorage.removeItem('franchise_view_location_id');

  localStorage.setItem('franchise_view_readonly', 'true');
  if (label) {
    localStorage.setItem('franchise_view_label', label);
  }
  if (franchiseeRestaurantId) {
    localStorage.setItem('franchise_view_restaurant_id', String(franchiseeRestaurantId));
    localStorage.setItem('restaurant_id', String(franchiseeRestaurantId));
  }
  window.dispatchEvent(new Event('franchise-view-changed'));
};

/**
 * Leave franchisee view and restore HQ restaurant + location into localStorage.
 * Returns restored ids so callers can sync Zustand before reload.
 */
export const exitFranchiseReadOnlyView = () => {
  const home = localStorage.getItem('franchise_home_restaurant_id');
  const homeLocationId = localStorage.getItem('franchise_home_location_id');

  localStorage.removeItem('franchise_view_readonly');
  localStorage.removeItem('franchise_view_label');
  localStorage.removeItem('franchise_view_restaurant_id');
  localStorage.removeItem('franchise_view_location_id');
  localStorage.removeItem('franchise_home_location_id');
  localStorage.removeItem('franchise_home_restaurant_id');

  // Always clear franchisee location first — never leave it paired with HQ.
  localStorage.removeItem('selected_location_id');

  if (home) {
    localStorage.setItem('restaurant_id', String(home));
  }
  if (homeLocationId) {
    localStorage.setItem('selected_location_id', String(homeLocationId));
  }

  window.dispatchEvent(new Event('franchise-view-changed'));
  return {
    restaurantId: home ? String(home) : localStorage.getItem('restaurant_id'),
    locationId: homeLocationId ? String(homeLocationId) : null,
  };
};

/**
 * Ensure selected_location_id belongs to the active restaurant_id.
 * Fixes HQ↔franchisee mismatches after Back to HQ / persist rehydrate.
 */
export const alignSelectedLocationToRestaurant = async ({
  fetchLocations,
  setSelectedLocationId,
  clearLocationScopedCaches,
  preferredLocationId = null,
} = {}) => {
  const restaurantId = isFranchiseReadOnlyView()
    ? ensureFranchiseRestaurantIdPersisted()
    : localStorage.getItem('restaurant_id');
  if (!restaurantId || typeof fetchLocations !== 'function') {
    return { restaurantId: restaurantId || null, locationId: null, locations: [] };
  }

  const locations = (await fetchLocations(restaurantId, true)) || [];
  const preferred =
    preferredLocationId ||
    (isFranchiseReadOnlyView()
      ? getFranchiseViewLocationId()
      : localStorage.getItem('selected_location_id'));

  const preferredOk =
    preferred && locations.some((loc) => String(loc.id) === String(preferred));
  const nextId = preferredOk
    ? Number(preferred)
    : locations[0]?.id != null
      ? Number(locations[0].id)
      : null;

  if (typeof setSelectedLocationId === 'function') {
    setSelectedLocationId(nextId);
  } else if (nextId != null) {
    localStorage.setItem('selected_location_id', String(nextId));
  } else {
    localStorage.removeItem('selected_location_id');
  }

  if (isFranchiseReadOnlyView() && nextId != null) {
    setFranchiseViewLocationId(nextId);
  }

  if (typeof clearLocationScopedCaches === 'function') {
    clearLocationScopedCaches();
  }

  return { restaurantId: String(restaurantId), locationId: nextId, locations };
};

export const getFranchiseViewLabel = () => {
  try {
    return localStorage.getItem('franchise_view_label') || 'Franchisee location';
  } catch {
    return 'Franchisee location';
  }
};
