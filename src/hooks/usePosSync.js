import { useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import usePosStore from '../store/posStore';
import {
  getDashboardData,
  getMerchantSyncStatus,
  POS_SYNC_POLL_INTERVAL_MS,
  posQueryKeys,
  triggerPosSync,
} from '../services/posApi';
import { createPosSyncWebSocket } from '../services/websocket';

const DEFAULT_SOCKET_ERROR_MESSAGE =
  'Realtime updates are temporarily unavailable. Polling will keep checking sync status.';

export const usePosSync = ({ getRestaurantId, getWeekStart, onDashboardData }) => {
  const queryClient = useQueryClient();
  const websocketRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const completionHandledRef = useRef(false);
  const dashboardCallbackRef = useRef(onDashboardData);

  const {
    isSyncing,
    syncStatus,
    setSyncing,
    setStatus,
    setActiveRestaurantId,
    setSyncError,
    markCompleted,
    resetSyncState,
  } = usePosStore();

  useEffect(() => {
    dashboardCallbackRef.current = onDashboardData;
  }, [onDashboardData]);

  const cleanupRealtimeResources = useCallback(() => {
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.disconnect?.();
      websocketRef.current = null;
    }
  }, []);

  const finalizeSync = useCallback(
    async (restaurantId, weekStart) => {
      if (completionHandledRef.current) {
        return;
      }

      completionHandledRef.current = true;
      cleanupRealtimeResources();
      markCompleted();

      try {
        const freshDashboardData = await queryClient.fetchQuery({
          queryKey: posQueryKeys.dashboard(restaurantId, weekStart),
          queryFn: () => getDashboardData({ restaurantId, weekStart }),
          staleTime: 0,
        });

        dashboardCallbackRef.current?.(freshDashboardData);
        queryClient.invalidateQueries({
          queryKey: ['dashboard', String(restaurantId)],
        });
        message.success('POS data synced successfully');
      } catch (error) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'POS sync completed, but the dashboard refresh failed.';

        message.warning(errorMessage);
      } finally {
        window.setTimeout(() => {
          resetSyncState();
        }, 0);
      }
    },
    [cleanupRealtimeResources, markCompleted, queryClient, resetSyncState]
  );

  const checkMerchantStatus = useCallback(
    async (restaurantId, weekStart) => {
      const merchantStatus = await queryClient.fetchQuery({
        queryKey: posQueryKeys.merchantStatus(restaurantId),
        queryFn: () => getMerchantSyncStatus(restaurantId),
        staleTime: 0,
      });

      if (merchantStatus?.isCompleted) {
        await finalizeSync(restaurantId, weekStart);
      }

      return merchantStatus;
    },
    [finalizeSync, queryClient]
  );

  const startPolling = useCallback(
    (restaurantId, weekStart) => {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = window.setInterval(() => {
        checkMerchantStatus(restaurantId, weekStart).catch(() => {
          // Polling continues even if one request fails.
        });
      }, POS_SYNC_POLL_INTERVAL_MS);
    },
    [checkMerchantStatus]
  );

  const startRealtimeListeners = useCallback(
    (restaurantId, weekStart) => {
      completionHandledRef.current = false;

      websocketRef.current = createPosSyncWebSocket({
        restaurantId,
        onCompleted: () => {
          finalizeSync(restaurantId, weekStart).catch(() => {
            // Completion handler already reports dashboard refresh issues.
          });
        },
        onError: () => {
          if (!completionHandledRef.current) {
            message.warning(DEFAULT_SOCKET_ERROR_MESSAGE);
          }
        },
      });

      startPolling(restaurantId, weekStart);
    },
    [finalizeSync, startPolling]
  );

  const syncMutation = useMutation({
    mutationFn: ({ restaurantId }) => triggerPosSync(restaurantId),
  });

  const startSync = useCallback(async () => {
    if (isSyncing || syncMutation.isPending) {
      return { success: false, reason: 'already-running' };
    }

    const restaurantId = await getRestaurantId?.();
    if (!restaurantId) {
      message.error('Restaurant ID not found. Please complete onboarding first.');
      return { success: false, reason: 'missing-restaurant-id' };
    }

    const weekStartValue = getWeekStart?.();
    const normalizedWeekStart =
      typeof weekStartValue === 'string'
        ? weekStartValue
        : weekStartValue?.format?.('YYYY-MM-DD') || null;

    if (!normalizedWeekStart) {
      message.warning('Please select a week first.');
      return { success: false, reason: 'missing-week' };
    }

    cleanupRealtimeResources();
    setActiveRestaurantId(restaurantId);
    setSyncError(null);
    setStatus('pending');
    setSyncing(true);
    startRealtimeListeners(restaurantId, normalizedWeekStart);

    try {
      await syncMutation.mutateAsync({ restaurantId });
      checkMerchantStatus(restaurantId, normalizedWeekStart).catch(() => {
        // Polling continues even if the immediate check fails.
      });

      return { success: true };
    } catch (error) {
      cleanupRealtimeResources();
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to start POS sync.';

      setSyncError(errorMessage);
      resetSyncState();
      message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [
    checkMerchantStatus,
    cleanupRealtimeResources,
    getRestaurantId,
    getWeekStart,
    isSyncing,
    resetSyncState,
    setActiveRestaurantId,
    setStatus,
    setSyncError,
    setSyncing,
    startRealtimeListeners,
    syncMutation,
  ]);

  useEffect(() => cleanupRealtimeResources, [cleanupRealtimeResources]);

  return {
    startSync,
    isSyncing,
    syncStatus,
    isStartingSync: syncMutation.isPending,
  };
};

export default usePosSync;
