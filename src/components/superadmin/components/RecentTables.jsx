import React from 'react';
import { 
  Table, 
  Tag, 
  Avatar, 
  Typography, 
  Spin,
  Empty,
  Card,
  Space,
  Button
} from 'antd';
import { 
  UserOutlined, 
  ShopOutlined, 
  EyeOutlined,
  CalendarOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

const RecentTables = ({ recentUsers, recentRestaurants, loading }) => {
  // Use real API data only
  const users = recentUsers || [];
  const restaurants = recentRestaurants || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            size="small" 
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <div className="font-medium">{record.first_name} {record.last_name}</div>
            <Text type="secondary" className="text-xs">@{record.username}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'orange' : 'blue'}>
          {role === 'admin' ? 'Admin' : 'User'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.is_active ? 'green' : 'red'}>
          {record.is_active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'date_joined',
      key: 'date_joined',
      render: (date) => (
        <div className="flex items-center space-x-1">
          <CalendarOutlined className="text-xs" />
          <Text className="text-xs">{new Date(date).toLocaleDateString()}</Text>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Button size="small" icon={<EyeOutlined />} type="link">
          View
        </Button>
      ),
    },
  ];

  const restaurantColumns = [
    {
      title: 'Restaurant',
      key: 'restaurant',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            size="small" 
            icon={<ShopOutlined />}
            style={{ backgroundColor: '#52c41a' }}
          />
          <div>
            <div className="font-medium">{record.name}</div>
            <Text type="secondary" className="text-xs">{record.location}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Owner',
      key: 'owner',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.owner}</div>
          <Text type="secondary" className="text-xs">{record.email}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => (
        <div className="flex items-center space-x-1">
          <CalendarOutlined className="text-xs" />
          <Text className="text-xs">{new Date(date).toLocaleDateString()}</Text>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <Button size="small" icon={<EyeOutlined />} type="link">
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Recent Users */}
      <Card size="small" title="Recent Users" className="mb-4">
        {users.length > 0 ? (
          <Table
            columns={userColumns}
            dataSource={users}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 400 }}
          />
        ) : (
          <Empty description="No recent users" />
        )}
      </Card>

      {/* Recent Restaurants */}
      <Card size="small" title="Recent Restaurants">
        {restaurants.length > 0 ? (
          <Table
            columns={restaurantColumns}
            dataSource={restaurants}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 400 }}
          />
        ) : (
          <Empty description="No recent restaurants" />
        )}
      </Card>
    </div>
  );
};

export default RecentTables;

