import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, Button, Input, DatePicker, Select, Table, Card, Row, Col, Typography, Space, Divider, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, CalculatorOutlined, LockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store/store';
import LoadingSpinner from '../../layout/LoadingSpinner';
import { useGuidance } from '../../../contexts/GuidanceContext';
import useRestaurantRole from '../../../hooks/useRestaurantRole';
import {
  captureCloseOutFingerprintsBeforeSave,
  recordCloseOutSessionChanges,
  flushCloseOutSessionNotification,
  maybeWarnPreviousWeekIncomplete,
} from '../../../utils/reportCardReminders';
import {
  SALES_FIRST_LABOR_MESSAGE,
  dispatchOpenSalesModal,
  isSalesEnteredForDay,
  getDatesMissingSalesForActuals,
  hasOpenDaysMissingSales,
} from '../../../utils/salesEnteredGate';
import { sanitizeDecimalInput } from '../../../utils/formatUtils';

const { Title, Text } = Typography;

const LabourTable = ({ selectedDate, selectedYear, selectedMonth, weekDays = [], dashboardData = null, refreshDashboardData = null }) => {
  const navigate = useNavigate();
  const { canAccessReportCard } = useRestaurantRole();
  // Guidance hook for data guidance
  const { startDataGuidance, hasSeenDataGuidance } = useGuidance();
  
  const [weeklyData, setWeeklyData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);
  const [hourlyRate] = useState(15);
  const [dataNotFound, setDataNotFound] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingPreviousWeek, setIsCheckingPreviousWeek] = useState(false);
  const [weeklyTotals, setWeeklyTotals] = useState({
    labor_hours_budget: "0",
    labor_hours_actual: "0",
    budgeted_labor_dollars: "0",
    actual_labor_dollars: "0",
    daily_labor_rate: "0",
    daily_labour_percent: "0",
    weekly_labour_percent: "0"
  });
  
  // State to track API-fetched average hourly rate
  const [apiAverageHourlyRate, setApiAverageHourlyRate] = useState(null);
  const [isLoadingAvgRate, setIsLoadingAvgRate] = useState(false);
  
  // Ref to track the last fetched week to prevent duplicate API calls
  const lastFetchedWeekRef = useRef(null);

  // Store integration
  const { 
    saveDashboardData, 
    loading: storeLoading, 
    error: storeError,
    restaurantGoals,
    fetchAverageHourlyRate,
    dashboardSummaryData,
  } = useStore();

  // Get average hourly rate - prioritize API-fetched value, then restaurant goals, then fallback
  const getAverageHourlyRate = () => {
    // First priority: API-fetched average hourly rate
    if (apiAverageHourlyRate && apiAverageHourlyRate > 0) {
      return parseFloat(apiAverageHourlyRate);
    }
    
    // Second priority: Dashboard summary data
    if (dashboardSummaryData?.average_hourly_rate && dashboardSummaryData.average_hourly_rate > 0) {
      return parseFloat(dashboardSummaryData.average_hourly_rate);
    }
    
    // Third priority: Restaurant goals
    if (restaurantGoals && restaurantGoals.avg_hourly_rate && restaurantGoals.avg_hourly_rate > 0) {
      return parseFloat(restaurantGoals.avg_hourly_rate);
    }
    
    // Fallback to static hourly rate
    return hourlyRate;
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
    return 50;
  };

  // Keep in-progress decimals (e.g. "10.0") so trailing zeros can be typed
  const formatDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') return '0';
    if (typeof value === 'string') return value;
    const numValue = parseFloat(value) || 0;
    return numValue === 0 ? '0' : String(numValue);
  };

  // Function to fetch average hourly rate from API
  const fetchAvgHourlyRateFromAPI = async () => {
    try {
      // Get the week start date
      const weekStart = weekDays.length > 0 
        ? weekDays[0].date.format('YYYY-MM-DD')
        : selectedDate 
          ? selectedDate.format('YYYY-MM-DD')
          : null;
      
      if (!weekStart) {
        return;
      }
      
      // Check if we've already fetched data for this week
      if (lastFetchedWeekRef.current === weekStart) {
        return;
      }
      
      setIsLoadingAvgRate(true);
      
      // Fetch average hourly rate from API
      const avgRate = await fetchAverageHourlyRate(null, weekStart);
      
      if (avgRate && avgRate > 0) {
        setApiAverageHourlyRate(avgRate);
        lastFetchedWeekRef.current = weekStart; // Mark this week as fetched
      } else {
        setApiAverageHourlyRate(null);
        lastFetchedWeekRef.current = weekStart; // Still mark as fetched to prevent retries
      }
    } catch (error) {
      console.error('Error fetching average hourly rate from API:', error);
      setApiAverageHourlyRate(null);
      // Don't mark as fetched on error, so we can retry
    } finally {
      setIsLoadingAvgRate(false);
    }
  };

  // Create a stable week identifier to prevent unnecessary re-renders
  const weekIdentifier = useMemo(() => {
    if (weekDays.length > 0) {
      return weekDays[0].date.format('YYYY-MM-DD');
    }
    if (selectedDate) {
      return selectedDate.format('YYYY-MM-DD');
    }
    return null;
  }, [weekDays, selectedDate]);

  // Fetch average hourly rate from API when component mounts or week changes
  useEffect(() => {
    if (weekIdentifier) {
      fetchAvgHourlyRateFromAPI();
    }
  }, [weekIdentifier]);

  // Reset the fetched week ref when component unmounts
  useEffect(() => {
    return () => {
      lastFetchedWeekRef.current = null;
    };
  }, []);

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

  // Ref to track if data guidance has been triggered for current data
  const dataGuidanceTriggeredRef = useRef(false);
  const lastWeeklyDataRef = useRef(null);

  // Trigger data guidance when data is present and user hasn't seen it
  useEffect(() => {
    // Only trigger if:
    // 1. Data exists (weeklyData has entries and not all zeros)
    // 2. User hasn't seen data guidance yet
    // 3. Modal is not open (to avoid showing guidance while user is entering data)
    // 4. We haven't already triggered for this data
    const hasData = weeklyData.length > 0 && !areAllValuesZero(weeklyData);
    const weeklyDataKey = JSON.stringify(weeklyData);
    const dataChanged = lastWeeklyDataRef.current !== weeklyDataKey;
    
    if (
      hasData && 
      (hasSeenDataGuidance === false || hasSeenDataGuidance === null) &&
      !isModalVisible &&
      (!dataGuidanceTriggeredRef.current || dataChanged)
    ) {
      // Mark as triggered and update refs
      dataGuidanceTriggeredRef.current = true;
      lastWeeklyDataRef.current = weeklyDataKey;
      
      const timer = setTimeout(() => {
        startDataGuidance(false, true);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (!hasData || hasSeenDataGuidance === true) {
      // Reset trigger flag if data is cleared or user has seen guidance
      dataGuidanceTriggeredRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeklyData, hasSeenDataGuidance, isModalVisible]);

  // Listen for custom event to open Labor modal from COGS table
  useEffect(() => {
    const handleOpenLaborModal = (event) => {      
      
      // Try to open modal immediately if data is available
      if (dashboardData !== null) {
        
        // Add a small delay to ensure the component is fully rendered
        setTimeout(() => {
          // Check if we have data or if we need to add data
          if (dataNotFound || areAllValuesZero(weeklyData)) {
            // No data exists, open in add mode
            showAddWeeklyModal();
            message.info('Adding Labor data for the selected week...');
          } else {
            // Data exists, open in edit mode
            showEditWeeklyModal(weeklyData[0]);
            message.info('Editing existing Labor data for the selected week...');
          }
        }, 100);
      } else {
        // Store the event data for later use when data is loaded
        localStorage.setItem('pendingLaborModal', JSON.stringify({
          shouldOpen: true,
          weekStartDate: event.detail.weekStartDate,
          timestamp: Date.now()
        }));
      }
    };

    // Add event listener
    window.addEventListener('openLaborModal', handleOpenLaborModal);

    // Cleanup event listener
    return () => {
      window.removeEventListener('openLaborModal', handleOpenLaborModal);
    };
  }, [dashboardData, dataNotFound, weeklyData]); // Include dependencies to ensure fresh values

  // Check for pending Labor modal after data is processed
  useEffect(() => {
    const pendingLaborModal = localStorage.getItem('pendingLaborModal');
    
    if (pendingLaborModal && dashboardData !== null) { // Only proceed if dashboard data has been loaded
      try {
        const pendingData = JSON.parse(pendingLaborModal);
        
        if (pendingData.shouldOpen) {
          
          // Add a small delay to ensure the component is fully rendered
          setTimeout(() => {
            // Check if we have data or if we need to add data
            if (dataNotFound || areAllValuesZero(weeklyData)) {
              // No data exists, open in add mode
              showAddWeeklyModal();
              message.info('Adding Labor data for the selected week...');
            } else {
              // Data exists, open in edit mode
              showEditWeeklyModal(weeklyData[0]);
              message.info('Editing existing Labor data for the selected week...');
            }
          }, 100);
          
          // Clear the pending modal data
          localStorage.removeItem('pendingLaborModal');
        }
      } catch (error) {
        console.error('Error processing pending Labor modal:', error);
        localStorage.removeItem('pendingLaborModal');
      }
    }
  }, [dashboardData, dataNotFound, weeklyData]); // Depend on processed data

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

  const getBudgetedLaborDollarsForDay = (laborHoursBudget, explicitBudgetedLaborDollars) => {
    const parsedBudgetedDollars = parseFloat(explicitBudgetedLaborDollars);
    if (Number.isFinite(parsedBudgetedDollars) && parsedBudgetedDollars > 0) {
      return parsedBudgetedDollars;
    }

    const parsedBudgetHours = parseFloat(laborHoursBudget) || 0;
    const averageHourlyRate = parseFloat(getAverageHourlyRate()) || 0;
    return parsedBudgetHours * averageHourlyRate;
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
          dayName: dayjs(entry.date).format('dddd'),
          laborHoursBudget: isRestaurantOpen ? (parseFloat(entry['Labor Performance']?.labor_hours_budget) || 0) : 0,
          laborHoursActual: isRestaurantOpen ? (parseFloat(entry['Labor Performance']?.labor_hours_actual) || 0) : 0,
          budgetedLaborDollars: isRestaurantOpen
            ? getBudgetedLaborDollarsForDay(
                entry['Labor Performance']?.labor_hours_budget,
                entry['Labor Performance']?.budgeted_labor_dollars
              )
            : 0,
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
            dayName: day.dayName,
            laborHoursBudget: 0,
            laborHoursActual: 0,
            budgetedLaborDollars: getBudgetedLaborDollarsForDay(0, 0),
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





  const openLaborModalAfterPreviousWeekCheck = async (openModal) => {
    if (isCheckingPreviousWeek) return;
    const weekStartDate =
      weekDays.length > 0 ? weekDays[0].date : selectedDate;
    setIsCheckingPreviousWeek(true);
    try {
      await maybeWarnPreviousWeekIncomplete({
        weekStartDate,
        onProceed: openModal,
      });
    } finally {
      setIsCheckingPreviousWeek(false);
    }
  };

  // Handle weekly data modal
  const showAddWeeklyModal = () => {
    openLaborModalAfterPreviousWeekCheck(() => {
      setEditingWeek(null);
      setIsEditMode(false);
      setIsModalVisible(true);
    });
  };

  const showEditWeeklyModal = (weekData) => {
    openLaborModalAfterPreviousWeekCheck(() => {
      setEditingWeek(weekData);
      setIsEditMode(true);
      setIsModalVisible(true);
    });
  };

  const handleWeeklySubmit = async (weekData) => {
    try {
      setIsSubmitting(true);

      if (!weekData || !weekData.dailyData) {
        message.warning('No weekly data to save. Please add weekly Labor data first.');
        return;
      }

      const blockedDates = getDatesMissingSalesForActuals(weekData.dailyData, dashboardData, {
        hasActual: (day) =>
          day.restaurantOpen !== false &&
          ((parseFloat(day.laborHoursActual) || 0) > 0 ||
            (parseFloat(day.actualLaborDollars) || 0) > 0),
      });
      if (blockedDates.length > 0) {
        message.warning(SALES_FIRST_LABOR_MESSAGE);
        dispatchOpenSalesModal(
          weekDays.length > 0
            ? weekDays[0].date.format('YYYY-MM-DD')
            : selectedDate?.format?.('YYYY-MM-DD')
        );
        return;
      }

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
          Math.round(weeklyTotals.actualLaborDollars / weeklyTotals.dailyLaborRate) : 0,
        weeklyLaborPercentage: weeklyTotals.actualLaborDollars > 0 ? 
          Math.round((weeklyTotals.actualLaborDollars / (weeklyTotals.actualLaborDollars + 5000)) * 100) : 0
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

      const beforeFingerprints = captureCloseOutFingerprintsBeforeSave();
      await saveDashboardData(transformedData);
      message.success(isEditMode ? 'Labor data updated successfully!' : 'Labor data saved successfully!');
      
      // Refresh all dashboard data to show updated data across all components
      if (refreshDashboardData) {
        await refreshDashboardData();
      } else {
        // Fallback: reload data after saving to update totals and table
        processLaborData(); 
      }

      // End of close-out chain — include all session dates (Sales + COGS + Labor)
      recordCloseOutSessionChanges(beforeFingerprints, 'labor');
      await flushCloseOutSessionNotification({
        navigate,
        beforeFingerprints,
        canAccessReportCard,
      });

      if (hasSeenDataGuidance === false || hasSeenDataGuidance === null) {
        // Reset trigger refs to allow guidance to show again after data is added
        dataGuidanceTriggeredRef.current = false;
        lastWeeklyDataRef.current = null;
        
        setTimeout(() => {
          startDataGuidance(false, true);
        }, 2000); // Increased delay to ensure DOM is ready
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
        budgetedLaborDollars: getBudgetedLaborDollarsForDay(0, 0),
        actualLaborDollars: 0,
        dailyLaborRate: parseFloat(weeklyTotals.daily_labor_rate) || getAverageHourlyRate(),
        dailyLaborPercentage: 0,
        weeklyLaborPercentage: 0,
        restaurantOpen: true // Default to open for new days
      });
    }
    return days;
  };

  // Check if a date is in the future (after today)
  // Returns true for tomorrow and beyond, false for today and past dates
  const isFutureDate = (date) => {
    if (!date) return false;
    try {
      const recordDate = dayjs.isDayjs(date) ? date : dayjs(date);
      if (!recordDate.isValid()) return false;
      
      const today = dayjs().startOf('day');
      const recordDateStart = recordDate.startOf('day');
      
      // Return true if date is after today (tomorrow or later)
      return recordDateStart.isAfter(today);
    } catch (error) {
      console.error('Error checking future date:', error, date);
      return false;
    }
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
        dailyLaborPercentage: Math.round(dailyLaborPercentage),
        weeklyLaborPercentage: Math.round(weeklyLaborPercentage),
        netSales: netSales // Store net sales for display
      };
    });
  };

    const handleDailyDataChange = (dayIndex, field, value, record) => {
      // Block actual labor data for future dates (tomorrow and beyond)
      // Allow budget data for future dates (budget planning)
      const actualFields = ['laborHoursActual', 'actualLaborDollars'];
      if (isFutureDate(record.date) && actualFields.includes(field)) {
        message.warning(`Cannot add actual labor data for ${record.dayName} - This date is in the future. Only budget data can be entered for future dates.`);
        return;
      }

      // Allow changes to restaurant_open field even when day is closed
      if (record.restaurantOpen === false && field !== 'restaurant_open' && actualFields.includes(field)) {
        message.warning(`Cannot add actual labor data for ${record.dayName} - Restaurant is closed on this day.`);
        return;
      }

      if (actualFields.includes(field) && !isSalesEnteredForDay(dashboardData, record.date)) {
        message.warning(SALES_FIRST_LABOR_MESSAGE);
        dispatchOpenSalesModal(
          weekDays.length > 0
            ? weekDays[0].date.format('YYYY-MM-DD')
            : selectedDate?.format?.('YYYY-MM-DD')
        );
        return;
      }

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

    const showSalesFirstBanner = hasOpenDaysMissingSales(
      weekFormData?.dailyData,
      dashboardData,
      { isFuture: isFutureDate }
    );

    return (
      <Modal
        title={isEditMode ? "Edit Your Actual Daily Labor" : "Enter Your Actual Daily Labor"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingWeek(null);
          setIsEditMode(false);
          // Labor dismissed without save — still show Sales/COGS session updates
          flushCloseOutSessionNotification({
            navigate,
            canAccessReportCard,
          });
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setIsModalVisible(false);
            setEditingWeek(null);
            setIsEditMode(false);
            flushCloseOutSessionNotification({
              navigate,
              canAccessReportCard,
            });
          }}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit} loading={isSubmitting || storeLoading}>
            {isEditMode ? 'Update' : 'Add'} Your Daily Labor
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
          {showSalesFirstBanner && (
          <div
            style={{
              background: '#fff7e6',
              border: '1px solid #ffd591',
              borderRadius: '6px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <Text style={{ fontSize: '13px', color: '#ad6800', flex: 1, minWidth: 0 }}>
              {SALES_FIRST_LABOR_MESSAGE}
            </Text>
            <Button
              type="primary"
              size="small"
              style={{ background: '#ff6b00', borderColor: '#ff6b00', flexShrink: 0 }}
              onClick={() =>
                dispatchOpenSalesModal(
                  weekDays.length > 0
                    ? weekDays[0].date.format('YYYY-MM-DD')
                    : selectedDate?.format?.('YYYY-MM-DD')
                )
              }
            >
              Go to Sales
            </Button>
          </div>
          )}
          {/* Weekly Labor Totals Summary - Auto-calculated from daily inputs */}
          <div
            style={{
              background: '#f5f5f5',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Text strong style={{ fontSize: '15px', color: '#262626' }}>Weekly Labor Totals Summary</Text>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#595959',
                    backgroundColor: '#e8e8e8',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    padding: '1px 8px',
                    fontWeight: 500,
                    lineHeight: '20px',
                  }}
                >
                  <LockOutlined style={{ fontSize: '10px' }} /> Read only
                </span>
            </div>
            <Text style={{ fontSize: '12px', color: '#8c8c8c', display: 'block', marginBottom: '14px' }}>
              These values are calculated automatically from the weekly labor budget and your recorded daily labor.
            </Text>
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${getLaborRecordMethod() === 'daily-hours-costs' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
              <div className="w-full">
                <Text strong style={{ color: '#434343', fontSize: '13px' }}>Total Labor Hours - Budget</Text>
                <Input
                  value={`${Math.round(weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.laborHoursBudget) || 0), 0))} hrs`}
                  className="mt-1"
                  disabled
                  style={{ backgroundColor: '#e6e6e6', color: '#1a6fb5', borderColor: '#bfbfbf', opacity: 1, WebkitTextFillColor: '#1a6fb5', cursor: 'default' }}
                />
              </div>
              {getLaborRecordMethod() !== 'cost-only' && (
                <div className="w-full">
                  <Text strong style={{ color: '#434343', fontSize: '13px' }}>Total Labor Hours - Actual</Text>
                  <Input
                    value={`${Math.round(weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.laborHoursActual) || 0), 0))} hrs`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#e6e6e6', color: '#1a6fb5', borderColor: '#bfbfbf', opacity: 1, WebkitTextFillColor: '#1a6fb5', cursor: 'default' }}
                  />
                </div>
              )}
              <div className="w-full">
                <Text strong style={{ color: '#434343', fontSize: '13px' }}>Total Budgeted Labor $</Text>
                <Input
                  value={`$${Math.round(weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.budgetedLaborDollars) || 0), 0))}`}
                  className="mt-1"
                  disabled
                  style={{ backgroundColor: '#e6e6e6', color: '#1a6fb5', borderColor: '#bfbfbf', opacity: 1, WebkitTextFillColor: '#1a6fb5', cursor: 'default' }}
                />
              </div>
              {getLaborRecordMethod() !== 'hours-only' && (
                <div className="w-full">
                  <Text strong style={{ color: '#434343', fontSize: '13px' }}>Total Actual Labor $</Text>
                  <Input
                    value={`$${Math.round(weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.actualLaborDollars) || 0), 0))}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#e6e6e6', color: '#1a6fb5', borderColor: '#bfbfbf', opacity: 1, WebkitTextFillColor: '#1a6fb5', cursor: 'default' }}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div className="w-full">
                <Text strong style={{ color: '#434343', fontSize: '13px' }}>Week to Date Avg. Actual Hourly Rate</Text>
                <Input
                  value={`${(() => {
                    const totalLabor = weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.actualLaborDollars) || 0), 0);
                    const totalHours = weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.laborHoursActual) || 0), 0);
                    return totalHours > 0 ? `$${Math.round(totalLabor / totalHours)}/hr` : '$0/hr';
                  })()}`}
                  className="mt-1"
                  disabled
                  style={{ backgroundColor: '#e6e6e6', color: '#1a6fb5', borderColor: '#bfbfbf', opacity: 1, WebkitTextFillColor: '#1a6fb5', cursor: 'default' }}
                />
              </div>
              <div className="w-full">
                <Text strong style={{ color: '#434343', fontSize: '13px' }}>Total Net Sales</Text>
                <Input
                  value={`$${Math.round(weekFormData.dailyData.reduce((sum, day) => sum + (parseFloat(day.netSales) || 0), 0))}`}
                  className="mt-1"
                  disabled
                  style={{ backgroundColor: '#e6e6e6', color: '#1a6fb5', borderColor: '#bfbfbf', opacity: 1, WebkitTextFillColor: '#1a6fb5', cursor: 'default' }}
                />
              </div>
              <div className="w-full">
                <Text strong style={{ color: '#434343', fontSize: '13px' }}>Average Hourly Rate</Text>
                <Input
                  value={`$${getAverageHourlyRate().toFixed(2)}`}
                  disabled
                  className="w-full mt-1"
                  style={{ backgroundColor: '#e6e6e6', color: '#1a6fb5', borderColor: '#bfbfbf', opacity: 1, WebkitTextFillColor: '#1a6fb5', cursor: 'default' }}
                />
              </div>
              <div className="w-full">
                <Text strong style={{ color: '#434343', fontSize: '13px' }}>Average Daily Labor %</Text>
                <Input
                  value={`${(() => {
                    const validDays = weekFormData.dailyData.filter(day => day.restaurantOpen !== false && day.netSales > 0);
                    if (validDays.length === 0) return 0;
                    const avgPercentage = validDays.reduce((sum, day) => sum + (parseFloat(day.dailyLaborPercentage) || 0), 0) / validDays.length;
                    return Math.round(avgPercentage);
                  })()}%`}
                  disabled
                  className="w-full mt-1"
                  style={{ backgroundColor: '#e6e6e6', color: '#1a6fb5', borderColor: '#bfbfbf', opacity: 1, WebkitTextFillColor: '#1a6fb5', cursor: 'default' }}
                />
              </div>
              <div className="w-full">
                <Text strong style={{ color: '#434343', fontSize: '13px' }}>Remaining Labor $ based on Actual Labor Rate</Text>
                <Input
                  value={`${(() => {
                    const totalBudgetLabor = weekFormData.dailyData.reduce((sum, day) => {
                      return sum + (parseFloat(day.budgetedLaborDollars) || 0);
                    }, 0);

                    const totalActualLabor = weekFormData.dailyData.reduce((sum, day) => {
                      return sum + (parseFloat(day.actualLaborDollars) || 0);
                    }, 0);

                    const remaining = totalBudgetLabor - totalActualLabor;
                    return `$${remaining.toFixed(2)}`;
                  })()}`}
                  disabled
                  style={{ backgroundColor: '#e6e6e6', color: '#1a6fb5', borderColor: '#bfbfbf', opacity: 1, WebkitTextFillColor: '#1a6fb5', cursor: 'default' }}
                  className="w-full mt-1"
                />
                {(() => {
                  const totalBudgetLabor = weekFormData.dailyData.reduce((sum, day) => {
                    return sum + (parseFloat(day.budgetedLaborDollars) || 0);
                  }, 0);
                  const totalActualLabor = weekFormData.dailyData.reduce((sum, day) => {
                    return sum + (parseFloat(day.actualLaborDollars) || 0);
                  }, 0);
                  if (totalBudgetLabor - totalActualLabor >= 0) return null;
                  return (
                    <Text type="danger" className="text-xs mt-1 block">
                      Over budget for the week
                    </Text>
                  );
                })()}
              </div>
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

                const laborMethod = getLaborRecordMethod();
                let cellIndex = 1; // Start after the "Day" column

                return (
                  <Table.Summary.Row style={{ backgroundColor: '#f0f8ff' }}>
                    <Table.Summary.Cell index={0}>
                      <Text strong>Totals:</Text>
                    </Table.Summary.Cell>
                    {/* Conditionally show Labor Hours total */}
                    {laborMethod !== 'cost-only' && (
                      <Table.Summary.Cell index={cellIndex++}>
                        <Text strong>{totals.laborHoursActual.toFixed(1)} hrs</Text>
                      </Table.Summary.Cell>
                    )}
                    {/* Conditionally show Actual Labor $ total */}
                    {laborMethod !== 'hours-only' && (
                      <Table.Summary.Cell index={cellIndex++}>
                        <Text strong>${totals.actualLaborDollars.toFixed(2)}</Text>
                      </Table.Summary.Cell>
                    )}
                    <Table.Summary.Cell index={cellIndex++}>
                      <Text strong>
                        {totals.laborHoursActual > 0 ? `$${(totals.actualLaborDollars / totals.laborHoursActual).toFixed(2)}/hr` : '$0.00/hr'}
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
                // Conditionally show Labor Hours - Actual based on labor_record_method
                ...(getLaborRecordMethod() === 'cost-only' ? [] : [{
                  title: 'Labor Hours - Actual',
                  dataIndex: 'laborHoursActual',
                  key: 'laborHoursActual',
                  width: 150,
                  render: (value, record, index) => {
                    const isFuture = isFutureDate(record.date);
                    const salesMissing =
                      record.restaurantOpen !== false &&
                      !isFuture &&
                      !isSalesEnteredForDay(dashboardData, record.date);
                    const isDisabled =
                      record.restaurantOpen === false || isFuture || salesMissing;
                    return (
                      <div>
                        <Input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={record.restaurantOpen === false ? 0 : formatDisplayValue(value)}
                          onChange={(e) => handleDailyDataChange(index, 'laborHoursActual', sanitizeDecimalInput(e.target.value), record)}
                          onClick={() => {
                            if (salesMissing) message.warning(SALES_FIRST_LABOR_MESSAGE);
                          }}
                          suffix="hrs"
                          className="w-full"
                          disabled={isDisabled}
                          readOnly={isFuture || salesMissing}
                          style={{
                            opacity: isDisabled ? 0.5 : 1,
                            cursor: isDisabled ? 'not-allowed' : 'text',
                            backgroundColor: isFuture || salesMissing ? '#f5f5f5' : (record.restaurantOpen === false ? '#f5f5f5' : 'white'),
                            color: record.restaurantOpen === false ? '#999' : undefined
                          }}
                        />
                        {salesMissing && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Sales required
                          </Text>
                        )}
                      </div>
                    );
                  }
                }]),
                // Conditionally show Actual Labor $ based on labor_record_method
                ...(getLaborRecordMethod() === 'hours-only' ? [] : [{
                  title: 'Actual Labor $',
                  dataIndex: 'actualLaborDollars',
                  key: 'actualLaborDollars',
                  width: 150,
                  render: (value, record, index) => {
                    const isFuture = isFutureDate(record.date);
                    const salesMissing =
                      record.restaurantOpen !== false &&
                      !isFuture &&
                      !isSalesEnteredForDay(dashboardData, record.date);
                    const isDisabled =
                      record.restaurantOpen === false || isFuture || salesMissing;
                    return (
                      <div>
                        <Input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={record.restaurantOpen === false ? 0 : formatDisplayValue(value)}
                          onChange={(e) => handleDailyDataChange(index, 'actualLaborDollars', sanitizeDecimalInput(e.target.value), record)}
                          onClick={() => {
                            if (salesMissing) message.warning(SALES_FIRST_LABOR_MESSAGE);
                          }}
                          prefix="$"
                          className="w-full"
                          disabled={isDisabled}
                          readOnly={isFuture || salesMissing}
                          style={{
                            opacity: isDisabled ? 0.5 : 1,
                            cursor: isDisabled ? 'not-allowed' : 'text',
                            backgroundColor: isFuture || salesMissing ? '#f5f5f5' : (record.restaurantOpen === false ? '#f5f5f5' : 'white'),
                            color: record.restaurantOpen === false ? '#999' : undefined
                          }}
                        />
                        {salesMissing && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Sales required
                          </Text>
                        )}
                      </div>
                    );
                  }
                }]),
                {
                  title: 'Actual Hourly Rate',
                  dataIndex: 'actualHourlyRate',
                  key: 'actualHourlyRate',
                  width: 150,
                  render: (value, record) => (
                    <Input
                      value={record.restaurantOpen === false ? '$0.00/hr' : (() => {
                        const actualLabor = parseFloat(record.actualLaborDollars) || 0;
                        const actualHours = parseFloat(record.laborHoursActual) || 0;
                        const hourlyRate = actualHours > 0 ? (actualLabor / actualHours) : 0;
                        return `$${hourlyRate.toFixed(2)}/hr`;
                      })()}
                      className="w-full"
                      disabled
                      style={{ 
                        backgroundColor: '#e3f2fd', 
                        color: '#1976d2',
                        fontWeight: 'bold'
                      }}
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
                  title: 'Week To Date Labor % of Sales',
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
            title={
              isLoadingAvgRate 
                ? `Labor @ Loading.../Hour` 
                : `Labor @ $${getAverageHourlyRate().toFixed(2)}/Hour`
            }
            data-guidance="actual-weekly-labor-performance"
            extra={
              <Space>
                <Button 
                  type="default" 
                  icon={dataNotFound || areAllValuesZero(weeklyData) ? <PlusOutlined /> : <EditOutlined />} 
                  onClick={dataNotFound || areAllValuesZero(weeklyData) ? showAddWeeklyModal : () => showEditWeeklyModal(weeklyData[0])}
                  disabled={!selectedDate || isCheckingPreviousWeek}
                  loading={isCheckingPreviousWeek}
                  style={{
                    backgroundColor: "#85d7a2",
                    borderColor: "#85d7a2",
                    color: "white !important",
                    fontWeight: '500'
                  }}
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
                            rowClassName={(record) => (
                              record.restaurantOpen === false ? 'opacity-60 bg-gray-50' : ''
                            )}
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

                              const laborMethod = getLaborRecordMethod();
                              let cellIndex = 1; // Start after the "Day" column

                              return (
                                <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                                  <Table.Summary.Cell index={0}>
                                    <Text strong style={{ color: '#1890ff' }}>Week Totals:</Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={cellIndex++}>
                                    <Text strong style={{ color: '#1890ff' }}>{pageData.reduce((sum, record) => sum + (parseFloat(record.laborHoursBudget) || 0), 0).toFixed(1)} hrs</Text>
                                  </Table.Summary.Cell>
                                  {/* Conditionally show Labor Hours - Actual total */}
                                  {laborMethod !== 'cost-only' && (
                                    <Table.Summary.Cell index={cellIndex++}>
                                      <Text strong style={{ color: '#1890ff' }}>{pageData.reduce((sum, record) => sum + (parseFloat(record.laborHoursActual) || 0), 0).toFixed(1)} hrs</Text>
                                    </Table.Summary.Cell>
                                  )}
                                  <Table.Summary.Cell index={cellIndex++}>
                                    <Text strong style={{ color: '#1890ff' }}>${pageData.reduce((sum, record) => sum + (parseFloat(record.budgetedLaborDollars) || 0), 0).toFixed(2)}</Text>
                                  </Table.Summary.Cell>
                                  {/* Conditionally show Actual Labor $ total */}
                                  {laborMethod !== 'hours-only' && (
                                    <Table.Summary.Cell index={cellIndex++}>
                                      <Text strong style={{ color: '#1890ff' }}>${pageData.reduce((sum, record) => sum + (parseFloat(record.actualLaborDollars) || 0), 0).toFixed(2)}</Text>
                                    </Table.Summary.Cell>
                                  )}
                                  <Table.Summary.Cell index={cellIndex++}>
                                    <Text strong style={{ color: '#1890ff' }}>
                                      {(() => {
                                        const totalLabor = pageData.reduce((sum, record) => sum + (parseFloat(record.actualLaborDollars) || 0), 0);
                                        const totalHours = pageData.reduce((sum, record) => sum + (parseFloat(record.laborHoursActual) || 0), 0);
                                        return totalHours > 0 ? `$${Math.round(totalLabor / totalHours)}/hr` : '$0/hr';
                                      })()}
                                    </Text>
                                  </Table.Summary.Cell>
                                  <Table.Summary.Cell index={cellIndex++}>
                                    <Text strong style={{ color: '#1890ff' }}>
                                      {(() => {
                                        const totalLabor = pageData.reduce((sum, record) => sum + (parseFloat(record.actualLaborDollars) || 0), 0);
                                        const totalHours = pageData.reduce((sum, record) => sum + (parseFloat(record.laborHoursActual) || 0), 0);
                                        return totalHours > 0 ? `$${Math.round(totalLabor / totalHours)}/hr` : '$0/hr';
                                      })()}
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
                                      {record.restaurantOpen === false && (
                                        <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-600">
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
                                title: 'Labor Hours - Budget',
                                dataIndex: 'laborHoursBudget',
                                key: 'laborHoursBudget',
                                width: 120,
                                render: (value, record) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  return <Text>{(parseFloat(value) || 0).toFixed(1)} hrs</Text>;
                                }
                              },
                              // Conditionally show Labor Hours - Actual based on labor_record_method
                              ...(getLaborRecordMethod() === 'cost-only' ? [] : [{
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
                                    }}>
                                      {actual.toFixed(1)} hrs
                                    </Text>
                                  );
                                }
                              }]),
                              {
                                title: 'Budgeted Labor $',
                                dataIndex: 'budgetedLaborDollars',
                                key: 'budgetedLaborDollars',
                                width: 120,
                                render: (value, record) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  return <Text>${(parseFloat(value) || 0).toFixed(2)}</Text>;
                                }
                              },
                              // Conditionally show Actual Labor $ based on labor_record_method
                              ...(getLaborRecordMethod() === 'hours-only' ? [] : [{
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
                                    }}>
                                      ${actual.toFixed(2)}
                                    </Text>
                                  );
                                }
                              }]),
                              {
                                title: 'Actual Hourly Rate',
                                dataIndex: 'actualHourlyRate',
                                key: 'actualHourlyRate',
                                width: 150,
                                render: (value, record) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  const actualLabor = parseFloat(record.actualLaborDollars) || 0;
                                  const actualHours = parseFloat(record.laborHoursActual) || 0;
                                  const hourlyRate = actualHours > 0 ? (actualLabor / actualHours) : 0;
                                  return <Text className='bg-blue-200 p-1 rounded-md'>${hourlyRate.toFixed(2)}/hr</Text>;
                                }
                              },
                              {
                                title: 'Week to Date Avg. Actual Hourly Rate',
                                dataIndex: 'dailyLaborRate',
                                key: 'dailyLaborRate',
                                width: 180,
                                render: (value, record, index) => {
                                  if (record.restaurantOpen === false) {
                                    return <Text style={{ color: '#999', fontStyle: 'italic' }}>CLOSED</Text>;
                                  }
                                  // Calculate cumulative average hourly rate up to this day
                                  const weekData = weeklyData[0]?.dailyData || [];
                                  const daysUpToCurrent = weekData.slice(0, index + 1);
                                  
                                  const cumulativeLabor = daysUpToCurrent.reduce((sum, day) => {
                                    return day.restaurantOpen !== false ? sum + (parseFloat(day.actualLaborDollars) || 0) : sum;
                                  }, 0);
                                  
                                  const cumulativeHours = daysUpToCurrent.reduce((sum, day) => {
                                    return day.restaurantOpen !== false ? sum + (parseFloat(day.laborHoursActual) || 0) : sum;
                                  }, 0);
                                  
                                  const cumulativeAvgRate = cumulativeHours > 0 ? (cumulativeLabor / cumulativeHours) : 0;
                                  return <Text className='bg-green-200 p-1 rounded-md'>${cumulativeAvgRate.toFixed(2)}/hr</Text>;
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
                                  return <Text style={{ 
                                    backgroundColor: '#e8f5e8', 
                                    color: '#2e7d32',
                                    padding: '2px 6px', 
                                    borderRadius: '3px',
                                    fontWeight: 'bold'
                                  }}>{dailyPercentage.toFixed(2)}%</Text>;
                                }
                              },
                              {
                                title:"Week To Date Labor % of Sales",
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
                                  return <Text style={{ 
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
          <Card title=" Actual Weekly Labor Totals" className="h-fit" data-guidance="actual-weekly-labor-totals">
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
                
                {/* Conditionally show Labor Hours - Actual based on labor_record_method */}
                {getLaborRecordMethod() !== 'cost-only' && (
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
                )}
                
                <div>
                  <Text strong className="text-sm sm:text-base">Budgeted Labor $:</Text>
                  <Input
                    value={`$${weeklyData.length > 0 ? weeklyData[0].dailyData.reduce((sum, day) => sum + (parseFloat(day.budgetedLaborDollars) || 0), 0).toFixed(2) : '0.00'}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#fff7ed', color: '#1890ff' }}
                  />
                </div>
                
                {/* Conditionally show Actual Labor $ based on labor_record_method */}
                {getLaborRecordMethod() !== 'hours-only' && (
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
                )}
                
                <div>
                  <Text strong className="text-sm sm:text-base">Week to Date Avg. Actual Hourly Rate:</Text>
                  <Input
                    value={`${(() => {
                      if (weeklyData.length === 0) return '$0.00/hr';
                      const totalLabor = weeklyData[0].dailyData.reduce((sum, day) => {
                        return day.restaurantOpen !== false ? sum + (parseFloat(day.actualLaborDollars) || 0) : sum;
                      }, 0);
                      const totalHours = weeklyData[0].dailyData.reduce((sum, day) => {
                        return day.restaurantOpen !== false ? sum + (parseFloat(day.laborHoursActual) || 0) : sum;
                      }, 0);
                      return totalHours > 0 ? `$${Math.round(totalLabor / totalHours)}/hr` : '$0/hr';
                    })()}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#e8f5e8', color: '#2e7d32' }}
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
                  <Text strong className="text-sm sm:text-base">Remaining Labor $ based on Actual Labor Rate:</Text>
                  <Input
                    value={`${(() => {
                      if (weeklyData.length === 0) return '$0.00';

                      const totalBudgetLabor = weeklyData[0].dailyData.reduce((sum, day) => {
                        return day.restaurantOpen !== false ? sum + (parseFloat(day.budgetedLaborDollars) || 0) : sum;
                      }, 0);

                      const totalActualLabor = weeklyData[0].dailyData.reduce((sum, day) => {
                        return day.restaurantOpen !== false ? sum + (parseFloat(day.actualLaborDollars) || 0) : sum;
                      }, 0);

                      const remaining = totalBudgetLabor - totalActualLabor;
                      return `$${remaining.toFixed(2)}`;
                    })()}`}
                    className="mt-1"
                    disabled
                    style={{ backgroundColor: '#fff3e0', color: '#f57c00' }}
                  />
                  {(() => {
                    if (weeklyData.length === 0) return null;
                    const totalBudgetLabor = weeklyData[0].dailyData.reduce((sum, day) => {
                      return day.restaurantOpen !== false ? sum + (parseFloat(day.budgetedLaborDollars) || 0) : sum;
                    }, 0);
                    const totalActualLabor = weeklyData[0].dailyData.reduce((sum, day) => {
                      return day.restaurantOpen !== false ? sum + (parseFloat(day.actualLaborDollars) || 0) : sum;
                    }, 0);
                    if (totalBudgetLabor - totalActualLabor >= 0) return null;
                    return (
                      <Text type="danger" className="text-xs mt-1 block">
                        Over budget for the week
                      </Text>
                    );
                  })()}
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
