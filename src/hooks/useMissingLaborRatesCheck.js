import { useCallback, useRef, useState } from 'react';
import { previewPosLaborRates } from '../services/posApi';

/**
 * Preview Square labor before any POS sync/import.
 * If employees have no hourly wage, show a warning; user can cancel or proceed anyway.
 */
const useMissingLaborRatesCheck = () => {
  const [checkingLaborRates, setCheckingLaborRates] = useState(false);
  const [proceedingAnyway, setProceedingAnyway] = useState(false);
  const [missingRatesOpen, setMissingRatesOpen] = useState(false);
  const [missingEmployees, setMissingEmployees] = useState([]);
  const pendingProceedRef = useRef(null);

  const closeModal = useCallback(() => {
    pendingProceedRef.current = null;
    setMissingRatesOpen(false);
    setMissingEmployees([]);
    setProceedingAnyway(false);
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
    } catch {
      // If preview fails, still allow sync.
      await onProceed();
    } finally {
      setCheckingLaborRates(false);
    }
  }, []);

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
      onCancel: closeModal,
      onProceed: handleProceedAnyway,
    },
  };
};

export default useMissingLaborRatesCheck;
