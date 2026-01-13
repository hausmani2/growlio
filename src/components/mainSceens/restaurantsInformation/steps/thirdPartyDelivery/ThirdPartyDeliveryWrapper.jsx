import { useEffect, useState } from "react";
import { message } from "antd";
import { TabProvider } from "../../TabContext";
import useStore from "../../../../../store/store";
import useStepValidation from "../useStepValidation";
import { useLocation } from "react-router-dom";
import LoadingSpinner from "../../../../layout/LoadingSpinner";
import ThirdPartyDelivery from "./ThirdPartyDelivery";
import { useTabHook } from "../../useTabHook";
import { useNavigate } from "react-router-dom";

const ThirdPartyDeliveryWrapperContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    submitStepData,
    onboardingLoading: loading,
    onboardingError: error,
    clearError,
    completeOnboardingData,
  } = useStore();

  const { validationErrors, clearFieldError, validateStep } = useStepValidation();
  const { navigateToNextStep } = useTabHook();

  // Update mode when accessed from sidebar
  const isUpdateMode = !location.pathname.includes("/onboarding");

  const [thirdPartyData, setThirdPartyData] = useState({
    third_party: false,
    providers: [],
  });

  // Get selectedDays from Sales Channels data
  const getSelectedDays = () => {
    const salesChannelsInfoData = completeOnboardingData["Sales Channels"];
    if (salesChannelsInfoData && salesChannelsInfoData.data) {
      const data = salesChannelsInfoData.data;
      
      // Default: all days are open
      let selectedDays = {
        Sunday: true,
        Monday: true,
        Tuesday: true,
        Wednesday: true,
        Thursday: true,
        Friday: true,
        Saturday: true
      };

      // If restaurant_days is returned from API, those are the CLOSED days
      if (data.restaurant_days && Array.isArray(data.restaurant_days)) {
        // Mark returned days as CLOSED (false)
        data.restaurant_days.forEach(day => {
          const dayName = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
          if (selectedDays.hasOwnProperty(dayName)) {
            selectedDays[dayName] = false; // Closed
          }
        });
      }
      
      return selectedDays;
    }
    
    // Default: all days open if no data exists
    return {
      Sunday: true,
      Monday: true,
      Tuesday: true,
      Wednesday: true,
      Thursday: true,
      Friday: true,
      Saturday: true
    };
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const salesChannelsInfoData = completeOnboardingData["Sales Channels"];
    if (salesChannelsInfoData && salesChannelsInfoData.data) {
      const data = salesChannelsInfoData.data;
      let processedProviders = [];
      if (data.providers && Array.isArray(data.providers)) {
        processedProviders = data.providers.map((provider, index) => {
          let providerFee = provider.provider_fee || provider.providerFee || "";
          if (providerFee && !isNaN(providerFee)) {
            providerFee = parseInt(providerFee, 10).toString();
          }
          return {
            id: provider.id || Date.now() + index + Math.random(),
            providerName: provider.provider_name || provider.providerName || "",
            providerFee: providerFee,
          };
        });
      }

      setThirdPartyData({
        // In this dedicated screen, treat it as enabled when user is managing providers
        third_party: true,
        providers: processedProviders,
      });
    }
  }, [completeOnboardingData]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  const updateData = (field, value) => {
    setThirdPartyData((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleSave = async () => {
    const selectedDays = getSelectedDays();
    const isValid = validateStep("Sales Channels", {
      third_party: thirdPartyData.third_party,
      providers: thirdPartyData.providers,
      in_store: true,
      online: false,
      from_app: false,
      selectedDays: selectedDays,
    });

    if (!isValid) {
      const firstError = Object.values(validationErrors)[0];
      message.error(firstError);
      return false;
    }

    const stepData = {
      third_party: thirdPartyData.third_party,
    };

    if (thirdPartyData.third_party && thirdPartyData.providers) {
      const providersForAPI = thirdPartyData.providers
        .filter((p) => p.providerName && p.providerFee)
        .map((p) => ({
          provider_name: p.providerName,
          provider_fee: parseInt(p.providerFee, 10),
        }));
      if (providersForAPI.length > 0) stepData.providers = providersForAPI;
    }

    const result = await submitStepData("Sales Channels", stepData, () => {
      message.success("Third-party delivery updated successfully!");
    });

    if (!result.success) {
      message.error("Failed to save third-party delivery. Please try again.");
      return false;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
          <LoadingSpinner message="Saving third-party delivery..." size="medium" />
        </div>
        <div className="opacity-50 pointer-events-none">
          <ThirdPartyDelivery data={thirdPartyData} updateData={updateData} errors={validationErrors} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      {/* Header card (matches onboarding screenshot style) */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="text-xs text-gray-400 mb-2">Onboarding / Third- party Delivery Information</div>
        <div className="text-lg font-bold text-orange-600">Third- party Delivery Information</div>
        <div className="text-xs text-gray-600 mt-1">Add your Third-party delivery services below.</div>
      </div>

      {/* Content card */}
      <ThirdPartyDelivery data={thirdPartyData} updateData={updateData} errors={validationErrors} />

      {/* Footer buttons (Skip / Next) */}
      {!isUpdateMode ? (
        <div className="flex justify-end gap-3 mt-8">
          <button
            className="px-10 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
            onClick={() => {
              navigate('/dashboard/budget');
            }}
          >
            Skip
          </button>
          <button
            className="px-10 py-2.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600"
            onClick={async () => {
              const ok = await handleSave();
              if (ok) navigateToNextStep(true);
            }}
            disabled={loading}
          >
            Next
          </button>
        </div>
      ) : (
        <div className="flex justify-end gap-3 mt-8 pt-6">
          <button
            onClick={() => {
           
              navigate('/dashboard/budget');
            }}
            className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            disabled={loading}
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
};

const ThirdPartyDeliveryWrapper = () => (
  <TabProvider>
    <ThirdPartyDeliveryWrapperContent />
  </TabProvider>
);

export default ThirdPartyDeliveryWrapper;


