import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, message, Popconfirm } from 'antd';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/axiosInterceptors';

const pages = [
  { label: 'Onboarding: Basic', value: 'onboarding-basic' },
  { label: 'Onboarding: Labor', value: 'onboarding-labor' },
  { label: 'Onboarding: Food Cost', value: 'onboarding-food' },
  { label: 'Onboarding: Sales Channels', value: 'onboarding-sales' },
  { label: 'Onboarding: Expense', value: 'onboarding-expense' },
];

const TooltipsAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageFilter, setPageFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedPage, setSelectedPage] = useState('onboarding-basic');
  const [form] = Form.useForm();

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
    fetchData();
  }, [pageFilter]);

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
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await apiPut(`/restaurant/tooltips/${editing.id}/`, values);
        message.success('Tooltip updated');
      } else {
        await apiPost('/restaurant/tooltips/', values);
        message.success('Tooltip created');
      }
      setIsModalOpen(false);
      setEditing(null);
      setSelectedPage('onboarding-basic');
      fetchData();
    } catch (e) {
      // validation or api error handled by antd or message above
    }
  };

  const handleDelete = async (record) => {
    try {
      await apiDelete(`/restaurant/tooltips/${record.id}/`);
      message.success('Tooltip deleted');
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

  const columns = [
    { title: 'Page', dataIndex: 'page', key: 'page' },
    { title: 'Key', dataIndex: 'key', key: 'key' },
    { title: 'Text', dataIndex: 'text', key: 'text' },
    { title: 'Active', dataIndex: 'is_active', key: 'is_active', render: (v) => (v ? 'Yes' : 'No') },
    { title: 'Updated At', dataIndex: 'updated_at', key: 'updated_at' },
    {
      title: 'Actions', key: 'actions', render: (_, record) => (
        <>
          <Button type="link" onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm title="Delete tooltip?" onConfirm={() => handleDelete(record)}>
            <Button type="link" danger>Delete</Button>
          </Popconfirm>
        </>
      )
    }
  ];

  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm">Page:</span>
          <Select
            value={pageFilter}
            style={{ width: 240 }}
            onChange={setPageFilter}
            placeholder="All pages"
            allowClear
            options={[
              { label: 'All Pages', value: '' },
              ...pages
            ]}
          />
        </div>
        <Button type="primary" onClick={openCreate}>Add Tooltip</Button>
      </div>
      <Table rowKey="id" loading={loading} dataSource={items} columns={columns} />

              <Modal
          title={editing ? 'Edit Tooltip' : 'Create Tooltip'}
          open={isModalOpen}
          onOk={handleOk}
          onCancel={() => {
            setIsModalOpen(false);
            setEditing(null);
            setSelectedPage('onboarding-basic');
          }}
          okText={editing ? 'Save' : 'Create'}
        >
        <Form layout="vertical" form={form} initialValues={{ is_active: true }}>
          <Form.Item name="page" label="Page" rules={[{ required: true }]}>
            <Select 
              options={pages} 
              onChange={(val) => {
                setSelectedPage(val);
                form.setFieldsValue({ page: val, key: undefined });
              }} 
            />
          </Form.Item>
          <Form.Item name="key" label="Key" rules={[{ required: true }]}>
            <Select
              placeholder="Select a key"
              options={getKeyOptions(selectedPage)}
            />
          </Form.Item>
          <Form.Item name="text" label="Text" rules={[{ required: true }]}> 
            <Input.TextArea rows={4} placeholder="Tooltip text" />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TooltipsAdmin;


