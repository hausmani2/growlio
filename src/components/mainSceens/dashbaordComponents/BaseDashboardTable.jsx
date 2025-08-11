import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, DatePicker, Card, Row, Col, Typography, Space, Divider, message, Spin, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useStore from '../../../store/store';

const { Title, Text } = Typography;

const BaseDashboardTable = ({ 
  title, 
  tableType, 
  columns, 
  weeklyColumns, 
  dataTransformer,
  defaultData,
  onDataChange,
  children 
}) => {
  const [monthlyData, setMonthlyData] = useState(defaultData || {});
  const [weeklyData, setWeeklyData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWeek, setEditingWeek] = useState(null);
  const [selectedMonth] = useState(dayjs());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dataNotFound, setDataNotFound] = useState(false);

  const { 
    fetchDashboardData, 
    saveDashboardData, 
    loading: storeLoading, 
    error: storeError
  } = useStore();

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setDataNotFound(false);
      const data = await fetchDashboardData(selectedMonth.format('YYYY-MM-DD'));
      
      if (data) {
        // Extract monthly data for this table type
        const monthlyTableData = data[tableType] || defaultData;
        setMonthlyData(monthlyTableData);
        
        // Extract weekly data for this table type
        const weeklyTableData = data.daily_entries?.map(entry => ({
          date: entry.date,
          day: entry.day,
          data: entry[tableType]?.data || {},
          status: entry[tableType]?.status || false
        })) || [];
        setWeeklyData(weeklyTableData);
      }
    } catch (error) {
      // Check if it's a 404 error
      if (error.response && error.response.status === 404) {
        setDataNotFound(true);
        setMonthlyData(defaultData || {});
        setWeeklyData([]);
        message.info(`No ${title} data found for the selected period.`);
      } else {
        message.error(`Failed to load ${title} data: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save dashboard data
  const saveData = async () => {
    try {
      setIsSaving(true);
      
      // Transform data according to API structure
      const transformedData = dataTransformer ? dataTransformer(monthlyData, weeklyData) : {
        month: selectedMonth.format('YYYY-MM-DD'),
        [tableType]: monthlyData,
        daily_entries: weeklyData.map(entry => ({
          date: entry.date,
          day: entry.day,
          [tableType]: {
            status: entry.status,
            data: entry.data
          }
        }))
      };

      await saveDashboardData(transformedData);
      message.success(`${title} data saved successfully!`);
      
      // Reload data to get updated values
      await loadDashboardData();
    } catch (error) {
      message.error(`Failed to save ${title} data: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle monthly data changes
  const handleMonthlyDataChange = (field, value) => {
    const newData = { ...monthlyData, [field]: value };
    setMonthlyData(newData);
    
    // Call custom data change handler if provided
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  // Handle weekly data modal
  const showAddWeeklyModal = () => {
    setEditingWeek(null);
    setIsModalVisible(true);
  };

  const showEditWeeklyModal = (weekData) => {
    setEditingWeek(weekData);
    setIsModalVisible(true);
  };

  const handleWeeklySubmit = (weekData) => {
    if (editingWeek) {
      // Edit existing week
      setWeeklyData(prev => prev.map(week => 
        week.date === editingWeek.date ? { ...weekData, date: week.date } : week
      ));
    } else {
      // Add new week
      const newWeek = {
        ...weekData,
        date: weekData.date,
        day: dayjs(weekData.date).format('dddd').toLowerCase()
      };
      setWeeklyData(prev => [...prev, newWeek]);
    }
    setIsModalVisible(false);
    setEditingWeek(null);
  };

  const deleteWeek = (weekDate) => {
    setWeeklyData(prev => prev.filter(week => week.date !== weekDate));
  };

  // Calculate weekly totals
  const calculateWeeklyTotals = () => {
    if (!weeklyData.length) return {};
    
    const totals = {};
    weeklyData.forEach(entry => {
      Object.keys(entry.data).forEach(key => {
        if (typeof entry.data[key] === 'number') {
          totals[key] = (totals[key] || 0) + entry.data[key];
        }
      });
    });
    
    return totals;
  };

  // Weekly Modal Component
  const WeeklyModal = () => {
    const [formData, setFormData] = useState(editingWeek?.data || {});
    const [startDate, setStartDate] = useState(editingWeek?.date ? dayjs(editingWeek.date) : dayjs());

    const handleFormDataChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
      handleWeeklySubmit({
        date: startDate.format('YYYY-MM-DD'),
        data: formData,
        status: true
      });
    };

    return (
      <Modal
        title={`${editingWeek ? 'Edit' : 'Add'} Weekly ${title} Data`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit}>
            {editingWeek ? 'Update' : 'Add'}
          </Button>
        ]}
        width={1200}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Start Date:</Text>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                style={{ width: '100%', marginTop: 8 }}
                format="YYYY-MM-DD"
              />
            </Col>
          </Row>
          
          <Divider />
          
          <Row gutter={16}>
            {weeklyColumns.map((column, index) => (
              <Col span={12} key={index}>
                <Text strong>{column.title}:</Text>
                <Input
                  type="number"
                  value={formData[column.key] || ''}
                  onChange={(e) => handleFormDataChange(column.key, parseFloat(e.target.value) || 0)}
                  prefix={column.prefix || ''}
                  style={{ marginTop: 8 }}
                  placeholder={column.placeholder || `Enter ${column.title}`}
                />
              </Col>
            ))}
          </Row>
        </Space>
      </Modal>
    );
  };

  const weeklyTotals = calculateWeeklyTotals();

  return (
    <div className="w-full">
      <Card className="w-full mx-auto shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <Title level={3} className="mb-0">{title}</Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadDashboardData}
              loading={isLoading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={saveData}
              loading={isSaving}
            >
              Save Data
            </Button>
            <Button 
              type="default" 
              icon={<PlusOutlined />} 
              onClick={showAddWeeklyModal}
            >
              Add Weekly Data
            </Button>
          </Space>
        </div>
        
        {storeError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <Text type="danger">{storeError}</Text>
          </div>
        )}
        
        <Row gutter={24}>
          {/* Monthly Totals Section */}
          <Col span={12}>
            <Card title="Monthly Totals" className="h-full">
              <Spin spinning={storeLoading}>
                {dataNotFound ? (
                  <Empty description="No monthly data available for this period." />
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {columns.map((column, index) => (
                      <Row key={index} justify="space-between" align="middle">
                        <Col>
                          <Text strong>{column.title}:</Text>
                        </Col>
                        <Col>
                          <Input
                            type="number"
                            value={monthlyData[column.key] || ''}
                            onChange={(e) => handleMonthlyDataChange(column.key, parseFloat(e.target.value) || 0)}
                            prefix={column.prefix || ''}
                            style={{ width: 150 }}
                            placeholder={column.placeholder || `Enter ${column.title}`}
                          />
                        </Col>
                      </Row>
                    ))}
                  </Space>
                )}
              </Spin>
            </Card>
          </Col>

          {/* Weekly Data Section */}
          <Col span={12}>
            <Card title="Weekly Data" className="h-full">
              <Spin spinning={storeLoading}>
                {dataNotFound ? (
                  <Empty description="No weekly data available for this period." />
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {weeklyData.length === 0 ? (
                      <Text type="secondary">No weekly data available. Click "Add Weekly Data" to get started.</Text>
                    ) : (
                      <>
                        {/* Weekly Totals */}
                        <Divider orientation="left">Weekly Totals</Divider>
                        <Row gutter={16}>
                          {weeklyColumns.map((column, index) => (
                            <Col span={12} key={index}>
                              <Text strong>{column.title}:</Text>
                              <br />
                              <Text>{column.prefix || ''}{weeklyTotals[column.key]?.toFixed(2) || '0.00'}</Text>
                            </Col>
                          ))}
                        </Row>
                        
                        <Divider orientation="left">Daily Entries</Divider>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          {weeklyData.map((entry, index) => (
                            <Card key={index} size="small" className="bg-gray-50">
                              <Row justify="space-between" align="middle">
                                <Col>
                                  <Text strong>{dayjs(entry.date).format('MMM DD, YYYY')}</Text>
                                  <br />
                                  <Text type="secondary">{entry.day}</Text>
                                </Col>
                                <Col>
                                  <Space>
                                    <Button 
                                      size="small" 
                                      icon={<EditOutlined />}
                                      onClick={() => showEditWeeklyModal(entry)}
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      size="small" 
                                      danger 
                                      icon={<DeleteOutlined />}
                                      onClick={() => deleteWeek(entry.date)}
                                    >
                                      Delete
                                    </Button>
                                  </Space>
                                </Col>
                              </Row>
                            </Card>
                          ))}
                        </Space>
                      </>
                    )}
                  </Space>
                )}
              </Spin>
            </Card>
          </Col>
        </Row>

        {/* Custom children content */}
        {children}

        {/* Weekly Modal */}
        <WeeklyModal />
      </Card>
    </div>
  );
};

export default BaseDashboardTable; 