import React from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Spin,
  Empty,
  Avatar
} from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  CrownOutlined
} from '@ant-design/icons';
import LoadingSpinner from '../../layout/LoadingSpinner';

const { Text } = Typography;

const UserCharts = ({ userData, loading }) => {
  // Safely extract data with fallbacks
  const data = userData || {};
  const userRoleStats = data.user_role_stats || {};
  const locationsPerUser = data.locations_per_user || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <Empty 
        description="No user data available" 
        className="flex flex-col justify-center items-center h-64"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* User Statistics Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="text-center">
            <Statistic
              title="Total Users"
              value={userRoleStats.total_users || 0}
              prefix={<TeamOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center">
            <Statistic
              title="Regular Users"
              value={userRoleStats.user || 0}
              prefix={<UserOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center">
            <Statistic
              title="Admins"
              value={userRoleStats.admin || 0}
              prefix={<CrownOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center">
            <Statistic
              title="Super Admins"
              value={userRoleStats.superadmins || 0}
              prefix={<CrownOutlined className="text-purple-500" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Locations Per User Chart */}
      <Card size="small" title="Locations Per User">
        <div className="space-y-3">
          {locationsPerUser.length > 0 ? (
            locationsPerUser.slice(0, 10).map((user, index) => {
              const maxLocations = Math.max(...locationsPerUser.map(u => u.total_locations || 0));
              const percentage = maxLocations > 0 ? (user.total_locations / maxLocations) * 100 : 0;
              
              return (
                <div key={user.email || index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar 
                      size="small" 
                      style={{ backgroundColor: '#1890ff' }}
                      icon={<UserOutlined />}
                    />
                    <div>
                      <Text strong className="text-sm">{user.username || 'Unknown'}</Text>
                      <div>
                        <Text type="secondary" className="text-xs">{user.email}</Text>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <Text strong className="text-sm">{user.total_locations || 0}</Text>
                      <div>
                        <Text type="secondary" className="text-xs">locations</Text>
                      </div>
                    </div>
                    <div 
                      className="w-16 h-4 bg-blue-200 rounded"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <Empty description="No location data available" />
          )}
        </div>
      </Card>

      {/* User Role Distribution */}
      <Card size="small" title="User Role Distribution">
        <Row gutter={[16, 8]}>
          <Col span={6}>
            <div className="text-center">
              <Text strong className="text-lg" style={{ color: '#52c41a' }}>
                {userRoleStats.user || 0}
              </Text>
              <div>
                <Text type="secondary" className="text-xs">Regular Users</Text>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div className="text-center">
              <Text strong className="text-lg" style={{ color: '#fa8c16' }}>
                {userRoleStats.admin || 0}
              </Text>
              <div>
                <Text type="secondary" className="text-xs">Admins</Text>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div className="text-center">
              <Text strong className="text-lg" style={{ color: '#722ed1' }}>
                {userRoleStats.superadmins || 0}
              </Text>
              <div>
                <Text type="secondary" className="text-xs">Super Admins</Text>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div className="text-center">
              <Text strong className="text-lg" style={{ color: '#1890ff' }}>
                {locationsPerUser.length}
              </Text>
              <div>
                <Text type="secondary" className="text-xs">Total Users</Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default UserCharts;

