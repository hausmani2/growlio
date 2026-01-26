import React from 'react';
import { Link } from 'react-router-dom';
import { BookOutlined, ClockCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { Card } from 'antd';

const Training = () => {
  return (
    <div className="w-full mx-auto">
      {/* Header Section - Matching application design pattern */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
          {/* Left Side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-orange-600 mb-2">
              Training
            </h1>
            <p className="text-gray-600 text-lg">
              Comprehensive training resources and guides to help you master Growlio
            </p>
          </div>
        </div>
      </div>

      {/* In Process Message Card */}
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-2xl shadow-lg border border-gray-100">
          <div className="text-center py-8 px-4">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FFF4ED' }}
              >
                <BookOutlined 
                  className="text-5xl"
                  style={{ color: '#FF8132' }}
                />
              </div>
            </div>

            {/* Main Message */}
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Training Center Coming Soon
            </h2>
            
            <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
              We're working hard to bring you comprehensive training materials, 
              video tutorials, and interactive guides to help you get the most out of Growlio.
            </p>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-orange-200 px-6 py-3 rounded-lg border border-orange-300 mb-8">
              <ClockCircleOutlined className="text-orange-600 text-xl" />
              <span className="text-orange-800 font-semibold text-base">
                In Development
              </span>
            </div>

            {/* Features Preview */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                What to Expect
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <RocketOutlined className="text-orange-500 text-xl mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Quick Start Guides</h3>
                    <p className="text-sm text-gray-600">
                      Step-by-step tutorials to get you started
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <BookOutlined className="text-orange-500 text-xl mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Video Tutorials</h3>
                    <p className="text-sm text-gray-600">
                      Visual guides for all features
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <ClockCircleOutlined className="text-orange-500 text-xl mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Best Practices</h3>
                    <p className="text-sm text-gray-600">
                      Tips and tricks from experts
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Need help in the meantime?
              </p>
              <p className="text-sm text-gray-700">
                Visit our <Link to="/dashboard/support" className="text-orange-600 hover:text-orange-700 font-semibold underline">Support Center</Link> or 
                {' '}<Link to="/dashboard/chat" className="text-orange-600 hover:text-orange-700 font-semibold underline">Chat with LIO AI</Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Training;