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
    
    // Don't show loading for new users (incomplete or null status)
    const isNewUser = onboardingStatus === 'incomplete' || onboardingStatus === null;
    
    const handleSubmit = async () => {
        setIsChecking(true);
        
        try {
            console.log("📋 User clicking Continue - checking onboarding status...");
            
            // For new users, we can skip the API call and go directly to basic information
            if (onboardingStatus === 'incomplete' || onboardingStatus === null) {
                console.log('✅ New user detected - proceeding directly to Basic Information');
                message.success("Welcome! Let's set up your restaurant.");
                navigate('/onboarding/basic-information');
                return;
            }
            
            // Use the onboarding status from store if available, otherwise make API call
            let onboardingData;
            
            if (onboardingStatus === 'loading') {
                // Wait for the existing check to complete
                console.log('⏳ Waiting for existing onboarding status check...');
                message.info("Please wait while we check your status...");
                return;
            }
            
            // Use cached status from store
            console.log('✅ Using cached onboarding status from store');
            const result = await checkOnboardingStatus();
            onboardingData = result;
            
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
                        navigate('/dashboard/summary');
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
            navigate('/dashboard/summary');
        } else if (onboardingStatus === 'incomplete' || onboardingStatus === null) {
            console.log('⚠️ New user or onboarding incomplete - user can proceed with setup');
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
    if (shouldShowLoading && !isNewUser) {
        return <LoadingSpinner message="Loading onboarding data..." />;
    }

    return (
        <>
            <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
                {/* Content Section - Improved responsive design */}
                <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-0 min-h-screen lg:min-h-0">
                    <div className="w-full max-w-md mx-auto flex flex-col h-full justify-center">
                        <div className="flex flex-col gap-6 sm:gap-8 bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10">
                            {/* Back Button */}
                            <div>
                                <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium">
                                    <FaArrowLeftLong className="text-sm" />
                                    <span className="hidden sm:inline">Go Back</span>
                                </button>
                            </div>
                            
                            {/* Header */}
                            <div className="flex flex-col gap-3">
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-gray-900">
                                    Is Your Restaurant Already on Growlio?
                                </h1>
                                <h2 className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                                    Let us know how you'd like to get started.
                                </h2>
                            </div>
                            
                            {/* Options */}
                            <div className="flex flex-col gap-4 sm:gap-6">
                                <div className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 bg-gray-50 opacity-60">
                                    <div className="flex items-center gap-3">
                                        <Checkbox disabled />
                                        <span className="text-base sm:text-lg font-semibold text-gray-500">
                                            Yes, My Restaurant Exists
                                        </span>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-500 leading-relaxed mt-2 ml-6">
                                        Claim and manage an existing listing.
                                    </p>
                                </div>
                                
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

                            {/* Button */}
                            <div className="mt-6 sm:mt-8">
                                <PrimaryBtn 
                                    title={isChecking ? "Checking..." : "Continue"} 
                                    className="btn-brand w-full text-base sm:text-lg py-4 sm:py-5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300" 
                                    onClick={handleSubmit}
                                    disabled={isChecking || onboardingLoading}
                                />
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
        </>
    );
};

export default OnboardingWrapper;
