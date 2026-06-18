import { getMaxLocationsCap } from './packageDisplay';

export const getPlanName = (plan) =>
  String(plan?.key || plan?.name || plan?.display_name || plan?.package_name || '')
    .trim()
    .toLowerCase();

/** Hard per-plan location limits (Lite = 1, Grow = 5, Pro = unlimited). */
export const getPlanLocationCap = (plan) => {
  const cap = getMaxLocationsCap(plan);
  return cap === null ? null : cap;
};

/**
 * Effective cap for how many locations the user may have.
 * Plan limits always win for Lite/Grow so stale subscription data cannot block Grow (5).
 */
export const getEffectiveLocationCap = (pkg, restaurant = null) => {
  const planCap = getPlanLocationCap(pkg);
  if (planCap === null) {
    const allowed = restaurant?.allowed_locations;
    if (typeof allowed === 'number' && allowed > 0) return allowed;
    return 9999;
  }
  return planCap;
};

export const buildLocationSelectModel = (pkg, restaurant, existingCount = 0) => {
  const planCap = getPlanLocationCap(pkg);
  const maxSelectable = getEffectiveLocationCap(pkg, restaurant);
  const unlimited = planCap === null;
  const hardCap = 100;
  const maxDropdown = unlimited
    ? Math.max(1, Math.min(hardCap, maxSelectable, Math.max(existingCount, 1)))
    : Math.max(1, Math.min(hardCap, maxSelectable));

  const remainingAddable = Math.max(0, maxSelectable - existingCount);
  const pricePerLocation =
    typeof pkg?.price_per_location === 'number' ? pkg.price_per_location : null;

  return {
    maxDropdown,
    maxSelectable,
    allowedLocations: maxSelectable,
    planCap,
    unlimited,
    remainingAddable,
    pricePerLocation,
    actualCount: existingCount,
  };
};
