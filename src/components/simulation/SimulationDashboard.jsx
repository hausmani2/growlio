import React, { useState, useEffect } from 'react';
import { Modal, Select, InputNumber, Button, Card, Table, Tag, message } from 'antd';
import { CalendarOutlined, DollarOutlined, ShoppingOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/store';
import LoadingSpinner from '../layout/LoadingSpinner';
import { formatCurrency, formatNumber } from '../../utils/formatUtils';

const { Option } = Select;

const SimulationDashboard = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dashboardParams, setDashboardParams] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    added_customer_per_day: 5,
    current_customer_per_day: 2,
    average_ticket_per_customer: 20
  });
  
  const {
    simulationDashboardData,
    simulationDashboardLoading,
    simulationDashboardError,
    createSimulationDashboard,
    getSimulationOnboardingStatus,
    getSimulationDashboard
  } = useStore();

  const [restaurantId, setRestaurantId] = useState(null);

  // Load restaurant ID and dashboard data on mount
  // Also check if onboarding is complete - redirect if not
  useEffect(() => {
    const loadData = async () => {
      let id = null;
      let restaurantName = null;
      let onboardingComplete = false;
      
      const storedId = localStorage.getItem('simulation_restaurant_id');
      if (storedId) {
        id = parseInt(storedId);
        setRestaurantId(id);
      }
      
      // Always check onboarding status to verify completion
      // CRITICAL: Use forceRefresh=true to bypass cache and get fresh data
      // This ensures we get the latest onboarding status after POST
      console.log('🔄 [SimulationDashboard] Checking onboarding status with forceRefresh=true...');
      
      // Clear sessionStorage flags to ensure fresh API call
      sessionStorage.removeItem('hasCheckedSimulationOnboardingGlobal');
      sessionStorage.removeItem('simulationOnboardingLastCheckTime');
      
      const statusResult = await getSimulationOnboardingStatus(true); // Force refresh
      
      console.log('📥 [SimulationDashboard] Onboarding status result:', statusResult);
      
      if (statusResult.success && statusResult.data?.restaurants?.length > 0) {
        const restaurant = statusResult.data.restaurants[statusResult.data.restaurants.length - 1] || statusResult.data.restaurants[0];
        id = restaurant.simulation_restaurant_id;
        restaurantName = restaurant.simulation_restaurant_name;
        onboardingComplete = restaurant.simulation_onboarding_complete === true;
        
        console.log('🏪 [SimulationDashboard] Restaurant data:', {
          id,
          restaurantName,
          onboardingComplete,
          simulation_onboarding_complete: restaurant.simulation_onboarding_complete
        });
        
        setRestaurantId(id);
        localStorage.setItem('simulation_restaurant_id', id);
        
        // If onboarding is not complete or name is null, redirect to onboarding
        if (restaurantName === null || onboardingComplete === false) {
          console.warn('⚠️ [SimulationDashboard] Onboarding not complete, redirecting to onboarding');
          message.warning('Please complete onboarding before accessing the dashboard.');
          navigate('/onboarding/simulation', { replace: true });
          return;
        }
        
        // Allow access to simulation dashboard if simulation onboarding is complete
        // The route guard in ProtectedRoutes.jsx handles the case where simulation onboarding API has no restaurants
        // If user explicitly navigates to /simulation/dashboard, they should be allowed to access it
        console.log('✅ [SimulationDashboard] Onboarding complete, allowing dashboard access');
      } else {
        // No restaurant found in simulation onboarding API, redirect to onboarding
        console.warn('⚠️ [SimulationDashboard] No restaurant found in simulation onboarding API, redirecting to onboarding');
        message.warning('Please complete onboarding before accessing the dashboard.');
        navigate('/onboarding/simulation', { replace: true });
        return;
      }
      
      // Load dashboard data if restaurant ID is available and onboarding is complete
      if (id && onboardingComplete && restaurantName !== null) {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        await getSimulationDashboard(id, currentYear, currentMonth);
      }
    };
    loadData();
  }, [getSimulationOnboardingStatus, getSimulationDashboard, navigate]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleModalSubmit = async () => {
    if (!restaurantId) {
      message.error('Restaurant ID not found. Please complete onboarding first.');
      return;
    }

    const payload = {
      restaurant_id: restaurantId,
      year: dashboardParams.year,
      month: dashboardParams.month,
      added_customer_per_day: dashboardParams.added_customer_per_day,
      current_customer_per_day: dashboardParams.current_customer_per_day,
      average_ticket_per_customer: dashboardParams.average_ticket_per_customer
    };

    try {
      const result = await createSimulationDashboard(payload);
      if (result.success) {
        // After POST, call GET to fetch complete data with expenses breakdown
        if (restaurantId) {
          await getSimulationDashboard(restaurantId, dashboardParams.year, dashboardParams.month);
        }
        setIsModalVisible(false);
        message.success('Forecast generated successfully!');
      }
    } catch (error) {
      console.error('Error creating dashboard:', error);
      message.error('Failed to generate forecast. Please try again.');
    }
  };

  // Generate years (current year ± 5 years)
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  if (simulationDashboardLoading && !simulationDashboardData) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const dashboardData = simulationDashboardData && simulationDashboardData.length > 0 
    ? simulationDashboardData[0] 
    : null;

  return (
    <div className="">
      <div className="mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              Simulation Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Forecast your restaurant's financial performance
            </p>
          </div>
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            onClick={showModal}
            size="large"
            className="bg-orange-500 hover:bg-orange-600 border-orange-500"
          >
            Generate Forecast
          </Button>
        </div>

        {dashboardData ? (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(dashboardData.total_income)}
                    </p>
                  </div>
                  <DollarOutlined className="text-3xl text-green-500" />
                </div>
              </Card>

              <Card className="shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(dashboardData.total_expenses)}
                    </p>
                  </div>
                  <ShoppingOutlined className="text-3xl text-red-500" />
                </div>
              </Card>

              <Card className="shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Profit/Loss</p>
                    <p className={`text-2xl font-bold ${
                      dashboardData.profit_or_loss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(dashboardData.profit_or_loss)}
                    </p>
                  </div>
                  <DollarOutlined className={`text-3xl ${
                    dashboardData.profit_or_loss >= 0 ? 'text-green-500' : 'text-red-500'
                  }`} />
                </div>
              </Card>

              <Card className="shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Cash on Hand</p>
                    <p className={`text-2xl font-bold ${
                      dashboardData.cash_on_hand >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(dashboardData.cash_on_hand)}
                    </p>
                  </div>
                  <DollarOutlined className={`text-3xl ${
                    dashboardData.cash_on_hand >= 0 ? 'text-green-500' : 'text-red-500'
                  }`} />
                </div>
              </Card>
            </div>

            {/* Customer & Sales Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Number of Customers</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatNumber(dashboardData.no_of_customer)}
                    </p>
                  </div>
                  <UserOutlined className="text-3xl text-blue-500" />
                </div>
              </Card>

              <Card className="shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Work Days in Month</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {dashboardData.work_days_in_month}
                    </p>
                  </div>
                  <CalendarOutlined className="text-3xl text-gray-500" />
                </div>
              </Card>

              <Card className="shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Average Ticket</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(dashboardData.average_ticket_per_customer)}
                    </p>
                  </div>
                  <DollarOutlined className="text-3xl text-purple-500" />
                </div>
              </Card>
            </div>

            {/* Daily Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="shadow-md">
                <p className="text-sm text-gray-600 mb-1">Daily Expenses</p>
                <p className="text-xl font-semibold text-gray-800">
                  {formatCurrency(dashboardData.daily_expenses)}
                </p>
              </Card>

              <Card className="shadow-md">
                <p className="text-sm text-gray-600 mb-1">Daily COGS</p>
                <p className="text-xl font-semibold text-gray-800">
                  {formatCurrency(dashboardData.daily_cogs)}
                </p>
              </Card>

              <Card className="shadow-md">
                <p className="text-sm text-gray-600 mb-1">Daily Profit/Loss</p>
                <p className={`text-xl font-semibold ${
                  dashboardData.daily_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(dashboardData.daily_profit_loss)}
                </p>
              </Card>

              <Card className="shadow-md">
                <p className="text-sm text-gray-600 mb-1">Avg Daily Sales Needed</p>
                <p className="text-xl font-semibold text-orange-600">
                  {formatCurrency(dashboardData.avg_daily_sales_needed)}
                </p>
              </Card>
            </div>

            {/* Sales Targets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="shadow-md bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <p className="text-sm text-gray-700 mb-1 font-medium">Weekly Sales Needed</p>
                <p className="text-2xl font-bold text-orange-700">
                  {formatCurrency(dashboardData.avg_weekly_sales_needed)}
                </p>
              </Card>

              <Card className="shadow-md bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <p className="text-sm text-gray-700 mb-1 font-medium">Monthly Sales Needed</p>
                <p className="text-2xl font-bold text-orange-700">
                  {formatCurrency(dashboardData.avg_monthly_sales_needed)}
                </p>
              </Card>

              <Card className="shadow-md bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <p className="text-sm text-gray-700 mb-1 font-medium">Current Monthly Income</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(dashboardData.total_income)}
                </p>
              </Card>
            </div>

            {/* Expenses Breakdown */}
            <Card className="shadow-md mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Expenses Breakdown</h2>
              <Table
                dataSource={dashboardData.expenses || []}
                rowKey="id"
                pagination={false}
                scroll={{ x: 'max-content' }}
                columns={[
                  {
                    title: 'Category',
                    dataIndex: 'category',
                    key: 'category',
                    render: (category) => (
                      <Tag color="blue">{category}</Tag>
                    )
                  },
                  {
                    title: 'Name',
                    dataIndex: 'name',
                    key: 'name',
                    className: 'font-medium'
                  },
                  {
                    title: 'Value Type',
                    dataIndex: 'value_type',
                    key: 'value_type',
                    render: (type) => (
                      <Tag color={type === 'percentage' ? 'purple' : 'green'}>
                        {type === 'percentage' ? 'Percentage' : 'Fixed Value'}
                      </Tag>
                    )
                  },
                  {
                    title: 'Calculated Amount',
                    dataIndex: 'amount',
                    key: 'amount',
                    render: (amount) => (
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(amount)}
                      </span>
                    ),
                    align: 'right'
                  }
                ]}
              />
            </Card>
          </>
        ) : (
          <Card className="shadow-md text-center py-12">
            <CalendarOutlined className="text-5xl text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Dashboard Data
            </h3>
            <p className="text-gray-500 mb-6">
              Generate a forecast by selecting a year and month, then entering your customer data.
            </p>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={showModal}
              size="large"
              className="bg-orange-500 hover:bg-orange-600 border-orange-500"
            >
              Generate Forecast
            </Button>
          </Card>
        )}

        {/* Generate Forecast Modal */}
        <Modal
          title="Generate Forecast"
          open={isModalVisible}
          onOk={handleModalSubmit}
          onCancel={handleModalCancel}
          okText="Generate"
          cancelText="Cancel"
          width={600}
          confirmLoading={simulationDashboardLoading}
        >
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year <span className="text-red-500">*</span>
                </label>
                <Select
                  value={dashboardParams.year}
                  onChange={(value) => setDashboardParams(prev => ({ ...prev, year: value }))}
                  className="w-full h-11"
                >
                  {years.map(year => (
                    <Option key={year} value={year}>{year}</Option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month <span className="text-red-500">*</span>
                </label>
                <Select
                  value={dashboardParams.month}
                  onChange={(value) => setDashboardParams(prev => ({ ...prev, month: value }))}
                  className="w-full h-11"
                >
                  {months.map(month => (
                    <Option key={month.value} value={month.value}>{month.label}</Option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Added Customers Per Day <span className="text-red-500">*</span>
              </label>
              <InputNumber
                value={dashboardParams.added_customer_per_day}
                onChange={(value) => setDashboardParams(prev => ({ ...prev, added_customer_per_day: value || 0 }))}
                min={0}
                className="w-full h-11"
                placeholder="Enter number of new customers per day"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of new customers you expect to add each day
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Customers Per Day <span className="text-red-500">*</span>
              </label>
              <InputNumber
                value={dashboardParams.current_customer_per_day}
                onChange={(value) => setDashboardParams(prev => ({ ...prev, current_customer_per_day: value || 0 }))}
                min={0}
                className="w-full h-11"
                placeholder="Enter current customers per day"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current number of customers you serve per day
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Ticket Per Customer <span className="text-red-500">*</span>
              </label>
              <InputNumber
                value={dashboardParams.average_ticket_per_customer}
                onChange={(value) => setDashboardParams(prev => ({ ...prev, average_ticket_per_customer: value || 0 }))}
                min={0}
                step={0.01}
                precision={2}
                prefix="$"
                className="w-full h-11"
                placeholder="Enter average ticket amount"
              />
              <p className="text-xs text-gray-500 mt-1">
                Average amount each customer spends per visit
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SimulationDashboard;