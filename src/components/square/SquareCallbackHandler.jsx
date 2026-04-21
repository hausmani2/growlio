import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result, Button, Modal, Table, Typography, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import useStore from '../../store/store';
import { apiGet, apiPatch, apiPost } from '../../utils/axiosInterceptors';
import { getMerchantSyncStatus, triggerPosSync } from '../../services/posApi';
import { createPosSyncWebSocket } from '../../services/websocket';
import SyncModal from '../SyncModal';

/**
 * Square Callback Handler Component
 * Handles the OAuth callback from Square after user authorization
 */
const SquareCallbackHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState(null); // 'success' | 'error' | null
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState(null);
  const [locations, setLocations] = useState([]);
  // We must send backend `id` in payload field named `location_id`.
  // Backend response contains both:
  // - `id` (number, our DB id) -> send this
  // - `location_id` (string, Square location id) -> display only
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isStartingSync, setIsStartingSync] = useState(false);
  
  const handleSquareCallback = useStore((state) => state.handleSquareCallback);
  const squareError = useStore((state) => state.squareError);

  const pollingIntervalRef = useRef(null);
  const websocketRef = useRef(null);
  const completionHandledRef = useRef(false);

  const restaurantIdFromState = useMemo(() => {
    const raw = searchParams.get('state');
    const n = Number.parseInt(String(raw || ''), 10);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const restaurantIdFromQuery = useMemo(() => {
    const raw = searchParams.get('restaurant_id');
    const n = Number.parseInt(String(raw || ''), 10);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const restaurantIdFromStorage = useMemo(() => {
    const raw = localStorage.getItem('restaurant_id');
    const n = Number.parseInt(String(raw || ''), 10);
    return Number.isFinite(n) ? n : null;
  }, []);

  const restaurantIdForLocations =
    restaurantIdFromQuery || restaurantIdFromStorage || restaurantIdFromState;
  const restaurantIdForSync =
    restaurantIdFromState || restaurantIdFromStorage || restaurantIdFromQuery;

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
  
  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract authorization code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        // Handle OAuth error from Square
        if (error) {
          console.error('Square OAuth error:', error, errorDescription);
          setResult('error');
          setProcessing(false);
          return;
        }
        
        // Check if we have an authorization code
        if (!code) {
          console.error('No authorization code received from Square');
          setResult('error');
          setProcessing(false);
          return;
        }
        
        // Process the callback
        const response = await handleSquareCallback(code, state);
        
        if (response.success) {
          setResult('success');
        } else {
          setResult('error');
        }
      } catch (error) {
        console.error('Error processing Square callback:', error);
        setResult('error');
      } finally {
        setProcessing(false);
      }
    };
    
    processCallback();
  }, [searchParams, handleSquareCallback]);

  useEffect(() => {
    return () => cleanupRealtimeResources();
  }, [cleanupRealtimeResources]);

  const loadLocations = useCallback(async () => {
    if (!restaurantIdForLocations) {
      setLocationsError('Restaurant ID not found. Please login again and retry.');
      return;
    }

    setLocationsLoading(true);
    setLocationsError(null);
    try {
      const response = await apiGet(`/square_pos/locations/?restaurant_id=${restaurantIdForLocations}`);
      const payload = response?.data?.data || response?.data;
      const list =
        payload?.locations ||
        payload?.data?.locations ||
        (Array.isArray(payload) ? payload : []) ||
        [];

      const normalized = (Array.isArray(list) ? list : []).map((loc) => ({
        ...loc,
        // Keep both ids:
        // - `id`: backend DB id (number) -> USE THIS FOR payload
        // - `location_id`: Square location id (string) -> display only
        id: loc?.id ?? null,
        location_id: loc?.location_id ?? loc?.locationId ?? null,
        name: loc?.name ?? loc?.business_name ?? loc?.location_name ?? 'Location',
        sync_enabled: Boolean(loc?.sync_enabled ?? loc?.syncEnabled ?? false),
      }));

      setLocations(normalized);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to load Square locations.';
      setLocationsError(msg);
    } finally {
      setLocationsLoading(false);
    }
  }, [restaurantIdForLocations]);

  useEffect(() => {
    if (result === 'success') {
      loadLocations();
    }
  }, [loadLocations, result]);

  const startSyncFlow = useCallback(async (locationId) => {
    if (!restaurantIdForSync) {
      message.error('Restaurant ID not found. Please login and retry.');
      return;
    }
    if (!locationId) {
      message.error('Please select a location first.');
      return;
    }

    setIsStartingSync(true);
    completionHandledRef.current = false;
    cleanupRealtimeResources();

    try {
      await apiPatch('/square_pos/locations/update-sync/', {
        locations: [
          {
            location_id: locationId,
            sync_enabled: true,
          },
        ],
      });

      // Start realtime listeners + polling BEFORE triggering sync.
      websocketRef.current = createPosSyncWebSocket({
        restaurantId: restaurantIdForSync,
        onCompleted: () => {
          if (completionHandledRef.current) return;
          completionHandledRef.current = true;
          cleanupRealtimeResources();
          setIsStartingSync(false);
          message.success('Sync completed successfully');
          navigate('/dashboard', { replace: true });
        },
        onError: () => {
          // Polling will continue.
        },
      });

      pollingIntervalRef.current = window.setInterval(async () => {
        if (completionHandledRef.current) return;
        try {
          const merchantStatus = await getMerchantSyncStatus(restaurantIdForSync);
          if (merchantStatus?.isCompleted) {
            completionHandledRef.current = true;
            cleanupRealtimeResources();
            setIsStartingSync(false);
            message.success('Sync completed successfully');
            navigate('/dashboard', { replace: true });
          }
        } catch {
          // keep polling
        }
      }, 10000);

      const syncStartResponse = await triggerPosSync(restaurantIdForSync);

      // Backend may return `{ status: "sync_started" }` meaning work continues asynchronously.
      // Keep the modal open until websocket/poll reports completed.
      if (
        syncStartResponse?.status &&
        String(syncStartResponse.status).toLowerCase() !== 'sync_started'
      ) {
        // If backend returns an unexpected terminal state, stop loader.
        // (Completion path will still close it if sync completes quickly.)
      }
    } catch (error) {
      cleanupRealtimeResources();
      setIsStartingSync(false);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to start sync.';
      message.error(msg);
    }
  }, [
    cleanupRealtimeResources,
    navigate,
    restaurantIdForSync,
  ]);
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleGoToSettings = () => {
    navigate('/dashboard/square');
  };
  
  if (processing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} 
            size="large"
          />
          <p className="mt-4 text-lg text-gray-600">
            Processing Square connection...
          </p>
        </div>
      </div>
    );
  }
  
  if (result === 'success') {
    const columns = [
      {
        title: '',
        key: 'sync_enabled_indicator',
        width: 40,
        render: (_, record) => (
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              record?.sync_enabled ? 'bg-green-500' : 'border border-gray-300 bg-white'
            }`}
            aria-label={record?.sync_enabled ? 'Sync enabled' : 'Sync not enabled'}
            title={record?.sync_enabled ? 'Sync enabled' : 'Sync not enabled'}
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
            {record?.sync_enabled ? 'Sync Enabled' : 'Not Enabled'}
          </span>
        ),
      },
    ];

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-4xl px-4">
          <SyncModal open={isStartingSync} />
          <Modal
            title={selectedLocation?.name ? `Location: ${selectedLocation.name}` : 'Location'}
            open={isLocationModalOpen}
            onCancel={() => setIsLocationModalOpen(false)}
            footer={[
              <Button key="close" onClick={() => setIsLocationModalOpen(false)} disabled={isStartingSync}>
                Close
              </Button>,
              <Button
                key="sync"
                type="primary"
                onClick={() => startSyncFlow(selectedLocation?.id)}
                disabled={!selectedLocation?.id || isStartingSync}
              >
                Sync for this location
              </Button>,
            ]}
            destroyOnClose
          >
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Square Location:</span>{' '}
                <span className="font-medium text-gray-900">{selectedLocation?.location_id ?? '—'}</span>
              </div>
            </div>
          </Modal>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <Result
              status="success"
              icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              title="Square POS Connected Successfully!"
              subTitle="Click a location to sync your Square data, then we’ll take you to Close Out Your Day(s)."
            />

            <div className="mt-4">
              <Typography.Title level={5} className="!mb-2">
                Locations
              </Typography.Title>

              {locationsError ? (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {locationsError}
                </div>
              ) : null}

              <Table
                rowKey={(r) => String(r?.location_id || r?.id || Math.random())}
                loading={locationsLoading}
                columns={columns}
                dataSource={locations}
                pagination={false}
                size="middle"
                onRow={(record) => ({
                  onClick: () => {
                    if (!record?.id) return;
                    setSelectedLocation(record);
                    setIsLocationModalOpen(true);
                  },
                })}
                rowClassName={(record) => (record?.id ? 'cursor-pointer' : '')}
              />

              <div className="mt-4 flex flex-wrap gap-2 justify-end">
                <Button onClick={loadLocations} disabled={locationsLoading || isStartingSync}>
                  Refresh Locations
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (result === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Result
          status="error"
          icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
          title="Connection Failed"
          subTitle={squareError || "We couldn't complete the Square connection. Please try again."}
          extra={[
            <Button type="primary" key="retry" onClick={() => window.location.reload()}>
              Try Again
            </Button>,
            <Button key="dashboard" onClick={handleGoToDashboard}>
              Go to Dashboard
            </Button>
          ]}
        />
      </div>
    );
  }
  
  return null;
};

export default SquareCallbackHandler;

