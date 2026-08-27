import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Drawer, Empty, Spin, Tag, message } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationsApi';

const severityColor = (severity) => {
  const value = String(severity || '').toLowerCase();
  if (value === 'critical') return 'red';
  if (value === 'info') return 'blue';
  return 'orange';
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications({ limit: 40 });
      setItems(data?.notifications || []);
      setUnreadCount(Number(data?.unread_count || 0));
    } catch {
      // silent — header shouldn't break
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, [load]);

  // Allow other parts of the app to refresh after close-out
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('lio-notifications-refresh', handler);
    return () => window.removeEventListener('lio-notifications-refresh', handler);
  }, [load]);

  const handleOpen = () => {
    setOpen(true);
    load();
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      message.error('Could not mark notification as read');
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      message.success('All notifications marked as read');
    } catch {
      message.error('Could not mark all as read');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-orange-50 text-[#FF8132] transition-colors"
        aria-label="LIO notifications"
      >
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <BellOutlined className="text-xl" />
        </Badge>
      </button>

      <Drawer
        title={
          <div className="flex items-center justify-between gap-3 pr-2">
            <span>LIO Notifications</span>
            {unreadCount > 0 ? (
              <Button size="small" icon={<CheckOutlined />} onClick={handleMarkAll}>
                Mark all read
              </Button>
            ) : null}
          </div>
        }
        open={open}
        onClose={() => setOpen(false)}
        width={400}
      >
        {loading && items.length === 0 ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications yet. LIO will alert you after close-out if labor, COGS, rent, or operating expenses are off track."
          />
        ) : null}

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-3 ${
                item.is_read
                  ? 'border-gray-100 bg-white'
                  : 'border-orange-100 bg-orange-50/70'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Tag color={severityColor(item.severity)}>{item.severity}</Tag>
                <Tag>{item.category}</Tag>
                {item.day_date ? (
                  <span className="text-xs text-gray-500">
                    {dayjs(item.day_date).format('MMM D, YYYY')}
                  </span>
                ) : null}
              </div>
              <p className="font-semibold text-gray-900 m-0 mb-1">{item.title}</p>
              <p className="text-sm text-gray-700 m-0 mb-2">{item.message}</p>
              {item.action_hint ? (
                <p className="text-sm text-[#EB5B00] m-0 mb-2">
                  <span className="font-medium">Next step: </span>
                  {item.action_hint}
                </p>
              ) : null}
              {!item.is_read ? (
                <Button size="small" type="link" className="!px-0" onClick={() => handleMarkRead(item.id)}>
                  Mark as read
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </Drawer>
    </>
  );
};

export default NotificationBell;
