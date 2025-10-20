import React, { useState, useEffect } from 'react';
import { 
  MailOutlined, 
  PhoneOutlined, 
  MessageOutlined, 
  ClockCircleOutlined,
  QuestionCircleOutlined,
  SendOutlined,
  CheckCircleOutlined,
  UserOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { Input, Button, Form, message, Card, Collapse, Row, Col } from 'antd';
import GrowlioLogo from '../../common/GrowlioLogo';
import useStore from '../../../store/store';

const { TextArea } = Input;
const { Panel } = Collapse;

const SupportPage = () => {
  const [form] = Form.useForm();
  
  // Get user and restaurant data from store
  const user = useStore((state) => state.user);
  const completeOnboardingData = useStore((state) => state.completeOnboardingData);
  
  // Get support slice data and actions
  const {
    supportLoading,
    supportError,
    supportSuccess,
    supportFormData,
    submitSupportTicket,
    updateSupportFormDataMultiple,
    clearSupportError,
    clearSupportSuccess
  } = useStore();
  
  // Extract user information
  const fullName = user?.full_name || '';
  const email = user?.email || '';
  
  // Extract restaurant information
  const restaurantName = completeOnboardingData?.["Basic Information"]?.data?.restaurant_name || '';
  
  // Set form values when component mounts or data changes
  useEffect(() => {
    if (fullName || email || restaurantName) {
      const formData = {
        fullName: fullName || '',
        email: email || '',
        restaurant: restaurantName || ''
      };
      
      form.setFieldsValue(formData);
      
      // Update support form data in store
      updateSupportFormDataMultiple(formData);
    }
  }, [fullName, email, restaurantName, form, updateSupportFormDataMultiple]);
  
  // Clear success message after 5 seconds
  useEffect(() => {
    if (supportSuccess) {
      const timer = setTimeout(() => {
        clearSupportSuccess();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [supportSuccess, clearSupportSuccess]);

  const handleSubmit = async (values) => {
    try {
      // Clear any previous errors
      clearSupportError();
      
      // Update form data in store with current values
      updateSupportFormDataMultiple(values);
      
      // Submit support ticket using the slice
      const result = await submitSupportTicket(values);
      
      if (result.success) {
        message.success('Your support ticket has been submitted successfully! We\'ll get back to you within 24 hours.');
        form.resetFields();
        
        // Reset form to auto-populated values
        const formData = {
          fullName: fullName || '',
          email: email || '',
          restaurant: restaurantName || ''
        };
        form.setFieldsValue(formData);
        updateSupportFormDataMultiple(formData);
      }
    } catch (error) {
      console.error('Support ticket submission error:', error);
      message.error(error.message || 'Failed to send message. Please try again.');
    }
  };

  const faqData = [
    {
      key: '1',
      label: 'How do I get started with Growlio?',
      children: 'Getting started is easy! Simply sign up for an account, complete the onboarding process by providing your restaurant details, and you\'ll have access to all our analytics and management tools within minutes.',
    },
    {
      key: '2',
      label: 'What types of restaurants can use Growlio?',
      children: 'Growlio is designed for all types of food service businesses including restaurants, cafes, food trucks, catering services, and any establishment that serves food and wants to track their financial performance.',
    },
    {
      key: '3',
      label: 'How secure is my restaurant data?',
      children: 'We take data security seriously. All your information is encrypted and stored securely. We comply with industry standards and never share your data with third parties without your explicit consent.',
    },
    {
      key: '4',
      label: 'Can I integrate Growlio with my existing POS system?',
      children: 'Yes! Growlio offers integrations with most popular POS systems. Contact our support team to discuss integration options for your specific system.',
    },
    {
      key: '5',
      label: 'What kind of support do you provide?',
      children: 'We provide comprehensive support including email support, live chat, phone support, and detailed documentation. Our support team is available Monday through Friday, 9 AM to 6 PM EST.',
    },
    {
      key: '6',
      label: 'Can I cancel my subscription anytime?',
      children: 'Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. You\'ll continue to have access to your data until the end of your current billing period.',
    }
  ];

  const contactMethods = [
    {
      icon: <MailOutlined className="text-2xl text-orange-500" />,
      title: 'Email Support',
      description: 'Get detailed help via email',
      contact: 'support@growlio.com',
      action: 'Send Email',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      icon: <PhoneOutlined className="text-2xl text-orange-500" />,
      title: 'Phone Support',
      description: 'Speak directly with our team',
      contact: '+1 (555) 123-4567',
      action: 'Call Now',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      icon: <MessageOutlined className="text-2xl text-orange-500" />,
      title: 'Live Chat',
      description: 'Chat with us in real-time',
      contact: 'Available 9 AM - 6 PM EST',
      action: 'Start Chat',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <GrowlioLogo width={120} height={40} />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              How can we <span className="text-orange-500">help you?</span>
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto mb-2">
              We're here to support your restaurant's success. Get in touch with our team for any questions, 
              technical support, or guidance on maximizing your Growlio experience.
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-500 ">
              <ClockCircleOutlined />
              <span className="text-sm md:text-base">Average response time: 2 hours</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Contact Methods
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Choose your preferred way to reach us
          </h2>
          <Row gutter={[24, 24]}>
            {contactMethods.map((method, index) => (
              <Col xs={24} md={8} key={index}>
                <Card 
                  className={`h-full border-2 transition-all duration-300 cursor-pointer ${method.color}`}
                  hoverable
                >
                  <div className="text-center p-4">
                    <div className="mb-4">{method.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{method.title}</h3>
                    <p className="text-gray-600 mb-4">{method.description}</p>
                    <p className="text-lg font-medium text-gray-800 mb-4">{method.contact}</p>
                    <Button 
                      type="primary" 
                      size="large"
                      className="w-full bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600"
                    >
                      {method.action}
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div> */}

        {/* Contact Form and FAQ */}
        <Row gutter={[32, 32]}>
          {/* Contact Form */}
          <Col xs={24} lg={12}>
            <Card className="h-full shadow-lg">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <SendOutlined className="text-2xl text-orange-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Send us a message</h2>
                </div>
                <p className="text-gray-600 mb-4">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
                
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  className="space-y-4"
                >
                  <Form.Item
                    name="fullName"
                    label="Full Name"
                  >
                    <Input 
                      size="large" 
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder="Full name from your account"
                      className="rounded-lg bg-gray-50"
                      readOnly
                      disabled
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email Address"
                  >
                    <Input 
                      size="large" 
                      prefix={<MailOutlined className="text-gray-400" />}
                      placeholder="Email from your account"
                      className="rounded-lg bg-gray-50"
                      readOnly
                      disabled
                    />
                  </Form.Item>

                  <Form.Item
                    name="restaurant"
                    label="Restaurant Name"
                  >
                    <Input 
                      size="large" 
                      prefix={<EnvironmentOutlined className="text-gray-400" />}
                      placeholder="Restaurant name from your account"
                      className="rounded-lg bg-gray-50"
                      readOnly
                      disabled
                    />
                  </Form.Item>

                  <Form.Item
                    name="subject"
                    label="Subject"
                    rules={[{ required: true, message: 'Please enter a subject' }]}
                  >
                    <Input 
                      size="large" 
                      placeholder="What can we help you with?"
                      className="rounded-lg"
                    />
                  </Form.Item>

                  <Form.Item
                    name="message"
                    label="Message"
                    rules={[
                      { required: true, message: 'Please enter your message' },
                      { min: 10, message: 'Message must be at least 10 characters' }
                    ]}
                  >
                    <TextArea 
                      rows={6} 
                      placeholder="Please describe your question or issue in detail..."
                      className="rounded-lg"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      size="large"
                      loading={supportLoading}
                      className="w-full bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 rounded-lg font-semibold"
                    >
                      {supportLoading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Form.Item>
                  
                  {/* Error Display */}
                  {supportError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-red-500 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-red-800 mb-1">Error</h4>
                          <p className="text-sm text-red-700">{supportError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Success Display */}
                  {supportSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-green-500 mt-0.5">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-green-800 mb-1">Success</h4>
                          <p className="text-sm text-green-700">Your support ticket has been submitted successfully!</p>
                        </div>
                      </div>
                    </div>
                  )}
                </Form>
              </div>
            </Card>
          </Col>

          {/* FAQ Section */}
          <Col xs={24} lg={12}>
            <Card className="h-full shadow-lg">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <QuestionCircleOutlined className="text-2xl text-orange-500" />
                  <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Find quick answers to common questions about Growlio.
                </p>
                
                <Collapse 
                  accordion 
                  size="large"
                  className=""
                  items={faqData}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <style jsx>{`
        .support-faq .ant-collapse-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 12px;
        }
        
        .support-faq .ant-collapse-header {
          font-weight: 600;
          color: #374151;
        }
        
        .support-faq .ant-collapse-content-box {
          color: #6b7280;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

export default SupportPage;
