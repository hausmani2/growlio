export const RESTAURANT_ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  LEADER: 'leader',
};

export const normalizeRestaurantRole = (role) => {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === RESTAURANT_ROLES.OWNER) return RESTAURANT_ROLES.OWNER;
  if (normalized === RESTAURANT_ROLES.MANAGER) return RESTAURANT_ROLES.MANAGER;
  if (normalized === RESTAURANT_ROLES.LEADER) return RESTAURANT_ROLES.LEADER;
  return RESTAURANT_ROLES.LEADER;
};

export const getRolePermissions = (role) => {
  const normalizedRole = normalizeRestaurantRole(role);

  return {
    role: normalizedRole,
    isOwner: normalizedRole === RESTAURANT_ROLES.OWNER,
    isManager: normalizedRole === RESTAURANT_ROLES.MANAGER,
    isLeader: normalizedRole === RESTAURANT_ROLES.LEADER,
    canManageLocations: normalizedRole === RESTAURANT_ROLES.OWNER,
    canManageUsers: normalizedRole === RESTAURANT_ROLES.OWNER,
    canCreateBudget: [RESTAURANT_ROLES.OWNER, RESTAURANT_ROLES.MANAGER].includes(normalizedRole),
    canViewBudget: true,
    canCloseDays: true,
    canAccessSimulator: [RESTAURANT_ROLES.OWNER, RESTAURANT_ROLES.MANAGER].includes(normalizedRole),
    canAccessReportCard: normalizedRole === RESTAURANT_ROLES.OWNER,
  };
};

export const getRoleLandingRoute = (role) =>
  getRolePermissions(role).canAccessReportCard
    ? '/dashboard/report-card'
    : '/dashboard';

/**
 * Resolve role from login/profile payload: restaurant_memberships[].
 * Matches current restaurant + location when possible, else first membership.
 */
export const resolveRoleFromMemberships = (user, restaurantId = null, locationId = null) => {
  if (!user || !Array.isArray(user.restaurant_memberships) || user.restaurant_memberships.length === 0) {
    return null;
  }

  const rid =
    restaurantId ??
    (typeof localStorage !== 'undefined' ? localStorage.getItem('restaurant_id') : null);
  const lid =
    locationId ??
    (typeof localStorage !== 'undefined' ? localStorage.getItem('selected_location_id') : null);

  let membership = null;
  if (rid && lid) {
    membership = user.restaurant_memberships.find(
      (m) =>
        String(m.restaurant_id) === String(rid) && String(m.location_id) === String(lid)
    );
  }
  if (!membership && rid) {
    membership = user.restaurant_memberships.find(
      (m) => String(m.restaurant_id) === String(rid)
    );
  }
  if (!membership) {
    membership = user.restaurant_memberships[0];
  }

  return membership?.role ? normalizeRestaurantRole(membership.role) : null;
};

/** Attach restaurant_role from memberships so UI does not wait on a second API. */
export const enrichUserWithRestaurantRole = (user, restaurantId = null, locationId = null) => {
  if (!user || typeof user !== 'object') return user;

  const fromMembership = resolveRoleFromMemberships(user, restaurantId, locationId);
  const role = user.restaurant_role
    ? normalizeRestaurantRole(user.restaurant_role)
    : fromMembership;

  if (!role) return user;

  return {
    ...user,
    restaurant_role: role,
  };
};
