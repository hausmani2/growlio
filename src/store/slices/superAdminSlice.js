import { apiGet, apiPost } from '../../utils/axiosInterceptors';
import { 
  isImpersonating, 
  getImpersonatedUser, 
  getImpersonatedUserData, 
  getImpersonationMessage,
  storeImpersonationData,
  storeOriginalSuperAdminData,
  clearImpersonationData,
  clearOriginalSuperAdminTokens,
  restoreSuperAdminToken,
  withSuperAdminToken,
  withSuperAdminTokenForImpersonation
} from '../../utils/tokenManager';

const createSuperAdminSlice = (set, get) => {
  return {
    name: 'superAdmin',
    dashboardStats: {
      totalUsers: 0,
      totalRestaurants: 0,
      totalRevenue: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
      totalAdmins: 0,
      totalSuperusers: 0,
      platformHealth: 98.5
    },
    userAnalytics: {
      roleStats: { users: 0, admins: 0, superusers: 0 },
      statusStats: { active: 0, inactive: 0 },
      monthlyStats: []
    },
    analyticsData: {
      posProviders: [],
      userLocations: { countries: [], states: [] },
      franchiseData: { franchise: 0, independent: 0 },
      restaurantTypes: [],
      menuTypes: [],
      locationCounts: []
    },
    recentUsers: [],
    recentRestaurants: [],
    allUsers: [],
    usersTotal: 0,
    dashboardData: null,
    loading: false,
    error: null,

    // Fetch dashboard statistics
    fetchDashboardStats: async () => {
      set(() => ({ loading: true, error: null }));
      
      try {
        const response = await apiGet('/admin_access/dashboard/');
        
        set(() => ({ 
          dashboardStats: {
            totalUsers: response.data.user_role_stats.total_users,
            totalRestaurants: response.data.locations_per_user.reduce((sum, user) => sum + user.total_restaurants, 0),
            totalLocations: response.data.locations_per_user.reduce((sum, user) => sum + user.total_locations, 0),
            activeUsers: response.data.user_role_stats.total_users,
            newUsersThisMonth: 0, // Not provided in API
            totalAdmins: response.data.user_role_stats.admin,
            totalSuperusers: response.data.user_role_stats.superadmins,
            platformHealth: 98.5 // Not provided in API
          },
          dashboardData: response.data,
          loading: false,
          error: null 
        }));
        
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        const errorMessage = error.response?.data?.message || 'Failed to fetch dashboard stats';
        set(() => ({ 
          loading: false, 
          error: errorMessage 
        }));
        return { success: false, error: errorMessage };
      }
    },

    // SuperAdmin login via dedicated endpoint
    superAdminLogin: async (credentials) => {
      set(() => ({ loading: true, error: null }));
      try {
        const response = await apiPost('/authentication/superadmin-login/', credentials);

        // Support both { data: { access, ...user } } and flat { access, ...user }
        const { access, refresh, ...userData } = response.data?.data || response.data || {};

        if (!access) {
          throw new Error('No authentication token received');
        }

        // Persist token and user in localStorage for cross-tab sync and sessionStorage for backward compatibility
        try {
          localStorage.setItem('token', access);
          localStorage.setItem('user', JSON.stringify(userData));
          sessionStorage.setItem('token', access);
          sessionStorage.setItem('user', JSON.stringify(userData));
          
          // Dispatch custom event to notify other tabs/windows in same origin
          window.dispatchEvent(new Event('auth-storage-change'));
        } catch {}

        // Update global auth state from here to avoid waiting for other actions
        set(() => ({
          user: userData,
          token: access,
          activeToken: access,
          isAuthenticated: true,
          loading: false,
          error: null,
        }));

        return { success: true, data: response.data };
      } catch (error) {
        const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error.message || 'SuperAdmin login failed';
        set(() => ({ loading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },

    // Fetch all users for user management
    fetchAllUsers: async (page = 1, limit = 50) => {
      set(() => ({ loading: true, error: null }));
      
      try {
        // The axios interceptor will automatically use the correct token
        const response = await apiGet(`/authentication/users/?page=${page}&limit=${limit}&ordering=-created_date`);
        
        set(() => ({ 
          allUsers: response.data.results || response.data,
          usersTotal: response.data.count || response.data.length,
          loading: false,
          error: null 
        }));
        
        return { success: true, data: response.data.results || response.data };
      } catch (error) {
        console.error('Error fetching all users:', error);
        const errorMessage = error.response?.data?.message || 'Failed to fetch users';
        set(() => ({ 
          loading: false, 
          error: errorMessage 
        }));
        return { success: false, error: errorMessage };
      }
    },

    // Fetch recent users
    fetchRecentUsers: async (limit = 5) => {
      set(() => ({ loading: true, error: null }));
      
      try {
        // The axios interceptor will automatically use the correct token
        const response = await apiGet(`/authentication/users/?limit=${limit}&ordering=-created_date`);
        
        set(() => ({ 
          recentUsers: response.data,
          loading: false,
          error: null 
        }));
        
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Error fetching recent users:', error);
        const errorMessage = error.response?.data?.message || 'Failed to fetch recent users';
        set(() => ({ 
          loading: false, 
          error: errorMessage 
        }));
        return { success: false, error: errorMessage };
      }
    },

    // Start impersonation (alias for impersonateUser)
    startImpersonation: async (userId) => {
      // First fetch user data by ID, then impersonate by email
      try {
        const userResponse = await apiGet(`/authentication/users/${userId}/`);
        const userEmail = userResponse.data.email;
        
        // Call impersonateUser and handle the result
        const result = await get().impersonateUser(userEmail);
        
        // If successful, the redirect will happen in impersonateUser
        // If failed, return the error without redirect
        return result;
      } catch (error) {
        console.error('Error fetching user for impersonation:', error);
        return { success: false, error: 'Failed to fetch user data' };
      }
    },

    // Switch to different user (when already impersonating)
    switchImpersonation: async (userId) => {
      try {
        // First fetch user data by ID using super admin token
        const userResponse = await apiGet(`/authentication/users/${userId}/`);
        const userEmail = userResponse.data.email;
        
        // Call impersonation API with super admin token
        const response = await withSuperAdminTokenForImpersonation(async () => {
          return await apiPost('/admin_access/impersonate/', { email: userEmail });
        });
        
        // Check if API call was successful (status 200-299) and has valid data
        if (!response || response.status < 200 || response.status >= 300 || 
            !response.data || !response.data.access || !response.data.impersonated_user) {
          const errorMessage = response?.data?.message || response?.data?.error || 'API failed - cannot switch impersonation';
          return { success: false, error: errorMessage };
        }
        
        // Update impersonation data with new user
        storeImpersonationData(response.data);
        
        // Clear chat conversation ID when switching impersonation (each user should have their own conversations)
        const currentState = get();
        if (currentState.clearSelectedConversation) {
          currentState.clearSelectedConversation();
        }
        sessionStorage.removeItem('chat_conversation_id');
        
        // Update the main token to new impersonation token in both sessionStorage and localStorage
        sessionStorage.setItem('token', response.data.access);
        try {
          localStorage.setItem('token', response.data.access);
          localStorage.setItem('user', JSON.stringify(response.data.impersonated_user));
        } catch (error) {
          console.warn('Failed to store token in localStorage:', error);
        }
        
        // IMPORTANT: Ensure original super admin token is preserved
        const originalSuperadminToken = sessionStorage.getItem('original_superadmin_token');
        if (!originalSuperadminToken) {
          const mainToken = sessionStorage.getItem('token');
          if (currentState.user && mainToken) {
            const userWithToken = {
              ...currentState.user,
              access: currentState.user.access || mainToken,
              refresh: currentState.user.refresh || sessionStorage.getItem('refresh_token') || mainToken
            };
            storeOriginalSuperAdminData(userWithToken);
          }
        }
        
        // Update the auth state with new impersonated user data
        if (currentState.setUser) {
          currentState.setUser({
            ...response.data.impersonated_user,
            access: response.data.access,
            refresh: response.data.refresh,
            is_impersonated: true,
            original_superadmin: currentState.user?.email
          });
        }
        
        // Fetch new user's restaurant information
        try {
          const restaurantResponse = await apiGet('/restaurant/restaurants-onboarding/');
          if (restaurantResponse.data?.restaurants?.length > 0) {
            const userRestaurant = restaurantResponse.data.restaurants[0];
            if (userRestaurant.restaurant_id) {
              localStorage.setItem('restaurant_id', userRestaurant.restaurant_id.toString());
            }
          }
        } catch (error) {
          console.error('Error fetching restaurant data:', error);
        }
        
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Error switching impersonation:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to switch impersonation';
        return { success: false, error: errorMessage };
      }
    },

    // Impersonate user
    impersonateUser: async (email) => {
      set(() => ({ loading: true, error: null }));
      
      try {
        // Call impersonation API with super admin token
        const response = await withSuperAdminTokenForImpersonation(async () => {
          return await apiPost('/admin_access/impersonate/', { email });
        });
        
        // Check if API call was successful (status 200-299)
        if (!response || response.status < 200 || response.status >= 300) {
          const errorMessage = 'API failed - cannot impersonate user';
          set(() => ({ 
            loading: false, 
            error: errorMessage 
          }));
          return { success: false, error: errorMessage };
        }
        
        set(() => ({ 
          loading: false,
          error: null 
        }));
        
        // Store original super admin data first (if not already stored)
        const currentState = get();
        const mainToken = sessionStorage.getItem('token');
        
        // Always store original super admin data - use main token if user doesn't have one
        if (currentState.user) {
          // Ensure user has access token, use main token if not available
          const userWithToken = {
            ...currentState.user,
            access: currentState.user.access || mainToken,
            refresh: currentState.user.refresh || sessionStorage.getItem('refresh_token') || mainToken
          };
          storeOriginalSuperAdminData(userWithToken);
        }
        
        // Store impersonation data using the token manager
        storeImpersonationData(response.data);
        
        // Clear chat conversation ID when impersonating (each user should have their own conversations)
        if (currentState.clearSelectedConversation) {
          currentState.clearSelectedConversation();
        }
        sessionStorage.removeItem('chat_conversation_id');
        
        // Fetch impersonated user's restaurant information
        try {
          const restaurantResponse = await apiGet('/restaurant/restaurants-onboarding/');
          if (restaurantResponse.data?.restaurants?.length > 0) {
            const userRestaurant = restaurantResponse.data.restaurants[0];
            if (userRestaurant.restaurant_id) {
              localStorage.setItem('restaurant_id', userRestaurant.restaurant_id.toString());
            }
          }
        } catch (error) {
        }
        
        // Update the auth state with impersonated user data
        if (currentState.setUser) {
          currentState.setUser({
            ...response.data.impersonated_user,
            access: response.data.access,
            refresh: response.data.refresh,
            is_impersonated: true,
            original_superadmin: currentState.user?.email // Store original superadmin
          });
        }
        
        // Store original superadmin data for when we stop impersonation
        // (This is now handled by storeOriginalSuperAdminData above)
        
        // Only redirect if we have valid response data AND the API call was successful
        if (response && response.status >= 200 && response.status < 300 && 
            response.data && response.data.access && response.data.impersonated_user) {
          // Redirect to dashboard as the impersonated user
          window.location.href = '/dashboard';
          return { success: true, data: response.data };
        } else {
          // If response data is invalid or API failed, treat as error
          const errorMessage = response?.data?.message || response?.data?.error || 'API failed - cannot impersonate user';
          set(() => ({ 
            loading: false, 
            error: errorMessage 
          }));
          return { success: false, error: errorMessage };
        }
      } catch (error) {
        console.error('Error impersonating user:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'API failed - cannot impersonate user';
        set(() => ({ 
          loading: false, 
          error: errorMessage 
        }));
        // DO NOT redirect on error - let the UI handle the error display
        return { success: false, error: errorMessage };
      }
    },

    // Stop impersonation
    stopImpersonation: async () => {
      try {
        
        // Get original super admin data before clearing anything
        const originalSuperadmin = sessionStorage.getItem('original_superadmin');
        const originalSuperadminToken = sessionStorage.getItem('original_superadmin_token');
        const originalSuperadminRefresh = sessionStorage.getItem('original_superadmin_refresh');
        const originalRestaurantId = sessionStorage.getItem('original_restaurant_id');
        
        // Clear ONLY impersonation data (keep super admin tokens safe)
        clearImpersonationData();
        
        // Restore the main token to super admin token in both sessionStorage and localStorage
        if (originalSuperadminToken) {
          sessionStorage.setItem('token', originalSuperadminToken);
          try {
            localStorage.setItem('token', originalSuperadminToken);
          } catch (error) {
            console.warn('Failed to restore token in localStorage:', error);
          }
        }
        
        // Restore the original restaurant_id
        if (originalRestaurantId) {
          localStorage.setItem('restaurant_id', originalRestaurantId);
        }
        
        // Clear chat conversation ID when stopping impersonation (super admin should have their own conversations)
        const currentState = get();
        if (currentState.clearSelectedConversation) {
          currentState.clearSelectedConversation();
        }
        sessionStorage.removeItem('chat_conversation_id');
        
        // Restore original super admin user data
        if (originalSuperadmin && originalSuperadminToken) {
          try {
            const originalUser = JSON.parse(originalSuperadmin);
            
            // Store user data in localStorage for cross-tab sync
            try {
              localStorage.setItem('user', JSON.stringify(originalUser));
            } catch (error) {
              console.warn('Failed to store user in localStorage:', error);
            }
            
            // Update auth state in store directly
            set(() => ({
              user: originalUser,
              token: originalSuperadminToken,
              activeToken: originalSuperadminToken,
              isAuthenticated: true,
              isImpersonatingSession: false,
              impersonatorId: null,
              originalToken: null,
            }));
          } catch (parseError) {
            console.error('Error parsing original superadmin data:', parseError);
          }
        } else {
          // If we don't have original superadmin data, at least ensure token is set
          if (originalSuperadminToken) {
            set(() => ({
              token: originalSuperadminToken,
              activeToken: originalSuperadminToken,
              isAuthenticated: true,
              isImpersonatingSession: false,
            }));
          }
        }
        
        // Clear the stored original superadmin tokens (they're now restored)
        clearOriginalSuperAdminTokens();
        
        // Dispatch custom event to notify other tabs about auth change
        window.dispatchEvent(new Event('auth-storage-change'));
        
        // Redirect to superadmin dashboard
        window.location.href = '/superadmin/dashboard';
        
        return { success: true };
      } catch (error) {
        console.error('❌ Error stopping impersonation:', error);
        return { success: false, error: 'Failed to stop impersonation' };
      }
    },

    // Check if currently impersonating
    isImpersonating,

    // Get impersonated user email
    getImpersonatedUser,

    // Get impersonated user data
    getImpersonatedUserData,

    // Get impersonation message
    getImpersonationMessage,

    // Clear error state
    clearError: () => {
      set(() => ({ error: null }));
    },

    // Clear superadmin state
    clearSuperAdmin: () => {
      set(() => ({
        dashboardStats: {
          totalUsers: 0,
          totalRestaurants: 0,
          totalRevenue: 0,
          activeUsers: 0,
          newUsersThisMonth: 0,
          totalAdmins: 0,
          totalSuperusers: 0,
          platformHealth: 98.5
        },
        userAnalytics: {
          roleStats: { users: 0, admins: 0, superusers: 0 },
          statusStats: { active: 0, inactive: 0 },
          monthlyStats: []
        },
        analyticsData: {
          posProviders: [],
          userLocations: { countries: [], states: [] },
          franchiseData: { franchise: 0, independent: 0 },
          restaurantTypes: [],
          menuTypes: [],
          locationCounts: []
        },
        recentUsers: [],
        recentRestaurants: [],
        loading: false,
        error: null
      }));
    }
  };
};

export default createSuperAdminSlice;
