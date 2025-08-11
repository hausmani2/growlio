import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../../store/store';
import LoadingSpinner from '../../layout/LoadingSpinner';

const { Title, Text } = Typography;

const LabourTable = ({ selectedDate, weekDays = [], dashboardData = null, refreshDashboardData = null }) => {
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
    saveDashboardData, 
    loading: storeLoading, 
    error: storeError,
    restaurantGoals
  } = useStore();

  // Get average hourly rate from restaurant goals
  const getAverageHourlyRate = () => {
    if (restaurantGoals && restaurantGoals.avg_hourly_rate) {
      return parseFloat(restaurantGoals.avg_hourly_rate);
    }
    return hourlyRate; // Fallback to static hourly rate
  };

  // Get labor record method from restaurant goals
  const getLaborRecordMethod = () => {
    if (restaurantGoals && restaurantGoals.labor_record_method) {
      return restaurantGoals.labor_record_method;
    }
    return 'daily-hours-costs'; // Default fallback
  };

  // Helper function to format display values - show "0" instead of "0.00" for zero values
  const formatDisplayValue = (value) => {
    const numValue = parseFloat(value) || 0;
    return numValue === 0 ? "0" : numValue.toString();
  };

  // Process dashboard data when it changes
  useEffect(() => {
    if (dashboardData) {
      processLaborData();
    } else {
      // Reset data when no dashboard data is available
      setWeeklyData([]);
      setWeeklyTotals({
        labor_hours_budget: "0.00",
        labor_hours_actual: "0.00",
        budgeted_labor_dollars: "0.00",
        actual_labor_dollars: "0.00",
        daily_labor_rate: "0.00"
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

  // Process labor data from dashboard data
  const processLaborData = () => {
    if (!dashboardData) {
      setDataNotFound(true);
      return;
    }

    setDataNotFound(false);

    if (dashboardData['Labor Performance']) {
      // Extract weekly totals from the API response
      const laborPerformance = dashboardData['Labor Performance'];
      setWeeklyTotals({
        labor_hours_budget: parseFloat(laborPerformance.labor_hours_budget) || 0,
        labor_hours_actual: parseFloat(laborPerformance.labor_hours_actual) || 0,
        budgeted_labor_dollars: parseFloat(laborPerformance.budgeted_labor_dollars) || 0,
        actual_labor_dollars: parseFloat(laborPerformance.actual_labor_dollars) || 0,
        daily_labor_rate: parseFloat(laborPerformance.daily_labor_rate) || 0
      });

      // Extract all daily entries into one consolidated table
      const allDailyEntries = dashboardData.daily_entries?.map((entry) => ({
        key: `day-${entry.date}`,
        date: dayjs(entry.date),
        dayName: dayjs(entry.date).format('dddd').toLowerCase(),
        laborHoursBudget: parseFloat(entry['Labor Performance']?.labor_hours_budget) || 0,
        laborHoursActual: parseFloat(entry['Labor Performance']?.labor_hours_actual) || 0,
        budgetedLaborDollars: parseFloat(entry['Labor Performance']?.budgeted_labor_dollars) || 0,
        actualLaborDollars: parseFloat(entry['Labor Performance']?.actual_labor_dollars) || 0,
        dailyLaborRate: parseFloat(entry['Labor Performance']?.daily_labor_rate) || 0,
        dailyLaborPercentage: parseFloat(entry['Labor Performance']?.daily_labour_percent) || 0,
        weeklyLaborPercentage: parseFloat(entry['Labor Performance']?.weekly_labour_percent) || 0
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
            actualLaborDollars: 0,
            dailyLaborRate: 0,
            dailyLaborPercentage: 0,
            weeklyLaborPercentage: 0
          };
        });
      } else {
        // If no weekDays provided, use all daily entries or generate default structure
        dailyData = allDailyEntries.length > 0 ? allDailyEntries : [];
      }
      
      const weekStartDate = weekDays.length > 0 ? weekDays[0].date : selectedDate;
      
      setWeeklyData([{
        id: 'consolidated-week',
        weekTitle: 'Weekly Labor Data',
        startDate: weekStartDate,
        dailyData: dailyData
      }]);
    } else {
      // No data found, reset to defaults
      setWeeklyData([]);
      setWeeklyTotals({
        labor_hours_budget: "0.00",
        labor_hours_actual: "0.00",
        budgeted_labor_dollars: "0.00",
        actual_labor_dollars: "0.00",
        daily_labor_rate: "0.00"
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
            labor_hours_budget: parseFloat(finalTotals.laborHoursBudget) || 0,
            labor_hours_actual: parseFloat(finalTotals.laborHoursActual) || 0,
            budgeted_labor_dollars: parseFloat(finalTotals.budgetedLaborDollars) || 0,
            actual_labor_dollars: parseFloat(finalTotals.actualLaborDollars) || 0,
            daily_labor_rate: parseFloat(finalTotals.dailyLaborRate) || 0,
            daily_labour_percent: parseFloat(finalTotals.dailyLaborPercentage) || 0,
            weekly_labour_percent: parseFloat(finalTotals.weeklyLaborPercentage) || 0
          },
          daily: weekData.dailyData.map(day => ({
            date: day.date.format('YYYY-MM-DD'),
            day: day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1), // Capitalize first letter
            labor_hours_budget: parseFloat(day.laborHoursBudget) || 0,
            labor_hours_actual: parseFloat(day.laborHoursActual) || 0,
            budgeted_labor_dollars: parseFloat(day.budgetedLaborDollars) || 0,
            actual_labor_dollars: parseFloat(day.actualLaborDollars) || 0,
            daily_labor_rate: parseFloat(getAverageHourlyRate()) || 0,
            daily_labour_percent: parseFloat(day.dailyLaborPercentage) || 0,
            weekly_labour_percent: parseFloat(day.weeklyLaborPercentage) || 0
          }))
        }
      };

      await saveDashboardData(transformedData);
      message.success(isEditMode ? 'Labor data updated successfully!' : 'Labor data saved successfully!');
      
      // Refresh all dashboard data to show updated data across all components
      if (refreshDashboardData) {
        await refreshDashboardData();
      } else {
        // Fallback: reload data after saving to update totals and table
        processLaborData(); 
      }
      
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
        actualLaborDollars: 0,
        dailyLaborRate: 0,
        dailyLaborPercentage: 0,
        weeklyLaborPercentage: 0
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
        // Ensure editingWeek has the proper structure with weeklyTotals
        const editingWeekWithDefaults = {
          ...editingWeek,
          weeklyTotals: editingWeek.weeklyTotals || {
            laborHoursBudget: 0,
            laborHoursActual: 0,
            budgetedLaborDollars: 0,
            actualLaborDollars: 0,
            dailyLaborRate: hourlyRate,
            dailyLaborPercentage: 0,
            weeklyLaborPercentage: 0
          }
        };
        setWeekFormData(editingWeekWithDefaults);
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
          <Card title="Weekly Labor Goals" size="small">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Labor Hours - Budget:</Text>
                <Input
                  type="number"
                  value={formatDisplayValue(weekFormData.weeklyTotals?.laborHoursBudget || 0)}
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
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Labor Hours - Actual:</Text>
                <Input
                  type="number"
                  value={formatDisplayValue(weekFormData.weeklyTotals?.laborHoursActual || 0)}
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
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Budgeted Labor $:</Text>
                <Input
                  type="number"
                  value={formatDisplayValue(weekFormData.weeklyTotals?.budgetedLaborDollars || 0)}
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
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Actual Labor $:</Text>
                <Input
                  type="number"
                  value={formatDisplayValue(weekFormData.weeklyTotals?.actualLaborDollars || 0)}
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
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Daily Labor Rate:</Text>
                <Input
                  type="number"
                  value={weekFormData.weeklyTotals?.dailyLaborRate || hourlyRate}
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
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Daily Labor %:</Text>
                <Input
                  type="number"
                  value={(weekFormData.weeklyTotals?.actualLaborDollars || 0) > 0 ? 
                    (((weekFormData.weeklyTotals?.actualLaborDollars || 0) / (weekFormData.weeklyTotals?.dailyLaborRate || hourlyRate))).toFixed(1) : 0}
                  suffix="%"
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                  className="w-full"
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Weekly Labor %:</Text>
                <Input
                  type="number"
                  value={(weekFormData.weeklyTotals?.actualLaborDollars || 0) > 0 ? 
                    (((weekFormData.weeklyTotals?.actualLaborDollars || 0) / ((weekFormData.weeklyTotals?.actualLaborDollars || 0) + 5000)) * 100).toFixed(1) : 0}
                  suffix="%"
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                  className="w-full"
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

                const laborRecordMethod = getLaborRecordMethod();
                const showHours = laborRecordMethod === 'hours-only' || laborRecordMethod === 'daily-hours-costs';
                const showCosts = laborRecordMethod === 'cost-only' || laborRecordMethod === 'daily-hours-costs';

                return (
                  <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                    <Table.Summary.Cell index={0}>
                      <Text strong>Totals:</Text>
                    </Table.Summary.Cell>
                    {showHours && (
                      <Table.Summary.Cell index={1}>
                        <Text strong>{totals.laborHoursActual.toFixed(1)} hrs</Text>
                      </Table.Summary.Cell>
                    )}
                    {showCosts && (
                      <Table.Summary.Cell index={showHours ? 2 : 1}>
                        <Text strong>${totals.actualLaborDollars.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    )}
                  </Table.Summary.Row>
                );
              }}
              columns={(() => {
                const laborRecordMethod = getLaborRecordMethod();
                const showHours = laborRecordMethod === 'hours-only' || laborRecordMethod === 'daily-hours-costs';
                const showCosts = laborRecordMethod === 'cost-only' || laborRecordMethod === 'daily-hours-costs';

                const columns = [
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
                  }
                ];

                if (showHours) {
                  columns.push({
                    title: 'Labor Hours - Actual',
                    dataIndex: 'laborHoursActual',
                    key: 'laborHoursActual',
                    width: 150,
                    render: (value, record, index) => (
                      <Input
                        type="number"
                        value={formatDisplayValue(value)}
                        onChange={(e) => handleDailyDataChange(index, 'laborHoursActual', parseFloat(e.target.value) || 0)}
                        suffix="hrs"
                        className="w-full"
                      />
                    )
                  });
                }

                if (showCosts) {
                  columns.push({
                    title: 'Actual Labor $',
                    dataIndex: 'actualLaborDollars',
                    key: 'actualLaborDollars',
                    width: 150,
                    render: (value, record, index) => (
                      <Input
                        type="number"
                        value={formatDisplayValue(value)}
                        onChange={(e) => handleDailyDataChange(index, 'actualLaborDollars', parseFloat(e.target.value) || 0)}
                        prefix="$"
                        className="w-full"
                      />
                    )
                  });
                }

                return columns;
              })()}
            />
          </div>
        </Space>
      </Modal>
    );
  };



  return (
    <div className="w-full">
      <Title level={3} className="pl-2 pb-2">Labor Performance Dashboard</Title>
      
      {storeError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <Text type="danger">{storeError}</Text>
        </div>
      )}
      
      <Row gutter={[16, 16]}>
       

        {/* Weekly Data Section */}
        <Col xs={24} sm={24} md={24} lg={18} xl={18}>
          <Card 
            title={`Labor @ $${getAverageHourlyRate().toFixed(2)}/Hour: ${selectedDate ? selectedDate.format('MMM-YY') : ''}`}
            extra={
              <Space>
                <Button 
                  type="default" 
                  icon={dataNotFound || areAllValuesZero(weeklyData) ? <PlusOutlined /> : <EditOutlined />} 
                  onClick={dataNotFound || areAllValuesZero(weeklyData) ? showAddWeeklyModal : () => showEditWeeklyModal(weeklyData[0])}
                  disabled={!selectedDate}
                >
                  {dataNotFound || areAllValuesZero(weeklyData) ? "Add Weekly Labor" : "Edit Weekly Labor"}
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
                                laborHoursBudget: acc.laborHoursBudget + (parseFloat(record.laborHoursBudget) || 0),
                                laborHoursActual: acc.laborHoursActual + (parseFloat(record.laborHoursActual) || 0),
                                budgetedLaborDollars: acc.budgetedLaborDollars + (parseFloat(record.budgetedLaborDollars) || 0),
                                actualLaborDollars: acc.actualLaborDollars + (parseFloat(record.actualLaborDollars) || 0),
                                dailyLaborRate: acc.dailyLaborRate + (parseFloat(record.dailyLaborRate) || 0),
                                dailyLaborPercentage: acc.dailyLaborPercentage + (parseFloat(record.dailyLaborPercentage) || 0),
                                weeklyLaborPercentage: acc.weeklyLaborPercentage + (parseFloat(record.weeklyLaborPercentage) || 0)
                              }), {
                                laborHoursBudget: 0,
                                laborHoursActual: 0,
                                budgetedLaborDollars: 0,
                                actualLaborDollars: 0,
                                dailyLaborRate: 0,
                                dailyLaborPercentage: 0,
                                weeklyLaborPercentage: 0
                              });

                              return (
                                <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                                  <Table.Summary.Cell index={0}>
                                    <Text strong>Week Totals:</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={1}>
                                    <Text strong>{(weekTotals?.laborHoursBudget || 0).toFixed(1)} hrs</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={2}>
                                    <Text strong>{(weekTotals?.laborHoursActual || 0).toFixed(1)} hrs</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={3}>
                                    <Text strong>${(weekTotals?.budgetedLaborDollars || 0).toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={4}>
                                    <Text strong>${(weekTotals?.actualLaborDollars || 0).toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={5}>
                                    <Text strong>${(weekTotals?.dailyLaborRate || 0).toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={6}>
                                    <Text strong>{(weekTotals?.dailyLaborPercentage || 0).toFixed(1)}%</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={7}>
                                    <Text strong>{(weekTotals?.weeklyLaborPercentage || 0).toFixed(1)}%</Text>
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
                                title: 'Labor Hours - Budget',
                                dataIndex: 'laborHoursBudget',
                                key: 'laborHoursBudget',
                                width: 120,
                                render: (value) => <Text className="text-sm sm:text-base">{(parseFloat(value) || 0).toFixed(1)} hrs</Text>
                              },
                              {
                                title: 'Labor Hours - Actual',
                                dataIndex: 'laborHoursActual',
                                key: 'laborHoursActual',
                                width: 150,
                                render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }} className="text-sm sm:text-base">{(parseFloat(value) || 0).toFixed(1)} hrs</Text>
                              },
                              {
                                title: 'Budgeted Labor $',
                                dataIndex: 'budgetedLaborDollars',
                                key: 'budgetedLaborDollars',
                                width: 120,
                                render: (value) => <Text className="text-sm sm:text-base">${(parseFloat(value) || 0).toFixed(2)}</Text>
                              },
                              {
                                title: 'Actual Labor $',
                                dataIndex: 'actualLaborDollars',
                                key: 'actualLaborDollars',
                                width: 150,
                                render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }} className="text-sm sm:text-base">${(parseFloat(value) || 0).toFixed(2)}</Text>
                              },
                              {
                                title: 'Daily Labor Rate',
                                dataIndex: 'dailyLaborRate',
                                key: 'dailyLaborRate',
                                width: 150,
                                render: (value) => <Text className='bg-green-200 p-1 rounded-md text-sm sm:text-base'>${(parseFloat(value) || 0).toFixed(2)}</Text>
                              },
                              {
                                title:"Daily Labor %",
                                dataIndex:"dailyLaborPercentage",
                                key:"dailyLaborPercentage",
                                width:150,
                                render:(value)=><Text className="text-sm sm:text-base">{(parseFloat(value) || 0).toFixed(2)}%</Text>
                              },
                              {
                                title:"Weekly Labor %",
                                dataIndex:"weeklyLaborPercentage",
                                key:"weeklyLaborPercentage",
                                width:150,
                                render:(value)=><Text className="text-sm sm:text-base">{(parseFloat(value) || 0).toFixed(2)}%</Text>
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
          <Card title="Weekly Labor Totals" className="h-fit">
            {dataNotFound ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No labor data available for this period."
                className="py-4"
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong className="text-sm sm:text-base">Labor Hours - Budget:</Text>
                  <Input
                    value={`${weeklyTotals.labor_hours_budget} hrs`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Labor Hours - Actual:</Text>
                  <Input
                    value={`${weeklyTotals.labor_hours_actual} hrs`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Budgeted Labor $:</Text>
                  <Input
                    value={`$${weeklyTotals.budgeted_labor_dollars}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Actual Labor $:</Text>
                  <Input
                    value={`$${weeklyTotals.actual_labor_dollars}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Daily Labor Rate:</Text>
                  <Input
                    value={`$${weeklyTotals.daily_labor_rate}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Daily Labor %:</Text>
                  <Input
                    value={`${parseFloat(weeklyTotals.actual_labor_dollars) > 0 ? ((parseFloat(weeklyTotals.actual_labor_dollars) / parseFloat(weeklyTotals.daily_labor_rate))).toFixed(1) : '0.0'}%`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Weekly Labor %:</Text>
                  <Input
                    value={`${parseFloat(weeklyTotals.actual_labor_dollars) > 0 ? ((parseFloat(weeklyTotals.actual_labor_dollars) / (parseFloat(weeklyTotals.actual_labor_dollars) + 5000)) * 100).toFixed(1) : '0.0'}%`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
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

export default LabourTable;