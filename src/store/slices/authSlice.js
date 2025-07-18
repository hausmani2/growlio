
import { apiPost } from '../../utils/axiosInterceptors';

// Auth slice
const createAuthSlice = (set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  
  login: async (credentials) => {
    set(() => ({ loading: true, error: null }));
    
    try {
      const response = await apiPost('/users/authenticate', credentials);
      const { user, token } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Update store state
      set(() => ({ 
        user, 
        token, 
        isAuthenticated: true, 
        loading: false, 
        error: null 
      }));
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      
      set(() => ({ 
        loading: false, 
        error: errorMessage,
        isAuthenticated: false 
      }));
      
      throw new Error(errorMessage);
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set(() => ({ user: null, token: null, isAuthenticated: false, error: null }));
  },
  
  register: async (formData) => {
    set(() => ({ loading: true, error: null }));
    
    try {
      const response = await apiPost('/users/register', formData);
      const { user, token } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Update store state
      set(() => ({ 
        user, 
        token, 
        isAuthenticated: true, 
        loading: false, 
        error: null 
      }));
      
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Registration failed. Please try again.';
      
      set(() => ({ 
        loading: false, 
        error: errorMessage,
        isAuthenticated: false 
      }));
      
      throw new Error(errorMessage);
    }
  },
  
  clearError: () => set(() => ({ error: null })),
});

export default createAuthSlice;