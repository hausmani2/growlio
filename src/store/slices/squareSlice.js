import { apiGet, apiPost } from '../../utils/axiosInterceptors';
import { message } from 'antd';
import { parseOAuthState } from '../../utils/squareOAuth';

/**
 * Square POS Integration Slice
 * Manages Square OAuth connection, status, and integration state
 */
const appendGrowlioLocation = async (get, url) => {
  if (typeof get().appendLocationToUrl === 'function') {
    return get().appendLocationToUrl(url);
  }
  const locationId = await get().getSelectedLocationId?.();
  if (!locationId) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}location_id=${locationId}`;
};

const createSquareSlice = (set, get) => ({
  name: 'square',
  
  // Square connection state
  squareLoading: false,
  squareError: null,
  squareStatus: null, // 'disconnected' | 'connected' | 'connecting' | 'erro"
  squareConnectionData: null,
  squareMerchantDetail: null,
  merchantDetailLoading: false,
  lastStatusCheck: null,

  // Square sync state (pull latest sales/labor/etc from Square into Growlio)
  squareSyncLoading: false,
  squareSyncError: null,
  
  // Actions
  setSquareLoading: (loading) => set({ squareLoading: loading }),
  setSquareError: (error) => set({ squareError: error }),
  setSquareStatus: (status) => set({ squareStatus: status }),
  setSquareConnectionData: (data) => set({ squareConnectionData: data }),
  setSquareMerchantDetail: (data) => set({ squareMerchantDetail: data }),
  setSquareSyncLoading: (loading) => set({ squareSyncLoading: loading }),
  setSquareSyncError: (error) => set({ squareSyncError: error }),
  
  /**
   * Initiate Square OAuth connection
   * Fetches the authorization URL from backend and redirects user to Square authorization page
   * @param {number} restaurantId - Restaurant ID for the connection
   */
  connectSquare: async (restaurantId) => {
    if (!restaurantId) {
      const error = 'Restaurant ID is required to connect Square';
      set({ squareError: error, squareLoading: false });
      message.error(error);
      return { success: false, error };
    }

    const locationId = typeof get().getSelectedLocationId === 'function'
      ? await get().getSelectedLocationId()
      : get().selectedLocationId;
    if (!locationId) {
      const error = 'Please select a location before connecting Square POS';
      set({ squareError: error, squareLoading: false });
      message.error(error);
      return { success: false, error };
    }
    
    set({ squareLoading: true, squareError: null, squareStatus: 'connecting' });
    
    try {
      // Call the backend to get the Square OAuth authorization URL
      const connectUrl = await appendGrowlioLocation(
        get,
        `/square_pos/connect/?restaurant_id=${restaurantId}`
      );
      const response = await apiGet(connectUrl);
      
      const data = response.data?.data || response.data;
      const authUrl = data?.url;
      
      if (!authUrl) {
        throw new Error('No authorization URL received from server');
      }

      sessionStorage.setItem('square_oauth_restaurant_id', String(restaurantId));
      sessionStorage.setItem('square_oauth_location_id', String(locationId));
      
      // Redirect to Square OAuth authorization page
      window.location.href = authUrl;
      
      // Note: We don't set loading to false here because we're redirecting
      return { success: true, url: authUrl };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to initiate Square connection';
      set({ 
        squareLoading: false, 
        squareError: errorMessage,
        squareStatus: 'error'
      });
      message.error(errorMessage);
      console.error('❌ Square connection error:', error);
      return { success: false, error: errorMessage };
    }
  },
  
  /**
   * Handle Square OAuth callback
   * Called when user returns from Square authorization
   * @param {string} code - Authorization code from Square
   * @param {string} state - State parameter for CSRF protection
   */
  handleSquareCallback: async (code, state) => {
    if (!code) {
      const error = 'No authorization code received from Square';
      set({ squareError: error, squareLoading: false, squareStatus: 'error' });
      message.error(error);
      return { success: false, error };
    }
    
    set({ squareLoading: true, squareError: null });
    
    try {
      const { locationId: stateLocationId } = parseOAuthState(state);
      const locationId =
        stateLocationId ||
        sessionStorage.getItem('square_oauth_location_id') ||
        get().selectedLocationId ||
        localStorage.getItem('selected_location_id');

      let callbackUrl = `/square_pos/callback/?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
      if (locationId) {
        callbackUrl += `&location_id=${encodeURIComponent(locationId)}`;
      }

      const response = await apiGet(callbackUrl, { suppressGlobalError: true });
      const data = response.data?.data || response.data;
      
      sessionStorage.removeItem('square_oauth_location_id');
      sessionStorage.removeItem('square_oauth_restaurant_id');

      set({ 
        squareLoading: false,
        squareConnectionData: data,
        squareStatus: 'connected',
        squareError: null
      });
      
      message.success('Square POS connected successfully!');
      
      const restaurantId =
        localStorage.getItem('restaurant_id') ||
        sessionStorage.getItem('square_oauth_restaurant_id') ||
        get()?.restaurantId;
      if (restaurantId) {
        get().checkSquareStatus(restaurantId).catch(() => {});
      }
      
      return { success: true, data };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to complete Square connection';
      set({ 
        squareLoading: false, 
        squareError: errorMessage,
        squareStatus: 'error'
      });
      message.error(errorMessage);
      console.error('❌ Square callback error:', error);
      return { success: false, error: errorMessage };
    }
  },
  
  /**
   * Check Square connection status
   * @param {number} restaurantId - Restaurant ID to check status for
   */
  checkSquareStatus: async (restaurantId = null) => {
    // Get restaurant ID from parameter, localStorage, or store
    const restaurantIdToUse = restaurantId || 
                              localStorage.getItem('restaurant_id') || 
                              get()?.restaurantId;
    
    if (!restaurantIdToUse) {
      const error = 'Restaurant ID is required to check Square status';
      set({ squareError: error, squareLoading: false });
      return { success: false, error };
    }
    
    set({ squareLoading: true, squareError: null });
    
    try {
      const statusUrl = await appendGrowlioLocation(
        get,
        `/square_pos/${restaurantIdToUse}/status/`
      );
      const response = await apiGet(statusUrl);
      
      const data = response.data?.data || response.data;
      const isConnected = data?.connected || data?.status === 'connected' || false;
      
      set({ 
        squareLoading: false,
        squareConnectionData: data,
        squareStatus: isConnected ? 'connected' : 'disconnected',
        squareError: null,
        lastStatusCheck: new Date().toISOString()
      });
      
      // Fetch merchant details when connected
      if (isConnected) {
        get().fetchSquareMerchantDetail(restaurantIdToUse);
      } else {
        set({ squareMerchantDetail: null });
      }
      
      return { success: true, data, connected: isConnected };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to check Square status';
      
      // If it's a 404, the restaurant might not be connected yet
      const isNotFound = error?.response?.status === 404;
      const status = isNotFound ? 'disconnected' : 'error';
      
      set({ 
        squareLoading: false, 
        squareError: isNotFound ? null : errorMessage,
        squareStatus: status,
        squareConnectionData: null,
        squareMerchantDetail: null
      });
      
      if (!isNotFound) {
        console.error('❌ Square status check error:', error);
      }
      
      return { success: false, error: isNotFound ? null : errorMessage, connected: false };
    }
  },
  
  /**
   * Fetch Square merchant details (when connected)
   * @param {number} restaurantId - Restaurant ID
   */
  fetchSquareMerchantDetail: async (restaurantId = null) => {
    const restaurantIdToUse = restaurantId || 
                              localStorage.getItem('restaurant_id') || 
                              get()?.restaurantId;
    
    if (!restaurantIdToUse) return { success: false };
    
    set({ merchantDetailLoading: true });
    
    try {
      const merchantUrl = await appendGrowlioLocation(
        get,
        `/square_pos/merchant-detail/?restaurant_id=${restaurantIdToUse}`
      );
      const response = await apiGet(merchantUrl);
      const data = response.data?.merchant ?? response.data?.data?.merchant ?? response.data?.data ?? response.data;
      
      set({ 
        squareMerchantDetail: data,
        merchantDetailLoading: false
      });
      
      return { success: true, data };
    } catch (error) {
      set({ 
        squareMerchantDetail: null,
        merchantDetailLoading: false
      });
      console.error('❌ Square merchant detail error:', error);
      return { success: false };
    }
  },

  /**
   * Sync Square POS data into Growlio.
   * Backend endpoint (GET): /square_pos/sync_data?restaurant_id=123
   */
  syncSquarePosData: async (restaurantId = null) => {
    const restaurantIdToUse =
      restaurantId ||
      localStorage.getItem('restaurant_id') ||
      get()?.restaurantId;

    if (!restaurantIdToUse) {
      const error = 'Restaurant ID is required to sync Square data';
      set({ squareSyncLoading: false, squareSyncError: error });
      message.error(error);
      return { success: false, error };
    }

    set({ squareSyncLoading: true, squareSyncError: null });

    try {
      const syncUrl = await appendGrowlioLocation(
        get,
        `/square_pos/sync_data?restaurant_id=${restaurantIdToUse}`
      );
      const response = await apiGet(syncUrl);
      set({ squareSyncLoading: false, squareSyncError: null });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to sync Square data';
      set({ squareSyncLoading: false, squareSyncError: errorMessage });
      message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },
  
  /**
   * Disconnect Square integration
   * @param {number} restaurantId - Restaurant ID to disconnect
   */
  disconnectSquare: async (restaurantId = null) => {
    const restaurantIdToUse = restaurantId || 
                              localStorage.getItem('restaurant_id') || 
                              get()?.restaurantId;
    
    if (!restaurantIdToUse) {
      const error = 'Restaurant ID is required to disconnect Square';
      set({ squareError: error, squareLoading: false });
      message.error(error);
      return { success: false, error };
    }
    
    set({ squareLoading: true, squareError: null });
    
    try {
      // Assuming there's a disconnect endpoint
      // If not, you may need to add this endpoint to your backend
      const disconnectUrl = await appendGrowlioLocation(
        get,
        `/square_pos/${restaurantIdToUse}/disconnect/`
      );
      const response = await apiPost(disconnectUrl);
      
      set({ 
        squareLoading: false,
        squareConnectionData: null,
        squareMerchantDetail: null,
        squareStatus: 'disconnected',
        squareError: null
      });
      
      message.success('Square POS disconnected successfully');
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to disconnect Square';
      set({ 
        squareLoading: false, 
        squareError: errorMessage
      });
      message.error(errorMessage);
      console.error('❌ Square disconnect error:', error);
      return { success: false, error: errorMessage };
    }
  },
  
  /**
   * Reset Square state
   */
  resetSquareState: () => {
    set({
      squareLoading: false,
      squareError: null,
      squareStatus: null,
      squareConnectionData: null,
      squareMerchantDetail: null,
      merchantDetailLoading: false,
      lastStatusCheck: null,
      squareSyncLoading: false,
      squareSyncError: null,
    });
  }
});

export default createSquareSlice;

