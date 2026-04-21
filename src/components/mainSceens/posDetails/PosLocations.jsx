import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Modal, Table, message, Typography } from 'antd';
import useStore from '../../../store/store';
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
  const [isStartingSync, setIsStartingSync] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

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

  const startSyncFlow = useCallback(async (locationId) => {
    if (!restaurantId) {
      message.error('Restaurant ID not found. Please select a restaurant first.');
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

      websocketRef.current = createPosSyncWebSocket({
        restaurantId,
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
          const merchantStatus = await getMerchantSyncStatus(restaurantId);
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

      await triggerPosSync(restaurantId);
    } catch (e) {
      cleanupRealtimeResources();
      setIsStartingSync(false);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to start sync.';
      message.error(msg);
    }
  }, [cleanupRealtimeResources, navigate, restaurantId]);

  const columns = useMemo(
    () => [
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
            <span className="text-gray-500">Status:</span>{' '}
            <span className="font-medium text-gray-900">{selectedLocation?.status ?? '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Timezone:</span>{' '}
            <span className="font-medium text-gray-900">{selectedLocation?.timezone ?? '—'}</span>
          </div>
        </div>
      </Modal>
      <PageHeaderSection
        title="Locations"
        description="Square locations connected to this restaurant."
      />

      <Card className="shadow-lg border border-gray-100" bodyStyle={{ padding: 16 }}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Typography.Text className="text-gray-600">
            Click a location to sync data for it.
          </Typography.Text>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => fetchPosLocations?.({ silent: true })} disabled={loading || isStartingSync}>
              Refresh
            </Button>
          </div>
        </div>
        {error ? (
          <div className="mb-3">
            <Alert type="error" showIcon message="Something went wrong" description={error} />
          </div>
        ) : null}
        <Table
          rowKey={(r) => r?.id}
          columns={columns}
          dataSource={locations || []}
          loading={loading}
          pagination={false}
          scroll={{ x: 900 }}
          onRow={(record) => ({
            onClick: () => {
              if (!record?.id) return;
              setSelectedLocation(record);
              setIsLocationModalOpen(true);
            },
          })}
          rowClassName={(record) =>
            record?.id ? 'cursor-pointer' : ''
          }
          locale={{
            emptyText: error ? 'Failed to load data.' : 'No data found.',
          }}
        />
      </Card>
    </div>
  );
};

export default PosLocations;

