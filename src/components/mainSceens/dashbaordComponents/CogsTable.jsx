import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Table, Card, Row, Col, Typography, Space, Divider, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../../store/store';

const { Title, Text } = Typography;

// Helper function to format numbers properly and avoid floating-point precision issues
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100; // Round to 2 decimal places
};

// Helper function to handle input changes with proper formatting
const handleNumberInput = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const CogsTable = ({ selectedDate }) => {
  const [weeklyTotals, setWeeklyTotals] = useState({
    cogsBudget: 0,
    cogsActual: 0,
    cogsPercentage: 0,
    weeklyRemainingCog: 0
  });

  const [weeklyData, setWeeklyData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);
  const [dataNotFound, setDataNotFound] = useState(false);

  // Store integration
  const { 
    fetchDashboardData, 
    saveDashboardData, 
    loading: storeLoading, 
    error: storeError 
  } = useStore();

  // Load data when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      loadCogsData();
    }
  }, [selectedDate]);

  // Load COGS data
  const loadCogsData = async () => {
    try {
      setDataNotFound(false);
      const data = await fetchDashboardData(selectedDate.format('YYYY-MM-DD'));
      
      console.log('API Response:', data);
      console.log('COGS Performance data:', data?.["COGS Performance"]);
      
      if (data && data["COGS Performance"]) {
        // Extract weekly totals from the API response
        const cogsPerformance = data["COGS Performance"];
        console.log('COGS Performance object:', cogsPerformance);
        
        const weeklyTotals = {
          cogsBudget: formatNumber(cogsPerformance?.cogs_budget || cogsPerformance?.cogs_budget || 0),
          cogsActual: formatNumber(cogsPerformance?.cogs_actual || cogsPerformance?.cogs_actual || 0),
          cogsPercentage: 0, // Will be calculated
          weeklyRemainingCog: formatNumber(cogsPerformance?.weekly_remaining_cog || cogsPerformance?.weekly_remaining_cog || 0)
        };

        console.log('Extracted weekly totals:', weeklyTotals);

        // Calculate percentage
        weeklyTotals.cogsPercentage = weeklyTotals.cogsBudget > 0 ? 
          (weeklyTotals.cogsActual / weeklyTotals.cogsBudget) * 100 : 0;

        // Extract all daily entries into one consolidated table
        const allDailyEntries = data.daily_entries?.map((entry) => ({
          key: `day-${entry.date}`,
          date: dayjs(entry.date),
          dayName: dayjs(entry.date).format('dddd').toLowerCase(),
          budget: formatNumber(entry["COGS Performance"]?.cogs_budget || 0),
          actual: formatNumber(entry["COGS Performance"]?.cogs_actual || 0)
        })) || [];
        
        console.log('Daily entries:', allDailyEntries);
        
        setWeeklyData([{
          id: 'consolidated-week',
          weekTitle: 'Weekly COGS Data',
          startDate: selectedDate,
          dailyData: allDailyEntries,
          weeklyTotals: weeklyTotals
        }]);
        
        // Set the weekly totals
        setWeeklyTotals(weeklyTotals);
        
        console.log('Set weekly totals to:', weeklyTotals);
      } else {
        console.log('No COGS Performance data found');
        console.log('Available keys in data:', Object.keys(data || {}));
        // Initialize with default structure
        setWeeklyData([]);
        setWeeklyTotals({
          cogsBudget: 0,
          cogsActual: 0,
          cogsPercentage: 0,
          weeklyRemainingCog: 0
        });
      }
    } catch (error) {
      console.error('Error loading COGS data:', error);
      // Check if it's a 404 error
      if (error.response && error.response.status === 404) {
        setDataNotFound(true);
        setWeeklyData([]);
        setWeeklyTotals({
          cogsBudget: 0,
          cogsActual: 0,
          cogsPercentage: 0,
          weeklyRemainingCog: 0
        });
        message.info('No COGS data found for the selected period.');
      } else {
        message.error(`Failed to load COGS data: ${error.message}`);
      }
    }
  };

  // Save COGS data
  const saveData = async () => {
    try {
      // Only save the current week's data (first week in the array)
      const currentWeek = weeklyData.length > 0 ? weeklyData[0] : null;
      
      if (!currentWeek || !currentWeek.dailyData) {
        message.warning('No weekly data to save. Please add weekly COGS data first.');
        return;
      }

      // Use the weekly totals from the form data
      const weeklyTotals = currentWeek.weeklyTotals || {
        cogsBudget: 0,
        cogsActual: 0,
        cogsPercentage: 0,
        weeklyRemainingCog: 0
      };

      // Calculate final totals for this week
      const finalTotals = {
        cogsBudget: weeklyTotals.cogsBudget,
        cogsActual: weeklyTotals.cogsActual,
        cogsPercentage: weeklyTotals.cogsBudget > 0 ? (weeklyTotals.cogsActual / weeklyTotals.cogsBudget) * 100 : 0,
        weeklyRemainingCog: Math.max(0, weeklyTotals.cogsBudget - weeklyTotals.cogsActual)
      };

      // Transform data to API format - only save the current week's daily data
      const transformedData = {
        week_start: selectedDate.format('YYYY-MM-DD'),
        section: "COGS Performance",
        section_data: {
          cogs_budget: finalTotals.cogsBudget.toFixed(2),
          cogs_actual: finalTotals.cogsActual.toFixed(2),
          cogs_percentage: finalTotals.cogsPercentage.toFixed(1),
          weekly_remaining_cog: finalTotals.weeklyRemainingCog.toFixed(2),
          daily: currentWeek.dailyData.map(day => ({
            date: day.date.format('YYYY-MM-DD'),
            day: day.date.format('dddd'),
            cogs_budget: (day.budget || 0).toFixed(2),
            cogs_actual: (day.actual || 0).toFixed(2),
            weekly_remaining_cog: "0.00"
          }))
        }
      };

      await saveDashboardData(transformedData);
      message.success('COGS data saved successfully!');
      await loadCogsData();
    } catch (error) {
      message.error(`Failed to save COGS data: ${error.message}`);
    }
  };

  // Handle weekly data modal
  const showAddWeeklyModal = () => {
    setEditingWeek(null);
    setIsModalVisible(true);
  };

  const showEditWeeklyModal = (weekData) => {
    setEditingWeek(weekData);
    setIsModalVisible(true);
  };

  const handleWeeklySubmit = (weekData) => {
    if (editingWeek) {
      // Edit existing week
      setWeeklyData(prev => prev.map(week => 
        week.id === editingWeek.id ? { ...weekData, id: week.id } : week
      ));
    } else {
      // Add new week
      const newWeek = {
        ...weekData,
        id: Date.now(),
        weekNumber: weeklyData.length + 1
      };
      setWeeklyData(prev => [...prev, newWeek]);
    }
    setIsModalVisible(false);
    setEditingWeek(null);
  };

  const deleteWeek = (weekId) => {
    setWeeklyData(prev => prev.filter(week => week.id !== weekId));
  };

  // Generate 7 days of data starting from a given date
  const generateDailyData = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = dayjs(startDate).add(i, 'day');
      days.push({
        key: `day-${currentDate.format('YYYY-MM-DD')}`,
        date: currentDate,
        dayName: currentDate.format('dddd').toLowerCase(),
        budget: 0,
        actual: 0
      });
    }
    return days;
  };

  // Weekly Modal Component
  const WeeklyModal = () => {
    const [weekFormData, setWeekFormData] = useState({
      weekTitle: '',
      startDate: dayjs(),
      dailyData: generateDailyData(dayjs()),
      weeklyTotals: {
        cogsBudget: 0,
        cogsActual: 0,
        cogsPercentage: 0,
        weeklyRemainingCog: 0
      }
    });

    useEffect(() => {
      if (editingWeek) {
        setWeekFormData(editingWeek);
      } else {
        setWeekFormData({
          weekTitle: `Week ${weeklyData.length + 1}`,
          startDate: dayjs(),
          dailyData: generateDailyData(dayjs()),
          weeklyTotals: {
            cogsBudget: 0,
            cogsActual: 0,
            cogsPercentage: 0,
            weeklyRemainingCog: 0
          }
        });
      }
    }, [editingWeek, weeklyData.length]);

    // Calculate weekly totals from daily data
    const calculateWeeklyTotals = (dailyData) => {
      const totals = dailyData.reduce((acc, day) => ({
        budget: acc.budget + (formatNumber(day.budget) || 0),
        actual: acc.actual + (formatNumber(day.actual) || 0)
      }), {
        budget: 0,
        actual: 0
      });

      const cogsPercentage = totals.budget > 0 ? (totals.actual / totals.budget) * 100 : 0;
      const weeklyRemainingCog = Math.max(0, totals.budget - totals.actual);

      return {
        cogsBudget: totals.budget,
        cogsActual: totals.actual,
        cogsPercentage: cogsPercentage,
        weeklyRemainingCog: weeklyRemainingCog
      };
    };

    // Initialize weekly totals when editing existing week
    useEffect(() => {
      if (editingWeek && !weekFormData.weeklyTotals.cogsBudget && !weekFormData.weeklyTotals.cogsActual) {
        // Only initialize if weekly totals are not already set
        const totals = calculateWeeklyTotals(weekFormData.dailyData);
        setWeekFormData(prev => ({
          ...prev,
          weeklyTotals: totals
        }));
      }
    }, [editingWeek, weekFormData.dailyData]);

    // Update percentage and remaining COGS when weekly totals change
    useEffect(() => {
      const { cogsBudget, cogsActual } = weekFormData.weeklyTotals;
      const cogsPercentage = cogsBudget > 0 ? (cogsActual / cogsBudget) * 100 : 0;
      const weeklyRemainingCog = Math.max(0, cogsBudget - cogsActual);
      
      setWeekFormData(prev => ({
        ...prev,
        weeklyTotals: {
          ...prev.weeklyTotals,
          cogsPercentage: cogsPercentage,
          weeklyRemainingCog: weeklyRemainingCog
        }
      }));
    }, [weekFormData.weeklyTotals.cogsBudget, weekFormData.weeklyTotals.cogsActual]);

    const handleDailyDataChange = (dayIndex, field, value) => {
      const newDailyData = [...weekFormData.dailyData];
      newDailyData[dayIndex] = { ...newDailyData[dayIndex], [field]: value };
      setWeekFormData({ ...weekFormData, dailyData: newDailyData });
    };

    const handleSubmit = () => {
      handleWeeklySubmit(weekFormData);
    };

    return (
      <Modal
        title={editingWeek ? "Edit Weekly COGS Data" : "Add Weekly COGS Data"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            {editingWeek ? 'Update' : 'Add'} Week
          </Button>
        ]}
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">


          {/* Weekly Totals Section */}
          <Card title="Weekly Totals" size="small">
            <Row gutter={16}>
              <Col span={6}>
                <Text strong>Weekly COGS Budget:</Text>
                <Input
                  type='number'
                  value={formatNumber(weekFormData.weeklyTotals.cogsBudget)}
                  onChange={(e) => setWeekFormData({ 
                    ...weekFormData, 
                    weeklyTotals: { 
                      ...weekFormData.weeklyTotals, 
                      cogsBudget: handleNumberInput(e.target.value) 
                    } 
                  })}
                  prefix="$"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="mt-1"
                />
              </Col>
              <Col span={6}>
                <Text strong>Weekly COGS Actual:</Text>
                <Input
                  type='number'
                  value={formatNumber(weekFormData.weeklyTotals.cogsActual)}
                  onChange={(e) => setWeekFormData({ 
                    ...weekFormData, 
                    weeklyTotals: { 
                      ...weekFormData.weeklyTotals, 
                      cogsActual: handleNumberInput(e.target.value) 
                    } 
                  })}
                  prefix="$"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="mt-1"
                />
              </Col>
              <Col span={6}>
                <Text strong>COGS Percentage:</Text>
                <Input
                  type='number'
                  value={formatNumber(weekFormData.weeklyTotals.cogsPercentage)}
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                  prefix="%"
                  placeholder="0%"
                  step="0.1"
                  className="mt-1"
                />
              </Col>
              <Col span={6}>
                <Text strong>Weekly Remaining COGS:</Text>
                <Input
                  type='number'
                  value={formatNumber(weekFormData.weeklyTotals.weeklyRemainingCog)}
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                  prefix="$"
                  placeholder="0.00"
                  step="0.01"
                  className="mt-1"
                />
              </Col>
            </Row>
          </Card>

          {/* Comparison Section
          <Card title="Daily vs Weekly Comparison" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Text strong>Daily Total Budget:</Text>
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: '#f0f8ff', 
                  borderRadius: '4px',
                  marginTop: '4px',
                  fontWeight: 'bold',
                  color: '#1890ff'
                }}>
                  ${(() => {
                    const dailyTotal = weekFormData.dailyData.reduce((sum, day) => sum + (formatNumber(day.budget) || 0), 0);
                    return formatNumber(dailyTotal).toFixed(2);
                  })()}
                </div>
              </Col>
              <Col span={8}>
                <Text strong>Daily Total Actual:</Text>
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: '#f0f8ff', 
                  borderRadius: '4px',
                  marginTop: '4px',
                  fontWeight: 'bold',
                  color: '#1890ff'
                }}>
                  ${(() => {
                    const dailyTotal = weekFormData.dailyData.reduce((sum, day) => sum + (formatNumber(day.actual) || 0), 0);
                    return formatNumber(dailyTotal).toFixed(2);
                  })()}
                </div>
              </Col>
              <Col span={8}>
                <Text strong>Difference:</Text>
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: '#fff2e8', 
                  borderRadius: '4px',
                  marginTop: '4px',
                  fontWeight: 'bold',
                  color: '#fa8c16'
                }}>
                  ${(() => {
                    const dailyTotal = weekFormData.dailyData.reduce((sum, day) => sum + (formatNumber(day.budget) || 0), 0);
                    const weeklyBudget = formatNumber(weekFormData.weeklyTotals.cogsBudget);
                    const difference = dailyTotal - weeklyBudget;
                    return formatNumber(difference).toFixed(2);
                  })()}
                </div>
              </Col>
            </Row>
          </Card> */}

          <Table
            dataSource={weekFormData.dailyData}
            pagination={false}
            size="small"
            rowKey={(record) => record.key || `modal-day-${record.date?.format('YYYY-MM-DD')}`}
            summary={(pageData) => {
              const totals = pageData.reduce((acc, record) => {
                acc.budget += formatNumber(record.budget) || 0;
                acc.actual += formatNumber(record.actual) || 0;
                return acc;
              }, {
                budget: 0,
                actual: 0
              });

              const cogsPercentage = totals.budget > 0 ? (totals.actual / totals.budget) * 100 : 0;
              const weeklyRemainingCog = Math.max(0, totals.budget - totals.actual);

              return (
                <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                  <Table.Summary.Cell index={0}>
                    <Text strong style={{ color: '#1890ff' }}>DAILY TOTAL</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong style={{ color: '#1890ff' }}>${formatNumber(totals.budget).toFixed(2)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text strong style={{ color: '#1890ff' }}>${formatNumber(totals.actual).toFixed(2)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Text strong style={{ color: cogsPercentage > 35 ? '#ff4d4f' : '#52c41a' }}>
                      {formatNumber(cogsPercentage).toFixed(1)}%
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Text strong style={{ color: '#1890ff' }}>${formatNumber(weeklyRemainingCog).toFixed(2)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
            columns={[
              {
                title: 'Day',
                dataIndex: 'dayName',
                key: 'dayName',
                width: 120,
                render: (text, record) => (
                  <div>
                    <div style={{ textTransform: 'capitalize' }}>{text}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {record.date.format('MMM DD, YYYY')}
                    </div>
                  </div>
                )
              },
              {
                title: 'COGS - Budget',
                dataIndex: 'budget',
                key: 'budget',
                width: 150,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={formatNumber(value)}
                    onChange={(e) => handleDailyDataChange(index, 'budget', handleNumberInput(e.target.value))}
                    prefix="$"
                    step="0.01"
                    min="0"
                  />
                )
              },
              {
                title: 'COGS - Actual',
                dataIndex: 'actual',
                key: 'actual',
                width: 150,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={formatNumber(value)}
                    onChange={(e) => handleDailyDataChange(index, 'actual', handleNumberInput(e.target.value))}
                    prefix="$"
                    step="0.01"
                    min="0"
                  />
                )
              },
              {
                title: 'COGS Percentage',
                dataIndex: 'cogsPercentage',
                key: 'cogsPercentage',
                width: 150,
                render: (value, record) => {
                  const budget = formatNumber(record.budget);
                  const actual = formatNumber(record.actual);
                  const percentage = budget > 0 ? (actual / budget) * 100 : 0;
                  return (
                    <Input
                      type="number"
                      value={formatNumber(percentage).toFixed(1)}
                      disabled
                      style={{ backgroundColor: '#f5f5f5' }}
                      prefix="%"
                    />
                  );
                }
              },
              {
                title: 'Remaining COGS',
                dataIndex: 'remainingCog',
                key: 'remainingCog',
                width: 150,
                render: (value, record) => {
                  const budget = formatNumber(record.budget);
                  const actual = formatNumber(record.actual);
                  const remaining = Math.max(0, budget - actual);
                  return (
                    <Input
                      type="number"
                      value={formatNumber(remaining).toFixed(2)}       
                      disabled     
                      prefix="$"
                    />
                  );
                }
              }
            ]}
          />
        </Space>
      </Modal>
    );
  };

  return (
    <div className="w-full">
      <div className="w-full mx-auto">
        <Title level={3} className="pl-2 pb-2">COGS Performance Dashboard</Title>
        
        {storeError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <Text type="danger">{storeError}</Text>
          </div>
        )}
        
        <Row gutter={24}>
          {/* Weekly Totals Section */}
          <Col span={6}>
            <Card title="Weekly COGS Totals" className="h-fit">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong>COGS Budget:</Text>
                  <Input
                    value={`$${formatNumber(weeklyTotals.cogsBudget).toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>COGS Actual:</Text>
                  <Input
                    value={`$${formatNumber(weeklyTotals.cogsActual).toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>COGS Percentage:</Text>
                  <Input
                    value={`${formatNumber(weeklyTotals.cogsPercentage).toFixed(1)}%`}
                    className="mt-1"
                    disabled
                    style={{ 
                      color: weeklyTotals.cogsPercentage > 35 ? '#ff4d4f' : '#52c41a',
                      backgroundColor: '#f5f5f5'
                    }}
                  />
                </div>
                
                <div>
                  <Text strong>Weekly Remaining COGS:</Text>
                  <Input
                    value={`$${formatNumber(weeklyTotals.weeklyRemainingCog).toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
              </Space>
            </Card>
          </Col>

          {/* Weekly Data Section */}
          <Col span={18}>
            <Card 
              title="Weekly COGS Data" 
              extra={
                <Space>
                  <Button 
                    onClick={loadCogsData}
                    loading={storeLoading}
                  >
                    Refresh
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={saveData}
                    loading={storeLoading}
                  >
                    Save Data
                  </Button>
                  <Button 
                    type="default" 
                    icon={<PlusOutlined />} 
                    onClick={showAddWeeklyModal}
                  >
                    Add Weekly COGS
                  </Button>
                </Space>
              }
            >
              {dataNotFound ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No COGS data found for the selected period."
                />
              ) : (
                weeklyData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalculatorOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <div>No weekly COGS data added yet. Click "Add Weekly COGS" to get started.</div>
                  </div>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {weeklyData.map((week) => {
                      const totals = week.dailyData.reduce((acc, day) => ({
                        budget: acc.budget + (formatNumber(day.budget) || 0),
                        actual: acc.actual + (formatNumber(day.actual) || 0)
                      }), {
                        budget: 0,
                        actual: 0
                      });

                      return (
                        <Card 
                          key={week.id || `week-${week.weekTitle}`} 
                          size="small" 
                          title={week.weekTitle}
                          extra={
                            <Space>
                              <Text type="secondary">
                                Total: ${formatNumber(totals.actual).toFixed(2)}
                              </Text>
                              <Button 
                                size="small" 
                                icon={<EditOutlined />} 
                                onClick={() => showEditWeeklyModal(week)}
                              >
                                Edit
                              </Button>
                              <Button 
                                size="small" 
                                danger 
                                icon={<DeleteOutlined />} 
                                onClick={() => deleteWeek(week.id)}
                              >
                                Delete
                              </Button>
                            </Space>
                          }
                        >
                          <Table
                            dataSource={week.dailyData || []}
                            pagination={false}
                            size="small"
                            rowKey={(record) => record.key || `day-${record.date?.format('YYYY-MM-DD')}`}
                            summary={(pageData) => {
                              const totals = pageData.reduce((acc, record) => {
                                acc.budget += formatNumber(record.budget) || 0;
                                acc.actual += formatNumber(record.actual) || 0;
                                return acc;
                              }, {
                                budget: 0,
                                actual: 0
                              });

                              const cogsPercentage = totals.budget > 0 ? (totals.actual / totals.budget) * 100 : 0;
                              const weeklyRemainingCog = Math.max(0, totals.budget - totals.actual);

                              return (
                                <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                                  <Table.Summary.Cell index={0}>
                                    <Text strong style={{ color: '#1890ff' }}>TOTAL</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={1}>
                                    <Text strong style={{ color: '#1890ff' }}>${formatNumber(totals.budget).toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={2}>
                                    <Text strong style={{ color: '#1890ff' }}>${formatNumber(totals.actual).toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={3}>
                                    <Text strong style={{ color: cogsPercentage > 35 ? '#ff4d4f' : '#52c41a' }}>
                                      {formatNumber(cogsPercentage).toFixed(1)}%
                                    </Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={4}>
                                    <Text strong style={{ color: '#1890ff' }}>${formatNumber(weeklyRemainingCog).toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                </Table.Summary.Row>
                              );
                            }}
                            columns={[
                              {
                                title: 'Day',
                                dataIndex: 'dayName',
                                key: 'dayName',
                                width: 120,
                                render: (text, record) => (
                                  <div>
                                    <div style={{ textTransform: 'capitalize' }}>{text}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                      {record.date.format('MMM DD, YYYY')}
                                    </div>
                                  </div>
                                )
                              },
                              {
                                title: 'COGS - Budget',
                                dataIndex: 'budget',
                                key: 'budget',
                                width: 120,
                                render: (value) => <Text>${formatNumber(value).toFixed(2)}</Text>
                              },
                              {
                                title: 'COGS - Actual',
                                dataIndex: 'actual',
                                key: 'actual',
                                width: 150,
                                render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${formatNumber(value).toFixed(2)}</Text>
                              },
                              {
                                title: 'COGS Percentage',
                                dataIndex: 'cogsPercentage',
                                key: 'cogsPercentage',
                                width: 150,
                                render: (value, record) => {
                                  const budget = formatNumber(record.budget);
                                  const actual = formatNumber(record.actual);
                                  const percentage = budget > 0 ? (actual / budget) * 100 : 0;
                                  return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>{formatNumber(percentage).toFixed(1)}%</Text>;
                                }
                              },
                              {
                                title: 'Remaining COGS',
                                dataIndex: 'remainingCog',
                                key: 'remainingCog',
                                width: 150,
                                render: (value, record) => {
                                  const budget = formatNumber(record.budget);
                                  const actual = formatNumber(record.actual);
                                  const remaining = Math.max(0, budget - actual);
                                  return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${formatNumber(remaining).toFixed(2)}</Text>;
                                }
                              }
                            ]}
                          />
                        </Card>
                      );
                    })}
                  </Space>
                )
              )}
            </Card>
          </Col>
        </Row>
      </div>

      <WeeklyModal />
    </div>
  );
};

export default CogsTable;
