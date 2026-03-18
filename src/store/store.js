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
import createSalesInformationSlice from './slices/salesInformationSlice';
import createPlansSlice from './slices/plansSlice';
import createSquareSlice from './slices/squareSlice';
import createSimulationSlice from './slices/simulationSlice';


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
        ...createSalesInformationSlice(set, get),
        ...createPlansSlice(set, get),
        ...createSquareSlice(set, get),
        ...createSimulationSlice(set, get),

      
        
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
            searchTimeout: null,
            
            // Sales information slice reset
            salesInformationLoading: false,
            salesInformationError: null,
            salesInformationData: null,
            salesInformationSummary: null,
            salesInformationSummaryLoading: false,
            salesInformationSummaryError: null,
            
            // Square slice reset
            squareLoading: false,
            squareError: null,
            squareStatus: null,
            squareConnectionData: null,
            squareMerchantDetail: null,
            merchantDetailLoading: false,
            lastStatusCheck: null
          }));
          
        },

        // Reset user-scoped context without clearing authentication/session identity.
        // Used during impersonation transitions to prevent stale report/simulation/onboarding state.
        resetUserScopedContext: () => {
          // Clear user-scoped localStorage keys
          localStorage.removeItem('restaurant_id');
          localStorage.removeItem('simulation_restaurant_id');

          // Clear user-scoped session flags/caches (keep auth + impersonation keys intact)
          sessionStorage.removeItem('chat_conversation_id');
          sessionStorage.removeItem('isSimulationMode');
          sessionStorage.removeItem('simulationModeLastCheck');
          sessionStorage.removeItem('appSimulationMode');
          sessionStorage.removeItem('appSimulationModeLastCheck');
          sessionStorage.removeItem('headerSimulationMode');
          sessionStorage.removeItem('headerSimulationModeLastCheck');
          sessionStorage.removeItem('simulationCheckCongratulations');
          sessionStorage.removeItem('simulationCheckCongratulationsLastCheck');
          sessionStorage.removeItem('simulationCheckCongratulationsComplete');
          sessionStorage.removeItem('hasCheckedRestaurantGlobal');
          sessionStorage.removeItem('restaurantLastCheckTime');
          sessionStorage.removeItem('hasCheckedRestaurant');
          sessionStorage.removeItem('lastProcessedPath');
          sessionStorage.removeItem('restaurantLoadingStartTime');
          sessionStorage.removeItem('hasCheckedRestaurantOnboardingGlobal');
          sessionStorage.removeItem('restaurantOnboardingLastCheckTime');
          sessionStorage.removeItem('hasCheckedRestaurantSimulationGlobal');
          sessionStorage.removeItem('restaurantSimulationLastCheckTime');
          sessionStorage.removeItem('hasCheckedSimulationOnboardingGlobal');
          sessionStorage.removeItem('simulationOnboardingLastCheckTime');

          // Reset user-scoped in-memory store state
          set(() => ({
            // Auth cache
            restaurantOnboardingData: null,
            restaurantOnboardingDataTimestamp: null,
            restaurantSimulationData: null,
            restaurantSimulationDataTimestamp: null,

            // Dashboard + sales/report card cache
            dashboardData: null,
            dashboardSummaryData: null,
            goalsData: null,
            restaurantId: null,
            selectedDate: null,
            selectedYear: null,
            selectedMonth: null,
            selectedWeek: null,
            availableWeeks: [],
            salesInformationData: null,
            salesInformationSummary: null,
            salesInformationError: null,
            salesInformationSummaryError: null,

            // Onboarding state
            onboardingData: null,
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
                  goal: "",
                  needs_attention: "",
                  danger: "",
                  labour_goal: 0,
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
                  from_app: false
                }
              },
              "Third Party": {
                status: false,
                data: {
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
              },
              "Sales Information": {
                status: false,
                data: []
              }
            },
            tempFormData: {
              "Basic Information": {
                restaurantData: {
                  restaurantName: "",
                  numberOfLocations: undefined,
                  locationName: "",
                  otherLocationName: ""
                },
                addressData: {
                  address1: "",
                  address2: "",
                  country: "",
                  state: "",
                  zipCode: ""
                },
                addressTypeData: {
                  sqft: "",
                  isFranchise: "",
                  royaltyPercentage: "",
                  advertisementFee: "",
                  restaurantType: "",
                  menuType: ""
                }
              },
              "Labor Information": {
                laborData: {
                  goal: "",
                  needs_attention: "",
                  danger: "",
                  labour_goal: 0,
                  avg_hourly_rate: 0,
                  labor_record_method: "daily-hours-costs",
                  daily_ticket_count: false,
                  forward_previous_week_rate: false
                }
              },
              "Food Cost Details": {
                foodCostData: {
                  cogs_goal: "",
                  delivery_days: []
                }
              },
              "Sales Channels": {
                salesData: {
                  in_store: true,
                  online: false,
                  from_app: false
                }
              },
              "Third Party": {
                thirdPartyData: {
                  third_party: false,
                  providers: []
                }
              },
              "Expense": {
                expenseData: {
                  fixed_costs: [],
                  variable_costs: []
                }
              }
            },
            isOnBoardingCompleted: false,

            // Simulation state
            simulationOnboardingStatus: null,
            simulationOnboardingStatusTimestamp: null,
            simulationOnboardingData: null,
            simulationOnboardingDataTimestamp: null,
            simulationDashboardData: null,
            daysData: null,
            simulationOnboardingError: null,
            simulationOnboardingDataError: null,
            simulationDashboardError: null,
            daysError: null,

            // Chat state
            selectedConversationId: null,
            pendingChatMessage: null,
            shouldOpenChat: false,
          }));
        }
      }),
      { name: 'growlio-store' }
    )
  )
);

export default useStore;