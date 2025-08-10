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
            const result = await loadExistingOnboardingData();
            
            // If no data found, that's okay - just show empty state
            if (!result.success && result.message.includes('No onboarding data found')) {
                console.log('ℹ️ No onboarding data available - showing empty state');
                setError(null);
            }
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

    // Check if we have any data
    const hasData = restaurantData.restaurant_name || 
                   laborData.goal || 
                   foodCostData.cogs_goal || 
                   Object.values(salesChannelsData).some(Boolean) || 
                   (expenseData.fixed_costs && expenseData.fixed_costs.length > 0) ||
                   (expenseData.variable_costs && expenseData.variable_costs.length > 0);

    // If no data available, show empty state
    if (!hasData) {
        return (
            <Card className="shadow-sm border border-gray-200 rounded-xl">
                <div className="text-center p-6">
                    <ShopOutlined className="text-4xl text-gray-400 mb-4" />
                    <Title level={4} className="text-gray-600 mb-2">No Restaurant Data Available</Title>
                    <Text className="text-gray-500 mb-4 block">
                        Complete your onboarding to see restaurant information here.
                    </Text>
                    <Button 
                        type="primary" 
                        icon={<EditOutlined />}
                        onClick={fetchRestaurantData}
                    >
                        Refresh Data
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm border border-gray-200 rounded-xl">
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <Title level={4} className="mb-0">
                        <ShopOutlined className="mr-2" />
                        Restaurant Information
                    </Title>
                    <Button 
                        type="text" 
                        icon={<EditOutlined />}
                        onClick={fetchRestaurantData}
                        size="small"
                    >
                        Refresh
                    </Button>
                </div>
                
                <Row gutter={[16, 16]}>
                    {/* Basic Information */}
                    {restaurantData.restaurant_name && (
                        <Col xs={24} sm={12} md={8}>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <Text strong className="block mb-1">Restaurant Name</Text>
                                <Text>{restaurantData.restaurant_name}</Text>
                            </div>
                        </Col>
                    )}
                    
                    {/* Labor Information */}
                    {laborData.goal && (
                        <Col xs={24} sm={12} md={8}>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <Text strong className="block mb-1">Labor Goal</Text>
                                <Text>{laborData.goal}%</Text>
                            </div>
                        </Col>
                    )}
                    
                    {/* Food Cost Information */}
                    {foodCostData.cogs_goal && (
                        <Col xs={24} sm={12} md={8}>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <Text strong className="block mb-1">COGS Goal</Text>
                                <Text>{foodCostData.cogs_goal}%</Text>
                            </div>
                        </Col>
                    )}
                </Row>
            </div>
        </Card>
    );
};

export default RestaurantInfoCard; 