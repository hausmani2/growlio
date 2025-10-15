import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  message, 
  Row, 
  Col, 
  Statistic,
  Typography,
  Alert
} from 'antd';
import { 
  UserOutlined, 
  CrownOutlined, 
  UserSwitchOutlined, 
  TeamOutlined, 
  UserAddOutlined
} from '@ant-design/icons';
import SimpleUserTable from './components/SimpleUserTable';
import useStore from '../../store/store';

const { Title, Text } = Typography;

const SuperAdminUsers = () => {
  const { 
    isImpersonating, 
    getImpersonatedUser,
    getImpersonatedUserData,
    getImpersonationMessage,
    stopImpersonation,
    fetchAllUsers,
    allUsers,
    usersTotal,
    loading
  } = useStore();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Check if currently impersonating
    if (isImpersonating()) {
      const impersonatedUser = getImpersonatedUser();
      const impersonationMessage = getImpersonationMessage();
      message.info(impersonationMessage || `Currently impersonating: ${impersonatedUser}`);
    }

    // Load users for statistics
    const loadUsers = async () => {
      try {
        const result = await fetchAllUsers(1, 100); // Load first 100 users for stats
        if (result.success) {
          setUsers(result.data);
        }
      } catch (error) {
        console.error('Error loading users for statistics:', error);
      }
    };

    loadUsers();
  }, [fetchAllUsers]);


  const handleStopImpersonation = async () => {
    try {
      const result = await stopImpersonation();
      if (result.success) {
        message.success('Stopped impersonation successfully');
      } else {
        message.error(result.error || 'Failed to stop impersonation');
      }
    } catch (error) {
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={3}>User Management</Title>
            <Text type="secondary">
              Manage all platform users with superadmin privileges including impersonation
            </Text>
          </Col>
          <Col>
            <Space>
              {isImpersonating() && (
                <Alert
                  message={
                    <div className="flex items-center justify-between">
                      <div>
                        <Text strong>Impersonating: {getImpersonatedUser()}</Text>
                        {getImpersonatedUserData() && (
                          <Text type="secondary" className="ml-2">
                            ({getImpersonatedUserData().username} - {getImpersonatedUserData().role})
                          </Text>
                        )}
                      </div>
                      <Button 
                        size="small"
                        type="primary" 
                        danger 
                        onClick={handleStopImpersonation}
                        icon={<UserSwitchOutlined />}
                      >
                        Stop
                      </Button>
                    </div>
                  }
                  type="warning"
                  showIcon={false}
                  className="mb-0"
                />
              )}
              <Button 
                type="primary" 
                icon={<UserAddOutlined />}
                onClick={() => {/* Handle add user */}}
              >
                Add User
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* User Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <Statistic
              title="Total Users"
              value={users.length}
              prefix={<TeamOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <Statistic
              title="Active Users"
              value={users.filter(u => u.is_active).length}
              prefix={<UserOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <Statistic
              title="Admins"
              value={users.filter(u => u.role === 'admin' || u.is_staff).length}
              prefix={<CrownOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center hover:shadow-lg transition-shadow">
            <Statistic
              title="Superusers"
              value={users.filter(u => u.is_superuser).length}
              prefix={<CrownOutlined className="text-purple-500" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Simple User Management with Direct Impersonation */}
      <SimpleUserTable />
    </div>
  );
};

export default SuperAdminUsers;
