import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import useStore from '../../store/store';
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';

const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '';
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
};

const Header = () => {
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
    // const image = user?.image; // If you add image support later

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menu = (
        <Menu>
            <Menu.Item key="1">Profile</Menu.Item>
            <Menu.Item key="2" onClick={handleLogout}>Logout</Menu.Item>
        </Menu>
    );

    return (
        <div className='flex items-center justify-between w-full p-4 bg-white'>
            <img src={logo} alt="logo" />
            <div className='flex items-center gap-2'>
                {/* Avatar with initials */}
                <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center border border-orange-400 bg-orange-300 text-orange-800 font-bold text-base">
                  {getInitials(name)}
                </div>
                {/* Name and dropdown */}
                <Dropdown overlay={menu} trigger={['click']}>
                  <div className="flex items-center cursor-pointer select-none">
                    <span className="font-semibold text-base mr-2">{name}</span>
                    <DownOutlined />
                  </div>
                </Dropdown>
            </div>
        </div>
    );
};

export default Header;