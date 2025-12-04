import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Input, Table, Card, Row, Col, Typography, Space, Divider, message, Spin, Empty, notification } from 'antd';
import { PlusOutlined, EditOutlined, CalculatorOutlined, SaveOutlined, DollarOutlined, ArrowRightOutlined, ExclamationCircleOutlined, UserOutlined, QuestionCircleOutlined, CalendarOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useStore from '../../../store/store';
import ToggleSwitch from '../../buttons/ToggleSwitch';
import { CalendarHelpers } from '../../../utils/CalendarHelpers';

const { Title, Text } = Typography;

const SalesDataModal = ({ 
  visible, 
  onCancel, 
  selectedWeekData, 
  onDataSaved,
  autoOpenFromSummary = false,
  isManuallyTriggered = false
}) => {
  // Navigation hook
  const navigate = useNavigate();
  
  // Store integration
  const { 
    saveDashboardData, 
    loading: storeLoading, 
    completeOnboardingData,
    restaurantGoals,
    getRestaurentGoal,
    dashboardSummaryData,
    fetchDashboardSummary,
    hasAverageHourlyRateForWeek
  } = useStore();

  // Get providers from onboarding data
  const getProviders = () => {
    if (!completeOnboardingData || !completeOnboardingData['Food Cost Details'] || !completeOnboardingData['Food Cost Details'].data) {
      return [];
    }
    return completeOnboardingData['Food Cost Details'].data.providers || [];
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    weeklyTotals: {
      salesBudget: 0,
      actualSalesInStore: 0,
      actualSalesAppOnline: 0,
      dailyTickets: 0,
      averageDailyTicket: 0,
      average_hourly_rate: 0
    },
    dailyData: []
  });

  // Add state for the budget validation modal
  const [showBudgetValidationModal, setShowBudgetValidationModal] = useState(false);
  const [openDaysWithoutBudget, setOpenDaysWithoutBudget] = useState([]);

  // Add state for the labor rate confirmation modal
  const [showLaborRateConfirmationModal, setShowLaborRateConfirmationModal] = useState(false);
  const [laborRateConfirmed, setLaborRateConfirmed] = useState(false);
  const [showPopupDelay, setShowPopupDelay] = useState(false);
  const [showLaborRateInput, setShowLaborRateInput] = useState(false);
  const [previousWeekLaborRate, setPreviousWeekLaborRate] = useState(null);
  const [showEditWeeklyRateWarningModal, setShowEditWeeklyRateWarningModal] = useState(false);
  const [selectedLaborRateChoice, setSelectedLaborRateChoice] = useState(null); // 'current' or 'previous'

  // Add state for the week confirmation modal
  const [showWeekConfirmationModal, setShowWeekConfirmationModal] = useState(false);
  const [weekStatus, setWeekStatus] = useState(null);
  const [weekConfirmed, setWeekConfirmed] = useState(false);

  // Add refs for debouncing budgeted sales changes
  const budgetedSalesTimeoutRef = useRef({});
  const lastBudgetedSalesValueRef = useRef({});
  
  // Add ref to track if average hourly rate is being fetched
  const avgHourlyRateFetchingRef = useRef(false);
  const avgHourlyRateFetchedRef = useRef(false);
  
  // Add ref to track if week has been initially confirmed (to prevent showing modal again during save)
  const weekInitiallyConfirmedRef = useRef(false);

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

  // Fetch restaurant goals and average hourly rate on component mount
  useEffect(() => {
    fetchRestaurantGoals();
  }, []);

  // Function to fetch average hourly rate from API
  const fetchAverageHourlyRate = async () => {
    try {
      if (visible && selectedWeekData?.startDate && !avgHourlyRateFetchingRef.current && !avgHourlyRateFetchedRef.current) {
        const weekStart = dayjs(selectedWeekData.startDate).format('YYYY-MM-DD');
        
        // Check if we already have the average hourly rate for this week
        if (hasAverageHourlyRateForWeek(weekStart)) {
          avgHourlyRateFetchedRef.current = true;
          return;
        }
        
        avgHourlyRateFetchingRef.current = true;
        
        const startDate = weekStart;
        const endDate = dayjs(selectedWeekData.startDate).add(6, 'day').format('YYYY-MM-DD');
        
        // Fetch dashboard summary which will automatically include average hourly rate
        await fetchDashboardSummary(startDate, endDate, 'daily');
        
        avgHourlyRateFetchedRef.current = true;
        avgHourlyRateFetchingRef.current = false;
      }
    } catch (error) {
      console.error('Error fetching average hourly rate:', error);
      avgHourlyRateFetchingRef.current = false;
    }
  };


  // Initialize form data when modal opens or week data changes
  useEffect(() => {
    if (visible && selectedWeekData) {
      // Reset the fetched flag when modal opens with new week data
      avgHourlyRateFetchedRef.current = false;
      
      // Check week status first
      const weekStartDate = selectedWeekData.startDate;
      const status = CalendarHelpers.getWeekStatus(weekStartDate);
      setWeekStatus(status);
      
      // If it's not the current week and week hasn't been initially confirmed, show confirmation modal
      // Don't show if week was already confirmed (prevents showing during save operations)
      if (!status.isCurrentWeek && !weekInitiallyConfirmedRef.current) {
        setShowWeekConfirmationModal(true);
        setWeekConfirmed(false);
        return; // Don't proceed with initialization until confirmed
      }
      
      // If it's current week, mark as confirmed
      if (status.isCurrentWeek && !weekInitiallyConfirmedRef.current) {
        weekInitiallyConfirmedRef.current = true;
        setWeekConfirmed(true);
      }
      
      // Proceed with initialization if week is confirmed or it's current week
      // (This prevents re-initialization during save operations)
      if (weekInitiallyConfirmedRef.current || status.isCurrentWeek) {
        // Fetch average hourly rate first, then initialize form data
        const initializeModal = async () => {
          await fetchAverageHourlyRate();
          initializeFormData();
        };
        
        initializeModal();
      }
      
      // Show labor rate confirmation modal with 1.5 second delay
      // Only show if forward_previous_week_rate is false AND there's no existing data (new entry only)
      // If forward_previous_week_rate is true, the system will automatically forward the previous week's rate
      // Check if there's existing data - if dailyData exists and has entries, it's an edit, not a new entry
      const hasExistingData = selectedWeekData.dailyData && selectedWeekData.dailyData.length > 0;
      
      if (restaurantGoals && restaurantGoals.forward_previous_week_rate === false && !hasExistingData) {
        setShowPopupDelay(true); // Show delay indicator
        
        const popupTimer = setTimeout(() => {
          setShowLaborRateConfirmationModal(true);
          setLaborRateConfirmed(false);
          setShowPopupDelay(false); // Hide delay indicator
        }, 1500); // 1.5 seconds delay
        
        // Cleanup timer if component unmounts or modal closes
        return () => {
          clearTimeout(popupTimer);
        };
      } else if (restaurantGoals && restaurantGoals.forward_previous_week_rate === true) {
        // If forward_previous_week_rate is true, skip the confirmation modal
        setLaborRateConfirmed(true);
        setShowLaborRateInput(false);
      } else if (hasExistingData) {
        // If editing existing data, skip the confirmation modal
        setLaborRateConfirmed(true);
        setShowLaborRateInput(false);
      }
    }
  }, [visible, selectedWeekData]);

  // Separate effect for when restaurant goals change (only reinitialize form data, don't fetch API again)
  useEffect(() => {
    if (visible && selectedWeekData && restaurantGoals) {
      // Only reinitialize form data if we already have the average hourly rate
      if (avgHourlyRateFetchedRef.current || dashboardSummaryData?.average_hourly_rate) {
        initializeFormData();
      }
      
      // Handle labor rate confirmation modal based on forward_previous_week_rate
      // Only show if there's no existing data (new entry only, not editing)
      const hasExistingData = selectedWeekData.dailyData && selectedWeekData.dailyData.length > 0;
      
      if (restaurantGoals.forward_previous_week_rate === false && !laborRateConfirmed && !hasExistingData) {
        // Show the confirmation modal if forward_previous_week_rate is false and it's a new entry
        setShowPopupDelay(true);
        
        const popupTimer = setTimeout(() => {
          setShowLaborRateConfirmationModal(true);
          setLaborRateConfirmed(false);
          setShowPopupDelay(false);
        }, 1500);
        
        return () => {
          clearTimeout(popupTimer);
        };
      } else if (restaurantGoals.forward_previous_week_rate === true) {
        // Skip the confirmation modal if forward_previous_week_rate is true
        setLaborRateConfirmed(true);
        setShowLaborRateInput(false);
        setShowLaborRateConfirmationModal(false);
        setShowPopupDelay(false);
      } else if (hasExistingData) {
        // If editing existing data, skip the confirmation modal
        setLaborRateConfirmed(true);
        setShowLaborRateInput(false);
        setShowLaborRateConfirmationModal(false);
        setShowPopupDelay(false);
      }
    }
  }, [restaurantGoals]);

  // Cleanup timeouts and reset refs when component unmounts or modal closes
  useEffect(() => {
    return () => {
      // Clear all timeouts when component unmounts
      Object.values(budgetedSalesTimeoutRef.current).forEach(timeoutId => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
    };
  }, []);

  // Reset refs and states when modal closes
  useEffect(() => {
    if (!visible) {
      avgHourlyRateFetchingRef.current = false;
      avgHourlyRateFetchedRef.current = false;
      setShowEditWeeklyRateWarningModal(false);
      setSelectedLaborRateChoice(null);
      weekInitiallyConfirmedRef.current = false; // Reset week confirmation so it can show again for new week
    }
  }, [visible]);

  // Initialize form data based on selected week
  const initializeFormData = () => {
    // Ensure we always have a valid start date from selectedWeekData
    if (!selectedWeekData?.startDate) {
      console.error('selectedWeekData.startDate is missing:', selectedWeekData);
      message.error('Week data is missing. Please try again.');
      return;
    }
    
    const startDate = dayjs(selectedWeekData.startDate);
    const currentProviders = getProviders();
    
    // Check if we have existing daily data to use
    let dailyData;
    if (selectedWeekData.dailyData && selectedWeekData.dailyData.length > 0) {
      // Use existing data
      dailyData = selectedWeekData.dailyData;
    } else {
      // Generate new data
      dailyData = generateDailyData(startDate, currentProviders);
    }
    
    // Get avg_hourly_rate from API response first, then fallback to restaurant goals
    let avgHourlyRateFromAPI = 0;
    if (dashboardSummaryData?.average_hourly_rate) {
      avgHourlyRateFromAPI = parseFloat(dashboardSummaryData.average_hourly_rate);
    }
    
    // Get previous week's rate from API response
    if (dashboardSummaryData?.previous_week_average_hourly_rate) {
      setPreviousWeekLaborRate(parseFloat(dashboardSummaryData.previous_week_average_hourly_rate));
    } else {
      setPreviousWeekLaborRate(null);
    }
    
    // Fallback to restaurant goals if API didn't return a value
    const avgHourlyRateFromGoals = restaurantGoals?.avg_hourly_rate && restaurantGoals.avg_hourly_rate > 0 
      ? parseFloat(restaurantGoals.avg_hourly_rate) 
      : 0;
    
    // Use API value if available, otherwise use goals value
    const finalAvgHourlyRate = avgHourlyRateFromAPI > 0 ? avgHourlyRateFromAPI : avgHourlyRateFromGoals;
    
    const initialWeeklyTotals = {
      salesBudget: 0,
      actualSalesInStore: 0,
      actualSalesAppOnline: 0,
      dailyTickets: 0,
      averageDailyTicket: 0,
      average_hourly_rate: finalAvgHourlyRate,
      ...currentProviders.reduce((acc, provider) => {
        const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
        acc[providerKey] = 0;
        return acc;
      }, {})
    };
    
    setFormData({
      weeklyTotals: initialWeeklyTotals,
      dailyData: dailyData
    });
  };

  // Generate 7 days of data starting from a given date
  const generateDailyData = (startDate, currentProviders) => {
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
        restaurant_open: (() => {
          // If we have existing data, use it and convert if needed
          if (selectedWeekData?.dailyData && selectedWeekData.dailyData.length > 0) {
            const existingDay = selectedWeekData.dailyData.find(d => 
              d.date?.format('YYYY-MM-DD') === currentDate.format('YYYY-MM-DD')
            );
            if (existingDay?.restaurant_open !== undefined) {
              const value = existingDay.restaurant_open;
              
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
          }
          
          // Use restaurant goals to determine if this day should be closed
          return shouldBeClosed ? 0 : 1; // 0 for closed, 1 for open
        })()
      };

      // Add dynamic provider fields
      currentProviders.forEach(provider => {
        const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
        dayData[providerKey] = 0;
      });

      days.push(dayData);
    }
    return days;
  };

  // Show top popup notification
  // const showTopPopupNotification = (selectedDay) => {
  //   notification.info({
  //     message: (
  //       <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
  //         🎉 Budgeted Sales Added Successfully!
  //       </div>
  //     ),
  //     description: (
  //       <div style={{ marginTop: '8px' }}>
  //         <p style={{ marginBottom: '8px' }}>
  //           <strong>${selectedDay.budgetedSales}</strong> has been added for <strong>{selectedDay.dayName}</strong> ({selectedDay.date.format('MMM DD, YYYY')}).
  //         </p>
  //         <p style={{ marginBottom: '12px', color: '#666' }}>
  //           Would you like to add net actual sales for this date?
  //         </p>
  //         <Button 
  //           type="primary" 
  //           size="small" 
  //           icon={<DollarOutlined />}
  //           onClick={() => handleNavigateToDashboardSales(selectedDay)}
  //           style={{ 
  //             marginTop: '8px',
  //             backgroundColor: '#52c41a',
  //             borderColor: '#52c41a'
  //           }}
  //         >
  //           Add Sales Performance
  //           <ArrowRightOutlined />
  //         </Button>
  //       </div>
  //     ),
  //     duration: 0, // Don't auto-close
  //     placement: 'top',
  //     style: {
  //       width: 450,
  //       zIndex: 99999,
  //       boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  //       borderRadius: '8px',
  //       marginTop: '20px',
  //     },
  //     onClose: () => {
  //       console.log('Top popup notification closed');
  //     }
  //   });
  // };

  // Handle navigation to dashboard sales modal
  // const handleNavigateToDashboardSales = (selectedDay) => {
  //   // Close current modal
  //   onCancel();
    
  //   // Close the notification
  //   notification.destroy();
    
  //   // Navigate to dashboard with selected date
  //   // You can implement navigation logic here
  //   console.log('Navigating to dashboard sales with date:', selectedDay.date.format('YYYY-MM-DD'));
    
  //   // Show success message
  //   message.success(`Opening sales performance for ${selectedDay.dayName} (${selectedDay.date.format('MMM DD, YYYY')})`);
    
  //   // You can emit an event or use a callback to navigate to the dashboard
  //   // For now, we'll just show a message
  //   setTimeout(() => {
  //     message.info('Please navigate to Dashboard > Sales Performance to add/edit sales data');
  //   }, 2000);
  // };

  // Handle daily data changes without immediate popups
  const handleDailyDataChange = (dayIndex, field, value) => {
    const newDailyData = [...formData.dailyData];
    newDailyData[dayIndex] = { ...newDailyData[dayIndex], [field]: value };
    
    setFormData({ 
      ...formData, 
      dailyData: newDailyData
    });

    // Handle budgeted sales changes with debouncing for console log only
    if (field === 'budgetedSales') {
      const changedDay = newDailyData[dayIndex];
      const dayKey = changedDay.key;
      const previousValue = lastBudgetedSalesValueRef.current[dayKey] || 0;
      
      // Clear existing timeout for this day
      if (budgetedSalesTimeoutRef.current[dayKey]) {
        clearTimeout(budgetedSalesTimeoutRef.current[dayKey]);
      }
      
      // Only show console log if value is greater than 0 and has actually changed significantly
      if (value > 0 && Math.abs(value - previousValue) >= 1) {
        // Set timeout to show console log after user stops typing (1 second delay)
        budgetedSalesTimeoutRef.current[dayKey] = setTimeout(() => {
          
        }, 1000);
      }
      
      // Update the last value for this day
      lastBudgetedSalesValueRef.current[dayKey] = value;
    }
  };

  // Handle input blur for budgeted sales - show success message only when done editing
  const handleBudgetedSalesBlur = (dayIndex, value, record) => {
    if (value > 0 && !isDayClosed(record)) {
      message.success(`Budgeted sales of $${value} added for ${record.dayName}`);
    }
  };

  // Handle weekly totals changes
  const handleWeeklyTotalsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      weeklyTotals: {
        ...prev.weeklyTotals,
        [field]: value
      }
    }));
  };

  // Handle labor rate change
  const handleLaborRateChange = (value) => {
    setFormData(prev => ({
      ...prev,
      weeklyTotals: {
        ...prev.weeklyTotals,
        average_hourly_rate: parseFloat(value) || 0
      }
    }));
  };

  // Calculate weekly totals from daily data
  const calculateWeeklyTotals = () => {
    if (!formData.dailyData || formData.dailyData.length === 0) {
      const currentProviders = getProviders();
      return {
        budgetedSales: 0,
        actualSalesInStore: 0,
        actualSalesAppOnline: 0,
        dailyTickets: 0,
        netSalesActual: 0,
        ...currentProviders.reduce((acc, provider) => {
          const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
          acc[providerKey] = 0;
          return acc;
        }, {})
      };
    }

    const currentProviders = getProviders();
    const totals = formData.dailyData.reduce((acc, day) => {
      acc.budgetedSales += parseFloat(day.budgetedSales) || 0;
      acc.actualSalesInStore += parseFloat(day.actualSalesInStore) || 0;
      acc.actualSalesAppOnline += parseFloat(day.actualSalesAppOnline) || 0;
      acc.dailyTickets += parseFloat(day.dailyTickets) || 0;
      
      // Add dynamic provider totals
      currentProviders.forEach(provider => {
        const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
        if (!acc[providerKey]) acc[providerKey] = 0;
        acc[providerKey] += parseFloat(day[providerKey]) || 0;
      });
      
      return acc;
    }, {
      budgetedSales: 0,
      actualSalesInStore: 0,
      actualSalesAppOnline: 0,
      dailyTickets: 0,
      ...currentProviders.reduce((acc, provider) => {
        const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
        acc[providerKey] = 0;
        return acc;
      }, {})
    });

    // Calculate net sales actual
    const allSalesFields = ['actualSalesInStore', 'actualSalesAppOnline'];
    currentProviders.forEach(provider => {
      const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
      allSalesFields.push(providerKey);
    });
    
    totals.netSalesActual = allSalesFields.reduce((sum, field) => sum + (totals[field] || 0), 0);
    
    return totals;
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Check for open days without budgeted sales
      const openDaysWithoutBudget = checkOpenDaysWithoutBudget();
      
      if (openDaysWithoutBudget.length > 0) {
        setOpenDaysWithoutBudget(openDaysWithoutBudget);
        setShowBudgetValidationModal(true);
        return;
      }
      
      // Proceed with saving if all open days have budgets
      await saveSalesData();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      message.error(`Failed to process request: ${error.message}`);
    }
  };

  // Actual save function
  const saveSalesData = async () => {
    try {
      setIsSubmitting(true);
      
      if (!formData.dailyData || formData.dailyData.length === 0) {
        message.warning('Please add sales data before saving.');
        return;
      }

      // Check if budgeted sales are entered
      if (!hasBudgetedSales()) {
        message.warning('Please add budgeted sales data before saving.');
        return;
      }

      const weeklyTotals = calculateWeeklyTotals();
      
      // Ensure we always have a valid start date from selectedWeekData
      if (!selectedWeekData?.startDate) {
        console.error('selectedWeekData.startDate is missing in handleSubmit:', selectedWeekData);
        message.error('Week data is missing. Please try again.');
        return;
      }
      
      const startDate = dayjs(selectedWeekData.startDate);
      
      
      const currentProviders = getProviders();

      // Transform data to API format with proper null checks
      const transformedData = {
        week_start: startDate.format('YYYY-MM-DD'),
        section: "Sales Performance",
        section_data: {
          weekly: {
            sales_budget: (weeklyTotals.budgetedSales || 0).toFixed(2),
            actual_sales_in_store: (weeklyTotals.actualSalesInStore || 0).toFixed(2),
            actual_sales_app_online: (weeklyTotals.actualSalesAppOnline || 0).toFixed(2),
            net_sales_actual: (weeklyTotals.netSalesActual || 0).toFixed(2),
            daily_tickets: weeklyTotals.dailyTickets || 0,
            average_daily_ticket: weeklyTotals.dailyTickets > 0 ? ((weeklyTotals.netSalesActual || 0) / weeklyTotals.dailyTickets).toFixed(2) : '0.00',
            average_hourly_rate: (formData.weeklyTotals.average_hourly_rate || 0).toFixed(2),
            // Add dynamic provider fields to weekly data
            ...currentProviders.reduce((acc, provider) => {
              const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
              acc[`actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`] = (weeklyTotals[providerKey] || 0).toFixed(2);
              return acc;
            }, {})
          },
          daily: formData.dailyData.map(day => {
            const dailyData = {
              date: day.date.format('YYYY-MM-DD'),
              day: day.dayName.charAt(0).toUpperCase() + day.dayName.slice(1),
              sales_budget: (parseFloat(day.budgetedSales) || 0).toFixed(2),
              actual_sales_in_store: (parseFloat(day.actualSalesInStore) || 0).toFixed(2),
              actual_sales_app_online: (parseFloat(day.actualSalesAppOnline) || 0).toFixed(2),
              daily_tickets: parseFloat(day.dailyTickets) || 0,
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
              })(), // Include the new field
              // Add dynamic provider fields to daily data
              ...currentProviders.reduce((acc, provider) => {
                const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                acc[`actual_sales_${provider.provider_name.toLowerCase().replace(/\s+/g, '_')}`] = (parseFloat(day[providerKey]) || 0).toFixed(2);
                return acc;
              }, {})
            };

            // Calculate net sales actual including dynamic providers
            const baseSales = (parseFloat(day.actualSalesInStore) || 0) + (parseFloat(day.actualSalesAppOnline) || 0);
            const providerSales = currentProviders.reduce((sum, provider) => {
              const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
              return sum + (parseFloat(day[providerKey]) || 0);
            }, 0);
            dailyData.net_sales_actual = (baseSales + providerSales).toFixed(2);

            return dailyData;
          })
        }
      };

      await saveDashboardData(transformedData);
      message.success('Sales data saved successfully! 🎉');
      
      // Call the callback to refresh data
      if (onDataSaved) {
        onDataSaved();
      }
      
      onCancel();
    } catch (error) {
      console.error('Error saving sales data:', error);
      message.error(`Failed to save sales data: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle user choice in budget validation modal
  const handleBudgetValidationChoice = async (addBudgets) => {
    setShowBudgetValidationModal(false);
    
    if (addBudgets) {
      // User wants to add budgets - focus on first day without budget
      const firstDayWithoutBudget = openDaysWithoutBudget[0];
      const dayIndex = formData.dailyData.findIndex(day => day.key === firstDayWithoutBudget.key);
      
      if (dayIndex !== -1) {
        // Focus on the budgeted sales input for that day
        message.info(`Please add budgeted sales for ${firstDayWithoutBudget.dayName}. The input field is now highlighted.`);
        
        // You can add additional logic here to highlight or focus the input field
        // For now, we'll just show a message
      }
    } else {
      // User wants to proceed with $0 budgets - save the data
      await saveSalesData();
    }
  };

  // Handle user choice in labor rate confirmation modal
  const handleLaborRateConfirmationChoice = (choice) => {
    
    setShowLaborRateConfirmationModal(false);
    setShowPopupDelay(false); // Reset delay indicator
    
    if (choice === 'previous') {
      // User wants to use previous week's rate
      setSelectedLaborRateChoice('previous'); // Track the choice
      if (previousWeekLaborRate) {
        setFormData(prev => ({
          ...prev,
          weeklyTotals: {
            ...prev.weeklyTotals,
            average_hourly_rate: previousWeekLaborRate
          }
        }));
        message.success(`Last week's rate of $${previousWeekLaborRate.toFixed(2)} set in input field. You can modify it if needed.`);
        setShowLaborRateInput(true); // Show input field so user can see/modify the value
        setLaborRateConfirmed(true);
      } else {
        // No previous week rate available, show input field
        setShowLaborRateInput(true);
        setLaborRateConfirmed(true);
        message.info('No previous week rate available. Please enter your labor rate below');
      }
    } else if (choice === 'current') {
      // User wants to use current rate (explicitly)
      setSelectedLaborRateChoice('current'); // Track the choice
      message.success(`Using current labor rate of $${formData.weeklyTotals.average_hourly_rate || 0}`);
      setShowLaborRateInput(false);
      setLaborRateConfirmed(true);
    } else if (choice === 'continue') {
      // User wants to continue with current labor rate
      setSelectedLaborRateChoice('current'); // Track as current
      message.success('Continuing with current labor rate settings');
      setShowLaborRateInput(false);
      setLaborRateConfirmed(true);
    } else {
      // Default fallback
      setSelectedLaborRateChoice(null);
      setShowLaborRateInput(true);
      setLaborRateConfirmed(true);
      message.info('Please enter your new average hourly rate below');
    }
  };

  // Handle user choice in week confirmation modal
  const handleWeekConfirmationChoice = async (proceed) => {
    setShowWeekConfirmationModal(false);
    
    if (proceed) {
      // User confirmed they want to proceed with this week
      setWeekConfirmed(true);
      weekInitiallyConfirmedRef.current = true; // Mark week as initially confirmed
      
      // Now proceed with the normal initialization
      const initializeModal = async () => {
        await fetchAverageHourlyRate();
        initializeFormData();
      };
      
      await initializeModal();
      
      // Show labor rate confirmation modal if needed
      // Only show if there's no existing data (new entry only, not editing)
      const hasExistingData = selectedWeekData.dailyData && selectedWeekData.dailyData.length > 0;
      
      if (restaurantGoals && restaurantGoals.forward_previous_week_rate === false && !hasExistingData) {
        setShowPopupDelay(true);
        
        const popupTimer = setTimeout(() => {
          setShowLaborRateConfirmationModal(true);
          setLaborRateConfirmed(false);
          setShowPopupDelay(false);
        }, 1500);
        
        return () => {
          clearTimeout(popupTimer);
        };
      } else if (restaurantGoals && restaurantGoals.forward_previous_week_rate === true) {
        setLaborRateConfirmed(true);
        setShowLaborRateInput(false);
      } else if (hasExistingData) {
        // If editing existing data, skip the confirmation modal
        setLaborRateConfirmed(true);
        setShowLaborRateInput(false);
      }
    } else {
      // User cancelled - close the modal
      onCancel();
    }
  };

  // Calculate actual sales budget ratio
  const calculateActualSalesBudget = (budgetedSales, netSales) => {
    if (budgetedSales === 0) return 0;
    return ((netSales - budgetedSales) / budgetedSales) * 100;
  };

  // Calculate average daily ticket
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

  // Handle input change with closed day validation
  const handleInputChange = (dayIndex, field, value, record) => {
    // Allow changes to restaurant_open field even when day is closed
    if (isDayClosed(record) && field !== 'restaurant_open') {
      message.warning(`Cannot add data for ${record.dayName} - Restaurant is closed on this day.`);
      return;
    }
    handleDailyDataChange(dayIndex, field, value);
  };

  // Check if all days are closed
  const areAllDaysClosed = () => {
    return formData.dailyData.every(day => day.restaurant_open === 0);
  };

  // Check if any budgeted sales are entered
  const hasBudgetedSales = () => {
    return formData.dailyData.some(day => day.budgetedSales && day.budgetedSales > 0);
  };

  // Check for open days without budgeted sales
  const checkOpenDaysWithoutBudget = () => {
    const openDaysWithoutBudget = formData.dailyData.filter(day => 
      day.restaurant_open === 1 && (!day.budgetedSales || day.budgetedSales === 0)
    );
    return openDaysWithoutBudget;
  };

  // Check if save button should be disabled
  const isSaveButtonDisabled = () => {
    return !hasBudgetedSales();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CalculatorOutlined className="text-blue-500" />
          <span>Add Sales Data for Week {selectedWeekData?.weekNumber || ''}</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
                 <Button 
           key="submit" 
           type="primary" 
           icon={<SaveOutlined />}
           onClick={handleSubmit} 
           loading={isSubmitting || storeLoading}
           disabled={isSaveButtonDisabled()}
         >
           Save Sales Data
         </Button>
      ]}
      width="90vw"
      style={{ maxWidth: '1200px' }}
      destroyOnHidden
    >
      {(isSubmitting || storeLoading) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">Saving sales data...</p>
          </div>
        </div>
      )}



      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Weekly Totals Section - Only show when not auto-opened from summary */}
        {!autoOpenFromSummary && (
          <Card 
            title="Weekly Totals" 
            size="small"
            extra={
              <div className="text-xs text-gray-500">
                {formData.dailyData.filter(day => day.restaurant_open === 1).length} of 7 days open
                {areAllDaysClosed() && (
                  <span className="text-red-500 ml-2">⚠️ All days are closed</span>
                )}
              </div>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div>
                  <Text strong className="text-sm">Sales Budget:</Text>
                  <Input
                    type="number"
                    value={formData.weeklyTotals.salesBudget}
                    onChange={(e) => handleWeeklyTotalsChange('salesBudget', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div>
                  <Text strong className="text-sm">Actual Sales - In Store:</Text>
                  <Input
                    type="number"
                    value={formData.weeklyTotals.actualSalesInStore}
                    onChange={(e) => handleWeeklyTotalsChange('actualSalesInStore', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div>
                  <Text strong className="text-sm">Actual Sales - App/Online:</Text>
                  <Input
                    type="number"
                    value={formData.weeklyTotals.actualSalesAppOnline}
                    onChange={(e) => handleWeeklyTotalsChange('actualSalesAppOnline', parseFloat(e.target.value) || 0)}
                    prefix="$"
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div>
                  <Text strong className="text-sm">Daily Tickets:</Text>
                  <Input
                    type="number"
                    value={formData.weeklyTotals.dailyTickets}
                    onChange={(e) => handleWeeklyTotalsChange('dailyTickets', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </Col>
            </Row>


            {/* Dynamic Provider Fields */}
            {getProviders().length > 0 && (
              <>
                <Divider orientation="left">Third Party Sales</Divider>
                <Row gutter={[16, 16]}>
                  {getProviders().map((provider) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={provider.provider_name}>
                      <div>
                        <Text strong className="text-sm">Actual Sales - {provider.provider_name}:</Text>
                        <Input
                          type="number"
                          value={formData.weeklyTotals[`actualSales${provider.provider_name.replace(/\s+/g, '')}`] || 0}
                          onChange={(e) => {
                            const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                            handleWeeklyTotalsChange(providerKey, parseFloat(e.target.value) || 0);
                          }}
                          prefix="$"
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            )}
          </Card>
        )}

        {/* Labor Rate Input - Always show when user wants to change labor rate */}
       
        {showLaborRateInput && (
          <Card 
            title={
              <div className="flex items-center justify-between w-full">
                <span>Labor Rate Settings</span>
                <Button 
                  type="text" 
                  size="small" 
                  onClick={() => setShowLaborRateInput(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕ Close
                </Button>
              </div>
            }
            size="small"
            style={{ borderColor: '#1890ff', borderWidth: '2px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div>
                  <Text strong className="text-sm">Average Hourly Rate:</Text>
                  <Input
                    type="number"
                    value={formData.weeklyTotals.average_hourly_rate}
                    onChange={(e) => handleLaborRateChange(e.target.value)}
                    prefix="$"
                    placeholder="0.00"
                    className="mt-1"
                    style={{ borderColor: '#1890ff' }}
                  />
                  <Text type="secondary" className="text-xs mt-1 block">
                    Enter your current average hourly labor rate
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* Edit Weekly Rate Button - Show only when "Use Current Rate" was selected */}
        {laborRateConfirmed && selectedLaborRateChoice === 'current' && !showLaborRateInput && (
          <Card 
            size="small"
            style={{ borderColor: '#faad14', borderWidth: '2px', backgroundColor: '#fffbe6' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <Text strong className="text-sm block mb-1">
                  Current Labor Rate: ${formData.weeklyTotals.average_hourly_rate || 0}
                </Text>
                <Text type="secondary" className="text-xs">
                  Using current labor rate. Click below to edit if needed.
                </Text>
              </div>
              <Button 
                onClick={() => setShowEditWeeklyRateWarningModal(true)}
                icon={<EditOutlined />}
                style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: 'white' }}
              >
                Edit Weekly Rate
              </Button>
            </div>
          </Card>
        )}

        {/* Daily Data Table */}
        <Card 
          title="Daily Sales Data"
          size="small"
          extra={
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>💡 Toggle switches control restaurant open/closed status for each day</span>
              {!hasBudgetedSales() && (
                <span className="text-red-500 ml-2">⚠️ Budgeted sales required to save</span>
              )}
            </div>
          }
        >
          <div className="overflow-x-auto">
            <Table
              dataSource={formData.dailyData}
              pagination={false}
              size="small"
              rowKey={(record) => record.key}
              scroll={{ x: 'max-content' }}
                             rowClassName={(record) => isDayClosed(record) ? 'opacity-50 bg-gray-50' : ''}
              summary={(pageData) => {
                const currentProviders = getProviders();
                const totals = pageData.reduce((acc, record) => {
                  acc.budgetedSales += parseFloat(record.budgetedSales) || 0;
                  acc.actualSalesInStore += parseFloat(record.actualSalesInStore) || 0;
                  acc.actualSalesAppOnline += parseFloat(record.actualSalesAppOnline) || 0;
                  acc.dailyTickets += parseFloat(record.dailyTickets) || 0;
                  
                  currentProviders.forEach(provider => {
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
                  ...currentProviders.reduce((acc, provider) => {
                    const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                    acc[providerKey] = 0;
                    return acc;
                  }, {})
                });

                const netSalesActualTotal = totals.actualSalesInStore + totals.actualSalesAppOnline + 
                  currentProviders.reduce((sum, provider) => {
                    const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                    return sum + totals[providerKey];
                  }, 0);

                if (autoOpenFromSummary) {
                  // Only show budgeted sales total when auto-opened from summary
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
                    </Table.Summary.Row>
                  );
                }

                // Show all totals when not auto-opened from summary
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
                    {currentProviders.map((provider, index) => {
                      const providerKey = `actualSales${provider.provider_name.replace(/\s+/g, '')}`;
                      return (
                        <Table.Summary.Cell key={providerKey} index={5 + index}>
                          <Text strong style={{ color: '#1890ff' }}>${totals[providerKey]?.toFixed(2) || '0.00'}</Text>
                        </Table.Summary.Cell>
                      );
                    })}
                    <Table.Summary.Cell index={5 + currentProviders.length}>
                      <Text strong style={{ color: '#1890ff' }}>${netSalesActualTotal.toFixed(2)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6 + currentProviders.length}>
                      <Text strong style={{ color: '#1890ff' }}>{totals.dailyTickets.toFixed(0)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7 + currentProviders.length}>
                      <Text strong style={{ color: '#1890ff' }}>
                        {totals.budgetedSales > 0 && netSalesActualTotal > 0 
                          ? calculateActualSalesBudget(totals.budgetedSales, netSalesActualTotal).toFixed(1) 
                          : '0.0'}%
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8 + currentProviders.length}>
                      <Text strong style={{ color: '#1890ff' }}>
                        {totals.dailyTickets > 0 
                          ? calculateAverageDailyTicket(netSalesActualTotal, totals.dailyTickets) 
                          : 0}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
              columns={autoOpenFromSummary ? [
                // Only show Day, Days Open, and Budgeted Sales when auto-opened from summary
                {
                  title: 'Day',
                  dataIndex: 'dayName',
                  key: 'dayName',
                  width: 160,
                  fixed: 'left',
                  render: (text, record) => {
                    const isAutoClosed = shouldDayBeClosed(record.dayName);
                    const needsBudget = record.restaurant_open === 1 && (!record.budgetedSales || record.budgetedSales === 0);
                    return (
                      <div className="min-w-[160px]">
                        <div className="font-medium flex items-center gap-2">
                          {text}
                          {isDayClosed(record) && (
                            <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                              isAutoClosed 
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
                  title: 'Days Open',
                  dataIndex: 'restaurant_open',
                  key: 'restaurant_open',
                  width: 140,
                  render: (isOpen, record, index) => (
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <ToggleSwitch
                        isOn={typeof isOpen === 'boolean' ? isOpen : isOpen === 1}
                        setIsOn={(checked) => handleDailyDataChange(index, 'restaurant_open', checked ? 1 : 0)}
                        size="large"
                      />
                      <span className={`text-xs font-medium ${(typeof isOpen === 'boolean' ? isOpen : isOpen === 1) ? 'text-green-600' : 'text-red-600'}`}>
                        {(typeof isOpen === 'boolean' ? isOpen : isOpen === 1) ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  )
                },
                 {
                   title: 'Budgeted Sales',
                   dataIndex: 'budgetedSales',
                   key: 'budgetedSales',
                   width: 140,
                   render: (value, record, index) => (
                     <Input
                       type="number"
                       value={value}
                       onChange={(e) => handleInputChange(index, 'budgetedSales', parseFloat(e.target.value) || 0, record)}
                       onBlur={(e) => handleBudgetedSalesBlur(index, parseFloat(e.target.value) || 0, record)}
                       placeholder="0.00"
                       className="w-full"
                       disabled={isDayClosed(record)}
                       style={{ 
                         opacity: isDayClosed(record) ? 0.5 : 1,
                         cursor: isDayClosed(record) ? 'not-allowed' : 'text'
                       }}
                     />
                   )
                 }
               ] : [
                // Show all columns when not auto-opened from summary
                {
                  title: 'Day',
                  dataIndex: 'dayName',
                  key: 'dayName',
                  width: 160,
                  fixed: 'left',
                  render: (text, record) => {
                    const isAutoClosed = shouldDayBeClosed(record.dayName);
                    const needsBudget = record.restaurant_open === 1 && (!record.budgetedSales || record.budgetedSales === 0);
                    return (
                      <div className="min-w-[160px]">
                        <div className="font-medium flex items-center gap-2">
                          {text}
                          {isDayClosed(record) && (
                            <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                              isAutoClosed 
                                ? 'bg-orange-100 text-orange-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {isAutoClosed ? 'AUTO-CLOSED' : 'CLOSED'}
                            </span>
                          )}
                          {needsBudget && (
                            <span className="text-xs px-2 py-1 rounded whitespace-nowrap bg-orange-100 text-orange-600 flex items-center gap-1">
                              <ExclamationCircleOutlined />
                              NEEDS BUDGET
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
                  title: 'Days Open',
                  dataIndex: 'restaurant_open',
                  key: 'restaurant_open',
                  width: 140,
                  render: (isOpen, record, index) => (
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <ToggleSwitch
                        isOn={typeof isOpen === 'boolean' ? isOpen : isOpen === 1}
                        setIsOn={(checked) => handleDailyDataChange(index, 'restaurant_open', checked ? 1 : 0)}
                        size="large"
                      />
                      <span className={`text-xs font-medium ${(typeof isOpen === 'boolean' ? isOpen : isOpen === 1) ? 'text-green-600' : 'text-red-600'}`}>
                        {(typeof isOpen === 'boolean' ? isOpen : isOpen === 1) ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  )
                },
                {
                  title: 'Budgeted Sales',
                  dataIndex: 'budgetedSales',
                  key: 'budgetedSales',
                  width: 140,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleInputChange(index, 'budgetedSales', parseFloat(e.target.value) || 0, record)}
                      onBlur={(e) => handleBudgetedSalesBlur(index, parseFloat(e.target.value) || 0, record)}
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
                      type="number"
                      value={value}
                      onChange={(e) => handleInputChange(index, 'actualSalesInStore', parseFloat(e.target.value) || 0, record)}
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
                      type="number"
                      value={value}
                      onChange={(e) => handleInputChange(index, 'actualSalesAppOnline', parseFloat(e.target.value) || 0, record)}
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
                ...getProviders().map(provider => ({
                  title: `Actual Sales - ${provider.provider_name}`,
                  dataIndex: `actualSales${provider.provider_name.replace(/\s+/g, '')}`,
                  key: `actualSales${provider.provider_name.replace(/\s+/g, '')}`,
                  width: 150,
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleInputChange(index, `actualSales${provider.provider_name.replace(/\s+/g, '')}`, parseFloat(e.target.value) || 0, record)}
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
                    const currentProviders = getProviders();
                    const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                    const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                    const providerSales = currentProviders.reduce((sum, provider) => {
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
                  render: (value, record, index) => (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleInputChange(index, 'dailyTickets', parseFloat(e.target.value) || 0, record)}
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
                    const currentProviders = getProviders();
                    const budgetedSales = parseFloat(record.budgetedSales) || 0;
                    const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                    const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                    const providerSales = currentProviders.reduce((sum, provider) => {
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
                    const currentProviders = getProviders();
                    const actualSalesInStore = parseFloat(record.actualSalesInStore) || 0;
                    const actualSalesAppOnline = parseFloat(record.actualSalesAppOnline) || 0;
                    const providerSales = currentProviders.reduce((sum, provider) => {
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
      </Space>

 
      <Modal
        title={
          <div className="flex items-center gap-2" >
            <UserOutlined className="text-blue-500" />
            <span>Labor Rate Confirmation</span>
          </div>
        }
        open={showLaborRateConfirmationModal}
        onCancel={() => handleLaborRateConfirmationChoice(true)} // Default to continue if user closes modal
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Button 
              onClick={() => handleLaborRateConfirmationChoice('previous')}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white' }}
            >
              {previousWeekLaborRate ? 
                `Use Last Week's Rate ($${previousWeekLaborRate.toFixed(2)})` :
                'Update Labor Rate'
              }
            </Button>
            <div style={{ display: 'flex', gap: '8px' }}>
              {previousWeekLaborRate ? (
                <Button 
                  onClick={() => handleLaborRateConfirmationChoice('current')}
                  icon={<CalculatorOutlined />}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}
                >
                  Use Current Rate (${formData.weeklyTotals.average_hourly_rate || 0})
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  onClick={() => handleLaborRateConfirmationChoice('continue')}
                  icon={<CalculatorOutlined />}
                >
                  Continue
                </Button>
              )}
            </div>
          </div>
        }
        width={500}
        destroyOnClose
        closable={true}
        maskClosable={false}
        zIndex={1001}
      >
        <div className="text-center">
          <QuestionCircleOutlined 
            className="text-6xl text-blue-500 mb-4" 
            style={{ fontSize: '64px' }}
          />
          <Title level={4} className="mb-4" >
            {previousWeekLaborRate ? 
              `Last week's labor rate was $${previousWeekLaborRate.toFixed(2)}. Would you like to use that labor rate this week?` :
              'Would you like to update your average hourly labor rate?'
            }
          </Title>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <Text strong className="text-blue-700 mb-2 block">
              {previousWeekLaborRate ? 
                'Labor rate information:' :
                'Before adding sales data, please confirm your labor rate:'
              }
            </Text>
            <div className="text-sm text-blue-600 space-y-1">
              {previousWeekLaborRate ? (
                <>
                  <p>• Last week's average hourly rate: <strong>${previousWeekLaborRate.toFixed(2)}</strong></p>
                  <p>• Current average hourly rate: <strong>${formData.weeklyTotals.average_hourly_rate || 0}</strong></p>
                  <p>• You can use last week's rate or enter a new one</p>
                  <p>• Accurate labor rates ensure better profit/loss analysis</p>
                </>
              ) : (
                <>
                  <p>• Current average hourly rate: <strong>${formData.weeklyTotals.average_hourly_rate || 0}</strong></p>
                  <p>• Average hourly rate will be used for labor cost calculations</p>
                  <p>• You can update the rate if needed</p>
                  <p>• Accurate labor rates ensure better profit/loss analysis</p>
                </>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>Continue:</strong> {previousWeekLaborRate ? 
                `Use last week's rate of $${previousWeekLaborRate.toFixed(2)}` :
                'Continue with current labor rate'
              }
            </p>
            <p>
              <strong>Update Labor Rate:</strong> Enter a new average hourly rate
            </p>
          </div>
        </div>
      </Modal>

      {/* Edit Weekly Rate Warning Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <WarningOutlined className="text-orange-500" />
            <span>Warning: Edit Weekly Rate</span>
          </div>
        }
        open={showEditWeeklyRateWarningModal}
        onCancel={() => {
          setShowEditWeeklyRateWarningModal(false);
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setShowEditWeeklyRateWarningModal(false);
            }}
          >
            Cancel
          </Button>,
          <Button 
            key="proceed" 
            type="primary" 
            onClick={() => {
              setShowEditWeeklyRateWarningModal(false);
              setShowLaborRateInput(true);
              message.info('You can now edit the weekly labor rate in the input field below.');
            }}
            icon={<EditOutlined />}
            style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: 'white' }}
          >
            Proceed to Edit
          </Button>
        ]}
        width={500}
        destroyOnClose
        closable={true}
        maskClosable={false}
        zIndex={1001}
      >
        <div className="text-center">
          <WarningOutlined 
            className="text-6xl text-orange-500 mb-4" 
            style={{ fontSize: '64px' }}
          />
          <Title level={4} className="mb-4">
            Warning: Editing Weekly Labor Rate
          </Title>
          
          <div className="bg-orange-50 p-4 rounded-lg mb-4">
            <Text strong className="text-orange-700 mb-2 block">
              Important Information:
            </Text>
            <div className="text-sm text-orange-600 space-y-1">
              <p>• Last week's rate: <strong>${previousWeekLaborRate?.toFixed(2) || 'N/A'}</strong></p>
              <p>• Current rate: <strong>${formData.weeklyTotals.average_hourly_rate || 0}</strong></p>
              <p>• Changing the labor rate will affect profit/loss calculations</p>
              <p>• Make sure the new rate is accurate for this week</p>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>Proceed to Edit:</strong> Open the labor rate input field to edit the rate
            </p>
            <p>
              <strong>Cancel:</strong> Return to the sales data form without editing the rate
            </p>
          </div>
        </div>
      </Modal>

      {/* Budget Validation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined className="text-orange-500" />
            <span>Missing Sales Budgets</span>
          </div>
        }
        open={showBudgetValidationModal}
        onCancel={() => setShowBudgetValidationModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowBudgetValidationModal(false)}>
            Cancel
          </Button>,
          <Button 
            key="no" 
            onClick={() => handleBudgetValidationChoice(false)}
            style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: 'white' }}
          >
            No, Save with $0
          </Button>,
          <Button 
            key="yes" 
            type="primary" 
            onClick={() => handleBudgetValidationChoice(true)}
            icon={<DollarOutlined />}
          >
            Yes, Add Budgets
          </Button>
        ]}
        width={500}
        destroyOnClose
      >
        <div className="text-center">
          <ExclamationCircleOutlined 
            className="text-6xl text-orange-500 mb-4" 
            style={{ fontSize: '64px' }}
          />
          <Title level={4} className="mb-4">
            Some open days don't have sales budgets. Add them now?
          </Title>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <Text strong className="text-gray-700 mb-2 block">
              The following days are open but have $0 budgeted sales:
            </Text>
            <div className="space-y-2">
              {openDaysWithoutBudget.map((day, index) => (
                <div key={day.key} className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="font-medium">{day.dayName}</span>
                  <span className="text-red-500 font-bold">${day.budgetedSales || 0}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>Yes:</strong> Add budgeted sales for these days before saving
            </p>
            <p>
              <strong>No:</strong> Save the data with $0 budgeted sales for these days
            </p>
          </div>
        </div>
      </Modal>

      {/* Week Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-blue-500" />
            <span>Week Selection Confirmation</span>
          </div>
        }
        open={showWeekConfirmationModal}
        onCancel={() => handleWeekConfirmationChoice(false)}
        footer={[
          <Button key="cancel" onClick={() => handleWeekConfirmationChoice(false)}>
            Cancel
          </Button>,
          <Button 
            key="proceed" 
            type="primary" 
            onClick={() => handleWeekConfirmationChoice(true)}
            icon={<CalendarOutlined />}
            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
          >
            Yes, Proceed
          </Button>
        ]}
        width={600}
        destroyOnClosenpm
        maskClosable={false}
        zIndex={1002}
      >
        <div className="text-center">
          <WarningOutlined 
            className="text-6xl mb-4" 
            style={{ fontSize: '64px', color: weekStatus?.isPastWeek ? '#ff4d4f' : '#ff4d4f' }}
          />
          <Title level={4} className="mb-4">
            {weekStatus?.isPastWeek ? 'Adding Data to Past Week' : 'Adding Data to Future Week'}
          </Title>
          
          <div className={`p-4 rounded-lg mb-4 ${
            weekStatus?.isPastWeek ? 'bg-red-50 border border-red-200' : 'bg-red-50 border border-red-200'
          }`}>
            <Text strong className={`mb-2 block ${
              weekStatus?.isPastWeek ? 'text-red-700' : 'text-red-700'
            }`}>
              Week Information:
            </Text>
            <div className={`text-sm space-y-1 ${
              weekStatus?.isPastWeek ? 'text-red-600' : 'text-red-600'
            }`}>
              <p>• Selected week: <strong>{weekStatus?.weekStart} - {weekStatus?.weekEnd}</strong></p>
              <p>• Current week: <strong>{weekStatus?.currentWeekStart} - {weekStatus?.currentWeekEnd}</strong></p>
              <p>• Week difference: <strong>{Math.abs(weekStatus?.daysDifference || 0)} days {weekStatus?.isPastWeek ? 'ago' : 'ahead'}</strong></p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <Text strong className="text-blue-700 mb-2 block">
              {weekStatus?.isPastWeek ? 'Past Week Warning:' : 'Future Week Warning:'}
            </Text>
            <div className="text-sm text-blue-600 space-y-1">
              {weekStatus?.isPastWeek ? (
                <>
                  <p>• You are adding sales data to a week that has already passed</p>
                  <p>• This may affect historical reporting and analysis</p>
                  <p>• Make sure you have the correct week selected</p>
                  <p>• Consider if this data should be added to the current week instead</p>
                </>
              ) : (
                <>
                  <p>• You are adding sales data to a future week</p>
                  <p>• This is typically used for planning and forecasting</p>
                  <p>• Make sure you have the correct week selected</p>
                  <p>• Consider if this data should be added to the current week instead</p>
                </>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>Proceed:</strong> Continue adding data to this week
            </p>
            <p>
              <strong>Cancel:</strong> Close this dialog and select a different week
            </p>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default SalesDataModal;
