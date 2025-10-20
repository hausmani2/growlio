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

        // Persist token and user in session storage
        try {
          sessionStorage.setItem('token', access);
          sessionStorage.setItem('user', JSON.stringify(userData));
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

    // Fetch user analytics
    fetchUserAnalytics: async () => {
      set(() => ({ loading: true, error: null }));
      
      try {
        const response = await apiGet('/superadmin/analytics/users/');
        
        set(() => ({ 
          userAnalytics: response.data,
          loading: false,
          error: null 
        }));
        
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Error fetching user analytics:', error);
        const errorMessage = error.response?.data?.message || 'Failed to fetch user analytics';
        set(() => ({ 
          loading: false, 
          error: errorMessage 
        }));
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

    // Fetch recent restaurants
    fetchRecentRestaurants: async (limit = 5) => {
      set(() => ({ loading: true, error: null }));
      
      try {
        const response = await apiGet(`/restaurants/?limit=${limit}&ordering=-created_date`);
        
        set(() => ({ 
          recentRestaurants: response.data,
          loading: false,
          error: null 
        }));
        
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Error fetching recent restaurants:', error);
        const errorMessage = error.response?.data?.message || 'Failed to fetch recent restaurants';
        set(() => ({ 
          loading: false, 
          error: errorMessage 
        }));
        return { success: false, error: errorMessage };
      }
    },

    // Fetch analytics data
    fetchAnalyticsData: async () => {
      set(() => ({ loading: true, error: null }));
      
      try {
        const response = await apiGet('/superadmin/analytics/');
        
        set(() => ({ 
          analyticsData: response.data,
          loading: false,
          error: null 
        }));
        
        return { success: true, data: response.data };
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        const errorMessage = error.response?.data?.message || 'Failed to fetch analytics data';
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
        
        console.log('🔄 Switching impersonation to:', userEmail);
        
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
        
        // Update the main token to new impersonation token (session)
        sessionStorage.setItem('token', response.data.access);
        
        // IMPORTANT: Ensure original super admin token is preserved
        const originalSuperadminToken = sessionStorage.getItem('original_superadmin_token');
        if (!originalSuperadminToken) {
          console.log('⚠️ Original super admin token missing, attempting to restore...');
          const currentState = get();
          const mainToken = sessionStorage.getItem('token');
          if (currentState.user && mainToken) {
            const userWithToken = {
              ...currentState.user,
              access: currentState.user.access || mainToken,
              refresh: currentState.user.refresh || sessionStorage.getItem('refresh_token') || mainToken
            };
            storeOriginalSuperAdminData(userWithToken);
            console.log('✅ Original super admin token restored during switch');
          }
        }
        
        // Update the auth state with new impersonated user data
        const currentState = get();
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
        
        console.log('✅ Impersonation switched successfully');
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
        
        console.log('🔍 Current State Before Impersonation:', {
          hasUser: !!currentState.user,
          userEmail: currentState.user?.email,
          hasOriginalToken: !!localStorage.getItem('original_superadmin_token'),
          currentToken: mainToken?.substring(0, 20) + '...'
        });
        
        // Always store original super admin data - use main token if user doesn't have one
        if (currentState.user) {
          console.log('💾 Storing original super admin data...');
          // Ensure user has access token, use main token if not available
          const userWithToken = {
            ...currentState.user,
            access: currentState.user.access || mainToken,
            refresh: currentState.user.refresh || sessionStorage.getItem('refresh_token') || mainToken
          };
          storeOriginalSuperAdminData(userWithToken);
        } else {
          console.log('❌ No user data available to store as original super admin');
        }
        
        // Store impersonation data using the token manager
        console.log('💾 Storing impersonation data...');
        storeImpersonationData(response.data);
        
        console.log('🔍 After storing impersonation data:', {
          hasOriginalToken: !!localStorage.getItem('original_superadmin_token'),
          hasImpersonationToken: !!localStorage.getItem('impersonation_access_token'),
          mainToken: localStorage.getItem('token')?.substring(0, 20) + '...',
          impersonatedUser: localStorage.getItem('impersonated_user')
        });
        
        
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
        console.log('🛑 Stopping impersonation...');
        
        // Get original super admin data before clearing anything
        const originalSuperadmin = sessionStorage.getItem('original_superadmin');
        const originalSuperadminToken = sessionStorage.getItem('original_superadmin_token');
        const originalSuperadminRefresh = sessionStorage.getItem('original_superadmin_refresh');
        const originalRestaurantId = sessionStorage.getItem('original_restaurant_id');
        
        console.log('🔍 Original super admin data check:', {
          hasOriginalSuperadmin: !!originalSuperadmin,
          hasOriginalToken: !!originalSuperadminToken,
          hasOriginalRefresh: !!originalSuperadminRefresh,
          hasOriginalRestaurantId: !!originalRestaurantId
        });
        
        // Clear ONLY impersonation data (keep super admin tokens safe)
        clearImpersonationData();
        console.log('✅ Cleared impersonation data');
        
        // Restore the main token to super admin token
        if (originalSuperadminToken) {
          sessionStorage.setItem('token', originalSuperadminToken);
          console.log('✅ Restored main token to super admin token');
        } else {
          console.log('⚠️ No original super admin token found');
        }
        
        // Restore the original restaurant_id
        if (originalRestaurantId) {
          localStorage.setItem('restaurant_id', originalRestaurantId);
          console.log('✅ Restored original restaurant ID');
        }
        
        // Restore original super admin user data
        const currentState = get();
        if (originalSuperadmin && currentState.setUser) {
          const originalUser = JSON.parse(originalSuperadmin);
          currentState.setUser({
            ...originalUser,
            access: originalSuperadminToken || originalUser.access,
            refresh: originalSuperadminRefresh || originalUser.refresh,
            is_impersonated: false
          });
          console.log('✅ Restored super admin user data');
        } else {
          console.log('⚠️ No original super admin user data to restore');
        }
        
        // Clear the stored original superadmin tokens (they're now restored)
        clearOriginalSuperAdminTokens();
        console.log('✅ Cleared temporary original super admin tokens');
        
        // Redirect to superadmin dashboard
        console.log('🔄 Redirecting to super admin dashboard...');
        window.location.href = '/superadmin';
        
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
