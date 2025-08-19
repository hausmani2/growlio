import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Space, Divider, message, Modal, Typography, Row, Col, Avatar, Tabs } from 'antd';
import { UserOutlined, LockOutlined, DeleteOutlined, SaveOutlined, KeyOutlined, SecurityScanOutlined } from '@ant-design/icons';
import { apiGet, apiPut, apiPost } from '../../../utils/axiosInterceptors';
import useStore from '../../../store/store';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Profile = () => {
  const navigate = useNavigate();
  const { logout } = useStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [deleteForm] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    full_name: '',
    created_date: '',
    role: ''
  });
  
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const response = await apiGet('/authentication/profile/');
      
      if (response.data.status === 'success') {
        setProfileData(response.data.data);
        profileForm.setFieldsValue({
          full_name: response.data.data.full_name || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      message.error('Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileUpdate = async (values) => {
    try {
      setLoading(true);
      const response = await apiPut('/authentication/profile/', values);
      
      if (response.data.status === 'success') {
        message.success('Profile updated successfully');
        fetchProfileData(); // Refresh data
      } else {
        message.error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    try {
      setPasswordLoading(true);
      const response = await apiPost('/authentication/change-password/', values);
      
      if (response.data.status === 'success') {
        message.success('Password changed successfully');
        passwordForm.resetFields();
      } else {
        message.error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      message.error('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (values) => {
    try {
      setDeleteLoading(true);
      const response = await apiPost('/authentication/delete-account/', values);
      
      if (response.data.status === 'success') {
        message.success('Account deleted successfully');
        logout();
        navigate('/login');
      } else {
        message.error(response.data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      message.error('Failed to delete account');
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalVisible(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              Settings
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your account information, security settings, and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Content Section with Tabs */}
      <Card className="shadow-lg border-0">
        <Tabs 
          defaultActiveKey="profile" 
          size="large"
          tabPosition="top"
          className="settings-tabs"
          tabBarStyle={{ 
            borderBottom: '2px solid #f3f4f6',
            marginBottom: '24px'
          }}
        >
          {/* Profile Tab */}
          <TabPane 
            tab={
              <span className="flex items-center gap-2">
                <UserOutlined />
                Profile
              </span>
            } 
            key="profile"
          >
            <div className="space-y-6">
              {/* Profile Information Card */}
              <Card className="shadow-sm border-0 bg-gray-50">
                <div className="pb-3 border-b border-gray-200 mb-6">
                  <h3 className="text-xl font-bold text-orange-600">Profile Information</h3>
                </div>
                
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={16}>
                    <Form
                      form={profileForm}
                      layout="vertical"
                      onFinish={handleProfileUpdate}
                      disabled={profileLoading}
                    >
                      <Form.Item
                        label="Full Name"
                        name="full_name"
                        rules={[{ required: true, message: 'Please enter your full name' }]}
                      >
                        <Input 
                          prefix={<UserOutlined />} 
                          placeholder="Enter your full name"
                          size="large"
                        />
                      </Form.Item>
                      
                      <Form.Item>
                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<SaveOutlined />}
                          loading={loading}
                          size="large"
                          className="bg-orange-500 hover:bg-orange-600 border-0"
                        >
                          Update Profile
                        </Button>
                      </Form.Item>
                    </Form>
                  </Col>
                  
                  <Col xs={24} md={8}>
                    <div className="text-center">
                      <Avatar size={80} icon={<UserOutlined />} className="mb-4" />
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>
                          <Text strong>Username:</Text> {profileData.username}
                        </div>
                        <div>
                          <Text strong>Email:</Text> {profileData.email}
                        </div>
                        <div>
                          <Text strong>Member Since:</Text> {formatDate(profileData.created_date)}
                        </div>
                        <div>
                          <Text strong>Role:</Text> {profileData.role || 'User'}
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>
          </TabPane>

          {/* Security Tab */}
          <TabPane 
            tab={
              <span className="flex items-center gap-2">
                <SecurityScanOutlined />
                Security
              </span>
            } 
            key="security"
          >
            <div className="space-y-6">
              {/* Change Password Card */}
              <Card className="shadow-sm border-0 bg-gray-50">
                <div className="pb-3 border-b border-gray-200 mb-6">
                  <h3 className="text-xl font-bold text-orange-600">Change Password</h3>
                </div>
                
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordChange}
                  disabled={passwordLoading}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Current Password"
                        name="current_password"
                        rules={[{ required: true, message: 'Please enter your current password' }]}
                      >
                        <Input.Password 
                          prefix={<LockOutlined />} 
                          placeholder="Current password"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="New Password"
                        name="new_password"
                        rules={[
                          { required: true, message: 'Please enter your new password' },
                          { min: 8, message: 'Password must be at least 8 characters' }
                        ]}
                      >
                        <Input.Password 
                          prefix={<KeyOutlined />} 
                          placeholder="New password"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Confirm Password"
                        name="confirm_password"
                        rules={[
                          { required: true, message: 'Please confirm your new password' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue('new_password') === value) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error('Passwords do not match'));
                            },
                          }),
                        ]}
                      >
                        <Input.Password 
                          prefix={<KeyOutlined />} 
                          placeholder="Confirm password"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<KeyOutlined />}
                      loading={passwordLoading}
                      size="large"
                      className="bg-orange-500 hover:bg-orange-600 border-0"
                    >
                      Change Password
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              {/* Danger Zone Card */}
              <Card className="shadow-sm border-0 border-red-200 bg-red-50">
                <div className="pb-3 border-b border-red-200 mb-6">
                  <h3 className="text-xl font-bold text-red-600">Danger Zone</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Text strong className="text-red-600">Delete Account</Text>
                    <Text className="text-gray-600 block mt-2">
                      Once you delete your account, there is no going back. Please be certain.
                    </Text>
                  </div>
                  
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => setIsDeleteModalVisible(true)}
                    size="large"
                  >
                    Delete Account
                  </Button>
                </div>
              </Card>
            </div>
          </TabPane>


        </Tabs>
      </Card>

      {/* Delete Account Modal */}
      <Modal
        title="Delete Account"
        open={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        footer={null}
        centered
      >
        <div className="space-y-4">
          <div className="text-center">
            <DeleteOutlined className="text-red-500 text-4xl mb-4" />
            <Title level={4} className="text-red-600">Are you sure?</Title>
            <Text className="text-gray-600">
              This action cannot be undone. This will permanently delete your account and remove all your data.
            </Text>
          </div>
          
          <Form
            form={deleteForm}
            layout="vertical"
            onFinish={handleDeleteAccount}
          >
            <Form.Item
              label="Enter your password to confirm"
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Enter password"
                size="large"
              />
            </Form.Item>
            
            <div className="flex justify-end gap-3">
              <Button onClick={() => setIsDeleteModalVisible(false)}>
                Cancel
              </Button>
              <Button
                danger
                htmlType="submit"
                loading={deleteLoading}
                icon={<DeleteOutlined />}
              >
                Delete Account
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
