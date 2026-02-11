import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../layout/Header";
import SimulationDetailsTab from "./SimulationDetailsTab";
import { SimulationTabProvider } from "./SimulationTabContext";
import { useSimulationTabHook } from "./hooks/useSimulationTabHook";
import useStore from "../../store/store";
import LoadingSpinner from "../layout/LoadingSpinner";

const SimulationRestaurantContent = () => {
    const navigate = useNavigate();
    const { renderActiveContent, isLoading } = useSimulationTabHook();
    const { isAuthenticated, token } = useStore();

    // Check authentication before rendering content
    useEffect(() => {
        // Check if user is authenticated
        const isUserAuthenticated = isAuthenticated || !!localStorage.getItem('token');
        
        if (!isUserAuthenticated) {
            navigate('/login', { replace: true });
            return;
        }
    }, [isAuthenticated, token, navigate]);

    return (
        <div className="flex flex-col bg-white">
            <Header />

            <div className="flex flex-col">
                <div className="mx-auto container max-w-[1400px] px-10 py-4">
                    <SimulationDetailsTab />
                </div>
                <div className="w-full bg-gray-100 h-full">
                    <div className="flex flex-col gap-2 mx-auto p-2 container max-w-[1400px] px-10">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <LoadingSpinner 
                                    message="Loading simulation data..." 
                                    size="medium" 
                                    subtext="Please wait while we load your information..."
                                    showSubtext={true}
                                />
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

const SimulationRestaurantInfo = () => {
    return (
        <SimulationTabProvider>
            <SimulationRestaurantContent />
        </SimulationTabProvider>
    );
};

export default SimulationRestaurantInfo;
