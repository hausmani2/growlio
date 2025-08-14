import React, { useState } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import { HomeOutlined, InfoCircleOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { FaChartLine, FaPeopleCarry, FaStore } from 'react-icons/fa';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      key: 'dashboard-summary',
      icon: <FaChartLine />,
      label: 'Dashboard',
      children: [
        {
          key: 'budget',
          icon: <FaChartLine />,
          label: 'Budget',
          onClick: () => navigate('/dashboard/budget'),
        },
        {
          key: 'profit-loss',
          icon: <FaChartLine />,
          label: 'Profit & Loss',
          onClick: () => navigate('/dashboard/profit-loss'),
        },
      ],
    },
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: 'Enter Weekly Data',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'onboarding',
      icon: <UserOutlined />,
      label: 'Onboarding',
      children: [
        {
          key: 'basic-information',
          icon: <InfoCircleOutlined />,
          label: 'Basic Information',
          onClick: () => navigate('/dashboard/basic-information'),
        },
        {
          key: 'labour-information',
          icon: <FaPeopleCarry/>,
          label: 'Labour Information',
          onClick: () => navigate('/dashboard/labour-information'),
        },
        {
          key: 'food-cost-details',
          icon: <MdOutlineFoodBank  />,
          label: 'Food Cost Details',
          onClick: () => navigate('/dashboard/food-cost-details'),
        },
        {
          key: 'sales-channels',
          icon: <FaStore  />,
          label: 'Sales Channels',
          onClick: () => navigate('/dashboard/sales-channels'),
        },
        {
          key: 'expense',
          icon: <SiExpensify  />,
          label: 'Expense',
          onClick: () => navigate('/dashboard/expense'),
        },
      ],
    },
  ];

  const handleMenuClick = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuToggle = (isOpen) => {
    setMobileMenuOpen(isOpen);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-shrink-0">
        <Header onMenuClick={handleMenuClick} />
        <div className='border-t border-gray-200'></div>
      </div>
      <div className="flex-1 flex flex-row min-h-0">
        {showSidebar && (
          <div className="flex-shrink-0 h-full">
            <Sidebar 
              menuItems={menuItems} 
              mobileMenuOpen={mobileMenuOpen}
              onMobileMenuToggle={handleMobileMenuToggle}
            />
          </div>
        )}
        <div className={`flex-1 min-h-0 overflow-auto`}>
          <Content className={`px-2 sm:px-4 py-2 sm:py-1 bg-gray-100 w-full ${className}`}>
            {children}
          </Content>
        </div>
      </div>
    </div>
  );
};

export default Wrapper;
