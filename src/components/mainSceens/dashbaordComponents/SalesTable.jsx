import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Input, Table, Card, Row, Col, Typography, Space, message, Empty, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DollarOutlined, ExclamationCircleOutlined, CalendarOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);
import useStore from '../../../store/store';
import LoadingSpinner from '../../layout/LoadingSpinner';
import ToggleSwitch from '../../buttons/ToggleSwitch';
import { CalendarHelpers } from '../../../utils/CalendarHelpers';
import { useGuidance } from '../../../contexts/GuidanceContext';
const { Title, Text } = Typography;

const SalesTable = ({ selectedDate, selectedYear, selectedMonth, weekDays = [], dashboardData = null, refreshDashboardData = null, dashboardLoading = false }) => {
  // Guidance hook for data guidance
  const { startDataGuidance, hasSeenDataGuidance, isDataGuidanceActive } = useGuidance();
  
  // Store integration
  const {
    saveDashboardData,
    loading: storeLoading,
    error: storeError,
    completeOnboardingData,
    restaurantGoals,
    getRestaurentGoal,
    checkWeeklyAverageData,
    submitWeeklyAverageData,
    weeklyAverageLoading
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

  // Function to check if a day should be closed based on restaurant goals
  const shouldDayBeClosed = (dayName) => {
    if (!restaurantGoals || !restaurantGoals.restaurant_days) {
      return false; // Default to open if no goals data
    }

    // dayjs format('dddd') returns full day names like "Sunday", "Monday"
    // restaurant_days array contains capitalized day names like "Sunday", "Monday"
    // So we can compare directly without additional formatting

    // Check if this day is IN the restaurant_days array
    // If it's in the array, it means the restaurant is CLOSED on that day
    // If it's NOT in the array, it means the restaurant is OPEN on that day
    return restaurantGoals.restaurant_days.includes(dayName);
  };

  // Function to fetch restaurant goals if not already available
  const fetchRestaurantGoals = async () => {
    try {
      if (!restaurantGoals) {
        await getRestaurentGoal();
      }
    } catch (error) {
      console.error('Error fetching restaurant goals:', error);
    }
  };

  // Fetch restaurant goals on component mount
  useEffect(() => {
    fetchRestaurantGoals();
  }, []);

  // Refetch restaurant goals when needed and reprocess data
  useEffect(() => {
    if (restaurantGoals && dashboardData) {
      // When restaurant goals are available, reprocess the dashboard data
      // to apply the restaurant days settings
      processDashboardData();
    }
  }, [restaurantGoals]);

  const [weeklyGoals, setWeeklyGoals] = useState({
    budgetedSales: 0,
    actualSalesInStore: 0,
    actualSalesAppOnline: 0,
    netSalesActual: 0,
    actualVsBudgetSales: 0,
    dailyTickets: 0,
    averageDailyTicket: 0,
    // Dynamic provider fields will be added here
  });

  // Separate state for weekly totals (calculated from daily data)
  const [weeklyTotals, setWeeklyTotals] = useState({
    budgetedSales: 0,
    actualSalesInStore: 0,
    actualSalesAppOnline: 0,
    netSalesActual: 0,
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
  
  // Weekly average modal states
  const [isWeeklyAverageDataPopupVisible, setIsWeeklyAverageDataPopupVisible] = useState(false);
  const [weeklyAveragePopupData, setWeeklyAveragePopupData] = useState(null);
  const weeklyAverageModalShown = useRef(null);
  const [isAutoAverageLoading, setIsAutoAverageLoading] = useState(false);
  
  // Week warning modal states
  const [showWeekWarningModal, setShowWeekWarningModal] = useState(false);
  const [weekWarningData, setWeekWarningData] = useState(null);
  const [pendingModalAction, setPendingModalAction] = useState(null); // Store the action to execute after warning
  const [pendingActionType, setPendingActionType] = useState(null); // Store whether it's 'add' or 'edit'

  // Process dashboard data when it changes
  useEffect(() => {
    if (dashboardData) {
      processDashboardData();
    } else {
      // Reset data when no dashboard data is available
      setWeeklyData([]);
      setWeeklyGoals({
        budgetedSales: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,
        netSalesActual: 0,
        dailyTickets: 0,
        averageDailyTicket: 0
      });
      setWeeklyTotals({
        budgetedSales: 0,
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

  // Ref to track if data guidance has been triggered for current data
  const dataGuidanceTriggeredRef = useRef(false);
  const lastWeeklyDataRef = useRef(null);

  // Ref to track if data guidance has been triggered when modal opens
  const modalDataGuidanceTriggeredRef = useRef(false);
  
  // Reset trigger ref if data guidance should be shown but isn't active
  useEffect(() => {
    const hasData = weeklyData.length > 0 && !areAllValuesZero(weeklyData);
    const shouldShowGuidance = hasData && 
      (hasSeenDataGuidance === false || hasSeenDataGuidance === null) &&
      !isModalVisible;
    
    if (shouldShowGuidance && !isDataGuidanceActive && dataGuidanceTriggeredRef.current) {
      const checkTimer = setTimeout(() => {
        if (!isDataGuidanceActive) {
          dataGuidanceTriggeredRef.current = false;
        }
      }, 8000);
      return () => clearTimeout(checkTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataGuidanceActive, weeklyData, hasSeenDataGuidance, isModalVisible]);

  // Trigger data guidance when modal opens and data exists
  useEffect(() => {
    if (isModalVisible) {
      dataGuidanceTriggeredRef.current = false;
    }
    
    if (
      isModalVisible &&
      weeklyData.length > 0 && 
      !areAllValuesZero(weeklyData) &&
      (hasSeenDataGuidance === false || hasSeenDataGuidance === null) &&
      !modalDataGuidanceTriggeredRef.current
    ) {
      modalDataGuidanceTriggeredRef.current = true;
      
      const timer = setTimeout(async () => {
        await startDataGuidance(false, true);
        setTimeout(() => {
          if (!isDataGuidanceActive) {
            modalDataGuidanceTriggeredRef.current = false;
          }
        }, 8000); // Increased timeout to allow more time for modal elements to render
      }, 2500); // Increased delay to ensure modal content is fully rendered
      return () => clearTimeout(timer);
    } else if (!isModalVisible) {
      modalDataGuidanceTriggeredRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalVisible, weeklyData, hasSeenDataGuidance, isDataGuidanceActive]);

  // Trigger data guidance when data is present and user hasn't seen it (for non-modal elements)
  useEffect(() => {
    const hasData = weeklyData.length > 0 && !areAllValuesZero(weeklyData);
    const weeklyDataKey = JSON.stringify(weeklyData);
    const dataChanged = lastWeeklyDataRef.current !== weeklyDataKey && lastWeeklyDataRef.current !== null;
    
    if (
      hasData && 
      (hasSeenDataGuidance === false || hasSeenDataGuidance === null) &&
      !isModalVisible &&
      (!dataGuidanceTriggeredRef.current || dataChanged)
    ) {
      dataGuidanceTriggeredRef.current = true;
      lastWeeklyDataRef.current = weeklyDataKey;
      
      const timer = setTimeout(async () => {
        await startDataGuidance(false, true);
        setTimeout(() => {
          if (!isDataGuidanceActive) {
            dataGuidanceTriggeredRef.current = false;
          }
        }, 5000);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (!hasData || hasSeenDataGuidance === true) {
      dataGuidanceTriggeredRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyData, hasSeenDataGuidance, isModalVisible, isDataGuidanceActive]);

  // Handle navigation context from Summary Dashboard - Auto-open sales modal
  useEffect(() => {
    const navigationContext = localStorage.getItem('dashboardNavigationContext');

    if (navigationContext) {
      try {
        const context = JSON.parse(navigationContext);

        // Check if this navigation came from Summary Dashboard and should open sales modal
        if (context.source === 'summary-dashboard' && context.shouldOpenSalesModal) {

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
        const dailyTickets = ensureWholeNumberTickets(day.dailyTickets);
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

  // Helper function to calculate average daily ticket with decimal precision
  const calculateAverageDailyTicket = (netSales, dailyTickets) => {
    if (dailyTickets === 0) return 0;
    return Math.round(netSales / dailyTickets);
  };

  // Helper function to ensure daily tickets are always whole numbers
  // Daily tickets represent actual customer count and cannot be fractional
  const ensureWholeNumberTickets = (value) => {
    return Math.round(parseFloat(value) || 0);
  };

  // Helper function to handle daily tickets input change with validation
  const handleDailyTicketsChange = (value, setterFunction) => {
    // Remove any non-numeric characters except for the minus sign
    const cleanValue = value.toString().replace(/[^0-9]/g, '');
    const wholeNumber = parseInt(cleanValue) || 0;
    setterFunction(wholeNumber);
  };

  // Helper function to validate daily tickets input
  const validateDailyTicketsInput = (value) => {
    if (value === '' || value === null || value === undefined) return true;
    const numValue = parseFloat(value);
    return Number.isInteger(numValue) && numValue >= 0;
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
            sales_budget: Math.round(weeklyGoals.budgetedSales || 0),
            actual_sales_in_store: Math.round(weeklyGoals.actualSalesInStore || 0),
            actual_sales_app_online: Math.round(weeklyGoals.actualSalesAppOnline || 0),
            net_sales_actual: Math.round(weeklyGoals.netSalesActual || 0),
            actual_vs_budget_sales: (weeklyGoals.actualVsBudgetSales || 0),
            daily_tickets: ensureWholeNumberTickets(weeklyGoals.dailyTickets),
            average_daily_ticket: Math.round(weeklyGoals.averageDailyTicket || 0),
            // Add dynamic provider fields to weekly data
            ...providers.reduce((acc, provider) => {
              const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
              acc[`actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`] = Math.round(weeklyGoals[providerKey] || 0);
              return acc;
            }, {})
          },
          daily: currentWeekData.dailyData.map(day => {
            const dailyData = {
              date: day.date.format('YYYY-MM-DD'),
              day: day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1),
              sales_budget: Math.round(parseFloat(day.budgetedSales) || 0),
              actual_sales_in_store: Math.round(parseFloat(day.actualSalesInStore) || 0),
              actual_sales_app_online: Math.round(parseFloat(day.actualSalesAppOnline) || 0),
              daily_tickets: ensureWholeNumberTickets(day.dailyTickets),
              average_daily_ticket: Math.round(parseFloat(day.averageDailyTicket) || 0),
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
                acc[`actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`] = Math.round(parseFloat(day[providerKey]) || 0);
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
            dailyData.net_sales_actual = Math.round(baseSales + providerSales);

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
        budgetedSales: parseFloat(salesPerformance.sales_budget) || 0,
        actualSalesInStore: parseFloat(salesPerformance.actual_sales_in_store) || 0,
        actualSalesAppOnline: parseFloat(salesPerformance.actual_sales_app_online) || 0,
        netSalesActual: parseFloat(salesPerformance.net_sales_actual) || 0,
        actualVsBudgetSales: parseFloat(salesPerformance.actual_vs_budget_sales) || 0,
        dailyTickets: ensureWholeNumberTickets(salesPerformance.daily_tickets),
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
        dayName: dayjs(entry.date).format('dddd'),
        budgetedSales: entry['Sales Performance']?.sales_budget || 0,
        actualSalesInStore: entry['Sales Performance']?.actual_sales_in_store || 0,
        actualSalesAppOnline: entry['Sales Performance']?.actual_sales_app_online || 0,
        actualVsBudgetSales: entry['Sales Performance']?.actual_vs_budget_sales || 0,
        dailyTickets: ensureWholeNumberTickets(entry['Sales Performance']?.daily_tickets),
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
          dayName: day.dayName,
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

            // Check restaurant goals to determine if this day should be closed
            const shouldBeClosed = shouldDayBeClosed(day.dayName);
            return shouldBeClosed ? 0 : 1; // 0 for closed, 1 for open
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
      weekTitle: 'Actual Weekly Sales ',
      startDate: weekStartDate,
      dailyData: dailyData
    }]);

    // Calculate weekly totals from daily data
    if (dailyData.length > 0) {
      const calculatedTotals = dailyData.reduce((acc, record) => {
        acc.budgetedSales += parseFloat(record.budgetedSales) || 0;
        acc.actualSalesInStore += parseFloat(record.actualSalesInStore) || 0;
        acc.actualSalesAppOnline += parseFloat(record.actualSalesAppOnline) || 0;
        acc.dailyTickets += ensureWholeNumberTickets(record.dailyTickets);

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
      calculatedTotals.netSalesActual = allSalesFields.reduce((sum, field) => sum + calculatedTotals[field], 0);

      // Calculate average daily ticket
      calculatedTotals.averageDailyTicket = calculatedTotals.dailyTickets > 0
        ? calculateAverageDailyTicket(calculatedTotals.netSalesActual, calculatedTotals.dailyTickets)
        : 0;

      setWeeklyTotals(calculatedTotals);
    }
  };





  // Helper function to check week status and show warning if needed
  const checkWeekStatusAndShowWarning = (weekStartDate, onConfirm, actionType = 'add') => {
    if (!weekStartDate) {
      message.warning('Please select a date first.');
      return;
    }
    
    const weekStatus = CalendarHelpers.getWeekStatus(weekStartDate);
    
    // If it's not the current week, show warning modal
    if (!weekStatus.isCurrentWeek) {
      setWeekWarningData({
        isPastWeek: weekStatus.isPastWeek,
        isFutureWeek: weekStatus.isFutureWeek,
        weekStart: weekStatus.weekStart,
        weekEnd: weekStatus.weekEnd,
        currentWeekStart: weekStatus.currentWeekStart,
        currentWeekEnd: weekStatus.currentWeekEnd,
        daysDifference: weekStatus.daysDifference
      });
      setPendingModalAction(() => onConfirm);
      setPendingActionType(actionType);
      setShowWeekWarningModal(true);
    } else {
      // Current week - proceed directly
      onConfirm();
    }
  };

  // Handle weekly data modal - Directly open modal without checking for weekly average data
  const showAddWeeklyModal = async () => {
    if (!selectedDate) {
      message.warning('Please select a date first.');
      return;
    }
    
    const weekStartDate = weekDays.length > 0 ? weekDays[0].date : selectedDate;
    
    // Check week status and show warning if needed
    checkWeekStatusAndShowWarning(weekStartDate, () => {
      setEditingWeek(null);
      setIsEditMode(false);
      setIsModalVisible(true);
    });
  };

  const showEditWeeklyModal = (weekData) => {
    // Get week start date from weekData or selectedDate
    const weekStartDate = weekData?.startDate || 
                         (weekDays.length > 0 ? weekDays[0].date : selectedDate);
    
    // Check week status and show warning if needed
    checkWeekStatusAndShowWarning(weekStartDate, () => {
      setEditingWeek(weekData);
      setIsEditMode(true);
      setIsModalVisible(true);
    }, 'edit');
  };
  
  // Handle week warning modal confirmation
  const handleWeekWarningConfirm = () => {
    setShowWeekWarningModal(false);
    if (pendingModalAction) {
      pendingModalAction();
      setPendingModalAction(null);
    }
    setPendingActionType(null);
    setWeekWarningData(null);
  };
  
  // Handle week warning modal cancellation
  const handleWeekWarningCancel = () => {
    setShowWeekWarningModal(false);
    setPendingModalAction(null);
    setPendingActionType(null);
    setWeekWarningData(null);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingWeek(null);
    setIsEditMode(false);
  };

  // Handle weekly average data popup actions
  const handleAutoAverage = async () => {
    try {
      if (selectedDate) {
        const weekStartDate = dayjs(selectedDate).startOf('week');
        const startDate = weekStartDate.format('YYYY-MM-DD');
        const endDate = weekStartDate.endOf('week').format('YYYY-MM-DD');
        const dateRangeKey = `${startDate}-${endDate}`;
        
        // Set loading state
        setIsAutoAverageLoading(true);
        
        // Close modal immediately to prevent duplicate clicks
        setIsWeeklyAverageDataPopupVisible(false);
        
        // Submit the previous 3 weeks data via POST API (same endpoint)
        const response = await submitWeeklyAverageData(null, startDate, endDate, {
          use_previous_data: true
        });
        
        // Check if API response indicates success
        // API response format: {"message": "Processed 1 weekly entries.", "entries": [...]}
        const isSuccess = response && 
                         (response.message?.includes('Processed') || 
                          response.entries?.length > 0);
        
        if (isSuccess && response.entries && response.entries.length > 0) {
          // Extract week_start from the response
          const createdEntry = response.entries[0];
          const responseWeekStart = createdEntry.week_start;
          
          // Mark as shown so it doesn't show again
          weeklyAverageModalShown.current = dateRangeKey;
          
          message.success('Previous 3 weeks data applied successfully! 🎉');
          
          // Wait a moment for the backend to process, then fetch the dashboard data for the created week
          setTimeout(async () => {
            // If we have the week_start from response, refresh with that specific week
            if (responseWeekStart && refreshDashboardData) {
              // Give backend a moment to fully process the data
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Refresh dashboard data multiple times to ensure data is loaded
              await refreshDashboardData();
              
              // Wait a bit more and refresh again
              await new Promise(resolve => setTimeout(resolve, 300));
              await refreshDashboardData();
              
              // One more refresh to be sure
              await new Promise(resolve => setTimeout(resolve, 200));
              await refreshDashboardData();
            } else if (refreshDashboardData) {
              // Fallback: refresh with current selected date
              await refreshDashboardData();
            }
            
            // Open the sales modal to show the auto-filled data
            setEditingWeek(null);
            setIsEditMode(false);
            setIsModalVisible(true);
            
            // Clear loading state after data is populated
            setIsAutoAverageLoading(false);
          }, 800);
        } else {
          throw new Error('Unexpected response format');
        }
      }
    } catch (error) {
      console.error('Error using auto average:', error);
      message.error('Failed to apply previous data. Please try again.');
      // Clear loading state on error
      setIsAutoAverageLoading(false);
      // Re-open modal on error so user can try again
      setIsWeeklyAverageDataPopupVisible(true);
    }
  };

  const handleManualEntry = () => {
    setIsWeeklyAverageDataPopupVisible(false);
    
    // Directly open sales modal for manual entry
    setEditingWeek(null);
    setIsEditMode(false);
    setIsModalVisible(true);
  };

  const handleCloseWeeklyAverageDataPopup = () => {
    setIsWeeklyAverageDataPopupVisible(false);
    // Return to week selection state without making changes
    setWeeklyAveragePopupData(null);
    // Clear loading state if modal is closed
    setIsAutoAverageLoading(false);
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

      // Update weekly totals from the modal data (this will update the right sidebar)
      if (weekData.weeklyTotals) {
        setWeeklyTotals({
          budgetedSales: weekData.weeklyTotals.budgetedSales || 0,
          actualSalesInStore: weekData.weeklyTotals.actualSalesInStore || 0,
          actualSalesAppOnline: weekData.weeklyTotals.actualSalesAppOnline || 0,
          netSalesActual: weekData.weeklyTotals.netSalesActual || 0,
          dailyTickets: weekData.weeklyTotals.dailyTickets || 0,
          averageDailyTicket: weekData.weeklyTotals.averageDailyTicket || 0,
          ...providers.reduce((acc, provider) => {
            const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
            acc[providerKey] = weekData.weeklyTotals[providerKey] || 0;
            return acc;
          }, {})
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
        budgetedSales: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,
        netSalesActual: 0,
        dailyTickets: 0,
        averageDailyTicket: 0
      };

      // Calculate final totals for this week
      const finalTotals = {
        budgetedSales: weeklyTotals.budgetedSales,
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
            sales_budget: Math.round(finalTotals.budgetedSales),
            actual_sales_in_store: Math.round(finalTotals.actualSalesInStore),
            actual_sales_app_online: Math.round(finalTotals.actualSalesAppOnline),
            net_sales_actual: Math.round(finalTotals.netSalesActual),
            actual_vs_budget_sales: finalTotals.actualVsBudgetSales || 0,
            daily_tickets: finalTotals.dailyTickets || 0,
            average_daily_ticket: Math.round(finalTotals.averageDailyTicket || 0),
            // Add dynamic provider fields to weekly data
            ...providers.reduce((acc, provider) => {
              const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
              acc[`actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`] = Math.round(finalTotals[providerKey] || 0);
              return acc;
            }, {})
          },
          daily: weekData.dailyData.map(day => {
            const dailyData = {
              date: day.date.format('YYYY-MM-DD'),
              day: day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1), // Capitalize first letter
              sales_budget: Math.round(parseFloat(day.budgetedSales) || 0),
              actual_sales_in_store: Math.round(parseFloat(day.actualSalesInStore) || 0),
              actual_sales_app_online: Math.round(parseFloat(day.actualSalesAppOnline) || 0),
              daily_tickets: ensureWholeNumberTickets(day.dailyTickets),
              average_daily_ticket: Math.round(parseFloat(day.averageDailyTicket) || 0),
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
                acc[`actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`] = Math.round(parseFloat(day[providerKey]) || 0);
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
            dailyData.net_sales_actual = Math.round(baseSales + providerSales);

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
            Would you like to add Any COGS (Cost Of Goods Sold) Invoices?
            </p>
          </div>
        ),
        okText: 'Yes, Add COGS Invoices',
        cancelText: 'No, Later',
        okType: 'primary',
        onOk: () => {
          // Close the sales modal first
          setIsModalVisible(false);
          setEditingWeek(null);
          setIsEditMode(false);


          // Trigger COGS modal opening by dispatching a custom event
          const weekStartDate = weekDays.length > 0 ? weekDays[0].date.format('YYYY-MM-DD') : selectedDate ? selectedDate.format('YYYY-MM-DD') : selectedYear && selectedMonth ? dayjs(`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`).format('YYYY-MM-DD') : null;

          const event = new CustomEvent('openCogsModal', {
            detail: {
              weekStartDate: weekStartDate
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

      // Trigger data guidance after data is saved (if user hasn't seen it yet)
      if (hasSeenDataGuidance === false || hasSeenDataGuidance === null) {
        // Reset trigger refs to allow guidance to show again after data is added
        dataGuidanceTriggeredRef.current = false;
        modalDataGuidanceTriggeredRef.current = false;
        lastWeeklyDataRef.current = null;
        
        setTimeout(() => {
          startDataGuidance(false, true);
        }, 2000); // Increased delay to ensure DOM is ready
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
      const dayName = currentDate.format('dddd');

      // Check restaurant goals to determine if this day should be closed
      const shouldBeClosed = shouldDayBeClosed(dayName);

      const dayData = {
        key: `day-${currentDate.format('YYYY-MM-DD')}`,
        date: currentDate,
        dayName: dayName,
        budgetedSales: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,
        dailyTickets: 0,
        averageDailyTicket: 0,
        restaurant_open: shouldBeClosed ? 0 : 1 // Use restaurant goals to set open/closed status
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
        budgetedSales: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,
        dailyTickets: 0,
        averageDailyTicket: 0,
        netSalesActual: 0,
        // Dynamic provider fields will be added here
      }
    });

    // Flag to prevent showing the message multiple times
    const [hasShownRestaurantDaysMessage, setHasShownRestaurantDaysMessage] = useState(false);

    // Show message about restaurant days when modal opens (only once per modal session)
    useEffect(() => {
      // Only show message when modal is visible and we haven't shown it yet
      if (isModalVisible &&
        !hasShownRestaurantDaysMessage &&
        restaurantGoals &&
        restaurantGoals.restaurant_days &&
        restaurantGoals.restaurant_days.length > 0 &&
        weekFormData.dailyData.length > 0) {

        const closedDays = weekFormData.dailyData.filter(day => day.restaurant_open === 0);
        if (closedDays.length > 0) {
          const closedDayNames = closedDays.map(day => day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1)).join(', ');
          setHasShownRestaurantDaysMessage(true);
        }
      }

      // Reset flag when modal closes
      if (!isModalVisible) {
        setHasShownRestaurantDaysMessage(false);
      }
    }, [isModalVisible, restaurantGoals, hasShownRestaurantDaysMessage]);

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

        // Calculate weekly totals from daily data
        const calculatedWeeklyTotals = calculateWeeklyTotals(dailyData);

        setWeekFormData({
          ...editingWeek,
          dailyData: dailyData,
          weeklyTotals: calculatedWeeklyTotals
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

        // Calculate weekly totals from daily data
        const calculatedWeeklyTotals = calculateWeeklyTotals(dailyData);

        setWeekFormData({
          weekTitle: `Week ${weeklyData.length + 1}`,
          startDate: weekDays.length > 0 ? weekDays[0].date : selectedDate,
          dailyData: dailyData,
          weeklyTotals: calculatedWeeklyTotals
        });
      }
    }, [editingWeek, weeklyData.length, weekDays, selectedDate, weeklyGoals]);

    // Function to calculate weekly totals from daily data
    const calculateWeeklyTotals = (dailyData) => {
      const totals = dailyData.reduce((acc, record) => {
        acc.budgetedSales += parseFloat(record.budgetedSales) || 0;
        acc.actualSalesInStore += parseFloat(record.actualSalesInStore) || 0;
        acc.actualSalesAppOnline += parseFloat(record.actualSalesAppOnline) || 0;
        acc.dailyTickets += ensureWholeNumberTickets(record.dailyTickets);

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
      totals.netSalesActual = allSalesFields.reduce((sum, field) => sum + totals[field], 0);

      // Calculate average daily ticket
      totals.averageDailyTicket = totals.dailyTickets > 0
        ? calculateAverageDailyTicket(totals.netSalesActual, totals.dailyTickets)
        : 0;

      return totals;
    };

    const handleDailyDataChange = (dayIndex, field, value, record) => {
      // Allow changes to restaurant_open field even when day is closed
      if (isDayClosed(record) && field !== 'restaurant_open') {
        message.warning(`Cannot add data for ${record.dayName} - Restaurant is closed on this day.`);
        return;
      }

      const newDailyData = [...weekFormData.dailyData];
      newDailyData[dayIndex] = { ...newDailyData[dayIndex], [field]: value };

      // Calculate new weekly totals based on updated daily data
      const newWeeklyTotals = calculateWeeklyTotals(newDailyData);

      setWeekFormData({
        ...weekFormData,
        dailyData: newDailyData,
        weeklyTotals: newWeeklyTotals
      });
    };

    const handleSubmit = () => {
      handleWeeklySubmit(weekFormData);
    };

    return (
      <Modal
        title={isEditMode ? "Edit Your Actual Daily Sales " : "Enter Your Actual Daily Sales"}
        open={isModalVisible}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit} loading={isSubmitting || storeLoading}>
            {isEditMode ? 'Update' : 'Add'} Your Daily Sales
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

          {/* Weekly Totals Section - Responsive Grid (Read-only) */}
          <Card title="Weekly Sales Summary" size="small" className='opacity-50 bg-gray-50'>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ">
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Sales Budget:</Text>
                <Input
                  type='number'
                  value={Math.round(weekFormData.weeklyTotals.budgetedSales || 0)}
                  prefix="$"
                  placeholder="0.00"
                  className="w-full"
                  disabled={true}
                  style={{
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed',
                    color: '#1890ff'

                  }}
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Actual Sales - In Store:</Text>
                <Input
                  type='number'
                  value={Math.round(weekFormData.weeklyTotals.actualSalesInStore || 0)}
                  prefix="$"
                  placeholder="0.00"
                  className="w-full"
                  disabled={true}
                  style={{
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed',
                    color: '#1890ff'
                  }}
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Actual Sales - App/Online:</Text>
                <Input
                  type='number'
                  value={Math.round(weekFormData.weeklyTotals.actualSalesAppOnline || 0)}
                  prefix="$"
                  placeholder="0.00"
                  className="w-full opacity-50"
                  disabled={true}
                  style={{
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed',
                    color: '#1890ff55'
                  }}
                />
              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base"># Daily Tickets:</Text>

                <Input
                  type='number'
                  value={weekFormData.weeklyTotals.dailyTickets}
                  placeholder="0"
                  step="1"
                  min="0"
                  pattern="[0-9]*"
                  className="w-full"
                  disabled={true}
                  style={{
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed',
                    color: '#1890ff'
                  }}
                />

              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Net Sales - Actual (Auto-calculated)</Text>
                <Input
                  type='number'
                  value={Math.round(weekFormData.weeklyTotals.netSalesActual || 0)}
                  prefix="$"
                  placeholder="0.00"
                  className="w-full"
                  disabled={true}
                  style={{
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed',
                    color: '#1890ff'
                  }}
                />

              </div>
              <div className="w-full">
                <Text strong className="text-sm sm:text-base">Average Daily Ticket ($):</Text>
                <Input
                  type='number'
                  value={Math.round(weekFormData.weeklyTotals.averageDailyTicket || 0)}
                  prefix="$"
                  placeholder="0.00"
                  className="w-full"
                  disabled={true}
                  style={{
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed',
                    color: '#1890ff'
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Dynamic Provider Fields - Responsive Grid (Read-only) */}
          {providers.length > 0 && (
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border p-2 rounded-md bg-gray-50 opacity-50">
              {providers.map((provider) => (
                <div key={provider.provider_name} className="w-full">
                  <Text strong className="text-sm sm:text-base">Actual Sales - {provider.provider_name}:</Text>
                  <Input
                    type='number'
                    value={weekFormData.weeklyTotals[`actualSales${provider.provider_name.replace(/\s+/g, '')}`] || 0}
                    prefix="$"
                    placeholder="0.00"
                    className="w-full"
                    disabled={true}
                    style={{
                      backgroundColor: '#f5f5f5',
                      cursor: 'not-allowed',
                      color: '#1890ff'
                    }}
                  />
                </div>
              ))}
            </div>
          )}



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
                  acc.dailyTickets += ensureWholeNumberTickets(record.dailyTickets);
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
                      <Text strong style={{ color: '#1890ff' }}>${Math.round(totals.budgetedSales)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Text strong style={{ color: '#1890ff' }}>${Math.round(totals.actualSalesInStore)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <Text strong style={{ color: '#1890ff' }}>${Math.round(totals.actualSalesAppOnline)}</Text>
                    </Table.Summary.Cell>
                    {/* Dynamic Provider Summary Cells */}
                    {providers.map((provider, index) => {
                      const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                      return (
                        <Table.Summary.Cell key={providerKey} index={5 + index}>
                          <Text strong style={{ color: '#1890ff' }}>${Math.round(totals[providerKey] || 0)}</Text>
                        </Table.Summary.Cell>
                      );
                    })}
                    <Table.Summary.Cell index={5 + providers.length}>
                      <Text strong style={{ color: '#1890ff' }}>${Math.round(netSalesActualTotal)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6 + providers.length}>
                      <Text strong style={{ color: '#1890ff' }}>{Math.round(totals.dailyTickets)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7 + providers.length}>
                      <Text strong style={{ color: '#1890ff' }}>
                        {totals.budgetedSales > 0 && netSalesActualTotal > 0
                          ? Math.round(calculateActualSalesBudget(totals.budgetedSales, netSalesActualTotal))
                          : '0.0'}%
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8 + providers.length}>
                      <Text strong style={{ color: '#1890ff' }}>
                        {totals.dailyTickets > 0
                          ? `$${Math.round(calculateAverageDailyTicket(netSalesActualTotal, totals.dailyTickets))}`
                          : '$0.00'}
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
                  render: (text, record) => {
                    const isAutoClosed = shouldDayBeClosed(record.dayName);
                    return (
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {text}
                          {isDayClosed(record) && (
                            <span className={`text-xs px-2 py-1 rounded ${isAutoClosed
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-red-100 text-red-600'
                              }`}>
                              {isAutoClosed ? 'CLOSED' : 'CLOSED'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {record.date.format('MMM DD, YYYY')}
                        </div>
                      </div>
                    );
                  }
                },
                {
                  title: 'Days',
                  dataIndex: 'restaurant_open',
                  key: 'restaurant_open',
                  width: 100,
                  render: (value, record, index) => (
                    <div className="flex items-center gap-2" data-guidance="close-your-days">
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

                    const calculatedNetSales = actualSalesInStore + actualSalesAppOnline + providerSales;

                    return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${calculatedNetSales.toFixed(2)}</Text>;
                  }
                },
                {
                  title: (
                    <div className="flex items-center gap-2">
                      <span># Daily Tickets</span>

                    </div>
                  ),
                  dataIndex: 'dailyTickets',
                  key: 'dailyTickets',
                  width: 150,
                  render: (value, record, index) => (
                    <div>
                      <Input
                        type='number'
                        value={value}
                        onChange={(e) => handleDailyTicketsChange(e.target.value, (value) => handleDailyDataChange(index, 'dailyTickets', value, record))}
                        onBlur={(e) => {
                          const wholeNumber = ensureWholeNumberTickets(e.target.value);
                          if (wholeNumber !== parseFloat(e.target.value)) {
                            handleDailyDataChange(index, 'dailyTickets', wholeNumber, record);
                          }
                        }}
                        placeholder="0"
                        step="1"
                        min="0"
                        pattern="[0-9]*"
                        className="w-full"
                        disabled={isDayClosed(record)}
                        style={{
                          opacity: isDayClosed(record) ? 0.5 : 1,
                          cursor: isDayClosed(record) ? 'not-allowed' : 'text'
                        }}
                      />


                    </div>
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
                  title: (
                    <div className="flex items-center gap-2">
                      <span>Average Daily Ticket ($)</span>

                    </div>
                  ),
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
                    const dailyTickets = ensureWholeNumberTickets(record.dailyTickets);
                    const avgDailyTicket = calculateAverageDailyTicket(netSales, dailyTickets);
                    return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${avgDailyTicket.toFixed(2)}</Text>;
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
    <div className="w-full" style={{ position: 'relative' }}>
      {/* Loading overlay when auto average is processing or dashboard data is loading */}
      {(isAutoAverageLoading || dashboardLoading || storeLoading) && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          borderRadius: '8px'
        }}>
          <Spin size="large" tip={
            isAutoAverageLoading 
              ? "Applying previous 3 weeks data and loading..." 
              : dashboardLoading || storeLoading
              ? "Loading dashboard data..."
              : "Loading..."
          } />
        </div>
      )}
      
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
        {restaurantGoals && restaurantGoals.restaurant_days && (
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium">Closed Days:</span> {restaurantGoals.restaurant_days.join(', ')}
            <span className="ml-2 text-xs text-gray-500">
              (Days not listed are automatically open)
            </span>
          </div>
        )}
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
            title="Actual Weekly Sales"
            data-guidance="actual-weekly-sales-table"
            extra={
              <Space>
                <Button
                  type="default"
                  icon={dataNotFound || areAllValuesZero(weeklyData) ? <PlusOutlined /> : <EditOutlined />}
                  onClick={dataNotFound || areAllValuesZero(weeklyData) ? showAddWeeklyModal : () => showEditWeeklyModal(weeklyData[0])}
                  disabled={!selectedDate}
                  data-guidance="add-actual-weekly-sales"
                  style={{
                    backgroundColor: "#85d7a2",
                    borderColor: "#5bc783",
                    color: "white !important",
                    fontWeight: '500'
                  }}
                >
                  {dataNotFound || areAllValuesZero(weeklyData) ? "Add Actual Weekly Sales" : "Edit Actual Weekly Sales"}
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
                          <span>Actual Weekly Sales </span>
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
                              acc.dailyTickets += ensureWholeNumberTickets(record.dailyTickets);
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
                                  <Text strong style={{ color: '#1890ff' }}>${Math.round(totals.budgetedSales)}</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2}>
                                  <Text strong style={{ color: '#1890ff' }}>${Math.round(totals.actualSalesInStore)}</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3}>
                                  <Text strong style={{ color: '#1890ff' }}>${Math.round(totals.actualSalesAppOnline)}</Text>
                                </Table.Summary.Cell>
                                {/* Dynamic Provider Summary Cells */}
                                {providers.map((provider, index) => {
                                  const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                                  return (
                                    <Table.Summary.Cell key={providerKey} index={4 + index}>
                                      <Text strong style={{ color: '#1890ff' }}>${Math.round(totals[providerKey] || 0)}</Text>
                                    </Table.Summary.Cell>
                                  );
                                })}
                                <Table.Summary.Cell index={4 + providers.length}>
                                  <Text strong style={{ color: '#1890ff' }}>${Math.round(netSalesActualTotal)}</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={5 + providers.length}>
                                  <Text strong style={{ color: '#1890ff' }}>{Math.round(totals.dailyTickets)}</Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={6 + providers.length}>
                                  <Text strong style={{ color: '#1890ff' }}>
                                    {totals.budgetedSales > 0 && netSalesActualTotal > 0
                                      ? Math.round(calculateActualSalesBudget(totals.budgetedSales, netSalesActualTotal))
                                      : '0.0'}%
                                  </Text>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={7 + providers.length}>
                                  <Text strong style={{ color: '#1890ff' }}>
                                    {totals.dailyTickets > 0
                                      ? `$${Math.round(calculateAverageDailyTicket(netSalesActualTotal, totals.dailyTickets))}`
                                      : '$0.00'}
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
                              render: (text, record) => {
                                const isAutoClosed = shouldDayBeClosed(record.dayName);
                                return (
                                  <div>
                                    <div className="font-medium flex items-center gap-2">
                                      {text}
                                      {record.restaurant_open === 0 && (
                                        <span className={`text-xs px-2 py-1 rounded ${isAutoClosed
                                            ? 'bg-orange-100 text-orange-600'
                                            : 'bg-red-100 text-red-600'
                                          }`}>
                                          {isAutoClosed ? 'CLOSED' : 'CLOSED'}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                      {record.date.format('MMM DD, YYYY')}
                                    </div>
                                  </div>
                                );
                              }
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
                              title: (
                                <div className="flex items-center gap-2">
                                  <span># Daily Tickets</span>

                                </div>
                              ),
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
                              title: (
                                <div className="flex items-center gap-2">
                                  <span>Average Daily Ticket ($)</span>

                                </div>
                              ),
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
                                const dailyTickets = ensureWholeNumberTickets(record.dailyTickets);
                                const avgDailyTicket = calculateAverageDailyTicket(netSales, dailyTickets);
                                return <Text style={{ backgroundColor: '#f0f8ff', padding: '2px 6px', borderRadius: '3px' }}>${avgDailyTicket.toFixed(2)}</Text>;
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
        {/* Weekly Sales Totals Section */}
        <Col xs={24} sm={24} md={24} lg={6} xl={6}>
          <Card title="Actual Weekly Sales Totals" className="h-fit" data-guidance="actual-weekly-sales-totals">
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
                    value={`${(weeklyTotals.budgetedSales || 0).toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#fff7ed', color: '#1890ff' }}
                    prefix="$"
                  />
                </div>

                <div>
                  <Text strong>Actual Sales - In Store:</Text>
                  <Input
                    value={`${(weeklyTotals.actualSalesInStore || 0).toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#fff7ed', color: '#1890ff' }}
                    prefix="$"
                  />
                </div>

                <div>
                  <Text strong>Actual Sales - App / On Line:</Text>
                  <Input
                    value={`${(weeklyTotals.actualSalesAppOnline || 0).toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#fff7ed', color: '#1890ff' }}
                    prefix="$"
                  />
                </div>

                {/* Dynamic Provider Fields */}
                {providers.map((provider) => (
                  <div key={provider.provider_name}>
                    <Text strong>Actual Sales - {provider.provider_name}:</Text>
                    <Input
                      value={`${(weeklyTotals[`actualSales${provider.provider_name.replace(/\s+/g, '')}`] || 0).toFixed(2)}`}
                      className="mt-1"
                      disabled
                      style={{ backgroundColor: '#fff7ed', color: '#1890ff' }}
                      prefix="$"
                    />
                  </div>
                ))}

                <div>
                  <Text strong>Net Sales - Actual:</Text>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    (Calculated: In Store + App/Online + Providers)
                  </Text>
                  <Input
                    value={`${(weeklyTotals.netSalesActual || 0).toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#fff7ed', color: '#1890ff' }}
                    prefix="$"
                  />
                </div>

                <div>
                  <Text strong>Actual vs Budget Sales (% Over/Under):</Text>
                  <Input
                    value={(() => {
                      const budgetedSales = weeklyTotals.budgetedSales || 0;
                      const netSales = weeklyTotals.netSalesActual || 0;
                      if (budgetedSales === 0) return 0;
                      return ((netSales - budgetedSales) / budgetedSales * 100).toFixed(1);
                    })()}
                    className="mt-1"
                    disabled
                    style={{
                      color: (() => {
                        const budgetedSales = weeklyTotals.budgetedSales || 0;
                        const netSales = weeklyTotals.netSalesActual || 0;
                        if (budgetedSales === 0) return '#666';
                        const percentage = ((netSales - budgetedSales) / budgetedSales * 100);
                        return percentage < 0 ? '#ff4d4f' : '#52c41a';
                      })(),
                      backgroundColor: '#fff7ed',
                    }}
                    prefix="%"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Text strong># Daily Tickets:</Text>
                  </div>
                  <Input
                    value={ensureWholeNumberTickets(weeklyTotals.dailyTickets)}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#fff7ed', color: '#1890ff' }}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Text strong>Average Daily Ticket ($)</Text>

                  </div>
                  <Input
                    value={`${(weeklyTotals.averageDailyTicket || 0).toFixed(2)}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#fff7ed', color: '#1890ff' }}
                    prefix="$"
                  />
                </div>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <WeeklyModal />

      {/* Weekly Average Data Popup - Show when 3 weeks data available */}
      <Modal
        title="Weekly Average Data Available"
        open={isWeeklyAverageDataPopupVisible}
        onCancel={handleCloseWeeklyAverageDataPopup}
        footer={[
          <Button
            key="manual"
            onClick={handleManualEntry}
            className="border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200"
          >
            Manual
          </Button>,
          <Button
            key="auto"
            type="primary"
            icon={<DollarOutlined />}
            onClick={handleAutoAverage}
            loading={weeklyAverageLoading || isAutoAverageLoading}
            disabled={weeklyAverageLoading || isAutoAverageLoading}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Auto
          </Button>,
          <Button
            key="close"
            onClick={handleCloseWeeklyAverageDataPopup}
            className="border-gray-300 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200"
          >
            Close
          </Button>
        ]}
        width={600}
        centered
        maskClosable={false}
        destroyOnClose={true}
        zIndex={10000}
        getContainer={false}
        maskStyle={{ zIndex: 9999 }}
        style={{ zIndex: 10000 }}
        className="weekly-average-modal-top"
      >
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-md p-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-blue-800">
                We Found Your Last 3 Weeks of Data
                </h3>
              </div>
              <p className="text-blue-700 text-base leading-relaxed mb-4">
                Good news! Because you've entered your actual sales data for the past 3 weeks, the Auto feature is now active.
              </p>
              <p className="text-yellow-700 text-md leading-relaxed mb-4">When you choose Auto, Growlio will automatically complete your sales budget for the week using your daily averages. You'll still have full control to review and adjust any numbers afterward if needed.</p>
              
              <div className="bg-white rounded-lg p-4 border border-blue-200 mb-4">
                {/* <h4 className="font-semibold text-blue-800 mb-3">Your Options:</h4> */}
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><span className="font-medium">Auto:</span> When you select Auto, Growlio uses your last 3 weeks of sales data by day of the week, averaging all your Mondays, all your Tuesdays, and so on. This trailing 3-week average gives you a more accurate daily sales trend and helps you plan labor and food costs with confidence.</li>
                  <li><span className="font-medium">Manual:</span> Enter all data yourself. A quick warning will appear if it's a future week.</li>
                  <li><span className="font-medium">Close:</span> Return to the week selection screen without making changes.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Week Warning Modal - Show when trying to add/edit data for previous or next week */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-blue-500" />
            <span>Week Selection Confirmation</span>
          </div>
        }
        open={showWeekWarningModal}
        onCancel={handleWeekWarningCancel}
        footer={[
          <Button key="cancel" onClick={handleWeekWarningCancel}>
            Cancel
          </Button>,
          <Button 
            key="proceed" 
            type="primary" 
            onClick={handleWeekWarningConfirm}
            icon={<CalendarOutlined />}
            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
          >
            Yes, Proceed
          </Button>
        ]}
        width={600}
        destroyOnClose={true}
        maskClosable={false}
        zIndex={10001}
        getContainer={false}
        maskStyle={{ zIndex: 10000 }}
        style={{ zIndex: 10001 }}
      >
        {weekWarningData && (
          <div className="text-center">
            <WarningOutlined 
              className="text-6xl mb-4" 
              style={{ fontSize: '64px', color: weekWarningData.isPastWeek ? '#ff4d4f' : '#ff4d4f' }}
            />
            <Title level={4} className="mb-4">
              {weekWarningData.isPastWeek 
                ? `${pendingActionType === 'edit' ? 'Editing' : 'Adding'} Data to Past Week` 
                : `${pendingActionType === 'edit' ? 'Editing' : 'Adding'} Data to Future Week`}
            </Title>
            
            <div className={`p-4 rounded-lg mb-4 ${
              weekWarningData.isPastWeek ? 'bg-red-50 border border-red-200' : 'bg-red-50 border border-red-200'
            }`}>
              <Text strong className={`mb-2 block ${
                weekWarningData.isPastWeek ? 'text-red-700' : 'text-red-700'
              }`}>
                Week Information:
              </Text>
              <div className={`text-sm space-y-1 ${
                weekWarningData.isPastWeek ? 'text-red-600' : 'text-red-600'
              }`}>
                <p>• Selected week: <strong>{weekWarningData.weekStart} - {weekWarningData.weekEnd}</strong></p>
                {weekWarningData.currentWeekStart && weekWarningData.currentWeekEnd && (
                  <p>• Current week: <strong>{weekWarningData.currentWeekStart} - {weekWarningData.currentWeekEnd}</strong></p>
                )}
                <p>• Week difference: <strong>{Math.abs(weekWarningData.daysDifference || 0)} days {weekWarningData.isPastWeek ? 'ago' : 'ahead'}</strong></p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <Text strong className="text-blue-700 mb-2 block">
                {weekWarningData.isPastWeek ? 'Past Week Warning:' : 'Future Week Warning:'}
              </Text>
              <div className="text-sm text-blue-600 space-y-1">
                {weekWarningData.isPastWeek ? (
                  <>
                    <p>• You are {pendingActionType === 'edit' ? 'editing' : 'adding'} sales data to a week that has already passed</p>
                    <p>• This may affect historical reporting and analysis</p>
                    <p>• Make sure you have the correct week selected</p>
                    <p>• Consider if this data should be {pendingActionType === 'edit' ? 'edited' : 'added'} to the current week instead</p>
                  </>
                ) : (
                  <>
                    <p>• You are {pendingActionType === 'edit' ? 'editing' : 'adding'} sales data to a future week</p>
                    <p>• This is typically used for planning and forecasting</p>
                    <p>• Make sure you have the correct week selected</p>
                    <p>• Consider if this data should be {pendingActionType === 'edit' ? 'edited' : 'added'} to the current week instead</p>
                  </>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                <strong>Proceed:</strong> Continue {pendingActionType === 'edit' ? 'editing' : 'adding'} data to this week
              </p>
              <p>
                <strong>Cancel:</strong> Close this dialog and select a different week
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesTable;
