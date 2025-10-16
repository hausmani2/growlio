import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, message, Space, Card, Tag, Avatar, Switch } from 'antd';
import { 
  UserOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  CrownOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../utils/axiosInterceptors';
import useStore from '../../../store/store';

const roleOptions = [
  { label: 'Superuser', value: 'SUPERUSER' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'User', value: 'USER' },
];

const EditableNameCell = ({ initialValue, userId, onSave }) => {
  const [value, setValue] = useState(initialValue || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(userId, value);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input 
        value={value} 
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter full name"
      />
      <Button 
        type="primary" 
        onClick={handleSave}
        loading={loading}
        disabled={!value.trim()}
      >
        Save
      </Button>
    </Space.Compact>
  );
};

const SuperAdminUserManagement = () => {
  const { 
    fetchAllUsers,
    allUsers,
    usersTotal,
    loading: storeLoading
  } = useStore();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await apiGet(`/authentication/users/?page=${page}&page_size=${pageSize}`);
      setUsers(res.data.results || res.data || []);
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: res.data.count || res.data.length || 0
      }));
    } catch (err) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.current, pagination.pageSize);
  }, []);

  const handleDelete = async (id) => {
    try {
      await apiDelete(`/authentication/users/${id}/`);
      message.success('User deleted successfully');
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error('Failed to delete user');
    }
  };

  const handleNameSave = async (id, full_name) => {
    try {
      await apiPut(`/authentication/users/${id}/`, { full_name });
      message.success('User updated successfully');
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error('Failed to update user');
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await apiPut(`/authentication/users/${id}/role/`, { role });
      message.success('Role updated successfully');
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error('Failed to update role');
    }
  };

  const handleStatusToggle = async (id, is_active) => {
    try {
      await apiPut(`/authentication/users/${id}/`, { is_active });
      message.success(`User ${is_active ? 'activated' : 'deactivated'} successfully`);
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (err) {
      message.error('Failed to update user status');
    }
  };


  const getRoleTag = (user) => {
    if (user.is_superuser) {
      return <Tag color="purple" icon={<CrownOutlined />}>Superuser</Tag>;
    } else if (user.is_staff || user.role === 'ADMIN') {
      return <Tag color="orange" icon={<CrownOutlined />}>Admin</Tag>;
    } else {
      return <Tag color="blue" icon={<UserOutlined />}>User</Tag>;
    }
  };

  const getStatusTag = (user) => {
    return user.is_active ? (
      <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>
    ) : (
      <Tag color="red" icon={<CloseCircleOutlined />}>Inactive</Tag>
    );
  };

  const columns = useMemo(() => [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            size="small" 
            style={{ backgroundColor: '#1890ff' }}
            icon={<UserOutlined />}
          />
          <div>
            <div className="font-medium">{record.first_name} {record.last_name}</div>
            <div className="text-xs text-gray-500">@{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <div className="max-w-xs">
          <div className="truncate" title={email}>{email}</div>
        </div>
      ),
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
          value={role || (record.is_superuser ? 'SUPERUSER' : record.is_staff ? 'ADMIN' : 'USER')}
          style={{ width: 140 , height: 40 }}
          options={roleOptions}
          onChange={(val) => handleRoleChange(record.id, val)}
        />
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <div className="flex items-center space-x-2">
          {getStatusTag(record)}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Popconfirm 
            title="Delete user?" 
            description="Are you sure you want to delete this user? This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              danger 
              size="small"
              icon={<DeleteOutlined />}
              disabled={record.is_superuser}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ], []);

  const openCreate = () => setIsCreateOpen(true);
  const closeCreate = () => setIsCreateOpen(false);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      // First create user via register API
      await apiPost('/authentication/register/', values);
      // Set role if provided and not USER
      if (values.role && values.role !== 'USER') {
        // Get the created user and update role
        const res = await apiGet('/authentication/users/');
        const created = res.data.find((u) => u.email === values.email);
        if (created) {
          await apiPut(`/authentication/users/${created.id}/role/`, { role: values.role });
        }
      }
      message.success('User created successfully');
      createForm.resetFields();
      closeCreate();
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (err) {
      if (err?.response) {
        const apiMsg = err.response.data?.error || err.response.data?.message;
        message.error(apiMsg || 'Failed to create user');
      }
    }
  };

  const handleTableChange = (paginationConfig) => {
    fetchUsers(paginationConfig.current, paginationConfig.pageSize);
  };

  return (
    <div className="space-y-6">

      {/* Enhanced User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl border-0 shadow-md">
          <div className="text-3xl font-bold text-orange-600 mb-2">{pagination.total}</div>
          <div className="text-gray-600 font-semibold">Total Users</div>
        </Card>
        <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl border-0 shadow-md">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {users.filter(u => u.is_active).length}
          </div>
          <div className="text-gray-600 font-semibold">Active Users</div>
        </Card>
        <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl border-0 shadow-md">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {users.filter(u => u.is_staff || u.role === 'ADMIN').length}
          </div>
          <div className="text-gray-600 font-semibold">Admins</div>
        </Card>
        <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl border-0 shadow-md">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {users.filter(u => u.is_superuser).length}
          </div>
          <div className="text-gray-600 font-semibold">Superusers</div>
        </Card>
      </div>

      {/* Enhanced User Table */}
      <Card className="shadow-lg border-0 rounded-xl">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-bold text-orange-600 mb-2">User Management Table</h3>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={openCreate}
            size="large"
            className="bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Add User
          </Button>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={users}
          columns={columns}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          className="modern-table"
        />
      </Card>

      {/* Enhanced Create User Modal */}
      <Modal
        title="Create New User"
        open={isCreateOpen}
        onOk={handleCreate}
        onCancel={closeCreate}
        okText="Create User"
        cancelText="Cancel"
        width={600}
        className="modern-modal"
        okButtonProps={{
          className: "bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-lg hover:shadow-xl"
        }}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item 
            name="email" 
            label="Email" 
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          > 
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item 
            name="username" 
            label="Username" 
            rules={[{ required: true, message: 'Please enter a username' }]}
          > 
            <Input placeholder="username" />
          </Form.Item>
          <Form.Item 
            name="full_name" 
            label="Full Name" 
            rules={[{ required: true, message: 'Please enter full name' }]}
          > 
            <Input placeholder="John Doe" />
          </Form.Item>
          <Form.Item 
            name="password" 
            label="Password" 
            rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}
          > 
            <Input.Password placeholder="Enter password" />
          </Form.Item>
          <Form.Item 
            name="role" 
            label="Role" 
            initialValue="USER"
          >
            <Select options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SuperAdminUserManagement;
