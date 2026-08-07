import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Popconfirm, message, Space, Card, Tag, Avatar, Switch, notification } from 'antd';
import { 
  UserOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  CrownOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  LockOutlined,
  DownloadOutlined,
  GiftOutlined,
  RollbackOutlined
} from '@ant-design/icons';
import { apiGet, apiPost, apiPut, apiDelete, apiGetWithTimeout } from '../../../utils/axiosInterceptors';
import api from '../../../utils/axiosInterceptors';
import useStore from '../../../store/store';
import { normalizeSuperAdminUsersResponse } from '../../../utils/superAdminUsers';

const roleOptions = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'User', value: 'USER' },
];

const EditableNameCell = ({ initialValue, userId, onSave }) => {
  const [value, setValue] = useState(initialValue || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) return;
    setLoading(true);
    try {
      await onSave(userId, value);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-w-[150px]">
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <Input 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter full name"
          size="small"
          className="flex-1 min-w-[120px]"
          onPressEnter={handleSave}
          style={{ 
            fontSize: '14px',
            minWidth: '120px'
          }}
        />
        <Button 
          type="primary" 
          onClick={handleSave}
          loading={loading}
          disabled={!value.trim()}
          size="small"
          className="flex-shrink-0 whitespace-nowrap"
          style={{ 
            minWidth: '60px',
            fontSize: '12px'
          }}
        >
          Save
        </Button>
      </div>
    </div>
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
  const [isCompUpgradeOpen, setIsCompUpgradeOpen] = useState(false);
  const [compUpgradeForm] = Form.useForm();
  const [compUpgradeLoading, setCompUpgradeLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [search, setSearch] = useState('');
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  // Calculate counts for admin and users
  const userCounts = useMemo(() => {
    const adminCount = users.filter(user => 
      user.role === 'ADMIN' || user.is_staff || user.is_superuser
    ).length;
    const regularUserCount = users.filter(user => 
      user.role === 'USER' && !user.is_staff && !user.is_superuser
    ).length;
    
    const restaurantPlans = new Map();
    users.forEach((user) => {
      if (!user.restaurant_id) return;
      const planKey = String(user.plan_key || user.plan_display_name || 'unknown').toLowerCase();
      if (restaurantPlans.has(user.restaurant_id)) return;
      restaurantPlans.set(user.restaurant_id, planKey);
    });

    const planCounts = Array.from(restaurantPlans.values()).reduce((counts, planKey) => {
      const key = ['lite', 'grow', 'pro'].includes(planKey) ? planKey : 'other';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, { lite: 0, grow: 0, pro: 0, other: 0 });

    return { adminCount, regularUserCount, planCounts };
  }, [users]);

  const fetchUsers = async (page = 1, pageSize = 10, searchQuery = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        ...(searchQuery?.trim() ? { search: searchQuery.trim() } : {})
      }).toString();
      // Admin list can be slow on remote DB; keep above default 30s axios timeout
      const res = await apiGetWithTimeout(`/authentication/users/?${params}`, 90000);
      const { users: incoming, total } = normalizeSuperAdminUsersResponse(res.data);
      setUsers(incoming);
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total
      }));
      return true;
    } catch (err) {
      console.error('Failed to load users', err);
      message.error('Failed to load users');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFetchingRef.current || hasFetchedRef.current) {
      return;
    }

    const loadUsers = async () => {
      isFetchingRef.current = true;
      try {
        const ok = await fetchUsers(pagination.current, pagination.pageSize);
        if (ok) hasFetchedRef.current = true;
      } finally {
        isFetchingRef.current = false;
      }
    };

    loadUsers();
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

  const handleExport = async () => {
    try {
      message.loading({ content: 'Exporting emails...', key: 'export', duration: 0 });
      
      const response = await api.get('/authentication/admin/export-emails/', {
        responseType: 'blob'
      });
      
      // Create a blob from the response
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream' 
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'emails-export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      } else {
        // Generate filename with current date if not provided
        const date = new Date().toISOString().split('T')[0];
        filename = `emails-export-${date}.csv`;
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success({ content: 'Emails exported successfully', key: 'export' });
    } catch (err) {
      message.error({ 
        content: err?.response?.data?.message || 'Failed to export emails', 
        key: 'export' 
      });
      console.error('Export error:', err);
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

  const openCompUpgrade = (user) => {
    setSelectedUser(user);
    const planKey = String(user.plan_key || 'lite').toLowerCase();
    compUpgradeForm.setFieldsValue({
      package_name: planKey === 'pro' ? 'pro' : 'grow',
      allowed_locations: user.plan_allowed_locations || (planKey === 'pro' ? 10 : 5),
      reason: '',
    });
    setIsCompUpgradeOpen(true);
  };

  const closeCompUpgrade = () => {
    setIsCompUpgradeOpen(false);
    setSelectedUser(null);
    compUpgradeForm.resetFields();
  };

  const handleCompUpgrade = async () => {
    try {
      const values = await compUpgradeForm.validateFields();
      if (!selectedUser?.restaurant_id) {
        message.error('This user has no restaurant to upgrade');
        return;
      }
      setCompUpgradeLoading(true);
      const res = await apiPost('/authentication/admin/grant-complimentary-subscription/', {
        restaurant_id: selectedUser.restaurant_id,
        package_name: values.package_name,
        allowed_locations: values.allowed_locations,
        reason: values.reason || '',
      });
      message.success(res.data?.message || 'Complimentary plan granted');
      closeCompUpgrade();
      fetchUsers(pagination.current, pagination.pageSize, search);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to grant complimentary plan'
      );
    } finally {
      setCompUpgradeLoading(false);
    }
  };

  const handleRevokeToLite = async (user) => {
    if (!user?.restaurant_id) {
      message.error('This user has no restaurant');
      return;
    }
    try {
      const res = await apiPost('/authentication/admin/revoke-complimentary-subscription/', {
        restaurant_id: user.restaurant_id,
      });
      message.success(res.data?.message || 'Moved to Lite');
      fetchUsers(pagination.current, pagination.pageSize, search);
    } catch (err) {
      message.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Failed to move restaurant to Lite'
      );
    }
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
      title: 'Restaurant',
      key: 'restaurant',
      width: 220,
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.restaurant_name || '-'}</div>
          {record.plan_display_name && (
            <div className="text-xs text-gray-500 flex items-center gap-1 flex-wrap">
              <span>Plan: {record.plan_display_name}</span>
              {record.plan_is_complimentary && (
                <Tag color="purple" className="m-0 text-[10px] leading-4 px-1">Comp</Tag>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 220,
      minWidth: 200,
      ellipsis: false,
      render: (text, record) => (
        <div className="w-full min-w-[180px] max-w-[300px]">
          <EditableNameCell initialValue={text} userId={record.id} onSave={handleNameSave} />
        </div>
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const planKey = String(record.plan_key || '').toLowerCase();
        const hasRestaurant = Boolean(record.restaurant_id);
        const isPaid = planKey === 'grow' || planKey === 'pro';
        return (
          <Space size="small" wrap>
            {hasRestaurant && (
              <Button
                type="default"
                size="small"
                icon={<GiftOutlined />}
                onClick={() => openCompUpgrade(record)}
                className="border-purple-500 text-purple-600 hover:bg-purple-50"
              >
                Comp Upgrade
              </Button>
            )}
            {hasRestaurant && isPaid && (
              <Popconfirm
                title="Move to Lite?"
                description="This removes the paid plan (including complimentary). Any Stripe subscription will also be cleared."
                onConfirm={() => handleRevokeToLite(record)}
                okText="Yes, move to Lite"
                cancelText="Cancel"
              >
                <Button
                  type="default"
                  size="small"
                  icon={<RollbackOutlined />}
                  className="border-gray-400 text-gray-600"
                >
                  To Lite
                </Button>
              </Popconfirm>
            )}
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
        );
      }
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
        const res = await apiGet('/authentication/users/?format=flat&search=' + encodeURIComponent(values.email));
        const { users: createdUsers } = normalizeSuperAdminUsersResponse(res.data);
        const created = createdUsers.find((u) => u.email === values.email);
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
          <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
            <div className="flex items-center p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200 min-w-[120px]">
              <div className="ml-1 flex-1">
                <p className="text-xs font-medium text-gray-600 mb-0.5">Lite</p>
                <p className="text-xl font-bold text-orange-900">{userCounts.planCounts.lite}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 min-w-[120px]">
              <div className="ml-1 flex-1">
                <p className="text-xs font-medium text-gray-600 mb-0.5">Grow</p>
                <p className="text-xl font-bold text-blue-900">{userCounts.planCounts.grow}</p>
              </div>
            </div>

            <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-fuchsia-50 rounded-lg border border-purple-200 min-w-[120px]">
              <div className="ml-1 flex-1">
                <p className="text-xs font-medium text-gray-600 mb-0.5">Pro</p>
                <p className="text-xl font-bold text-purple-900">{userCounts.planCounts.pro}</p>
              </div>
            </div>

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
            <Button 
            type='default'
            icon={<DownloadOutlined />}
            onClick={handleExport}
            size="large"
            className="bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Export
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
            // Backend pages by restaurant; each page may include multiple user rows
            showTotal: (total) => `${total} restaurants`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
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
              <span className="font-medium">User:</span> {selectedUser.full_name}
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

      {/* Complimentary Upgrade Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <GiftOutlined className="text-purple-600" />
            <span>Complimentary Plan Upgrade</span>
          </div>
        }
        open={isCompUpgradeOpen}
        onOk={handleCompUpgrade}
        onCancel={closeCompUpgrade}
        okText="Grant at no cost"
        cancelText="Cancel"
        width={520}
        confirmLoading={compUpgradeLoading}
        okButtonProps={{
          className: 'bg-purple-600 border-0 hover:bg-purple-700',
        }}
      >
        {selectedUser && (
          <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-1">
            <p className="text-sm text-gray-700 mb-0">
              <span className="font-medium">Restaurant:</span> {selectedUser.restaurant_name}
            </p>
            <p className="text-sm text-gray-700 mb-0">
              <span className="font-medium">Owner:</span> {selectedUser.email}
            </p>
            <p className="text-sm text-gray-700 mb-0">
              <span className="font-medium">Current plan:</span>{' '}
              {selectedUser.plan_display_name || selectedUser.plan_key || '—'}
              {selectedUser.plan_is_complimentary ? ' (comp)' : ''}
            </p>
            <p className="text-xs text-amber-700 mt-2 mb-0">
              Any active Stripe subscription for this restaurant will be canceled. The account will not be billed.
            </p>
          </div>
        )}
        <Form form={compUpgradeForm} layout="vertical">
          <Form.Item
            name="package_name"
            label="Plan"
            rules={[{ required: true, message: 'Select a plan' }]}
          >
            <Select
              options={[
                { label: 'Grow', value: 'grow' },
                { label: 'Pro', value: 'pro' },
              ]}
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="allowed_locations"
            label="Allowed locations"
            rules={[
              { required: true, message: 'Enter location allowance' },
              { type: 'number', min: 1, message: 'Must be at least 1' },
            ]}
          >
            <InputNumber min={1} size="large" className="w-full" />
          </Form.Item>
          <Form.Item name="reason" label="Reason (optional)">
            <Input.TextArea
              rows={2}
              placeholder="Partner deal, support goodwill, internal account…"
              maxLength={255}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SuperAdminUserManagement;
