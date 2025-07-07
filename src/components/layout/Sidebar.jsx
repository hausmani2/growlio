import React, { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  HomeOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import 'antd/dist/reset.css';

const { Sider } = Layout;

/**
 * Sidebar component
 * @param {Array} menuItems - Array of menu item objects: [{ key, icon, label, onClick }]
 */
const Sidebar = ({ menuItems = [] }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Map pathname to menu key
  const pathKeyMap = {
    '/': 'home',
    '/settings': 'settings',
  };
  const selectedKey = pathKeyMap[location.pathname] || 'home';

  // Close sidebar on window resize if desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
        setCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-white rounded-full shadow p-2 text-xl"
        aria-label="Open sidebar"
        onClick={() => setMobileOpen(true)}
      >
        <MenuUnfoldOutlined />
      </button>
      {/* Sidebar Overlay for Mobile - only render on mobile and when open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity duration-300 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        className={`h-screen bg-white shadow-lg transition-transform duration-300 tw-sider ${mobileOpen ? 'fixed top-0 left-0 z-50 translate-x-0' : 'lg:static lg:translate-x-0'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:block`}
        width={220}
        style={{ minHeight: '100vh' }}
      >
        <div className="flex items-center justify-between p-4">
          <span className={`text-xl font-bold transition-all duration-300 ${collapsed ? 'hidden' : 'block'}`}>Growlio</span>
          {/* Close button for mobile */}
          <button
            className="text-lg focus:outline-none lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
          >
            <MenuFoldOutlined />
          </button>
          {/* Collapse/Expand button for desktop, always visible on lg+ */}
          <button
            className="text-lg focus:outline-none hidden lg:inline-flex items-center justify-center"
            aria-label="Toggle collapse"
            onClick={() => setCollapsed(!collapsed)}
            style={{ minWidth: 32 }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          className="border-none tw-menu"
        />
      </Sider>
    </>
  );
};

export default Sidebar; 