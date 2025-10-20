import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Avatar,
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  TeamOutlined, 
  UserAddOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const CorporateSupportAccess = () => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Real API data for corporate support users
  const [supportUsers, setSupportUsers] = useState([]);

  // Fetch support users from API
  useEffect(() => {
    const fetchSupportUsers = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call when endpoint is available
        // const response = await apiGet('/admin_access/support-users/');
        // setSupportUsers(response.data);
        setSupportUsers([]); // Empty array until API is implemented
      } catch (error) {
        console.error('Error fetching support users:', error);
        message.error('Failed to fetch support users');
      } finally {
        setLoading(false);
      }
    };

    fetchSupportUsers();
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setSupportUsers(supportUsers.filter(user => user.id !== userId));
      message.success('Support user deleted successfully');
    } catch (error) {
      message.error('Failed to delete support user');
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async (values) => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingUser) {
        // Update existing user
        setSupportUsers(supportUsers.map(user => 
          user.id === editingUser.id ? { ...user, ...values } : user
        ));
        message.success('Support user updated successfully');
      } else {
        // Add new user
        const newUser = {
          id: Date.now(),
          ...values,
          status: 'active',
          created: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        setSupportUsers([...supportUsers, newUser]);
        message.success('Support user added successfully');
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to save support user');
    } finally {
      setLoading(false);
    }
  };

  const getRoleTag = (role) => {
    const roleConfig = {
      senior_support: { color: 'purple', text: 'Senior Support' },
      support_agent: { color: 'blue', text: 'Support Agent' },
      manager: { color: 'orange', text: 'Manager' }
    };
    const config = roleConfig[role] || { color: 'default', text: role };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getStatusTag = (status) => {
    return status === 'active' ? (
      <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>
    ) : (
      <Tag color="red" icon={<CloseCircleOutlined />}>Inactive</Tag>
    );
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar 
            size="small" 
            icon={<TeamOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <div className="font-medium">{record.name}</div>
            <Text type="secondary" className="text-xs">{record.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => getRoleTag(role),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <div className="space-y-1">
          {permissions.map((permission, index) => (
            <Tag key={index} size="small" color="blue">
              {permission.replace('_', ' ')}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Last Active',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => message.info(`Viewing ${record.name}`)}
            />
          </Tooltip>
          <Tooltip title="Edit User">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this support user?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete User">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const activeUsers = supportUsers.filter(user => user.status === 'active').length;
  const totalUsers = supportUsers.length;

  return (
    <div className="space-y-6">
      <div>
        <Title level={3}>Corporate Support Access</Title>
        <Text type="secondary">
          Manage corporate support team access and permissions
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="text-center">
            <Statistic
              title="Total Support Users"
              value={totalUsers}
              prefix={<TeamOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center">
            <Statistic
              title="Active Users"
              value={activeUsers}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="text-center">
            <Statistic
              title="Departments"
              value={new Set(supportUsers.map(u => u.department)).size}
              prefix={<CrownOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Support Users Table */}
      <Card 
        title="Support Team Members"
        extra={
          <Button 
            type="primary" 
            icon={<UserAddOutlined />}
            onClick={handleAddUser}
          >
            Add Support User
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={supportUsers}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit Support User' : 'Add Support User'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Please enter full name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Department"
                name="department"
                rules={[{ required: true, message: 'Please select department' }]}
              >
                <Select placeholder="Select department">
                  <Option value="Customer Success">Customer Success</Option>
                  <Option value="Technical Support">Technical Support</Option>
                  <Option value="Customer Support">Customer Support</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="Marketing">Marketing</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Role"
                name="role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select role">
                  <Option value="senior_support">Senior Support</Option>
                  <Option value="support_agent">Support Agent</Option>
                  <Option value="manager">Manager</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Permissions"
            name="permissions"
            rules={[{ required: true, message: 'Please select permissions' }]}
          >
            <Select 
              mode="multiple" 
              placeholder="Select permissions"
              style={{ width: '100%' }}
            >
              <Option value="view_users">View Users</Option>
              <Option value="view_restaurants">View Restaurants</Option>
              <Option value="view_analytics">View Analytics</Option>
              <Option value="edit_users">Edit Users</Option>
              <Option value="edit_restaurants">Edit Restaurants</Option>
              <Option value="view_reports">View Reports</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
            >
              {editingUser ? 'Update' : 'Add'} User
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CorporateSupportAccess;

