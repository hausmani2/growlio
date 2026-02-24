import React, { useState } from 'react';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Modal } from 'antd';

const Training = () => {
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);

  return (
    <div className="w-full mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-orange-600">
                Training
              </h1>
              <button
                onClick={() => setIsVideoModalVisible(true)}
                className="text-orange-600 hover:text-orange-700 transition-colors"
                title="Watch tutorial video"
                aria-label="Info about Budget Dashboard Tutorial"
              >
                <InfoCircleOutlined className="text-lg" />
              </button>
            </div>
            <p className="text-gray-600 text-lg">
              Comprehensive training resources and guides to help you master Growlio
            </p>
          </div>
        </div>
      </div>

      <div className='p-3 bg-white rounded-xl shadow-lg border border-gray-100 mb-5'>
        <div className='flex items-center justify-between gap-2'>
          <p className='font-medium text-base text-orange-600'>
            Watch a tutorial on how to create a <span className='text-purple-600'> Budget Dashboard</span>
          </p>
          <button
            onClick={() => setIsVideoModalVisible(true)}
            className="text-blue-600 hover:text-blue-800 transition-colors font-medium text-base border border-blue-600 rounded-md px-4 py-2"
            title="Watch tutorial video"
            aria-label="Watch Budget Dashboard Tutorial"
          >
            Watch Video
          </button>
        </div>
      </div>

      <Modal
        title="Weekly Budgeted Dashboard Tutorial"
        open={isVideoModalVisible}
        onCancel={() => setIsVideoModalVisible(false)}
        footer={null}
        width={900}
        centered
        destroyOnClose={true}
      >
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%' }}>
          <iframe
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0
            }}
            src="https://www.youtube.com/embed/aXUSZtOxN-k"
            title="Weekly Budgeted Dashboard Tutorial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Modal>
    </div>
  );
};

export default Training;
