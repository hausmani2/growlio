import React from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import { HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Content } = Layout;

/**
 * Wrapper component
 * @param {boolean} showSidebar - Whether to show the sidebar
 * @param {React.ReactNode} children - Main content
 */
const Wrapper = ({ showSidebar = false, children, className }) => {
  const navigate = useNavigate();
  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: 'Home',
      onClick: () => navigate('/'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <Layout className="min-h-screen">
      {showSidebar && <Sidebar menuItems={menuItems} />}
      <Layout>
        <Content className={`p-6 bg-gray-50 min-h-screen w-full ${className}`}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Wrapper;
