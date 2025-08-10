import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Table, Card, Row, Col, Typography, Space, Divider, message, Spin, Empty, notification } from 'antd';
import { PlusOutlined, EditOutlined, CalculatorOutlined, SaveOutlined, DollarOutlined, ArrowRightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../../store/store';

const { Title, Text } = Typography;

const SalesDataModal = ({ 
  visible, 
  onCancel, 
  selectedWeekData, 
  weekDays = [], 
  onDataSaved,
  autoOpenFromSummary = false
}) => {
  // Store integration
  const { 
    saveDashboardData, 
    loading: storeLoading, 
    error: storeError,
    completeOnboardingData
  } = useStore();

  // Get providers from onboarding data
  const getProviders = () => {
    if (!completeOnboardingData || !completeOnboardingData['Food Cost Details'] || !completeOnboardingData['Food Cost Details'].data) {
      return [];
    }
    return completeOnboardingData['Food Cost Details'].data.providers || [];
  };

  const [providers, setProviders] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDayForSales, setSelectedDayForSales] = useState(null);
  const [formData, setFormData] = useState({
    weeklyTotals: {
      salesBudget: 0,
      actualSalesInStore: 0,
      actualSalesAppOnline: 0,
      dailyTickets: 0,
      averageDailyTicket: 0
    },
    dailyData: []
  });

  // Update providers when onboarding data changes
  useEffect(() => {
    const currentProviders = getProviders();
    setProviders(currentProviders);
  }, [completeOnboardingData]);

  // Initialize form data when modal opens or week data changes
  useEffect(() => {
    if (visible && selectedWeekData) {
      initializeFormData();
    }
  }, [visible, selectedWeekData, weekDays, providers]);

  // Initialize form data based on selected week
  const initializeFormData = () => {
    const startDate = selectedWeekData?.startDate ? dayjs(selectedWeekData.startDate) : dayjs();
    const currentProviders = getProviders();
    const dailyData = generateDailyData(startDate, currentProviders);
    
    const initialWeeklyTotals = {
      salesBudget: 0,
      actualSalesInStore: 0,
      actualSalesAppOnline: 0,
      dailyTickets: 0,
      averageDailyTicket: 0,
      ...currentProviders.reduce((acc, provider) => {
        const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
        acc[providerKey] = 0;
        return acc;
      }, {})
    };
    
    setFormData({
      weeklyTotals: initialWeeklyTotals,
      dailyData: dailyData
    });
  };

  // Generate 7 days of data starting from a given date
  const generateDailyData = (startDate, currentProviders = providers) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = dayjs(startDate).add(i, 'day');
      const dayData = {
        key: `day-${currentDate.format('YYYY-MM-DD')}`,
        date: currentDate,
        dayName: currentDate.format('dddd'),
        budgetedSales: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,
        dailyTickets: 0,
        averageDailyTicket: 0
      };

      // Add dynamic provider fields
      currentProviders.forEach(provider => {
        const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
        dayData[providerKey] = 0;
      });

      days.push(dayData);
    }
    return days;
  };

  // Show top popup notification
  const showTopPopupNotification = (selectedDay) => {
    notification.info({
      message: (
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
          🎉 Budgeted Sales Added Successfully!
        </div>
      ),
      description: (
        <div style={{ marginTop: '8px' }}>
          <p style={{ marginBottom: '8px' }}>
            <strong>${selectedDay.budgetedSales}</strong> has been added for <strong>{selectedDay.dayName}</strong> ({selectedDay.date.format('MMM DD, YYYY')}).
          </p>
          <p style={{ marginBottom: '12px', color: '#666' }}>
            Would you like to add net actual sales for this date?
          </p>
          <Button 
            type="primary" 
            size="small" 
            icon={<DollarOutlined />}
            onClick={() => handleNavigateToDashboardSales(selectedDay)}
            style={{ 
              marginTop: '8px',
              backgroundColor: '#52c41a',
              borderColor: '#52c41a'
            }}
          >
            Add Sales Performance
            <ArrowRightOutlined />
          </Button>
        </div>
      ),
      duration: 0, // Don't auto-close
      placement: 'top',
      style: {
        width: 450,
        zIndex: 99999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '8px',
        marginTop: '20px',
      },
      onClose: () => {
        console.log('Top popup notification closed');
        setSelectedDayForSales(null);
      }
    });
  };

  // Handle navigation to dashboard sales modal
  const handleNavigateToDashboardSales = (selectedDay) => {
    // Close current modal
    onCancel();
    
    // Close the notification
    notification.destroy();
    
    // Navigate to dashboard with selected date
    // You can implement navigation logic here
    console.log('Navigating to dashboard sales with date:', selectedDay.date.format('YYYY-MM-DD'));
    
    // Show success message
    message.success(`Opening sales performance for ${selectedDay.dayName} (${selectedDay.date.format('MMM DD, YYYY')})`);
    
    // You can emit an event or use a callback to navigate to the dashboard
    // For now, we'll just show a message
    setTimeout(() => {
      message.info('Please navigate to Dashboard > Sales Performance to add/edit sales data');
    }, 2000);
  };

  // Handle daily data changes
  const handleDailyDataChange = (dayIndex, field, value) => {
    const newDailyData = [...formData.dailyData];
    newDailyData[dayIndex] = { ...newDailyData[dayIndex], [field]: value };
    
    setFormData({ 
      ...formData, 
      dailyData: newDailyData
    });

    // Track budgeted sales changes
    if (field === 'budgetedSales' && value > 0) {
      const changedDay = newDailyData[dayIndex];
      console.log('Budgeted sales changed:', { field, value, changedDay }); // Debug log
      
      // Show immediate feedback
      message.success(`Budgeted sales of $${value} added for ${changedDay.dayName}`);
      
      // Show top popup notification after 2 seconds
      setTimeout(() => {
        setSelectedDayForSales(changedDay);
        showTopPopupNotification(changedDay);
      }, 2000);
    }
  };

  // Handle weekly totals changes
  const handleWeeklyTotalsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      weeklyTotals: {
        ...prev.weeklyTotals,
        [field]: value
      }
    }));
  };

  // Calculate weekly totals from daily data
  const calculateWeeklyTotals = () => {
    if (!formData.dailyData || formData.dailyData.length === 0) {
      const currentProviders = getProviders();
      return {
        budgetedSales: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,
        dailyTickets: 0,
        netSalesActual: 0,
        ...currentProviders.reduce((acc, provider) => {
          const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
          acc[providerKey] = 0;
          return acc;
        }, {})
      };
    }

    const currentProviders = getProviders();
    const totals = formData.dailyData.reduce((acc, day) => {
      acc.budgetedSales += parseFloat(day.budgetedSales) || 0;
      acc.actualSalesInStore += parseFloat(day.actualSalesInStore) || 0;
      acc.actualSalesAppOnline += parseFloat(day.actualSalesAppOnline) || 0;
      acc.dailyTickets += parseFloat(day.dailyTickets) || 0;
      
      // Add dynamic provider totals
      currentProviders.forEach(provider => {
        const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
        if (!acc[providerKey]) acc[providerKey] = 0;
        acc[providerKey] += parseFloat(day[providerKey]) || 0;
      });
      
      return acc;
    }, {
      budgetedSales: 0,
      actualSalesInStore: 0,
      actualSalesAppOnline: 0,
      dailyTickets: 0,
      ...currentProviders.reduce((acc, provider) => {
        const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
        acc[providerKey] = 0;
        return acc;
      }, {})
    });

    // Calculate net sales actual
    const allSalesFields = ['actualSalesInStore', 'actualSalesAppOnline'];
    currentProviders.forEach(provider => {
      const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
      allSalesFields.push(providerKey);
    });
    
    totals.netSalesActual = allSalesFields.reduce((sum, field) => sum + (totals[field] || 0), 0);
    
    return totals;
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!formData.dailyData || formData.dailyData.length === 0) {
        message.warning('Please add sales data before saving.');
        return;
      }

      const weeklyTotals = calculateWeeklyTotals();
      const startDate = selectedWeekData?.startDate ? dayjs(selectedWeekData.startDate) : dayjs();
      const currentProviders = getProviders();

      // Transform data to API format with proper null checks
      const transformedData = {
        week_start: startDate.format('YYYY-MM-DD'),
        section: "Sales Performance",
        section_data: {
          weekly: {
            sales_budget: (weeklyTotals.budgetedSales || 0).toFixed(2),
            actual_sales_in_store: (weeklyTotals.actualSalesInStore || 0).toFixed(2),
            actual_sales_app_online: (weeklyTotals.actualSalesAppOnline || 0).toFixed(2),
            net_sales_actual: (weeklyTotals.netSalesActual || 0).toFixed(2),
            daily_tickets: weeklyTotals.dailyTickets || 0,
            average_daily_ticket: weeklyTotals.dailyTickets > 0 ? ((weeklyTotals.netSalesActual || 0) / weeklyTotals.dailyTickets).toFixed(2) : '0.00',
            // Add dynamic provider fields to weekly data
            ...currentProviders.reduce((acc, provider) => {
              const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
              acc[`actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`] = (weeklyTotals[providerKey] || 0).toFixed(2);
              return acc;
            }, {})
          },
          daily: formData.dailyData.map(day => {
            const dailyData = {
              date: day.date.format('YYYY-MM-DD'),
              day: day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1),
              sales_budget: (parseFloat(day.budgetedSales) || 0).toFixed(2),
              actual_sales_in_store: (parseFloat(day.actualSalesInStore) || 0).toFixed(2),
              actual_sales_app_online: (parseFloat(day.actualSalesAppOnline) || 0).toFixed(2),
              daily_tickets: parseFloat(day.dailyTickets) || 0,
              // Add dynamic provider fields to daily data
              ...currentProviders.reduce((acc, provider) => {
                const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                acc[`actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`] = (parseFloat(day[providerKey]) || 0).toFixed(2);
                return acc;
              }, {})
            };

            // Calculate net sales actual including dynamic providers
            const baseSales = (parseFloat(day.actualSalesInStore) || 0) + (parseFloat(day.actualSalesAppOnline) || 0);
            const providerSales = currentProviders.reduce((sum, provider) => {
              const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
              return sum + (parseFloat(day[providerKey]) || 0);
            }, 0);
            dailyData.net_sales_actual = (baseSales + providerSales).toFixed(2);

            return dailyData;
          })
        }
      };

      await saveDashboardData(transformedData);
      message.success('Sales data saved successfully!');
      
      // Call the callback to refresh data
      if (onDataSaved) {
        onDataSaved();
      }
      
      onCancel();
    } catch (error) {
      console.error('Error saving sales data:', error);
      message.error(`Failed to save sales data: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate actual sales budget ratio
  const calculateActualSalesBudget = (budgetedSales, netSales) => {
    if (budgetedSales === 0) return 0;
    return ((netSales - budgetedSales) / budgetedSales) * 100;
  };

  // Calculate average daily ticket
  const calculateAverageDailyTicket = (netSales, dailyTickets) => {
    if (dailyTickets === 0) return 0;
    return Math.round(netSales / dailyTickets);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CalculatorOutlined className="text-blue-500" />
          <span>Add Sales Data for Week {selectedWeekData?.weekNumber || ''}</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          icon={<SaveOutlined />}
          onClick={handleSubmit} 
          loading={isSubmitting || storeLoading}
        >
          Save Sales Data
        </Button>
      ]}
      width="90vw"
      style={{ maxWidth: '1200px' }}
      destroyOnClose
    >
      {(isSubmitting || storeLoading) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">Saving sales data...</p>
          </div>
        </div>
      )}

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Weekly Totals Section - Only show when not auto-opened from summary */}
        {!autoOpenFromSummary && (
          <Card title="Weekly Totals" size="small">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div>
                  <Text strong className="text-sm">Sales Budget:</Text>
                  <Input
                    type="number"
                    value={formData.weeklyTotals.salesBudget}
                    onChange={(e) => handleWeeklyTotalsChange('salesBudget', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div>
                  <Text strong className="text-sm">Actual Sales - In Store:</Text>
                  <Input
                    type="number"
                    value={formData.weeklyTotals.actualSalesInStore}
                    onChange={(e) => handleWeeklyTotalsChange('actualSalesInStore', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div>
                  <Text strong className="text-sm">Actual Sales - App/Online:</Text>
                  <Input
                    type="number"
                    value={formData.weeklyTotals.actualSalesAppOnline}
                    onChange={(e) => handleWeeklyTotalsChange('actualSalesAppOnline', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div>
                  <Text strong className="text-sm">Daily Tickets:</Text>
                  <Input
                    type="number"
                    value={formData.weeklyTotals.dailyTickets}
                    onChange={(e) => handleWeeklyTotalsChange('dailyTickets', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </Col>
            </Row>

            {/* Dynamic Provider Fields */}
            {getProviders().length > 0 && (
              <>
                <Divider orientation="left">Third Party Sales</Divider>
                <Row gutter={[16, 16]}>
                  {getProviders().map((provider) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={provider.provider_name}>
                      <div>
                        <Text strong className="text-sm">Actual Sales - {provider.provider_name}:</Text>
                        <Input
                          type="number"
                          value={formData.weeklyTotals[`actualSales${provider.provider_name.replace(/\s+/g, '')}`] || 0}
                          onChange={(e) => {
                            const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                            handleWeeklyTotalsChange(providerKey, parseFloat(e.target.value) || 0);
                          }}
                          prefix="$"
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Card>
        )}

        {/* Daily Data Table */}
        <Card 
          title="Daily Sales Data"
          size="small"
        >
          <div className="overflow-x-auto">
            <Table
              dataSource={formData.dailyData}
              pagination={false}
              size="small"
              rowKey={(record) => record.key}
              scroll={{ x: 'max-content' }}
              summary={(pageData) => {
                const currentProviders = getProviders();
                const totals = pageData.reduce((acc, record) => {
                  acc.budgetedSales += parseFloat(record.budgetedSales) || 0;
                  acc.actualSalesInStore += parseFloat(record.actualSalesInStore) || 0;
                  acc.actualSalesAppOnline += parseFloat(record.actualSalesAppOnline) || 0;
                  acc.dailyTickets += parseFloat(record.dailyTickets) || 0;
                  
                  currentProviders.forEach(provider => {
                    const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                    if (!acc[providerKey]) acc[providerKey] = 0;
                    acc[providerKey] += parseFloat(record[providerKey]) || 0;
                  });
                  
                  return acc;
                }, {
                  budgetedSales: 0,
                  actualSalesInStore: 0,
                  actualSalesAppOnline: 0,
                  dailyTickets: 0,
                  ...currentProviders.reduce((acc, provider) => {
                    const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                    acc[providerKey] = 0;
                    return acc;
                  }, {})
                });

                const netSalesActualTotal = totals.actualSalesInStore + totals.actualSalesAppOnline + 
                  currentProviders.reduce((sum, provider) => {
                    const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                    return sum + totals[providerKey];
                  }, 0);

                if (autoOpenFromSummary) {
                  // Only show budgeted sales total when auto-opened from summary
                  return (
                    <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                      <Table.Summary.Cell index={0}>
                        <Text strong style={{ color: '#1890ff' }}>TOTAL</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong style={{ color: '#1890ff' }}>${totals.budgetedSales.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }

                // Show all totals when not auto-opened from summary
                return (
                  <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                    <Table.Summary.Cell index={0}>
                      <Text strong style={{ color: '#1890ff' }}>TOTAL</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ color: '#1890ff' }}>${totals.budgetedSales.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text strong style={{ color: '#1890ff' }}>${totals.actualSalesInStore.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Text strong style={{ color: '#1890ff' }}>${totals.actualSalesAppOnline.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                    {currentProviders.map((provider, index) => {
                      const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                      return (
                        <Table.Summary.Cell key={providerKey} index={4 + index}>
                          <Text strong style={{ color: '#1890ff' }}>${totals[providerKey]?.toFixed(2) || '0.00'}</Text>
                        </Table.Summary.Cell>
                      );
                    })}
                    <Table.Summary.Cell index={4 + currentProviders.length}>
                      <Text strong style={{ color: '#1890ff' }}>${netSalesActualTotal.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5 + currentProviders.length}>
                      <Text strong style={{ color: '#1890ff' }}>{totals.dailyTickets.toFixed(0)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6 + currentProviders.length}>
                      <Text strong style={{ color: '#1890ff' }}>
                        {totals.budgetedSales > 0 && netSalesActualTotal > 0 
                          ? calculateActualSalesBudget(totals.budgetedSales, netSalesActualTotal).toFixed(1) 
                          : '0.0'}%
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7 + currentProviders.length}>
                      <Text strong style={{ color: '#1890ff' }}>
                        {totals.dailyTickets > 0 
                          ? calculateAverageDailyTicket(netSalesActualTotal, totals.dailyTickets) 
                          : 0}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
              columns={autoOpenFromSummary ? [
                // Only show Day and Budgeted Sales when auto-opened from summary
                {
                  title: 'Day',
                  dataIndex: 'dayName',
                  key: 'dayName',
                  width: 120,
                  fixed: 'left',
                  render: (text, record) => (
                    <div>
                      <div className="font-medium">{text}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.date.format('MMM DD, YYYY')}
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Budgeted Sales',
                  dataIndex: 'budgetedSales',
                  key: 'budgetedSales',
                  width: 120,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'budgetedSales', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full"
                    />
                  )
                }
              ] : [
                // Show all columns when not auto-opened from summary
                {
                  title: 'Day',
                  dataIndex: 'dayName',
                  key: 'dayName',
                  width: 120,
                  fixed: 'left',
                  render: (text, record) => (
                    <div>
                      <div className="font-medium">{text}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.date.format('MMM DD, YYYY')}
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Budgeted Sales',
                  dataIndex: 'budgetedSales',
                  key: 'budgetedSales',
                  width: 120,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'budgetedSales', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full"
                    />
                  )
                },
                {
                  title: 'Actual Sales - In Store',
                  dataIndex: 'actualSalesInStore',
                  key: 'actualSalesInStore',
                  width: 150,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'actualSalesInStore', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full"
                    />
                  )
                },
                {
                  title: 'Actual Sales - App/Online',
                  dataIndex: 'actualSalesAppOnline',
                  key: 'actualSalesAppOnline',
                  width: 150,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'actualSalesAppOnline', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full"
                    />
                  )
                },
                // Dynamic Provider Columns
                ...getProviders().map(provider => ({
                  title: `Actual Sales - ${provider.provider_name}`,
                  dataIndex: `actualSales${provider.provider_name.replace(/\s+/g, '')}`,
                  key: `actualSales${provider.provider_name.replace(/\s+/g, '')}`,
                  width: 150,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, `actualSales${provider.provider_name.replace(/\s+/g, '')}`, parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full"
                    />
                  )
                })),
                {
                  title: 'Net Sales - Actual (Auto-calculated)',
                  dataIndex: 'netSalesActual',
                  key: 'netSalesActual',
                  width: 150,
                  render: (value, record) => {
                    const currentProviders = getProviders();
                    const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                    const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                    const providerSales = currentProviders.reduce((sum, provider) => {
                      const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                      return sum + (parseFloat(record[providerKey]) || 0);
                    }, 0);
                    const calculatedNetSales = actualSalesInStore + actualSalesAppOnline + providerSales;
                    return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${calculatedNetSales.toFixed(2)}</Text>;
                  }
                },
                {
                  title: '# Daily Tickets',
                  dataIndex: 'dailyTickets',
                  key: 'dailyTickets',
                  width: 150,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'dailyTickets', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full"
                    />
                  )
                },
                {
                  title: 'Actual Sales Budget (%)',
                  dataIndex: 'actualSalesBudget',
                  key: 'actualSalesBudget',
                  width: 150,
                  render: (value, record) => {
                    const currentProviders = getProviders();
                    const budgetedSales = parseFloat(record.budgetedSales) || 0;
                    const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                    const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                    const providerSales = currentProviders.reduce((sum, provider) => {
                      const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                      return sum + (parseFloat(record[providerKey]) || 0);
                    }, 0);
                    const netSales = actualSalesInStore + actualSalesAppOnline + providerSales;
                    const actualSalesBudget = calculateActualSalesBudget(budgetedSales, netSales);
                    return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>{actualSalesBudget.toFixed(1)}%</Text>;
                  }
                },
                {
                  title: 'Average Daily Ticket',
                  dataIndex: 'averageDailyTicket',
                  key: 'averageDailyTicket',
                  width: 150,
                  render: (value, record) => {
                    const currentProviders = getProviders();
                    const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                    const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                    const providerSales = currentProviders.reduce((sum, provider) => {
                      const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                      return sum + (parseFloat(record[providerKey]) || 0);
                    }, 0);
                    const netSales = actualSalesInStore + actualSalesAppOnline + providerSales;
                    const dailyTickets = parseFloat(record.dailyTickets) || 0;
                    const avgDailyTicket = calculateAverageDailyTicket(netSales, dailyTickets);
                    return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>{avgDailyTicket}</Text>;
                  }
                }
              ]}
            />
          </div>
        </Card>
      </Space>
    </Modal>
  );
};

export default SalesDataModal;
