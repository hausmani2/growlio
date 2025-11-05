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
      {/* Header Section - Matching other dashboards */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
          {/* Left Side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              User Support
            </h1>
            <p className="text-gray-600 text-lg">
              Manage all platform users with superadmin privileges including impersonation
            </p>
          </div>
          
          {/* Right Side - Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {isImpersonating() && (
              <Alert
                message={
                  <div className="flex items-center justify-between">
                    <div>
                      <Text strong className="text-orange-800">Impersonating: {getImpersonatedUser()}</Text>
                      {getImpersonatedUserData() && (
                        <Text className="text-orange-600 ml-2">
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
                      className="bg-gradient-to-r from-red-500 to-red-600 border-0 shadow-md hover:shadow-lg"
                    >
                      Stop
                    </Button>
                  </div>
                }
                type="warning"
                showIcon={false}
                className="mb-0 bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300"
              />
            )}
          </div>
        </div>
      </div>

      {/* Enhanced User Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl border-0 shadow-md">
            <Statistic
              title={<span className="text-gray-600 font-semibold">Total Users</span>}
              value={users.length}
              prefix={<TeamOutlined className="text-orange-500" />}
              valueStyle={{ color: '#FF8132', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl border-0 shadow-md">
            <Statistic
              title={<span className="text-gray-600 font-semibold"> Users</span>}
              value={users.filter(u => u.role === 'user' || u.role === 'USER').length}
              prefix={<UserOutlined className="text-green-500" />}
              valueStyle={{ color: '#22c55e', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl border-0 shadow-md">
            <Statistic
              title={<span className="text-gray-600 font-semibold">Admins</span>}
              value={users.filter(u => u.role === 'admin' || u.role === 'ADMIN').length}
              prefix={<CrownOutlined className="text-blue-500" />}
              valueStyle={{ color: '#3b82f6', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl border-0 shadow-md">
            <Statistic
              title={<span className="text-gray-600 font-semibold">Superusers</span>}
              value={users.filter(u => u.is_superuser).length}
              prefix={<CrownOutlined className="text-purple-500" />}
              valueStyle={{ color: '#8b5cf6', fontSize: '24px', fontWeight: 'bold' }}
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
