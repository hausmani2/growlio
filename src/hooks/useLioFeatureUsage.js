import { useCallback, useEffect, useMemo, useState } from 'react';
import useStore from '../store/store';
import {
  fetchGrowlioIQUsage,
  remainingLioReviewsCopy,
} from '../services/growlioIqApi';

const getPlanName = (plan) =>
  String(plan?.key || plan?.name || plan?.display_name || plan?.package_name || '')
    .trim()
    .toLowerCase();

const isUnlimitedPlanName = (planName) =>
  planName.includes('grow') || planName.includes('pro');

const emptyFeatureUsage = (unlimited) => ({
  used: 0,
  limit: unlimited ? null : 5,
  remaining: unlimited ? null : 5,
  unlimited,
});

/**
 * Lite: 5 uses per calendar month, per LIO screen. Grow/Pro: unlimited.
 */
const useLioFeatureUsage = (feature) => {
  const fetchCurrentSubscriptionDetails = useStore(
    (s) => s.fetchCurrentSubscriptionDetails
  );
  const [planLoading, setPlanLoading] = useState(true);
  const [planName, setPlanName] = useState('');
  const [featureUsage, setFeatureUsage] = useState(null);

  const applyUsage = useCallback(
    (usage) => {
      const unlimited = Boolean(usage?.unlimited);
      const next = usage?.features?.[feature] || emptyFeatureUsage(unlimited);
      setFeatureUsage({
        used: Number(next.used ?? 0),
        limit: unlimited ? null : Number(next.limit ?? 5),
        remaining: unlimited ? null : Number(next.remaining ?? 0),
        unlimited,
      });
    },
    [feature]
  );

  const lockFeature = useCallback((payload = {}) => {
    setFeatureUsage({
      used: Number(payload.used ?? 5),
      limit: Number(payload.limit ?? 5),
      remaining: 0,
      unlimited: false,
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setPlanLoading(true);
      let name = '';
      try {
        const result = await fetchCurrentSubscriptionDetails?.(false);
        const storeState = useStore.getState();
        name = getPlanName(
          result?.data?.package ||
            storeState.subscriptionDetails?.package ||
            storeState.currentPackage
        );
      } catch {
        const storeState = useStore.getState();
        name = getPlanName(
          storeState.subscriptionDetails?.package || storeState.currentPackage
        );
      }

      let usage = null;
      try {
        usage = await fetchGrowlioIQUsage();
      } catch {
        usage = {
          unlimited: isUnlimitedPlanName(name),
          features: {
            [feature]: emptyFeatureUsage(isUnlimitedPlanName(name)),
          },
        };
      }

      if (!mounted) return;
      setPlanName(name);
      applyUsage(usage);
      setPlanLoading(false);
    };
    run();
    return () => {
      mounted = false;
    };
  }, [applyUsage, feature, fetchCurrentSubscriptionDetails]);

  const remainingCopy = useMemo(
    () => remainingLioReviewsCopy(featureUsage),
    [featureUsage]
  );
  const unlimited = Boolean(featureUsage?.unlimited);
  const locked =
    Boolean(featureUsage) &&
    !unlimited &&
    Number(featureUsage.remaining) === 0;

  return {
    planLoading,
    planName,
    unlimited,
    locked,
    remainingCopy,
    featureUsage,
    applyUsage,
    lockFeature,
  };
};

export default useLioFeatureUsage;
