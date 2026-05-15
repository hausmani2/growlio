import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../utils/axiosInterceptors';
import useStore from '../store/store';
import { getRolePermissions, normalizeRestaurantRole } from '../utils/rolePermissions';

const useRestaurantRole = () => {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);

  const restaurantId = localStorage.getItem('restaurant_id');
  const storedRole = user?.restaurant_role || user?.role;

  useEffect(() => {
    let cancelled = false;

    const fetchRole = async () => {
      if (!restaurantId) return;

      try {
        setLoading(true);
        const response = await apiGet(`/restaurant_v2/members/?restaurant_id=${restaurantId}`);
        const memberList = Array.isArray(response.data) ? response.data : response.data?.data || [];

        if (cancelled) return;
        setMembers(memberList);

        const currentMember = memberList.find((member) => {
          const sameEmail = user?.email && member?.email && String(member.email).toLowerCase() === String(user.email).toLowerCase();
          const sameUserId = user?.id && member?.user_id && String(member.user_id) === String(user.id);
          return sameEmail || sameUserId;
        });

        if (currentMember?.role) {
          setUser?.({
            restaurant_role: normalizeRestaurantRole(currentMember.role),
            role: user?.role || currentMember.role,
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
  }, [restaurantId, setUser, user?.email, user?.id, user?.role]);

  const permissions = useMemo(() => getRolePermissions(storedRole), [storedRole]);

  return {
    ...permissions,
    loading,
    members,
    restaurantId,
  };
};

export default useRestaurantRole;
