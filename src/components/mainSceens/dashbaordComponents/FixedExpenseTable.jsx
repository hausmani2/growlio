import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, CalculatorOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../../store/store';
import LoadingSpinner from '../../layout/LoadingSpinner';

const { Title, Text } = Typography;

const FixedExpenseTable = ({ selectedDate, weekDays = [], dashboardData = null, refreshDashboardData = null }) => {
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
      processFixedExpenseData();
    } else {
      // Reset data when no dashboard data is available
      setWeeklyData([]);
      setDataNotFound(true);
    }
  }, [dashboardData, weekDays]);

  // Helper function to check if all values in weeklyData are zeros
  const areAllValuesZero = (weeklyData) => {
    if (!weeklyData || weeklyData.length === 0) return true;
    
    return weeklyData.every(week => {
      if (!week.dailyData || week.dailyData.length === 0) return true;
      
      return week.dailyData.every(day => {
        const fixedWeeklyExpenses = parseFloat(day.fixedWeeklyExpenses) || 0;
        
        return fixedWeeklyExpenses === 0;
      });
    });
  };

  // Process fixed expense data from dashboard data
  const processFixedExpenseData = () => {
    if (!dashboardData) {
      setDataNotFound(true);
      return;
    }

    setDataNotFound(false);

    if (dashboardData['Expenses']) {
      // Extract all daily entries into one consolidated table
      const allDailyEntries = dashboardData.daily_entries?.map((entry) => ({
        key: `day-${entry.date}`,
        date: dayjs(entry.date),
        dayName: dayjs(entry.date).format('dddd').toLowerCase(),
        fixedWeeklyExpenses: entry['Expenses']?.fixed_weekly_expenses || 0
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
            fixedWeeklyExpenses: 0
          };
        });
      } else {
        // If no weekDays provided, use all daily entries or generate default structure
        dailyData = allDailyEntries.length > 0 ? allDailyEntries : [];
      }
      
      const weekStartDate = weekDays.length > 0 ? weekDays[0].date : selectedDate;
      
      setWeeklyData([{
        id: 'consolidated-week',
        weekTitle: 'Weekly Fixed Expenses Data',
        startDate: weekStartDate,
        dailyData: dailyData
      }]);
    } else {
      // No data found, reset to defaults
      setWeeklyData([]);
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
        message.warning('No weekly data to save. Please add weekly fixed expenses data first.');
        return;
      }

      // Use the weekly totals from the form data
      const weeklyTotals = weekData.weeklyTotals || {
        fixedWeeklyExpenses: 0
      };

      // Calculate final totals for this week
      const finalTotals = {
        fixedWeeklyExpenses: weeklyTotals.fixedWeeklyExpenses
      };

      // Transform data to API format - only save the current week's daily data
      const transformedData = {
        week_start: weekDays.length > 0 ? weekDays[0].date.format('YYYY-MM-DD') : selectedDate.format('YYYY-MM-DD'),
        section: "Expenses",
        section_data: {
          weekly: {
            fixed_weekly_expenses: finalTotals.fixedWeeklyExpenses
          },
          daily: weekData.dailyData.map(day => ({
            date: day.date.format('YYYY-MM-DD'),
            fixed_weekly_expenses: (day.fixedWeeklyExpenses || 0)
          }))
        }
      };

      await saveDashboardData(transformedData);
      message.success(isEditMode ? 'Fixed expenses data updated successfully!' : 'Fixed expenses data saved successfully!');
      
      // Refresh all dashboard data to show updated data across all components
      if (refreshDashboardData) {
        await refreshDashboardData();
      } else {
        // Fallback: reload data after saving
        await processFixedExpenseData(); 
      }
      
      setIsModalVisible(false);
      setEditingWeek(null);
      setIsEditMode(false);
    } catch (error) {
      message.error(`Failed to ${isEditMode ? 'update' : 'save'} fixed expenses data: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate weekly totals
  const calculateWeeklyTotals = (weekData) => {
    const totals = weekData.dailyData.reduce((acc, day) => ({
      fixedWeeklyExpenses: acc.fixedWeeklyExpenses + (parseFloat(day.fixedWeeklyExpenses) || 0)
    }), {
      fixedWeeklyExpenses: 0
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
        fixedWeeklyExpenses: 0
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
        fixedWeeklyExpenses: 0
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
            fixedWeeklyExpenses: 0
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

    // return (
    //   <Modal
    //     title={isEditMode ? "Edit Weekly Fixed Expenses Data" : "Add Weekly Fixed Expenses Data"}
    //     open={isModalVisible}
    //     onCancel={() => {
    //       setIsModalVisible(false);
    //       setEditingWeek(null);
    //       setIsEditMode(false);
    //     }}
    //     footer={[
    //       <Button key="cancel" onClick={() => {
    //         setIsModalVisible(false);
    //         setEditingWeek(null);
    //         setIsEditMode(false);
    //       }}>
    //         Cancel
    //       </Button>,
    //       <Button key="submit" type="primary" onClick={handleSubmit} loading={isSubmitting || storeLoading}>
    //         {isEditMode ? 'Update' : 'Add'} Week
    //       </Button>
    //     ]}
    //     width={1200}
    //   >
    //     {(isSubmitting || storeLoading) && (
    //       <LoadingSpinner 
    //         spinning={true} 
    //         tip="Saving data..." 
    //         fullScreen={false}
    //       />
    //     )}
    //     <Space direction="vertical" style={{ width: '100%' }} size="large">

    //       {/* Weekly Goals Input Section */}
    //       <Card title="Weekly Fixed Expenses Goals" size="small">
    //         <Row gutter={16}>
    //           <Col span={6}>
    //             <Text strong>Fixed Weekly Expenses:</Text>
    //             <Input
    //               type="number"
    //               value={weekFormData.weeklyTotals.fixedWeeklyExpenses}
    //               onChange={(e) => {
    //                 const value = parseFloat(e.target.value) || 0;
    //                 setWeekFormData(prev => ({
    //                   ...prev,
    //                   weeklyTotals: {
    //                     ...prev.weeklyTotals,
    //                     fixedWeeklyExpenses: value
    //                   }
    //                 }));
    //               }}
    //               prefix="$"
    //               placeholder="0.00"
    //             />
    //           </Col>
    //         </Row>
    //       </Card>

    //       <Table
    //         dataSource={weekFormData.dailyData}
    //         pagination={false}
    //         size="small"
    //         summary={(pageData) => {
    //           const totals = pageData.reduce((acc, record) => ({
    //             fixedWeeklyExpenses: acc.fixedWeeklyExpenses + (parseFloat(record.fixedWeeklyExpenses) || 0)
    //           }), {
    //             fixedWeeklyExpenses: 0
    //           });

    //           return (
    //             <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
    //               <Table.Summary.Cell index={0}>
    //                 <Text strong>Totals:</Text>
    //               </Table.Summary.Cell>
    //               <Table.Summary.Cell index={1}>
    //                 <Text strong>${totals.fixedWeeklyExpenses.toFixed(2)}</Text>
    //               </Table.Summary.Cell>
    //             </Table.Summary.Row>
    //           );
    //         }}
    //         columns={[
    //           {
    //             title: 'Day',
    //             dataIndex: 'dayName',
    //             key: 'dayName',
    //             width: 120,
    //             render: (text, record) => (
    //               <div>
    //                 <div>{text}</div>
    //                 <div style={{ fontSize: '12px', color: '#666' }}>
    //                   {record.date.format('MMM DD, YYYY')}
    //                 </div>
    //               </div>
    //             )
    //           },
    //           {
    //             title: 'Fixed Weekly Expenses',
    //             dataIndex: 'fixedWeeklyExpenses',
    //             key: 'fixedWeeklyExpenses',
    //             width: 200,
    //             render: (value, record, index) => (
    //               <Input
    //                 type="number"
    //                 value={value}
    //                 onChange={(e) => handleDailyDataChange(index, 'fixedWeeklyExpenses', parseFloat(e.target.value) || 0)}
    //                 prefix="$"
    //               />
    //             )
    //           }
    //         ]}
    //       />
    //     </Space>
    //   </Modal>
    // );
  };

  // Get weekly response values from API
  const getWeeklyResponseValues = () => {
    if (weeklyData.length > 0 && weeklyData[0].weeklyTotals) {
      return weeklyData[0].weeklyTotals;
    }
    return {
      fixedWeeklyExpenses: 0
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
                    onClick={processFixedExpenseData}
                    loading={storeLoading}
                  >
                    Refresh
                  </Button>
                  {/* <Button 
                    type="default" 
                    icon={<PlusOutlined />} 
                    onClick={showAddWeeklyModal}
                    disabled={!selectedDate || (weeklyData.length > 0 && !areAllValuesZero(weeklyData))}
                  >
                    Add Weekly Fixed Expenses
                  </Button> */}
                </Space>
              }
            >
              {dataNotFound || areAllValuesZero(weeklyData) ? (
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
                            </Space>
                          }
                        >
                          <Table
                            dataSource={week.dailyData || []}
                            pagination={false}
                            size="small"
                            summary={(pageData) => {
                              const weekTotals = pageData.reduce((acc, record) => ({
                                fixedWeeklyExpenses: acc.fixedWeeklyExpenses + (parseFloat(record.fixedWeeklyExpenses) || 0)
                              }), {
                                fixedWeeklyExpenses: 0
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

export default FixedExpenseTable;
