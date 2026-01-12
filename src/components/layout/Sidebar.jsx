import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MenuOutlined, CloseOutlined, DownOutlined } from '@ant-design/icons';
import { FaArrowLeftLong } from 'react-icons/fa6';

/**
 * Sidebar component
 * @param {Array} menuItems - Array of menu item objects: [{ key, icon, label, onClick, children }]
 * @param {boolean} mobileMenuOpen - Mobile menu state from parent
 * @param {function} onMobileMenuToggle - Function to toggle mobile menu
 */
const Sidebar = ({ menuItems = [], mobileMenuOpen = false, onMobileMenuToggle }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const location = useLocation();

  // Map pathname to menu key
  const pathKeyMap = {
    '/dashboard/report-card': 'report-card',
    '/dashboard/budget': 'budget',
    '/dashboard/profit-loss': 'profit-loss',
    '/dashboard': 'dashboard',
    '/dashboard/onboarding': 'onboarding',
    '/dashboard/basic-information': 'basic-information',
    '/dashboard/sales-channels': 'sales-channels',
    '/dashboard/third-party-delivery': 'third-party-delivery',
    '/dashboard/sales-data': 'sales-data',
    '/dashboard/labor-data': 'labor-data',
    '/dashboard/labor-information': 'labor-information',
    '/dashboard/food-cost-details': 'food-cost-details',
    '/dashboard/expense': 'expense',
    '/dashboard/support': 'support',
    '/dashboard/plans': 'plans',
    '/dashboard/square': 'square',
    '/dashboard/profile': 'profile',
    '/dashboard/faq': 'faq',
    '/dashboard/chat': 'chat',
    '/admin/users': 'admin-users',
    '/admin/tooltips': 'admin-tooltips',
    '/superadmin/dashboard': 'superadmin-dashboard',
    '/superadmin/users': 'superadmin-users',
    '/superadmin/user-management': 'superadmin-user-management',
    '/superadmin/user-info': 'superadmin-user-info',
    '/superadmin/tooltips': 'superadmin-tooltips',
    '/superadmin/faq': 'superadmin-faq',
    '/superadmin/superadmin-chat': 'superadmin-chat',
    '/superadmin/guidance-popups': 'superadmin-guidance-popups',
  };
  
  // Determine selected key based on current path
  let selectedKey = pathKeyMap[location.pathname] || 'dashboard';
  
  // If we're on a dashboard sub-page, also mark the parent as selected
  if (location.pathname === '/dashboard/budget' || location.pathname === '/dashboard/profit-loss') {
    // For dashboard sub-pages, we want to show the parent as expanded and the child as selected
    selectedKey = pathKeyMap[location.pathname];
  }

  // Close sidebar on window resize if desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        if (onMobileMenuToggle) {
          onMobileMenuToggle(false);
        }
        setCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onMobileMenuToggle]);

  // Auto-expand parent menu items when child is selected
  useEffect(() => {
    const newExpandedItems = new Set(expandedItems);
    
    // Find parent items that should be expanded based on current selection
    menuItems.forEach(item => {
      if (item.children && item.children.some(child => selectedKey === child.key)) {
        newExpandedItems.add(item.key);
      }
    });
    
    if (newExpandedItems.size !== expandedItems.size) {
      setExpandedItems(newExpandedItems);
    }
  }, [selectedKey, menuItems]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.sidebar-container') && !event.target.closest('.hamburger-button')) {
        if (onMobileMenuToggle) {
          onMobileMenuToggle(false);
        }
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen, onMobileMenuToggle]);

  const handleMenuItemClick = (item) => {
    if (item.children) {
      // Toggle expanded state for items with children
      const newExpandedItems = new Set(expandedItems);
      if (newExpandedItems.has(item.key)) {
        newExpandedItems.delete(item.key);
      } else {
        newExpandedItems.add(item.key);
      }
      setExpandedItems(newExpandedItems);
    } else if (item.onClick) {
      item.onClick();
      // Close mobile sidebar when item is clicked
      if (mobileMenuOpen && onMobileMenuToggle) {
        onMobileMenuToggle(false);
      }
    }
  };

  const renderMenuItem = (item, level = 0) => {
    const isSelected = selectedKey === item.key;
    const hasChildren = item.children && item.children.length > 0;
    
    // Auto-expand parent if any child is selected
    const shouldAutoExpand = hasChildren && item.children.some(child => selectedKey === child.key);
    const isExpanded = expandedItems.has(item.key) || shouldAutoExpand;

    return (
      <div key={item.key} className="relative">
        <button
          onClick={() => handleMenuItemClick(item)}
          data-guidance={`sidebar_${item.key}`}
          className={`w-full flex items-center px-2 py-2 text-left transition-all duration-200 group ${
            isSelected
              ? 'bg-orange-50 border-r-2 border-orange-500 text-orange-700'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          } ${collapsed ? 'lg:justify-center lg:px-2' : ''} ${level > 0 ? (item.icon ? 'pl-5' : 'pl-4') : ''}`}
        >
          {item.icon && (
            <span className={`mr-3 text-lg ${isSelected ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'} ${collapsed ? 'lg:mr-0' : ''}`}>
              {item.icon}
            </span>
          )}
          <span className={`font-medium flex-1 ${collapsed ? 'lg:hidden' : ''} ${!item.icon && level > 0 ? 'text-sm' : ''}`}>
            {item.label}
          </span>
          {hasChildren && !collapsed && (
            <DownOutlined 
              className={`ml-auto text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          )}
        </button>
        
        {/* Render children if expanded (when not collapsed) or expanded (when collapsed) */}
        {hasChildren && (
          <>
            {/* Show children when expanded and not collapsed */}
            {isExpanded && !collapsed && (
              <div className="bg-gray-50">
                {item.children.map((child) => renderMenuItem(child, level + 1))}
              </div>
            )}
            
            {/* Show children when expanded and collapsed - show below the parent */}
            {collapsed && isExpanded && (
              <div className="bg-gray-50 border-l-2 border-gray-200 ml-4 mt-1 space-y-1">
                {item.children.map((child) => (
                  <div key={child.key} className="relative">
                    <button
                      onClick={() => child.onClick && child.onClick()}
                      data-guidance={`sidebar_${child.key}`}
                      className={`w-full flex items-center justify-center px-2 py-2 text-left transition-all duration-200 group rounded ${
                        selectedKey === child.key
                          ? 'bg-orange-50 text-orange-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {child.icon && (
                        <span className={`text-lg ${selectedKey === child.key ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'}`}>
                          {child.icon}
                        </span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar Overlay for Mobile - Improved backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300 lg:hidden backdrop-blur-sm"
          onClick={() => onMobileMenuToggle && onMobileMenuToggle(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Sidebar - Improved mobile styling and animations */}
      <div
        className={`sidebar-container fixed lg:static top-0 left-0 h-full w-80 lg:w-64 bg-white shadow-2xl transition-all duration-300 ease-in-out z-50 lg:z-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:!w-16' : 'lg:!w-64'} border-r border-gray-200`}
      >
        {/* Header - Improved styling */}
        <div className="flex items-center justify-between p-3 px-6 border-b border-gray-100 bg-white h-[60px]">
          <span className={`text-lg font-semibold text-gray-800 transition-all duration-300 ${collapsed ? 'lg:hidden' : 'block'}`}>
            GROWLIO
          </span>
          {/* Close button for mobile - Improved styling */}
          <button
            className="text-xl focus:outline-none lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            aria-label="Close sidebar"
            onClick={() => onMobileMenuToggle && onMobileMenuToggle(false)}
          >
            <CloseOutlined className="text-gray-600" />
          </button>
          {/* Collapse/Expand button for desktop */}
          <button
            className="text-lg focus:outline-none hidden lg:inline-flex items-center justify-center p-2 lg:p-0 rounded-lg hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            aria-label="Toggle collapse"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuOutlined /> : <FaArrowLeftLong  />}
          </button>
        </div>

        {/* Menu Content - Improved scrolling and spacing */}
        <div className="flex-1 flex flex-col h-[calc(90vh-100px)] overflow-hidden">
          <div className="flex-1 overflow-y-auto py-3 thin-scrollbar">
            <nav className="space-y-1 px-2">
              {/* Main menu items */}
              {menuItems.slice(0, -1).map((item) => renderMenuItem(item))}
            </nav>
          </div>
          
          {/* Settings section at the bottom */}
          <div className="border-t border-gray-200 pt-4 px-2 bg-gray-50">
            <div className={`px-2 mb-2 ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Settings</span>
            </div>
            <nav className="space-y-1">
              {menuItems.slice(-1).map((item) => renderMenuItem(item))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 