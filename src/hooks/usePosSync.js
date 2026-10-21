import { useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import usePosStore from '../store/posStore';
import useStore from '../store/store';
import {
  checkPostSyncThirdParty,
  getDashboardData,
  getMerchantSyncStatus,
  POS_SYNC_POLL_INTERVAL_MS,
  posQueryKeys,
  triggerPosSync,
} from '../services/posApi';
import { createPosSyncWebSocket } from '../services/websocket';
import {
  getSquareAuthErrorMessage,
  promptSquareReconnect,
  SQUARE_RECONNECT_MESSAGE,
} from '../utils/squareReconnect';
import { shouldFinalizePosSync } from '../utils/posSyncCompletion';

const NO_POS_DATA_MESSAGE = 'No data found from Square for the selected dates.';

export const usePosSync = ({
  getRestaurantId,
  getWeekStart,
  getSyncDateRange,
  onDashboardData,
  onSyncCompleted,
}) => {
  const queryClient = useQueryClient();
  const websocketRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const completionHandledRef = useRef(false);
  const sawProcessingRef = useRef(false);
  const syncStartedAtRef = useRef(null);
  const dashboardCallbackRef = useRef(onDashboardData);
  const syncCompletedCallbackRef = useRef(onSyncCompleted);
  const lastSyncRangeRef = useRef(null);

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

  useEffect(() => {
    syncCompletedCallbackRef.current = onSyncCompleted;
  }, [onSyncCompleted]);

  const cleanupRealtimeResources = useCallback(() => {
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.disconnect?.();
    }
    websocketRef.current = null;
  }, []);

  const handleAuthRequired = useCallback(
    (restaurantId, reconnectMessage) => {
      if (completionHandledRef.current) {
        return;
      }
      completionHandledRef.current = true;
      cleanupRealtimeResources();
      markCompleted();
      useStore.getState().checkSquareStatus?.(restaurantId)?.catch?.(() => {});
      promptSquareReconnect({
        restaurantId,
        message: reconnectMessage || SQUARE_RECONNECT_MESSAGE,
      });
      window.setTimeout(() => {
        resetSyncState();
      }, 0);
    },
    [cleanupRealtimeResources, markCompleted, resetSyncState]
  );

  const finalizeSync = useCallback(
    async (restaurantId, weekStart) => {
      if (completionHandledRef.current) {
        return;
      }

      completionHandledRef.current = true;
      cleanupRealtimeResources();
      markCompleted();

      try {
        const merchantStatus = await queryClient.fetchQuery({
          queryKey: posQueryKeys.merchantStatus(restaurantId),
          queryFn: () => getMerchantSyncStatus(restaurantId),
          staleTime: 0,
        });

        if (merchantStatus?.needsReconnect) {
          useStore.getState().checkSquareStatus?.(restaurantId)?.catch?.(() => {});
          promptSquareReconnect({
            restaurantId,
            message: merchantStatus.reconnectMessage,
          });
          return;
        }

        // Require an explicit true from THIS completed sync (null/false = no data).
        const hadData = merchantStatus?.lastSyncHadData === true;

        // Force-refresh Zustand (not IfNeeded) so past-week cache cannot overwrite
        // the post-sync UI when the week picker reprocesses the synced week.
        let freshDashboardData = null;
        try {
          freshDashboardData = await useStore.getState().fetchDashboardData?.(weekStart);
        } catch (_) {
          // Fall through to React Query fetch below
        }

        if (!freshDashboardData) {
          freshDashboardData = await queryClient.fetchQuery({
            queryKey: posQueryKeys.dashboard(restaurantId, weekStart),
            queryFn: () => getDashboardData({ restaurantId, weekStart }),
            staleTime: 0,
          });
        } else {
          queryClient.setQueryData(
            posQueryKeys.dashboard(restaurantId, weekStart),
            freshDashboardData
          );
        }

        // Refresh onboarding after sync so Close Day column visibility matches
        // the selected location's Sales Channels / Third Party settings.
        try {
          await useStore.getState().loadExistingOnboardingData?.(true);
        } catch (_) {
          // Non-blocking: dashboard refresh already succeeded
        }

        dashboardCallbackRef.current?.(freshDashboardData);
        syncCompletedCallbackRef.current?.({ hadData, weekStart });
        queryClient.invalidateQueries({
          queryKey: ['dashboard', String(restaurantId)],
        });
        if (hadData) {
          message.success('POS data synced successfully');
          const syncRange = lastSyncRangeRef.current;
          const locationId =
            localStorage.getItem('selected_location_id') ||
            localStorage.getItem('location_id');
          if (syncRange?.startDate && locationId) {
            try {
              const tpCheck = await checkPostSyncThirdParty({
                restaurantId,
                locationId,
                startDate: syncRange.startDate,
                endDate: syncRange.endDate || syncRange.startDate,
              });
              if (tpCheck?.show_warning && tpCheck?.message) {
                message.warning({
                  content: tpCheck.message,
                  duration: 2,
                });
              }
            } catch (_) {
              // Non-blocking: sync already succeeded
            }
          }
        } else {
          message.warning(NO_POS_DATA_MESSAGE);
        }
      } catch (error) {
        const authMessage = getSquareAuthErrorMessage(error);
        if (authMessage) {
          promptSquareReconnect({ restaurantId, message: authMessage });
          return;
        }
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
    async (restaurantId, weekStart, { force = false } = {}) => {
      const merchantStatus = await queryClient.fetchQuery({
        queryKey: posQueryKeys.merchantStatus(restaurantId),
        queryFn: () => getMerchantSyncStatus(restaurantId),
        staleTime: 0,
      });

      if (merchantStatus?.needsReconnect) {
        handleAuthRequired(restaurantId, merchantStatus.reconnectMessage);
        return merchantStatus;
      }

      const decision = shouldFinalizePosSync({
        status: merchantStatus?.squareSyncStatus,
        sawProcessing: sawProcessingRef.current,
        force,
        startedAt: syncStartedAtRef.current,
      });
      sawProcessingRef.current = decision.sawProcessing;

      if (decision.shouldFinalize) {
        await finalizeSync(restaurantId, weekStart);
      }

      return merchantStatus;
    },
    [finalizeSync, handleAuthRequired, queryClient]
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
      sawProcessingRef.current = false;
      syncStartedAtRef.current = Date.now();

      websocketRef.current = createPosSyncWebSocket({
        restaurantId,
        onCompleted: () => {
          // WS fires for THIS run — finalize immediately (same as OnboardingPosImport).
          sawProcessingRef.current = true;
          finalizeSync(restaurantId, weekStart).catch(() => {
            // Completion handler already reports dashboard refresh issues.
          });
        },
        onError: () => {
          // WebSocket optional — HTTP polling continues without warning the user.
        },
      });

      startPolling(restaurantId, weekStart);
    },
    [finalizeSync, startPolling]
  );

  const syncMutation = useMutation({
    mutationFn: ({ restaurantId, startDate, endDate, dates, skipExisting }) =>
      triggerPosSync(restaurantId, { startDate, endDate, dates, skipExisting }),
  });

  const startSync = useCallback(async (override = {}) => {
    if (isSyncing || syncMutation.isPending) {
      return { success: false, reason: 'already-running' };
    }

    const restaurantId = await getRestaurantId?.();
    if (!restaurantId) {
      message.error('Restaurant ID not found. Please complete onboarding first.');
      return { success: false, reason: 'missing-restaurant-id' };
    }

    const weekStartValue = override.weekStart || getWeekStart?.();
    const normalizedWeekStart =
      typeof weekStartValue === 'string'
        ? weekStartValue
        : weekStartValue?.format?.('YYYY-MM-DD') || null;

    if (!normalizedWeekStart) {
      message.warning('Please select a week first.');
      return { success: false, reason: 'missing-week' };
    }

    const syncDateRange = getSyncDateRange?.() || {};
    const startDate = override.startDate || syncDateRange.startDate || normalizedWeekStart;
    const endDate = override.endDate || syncDateRange.endDate || null;
    const dates = override.dates || syncDateRange.dates;
    const skipExisting =
      override.skipExisting ?? syncDateRange.skipExisting ?? false;

    cleanupRealtimeResources();
    setActiveRestaurantId(restaurantId);
    setSyncError(null);
    setStatus('pending');
    setSyncing(true);
    lastSyncRangeRef.current = {
      startDate,
      endDate: endDate || startDate,
    };
    startRealtimeListeners(restaurantId, normalizedWeekStart);

    try {
      const syncStartResponse = await syncMutation.mutateAsync({
        restaurantId,
        startDate,
        endDate,
        dates,
        skipExisting,
      });

      const startedHint = String(
        syncStartResponse?.status ||
          syncStartResponse?.square_sync_status ||
          ''
      ).toLowerCase();
      if (
        startedHint === 'sync_started' ||
        startedHint === 'processing' ||
        startedHint === 'pending'
      ) {
        sawProcessingRef.current = true;
      }

      checkMerchantStatus(restaurantId, normalizedWeekStart).catch(() => {
        // Polling continues even if the immediate check fails.
      });

      return { success: true };
    } catch (error) {
      cleanupRealtimeResources();
      const authMessage = getSquareAuthErrorMessage(error);
      if (authMessage) {
        setSyncError(authMessage);
        resetSyncState();
        useStore.getState().checkSquareStatus?.(restaurantId)?.catch?.(() => {});
        promptSquareReconnect({ restaurantId, message: authMessage });
        return { success: false, error: authMessage, needsReconnect: true };
      }

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
    getSyncDateRange,
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
