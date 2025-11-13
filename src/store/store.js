import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import createAuthSlice from './slices/authSlice';
import createOnBoardingSlice from './slices/onBoardingSlice';
import createDashboardSlice from './slices/dashboardSlice';
import createDashboardSummarySlice from './slices/dashboardSummary';
import createSupportSlice from './slices/supportSlice';
import createSuperAdminSlice from './slices/superAdminSlice';
import createFaqSlice from './slices/faqSlice';
import createChatSlice from './slices/chatSlice';

const useStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...createAuthSlice(set, get),
        ...createOnBoardingSlice(set, get),
        ...createDashboardSlice(set, get),
        ...createDashboardSummarySlice(set, get),
        ...createSupportSlice(set, get),
        ...createSuperAdminSlice(set, get),
        ...createFaqSlice(set, get),
        ...createChatSlice(set, get),
      
        
        // Function to completely clear all persisted state
        clearPersistedState: () => {
          
          // Clear localStorage
          localStorage.removeItem('growlio-store');
          localStorage.removeItem('restaurant_id');
          
          // Clear sessionStorage (including tokens)
          sessionStorage.clear();
          
          // Reset all slices to initial state
          set(() => ({
            // Auth slice reset
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
            onboardingStatus: null,
            loading: false,
            
            // Onboarding slice reset
            completeOnboardingData: {
              restaurant_id: null,
              "Basic Information": {
                status: false,
                data: {
                  restaurant_name: "",
                  number_of_locations: 1,
                  restaurant_type: "",
                  menu_type: "",
                  locations: [
                    {
                      location_name: "",
                      address_1: "",
                      country: "",
                      state: "",
                      zip_code: "",
                      sqft: "",
                      is_franchise: false
                    }
                  ]
                }
              },
              "Labor Information": {
                status: false,
                data: {
                  labour_goal: 0,
                  goal: "",
                  needs_attention: "",
                  danger: "",
                  avg_hourly_rate: 0,
                  labor_record_method: "daily-hours-costs",
                  daily_ticket_count: false,
                  forward_previous_week_rate: false
                }
              },
              "Food Cost Details": {
                status: false,
                data: {
                  cogs_goal: "",
                  delivery_days: []
                }
              },
              "Sales Channels": {
                status: false,
                data: {
                  in_store: true,
                  online: false,
                  from_app: false,
                  third_party: false,
                  providers: []
                }
              },
              "Expense": {
                status: false,
                data: {
                  fixed_costs: [],
                  variable_costs: []
                }
              }
            },
            tempFormData: {},
            onboardingLoading: false,
            onboardingError: null,
            onboardingData: null,
            isOnBoardingCompleted: false,
            
            // Restaurant goals state reset
            restaurantGoalsLoading: false,
            restaurantGoalsError: null,
            restaurantGoals: null,
            
            // Restaurant name check state reset
            restaurantNameCheckLoading: false,
            restaurantNameCheckError: null,
            restaurantNameExists: false,
            
            // Dashboard slice reset
            dashboardData: null,
            goalsData: null,
            restaurantId: null,
            lastFetchedDate: null,
            selectedDate: null,
            selectedYear: null,
            selectedMonth: null,
            selectedWeek: null,
            availableWeeks: [],
            
            // Dashboard summary slice reset
            dashboardSummaryData: null,
            lastFetchedWeek: null,
            lastFetchedMonth: null,
            currentViewMode: 'weekly',
            
            // Support slice reset
            supportLoading: false,
            supportError: null,
            supportSuccess: false,
            supportFormData: {
              fullName: '',
              email: '',
              restaurant: '',
              subject: '',
              message: ''
            },
            
            // FAQ slice reset
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
            searchTimeout: null
          }));
          
        }
      }),
      { name: 'growlio-store' }
    )
  )
);

export default useStore;