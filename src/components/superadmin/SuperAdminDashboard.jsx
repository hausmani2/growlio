import React, { useState, useEffect } from 'react';
import { 
  message, 
  Spin, 
  Tabs, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Space,
  Badge,
  Avatar,
  Typography,
  Divider
} from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  BarChartOutlined, 
  SettingOutlined,
  TeamOutlined,
  CrownOutlined,
  ShopOutlined,
  DollarOutlined,
  TrophyOutlined,
  UserSwitchOutlined,
  BellOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import UserCharts from './components/UserCharts';
import RecentTables from './components/RecentTables';
import AnalyticsCharts from './components/AnalyticsCharts';
import SuperAdminUsers from './SuperAdminUsers';
import SystemSettings from './components/SystemSettings';
import AuditLogs from './components/AuditLogs';
import CorporateSupportAccess from './components/CorporateSupportAccess';
import useStore from '../../store/store';
import LoadingSpinner from '../layout/LoadingSpinner';
import TokenStateDebugger from '../debug/TokenStateDebugger'; // Uncomment for debugging

const { Title, Text } = Typography;

const SuperAdminDashboard = () => {
  // Get state and actions from Redux store
  const { 
    dashboardStats, 
    userAnalytics, 
    recentUsers, 
    recentRestaurants, 
    dashboardData,
    loading, 
    error,
    user,
    fetchDashboardStats, 
    fetchUserAnalytics, 
    fetchRecentUsers, 
    fetchRecentRestaurants,
    fetchAnalyticsData 
  } = useStore();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Check if we need to fix missing original super admin token
        const hasOriginalToken = localStorage.getItem('original_superadmin_token');
        const hasMainToken = localStorage.getItem('token');
        const hasUser = user;
        
        if (!hasOriginalToken && hasMainToken && hasUser) {
          console.log('🔧 Auto-fixing missing original super admin token...');
          // Import the force store function
          const { forceStoreOriginalToken } = await import('../../utils/tokenManager');
          const userWithToken = {
            ...user,
            access: hasMainToken,
            refresh: localStorage.getItem('refresh_token') || hasMainToken
          };
          forceStoreOriginalToken(userWithToken);
          console.log('✅ Original super admin token auto-restored');
        }
        
        // Fetch all dashboard data in parallel
        await Promise.all([
          fetchDashboardStats(),
          fetchUserAnalytics(),
          fetchRecentUsers(5),
          fetchRecentRestaurants(5),
          fetchAnalyticsData()
        ]);
      } catch (error) {
        message.error('Failed to load dashboard data');
        console.error('Dashboard data loading error:', error);
      }
    };

    loadDashboardData();
  }, [fetchDashboardStats, fetchUserAnalytics, fetchRecentUsers, fetchRecentRestaurants, fetchAnalyticsData, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <DashboardOutlined />
          <span className="ml-2">Overview</span>
        </span>
      ),
      children: (
        <div className="space-y-6">
          {/* Welcome Section */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
            <Row align="middle" justify="space-between">
              <Col>
                <Title level={2} className="mb-2">
                  Welcome to SuperAdmin Dashboard
                </Title>
                <Text type="secondary" className="text-lg">
                  Complete platform management and analytics
                </Text>
              </Col>
              <Col>
                <Avatar 
                  size={64} 
                  icon={<CrownOutlined />} 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500"
                />
              </Col>
            </Row>
          </Card>

          {/* Quick Stats */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center hover:shadow-lg transition-shadow">
                <Statistic
                  title="Total Users"
                  value={dashboardStats?.totalUsers || 0}
                  prefix={<TeamOutlined className="text-blue-500" />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center hover:shadow-lg transition-shadow">
                <Statistic
                  title="Active Restaurants"
                  value={dashboardStats?.totalRestaurants || 0}
                  prefix={<ShopOutlined className="text-green-500" />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center hover:shadow-lg transition-shadow">
                <Statistic
                  title="Total Revenue"
                  value={dashboardStats?.totalRevenue || 0}
                  prefix={<DollarOutlined className="text-yellow-500" />}
                  valueStyle={{ color: '#faad14' }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="text-center hover:shadow-lg transition-shadow">
                <Statistic
                  title="Platform Health"
                  value={dashboardStats?.platformHealth || 98.5}
                  suffix="%"
                  prefix={<TrophyOutlined className="text-purple-500" />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts Section */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              {/* <Card title="User Analytics" className="h-96">
                <UserCharts userData={dashboardData} loading={loading} />
              </Card> */}
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Recent Activity" className="h-auto">
                <RecentTables 
                  recentUsers={recentUsers} 
                  recentRestaurants={recentRestaurants} 
                  loading={loading} 
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'analytics',
      label: (
        <span>
          <BarChartOutlined />
          <span className="ml-2">Analytics</span>
        </span>
      ),
      children: (
        <div>
          <AnalyticsCharts loading={loading} dashboardData={dashboardData} />
        </div>
      ),
    },

  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-2">
        {/* Header */}
        <div className="mb-2">
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={1} className="mb-2">
                SuperAdmin Dashboard
              </Title>
            </Col>
          </Row>
        </div>


        {/* Debug Component - Remove in production */}
        {/* <TokenStateDebugger /> */}

        {/* Main Content */}
        <Card className="shadow-sm">
          <Tabs 
            defaultActiveKey="overview" 
            items={tabItems} 
            size="large"
            tabBarStyle={{
              marginBottom: 24,
              borderBottom: '1px solid #f0f0f0'
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
