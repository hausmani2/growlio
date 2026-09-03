import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Table, Typography, message } from 'antd';
import {
  CheckCircleOutlined,
  LinkOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../store/store';
import SquareConnectButton from '../square/SquareConnectButton';
import SyncModal from '../SyncModal';
import PosImportDateRangeSelect from '../common/PosImportDateRangeSelect';
import {
  formatPosDate,
  getLastCalendarMonthRange,
  getMerchantSyncStatus,
  getPosImportRangeForPreset,
  isPosImportRangeAllowed,
  POS_IMPORT_MAX_DAYS,
  triggerPosSync,
} from '../../services/posApi';
import { createPosSyncWebSocket } from '../../services/websocket';
import { apiGet, apiPatch } from '../../utils/axiosInterceptors';
import { markSquareConnectFromOnboardingScore } from '../../utils/squareOAuth';
import { ONBOARDING_ROUTES } from '../../utils/onboardingUtils';
import { getRoleLandingRoute } from '../../utils/rolePermissions';

const POLL_MS = 4000;
const MAX_POLL_MS = 5 * 60 * 1000;

const defaultImportRange = () =>
  getPosImportRangeForPreset('last_month', dayjs) || (() => {
    const { startDate, endDate } = getLastCalendarMonthRange();
    return [dayjs(startDate), dayjs(endDate)];
  })();

const normalizeSquareLocations = (payload) => {
  const list =
    payload?.locations ||
    payload?.data?.locations ||
    (Array.isArray(payload) ? payload : []) ||
    [];

  return (Array.isArray(list) ? list : []).map((loc) => ({
    ...loc,
    id: loc?.id ?? null,
    location_id: loc?.location_id ?? loc?.locationId ?? null,
    name: loc?.name ?? loc?.business_name ?? loc?.location_name ?? 'Location',
    sync_enabled: Boolean(loc?.sync_enabled ?? loc?.syncEnabled ?? false),
  }));
};

const OnboardingPosImport = ({ restaurantId, planLocked = false, compact = false }) => {
  const navigate = useNavigate();
  const squareStatus = useStore((state) => state.squareStatus);
  const checkSquareStatus = useStore((state) => state.checkSquareStatus);
  const getRestaurantOnboarding = useStore((state) => state.getRestaurantOnboarding);
  const getSelectedLocationId = useStore((state) => state.getSelectedLocationId);
  const user = useStore((state) => state.user);

  const [isImporting, setIsImporting] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [locationsError, setLocationsError] = useState(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [importRange, setImportRange] = useState(defaultImportRange);

  const pollRef = useRef(null);
  const socketRef = useRef(null);
  const quickTimersRef = useRef([]);
  const doneRef = useRef(false);
  const sawProcessingRef = useRef(false);

  const isConnected = squareStatus === 'connected';
  const startDate = formatPosDate(importRange?.[0]);
  const endDate = formatPosDate(importRange?.[1]);
  const hasValidImportRange = Boolean(startDate && endDate && startDate <= endDate);
  const hasSyncEnabledLocation = useMemo(
    () => locations.some((loc) => loc.sync_enabled && loc.id),
    [locations]
  );
  const canImport =
    !planLocked &&
    isConnected &&
    hasSyncEnabledLocation &&
    hasValidImportRange &&
    !isImporting &&
    Boolean(restaurantId);

  const loadLocations = useCallback(async () => {
    if (!restaurantId) return;

    setLocationsLoading(true);
    setLocationsError(null);
    try {
      const growlioLocationId = localStorage.getItem('selected_location_id');
      const locationQuery = growlioLocationId ? `&location_id=${growlioLocationId}` : '';
      const response = await apiGet(
        `/square_pos/locations/?restaurant_id=${restaurantId}${locationQuery}`
      );
      const payload = response?.data?.data || response?.data;
      setLocations(normalizeSquareLocations(payload));
    } catch (error) {
      setLocations([]);
      setLocationsError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          'Failed to load Square locations.'
      );
    } finally {
      setLocationsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId && !planLocked) {
      checkSquareStatus(restaurantId);
      getSelectedLocationId?.();
    }
  }, [restaurantId, planLocked, checkSquareStatus, getSelectedLocationId]);

  useEffect(() => {
    if (isConnected && !planLocked && restaurantId) {
      loadLocations();
    }
  }, [isConnected, planLocked, restaurantId, loadLocations]);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (quickTimersRef.current.length) {
      quickTimersRef.current.forEach((id) => window.clearTimeout(id));
      quickTimersRef.current = [];
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

  const saveSelectedLocation = useCallback(async () => {
    if (!restaurantId || !selectedLocation?.id) {
      message.error('Please select a location first.');
      return;
    }

    setIsSavingLocation(true);
    try {
      const growlioLocationId = localStorage.getItem('selected_location_id');
      const syncQuery = new URLSearchParams({
        restaurant_id: String(restaurantId),
        skip_sync: 'true',
      });
      if (growlioLocationId) {
        syncQuery.set('location_id', String(growlioLocationId));
      }

      await apiPatch(`/square_pos/locations/update-sync/?${syncQuery.toString()}`, {
        locations: [
          {
            location_id: selectedLocation.id,
            sync_enabled: true,
          },
        ],
      });

      message.success(`Location "${selectedLocation.name}" selected.`);
      setIsConfirmModalOpen(false);
      setIsLocationPickerOpen(false);
      await loadLocations();
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to select Square location.';
      message.error(msg);
    } finally {
      setIsSavingLocation(false);
    }
  }, [loadLocations, restaurantId, selectedLocation]);

  const handleImport = async () => {
    if (planLocked) return;
    if (!restaurantId) {
      message.error('Restaurant not found. Please complete restaurant setup first.');
      return;
    }
    if (!isConnected) {
      message.warning('Connect Square first, then select a location.');
      return;
    }
    if (!hasSyncEnabledLocation) {
      message.warning('Select a Square location first, then import.');
      setIsLocationPickerOpen(true);
      return;
    }
    if (!hasValidImportRange) {
      message.warning('Select a start and end date for the import.');
      return;
    }
    if (!isPosImportRangeAllowed(startDate, endDate, dayjs)) {
      message.warning(`Please select a range of ${POS_IMPORT_MAX_DAYS} days or fewer.`);
      return;
    }

    doneRef.current = false;
    sawProcessingRef.current = false;
    setIsImporting(true);
    cleanup();

    const maybeFinish = (status, { force = false } = {}) => {
      if (doneRef.current) return;
      const normalized = String(status || '').toLowerCase();
      if (normalized === 'processing') {
        sawProcessingRef.current = true;
        return;
      }
      if (normalized === 'completed' && (force || sawProcessingRef.current)) {
        finishImport();
      }
    };

    try {
      socketRef.current = createPosSyncWebSocket({
        restaurantId,
        onCompleted: () => {
          maybeFinish('completed', { force: true });
        },
        onError: () => {},
      });

      const syncStartResponse = await triggerPosSync(restaurantId, {
        startDate,
        endDate,
        createSalesInformation: true,
      });

      const startedAt = Date.now();
      const syncStartedHint = String(
        syncStartResponse?.status ||
          syncStartResponse?.square_sync_status ||
          syncStartResponse?.merchant?.square_sync_status ||
          ''
      ).toLowerCase();

      if (syncStartedHint === 'processing' || syncStartedHint === 'sync_started') {
        sawProcessingRef.current = true;
      }
      if (syncStartedHint === 'completed') {
        maybeFinish('completed', { force: true });
        return;
      }

      const pollOnce = async () => {
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
          // Fast syncs often jump straight to "completed" without "processing".
          const force = sawProcessingRef.current || Date.now() - startedAt >= 1000;
          maybeFinish(status, { force });
        } catch {
          // keep polling
        }
      };

      quickTimersRef.current = [0, 700, 1400, 2200].map((delay) =>
        window.setTimeout(() => {
          pollOnce();
        }, delay)
      );

      pollRef.current = window.setInterval(() => {
        pollOnce();
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

  const locationColumns = [
    {
      title: '',
      key: 'sync_enabled_indicator',
      width: 40,
      render: (_, record) => (
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            record?.sync_enabled ? 'bg-green-500' : 'border border-gray-300 bg-white'
          }`}
        />
      ),
    },
    {
      title: 'Location',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <div>
          <div className="font-medium text-gray-900">{value || 'Location'}</div>
          <div className="text-xs text-gray-500">
            ID: {record?.id ?? '—'} • Square: {record?.location_id ?? '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_, record) => (
        <span className={record?.sync_enabled ? 'text-green-600 font-medium' : 'text-gray-500'}>
          {record?.sync_enabled ? 'Selected' : 'Not Selected'}
        </span>
      ),
    },
  ];

  const helperText = planLocked
    ? 'Available on Grow & Pro — upgrade to connect Square and import automatically.'
    : !isConnected
      ? 'Connect Square, select a location, then choose dates to import history.'
      : !hasSyncEnabledLocation
        ? 'Square connected. Select a location to enable import.'
        : hasValidImportRange
          ? `Import Square data from ${startDate} to ${endDate}.`
          : 'Choose a date range to import from Square.';

  return (
    <div
      className={`border-t border-gray-200 ${compact ? 'pt-4 sm:pt-5' : 'mt-8 pt-6'} ${planLocked ? 'opacity-90' : ''}`}
    >
      <SyncModal open={isImporting || isSavingLocation} />

      <Modal
        title="Select Square Location"
        open={isLocationPickerOpen}
        onCancel={() => !isSavingLocation && setIsLocationPickerOpen(false)}
        footer={[
          <Button
            key="refresh"
            onClick={loadLocations}
            disabled={locationsLoading || isSavingLocation}
          >
            Refresh Locations
          </Button>,
          <Button
            key="close"
            onClick={() => setIsLocationPickerOpen(false)}
            disabled={isSavingLocation}
          >
            Close
          </Button>,
        ]}
        width={720}
        destroyOnClose
      >
        <Typography.Paragraph className="text-gray-600 !mb-3">
          Click a location to use it for importing Square history.
        </Typography.Paragraph>
        {locationsError ? (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {locationsError}
          </div>
        ) : null}
        <Table
          rowKey={(r) => String(r?.location_id || r?.id || Math.random())}
          loading={locationsLoading}
          columns={locationColumns}
          dataSource={locations}
          pagination={false}
          size="middle"
          onRow={(record) => ({
            onClick: () => {
              if (!record?.id || isSavingLocation) return;
              setSelectedLocation(record);
              setIsConfirmModalOpen(true);
            },
          })}
          rowClassName={(record) => (record?.id ? 'cursor-pointer' : '')}
        />
      </Modal>

      <Modal
        title={selectedLocation?.name ? `Location: ${selectedLocation.name}` : 'Location'}
        open={isConfirmModalOpen}
        onCancel={() => !isSavingLocation && setIsConfirmModalOpen(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setIsConfirmModalOpen(false)}
            disabled={isSavingLocation}
          >
            Close
          </Button>,
          <Button
            key="select"
            type="primary"
            onClick={saveSelectedLocation}
            disabled={!selectedLocation?.id || isSavingLocation}
            loading={isSavingLocation}
          >
            Select this location
          </Button>,
        ]}
        destroyOnClose
      >
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500">Square Location:</span>{' '}
            <span className="font-medium text-gray-900">
              {selectedLocation?.location_id ?? '—'}
            </span>
          </div>
          <p className="text-gray-600 pt-1">
            After selecting this location, choose dates and import from Square.
          </p>
        </div>
      </Modal>

      <p
        className={`font-semibold text-gray-900 text-center ${
          compact ? 'text-sm sm:text-base md:text-lg mb-1' : 'text-sm mb-1'
        }`}
      >
        Or import history from Square
      </p>
      <p
        className={`text-gray-500 text-center ${
          compact ? 'text-xs sm:text-sm mb-3 sm:mb-4 max-w-lg mx-auto' : 'text-xs mb-4'
        }`}
      >
        {helperText}
      </p>

      <div
        className={`flex flex-col mx-auto w-full ${
          compact ? 'max-w-md sm:max-w-lg md:max-w-xl gap-3 sm:gap-4' : 'max-w-sm gap-3'
        }`}
      >
        <SquareConnectButton
          restaurantId={restaurantId}
          onConnect={markSquareConnectFromOnboardingScore}
          disabled={planLocked}
          size="large"
        />

        {isConnected && !planLocked && !hasSyncEnabledLocation && (
          <button
            type="button"
            onClick={() => {
              setIsLocationPickerOpen(true);
              loadLocations();
            }}
            className={`mx-auto flex items-center justify-center gap-2 rounded-xl w-full font-semibold bg-white text-orange-600 border border-orange-500 hover:bg-orange-50 shadow-sm transition-colors ${
              compact ? 'py-3 sm:py-3.5 text-sm sm:text-base' : 'p-3 text-base'
            }`}
          >
            Select Square Location
          </button>
        )}

        {isConnected && !planLocked && (
          <div className="w-full">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 text-center">
              Import date range
            </label>
            <PosImportDateRangeSelect
              value={importRange}
              onChange={setImportRange}
              disabled={planLocked || isImporting}
              size={compact ? 'middle' : 'large'}
              defaultPreset="last_month"
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleImport}
          disabled={!canImport}
          className={`mx-auto flex items-center justify-center gap-2 rounded-xl w-full font-semibold shadow-sm transition-colors duration-200 ${
            compact ? 'py-3 sm:py-3.5 text-sm sm:text-base' : 'p-3 text-base shadow-md'
          } ${
            !canImport
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-white text-orange-600 border border-orange-500 hover:bg-orange-50'
          }`}
        >
          {isImporting ? (
            <LoadingOutlined />
          ) : hasSyncEnabledLocation ? (
            <CheckCircleOutlined />
          ) : (
            <LinkOutlined />
          )}
          {isImporting ? 'Importing...' : 'Import from Square'}
        </button>

        {planLocked && (
          <button
            type="button"
            onClick={() => navigate(ONBOARDING_ROUTES.PLANS)}
            className={`mx-auto flex items-center justify-center rounded-xl w-full font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md transition-colors ${
              compact ? 'py-3 sm:py-3.5 text-sm sm:text-base' : 'p-3 text-base'
            }`}
          >
            Upgrade Your Plan
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPosImport;
