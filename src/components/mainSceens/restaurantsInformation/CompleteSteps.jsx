import Header from "../../layout/Header";
import PrimaryBtn from "../../buttons/Buttons";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { message } from "antd";
import useStore from "../../../store/store";

const CompleteSteps = () => {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    
    // Get the store's onboarding check function
    const forceOnboardingCheck = useStore((state) => state.forceOnboardingCheck);
    const setIsOnBoardingCompleted = useStore((state) => state.setIsOnBoardingCompleted);

    // Check if this is a new user completing onboarding
    useEffect(() => {
        const isNewUserCompleting = sessionStorage.getItem('isNewUserCompletingOnboarding') === 'true';

        
        // Check if user is on onboarding path (indicates new user)
        const isOnboardingPath = window.location.pathname.includes('/onboarding');
        
        if (!isNewUserCompleting && !isOnboardingPath) {
            // This is not a new user and not on onboarding path, redirect to dashboard
            message.info("Redirecting to dashboard...");
            navigate('/dashboard/budget', { replace: true });
            return;
        }
        
        // This is a new user or on onboarding path, show the completion page
        setIsNewUser(true);
        
        // Clear the flag after using it
        sessionStorage.removeItem('isNewUserCompletingOnboarding');
    }, [navigate]);



    const handleGoToDashboard = async () => {
        setIsChecking(true);
        
        try {
            // Use the store's onboarding check function to ensure consistency
            const result = await forceOnboardingCheck();
            
            if (result.success && result.isComplete) {
                // Update the store state to mark onboarding as completed
                setIsOnBoardingCompleted(true);
                
                message.success("Welcome to your dashboard!");
                navigate('/dashboard/budget');
            } else {
                message.warning("Please wait while we finalize your setup...");
                // Stay on the completion page for now
            }
            
        } catch (error) {
            console.error("❌ CompleteSteps - Error checking final onboarding status:", error);
            message.error("Something went wrong. Please try again.");
            // Fallback to dashboard
            navigate('/dashboard/budget');
        } finally {
            setIsChecking(false);
        }
    };

    // Don't render anything if not a new user (will redirect)
    if (!isNewUser) {
        return null;
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6 px-4 sm:px-5  bg-white ">
           <Header />
           <div className="flex flex-col gap-6 sm:gap-8 container mx-auto justify-center items-center h-full px-4 sm:px-0 max-w-4xl py-3">
            
            {/* Header Section */}
            <div className="flex flex-col justify-center items-center gap-3 text-center">
                <h2 className="text-2xl sm:text-3xl !font-bold !mb-0 text-gray-800">🎉 Great job getting your restaurant set up in Growlio!</h2>
                <p className="text-base sm:text-lg font-medium text-neutral-600 max-w-2xl">
                    You're ready to take the next step toward running profitably.
                </p>
            </div>

            {/* Main Guide Content */}
            <div className="w-full max-w-4xl space-y-3">
                
                {/* What to do next section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-4">Here's what to do next:</h3>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                            <div>
                                <p className="font-semibold text-blue-800">Pick your starting week</p>
                                <p className="text-sm text-blue-700">In Growlio, every week runs from Sunday through Saturday.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                            <div>
                                <p className="font-semibold text-blue-800">Enter your estimated daily sales</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sales Entry Steps */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-4">To enter your daily sales, it's really simple:</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                            <div>
                                <p className="font-semibold text-green-800">From the Dashboard Menu, select Budget.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                            <div>
                                <p className="font-semibold text-green-800">Click Add Sales.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                            <div>
                                <p className="font-semibold text-green-800">A window will pop up asking you to select which days you're open that week</p>
                                <p className="text-sm text-green-700">(this way, if you're closed for a holiday or any other reason, Growlio knows to skip those days).</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</div>
                            <div>
                                <p className="font-semibold text-green-800">Manually enter your budgeted sales—what you anticipate your sales to be each day—and then click Save Sales Data.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Congratulations Section */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-yellow-800 mb-4">🎉 Congratulations!</h3>
                    <p className="text-yellow-800 mb-4">
                        Growlio has now populated your information on the Budget Dashboard. On this screen, you'll see:
                    </p>
                    <ul className="space-y-2 text-yellow-800">
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-600 font-bold">•</span>
                            <span>Your labor and food cost budgets based on the sales estimates you entered</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-600 font-bold">•</span>
                            <span>A projection of your profit or loss by day, calculated from those budgets</span>
                        </li>
                    </ul>
                    <p className="text-yellow-800 mt-4">
                        This gives you a clear, actionable plan for the week so you can stay on top of your numbers and keep your restaurant profitable.
                    </p>
                </div>

                {/* Next Steps Section */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-purple-800 mb-4">Now the real magic begins! ✨</h3>
                    <p className="text-purple-800 mb-4">
                        The next step is to start entering your actual daily numbers. This is where Growlio really shines—by showing you exactly how your real sales, food costs, and labor costs compare to your budget.
                    </p>
                    
                    <h4 className="font-semibold text-purple-800 mb-2">Here's why this matters:</h4>
                    <ul className="space-y-2 text-purple-800 mb-4">
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>You'll instantly see if you're on track or overspending.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>You'll know your profitability in real time, not after the week is over.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>And best of all—you'll have the chance to make smart adjustments while the week is still in progress.</span>
                        </li>
                    </ul>
                    
                    <p className="text-purple-800">
                        When you're ready, head to the <strong>Enter Weekly Data</strong> section on your dashboard. Enter your actual sales, food, and labor every day—it only takes a minute. Each entry keeps your dashboard up to date so Growlio can guide you toward hitting your profit goals.
                    </p>
                </div>
            </div>

            {/* Action Button */}
            <div className="w-full flex justify-center">
                <PrimaryBtn 
                    title={isChecking ? "Checking..." : "Go to Dashboard"} 
                    className="btn-brand w-full max-w-[300px] sm:max-w-[500px] text-sm sm:text-base py-3 sm:py-4" 
                    onClick={handleGoToDashboard}
                    disabled={isChecking}
                />
            </div>
           </div>
        </div>
    );
};

export default CompleteSteps;