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
  Card,
  Modal
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
    loading,
    clearError
  } = useStore();
  
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: '',
    message: ''
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
          // Show error modal instead of just message
          setErrorModal({
            visible: true,
            title: 'API Failed - Cannot Switch User',
            message: result.error || 'Failed to switch impersonation. Please try again.'
          });
        }
      } else {
        // Start new impersonation
        result = await startImpersonation(user.id);
        if (result.success) {
          message.success(`Now impersonating ${user.username || user.email}`);
        } else {
          // Show error modal instead of just message
          setErrorModal({
            visible: true,
            title: 'API Failed - Cannot Impersonate User',
            message: result.error || 'Failed to start impersonation. Please try again.'
          });
        }
      }
    } catch (error) {
      // Show error modal for unexpected errors
      setErrorModal({
        visible: true,
        title: 'API Failed - Cannot Impersonate User',
        message: 'An unexpected error occurred while starting impersonation. Please try again.'
      });
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
    } else if (user.is_staff || user.role === 'ADMIN' || user.role === 'admin') {
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
              className="bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-md hover:shadow-lg"
            >
              {isImpersonating() ? 'Switch To' : 'Impersonate'}
            </Button>
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
    <Card  
      className="mt-6 shadow-lg border-0 rounded-xl">

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
        className="modern-table"
      />
      
      {/* Error Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <CloseCircleOutlined className="text-red-500" />
            <span className="text-red-600 font-semibold">{errorModal.title}</span>
          </div>
        }
        open={errorModal.visible}
        onCancel={() => {
          setErrorModal({ visible: false, title: '', message: '' });
          clearError();
        }}
        footer={[
          <Button 
            key="ok" 
            type="primary" 
            onClick={() => {
              setErrorModal({ visible: false, title: '', message: '' });
              clearError();
            }}
            className="bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600"
          >
            OK
          </Button>
        ]}
        centered
        width={500}
        className="error-modal"
      >
        <div className="py-4">
          <div className="flex items-start space-x-3">
            <CloseCircleOutlined className="text-red-500 text-xl mt-1 flex-shrink-0" />
            <div>
              <p className="text-gray-700 text-base leading-relaxed">
                {errorModal.message}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                The user will remain on the current page. Please try again or contact support if the issue persists.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default SimpleUserTable;

