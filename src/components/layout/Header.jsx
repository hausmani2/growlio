import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GrowlioLogo from '../common/GrowlioLogo';
import useStore from '../../store/store';
import { DownOutlined, MenuOutlined } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';
import growlioLogo from "../../assets/svgs/growlio-logo.png"

const getInitials = (name = '') => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '';
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
};

const Header = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = useStore((state) => state.user);
    const logout = useStore((state) => state.logout);
    // Get simulation status from store (use cached data)
    const restaurantSimulationData = useStore((state) => state.restaurantSimulationData);
    const simulationOnboardingStatus = useStore((state) => state.simulationOnboardingStatus);
    const restaurantOnboardingData = useStore((state) => state.restaurantOnboardingData);
    const getRestaurantSimulation = useStore((state) => state.getRestaurantSimulation);
    const getSimulationOnboardingStatus = useStore((state) => state.getSimulationOnboardingStatus);
    
    const [isSimulationMode, setIsSimulationMode] = useState(false);
    
    // Check if user is in simulation mode - use cached data from store first
    // CRITICAL: Must verify BOTH restaurant_simulation flag AND that user has simulation restaurants
    useEffect(() => {
        const checkSimulationMode = async () => {
            try {
                let isSimulator = false;
                
                // CRITICAL: Check current route first - if on regular dashboard routes, don't show simulation mode
                const isOnSimulationRoute = location.pathname.startsWith('/simulation') || location.pathname.startsWith('/onboarding/simulation');
                const isOnRegularRoute = location.pathname.startsWith('/dashboard') && !isOnSimulationRoute;
                
                // If on regular dashboard route, verify user is NOT in simulation mode
                if (isOnRegularRoute) {
                    // If user has regular restaurants, they're definitely not in simulation mode
                    if (restaurantOnboardingData?.restaurants && Array.isArray(restaurantOnboardingData.restaurants) && restaurantOnboardingData.restaurants.length > 0) {
                        setIsSimulationMode(false);
                        return;
                    }
                    
                    // If restaurant_simulation is explicitly false, not in simulation mode
                    if (restaurantSimulationData && restaurantSimulationData.restaurant_simulation === false) {
                        setIsSimulationMode(false);
                        return;
                    }
                }
                
                // First, try to use cached data from store
                let simulationData = null;
                if (restaurantSimulationData) {
                    simulationData = restaurantSimulationData;
                } else {
                    // If no cached data, make API call
                    const simulationResult = await getRestaurantSimulation();
                    if (simulationResult?.success && simulationResult?.data) {
                        simulationData = simulationResult.data;
                    }
                }
                
                // CRITICAL: Check restaurant_simulation flag - must be explicitly true
                if (simulationData && simulationData.restaurant_simulation === true) {
                    // Additional validation: Check if user actually has simulation restaurants
                    let hasSimulationRestaurants = false;
                    
                    // Check cached simulation onboarding status
                    if (simulationOnboardingStatus && simulationOnboardingStatus.restaurants) {
                        hasSimulationRestaurants = Array.isArray(simulationOnboardingStatus.restaurants) && 
                                                  simulationOnboardingStatus.restaurants.length > 0;
                    } else {
                        // If no cached data, make API call to verify
                        try {
                            const onboardingResult = await getSimulationOnboardingStatus();
                            if (onboardingResult?.success && onboardingResult?.data?.restaurants) {
                                hasSimulationRestaurants = Array.isArray(onboardingResult.data.restaurants) && 
                                                          onboardingResult.data.restaurants.length > 0;
                            }
                        } catch (error) {
                            console.warn('⚠️ [Header] Could not verify simulation restaurants:', error);
                            // If API fails, only trust the flag if we're on a simulation route
                            hasSimulationRestaurants = isOnSimulationRoute;
                        }
                    }
                    
                    // Only set simulation mode if BOTH conditions are met:
                    // 1. restaurant_simulation === true
                    // 2. User has simulation restaurants OR is on simulation route
                    isSimulator = hasSimulationRestaurants || isOnSimulationRoute;
                } else {
                    // If restaurant_simulation is false, null, or undefined, definitely not a simulator
                    isSimulator = false;
                }
                
                // If user is a simulator, set simulation mode
                // This is independent of onboarding completion status
                setIsSimulationMode(isSimulator);
                
                // Cache the result in sessionStorage for quick access
                sessionStorage.setItem('headerSimulationMode', isSimulator.toString());
                sessionStorage.setItem('headerSimulationModeLastCheck', Date.now().toString());
            } catch (error) {
                console.error('❌ [Header] Error checking simulation mode:', error);
                // On error, default to false (regular user)
                setIsSimulationMode(false);
            }
        };
        
        checkSimulationMode();
    }, [restaurantSimulationData, simulationOnboardingStatus, restaurantOnboardingData, getRestaurantSimulation, getSimulationOnboardingStatus, location.pathname]); // Added dependencies
    
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
        // logout() function now handles redirect internally
    };

    const menuItems = [
        
            ...(isSimulationMode ? [] : [{
            key: '1',
            label: (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Profile</span>
                </div>
            ),
            onClick: () => navigate('/dashboard/profile'),
            className: 'hover:bg-gray-50'
        }]),
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
                    <img src={growlioLogo} alt="Growlio Logo" className="w-32 mx-auto" />
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