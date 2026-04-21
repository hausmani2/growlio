import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, message, Typography } from 'antd';
import useStore from '../../../store/store';
import GenericDataTable from '../../common/GenericDataTable';
import PageHeaderSection from '../../common/PageHeaderSection';
import { apiPatch, apiPost } from '../../../utils/axiosInterceptors';
import { getMerchantSyncStatus, triggerPosSync } from '../../../services/posApi';
import { createPosSyncWebSocket } from '../../../services/websocket';
import SyncModal from '../../SyncModal';
import { useNavigate } from 'react-router-dom';

const PosLocations = () => {
  const navigate = useNavigate();
  const fetchPosLocations = useStore((s) => s.fetchPosLocations);
  const loading = useStore((s) => s.posLocationsLoading);
  const error = useStore((s) => s.posLocationsError);
  const locations = useStore((s) => s.posLocations);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [isStartingSync, setIsStartingSync] = useState(false);

  const pollingIntervalRef = useRef(null);
  const websocketRef = useRef(null);
  const completionHandledRef = useRef(false);

  const restaurantId = useMemo(() => {
    const raw = localStorage.getItem('restaurant_id');
    const n = Number.parseInt(String(raw || ''), 10);
    return Number.isFinite(n) ? n : null;
  }, []);

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
    fetchPosLocations?.({ silent: true });
  }, [fetchPosLocations]);

  useEffect(() => {
    return () => cleanupRealtimeResources();
  }, [cleanupRealtimeResources]);

  useEffect(() => {
    if (selectedLocationId) return;
    const first = (locations || []).find((l) => l?.id);
    if (first?.id) setSelectedLocationId(first.id);
  }, [locations, selectedLocationId]);

  const startSyncFlow = useCallback(async () => {
    if (!restaurantId) {
      message.error('Restaurant ID not found. Please select a restaurant first.');
      return;
    }
    if (!selectedLocationId) {
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
            location_id: selectedLocationId,
            sync_enabled: true,
          },
        ],
      });

      websocketRef.current = createPosSyncWebSocket({
        restaurantId,
        onCompleted: () => {
          if (completionHandledRef.current) return;
          completionHandledRef.current = true;
          cleanupRealtimeResources();
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
          const merchantStatus = await getMerchantSyncStatus(restaurantId);
          if (merchantStatus?.isCompleted) {
            completionHandledRef.current = true;
            cleanupRealtimeResources();
            message.success('Sync completed successfully');
            navigate('/dashboard', { replace: true });
          }
        } catch {
          // keep polling
        }
      }, 10000);

      await triggerPosSync(restaurantId);
    } catch (e) {
      cleanupRealtimeResources();
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to start sync.';
      message.error(msg);
    } finally {
      setIsStartingSync(false);
    }
  }, [cleanupRealtimeResources, navigate, restaurantId, selectedLocationId]);

  const columns = useMemo(
    () => [
      {
        title: 'Select',
        key: 'select',
        width: 90,
        render: (_, record) => (
          <input
            type="radio"
            name="square-location"
            checked={String(selectedLocationId || '') === String(record?.id || '')}
            onChange={() => setSelectedLocationId(record?.id)}
            disabled={!record?.id}
            aria-label={`Select location ${record?.name || ''}`}
          />
        ),
      },
      { title: 'Location ID', dataIndex: 'id', key: 'id', width: 200 },
      { title: 'Name', dataIndex: 'name', key: 'name', width: 240 },
      { title: 'Status', dataIndex: 'status', key: 'status', width: 120 },
      { title: 'Timezone', dataIndex: 'timezone', key: 'timezone', width: 180 },
      { title: 'Currency', dataIndex: 'currency', key: 'currency', width: 110 },
      { title: 'Phone', dataIndex: 'phone_number', key: 'phone_number', width: 160 },
      {
        title: 'Address',
        key: 'address',
        render: (_, r) => {
          const a = r?.address || {};
          const parts = [
            a.address_line_1,
            a.address_line_2,
            a.locality,
            a.administrative_district_level_1,
            a.postal_code,
            a.country,
          ].filter(Boolean);
          return parts.join(', ') || '-';
        },
      },
    ],
    []
  );

  return (
    <div className="w-full">
      <SyncModal open={isStartingSync} />
      <PageHeaderSection
        title="Locations"
        description="Square locations connected to this restaurant."
      />

      <Card className="shadow-lg border border-gray-100" bodyStyle={{ padding: 16 }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Typography.Text className="text-gray-600">
            Select a location and enable sync to pull your latest Square data.
          </Typography.Text>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => fetchPosLocations?.({ silent: true })} disabled={loading || isStartingSync}>
              Refresh
            </Button>
            <Button type="primary" onClick={startSyncFlow} disabled={!selectedLocationId || isStartingSync}>
              Enable Sync & Sync Now
            </Button>
          </div>
        </div>
        <div>
          <GenericDataTable
            rowKey={(r) => r?.id}
            columns={columns}
            dataSource={locations || []}
            loading={loading}
            error={error}
            pagination={false}
          />
        </div>
      </Card>
    </div>
  );
};

export default PosLocations;

