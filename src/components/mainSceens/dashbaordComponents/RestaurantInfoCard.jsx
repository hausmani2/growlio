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
// import { apiGet } from '../../../utils/axiosInterceptors';
import useStore from '../../../store/store';

const { Title, Text } = Typography;

const RestaurantInfoCard = () => {
    const {  loadExistingOnboardingData } = useStore();
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


    return 
};

export default RestaurantInfoCard; 