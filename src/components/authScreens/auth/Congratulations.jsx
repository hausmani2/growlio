import React, { useEffect, useState } from "react";
import Mask from "../../../assets/pngs/new-onboard.png"
import PrimaryBtn from "../../buttons/Buttons";
import { useNavigate } from "react-router-dom";
import useStore from "../../../store/store";
import LoadingSpinner from "../../layout/LoadingSpinner";
import ImageLayout from "../../imageWrapper/ImageLayout";
import GuidanceOverlay from "../../guidance/GuidanceOverlay";

const Congratulations = () => {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);

    // Zustand store hooks
    const {
        isAuthenticated,
        checkOnboardingCompletion,
        getSalesInformation,
        salesInformationData,
        forceOnboardingCheck
    } = useStore();
    
    // Helper function to check if sales information exists
    const hasSalesInformation = () => {
        if (!salesInformationData) return false;
        const data = extractSalesData(salesInformationData);
        if (!data) return false;
        return (
            data.sales != null &&
            data.expenses != null &&
            data.labour != null &&
            data.cogs != null
        );
    };

    // Helper function to extract and check sales data
    const extractSalesData = (data) => {
        if (Array.isArray(data) && data.length > 0) {
            return data[0];
        }
        if (data?.results) {
            return typeof data.results === 'object' ? data.results : (Array.isArray(data.results) ? data.results[0] : null);
        }
        if (data?.data) {
            return Array.isArray(data.data) ? data.data[0] : data.data;
        }
        if (data && typeof data === 'object' && ('sales' in data || 'cogs' in data)) {
            return data;
        }
        return null;
    };

    // Check authentication, sales information, and onboarding status on component mount
    useEffect(() => {
        const checkAuthAndOnboarding = async () => {
            if (!isAuthenticated) {
                navigate('/login');
                return;
            }

            // Fetch sales information if not in store
            const currentSalesData = useStore.getState().salesInformationData;
            if (!currentSalesData) {
                try {
                    await getSalesInformation();
                } catch (error) {
                    console.error('Error fetching sales information:', error);
                }
            }

            // Check if sales information exists
            const updatedSalesData = useStore.getState().salesInformationData;
            if (updatedSalesData) {
                const salesData = extractSalesData(updatedSalesData);
                if (salesData) {
                    const hasAllData = (
                        salesData.sales != null &&
                        salesData.expenses != null &&
                        salesData.labour != null &&
                        salesData.cogs != null
                    );
                    
                    if (hasAllData) {
                        navigate('/dashboard/report-card');
                        setIsChecking(false);
                        return;
                    }
                }
            }

            // Check onboarding completion
            try {
                const result = await checkOnboardingCompletion();
                if (result.success && result.isComplete) {
                    navigate('/dashboard/report-card');
                }
            } catch (error) {
                console.error('Error checking onboarding status:', error);
            } finally {
                setIsChecking(false);
            }
        };

        checkAuthAndOnboarding();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, navigate]);

    // Show loading spinner while checking authentication and onboarding status
    if (isChecking) {
        return <LoadingSpinner message="Checking your setup..." />;
    }

    return (
        <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex flex-col lg:flex-row">
            {/* Content Section - Left Side */}
            <div className="w-full h-screen lg:w-1/2 flex items-center justify-center px-2 sm:px-2 lg:px-4 bg-gradient-to-br from-orange-50 to-orange-100">
                <div className="w-full max-w-lg mx-auto">
                    <div className="flex flex-col gap-2">
                        {/* Header */}
                        <div className="flex flex-col gap-3" >
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600 leading-tight">
                                Welcome to Growlio
                            </h1>
                        </div>

                        {/* Description */}
                        <div className="space-y-4 text-gray-700 leading-relaxed" >
                            <p className="text-sm sm:text-base">
                                Running a restaurant is tough—but managing your numbers doesn't have to be. That's why we built Growlio: a simple budgeting tool designed to help you stay profitable and in control.
                            </p>

                            <p className="text-sm sm:text-base flex flex-col">
                                <strong>Here's the deal</strong>
                                Restaurants live and die by three things—sales, food costs, and labor costs. Food and labor are your biggest expenses, and the key is keeping them in line with your sales. It's not about the dollar amount—it's about the percentage.
                            </p>

                            <p className="text-sm sm:text-base flex flex-col">
                                <strong>Example</strong>
                               If you do $10,000 in sales this week and your food cost target is 30%, you should only spend about $3,000 on food. If sales dip to $8,000, your food budget drops to $2,400. Same goes for labor. When sales go up, you can spend more. When sales go down, you have to spend less. That's how you stay profitable.
                            </p>

                            <p className="text-sm sm:text-base flex flex-col">
                                <strong>Growlio makes this easy</strong>
                                 At the start of each week, you enter your sales goal. Based on the food and labor targets you set during setup, Growlio gives you clear weekly budgets. Each day, you enter your actual sales, food costs, and labor costs, and Growlio automatically updates your budgets—so you always know exactly where you stand.
                            </p>

                            <p className="text-sm sm:text-base flex flex-col">
                                <strong>Just stick to your percentages</strong>
                                Growlio will help you spot problems early and fix them before they turn into headaches.
                            </p>
                        </div>
                        {/* Button */}
                        <div className="space-y-4 mt-4">
                            <PrimaryBtn
                                title="Let's get started!"
                                className="btn-brand w-full text-lg py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                                onClick={() => {
                                    // Check if sales information exists - if yes, redirect to dashboard
                                    if (hasSalesInformation()) {
                                        navigate('/dashboard/report-card');
                                    } else {
                                        navigate('/onboarding');
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>





            {/* Image Section */}
            <div className="hidden lg:block w-full lg:w-1/2 relative">
                <ImageLayout>
                    <div className="relative flex items-end justify-center">
                        <img
                            src={Mask}
                            className="h-[calc(100vh-100px)] object-contain"
                            alt="Staff illustration"
                        />
                    </div>
                    </ImageLayout>
            </div>
            <GuidanceOverlay />
        </div>
    );
};

export default Congratulations;
