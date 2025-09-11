import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);
import useStore from '../../../store/store';
import LoadingSpinner from '../../layout/LoadingSpinner';

const { Title, Text } = Typography;

const LabourTable = ({ selectedDate, selectedYear, selectedMonth, weekDays = [], dashboardData = null, refreshDashboardData = null }) => {
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
    daily_labor_rate: "0.00",
    daily_labour_percent: "0.00",
    weekly_labour_percent: "0.00"
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

  // Get the correct daily labor rate - should be $50.00
  const getDailyLaborRate = () => {
    // If we have a specific daily labor rate from API, use it
    if (weeklyTotals && weeklyTotals.daily_labor_rate && weeklyTotals.daily_labor_rate > 0) {
      return parseFloat(weeklyTotals.daily_labor_rate);
    }
    // Otherwise, use the target rate of $50.00
    return 50.00;
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
        daily_labor_rate: "0.00",
        daily_labour_percent: "0.00",
        weekly_labour_percent: "0.00"
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

  // Function to get net sales for a specific date from dashboard data
  const getNetSalesForDate = (date) => {
    if (!dashboardData?.daily_entries) return 0;
    
    const targetDate = dayjs(date).format('YYYY-MM-DD');
    const dailyEntry = dashboardData.daily_entries.find(entry => 
      dayjs(entry.date).format('YYYY-MM-DD') === targetDate
    );
    
    if (!dailyEntry?.['Sales Performance']) return 0;
    
    const salesData = dailyEntry['Sales Performance'];
    const netSales = parseFloat(salesData.net_sales_actual) || 0;
    return netSales;
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
      
      // Get percentage values from daily entries (they're stored per day, not weekly)
      const dailyEntries = dashboardData.daily_entries || [];
      const firstEntry = dailyEntries[0];
      const firstLaborData = firstEntry?.['Labor Performance'];
      
      setWeeklyTotals({
        labor_hours_budget: parseFloat(laborPerformance.labor_hours_budget) || 0,
        labor_hours_actual: parseFloat(laborPerformance.labor_hours_actual) || 0,
        budgeted_labor_dollars: parseFloat(laborPerformance.budgeted_labor_dollars) || 0,
        actual_labor_dollars: parseFloat(laborPerformance.actual_labor_dollars) || 0,
        daily_labor_rate: parseFloat(laborPerformance.daily_labor_rate) || 0,
        daily_labour_percent: parseFloat(firstLaborData?.daily_labour_percent) || 0,
        weekly_labour_percent: parseFloat(firstLaborData?.weekly_labour_percent) || 0
      });

      // Extract all daily entries into one consolidated table
      const allDailyEntries = dashboardData.daily_entries?.map((entry) => {
        // Check if restaurant is open for this day
        const isRestaurantOpen = entry['Sales Performance']?.restaurant_open !== false && 
                                entry['Sales Performance']?.restaurant_open !== 0;
        
        return {
          key: `day-${entry.date}`,
          date: dayjs(entry.date),
          dayName: dayjs(entry.date).format('dddd').toLowerCase(),
          laborHoursBudget: isRestaurantOpen ? (parseFloat(entry['Labor Performance']?.labor_hours_budget) || 0) : 0,
          laborHoursActual: isRestaurantOpen ? (parseFloat(entry['Labor Performance']?.labor_hours_actual) || 0) : 0,
          budgetedLaborDollars: isRestaurantOpen ? (parseFloat(entry['Labor Performance']?.budgeted_labor_dollars) || 0) : 0,
          actualLaborDollars: isRestaurantOpen ? (parseFloat(entry['Labor Performance']?.actual_labor_dollars) || 0) : 0,
          dailyLaborRate: parseFloat(entry['Labor Performance']?.daily_labor_rate) || 0,
          dailyLaborPercentage: isRestaurantOpen ? (parseFloat(entry['Labor Performance']?.daily_labour_percent) || 0) : 0,
          weeklyLaborPercentage: isRestaurantOpen ? (parseFloat(entry['Labor Performance']?.weekly_labour_percent) || 0) : 0,
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
            laborHoursBudget: 0,
            laborHoursActual: 0,
            budgetedLaborDollars: 0,
            actualLaborDollars: 0,
            dailyLaborRate: 0,
            dailyLaborPercentage: 0,
            weeklyLaborPercentage: 0,
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
        daily_labor_rate: "0.00",
        daily_labour_percent: "0.00",
        weekly_labour_percent: "0.00"
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
        dailyLaborRate: parseFloat(weeklyTotals.daily_labor_rate) || hourlyRate,
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
        week_start: weekDays.length > 0 ? weekDays[0].date.format('YYYY-MM-DD') : selectedDate ? selectedDate.format('YYYY-MM-DD') : selectedYear && selectedMonth ? dayjs(`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`).format('YYYY-MM-DD') : null,
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
            labor_hours_budget: day.restaurantOpen === false ? 0 : (parseFloat(day.laborHoursBudget) || 0),
            labor_hours_actual: day.restaurantOpen === false ? 0 : (parseFloat(day.laborHoursActual) || 0),
            budgeted_labor_dollars: day.restaurantOpen === false ? 0 : (parseFloat(day.budgetedLaborDollars) || 0),
            actual_labor_dollars: day.restaurantOpen === false ? 0 : (parseFloat(day.actualLaborDollars) || 0),
            daily_labor_rate: day.restaurantOpen === false ? 0 : (parseFloat(getAverageHourlyRate()) || 0),
            daily_labour_percent: day.restaurantOpen === false ? 0 : (parseFloat(day.dailyLaborPercentage) || 0),
            weekly_labour_percent: day.restaurantOpen === false ? 0 : (parseFloat(day.weeklyLaborPercentage) || 0)
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
    const totals = weekData.dailyData.reduce((acc, day) => {
      // Skip closed days in totals calculation
      if (day.restaurantOpen === false) {
        return acc;
      }
      
      return {
        laborHoursBudget: acc.laborHoursBudget + (parseFloat(day.laborHoursBudget) || 0),
        laborHoursActual: acc.laborHoursActual + (parseFloat(day.laborHoursActual) || 0),
        budgetedLaborDollars: acc.budgetedLaborDollars + (parseFloat(day.budgetedLaborDollars) || 0),
        actualLaborDollars: acc.actualLaborDollars + (parseFloat(day.actualLaborDollars) || 0)
      };
    }, {
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
        dailyLaborRate: parseFloat(weeklyTotals.daily_labor_rate) || getAverageHourlyRate(),
        dailyLaborPercentage: 0,
        weeklyLaborPercentage: 0,
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
        laborHoursBudget: 0,
        laborHoursActual: 0,
        budgetedLaborDollars: 0,
        actualLaborDollars: 0,
        dailyLaborRate: parseFloat(weeklyTotals.daily_labor_rate) || hourlyRate,
        dailyLaborPercentage: 0,
        weeklyLaborPercentage: 0
      }
    });

    useEffect(() => {
      if (editingWeek) {
        // Preserve the existing dailyData from editingWeek with original API values
        const editingWeekWithDefaults = {
          ...editingWeek,
          // Calculate percentages for existing data
          dailyData: calculateLaborPercentages(editingWeek.dailyData || []),
          weeklyTotals: editingWeek.weeklyTotals || {
            laborHoursBudget: 0,
            laborHoursActual: 0,
            budgetedLaborDollars: 0,
            actualLaborDollars: 0,
            dailyLaborRate: parseFloat(weeklyTotals.daily_labor_rate) || hourlyRate,
            dailyLaborPercentage: 0,
            weeklyLaborPercentage: 0
          }
        };
        setWeekFormData(editingWeekWithDefaults);
      } else {
        const newDailyData = generateDailyData(weekDays.length > 0 ? weekDays[0].date : selectedDate);
        // Calculate percentages for new data as well
        const newDailyDataWithPercentages = calculateLaborPercentages(newDailyData);
        setWeekFormData({
          weekTitle: `Week ${weeklyData.length + 1}`,
          startDate: weekDays.length > 0 ? weekDays[0].date : selectedDate,
          dailyData: newDailyDataWithPercentages,
          weeklyTotals: {
            laborHoursBudget: 0,
            laborHoursActual: 0,
            budgetedLaborDollars: 0,
            actualLaborDollars: 0,
            dailyLaborRate: parseFloat(weeklyTotals.daily_labor_rate) || hourlyRate,
            dailyLaborPercentage: 0,
            weeklyLaborPercentage: 0
          }
        });
      }
    }, [editingWeek, weeklyData.length, weekDays, selectedDate, dashboardData]);

  // Function to calculate labor percentages using net sales from API
  const calculateLaborPercentages = (dailyData) => {
    let cumulativeLaborDollars = 0;
    let cumulativeNetSales = 0;
    
    return dailyData.map((day, index) => {
      if (day.restaurantOpen === false) {
        return { ...day, dailyLaborPercentage: 0, weeklyLaborPercentage: 0 };
      }

      const actualLaborDollars = parseFloat(day.actualLaborDollars) || 0;
      const netSales = getNetSalesForDate(day.date);
      
      // Calculate daily labor percentage: (actual labor dollars / net sales) * 100
      const dailyLaborPercentage = netSales > 0 ? 
        ((actualLaborDollars / netSales) * 100) : 0;

      // Calculate weekly labor percentage: (cumulative actual labor $ / cumulative net sales) * 100
      // Day by day progression starting from Sunday
      cumulativeLaborDollars += actualLaborDollars;
      cumulativeNetSales += netSales;
      
      const weeklyLaborPercentage = cumulativeNetSales > 0 ? 
        ((cumulativeLaborDollars / cumulativeNetSales) * 100) : 0;

      return {
        ...day,
        dailyLaborPercentage: parseFloat(dailyLaborPercentage.toFixed(2)),
        weeklyLaborPercentage: parseFloat(weeklyLaborPercentage.toFixed(2)),
        netSales: netSales // Store net sales for display
      };
    });
  };

    const handleDailyDataChange = (dayIndex, field, value) => {
      const newDailyData = [...weekFormData.dailyData];
      newDailyData[dayIndex] = { ...newDailyData[dayIndex], [field]: value };
      
      // Recalculate labor percentages when actual labor dollars change
      // This ensures the percentages are updated in real-time
      if (field === 'actualLaborDollars') {
        const updatedDailyData = calculateLaborPercentages(newDailyData);
        setWeekFormData({ ...weekFormData, dailyData: updatedDailyData });
      } else {
        setWeekFormData({ ...weekFormData, dailyData: newDailyData });
      }
    };

    const handleSubmit = () => {
      handleWeeklySubmit(weekFormData);
    };

    return (
      <Modal
        title={isEditMode ? "Edit Actual Weekly Labor Data" : "Add Actual Weekly Labor Data"}
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
            {isEditMode ? 'Update' : 'Add'} Actual Weekly Labor
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
          {/* Weekly Labor Totals Summary - Auto-calculated from daily inputs */}
          <Card title="Weekly Labor Totals Summary" size="small">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Total Labor Hours - Budget:</Text>
                <Input
                  value={`${weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.laborHoursBudget) || 0), 0).toFixed(1)} hrs`}
                  className="mt-1"
                  disabled
                  style={{ backgroundColor: '#f0f8ff', color: '#1890ff' }}
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Total Labor Hours - Actual:</Text>
                <Input
                  value={`${weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.laborHoursActual) || 0), 0).toFixed(1)} hrs`}
                  className="mt-1"
                  disabled
                  style={{ backgroundColor: '#f0f8ff', color: '#1890ff' }}
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Total Budgeted Labor $:</Text>
                <Input
                  value={`$${weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.budgetedLaborDollars) || 0), 0).toFixed(2)}`}
                  className="mt-1"
                  disabled
                  style={{ backgroundColor: '#f0f8ff', color: '#1890ff' }}
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Total Actual Labor $:</Text>
                <Input
                  value={`$${weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.actualLaborDollars) || 0), 0).toFixed(2)}`}
                  className="mt-1"
                  disabled
                  style={{ backgroundColor: '#f0f8ff', color: '#1890ff' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Daily Labor Rate:</Text>
                <Input
                  value={`$${parseFloat(weeklyTotals.daily_labor_rate || 0).toFixed(2)}`}
                  className="mt-1"
                  disabled
                  style={{ backgroundColor: '#f0f8ff', color: '#1890ff' }}
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Total Net Sales </Text>
                <Input
                  value={`$${weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.netSales) || 0), 0).toFixed(2)}`}
                  className="mt-1"
                  disabled
                  style={{ backgroundColor: '#f0f8ff', color: '#1890ff' }}
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Average Daily Labor %:</Text>
                <Input
                  value={`${(() => {
                    const validDays = weekFormData.dailyData.filter(day => day.restaurantOpen !== false && day.netSales > 0);
                    if (validDays.length === 0) return '0.0';
                    const avgPercentage = validDays.reduce((sum, day) => sum + (parseFloat(day.dailyLaborPercentage) || 0), 0) / validDays.length;
                    return avgPercentage.toFixed(1);
                  })()}%`}
                  disabled
                  className="w-full"
                  style={{ backgroundColor: '#e8f5e8', color: '#2e7d32' }}
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Final Weekly Labor %:</Text>
                <Input
                  value={`${(() => {
                    const totalLabor = weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.actualLaborDollars) || 0), 0);
                    const totalSales = weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.netSales) || 0), 0);
                    return totalSales > 0 ? ((totalLabor / totalSales) * 100).toFixed(1) : '0.0';
                  })()}%`}
                  disabled
                  style={{ backgroundColor: '#fff3e0', color: '#f57c00' }}
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

                return (
                  <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                    <Table.Summary.Cell index={0}>
                      <Text strong>Totals:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong>{totals.laborHoursActual.toFixed(1)} hrs</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text strong>${totals.actualLaborDollars.toFixed(2)}</Text>
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
                  title: 'Labor Hours - Actual',
                  dataIndex: 'laborHoursActual',
                  key: 'laborHoursActual',
                  width: 150,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={record.restaurantOpen === false ? 0 : formatDisplayValue(value)}
                      onChange={(e) => handleDailyDataChange(index, 'laborHoursActual', parseFloat(e.target.value) || 0)}
                      suffix="hrs"
                      className="w-full"
                      disabled={record.restaurantOpen === false}
                      style={record.restaurantOpen === false ? { backgroundColor: '#f5f5f5', color: '#999' } : {}}
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
                      value={record.restaurantOpen === false ? 0 : formatDisplayValue(value)}
                      onChange={(e) => handleDailyDataChange(index, 'actualLaborDollars', parseFloat(e.target.value) || 0)}
                      prefix="$"
                      className="w-full"
                      disabled={record.restaurantOpen === false}
                      style={record.restaurantOpen === false ? { backgroundColor: '#f5f5f5', color: '#999' } : {}}
                    />
                  )
                },
                {
                  title: 'Net Sales',
                  dataIndex: 'netSales',
                  key: 'netSales',
                  width: 150,
                  render: (value, record) => (
                    <Input
                      value={record.restaurantOpen === false ? '$0.00' : `$${(parseFloat(record.netSales) || 0).toFixed(2)}`}
                      className="w-full"
                      disabled
                      style={{ 
                        backgroundColor: '#f0f8ff', 
                        color: '#1890ff',
                        fontWeight: 'bold'
                      }}
                    />
                  )
                },
                {
                  title: 'Daily Labor % of Sales',
                  dataIndex: 'dailyLaborPercentage',
                  key: 'dailyLaborPercentage',
                  width: 180,
                  render: (value, record) => (
                    <div>
                      <Input
                        value={record.restaurantOpen === false ? '0.00%' : `${(parseFloat(record.dailyLaborPercentage) || 0).toFixed(2)}%`}
                        className="w-full"
                        disabled
                        style={{ 
                          backgroundColor: '#e8f5e8', 
                          color: '#2e7d32',
                          fontWeight: 'bold'
                        }}
                      />
                     
                    </div>
                  )
                },
                {
                  title: 'Weekly Labor % of Sales',
                  dataIndex: 'weeklyLaborPercentage',
                  key: 'weeklyLaborPercentage',
                  width: 200,
                  render: (value, record, index) => {
                    // Calculate cumulative values for display
                    let cumulativeLabor = 0;
                    let cumulativeSales = 0;
                    const daysUpToCurrent = weekFormData.dailyData.slice(0, index + 1);
                    
                    daysUpToCurrent.forEach(day => {
                      if (day.restaurantOpen !== false) {
                        cumulativeLabor += parseFloat(day.actualLaborDollars) || 0;
                        cumulativeSales += parseFloat(day.netSales) || 0;
                      }
                    });

                    return (
                      <div>
                        <Input
                          value={record.restaurantOpen === false ? '0.00%' : `${(parseFloat(record.weeklyLaborPercentage) || 0).toFixed(2)}%`}
                          className="w-full"
                          disabled
                          style={{ 
                            backgroundColor: '#fff3e0', 
                            color: '#f57c00',
                            fontWeight: 'bold'
                          }}
                        />
                       
                      </div>
                    );
                  }
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
          Labor Performance
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
            title={`Labor @ $${getAverageHourlyRate().toFixed(2)}/Hour`}
            extra={
              <Space>
                <Button 
                  type="default" 
                  icon={dataNotFound || areAllValuesZero(weeklyData) ? <PlusOutlined /> : <EditOutlined />} 
                  onClick={dataNotFound || areAllValuesZero(weeklyData) ? showAddWeeklyModal : () => showEditWeeklyModal(weeklyData[0])}
                  disabled={!selectedDate}
                >
                  {dataNotFound || areAllValuesZero(weeklyData) ? "Add Actual Weekly Labor" : "Edit Actual Weekly Labor"}
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
                                actualLaborDollars: acc.actualLaborDollars + (parseFloat(record.actualLaborDollars) || 0)
                              }), {
                                laborHoursBudget: 0,
                                laborHoursActual: 0,
                                budgetedLaborDollars: 0,
                                actualLaborDollars: 0
                              });

                              return (
                                <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                                  <Table.Summary.Cell index={0}>
                                    <Text strong style={{ color: '#1890ff' }}>Week Totals:</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={1}>
                                    <Text strong style={{ color: '#1890ff' }}>{pageData.reduce((sum, record) => sum + (parseFloat(record.laborHoursBudget) || 0), 0).toFixed(1)} hrs</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={2}>
                                    <Text strong style={{ color: '#1890ff' }}>{pageData.reduce((sum, record) => sum + (parseFloat(record.laborHoursActual) || 0), 0).toFixed(1)} hrs</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={3}>
                                    <Text strong style={{ color: '#1890ff' }}>${pageData.reduce((sum, record) => sum + (parseFloat(record.budgetedLaborDollars) || 0), 0).toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={4}>
                                    <Text strong style={{ color: '#1890ff' }}>${pageData.reduce((sum, record) => sum + (parseFloat(record.actualLaborDollars) || 0), 0).toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={5}>
                                    <Text strong style={{ color: '#1890ff' }}>${pageData.reduce((sum, record) => sum + (parseFloat(record.dailyLaborRate) || 0), 0).toFixed(2)}</Text>
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
                                    {record.restaurantOpen === false && (
                                      <div style={{ fontSize: '10px', color: '#ff4d4f', fontWeight: 'bold' }}>
                                        CLOSED
                                      </div>
                                    )}
                                  </div>
                                )
                              },
                              {
                                title: 'Labor Hours - Budget',
                                dataIndex: 'laborHoursBudget',
                                key: 'laborHoursBudget',
                                width: 120,
                                render: (value, record) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  return <Text className="text-sm sm:text-base">{(parseFloat(value) || 0).toFixed(1)} hrs</Text>;
                                }
                              },
                              {
                                title: 'Labor Hours - Actual',
                                dataIndex: 'laborHoursActual',
                                key: 'laborHoursActual',
                                width: 150,
                                render: (value, record) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  const actual = parseFloat(value) || 0;
                                  const budget = parseFloat(record.laborHoursBudget) || 0;
                                  const isOverBudget = actual > budget;
                                  return (
                                    <Text style={{ 
                                      backgroundColor: isOverBudget ? '#ffebee' : '#f0f8ff', 
                                      color: isOverBudget ? '#d32f2f' : '#1890ff',
                                      padding: '2px 6px', 
                                      borderRadius: '3px' 
                                    }} className="text-sm sm:text-base">
                                      {actual.toFixed(1)} hrs
                                    </Text>
                                  );
                                }
                              },
                              {
                                title: 'Budgeted Labor $',
                                dataIndex: 'budgetedLaborDollars',
                                key: 'budgetedLaborDollars',
                                width: 120,
                                render: (value, record) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  return <Text className="text-sm sm:text-base">${(parseFloat(value) || 0).toFixed(2)}</Text>;
                                }
                              },
                              {
                                title: 'Actual Labor $',
                                dataIndex: 'actualLaborDollars',
                                key: 'actualLaborDollars',
                                width: 150,
                                render: (value, record) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  const actual = parseFloat(value) || 0;
                                  const budget = parseFloat(record.budgetedLaborDollars) || 0;
                                  const isOverBudget = actual > budget;
                                  return (
                                    <Text style={{ 
                                      backgroundColor: isOverBudget ? '#ffebee' : '#f0f8ff', 
                                      color: isOverBudget ? '#d32f2f' : '#1890ff',
                                      padding: '2px 6px', 
                                      borderRadius: '3px' 
                                    }} className="text-sm sm:text-base">
                                      ${actual.toFixed(2)}
                                    </Text>
                                  );
                                }
                              },
                              {
                                title: 'Daily Labor Rate',
                                dataIndex: 'dailyLaborRate',
                                key: 'dailyLaborRate',
                                width: 150,
                                render: (value, record) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  return <Text className='bg-green-200 p-1 rounded-md text-sm sm:text-base'>${(parseFloat(value) || 0).toFixed(2)}</Text>;
                                }
                              },
                              {
                                title:"Daily Labor % of Sales",
                                dataIndex:"dailyLaborPercentage",
                                key:"dailyLaborPercentage",
                                width:150,
                                render:(value, record) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  // Calculate daily percentage using net sales from API
                                  const actualLabor = parseFloat(record.actualLaborDollars) || 0;
                                  const netSales = getNetSalesForDate(record.date);
                                  const dailyPercentage = netSales > 0 ? ((actualLabor / netSales) * 100) : 0;
                                  return <Text className="text-sm sm:text-base" style={{ 
                                    backgroundColor: '#e8f5e8', 
                                    color: '#2e7d32',
                                    padding: '2px 6px', 
                                    borderRadius: '3px',
                                    fontWeight: 'bold'
                                  }}>{dailyPercentage.toFixed(2)}%</Text>;
                                }
                              },
                              {
                                title:"Weekly Labor % of Sales",
                                dataIndex:"weeklyLaborPercentage",
                                key:"weeklyLaborPercentage",
                                width:150,
                                render:(value, record, index) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  // Calculate cumulative percentage up to this day
                                  let cumulativeLabor = 0;
                                  let cumulativeSales = 0;
                                  const daysUpToCurrent = week.dailyData.slice(0, index + 1);
                                  
                                  daysUpToCurrent.forEach(day => {
                                    if (day.restaurantOpen !== false) {
                                      cumulativeLabor += parseFloat(day.actualLaborDollars) || 0;
                                      cumulativeSales += getNetSalesForDate(day.date);
                                    }
                                  });
                                  
                                  const weeklyPercentage = cumulativeSales > 0 ? ((cumulativeLabor / cumulativeSales) * 100) : 0;
                                  return <Text className="text-sm sm:text-base" style={{ 
                                    backgroundColor: '#fff3e0', 
                                    color: '#f57c00',
                                    padding: '2px 6px', 
                                    borderRadius: '3px',
                                    fontWeight: 'bold'
                                  }}>{weeklyPercentage.toFixed(2)}%</Text>;
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
          <Card title=" Actual Weekly Labor Totals" className="h-fit">
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
                    value={`${weeklyData.length > 0 ? weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.laborHoursBudget) || 0), 0).toFixed(1) : '0.0'} hrs`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#fff7ed', color: '#1890ff' }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Labor Hours - Actual:</Text>
                  <Input
                    value={`${weeklyData.length > 0 ? weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.laborHoursActual) || 0), 0).toFixed(1) : '0.0'} hrs`}
                    className="mt-1"
                    disabled
                    style={{ 
                      backgroundColor: (() => {
                        if (weeklyData.length === 0) return '#fff7ed';
                        const totalBudget = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.laborHoursBudget) || 0), 0);
                        const totalActual = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.laborHoursActual) || 0), 0);
                        return totalActual > totalBudget ? '#ffebee' : '#fff7ed';
                      })(),
                      color: (() => {
                        if (weeklyData.length === 0) return '#1890ff';
                        const totalBudget = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.laborHoursBudget) || 0), 0);
                        const totalActual = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.laborHoursActual) || 0), 0);
                        return totalActual > totalBudget ? '#d32f2f' : '#1890ff';
                      })()
                    }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Budgeted Labor $:</Text>
                  <Input
                    value={`$${weeklyData.length > 0 ? weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.budgetedLaborDollars) || 0), 0).toFixed(2) : '0.00'}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#fff7ed', color: '#1890ff' }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Actual Labor $:</Text>
                  <Input
                    value={`$${weeklyData.length > 0 ? weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.actualLaborDollars) || 0), 0).toFixed(2) : '0.00'}`}
                    className="mt-1"
                    disabled
                    style={{ 
                      backgroundColor: (() => {
                        if (weeklyData.length === 0) return '#fff7ed';
                        const totalBudget = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.budgetedLaborDollars) || 0), 0);
                        const totalActual = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.actualLaborDollars) || 0), 0);
                        return totalActual > totalBudget ? '#ffebee' : '#fff7ed';
                      })(),
                      color: (() => {
                        if (weeklyData.length === 0) return '#1890ff';
                        const totalBudget = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.budgetedLaborDollars) || 0), 0);
                        const totalActual = weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.actualLaborDollars) || 0), 0);
                        return totalActual > totalBudget ? '#d32f2f' : '#1890ff';
                      })()
                    }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Daily Labor Rate:</Text>
                  <Input
                    value={`$${weeklyData.length > 0 ? weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.dailyLaborRate) || 0), 0).toFixed(2) : '0.00'}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#fff7ed', color: '#1890ff' }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Average Daily Labor % of Sales:</Text>
                  <Input
                    value={`${(() => {
                      if (weeklyData.length === 0) return '0.0';
                      const validDays = weeklyData[0].dailyData.filter(day => day.restaurantOpen !== false);
                      if (validDays.length === 0) return '0.0';
                      
                      const totalDailyPercentage = validDays.reduce((sum, day) => {
                        const actualLabor = parseFloat(day.actualLaborDollars) || 0;
                        const netSales = getNetSalesForDate(day.date);
                        const dailyPercentage = netSales > 0 ? ((actualLabor / netSales) * 100) : 0;
                        return sum + dailyPercentage;
                      }, 0);
                      
                      return (totalDailyPercentage / validDays.length).toFixed(1);
                    })()}%`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#e8f5e8', color: '#2e7d32' }}
                  />
                </div>
                
                <div>
                  <Text strong className="text-sm sm:text-base">Final Weekly Labor % of Sales:</Text>
                  <Input
                    value={`${(() => {
                      if (weeklyData.length === 0) return '0.0';
                      
                      const totalLabor = weeklyData[0].dailyData.reduce((sum, day) => {
                        return day.restaurantOpen !== false ? sum + (parseFloat(day.actualLaborDollars) || 0) : sum;
                      }, 0);
                      
                      const totalSales = weeklyData[0].dailyData.reduce((sum, day) => {
                        return day.restaurantOpen !== false ? sum + getNetSalesForDate(day.date) : sum;
                      }, 0);
                      
                      return totalSales > 0 ? ((totalLabor / totalSales) * 100).toFixed(1) : '0.0';
                    })()}%`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#fff3e0', color: '#f57c00' }}
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