import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import createAuthSlice from './slices/authSlice';
import createOnBoardingSlice from './slices/onBoardingSlice';
import createDashboardSlice from './slices/dashboardSlice';

const useStore = create(
  devtools(
    persist(
      (set, get) => ({
        ...createAuthSlice(set, get),
        ...createOnBoardingSlice(set, get),
        ...createDashboardSlice(set, get),
        
        // Function to completely clear all persisted state
        clearPersistedState: () => {
          console.log('🧹 Clearing all persisted state...');
          
          // Clear localStorage
          localStorage.removeItem('growlio-store');
          localStorage.removeItem('token');
          localStorage.removeItem('restaurant_id');
          
          // Clear sessionStorage
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
            onboardingLoading: false,
            
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
              "Labour Information": {
                status: false,
                data: {
                  goal: "",
                  needs_attention: "",
                  danger: "",
                  avg_hourly_rate: 0,
                  labor_record_method: "daily_hours_costs",
                  daily_ticket_count: false,
                  forward_prev_week_rate: false
                }
              },
              "Food Cost Details": {
                status: false,
                data: {
                  cogs_goal: "",
                  use_third_party_delivery: false,
                  delivery_days: []
                }
              },
              "Sales Channels": {
                status: false,
                data: {
                  in_store: true,
                  online: false,
                  from_app: false,
                  third_party: false
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
            
            // Dashboard slice reset
            dashboardData: null,
            restaurantId: null
          }));
          
          console.log('✅ All persisted state cleared');
        }
      }),
      { name: 'growlio-store' }
    )
  )
);

export default useStore;