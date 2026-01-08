import { apiGet, apiPost } from '../../utils/axiosInterceptors';
import { message } from 'antd';

/**
 * Square POS Integration Slice
 * Manages Square OAuth connection, status, and integration state
 */
const createSquareSlice = (set, get) => ({
  name: 'square',
  
  // Square connection state
  squareLoading: false,
  squareError: null,
  squareStatus: null, // 'disconnected' | 'connected' | 'connecting' | 'error'
  squareConnectionData: null,
  lastStatusCheck: null,
  
  // Actions
  setSquareLoading: (loading) => set({ squareLoading: loading }),
  setSquareError: (error) => set({ squareError: error }),
  setSquareStatus: (status) => set({ squareStatus: status }),
  setSquareConnectionData: (data) => set({ squareConnectionData: data }),
  
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
    
    set({ squareLoading: true, squareError: null, squareStatus: 'connecting' });
    
    try {
      // Call the backend to get the Square OAuth authorization URL
      const response = await apiGet(`/square_pos/connect/?restaurant_id=${restaurantId}`);
      
      const data = response.data?.data || response.data;
      const authUrl = data?.url;
      
      if (!authUrl) {
        throw new Error('No authorization URL received from server');
      }
      
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
      // POST the authorization code and state to the callback endpoint
      const response = await apiGet(`/square_pos/callback/?code=${code}&state=${state}`);
      const data = response.data?.data || response.data;
      
      set({ 
        squareLoading: false,
        squareConnectionData: data,
        squareStatus: 'connected',
        squareError: null
      });
      
      message.success('Square POS connected successfully!');
      
      // Fetch updated status
      await get().checkSquareStatus();
      
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
      const response = await apiGet(`/square_pos/${restaurantIdToUse}/status/`);
      
      const data = response.data?.data || response.data;
      const isConnected = data?.connected || data?.status === 'connected' || false;
      
      set({ 
        squareLoading: false,
        squareConnectionData: data,
        squareStatus: isConnected ? 'connected' : 'disconnected',
        squareError: null,
        lastStatusCheck: new Date().toISOString()
      });
      
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
        squareConnectionData: null
      });
      
      if (!isNotFound) {
        console.error('❌ Square status check error:', error);
      }
      
      return { success: false, error: isNotFound ? null : errorMessage, connected: false };
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
      const response = await apiPost(`/square_pos/${restaurantIdToUse}/disconnect/`);
      
      set({ 
        squareLoading: false,
        squareConnectionData: null,
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
      lastStatusCheck: null
    });
  }
});

export default createSquareSlice;

