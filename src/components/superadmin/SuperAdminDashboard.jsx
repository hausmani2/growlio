import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import SuperAdminUserInfo from './components/SuperAdminUserInfo';
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
    isAuthenticated,
    fetchDashboardStats, 
    fetchRecentUsers, 
    fetchRecentRestaurants,
    fetchAnalyticsData 
  } = useStore();

  // Use refs to track state and prevent duplicate calls
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const mountedRef = useRef(true);
  const userEmailRef = useRef(null);
  const fetchPromiseRef = useRef(null);

  // Store fetchDashboardStats in ref to avoid dependency issues
  const fetchDashboardStatsRef = useRef(fetchDashboardStats);
  useEffect(() => {
    fetchDashboardStatsRef.current = fetchDashboardStats;
  }, [fetchDashboardStats]);

  // Memoize the fetch function to prevent unnecessary re-renders
  const loadDashboardData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) {
      return fetchPromiseRef.current;
    }

    // Check if already fetched for current user
    const currentUserEmail = user?.email || user?.id || null;
    if (hasFetchedRef.current && dashboardData && userEmailRef.current === currentUserEmail) {
      return Promise.resolve();
    }

    // Set fetching flag and create promise
    isFetchingRef.current = true;
    userEmailRef.current = currentUserEmail;

    const fetchPromise = (async () => {
      try {
        // Check if component is still mounted
        if (!mountedRef.current) {
          return;
        }

        // Check if we need to fix missing original super admin token
        const hasOriginalToken = localStorage.getItem('original_superadmin_token');
        const hasMainToken = localStorage.getItem('token');
        
        if (!hasOriginalToken && hasMainToken && user) {
          // Import the force store function
          const { forceStoreOriginalToken } = await import('../../utils/tokenManager');
          const userWithToken = {
            ...user,
            access: hasMainToken,
            refresh: localStorage.getItem('refresh_token') || hasMainToken
          };
          forceStoreOriginalToken(userWithToken);
        }
        
        // Fetch dashboard data using ref to avoid dependency issues
        await fetchDashboardStatsRef.current();
        
        // Mark as fetched only if component is still mounted
        if (mountedRef.current) {
          hasFetchedRef.current = true;
        }
      } catch (error) {
        if (mountedRef.current) {
          message.error('Failed to load dashboard data');
          console.error('Dashboard data loading error:', error);
        }
      } finally {
        if (mountedRef.current) {
          isFetchingRef.current = false;
          fetchPromiseRef.current = null;
        }
      }
    })();

    fetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [user, dashboardData]);

  useEffect(() => {
    // Only proceed if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Reset fetch flag if user changed
    const currentUserEmail = user.email || user.id || null;
    if (userEmailRef.current !== null && userEmailRef.current !== currentUserEmail) {
      hasFetchedRef.current = false;
    }

    // Load dashboard data
    loadDashboardData();
  }, [isAuthenticated, user?.email, user?.id, loadDashboardData]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      isFetchingRef.current = false;
    };
  }, []);

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
    {
      key: 'user-info',
      label: (
        <span>
          <UserOutlined />
          <span className="">User Onboarding</span>
        </span>
      ),
      children: (
        <div className="p-6">
          <SuperAdminUserInfo />
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
