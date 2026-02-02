import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import useStore from '../../store/store';
import LoadingSpinner from '../layout/LoadingSpinner';
import BasicInformationStep from './simulationSteps/BasicInformationStep';
import SalesChannelsAndOperatingDaysStep from './simulationSteps/SalesChannelsAndOperatingDaysStep';
import LaborInformationStep from './simulationSteps/LaborInformationStep';
import ExpensesStep from './simulationSteps/ExpensesStep';
import { ONBOARDING_ROUTES } from '../../utils/onboardingUtils';
import Header from '../layout/Header';

const STEPS = [
  { id: 'basic-information', title: 'Basic Information', component: BasicInformationStep },
  { id: 'sales-channels-operating-days', title: 'Sales Channels & Operating Days', component: SalesChannelsAndOperatingDaysStep },
  { id: 'labor-information', title: 'Labor Information', component: LaborInformationStep },
  { id: 'expenses', title: 'Expenses', component: ExpensesStep }
];

const SimulationOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const validateStepRef = useRef(null);
  const [formData, setFormData] = useState({
    basicinformation: {
      restaurantName: '',
      restaurantType: '',
      menuType: '',
      isFranchise: false,
      locationAddress: {
        city: '',
        state: '',
        fullAddress: '',
        address2: '',
        zipCode: '',
        sqft: ''
      }
    },
    saleschannels: {
      usesThirdPartyDelivery: false,
      thirdPartyProviders: [],
      thirdPartyInfo: {}
    },
    restaurant_operating_days: [],
    laborinformation: {
      avgHourlyRate: 0
    },
    expenses: []
  });

  const { submitStepData, onboardingLoading, getSimulationOnboardingStatus, submitSimulationOnboarding, getRestaurantOnboarding, restaurantOnboardingData } = useStore();

  // Load existing restaurant data before showing Basic Information
  // This runs on component mount and page reload
  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    const loadRestaurantData = async () => {
      if (!isMounted) {
        return;
      }
      
      setIsLoadingRestaurant(true);
      
      try {
        if (typeof getSimulationOnboardingStatus !== 'function') {
          console.error('❌ [SimulationOnboarding] getSimulationOnboardingStatus is not a function!');
          setIsLoadingRestaurant(false);
          return;
        }
        
        const result = await getSimulationOnboardingStatus();
        
        if (!isMounted) {
          return;
        }
        
        if (result && result.success && result.data) {
          const restaurants = result.data.restaurants || [];
          
          if (restaurants.length > 0) {
            // Get the most recent restaurant (last in array) or first one
            const restaurant = restaurants[restaurants.length - 1] || restaurants[0];
            const restaurantId = restaurant.simulation_restaurant_id;
            const restaurantName = restaurant.simulation_restaurant_name;
            const onboardingComplete = restaurant.simulation_onboarding_complete;
            
            if (!isMounted) return;
            
            if (restaurantId) {
              setRestaurantId(restaurantId);
              localStorage.setItem('simulation_restaurant_id', restaurantId.toString());
              
              // Only redirect to dashboard if:
              // 1. restaurant_name is not null
              // 2. simulation_onboarding_complete is true
              if (restaurantName !== null && onboardingComplete === true) {
                // Check if user has both regular and simulation restaurants
                const checkBothRestaurants = async () => {
                  try {
                    let regularRestaurants = [];
                    if (restaurantOnboardingData?.restaurants) {
                      regularRestaurants = restaurantOnboardingData.restaurants;
                    } else {
                      const restaurantResult = await getRestaurantOnboarding();
                      if (restaurantResult?.success && restaurantResult?.data?.restaurants) {
                        regularRestaurants = restaurantResult.data.restaurants;
                      }
                    }
                    
                    const hasRegularRestaurantsCheck = Array.isArray(regularRestaurants) && regularRestaurants.length > 0;
                    const hasSimulationRestaurantsCheck = Array.isArray(restaurants) && restaurants.length > 0;
                    
                    // Use setTimeout to ensure state updates are processed
                    timeoutId = setTimeout(() => {
                      if (isMounted) {
                        // If both APIs have restaurants, navigate to dashboard/report-card instead of simulation/dashboard
                        if (hasRegularRestaurantsCheck && hasSimulationRestaurantsCheck) {
                          message.info('Restaurant found. Redirecting to dashboard...');
                          navigate(ONBOARDING_ROUTES.REPORT_CARD, { replace: true });
                        } else if (hasSimulationRestaurantsCheck) {
                          // Only redirect to simulation dashboard if simulation onboarding API has restaurants
                          message.info('Restaurant found. Redirecting to dashboard...');
                          navigate('/simulation/dashboard', { replace: true });
                        }
                      }
                    }, 100);
                    return;
                  } catch (error) {
                    console.error('Error checking regular restaurants:', error);
                    // If check fails, still redirect to simulation dashboard if simulation has restaurants
                    if (isMounted && restaurants.length > 0) {
                      timeoutId = setTimeout(() => {
                        if (isMounted) {
                          message.info('Restaurant found. Redirecting to dashboard...');
                          navigate('/simulation/dashboard', { replace: true });
                        }
                      }, 100);
                    }
                  }
                };
                
                checkBothRestaurants();
                return;
              } else {
                setIsLoadingRestaurant(false);
              }
            }
          } else {
            setIsLoadingRestaurant(false);
          }
        } else {
          console.warn('⚠️ [SimulationOnboarding] API call failed or returned no data');
          if (result && result.error) {
            console.warn('⚠️ [SimulationOnboarding] Error:', result.error);
          }
          setIsLoadingRestaurant(false);
        }
      } catch (error) {
        console.error('❌ [SimulationOnboarding] Exception caught while loading restaurant data:', error);
        if (error.response) {
          console.error('❌ [SimulationOnboarding] Error response:', error.response);
          console.error('❌ [SimulationOnboarding] Error response data:', error.response.data);
        }
        if (isMounted) {
          message.error('Failed to load restaurant data. Please try again.');
          setIsLoadingRestaurant(false);
        }
      }
    };

    // Call immediately on mount
    loadRestaurantData();
    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  const CurrentStepComponent = STEPS[currentStep].component;

  // Reset validation ref when step changes
  useEffect(() => {
    validateStepRef.current = null;
  }, [currentStep]);

  const handleNext = async () => {
    // CRITICAL: Validate current step before proceeding
    // Check if validation function exists and call it
    if (validateStepRef.current && typeof validateStepRef.current === 'function') {
      const isValid = validateStepRef.current();
      if (!isValid) {
        // Validation failed - don't proceed
        return;
      }
    } else {
      // If no validation function is set, it might be a step without validation
      // But for safety, we should still try to validate
      // Wait a brief moment in case the ref is being set asynchronously
      await new Promise(resolve => setTimeout(resolve, 50));
      if (validateStepRef.current && typeof validateStepRef.current === 'function') {
        const isValid = validateStepRef.current();
        if (!isValid) {
          return;
        }
      }
    }
    
    // Only proceed if validation passed (or no validation function exists)
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - submit all data
      await handleSubmit();
    }
  };

  const handleBack = () => {
    // Back button should work from step 2 onwards (currentStep >= 1, since 0-indexed)
    // Step 1 is index 0, Step 2 is index 1, etc.
    if (currentStep >= 1) {
      // Go back one step
      setCurrentStep(currentStep - 1);
    }
    // If on step 1 (currentStep === 0), do nothing - back button is disabled
  };

  // Load simulation restaurant data when component mounts or restaurantId changes
  useEffect(() => {
    if (!restaurantId) return;
    
    const loadRestaurantData = async () => {
      try {
        const result = await getSimulationOnboardingStatus();
        if (result.success && result.data) {
          const restaurants = result.data.restaurants || [];
          const restaurant = restaurants.find(r => r.simulation_restaurant_id === restaurantId) || restaurants[0];
          
          if (restaurant) {
            // Pre-populate form with existing restaurant data if available
            // This ensures we have the latest data before submission
            if (restaurant.simulation_restaurant_name) {
              setFormData(prev => ({
                ...prev,
                basicinformation: {
                  ...prev.basicinformation,
                  restaurantName: restaurant.simulation_restaurant_name
                }
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error loading restaurant data:', error);
      }
    };
    
    loadRestaurantData();
  }, [restaurantId, getSimulationOnboardingStatus]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Format expenses - convert to single array format
      // Ensure expenses is always an array
      let expenses = formData.expenses;
      if (!Array.isArray(expenses)) {
        console.warn('Expenses is not an array, converting to array:', expenses);
        expenses = [];
      }
      
      // Combine all active expenses into a single array
      const expensesData = expenses
        .filter(exp => exp && typeof exp === 'object' && exp.is_active)
        .map(exp => {
          const amount = parseFloat(exp.amount) || 0;
          return {
            category: exp.category || '',
            name: exp.name || '',
            orignal_amount: amount, // Original amount (same as amount for now)
            is_value_type: exp.is_value_type === true, // Boolean: true for fixed value, false for percentage
            amount: amount,
            expense_type: exp.fixed_expense_type === 'MONTHLY' ? 'monthly' : 'weekly'
          };
        });

      // Build payload in exact format required by API
      const payload = {
        restaurant_id: restaurantId || null,
        "Basic Information": {
          status: true,
          data: {
            name: formData.basicinformation?.restaurantName || '',
            restaurant_type: formData.basicinformation?.restaurantType || '',
            menu_type: formData.basicinformation?.menuType || '',
            number_of_locations: 1,
            locations: [{
              name: formData.basicinformation?.restaurantName || '',
              address_1: formData.basicinformation?.locationAddress?.fullAddress || '',
              address_2: formData.basicinformation?.locationAddress?.address2 || '',
              country: 'USA',
              city: formData.basicinformation?.locationAddress?.city || '',
              state: formData.basicinformation?.locationAddress?.state || '',
              zip_code: formData.basicinformation?.locationAddress?.zipCode || '',
              sqft: formData.basicinformation?.locationAddress?.sqft || '',
              is_franchise: formData.basicinformation?.isFranchise || false
            }]
          }
        },
        "Sales Channels": {
          status: true,
          data: {
            uses_third_party_delivery: formData.saleschannels?.usesThirdPartyDelivery || false,
            third_party_info: formData.saleschannels?.thirdPartyInfo || {},
            restaurant_operating_days: Array.isArray(formData.restaurant_operating_days) 
              ? formData.restaurant_operating_days 
              : []
          }
        },
        "Labour Information": {
          status: true,
          data: {
            avg_hourly_rate: formData.laborinformation?.avgHourlyRate || 0
          }
        },
        "Expenses": {
          status: true,
          data: expensesData
        }
      };

      // Submit to simulation onboarding API
      const result = await submitSimulationOnboarding(payload);
      
      if (result.success) {
        // Get restaurant ID from response (already stored in localStorage by the API function)
        let finalRestaurantId = result.restaurantId || result.data?.restaurant_id || restaurantId;
        
        // Check if onboarding is complete (from the GET API call made in submitSimulationOnboarding)
        const isOnboardingComplete = result.isOnboardingComplete === true;
        const onboardingStatus = result.onboardingStatus;
        
        // If onboarding status was fetched, use it
        if (onboardingStatus && !finalRestaurantId) {
          const restaurants = onboardingStatus.restaurants || [];
          const restaurant = restaurants[restaurants.length - 1] || restaurants[0];
          
          if (restaurant && restaurant.simulation_restaurant_id) {
            finalRestaurantId = restaurant.simulation_restaurant_id;
            localStorage.setItem('simulation_restaurant_id', finalRestaurantId.toString());
          }
        }
        
        // Fallback: If still no restaurant ID and onboarding status not fetched, try to get it
        if (!finalRestaurantId && !onboardingStatus) {
          try {
            const statusResult = await getSimulationOnboardingStatus(true); // Force refresh
            if (statusResult.success && statusResult.data) {
              const restaurants = statusResult.data.restaurants || [];
              const restaurant = restaurants[restaurants.length - 1] || restaurants[0];
              
              if (restaurant && restaurant.simulation_restaurant_id) {
                finalRestaurantId = restaurant.simulation_restaurant_id;
                localStorage.setItem('simulation_restaurant_id', finalRestaurantId.toString());
              }
              
              // Check if onboarding is complete
              const completeRestaurant = restaurants.find(
                (r) => r.simulation_restaurant_name !== null && r.simulation_onboarding_complete === true
              );
              
              if (completeRestaurant) {
                // Check if user has both regular and simulation restaurants
                try {
                  let regularRestaurants = [];
                  if (restaurantOnboardingData?.restaurants) {
                    regularRestaurants = restaurantOnboardingData.restaurants;
                  } else {
                    const restaurantResult = await getRestaurantOnboarding();
                    if (restaurantResult?.success && restaurantResult?.data?.restaurants) {
                      regularRestaurants = restaurantResult.data.restaurants;
                    }
                  }
                  
                  const hasRegularRestaurantsCheck = Array.isArray(regularRestaurants) && regularRestaurants.length > 0;
                  const hasSimulationRestaurantsCheck = Array.isArray(restaurants) && restaurants.length > 0;
                  
                  // CRITICAL: Clear loading state BEFORE navigation
                  setIsSubmitting(false);
                  message.success('Onboarding completed successfully!');
                  setTimeout(() => {
                    // If both APIs have restaurants, navigate to dashboard/report-card instead of simulation/dashboard
                    if (hasRegularRestaurantsCheck && hasSimulationRestaurantsCheck) {
                      navigate(ONBOARDING_ROUTES.REPORT_CARD, { replace: true });
                    } else if (hasSimulationRestaurantsCheck) {
                      // Only redirect to simulation dashboard if simulation onboarding API has restaurants
                      navigate('/simulation/dashboard', { replace: true });
                    }
                  }, 100);
                  return;
                } catch (error) {
                  console.error('Error checking regular restaurants:', error);
                  // If check fails, still redirect to simulation dashboard if simulation has restaurants
                  setIsSubmitting(false);
                  message.success('Onboarding completed successfully!');
                  if (restaurants.length > 0) {
                    setTimeout(() => {
                      navigate('/simulation/dashboard', { replace: true });
                    }, 100);
                  }
                  return;
                }
              }
            }
          } catch (error) {
            console.error('❌ [SimulationOnboarding] Error checking simulation status:', error);
          }
        }
        
        // CRITICAL: Clear loading state BEFORE navigation to prevent stuck loading
        setIsSubmitting(false);
        
        // Navigate based on onboarding completion status
        if (isOnboardingComplete) {
          // Check if user has both regular and simulation restaurants
          try {
            let regularRestaurants = [];
            if (restaurantOnboardingData?.restaurants) {
              regularRestaurants = restaurantOnboardingData.restaurants;
            } else {
              const restaurantResult = await getRestaurantOnboarding();
              if (restaurantResult?.success && restaurantResult?.data?.restaurants) {
                regularRestaurants = restaurantResult.data.restaurants;
              }
            }
            
            const hasRegularRestaurantsCheck = Array.isArray(regularRestaurants) && regularRestaurants.length > 0;
            const simulationRestaurants = onboardingStatus?.restaurants || [];
            const hasSimulationRestaurantsCheck = Array.isArray(simulationRestaurants) && simulationRestaurants.length > 0;
            
            message.success('Onboarding completed successfully!');
            setTimeout(() => {
              // If both APIs have restaurants, navigate to dashboard/report-card instead of simulation/dashboard
              if (hasRegularRestaurantsCheck && hasSimulationRestaurantsCheck) {
                navigate(ONBOARDING_ROUTES.REPORT_CARD, { replace: true });
              } else if (hasSimulationRestaurantsCheck) {
                // Only redirect to simulation dashboard if simulation onboarding API has restaurants
                navigate('/simulation/dashboard', { replace: true });
              }
            }, 100);
          } catch (error) {
            console.error('Error checking regular restaurants:', error);
            // If check fails, still redirect to simulation dashboard if onboarding is complete
            message.success('Onboarding completed successfully!');
            setTimeout(() => {
              navigate('/simulation/dashboard', { replace: true });
            }, 100);
          }
        } else {
          // If onboarding is not complete, check if simulation onboarding has restaurants
          // Only navigate if simulation onboarding API has restaurants
          const simulationRestaurants = onboardingStatus?.restaurants || [];
          const hasSimulationRestaurantsCheck = Array.isArray(simulationRestaurants) && simulationRestaurants.length > 0;
          
          message.success('Onboarding data saved successfully!');
          // If onboarding is not complete, stay on the page or navigate to next step
          // Only navigate to simulation dashboard if simulation onboarding API has restaurants
          if (hasSimulationRestaurantsCheck) {
            setTimeout(() => {
              navigate('/simulation/dashboard', { replace: true });
            }, 100);
          }
          // If no simulation restaurants, stay on current page (route guard will handle redirect)
        }
        return;
      }
    } catch (error) {
      message.error('Failed to submit onboarding data. Please try again.');
      console.error('Onboarding submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = useCallback((stepKey, data) => {
    setFormData(prev => {
      // Special handling for expenses to ensure it's always an array
      if (stepKey === 'expenses') {
        const expensesData = Array.isArray(data) ? data : (data?.expenses || []);
        return {
          ...prev,
          [stepKey]: expensesData
        };
      }
      
      // Special handling for restaurant_operating_days to ensure it's always an array
      if (stepKey === 'restaurant_operating_days') {
        const daysData = Array.isArray(data) ? data : [];
        return {
          ...prev,
          restaurant_operating_days: daysData
        };
      }
      
      // Handle combined sales channels and operating days step
      // The combined step passes an object with both saleschannels and restaurant_operating_days
      if (data && typeof data === 'object' && (data.saleschannels || data.restaurant_operating_days)) {
        return {
          ...prev,
          saleschannels: data.saleschannels || prev.saleschannels,
          restaurant_operating_days: Array.isArray(data.restaurant_operating_days) 
            ? data.restaurant_operating_days 
            : prev.restaurant_operating_days
        };
      }
      
      // For other steps, merge data normally
      return {
        ...prev,
        [stepKey]: { ...prev[stepKey], ...data }
      };
    });
  }, []);

  if (isLoadingRestaurant) {
    return <LoadingSpinner message="Loading restaurant information..." />;
  }

  if (onboardingLoading || isSubmitting) {
    return <LoadingSpinner message="Saving your information..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
                 <div>
             <Header />

      </div>

      <div className="max-w-4xl mx-auto py-4">
        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-gray-500">
              {STEPS[currentStep].title}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {CurrentStepComponent && (
            <CurrentStepComponent
              data={
                STEPS[currentStep]?.id === 'sales-channels-operating-days'
                  ? {
                      saleschannels: formData.saleschannels || {},
                      restaurant_operating_days: formData.restaurant_operating_days || []
                    }
                  : formData[STEPS[currentStep]?.id?.replace(/-/g, '')] || {}
              }
              updateData={(data) => {
                // For combined step, handle it specially
                if (STEPS[currentStep]?.id === 'sales-channels-operating-days') {
                  updateFormData('sales-channels-operating-days', data);
                } else {
                  const stepKey = STEPS[currentStep]?.id?.replace(/-/g, '');
                  if (stepKey) {
                    updateFormData(stepKey, data);
                  }
                }
              }}
              onNext={handleNext}
              onBack={handleBack}
              isLastStep={currentStep === STEPS.length - 1}
              validateStep={validateStepRef}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={isSubmitting || currentStep === 0}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
  
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === STEPS.length - 1 ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationOnboarding;
