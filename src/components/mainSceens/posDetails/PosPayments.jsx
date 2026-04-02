import React, { useEffect, useMemo, useState } from 'react';
import { Card } from 'antd';
import useStore from '../../../store/store';
import GenericDataTable from '../../common/GenericDataTable';
import PageHeaderSection from '../../common/PageHeaderSection';

const PosPayments = () => {
  const fetchPosPayments = useStore((s) => s.fetchPosPayments);
  const loading = useStore((s) => s.posPaymentsLoading);
  const error = useStore((s) => s.posPaymentsError);
  const payments = useStore((s) => s.posPayments);
  const pagination = useStore((s) => s.posPaymentsPagination);

  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPosPayments?.({ pageNumber: page, silent: true });
  }, [fetchPosPayments, page]);

  const columns = useMemo(
    () => [
      { title: 'Payment ID', dataIndex: 'payment_id', key: 'payment_id', width: 260 },
      { title: 'Location', dataIndex: 'location_id', key: 'location_id', width: 160 },
      { title: 'Status', dataIndex: 'status', key: 'status', width: 140 },
      {
        title: 'Amount',
        key: 'amount',
        width: 140,
        render: (_, r) => {
          const amount = r?.amount;
          const code = r?.currency || 'USD';
          if (amount === null || amount === undefined) return '-';
          try {
            return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(amount);
          } catch {
            return `${amount} ${code}`;
          }
        },
      },
      { title: 'Source', dataIndex: 'source', key: 'source', width: 140 },
      { title: 'Order ID', dataIndex: 'order_id', key: 'order_id', width: 220 },
      {
        title: 'Receipt',
        dataIndex: 'receipt_url',
        key: 'receipt_url',
        render: (v) => (v ? <a href={v} target="_blank" rel="noreferrer">Open</a> : '-'),
        width: 120,
      },
      {
        title: 'Created',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 220,
        render: (v) => (v ? new Date(v).toLocaleString() : '-'),
      },
    ],
    []
  );

  return (
    <div className="w-full">
      <PageHeaderSection title="POS Payments" description="Payments synced from Square." />

      <Card className="shadow-lg border border-gray-100" bodyStyle={{ padding: 16 }}>
        <div>
          <GenericDataTable
            rowKey={(r) => r?.payment_id}
            columns={columns}
            dataSource={payments || []}
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

export default PosPayments;

