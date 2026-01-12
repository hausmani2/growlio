import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Progress, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Space,
  Button,
  message,
  Spin,
  Tooltip
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ReloadOutlined,
  UserOutlined,
  ShopOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import useStore from '../../../store/store';
import LoadingSpinner from '../../layout/LoadingSpinner';

const { Title, Text } = Typography;

const SuperAdminUserInfo = () => {
  const { 
    onboardingStatusData,
    onboardingStatusLoading,
    onboardingStatusError,
    fetchOnboardingStatus
  } = useStore();

  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) {
      return;
    }

    // Only fetch if we don't have data yet
    if (hasFetchedRef.current && onboardingStatusData) {
      return;
    }

    const loadData = async () => {
      isFetchingRef.current = true;
      try {
        await fetchOnboardingStatus();
        hasFetchedRef.current = true;
      } catch (error) {
        console.error('Error loading onboarding status:', error);
      } finally {
        isFetchingRef.current = false;
      }
    };

    loadData();
  }, [fetchOnboardingStatus, onboardingStatusData]);

  const handleRefresh = async () => {
    hasFetchedRef.current = false;
    isFetchingRef.current = false;
    await fetchOnboardingStatus();
  };

  const getStatusTag = (status) => {
    return status ? (
      <Tag color="green" icon={<CheckCircleOutlined />}>Complete</Tag>
    ) : (
      <Tag color="red" icon={<CloseCircleOutlined />}>Incomplete</Tag>
    );
  };

  const getCompletionColor = (percentage) => {
    if (percentage === 100) return '#52c41a';
    if (percentage >= 75) return '#1890ff';
    if (percentage >= 50) return '#faad14';
    return '#ff4d4f';
  };

  const columns = [
    {
      title: 'Restaurant Name',
      dataIndex: 'restaurant_name',
      key: 'restaurant_name',
      width: 200,
      sorter: (a, b) => a.restaurant_name.localeCompare(b.restaurant_name),
      render: (text) => (
        <Text strong className="text-gray-800">{text}</Text>
      ),
    },
    {
      title: 'Onboarding Status',
      dataIndex: 'onboarding_complete',
      key: 'onboarding_complete',
      width: 150,
      filters: [
        { text: 'Complete', value: true },
        { text: 'Incomplete', value: false },
      ],
      onFilter: (value, record) => record.onboarding_complete === value,
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Completion %',
      dataIndex: 'completion_percentage',
      key: 'completion_percentage',
      width: 150,
      sorter: (a, b) => a.completion_percentage - b.completion_percentage,
      render: (percentage) => (
        <div className="flex items-center gap-2">
          <Progress 
            percent={percentage} 
            size="small" 
            strokeColor={getCompletionColor(percentage)}
            format={(percent) => `${percent}%`}
            style={{ minWidth: 100 }}
          />
        </div>
      ),
    },
    {
      title: 'Create Account',
      dataIndex: 'Create Account',
      key: 'Create Account',
      width: 130,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Basic Information',
      dataIndex: 'Basic Information',
      key: 'Basic Information',
      width: 150,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Operating Information',
      dataIndex: 'Operating Information',
      key: 'Operating Information',
      width: 180,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Labour Information',
      dataIndex: 'Labour Information',
      key: 'Labour Information',
      width: 160,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Food Cost Details',
      dataIndex: 'Food Cost Details',
      key: 'Food Cost Details',
      width: 150,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Third-Party Info',
      dataIndex: 'Third-Party Info',
      key: 'Third-Party Info',
      width: 140,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Expense',
      dataIndex: 'Expense',
      key: 'Expense',
      width: 100,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Sales Information',
      dataIndex: 'Sales Information',
      key: 'Sales Information',
      width: 150,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'One Month Sales',
      dataIndex: 'One Month Sales Information',
      key: 'One Month Sales Information',
      width: 150,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
  ];

  if (onboardingStatusLoading && !onboardingStatusData) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (onboardingStatusError) {
    return (
      <Card>
        <div className="text-center py-8">
          <Text type="danger">{onboardingStatusError}</Text>
          <br />
          <Button 
            type="primary" 
            onClick={handleRefresh}
            icon={<ReloadOutlined />}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const data = onboardingStatusData || {};
  const users = data.users || [];
  const totalUsers = data.total_users || 0;
  const onboardedUsers = data.onboarded_users || 0;
  const notOnboardedUsers = data.not_onboarded_users || 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              User Onboarding Status
            </h1>
            <p className="text-gray-600 text-lg">
              Track onboarding progress for all restaurants and users
            </p>
          </div>
          
          <Button 
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={onboardingStatusLoading}
            className="bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-lg hover:shadow-xl"
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="text-center hover:shadow-xl transition-all duration-300 rounded-xl border-0 shadow-md">
            <Statistic
              title={<span className="text-gray-600 font-semibold">Total Users</span>}
              value={totalUsers}
              prefix={<UserOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center hover:shadow-xl transition-all duration-300 rounded-xl border-0 shadow-md">
            <Statistic
              title={<span className="text-gray-600 font-semibold">Onboarded Users</span>}
              value={onboardedUsers}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center hover:shadow-xl transition-all duration-300 rounded-xl border-0 shadow-md">
            <Statistic
              title={<span className="text-gray-600 font-semibold">Not Onboarded</span>}
              value={notOnboardedUsers}
              prefix={<CloseCircleOutlined className="text-red-500" />}
              valueStyle={{ color: '#ff4d4f', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Onboarding Status Table */}
      <Card 
        className="shadow-lg border-0 rounded-xl"
        title={
          <div className="flex items-center gap-2">
            <ShopOutlined className="text-orange-500" />
            <span className="text-lg font-semibold">Restaurant Onboarding Details</span>
          </div>
        }
        extra={
          <Text type="secondary">
            Showing {users.length} restaurant{users.length !== 1 ? 's' : ''}
          </Text>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="restaurant_id"
          loading={onboardingStatusLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} restaurants`,
          }}
          scroll={{ x: 1500 }}
          size="middle"
          className="modern-table"
        />
      </Card>
    </div>
  );
};

export default SuperAdminUserInfo;

