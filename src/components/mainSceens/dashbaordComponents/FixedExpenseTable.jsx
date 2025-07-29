import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalculatorOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../../store/store';

const { Title, Text } = Typography;

const FixedExpenseTable = ({ selectedDate }) => {
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
      loadDashboardData();
    }
  }, [selectedDate]);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setDataNotFound(false);
      const data = await fetchDashboardData(selectedDate.format('YYYY-MM-DD'));
      
      if (data && data['Expenses']) {
        // Extract weekly data from daily_entries
        const weeklyTableData = [{
          id: 'consolidated-week',
          weekTitle: 'Weekly Fixed Expenses Data',
          startDate: selectedDate,
          dailyData: data.daily_entries?.map(entry => ({
            date: dayjs(entry.date),
            dayName: dayjs(entry.date).format('dddd').toLowerCase(),
            fixedWeeklyExpenses: entry['Expenses']?.fixed_weekly_expenses || 0,

          })) || [],
          // Load weekly goals from API response
          weeklyTotals: {
            fixedWeeklyExpenses: parseFloat(data['Expenses']?.fixed_weekly_expenses) || 0,

          }
        }];
        setWeeklyData(weeklyTableData);
      } else {
        // No data found, reset to defaults
        setWeeklyData([]);
      }
    } catch (error) {
      // Check if it's a 404 error
      if (error.response && error.response.status === 404) {
        setDataNotFound(true);
        setWeeklyData([]);
        message.info('No fixed expenses data found for the selected period.');
      } else {
        message.error(`Failed to load fixed expenses data: ${error.message}`);
      }
    }
  };

  // Save dashboard data
  const saveData = async () => {
    try {
      // Only save the current week's data (first week in the array)
      const currentWeek = weeklyData.length > 0 ? weeklyData[0] : null;
      
      if (!currentWeek || !currentWeek.dailyData) {
        message.warning('No weekly data to save. Please add weekly Fixed Expenses data first.');
        return;
      }

      // Use the weekly totals from the form data
      const weeklyTotals = currentWeek.weeklyTotals || {
        fixedWeeklyExpenses: 0
      };

      // Calculate final totals for this week
      const finalTotals = {
        fixedWeeklyExpenses: weeklyTotals.fixedWeeklyExpenses
      };

      // Transform data to API format - only save the current week's daily data
      const transformedData = {
        week_start: selectedDate.format('YYYY-MM-DD'),
        section: "Expenses",
        section_data: {
          weekly: {
            fixed_weekly_expenses: finalTotals.fixedWeeklyExpenses
          },
          daily: currentWeek.dailyData.map(day => ({
            date: day.date.format('YYYY-MM-DD'),
            fixed_weekly_expenses: (day.fixedWeeklyExpenses || 0)
          }))
        }
      };

      await saveDashboardData(transformedData);
      message.success('Fixed expenses data saved successfully!');
      await loadDashboardData();
    } catch (error) {
      message.error(`Failed to save fixed expenses data: ${error.message}`);
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

  // Calculate weekly totals
  const calculateWeeklyTotals = (weekData) => {
    const totals = weekData.dailyData.reduce((acc, day) => ({
      fixedWeeklyExpenses: acc.fixedWeeklyExpenses + (parseFloat(day.fixedWeeklyExpenses) || 0),

    }), {
      fixedWeeklyExpenses: 0,
    });

    return totals;
  };

  // Generate 7 days of data starting from a given date
  const generateDailyData = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = dayjs(startDate).add(i, 'day');
      days.push({
        date: currentDate,
        dayName: currentDate.format('dddd'),
        fixedWeeklyExpenses: 0,

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
      // Add weekly totals for the modal
      weeklyTotals: {
        fixedWeeklyExpenses: 0,
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
            fixedWeeklyExpenses: 0,

          }
        });
      }
    }, [editingWeek, weeklyData.length]);

    const handleDailyDataChange = (dayIndex, field, value) => {
      const newDailyData = [...weekFormData.dailyData];
      newDailyData[dayIndex] = { ...newDailyData[dayIndex], [field]: value };
      setWeekFormData({ ...weekFormData, dailyData: newDailyData });
    };

    const handleSubmit = () => {
      handleWeeklySubmit(weekFormData);
    };

    // Calculate totals for the current week form from daily entries
    const weekTotals = calculateWeeklyTotals(weekFormData);

    return (
      <Modal
        title={editingWeek ? "Edit Weekly Fixed Expenses" : "Add Weekly Fixed Expenses"}
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
        width={1200}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">

          {/* Weekly Goals Input Section */}
          <Card title="Weekly Fixed Expenses Goals" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Text strong>Fixed Weekly Expenses:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.fixedWeeklyExpenses}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        fixedWeeklyExpenses: value
                      }
                    }));
                  }}
                  prefix="$"
                  placeholder="0.00"
                />
              </Col>
            </Row>
          </Card>

          {/* Weekly Totals Summary */}
          <Card size="small" title="Weekly Totals (Auto-calculated from daily entries)" style={{ backgroundColor: '#f8f9fa' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Text strong>Total Fixed Weekly Expenses:</Text>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                  ${weekTotals.fixedWeeklyExpenses.toFixed(2)}
                </div>
              </Col>
            </Row>
          </Card>

          <Table
            dataSource={weekFormData.dailyData}
            pagination={false}
            size="small"
            summary={(pageData) => {
              const totals = pageData.reduce((acc, record) => ({
                fixedWeeklyExpenses: acc.fixedWeeklyExpenses + (parseFloat(record.fixedWeeklyExpenses) || 0)
              }), {
                fixedWeeklyExpenses: 0
              });

              return (
                <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                  <Table.Summary.Cell index={0}>
                    <Text strong>Totals:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>${totals.fixedWeeklyExpenses.toFixed(2)}</Text>
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
                    <div>{text}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {record.date.format('MMM DD, YYYY')}
                    </div>
                  </div>
                )
              },
              {
                title: 'Fixed Weekly Expenses',
                dataIndex: 'fixedWeeklyExpenses',
                key: 'fixedWeeklyExpenses',
                width: 200,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'fixedWeeklyExpenses', parseFloat(e.target.value) || 0)}
                    prefix="$"
                  />
                )
              }
            ]}
          />
        </Space>
      </Modal>
    );
  };

  // Get weekly response values from API
  const getWeeklyResponseValues = () => {
    if (weeklyData.length > 0 && weeklyData[0].weeklyTotals) {
      return weeklyData[0].weeklyTotals;
    }
    return {
      fixedWeeklyExpenses: 0,
    };
  };

  const weeklyResponseValues = getWeeklyResponseValues();

  return (
    <div className="w-full">
      <div className="w-full mx-auto">
        <Title level={3} className="pl-2 pb-2">Fixed Expenses Dashboard</Title>
        
        {storeError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <Text type="danger">{storeError}</Text>
          </div>
        )}
        
        <Row gutter={24}>
          {/* Weekly Totals Section */}
          <Col span={6}>
            <Card title="Weekly Fixed Expenses Totals" className="h-fit">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong>Fixed Weekly Expenses:</Text>
                  <Input
                    value={`$${weeklyResponseValues.fixedWeeklyExpenses.toFixed(2)}`}
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
              title={`Fixed Expenses: ${selectedDate ? selectedDate.format('MMM-YY') : ''}`}
              extra={
                <Space>
                  <Button 
                    onClick={loadDashboardData}
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
                    Add Weekly Fixed Expenses
                  </Button>
                </Space>
              }
            >
              {dataNotFound ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No fixed expenses data found for the selected period."
                />
              ) : (
                weeklyData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <div>No weekly fixed expenses data added yet. Click "Add Weekly Fixed Expenses" to get started.</div>
                  </div>
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {weeklyData.map((week) => {
                      const totals = calculateWeeklyTotals(week);
                      return (
                        <Card 
                          key={week.id} 
                          size="small" 
                          title={week.weekTitle}
                          extra={
                            <Space>
                              <Text type="secondary">
                                Total: ${totals.fixedWeeklyExpenses.toFixed(2)}
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
                            summary={(pageData) => {
                              const weekTotals = pageData.reduce((acc, record) => ({
                                fixedWeeklyExpenses: acc.fixedWeeklyExpenses + (parseFloat(record.fixedWeeklyExpenses) || 0),

                              }), {
                                fixedWeeklyExpenses: 0,

                              });

                              return (
                                <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                                  <Table.Summary.Cell index={0}>
                                    <Text strong>Week Totals:</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={1}>
                                    <Text strong>${weekTotals.fixedWeeklyExpenses.toFixed(2)}</Text>
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
                                    <div>{text}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                      {record.date.format('MMM DD, YYYY')}
                                    </div>
                                  </div>
                                )
                              },
                              {
                                title: 'Fixed Weekly Expenses',
                                dataIndex: 'fixedWeeklyExpenses',
                                key: 'fixedWeeklyExpenses',
                                width: 200,
                                render: (value) => <Text>${(parseFloat(value) || 0).toFixed(2)}</Text>
                              },
                              
                           
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

export default FixedExpenseTable;
