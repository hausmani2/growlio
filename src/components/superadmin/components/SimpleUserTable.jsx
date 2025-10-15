import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  message, 
  Popconfirm, 
  Tooltip,
  Avatar,
  Typography,
  Card
} from 'antd';
import { 
  UserSwitchOutlined, 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import useStore from '../../../store/store';

const { Text } = Typography;

const SimpleUserTable = () => {
  const { 
    startImpersonation,
    switchImpersonation,
    isImpersonating,
    getImpersonatedUser,
    fetchAllUsers,
    allUsers,
    usersTotal,
    loading
  } = useStore();
  
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Fetch users from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const result = await fetchAllUsers(pagination.current, pagination.pageSize);
        if (result.success) {
          setUsers(result.data);
          setPagination(prev => ({
            ...prev,
            total: usersTotal
          }));
        } else {
          message.error(result.error || 'Failed to load users');
        }
      } catch (error) {
        message.error('Error loading users');
      }
    };

    loadUsers();
  }, [pagination.current, pagination.pageSize, fetchAllUsers, usersTotal]);

  const handleImpersonate = async (user) => {
    try {
      let result;
      
      // If already impersonating, switch to new user
      if (isImpersonating()) {
        result = await switchImpersonation(user.id);
        if (result.success) {
          message.success(`Switched to impersonating ${user.username || user.email}`);
        } else {
          message.error(result.error || 'Failed to switch impersonation');
        }
      } else {
        // Start new impersonation
        result = await startImpersonation(user.id);
        if (result.success) {
          message.success(`Now impersonating ${user.username || user.email}`);
        } else {
          message.error(result.error || 'Failed to start impersonation');
        }
      }
    } catch (error) {
      message.error('An error occurred while starting impersonation');
    }
  };

  const handleViewUser = (user) => {
    message.info(`Viewing details for ${user.username}`);
    // Implement view user functionality
  };

  const handleEditUser = (user) => {
    message.info(`Editing ${user.username}`);
    // Implement edit user functionality
  };

  const handleDeleteUser = async (user) => {
    try {
      // Implement delete user functionality
      message.success(`User ${user.username} deleted successfully`);
      setUsers(users.filter(u => u.id !== user.id));
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const getRoleTag = (user) => {
    if (user.is_superuser) {
      return <Tag color="purple">Superuser</Tag>;
    } else if (user.is_staff || user.role === 'admin') {
      return <Tag color="orange">Admin</Tag>;
    } else {
      return <Tag color="blue">User</Tag>;
    }
  };

  const getStatusTag = (user) => {
    return user.is_active ? (
      <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>
    ) : (
      <Tag color="red" icon={<CloseCircleOutlined />}>Inactive</Tag>
    );
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            size="small" 
            style={{ backgroundColor: '#1890ff' }}
            icon={<UserSwitchOutlined />}
          />
          <div>
            <div className="font-medium">{record.first_name} {record.last_name}</div>
            <Text type="secondary" className="text-xs">@{record.username}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => <Text copyable>{email}</Text>,
    },
    {
      title: 'Role',
      key: 'role',
      render: (_, record) => getRoleTag(record),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record),
    },
    {
      title: 'Joined',
      dataIndex: 'date_joined',
      key: 'date_joined',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Impersonate User">
            <Button
              type="primary"
              size="small"
              icon={<UserSwitchOutlined />}
              onClick={() => handleImpersonate(record)}
              loading={loading}
              disabled={record.is_superuser}
            >
              {isImpersonating() ? 'Switch To' : 'Impersonate'}
            </Button>
          </Tooltip>
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewUser(record)}
            />
          </Tooltip>
          <Tooltip title="Edit User">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteUser(record)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete User">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={record.is_superuser}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleTableChange = (paginationConfig) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize
    }));
  };

  return (
    <Card title="User Management Table" className="mt-6">
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
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
        scroll={{ x: 800 }}
        size="middle"
      />
    </Card>
  );
};

export default SimpleUserTable;

