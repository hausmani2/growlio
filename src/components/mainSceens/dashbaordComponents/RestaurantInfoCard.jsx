import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Tag, Spin, Alert, Button } from 'antd';
import { 
    ShopOutlined, 
    EnvironmentOutlined, 
    TeamOutlined, 
    DollarOutlined,
    EditOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
// import { apiGet } from '../../../utils/axiosInterceptors';
import useStore from '../../../store/store';

const { Title, Text } = Typography;

const RestaurantInfoCard = () => {
    const navigate = useNavigate();
    const { completeOnboardingData, loadExistingOnboardingData } = useStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRestaurantData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('🔄 Fetching restaurant data...');
            
            await loadExistingOnboardingData();
            console.log('📥 Restaurant data loaded successfully');
            
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

    const getBasicInfo = () => {
        if (!completeOnboardingData || !completeOnboardingData["Basic Information"]?.data) {
            return null;
        }
        return completeOnboardingData["Basic Information"].data;
    };

    const getLaborInfo = () => {
        if (!completeOnboardingData || !completeOnboardingData["Labour Information"]?.data) {
            return null;
        }
        return completeOnboardingData["Labour Information"].data;
    };

    const getSalesInfo = () => {
        if (!completeOnboardingData || !completeOnboardingData["Sales Channels"]?.data) {
            return null;
        }
        return completeOnboardingData["Sales Channels"].data;
    };

    const getCompletionStatus = () => {
        if (!completeOnboardingData) return { completed: 0, total: 5, percentage: 0 };
        
        const steps = [
            "Basic Information",
            "Labour Information", 
            "Food Cost Details",
            "Sales Channels",
            "Expense"
        ];
        
        const completed = steps.filter(step => 
            completeOnboardingData[step]?.status === true
        ).length;
        
        return {
            completed,
            total: steps.length,
            percentage: Math.round((completed / steps.length) * 100)
        };
    };

    const basicInfo = getBasicInfo();
    const laborInfo = getLaborInfo();
    const salesInfo = getSalesInfo();
    const completionStatus = getCompletionStatus();

    if (loading) {
        return (
            <Card className="mb-6">
                <div className="flex justify-center items-center h-32">
                    <Spin size="large" />
                    <Text className="ml-3">Loading restaurant information...</Text>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="mb-6">
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
                        >
                            Retry
                        </Button>
                    }
                />
            </Card>
        );
    }

    if (!completeOnboardingData || Object.keys(completeOnboardingData).length === 0) {
        return (
            <Card className="mb-6">
                <Alert
                    message="No Restaurant Data"
                    description="No restaurant information found. Please complete your restaurant setup."
                    type="warning"
                    showIcon
                    action={
                        <Button 
                            type="primary" 
                            size="small"
                            onClick={() => navigate('/restaurant-setup')}
                        >
                            Setup Restaurant
                        </Button>
                    }
                />
            </Card>
        );
    }

    return (
        <Card 
            title={
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <ShopOutlined className="mr-2 text-blue-600" />
                        <Title level={4} className="mb-0">Restaurant Information</Title>
                    </div>
                    <Button 
                        type="primary" 
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => navigate('/restaurant-setup')}
                    >
                        Edit
                    </Button>
                </div>
            }
            className="mb-6"
        >
            {/* Completion Status */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <Text strong>Setup Progress</Text>
                    <Text>{completionStatus.percentage}% Complete</Text>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionStatus.percentage}%` }}
                    ></div>
                </div>
                <Text type="secondary" className="text-sm">
                    {completionStatus.completed} of {completionStatus.total} steps completed
                </Text>
            </div>

            <Row gutter={[16, 16]}>
                {/* Basic Information */}
                <Col xs={24} md={12}>
                    <Card size="small" title="Basic Details" className="h-full">
                        {basicInfo ? (
                            <div className="space-y-2">
                                <div>
                                    <Text strong>Restaurant Name:</Text>
                                    <Text className="ml-2">{basicInfo.restaurant_name || "Not set"}</Text>
                                </div>
                                <div>
                                    <Text strong>Type:</Text>
                                    <Text className="ml-2">{basicInfo.restaurant_type || "Not set"}</Text>
                                </div>
                                <div>
                                    <Text strong>Menu Type:</Text>
                                    <Text className="ml-2">{basicInfo.menu_type || "Not set"}</Text>
                                </div>
                                <div>
                                    <Text strong>Locations:</Text>
                                    <Text className="ml-2">{basicInfo.number_of_locations || 0}</Text>
                                </div>
                                {basicInfo.locations && basicInfo.locations.length > 0 && (
                                    <div>
                                        <Text strong>Address:</Text>
                                        <Text className="ml-2 block text-sm">
                                            {basicInfo.locations[0].address_1 || "Not set"}
                                        </Text>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Text type="secondary">Basic information not completed</Text>
                        )}
                    </Card>
                </Col>

                {/* Labor Information */}
                <Col xs={24} md={12}>
                    <Card size="small" title="Labor Settings" className="h-full">
                        {laborInfo ? (
                            <div className="space-y-2">
                                <div>
                                    <Text strong>Goal:</Text>
                                    <Text className="ml-2">{laborInfo.goal || "Not set"}%</Text>
                                </div>
                                <div>
                                    <Text strong>Needs Attention:</Text>
                                    <Text className="ml-2">{laborInfo.needs_attention || "Not set"}%</Text>
                                </div>
                                <div>
                                    <Text strong>Danger Level:</Text>
                                    <Text className="ml-2">{laborInfo.danger || "Not set"}%</Text>
                                </div>
                                <div>
                                    <Text strong>Avg Hourly Rate:</Text>
                                    <Text className="ml-2">${laborInfo.avg_hourly_rate || 0}</Text>
                                </div>
                                <div>
                                    <Text strong>Record Method:</Text>
                                    <Text className="ml-2">{laborInfo.labor_record_method || "Not set"}</Text>
                                </div>
                            </div>
                        ) : (
                            <Text type="secondary">Labor information not completed</Text>
                        )}
                    </Card>
                </Col>

                {/* Sales Channels */}
                <Col xs={24}>
                    <Card size="small" title="Sales Channels">
                        {salesInfo ? (
                            <div className="flex flex-wrap gap-2">
                                <Tag color={salesInfo.in_store ? "green" : "default"}>
                                    In-Store {salesInfo.in_store ? "✓" : "✗"}
                                </Tag>
                                <Tag color={salesInfo.online ? "green" : "default"}>
                                    Online {salesInfo.online ? "✓" : "✗"}
                                </Tag>
                                <Tag color={salesInfo.from_app ? "green" : "default"}>
                                    App {salesInfo.from_app ? "✓" : "✗"}
                                </Tag>
                                <Tag color={salesInfo.third_party ? "green" : "default"}>
                                    Third Party {salesInfo.third_party ? "✓" : "✗"}
                                </Tag>
                            </div>
                        ) : (
                            <Text type="secondary">Sales channels not configured</Text>
                        )}
                    </Card>
                </Col>
            </Row>


        </Card>
    );
};

export default RestaurantInfoCard; 