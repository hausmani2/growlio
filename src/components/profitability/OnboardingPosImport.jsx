import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { CheckCircleOutlined, LinkOutlined, LoadingOutlined } from '@ant-design/icons';
import useStore from '../../store/store';
import SquareConnectButton from '../square/SquareConnectButton';
import SyncModal from '../SyncModal';
import {
  getLastCalendarMonthRange,
  getMerchantSyncStatus,
  triggerPosSync,
} from '../../services/posApi';
import { createPosSyncWebSocket } from '../../services/websocket';
import { markSquareConnectFromOnboardingScore } from '../../utils/squareOAuth';
import { ONBOARDING_ROUTES } from '../../utils/onboardingUtils';
import { getRoleLandingRoute } from '../../utils/rolePermissions';

const POLL_MS = 4000;
const MAX_POLL_MS = 5 * 60 * 1000;

const OnboardingPosImport = ({ restaurantId }) => {
  const navigate = useNavigate();
  const squareStatus = useStore((state) => state.squareStatus);
  const checkSquareStatus = useStore((state) => state.checkSquareStatus);
  const getRestaurantOnboarding = useStore((state) => state.getRestaurantOnboarding);
  const getSelectedLocationId = useStore((state) => state.getSelectedLocationId);
  const user = useStore((state) => state.user);

  const [isImporting, setIsImporting] = useState(false);
  const pollRef = useRef(null);
  const socketRef = useRef(null);
  const doneRef = useRef(false);
  const sawProcessingRef = useRef(false);

  const isConnected = squareStatus === 'connected';
  const { startDate, endDate } = getLastCalendarMonthRange();

  useEffect(() => {
    if (restaurantId) {
      checkSquareStatus(restaurantId);
      getSelectedLocationId?.();
    }
  }, [restaurantId, checkSquareStatus, getSelectedLocationId]);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect?.();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const finishImport = useCallback(async () => {
    if (doneRef.current) return;
    doneRef.current = true;
    cleanup();

    try {
      const locationId = useStore.getState().selectedLocationId;
      await getRestaurantOnboarding?.(true, locationId || undefined);
      message.success('Last month imported from Square.');
      navigate(
        getRoleLandingRoute(user?.restaurant_role) || ONBOARDING_ROUTES.REPORT_CARD,
        { replace: true }
      );
    } catch (error) {
      console.error('Failed to refresh onboarding after POS import:', error);
      message.success('Last month imported from Square.');
      navigate(ONBOARDING_ROUTES.REPORT_CARD, { replace: true });
    } finally {
      setIsImporting(false);
    }
  }, [cleanup, getRestaurantOnboarding, navigate, user?.restaurant_role]);

  const handleImport = async () => {
    if (!restaurantId) {
      message.error('Restaurant not found. Please complete restaurant setup first.');
      return;
    }
    if (!isConnected) {
      message.warning('Connect Square first, then import last month.');
      return;
    }

    doneRef.current = false;
    sawProcessingRef.current = false;
    setIsImporting(true);
    cleanup();

    try {
      socketRef.current = createPosSyncWebSocket({
        restaurantId,
        onCompleted: () => {
          if (!sawProcessingRef.current) return;
          finishImport();
        },
        onError: () => {},
      });

      await triggerPosSync(restaurantId, {
        startDate,
        endDate,
        createSalesInformation: true,
      });

      const startedAt = Date.now();
      pollRef.current = window.setInterval(async () => {
        if (doneRef.current) return;
        if (Date.now() - startedAt > MAX_POLL_MS) {
          cleanup();
          setIsImporting(false);
          message.error('Import is taking longer than expected. Please try again.');
          return;
        }
        try {
          const merchantStatus = await getMerchantSyncStatus(restaurantId);
          const status = String(merchantStatus?.squareSyncStatus || '').toLowerCase();
          if (status === 'processing') {
            sawProcessingRef.current = true;
          }
          if (sawProcessingRef.current && merchantStatus?.isCompleted) {
            finishImport();
          }
        } catch {
          // keep polling
        }
      }, POLL_MS);
    } catch (error) {
      cleanup();
      setIsImporting(false);
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to import last month from Square.';
      message.error(msg);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <SyncModal open={isImporting} />
      <p className="text-sm font-semibold text-gray-900 text-center mb-1">
        Or import last month from Square
      </p>
      <p className="text-xs text-gray-500 text-center mb-4">
        Grow &amp; Pro: connect Square, then pull {startDate} to {endDate}.
      </p>

      <div className="flex flex-col gap-3 max-w-sm mx-auto">
        <SquareConnectButton
          restaurantId={restaurantId}
          onConnect={markSquareConnectFromOnboardingScore}
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={!isConnected || isImporting || !restaurantId}
          className={`mx-auto flex items-center justify-center gap-2 rounded-lg w-full p-3 font-semibold text-base shadow-md transition-colors duration-200 ${
            !isConnected || isImporting || !restaurantId
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-white text-orange-600 border border-orange-500 hover:bg-orange-50'
          }`}
        >
          {isImporting ? (
            <LoadingOutlined />
          ) : isConnected ? (
            <CheckCircleOutlined />
          ) : (
            <LinkOutlined />
          )}
          {isImporting ? 'Importing last month...' : 'Import last month from Square'}
        </button>
      </div>
    </div>
  );
};

export default OnboardingPosImport;
