import React from 'react';
import { Card, Typography, Space, Divider } from 'antd';
import CalendarUtils, { useCalendar, CalendarHelpers } from './CalendarUtils';

const { Title, Text } = Typography;

/**
 * Example Component demonstrating CalendarUtils usage
 * 
 * This component shows different ways to use the CalendarUtils component
 * and the useCalendar hook for various scenarios.
 */
const CalendarExample = () => {
  // Example 1: Basic calendar with hook
  const basicCalendar = useCalendar({
    initialViewMode: 'weekly'
  });

  // Example 2: Monthly view calendar
  const monthlyCalendar = useCalendar({
    initialViewMode: 'monthly'
  });

  // Example 3: Custom calendar with specific initial values
  const customCalendar = useCalendar({
    initialViewMode: 'weekly',
    initialYear: 2024,
    initialMonth: 3
  });

  return (
    <div className="space-y-6 p-6">
      <Title level={2}>Calendar Utils Examples</Title>
      
      {/* Example 1: Basic Weekly Calendar */}
      <Card title="Example 1: Basic Weekly Calendar" className="shadow-lg">
        <Text type="secondary" className="mb-4 block">
          A basic weekly calendar with default settings
        </Text>
        <CalendarUtils
          viewMode={basicCalendar.viewMode}
          selectedYear={basicCalendar.selectedYear}
          selectedMonth={basicCalendar.selectedMonth}
          selectedWeek={basicCalendar.selectedWeek}
          availableWeeks={basicCalendar.availableWeeks}
          onYearChange={basicCalendar.handleYearChange}
          onMonthChange={basicCalendar.handleMonthChange}
          onWeekChange={basicCalendar.handleWeekChange}
          onViewModeChange={basicCalendar.handleViewModeChange}
          loading={basicCalendar.loading}
          error={basicCalendar.error}
          title="Weekly Date Selection"
          description="Select a week to view data"
        />
        
        <Divider />
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <Text strong>Selected Values:</Text>
          <br />
          <Text>View Mode: {basicCalendar.viewMode}</Text>
          <br />
          <Text>Year: {basicCalendar.selectedYear}</Text>
          <br />
          <Text>Month: {basicCalendar.selectedMonth}</Text>
          <br />
          <Text>Week: {basicCalendar.selectedWeek || 'None'}</Text>
        </div>
      </Card>

      {/* Example 2: Monthly Calendar */}
      <Card title="Example 2: Monthly Calendar" className="shadow-lg">
        <Text type="secondary" className="mb-4 block">
          A monthly calendar without week selection
        </Text>
        <CalendarUtils
          viewMode={monthlyCalendar.viewMode}
          selectedYear={monthlyCalendar.selectedYear}
          selectedMonth={monthlyCalendar.selectedMonth}
          selectedWeek={monthlyCalendar.selectedWeek}
          availableWeeks={monthlyCalendar.availableWeeks}
          onYearChange={monthlyCalendar.handleYearChange}
          onMonthChange={monthlyCalendar.handleMonthChange}
          onWeekChange={monthlyCalendar.handleWeekChange}
          onViewModeChange={monthlyCalendar.handleViewModeChange}
          loading={monthlyCalendar.loading}
          error={monthlyCalendar.error}
          title="Monthly Date Selection"
          description="Select a month to view data"
          showViewModeToggle={false}
        />
        
        <Divider />
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <Text strong>Selected Values:</Text>
          <br />
          <Text>View Mode: {monthlyCalendar.viewMode}</Text>
          <br />
          <Text>Year: {monthlyCalendar.selectedYear}</Text>
          <br />
          <Text>Month: {monthlyCalendar.selectedMonth}</Text>
        </div>
      </Card>

      {/* Example 3: Custom Calendar */}
      <Card title="Example 3: Custom Calendar" className="shadow-lg">
        <Text type="secondary" className="mb-4 block">
          A custom calendar with specific initial values and custom styling
        </Text>
        <CalendarUtils
          viewMode={customCalendar.viewMode}
          selectedYear={customCalendar.selectedYear}
          selectedMonth={customCalendar.selectedMonth}
          selectedWeek={customCalendar.selectedWeek}
          availableWeeks={customCalendar.availableWeeks}
          onYearChange={customCalendar.handleYearChange}
          onMonthChange={customCalendar.handleMonthChange}
          onWeekChange={customCalendar.handleWeekChange}
          onViewModeChange={customCalendar.handleViewModeChange}
          loading={customCalendar.loading}
          error={customCalendar.error}
          title="Custom Date Selection"
          description="This calendar starts with March 2024"
          className="border-2 border-blue-200"
          style={{ backgroundColor: '#f8fafc' }}
        />
        
        <Divider />
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <Text strong>Custom Settings:</Text>
          <br />
          <Text>Initial Year: 2024</Text>
          <br />
          <Text>Initial Month: March</Text>
          <br />
          <Text>Custom Styling: Blue border and background</Text>
        </div>
      </Card>

      {/* Example 4: Calendar without View Mode Toggle */}
      <Card title="Example 4: Calendar without View Mode Toggle" className="shadow-lg">
        <Text type="secondary" className="mb-4 block">
          A calendar component without the view mode toggle option
        </Text>
        <CalendarUtils
          viewMode="weekly"
          selectedYear={2024}
          selectedMonth={1}
          selectedWeek={null}
          availableWeeks={[]}
          onYearChange={(year) => console.log('Year changed:', year)}
          onMonthChange={(month) => console.log('Month changed:', month)}
          onWeekChange={(week) => console.log('Week changed:', week)}
          onViewModeChange={(mode) => console.log('View mode changed:', mode)}
          loading={false}
          error={null}
          title="Fixed Weekly Calendar"
          description="This calendar is locked to weekly view"
          showViewModeToggle={false}
        />
      </Card>

      {/* Utility Functions Example */}
      <Card title="Calendar Helper Functions" className="shadow-lg">
        <Text type="secondary" className="mb-4 block">
          Examples of using the CalendarHelpers utility functions
        </Text>
        
        <Space direction="vertical" className="w-full">
          <div className="bg-gray-50 p-4 rounded-lg">
            <Text strong>Format Date Range:</Text>
            <br />
            <Text>
              {CalendarHelpers.formatDateRange('2024-01-01', '2024-01-07')}
            </Text>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <Text strong>Is Current Week Check:</Text>
            <br />
            <Text>
              {CalendarHelpers.isCurrentWeek('2024-01-01', '2024-01-07') ? 'Yes' : 'No'}
            </Text>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <Text strong>Get Current Week Key:</Text>
            <br />
            <Text>
              {CalendarHelpers.getCurrentWeekKey([
                { key: 'week_1', startDate: '2024-01-01', endDate: '2024-01-07' },
                { key: 'week_2', startDate: '2024-01-08', endDate: '2024-01-14' }
              ]) || 'No current week found'}
            </Text>
          </div>
        </Space>
      </Card>

      {/* Usage Instructions */}
      <Card title="How to Use CalendarUtils" className="shadow-lg">
        <Space direction="vertical" className="w-full">
          <div>
            <Title level={4}>1. Import the Components</Title>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import CalendarUtils, { useCalendar, CalendarHelpers } from './utils/CalendarUtils';`}
            </pre>
          </div>
          
          <div>
            <Title level={4}>2. Use the Hook</Title>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const calendarState = useCalendar({
  initialViewMode: 'weekly',
  initialYear: 2024,
  initialMonth: 1
});`}
            </pre>
          </div>
          
          <div>
            <Title level={4}>3. Render the Component</Title>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<CalendarUtils
  viewMode={calendarState.viewMode}
  selectedYear={calendarState.selectedYear}
  selectedMonth={calendarState.selectedMonth}
  selectedWeek={calendarState.selectedWeek}
  availableWeeks={calendarState.availableWeeks}
  onYearChange={calendarState.handleYearChange}
  onMonthChange={calendarState.handleMonthChange}
  onWeekChange={calendarState.handleWeekChange}
  onViewModeChange={calendarState.handleViewModeChange}
  loading={calendarState.loading}
  error={calendarState.error}
  title="Date Selection"
  description="Select your date range"
/>`}
            </pre>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default CalendarExample;
