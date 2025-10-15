import React from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Spin,
  Empty
} from 'antd';
import { 
  ShoppingOutlined,
  UserOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import LoadingSpinner from '../../layout/LoadingSpinner';

const { Text } = Typography;

const AnalyticsCharts = ({ loading, dashboardData }) => {
  // Safely extract data with fallbacks
  const data = dashboardData || {};
  const usersByCountry = data.users_by_country_state || [];
  const franchiseStats = data.franchise_stats || [];
  const restaurantTypes = data.restaurant_types || [];
  const menuTypes = data.menu_types || [];
  const locationsPerUser = data.locations_per_user || [];
  
  // Calculate totals
  const totalLocations = locationsPerUser.reduce((sum, user) => sum + (user.total_locations || 0), 0);
  const totalRestaurants = locationsPerUser.reduce((sum, user) => sum + (user.total_restaurants || 0), 0);
  const totalCountries = new Set(usersByCountry.map(u => u.country)).size;
  const franchiseLocations = franchiseStats.find(f => f.is_franchise)?.total_locations || 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title="Total Locations"
              value={totalLocations}
              prefix={<TrophyOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-sm">
                Across all users
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title="Total Restaurants"
              value={totalRestaurants}
              prefix={<ShoppingOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-sm">
                Active restaurants
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title="Countries"
              value={totalCountries}
              prefix={<UserOutlined className="text-purple-500" />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-sm">
                Global presence
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="text-center">
            <Statistic
              title="Franchise Locations"
              value={franchiseLocations}
              prefix={<TrophyOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-sm">
                Franchise locations
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Geographic Distribution */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Users by Country & State" size="small">
            <div className="space-y-3">
              {usersByCountry.length > 0 ? (
                usersByCountry.map((location, index) => (
                  <div key={`${location.country}-${location.state}`} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#f5222d'][index % 5]
                        }}
                      />
                      <Text className="font-medium">{location.country} - {location.state}</Text>
                    </div>
                    <div className="text-right">
                      <Text strong>{location.user_count || 0}</Text>
                      <div>
                        <Text type="secondary" className="text-xs">users</Text>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Empty description="No geographic data available" />
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Franchise vs Independent" size="small">
            <div className="space-y-3">
              {franchiseStats.length > 0 ? (
                franchiseStats.map((franchise, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: franchise.is_franchise ? '#52c41a' : '#1890ff'
                        }}
                      />
                      <Text className="font-medium">
                        {franchise.is_franchise ? 'Franchise' : 'Independent'}
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text strong>{franchise.total_locations || 0}</Text>
                      <div>
                        <Text type="secondary" className="text-xs">locations</Text>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Empty description="No franchise data available" />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Restaurant & Menu Types */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Restaurant Types" size="small">
            <div className="space-y-3">
              {restaurantTypes.length > 0 ? (
                restaurantTypes.map((type, index) => (
                  <div key={type.restaurant_type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#f5222d'][index % 5]
                        }}
                      />
                      <Text className="font-medium">{type.restaurant_type}</Text>
                    </div>
                    <div className="text-right">
                      <Text strong>{type.total_restaurants || 0}</Text>
                      <div>
                        <Text type="secondary" className="text-xs">restaurants</Text>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Empty description="No restaurant type data available" />
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Menu Types" size="small">
            <div className="space-y-3">
              {menuTypes.length > 0 ? (
                menuTypes.map((menu, index) => (
                  <div key={menu.menu_type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#f5222d'][index % 5]
                        }}
                      />
                      <Text className="font-medium">{menu.menu_type}</Text>
                    </div>
                    <div className="text-right">
                      <Text strong>{menu.total_restaurants || 0}</Text>
                      <div>
                        <Text type="secondary" className="text-xs">restaurants</Text>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Empty description="No menu type data available" />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsCharts;

