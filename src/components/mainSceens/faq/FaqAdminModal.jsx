import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Button, 
  message,
  Space,
  Alert
} from 'antd';
import { SaveOutlined, CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import useStore from '../../../store/store';

const { TextArea } = Input;
const { Option } = Select;

const FaqAdminModal = ({ open, onClose, faq }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const successMessageShown = useRef(false);
  
  // Get FAQ actions from store
  const {
    createFaq,
    updateFaq,
    categories,
    faqError,
    faqCreateSuccess,
    faqUpdateSuccess,
    clearFaqError,
    clearFaqCreateSuccess,
    clearFaqUpdateSuccess
  } = useStore();

  // Set form values when modal opens or faq changes
  useEffect(() => {
    if (open) {
      // Clear any previous errors and reset success message flag
      setValidationErrors({});
      clearFaqError();
      successMessageShown.current = false;
      
      if (faq) {
        // Editing existing FAQ
        form.setFieldsValue({
          question: faq.question,
          answer: faq.answer,
          category: faq.category || 'general'
        });
      } else {
        // Creating new FAQ
        form.resetFields();
        form.setFieldsValue({
          category: 'general'
        });
      }
    }
  }, [open, faq, form, clearFaqError]);

  // Handle success messages
  useEffect(() => {
    
    if (faqCreateSuccess && !saving && !faq && !successMessageShown.current) {
      successMessageShown.current = true;
      message.success('FAQ created successfully!');
      
      // Close modal after a short delay to ensure message is visible
      setTimeout(() => {
        clearFaqCreateSuccess();
        successMessageShown.current = false;
        onClose();
      }, 1000);
    }
    
    if (faqUpdateSuccess && !saving && faq && !successMessageShown.current) {
      successMessageShown.current = true;
      message.success('FAQ updated successfully!');
      
      // Close modal after a short delay to ensure message is visible
      setTimeout(() => {
        clearFaqUpdateSuccess();
        successMessageShown.current = false;
        onClose();
      }, 1000);
    }
  }, [faqCreateSuccess, faqUpdateSuccess, saving, faq, clearFaqCreateSuccess, clearFaqUpdateSuccess, onClose]);

  // Handle error message
  useEffect(() => {
    if (faqError && !saving) {
      message.error(faqError);
      clearFaqError();
    }
  }, [faqError, saving, clearFaqError]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setValidationErrors({});
      
      // Validate form fields
      const values = await form.validateFields();
      
      // Additional validation
      if (!values.question?.trim()) {
        throw new Error('Question is required');
      }
      if (!values.answer?.trim()) {
        throw new Error('Answer is required');
      }
      if (!values.category) {
        throw new Error('Category is required');
      }
      
      // Prepare data
      const faqData = {
        question: values.question.trim(),
        answer: values.answer.trim(),
        category: values.category
      };
      
      if (faq) {
        // Update existing FAQ
        await updateFaq(faq.id, faqData);
      } else {
        // Create new FAQ
        await createFaq(faqData);
      }
      
    } catch (error) {
      console.error('FAQ submission error:', error);
      
      if (error.errorFields) {
        // Form validation errors
        const errors = {};
        error.errorFields.forEach(field => {
          errors[field.name[0]] = field.errors[0];
        });
        setValidationErrors(errors);
        message.error('Please correct the highlighted fields');
      } else if (error.message) {
        // Custom validation or API errors
        message.error(error.message);
      } else {
        // Generic error
        message.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setValidationErrors({});
    clearFaqError();
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <SaveOutlined className="text-orange-500" />
          <span>{faq ? 'Edit FAQ' : 'Create New FAQ'}</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      width={600}
      footer={null}
      className="faq-admin-modal"
    >
      {/* Error Alert */}
      {Object.keys(validationErrors).length > 0 && (
        <Alert
          message="Please fix the following errors:"
          description={
            <ul className="list-disc list-inside mt-2">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field} className="text-sm">{error}</li>
              ))}
            </ul>
          }
          type="error"
          icon={<ExclamationCircleOutlined />}
          className="mb-4"
          showIcon
        />
      )}

      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        onFinish={handleSubmit}
        validateTrigger="onBlur"
      >
        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select
            size="large"
            placeholder="Select a category"
            className="rounded-lg"
          >
            {categories.filter(cat => cat.key !== 'all').map(category => (
              <Option key={category.key} value={category.key}>
                <span className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                </span>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="question"
          label="Question"
          rules={[
            { required: true, message: 'Please enter a question' },
            { min: 10, message: 'Question must be at least 10 characters' },
            { max: 200, message: 'Question must be less than 200 characters' }
          ]}
          validateStatus={validationErrors.question ? 'error' : ''}
          help={validationErrors.question}
        >
          <Input
            size="large"
            placeholder="Enter the FAQ question..."
            className="rounded-lg"
            showCount
            maxLength={200}
          />
        </Form.Item>

        <Form.Item
          name="answer"
          label="Answer"
          rules={[
            { required: true, message: 'Please enter an answer' },
            { min: 15, message: 'Answer must be at least 20 characters' },
            { max: 1000, message: 'Answer must be less than 1000 characters' }
          ]}
          validateStatus={validationErrors.answer ? 'error' : ''}
          help={validationErrors.answer}
        >
          <TextArea
            rows={6}
            placeholder="Enter the detailed answer..."
            className="rounded-lg"
            showCount
            maxLength={1000}
          />
        </Form.Item>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            size="large"
            onClick={handleCancel}
            icon={<CloseOutlined />}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={saving}
            icon={<SaveOutlined />}
            className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 rounded-lg"
          >
            {saving ? 'Saving...' : (faq ? 'Update FAQ' : 'Create FAQ')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default FaqAdminModal;
