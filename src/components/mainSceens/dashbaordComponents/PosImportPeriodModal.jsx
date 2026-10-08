import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Modal, Select, Spin, message } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { getDashboardData } from '../../../services/posApi';
import useStore from '../../../store/store';
import {
  annotateWeekDays,
  buildWeekDays,
  formatWeekLabel,
  getWeekStart,
  listImportWeeks,
  normalizeWeeklyDashboardPayload,
} from '../../../utils/posImportDays';

const PERIODS = [
  {
    id: 'this_week',
    title: 'This Week',
    description: 'Import all open days for the current week',
  },
  {
    id: 'specific_days',
    title: 'Select Specific Days',
    description: 'Choose individual days to import',
  },
  {
    id: 'previous_weeks',
    title: 'Previous Week(s)',
    description: 'Import data from a previous week',
  },
];

const PosImportPeriodModal = ({
  open,
  restaurantId,
  locationId,
  onCancel,
  onImport,
  confirming = false,
}) => {
  const currentWeekStart = getWeekStart();
  const requestIdRef = useRef(0);
  const [step, setStep] = useState('period');
  const [period, setPeriod] = useState('this_week');
  const [weekStart, setWeekStart] = useState(currentWeekStart.format('YYYY-MM-DD'));
  const [days, setDays] = useState([]);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [continuing, setContinuing] = useState(false);

  const [overwriteOpen, setOverwriteOpen] = useState(false);
  const [overwriteCount, setOverwriteCount] = useState(0);
  const pendingImportRef = useRef(null);

  const weekOptions = useMemo(
    () => listImportWeeks({ includeCurrent: period !== 'previous_weeks' }),
    [period]
  );

  const selectableDays = days.filter((day) => day.canImport);
  const selectedImportDates = selectedDates.filter((date) =>
    selectableDays.some((day) => day.date === date)
  );
  const selectedExistingDays = days.filter(
    (day) => selectedImportDates.includes(day.date) && day.hasExisting
  );

  const loadWeekStatus = useCallback(
    async (nextWeekStart) => {
      const week = getWeekStart(nextWeekStart).format('YYYY-MM-DD');
      const requestId = ++requestIdRef.current;
      setWeekStart(week);
      setLoadingWeek(true);
      setSelectedDates([]);
      setDays(
        buildWeekDays(week).map((day) => ({
          ...day,
          hasExisting: false,
          isOpen: true,
          canImport: !day.isFuture,
        }))
      );

      const store = useStore.getState();
      const rid =
        restaurantId ||
        store.getRestaurantIdWithFallback?.() ||
        localStorage.getItem('restaurant_id');
      const lid =
        locationId ||
        (typeof store.getSelectedLocationId === 'function'
          ? await store.getSelectedLocationId()
          : store.selectedLocationId);

      if (!rid) {
        if (requestId !== requestIdRef.current) return;
        setDays(annotateWeekDays(buildWeekDays(week), null));
        setLoadingWeek(false);
        return;
      }

      try {
        const payload = await getDashboardData({
          restaurantId: rid,
          weekStart: week,
          locationId: lid,
        });
        if (requestId !== requestIdRef.current) return;
        setDays(annotateWeekDays(buildWeekDays(week), payload));
      } catch {
        if (requestId !== requestIdRef.current) return;
        setDays(annotateWeekDays(buildWeekDays(week), null));
      } finally {
        if (requestId === requestIdRef.current) setLoadingWeek(false);
      }
    },
    [restaurantId, locationId]
  );

  useEffect(() => {
    if (!open) return;
    requestIdRef.current += 1;
    setStep('period');
    setPeriod('this_week');
    setWeekStart(currentWeekStart.format('YYYY-MM-DD'));
    setDays([]);
    setSelectedDates([]);
    setOverwriteOpen(false);
    pendingImportRef.current = null;
    setLoadingWeek(false);
  }, [open]);

  useEffect(() => {
    if (step !== 'days' || loadingWeek) return;
    setSelectedDates(
      days.filter((day) => day.canImport && !day.hasExisting).map((day) => day.date)
    );
  }, [step, weekStart, loadingWeek, days]);

  const goToDaysStep = (nextPeriod) => {
    const nextWeek =
      nextPeriod === 'previous_weeks'
        ? currentWeekStart.subtract(1, 'week').format('YYYY-MM-DD')
        : currentWeekStart.format('YYYY-MM-DD');
    setPeriod(nextPeriod);
    setStep('days');
    loadWeekStatus(nextWeek);
  };

  const handleWeekDropdownChange = (value) => {
    const nextWeek = typeof value === 'string' ? value : value?.value;
    if (!nextWeek) return;
    loadWeekStatus(nextWeek);
  };

  const toggleDate = (day) => {
    if (day.isFuture) return;
    setSelectedDates((current) =>
      current.includes(day.date)
        ? current.filter((date) => date !== day.date)
        : [...current, day.date]
    );
  };

  const submitImport = (dates, nextWeekStart, skipExisting) => {
    if (!dates.length) return;
    const sorted = [...dates].sort();
    onImport?.({
      period,
      weekStart: nextWeekStart,
      dates: sorted,
      startDate: sorted[0],
      endDate: sorted[sorted.length - 1],
      skipExisting,
    });
  };

  const requestImport = (dates, nextWeekStart, existingDates = []) => {
    if (!dates.length) {
      message.info('Select at least one day to import.');
      return;
    }
    if (!existingDates.length) {
      submitImport(dates, nextWeekStart, true);
      return;
    }
    pendingImportRef.current = { dates, weekStart: nextWeekStart, existingDates };
    setOverwriteCount(existingDates.length);
    setOverwriteOpen(true);
  };

  const confirmOverwrite = () => {
    const pending = pendingImportRef.current;
    setOverwriteOpen(false);
    pendingImportRef.current = null;
    if (!pending?.dates?.length) return;
    submitImport(pending.dates, pending.weekStart, false);
  };

  const handleContinue = async () => {
    if (period !== 'this_week') {
      goToDaysStep(period);
      return;
    }

    const weekStartValue = currentWeekStart.format('YYYY-MM-DD');
    setContinuing(true);
    let weekData = null;
    try {
      const store = useStore.getState();
      const rid =
        restaurantId ||
        store.getRestaurantIdWithFallback?.() ||
        localStorage.getItem('restaurant_id');
      const lid =
        locationId ||
        (typeof store.getSelectedLocationId === 'function'
          ? await store.getSelectedLocationId()
          : store.selectedLocationId);
      const payload = await getDashboardData({
        restaurantId: rid,
        weekStart: weekStartValue,
        locationId: lid,
      });
      weekData = normalizeWeeklyDashboardPayload(payload);
    } catch {
      weekData = null;
    } finally {
      setContinuing(false);
    }

    const weekDays = annotateWeekDays(buildWeekDays(weekStartValue), weekData)
      .filter((day) => day.canImport && day.isOpen);
    const allDates = weekDays.map((day) => day.date);
    const existingDates = weekDays.filter((day) => day.hasExisting).map((day) => day.date);

    if (!allDates.length) {
      message.info('All open days this week already have data or are not available to import.');
      return;
    }

    // Import every open day this week. If any already have actuals, prompt overwrite
    // so partial POS rows (e.g. online-only) get fully rewritten.
    requestImport(allDates, weekStartValue, existingDates);
  };

  const handleImportSelected = () => {
    requestImport(
      selectedImportDates,
      weekStart,
      selectedExistingDays.map((day) => day.date)
    );
  };

  const title =
    step === 'days'
      ? period === 'previous_weeks'
        ? 'Import POS Data – Previous Week(s)'
        : 'Import POS Data – Specific Days'
      : 'Import POS Data';

  return (
    <Modal
      title={
        step === 'days' ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 text-left font-semibold text-gray-900"
            onClick={() => setStep('period')}
          >
            <LeftOutlined />
            {title}
          </button>
        ) : (
          title
        )
      }
      open={open}
      onCancel={onCancel}
      centered
      destroyOnClose
      width={step === 'days' ? 640 : 520}
      footer={
        step === 'period'
          ? [
              <Button key="cancel" onClick={onCancel}>
                Cancel
              </Button>,
              <Button key="continue" type="primary" loading={continuing || confirming} onClick={handleContinue}>
                Continue
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onCancel}>
                Cancel
              </Button>,
              <Button
                key="import"
                type="primary"
                loading={confirming}
                disabled={!selectedImportDates.length}
                onClick={handleImportSelected}
              >
                Import Selected ({selectedImportDates.length})
              </Button>,
            ]
      }
    >
      {step === 'period' ? (
        <div>
          <p className="mb-4 text-gray-600">Choose the time period you want to import from your POS.</p>
          <div className="space-y-2" role="radiogroup" aria-label="Import period">
            {PERIODS.map((item) => {
              const selected = period === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setPeriod(item.id);
                    if (item.id !== 'this_week') goToDaysStep(item.id);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                    selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      selected ? 'border-blue-600' : 'border-gray-300'
                    }`}
                  >
                    {selected ? <span className="h-2 w-2 rounded-full bg-blue-600" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-gray-900">{item.title}</span>
                    <span className="block text-sm text-gray-500">{item.description}</span>
                  </span>
                  {item.id === 'this_week' ? (
                    <span className="whitespace-pre text-right text-xs text-gray-400">
                      {formatWeekLabel(currentWeekStart).replace(' (', '\n(')}
                    </span>
                  ) : (
                    <RightOutlined className="text-gray-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-gray-600">Select the week you want to import from.</p>
          <label className="mb-1 block text-sm font-medium text-gray-700">Select Week</label>
          <Select
            className="mb-4 w-full"
            value={weekStart}
            options={weekOptions}
            onChange={handleWeekDropdownChange}
            getPopupContainer={(trigger) => trigger.parentElement}
          />
          <p className="mb-2 text-sm font-medium text-gray-700">Available Days</p>
          {loadingWeek ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <Spin />
              <span className="text-sm text-gray-500">Checking this week for existing data…</span>
            </div>
          ) : (
            <div key={weekStart} className="overflow-hidden rounded-xl border border-gray-200">
              {days.map((day) => (
                <div
                  key={day.date}
                  className={`flex items-center gap-3 border-b border-gray-100 px-3 py-2.5 last:border-b-0 ${
                    day.hasExisting ? 'bg-amber-50' : 'bg-white'
                  }`}
                >
                  <Checkbox
                    checked={selectedImportDates.includes(day.date)}
                    disabled={day.isFuture}
                    onChange={() => toggleDate(day)}
                  />
                  <span className="w-24 font-medium text-gray-900">{day.dayName}</span>
                  <span className="flex-1 text-gray-600">{day.displayDate}</span>
                  <span className={`w-36 text-sm ${day.hasExisting ? 'text-amber-700' : 'text-gray-500'}`}>
                    {day.isFuture
                      ? 'Future day'
                      : day.hasExisting
                        ? 'Existing data'
                        : 'No existing data'}
                  </span>
                  <span
                    className={`w-20 shrink-0 text-right text-sm font-semibold whitespace-nowrap ${
                      day.isFuture
                        ? 'text-gray-400'
                        : selectedImportDates.includes(day.date) && day.hasExisting
                          ? 'text-red-600'
                          : day.hasExisting
                            ? 'text-amber-700'
                            : 'text-blue-600'
                    }`}
                  >
                    {day.isFuture
                      ? 'Skip'
                      : selectedImportDates.includes(day.date)
                        ? day.hasExisting
                          ? 'Overwrite'
                          : 'Import'
                        : 'Skip'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <Modal
        title="Overwrite existing data?"
        open={overwriteOpen}
        onCancel={() => {
          const pending = pendingImportRef.current;
          setOverwriteOpen(false);
          pendingImportRef.current = null;
          // Still import days that have no actuals yet
          const emptyOnly = (pending?.dates || []).filter(
            (date) => !(pending?.existingDates || []).includes(date)
          );
          if (emptyOnly.length) {
            submitImport(emptyOnly, pending.weekStart, true);
          }
        }}
        centered
        zIndex={1200}
        okText="Overwrite and import"
        okButtonProps={{ danger: true }}
        cancelText="Empty days only"
        onOk={confirmOverwrite}
      >
        <p className="mb-0 text-gray-700">
          {overwriteCount === 1
            ? '1 selected day already has Growlio data. Importing from POS will replace the current sales and labor values for that day.'
            : `${overwriteCount} selected days already have Growlio data. Importing from POS will replace the current sales and labor values for those days.`}
        </p>
      </Modal>
    </Modal>
  );
};

export default PosImportPeriodModal;
