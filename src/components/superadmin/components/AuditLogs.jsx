import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  Row, 
  Col,
  Typography,
  Badge,
  Tooltip,
  Modal,
  Descriptions
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  EyeOutlined, 
  DownloadOutlined,
  ReloadOutlined,
  UserOutlined,
  SettingOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AuditLogs = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    user: '',
    dateRange: null
  });

  // Fetch audit logs from API
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call when endpoint is available
        // const response = await apiGet('/admin_access/audit-logs/');
        // setLogs(response.data);
        setLogs([]); // Empty array until API is implemented
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        message.error('Failed to fetch audit logs');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  const getActionColor = (action) => {
    const colors = {
      LOGIN: 'blue',
      LOGOUT: 'gray',
      IMPERSONATE: 'orange',
      UPDATE_USER: 'green',
      DELETE_USER: 'red',
      SYSTEM_CONFIG: 'purple',
      CREATE_USER: 'cyan',
      EXPORT_DATA: 'geekblue'
    };
    return colors[action] || 'default';
  };

  const getStatusColor = (status) => {
    return status === 'SUCCESS' ? 'green' : 'red';
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => (
        <Text code>
          {dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')}
        </Text>
      ),
      sorter: (a, b) => dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <Space>
          <UserOutlined />
          <Text>{user}</Text>
        </Space>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Tag color={getActionColor(action)}>
          {action.replace('_', ' ')}
        </Tag>
      ),
      filters: [
        { text: 'LOGIN', value: 'LOGIN' },
        { text: 'LOGOUT', value: 'LOGOUT' },
        { text: 'IMPERSONATE', value: 'IMPERSONATE' },
        { text: 'UPDATE_USER', value: 'UPDATE_USER' },
        { text: 'DELETE_USER', value: 'DELETE_USER' },
        { text: 'SYSTEM_CONFIG', value: 'SYSTEM_CONFIG' },
      ],
      onFilter: (value, record) => record.action === value,
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
      render: (resource) => (
        <Tag icon={<SettingOutlined />}>
          {resource}
        </Tag>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip) => <Text code>{ip}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={status === 'SUCCESS' ? 'success' : 'error'} 
          text={status}
        />
      ),
      filters: [
        { text: 'SUCCESS', value: 'SUCCESS' },
        { text: 'FAILED', value: 'FAILED' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailModalVisible(true);
  };

  const handleExport = () => {
    // Implement export functionality
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !filters.search || 
      log.user.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.action.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.resource.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesAction = !filters.action || log.action === filters.action;
    const matchesUser = !filters.user || log.user === filters.user;
    
    return matchesSearch && matchesAction && matchesUser;
  });

  return (
    <div className="space-y-6">
      <div>
        <Title level={3}>Audit Logs</Title>
        <Text type="secondary">
          Monitor system activities and user actions
        </Text>
      </div>

      {/* Filters */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search logs..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Action"
              style={{ width: '100%' }}
              value={filters.action}
              onChange={(value) => setFilters({...filters, action: value})}
              allowClear
            >
              <Option value="LOGIN">Login</Option>
              <Option value="LOGOUT">Logout</Option>
              <Option value="IMPERSONATE">Impersonate</Option>
              <Option value="UPDATE_USER">Update User</Option>
              <Option value="DELETE_USER">Delete User</Option>
              <Option value="SYSTEM_CONFIG">System Config</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="User"
              style={{ width: '100%' }}
              value={filters.user}
              onChange={(value) => setFilters({...filters, user: value})}
              allowClear
            >
              <Option value="admin@example.com">admin@example.com</Option>
              <Option value="superadmin@example.com">superadmin@example.com</Option>
              <Option value="user@example.com">user@example.com</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={filters.dateRange}
              onChange={(dates) => setFilters({...filters, dateRange: dates})}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                loading={loading}
              >
                Refresh
              </Button>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={handleExport}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Logs Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredLogs}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} logs`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Audit Log Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedLog && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Timestamp">
              {dayjs(selectedLog.timestamp).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="User">
              {selectedLog.user}
            </Descriptions.Item>
            <Descriptions.Item label="Action">
              <Tag color={getActionColor(selectedLog.action)}>
                {selectedLog.action.replace('_', ' ')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Resource">
              {selectedLog.resource}
            </Descriptions.Item>
            <Descriptions.Item label="IP Address">
              <Text code>{selectedLog.ipAddress}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="User Agent">
              <Text code style={{ fontSize: '12px' }}>
                {selectedLog.userAgent}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge 
                status={selectedLog.status === 'SUCCESS' ? 'success' : 'error'} 
                text={selectedLog.status}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Details">
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
