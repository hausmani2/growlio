import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const SalesTable = () => {
  const [monthlyData, setMonthlyData] = useState({
    salesBudget: 13000,
    actualSalesInStore: 4000,
    actualSalesAppOnline: 400,
    actualSalesDoorDash: 0,
    netSalesActual: 4400,
    dailyTickets: 0,
    averageDailyTicket: 0
  });

  const [weeklyData, setWeeklyData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  // Calculate percentages
  const calculatePercentage = (actual, budget) => {
    if (budget === 0) return 0;
    return ((actual - budget) / budget) * 100;
  };

  const percentageActualVsBudget = calculatePercentage(monthlyData.netSalesActual, monthlyData.salesBudget);

  // Handle monthly data changes
  const handleMonthlyDataChange = (field, value) => {
    const newData = { ...monthlyData, [field]: value };
    // Recalculate net sales
    newData.netSalesActual = newData.actualSalesInStore + newData.actualSalesAppOnline + newData.actualSalesDoorDash;
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
      budgetedSales: 0,
      actualSalesInStore: 0,
      actualSalesAppOnline: 0,
      actualSalesDoorDash: 0,
      netSalesActual: 0
    };

    weekData.dailyData.forEach(day => {
      totals.budgetedSales += day.budgetedSales || 0;
      totals.actualSalesInStore += day.actualSalesInStore || 0;
      totals.actualSalesAppOnline += day.actualSalesAppOnline || 0;
      totals.actualSalesDoorDash += day.actualSalesDoorDash || 0;
      totals.netSalesActual += (day.actualSalesInStore || 0) + (day.actualSalesAppOnline || 0) + (day.actualSalesDoorDash || 0);
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
        budgetedSales: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,
        actualSalesDoorDash: 0
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
        dailyData: generateDailyData(date)
      });
    };

    const handleSubmit = () => {
      handleWeeklySubmit(weekFormData);
    };

    return (
      <Modal
        title={editingWeek ? "Edit Weekly Sales Data" : "Add Weekly Sales Data"}
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

          <Divider>Daily Sales Data</Divider>

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
                title: 'Budgeted Sales',
                dataIndex: 'budgetedSales',
                key: 'budgetedSales',
                width: 150,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'budgetedSales', parseFloat(e.target.value) || 0)}
                    prefix="$"
                  />
                )
              },
              {
                title: 'Actual Sales - In Store',
                dataIndex: 'actualSalesInStore',
                key: 'actualSalesInStore',
                width: 180,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'actualSalesInStore', parseFloat(e.target.value) || 0)}
                    prefix="$"
                  />
                )
              },
              {
                title: 'Actual Sales - App/Online',
                dataIndex: 'actualSalesAppOnline',
                key: 'actualSalesAppOnline',
                width: 180,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'actualSalesAppOnline', parseFloat(e.target.value) || 0)}
                    prefix="$"
                  />
                )
              },
              {
                title: 'Actual Sales - Door Dash',
                dataIndex: 'actualSalesDoorDash',
                key: 'actualSalesDoorDash',
                width: 180,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'actualSalesDoorDash', parseFloat(e.target.value) || 0)}
                    prefix="$"
                  />
                )
              },
              {
                title: 'Net Sales - Actual',
                key: 'netSalesActual',
                width: 150,
                render: (record) => {
                  const netSales = (record.actualSalesInStore || 0) + (record.actualSalesAppOnline || 0) + (record.actualSalesDoorDash || 0);
                  return <Text strong>${netSales.toFixed(2)}</Text>;
                }
              },
              {
                title: '% Actual vs Budgeted',
                key: 'percentage',
                width: 150,
                render: (record) => {
                  const netSales = (record.actualSalesInStore || 0) + (record.actualSalesAppOnline || 0) + (record.actualSalesDoorDash || 0);
                  const percentage = calculatePercentage(netSales, record.budgetedSales || 0);
                  return (
                    <Text style={{ color: percentage < 0 ? '#ff4d4f' : '#52c41a' }}>
                      {percentage.toFixed(0)}%
                    </Text>
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Title level={2} className="mb-6">Sales Performance Dashboard</Title>
        
        <Row gutter={24}>
          {/* Monthly Totals Section */}
          <Col span={8}>
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
                  <Text strong>Sales - Budget:</Text>
                  <Input
                    type="number"
                    value={monthlyData.salesBudget}
                    onChange={(e) => handleMonthlyDataChange('salesBudget', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Text strong>Actual Sales - In Store:</Text>
                  <Input
                    type="number"
                    value={monthlyData.actualSalesInStore}
                    onChange={(e) => handleMonthlyDataChange('actualSalesInStore', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Text strong>Actual Sales - App / On Line:</Text>
                  <Input
                    type="number"
                    value={monthlyData.actualSalesAppOnline}
                    onChange={(e) => handleMonthlyDataChange('actualSalesAppOnline', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Text strong>Actual Sales - Door Dash:</Text>
                  <Input
                    type="number"
                    value={monthlyData.actualSalesDoorDash}
                    onChange={(e) => handleMonthlyDataChange('actualSalesDoorDash', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Text strong>Net Sales - Actual:</Text>
                  <Input
                    value={monthlyData.netSalesActual}
                    prefix="$"
                    className="mt-1"
                    disabled
                  />
                </div>
                
                <div>
                  <Text strong>% Actual vs Budgeted Sales:</Text>
                  <Input
                    value={`${percentageActualVsBudget.toFixed(0)}%`}
                    className="mt-1"
                    disabled
                    style={{ color: percentageActualVsBudget < 0 ? '#ff4d4f' : '#52c41a' }}
                  />
                </div>
                
                <div>
                  <Text strong># Daily Tickets:</Text>
                  <Input
                    type="number"
                    value={monthlyData.dailyTickets}
                    onChange={(e) => handleMonthlyDataChange('dailyTickets', parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Text strong>Average Daily Ticket:</Text>
                  <Input
                    type="number"
                    value={monthlyData.averageDailyTicket}
                    onChange={(e) => handleMonthlyDataChange('averageDailyTicket', parseFloat(e.target.value) || 0)}
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
              title="Weekly Sales Data" 
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={showAddWeeklyModal}
                >
                  Add Weekly Sales
                </Button>
              }
            >
              {weeklyData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>No weekly data added yet. Click "Add Weekly Sales" to get started.</div>
                </div>
              ) : (
                                 <Space direction="vertical" style={{ width: '100%' }} size="large">
                   {weeklyData.map((week) => {
                     const totals = calculateWeeklyTotals(week);
                     const weekPercentage = calculatePercentage(totals.netSalesActual, totals.budgetedSales);
                    
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
                              render: (value) => <Text>${value?.toFixed(2) || '0.00'}</Text>
                            },
                            {
                              title: 'Actual Sales - In Store',
                              dataIndex: 'actualSalesInStore',
                              key: 'actualSalesInStore',
                              width: 150,
                              render: (value) => <Text>${value?.toFixed(2) || '0.00'}</Text>
                            },
                            {
                              title: 'Actual Sales - App/Online',
                              dataIndex: 'actualSalesAppOnline',
                              key: 'actualSalesAppOnline',
                              width: 150,
                              render: (value) => <Text>${value?.toFixed(2) || '0.00'}</Text>
                            },
                            {
                              title: 'Actual Sales - Door Dash',
                              dataIndex: 'actualSalesDoorDash',
                              key: 'actualSalesDoorDash',
                              width: 150,
                              render: (value) => <Text>${value?.toFixed(2) || '0.00'}</Text>
                            },
                            {
                              title: 'Net Sales - Actual',
                              key: 'netSalesActual',
                              width: 120,
                              render: (record) => {
                                const netSales = (record.actualSalesInStore || 0) + (record.actualSalesAppOnline || 0) + (record.actualSalesDoorDash || 0);
                                return <Text strong>${netSales.toFixed(2)}</Text>;
                              }
                            },
                            {
                              title: '% Actual vs Budgeted',
                              key: 'percentage',
                              width: 120,
                              render: (record) => {
                                const netSales = (record.actualSalesInStore || 0) + (record.actualSalesAppOnline || 0) + (record.actualSalesDoorDash || 0);
                                const percentage = calculatePercentage(netSales, record.budgetedSales || 0);
                                return (
                                  <Text style={{ color: percentage < 0 ? '#ff4d4f' : '#52c41a' }}>
                                    {percentage.toFixed(0)}%
                                  </Text>
                                );
                              }
                            }
                          ]}
                          summary={() => (
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0}>
                                <Text strong>Total</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={1}>
                                <Text strong>${totals.budgetedSales.toFixed(2)}</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={2}>
                                <Text strong>${totals.actualSalesInStore.toFixed(2)}</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={3}>
                                <Text strong>${totals.actualSalesAppOnline.toFixed(2)}</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={4}>
                                <Text strong>${totals.actualSalesDoorDash.toFixed(2)}</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={5}>
                                <Text strong>${totals.netSalesActual.toFixed(2)}</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={6}>
                                <Text strong style={{ color: weekPercentage < 0 ? '#ff4d4f' : '#52c41a' }}>
                                  {weekPercentage.toFixed(0)}%
                                </Text>
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

export default SalesTable;
