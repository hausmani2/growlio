import Header from "../../layout/Header";
import Card from "../../../assets/pngs/cafe.png";
import PrimaryBtn from "../../buttons/Buttons";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { message } from "antd";
import { apiGet } from "../../../utils/axiosInterceptors";

const CompleteSteps = () => {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(false);

    const handleGoToDashboard = async () => {
        setIsChecking(true);
        
        try {
            
            // Call the API to check final onboarding status
            const response = await apiGet('/restaurant/restaurants-onboarding/');
            const onboardingData = response.data;
            
            
            // Check if user has restaurants with completed onboarding
            if (onboardingData && onboardingData.restaurants && onboardingData.restaurants.length > 0) {
                const hasCompletedOnboarding = onboardingData.restaurants.some(restaurant => 
                    restaurant.onboarding_complete === true
                );
                
                if (hasCompletedOnboarding) {
                    message.success("Welcome to your dashboard!");
                    navigate('/dashboard/budget');
                } else {
                    message.warning("Please wait while we finalize your setup...");
                    // Stay on the completion page for now
                }
            } else {
                message.info("Redirecting to dashboard...");
                navigate('/dashboard/budget');
            }
            
        } catch (error) {
            console.error("Error checking final onboarding status:", error);
            message.error("Something went wrong. Please try again.");
            // Fallback to dashboard
            navigate('/dashboard/budget');
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 sm:gap-6 px-4 sm:px-5 h-screen bg-white">
           <Header />
           <div className="flex flex-col gap-4 sm:gap-5 container mx-auto justify-center items-center h-full px-4 sm:px-0">
            <div className="flex flex-col justify-center items-center gap-2 text-center">
                <h2 className="text-xl sm:text-2xl !font-bold !mb-0"> 🎉 Congratulations!</h2>
                <div className="flex items-center flex-col gap-1">
                    <span className="text-sm sm:text-base font-medium text-neutral-600">You've successfully completed all your restaurant setup details.</span>
                    <span className="text-sm sm:text-base font-medium text-neutral-600">Your dashboard is now ready — start exploring, managing, and growing your business!</span>
                </div>
            </div>
            <img src={Card} alt="cafe" className="w-full max-w-[300px] sm:max-w-[400px] h-auto max-h-[300px] sm:max-h-[370px] object-cover" />

            <PrimaryBtn 
                title={isChecking ? "Checking..." : "Go to Dashboard"} 
                className="btn-brand w-full max-w-[300px] sm:max-w-[500px] text-sm sm:text-base py-3 sm:py-4" 
                onClick={handleGoToDashboard}
                disabled={isChecking}
            />
           </div>
        </div>
    )
}

export default CompleteSteps;