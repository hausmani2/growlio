import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, CalculatorOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../../store/store';
import LoadingSpinner from '../../layout/LoadingSpinner';
const { Title, Text } = Typography;

const NetProfitTable = ({ selectedDate, selectedYear, selectedMonth, weekDays = [], dashboardData = null, refreshDashboardData = null }) => {
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
      processNetProfitData();
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
        const netProfit = parseFloat(day.netProfit) || 0;
        const netProfitMargin = parseFloat(day.netProfitMargin) || 0;
        
        return netProfit === 0 && netProfitMargin === 0;
      });
    });
  };

  // Process net profit data from dashboard data
  const processNetProfitData = () => {
    if (!dashboardData) {
      setDataNotFound(true);
      return;
    }

    setDataNotFound(false);

    if (dashboardData['Net Profit']) {
      // Extract all daily entries into one consolidated table
      const allDailyEntries = dashboardData.daily_entries?.map((entry) => ({
        key: `day-${entry.date}`,
        date: dayjs(entry.date),
        dayName: dayjs(entry.date).format('dddd').toLowerCase(),
        netProfit: entry['Net Profit']?.net_profit || 0,
        netProfitMargin: entry['Net Profit']?.net_profit_margin || 0
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
            netProfit: 0,
            netProfitMargin: 0
          };
        });
      } else {
        // If no weekDays provided, use all daily entries or generate default structure
        dailyData = allDailyEntries.length > 0 ? allDailyEntries : [];
      }
      
      const weekStartDate = weekDays.length > 0 ? weekDays[0].date : selectedDate;
      
      setWeeklyData([{
        id: 'consolidated-week',
        weekTitle: 'Weekly Net Profit Data',
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
        message.warning('No weekly data to save. Please add weekly Net Profit data first.');
        return;
      }

      // Use the weekly totals from the form data
      const weeklyTotals = weekData.weeklyTotals || {
        netProfit: 0,
        netProfitMargin: 0
      };

      // Calculate final totals for this week
      const finalTotals = {
        netProfit: weeklyTotals.netProfit,
        netProfitMargin: weeklyTotals.netProfitMargin
      };

      // Transform data to API format - only save the current week's daily data
      const transformedData = {
        week_start: weekDays.length > 0 ? weekDays[0].date.format('YYYY-MM-DD') : selectedDate ? selectedDate.format('YYYY-MM-DD') : selectedYear && selectedMonth ? dayjs(`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`).format('YYYY-MM-DD') : null,
        section: "Net Profit",
        section_data: {
          weekly: {
            net_profit: finalTotals.netProfit,
            net_profit_margin: finalTotals.netProfitMargin
          },
          daily: weekData.dailyData.map(day => ({
            date: day.date.format('YYYY-MM-DD'),
            net_profit: (day.netProfit || 0),
            net_profit_margin: (day.netProfitMargin || 0)
          }))
        }
      };

      await saveDashboardData(transformedData);
      message.success(isEditMode ? 'Net profit data updated successfully!' : 'Net profit data saved successfully!');
      
      // Refresh all dashboard data to show updated data across all components
      if (refreshDashboardData) {
        await refreshDashboardData();
      } else {
        // Fallback: reload data to reflect changes
        // processNetProfitData(); 
      }
      
      setIsModalVisible(false);
      setEditingWeek(null);
      setIsEditMode(false);
    } catch (error) {
      message.error(`Failed to ${isEditMode ? 'update' : 'save'} net profit data: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };



  // Calculate weekly totals
  const calculateWeeklyTotals = (weekData) => {
    const totals = weekData.dailyData.reduce((acc, day) => ({
      netProfit: acc.netProfit + (parseFloat(day.netProfit) || 0),
      netProfitMargin: acc.netProfitMargin + (parseFloat(day.netProfitMargin) || 0)
    }), {
      netProfit: 0,
      netProfitMargin: 0
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
      startDate: weekDays.length > 0 ? weekDays[0].date : selectedDate,
      dailyData: generateDailyData(weekDays.length > 0 ? weekDays[0].date : selectedDate),
      // Add weekly totals for the modal
      weeklyTotals: {
        netProfit: 0,
        netProfitMargin: 0
      }
    });

    useEffect(() => {
      if (editingWeek) {
        // Ensure editingWeek has weeklyTotals property
        const weekDataWithTotals = {
          ...editingWeek,
          weeklyTotals: editingWeek.weeklyTotals || {
            netProfit: 0,
            netProfitMargin: 0
          }
        };
        setWeekFormData(weekDataWithTotals);
      } else {
        setWeekFormData({
          weekTitle: `Week ${weeklyData.length + 1}`,
          startDate: weekDays.length > 0 ? weekDays[0].date : selectedDate,
          dailyData: generateDailyData(weekDays.length > 0 ? weekDays[0].date : selectedDate),
          weeklyTotals: {
            netProfit: 0,
            netProfitMargin: 0
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
        title={isEditMode ? "Edit Weekly Net Profit Data" : "Add Weekly Net Profit Data"}
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
          <Card title="Weekly Net Profit Goals" size="small">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Net Profit:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.netProfit}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        netProfit: value
                      }
                    }));
                  }}
                  prefix="$"
                  placeholder="0.00"
                  className="w-full"
                  style={{ 
                    color: weekFormData.weeklyTotals.netProfit < 0 ? '#ff4d4f' : '#52c41a',
                    borderColor: weekFormData.weeklyTotals.netProfit < 0 ? '#ff4d4f' : '#52c41a'
                  }}
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Net Profit Margin %:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals.netProfitMargin}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setWeekFormData(prev => ({
                      ...prev,
                      weeklyTotals: {
                        ...prev.weeklyTotals,
                        netProfitMargin: value
                      }
                    }));
                  }}
                  suffix="%"
                  placeholder="0.0"
                  className="w-full"
                  style={{ 
                    color: weekFormData.weeklyTotals.netProfitMargin < 0 ? '#ff4d4f' : '#52c41a',
                    borderColor: weekFormData.weeklyTotals.netProfitMargin < 0 ? '#ff4d4f' : '#52c41a'
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
                  netProfit: acc.netProfit + (parseFloat(record.netProfit) || 0),
                  netProfitMargin: acc.netProfitMargin + (parseFloat(record.netProfitMargin) || 0)
                }), {
                  netProfit: 0,
                  netProfitMargin: 0
                });

                return (
                  <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                    <Table.Summary.Cell index={0}>
                      <Text strong className="text-sm sm:text-base">Totals:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ color: totals.netProfit < 0 ? '#ff4d4f' : '#52c41a' }} className="text-sm sm:text-base">
                        ${totals.netProfit.toFixed(2)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text strong style={{ color: totals.netProfitMargin < 0 ? '#ff4d4f' : '#52c41a' }} className="text-sm sm:text-base">
                        {totals.netProfitMargin.toFixed(1)}%
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
                      className="w-full"
                      style={{ 
                        color: value < 0 ? '#ff4d4f' : '#52c41a',
                        borderColor: value < 0 ? '#ff4d4f' : '#52c41a'
                      }}
                    />
                  )
                },
                {
                  title: 'Net Profit Margin %',
                  dataIndex: 'netProfitMargin',
                  key: 'netProfitMargin',
                  width: 180,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'netProfitMargin', parseFloat(e.target.value) || 0)}
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
      netProfit: 0,
      netProfitMargin: 0
    };
  };

  const weeklyResponseValues = getWeeklyResponseValues();

  return (
    <div className="w-full">
      <div className="pb-3 border-b border-gray-200">
        <h3 className="text-xl font-bold text-orange-600">Net Profit</h3>
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
            title={`Net Profit`}
            extra={
              <Space>
                <Button 
                  type="default" 
                  icon={dataNotFound || areAllValuesZero(weeklyData) ? <PlusOutlined /> : <EditOutlined />} 
                  onClick={dataNotFound || areAllValuesZero(weeklyData) ? showAddWeeklyModal : () => showEditWeeklyModal(weeklyData[0])}
                  disabled={!selectedDate}
                >
                  {dataNotFound || areAllValuesZero(weeklyData) ? "Add Weekly Net Profit" : "Edit Weekly Net Profit"}
                </Button>
              </Space>
            }
          >
            {dataNotFound || areAllValuesZero(weeklyData) ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No net profit data found for the selected period."
              />
            ) : (
              weeklyData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>No weekly net profit data added yet. Click "Add Weekly Net Profit" to get started.</div>
                </div>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {weeklyData.map((week) => {
                    const totals = calculateWeeklyTotals(week);
                    return (
                      <Card 
                        key={week.id} 
                        size="small" 
                       
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
                                netProfit: acc.netProfit + (parseFloat(record.netProfit) || 0),
                                netProfitMargin: acc.netProfitMargin + (parseFloat(record.netProfitMargin) || 0)
                              }), {
                                netProfit: 0,
                                netProfitMargin: 0
                              });

                              return (
                                <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                                  <Table.Summary.Cell index={0}>
                                    <Text strong className="text-sm sm:text-base">Week Totals:</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={1}>
                                    <Text strong style={{ color: weekTotals.netProfit < 0 ? '#ff4d4f' : '#52c41a' }} className="text-sm sm:text-base">
                                      ${weekTotals.netProfit.toFixed(2)}
                                    </Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={2}>
                                    <Text strong style={{ color: weekTotals.netProfitMargin < 0 ? '#ff4d4f' : '#52c41a' }} className="text-sm sm:text-base">
                                      {weekTotals.netProfitMargin.toFixed(1)}%
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
                                title: 'Net Profit',
                                dataIndex: 'netProfit',
                                key: 'netProfit',
                                width: 150,
                                render: (value) => (
                                  <Text style={{ color: (parseFloat(value) || 0) < 0 ? '#ff4d4f' : '#52c41a' }} className="text-sm sm:text-base">
                                    ${(parseFloat(value) || 0).toFixed(2)}
                                  </Text>
                                )
                              },
                              {
                                title: 'Net Profit Margin %',
                                dataIndex: 'netProfitMargin',
                                key: 'netProfitMargin',
                                width: 180,
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
          <Card title="Weekly Net Profit Totals" className="h-fit">
            {dataNotFound ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No net profit data available for this period."
                className="py-4"
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong className="text-sm sm:text-base">Net Profit:</Text>
                  <Input
                    value={`$${weeklyResponseValues.netProfit.toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ 
                      backgroundColor: '#f5f5f5',
                      color: weeklyResponseValues.netProfit < 0 ? '#ff4d4f' : '#52c41a'
                    }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Net Profit Margin %:</Text>
                  <Input
                    value={`${weeklyResponseValues.netProfitMargin.toFixed(1)}%`}
                    className="mt-1"
                    disabled
                    style={{ 
                      backgroundColor: '#f5f5f5',
                      color: weeklyResponseValues.netProfitMargin < 0 ? '#ff4d4f' : '#52c41a'
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

export default NetProfitTable;
