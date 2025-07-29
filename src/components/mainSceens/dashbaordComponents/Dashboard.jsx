import React, { useState } from 'react';
import { DatePicker, Card, Row, Col, Typography, Space } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import SalesTable from './SalesTable';
import CogsTable from './CogsTable';
import LabourTable from './LabourTable';
import ProfitCogsTable from './ProfitCogsTable';
import FixedExpensesTable from './FixedExpenseTable';
import NetProfitTable from './NetProfitTable';
const { Title } = Typography;

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());

  return (
    <div className="w-full p-6">
      <div className="w-full mx-auto">
        <div className="mb-6">
          <Title level={2} className="mb-4">
            <CalendarOutlined className="mr-2" />
            Restaurant Dashboard
          </Title>
          
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Title level={4}>Select Date</Title>
                <p className="text-gray-600 mb-4">
                  Choose a date to view and manage dashboard data for that period.
                </p>
              </div>
              
              <div style={{ maxWidth: '300px' }}>
                <DatePicker
                  picker="date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  style={{ width: '100%' }}
                  placeholder="Select date"
                  format="YYYY-MM-DD"
                />
              </div>
            </Space>
          </Card>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <SalesTable selectedDate={selectedDate} />
          <CogsTable selectedDate={selectedDate} />
          <LabourTable selectedDate={selectedDate} />
          <ProfitCogsTable selectedDate={selectedDate} />
          <FixedExpensesTable selectedDate={selectedDate} />
          <NetProfitTable selectedDate={selectedDate} />

        </Space>
      </div>
    </div>
  );
};

export default Dashboard;