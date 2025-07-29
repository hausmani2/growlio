import React, { useState, useEffect } from "react";
import OnBoard from "../../assets/pngs/onBoard.png"

import ImageLayout from "../imageWrapper/ImageLayout";
import PrimaryBtn from "../buttons/Buttons";
import LoadingSpinner from "../layout/LoadingSpinner";
import { Checkbox } from "antd";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import { message } from "antd";
import { apiGet } from "../../utils/axiosInterceptors";
import { forceResetOnboardingLoading } from "../../utils/resetLoadingState";

const OnboardingWrapper = () => {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(false);
    const { 
        checkOnboardingStatus, 
        loadExistingOnboardingData, 
        onboardingStatus,
        onboardingLoading 
    } = useStore();

    // Check if we should show loading state
    const shouldShowLoading = onboardingLoading || onboardingStatus === 'loading';
    
    const handleSubmit = async () => {
        setIsChecking(true);
        
        try {
            console.log("📋 User clicking Continue - checking onboarding status...");
            
            // Use the onboarding status from store if available, otherwise make API call
            let onboardingData;
            
            if (onboardingStatus === 'loading') {
                // Wait for the existing check to complete
                console.log('⏳ Waiting for existing onboarding status check...');
                message.info("Please wait while we check your status...");
                return;
            }
            
            if (onboardingStatus === null) {
                // No status available, make API call
                console.log('🔄 Making API call to check onboarding status...');
                message.info("Checking your restaurant status...");
                const response = await apiGet('/restaurant/restaurants-onboarding/');
                onboardingData = response.data;
            } else {
                // Use cached status from store
                console.log('✅ Using cached onboarding status from store');
                const result = await checkOnboardingStatus();
                onboardingData = result;
            }
            
            console.log('Onboarding Status Check - Raw data:', onboardingData);
            
            // Check if user has no restaurants (new user)
            if (onboardingData && onboardingData.message === "No restaurants found for this user." && 
                (!onboardingData.restaurants || onboardingData.restaurants.length === 0)) {
                console.log('✅ New user with no restaurants - redirecting to Basic Information');
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
                    console.log('✅ User has restaurants with completed onboarding - redirecting to dashboard');
                    message.success("Welcome back! Redirecting to your dashboard...");
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1000);
                    return;
                } else {
                    console.log('⚠️ User has restaurants but onboarding is not complete - loading existing data');
                    message.info("Loading your existing setup...");
                    
                    // Load existing onboarding data from API
                    const result = await loadExistingOnboardingData();
                    
                    if (result.success) {
                        console.log('✅ Successfully loaded existing onboarding data');
                        
                        // Determine which step to navigate to based on incomplete steps
                        const { incompleteSteps } = result;
                        
                        if (incompleteSteps.length === 0) {
                            // All steps are complete, go to completion page
                            console.log('🎉 All steps are complete - navigating to completion page');
                            navigate('/onboarding/complete');
                        } else {
                            // Navigate to the first incomplete step
                            const firstIncompleteStep = incompleteSteps[0];
                            console.log(`📋 Navigating to first incomplete step: ${firstIncompleteStep}`);
                            
                            // Map step names to routes
                            const stepToRoute = {
                                "Basic Information": "/onboarding/basic-information",
                                "Labour Information": "/onboarding/labour-information",
                                "Food Cost Details": "/onboarding/food-cost-details",
                                "Sales Channels": "/onboarding/sales-channels",
                                "Expense": "/onboarding/expense"
                            };
                            
                            const targetRoute = stepToRoute[firstIncompleteStep];
                            if (targetRoute) {
                                message.success(`Continuing from ${firstIncompleteStep}...`);
                                navigate(targetRoute);
                            } else {
                                console.error('❌ Unknown step name:', firstIncompleteStep);
                                navigate('/onboarding/basic-information');
                            }
                        }
                    } else {
                        console.log('❌ Failed to load existing onboarding data - starting fresh');
                        message.warning("Starting fresh setup...");
                        navigate('/onboarding/basic-information');
                    }
                    return;
                }
            }
            
            // Fallback case
            console.log('⚠️ Unexpected response format - proceeding to Basic Information');
            navigate('/onboarding/basic-information');
            
        } catch (error) {
            console.error("Error checking onboarding status:", error);
            
            let errorMessage = "Something went wrong. Please try again.";
            
            if (error.message === 'Request timeout') {
                errorMessage = "Request timed out. Please check your connection and try again.";
            } else if (error.response?.status === 401) {
                errorMessage = "Authentication required. Please log in again.";
            } else if (error.response?.status === 404) {
                errorMessage = "No restaurant data found. Starting fresh setup.";
            }
            
            message.error(errorMessage);
            
            // For certain errors, we can still proceed to onboarding
            if (error.response?.status === 404 || error.message === 'Request timeout') {
                console.log('Proceeding to Basic Information despite error');
                navigate('/onboarding/basic-information');
            } else {
                // For other errors, stay on current page and let user retry
                console.log('Staying on current page due to error');
            }
        } finally {
            setIsChecking(false);
        }
    };

    // Auto-navigate if onboarding status is already known
    useEffect(() => {
        if (onboardingStatus === 'complete') {
            console.log('✅ Onboarding already complete - redirecting to dashboard');
            navigate('/dashboard');
        } else if (onboardingStatus === 'incomplete') {
            console.log('⚠️ Onboarding incomplete - user can proceed with setup');
        }
    }, [onboardingStatus, navigate]);

    // Auto-reset stuck loading state after 10 seconds
    useEffect(() => {
        if (onboardingLoading) {
            const timer = setTimeout(() => {
                console.log('⚠️ Loading state stuck for 10 seconds, auto-resetting...');
                forceResetOnboardingLoading();
            }, 10000);
            
            return () => clearTimeout(timer);
        }
    }, [onboardingLoading]);

    // Show loading state if needed
    if (shouldShowLoading) {
        return <LoadingSpinner message="Loading onboarding data..." />;
    }

    return (
        <>
            <StoreDebugger />
            <div className="min-h-screen flex flex-col lg:flex-row">
                {/* Content Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-0">
                <div className="w-full max-w-sm mx-auto">
                    <div className="flex flex-col gap-4 sm:gap-6">
                        <div>
                        <button className="flex items-center gap-2 text-gray-700 !mb-0">
                        <FaArrowLeftLong />
                        Go Back
                        </button>
                        </div>
                        {/* Header */}
                        <div className="flex flex-col gap-2 sm:gap-2">
                            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-[22px] font-bold leading-tight !mb-0 !font-bold">
                                Is Your Restaurant Already on Growlio?
                            </h1>
                            <h2 className="text-base sm:text-lg lg:text-xl xl:text-[18px] !font-bold text-gray-800 leading-tight !mb-0">
                                Let us know how you'd like to get started.
                            </h2>
                        </div>
                        <div className="flex flex-col gap-6 sm:gap-8">
                        <div className="border border-gray-300 rounded-lg p-4 sm:p-6">
                                <div className="flex items-center gap-2">
                                    <Checkbox />
                                    <span className="text-sm sm:text-base font-bold">Yes, My Restaurant Exists</span>

                                </div>
                                <p className="text-sm sm:text-base font-regular text-gray-700 leading-relaxed !mb-0 mt-1">Claim and manage an existing listing.</p>

                            </div>
                            <div className="border border-gray-300 rounded-lg p-4 sm:p-6">
                                <div className="flex items-center gap-2">
                                    <Checkbox />
                                    <span className="text-sm sm:text-base font-bold">No, I Want to Create a New One</span>

                                </div>
                                <p className="text-sm sm:text-base font-regular text-gray-700 leading-relaxed !mb-0 mt-1"> Register a new restaurant on Growlio.</p>

                            </div>
                        </div>

                    {/* Button */}
                    <div className="mt-4 sm:mt-6">
                        <PrimaryBtn 
                            title={isChecking ? "Checking..." : "Continue"} 
                            className="btn-brand w-full text-sm sm:text-base py-3 sm:py-4" 
                            onClick={handleSubmit}
                            disabled={isChecking || onboardingLoading}
                        />
                    </div>
                    </div>
                </div>
            </div>

            {/* Image Section - Hidden on mobile, visible on lg and above */}
            <div className="hidden lg:block w-full lg:w-1/2 relative">
                <ImageLayout>
                    <div className="relative w-full h-full flex items-end justify-center">
                        <img
                            src={OnBoard}
                            alt="onboarding "
                            className="h-[calc(100vh-100px)]"
                        />
                    </div>
                </ImageLayout>
            </div>
        </div>
        </>
    );
};

export default OnboardingWrapper;
