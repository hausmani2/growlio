import React, { useEffect, useState } from 'react';
import { Button, Card, Modal, Space, Table, Tag, Typography, message } from 'antd';
import { apiGet, apiPost } from '../../../utils/axiosInterceptors';
import { isFranchiseReadOnlyView } from '../../../utils/franchiseContext';

const { Text } = Typography;

/**
 * Franchisee panel: view / copy franchisor-published food costing packages.
 */
const FranchiseFoodCostPackagesPanel = ({ restaurantId, locationId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewPayload, setViewPayload] = useState(null);
  const readOnly = isFranchiseReadOnlyView();

  const load = async () => {
    if (!restaurantId || readOnly) return;
    try {
      const ownIds = JSON.parse(sessionStorage.getItem('franchise_own_restaurant_ids') || '[]');
      if (Array.isArray(ownIds) && ownIds.map(String).includes(String(restaurantId))) {
        setRows([]);
        return;
      }
    } catch {
      /* fall through and ask the package list */
    }
    setLoading(true);
    try {
      const res = await apiGet(
        `/restaurant_v2/franchise/food-costing/packages/?restaurant_id=${restaurantId}&as=franchisee`
      );
      setRows(Array.isArray(res?.data?.results) ? res.data.results : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [restaurantId]);

  if (readOnly || !restaurantId || rows.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 border border-orange-100 bg-orange-50/40">
      <div className="mb-3">
        <Text strong className="text-orange-700">
          Franchisor food costing packages
        </Text>
        <div className="text-sm text-gray-600">
          View published packages or copy them into this restaurant to customize.
        </div>
      </div>
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        pagination={false}
        dataSource={rows}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          {
            title: 'Mode',
            dataIndex: 'allowed_mode',
            render: (m) => (m === 'view_only' ? 'View only' : 'Copy & customize'),
          },
          {
            title: 'Copied',
            dataIndex: 'already_copied',
            render: (v) => (v ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>),
          },
          {
            title: 'Actions',
            render: (_, row) => (
              <Space>
                <Button
                  size="small"
                  onClick={async () => {
                    const res = await apiGet(
                      `/restaurant_v2/franchise/food-costing/packages/${row.id}/?restaurant_id=${restaurantId}`
                    );
                    setViewPayload(res?.data);
                  }}
                >
                  View
                </Button>
                {row.allowed_mode !== 'view_only' && !row.already_copied && (
                  <Button
                    size="small"
                    type="primary"
                    className="bg-orange-500"
                    onClick={async () => {
                      try {
                        await apiPost(
                          `/restaurant_v2/franchise/food-costing/packages/${row.id}/copy/`,
                          {
                            restaurant_id: restaurantId,
                            location_id: locationId,
                          }
                        );
                        message.success('Package copied into your restaurant.');
                        load();
                      } catch (err) {
                        const msg =
                          err?.response?.data?.error ||
                          err?.response?.data?.detail ||
                          'Copy failed.';
                        message.error(typeof msg === 'string' ? msg : 'Copy failed.');
                      }
                    }}
                  >
                    Copy & customize
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={viewPayload?.name || 'Package'}
        open={!!viewPayload}
        onCancel={() => setViewPayload(null)}
        footer={[
          <Button key="close" onClick={() => setViewPayload(null)}>
            Close
          </Button>,
        ]}
        width={720}
      >
        {viewPayload && (
          <div className="text-sm space-y-2 max-h-96 overflow-auto">
            <div>{viewPayload.description}</div>
            <div>
              <Text strong>Ingredients:</Text>{' '}
              {(viewPayload.payload?.ingredients || []).length}
            </div>
            <div>
              <Text strong>Prep items:</Text>{' '}
              {(viewPayload.payload?.house_made_recipes || []).length}
            </div>
            <div>
              <Text strong>Menu items:</Text>{' '}
              {(viewPayload.payload?.menu_items || []).length}
            </div>
            <ul className="list-disc pl-5">
              {(viewPayload.payload?.menu_items || []).slice(0, 20).map((m) => (
                <li key={m.source_id || m.name}>{m.name}</li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default FranchiseFoodCostPackagesPanel;
