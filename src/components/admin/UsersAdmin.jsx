import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, message, Space, Tag, Tooltip, Card, Statistic, Row, Col } from 'antd';
import { UserOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');


  // Get user statistics
  const userStats = useMemo(() => {
    // Ensure users is always an array
    const usersArray = Array.isArray(users) ? users : [];
    
    const total = usersArray.length;
    const active = usersArray.filter(user => user.is_active).length;
    const inactive = total - active;
    
    // Count admins: role === 'ADMIN' OR is_superuser === true OR is_staff === true
    const admins = usersArray.filter(user => 
      user.role === 'ADMIN' || user.is_superuser || user.is_staff
    ).length;
    
    const regularUsers = usersArray.filter(user => 
      user.role === 'USER' && !user.is_superuser && !user.is_staff
    ).length;
    
    return { total, active, inactive, admins, regularUsers };
  }, [users]);

  // Debouncing effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = async (searchQuery = '') => {
    setLoading(true);
    try {
      // API-ONLY SEARCH: All filtering is done by the backend API
      // No client-side filtering - the API returns only matching results
      const url = searchQuery 
        ? `/authentication/users/?search=${encodeURIComponent(searchQuery)}`
        : '/authentication/users/';
      
      const res = await apiGet(url);
      
      // The API response has structure: { message, count, data: [...] }
      // Extract the users array from res.data.data
      const usersData = res.data?.data || res.data || [];
      
      // Display exactly what the API returns - no additional filtering
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error('Error fetching users:', err); // Debug log
      message.error('Failed to load users');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, []);

  // Search effect
  useEffect(() => {
    fetchUsers(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Search handlers
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
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
      title: 'User Info',
      key: 'user_info',
      width: 200,
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <UserOutlined className="text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{record.full_name || record.username}</div>
            <div className="text-sm text-gray-500">{record.email}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (username) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{username}</span>
      )
    },
    {
      title: 'Full Name',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 200,
      render: (text, record) => (
        <EditableNameCell initialValue={text} userId={record.id} onSave={handleNameSave} />
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role, record) => (
        <Select
          value={role}
          style={{ width: 100 , height: 40}}
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
    // {
    //   title: 'Status',
    //   key: 'status',
    //   width: 100,
    //   render: (_, record) => (
    //     <div className="flex flex-col space-y-1">
    //       <Tag 
    //         color={record.is_active ? 'green' : 'red'} 
    //         icon={record.is_active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
    //       >
    //         {record.is_active ? 'Active' : 'Inactive'}
    //       </Tag>
    //       {record.is_staff && (
    //         <Tag color="blue" size="small">Staff</Tag>
    //       )}
    //       {record.is_superuser && (
    //         <Tag color="purple" size="small">Superuser</Tag>
    //       )}
    //     </div>
    //   )
    // },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Popconfirm 
          title="Are you sure you want to delete this user?" 
          description="This action cannot be undone."
          onConfirm={() => handleDelete(record.id)}
          okText="Yes, Delete"
          cancelText="Cancel"
        >
          <Button danger size="small">Delete</Button>
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all system users</p>
        </div>
        <Button type="primary" size="large" onClick={openCreate} className="shadow-lg">
          <UserOutlined className="mr-2" />
          Add New User
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="mb-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input.Search
              placeholder="Search users by name, email, or username..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
              className="w-full"
            />
          </div>
          {searchTerm && (
            <Button 
              onClick={handleClearSearch}
              icon={<ClearOutlined />}
              size="large"
            >
              Clear
            </Button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            Searching for: <span className="font-medium text-blue-600">"{searchTerm}"</span>
            {loading && <span className="ml-2 text-blue-500">Loading...</span>}
          </div>
        )}
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Users"
              value={userStats.total}
              prefix={<UserOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Active Users"
              value={userStats.active}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Admins"
              value={userStats.admins}
              prefix={<UserOutlined className="text-purple-500" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Regular Users"
              value={userStats.regularUsers}
              prefix={<UserOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Users Table */}
      <Card className="shadow-lg">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={Array.isArray(users) ? users : []}
          columns={columns}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} users`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          scroll={{ x: 1200 }}
          className="user-management-table"
        />
      </Card>

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


