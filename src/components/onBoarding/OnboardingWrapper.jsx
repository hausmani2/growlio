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
import GuidanceOverlay from "../guidance/GuidanceOverlay";
import Mask from "../../assets/pngs/new-onboard.png"


import { forceResetOnboardingLoading } from "../../utils/resetLoadingState";
import { clearStoreAndRedirectToLogin } from "../../utils/axiosInterceptors";

const OnboardingWrapper = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(false);
    const [selectedOption, setSelectedOption] = useState('profitability'); // 'profitability' or 'simulation'
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
            // Check which option was selected
            if (selectedOption === 'profitability') {
                // Navigate to profitability score page
                message.success("Great! Let's calculate your profitability score.");
                navigate('/profitability');
                return;
            } else if (selectedOption === 'simulation') {
                // Navigate to simulation/onboarding
                message.success("Perfect! Let's run some simulations.");
                navigate('/onboarding/basic-information');
                return;
            }

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
                                onClick={() => setSelectedOption('profitability')}
                            >
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={selectedOption === 'profitability'}
                                        onChange={() => setSelectedOption('profitability')}
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
                                onClick={() => setSelectedOption('simulation')}
                            >
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={selectedOption === 'simulation'}
                                        onChange={() => setSelectedOption('simulation')}
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


