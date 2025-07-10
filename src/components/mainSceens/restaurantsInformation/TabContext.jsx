import { useState } from 'react';
import RestaurantWrapper from './steps/basicInformation/RestaurantWrapper';
import FoodCostWrapper from './steps/foodCostDetails/FoodCostWrapper';
import LaborInformationWrapper from './steps/laborInformation/LaborInformationWrapper';
import { TabContext } from './context/TabContext';
import SalesChannelsWrapper from './steps/salesChannels/SalesChannelsWrapper';

export const TabProvider = ({ children }) => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, title: 'Basic Information' },
        { id: 1, title: 'Labour Information' },
        { id: 2, title: 'Food Cost Details' },
        { id: 3, title: 'Sales Channels' }
    ];

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
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