import React, { useState } from "react";
import OnBoard from "../../assets/pngs/onBoard.png"

import ImageLayout from "../imageWrapper/ImageLayout";
import PrimaryBtn from "../buttons/Buttons";
import { Checkbox } from "antd";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import { message } from "antd";

const OnboardingWrapper = () => {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(false);
    const { checkOnboardingStatus } = useStore();
    
    const handleSubmit = async () => {
        setIsChecking(true);
        
        try {
            console.log("📋 User clicking Continue - checking onboarding status...");
            
            // Check onboarding status to ensure proper routing
            const result = await checkOnboardingStatus();
            
            if (result.success) {
                const isComplete = result.onboarding_complete;
                
                if (isComplete) {
                    console.log("✅ User has completed onboarding - redirecting to dashboard");
                    message.success("Welcome back! Redirecting to your dashboard...");
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1000);
                } else {
                    console.log("📋 User needs to complete onboarding - redirecting to Basic Information");
                    navigate('/onboarding/basic-information');
                }
            } else {
                console.log("⚠️ Onboarding check failed - proceeding to Basic Information");
                navigate('/onboarding/basic-information');
            }
        } catch (error) {
            console.error("Error checking onboarding status:", error);
            message.error("Something went wrong. Please try again.");
            // Fallback to Basic Information
            navigate('/onboarding/basic-information');
        } finally {
            setIsChecking(false);
        }
    };
        return (
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
                            disabled={isChecking}
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
        </div >
    );
};

export default OnboardingWrapper;
