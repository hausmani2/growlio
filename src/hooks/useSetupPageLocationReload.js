import { useEffect, useRef } from 'react';
import useStore from '../store/store';

/**
 * Your Setup pages: load onboarding on mount and refetch when the header location changes.
 */
export default function useSetupPageLocationReload(isUpdateMode) {
  const selectedLocationId = useStore((s) => s.selectedLocationId);
  const lastLoadedOnboardingLocationId = useStore(
    (s) => s.lastLoadedOnboardingLocationId
  );
  const loadExistingOnboardingData = useStore((s) => s.loadExistingOnboardingData);
  const onboardingLoading = useStore((s) => s.onboardingLoading);

  const hasInitialLoadRef = useRef(false);
  const skipInitialLocationRef = useRef(true);

  useEffect(() => {
    if (!isUpdateMode || hasInitialLoadRef.current) return;
    hasInitialLoadRef.current = true;
    loadExistingOnboardingData(true).catch(() => {});
  }, [isUpdateMode, loadExistingOnboardingData]);

  useEffect(() => {
    if (!isUpdateMode) return;
    if (skipInitialLocationRef.current) {
      skipInitialLocationRef.current = false;
      return;
    }
    if (!selectedLocationId) return;
    loadExistingOnboardingData(true).catch(() => {});
  }, [selectedLocationId, isUpdateMode, loadExistingOnboardingData]);

  const isStoreDataForSelectedLocation = Boolean(
    selectedLocationId &&
      lastLoadedOnboardingLocationId &&
      lastLoadedOnboardingLocationId === selectedLocationId
  );

  // Only block the page while a fetch is in flight — not when store sync is pending.
  const isLoadingLocationData = isUpdateMode && onboardingLoading;

  return {
    selectedLocationId,
    isStoreDataForSelectedLocation,
    isLoadingLocationData,
    onboardingLoading,
  };
}
