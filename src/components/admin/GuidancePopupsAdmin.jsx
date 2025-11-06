import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, message, Popconfirm, Space, Tag, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BellOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/axiosInterceptors';

// Page options for guidance popups
const pageOptions = [
  { label: 'Welcome Screen', value: 'congratulations' },
  { label: 'Restaurant Setup', value: 'onboarding' },
  { label: 'Onboarding: Basic Information', value: 'onboarding_basic_information' },
  { label: 'Onboarding: Labor Information', value: 'onboarding_labor_information' },
  { label: 'Onboarding: Food Cost Details', value: 'onboarding_food_cost_details' },
  { label: 'Onboarding: Sales Channels', value: 'onboarding_sales_channels' },
  { label: 'Onboarding: Expense', value: 'onboarding_expense' },
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Budget', value: 'budget' },
  { label: 'Weekly Sales Data', value: 'weekly_sales_data' },
  { label: 'Budget vs Actual', value: 'budget_vs_actual' },
  { label: 'Support', value: 'support' },
  { label: 'Profit & Loss', value: 'profit_loss' },
  { label: 'Basic Information', value: 'basic_information' },
  { label: 'Labor Information', value: 'labor_information' },
  { label: 'Food Cost Details', value: 'food_cost_details' },
  { label: 'Sales Channels', value: 'sales_channels' },
  { label: 'Expense', value: 'expense' },
  { label: 'Profile', value: 'profile' },
  { label: 'FAQ', value: 'faq' },
  { label: 'Admin Users', value: 'admin_users' },
  { label: 'Admin Tooltips', value: 'admin_tooltips' },
];

const GuidancePopupsAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageFilter, setPageFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedPage, setSelectedPage] = useState('budget');
  const [form] = Form.useForm();

  // Mock data for demonstration
  const mockData = [
    {
      id: 1,
      page: 'budget',
      key: 'budget_dashboard_title',
      title: 'Weekly Budgeted Dashboard',
      text: 'This is your main budget dashboard. Here you can see your weekly budget, estimated profit or loss, and all your financial metrics. Use it to plan your week and track your performance.',
      is_active: true,
    },
    {
      id: 2,
      page: 'budget',
      key: 'add_sales_data_title',
      title: 'Add Sales Data for Week',
      text: 'This is where you enter your weekly sales data. Fill in the budgeted sales, actual sales, and other details for each day of the week.',
      is_active: true,
    },
    {
      id: 3,
      page: 'weekly_sales_data',
      key: 'weekly_sales_data_title',
      title: 'Weekly Sales Data',
      text: 'View and manage your weekly sales data here. Track your budgeted vs actual sales, monitor daily performance, and analyze trends.',
      is_active: true,
    },
    {
      id: 4,
      page: 'weekly_sales_data',
      key: 'weekly_totals_section',
      title: 'Weekly Totals',
      text: 'See your weekly totals for sales budget, actual sales in-store, and app/online sales. This gives you a quick overview of your week\'s performance.',
      is_active: true,
    },
    {
      id: 5,
      page: 'budget_vs_actual',
      key: 'budget_vs_actual_title',
      title: 'Budget vs Actual',
      text: 'Compare your budgeted amounts with actual results. This helps you identify areas where you\'re over or under budget and make adjustments.',
      is_active: true,
    },
    {
      id: 6,
      page: 'budget_vs_actual',
      key: 'budget_vs_actual_chart',
      title: 'Budget vs Actual Chart',
      text: 'Visualize the difference between your budgeted and actual values using this interactive chart. Hover over data points to see detailed information.',
      is_active: true,
    },
    {
      id: 7,
      page: 'support',
      key: 'support_page_title',
      title: 'Support & Help',
      text: 'Need help? Contact our support team or browse frequently asked questions. We\'re here to assist you with any questions or issues you may have.',
      is_active: true,
    },
    {
      id: 8,
      page: 'support',
      key: 'contact_form_section',
      title: 'Contact Form',
      text: 'Fill out this form to send a message to our support team. Include your name, email, restaurant name, and a detailed description of your question or issue.',
      is_active: true,
    },
    {
      id: 9,
      page: 'support',
      key: 'faq_section',
      title: 'Frequently Asked Questions',
      text: 'Browse common questions and answers about Growlio. Find quick solutions to common issues and learn more about using the platform.',
      is_active: true,
    },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/admin_access/guidance-popups/');
      let data = response.data || [];
      
      // If no data from API, use mock data for demonstration
      if (data.length === 0) {
        data = mockData;
      }
      
      // Filter by page if selected
      if (pageFilter) {
        data = data.filter(item => item.page === pageFilter);
      }
      
      // Sort by page, then by id
      data.sort((a, b) => {
        if (a.page !== b.page) {
          return a.page.localeCompare(b.page);
        }
        return a.id - b.id;
      });
      
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch guidance popups:', error);
      // If API fails, use mock data for demonstration
      let data = mockData;
      if (pageFilter) {
        data = data.filter(item => item.page === pageFilter);
      }
      data.sort((a, b) => {
        if (a.page !== b.page) {
          return a.page.localeCompare(b.page);
        }
        return a.id - b.id;
      });
      setItems(data);
      message.warning('Using mock data. API connection failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pageFilter]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    const defaultPage = pageFilter || 'budget';
    setSelectedPage(defaultPage);
    form.setFieldsValue({
      page: defaultPage,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setSelectedPage(record.page);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editing) {
        // Update existing
        await apiPut(`/admin_access/guidance-popups/${editing.id}/`, values);
        message.success('Guidance popup updated successfully');
      } else {
        // Create new
        await apiPost('/admin_access/guidance-popups/', values);
        message.success('Guidance popup created successfully');
      }
      
      setIsModalOpen(false);
      setEditing(null);
      form.resetFields();
      fetchData();
    } catch (error) {
      if (error.response?.data) {
        const errorMsg = typeof error.response.data === 'string' 
          ? error.response.data 
          : Object.values(error.response.data).flat().join(', ');
        message.error(`Failed to save: ${errorMsg}`);
      } else {
        message.error('Failed to save guidance popup');
      }
    }
  };

  const handleDelete = async (record) => {
    try {
      await apiDelete(`/admin_access/guidance-popups/${record.id}/`);
      message.success('Guidance popup deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to delete guidance popup');
    }
  };

  // Get key options based on selected page
  const getKeyOptions = (page) => {
    switch (page) {
      case 'budget':
        return [
          { label: 'Budget Dashboard Title', value: 'budget_dashboard_title' },
          { label: 'Labor Rate Confirmation Title', value: 'labor_rate_confirmation_title' },
          { label: 'Labor Rate Confirmation Message', value: 'labor_rate_confirmation_message' },
          { label: 'Labor Rate Information Section', value: 'labor_rate_information_section' },
          { label: 'Labor Rate Use Last Week Button', value: 'labor_rate_use_last_week_button' },
          { label: 'Add Sales Data Title', value: 'add_sales_data_title' },
          { label: 'Daily Sales Data Section', value: 'daily_sales_data_section' },
        ];
      case 'weekly_sales_data':
        return [
          { label: 'Weekly Sales Data Title', value: 'weekly_sales_data_title' },
          { label: 'Weekly Totals Section', value: 'weekly_totals_section' },
          { label: 'Sales Budget Input', value: 'sales_budget_input' },
          { label: 'Actual Sales In Store', value: 'actual_sales_in_store' },
          { label: 'Actual Sales App Online', value: 'actual_sales_app_online' },
        ];
      case 'budget_vs_actual':
        return [
          { label: 'Budget vs Actual Title', value: 'budget_vs_actual_title' },
          { label: 'Budget vs Actual Chart', value: 'budget_vs_actual_chart' },
          { label: 'Sales Comparison Section', value: 'sales_comparison_section' },
          { label: 'Labor Comparison Section', value: 'labor_comparison_section' },
          { label: 'Food Cost Comparison Section', value: 'food_cost_comparison_section' },
        ];
      case 'support':
        return [
          { label: 'Support Page Title', value: 'support_page_title' },
          { label: 'Contact Form Section', value: 'contact_form_section' },
          { label: 'Full Name Input', value: 'full_name_input' },
          { label: 'Email Input', value: 'email_input' },
          { label: 'Restaurant Name Input', value: 'restaurant_name_input' },
          { label: 'Message Textarea', value: 'message_textarea' },
          { label: 'Submit Button', value: 'submit_button' },
          { label: 'FAQ Section', value: 'faq_section' },
          { label: 'Contact Methods', value: 'contact_methods' },
        ];
      case 'congratulations':
        return [
          { label: 'Welcome Title', value: 'welcome_title' },
          { label: 'Welcome Message', value: 'welcome_message' },
          { label: 'Get Started Button', value: 'get_started_button' },
        ];
      case 'onboarding':
        return [
          { label: 'Restaurant Setup Title', value: 'restaurant_setup_title' },
          { label: 'Restaurant Setup Description', value: 'restaurant_setup_description' },
          { label: 'Continue Button', value: 'continue_button' },
        ];
      case 'onboarding_basic_information':
        return [
          { label: 'Step Navigation Bar', value: 'step_navigation_bar' },
          { label: 'Step 1 Basic Information', value: 'step_1_basic_information' },
          { label: 'Step 2 Sales Channels', value: 'step_2_sales_channels' },
          { label: 'Step 3 Labor Information', value: 'step_3_labor_information' },
          { label: 'Step 4 Food Cost Details', value: 'step_4_food_cost_details' },
          { label: 'Step 5 Expense', value: 'step_5_expense' },
        ];
      case 'onboarding_sales_channels':
        return [
          { label: 'Sales Channels Title', value: 'sales_channels_title' },
          { label: 'Sales Channels Section', value: 'sales_channels_section' },
          { label: 'Sales Channel In Store', value: 'sales_channel_in_store' },
        ];
      case 'onboarding_labor_information':
        return [
          { label: 'Labor Information Title', value: 'labor_information_title' },
          { label: 'Labor Goals Section', value: 'labor_goals_section' },
          { label: 'Labor Goal Field', value: 'labor_goal_field' },
        ];
      case 'onboarding_food_cost_details':
        return [
          { label: 'Food Cost Title', value: 'food_cost_title' },
          { label: 'COGS Goals Section', value: 'cogs_goals_section' },
          { label: 'COGS Goal Field', value: 'cogs_goal_field' },
        ];
      case 'onboarding_expense':
        return [
          { label: 'Fixed Cost Title', value: 'fixed_cost_title' },
          { label: 'Fixed Costs Section', value: 'fixed_costs_section' },
          { label: 'Variable Cost Title', value: 'variable_cost_title' },
          { label: 'Variable Costs Section', value: 'variable_costs_section' },
          { label: 'Total Expense Title', value: 'total_expense_title' },
          { label: 'Total Expense Display', value: 'total_expense_display' },
          { label: 'Expense Continue Button', value: 'expense_continue_button' },
        ];
      default:
        return [];
    }
  };

  const columns = [
    {
      title: 'Page',
      dataIndex: 'page',
      key: 'page',
      width: 180,
      render: (page) => {
        const pageOption = pageOptions.find(p => p.value === page);
        return pageOption ? pageOption.label : page;
      },
    },
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (key) => (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{key}</code>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'Text',
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
      render: (text) => (
        <span className="text-gray-600" title={text}>
          {text?.substring(0, 60)}
          {text?.length > 60 ? '...' : ''}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (isActive) => (
        <Tag 
          color={isActive ? 'green' : 'default'} 
          icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
            size="small"
            className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this guidance popup?"
            description="Are you sure you want to delete this popup? This action cannot be undone."
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Calculate statistics
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter(item => item.is_active).length;
    const inactive = items.filter(item => !item.is_active).length;
    return { total, active, inactive };
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header Section - Matching other dashboards */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-3 border-b border-gray-200">
          {/* Left Side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              Guidance Popups Management
            </h1>
            <p className="text-gray-600 text-lg">
              Manage interactive guidance popups that appear to new users across different pages. Create, edit, and configure step-by-step guidance tours.
            </p>
          </div>
          
          {/* Right Side - Statistics */}
          <div className="flex flex-row gap-3">
            <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 min-w-[140px]">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <BellOutlined className="text-blue-600 text-lg" />
                </div>
              </div>
              <div className="ml-2 flex-1">
                <p className="text-xs font-medium text-gray-600 mb-0.5">Total Popups</p>
                <p className="text-xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200 min-w-[140px]">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircleOutlined className="text-emerald-600 text-lg" />
                </div>
              </div>
              <div className="ml-2 flex-1">
                <p className="text-xs font-medium text-gray-600 mb-0.5">Active</p>
                <p className="text-xl font-bold text-emerald-900">{stats.active}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200 min-w-[140px]">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <CloseCircleOutlined className="text-gray-600 text-lg" />
                </div>
              </div>
              <div className="ml-2 flex-1">
                <p className="text-xs font-medium text-gray-600 mb-0.5">Inactive</p>
                <p className="text-xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Table Section */}
      <Card className="shadow-lg border-0 rounded-xl">
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h3 className="text-lg font-bold text-orange-600">Guidance Popups Table</h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select
              value={pageFilter}
              onChange={setPageFilter}
              style={{ width: 240, height: 40 }}
              placeholder="Filter by page"
              allowClear
              options={[
                { label: 'All Pages', value: '' },
                ...pageOptions,
              ]}
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={openCreate}
              size="large"
              className="bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Add Guidance Popup
            </Button>
          </div>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          columns={columns}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} popups`,
          }}
          scroll={{ x: 1000 }}
          className="modern-table"
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editing ? 'Edit Guidance Popup' : 'Create Guidance Popup'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          setEditing(null);
          setSelectedPage('budget');
          form.resetFields();
        }}
        okText={editing ? 'Save' : 'Create'}
        cancelText="Cancel"
        width={600}
        className="modern-modal"
        okButtonProps={{
          className: 'bg-gradient-to-r from-orange-500 to-orange-600 border-0 shadow-lg hover:shadow-xl',
        }}
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{ is_active: true }}
        >
          <Form.Item
            name="page"
            label="Page"
            rules={[{ required: true, message: 'Please select a page' }]}
            tooltip="Select the page where this popup will appear"
          >
            <Select
              options={pageOptions}
              placeholder="Select a page"
              onChange={(val) => {
                setSelectedPage(val);
                form.setFieldsValue({ page: val, key: undefined });
              }}
            />
          </Form.Item>

          <Form.Item
            name="key"
            label="Element Key (Div)"
            rules={[{ required: true, message: 'Please select an element key' }]}
            tooltip="Select the div/element on the page where this popup will appear"
          >
            <Select
              placeholder="Select a div/element"
              options={getKeyOptions(selectedPage)}
              disabled={!selectedPage}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
            tooltip="The title displayed at the top of the popup"
          >
            <Input
              placeholder="e.g., Understanding Your Daily Sales"
              maxLength={100}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="text"
            label="Text"
            rules={[{ required: true, message: 'Please enter popup text' }]}
            tooltip="The main content of the guidance popup"
          >
            <Input.TextArea
              rows={4}
              placeholder="Enter the guidance text that will be displayed to users..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Active Status"
            valuePropName="checked"
            tooltip="Only active popups will be shown to users"
          >
            <Switch />
          </Form.Item>

          {editing && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Note:</strong> Make sure the target element on the page has the matching <code className="bg-blue-100 px-1 rounded">data-guidance="{editing.key}"</code> attribute.
              </p>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default GuidancePopupsAdmin;

