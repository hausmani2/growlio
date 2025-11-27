import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, message, Space, Card, Tag, Avatar, Switch, notification } from 'antd';
import { 
  UserOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  CrownOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  LockOutlined
} from '@ant-design/icons';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../utils/axiosInterceptors';
import useStore from '../../../store/store';

const roleOptions = [
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
    loading: storeLoading,
    resetUserPasswordByAdmin,
    passwordResetLoading,
    passwordResetError,
    passwordResetSuccess,
    clearPasswordResetState
  } = useStore();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetPasswordForm] = Form.useForm();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [search, setSearch] = useState('');

  // Calculate counts for admin and users
  const userCounts = useMemo(() => {
    const adminCount = users.filter(user => 
      user.role === 'ADMIN' || user.is_staff || user.is_superuser
    ).length;
    const regularUserCount = users.filter(user => 
      user.role === 'USER' && !user.is_staff && !user.is_superuser
    ).length;
    
    return { adminCount, regularUserCount };
  }, [users]);

  const fetchUsers = async (page = 1, pageSize = 10, searchQuery = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        ...(searchQuery?.trim() ? { search: searchQuery.trim() } : {})
      }).toString();
      const res = await apiGet(`/authentication/users/?${params}`);
      const incoming = res.data.results || res.data || [];
      setUsers(incoming);
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

  const openResetPassword = (user) => {
    setSelectedUser(user);
    setIsResetPasswordOpen(true);
    resetPasswordForm.resetFields();
  };

  const closeResetPassword = () => {
    setIsResetPasswordOpen(false);
    setSelectedUser(null);
    resetPasswordForm.resetFields();
  };

  const handleResetPassword = async () => {
    try {
      const values = await resetPasswordForm.validateFields();
      const result = await resetUserPasswordByAdmin(selectedUser.id, values.password);
      
      if (result.success) {
        // Display response data for 3 seconds
        notification.success({
          message: 'Password Reset Successful',
          description: (
            <div className="space-y-1">
              <p className="font-medium text-green-700">{result.message || 'Password reset successfully'}</p>
              <div className="text-xs text-gray-600 space-y-0.5 mt-2">
                <p><span className="font-medium">Password:</span> {values.password}</p>
                <p><span className="font-medium">Email Sent:</span> {result.email_sent ? 'Yes ✓' : 'No ✗'}</p>
              </div>
            </div>
          ),
          duration: 3,
          placement: 'topRight',
          className: 'password-reset-notification'
        });
        
        closeResetPassword();
        clearPasswordResetState();
      } else {
        message.error(result.error || 'Failed to reset password');
      }
    } catch (err) {
      message.error('Failed to reset password');
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
          value={role || (record.role ? 'ADMIN' : record.is_staff ? 'ADMIN' : 'USER')}
          style={{ width: 140 , height: 40 }}
          options={roleOptions}
          onChange={(val) => handleRoleChange(record.id, val)}
        />
      )
    },
    {
      title: 'Last Login',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 180,
      render: (last_login) => {
        // Handle null, undefined, or empty values
        if (!last_login || last_login === null || last_login === '') {
          return (
            <span className="text-gray-400 text-sm px-2 py-1 rounded bg-gray-50">
              -
            </span>
          );
        }

        try {
          // Parse the date and format it professionally
          const date = new Date(last_login);
          
          // Check if date is valid
          if (isNaN(date.getTime())) {
            return (
              <span className="text-gray-400 text-sm px-2 py-1 rounded bg-gray-50">
                -
              </span>
            );
          }

          // Format: "Dec 15, 2023 at 2:30 PM"
          const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          
          const formattedTime = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          return (
            <div className="text-sm">
              <div className="font-medium text-gray-900">{formattedDate}</div>
              {/* <div className="text-gray-500 text-xs">{formattedTime}</div> */}
            </div>
          );
        } catch (error) {
          // Fallback for any parsing errors
          return (
            <span className="text-gray-400 text-sm px-2 py-1 rounded bg-gray-50">
              (-)
            </span>
          );
        }
      }
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
          <Button 
            type="default"
            size="small"
            icon={<LockOutlined />}
            onClick={() => openResetPassword(record)}
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            Reset Password
          </Button>
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
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize
    }));
    fetchUsers(paginationConfig.current, paginationConfig.pageSize, search);
  };

  // Debounce search to call API-side filtering
  useEffect(() => {
    const handle = setTimeout(() => {
      setPagination(prev => ({ ...prev, current: 1 }));
      fetchUsers(1, pagination.pageSize, search);
    }, 350);
    return () => clearTimeout(handle);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header Section - Matching other dashboards */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-3 border-b border-gray-200">
          {/* Left Side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              User Management
            </h1>
            <p className="text-gray-600 text-lg">
              Create, manage, and update user accounts and permissions
            </p>
          </div>
          
          {/* Right Side - User Statistics */}
          <div className="flex flex-row gap-3">
            <div className="flex items-center p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 min-w-[140px]">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <CrownOutlined className="text-indigo-600 text-lg" />
                </div>
              </div>
              <div className="ml-2 flex-1">
                <p className="text-xs font-medium text-gray-600 mb-0.5">Administrators</p>
                <p className="text-xl font-bold text-indigo-900">{userCounts.adminCount}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200 min-w-[140px]">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <TeamOutlined className="text-emerald-600 text-lg" />
                </div>
              </div>
              <div className="ml-2 flex-1">
                <p className="text-xs font-medium text-gray-600 mb-0.5">Regular Users</p>
                <p className="text-xl font-bold text-emerald-900">{userCounts.regularUserCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced User Table */}
      <Card className="shadow-lg border-0 rounded-xl">
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h3 className="text-lg font-bold text-orange-600">User Management Table</h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
              style={{height:40}}
            />
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

      {/* Reset Password Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <LockOutlined className="text-blue-600" />
            <span>Reset Password</span>
          </div>
        }
        open={isResetPasswordOpen}
        onOk={handleResetPassword}
        onCancel={closeResetPassword}
        okText="Reset Password"
        cancelText="Cancel"
        width={500}
        className="modern-modal"
        confirmLoading={passwordResetLoading}
        okButtonProps={{
          className: "bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl"
        }}
      >
        {selectedUser && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">User:</span> {selectedUser.first_name} {selectedUser.last_name}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Email:</span> {selectedUser.email}
            </p>
          </div>
        )}
        <Form form={resetPasswordForm} layout="vertical">
          <Form.Item 
            name="password" 
            label="New Password" 
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          > 
            <Input.Password 
              placeholder="Enter new password" 
              size="large"
            />
          </Form.Item>
          <Form.Item 
            name="confirmPassword" 
            label="Confirm Password" 
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm the password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match!'));
                },
              }),
            ]}
          > 
            <Input.Password 
              placeholder="Confirm new password" 
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SuperAdminUserManagement;
