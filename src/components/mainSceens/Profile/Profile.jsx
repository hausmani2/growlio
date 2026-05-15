import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Modal, Typography, Row, Col, Avatar, Tabs, Table, Select, Tag, Popconfirm } from 'antd';
import { UserOutlined, LockOutlined, DeleteOutlined, SaveOutlined, KeyOutlined, SecurityScanOutlined, TeamOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { apiGet, apiPut, apiPost, apiPatch, apiDelete } from '../../../utils/axiosInterceptors';
import useStore from '../../../store/store';
import useRestaurantRole from '../../../hooks/useRestaurantRole';
import { RESTAURANT_ROLES, getRolePermissions, normalizeRestaurantRole } from '../../../utils/rolePermissions';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Profile = () => {
  const logout = useStore((state) => state.logout);
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [deleteForm] = Form.useForm();
  const [memberForm] = Form.useForm();
  const { restaurantId, isOwner, canManageUsers } = useRestaurantRole();
  
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSaving, setMemberSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [isMemberModalVisible, setIsMemberModalVisible] = useState(false);
  
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

  useEffect(() => {
    if (restaurantId) {
      fetchMembers();
    }
  }, [restaurantId]);

  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const response = await apiGet('/authentication/profile/');
      
      if (response.data.status === 'success') {
        setProfileData(response.data.data);
        // Keep global user state in sync so Header updates immediately
        setUser?.({
          full_name: response.data.data.full_name,
          email: response.data.data.email,
          username: response.data.data.username,
          role: response.data.data.role,
          restaurant_role: normalizeRestaurantRole(response.data.data.restaurant_role || response.data.data.role),
        });
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

  const fetchMembers = async () => {
    if (!restaurantId) return;

    try {
      setMembersLoading(true);
      const response = await apiGet(`/restaurant_v2/members/?restaurant_id=${restaurantId}`);
      setMembers(Array.isArray(response.data) ? response.data : response.data?.data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      message.error('Failed to load profile management users');
    } finally {
      setMembersLoading(false);
    }
  };

  const openAddMemberModal = () => {
    setEditingMember(null);
    memberForm.resetFields();
    memberForm.setFieldsValue({ role: RESTAURANT_ROLES.MANAGER });
    setIsMemberModalVisible(true);
  };

  const openEditMemberModal = (member) => {
    setEditingMember(member);
    memberForm.setFieldsValue({
      full_name: member.full_name,
      email: member.email,
      role: normalizeRestaurantRole(member.role),
      password: '',
    });
    setIsMemberModalVisible(true);
  };

  const handleMemberSave = async (values) => {
    if (!restaurantId || !canManageUsers) return;

    const payload = {
      restaurant_id: Number(restaurantId),
      email: values.email,
      role: values.role,
      full_name: values.full_name,
      ...(values.password ? { password: values.password } : {}),
    };

    try {
      setMemberSaving(true);
      if (editingMember) {
        await apiPatch(`/restaurant_v2/members/${editingMember.id}/`, payload);
        message.success('User role updated successfully');
      } else {
        await apiPost('/restaurant_v2/members/', payload);
        message.success('User added successfully');
      }

      setIsMemberModalVisible(false);
      setEditingMember(null);
      memberForm.resetFields();
      fetchMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Failed to save user';
      message.error(errorMessage);
    } finally {
      setMemberSaving(false);
    }
  };

  const handleMemberDelete = async (member) => {
    if (!canManageUsers || normalizeRestaurantRole(member.role) === RESTAURANT_ROLES.OWNER) return;

    try {
      await apiDelete(`/restaurant_v2/members/${member.id}/`);
      message.success('User removed successfully');
      fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      message.error('Failed to remove user');
    }
  };

  const roleOptions = [
    { label: 'Manager', value: RESTAURANT_ROLES.MANAGER },
    { label: 'Leader', value: RESTAURANT_ROLES.LEADER },
  ];

  const memberColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, member) => (
        <div>
          <div className="font-semibold text-gray-800">{member.full_name || member.username || 'N/A'}</div>
          <div className="text-sm text-gray-500">{member.email}</div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const normalizedRole = normalizeRestaurantRole(role);
        const color = normalizedRole === RESTAURANT_ROLES.OWNER ? 'orange' : normalizedRole === RESTAURANT_ROLES.MANAGER ? 'blue' : 'green';
        return <Tag color={color}>{normalizedRole.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Permissions',
      key: 'permissions',
      render: (_, member) => {
        const permissions = getRolePermissions(member.role);
        const labels = [
          permissions.canManageUsers ? 'Users' : null,
          permissions.canManageLocations ? 'Locations' : null,
          permissions.canCreateBudget ? 'Create Budget' : 'View Budget',
          permissions.canCloseDays ? 'Close Days' : null,
          permissions.canAccessSimulator ? 'Simulator' : null,
        ].filter(Boolean);
        return <span className="text-sm text-gray-600">{labels.join(', ')}</span>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, member) => {
        const memberIsOwner = normalizeRestaurantRole(member.role) === RESTAURANT_ROLES.OWNER;
        if (memberIsOwner) {
          return <span className="text-sm text-gray-400">Owner cannot be edited or deleted</span>;
        }

        return (
          <div className="flex justify-end gap-2">
            <Button icon={<EditOutlined />} onClick={() => openEditMemberModal(member)} disabled={!canManageUsers}>
              Edit
            </Button>
            <Popconfirm
              title="Remove this user?"
              okText="Remove"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleMemberDelete(member)}
              disabled={!canManageUsers}
            >
              <Button danger icon={<DeleteOutlined />} disabled={!canManageUsers}>
                Delete
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  const handleProfileUpdate = async (values) => {
    try {
      setLoading(true);
      const response = await apiPut('/authentication/profile/', values);
      
      if (response.data.status === 'success') {
        message.success('Profile updated successfully');
        // Update Header immediately (no logout/login needed)
        if (values?.full_name) {
          setUser?.({ full_name: values.full_name });
        }
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
        const serverMessage = response?.data?.message || 'Failed to change password';
        const serverErrorsRaw = response?.data?.errors;
        const serverErrors = Array.isArray(serverErrorsRaw)
          ? serverErrorsRaw.filter(Boolean).map(String)
          : [];

        if (serverErrors.length > 0) {
          passwordForm.setFields([
            { name: 'new_password', errors: serverErrors },
          ]);
          message.error(serverMessage);
        } else {
          message.error(serverMessage);
        }
      }
    } catch (error) {
      console.error('Error changing password:', error);
      const data = error?.response?.data;
      const serverMessage = data?.message || data?.error || 'Failed to change password';
      const serverErrorsRaw = data?.errors;
      const serverErrors = Array.isArray(serverErrorsRaw)
        ? serverErrorsRaw.filter(Boolean).map(String)
        : [];

      if (serverErrors.length > 0) {
        passwordForm.setFields([
          { name: 'new_password', errors: serverErrors },
        ]);
      }
      message.error(serverMessage);
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
        // logout() function now handles redirect internally
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
                        rules={[
                          { required: true, message: 'Please enter your full name' },
                          {
                            pattern: /^[A-Za-z][A-Za-z\s.'-]*$/,
                            message: 'Full Name can only contain letters, spaces, apostrophes, periods, and hyphens',
                          },
                        ]}
                      >
                        <Input 
                          prefix={<UserOutlined />} 
                          placeholder="Enter your full name"
                          size="large"
                          onChange={(e) => {
                            const raw = e.target.value ?? '';
                            // Remove digits and collapse repeated whitespace for a clean, predictable input.
                            const cleaned = String(raw)
                              .replace(/[0-9]/g, '')
                              .replace(/\s+/g, ' ');
                            profileForm.setFieldsValue({ full_name: cleaned });
                          }}
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

          {/* Profile Management Tab */}
          <TabPane
            tab={
              <span className="flex items-center gap-2">
                <TeamOutlined />
                Profile Management
              </span>
            }
            key="profile-management"
          >
            <div className="space-y-6">
              <Card className="shadow-sm border-0 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-gray-200 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-orange-600">Users & Roles</h3>
                    <p className="text-sm text-gray-600 mb-0">
                      Owners can add managers and leaders. The original owner cannot be edited or deleted.
                    </p>
                  </div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openAddMemberModal}
                    disabled={!canManageUsers || !restaurantId}
                    className="bg-orange-500 hover:bg-orange-600 border-0"
                  >
                    Add User
                  </Button>
                </div>

                {!isOwner && (
                  <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    Your role can view this list, but only the restaurant owner can manage users and roles.
                  </div>
                )}

                <Table
                  rowKey="id"
                  columns={memberColumns}
                  dataSource={members}
                  loading={membersLoading}
                  pagination={false}
                  scroll={{ x: 900 }}
                />
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

              {/* Danger Zone Card - Only show for non-super admin users */}
              {!user?.is_superuser && (
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
              )}
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

      <Modal
        title={editingMember ? 'Edit User Role' : 'Add User'}
        open={isMemberModalVisible}
        onCancel={() => {
          setIsMemberModalVisible(false);
          setEditingMember(null);
          memberForm.resetFields();
        }}
        footer={null}
        centered
        destroyOnClose
      >
        <Form form={memberForm} layout="vertical" onFinish={handleMemberSave}>
          <Form.Item
            label="Full Name"
            name="full_name"
            rules={[
              { required: true, message: 'Please enter full name' },
              {
                pattern: /^[A-Za-z][A-Za-z\s.'-]*$/,
                message: 'Full Name can only contain letters, spaces, apostrophes, periods, and hyphens',
              },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Full name" size="large" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="user@example.com" size="large" disabled={!!editingMember} />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select size="large" options={roleOptions} />
          </Form.Item>

          {!editingMember && (
            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>
          )}

          {editingMember && (
            <Form.Item
              label="New Password"
              name="password"
              rules={[{ min: 8, message: 'Password must be at least 8 characters' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Leave blank to keep current password" size="large" />
            </Form.Item>
          )}

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setIsMemberModalVisible(false);
                setEditingMember(null);
                memberForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={memberSaving}
              className="bg-orange-500 hover:bg-orange-600 border-0"
            >
              {editingMember ? 'Save Changes' : 'Add User'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
