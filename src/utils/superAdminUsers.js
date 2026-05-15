export const normalizeSuperAdminUsersResponse = (payload) => {
  if (Array.isArray(payload)) return { users: payload, total: payload.length };

  if (Array.isArray(payload?.restaurants)) {
    const linkedUsers = payload.restaurants.flatMap((item) => {
      const restaurant = item?.restaurant || {};
      const plan = restaurant?.plan || {};
      const withRestaurantMeta = (user, sourceRole) => user ? ({
        ...user,
        id: user.id ?? `${restaurant.id}-${user.email || sourceRole}`,
        role: user.role || sourceRole,
        restaurant_member_role: sourceRole,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        plan_key: plan.key,
        plan_display_name: plan.display_name,
      }) : null;

      return [
        withRestaurantMeta(item?.owner, item?.owner?.role || 'OWNER'),
        ...(Array.isArray(item?.members)
          ? item.members.map((member) => withRestaurantMeta(member?.user || member, member?.role || member?.user?.role || 'MEMBER'))
          : []),
      ].filter(Boolean);
    });

    const unlinkedUsers = Array.isArray(payload?.users_not_linked_to_restaurant)
      ? payload.users_not_linked_to_restaurant.map((user) => ({
          ...user,
          restaurant_name: '-',
          plan_key: 'unlinked',
          plan_display_name: 'No Restaurant',
        }))
      : [];

    const users = [...linkedUsers, ...unlinkedUsers];

    return {
      users,
      total: Number(payload?.count ?? payload?.total ?? users.length) || 0,
    };
  }

  const users =
    (Array.isArray(payload?.results) && payload.results) ||
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload?.users) && payload.users) ||
    [];

  return {
    users,
    total: Number(payload?.count ?? payload?.total ?? users.length) || 0,
  };
};
