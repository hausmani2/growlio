import React, { useEffect, useMemo } from 'react';
import { Button, Card, Table, Typography, Spin, Alert, Tag } from 'antd';
import {
  CheckCircleOutlined,
  LinkOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/store';
import PageHeaderSection from '../../common/PageHeaderSection';

const { Text } = Typography;

const isSquareIntegration = (integration) => {
  const key = String(integration?.slug || integration?.name || '').toLowerCase();
  return key.includes('square');
};

const getPlanName = (plan) =>
  String(plan?.key || plan?.name || plan?.display_name || plan?.package_name || '')
    .trim()
    .toLowerCase();

const isPaidPosPlan = (planName) => planName.includes('grow') || planName.includes('pro');

const PosIntegrationsPage = () => {
  const navigate = useNavigate();
  const integrations = useStore((s) => s.posIntegrations);
  const loading = useStore((s) => s.posIntegrationsLoading);
  const error = useStore((s) => s.posIntegrationsError);
  const fetchPosIntegrations = useStore((s) => s.fetchPosIntegrations);
  const clearPosIntegrationsError = useStore((s) => s.clearPosIntegrationsError);
  const squareStatus = useStore((s) => s.squareStatus);
  const squareLoading = useStore((s) => s.squareLoading);
  const checkSquareStatus = useStore((s) => s.checkSquareStatus);
  const subscriptionDetails = useStore((s) => s.subscriptionDetails);
  const subscriptionDetailsLoading = useStore((s) => s.subscriptionDetailsLoading);
  const fetchCurrentSubscriptionDetails = useStore((s) => s.fetchCurrentSubscriptionDetails);
  const currentPackage = useStore((s) => s.currentPackage);
  const [showUpgradeRequired, setShowUpgradeRequired] = React.useState(false);
  const [isCheckingPlan, setIsCheckingPlan] = React.useState(false);
  const [latestPlanName, setLatestPlanName] = React.useState('');

  const restaurantId = localStorage.getItem('restaurant_id');

  useEffect(() => {
    fetchPosIntegrations();
  }, [fetchPosIntegrations]);

  useEffect(() => {
    let isMounted = true;

    if (restaurantId) {
      checkSquareStatus(restaurantId);
      setIsCheckingPlan(true);
      const subscriptionPromise = fetchCurrentSubscriptionDetails?.(true);
      if (subscriptionPromise?.finally) {
        subscriptionPromise
          .then((result) => {
            if (isMounted) {
              setLatestPlanName(getPlanName(result?.data?.package));
            }
          })
          .finally(() => {
            if (isMounted) setIsCheckingPlan(false);
          });
      } else {
        setIsCheckingPlan(false);
      }
    } else {
      setIsCheckingPlan(false);
    }

    return () => {
      isMounted = false;
    };
  }, [restaurantId, checkSquareStatus, fetchCurrentSubscriptionDetails]);

  const currentPlanName = latestPlanName || getPlanName(subscriptionDetails?.package || currentPackage);
  const canUsePosIntegrations = isPaidPosPlan(currentPlanName);

  const enhancedIntegrations = useMemo(
    () =>
      (integrations || []).map((integration) => ({
        ...integration,
        connectionStatus:
          isSquareIntegration(integration) && squareStatus === 'connected'
            ? 'connected'
            : 'not_connected',
      })),
    [integrations, squareStatus]
  );

  const connectedCount = enhancedIntegrations.filter(
    (integration) => integration.connectionStatus === 'connected'
  ).length;

  const handleManageIntegration = async () => {
    let allowed = canUsePosIntegrations;

    if (fetchCurrentSubscriptionDetails) {
      setIsCheckingPlan(true);
      try {
        const result = await fetchCurrentSubscriptionDetails(true);
        const fetchedPlanName = getPlanName(result?.data?.package || currentPackage);
        setLatestPlanName(fetchedPlanName);
        allowed = isPaidPosPlan(fetchedPlanName);
      } finally {
        setIsCheckingPlan(false);
      }
    }

    if (!allowed) {
      setShowUpgradeRequired(true);
      return;
    }

    navigate('/dashboard/square');
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-orange-100 bg-orange-50 text-orange-600">
            <SafetyCertificateOutlined />
          </div>
          <div className="min-w-0">
            <Text strong className="block text-gray-900">
              {name}
            </Text>
            <Text type="secondary" className="text-xs">
              {record?.slug || 'POS provider'}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <Text className="text-gray-600">{text || '-'}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'connectionStatus',
      key: 'connectionStatus',
      width: 170,
      render: (status) =>
        status === 'connected' ? (
          <Tag icon={<CheckCircleOutlined />} color="success" className="rounded-full px-3 py-1">
            Connected
          </Tag>
        ) : (
          <Tag color="default" className="rounded-full px-3 py-1">
            Not Connected
          </Tag>
        ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 180,
      render: (_, record) => {
        const isConnected = record.connectionStatus === 'connected';

        return (
          <Button
            type={isConnected ? 'default' : 'primary'}
            icon={isConnected ? <RightOutlined /> : <LinkOutlined />}
            onClick={handleManageIntegration}
            loading={isCheckingPlan || subscriptionDetailsLoading}
            className={
              isConnected
                ? 'border-orange-200 text-orange-600 hover:!border-orange-400 hover:!text-orange-600'
                : ''
            }
          >
            {isConnected ? 'Manage' : 'Connect'}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <PageHeaderSection
        title="POS Integrations"
        description="Review available point-of-sale providers and connect the one your restaurant uses."
      />

      {error && (
        <Alert
          type="error"
          message={error}
          closable
          onClose={clearPosIntegrationsError}
          className="mb-4"
        />
      )}

      {showUpgradeRequired && (
        <Card className="mb-6 border border-orange-100 shadow-lg">
          <div className="flex flex-col gap-5 p-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <StarOutlined className="text-xl" />
              </div>
              <div>
                <h2 className="mb-2 text-xl font-semibold text-gray-900">Upgrade Required</h2>
                <p className="mb-0 max-w-3xl text-sm leading-6 text-gray-600">
                  This feature is not available on the Lite plan. Upgrade to the Grow or Pro plans
                  to unlock POS integrations, automation tools, advanced insights, more access to
                  LIO, and more powerful ways to simplify your restaurant operations.
                </p>
              </div>
            </div>
            <Button type="primary" size="large" onClick={() => navigate('/dashboard/pricing')}>
              Upgrade My Plan
            </Button>
          </div>
        </Card>
      )}

      <Card className="border border-gray-100 shadow-lg" bodyStyle={{ padding: 0 }}>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-gray-900">Available POS Providers</h2>
            <p className="mb-0 text-sm text-gray-500">
              Connected providers can sync sales, payments, and restaurant operations data.
            </p>
          </div>
          <Tag
            color={connectedCount > 0 ? 'success' : 'default'}
            className="w-fit rounded-full px-3 py-1 text-sm"
          >
            {connectedCount} Connected
          </Tag>
        </div>

        <Spin spinning={loading}>
          <Table
            rowKey={(record) => record?.id || record?.slug || record?.name}
            columns={columns}
            dataSource={enhancedIntegrations}
            pagination={false}
            loading={squareLoading && !loading}
            scroll={{ x: 760 }}
            locale={{ emptyText: 'No POS integrations found' }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default PosIntegrationsPage;
