import React, { useEffect, useMemo } from 'react';
import { Card } from 'antd';
import useStore from '../../../store/store';
import GenericDataTable from '../../common/GenericDataTable';
import PageHeaderSection from '../../common/PageHeaderSection';

const PosLocations = () => {
  const fetchPosLocations = useStore((s) => s.fetchPosLocations);
  const loading = useStore((s) => s.posLocationsLoading);
  const error = useStore((s) => s.posLocationsError);
  const locations = useStore((s) => s.posLocations);

  useEffect(() => {
    fetchPosLocations?.({ silent: true });
  }, [fetchPosLocations]);

  const columns = useMemo(
    () => [
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
      <PageHeaderSection
        title="Locations"
        description="Square locations connected to this restaurant."
      />

      <Card className="shadow-lg border border-gray-100" bodyStyle={{ padding: 16 }}>
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

