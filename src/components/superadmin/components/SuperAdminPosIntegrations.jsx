import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  message,
  Popconfirm,
  Card,
  Space,
  Tag,
  Alert,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../utils/axiosInterceptors';

const SuperAdminPosIntegrations = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const applyApiErrors = (errorData) => {
    const fieldErrors = [];
    const generalMessages = [];

    const errors = errorData?.errors;
    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      Object.entries(errors).forEach(([field, value]) => {
        const text = Array.isArray(value) ? value[0] : String(value);
        if (['name', 'description', 'is_active'].includes(field)) {
          fieldErrors.push({ name: field, errors: [text] });
        } else {
          generalMessages.push(text);
        }
      });
    }

    if (fieldErrors.length > 0) {
      form.setFields(fieldErrors);
    }

    if (errorData?.message && errorData.message !== 'Validation failed') {
      generalMessages.unshift(errorData.message);
    } else if (generalMessages.length === 0 && typeof errorData?.detail === 'string') {
      generalMessages.push(errorData.detail);
    }

    const summary =
      generalMessages.length > 0
        ? generalMessages.join(' ')
        : fieldErrors.length > 0
          ? fieldErrors.map((f) => f.errors[0]).join(' ')
          : 'Unable to save POS integration. Please check the form and try again.';

    setSubmitError(summary);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/admin_access/pos-integrations/');
      const payload = res?.data ?? {};
      setItems(payload?.data ?? []);
    } catch {
      message.error('Failed to load POS integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setSubmitError(null);
    form.resetFields();
  };

  const openCreate = () => {
    setEditing(null);
    setSubmitError(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setIsModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setSubmitError(null);
    form.setFieldsValue({
      name: record.name,
      description: record.description || '',
      is_active: Boolean(record.is_active),
    });
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    setSubmitError(null);
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        description: values.description ?? '',
        is_active: values.is_active,
        display_order: editing?.display_order ?? 0,
      };

      setSaving(true);
      if (editing) {
        await apiPut(`/admin_access/pos-integrations/${editing.id}/`, payload);
        message.success('POS integration updated');
      } else {
        await apiPost('/admin_access/pos-integrations/', payload);
        message.success('POS integration created');
      }
      closeModal();
      fetchData();
    } catch (e) {
      if (e?.errorFields) {
        return;
      }
      const data = e?.response?.data;
      if (data) {
        applyApiErrors(data);
      } else {
        setSubmitError(e?.message || 'Save failed. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    try {
      await apiDelete(`/admin_access/pos-integrations/${record.id}/`);
      message.success('POS integration deleted');
      fetchData();
    } catch {
      message.error('Failed to delete');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug' },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 90,
      render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Delete this integration?" onConfirm={() => handleDelete(record)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <Card
        title="POS Integrations"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Add Integration
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editing ? 'Edit POS Integration' : 'Add POS Integration'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={closeModal}
        confirmLoading={saving}
        destroyOnClose
      >
        {submitError && (
          <Alert
            type="error"
            message={submitError}
            showIcon
            closable
            onClose={() => setSubmitError(null)}
            className="mb-4"
          />
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="e.g. Square" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};


export default SuperAdminPosIntegrations;
