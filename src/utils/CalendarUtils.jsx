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

  // Add event handlers for debugging calendar behavior
  const handleOpenChange = (open) => {
    console.log('CalendarUtils: Calendar opened/closed:', open);
    if (open) {
      console.log('CalendarUtils: Calendar is now open - checking for future months...');
      
      // Add a small delay to check for navigation elements
      setTimeout(() => {
        const nextButtons = document.querySelectorAll('.ant-picker-header-next, .ant-picker-header-super-next');
        console.log('CalendarUtils: Found navigation buttons:', nextButtons.length);
        nextButtons.forEach((btn, index) => {
          console.log(`CalendarUtils: Button ${index}:`, {
            visible: btn.offsetParent !== null,
            display: window.getComputedStyle(btn).display,
            visibility: window.getComputedStyle(btn).visibility,
            opacity: window.getComputedStyle(btn).opacity
          });
        });
        
        // Also check if there are any hidden elements
        const allButtons = document.querySelectorAll('.ant-picker-header button');
        console.log('CalendarUtils: All header buttons:', allButtons.length);
        allButtons.forEach((btn, index) => {
          const style = window.getComputedStyle(btn);
          console.log(`CalendarUtils: All button ${index}:`, {
            className: btn.className,
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity
          });
        });
      }, 100);
    }
  };

  // Debug function to check current date and available months
  useEffect(() => {
    const now = dayjs();
    console.log('CalendarUtils: Current date:', now.format('YYYY-MM-DD'));
    console.log('CalendarUtils: Current month:', now.month() + 1);
    console.log('CalendarUtils: Current year:', now.year());
    
    // Test if we can create future dates
    const futureDate = now.add(1, 'month');
    console.log('CalendarUtils: Future date test:', futureDate.format('YYYY-MM-DD'));
    
    // Test multiple future dates
    for (let i = 1; i <= 12; i++) {
      const testDate = now.add(i, 'month');
      console.log(`CalendarUtils: Future date ${i} month ahead:`, testDate.format('YYYY-MM-DD'));
    }
  }, []);

  // Handle group by change
  const handleGroupByChange = (value) => {
    onGroupByChange?.(value);
  };

  return (
    <div className={`calendar-container ${className}`} style={{ ...style, position: 'relative' }}>
      <div className="flex items-center gap-3">
        {/* Date Range Picker */}
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
              console.log('CalendarUtils: Panel render called, panelNode:', panelNode);
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
