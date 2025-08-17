import React from 'react';
import { useNavigate } from 'react-router-dom';
import GrowlioLogo from '../common/GrowlioLogo';
import useStore from '../../store/store';
import { DownOutlined, MenuOutlined } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';

const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '';
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
};

const Header = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const user = useStore((state) => state.user);
    const logout = useStore((state) => state.logout);
    
    // Format name with first letter capitalized
    const formatName = (fullName) => {
        if (!fullName) return 'User';
        return fullName.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };
    
    const name = formatName(user?.full_name);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        {
            key: '1',
            label: (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Profile</span>
                </div>
            ),
            onClick: () => navigate('/profile'),
            className: 'hover:bg-gray-50'
        },
        {
            key: '2',
            label: (
                <div className="flex items-center gap-2 text-red-600">
                    <span className="text-sm font-medium">Logout</span>
                </div>
            ),
            onClick: handleLogout,
            className: 'hover:bg-gray-50'
        }
    ];

    return (
        <header className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-white border-b border-gray-200 shadow-sm">
            {/* Left side - Hamburger menu and logo */}
            <div className="flex items-center gap-4">
                {/* Hamburger Menu Button - Only visible on mobile */}
                <button
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    aria-label="Open sidebar"
                    onClick={onMenuClick}
                >
                    <MenuOutlined className="text-xl text-gray-700" />
                </button>
                
                {/* Logo */}
                <div className="flex items-center">
                    <GrowlioLogo 
                        width={96} 
                        height={32} 
                        className="h-8 sm:h-10 w-auto"
                    />
                </div>
            </div>

            {/* Right side - User Info */}
            <div className="flex items-center gap-3">
                {/* Avatar with initials */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 border-orange-300 bg-orange-100 text-orange-700 font-bold text-sm sm:text-base shadow-sm">
                    {getInitials(name)}
                </div>
                
                {/* Name and dropdown */}
                <Dropdown 
                    menu={{ 
                        items: menuItems,
                        className: "min-w-[200px] shadow-lg border border-gray-200 rounded-lg"
                    }} 
                    trigger={['click']} 
                    placement="bottomRight"
                >
                    <div className="flex items-center cursor-pointer select-none group">
                        <span className="font-semibold text-sm sm:text-base text-gray-800 mr-2 hidden sm:block group-hover:text-orange-600 transition-colors">
                            {name}
                        </span>
                        <DownOutlined className="text-xs sm:text-sm text-gray-500 group-hover:text-orange-600 transition-colors" />
                    </div>
                </Dropdown>
            </div>
        </header>
    );
};

export default Header;