import React, { useState, useEffect } from "react";
import OnBoard from "../../assets/pngs/onBoard.png"

import ImageLayout from "../imageWrapper/ImageLayout";
import PrimaryBtn from "../buttons/Buttons";
import LoadingSpinner from "../layout/LoadingSpinner";
import { Checkbox, Alert } from "antd";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate, useLocation } from "react-router-dom";
import useStore from "../../store/store";
import { message } from "antd";

import { forceResetOnboardingLoading } from "../../utils/resetLoadingState";
import { clearStoreAndRedirectToLogin } from "../../utils/axiosInterceptors";

const OnboardingWrapper = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(false);
    const { 
        checkOnboardingCompletion, 
        loadExistingOnboardingData, 
        onboardingStatus,
        onboardingLoading,
        isNewUser,
        isOnBoardingCompleted,
        logout
    } = useStore();

    // Check if we should show loading state
    const shouldShowLoading = onboardingLoading || onboardingStatus === 'loading';
    
    const handleSubmit = async () => {
        setIsChecking(true);
        
        try {
            
            // For new users, we can skip the API call and go directly to basic information
            if (onboardingStatus === 'incomplete' || onboardingStatus === null) {
                
                message.success("Welcome! Let's set up your restaurant.");
                navigate('/onboarding/basic-information');
                return;
            }
            
            // Use the onboarding status from store if available, otherwise make API call
            let onboardingData;
            
            if (onboardingStatus === 'loading') {
                // Wait for the existing check to complete
                
                message.info("Please wait while we check your status...");
                return;
            }
            
            // Use cached status from store
            
            
            // Check if we already have onboarding data in the store
            if (isOnBoardingCompleted !== undefined) {
                
                onboardingData = {
                    success: true,
                    isComplete: isOnBoardingCompleted,
                    message: isOnBoardingCompleted ? 'Onboarding completed' : 'Onboarding not complete'
                };
            } else if (onboardingLoading) {
                // If loading is in progress, wait for it to complete
                
                message.info("Please wait while we check your status...");
                return;
            } else {
                // Only make API call if we don't have the data and not loading
                
                const result = await checkOnboardingCompletion();
                onboardingData = result;
            }
            
            
            
            // Check if user has no restaurants (new user)
            if (onboardingData && onboardingData.message === "No restaurants found for this user." && 
                (!onboardingData.restaurants || onboardingData.restaurants.length === 0)) {
                
                message.success("Welcome! Let's set up your restaurant.");
                navigate('/onboarding/basic-information');
                return;
            }
            
            // Check if user has restaurants
            if (onboardingData && onboardingData.restaurants && onboardingData.restaurants.length > 0) {
                // Check if any restaurant has onboarding_complete: true
                const hasCompletedOnboarding = onboardingData.restaurants.some(restaurant => 
                    restaurant.onboarding_complete === true
                );
                
                if (hasCompletedOnboarding) {
                    
                    message.success("Welcome back! Redirecting to your dashboard...");
                    setTimeout(() => {
                        navigate('/dashboard/budget');
                    }, 1000);
                    return;
                } else {
                    
                    message.info("Loading your existing setup...");
                    
                    // Load existing onboarding data from API
                    const result = await loadExistingOnboardingData();
                    
                    if (result.success) {
                        
                        
                        // Determine which step to navigate to based on incomplete steps
                        const { incompleteSteps } = result;
                        
                        if (incompleteSteps.length === 0) {
                            // All steps are complete, go to completion page

                            navigate('/onboarding/complete');
                        } else {
                            // Navigate to the first incomplete step
                            const firstIncompleteStep = incompleteSteps[0];
                            
                            
                            switch (firstIncompleteStep) {
                                case 'Basic Information':
                                    navigate('/onboarding/basic-information');
                                    break;
                                case 'Labor Information':
                                    navigate('/onboarding/labor-information');
                                    break;
                                case 'Food Cost Details':
                                    navigate('/onboarding/food-cost-details');
                                    break;
                                case 'Sales Channels':
                                    navigate('/onboarding/sales-channels');
                                    break;
                                case 'Expenses':
                                    navigate('/onboarding/expense');
                                    break;
                                default:
                                    navigate('/onboarding/basic-information');
                            }
                        }
                    } else {
                        
                        message.warning("Couldn't load your existing data. Starting fresh setup.");
                        navigate('/onboarding/basic-information');
                    }
                }
            } else {
                // Fallback - no restaurants found
                
                message.info("Welcome! Let's set up your restaurant.");
                navigate('/onboarding/basic-information');
            }
            
        } catch (error) {
            console.error("Error checking onboarding status:", error);
            
            let errorMessage = "Something went wrong. Please try again.";
            
            if (error.message === 'Request timeout') {
                errorMessage = "Request timed out. Please check your connection and try again.";
            } else if (error.response?.status === 401) {
                errorMessage = "Authentication required. Please log in again.";
                
                // Clear all store data when token expires and redirect to login
                clearStoreAndRedirectToLogin();
                return; // Exit early to prevent further processing
            } else if (error.response?.status === 404) {
                errorMessage = "No restaurant data found. Starting fresh setup.";
            }
            
            message.error(errorMessage);
            
            // For certain errors, we can still proceed to onboarding
            if (error.response?.status === 404 || error.message === 'Request timeout') {
                
                navigate('/onboarding/basic-information');
            } else {
                // For other errors, stay on current page and let user retry
                
            }
        } finally {
            setIsChecking(false);
        }
    };

    const handleBack = () => {
        navigate('/congratulations');
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    // Auto-navigate if onboarding status is already known
    useEffect(() => {
        if (onboardingStatus === 'incomplete' || onboardingStatus === null) {
            
            
            // Welcome message logic for new users
            if (isNewUser) {
                
                message.info("Welcome! Let's set up your restaurant.");
            } else {
                
            }
        }
    }, [onboardingStatus, isNewUser, navigate]);

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
                                <button  onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium">
                                    <FaArrowLeftLong className="text-sm" />
                                    <span className="hidden sm:inline">Go Back</span>
                                   
                                </button>
                                <button  onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium  p-1">
                                    <span className="hidden sm:inline">Logout</span>
                                   
                                </button>
                            </div>
                            
                            {/* Header */}
                            <div className="flex flex-col gap-3">
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-gray-900">
                                    Is Your Restaurant Already on Growlio?
                                </h1>
                                <h2 className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                                Let's Get Your Restaurant Setup!
                                </h2>
                            </div>
                            
                            {/* Options */}
                            <div className="flex flex-col gap-4 sm:gap-6">
                                {/* <div className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 bg-gray-50 opacity-60">
                                    <div className="flex items-center gap-3">
                                        <Checkbox disabled />
                                        <span className="text-base sm:text-lg font-semibold text-gray-500">
                                            Yes, My Restaurant Exists
                                        </span>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-500 leading-relaxed mt-2 ml-6">
                                        Claim and manage an existing listing.
                                    </p>
                                </div> */}
                                
                                <div className="border-2 border-orange-200 rounded-xl p-4 sm:p-6 bg-orange-50 hover:bg-orange-100 transition-colors duration-200 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <Checkbox defaultChecked />
                                        <span className="text-base sm:text-lg font-semibold text-orange-800">
                                            No, I Want to Create a New One
                                        </span>
                                    </div>
                                    <p className="text-sm sm:text-base text-orange-700 leading-relaxed mt-2 ml-6">
                                        Register a new restaurant on Growlio.
                                    </p>
                                </div>
                            </div>

                        <div className="">
                            <button
                                onClick={handleSubmit}
                                disabled={isChecking}
                                className="w-full border-2 border-gray-200 rounded-xl p-2 bg-orange-500 text-white hover:bg-orange-600"
                            >
                                {isChecking ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white text-black mr-2"></div>
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
                                src={OnBoard}
                                alt="onboarding"
                                className="h-[calc(100vh-100px)] object-contain"
                            />
                        </div>
                    </ImageLayout>
                </div>
        </div>
    );
};

export default OnboardingWrapper;


