import React from 'react';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Spin,
  Empty,
  Table
} from 'antd';
import { 
  ShoppingOutlined,
  UserOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined
} from '@ant-design/icons';
import LoadingSpinner from '../../layout/LoadingSpinner';

const { Text } = Typography;

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const AnalyticsCharts = ({ loading, dashboardData }) => {
  // Safely extract data with fallbacks
  const data = dashboardData || {};
  const usersByCountry = data.users_by_country_state || [];
  const franchiseStats = data.franchise_stats || [];
  const restaurantTypes = data.restaurant_types || [];
  const menuTypes = data.menu_types || [];
  const locationsPerUser = data.locations_per_user || [];
  const posStats = data.pos_stats || {};
  
  // Calculate totals
  const totalLocations = locationsPerUser.reduce((sum, user) => sum + (user.total_locations || 0), 0);
  const totalRestaurants = locationsPerUser.reduce((sum, user) => sum + (user.total_restaurants || 0), 0);
  const totalCountries = new Set(usersByCountry.map(u => u.country)).size;
  const franchiseLocations = franchiseStats.find(f => f.is_franchise)?.total_locations || 0;

  // Palette
  const palette = ['#FF8132', '#22C55E', '#3B82F6', '#8B5CF6', '#F97316', '#06B6D4', '#EF4444', '#14B8A6', '#A855F7', '#0EA5E9'];

  // Helpers
  const numberFormatter = (n) => (typeof n === 'number' ? n.toLocaleString() : '0');
  const percentFormatter = (part, total) => {
    if (!total) return '0%';
    const pct = (part / total) * 100;
    return `${pct.toFixed(pct >= 10 ? 0 : 1)}%`;
  };

  // Aggregate users by country
  const usersByCountryAgg = Object.values(
    (usersByCountry || []).reduce((acc, item) => {
      const key = item.country || 'Unknown';
      acc[key] = acc[key] || { country: key, user_count: 0 };
      acc[key].user_count += item.user_count || 0;
      return acc;
    }, {})
  ).sort((a, b) => b.user_count - a.user_count);

  const topCountries = usersByCountryAgg.slice(0, 8);
  const usersByStateAgg = Object.values(
    (usersByCountry || []).reduce((acc, item) => {
      const key = `${item.country || 'Unknown'}::${item.state || 'Unknown'}`;
      acc[key] = acc[key] || { country: item.country || 'Unknown', state: item.state || 'Unknown', user_count: 0 };
      acc[key].user_count += item.user_count || 0;
      return acc;
    }, {})
  ).sort((a, b) => b.user_count - a.user_count);
  const topStates = usersByStateAgg.slice(0, 8);

  const usersByCountryBarData = {
    labels: topCountries.map(c => c.country),
    datasets: [
      {
        label: 'Users',
        data: topCountries.map(c => c.user_count || 0),
        backgroundColor: topCountries.map((_, i) => palette[i % palette.length]),
        borderRadius: 6
      }
    ]
  };

  const usersByStateBarData = {
    labels: topStates.map(s => `${s.country} - ${s.state}`),
    datasets: [
      {
        label: 'Users',
        data: topStates.map(s => s.user_count || 0),
        backgroundColor: topStates.map((_, i) => palette[(i + 3) % palette.length]),
        borderRadius: 6
      }
    ]
  };

  const baseBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${numberFormatter(ctx.parsed.y ?? ctx.parsed)}`
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { callback: (v) => numberFormatter(v) } }
    }
  };

  // Franchise vs Independent doughnut
  const franchiseTotal = franchiseStats.find(f => f.is_franchise)?.total_locations || 0;
  const independentTotal = franchiseStats.find(f => !f.is_franchise)?.total_locations || 0;
  const franchiseVsTotal = franchiseTotal + independentTotal;
  const franchiseDoughnutData = {
    labels: ['Franchise', 'Independent'],
    datasets: [
      {
        data: [franchiseTotal, independentTotal],
        backgroundColor: [palette[1], palette[2]],
        borderWidth: 0
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = ctx.parsed;
            const total = ctx.dataset.data.reduce((s, v) => s + v, 0);
            return `${ctx.label}: ${numberFormatter(value)} (${percentFormatter(value, total)})`;
          }
        }
      }
    },
    cutout: '65%'
  };

  // Center label plugin for doughnut charts (shows total)
  const centerLabelPlugin = {
    id: 'centerLabelPlugin',
    afterDraw(chart, args, options) {
      const { ctx, chartArea } = chart;
      const dataset = chart.data.datasets?.[0];
      if (!dataset) return;
      const total = dataset.data.reduce((s, v) => s + v, 0);
      ctx.save();
      ctx.font = '600 14px sans-serif';
      ctx.fillStyle = '#111827';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      ctx.fillText(numberFormatter(total), centerX, centerY);
      ctx.restore();
    }
  };

  // Restaurant types bar
  const restaurantTypesBarData = {
    labels: (restaurantTypes || []).map(t => t.restaurant_type),
    datasets: [
      {
        label: 'Restaurants',
        data: (restaurantTypes || []).map(t => t.total_restaurants || 0),
        backgroundColor: (restaurantTypes || []).map((_, i) => palette[i % palette.length]),
        borderRadius: 6
      }
    ]
  };

  // Menu types doughnut
  const menuTypesDoughnutData = {
    labels: (menuTypes || []).map(m => m.menu_type),
    datasets: [
      {
        data: (menuTypes || []).map(m => m.total_restaurants || 0),
        backgroundColor: (menuTypes || []).map((_, i) => palette[i % palette.length]),
        borderWidth: 0
      }
    ]
  };
  const menuTypesTotal = (menuTypes || []).reduce((s, m) => s + (m.total_restaurants || 0), 0);

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

      {/* POS Statistics Section */}
      {posStats && Object.keys(posStats).length > 0 && (
        <Card 
          title={
            <div className="flex items-center gap-2">
              <ShopOutlined className="text-orange-500" />
              <span>POS System Statistics</span>
            </div>
          }
          className="shadow-md"
        >
          <Row gutter={[16, 16]}>
            {/* Third-party Orders to POS */}
            {posStats.third_party_orders_to_pos && (
              <Col xs={24} md={8}>
                <Card 
                  className="h-full hover:shadow-lg transition-shadow"
                  style={{ borderLeft: '4px solid #3b82f6' }}
                  size="small"
                >
                  <div className="mb-3">
                    <Text strong className="text-base block mb-2">
                      Third-Party Delivery Integration
                    </Text>
                    <Text type="secondary" className="text-sm">
                      Do your third-party delivery orders (like Uber Eats or DoorDash) go directly into your POS?
                    </Text>
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircleOutlined className="text-green-500" />
                        <Text>Yes</Text>
                      </div>
                      <div className="text-right">
                        <Text strong className="text-lg text-green-600">
                          {posStats.third_party_orders_to_pos.true || 0}
                        </Text>
                        <Text type="secondary" className="ml-2 text-xs">
                          ({percentFormatter(
                            posStats.third_party_orders_to_pos.true || 0,
                            (posStats.third_party_orders_to_pos.true || 0) + (posStats.third_party_orders_to_pos.false || 0)
                          )})
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CloseCircleOutlined className="text-red-500" />
                        <Text>No</Text>
                      </div>
                      <div className="text-right">
                        <Text strong className="text-lg text-red-600">
                          {posStats.third_party_orders_to_pos.false || 0}
                        </Text>
                        <Text type="secondary" className="ml-2 text-xs">
                          ({percentFormatter(
                            posStats.third_party_orders_to_pos.false || 0,
                            (posStats.third_party_orders_to_pos.true || 0) + (posStats.third_party_orders_to_pos.false || 0)
                          )})
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            )}

            {/* Separate Online Ordering */}
            {posStats.separate_online_ordering && (
              <Col xs={24} md={8}>
                <Card 
                  className="h-full hover:shadow-lg transition-shadow"
                  style={{ borderLeft: '4px solid #a855f7' }}
                  size="small"
                >
                  <div className="mb-3">
                    <Text strong className="text-base block mb-2">
                      Online Ordering Platform
                    </Text>
                    <Text type="secondary" className="text-sm">
                      Do you use a separate online ordering platform from your POS system?
                    </Text>
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircleOutlined className="text-green-500" />
                        <Text>Yes</Text>
                      </div>
                      <div className="text-right">
                        <Text strong className="text-lg text-green-600">
                          {posStats.separate_online_ordering.true || 0}
                        </Text>
                        <Text type="secondary" className="ml-2 text-xs">
                          ({percentFormatter(
                            posStats.separate_online_ordering.true || 0,
                            (posStats.separate_online_ordering.true || 0) + (posStats.separate_online_ordering.false || 0)
                          )})
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CloseCircleOutlined className="text-red-500" />
                        <Text>No</Text>
                      </div>
                      <div className="text-right">
                        <Text strong className="text-lg text-red-600">
                          {posStats.separate_online_ordering.false || 0}
                        </Text>
                        <Text type="secondary" className="ml-2 text-xs">
                          ({percentFormatter(
                            posStats.separate_online_ordering.false || 0,
                            (posStats.separate_online_ordering.true || 0) + (posStats.separate_online_ordering.false || 0)
                          )})
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            )}

            {/* POS for Employee Hours */}
            {posStats.pos_for_employee_hours && (
              <Col xs={24} md={8}>
                <Card 
                  className="h-full hover:shadow-lg transition-shadow"
                  style={{ borderLeft: '4px solid #f97316' }}
                  size="small"
                >
                  <div className="mb-3">
                    <Text strong className="text-base block mb-2">
                      Employee Hours Tracking
                    </Text>
                    <Text type="secondary" className="text-sm">
                      Is your POS also used for tracking employee hours for payroll?
                    </Text>
                  </div>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircleOutlined className="text-green-500" />
                        <Text>Yes</Text>
                      </div>
                      <div className="text-right">
                        <Text strong className="text-lg text-green-600">
                          {posStats.pos_for_employee_hours.true || 0}
                        </Text>
                        <Text type="secondary" className="ml-2 text-xs">
                          ({percentFormatter(
                            posStats.pos_for_employee_hours.true || 0,
                            (posStats.pos_for_employee_hours.true || 0) + (posStats.pos_for_employee_hours.false || 0)
                          )})
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CloseCircleOutlined className="text-red-500" />
                        <Text>No</Text>
                      </div>
                      <div className="text-right">
                        <Text strong className="text-lg text-red-600">
                          {posStats.pos_for_employee_hours.false || 0}
                        </Text>
                        <Text type="secondary" className="ml-2 text-xs">
                          ({percentFormatter(
                            posStats.pos_for_employee_hours.false || 0,
                            (posStats.pos_for_employee_hours.true || 0) + (posStats.pos_for_employee_hours.false || 0)
                          )})
                        </Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* Geographic Distribution */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Users by Country (Top 8)" size="small">
            {topCountries.length > 0 ? (
              <div style={{ height: 300 }}>
                <Bar data={usersByCountryBarData} options={baseBarOptions} />
              </div>
            ) : (
              <Empty description="No geographic data available" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Franchise vs Independent" size="small">
            {(franchiseTotal + independentTotal) > 0 ? (
              <div style={{ height: 300, width: '100%' }} className='mx-auto flex justify-center items-center'>
                <Doughnut data={franchiseDoughnutData} options={{doughnutOptions, cutout: '50%'}} plugins={[centerLabelPlugin]} />
              </div>
            ) : (
              <Empty description="No franchise data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Restaurant & Menu Types */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Restaurant Types" size="small">
            {restaurantTypes.length > 0 ? (
              <div style={{ height: 300 }}>
                <Bar data={restaurantTypesBarData} options={baseBarOptions} />
              </div>
            ) : (
              <Empty description="No restaurant type data available" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Menu Types" size="small">
            {menuTypes.length > 0 ? (
              <div className="flex gap-4">
                <div style={{ height: 300, width: '60%' }}>
                  <Doughnut data={menuTypesDoughnutData} options={doughnutOptions} plugins={[centerLabelPlugin]}  />
                </div>
                <div className="flex-1 overflow-auto" style={{ maxHeight: 300 }}>
                  <div className="space-y-2">
                    {menuTypes.map((m, i) => (
                      <div key={m.menu_type} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: palette[i % palette.length] }} />
                          <span className="truncate" title={m.menu_type}>{m.menu_type}</span>
                        </div>
                        <span className="ml-2 whitespace-nowrap">{numberFormatter(m.total_restaurants || 0)} ({percentFormatter(m.total_restaurants || 0, menuTypesTotal)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Empty description="No menu type data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Country & State Detailed Breakdown */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Top States (by Users)" size="small">
            {topStates.length > 0 ? (
              <div style={{ height: 300 }}>
                <Bar data={usersByStateBarData} options={baseBarOptions} />
              </div>
            ) : (
              <Empty description="No state-level data available" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Users by Country & State" size="small">
            {usersByStateAgg.length > 0 ? (
              <Table
                size="small"
                rowKey={(r) => `${r.country}-${r.state}`}
                dataSource={usersByStateAgg}
                columns={[
                  { title: 'Country', dataIndex: 'country', key: 'country', sorter: (a, b) => a.country.localeCompare(b.country) },
                  { title: 'State', dataIndex: 'state', key: 'state', sorter: (a, b) => a.state.localeCompare(b.state) },
                  { title: 'Users', dataIndex: 'user_count', key: 'user_count', sorter: (a, b) => a.user_count - b.user_count, render: (v) => numberFormatter(v) }
                ]}
                pagination={{ pageSize: 8, showSizeChanger: false }}
              />
            ) : (
              <Empty description="No data available" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsCharts;

