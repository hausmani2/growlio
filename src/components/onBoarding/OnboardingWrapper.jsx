import React, { useState, useEffect, useRef } from "react";
import OnBoard from "../../assets/pngs/onBoard.png"

import ImageLayout from "../imageWrapper/ImageLayout";
import PrimaryBtn from "../buttons/Buttons";
import LoadingSpinner from "../layout/LoadingSpinner";
import { Checkbox, Alert } from "antd";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate, useLocation } from "react-router-dom";
import useStore from "../../store/store";
import { message } from "antd";
import GuidanceOverlay from "../guidance/GuidanceOverlay";
import Mask from "../../assets/pngs/new-onboard.png"

import { forceResetOnboardingLoading } from "../../utils/resetLoadingState";
import { clearStoreAndRedirectToLogin } from "../../utils/axiosInterceptors";
import {
  hasRestaurant,
  hasOneMonthSalesInfo,
  isSalesInformationComplete,
  ONBOARDING_ROUTES,
} from "../../utils/onboardingUtils";
import { checkAndRedirectToSimulation } from "../../utils/simulationUtils";


const OnboardingWrapper = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(false);
    const [selectedOption, setSelectedOption] = useState('profitability'); // 'profitability' or 'simulation'
    const [restaurantData, setRestaurantData] = useState(null);
    const hasCheckedRestaurantRef = useRef(false);
    const hasCheckedSimulationRef = useRef(false);

    
    
    const {
        checkOnboardingCompletion,
        loadExistingOnboardingData,
        onboardingStatus,
        onboardingLoading,
        isNewUser,
        isOnBoardingCompleted,
        logout,
        getRestaurantSimulation,
        updateRestaurantSimulation,
        getRestaurantOnboarding,
        getSalesInformation,
        salesInformationData,
        getSimulationOnboardingStatus
    } = useStore();
    
    // Check if sales information is complete using utility function
    const hasSalesInformation = () => {
        return isSalesInformationComplete(salesInformationData);
    };

    // Check if we should show loading state
    const shouldShowLoading = onboardingLoading || onboardingStatus === 'loading';

    const handleSubmit = async () => {
        setIsChecking(true);

        try {
            // STEP 1: Call restaurant-simulation API FIRST (GET)
            try {
                const simulationResult = await getRestaurantSimulation();
                if (simulationResult.success && simulationResult.data) {
                    if (simulationResult.data.restaurant_simulation === true) {
                        setSelectedOption('profitability');
                    } else if (simulationResult.data.restaurant_simulation === false) {
                        setSelectedOption('simulation');
                    }
                }
            } catch (error) {
                console.error("❌ [OnboardingWrapper] handleSubmit - Error fetching restaurant simulation:", error);
                // Continue even if this fails
            }
            
            // STEP 2: Update restaurant simulation based on selected option (POST)
            // profitability (first option) = false, simulation (second option) = true
            const restaurantSimulationValue = selectedOption === 'simulation';
            
            try {
                await updateRestaurantSimulation({ restaurant_simulation: restaurantSimulationValue });
            } catch (error) {
                console.error("❌ [OnboardingWrapper] handleSubmit - Error updating restaurant simulation:", error);
                message.error("Failed to save your selection. Please try again.");
                setIsChecking(false);
                return;
            }
            
            // STEP 3: NOW call restaurants-onboarding API to check if restaurant exists
            try {
                const restaurantResult = await getRestaurantOnboarding();
                
                if (restaurantResult.success && restaurantResult.data) {
                    const restaurantExists = hasRestaurant(restaurantResult.data);
                    
                    // If restaurant exists, redirect to score page
                    if (restaurantExists) {
                        
                        // IMPORTANT: Clear sessionStorage flags so ProtectedRoutes will re-fetch with updated data
                        // This ensures ProtectedRoutes gets the fresh restaurant data after navigation
                        sessionStorage.removeItem('hasCheckedRestaurant');
                        sessionStorage.removeItem('hasCheckedRestaurantOnboardingGlobal');
                        sessionStorage.removeItem('restaurantOnboardingLastCheckTime');
                        
                        navigate(ONBOARDING_ROUTES.SCORE, { replace: true });
                        setIsChecking(false);
                        return;
                    } else {
                    }
                } else {
                }
            } catch (error) {
                console.error("❌ [OnboardingWrapper] handleSubmit - Error checking restaurant:", error);
                // Continue with normal flow if check fails
            }
            
            // STEP 4: If no restaurant exists, proceed with normal flow based on selected option
            if (selectedOption === 'profitability') {
                // Navigate to profitability score page
                navigate(ONBOARDING_ROUTES.SCORE, { replace: true });
                setIsChecking(false);
                return;
            } else if (selectedOption === 'simulation') {
                // Navigate to simplified onboarding flow
                message.success("Perfect! Let's set up your restaurant.");
                navigate(ONBOARDING_ROUTES.SIMULATION, { replace: true });
                setIsChecking(false);
                return;
            }
        } catch (error) {
            console.error("❌ [OnboardingWrapper] handleSubmit - Error during navigation:", error);
            message.error("Something went wrong. Please try again.");
        } finally {
            setIsChecking(false);
        }
    };

    const handleBack = () => {
        navigate(ONBOARDING_ROUTES.CONGRATULATIONS);
    }

    const handleLogout = () => {
        logout();
        // logout() function now handles redirect internally
    }
     // Ref to prevent multiple simultaneous API calls
     const simulationCheckRef = useRef(false);
    
     // Check for simulation restaurant on component mount (only once)
     useEffect(() => {
         // Prevent multiple calls
         if (simulationCheckRef.current) {
             return;
         }
         
         // Only check on /onboarding page
         if (location.pathname !== ONBOARDING_ROUTES.ONBOARDING) {
             return;
         }
 
         // Mark as checking to prevent duplicate calls
         simulationCheckRef.current = true;
 
         const checkSimulationRestaurant = async () => {
             try {
                 const result = await getSimulationOnboardingStatus();
                 
                 if (result.success && result.data) {
                     const restaurants = result.data.restaurants || [];
                     
                     if (restaurants.length > 0) {
                         // Get the most recent restaurant
                         const restaurant = restaurants[restaurants.length - 1] || restaurants[0];
                         const restaurantId = restaurant.simulation_restaurant_id;
                         const restaurantName = restaurant.simulation_restaurant_name;
                         const onboardingComplete = restaurant.simulation_onboarding_complete;
                         
                         if (restaurantId) {
                             // Store restaurant ID
                             localStorage.setItem('simulation_restaurant_id', restaurantId.toString());
                             
                             // Only redirect to dashboard if:
                             // 1. restaurant_name is not null
                             // 2. simulation_onboarding_complete is true
                             if (restaurantName !== null && onboardingComplete === true) {
                                 // Check if user has both regular and simulation restaurants
                                 try {
                                     const restaurantResult = await getRestaurantOnboarding();
                                     const regularRestaurants = restaurantResult?.success && restaurantResult?.data?.restaurants 
                                       ? restaurantResult.data.restaurants 
                                       : [];
                                     const hasRegularRestaurantsCheck = Array.isArray(regularRestaurants) && regularRestaurants.length > 0;
                                     const hasSimulationRestaurantsCheck = Array.isArray(restaurants) && restaurants.length > 0;
                                     
                                     // If both APIs have restaurants, navigate to dashboard/report-card instead of simulation/dashboard
                                     if (hasRegularRestaurantsCheck && hasSimulationRestaurantsCheck) {
                                         message.info('Restaurant found. Redirecting to dashboard...');
                                         navigate(ONBOARDING_ROUTES.REPORT_CARD, { replace: true });
                                     } else if (hasSimulationRestaurantsCheck) {
                                         // Only redirect to simulation dashboard if simulation onboarding API has restaurants
                                         message.info('Simulation restaurant found. Redirecting to dashboard...');
                                         navigate('/simulation/dashboard', { replace: true });
                                     }
                                     return;
                                 } catch (error) {
                                     console.error('Error checking regular restaurants:', error);
                                     // If check fails, still redirect to simulation dashboard if simulation has restaurants
                                     if (restaurants.length > 0) {
                                         message.info('Simulation restaurant found. Redirecting to dashboard...');
                                         navigate('/simulation/dashboard', { replace: true });
                                     }
                                     return;
                                 }
                             }
                         }
                     }
                 } else {
                     console.warn('⚠️ [OnboardingWrapper] Failed to check simulation status:', result.error);
                 }
             } catch (error) {
                 console.error('❌ [OnboardingWrapper] Error checking simulation restaurant:', error);
                 // Don't show error to user - just log it
                 // Allow user to continue with normal onboarding flow
             }
         };
 
         // Call on mount
         checkSimulationRestaurant();
         
         // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [location.pathname]);

    // Simple check: If restaurant exists (restaurants array has items), redirect to score page
    useEffect(() => {
        const checkRestaurantAndRoute = async () => {
            
            // Only run this check if we're on the /onboarding page
            if (location.pathname !== ONBOARDING_ROUTES.ONBOARDING) {
                return;
            }
            
            // Prevent multiple checks
            if (hasCheckedRestaurantRef.current) {
                // If we already have restaurant data, use it for routing
                if (restaurantData) {
                    const restaurantExists = hasRestaurant(restaurantData);
                    if (restaurantExists) {
                        navigate(ONBOARDING_ROUTES.SCORE, { replace: true });
                        return;
                    }
                } else {
                }
                return;
            }
            
            // Mark as checking to prevent concurrent calls 
            hasCheckedRestaurantRef.current = true;

            // IMPORTANT: Call restaurants-onboarding API FIRST and independently
            // This is critical for routing decisions
            const restaurantCheckPromise = (async () => {
                try {
                    const restaurantResult = await getRestaurantOnboarding();
                    
                    if (restaurantResult.success && restaurantResult.data) {
                        setRestaurantData(restaurantResult.data);
                        
                        // Simple check: If restaurant exists (restaurants array has items), redirect to score
                        const restaurantExists = hasRestaurant(restaurantResult.data);
                        if (restaurantExists) {
                            navigate(ONBOARDING_ROUTES.SCORE, { replace: true });
                            return;
                        } else {
                        }
                        // If restaurants array is empty, allow user to stay on /onboarding
                    } else {
                        setRestaurantData(null);
                    }
                } catch (error) {
                    console.error("❌ [OnboardingWrapper] useEffect - Error checking restaurant onboarding:", error);
                    setRestaurantData(null);
                }
            })();
            
            // Fetch restaurant simulation status to set default option (call independently, don't block)
            // This is less critical and can run in parallel
            const simulationCheckPromise = (async () => {
                try {
                    const result = await getRestaurantSimulation();
                    if (result.success && result.data) {
                        if (result.data.restaurant_simulation === true) {
                            setSelectedOption('profitability');
                        } else if (result.data.restaurant_simulation === false) {
                            setSelectedOption('simulation');
                        }
                    }
                } catch (error) {
                    console.error("❌ [OnboardingWrapper] useEffect - Error fetching restaurant simulation status:", error);
                }
            })();
            
            // Wait for restaurant check to complete (critical for routing)
            // Don't wait for simulation check - it's just for UI default and runs in parallel
            await restaurantCheckPromise;
        };
        
        checkRestaurantAndRoute();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // Auto-reset stuck loading state after 10 seconds
    useEffect(() => {
        if (onboardingLoading) {
            const timer = setTimeout(() => {

                forceResetOnboardingLoading();
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [onboardingLoading]);

    // Show loading spinner if checking onboarding status
    if (shouldShowLoading) {
        return <LoadingSpinner message="Checking your setup..." />;
    }

    return (
        <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex flex-col lg:flex-row bg-gray-50">
            {/* Content Section - Improved responsive design */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-0 min-h-screen lg:min-h-0">
                <div className="w-full max-w-md mx-auto flex flex-col h-full justify-center">
                    <div className="flex flex-col gap-6 sm:gap-8 bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10">
                        {/* Back Button */}
                        <div className="flex justify-between">
                            <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium">
                                <FaArrowLeftLong className="text-sm" />
                                <span className="hidden sm:inline">Go Back</span>
                            </button>
                            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium  p-1">
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>

                        {/* Header */}
                        <div className="flex flex-col gap-3">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-gray-900">
                                Let's Get Your Restaurant Setup!
                            </h1>
                        </div>

                        {/* Options */}
                        <div className="flex flex-col gap-4">
                            {/* Option 1: I have a restaurant */}
                            <div
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${selectedOption === 'profitability'
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-gray-300 bg-white hover:border-gray-400'
                                    }`}
                                onClick={() => {
                                    setSelectedOption('profitability');
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={selectedOption === 'profitability'}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedOption('profitability');
                                            }
                                        }}
                                        className="mt-1"
                                    />
                                    <div>
                                        <div className="text-base font-medium text-gray-900">
                                            I have a restaurant.
                                        </div>
                                        <div className="text-base font-medium text-gray-900">
                                            I would like a <span className="font-bold">profitability score</span>.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Option 2: I do not have a restaurant */}
                            <div
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${selectedOption === 'simulation'
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-gray-300 bg-white hover:border-gray-400'
                                    }`}
                                onClick={() => {
                                    setSelectedOption('simulation');
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={selectedOption === 'simulation'}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedOption('simulation');
                                            }
                                        }}
                                        className="mt-1"
                                    />
                                    <div>
                                        <div className="text-base font-medium text-gray-900">
                                            I do not have a restaurant.
                                        </div>
                                        <div className="text-base font-medium text-gray-900">
                                            I want to run some <span className="font-bold">simulations</span>.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Get Started Button */}
                        <div className="mt-4">
                            <button
                                onClick={handleSubmit}
                                disabled={isChecking}
                                className="w-full rounded-lg p-3 bg-orange-500 text-white font-semibold text-base hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isChecking ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Checking...
                                    </div>
                                ) : (
                                    "Get Started"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Image Section - Hidden on mobile, visible on lg and above */}
            <div className="hidden lg:block w-full lg:w-1/2 relative bg-gradient-to-br from-orange-50 to-orange-100">
                <ImageLayout>
                    <div className="relative w-full h-full flex items-end justify-center">
                        <img
                            src={Mask}
                            alt="onboarding"
                            className="h-[calc(100vh-100px)] object-contain"
                        />
                    </div>
                </ImageLayout>
            </div>
            <GuidanceOverlay />
        </div>
    );
};

export default OnboardingWrapper;


