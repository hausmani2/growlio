import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Input, 
  Select, 
  Collapse, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Empty, 
  Spin,
  message,
  Button,
  Alert,
  Popconfirm
} from 'antd';
import { 
  SearchOutlined, 
  QuestionCircleOutlined, 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import useStore from '../../../store/store';
import FaqAdminModal from './FaqAdminModal';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

const FaqPage = () => {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  
  // Get FAQ data and actions from store
  const {
    faqLoading,
    faqError,
    faqSuccess,
    faqCreateSuccess,
    faqUpdateSuccess,
    faqDeleteSuccess,
    faqs,
    filteredFaqs,
    searchQuery,
    selectedCategory,
    searchLoading,
    categories,
    fetchFaqs,
    setSearchQuery,
    setSelectedCategory,
    deleteFaq,
    clearFaqError,
    clearFaqSuccess,
    clearFaqCreateSuccess,
    clearFaqUpdateSuccess,
    clearFaqDeleteSuccess
  } = useStore();
  
  // Get user role for admin functionality
  const user = useStore((state) => state.user);
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN' || user?.is_staff;

  // Fetch FAQs on component mount
  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  // Clear delete success message after 3 seconds
  useEffect(() => {
    if (faqDeleteSuccess) {
      const timer = setTimeout(() => {
        clearFaqDeleteSuccess();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [faqDeleteSuccess, clearFaqDeleteSuccess]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (faqError) {
      const timer = setTimeout(() => {
        clearFaqError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [faqError, clearFaqError]);

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
  };

  const handleCreateFaq = () => {
    setEditingFaq(null);
    setIsAdminModalOpen(true);
  };

  const handleEditFaq = (faq) => {
    setEditingFaq(faq);
    setIsAdminModalOpen(true);
  };

  const handleDeleteFaq = async (faq) => {
    try {
      await deleteFaq(faq.id);
      // Success message will be shown automatically via faqDeleteSuccess state
    } catch (error) {
      console.error('Delete FAQ error:', error);
      message.error(error.message || 'Failed to delete FAQ. Please try again.');
    }
  };

  const handleModalClose = () => {
    setIsAdminModalOpen(false);
    setEditingFaq(null);
  };

  // Group FAQs by category for better organization
  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    const category = faq.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {});

  const getCategoryInfo = (categoryKey) => {
    return categories.find(cat => cat.key === categoryKey) || categories[1]; // Default to general
  };

  return (
    <div className="w-full mx-auto">
      {/* Header Section with same styling as other dashboard pages */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
          {/* Left Side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              FAQ Center
            </h1>
            <p className="text-gray-600 text-lg">
              Find answers to common questions about using Growlio for your restaurant management
            </p>
          </div>
          {/* Right Side - Admin Actions */}
          {isAdmin && (
            <div className="w-full lg:w-auto">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={handleCreateFaq}
                className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600"
              >
                Add New FAQ
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Questions</label>
              <Input
                size="large"
                placeholder="Type your question or keywords..."
                prefix={<SearchOutlined className="text-gray-400" />}
                suffix={searchLoading ? <Spin size="small" /> : null}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="rounded-lg"
              />
            </div>
          </Col>
          <Col xs={24} md={10}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
              <div className="flex gap-2">
                {/* Clear Filters Button - Show when both search and category filters are applied */}
               
                <Select
                  size="large"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="flex-1"
                  placeholder="Select a category"
                >
                  {categories.map(category => (
                    <Option key={category.key} value={category.key}>
                      <span className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                      </span>
                    </Option>
                  ))}
                </Select>
                {(searchQuery || selectedCategory !== 'all') && (
                  <Button
                    size="large"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-600 hover:text-gray-700 rounded-lg"
                    icon={<span className="text-sm">✕</span>}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </Col>
        </Row>
        
        {/* Search Results Summary */}
        {searchQuery || selectedCategory !== 'all' ? (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700">
              <SearchOutlined />
              <span className="font-medium">
                {searchLoading ? (
                  'Searching...'
                ) : (
                  <>
                    {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'} found
                    {searchQuery && ` for "${searchQuery}"`}
                    {selectedCategory !== 'all' && ` in ${categories.find(c => c.key === selectedCategory)?.label}`}
                  </>
                )}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Success Messages - Only show delete success here since create/update are handled in modal */}
      {faqDeleteSuccess && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 text-orange-700">
            <span className="text-orange-500">✓</span>
            <span className="font-medium">FAQ deleted successfully!</span>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="w-full">
        {faqLoading || searchLoading ? (
          <Card>
            <div className="text-center py-8">
              <Spin size="large" />
              <p className="mt-4 text-gray-600">
                {searchLoading ? 'Searching FAQs...' : 'Loading FAQs...'}
              </p>
            </div>
          </Card>
        ) : faqError ? (
          <Alert
            message="Error Loading FAQs"
            description={
              <div>
                <p className="mb-2">{faqError}</p>
                <Button 
                  type="primary" 
                  size="small" 
                  onClick={() => fetchFaqs()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Try Again
                </Button>
              </div>
            }
            type="error"
            icon={<QuestionCircleOutlined />}
            showIcon
            className="mb-6"
            action={
              <Button 
                size="small" 
                onClick={clearFaqError}
                type="text"
              >
                Dismiss
              </Button>
            }
          />
        ) : filteredFaqs.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <p className="text-gray-600 mb-4">
                      {searchQuery || selectedCategory !== 'all' 
                        ? "No FAQs found matching your search criteria." 
                        : "No FAQs available at the moment."
                      }
                    </p>
                    {(searchQuery || selectedCategory !== 'all') && (
                      <Button
                        type="primary"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                        }}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                }
              />
            </div>
          </Card>
        ) : (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Show FAQs grouped by category */}
            {Object.entries(groupedFaqs).map(([categoryKey, categoryFaqs]) => {
              const categoryInfo = getCategoryInfo(categoryKey);
              
              return (
                <Card key={categoryKey} className="shadow-lg">
                  <div className="mb-4">
                    <div className="flex items-center gap-1">
                      <span className="text-base">{categoryInfo.icon}</span>
                      <h3 className="text-base font-bold text-gray-800">
                        {categoryInfo.label}
                      </h3>
                      <span className="text-orange-600 font-medium">
                        ({categoryFaqs.length} {categoryFaqs.length === 1 ? 'question' : 'questions'})
                      </span>
                    </div>
                  </div>
                  
                  <Collapse
                    accordion
                    size="small"
                    items={categoryFaqs.map(faq => ({
                      key: faq.id,
                      label: (
                        <div className="flex items-center justify-between w-full ">
                          <span className="font-semibold text-gray-800">
                            {faq.question}
                          </span>
                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditFaq(faq);
                                }}
                                className="text-blue-500 hover:text-blue-700"
                              />
                              <Popconfirm
                                title="Delete FAQ"
                                description={`Are you sure you want to delete "${faq.question}"?`}
                                onConfirm={(e) => {
                                  e?.stopPropagation();
                                  handleDeleteFaq(faq);
                                }}
                                okText="Yes, Delete"
                                cancelText="Cancel"
                                okButtonProps={{ 
                                  danger: true,
                                  className: "bg-red-500 hover:bg-red-600"
                                }}
                              >
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<DeleteOutlined />}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-red-500 hover:text-red-700"
                                />
                              </Popconfirm>
                            </div>
                          )}
                        </div>
                      ),
                      children: (
                        <div className="text-gray-700 leading-relaxed p-2">
                          {faq.answer}
                        </div>
                      )
                    }))}
                  />
                </Card>
              );
            })}
          </Space>
        )}
      </div>

      {/* Admin Modal */}
      {isAdmin && (
        <FaqAdminModal
          open={isAdminModalOpen}
          onClose={handleModalClose}
          faq={editingFaq}
        />
      )}

      <style jsx>{`
        .faq-collapse .ant-collapse-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 12px;
        }
        
        .faq-collapse .ant-collapse-header {
          font-weight: 600;
          color: #374151;
        }
        
        .faq-collapse .ant-collapse-content-box {
          color: #6b7280;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

export default FaqPage;
