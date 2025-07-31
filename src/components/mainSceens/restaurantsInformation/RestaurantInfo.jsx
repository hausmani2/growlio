import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../layout/Header";
import DetailsTab from "./DetailsTab";
import { TabProvider } from "./TabContext";
import { useTabHook } from "./useTabHook";
import useStore from "../../../store/store";

const RestaurantContent = () => {
    const navigate = useNavigate();
    const { renderActiveContent } = useTabHook();
    const { isAuthenticated, token, onboardingLoading: loading, onboardingStatus } = useStore();

    // Check authentication before rendering content
    useEffect(() => {
        console.log("=== Authentication Check ===");
        console.log("isAuthenticated:", isAuthenticated);
        console.log("token exists:", !!token);
        console.log("localStorage token:", !!localStorage.getItem('token'));
        
        // Check if user is authenticated
        const isUserAuthenticated = isAuthenticated || !!localStorage.getItem('token');
        
        if (!isUserAuthenticated) {
            console.log("❌ User not authenticated - redirecting to login");
            navigate('/login', { replace: true });
            return;
        }
        
        console.log("✅ User authenticated - proceeding with content");
    }, [isAuthenticated, token, navigate]);



    return (
        <div className="flex flex-col bg-white">
            <Header />

            <div className="flex flex-col">
                <div className=" mx-auto container  max-w-[1400px] px-10 py-4">
                    <DetailsTab />
                </div>
                <div className="w-full bg-gray-100 h-full">
                    <div className="flex flex-col gap-2 mx-auto p-2 container   max-w-[1400px] px-10">
                        
                        {loading && onboardingStatus !== 'incomplete' && onboardingStatus !== null ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-lg">Loading onboarding data...</div>
                            </div>
                        ) : (
                            renderActiveContent()
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const RestaurantInfo = () => {
    return (
        <TabProvider>
            <RestaurantContent />
        </TabProvider>
    );
};

export default RestaurantInfo;