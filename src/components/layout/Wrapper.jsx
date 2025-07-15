import React from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import { HomeOutlined, InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { FaPeopleCarry, FaStore } from 'react-icons/fa';
import { MdOutlineFoodBank } from 'react-icons/md';
import { SiExpensify } from 'react-icons/si';
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
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'basic-information',
      icon: <InfoCircleOutlined />,
      label: 'Basic Information',
      onClick: () => navigate('/basic-information'),
    },
    {
      key: 'labour-information',
      icon: <FaPeopleCarry/>,
      label: 'Labour Information',
      onClick: () => navigate('/labour-information'),
    },
    {
      key: 'food-cost-details',
      icon: <MdOutlineFoodBank  />,
      label: 'Food Cost Details',
      onClick: () => navigate('/food-cost-details'),
    },
    {
      key: 'sales-channels',
      icon: <FaStore  />,
      label: 'Sales Channels',
      onClick: () => navigate('/sales-channels'),
    },
    {
      key: 'expense',
      icon: <SiExpensify  />,
      label: 'Expense',
      onClick: () => navigate('/expense'),
    },
  ];

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-shrink-0">
        <Header />
        <div className='border-t border-gray-200'></div>
      </div>
      <div className="flex-1 flex flex-row min-h-0">
        {showSidebar && (
          <div className="flex-shrink-0 h-full">
            <Sidebar menuItems={menuItems} />
          </div>
        )}
        <div className={`flex-1 min-h-0 overflow-auto`}>
          <Content className={`p-6 bg-gray-50 w-full ${className}`}>
            {children}
          </Content>
        </div>
      </div>
    </div>
  );
};

export default Wrapper;
