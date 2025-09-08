import { apiPost } from '../../utils/axiosInterceptors';

const createSupportSlice = (set, get) => ({
    name: 'support',
    
    // Support state
    supportLoading: false,
    supportError: null,
    supportSuccess: false,
    
    // Support form state
    supportFormData: {
        fullName: '',
        email: '',
        restaurant: '',
        subject: '',
        message: ''
    },
    
    // Actions
    setSupportLoading: (loading) => set({ supportLoading: loading }),
    setSupportError: (error) => set({ supportError: error }),
    setSupportSuccess: (success) => set({ supportSuccess: success }),
    
    // Update support form data
    updateSupportFormData: (field, value) => {
        set((state) => ({
            supportFormData: {
                ...state.supportFormData,
                [field]: value
            }
        }));
    },
    
    // Update multiple support form fields
    updateSupportFormDataMultiple: (updates) => {
        set((state) => ({
            supportFormData: {
                ...state.supportFormData,
                ...updates
            }
        }));
    },
    
    // Clear support form data
    clearSupportFormData: () => {
        set({
            supportFormData: {
                fullName: '',
                email: '',
                restaurant: '',
                subject: '',
                message: ''
            }
        });
    },
    
    // Submit support ticket
    submitSupportTicket: async (formData) => {
        set(() => ({ 
            supportLoading: true, 
            supportError: null, 
            supportSuccess: false 
        }));
        
        try {
            // Get user and restaurant data from store
            const state = get();
            const user = state.user;
            const completeOnboardingData = state.completeOnboardingData;
            
            // Prepare payload with user and restaurant information
            const payload = {
                // User information
                user_id: user?.id || null,
                full_name: formData.fullName || user?.full_name || '',
                email: formData.email || user?.email || '',
                
                // Restaurant information
                restaurant_id: completeOnboardingData?.restaurant_id || localStorage.getItem('restaurant_id') || null,
                restaurant_name: formData.restaurant || completeOnboardingData?.["Basic Information"]?.data?.restaurant_name || '',
                
                // Support ticket details
                subject: formData.subject || '',
                message: formData.message || ''
            };
            
            console.log('📤 Submitting support ticket with payload:', payload);
            
            const response = await apiPost('/support/tickets/', payload);
            
            // Check if the response status is 200 or 201 (success)
            if (response.status !== 200 && response.status !== 201) {
                console.error('❌ Support ticket API request failed with status:', response.status);
                const errorMessage = `Support ticket submission failed with status ${response.status}. Please try again.`;
                
                set(() => ({
                    supportLoading: false,
                    supportError: errorMessage,
                    supportSuccess: false
                }));
                
                throw new Error(errorMessage);
            }
            
            console.log('✅ Support ticket submitted successfully:', response.data);
            
            set(() => ({ 
                supportLoading: false, 
                supportError: null, 
                supportSuccess: true,
                supportTicket: response.data
            }));
            
            return { 
                success: true, 
                data: response.data,
                ticket_id: response.data?.ticket_id || response.data?.id || null
            };
            
        } catch (error) {
            console.error('❌ Error submitting support ticket:', error);
            
            let errorMessage = 'Failed to submit support ticket. Please try again.';
            
            if (error.response?.data) {
                const errorData = error.response.data;
                
                // Handle different error response formats
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (typeof errorData === 'object') {
                    // Handle field-specific errors
                    const fieldErrors = Object.values(errorData).flat();
                    if (fieldErrors.length > 0) {
                        errorMessage = Array.isArray(fieldErrors[0]) ? fieldErrors[0][0] : fieldErrors[0];
                    }
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({ 
                supportLoading: false, 
                supportError: errorMessage,
                supportSuccess: false
            }));
            
            throw new Error(errorMessage);
        }
    },
    
    // Clear support error
    clearSupportError: () => set({ supportError: null }),
    
    // Clear support success
    clearSupportSuccess: () => set({ supportSuccess: false }),
    
    // Clear all support state
    clearSupport: () => {
        set({
            supportLoading: false,
            supportError: null,
            supportSuccess: false,
            supportFormData: {
                fullName: '',
                email: '',
                restaurant: '',
                subject: '',
                message: ''
            }
        });
    }
});

export default createSupportSlice;
