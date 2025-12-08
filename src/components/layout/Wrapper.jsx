import React, { useState } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';
import { ArrowUpOutlined, HomeOutlined, InfoCircleOutlined, QuestionCircleOutlined, SettingOutlined, UserOutlined, FileTextOutlined, BellOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import useStore from '../../store/store';
import { FaChartLine, FaPeopleCarry, FaStore } from 'react-icons/fa';
import { MdOutlineFoodBank } from 'react-icons/md';
import { SiActualbudget, SiExpensify } from 'react-icons/si';
import ImpersonationBanner from '../superadmin/components/ImpersonationBanner';
import { isImpersonating } from '../../utils/tokenManager';
import GuidanceOverlay from '../guidance/GuidanceOverlay';
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
  const isSuperAdmin = user?.is_superuser;
  const impersonating = isImpersonating();

  const userMenus = [
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
          label: 'Close Out Your Day(s)',
          onClick: () => navigate('/dashboard'),
        },
        {
          key: 'profit-loss',
          icon: <ArrowUpOutlined />,
          label: 'Your Budget Vs. Actual',
          onClick: () => navigate('/dashboard/profit-loss'),
        },
      ],
    },
    {
      key: 'onboarding',
      icon: <UserOutlined />,
      label: 'Your Setup',
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
    {
      key: 'leo-ai',
      icon: <FileTextOutlined />,
      label: 'LIO AI',
      children: [
        // {
        //   key: 'faq',
        //   icon: <FileTextOutlined />,
        //   label: 'FAQ',
        //   onClick: () => navigate('/dashboard/faq'),
        // },
        {
          key: 'chat',
          icon: <MessageOutlined />,
          label: 'Chat Assistant',
          onClick: () => navigate('/dashboard/chat'),
        }
      ],
    },
  ];
  

  // Show Admin menu only when user is admin, not superadmin
  // const adminMenu = (isAdmin && !isSuperAdmin) ? [
  //   {
  //     key: 'admin',
  //     icon: <SettingOutlined />,
  //     label: 'Admin',
  //     children: [
  //     //   {
  //     //     key: 'admin-users',
  //     //     icon: <UserOutlined />,
  //     //     label: 'Users',
  //     //     onClick: () => navigate('/admin/users'),
  //     //   },
  //     //   {
  //     //     key: 'admin-tooltips',
  //     //     icon: <InfoCircleOutlined />,
  //     //     label: 'Tooltips',
  //     //     onClick: () => navigate('/admin/tooltips'),
  //     //   },
  //       
  //     ],
  //   },
  // ] : [];

  const superAdminMenu = (isSuperAdmin && !impersonating) ? [
    {
      key: 'superadmin',
      icon: <SettingOutlined />,
      label: 'SuperAdmin',
      children: [
        {
          key: 'superadmin-dashboard',
          icon: <FaChartLine />,
          label: 'Dashboard',
          onClick: () => navigate('/superadmin/dashboard'),
        },
        {
          key: 'superadmin-users',
          icon: <UserOutlined />,
          label: 'User Support',
          onClick: () => navigate('/superadmin/users'),
        },
        {
          key: 'superadmin-user-management',
          icon: <UserOutlined />,
          label: 'User Management',
          onClick: () => navigate('/superadmin/user-management'),
        },
        {
          key: 'superadmin-tooltips',
          icon: <BellOutlined />,
          label: 'Tooltips',
          onClick: () => navigate('/superadmin/tooltips'),
        },
       
        {
          key: 'superadmin-guidance-popups',
          icon: <BellOutlined />,
          label: 'Guidance Popups',
          onClick: () => navigate('/superadmin/guidance-popups'),
        },
      ],
    },
    {
      key: 'leo-ai',
      icon: <FileTextOutlined />,
      label: 'Leo AI',
      children: [
        {
          key: 'superadmin-faq',
          icon: <FileTextOutlined />,
          label: 'FAQ',
          onClick: () => navigate('/superadmin/faq'),
        },
          {
          key: 'superadmin-chat',
          icon: <MessageOutlined />,
          label: 'Chat Assistant',
          onClick: () => navigate('/superadmin/superadmin-chat'),
        }
      ],
    },
  ] : [];

  const settingsMenu = [
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

  // Show user menus for non-superadmin users, or when superadmin is impersonating
  const showUserMenus = !isSuperAdmin || impersonating;
  const menuItems = [
    ...(showUserMenus ? userMenus : []),
    // ...adminMenu,
    ...superAdminMenu,
    ...settingsMenu,
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
            <ImpersonationBanner />
            {children}
            <GuidanceOverlay />
          </Content>
        </div>
      </div>
    </div>
  );
};

export default Wrapper;
