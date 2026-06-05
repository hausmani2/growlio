import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../utils/axiosInterceptors';
import useStore from '../store/store';
import { RESTAURANT_ROLES, getRolePermissions, normalizeRestaurantRole } from '../utils/rolePermissions';

const useRestaurantRole = () => {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const selectedLocationId = useStore((state) => state.selectedLocationId);
  const [members, setMembers] = useState([]);

  const restaurantId = localStorage.getItem('restaurant_id');
  const [loading, setLoading] = useState(!!restaurantId);
  const storedRole = user?.restaurant_role || user?.role;

  useEffect(() => {
    let cancelled = false;

    const fetchRole = async () => {
      if (!restaurantId || !selectedLocationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiGet(
          `/restaurant_v2/members/?restaurant_id=${restaurantId}&location_id=${selectedLocationId}`
        );
        const memberList = Array.isArray(response.data) ? response.data : response.data?.data || [];

        if (cancelled) return;
        setMembers(memberList);

        const currentMember = memberList.find((member) => {
          const sameEmail = user?.email && member?.email && String(member.email).toLowerCase() === String(user.email).toLowerCase();
          const sameUserId = user?.id && member?.user_id && String(member.user_id) === String(user.id);
          return sameEmail || sameUserId;
        });

        const ownerAtAnyLocation = (user?.restaurant_memberships || []).some(
          (membership) =>
            String(membership.restaurant_id) === String(restaurantId) &&
            normalizeRestaurantRole(membership.role) === RESTAURANT_ROLES.OWNER
        );

        const resolvedRole = currentMember?.role
          ? normalizeRestaurantRole(currentMember.role)
          : ownerAtAnyLocation
            ? RESTAURANT_ROLES.OWNER
            : null;

        if (resolvedRole) {
          setUser?.({
            restaurant_role: resolvedRole,
            role: user?.role || resolvedRole,
          });
        }
      } catch (error) {
        console.error('Failed to fetch restaurant members for role:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, [restaurantId, selectedLocationId, setUser, user?.email, user?.id, user?.role]);

  const permissions = useMemo(() => getRolePermissions(storedRole), [storedRole]);

  return {
    ...permissions,
    loading,
    members,
    restaurantId,
    locationId: selectedLocationId,
  };
};

export default useRestaurantRole;
