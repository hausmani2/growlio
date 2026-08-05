import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Modal,
  Row,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CreditCardOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/store';
import { formatPrice } from '../../../utils/packageDisplay';

const { Text, Title } = Typography;

const formatBillingDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatMoney = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(Number(amount));
  } catch {
    return `$${Number(amount).toFixed(2)}`;
  }
};

const planDisplayName = (pkg) => {
  const raw = String(
    pkg?.display_name || pkg?.name || pkg?.package_name || pkg?.key || ''
  ).trim();
  if (!raw) return '—';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const BillingTab = () => {
  const navigate = useNavigate();
  const {
    subscriptionDetails,
    subscriptionDetailsLoading,
    fetchCurrentSubscriptionDetails,
    receipts,
    receiptsLoading,
    fetchSubscriptionReceipts,
    cancelSubscription,
  } = useStore();

  const [cancelLoading, setCancelLoading] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
    fetchCurrentSubscriptionDetails?.(true);
    fetchSubscriptionReceipts?.();
  }, [fetchCurrentSubscriptionDetails, fetchSubscriptionReceipts]);

  const packageInfo = subscriptionDetails?.package || null;
  const billing = subscriptionDetails?.billing || {};
  const isLite = String(packageInfo?.name || '').toLowerCase().includes('lite');
  const cancelScheduled = Boolean(billing.cancel_at_period_end);
  const canCancel = Boolean(billing.can_cancel);

  const statusTag = useMemo(() => {
    if (cancelScheduled) {
      return <Tag color="orange">Cancels at period end</Tag>;
    }
    const status = String(billing.status || 'active').toLowerCase();
    if (status === 'active') return <Tag color="green">Active</Tag>;
    if (status === 'canceled') return <Tag color="red">Canceled</Tag>;
    if (status === 'pending') return <Tag color="gold">Pending</Tag>;
    if (status === 'expired') return <Tag>Expired</Tag>;
    return <Tag>{billing.status || '—'}</Tag>;
  }, [billing.status, cancelScheduled]);

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      const result = await cancelSubscription?.();
      if (result?.success) {
        message.success(
          result.message ||
            'Subscription will cancel at the end of the billing period.'
        );
        setIsCancelModalOpen(false);
        await fetchSubscriptionReceipts?.();
      } else {
        message.error(result?.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      message.error(error?.message || 'Failed to cancel subscription');
    } finally {
      setCancelLoading(false);
    }
  };

  const receiptColumns = [
    {
      title: 'Date',
      dataIndex: 'created',
      key: 'created',
      render: (value, row) => formatBillingDate(value || row.period_start),
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, row) => {
        if (!row.period_start && !row.period_end) return '—';
        return `${formatBillingDate(row.period_start)} – ${formatBillingDate(row.period_end)}`;
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount_paid',
      key: 'amount_paid',
      render: (value, row) => formatMoney(value, row.currency),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value) => {
        const status = String(value || '').toLowerCase();
        const color =
          status === 'paid' || status === 'active'
            ? 'green'
            : status === 'open'
              ? 'blue'
              : 'default';
        return <Tag color={color}>{value || '—'}</Tag>;
      },
    },
    {
      title: 'Receipt',
      key: 'download',
      render: (_, row) => {
        const url = row.invoice_pdf || row.hosted_invoice_url;
        if (!url) {
          return <Text type="secondary">Unavailable</Text>;
        }
        return (
          <Button
            type="link"
            icon={<DownloadOutlined />}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-0"
          >
            {row.invoice_pdf ? 'Download PDF' : 'View'}
          </Button>
        );
      },
    },
  ];

  if (subscriptionDetailsLoading && !subscriptionDetails) {
    return (
      <div className="flex justify-center py-16">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-0 bg-gray-50">
        <div className="pb-3 border-b border-gray-200 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-orange-600 mb-0">Subscription</h3>
            <Text type="secondary">Your current Growlio plan and billing cycle</Text>
          </div>
          <Button onClick={() => navigate('/dashboard/pricing')}>Change plan</Button>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <div className="space-y-1">
              <Text type="secondary" className="text-sm">
                Subscription Type
              </Text>
              <div className="flex items-center gap-2">
                <CreditCardOutlined className="text-orange-500" />
                <Title level={4} className="!mb-0 !mt-0">
                  {planDisplayName(packageInfo)}
                </Title>
              </div>
              <Text className="text-gray-600">
                {formatPrice(billing.monthly_price ?? packageInfo?.price_per_location)}
                {!isLite ? ' / month' : ''}
              </Text>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="space-y-1">
              <Text type="secondary" className="text-sm">
                {cancelScheduled ? 'Access Until' : 'Next Billing Date'}
              </Text>
              <Title level={4} className="!mb-0 !mt-0">
                {isLite && !billing.next_billing_date
                  ? 'Not applicable'
                  : formatBillingDate(billing.next_billing_date)}
              </Title>
              <div>{statusTag}</div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="space-y-1">
              <Text type="secondary" className="text-sm">
                Locations
              </Text>
              <Title level={4} className="!mb-0 !mt-0">
                {subscriptionDetails?.restaurant?.allowed_locations ?? '—'}
              </Title>
              <Text className="text-gray-600">
                {subscriptionDetails?.restaurant?.actual_location_count ?? 0} in use
              </Text>
            </div>
          </Col>
        </Row>

        {cancelScheduled && (
          <Alert
            className="mt-6"
            type="warning"
            showIcon
            message="Cancellation scheduled"
            description={`Your paid plan remains active until ${formatBillingDate(
              billing.next_billing_date
            )}. After that you will move to the Lite plan.`}
          />
        )}
      </Card>

      <Card className="shadow-sm border-0 bg-gray-50">
        <div className="pb-3 border-b border-gray-200 mb-6">
          <h3 className="text-xl font-bold text-orange-600 mb-0">Past Receipts</h3>
          <Text type="secondary">View and download invoices from previous billing periods</Text>
        </div>

        <Table
          rowKey={(row) => row.id || row.number || `${row.created}-${row.amount_paid}`}
          columns={receiptColumns}
          dataSource={receipts || []}
          loading={receiptsLoading}
          pagination={false}
          locale={{ emptyText: 'No receipts yet' }}
          scroll={{ x: 700 }}
        />
      </Card>

      <Card className="shadow-sm border-0 bg-gray-50">
        <div className="pb-3 border-b border-gray-200 mb-6">
          <h3 className="text-xl font-bold text-orange-600 mb-0">Cancel Subscription</h3>
          <Text type="secondary">
            Cancel your paid plan. You keep access until the end of the current billing period,
            then move to Lite.
          </Text>
        </div>

        {isLite ? (
          <Alert
            type="info"
            showIcon
            message="You are on the free Lite plan"
            description="There is no paid subscription to cancel. Upgrade anytime from Plans."
          />
        ) : cancelScheduled ? (
          <Alert
            type="success"
            showIcon
            message="Cancellation already scheduled"
            description={`No further charges after ${formatBillingDate(
              billing.next_billing_date
            )}.`}
          />
        ) : (
          <Button
            danger
            size="large"
            icon={<ExclamationCircleOutlined />}
            disabled={!canCancel}
            onClick={() => setIsCancelModalOpen(true)}
          >
            Cancel Subscription
          </Button>
        )}
      </Card>

      <Modal
        title="Cancel subscription?"
        open={isCancelModalOpen}
        onCancel={() => setIsCancelModalOpen(false)}
        centered
        okText="Yes, cancel at period end"
        okButtonProps={{ danger: true, loading: cancelLoading }}
        onOk={handleCancelSubscription}
        cancelText="Keep subscription"
      >
        <p className="mb-2">
          Your <strong>{planDisplayName(packageInfo)}</strong> plan will remain active until{' '}
          <strong>{formatBillingDate(billing.next_billing_date)}</strong>.
        </p>
        <p className="mb-0 text-gray-600">
          After that you will be moved to the free Lite plan. You can upgrade again anytime.
        </p>
      </Modal>
    </div>
  );
};

export default BillingTab;
