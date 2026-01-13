import React, { useEffect, useState, useRef } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, message, Popconfirm, Card, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../utils/axiosInterceptors';

const pages = [
  { label: 'Onboarding: Basic', value: 'onboarding-basic' },
  { label: 'Onboarding: Labor', value: 'onboarding-labor' },
  { label: 'Onboarding: Food Cost', value: 'onboarding-food' },
  { label: 'Onboarding: Sales Channels', value: 'onboarding-sales' },
  { label: 'Onboarding: Expense', value: 'onboarding-expense' },
];

const SuperAdminTooltips = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageFilter, setPageFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedPage, setSelectedPage] = useState('onboarding-basic');
  const [form] = Form.useForm();
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const lastPageFilterRef = useRef('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = pageFilter ? `/restaurant/tooltips/?page=${encodeURIComponent(pageFilter)}` : '/restaurant/tooltips/';
      const res = await apiGet(url);
      setItems(res.data || []);
    } catch (e) {
      message.error('Failed to load tooltips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset fetch flag if page filter changed
    if (lastPageFilterRef.current !== pageFilter) {
      hasFetchedRef.current = false;
      lastPageFilterRef.current = pageFilter;
    }

    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) {
      return;
    }

    // Only fetch if we don't have items yet or filter changed
    if (hasFetchedRef.current && items.length > 0 && lastPageFilterRef.current === pageFilter) {
      return;
    }

    const loadData = async () => {
      isFetchingRef.current = true;
      try {
        await fetchData();
        hasFetchedRef.current = true;
      } finally {
        isFetchingRef.current = false;
      }
    };

    loadData();
  }, [pageFilter]);

  // Debug form values when modal opens
  useEffect(() => {
    if (isModalOpen && editing) {
      const formValues = form.getFieldsValue();
    }
  }, [isModalOpen, editing, form]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    const defaultPage = pageFilter || 'onboarding-basic';
    setSelectedPage(defaultPage);
    form.setFieldsValue({ page: defaultPage, is_active: true });
    setIsModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setSelectedPage(record.page);
    // Reset form first to clear any previous values
    form.resetFields();
    // Set the form values with the record data
    const formValues = {
      ...record,
      is_active: Boolean(record.is_active) // Ensure boolean conversion
    };
    form.setFieldsValue(formValues);
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await apiPut(`/restaurant/tooltips/${editing.id}/`, values);
        message.success('Tooltip updated successfully');
      } else {
        await apiPost('/restaurant/tooltips/', values);
        message.success('Tooltip created successfully');
      }
      setIsModalOpen(false);
      setEditing(null);
      setSelectedPage('onboarding-basic');
      form.resetFields();
      fetchData();
    } catch (e) {
      // validation or api error handled by antd or message above
    }
  };

  const handleDelete = async (record) => {
    try {
      await apiDelete(`/restaurant/tooltips/${record.id}/`);
      message.success('Tooltip deleted successfully');
      fetchData();
    } catch (e) {
      message.error('Failed to delete tooltip');
    }
  };

  const getKeyOptions = (page) => {
    switch (page) {
      case 'onboarding-basic':
        return [
          { label: 'Restaurant Name', value: 'restaurant_name' },
          { label: 'Number of Locations', value: 'number_of_locations' },
          { label: 'Location Name', value: 'location_name' },
          { label: 'Restaurant Type', value: 'restaurant_type' },
          { label: 'Menu Type', value: 'menu_type' },
          { label: 'Address 1', value: 'address_1' },
          { label: 'Address 2', value: 'address_2' },
          { label: 'Country', value: 'country' },
          { label: 'City', value: 'city' },
          { label: 'State', value: 'state' },
          { label: 'Zip Code', value: 'zip_code' },
          { label: 'SQFT', value: 'sqft' },
          { label: 'Is Franchise', value: 'is_franchise' },
        ];
      case 'onboarding-labor':
        return [
          { label: 'Labor Goal %', value: 'labour_goal' },
          { label: 'Avg Hourly Rate', value: 'avg_hourly_rate' },
          { label: 'Labor Record Method', value: 'labor_record_method' },
          { label: 'Daily Ticket Count', value: 'daily_ticket_count' },
          { label: 'Forward Prev Week Rate', value: 'forward_previous_week_rate' },
        ];
      case 'onboarding-food':
        return [
          { label: 'COGS Goal %', value: 'cogs_goal' },
          { label: 'Delivery Days', value: 'delivery_days' },
          { label: 'Hired Party Delivery', value: 'hired_party_delivery' },
          { label: 'Third Party Delivery', value: 'third_party_delivery' },
        ];
      case 'onboarding-sales':
        return [
          { label: 'Operating Days', value: 'restaurant_days' },
          { label: 'Sales Channels', value: 'sales_channels' },
        ];
      case 'onboarding-expense':
        return [
          { label: 'Fixed Costs', value: 'fixed_costs' },
          { label: 'Variable Costs', value: 'variable_costs' },
          { label: 'Total Weekly Expense', value: 'total_weekly_expense' },
          { label: 'Total Monthly Expense', value: 'total_monthly_expense' },
        ];
      default:
        return [];
    }
  };

  const getPageLabel = (pageValue) => {
    const page = pages.find(p => p.value === pageValue);
    return page ? page.label : pageValue;
  };

  const columns = [
    { 
      title: 'Page', 
      dataIndex: 'page', 
      key: 'page',
      render: (page) => (
        <Tag color="blue">{getPageLabel(page)}</Tag>
      )
    },
    { 
      title: 'Key', 
      dataIndex: 'key', 
      key: 'key',
      render: (key) => (
        <Tag color="green">{key}</Tag>
      )
    },
    { 
      title: 'Text', 
      dataIndex: 'text', 
      key: 'text',
      ellipsis: true,
      render: (text) => (
        <div style={{ maxWidth: 300 }}>
          {text}
        </div>
      )
    },
    { 
      title: 'Active', 
      dataIndex: 'is_active', 
      key: 'is_active', 
      render: (v) => (
        <Tag color={v ? 'green' : 'red'}>
          {v ? 'Yes' : 'No'}
        </Tag>
      )
    },
    { 
      title: 'Updated At', 
      dataIndex: 'updated_at', 
      key: 'updated_at',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions', 
      key: 'actions', 
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm 
            title="Delete tooltip?" 
            description="Are you sure you want to delete this tooltip?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="link" 
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section - Matching other dashboards */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
          {/* Left Side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              Tooltips
            </h1>
            <p className="text-gray-600 text-lg">
              Manage tooltips and help text for all onboarding pages
            </p>
          </div>
          
          {/* Right Side - Filter and Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Filter Section */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Filter by Page:</span>
              <Select
                value={pageFilter}
                style={{ width: 240, height: 40 }}
                onChange={setPageFilter}
                placeholder="All pages"
                allowClear
                options={[
                  { label: 'All Pages', value: '' },
                  ...pages
                ]}
              />
            </div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={openCreate}
              size="large"
              className="bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Add Tooltip
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-lg border-0 rounded-xl">
        <Table 
          rowKey="id" 
          loading={loading} 
          dataSource={items} 
          columns={columns}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <InfoCircleOutlined className="text-blue-500" />
            <span>{editing ? 'Edit Tooltip' : 'Create Tooltip'}</span>
          </div>
        }
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          setEditing(null);
          setSelectedPage('onboarding-basic');
          form.resetFields();
        }}
        okText={editing ? 'Save Changes' : 'Create Tooltip'}
        cancelText="Cancel"
        width={600}
      >
        <Form layout="vertical" form={form} initialValues={{ is_active: true }}>
          <Form.Item name="page" label="Page" rules={[{ required: true, message: 'Please select a page' }]}>
            <Select 
              options={pages} 
              onChange={(val) => {
                setSelectedPage(val);
                form.setFieldsValue({ page: val, key: undefined });
              }} 
              placeholder="Select a page"
            />
          </Form.Item>
          <Form.Item name="key" label="Key" rules={[{ required: true, message: 'Please select a key' }]}>
            <Select
              placeholder="Select a key"
              options={getKeyOptions(selectedPage)}
            />
          </Form.Item>
          <Form.Item name="text" label="Tooltip Text" rules={[{ required: true, message: 'Please enter tooltip text' }]}> 
            <Input.TextArea 
              rows={4} 
              placeholder="Enter the tooltip text that will be displayed to users..."
              showCount
              maxLength={500}
            />
          </Form.Item>
          <Form.Item name="is_active" label="Active Status" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SuperAdminTooltips;
