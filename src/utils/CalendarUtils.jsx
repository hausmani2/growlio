import React, { useEffect } from 'react';
import { DatePicker, Select, Typography } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
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
        width: 'auto',
        minWidth: '280px',
        height: '40px',
        cursor: 'pointer'
      }}
      allowClear={false}
      size="middle"
      separator=" to "
      inputReadOnly={true}
      popupStyle={{ zIndex: 1000 }}
      getPopupContainer={(trigger) => trigger.parentNode}
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
 * - Minimal, focused design
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.selectedDates - Selected date range [startDate, endDate]
 * @param {string} props.groupBy - Current group by value ('daily', 'week', 'month')
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
      
      // Log the selected dates for debugging
      
      // Check if it's a valid week range (7 days)
      const daysDiff = endDate.diff(startDate, 'day');
      
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
    onGroupByChange?.(value);
  };

  return (
    <div className={`calendar-container ${className}`} style={{ ...style, position: 'relative' }}>
      <div className="flex items-center gap-3">
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
              width: 'auto',
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
            popupStyle={{ zIndex: 1000 }}
            getPopupContainer={(trigger) => trigger.parentNode}
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
        <div className="w-24">
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
            <Option value="custom_month">Custom</Option>
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
  );
};

export default CalendarUtils;
