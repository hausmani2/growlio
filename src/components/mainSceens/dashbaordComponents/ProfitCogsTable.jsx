import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, CalculatorOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../../store/store';
import LoadingSpinner from '../../layout/LoadingSpinner';

const { Title, Text } = Typography;

const ProfitCogsTable = ({ selectedDate, selectedYear, selectedMonth, weekDays = [], dashboardData = null, refreshDashboardData = null }) => {
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
      processProfitData();
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
        const thirdPartyFees = parseFloat(day.thirdPartyFees) || 0;
        const profitAfterCogsLabor = parseFloat(day.profitAfterCogsLabor) || 0;
        const dailyVariableProfitPercentage = parseFloat(day.dailyVariableProfitPercentage) || 0;
        const weeklyVariableProfitPercentage = parseFloat(day.weeklyVariableProfitPercentage) || 0;
        
        return thirdPartyFees === 0 && 
               profitAfterCogsLabor === 0 && 
               dailyVariableProfitPercentage === 0 && 
               weeklyVariableProfitPercentage === 0;
      });
    });
  };

  // Process profit data from dashboard data
  const processProfitData = () => {
    if (!dashboardData) {
      setDataNotFound(true);
      return;
    }

    setDataNotFound(false);

    if (dashboardData['Profit']) {
      // Extract all daily entries into one consolidated table
      const allDailyEntries = dashboardData.daily_entries?.map((entry) => ({
        key: `day-${entry.date}`,
        date: dayjs(entry.date),
        dayName: dayjs(entry.date).format('dddd').toLowerCase(),
        thirdPartyFees: entry['Profit']?.third_party_fees || 0,
        profitAfterCogsLabor: entry['Profit']?.profit_after_cogs_labor || 0,
        dailyVariableProfitPercentage: entry['Profit']?.daily_variable_profit_percent || 0,
        weeklyVariableProfitPercentage: entry['Profit']?.weekly_variable_profit_percent || 0
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
            thirdPartyFees: 0,
            profitAfterCogsLabor: 0,
            dailyVariableProfitPercentage: 0,
            weeklyVariableProfitPercentage: 0
          };
        });
      } else {
        // If no weekDays provided, use all daily entries or generate default structure
        dailyData = allDailyEntries.length > 0 ? allDailyEntries : [];
      }
      
      const weekStartDate = weekDays.length > 0 ? weekDays[0].date : selectedDate;
      
      setWeeklyData([{
        id: 'consolidated-week',
        weekTitle: 'Weekly Profit Data',
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
        message.warning('No weekly data to save. Please add weekly Profit data first.');
        return;
      }

      // Use the weekly totals from the form data
      const weeklyTotals = weekData.weeklyTotals || {
        thirdPartyFees: 0,
        profitAfterCogsLabor: 0,
        dailyVariableProfitPercentage: 0,
        weeklyVariableProfitPercentage: 0
      };

      // Calculate final totals for this week
      const finalTotals = {
        thirdPartyFees: weeklyTotals.thirdPartyFees,
        profitAfterCogsLabor: weeklyTotals.profitAfterCogsLabor,
        dailyVariableProfitPercentage: weeklyTotals.dailyVariableProfitPercentage,
        weeklyVariableProfitPercentage: weeklyTotals.weeklyVariableProfitPercentage
      };

      // Transform data to API format - only save the current week's daily data
      const transformedData = {
        week_start: weekDays.length > 0 ? weekDays[0].date.format('YYYY-MM-DD') : selectedDate ? selectedDate.format('YYYY-MM-DD') : selectedYear && selectedMonth ? dayjs(`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`).format('YYYY-MM-DD') : null,
        section: "Profit",
        section_data: {
          weekly: {
            third_party_fees: finalTotals.thirdPartyFees,
            profit_after_cogs_labor: finalTotals.profitAfterCogsLabor,
            daily_variable_profit_percent: finalTotals.dailyVariableProfitPercentage,
            weekly_variable_profit_percent: finalTotals.weeklyVariableProfitPercentage
          },
          daily: weekData.dailyData.map(day => ({
            date: day.date.format('YYYY-MM-DD'),
            third_party_fees: (day.thirdPartyFees || 0),
            profit_after_cogs_labor: (day.profitAfterCogsLabor || 0),
            daily_variable_profit_percent: (day.dailyVariableProfitPercentage || 0),
            weekly_variable_profit_percent: (day.weeklyVariableProfitPercentage || 0)
          }))
        }
      };

      await saveDashboardData(transformedData);
      message.success(isEditMode ? 'Profit data updated successfully!' : 'Profit data saved successfully!');
      
      // Refresh all dashboard data to show updated data across all components
      if (refreshDashboardData) {
        await refreshDashboardData();
      } else {
        // Fallback: reload data to reflect changes
        processProfitData();
      }
      
      setIsModalVisible(false);
      setEditingWeek(null);
      setIsEditMode(false);
    } catch (error) {
      message.error(`Failed to ${isEditMode ? 'update' : 'save'} profit data: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate weekly totals
  const calculateWeeklyTotals = (weekData) => {
    const totals = weekData.dailyData.reduce((acc, day) => ({
      thirdPartyFees: acc.thirdPartyFees + (parseFloat(day.thirdPartyFees) || 0),
      profitAfterCogsLabor: acc.profitAfterCogsLabor + (parseFloat(day.profitAfterCogsLabor) || 0),
      dailyVariableProfitPercentage: acc.dailyVariableProfitPercentage + (parseFloat(day.dailyVariableProfitPercentage) || 0),
      weeklyVariableProfitPercentage: acc.weeklyVariableProfitPercentage + (parseFloat(day.weeklyVariableProfitPercentage) || 0)
    }), {
      thirdPartyFees: 0,
      profitAfterCogsLabor: 0,
      dailyVariableProfitPercentage: 0,
      weeklyVariableProfitPercentage: 0
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
        thirdPartyFees: 0,
        profitAfterCogsLabor: 0,
        dailyVariableProfitPercentage: 0,
        weeklyVariableProfitPercentage: 0
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
        thirdPartyFees: 0,
        profitAfterCogsLabor: 0,
        dailyVariableProfitPercentage: 0,
        weeklyVariableProfitPercentage: 0
      }
    });

         useEffect(() => {
       if (editingWeek) {
         // Ensure editingWeek has weeklyTotals property
         const weekDataWithTotals = {
           ...editingWeek,
           weeklyTotals: editingWeek.weeklyTotals || {
             thirdPartyFees: 0,
             profitAfterCogsLabor: 0,
             dailyVariableProfitPercentage: 0,
             weeklyVariableProfitPercentage: 0
           }
         };
         setWeekFormData(weekDataWithTotals);
       } else {
         setWeekFormData({
           weekTitle: `Week ${weeklyData.length + 1}`,
           startDate: weekDays.length > 0 ? weekDays[0].date : selectedDate,
           dailyData: generateDailyData(weekDays.length > 0 ? weekDays[0].date : selectedDate),
           weeklyTotals: {
             thirdPartyFees: 0,
             profitAfterCogsLabor: 0,
             dailyVariableProfitPercentage: 0,
             weeklyVariableProfitPercentage: 0
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
        title={isEditMode ? "Edit Weekly Profit Data" : "Add Weekly Profit Data"}
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
        width="90vw"
        style={{ maxWidth: '1200px' }}
      >
        {(isSubmitting || storeLoading) && (
          <LoadingSpinner 
            spinning={true} 
            tip="Saving data..." 
            fullScreen={false}
          />
        )}
        <Space direction="vertical" style={{ width: '100%' }} size="large" className="w-full">
          {/* Weekly Goals Input Section - Responsive Grid */}
          <Card title="Weekly Profit Goals" size="small">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Third Party Fees:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.thirdPartyFees}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        thirdPartyFees: value
                      }
                    }));
                  }}
                  prefix="$"
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Profit After COGS & Labor:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.profitAfterCogsLabor}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        profitAfterCogsLabor: value
                      }
                    }));
                  }}
                  prefix="$"
                  placeholder="0.00"
                  className="w-full"
                  style={{ 
                    color: weekFormData.weeklyTotals.profitAfterCogsLabor < 0 ? '#ff4d4f' : '#52c41a',
                    borderColor: weekFormData.weeklyTotals.profitAfterCogsLabor < 0 ? '#ff4d4f' : '#52c41a'
                  }}
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Daily Variable Profit %:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.dailyVariableProfitPercentage}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        dailyVariableProfitPercentage: value
                      }
                    }));
                  }}
                  suffix="%"
                  placeholder="0.0"
                  className="w-full"
                  style={{ 
                    color: weekFormData.weeklyTotals.dailyVariableProfitPercentage < 0 ? '#ff4d4f' : '#52c41a',
                    borderColor: weekFormData.weeklyTotals.dailyVariableProfitPercentage < 0 ? '#ff4d4f' : '#52c41a'
                  }}
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Weekly Variable Profit %:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.weeklyVariableProfitPercentage}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        weeklyVariableProfitPercentage: value
                      }
                    }));
                  }}
                  suffix="%"
                  placeholder="0.0"
                  className="w-full"
                  style={{ 
                    color: weekFormData.weeklyTotals.weeklyVariableProfitPercentage < 0 ? '#ff4d4f' : '#52c41a',
                    borderColor: weekFormData.weeklyTotals.weeklyVariableProfitPercentage < 0 ? '#ff4d4f' : '#52c41a'
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Table Section - Responsive */}
          <div className="overflow-x-auto">
            <Table
              dataSource={weekFormData.dailyData}
              pagination={false}
              size="small"
              rowKey={(record) => record.key || `modal-day-${record.date?.format('YYYY-MM-DD')}`}
              scroll={{ x: 'max-content' }}
              summary={(pageData) => {
                const totals = pageData.reduce((acc, record) => ({
                  thirdPartyFees: acc.thirdPartyFees + (parseFloat(record.thirdPartyFees) || 0),
                  profitAfterCogsLabor: acc.profitAfterCogsLabor + (parseFloat(record.profitAfterCogsLabor) || 0),
                  dailyVariableProfitPercentage: acc.dailyVariableProfitPercentage + (parseFloat(record.dailyVariableProfitPercentage) || 0),
                  weeklyVariableProfitPercentage: acc.weeklyVariableProfitPercentage + (parseFloat(record.weeklyVariableProfitPercentage) || 0)
                }), {
                  thirdPartyFees: 0,
                  profitAfterCogsLabor: 0,
                  dailyVariableProfitPercentage: 0,
                  weeklyVariableProfitPercentage: 0
                });

                return (
                  <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                    <Table.Summary.Cell index={0}>
                      <Text strong>Totals:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong>${totals.thirdPartyFees.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text strong style={{ color: totals.profitAfterCogsLabor < 0 ? '#ff4d4f' : '#52c41a' }}>
                        ${totals.profitAfterCogsLabor.toFixed(2)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Text strong style={{ color: totals.dailyVariableProfitPercentage < 0 ? '#ff4d4f' : '#52c41a' }}>
                        {totals.dailyVariableProfitPercentage.toFixed(1)}%
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <Text strong style={{ color: totals.weeklyVariableProfitPercentage < 0 ? '#ff4d4f' : '#52c41a' }}>
                        {totals.weeklyVariableProfitPercentage.toFixed(1)}%
                      </Text>
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
                  fixed: 'left',
                  render: (text, record) => (
                    <div>
                      <div className="font-medium text-sm sm:text-base">{text}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.date.format('MMM DD, YYYY')}
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Third Party Fees',
                  dataIndex: 'thirdPartyFees',
                  key: 'thirdPartyFees',
                  width: 150,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'thirdPartyFees', parseFloat(e.target.value) || 0)}
                      prefix="$"
                      className="w-full"
                    />
                  )
                },
                {
                  title: 'Profit After COGS & Labor',
                  dataIndex: 'profitAfterCogsLabor',
                  key: 'profitAfterCogsLabor',
                  width: 200,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'profitAfterCogsLabor', parseFloat(e.target.value) || 0)}
                      prefix="$"
                      className="w-full"
                      style={{ 
                        color: value < 0 ? '#ff4d4f' : '#52c41a',
                        borderColor: value < 0 ? '#ff4d4f' : '#52c41a'
                      }}
                    />
                  )
                },
                {
                  title: 'Daily Variable Profit %',
                  dataIndex: 'dailyVariableProfitPercentage',
                  key: 'dailyVariableProfitPercentage',
                  width: 180,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'dailyVariableProfitPercentage', parseFloat(e.target.value) || 0)}
                      suffix="%"
                      className="w-full"
                      style={{ 
                        color: value < 0 ? '#ff4d4f' : '#52c41a',
                        borderColor: value < 0 ? '#ff4d4f' : '#52c41a'
                      }}
                    />
                  )
                },
                {
                  title: 'Weekly Variable Profit %',
                  dataIndex: 'weeklyVariableProfitPercentage',
                  key: 'weeklyVariableProfitPercentage',
                  width: 180,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'weeklyVariableProfitPercentage', parseFloat(e.target.value) || 0)}
                      suffix="%"
                      className="w-full"
                      style={{ 
                        color: value < 0 ? '#ff4d4f' : '#52c41a',
                        borderColor: value < 0 ? '#ff4d4f' : '#52c41a'
                      }}
                    />
                  )
                }
              ]}
            />
          </div>
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
      thirdPartyFees: 0,
      profitAfterCogsLabor: 0,
      dailyVariableProfitPercentage: 0,
      weeklyVariableProfitPercentage: 0
    };
  };

  const weeklyResponseValues = getWeeklyResponseValues();

  return (
    <div className="w-full">
      <div className="pb-3 border-b border-gray-200">
        <h3 className="text-xl font-bold text-orange-600">Profit After COGS & Labor</h3>
      </div>
      
      {storeError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <Text type="danger">{storeError}</Text>
        </div>
      )}
      
      <Row gutter={[16, 16]}>
       

        {/* Weekly Data Section */}
        <Col xs={24} sm={24} md={24} lg={18} xl={18}>
          <Card 
            title={`Profit After COGS & Labor`}
            extra={
              <Space>
                <Button 
                  type="default" 
                  icon={dataNotFound || areAllValuesZero(weeklyData) ? <PlusOutlined /> : <EditOutlined />} 
                  onClick={dataNotFound || areAllValuesZero(weeklyData) ? showAddWeeklyModal : () => showEditWeeklyModal(weeklyData[0])}
                  disabled={!selectedDate}
                >
                  {dataNotFound || areAllValuesZero(weeklyData) ? "Add Weekly Profit" : "Edit Weekly Profit"}
                </Button>
              </Space>
            }
          >
            {dataNotFound || areAllValuesZero(weeklyData) ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No profit data found for the selected period."
              />
            ) : (
              weeklyData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>No weekly profit data added yet. Click "Add Weekly Profit" to get started.</div>
                </div>
              ) : (
                                 <Space direction="vertical" style={{ width: '100%' }} size="large">
                   {weeklyData.map((week) => {
                     return (
                       <Card 
                         key={week.id} 
                         size="small" 
                         title={week.weekTitle}
                         extra={
                           <Text type="secondary">
                             Total: ${calculateWeeklyTotals(week).profitAfterCogsLabor.toFixed(2)}
                           </Text>
                         }
                       >
                        <div className="overflow-x-auto">
                          <Table
                            dataSource={week.dailyData || []}
                            pagination={false}
                            size="small"
                            rowKey={(record) => record.key || `day-${record.date?.format('YYYY-MM-DD')}`}
                            scroll={{ x: 'max-content' }}
                            summary={(pageData) => {
                              const weekTotals = pageData.reduce((acc, record) => ({
                                thirdPartyFees: acc.thirdPartyFees + (parseFloat(record.thirdPartyFees) || 0),
                                profitAfterCogsLabor: acc.profitAfterCogsLabor + (parseFloat(record.profitAfterCogsLabor) || 0),
                                dailyVariableProfitPercentage: acc.dailyVariableProfitPercentage + (parseFloat(record.dailyVariableProfitPercentage) || 0),
                                weeklyVariableProfitPercentage: acc.weeklyVariableProfitPercentage + (parseFloat(record.weeklyVariableProfitPercentage) || 0)
                              }), {
                                thirdPartyFees: 0,
                                profitAfterCogsLabor: 0,
                                dailyVariableProfitPercentage: 0,
                                weeklyVariableProfitPercentage: 0
                              });

                              return (
                                <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                                  <Table.Summary.Cell index={0}>
                                    <Text strong>Week Totals:</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={1}>
                                    <Text strong>${weekTotals.thirdPartyFees.toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={2}>
                                    <Text strong style={{ color: weekTotals.profitAfterCogsLabor < 0 ? '#ff4d4f' : '#52c41a' }}>
                                      ${weekTotals.profitAfterCogsLabor.toFixed(2)}
                                    </Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={3}>
                                    <Text strong style={{ color: weekTotals.dailyVariableProfitPercentage < 0 ? '#ff4d4f' : '#52c41a' }}>
                                      {weekTotals.dailyVariableProfitPercentage.toFixed(1)}%
                                    </Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={4}>
                                    <Text strong style={{ color: weekTotals.weeklyVariableProfitPercentage < 0 ? '#ff4d4f' : '#52c41a' }}>
                                      {weekTotals.weeklyVariableProfitPercentage.toFixed(1)}%
                                    </Text>
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
                                fixed: 'left',
                                render: (text, record) => (
                                  <div>
                                    <div className="font-medium text-sm sm:text-base">{text}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                      {record.date.format('MMM DD, YYYY')}
                                    </div>
                                  </div>
                                )
                              },
                              {
                                title: 'Third Party Fees',
                                dataIndex: 'thirdPartyFees',
                                key: 'thirdPartyFees',
                                width: 140,
                                render: (value) => <Text className="text-sm sm:text-base">${(parseFloat(value) || 0).toFixed(2)}</Text>
                              },
                              {
                                title: 'Profit After COGS & Labor',
                                dataIndex: 'profitAfterCogsLabor',
                                key: 'profitAfterCogsLabor',
                                width: 180,
                                render: (value) => (
                                  <Text style={{ color: (parseFloat(value) || 0) < 0 ? '#ff4d4f' : '#52c41a' }} className="text-sm sm:text-base">
                                    ${(parseFloat(value) || 0).toFixed(2)}
                                  </Text>
                                )
                              },
                              {
                                title: 'Daily Variable Profit %',
                                dataIndex: 'dailyVariableProfitPercentage',
                                key: 'dailyVariableProfitPercentage',
                                width: 160,
                                render: (value) => (
                                  <Text style={{ color: (parseFloat(value) || 0) < 0 ? '#ff4d4f' : '#52c41a' }} className="text-sm sm:text-base">
                                    {(parseFloat(value) || 0).toFixed(1)}%
                                  </Text>
                                )
                              },
                              {
                                title: 'Weekly Variable Profit %',
                                dataIndex: 'weeklyVariableProfitPercentage',
                                key: 'weeklyVariableProfitPercentage',
                                width: 160,
                                render: (value) => (
                                  <Text style={{ color: (parseFloat(value) || 0) < 0 ? '#ff4d4f' : '#52c41a' }} className="text-sm sm:text-base">
                                    {(parseFloat(value) || 0).toFixed(1)}%
                                  </Text>
                                )
                              }
                            ]}
                          />
                        </div>
                      </Card>
                    );
                  })}
                </Space>
              )
            )}
          </Card>
        </Col>
         {/* Weekly Totals Section */}
         <Col xs={24} sm={24} md={24} lg={6} xl={6}>
          <Card title="Weekly Profit Totals" className="h-fit">
            {dataNotFound ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No profit data available for this period."
                className="py-4"
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong className="text-sm sm:text-base">Third Party Fees:</Text>
                  <Input
                    value={`$${weeklyResponseValues.thirdPartyFees.toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Profit After COGS & Labor:</Text>
                  <Input
                    value={`$${weeklyResponseValues.profitAfterCogsLabor.toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ 
                      backgroundColor: '#f5f5f5',
                      color: weeklyResponseValues.profitAfterCogsLabor < 0 ? '#ff4d4f' : '#52c41a'
                    }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Daily Variable Profit %:</Text>
                  <Input
                    value={`${weeklyResponseValues.dailyVariableProfitPercentage.toFixed(1)}%`}
                    className="mt-1"
                    disabled
                    style={{ 
                      backgroundColor: '#f5f5f5',
                      color: weeklyResponseValues.dailyVariableProfitPercentage < 0 ? '#ff4d4f' : '#52c41a'
                    }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Weekly Variable Profit %:</Text>
                  <Input
                    value={`${weeklyResponseValues.weeklyVariableProfitPercentage.toFixed(1)}%`}
                    className="mt-1"
                    disabled
                    style={{ 
                      backgroundColor: '#f5f5f5',
                      color: weeklyResponseValues.weeklyVariableProfitPercentage < 0 ? '#ff4d4f' : '#52c41a'
                    }}
                  />
                </div>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <WeeklyModal />
    </div>
  );
};

export default ProfitCogsTable;
