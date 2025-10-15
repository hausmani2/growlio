import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Switch, 
  Button, 
  Select, 
  InputNumber, 
  message,
  Row,
  Col,
  Typography,
  Divider,
  Space,
  Alert
} from 'antd';
import { 
  SettingOutlined, 
  SaveOutlined, 
  ReloadOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  MailOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SystemSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Settings saved successfully');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    message.info('Settings reset to default values');
  };

  return (
    <div className="space-y-6">
      <div>
        <Title level={3}>System Settings</Title>
        <Text type="secondary">
          Configure platform-wide settings and preferences
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          platformName: 'Growlio',
          maintenanceMode: false,
          userRegistration: true,
          emailNotifications: true,
          maxFileSize: 10,
          sessionTimeout: 30,
          backupFrequency: 'daily',
          logLevel: 'info'
        }}
      >
        {/* General Settings */}
        <Card title="General Settings" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Platform Name"
                name="platformName"
                rules={[{ required: true, message: 'Please enter platform name' }]}
              >
                <Input prefix={<SettingOutlined />} placeholder="Enter platform name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Maintenance Mode"
                name="maintenanceMode"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="User Registration"
                name="userRegistration"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email Notifications"
                name="emailNotifications"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Security Settings */}
        <Card title="Security Settings" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Session Timeout (minutes)"
                name="sessionTimeout"
                rules={[{ required: true, message: 'Please enter session timeout' }]}
              >
                <InputNumber 
                  min={5} 
                  max={480} 
                  style={{ width: '100%' }}
                  prefix={<SecurityScanOutlined />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Max Login Attempts"
                name="maxLoginAttempts"
                rules={[{ required: true, message: 'Please enter max login attempts' }]}
              >
                <InputNumber 
                  min={3} 
                  max={10} 
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Password Policy"
                name="passwordPolicy"
              >
                <Select placeholder="Select password policy">
                  <Option value="basic">Basic (6+ characters)</Option>
                  <Option value="medium">Medium (8+ chars, 1 number)</Option>
                  <Option value="strong">Strong (8+ chars, numbers, symbols)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Two-Factor Authentication"
                name="twoFactorAuth"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* File Upload Settings */}
        <Card title="File Upload Settings" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Max File Size (MB)"
                name="maxFileSize"
                rules={[{ required: true, message: 'Please enter max file size' }]}
              >
                <InputNumber 
                  min={1} 
                  max={100} 
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Allowed File Types"
                name="allowedFileTypes"
              >
                <Select 
                  mode="multiple" 
                  placeholder="Select allowed file types"
                  style={{ width: '100%' }}
                >
                  <Option value="jpg">JPG</Option>
                  <Option value="png">PNG</Option>
                  <Option value="gif">GIF</Option>
                  <Option value="pdf">PDF</Option>
                  <Option value="doc">DOC</Option>
                  <Option value="docx">DOCX</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Database Settings */}
        <Card title="Database Settings" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Backup Frequency"
                name="backupFrequency"
                rules={[{ required: true, message: 'Please select backup frequency' }]}
              >
                <Select prefix={<DatabaseOutlined />}>
                  <Option value="hourly">Hourly</Option>
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Log Level"
                name="logLevel"
                rules={[{ required: true, message: 'Please select log level' }]}
              >
                <Select>
                  <Option value="debug">Debug</Option>
                  <Option value="info">Info</Option>
                  <Option value="warn">Warning</Option>
                  <Option value="error">Error</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Database Connection String"
                name="dbConnectionString"
              >
                <Input.Password placeholder="Enter database connection string" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Email Settings */}
        <Card title="Email Settings" className="mb-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="SMTP Server"
                name="smtpServer"
              >
                <Input prefix={<MailOutlined />} placeholder="smtp.example.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="SMTP Port"
                name="smtpPort"
              >
                <InputNumber 
                  min={1} 
                  max={65535} 
                  style={{ width: '100%' }}
                  placeholder="587"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email Username"
                name="emailUsername"
              >
                <Input placeholder="Enter email username" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Email Password"
                name="emailPassword"
              >
                <Input.Password placeholder="Enter email password" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Custom Settings */}
        <Card title="Custom Settings" className="mb-6">
          <Form.Item
            label="Custom CSS"
            name="customCSS"
          >
            <TextArea 
              rows={6} 
              placeholder="Enter custom CSS styles..."
            />
          </Form.Item>
          <Form.Item
            label="Custom JavaScript"
            name="customJS"
          >
            <TextArea 
              rows={6} 
              placeholder="Enter custom JavaScript code..."
            />
          </Form.Item>
        </Card>

        {/* Action Buttons */}
        <Card>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />}
              loading={loading}
            >
              Save Settings
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleReset}
            >
              Reset to Default
            </Button>
          </Space>
        </Card>
      </Form>
    </div>
  );
};

export default SystemSettings;

