import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeftLong } from 'react-icons/fa6';
import { message } from 'antd';
import growlioLogo from '../../assets/svgs/growlio-logo.png';
import PlansWrapper from '../mainSceens/plans/PlansWrapper';
import LoadingSpinner from '../layout/LoadingSpinner';
import useStore from '../../store/store';
import {
  ONBOARDING_ROUTES,
  shouldAutoZeroProfitabilityFromSimulation,
  ZERO_PROFITABILITY_PAYLOAD,
  isPaidPosPlan,
  getConnectPosRoute,
  readConnectPosReturn,
  clearPosUpgradeReturn,
} from '../../utils/onboardingUtils';
import { isImpersonating } from '../../utils/tokenManager';

const OnboardingPlansPage = () => {
  const navigate = useNavigate();
  const logout = useStore((state) => state.logout);
  const stopImpersonation = useStore((state) => state.stopImpersonation);
  const createSalesInformation = useStore((state) => state.createSalesInformation);
  const getRestaurantOnboarding = useStore((state) => state.getRestaurantOnboarding);
  const impersonating = isImpersonating();
  const [isSubmittingZeros, setIsSubmittingZeros] = useState(false);

  const handleContinue = async () => {
    clearPosUpgradeReturn();
    const goToConnectPos = (upgraded = false) => {
      const stored = readConnectPosReturn();
      const route = getConnectPosRoute({
        from: stored.from || 'budget',
        next: stored.next || ONBOARDING_ROUTES.DASHBOARD_BUDGET,
      });
      const separator = route.includes('?') ? '&' : '?';
      navigate(upgraded ? `${route}${separator}upgraded=1` : route, { replace: true });
    };

    // Simulation → restaurant: silently Finish profitability with all zeros, then POS/plan choice
    if (shouldAutoZeroProfitabilityFromSimulation()) {
      setIsSubmittingZeros(true);
      try {
        const result = await createSalesInformation(ZERO_PROFITABILITY_PAYLOAD);
        if (!result?.success) {
          message.error(result?.error || 'Failed to complete setup. Please try again.');
          setIsSubmittingZeros(false);
          return;
        }

        const locationId = useStore.getState().selectedLocationId;
        await getRestaurantOnboarding(true, locationId || undefined);
        goToConnectPos(isPaidPosPlan(
          useStore.getState().subscriptionDetails?.package || useStore.getState().currentPackage
        ));
      } catch (error) {
        console.error('Error auto-submitting zero profitability score:', error);
        message.error(error?.message || 'Failed to complete setup. Please try again.');
        setIsSubmittingZeros(false);
      }
      return;
    }

    const currentPlan =
      useStore.getState().subscriptionDetails?.package || useStore.getState().currentPackage;
    goToConnectPos(isPaidPosPlan(currentPlan));
  };

  const handleStopImpersonation = async () => {
    try {
      const result = await stopImpersonation();
      if (!result?.success) {
        message.error(result?.error || 'Failed to stop impersonation');
        return;
      }
      window.location.href = '/superadmin/dashboard';
    } catch (error) {
      message.error('Failed to stop impersonation');
    }
  };

  if (isSubmittingZeros) {
    return <LoadingSpinner message="Setting up your restaurant..." />;
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(ONBOARDING_ROUTES.CONNECT_POS)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium"
          >
            <FaArrowLeftLong className="text-sm" />
            <span>Go Back</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 font-medium p-1"
          >
            Logout
          </button>
        </div>

        {impersonating && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-amber-900">Impersonation active</span>
            <button
              onClick={handleStopImpersonation}
              className="px-3 py-1 text-xs font-medium rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Back to Superadmin Dashboard
            </button>
          </div>
        )}

        <div className="mb-8 flex justify-center">
          <img src={growlioLogo} alt="Growlio Logo" className="w-56" />
        </div>

        <PlansWrapper
          onboardingMode
          title="Choose a plan to connect your POS"
          subtitle="Grow and Pro can import sales and labor from Square. Free lets you enter your budget by hand."
          onContinue={handleContinue}
        />
      </div>
    </div>
  );
};

export default OnboardingPlansPage;
