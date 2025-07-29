import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../../store/store';

const { Title, Text } = Typography;

const SalesTable = ({ selectedDate }) => {
  const [weeklyTotals, setWeeklyTotals] = useState({
    salesBudget: 0,
    actualSalesInStore: 0,
    actualSalesAppOnline: 0,
    actualSalesDoorDash: 0,
    netSalesActual: 0,
    dailyTickets: 0,
    averageDailyTicket: 0
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
      loadDashboardData();
    }
  }, [selectedDate]);

  // Recalculate weekly totals when weeklyData changes
  useEffect(() => {
    if (weeklyData.length > 0) {
      calculateWeeklyTotalsFromData(weeklyData);
    }
  }, [weeklyData]);

  // Calculate weekly totals from weekly data
  const calculateWeeklyTotalsFromData = (weeklyTableData) => {
    const totals = weeklyTableData.reduce((acc, week) => {
      const weekTotals = week.dailyData.reduce((weekAcc, day) => ({
        budgetedSales: weekAcc.budgetedSales + (parseFloat(day.budgetedSales) || 0),
        actualSalesInStore: weekAcc.actualSalesInStore + (parseFloat(day.actualSalesInStore) || 0),
        actualSalesAppOnline: weekAcc.actualSalesAppOnline + (parseFloat(day.actualSalesAppOnline) || 0),
        actualSalesDoorDash: weekAcc.actualSalesDoorDash + (parseFloat(day.actualSalesDoorDash) || 0)
      }), {
        budgetedSales: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,
        actualSalesDoorDash: 0
      });
      
      // Calculate net sales actual as sum of all actual sales
      const netSalesActual = weekTotals.actualSalesInStore + weekTotals.actualSalesAppOnline + weekTotals.actualSalesDoorDash;
      
      return {
        salesBudget: acc.salesBudget + weekTotals.budgetedSales,
        actualSalesInStore: acc.actualSalesInStore + weekTotals.actualSalesInStore,
        actualSalesAppOnline: acc.actualSalesAppOnline + weekTotals.actualSalesAppOnline,
        actualSalesDoorDash: acc.actualSalesDoorDash + weekTotals.actualSalesDoorDash,
        netSalesActual: acc.netSalesActual + netSalesActual,
        dailyTickets: acc.dailyTickets,
        averageDailyTicket: acc.averageDailyTicket
      };
    }, {
      salesBudget: 0,
      actualSalesInStore: 0,
      actualSalesAppOnline: 0,
      actualSalesDoorDash: 0,
      netSalesActual: 0,
      dailyTickets: 0,
      averageDailyTicket: 0
    });
    
    setWeeklyTotals(totals);
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setDataNotFound(false);
      const data = await fetchDashboardData(selectedDate.format('YYYY-MM-DD'));
      
      if (data) {
        // Extract all daily entries into one consolidated table
        const allDailyEntries = data.daily_entries?.map((entry) => ({
          key: `day-${entry.date}`,
          date: dayjs(entry.date),
          dayName: dayjs(entry.date).format('dddd').toLowerCase(),
          budgetedSales: entry['Sales Performance']?.sales_budget || 0,
          actualSalesInStore: entry['Sales Performance']?.actual_sales_in_store || 0,
          actualSalesAppOnline: entry['Sales Performance']?.actual_sales_app_online || 0,
          actualSalesDoorDash: entry['Sales Performance']?.actual_sales_door_dash || 0,
          dailyTickets: entry['Sales Performance']?.daily_tickets || 0,
          averageDailyTicket: entry['Sales Performance']?.average_daily_ticket || 0
        })) || [];
        
        setWeeklyData([{
          id: 'consolidated-week',
          weekTitle: 'Weekly Sales Data',
          startDate: selectedDate,
          dailyData: allDailyEntries
        }]);
        
        // Calculate weekly totals from the consolidated data
        calculateWeeklyTotalsFromData([{
          id: 'consolidated-week',
          weekTitle: 'Weekly Sales Data',
          startDate: selectedDate,
          dailyData: allDailyEntries
        }]);
      }
    } catch (error) {
      // Check if it's a 404 error
      if (error.response && error.response.status === 404) {
        setDataNotFound(true);
        setWeeklyData([]);
        setWeeklyTotals({
          salesBudget: 0,
          actualSalesInStore: 0,
          actualSalesAppOnline: 0,
          actualSalesDoorDash: 0,
          netSalesActual: 0,
          dailyTickets: 0,
          averageDailyTicket: 0
        });
        message.info('No sales data found for the selected period.');
      } else {
        message.error(`Failed to load sales data: ${error.message}`);
      }
    }
  };

  // Save dashboard data
  const saveData = async () => {
    try {
      // Get the current weekly totals (either from modal or existing data)
      const currentWeeklyTotals = weeklyData.length > 0 ? 
        weeklyData.reduce((acc, week) => {
          const weekTotals = week.dailyData.reduce((weekAcc, day) => ({
            salesBudget: weekAcc.salesBudget + (parseFloat(day.budgetedSales) || 0),
            actualSalesInStore: weekAcc.actualSalesInStore + (parseFloat(day.actualSalesInStore) || 0),
            actualSalesAppOnline: weekAcc.actualSalesAppOnline + (parseFloat(day.actualSalesAppOnline) || 0),
            actualSalesDoorDash: weekAcc.actualSalesDoorDash + (parseFloat(day.actualSalesDoorDash) || 0),
            dailyTickets: weekAcc.dailyTickets + (parseFloat(day.dailyTickets) || 0),
            averageDailyTicket: weekAcc.averageDailyTicket + (parseFloat(day.averageDailyTicket) || 0)
          }), {
            salesBudget: 0,
            actualSalesInStore: 0,
            actualSalesAppOnline: 0,
            actualSalesDoorDash: 0,
            dailyTickets: 0,
            averageDailyTicket: 0
          });
          
          return {
            salesBudget: acc.salesBudget + weekTotals.salesBudget,
            actualSalesInStore: acc.actualSalesInStore + weekTotals.actualSalesInStore,
            actualSalesAppOnline: acc.actualSalesAppOnline + weekTotals.actualSalesAppOnline,
            actualSalesDoorDash: acc.actualSalesDoorDash + weekTotals.actualSalesDoorDash,
            dailyTickets: acc.dailyTickets + weekTotals.dailyTickets,
            averageDailyTicket: acc.averageDailyTicket + weekTotals.averageDailyTicket
          };
        }, {
          salesBudget: 0,
          actualSalesInStore: 0,
          actualSalesAppOnline: 0,
          actualSalesDoorDash: 0,
          dailyTickets: 0,
          averageDailyTicket: 0
        }) : weeklyTotals;

      // Transform data to API format with the new structure
      const transformedData = {
        week_start: selectedDate.format('YYYY-MM-DD'),
        section: "Sales Performance",
        section_data: {
          weekly: {
            sales_budget: currentWeeklyTotals.salesBudget.toFixed(2),
            actual_sales_in_store: currentWeeklyTotals.actualSalesInStore.toFixed(2),
            actual_sales_app_online: currentWeeklyTotals.actualSalesAppOnline.toFixed(2),
            actual_sales_door_dash: currentWeeklyTotals.actualSalesDoorDash.toFixed(2),
            net_sales_actual: (currentWeeklyTotals.actualSalesInStore + 
                             currentWeeklyTotals.actualSalesAppOnline + 
                             currentWeeklyTotals.actualSalesDoorDash).toFixed(2),
            daily_tickets: currentWeeklyTotals.dailyTickets || 0,
            average_daily_ticket: (currentWeeklyTotals.averageDailyTicket || 0).toFixed(2)
          },
          daily: weeklyData.flatMap(week => 
            week.dailyData.map(day => ({
              date: day.date.format('YYYY-MM-DD'),
              day: day.date.format('dddd'),
              sales_budget: (day.budgetedSales || 0).toFixed(2),
              actual_sales_in_store: (day.actualSalesInStore || 0).toFixed(2),
              actual_sales_app_online: (day.actualSalesAppOnline || 0).toFixed(2),
              actual_sales_door_dash: (day.actualSalesDoorDash || 0).toFixed(2),
              net_sales_actual: ((day.actualSalesInStore || 0) +
                               (day.actualSalesAppOnline || 0) +
                               (day.actualSalesDoorDash || 0)).toFixed(2),
              daily_tickets: day.dailyTickets || 0,
              average_daily_ticket: (day.averageDailyTicket || 0).toFixed(2)
            }))
          )
        }
      };

      await saveDashboardData(transformedData);
      message.success('Sales data saved successfully!');
      await loadDashboardData();
    } catch (error) {
      message.error(`Failed to save sales data: ${error.message}`);
    }
  };

  // Calculate percentage
  const calculatePercentage = (actual, budget) => {
    if (budget === 0) return 0;
    return ((actual - budget) / budget) * 100;
  };

  const percentageActualVsBudget = calculatePercentage(weeklyTotals.netSalesActual, weeklyTotals.salesBudget);

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
      budgetedSales: acc.budgetedSales + (parseFloat(day.budgetedSales) || 0),
      actualSalesInStore: acc.actualSalesInStore + (parseFloat(day.actualSalesInStore) || 0),
      actualSalesAppOnline: acc.actualSalesAppOnline + (parseFloat(day.actualSalesAppOnline) || 0),
      actualSalesDoorDash: acc.actualSalesDoorDash + (parseFloat(day.actualSalesDoorDash) || 0)
    }), {
      budgetedSales: 0,
      actualSalesInStore: 0,
      actualSalesAppOnline: 0,
      actualSalesDoorDash: 0
    });

    // Calculate net sales actual as sum of all actual sales
    totals.netSalesActual = totals.actualSalesInStore + totals.actualSalesAppOnline + totals.actualSalesDoorDash;
    return totals;
  };

  // Generate 7 days of data starting from a given date
  const generateDailyData = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = dayjs(startDate).add(i, 'day');
      days.push({
        key: `day-${currentDate.format('YYYY-MM-DD')}`,
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
      dailyData: generateDailyData(dayjs()),
      // Add weekly totals for the modal
      weeklyTotals: {
        salesBudget: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,
        actualSalesDoorDash: 0,
        dailyTickets: 0,
        averageDailyTicket: 0
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
            salesBudget: 0,
            actualSalesInStore: 0,
            actualSalesAppOnline: 0,
            actualSalesDoorDash: 0,
            dailyTickets: 0,
            averageDailyTicket: 0
          }
        });
      }
    }, [editingWeek, weeklyData.length]);





    const handleDailyDataChange = (dayIndex, field, value) => {
      const newDailyData = [...weekFormData.dailyData];
      newDailyData[dayIndex] = { ...newDailyData[dayIndex], [field]: value };
      
      // Automatically calculate Net Sales Actual when any of the actual sales fields change
      if (field === 'actualSalesInStore' || field === 'actualSalesAppOnline' || field === 'actualSalesDoorDash') {
        const actualSalesInStore = parseFloat(newDailyData[dayIndex].actualSalesInStore) || 0;
        const actualSalesAppOnline = parseFloat(newDailyData[dayIndex].actualSalesAppOnline) || 0;
        const actualSalesDoorDash = parseFloat(newDailyData[dayIndex].actualSalesDoorDash) || 0;
        newDailyData[dayIndex].netSalesActual = actualSalesInStore + actualSalesAppOnline + actualSalesDoorDash;
      }
      
      setWeekFormData({ ...weekFormData, dailyData: newDailyData });
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
        width={1000}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={16}>
            <Col span={6}>
              <Text strong>Sales Budget:</Text>
              <Input
                type='number'
                value={weekFormData.weeklyTotals.salesBudget}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setWeekFormData(prev => ({
                    ...prev,
                    weeklyTotals: {
                      ...prev.weeklyTotals,
                      salesBudget: value
                    }
                  }));
                }}
                prefix="$"
                placeholder="0.00"
              />
            </Col>
            <Col span={6}>
              <Text strong>Actual Sales - In Store:</Text>
              <Input
                type='number'
                value={weekFormData.weeklyTotals.actualSalesInStore}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setWeekFormData(prev => ({
                    ...prev,
                    weeklyTotals: {
                      ...prev.weeklyTotals,
                      actualSalesInStore: value
                    }
                  }));
                }}
                prefix="$"
                placeholder="0.00"
              />
            </Col>
            <Col span={6}>
              <Text strong>Actual Sales - App/Online:</Text>
              <Input
                type='number'
                value={weekFormData.weeklyTotals.actualSalesAppOnline}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setWeekFormData(prev => ({
                    ...prev,
                    weeklyTotals: {
                      ...prev.weeklyTotals,
                      actualSalesAppOnline: value
                    }
                  }));
                }}
                prefix="$"
                placeholder="0.00"
              />
            </Col>
            <Col span={6}>
              <Text strong>Actual Sales - Door Dash:</Text>
              <Input
                type='number'
                value={weekFormData.weeklyTotals.actualSalesDoorDash}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setWeekFormData(prev => ({
                    ...prev,
                    weeklyTotals: {
                      ...prev.weeklyTotals,
                      actualSalesDoorDash: value
                    }
                  }));
                }}
                prefix="$"
                placeholder="0.00"
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Text strong>Net Sales - Actual (Auto-calculated):</Text>
              <Input
                type='number'
                value={weekFormData.weeklyTotals.actualSalesInStore + weekFormData.weeklyTotals.actualSalesAppOnline + weekFormData.weeklyTotals.actualSalesDoorDash}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
                prefix="$"
                placeholder="0.00"
              />
            </Col>
            <Col span={6}>
              <Text strong>% Actual vs Budgeted Sales:</Text>
              <Input
                type='number'
                value={weekFormData.weeklyTotals.salesBudget > 0 ? 
                  (((weekFormData.weeklyTotals.actualSalesInStore + weekFormData.weeklyTotals.actualSalesAppOnline + weekFormData.weeklyTotals.actualSalesDoorDash) - weekFormData.weeklyTotals.salesBudget) / weekFormData.weeklyTotals.salesBudget * 100) : 0}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
                prefix="%"
                placeholder="0%"
              />
            </Col>
            <Col span={6}>
              <Text strong># Daily Tickets:</Text>
              <Input
                type='number'
                value={weekFormData.weeklyTotals.dailyTickets}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setWeekFormData(prev => ({
                    ...prev,
                    weeklyTotals: {
                      ...prev.weeklyTotals,
                      dailyTickets: value
                    }
                  }));
                }}
                placeholder="0"
              />
            </Col>
            <Col span={6}>
              <Text strong>Average Daily Ticket:</Text>
              <Input
                type='number'
                value={weekFormData.weeklyTotals.averageDailyTicket}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setWeekFormData(prev => ({
                    ...prev,
                    weeklyTotals: {
                      ...prev.weeklyTotals,
                      averageDailyTicket: value
                    }
                  }));
                }}
                prefix="$"
                placeholder="0.00"
              />
            </Col>
          </Row>


          <Table
            dataSource={weekFormData.dailyData}
            pagination={false}
            size="small"
            rowKey={(record) => record.key || `modal-day-${record.date?.format('YYYY-MM-DD')}`}
            summary={(pageData) => {
              const totals = pageData.reduce((acc, record) => {
                acc.budgetedSales += parseFloat(record.budgetedSales) || 0;
                acc.actualSalesInStore += parseFloat(record.actualSalesInStore) || 0;
                acc.actualSalesAppOnline += parseFloat(record.actualSalesAppOnline) || 0;
                acc.actualSalesDoorDash += parseFloat(record.actualSalesDoorDash) || 0;
                acc.dailyTickets += parseFloat(record.dailyTickets) || 0;
                acc.averageDailyTicket += parseFloat(record.averageDailyTicket) || 0;
                return acc;
              }, {
                budgetedSales: 0,
                actualSalesInStore: 0,
                actualSalesAppOnline: 0,
                actualSalesDoorDash: 0,
                dailyTickets: 0,
                averageDailyTicket: 0
              });

              // Calculate net sales actual total
              const netSalesActualTotal = totals.actualSalesInStore + totals.actualSalesAppOnline + totals.actualSalesDoorDash;
              
              // Calculate percentage total
              const percentageTotal = totals.budgetedSales > 0 ? ((netSalesActualTotal - totals.budgetedSales) / totals.budgetedSales) * 100 : 0;

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
                  <Table.Summary.Cell index={4}>
                    <Text strong style={{ color: '#1890ff' }}>${totals.actualSalesDoorDash.toFixed(2)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <Text strong style={{ color: '#1890ff' }}>${netSalesActualTotal.toFixed(2)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    <Text strong style={{ color: percentageTotal < 0 ? '#ff4d4f' : '#52c41a' }}>
                      {percentageTotal.toFixed(0)}%
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>
                    <Text strong style={{ color: '#1890ff' }}>{totals.dailyTickets.toFixed(0)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8}>
                    <Text strong style={{ color: '#1890ff' }}>${totals.averageDailyTicket.toFixed(2)}</Text>
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
                title: 'Net Sales - Actual (Auto-calculated)',
                dataIndex: 'netSalesActual',
                key: 'netSalesActual',
                width: 180,
                render: (value, record) => {
                  // Calculate the sum of actual sales for this day
                  const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                  const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                  const actualSalesDoorDash = parseFloat(record.actualSalesDoorDash) || 0;
                  const calculatedNetSales = actualSalesInStore + actualSalesAppOnline + actualSalesDoorDash;
                  
                  return (
                    <Input
                      type="number"
                      value={calculatedNetSales.toFixed(2)}
                      disabled
                      style={{ backgroundColor: '#f5f5f5' }}
                      prefix="$"
                    />
                  );
                }
              },
              {
                title: '% Actual vs Budgeted Sales',
                dataIndex: 'percentageActualVsBudget',
                key: 'percentageActualVsBudget',
                width: 180,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'percentageActualVsBudget', parseFloat(e.target.value) || 0)}
                    prefix="%"
                  />
                )
              },
              {
                title: '# Daily Tickets',
                dataIndex: 'dailyTickets',
                key: 'dailyTickets',
                width: 180,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'dailyTickets', parseFloat(e.target.value) || 0)}
                    prefix=""
                  />
                )
              },
              {
                title: 'Average Daily Ticket',
                dataIndex: 'averageDailyTicket',
                key: 'averageDailyTicket',
                width: 180,
                render: (value, record, index) => (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleDailyDataChange(index, 'averageDailyTicket', parseFloat(e.target.value) || 0)}
                    prefix=""
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
        <Title level={3} className="pl-2 pb-2">Sales Performance Dashboard</Title>
        
        {storeError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <Text type="danger">{storeError}</Text>
          </div>
        )}
        
        <Row gutter={24}>
          {/* Weekly Totals Section */}
          <Col span={6}>
            <Card title="Weekly Sales Totals" className="h-fit">
              {dataNotFound ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No sales data available for this period."
                  className="py-4"
                />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text strong>Sales - Budget:</Text>
                    <Input
                      value={`$${(weeklyTotals.salesBudget || 0).toFixed(2)}`}
                      className="mt-1"
                      disabled
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>
                  
                  <div>
                    <Text strong>Actual Sales - In Store:</Text>
                    <Input
                      value={`$${(weeklyTotals.actualSalesInStore || 0).toFixed(2)}`}
                      className="mt-1"
                      disabled
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>
                  
                  <div>
                    <Text strong>Actual Sales - App / On Line:</Text>
                    <Input
                      value={`$${(weeklyTotals.actualSalesAppOnline || 0).toFixed(2)}`}
                      className="mt-1"
                      disabled
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>
                  
                  <div>
                    <Text strong>Actual Sales - Door Dash:</Text>
                    <Input
                      value={`$${(weeklyTotals.actualSalesDoorDash || 0).toFixed(2)}`}
                      className="mt-1"
                      disabled
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>
                  
                  <div>
                    <Text strong>Net Sales - Actual:</Text>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                      (Auto-calculated: In Store + App/Online + Door Dash)
                    </Text>
                    <Input
                      value={`$${(weeklyTotals.netSalesActual || 0).toFixed(2)}`}
                      className="mt-1"
                      disabled
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>
                  
                  <div>
                    <Text strong>% Actual vs Budgeted Sales:</Text>
                    <Input
                      value={`${(parseFloat(percentageActualVsBudget) || 0).toFixed(0)}%`}
                      className="mt-1"
                      disabled
                      style={{ 
                        color: percentageActualVsBudget < 0 ? '#ff4d4f' : '#52c41a',
                        backgroundColor: '#f5f5f5'
                      }}
                    />
                  </div>
                  
                  <div>
                    <Text strong># Daily Tickets:</Text>
                    <Input
                      value={weeklyTotals.dailyTickets || 0}
                      className="mt-1"
                      disabled
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>
                  
                  <div>
                    <Text strong>Average Daily Ticket:</Text>
                    <Input
                      value={`${(weeklyTotals.averageDailyTicket || 0).toFixed(0)}`}
                      className="mt-1"
                      disabled
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>
                </Space>
              )}
            </Card>
          </Col>

          {/* Weekly Data Section */}
          <Col span={18}>
            <Card 
              title="Weekly Sales Data" 
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
                    Add Weekly Sales
                  </Button>
                </Space>
              }
            >
              {dataNotFound ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No sales data found for the selected period."
                  className="py-8"
                />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {weeklyData.map((week) => {
                    const totals = calculateWeeklyTotals(week);
                    return (
                      <Card 
                        key={week.id || `week-${week.weekTitle}`} 
                        size="small" 
                        title={week.weekTitle}
                        extra={
                          <Space>
                            <Text type="secondary">
                              Total: ${totals.netSalesActual.toFixed(2)}
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
                              acc.budgetedSales += parseFloat(record.budgetedSales) || 0;
                              acc.actualSalesInStore += parseFloat(record.actualSalesInStore) || 0;
                              acc.actualSalesAppOnline += parseFloat(record.actualSalesAppOnline) || 0;
                              acc.actualSalesDoorDash += parseFloat(record.actualSalesDoorDash) || 0;
                              acc.dailyTickets += parseFloat(record.dailyTickets) || 0;
                              acc.averageDailyTicket += parseFloat(record.averageDailyTicket) || 0;
                              return acc;
                            }, {
                              budgetedSales: 0,
                              actualSalesInStore: 0,
                              actualSalesAppOnline: 0,
                              actualSalesDoorDash: 0,
                              dailyTickets: 0,
                              averageDailyTicket: 0
                            });

                            // Calculate net sales actual total
                            const netSalesActualTotal = totals.actualSalesInStore + totals.actualSalesAppOnline + totals.actualSalesDoorDash;
                            
                            // Calculate percentage total
                            const percentageTotal = totals.budgetedSales > 0 ? ((netSalesActualTotal - totals.budgetedSales) / totals.budgetedSales) * 100 : 0;

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
                                <Table.Summary.Cell index={4}>
                                  <Text strong style={{ color: '#1890ff' }}>${totals.actualSalesDoorDash.toFixed(2)}</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5}>
                                  <Text strong style={{ color: '#1890ff' }}>${netSalesActualTotal.toFixed(2)}</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={6}>
                                  <Text strong style={{ color: percentageTotal < 0 ? '#ff4d4f' : '#52c41a' }}>
                                    {percentageTotal.toFixed(0)}%
                                  </Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={7}>
                                  <Text strong style={{ color: '#1890ff' }}>{totals.dailyTickets.toFixed(0)}</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={8}>
                                  <Text strong style={{ color: '#1890ff' }}>${totals.averageDailyTicket.toFixed(2)}</Text>
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
                              title: 'Budgeted Sales',
                              dataIndex: 'budgetedSales',
                              key: 'budgetedSales',
                              width: 120,
                              render: (value) => <Text>${(parseFloat(value) || 0).toFixed(2)}</Text>
                            },
                            {
                              title: 'Actual Sales - In Store',
                              dataIndex: 'actualSalesInStore',
                              key: 'actualSalesInStore',
                              width: 150,
                              render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${(parseFloat(value) || 0).toFixed(2)}</Text>
                            },
                            {
                              title: 'Actual Sales - App/Online',
                              dataIndex: 'actualSalesAppOnline',
                              key: 'actualSalesAppOnline',
                              width: 150,
                              render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${(parseFloat(value) || 0).toFixed(2)}</Text>
                            },
                            {
                              title: 'Actual Sales - Door Dash',
                              dataIndex: 'actualSalesDoorDash',
                              key: 'actualSalesDoorDash',
                              width: 150,
                              render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${(parseFloat(value) || 0).toFixed(2)}</Text>
                            },
                            {
                              title: 'Net Sales - Actual (Auto-calculated)',
                              dataIndex: 'netSalesActual',
                              key: 'netSalesActual',
                              width: 150,
                              render: (value, record) => {
                                // Calculate the sum of actual sales for this day
                                const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                                const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                                const actualSalesDoorDash = parseFloat(record.actualSalesDoorDash) || 0;
                                const calculatedNetSales = actualSalesInStore + actualSalesAppOnline + actualSalesDoorDash;
                                
                                return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${calculatedNetSales.toFixed(2)}</Text>;
                              }
                            },
                            {
                              title: '% Actual vs Budgeted Sales',
                              dataIndex: 'percentageActualVsBudget',
                              key: 'percentageActualVsBudget',
                              width: 150,
                              render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>{(parseFloat(value) || 0).toFixed(0)}%</Text>
                            },
                            {
                              title: '# Daily Tickets',
                              dataIndex: 'dailyTickets',
                              key: 'dailyTickets',
                              width: 150,
                              render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>{(parseFloat(value) || 0).toFixed(2)}</Text>
                            },
                            {
                              title: 'Average Daily Ticket',
                              dataIndex: 'averageDailyTicket',
                              key: 'averageDailyTicket',
                              width: 150,
                              render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>{(parseFloat(value) || 0).toFixed(2)}</Text>
                            }
                            ]}
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
