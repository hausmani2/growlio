import React, { useEffect, useState } from 'react';
import { DatePicker, Select, Typography, Button, Dropdown, Space } from 'antd';
import { CalendarOutlined, DownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import updateLocale from 'dayjs/plugin/updateLocale';

// Extend dayjs with plugins
dayjs.extend(weekOfYear);
dayjs.extend(updateLocale);

// Configure dayjs to use Sunday as the start of the week
dayjs.updateLocale('en', {
  weekStart: 0 // 0 = Sunday, 1 = Monday
});

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Year Range Picker component for annual mode
const YearRangePicker = ({ value, onChange, disabled, loading }) => {
  const [popupStyle, setPopupStyle] = useState({
    zIndex: 9999,
  });

  useEffect(() => {
    const updatePopupStyle = () => {
      const isMobile = window.innerWidth < 640;
      setPopupStyle({
        zIndex: 9999,
        ...(isMobile && {
          maxWidth: 'calc(100vw - 32px)',
        }),
      });
    };

    updatePopupStyle();
    window.addEventListener('resize', updatePopupStyle);
    return () => window.removeEventListener('resize', updatePopupStyle);
  }, []);

  const handleYearChange = (dates) => {
    if (dates && dates.length === 2 && dates[0] && dates[1]) {
      // Convert to dayjs objects for consistency
      // dates[0] and dates[1] are dayjs objects from the year picker
      const startYear = dates[0].startOf('year');
      const endYear = dates[1].endOf('year');
      // Always call onChange to trigger API call
      onChange?.([startYear, endYear]);
    } else if (dates === null) {
      // Handle clear case
      onChange?.(null);
    }
  };

  // Convert dayjs values to year format for display
  // The RangePicker with picker="year" expects dayjs objects
  const yearValues = value && value.length === 2 && value[0] && value[1]
    ? [value[0], value[1]]
    : null;

  return (
    <RangePicker
      value={yearValues}
      onChange={handleYearChange}
      picker="year"
      format="YYYY"
      placeholder={['Start Year', 'End Year']}
      className="w-full"
      disabled={disabled || loading}
      style={{
        borderRadius: '6px',
        width: '100%',
        minWidth: '280px',
        height: '40px',
        cursor: 'pointer'
      }}
      allowClear={false}
      size="middle"
      separator=" to "
      inputReadOnly={true}
      popupStyle={popupStyle}
      popupClassName="calendar-utils-popup"
      placement="bottomLeft"
      disabledDate={() => false}
    />
  );
};

/**
 * Simple Calendar Component with Date Range Picker
 * 
 * Features:
 * - Clean, compact Ant Design RangePicker
 * - Auto-selects current week on page load
 * - Simple group by selector
 * - Quick select options for each period type
 * - Minimal, focused design
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.selectedDates - Selected date range [startDate, endDate]
 * @param {string} props.groupBy - Current group by value ('daily', 'week', 'month', 'annual')
 * @param {Function} props.onDateChange - Callback when date range changes
 * @param {Function} props.onGroupByChange - Callback when group by changes
 * @param {boolean} props.disabled - Whether the component is disabled
 * @param {boolean} props.loading - Whether the component is in loading state
 * @param {string} props.error - Error message to display
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 */
const CalendarUtils = ({
  selectedDates,
  groupBy = 'daily',
  onDateChange,
  onGroupByChange,
  disabled = false,
  loading = false,
  error = null,
  className = '',
  style = {}
}) => {
  const [quickSelectLabel, setQuickSelectLabel] = useState('Quick Select');
  // Use selectedDates directly instead of internal state
  const displayDates = selectedDates && selectedDates.length === 2 ? selectedDates : null;
  
  // For annual mode, auto-select current year if no dates are provided
  // Only run this when groupBy changes to ensure proper initialization
  useEffect(() => {
    // Only auto-select if we don't have valid dates
    const hasValidDates = selectedDates && selectedDates.length === 2 && selectedDates[0] && selectedDates[1];
    
    if (groupBy === 'annual') {
      if (!hasValidDates) {
        const currentYear = dayjs().year();
        const newDates = [dayjs().year(currentYear).startOf('year'), dayjs().year(currentYear).endOf('year')];
        onDateChange?.(newDates);
      }
    } else {
      // Auto-select current week if no dates are provided (for non-annual modes)
      if (!hasValidDates) {
        const currentWeekStart = dayjs().startOf('week');
        const currentWeekEnd = dayjs().endOf('week');
        const newDates = [currentWeekStart, currentWeekEnd];
        onDateChange?.(newDates);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy]); // Only depend on groupBy to avoid infinite loops

  // Handle date range change
  const handleDateChange = (dates) => {
    
    if (dates && dates.length === 2) {
      const startDate = dates[0];
      const endDate = dates[1];
      
      // Check if it's a valid week range (7 days)
      const daysDiff = endDate.diff(startDate, 'day');
      
      // Update label to "Custom" if dates don't match any quick select option
      // This will be set when user manually selects dates
      if (quickSelectLabel !== 'Custom' && quickSelectLabel !== 'Quick Select') {
        // Check if the dates match any quick select option
        let matchesQuickSelect = false;
        
        if (groupBy === 'daily') {
          const today = dayjs();
          const yesterday = dayjs().subtract(1, 'day');
          if ((startDate.isSame(today, 'day') && endDate.isSame(today, 'day')) ||
              (startDate.isSame(yesterday, 'day') && endDate.isSame(yesterday, 'day'))) {
            matchesQuickSelect = true;
          }
        } else if (groupBy === 'week') {
          const currentWeekStart = dayjs().startOf('week');
          const currentWeekEnd = dayjs().endOf('week');
          const lastWeekStart = dayjs().subtract(1, 'week').startOf('week');
          const lastWeekEnd = dayjs().subtract(1, 'week').endOf('week');
          if ((startDate.isSame(currentWeekStart, 'day') && endDate.isSame(currentWeekEnd, 'day')) ||
              (startDate.isSame(lastWeekStart, 'day') && endDate.isSame(lastWeekEnd, 'day'))) {
            matchesQuickSelect = true;
          }
        } else if (groupBy === 'month') {
          const currentMonthStart = dayjs().startOf('month');
          const currentMonthEnd = dayjs().endOf('month');
          const lastMonthStart = dayjs().subtract(1, 'month').startOf('month');
          const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month');
          if ((startDate.isSame(currentMonthStart, 'day') && endDate.isSame(currentMonthEnd, 'day')) ||
              (startDate.isSame(lastMonthStart, 'day') && endDate.isSame(lastMonthEnd, 'day'))) {
            matchesQuickSelect = true;
          }
        } else if (groupBy === 'annual') {
          const currentYear = dayjs().year();
          const previousYear = dayjs().year() - 1;
          if ((startDate.year() === currentYear && endDate.year() === currentYear) ||
              (startDate.year() === previousYear && endDate.year() === previousYear)) {
            matchesQuickSelect = true;
          }
        }
        
        if (!matchesQuickSelect) {
          setQuickSelectLabel('Custom');
        }
      }
      
      // Always pass the dates to parent component, let parent handle validation
      onDateChange?.(dates);
    } else {
      // Pass null to parent component if no dates
      onDateChange?.(dates);
    }
  };

  // Add event handlers for debugging calendar behavior
  const handleOpenChange = (open) => {
    if (open) {
      
      // Add a small delay to check for navigation elements
      setTimeout(() => {
        const nextButtons = document.querySelectorAll('.ant-picker-header-next, .ant-picker-header-super-next');
        nextButtons.forEach((btn, index) => {
        });
        
        // Also check if there are any hidden elements
        const allButtons = document.querySelectorAll('.ant-picker-header button');
        allButtons.forEach((btn, index) => {
        });
      }, 100);
    }
  };

  // Debug function to check current date and available months
  useEffect(() => {
    const now = dayjs();
    
    // Test if we can create future dates
    const futureDate = now.add(1, 'month');
    
    // Test multiple future dates
    for (let i = 1; i <= 12; i++) {
      const testDate = now.add(i, 'month');
    }
  }, []);

  // Handle group by change
  const handleGroupByChange = (value) => {
    setQuickSelectLabel('Quick Select');
    onGroupByChange?.(value);
  };

  // Quick select handlers for Daily
  const handleDailyQuickSelect = (option) => {
    let newDates = null;
    switch (option) {
      case 'today':
        const today = dayjs();
        newDates = [today, today];
        setQuickSelectLabel('Today');
        break;
      case 'yesterday':
        const yesterday = dayjs().subtract(1, 'day');
        newDates = [yesterday, yesterday];
        setQuickSelectLabel('Yesterday');
        break;
      case 'custom':
        setQuickSelectLabel('Custom');
        return; // Let user select custom range
      default:
        return;
    }
    if (newDates) {
      onDateChange?.(newDates);
    }
  };

  // Quick select handlers for Week
  const handleWeekQuickSelect = (option) => {
    let newDates = null;
    switch (option) {
      case 'current_week':
        newDates = [dayjs().startOf('week'), dayjs().endOf('week')];
        setQuickSelectLabel('Current Week');
        break;
      case 'last_week':
        const lastWeekStart = dayjs().subtract(1, 'week').startOf('week');
        const lastWeekEnd = dayjs().subtract(1, 'week').endOf('week');
        newDates = [lastWeekStart, lastWeekEnd];
        setQuickSelectLabel('Last Week');
        break;
      case 'last_2_weeks':
        const twoWeeksAgo = dayjs().subtract(2, 'week').startOf('week');
        const thisWeekEnd = dayjs().endOf('week');
        newDates = [twoWeeksAgo, thisWeekEnd];
        setQuickSelectLabel('Last 2 Weeks');
        break;
      case 'last_3_weeks':
        const threeWeeksAgo = dayjs().subtract(3, 'week').startOf('week');
        const thisWeekEnd3 = dayjs().endOf('week');
        newDates = [threeWeeksAgo, thisWeekEnd3];
        setQuickSelectLabel('Last 3 Weeks');
        break;
      case 'custom':
        setQuickSelectLabel('Custom');
        return; // Let user select custom range
      default:
        return;
    }
    if (newDates) {
      onDateChange?.(newDates);
    }
  };

  // Quick select handlers for Month
  const handleMonthQuickSelect = (option) => {
    let newDates = null;
    switch (option) {
      case 'current_month':
        newDates = [dayjs().startOf('month'), dayjs().endOf('month')];
        setQuickSelectLabel('Current Month');
        break;
      case 'last_month':
        const lastMonthStart = dayjs().subtract(1, 'month').startOf('month');
        const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month');
        newDates = [lastMonthStart, lastMonthEnd];
        setQuickSelectLabel('Last Month');
        break;
      case 'last_2_months':
        const twoMonthsAgo = dayjs().subtract(2, 'month').startOf('month');
        const thisMonthEnd = dayjs().endOf('month');
        newDates = [twoMonthsAgo, thisMonthEnd];
        setQuickSelectLabel('Last 2 Months');
        break;
      case 'last_3_months':
        const threeMonthsAgo = dayjs().subtract(3, 'month').startOf('month');
        const thisMonthEnd3 = dayjs().endOf('month');
        newDates = [threeMonthsAgo, thisMonthEnd3];
        setQuickSelectLabel('Last 3 Months');
        break;
      case 'custom':
        setQuickSelectLabel('Custom');
        return; // Let user select custom range
      default:
        return;
    }
    if (newDates) {
      onDateChange?.(newDates);
    }
  };

  // Quick select handlers for Annual
  const handleAnnualQuickSelect = (option) => {
    let newDates = null;
    switch (option) {
      case 'current_year':
        const currentYear = dayjs().year();
        newDates = [dayjs().year(currentYear).startOf('year'), dayjs().year(currentYear).endOf('year')];
        setQuickSelectLabel('Current Year');
        break;
      case 'previous_year':
        const previousYear = dayjs().year() - 1;
        newDates = [dayjs().year(previousYear).startOf('year'), dayjs().year(previousYear).endOf('year')];
        setQuickSelectLabel('Previous Year');
        break;
      case 'custom':
        setQuickSelectLabel('Custom');
        return; // Let user select custom range
      default:
        return;
    }
    if (newDates) {
      onDateChange?.(newDates);
    }
  };

  // Get quick select menu based on groupBy
  const getQuickSelectMenu = () => {
    if (groupBy === 'daily') {
      return {
        items: [
          { key: 'today', label: 'Today' },
          { key: 'yesterday', label: 'Yesterday' },
          { key: 'custom', label: 'Custom' },
        ],
        onClick: ({ key }) => handleDailyQuickSelect(key),
      };
    } else if (groupBy === 'week') {
      return {
        items: [
          { key: 'current_week', label: 'Current Week' },
          { key: 'last_week', label: 'Last Week' },
          { key: 'last_2_weeks', label: 'Last 2 Weeks' },
          { key: 'last_3_weeks', label: 'Last 3 Weeks' },
          { key: 'custom', label: 'Custom' },
        ],
        onClick: ({ key }) => handleWeekQuickSelect(key),
      };
    } else if (groupBy === 'month') {
      return {
        items: [
          { key: 'current_month', label: 'Current Month' },
          { key: 'last_month', label: 'Last Month' },
          { key: 'last_2_months', label: 'Last 2 Months' },
          { key: 'last_3_months', label: 'Last 3 Months' },
          { key: 'custom', label: 'Custom' },
        ],
        onClick: ({ key }) => handleMonthQuickSelect(key),
      };
    } else if (groupBy === 'annual') {
      return {
        items: [
          { key: 'current_year', label: 'Current Year' },
          { key: 'previous_year', label: 'Previous Year' },
          { key: 'custom', label: 'Custom' },
        ],
        onClick: ({ key }) => handleAnnualQuickSelect(key),
      };
    }
    return null;
  };

  const quickSelectMenu = getQuickSelectMenu();

  // Responsive popup style for mobile
  const [popupStyle, setPopupStyle] = useState({
    zIndex: 9999,
  });

  useEffect(() => {
    const updatePopupStyle = () => {
      const isMobile = window.innerWidth < 640;
      setPopupStyle({
        zIndex: 9999,
        ...(isMobile && {
          maxWidth: 'calc(100vw - 32px)',
        }),
      });
    };

    updatePopupStyle();
    window.addEventListener('resize', updatePopupStyle);
    return () => window.removeEventListener('resize', updatePopupStyle);
  }, []);

  return (
    <>
      <style>{`
        .calendar-utils-popup {
          z-index: 9999 !important;
        }
        @media (max-width: 640px) {
          .calendar-utils-popup {
            max-width: calc(100vw - 32px) !important;
            left: 16px !important;
            right: 16px !important;
          }
          .calendar-utils-popup .ant-picker-panels {
            flex-direction: column !important;
          }
          .calendar-utils-popup .ant-picker-panel {
            width: 100% !important;
            max-width: 100% !important;
          }
          .calendar-utils-popup .ant-picker-panel-container {
            flex-direction: column !important;
          }
        }
      `}</style>
      <div className={`calendar-container ${className}`} style={{ ...style, position: 'relative' }}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Quick Select Dropdown */}
          {quickSelectMenu && (
            <Dropdown
              menu={quickSelectMenu}
              trigger={['click']}
              disabled={disabled || loading}
            >
              <Button
                style={{
                  borderRadius: '6px',
                  height: '40px',
                  minWidth: '120px'
                }}
                disabled={disabled || loading}
                className="w-full sm:w-auto"
              >
                {quickSelectLabel} <DownOutlined />
              </Button>
            </Dropdown>
          )}

        {/* Year Range Picker for Annual Mode */}
        {groupBy === 'annual' ? (
          <YearRangePicker
            value={displayDates}
            onChange={handleDateChange}
            disabled={disabled}
            loading={loading}
          />
        ) : (
          /* Date Range Picker for other modes */
          <RangePicker
            value={displayDates}
            onChange={handleDateChange}
            onOpenChange={handleOpenChange}
            format="MMMM DD, YYYY"
            placeholder={['Start Date', 'End Date']}
            className="w-full"
            disabled={disabled || loading}
            style={{
              borderRadius: '6px',
              width: '100%',
              minWidth: '280px',
              height: '40px',
              cursor: 'pointer'
            }}
            allowClear={false}
            size="middle"
            separator=" to "
            showTime={false}
            inputReadOnly={true}
            showToday={true}
            picker="date"
            popupStyle={popupStyle}
            popupClassName="calendar-utils-popup"
            placement="bottomLeft"
            // Allow all dates including future dates
            disabledDate={() => false}
            // Remove any default restrictions
            ranges={{}}
            // Force enable future navigation
            showNow={false}
            // Ensure no date restrictions
            // Test: Add specific configuration to allow future navigation
            // Test: Add specific configuration to force show navigation
            open={undefined}

            panelRender={(panelNode) => {
              return (
                <div>
                  <style>
                    {`
                      /* Force show all navigation arrows */
                      .ant-picker-header-next,
                      .ant-picker-header-super-next {
                        display: inline-block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        pointer-events: auto !important;
                        color: rgba(0, 0, 0, 0.85) !important;
                      }
                      .ant-picker-header-next:hover,
                      .ant-picker-header-super-next:hover {
                        color: #1890ff !important;
                      }
                    `}
                  </style>
                  {panelNode}
                </div>
              );
            }}
          />
        )}

        {/* Group By Selector */}
        <div className="w-full sm:w-24">
          <Select
            value={groupBy}
            onChange={handleGroupByChange}
            className="w-full"
            disabled={disabled || loading}
            style={{
              borderRadius: '6px',
              height: '40px'
            }}
            size="small"
          >
            <Option value="daily">Daily</Option>
            <Option value="week">Week</Option>
            <Option value="month">Month</Option>
            <Option value="annual">Annual</Option>
          </Select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <Text type="danger" className="text-sm">{error}</Text>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <Text type="secondary" className="text-sm">Loading...</Text>
        </div>
      )}
      </div>
    </>
  );
};

export default CalendarUtils;
