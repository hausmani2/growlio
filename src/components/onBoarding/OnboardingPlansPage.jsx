import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeftLong } from 'react-icons/fa6';
import { message } from 'antd';
import growlioLogo from '../../assets/svgs/growlio-logo.png';
import PlansWrapper from '../mainSceens/plans/PlansWrapper';
import useStore from '../../store/store';
import { ONBOARDING_ROUTES } from '../../utils/onboardingUtils';
import { isImpersonating } from '../../utils/tokenManager';

const OnboardingPlansPage = () => {
  const navigate = useNavigate();
  const logout = useStore((state) => state.logout);
  const stopImpersonation = useStore((state) => state.stopImpersonation);
  const impersonating = isImpersonating();

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

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(ONBOARDING_ROUTES.ONBOARDING)}
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
          title="Choose Your Plan"
          subtitle="Start with the free plan, then upgrade when your restaurant is ready for more tools."
          onContinue={() => navigate(ONBOARDING_ROUTES.SCORE, { replace: true })}
        />
      </div>
    </div>
  );
};

export default OnboardingPlansPage;
