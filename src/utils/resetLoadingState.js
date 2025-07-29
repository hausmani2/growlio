import useStore from '../store/store';

// Utility function to reset all loading states
export const resetAllLoadingStates = () => {
  const store = useStore.getState();
  
  // Reset all loading states
  useStore.setState({
    loading: false,
    error: null,
    onboardingLoading: false,
    onboardingError: null,
    onboardingStatus: null
  });
  
  console.log('🔄 All loading states reset');
  return true;
};

// Utility function to check current loading states
export const checkLoadingStates = () => {
  const store = useStore.getState();
  
  const loadingStates = {
    auth: {
      loading: store.loading,
      error: store.error
    },
    onboarding: {
      onboardingLoading: store.onboardingLoading,
      onboardingError: store.onboardingError,
      onboardingStatus: store.onboardingStatus
    }
  };
  
  console.log('📊 Current Loading States:', loadingStates);
  return loadingStates;
};

// Utility function to force reset onboarding loading
export const forceResetOnboardingLoading = () => {
  useStore.setState({
    onboardingLoading: false,
    onboardingError: null
  });
  
  console.log('🔄 Onboarding loading state force reset');
  return true;
}; 