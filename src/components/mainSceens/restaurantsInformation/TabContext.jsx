import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RestaurantWrapper from './steps/basicInformation/RestaurantWrapper';
import FoodCostWrapper from './steps/foodCostDetails/FoodCostWrapper';
import LaborInformationWrapper from './steps/laborInformation/LaborInformationWrapper';
import { TabContext } from './context/TabContext';
import SalesChannelsWrapper from './steps/salesChannels/SalesChannelsWrapper';
import ExpenseWrapper from './steps/Expense/ExpenseWrapper';

export const TabProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, title: 'Basic Information', path: 'basic-information' },
        { id: 1, title: 'Labour Information', path: 'labour-information' },
        { id: 2, title: 'Food Cost Details', path: 'food-cost-details' },
        { id: 3, title: 'Sales Channels', path: 'sales-channels' },
        { id: 4, title: 'Expense', path: 'expense' },
    ];

    // Map URL paths to tab IDs
    const pathToTabId = {
        'basic-information': 0,
        'labour-information': 1,
        'food-cost-details': 2,
        'sales-channels': 3,
        'expense': 4,
    };

    // Update active tab based on URL
    useEffect(() => {
        const pathname = location.pathname;
        const pathSegments = pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        
        if (pathToTabId[lastSegment] !== undefined) {
            setActiveTab(pathToTabId[lastSegment]);
        } else if (pathname.includes('/create-restaurant-info')) {
            // Default to basic information if no specific tab in URL
            setActiveTab(0);
            navigate('/create-restaurant-info/basic-information', { replace: true });
        }
    }, [location.pathname, navigate]);

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            navigate(`/create-restaurant-info/${tab.path}`);
        }
    };

    // Render different content based on active tab
    const renderActiveContent = () => {
        switch (activeTab) {
            case 0:
                return <RestaurantWrapper />;
            case 1:
                return <LaborInformationWrapper />;
            case 2:
                return <FoodCostWrapper />;
            case 3:
                return <SalesChannelsWrapper />;
            case 4:
                return <ExpenseWrapper />;
            default:
                return <RestaurantWrapper />;
        }
    };

    const value = {
        activeTab,
        tabs,
        handleTabClick,
        renderActiveContent
    };

    return (
        <TabContext.Provider value={value}>
            {children}
        </TabContext.Provider>
    );
}; 