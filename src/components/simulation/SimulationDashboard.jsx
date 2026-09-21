import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Select, InputNumber, Button, Card, Table, Tag, message, Modal, Input, Popconfirm } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, LoadingOutlined, EditOutlined, DeleteOutlined, DownOutlined, DatabaseOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useStore from '../../store/store';
import LoadingSpinner from '../layout/LoadingSpinner';
import { formatCurrency } from '../../utils/formatUtils';
import ChatWidget from '../chatbot/ChatWidget';
import useOnboardingStatus from '../../hooks/useOnboardingStatus';
import SimulatorCashFlow from './SimulatorCashFlow';
import SimulatorAnnualReport from './SimulatorAnnualReport';

const { Option } = Select;

const AUTO_SAVE_DEBOUNCE_MS = 700;
const SAVED_MESSAGE_DURATION_MS = 2500;

const clampGoalPct = (value) => {
  const n = Math.round(Number(value) || 0);
  if (n < 1) return 1;
  if (n > 80) return 80;
  return n;
};

const PERIOD_OPTIONS = ['daily', 'weekly', 'monthly'];

const generateLaborPercentOptions = () => {
  const options = [];
  for (let i = 1; i <= 80; i += 1) {
    let zoneColor = '#52c41a';
    let zoneLabel = ' (Goal)';
    if (i >= 31 && i <= 32) {
      zoneColor = '#faad14';
      zoneLabel = ' (Needs Attention)';
    } else if (i >= 33) {
      zoneColor = '#ff4d4f';
      zoneLabel = ' (Danger)';
    }
    options.push({
      value: i,
      label: (
        <span style={{ color: zoneColor }}>
          {i}%{zoneLabel}
        </span>
      )
    });
  }
  return options;
};

const generateCogsPercentOptions = () => {
  const options = [];
  for (let i = 1; i <= 80; i += 1) {
    let zoneColor = '#52c41a';
    let zoneLabel = ' (Goal)';
    if (i >= 32 && i <= 33) {
      zoneColor = '#faad14';
      zoneLabel = ' (Needs Attention)';
    } else if (i >= 34) {
      zoneColor = '#ff4d4f';
      zoneLabel = ' (Danger)';
    }
    options.push({
      value: i,
      label: (
        <span style={{ color: zoneColor }}>
          {i}%{zoneLabel}
        </span>
      )
    });
  }
  return options;
};

const EXPENSE_TYPE_OPTIONS = [
  { value: 'fixed_value', label: 'Fixed Value ($)' },
  { value: 'percentage', label: 'Percentage (%)' }
];

const EXPENSE_FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' }
];

const SimulationDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [dashboardParams, setDashboardParams] = useState({
    year: currentYear,
    month: currentMonth,
    added_customer_per_day: 5,
    labour_goal: 28, // Labor as % of sales (simulator modifier)
    cogs_goal: 30, // COGS as % of sales (simulator modifier)
    days: 0,
    profit_loss: 0,
    average_ticket_per_customer: 20
  });
  const {
    simulationDashboardData,
    simulationDashboardLoading,
    simulationDashboardError,
    createSimulationDashboard,
    getSimulationOnboardingStatus,
    getSimulationDashboard,
    submitSimulationOnboarding,
    getDays,
    daysLoading,
    daysError,
    selectedLocationId,
    previewSimulationActuals,
    importSimulationActuals,
    listSimulationSaves,
    saveSimulationScenario,
    deleteSimulationSave,
  } = useStore();

  const [restaurantId, setRestaurantId] = useState(null);
  const [period, setPeriod] = useState(() => {
    const p = searchParams.get('period');
    return PERIOD_OPTIONS.includes(p) ? p : 'daily';
  });
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const debounceRef = useRef(null);
  const isSavingRef = useRef(false);
  const savedMessageTimerRef = useRef(null);
  const isInitialMountRef = useRef(true);
  const skipAutoSaveRef = useRef(false);
  const applyingScenarioRef = useRef(false);
  const latestParamsRef = useRef({ dashboardParams, period, restaurantId });
  latestParamsRef.current = { dashboardParams, period, restaurantId };

  // Get onboarding status to check if regular users have completed onboarding
  const {
    hasRegularRestaurants,
    hasCompletedRegularOnboarding
  } = useOnboardingStatus();

  // Load restaurant ID and dashboard data on mount
  // Also check if onboarding is complete - redirect if not
  useEffect(() => {
    const loadData = async () => {
      // Check if regular user has completed onboarding
      if (hasRegularRestaurants && !hasCompletedRegularOnboarding) {
        message.warning('Please complete your onboarding to access Simulation Dashboard.');
        navigate('/onboarding', { replace: true });
        return;
      }

      let id = null;
      let restaurantName = null;
      let onboardingComplete = false;

      // Use only simulation restaurant ID for simulation APIs (never regular restaurant ID)
      const storedSimulationId = localStorage.getItem('simulation_restaurant_id');
      if (storedSimulationId) {
        id = parseInt(storedSimulationId, 10);
        if (!Number.isNaN(id)) setRestaurantId(id);
      }

      // Always check onboarding status to verify completion
      // CRITICAL: Use forceRefresh=true to bypass cache and get fresh data
      // This ensures we get the latest onboarding status after POST
      
      // Clear sessionStorage flags to ensure fresh API call
      sessionStorage.removeItem('hasCheckedSimulationOnboardingGlobal');
      sessionStorage.removeItem('simulationOnboardingLastCheckTime');
      
      const statusResult = await getSimulationOnboardingStatus(true); // Force refresh
      
      
      if (statusResult.success && statusResult.data?.restaurants?.length > 0) {
        const restaurant = statusResult.data.restaurants[statusResult.data.restaurants.length - 1] || statusResult.data.restaurants[0];
        id = restaurant.simulation_restaurant_id;
        restaurantName = restaurant.simulation_restaurant_name;
        onboardingComplete = restaurant.simulation_onboarding_complete === true;
        
        
        setRestaurantId(id);
        localStorage.setItem('simulation_restaurant_id', id);
        
        // If onboarding is not complete or name is null, redirect to onboarding
        if (restaurantName === null || onboardingComplete === false) {
          console.warn('⚠️ [SimulationDashboard] Onboarding not complete, redirecting to onboarding');
          message.warning('Please complete onboarding before accessing the dashboard.');
          navigate('/onboarding/simulation', { replace: true });
          return;
        }
        
        // Allow access to simulation dashboard if simulation onboarding is complete
        // The route guard in ProtectedRoutes.jsx handles the case where simulation onboarding API has no restaurants
        // If user explicitly navigates to /simulation/dashboard, they should be allowed to access it
      } else {
        // No restaurant found in simulation onboarding API, redirect to onboarding
        console.warn('⚠️ [SimulationDashboard] No restaurant found in simulation onboarding API, redirecting to onboarding');
        message.warning('Please complete onboarding before accessing the dashboard.');
        navigate('/onboarding/simulation', { replace: true });
        return;
      }
      
      // Load dashboard data if restaurant ID is available and onboarding is complete
      if (id && onboardingComplete && restaurantName !== null) {
        const y = searchParams.get('year');
        const m = searchParams.get('month');
        const p = searchParams.get('period');
        const year = y ? parseInt(y, 10) : currentYear;
        const month = m ? parseInt(m, 10) : currentMonth;
        const periodVal = PERIOD_OPTIONS.includes(p) ? p : 'daily';
        setDashboardParams(prev => ({ ...prev, year, month }));
        setPeriod(periodVal);
        setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.set('restaurant_id', String(id));
          next.set('year', String(year));
          next.set('month', String(month));
          next.set('period', periodVal);
          return next;
        }, { replace: true });
      }
    };
    loadData();
  }, [getSimulationOnboardingStatus, navigate, hasRegularRestaurants, hasCompletedRegularOnboarding]);

  // Fetch dashboard when restaurantId is set or when year, month, period change (syncs URL and calls API)
  useEffect(() => {
    if (!restaurantId) return;
    const { year, month } = dashboardParams;
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('restaurant_id', String(restaurantId));
      next.set('year', String(year));
      next.set('month', String(month));
      next.set('period', period);
      return next;
    }, { replace: true });
    if (applyingScenarioRef.current) return;
    getSimulationDashboard(restaurantId, year, month, period);
  }, [restaurantId, dashboardParams.year, dashboardParams.month, period]);

  // Fetch days when restaurantId or month/year changes
  useEffect(() => {
    const fetchDaysData = async () => {
      if (!restaurantId) return;
      if (applyingScenarioRef.current) return;

      const result = await getDays(dashboardParams.year, dashboardParams.month, restaurantId);
      if (result.success && result.data && result.data.working_days_count !== undefined) {
        setDashboardParams(prev => ({ ...prev, days: result.data.working_days_count }));
      } else if (result.error) {
        message.error(result.error);
      }
    };

    fetchDaysData();
  }, [dashboardParams.year, dashboardParams.month, restaurantId, getDays]);

  // Shared save: create then fetch. Reads latest params from ref so debounced auto-save always uses current values (e.g. after getDays updates days).
  const saveForecast = useCallback(async (options = {}) => {
    const { showSuccessToast = false, paramsOverride, periodOverride } = options;
    const { dashboardParams: stored, period: storedPeriod, restaurantId: rid } = latestParamsRef.current;
    const params = { ...stored, ...(paramsOverride || {}) };
    const p = periodOverride || storedPeriod;
    if (!rid) {
      if (showSuccessToast) message.error('Restaurant ID not found. Please complete onboarding first.');
      return false;
    }
    if (isSavingRef.current) return false;

    const payload = {
      restaurant_id: rid,
      year: params.year,
      month: params.month,
      added_customer_per_day: params.added_customer_per_day,
      labour_goal: Number(params.labour_goal) || 0,
      cogs_goal: Number(params.cogs_goal) || 0,
      days: params.days,
      profit_loss: params.profit_loss,
      average_ticket_per_customer: params.average_ticket_per_customer,
      period: p
    };

    isSavingRef.current = true;
    setSaveStatus('saving');
    setSaveErrorMessage('');

    try {
      const result = await createSimulationDashboard(payload);
      if (result.success && rid) {
        await getSimulationDashboard(rid, params.year, params.month, p);
      }
      setSaveStatus('saved');
      setSaveErrorMessage('');
      if (showSuccessToast) message.success('Forecast saved successfully.');
      if (savedMessageTimerRef.current) clearTimeout(savedMessageTimerRef.current);
      savedMessageTimerRef.current = setTimeout(() => {
        setSaveStatus(null);
        savedMessageTimerRef.current = null;
      }, SAVED_MESSAGE_DURATION_MS);
      return true;
    } catch (error) {
      console.error('Error saving forecast:', error);
      const errMsg = error?.message || 'Failed to save forecast. Please try again.';
      setSaveStatus('error');
      setSaveErrorMessage(errMsg);
      message.error(errMsg);
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [createSimulationDashboard, getSimulationDashboard]);

  // Debounced auto-save when customer/day, profit_loss, or avg ticket change (skip on initial mount to avoid extra API call)
  useEffect(() => {
    if (!restaurantId) return;
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    if (skipAutoSaveRef.current) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      if (isSavingRef.current) return;
      saveForecast({ showSuccessToast: false });
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    dashboardParams.added_customer_per_day,
    dashboardParams.labour_goal,
    dashboardParams.cogs_goal,
    dashboardParams.profit_loss,
    dashboardParams.average_ticket_per_customer,
    restaurantId
  ]);

  const handleGenerate = () => {
    saveForecast({ showSuccessToast: true });
  };

  const refreshSavedSimulations = useCallback(async () => {
    if (!restaurantId) {
      setSavedSimulations([]);
      return;
    }
    const result = await listSimulationSaves(restaurantId);
    if (result.success) {
      setSavedSimulations(result.data);
    }
  }, [restaurantId, listSimulationSaves]);

  useEffect(() => {
    refreshSavedSimulations();
  }, [refreshSavedSimulations]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedMessageTimerRef.current) clearTimeout(savedMessageTimerRef.current);
    };
  }, []);

  // Generate years (current year ± 5 years)
  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  const shouldShowInitialLoading = simulationDashboardLoading && !simulationDashboardData;

  const dashboardData = simulationDashboardData && simulationDashboardData.length > 0
    ? simulationDashboardData[0]
    : null;

  // Expenses: local table state (so edits reflect immediately)
  const [expensesTableData, setExpensesTableData] = useState([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseModalSaving, setExpenseModalSaving] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    name: '',
    value_type: 'fixed_value', // 'fixed_value' | 'percentage'
    frequency: 'monthly', // 'monthly' | 'weekly'
    amount: 0
  });
  const [isTutorialModalVisible, setIsTutorialModalVisible] = useState(false);
  const [expensesExpanded, setExpensesExpanded] = useState(false);
  const [actualsPreview, setActualsPreview] = useState(null);
  const [actualsModalOpen, setActualsModalOpen] = useState(false);
  const [actualsLoading, setActualsLoading] = useState(false);
  const [savedSimulations, setSavedSimulations] = useState([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savingNamed, setSavingNamed] = useState(false);
  const [selectedSaveId, setSelectedSaveId] = useState(null);
  const [loadingSave, setLoadingSave] = useState(false);

  // Whenever dashboard data updates, sync expenses list into local table data
  useEffect(() => {
    if (!dashboardData?.expenses || !Array.isArray(dashboardData.expenses)) {
      setExpensesTableData([]);
      return;
    }
    setExpensesTableData(dashboardData.expenses);
  }, [dashboardData]);

  const openExpenseEditModal = (record) => {
    const originalAmount = record?.original_amount ?? record?.amount ?? 0;
    setSelectedExpenseId(record?.id ?? null);
    setExpenseForm({
      category: record?.category || '',
      name: record?.name || '',
      value_type: record?.value_type === 'percentage' ? 'percentage' : 'fixed_value',
      frequency: 'monthly',
      amount: Number(originalAmount) || 0
    });
    setIsExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    if (expenseModalSaving) return;
    setIsExpenseModalOpen(false);
    setSelectedExpenseId(null);
  };

  const buildExpensesStepPayload = (list) => {
    // Convert dashboard expense shape -> simulation onboarding "Expenses" step payload
    return (list || []).map((exp) => {
      const valueType = exp?.value_type === 'percentage' ? 'percentage' : 'fixed_value';
      const originalAmount = exp?.original_amount ?? exp?.amount ?? 0;
      return {
        category: exp?.category || '',
        name: exp?.name || '',
        orignal_amount: Number(originalAmount) || 0,
        is_value_type: valueType !== 'percentage',
        amount: Number(originalAmount) || 0,
        expense_type: exp?.expense_type || exp?.frequency || 'monthly',
        fixed_expense_type: exp?.expense_type || exp?.frequency || 'monthly',
        is_active: true
      };
    });
  };

  const persistExpensesToApi = async (nextList) => {
    if (!restaurantId) return false;
    setExpenseModalSaving(true);
    try {
      const payload = {
        restaurant_id: restaurantId,
        Expenses: {
          status: true,
          data: buildExpensesStepPayload(nextList)
        }
      };
      const result = await submitSimulationOnboarding(payload);
      if (!result?.success) {
        message.error(result?.error || 'Failed to update expenses.');
        return false;
      }
      await getSimulationDashboard(restaurantId, dashboardParams.year, dashboardParams.month, period);
      return true;
    } catch (e) {
      message.error(e?.message || 'Failed to update expenses.');
      return false;
    } finally {
      setExpenseModalSaving(false);
    }
  };

  const handlePreviewActuals = async () => {
    if (!restaurantId) {
      message.error('Restaurant ID not found. Please complete onboarding first.');
      return;
    }
    setActualsLoading(true);
    try {
      const result = await previewSimulationActuals(restaurantId, selectedLocationId);
      if (!result.success) {
        message.error(result.error);
        return;
      }
      setActualsPreview(result.data);
      setActualsModalOpen(true);
    } finally {
      setActualsLoading(false);
    }
  };

  const handleImportActuals = async () => {
    if (!restaurantId) return;
    setActualsLoading(true);
    skipAutoSaveRef.current = true;
    applyingScenarioRef.current = true;
    try {
      const result = await importSimulationActuals(restaurantId, selectedLocationId);
      if (!result.success) {
        message.error(result.error);
        return;
      }
      const forecast = result.data?.forecast || {};
      const nextParams = {
        ...dashboardParams,
        added_customer_per_day: Number(forecast.added_customer_per_day) || 0,
        labour_goal: clampGoalPct(forecast.labour_goal),
        cogs_goal: clampGoalPct(forecast.cogs_goal),
        average_ticket_per_customer: Number(forecast.average_ticket_per_customer) || 0,
      };
      setDashboardParams(nextParams);
      latestParamsRef.current = { dashboardParams: nextParams, period, restaurantId };
      setExpensesExpanded(true);
      await saveForecast({ paramsOverride: nextParams, showSuccessToast: false });
      setActualsModalOpen(false);
      setActualsPreview(null);
      message.success('Actuals imported into the simulator. Live restaurant budgets were not changed.');
    } finally {
      skipAutoSaveRef.current = false;
      applyingScenarioRef.current = false;
      setActualsLoading(false);
    }
  };

  const openSaveModal = () => {
    const monthLabel = months.find((m) => m.value === dashboardParams.month)?.label || '';
    setSaveName(`Simulation ${monthLabel} ${dashboardParams.year}`.trim());
    setSaveModalOpen(true);
  };

  const handleSaveNamed = async () => {
    const name = String(saveName || '').trim();
    if (!name) {
      message.error('Please enter a name for this simulation.');
      return;
    }
    if (!restaurantId) {
      message.error('Restaurant ID not found. Please complete onboarding first.');
      return;
    }
    setSavingNamed(true);
    try {
      const snapshot = {
        year: dashboardParams.year,
        month: dashboardParams.month,
        period,
        added_customer_per_day: dashboardParams.added_customer_per_day,
        labour_goal: dashboardParams.labour_goal,
        cogs_goal: dashboardParams.cogs_goal,
        days: dashboardParams.days,
        profit_loss: dashboardParams.profit_loss,
        average_ticket_per_customer: dashboardParams.average_ticket_per_customer,
        expenses: buildExpensesStepPayload(expensesTableData),
      };
      const result = await saveSimulationScenario({
        restaurantId,
        name,
        snapshot,
        applyAsBudgetGoals: false,
      });
      if (!result.success) {
        message.error(result.error);
        return;
      }
      await saveForecast({ showSuccessToast: false });
      await refreshSavedSimulations();
      if (result.data?.id) setSelectedSaveId(result.data.id);
      setSaveModalOpen(false);
      message.success(
        result.data?.created === false ? 'Simulation updated.' : 'Simulation saved.'
      );
    } finally {
      setSavingNamed(false);
    }
  };

  const handleLoadSave = async (id = selectedSaveId) => {
    const row = savedSimulations.find((item) => item.id === id);
    if (!row) {
      message.error('Select a saved simulation first.');
      return;
    }
    const snapshot = row.snapshot || {};
    const nextPeriod = PERIOD_OPTIONS.includes(snapshot.period) ? snapshot.period : period;
    const nextParams = {
      ...dashboardParams,
      year: snapshot.year || dashboardParams.year,
      month: snapshot.month || dashboardParams.month,
      added_customer_per_day: Number(snapshot.added_customer_per_day) || 0,
      labour_goal: clampGoalPct(snapshot.labour_goal ?? dashboardParams.labour_goal),
      cogs_goal: clampGoalPct(snapshot.cogs_goal ?? dashboardParams.cogs_goal),
      days: snapshot.days ?? dashboardParams.days,
      profit_loss: snapshot.profit_loss ?? dashboardParams.profit_loss,
      average_ticket_per_customer:
        Number(snapshot.average_ticket_per_customer) || dashboardParams.average_ticket_per_customer,
    };

    skipAutoSaveRef.current = true;
    applyingScenarioRef.current = true;
    setLoadingSave(true);
    try {
      setDashboardParams(nextParams);
      if (nextPeriod !== period) setPeriod(nextPeriod);
      latestParamsRef.current = { dashboardParams: nextParams, period: nextPeriod, restaurantId };

      if (Array.isArray(snapshot.expenses)) {
        const expenseResult = await submitSimulationOnboarding({
          restaurant_id: restaurantId,
          Expenses: { status: true, data: snapshot.expenses },
        });
        if (!expenseResult?.success) {
          message.error(expenseResult?.error || 'Failed to load saved expenses.');
          return;
        }
      }

      await saveForecast({
        paramsOverride: nextParams,
        periodOverride: nextPeriod,
        showSuccessToast: false,
      });
      setSelectedSaveId(row.id);
      message.success(`Loaded "${row.name}".`);
    } finally {
      skipAutoSaveRef.current = false;
      applyingScenarioRef.current = false;
      setLoadingSave(false);
    }
  };

  const handleDeleteSave = async (id) => {
    const result = await deleteSimulationSave(id);
    if (!result.success) {
      message.error(result.error);
      return;
    }
    if (selectedSaveId === id) setSelectedSaveId(null);
    await refreshSavedSimulations();
    message.success('Saved simulation deleted.');
  };

  const handleExpenseModalSave = async () => {
    if (!expenseForm.category) return message.error('Please select a category.');
    if (!String(expenseForm.name || '').trim()) return message.error('Please enter a name.');
    if ((Number(expenseForm.amount) || 0) <= 0) return message.error('Please enter a valid amount.');

    const nextList = expensesTableData.map((exp) => {
      if (exp.id !== selectedExpenseId) return exp;
      return {
        ...exp,
        category: expenseForm.category,
        name: String(expenseForm.name).trim(),
        value_type: expenseForm.value_type,
        // Persist original_amount so the user-edited amount is used for calculations on backend
        original_amount: Number(expenseForm.amount) || 0,
        // Also keep amount in UI reasonably consistent (API may recalc after save + refetch)
        amount: exp.amount
      };
    });

    // Store frequency/type on the row so payload can include them
    const nextListWithMeta = nextList.map((exp) => {
      if (exp.id !== selectedExpenseId) return exp;
      return {
        ...exp,
        expense_type: expenseForm.frequency
      };
    });

    setExpensesTableData(nextListWithMeta);
    const ok = await persistExpensesToApi(nextListWithMeta);
    if (ok) {
      message.success('Expense updated.');
      closeExpenseModal();
    }
  };

  const handleExpenseDelete = async (record) => {
    const nextList = expensesTableData.filter((e) => e.id !== record.id);
    setExpensesTableData(nextList);
    const ok = await persistExpensesToApi(nextList);
    if (ok) message.success('Expense deleted.');
  };

  const expensesColumns = useMemo(() => ([
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="blue">{category}</Tag>
      )
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      className: 'font-medium'
    },
    {
      title: 'Type',
      dataIndex: 'value_type',
      key: 'value_type',
      render: (type) => (
        <Tag color={type === 'percentage' ? 'purple' : 'green'}>
          {type === 'percentage' ? 'Percentage' : 'Fixed Value'}
        </Tag>
      )
    },
    {
      title: 'Monthly Budgeted Amount',
      dataIndex: 'original_amount',
      key: 'original_amount',
      align: 'right',
      render: (val, record) => {
        const type = record?.value_type;
        const v = Number(val ?? 0) || 0;
        return (
          <span className="font-semibold text-gray-900">
            {type === 'percentage' ? `${v}%` : formatCurrency(v)}
          </span>
        );
      }
    },
    {
      title: 'Calculated Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(amount)}
        </span>
      ),
      align: 'right'
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button size="small" icon={<EditOutlined />} onClick={() => openExpenseEditModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this expense?"
            okText="Delete"
            cancelText="Cancel"
            onConfirm={() => handleExpenseDelete(record)}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </div>
      )
    }
  ]), [expensesTableData, expenseModalSaving]);

  return (
    <div className="">
      <div className="mx-auto">
        {shouldShowInitialLoading && (
          <LoadingSpinner message="Loading dashboard..." />
        )}

        {/* Tutorial */}
        <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="font-medium text-base text-orange-600">
              Watch a tutorial on{' '}
              <button
                type="button"
                onClick={() => setIsTutorialModalVisible(true)}
                className="text-purple-600 hover:text-purple-700 underline decoration-transparent hover:decoration-current transition-colors"
                title="Watch How To Use The Simulator Tutorial"
              >
                How To Use The Simulator
              </button>
            </p>
            <button
              onClick={() => setIsTutorialModalVisible(true)}
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium text-base border border-blue-600 rounded-md px-4 py-2 w-full sm:w-auto"
              title="Watch How To Use The Simulator Tutorial"
              aria-label="Watch How To Use The Simulator Tutorial"
              type="button"
            >
              Watch Video
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h1 className="text-3xl font-bold text-orange-600 mb-2">
            Simulation Dashboard
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Forecast your restaurant's financial performance
          </p>

          {/* Generate Forecast - inputs at top (no modal) */}
          <Card title="Generate Forecast" className="mb-0 shadow-sm">
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={dashboardParams.year}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, year: value }))}
                    className="w-full"
                    size="large"
                  >
                    {years.map(year => (
                      <Option key={year} value={year}>{year}</Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                   Beginning Month <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={dashboardParams.month}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, month: value }))}
                    className="w-full"
                    size="large"
                  >
                    {months.map(month => (
                      <Option key={month.value} value={month.value}>{month.label}</Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days Open <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    value={dashboardParams.days}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, days: value || 0 }))}
                    min={0}
                    className="w-full"
                    size="large"
                    placeholder="Working days"
                    disabled={daysLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customers Per Day <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    value={dashboardParams.added_customer_per_day}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, added_customer_per_day: value || 0 }))}
                    min={0}
                    className="w-full"
                    size="large"
                    placeholder="New customers/day"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Labor as a % of Sales <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={Number(dashboardParams.labour_goal) || 0}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, labour_goal: value }))}
                    options={generateLaborPercentOptions()}
                    className="w-full"
                    size="large"
                    showSearch={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    COGS as a % of Sales <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={Number(dashboardParams.cogs_goal) || 0}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, cogs_goal: value }))}
                    options={generateCogsPercentOptions()}
                    className="w-full"
                    size="large"
                    showSearch={false}
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profit/Loss <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    value={dashboardParams.profit_loss}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, profit_loss: value || 0 }))}
                    step={0.01}
                    precision={2}
                    prefix="$"
                    className="w-full"
                    size="large"
                    placeholder="Profit/loss"
                  />
                </div> */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avg Ticket <span className="text-red-500">*</span>
                  </label>
                  <InputNumber
                    value={dashboardParams.average_ticket_per_customer}
                    onChange={(value) => setDashboardParams(prev => ({ ...prev, average_ticket_per_customer: value || 0 }))}
                    min={0}
                    step={0.01}
                    precision={2}
                    prefix="$"
                    className="w-full"
                    size="large"
                    placeholder="Per customer"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100 pt-4 mt-2">
                <div>
                  <Select
                    value={period}
                    onChange={(value) => setPeriod(value)}
                    size="large"
                    style={{ width: 160, minWidth: 160 }}
                  >
                    <Option value="daily">Daily</Option>
                    <Option value="weekly">Weekly</Option>
                    <Option value="monthly">Monthly</Option>
                  </Select>
                </div>
                <Button
                  type="primary"
                  icon={<CalendarOutlined />}
                  onClick={handleGenerate}
                  loading={simulationDashboardLoading}
                  size="large"
                  className="bg-orange-500 hover:bg-orange-600 border-orange-500"
                >
                  Generate Forecast
                </Button>
                <Button
                  icon={<DatabaseOutlined />}
                  onClick={handlePreviewActuals}
                  loading={actualsLoading}
                  size="large"
                >
                  Use actual data
                </Button>
                <Button
                  icon={<SaveOutlined />}
                  onClick={openSaveModal}
                  size="large"
                >
                  Save simulation
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={selectedSaveId ?? undefined}
                    onChange={(value) => setSelectedSaveId(value ?? null)}
                    placeholder="Saved simulations"
                    size="large"
                    style={{ width: 220, minWidth: 180 }}
                    allowClear
                    options={savedSimulations.map((row) => ({
                      value: row.id,
                      label: row.name,
                    }))}
                  />
                  <Button
                    onClick={() => handleLoadSave()}
                    loading={loadingSave}
                    disabled={!selectedSaveId}
                    size="large"
                  >
                    Load
                  </Button>
                  <Popconfirm
                    title="Delete this saved simulation?"
                    okText="Delete"
                    cancelText="Cancel"
                    onConfirm={() => handleDeleteSave(selectedSaveId)}
                    disabled={!selectedSaveId}
                  >
                    <Button danger disabled={!selectedSaveId} size="large">
                      Delete
                    </Button>
                  </Popconfirm>
                </div>
                <div className="flex items-center gap-2 text-sm min-h-[24px]">
                  {saveStatus === 'saving' && (
                    <span className="text-amber-600 flex items-center gap-1.5">
                      <LoadingOutlined />
                      Saving…
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-green-600 flex items-center gap-1.5">
                      <CheckCircleOutlined />
                      Saved
                    </span>
                  )}
                  {saveStatus === 'error' && saveErrorMessage && (
                    <span className="text-red-600" title={saveErrorMessage}>
                      Save failed. Try again or use Generate Forecast.
                    </span>
                  )}
                  {!saveStatus && (
                    <span className="text-gray-400">Changes save automatically</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {dashboardData ? (
          <>
            <SimulatorCashFlow
              cashflow={dashboardData.cashflow}
              period={period}
              customerCount={dashboardData.no_of_customer}
              profitOrLoss={dashboardData.profit_or_loss}
            />

            {restaurantId ? (
              <SimulatorAnnualReport restaurantId={restaurantId} defaultYear={dashboardParams.year} />
            ) : null}

            {/* Expenses Breakdown */}
            <Card className="shadow-md mb-6">
              <button
                type="button"
                onClick={() => setExpensesExpanded((open) => !open)}
                className="w-full flex items-center justify-between gap-3 text-left"
                aria-expanded={expensesExpanded}
              >
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Expenses Breakdown</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {expensesTableData.length} expense{expensesTableData.length === 1 ? '' : 's'}
                    {expensesExpanded ? '' : ' — click to expand'}
                  </p>
                </div>
                <DownOutlined
                  className={`text-gray-500 transition-transform duration-200 ${
                    expensesExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expensesExpanded ? (
                <div className="mt-4">
                  <Table
                    dataSource={expensesTableData}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    columns={expensesColumns}
                  />
                </div>
              ) : null}
            </Card>
          </>
        ) : (
          <>
            <Card className="shadow-md text-center py-12 mb-6">
              <CalendarOutlined className="text-5xl text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Dashboard Data
              </h3>
              <p className="text-gray-500">
                Use the form above to generate a forecast. Select year and month, enter your customer data, then click Generate Forecast.
              </p>
            </Card>
            {restaurantId ? (
              <SimulatorAnnualReport restaurantId={restaurantId} defaultYear={dashboardParams.year} />
            ) : null}
          </>
        )}
      </div>
      
      {/* Chat Widget for Simulation */}
      <ChatWidget botName="LIO Advisor" />

      <Modal
        title="How To Use The Simulator Tutorial"
        open={isTutorialModalVisible}
        onCancel={() => setIsTutorialModalVisible(false)}
        footer={[
          <Button
            key="corner"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('growlio:youtubePlayer', {
                  detail: {
                    action: 'open',
                    title: 'How To Use The Simulator Tutorial',
                    embedUrl: 'https://www.youtube.com/embed/6EPt76Z-CqM?rel=0',
                  },
                })
              );
              setIsTutorialModalVisible(false);
            }}
          >
            Play in corner
          </Button>,
          <Button
            key="open"
            type="default"
            onClick={() => {
              window.open('https://youtu.be/6EPt76Z-CqM', '_blank', 'noopener,noreferrer');
            }}
          >
            Open in new tab
          </Button>,
          <Button key="close" type="primary" onClick={() => setIsTutorialModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={900}
        centered
        destroyOnClose={true}
        maskClosable={true}
      >
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%' }}>
          <iframe
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0
            }}
            src="https://www.youtube.com/embed/6EPt76Z-CqM?rel=0"
            title="How To Use The Simulator"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        title="Edit Expense"
        open={isExpenseModalOpen}
        onCancel={closeExpenseModal}
        okText="Save"
        cancelText="Cancel"
        confirmLoading={expenseModalSaving}
        onOk={handleExpenseModalSave}
        maskClosable={!expenseModalSaving}
        destroyOnClose
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <Select
              value={expenseForm.value_type}
              onChange={(value) => setExpenseForm(prev => ({ ...prev, value_type: value }))}
              className="w-full"
            >
              {EXPENSE_TYPE_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <Select
              value={expenseForm.frequency}
              onChange={(value) => setExpenseForm(prev => ({ ...prev, frequency: value }))}
              className="w-full"
            >
              {EXPENSE_FREQUENCY_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <Input
              value={expenseForm.category}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
              placeholder="Category"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              value={expenseForm.name}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount {expenseForm.value_type === 'percentage' ? '(%)' : '($)'}
            </label>
            <InputNumber
              value={expenseForm.amount}
              onChange={(value) => setExpenseForm(prev => ({ ...prev, amount: value || 0 }))}
              min={0}
              className="w-full"
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Use actual data"
        open={actualsModalOpen}
        onCancel={() => {
          if (actualsLoading) return;
          setActualsModalOpen(false);
        }}
        okText="Import into simulator"
        cancelText="Cancel"
        confirmLoading={actualsLoading}
        onOk={handleImportActuals}
        maskClosable={!actualsLoading}
        width={640}
      >
        <p className="text-gray-700 mb-4">
          {actualsPreview?.message ||
            'Growlio will import these actuals into the simulator. Live restaurant budgets will not be changed.'}
        </p>
        {actualsPreview?.live_restaurant_name ? (
          <p className="text-sm text-gray-500 mb-4">
            Source: {actualsPreview.live_restaurant_name} (last {actualsPreview.lookback_days} days,{' '}
            {actualsPreview.open_days} open days)
          </p>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">Avg customers / day</div>
            <div className="text-lg font-semibold text-gray-900">
              {Number(actualsPreview?.avg_customers_per_day || 0).toFixed(1)}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">Current COGS %</div>
            <div className="text-lg font-semibold text-gray-900">
              {Number(actualsPreview?.cogs_pct || 0).toFixed(2)}%
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">Current labor %</div>
            <div className="text-lg font-semibold text-gray-900">
              {Number(actualsPreview?.labor_pct || 0).toFixed(2)}%
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="text-xs uppercase tracking-wide text-gray-500">Avg ticket</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(actualsPreview?.avg_ticket || 0)}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 sm:col-span-2">
            <div className="text-xs uppercase tracking-wide text-gray-500">Operating expenses / month</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(actualsPreview?.operating_expenses_monthly || 0)}
            </div>
          </div>
        </div>
        {(actualsPreview?.operating_expenses || []).length > 0 ? (
          <div className="max-h-40 overflow-y-auto text-sm text-gray-600 space-y-1">
            {(actualsPreview.operating_expenses || []).map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex justify-between gap-4">
                <span>{item.name}</span>
                <span>{formatCurrency(item.monthly_amount || item.amount || 0)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Save simulation"
        open={saveModalOpen}
        onCancel={() => {
          if (savingNamed) return;
          setSaveModalOpen(false);
        }}
        okText="Save"
        cancelText="Cancel"
        confirmLoading={savingNamed}
        onOk={handleSaveNamed}
        maskClosable={!savingNamed}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. Actuals with extra weekday covers"
              maxLength={120}
            />
            <p className="text-sm text-gray-500 mt-1">
              Saving with an existing name updates that simulation instead of creating another.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SimulationDashboard;
