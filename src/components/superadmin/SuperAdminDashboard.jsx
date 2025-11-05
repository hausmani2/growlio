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
import '../mainSceens/summaryDashboard/SummaryDashboard.css';

const { Title, Text } = Typography;

const SuperAdminDashboard = () => {
  // Get state and actions from Redux store
  const { 
    dashboardStats,   
    recentUsers, 
    recentRestaurants, 
    dashboardData,
    loading, 
    error,
    user,
    fetchDashboardStats, 
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
          // Import the force store function
          const { forceStoreOriginalToken } = await import('../../utils/tokenManager');
          const userWithToken = {
            ...user,
            access: hasMainToken,
            refresh: localStorage.getItem('refresh_token') || hasMainToken
          };
          forceStoreOriginalToken(userWithToken);
        }
        
        // Fetch all dashboard data in parallel
        await Promise.all([
          fetchDashboardStats(),
        ]);
      } catch (error) {
        message.error('Failed to load dashboard data');
        console.error('Dashboard data loading error:', error);
      }
    };

    loadDashboardData();
  }, [fetchDashboardStats, fetchRecentUsers, fetchRecentRestaurants, fetchAnalyticsData, user]);

  if (loading) {
    return (
      <div className="w-full mx-auto">
        {/* Enhanced Header Section - Matching other dashboards */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
            {/* Left Side - Title and Description */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-orange-600 mb-2">
                SuperAdmin Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Complete platform management, user analytics, and system administration
              </p>
            </div>
            
            {/* Right Side - Admin Badge */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-100 to-orange-200 px-4 py-2 rounded-lg border border-orange-300">
                <div className="flex items-center gap-2">
                  <CrownOutlined className="text-orange-600 text-lg" />
                  <span className="text-orange-800 font-semibold">Super Admin</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        <Card className="shadow-lg border-0 rounded-xl">
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <LoadingSpinner size="large" />
              <p className="mt-4 text-gray-600 text-lg">Loading dashboard data...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'analytics',
      label: (
        <span>
          <BarChartOutlined />
          <span className="">Analytics</span>
        </span>
      ),
      children: (
        <div className="p-6">
          <AnalyticsCharts loading={loading} dashboardData={dashboardData} />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full mx-auto">
      {/* Enhanced Header Section - Matching other dashboards */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
          {/* Left Side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              SuperAdmin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Complete platform management, user analytics, and system administration
            </p>
          </div>
          
          {/* Right Side - Admin Badge */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-orange-100 to-orange-200 px-4 py-2 rounded-lg border border-orange-300">
              <div className="flex items-center gap-2">
                <CrownOutlined className="text-orange-600 text-lg" />
                <span className="text-orange-800 font-semibold">Super Admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Component - Remove in production */}
      {/* <TokenStateDebugger /> */}

      {/* Main Content with Enhanced Styling */}
      <Card className="shadow-lg border-0 rounded-xl overflow-hidden">
        <Tabs 
          defaultActiveKey="overview" 
          items={tabItems} 
          size="large"
          tabBarStyle={{
            marginBottom: 0,
            borderBottom: '1px solid #f0f0f0',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            padding: '0 24px',
            radius: '12px',
          }}
          className="modern-tabs"
        />
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
