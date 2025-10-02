import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Table, Card, Row, Col, Typography, Space, Divider, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);
import useStore from '../../../store/store';
import LoadingSpinner from '../../layout/LoadingSpinner';

const { Title, Text } = Typography;

// Helper function to format numbers properly and avoid floating-point precision issues
const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100; // Round to 2 decimal places
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
    error: storeError,
    restaurantGoals
  } = useStore();

  // Get COGS goal from restaurant goals
  const getCogsGoal = () => {
    if (restaurantGoals && restaurantGoals.cogs_goal) {
      return parseFloat(restaurantGoals.cogs_goal);
    }
    return null;
  };

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

  // Listen for custom event to open COGS modal from SalesTable
  useEffect(() => {
    const handleOpenCogsModal = (event) => {      
      console.log('COGS table received openCogsModal event:', event.detail);
      
      // Try to open modal immediately if data is available
      if (dashboardData !== null) {
        console.log('Opening COGS modal immediately - dataNotFound:', dataNotFound, 'weeklyData length:', weeklyData.length);
        
        // Add a small delay to ensure the component is fully rendered
        setTimeout(() => {
          // Check if we have data or if we need to add data
          if (dataNotFound || areAllValuesZero(weeklyData)) {
            // No data exists, open in add mode
            console.log('Opening COGS modal in ADD mode');
            showAddWeeklyModal();
            message.info('Adding COGS data for the selected week...');
          } else {
            // Data exists, open in edit mode
            console.log('Opening COGS modal in EDIT mode');
            showEditWeeklyModal(weeklyData[0]);
            message.info('Editing existing COGS data for the selected week...');
          }
        }, 100);
      } else {
        // Store the event data for later use when data is loaded
        localStorage.setItem('pendingCogsModal', JSON.stringify({
          shouldOpen: true,
          weekStartDate: event.detail.weekStartDate,
          timestamp: Date.now()
        }));
        console.log('Stored pendingCogsModal in localStorage - data not ready yet');
      }
    };

    // Add event listener
    window.addEventListener('openCogsModal', handleOpenCogsModal);

    // Cleanup event listener
    return () => {
      window.removeEventListener('openCogsModal', handleOpenCogsModal);
    };
  }, [dashboardData, dataNotFound, weeklyData]); // Include dependencies to ensure fresh values

  // Check for pending COGS modal after data is processed
  useEffect(() => {
    const pendingCogsModal = localStorage.getItem('pendingCogsModal');
    
    if (pendingCogsModal && dashboardData !== null) { // Only proceed if dashboard data has been loaded
      try {
        const pendingData = JSON.parse(pendingCogsModal);
        
        if (pendingData.shouldOpen) {
          console.log('Opening COGS modal from localStorage - dataNotFound:', dataNotFound, 'weeklyData length:', weeklyData.length);
          
          // Add a small delay to ensure the component is fully rendered
          setTimeout(() => {
            // Check if we have data or if we need to add data
            if (dataNotFound || areAllValuesZero(weeklyData)) {
              // No data exists, open in add mode
              console.log('Opening COGS modal in ADD mode');
              showAddWeeklyModal();
              message.info('Adding COGS data for the selected week...');
            } else {
              // Data exists, open in edit mode
              console.log('Opening COGS modal in EDIT mode');
              showEditWeeklyModal(weeklyData[0]);
              message.info('Editing existing COGS data for the selected week...');
            }
          }, 100);
          
          // Clear the pending modal data
          localStorage.removeItem('pendingCogsModal');
        }
      } catch (error) {
        console.error('Error processing pending COGS modal:', error);
        localStorage.removeItem('pendingCogsModal');
      }
    }
  }, [dashboardData, dataNotFound, weeklyData]); // Depend on processed data

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

      // Calculate remaining COGS - COGS Budget - COGS Actual (can be negative)
      weeklyTotals.weeklyRemainingCog = weeklyTotals.cogsBudget - weeklyTotals.cogsActual;

      // Extract all daily entries into one consolidated table
      const allDailyEntries = dashboardData.daily_entries?.map((entry) => {
        // Check if restaurant is open for this day
        const isRestaurantOpen = entry['Sales Performance']?.restaurant_open !== false && 
                                entry['Sales Performance']?.restaurant_open !== 0;
        
        return {
          key: `day-${entry.date}`,
          date: dayjs(entry.date),
          dayName: dayjs(entry.date).format('dddd').toLowerCase(),
          budget: isRestaurantOpen ? (entry['COGS Performance']?.cogs_budget || 0) : 0,
          actual: isRestaurantOpen ? (entry['COGS Performance']?.cogs_actual || 0) : 0,
          weeklyRemainingCog: entry['COGS Performance']?.weekly_remaining_cog || 0,
          restaurantOpen: isRestaurantOpen
        };
      }) || [];

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
            weeklyRemainingCog: 0,
            restaurantOpen: true // Default to open for new days
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
      const totalBudget = weekData.dailyData.reduce((sum, day) => sum + (parseFloat(day.budget) || 0), 0);
      const totalActual = weekData.dailyData.reduce((sum, day) => sum + (parseFloat(day.actual) || 0), 0);
      const finalTotals = {
        cogsBudget: totalBudget,
        cogsActual: totalActual,
        cogsPercentage: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0,
        weeklyRemainingCog: totalBudget - totalActual
      };

      // Transform data to API format - only save the current week's daily data
      const transformedData = {
        week_start: weekDays.length > 0 ? weekDays[0].date.format('YYYY-MM-DD') : selectedDate.format('YYYY-MM-DD'),
        section: "COGS Performance",
        section_data: {
          weekly: {
            cogs_budget: parseFloat(finalTotals.cogsBudget) || 0,
            cogs_actual: parseFloat(finalTotals.cogsActual) || 0,
            cogs_percentage: parseFloat(finalTotals.cogsPercentage) || 0,
            weekly_remaining_cog: parseFloat(finalTotals.weeklyRemainingCog) || 0
          },
          daily: weekData.dailyData.map(day => ({
            date: day.date.format('YYYY-MM-DD'),
            cogs_budget: day.restaurantOpen === false ? 0 : (parseFloat(day.budget) || 0),
            cogs_actual: day.restaurantOpen === false ? 0 : (parseFloat(day.actual) || 0),
            weekly_remaining_cog: parseFloat(finalTotals.weeklyRemainingCog) || 0
          }))
        }
      };

             await saveDashboardData(transformedData);
      message.success(isEditMode ? 'COGS data updated successfully!' : 'COGS data saved successfully!');
      
      // Show confirmation popup asking if user wants to add Labor data
      Modal.confirm({
        title: '🎉 COGS Data Saved Successfully!',
        content: (
          <div>
            <p>Your COGS performance data has been saved successfully.</p>
            <p style={{ marginTop: '8px', fontWeight: 'bold', color: '#1890ff' }}>
              Would you like to add Labor Costs data for this week?
            </p>
          </div>
        ),
        okText: 'Yes, Add Labor Data',
        cancelText: 'No, Later',
        okType: 'primary',
        onOk: () => {
          // Close the COGS modal first
          setIsModalVisible(false);
          setEditingWeek(null);
          setIsEditMode(false);
                    
          // Trigger Labor modal opening by dispatching a custom event
          const weekStartDate = weekDays.length > 0 ? weekDays[0].date.format('YYYY-MM-DD') : selectedDate.format('YYYY-MM-DD');
          console.log('Dispatching openLaborModal event with weekStartDate:', weekStartDate);
          
          const event = new CustomEvent('openLaborModal', {
            detail: {
              weekStartDate: weekStartDate
            }
          });
          window.dispatchEvent(event);
        },
        onCancel: () => {
          // Just close the COGS modal
          setIsModalVisible(false);
          setEditingWeek(null);
          setIsEditMode(false);
        }
      });
      
      // Refresh all dashboard data to show updated data across all components
      if (refreshDashboardData) {
        await refreshDashboardData();
      } else {
        // Fallback: reload data after saving to update totals and remaining COGS
        processCogsData(); 
      }
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
        actual: 0,
        restaurantOpen: true // Default to open for new days
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
        title={isEditMode ? "Edit Actual Weekly COGS Data" : "Add Actual Weekly COGS Data"}
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
            {isEditMode ? 'Update' : 'Add'} Actual Weekly COGS
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
                     {/* Weekly COGS Totals Summary - Auto-calculated from daily inputs */}
           <Card title="Weekly COGS Totals Summary" size="small">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="w-full">
                 <Text strong className="text-sm sm:text-base">Total COGS Budget:</Text>
                 <Input
                   value={`$${weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.budget) || 0), 0).toFixed(2)}`}
                   className="mt-1"
                   disabled
                   style={{ backgroundColor: '#f0f8ff',  color: '#1890ff' }}
                 />
               </div>
               <div className="w-full">
                 <Text strong className="text-sm sm:text-base">Total COGS Actual:</Text>
                 <Input
                   value={`$${weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.actual) || 0), 0).toFixed(2)}`}
                   className="mt-1"
                   disabled
                   style={{ backgroundColor: '#f0f8ff', color: '#1890ff' }}
                 />
               </div>
               <div className="w-full">
                 <Text strong className="text-sm sm:text-base">Total COGS Percentage:</Text>
                 <Input
                   value={`${(() => {
                     const totalBudget = weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.budget) || 0), 0);
                     const totalActual = weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.actual) || 0), 0);
                     return totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : '0.0';
                   })()}%`}
                   className="mt-1"
                   disabled
                   style={{ backgroundColor: '#f0f8ff', color: '#1890ff' }}
                 />
               </div>
               <div className="w-full">
                 <Text strong className="text-sm sm:text-base">Weekly Remaining COGS:</Text>
                 <Input
                   value={`$${(() => {
                     const totalBudget = weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.budget) || 0), 0);
                     const totalActual = weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.actual) || 0), 0);
                     return (totalBudget - totalActual).toFixed(2);
                   })()}`}
                   className="mt-1"
                   disabled
                   style={{ backgroundColor: '#f0f8ff', color: '#1890ff' }}
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
                   budget: acc.budget + (parseFloat(record.budget) || 0),
                   actual: acc.actual + (parseFloat(record.actual) || 0)
                 }), {
                   budget: 0,
                   actual: 0
                 });

                return (
                  <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                    <Table.Summary.Cell index={0}>
                      <Text strong style={{ color: '#1890ff' }}>DAILY TOTALS</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ color: '#1890ff' }}>${totals.actual.toFixed(2)}</Text>
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
                      <div className="font-medium">{text}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.date.format('MMM DD, YYYY')}
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Actual',
                  dataIndex: 'actual',
                  key: 'actual',
                  width: 150,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={record.restaurantOpen === false ? 0 : value}
                      onChange={(e) => handleDailyDataChange(index, 'actual', parseFloat(e.target.value) || 0)}
                      prefix="$"
                      placeholder="0.00"
                      className="w-full"
                      disabled={record.restaurantOpen === false}
                      style={record.restaurantOpen === false ? { backgroundColor: '#f5f5f5', color: '#999' } : {}}
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

  return (
    <div className="w-full">
      <div className="pb-3 border-b border-gray-200">
        <h3 className="text-xl font-bold text-orange-600">
          COGS Performance
          {(() => {
            const start = weekDays.length > 0 ? weekDays[0].date : selectedDate;
            if (!start) return null;
            const end = dayjs(start).add(6, 'day');
            const wk = dayjs(start).week();
            return (
              <span className="ml-2 text-orange-600 text-sm font-semibold">
                Week {wk} ({dayjs(start).format('MMM DD')} - {end.format('MMM DD')})
              </span>
            );
          })()}
        </h3>
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
            title={`Actual Weekly COGS Performance: ${getCogsGoal() ? ` ${getCogsGoal()}%` : ''} `}
            extra={
              <Space>
                <Button 
                  type="default" 
                  icon={dataNotFound || areAllValuesZero(weeklyData) ? <PlusOutlined /> : <EditOutlined />} 
                  onClick={dataNotFound || areAllValuesZero(weeklyData) ? showAddWeeklyModal : () => showEditWeeklyModal(weeklyData[0])}
                  disabled={!selectedDate}
                >
                  {dataNotFound || areAllValuesZero(weeklyData) ? "Add Actual Weekly COGS" : "Edit Actual Weekly COGS"}
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
                                budget: acc.budget + (parseFloat(record.budget) || 0),
                                actual: acc.actual + (parseFloat(record.actual) || 0)
                              }), {
                                budget: 0,
                                actual: 0
                              });

                              const weekPercentage = weekTotals.budget > 0 ? (weekTotals.actual / weekTotals.budget) * 100 : 0;

                              return (
                                <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                                  <Table.Summary.Cell index={0}>
                                    <Text strong style={{ color: '#1890ff' }}>Week Totals:</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={1}>
                                    <Text strong style={{ color: '#1890ff' }}>${weekTotals.budget.toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={2}>
                                    <Text strong style={{ color: '#1890ff' }}>${weekTotals.actual.toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={3}>
                                    <Text strong style={{ color: '#1890ff' }}>{weekPercentage.toFixed(1)}%</Text>
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
                                    <div className="font-medium">{text}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                      {record.date.format('MMM DD, YYYY')}
                                    </div>
                                    {record.restaurantOpen === false && (
                                      <div style={{ fontSize: '10px', color: '#ff4d4f', fontWeight: 'bold' }}>
                                        CLOSED
                                      </div>
                                    )}
                                  </div>
                                )
                              },
                              {
                                title: 'COGS Budget',
                                dataIndex: 'budget',
                                key: 'budget',
                                width: 140,
                                render: (value, record) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  return <Text>${(parseFloat(value) || 0).toFixed(2)}</Text>;
                                }
                              },
                              {
                                title: 'COGS Actual',
                                dataIndex: 'actual',
                                key: 'actual',
                                width: 140,
                                render: (value, record) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  const actual = parseFloat(value) || 0;
                                  const budget = parseFloat(record.budget) || 0;
                                  const isOverBudget = actual > budget;
                                  return (
                                    <Text style={{ 
                                      backgroundColor: isOverBudget ? '#ffebee' : '#f0f8ff', 
                                      color: isOverBudget ? '#d32f2f' : '#1890ff',
                                      padding: '2px 6px', 
                                      borderRadius: '3px' 
                                    }}>
                                      ${actual.toFixed(2)}
                                    </Text>
                                  );
                                }
                              },
                              {
                                title: 'COGS %',
                                key: 'percentage',
                                width: 120,
                                render: (_, record) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  const budget = parseFloat(record.budget) || 0;
                                  const actual = parseFloat(record.actual) || 0;
                                  const percentage = budget > 0 ? (actual / budget) * 100 : 0;
                                  const isOverBudget = actual > budget;
                                  return (
                                    <Text style={{ 
                                      backgroundColor: isOverBudget ? '#ffebee' : '#f0f8ff', 
                                      color: isOverBudget ? '#d32f2f' : '#1890ff',
                                      padding: '2px 6px', 
                                      borderRadius: '3px' 
                                    }}>
                                      {percentage.toFixed(1)}%
                                    </Text>
                                  );
                                }
                              },
                              {
                                title: 'Weekly Remaining COGS',
                                key: 'remaining',
                                width: 120,
                                render: (_, record) => {
                                  const budget = parseFloat(record.budget) || 0;
                                  const actual = parseFloat(record.actual) || 0;
                                  const weeklyRemainingCog = budget - actual;
                                  const isNegative = weeklyRemainingCog < 0;
                                  return (
                                    <Text style={{ 
                                      backgroundColor: isNegative ? '#ffebee' : '#f0f8ff', 
                                      color: isNegative ? '#d32f2f' : '#1890ff',
                                      padding: '2px 6px', 
                                      borderRadius: '3px' 
                                    }}>
                                      ${weeklyRemainingCog.toFixed(2)}
                                    </Text>
                                  );
                                }
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
           <Card title="Actual Weekly COGS Totals" className="h-fit">
             {dataNotFound ? (
               <Empty
                 image={Empty.PRESENTED_IMAGE_SIMPLE}
                 description="No COGS data available for this period."
                 className="py-4"
               />
             ) : (
               <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                                                       <div>
                     <Text strong>COGS Budget:</Text>
                     <Input
                       value={`$${weeklyData.length > 0 ? weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.budget) || 0), 0).toFixed(2) : '0.00'}`}
                       className="mt-1"
                       disabled
                       style={{ backgroundColor: '#fff7ed', color: '#1890ff' }}
                     />
                   </div>
                   
                   <div>
                     <Text strong>COGS Actual:</Text>
                     <Input
                       value={`$${weeklyData.length > 0 ? weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.actual) || 0), 0).toFixed(2) : '0.00'}`}
                       className="mt-1"
                       disabled
                       style={{ 
                         backgroundColor: (() => {
                           if (weeklyData.length === 0) return '#fff7ed';
                           const totalBudget = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.budget) || 0), 0);
                           const totalActual = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.actual) || 0), 0);
                           return totalActual > totalBudget ? '#ffebee' : '#fff7ed';
                         })(),
                         color: (() => {
                           if (weeklyData.length === 0) return '#1890ff';
                           const totalBudget = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.budget) || 0), 0);
                           const totalActual = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.actual) || 0), 0);
                           return totalActual > totalBudget ? '#d32f2f' : '#1890ff';
                         })()
                       }}
                     />
                   </div>
                   
                   <div>
                     <Text strong>COGS Percentage:</Text>
                     <Input
                       value={`${(() => {
                         if (weeklyData.length === 0) return '0.0';
                         const totalBudget = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.budget) || 0), 0);
                         const totalActual = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.actual) || 0), 0);
                         return totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : '0.0';
                       })()}%`}
                       className="mt-1"
                       disabled
                       style={{ 
                         backgroundColor: (() => {
                           if (weeklyData.length === 0) return '#fff7ed';
                           const totalBudget = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.budget) || 0), 0);
                           const totalActual = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.actual) || 0), 0);
                           return totalActual > totalBudget ? '#ffebee' : '#fff7ed';
                         })(),
                         color: (() => {
                           if (weeklyData.length === 0) return '#1890ff';
                           const totalBudget = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.budget) || 0), 0);
                           const totalActual = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.actual) || 0), 0);
                           return totalActual > totalBudget ? '#d32f2f' : '#1890ff';
                         })()
                       }}
                     />
                   </div>
                   
                   <div>
                     <Text strong>Weekly Remaining COGS:</Text>
                     <Input
                       value={`$${(() => {
                         if (weeklyData.length === 0) return '0.00';
                         const totalBudget = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.budget) || 0), 0);
                         const totalActual = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.actual) || 0), 0);
                         return (totalBudget - totalActual).toFixed(2);
                       })()}`}
                       className="mt-1"
                       disabled
                       style={{ 
                         backgroundColor: (() => {
                           if (weeklyData.length === 0) return '#fff7ed';
                           const totalBudget = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.budget) || 0), 0);
                           const totalActual = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.actual) || 0), 0);
                           const remaining = totalBudget - totalActual;
                           return remaining < 0 ? '#ffebee' : '#fff7ed';
                         })(),
                         color: (() => {
                           if (weeklyData.length === 0) return '#1890ff';
                           const totalBudget = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.budget) || 0), 0);
                           const totalActual = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.actual) || 0), 0);
                           const remaining = totalBudget - totalActual;
                           return remaining < 0 ? '#d32f2f' : '#1890ff';
                         })()
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

export default CogsTable;
