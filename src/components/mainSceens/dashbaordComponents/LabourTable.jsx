import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const LabourTable = () => {
  const [monthlyData, setMonthlyData] = useState({
    laborHoursBudget: 260.0,
    laborHoursActual: 190.0,
    budgetedLaborDollars: 8550,
    actualLaborDollars: 2000,
    dailyLaborRate: 10.53,
    dailyLaborPercentage: 0,
    weeklyLaborPercentage: 45
  });

  const [weeklyData, setWeeklyData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [hourlyRate, setHourlyRate] = useState(15.00);



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
      laborHoursBudget: 0,
      laborHoursActual: 0,
      budgetedLaborDollars: 0,
      actualLaborDollars: 0,
      dailyLaborRate: 0,
      dailyLaborPercentage: 0,
      weeklyLaborPercentage: 0
    };

    weekData.dailyData.forEach(day => {
      totals.laborHoursBudget += day.laborHoursBudget || 0;
      totals.laborHoursActual += day.laborHoursActual || 0;
      totals.budgetedLaborDollars += day.budgetedLaborDollars || 0;
      totals.actualLaborDollars += day.actualLaborDollars || 0;
    });

    // Calculate averages
    if (totals.laborHoursActual > 0) {
      totals.dailyLaborRate = totals.actualLaborDollars / totals.laborHoursActual;
    }

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
        laborHoursBudget: 0,
        laborHoursActual: 0,
        budgetedLaborDollars: 0,
        actualLaborDollars: 0,
        dailyLaborRate: 0,
        dailyLaborPercentage: 45,
        weeklyLaborPercentage: 45
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
      
      // Auto-calculate budgeted labor dollars based on hours and hourly rate
      if (field === 'laborHoursBudget') {
        newDailyData[dayIndex].budgetedLaborDollars = value * hourlyRate;
      }
      
      // Auto-calculate actual labor dollars based on hours and hourly rate
      if (field === 'laborHoursActual') {
        newDailyData[dayIndex].actualLaborDollars = value * hourlyRate;
      }
      
      // Auto-calculate daily labor rate
      if (field === 'actualLaborDollars' || field === 'laborHoursActual') {
        const actualDollars = field === 'actualLaborDollars' ? value : newDailyData[dayIndex].actualLaborDollars;
        const actualHours = field === 'laborHoursActual' ? value : newDailyData[dayIndex].laborHoursActual;
        if (actualHours > 0) {
          newDailyData[dayIndex].dailyLaborRate = actualDollars / actualHours;
        }
      }
      
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
        title={editingWeek ? "Edit Weekly Labor Data" : "Add Weekly Labor Data"}
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
        width={1400}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>Week Title:</Text>
              <Input
                value={weekFormData.weekTitle}
                onChange={(e) => setWeekFormData({ ...weekFormData, weekTitle: e.target.value })}
                placeholder="Enter week title"
              />
            </Col>
            <Col span={8}>
              <Text strong>Start Date:</Text>
              <DatePicker
                value={weekFormData.startDate}
                onChange={handleStartDateChange}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={8}>
              <Text strong>Hourly Rate:</Text>
              <Input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                prefix="$"
                style={{ width: '100%' }}
              />
            </Col>
          </Row>

          <Divider>Daily Labor Data</Divider>

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
                title: 'Labor Hours - Budget',
                dataIndex: 'laborHoursBudget',
                key: 'laborHoursBudget',
                width: 150,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'laborHoursBudget', parseFloat(e.target.value) || 0)}
                    suffix="hrs"
                  />
                )
              },
              {
                title: 'Labor Hours - Actual',
                dataIndex: 'laborHoursActual',
                key: 'laborHoursActual',
                width: 150,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'laborHoursActual', parseFloat(e.target.value) || 0)}
                    suffix="hrs"
                  />
                )
              },
              {
                title: 'Budgeted Labor $',
                dataIndex: 'budgetedLaborDollars',
                key: 'budgetedLaborDollars',
                width: 150,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'budgetedLaborDollars', parseFloat(e.target.value) || 0)}
                    prefix="$"
                  />
                )
              },
              {
                title: 'Actual Labor $',
                dataIndex: 'actualLaborDollars',
                key: 'actualLaborDollars',
                width: 150,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'actualLaborDollars', parseFloat(e.target.value) || 0)}
                    prefix="$"
                  />
                )
              },
              {
                title: 'Daily Labor Rate',
                dataIndex: 'dailyLaborRate',
                key: 'dailyLaborRate',
                width: 150,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'dailyLaborRate', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    disabled
                  />
                )
              },
              {
                title: 'Daily Labor %',
                dataIndex: 'dailyLaborPercentage',
                key: 'dailyLaborPercentage',
                width: 150,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'dailyLaborPercentage', parseFloat(e.target.value) || 0)}
                    suffix="%"
                  />
                )
              },
              {
                title: 'Weekly Labor %',
                dataIndex: 'weeklyLaborPercentage',
                key: 'weeklyLaborPercentage',
                width: 150,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'weeklyLaborPercentage', parseFloat(e.target.value) || 0)}
                    suffix="%"
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
        <Title level={3} className="pl-2 pb-2">Labor Performance Dashboard</Title>
        
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
                  <Text strong>Labor Hours - Budget:</Text>
                  <Input
                    type="number"
                    value={monthlyData.laborHoursBudget}
                    onChange={(e) => handleMonthlyDataChange('laborHoursBudget', parseFloat(e.target.value) || 0)}
                    suffix="hrs"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Text strong>Labor Hours - Actual:</Text>
                  <Input
                    type="number"
                    value={monthlyData.laborHoursActual}
                    onChange={(e) => handleMonthlyDataChange('laborHoursActual', parseFloat(e.target.value) || 0)}
                    suffix="hrs"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Text strong>Budgeted Labor $:</Text>
                  <Input
                    type="number"
                    value={monthlyData.budgetedLaborDollars}
                    onChange={(e) => handleMonthlyDataChange('budgetedLaborDollars', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Text strong>Actual Labor $:</Text>
                  <Input
                    type="number"
                    value={monthlyData.actualLaborDollars}
                    onChange={(e) => handleMonthlyDataChange('actualLaborDollars', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Text strong>Daily Labor Rate:</Text>
                  <Input
                    type="number"
                    value={monthlyData.dailyLaborRate}
                    onChange={(e) => handleMonthlyDataChange('dailyLaborRate', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Text strong>Daily Labor %:</Text>
                  <Input
                    type="number"
                    value={monthlyData.dailyLaborPercentage}
                    onChange={(e) => handleMonthlyDataChange('dailyLaborPercentage', parseFloat(e.target.value) || 0)}
                    suffix="%"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Text strong>Weekly Labor %:</Text>
                  <Input
                    type="number"
                    value={monthlyData.weeklyLaborPercentage}
                    onChange={(e) => handleMonthlyDataChange('weeklyLaborPercentage', parseFloat(e.target.value) || 0)}
                    suffix="%"
                    className="mt-1"
                  />
                </div>
              </Space>
            </Card>
          </Col>

          {/* Weekly Data Section */}
          <Col span={18}>
            <Card 
              title={`Labor @ $${hourlyRate.toFixed(2)}/Hour: ${selectedMonth ? selectedMonth.format('MMM-YY') : ''}`}
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={showAddWeeklyModal}
                >
                  Add Weekly Labor
                </Button>
              }
            >
              {weeklyData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>No weekly labor data added yet. Click "Add Weekly Labor" to get started.</div>
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
                              title: 'Labor Hours - Budget',
                              dataIndex: 'laborHoursBudget',
                              key: 'laborHoursBudget',
                              width: 140,
                              render: (value) => <Text>{value?.toFixed(1) || '0.0'} hrs</Text>
                            },
                            {
                              title: 'Labor Hours - Actual',
                              dataIndex: 'laborHoursActual',
                              key: 'laborHoursActual',
                              width: 140,
                              render: (value) => <Text>{value?.toFixed(1) || '0.0'} hrs</Text>
                            },
                            {
                              title: 'Budgeted Labor $',
                              dataIndex: 'budgetedLaborDollars',
                              key: 'budgetedLaborDollars',
                              width: 140,
                              render: (value) => <Text>${value?.toFixed(0) || '0'}</Text>
                            },
                            {
                              title: 'Actual Labor $',
                              dataIndex: 'actualLaborDollars',
                              key: 'actualLaborDollars',
                              width: 140,
                              render: (value) => <Text>${value?.toFixed(0) || '0'}</Text>
                            },
                            {
                              title: 'Daily Labor Rate',
                              dataIndex: 'dailyLaborRate',
                              key: 'dailyLaborRate',
                              width: 140,
                              render: (value) => <Text>${value?.toFixed(2) || '0.00'}</Text>
                            },
                            {
                              title: 'Daily Labor %',
                              dataIndex: 'dailyLaborPercentage',
                              key: 'dailyLaborPercentage',
                              width: 140,
                              render: (value) => <Text>{value?.toFixed(0) || '0'}%</Text>
                            },
                            {
                              title: 'Weekly Labor %',
                              dataIndex: 'weeklyLaborPercentage',
                              key: 'weeklyLaborPercentage',
                              width: 140,
                              render: (value) => <Text>{value?.toFixed(0) || '0'}%</Text>
                            }
                          ]}
                          summary={() => (
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0}>
                                <Text strong>Total</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={1}>
                                <Text strong>{totals.laborHoursBudget.toFixed(1)} hrs</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={2}>
                                <Text strong>{totals.laborHoursActual.toFixed(1)} hrs</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={3}>
                                <Text strong>${totals.budgetedLaborDollars.toFixed(0)}</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={4}>
                                <Text strong>${totals.actualLaborDollars.toFixed(0)}</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={5}>
                                <Text strong>${totals.dailyLaborRate.toFixed(2)}</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={6}>
                                <Text strong>{monthlyData.dailyLaborPercentage.toFixed(0)}%</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={7}>
                                <Text strong>{monthlyData.weeklyLaborPercentage.toFixed(0)}%</Text>
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

export default LabourTable;
