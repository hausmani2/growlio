import React, { useState } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import { ArrowUpOutlined, HomeOutlined, InfoCircleOutlined, QuestionCircleOutlined, SettingOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import useStore from '../../store/store';
import { FaChartLine, FaPeopleCarry, FaStore } from 'react-icons/fa';
import { MdOutlineFoodBank } from 'react-icons/md';
import { SiActualbudget, SiExpensify } from 'react-icons/si';
const { Content } = Layout;

/**
 * Wrapper component
 * @param {boolean} showSidebar - Whether to show the sidebar
 * @param {React.ReactNode} children - Main content
 */
const Wrapper = ({ showSidebar = false, children, className }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = useStore((state) => state.user);
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN' || user?.is_staff;

  const menuItems = [
    {
      key: 'dashboard-summary',
      icon: <FaChartLine />,
      label: 'Dashboard',
      children: [
        {
          key: 'budget',
          icon: <SiActualbudget />,
          label: 'Budget',
          onClick: () => navigate('/dashboard/budget'),
        },
        {
          key: 'dashboard',
          icon: <HomeOutlined />,
          label: 'Enter Weekly Data',
          onClick: () => navigate('/dashboard'),
        },
        {
          key: 'profit-loss',
          icon: <ArrowUpOutlined />,
          label: 'Budget vs Actual Sales',
          onClick: () => navigate('/dashboard/profit-loss'),
        },
 
      ],
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
          key: 'sales-channels',
          icon: <FaStore  />,
          label: 'Sales Channels',
          onClick: () => navigate('/dashboard/sales-channels'),
        },
        {
          key: 'labor-information',
          icon: <FaPeopleCarry/>,
          label: 'Labor Information',
          onClick: () => navigate('/dashboard/labor-information'),
        },
        {
          key: 'food-cost-details',
          icon: <MdOutlineFoodBank  />,
          label: 'Food Cost Details',
          onClick: () => navigate('/dashboard/food-cost-details'),
        },
        {
          key: 'expense',
          icon: <SiExpensify  />,
          label: 'Expenses',
          onClick: () => navigate('/dashboard/expense'),
        },
      ],
    },
    {
      key: 'support',
      icon: <QuestionCircleOutlined />,
      label: 'Support',
      onClick: () => navigate('/dashboard/support'),
    },
  
    
    ...(isAdmin ? [
      {
        key: 'admin',
        icon: <SettingOutlined />,
        label: 'Admin',
        children: [
          {
            key: 'admin-users',
            icon: <UserOutlined />,
            label: 'Users',
            onClick: () => navigate('/admin/users'),
          },
          {
            key: 'admin-tooltips',
            icon: <InfoCircleOutlined />,
            label: 'Tooltips',
            onClick: () => navigate('/admin/tooltips'),
          },
          {
            key: 'faq',
            icon: <FileTextOutlined />,
            label: 'FAQ',
            onClick: () => navigate('/dashboard/faq'),
          },
        ],
      },
    ] : []),
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      children: [
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Profile',
          onClick: () => navigate('/dashboard/profile'),
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
