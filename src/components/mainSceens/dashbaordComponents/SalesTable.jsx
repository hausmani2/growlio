import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);
import useStore from '../../../store/store';
import LoadingSpinner from '../../layout/LoadingSpinner';
import ToggleSwitch from '../../buttons/ToggleSwitch';
const { Title, Text } = Typography;

const SalesTable = ({ selectedDate, selectedYear, selectedMonth, weekDays = [], dashboardData = null, refreshDashboardData = null }) => {
  // Store integration
  const { 
    saveDashboardData, 
    loading: storeLoading, 
    error: storeError,
    completeOnboardingData
  } = useStore();

  // Get providers from onboarding data
  const getProviders = () => {
    if (!completeOnboardingData || !completeOnboardingData['Sales Channels'] || !completeOnboardingData['Sales Channels'].data) {
      return [];
    }
    return completeOnboardingData['Sales Channels'].data.providers || [];
  };

  const [providers, setProviders] = useState([]);

  // Update providers when onboarding data changes
  useEffect(() => {
    const currentProviders = getProviders();
    setProviders(currentProviders);
  }, [completeOnboardingData]);

  const [weeklyGoals, setWeeklyGoals] = useState({
    salesBudget: 0,
    actualSalesInStore: 0,
    actualSalesAppOnline: 0,
    netSalesActual: 0,
    actualVsBudgetSales: 0,
    dailyTickets: 0,
    averageDailyTicket: 0,
    // Dynamic provider fields will be added here
  });

  // const [weeklyTotals, setWeeklyTotals] = useState({
  //   salesBudget: 0,
  //   actualSalesInStore: 0,
  //   actualSalesAppOnline: 0,
  //   netSalesActual: 0,
  //   actualVsBudgetSales: 0,
  //   dailyTickets: 0,
  //   averageDailyTicket: 0,
  //   // Dynamic provider fields will be added here
  // });

  const [weeklyData, setWeeklyData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);
  const [dataNotFound, setDataNotFound] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Process dashboard data when it changes
  useEffect(() => {
    if (dashboardData) {
      processDashboardData();
    } else {
      // Reset data when no dashboard data is available
      setWeeklyData([]);
      setWeeklyGoals({
        salesBudget: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,
        netSalesActual: 0,
        dailyTickets: 0,
        averageDailyTicket: 0
      });
      // setWeeklyTotals({
      //   salesBudget: 0,
      //   actualSalesInStore: 0,
      //   actualSalesAppOnline: 0,
      //   netSalesActual: 0,
      //   dailyTickets: 0,
      //   averageDailyTicket: 0
      // });
      setDataNotFound(true);
    }
  }, [dashboardData, weekDays]);

  // Handle navigation context from Summary Dashboard - Auto-open sales modal
  useEffect(() => {
    const navigationContext = localStorage.getItem('dashboardNavigationContext');
    
    if (navigationContext) {
      try {
        const context = JSON.parse(navigationContext);
        
        // Check if this navigation came from Summary Dashboard and should open sales modal
        if (context.source === 'summary-dashboard' && context.shouldOpenSalesModal) {
          console.log('🎯 Processing navigation context for sales modal');
          
          // Store the budgeted sales data for use in the modal
          if (context.budgetedSalesData) {
            localStorage.setItem('budgetedSalesData', JSON.stringify(context.budgetedSalesData));
          }
          
          // Wait for dashboard data to be processed before opening modal
          // The modal will be opened in the next useEffect after data is processed
        }
      } catch (error) {
        console.error('Error processing navigation context for sales modal:', error);
        localStorage.removeItem('dashboardNavigationContext');
      }
    }
  }, []); // Only run once on mount

  // Auto-open modal after dashboard data is processed
  useEffect(() => {
    const navigationContext = localStorage.getItem('dashboardNavigationContext');
    
    if (navigationContext && dashboardData !== null) {
      try {
        const context = JSON.parse(navigationContext);
        
        if (context.source === 'summary-dashboard' && context.shouldOpenSalesModal) {
          // Check if we have budgeted sales data from summary dashboard
          const budgetedSalesData = localStorage.getItem('budgetedSalesData');
          
          if (budgetedSalesData) {
            // We have budgeted sales data from summary dashboard, open in edit mode
            showEditWeeklyModal(weeklyData[0]);
            message.info('Editing sales data with budgeted sales from summary dashboard...');
          } else if (dataNotFound || areAllValuesZero(weeklyData)) {
            // No data exists, open in add mode
            showAddWeeklyModal();
            message.info('Adding sales data for the selected week...');
          } else {
            // Data exists, open in edit mode
            showEditWeeklyModal(weeklyData[0]);
            message.info('Editing existing sales data for the selected week...');
          }
          
          // Clear the navigation context after processing
          localStorage.removeItem('dashboardNavigationContext');
        }
      } catch (error) {
        console.error('Error auto-opening sales modal:', error);
        localStorage.removeItem('dashboardNavigationContext');
      }
    }
  }, [dashboardData, dataNotFound, weeklyData]);

  // Recalculate weekly totals when weeklyData changes
  // useEffect(() => {
  //   if (weeklyData.length > 0) {
  //     calculateWeeklyTotalsFromData(weeklyData);
  //   }
  // }, [weeklyData]);

  // Helper function to check if all values in weeklyData are zeros
  const areAllValuesZero = (weeklyData) => {
    if (!weeklyData || weeklyData.length === 0) return true;
    
    return weeklyData.every(week => {
      if (!week.dailyData || week.dailyData.length === 0) return true;
      
      return week.dailyData.every(day => {
        const budgetedSales = parseFloat(day.budgetedSales) || 0;
        const actualSalesInStore = parseFloat(day.actualSalesInStore) || 0;
        const actualSalesAppOnline = parseFloat(day.actualSalesAppOnline) || 0;
        const dailyTickets = parseFloat(day.dailyTickets) || 0;
        const averageDailyTicket = parseFloat(day.averageDailyTicket) || 0;
        
        // Check dynamic provider fields
        const providerFields = providers.map(provider => {
          const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
          return parseFloat(day[providerKey]) || 0;
        });
        
        const allProviderFieldsZero = providerFields.every(field => field === 0);
        
        return budgetedSales === 0 && 
               actualSalesInStore === 0 && 
               actualSalesAppOnline === 0 && 
               dailyTickets === 0 && 
               averageDailyTicket === 0 &&
               allProviderFieldsZero;
      });
    });
  };

  // Helper function to calculate actual sales budget ratio
  const calculateActualSalesBudget = (budgetedSales, netSales) => {
    if (budgetedSales === 0) return 0;
    return ((netSales - budgetedSales) / budgetedSales) * 100;
  };

  // Helper function to calculate average daily ticket as integer
  const calculateAverageDailyTicket = (netSales, dailyTickets) => {
    if (dailyTickets === 0) return 0;
    return Math.round(netSales / dailyTickets);
  };

  // Check if a day is closed (restaurant not open)
  const isDayClosed = (record) => {
    // Handle both boolean and integer values
    if (typeof record.restaurant_open === 'boolean') {
      return !record.restaurant_open;
    }
    return record.restaurant_open === 0;
  };

  // Handle toggle changes in the main table
  const handleMainTableToggleChange = async (dayIndex, field, value, record) => {
    try {
      // Update the local state immediately for better UX
      const updatedWeeklyData = [...weeklyData];
      if (updatedWeeklyData[0] && updatedWeeklyData[0].dailyData) {
        updatedWeeklyData[0].dailyData[dayIndex] = { 
          ...updatedWeeklyData[0].dailyData[dayIndex], 
          [field]: value 
        };
        setWeeklyData(updatedWeeklyData);
      }

      // Prepare the data for API update
      const currentWeekData = weeklyData[0];
      if (!currentWeekData || !currentWeekData.dailyData) {
        message.error('No weekly data found to update');
        return;
      }

      // Create the transformed data for API
      const transformedData = {
        week_start: weekDays.length > 0 ? weekDays[0].date.format('YYYY-MM-DD') : selectedDate ? selectedDate.format('YYYY-MM-DD') : selectedYear && selectedMonth ? dayjs(`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`).format('YYYY-MM-DD') : null,
        section: "Sales Performance",
        section_data: {
          weekly: {
            sales_budget: (weeklyGoals.salesBudget || 0).toFixed(2),
            actual_sales_in_store: (weeklyGoals.actualSalesInStore || 0).toFixed(2),
            actual_sales_app_online: (weeklyGoals.actualSalesAppOnline || 0).toFixed(2),
            net_sales_actual: (weeklyGoals.netSalesActual || 0).toFixed(2),
            actual_vs_budget_sales: (weeklyGoals.actualVsBudgetSales || 0),
            daily_tickets: (weeklyGoals.dailyTickets || 0),
            average_daily_ticket: (weeklyGoals.averageDailyTicket || 0).toFixed(2),
            // Add dynamic provider fields to weekly data
            ...providers.reduce((acc, provider) => {
              const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
              acc[`actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`] = (weeklyGoals[providerKey] || 0).toFixed(2);
              return acc;
            }, {})
          },
          daily: currentWeekData.dailyData.map(day => {
            const dailyData = {
              date: day.date.format('YYYY-MM-DD'),
              day: day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1),
              sales_budget: (parseFloat(day.budgetedSales) || 0).toFixed(2),
              actual_sales_in_store: (parseFloat(day.actualSalesInStore) || 0).toFixed(2),
              actual_sales_app_online: (parseFloat(day.actualSalesAppOnline) || 0).toFixed(2),
              daily_tickets: parseFloat(day.dailyTickets) || 0,
              average_daily_ticket: (parseFloat(day.averageDailyTicket) || 0).toFixed(2),
              restaurant_open: (() => {
                const dayValue = day.restaurant_open;
                // Ensure we always send integer values (0 or 1)
                if (typeof dayValue === 'boolean') {
                  return dayValue ? 1 : 0;
                }
                if (dayValue === null || dayValue === undefined || dayValue === false) {
                  return 0;
                }
                if (typeof dayValue === 'string') {
                  return dayValue.toLowerCase() === 'true' || dayValue === '1' ? 1 : 0;
                }
                return dayValue !== 0 ? 1 : 0;
              })(),
              // Add dynamic provider fields to daily data
              ...providers.reduce((acc, provider) => {
                const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                acc[`actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`] = (parseFloat(day[providerKey]) || 0).toFixed(2);
                return acc;
              }, {})
            };

            // Calculate net sales actual including dynamic providers
            const baseSales = (parseFloat(day.actualSalesInStore) || 0) + 
                             (parseFloat(day.actualSalesAppOnline) || 0)
            const providerSales = providers.reduce((sum, provider) => {
              const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
              return sum + (parseFloat(day[providerKey]) || 0);
            }, 0);
            dailyData.net_sales_actual = (baseSales + providerSales).toFixed(2);

            return dailyData;
          })
        }
      };

      // Save to API
      await saveDashboardData(transformedData);
      
      // Show success message
      message.success(`Day ${value === 1 ? 'opened' : 'closed'} successfully!`);
      
      // Refresh dashboard data
      if (refreshDashboardData) {
        await refreshDashboardData();
      }
    } catch (error) {
      console.error('Error updating restaurant open/closed status:', error);
      message.error(`Failed to update day status: ${error.message}`);
      
      // Revert the local state change on error
      const revertedWeeklyData = [...weeklyData];
      if (revertedWeeklyData[0] && revertedWeeklyData[0].dailyData) {
        revertedWeeklyData[0].dailyData[dayIndex] = { 
          ...revertedWeeklyData[0].dailyData[dayIndex], 
          [field]: record[field] 
        };
        setWeeklyData(revertedWeeklyData);
      }
    }
  };

  // Process dashboard data to extract sales information
  const processDashboardData = () => {
    if (!dashboardData) {
      setDataNotFound(true);
      return;
    }

    setDataNotFound(false);

    // Load weekly goals from the Sales Performance section
    if (dashboardData['Sales Performance']) {
      const salesPerformance = dashboardData['Sales Performance'];
      const goals = {
        salesBudget: parseFloat(salesPerformance.sales_budget) || 0,
        actualSalesInStore: parseFloat(salesPerformance.actual_sales_in_store) || 0,
        actualSalesAppOnline: parseFloat(salesPerformance.actual_sales_app_online) || 0,
        netSalesActual: parseFloat(salesPerformance.net_sales_actual) || 0,
        actualVsBudgetSales: parseFloat(salesPerformance.actual_vs_budget_sales) || 0,
        dailyTickets: parseFloat(salesPerformance.daily_tickets) || 0,
        averageDailyTicket: parseFloat(salesPerformance.average_daily_ticket) || 0
      };

      // Add dynamic provider fields to goals from third_party_sales object
      if (salesPerformance.third_party_sales) {
        providers.forEach(provider => {
          const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
          // Look for provider in third_party_sales object
          const providerFieldName = `actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`;
          goals[providerKey] = parseFloat(salesPerformance.third_party_sales[providerFieldName]) || 0;
        });
      } else {
        // Fallback to direct fields if third_party_sales doesn't exist
        providers.forEach(provider => {
          const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
          goals[providerKey] = parseFloat(salesPerformance[providerKey]) || 0;
        });
      }

      setWeeklyGoals(goals);
    }

    // Extract all daily entries into one consolidated table
    const allDailyEntries = dashboardData.daily_entries?.map((entry) => {
      const dailyData = {
        key: `day-${entry.date}`,
        date: dayjs(entry.date),
        dayName: dayjs(entry.date).format('dddd').toLowerCase(),
        budgetedSales: entry['Sales Performance']?.sales_budget || 0,
        actualSalesInStore: entry['Sales Performance']?.actual_sales_in_store || 0,
        actualSalesAppOnline: entry['Sales Performance']?.actual_sales_app_online || 0,
        actualVsBudgetSales: entry['Sales Performance']?.actual_vs_budget_sales || 0,
        dailyTickets: entry['Sales Performance']?.daily_tickets || 0,
        averageDailyTicket: entry['Sales Performance']?.average_daily_ticket || 0,
        restaurant_open: (() => {
          const value = entry['Sales Performance']?.restaurant_open;
          // Handle both boolean and integer values
          if (typeof value === 'boolean') {
            return value ? 1 : 0;
          }
          // Handle null, undefined, or falsy values
          if (value === null || value === undefined || value === false) {
            return 0;
          }
          // Handle string values
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1' ? 1 : 0;
          }
          // Handle numeric values
          return value !== 0 ? 1 : 0;
        })() // Default to 1 (open) if not specified
      };

      // Add dynamic provider fields to daily data from third_party_sales object
      if (entry['Sales Performance']?.third_party_sales) {
        providers.forEach(provider => {
          const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
          // Look for provider in third_party_sales object
          const providerFieldName = `actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`;
          dailyData[providerKey] = parseFloat(entry['Sales Performance'].third_party_sales[providerFieldName]) || 0;
        });
      } else {
        // Fallback to direct fields if third_party_sales doesn't exist
        providers.forEach(provider => {
          const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
          dailyData[providerKey] = entry['Sales Performance']?.[providerKey] || 0;
        });
      }

      return dailyData;
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
        
        const defaultData = {
          key: `day-${day.date.format('YYYY-MM-DD')}`,
          date: day.date,
          dayName: day.dayName.toLowerCase(),
          budgetedSales: 0,
          actualSalesInStore: 0,
          actualSalesAppOnline: 0,
          actualVsBudgetSales: 0,
          dailyTickets: 0,
          averageDailyTicket: 0,
          restaurant_open: (() => {
            // If we have existing data, use it and convert if needed
            if (existingEntry?.restaurant_open !== undefined) {
              const value = existingEntry.restaurant_open;
              // Handle both boolean and integer values
              if (typeof value === 'boolean') {
                return value ? 1 : 0;
              }
              // Handle null, undefined, or falsy values
              if (value === null || value === undefined || value === false) {
                return 0;
              }
              // Handle string values
              if (typeof value === 'string') {
                return value.toLowerCase() === 'true' || value === '1' ? 1 : 0;
              }
              // Handle numeric values
              return value !== 0 ? 1 : 0;
            }
            return 1; // Default to open for new days
          })()
        };

        // Add dynamic provider fields to default data
        providers.forEach(provider => {
          const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
          defaultData[providerKey] = 0;
        });

        return existingEntry || defaultData;
      });
    } else {
      // If no weekDays provided, use all daily entries or generate default structure
      dailyData = allDailyEntries.length > 0 ? allDailyEntries : [];
    }
    
    const weekStartDate = weekDays.length > 0 ? weekDays[0].date : selectedDate;
    
    setWeeklyData([{
      id: 'consolidated-week',
      weekTitle: 'Weekly Sales Data',
      startDate: weekStartDate,
      dailyData: dailyData
    }]);
    
    // Calculate weekly totals from the consolidated data
    // calculateWeeklyTotalsFromData([{
    //   id: 'consolidated-week',
    //   weekTitle: 'Weekly Sales Data',
    //   startDate: weekStartDate,
    //   dailyData: dailyData
    // }]);
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
      
      // Update weekly goals from the modal data
      if (weekData.weeklyTotals) {
        setWeeklyGoals({
          salesBudget: weekData.weeklyTotals.salesBudget || 0,
          actualSalesInStore: weekData.weeklyTotals.actualSalesInStore || 0,
          actualSalesAppOnline: weekData.weeklyTotals.actualSalesAppOnline || 0,
          netSalesActual: weekData.weeklyTotals.netSalesActual || 0,
          dailyTickets: weekData.weeklyTotals.dailyTickets || 0,
          averageDailyTicket: weekData.weeklyTotals.averageDailyTicket || 0
        });
      }

      // Save data to API when modal is submitted
      // Use the weekData from the modal instead of checking weeklyData state
      if (!weekData || !weekData.dailyData) {
        message.warning('No weekly data to save. Please add weekly Sales data first.');
        return;
      }

      // Use the weekly totals from the modal data
      const weeklyTotals = weekData.weeklyTotals || {
        salesBudget: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,
        netSalesActual: 0,
        dailyTickets: 0,
        averageDailyTicket: 0
      };

      // Calculate final totals for this week
      const finalTotals = {
        salesBudget: weeklyTotals.salesBudget,
        actualSalesInStore: weeklyTotals.actualSalesInStore,
        actualSalesAppOnline: weeklyTotals.actualSalesAppOnline,
        netSalesActual: weeklyTotals.netSalesActual || (weeklyTotals.actualSalesInStore + weeklyTotals.actualSalesAppOnline),
        actualVsBudgetSales: weeklyTotals.actualVsBudgetSales || 0,
        dailyTickets: weeklyTotals.dailyTickets,
        averageDailyTicket: weeklyTotals.averageDailyTicket
      };

      // Transform data to API format - only save the current week's daily data
      const transformedData = {
        week_start: weekDays.length > 0 ? weekDays[0].date.format('YYYY-MM-DD') : selectedDate ? selectedDate.format('YYYY-MM-DD') : selectedYear && selectedMonth ? dayjs(`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`).format('YYYY-MM-DD') : null,
        section: "Sales Performance",
        section_data: {
          weekly: {
            sales_budget: finalTotals.salesBudget.toFixed(2),
            actual_sales_in_store: finalTotals.actualSalesInStore.toFixed(2),
            actual_sales_app_online: finalTotals.actualSalesAppOnline.toFixed(2),
            net_sales_actual: finalTotals.netSalesActual.toFixed(2),
            actual_vs_budget_sales: finalTotals.actualVsBudgetSales || 0,
            daily_tickets: finalTotals.dailyTickets || 0,
            average_daily_ticket: (finalTotals.averageDailyTicket || 0).toFixed(2),
            // Add dynamic provider fields to weekly data
            ...providers.reduce((acc, provider) => {
              const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
              acc[`actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`] = finalTotals[providerKey]?.toFixed(2) || '0.00';
              return acc;
            }, {})
          },
          daily: weekData.dailyData.map(day => {
            const dailyData = {
              date: day.date.format('YYYY-MM-DD'),
              day: day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1), // Capitalize first letter
              sales_budget: (parseFloat(day.budgetedSales) || 0).toFixed(2),
              actual_sales_in_store: (parseFloat(day.actualSalesInStore) || 0).toFixed(2),
              actual_sales_app_online: (parseFloat(day.actualSalesAppOnline) || 0).toFixed(2),
              daily_tickets: parseFloat(day.dailyTickets) || 0,
              average_daily_ticket: (parseFloat(day.averageDailyTicket) || 0).toFixed(2),
              restaurant_open: (() => {
                const value = day.restaurant_open;
                // Ensure we always send integer values (0 or 1)
                if (typeof value === 'boolean') {
                  return value ? 1 : 0;
                }
                if (value === null || value === undefined || value === false) {
                  return 0;
                }
                if (typeof value === 'string') {
                  return value.toLowerCase() === 'true' || value === '1' ? 1 : 0;
                }
                return value !== 0 ? 1 : 0;
              })(), // Include the restaurant open/closed status
              // Add dynamic provider fields to daily data
              ...providers.reduce((acc, provider) => {
                const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                acc[`actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`] = (parseFloat(day[providerKey]) || 0).toFixed(2);
                return acc;
              }, {})
            };

            // Calculate net sales actual including dynamic providers
            const baseSales = (parseFloat(day.actualSalesInStore) || 0) + 
                             (parseFloat(day.actualSalesAppOnline) || 0)
            const providerSales = providers.reduce((sum, provider) => {
              const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
              return sum + (parseFloat(day[providerKey]) || 0);
            }, 0);
            dailyData.net_sales_actual = (baseSales + providerSales).toFixed(2);

            return dailyData;
          })
        }
      };

      await saveDashboardData(transformedData);
      
      // Show success message
      message.success(isEditMode ? 'Sales data updated successfully!' : 'Sales data saved successfully!');
      
      // Show confirmation popup asking if user wants to add COGS data
      Modal.confirm({
        title: '🎉 Sales Data Saved Successfully!',
        content: (
          <div>
            <p>Your sales performance data has been saved successfully.</p>
            <p style={{ marginTop: '8px', fontWeight: 'bold', color: '#1890ff' }}>
              Would you like to add COGS (Cost of Goods Sold) data for this week?
            </p>
          </div>
        ),
        okText: 'Yes, Add COGS Data',
        cancelText: 'No, Later',
        okType: 'primary',
        onOk: () => {
          // Close the sales modal first
          setIsModalVisible(false);
          setEditingWeek(null);
          setIsEditMode(false);
          
          // Show message that COGS modal will open
          message.info('Opening COGS data modal...');
          
          // Trigger COGS modal opening by dispatching a custom event
          const event = new CustomEvent('openCogsModal', {
            detail: {
              weekStartDate: weekDays.length > 0 ? weekDays[0].date.format('YYYY-MM-DD') : selectedDate ? selectedDate.format('YYYY-MM-DD') : selectedYear && selectedMonth ? dayjs(`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`).format('YYYY-MM-DD') : null
            }
          });
          window.dispatchEvent(event);
        },
        onCancel: () => {
          // Just close the sales modal
          setIsModalVisible(false);
          setEditingWeek(null);
          setIsEditMode(false);
        }
      });
      
      // Refresh all dashboard data to show updated data across all components
      if (refreshDashboardData) {
        await refreshDashboardData();
      } else {
        // Fallback: reload data after saving
        await processDashboardData(); 
      }
    } catch (error) {
      console.error('Error in handleWeeklySubmit:', error);
      message.error(`Failed to ${isEditMode ? 'update' : 'save'} sales data: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };





  // Generate 7 days of data starting from a given date
  const generateDailyData = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = dayjs(startDate).add(i, 'day');
      const dayData = {
        key: `day-${currentDate.format('YYYY-MM-DD')}`,
        date: currentDate,
        dayName: currentDate.format('dddd'),
        budgetedSales: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,
        restaurant_open: 1 // Default to open for new days
      };

      // Add dynamic provider fields
      providers.forEach(provider => {
        const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
        dayData[providerKey] = 0;
      });

      days.push(dayData);
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
        salesBudget: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,  
        dailyTickets: 0,
        averageDailyTicket: 0,
        // Dynamic provider fields will be added here
      }
    });

      // Check if a day is closed (restaurant not open)
  const isDayClosed = (record) => {
    // Handle both boolean and integer values
    if (typeof record.restaurant_open === 'boolean') {
      return !record.restaurant_open;
    }
    return record.restaurant_open === 0;
  };

    useEffect(() => {
      if (editingWeek) {
        // When editing, use the weeklyGoals for weeklyTotals since that's where the weekly data is stored
        let dailyData = editingWeek.dailyData || [];
        
        // Check if we have budgeted sales data from Summary Dashboard (even in edit mode)
        const budgetedSalesData = localStorage.getItem('budgetedSalesData');
        if (budgetedSalesData) {
          try {
            const parsedBudgetedData = JSON.parse(budgetedSalesData);
            
            // Pre-fill the daily data with budgeted sales
            dailyData = dailyData.map((day, index) => {
              const budgetedDay = parsedBudgetedData[index];
              if (budgetedDay && budgetedDay.budgetedSales > 0) {
                return {
                  ...day,
                  budgetedSales: budgetedDay.budgetedSales
                };
              }
              return day;
            });
            
            // Clear the budgeted sales data after using it
            localStorage.removeItem('budgetedSalesData');
          } catch (error) {
            console.error('Error parsing budgeted sales data in edit mode:', error);
            localStorage.removeItem('budgetedSalesData');
          }
        }
        
        setWeekFormData({
          ...editingWeek,
          dailyData: dailyData,
          weeklyTotals: {
            salesBudget: weeklyGoals.salesBudget || 0,
            actualSalesInStore: weeklyGoals.actualSalesInStore || 0,
            actualSalesAppOnline: weeklyGoals.actualSalesAppOnline || 0,
            dailyTickets: weeklyGoals.dailyTickets || 0,
            averageDailyTicket: weeklyGoals.averageDailyTicket || 0,
            // Add dynamic provider fields
            ...providers.reduce((acc, provider) => {
              const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
              acc[providerKey] = weeklyGoals[providerKey] || 0;
              return acc;
            }, {})
          }
        });
      } else {
        // Check if we have budgeted sales data from Summary Dashboard
        const budgetedSalesData = localStorage.getItem('budgetedSalesData');
        let dailyData = generateDailyData(weekDays.length > 0 ? weekDays[0].date : selectedDate);
        
        if (budgetedSalesData) {
          try {
            const parsedBudgetedData = JSON.parse(budgetedSalesData);
            
            // Pre-fill the daily data with budgeted sales
            dailyData = dailyData.map((day, index) => {
              const budgetedDay = parsedBudgetedData[index];
              if (budgetedDay && budgetedDay.budgetedSales > 0) {
                return {
                  ...day,
                  budgetedSales: budgetedDay.budgetedSales
                };
              }
              return day;
            });
            
            // Clear the budgeted sales data after using it
            localStorage.removeItem('budgetedSalesData');
          } catch (error) {
            console.error('Error parsing budgeted sales data:', error);
            localStorage.removeItem('budgetedSalesData');
          }
        }
        
        setWeekFormData({
          weekTitle: `Week ${weeklyData.length + 1}`,
          startDate: weekDays.length > 0 ? weekDays[0].date : selectedDate,
          dailyData: dailyData,
          weeklyTotals: {
            salesBudget: 0,
            actualSalesInStore: 0,
            actualSalesAppOnline: 0,
            dailyTickets: 0,
            averageDailyTicket: 0,
            // Add dynamic provider fields
            ...providers.reduce((acc, provider) => {
              const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
              acc[providerKey] = 0;
              return acc;
            }, {})
          }
        });
      }
    }, [editingWeek, weeklyData.length, weekDays, selectedDate, weeklyGoals]);

    const handleDailyDataChange = (dayIndex, field, value, record) => {
      // Allow changes to restaurant_open field even when day is closed
      if (isDayClosed(record) && field !== 'restaurant_open') {
        message.warning(`Cannot add data for ${record.dayName} - Restaurant is closed on this day.`);
        return;
      }
      
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
        title={isEditMode ? "Edit Weekly Sales Data" : "Add Weekly Sales Data"}
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
          {/* Weekly Totals Section - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="w-full">
              <Text strong className="text-sm sm:text-base">Sales Budget:</Text>
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
                className="w-full"
              />
            </div>
            <div className="w-full">
              <Text strong className="text-sm sm:text-base">Actual Sales - In Store:</Text>
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
                className="w-full"
              />
            </div>
            <div className="w-full">
              <Text strong className="text-sm sm:text-base">Actual Sales - App/Online:</Text>
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
                className="w-full"
              />
            </div>
          </div>
          
          {/* Dynamic Provider Fields - Responsive Grid */}
          {providers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((provider) => (
                <div key={provider.provider_name} className="w-full">
                  <Text strong className="text-sm sm:text-base">Actual Sales - {provider.provider_name}:</Text>
                  <Input
                    type='number'
                    value={weekFormData.weeklyTotals[`actualSales${provider.provider_name.replace(/\s+/g, '')}`] || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                      setWeekFormData(prev => ({
                        ...prev,
                        weeklyTotals: {
                          ...prev.weeklyTotals,
                          [providerKey]: value
                        }
                      }));
                    }}
                    prefix="$"
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="w-full">
              <Text strong className="text-sm sm:text-base"># Daily Tickets:</Text>
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
                className="w-full"
              />
            </div>
          </div>

          {/* Table Section - Responsive */}
          <div className="overflow-x-auto">
            <Table
              dataSource={weekFormData.dailyData}
              pagination={false}
              size="small"
              rowKey={(record) => record.key || `modal-day-${record.date?.format('YYYY-MM-DD')}`}
              scroll={{ x: 'max-content' }}
              rowClassName={(record) => isDayClosed(record) ? 'opacity-50 bg-gray-50' : ''}
              summary={(pageData) => {
                const totals = pageData.reduce((acc, record) => {
                  acc.budgetedSales += parseFloat(record.budgetedSales) || 0;
                  acc.actualSalesInStore += parseFloat(record.actualSalesInStore) || 0;
                  acc.actualSalesAppOnline += parseFloat(record.actualSalesAppOnline) || 0;
                  acc.dailyTickets += parseFloat(record.dailyTickets) || 0;
                  acc.averageDailyTicket += parseFloat(record.averageDailyTicket) || 0;
                  
                  // Add dynamic provider totals
                  providers.forEach(provider => {
                    const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                    if (!acc[providerKey]) acc[providerKey] = 0;
                    acc[providerKey] += parseFloat(record[providerKey]) || 0;
                  });
                  
                  return acc;
                }, {
                  budgetedSales: 0,
                  actualSalesInStore: 0,
                  actualSalesAppOnline: 0,
                  dailyTickets: 0,
                  averageDailyTicket: 0,
                  ...providers.reduce((acc, provider) => {
                    const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                    acc[providerKey] = 0;
                    return acc;
                  }, {})
                });

                // Calculate net sales actual total (including dynamic providers)
                const allSalesFields = ['actualSalesInStore', 'actualSalesAppOnline'];
                providers.forEach(provider => {
                  const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                  allSalesFields.push(providerKey);
                });
                const netSalesActualTotal = allSalesFields.reduce((sum, field) => sum + totals[field], 0);

                return (
                  <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                    <Table.Summary.Cell index={0}>
                      <Text strong style={{ color: '#1890ff' }}>TOTAL</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ color: '#1890ff' }}>-</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text strong style={{ color: '#1890ff' }}>${totals.budgetedSales.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Text strong style={{ color: '#1890ff' }}>${totals.actualSalesInStore.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <Text strong style={{ color: '#1890ff' }}>${totals.actualSalesAppOnline.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                    {/* Dynamic Provider Summary Cells */}
                    {providers.map((provider, index) => {
                      const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                      return (
                        <Table.Summary.Cell key={providerKey} index={5 + index}>
                          <Text strong style={{ color: '#1890ff' }}>${totals[providerKey]?.toFixed(2) || '0.00'}</Text>
                        </Table.Summary.Cell>
                      );
                    })}
                    <Table.Summary.Cell index={5 + providers.length}>
                      <Text strong style={{ color: '#1890ff' }}>${netSalesActualTotal.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6 + providers.length}>
                      <Text strong style={{ color: '#1890ff' }}>{totals.dailyTickets.toFixed(0)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7 + providers.length}>
                      <Text strong style={{ color: '#1890ff' }}>
                        {totals.budgetedSales > 0 && netSalesActualTotal > 0 
                          ? calculateActualSalesBudget(totals.budgetedSales, netSalesActualTotal).toFixed(1) 
                          : '0.0'}%
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8 + providers.length}>
                      <Text strong style={{ color: '#1890ff' }}>
                        {totals.dailyTickets > 0 
                          ? calculateAverageDailyTicket(netSalesActualTotal, totals.dailyTickets) 
                          : 0}
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
                      <div className="font-medium flex items-center gap-2">
                        {text}
                        {isDayClosed(record) && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                            CLOSED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {record.date.format('MMM DD, YYYY')}
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Days',
                  dataIndex: 'restaurant_open',
                  key: 'restaurant_open',
                  width: 100,
                  render: (value, record, index) => (
                    <div className="flex items-center gap-2">
                      <ToggleSwitch
                        isOn={value === 1}
                        setIsOn={(isOn) => {
                          const newValue = isOn ? 1 : 0;
                          handleDailyDataChange(index, 'restaurant_open', newValue, record);
                        }}
                        size="small"
                      />
                      <span className="text-xs text-gray-600">
                        {value === 1 ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  )
                },
                {
                  title: 'Budgeted Sales',
                  dataIndex: 'budgetedSales',
                  key: 'budgetedSales',
                  width: 120,
                  render: (value, record, index) => (
                    <Input
                      type='number'
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'budgetedSales', parseFloat(e.target.value) || 0, record)}
                      placeholder="0.00"
                      className="w-full"
                      disabled={isDayClosed(record)}
                      style={{ 
                        opacity: isDayClosed(record) ? 0.5 : 1,
                        cursor: isDayClosed(record) ? 'not-allowed' : 'text'
                      }}
                    />
                  )
                },
                {
                  title: 'Actual Sales - In Store',
                  dataIndex: 'actualSalesInStore',
                  key: 'actualSalesInStore',
                  width: 150,
                  render: (value, record, index) => (
                    <Input
                      type='number'
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'actualSalesInStore', parseFloat(e.target.value) || 0, record)}
                      placeholder="0.00"
                      className="w-full"
                      disabled={isDayClosed(record)}
                      style={{ 
                        opacity: isDayClosed(record) ? 0.5 : 1,
                        cursor: isDayClosed(record) ? 'not-allowed' : 'text'
                      }}
                    />
                  )
                },
                {
                  title: 'Actual Sales - App/Online',
                  dataIndex: 'actualSalesAppOnline',
                  key: 'actualSalesAppOnline',
                  width: 150,
                  render: (value, record, index) => (
                    <Input
                      type='number'
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'actualSalesAppOnline', parseFloat(e.target.value) || 0, record)}
                      placeholder="0.00"
                      className="w-full"
                      disabled={isDayClosed(record)}
                      style={{ 
                        opacity: isDayClosed(record) ? 0.5 : 1,
                        cursor: isDayClosed(record) ? 'not-allowed' : 'text'
                      }}
                    />
                  )
                },
                // Dynamic Provider Columns
                ...providers.map(provider => ({
                  title: `Actual Sales - ${provider.provider_name}`,
                  dataIndex: `actualSales${provider.provider_name.replace(/\s+/g, '')}`,
                  key: `actualSales${provider.provider_name.replace(/\s+/g, '')}`,
                  width: 150,
                  render: (value, record, index) => (
                                          <Input
                        type='number'
                        value={value}
                        onChange={(e) => handleDailyDataChange(index, `actualSales${provider.provider_name.replace(/\s+/g, '')}`, parseFloat(e.target.value) || 0, record)}
                        placeholder="0.00"
                        className="w-full"
                        disabled={isDayClosed(record)}
                        style={{ 
                          opacity: isDayClosed(record) ? 0.5 : 1,
                          cursor: isDayClosed(record) ? 'not-allowed' : 'text'
                        }}
                      />
                  )
                })),
                {
                  title: 'Net Sales - Actual (Auto-calculated)',
                  dataIndex: 'netSalesActual',
                  key: 'netSalesActual',
                  width: 150,
                  render: (value, record) => {
                    // Calculate the sum of actual sales for this day (including dynamic providers)
                    const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                    const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                    
                    // Add dynamic provider sales
                    const providerSales = providers.reduce((sum, provider) => {
                      const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                      return sum + (parseFloat(record[providerKey]) || 0);
                    }, 0);
                    
                    const calculatedNetSales = actualSalesInStore + actualSalesAppOnline  + providerSales;
                    
                    return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${calculatedNetSales.toFixed(2)}</Text>;
                  }
                },
                {
                  title: '# Daily Tickets',
                  dataIndex: 'dailyTickets',
                  key: 'dailyTickets',
                  width: 150,
                  render: (value, record, index) => (
                    <Input
                      type='number'
                      value={value}
                      onChange={(e) => handleDailyDataChange(index, 'dailyTickets', parseFloat(e.target.value) || 0, record)}
                      placeholder="0"
                      className="w-full"
                      disabled={isDayClosed(record)}
                      style={{ 
                        opacity: isDayClosed(record) ? 0.5 : 1,
                        cursor: isDayClosed(record) ? 'not-allowed' : 'text'
                      }}
                    />
                  )
                },
                {
                  title: 'Actual Sales Budget (%)',
                  dataIndex: 'actualSalesBudget',
                  key: 'actualSalesBudget',
                  width: 150,
                  render: (value, record) => {
                    const budgetedSales = parseFloat(record.budgetedSales) || 0;
                    const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                    const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                    
                    // Add dynamic provider sales
                    const providerSales = providers.reduce((sum, provider) => {
                      const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                      return sum + (parseFloat(record[providerKey]) || 0);
                    }, 0);
                    
                    const netSales = actualSalesInStore + actualSalesAppOnline + providerSales;
                    const actualSalesBudget = calculateActualSalesBudget(budgetedSales, netSales);
                    
                    return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>{actualSalesBudget.toFixed(1)}%</Text>;
                  }
                },
                {
                  title: 'Average Daily Ticket',
                  dataIndex: 'averageDailyTicket',
                  key: 'averageDailyTicket',
                  width: 150,
                  render: (value, record) => {
                    const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                    const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                    
                    // Add dynamic provider sales
                    const providerSales = providers.reduce((sum, provider) => {
                      const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                      return sum + (parseFloat(record[providerKey]) || 0);
                    }, 0);
                    
                    const netSales = actualSalesInStore + actualSalesAppOnline + providerSales;
                    const dailyTickets = parseFloat(record.dailyTickets) || 0;
                    const avgDailyTicket = calculateAverageDailyTicket(netSales, dailyTickets);
                    return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>{avgDailyTicket}</Text>;
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
          Sales Performance
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
            title="Weekly Sales Data"
            extra={
              <Space>
                <Button 
                  type="default" 
                  icon={dataNotFound || areAllValuesZero(weeklyData) ? <PlusOutlined /> : <EditOutlined />}
                  onClick={dataNotFound || areAllValuesZero(weeklyData) ? showAddWeeklyModal : () => showEditWeeklyModal(weeklyData[0])}
                  disabled={!selectedDate}
                >
                  {dataNotFound || areAllValuesZero(weeklyData) ? "Add Weekly Sales" : "Edit Weekly Sales"}
                </Button>
              </Space>
            }
          >
              {dataNotFound || areAllValuesZero(weeklyData) ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No sales data found for the selected period."
                  className="py-8"
                />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }} size="large" className="w-full">
                                     {weeklyData.map((week) => {
                     return (
                                             <Card 
                         key={week.id || `week-${week.weekTitle}`} 
                         size="small" 
                         title={
                           <div className="flex items-center justify-between">
                             <span>Weekly Sales Data</span>
                             {week.dailyData && (
                               <span className="text-xs text-gray-500">
                                 {week.dailyData.filter(day => day.restaurant_open === 0).length} of 7 days closed
                               </span>
                             )}
                           </div>
                         }
                       >
                        <div className="overflow-x-auto">
                          <Table
                            dataSource={week.dailyData || []}
                            pagination={false}
                            size="small"
                                                         rowKey={(record) => record.key || `day-${record.date?.format('YYYY-MM-DD')}`}
                             scroll={{ x: 'max-content' }}
                             rowClassName={(record) => isDayClosed(record) ? 'opacity-50 bg-gray-50' : ''}
                            summary={(pageData) => {
                              const totals = pageData.reduce((acc, record) => {
                                acc.budgetedSales += parseFloat(record.budgetedSales) || 0;
                                acc.actualSalesInStore += parseFloat(record.actualSalesInStore) || 0;
                                acc.actualSalesAppOnline += parseFloat(record.actualSalesAppOnline) || 0;
                                acc.dailyTickets += parseFloat(record.dailyTickets) || 0;
                                acc.averageDailyTicket += parseFloat(record.averageDailyTicket) || 0;
                                
                                // Add dynamic provider totals
                                providers.forEach(provider => {
                                  const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                                  if (!acc[providerKey]) acc[providerKey] = 0;
                                  acc[providerKey] += parseFloat(record[providerKey]) || 0;
                                });
                                
                                return acc;
                              }, {
                                budgetedSales: 0,
                                actualSalesInStore: 0,
                                actualSalesAppOnline: 0,
                                dailyTickets: 0,
                                averageDailyTicket: 0,
                                ...providers.reduce((acc, provider) => {
                                  const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                                  acc[providerKey] = 0;
                                  return acc;
                                }, {})
                              });

                              // Calculate net sales actual total (including dynamic providers)
                              const allSalesFields = ['actualSalesInStore', 'actualSalesAppOnline'];
                              providers.forEach(provider => {
                                const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                                allSalesFields.push(providerKey);
                              });
                              const netSalesActualTotal = allSalesFields.reduce((sum, field) => sum + totals[field], 0);

                              return (
                                <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                                  <Table.Summary.Cell index={0}>
                                    <Text strong style={{ color: '#1890ff' }}>TOTAL</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={1}>
                                    <Text strong style={{ color: '#1890ff' }}>-</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={2}>
                                    <Text strong style={{ color: '#1890ff' }}>${totals.budgetedSales.toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={3}>
                                    <Text strong style={{ color: '#1890ff' }}>${totals.actualSalesInStore.toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={4}>
                                    <Text strong style={{ color: '#1890ff' }}>${totals.actualSalesAppOnline.toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  {/* Dynamic Provider Summary Cells */}
                                  {providers.map((provider, index) => {
                                    const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                                    return (
                                      <Table.Summary.Cell key={providerKey} index={5 + index}>
                                        <Text strong style={{ color: '#1890ff' }}>${totals[providerKey]?.toFixed(2) || '0.00'}</Text>
                                      </Table.Summary.Cell>
                                    );
                                  })}
                                  <Table.Summary.Cell index={5 + providers.length}>
                                    <Text strong style={{ color: '#1890ff' }}>${netSalesActualTotal.toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={6 + providers.length}>
                                    <Text strong style={{ color: '#1890ff' }}>{totals.dailyTickets.toFixed(0)}</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={7 + providers.length}>
                                    <Text strong style={{ color: '#1890ff' }}>
                                      {totals.budgetedSales > 0 && netSalesActualTotal > 0 
                                        ? calculateActualSalesBudget(totals.budgetedSales, netSalesActualTotal).toFixed(1) 
                                        : '0.0'}%
                                    </Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={8 + providers.length}>
                                    <Text strong style={{ color: '#1890ff' }}>
                                      {totals.dailyTickets > 0 
                                        ? calculateAverageDailyTicket(netSalesActualTotal, totals.dailyTickets) 
                                        : 0}
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
                                     <div className="font-medium flex items-center gap-2">
                                       {text}
                                       {record.restaurant_open === 0 && (
                                         <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                           CLOSED
                                         </span>
                                       )}
                                     </div>
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
                              // Dynamic Provider Columns
                              ...providers.map(provider => ({
                                title: `Actual Sales - ${provider.provider_name}`,
                                dataIndex: `actualSales${provider.provider_name.replace(/\s+/g, '')}`,
                                key: `actualSales${provider.provider_name.replace(/\s+/g, '')}`,
                                width: 150,
                                render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${(parseFloat(value) || 0).toFixed(2)}</Text>
                              })),
                              {
                                title: 'Net Sales - Actual (Auto-calculated)',
                                dataIndex: 'netSalesActual',
                                key: 'netSalesActual',
                                width: 150,
                                render: (value, record) => {
                                  // Calculate the sum of actual sales for this day (including dynamic providers)
                                  const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                                  const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                                  
                                  // Add dynamic provider sales
                                  const providerSales = providers.reduce((sum, provider) => {
                                    const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                                    return sum + (parseFloat(record[providerKey]) || 0);
                                  }, 0);
                                  
                                  const calculatedNetSales = actualSalesInStore + actualSalesAppOnline + providerSales;
                                  
                                  return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${calculatedNetSales.toFixed(2)}</Text>;
                                }
                              },
                              {
                                title: '# Daily Tickets',
                                dataIndex: 'dailyTickets',
                                key: 'dailyTickets',
                                width: 150,
                                render: (value) => <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>{(parseFloat(value) || 0).toFixed(0)}</Text>
                              },
                              {
                                title: 'Actual Sales Budget (%)',
                                dataIndex: 'actualSalesBudget',
                                key: 'actualSalesBudget',
                                width: 150,
                                render: (value, record) => {
                                  const budgetedSales = parseFloat(record.budgetedSales) || 0;
                                  const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                                  const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                                  
                                  // Add dynamic provider sales
                                  const providerSales = providers.reduce((sum, provider) => {
                                    const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                                    return sum + (parseFloat(record[providerKey]) || 0);
                                  }, 0);
                                  
                                  const netSales = actualSalesInStore + actualSalesAppOnline + providerSales;
                                  const actualSalesBudget = calculateActualSalesBudget(budgetedSales, netSales);
                                  
                                  return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>{actualSalesBudget.toFixed(1)}%</Text>;
                                }
                              },
                              {
                                title: 'Average Daily Ticket',
                                dataIndex: 'averageDailyTicket',
                                key: 'averageDailyTicket',
                                width: 150,
                                render: (value, record) => {
                                  const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                                  const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                                  
                                  // Add dynamic provider sales
                                  const providerSales = providers.reduce((sum, provider) => {
                                    const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                                    return sum + (parseFloat(record[providerKey]) || 0);
                                  }, 0);
                                  
                                  const netSales = actualSalesInStore + actualSalesAppOnline + providerSales;
                                  const dailyTickets = parseFloat(record.dailyTickets) || 0;
                                  const avgDailyTicket = calculateAverageDailyTicket(netSales, dailyTickets);
                                  return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>{avgDailyTicket}</Text>;
                                }
                              }
                            ]}
                          />
                        </div>
                      </Card>
                    );
                  })}
                </Space>
              )}
            </Card>
          </Col>
            {/* Weekly Goals Section */}
        <Col xs={24} sm={24} md={24} lg={6} xl={6}>
          <Card title="Weekly Sales Goals" className="h-fit">
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
                    value={`$${(weeklyGoals.salesBudget || 0).toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>Actual Sales - In Store:</Text>
                  <Input
                    value={`$${(weeklyGoals.actualSalesInStore || 0).toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>Actual Sales - App / On Line:</Text>
                  <Input
                    value={`$${(weeklyGoals.actualSalesAppOnline || 0).toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                {/* Dynamic Provider Fields */}
                {providers.map((provider) => (
                  <div key={provider.provider_name}>
                    <Text strong>Actual Sales - {provider.provider_name}:</Text>
                    <Input
                      value={`$${(weeklyGoals[`actualSales${provider.provider_name.replace(/\s+/g, '')}`] || 0).toFixed(2)}`}
                      className="mt-1"
                      disabled
                      style={{ backgroundColor: '#f5f5f5' }}
                    />
                  </div>
                ))}
                
                <div>
                  <Text strong>Net Sales - Actual:</Text>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    (Auto-calculated: In Store + App/Online + Providers)
                  </Text>
                  <Input
                    value={(() => {
                      const baseSales = weeklyGoals.actualSalesInStore + weeklyGoals.actualSalesAppOnline;
                      const providerSales = providers.reduce((sum, provider) => {
                        const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                        return sum + (weeklyGoals[providerKey] || 0);
                      }, 0);
                      return baseSales + providerSales;
                    })()}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                    prefix="$"
                  />
                </div>
                
                <div>
                  <Text strong>% Actual vs Budgeted Sales:</Text>
                  <Input
                    value={weeklyGoals.actualVsBudgetSales || 0}
                    className="mt-1"
                    disabled
                    style={{ 
                      color: (weeklyGoals.actualVsBudgetSales || 0) < 0 ? '#ff4d4f' : '#52c41a',
                      backgroundColor: '#f5f5f5'
                    }}
                    prefix="%"
                  />
                </div>
                
                <div>
                  <Text strong># Daily Tickets:</Text>
                  <Input
                    value={weeklyGoals.dailyTickets || 0}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#f5f5f5' }}
                  />
                </div>
                
                <div>
                  <Text strong>Average Daily Ticket:</Text>
                  <Input
                    value={`$${(weeklyGoals.averageDailyTicket || 0).toFixed(2)}`}
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

export default SalesTable;
