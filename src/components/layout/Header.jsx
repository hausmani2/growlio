import React from 'react';
import logo from '../../assets/logo.png';
import useStore from '../../store/store';
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';

const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '';
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
};

const menu = (
  <Menu>
    <Menu.Item key="1">Profile</Menu.Item>
    <Menu.Item key="2">Logout</Menu.Item>
  </Menu>
);

const Header = () => {
    const user = useStore((state) => state.user);
    const name = user?.name || 'Haris james';
    // const image = user?.image; // If you add image support later
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