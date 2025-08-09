import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Tag, Spin, Alert, Button, Space } from 'antd';
import { 
    ShopOutlined, 
    EnvironmentOutlined, 
    TeamOutlined, 
    DollarOutlined,
    EditOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import useStore from '../../../store/store';

const { Title, Text } = Typography;

const RestaurantInfoCard = () => {
    const { loadExistingOnboardingData, completeOnboardingData } = useStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRestaurantData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            await loadExistingOnboardingData();
        } catch (error) {
            console.error('❌ Error fetching restaurant data:', error);
            setError('Failed to load restaurant data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurantData();
    }, []);

    if (loading) {
        return (
            <Card className="shadow-sm border border-gray-200 rounded-xl">
                <div className="flex justify-center items-center h-24 sm:h-32 p-6">
                    <Spin size="large" />
                    <Text className="ml-3 text-sm sm:text-base text-gray-600">Loading restaurant information...</Text>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="shadow-sm border border-gray-200 rounded-xl">
                <Alert
                    message="Error Loading Restaurant Data"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button 
                            size="small" 
                            icon={<ReloadOutlined />}
                            onClick={fetchRestaurantData}
                            className="mt-2 sm:mt-0"
                        >
                            Retry
                        </Button>
                    }
                />
            </Card>
        );
    }

    // Get restaurant data from onboarding
    const restaurantData = completeOnboardingData?.['Basic Information']?.data || {};
    const laborData = completeOnboardingData?.['Labour Information']?.data || {};
    const foodCostData = completeOnboardingData?.['Food Cost Details']?.data || {};
    const salesChannelsData = completeOnboardingData?.['Sales Channels']?.data || {};
    const expenseData = completeOnboardingData?.['Expense']?.data || {};

    return 
};

export default RestaurantInfoCard; 