import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/axiosInterceptors';

const createFaqSlice = (set, get) => ({
    name: 'faq',
    
    // FAQ state
    faqLoading: false,
    faqError: null,
    faqSuccess: false,
    faqCreateSuccess: false,
    faqUpdateSuccess: false,
    faqDeleteSuccess: false,
    faqs: [],
    filteredFaqs: [],
    searchQuery: '',
    selectedCategory: 'all',
    searchLoading: false,
    searchTimeout: null,
    
    // FAQ categories
    categories: [
        { key: 'all', label: 'All Categories', icon: '📋' },
        { key: 'general', label: 'General', icon: '❓' },
        { key: 'sales', label: 'Sales', icon: '💰' },
        { key: 'labor', label: 'Labor', icon: '👥' },
        { key: 'food', label: 'Food', icon: '🍽️' }
    ],
    
    // Actions
    setFaqLoading: (loading) => set({ faqLoading: loading }),
    setFaqError: (error) => set({ faqError: error }),
    setFaqSuccess: (success) => set({ faqSuccess: success }),
    setFaqCreateSuccess: (success) => set({ faqCreateSuccess: success }),
    setFaqUpdateSuccess: (success) => set({ faqUpdateSuccess: success }),
    setFaqDeleteSuccess: (success) => set({ faqDeleteSuccess: success }),
    setFaqs: (faqs) => set({ faqs, filteredFaqs: faqs }),
    setSearchQuery: (query) => {
        const state = get();
        
        // Clear existing timeout
        if (state.searchTimeout) {
            clearTimeout(state.searchTimeout);
        }
        
        // Update search query immediately for UI responsiveness
        set({ searchQuery: query });
        
        // If query is empty, show all FAQs
        if (!query.trim()) {
            const filtered = state.filterFaqs(state.faqs, '', state.selectedCategory);
            set({ filteredFaqs: filtered, searchLoading: false });
            return;
        }
        
        // Set loading state
        set({ searchLoading: true });
        
        // Debounce the search API call
        const timeout = setTimeout(() => {
            state.searchFaqs(query, state.selectedCategory);
        }, 500); // 500ms debounce
        
        set({ searchTimeout: timeout });
    },
    setSelectedCategory: (category) => {
        const state = get();
        
        // Update selected category
        set({ selectedCategory: category });
        
        // If category is 'all', show all FAQs
        if (category === 'all') {
            const filtered = state.filterFaqs(state.faqs, state.searchQuery, category);
            set({ filteredFaqs: filtered });
            return;
        }
        
        // If we have a search query, search with both parameters
        if (state.searchQuery.trim()) {
            state.searchFaqs(state.searchQuery, category);
        } else {
            // Search with just section parameter
            state.searchFaqs('', category);
        }
    },
    
    // Filter FAQs based on search query and category
    filterFaqs: (faqs, searchQuery, category) => {
        let filtered = faqs;
        
        // Filter by category
        if (category !== 'all') {
            filtered = filtered.filter(faq => faq.category === category);
        }
        
        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(faq => 
                faq.question.toLowerCase().includes(query) ||
                faq.answer.toLowerCase().includes(query)
            );
        }
        
        return filtered;
    },
    

    // Search FAQs using API (unified function for both search and section)
    searchFaqs: async (query, section = 'all') => {
        set(() => ({ 
            searchLoading: true, 
            faqError: null
        }));
        
        try {
            
            // Build the API URL with parameters
            let apiUrl = '/admin_access/faqs/?';
            const params = [];
            
            if (query && query.trim()) {
                params.push(`search=${encodeURIComponent(query)}`);
            }
            
            if (section && section !== 'all') {
                params.push(`section=${encodeURIComponent(section)}`);
            }
            
            apiUrl += params.join('&');
            
            
            const response = await apiGet(apiUrl);
            
            
            // Validate response structure
            if (!response || !response.data) {
                throw new Error('Invalid response format from server');
            }
            
            // Handle the wrapped response format
            const responseData = response.data;
            const rawFaqs = Array.isArray(responseData.data) ? responseData.data : [];
            
            
            // Map API response to expected format
            const searchResults = rawFaqs.map(faq => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
                category: faq.section, // Map section to category
                created_at: faq.created_at
            }));
            
            
            set(() => ({ 
                filteredFaqs: searchResults,
                searchLoading: false,
                faqError: null
            }));
            
            return { success: true, data: searchResults };
        } catch (error) {
            console.error('FAQ Slice - Search error:', error);
            
            let errorMessage = 'Failed to search FAQs. Please try again.';
            
            if (error.response) {
                const status = error.response.status;
                const data = error.response.data;
                
                switch (status) {
                    case 400:
                        errorMessage = data?.message || 'Invalid search query. Please check your input.';
                        break;
                    case 401:
                        errorMessage = 'You are not authorized to search FAQs. Please log in again.';
                        break;
                    case 403:
                        errorMessage = 'You do not have permission to search FAQs.';
                        break;
                    case 404:
                        errorMessage = 'No FAQs found matching your search.';
                        break;
                    case 500:
                        errorMessage = 'Server error occurred while searching. Please try again later.';
                        break;
                    default:
                        errorMessage = data?.message || `Search failed with status ${status}. Please try again.`;
                }
            } else if (error.request) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({ 
                searchLoading: false,
                faqError: errorMessage,
                filteredFaqs: []
            }));
            
            return { success: false, error: errorMessage };
        }
    },

    // Fetch all FAQs
    fetchFaqs: async () => {
        set(() => ({ 
            faqLoading: true, 
            faqError: null,
            faqSuccess: false
        }));
        
        try {
            const response = await apiGet('/admin_access/faqs/');
            
            
            // Validate response structure
            if (!response || !response.data) {
                throw new Error('Invalid response format from server');
            }
            
            // Handle the wrapped response format
            const responseData = response.data;
            const rawFaqs = Array.isArray(responseData.data) ? responseData.data : [];
            
            
            // Map API response to expected format
            const faqs = rawFaqs.map(faq => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
                category: faq.section, // Map section to category
                created_at: faq.created_at
            }));
            
            
            set(() => ({ 
                faqs,
                filteredFaqs: faqs,
                faqLoading: false,
                faqError: null
            }));
            
            return { success: true, data: faqs };
        } catch (error) {
            console.error('❌ Error fetching FAQs:', error);
            
            let errorMessage = 'Failed to fetch FAQs. Please try again.';
            
            // Handle different error types
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;
                
                switch (status) {
                    case 401:
                        errorMessage = 'You are not authorized to view FAQs. Please log in again.';
                        break;
                    case 403:
                        errorMessage = 'You do not have permission to access FAQs.';
                        break;
                    case 404:
                        errorMessage = 'FAQ service not found. Please contact support.';
                        break;
                    case 500:
                        errorMessage = 'Server error occurred. Please try again later.';
                        break;
                    default:
                        if (errorData?.message) {
                            errorMessage = errorData.message;
                        } else if (errorData?.error) {
                            errorMessage = errorData.error;
                        } else if (errorData?.detail) {
                            errorMessage = errorData.detail;
                        } else {
                            errorMessage = `Request failed with status ${status}`;
                        }
                }
            } else if (error.request) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({ 
                faqLoading: false, 
                faqError: errorMessage,
                faqs: [],
                filteredFaqs: []
            }));
            
            throw new Error(errorMessage);
        }
    },
    
    // Create new FAQ
    createFaq: async (faqData) => {
        set(() => ({ 
            faqLoading: true, 
            faqError: null,
            faqSuccess: false
        }));
        
        try {
            // Validate input data
            if (!faqData || typeof faqData !== 'object') {
                throw new Error('Invalid FAQ data provided');
            }
            
            if (!faqData.question || !faqData.question.trim()) {
                throw new Error('Question is required');
            }
            
            if (!faqData.answer || !faqData.answer.trim()) {
                throw new Error('Answer is required');
            }
            
            if (!faqData.category) {
                throw new Error('Category is required');
            }
            
            // Map frontend format to API format
            const apiData = {
                question: faqData.question,
                answer: faqData.answer,
                section: faqData.category // Map category to section
            };
            
            const response = await apiPost('/admin_access/faqs/', apiData);
            
            if (!response || !response.data) {
                throw new Error('Invalid response from server');
            }
            
            const newFaq = response.data;
            
            // Map API response to expected format
            const mappedFaq = {
                id: newFaq.id,
                question: newFaq.question,
                answer: newFaq.answer,
                category: newFaq.section, // Map section to category
                created_at: newFaq.created_at
            };
            
            const state = get();
            const updatedFaqs = [...state.faqs, mappedFaq];
            const filtered = state.filterFaqs(updatedFaqs, state.searchQuery, state.selectedCategory);
            
            set(() => ({ 
                faqs: updatedFaqs,
                filteredFaqs: filtered,
                faqLoading: false,
                faqCreateSuccess: true,
                faqError: null
            }));
            
            // Fetch all FAQs to ensure we have the latest data
            setTimeout(() => {
                get().fetchFaqs();
            }, 100);
            
            return { success: true, data: mappedFaq };
        } catch (error) {
            console.error('❌ Error creating FAQ:', error);
            
            let errorMessage = 'Failed to create FAQ. Please try again.';
            
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;
                
                switch (status) {
                    case 400:
                        if (errorData?.message) {
                            errorMessage = errorData.message;
                        } else if (errorData?.error) {
                            errorMessage = errorData.error;
                        } else {
                            errorMessage = 'Invalid data provided. Please check your input.';
                        }
                        break;
                    case 401:
                        errorMessage = 'You are not authorized to create FAQs. Please log in again.';
                        break;
                    case 403:
                        errorMessage = 'You do not have permission to create FAQs.';
                        break;
                    case 409:
                        errorMessage = 'A FAQ with this question already exists.';
                        break;
                    case 500:
                        errorMessage = 'Server error occurred. Please try again later.';
                        break;
                    default:
                        if (errorData?.message) {
                            errorMessage = errorData.message;
                        } else if (errorData?.error) {
                            errorMessage = errorData.error;
                        } else if (errorData?.detail) {
                            errorMessage = errorData.detail;
                        }
                }
            } else if (error.request) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({ 
                faqLoading: false, 
                faqError: errorMessage,
                faqSuccess: false
            }));
            
            throw new Error(errorMessage);
        }
    },
    
    // Update FAQ
    updateFaq: async (id, faqData) => {
        set(() => ({ 
            faqLoading: true, 
            faqError: null,
            faqSuccess: false
        }));
        
        try {
            // Validate input
            if (!id) {
                throw new Error('FAQ ID is required for update');
            }
            
            if (!faqData || typeof faqData !== 'object') {
                throw new Error('Invalid FAQ data provided');
            }
            
            // Map frontend format to API format
            const apiData = {
                question: faqData.question,
                answer: faqData.answer,
                section: faqData.category // Map category to section
            };
            
            const response = await apiPut(`/admin_access/faqs/${id}/`, apiData);
            
            if (!response || !response.data) {
                throw new Error('Invalid response from server');
            }
            
            const updatedFaq = response.data;
            
            // Map API response to expected format
            const mappedFaq = {
                id: updatedFaq.id,
                question: updatedFaq.question,
                answer: updatedFaq.answer,
                category: updatedFaq.section, // Map section to category
                created_at: updatedFaq.created_at
            };
            
            const state = get();
            const updatedFaqs = state.faqs.map(faq => 
                faq.id === id ? mappedFaq : faq
            );
            const filtered = state.filterFaqs(updatedFaqs, state.searchQuery, state.selectedCategory);
            
            set(() => ({ 
                faqs: updatedFaqs,
                filteredFaqs: filtered,
                faqLoading: false,
                faqUpdateSuccess: true,
                faqError: null
            }));
            
            // Fetch all FAQs to ensure we have the latest data
            setTimeout(() => {
                get().fetchFaqs();
            }, 100);
            
            return { success: true, data: mappedFaq };
        } catch (error) {
            console.error('❌ Error updating FAQ:', error);
            
            let errorMessage = 'Failed to update FAQ. Please try again.';
            
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;
                
                switch (status) {
                    case 400:
                        errorMessage = 'Invalid data provided. Please check your input.';
                        break;
                    case 401:
                        errorMessage = 'You are not authorized to update FAQs. Please log in again.';
                        break;
                    case 403:
                        errorMessage = 'You do not have permission to update FAQs.';
                        break;
                    case 404:
                        errorMessage = 'FAQ not found. It may have been deleted.';
                        break;
                    case 500:
                        errorMessage = 'Server error occurred. Please try again later.';
                        break;
                    default:
                        if (errorData?.message) {
                            errorMessage = errorData.message;
                        } else if (errorData?.error) {
                            errorMessage = errorData.error;
                        } else if (errorData?.detail) {
                            errorMessage = errorData.detail;
                        }
                }
            } else if (error.request) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({ 
                faqLoading: false, 
                faqError: errorMessage,
                faqSuccess: false
            }));
            
            throw new Error(errorMessage);
        }
    },
    
    // Delete FAQ
    deleteFaq: async (id) => {
        set(() => ({ 
            faqLoading: true, 
            faqError: null,
            faqSuccess: false
        }));
        
        try {
            // Validate input
            if (!id) {
                throw new Error('FAQ ID is required for deletion');
            }
            
            await apiDelete(`/admin_access/faqs/${id}/`);
            
            const state = get();
            const updatedFaqs = state.faqs.filter(faq => faq.id !== id);
            const filtered = state.filterFaqs(updatedFaqs, state.searchQuery, state.selectedCategory);
            
            set(() => ({ 
                faqs: updatedFaqs,
                filteredFaqs: filtered,
                faqLoading: false,
                faqDeleteSuccess: true,
                faqError: null
            }));
            
            // Fetch all FAQs to ensure we have the latest data
            setTimeout(() => {
                get().fetchFaqs();
            }, 100);
            
            return { success: true };
        } catch (error) {
            console.error('❌ Error deleting FAQ:', error);
            
            let errorMessage = 'Failed to delete FAQ. Please try again.';
            
            if (error.response) {
                const status = error.response.status;
                const errorData = error.response.data;
                
                switch (status) {
                    case 401:
                        errorMessage = 'You are not authorized to delete FAQs. Please log in again.';
                        break;
                    case 403:
                        errorMessage = 'You do not have permission to delete FAQs.';
                        break;
                    case 404:
                        errorMessage = 'FAQ not found. It may have already been deleted.';
                        break;
                    case 500:
                        errorMessage = 'Server error occurred. Please try again later.';
                        break;
                    default:
                        if (errorData?.message) {
                            errorMessage = errorData.message;
                        } else if (errorData?.error) {
                            errorMessage = errorData.error;
                        } else if (errorData?.detail) {
                            errorMessage = errorData.detail;
                        }
                }
            } else if (error.request) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            set(() => ({ 
                faqLoading: false, 
                faqError: errorMessage,
                faqSuccess: false
            }));
            
            throw new Error(errorMessage);
        }
    },
    
    // Clear FAQ error
    clearFaqError: () => set({ faqError: null }),
    
    // Clear FAQ success
    clearFaqSuccess: () => set({ faqSuccess: false }),
    clearFaqCreateSuccess: () => set({ faqCreateSuccess: false }),
    clearFaqUpdateSuccess: () => set({ faqUpdateSuccess: false }),
    clearFaqDeleteSuccess: () => set({ faqDeleteSuccess: false }),
    
    // Clear all FAQ state
    clearFaq: () => {
        set({
            faqLoading: false,
            faqError: null,
            faqSuccess: false,
            faqs: [],
            filteredFaqs: [],
            searchQuery: '',
            selectedCategory: 'all'
        });
    }
});

export default createFaqSlice;
