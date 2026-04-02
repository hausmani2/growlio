import React, { useEffect, useMemo, useState } from 'react';
import { Card } from 'antd';
import useStore from '../../../store/store';
import GenericDataTable from '../../common/GenericDataTable';
import PageHeaderSection from '../../common/PageHeaderSection';
import { Typography } from 'antd';

const { Text } = Typography;

const currency = (amount, code) => {
  if (amount === null || amount === undefined) return '-';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code || 'USD' }).format(amount / 100);
  } catch {
    return `${amount}`;
  }
};

const PosOrders = () => {
  const fetchPosOrders = useStore((s) => s.fetchPosOrders);
  const loading = useStore((s) => s.posOrdersLoading);
  const error = useStore((s) => s.posOrdersError);
  const orders = useStore((s) => s.posOrders);
  const pagination = useStore((s) => s.posOrdersPagination);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchPosOrders?.({ pageNumber: page, pageSize, silent: true });
  }, [fetchPosOrders, page, pageSize]);

  const columns = useMemo(
    () => [
      { title: 'Order ID', dataIndex: 'order_id', key: 'order_id', width: 260 },
      { title: 'Location', dataIndex: 'location_id', key: 'location_id', width: 160 },
      { title: 'State', dataIndex: 'state', key: 'state', width: 140 },
      {
        title: 'Created',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 220,
        render: (v) => (v ? new Date(v).toLocaleString() : '-'),
      },
      {
        title: 'Total',
        key: 'total_amount',
        width: 160,
        render: (_, r) => currency(r?.total_amount, r?.total_currency),
      },
      {
        title: 'Line Items',
        key: 'line_items',
        render: (_, r) => {
          const items = Array.isArray(r?.line_items) ? r.line_items : [];
          if (!items.length) return '-';
          return (
            <div className="min-w-[260px]">
              {items.slice(0, 3).map((li, idx) => (
                <div key={`${r?.order_id || r?.id}-${idx}`} className="text-xs text-gray-700">
                  <Text strong>{li?.name || 'Item'}</Text> · qty {li?.quantity || '-'} ·{' '}
                  {currency(li?.total_price, li?.currency)}
                </div>
              ))}
              {items.length > 3 ? <div className="text-xs text-gray-500">+{items.length - 3} more</div> : null}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="w-full">
      <PageHeaderSection title="POS Orders" description="Orders synced from Square." />

      <Card className="shadow-lg border border-gray-100" bodyStyle={{ padding: 16 }}>
        <div>
          <GenericDataTable
            rowKey={(r) => r?.id ?? r?.order_id}
            columns={columns}
            dataSource={orders || []}
            loading={loading}
            error={error}
            pagination={{
              current: pagination?.current_page || page,
              pageSize: pagination?.page_size || pageSize,
              total: pagination?.total_count || 0,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default PosOrders;

