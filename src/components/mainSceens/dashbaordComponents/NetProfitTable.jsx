import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const NetProfitTable = () => {
  const [monthlyData, setMonthlyData] = useState({
    netProfit: 0,
    netProfitMargin: 0
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
      netProfit: 0,
      netProfitMargin: 0
    };

    weekData.dailyData.forEach(day => {
      totals.netProfit += day.netProfit || 0;
    });

    // Calculate average margin
    const validMargins = weekData.dailyData.filter(day => day.netProfitMargin !== 0).length;
    if (validMargins > 0) {
      totals.netProfitMargin = weekData.dailyData.reduce((sum, day) => 
        sum + (day.netProfitMargin || 0), 0) / validMargins;
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
        netProfit: 0,
        netProfitMargin: 0
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
        title={editingWeek ? "Edit Weekly Net Profit Data" : "Add Weekly Net Profit Data"}
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

          <Divider>Daily Net Profit Data</Divider>

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
                title: 'Net Profit',
                dataIndex: 'netProfit',
                key: 'netProfit',
                width: 150,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'netProfit', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    style={{ 
                      color: value < 0 ? '#ff4d4f' : '#52c41a',
                      borderColor: value < 0 ? '#ff4d4f' : '#52c41a'
                    }}
                  />
                )
              },
              {
                title: 'Net Profit Margin',
                dataIndex: 'netProfitMargin',
                key: 'netProfitMargin',
                width: 150,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'netProfitMargin', parseFloat(e.target.value) || 0)}
                    suffix="%"
                    style={{ 
                      color: value < 0 ? '#ff4d4f' : '#52c41a',
                      borderColor: value < 0 ? '#ff4d4f' : '#52c41a'
                    }}
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
        <Title level={3} className="pl-2 pb-2">Net Profit Dashboard</Title>
        
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
                  <Text strong>Net Profit:</Text>
                  <Input
                    type="number"
                    value={monthlyData.netProfit}
                    onChange={(e) => handleMonthlyDataChange('netProfit', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    className="mt-1"
                    style={{ 
                      color: monthlyData.netProfit < 0 ? '#ff4d4f' : '#52c41a',
                      borderColor: monthlyData.netProfit < 0 ? '#ff4d4f' : '#52c41a'
                    }}
                  />
                </div>
                
                <div>
                  <Text strong>Net Profit Margin:</Text>
                  <Input
                    type="number"
                    value={monthlyData.netProfitMargin}
                    onChange={(e) => handleMonthlyDataChange('netProfitMargin', parseFloat(e.target.value) || 0)}
                    suffix="%"
                    className="mt-1"
                    style={{ 
                      color: monthlyData.netProfitMargin < 0 ? '#ff4d4f' : '#52c41a',
                      borderColor: monthlyData.netProfitMargin < 0 ? '#ff4d4f' : '#52c41a'
                    }}
                  />
                </div>
              </Space>
            </Card>
          </Col>

          {/* Weekly Data Section */}
          <Col span={18}>
            <Card 
              title={`Net Profit: ${selectedMonth ? selectedMonth.format('MMM-YY') : ''}`}
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={showAddWeeklyModal}
                >
                  Add Weekly Net Profit Data
                </Button>
              }
            >
              {weeklyData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>No weekly net profit data added yet. Click "Add Weekly Net Profit Data" to get started.</div>
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
                              title: 'Net Profit',
                              dataIndex: 'netProfit',
                              key: 'netProfit',
                              width: 150,
                              render: (value) => (
                                <Text style={{ color: value < 0 ? '#ff4d4f' : '#52c41a' }}>
                                  ${value?.toFixed(0) || '0'}
                                </Text>
                              )
                            },
                            {
                              title: 'Net Profit Margin',
                              dataIndex: 'netProfitMargin',
                              key: 'netProfitMargin',
                              width: 150,
                              render: (value) => (
                                <Text style={{ color: value < 0 ? '#ff4d4f' : '#52c41a' }}>
                                  {value?.toFixed(0) || '0'}%
                                </Text>
                              )
                            }
                          ]}
                          summary={() => (
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0}>
                                <Text strong>Total</Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={1}>
                                <Text strong style={{ color: totals.netProfit < 0 ? '#ff4d4f' : '#52c41a' }}>
                                  ${totals.netProfit.toFixed(0)}
                                </Text>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={2}>
                                <Text strong style={{ color: totals.netProfitMargin < 0 ? '#ff4d4f' : '#52c41a' }}>
                                  {totals.netProfitMargin.toFixed(0)}%
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

export default NetProfitTable;
