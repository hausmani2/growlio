import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../../store/store';
import LoadingSpinner from '../../layout/LoadingSpinner';

const { Title, Text } = Typography;

const LabourTable = ({ selectedDate, weekDays = [] }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);
  const [hourlyRate] = useState(15);
  const [dataNotFound, setDataNotFound] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weeklyTotals, setWeeklyTotals] = useState({
    labor_hours_budget: "0.00",
    labor_hours_actual: "0.00",
    budgeted_labor_dollars: "0.00",
    actual_labor_dollars: "0.00",
    daily_labor_rate: "0.00"
  });

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
  }, [selectedDate, weekDays]);

  // Helper function to check if all values in weeklyData are zeros
  const areAllValuesZero = (weeklyData) => {
    if (!weeklyData || weeklyData.length === 0) return true;
    
    return weeklyData.every(week => {
      if (!week.dailyData || week.dailyData.length === 0) return true;
      
      return week.dailyData.every(day => {
        const laborHoursBudget = parseFloat(day.laborHoursBudget) || 0;
        const laborHoursActual = parseFloat(day.laborHoursActual) || 0;
        const budgetedLaborDollars = parseFloat(day.budgetedLaborDollars) || 0;
        const actualLaborDollars = parseFloat(day.actualLaborDollars) || 0;
        
        return laborHoursBudget === 0 && 
               laborHoursActual === 0 && 
               budgetedLaborDollars === 0 && 
               actualLaborDollars === 0;
      });
    });
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setDataNotFound(false);
      const weekStartDate = weekDays.length > 0 ? weekDays[0].date : selectedDate;
      const data = await fetchDashboardData(weekStartDate.format('YYYY-MM-DD'));
      
      if (data && data['Labor Performance']) {
        // Extract weekly totals from the API response
        const laborPerformance = data['Labor Performance'];
        setWeeklyTotals({
          labor_hours_budget: laborPerformance.labor_hours_budget || "0.00",
          labor_hours_actual: laborPerformance.labor_hours_actual || "0.00",
          budgeted_labor_dollars: laborPerformance.budgeted_labor_dollars || "0.00",
          actual_labor_dollars: laborPerformance.actual_labor_dollars || "0.00",
          daily_labor_rate: laborPerformance.daily_labor_rate || "0.00"
        });

        // Extract all daily entries into one consolidated table
        const allDailyEntries = data.daily_entries?.map((entry) => ({
          key: `day-${entry.date}`,
          date: dayjs(entry.date),
          dayName: dayjs(entry.date).format('dddd').toLowerCase(),
          laborHoursBudget: entry['Labor Performance']?.labor_hours_budget || 0,
          laborHoursActual: entry['Labor Performance']?.labor_hours_actual || 0,
          budgetedLaborDollars: entry['Labor Performance']?.budgeted_labor_dollars || 0,
          actualLaborDollars: entry['Labor Performance']?.actual_labor_dollars || 0
        })) || [];

        // If weekDays are provided, use them to create the daily data structure
        let dailyData = allDailyEntries;
        if (weekDays.length > 0) {
          // Create daily data structure based on weekDays
          dailyData = weekDays.map((day) => {
            // Find existing entry for this day
            const existingEntry = allDailyEntries.find(entry => 
              entry.date.format('YYYY-MM-DD') === day.date.format('YYYY-MM-DD')
            );
            
            return existingEntry || {
              key: `day-${day.date.format('YYYY-MM-DD')}`,
              date: day.date,
              dayName: day.dayName.toLowerCase(),
              laborHoursBudget: 0,
              laborHoursActual: 0,
              budgetedLaborDollars: 0,
              actualLaborDollars: 0
            };
          });
        }

        const weeklyTableData = [{
          id: 'consolidated-week',
          weekTitle: 'Weekly Labor Data',
          startDate: weekStartDate,
          dailyData: dailyData
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
        message.info('No labor data found for the selected period.');
      } else {
        message.error(`Failed to load labor data: ${error.message}`);
      }
    }
  };





  // Handle weekly data modal
  const showAddWeeklyModal = () => {
    setEditingWeek(null);
    setIsEditMode(false);
    setIsModalVisible(true);
  };

  const showEditWeeklyModal = (weekData) => {
    setEditingWeek(weekData);
    setIsEditMode(true);
    setIsModalVisible(true);
  };

  const handleWeeklySubmit = async (weekData) => {
    try {
      setIsSubmitting(true);
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

      // Save data to API when modal is submitted
      // Use the weekData from the modal instead of checking weeklyData state
      if (!weekData || !weekData.dailyData) {
        message.warning('No weekly data to save. Please add weekly Labor data first.');
        return;
      }

      // Use the weekly totals from the form data
      const weeklyTotals = weekData.weeklyTotals || {
        laborHoursBudget: 0,
        laborHoursActual: 0,
        budgetedLaborDollars: 0,
        actualLaborDollars: 0,
        dailyLaborRate: hourlyRate,
        dailyLaborPercentage: 0,
        weeklyLaborPercentage: 0
      };

      // Calculate final totals for this week
      const finalTotals = {
        laborHoursBudget: weeklyTotals.laborHoursBudget,
        laborHoursActual: weeklyTotals.laborHoursActual,
        budgetedLaborDollars: weeklyTotals.budgetedLaborDollars,
        actualLaborDollars: weeklyTotals.actualLaborDollars,
        dailyLaborRate: weeklyTotals.dailyLaborRate,
        dailyLaborPercentage: weeklyTotals.actualLaborDollars > 0 ? 
          ((weeklyTotals.actualLaborDollars / weeklyTotals.dailyLaborRate)).toFixed(1) : 0,
        weeklyLaborPercentage: weeklyTotals.actualLaborDollars > 0 ? 
          ((weeklyTotals.actualLaborDollars / (weeklyTotals.actualLaborDollars + 5000)) * 100).toFixed(1) : 0
      };

      // Transform data to API format - only save the current week's daily data
      const transformedData = {
        week_start: weekDays.length > 0 ? weekDays[0].date.format('YYYY-MM-DD') : selectedDate.format('YYYY-MM-DD'),
        section: "Labor Performance",
        section_data: {
          weekly: {
            labor_hours_budget: finalTotals.laborHoursBudget.toFixed(1),
            labor_hours_actual: finalTotals.laborHoursActual.toFixed(1),
            budgeted_labor_dollars: finalTotals.budgetedLaborDollars.toFixed(2),
            actual_labor_dollars: finalTotals.actualLaborDollars.toFixed(2),
            daily_labor_rate: finalTotals.dailyLaborRate.toFixed(2),
            daily_labor_percentage: finalTotals.dailyLaborPercentage,
            weekly_labor_percentage: finalTotals.weeklyLaborPercentage
          },
          daily: weekData.dailyData.map(day => ({
            date: day.date.format('YYYY-MM-DD'),
            day: day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1), // Capitalize first letter
            labor_hours_budget: (day.laborHoursBudget || 0).toFixed(1),
            labor_hours_actual: (day.laborHoursActual || 0).toFixed(1),
            budgeted_labor_dollars: (day.budgetedLaborDollars || 0).toFixed(2),
            actual_labor_dollars: (day.actualLaborDollars || 0).toFixed(2),
            daily_labor_rate: hourlyRate.toFixed(2)
          }))
        }
      };

      await saveDashboardData(transformedData);
      message.success(isEditMode ? 'Labor data updated successfully!' : 'Labor data saved successfully!');
      await loadDashboardData();
      
      setIsModalVisible(false);
      setEditingWeek(null);
      setIsEditMode(false);
    } catch (error) {
      message.error(`Failed to ${isEditMode ? 'update' : 'save'} labor data: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };



  // Calculate weekly totals
  const calculateWeeklyTotals = (weekData) => {
    const totals = weekData.dailyData.reduce((acc, day) => ({
      laborHoursBudget: acc.laborHoursBudget + (parseFloat(day.laborHoursBudget) || 0),
      laborHoursActual: acc.laborHoursActual + (parseFloat(day.laborHoursActual) || 0),
      budgetedLaborDollars: acc.budgetedLaborDollars + (parseFloat(day.budgetedLaborDollars) || 0),
      actualLaborDollars: acc.actualLaborDollars + (parseFloat(day.actualLaborDollars) || 0)
    }), {
      laborHoursBudget: 0,
      laborHoursActual: 0,
      budgetedLaborDollars: 0,
      actualLaborDollars: 0
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
        laborHoursBudget: 0,
        laborHoursActual: 0,
        budgetedLaborDollars: 0,
        actualLaborDollars: 0
      });
    }
    return days;
  };

  // Weekly Modal Component
  const WeeklyModal = () => {
    const [weekFormData, setWeekFormData] = useState({
      weekTitle: '',
      startDate: weekDays.length > 0 ? weekDays[0].date : selectedDate,
      dailyData: generateDailyData(weekDays.length > 0 ? weekDays[0].date : selectedDate),
      // Add weekly totals for the modal
      weeklyTotals: {
        laborHoursBudget: 0,
        laborHoursActual: 0,
        budgetedLaborDollars: 0,
        actualLaborDollars: 0,
        dailyLaborRate: hourlyRate,
        dailyLaborPercentage: 0,
        weeklyLaborPercentage: 0
      }
    });

    useEffect(() => {
      if (editingWeek) {
        setWeekFormData(editingWeek);
      } else {
        setWeekFormData({
          weekTitle: `Week ${weeklyData.length + 1}`,
          startDate: weekDays.length > 0 ? weekDays[0].date : selectedDate,
          dailyData: generateDailyData(weekDays.length > 0 ? weekDays[0].date : selectedDate),
          weeklyTotals: {
            laborHoursBudget: 0,
            laborHoursActual: 0,
            budgetedLaborDollars: 0,
            actualLaborDollars: 0,
            dailyLaborRate: hourlyRate,
            dailyLaborPercentage: 0,
            weeklyLaborPercentage: 0
          }
        });
      }
    }, [editingWeek, weeklyData.length, weekDays, selectedDate]);

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
        title={isEditMode ? "Edit Weekly Labor Data" : "Add Weekly Labor Data"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingWeek(null);
          setIsEditMode(false);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setIsModalVisible(false);
            setEditingWeek(null);
            setIsEditMode(false);
          }}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit} loading={isSubmitting || storeLoading}>
            {isEditMode ? 'Update' : 'Add'} Week
          </Button>
        ]}
        width={1200}
      >
        {(isSubmitting || storeLoading) && (
          <LoadingSpinner 
            spinning={true} 
            tip="Saving data..." 
            fullScreen={false}
          />
        )}
        <Space direction="vertical" style={{ width: '100%' }} size="large">


          {/* Weekly Goals Input Section */}
          <Card title="Weekly Labor Goals" size="small">
            <Row gutter={16}>
              <Col span={6}>
                <Text strong>Labor Hours - Budget:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.laborHoursBudget}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        laborHoursBudget: value
                      }
                    }));
                  }}
                  suffix="hrs"
                  placeholder="0.0"
                />
              </Col>
              <Col span={6}>
                <Text strong>Labor Hours - Actual:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.laborHoursActual}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        laborHoursActual: value
                      }
                    }));
                  }}
                  suffix="hrs"
                  placeholder="0.0"
                />
              </Col>
              <Col span={6}>
                <Text strong>Budgeted Labor $:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.budgetedLaborDollars}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        budgetedLaborDollars: value
                      }
                    }));
                  }}
                  prefix="$"
                  placeholder="0.00"
                />
              </Col>
              <Col span={6}>
                <Text strong>Actual Labor $:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.actualLaborDollars}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        actualLaborDollars: value
                      }
                    }));
                  }}
                  prefix="$"
                  placeholder="0.00"
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Text strong>Daily Labor Rate:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.dailyLaborRate}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        dailyLaborRate: value
                      }
                    }));
                  }}
                  prefix="$"
                  placeholder="0.00"
                />
              </Col>
              <Col span={6}>
                <Text strong>Daily Labor %:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.actualLaborDollars > 0 ? 
                    ((weekFormData.weeklyTotals.actualLaborDollars / weekFormData.weeklyTotals.dailyLaborRate)).toFixed(1) : 0}
                  suffix="%"
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Col>
              <Col span={6}>
                <Text strong>Weekly Labor %:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.actualLaborDollars > 0 ? 
                    ((weekFormData.weeklyTotals.actualLaborDollars / (weekFormData.weeklyTotals.actualLaborDollars + 5000)) * 100).toFixed(1) : 0}
                  suffix="%"
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Col>
            </Row>
          </Card>


          <Table
            dataSource={weekFormData.dailyData}
            pagination={false}
            size="small"
            summary={(pageData) => {
              const totals = pageData.reduce((acc, record) => ({
                laborHoursBudget: acc.laborHoursBudget + (parseFloat(record.laborHoursBudget) || 0),
                laborHoursActual: acc.laborHoursActual + (parseFloat(record.laborHoursActual) || 0),
                budgetedLaborDollars: acc.budgetedLaborDollars + (parseFloat(record.budgetedLaborDollars) || 0),
                actualLaborDollars: acc.actualLaborDollars + (parseFloat(record.actualLaborDollars) || 0)
              }), {
                laborHoursBudget: 0,
                laborHoursActual: 0,
                budgetedLaborDollars: 0,
                actualLaborDollars: 0
              });

              return (
                <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                  <Table.Summary.Cell index={0}>
                    <Text strong>Totals:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <Text strong>{totals.laborHoursBudget.toFixed(1)} hrs</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Text strong>{totals.laborHoursActual.toFixed(1)} hrs</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <Text strong>${totals.budgetedLaborDollars.toFixed(2)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Text strong>${totals.actualLaborDollars.toFixed(2)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <Text strong>{(totals.actualLaborDollars / hourlyRate).toFixed(1)}%</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    <Text strong>{(totals.actualLaborDollars / (totals.actualLaborDollars + 5000) * 100).toFixed(1)}%</Text>
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
                title: 'Daily Labor %',
                dataIndex: 'dailyLaborPercentage',
                key: 'dailyLaborPercentage',
                width: 150,
                render: (value, record) => {
                  const actualLabor = parseFloat(record.actualLaborDollars) || 0;
                  const dailyPercentage = actualLabor > 0 ? (actualLabor / hourlyRate) : 0;
                  return (
                    <Input
                      type="number"
                      value={dailyPercentage.toFixed(1)}
                      suffix="%"
                      disabled
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  );
                }
              },
              {
                title: 'Weekly Labor %',
                dataIndex: 'weeklyLaborPercentage',
                key: 'weeklyLaborPercentage',
                width: 150,
                render: (value, record) => {
                  const actualLabor = parseFloat(record.actualLaborDollars) || 0;
                  const weeklyPercentage = actualLabor > 0 ? (actualLabor / (actualLabor + 5000) * 100) : 0;
                  return (
                    <Input
                      type="number"
                      value={weeklyPercentage.toFixed(1)}
                      suffix="%"
                      disabled
                      style={{ backgroundColor: '#f5f5f5' }}
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
        <Title level={3} className="pl-2 pb-2">Labor Performance Dashboard</Title>
        
        {storeError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <Text type="danger">{storeError}</Text>
          </div>
        )}
        
        <Row gutter={24}>
          {/* Weekly Totals Section */}
          <Col span={6}>
            <Card title="Weekly Labor Totals" className="h-fit">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong>Labor Hours - Budget:</Text>
                  <Input
                    value={`${weeklyTotals.labor_hours_budget} hrs`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>Labor Hours - Actual:</Text>
                  <Input
                    value={`${weeklyTotals.labor_hours_actual} hrs`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>Budgeted Labor $:</Text>
                  <Input
                    value={`$${weeklyTotals.budgeted_labor_dollars}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>Actual Labor $:</Text>
                  <Input
                    value={`$${weeklyTotals.actual_labor_dollars}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>Daily Labor Rate:</Text>
                  <Input
                    value={`$${weeklyTotals.daily_labor_rate}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>Daily Labor %:</Text>
                  <Input
                    value={`${parseFloat(weeklyTotals.actual_labor_dollars) > 0 ? ((parseFloat(weeklyTotals.actual_labor_dollars) / parseFloat(weeklyTotals.daily_labor_rate))).toFixed(1) : '0.0'}%`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>Weekly Labor %:</Text>
                  <Input
                    value={`${parseFloat(weeklyTotals.actual_labor_dollars) > 0 ? ((parseFloat(weeklyTotals.actual_labor_dollars) / (parseFloat(weeklyTotals.actual_labor_dollars) + 5000)) * 100).toFixed(1) : '0.0'}%`}
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
              title={`Labor @ $${hourlyRate.toFixed(2)}/Hour: ${selectedDate ? selectedDate.format('MMM-YY') : ''}`}
              extra={
                <Space>
                  <Button 
                    onClick={loadDashboardData}
                    loading={storeLoading}
                  >
                    Refresh
                  </Button>
                  <Button 
                    type="default" 
                    icon={<PlusOutlined />} 
                    onClick={showAddWeeklyModal}
                    disabled={weeklyData.length > 0 && !areAllValuesZero(weeklyData)}
                  >
                    Add Weekly Labor
                  </Button>
                </Space>
              }
            >
              {dataNotFound || areAllValuesZero(weeklyData) ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No labor data found for the selected period."
                />
              ) : (
                weeklyData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalculatorOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
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
                              <Text type="secondary">
                                Total: ${totals.actualLaborDollars.toFixed(2)}
                              </Text>
                              <Button 
                                size="small" 
                                icon={<EditOutlined />} 
                                onClick={() => showEditWeeklyModal(week)}
                              >
                                Edit
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
                                laborHoursBudget: acc.laborHoursBudget + (parseFloat(record.laborHoursBudget) || 0),
                                laborHoursActual: acc.laborHoursActual + (parseFloat(record.laborHoursActual) || 0),
                                budgetedLaborDollars: acc.budgetedLaborDollars + (parseFloat(record.budgetedLaborDollars) || 0),
                                actualLaborDollars: acc.actualLaborDollars + (parseFloat(record.actualLaborDollars) || 0)
                              }), {
                                laborHoursBudget: 0,
                                laborHoursActual: 0,
                                budgetedLaborDollars: 0,
                                actualLaborDollars: 0
                              });

                              return (
                                <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                                  <Table.Summary.Cell index={0}>
                                    <Text strong>Week Totals:</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={1}>
                                    <Text strong>{weekTotals.laborHoursBudget.toFixed(1)} hrs</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={2}>
                                    <Text strong>{weekTotals.laborHoursActual.toFixed(1)} hrs</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={3}>
                                    <Text strong>${weekTotals.budgetedLaborDollars.toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={4}>
                                    <Text strong>${weekTotals.actualLaborDollars.toFixed(2)}</Text>
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
                                title: 'Labor Hours - Budget',
                                dataIndex: 'laborHoursBudget',
                                key: 'laborHoursBudget',
                                width: 120,
                                render: (value) => <Text>{(parseFloat(value) || 0).toFixed(1)} hrs</Text>
                              },
                              {
                                title: 'Labor Hours - Actual',
                                dataIndex: 'laborHoursActual',
                                key: 'laborHoursActual',
                                width: 150,
                                render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>{(parseFloat(value) || 0).toFixed(1)} hrs</Text>
                              },
                              {
                                title: 'Budgeted Labor $',
                                dataIndex: 'budgetedLaborDollars',
                                key: 'budgetedLaborDollars',
                                width: 120,
                                render: (value) => <Text>${(parseFloat(value) || 0).toFixed(2)}</Text>
                              },
                              {
                                title: 'Actual Labor $',
                                dataIndex: 'actualLaborDollars',
                                key: 'actualLaborDollars',
                                width: 150,
                                render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${(parseFloat(value) || 0).toFixed(2)}</Text>
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

export default LabourTable;