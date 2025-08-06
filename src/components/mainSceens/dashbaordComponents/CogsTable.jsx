import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Table, Card, Row, Col, Typography, Space, Divider, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../../store/store';
import LoadingSpinner from '../../layout/LoadingSpinner';

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

const CogsTable = ({ selectedDate, weekDays = [], dashboardData = null, refreshDashboardData = null }) => {
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store integration
  const { 
    saveDashboardData, 
    loading: storeLoading, 
    error: storeError 
  } = useStore();

  // Process dashboard data when it changes
  useEffect(() => {
    if (dashboardData) {
      processCogsData();
    } else {
      // Reset data when no dashboard data is available
      setWeeklyData([]);
      setWeeklyTotals({
        cogsBudget: 0,
        cogsActual: 0,
        cogsPercentage: 0,
        weeklyRemainingCog: 0
      });
      setDataNotFound(true);
    }
  }, [dashboardData, weekDays]);

  // Helper function to check if all values in weeklyData are zeros
  const areAllValuesZero = (weeklyData) => {
    if (!weeklyData || weeklyData.length === 0) return true;
    
    return weeklyData.every(week => {
      if (!week.dailyData || week.dailyData.length === 0) return true;
      
      return week.dailyData.every(day => {
        const budget = parseFloat(day.budget) || 0;
        const actual = parseFloat(day.actual) || 0;
        
        return budget === 0 && actual === 0;
      });
    });
  };

  // Process COGS data from dashboard data
  const processCogsData = () => {
    if (!dashboardData) {
      setDataNotFound(true);
      return;
    }

    setDataNotFound(false);

    if (dashboardData["COGS Performance"]) {
      // Extract weekly totals from the API response
      const cogsPerformance = dashboardData["COGS Performance"];
      
      // Get weekly remaining COGS from daily entries if available
      const firstDailyEntry = dashboardData.daily_entries?.[0];
      const weeklyRemainingFromDaily = firstDailyEntry?.["COGS Performance"]?.weekly_remaining_cog;
      
      const weeklyTotals = {
        cogsBudget: formatNumber(cogsPerformance?.cogs_budget || 0),
        cogsActual: formatNumber(cogsPerformance?.cogs_actual || 0),
        cogsPercentage: 0, // Will be calculated
        weeklyRemainingCog: formatNumber(weeklyRemainingFromDaily || cogsPerformance?.weekly_remaining_cog || 0)
      };

      // Calculate percentage
      weeklyTotals.cogsPercentage = weeklyTotals.cogsBudget > 0 ? 
        (weeklyTotals.cogsActual / weeklyTotals.cogsBudget) * 100 : 0;

      // Extract all daily entries into one consolidated table
      const allDailyEntries = dashboardData.daily_entries?.map((entry) => ({
        key: `day-${entry.date}`,
        date: dayjs(entry.date),
        dayName: dayjs(entry.date).format('dddd').toLowerCase(),
        budget: entry['COGS Performance']?.cogs_budget || 0,
        actual: entry['COGS Performance']?.cogs_actual || 0,
        weeklyRemainingCog: entry['COGS Performance']?.weekly_remaining_cog || 0
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
            budget: 0,
            actual: 0,
            weeklyRemainingCog: 0
          };
        });
      } else {
        // If no weekDays provided, use all daily entries or generate default structure
        dailyData = allDailyEntries.length > 0 ? allDailyEntries : [];
      }
      
      const weekStartDate = weekDays.length > 0 ? weekDays[0].date : selectedDate;
      
      setWeeklyData([{
        id: 'consolidated-week',
        weekTitle: 'Weekly COGS Data',
        startDate: weekStartDate,
        dailyData: dailyData,
        weeklyTotals: weeklyTotals
      }]);
      
      setWeeklyTotals(weeklyTotals);
    } else {
      // No data found, reset to defaults
      setWeeklyData([]);
      setWeeklyTotals({
        cogsBudget: 0,
        cogsActual: 0,
        cogsPercentage: 0,
        weeklyRemainingCog: 0
      });
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
      let newWeekId = null;
      
      if (editingWeek) {
        // Edit existing week
        setWeeklyData(prev => prev.map(week => 
          week.id === editingWeek.id ? { ...weekData, id: week.id } : week
        ));
        newWeekId = editingWeek.id;
      } else {
        // Add new week
        const newWeek = {
          ...weekData,
          id: Date.now(),
          weekNumber: weeklyData.length + 1
        };
        newWeekId = newWeek.id;
        setWeeklyData(prev => [...prev, newWeek]);
      }
      
      // Update weekly totals from the modal data
      if (weekData.weeklyTotals) {
        // Update the weekly data with the modal's weekly totals
        setWeeklyData(prev => prev.map(week => 
          week.id === newWeekId 
            ? { ...week, weeklyTotals: weekData.weeklyTotals }
            : week
        ));
      }

      // Save data to API when modal is submitted
      // Use the weekData from the modal instead of checking weeklyData state
      if (!weekData || !weekData.dailyData) {
        message.warning('No weekly data to save. Please add weekly COGS data first.');
        return;
      }

      // Use the weekly totals from the form data
      const weeklyTotals = weekData.weeklyTotals || {
        cogsBudget: 0,
        cogsActual: 0,
        cogsPercentage: 0,
        weeklyRemainingCog: 0
      };

      // Calculate final totals for this week
      const finalTotals = {
        cogsBudget: weeklyTotals.cogsBudget,
        cogsActual: weeklyTotals.cogsActual,
        cogsPercentage: weeklyTotals.cogsPercentage,
        weeklyRemainingCog: weeklyTotals.weeklyRemainingCog
      };

      // Transform data to API format - only save the current week's daily data
      const transformedData = {
        week_start: weekDays.length > 0 ? weekDays[0].date.format('YYYY-MM-DD') : selectedDate.format('YYYY-MM-DD'),
        section: "COGS Performance",
        section_data: {
          weekly: {
            cogs_budget: finalTotals.cogsBudget,
            cogs_actual: finalTotals.cogsActual,
            cogs_percentage: finalTotals.cogsPercentage,
            weekly_remaining_cog: finalTotals.weeklyRemainingCog
          },
          daily: weekData.dailyData.map(day => ({
            date: day.date.format('YYYY-MM-DD'),
            cogs_budget: (day.budget || 0),
            cogs_actual: (day.actual || 0),
            weekly_remaining_cog: finalTotals.weeklyRemainingCog // Add weekly remaining COGS to each day
          }))
        }
      };

             await saveDashboardData(transformedData);
       message.success(isEditMode ? 'COGS data updated successfully!' : 'COGS data saved successfully!');
       
       // Refresh all dashboard data to show updated data across all components
       if (refreshDashboardData) {
         await refreshDashboardData();
       } else {
         // Fallback: reload data after saving to update totals and remaining COGS
         processCogsData(); 
       } 
      
      setIsModalVisible(false);
      setEditingWeek(null);
      setIsEditMode(false);
    } catch (error) {
      message.error(`Failed to ${isEditMode ? 'update' : 'save'} COGS data: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
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

  // Weekly Modal Component
  const WeeklyModal = () => {
    const [weekFormData, setWeekFormData] = useState({
      weekTitle: '',
      startDate: weekDays.length > 0 ? weekDays[0].date : selectedDate,
      dailyData: generateDailyData(weekDays.length > 0 ? weekDays[0].date : selectedDate),
      // Add weekly totals for the modal
      weeklyTotals: {
        cogsBudget: 0,
        cogsActual: 0,
        cogsPercentage: 0,
        weeklyRemainingCog: 0
      }
    });

    useEffect(() => {
      if (editingWeek) {
        // Ensure editingWeek has weeklyTotals property
        const weekDataWithTotals = {
          ...editingWeek,
          weeklyTotals: editingWeek.weeklyTotals || {
            cogsBudget: 0,
            cogsActual: 0,
            cogsPercentage: 0,
            weeklyRemainingCog: 0
          }
        };
        setWeekFormData(weekDataWithTotals);
      } else {
        setWeekFormData({
          weekTitle: `Week ${weeklyData.length + 1}`,
          startDate: weekDays.length > 0 ? weekDays[0].date : selectedDate,
          dailyData: generateDailyData(weekDays.length > 0 ? weekDays[0].date : selectedDate),
          weeklyTotals: {
            cogsBudget: 0,
            cogsActual: 0,
            cogsPercentage: 0,
            weeklyRemainingCog: 0
          }
        });
      }
    }, [editingWeek, weeklyData.length, weekDays, selectedDate]);

    const calculateWeeklyTotals = (dailyData) => {
      const totals = dailyData.reduce((acc, day) => ({
        budget: acc.budget + (parseFloat(day.budget) || 0),
        actual: acc.actual + (parseFloat(day.actual) || 0)
      }), {
        budget: 0,
        actual: 0
      });

      // Calculate percentage
      const percentage = totals.budget > 0 ? (totals.actual / totals.budget) * 100 : 0;
      
      // Calculate remaining COGS
      const remainingCog = totals.budget - totals.actual;

      return {
        cogsBudget: totals.budget,
        cogsActual: totals.actual,
        cogsPercentage: percentage,
        weeklyRemainingCog: remainingCog
      };
    };

    const handleDailyDataChange = (dayIndex, field, value) => {
      const newDailyData = [...weekFormData.dailyData];
      newDailyData[dayIndex] = { ...newDailyData[dayIndex], [field]: value };
      
      setWeekFormData({ 
        ...weekFormData, 
        dailyData: newDailyData
      });
    };

    const handleSubmit = () => {
      handleWeeklySubmit(weekFormData);
    };

    return (
      <Modal
      className={`${isSubmitting || storeLoading ? '!h-[70vh]' : ''}`}
        title={isEditMode ? "Edit Weekly COGS Data" : "Add Weekly COGS Data"}
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
          <Card title="Weekly COGS Goals" size="small">
            <Row gutter={16}>
              <Col span={6}>
                <Text strong>COGS Budget:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.cogsBudget}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        cogsBudget: value
                      }
                    }));
                  }}
                  prefix="$"
                  placeholder="0.00"
                />
              </Col>
              <Col span={6}>
                <Text strong>COGS Actual:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.cogsActual}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        cogsActual: value
                      }
                    }));
                  }}
                  prefix="$"
                  placeholder="0.00"
                />
              </Col>
              <Col span={6}>
                <Text strong>COGS Percentage:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.cogsPercentage}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        cogsPercentage: value
                      }
                    }));
                  }}
                  suffix="%"
                  placeholder="0.0"
                />
              </Col>
              <Col span={6}>
                <Text strong>Weekly Remaining COGS:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.weeklyRemainingCog}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        weeklyRemainingCog: value
                      }
                    }));
                  }}
                  prefix="$"
                  placeholder="0.00"
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
                budget: acc.budget + (parseFloat(record.budget) || 0),
                actual: acc.actual + (parseFloat(record.actual) || 0)
              }), {
                budget: 0,
                actual: 0
              });

              const percentage = totals.budget > 0 ? (totals.actual / totals.budget) * 100 : 0;
              // Use the weekly remaining COGS from the form data
              const remaining = weekFormData.weeklyTotals.weeklyRemainingCog || 0;

              return (
                <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                  <Table.Summary.Cell index={0}>
                    <Text strong>Totals:</Text>
                  </Table.Summary.Cell>
                  {/* <Table.Summary.Cell index={1}>
                    <Text strong>${totals.budget.toFixed(2)}</Text>
                  </Table.Summary.Cell> */}
                  <Table.Summary.Cell index={2}>
                    <Text strong>${totals.actual.toFixed(2)}</Text>
                  </Table.Summary.Cell>
                  {/* <Table.Summary.Cell index={3}>
                    <Text strong>{percentage.toFixed(1)}%</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Text strong>${remaining.toFixed(2)}</Text>
                  </Table.Summary.Cell> */}
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
              // {
              //   title: 'Budget',
              //   dataIndex: 'budget',
              //   key: 'budget',
              //   width: 150,
              //   render: (value, record, index) => (
              //     <Input
              //       type="number"
              //       value={value}
              //       onChange={(e) => handleDailyDataChange(index, 'budget', parseFloat(e.target.value) || 0)}
              //       prefix="$"
              //     />
              //   )
              // },
              {
                title: 'Actual',
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
              // {
              //   title: 'Percentage',
              //   key: 'percentage',
              //   width: 120,
              //   render: (_, record, index) => {
              //     const budget = parseFloat(record.budget) || 0;
              //     const actual = parseFloat(record.actual) || 0;
              //     const percentage = budget > 0 ? (actual / budget) * 100 : 0;
              //     return (
              //       <Text>{percentage.toFixed(1)}%</Text>
              //     );
              //   }
              // },
              // {
              //   title: 'Remaining',
              //   key: 'remaining',
              //   width: 120,
              //   render: (_, record, index) => {
              //     const budget = parseFloat(record.budget) || 0;
              //     const actual = parseFloat(record.actual) || 0;
              //     const remaining = budget - actual;
              //     return (
              //       <Text>${remaining.toFixed(2)}</Text>
              //     );
              //   }
              // }
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
                    value={`$${weeklyTotals.cogsBudget.toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>COGS Actual:</Text>
                  <Input
                    value={`$${weeklyTotals.cogsActual.toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>COGS Percentage:</Text>
                  <Input
                    value={`${weeklyTotals.cogsPercentage.toFixed(1)}%`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>Weekly Remaining COGS:</Text>
                  <Input
                    value={`$${weeklyTotals.weeklyRemainingCog.toFixed(2)}`}
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
              title={`COGS Performance: ${selectedDate ? selectedDate.format('MMM-YY') : ''}`}
              extra={
                <Space>
                  <Button 
                    onClick={processCogsData}
                    loading={storeLoading}
                  >
                    Refresh
                  </Button>
                  <Button 
                    type="default" 
                    icon={<PlusOutlined />} 
                    onClick={showAddWeeklyModal}
                    disabled={!selectedDate || (weeklyData.length > 0 && !areAllValuesZero(weeklyData))}
                  >
                    Add Weekly COGS
                  </Button>
                </Space>
              }
            >
              {dataNotFound || areAllValuesZero(weeklyData) ? (
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
                        budget: acc.budget + (parseFloat(day.budget) || 0),
                        actual: acc.actual + (parseFloat(day.actual) || 0)
                      }), {
                        budget: 0,
                        actual: 0
                      });

                      const percentage = totals.budget > 0 ? (totals.actual / totals.budget) * 100 : 0;
                      const remaining = totals.budget - totals.actual;

                      return (
                        <Card 
                          key={week.id} 
                          size="small" 
                          title={week.weekTitle}
                          extra={
                            <Space>
                              <Text type="secondary">
                                Total: ${totals.actual.toFixed(2)}
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
                                budget: acc.budget + (parseFloat(record.budget) || 0),
                                actual: acc.actual + (parseFloat(record.actual) || 0)
                              }), {
                                budget: 0,
                                actual: 0
                              });

                                                             const weekPercentage = weekTotals.budget > 0 ? (weekTotals.actual / weekTotals.budget) * 100 : 0;
                                                             // Use the weekly remaining COGS from the first daily entry
                              const weekRemaining = pageData.length > 0 ? parseFloat(pageData[0].weeklyRemainingCog) || 0 : parseFloat(weeklyTotals.weeklyRemainingCog) || 0;

                              return (
                                <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                                  <Table.Summary.Cell index={0}>
                                    <Text strong>Week Totals:</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={1}>
                                    <Text strong>${weekTotals.budget.toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={2}>
                                    <Text strong>${weekTotals.actual.toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={3}>
                                    <Text strong>{weekPercentage.toFixed(1)}%</Text>
                                  </Table.Summary.Cell>
                                  {/* <Table.Summary.Cell index={4}>
                                    <Text strong>${weekRemaining.toFixed(2)}</Text>
                                  </Table.Summary.Cell> */}
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
                                title: 'COGS Budget',
                                dataIndex: 'budget',
                                key: 'budget',
                                width: 140,
                                render: (value) => <Text>${(parseFloat(value) || 0).toFixed(2)}</Text>
                              },
                              {
                                title: 'COGS Actual',
                                dataIndex: 'actual',
                                key: 'actual',
                                width: 140,
                                render: (value) => <Text>${(parseFloat(value) || 0).toFixed(2)}</Text>
                              },
                              {
                                title: 'COGS %',
                                key: 'percentage',
                                width: 120,
                                render: (_, record) => {
                                  const budget = parseFloat(record.budget) || 0;
                                  const actual = parseFloat(record.actual) || 0;
                                  const percentage = budget > 0 ? (actual / budget) * 100 : 0;
                                  return (
                                    <Text>{percentage.toFixed(1)}%</Text>
                                  );
                                }
                              },
                                                             {
                                 title: 'Weekly Remaining COGS',
                                 key: 'remaining',
                                 width: 120,
                                 render: (_, record) => {
                                   // Use the weekly remaining COGS from the record data (prioritize record value)
                                   const weeklyRemainingCog = parseFloat(record.weeklyRemainingCog) || 0;
                                   return (
                                     <Text>${weeklyRemainingCog.toFixed(2)}</Text>
                                   );
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
