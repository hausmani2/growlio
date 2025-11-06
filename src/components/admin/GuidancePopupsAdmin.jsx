import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, message, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/axiosInterceptors';

// Page options for guidance popups
const pageOptions = [
  { label: 'Welcome Screen', value: 'congratulations' },
  { label: 'Restaurant Setup', value: 'onboarding' },
  { label: 'Onboarding: Basic Information', value: 'onboarding_basic_information' },
  { label: 'Onboarding: Labor Information', value: 'onboarding_labor_information' },
  { label: 'Onboarding: Food Cost Details', value: 'onboarding_food_cost_details' },
  { label: 'Onboarding: Sales Channels', value: 'onboarding_sales_channels' },
  { label: 'Onboarding: Expense', value: 'onboarding_expense' },
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Budget', value: 'budget' },
  { label: 'Profit & Loss', value: 'profit_loss' },
  { label: 'Basic Information', value: 'basic_information' },
  { label: 'Labor Information', value: 'labor_information' },
  { label: 'Food Cost Details', value: 'food_cost_details' },
  { label: 'Sales Channels', value: 'sales_channels' },
  { label: 'Expense', value: 'expense' },
  { label: 'Profile', value: 'profile' },
  { label: 'Support', value: 'support' },
  { label: 'FAQ', value: 'faq' },
  { label: 'Admin Users', value: 'admin_users' },
  { label: 'Admin Tooltips', value: 'admin_tooltips' },
];

const GuidancePopupsAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageFilter, setPageFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/admin_access/guidance-popups/');
      let data = response.data || [];
      
      // Filter by page if selected
      if (pageFilter) {
        data = data.filter(item => item.page === pageFilter);
      }
      
      // Sort by page, then by id
      data.sort((a, b) => {
        if (a.page !== b.page) {
          return a.page.localeCompare(b.page);
        }
        return a.id - b.id;
      });
      
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch guidance popups:', error);
      message.error('Failed to load guidance popups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pageFilter]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      page: pageFilter || 'dashboard',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editing) {
        // Update existing
        await apiPut(`/admin_access/guidance-popups/${editing.id}/`, values);
        message.success('Guidance popup updated successfully');
      } else {
        // Create new
        await apiPost('/admin_access/guidance-popups/', values);
        message.success('Guidance popup created successfully');
      }
      
      setIsModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchData();
    } catch (error) {
      if (error.response?.data) {
        const errorMsg = typeof error.response.data === 'string' 
          ? error.response.data 
          : Object.values(error.response.data).flat().join(', ');
        message.error(`Failed to save: ${errorMsg}`);
      } else {
        message.error('Failed to save guidance popup');
      }
    }
  };

  const handleDelete = async (record) => {
    try {
      await apiDelete(`/admin_access/guidance-popups/${record.id}/`);
      message.success('Guidance popup deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to delete guidance popup');
    }
  };

  const columns = [
    {
      title: 'Page',
      dataIndex: 'page',
      key: 'page',
      width: 180,
      render: (page) => {
        const pageOption = pageOptions.find(p => p.value === page);
        return pageOption ? pageOption.label : page;
      },
    },
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (key) => (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{key}</code>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'Text',
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
      render: (text) => (
        <span className="text-gray-600" title={text}>
          {text?.substring(0, 60)}
          {text?.length > 60 ? '...' : ''}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this guidance popup?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-500 mb-2">
            Guidance Popups Management
          </h1>
          <p className="text-gray-600">
            Manage interactive guidance popups that appear to new users across different pages.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Filter by Page:</span>
              <Select
                value={pageFilter}
                onChange={setPageFilter}
                style={{ width: 240 }}
                placeholder="All pages"
                allowClear
                options={[
                  { label: 'All Pages', value: '' },
                  ...pageOptions,
                ]}
              />
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
              className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600"
            >
              Add Guidance Popup
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={items}
            columns={columns}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} popups`,
            }}
          />
        </div>

        {/* Create/Edit Modal */}
        <Modal
          title={editing ? 'Edit Guidance Popup' : 'Create Guidance Popup'}
          open={isModalOpen}
          onOk={handleOk}
          onCancel={() => {
            setIsModalOpen(false);
            setEditing(null);
            form.resetFields();
          }}
          okText={editing ? 'Save' : 'Create'}
          cancelText="Cancel"
          width={600}
          okButtonProps={{
            className: 'bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600',
          }}
        >
          <Form
            layout="vertical"
            form={form}
            initialValues={{ is_active: true }}
          >
            <Form.Item
              name="page"
              label="Page"
              rules={[{ required: true, message: 'Please select a page' }]}
              tooltip="Select the page where this popup will appear"
            >
              <Select
                options={pageOptions}
                placeholder="Select a page"
              />
            </Form.Item>

            <Form.Item
              name="key"
              label="Element Key"
              rules={[
                { required: true, message: 'Please enter an element key' },
                { pattern: /^[a-z0-9_]+$/, message: 'Key must contain only lowercase letters, numbers, and underscores' },
              ]}
              tooltip="The data-guidance attribute value that matches an element on the page (e.g., 'sales_tips', 'budget_table')"
            >
              <Input
                placeholder="e.g., sales_tips, budget_table, profile_edit_btn"
                onInput={(e) => {
                  e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                }}
              />
            </Form.Item>

            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
              tooltip="The title displayed at the top of the popup"
            >
              <Input
                placeholder="e.g., Understanding Your Daily Sales"
                maxLength={100}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="text"
              label="Text"
              rules={[{ required: true, message: 'Please enter popup text' }]}
              tooltip="The main content of the guidance popup"
            >
              <Input.TextArea
                rows={4}
                placeholder="Enter the guidance text that will be displayed to users..."
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Active Status"
              valuePropName="checked"
              tooltip="Only active popups will be shown to users"
            >
              <Switch />
            </Form.Item>

            {editing && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Note:</strong> Make sure the target element on the page has the matching <code className="bg-blue-100 px-1 rounded">data-guidance="{editing.key}"</code> attribute.
                </p>
              </div>
            )}
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default GuidancePopupsAdmin;

