import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Table, Card, Row, Col, Typography, Space, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const CogsTable = () => {
  const [monthlyData, setMonthlyData] = useState({
    cogsBudget: 2790,
    cogsActual: 2500,
    cogsPercentage: 31,
    weeklyRemainingCog: 0
  });

  const [weeklyData, setWeeklyData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);
  const [selectedMonth] = useState(dayjs());

  // Calculate COGS percentage
  const calculateCogsPercentage = (actual, budget) => {
    if (budget === 0) return 0;
    return (actual / budget) * 100;
  };

  const cogsPercentageActual = calculateCogsPercentage(monthlyData.cogsActual, monthlyData.cogsBudget);

  // Handle monthly data changes
  const handleMonthlyDataChange = (field, value) => {
    setMonthlyData(prev => ({ ...prev, [field]: value }));
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



  // Calculate remaining COGS for each week
  const calculateRemainingCogs = (weekIndex) => {
    let remaining = monthlyData.cogsBudget;
    
    // Subtract all actual COGS up to this week
    for (let i = 0; i <= weekIndex; i++) {
      if (weeklyData[i]) {
        remaining -= weeklyData[i].actual || 0;
      }
    }
    
    return Math.max(0, remaining);
  };

  // Generate 7 days of data starting from a given date
  const generateDailyData = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = dayjs(startDate).add(i, 'day');
      days.push({
        date: currentDate,
        dayName: currentDate.format('dddd'),
        budget: 0,
        actual: 0
      });
    }
    return days;
  };

  // Generate weekly data structure
  const generateWeeklyData = () => {
    return weeklyData.map((week, index) => ({
      ...week,
      remaining: calculateRemainingCogs(index)
    }));
  };

  // Weekly Modal Component
  const WeeklyModal = () => {
    const [weekFormData, setWeekFormData] = useState({
      weekTitle: '',
      startDate: dayjs(),
      dailyData: generateDailyData(dayjs())
    });

    useEffect(() => {
      if (editingWeek) {
        setWeekFormData(editingWeek);
      } else {
        setWeekFormData({
          weekTitle: `Week ${weeklyData.length + 1}`,
          startDate: dayjs(),
          dailyData: generateDailyData(dayjs())
        });
      }
    }, [editingWeek, weeklyData.length]);

    const handleDailyDataChange = (dayIndex, field, value) => {
      const newDailyData = [...weekFormData.dailyData];
      newDailyData[dayIndex] = { ...newDailyData[dayIndex], [field]: value };
      setWeekFormData({ ...weekFormData, dailyData: newDailyData });
    };

    const handleStartDateChange = (date) => {
      setWeekFormData({
        ...weekFormData,
        startDate: date,
        dailyData: generateDailyData(date)
      });
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
        width={1200}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Week Title:</Text>
              <Input
                value={weekFormData.weekTitle}
                onChange={(e) => setWeekFormData({ ...weekFormData, weekTitle: e.target.value })}
                placeholder="Enter week title"
              />
            </Col>
            <Col span={12}>
              <Text strong>Start Date:</Text>
              <DatePicker
                value={weekFormData.startDate}
                onChange={handleStartDateChange}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>

          <Divider>Daily COGS Data</Divider>

          <Table
            dataSource={weekFormData.dailyData}
            pagination={false}
            size="small"
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
                title: 'COGS - Budget',
                dataIndex: 'budget',
                key: 'budget',
                width: 150,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'budget', parseFloat(e.target.value) || 0)}
                    prefix="$"
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
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'actual', parseFloat(e.target.value) || 0)}
                    prefix="$"
                  />
                )
              },
              {
                title: 'Daily Remaining COG',
                key: 'remaining',
                width: 150,
                render: (record) => {
                  const weekIndex = editingWeek ? weeklyData.findIndex(w => w.id === editingWeek.id) : weeklyData.length;
                  const remaining = calculateRemainingCogs(weekIndex) - (record.actual || 0);
                  return <Text strong style={{ color: '#1890ff' }}>${Math.max(0, remaining).toFixed(2)}</Text>;
                }
              }
            ]}
          />
        </Space>
      </Modal>
    );
  };

  const displayWeeklyData = generateWeeklyData();

  return (
    <div className="min-h-screen w-full">
      <div className="w-full mx-auto">
        <Title level={3} className="pl-2 pb-2">COGS Performance Dashboard</Title>
        
        <Row gutter={24}>
          {/* Monthly Summary Section */}
          <Col span={8}>
            <Card 
              title={
                <div>
                  COGS @ {monthlyData.cogsPercentage}%: {selectedMonth.format('MMM-YY')}
                </div>
              } 
              className="h-fit"
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong>COGS - Budget:</Text>
                  <Input
                    type="number"
                    value={monthlyData.cogsBudget}
                    onChange={(e) => handleMonthlyDataChange('cogsBudget', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Text strong>COGS - Actual:</Text>
                  <Input
                    type="number"
                    value={monthlyData.cogsActual}
                    onChange={(e) => handleMonthlyDataChange('cogsActual', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    className="mt-1"
                    style={{ backgroundColor: '#f0f8ff' }}
                  />
                </div>
                
                <div>
                  <Text strong>COGS %:</Text>
                  <Input
                    value={`${cogsPercentageActual.toFixed(0)}%`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#fff2f0', color: '#cf1322' }}
                  />
                </div>
                
                <div>
                  <Text strong>Weekly Remaining COG:</Text>
                  <Input
                    type="number"
                    value={monthlyData.weeklyRemainingCog}
                    onChange={(e) => handleMonthlyDataChange('weeklyRemainingCog', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    className="mt-1"
                  />
                </div>
              </Space>
            </Card>
          </Col>

          {/* Weekly Data Section */}
          <Col span={16}>
            <Card 
              title="Weekly COGS Breakdown" 
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={showAddWeeklyModal}
                >
                  Add Weekly COGS
                </Button>
              }
            >
              {weeklyData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalculatorOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>No weekly COGS data added yet. Click "Add Weekly COGS" to get started.</div>
                </div>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {displayWeeklyData.map((week) => {
                    const weekTotals = week.dailyData ? {
                      budget: week.dailyData.reduce((sum, day) => sum + (day.budget || 0), 0),
                      actual: week.dailyData.reduce((sum, day) => sum + (day.actual || 0), 0)
                    } : {
                      budget: week.budget || 0,
                      actual: week.actual || 0
                    };
                    
                    return (
                      <Card 
                        key={week.id} 
                        size="small" 
                        title={week.weekTitle}
                        extra={
                          <Space>
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
                              title: 'COGS - Budget',
                              dataIndex: 'budget',
                              key: 'budget',
                              width: 120,
                              render: (value) => <Text>${value?.toFixed(2) || '0.00'}</Text>
                            },
                            {
                              title: 'COGS - Actual',
                              dataIndex: 'actual',
                              key: 'actual',
                              width: 150,
                              render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${value?.toFixed(2) || '0.00'}</Text>
                            },
                            {
                              title: 'Daily Remaining COG',
                              key: 'remaining',
                              width: 150,
                              render: (record) => {
                                const weekIndex = displayWeeklyData.findIndex(w => w.id === week.id);
                                const remaining = calculateRemainingCogs(weekIndex) - (record.actual || 0);
                                return <Text strong style={{ color: '#1890ff' }}>${Math.max(0, remaining).toFixed(2)}</Text>;
                              }
                            }
                          ]}
                          summary={() => (
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0}>
                                <Text strong>Total</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={1}>
                                <Text strong>${weekTotals.budget.toFixed(2)}</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={2}>
                                <Text strong style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${weekTotals.actual.toFixed(2)}</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={3}>
                                <Text strong style={{ color: '#1890ff' }}>${week.remaining?.toFixed(2) || '0.00'}</Text>
                              </Table.Summary.Cell>
                            </Table.Summary.Row>
                          )}
                        />
                      </Card>
                    );
                  })}
                </Space>
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
