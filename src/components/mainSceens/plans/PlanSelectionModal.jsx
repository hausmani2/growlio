import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Button, Typography, Divider, Alert, Spin, message } from 'antd';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import useStore from '../../../store/store';
import FeaturesTable from './FeaturesTable';

const { Title, Text } = Typography;

const PlanSelectionModal = ({ 
  visible, 
  plan, 
  currentPlan, 
  onClose, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const { updateSubscription } = useStore();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && plan) {
      // Reset form and set initial value when modal opens
      // For free plans, use max_locations; for paid plans, start with 1
      const initialValue = (plan.price_per_location === 0 || (plan.price_per_location === null && plan.max_locations === 1))
        ? (plan.max_locations && plan.max_locations < 9999 ? plan.max_locations : 1)
        : 1;
      form.resetFields();
      form.setFieldsValue({
        number_of_locations: initialValue
      });
    }
  }, [visible, plan, form]);

  const handleSubmit = async (values) => {
    if (!plan || !plan.id) {
      return;
    }

    setSubmitting(true);
    try {
      const restaurantId = localStorage.getItem('restaurant_id');
      
      if (!restaurantId) {
        Modal.error({
          title: 'Error',
          content: 'Restaurant ID not found. Please ensure you are logged in.',
        });
        setSubmitting(false);
        return;
      }

      const result = await updateSubscription({
        restaurant_id: restaurantId,
        package_id: plan.id,
        number_of_locations: values.number_of_locations || 1
      });

      if (result.success) {
        // Check if payment is required (Stripe checkout)
        if (result.requiresPayment && result.checkoutUrl) {
          // Show message before redirecting
          message.loading('Redirecting to payment checkout...', 1);
          
          // Small delay to show the message, then redirect
          setTimeout(() => {
            window.location.href = result.checkoutUrl;
          }, 500);
          // Don't close modal yet, let Stripe handle the redirect
          return;
        } else {
          // No payment required, subscription updated successfully
          onSuccess();
        }
      } else {
        Modal.error({
          title: 'Update Failed',
          content: result.error || 'Failed to update subscription plan. Please try again.',
        });
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      Modal.error({
        title: 'Error',
        content: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'Custom';
    if (price === 0) return 'Free';
    return `$${parseFloat(price).toFixed(0)}`;
  };

  const isUpgrade = currentPlan && plan.price && currentPlan.price && plan.price > currentPlan.price;
  const isDowngrade = currentPlan && plan.price && currentPlan.price && plan.price < currentPlan.price;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <Title level={4} className="!mb-0">
            {isUpgrade ? 'Upgrade Plan' : isDowngrade ? 'Downgrade Plan' : 'Change Plan'}
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      className="plan-selection-modal"
    >
      <Spin spinning={submitting}>
        <div className="py-4">
          {/* Plan Summary */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <Title level={4} className="!mb-1 !text-orange-900">
                  {plan.name}
                </Title>
                <Text className="text-orange-700">
                  {plan.description || 'Premium subscription plan'}
                </Text>
              </div>
              <div className="text-right">
                <Text className="text-2xl font-bold text-orange-900">
                  {formatPrice(plan.price_per_location)}
                </Text>
                {plan.price_per_location !== undefined && plan.price_per_location > 0 && (
                  <Text className="text-orange-700 block text-sm">/location/month</Text>
                )}
                {plan.price_per_location === 0 && (
                  <Text className="text-orange-700 block text-sm">Forever</Text>
                )}
              </div>
            </div>
          </div>

          {/* Current Plan Info */}
          {currentPlan && currentPlan.id !== plan.id && (
            <Alert
              message={
                <div>
                  <Text strong>Current Plan: </Text>
                  <Text>{currentPlan.display_name || currentPlan.name}</Text>
                  {currentPlan.price_per_location !== undefined && (
                    <Text className="ml-2">
                      ({formatPrice(currentPlan.price_per_location)}{currentPlan.price_per_location > 0 ? '/location/month' : ''})
                    </Text>
                  )}
                </div>
              }
              type="info"
              icon={<InfoCircleOutlined />}
              className="mb-6"
            />
          )}

          {/* Features Section */}
          {plan.features && plan.features.length > 0 && (
            <div className="mb-6">
              <Title level={5} className="!mb-3">
                Plan Features
              </Title>
              <FeaturesTable features={plan.features} />
            </div>
          )}

          <Divider />

          {/* Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              number_of_locations: (plan.price_per_location === 0 || (plan.price_per_location === null && plan.max_locations === 1))
                ? (plan.max_locations && plan.max_locations < 9999 ? plan.max_locations : 1)
                : 1
            }}
          >
            <Form.Item
              label={
                <div className="flex items-center gap-2">
                  <Text strong>Number of Locations</Text>
                  <InfoCircleOutlined className="text-gray-400" />
                </div>
              }
              name="number_of_locations"
              validateTrigger={['onChange', 'onBlur']}
              rules={[
                { required: true, message: 'Please enter the number of locations' },
                { type: 'number', min: 1, message: 'Number of locations must be at least 1' },
                { 
                  validator: (_, value) => {
                    const maxValue = plan.max_locations && plan.max_locations < 9999 ? plan.max_locations : 100;
                    if (value === null || value === undefined || value === '') {
                      return Promise.reject(new Error('Please enter the number of locations'));
                    }
                    if (value < 1) {
                      return Promise.reject(new Error('Number of locations must be at least 1'));
                    }
                    if (value > maxValue) {
                      return Promise.reject(new Error(
                        plan.max_locations && plan.max_locations < 9999 
                          ? `Number of locations cannot exceed ${plan.max_locations} for this plan`
                          : 'Number of locations cannot exceed 100'
                      ));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
              help={
                plan.price_per_location === 0
                  ? `This free plan is limited to ${plan.max_locations && plan.max_locations < 9999 ? plan.max_locations : 1} location${(plan.max_locations && plan.max_locations < 9999 && plan.max_locations > 1) ? 's' : ''}.`
                  : plan.max_locations && plan.max_locations < 9999
                  ? `This plan allows up to ${plan.max_locations} location${plan.max_locations > 1 ? 's' : ''}`
                  : 'Enter the total number of restaurant locations for this subscription'
              }
            >
              <InputNumber
                min={1}
                className="w-full"
                size="large"
                placeholder="Enter number of locations"
                controls={true}
                keyboard={true}
                style={{ width: '100%' }}
                disabled={plan.price_per_location === 0 || (plan.price_per_location === null && plan.max_locations === 1)}
                onChange={(value) => {
                  // Limit controls to max, but allow typing any value for validation
                  const maxValue = plan.max_locations && plan.max_locations < 9999 ? plan.max_locations : 100;
                  // Only limit if using controls (not typing)
                  if (value !== null && value !== undefined && value > maxValue) {
                    // Don't prevent typing, but trigger validation to show error
                    setTimeout(() => {
                      form.validateFields(['number_of_locations']).catch(() => {});
                    }, 0);
                  } else {
                    // Trigger validation on change to show error immediately
                    setTimeout(() => {
                      form.validateFields(['number_of_locations']).catch(() => {});
                    }, 0);
                  }
                }}
                onBlur={() => {
                  // Trigger validation on blur to show error immediately
                  form.validateFields(['number_of_locations']).catch(() => {});
                }}
              />
            </Form.Item>

            <div className="flex justify-end gap-3 mt-8">
              <Button 
                onClick={onClose} 
                disabled={submitting}
                size="large"
                className="h-12 px-8 text-base font-semibold border-gray-300 hover:border-gray-400"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-0 shadow-lg hover:shadow-xl"
              >
                {isUpgrade ? 'Upgrade Now' : isDowngrade ? 'Downgrade Plan' : 'Confirm Change'}
              </Button>
            </div>
          </Form>
        </div>
      </Spin>
    </Modal>
  );
};

export default PlanSelectionModal;

