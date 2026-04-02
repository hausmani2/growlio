import React, { useEffect, useMemo, useState } from 'react';
import { Card } from 'antd';
import useStore from '../../../store/store';
import GenericDataTable from '../../common/GenericDataTable';
import PageHeaderSection from '../../common/PageHeaderSection';

const PosTimecards = () => {
  const fetchPosTimecards = useStore((s) => s.fetchPosTimecards);
  const loading = useStore((s) => s.posTimecardsLoading);
  const error = useStore((s) => s.posTimecardsError);
  const timecards = useStore((s) => s.posTimecards);
  const pagination = useStore((s) => s.posTimecardsPagination);

  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPosTimecards?.({ pageNumber: page, silent: true });
  }, [fetchPosTimecards, page]);

  const columns = useMemo(
    () => [
      { title: 'Timecard ID', dataIndex: 'timecard_id', key: 'timecard_id', width: 220 },
      { title: 'Location', dataIndex: 'location_id', key: 'location_id', width: 160 },
      { title: 'Team Member', dataIndex: 'team_member_id', key: 'team_member_id', width: 220 },
      { title: 'Status', dataIndex: 'status', key: 'status', width: 120 },
      {
        title: 'Start',
        dataIndex: 'start_at',
        key: 'start_at',
        width: 220,
        render: (v) => (v ? new Date(v).toLocaleString() : '-'),
      },
      {
        title: 'End',
        dataIndex: 'end_at',
        key: 'end_at',
        width: 220,
        render: (v) => (v ? new Date(v).toLocaleString() : '-'),
      },
      { title: 'Hours', dataIndex: 'hours', key: 'hours', width: 100 },
      {
        title: 'Labor Cost',
        key: 'labor_cost',
        width: 140,
        render: (_, r) => `${r?.labor_cost ?? 0} ${r?.currency || ''}`.trim(),
      },
    ],
    []
  );

  return (
    <div className="w-full">
      <PageHeaderSection title="POS Timecards" description="Team timecards synced from Square." />

      <Card className="shadow-lg border border-gray-100" bodyStyle={{ padding: 16 }}>
        <div>
          <GenericDataTable
            rowKey={(r) => r?.timecard_id}
            columns={columns}
            dataSource={timecards || []}
            loading={loading}
            error={error}
            pagination={{
              current: pagination?.current_page || page,
              pageSize: pagination?.page_size || 10,
              total: pagination?.total_count || 0,
              showSizeChanger: false,
              onChange: (p) => setPage(p),
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default PosTimecards;

