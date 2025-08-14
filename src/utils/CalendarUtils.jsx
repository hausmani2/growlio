import React, { useEffect } from 'react';
import { Card, Select, Space, Typography, Spin, Alert, Button, Dropdown, Menu } from 'antd';
import { DollarOutlined, ArrowRightOutlined, CalendarOutlined, FilterOutlined, DownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

/**
 * Professional Calendar Filter Component
 * 
 * A modern calendar component with dropdown filters for Year/Month/Week selection
 * and grouping options (Daily/Weekly/Monthly).
 * 
 * @component
 * @param {Object} props - Component props
 * @param {number} props.selectedYear - Currently selected year
 * @param {number} props.selectedMonth - Currently selected month
 * @param {string} props.selectedWeek - Currently selected week key
 * @param {Array} props.availableWeeks - Available weeks data
 * @param {Function} props.onYearChange - Callback when year changes
 * @param {Function} props.onMonthChange - Callback when month changes
 * @param {Function} props.onWeekChange - Callback when week changes
 * @param {Function} props.onGroupByChange - Callback when group by changes
 * @param {string} props.groupBy - Current group by selection ('daily', 'weekly', 'monthly')
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {string} props.title - Calendar title
 * @param {string} props.description - Calendar description
 * @param {Object} props.style - Custom styles
 * @param {string} props.className - Custom CSS classes
 * @param {boolean} props.showFlashMessage - Whether to show flash message
 * @param {Function} props.onFlashMessageClick - Callback for flash message button
 */
const CalendarUtils = ({
  selectedYear,
  selectedMonth,
  selectedWeek,
  availableWeeks = [],
  onYearChange,
  onMonthChange,
  onWeekChange,
  onGroupByChange,
  groupBy = 'weekly',
  loading = false,
  error = null,
  style = {},
  className = ""
}) => {
  // Static data
  const years = Array.from({ length: 9 }, (_, i) => 2021 + i); // 2021 to 2029
  const months = [
    { key: 1, name: 'January' },
    { key: 2, name: 'February' },
    { key: 3, name: 'March' },
    { key: 4, name: 'April' },
    { key: 5, name: 'May' },
    { key: 6, name: 'June' },
    { key: 7, name: 'July' },
    { key: 8, name: 'August' },
    { key: 9, name: 'September' },
    { key: 10, name: 'October' },
    { key: 11, name: 'November' },
    { key: 12, name: 'December' }
  ];

  const groupByOptions = [
    { key: 'daily', name: 'Daily', icon: '📅' },
    { key: 'weekly', name: 'Weekly', icon: '📊' },
    { key: 'monthly', name: 'Monthly', icon: '📈' }
  ];

  // Initialize with current date if no selection - only run once
  useEffect(() => {
    if (!selectedYear) {
      const currentYear = dayjs().year();
      onYearChange?.(currentYear);
    }
    if (!selectedMonth) {
      const currentMonth = dayjs().month() + 1; // dayjs months are 0-indexed
      onMonthChange?.(currentMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional: run once to bootstrap with current year/month

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-8">
        <Spin size="large" />
        <p className="mt-4 text-gray-600">Loading calendar data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        message="Calendar Error"
        description={error}
        type="error"
        showIcon
        className="mb-4"
      />
    );
  }

  return (
    <div className={className} style={style}>
      

      {/* Calendar Filter Card */}
      <Card className="p-4 sm:p-6 shadow-sm border-0 bg-white">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Left Side - Title */}
          {/* <div className="mb-4 lg:mb-0">
            <Title level={3} className="mb-2 sm:mb-4 text-lg sm:text-xl lg:text-2xl text-gray-800">
              {title}
            </Title>
          </div> */}
          

          {/* Right Side - Filter Dropdowns */}
          <div className="flex flex-wrap gap-3">
            {/* Year Dropdown */}
            <div className="min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <Select
                placeholder="Select Year"
                value={selectedYear}
                onChange={onYearChange}
                style={{ width: '100%' }}
                className="w-full"
                suffixIcon={<DownOutlined />}
              >
                {years.map(year => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Month Dropdown */}
            <div className="min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <Select
                placeholder="Select Month"
                value={selectedMonth}
                onChange={onMonthChange}
                style={{ width: '100%' }}
                disabled={!selectedYear}
                loading={loading}
                className="w-full"
                suffixIcon={<DownOutlined />}
              >
                {months.map(month => (
                  <Option key={month.key} value={month.key}>
                    {month.name}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Week Dropdown */}
            <div className="min-w-[140px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Week
              </label>
              <Select
                placeholder="Select Week"
                value={selectedWeek}
                onChange={onWeekChange}
                style={{ width: '100%' }}
                disabled={!selectedMonth || availableWeeks.length === 0}
                loading={loading}
                className="w-full"
                suffixIcon={<DownOutlined />}
              >
                {availableWeeks.map(week => (
                  <Option key={week.key} value={week.key}>
                    Week {week.weekNumber} ({dayjs(week.startDate).format('MMM DD')} - {dayjs(week.endDate).format('MMM DD')})
                  </Option>
                ))}
              </Select>
            </div>

            {/* Group By Dropdown */}
            <div className="min-w-[120px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group By
              </label>
              <Select
                placeholder="Select Group By"
                value={groupBy}
                onChange={onGroupByChange}
                style={{ width: '100%' }}
                className="w-full"
                suffixIcon={<DownOutlined />}
              >
                {groupByOptions.map(option => (
                  <Option key={option.key} value={option.key}>
                    {option.icon} {option.name}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Loading indicator for weeks */}
        {selectedMonth && loading && availableWeeks.length === 0 && (
          <div className="text-center py-4 mt-4">
            <Spin size="small" /> Loading weeks...
          </div>
        )}

        {/* No weeks available message */}
        {selectedMonth && !loading && availableWeeks.length === 0 && (
          <div className="text-center py-4 mt-4 text-gray-500">
            No weeks available for the selected month.
          </div>
        )}
      </Card>


      {/* Custom CSS for dropdown styling */}
      <style jsx>{`
        .ant-select-dropdown {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .ant-select-item {
          padding: 8px 12px;
        }
        .ant-select-item-option-selected {
          background-color: #f6ffed;
          color: #52c41a;
        }
        .ant-select-item-option-active {
          background-color: #f0f0f0;
        }
      `}</style>
    </div>
  );
};

export default CalendarUtils;
