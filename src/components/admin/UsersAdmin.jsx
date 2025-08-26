import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, message, Space } from 'antd';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/axiosInterceptors';

const roleOptions = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'User', value: 'USER' },
];

const EditableNameCell = ({ initialValue, userId, onSave }) => {
  const [value, setValue] = useState(initialValue || '');
  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button type="primary" onClick={() => onSave(userId, value)}>Save</Button>
    </Space.Compact>
  );
};

const UsersAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/authentication/users/');
      setUsers(res.data);
    } catch (err) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    try {
      await apiDelete(`/authentication/users/${id}/`);
      message.success('User deleted');
      fetchUsers();
    } catch (err) {
      message.error('Failed to delete user');
    }
  };

  const handleNameSave = async (id, full_name) => {
    try {
      await apiPut(`/authentication/users/${id}/`, { full_name });
      message.success('User updated');
      fetchUsers();
    } catch (err) {
      message.error('Failed to update user');
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await apiPut(`/authentication/users/${id}/role/`, { role });
      message.success('Role updated');
      fetchUsers();
    } catch (err) {
      message.error('Failed to update role');
    }
  };

  const columns = useMemo(() => [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (text, record) => (
        <EditableNameCell initialValue={text} userId={record.id} onSave={handleNameSave} />
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => (
        <Select
          value={role}
          style={{ width: 140 }}
          options={roleOptions}
          onChange={(val) => handleRoleChange(record.id, val)}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm title="Delete user?" onConfirm={() => handleDelete(record.id)}>
          <Button danger>Delete</Button>
        </Popconfirm>
      )
    }
  ], []);

  const openCreate = () => setIsCreateOpen(true);
  const closeCreate = () => setIsCreateOpen(false);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      // First create user via register API (no auto-login)
      await apiPost('/authentication/register/', values);
      // Optionally set role if provided and not USER
      if (values.role && values.role !== 'USER') {
        // Need the user id; refetch and then update latest by email
        const res = await apiGet('/authentication/users/');
        const created = res.data.find((u) => u.email === values.email);
        if (created) {
          await apiPut(`/authentication/users/${created.id}/role/`, { role: values.role });
        }
      }
      message.success('User created');
      createForm.resetFields();
      closeCreate();
      fetchUsers();
    } catch (err) {
      // validation errors already shown; only show if api call failed
      if (err?.response) {
        const apiMsg = err.response.data?.error || err.response.data?.message;
        message.error(apiMsg || 'Failed to create user');
      }
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Button type="primary" onClick={openCreate}>Add User</Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={users}
        columns={columns}
      />

      <Modal
        title="Create User"
        open={isCreateOpen}
        onOk={handleCreate}
        onCancel={closeCreate}
        okText="Create"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}> 
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}> 
            <Input placeholder="username" />
          </Form.Item>
          <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}> 
            <Input placeholder="Full Name" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}> 
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="USER">
            <Select options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersAdmin;


