import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Select, InputNumber, Button, Card, Table, Tag, message } from 'antd';
import { CalendarOutlined, DollarOutlined, ShoppingOutlined, UserOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/store';
import LoadingSpinner from '../layout/LoadingSpinner';
import { formatCurrency, formatNumber } from '../../utils/formatUtils';
import ChatWidget from '../chatbot/ChatWidget';
import useOnboardingStatus from '../../hooks/useOnboardingStatus';

const { Option } = Select;

const AUTO_SAVE_DEBOUNCE_MS = 700;
const SAVED_MESSAGE_DURATION_MS = 2500;

const SimulationDashboard = () => {
  const navigate = useNavigate();
  const [dashboardParams, setDashboardParams] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    added_customer_per_day: 5,
    days: 0,
    profit_loss: 0,
    average_ticket_per_customer: 20
  });
  const {
    simulationDashboardData,
    simulationDashboardLoading,
    simulationDashboardError,
    createSimulationDashboard,
    getSimulationOnboardingStatus,
    getSimulationDashboard,
    getDays,
    daysLoading,
    daysError
  } = useStore();

  const [restaurantId, setRestaurantId] = useState(null);
  const [period, setPeriod] = useState('monthly'); // daily, weekly, monthly, annually
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const debounceRef = useRef(null);
  const isSavingRef = useRef(false);
  const savedMessageTimerRef = useRef(null);
  const isInitialMountRef = useRef(true);
  const latestParamsRef = useRef({ dashboardParams, period, restaurantId });
  latestParamsRef.current = { dashboardParams, period, restaurantId };

  // Get onboarding status to check if regular users have completed onboarding
  const {
    hasRegularRestaurants,
    hasCompletedRegularOnboarding
  } = useOnboardingStatus();

  // Load restaurant ID and dashboard data on mount
  // Also check if onboarding is complete - redirect if not
  useEffect(() => {
    const loadData = async () => {
      // Check if regular user has completed onboarding
      if (hasRegularRestaurants && !hasCompletedRegularOnboarding) {
        message.warning('Please complete your onboarding to access Simulation Dashboard.');
        navigate('/onboarding', { replace: true });
        return;
      }

      let id = null;
      let restaurantName = null;
      let onboardingComplete = false;

      // Use only simulation restaurant ID for simulation APIs (never regular restaurant ID)
      const storedSimulationId = localStorage.getItem('simulation_restaurant_id');
      if (storedSimulationId) {
        id = parseInt(storedSimulationId, 10);
        if (!Number.isNaN(id)) setRestaurantId(id);
      }

      // Always check onboarding status to verify completion
      // CRITICAL: Use forceRefresh=true to bypass cache and get fresh data
      // This ensures we get the latest onboarding status after POST
      
      // Clear sessionStorage flags to ensure fresh API call
      sessionStorage.removeItem('hasCheckedSimulationOnboardingGlobal');
      sessionStorage.removeItem('simulationOnboardingLastCheckTime');
      
      const statusResult = await getSimulationOnboardingStatus(true); // Force refresh
      
      
      if (statusResult.success && statusResult.data?.restaurants?.length > 0) {
        const restaurant = statusResult.data.restaurants[statusResult.data.restaurants.length - 1] || statusResult.data.restaurants[0];
        id = restaurant.simulation_restaurant_id;
        restaurantName = restaurant.simulation_restaurant_name;
        onboardingComplete = restaurant.simulation_onboarding_complete === true;
        
        
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
  }, [getSimulationOnboardingStatus, getSimulationDashboard, navigate, hasRegularRestaurants, hasCompletedRegularOnboarding]);

  // Fetch days when restaurantId or month/year changes
  useEffect(() => {
    const fetchDaysData = async () => {
      if (!restaurantId) return;

      const result = await getDays(dashboardParams.year, dashboardParams.month, restaurantId);
      if (result.success && result.data && result.data.working_days_count !== undefined) {
        setDashboardParams(prev => ({ ...prev, days: result.data.working_days_count }));
      } else if (result.error) {
        message.error(result.error);
      }
    };

    fetchDaysData();
  }, [dashboardParams.year, dashboardParams.month, restaurantId, getDays]);

  // Shared save: create then fetch. Reads latest params from ref so debounced auto-save always uses current values (e.g. after getDays updates days).
  const saveForecast = useCallback(async (options = {}) => {
    const { showSuccessToast = false } = options;
    const { dashboardParams: params, period: p, restaurantId: rid } = latestParamsRef.current;
    if (!rid) {
      if (showSuccessToast) message.error('Restaurant ID not found. Please complete onboarding first.');
      return false;
    }
    if (isSavingRef.current) return false;

    const payload = {
      restaurant_id: rid,
      year: params.year,
      month: params.month,
      added_customer_per_day: params.added_customer_per_day,
      days: params.days,
      profit_loss: params.profit_loss,
      average_ticket_per_customer: params.average_ticket_per_customer,
      period: p
    };

    isSavingRef.current = true;
    setSaveStatus('saving');
    setSaveErrorMessage('');

    try {
      const result = await createSimulationDashboard(payload);
      if (result.success && rid) {
        await getSimulationDashboard(rid, params.year, params.month);
      }
      setSaveStatus('saved');
      setSaveErrorMessage('');
      if (showSuccessToast) message.success('Forecast saved successfully.');
      if (savedMessageTimerRef.current) clearTimeout(savedMessageTimerRef.current);
      savedMessageTimerRef.current = setTimeout(() => {
        setSaveStatus(null);
        savedMessageTimerRef.current = null;
      }, SAVED_MESSAGE_DURATION_MS);
      return true;
    } catch (error) {
      console.error('Error saving forecast:', error);
      const errMsg = error?.message || 'Failed to save forecast. Please try again.';
      setSaveStatus('error');
      setSaveErrorMessage(errMsg);
      message.error(errMsg);
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [createSimulationDashboard, getSimulationDashboard]);

  // Debounced auto-save when customer/day, profit_loss, or avg ticket change (skip on initial mount to avoid extra API call)
  useEffect(() => {
    if (!restaurantId) return;
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      if (isSavingRef.current) return;
      saveForecast({ showSuccessToast: false });
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    dashboardParams.added_customer_per_day,
    dashboardParams.profit_loss,
    dashboardParams.average_ticket_per_customer,
    restaurantId
  ]);

  const handleGenerate = () => {
    saveForecast({ showSuccessToast: true });
  };

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedMessageTimerRef.current) clearTimeout(savedMessageTimerRef.current);
    };
  }, []);

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">
            Simulation Dashboard
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Forecast your restaurant's financial performance
          </p>

          {/* Generate Forecast - inputs at top (no modal) */}
          <Card title="Generate Forecast" className="mb-0 shadow-sm">
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={dashboardParams.year}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, year: value }))}
                    className="w-full"
                    size="large"
                  >
                    {years.map(year => (
                      <Option key={year} value={year}>{year}</Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                   Beginning Month <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={dashboardParams.month}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, month: value }))}
                    className="w-full"
                    size="large"
                  >
                    {months.map(month => (
                      <Option key={month.value} value={month.value}>{month.label}</Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days Open <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    value={dashboardParams.days}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, days: value || 0 }))}
                    min={0}
                    className="w-full"
                    size="large"
                    placeholder="Working days"
                    disabled={daysLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customers Per Day <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    value={dashboardParams.added_customer_per_day}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, added_customer_per_day: value || 0 }))}
                    min={0}
                    className="w-full"
                    size="large"
                    placeholder="New customers/day"
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profit/Loss <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    value={dashboardParams.profit_loss}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, profit_loss: value || 0 }))}
                    step={0.01}
                    precision={2}
                    prefix="$"
                    className="w-full"
                    size="large"
                    placeholder="Profit/loss"
                  />
                </div> */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avg Ticket <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    value={dashboardParams.average_ticket_per_customer}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, average_ticket_per_customer: value || 0 }))}
                    min={0}
                    step={0.01}
                    precision={2}
                    prefix="$"
                    className="w-full"
                    size="large"
                    placeholder="Per customer"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100 pt-4 mt-2">
                <Select
                  value={period}
                  onChange={(value) => setPeriod(value)}
                  size="large"
                  style={{ width: 160, minWidth: 160 }}
                >
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                  <Option value="annually">Annually</Option>
                </Select>
                <Button
                  type="primary"
                  icon={<CalendarOutlined />}
                  onClick={handleGenerate}
                  loading={simulationDashboardLoading}
                  size="large"
                  className="bg-orange-500 hover:bg-orange-600 border-orange-500"
                >
                  Generate Forecast
                </Button>
                <div className="flex items-center gap-2 text-sm min-h-[24px]">
                  {saveStatus === 'saving' && (
                    <span className="text-amber-600 flex items-center gap-1.5">
                      <LoadingOutlined />
                      Saving…
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-green-600 flex items-center gap-1.5">
                      <CheckCircleOutlined />
                      Saved
                    </span>
                  )}
                  {saveStatus === 'error' && saveErrorMessage && (
                    <span className="text-red-600" title={saveErrorMessage}>
                      Save failed. Try again or use Generate Forecast.
                    </span>
                  )}
                  {!saveStatus && (
                    <span className="text-gray-400">Changes save automatically</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {dashboardData ? (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
                    <p className="text-sm text-gray-600 mb-1">Number of Customers</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatNumber(dashboardData.no_of_customer)}
                    </p>
                  </div>
                  <UserOutlined className="text-3xl text-blue-500" />
                </div>
              </Card>

              <Card className="shadow-md bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700 mb-1 font-medium">Need to Achieve Goals Sales</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {period === 'daily' && formatCurrency(dashboardData.avg_daily_sales_needed)}
                      {period === 'weekly' && formatCurrency(dashboardData.avg_weekly_sales_needed)}
                      {period === 'monthly' && formatCurrency(dashboardData.avg_monthly_sales_needed)}
                      {period === 'annually' && formatCurrency((dashboardData.avg_monthly_sales_needed || 0) * 12)}
                    </p>
                  </div>
                  <DollarOutlined className="text-3xl text-orange-500" />
                </div>
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
            <p className="text-gray-500">
              Use the form above to generate a forecast. Select year and month, enter your customer data, then click Generate Forecast.
            </p>
          </Card>
        )}
      </div>
      
      {/* Chat Widget for Simulation */}
      <ChatWidget botName="Growlio Assistant" />
    </div>
  );
};

export default SimulationDashboard;