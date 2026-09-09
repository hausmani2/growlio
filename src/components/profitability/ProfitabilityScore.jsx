import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeftLong } from "react-icons/fa6";
import growlioLogo from "../../assets/svgs/growlio-logo.png";
import { CheckOutlined } from '@ant-design/icons';
import { message } from "antd";
import useStore from "../../store/store";
import { isImpersonating } from "../../utils/tokenManager";
import LoadingSpinner from "../layout/LoadingSpinner";
import OnboardingPosImport from "./OnboardingPosImport";
import {
    ONBOARDING_ROUTES,
    shouldAutoZeroProfitabilityFromSimulation,
    clearAutoZeroProfitabilityFromSimulation,
    ZERO_PROFITABILITY_PAYLOAD,
} from "../../utils/onboardingUtils";
import { getRoleLandingRoute } from "../../utils/rolePermissions";

const getPlanName = (plan) =>
    String(plan?.key || plan?.name || plan?.display_name || plan?.package_name || '')
        .trim()
        .toLowerCase();

const isPaidPosPlan = (planName) => planName.includes('grow') || planName.includes('pro');

const ProfitabilityScore = () => {
    const navigate = useNavigate();
    const [isAutoZeroing, setIsAutoZeroing] = useState(() =>
        shouldAutoZeroProfitabilityFromSimulation()
    );
    const stopImpersonation = useStore((state) => state.stopImpersonation);
    const createSalesInformation = useStore((state) => state.createSalesInformation);
    const getRestaurantOnboarding = useStore((state) => state.getRestaurantOnboarding);
    const user = useStore((state) => state.user);
    const subscriptionDetails = useStore((state) => state.subscriptionDetails);
    const currentPackage = useStore((state) => state.currentPackage);
    const fetchCurrentSubscriptionDetails = useStore((state) => state.fetchCurrentSubscriptionDetails);
    const impersonating = isImpersonating();
    const autoZeroStartedRef = useRef(false);
    const restaurantId = localStorage.getItem('restaurant_id');
    const currentPlanName = getPlanName(subscriptionDetails?.package || currentPackage);
    const canImportFromPos = isPaidPosPlan(currentPlanName);

    useEffect(() => {
        fetchCurrentSubscriptionDetails?.(true);
    }, [fetchCurrentSubscriptionDetails]);

    // Simulation → restaurant: zeros already submitted on Plans — never paint Score UI
    useEffect(() => {
        if (!shouldAutoZeroProfitabilityFromSimulation()) {
            setIsAutoZeroing(false);
            return;
        }
        if (autoZeroStartedRef.current) return;
        autoZeroStartedRef.current = true;
        setIsAutoZeroing(true);

        const run = async () => {
            try {
                // Prefer landing on Report Card immediately; only POST if still needed
                const onboardingData = useStore.getState().restaurantOnboardingData;
                const alreadyHasSales =
                    onboardingData?.restaurants?.[0]?.['One Month Sales Information'] === true;

                if (!alreadyHasSales) {
                    const result = await createSalesInformation(ZERO_PROFITABILITY_PAYLOAD);
                    if (!result?.success) {
                        message.error(result?.error || "Failed to complete setup. Please try again.");
                        clearAutoZeroProfitabilityFromSimulation();
                        setIsAutoZeroing(false);
                        return;
                    }
                    const locationId = useStore.getState().selectedLocationId;
                    await getRestaurantOnboarding(true, locationId || undefined);
                }

                navigate(
                    getRoleLandingRoute(user?.restaurant_role) || ONBOARDING_ROUTES.REPORT_CARD,
                    { replace: true }
                );
            } catch (error) {
                console.error("Error auto-submitting zero profitability score:", error);
                message.error(error?.message || "Failed to complete setup. Please try again.");
                clearAutoZeroProfitabilityFromSimulation();
                setIsAutoZeroing(false);
            }
        };

        run();
    }, [createSalesInformation, getRestaurantOnboarding, navigate, user?.restaurant_role]);

    const handleGetScore = () => {
        navigate('/onboarding/profitability');
    };

    const handleStopImpersonation = async () => {
        try {
            const result = await stopImpersonation();
            if (!result?.success) {
                message.error(result?.error || "Failed to stop impersonation");
                return;
            }
            window.location.href = "/superadmin/dashboard";
        } catch (error) {
            message.error("Failed to stop impersonation");
        }
    };

    const requirements = [
        "Last Months Sales",
        "Last Months Cost of Goods (COGS)",
        "Last Months Labor Expense",
        "Your Monthly Rent"
    ];

    if (isAutoZeroing) {
        return <LoadingSpinner message="Setting up your restaurant..." />;
    }

    return (
        <div className="h-dvh w-full max-w-[100vw] overflow-hidden bg-gray-50 flex flex-col">
            <div className="flex-shrink-0 px-4 pt-4 pb-2 sm:px-8 lg:px-12">
                <div className="mx-auto w-full max-w-4xl">
                    <button
                        type="button"
                        onClick={() => navigate(ONBOARDING_ROUTES.PLANS)}
                        className="flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-gray-800 transition-colors font-medium"
                    >
                        <FaArrowLeftLong className="text-sm" />
                        <span>Back to Plans</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex items-stretch justify-center px-4 pb-4 sm:px-8 sm:pb-6 lg:px-12 lg:pb-8">
                <div className="w-full max-w-3xl lg:max-w-4xl h-full max-h-full bg-white rounded-2xl shadow-lg flex flex-col justify-center [@media(min-height:700px)]:justify-evenly px-6 py-6 sm:px-10 sm:py-8 md:px-12 md:py-10 gap-3 sm:gap-4 md:gap-5">
                    {impersonating && (
                        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 flex items-center justify-between gap-2">
                            <span className="text-sm text-amber-900">Impersonation active</span>
                            <button
                                onClick={handleStopImpersonation}
                                className="px-3 py-1 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
                            >
                                Back to Superadmin
                            </button>
                        </div>
                    )}

                    <div className="flex justify-center">
                        <img
                            src={growlioLogo}
                            alt="Growlio Logo"
                            className="w-44 sm:w-52 md:w-60 lg:w-64 h-auto"
                        />
                    </div>

                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                            Ready to get your{' '}
                            <span className="text-orange-600">Profitability Score?</span>
                        </h1>
                    </div>

                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center">
                            What You&apos;ll Need
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600 text-center mt-1">
                            The more you provide the better. At a minimum 1 month.
                        </p>

                        <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 w-fit max-w-xl mx-auto">
                            {requirements.map((requirement, index) => (
                                <div key={index} className="flex items-center gap-2.5">
                                    <CheckOutlined className="text-green-500 text-base sm:text-lg flex-shrink-0" />
                                    <span className="text-sm sm:text-base md:text-lg text-gray-900 font-medium">
                                        {requirement}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={handleGetScore}
                            className="mx-auto flex items-center justify-center rounded-xl w-52 sm:w-56 md:w-64 py-3 sm:py-3.5 bg-orange-500 text-white font-semibold text-base sm:text-lg hover:bg-orange-600 transition-colors shadow-md"
                        >
                            Get My Score!
                        </button>
                    </div>

                    <OnboardingPosImport
                        restaurantId={restaurantId}
                        planLocked={!canImportFromPos}
                        compact
                    />
                </div>
            </div>
        </div>
    );
};

export default ProfitabilityScore;

