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
  };
};
