import React, { useEffect, useState } from 'react';
import { Card, Form, Select, Button, message, Typography, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import {
  fetchEmailNotificationPreferences,
  updateEmailNotificationPreferences,
} from '../../../services/notificationsApi';

const { Text } = Typography;

const FREQ_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'never', label: 'Never' },
];

const NotificationsTab = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const prefs = await fetchEmailNotificationPreferences();
        if (cancelled) return;
        form.setFieldsValue({
          close_day_reminder: prefs?.close_day_reminder || 'daily',
          previous_day_summary: prefs?.previous_day_summary || 'daily',
        });
      } catch (err) {
        if (!cancelled) {
          message.error(
            err?.response?.data?.error ||
              err?.message ||
              'Failed to load notification preferences'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form]);

  const handleSave = async (values) => {
    try {
      setSaving(true);
      const prefs = await updateEmailNotificationPreferences(values);
      form.setFieldsValue({
        close_day_reminder: prefs?.close_day_reminder || values.close_day_reminder,
        previous_day_summary:
          prefs?.previous_day_summary || values.previous_day_summary,
      });
      message.success('Notification preferences saved');
    } catch (err) {
      const detail = err?.response?.data?.error;
      message.error(
        typeof detail === 'string'
          ? detail
          : err?.message || 'Failed to save notification preferences'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-0 bg-gray-50">
        <div className="pb-3 border-b border-gray-200 mb-6">
          <h3 className="text-xl font-bold text-orange-600">Email Notifications</h3>
          <Text className="text-gray-600 block mt-2">
            Choose how often you want each email. Set a notification to Never to stop
            receiving it.
          </Text>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : (
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              label="Close Day Reminder"
              name="close_day_reminder"
              extra="Reminds you to enter today's close-out numbers when they are still missing."
              rules={[{ required: true, message: 'Select a frequency' }]}
            >
              <Select
                size="large"
                options={FREQ_OPTIONS}
                style={{ maxWidth: 280 }}
              />
            </Form.Item>

            <Form.Item
              label="Previous Day Summary"
              name="previous_day_summary"
              extra="Emails a snapshot of yesterday's sales, labor, food cost, and profit."
              rules={[{ required: true, message: 'Select a frequency' }]}
            >
              <Select
                size="large"
                options={FREQ_OPTIONS}
                style={{ maxWidth: 280 }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
                size="large"
                className="bg-orange-500 hover:bg-orange-600 border-0"
              >
                Save Preferences
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default NotificationsTab;
