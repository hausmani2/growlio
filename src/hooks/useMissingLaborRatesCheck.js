import { useCallback, useRef, useState } from 'react';
import { previewPosLaborRates, previewPosSyncSetup } from '../services/posApi';
import {
  getSquareAuthErrorMessage,
  promptSquareReconnect,
} from '../utils/squareReconnect';
import useStore from '../store/store';

/**
 * Pre-sync guards:
 * 1) Your Setup vs Square (channels / 3P / hourly rate)
 * 2) Missing Square labor wages
 *
 * On Square auth failure, prompt reconnect and do not start sync.
 */
const useMissingLaborRatesCheck = () => {
  const [checkingLaborRates, setCheckingLaborRates] = useState(false);
  const [proceedingAnyway, setProceedingAnyway] = useState(false);
  const [missingRatesOpen, setMissingRatesOpen] = useState(false);
  const [missingEmployees, setMissingEmployees] = useState([]);
  const [setupIssuesOpen, setSetupIssuesOpen] = useState(false);
  const [setupIssues, setSetupIssues] = useState([]);
  const pendingProceedRef = useRef(null);
  const pendingLaborCheckRef = useRef(null);

  const closeModals = useCallback(() => {
    pendingProceedRef.current = null;
    pendingLaborCheckRef.current = null;
    setMissingRatesOpen(false);
    setMissingEmployees([]);
    setSetupIssuesOpen(false);
    setSetupIssues([]);
    setProceedingAnyway(false);
  }, []);

  const runLaborRatePreview = useCallback(async ({
    restaurantId,
    startDate,
    endDate,
    squareLocationId,
    onProceed,
  }) => {
    const preview = await previewPosLaborRates(restaurantId, {
      startDate,
      endDate,
      squareLocationId,
    });
    if (preview?.has_missing_rates && (preview.employees || []).length > 0) {
      pendingProceedRef.current = onProceed;
      setMissingEmployees(preview.employees);
      setMissingRatesOpen(true);
      return;
    }
    await onProceed();
  }, []);

  const runWithLaborRateCheck = useCallback(async ({
    restaurantId,
    startDate,
    endDate,
    squareLocationId,
    onProceed,
  }) => {
    if (typeof onProceed !== 'function') return;

    if (!restaurantId || !startDate || !endDate) {
      await onProceed();
      return;
    }

    setCheckingLaborRates(true);
    try {
      let setupPreview = null;
      try {
        setupPreview = await previewPosSyncSetup(restaurantId, {
          startDate,
          endDate,
          squareLocationId,
        });
      } catch (setupError) {
        const authMessage = getSquareAuthErrorMessage(setupError);
        if (authMessage) {
          useStore.getState().checkSquareStatus?.(restaurantId)?.catch?.(() => {});
          promptSquareReconnect({ restaurantId, message: authMessage });
          return;
        }
        // Setup preview failed for another reason — continue to labor check / sync.
      }

      if (setupPreview?.has_issues && (setupPreview.issues || []).length > 0) {
        pendingLaborCheckRef.current = {
          restaurantId,
          startDate,
          endDate,
          squareLocationId,
          onProceed,
        };
        setSetupIssues(setupPreview.issues);
        setSetupIssuesOpen(true);
        return;
      }

      await runLaborRatePreview({
        restaurantId,
        startDate,
        endDate,
        squareLocationId,
        onProceed,
      });
    } catch (error) {
      const authMessage = getSquareAuthErrorMessage(error);
      if (authMessage) {
        useStore.getState().checkSquareStatus?.(restaurantId)?.catch?.(() => {});
        promptSquareReconnect({ restaurantId, message: authMessage });
        return;
      }
      // Non-auth preview failures: still allow sync.
      await onProceed();
    } finally {
      setCheckingLaborRates(false);
    }
  }, [runLaborRatePreview]);

  const handleSetupProceedAnyway = useCallback(async () => {
    const pending = pendingLaborCheckRef.current;
    pendingLaborCheckRef.current = null;
    setSetupIssuesOpen(false);
    setSetupIssues([]);
    if (!pending) return;

    setProceedingAnyway(true);
    setCheckingLaborRates(true);
    try {
      await runLaborRatePreview(pending);
    } catch (error) {
      const authMessage = getSquareAuthErrorMessage(error);
      if (authMessage) {
        useStore.getState().checkSquareStatus?.(pending.restaurantId)?.catch?.(() => {});
        promptSquareReconnect({
          restaurantId: pending.restaurantId,
          message: authMessage,
        });
        return;
      }
      await pending.onProceed?.();
    } finally {
      setProceedingAnyway(false);
      setCheckingLaborRates(false);
    }
  }, [runLaborRatePreview]);

  const handleProceedAnyway = useCallback(async () => {
    const onProceed = pendingProceedRef.current;
    pendingProceedRef.current = null;
    setProceedingAnyway(true);
    setMissingRatesOpen(false);
    setMissingEmployees([]);
    try {
      await onProceed?.();
    } finally {
      setProceedingAnyway(false);
    }
  }, []);

  return {
    checkingLaborRates,
    runWithLaborRateCheck,
    missingLaborRatesModalProps: {
      open: missingRatesOpen,
      loading: proceedingAnyway,
      employees: missingEmployees,
      onCancel: closeModals,
      onProceed: handleProceedAnyway,
    },
    syncSetupIssuesModalProps: {
      open: setupIssuesOpen,
      loading: proceedingAnyway,
      issues: setupIssues,
      onCancel: closeModals,
      onProceed: handleSetupProceedAnyway,
    },
  };
};

export default useMissingLaborRatesCheck;
