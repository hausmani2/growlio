import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  Popconfirm,
} from 'antd';
import {
  DownloadOutlined,
  EyeOutlined,
  MailOutlined,
  PlusOutlined,
  StopOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../../utils/axiosInterceptors';
import useRestaurantRole from '../../../hooks/useRestaurantRole';
import useStore from '../../../store/store';
import { enterFranchiseReadOnlyView } from '../../../utils/franchiseContext';

const { Text } = Typography;

const STATUS_COLORS = {
  invited: 'gold',
  joined: 'green',
  suspended: 'orange',
  cancelled: 'default',
};

const statusLabel = (s) => {
  const map = {
    complete: 'Complete',
    in_progress: 'In progress',
    not_started: 'Not started',
    not_available: '—',
  };
  return map[s] || s || '—';
};

const FranchiseNetworkTab = () => {
  const navigate = useNavigate();
  const { restaurantId, isOwner } = useRestaurantRole();
  const subscriptionDetails = useStore((s) => s.subscriptionDetails);
  const currentPackage = useStore((s) => s.currentPackage);
  const fetchLocations = useStore((s) => s.fetchLocations);
  const currentUserEmail = useStore((s) => (s.user?.email || '').trim().toLowerCase());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferRow, setTransferRow] = useState(null);
  const [packages, setPackages] = useState([]);
  const [packageOpen, setPackageOpen] = useState(false);
  const [form] = Form.useForm();
  const [transferForm] = Form.useForm();
  const [packageForm] = Form.useForm();

  const activePlan = subscriptionDetails?.package || currentPackage || null;
  const planKey = (
    activePlan?.key ||
    activePlan?.name ||
    activePlan?.package_name ||
    ''
  )
    .toString()
    .toLowerCase();
  const features = activePlan?.features || {};
  const canUseNetwork =
    isOwner && (features.franchisor_network === true || planKey === 'pro');

  const load = useCallback(async () => {
    if (!restaurantId || !canUseNetwork) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ restaurant_id: String(restaurantId) });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (planFilter) params.set('plan', planFilter);
      const response = await apiGet(`/restaurant_v2/franchise/network/?${params.toString()}`);
      const data = response?.data;
      setRows(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        'Failed to load location network.';
      message.error(typeof msg === 'string' ? msg : 'Failed to load location network.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, canUseNetwork, search, statusFilter, planFilter]);

  const loadPackages = useCallback(async () => {
    if (!restaurantId || !canUseNetwork) return;
    try {
      const res = await apiGet(
        `/restaurant_v2/franchise/food-costing/packages/?restaurant_id=${restaurantId}&as=franchisor`
      );
      setPackages(Array.isArray(res?.data?.results) ? res.data.results : []);
    } catch {
      setPackages([]);
    }
  }, [restaurantId, canUseNetwork]);

  useEffect(() => {
    load();
    loadPackages();
  }, [load, loadPackages]);

  const runAction = async (action, row) => {
    try {
      await apiPost(
        `/restaurant_v2/franchise/network/${row.id}/${action}/?restaurant_id=${restaurantId}`,
        { restaurant_id: restaurantId }
      );
      message.success(
        action === 'resend'
          ? 'Invite resent.'
          : action === 'cancel'
            ? 'Invite cancelled.'
            : action === 'suspend'
              ? 'Location suspended.'
              : action === 'unsuspend'
                ? 'Location reactivated.'
                : 'Removed from network.'
      );
      load();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        `Failed to ${action}.`;
      message.error(typeof msg === 'string' ? msg : `Failed to ${action}.`);
    }
  };

  const handleInvite = async (values) => {
    setInviteSubmitting(true);
    try {
      await apiPost('/restaurant_v2/franchise/network/invite/', {
        restaurant_id: restaurantId,
        location_name: values.location_name,
        contact_name: values.contact_name,
        email: values.email,
      });
      message.success('Invitation sent.');
      setInviteOpen(false);
      form.resetFields();
      load();
    } catch (err) {
      const data = err?.response?.data;
      const emailErr = Array.isArray(data?.email) ? data.email[0] : data?.email;
      const msg =
        (typeof emailErr === 'string' && emailErr) ||
        (typeof data?.detail === 'string' && data.detail) ||
        (typeof data?.error === 'string' && data.error) ||
        (typeof data === 'string' ? data : null) ||
        'Failed to send invite.';
      if (typeof emailErr === 'string' && emailErr) {
        form.setFields([{ name: 'email', errors: [emailErr] }]);
      }
      message.error(msg);
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleTransfer = async (values) => {
    try {
      await apiPost(
        `/restaurant_v2/franchise/network/${transferRow.id}/transfer-ownership/`,
        {
          restaurant_id: restaurantId,
          new_owner_email: values.new_owner_email,
          confirm: true,
          notes: values.notes || '',
        }
      );
      message.success('Ownership transferred.');
      setTransferOpen(false);
      transferForm.resetFields();
      load();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Transfer failed.';
      message.error(typeof msg === 'string' ? msg : 'Transfer failed.');
    }
  };

  const handlePublishPackage = async (values) => {
    try {
      await apiPost('/restaurant_v2/franchise/food-costing/packages/publish/', {
        restaurant_id: restaurantId,
        name: values.name,
        description: values.description || '',
        allowed_mode: values.allowed_mode || 'copy_customize',
      });
      message.success('Food costing package published.');
      setPackageOpen(false);
      packageForm.resetFields();
      loadPackages();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Publish failed.';
      message.error(typeof msg === 'string' ? msg : 'Publish failed.');
    }
  };

  const openFranchiseDashboard = async (row) => {
    if (!row.franchisee_restaurant_id || row.status !== 'joined') {
      message.warning('Only joined locations can be reviewed.');
      return;
    }
    enterFranchiseReadOnlyView({
      homeRestaurantId: restaurantId,
      franchiseeRestaurantId: row.franchisee_restaurant_id,
      label: row.location_name,
    });
    try {
      await fetchLocations?.(row.franchisee_restaurant_id, true);
    } catch (_) {
      /* ignore */
    }
    navigate('/dashboard/report-card');
    window.location.reload();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ restaurant_id: String(restaurantId) });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (planFilter) params.set('plan', planFilter);
      const response = await apiGet(`/restaurant_v2/franchise/network/export/?${params.toString()}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: response.headers?.['content-type'] || 'text/csv;charset=utf-8',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'franchise_location_network.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      message.error('Failed to export CSV.');
    }
  };

  const columns = useMemo(
    () => [
      { title: 'Location', dataIndex: 'location_name', key: 'location_name' },
      { title: 'Contact', dataIndex: 'contact_name', key: 'contact_name' },
      { title: 'Email', dataIndex: 'email', key: 'email' },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (s) => <Tag color={STATUS_COLORS[s] || 'default'}>{(s || '').toUpperCase()}</Tag>,
      },
      {
        title: 'Plan',
        dataIndex: 'current_plan',
        key: 'current_plan',
        render: (p) => (p ? p.toUpperCase() : '—'),
      },
      {
        title: 'Budget setup',
        dataIndex: 'budget_setup_status',
        key: 'budget_setup_status',
        render: statusLabel,
      },
      {
        title: 'Food costing',
        dataIndex: 'food_costing_status',
        key: 'food_costing_status',
        render: statusLabel,
      },
      {
        title: 'Last login',
        dataIndex: 'last_login',
        key: 'last_login',
        render: (v) => (v ? new Date(v).toLocaleString() : '—'),
      },
      {
        title: 'POS',
        dataIndex: 'pos_connected',
        key: 'pos_connected',
        render: (v) => (v ? <Tag color="green">Connected</Tag> : <Tag>No</Tag>),
      },
      {
        title: 'Last closeout',
        dataIndex: 'last_daily_closeout',
        key: 'last_daily_closeout',
        render: (v) => v || '—',
      },
      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right',
        width: 280,
        render: (_, row) => (
          <Space size="small" wrap>
            <Tooltip title="View details">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  setDetailRow(row);
                  setDetailOpen(true);
                }}
              />
            </Tooltip>
            {row.status === 'joined' && row.franchisee_restaurant_id && (
              <Tooltip title="Open dashboards (read-only)">
                <Button
                  size="small"
                  icon={<DashboardOutlined />}
                  onClick={() => openFranchiseDashboard(row)}
                />
              </Tooltip>
            )}
            {row.status === 'invited' && (
              <>
                <Tooltip title="Resend">
                  <Button
                    size="small"
                    icon={<MailOutlined />}
                    onClick={() => runAction('resend', row)}
                  />
                </Tooltip>
                <Popconfirm title="Cancel this invite?" onConfirm={() => runAction('cancel', row)}>
                  <Button size="small" icon={<CloseCircleOutlined />} danger />
                </Popconfirm>
              </>
            )}
            {row.status === 'joined' && (
              <Popconfirm title="Suspend this location?" onConfirm={() => runAction('suspend', row)}>
                <Button size="small" icon={<StopOutlined />} />
              </Popconfirm>
            )}
            {row.status === 'suspended' && (
              <Tooltip title="Reactivate">
                <Button
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => runAction('unsuspend', row)}
                />
              </Tooltip>
            )}
            {(row.status === 'joined' || row.status === 'suspended') && (
              <Tooltip title="Transfer ownership">
                <Button
                  size="small"
                  icon={<SwapOutlined />}
                  onClick={() => {
                    setTransferRow(row);
                    setTransferOpen(true);
                  }}
                />
              </Tooltip>
            )}
            {row.status !== 'cancelled' && (
              <Popconfirm title="Remove this link?" onConfirm={() => runAction('remove', row)}>
                <Button size="small" icon={<DeleteOutlined />} danger />
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [restaurantId]
  );

  if (!canUseNetwork) {
    return (
      <Card className="shadow-sm border-0 bg-gray-50">
        <Text type="secondary">
          Location Network is available on the Pro plan for restaurant owners.
        </Text>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-0 bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-gray-200 mb-6">
          <div>
            <h3 className="text-xl font-bold text-orange-600">Location Network</h3>
            <p className="text-sm text-gray-600 mb-0">
              Invite franchise locations, track engagement, and open dashboards read-only.
            </p>
          </div>
          <Space wrap>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export CSV
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-orange-500 hover:bg-orange-600 border-0"
              onClick={() => setInviteOpen(true)}
            >
              Invite location
            </Button>
          </Space>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Input.Search
            allowClear
            placeholder="Search location, contact, email"
            onSearch={(v) => setSearch(v || '')}
            onChange={(e) => {
              if (!e.target.value) setSearch('');
            }}
            className="md:max-w-xs"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="md:w-40"
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active (joined)' },
              { value: 'invited', label: 'Invited' },
              { value: 'joined', label: 'Joined' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
          <Select
            allowClear
            placeholder="Plan"
            value={planFilter || undefined}
            onChange={(v) => setPlanFilter(v || '')}
            className="md:w-36"
            options={[
              { value: 'lite', label: 'Lite' },
              { value: 'grow', label: 'Grow' },
              { value: 'pro', label: 'Pro' },
            ]}
          />
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Card className="shadow-sm border-0 bg-gray-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-gray-200 mb-4">
          <div>
            <h3 className="text-xl font-bold text-orange-600">Shared food costing</h3>
            <p className="text-sm text-gray-600 mb-0">
              Publish a package for franchisees to view or copy into their restaurant.
            </p>
          </div>
          <Button type="primary" className="bg-orange-500" onClick={() => setPackageOpen(true)}>
            Publish package
          </Button>
        </div>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={packages}
          columns={[
            { title: 'Name', dataIndex: 'name' },
            {
              title: 'Mode',
              dataIndex: 'allowed_mode',
              render: (m) => (m === 'view_only' ? 'View only' : 'Copy & customize'),
            },
            { title: 'Ingredients', dataIndex: 'ingredient_count' },
            { title: 'Menu items', dataIndex: 'menu_item_count' },
            {
              title: 'Active',
              dataIndex: 'is_active',
              render: (v) => (v ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>),
            },
            {
              title: 'Actions',
              render: (_, row) =>
                row.is_active ? (
                  <Popconfirm
                    title="Deactivate this package?"
                    onConfirm={async () => {
                      await apiPost(
                        `/restaurant_v2/franchise/food-costing/packages/${row.id}/deactivate/`,
                        { restaurant_id: restaurantId }
                      );
                      message.success('Package deactivated.');
                      loadPackages();
                    }}
                  >
                    <Button size="small" danger>
                      Deactivate
                    </Button>
                  </Popconfirm>
                ) : null,
            },
          ]}
        />
      </Card>

      <Modal title="Invite location" open={inviteOpen} onCancel={() => setInviteOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleInvite}>
          <Form.Item name="location_name" label="Location name" rules={[{ required: true }]}>
            <Input placeholder="Downtown Store #12" />
          </Form.Item>
          <Form.Item name="contact_name" label="Contact name" rules={[{ required: true }]}>
            <Input placeholder="Jane Franchisee" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true },
              { type: 'email' },
              {
                validator: (_, value) => {
                  const inviteEmail = (value || '').trim().toLowerCase();
                  if (inviteEmail && currentUserEmail && inviteEmail === currentUserEmail) {
                    return Promise.reject(
                      new Error('You cannot invite your own email to the location network.')
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="owner@location.com" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={inviteSubmitting} className="bg-orange-500">
              Send invite
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Transfer franchisee ownership"
        open={transferOpen}
        onCancel={() => setTransferOpen(false)}
        footer={null}
        destroyOnClose
      >
        <p className="text-sm text-gray-600 mb-3">
          Transfer primary ownership of the linked restaurant to an existing Growlio user. The
          franchise network link stays on the same restaurant.
        </p>
        <Form form={transferForm} layout="vertical" onFinish={handleTransfer}>
          <Form.Item
            name="new_owner_email"
            label="New owner email"
            rules={[{ required: true }, { type: 'email' }]}
          >
            <Input placeholder="newowner@example.com" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" danger>
              Confirm transfer
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Publish food costing package"
        open={packageOpen}
        onCancel={() => setPackageOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={packageForm} layout="vertical" onFinish={handlePublishPackage} initialValues={{ allowed_mode: 'copy_customize' }}>
          <Form.Item name="name" label="Package name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="allowed_mode" label="Franchisee access">
            <Select
              options={[
                { value: 'copy_customize', label: 'Copy & customize' },
                { value: 'view_only', label: 'View only' },
              ]}
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setPackageOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" className="bg-orange-500">
              Publish
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Location details"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Close
          </Button>,
        ]}
      >
        {detailRow && (
          <div className="space-y-2 text-sm text-gray-700">
            <div>
              <Text strong>Location:</Text> {detailRow.location_name}
            </div>
            <div>
              <Text strong>Contact:</Text> {detailRow.contact_name}
            </div>
            <div>
              <Text strong>Email:</Text> {detailRow.email}
            </div>
            <div>
              <Text strong>Status:</Text> {detailRow.status}
            </div>
            <div>
              <Text strong>Plan:</Text> {detailRow.current_plan || '—'}
            </div>
            <div>
              <Text strong>Budget setup:</Text> {statusLabel(detailRow.budget_setup_status)}
            </div>
            <div>
              <Text strong>Food costing:</Text> {statusLabel(detailRow.food_costing_status)}
            </div>
            <div>
              <Text strong>POS connected:</Text> {detailRow.pos_connected ? 'Yes' : 'No'}
            </div>
            <div>
              <Text strong>Last daily closeout:</Text> {detailRow.last_daily_closeout || '—'}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FranchiseNetworkTab;
