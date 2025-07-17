import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const FixedExpenseTable = () => {
  const [monthlyData, setMonthlyData] = useState({
    fixedWeeklyExpenses: 0
  });

  const [weeklyData, setWeeklyData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  // Handle monthly data changes
  const handleMonthlyDataChange = (field, value) => {
    const newData = { ...monthlyData, [field]: value };
    setMonthlyData(newData);
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
    const totals = {
      fixedWeeklyExpenses: 0
    };

    weekData.dailyData.forEach(day => {
      totals.fixedWeeklyExpenses += day.fixedWeeklyExpenses || 0;
    });

    return totals;
  };

  // Generate 7 days of data starting from a given date
  const generateDailyData = (startDate) => {
    const days = [];
    const safeStartDate = startDate || dayjs();
    for (let i = 0; i < 7; i++) {
      const currentDate = dayjs(safeStartDate).add(i, 'day');
      days.push({
        date: currentDate,
        dayName: currentDate.format('dddd'),
        fixedWeeklyExpenses: 0
      });
    }
    return days;
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
        dailyData: generateDailyData(date || dayjs())
      });
    };

    const handleSubmit = () => {
      handleWeeklySubmit(weekFormData);
    };

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
        width={1000}
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

          <Divider>Daily Fixed Expenses</Divider>

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
                      {record.date ? record.date.format('MMM DD, YYYY') : ''}
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

  return (
    <div className="w-full">
      <div className="w-full mx-auto">
        <Title level={3} className="pl-2 pb-2">Fixed Expenses Dashboard</Title>
        
        <Row gutter={24}>
          {/* Monthly Totals Section */}
          <Col span={6}>
            <Card title="Monthly Totals For The Month Of:" className="h-fit">
              <div className="mb-4">
                <DatePicker
                  picker="month"
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  style={{ width: '100%' }}
                />
              </div>
              
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong>Fixed Weekly Expenses:</Text>
                  <Input
                    type="number"
                    value={monthlyData.fixedWeeklyExpenses}
                    onChange={(e) => handleMonthlyDataChange('fixedWeeklyExpenses', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    className="mt-1"
                  />
                </div>
              </Space>
            </Card>
          </Col>

          {/* Weekly Data Section */}
          <Col span={18}>
            <Card 
              title={`Fixed Expenses: ${selectedMonth ? selectedMonth.format('MMM-YY') : ''}`}
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={showAddWeeklyModal}
                >
                  Add Weekly Fixed Expenses
                </Button>
              }
            >
              {weeklyData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>No weekly fixed expenses added yet. Click "Add Weekly Fixed Expenses" to get started.</div>
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
                          dataSource={week.dailyData}
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
                                    {record.date ? record.date.format('MMM DD, YYYY') : ''}
                                  </div>
                                </div>
                              )
                            },
                            {
                              title: 'Fixed Weekly Expenses',
                              dataIndex: 'fixedWeeklyExpenses',
                              key: 'fixedWeeklyExpenses',
                              width: 200,
                              render: (value) => <Text>${value?.toFixed(2) || '0.00'}</Text>
                            }
                          ]}
                          summary={() => (
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0}>
                                <Text strong>Total</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={1}>
                                <Text strong>${totals.fixedWeeklyExpenses.toFixed(2)}</Text>
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

export default FixedExpenseTable;
