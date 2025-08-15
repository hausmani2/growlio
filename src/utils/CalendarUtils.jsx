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
  
  // Debug logging
  console.log('CalendarUtils render:', {
    selectedDates: selectedDates?.map(d => d?.format('YYYY-MM-DD')),
    displayDates: displayDates?.map(d => d?.format('YYYY-MM-DD'))
  });
  
  // Auto-select current week if no dates are provided
  useEffect(() => {
    if (!selectedDates || selectedDates.length !== 2) {
      const currentWeekStart = dayjs().startOf('week');
      const currentWeekEnd = dayjs().endOf('week');
      console.log('CalendarUtils: Auto-selecting current week:', currentWeekStart.format('YYYY-MM-DD'), 'to', currentWeekEnd.format('YYYY-MM-DD'));
      const newDates = [currentWeekStart, currentWeekEnd];
      onDateChange?.(newDates);
    }
  }, [selectedDates, onDateChange]);

  // Handle date range change
  const handleDateChange = (dates) => {
    console.log('CalendarUtils: Date range changed:', dates?.map(d => d?.format('YYYY-MM-DD')));
    
    if (dates && dates.length === 2) {
      const startDate = dates[0];
      const endDate = dates[1];
      
      // Log the selected dates for debugging
      console.log('CalendarUtils: Selected start date:', startDate.format('YYYY-MM-DD'), 'day:', startDate.day());
      console.log('CalendarUtils: Selected end date:', endDate.format('YYYY-MM-DD'), 'day:', endDate.day());
      
      // Check if it's a valid week range (7 days)
      const daysDiff = endDate.diff(startDate, 'day');
      console.log('CalendarUtils: Days difference:', daysDiff);
      
      // Always pass the dates to parent component, let parent handle validation
      onDateChange?.(dates);
    } else {
      // Pass null to parent component if no dates
      onDateChange?.(dates);
    }
  };

  // Handle group by change
  const handleGroupByChange = (value) => {
    onGroupByChange?.(value);
  };

  return (
    <div className={`calendar-container ${className}`} style={style}>
      <div className="flex items-center gap-3">
        {/* Date Range Picker */}
          <RangePicker
            value={displayDates}
            onChange={handleDateChange}
            format="MMM DD, YYYY"
            placeholder={['Start Date', 'End Date']}
            className="w-full"
            disabled={disabled || loading}
            style={{
              borderRadius: '6px',
              width: '30%',
              height: '40px',
              cursor: 'pointer'
            }}
            allowClear={false}
            size="middle"
            separator=" to "
            showTime={false}
            inputReadOnly={true}
            disabledDate={() => {
              // Allow all dates - no restrictions
              return false;
            }}

            panelRender={(panelNode) => (
              <div style={{ 
                width: '280px',
                padding: '8px'
              }}>
                {panelNode}
              </div>
            )}
          />

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
